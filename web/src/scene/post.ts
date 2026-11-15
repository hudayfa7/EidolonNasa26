// The HDR pipeline (plan, Rendering and shaders): the globes render in linear HDR into half-float buffers; one effect
// then adds bloom and the lens flare, tone maps (AgX), grades and lays the grounds the CSS drew behind the old
// transparent canvas (shaders/finish.frag.glsl); the terrain blocks render after it (their ramps are design tokens, so
// they skip the tone map); SMAA and the title's grain go last, to the screen. The canvas itself is opaque.
import * as THREE from 'three';
import { BlendFunction, BloomEffect, CopyPass, Effect, EffectComposer, EffectPass, NoiseEffect, Pass, SMAAEffect } from 'postprocessing';
import { ORDER } from '../data/bodies';
import { CAPTURE, RM } from '../motion';
import { drawTerrain } from '../terrain/mesh';
import { bodies } from './bodies';
import { H, token, W } from './layout';
import { LITE, renderer, sys } from './renderer';
import { VPS, type Rect } from './rig';
import { stars } from './stars';
import FINISH from './shaders/finish.frag.glsl?raw';

/** Set each frame by scene/frame.ts: the title ground's and the dive sky's weights, the title sun on screen (uv), its
 *  flare's strength and its streak's share, the grain's opacity, and the light's direction on screen (x right, y down)
 *  for the stage's warm glow. */
export const FX = { title: 0, sky: 0, sunX: .5, sunY: .5, flare: 0, streak: 1, grain: 0, warmX: -1, warmY: 0 };

// Rendering to half floats needs EXT_color_buffer_float (or _half_float): without it, 8-bit buffers, so the page still
// draws (the suns and the bloom lose their headroom) rather than an incomplete framebuffer's black.
function HDR() { return renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'); }

let rects: Rect[] = [];
// Viewport i of the current layout, rect in CSS px, as the buffer's pixels (its edges are on them: rig.ts computeRects).
function viewport(rt: THREE.WebGLRenderTarget, r: Rect) {
  const pr = renderer.getPixelRatio(), x = Math.round(r.x * pr), w = Math.round(r.w * pr), h = Math.round(r.h * pr), y = rt.height - Math.round(r.y * pr) - h;
  rt.viewport.set(x, y, w, h); rt.scissor.set(x, y, w, h); rt.scissorTest = true;
}
// Renders the globe ('sys') or terrain viewports into the buffer the pipeline is on. Globes start from a cleared,
// transparent buffer (alpha: what the bodies cover); terrain draws over the finished frame, its own depth cleared.
class ViewportPass extends Pass {
  constructor(private kind: 'sys' | 'terrain') { super(`${kind} viewports`); this.needsSwap = false; }
  render(_r: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget) {
    if (this.kind === 'sys') { renderer.setRenderTarget(rt); renderer.clear(); }
    for (let i = 0; i < rects.length; i++) {
      const vp = VPS[i]; if (vp.kind !== this.kind) continue;
      viewport(rt, rects[i]); renderer.setRenderTarget(rt);
      if (vp.kind === 'terrain') { drawTerrain(renderer, i, vp.cam); continue; }
      for (const id of ORDER) bodies[id].root.visible = bodies[id].alpha > .004 && (!vp.only || vp.only === id);
      stars.position.copy(vp.cam.position); stars.quaternion.copy(vp.starQ); renderer.render(sys, vp.cam);
    }
    rt.viewport.set(0, 0, rt.width, rt.height); rt.scissorTest = false;
  }
}

// Bloom on what passes 1.0 (the suns, the backlit limb), sampled by the finish rather than blended (BlendFunction.DST
// keeps it out of the shader but still updates it): blending would raise alpha round every glow and hide the grounds.
const bloom = new BloomEffect({ luminanceThreshold: .9, luminanceSmoothing: .4, intensity: 1, levels: LITE ? 5 : 8, radius: .6 });
bloom.blendMode.blendFunction = BlendFunction.DST;
// Phones bloom at half the resolution (its mip chain starts a level down, so one level fewer spans the same glow).
if (LITE) { const set = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => set(Math.ceil(w / 2), Math.ceil(h / 2)); }
const U = (v: unknown) => new THREE.Uniform(v);
const srgb = (css = '#000') => new THREE.Color().setStyle(css, THREE.LinearSRGBColorSpace);   // raw sRGB values, no conversion
// The grounds' colours (tokens.css): the stage's, under its warm and cool glows; the title's top, middle and bottom, its
// teal glow and the coral one.
const tokens = (...k: string[]) => k.map(n => srgb(token(`--${n}`)));
const finish = new Effect('Finish', FINISH, { uniforms: new Map<string, THREE.Uniform>([
  ['stageC', U(tokens('bg', 'glow-warm', 'glow-cool'))], ['titleC', U(tokens('title-top', 'title-mid', 'title-bot', 'title-teal', 'coral'))],
  ['bloomTex', U(bloom.texture)], ['bloomK', U(.25)], ['exposure', U(.9)], ['sat', U(1.1)],
  ['title', U(0)], ['sky', U(0)], ['skyA', U(srgb())], ['skyB', U(srgb())], ['skyC', U(srgb())],
  ['sunUV', U(new THREE.Vector2())], ['flare', U(0)], ['streak', U(1)], ['warm', U(new THREE.Vector2(-1, 0))],
]) });
const fu = finish.uniforms;
const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY });

// The end of the pipeline, over the globes and the terrain alike (tone-mapped linear by then). First the terrain swap's
// crossfade (router.ts crossfade): the frame before the swap (`held`, kept at half size by holdFrame) fading out over the
// new one. Then the detection grade: a duotone in the dived site's palette over what the bodies and blocks cover (alpha,
// left by the finish and written by the blocks), so the grounds and the dive's sky keep their colours.
// 8 bits are enough for tone-mapped values; stored as sRGB, so the darks don't band.
const held = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, colorSpace: THREE.SRGBColorSpace, depthBuffer: false });
const hold = new CopyPass(held, false);
const grade = new Effect('Grade', `uniform sampler2D held; uniform float xf, duo; uniform vec3 duoA, duoB, duoC;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec4 f=xf>0.0?mix(inputColor,texture2D(held,uv),xf):inputColor; vec3 c=f.rgb;
  if(duo>0.0){ float t=clamp(pow(dot(c,vec3(0.2126,0.7152,0.0722))*2.2,0.55),0.0,1.0); c=mix(c,t<0.5?mix(duoA,duoB,t*2.0):mix(duoB,duoC,t*2.0-1.0),duo*clamp(f.a,0.0,1.0)); }
  outputColor=vec4(c,f.a);
}`, { uniforms: new Map<string, THREE.Uniform>([['held', U(held.texture)], ['xf', U(0)], ['duo', U(0)],
  ['duoA', U(new THREE.Color())], ['duoB', U(new THREE.Color())], ['duoC', U(new THREE.Color())]]) });
const gu = grade.uniforms;
/** The crossfade's weight of the held frame, 1 to 0 (router.ts crossfade tweens it). */
export const XF = { k: 0 };

/** The dive's grade (--grade-*: shadows, mids, highlights) and sky (--sky-*, a CSS linear gradient's three stops). */
export function setGrade(grade: string[], sky: string) {
  ['duoA', 'duoB', 'duoC'].forEach((k, i) => gu.get(k)!.value.set(grade[i]));
  (sky.match(/#[0-9a-f]{6}/gi) ?? []).forEach((c, i) => fu.get(['skyA', 'skyB', 'skyC'][i])!.value.setStyle(c, THREE.LinearSRGBColorSpace));
}

if (!HDR()) console.warn('no float colour buffers: rendering without HDR headroom');
const composer = new EffectComposer(renderer, { frameBufferType: HDR() ? THREE.HalfFloatType : THREE.UnsignedByteType });
composer.addPass(new ViewportPass('sys'));
composer.addPass(new EffectPass(VPS[0].cam, bloom, finish));
composer.addPass(new ViewportPass('terrain'));
// SMAA works on the tone-mapped frame. Phones skip it: their pixels are dense, and the GPU is the budget's tightest.
// Dithered (±.5 of an 8-bit level, from the pixel position) on every view: smooth glows band at 8 bits otherwise.
const last = new EffectPass(VPS[0].cam, grade, ...(LITE ? [] : [new SMAAEffect()]), grain);
last.dithering = true;
composer.addPass(last);
const size = new THREE.Vector2();

/** Compiles every program before the opening, under the poster. The scene's for the pipeline's linear buffer (three
 *  keys a program on the output colour space, so the canvas variants would compile again on the first frame) and for
 *  both sides of the atmospheres (back faces from inside the intro's air, scene/bodies.ts); then the pipeline's own
 *  (bloom, finish, SMAA, grain), by running it once with no viewports. */
export async function precompile(cam: THREE.Camera) {
  const atmos = ORDER.flatMap(id => bodies[id].mats.slice(1));
  renderer.setRenderTarget(composer.inputBuffer);
  try {
    for (const side of [THREE.BackSide, THREE.FrontSide]) { for (const m of atmos) m.side = side; await renderer.compileAsync(sys, cam); }
  } finally { renderer.setRenderTarget(null); }
  rects = []; composer.render(0);
}

/** Renders the frame through the pipeline: viewports R (scene/rig.ts computeRects), dt seconds since the last. */
export function renderPost(R: Rect[], dt: number, duo: number) {
  rects = R;
  renderer.getDrawingBufferSize(size);
  if (size.x !== composer.inputBuffer.width || size.y !== composer.inputBuffer.height) composer.setSize(W, H);
  fu.get('title')!.value = FX.title; fu.get('sky')!.value = FX.sky; gu.get('duo')!.value = duo; gu.get('xf')!.value = XF.k;
  fu.get('sunUV')!.value.set(FX.sunX, FX.sunY); fu.get('flare')!.value = FX.flare; fu.get('streak')!.value = FX.streak; fu.get('warm')!.value.set(FX.warmX, FX.warmY);
  fu.get('bloomTex')!.value = bloom.texture;
  grain.blendMode.opacity.value = FX.grain;
  composer.render(CAPTURE || RM ? 0 : dt);   // the grain's pattern moves with time; under ?capture or reduced motion it holds still
}

/** The frame as it stands, drawn now and held for the terrain swap's crossfade (router.ts crossfade): the pipeline's last
 *  input (the finished globes, the terrain over them; graded as the live frame is), at half size. */
export function holdFrame(R: Rect[], duo: number) {
  renderPost(R, 0, duo);
  // The composer swaps its buffers in a local: the last pass's input is the one it calls its output (the finish's).
  const b = composer.outputBuffer;
  held.setSize(Math.ceil(b.width / 2), Math.ceil(b.height / 2));
  hold.render(renderer, b, null);
  renderer.setRenderTarget(null);
}
/** The held frame's buffer let go once its crossfade ends (2.5 MB at most: a quarter of the 2.5 M-pixel buffer, 4 bytes each). */
export const releaseFrame = () => held.setSize(1, 1);
