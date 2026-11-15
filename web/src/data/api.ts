// Hand-written types for engine responses that have no JSON Schema in contracts/, the engine interface both data
// clients implement, and the error every failed call rejects with.
// Source: engine/code/docs/frontend_spec.md (v1.0.0) and the fixtures in contracts/examples/api/.
import type { ApiError, SearchRequest, SearchResponse, TargetSummary, TargetsList } from './types.gen';

/** GET /api/v1/health (spec §3.1; contracts/examples/api/health.json). The last three fields appear only when ready. */
export interface Health {
  status: 'warming_up' | 'ready' | 'error';
  error: string | null;
  uptime_s: number;
  api_version: string;
  matcher: string;
  judge: string;
  engine_commit: string | null;
  index_sites?: number;
  named_targets?: number;
  cached_queries?: number;
}

/** One entry of GET /api/v1/purposes (spec §3.2). `polar_lighting_geometry` has `supported: false` and `surface: null`. */
export interface Purpose {
  key: string;
  label: string;
  surface: 'barren' | 'any' | null;
  description: string;
  supported: boolean;
}

/** GET /api/v1/purposes: the fixture wraps the list (contracts/examples/api/purposes.json). */
export interface PurposesResponse {
  purposes: Purpose[];
}

/** GET /api/v1/sovereigns (spec §3.6): the states with indexed sites, for the country picker. No fixture exists. */
export interface SovereignsResponse {
  sovereigns: { name: string; sites: number }[];
}

/** GET /api/v1/targets/{body}/{name} (spec §3.4; contracts/examples/api/target_jezero.json). */
export type TargetDetail = TargetSummary & {
  relief_sd_m: number;
  window: { size_px: number; pixel_m: number; extent_km: number };
};

/**
 * GET /api/v1/elevation/{target/{body}/{name} | point/{body}?lat=&lon= | site/{cell}} (spec §3.7).
 * Row 0 is north, column 0 west, on a local azimuthal-equidistant grid; heights in metres relative to the body's datum, null = no data.
 */
export interface Elevation {
  size_px: number;
  pixel_m: number;
  extent_km: number;
  units: 'm';
  row0: 'north';
  col0: 'west';
  z: (number | null)[][];
}

/** GET /api/v1/targets query (spec §3.3). */
export interface TargetsQuery {
  body?: TargetSummary['body'];
  q?: string;
  family?: NonNullable<TargetSummary['family']>;
  include_satellite?: boolean;
  limit?: number;
  offset?: number;
}
/** Which 94 × 94 window GET /api/v1/elevation/... returns: a named target, any point, or an Earth cell (spec §3.7). */
export type ElevationOf = { body: TargetSummary['body']; name: string } | { body: TargetSummary['body']; lat: number; lon: number } | { cell: number };

/** The engine's endpoints, as mock.ts and http.ts both implement them; data/client.ts picks one. */
export interface Engine {
  health(): Promise<Health>;
  purposes(): Promise<PurposesResponse>;
  sovereigns(): Promise<SovereignsResponse>;
  targets(q?: TargetsQuery): Promise<TargetsList>;
  target(body: TargetSummary['body'], name: string): Promise<TargetDetail>;
  /** `signal` aborts it (one pin search at a time, data/client.ts): it then rejects with `aborted` at once. */
  search(req: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
  elevation(of: ElevationOf): Promise<Elevation>;
}

/**
 * The engine's error codes (contracts/api/error.json), plus the client's own: no answer, FastAPI's validation array, a
 * body that isn't the contract's, warming_up from an engine whose /health says its warm-up failed, and a search the
 * client called off itself.
 */
type ErrorCode = Extract<ApiError['detail'], { code: unknown }>['code'] | 'network' | 'invalid_request' | 'bad_response' | 'start_failed' | 'aborted';
/** Every failed call rejects with one of these (spec §6: one error component keyed on the code). */
export class EngineError extends Error {
  constructor(readonly status: number, readonly code: ErrorCode, message: string = code) { super(message); }
}
/** An error from an HTTP status and its body: `{detail: {code, message}}`, or `{detail: [...]}` for request validation. */
export function errorFrom(status: number, body: unknown): EngineError {
  const d = (body as Partial<ApiError> | null | undefined)?.detail;
  if (Array.isArray(d)) return new EngineError(status, 'invalid_request', JSON.stringify(d));
  if (d && typeof d.code === 'string') return new EngineError(status, d.code, typeof d.message === 'string' ? d.message : d.code);
  return new EngineError(status, 'bad_response', `HTTP ${status}`);
}
