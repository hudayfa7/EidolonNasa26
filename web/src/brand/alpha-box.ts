// The box round a raster's inked pixels (alpha above 0) as [x, y, w, h] in pixels, from RGBA data `w` wide and `h`
// high; the whole raster when nothing is inked. The footer art fits the mark by this box, not by its viewBox.
export function alphaBox(d: ArrayLike<number>, w: number, h: number): [number, number, number, number] {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!d[(y * w + x) * 4 + 3]) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y;
  }
  return x1 < 0 ? [0, 0, w, h] : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
