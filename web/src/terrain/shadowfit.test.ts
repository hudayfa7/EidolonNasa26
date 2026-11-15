import { describe, expect, it, vi } from 'vitest';

vi.mock('../scene/renderer', () => ({ canvasTex: () => null, blank: null, LITE: false }));
vi.mock('../scene/layout', () => ({ token: () => '' }));
vi.mock('../motion', () => ({ simNow: () => new Date(0) }));
const { measure } = await import('./procedural');
const { shadowFit, shadowOf, shadowShares, ZERO_AT } = await import('./shadowfit');

const N = 41;
const flat = () => measure(new Float32Array(N * N), N, 4, 'arid');
const walls = (h: number) => { const z = new Float32Array(N * N); for (let j = 0; j < N; j++) for (const i of [10, 20, 30]) z[j * N + i] = h; return measure(z, N, 4, 'arid'); };
const real = <T extends object>(T: T) => Object.assign(T, { src: 'test' });

describe('shadowShares', () => {
  it('flat ground has no shadow at any sun height; walls shade more at a low sun than a high one', () => {
    expect(shadowShares(flat(), 1e9)).toEqual([0, 0, 0]);
    const s = shadowShares(walls(20), 1e9);   // 100 m between samples, so 20 m walls: shadows of 1.1 km, 570 m and 290 m
    expect(s[0]).toBeGreaterThan(s[1]); expect(s[1]).toBeGreaterThan(s[2]); expect(s[2]).toBeGreaterThan(0);
    for (const v of s) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });
  it('taller walls shade more; the result is kept per terrain', () => {
    expect(shadowShares(walls(30), 1e9)[1]).toBeGreaterThan(shadowShares(walls(10), 1e9)[1]);
    const T = walls(20); expect(shadowShares(T, 1e9)).toBe(shadowShares(T, 1e9));
  });
});

describe('shadowFit', () => {
  it('the same shares score 100; a difference of ZERO_AT at every height scores 0, and a half of it 50', () => {
    expect(shadowFit([.1, .05, 0], [.1, .05, 0])).toBe(100);
    expect(shadowFit([0, 0, 0], [ZERO_AT, ZERO_AT, ZERO_AT])).toBe(0);
    expect(shadowFit([0, 0, 0], [1, 1, 1])).toBe(0);
    expect(shadowFit([0, 0, 0], [ZERO_AT / 2, ZERO_AT / 2, ZERO_AT / 2])).toBe(50);
  });
});

describe('shadowOf', () => {
  it('two alike windows fit best, unlike ones worse', () => {
    const a = shadowOf(real(walls(400)), 3389.5, real(walls(400)))!, b = shadowOf(real(walls(400)), 3389.5, real(flat()))!;
    expect(a.fit).toBe(100); expect(b.fit).toBeLessThan(a.fit);
    expect(b.earth).toEqual([0, 0, 0]); expect(b.target[0]).toBeGreaterThan(0);
  });
  it('null unless both windows are real elevation: a procedural window\'s shadows are illustrative', () => {
    expect(shadowOf(walls(400), 3389.5, real(walls(400)))).toBeNull();
    expect(shadowOf(real(walls(400)), 3389.5, walls(400))).toBeNull();
    expect(shadowOf(Object.assign(walls(400), { engine: true }), 3389.5, Object.assign(walls(400), { engine: true }))!.fit).toBe(100);
  });
});
