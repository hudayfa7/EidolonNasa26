// Engine elevation windows into Terrain and back: the compare draws the engine's window, the mock serves the frontend's.
import { describe, expect, it, vi } from 'vitest';
import type { Elevation } from '../data/api';

vi.mock('./sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { genTerrain, heights, WINDOW_KM } = await import('./procedural');
const { fromElevation, windowZ } = await import('./tiles');
const { SITE_BY } = await import('../data/sites');

const win = (z: (number | null)[][]): Elevation => ({ size_px: z.length, pixel_m: 200, extent_km: 18.8, units: 'm', row0: 'north', col0: 'west', z });

describe('fromElevation', () => {
  it('reads the window: range, relief, slopes, exaggeration, the engine flag', () => {
    // A plane rising 1 m per 200 m to the east: a slope of atan(1/200) everywhere.
    const T = fromElevation(win(Array.from({ length: 94 }, () => Array.from({ length: 94 }, (_, i) => 100 + i))), 'mars', true)!;
    expect([T.N, T.ext, T.min, T.max, T.relief, T.pal, T.engine, T.lake]).toEqual([94, 18.8, 100, 193, 93, 'mars', true, -1e9]);
    expect(T.meanSlope).toBeCloseTo(Math.atan(1 / (18800 / 93)) * 180 / Math.PI, 6);
    expect(T.steep).toBe(0);
    expect(T.z[0 * 94 + 5]).toBe(105); expect(T.z[93 * 94 + 93]).toBe(193);   // row-major, row 0 north
  });
  it('draws samples without data at the lowest height; refuses what isn\'t a window', () => {
    const T = fromElevation(win([[null, 5, 7], [6, null, 9], [8, 9, null]]), 'arid', false)!;
    expect(Array.from(T.z)).toEqual([5, 5, 7, 6, 5, 9, 8, 9, 5]);
    expect(fromElevation(win([[null, null], [null, null]]), 'arid', false)).toBeNull();
    expect(fromElevation(win([[1, 2], [3]]), 'arid', false)).toBeNull();
    expect(fromElevation(win([[1]]), 'arid', false)).toBeNull();
    expect(fromElevation({ z: 'x' } as unknown as Elevation, 'arid', false)).toBeNull();
  });
});

describe('windowZ', () => {
  it('the frontend\'s window at the engine\'s 94 × 94: the same ground as its 192 × 192 terrain, 0.1 m', () => {
    const T = genTerrain('mars', SITE_BY.mars.jezero, WINDOW_KM), z = windowZ(heights('mars', SITE_BY.mars.jezero, WINDOW_KM, 94)), N = T.N, at = (i: number, j: number) => Math.round(T.z[j * N + i] * 10) / 10;
    expect([z.length, z[0].length, z[93].length]).toEqual([94, 94, 94]);
    expect([z[0][0], z[0][93], z[93][0], z[93][93]]).toEqual([at(0, 0), at(N - 1, 0), at(0, N - 1), at(N - 1, N - 1)]);   // edge to edge, row 0 north
    expect(z.flat().every(v => Math.round(v * 10) / 10 === v)).toBe(true);
    const back = fromElevation(win(z), 'mars', false)!;
    expect(Math.abs(back.min - T.min)).toBeLessThan(T.relief * .03); expect(Math.abs(back.max - T.max)).toBeLessThan(T.relief * .03);
  });
});
