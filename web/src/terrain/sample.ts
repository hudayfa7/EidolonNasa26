// Global maps read back from the loaded textures (prototype 834–863): elevation (bump) for pin terrain and albedo for
// the footer's dithered globe, sampled by latitude and longitude.
import { clamp, lon360, type Body } from '../coords';
import { BODIES, ORDER, type BodyInfo } from '../data/bodies';
import { image, TEX } from '../scene/renderer';

export interface GMap { w: number; h: number; d: Uint8Array }
export const BUMP: Partial<Record<Body, GMap>> = {}, ALB: Partial<Record<Body, GMap>> = {};

// Bilinear, 0–1; .5 (mid elevation) when the map is missing.
export function sampleMap(M: GMap | undefined, b: BodyInfo, lat: number, lon: number) {
  if (!M) return .5;
  const x = lon360(lon - b.lon0) / 360 * M.w - .5, y = clamp((90 - lat) / 180 * M.h - .5, 0, M.h - 1.001);
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, X0 = ((x0 % M.w) + M.w) % M.w, X1 = (X0 + 1) % M.w, Y1 = Math.min(y0 + 1, M.h - 1);
  const d = M.d, a = d[y0 * M.w + X0], c = d[y0 * M.w + X1], e = d[Y1 * M.w + X0], f = d[Y1 * M.w + X1];
  return ((a * (1 - fx) + c * fx) * (1 - fy) + (e * (1 - fx) + f * fx) * fy) / 255;
}
function readMap(img: CanvasImageSource, w: number, h: number, lum: boolean): GMap {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, w, h); const src = g.getImageData(0, 0, w, h).data, d = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = lum ? (src[i * 4] * .3 + src[i * 4 + 1] * .59 + src[i * 4 + 2] * .11) : src[i * 4];
  return { w, h, d };
}
// After the start gate, and again when a texture lands late. A map whose texture is still missing is left out: pins
// fall back to flat terrain until it lands. One already read is kept: the height maps come in one tier, and the albedo
// (512 px) read from a colour map's low tier stays when its full map replaces it.
export function prepareMaps() {
  for (const id of ORDER) {
    const b = BODIES[id], bump = image(b.bump), col = image(b.tex);
    if (bump?.width && !BUMP[id]) BUMP[id] = readMap(bump, TEX[b.bump].w, TEX[b.bump].h, false);
    if (col?.width && !ALB[id]) ALB[id] = readMap(col, 512, 256, true);
  }
}
