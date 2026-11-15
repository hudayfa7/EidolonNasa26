// The seam against a running engine (`npm run test:live`, mode `live`): every call in http.ts answers, and what it answers
// validates against the engine's JSON Schemas. Skipped in `npm test`. Start the engine first (MERGE.md, step 2); run it
// once right after it starts (the warming path) and once warm. VITE_API points at it if it isn't on :8000.
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { EngineError } from './api';
import { httpEngine } from './http';
import type { SearchResponse } from './types.gen';

const files = import.meta.glob<unknown>('../../contracts/**/*.json', { eager: true, import: 'default' });
const ajv = new Ajv2020({ allErrors: true });
for (const [path, schema] of Object.entries(files)) if (!path.includes('/examples/')) ajv.addSchema(schema as object);
const valid = (schema: string, data: unknown) => {
  const v = ajv.getSchema(`https://eidolon.local/contracts/${schema}.json`);
  expect(v, schema).toBeDefined();
  expect(v!(data), `${schema}: ${ajv.errorsText(v!.errors)}`).toBe(true);
};
// While it warms up every call but /health answers warming_up: retry for up to 90 s, as the client's elevation does.
async function warm<T>(f: () => Promise<T>, n = 30): Promise<T> {
  try { return await f(); } catch (e) {
    if (n > 0 && e instanceof EngineError && e.code === 'warming_up') { await new Promise(r => setTimeout(r, 3000)); return warm(f, n - 1); }
    throw e;
  }
}
const elevation = (e: { size_px: number; z: unknown[][] }) => { expect(e.z.length).toBe(e.size_px); expect(e.z[0].length).toBe(e.size_px); };

describe.skipIf(import.meta.env.MODE !== 'live')('the live engine', () => {
  it('health: ready, with its counts', async () => {
    const h = await httpEngine.health();
    expect(['warming_up', 'ready']).toContain(h.status);
    await warm(async () => { const r = await httpEngine.health(); if (r.status !== 'ready') throw new EngineError(503, 'warming_up', 'warming'); return r; });
    const r = await httpEngine.health(); expect(r.index_sites).toBeGreaterThan(0);
  });
  it('purposes and sovereigns', async () => {
    const p = await warm(() => httpEngine.purposes()); expect(p.purposes.length).toBeGreaterThan(0);
    const s = await warm(() => httpEngine.sovereigns()); expect(s.sovereigns.length).toBeGreaterThan(0);
  });
  it('targets list and one target', async () => {
    const l = await warm(() => httpEngine.targets({ body: 'mars', q: 'Jezero', limit: 3 })); valid('api/targets_list', l);
    const t = await warm(() => httpEngine.target('mars', 'Jezero')); valid('api/target_summary', t);
  });
  it('a named search validates, five results', async () => {
    const r: SearchResponse = await warm(() => httpEngine.search({ target: { body: 'mars', name: 'Jezero' }, purpose: 'rover_mobility', k: 5 }));
    valid('api/search_response', r); expect(r.results.length).toBe(5);
  });
  it('a named search with a country filter', async () => {
    const r = await warm(() => httpEngine.search({ target: { body: 'mars', name: 'Jezero' }, purpose: 'rover_mobility', k: 5, filters: { sovereigns: ['United States of America'] } }));
    valid('api/search_response', r);
  });
  it('an unknown target is refused with its code', async () => {
    await expect(warm(() => httpEngine.target('mars', 'Nowhere Planitia'))).rejects.toMatchObject({ code: 'unknown_target' });
  });
  it('elevation by target and by site cell', async () => {
    elevation(await warm(() => httpEngine.elevation({ body: 'mars', name: 'Jezero' })));
    const r = await warm(() => httpEngine.search({ target: { body: 'mars', name: 'Jezero' }, purpose: 'rover_mobility', k: 1 }));
    const cell = Number(String(r.results[0].site_id).replace('earth_cell_', ''));
    elevation(await warm(() => httpEngine.elevation({ cell })));
  });
  it('the Moon has no elevation beyond 59.5° by point', async () => {
    await expect(warm(() => httpEngine.elevation({ body: 'moon', lat: -89.5, lon: 0 }))).rejects.toMatchObject({ code: 'no_dem' });
  });
});
