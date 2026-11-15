// The mock engine on fake timers: it replays the engine's examples at the engine's latencies, derives the rest
// deterministically, refuses like the engine, and switches into its ?mock= modes.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineError } from './api';
import { catalogue, LATENCY, mockEngine, NO_ANALOG } from './mock';
import type { SearchRequest, SearchResponse } from './types.gen';
import cachedReq from '../../contracts/examples/api/search_named_cached.request.json';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';
import filteredReq from '../../contracts/examples/api/search_named_filtered.request.json';
import filteredRes from '../../contracts/examples/api/search_named_filtered.response.json';
import coordsReq from '../../contracts/examples/api/search_coordinates.request.json';
import coordsRes from '../../contracts/examples/api/search_coordinates.response.json';
import health from '../../contracts/examples/api/health.json';
import jezero from '../../contracts/examples/api/target_jezero.json';
import jez from '../../contracts/examples/api/targets_jez.json';
import unsupported from '../../contracts/examples/api/error_unsupported_purpose.json';

const clock = { wait: (s: number) => new Promise<void>(r => setTimeout(r, s * 1000)), now: () => Date.now() / 1000 };
// The frontend's terrain stub: a flat window at a height that names the place asked for.
const terrain = vi.fn((_b: string, lat: number, lon: number) => Array.from({ length: 94 }, () => Array<number>(94).fill(lat * 1000 + lon)));
const mock = (...modes: string[]) => mockEngine(new Set(modes), clock, terrain);
const gale = { target: { body: 'mars', name: 'Gale' }, purpose: 'rover_mobility', k: 5 } as SearchRequest;
const pin = (body: 'mars' | 'moon', lat: number, lon: number, k = 5) => ({ target: { body, lat, lon }, purpose: 'rover_mobility', k }) as SearchRequest;
// A call's state as fake time advances.
function track<T>(p: Promise<T>) {
  const s: { done: boolean; ok?: T; err?: EngineError } = { done: false };
  p.then(ok => Object.assign(s, { done: true, ok }), err => Object.assign(s, { done: true, err }));
  return s;
}
async function lands<T>(p: Promise<T>, ms: number) {
  const s = track(p);
  await vi.advanceTimersByTimeAsync(ms - 1); expect(s.done, `still pending at ${ms - 1} ms`).toBe(false);
  await vi.advanceTimersByTimeAsync(1); expect(s.done, `landed at ${ms} ms`).toBe(true);
  return s;
}
const run = async <T>(p: Promise<T>) => { const s = track(p); await vi.advanceTimersByTimeAsync(LATENCY.slow * 1000); return s; };
async function refuses(p: Promise<unknown>, status: number, code: string) {
  const s = await lands(p, 20); expect(s.err).toBeInstanceOf(EngineError); expect([s.err!.status, s.err!.code]).toEqual([status, code]); return s.err!;
}

beforeAll(() => catalogue());   // the lazy chunk, in before the fake clock: then every answer keeps its exact latency
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('replays the engine examples at the engine latencies', () => {
  it('a cached name in 20 ms', async () => expect((await lands(mock().search(cachedReq as SearchRequest), 20)).ok).toEqual(cachedRes));
  it('a name with filters in 0.3 s', async () => expect((await lands(mock().search(filteredReq as SearchRequest), 300)).ok).toEqual(filteredRes));
  it('coordinates in 6 s', async () => expect((await lands(mock().search(coordsReq as SearchRequest), 6000)).ok).toEqual(coordsRes));
  it('targets and target detail in 20 ms', async () => {
    expect((await lands(mock().targets({ q: 'jez' }), 20)).ok).toEqual(jez);
    expect((await lands(mock().target('mars', 'jezero'), 20)).ok).toEqual(jezero);
    expect((await lands(mock().health(), 20)).ok).toEqual(health);
  });
});

describe('derives what no example answers', () => {
  it('the same answer to the same query', async () => {
    const a = (await lands(mock().search(gale), 20)).ok!, b = (await run(mock().search(gale))).ok!;
    expect(a).toEqual(b); expect(a.source).toBe('cache'); expect(a.target.name).toBe('Gale');
  });
  it('"show more" keeps the first ranks, also past an example', async () => {
    const five = (await run(mock().search(gale))).ok!, twenty = (await run(mock().search({ ...gale, k: 20 }))).ok!;
    expect(twenty.results.slice(0, 5)).toEqual(five.results);
    const ex = (await run(mock().search({ ...(cachedReq as SearchRequest), k: 12 }))).ok!;
    expect(ex.results.slice(0, 5)).toEqual(cachedRes.results); expect(ex.query.k).toBe(12);
  });
  it('a search called off rejects as aborted at once, not after its 6 s', async () => {
    const stop = new AbortController(), s = track(mock().search(pin('mars', 10, 20), stop.signal));
    await vi.advanceTimersByTimeAsync(1000); expect(s.done).toBe(false);
    stop.abort(); await vi.advanceTimersByTimeAsync(0);
    expect([s.done, s.err?.code]).toEqual([true, 'aborted']);
  });
  it('a pin takes 6 s and names its target as the engine does', async () => {
    const res = (await lands(mock().search(pin('mars', 18.38, 77.58)), 6000)).ok!;
    expect(res.source).toBe('remote'); expect(res.target.target_id).toBe('mars:18.3800,77.5800');
    expect(res.results[0].target_id).toBe('mars_18.380_77.580'); expect(res.results[0].terrain_twins![0].target_url).toBeUndefined();
  });
  it('filters choose among the cells that fit', async () => {
    const res = (await run(mock().search({ ...gale, filters: { access: ['partner'], exclude_polar: true } }))).ok!;
    expect(res.source).toBe('live');
    for (const r of res.results) { expect(r.location!.access).toBe('partner'); expect(Math.abs(r.location!.lat!)).toBeLessThanOrEqual(60); }
  });
  it('filters are a hard mask, as in the engine: never a cell outside them, none when no cell passes', async () => {
    const search = async (filters: SearchRequest['filters'], k = 5) => (await run(mock().search({ ...gale, k, filters }))).ok!.results;
    const sw = await search({ bbox: [-125, 30, -100, 45] }, 20);   // the US south-west
    expect(sw).toHaveLength(20);
    for (const { location: l } of sw) expect(l!.lon! >= -125 && l!.lon! <= -100 && l!.lat! >= 30 && l!.lat! <= 45).toBe(true);
    expect((await search({ bbox: [-25, 63, -13, 67] }))).toEqual([]);   // Iceland: no cell of the mock's
    expect((await search({ access: ['antarctic_treaty'] }))).toEqual([]);
    expect((await search({ sovereigns: ['Canada'], exclude_polar: true }))).toEqual([]);   // its only cell is at 75° N
    expect((await search({ sovereigns: ['Canada'] })).map(r => r.location!.country)).toEqual(Array(5).fill('Canada'));
    expect((await search({ bbox: [-125, 30, -100, 45] }, 5))).toEqual(sw.slice(0, 5));   // "show more" keeps the first ranks
  });
  it('rugged extension cells only for education or surface "any", with the engine\'s caveat', async () => {
    const rugged = (res: SearchResponse) => res.results.filter(r => r.location!.surface === 'rugged_extension');
    const edu = (await run(mock().search({ ...gale, purpose: 'education', k: 20 }))).ok!;
    expect(rugged(edu)).not.toHaveLength(0);
    for (const r of rugged(edu)) expect(r.explanation.caveats!.some(c => c.startsWith('Rugged non-barren land'))).toBe(true);
    expect(rugged((await run(mock().search({ ...gale, k: 20, filters: { surface: 'any' } }))).ok!)).not.toHaveLength(0);
    expect(rugged((await run(mock().search({ ...gale, k: 20 }))).ok!)).toHaveLength(0);
    expect(rugged((await run(mock().search({ ...gale, purpose: 'education', k: 20, filters: { surface: 'barren' } }))).ok!)).toHaveLength(0);   // barren overrides education's any
  });
  it('one ranking per target and surface, as the engine caches them: the barren purposes give the same doubles, the purpose echoed', async () => {
    const strip = (res: SearchResponse) => res.results.map(({ purpose: _, ...r }) => r);
    for (const req of [cachedReq as SearchRequest, gale, pin('mars', 47.2, 184.3)]) {
      const rover = (await run(mock().search({ ...req, purpose: 'rover_mobility' }))).ok!;
      for (const purpose of ['drill_isru', 'eva_training', 'habitat_ops', 'astrobiology', 'thermal'] as const) {
        const res = (await run(mock().search({ ...req, purpose }))).ok!;
        expect(res.results.map(r => r.site_id)).toEqual(rover.results.map(r => r.site_id));
        expect(strip(res)).toEqual(strip(rover));
        expect([res.query.purpose, ...new Set(res.results.map(r => r.purpose))]).toEqual([purpose, purpose]);
      }
      // A surface filter is the other surface's ranking: rover mobility on any land is education's.
      const edu = (await run(mock().search({ ...req, purpose: 'education' }))).ok!, any = (await run(mock().search({ ...req, filters: { surface: 'any' } }))).ok!;
      expect(strip(any)).toEqual(strip(edu));
    }
  });
  it('the other filters only take cells out of that ranking: the unfiltered order, each cell\'s scores unchanged', async () => {
    const all = (await run(mock().search({ ...(cachedReq as SearchRequest), k: 20 }))).ok!.results;
    const area = [-154.48, -3.07, -55.67, 69.6] as [number, number, number, number];   // the compare-area capture's Earth in view
    const masks: [SearchRequest['filters'], (l: NonNullable<typeof all[0]['location']>) => boolean][] = [
      [{ exclude_polar: true }, l => Math.abs(l.lat!) <= 60], [{ access: ['partner'] }, l => l.access === 'partner'],
      [{ bbox: area }, l => l.lon! >= area[0] && l.lat! >= area[1] && l.lon! <= area[2] && l.lat! <= area[3]],
      [{ sovereigns: ['Australia'], exclude_polar: true }, l => l.sovereign === 'Australia']];
    for (const [filters, keeps] of masks) {
      const res = (await run(mock().search({ ...(cachedReq as SearchRequest), k: 20, filters }))).ok!.results, kept = all.filter(r => keeps(r.location!));
      expect(res.map(r => r.rank)).toEqual(res.map((_, i) => i + 1));
      expect(res.slice(0, kept.length).map(({ rank: _, ...r }) => r)).toEqual(kept.map(({ rank: _, ...r }) => r));
      for (const r of res) expect(keeps(r.location!)).toBe(true);
    }
    // Jezero's first double (34.675° N, 105.075° W) stays first inside an area round it, with its scores.
    expect((await run(mock().search({ ...(cachedReq as SearchRequest), filters: { bbox: area } }))).ok!.results[0]).toEqual(cachedRes.results[0]);
  });
  it('cells inside established analog sites (Hanksville, Pilbara) among the Rima Hadley doubles', async () => {
    const res = (await run(mock().search({ ...gale, k: 12, target: { body: 'moon', name: 'Rima Hadley' } }))).ok!;   // past its example's five US cells
    expect(res.results.map(r => [r.location!.lat, r.location!.lon])).toEqual(expect.arrayContaining([[38.425, -110.775], [-21.225, 119.425]]));
  });
  it('past an example\'s five, the judge keeps falling from its last (the Rima Hadley example\'s 0.71, the coordinates one\'s 0.24)', async () => {
    for (const req of [filteredReq, coordsReq]) {
      const js = (await run(mock().search({ ...(req as SearchRequest), k: 20 }))).ok!.results.map(r => r.raw!.judge_p_good!);
      expect(js).toHaveLength(20);
      js.forEach((j, n) => { expect(j).toBeGreaterThan(0); if (n) expect(j).toBeLessThan(js[n - 1]); });
    }
  });
  it('a sub-resolution target: form properties not measurable (null scores), confidence low, the caveat', async () => {
    const res = (await run(mock().search({ ...gale, target: { body: 'moon', name: 'Shorty' } }))).ok!;
    for (const r of res.results) {
      const na = r.properties.filter(p => p.status === 'not_measurable');
      expect(na.map(p => p.key)).toEqual(['terrain_form', 'landform_polarity', 'landform_scale']);
      for (const p of na) { expect(p.score).toBeNull(); expect(p.percentile_earth).toBeNull(); }
      expect(r.fidelity.confidence).toBe('low');
      expect(r.explanation.caveats).toContain("Target landform type 'Astronaut-named features' is below 200 m resolvability: form-based properties are not measurable.");
    }
  });
  it('scores that agree, by the engine\'s rules: landform shape a match, confidence and tier word from the cosine, judge falling with rank and in line with the mean', async () => {
    const searches = [{ ...gale, k: 20 }, { ...gale, k: 20, target: { body: 'moon', name: 'Rima Hadley' } }, { ...(cachedReq as SearchRequest), k: 20 }] as SearchRequest[];
    for (const req of searches) {
      const res = (await run(mock().search(req))).ok!;
      expect(res.results).toHaveLength(20);
      res.results.forEach((r, n) => {
        const cos = r.raw!.shape_cosine!, j = r.raw!.judge_p_good!, five = (p: number) => Math.round(p * 5);
        expect(r.properties.find(p => p.key === 'terrain_form')!.status).toBe('match');
        expect(r.explanation.strengths).toContain('landform shape');
        expect(r.fidelity.confidence).toBe(cos >= .9 ? 'high' : cos >= .8 ? 'medium' : 'low');
        expect(r.explanation.summary).toContain(`shape similarity ${cos.toFixed(2)} (${cos >= .9 ? 'close' : cos >= .8 ? 'partial' : 'weak'})`);
        expect(Math.abs(five(j) - five(r.fidelity.score!))).toBeLessThanOrEqual(1);
        if (n) expect(j).toBeLessThan(res.results[n - 1].raw!.judge_p_good!);
      });
    }
  });
  it('the catalogue: the engine\'s named targets, the featured ones as the mock answers them at once, any name searchable', async () => {
    const all = await catalogue(), m = mock();
    expect(all.length).toBe(3848);
    for (const [body, name] of [['mars', 'Jezero'], ['mars', 'Gale'], ['mars', 'Utopia Planitia'], ['mars', 'Nirgal Vallis'], ['moon', 'Rima Hadley'],
      ['moon', 'Taurus Littrow Valley'], ['moon', 'Mons Hadley'], ['moon', 'Shorty']] as const) expect((await run(m.target(body, name))).ok).toMatchObject(all.find(t => t.name === name)!);
    const r = (await lands(m.search({ ...gale, target: { body: 'mars', name: 'Jezero Mons' } }), 20)).ok!;
    expect([r.source, r.target.lat, r.target.capability?.landform_class, r.results.length]).toEqual(['cache', 18.16, 'mountain', 5]);
    expect((await run(m.targets({ body: 'moon', q: 'hadley', limit: 3 }))).ok!.targets.map(t => t.name)).toEqual(['Mons Hadley', 'Mons Hadley Delta', 'Rima Hadley']);
  });
  it('targets in every capability tier the banner needs', async () => {
    const tiers = (await run(mock().targets())).ok!.targets.map(t => t.capability?.tier);
    expect(tiers).toEqual(expect.arrayContaining(['good', 'fair', 'weak', undefined]));
  });
});

describe('refuses like the engine, at once', () => {
  it('no Moon elevation beyond 59.5°, as windows.py', async () => {
    expect((await refuses(mock().search(pin('moon', -85, 30)), 422, 'no_dem')).message).toBe('no moon DEM at (-85, 30)');
    await refuses(mock().elevation({ body: 'moon', lat: 59.6, lon: 0 }), 422, 'no_dem');
    expect((await run(mock().search(pin('moon', 59.5, 30)))).ok).toBeDefined();
  });
  it('unknown names, purposes and k', async () => {
    await refuses(mock().search({ ...gale, target: { body: 'mars', name: 'Not A Crater' } }), 404, 'unknown_target');
    await refuses(mock().target('moon', 'Malapert'), 404, 'unknown_target');
    expect((await refuses(mock().search({ ...gale, purpose: 'polar_lighting_geometry' as never }), 422, 'unsupported_purpose')).message).toBe(unsupported.detail.message);
    await refuses(mock().search({ ...gale, purpose: 'sightseeing' as never }), 422, 'unknown_purpose');
    await refuses(mock().search({ ...gale, k: 21 }), 422, 'invalid_request');
  });
});

describe('?mock= modes', () => {
  it('slow: every call takes 10 s', async () => { await lands(mock('slow').search(gale), 10_000); await lands(mock('slow').purposes(), 10_000); });
  it('fail: every call rejects as if the engine were down', async () => {
    for (const s of [track(mock('fail').search(gale)), track(mock('fail').health())]) {
      await vi.advanceTimersByTimeAsync(100); expect([s.err?.status, s.err?.code]).toEqual([0, 'network']);
    }
  });
  it('empty: low confidence and "No close analog"', async () => {
    for (const req of [cachedReq as SearchRequest, gale]) {
      const res = (await run(mock('empty').search(req))).ok as SearchResponse;
      for (const r of res.results) {
        const cos = r.raw!.shape_cosine!;
        expect(r.fidelity.confidence).toBe('low'); expect(r.explanation.summary.startsWith(NO_ANALOG)).toBe(true);
        expect(cos).toBeLessThan(.8); expect(r.explanation.summary).toContain(`shape similarity ${cos.toFixed(2)} (weak)`);
      }
    }
  });
  it('warming: 503 warming_up for 35 s; health says so; purposes answer throughout', async () => {
    const m = mock('warming'), t0 = Date.now();
    expect((await run(m.search(gale))).err?.code).toBe('warming_up');
    expect((await run(m.health())).ok?.status).toBe('warming_up');
    expect((await run(m.purposes())).ok?.purposes).toHaveLength(8);
    await vi.advanceTimersByTimeAsync(t0 + 34_980 - Date.now());
    expect((await lands(m.search(gale), 20)).err?.status).toBe(503);   // asked at 34.98 s
    expect((await lands(m.search(gale), 20)).ok?.results).toHaveLength(5);
    expect((await run(m.health())).ok).toEqual(health);
  });
});

describe('elevation', () => {
  it('94 × 94 at 200 m, north row first; a point takes 6 s the first time, then 20 ms', async () => {
    const m = mock(), z = (await lands(m.elevation({ body: 'mars', lat: 18.38, lon: 77.58 }), 6000)).ok!;
    expect([z.size_px, z.pixel_m, z.extent_km, z.row0, z.col0, z.z.length, z.z[93].length]).toEqual([94, 200, 18.8, 'north', 'west', 94, 94]);
    expect((await lands(m.elevation({ body: 'mars', lat: 18.38, lon: 77.58 }), 20)).ok).toEqual(z);
    await lands(m.elevation({ cell: 477151 }), 2000);
    await lands(m.elevation({ body: 'mars', name: 'Jezero' }), 20);
  });
  it('holds the frontend\'s terrain of the place: a name at its IAU centre, a cell at its location', async () => {
    const m = mock(); terrain.mockClear();
    await lands(m.elevation({ body: 'mars', name: 'jezero' }), 20);
    expect(terrain).toHaveBeenLastCalledWith('mars', jezero.lat, jezero.lon, 'Jezero');
    const cell = (cachedRes as unknown as SearchResponse).results[0], z = (await lands(m.elevation({ cell: +cell.site_id.split('_').pop()! }), 2000)).ok!;
    expect(terrain).toHaveBeenLastCalledWith('earth', cell.location!.lat, cell.location!.lon);
    expect(z.z[50][50]).toBe(cell.location!.lat! * 1000 + cell.location!.lon!);
    // A cell from a lap past the pool's end (a derived id) resolves too; one the mock never handed out is the engine's 404.
    const far = (await run(m.search(pin('mars', 47.2, 184.3, 20)))).ok!.results[19], l = far.location!;
    await lands(m.elevation({ cell: +far.site_id.split('_').pop()! }), 2000);
    expect(terrain).toHaveBeenLastCalledWith('earth', l.lat, l.lon);
    await refuses(m.elevation({ cell: 999999999 }), 404, 'no_image');
    await refuses(m.elevation({ body: 'mars', name: 'Nowhere' }), 404, 'unknown_target');
  });
  it('?mock=noimage: every Earth cell is the engine\'s 404 no_image; targets still have theirs', async () => {
    const m = mock('noimage'), cell = (cachedRes as unknown as SearchResponse).results[0];
    await refuses(m.elevation({ cell: +cell.site_id.split('_').pop()! }), 404, 'no_image');
    await lands(m.elevation({ body: 'mars', name: 'Jezero' }), 20);
  });
});
