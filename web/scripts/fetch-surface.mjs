// Reads what NASA's orbiters measured at the featured sites the engine can match, for the result detail's "Measured at the
// target" block and the climate fit's notes (README: "How the climate fit works"). Writes src/data/surface.gen.json.
//   Moon: LRO Diviner global high-resolution mosaics (PDS Geosciences Node, bundle lro_diviner_derived1, 70°S–70°N,
//         about 237 m/px): bolometric and regolith temperature at midnight, rock abundance at slope-adjusted midnight.
//   Mars: THEMIS-derived thermal inertia (Fergason et al. 2006; USGS Astropedia, 100 m/px).
// Both files are gigabytes, so each value is read by an HTTP range request (a few KB per site): nothing is downloaded whole.
// A value is the median of the valid pixels in a window of about 2 km centred on the site; the window, the valid count and
// the min and max are kept so the page can say how it was read. Run: `npm run fetch:surface` (network).
import { writeFileSync } from 'node:fs';

// The featured sites the engine can match (src/data/real-sites.ts TARGETS: the same ids and centres; real-sites.test.ts
// compares them). The Moon's south-pole sites are left out: the engine has no Moon elevation beyond 59.5°, and the
// Diviner mosaics stop at 70°.
const SITES = [
  ['mars', 'jezero', 18.38, 77.58], ['mars', 'gale', -5.4, 137.8], ['mars', 'arcadia', 47.2, 184.3], ['mars', 'utopia', 46.7, 117.5],
  ['mars', 'meridiani', -1.95, 354.47], ['mars', 'elysium', 4.5, 135.6], ['moon', 'hadley', 26.13, 3.63], ['moon', 'taurus', 20.19, 30.77],
];

const DIVINER = 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_ghrm/geotiff/';
const THEMIS = 'https://asc-astropedia.s3.us-west-2.amazonaws.com/Mars/Odyssey/THEMIS-Global-Thermal-Inertia-Mosaic/Quantitative-32-Bit/';

async function range(url, from, to) {
  for (let tries = 0; ; tries++) {
    try {
      const r = await fetch(url, { headers: { Range: `bytes=${from}-${to}` } });
      if (r.status !== 206) throw new Error(`HTTP ${r.status} for ${url}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (tries >= 3) throw e; await new Promise(r => setTimeout(r, 1000 * (tries + 1))); }
  }
}
const stats = (vals, ok) => {
  const v = vals.filter(x => Number.isFinite(x) && ok(x)).sort((a, b) => a - b);
  return v.length ? { median: v[v.length >> 1], min: v[0], max: v[v.length - 1], n: v.length } : { median: null, min: null, max: null, n: 0 };
};
const r2 = (x, d) => x === null ? null : +x.toFixed(d);

// Diviner: equirectangular, lon −180..180 and lat 70..−70 at 128 px/deg, 46080 × 17920 float32 LE from byte 143855 (the PDS
// label, dghrm_*_70s70n_tif.xml; the raster is one contiguous block, so a row segment is one range).
const D = { W: 46080, off: 143855, ppd: 128, half: 4 };
async function diviner(lat, lon, layer) {
  const col = Math.round((lon + 180) * D.ppd), row = Math.round((70 - lat) * D.ppd), vals = [];
  for (let r = row - D.half; r <= row + D.half; r++) {
    const start = D.off + (r * D.W + col - D.half) * 4, b = await range(`${DIVINER}dghrm_${layer}_70s70n_tif.tif`, start, start + (2 * D.half + 1) * 4 - 1);
    for (let i = 0; i < 2 * D.half + 1; i++) vals.push(b.readFloatLE(i * 4));
  }
  return vals;
}

// THEMIS: ISIS3 cubes in 30° × 60° tiles (named by the south-west corner), simple cylindrical, 128 × 128 float32 LE tiles in
// row-major tile order from StartByte − 1. The label is read first for the size, scale and bounds.
const labels = new Map(), tiles = new Map();
const tileName = (lat, lon) => {
  const la = Math.floor(lat / 30) * 30, lo = Math.floor((((lon % 360) + 360) % 360) / 60) * 60;
  return `${String(Math.abs(la)).padStart(2, '0')}${la >= 0 ? 'N' : 'S'}${String(lo).padStart(3, '0')}E`;
};
async function label(name) {
  if (labels.has(name)) return labels.get(name);
  const url = `${THEMIS}THEMIS_TI_Mosaic_Quant_${name}_100mpp.cub`, s = (await range(url, 0, 9999)).toString('latin1');
  const g = k => Number(new RegExp(`\\b${k}\\s*=\\s*([-\\d.]+)`).exec(s)[1]);
  const L = { url, start: g('StartByte') - 1, ts: g('TileSamples'), W: g('Samples'), H: g('Lines'), scale: g('Scale'), lat1: g('MaximumLatitude'), lon0: g('MinimumLongitude'), dom: g('LongitudeDomain') };
  labels.set(name, L);
  return L;
}
async function themis(lat, lon, half) {
  const L = await label(tileName(lat, lon));
  let lo = ((lon % 360) + 360) % 360; if (L.dom === 180 && lo > 180) lo -= 360;   // a tile's longitudes may be in −180..180
  const x0 = Math.round((lo - L.lon0) * L.scale), y0 = Math.round((L.lat1 - lat) * L.scale), vals = [];
  for (let y = y0 - half; y <= y0 + half; y++) for (let x = x0 - half; x <= x0 + half; x++) {
    if (x < 0 || y < 0 || x >= L.W || y >= L.H) continue;
    const tx = Math.floor(x / L.ts), ty = Math.floor(y / L.ts), key = `${L.url}:${tx}:${ty}`;
    if (!tiles.has(key)) {
      const bytes = L.ts * L.ts * 4, off = L.start + (ty * Math.ceil(L.W / L.ts) + tx) * bytes, b = await range(L.url, off, off + bytes - 1);
      tiles.set(key, Float32Array.from({ length: L.ts * L.ts }, (_, i) => b.readFloatLE(i * 4)));
    }
    vals.push(tiles.get(key)[(y % L.ts) * L.ts + (x % L.ts)]);
  }
  return vals;
}

// Caves and pits: two small catalogues, whole files. The Mars Global Cave Candidate Catalog (Cushing 2016; USGS Astrogeology, PDS
// bundle mars_mro.odyssey_multi_cavecatalog_cushing_2016: about 1,060 unconfirmed candidate entrances, a zip whose data/Mars_Cave_Catalog.csv
// has the columns ID, lon (east, 0–360), lat, type, priority, APC diameter and depth, comment — the file's own header row omits the ID column) and
// the LROC Lunar Pit Atlas (Wagner and Robinson 2021; PDS LRO-L-LROC-5-RDR-V1.0, about 280 pits). For each site: the nearest entry, and how many lie
// within 100 km. A candidate is not a cave; the catalogue says so, and so does the page.
import { inflateRawSync } from 'node:zlib';
const CAVES = 'https://astrogeology.usgs.gov/ckan/dataset/c2960f77-ee20-4cc6-ac85-abbecc0fc7f6/resource/ccd54fb2-9a50-46bf-8971-80c241bb2f40/download/mars_cave_catalog.zip';
const PITS = 'https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/EXTRAS/SHAPEFILE/LUNAR_PIT_LOCATIONS/LUNAR_PIT_LOCATIONS.CSV';
const RADIUS = { moon: 1737.4, mars: 3389.5 };
function unzipEntry(buf, name) {   // one entry of a zip by its central directory (deflate or stored)
  let e = buf.length - 22; while (buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let i = 0, n = buf.readUInt16LE(e + 10); i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    if (buf.toString('utf8', p + 46, p + 46 + nl).endsWith(name)) {
      const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), data = buf.subarray(start, start + csize);
      return (method === 0 ? data : inflateRawSync(data)).toString('utf8');
    }
    p += 46 + nl + el + cl;
  }
  throw new Error(`${name} is not in the zip`);
}
function csv(text) {   // RFC 4180: quoted fields may hold commas, quotes and newlines
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const get = async url => { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`); return Buffer.from(await r.arrayBuffer()); };
const km = (a, b, c, d, R) => { const k = Math.PI / 180, s = Math.sin((c - a) * k / 2) ** 2 + Math.cos(a * k) * Math.cos(c * k) * Math.sin((d - b) * k / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(s))); };
const marsCaves = csv(unzipEntry(await get(CAVES), 'data/Mars_Cave_Catalog.csv')).slice(1).filter(r => r.length >= 8 && Number.isFinite(+r[1]))
  .map(r => ({ label: r[0], lon: +r[1], lat: +r[2], type: r[3], priority: +r[4] }));
const pitRows = csv((await get(PITS)).toString('utf8')), H = pitRows[0], col = n => H.indexOf(n);
const moonPits = pitRows.slice(1).filter(r => Number.isFinite(+r[col('Latitude')]) && r[col('Name')]).map(r => ({ label: r[col('Name')], lat: +r[col('Latitude')], lon: +r[col('Longitude_180')], type: r[col('Terrain')] }));
function caves(body, lat, lon) {
  const list = body === 'mars' ? marsCaves : moonPits, near = list.map(c => ({ ...c, km: km(lat, lon, c.lat, c.lon, RADIUS[body]) })).sort((a, b) => a.km - b.km);
  return { catalogue: body === 'mars' ? 'mars' : 'moon', total: list.length, nearest_km: Math.round(near[0].km), nearest_label: near[0].label, nearest_type: near[0].type, within_100_km: near.filter(c => c.km <= 100).length };
}

// Mars rock chemistry and water: the Odyssey Gamma-Ray Spectrometer's element concentrations (Boynton et al. 2007; NASA PDS
// Geosciences Node, ODY-M-GRS-5-ELEMENTS-V1.0, smoothed 5° × 5° tables: 2 × 2° data smoothed with a 10° boxcar). Six small ASCII tables read whole:
// latitude and longitude of the bin's centre (longitude east, 0–360), the concentration, its error; 9999.999 is not applicable (the poles). A bin is
// about 300 km across at the equator, so a value is regional. "Water" is hydrogen read as water-equivalent, sensed in the top metre or so, and
// includes water bound in minerals as well as ice.
const GRS = 'https://pds-geosciences.wustl.edu/ody/ody-m-grs-5-elements-v1/odgm_xxxx/data/smoothed/';
const ELEMENTS = [['h2o', 'h2o_wt'], ['fe', 'fe_wt'], ['si', 'si_wt'], ['k', 'k_wt'], ['cl', 'cl_wt'], ['th', 'th_ppm']];
const grs = {};
for (const [file] of ELEMENTS) {
  grs[file] = new Map((await get(`${GRS}${file}_sr_5x5.tab`)).toString('latin1').split('\n').filter(l => l.trim()).map(l => {
    const [la, lo, c, s] = l.trim().split(/\s+/).map(Number);
    return [`${la}|${lo}`, [c === 9999.999 ? null : c, s === 9999.999 ? null : s]];
  }));
}
function elements(lat, lon) {
  const la = Math.floor(lat / 5) * 5 + 2.5, lo = Math.floor((((lon % 360) + 360) % 360) / 5) * 5 + 2.5, e = { bin_centre: [la, lo], bin_deg: 5 };
  for (const [file, key] of ELEMENTS) { const v = grs[file].get(`${la}|${lo}`); e[key] = v?.[0] ?? null; if (file === 'h2o') e.h2o_sigma = v?.[1] ?? null; }
  return e;
}

const out = {};
for (const [body, id, lat, lon] of SITES) {
  if (body === 'moon') {
    const t = stats(await diviner(lat, lon, 'tbol_m'), x => x > 20 && x < 500), g = stats(await diviner(lat, lon, 'treg_m'), x => x > 20 && x < 500), ra = stats(await diviner(lat, lon, 'ra_sam'), x => x >= 0 && x <= 1);
    out[id] = { body, lat, lon, window_km: +(((2 * D.half + 1) * 1000 * 360 / D.W / 1000 * Math.PI * 1737.4 / 180)).toFixed(1),
      tbol_midnight_k: r2(t.median, 2), tbol_midnight_range_k: [r2(t.min, 2), r2(t.max, 2)], treg_midnight_k: r2(g.median, 2), rock_abundance: r2(ra.median, 3), valid_px: t.n };
  } else {
    let half = 10, s = stats(await themis(lat, lon, half), x => x > 0 && x < 5000);
    for (const wider of [25, 50, 100]) { if (s.n >= 50) break; half = wider; s = stats(await themis(lat, lon, half), x => x > 0 && x < 5000); }
    out[id] = { body, lat, lon, window_km: +((2 * half + 1) * 0.1).toFixed(1), thermal_inertia: r2(s.median, 0), thermal_inertia_range: [r2(s.min, 0), r2(s.max, 0)], valid_px: s.n, of_px: (2 * half + 1) ** 2 };
    if (s.n < 50) out[id].note = 'The THEMIS tile holds too few valid pixels here to give a value.';
  }
  out[id].caves = caves(body, lat, lon);
  if (body === 'mars') out[id].elements = elements(lat, lon);
  console.log(id, JSON.stringify(out[id]));
}

const sources = {
  moon: { dataset: 'LRO Diviner global high-resolution mosaics (GHRM), 70°S–70°N, about 237 m/px', layers: 'tbol_m, treg_m, ra_sam', provider: 'NASA PDS Geosciences Node, bundle urn:nasa:pds:lro_diviner_derived1', url: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/' },
  mars: { dataset: 'THEMIS-derived global thermal inertia mosaic (quantitative, 32-bit), 100 m/px', layers: 'thermal inertia', provider: 'USGS Astrogeology Science Center, Astropedia; Fergason et al. 2006, JGR 111, E12004', url: 'https://astrogeology.usgs.gov/search/map/mars-themis-derived-global-thermal-inertia-mosaic' },
  elements: { dataset: 'Odyssey GRS element concentrations (water, iron, silicon, potassium, chlorine, thorium), smoothed 5° bins', provider: 'NASA PDS Geosciences Node (ODY-M-GRS-5-ELEMENTS-V1.0); Boynton et al. 2007, JGR 112, E12S99', url: 'https://pds-geosciences.wustl.edu/missions/odyssey/grs_elements.html' },
  caves: {
    mars: { dataset: 'Mars Global Cave Candidate Catalog v1 (about 1,060 unconfirmed candidate entrances)', provider: 'USGS Astrogeology Science Center, NASA PDS; Cushing 2012 and 2016', url: 'https://astrogeology.usgs.gov/search/map/mars_global_cave_candidate_catalog_v1_cushing' },
    moon: { dataset: 'Lunar Pit Atlas (about 280 pits)', provider: 'LROC, Arizona State University, NASA PDS (LRO-L-LROC-5-RDR-V1.0); Wagner and Robinson 2021', url: 'https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_LUNAR_PIT_LOCATIONS' },
  },
};
writeFileSync(new URL('../src/data/surface.gen.json', import.meta.url), JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), sources, sites: out }, null, 1) + '\n');
console.log('wrote src/data/surface.gen.json');
