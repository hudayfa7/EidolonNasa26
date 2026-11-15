import { describe, expect, it } from 'vitest';
import { llToLocal, localToLL, rng } from './coords';
import { fmtDist, gcAt, gcKm, heightAt, onGrid, profile, profileStats, type LL } from './profile';

const MARS = 3389.5, MOON = 1737.4;

describe('gcKm', () => {
  it('a quarter turn is a quarter of the circumference, whichever way', () => {
    expect(gcKm(MARS, [0, 0], [0, 90])).toBeCloseTo(Math.PI * MARS / 2, 9);
    expect(gcKm(MARS, [0, 30], [90, 0])).toBeCloseTo(Math.PI * MARS / 2, 9);
    expect(gcKm(MARS, [-89.9, 10], [89.9, 10])).toBeCloseTo(179.8 / 180 * Math.PI * MARS, 9);
  });
  it('a degree of Mars\'s latitude is 59.16 km; across the antimeridian the short way round', () => {
    expect(gcKm(MARS, [18, 77], [19, 77])).toBeCloseTo(59.158, 3);
    expect(gcKm(MOON, [0, 179.5], [0, -179.5])).toBeCloseTo(MOON * Math.PI / 180, 9);
  });
  it('keeps its digits on short lines: a metre is a metre', () => {
    const [la, lo] = localToLL(MOON, -86, 0, .001, 0);
    expect(gcKm(MOON, [-86, 0], [la, lo]) * 1000).toBeCloseTo(1, 6);
    expect(gcKm(MOON, [-86, 0], [-86, 0])).toBe(0);
  });
  it('agrees with the site map\'s projection, true from its centre at any latitude', () => {
    const r = rng('gc');
    for (const c of [[18.38, 77.58], [-86, 0], [75.4, -89.8]] as LL[]) for (let n = 0; n < 20; n++) {
      const p: LL = [c[0] + (r() - .5) * 2, c[1] + (r() - .5) * 2], [x, y] = llToLocal(MARS, c[0], c[1], ...p);
      expect(gcKm(MARS, c, p)).toBeCloseTo(Math.hypot(x, y), 9);
    }
  });
});

describe('gcAt', () => {
  it('starts at a, ends at b, and goes the great circle\'s way', () => {
    expect(gcAt([10, 20], [30, 40], 0)[0]).toBeCloseTo(10, 9);
    expect(gcAt([10, 20], [30, 40], 1)[1]).toBeCloseTo(40, 9);
    const m = gcAt([0, 0], [0, 90], .5); expect(m[0]).toBeCloseTo(0, 9); expect(m[1]).toBeCloseTo(45, 9);
    // Between two points on one parallel the great circle bows poleward of it.
    expect(gcAt([60, 0], [60, 90], .5)[0]).toBeGreaterThan(65);
  });
  it('a fraction of the way is that fraction of the length', () => {
    const a: LL = [-85.2, 12.3], b: LL = [-86.1, -40], L = gcKm(MOON, a, b);
    for (const f of [.1, .37, .5, .9]) { const p = gcAt(a, b, f); expect(gcKm(MOON, a, p)).toBeCloseTo(f * L, 8); expect(gcKm(MOON, p, b)).toBeCloseTo((1 - f) * L, 8); }
  });
  it('a line of no length stays put', () => expect(gcAt([5, 6], [5, 6], .5)).toEqual([5, 6]));
});

describe('heightAt', () => {
  const z = [0, 10, 20, 30, 40, 50, 60, 70, 80];   // 3 × 3, rising 10 m a sample east and 30 m a sample south
  it('gives the samples themselves, between them bilinear, and holds at the edges', () => {
    expect(heightAt(z, 3, 2, 2)).toBe(80);
    expect(heightAt(z, 3, 1, 0)).toBe(10);
    expect(heightAt(z, 3, .5, .5)).toBeCloseTo(20, 9);
    expect(heightAt(z, 3, 1.25, 1.5)).toBeCloseTo(57.5, 9);
    expect(heightAt(z, 3, -4, 9)).toBe(60);
  });
});

describe('onGrid', () => {
  const G = { z: [], N: 192, ext: 60 }, c: LL = [-86, 0];
  it('the centre is the middle sample, north up, east right; past the square is off it', () => {
    expect(onGrid(G, MOON, c, c)).toEqual([95.5, 95.5]);
    const ne = onGrid(G, MOON, c, localToLL(MOON, ...c, 30, 30))!;
    expect(ne[0]).toBeCloseTo(191, 6); expect(ne[1]).toBeCloseTo(0, 6);
    expect(onGrid(G, MOON, c, localToLL(MOON, ...c, 30.01, 0))).toBeNull();
    expect(onGrid(G, MOON, c, localToLL(MOON, ...c, 0, -31))).toBeNull();
  });
});

describe('profile', () => {
  // 20 × 20 samples 1 km apart (19 km edge to edge), the ground rising 10 m a sample east.
  const N = 20, ext = 19, c: LL = [18.38, 77.58], z = Array.from({ length: N * N }, (_, k) => 10 * (k % N));
  const end = (x: number, y: number) => localToLL(MARS, ...c, x, y);
  it('west to east through the centre: the square\'s width, rising 190 m at a steady 0.57°', () => {
    const P = profile({ z, N, ext }, MARS, c, end(-9.5, 0), end(9.5, 0)), S = profileStats(P);
    expect(P.km).toBeCloseTo(19, 6);
    expect(P.d.length).toBe(39); expect(P.d.at(-1)).toBeCloseTo(19, 6);   // two points a sample
    expect(P.z[0]).toBeCloseTo(0, 4); expect(P.z.at(-1)).toBeCloseTo(190, 4);
    expect(S.rise).toBeCloseTo(190, 4); expect(S.climb).toBeCloseTo(190, 4); expect(S.descent).toBeCloseTo(0, 4);
    expect(S.lo).toBeCloseTo(0, 4); expect(S.hi).toBeCloseTo(190, 4); expect(S.steep).toBeCloseTo(Math.atan(.01) * 180 / Math.PI, 3);
  });
  it('east to west falls as far; north to south stays level', () => {
    expect(profileStats(profile({ z, N, ext }, MARS, c, end(9.5, 0), end(-9.5, 0))).descent).toBeCloseTo(190, 4);
    const S = profileStats(profile({ z, N, ext }, MARS, c, end(2, 9), end(2, -9)));
    expect(S.rise).toBeCloseTo(0, 3); expect(S.steep).toBeLessThan(.01); expect(S.lo).toBeCloseTo(115, 0);
  });
  it('over a ridge: up and down again, nothing between, the crest its highest', () => {
    const r = Array.from({ length: N * N }, (_, k) => 100 - 10 * Math.abs(k % N - 9));   // its crest the 10th column
    const S = profileStats(profile({ z: r, N, ext }, MARS, c, end(-9.5, 0), end(8.5, 0)));
    expect(S.rise).toBeCloseTo(0, 3); expect(S.climb).toBeCloseTo(90, 3); expect(S.descent).toBeCloseTo(90, 3);
    expect(S.hi).toBeCloseTo(100, 3); expect(S.lo).toBeCloseTo(10, 3);
  });
  it('a short line still has its points; a long one is not capped below two a sample', () => {
    expect(profile({ z, N, ext }, MARS, c, end(0, 0), end(.1, 0)).d.length).toBe(17);
    const P = profile({ z, N: 192, ext: 180 }, MARS, c, end(-90, -90), end(90, 90));
    expect(P.km).toBeCloseTo(180 * Math.SQRT2, 0); expect(P.d.length).toBe(Math.ceil(2 * P.km / (180 / 191)) + 1);
  });
});

describe('fmtDist', () => {
  it('metres under a kilometre, then three figures', () => {
    expect([.0004, .84, .9996, 4.271, 9.999, 42.71, 142.3, 1234.4].map(fmtDist)).toEqual(['0 m', '840 m', '1.00 km', '4.27 km', '10.0 km', '42.7 km', '142 km', '1,230 km']);
  });
});
