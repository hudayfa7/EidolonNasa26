// The mock engine (VITE_DATA=mock, the default). It replays the engine's own example responses (contracts/examples/api/,
// written by the engine's make_api_examples.py) at the engine's measured latencies (spec §3.5, §3.7). Every query no
// example answers gets a response derived from them in the same schemas: the examples' 15 real Earth cells (plus four
// made-up ones, below), re-ranked and re-scored per query, deterministically. Errors carry the engine's real bodies
// (error_*.json). Elevation windows hold the frontend's own terrain of the same place (`MockTerrain`, passed in).
// Modes (?mock=, comma-separated; data/client.ts): slow (every call takes 10 s), empty (low confidence and "No close
// analog"), fail (every call rejects as if the engine were down), warming (503 warming_up for the first 35 s), noimage
// (every Earth cell's window answers 404 no_image, as for a cell whose DEM is unavailable: no hillshade, no elevation).
// Moon points beyond 59.5° always get 422 no_dem, as from the engine (windows.py), so ?mock=nodem changes nothing.
import { rng } from '../coords';
import { EngineError, errorFrom, type Elevation, type Engine, type Health, type PurposesResponse, type TargetDetail } from './api';
import type { MatchResult, SearchRequest, SearchResponse, TargetSummary, TargetsList } from './types.gen';
import health from '../../contracts/examples/api/health.json';
import purposes from '../../contracts/examples/api/purposes.json';
import cached from '../../contracts/examples/api/search_named_cached.response.json';
import filtered from '../../contracts/examples/api/search_named_filtered.response.json';
import coordinates from '../../contracts/examples/api/search_coordinates.response.json';
import jezero from '../../contracts/examples/api/target_jezero.json';
import jez from '../../contracts/examples/api/targets_jez.json';
import noDem from '../../contracts/examples/api/error_no_dem.json';
import unknownTarget from '../../contracts/examples/api/error_unknown_target.json';
import unsupported from '../../contracts/examples/api/error_unsupported_purpose.json';
import warmingUp from '../../contracts/examples/api/error_warming_up.json';

/** The mock's clock, in seconds: the app passes its own (data/client.ts), tests pass fake timers. */
interface MockClock { wait(s: number): Promise<void>; now(): number }
/**
 * The heights of the 18.8 km window centred on a place (rows from the north edge), for the mock's elevation: the app
 * passes the frontend's own terrain once its real elevation has loaded (data/client.ts), tests a stub. `name` is the
 * IAU name when asked by name.
 */
type MockTerrain = (body: Body | 'earth', lat: number, lon: number, name?: string) => number[][] | Promise<number[][]>;
type Body = TargetSummary['body'];
type Query = { target: { body: Body; name: string | null; lat: number | null; lon: number | null }; purpose: string; k: number; filters: NonNullable<SearchRequest['filters']> };
type Fixture = { status: number; detail: { code: string; message: string } };

// Seconds: a named target from the cache, one with filters, a point (remote DEM read), an Earth window the first time.
export const LATENCY = { fast: .02, live: .3, remote: 6, first: 2, slow: 10 };
const EXAMPLES = [cached, filtered, coordinates] as unknown as SearchResponse[];
// The examples' Earth cells, each once: every derived result is one of them.
const REAL = [...new Map(EXAMPLES.flatMap(x => x.results).map(r => [r.site_id, r])).values()];
// shortcut: four made-up cells (plausible values, not engine output) so mock results can also show a cell inside an
// established analog site (Hanksville, Pilbara, Haughton) and a rugged_extension cell (education or surface "any");
// the engine's own cells replace them at the merge.
const cell = (id: number, lat: number, lon: number, elevation_m: number, country: string, surface: 'barren' | 'rugged_extension',
  t_mean_c: number, precip_mm: number, aridity_index: number): MatchResult => ({ ...REAL[0], site_id: `earth_cell_${id}`,
  location: { lat, lon, elevation_m, country, sovereign: country, access: 'partner', surface }, environment: { t_mean_c, precip_mm, aridity_index, source: REAL[0].environment!.source } });
const POOL = [...REAL, cell(391204, 38.425, -110.775, 1340, 'United States of America', 'barren', 11.6, 180, .12),
  cell(1158077, -21.225, 119.425, 380, 'Australia', 'barren', 26.4, 320, .14), cell(52391, 75.375, -89.675, 60, 'Canada', 'barren', -16.5, 160, .45),
  cell(10412870, -43.575, 170.425, 1420, 'New Zealand', 'rugged_extension', 3.2, 3100, 4.8)];
// Every Earth cell the mock hands out, by its number: the elevation of its window is asked by it (spec §3.7).
export const CELL_AT = new Map(POOL.map(r => [+r.site_id.split('_').pop()!, r.location!]));
const CAVEATS = EXAMPLES[0].results[0].explanation.caveats!;   // the two DEM caveats every result carries
const POLAR = POOL.flatMap(r => r.explanation.caveats ?? []).find(c => c.startsWith('Polar site'))!;
// The engine's own caveat texts (engine.py) for a vegetated extension cell and a target below 200 m resolvability.
const RUGGED = 'Rugged non-barren land (index extension): terrain form matches, but the site is likely vegetated, so surface materials and environment differ from the target.';
const subres = (type?: string | null) => `Target landform type '${type}' is below 200 m resolvability: form-based properties are not measurable.`;
const FORM = ['terrain_form', 'landform_polarity', 'landform_scale'];   // the properties a sub-resolution target can't measure
export const NO_ANALOG = 'No close analog in this region; best available.';
const WINDOW = { size_px: 94, pixel_m: 200, extent_km: 18.8 };
const iau = (body: Body, name: string, type: string, code: string, family: TargetSummary['family'], lat: number, lon: number, diameter_km: number,
  capability: TargetSummary['capability'] = null): TargetSummary => ({ target_id: `${body}:${name}`, body, name, type, code, family, lat, lon, diameter_km,
  coordinate_source: 'IAU Gazetteer of Planetary Nomenclature (center point)', capability, image_url: `/api/v1/images/target/${body}/${name}.png` });
// Targets the mock knows at once: the examples' own, the featured sites' IAU features, and three more for the capability
// tiers and a sub-resolution target (engine targets/targets.json; tiers from its data/landform_capability_v2.csv).
const CAT: TargetSummary[] = [...(jez as unknown as TargetsList).targets, EXAMPLES[1].target,
  iau('mars', 'Gale', 'Crater', 'AA', 'depression', -5.3672, 137.811, 154.084, EXAMPLES[0].target.capability),   // same landform class as Jezero
  iau('mars', 'Utopia Planitia', 'Planitia', 'PL', 'other', 46.7363, 117.5168, 3560.448),
  iau('moon', 'Taurus Littrow Valley', 'Astronaut-named features', 'LF', 'other', 20.0702, 30.7867, 21.0277),
  iau('mars', 'Nirgal Vallis', 'Vallis', 'VA', 'linear', -28.1596, -41.6848, 610, { tier: 'weak', p_target_top3: .31, n_targets: 16, landform_class: 'valley/canyon' }),
  iau('moon', 'Mons Hadley', 'Mons', 'MO', 'raised', 26.6948, 4.1183, 26.395605, { tier: 'good', p_target_top3: .6, n_targets: 5, landform_class: 'mountain' }),
  iau('moon', 'Shorty', 'Astronaut-named features', 'LF', 'other', 20.2172, 30.6254, .1132)];
// The rest, for autocomplete and any name CAT lacks: the engine's 3,848 targets but the 6,252 lunar satellite craters
// (scripts/trim-targets.mjs: 163 KB, 73 KB gzip), a chunk of its own loaded on the first call that needs it.
// shortcut: no satellite craters ("Abulfeda Q"), which the engine lists when the query matches them; include them if wanted.
type Tier = NonNullable<TargetSummary['capability']>['tier'];
interface Packed { codes: Record<string, [string, TargetSummary['family']]>; cap: Record<string, [Tier, number, number, string]>; mars: Row[]; moon: Row[] }
type Row = [name: string, code: string, lat: number, lon: number, diameter_km: number];
let ALL: TargetSummary[] | undefined, loading: Promise<TargetSummary[]> | undefined;
export const catalogue = () => loading ??= import('./targets.json').then(m => {
  const p = m.default as unknown as Packed;
  return ALL = (['mars', 'moon'] as const).flatMap(body => p[body].map(([name, code, lat, lon, d]) => {
    const [type, family] = p.codes[code], c = p.cap[`${body}|${code}`];
    return iau(body, name, type, code, family, lat, lon, d, c ? { tier: c[0], p_target_top3: c[1], n_targets: c[2], landform_class: c[3] } : null);
  }));
});
const find = (body: Body, name: string) => [...CAT, ...ALL ?? []].find(t => t.body === body && t.name!.toLowerCase() === name.toLowerCase());
// Runs f once the catalogue is in when `need` (and it isn't yet); at once otherwise, so CAT's answers keep their exact latency.
const withAll = <T>(need: boolean, f: () => Promise<T>) => need && !ALL ? catalogue().then(f, f) : f();

const rd = (x: number, d = 3) => +x.toFixed(d);
const fail = (f: Fixture, message = f.detail.message) => errorFrom(f.status, { detail: { ...f.detail, message } });
const invalid = (loc: string, msg: string) => errorFrom(422, { detail: [{ type: 'value_error', loc: ['body', loc], msg }] });
// The request as the engine echoes it back in `query`: names and coordinates both present, lon in ±180, empty filters dropped.
function norm(req: SearchRequest): Query {
  const t = req.target, lon = t.lon != null && t.lon > 180 ? t.lon - 360 : t.lon ?? null;
  const filters = Object.fromEntries(Object.entries(req.filters ?? {}).filter(([, v]) => v != null && v !== false && !(Array.isArray(v) && !v.length)));
  return { target: { body: t.body, name: t.name ?? null, lat: t.lat ?? null, lon }, purpose: req.purpose ?? 'rover_mobility', k: req.k ?? 10, filters };
}
// The surface searched: the filter's, else the purpose's (engine.py search: barren for all but education).
const surfaceOf = (q: Query) => q.filters.surface ?? purposes.purposes.find(p => p.key === q.purpose)?.surface;
// One ranking per target and surface, as the engine caches them (api.py cache_key): the purpose picks only the surface.
const sameRanking = (a: Query, b: Query) => a.target.body === b.target.body && (a.target.name ?? '').toLowerCase() === (b.target.name ?? '').toLowerCase()
  && a.target.lat === b.target.lat && a.target.lon === b.target.lon && surfaceOf(a) === surfaceOf(b);
// ?mock=empty, as the engine words it when the best shape similarity is under 0.80 (engine.py): every cosine pulled under
// it, confidence low, the summary's similarity and tier rewritten to match, and the judge's likelihood halved.
function noAnalog(r: MatchResult): MatchResult {
  if (r.explanation.summary.startsWith(NO_ANALOG)) return r;
  const cos = rd(Math.min(.79, r.raw!.shape_cosine! - .2), 4), summary = r.explanation.summary.replace(/shape similarity [\d.]+ \(\w+\)/, `shape similarity ${cos.toFixed(2)} (weak)`);
  return { ...r, fidelity: { ...r.fidelity, confidence: 'low' }, raw: { ...r.raw, shape_cosine: cos, judge_p_good: rd(r.raw!.judge_p_good! / 2, 4) },
    explanation: { ...r.explanation, summary: `${NO_ANALOG} ${summary}` } };
}

// The first k results for a query. One ranking per target and surface (the purpose picks only the surface, so the six
// barren purposes share it): the example's results for that target and surface, if one has them, then the pool's cells
// in an order seeded by the ranking (without k, so "show more" keeps the first ranks), each scored by its place in it;
// past the pool's end, the same cells again .3° further north per lap. The other filters are a hard mask over that one
// ranking, as in the engine (engine.py mask()): a filtered answer is the unfiltered one with cells taken out, each cell
// keeping its scores, and a filter no cell passes gives fewer results, or none.
// shortcut: the mask chooses among the pool's 19 cells only, so a bbox away from them comes back empty; the engine's
// 500,127 cells fill it at the merge.
function ranked(q: Query, t: TargetSummary, ex?: SearchResponse): MatchResult[] {
  const f = q.filters, any = surfaceOf(q) === 'any', head = ex?.results ?? [], from = head.length, ceil = head.at(-1)?.raw?.judge_p_good ?? 1;
  // Seeded as the surface's default query, so the unfiltered answers keep the order they had before purposes shared one.
  const x = rng(JSON.stringify({ target: q.target, purpose: any ? 'education' : 'rover_mobility', k: 0, filters: {} }));
  const fits = (l: NonNullable<MatchResult['location']>) => (!f.sovereigns || f.sovereigns.includes(l.sovereign!)) && (!f.access || (f.access as string[]).includes(l.access!))
    && (!f.exclude_polar || Math.abs(l.lat!) <= 60) && (!f.bbox || (l.lon! >= f.bbox[0] && l.lat! >= f.bbox[1] && l.lon! <= f.bbox[2] && l.lat! <= f.bbox[3]));
  const out = head.filter(r => fits(r.location!)).map(r => ({ ...r, purpose: q.purpose as MatchResult['purpose'] }));
  const pool = POOL.filter(r => !head.some(h => h.site_id === r.site_id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(x() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // Sub-resolution target (spec §9: features under ~600 m): the form properties can't be measured, confidence is low.
  // shortcut: decided by the target's size; the engine decides by landform type (landform_resolvability.csv).
  const sub = t.diameter_km != null && t.diameter_km < .6;
  // The pool cell b at l, at place i of the ranking (n past the example's): scored in ranking order, kept or masked.
  const scored = (b: MatchResult, l: NonNullable<MatchResult['location']>, lap: number, n: number): MatchResult => {
    const i = from + n, lat = l.lat!;
    const id = lap ? Math.round((lat + 90) * 20) * 7200 + Math.round((l.lon! + 180) * 20) + (l.surface === 'barren' ? 0 : 1e7) : +b.site_id.split('_').pop()!;
    // Scores that agree, as the engine's do: terrain_form is the rank of the shape similarity among the searched cells
    // (engine.py rr(form)), so near the top it's a match; the other five scatter around the judge's likelihood, which
    // falls with rank (results are ordered by it); the shape cosine follows their mean.
    // Past an example's ranks, under its last judge (`ceil`); never below a floor that keeps falling (a filter that
    // keeps few cells reaches far down the ranking).
    const judge = Math.max(.005 * (21 - i), .1 / (i + 1), Math.min(.95 - .02 * i, ceil - .02 * (n + 1)));
    const properties = b.properties.map(p => {
      const score = rd(Math.max(0, p.key === 'terrain_form' ? .995 - .004 * i - .01 * x() : Math.min(.999, judge - .03 + .4 * (x() - .5)))), na = sub && FORM.includes(p.key);
      return { ...p, score: na ? null : score, percentile_earth: na ? null : score, status: na ? 'not_measurable' as const : score >= .9 ? 'match' as const : score >= .6 ? 'partial' as const : 'gap' as const };
    });
    const known = properties.filter(p => p.score != null), mean = known.reduce((s, p) => s + p.score!, 0) / known.length;
    const cos = rd(.55 + .45 * mean - .01 * x(), 4), ratio = .6 + .8 * x(), labels = (s: string) => properties.filter(p => p.status === s).map(p => p.label!.toLowerCase());
    return {
      target_id: t.name ?? `${t.body}_${t.lat.toFixed(3)}_${t.lon.toFixed(3)}`, purpose: q.purpose as MatchResult['purpose'], site_id: `earth_cell_${id}`, rank: i + 1,
      fidelity: { score: rd(mean), percentile_earth: rd(1 - i * 1e-4, 4), matcher: cached.model.matcher,
        confidence: !sub && cos >= .9 ? 'high' : !sub && cos >= .8 ? 'medium' : 'low' },
      properties, location: l,
      raw: { ranking_score: rd(2 - .05 * i - .1 * x(), 4), shape_cosine: cos, relief_ratio: rd(ratio), judge_p_good: rd(judge, 4), f2s_rank: i + 1 },
      environment: b.environment,
      explanation: { summary: `${l.country} (${lat.toFixed(2)}, ${l.lon!.toFixed(2)}): shape similarity ${cos.toFixed(2)} (${cos >= .9 ? 'close' : cos >= .8 ? 'partial' : 'weak'}); relief ${ratio.toFixed(1)}x the target.`,
        strengths: labels('match'), gaps: labels('gap'),
        caveats: [...CAVEATS, ...(sub ? [subres(t.type)] : []), ...(Math.abs(lat) > 60 ? [POLAR] : []), ...(l.surface === 'rugged_extension' ? [RUGGED] : [])] },
      terrain_twins: [{ earth_url: `/api/v1/images/site/${id}.png`, ...(t.image_url ? { target_url: t.image_url } : {}) }],
    };
  };
  let n = 0;
  for (let lap = 0; lap < 20 && out.length < q.k; lap++) for (const b of pool) {
    if (out.length >= q.k) break;
    const l = { ...b.location!, lat: rd(b.location!.lat! + lap * .3) };
    if (l.surface !== 'barren' && !any) continue;   // not in this surface's ranking
    const r = scored(b, l, lap, n++);
    if (fits(l)) { CELL_AT.set(+r.site_id.split('_').pop()!, l); out.push(r); }
  }
  return out.slice(0, q.k).map((r, j) => ({ ...r, rank: j + 1 }));
}

export function mockEngine(modes: Set<string>, clock: MockClock, terrain: MockTerrain): Engine {
  const t0 = clock.now(), seen = new Set<string>();
  const warming = () => modes.has('warming') && clock.now() - t0 < 35;
  const ready = () => { if (warming()) throw fail(warmingUp); };
  // The answer is worked out when the call is made; it lands after the latency. Refusals come back at once, as from the
  // engine; an aborted call rejects at once, as fetch does.
  async function respond<T>(latency: number, answer: () => T | Promise<T>, signal?: AbortSignal): Promise<T> {
    let out: { ok: T | Promise<T> } | { err: unknown };
    try { out = { ok: answer() }; } catch (err) { out = { err }; latency = LATENCY.fast; }
    await Promise.race([clock.wait(modes.has('slow') ? LATENCY.slow : latency),
      new Promise<never>((_, no) => signal?.addEventListener('abort', () => no(new EngineError(0, 'aborted', 'The search was called off.')), { once: true }))]);
    if (modes.has('fail')) throw new EngineError(0, 'network', 'Failed to fetch');
    if ('err' in out) throw out.err;
    return out.ok;
  }

  return {
    health: () => respond<Health>(LATENCY.fast, () => warming()
      ? { status: 'warming_up', error: null, uptime_s: rd(clock.now() - t0, 1), api_version: health.api_version, matcher: health.matcher, judge: health.judge, engine_commit: health.engine_commit }
      : health as Health),
    purposes: () => respond(LATENCY.fast, () => purposes as PurposesResponse),   // answered while warming, as by the engine
    // shortcut: the pool's sovereigns with pool counts; the engine lists 188 states with their cell counts.
    sovereigns: () => respond(LATENCY.fast, () => {
      ready(); const n: Record<string, number> = {};
      for (const r of POOL) n[r.location!.sovereign!] = (n[r.location!.sovereign!] ?? 0) + 1;
      return { sovereigns: Object.keys(n).sort().map(name => ({ name, sites: n[name] })) };
    }),
    targets: (o = {}) => withAll(true, () => respond<TargetsList>(LATENCY.fast, () => {
      ready();
      const ql = o.q?.toLowerCase(), rows = (ALL ?? CAT).filter(t => (!o.body || t.body === o.body) && (!ql || t.name!.toLowerCase().includes(ql)) && (!o.family || t.family === o.family));
      if (ql) rows.sort((a, b) => +!a.name!.toLowerCase().startsWith(ql) - +!b.name!.toLowerCase().startsWith(ql) || (a.name! < b.name! ? -1 : 1));   // prefix matches first
      const off = o.offset ?? 0;
      return { total: rows.length, offset: off, targets: rows.slice(off, off + (o.limit ?? 50)) };
    })),
    target: (body, name) => withAll(!find(body, name), () => respond<TargetDetail>(LATENCY.fast, () => {
      ready(); const t = find(body, name);
      if (!t) throw fail(unknownTarget, `${body}:${name} is not an IAU-named feature in the store`);
      return t.target_id === jezero.target_id ? jezero as TargetDetail : { ...t, relief_sd_m: rd(20 + 300 * rng(t.target_id)(), 1), window: WINDOW };
    })),
    search: (req, signal) => withAll(req.target?.name != null && !find(req.target.body, req.target.name), () => {
      const q = norm(req), named = q.target.name != null, latency = named ? (Object.keys(q.filters).length ? LATENCY.live : LATENCY.fast) : LATENCY.remote;
      return respond<SearchResponse>(latency, () => {
        ready();
        if (q.purpose === 'polar_lighting_geometry') throw fail(unsupported);
        if (!purposes.purposes.some(p => p.key === q.purpose && p.supported)) throw errorFrom(422, { detail: { code: 'unknown_purpose', message: `purpose must be one of ${purposes.purposes.filter(p => p.supported).map(p => p.key).sort().join(', ')}` } });
        if (!Number.isInteger(q.k) || q.k < 1 || q.k > 20) throw invalid('k', 'Input should be between 1 and 20');
        let t: TargetSummary;
        if (named) {
          const f = find(q.target.body, q.target.name!);
          if (!f) throw fail(unknownTarget, `${q.target.body}:${q.target.name} not found; send lat/lon instead`);
          t = f;
        } else {
          const { body, lat, lon } = q.target;
          if (lat == null || lon == null) throw invalid('target', 'give either target.name or both target.lat and target.lon');
          if (body === 'moon' && Math.abs(lat) > 59.5) throw fail(noDem, `no moon DEM at (${lat}, ${lon})`);
          t = { target_id: `${body}:${lat.toFixed(4)},${lon.toFixed(4)}`, body, name: null, type: null, code: null, family: null, lat, lon, diameter_km: null,
            coordinate_source: 'user', capability: null, image_url: null };
        }
        const ex = EXAMPLES.find(e => sameRanking(q, e.query as Query)), results = ranked(q, t, ex);
        const source = named ? (latency === LATENCY.fast ? 'cache' : 'live') : 'remote';
        return { query: q, target: t, source, timing_ms: ex?.source === source ? ex.timing_ms : latency * 1000,
          model: cached.model, results: modes.has('empty') ? results.map(noAnalog) : results };
      }, signal);
    }),
    elevation: of => withAll('name' in of && !find(of.body, of.name), () => {
      const key = JSON.stringify(of);
      return respond<Elevation>(seen.has(key) || 'name' in of ? LATENCY.fast : 'cell' in of ? LATENCY.first : LATENCY.remote, () => {
        ready();
        let z: number[][] | Promise<number[][]>;
        if ('cell' in of) {
          const l = CELL_AT.get(of.cell);
          if (!l || modes.has('noimage')) throw errorFrom(404, { detail: { code: 'no_image', message: 'unknown site or Earth DEM unavailable' } });   // server.py site_elevation
          z = terrain('earth', l.lat!, l.lon!);
        } else if ('name' in of) {
          const t = find(of.body, of.name);
          if (!t) throw fail(unknownTarget, `${of.body}:${of.name} is not an IAU-named feature in the store`);
          z = terrain(of.body, t.lat, t.lon, t.name!);
        } else {
          if (of.body === 'moon' && Math.abs(of.lat) > 59.5) throw fail(noDem, `no moon DEM at (${of.lat}, ${of.lon})`);
          z = terrain(of.body, of.lat, of.lon);
        }
        seen.add(key);
        return Promise.resolve(z).then((z): Elevation => ({ ...WINDOW, units: 'm', row0: 'north', col0: 'west', z }));
      });
    }),
  };
}
