// Renderer, texture cache and sprite helpers (prototype 897–916). Colour managed: maps decode from sRGB, shaders output
// linear HDR into the post-processing pipeline (scene/post.ts), which tone maps and encodes once.
import * as THREE from 'three';
import { CAPTURE } from '../motion';

export let renderer!: THREE.WebGLRenderer;   // set by initRenderer(); the scene is only imported once it succeeds
/** A phone or tablet: the lighter path (fewer atmosphere samples, no SMAA at its high pixel density, bloom at half
 *  resolution, terrain meshes of 128 samples a side, the 2K colour maps). */
export const LITE = matchMedia('(pointer: coarse) and (max-width: 1024px)').matches;

// An opaque canvas without MSAA: the composer renders into its own buffers (SMAA instead) and draws the grounds the CSS
// used to (scene/post.ts). False without WebGL2, tested first on a scratch canvas so a missing context isn't logged as
// an error by three.
export function initRenderer() {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return false;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  try {
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector<HTMLCanvasElement>('#gl')!, antialias: false, alpha: false,
      depth: false, stencil: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
  } catch {
    return false;
  }
  // Lost stays lost: three asks the browser to restore the context, but the fallback page has replaced the app (main.ts).
  renderer.domElement.addEventListener('webglcontextlost', () => { lost = true; });
  renderer.autoClear = false; renderer.setClearColor(0, 0);
  renderer.setPixelRatio(pixelRatio());
  return true;
}

/* ---------- Pixel ratio: capped at 2 and 2.5 M buffer pixels, stepped down when frames run slow, back up after ---------- */
// The pipeline's buffers take ~51 MB per million pixels: at 2 a 1280 × 800 window's take 208 MB, over the 300 MB GPU
// budget beside the three worlds' maps (docs/progress.md, Performance). So 1.56 there, 2 on a phone; never under 1.
const MAX_PX = 2.5e6;
let dprCap = 2, slow = Infinity, skip = 60, frames = 0, acc = 0, good = 0;   // slow: the lowest ratio that ran slow
export const pixelRatio = () => Math.min(devicePixelRatio || 1, CAPTURE ? 2 : dprCap, Math.max(1, Math.sqrt(MAX_PX / (innerWidth * innerHeight))));
let paused = false;
/** The graphics context was lost once: the scene never draws again (no map is uploaded again behind the page). */
export let lost = false;
document.addEventListener('visibilitychange', () => { paused = !CAPTURE && document.hidden; skip = 30; });
export const isPaused = () => paused || lost;

// Called once per rendered frame with its duration. Warm-up frames (shader compile, texture upload) are skipped.
export function measure(dtMs: number) {
  if (CAPTURE || paused || skip-- > 0) return;
  frames++; acc += dtMs;
  if (frames < 120) return;
  const avg = acc / frames; frames = acc = 0;
  good = avg < 18 ? good + 1 : 0;
  // Steps up after 5 smooth windows (~10 s), but never back to a ratio that ran slow: on a borderline GPU it flipped
  // every 10 s, each flip a new canvas and composer buffers.
  const pr = renderer.getPixelRatio(), up = Math.min(2, dprCap + .5);
  if (avg > 24) slow = Math.min(slow, pr);
  const next = avg > 34 ? 1 : avg > 24 ? Math.max(1, pr - .5) : good >= 5 && up < slow ? up : dprCap;
  if (next === dprCap) return;
  dprCap = next; good = 0; skip = 30;
  renderer.setPixelRatio(pixelRatio());
}

/* ---------- Textures: every entry of public/textures/manifest.json ---------- */
// `lo`: the globes' 4K colour maps also come as a 1024 px low tier (scripts/fetch-real-data.mjs), the one the start
// waits on; `mid`, a 2K tier, is the full map on phones. Not 8K: an 8K RGBA map with its mips is 179 MB of GPU memory
// on its own (budget 300, docs/progress.md).
type Entry = { file: string; w: number; h: number; lo?: { file: string }; mid?: { file: string } };
const BASE = `${import.meta.env.BASE_URL}textures/`;
export let TEX: Record<string, Entry> = {};
// Before the scene modules load (main.ts): they read TEX as they build. Throws if the manifest can't be read.
export async function loadManifest() {
  const r = await fetch(`${BASE}manifest.json`);
  if (!r.ok) throw new Error(`textures/manifest.json: HTTP ${r.status}`);
  TEX = await r.json();
}
const loader = new THREE.ImageLoader(), texCache: Record<string, THREE.Texture> = {}, first: Record<string, Promise<void>> = {}, full: Record<string, Promise<void>> = {};
let late: ((k: string) => void) | null = null;
/** From start on, each texture that lands later is reported here (app.ts onAsset), and a full map that fails: what
 *  waited for it (ui/chrome.ts mapsLine, the crops cut from it) goes on with the low tier. */
export const onLateTexture = (f: (k: string) => void) => { late = f; };
function made(k: string, t = new THREE.Texture()) {
  t.colorSpace = /bump|spec|normal|clouds/.test(k) ? THREE.NoColorSpace : THREE.SRGBColorSpace;   // data maps stay raw
  // The shader reads one channel of a height, gloss or cloud map and two of a normal map: a quarter or half the GPU memory.
  if (/bump|spec|clouds/.test(k)) t.format = THREE.RedFormat; else if (/normal/.test(k)) t.format = THREE.RGFormat;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
// The texture, empty until loadTextures fetches its image (three binds its black placeholder, like `blank`, till then),
// then holding the best tier landed.
export function tex(k: string) {
  if (!texCache[k]) { if (!TEX[k]) throw new Error(`unknown texture ${k}`); texCache[k] = made(k); }
  return texCache[k];
}
/** The texture's image has landed (one that failed never does). */
export const landed = (k: string) => !!tex(k).image;
const done = new Set<string>();
/** Nothing sharper is coming for the texture: its full map has landed or failed, or it has one tier only. */
export const sharpest = (k: string) => !TEX[k].lo || done.has(k);
const fading: Record<string, THREE.Texture> = {};
/** The low tier a full map has just replaced, as a texture of its own for the globe's crossfade (app.ts showMaps), once. */
export function takeLow(k: string) { const t = fading[k]; delete fading[k]; return t; }
function fetchTier(k: string, file: string, isFull: boolean) {
  return new Promise<void>(res => loader.load(BASE + file, async img => {
    // Decoded off the main thread first, so the upload doesn't decode it there.
    // shortcut: a 4K map's upload (texSubImage2D, 32 MB) still holds the main thread ~125 ms on an M3 when it lands;
    // ImageBitmaps decoded from the fetched blob would about halve it, at the cost of flipping V in the planet shader and
    // a second copy for the 2D readers: do it if that stutter shows on stage.
    await img.decode().catch(() => {});
    const t = tex(k);
    if (!isFull && t.userData.full) return res();   // the full map was first
    if (isFull && t.image) { (fading[k] = made(k, new THREE.Texture(t.image))).needsUpdate = true; t.dispose(); }   // a new size needs new GPU storage
    t.image = img; t.userData.full = isFull; t.needsUpdate = true; if (isFull) done.add(k); res(); late?.(k);
  }, undefined, () => { console.warn(`texture ${k} (${file}) failed to load`); res(); if (isFull) { done.add(k); late?.(k); } }));
}
// Each texture's first tier (the low one where there is one, else its only file) fetched once; resolves when all of
// these have landed or failed. `final`: the full maps instead, which replace the low tier in the same texture. One that
// fails stays as it was and never holds the start (app.ts gates on the route's first tiers, then loads the rest).
export const loadTextures = (keys: string[], final = false) => Promise.all(keys.map(k => {
  const lo = TEX[k].lo?.file;
  return final && lo ? full[k] ??= fetchTier(k, (LITE && TEX[k].mid?.file) || TEX[k].file, true) : first[k] ??= fetchTier(k, lo ?? TEX[k].file, false);
}));

/* ---------- Scene and sprite helpers ---------- */
export const sys = new THREE.Scene();
export const LIGHT = new THREE.Vector3(-.85, .3, .45).normalize(), BACKLIGHT = new THREE.Vector3(0, -.4, -.92).normalize();   // the intro's: just under the horizon of rig.ts limbPose
export const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat); blank.needsUpdate = true;

// Adds light without writing alpha: alpha is what the bodies cover, so the grounds show round glows (scene/post.ts).
export function addBlend<M extends THREE.Material>(m: M) {
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; return m;
}
export function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, h = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = h; draw(c.getContext('2d')!, size, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Glows used to add in sRGB over the CSS grounds; in linear light the same look needs their coverage raised to 2.2
// (and sprite opacities likewise: scene/frame.ts lin). Half float, colour decoded here: 8-bit alpha after the power
// keeps only a few levels in a glow's faint tail, which band as rings.
const dec = (v: number) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
export function asLight(t: THREE.CanvasTexture) {
  const c = t.image as HTMLCanvasElement, d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data, h = THREE.DataUtils.toHalfFloat;
  const f = new Uint16Array(d.length);
  for (let i = 0; i < d.length; i += 4) {
    f[i] = h(dec(d[i] / 255)); f[i + 1] = h(dec(d[i + 1] / 255)); f[i + 2] = h(dec(d[i + 2] / 255)); f[i + 3] = h((d[i + 3] / 255) ** 2.2);
  }
  const o = new THREE.DataTexture(f, c.width, c.height, THREE.RGBAFormat, THREE.HalfFloatType);
  o.minFilter = o.magFilter = THREE.LinearFilter; o.needsUpdate = true;   // no mipmaps: RGBA16F needn't be renderable
  return o;
}
export const glowTex = asLight(canvasTex(256, (g, s) => {
  const r = s / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)'); gr.addColorStop(.45, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}));
