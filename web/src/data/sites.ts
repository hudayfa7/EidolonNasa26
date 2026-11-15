// Frontend-owned featured sites and the 14 established Earth analog sites (prototype 662–718).
// `t` drives the procedural terrain archetypes (terrain/procedural.ts) until engine elevation lands; `pal` names a
// --ramp-* token. `iau` is the engine's name for a featured target when the IAU feature's centre lies within ~20 km of
// the featured point (the engine compares an 18.8 km window); the others are searched by their coordinates. Pins
// ('@lat,lon' ids) and named targets picked from the IAU list ('Name@lat,lon') are built on the fly (data/pins.ts).
import { D2R, llToLocal, pinId, wrap180, type Body } from '../coords';
import { BODIES } from './bodies';
import { PHOTOS, type Photo } from './photos';
import { customSite } from './pins';

export interface TerrainSpec { arch: string; ext: number; base: number; pal: string; [param: string]: number | string }
export interface Site {
  id: string; name: string; lat: number; lon: number; kind: string; t: TerrainSpec;
  note?: string; doubles?: string[]; iau?: string;   // Moon and Mars targets; `doubles`: curated (fallback page, Rehearses, no_dem sites)
  iauAt?: { lat: number; lon: number };                 // the IAU feature's centre (data/targets.json): where its compare window sits
  nophoto?: string;                                    // the surface slot's sentence where the usual one would read against the note
  place?: string; for?: Body[];                         // Earth analog sites
  country?: string; access?: 'partner' | 'non_partner' | 'antarctic_treaty';   // the established Earth sites, as the engine has them
  custom?: boolean;                                     // a pin ('@lat,lon'), not a featured site
}

export const SITES: Record<Body, Site[]> = {
  mars:[
    { id:'jezero', name:'Jezero Crater', iau:'Jezero', iauAt:{ lat:18.4082, lon:77.6873 }, lat:18.38, lon:77.58, kind:'Delta and carbonates', note:'Perseverance landing site', doubles:['salda','pilbara','hanksville'],
      t:{ arch:'crater', ext:60, base:-2600, R:.6, depth:480, rim:420, fan:160, noise:60, pal:'mars' } },
    { id:'gale', name:'Gale Crater', iau:'Gale', iauAt:{ lat:-5.3672, lon:137.811 }, lat:-5.4, lon:137.8, kind:'Layered sediments', note:'Curiosity landing site', doubles:['hanksville','atacama','deathvalley'],
      t:{ arch:'crater', ext:180, base:-4500, R:.74, depth:900, rim:1700, peak:4600, peakR:.3, px:.08, py:.05, layered:1, noise:220, craters:6, pal:'mars' } },
    { id:'arcadia', name:'Arcadia Planitia', lat:47.2, lon:184.3, kind:'Shallow ground ice', note:'Candidate zone for crewed landings', doubles:['haughton','svalbard','dryvalleys'],
      t:{ arch:'plains', ext:30, base:-3800, amp:60, poly:1, craters:8, pal:'mars' } },
    { id:'utopia', name:'Utopia Planitia', iau:'Utopia Planitia', iauAt:{ lat:46.7363, lon:117.5168 }, lat:46.7, lon:117.5, kind:'Polygonal terrain', note:'Viking 2 and Zhurong region', doubles:['dryvalleys','svalbard'],
      nophoto:'No photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south.',
      t:{ arch:'plains', ext:30, base:-4200, amp:40, poly:1.5, craters:5, pal:'mars' } },
    { id:'meridiani', name:'Meridiani Planum', lat:-1.95, lon:354.47, kind:'Hematite and sulfates', note:'Opportunity landing site', doubles:['riotinto','dallol'],
      t:{ arch:'plains', ext:20, base:-1400, amp:22, ripples:1, craters:12, pal:'mars' } },
    { id:'elysium', name:'Elysium Planitia', lat:4.5, lon:135.6, kind:'Young volcanic plains', note:'InSight landing site', doubles:['holuhraun','lanzarote'],
      t:{ arch:'plains', ext:40, base:-2600, amp:30, flows:1, craters:10, pal:'mars' } },
  ],
  moon:[
    { id:'malapert', name:'Malapert Massif', lat:-86.0, lon:0.0, kind:'Polar massif, long sunlight', note:'Artemis south-pole candidate region', doubles:['haughton','maunakea'],
      t:{ arch:'massif', ext:60, base:2500, ridge:2600, craters:16, pal:'moon' } },
    { id:'haworth', name:'Haworth', lat:-87.4, lon:-5.0, kind:'Rim beside shadowed ice', note:'Artemis south-pole candidate region', doubles:['haughton','dryvalleys'],
      t:{ arch:'crater', ext:80, base:-2000, R:.56, depth:2400, rim:600, noise:120, craters:14, pal:'moon' } },
    { id:'nobile', name:'Nobile Rim', lat:-85.2, lon:53.5, kind:'Rim above cold traps', note:'Artemis south-pole candidate region', doubles:['svalbard','meteor'],
      t:{ arch:'crater', ext:90, base:-1500, R:.6, depth:1800, rim:500, noise:120, craters:16, pal:'moon' } },
    { id:'degerlache', name:'de Gerlache Rim', lat:-88.5, lon:-87.0, kind:'Ridge near Shackleton', note:'Artemis south-pole candidate region', doubles:['dryvalleys','haughton'],
      t:{ arch:'massif', ext:40, base:0, ridge:1200, ridgeLine:1, craters:14, pal:'moon' } },
    { id:'hadley', name:'Hadley–Apennine', iau:'Rima Hadley', iauAt:{ lat:25.7159, lon:3.1467 }, lat:26.13, lon:3.63, kind:'Mare edge and rille', note:'Apollo 15 landing site', doubles:['meteor','maunakea'],
      t:{ arch:'channel', ext:30, base:-1500, amp:180, depth:320, front:2400, craters:12, pal:'moon' } },
    { id:'taurus', name:'Taurus–Littrow', iau:'Taurus Littrow Valley', iauAt:{ lat:20.0702, lon:30.7867 }, lat:20.19, lon:30.77, kind:'Highland valley', note:'Apollo 17 landing site', doubles:['lanzarote','meteor'],
      t:{ arch:'valley', ext:30, base:-1900, amp:2000, craters:10, pal:'moon' } },
  ],
  // `country` and `access` are the engine's own for its grid cell nearest each site (grid/cell_country.npz, read
  // 2026-10-20; its sovereign equals the country for all 14): an established site is no search result, so its booking
  // listing carries them from here.
  earth:[
    { id:'atacama', name:'Atacama Desert', place:'Chile', country:'Chile', access:'partner', lat:-24.1, lon:-70.0, kind:'Hyperarid core under extreme UV', for:['mars'], t:{ arch:'basin', ext:30, base:1000, amp:700, pal:'arid' } },
    { id:'haughton', name:'Haughton Crater', place:'Devon Island, Canada', country:'Canada', access:'partner', lat:75.38, lon:-89.68, kind:'Polar impact crater in permafrost', for:['mars','moon'], t:{ arch:'crater', ext:30, base:50, R:.55, depth:150, rim:110, noise:28, pal:'polar' } },
    { id:'deathvalley', name:'Death Valley', place:'California, USA', country:'United States of America', access:'partner', lat:36.5, lon:-117.1, kind:'Evaporite basins and extreme heat', for:['mars'], t:{ arch:'basin', ext:40, base:-86, amp:2400, pal:'arid' } },
    { id:'dryvalleys', name:'McMurdo Dry Valleys', place:'Antarctica', country:'Antarctica', access:'antarctic_treaty', lat:-77.5, lon:162.0, kind:'Cold desert and patterned ground', for:['mars','moon'], t:{ arch:'valley', ext:30, base:100, amp:1400, pal:'polar' } },
    { id:'svalbard', name:'Bockfjorden', place:'Svalbard, Norway', country:'Norway', access:'partner', lat:79.4, lon:13.3, kind:'Volcanic springs in permafrost', for:['mars','moon'], t:{ arch:'volcanic', ext:20, base:0, amp:500, cones:2, slope:.6, pal:'polar' } },
    { id:'lanzarote', name:'Lanzarote', place:'Canary Islands, Spain', country:'Spain', access:'partner', lat:29.0, lon:-13.6, kind:'Basaltic lava fields and tubes', for:['mars','moon'], t:{ arch:'volcanic', ext:20, base:200, amp:320, cones:6, flows:1, pal:'basalt' } },
    { id:'maunakea', name:'Mauna Kea', place:'Hawaiʻi, USA', country:'United States of America', access:'partner', lat:19.82, lon:-155.47, kind:'Volcanic regolith at altitude', for:['moon'], t:{ arch:'volcanic', ext:20, base:3400, amp:800, cones:9, slope:.5, pal:'basalt' } },
    { id:'riotinto', name:'Río Tinto', place:'Andalusia, Spain', country:'Spain', access:'partner', lat:37.7, lon:-6.6, kind:'Acidic iron-sulfate river system', for:['mars'], t:{ arch:'channel', ext:20, base:300, amp:260, depth:120, pal:'ferric' } },
    { id:'hanksville', name:'Hanksville', place:'Utah, USA', country:'United States of America', access:'partner', lat:38.41, lon:-110.79, kind:'Layered sedimentary badlands', for:['mars'], t:{ arch:'layered', ext:20, base:1350, amp:360, steps:7, pal:'arid' } },
    { id:'salda', name:'Lake Salda', place:'Burdur, Türkiye', country:'Turkey', access:'partner', lat:37.55, lon:29.68, kind:'Carbonate shoreline and delta', for:['mars'], t:{ arch:'basin', ext:16, base:1140, amp:620, lake:1, pal:'arid' } },
    { id:'dallol', name:'Dallol', place:'Afar, Ethiopia', country:'Ethiopia', access:'non_partner', lat:14.24, lon:40.30, kind:'Hydrothermal brines and salts', for:['mars'], t:{ arch:'basin', ext:16, base:-120, amp:160, pal:'salt' } },
    { id:'pilbara', name:'Pilbara', place:'Western Australia', country:'Australia', access:'partner', lat:-21.2, lon:119.4, kind:'Ancient stromatolite beds', for:['mars'], t:{ arch:'hills', ext:25, base:400, amp:260, pal:'ferric' } },
    { id:'meteor', name:'Meteor Crater', place:'Arizona, USA', country:'United States of America', access:'partner', lat:35.03, lon:-111.02, kind:'Simple impact crater', for:['moon'], t:{ arch:'crater', ext:4, base:1700, R:.32, depth:170, rim:50, noise:5, pal:'arid' } },
    { id:'holuhraun', name:'Holuhraun', place:'Iceland', country:'Iceland', access:'partner', lat:64.85, lon:-16.83, kind:'Fresh basalt lava field', for:['mars'], t:{ arch:'volcanic', ext:20, base:750, amp:120, cones:1, flows:1, pal:'basalt' } },
  ],
};
export const SITE_BY = Object.fromEntries((Object.keys(SITES) as Body[]).map(k => [k, Object.fromEntries(SITES[k].map(s => [s.id, s]))])) as Record<Body, Record<string, Site>>;
export const EARTH_BY = SITE_BY.earth;
export const rehearsesFor = (id: string) => (['mars','moon'] as const).flatMap(b => SITES[b].filter(s => s.doubles!.includes(id)).map(s => ({ body:b, site:s })));
export function siteOf(b: Body | null, id: string | undefined): Site | null {
  if (!b || !id) return null;
  if (id.includes('@')) return customSite(b, id);   // a pin or a named target ('Name@lat,lon'); an Earth pin is a compare double only (router.ts parse)
  return Object.hasOwn(SITE_BY[b], id) ? SITE_BY[b][id] : null;   // ids come from the URL: no prototype keys
}
/** Where an IAU target opens: the featured site carrying its name, else the named target at its centre ('Name@lat,lon'). */
export const targetSiteId = (b: Body, name: string, lat: number, lon: number) => SITES[b].find(s => s.iau === name)?.id ?? encodeURIComponent(name) + pinId(lat, lon);
/** Featured sites whose name holds q that the engine's target list can't open as themselves (no IAU name: on the Moon
 *  the south-pole regions, beyond the engine's 60°), for the named-feature search. */
export const featuredByName = (b: Body, q: string) => { const ql = q.trim().toLowerCase(); return ql ? SITES[b].filter(s => !s.iau && s.name.toLowerCase().includes(ql)) : []; };
// The established analog site an Earth window centred here contains, if any (the 18.8 km window's ±9.4 km, about
// .085°): the engine names no places (plan, Gaps for the merge 3), so results carry this tag beside their country.
export const establishedAt = (lat: number, lon: number) =>
  SITES.earth.find(e => Math.abs(e.lat - lat) < .085 && Math.abs(wrap180(e.lon - lon)) * Math.cos(lat * D2R) < .085);
// The photograph key for a point: a landing's whose spot the point's 18.8 km window (±9.4 km) holds, else the featured
// site's whose square (its terrain's extent, in its map's projection) holds the point.
function photoAt(b: Body, lat: number, lon: number) {
  const near = (la: number, lo: number, half: number) => llToLocal(BODIES[b].R, la, lo, lat, lon).every(v => Math.abs(v) < half);
  return Object.keys(PHOTOS).find(k => k.startsWith(`${b}-`) && PHOTOS[k].at && near(...PHOTOS[k].at!, 9.4))
    ?? `${b}-${SITES[b].find(f => Object.hasOwn(PHOTOS, `${b}-${f.id}`) && near(f.lat, f.lon, f.t.ext / 2))?.id}`;
}
/** The surface slot's photograph (data/photos.ts), or a sentence saying why there is none. A pin or named target
 *  near a landing, or inside a featured site's square, shows that photograph, as an Earth cell inside an established
 *  site does. */
export function surfaceOf(b: Body, s: Site): (Photo & { key: string }) | string {
  const key = !s.custom ? `${b}-${s.id}` : b === 'earth' ? `${b}-${establishedAt(s.lat, s.lon)?.id}` : photoAt(b, s.lat, s.lon);
  if (Object.hasOwn(PHOTOS, key)) return { ...PHOTOS[key], key };
  return s.nophoto ?? (b === 'earth' ? s.custom ? 'No field photographs of this area.' : 'No NASA field photograph of this site.'
    : s.custom ? 'No surface photograph on file for this point.' : 'No lander, rover or crew has photographed this area.');
}
