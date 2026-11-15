// The no-WebGL page's doubles on the engine's own example: a site's three closest, each linked to its comparison, the
// established analog sites where the engine has no elevation, and every state of a search in words, never a blank.
import { describe, expect, it, vi } from 'vitest';
import type { SearchResponse } from '../data/types.gen';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
vi.mock('../motion', () => ({ clock: () => 0, RM: false }));
vi.mock('gsap', () => ({ default: { delayedCall: () => {} } }));
vi.stubGlobal('location', { search: '', hash: '' });
const { fbDoubles } = await import('./fallback');
const { EngineError } = await import('../data/api');
const { SITE_BY } = await import('../data/sites');

const res = cachedRes as unknown as SearchResponse, jezero = SITE_BY.mars.jezero, arcadia = SITE_BY.mars.arcadia, malapert = SITE_BY.moon.malapert;
const d = (o: object) => ({ k: 5, busy: false, done: Promise.resolve(), t0: 0, ...o });

describe('a featured site\'s doubles in words', () => {
  it('the three closest, each linked to its comparison: country, point, shape match, summary', () => {
    const h = fbDoubles('mars', jezero, d({ res })), l = res.results[0].location!;
    expect(h).toContain('Closest Earth doubles:');
    expect(h.match(/<li>/g)).toHaveLength(3);
    expect(h).toContain(`<a href="#/mars/jezero/compare/@${l.lat!.toFixed(4)},${l.lon!.toFixed(4)}">United States of America</a>`);
    expect(h).toContain('34.6750° N, 105.0750° W');
    expect(h).toContain('Shape match high. Shape similarity 0.93 (close); relief 0.9× the target.');
    expect(h).not.toMatch(/\d\s?%/);
  });
  it('the IAU feature, the capability banner and the results\' notes once (spec §3.4, §5.2; caveats never hidden)', () => {
    const h = fbDoubles('mars', jezero, d({ res }));
    expect(h).toContain('Searched as the IAU feature Jezero · ');
    expect(h).toContain('<p class="banner">For crater sites');
    expect(h.match(/Terrain form only, matched at 200 m/g)).toHaveLength(1);   // the same caveat on all three, said once
    expect(h).toContain('Notes on all three: ');
  });
  it('a note on some of the three stays on its own row (spec §4, §5: caveats belong to their result)', () => {
    const rs = res.results.slice(0, 3).map((r, i) => i < 2 ? { ...r, explanation: { ...r.explanation, caveats: [...r.explanation.caveats ?? [], 'Polar site: access is seasonal.'] } } : r);
    const h = fbDoubles('mars', jezero, d({ res: { ...res, results: rs } })), rows = h.split('<li>').slice(1);
    expect(rows.map(r => r.includes('Note: Polar site: access is seasonal.'))).toEqual([true, true, false]);
    expect(h.match(/Polar site/g)).toHaveLength(2);
    expect(h.match(/Terrain form only, matched at 200 m/g)).toHaveLength(1);
  });
  it('what differs, the no-match wording, engine strings escaped', () => {
    const r0 = res.results[0], evil = '<img src=x onerror="alert(1)">';
    const r = { ...res, results: [{ ...r0, location: { ...r0.location!, country: evil }, explanation: { ...r0.explanation,
      summary: `No close analog in this region; best available. ${r0.explanation.summary}`, gaps: ['relief', 'slope'] } }] };
    const h = fbDoubles('mars', jezero, d({ res: r }));
    expect(h).toContain('No close analog in this region. The closest available:'); expect(h).toContain('Differs: relief, slope.');
    expect(h).not.toContain('<img src=x');
  });
  it('no elevation data: the site\'s established analog sites, linked, unscored', () => {
    const h = fbDoubles('moon', malapert, d({ err: new EngineError(422, 'no_dem') }));
    expect(h).toContain('only within 59.5° of the equator, so these established analog sites are unscored'); expect(h).toContain('<a href="#/moon/malapert/compare/haughton">Haughton Crater</a>, Devon Island, Canada');
    expect(h).not.toContain('Shape match');
  });
  it('every state of the search in words', () => {
    const line = (e: object | undefined, s = jezero) => fbDoubles('mars', s, e as never);
    expect(line(undefined, arcadia)).toContain('Waiting its turn: searches by coordinates run one at a time.');
    expect(line(d({ busy: true }))).toContain('Searching Earth…');
    expect(line(d({ busy: true }), arcadia)).toContain('Reading Mars terrain…');
    expect(line(d({ err: new EngineError(503, 'warming_up') }))).toContain('Search engine starting up…');
    expect(line(d({ err: new EngineError(0, 'network') }))).toContain('The search engine didn’t answer. Reload the page to try again.');
    expect(line(d({ res: { ...res, results: [] } }))).toContain('No Earth doubles match this search.');
  });
  it('a failed search still lists the site\'s established analog sites (static: they need no engine), unscored', () => {
    const h = fbDoubles('moon', malapert, d({ err: new EngineError(0, 'network') }));
    expect(h).toContain('The search engine didn’t answer. Reload the page to try again. Meanwhile, its established analog sites, unscored:');
    expect(h).toContain('<a href="#/moon/malapert/compare/haughton">Haughton Crater</a>');
    expect(fbDoubles('mars', jezero, d({ err: new EngineError(503, 'warming_up') }))).not.toContain('<ul>');   // still to come
  });
});
