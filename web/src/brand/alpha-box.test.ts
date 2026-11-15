import { describe, expect, it } from 'vitest';
import { alphaBox } from './alpha-box';

// A w × h RGBA raster with alpha set at the given [x, y] pixels.
const raster = (w: number, h: number, inked: [number, number][]) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (const [x, y] of inked) d[(y * w + x) * 4 + 3] = 40;
  return d;
};

describe('alphaBox', () => {
  it('bounds the inked pixels, whatever their colour', () => {
    expect(alphaBox(raster(6, 5, [[3, 1], [1, 3], [4, 3]]), 6, 5)).toEqual([1, 1, 4, 3]);
  });
  it('is one pixel for one inked pixel, and the raster at its edges', () => {
    expect(alphaBox(raster(6, 5, [[5, 4]]), 6, 5)).toEqual([5, 4, 1, 1]);
    expect(alphaBox(raster(6, 5, [[0, 0], [5, 4]]), 6, 5)).toEqual([0, 0, 6, 5]);
  });
  it('ignores colour without alpha, and gives the whole raster when nothing is inked', () => {
    const d = raster(6, 5, []); d[0] = d[1] = d[2] = 255;
    expect(alphaBox(d, 6, 5)).toEqual([0, 0, 6, 5]);
  });
});
