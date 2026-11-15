// The client's hillshades: grey, lit from the north-west like the engine's, stretched to their own range, transparent
// where there is no data.
import { describe, expect, it } from 'vitest';
import type { Elevation } from './api';
import { hillshade } from './hillshade';

const win = (f: (i: number, j: number) => number | null): Elevation =>
  ({ size_px: 4, pixel_m: 200, extent_km: .8, units: 'm', row0: 'north', col0: 'west', z: Array.from({ length: 4 }, (_, j) => Array.from({ length: 4 }, (_, i) => f(i, j))) });
const px = (a: Uint8ClampedArray, i: number, j: number) => [...a.slice((j * 4 + i) * 4, (j * 4 + i) * 4 + 4)];

describe('hillshade', () => {
  it('flat ground at the sun\'s altitude (45°): one grey, opaque', () => {
    const a = hillshade(win(() => 100));
    expect(a).toHaveLength(64); expect(px(a, 1, 2)).toEqual([180, 180, 180, 255]);
  });
  it('a slope facing the north-west is brighter than one facing the south-east', () => {
    const nw = hillshade(win((i, j) => 50 * (i + j)))[0], se = hillshade(win((i, j) => -50 * (i + j)))[0];   // rising to the south-east: faces north-west
    expect(nw).toBeGreaterThan(200); expect(se).toBeLessThan(150);
  });
  it('gentle relief is stretched to its own range (2nd–98th percentile), lit side still the bright one', () => {
    // A shallow bowl, 4.5 m deep over 800 m: lit as it is, it would span about two grey levels.
    const bowl = (i: number, j: number) => (i - 1.5) ** 2 + (j - 1.5) ** 2, a = hillshade(win(bowl));
    const g = Array.from({ length: 16 }, (_, q) => a[q * 4]);
    expect(Math.min(...g)).toBe(0); expect(Math.max(...g)).toBe(255);
    expect(px(a, 3, 3)[0]).toBeGreaterThan(px(a, 0, 0)[0]);   // the south-east rim faces the north-west sun, the north-west rim faces away
  });
  it('no data is transparent, and doesn\'t tilt its neighbours', () => {
    const a = hillshade(win((i, j) => i === 1 && j === 1 ? null : 100));
    expect(px(a, 1, 1)).toEqual([0, 0, 0, 0]); expect(px(a, 2, 1)).toEqual([180, 180, 180, 255]);
  });
});
