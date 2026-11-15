#!/usr/bin/env node
// axe-core over the main routes at desktop and phone size (Accessibility pass, docs/progress.md).
//
//   node scripts/a11y.mjs [--routes=a,b] [--viewports=desktop,phone] [--url=http://…/]
//
// Each route loads /?capture#<route> on the Vite dev server (reused on :5173, else started), as the capture harness
// does, seeks the app clock to `seek` (and runs `steps`), then runs axe with the WCAG 2.1 A and AA rules. Prints each
// violation with its elements; exit code 1 if there is any. Not during a capture run (one dev server, one GPU).
import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 800 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
const NO_WEBGL = `{ const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; }`;
const CELL = '#/mars/jezero/compare/@34.6750,-105.0750';
// The main routes, each at a moment its view has settled. `click` runs before the last seek.
const ROUTES = [
  { name: 'intro', route: '#/', seek: 3 },
  { name: 'title', route: '#/', seek: 16 },
  { name: 'system', route: '#/system', seek: 2.5 },
  { name: 'info', route: '#/system', seek: 2.5, click: '#cue', then: 4 },
  { name: 'beyond', route: '#/beyond', seek: 6 },
  { name: 'mars', route: '#/mars', seek: 2.5 },
  { name: 'moon', route: '#/moon', seek: 2.5 },
  { name: 'earth', route: '#/earth', seek: 2.5 },
  { name: 'grid', route: '#/mars/sites', seek: 21 },
  { name: 'site', route: '#/mars/jezero', seek: 4 },
  { name: 'site-pin', route: '#/mars/@18.3800,77.5800', seek: 10 },
  { name: 'site-earth', route: '#/earth/haughton', seek: 3 },
  { name: 'site-sun', route: '#/moon/malapert', seek: 3, click: '#sun-on', then: 3.5 },   // the sun-angle control on
  { name: 'site-slope', route: '#/mars/jezero', seek: 3, click: '#slope-on', then: 3.5 },   // the slope hazard layer on
  { name: 'site-measure', route: '#/mars/jezero', seek: 3, click: '#ms-on', then: 3.5 },   // profile and measure on: its fields
  { name: 'site-ellipse', route: '#/mars/jezero', seek: 3, click: '#ell-on', then: 3.5 },   // the landing ellipse on: its mission and axis
  { name: 'compare', route: '#/mars/jezero/compare/salda', seek: 3 },
  { name: 'compare-slope', route: '#/mars/jezero/compare/salda', seek: 3, click: '#slope-on', then: 3.5 },   // the slope hazard on compare
  { name: 'compare-globe', route: '#/mars/jezero/compare/salda/globe', seek: 3 },
  { name: 'compare-overlay', route: '#/mars/jezero/compare/salda/overlay', seek: 3 },
  { name: 'compare-cell', route: CELL, seek: 3 },
  { name: 'book-listing', route: `${CELL}/book`, seek: 3 },
  { name: 'book-plan', route: `${CELL}/book/plan`, seek: 3 },
  { name: 'book-errors', route: `${CELL}/book/plan`, seek: 3, click: '.bform button[type="submit"]', then: 3.5 },
  { name: 'campaigns', route: '#/mars', seek: 2.5, click: '#camps-btn', then: 3 },   // My campaigns' dialog (empty)
  { name: 'no-webgl', route: '#/system', seek: 45, noWebGL: true },
];
const wanted = args.routes ? new Set(String(args.routes).split(',')) : null;
const vpNames = String(args.viewports ?? 'desktop,phone').split(',');
for (const r of wanted ?? []) if (!ROUTES.some(x => x.name === r)) fail(`unknown route ${r}`);
for (const v of vpNames) if (!VIEWPORTS[v]) fail(`unknown viewport ${v}`);
function fail(msg) { console.error(`a11y: ${msg}`); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function serveBuild() {
  const url = args.url ?? 'http://localhost:5173/';
  const isEidolon = () => fetch(url).then(r => r.text()).then(t => /<title>Eidolon<\/title>/.test(t), () => false);
  if (await isEidolon()) return { url, close() {} };
  if (args.url) fail(`${url} is not serving Eidolon`);
  // Vite's own entry run by node: node_modules/.bin/vite is a shell script that Windows can't spawn.
  const child = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--port', '5173', '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { if (await isEidolon()) return { url, close: () => child.kill() }; await sleep(300); }
  child.kill(); fail('vite dev server did not come up on :5173');
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const server = await serveBuild();
let bad = 0;
try {
  for (const vp of vpNames) for (const r of ROUTES) {
    if (wanted && !wanted.has(r.name)) continue;
    const ctx = await browser.newContext(VIEWPORTS[vp]);
    if (r.noWebGL) await ctx.addInitScript(NO_WEBGL);
    const page = await ctx.newPage();
    try {
      await page.goto(`${server.url}?capture${r.route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => !!window.__eidolon, null, { timeout: 30000 });
      await page.evaluate(() => window.__eidolon.ready);
      await page.evaluate(s => window.__eidolon.seek(s), r.seek);
      // The sun, slope and ellipse controls sit in the View tools window (ui/panel.ts renderTools): open it first, as a user would.
      if (r.click) { await page.evaluate(() => document.querySelectorAll('#vtools details').forEach(d => { d.open = true; }));
        await page.locator(r.click).click({ timeout: 5000 }); await sleep(250); await page.evaluate(s => window.__eidolon.seek(s), r.then); }
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const v = res.violations;
      console.log(`${v.length ? 'FAIL' : 'ok  '} ${vp}/${r.name}${v.length ? `: ${v.length} rules` : ''}`);
      for (const x of v) {
        console.log(`  ${x.id} (${x.impact}): ${x.help}`);
        for (const n of x.nodes.slice(0, 8)) console.log(`    ${n.target.join(' ')}  ${n.failureSummary?.split('\n').slice(1).join(' ').slice(0, 160) ?? ''}`);
        if (x.nodes.length > 8) console.log(`    … ${x.nodes.length - 8} more`);
      }
      bad += v.length;
    } catch (e) {
      console.log(`FAIL ${vp}/${r.name}: ${e.message.split('\n')[0]}`); bad++;
    } finally { await ctx.close(); }
  }
} finally { server.close(); await browser.close(); }
console.log(bad ? `${bad} violations` : 'no violations');
process.exit(bad ? 1 : 0);
