import { describe, expect, it, vi } from 'vitest';

// sample.ts reads textures through the renderer (WebGL); featured sites never sample it.
vi.mock('./sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { genTerrain, heights, measure, prunePins, slopes, STEEP, WINDOW_KM } = await import('./procedural');
const { EARTH_BY } = await import('../data/sites');
const { BODIES } = await import('../data/bodies');
const { localToLL } = await import('../coords');

describe('genTerrain windows (compare to scale)', () => {
  it('reports the window it was generated over', () => {
    expect(WINDOW_KM).toBe(18.8);
    const s = EARTH_BY.salda;
    expect(genTerrain('earth', s).ext).toBe(16);
    expect(genTerrain('earth', s, WINDOW_KM).ext).toBe(18.8);
  });

  it('samples the same ground at the same place whatever the window', () => {
    // Meteor Crater's own window is 4 km; at 12 km the grids line up: column i of the wide window is column 3i − 191
    // of the site's own (N = 192 samples, 191 intervals), and the same for rows.
    const s = EARTH_BY.meteor, own = genTerrain('earth', s), wide = genTerrain('earth', s, 12), N = own.N;
    for (const [i, j] of [[64, 64], [80, 100], [95, 96], [127, 127], [70, 120]]) {
      expect(wide.z[j * N + i]).toBeCloseTo(own.z[(3 * j - 191) * N + (3 * i - 191)], 6);
    }
  });
  it('a window centred elsewhere (a named target\'s, on its IAU centre) is the same ground, shifted', () => {
    const s = EARTH_BY.meteor, [lat, lon] = localToLL(BODIES.earth.R, s.lat, s.lon, 1, -2);   // 1 km east, 2 km south
    const own = heights('earth', s, 4, 5), moved = heights('earth', s, 4, 5, { lat, lon });   // samples 1 km apart, row 0 north
    for (const [i, j] of [[0, 0], [2, 1], [3, 2]]) expect(moved[j * 5 + i]).toBeCloseTo(own[(j + 2) * 5 + i + 1], 3);
    expect(genTerrain('earth', s, 4, { lat, lon }).z).not.toEqual(genTerrain('earth', s, 4).z);
  });
});

describe('prunePins', () => {
  it('keeps featured sites and only the most recent pins', () => {
    const c: Record<string, number> = { 'mars/jezero': 0 };
    for (let i = 0; i < 5; i++) c[`mars/@${i}.0000,0.0000`] = i;
    prunePins(c, 2);
    expect(Object.keys(c)).toEqual(['mars/jezero', 'mars/@3.0000,0.0000', 'mars/@4.0000,0.0000']);
  });
});

describe('slopes (the slope hazard)', () => {
  // N × N heights from f(i, j), i east, j south (row 0 north).
  const grid = (N: number, f: (i: number, j: number) => number) => Float32Array.from({ length: N * N }, (_, k) => f(k % N, Math.floor(k / N)));
  const deg = (t: number) => Math.atan(t) * 180 / Math.PI;
  it('a plane\'s slope at every sample, edges too, at the grid\'s true spacing', () => {
    // 5 samples over 0.4 km: 100 m apart. Rising 20° to the east, then to the south, then diagonally.
    const t = Math.tan(20 * Math.PI / 180);
    for (const f of [(i: number) => i * 100 * t, (_: number, j: number) => -j * 100 * t]) for (const s of slopes(grid(5, f), 5, .4)) expect(s).toBeCloseTo(20, 4);
    for (const s of slopes(grid(5, (i, j) => (i + j) * 10), 5, .4)) expect(s).toBeCloseTo(deg(10 * Math.SQRT2 / 100), 4);
  });
  it('corrects for the window\'s real scale: the same heights over twice the width are half as steep', () => {
    const z = grid(5, i => i * 100 * Math.tan(20 * Math.PI / 180));
    for (const s of slopes(z, 5, .8)) expect(s).toBeCloseTo(deg(Math.tan(20 * Math.PI / 180) / 2), 4);
  });
  it('the engine\'s window: 94 samples over 18.8 km, a plane either side of the line', () => {
    const cell = WINDOW_KM * 1000 / 93, plane = (a: number) => grid(94, i => i * cell * Math.tan(a * Math.PI / 180));
    expect(STEEP).toBe(15);
    expect(Math.min(...slopes(plane(15.2), 94, WINDOW_KM))).toBeGreaterThan(STEEP);
    expect(Math.max(...slopes(plane(14.8), 94, WINDOW_KM))).toBeLessThan(STEEP);
    // measure counts the same samples: all of the steeper plane, none of the gentler.
    expect(measure(plane(15.2), 94, WINDOW_KM, 'mars').steep).toBe(1); expect(measure(plane(14.8), 94, WINDOW_KM, 'mars').steep).toBe(0);
  });
  it('a ridge: steep on its flanks, flat on its crest and on the plain', () => {
    // A 30° ridge running north-south down column 4 of 9 samples 100 m apart, the plain at 0 beyond column 2 and 6.
    const t = Math.tan(30 * Math.PI / 180), s = slopes(grid(9, i => Math.max(0, 200 * t - Math.abs(i - 4) * 100 * t)), 9, .8), at = (i: number) => s[4 * 9 + i];
    expect(at(3)).toBeCloseTo(30, 4); expect(at(5)).toBeCloseTo(30, 4);
    expect(at(4)).toBe(0);   // central differences across a symmetric crest
    expect(at(0)).toBe(0); expect(at(8)).toBe(0);
    expect(at(2)).toBeCloseTo(deg(t / 2), 4);   // the foot: half a step of rise over two
  });
});
