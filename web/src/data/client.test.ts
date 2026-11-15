// The data seam's search state per site, on an engine stub: one search per site, failures kept until asked again (no
// retry storm), a failed warm-up told apart from warming, bodies off the contract caught, pins pruned to 12.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineError } from './api';
import type { Site } from './sites';
import type { SearchResponse } from './types.gen';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
vi.mock('../motion', () => ({ clock: () => 0 }));
vi.mock('gsap', () => ({ default: { delayedCall: (s: number, f: () => void) => setTimeout(f, s * 1000) } }));   // the app clock, on fake timers
const engine = vi.hoisted(() => ({ search: vi.fn(), health: vi.fn(), elevation: vi.fn(), purposes: vi.fn(), sovereigns: vi.fn() }));
vi.mock('./mock', () => ({ mockEngine: () => engine }));
vi.stubGlobal('location', { search: '', hash: '' });
const { askLists, cellsOf, centreOf, doublesOf, engine: eng, imageOf, knownOf, lists, pollHealth, query, shadeOf, terrainOf, windowOf } = await import('./client');
const { noteCells } = await import('./pins');
const { EARTH_BY } = await import('./sites');
const { genTerrain, WINDOW_KM } = await import('../terrain/procedural');

const res = cachedRes as unknown as SearchResponse;
let n = 0;   // a fresh site per test: the client keeps every search for the session
const site = (): Site => ({ id: `t${n++}`, name: 'Test', iau: 'Jezero', lat: 18.38, lon: 77.58, kind: '', t: { arch: 'plains', ext: 30, base: 0, pal: 'mars' } });
const pin = (lat: number): Site => ({ ...site(), id: `@${lat.toFixed(4)},10.0000`, iau: undefined, lat, lon: 10 });

beforeEach(() => { vi.useFakeTimers(); engine.search.mockReset(); engine.health.mockReset(); engine.elevation.mockReset(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); Object.assign(query, { purpose: 'rover_mobility', filters: {} }); });

describe('doublesOf', () => {
  it('asks once per site, by IAU name or by coordinates, and keeps the answer', async () => {
    engine.search.mockResolvedValue(res);
    const s = site(), d = doublesOf('mars', s); await d.done;
    expect(d.res).toBe(res); expect(doublesOf('mars', s)).toBe(d); expect(doublesOf('mars', s, true)).toBe(d);
    expect(engine.search).toHaveBeenCalledTimes(1);
    expect(engine.search.mock.calls[0][0]).toEqual({ target: { body: 'mars', name: 'Jezero' }, purpose: 'rover_mobility', k: 5 });
    await doublesOf('mars', pin(-4.5)).done;
    expect(engine.search.mock.calls[1][0].target).toEqual({ body: 'mars', lat: -4.5, lon: 10 });
  });
  it('refuses a Moon site beyond 59.5° at once, as the engine would after its retries, with nothing sent', async () => {
    const d = doublesOf('moon', { ...pin(-59.6), iau: undefined }); await d.done;
    expect(d.err?.code).toBe('no_dem'); expect(engine.search).not.toHaveBeenCalled();
    engine.search.mockResolvedValue(res); await doublesOf('moon', pin(59.5)).done; expect(engine.search).toHaveBeenCalledTimes(1);
  });
  it('keeps a failure: nothing is sent again, however long, until asked again', async () => {
    engine.search.mockRejectedValueOnce(new EngineError(0, 'network')).mockResolvedValue(res);
    const s = site(), d = doublesOf('mars', s); await d.done;
    expect(d.err?.code).toBe('network');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(doublesOf('mars', s)).toBe(d); expect(engine.search).toHaveBeenCalledTimes(1);
    const d2 = doublesOf('mars', s, true); await d2.done;
    expect(d2).not.toBe(d); expect(d2.res).toBe(res); expect(engine.search).toHaveBeenCalledTimes(2);
  });
  it('warming_up stays warming_up while /health warms, start_failed once it says the warm-up failed', async () => {
    const warming = () => new EngineError(503, 'warming_up', 'engine is loading (~30-40 s)');
    engine.search.mockRejectedValue(warming());
    engine.health.mockResolvedValueOnce({ status: 'warming_up' }).mockResolvedValueOnce({ status: 'error', error: 'MemoryError()' });
    const s = site(), d = doublesOf('mars', s); await d.done;
    expect(d.err?.code).toBe('warming_up');
    const d2 = doublesOf('mars', s, true); await d2.done;
    expect([d2.err?.code, d2.err?.message]).toEqual(['start_failed', 'MemoryError()']);
  });
  it('while warming, notes when the engine started from its uptime (the warm-up progress)', async () => {
    engine.search.mockRejectedValue(new EngineError(503, 'warming_up'));
    engine.health.mockResolvedValue({ status: 'warming_up', uptime_s: 12.5 });
    const d = doublesOf('mars', site()); await d.done;
    expect([d.err?.code, d.t0, d.up]).toEqual(['warming_up', 0, -12.5]);   // the clock reads 0 here
    // A retry keeps it (its uptime jitters with latency), so the warming state redraws only when it changes.
    engine.health.mockResolvedValueOnce({ status: 'warming_up', uptime_s: 15.6 }).mockResolvedValueOnce({ status: 'warming_up', uptime_s: 18.7 });
    const s = site(), d1 = doublesOf('mars', s); await d1.done;
    const d2 = doublesOf('mars', s, true); await d2.done;
    expect([d1.up, d2.up]).toEqual([-15.6, -15.6]);
  });
  it('one search by coordinates at a time: a newer one calls the running one off, which is forgotten and never lands', async () => {
    const signals: AbortSignal[] = [];
    engine.search.mockImplementation((_: unknown, signal: AbortSignal) => { signals.push(signal);
      return new Promise((ok, no) => { setTimeout(() => ok(res), 6000); signal.addEventListener('abort', () => no(new EngineError(0, 'aborted'))); }); });
    const a = pin(-1), b = pin(-2), named = site(), da = doublesOf('mars', a), dn = doublesOf('mars', named), db = doublesOf('mars', b);
    expect(signals.map(x => x.aborted)).toEqual([true, false, false]);   // a by b; a search by name isn't one of them
    await da.done; expect([da.res, da.err?.code, da.busy]).toEqual([undefined, 'aborted', false]);
    await vi.advanceTimersByTimeAsync(6000);
    expect([db.res, dn.res, da.res]).toEqual([res, res, undefined]);
    const again = doublesOf('mars', a); expect(again).not.toBe(da); expect(engine.search).toHaveBeenCalledTimes(4);   // shown again: asked again
    await vi.advanceTimersByTimeAsync(6000); expect(again.res).toBe(res);
    doublesOf('mars', b, false, 20); expect(signals.at(-1)!.aborted).toBe(false);   // a finished one isn't called off
  });
  it('a body without its results list, or anything thrown, ends as bad_response and is logged', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    engine.search.mockResolvedValue({ query: {} });
    const d = doublesOf('mars', site()); await d.done;
    expect([d.res, d.err?.code]).toEqual([undefined, 'bad_response']); expect(log).toHaveBeenCalledTimes(1);
  });
  it('logs the requests the engine refuses as malformed (spec §6: a front-end bug), not engine errors', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    engine.search.mockRejectedValueOnce(new EngineError(422, 'invalid_request')).mockRejectedValueOnce(new EngineError(422, 'no_dem'));
    await doublesOf('moon', site()).done; expect(log).toHaveBeenCalledTimes(1);
    await doublesOf('moon', site()).done; expect(log).toHaveBeenCalledTimes(1);
  });
  it('show more: asks again for 20, keeping the five while it runs', async () => {
    engine.search.mockResolvedValue(res);
    const s = site(), d = doublesOf('mars', s); await d.done;
    expect(doublesOf('mars', s, false, 5)).toBe(d);   // not more than it has
    const more = doublesOf('mars', s, false, 20);
    expect([more.k, more.busy, more.res]).toEqual([20, true, res]);
    expect(engine.search.mock.calls[1][0]).toMatchObject({ k: 20 });
    await more.done; expect(more.busy).toBe(false); expect(doublesOf('mars', s)).toBe(more);
    engine.search.mockRejectedValueOnce(new EngineError(0, 'network'));
    const s2 = site(); await doublesOf('mars', s2, false, 20).done; await doublesOf('mars', s2, true).done;
    expect(engine.search.mock.calls.at(-1)![0]).toMatchObject({ k: 20 });   // Try again keeps the k it failed with
  });
  it('a failed show more keeps the five, through the failure and Try again', async () => {
    engine.search.mockResolvedValueOnce(res).mockRejectedValueOnce(new EngineError(0, 'network'));
    const s = site(); await doublesOf('mars', s).done;
    const more = doublesOf('mars', s, false, 20); await more.done;
    expect([more.err?.code, more.res]).toEqual(['network', res]);
    engine.search.mockReturnValueOnce(new Promise(() => {}));
    expect(doublesOf('mars', s, true).res).toBe(res);
  });
  it('keeps the 12 most recent pin searches', async () => {
    engine.search.mockResolvedValue(res);
    const pins = Array.from({ length: 14 }, (_, i) => pin(i));
    for (const p of pins) await doublesOf('mars', p).done;
    expect(engine.search).toHaveBeenCalledTimes(14);
    await doublesOf('mars', pins[13]).done; expect(engine.search).toHaveBeenCalledTimes(14);   // kept
    await doublesOf('mars', pins[0]).done; expect(engine.search).toHaveBeenCalledTimes(15);    // pruned: asked anew
  });
});

describe('pollHealth', () => {
  it('notes the engine warming up from boot, asking every 3 s until it is ready; down or failed is not warming', async () => {
    engine.health.mockResolvedValueOnce({ status: 'warming_up' }).mockResolvedValueOnce({ status: 'warming_up' }).mockResolvedValueOnce({ status: 'ok' });
    const p = pollHealth(); await vi.advanceTimersByTimeAsync(0); expect(eng.warming).toBe(true);
    await vi.advanceTimersByTimeAsync(6000); await p;
    expect(eng.warming).toBe(false); expect(engine.health).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(30_000); expect(engine.health).toHaveBeenCalledTimes(3);
    for (const h of [Promise.resolve({ status: 'error' }), Promise.reject(new EngineError(0, 'network'))]) {
      eng.warming = true; engine.health.mockReturnValueOnce(h); await pollHealth(); expect(eng.warming).toBe(false);
    }
  });
});

describe('the query: purpose and filters', () => {
  it('sends the purpose, and the filters only when one is set; another query is another search, each kept', async () => {
    engine.search.mockResolvedValue(res);
    const s = site(); await doublesOf('mars', s).done;
    expect(engine.search.mock.calls[0][0]).not.toHaveProperty('filters');
    Object.assign(query, { purpose: 'eva_training', filters: { sovereigns: ['United States of America'], exclude_polar: true } });
    const d = doublesOf('mars', s); await d.done;
    expect(engine.search.mock.calls[1][0]).toEqual({ target: { body: 'mars', name: 'Jezero' }, purpose: 'eva_training', k: 5,
      filters: { sovereigns: ['United States of America'], exclude_polar: true } });
    query.filters = { exclude_polar: true, sovereigns: ['United States of America'] };   // the same filters in another order
    expect(doublesOf('mars', s)).toBe(d);
    Object.assign(query, { purpose: 'rover_mobility', filters: {} });
    await doublesOf('mars', s).done; expect(engine.search).toHaveBeenCalledTimes(2);   // the first search, kept
  });
  it('the purposes and countries are checked, kept, and what failed is asked again next time', async () => {
    engine.purposes.mockResolvedValue({ purposes: [{ key: 'rover_mobility', label: 'Rover mobility', surface: 'barren', description: 'Drive.', supported: true },
      { key: 'polar_lighting_geometry', label: 'Polar lighting geometry', surface: null, description: 7, supported: 'no' }, { key: 3, label: 'x' }, null] });
    engine.sovereigns.mockRejectedValueOnce(new EngineError(503, 'warming_up')).mockResolvedValue({ sovereigns: [{ name: 'Chile', sites: 4 }, { name: 5 }] });
    await askLists();
    expect(lists.purposes).toEqual([{ key: 'rover_mobility', label: 'Rover mobility', description: 'Drive.', surface: 'barren', supported: true },
      { key: 'polar_lighting_geometry', label: 'Polar lighting geometry', description: '', surface: null, supported: false }]);
    expect(lists.sovereigns).toBeUndefined();
    await askLists();
    expect(lists.sovereigns).toEqual(['Chile']); expect(engine.purposes).toHaveBeenCalledTimes(1);
  });
});

describe('knownOf', () => {
  it('a featured site without elevation data falls back to its curated analog sites; pins and other outcomes to none', async () => {
    engine.search.mockRejectedValue(new EngineError(422, 'no_dem'));
    const s = { ...site(), iau: undefined, doubles: ['haughton', 'maunakea'] }, d = doublesOf('moon', s); await d.done;
    expect(knownOf(s, d)).toEqual(['haughton', 'maunakea']);
    const p = pin(-85), dp = doublesOf('moon', p); await dp.done;
    expect(knownOf(p, dp)).toEqual([]);
    engine.search.mockReset(); engine.search.mockRejectedValue(new EngineError(0, 'network'));
    const f = { ...s, id: `t${n++}` }, df = doublesOf('moon', f); await df.done;
    expect(knownOf(f, df)).toEqual([]);
    expect(knownOf(s, { k: 5, busy: true, done: Promise.resolve(), t0: 0 })).toEqual([]);   // still searching
  });
});

describe('cellsOf', () => {
  it('the results with a location, each under its Earth pin id', () => {
    const [a, b] = res.results;
    const out = cellsOf({ ...res, results: [a, { ...b, location: undefined }, { ...b, location: { lat: NaN, lon: 3 } }, b] });
    expect(out.map(x => [x.r.site_id, x.id])).toEqual([[a.site_id, '@34.6750,-105.0750'], [b.site_id, '@-29.7250,124.0250']]);
  });
});

describe('images', () => {
  it('only the engine\'s two image paths name a window', () => {
    expect(windowOf('/api/v1/images/site/477151.png')).toEqual({ cell: 477151 });
    expect(windowOf('/images/site/52391.png')).toEqual({ cell: 52391 });
    expect(windowOf('/api/v1/images/target/moon/Rima Hadley.png')).toEqual({ body: 'moon', name: 'Rima Hadley' });
    expect(windowOf('/api/v1/images/target/mars/Utopia%20Planitia.png')).toEqual({ body: 'mars', name: 'Utopia Planitia' });
    for (const u of ['javascript:alert(1)', 'https://example.com/api/v1/images/site/1.png', '/api/v1/images/site/../1.png', '/api/v1/images/site/1.png?x',
      '/api/v1/images/target/earth/X.png', '/api/v1/images/target/mars/%E0%A4%A.png', '//example.com/images/site/1.png'])
      expect(windowOf(u), u).toBeNull();
  });
  it('any other URL is refused as no_image', async () => {
    await expect(imageOf('javascript:alert(1)')).rejects.toMatchObject({ code: 'no_image' });
  });
});

describe('terrainOf (the compare\'s windows)', () => {
  const flat = (h: number) => ({ size_px: 94, pixel_m: 200, extent_km: 18.8, units: 'm', row0: 'north', col0: 'west', z: Array.from({ length: 94 }, () => Array<number>(94).fill(h)) });
  it('a target: its frontend terrain until the engine\'s window lands, then that window, asked once by name or point', async () => {
    let land!: (e: unknown) => void; engine.elevation.mockReturnValueOnce(new Promise(r => { land = r; }));
    const s = site(), a = terrainOf('mars', s);
    expect(a.T).toBe(genTerrain('mars', s, WINDOW_KM)); expect(a.wait).toBeInstanceOf(Promise);
    expect(engine.elevation).toHaveBeenCalledWith({ body: 'mars', name: 'Jezero' });
    land(flat(-2600)); await a.wait;
    const b = terrainOf('mars', s);
    expect([b.wait, b.T.N, b.T.min, b.T.engine, b.T.pal]).toEqual([undefined, 94, -2600, false, 'mars']);   // the mock's window: not the engine's
    expect(terrainOf('mars', s).T).toBe(b.T); expect(engine.elevation).toHaveBeenCalledTimes(1);
    engine.elevation.mockResolvedValueOnce(flat(0)); terrainOf('mars', pin(-4.5));
    expect(engine.elevation).toHaveBeenLastCalledWith({ body: 'mars', lat: -4.5, lon: 10 });
  });
  it('a named target\'s window is centred where its search says the target is (its IAU centre); a pin\'s on itself', async () => {
    let land!: (r: SearchResponse) => void; engine.search.mockReturnValueOnce(new Promise(r => { land = r; })).mockResolvedValue(res);
    engine.elevation.mockReturnValue(new Promise(() => {}));
    const s = { ...site(), iau: `Named ${n++}` }, d = doublesOf('mars', s), c = { lat: 18.4082, lon: 77.6873 };   // the Jezero example's target
    expect(centreOf('mars', s)).toBe(s); expect(terrainOf('mars', s).T).toBe(genTerrain('mars', s, WINDOW_KM));
    land(res); await d.done;
    expect(centreOf('mars', s)).toEqual(c); expect(terrainOf('mars', s).T).toBe(genTerrain('mars', s, WINDOW_KM, c));
    const p = pin(5 + n++); await doublesOf('mars', p).done;
    expect(centreOf('mars', p)).toBe(p);
    const f = { ...site(), iau: `Named ${n++}`, iauAt: { lat: 1, lon: 2 } };   // a featured site: its IAU centre before its search lands
    expect(centreOf('mars', f)).toBe(f.iauAt);
  });
  it('a failure or a window that isn\'t one keeps the frontend\'s terrain, and isn\'t asked again', async () => {
    engine.elevation.mockRejectedValueOnce(new EngineError(422, 'no_dem')).mockResolvedValueOnce({ z: [[1]] });
    const s = { ...site(), iau: undefined, lat: 30 + n++ / 1000 }, a = terrainOf('moon', s); await a.wait;
    expect(terrainOf('moon', s)).toEqual({ T: genTerrain('moon', s, WINDOW_KM) });
    const p = pin(3 + n++), b = terrainOf('mars', p); await b.wait;
    expect(terrainOf('mars', p)).toEqual({ T: genTerrain('mars', p, WINDOW_KM) }); expect(engine.elevation).toHaveBeenCalledTimes(2);
    const q = { ...site(), iau: undefined, lat: -86 + n++ / 1000 }; await terrainOf('moon', q).wait;   // past 59.5°: refused unasked
    expect(terrainOf('moon', q)).toEqual({ T: genTerrain('moon', q, WINDOW_KM) }); expect(engine.elevation).toHaveBeenCalledTimes(2);
  });
  it('warming_up and a network failure are asked again every 3 s, for a minute, until the window lands', async () => {
    engine.elevation.mockRejectedValueOnce(new EngineError(503, 'warming_up')).mockRejectedValueOnce(new EngineError(0, 'network')).mockResolvedValueOnce(flat(5));
    const s = { ...site(), iau: undefined, lat: 30 + n++ / 1000 }, a = terrainOf('mars', s);
    await vi.advanceTimersByTimeAsync(2999); expect(engine.elevation).toHaveBeenCalledTimes(1); expect(terrainOf('mars', s).wait).toBe(a.wait);
    await vi.advanceTimersByTimeAsync(3001); await a.wait;
    expect(engine.elevation).toHaveBeenCalledTimes(3); expect(terrainOf('mars', s).T.min).toBe(5);
    engine.elevation.mockReset().mockRejectedValue(new EngineError(503, 'warming_up'));
    const b = terrainOf('mars', pin(40 + n++)); await vi.advanceTimersByTimeAsync(120_000); await b.wait;
    expect(engine.elevation).toHaveBeenCalledTimes(21);   // the first ask and 20 more, then kept as failed
  });
  it('Earth: a pin by the cell its search placed there; an established site has no engine window', async () => {
    const r = { ...res.results[0], location: { ...res.results[0].location!, lat: 12.5, lon: -3.25 } }, id = '@12.5000,-3.2500';
    expect(terrainOf('earth', EARTH_BY.salda)).toEqual({ T: genTerrain('earth', EARTH_BY.salda, WINDOW_KM) });
    noteCells([{ ...r, site_id: 'earth_cell_12x' }]); terrainOf('earth', { ...EARTH_BY.salda, id, custom: true });   // not a cell id: nothing asked
    expect(engine.elevation).not.toHaveBeenCalled();
    engine.elevation.mockResolvedValueOnce(flat(1671)); noteCells([r]);
    const d = { ...EARTH_BY.salda, id, custom: true, t: { ...EARTH_BY.salda.t, pal: 'arid' } }; await terrainOf('earth', d).wait;
    expect(engine.elevation).toHaveBeenCalledWith({ cell: +r.site_id.split('_').pop()! });
    expect(terrainOf('earth', d).T.min).toBe(1671);
  });
  it('a target searched by coordinates gets its twin drawn from its window\'s elevation', async () => {
    engine.elevation.mockReturnValueOnce(new Promise(() => {}));
    shadeOf('mars', pin(7.5)); expect(engine.elevation).toHaveBeenLastCalledWith({ body: 'mars', lat: 7.5, lon: 10 });
    await expect(shadeOf('earth', EARTH_BY.salda)).rejects.toMatchObject({ code: 'no_image' });
  });
});
