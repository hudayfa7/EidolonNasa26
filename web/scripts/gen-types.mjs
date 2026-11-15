// Generates src/data/types.gen.ts from the engine's JSON Schemas in contracts/ (one file, all types exported).
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';

const ROOT = new URL('../contracts/', import.meta.url);
const OUT = new URL('../src/data/types.gen.ts', import.meta.url);
// Type name per schema file; titles like "POST /api/v1/search body" make poor identifiers. "error" would shadow Error.
const NAMES = {
  'match_result.json': 'MatchResult', 'site_listing.json': 'SiteListing', 'target.json': 'Target',
  'api/error.json': 'ApiError', 'api/search_request.json': 'SearchRequest', 'api/search_response.json': 'SearchResponse',
  'api/target_summary.json': 'TargetSummary', 'api/targets_list.json': 'TargetsList',
};

const files = [
  ...(await readdir(ROOT)).filter(f => f.endsWith('.json')),
  ...(await readdir(new URL('api/', ROOT))).filter(f => f.endsWith('.json')).map(f => `api/${f}`),
].sort();
const unknown = files.filter(f => !NAMES[f]);
if (unknown.length) throw new Error(`no type name for ${unknown.join(', ')}: add it to NAMES in scripts/gen-types.mjs`);

const parts = [];
for (const f of files) {
  const url = new URL(f, ROOT), schema = JSON.parse(await readFile(url, 'utf8'));
  // $refs are resolved from disk relative to the file; referenced schemas keep their own titles (MatchResult, Target summary).
  delete schema.$id;
  schema.title = NAMES[f];
  parts.push(await compile(schema, NAMES[f], {
    cwd: new URL('.', url).pathname, bannerComment: `/** contracts/${f} */`, declareExternallyReferenced: false,
  }));
}
await writeFile(OUT, `// generated, do not edit, npm run types\n\n${parts.join('\n')}`);
console.log(`wrote src/data/types.gen.ts (${files.length} schemas)`);
