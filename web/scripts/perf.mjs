#!/usr/bin/env node
// The performance budget (plan, Verification): JavaScript gzipped, first paint on a fast mobile connection, GPU memory
// with all three worlds loaded, frame rate on the system and body views. Measures the production build (`npm run perf`
// builds first) through `vite preview`, with Playwright Chromium on the machine's own GPU (ANGLE Metal on macOS; the
// run aborts on a software renderer). Numbers go to docs/progress.md, "Performance".
//
//   node scripts/perf.mjs [--only=bundle,paint,memory,fps] [--runs=3]
//
// bundle: every chunk's gzip size, and the JS the browser actually fetches to start #/ (the budget's number).
// paint:  first contentful paint of the poster and the app's start (the poster's fade), phone, cold cache, DevTools'
//         Fast 4G preset (165 ms, 9 Mbit/s down, 1.5 up, each × .9) and a 4× CPU slowdown; median of --runs. On the
//         intro, the system and a site's and a compare's deep links (each waits on its own worlds' low-tier maps and,
//         on a site, the elevation patches its views read first).
// memory: GPU memory from the WebGL calls themselves (an init script tallies every texture, render target,
//         renderbuffer and vertex/index buffer allocation by size and format, mip levels included, frees on delete),
//         plus the canvas's drawing buffer (two: front and back). Not counted: 2D canvases and the page's compositor
//         layers.
// fps:    requestAnimationFrame intervals over 4 s after a 3.5 s settle, per route; draw calls per frame from the same
//         init script; main-thread ms per frame from CDP Performance.getMetrics. Laptop: this machine at 1280 × 800,
//         device scale 2 (and 1512 × 860, this Mac full screen); again without vsync for the headroom over the target
//         (60 fps; 30 on the phone). Phone proxy: 390 × 844 at scale 3 (the app's phone path), 4× CPU slowdown, on
//         this machine's GPU.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const ONLY = new Set(String(args.only ?? 'bundle,paint,memory,fps').split(','));
const RUNS = Number(args.runs ?? 3);
const PORT = 4173, URL = `http://localhost:${PORT}/`;
const GPU_ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const BUDGET = { js: 350, paint: 1500, gpu: 300 };   // KB gzip, ms, MB; frame rates per device in fps()
const FAST_4G = { offline: false, latency: 60 * 2.75, downloadThroughput: 9e6 / 8 * .9, uploadThroughput: 1.5e6 / 8 * .9 };
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 };
const MAC = { viewport: { width: 1512, height: 860 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const kb = n => (n / 1024).toFixed(1), mb = n => (n / 2 ** 20).toFixed(1);
const gz = async f => zlib.gzipSync(await fs.readFile(f)).length;
const over = [];   // what missed the budget: the exit code is 1 if anything did
const ok = (v, max, what) => { if (v > max) over.push(what); return v <= max ? 'ok' : 'OVER'; };

// Tallies GPU allocations from the WebGL2 calls three.js and postprocessing make. Bytes per texel by sized internal
// format, or by unsized format × type; RGB formats count as 4 (drivers pad them).
const PROBE = `(() => {
  const SIZED = { 0x8229: 1, 0x822B: 2, 0x8051: 4, 0x8058: 4, 0x8C41: 4, 0x8C43: 4, 0x822D: 2, 0x822F: 4, 0x881B: 8, 0x881A: 8,
    0x822E: 4, 0x8230: 8, 0x8815: 16, 0x8814: 16, 0x81A5: 2, 0x81A6: 4, 0x8CAC: 4, 0x88F0: 4, 0x8CAD: 8, 0x8D48: 1, 0x8C3A: 4, 0x8059: 4 };
  const CH = { 0x1908: 4, 0x1907: 4, 0x1909: 1, 0x190A: 2, 0x1906: 1, 0x1903: 1, 0x8227: 2, 0x1902: 1, 0x84F9: 1 };
  const TY = { 0x1400: 1, 0x1401: 1, 0x1402: 2, 0x1403: 2, 0x1404: 4, 0x1405: 4, 0x1406: 4, 0x140B: 2, 0x84FA: 4 };
  const NAME = { 0x8229: 'R8', 0x822B: 'RG8', 0x8058: 'RGBA8', 0x8C43: 'SRGB8_A8', 0x881A: 'RGBA16F', 0x8814: 'RGBA32F', 0x81A6: 'DEPTH24', 0x88F0: 'DEPTH24_S8', 0x1908: 'RGBA' };
  const bpp = (f, t) => SIZED[f] ?? (CH[f] ?? 4) * (TY[t] ?? 1);
  const P = WebGL2RenderingContext.prototype, tex = new Map(), rbs = new Map(), bufs = new Map(), rt = new Set(), ctxs = [];
  const st = gl => gl.__pf ??= { unit: 0x84C0, bound: {}, rb: null, buf: {} };
  const bindTarget = t => (t >= 0x8515 && t <= 0x851A ? 0x8513 : t);
  const cur = (gl, t) => st(gl).bound[st(gl).unit + ':' + bindTarget(t)];
  const dims = s => [s.naturalWidth || s.videoWidth || s.displayWidth || s.width, s.naturalHeight || s.videoHeight || s.displayHeight || s.height];
  const rec = (t, key, bytes, w, h, f) => { if (!t) return; const e = tex.get(t) ?? { lv: {}, w, h, f }; e.lv[key] = bytes; if (key.endsWith(':0') || key === 'storage') Object.assign(e, { w, h, f }); tex.set(t, e); };
  const wrap = (name, fn) => { const o = P[name]; P[name] = function (...a) { fn.call(this, a); return o.apply(this, a); }; };
  let draws = 0;
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...a) { const c = gc.call(this, type, ...a); if (c && type === 'webgl2' && !ctxs.includes(c)) ctxs.push(c); return c; };
  wrap('activeTexture', function ([u]) { st(this).unit = u; });
  wrap('bindTexture', function ([t, x]) { st(this).bound[st(this).unit + ':' + t] = x; });
  wrap('texImage2D', function (a) {
    const [w, h] = a.length === 6 ? dims(a[5]) : [a[3], a[4]], type = a.length === 6 ? a[4] : a[7];
    rec(cur(this, a[0]), a[0] + ':' + a[1], w * h * bpp(a[2], type), w, h, NAME[a[2]] ?? a[2]);
  });
  wrap('compressedTexImage2D', function (a) { rec(cur(this, a[0]), a[0] + ':' + a[1], a[6]?.byteLength ?? a[6], a[3], a[4], 'compressed ' + a[2]); });
  wrap('texStorage2D', function ([t, levels, f, w, h]) {
    let b = 0; for (let i = 0; i < levels; i++) b += Math.max(1, w >> i) * Math.max(1, h >> i) * bpp(f) * (t === 0x8513 ? 6 : 1);
    rec(cur(this, t), 'storage', b, w, h, NAME[f] ?? f);
  });
  wrap('generateMipmap', function ([t]) {
    const e = tex.get(cur(this, t)); if (!e || e.lv.storage) return;
    const b0 = e.lv[t + ':0'] ?? 0, n = Math.floor(Math.log2(Math.max(e.w, e.h)));
    for (let i = 1; i <= n; i++) e.lv[t + ':' + i] = b0 / 4 ** i;
  });
  wrap('deleteTexture', function ([t]) { tex.delete(t); rt.delete(t); });
  wrap('framebufferTexture2D', function (a) { if (a[3]) rt.add(a[3]); });
  wrap('bindRenderbuffer', function ([, r]) { st(this).rb = r; });
  wrap('renderbufferStorage', function ([, f, w, h]) { rbs.set(st(this).rb, w * h * bpp(f)); });
  wrap('renderbufferStorageMultisample', function ([, s, f, w, h]) { rbs.set(st(this).rb, w * h * bpp(f) * Math.max(1, s)); });
  wrap('deleteRenderbuffer', function ([r]) { rbs.delete(r); });
  // three binds a buffer right before it sizes it (WebGLAttributes), so the last bind per target is the one sized.
  wrap('bindBuffer', function ([t, b]) { st(this).buf[t] = b; });
  wrap('bufferData', function ([t, d]) { const b = st(this).buf[t]; if (b) bufs.set(b, typeof d === 'number' ? d : d?.byteLength ?? 0); });
  wrap('deleteBuffer', function ([b]) { bufs.delete(b); });
  for (const d of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements']) wrap(d, () => { draws++; });
  window.__perf = {
    get draws() { return draws; },
    mem() {
      let images = 0, targets = 0, n = 0; const big = [];
      for (const [t, e] of tex) {
        const b = Object.values(e.lv).reduce((s, v) => s + v, 0); n++;
        if (rt.has(t)) targets += b; else images += b;
        big.push([b, (rt.has(t) ? 'target ' : 'texture ') + e.w + 'x' + e.h + ' ' + e.f]);
      }
      for (const [, b] of rbs) { targets += b; big.push([b, 'renderbuffer']); }
      let buffers = 0; for (const [, b] of bufs) buffers += b;
      let drawing = 0;
      for (const c of ctxs) {
        if (c.isContextLost() || !c.canvas.isConnected) continue;
        const at = c.getContextAttributes(); drawing += c.drawingBufferWidth * c.drawingBufferHeight * (8 + (at.depth || at.stencil ? 4 : 0));
      }
      const gl = ctxs.find(c => !c.isContextLost() && c.canvas.isConnected);
      return { images, targets, buffers, drawing, total: images + targets + buffers + drawing, textures: n, buffer: gl ? [gl.drawingBufferWidth, gl.drawingBufferHeight] : null,
        top: big.sort((a, b) => b[0] - a[0]).slice(0, 12) };
    },
  };
})()`;

// When the poster starts to fade (the scene's first frame, app.ts), in page time.
const STARTED = `(() => { const f = () => { const p = document.getElementById('poster');
  if (!p || +getComputedStyle(p).opacity < 1) window.__started = performance.now(); else requestAnimationFrame(f); };
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(f)); })()`;

async function preview() {
  const up = () => fetch(URL).then(r => r.ok, () => false);
  if (await up()) throw new Error(`:${PORT} is already in use; stop that server first`);
  const child = spawn(path.join(ROOT, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { if (await up()) return () => child.kill(); await sleep(200); }
  child.kill(); throw new Error('vite preview did not come up');
}

async function launch() {
  const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
  const p = await browser.newPage();
  const gpu = await p.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'), e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : String(!!gl); });
  await p.close();
  if (/swiftshader|llvmpipe|software/i.test(gpu)) throw new Error(`software renderer (${gpu}): the numbers would not mean anything`);
  return { browser, gpu };
}

const appStarted = page => page.waitForFunction(() => window.__started, null, { timeout: 120000, polling: 100 });

async function bundle(browser) {
  const files = (await fs.readdir(path.join(DIST, 'assets'))).filter(f => /\.(js|css)$/.test(f));
  const sizes = Object.fromEntries(await Promise.all(files.map(async f => [f, await gz(path.join(DIST, 'assets', f))])));
  const startJs = async route => {
    const ctx = await browser.newContext(LAPTOP), page = await ctx.newPage(), seen = new Set();
    page.on('request', r => { const m = r.url().match(/\/assets\/([^/?]+\.js)/); if (m) seen.add(m[1]); });
    await page.addInitScript(STARTED); await page.goto(URL + route); await appStarted(page); await sleep(500);
    await ctx.close(); return [...seen];
  };
  const start = await startJs('#/'), sys = await startJs('#/system');
  console.log('\n## Bundle (gzip)\n\n| Chunk | gzip KB | On #/ start | On #/system start |\n| --- | --- | --- | --- |');
  for (const f of files.sort((a, b) => sizes[b] - sizes[a])) console.log(`| ${f.replace(/-[\w-]{8}\./, '.')} | ${kb(sizes[f])} | ${start.includes(f) ? 'yes' : ''} | ${sys.includes(f) ? 'yes' : ''} |`);
  const total = l => l.reduce((s, f) => s + sizes[f], 0);
  console.log(`\nJS fetched to start #/: ${kb(total(start))} KB gzip (budget ${BUDGET.js}: ${ok(total(start) / 1024, BUDGET.js, 'JS')}); #/system: ${kb(total(sys))} KB`);
}

async function paint(browser) {
  console.log(`\n## First paint (phone 390 × 844 @3, Fast 4G, 4× CPU, cold cache, median of ${RUNS})\n`);
  console.log('| Route | First contentful paint ms | App started ms | Runs (FCP) |\n| --- | --- | --- | --- |');
  for (const route of ['#/', '#/system', '#/mars/jezero', '#/mars/jezero/compare/salda']) {
    const fcp = [], started = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext(PHONE), page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', FAST_4G); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(STARTED);
      await page.goto(URL + route, { waitUntil: 'commit' });
      await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length, null, { timeout: 60000, polling: 100 });
      fcp.push(await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0].startTime));
      await appStarted(page); started.push(await page.evaluate(() => window.__started));
      await ctx.close();
    }
    console.log(`| ${route} | ${median(fcp).toFixed(0)} (${ok(median(fcp), BUDGET.paint, `first paint ${route}`)}) | ${median(started).toFixed(0)} | ${fcp.map(v => v.toFixed(0)).join(', ')} |`);
  }
}

// The walk starts on the system (all three worlds' maps hold its start; Beyond's load after it and only reach 2D
// canvases), then adds the per-view targets: a body, a site's terrain, a compare.
const WALK = ['#/system', '#/mars', '#/moon', '#/earth', '#/mars/jezero', '#/mars/jezero/compare/salda'];
async function memory(browser) {
  console.log('\n## GPU memory (WebGL allocations, peak over a walk: system, the three bodies, a site, a compare)\n');
  console.log('| Device | Drawing buffer | Textures MB | Render targets MB | Vertex/index buffers MB | Drawing buffer MB | Total MB | Peak at |\n| --- | --- | --- | --- | --- | --- | --- | --- |');
  let worst = 0, detail;
  for (const [name, dev] of [['laptop 1280 × 800 @2', LAPTOP], ['laptop 1512 × 860 @2 (this Mac, full screen)', MAC], ['laptop 1920 × 1080 @1', { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }], ['phone 390 × 844 @3', PHONE]]) {
    const ctx = await browser.newContext(dev), page = await ctx.newPage();
    await page.addInitScript(PROBE); await page.addInitScript(STARTED);
    await page.goto(URL + WALK[0]); await appStarted(page);
    let peak = { total: 0 };
    for (const r of WALK) {
      await page.evaluate(h => { location.hash = h; }, r); await sleep(3500);
      const m = await page.evaluate(() => window.__perf.mem());
      if (m.total > peak.total) peak = { ...m, at: r };
    }
    console.log(`| ${name} | ${peak.buffer?.join(' × ')} | ${mb(peak.images)} | ${mb(peak.targets)} | ${mb(peak.buffers)} | ${mb(peak.drawing)} | ${mb(peak.total)} (${ok(peak.total / 2 ** 20, BUDGET.gpu, `GPU memory, ${name}`)}) | ${peak.at} |`);
    if (peak.total > worst) { worst = peak.total; detail = [name, peak]; }
    await ctx.close();
  }
  console.log(`\nLargest allocations, ${detail[0]}: ` + detail[1].top.map(([b, d]) => `${d} ${mb(b)} MB`).join('; '));
  // Self-check of the tally: a 4096 × 2048 colour map with its full mip chain is 4096 · 2048 · 4 · 4/3 bytes.
  if (!detail[1].top.some(([b, d]) => /4096x2048/.test(d) && Math.abs(b - 4096 * 2048 * 4 * 4 / 3) < 1e3)) throw new Error('GPU tally self-check failed: no 4K colour map at its mip-chain size');
}

const ROUTES = ['#/system', '#/mars', '#/moon', '#/earth', '#/mars/jezero', '#/mars/jezero/compare/salda'];
// GPU timer queries aren't usable here: on ANGLE Metal a pass of 8 × 5 pixels reads 2 ms. Without vsync the frame
// rate is the throughput instead (GSAP's ticker stops it at 240): the headroom over the target.
async function fps(browser) {
  console.log('\n## Frame rate (rAF over 4 s after a 3.5 s settle)\n');
  console.log('| Device | Route | fps | Median ms | p95 ms | Headroom × | Draw calls / frame | Main thread ms / frame | Drawing buffer |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  free = await chromium.launch({ headless: true, args: [...GPU_ARGS, '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  for (const [name, dev, cpu, target, b] of [['laptop 1280 × 800 @2', LAPTOP, 1, 60, browser], ['laptop 1512 × 860 @2', MAC, 1, 60, browser],
    ['phone proxy 390 × 844 @3, 4× CPU', PHONE, 4, 30, browser], ['laptop 1280 × 800 @2, no vsync', LAPTOP, 1, 60, free],
    ['phone proxy 390 × 844 @3, 4× CPU, no vsync', PHONE, 4, 30, free]]) {
    const ctx = await b.newContext(dev), page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
    await page.addInitScript(PROBE); await page.addInitScript(STARTED);
    await cdp.send('Performance.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.goto(URL + ROUTES[0]); await appStarted(page);
    const lite = await page.evaluate(() => matchMedia('(pointer: coarse) and (max-width: 1024px)').matches);
    for (const r of ROUTES) {
      await page.evaluate(h => { location.hash = h; }, r); await sleep(3500);
      const task = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value])).TaskDuration;
      const t0 = await task();
      // Frames the app drew: animation frames with draw calls (without vsync most draw nothing).
      const s = await page.evaluate(ms => new Promise(res => {
        const t = [], d0 = window.__perf.draws, s0 = performance.now(); let d = d0;
        const f = now => { const x = window.__perf.draws; if (x > d) t.push(now); d = x;
          if (now - s0 < ms) requestAnimationFrame(f); else res({ t, draws: x - d0, buf: window.__perf.mem().buffer }); };
        requestAnimationFrame(f);
      }), 4000);
      const busy = (await task()) - t0, iv = s.t.slice(1).map((v, i) => v - s.t[i]), n = iv.length;
      const f = n / ((s.t[n] - s.t[0]) / 1000), capped = b === free && f > 238;
      // Fewer than two frames drawn (canvas covered, paused, or drawing stopped) is a miss, not a pass on NaN.
      if (!(n > 0 && Number.isFinite(f))) { over.push(`frame rate, ${name} ${r}: ${s.t.length} frames drawn`); console.log(`| ${name} | ${r} | ${s.t.length} frames drawn | | | | | | |`); continue; }
      if (b !== free && f < target * .95) over.push(`frame rate, ${name} ${r}`);
      console.log(`| ${name}${lite ? ' (phone path)' : ''} | ${r} | ${f.toFixed(1)} | ${median(iv).toFixed(1)} | ${pct(iv, .95).toFixed(1)} | ${b === free ? (capped ? '≥ ' : '') + (f / target).toFixed(1) : ''} | ${(s.draws / n).toFixed(0)} | ${(busy * 1000 / n).toFixed(1)} | ${s.buf?.join(' × ')} |`);
    }
    await ctx.close();
  }
}

let stop = () => {}, browser, free;   // free: fps()'s no-vsync browser, closed here too if a measure throws
try {
  await fs.access(path.join(DIST, 'index.html')).catch(() => { throw new Error('no dist/: run `npm run perf` (it builds first)'); });
  stop = await preview();
  const l = await launch(); browser = l.browser;
  console.log(`# Eidolon performance, ${new Date().toISOString().slice(0, 10)}\n\nGPU: ${l.gpu}; Chromium ${browser.version()}; vite preview (gzip)`);
  if (ONLY.has('bundle')) await bundle(browser);
  if (ONLY.has('paint')) await paint(browser);
  if (ONLY.has('memory')) await memory(browser);
  if (ONLY.has('fps')) await fps(browser);
  console.log(over.length ? `\nOver budget: ${over.join('; ')}` : '\nEverything measured is within the budget.');
  if (over.length) process.exitCode = 1;
} catch (e) {
  console.error(`perf: ${e.message}`); process.exitCode = 1;
} finally {
  await browser?.close(); await free?.close(); stop();
}
