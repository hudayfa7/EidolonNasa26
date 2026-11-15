// Every engine example validates against its JSON Schema, and so does everything the mock derives (searches, targets)
// and every booking listing: the mock and the listings stay on the engine's contract.
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it, vi } from 'vitest';
import type { SearchRequest } from './types.gen';

// listing.ts reads the established sites (data/sites.ts), whose pins sample textures through the renderer.
vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { mockEngine } = await import('./mock');
const { listing } = await import('./listing');

const files = import.meta.glob<unknown>('../../contracts/**/*.json', { eager: true, import: 'default' });
const ajv = new Ajv2020({ allErrors: true });
for (const [path, schema] of Object.entries(files)) if (!path.includes('/examples/')) ajv.addSchema(schema as object);
function valid(schema: string, data: unknown) {
  const v = ajv.getSchema(`https://eidolon.local/contracts/${schema}.json`);
  expect(v, schema).toBeDefined();
  expect(v!(data), `${schema}: ${ajv.errorsText(v!.errors)}`).toBe(true);
}
// The schema each example answers to (first match); health and purposes have none (hand-typed in api.ts).
const RULES: [RegExp, string | null][] = [
  [/api\/search_\w+\.request\.json$/, 'api/search_request'], [/api\/search_\w+\.response\.json$/, 'api/search_response'],
  [/api\/error_\w+\.json$/, 'api/error'], [/api\/targets_\w+\.json$/, 'api/targets_list'], [/api\/target_\w+\.json$/, 'api/target_summary'],
  [/api\/(health|purposes)\.json$/, null],
  [/examples\/match_\w+\.json$/, 'match_result'], [/examples\/site_\w+\.json$/, 'site_listing'], [/examples\/target_\w+\.json$/, 'target'],
];

describe('engine examples (contracts/examples/)', () => {
  const examples = Object.entries(files).filter(([p]) => p.includes('/examples/'));
  it('are all here', () => expect(examples.length).toBe(18));
  it.each(examples)('%s validates against its schema', (path, data) => {
    const rule = RULES.find(([re]) => re.test(path));
    expect(rule, `no schema rule for ${path}`).toBeDefined();
    if (rule![1]) for (const d of Array.isArray(data) ? data : [data]) valid(rule![1], d);
  });
});

describe('mock responses and listings', () => {
  const m = mockEngine(new Set(), { wait: async () => {}, now: () => 0 }, () => []);
  // Each request with the number of results it gets: k, or fewer when the filters leave fewer cells (none for Chile).
  const reqs = [
    [{ target: { body: 'mars', name: 'Gale' }, purpose: 'rover_mobility', k: 5 }, 5],                        // a featured target, no example
    [{ target: { body: 'mars', lat: 47.2, lon: 184.3 }, purpose: 'drill_isru', k: 20 }, 20],                  // a pin, past the pool's end
    [{ target: { body: 'mars', name: 'Jezero' }, purpose: 'rover_mobility', k: 20 }, 20],                     // an example, extended
    [{ target: { body: 'moon', name: 'Rima Hadley' }, purpose: 'eva_training', k: 12, filters: { sovereigns: ['United States of America'] } }, 12],
    [{ target: { body: 'moon', name: 'Shorty' }, purpose: 'education', k: 20 }, 20],                         // sub-resolution, rugged cells
    [{ target: { body: 'mars', name: 'Nirgal Vallis' }, purpose: 'rover_mobility', k: 10, filters: { bbox: [-125, 30, -100, 45], access: ['partner'] } }, 10],
    [{ target: { body: 'moon', name: 'Taurus Littrow Valley' }, purpose: 'education', k: 3, filters: { sovereigns: ['Chile'], exclude_polar: true } }, 0],
    // every filter the panel sets (ui/panel.ts), on a target from the lazy catalogue
    [{ target: { body: 'mars', name: 'Jezero Mons' }, purpose: 'education', k: 5,
      filters: { sovereigns: ['United States of America'], bbox: [-154.48, -3.07, -55.67, 69.6], access: ['partner'], exclude_polar: true, surface: 'any' } }, 5],
    [{ target: { body: 'mars', name: 'Gale' }, purpose: 'education', k: 20, filters: { surface: 'barren' } }, 20],   // the surface filter's other side
  ] as [SearchRequest, number][];
  it.each(reqs)('search %j', async (req, n) => {
    valid('api/search_request', req);
    const res = await m.search(req);
    valid('api/search_response', res);
    expect(res.results.map(r => r.rank)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    expect(new Set(res.results.map(r => r.site_id)).size).toBe(n);
    for (const r of res.results) valid('site_listing', listing(r));
  });
  it('the listings of the established analog sites (booked from compare as doubles that are no search result)', async () => {
    const { SITES } = await import('./sites');
    for (const e of SITES.earth) {
      expect(e.country && ['partner', 'non_partner', 'antarctic_treaty'].includes(e.access!), e.id).toBe(true);   // its access drives the permits copy
      const l = listing({ site_id: e.id, location: { lat: e.lat, lon: e.lon, country: e.country, sovereign: e.country, access: e.access } });
      valid('site_listing', l);
      expect(l).toMatchObject({ name: e.name, country: e.country, known_analog: { label_ids: [e.id] } });
    }
  });
  it('targets and target detail', async () => {
    valid('api/targets_list', await m.targets({}));
    valid('api/targets_list', await m.targets({ body: 'moon', q: 'a', family: 'other', limit: 2 }));
    for (const t of (await m.targets()).targets) valid('api/target_summary', await m.target(t.body, t.name!));
  });
});
