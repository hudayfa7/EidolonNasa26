// The result templates on the engine's own examples: no percentages of ours, every property, gap and caveat shown,
// engine strings escaped, the capability banner for fair and weak targets only.
import { describe, expect, it, vi } from 'vitest';
import type { MatchResult, SearchResponse } from '../data/types.gen';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { aridity, banner, brief, card, chips, detail, ENGINE_SRC, failure, fractions, legend, matchLine, mixText, noAnalog, noData, NO_SHADE, placeTag, existingBlock, bookingFit, purposeLabel, purposeText, reading, rough, searchSay, skeleton, targetNote, terrainNote, text, twins, unlistedNote, warming, windowNote } = await import('./results');

describe('windowNote (the compare caption when the window leaves out the site)', () => {
  it('Hadley: the window on Rima Hadley, about 18 km south-west of the Apollo 15 landing site', () => {
    expect(windowNote('moon', { lat: 26.13, lon: 3.63, iau: 'Rima Hadley', note: 'Apollo 15 landing site' }, { lat: 25.7159, lon: 3.1467 }))
      .toBe(', centred on Rima Hadley, about 18 km south-west of the Apollo 15 landing site');
  });
  it('nothing within 10 km (Jezero\'s 6.6 km), and nothing for a pin or a site without an IAU name', () => {
    expect(windowNote('mars', { lat: 18.38, lon: 77.58, iau: 'Jezero', note: 'Perseverance landing site' }, { lat: 18.4082, lon: 77.6873 })).toBe('');
    expect(windowNote('moon', { lat: 26.13, lon: 3.63 }, { lat: 25.7159, lon: 3.1467 })).toBe('');
  });
});
const { EngineError } = await import('../data/api');

const res = cachedRes as unknown as SearchResponse, r0 = res.results[0];
const prop = (key: string, score: number | null, status: string) => ({ key, label: key, score, status }) as MatchResult['properties'][number];
const EVIL = '<img src=x onerror="alert(1)">';
const evil = (r: MatchResult): MatchResult => ({ ...r, location: { ...r.location!, country: EVIL, sovereign: EVIL }, properties: r.properties.map(p => ({ ...p, label: EVIL })),
  explanation: { summary: EVIL, strengths: [EVIL], gaps: [EVIL], caveats: [EVIL] }, environment: { ...r.environment!, source: EVIL }, raw: { [EVIL]: 1 } as MatchResult['raw'] });
// The engine's capability caveat for fair and weak targets (engine.py cap_note), with its percentages.
const CAP = 'In blind tests on 17 never-used mars crater targets, the top 3 contained at least a partial analog for 53% of targets (27% of individual results; tier fair). Treat these as the best available terrain-form matches.';

describe('chips', () => {
  it('the two best-scored properties, then the weakest other one', () => {
    expect(chips(r0.properties).map(p => p.key)).toEqual(['terrain_form', 'roughness', 'landform_polarity']);
  });
  it('a gap before a property that can\'t be measured, before a partial', () => {
    const a = prop('a', .95, 'match'), b = prop('b', .91, 'match'), part = prop('p', .7, 'partial'), nm = prop('n', null, 'not_measurable'), gap = prop('g', .5, 'gap');
    expect(chips([part, a, nm, b, gap])).toEqual([a, b, gap]);
    expect(chips([part, a, nm, b])).toEqual([a, b, nm]);
    expect(chips([a, b])).toEqual([a, b]);
  });
});

describe('targetNote', () => {
  const t = res.target;   // Jezero, crater, 47.5 km across
  it('the IAU name when the site shows another, its descriptor and size, and the note past the 18.8 km window', () => {
    expect(targetNote(t, 'Jezero Crater')).toBe('<p class="fine tgt">Searched as the IAU feature Jezero · Crater · ≈ 48 km across. Larger than the 18.8 km comparison window: the search matches its central part.</p>');
    expect(targetNote({ ...t, name: 'Shorty', type: 'Astronaut-named features', diameter_km: .1132 }, 'Shorty')).toBe('<p class="fine tgt">IAU feature · Astronaut-named features · ≈ 0.1 km across.</p>');
    expect(targetNote({ ...t, diameter_km: 3560.448, type: null }, 'Jezero')).toContain('IAU feature · ≈ 3,560 km across. Larger than');
    expect(targetNote({ ...t, name: 'Statio Tranquillitatis', type: 'Statio', diameter_km: .009 }, 'Statio Tranquillitatis')).toContain('· Statio · ≈ 9 m across.');
  });
  it('nothing for a search by coordinates; engine strings escaped', () => {
    expect(targetNote({ ...t, name: null }, 'Pinned site')).toBe('');
    expect(targetNote({ ...t, name: EVIL, type: EVIL }, 'Jezero')).not.toContain('<img');
  });
});

describe('banner', () => {
  it('fair and weak targets: the share as a count of the targets tested, never a percentage', () => {
    const html = banner(res.target);
    expect(html).toContain('For crater targets, our blind tests found a good Earth analog in the top 3 for 9 of the 17 tested.');
    expect(html).not.toContain('%');
    expect(banner({ ...res.target, capability: { tier: 'weak', p_target_top3: .31, n_targets: 16, landform_class: '<b>' } })).toContain('&#60;b&#62; targets');
  });
  it('nothing for good, insufficient data or no capability', () => {
    for (const capability of [{ tier: 'good', p_target_top3: .6, n_targets: 5 }, { tier: 'insufficient data', p_target_top3: 0, n_targets: 0 }, null])
      expect(banner({ ...res.target, capability: capability as never })).toBe('');
    expect(banner(undefined)).toBe('');   // a response without its target (typed, not checked)
  });
});

describe('card', () => {
  it('rank, country, coordinates, shape match, notes, hillshade and chips; no percentages', () => {
    const html = card(r0, 'mars/jezero/compare/@34.6750,-105.0750', true);
    for (const s of ['01', 'United States of America', '34.6750° N, 105.0750° W', 'Shape match <b>High</b>', '2 notes', 'loading="lazy" data-thumb="/api/v1/images/site/477151.png"',
      'aria-current="true"', 'Landform shape', '<span class="su">Shape similarity 0.93 (close); relief 0.9× the target.</span>'])
      expect(html).toContain(s);
    expect(html).not.toContain('%');
    expect(html).not.toContain('(34.67, -105.07)');   // the engine's own coordinates: the card shows them at 4 dp
    expect(card({ ...r0, terrain_twins: [] }, 'x', false)).toContain(`<span class="th">${NO_SHADE}</span>`);   // none: the placeholder (spec §6)
  });
  it('greys a chip that can\'t be measured; the legend names every mark', () => {
    expect(card({ ...r0, properties: [prop('terrain_form', null, 'not_measurable')] }, 'x', false)).toContain('<span class="chip s-not_measurable">');
    for (const s of ['Match', 'Partial', 'Gap', 'Not measurable at 200 m', 'mk-not_measurable', 'aria-hidden="true"']) expect(legend).toContain(s);
  });
  it('tags a cell inside an established analog site', () => {
    expect(card({ ...r0, location: { ...r0.location!, lat: 38.425, lon: -110.775 } }, 'x', false)).toContain('Analog site: Hanksville');
    expect(card(r0, 'x', false)).not.toContain('Analog site');
  });
  it('escapes every engine string', () => expect(card(evil(r0), 'x', false)).not.toContain('<img src=x'));
});

describe('detail', () => {
  it('all six properties with their status, strengths and gaps, every caveat, climate, location, engine build', () => {
    const html = detail(r0, res);
    expect(html.split('<h3 class="sec">Terrain properties</h3>')[1].split('</ul>')[0].match(/<li class="s-/g)).toHaveLength(6);
    for (const s of ['Raised vs incised</span><span class="ps">Partial', 'Matches: landform shape, relief, slope, roughness · Differs: none',
      ...r0.explanation.caveats!, '12.5 °C', '337 mm/yr', 'Arid <span class="n">0.19</span>', '1,671 m a.s.l.', 'Artemis Accords signatory', 'Barren',
      'Score 0.91', 'a rough estimate: 5 of 5', 'raw.shape_cosine', '<dt>properties.relief</dt><dd>0.953, 1, 200</dd>', 'bc9477e', 'F2s-200m-v1.1',
      'landform mix at 3 km: flat 0.42, shoulder 0.15 (target flat 0.25).'])
      expect(html).toContain(s);
    expect(html).not.toContain('%');
  });
  it('says what the match covers: terrain form measured, climate modelled, the rest not assessed, and not how places look', () => {
    const html = detail(r0, res);
    for (const s of ['What this match covers', 'Terrain form at 200 m</span><span class="ps">Measured', 'Climate at the site centre</span><span class="ps">Modelled',
      'Rock type and chemistry</span><span class="ps">Not assessed', 'Subsurface and caves</span><span class="ps">Not assessed',
      'Biology and habitability</span><span class="ps">Not assessed', 'not on how the two places look'])
      expect(html).toContain(s);
  });
  it('names the nearest established analog: inside one, near one, or none within 150 km', () => {
    const at = (lat: number, lon: number) => detail({ ...r0, location: { ...r0.location!, lat, lon } }, res);
    expect(at(-24.1, -70.0)).toContain('Inside Atacama');                                  // an established site's own window
    expect(at(-24.1, -69.0)).toContain('Nearest established analog');                      // about 100 km east of it
    expect(at(-24.1, -69.0)).toMatch(/about \d+ km away/);
    expect(at(-45, 20)).toContain('None within 150 km of the 14 Eidolon lists');          // open South Atlantic
    expect(detail({ ...r0, location: { ...r0.location!, lat: undefined, lon: undefined } } as MatchResult, res)).not.toContain('Established analogs');
  });
  it('lists what Earth cannot reproduce for the target\'s own world, with sources; nothing for another body', () => {
    const mars = detail(r0, res), moon = detail(r0, { ...res, target: { ...res.target, body: 'moon' } });
    expect(mars).toContain('What Earth can’t reproduce');
    expect(mars).toContain('3.71 m/s² <span class="n">Mars</span> · 9.81 m/s² <span class="n">Earth</span>');
    expect(mars).toContain('≈ 0.64 mSv/day'); expect(mars).toContain('3 to 22 min one way');
    expect(moon).toContain('1.62 m/s² <span class="n">Moon</span>'); expect(moon).toContain('1.3 s one way');
    expect(mars).toContain('Hassler et al. 2014');
    expect(detail(r0, { ...res, target: { ...res.target, body: EVIL as 'mars' } })).not.toContain('What Earth can’t reproduce');
    expect(mars).not.toContain('%');
  });
  it('the climate fit: a verdict and a row each for temperature and dryness, apart from the terrain match, with its bands and caveat', () => {
    const html = detail(r0, res), fit = html.split('<h3 class="sec">Climate fit</h3>')[1].split('<h3 class="sec">')[0];
    expect(fit).toContain('Climate fit <b>Partial</b>');   // the example is 12.5 °C and an aridity index of 0.19
    expect(fit).toMatch(/Temperature<\/span><span class="ps">Partial<\/span><span class="pnote">This site: 12\.5 °C mean\. Mars surface, −140 to 20 °C\./);
    expect(fit).toMatch(/Dryness<\/span><span class="ps">Match<\/span><span class="pnote">This site: aridity index 0\.19\. Mars has no liquid surface water\./);
    for (const s of ['not a measured distance, and separate from the terrain match', 'NASA POWER climatology', 'Global Aridity Index v3.1', 'air against surface']) expect(fit).toContain(s);
    expect(fit).not.toContain('WorldClim');
    expect(html.indexOf('<h3 class="sec">Climate fit</h3>')).toBeGreaterThan(html.indexOf('<h3 class="sec">Terrain properties</h3>'));
    expect(fit).not.toContain('%');
    expect(detail({ ...r0, environment: null }, res)).toContain('No climate fit for this site');
    expect(detail(r0, { ...res, target: { ...res.target, body: EVIL as 'mars' } })).toContain('No climate fit for this site');
  });
  it('the mission fit: the mission\'s weighted factors with score, weight and evidence, a provisional tier, and what is not assessed never a zero', () => {
    const blk = (h: string) => h.split('<div class="mfit" data-wx>')[1].split('<div class="vcard">')[0];
    const none = blk(detail(r0, res)), nine = blk(detail(r0, res, undefined, { months: [1, 2, 3, 4, 5, 9, 10, 11, 12], busy: false }));
    for (const s of ['Mission fit of this Earth double: Rover mobility', 'Provisional tier <b>A</b>, strong', 'score 84 of 100', 'Terrain form</span><span class="ps">91 of 100 · weight 45',
      'Climate</span><span class="ps">50 of 100 · weight 10', 'Operations</span><span class="ps">Not assessed · weight 20', 'the site’s climatology is not available',
      'Gravity, pressure and radiation</span><span class="ps">N/A · weight 10', 'Doesn’t apply to a field site: gravity, pressure and radiation are the same at every site on Earth', 'see Known analogs on the site view',
      'Infrastructure</span><span class="ps">Not assessed · weight 15', 'A field site can be judged on 90 of this mission’s 100 weight, and 55 of it is assessed', 'never count as zero',
      'does not change the terrain match or the order of the results']) expect(none).toContain(s);
    for (const s of ['score 81 of 100', 'Operations</span><span class="ps">75 of 100', '9 of 12 months sit under this mission’s weather limits', 'and 75 of it is assessed']) expect(nine).toContain(s);
    expect(blk(detail(r0, res, undefined, { busy: true }))).toContain('Loading the site’s climatology');
    const hab = blk(detail({ ...r0, purpose: 'habitat_ops' } as MatchResult, res));
    for (const s of ['Mission fit of this Earth double: Habitat operations', '<b>No tier</b>: a field site reaches only 40 of this mission’s 100 weight: it needs a habitat or facility too', 'Crew</span><span class="ps">N/A · weight 45']) expect(hab).toContain(s);
    expect(hab).not.toContain('Provisional tier');
    expect(none + nine + hab).not.toContain('%');
    const html = detail(r0, res);
    expect(html.indexOf('class="mfit"')).toBeLessThan(html.indexOf('class="vcard"'));
    for (const g of ['Terrain: Earth double against the site', 'Climate: Earth double against the site', 'Site: measured on Mars', 'Earth double: location and access', 'Earth double’s climate']) expect(html).toContain(g);
    expect(detail(r0, { ...res, target: { ...res.target, body: EVIL as 'mars' } })).not.toContain('Site: measured on');
  });
  it('the shadow fit inside Operations for the missions that move over the ground: the score and its weight; not for the rest', () => {
    const blk = (h: string) => h.split('<div class="mfit" data-wx>')[1].split('<div class="vcard">')[0];
    const shadow = { fit: 82, target: [.14, .06, .01], earth: [.12, .05, 0] }, all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const rover = blk(detail(r0, res, undefined, { months: all, busy: false, shadow }));
    for (const s of ['Operations</span><span class="ps">93 of 100', 'Shadow fit 82 of 100: how closely the two windows’ shadows match with the sun 1°, 2° and 4° up', 'It carries 40 of this factor’s 100 weight']) expect(rover).toContain(s);
    expect(blk(detail(r0, res, undefined, { months: all, busy: false, shadow: null }))).toContain('Shadow fit not available: it needs both windows as real elevation');
    expect(blk(detail(r0, res, undefined, { months: all, busy: false }))).toContain('Operations</span><span class="ps">100 of 100');   // none given: the months alone
    const edu = blk(detail({ ...r0, purpose: 'education' } as MatchResult, res, undefined, { months: all, busy: false, shadow }));
    expect(edu).not.toContain('Shadow fit'); expect(edu).toContain('Operations</span><span class="ps">100 of 100');
    const only = blk(detail(r0, res, undefined, { busy: false, shadow }));   // no climatology: the shadow alone, still assessed
    expect(only).toContain('Operations</span><span class="ps">82 of 100'); expect(only).toContain('The site’s climatology is not available.');
    expect(rover + edu + only).not.toContain('%');
  });
  it('the booking flow\'s mission fit: a compact tier for the campaign\'s purpose; a warning, never a block, when marginal or worse; a facility to pair when the mission needs one', () => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], base = { body: 'mars', busy: false } as const;
    const good = bookingFit({ ...base, r: r0, purpose: 'rover_mobility', label: 'Rover mobility', months: all });
    for (const s of ['Mission fit for rover mobility', 'Provisional tier <b>A</b>, strong', 'score 88 of 100', 'Scored on terrain 91, climate partial, operations 100', 'never blocks a request', 'data-wx']) expect(good).toContain(s);
    expect(good).not.toContain('class="banner"');
    const weak = bookingFit({ ...base, r: { fidelity: { score: .3 } } as MatchResult, purpose: 'rover_mobility', label: 'Rover mobility', months: [] });
    for (const s of ['Provisional tier <b>F</b>, unsuitable', 'Rated unsuitable for rover mobility: tier F, score 21 of 100. You can still request this campaign']) expect(weak).toContain(s);
    const eva = bookingFit({ ...base, r: r0, purpose: 'eva_training', label: 'EVA training', months: all });
    for (const s of ['Mission fit for EVA training', 'EVA training puts 35 of its 100 weight on gravity, pressure, radiation and crew factors, which no field site gives', 'Pair this campaign with']) expect(eva).toContain(s);
    expect(bookingFit({ ...base, r: r0, purpose: 'astrobiology', label: 'Astrobiology', months: all })).not.toContain('Pair this campaign');
    const hab = bookingFit({ ...base, r: r0, purpose: 'habitat_ops', label: 'Habitat operations', months: all });
    expect(hab).toContain('<b>No tier</b>: a field site reaches only 40 of this mission’s 100 weight'); expect(hab).toContain('Pair this campaign with CHAPEA (NASA Johnson Space Center, Houston)');
    const none = bookingFit({ ...base, purpose: 'rover_mobility', label: 'Rover mobility', months: all });   // an established site: no search result behind it
    expect(none).toContain('<b>No tier</b>: too little of what a field site can be judged on is assessed'); expect(none).toContain('Scored on operations 100');
    expect(bookingFit({ ...base, purpose: 'rover_mobility', label: 'Rover mobility', busy: true })).toContain('Loading the site’s climatology…');
    expect(bookingFit({ ...base, purpose: 'rover_mobility', label: 'Rover mobility', months: all, shadow: { fit: 70, target: [.3, .1, 0], earth: [.2, .05, 0] } })).toContain('operations 88 (shadow fit 70)');
    expect(bookingFit({ ...base, r: r0, purpose: 'x<b>', label: '<img src=x onerror=alert(1)>', months: all })).not.toContain('<img src=x');
    expect(good + weak + eva + hab + none).not.toContain('%');
  });
  it('existing analogs above the doubles: the three best for the mission on the target\'s world, each sourced; the facility note when the mission leans on one', () => {
    const astro = existingBlock('astrobiology', 'mars'), hab = existingBlock('habitat_ops', 'mars'), moon = existingBlock('drill_isru', 'moon');
    for (const s of ['<details class="drawer grp" data-keep="analogs">', 'Known analogs<span class="nf">best: Atacama (ARADS)</span>', '<span class="rk">01</span><span class="nm">Atacama (ARADS)</span><span class="cv">84<span class="n"> of 100',
      'Field site · Hyperarid core, Atacama Desert, Chile', 'href="https://astrobiology.nasa.gov/news/nasa-tests-life-detection-drill-in-the-atacama-desert/"', 'rel="noopener"', 'The Earth doubles above are terrain matches for this exact site']) expect(astro).toContain(s);
    expect(astro).not.toContain('Facility');                                                           // astrobiology needs no facility
    expect(astro).not.toContain(' open>'); expect(existingBlock('astrobiology', 'mars', true)).toContain('data-keep="analogs" open>');
    expect(astro.match(/<li>/g)).toHaveLength(3);
    expect([...hab.matchAll(/<span class="nm">([^<]+)<\/span>/g)].map(m => m[1])).toEqual(['Concordia', 'HI-SEAS', 'CHAPEA']);   // one facility, ranked among the rest
    expect(hab).toContain('and the one facility this mission needs (it puts 60 of its 100 weight on gravity, pressure, radiation and crew)');
    expect(hab.match(/Facility ·/g)).toHaveLength(1);
    expect(moon).toContain('best: Mauna Kea (PISCES)');
    expect(moon).not.toContain('Atacama');                                                              // a Mars-only analog never for the Moon
    expect(existingBlock('rover_mobility', 'earth')).toBe('');
    expect(astro + hab + moon).not.toContain('%');
  });
  it('the analog verdict: what is strong, partial, a gap and not measurable, the climate fit, the listed analogs, what is not assessed and what it is for', () => {
    const html = detail(r0, res), v = html.split('<h3 class="sec">Analog verdict</h3>')[1].split('<h3 class="sec">')[0];
    const names = (s: string) => r0.properties.filter(p => p.status === s).map(p => p.label).join(', ') || 'none';
    for (const s of [`Strong on</dt><dd>${names('match')}`, `Partial on</dt><dd>${names('partial')}`, `Gaps</dt><dd>${names('gap')}`, `Not measurable at 200 m</dt><dd>${names('not_measurable')}`,
      'Climate fit</dt><dd>Partial <span class="n">cold and dry, apart from the terrain match', 'Listed analog sites', 'Not assessed for the Earth site</dt><dd>Rock type and chemistry, subsurface and caves, biology and habitability', 'Read at the target, not scored</dt>',
      'How it could help', 'Gravity, vacuum and radiation need other facilities', 'ground shaped like Mars’s']) expect(v).toContain(s);
    expect(html.indexOf('Analog verdict')).toBeLessThan(html.indexOf('What this match covers'));
    expect(v).not.toContain('%');
    expect(detail({ ...r0, environment: null }, res)).toContain('Climate fit</dt><dd>No climate for this site');
    expect(detail(r0, { ...res, target: { ...res.target, body: 'mars', lat: 10, lon: 10 } })).toContain('Read at the target, not scored</dt><dd>Nothing for this target');
    expect(detail(r0, { ...res, target: { ...res.target, body: 'moon' } })).toContain('ground shaped like the Moon’s');
    expect(detail(evil(r0), res)).not.toContain('<img src=x');
  });
  it('a card says when its cell is not near any of the 14 listed analog sites, and a line above the cards counts them', () => {
    const at = (lat: number, lon: number) => ({ ...r0, location: { ...r0.location!, lat, lon } }) as MatchResult;
    expect(placeTag(-45, 20)).toContain('Not near a listed analog');            // open South Atlantic
    expect(placeTag(-24.1, -70.0)).toContain('Analog site: Atacama');           // inside one: its own tag
    expect(placeTag(-24.1, -69.0)).toBe('');                                    // about 100 km from one: neither tag
    expect(unlistedNote([at(-45, 20), at(-24.1, -70), at(-60, -30)])).toContain('2 of 3 are not within 150 km of the 14 established analog sites');
    expect(unlistedNote([at(-45, 20)])).toContain('1 of 1 is not within');
    expect(unlistedNote([at(-24.1, -70)])).toBe('');
    expect(unlistedNote([{ ...r0, location: undefined } as unknown as MatchResult])).toBe('');
    expect(card(at(-45, 20), 'x', false)).toContain('Not near a listed analog');
  });
  it('the Earth site\'s surface temperature from NASA POWER beside the Moon\'s midnight value; loading, failed or not asked', () => {
    const v = { mean: 19, min: -2.4, max: 45.2 }, moon = { ...res, target: { ...res.target, body: 'moon' as const, lat: 20.0702, lon: 30.7867 } };
    const withSkin = detail(r0, moon, { busy: false, v }), blk = withSkin.split('<h3 class="sec">Surface temperature</h3>')[1].split('<h3 class="sec">')[0];
    for (const s of ['Earth site, night-time</dt><dd>−2.4 °C', 'mean daily minimum skin temperature', 'Earth site, day-time</dt><dd>45.2 °C', 'Moon, local midnight</dt><dd>−168.7 °C', 'Diviner, at Taurus–Littrow',
      'NASA POWER’s climatology, 2001 to 2025', 'Not part of the climate fit']) expect(blk).toContain(s);
    expect(withSkin).toContain('<div data-wx>');   // redraws in place when the feed lands (ui/panel.ts redrawWx)
    expect(detail(r0, moon, { busy: true })).toContain('Earth site, night-time</dt><dd>Loading…');
    expect(detail(r0, moon, { busy: false })).toContain('Earth site, night-time</dt><dd>Not available');
    expect(detail(r0, moon)).not.toContain('Surface temperature</h3>');   // no feed state, no block
    expect(detail(r0, { ...res, target: { ...res.target, body: 'mars', lat: 18.4082, lon: 77.6873 } }, { busy: false, v })).toContain('Mars</dt><dd>No surface temperature was read for this target');
    expect(detail(r0, { ...res, target: { ...res.target, body: 'moon', lat: -86, lon: 0 } }, { busy: false, v })).toContain('Target</dt><dd>No surface temperature was read');
    expect(blk).not.toContain('%');
  });
  it('the NASA values read at the target: Mars thermal inertia, the Moon\'s midnight temperature and rock abundance, with how they were read', () => {
    const at = (body: 'mars' | 'moon', lat: number, lon: number) => detail(r0, { ...res, target: { ...res.target, body, lat, lon } });
    const jezero = at('mars', 18.4082, 77.6873);
    for (const s of ['Measured at the site', 'Thermal inertia</dt><dd>321', 's<sup>−½</sup>', '255 to 403 J m<sup>−2</sup> K<sup>−1</sup> s<sup>−½</sup> in the window', 'Read at Jezero Crater, 6 km from this site', '441 of 441 pixels were valid',
      'THEMIS-derived global thermal inertia mosaic', 'Fergason', 'not part of the climate fit']) expect(jezero).toContain(s);
    const taurus = at('moon', 20.0702, 30.7867);
    for (const s of ['Surface temperature at local midnight</dt><dd>104.5 K (−168.7 °C)', 'Regolith temperature at local midnight</dt><dd>101.1 K', 'Rock abundance</dt><dd>0.009', 'Read at Taurus–Littrow', 'Diviner', 'Geosciences Node'])
      expect(taurus).toContain(s);
    expect(jezero + taurus).not.toContain('%');
  });
  it('the kind of landform searched, and the process commonly behind it, hedged and marked as inferred; nothing for an unlisted or missing type, or an evil one', () => {
    const typed = (type: unknown) => detail(r0, { ...res, target: { ...res.target, type: type as string } });
    const v = typed('Vallis');
    for (const s of ['Kind of landform searched</dt><dd>Vallis: a valley, commonly cut by flowing water or lava, or by faulting', 'inferred from its IAU descriptor, not a finding about this site']) expect(v).toContain(s);
    expect(typed('Planitia')).not.toContain('Kind of landform searched');
    expect(typed(undefined)).not.toContain('Kind of landform searched');
    expect(typed('__proto__')).not.toContain('Kind of landform searched');
    expect(typed(EVIL)).not.toContain('<img src=x');
  });
  it('Mars rock chemistry and water from the Odyssey GRS, regional, in weight percent and never as a percent sign; none for the Moon', () => {
    const at = (body: 'mars' | 'moon', lat: number, lon: number) => detail(r0, { ...res, target: { ...res.target, body, lat, lon } });
    const jezero = at('mars', 18.4082, 77.6873);
    for (const s of ['Water in the top metre</dt><dd>3.5 weight percent', '± 0.4, measured as hydrogen, read as water: ice or water bound in minerals', 'Iron</dt><dd>16.6 weight percent', 'Silicon</dt><dd>20.6 weight percent',
      'Potassium</dt><dd>0.32 weight percent', 'Chlorine</dt><dd>0.39 weight percent', 'Thorium</dt><dd>0.6 parts per million', 'Odyssey GRS element concentrations', 'Boynton et al. 2007', 'about 300 km across at the equator',
      'Read at the target, not scored</dt><dd>Thermal inertia, water and elements, the nearest cave candidate']) expect(jezero).toContain(s);
    expect(jezero).not.toContain('%');
    expect(at('moon', 20.0702, 30.7867)).not.toContain('Water in the top metre');
    expect(at('moon', 20.0702, 30.7867)).toContain('Read at the target, not scored</dt><dd>Midnight surface temperature, rock abundance, the nearest pit');
    expect(at('mars', 46.7, 117.5)).toContain('Water in the top metre</dt><dd>4.2 weight percent');   // Utopia: no thermal value, still the GRS's
  });
  it('the target\'s caves from NASA\'s catalogues: the nearest entry and the count within 100 km, a candidate never called a cave', () => {
    const at = (body: 'mars' | 'moon', lat: number, lon: number) => detail(r0, { ...res, target: { ...res.target, body, lat, lon } });
    const jezero = at('mars', 18.4082, 77.6873), taurus = at('moon', 20.0702, 30.7867), utopia = at('mars', 46.7, 117.5);
    for (const s of ['Cave entrance candidates</dt><dd>None within 100 km; nearest CC0808, 614 km away', 'of 1,062 in the catalogue', 'Mars Global Cave Candidate Catalog', 'A candidate is not a confirmed cave']) expect(jezero).toContain(s);
    for (const s of ['Lunar pits</dt><dd>None within 100 km; nearest Mare Tranquillitatis Pit, 367 km away', 'of 278 in the catalogue', 'Lunar Pit Atlas']) expect(taurus).toContain(s);
    expect(utopia).toContain('Cave entrance candidates'); expect(utopia).toContain('too few valid pixels');   // no thermal value, still a cave line
    expect(detail(r0, res)).toContain('Rock type, caves and biology are not scored');
  });
  it('no NASA value for a target away from the featured sites, or a site with no valid pixels, or the Moon\'s south pole; never invented', () => {
    const at = (body: 'mars' | 'moon', lat: number, lon: number) => detail(r0, { ...res, target: { ...res.target, body, lat, lon } });
    expect(at('mars', 10, 10)).toContain('No NASA surface value was read for this site. Values exist only for featured sites');
    expect(at('moon', -86, 0)).toContain('No NASA surface value was read for this site');
    const utopia = at('mars', 46.7, 117.5);
    expect(utopia).toContain('too few valid pixels'); expect(utopia).not.toContain('Thermal inertia</dt>');
    expect(detail(r0, { ...res, target: { ...res.target, body: EVIL as 'mars' } })).not.toContain('<h3 class="sec">Measured at the site</h3>');
  });
  it('the judge\'s likelihood only as the rough bar, never as its number', () => {
    const html = detail(r0, res);
    expect(html).not.toContain('judge_p_good');
    expect(html).not.toContain('0.9321');
  });
  it('the capability caveat without its percentages; a property\'s note under its row', () => {
    const html = detail({ ...r0, explanation: { ...r0.explanation, caveats: [CAP] }, properties: [{ ...prop('relief', .4, 'gap'), note: `${EVIL} 12%` }] }, res);
    expect(html).toContain('for 0.53 of targets (0.27 of individual results; tier fair)');
    expect(html).toContain('<span class="pnote">&#60;img src=x onerror=&#34;alert(1)&#34;&#62; 0.12</span>');
    expect(html).not.toContain('%');
  });
  it('a property that can\'t be measured is said so, in grey; a gap is shown', () => {
    const html = detail({ ...r0, properties: [prop('terrain_form', null, 'not_measurable'), prop('relief', .4, 'gap')] }, res);
    expect(html).toContain('<li class="s-not_measurable"><i class="mk mk-not_measurable" aria-hidden="true"></i><span class="pl">terrain_form</span><span class="ps">Not measurable at 200 m</span><span class="pv">—</span>');
    expect(html).toContain('<span class="ps">Gap</span>');
  });
  it('no climate data, an unknown access or status, no judge', () => {
    const html = detail({ ...r0, environment: null, location: { ...r0.location!, access: 'toString' }, properties: [prop('x', .5, 'constructor')], raw: {} }, res);
    expect(html).toContain('No climate data for this site.');
    expect(html).toContain('<dt>Access</dt><dd>—</dd>');
    expect(html).toContain('mk-none');
    expect(html).not.toContain('Match likelihood');
  });
  it('escapes every engine string', () => {
    const html = detail(evil(r0), { ...res, model: { ...res.model, engine_commit: EVIL } });
    expect(html).not.toContain('<img src=x');
  });
});

describe('twins', () => {
  it('both windows drawn from their elevation, side by side and named: the target by its site, the cell by its Earth pin', () => {
    const html = twins(r0, 'Jezero Crater', 'mars|jezero', true), l = r0.location!;
    expect(html).toContain('<img alt="Hillshade of the Jezero Crater window" data-shade="mars|jezero">');
    expect(html).toContain(`<img alt="Hillshade of the United States of America window" data-shade="earth|@${l.lat!.toFixed(4)},${l.lon!.toFixed(4)}">`);
    expect(html).toContain('<figcaption><i></i>United States of America</figcaption>');
    expect(html).not.toContain('data-thumb');   // the engine's PNGs are the cards' only
  });
  it('a result without a location is the placeholder, not an empty tile', () => {
    const html = twins({ ...r0, location: undefined }, 'X', 'mars|x', true);
    expect(html).toContain('data-shade="mars|x"'); expect(html).toContain(NO_SHADE);
  });
  it('says whose elevation they are drawn from: the engine\'s, or sample terrain', () => {
    expect(twins(r0, 'X', 'mars|x', true)).toContain('drawn from the engine’s elevation, lit from the north-west, each at its own contrast.');
    expect(twins(r0, 'X', 'mars|x', false)).toMatch(/each at its own contrast\. Drawn from sample terrain\.<span/);
    expect(twins(r0, 'X', 'mars|x', false)).not.toContain('engine’s');
    expect(twins(r0, 'X', 'mars|x', false, true)).toMatch(/Drawn from the elevation models the engine reads\.<span/);
  });
  it('escapes every engine string', () => {
    const html = twins(evil(r0), EVIL, `mars|${EVIL}`, true);
    expect(html).not.toContain('<img src=x');
  });
  it('carries what the overlay compare shows (panel.css #panel.ov): the slider note, each figure\'s world colour and dot', () => {
    const html = twins(r0, 'Jezero Crater', 'mars|jezero', false);
    expect(html).toContain('<div class="imgs twins">'); expect(html.match(/data-shade=/g)).toHaveLength(2);
    expect(html).toMatch(/<span class="ov"> Overlaid: the overlay slider sets how much of each shows\.<\/span><\/p>$/);
    expect(html).toContain('<figure style="--c:var(--mars)">'); expect(html).toContain('<figure style="--c:var(--earth)">');
    expect(html.match(/<figcaption><i><\/i>/g)).toHaveLength(2);
  });
});

describe('terrainNote', () => {
  const W = ['Mars', 'Earth'];
  it('one block, or two sharing a source: said once, as on the site view', () => {
    expect(terrainNote(['Copernicus DEM GLO-30'], ['Earth'])).toBe('Terrain: Copernicus DEM GLO-30.');
    expect(terrainNote([''], W)).toBe('Illustrative terrain.');
    expect(terrainNote(['', ''], W)).toBe('Illustrative terrain.');
    expect(terrainNote([ENGINE_SRC, ENGINE_SRC], W)).toBe('The search engine’s elevation of the window it compared, 200 m samples.');
  });
  it('the overlay\'s two blocks with different sources: each by its world, so a one-sided caveat reads against its block', () => {
    expect(terrainNote(['', 'Copernicus DEM GLO-30'], W)).toBe('Mars: illustrative terrain. Earth: Copernicus DEM GLO-30.');
    expect(terrainNote(['LOLA south polar DEM, 240 m', 'Copernicus DEM GLO-30'], ['Moon', 'Earth'])).toBe('Moon: LOLA south polar DEM, 240 m. Earth: Copernicus DEM GLO-30.');
    expect(terrainNote([ENGINE_SRC, ''], W)).toBe('Mars: the search engine’s elevation of the window it compared, 200 m samples. Earth: illustrative terrain.');
  });
});

describe('mixText', () => {
  it('either window alone at the ends, else the Earth window over the target at its share; no percent sign', () => {
    expect(mixText(0, 'Jezero Crater', 'Lake Salda')).toBe('Jezero Crater only');
    expect(mixText(100, 'Jezero Crater', 'Lake Salda')).toBe('Lake Salda only');
    expect(mixText(35, 'Jezero Crater', 'Lake Salda')).toBe('Lake Salda over Jezero Crater, at 35 percent');
  });
});

describe('formats', () => {
  it('aridity bands (spec §4, then the UNEP classes)', () => {
    expect([.01, .05, .1861, .2, .49, .5, .7].map(aridity)).toEqual(['Hyperarid', 'Arid', 'Arid', 'Semi-arid', 'Semi-arid', 'Dry sub-humid', 'Humid']);
  });
  it('the judge as 0–5 segments', () => expect([0, .09, .1, .5, .9321, 1, 1.4].map(rough)).toEqual([0, 0, 1, 3, 5, 5, 5]));
  it('percentages as the fractions they stand for', () => {
    expect(fractions('flat 42%, shoulder 5% (target flat 100 %); 12.5% more')).toBe('flat 0.42, shoulder 0.05 (target flat 1); 0.125 more');
    expect(fractions('no numbers here')).toBe('no numbers here');
  });
  it('a card\'s summary: no country and coordinates, no landform mix, no "No close analog" (the lede says it)', () => {
    for (const r of [r0, ...res.results]) expect(brief(r.explanation.summary)).toMatch(/^Shape similarity 0\.\d\d \(close\); relief \d\.\d× the target\.$/);
    expect(brief('No close analog in this region; best available. Congo (Kinshasa) (-4.30, 15.30): shape similarity 0.71 (weak); relief 2.0x the target; landform mix at 3 km: flat 9% (target flat 25%).'))
      .toBe('Shape similarity 0.71 (weak); relief 2.0× the target.');
    expect(brief('Australia (-29.73, 124.03): shape similarity 0.94 (close); relief 1.0x the target.')).toBe('Shape similarity 0.94 (close); relief 1.0× the target.');   // the mock's
    expect(brief('Something else, 30% of it <b>')).toBe('Something else, 0.3 of it &#60;b&#62;');   // another shape: fractions, escaped
    expect(brief(undefined)).toBe('—');
  });
  it('the detail\'s summary: no country and signed coordinates (Location has them), the rest kept', () => {
    const d = (summary: string) => detail({ ...r0, explanation: { ...r0.explanation, summary } } as MatchResult, res).match(/<p class="su">(.*?)<\/p>/)![1];
    expect(d('United States of America (34.67, -105.07): shape similarity 0.93 (close); relief 0.9x the target; landform mix at 3 km: flat 42%.'))
      .toBe('Shape similarity 0.93 (close); relief 0.9× the target; landform mix at 3 km: flat 0.42.');
    expect(d('No close analog in this region; best available. Congo (Kinshasa) (-4.30, 15.30): shape similarity 0.71 (weak).'))
      .toBe('No close analog in this region; best available. Shape similarity 0.71 (weak).');
  });
});

describe('copy', () => {
  it('engine strings are escaped for the page, and a summary’s percentages written as fractions', () => {
    expect(text('<b>x</b>')).toBe('&#60;b&#62;x&#60;/b&#62;');
    expect(brief('Close: 40% close')).toBe('Close: 0.4 close');
  });
  it('purposes in Eidolon\'s words by key, the engine\'s for any other, never the prototype keys', () => {
    expect(purposeLabel('drill_isru', 'Drilling / ISRU')).toBe('Drilling and ISRU');
    expect(purposeText('education', 'x')).toBe('Look-alike landforms anywhere on land, vegetated ground included.');
    expect([purposeLabel('new_one', 'New one'), purposeText('new_one', 'Field tests.')]).toEqual(['New one', 'Field tests.']);
    expect(purposeLabel('polar_lighting_geometry')).toBe('Polar lighting geometry');   // no label: from the key
    expect([purposeLabel('constructor'), purposeText('constructor')]).toEqual(['Constructor', '']);
  });
});

describe('search states', () => {
  const d = (o: object) => ({ k: 5, busy: false, done: Promise.resolve(), t0: 4.5, ...o });
  const empty = { ...res, results: res.results.map(r => ({ ...r, explanation: { ...r.explanation, summary: `No close analog in this region; best available. ${r.explanation.summary}` } })) };
  it('by source: five placeholder cards (late for the cache), a bar from when the wait began', () => {
    expect(skeleton(true)).toContain('class="results skel late" aria-hidden="true"');
    expect(skeleton(false).match(/<li>/g)).toHaveLength(5);
    expect(skeleton(false)).toContain('<p class="sr">Searching Earth…</p>');
    expect(reading(d({ busy: true }), 'Mars')).toContain('Reading Mars terrain…</p><span class="pbar"><i data-t0="4.500" data-s="10"></i>');
    expect(warming(d({ up: -12.5 }))).toContain('Starting up…</p><span class="pbar"><i data-t0="-12.500" data-s="90"></i>');
    expect(warming(d({}))).toContain('data-t0="4.500"');   // the warm-up's start unknown: from the ask
  });
  it('failures keyed on the code, anything unknown as no answer, the buttons inside', () => {
    expect(failure('start_failed', '<b>x</b>')).toBe('<div class="state"><p class="sh">The search engine failed to start</p><p class="fine">It needs a restart before Earth can be searched.</p><b>x</b></div>');
    expect(failure('unknown_purpose')).toBe(failure('invalid_request'));
    expect(failure('constructor')).toBe(failure('network'));
    expect(failure('unknown_target')).toContain('Find it under its IAU name');
    expect(failure('unsupported_purpose')).toContain('separate lighting study');
  });
  it('no elevation data, for a point or a site with its known analog sites', () => {
    expect(noData(true, false)).toContain('The search engine has no data for this point</p><p class="fine">The search engine reads Moon terrain only within 59.5° of the equator, so it can’t score Earth sites against it.');
    expect(noData(false, true)).toContain('so it can’t score these established analog sites');
  });
  it('the detection frame\'s Matching line', () => {
    expect([matchLine(d({ busy: true }), 'Mars', true), matchLine(d({ busy: true }), 'Mars', false)]).toEqual(['Reading Mars terrain', 'Searching Earth']);
    expect(matchLine(d({ res }), 'Mars', true)).toBe('Earth doubles');
    expect(matchLine(d({ res: empty }), 'Mars', true)).toBe('No close analog');
    expect(noAnalog(empty)).toBe(true); expect(noAnalog(res)).toBe(false); expect(noAnalog(undefined)).toBe(false);
    const err = (code: string) => d({ err: new EngineError(0, code as never) });
    expect(['no_dem', 'warming_up', 'network'].map(c => matchLine(err(c), 'Moon', true))).toEqual(['No elevation data', 'Engine starting up', 'Search failed']);
  });
  it('said to screen readers as it changes: running, found, failed', () => {
    expect([searchSay(d({ busy: true }), 'Mars', false), searchSay(d({ busy: true }), 'Mars', true), searchSay(d({ busy: true, res }), 'Mars', false)])
      .toEqual(['Searching Earth…', 'Reading Mars terrain… A search by coordinates takes 5 to 10 seconds.', 'Loading more doubles…']);
    expect(searchSay(d({ res }), 'Mars', false)).toBe('5 Earth doubles found. The closest: United States of America, shape match high.');
    expect(searchSay(d({ res: empty }), 'Mars', false)).toMatch(/^No close analog in this region\. 5 Earth doubles found\./);
    expect(searchSay(d({ res: { ...res, results: [] } }), 'Mars', false)).toBe('No Earth doubles match this search.');
    const err = (code: string, o = {}) => d({ err: new EngineError(0, code as never), ...o });
    expect(searchSay(err('network'), 'Mars', false)).toBe('The search engine didn’t answer.');
    expect(searchSay(err('network', { res }), 'Mars', false)).toBe('The search engine didn’t answer.');   // Show more failed: the cards stand
    expect(searchSay(err('aborted'), 'Mars', true)).toBe('');
    expect(searchSay(err('no_dem'), 'Moon', true)).toContain('only within 59.5° of the equator');
    // a warm-up asked again (busy, its start carried over) is still the one state, not "Searching Earth…" every 3 s
    expect(searchSay(err('warming_up', { up: 2 }), 'Mars', false)).toBe(searchSay(d({ busy: true, up: 2 }), 'Mars', false));
    expect(searchSay(d({}), 'Mars', false)).toBe('');
  });
});
