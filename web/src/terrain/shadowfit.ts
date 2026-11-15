// Shadow fit: how alike the shadows are on two sites' windows (the target's and an Earth double's), a sub-score of the mission fit's Operations
// factor (docs/analog-weights.md, "Shadow fit"; docs/progress.md, Decision 209). It reuses the site view's own shadow march (sunlit in
// ./mesh, which the sun control draws), so the number is the shadows the app shows, at true scale over each body's curve.
//
// For each window: the share in shadow at three grazing sun heights (1°, 2°, 4°: sunrise and sunset, and the Moon's poles), each averaged over eight compass directions, so it describes the
// terrain's horizon structure and not one time of day. The fit is 100 less how far the two shares are apart, averaged over the heights, scaled so
// a 25-point difference scores 0. A judgment score: it overlaps relief and slope (the terrain match already has them) and is only as good as the
// windows, so it is scored only where both are real elevation (a procedural window's shadows are illustrative).
import { SUN_HEIGHTS } from '../data/mission';
import type { Terrain } from './procedural';
import { sunlit } from './mesh';

export { SUN_HEIGHTS };
export const AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315];
/** The difference between two windows' shadowed shares (0–1) that scores 0. */
export const ZERO_AT = .25;
const cache = new WeakMap<Terrain, { R: number; shares: number[] }>();

/** A window's shadowed share at each of SUN_HEIGHTS (0–1, averaged over AZIMUTHS), for a body of radius R km. Kept per terrain. */
export function shadowShares(T: Terrain, R: number): number[] {
  const hit = cache.get(T); if (hit && hit.R === R) return hit.shares;
  const shares = SUN_HEIGHTS.map(alt => {
    let dark = 0;
    for (const az of AZIMUTHS) { const m = sunlit(T, az, alt, R); let n = 0; for (let k = 0; k < m.length; k++) n += 1 - m[k]; dark += n / m.length; }
    return dark / AZIMUTHS.length;
  });
  cache.set(T, { R, shares });
  return shares;
}

/** 0–100: how alike two windows' shadowed shares are (100: the same at every sun height). */
export function shadowFit(a: number[], b: number[]) {
  const d = a.reduce((n, x, k) => n + Math.abs(x - b[k]), 0) / a.length;
  return Math.round(100 * Math.max(0, 1 - d / ZERO_AT));
}

export interface ShadowResult { fit: number; target: number[]; earth: number[] }
/** The shadow fit of a target's window against an Earth double's; null unless both are real elevation (a procedural window's shadows are illustrative). */
export function shadowOf(target: Terrain, Rt: number, earth: Terrain, Re = 6371): ShadowResult | null {
  const real = (T: Terrain) => !!(T.engine || T.src);
  if (!real(target) || !real(earth)) return null;
  const a = shadowShares(target, Rt), b = shadowShares(earth, Re);
  return { fit: shadowFit(a, b), target: a, earth: b };
}
