// real-sites.ts copies what the real-data script (scripts/fetch-real-data.mjs) fetches for from the app: the featured
// sites on the demo path, the established Earth sites, the mock's Earth cells, the radii and the bump maps' elevation
// ranges. These fail when the copies drift apart, or when the shipped files don't match their manifests.
import { describe, expect, it, vi } from 'vitest';
import cached from '../../contracts/examples/api/search_named_cached.response.json';
import filtered from '../../contracts/examples/api/search_named_filtered.response.json';
import coordinates from '../../contracts/examples/api/search_coordinates.response.json';
import manifest from '../../public/sites/manifest.json';
import tex from '../../public/textures/manifest.json';
import targets from './targets.json';
import { parsePinId, pinId } from '../coords';
import { BODIES, ORDER } from './bodies';
import { CELL_AT } from './mock';
import { EARTH, ELEV, MADE_UP_CELLS, RADIUS, TARGETS } from './real-sites';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));   // no textures (or DOM) here
const { SITE_BY, SITES } = await import('./sites');
const { WINDOW_KM } = await import('../terrain/procedural');
const { readdirSync, statSync } = await import('node:fs' as string) as { readdirSync(d: URL): string[]; statSync(f: URL): { size: number } };   // no @types/node here

describe('the real-data script\'s sites', () => {
  it('featured targets: the app\'s centre, extent and IAU name', () => {
    for (const t of TARGETS) {
      const s = SITE_BY[t.body][t.id];
      expect([s.lat, s.lon, s.t.ext, s.iau], t.id).toEqual([t.lat, t.lon, t.ext, t.iau]);
    }
  });
  it('a featured site with an IAU name has that feature\'s centre, where the script centres its compare window', () => {
    for (const b of ['mars', 'moon'] as const) for (const s of SITES[b].filter(s => s.iau)) {
      const r = (targets[b] as unknown as [string, string, number, number][]).find(r => r[0] === s.iau)!;
      expect(s.iauAt, s.id).toEqual({ lat: r[2], lon: r[3] });
    }
  });
  it('every established Earth site, as the app has it', () => {
    expect(EARTH).toEqual(SITES.earth.map(s => ({ id: s.id, lat: s.lat, lon: s.lon, ext: s.t.ext })));
  });
  it('every Earth cell the mock hands out: the examples\' plus its four made-up ones', () => {
    const ex = [cached, filtered, coordinates].flatMap(x => x.results.map(r => [r.location.lat, r.location.lon].join()));
    expect(new Set([...ex, ...MADE_UP_CELLS.map(c => c.join())])).toEqual(new Set([...CELL_AT.values()].map(l => [l.lat, l.lon].join())));
  });
  it('every Earth cell the mock hands out has its own crops, found as the listing\'s strip asks (ui/panel.ts strip)', async () => {
    vi.stubGlobal('fetch', async (u: string) => ({ ok: true, json: async () => ({ ...manifest, patches: [] }), arrayBuffer: async () => new ArrayBuffer(0), url: u }));
    const { cropOf, loadSites } = await import('../terrain/dem'); await loadSites();
    for (const l of CELL_AT.values()) {
      const p = parsePinId(pinId(l.lat!, l.lon!))!;   // a double's centre comes from its Earth pin's route
      for (const km of [WINDOW_KM * 12, WINDOW_KM * 3.5]) expect(cropOf('earth', p.lat, p.lon, km)?.src, `${p.lat},${p.lon} ${km} km`).toMatch(/^(weld|weldBmng|bmng500)$/);
    }
    vi.unstubAllGlobals();
  });
  it('every shipped patch file holds its n × n 16-bit heights, and is listed; so does every low tier the textures list', () => {
    for (const p of manifest.patches) expect(statSync(new URL(`../../public/sites/${p.file}`, import.meta.url)).size, p.file).toBe(p.n * p.n * 2);
    expect(readdirSync(new URL('../../public/sites/patches/', import.meta.url)).map(f => `patches/${f}`).sort()).toEqual(manifest.patches.map(p => p.file).sort());
    for (const [k, e] of Object.entries(tex as Record<string, { lo?: { file: string; bytes: number } }>)) if (e.lo) expect(statSync(new URL(`../../public/textures/${e.lo.file}`, import.meta.url)).size, k).toBe(e.lo.bytes);
  });
  it('radii and bump ranges', () => {
    for (const b of ORDER) expect([RADIUS[b], ELEV[b]], b).toEqual([BODIES[b].R, BODIES[b].elev]);
  });
});
