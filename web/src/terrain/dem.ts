// Real elevation on the demo path (scripts/fetch-real-data.mjs, docs/credits.md): patches for the featured sites and
// their compare windows, the established Earth sites, the mock's Earth cells and the lunar south polar cap. Each is a
// square in the app's site projection (coords.ts llToLocal) around its centre, n × n heights edge to edge, row 0 north,
// as `heights` (procedural.ts) lays its samples, in a file of its own, loaded when a view first reads it. Also the
// orbital crops cut for the same sites, and the credit lines.
import { clamp, llToLocal, localToLL, type Body } from '../coords';
import { BODIES } from '../data/bodies';

interface Patch { body: Body; lat: number; lon: number; km: number; n: number; min: number; max: number; src: string; file: string; z?: Float32Array; loading?: Promise<void>; bad?: true }
const PATCHES: Patch[] = [], CROPS = new Map<string, { url: string; src: string }>();
/** Each source's name and owner, by the key patches and crops carry. */
const CREDITS: Record<string, [name: string, by: string]> = {};
/** The source each globe's map came from: crops without a file of their own are cut from it. */
export const GLOBE_SRC: Record<Body, string> = { mars: 'mdimTes', moon: 'wacClem', earth: 'bmng' };
const BASE = `${import.meta.env.BASE_URL}sites/`;
export let sitesLoaded = false;

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isBody = (x: unknown): x is Body => typeof x === 'string' && Object.hasOwn(BODIES, x);
async function get(path: string) { const r = await fetch(BASE + path); if (!r.ok) throw new Error(`sites/${path}: HTTP ${r.status}`); return r; }
/** The manifest (the patches it lists, crops and credits), loaded once; a failure leaves the procedural terrain everywhere, with a warning. */
let loading: Promise<void> | undefined;
export const loadSites = () => loading ??= load();
async function load() {
  try {
    const m = await get('manifest.json').then(r => r.json()), ps: Patch[] = [];
    for (const p of m?.patches ?? []) {
      const { body, lat, lon, km, n, min, max, src, file } = p ?? {};
      if (!isBody(body) || ![lat, lon, km, min, max].every(num) || !Number.isInteger(n) || n < 2 || typeof src !== 'string' || typeof file !== 'string' || !/^patches\/[\w-]+\.bin$/.test(file))
        throw new Error(`sites/manifest.json: bad patch ${JSON.stringify(p)}`);
      ps.push({ body, lat, lon, km, n, min, max, src, file });
    }
    PATCHES.push(...ps);   // all or none
    for (const [k, v] of Object.entries(m?.credits ?? {})) if (Array.isArray(v) && typeof v[0] === 'string' && typeof v[1] === 'string') CREDITS[k] = [v[0], v[1]];
    for (const c of m?.crops ?? []) {
      if (!isBody(c?.body) || ![c.lat, c.lon, c.km].every(num) || typeof c.file !== 'string' || !/^crops\/[\w-]+\.jpg$/.test(c.file) || typeof c.src !== 'string') continue;
      CROPS.set(cropKey(c.body, c.lat, c.lon, c.km), { url: BASE + c.file, src: c.src });
    }
    sitesLoaded = true;
  } catch (e) { console.warn('real site data failed to load; procedural terrain stands in', e); }
}
// One patch's heights, fetched once. One that fails (or isn't n × n 16-bit heights) stays without them: the procedural
// terrain stands in there, with a warning.
const fetchPatch = (P: Patch) => P.loading ??= get(P.file).then(r => r.arrayBuffer()).then(b => {
  if (b.byteLength !== P.n * P.n * 2) throw new Error(`sites/${P.file}: ${b.byteLength} bytes for ${P.n}²`);
  const k = (P.max - P.min) / 65535; P.z = Float32Array.from(new Uint16Array(b), v => P.min + v * k);   // little-endian, as every browser runs
}).catch(e => { P.bad = true; console.warn('real elevation patch failed to load; procedural terrain stands in', e); });
/** Every patch (?capture: the start waits on all of them, so every state reads the same ground). */
export const loadAllPatches = () => Promise.all(PATCHES.map(fetchPatch));
let late: (() => void) | null = null, missed: Patch[] = [];
/** From start on: patches that a view read before they had landed have now landed (app.ts onAsset rebuilds it). */
export const onLatePatch = (f: () => void) => { late = f; };
// A read of a patch still on its way starts its load; the reads of one pass (a route's panel, maps and terrain) are
// reported once, when their patches have all settled, if any of them landed.
function miss(P: Patch) {
  if (!missed.length) queueMicrotask(() => { const ps = missed; missed = []; Promise.all(ps.map(fetchPatch)).then(() => { if (ps.some(p => p.z)) late?.(); }); });
  if (!missed.includes(P)) missed.push(P);
}

type LL = { lat: number; lon: number };
const step = (P: Patch) => P.km / (P.n - 1);
// Each elevation source's own spacing (m; docs/credits.md): a patch sampled finer than that holds no finer ground.
const NATIVE_M: Record<string, number> = { blend: 200, sldem: 59, lolaPole: 240, lolaCap: 1000, glo30: 30 };
/** The spacing a patch's ground really has (m): its own step or its source's, whichever is coarser (ui/slope.ts). */
export const resOf = (P: Patch) => Math.max(step(P) * 1000, NATIVE_M[P.src] ?? 0);
/**
 * The patch holding the whole `win` km square centred on `at`, as N × N samples (edge to edge), closest to their spacing:
 * the coarsest no coarser than they are (a finer one, point-sampled, aliases), else the finest, and only one at most 4
 * times coarser, so a large site's patch doesn't stand in, blurred, for a window it barely samples. Loaded or not.
 */
function pick(body: Body, at: LL, win: number, N: number) {
  const R = BODIES[body].R, h = win / 2, s = win / (N - 1), fits = (P: Patch) => step(P) <= s * 1.001; let best: Patch | null = null;
  for (const P of PATCHES) {
    if (P.body !== body || step(P) > 4 * s || (best && (fits(best) ? !fits(P) || step(P) <= step(best) : step(P) >= step(best)))) continue;
    const lim = P.km / 2 + 1e-6;   // the window's corners and edge midpoints, in the patch's projection
    if ([[-h, -h], [0, -h], [h, -h], [h, 0], [h, h], [0, h], [-h, h], [-h, 0]].every(([x, y]) => {
      const [la, lo] = localToLL(R, at.lat, at.lon, x, y), [px, py] = llToLocal(R, P.lat, P.lon, la, lo);
      return Math.abs(px) <= lim && Math.abs(py) <= lim;
    })) best = P;
  }
  return best;
}
/** The patch a window reads (pick), once its heights have landed; a read before that starts its load (miss) and gets null. */
export function patchFor(body: Body, at: LL, win: number, N: number) {
  const P = pick(body, at, win, N);
  if (P && !P.z && !P.bad) miss(P);
  return P?.z ? P : null;
}
/** Loads the patch a window reads (after the manifest); settles once it has landed or failed. */
export async function needPatch(body: Body, at: LL, win: number, N: number) {
  await loadSites(); const P = pick(body, at, win, N); if (P) await fetchPatch(P);
}
/** N × N real heights over the `win` km square centred on `at` (row 0 north), or null where no patch holds it. */
export function demHeights(body: Body, at: LL, win: number, N: number) {
  const P = patchFor(body, at, win, N); if (!P) return null;
  const R = BODIES[body].R, half = win / 2, f = (P.n - 1) / P.km, z = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [la, lo] = localToLL(R, at.lat, at.lon, (-1 + 2 * i / (N - 1)) * half, (1 - 2 * j / (N - 1)) * half), [x, y] = llToLocal(R, P.lat, P.lon, la, lo);
    const fx = clamp((x + P.km / 2) * f, 0, P.n - 1.001), fy = clamp((P.km / 2 - y) * f, 0, P.n - 1.001), a = Math.floor(fx), b = Math.floor(fy), u = fx - a, v = fy - b, Z = P.z!, n = P.n;
    z[j * N + i] = (Z[b * n + a] * (1 - u) + Z[b * n + a + 1] * u) * (1 - v) + (Z[(b + 1) * n + a] * (1 - u) + Z[(b + 1) * n + a + 1] * u) * v;
  }
  return z;
}

// By value, not float identity: a double's centre comes back through its route, where -105.075 reads -105.07499999999999.
const cropKey = (b: Body, lat: number, lon: number, km: number) => `${b}|${lat.toFixed(4)}|${lon.toFixed(4)}|${km.toFixed(1)}`;
/** The orbital crop cut for a site's centre and width, if the script made one. */
export const cropOf = (b: Body, lat: number, lon: number, km: number) => CROPS.get(cropKey(b, lat, lon, km)) ?? null;
/** "Name · owner" of a source key, or '' when the manifest didn't load. */
export const credit = (src?: string) => src && CREDITS[src] ? `${CREDITS[src][0]} · ${CREDITS[src][1]}` : '';
/** The name alone (the terrain note, the no-data box), or ''. */
export const creditName = (src?: string) => src && CREDITS[src] ? CREDITS[src][0] : '';
