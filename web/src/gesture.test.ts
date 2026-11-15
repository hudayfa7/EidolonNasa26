import { describe, expect, it } from 'vitest';
import { snapTo, twoFinger } from './gesture';

describe('snapTo', () => {
  const snaps = [112, 456, 792];   // peek, half, full at 390 × 844
  it('settles on the nearest snap when released slowly', () => {
    expect(snapTo(200, 0, snaps)).toBe(0);
    expect(snapTo(300, .4, snaps)).toBe(1);
    expect(snapTo(700, -.4, snaps)).toBe(2);
  });
  it('a flick goes on to the next snap its way, from anywhere between', () => {
    expect(snapTo(470, 1.2, snaps)).toBe(2);
    expect(snapTo(470, -1.2, snaps)).toBe(1);
    expect(snapTo(456, -.8, snaps)).toBe(0);
    expect(snapTo(130, .8, snaps)).toBe(1);
  });
  it('a flick past the ends stops at them', () => {
    expect(snapTo(792, 2, snaps)).toBe(2);
    expect(snapTo(100, -2, snaps)).toBe(0);
  });
});

describe('twoFinger', () => {
  const p = (x: number, y: number) => ({ x, y });
  it('spreading zooms in (f under 1), pinching out of it', () => {
    expect(twoFinger(p(100, 100), p(200, 100), p(50, 100), p(250, 100)).f).toBeCloseTo(.5);
    expect(twoFinger(p(50, 100), p(250, 100), p(100, 100), p(200, 100)).f).toBeCloseTo(2);
  });
  it('the midpoint moves by the fingers\' mean move; no twist when they keep their angle', () => {
    const g = twoFinger(p(100, 100), p(200, 100), p(110, 130), p(210, 130));
    expect([g.f, g.da, g.dx, g.dy]).toEqual([1, 0, 10, 30]);
  });
  it('twist clockwise on screen is +, wrapped across ±π', () => {
    expect(twoFinger(p(0, 0), p(100, 0), p(0, 0), p(0, 100)).da).toBeCloseTo(Math.PI / 2);
    expect(twoFinger(p(0, 0), p(-100, 1), p(0, 0), p(-100, -1)).da).toBeCloseTo(.02, 3);
  });
  it('fingers on one point give no zoom', () => {
    expect(twoFinger(p(5, 5), p(5, 5), p(0, 0), p(10, 0)).f).toBe(1);
  });
});
