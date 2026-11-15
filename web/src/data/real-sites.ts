// The places scripts/fetch-real-data.mjs fetches terrain and images for (docs/plan.md, Must 5: the sites clicked on
// stage and their top doubles). Copied from sites.ts, bodies.ts and mock.ts, which node can't import (their imports have
// no extensions); this file imports nothing so it can. real-sites.test.ts fails when the copies drift apart.

/** Radii (km) as the app projects with them (data/bodies.ts R), so a patch is sampled back on the grid it was made on. */
export const RADIUS: Record<'mars' | 'moon' | 'earth', number> = { mars: 3389.5, moon: 1737.4, earth: 6371 };
/** Metres the bump maps' 0 and 255 stand for (data/bodies.ts elev): each body's full range of heights. */
export const ELEV: Record<'mars' | 'moon' | 'earth', [number, number]> = { mars: [-8500, 21500], moon: [-9500, 11000], earth: [0, 8800] };

/** Featured target sites on the demo path: id, centre, extent (km). Named ones carry the IAU name their compare window
 *  is centred on (src/data/targets.json); the south-pole regions get terrain only (the engine has no data there). */
export const TARGETS: { body: 'mars' | 'moon'; id: string; lat: number; lon: number; ext: number; iau?: string }[] = [
  { body: 'mars', id: 'jezero', lat: 18.38, lon: 77.58, ext: 60, iau: 'Jezero' },
  { body: 'mars', id: 'gale', lat: -5.4, lon: 137.8, ext: 180, iau: 'Gale' },
  { body: 'mars', id: 'arcadia', lat: 47.2, lon: 184.3, ext: 30 },
  { body: 'mars', id: 'utopia', lat: 46.7, lon: 117.5, ext: 30, iau: 'Utopia Planitia' },
  { body: 'mars', id: 'meridiani', lat: -1.95, lon: 354.47, ext: 20 },
  { body: 'mars', id: 'elysium', lat: 4.5, lon: 135.6, ext: 40 },
  { body: 'moon', id: 'hadley', lat: 26.13, lon: 3.63, ext: 30, iau: 'Rima Hadley' },
  { body: 'moon', id: 'taurus', lat: 20.19, lon: 30.77, ext: 30, iau: 'Taurus Littrow Valley' },
  { body: 'moon', id: 'malapert', lat: -86.0, lon: 0.0, ext: 60 },
  { body: 'moon', id: 'haworth', lat: -87.4, lon: -5.0, ext: 80 },
  { body: 'moon', id: 'nobile', lat: -85.2, lon: 53.5, ext: 90 },
  { body: 'moon', id: 'degerlache', lat: -88.5, lon: -87.0, ext: 40 },
];

/** The 14 established Earth analog sites: the polar sites' curated doubles, Rehearses, and the Earth view. */
export const EARTH = [
  { id: 'atacama', lat: -24.1, lon: -70.0, ext: 30 }, { id: 'haughton', lat: 75.38, lon: -89.68, ext: 30 },
  { id: 'deathvalley', lat: 36.5, lon: -117.1, ext: 40 }, { id: 'dryvalleys', lat: -77.5, lon: 162.0, ext: 30 },
  { id: 'svalbard', lat: 79.4, lon: 13.3, ext: 20 }, { id: 'lanzarote', lat: 29.0, lon: -13.6, ext: 20 },
  { id: 'maunakea', lat: 19.82, lon: -155.47, ext: 20 }, { id: 'riotinto', lat: 37.7, lon: -6.6, ext: 20 },
  { id: 'hanksville', lat: 38.41, lon: -110.79, ext: 20 }, { id: 'salda', lat: 37.55, lon: 29.68, ext: 16 },
  { id: 'dallol', lat: 14.24, lon: 40.30, ext: 16 }, { id: 'pilbara', lat: -21.2, lon: 119.4, ext: 25 },
  { id: 'meteor', lat: 35.03, lon: -111.02, ext: 4 }, { id: 'holuhraun', lat: 64.85, lon: -16.83, ext: 20 },
];

/** The mock's four made-up Earth cells (src/data/mock.ts POOL); the other 15 are read from the engine's examples. */
export const MADE_UP_CELLS: [number, number][] = [[38.425, -110.775], [-21.225, 119.425], [75.375, -89.675], [-43.575, 170.425]];

/** The engine's top-5 Earth cells for the demo's searches (Jezero, Gale, Utopia Planitia: rover_mobility; Rima Hadley,
 *  Taurus Littrow Valley: eva_training; Jezero: astrobiology), read from the live engine on 2026-11-14. Duplicates of the
 *  engine's examples collapse in fetch-real-data.mjs. */
export const DEMO_CELLS: [number, number][] = [
  [34.675, -105.075], [-29.725, 124.025], [-27.825, 127.125], [33.975, 3.925], [33.775, 4.225],
  [35.375, 138.725], [-77.525, 167.125], [-0.925, -91.375], [-74.325, 164.725], [56.075, 160.625],
  [19.175, 3.325], [17.175, 29.625], [-28.125, 123.225], [20.775, 24.925], [-27.925, 118.225],
  [80.175, -21.675], [-72.725, 169.525], [-74.425, 163.525], [69.875, -70.275], [-25.825, -68.075],
  [-24.325, -67.775], [-21.125, -67.875], [-21.625, -68.275], [37.775, 15.025], [-74.125, 162.325],
];

/** A pin's terrain, km across (192 samples): data/pins.ts reads it, and each stage site gets a patch every pin on its
 *  extent sits in. */
export const PIN_KM = { mars: 80, moon: 60 };

/** Pin windows on the demo path: the engine's coordinates example (a Mars pin by Gale). */
export const PINS: { body: 'mars' | 'moon'; lat: number; lon: number }[] = [{ body: 'mars', lat: -4.59, lon: 137.44 }];
