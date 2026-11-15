// The climate fit and the NASA surface values read at a target (README: "How the climate fit works"). Pure: no DOM.
//
// The fit is a coarse cold-and-dry band, never a measured distance and never part of the terrain match. The Earth side is
// the engine's `environment` block (WorldClim 2.1 mean annual air temperature, Global Aridity Index v3.1). The Moon and Mars
// have no air-temperature or aridity map comparable to those, so the bands are fixed: both worlds are far below freezing
// on average (data/bodies.ts) and have no liquid surface water. What NASA's orbiters measured at the target (Diviner,
// THEMIS) is shown beside it (surface.gen.json, scripts/fetch-surface.mjs) and is not scored: Earth has no like-for-like
// value to compare it with.
import surface from './surface.gen.json';
import type { MatchResult } from './types.gen';

export type Fit = 'match' | 'partial' | 'gap';
export type Verdict = 'Close' | 'Partial' | 'Weak';
export interface ClimateRow { key: 'temperature' | 'dryness'; status: Fit; earth: string }

/** Mean annual air temperature (°C) at or below which an Earth site is cold like the targets, and below which it is cool. */
export const COLD_C = 0, COOL_C = 15;
/** Aridity index (UNEP) below which a site is arid, and below which it is semi-arid. */
export const ARID = .2, SEMI_ARID = .5;

const ok = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const signed = (x: number, d: number) => `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}`;

/** An Earth site's climate against the targets' cold and dry; null when the engine gave no climate for it. */
export function climateFit(e: MatchResult['environment'] | undefined): { rows: ClimateRow[]; verdict: Verdict } | null {
  if (!e || !ok(e.t_mean_c) || !ok(e.aridity_index)) return null;
  const t = e.t_mean_c, ai = e.aridity_index;
  const rows: ClimateRow[] = [
    { key: 'temperature', status: t <= COLD_C ? 'match' : t <= COOL_C ? 'partial' : 'gap', earth: `${signed(t, 1)} °C mean` },
    { key: 'dryness', status: ai < ARID ? 'match' : ai < SEMI_ARID ? 'partial' : 'gap', earth: `aridity index ${ai.toFixed(2)}` },
  ];
  const pts = rows.reduce((n, r) => n + (r.status === 'match' ? 2 : r.status === 'partial' ? 1 : 0), 0);
  return { rows, verdict: pts >= 4 ? 'Close' : pts >= 2 ? 'Partial' : 'Weak' };
}

const D2R = Math.PI / 180;
/** Great-circle distance between two points on Earth, km (Earth's radius: only used to say how far apart two sites are). */
export const kmBetween = (a: number, b: number, c: number, d: number, R = 6371) => {
  const s = Math.sin((c - a) * D2R / 2) ** 2 + Math.cos(a * D2R) * Math.cos(c * D2R) * Math.sin((d - b) * D2R / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
};

export interface MoonValues { tbol_midnight_k: number | null; tbol_midnight_range_k: (number | null)[]; treg_midnight_k: number | null; rock_abundance: number | null }
export interface MarsValues { thermal_inertia: number | null; thermal_inertia_range: (number | null)[] }
/** The nearest entry of NASA's cave catalogue for the world (Mars: candidate entrances; Moon: pits) and how many lie within 100 km. */
export interface Caves { total: number; nearest_km: number; nearest_label: string; nearest_type: string; within_100_km: number }
/** Odyssey GRS element concentrations in the 5° bin holding a Mars site: weight percent but thorium in parts per million; null where the table has none. */
export interface Elements { bin_centre: number[]; bin_deg: number; h2o_wt: number | null; h2o_sigma: number | null; fe_wt: number | null; si_wt: number | null; k_wt: number | null; cl_wt: number | null; th_ppm: number | null }
export type Measured = { id: string; km: number; body: 'moon' | 'mars'; window_km: number; valid_px: number; of_px?: number; note?: string; caves?: Caves; elements?: Elements } & Partial<MoonValues & MarsValues>;
export const SOURCES = surface.sources;
export const ELEMENT_SOURCE = surface.sources.elements;
export const CAVE_SOURCES = surface.sources.caves;
export const FETCHED = surface.fetched;

/** How far from a featured site's centre a target may be and still take that site's values (the value is the centre's). */
export const NEAR_KM = 40;
const RADIUS = { moon: 1737.4, mars: 3389.5 };

/** The NASA surface values read at the featured site nearest a target of `body`, when one is within NEAR_KM. */
export function measuredAt(body: unknown, lat: unknown, lon: unknown): Measured | undefined {
  if ((body !== 'moon' && body !== 'mars') || !ok(lat) || !ok(lon)) return undefined;
  let best: Measured | undefined;
  for (const [id, s] of Object.entries(surface.sites as Record<string, Omit<Measured, 'id' | 'km'> & { lat: number; lon: number }>)) {
    if (s.body !== body) continue;
    const km = kmBetween(lat, lon, s.lat, s.lon, RADIUS[body]);
    if (km <= NEAR_KM && (!best || km < best.km)) best = { ...s, id, km };
  }
  return best;
}
