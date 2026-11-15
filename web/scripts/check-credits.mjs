// The credits gate (npm run check:credits, and the end of npm run build): every source the data scripts read has an
// entry in scripts/sources.mjs with a licence, and a row in docs/credits.md whose licence is stated and resolved.
// Fails on:
// - a URL in scripts/fetch-real-data.mjs or scripts/fetch-surface.mjs (literal, or built from a base constant such as
//   `USGS + '…'`) that no entry in sources.mjs covers;
// - a NASA GIBS layer either script asks for that docs/credits.md doesn't name;
// - an entry without a licence, or whose `anchor` is in no row of docs/credits.md, or whose row's Licence cell is empty;
// - any row of docs/credits.md whose Licence cell says the licence is unchecked or unknown.
// The scripts are read as text, not imported: importing them would start their downloads.
import { readFileSync } from 'node:fs';
import { SOURCES, sourceFor } from './sources.mjs';

const ROOT = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');
const SCRIPTS = ['scripts/fetch-real-data.mjs', 'scripts/fetch-surface.mjs'];
const credits = read('docs/credits.md'), lines = credits.split('\n');
const fail = [];

// 1. Every URL the scripts read has an entry.
for (const f of SCRIPTS) {
  const src = read(f);
  const bases = Object.fromEntries([...src.matchAll(/const (\w+) = '(https?:\/\/[^']+)'/g)].map(m => [m[1], m[2]]));
  const urls = new Set([...src.matchAll(/https?:\/\/[^\s'"`)<>\\]+/g)].map(m => m[0].replace(/\$\{.*$/, '')));
  for (const [name, base] of Object.entries(bases)) for (const m of src.matchAll(new RegExp(`\\b${name} \\+ '([^']+)'`, 'g'))) urls.add(base + m[1]);
  for (const u of urls) {
    // A base the scripts build on (e.g. the USGS bucket's root) is covered when an entry's URL starts with it.
    const base = Object.values(SOURCES).some(s => [s.url].flat().some(x => x.startsWith(u)));
    if (!sourceFor(u) && !base) fail.push(`${f}: ${u} has no entry in scripts/sources.mjs`);
  }
  for (const m of src.matchAll(/(?:gibsBox|GIBS)\('([A-Za-z0-9_]+)'/g)) if (!credits.includes(m[1])) fail.push(`${f}: the GIBS layer ${m[1]} is not named in docs/credits.md`);
}

// 2. The Licence cell of a table row: the column headed Licence in the nearest header row above it.
const licenceOf = i => {
  const cells = l => l.split('|').slice(1, -1).map(c => c.trim());
  for (let h = i; h >= 0; h--) if (/^\| *(Asset|Data|File|Font) *\|/.test(lines[h]) && /\| *Licence *\|/.test(lines[h])) {
    const col = cells(lines[h]).indexOf('Licence'); return col < 0 ? undefined : cells(lines[i])[col];
  }
  return undefined;
};
const UNRESOLVED = /not (yet )?checked|unknown:|licence unknown/i;

// 3. Every entry has a licence and a credits row whose licence is stated.
for (const [k, s] of Object.entries(SOURCES)) {
  if (!s.licence?.trim()) fail.push(`sources.mjs ${k}: no licence`);
  if (!s.citation?.trim()) fail.push(`sources.mjs ${k}: no citation`);
  const i = lines.findIndex(l => l.includes(s.anchor));
  if (i < 0) { fail.push(`sources.mjs ${k}: no row in docs/credits.md contains "${s.anchor}"`); continue; }
  if (lines[i].startsWith('|')) { const lic = licenceOf(i); if (!lic) fail.push(`docs/credits.md:${i + 1} (${k}): no licence in its row`); }
  else if (!/licen[cs]e/i.test(lines[i])) fail.push(`docs/credits.md:${i + 1} (${k}): its line states no licence`);
}

// 4. No row's licence is left unchecked.
lines.forEach((l, i) => { if (l.startsWith('|') && !/^\| *-/.test(l)) { const lic = licenceOf(i); if (lic && UNRESOLVED.test(lic)) fail.push(`docs/credits.md:${i + 1}: licence unresolved: ${lic.slice(0, 80)}`); } });

if (fail.length) { console.error(`check-credits: ${fail.length} problem(s)\n  ${fail.join('\n  ')}`); process.exit(1); }
console.log(`check-credits: ${Object.keys(SOURCES).length} sources, each with a licence and a credits row; every URL in ${SCRIPTS.length} data scripts covered`);
