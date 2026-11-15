// The surface photographs (data/photos.ts) and the slot's choice between a photograph and why there is none (sites.ts
// surfaceOf).
import { describe, expect, it, vi } from 'vitest';
import type { Body } from '../coords';
import { BEYOND, PHOTOS } from './photos';
import manifest from '../../public/textures/manifest.json';
import page from '../../index.html?raw';

const FILES = Object.keys(import.meta.glob('../../public/photos/*.jpg'));   // the files the script wrote
vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));   // no textures (or DOM) here
const { SITE_BY, siteOf, surfaceOf } = await import('./sites');

describe('surface photographs', () => {
  it('each is a featured or established site\'s or a landing\'s, with its file, words for it and a square inside the image', () => {
    for (const [key, p] of Object.entries(PHOTOS)) {
      const [b, id] = key.split('-') as [Body, string];
      expect(!!SITE_BY[b]?.[id] !== !!p.at, key).toBe(true);   // a site's, or a landing's with its place
      if (p.at) expect(b !== 'earth' && Math.abs(p.at[0]) <= 90 && p.at[1] >= -180 && p.at[1] <= 360, key).toBe(true);
      expect(FILES, key).toContain(`../../public/photos/${key}.jpg`);
      expect([p.id, p.what, p.by, p.alt].every(t => t.trim().length > 0), key).toBe(true);
      expect(p.crop.every(v => v > 0 && v <= 1), key).toBe(true);
    }
    expect(new Set(Object.values(PHOTOS).map(p => p.alt)).size).toBe(Object.keys(PHOTOS).length);
  });
  it('a site with a photograph shows it; a point inside its square shows its, as an Earth cell inside an established site does', () => {
    expect(surfaceOf('mars', SITE_BY.mars.jezero)).toMatchObject({ key: 'mars-jezero', id: 'PIA24546' });
    expect(surfaceOf('moon', SITE_BY.moon.hadley)).toMatchObject({ key: 'moon-hadley' });
    expect(surfaceOf('earth', SITE_BY.earth.atacama)).toMatchObject({ key: 'earth-atacama', id: 'PIA16191' });
    expect(surfaceOf('earth', siteOf('earth', '@-21.2250,119.4250')!)).toMatchObject({ key: 'earth-pilbara' });
    expect(surfaceOf('mars', siteOf('mars', '@18.4000,77.5000')!)).toMatchObject({ key: 'mars-jezero' });   // 4 km from Perseverance's landing
    expect(surfaceOf('mars', siteOf('mars', '@18.3800,78.1000')!)).toMatchObject({ key: 'mars-jezero' });   // 29 km east, Jezero's square ±30 km
    expect(surfaceOf('mars', siteOf('mars', 'Aeolis%20Mons@-5.0800,137.8500')!)).toMatchObject({ key: 'mars-gale' });   // a named target
  });
  it('a pin or named target whose 18.8 km window holds a landing shows that landing\'s', () => {
    const at = (b: Body, id: string) => (surfaceOf(b, siteOf(b, id)!) as { key?: string }).key;
    expect(at('moon', 'Statio%20Tranquillitatis@0.6741,23.4732')).toBe('moon-apollo11');
    expect(at('moon', 'Surveyor@-3.0200,-23.4200')).toBe('moon-apollo12');
    expect(at('moon', 'Cone@-3.6248,-17.4336')).toBe('moon-apollo14');
    expect(at('moon', 'South%20Ray@-9.1493,15.3827')).toBe('moon-apollo16');   // 6.4 km from the landing
    expect(at('mars', 'Gusev@-14.5308,175.5244')).toBe('mars-spirit');   // 3.7 km
    expect(at('mars', 'Endeavour@-2.2836,-5.1955')).toBe('mars-endeavour');   // ±180 as the engine gives it
    expect(at('mars', '@47.6400,134.2900')).toBe('mars-viking2');
    expect(at('moon', '@0.6741,23.8000')).toBeUndefined();   // 9.9 km east of Apollo 11
  });
  it('says plainly why there is none', () => {
    expect(surfaceOf('moon', SITE_BY.moon.malapert)).toBe('No lander, rover or crew has photographed this area.');
    expect(surfaceOf('mars', SITE_BY.mars.utopia)).toBe('No photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south.');
    expect(surfaceOf('mars', siteOf('mars', '@18.3800,78.2000')!)).toBe('No surface photograph on file for this point.');   // 35 km east of Jezero
    expect(surfaceOf('moon', siteOf('moon', '@-86.2000,1.5000')!)).toBe('No surface photograph on file for this point.');   // inside Malapert's square
    expect(surfaceOf('earth', SITE_BY.earth.hanksville)).toBe('No NASA field photograph of this site.');
    expect(surfaceOf('earth', siteOf('earth', '@34.6750,-105.0750')!)).toBe('No field photographs of this area.');
  });
});

describe('Beyond\'s spacecraft images', () => {
  it('each card\'s scene has one, with its texture, credit, an ink and words for it', () => {
    const scenes = [...page.matchAll(/data-scene="(\w+)"/g)].map(m => m[1]);
    expect(scenes.sort()).toEqual(Object.keys(BEYOND).sort());
    for (const [key, p] of Object.entries(BEYOND)) {
      expect((manifest as Record<string, { file: string; w: number; h: number }>)[key], key).toMatchObject({ file: `${key}.jpg`, w: 320, h: 180 });
      expect([p.id, p.what, p.by, p.alt].every(t => t.trim().length > 0), key).toBe(true);
      expect(p.ink, key).toMatch(/^#[0-9A-F]{6}$/);
      expect(p.crop[0] > 0 && p.crop[0] < 1 && p.crop[1] > 0 && p.crop[1] < 1 && p.crop[2] > 0, key).toBe(true);
    }
  });
});
