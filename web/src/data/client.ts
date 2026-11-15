// The data seam (docs/plan.md, Data seam): the one module the UI calls for engine data. VITE_DATA=mock (the default)
// replays the engine's examples (mock.ts); VITE_DATA=engine calls the engine itself (http.ts). Booking listings are
// frontend-owned in both (listing.ts); bodies, featured targets and the established Earth sites live in bodies.ts and
// sites.ts, pins in pins.ts.
import gsap from 'gsap';
import { pinId, type Body } from '../coords';
import { clock } from '../motion';
import { needPatch, patchFor } from '../terrain/dem';
import { genTerrain, heights, prunePins, WINDOW_KM, type Terrain } from '../terrain/procedural';
import { fromElevation, windowZ } from '../terrain/tiles';
import { EngineError, type Elevation, type ElevationOf, type Purpose } from './api';
import { hillshade } from './hillshade';
import { API, httpEngine } from './http';
import { listing } from './listing';
import { mockEngine } from './mock';
import { cellOf, customSite, noteCells } from './pins';
import { SITES, type Site } from './sites';
import type { SearchRequest, SearchResponse } from './types.gen';

export const MOCK = import.meta.env.VITE_DATA !== 'engine';
// ?mock=slow,empty,fail,warming,noimage,asengine, before or after the hash (like ?capture).
const param = (q?: string) => new URLSearchParams(q ?? '').get('mock') ?? '';
const modes = new Set(`${param(location.search)},${param(location.hash.split('?')[1])}`.split(','));
/** The engine's own windows and hillshades: their copy says so. ?mock=asengine labels the mock's that way, to see it. */
export const AS_ENGINE = !MOCK || modes.has('asengine');
// The mock's elevation is the frontend's own terrain of the same window: the featured site there (by its IAU name or
// its point), else a pin, drawn at the engine's 94 × 94 around the window's centre (a name's: its IAU centre, as the
// engine's). The compare so shows the same ground before its window lands and after.
// It waits for the real elevation patch the window reads (terrain/dem.ts), so none is answered from the stand-in.
// shortcut: read from the textures loaded when it is asked; a pin's window asked before a late texture landed stays flat.
const frontZ = (body: Body, lat: number, lon: number, name?: string) => needPatch(body, { lat, lon }, WINDOW_KM, 94).then(() =>
  windowZ(heights(body, SITES[body].find(x => name ? x.iau === name : x.lat === lat && x.lon === lon) ?? customSite(body, pinId(lat, lon))!, WINDOW_KM, 94, { lat, lon })));
// App-clock seconds (GSAP's), so ?capture seeks drive the mock's latencies and the retries like any animation.
const wait = (s: number) => new Promise<void>(r => { gsap.delayedCall(s, r); });
const mock = MOCK ? mockEngine(modes, { wait, now: clock }, frontZ) : null;
export const data = { ...(mock ?? httpEngine), listing };

/**
 * The engine warming up (spec §1: 30–40 s after it starts, every search answers warming_up meanwhile): /health asked
 * from boot and every 3 s while it says so (ui/chrome.ts notes it). An engine that doesn't answer, or failed to start,
 * isn't warming: the search's own states say so.
 */
export const engine = { warming: false };
export const pollHealth = (): Promise<unknown> => data.health().then(h => {
  engine.warming = h?.status === 'warming_up'; if (engine.warming) return wait(3).then(pollHealth);
}, () => { engine.warming = false; });

// Five results by default, "show more" asks for MORE (spec §2).
export const K = 5, MORE = 20;
export type Filters = NonNullable<SearchRequest['filters']>;
/**
 * What every target site's search asks for (spec §3.5): the purpose, required (the picker's; rover mobility by default),
 * and the filters, sent only when one is set (the default search is the fastest). The panel's picker sets it (ui/panel.ts).
 * shortcut: session state, not in the route: a reload or a deep link searches with the defaults. Put it in the hash if links must carry it.
 */
export const query: { purpose: NonNullable<SearchRequest['purpose']>; filters: Filters } = { purpose: 'rover_mobility', filters: {} };
/**
 * A target site's search for k results: the response once it lands, or the error; `busy` until it settles, then `done`
 * resolves. While "show more" (or Try again after it failed) runs, and after it fails, `res` still holds the shorter answer.
 * `t0` is when it was asked and, while the engine warms up, `up` when the engine started (both app-clock seconds): the
 * progress states measure from them.
 */
export interface Doubles { k: number; busy: boolean; res?: SearchResponse; err?: EngineError; done: Promise<void>; t0: number; up?: number }
const searches: Record<string, Doubles> = {}, centres: Record<string, { lat: number; lon: number }> = {};
// The search by coordinates under way (spec §3.5: 5–10 s, a remote DEM read): one at a time (spec §8: remote searches
// are network-bound), so a newer one calls it off and forgets it; asked again if its site is shown again.
let remote: { key: string; d: Doubles; stop: AbortController } | null = null;
/** Where the engine has no elevation (windows.py moon_window: the Moon beyond 59.5°, its 18.8 km window inside SLDEM's
 *  60°). Asked by coordinates it retries a remote read 3 times, 5 s apart, before its 422 no_dem: refused here at once,
 *  with nothing sent. A name goes to the engine, whose store says. */
export const noDemAt = (body: string, lat: number) => body === 'moon' && Math.abs(lat) > 59.5;
const noDem = () => Promise.reject(new EngineError(422, 'no_dem', 'No Moon elevation beyond 59.5° from the equator.'));
const keyOf = (body: Body, s: Site) => { const f = query.filters; return `${body}/${s.id}|${query.purpose}|${JSON.stringify(f, Object.keys(f).sort())}`; };
/** The search doublesOf would return for the current query, without asking it: the grid's sites by coordinates wait their turn (views/grid.ts). */
export const searched = (body: Body, s: Site): Doubles | undefined => searches[keyOf(body, s)];
// A target site's Earth doubles for the current query: featured and named targets by IAU name, the others (and pins)
// by coordinates. Asked once per site and query and kept, a failure too: `again` asks once more after a failure (the
// warming retry, "Try again"), `k` asks again for more results ("show more"). Pins keep their 12 most recent.
export function doublesOf(body: Body, s: Site, again = false, k?: number): Doubles {
  const f = query.filters, key = keyOf(body, s), had = searches[key], more = !!had && !!k && k > had.k;
  if (had && !(again && had.err) && !more) return had;
  const target = targetOf(body, s), n = k ?? had?.k ?? K, req: SearchRequest = { target, purpose: query.purpose, k: n, ...(Object.keys(f).length ? { filters: { ...f } } : {}) };
  const stop = new AbortController();
  if (!s.iau && remote?.d.busy) { remote.stop.abort(); if (searches[remote.key] === remote.d) delete searches[remote.key]; }
  // The answer is handled inside the guarded path: a body without its results list (a trust boundary) ends as bad_response.
  // The warm-up's start carries over to its retries, so the warming state redraws (and is announced) only when it changes.
  const d: Doubles = { k: n, busy: true, res: had?.res, t0: clock(), up: had?.err?.code === 'warming_up' ? had.up : undefined, done: (!s.iau && noDemAt(body, s.lat) ? noDem() : data.search(req, stop.signal)).then(res => {
    noteCells(res.results); d.res = res;
    const t = res.target; if (s.iau && Number.isFinite(t?.lat) && Number.isFinite(t?.lon)) centres[`${body}/${s.id}`] = { lat: t.lat, lon: t.lon };
  }).catch(async (e: unknown) => {
    if (stop.signal.aborted) { d.err = new EngineError(0, 'aborted', 'A newer search by coordinates replaced it.'); return; }
    let err = e instanceof EngineError ? e : new EngineError(0, 'bad_response', String(e));
    // Still warming after a failed warm-up: the engine answers warming_up for good (server.py); /health says error.
    // Else its uptime says how far the warm-up has got.
    if (err.code === 'warming_up') {
      const h = await data.health().catch(() => null);
      if (h?.status === 'error') err = new EngineError(503, 'start_failed', h.error ?? err.message);
      else if (Number.isFinite(h?.uptime_s)) d.up ??= clock() - h!.uptime_s;
    }
    // spec §6: a refused request is a front-end bug; log it, and anything thrown that isn't the engine's answer.
    if (!(e instanceof EngineError) || err.code === 'invalid_request' || err.code === 'unknown_purpose' || err.code === 'unsupported_purpose') console.error('Eidolon search failed:', e);
    d.err = err;
  }).finally(() => { d.busy = false; }) };
  searches[key] = d; prunePins(searches);
  if (!s.iau) remote = { key, d, stop };
  return d;
}
const targetOf = (body: Body, s: Site) => { const b = body as SearchRequest['target']['body']; return s.iau ? { body: b, name: s.iau } : { body: b, lat: s.lat, lon: s.lon }; };
// When the engine has no elevation at the site (no_dem: the Moon beyond 59.5°, the Artemis regions), a featured site's
// curated established analog sites stand in as its doubles, unscored. Pins have none.
export const knownOf = (s: Site, e: Doubles): string[] => e.err?.code === 'no_dem' ? s.doubles ?? [] : [];
// The results that carry a location, each with its Earth pin id ('@lat,lon': the compare route's double).
export const cellsOf = (res: SearchResponse) => res.results.flatMap(r => {
  const l = r.location; return l && Number.isFinite(l.lat) && Number.isFinite(l.lon) ? [{ r, id: pinId(l.lat!, l.lon!) }] : [];
});

// The raw elevation of an engine window (spec §3.7), asked once per window and kept: the compare's 3D terrain, maps and
// table are built from it, and the mock's hillshades drawn. `settled` resolves when it lands or fails for good: warming_up
// and a network failure are asked again every 3 s (spec §6: 2–5 s) for a minute (the engine warms up in 30–40 s, §1),
// as the search's warming is; any other failure (no_dem, no_image, unknown_target) is kept.
// shortcut: kept for the session (~70 KB each); prune like the pin searches if sessions grow long.
interface Win { p: Promise<Elevation>; settled: Promise<void>; done: boolean; e?: Elevation; T?: Terrain | null }
const wins = new Map<string, Win>();
const ask = (of: ElevationOf, n = 20): Promise<Elevation> => ('lat' in of && noDemAt(of.body, of.lat) ? noDem() : data.elevation(of)).catch((e: unknown) =>
  n > 0 && e instanceof EngineError && (e.code === 'warming_up' || e.code === 'network') ? wait(3).then(() => ask(of, n - 1)) : Promise.reject(e));
function elevationOf(of: ElevationOf): Win {
  const key = JSON.stringify(of); let w = wins.get(key);
  if (!w) {
    const p = ask(of), x: Win = { p, done: false, settled: p.then(e => { x.e = e; }, () => {}).finally(() => { x.done = true; }) };
    wins.set(key, w = x);
  }
  return w;
}
// The window a site's elevation is asked by: a target by its IAU name or its point (as its search), an Earth pin by the
// cell its search placed there. An established Earth site has none (the engine serves Earth by cell only).
function placeOf(body: Body, s: Site): ElevationOf | null {
  if (body !== 'earth') return targetOf(body, s);
  const c = s.custom ? cellOf(s.id) : undefined;
  return c == null ? null : { cell: c };
}
/**
 * A site's 18.8 km window as compare shows it (docs/plan.md, Gaps for the merge 1): the engine's elevation once it has
 * landed; until then, and where the engine has none (an established Earth site, no_dem, a failure), the frontend's own
 * terrain of it. `wait` settles when the engine's window lands or fails.
 */
export function terrainOf(body: Body, s: Site): { T: Terrain; wait?: Promise<void> } {
  const of = placeOf(body, s), w = of && elevationOf(of);
  if (w?.e && w.T === undefined) {
    w.T = fromElevation(w.e, s.t.pal, AS_ENGINE);
    if (w.T && !AS_ENGINE) w.T.src = patchFor(body, centreOf(body, s), WINDOW_KM, w.T.N)?.src;   // the mock's window: real where frontZ read a patch
  }
  return w?.T ? { T: w.T } : { T: genTerrain(body, s, WINDOW_KM, centreOf(body, s)), wait: w && !w.done ? w.settled : undefined };
}
/**
 * The centre of a site's compare window: where the engine compared (spec §3.5), i.e. a named target's IAU centre as its
 * search reports it (up to ~20 km from the featured point, Decisions 10); until that search lands, a featured site's
 * IAU centre as the frontend has it (`iauAt`), so the window and the elevation patch it reads stay the same throughout;
 * else the site's point.
 * shortcut: a named target whose search failed but whose window landed is labelled at its point; ask /targets/{body}/{name} if that shows.
 */
export const centreOf = (body: Body, s: Site): { lat: number; lon: number } => (s.iau && centres[`${body}/${s.id}`]) || s.iauAt || s;

// The picker's purposes and countries (spec §3.2, §3.6), asked once; what failed is asked again on the next call
// (/sovereigns answers warming_up while the engine loads). Checked here: they reach the page as option values and labels.
export const lists: { purposes?: Purpose[]; sovereigns?: string[] } = {};
let asking: Promise<void> | null = null;
const str = (x: unknown): x is string => typeof x === 'string';
export const askLists = () => asking ??= Promise.all([
  lists.purposes || data.purposes().then(r => {
    if (!Array.isArray(r?.purposes)) throw new EngineError(0, 'bad_response');
    lists.purposes = r.purposes.filter(p => str(p?.key) && str(p.label)).map(p => ({ key: p.key, label: p.label, description: str(p.description) ? p.description : '',
      surface: p.surface === 'barren' || p.surface === 'any' ? p.surface : null, supported: p.supported === true }));
  }),
  lists.sovereigns || data.sovereigns().then(r => {
    if (!Array.isArray(r?.sovereigns)) throw new EngineError(0, 'bad_response');
    lists.sovereigns = r.sovereigns.map(c => c?.name).filter(str);
  }),
].map(p => Promise.resolve(p).catch(() => {}))).then(() => { asking = null; });

// A result's hillshade (spec §3.7: `terrain_twins[0]`), as an <img> src, asked once per URL. Only the engine's two image
// paths are accepted (a trust boundary). Engine: the PNG itself. Mock: drawn from the mock's elevation of the same
// window, which lands 2 s after the first ask, as the engine's site images do.
// shortcut: kept for the session (~10 KB each in the mock); prune like the pin searches if sessions grow long.
const images = new Map<string, Promise<string>>();
function once(key: string, make: () => Promise<string>) {
  let p = images.get(key);
  if (!p) { p = make(); p.catch(() => {}); images.set(key, p); }
  return p;
}
export const imageOf = (url: string) => once(url, () => {
  const of = windowOf(url);
  return !of ? Promise.reject(new EngineError(404, 'no_image', url)) : MOCK ? elevationOf(of).p.then(shadeURL) : Promise.resolve(API + url.replace(/^\/api\/v1/, ''));
});
/** A named target's hillshade, by the engine's path for it (spec §3.7, as a search's `target.image_url`), for imageOf. */
export const targetImage = (body: Body, name: string) => `/api/v1/images/target/${body}/${encodeURIComponent(name)}.png`;
/** A site's window drawn as a hillshade from its elevation: the twin of a target searched by coordinates, which has no image. */
export function shadeOf(body: Body, s: Site) {
  const of = placeOf(body, s);
  return of ? once(JSON.stringify(of), () => elevationOf(of).p.then(shadeURL)) : Promise.reject(new EngineError(404, 'no_image'));
}
/**
 * A site's window drawn from Eidolon's own terrain (its real elevation where terrain/dem.ts has it), where the engine has
 * none: the grid's south-pole regions (no_dem) and established analog sites (the engine serves Earth by cell only).
 */
export const ownShadeOf = (body: Body, s: Site) => once(`own ${body}/${s.id}`, async () =>
  shadeURL({ size_px: 94, pixel_m: 200, extent_km: WINDOW_KM, units: 'm', row0: 'north', col0: 'west', z: await frontZ(body, s.lat, s.lon, s.iau) }));
/** The window an engine image URL shows (with or without the /api/v1 prefix), or null for any other URL. */
export function windowOf(url: string): ElevationOf | null {
  const m = /^(?:\/api\/v1)?\/images\/(?:site\/(\d{1,9})|target\/(mars|moon)\/([^/?#]+))\.png$/.exec(url);
  if (!m) return null;
  if (m[1]) return { cell: +m[1] };
  try { return { body: m[2] as 'mars' | 'moon', name: decodeURIComponent(m[3]) }; } catch { return null; }
}
function shadeURL(e: Elevation) {
  const N = e.size_px, cv = document.createElement('canvas');
  if (!Array.isArray(e.z) || e.z.length !== N || !e.z.every(r => Array.isArray(r) && r.length === N) || !(e.pixel_m > 0)) throw new EngineError(0, 'bad_response', 'not an elevation window');   // a trust boundary
  cv.width = cv.height = N; cv.getContext('2d')!.putImageData(new ImageData(hillshade(e), N, N), 0, 0);
  return cv.toDataURL();
}
