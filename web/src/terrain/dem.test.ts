// Real elevation patches: loading the manifest and each patch's file, which patch holds a window, sampling it back, and
// loading a patch when a window first reads it.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { llToLocal } from '../coords';

vi.mock('./sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));   // no textures (or DOM) here

// A patch on Mars at the equator: a plane rising 10 m per km to the east, 40 km wide at 1 km; a finer one inside it; an
// Earth window; and a crop.
const plane = (n: number, km: number) => Array.from({ length: n * n }, (_, i) => 1000 + 10 * (-km / 2 + (i % n) * km / (n - 1)));
function files(patches: { body: string; lat: number; lon: number; km: number; n: number; z: number[] }[]) {
  const ps = patches.map(({ z, ...p }, k) => ({ ...p, min: Math.min(...z), max: Math.max(...z), src: 'blend', file: `patches/p${k}.bin` }));
  const bins = Object.fromEntries(patches.map(({ z }, k) => [ps[k].file, Uint16Array.from(z, v => Math.round((v - ps[k].min) / (ps[k].max - ps[k].min || 1) * 65535)).buffer]));
  const manifest = { credits: { blend: ['MOLA–HRSC blended DEM, 200 m', 'NASA, ESA'], mdim: ['Viking MDIM 2.1 colour mosaic', 'NASA, USGS'] }, patches: ps,
    crops: [{ body: 'mars', lat: 0, lon: 0, km: 480, file: 'crops/mars-x-480.jpg', src: 'mdim' }, { body: 'mars', lat: 0, lon: 0, km: 1, file: '../evil.jpg', src: 'mdim' }] };
  return { manifest, bins };
}
// Serves the manifest and the patch files, counting what was asked for.
function serve({ manifest, bins }: { manifest: object; bins: Record<string, ArrayBuffer> }) {
  const asked: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    asked.push(url); const f = url.replace('/sites/', '');
    return url.endsWith('manifest.json') ? { ok: true, json: async () => manifest } : bins[f] ? { ok: true, arrayBuffer: async () => bins[f] } : { ok: false, status: 404 };
  });
  return asked;
}
const load = async () => { vi.resetModules(); const m = await import('./dem'); await m.loadSites(); await m.loadAllPatches(); return m; };
afterEach(() => vi.unstubAllGlobals());

describe('loadSites', () => {
  let m: typeof import('./dem');
  beforeAll(async () => {
    serve(files([{ body: 'mars', lat: 0, lon: 0, km: 40, n: 41, z: plane(41, 40) }, { body: 'mars', lat: 0, lon: 0, km: 10, n: 51, z: plane(51, 10) },
      { body: 'earth', lat: 10, lon: 20, km: 18.8, n: 94, z: Array(94 * 94).fill(5) }]));
    m = await load();
  });
  it('reads every patch to within its 16-bit step, and the crops whose file is a crop', () => {
    expect(m.sitesLoaded).toBe(true);
    const z = m.demHeights('mars', { lat: 0, lon: 0 }, 40, 41)!;
    expect(Math.max(...z.map((v, i) => Math.abs(v - plane(41, 40)[i])))).toBeLessThan(.02);   // a 16-bit step is 0.006 m; the edge clamp (as sampleMap's) moves the last column 0.1 %
    expect(m.cropOf('mars', 0, 0, 480)).toEqual({ url: '/sites/crops/mars-x-480.jpg', src: 'mdim' });
    expect(m.cropOf('mars', 0, 0, 1)).toBeNull();   // a file outside crops/ is dropped
    expect(m.credit('mdim')).toBe('Viking MDIM 2.1 colour mosaic · NASA, USGS');
    expect(m.credit('nope')).toBe('');
    expect([m.creditName('mdim'), m.creditName(undefined)]).toEqual(['Viking MDIM 2.1 colour mosaic', '']);
  });
  it('the patch holding the whole window closest to its spacing, and none for one past its edge or sampled 4 times finer than it', () => {
    const step = (P: ReturnType<typeof m.patchFor>) => P && P.km / (P.n - 1);
    expect(step(m.patchFor('mars', { lat: 0, lon: 0 }, 8, 41))).toBeCloseTo(.2);    // the inner one
    expect(step(m.patchFor('mars', { lat: 0, lon: 0 }, 8, 21))).toBeCloseTo(.2);    // 0.4 km samples: still the inner one (the outer is 2.5 times coarser)
    expect(step(m.patchFor('mars', { lat: 0, lon: 0 }, 10, 11))).toBeCloseTo(1);    // 1 km samples: both hold it, the outer is on their spacing
    expect(step(m.patchFor('mars', { lat: 0, lon: 0 }, 30, 31))).toBeCloseTo(1);    // only the outer one holds 30 km
    const east = (km: number) => ({ lat: 0, lon: km / (3389.5 * Math.PI / 180) });
    expect(m.patchFor('mars', east(15), 12, 13)).toBeNull();                         // reaches 21 km east of a 20 km half
    expect(m.patchFor('mars', { lat: 0, lon: 0 }, 30, 192)).toBeNull();              // 1 km samples for 0.16 km ones
    expect(m.patchFor('moon', { lat: 0, lon: 0 }, 8, 41)).toBeNull();
    expect(m.patchFor('earth', { lat: 10, lon: 20 }, 18.8, 94)?.n).toBe(94);
  });
  it('a patch\'s true spacing: its own step, or its source\'s where that is coarser', () => {
    const P = m.patchFor('mars', { lat: 0, lon: 0 }, 8, 41)!, Q = m.patchFor('mars', { lat: 0, lon: 0 }, 30, 31)!;
    expect([m.resOf(P), m.resOf(Q)]).toEqual([200, 1000]);                   // MOLA–HRSC's 200 m: the steps, 200 m and 1 km
    expect(m.resOf({ ...P, src: 'sldem' })).toBe(200);                        // 59 m data on a 200 m step
    expect(m.resOf({ ...P, src: 'lolaPole' })).toBe(240);                     // 240 m data on a 200 m step
    expect(m.resOf({ ...P, src: 'glo30', km: 4, n: 192 })).toBe(30);         // Meteor Crater: 21 m samples of 30 m data
    expect(m.resOf({ ...P, src: 'lolaCap', km: 606, n: 607 })).toBe(1000);   // the polar cap, resampled to 1 km
    expect(m.resOf({ ...P, src: 'nope', km: 4, n: 192 })).toBeCloseTo(20.94, 2);
  });
  it('samples the plane back anywhere inside, in the window\'s own projection', () => {
    const at = { lat: .05, lon: -.08 }, N = 21, win = 12, z = m.demHeights('mars', at, win, N)!;
    const [x0] = llToLocal(3389.5, 0, 0, at.lat, at.lon);
    for (const [i, j] of [[0, 0], [10, 10], [20, 3], [7, 20]]) {
      const want = 1000 + 10 * (x0 + (-1 + 2 * i / (N - 1)) * win / 2);   // east of the patch centre, km
      expect(z[j * N + i]).toBeCloseTo(want, 0);
    }
    expect(m.demHeights('mars', { lat: 0, lon: 0 }, 50, 51)).toBeNull();
  });
});

describe('a lake over real elevation', () => {
  it('floods at the height the DEM flattened the water to, not 4.5 % up its relief, and only the lake round the centre', async () => {
    // A flat lake in a bowl, and a pit deeper than it in the north-west corner.
    const n = 97, bowl = Array.from({ length: n * n }, (_, i) => { const x = i % n, y = Math.floor(i / n), r = Math.hypot(x - 48, y - 48) / 6;
      return x < 8 && y < 8 ? 1100 : r < 5 ? 1140 : 1140 + (r - 5) * 40; });
    serve(files([{ body: 'earth', lat: 37.55, lon: 29.68, km: 16, n, z: bowl }]));
    await load();
    const { genTerrain } = await import('./procedural'), { SITE_BY } = await import('../data/sites'), T = genTerrain('earth', SITE_BY.earth.salda);
    expect([T.src, T.lake]).toEqual(['blend', 1140.5]);
    expect([T.z[0] < T.lake, T.wet?.[0], T.wet?.[96 * 192 + 96]]).toEqual([true, 0, 1]);   // the pit stays dry, the lake is water
  });
});

describe('a patch loads when a window first reads it', () => {
  it('needPatch fetches only the patch that window reads; a read before it lands starts it and is reported once it has', async () => {
    const asked = serve(files([{ body: 'mars', lat: 0, lon: 0, km: 40, n: 41, z: plane(41, 40) }, { body: 'mars', lat: 0, lon: 0, km: 10, n: 51, z: plane(51, 10) }]));
    vi.resetModules(); const m = await import('./dem'), late = vi.fn(); m.onLatePatch(late);
    await m.needPatch('mars', { lat: 0, lon: 0 }, 8, 41);
    expect(asked.filter(u => u.endsWith('.bin'))).toEqual(['/sites/patches/p1.bin']);   // the inner one, not the outer
    expect(m.patchFor('mars', { lat: 0, lon: 0 }, 8, 41)?.n).toBe(51);
    expect(m.patchFor('mars', { lat: 0, lon: 0 }, 30, 31)).toBeNull();   // the outer one isn't in yet: its load starts
    expect(m.demHeights('mars', { lat: 0, lon: 0 }, 30, 31)).toBeNull(); // the same pass: asked once
    await vi.waitFor(() => expect(late).toHaveBeenCalledTimes(1));
    expect(asked.filter(u => u.endsWith('p0.bin'))).toHaveLength(1);
    expect(m.patchFor('mars', { lat: 0, lon: 0 }, 30, 31)?.n).toBe(41);
    await new Promise(r => setTimeout(r)); expect(late).toHaveBeenCalledTimes(1);
  });
});

describe('loadSites, refused', () => {
  it('a patch file of the wrong length: that patch alone stays out, a warning, read again without a report', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = files([{ body: 'mars', lat: 0, lon: 0, km: 10, n: 51, z: plane(51, 10) }, { body: 'mars', lat: 0, lon: 0, km: 40, n: 41, z: plane(41, 40) }]);
    serve({ ...f, bins: { ...f.bins, 'patches/p1.bin': f.bins['patches/p1.bin'].slice(0, 41 * 41 * 2 - 8) } });   // the second cut short
    const m = await load(), late = vi.fn(); m.onLatePatch(late);
    expect([m.sitesLoaded, m.patchFor('mars', { lat: 0, lon: 0 }, 8, 41)?.n, m.patchFor('mars', { lat: 0, lon: 0 }, 30, 31)]).toEqual([true, 51, null]);
    await new Promise(r => setTimeout(r)); expect(late).not.toHaveBeenCalled();   // a failed patch isn't asked for again
    expect(warn).toHaveBeenCalled(); warn.mockRestore();
  });
  it('a patch file outside patches/: no patch at all', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = files([{ body: 'mars', lat: 0, lon: 0, km: 10, n: 51, z: plane(51, 10) }]);
    serve({ ...f, manifest: { ...f.manifest, patches: [{ ...f.manifest.patches[0], file: '../evil.bin' }] } });
    const m = await load();
    expect([m.sitesLoaded, m.patchFor('mars', { lat: 0, lon: 0 }, 8, 41)]).toEqual([false, null]);
    warn.mockRestore();
  });
  it('an HTTP error: the same', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }));
    const m = await load();
    expect(m.sitesLoaded).toBe(false); warn.mockRestore();
  });
});
