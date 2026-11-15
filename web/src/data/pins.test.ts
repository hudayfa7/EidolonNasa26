// Earth pins are search results: named by the country a landed search reported, at its elevation; a pin shown before
// that (a compare deep link) gets its terrain built again.
import { describe, expect, it, vi } from 'vitest';
import type { MatchResult } from './types.gen';
import cachedRes from '../../contracts/examples/api/search_named_cached.response.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { customSite, noteCells } = await import('./pins');
const { featuredByName, siteOf, targetSiteId } = await import('./sites');
const { genTerrain, WINDOW_KM } = await import('../terrain/procedural');

describe('Earth pins', () => {
  it('coordinates until a search names them; then the country, at the cell\'s elevation, terrain rebuilt', () => {
    const r = cachedRes.results[0] as unknown as MatchResult, id = '@34.6750,-105.0750';
    const before = customSite('earth', id)!;
    expect([before.name, before.place, before.t.base]).toEqual(['34.6750° N, 105.0750° W', '34.6750° N, 105.0750° W', .5 * 8800]);
    const T0 = genTerrain('earth', before, WINDOW_KM);
    noteCells([r, { ...r, location: undefined }]);
    const after = customSite('earth', id)!;
    expect([after.name, after.t.base]).toEqual(['United States of America', 1671]);
    const T1 = genTerrain('earth', after, WINDOW_KM);
    expect(T1).not.toBe(T0); expect(Math.abs(T1.min - 1671)).toBeLessThan(100); expect(T0.min).toBeGreaterThan(4000);
    noteCells([r]); expect(genTerrain('earth', customSite('earth', id)!, WINDOW_KM)).toBe(T1);   // already named: kept
  });
});

describe('named targets', () => {
  it('a pin at the IAU centre carrying its name, searched by it; a name the IAU doesn\'t write is no site', () => {
    const s = customSite('mars', 'Jezero%20Mons@18.1600,78.2300')!;
    expect([s.name, s.iau, s.lat, s.custom]).toEqual(['Jezero Mons', 'Jezero Mons', 18.16, true]); expect(s.lon).toBeCloseTo(78.23, 9);
    expect(customSite('moon', 'Ma%E2%80%99adim@1.0000,2.0000')?.iau).toBe('Ma’adim');
    expect(customSite('mars', '@18.1600,78.2300')!.iau).toBeUndefined();
    for (const id of ['%3Cimg%20src%3Dx%3E@1.0000,2.0000', 'A%22B@1.0000,2.0000', '%E0%A4%A@1.0000,2.0000', 'Jezero@north', ' Jezero@1.0000,2.0000'])
      expect(customSite('mars', id), id).toBeNull();
    expect(customSite('earth', 'Hanksville@38.4100,-110.7900')).toBeNull();   // Earth pins are search results, unnamed
  });
  it('a picked target opens its featured site, else itself, and its route reads back as the same target', () => {
    expect(targetSiteId('moon', 'Rima Hadley', 25.7159, 3.1467)).toBe('hadley');
    const id = targetSiteId('mars', 'Jezero Mons', 18.16, 78.23), s = siteOf('mars', id)!;
    expect(id).toBe('Jezero%20Mons@18.1600,78.2300'); expect([s.iau, s.lat]).toEqual(['Jezero Mons', 18.16]);
    expect([s.kind, s.note]).toEqual(['Named feature', 'Centre point from the IAU gazetteer']);   // its type comes with its search, not from the map's roughness
  });
  it('featured sites the engine\'s list can\'t open are found by name: the south-pole regions, not the IAU-named ones', () => {
    expect(featuredByName('moon', ' MALAP').map(s => s.id)).toEqual(['malapert']);
    expect(featuredByName('moon', 'gerlache').map(s => s.id)).toEqual(['degerlache']);
    expect(featuredByName('moon', 'r').map(s => s.id)).toEqual(['malapert', 'haworth', 'nobile', 'degerlache']);
    expect(featuredByName('moon', 'Hadley')).toEqual([]);   // Rima Hadley: the engine lists it, "Featured: Hadley–Apennine"
    expect(featuredByName('moon', 'Shackleton')).toEqual([]);
    expect(featuredByName('mars', 'arcadia').map(s => s.id)).toEqual(['arcadia']);
    expect(featuredByName('mars', ' ')).toEqual([]);
  });
});
