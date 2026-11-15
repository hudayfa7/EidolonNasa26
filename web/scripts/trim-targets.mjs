// Writes src/data/targets.json, the mock's copy of the engine's IAU target store (targets/targets.json, 10,100 features),
// for GET /targets autocomplete: without the 6,252 lunar satellite craters (code SF, hidden by the engine unless asked
// for), compact. Each code carries its IAU descriptor and family (server.py FAMILY, family_of); `cap` the capability
// row per body and code (data/landform_capability_v2.csv, as engine.py Index.capability matches a descriptor).
// Lat/lon rounded to 4 dp as server.py _target_summary does; diameters as stored.
// Usage: node scripts/trim-targets.mjs [engine bundle dir, default ../engine]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '../engine');
const store = JSON.parse(readFileSync(`${root}/targets/targets.json`, 'utf8'));
const [head, ...lines] = readFileSync(`${root}/code/data/landform_capability_v2.csv`, 'utf8').trim().split('\n');
const cols = head.split(','), caps = lines.map(l => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));   // no quoted fields
const FAMILY = { depression: 'AA SF CA CB PE', linear: 'VA RI FO DO RU CM SC SU LA LB', raised: 'MO TH MN CO PR CH TA PM' };
const familyOf = code => Object.keys(FAMILY).find(f => FAMILY[f].split(' ').includes(code)) ?? 'other';
const capOf = (body, type) => {
  const t = type.toLowerCase().split(' (')[0].trim();
  return caps.find(r => r.body === body && (t === r.landform_type || r.aliases.split(' ').includes(t)));
};
const r4 = x => Math.round(x * 1e4) / 1e4;

const out = { source: 'eidolon_search targets/targets.json without code SF; see scripts/trim-targets.mjs', codes: {}, cap: {}, mars: [], moon: [] };
for (const m of store) {
  if (m.code === 'SF') continue;
  const type = m.type.split(',')[0];
  out.codes[m.code] ??= [type, familyOf(m.code)];
  const c = capOf(m.body, type);
  if (c) out.cap[`${m.body}|${m.code}`] ??= [c.tier, +c.p_target_top3, +c.n_targets, c.landform_type];
  out[m.body].push([m.name, m.code, r4(m.lat), r4(m.lon), m.diameter_km]);
}
const json = JSON.stringify(out);
writeFileSync('src/data/targets.json', json + '\n');
console.log(`src/data/targets.json: ${out.mars.length} Mars + ${out.moon.length} Moon targets, ${(json.length / 1024).toFixed(0)} KB`);
