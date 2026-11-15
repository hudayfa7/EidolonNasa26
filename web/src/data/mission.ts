// Mission fit (docs/analog-weights.md: every weight's reasoning and its sources; docs/progress.md, Decisions 207 and 208): a weighted
// score over the factor groups an analog can be judged on, with the weights set by the mission the search is for. Pure: no DOM.
//
// Three analog tracks (docs/analog-weights.md, "Tracks"): a field site is judged on the site factors, a facility on target fidelity, human
// factors and infrastructure, a hybrid (a habitat on a field site) on both. A factor that does not apply to an analog's track is N/A and
// drops out; a factor that applies but has no data is "not assessed" and drops out too. Neither ever counts as zero: the weights are
// re-normalised over what is scored. The engine's Earth doubles are field sites.
//
// It is separate from the terrain match: it never changes the engine's score, its ranking or which land is searched. The weights are our
// judgment, reasoned in docs/analog-weights.md; no source gives numeric weights.
import type { Verdict } from './climate';

export type Factor = 'terrain' | 'climate' | 'astro' | 'ops' | 'fidelity' | 'human' | 'infra';
export type Track = 'field' | 'facility' | 'hybrid';
export const FACTOR_ORDER: Factor[] = ['terrain', 'climate', 'astro', 'ops', 'fidelity', 'human', 'infra'];
export const FACTOR_LABEL: Record<Factor, string> = {
  terrain: 'Terrain form', climate: 'Climate', astro: 'Astrobiology', ops: 'Operations',
  fidelity: 'Gravity, pressure and radiation', human: 'Crew', infra: 'Infrastructure',
};
/** Which factors each track is judged on. */
export const APPLIES: Record<Track, Factor[]> = {
  field: ['terrain', 'climate', 'astro', 'ops', 'infra'],
  facility: ['fidelity', 'human', 'infra'],
  hybrid: FACTOR_ORDER,
};
export const TRACK_WORD: Record<Track, string> = { field: 'Field site', facility: 'Facility', hybrid: 'Hybrid: a habitat on a field site' };

/** Each mission's weights over the factor groups, summing to 100. Keys are the engine's purposes (spec §3.2). */
export const PROFILES: Record<string, Record<Factor, number>> = {
  rover_mobility: { terrain: 45, climate: 10, astro: 0, ops: 20, fidelity: 10, human: 0, infra: 15 },
  drill_isru: { terrain: 30, climate: 20, astro: 0, ops: 15, fidelity: 10, human: 0, infra: 25 },
  eva_training: { terrain: 25, climate: 10, astro: 0, ops: 15, fidelity: 25, human: 10, infra: 15 },
  habitat_ops: { terrain: 5, climate: 5, astro: 0, ops: 15, fidelity: 15, human: 45, infra: 15 },
  astrobiology: { terrain: 15, climate: 25, astro: 35, ops: 10, fidelity: 0, human: 0, infra: 15 },
  thermal: { terrain: 10, climate: 45, astro: 0, ops: 15, fidelity: 15, human: 0, infra: 15 },
  education: { terrain: 40, climate: 0, astro: 0, ops: 30, fidelity: 0, human: 0, infra: 30 },
};
/** A mission's weights; one the engine adds later takes rover mobility's (as data/weather.ts limitsOf does). */
export const profileOf = (purpose: unknown) => typeof purpose === 'string' && Object.hasOwn(PROFILES, purpose) ? PROFILES[purpose] : PROFILES.rover_mobility;
/** How much of a mission's 100 weight a track can be judged on at all. */
export const applicableWeight = (purpose: unknown, track: Track) => APPLIES[track].reduce((n, k) => n + profileOf(purpose)[k], 0);
/** The weight a mission puts on what only a facility gives (fidelity and human factors): when high, an existing facility belongs beside the field sites. */
export const facilityWeight = (purpose: unknown) => profileOf(purpose).fidelity + profileOf(purpose).human;

const ok = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
/** Terrain form, 0–100: the engine's terrain score (0–1, measured at 200 m). Rock type is not in it. */
export const terrainScore = (score: unknown) => ok(score) ? Math.max(0, Math.min(100, score * 100)) : null;
/** Climate, 0–100: the climate fit's verdict (data/climate.ts), a judgment band. */
export const climateScore = (v: Verdict | undefined) => v === 'Match' ? 100 : v === 'Partial' ? 50 : v === 'Gap' ? 0 : null;
/** Operations, 0–100: the share of the year's months under the mission's weather limits (data/weather.ts bestMonths). */
export const opsScore = (months: number[] | undefined) => months ? Math.round(months.length / 12 * 100) : null;

/** The sun heights (degrees) the shadow fit compares (terrain/shadowfit.ts). Low, because at the windows' 200 m spacing only a grazing sun is blocked by ordinary slopes. */
export const SUN_HEIGHTS = [1, 2, 4];
/**
 * How much of Operations the shadow fit carries (0–1; terrain/shadowfit.ts), by mission: shadows hide hazards from a rover's cameras and
 * a crew's eyes and decide solar power, so rover mobility, EVA training and drilling count them; a mission that never moves over the ground
 * (education, thermal testing, astrobiology, habitation) does not. Our judgment; no source gives it (docs/analog-weights.md).
 */
export const SHADOW_W: Record<string, number> = { rover_mobility: .4, drill_isru: .3, eva_training: .4 };
export const shadowWeight = (purpose: unknown) => typeof purpose === 'string' && Object.hasOwn(PROFILES, purpose) ? (SHADOW_W[purpose] ?? 0) : SHADOW_W.rover_mobility;
/**
 * Operations, 0–100: the workable months (opsScore) and, for the missions that count it, the shadow fit, as a weighted mean over what is
 * held (the months' weight is one less the shadow's); null when neither is.
 */
export function operationsScore(purpose: unknown, months: number[] | undefined, shadow: number | null | undefined) {
  const w = shadowWeight(purpose), parts: [number, number][] = [];
  const m = opsScore(months); if (m !== null) parts.push([1 - w, m]);
  if (w > 0 && ok(shadow)) parts.push([w, Math.max(0, Math.min(100, shadow))]);
  const t = parts.reduce((n, [x]) => n + x, 0);
  return t ? Math.round(parts.reduce((n, [x, v]) => n + x * v, 0) / t) : null;
}

export type Tier = 'A' | 'B' | 'C' | 'D' | 'F';
export const TIER_WORD: Record<Tier, string> = { A: 'Strong', B: 'Usable with caveats', C: 'Marginal', D: 'Poor', F: 'Unsuitable' };
export const tierOf = (score: number): Tier => score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : score >= 25 ? 'D' : 'F';
/** A tier needs the track to reach at least this much of the mission's 100 weight, and half of that reached weight to be assessed. */
export const MIN_APPLICABLE = 50;

export interface FitRow { key: Factor; weight: number; score: number | null; na: boolean }
export interface MissionFit { rows: FitRow[]; score: number | null; applicable: number; assessed: number; tier: Tier | null }
/**
 * The mission fit of an analog of `track` for `purpose`, from the factor scores held (0–100 each; null or absent: not assessed). The score
 * is the weighted mean over the assessed, applicable factors (re-normalised). The tier is withheld when the track reaches under MIN_APPLICABLE
 * of the mission's weight (the mission needs another kind of analog), or when under half of what it reaches is assessed.
 */
export function missionFit(purpose: unknown, scores: Partial<Record<Factor, number | null>>, track: Track = 'field'): MissionFit {
  const P = profileOf(purpose), on = new Set(APPLIES[track]);
  const rows = FACTOR_ORDER.filter(k => P[k] > 0).map(key => ({ key, weight: P[key], na: !on.has(key), score: on.has(key) && ok(scores[key]) ? scores[key] : null }));
  const applicable = rows.filter(r => !r.na).reduce((n, r) => n + r.weight, 0), got = rows.filter(r => r.score !== null);
  const assessed = got.reduce((n, r) => n + r.weight, 0), score = assessed ? Math.round(got.reduce((n, r) => n + r.weight * r.score!, 0) / assessed) : null;
  return { rows, score, applicable, assessed, tier: score !== null && applicable >= MIN_APPLICABLE && assessed * 2 >= applicable ? tierOf(score) : null };
}
