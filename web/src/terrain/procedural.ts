// Procedural terrain archetypes (prototype 720–832): the fallback wherever no real elevation patch covers a site
// (terrain/dem.ts) and until engine elevation lands. 192 × 192 samples, generated synchronously (at the terrain swap,
// under the held frame of its crossfade) and cached per site.
// shortcut: genTerrain runs synchronously on the main thread at the swap (8–67 ms a window on an M3, so ~0.3 s at a
// phone's 4× slower CPU, which holds the crossfade's first frame that long); move it to a worker once a real phone shows
// the swap stalling (Decisions 112, 137).
import { clamp, D2R, llToLocal, localToLL, smooth, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import type { Site } from '../data/sites';
import { demHeights, needPatch, patchFor, resOf } from './dem';
import { BUMP, sampleMap } from './sample';

function makeNoise(seed: number) {
  const perm = [...Array(256).keys()], p = new Uint8Array(512);
  let s = seed % 2147483646 + 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = (h: number, x: number, y: number) => { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
  const f = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  function n2(x: number, y: number) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = f(x), v = f(y), a = p[X] + Y, b = p[X + 1] + Y;
    const l1 = g(p[a], x, y) + u * (g(p[b], x - 1, y) - g(p[a], x, y));
    const l2 = g(p[a + 1], x, y - 1) + u * (g(p[b + 1], x - 1, y - 1) - g(p[a + 1], x, y - 1));
    return (l1 + v * (l2 - l1)) * .7;
  }
  const fbm = (x: number, y: number, o = 5) => { let a = 1, fr = 1, sum = 0, n = 0; for (let i = 0; i < o; i++) { sum += a * n2(x * fr, y * fr); n += a; a *= .5; fr *= 2; } return sum / n; };
  const ridge = (x: number, y: number, o = 5) => { let a = 1, fr = 1, sum = 0, n = 0; for (let i = 0; i < o; i++) { sum += a * (1 - Math.abs(n2(x * fr, y * fr) * 1.4)); n += a; a *= .5; fr *= 2; } return sum / n; };
  return { n2, fbm, ridge, rnd, seed: s };
}
type Noise = ReturnType<typeof makeNoise>;
const hash2 = (a: number, b: number, s: number) => { const t = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return t - Math.floor(t); };
function voronoiEdge(u: number, v: number, c: number, s: number) {
  const x = u / c, y = v / c, ix = Math.floor(x), iy = Math.floor(y); let f1 = 9, f2 = 9;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const gx = ix + a, gy = iy + b, d = Math.hypot(gx + hash2(gx, gy, s) - x, gy + hash2(gy, gx, s + 1) - y);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return (f2 - f1) * c;
}
const terrace = (x: number, n: number) => { const k = x * n, fl = Math.floor(k); return (fl + smooth(.72, 1, k - fl)) / n; };

// The archetypes read a site's numeric terrain parameters (data/sites.ts); u, v run −1…1, west to east, south to north.
type Params = Record<string, number>;
type Arch = (u: number, v: number, t: Params, nz: Noise, s: Site, id: Body) => number;
const ARCH: Record<string, Arch> = {
  crater(u, v, t, nz) {
    const r = Math.hypot(u, v) / t.R;
    let h = r < 1 ? -t.depth * (1 - r * r) + t.rim * Math.pow(r, 6) : t.rim * Math.exp(-(r - 1) * 2.6);
    if (t.peak) { const rp = Math.hypot(u - (t.px || 0), v - (t.py || 0)) / t.peakR; let pk = Math.exp(-rp * rp * 1.2); if (t.layered) pk = pk * .45 + .55 * terrace(clamp(pk + .05 * nz.fbm(u * 6, v * 6, 3), 0, 1), 9); h += t.peak * pk; }
    if (t.fan) {
      const dx = (u + .5 * t.R) / (.34 * t.R), dy = (v - .06 * t.R) / (.24 * t.R);
      h += t.fan * Math.exp(-(dx * dx + dy * dy) * 1.5) * (.7 + .6 * nz.ridge(u * 9, v * 9, 3));
      const cy = .08 * t.R + .03 * Math.sin(u * 14);
      if (u < -.6 * t.R && u > -1.6 * t.R) h -= t.rim * .95 * Math.exp(-(((v - cy) / .035) ** 2));
    }
    return h + t.noise * nz.fbm(u * 3.2 + 7, v * 3.2 - 3, 5);
  },
  plains(u, v, t, nz) {
    let h = t.amp * nz.fbm(u * 1.8, v * 1.8, 5) + t.amp * .25 * nz.fbm(u * 10, v * 10, 3);
    if (t.poly) h -= t.poly * 14 * (1 - smooth(0, .014, voronoiEdge(u, v, .11, nz.seed)));
    if (t.ripples) h += 2.5 * Math.sin((u * .8 + v * .6) * 95 + nz.fbm(u * 3, v * 3, 2) * 4);
    if (t.flows) h += t.amp * .7 * smooth(.55, .78, nz.ridge(u * 1.5 + 2, v * .8, 4));
    return h;
  },
  basin(u, v, t, nz) {
    const d = Math.abs(u + .12 * nz.fbm(v * 1.5, 3, 3));
    let h = t.amp * smooth(.42, .98, d) * (.6 + .4 * nz.ridge(u * 3, v * 3, 4)) + (t.lake ? t.amp * .05 * (v + 1) : 0);
    h += t.amp * .07 * smooth(.25, .52, d) * (.5 + .5 * nz.fbm(u * 6, v * 6, 3));
    return h + 2 * nz.fbm(u * 12, v * 12, 2);
  },
  layered(u, v, t, nz) { const n = .5 + .55 * nz.fbm(u * 1.7 + 1, v * 1.7, 5) + .1 * nz.fbm(u * 7, v * 7, 3); return t.amp * terrace(clamp(n, 0, 1), t.steps); },
  volcanic(u, v, t, nz) {
    let h = t.amp * .12 * nz.fbm(u * 2, v * 2, 4) + t.amp * (t.slope || 0) * (v + 1) / 2;
    if (t.flows) h += t.amp * .2 * smooth(.5, .8, nz.ridge(u * 2.2, v * 1.1 + 4, 4));
    return h + t.amp * .025 * nz.fbm(u * 24, v * 24, 2);
  },
  massif(u, v, t, nz) {
    const a = t.ridgeLine ? Math.exp(-(((u - v) * .7) ** 2) * 3 - ((u + v) * .35) ** 2) : Math.exp(-(u * u * .9 + v * v * 1.4) * 1.6);
    return t.ridge * a * (.55 + .45 * nz.ridge(u * 2.4, v * 2.4, 5)) + t.ridge * .05 * nz.fbm(u * 8, v * 8, 3);
  },
  valley(u, v, t, nz) { const d = Math.abs(u - .18 * nz.fbm(v * 1.2, 5, 3)); return t.amp * smooth(.12, .9, d) * (.6 + .4 * nz.ridge(u * 2.5, v * 2.5, 5)) + t.amp * .015 * nz.fbm(u * 10, v * 10, 3); },
  channel(u, v, t, nz) {
    const xc = .22 * Math.sin(v * 3.1) + .07 * Math.sin(v * 7.3 + 1), d = Math.abs(u - xc);
    let h = t.amp * (.5 + .5 * nz.fbm(u * 2, v * 2, 5)) - t.depth * Math.exp(-((d / .045) ** 2));
    if (t.front) h += t.front * smooth(.4, .98, u + .1 * nz.fbm(v * 3, 1, 3)) * (.7 + .3 * nz.ridge(u * 3, v * 3, 4));
    return h;
  },
  hills(u, v, t, nz) { const n = .5 + .5 * nz.fbm(u * 2.4, v * 2.4, 4); return t.amp * n * n + t.amp * .05 * nz.fbm(u * 12, v * 12, 2); },
  // Pins: the body's global elevation map around the pin, sampled in the site's local projection, with fine detail on top.
  dem(u, v, t, nz, s, id) {
    const b = BODIES[id], half = t.ext / 2, [lat, lon] = localToLL(b.R, s.lat, s.lon, u * half, v * half);
    return (sampleMap(BUMP[id], b, lat, lon) - t.h0) * t.vs + t.amp * nz.fbm(u * 3 + 5, v * 3, 5) + t.amp * .3 * nz.fbm(u * 14, v * 14, 3);
  },
};
const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

export interface Terrain {
  N: number; z: Float32Array; min: number; max: number; relief: number; ext: number; exag: number; minor: number; major: number;
  meanSlope: number; steep: number; pal: string; lake: number;
  wet?: Uint8Array;   // a real lake: 1 where it is water (else water is every sample below `lake`)
  engine?: boolean;   // the engine's own elevation (terrain/tiles.ts), not the frontend's
  src?: string;       // real elevation: the key of its source (terrain/dem.ts CREDITS)
  res?: number;       // real elevation: the spacing its ground really has (m; terrain/dem.ts resOf), maybe coarser than the samples
}
/** The engine's comparison window (km): 94 × 94 samples at 200 m. Compare shows both sites over it. */
export const WINDOW_KM = 94 * 200 / 1000;
const terrCache: Record<string, Terrain> = {};
// Pins sample the global elevation map: their terrain is stale once a late texture lands (or, `only` one Earth pin's,
// once a search places it). '' clears every site's: the real elevation landed late.
export const clearPinTerrain = (only = '@') => { for (const k in terrCache) if (k.includes(only)) delete terrCache[k]; };
// Pin entries (keys with a pin id, '@lat,lon' or a named target's 'Name@lat,lon') are kept for the most recent few only; featured sites stay cached.
// shortcut: drops the oldest pins first (insertion order), not the least recently used; an LRU only pays off if
// people revisit many old pins in one session.
export function prunePins(cache: Record<string, unknown>, keep = 12) {
  const pins = Object.keys(cache).filter(k => k.includes('@'));
  for (const k of pins.slice(0, Math.max(0, pins.length - keep))) delete cache[k];
}
// A site's terrain over a square `win` km wide centred on it (default: the site's own extent), 192 × 192, cached. The
// archetype is sampled at the same physical scale either way, so a window wider than the site extends its surroundings.
// `at` centres the window elsewhere (a named target's window sits on its IAU centre): the same ground, shifted.
export function genTerrain(bodyId: Body, site: Site, win = site.t.ext, at: LL = site): Terrain {
  const key = `${bodyId}/${site.id}/${win}${at === site ? '' : `/${at.lat},${at.lon}`}`; if (terrCache[key]) return terrCache[key];
  const z = heights(bodyId, site, win, 192, at), P = patchFor(bodyId, at, win, 192), src = P?.src;
  const T = terrCache[key] = { ...measure(z, 192, win, site.t.pal, !!site.t.lake), src, res: P ? resOf(P) : undefined };
  if (site.t.lake && src) { T.lake = waterLevel(z); T.wet = flood(z, 192, T.lake); }
  // Earth's 30 m elevation keeps fine roughness that the planets' coarser models smooth away: past 5× it reads as spikes.
  if (bodyId === 'earth' && src) T.exag = Math.min(T.exag, 5);
  prunePins(terrCache);   // each window is 192² floats (~147 KB)
  return terrCache[key];
}
type LL = { lat: number; lon: number };
/** Loads the real elevation a site's views read first: its terrain, and its compare window centred on `at` (data/client.ts
 *  centreOf: a named target's IAU centre) as compare (192 samples) and the mock's windows (94) sample it. */
export const needSite = (b: Body, s: Site, at: LL) =>
  Promise.all([needPatch(b, s, s.t.ext, 192), needPatch(b, at, WINDOW_KM, 192), needPatch(b, at, WINDOW_KM, 94)]);
// A real DEM flattens a lake to one height: its most common whole metre is the water.
function waterLevel(z: Float32Array) {
  const n = new Map<number, number>(); let best = 0, top = 0;
  for (const v of z) { const k = Math.round(v), c = (n.get(k) ?? 0) + 1; n.set(k, c); if (c > top) { top = c; best = k; } }
  return best + .5;
}
/** The lake: the samples below `level` joined (4-connected) to the one nearest the window's centre; lower ground
 *  elsewhere in the window stays dry. */
function flood(z: Float32Array, N: number, level: number) {
  const wet = new Uint8Array(N * N), c = (N - 1) / 2; let start = -1, best = Infinity;
  for (let k = 0; k < N * N; k++) { const d = Math.hypot(k % N - c, Math.floor(k / N) - c); if (z[k] < level && d < best) { best = d; start = k; } }
  const stack = start < 0 ? [] : [start]; if (start >= 0) wet[start] = 1;
  while (stack.length) {
    const k = stack.pop()!, i = k % N;
    for (const m of [i > 0 ? k - 1 : -1, i < N - 1 ? k + 1 : -1, k - N, k + N]) if (m >= 0 && m < N * N && !wet[m] && z[m] < level) { wet[m] = 1; stack.push(m); }
  }
  return wet;
}
/** The heights behind genTerrain, N × N samples edge to edge (row 0 north), uncached: the mock's windows take 94. Real
 *  elevation where a patch holds the window, else the site's archetype. */
export function heights(bodyId: Body, site: Site, win = site.t.ext, N = 192, at: LL = site): Float32Array {
  const real = demHeights(bodyId, at, win, N); if (real) return real;
  const t = site.t as unknown as Params, nz = makeNoise([...site.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17));
  const zoom = win / t.ext;   // archetype units per window unit
  const [ox, oy] = llToLocal(BODIES[bodyId].R, site.lat, site.lon, at.lat, at.lon).map(k => k / (t.ext / 2));   // the centre, in archetype units
  const z = new Float32Array(N * N), arch = ARCH[site.t.arch];
  const craters = [...Array(t.craters || 0)].map(() => ({ x: nz.rnd() * 1.8 - .9, y: nz.rnd() * 1.8 - .9, R: .02 + nz.rnd() ** 2 * .1, f: nz.rnd() }));
  const cones = [...Array(t.cones || 0)].map(() => ({ x: nz.rnd() * 1.4 - .7, y: nz.rnd() * 1.4 - .7, R: .08 + nz.rnd() * .12, H: .4 + nz.rnd() * .6 }));
  for (let j = 0; j < N; j++) { const v = (1 - 2 * j / (N - 1)) * zoom + oy;
    for (let i = 0; i < N; i++) { const u = (-1 + 2 * i / (N - 1)) * zoom + ox;
      let h = arch(u, v, t, nz, site, bodyId);
      for (const c of craters) { const r = Math.hypot(u - c.x, v - c.y) / c.R; if (r < 2.4) { const dep = c.R * t.ext * 1000 * (.06 + .1 * c.f), rim = dep * .22; h += r < 1 ? -dep * (1 - r * r) + rim * r ** 6 : rim * Math.exp(-(r - 1) * 3); } }
      for (const c of cones) { const r = Math.hypot(u - c.x, v - c.y) / c.R; if (r < 1.2) h += t.amp * .4 * c.H * Math.max(0, 1 - r) ** 1.4 - t.amp * .09 * c.H * Math.exp(-((r / .25) ** 2)); }
      z[j * N + i] = t.base + h;
    }
  }
  return z;
}
/** The slope hazard's line (degrees): steeper ground is tinted (terrain/mesh.ts slopeOf) and counted (measure's `steep`). */
export const STEEP = 15;
/** Each sample's slope (degrees) of an N × N grid of heights (m) `win` km wide edge to edge (row 0 north), at its true
 *  spacing, win / (N − 1): central differences inside, one-sided along the edges. */
export function slopes(z: Float32Array, N: number, win: number) {
  const cell = win * 1000 / (N - 1), out = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const w = Math.max(i - 1, 0), e = Math.min(i + 1, N - 1), n = Math.max(j - 1, 0), s = Math.min(j + 1, N - 1);
    const gx = (z[j * N + e] - z[j * N + w]) / ((e - w) * cell), gy = (z[n * N + i] - z[s * N + i]) / ((s - n) * cell);
    out[j * N + i] = Math.atan(Math.hypot(gx, gy)) / D2R;
  }
  return out;
}
// A square grid of heights `win` km wide (row 0 north) with what the views read from it: range, relief, slopes, the
// vertical exaggeration and contour steps. A `lake` floods it to 4.5 % of its relief (Lake Salda).
export function measure(z: Float32Array, N: number, win: number, pal: string, lake = false): Terrain {
  let mn = Infinity, mx = -Infinity; for (const e of z) { if (e < mn) mn = e; if (e > mx) mx = e; }
  const sl = slopes(z, N, win); let sum = 0, steep = 0, cnt = 0;
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const s = sl[j * N + i]; sum += s; if (s > STEEP) steep++; cnt++; }
  const relief = Math.max(mx - mn, 1);
  const ex = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].find(x => x >= .14 * win * 1000 / relief * .85) || 20;
  const minor = NICE.find(x => x >= relief / 12) || 2000;
  return { N, z, min: mn, max: mx, relief, ext: win, exag: ex, minor, major: minor * 5, meanSlope: sum / cnt, steep: steep / cnt,
    pal, lake: lake ? mn + relief * .045 : -1e9 };
}
