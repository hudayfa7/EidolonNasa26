// The overlay's ghost (drawTerrain): the heavier block solid, the other over it, so the blend is the slider's mix. And
// the block's pure parts: its mesh's samples, its lakes' shore distance, its contours and their labels, its light.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../scene/renderer', () => ({ canvasTex: () => null, blank: null, LITE: false }));
vi.mock('../scene/layout', () => ({ token: () => '' }));
vi.mock('../motion', () => ({ simNow: () => new Date(0) }));
const { contourMarks, contourSegs, ghostOrder, meshIdx, shoreDist, sunENU, sunlit } = await import('./mesh');
const { measure } = await import('./procedural');

describe('ghostOrder', () => {
  it('wherever both blocks cover, the frame is (1 − t) target + t Earth; at either end one block alone', () => {
    for (const t of [0, .2, .5, .7, 1]) {
      const { solid, over, a } = ghostOrder(t), w = [0, 0];
      w[over] = a; w[solid] = 1 - a;   // the one over at a, the solid one under it showing through 1 − a
      expect(w[0]).toBeCloseTo(1 - t); expect(w[1]).toBeCloseTo(t);
      expect(a).toBeLessThanOrEqual(.5);   // the ghost is always the lighter one
    }
    expect(ghostOrder(0)).toEqual({ solid: 0, over: 1, a: 0 });
    expect(ghostOrder(1)).toEqual({ solid: 1, over: 0, a: 0 });
  });
});

describe('meshIdx', () => {
  it('every sample up to the limit, else every k-th with the last kept', () => {
    expect(meshIdx(94)).toEqual([...Array(94).keys()]);
    expect(meshIdx(192, 128)).toHaveLength(96);
    expect(meshIdx(192, 128).slice(0, 3)).toEqual([0, 2, 4]); expect(meshIdx(192, 128).at(-1)).toBe(191);
    const big = meshIdx(1025); expect(big.length).toBeLessThanOrEqual(512); expect(big[0]).toBe(0); expect(big.at(-1)).toBe(1024);
  });
});

describe('shoreDist', () => {
  it('counts water samples out from the shore, 0 on land', () => {
    // 5 × 5, a 3 × 3 lake in the middle with a 1-sample bay to its north
    const wet = [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0];
    expect([...shoreDist(wet, 5)]).toEqual([0, 0, 1, 0, 0, 0, 1, 2, 1, 0, 0, 1, 2, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]);   // the bay's mouth is inland
    expect([...shoreDist(new Array(9).fill(0), 3)]).toEqual(new Array(9).fill(0));
  });
});

describe('contours', () => {
  // A cone: height falls off with the distance from the centre of a 41 × 41 grid, 0 to 400 m over 8 km.
  const N = 41, z = Float32Array.from({ length: N * N }, (_, k) => 400 - 20 * Math.hypot(k % N - 20, Math.floor(k / N) - 20));
  it('a level\'s segments ring the cone at its radius', () => {
    const seg = contourSegs(z, N, 200);
    expect(seg.length).toBeGreaterThan(40);
    for (const [i, j] of seg) expect(Math.hypot(i - 20, j - 20)).toBeCloseTo(10, 0);
  });
  it('labels a major level at its point nearest the centre, at most three, spaced apart', () => {
    const T = measure(z, N, 8, 'arid'), m = contourMarks(T);
    expect(m.length).toBeGreaterThan(0); expect(m.length).toBeLessThanOrEqual(3);
    for (const x of m) { expect(Math.abs(x.lv % T.major)).toBe(0); expect(Math.hypot(x.i - 20, x.j - 20)).toBeCloseTo((400 - x.lv) / 20, 0); }
    for (const a of m) for (const b of m) if (a !== b) expect(Math.hypot(a.i - b.i, a.j - b.j)).toBeGreaterThan(8);
  });
});

describe('sunENU', () => {
  it('toward the sun at the fixed 38° height, east and north by its azimuth', () => {
    const [e, u, n] = sunENU(0); expect(e).toBeCloseTo(0); expect(u).toBeCloseTo(.62); expect(n).toBeCloseTo(Math.sqrt(1 - .62 ** 2));
    const w = sunENU(270); expect(w[0]).toBeLessThan(0); expect(w[2]).toBeCloseTo(0);
    const nw = sunENU(307.7); expect(nw[0]).toBeCloseTo(-.62, 2); expect(nw[2]).toBeCloseTo(.48, 2);   // the prototype's north-west light
  });
  it('at a set height: below the horizon, up is negative', () => {
    const [e, u, n] = sunENU(90, -10); expect(u).toBeCloseTo(-Math.sin(10 * Math.PI / 180)); expect(e).toBeGreaterThan(0); expect(n).toBeCloseTo(0);
  });
});

describe('sunlit', () => {
  // 21 × 21 samples 100 m apart (2 km), flat but for a 500 m wall along column 15; R so large the ground is flat.
  const N = 21, z = new Float32Array(N * N); for (let j = 0; j < N; j++) z[j * N + 15] = 500;
  const T = measure(z, N, 2, 'arid'), at = (m: Uint8Array, i: number) => m[10 * N + i];
  it('a wall shades the ground on its far side for height / tan(sun height), at true scale', () => {
    const m = sunlit(T, 90, 45, 1e9);   // from the east, 100 m of rise a sample: 5 samples of shadow west of it
    expect([10, 11, 12, 13, 14].map(i => at(m, i))).toEqual([1, 0, 0, 0, 0]);
    expect([15, 16, 20].map(i => at(m, i))).toEqual([1, 1, 1]);   // the wall's top and the sunny side
    expect(sunlit(T, 270, 45, 1e9)[10 * N + 16]).toBe(0);   // from the west: the shadow falls east
    expect(sunlit(T, 90, 80, 1e9).every(v => v === 1)).toBe(true);   // high sun: no shadow longer than a sample
  });
  it('a sun below the horizon leaves flat ground dark; the body\'s curve drops a far wall under a low sun\'s ray', () => {
    expect(at(sunlit(T, 90, -.5, 1e9), 5)).toBe(0);
    // From the centre, a 14 m wall 500 m east, the sun .5° up (4.4 m of rise by then): it shades on flat ground, not on a
    // 10 km body, whose curve lowers it 12.5 m
    const low = measure(Float32Array.from(z, v => v && 14), N, 2, 'arid');
    expect(at(sunlit(low, 90, .5, 1e9), 10)).toBe(0); expect(at(sunlit(low, 90, .5, 10), 10)).toBe(1);
  });
  it('off the centre, the sun stands higher toward it and lower away by the offset over R', () => {
    // 10 m walls 200 m east of two samples 300 m either side of the centre; the sun 2° up in the east (7 m of rise by
    // the wall) on a 10 km body (2 m of fall): the centre's sun would shade both; the sample toward the sun sees it 1.7°
    // higher, over its wall, the one away 1.7° lower, under its own
    const w = new Float32Array(N * N); for (let j = 0; j < N; j++) w[j * N + 9] = w[j * N + 15] = 10;
    const m = sunlit(measure(w, N, 2, 'arid'), 90, 2, 10);
    expect([at(m, 13), at(m, 7)]).toEqual([1, 0]);
  });
});
