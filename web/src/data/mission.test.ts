import { describe, expect, it } from 'vitest';
import { ANALOGS, bestAnalogs, cover, FACILITY_NEED, knownAnalogs, SOURCES } from './analogs';
import { APPLIES, applicableWeight, climateScore, facilityWeight, FACTOR_ORDER, missionFit, operationsScore, opsScore, PROFILES, profileOf, shadowWeight, terrainScore, tierOf } from './mission';

describe('the profiles', () => {
  it('each sums to 100, with no negative weight, and its leading factor is the one the mission exercises', () => {
    for (const [k, P] of Object.entries(PROFILES)) {
      expect(FACTOR_ORDER.reduce((n, f) => n + P[f], 0), k).toBe(100);
      for (const f of FACTOR_ORDER) expect(P[f], `${k}.${f}`).toBeGreaterThanOrEqual(0);
    }
    const lead = (k: string) => FACTOR_ORDER.reduce((a, f) => PROFILES[k][f] > PROFILES[k][a] ? f : a);
    expect([lead('rover_mobility'), lead('astrobiology'), lead('habitat_ops'), lead('thermal')]).toEqual(['terrain', 'astro', 'human', 'climate']);
  });
  it('an unknown purpose, a non-string or a prototype key takes rover mobility\'s', () => {
    for (const p of ['polar_lighting_geometry', undefined, 5, '__proto__', 'constructor']) expect(profileOf(p)).toBe(PROFILES.rover_mobility);
  });
  it('the tracks: a field site never on fidelity or human factors, a facility never on the site factors, a hybrid on all', () => {
    expect(APPLIES.field).not.toContain('fidelity'); expect(APPLIES.field).not.toContain('human');
    expect(APPLIES.facility).toEqual(['fidelity', 'human', 'infra']); expect(APPLIES.hybrid).toEqual(FACTOR_ORDER);
    expect([applicableWeight('rover_mobility', 'field'), applicableWeight('habitat_ops', 'field'), applicableWeight('habitat_ops', 'facility')]).toEqual([90, 40, 75]);
    expect([facilityWeight('habitat_ops'), facilityWeight('eva_training'), facilityWeight('astrobiology')]).toEqual([60, 35, 0]);
  });
});

describe('the factor scores', () => {
  it('terrain from the engine\'s 0–1 score, clamped; climate from the fit\'s word; operations from the months; none without the input', () => {
    expect([terrainScore(.91), terrainScore(1.2), terrainScore(-1), terrainScore(null), terrainScore(NaN)]).toEqual([91, 100, 0, null, null]);
    expect([climateScore('Match'), climateScore('Partial'), climateScore('Gap'), climateScore(undefined)]).toEqual([100, 50, 0, null]);
    expect([opsScore([1, 2, 3, 4, 5, 6]), opsScore([]), opsScore(undefined)]).toEqual([50, 0, null]);
  });
});

describe('operationsScore', () => {
  it('the months alone for a mission that does not count shadows; months and shadow weighted for those that do', () => {
    expect(operationsScore('education', [1, 2, 3, 4, 5, 6], 100)).toBe(50);          // shadow ignored: weight 0
    expect(operationsScore('thermal', [1, 2, 3, 4, 5, 6], 0)).toBe(50);
    expect(operationsScore('rover_mobility', [1, 2, 3, 4, 5, 6], 100)).toBe(70);     // 0.6 × 50 + 0.4 × 100
    expect(operationsScore('drill_isru', [1, 2, 3, 4, 5, 6], 100)).toBe(65);         // 0.7 × 50 + 0.3 × 100
    expect(operationsScore('eva_training', [], 80)).toBe(32);                          // 0.6 × 0 + 0.4 × 80
  });
  it('re-normalised over what is held: shadow alone, months alone, neither; never a zero for what is missing', () => {
    expect(operationsScore('rover_mobility', undefined, 80)).toBe(80);
    expect(operationsScore('rover_mobility', [1, 2, 3, 4, 5, 6], null)).toBe(50);
    expect(operationsScore('rover_mobility', undefined, undefined)).toBeNull();
    expect(operationsScore('education', undefined, 90)).toBeNull();                    // a mission that ignores shadow, and no months
    expect(operationsScore('rover_mobility', undefined, 250)).toBe(100);               // clamped
  });
  it('an unknown purpose takes rover mobility\'s share, as the profiles do', () => {
    expect(shadowWeight('polar_lighting_geometry')).toBe(shadowWeight('rover_mobility'));
    expect(shadowWeight('__proto__')).toBe(.4); expect(shadowWeight(undefined)).toBe(.4);
    expect(shadowWeight('astrobiology')).toBe(0); expect(shadowWeight('habitat_ops')).toBe(0);
  });
});

describe('missionFit', () => {
  it('a field site: a weighted mean over the assessed factors, re-normalised; fidelity N/A, never a zero', () => {
    const f = missionFit('rover_mobility', { terrain: 91, climate: 50, fidelity: 100 });   // (45 × 91 + 10 × 50) / 55; fidelity ignored for a field site
    expect([f.score, f.applicable, f.assessed, f.tier]).toEqual([84, 90, 55, 'A']);
    expect(f.rows.map(r => [r.key, r.weight, r.score, r.na])).toEqual([['terrain', 45, 91, false], ['climate', 10, 50, false], ['ops', 20, null, false], ['fidelity', 10, null, true], ['infra', 15, null, false]]);
    expect(missionFit('rover_mobility', { terrain: 91, climate: 50, ops: 0 }).score).toBe(61);   // an assessed zero counts: (4095 + 500 + 0) / 75
  });
  it('the mission changes the weights: the same site reads differently for thermal testing than for rover mobility', () => {
    const s = { terrain: 95, climate: 0, ops: 100 };
    expect(missionFit('rover_mobility', s).score).toBe(84);   // (45 × 95 + 0 + 20 × 100) / 75
    expect(missionFit('thermal', s).score).toBe(35);          // (10 × 95 + 0 + 15 × 100) / 70
  });
  it('no tier when a field site reaches under half the mission (habitation), or under half its reach is assessed', () => {
    expect(missionFit('habitat_ops', { terrain: 90, climate: 100, ops: 100 })).toMatchObject({ applicable: 40, tier: null });
    expect(missionFit('astrobiology', { terrain: 90, climate: 100 })).toMatchObject({ applicable: 100, assessed: 40, tier: null });
    expect(missionFit('astrobiology', { terrain: 90, climate: 100, ops: 50 })).toMatchObject({ assessed: 50, tier: 'A' });
    expect(missionFit('rover_mobility', {})).toMatchObject({ score: null, assessed: 0, tier: null });
  });
  it('the tiers\' cutoffs', () => {
    expect([100, 85, 84, 70, 69, 55, 54, 40, 39, 25, 24, 0].map(tierOf)).toEqual(['A', 'A', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'F', 'F']);
  });
});

describe('existing analogs', () => {
  it('every analog cites a known source, has strengths from 0 to 1 only on factors its track is judged on, and a world', () => {
    for (const a of ANALOGS) {
      expect(a.refs.length, a.id).toBeGreaterThan(0);
      for (const r of a.refs) expect(Object.hasOwn(SOURCES, r), `${a.id} → ${r}`).toBe(true);
      for (const [k, v] of Object.entries(a.serves)) { expect(APPLIES[a.track], `${a.id}.${k}`).toContain(k); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
      expect(a.bodies.length, a.id).toBeGreaterThan(0);
    }
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
  it('cover: the mission\'s weights times the strengths, over the track\'s factors', () => {
    const hmp = ANALOGS.find(a => a.id === 'hmp')!;
    expect(cover(hmp, 'rover_mobility')).toBe(75);   // 45 × 1 + 10 × 0.75 + 20 × 0.75 + 15 × 0.5
  });
  it('the best existing analog leads with the one built for the mission, and only on its world', () => {
    const top = (p: string, b: string) => bestAnalogs(p, b)[0].a.id;
    expect([top('astrobiology', 'mars'), top('habitat_ops', 'mars'), top('drill_isru', 'moon'), top('rover_mobility', 'mars')]).toEqual(['atacama', 'concordia', 'pisces', 'hmp']);
    expect(bestAnalogs('rover_mobility', 'moon').map(x => x.a.id)).not.toContain('atacama');
    expect(bestAnalogs('rover_mobility', 'mars').map(x => x.a.id)).not.toContain('pisces');
    expect(bestAnalogs('rover_mobility', 'earth')).toEqual([]);
  });
  it('the list shown: at most one facility, and only when the mission needs one, ranked with the rest', () => {
    const ids = (p: string, b: string) => knownAnalogs(p, b).map(x => x.a.id);
    expect(ids('rover_mobility', 'mars')).toEqual(['hmp', 'iceland', 'atacama']);   // needs no facility (10 of 100)
    expect(ids('habitat_ops', 'mars')).toEqual(['concordia', 'hiseas', 'chapea']);
    expect(knownAnalogs('eva_training', 'moon', 20).filter(x => x.a.track === 'facility')).toHaveLength(1);
    expect(knownAnalogs('thermal', 'moon', 20).filter(x => x.a.track === 'facility')).toHaveLength(0);   // 15 of 100: under FACILITY_NEED
    expect(FACILITY_NEED).toBe(25);
  });
});
