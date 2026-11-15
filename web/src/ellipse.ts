// Landing ellipses (plan, Stretch): a mission's landing ellipse (data/missions.ts) at its true size on a site's grid
// (terrain/procedural.ts Terrain: N × N samples `ext` km wide edge to edge, row 0 north), centred on the site, its long
// axis at an azimuth, and how much of it is steeper than a slope. Pure but for the session's choice (`landing`); tested
// (ellipse.test.ts).
import { compass, D2R, llToLocal, type Body } from './coords';
import { BODIES } from './data/bodies';
import { MISSIONS, type Mission } from './data/missions';
import { heightAt } from './profile';

/** The landing ellipse control (ui/ellipse.ts): on, the site view's block and map draw the chosen mission's ellipse,
 *  its long axis `az` degrees from north. Held for the session. */
export const landing = { on: false, id: '', az: 90 };
/** The missions offered on a body: its own; on Earth, where analogs are tested, all of them. */
export const missionsOf = (b: Body) => MISSIONS.filter(m => b === 'earth' || m.body === b);
/** The chosen mission on a body, or the first it offers. */
export const missionOf = (b: Body) => { const ms = missionsOf(b); return ms.find(m => m.id === landing.id) ?? ms[0]; };
/** A mission's ellipse in words (HTML, a number held to its unit): "7.7 × 6.6 km", or a circle's "200 m across". */
export const sizeOf = (m: Mission) => m.a === m.b ? `${m.a < 1 ? `${Math.round(m.a * 1000)}&nbsp;m` : `${m.a}&nbsp;km`} across` : `${m.a}&nbsp;×&nbsp;${m.b}&nbsp;km`;
/** On a mission's own site, where it really came down (HTML): its ellipse here is drawn on the site's centre, not where
 *  NASA's lay. Off its own site, nothing. */
export function landedOf(m: Mission, b: Body, s: { id: string; lat: number; lon: number }) {
  const l = m.landed; if (l?.site !== s.id) return '';
  const [x, y] = llToLocal(BODIES[b].R, s.lat, s.lon, l.lat, l.lon);
  return `Not where it landed: ${m.name} came down ${Math.round(Math.hypot(x, y))}&nbsp;km ${compass(Math.atan2(x, y) / D2R)} of the crosshair, at ${l.name}, inside NASA’s own ellipse.`;
}
/** Whether a mission's ellipse is under 8 px across on a site's map (ui/topomap.ts: 320 px wide at its scale, `ext` km
 *  across): too small to see, so the map rings it, larger than its true size (the block does the same at its own zoom). */
export const ringed = (m: Mission, ext: number) => m.a / ext * 320 < 8;
/** A share as the panel gives it: a fraction to two places, but never rounded to none or all when it isn't. */
export const shareOf = (f: number) => f === 0 ? 'None' : f < .005 ? 'Under 0.01' : f === 1 ? 'All' : f >= .995 ? 'Over 0.99' : f.toFixed(2);
/** An axis at azimuth az (degrees) in words, northern end first: "north–south", "east–west", "north-west–south-east". */
export function axisWords(az: number) {
  const w = [compass(az), compass(az + 180)]; if (w[1].startsWith('north') || w[0] === 'west') w.reverse();
  return w.join('–');
}
/** Where a point (x east, y north, km from the centre) lies against an ellipse of full axes a × b km, its long axis at
 *  az° from north: under 1 inside, 1 on its edge. */
export function ellR(x: number, y: number, a: number, b: number, az: number) {
  const s = Math.sin(az * D2R), c = Math.cos(az * D2R);
  return Math.hypot((x * s + y * c) / (a / 2), (x * c - y * s) / (b / 2));
}
/** An ellipse centred on a grid of slopes (degrees; N × N, ext km edge to edge, row 0 north): its area (km²), the share
 *  of it inside the grid's square, and the share of that over `over` degrees, from n × n points spread evenly over the
 *  part of its bounding box inside the square, each slope bilinear between the grid's samples (as the block's tint has
 *  it). Whether it runs past the square is exact (its half-widths east and north); so is the part inside when the
 *  square lies wholly within it. */
export function ellSteep(sl: ArrayLike<number>, N: number, ext: number, a: number, b: number, az: number, over: number, n = 256) {
  const s = Math.sin(az * D2R), c = Math.cos(az * D2R), A = a / 2, B = b / 2, h = ext / 2, k = (N - 1) / ext;
  const ex = Math.hypot(A * s, B * c), ey = Math.hypot(A * c, B * s), X = Math.min(ex, h), Y = Math.min(ey, h);
  let inn = 0, st = 0;
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
    const x = ((p + .5) / n * 2 - 1) * X, y = ((q + .5) / n * 2 - 1) * Y; if (ellR(x, y, a, b, az) > 1) continue;
    inn++; if (heightAt(sl, N, (x + h) * k, (h - y) * k) > over) st++;
  }
  const area = Math.PI * A * B;
  return { area, inside: ex > h || ey > h ? inn * 4 * X * Y / (n * n) / area : 1, steep: inn ? st / inn : 0 };
}
