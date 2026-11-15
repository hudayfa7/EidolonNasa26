#!/usr/bin/env node
// Playwright screenshot harness: every state in scripts/capture-states.mjs at desktop and phone size.
//
//   node scripts/capture.mjs --target=reference|build [--states=a,b] [--viewports=desktop,phone(,tablet,laptop,og)] [--url=...]
//                            [--timeout=120] [--compare-only]
//
// reference: serves reference/eidolon.html on a throwaway local server and seeks time with Playwright's fake clock.
// build:     reuses (or starts) the Vite dev server on :5173 and loads /?capture#<route>; drives window.__eidolon
//            (ready / seek / route, docs/progress.md) when the app exposes it, else falls back to the fake clock.
// Output: captures/<target>/<viewport>/<state>.png, captures/<target>/manifest.json, and side-by-side sheets
// captures/compare/<viewport>/<state>.png (reference left, build right).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATES } from './capture-states.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'captures');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const TARGET = args.target ?? 'build';
const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  // Opt-in (--viewports=tablet), not in a full run: the desktop layout at its narrowest stage, an iPad in portrait.
  tablet: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
  // Opt-in (--viewports=laptop): a 16:9 laptop window, wider than the posters' 16:10 (the fallback's crop).
  laptop: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 },
  // Opt-in (--viewports=og): a link preview's 1200 × 630, for the Open Graph image (state `og`, `npm run poster`).
  og: { viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 },
};
const vpNames = String(args.viewports ?? 'desktop,phone').split(',');
const wanted = args.states ? new Set(String(args.states).split(',')) : null;
const STATE_MS = Number(args.timeout ?? 120) * 1000;
// Capture-contract epoch (docs/progress.md): sim time is identical across runs and targets.
const EPOCH = Date.parse('2026-10-04T12:00:00Z');
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const NO_WEBGL = `{ const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; }`;
// Blocked site data: the storages throw on access, as a browser blocking a site's data has them.
const NO_STORAGE = `for (const k of ['localStorage', 'sessionStorage'])
  Object.defineProperty(window, k, { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });`;
// Fake rAF at 20 fps instead of the clock's 60: software WebGL costs ~80 ms a frame, and the reference has no
// frame-rate-dependent state (tweens are time-based; spin and inertia integrate dt, which it caps at exactly 50 ms).
const FRAME_20FPS = `{ const st = setTimeout, ct = clearTimeout;
  window.requestAnimationFrame = cb => st(() => cb(performance.now()), 50); window.cancelAnimationFrame = id => ct(id); }`;
// Reference "started": runIntro un-hides #intro, a deep link sets body[data-view], no WebGL shows #gl-fail.
const READY = {
  reference: () => document.body.dataset.view !== 'intro' || !document.getElementById('intro').hidden
    || getComputedStyle(document.getElementById('gl-fail')).display !== 'none',
  build: () => document.readyState === 'complete',
};

if (!['reference', 'build'].includes(TARGET)) fail(`--target must be reference or build, got ${TARGET}`);
for (const v of vpNames) if (!VIEWPORTS[v]) fail(`unknown viewport ${v} (${Object.keys(VIEWPORTS).join(', ')})`);
for (const s of wanted ?? []) if (!STATES.some(x => x.name === s)) fail(`unknown state ${s}`);

function fail(msg) { console.error(`capture: ${msg}`); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withTimeout = (p, ms, what) => {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000} s`)), ms); })])
    .finally(() => clearTimeout(t));
};

// Seq states run in one page; with --states, each group runs up to its last wanted state.
function groups() {
  const out = [], bySeq = new Map();
  for (const s of STATES) {
    if (s.seq && bySeq.has(s.seq)) { bySeq.get(s.seq).push(s); continue; }
    const g = [s]; out.push(g); if (s.seq) bySeq.set(s.seq, g);
  }
  return out.map(g => g.slice(0, g.findLastIndex(s => !wanted || wanted.has(s.name)) + 1)).filter(g => g.length);
}

async function serveReference() {
  const file = path.join(ROOT, 'reference/eidolon.html');
  const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] !== '/') return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() };
}

async function serveBuild() {
  const url = args.url ?? 'http://localhost:5173/';
  const isEidolon = () => fetch(url).then(r => r.text()).then(t => /<title>Eidolon<\/title>/.test(t), () => false);
  if (await isEidolon()) return { url, close() {} };
  if (args.url) fail(`${url} is not serving Eidolon`);
  console.log('starting vite dev server on :5173');
  const child = spawn(path.join(ROOT, 'node_modules/.bin/vite'), ['--port', '5173', '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { if (await isEidolon()) return { url, close: () => child.kill() }; await sleep(300); }
  child.kill(); fail('vite dev server did not come up on :5173 (port taken by something else?)');
}

// CDN scripts and fonts are fetched once per run and replayed to every context: faster, and fonts land before the
// reference's texture-gated start.
const netCache = new Map();
async function cacheExternal(ctx) {
  await ctx.route(/^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, async route => {
    const url = route.request().url();
    let hit = netCache.get(url);
    if (!hit) {
      const r = await route.fetch();
      hit = { status: r.status(), headers: r.headers(), body: await r.body() };
      if (r.ok()) netCache.set(url, hit);
    }
    await route.fulfill(hit);
  });
}

// Fake-clock driver (reference, and the build until it exposes __eidolon). Time only moves inside seek().
function clockDriver(page) {
  let t0 = 0;
  const now = () => page.evaluate(() => Date.now());
  return {
    async ready() {
      while (!(await page.evaluate(READY[TARGET]))) await sleep(50); // polled from Node: in-page timers are frozen
      t0 = await now();
    },
    async seek(s) {
      for (let left = t0 + s * 1000 - await now(); left > 0; left -= 1000) await page.clock.runFor(Math.min(left, 1000));
    },
    async route(h) {
      await page.evaluate(h => new Promise(r => {
        if (location.hash === h) return r();
        addEventListener('hashchange', () => r(), { once: true }); location.hash = h;
      }), h);
      t0 = await now();
    },
  };
}

function contractDriver(page) {
  return {
    async ready() { while (!(await page.evaluate(() => !!window.__eidolon))) await sleep(50); await page.evaluate(() => window.__eidolon.ready); },
    seek: s => page.evaluate(s => window.__eidolon.seek(s), s),
    route: h => page.evaluate(h => window.__eidolon.route(h), h),
  };
}

// First point (on a coarse grid) whose topmost element is `sel` or inside it.
const pointOn = (page, sel) => page.evaluate(sel => {
  const el = document.querySelector(sel);
  if (el) for (const fy of [.5, .35, .65, .2, .8]) for (const fx of [.5, .75, .25, .9, .1]) {
    const x = Math.round(innerWidth * fx), y = Math.round(innerHeight * fy), hit = document.elementFromPoint(x, y);
    if (hit && el.contains(hit)) return { x, y };
  }
  throw new Error(`no visible point on ${sel}`);
}, sel);

async function step(page, drv, st, scale = 1) {
  if ('seek' in st) return drv.seek(st.seek);
  if (st.route) return drv.route(st.route);
  if (st.fill) return page.locator(st.fill).fill(st.text, { timeout: 5000 });
  if (st.select) return page.locator(st.select).selectOption(st.value, { timeout: 5000 });
  if ('wait' in st) return sleep(st.wait);
  if (st.press) return page.keyboard.press(st.press);
  if (st.eval) return page.evaluate(st.eval);
  if (st.reload) { await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }); return withTimeout(drv.ready(), 60000, 'ready'); }
  if (st.expect) { if (!(await page.evaluate(sel => !!document.querySelector(sel), st.expect))) throw new Error(`nothing matches ${st.expect}`); return; }
  if (st.until) return page.waitForFunction(sel => !!document.querySelector(sel), st.until, { timeout: 60000, polling: 100 });
  if (st.inView) {
    const ok = await page.evaluate(sel => { const el = document.querySelector(sel), b = el?.getBoundingClientRect();
      return !!b && b.width > 0 && b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight && b.right <= innerWidth && el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)); }, st.inView);
    if (!ok) throw new Error(`${st.inView} is not on screen without scrolling`); return;
  }
  // `to`: scroll until that element's top is 12 px below the scroller's, or at its scroll padding (below a header that
  // sticks there: the overlay's toggle in the phone's sheet); the foot when it doesn't exist (e.g. on the reference).
  if (st.scroll) return page.locator(st.scroll).evaluate((el, to) => {
    const t = to && document.querySelector(to), pad = parseFloat(getComputedStyle(el).scrollPaddingTop) || 12;
    el.scrollTop = t ? el.scrollTop + t.getBoundingClientRect().top - el.getBoundingClientRect().top - pad : el.scrollHeight;
  }, st.to ?? null);
  if (st.tap || st.hover) {
    const sel = st.tap ?? st.hover, b = await page.locator(sel).boundingBox({ timeout: 5000 });
    if (!b) throw new Error(`${sel} has no box`);
    const x = b.x + b.width * (st.fx ?? .5), y = b.y + b.height * (st.fy ?? .5);
    await page.mouse.move(x - 3, y); await page.mouse.move(x, y);
    if (st.hover) return;
    await page.mouse.down(); await page.mouse.up();
    // A click that sets location.hash routes on hashchange, which Chromium delivers some 40 ms later (real time). Wait
    // here, with page time frozen on both targets, so the route starts at the tap's time, not during the next seek.
    await sleep(250);
    return;
  }
  if (st.drag) {
    const b = await page.locator(st.drag).boundingBox({ timeout: 5000 });
    if (!b) throw new Error(`${st.drag} has no box`);
    const at = f => [b.x + b.width * (st.fx + (st.tx - st.fx) * f), b.y + b.height * (st.fy + (st.ty - st.fy) * f)];
    await page.mouse.move(...at(0)); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(...at(i / 10));
    await page.mouse.up();
    return;
  }
  // Touch as a phone sends it (CDP touch points, so touch-action holds): one finger, or two 52 px apart across the
  // point, move by (dx, dy) in 10 steps while two fingers' gap goes to `spread` px and turns `twist` degrees clockwise;
  // `hold` ms still before they lift (a release with no flick).
  if (st.touch) {
    const b = await page.locator(st.touch).boundingBox({ timeout: 5000 });
    if (!b) throw new Error(`${st.touch} has no box`);
    const cx = b.x + b.width * (st.fx ?? .5), cy = b.y + b.height * (st.fy ?? .5), cdp = await page.context().newCDPSession(page);
    const at = s => {
      const r = (52 + ((st.spread ?? 52) - 52) * s) / 2, a = (st.twist ?? 0) * Math.PI / 180 * s, x = cx + (st.dx ?? 0) * s, y = cy + (st.dy ?? 0) * s;
      return (st.fingers ?? 1) === 1 ? [{ x, y, id: 0 }] : [{ x: x - r * Math.cos(a), y: y - r * Math.sin(a), id: 0 }, { x: x + r * Math.cos(a), y: y + r * Math.sin(a), id: 1 }];
    };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(i / 10) });
    if (st.hold) await sleep(st.hold);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    return;
  }
  if (st.wheel) {
    const b = 'fx' in st && await page.locator(st.at).boundingBox({ timeout: 5000 });
    const p = b ? { x: b.x + b.width * st.fx, y: b.y + b.height * st.fy } : await pointOn(page, st.at ?? 'body');
    // Chromium hands the page a wheel's delta divided by the device scale: undo it, so a state scrolls as far at any scale.
    await page.mouse.move(p.x, p.y); await page.mouse.wheel(st.wheel.dx * scale, st.wheel.dy * scale);
    return;
  }
  throw new Error(`unknown step ${JSON.stringify(st)}`);
}

async function runGroup(browser, base, vp, group, contract) {
  const first = group[0], results = [], useClock = !contract;
  const ctx = await browser.newContext({ ...VIEWPORTS[vp], ...(first.scale && { deviceScaleFactor: first.scale }), reducedMotion: first.reducedMotion ? 'reduce' : 'no-preference' });
  await cacheExternal(ctx);
  if (first.noWebGL) await ctx.addInitScript(NO_WEBGL);
  if (first.noStorage) await ctx.addInitScript(NO_STORAGE);
  const any = k => u => [k].flat().some(x => u.pathname.includes(x));
  if (first.block) await ctx.route(any(first.block), r => r.fulfill({ status: 404, body: '' }));
  if (first.hold) await ctx.route(any(first.hold), () => {});   // never answered
  // Recorded answers for cross-origin feeds (the weather's, under ?wx=feed), with the CORS header the feeds send.
  for (const [k, f] of Object.entries(first.serve ?? {}))
    await ctx.route(u => u.pathname.includes(k), r => r.fulfill({ path: path.join(ROOT, f), contentType: 'application/json', headers: { 'access-control-allow-origin': '*' } }));
  if (useClock) {
    await ctx.clock.install({ time: EPOCH - 1000 }); await ctx.clock.pauseAt(EPOCH);
    await ctx.addInitScript(FRAME_20FPS);
  }
  const page = await ctx.newPage();
  let errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  const drv = useClock ? clockDriver(page) : contractDriver(page);
  const note = s => [TARGET === 'reference' && s.refNA && 'n/a on reference', useClock && TARGET === 'build' && 'fake-clock fallback (no __eidolon)'].filter(Boolean).join('; ') || undefined;
  let broken = null;
  try {
    const query = [TARGET === 'build' && 'capture', first.query].filter(Boolean).join('&');
    await page.goto(base + (query ? `?${query}` : '') + first.route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (first.noReady) await page.evaluate(() => document.fonts.ready);
    else await withTimeout(drv.ready(), 60000, 'ready');
  } catch (e) { broken = `load failed: ${e.message}`; }
  for (const s of group) {
    const t = Date.now(), dir = path.join(OUT, TARGET, vp);
    if (broken) { results.push({ state: s.name, viewport: vp, ok: false, error: broken, consoleErrors: errors, ms: 0, note: note(s) }); continue; }
    try {
      await withTimeout((async () => {
        for (const st of s.steps) await step(page, drv, st, first.scale);
        await fs.mkdir(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${s.name}.png`), animations: 'disabled' });
      })(), STATE_MS, s.name);
      results.push({ state: s.name, viewport: vp, ok: true, consoleErrors: errors, ms: Date.now() - t, note: note(s) });
    } catch (e) {
      results.push({ state: s.name, viewport: vp, ok: false, error: e.message.split('\n')[0], consoleErrors: errors, ms: Date.now() - t, note: note(s) });
      broken = `skipped: ${s.name} failed earlier in seq ${s.seq}`;
    }
    console.log(`${results.at(-1).ok ? 'ok  ' : 'FAIL'} ${vp}/${s.name} ${results.at(-1).ms} ms${results.at(-1).error ? ` (${results.at(-1).error})` : ''}`);
    errors = [];
  }
  await ctx.close().catch(() => {});
  return results;
}

async function hasContract(browser, base) {
  const ctx = await browser.newContext(), page = await ctx.newPage();
  try {
    await page.goto(`${base}?capture#/`, { waitUntil: 'domcontentloaded' });
    return await page.waitForFunction(() => !!window.__eidolon, null, { timeout: 10000 }).then(() => true, () => false);
  } finally { await ctx.close(); }
}

async function webglRenderer(browser) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      return gl && (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'webgl2');
    });
  } finally { await page.close(); }
}

async function capture(browser) {
  const gl = await webglRenderer(browser);
  if (!gl) fail('headless Chromium has no WebGL2 (swiftshader flags not honoured?)');
  console.log(`WebGL: ${gl}`);
  const server = TARGET === 'reference' ? await serveReference() : await serveBuild();
  try {
    const contract = TARGET === 'build' && await hasContract(browser, server.url);
    console.log(`${TARGET} at ${server.url}, driver: ${contract ? '__eidolon' : 'fake clock'}`);
    const results = [];
    for (const vp of vpNames) for (const g of groups()) if (!g[0].only || g[0].only === vp) results.push(...await runGroup(browser, server.url, vp, g, contract));
    const file = path.join(OUT, TARGET, 'manifest.json');
    const old = await fs.readFile(file, 'utf8').then(JSON.parse, () => ({ states: {} }));
    for (const r of results) old.states[`${r.viewport}/${r.state}`] = r;
    await fs.writeFile(file, JSON.stringify({ target: TARGET, url: server.url, driver: contract ? '__eidolon' : 'fake clock', webgl: gl, updated: new Date().toISOString(), states: old.states }, null, 2));
    const bad = results.filter(r => !r.ok);
    console.log(`${results.length - bad.length}/${results.length} states captured${bad.length ? `; failed: ${bad.map(r => `${r.viewport}/${r.state}`).join(', ')}` : ''}`);
    return bad.length;
  } finally { server.close(); }
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
async function compareSheets(browser) {
  const manifests = Object.fromEntries(await Promise.all(['reference', 'build'].map(async t =>
    [t, await fs.readFile(path.join(OUT, t, 'manifest.json'), 'utf8').then(j => JSON.parse(j).states, () => ({}))])));
  const page = await browser.newPage();
  let n = 0;
  for (const vp of vpNames) {
    const { width: w, height: h } = VIEWPORTS[vp].viewport;
    for (const s of STATES) {
      if (wanted && !wanted.has(s.name)) continue;
      const side = await Promise.all(['reference', 'build'].map(async t => {
        const img = await fs.readFile(path.join(OUT, t, vp, `${s.name}.png`)).then(b => `data:image/png;base64,${b.toString('base64')}`, () => null);
        const m = manifests[t][`${vp}/${s.name}`];
        const tag = [m && !m.ok && `error: ${m.error}`, m?.note, m?.consoleErrors?.length && `${m.consoleErrors.length} console errors`].filter(Boolean).join(' · ');
        return `<figure><figcaption><b>${t}</b> ${esc(tag)}</figcaption>${img ? `<img src="${img}">` : '<div class="none">not captured</div>'}</figure>`;
      }));
      if (side.every(x => x.includes('not captured'))) continue;
      await page.setViewportSize({ width: 2 * w + 48, height: h + 80 });
      await page.setContent(`<style>
        body{margin:0;padding:12px 16px;background:#111;color:#ddd;font:12px/1.4 system-ui,sans-serif}
        h1{font-size:13px;margin:0 0 8px;font-weight:600} h1 span{font-weight:400;color:#999}
        .row{display:flex;gap:16px} figure{margin:0;width:${w}px} figcaption{height:18px;overflow:hidden;color:#999;white-space:nowrap}
        figcaption b{color:#ddd} img,.none{display:block;width:${w}px;height:${h}px;outline:1px solid #333}
        .none{display:grid;place-items:center;color:#666}</style>
        <h1>${esc(s.name)} <span>${vp} ${w}×${h} · ${esc(s.check)}</span></h1><div class="row">${side.join('')}</div>`);
      const dir = path.join(OUT, 'compare', vp);
      await fs.mkdir(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `${s.name}.png`), fullPage: true });
      n++;
    }
  }
  await page.close();
  console.log(`${n} compare sheets in captures/compare/`);
}

const browser = await chromium.launch({ args: GL_ARGS });
let failed = 0;
try {
  if (!args['compare-only']) failed = await capture(browser);
  await compareSheets(browser);
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
