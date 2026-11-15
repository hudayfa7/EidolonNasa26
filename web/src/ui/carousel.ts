// Footer art on the title's credits (prototype 2178–2268): four Bayer-dithered steps (the mark, Earth, out to the system,
// then a target linked to its doubles), 3.8/3.8/4.2/5.2 s with a .8 s dissolve, redrawn at about 15 fps while the
// footer is on screen. It runs on the app clock from load, as the prototype did on GSAP's, not from when it appears.
// The dots are one dither shader on a quad (a WebGL context of its own under the art's 2D canvas, which keeps the
// lines): each step adds its layers (spheres, the mark) and the shader composites them per dot, as the canvas did.
import * as THREE from 'three';
import { alphaBox } from '../brand/alpha-box';
import { logoImg } from '../brand/brand';
import { smooth } from '../coords';
import { BODIES } from '../data/bodies';
import { SITES } from '../data/sites';
import { $, $$ } from '../dom';
import { CAPTURE, MOTION, onUpdate, RM } from '../motion';
import { state } from '../router';
import { ALB, type GMap } from '../terrain/sample';

const dith = $<HTMLCanvasElement>('#dither'), dg = dith.getContext('2d')!, dotsC = $<HTMLCanvasElement>('#dots'), foot = $('#tfoot'), capN = $('#ac-n'), capS = $('#ac-s');
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const CAPS = [['Eidolon', 'The Moon and Mars, on Earth'], ['Earth', `${SITES.earth.length} established analog sites`], ['Solar system', 'Pick a site'], ['Mars to Earth', 'Jezero Crater to Lake Salda']];
const STEPS = MOTION.footer, TOTAL = STEPS.reduce((a, s) => a + s, 0), XF = MOTION.dissolve;
let PITCH = 3, CW = 0, CH = 0, artT = 0, artCap = -1;

/* ---------- The dots: the layers of a frame, then one shader pass ---------- */
// Per dot (square, .72 of the pitch, at the pitch's grid): each layer's value at the dot's centre against the 4×4 Bayer
// matrix, the layers composited in order. A sphere: its world's albedo (terrain/sample.ts ALB, 512 px) lit from the
// upper left, its limb brightened, a halo outside; or a glow (the sun). The mark: its raster's alpha developing by ink.
const MAX = 8, MAPS = ['earth', 'moon', 'mars'] as const;
const FS = `uniform vec2 res; uniform float dpr, pitch; uniform int n, logoAt; uniform vec4 sA[${MAX}], sB[${MAX}], sC[${MAX}];
uniform sampler2D m0, m1, m2, logo; uniform vec3 lon0; uniform vec4 logoBox; uniform vec2 logoK; uniform float logoA;
const float BAY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
const vec3 L = vec3(-.62,.38,.69);
float alb(int m, float lat, float lon){
  vec2 t = vec2((lon - lon0[m]) / 360., (90. - lat) / 180.);
  return m == 0 ? texture2D(m0, t).r : m == 1 ? texture2D(m1, t).r : texture2D(m2, t).r;
}
// sA: centre x, y and radius (CSS px), halo; sB: turn (radians), glow, map (-1: none), limb brightening
float sphere(int i, vec2 q){
  vec4 a = sA[i], b = sB[i]; vec2 d2 = (q - a.xy) / a.z; float d = dot(d2, d2);
  if (d > 1.) { if (a.w <= 0.) return -1.; float k = (sqrt(d) - 1.) / a.w; return k > 1. ? -1. : .5 * (1. - k) * (1. - k); }
  float z = sqrt(1. - d), sh = max(0., d2.x * L.x - d2.y * L.y + z * L.z);
  if (b.y > .5) return .55 + .45 * z;
  float al = b.z >= 0. ? alb(int(b.z), degrees(asin(-d2.y)), degrees(atan(d2.x, z) + b.x)) : .5;
  return al * 1.35 * (.08 + .92 * sh) + .35 * pow(1. - z, 3.) * b.w;
}
vec4 over(vec4 acc, vec3 c, float a){ return vec4(c * a, a) + acc * (1. - a); }   // premultiplied
void main(){
  vec2 p = vec2(gl_FragCoord.x, res.y * dpr - gl_FragCoord.y) / dpr, c = floor(p / pitch + .5), q = c * pitch;
  float h = pitch * .36, e = .5 / dpr; vec2 o = clamp(min(q + h, p + e) - max(q - h, p - e), 0., 2. * e) / (2. * e);
  float cov = o.x * o.y; if (cov <= 0.) discard;   // the dot's share of this pixel, as the canvas's fillRect antialiased it
  float th = (BAY[int(mod(c.y, 4.)) * 4 + int(mod(c.x, 4.))] + .5) / 16.;
  vec4 acc = vec4(0.);
  for (int i = 0; i <= ${MAX}; i++) {
    if (i == logoAt) {
      vec2 lc = c - logoBox.xy;
      if (all(greaterThanEqual(lc, vec2(0.))) && all(lessThan(lc, logoBox.zw))) {
        vec4 t = texelFetch(logo, ivec2(lc), 0); bool coral = (t.r - t.b) * 255. > 70.;
        if (t.a * (coral ? logoK.y : logoK.x) > th) acc = over(acc, coral ? vec3(.949, .533, .373) : vec3(.863, .902, .933), logoA * cov);
      }
    }
    if (i >= n) break;
    if (sphere(i, q) > th) acc = over(acc, sC[i].rgb, sC[i].a * cov);
  }
  gl_FragColor = acc;
}`;
const blankMap = new THREE.DataTexture(new Uint8Array([128]), 1, 1, THREE.RedFormat); blankMap.needsUpdate = true;
const U = { res: { value: new THREE.Vector2() }, dpr: { value: 1 }, pitch: { value: 3 }, n: { value: 0 }, logoAt: { value: -1 },
  sA: { value: [...Array(MAX)].map(() => new THREE.Vector4()) }, sB: { value: [...Array(MAX)].map(() => new THREE.Vector4()) }, sC: { value: [...Array(MAX)].map(() => new THREE.Vector4()) },
  m0: { value: blankMap }, m1: { value: blankMap }, m2: { value: blankMap }, lon0: { value: new THREE.Vector3(...MAPS.map(k => BODIES[k].lon0)) },
  logo: { value: blankMap as THREE.Texture }, logoBox: { value: new THREE.Vector4() }, logoK: { value: new THREE.Vector2() }, logoA: { value: 0 } };
// The context, made when the art first draws; null if the browser gives none (its contexts used up): the steps keep their
// captions and lines, without dots.
let gl: THREE.WebGLRenderer | null | undefined, quad: THREE.Mesh;
const cam = new THREE.Camera(), quadScene = new THREE.Scene();
function dotsGL() {
  if (gl !== undefined) return gl;
  try {
    gl = new THREE.WebGLRenderer({ canvas: dotsC, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: CAPTURE });
    gl.setClearColor(0, 0);
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FS, depthTest: false }));
    quadScene.add(quad);
  } catch { console.warn('footer art: no WebGL context for its dots'); gl = null; }
  return gl;
}
const mapTex = new WeakMap<GMap, THREE.DataTexture>();
function albTex(M: GMap) {
  let t = mapTex.get(M);
  if (!t) { t = new THREE.DataTexture(M.d, M.w, M.h, THREE.RedFormat); t.wrapS = THREE.RepeatWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; mapTex.set(M, t); }
  return t;
}
const rgb = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);   // raw sRGB: the canvas composited in sRGB
let nL = 0;
interface Sphere { id?: 'earth' | 'moon' | 'mars'; x: number; y: number; r: number; col: string; rot?: number; halo?: number; glow?: boolean }
function dotSphere(s: Sphere, alpha: number) {
  if (alpha <= .01 || s.r < 1 || nL >= MAX) return;
  const m = s.id && ALB[s.id] ? MAPS.indexOf(s.id) : -1, c = rgb(s.col);
  if (m >= 0) U[`m${m}` as 'm0'].value = albTex(ALB[s.id!]!);
  U.sA.value[nL].set(s.x, s.y, s.r, s.halo || 0); U.sB.value[nL].set(s.rot ?? 0, s.glow ? 1 : 0, m, s.id === 'earth' ? 1 : .4); U.sC.value[nL].set(c.r, c.g, c.b, alpha);
  nL++;
}
// The mark (src/brand/logo.svg), rasterised once per size, then dithered in two inks: its coral parts as coral dots,
// the rest light. Its inked box (not its viewBox) fits within .62 of the columns and .84 of the rows (the height of
// step 2's Earth), centred. The dots develop in Bayer order from the start of the dissolve in, the light ones first,
// then the coral double.
// shortcut: two inks, coral picked by hue; a final logo in more colours needs an ink per colour here.
const logoOff = document.createElement('canvas'), lgx = logoOff.getContext('2d', { willReadFrequently: true })!;
let logoW = 0, logoH = 0, logoBox: number[] | null = null;
// A canvas the SVG tainted (old WebKit) can't be read: the step keeps its caption and shows no dots.
const readLogo = (w: number, h: number) => { try { return lgx.getImageData(0, 0, w, h).data; } catch { return new Uint8ClampedArray(w * h * 4); } };
function dotLogo(t: number, alpha: number) {
  if (alpha <= .01 || !logoImg.complete || !logoImg.naturalWidth) return;
  const W = logoImg.naturalWidth, H = logoImg.naturalHeight, cols = Math.floor(CW / PITCH), rows = Math.floor(CH / PITCH);
  if (!logoBox) { logoOff.width = W; logoOff.height = H; lgx.drawImage(logoImg, 0, 0); logoBox = alphaBox(readLogo(W, H), W, H); }
  const [bx, by, bw, bh] = logoBox, s = Math.min(cols * .62 / bw, rows * .84 / bh), w = Math.round(bw * s), h = Math.round(bh * s);
  if (logoW !== w || logoH !== h) {
    logoW = logoOff.width = w; logoH = logoOff.height = h; lgx.drawImage(logoImg, -bx * s, -by * s, W * s, H * s);
    if (U.logo.value !== blankMap) U.logo.value.dispose();
    const tx = U.logo.value = new THREE.DataTexture(new Uint8Array(readLogo(w, h)), w, h); tx.needsUpdate = true;
  }
  U.logoAt.value = nL; U.logoBox.value.set(Math.floor((cols - w) / 2), Math.floor((rows - h) / 2), w, h);
  U.logoK.value.set(smooth(0, 1.2, t + XF), smooth(.5, 1.7, t + XF)); U.logoA.value = alpha;   // t is negative while step 4 dissolves into this one
}
const SYS: (Omit<Sphere, 'x' | 'y' | 'r'> & { px: number; r: number; dy?: number })[] = [{ id: 'moon', px: .45, r: .03, dy: -.13, col: '#C9CCD2' }, { id: 'mars', px: .72, r: .068, col: '#F2885F' }];
function artScene(i: number, lt: number, a: number) {
  const w = CW, h = CH;
  if (i === 0) return dotLogo(lt, a);
  if (i === 1) return dotSphere({ id: 'earth', x: w * .5, y: h * .5, r: h * .42, rot: lt * .35, col: '#DCE6EE', halo: .14 }, a);
  if (i === 2) {
    const p = smooth(0, 1.9, lt), sunX = -w * .04, sy = h * .56;
    dotSphere({ x: sunX, y: sy, r: h * .3, col: '#F2C9A0', glow: true, halo: .35 }, a * p);
    dg.globalAlpha = a * p * .55; dg.strokeStyle = '#8FA3B5'; dg.setLineDash([1.5, 4]); dg.lineWidth = 1;
    for (const x of [.34, .72]) { const rx = w * x - sunX; dg.beginPath(); dg.ellipse(sunX, sy, rx, rx * .5, 0, -.5, .5); dg.stroke(); }
    dg.setLineDash([]);
    const ps: Sphere[] = [...SYS.map(b => ({ ...b, x: w * b.px, y: sy + (b.dy || 0) * h, r: h * b.r, rot: lt * .3 })),
      { id: 'earth', x: w * (.5 - .16 * p), y: h * (.5 + .06 * p), r: h * (.42 - .32 * p), rot: lt * .35, col: '#DCE6EE', halo: .14 }];
    // The worlds draw over their orbits: the lines (on the canvas above the dots) fade where a world's disc is, by the
    // share its dots cover (.72², at its alpha), as when the dots drew over them.
    dg.globalCompositeOperation = 'destination-out';
    ps.forEach((b, k) => { dg.globalAlpha = .52 * (k < SYS.length ? a * p : a); dg.beginPath(); dg.arc(b.x, b.y, b.r, 0, Math.PI * 2); dg.fill(); });
    dg.globalCompositeOperation = 'source-over';
    ps.forEach((b, k) => dotSphere(b, k < SYS.length ? a * p : a));
    return;
  }
  const E: Sphere = { id: 'earth', x: w * .27, y: h * .5, r: h * .33, rot: lt * .25, col: '#DCE6EE', halo: .14 }, Mr: Sphere = { id: 'mars', x: w * .74, y: h * .5, r: h * .26, rot: lt * .25 + 2, col: '#F2885F', halo: .06 };
  dotSphere(E, a); dotSphere(Mr, a);
  const links = [[-.55, -.4, .5, -.35], [-.7, .08, .6, .12], [-.45, .5, .42, .55]];
  dg.lineWidth = 1.3; dg.setLineDash([2, 5]); dg.lineDashOffset = -lt * 26;
  links.forEach(([mx, my, ex, ey], k) => {
    const rv = smooth(.4 + k * .35, 1.7 + k * .35, lt); if (rv <= 0) return;
    const x0 = Mr.x + mx * Mr.r, y0 = Mr.y + my * Mr.r, x1 = E.x + ex * E.r, y1 = E.y + ey * E.r, cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - h * (.18 + k * .06);
    dg.globalAlpha = a * .9; dg.strokeStyle = '#F2885F'; dg.beginPath(); dg.moveTo(x0, y0);
    for (let n = 1; n <= 24; n++) { const t = n / 24 * rv, u = 1 - t; dg.lineTo(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1); }
    dg.stroke();
    dg.setLineDash([]); dg.fillStyle = '#F2885F'; dg.beginPath(); dg.arc(x0, y0, 3, 0, Math.PI * 2); dg.fill();
    if (rv > .98) { dg.fillStyle = '#FFFFFF'; dg.beginPath(); dg.arc(x1, y1, 3, 0, Math.PI * 2); dg.fill(); }
    dg.setLineDash([2, 5]);
  });
  dg.setLineDash([]); dg.lineDashOffset = 0;
}
function drawArt(time: number) {
  CW = dith.clientWidth; CH = dith.clientHeight; if (!CW || !ALB.earth) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (dith.width !== Math.round(CW * dpr) || dith.height !== Math.round(CH * dpr)) { dith.width = Math.round(CW * dpr); dith.height = Math.round(CH * dpr); }
  dg.setTransform(dpr, 0, 0, dpr, 0, 0); dg.clearRect(0, 0, CW, CH); PITCH = CW > 600 ? 3 : 2.5;
  nL = 0; U.logoAt.value = -1;
  let tt = time % TOTAL, i = 0; while (tt > STEPS[i]) { tt -= STEPS[i]; i++; }
  const left = STEPS[i] - tt, f = left < XF ? 1 - left / XF : 0, j = (i + 1) % STEPS.length;
  // Reduced motion: each step is a still frame, its moves finished (2.5 s in), and only the dissolve remains.
  const lt = (t: number) => RM ? 2.5 : t;
  artScene(i, lt(tt), 1 - f); if (f > 0) artScene(j, lt(-left), f);
  dg.globalAlpha = 1;
  const r = dotsGL();
  if (r) {
    // Resized only when its size changes: setting a canvas's size, even to the same, reallocates its buffer.
    if (r.getPixelRatio() !== dpr || U.res.value.x !== CW || U.res.value.y !== CH) { r.setPixelRatio(dpr); r.setSize(CW, CH, false); U.res.value.set(CW, CH); }
    U.dpr.value = r.getPixelRatio(); U.pitch.value = PITCH; U.n.value = nL;
    r.render(quadScene, cam);
  }
  const cur = f > .5 ? j : i;
  if (cur !== artCap) { artCap = cur; capN.textContent = CAPS[cur][0]; capS.textContent = CAPS[cur][1]; $$('.steps i').forEach((el, n) => el.classList.toggle('on', n === cur)); }
}

// Where the credits footer sits in the scrolling title, read at the start of each tick (layout is still clean then).
// Fully up, it hides the stage, so the 3D render can pause.
let footTop = Infinity;
export const footerCovers = () => state.view === 'title' && footTop <= 0;
onUpdate(time => {
  footTop = state.view === 'title' ? foot.getBoundingClientRect().top : Infinity;
  if (footTop < innerHeight && time - artT > .066) { artT = time; drawArt(time); }
});
