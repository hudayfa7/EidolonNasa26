// The engine over HTTP (VITE_DATA=engine), as engine/code/docs/frontend_spec.md describes it. Step 1 never runs it against
// an engine (none runs here): http.test.ts checks the requests it builds and the errors it maps.
import { EngineError, errorFrom, type Engine } from './api';
import type { SearchResponse } from './types.gen';

// The engine's address: VITE_API at build time (an engine run on another host or port, EIDOLON_HOST/PORT), else its default.
export const API = import.meta.env.VITE_API || 'http://127.0.0.1:8000/api/v1';
// A pin search reads a remote DEM for 5–10 s, and after a transient failure the engine reads it twice more, 5 s apart
// (api.py target_window): up to ~40 s. Past 60 s it is taken as gone.
const TIMEOUT_MS = 60_000;

async function call<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
      ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  } catch (e) { throw new EngineError(0, signal?.aborted ? 'aborted' : 'network', String(e)); }
  const json: unknown = await res.json().catch(() => undefined);
  if (!res.ok) throw errorFrom(res.status, json);
  // Typed, not schema-checked: both sides test the contract (docs/progress.md, Merge notes). A body that isn't an object fails here.
  if (!json || typeof json !== 'object') throw new EngineError(res.status, 'bad_response', 'The engine did not answer with JSON.');
  return json as T;
}
const query = (o: object) => new URLSearchParams(Object.entries(o).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
const seg = encodeURIComponent;

export const httpEngine: Engine = {
  health: () => call('/health'),
  purposes: () => call('/purposes'),
  sovereigns: () => call('/sovereigns'),
  targets: (q = {}) => call(`/targets?${query(q)}`),
  target: (body, name) => call(`/targets/${body}/${seg(name)}`),
  search: (req, signal) => call<SearchResponse>('/search', req, signal).then(r => {
    if (!Array.isArray(r.results)) throw new EngineError(200, 'bad_response', 'The search answer has no results list.');
    return r;
  }),
  elevation: of => call('cell' in of ? `/elevation/site/${of.cell}` : 'name' in of ? `/elevation/target/${of.body}/${seg(of.name)}`
    : `/elevation/point/${of.body}?${query({ lat: of.lat, lon: of.lon })}`),
};
