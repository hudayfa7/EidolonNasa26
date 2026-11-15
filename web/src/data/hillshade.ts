// A grey hillshade of an elevation window, lit like the engine's PNGs (spec §3.7: sun from the north-west), as RGBA
// pixels row by row from the north edge. The mock's images, and a coordinate target's twin, are drawn with it
// (data/client.ts shadeURL).
import type { Elevation } from './api';

// Unit vector towards the sun in (east, north, up): azimuth 315°, altitude 45°.
const L = [-.5, .5, Math.SQRT1_2];
export function hillshade(e: Elevation): Uint8ClampedArray<ArrayBuffer> {
  const N = e.size_px, z = e.z, p = e.pixel_m, v = new Float32Array(N * N).fill(NaN), out = new Uint8ClampedArray(N * N * 4);
  // The rise from a to b across c, as numpy's gradient (the engine's): central inside, one-sided at an edge or beside no data.
  const d = (a: number | null | undefined, c: number, b: number | null | undefined) => a != null && b != null ? (b - a) / 2 : b != null ? b - c : a != null ? c - a : 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = z[j]?.[i]; if (c == null) continue;   // no data: transparent
    const dx = d(z[j][i - 1], c, z[j][i + 1]) / p, dy = d(z[j + 1]?.[i], c, z[j - 1]?.[i]) / p;   // rise to the east, to the north
    v[j * N + i] = Math.max(0, (-dx * L[0] - dy * L[1] + L[2]) / Math.hypot(dx, dy, 1));
  }
  // Stretched to its own 2nd–98th percentile, as the judge's figures of the same windows are to their range (matplotlib
  // imshow): 18.8 km of gentle relief at true slope is a near-uniform grey. Under one grey level of spread it stays as lit.
  const s = v.filter(x => x === x).sort(), lo = s[Math.floor(.02 * (s.length - 1))], hi = s[Math.ceil(.98 * (s.length - 1))];
  const k = hi - lo > 1 / 255 ? 1 / (hi - lo) : 0;
  v.forEach((x, q) => { if (x === x) { out[q * 4] = out[q * 4 + 1] = out[q * 4 + 2] = 255 * (k ? (x - lo) * k : x); out[q * 4 + 3] = 255; } });
  return out;
}
