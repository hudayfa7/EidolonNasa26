// The copy rules (docs/plan.md, Must: copy pass), checked on the built bundle after `vite build`: every string the
// app ships, its own and the engine fixtures the mock replays, minified as served, and the JSON beside it (the sites'
// and textures' manifests, whose credit lines reach the page). Exits 1 on a breach.
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../dist/', import.meta.url);
const files = readdirSync(dir, { recursive: true }).map(f => String(f).replaceAll('\\', '/')).filter(f => /\.(js|html|json)$/.test(f));
const read = f => readFileSync(new URL(f, dir), 'utf8');
const all = files.map(read).join('\n');
// The page's own copy and the app's code, apart: a required line must be in each that should hold it.
const PARTS = { 'index.html': read('index.html'), 'the JS': files.filter(f => /^assets\/.*\.js$/.test(f)).map(read).join('\n') };

const FORBIDDEN = [
  [/moon ?bnb/i, 'the engine spec’s product name: the app says Eidolon'],
  [/surface brightness/i, 'a surface-brightness claim: the search reads terrain form only'],
  [/%\s*analog|analog\s*%|\d\s*%\s*match/i, 'a score as a percentage'],
  [/finds? the closest double/i, 'the old promise of a double for every site'],
  [/every target has a double/i, 'the old tagline: some targets have no close analog, the south pole none yet'],
];
const REQUIRED = [   // both in the page (title blurb, info sheet) and the JS (intro, results)
  ['Typically 2 of 3 searches find a good terrain analog in the first five results.', 'the engine’s tested line, verbatim'],
  ['terrain form at 200', 'the terrain-form-at-200-m line'],
];

const bad = [
  ...FORBIDDEN.filter(([re]) => re.test(all)).map(([re, why]) => `found ${re}: ${why} (“${all.match(re)[0]}”)`),
  ...REQUIRED.flatMap(([s, why]) => Object.entries(PARTS).filter(([, t]) => !t.includes(s)).map(([where]) => `missing “${s}” in ${where}: ${why}`)),
];
if (bad.length) { console.error(`check-copy: ${bad.length} breach${bad.length > 1 ? 'es' : ''} in dist/\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`check-copy: ${files.length} files clean (${FORBIDDEN.length} forbidden phrases, ${REQUIRED.length} required lines)`);
