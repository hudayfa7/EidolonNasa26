// The climate fit's bands, the nearest-site lookup, and that the NASA values the script read still belong to the sites the
// real-data script and the app use (scripts/fetch-surface.mjs lists its own sites).
import { describe, expect, it } from 'vitest';
import surface from './surface.gen.json';
import { ARID, CLIMATE_SRC, climateFit, COLD_C, COOL_C, kmBetween, measuredAt, NEAR_KM, powerClimate, SEMI_ARID } from './climate';
import { TARGETS } from './real-sites';
import type { MatchResult } from './types.gen';
import { parseClimate } from './weather';
import cl from '../../scripts/fixtures/power-climatology.json';

const env = (t: number, ai: number) => ({ t_mean_c: t, precip_mm: 100, aridity_index: ai, source: 'x' }) as MatchResult['environment'];

describe('climateFit', () => {
  it('cold and hyper-arid is Close, with a match on each row', () => {
    const f = climateFit(env(-18, .01))!;
    expect(f.rows.map(r => [r.key, r.status])).toEqual([['temperature', 'match'], ['dryness', 'match']]);
    expect(f.verdict).toBe('Close');
  });
  it('the band edges: at the cold limit is a match, over it partial, over the cool limit a gap; the same for aridity', () => {
    const row = (t: number, ai: number, k: 0 | 1) => climateFit(env(t, ai))!.rows[k].status;
    expect([row(COLD_C, 0, 0), row(COLD_C + .1, 0, 0), row(COOL_C, 0, 0), row(COOL_C + .1, 0, 0)]).toEqual(['match', 'partial', 'partial', 'gap']);
    expect([row(0, ARID - .01, 1), row(0, ARID, 1), row(0, SEMI_ARID - .01, 1), row(0, SEMI_ARID, 1)]).toEqual(['match', 'partial', 'partial', 'gap']);
  });
  it('a warm, humid site is Weak; one cold but wet or one dry but warm is Partial', () => {
    expect(climateFit(env(24, 1.2))!.verdict).toBe('Weak');
    expect(climateFit(env(-5, 1.2))!.verdict).toBe('Partial');
    expect(climateFit(env(30, .02))!.verdict).toBe('Partial');
  });
  it('no climate, or a missing value, is no fit (never a zero)', () => {
    expect(climateFit(null)).toBeNull();
    expect(climateFit(undefined)).toBeNull();
    expect(climateFit({ t_mean_c: null, aridity_index: .1 } as unknown as MatchResult['environment'])).toBeNull();
    expect(climateFit({ t_mean_c: 5, aridity_index: NaN } as unknown as MatchResult['environment'])).toBeNull();
  });
});

describe('powerClimate (NASA POWER in place of the engine\'s WorldClim values)', () => {
  const wc = { t_mean_c: 99, precip_mm: 9999, aridity_index: .12, source: 'WorldClim 2.1 BIO1/BIO12 (5\')' } as MatchResult['environment'];
  it('temperature and precipitation from the climatology\'s months, aridity kept, the source NASA POWER\'s', () => {
    // The recorded climatology at 34.675° N, 105.075° W: POWER's own annual figures there are T2M 13.98 °C and 0.98 mm/day.
    const e = powerClimate(wc, parseClimate(cl))!;
    expect(e.t_mean_c).toBeCloseTo(13.98, 0); expect(e.precip_mm! / 365.25).toBeCloseTo(.98, 1);
    expect(e.aridity_index).toBe(.12); expect(e.source).toBe(CLIMATE_SRC); expect(e.source).not.toContain('WorldClim');
  });
  it('until the climatology lands (or without it) no temperature or precipitation, so no fit; no environment stays none', () => {
    for (const m of [undefined, [], parseClimate(cl).map((x, i) => i === 3 ? { ...x, hi: NaN } : x)]) {
      const e = powerClimate(wc, m)!; expect([e.t_mean_c, e.precip_mm]).toEqual([null, null]); expect(climateFit(e)).toBeNull();
    }
    expect(powerClimate(null, parseClimate(cl))).toBeNull(); expect(powerClimate(undefined, parseClimate(cl))).toBeUndefined();
  });
});

describe('measuredAt', () => {
  it('a target at a featured site takes its values; the engine\'s own centre for the feature is near enough', () => {
    expect(measuredAt('mars', 18.4082, 77.6873)).toMatchObject({ id: 'jezero', thermal_inertia: 321 });
    expect(measuredAt('moon', 25.7159, 3.1467)).toMatchObject({ id: 'hadley', rock_abundance: .003 });   // Rima Hadley's IAU centre, about 28 km from the site's
    expect(measuredAt('moon', 20.0702, 30.7867)).toMatchObject({ id: 'taurus' });
  });
  it('only within the distance, only on the same world, and never for a bad input', () => {
    expect(measuredAt('mars', 18.38, 80.5)).toBeUndefined();       // about 170 km east of Jezero
    expect(measuredAt('moon', 18.38, 77.58)).toBeUndefined();      // the Moon's longitudes are not Mars's
    expect(measuredAt('earth', 18.38, 77.58)).toBeUndefined();
    expect(measuredAt('mars', undefined, 77.58)).toBeUndefined();
    expect(measuredAt('mars', 18.38, NaN)).toBeUndefined();
    expect(NEAR_KM).toBe(40);
  });
  it('a featured site with no value says why, and takes none', () => {
    expect(measuredAt('mars', 46.7, 117.5)).toMatchObject({ id: 'utopia', thermal_inertia: null, note: expect.stringContaining('too few') });
  });
  it('the Moon\'s south-pole sites are not read (no Moon elevation beyond 59.5°, and the mosaics stop at 70°)', () => {
    expect(Object.keys(surface.sites).sort()).toEqual(['arcadia', 'elysium', 'gale', 'hadley', 'jezero', 'meridiani', 'taurus', 'utopia']);
    expect(measuredAt('moon', -86, 0)).toBeUndefined();
  });
});

describe('the script\'s sites', () => {
  it('each is a featured target of real-sites.ts at the same centre', () => {
    for (const [id, s] of Object.entries(surface.sites)) {
      const t = TARGETS.find(t => t.id === id);
      expect([t?.body, t?.lat, t?.lon], id).toEqual([s.body, s.lat, s.lon]);
    }
  });
  it('distances: one degree of latitude on the Moon is about 30 km', () => {
    expect(kmBetween(0, 0, 1, 0, 1737.4)).toBeCloseTo(30.32, 1);
  });
});
