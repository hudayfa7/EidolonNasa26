import { describe, expect, it } from 'vitest';
import { MISSIONS } from './data/missions';
import { axisWords, ellR, ellSteep, landedOf, landing, missionOf, missionsOf, ringed, shareOf, sizeOf } from './ellipse';

// A 10 km grid of 101 × 101 slopes (100 m apart, row 0 north), from a function of each sample's x east and y north (km).
const N = 101, EXT = 10;
const grid = (f: (x: number, y: number) => number) => Float32Array.from({ length: N * N }, (_, n) => f((n % N - 50) / 10, (50 - Math.floor(n / N)) / 10));
// The share of a unit circle's area where |x| > t.
const outside = (t: number) => 1 - 2 * (t * Math.sqrt(1 - t * t) + Math.asin(t)) / Math.PI;

describe('missions', () => {
  it('offers a body its own missions, and Earth every one; the chosen one where it is offered, else the first', () => {
    expect(missionsOf('mars').map(m => m.id)).toEqual(['perseverance', 'curiosity']);
    expect(missionsOf('moon').map(m => m.id)).toEqual(['artemis', 'apollo11']);
    expect(missionsOf('earth')).toEqual(MISSIONS);
    landing.id = 'curiosity';
    expect(missionOf('mars').id).toBe('curiosity'); expect(missionOf('earth').id).toBe('curiosity'); expect(missionOf('moon').id).toBe('artemis');
    landing.id = '';
  });
  it('says a size in its own terms: two axes, or a circle across, each number held to its unit', () => {
    expect(sizeOf(MISSIONS[0])).toBe('7.7&nbsp;×&nbsp;6.6&nbsp;km');
    expect(sizeOf(MISSIONS[1])).toBe('20&nbsp;×&nbsp;7&nbsp;km');
    expect(sizeOf(MISSIONS[2])).toBe('200&nbsp;m across');
  });
  it('says where a mission really landed on its own site only, from the site\'s centre', () => {
    // The sites' own points (data/sites.ts, which needs the DOM).
    const [per, cur] = MISSIONS, jez = { id: 'jezero', lat: 18.38, lon: 77.58 }, gale = { id: 'gale', lat: -5.4, lon: 137.8 };
    expect(landedOf(cur, 'mars', gale)).toBe('Not where it landed: Curiosity came down 52&nbsp;km north-west of the crosshair, at Bradbury Landing, inside NASA’s own ellipse.');
    expect(landedOf(per, 'mars', jez)).toMatch(/^Not where it landed: Perseverance came down 8&nbsp;km north-west of the crosshair, at Octavia E\. Butler Landing/);
    expect(landedOf(per, 'mars', gale)).toBe('');
    expect(landedOf(cur, 'mars', { id: '@-5.4000,137.8000', lat: -5.4, lon: 137.8 })).toBe('');   // a pin on the same point
    expect(landedOf(MISSIONS[3], 'moon', { id: 'malapert', lat: -86, lon: 0 })).toBe('');
  });
  it('rings an ellipse under 8 px across on a 320 px map, and only that', () => {
    expect(ringed(MISSIONS[2], 60)).toBe(true);    // Artemis's 200 m at Malapert: about 1 px
    expect(ringed(MISSIONS[2], 10)).toBe(true);    // 6.4 px
    expect(ringed(MISSIONS[2], 8)).toBe(false);    // 8 px exactly
    expect(ringed(MISSIONS[2], 4)).toBe(false);    // at Meteor Crater: 16 px
    expect(ringed(MISSIONS[0], 60)).toBe(false);   // Perseverance's 7.7 km: 41 px
  });
});

describe('shareOf', () => {
  it('gives a fraction to two places, never rounded to none or all when it is neither', () => {
    expect(shareOf(0)).toBe('None');
    expect(shareOf(.004)).toBe('Under 0.01');
    expect(shareOf(.005)).toBe('0.01');
    expect(shareOf(.0612)).toBe('0.06');
    expect(shareOf(.994)).toBe('0.99');
    expect(shareOf(.995)).toBe('Over 0.99');
    expect(shareOf(.9999)).toBe('Over 0.99');
    expect(shareOf(1)).toBe('All');
  });
});

describe('axisWords', () => {
  it('names an axis by its two ends, the northern first, east before west', () => {
    expect(axisWords(0)).toBe('north–south');
    expect(axisWords(175)).toBe('north–south');
    expect(axisWords(45)).toBe('north-east–south-west');
    expect(axisWords(90)).toBe('east–west');
    expect(axisWords(100)).toBe('east–west');
    expect(axisWords(135)).toBe('north-west–south-east');
  });
});

describe('ellR', () => {
  it('is 1 at the ends of both axes, whichever way the long one points', () => {
    expect(ellR(4, 0, 8, 4, 90)).toBeCloseTo(1, 12);
    expect(ellR(0, 2, 8, 4, 90)).toBeCloseTo(1, 12);
    expect(ellR(0, 4, 8, 4, 90)).toBeCloseTo(2, 12);
    expect(ellR(0, 4, 8, 4, 0)).toBeCloseTo(1, 12);
    const az = 30 * Math.PI / 180;
    expect(ellR(4 * Math.sin(az), 4 * Math.cos(az), 8, 4, 30)).toBeCloseTo(1, 12);
    expect(ellR(2 * Math.cos(az), -2 * Math.sin(az), 8, 4, 30)).toBeCloseTo(1, 12);
    expect(ellR(0, 0, 8, 4, 30)).toBe(0);
  });
});

describe('ellSteep', () => {
  it('all or none of it over the line on even ground; its area', () => {
    const r = ellSteep(grid(() => 20), N, EXT, 4, 2, 90, 15);
    expect(r).toEqual({ area: Math.PI * 2, inside: 1, steep: 1 });
    expect(ellSteep(grid(() => 10), N, EXT, 4, 2, 90, 15).steep).toBe(0);
  });
  it('half of it where the ground east of its centre is steep, whichever way it points', () => {
    // 15° on the centre's own column: the bilinear slope crosses the line there.
    const sl = grid(x => x > 0 ? 30 : x < 0 ? 0 : 15);
    for (const az of [0, 37, 90, 160]) expect(ellSteep(sl, N, EXT, 6, 3, az, 15).steep).toBeCloseTo(.5, 2);
  });
  it('turns with its long axis: none of it on the steep flanks lying north–south, more than half lying east–west', () => {
    // Steep beyond 1.5 km east and west: the bilinear slope crosses 15° halfway to the next sample, 1.55 km out.
    const sl = grid(x => Math.abs(x) > 1.5 ? 30 : 0);
    expect(ellSteep(sl, N, EXT, 8, 2, 0, 15).steep).toBe(0);
    expect(ellSteep(sl, N, EXT, 8, 2, 90, 15).steep).toBeCloseTo(outside(1.55 / 4), 2);
  });
  it('past the square, the share inside it, and the steep share of that part only', () => {
    // A circle 20 km across over the 10 km square: all 100 km² of the square inside its 314 km².
    const r = ellSteep(grid(x => x > 0 ? 30 : x < 0 ? 0 : 15), N, EXT, 20, 20, 0, 15);
    expect(r.inside * r.area).toBeCloseTo(100, 9);
    expect(r.steep).toBeCloseTo(.5, 2);
    // A 16 × 4 km ellipse lying east–west runs past the east and west edges only: the 10 × 4 km band's part inside it.
    const band = 2 * (Math.asin(5 / 8) * 64 + 5 * Math.sqrt(64 - 25)) / 4;   // ∫ 2·2·√(1 − (x/8)²) dx over |x| ≤ 5
    expect(ellSteep(grid(() => 0), N, EXT, 16, 4, 90, 15).inside * 16 * Math.PI).toBeCloseTo(band, 1);
    // Lying along the diagonal of the square, a 13 km long axis stays inside it (its corners are 7.07 km out).
    expect(ellSteep(grid(() => 0), N, EXT, 13, 2, 45, 15).inside).toBe(1);
  });
});
