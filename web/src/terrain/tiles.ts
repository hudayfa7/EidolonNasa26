// Engine-shaped elevation windows (spec §3.7: 94 × 94 heights at 200 m, row 0 north, column 0 west, null = no data):
// read into the Terrain the views draw, and written from the frontend's own heights for the mock.
import type { Elevation } from '../data/api';
import { measure, type Terrain } from './procedural';

/** A window from the engine as a Terrain; null when it isn't a square grid or holds no height at all (a trust boundary). */
export function fromElevation(e: Elevation, pal: string, engine: boolean): Terrain | null {
  const rows = e?.z, N = Array.isArray(rows) ? rows.length : 0;
  if (N < 2 || !rows.every(r => Array.isArray(r) && r.length === N)) return null;
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  let lo = Infinity; for (const r of rows) for (const v of r) if (ok(v) && v < lo) lo = v;
  if (lo === Infinity) return null;
  // shortcut: samples without data are drawn at the window's lowest height; show them as holes if real windows have many.
  const z = Float32Array.from(rows.flat(), v => ok(v) ? v : lo);
  return { ...measure(z, N, ok(e.extent_km) && e.extent_km > 0 ? e.extent_km : N * .2, pal), engine };
}

/** n × n heights (procedural.ts `heights`, row 0 north) as an engine window's rows, to 0.1 m like the engine's. */
export const windowZ = (z: Float32Array, n = 94): number[][] =>
  Array.from({ length: n }, (_, j) => Array.from(z.subarray(j * n, j * n + n), h => Math.round(h * 10) / 10));
