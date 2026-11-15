// The site selector grid's templates on the engine's own example: a card's three closest doubles to their comparisons,
// the established analog sites where the engine has no elevation, and every state of a search shown, never a blank.
import { describe, expect, it, vi } from 'vitest';
import type { SearchResponse } from '../data/types.gen';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
vi.mock('../motion', () => ({ clock: () => 0 }));
vi.mock('gsap', () => ({ default: { delayedCall: () => {} } }));
vi.stubGlobal('location', { search: '', hash: '' });
const { gridCard, gridDoubles, gridFail, gridHTML } = await import('./grid');
const { EngineError } = await import('../data/api');
const { query } = await import('../data/client');
const { SITE_BY } = await import('../data/sites');
const { NO_SHADE, TESTED } = await import('./results');

const res = cachedRes as unknown as SearchResponse, jezero = SITE_BY.mars.jezero, arcadia = SITE_BY.mars.arcadia, malapert = SITE_BY.moon.malapert;
const done = Promise.resolve();
const d = (o: object) => ({ k: 5, busy: false, done, t0: 1.5, ...o });
const EVIL = '<img src=x onerror="alert(1)">';

describe('a card\'s doubles', () => {
  it('the three closest, each to its comparison, as a result card\'s head: rank, notes, country, point, shape match', () => {
    const h = gridDoubles('mars', jezero, d({ res }));
    expect(h).toContain('Closest Earth doubles');
    expect(h.match(/<li>/g)).toHaveLength(3);
    const l = res.results[0].location!;
    expect(h).toContain(`data-go="mars/jezero/compare/@${l.lat!.toFixed(4)},${l.lon!.toFixed(4)}"`);
    expect(h).toContain(`loading="lazy" data-thumb="${res.results[0].terrain_twins![0].earth_url}"`);
    for (const s of [`${l.country}`, 'Shape match <b>High</b>', '<span class="sr">Rank </span>01', '2 notes', '34.6750° N, 105.0750° W']) expect(h).toContain(s);
    // Three rows a reader tells apart: each its own point (spec §5.5, 4 dp).
    expect(new Set(h.match(/<span class="ll">[^<]+/g))).toHaveProperty('size', 3);
    expect(h).not.toMatch(/\d\s?%/);
  });
  it('the IAU feature searched and the capability banner above the rows, as on the site (spec §3.4, §5.2)', () => {
    const h = gridDoubles('mars', jezero, d({ res }));   // Jezero: tier fair, 47.5 km
    expect(h).toContain('Searched as the IAU feature Jezero · ');
    expect(h).toContain('Larger than the 18.8 km comparison window: the search matches its central part.');
    expect(h).toContain('<p class="banner">For crater targets, our blind tests found a good Earth analog in the top 3 for 9 of the 17 tested.');
    expect(h.indexOf('class="banner"')).toBeLessThan(h.indexOf('<ul class="gd">'));
    const good = { ...res, target: { ...res.target, capability: { ...res.target.capability!, tier: 'good' as const } } };
    expect(gridDoubles('mars', jezero, d({ res: good }))).not.toContain('class="banner"');
  });
  it('a double without a hillshade shows the placeholder, not an empty tile', () => {
    const r = { ...res, results: [{ ...res.results[0], terrain_twins: [] }] };
    expect(gridDoubles('mars', jezero, d({ res: r }))).toContain(`<span class="th">${NO_SHADE}</span>`);
  });
  it('engine strings escaped', () => {
    const r = { ...res, results: [{ ...res.results[0], location: { ...res.results[0].location!, country: EVIL } }] };
    expect(gridDoubles('mars', jezero, d({ res: r }))).not.toContain('<img src=x');
  });
  it('the engine\'s no-match wording above them, prominently (spec §5.3)', () => {
    const r = { ...res, results: res.results.map(x => ({ ...x, explanation: { ...x.explanation, summary: `No close analog in this region; best available. ${x.explanation.summary}` } })) };
    expect(gridDoubles('mars', jezero, d({ res: r }))).toContain('<p class="lede">No close analog in this region. These are the closest available.</p>');
  });
  it('no elevation data: the site\'s established analog sites, unscored, drawn from Eidolon\'s own terrain', () => {
    const h = gridDoubles('moon', malapert, d({ err: new EngineError(422, 'no_dem') }));
    expect(h).toContain('Established analog sites'); expect(h).toContain('unscored');
    expect(h).toContain('data-go="moon/malapert/compare/haughton"'); expect(h).toContain('data-own="earth|haughton"');
    expect(h).toContain('Haughton Crater'); expect(h).not.toContain('Shape match');
  });
  it('every state of the search, with the skeleton rows while its rows are still to come', () => {
    const line = (e: object | undefined, s = jezero) => gridDoubles('mars', s, e as never);
    expect(line(undefined, arcadia)).toContain('Waiting its turn: searches by coordinates run one at a time.');
    expect(line(d({ busy: true }))).toContain('Searching Earth…');
    expect(line(d({ busy: true }), arcadia)).toContain('Reading Mars terrain…<span class="pbar"><i data-t0="1.500" data-s="10">');
    expect(line(d({ err: new EngineError(503, 'warming_up') }))).toContain('Search engine starting up…');
    expect(line(d({ err: new EngineError(0, 'network') }))).toContain('The search engine didn’t answer. Open the site to try again.');   // keyed on the code
    expect(line(d({ err: new EngineError(0, 'bad_response') }))).toContain('The answer couldn’t be read. Open the site to try again.');
    for (const e of [undefined, d({ busy: true }), d({ err: new EngineError(503, 'warming_up') })]) expect(line(e)).toContain('gd skel');
    expect(line(d({ err: new EngineError(0, 'network') }))).not.toContain('skel');   // nothing is coming
    expect(line(d({ res: { ...res, results: [] } }))).toContain('No Earth doubles match this search.');
    query.filters = { exclude_polar: true };
    expect(line(d({ res: { ...res, results: [] } }))).toContain('No Earth doubles match these filters.');
    query.filters = {};
  });
});

describe('every search of the world failed', () => {
  const net = d({ err: new EngineError(0, 'network') }), dem = d({ err: new EngineError(422, 'no_dem') });
  it('one box above the cards, keyed on the code, with Try again', () => {
    const h = gridFail([net, dem, net]);
    expect(h).toContain('The search engine didn’t answer'); expect(h).toContain('data-gretry');
    expect(gridFail([d({ err: new EngineError(503, 'start_failed') }), net])).toContain('The search engine failed to start');
  });
  it('none while any is waiting, running, warming up or answered, or when no elevation is the only answer', () => {
    for (const e of [undefined, d({ busy: true }), d({ err: new EngineError(503, 'warming_up') }), d({ res })]) expect(gridFail([net, e])).toBe('');
    expect(gridFail([dem, dem])).toBe('');
  });
});

describe('the cards and the grid', () => {
  it('a named target shows the engine\'s image of it; one by coordinates its window, else Eidolon\'s own', () => {
    expect(gridCard('mars', SITE_BY.mars.utopia)).toContain('data-thumb="/api/v1/images/target/mars/Utopia%20Planitia.png"');
    expect(gridCard('moon', malapert)).toContain('data-shade="moon|malapert" data-own="moon|malapert"');
    const h = gridCard('mars', jezero);
    expect(h).toContain('data-go="mars/jezero"'); expect(h).toContain('18.3800° N,</span> <span>77.5800° E'); expect(h).toContain('loading="lazy"');
    // Busy until its search lands; a search by coordinates (one at a time, seconds apart) announced when it does.
    expect(h).toContain('<div data-gd="jezero" aria-busy="true"></div>');
    expect(gridCard('mars', arcadia)).toContain('<div data-gd="arcadia" aria-busy="true" aria-live="polite"></div>');
  });
  it('a card per featured site, the world switch, the purpose and the tested line', () => {
    const h = gridHTML('moon');
    expect(h.match(/class="gc"/g)).toHaveLength(6);
    expect(h).toContain('data-go="moon/sites" aria-pressed="true"'); expect(h).toContain('data-go="mars/sites" aria-pressed="false"');
    expect(h).toContain('Test purpose: Rover mobility.'); expect(h).toContain(TESTED);
    expect(h).toContain('the south-pole regions list their established analog sites, unscored');
    expect(gridHTML('mars')).not.toContain('south-pole');
    expect(h).not.toMatch(/\d\s?%/);
  });
});
