// Profile and measure (plan, Stretch): a line's length on a body's sphere and the ground's cross-section along it,
// sampled from a site's own grid of heights (terrain/procedural.ts Terrain: N × N samples `ext` km wide edge to edge,
// row 0 north) in the site's local projection (coords.ts llToLocal). Pure, tested (profile.test.ts).
import { clamp, D2R, llToLocal } from './coords';

export type LL = [lat: number, lon: number];
interface Grid { z: ArrayLike<number>; N: number; ext: number }

const unit = ([la, lo]: LL) => [Math.cos(la * D2R) * Math.cos(lo * D2R), Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R)];
// The central angle (radians) from the cross and dot products: exact for short lines, where an arccosine loses its
// digits, and for long ones.
function angle(a: LL, b: LL) {
  const [p, q] = [unit(a), unit(b)];
  return Math.atan2(Math.hypot(p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]), p[0] * q[0] + p[1] * q[1] + p[2] * q[2]);
}
/** Great-circle distance (km) between two points on a sphere of radius R km. */
export const gcKm = (R: number, a: LL, b: LL) => R * angle(a, b);
/** The point a fraction f of the way from a to b along their great circle. */
export function gcAt(a: LL, b: LL, f: number): LL {
  const w = angle(a, b); if (w < 1e-12) return a;
  const p = unit(a), q = unit(b), ka = Math.sin((1 - f) * w) / Math.sin(w), kb = Math.sin(f * w) / Math.sin(w), v = p.map((x, i) => ka * x + kb * q[i]);
  return [Math.atan2(v[2], Math.hypot(v[0], v[1])) / D2R, Math.atan2(v[1], v[0]) / D2R];
}
/** A grid's height at fractional sample (u east, v south), bilinear, held at the grid's edge. */
export function heightAt(z: ArrayLike<number>, N: number, u: number, v: number) {
  u = clamp(u, 0, N - 1); v = clamp(v, 0, N - 1);
  const i = Math.min(Math.floor(u), N - 2), j = Math.min(Math.floor(v), N - 2), fu = u - i, fv = v - j, o = j * N + i;
  return (z[o] * (1 - fu) + z[o + 1] * fu) * (1 - fv) + (z[o + N] * (1 - fu) + z[o + N + 1] * fu) * fv;
}
/** Where a point falls on a grid centred on `c` (fractional samples, u east and v south), or null outside its square. */
export function onGrid(G: Grid, R: number, c: LL, p: LL): [number, number] | null {
  const [x, y] = llToLocal(R, c[0], c[1], p[0], p[1]), h = G.ext / 2, k = (G.N - 1) / G.ext;
  return Math.abs(x) <= h * (1 + 1e-9) && Math.abs(y) <= h * (1 + 1e-9) ? [(x + h) * k, (h - y) * k] : null;
}
export interface Profile { km: number; d: number[]; z: number[] }
/** The ground along the great circle from a to b on a grid centred on `c`: its length and n + 1 points (`d` km from a,
 *  height `z` m), at least two per grid step so no sample is stepped over. */
export function profile(G: Grid, R: number, c: LL, a: LL, b: LL): Profile {
  const km = gcKm(R, a, b), n = clamp(Math.ceil(2 * km / (G.ext / (G.N - 1)) - 1e-9), 16, 1024), P: Profile = { km, d: [], z: [] };
  const h = G.ext / 2, k = (G.N - 1) / G.ext;
  for (let i = 0; i <= n; i++) {
    const [x, y] = llToLocal(R, c[0], c[1], ...gcAt(a, b, i / n));
    P.d.push(km * i / n); P.z.push(heightAt(G.z, G.N, (x + h) * k, (h - y) * k));
  }
  return P;
}
/** What a profile says: B's height over A's (`rise`), the climb and descent along the way (m, both positive), its lowest
 *  and highest ground, and its steepest grade between neighbouring points (degrees). */
export function profileStats({ d, z }: Profile) {
  let climb = 0, descent = 0, steep = 0;
  for (let i = 1; i < z.length; i++) {
    const dz = z[i] - z[i - 1]; if (dz > 0) climb += dz; else descent -= dz;
    if (d[i] > d[i - 1]) steep = Math.max(steep, Math.atan(Math.abs(dz) / ((d[i] - d[i - 1]) * 1000)) / D2R);
  }
  return { rise: z[z.length - 1] - z[0], climb, descent, lo: Math.min(...z), hi: Math.max(...z), steep };
}
/** A length for reading: metres under a kilometre, then three figures in km. */
export function fmtDist(km: number) {
  const m = Math.round(km * 1000), v = +km.toPrecision(3), f = v < 10 ? 2 : v < 100 ? 1 : 0;
  return m < 1000 ? `${m} m` : `${v.toLocaleString('en-GB', { maximumFractionDigits: f, minimumFractionDigits: f })} km`;
}
