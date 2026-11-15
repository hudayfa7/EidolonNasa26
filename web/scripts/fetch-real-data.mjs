// Real data on the demo path (docs/plan.md: Must 5 and "Placeholder to real"). Fetches openly licensed global maps and
// site data from their official sources and writes the web assets the app ships:
//   public/textures/  the globes' colour (and lo/, their low tiers), elevation (bump), night-light and water maps;
//                     manifest.json updated in place
//   public/sites/     elevation patches (patches/*.bin + manifest.json) and orbital crops (crops/*.jpg) for the featured
//                     sites on the demo path, the established Earth sites, the mock's Earth cells and the lunar south pole
//   public/photos/    the surface photographs (src/data/photos.ts), cut square from NASA's Image and Video Library
//   public/textures/  also Beyond's spacecraft images (src/data/photos.ts BEYOND), from the same library
// Sources, licences and credit lines: docs/credits.md. Downloads and finished patches are cached in .cache/real-data/
// (gitignored), so a rerun only redoes what changed. Usage: npm run fetch:real [-- --only=globes|cap|normals|clouds|sites|drape|photos|beyond]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fromArrayBuffer, fromUrl } from 'geotiff';
import sharp from 'sharp';
import { CAP_S, capToLL, clamp, localToLL, wrap180 } from '../src/coords.ts';
import { BEYOND, PHOTOS } from '../src/data/photos.ts';
import { DEMO_CELLS, EARTH, ELEV, MADE_UP_CELLS, PIN_KM, PINS, RADIUS, TARGETS } from '../src/data/real-sites.ts';
import { provenance } from './sources.mjs';

const ROOT = new URL('../', import.meta.url), CACHE = new URL('.cache/real-data/', ROOT);
const TEXDIR = new URL('public/textures/', ROOT), SITEDIR = new URL('public/sites/', ROOT), PHOTODIR = new URL('public/photos/', ROOT);
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
// Provenance (scripts/sources.mjs): each output records the sources it was made from, their URLs, licences and citations,
// and the date of the run. `--only=provenance` rewrites just those records, downloading nothing, with `--fetched=YYYY-MM-DD`
// for data fetched before (default today). The textures' record is a file of its own (public/textures/provenance.json):
// the app loads every key of textures/manifest.json as a texture.
const FETCHED = process.argv.find(a => a.startsWith('--fetched='))?.slice(10) ?? new Date().toISOString().slice(0, 10);
const FETCHED_GLOBES = process.argv.find(a => a.startsWith('--fetched-globes='))?.slice(17) ?? FETCHED;   // the textures', when they were fetched on another day
const GLOBE_SOURCES = ['mdim', 'tes', 'mola', 'clem', 'wac', 'lola', 'gibs', 'clouds', 'etopo1', 'nasaImages'];
const SITE_SOURCES = ['blend', 'sldem', 'lola', 'glo30', 'mdim', 'wac', 'gibs'];
const D2R = Math.PI / 180;
const WIN = 94 * 200 / 1000;   // the engine's comparison window, km (src/terrain/procedural.ts WINDOW_KM)

const USGS = 'https://asc-pds-services.s3.us-west-2.amazonaws.com/';
const LROC = 'https://pds.lroc.asu.edu/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DATA/BDR/WAC_GLOBAL/';
const LOLA = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/';
const GIBS = (layer, w, h, fmt, time = '', box = '-90,-180,90,180') => 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0'
  + `&LAYERS=${layer}&STYLES=&CRS=EPSG:4326&BBOX=${box}&WIDTH=${w}&HEIGHT=${h}&FORMAT=${fmt}${time && `&TIME=${time}`}${fmt === 'image/png' ? '&TRANSPARENT=TRUE' : ''}`;
const SRC = {
  mdim: USGS + 'wms_basemaps/Mars/MDIM21_AMESColor/MDIM21_AMES_recolor_dd360_jpeg_cog.tif',
  clem: USGS + 'wms_basemaps/Moon/Clem_UVVIS_Mosaic_Global_256ppd_v02.tif.ovr',   // the 750 nm mosaic's overviews: [3] is 16 px/°
  tes: USGS + 'mosaic/Mars_MGS_TES_Albedo_mosaic_global_7410m.tif',
  mola: USGS + 'wms_basemaps/Mars/MOLA/mola128_mola64_merge_90Nto90S_SimpleC_clon0_cog.tif',
  blend: USGS + 'mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif',
  sldem: USGS + 'mosaic/LolaKaguya_Topo/Lunar_LRO_LOLAKaguya_DEMmerge_60N60S_512ppd.tif',
  wac16: LROC + 'WAC_GLOBAL_E000N0000_016P.IMG', wac64: LROC + 'WAC_GLOBAL_E000N0000_064P.IMG', wacPole: LROC + 'WAC_GLOBAL_P900S0000_064P.IMG',
  ldem16: LOLA + 'cylindrical/img/ldem_16', ldemPole: LOLA + 'polar/float_img/ldem_75s_240m_float',
  glo30: (la, lo) => { const n = `Copernicus_DSM_COG_10_${la < 0 ? 'S' : 'N'}${String(Math.abs(la)).padStart(2, '0')}_00_${lo < 0 ? 'W' : 'E'}${String(Math.abs(lo)).padStart(3, '0')}_00_DEM`;
    return `https://copernicus-dem-30m.s3.amazonaws.com/${n}/${n}.tif`; },
  clouds: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',   // Blue Marble: Clouds, NASA's own 2K
  etopo: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/ETOPO1_ice_surface/ImageServer/exportImage?bbox=-180,-90,180,90'
    + '&bboxSR=4326&imageSR=4326&size=2048,1024&format=tiff&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image',
};
// What the app names each source by, and whose it is: the site panel's credit lines and the terrain note
// (docs/credits.md has the full credits and licences). The globes' sources are here too: crops without a file of their
// own are cut from the globe.
const CREDIT = {
  blend: ['MOLA–HRSC blended DEM, 200 m', 'NASA, ESA, DLR, FU Berlin, USGS'],
  sldem: ['SLDEM2015 (LOLA and Kaguya TC), 59 m', 'NASA GSFC, JAXA'],
  lolaPole: ['LOLA south polar DEM, 240 m', 'NASA GSFC'],
  lolaCap: ['LOLA south polar DEM, resampled to 1 km', 'NASA GSFC'],
  glo30: ['Copernicus DEM GLO-30', '© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'],
  mdim: ['Viking MDIM 2.1 colour mosaic', 'NASA, USGS, NASA Ames'],
  mdimTes: ['Viking MDIM 2.1 colour mosaic over MGS TES albedo', 'NASA, USGS, NASA Ames; NASA, JPL, Arizona State University'],
  wac: ['LROC WAC global mosaic', 'NASA, GSFC, Arizona State University'],
  wacPole: ['LROC WAC south polar mosaic', 'NASA, GSFC, Arizona State University'],
  wacClem: ['LROC WAC global mosaic over Clementine 750 nm albedo', 'NASA, GSFC, Arizona State University; NASA and DoD Clementine, USGS'],
  bmng: ['Blue Marble Next Generation with shaded relief and bathymetry', 'NASA Earth Observatory, via NASA GIBS'],
  bmng500: ['Blue Marble Next Generation, 500 m', 'NASA Earth Observatory, via NASA GIBS'],
  weld: ['Landsat WELD true-colour composite, 1999', 'NASA, USGS, South Dakota State University, via NASA GIBS'],
  weldBmng: ['Landsat WELD true-colour composite, 1999, its gaps from Blue Marble Next Generation', 'NASA, USGS, South Dakota State University, NASA Earth Observatory, via NASA GIBS'],
};

/* ---------- Fetching, with retries and a cache ---------- */
mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, headers = {}, tries = 5) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(300000) });
      if (r.status === 404) return null;
      if (r.status === 429 && i < tries) { await sleep(1000 * (+r.headers.get('retry-after') || 15 * 2 ** i)); continue; }   // throttled: wait it out
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (headers.Range && r.status !== 206) throw new Error(`HTTP ${r.status} to a ranged request: the whole file, not the rows asked for`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i >= tries) throw new Error(`${url}: ${e.message}`); await sleep(1000 * 2 ** i); }
  }
}
/** f(), run again after a dropped connection: the COG readers (geotiff) fetch on their own, without get()'s retries. */
async function retry(f, tries = 5) {
  for (let i = 0; ; i++) {
    try { return await f(); } catch (e) { if (i >= tries) throw e; console.log(`  retry ${i + 1}: ${e.cause?.code ?? e.message}`); await sleep(2000 * 2 ** i); }
  }
}
const cacheFile = key => new URL(createHash('sha1').update(key).digest('hex').slice(0, 16), CACHE);
/** The whole file at url, downloaded once. */
async function file(url) {
  const f = cacheFile(url); if (existsSync(f)) return readFileSync(f);
  console.log(`  download ${url}`); const b = await get(url); if (!b) throw new Error(`${url}: 404`);
  writeFileSync(f, b); return b;
}
/** f(), or its earlier result (a Float32Array, Uint8Array or Buffer) under the same key. */
async function memo(key, f, Type = Float32Array) {
  const c = cacheFile(key); if (existsSync(c)) { const b = readFileSync(c); return new Type(b.buffer, b.byteOffset, b.length / Type.BYTES_PER_ELEMENT); }
  const v = await f(); writeFileSync(c, Buffer.from(v.buffer, v.byteOffset, v.byteLength)); return v;
}
async function pool(items, n, f) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) { const i = next++; out[i] = await f(items[i], i); } }));
  return out;
}

/* ---------- Rasters: pixel coordinates of (lat, lon), and windows of their values ---------- */
// Pixel coordinates are 0-based with integers at pixel centres. A source is { w, h, global, bands, px(lat, lon), read(x0, y0,
// x1, y1) → Float32Array per band (rows y0..y1-1, columns x0..x1-1, wrapping round a global map, NaN for no data) }.

// PDS3 label: the first value of each keyword (numbers parsed, units dropped).
function pdsLabel(text) {
  const m = {}; for (const [, k, v] of text.matchAll(/^\s*(\^?[A-Z_]+)\s*=\s*"?([^"\r\n]*?)"?\s*(?:<[^>]*>)?\s*$/gm)) if (!(k in m)) m[k] = /^-?[\d.]+(?:E-?\d+)?$/i.test(v) ? +v : v;
  return m;
}
// A PDS image (raw rows), equirectangular or south polar stereographic, from a buffer or by ranged reads.
async function pds(url, { whole = false, label: lblUrl } = {}) {
  const buf = whole ? await file(url) : null;
  const head = (lblUrl ? await get(lblUrl) : buf ? buf.subarray(0, 65536) : await get(url, { Range: 'bytes=0-65535' })).toString('latin1');
  const L = pdsLabel(head), w = L.LINE_SAMPLES, h = L.LINES, bytes = L.SAMPLE_BITS / 8, float = /REAL/.test(L.SAMPLE_TYPE);
  if (!(float ? L.SAMPLE_TYPE === 'PC_REAL' && bytes === 4 : L.SAMPLE_TYPE === 'LSB_INTEGER' && bytes === 2))   // what value() reads
    throw new Error(`${url}: ${L.SAMPLE_BITS}-bit ${L.SAMPLE_TYPE} samples, not little-endian float32 or int16`);
  const start = typeof L['^IMAGE'] === 'number' ? (L['^IMAGE'] - 1) * L.RECORD_BYTES : 0, row = w * bytes;
  const scale = typeof L.SCALING_FACTOR === 'number' ? L.SCALING_FACTOR : 1;
  const value = (b, i) => { const v = float ? b.readFloatLE(i) : b.readInt16LE(i); return float ? (v < -1e30 ? NaN : v * scale) : v * scale; };
  const polar = /POLAR/.test(L.MAP_PROJECTION_TYPE), soff = L.SAMPLE_PROJECTION_OFFSET, loff = L.LINE_PROJECTION_OFFSET, clon = L.CENTER_LONGITUDE;
  if (polar && L.CENTER_LATITUDE !== -90) throw new Error(`${url}: only south polar stereographic is handled`);
  const Rm = L.A_AXIS_RADIUS * 1000, mps = L.MAP_SCALE;   // MAP_SCALE: metres per pixel (LOLA labels it m/pix, LROC METERS/PIXEL)
  const px = polar
    ? (lat, lon) => { const rho = 2 * Rm * Math.tan(Math.PI / 4 + lat * D2R / 2) / mps, a = (lon - clon) * D2R; return [soff + rho * Math.sin(a), loff - rho * Math.cos(a)]; }
    : (lat, lon) => [soff + (lon - clon) * L.MAP_RESOLUTION, loff - (lat - L.CENTER_LATITUDE) * L.MAP_RESOLUTION];
  // The rows needed, whole (they lie back to back): from the downloaded file, or fetched 64 rows per request (the
  // archives throttle many small requests).
  async function read(x0, y0, x1, y1) {
    const W = x1 - x0, out = new Float32Array(W * (y1 - y0)).fill(NaN), ya = Math.max(0, y0), yb = Math.min(h, y1);
    if (yb <= ya) return [out];
    const blk = buf ? buf.subarray(start + ya * row, start + yb * row) : Buffer.from(await memo(`rows ${url} ${ya} ${yb}`, async () => Buffer.concat(
      await pool([...Array(Math.ceil((yb - ya) / 64)).keys()], 1, k => { const a = start + (ya + k * 64) * row, b = start + Math.min(yb, ya + k * 64 + 64) * row;
        return get(url, { Range: `bytes=${a}-${b - 1}` }); })), Uint8Array));
    for (let y = ya; y < yb; y++) for (const [a, b] of spans(x0, x1, w, !polar))
      for (let x = a; x < b; x++) out[(y - y0) * W + (x - x0 + (x < x0 ? w : x >= x1 ? -w : 0))] = value(blk, (y - ya) * row + x * bytes);
    return [out];
  }
  return { w, h, global: !polar, bands: 1, px, read };
}
// Column spans [a, b) of the source covering x0..x1 (wrapping round a global map), each inside 0..w.
function spans(x0, x1, w, wrap) {
  if (!wrap) return x1 <= 0 || x0 >= w ? [] : [[Math.max(0, x0), Math.min(w, x1)]];
  const out = []; for (let x = x0; x < x1;) { const a = ((x % w) + w) % w, n = Math.min(x1 - x, w - a); out.push([a, a + n]); x += n; }
  return out.map(([a, b]) => [a, b]).filter(([a, b]) => b > a);
}
// The USGS global DEMs: uncompressed BigTIFFs, one row per strip, rows stored back to back (checked), int16 with a
// nodata value; read by ranged requests of just the columns needed.
async function stripTiff(url, { metres }) {
  const tif = await fromUrl(url), im = await tif.getImage(0), fd = im.fileDirectory, w = im.getWidth(), h = im.getHeight();
  const so = await fd.loadValue('StripOffsets'), row = w * 2;
  const tag = k => { const v = fd.getValue(k); return typeof v === 'number' ? v : v[0]; };
  if (tag('BitsPerSample') !== 16 || tag('SampleFormat') !== 2 || tag('Compression') !== 1 || tag('RowsPerStrip') !== 1
    || so[1] - so[0] !== row || so[h - 1] - so[0] !== (h - 1) * row) throw new Error(`${url}: not an uncompressed int16 strip-per-row TIFF`);
  const meta = fd.hasTag('GDAL_METADATA') ? await fd.loadValue('GDAL_METADATA') : '', scale = +(/name="SCALE"[^>]*>([\d.]+)/.exec(meta)?.[1] ?? 1);
  const nodata = +fd.getValue('GDAL_NODATA'), [ox, oy] = im.getOrigin(), [rx, ry] = im.getResolution(), toDeg = metres ? 1 / (metres * D2R) : 1;
  const px = (lat, lon) => [(lon - ox * toDeg) / (rx * toDeg) - .5, (oy * toDeg - lat) / (-ry * toDeg) - .5];
  async function read(x0, y0, x1, y1) {
    const W = x1 - x0, out = new Float32Array(W * (y1 - y0)).fill(NaN);
    await pool([...Array(y1 - y0).keys()], 32, async j => {
      const y = y0 + j; if (y < 0 || y >= h) return;
      for (const [a, b] of spans(x0, x1, w, true)) {
        const B = await get(url, { Range: `bytes=${so[0] + y * row + a * 2}-${so[0] + y * row + b * 2 - 1}` });
        for (let x = a; x < b; x++) { const v = B.readInt16LE((x - a) * 2); out[j * W + (x - x0 + (x < x0 ? w : x >= x1 ? -w : 0))] = v === nodata ? NaN : v * scale; }
      }
    });
    return [out];
  }
  return { w, h, global: true, bands: 1, px, read };
}
// A cloud-optimised GeoTIFF (degrees, a global map) at overview `level` (0: full resolution).
async function cog(url, level) {
  const tif = await fromUrl(url), base = await tif.getImage(0), im = await tif.getImage(Math.min(level, (await tif.getImageCount()) - 1));
  const w = im.getWidth(), h = im.getHeight(), [ox, oy] = base.getOrigin(), [bw, bh] = [base.getWidth(), base.getHeight()];
  const [rx, ry] = base.getResolution(), dx = rx * bw / w, dy = -ry * bh / h;
  const px = (lat, lon) => [(lon - ox) / dx - .5, (oy - lat) / dy - .5];
  async function read(x0, y0, x1, y1) {
    const W = x1 - x0, out = Array.from({ length: im.getSamplesPerPixel() }, () => new Float32Array(W * (y1 - y0)).fill(NaN));
    for (const [a, b] of spans(x0, x1, w, true)) {
      const ya = Math.max(0, y0), yb = Math.min(h, y1); if (yb <= ya) continue;
      // A JPEG COG stores YCbCr: readRGB converts it.
      const r = await (im.getSamplesPerPixel() === 3 ? im.readRGB({ window: [a, ya, b, yb], interleave: false }) : im.readRasters({ window: [a, ya, b, yb] }));
      r.forEach((band, k) => { for (let y = ya; y < yb; y++) for (let x = a; x < b; x++) out[k][(y - y0) * W + (x - x0 + (x < x0 ? w : x >= x1 ? -w : 0))] = band[(y - ya) * (b - a) + x - a]; });
    }
    return out;
  }
  return { w, h, global: true, bands: im.getSamplesPerPixel(), px, read };
}
// Bilinear samples of a source at (lat, lon) points: one window read covering them all (longitudes unwrapped round
// their mean, so a window crossing the map's edge stays one piece).
async function sampleAll(src, pts) {
  const lon0 = pts.length ? pts[Math.floor(pts.length / 2)][1] : 0;
  const xy = pts.map(([la, lo]) => src.px(la, src.global ? lon0 + wrap180(lo - lon0) : lo));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of xy) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2;
  const W = x1 - x0, H = y1 - y0, bands = await src.read(x0, y0, x1, y1);
  return bands.map(B => xy.map(([x, y]) => {
    const fx = Math.min(Math.max(x - x0, 0), W - 1.001), fy = Math.min(Math.max(y - y0, 0), H - 1.001), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const a = B[j * W + i], b = B[j * W + i + 1], c = B[(j + 1) * W + i], d = B[(j + 1) * W + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }));
}
// Copernicus GLO-30 (1° COG tiles, missing over the sea) at the overview nearest `m` metres per pixel.
const tifs = {};
async function glo30(pts, m) {
  const out = new Float32Array(pts.length).fill(NaN), tiles = new Map();
  pts.forEach(([la, lo], i) => { const k = `${Math.floor(la)},${Math.floor(lo)}`; if (!tiles.has(k)) tiles.set(k, []); tiles.get(k).push(i); });
  for (const [k, idx] of tiles) {
    const [la, lo] = k.split(',').map(Number), url = SRC.glo30(la, lo);
    // Sea: no tile (S3 answers 403 or 404). Anything else but 200 (throttled, a server error) stops the run, not 0 m.
    const st = await (tifs[url + ' head'] ??= fetch(url, { method: 'HEAD' }).then(r => r.status));
    if (st === 403 || st === 404) { for (const i of idx) out[i] = 0; continue; }
    if (st !== 200) throw new Error(`${url}: HTTP ${st}`);
    const tif = await (tifs[url] ??= fromUrl(url)), n = await tif.getImageCount(), level = Math.max(0, Math.min(n - 1, Math.floor(Math.log2(m / 30))));
    const vals = await sampleAll(await cogTile(tif, level), idx.map(i => pts[i]));
    idx.forEach((i, j) => { out[i] = vals[0][j]; });
  }
  return out;
}
async function cogTile(tif, level) {
  const base = await tif.getImage(0), im = await tif.getImage(level), w = im.getWidth(), h = im.getHeight(), [ox, oy] = base.getOrigin();
  const dx = base.getResolution()[0] * base.getWidth() / w, dy = -base.getResolution()[1] * base.getHeight() / h;
  // Clamped to the tile's pixel centres: a point in its outer half pixel (the samples along a 1° seam) takes the edge
  // pixel, where interpolating toward the next tile's would read no data.
  return { w, h, global: false, bands: 1, px: (lat, lon) => [clamp((lon - ox) / dx - .5, 0, w - 1.001), clamp((oy - lat) / dy - .5, 0, h - 1.001)],
    async read(x0, y0, x1, y1) {
      const W = x1 - x0, out = new Float32Array(W * (y1 - y0)).fill(NaN), a = Math.max(0, x0), b = Math.min(w, x1), ya = Math.max(0, y0), yb = Math.min(h, y1);
      const [r] = await im.readRasters({ window: [a, ya, b, yb] });
      for (let y = ya; y < yb; y++) for (let x = a; x < b; x++) out[(y - y0) * W + x - x0] = r[(y - ya) * (b - a) + x - a];
      return [out];
    } };
}

/* ---------- The sites' grids: the app's local azimuthal-equidistant square, row 0 north, edge to edge ---------- */
// Each of the n × n samples averages k × k points spread over its cell (the engine warps its windows with averaging).
function grid(body, lat, lon, km, n, k) {
  const pts = [], half = km / 2, du = 2 / (n - 1);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) {
    const u = -1 + i * du + du * ((a + .5) / k - .5), v = 1 - j * du - du * ((b + .5) / k - .5);
    pts.push(localToLL(RADIUS[body], lat, lon, u * half, v * half));
  }
  return pts;
}
const average = (vals, n, k) => Float32Array.from({ length: n * n }, (_, c) => {
  let s = 0, m = 0; for (let q = 0; q < k * k; q++) { const v = vals[c * k * k + q]; if (Number.isFinite(v)) { s += v; m++; } } return m ? s / m : NaN;
});

const sources = {};
const src = async (name, make) => sources[name] ??= await make();
// Heights (m) of a patch from the body's best source there.
async function patchHeights(p) {
  const spacing = p.km * 1000 / (p.n - 1), res = { mars: 200, moon: p.lat > -59.5 ? 59 : 240, earth: 30 }[p.body];
  const k = Math.max(1, Math.min(4, Math.round(spacing / res))), pts = grid(p.body, p.lat, p.lon, p.km, p.n, k);
  let vals;
  if (p.body === 'earth') vals = await glo30(pts, spacing / 2);
  else if (p.body === 'mars') vals = (await sampleAll(await src('blend', () => stripTiff(SRC.blend, { metres: 0 })), pts))[0];
  else if (pts.every(([la]) => Math.abs(la) <= 59.5)) vals = (await sampleAll(await src('sldem', () => stripTiff(SRC.sldem, { metres: 1737400 })), pts))[0];
  else vals = (await sampleAll(await lolaPole(), pts))[0].map(v => v * 1000);
  return average(vals, p.n, k);
}
const ldem16 = () => src('ldem16', () => pds(SRC.ldem16 + '.img', { whole: true, label: SRC.ldem16 + '.lbl' }));
const lolaPole = () => src('lolaPole', async () => { const p = await pds(SRC.ldemPole + '.img', { whole: true, label: SRC.ldemPole + '.lbl' }); await checkPolar(p); return p; });
const sourceOf = p => p.body === 'earth' ? 'glo30' : p.body === 'mars' ? 'blend' : p.lat > -59.5 ? 'sldem' : p.lat === -90 ? 'lolaCap' : 'lolaPole';

/* ---------- Globes ---------- */
function boxDown(src, w, h, W, H) {   // area average, NaN-aware
  const out = new Float32Array(W * H), sx = w / W, sy = h / H;
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    let s = 0, n = 0;
    for (let y = Math.floor(Y * sy); y < Math.ceil((Y + 1) * sy); y++) for (let x = Math.floor(X * sx); x < Math.ceil((X + 1) * sx); x++) {
      const v = src[y * w + x]; if (Number.isFinite(v)) { s += v; n++; }
    }
    out[Y * W + X] = n ? s / n : NaN;
  }
  return out;
}
const roll = (a, W, H, by) => Float32Array.from({ length: W * H }, (_, i) => a[Math.floor(i / W) * W + (i % W + by) % W]);
const toByte = (a, lo, hi) => Uint8Array.from(a, v => Math.round(Math.min(255, Math.max(0, (v - lo) / (hi - lo) * 255))) || 0);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', TEXDIR), 'utf8'));
// The globes' 4K colour maps also get a low tier, the full map downsampled to 1024 px (public/textures/lo/): the app
// starts on it and crossfades to the full map when that lands (src/scene/renderer.ts loadTextures). And a 2K tier
// (mid/), the full map on phones (the lighter path).
const TIERED = new Set(['mars', 'moon', 'earth_day']);
async function writeJpeg(key, img, quality = 85, opts = {}) {
  const buf = await img.jpeg({ quality, mozjpeg: true, ...opts }).toBuffer(), meta = await sharp(buf).metadata();
  writeFileSync(new URL(`${key}.jpg`, TEXDIR), buf);
  manifest[key] = { file: `${key}.jpg`, mime: 'image/jpeg', bytes: buf.length, w: meta.width, h: meta.height };
  console.log(`  ${key}.jpg ${meta.width}×${meta.height} ${(buf.length / 1024).toFixed(0)} KB`);
  if (!TIERED.has(key)) return;
  const lo = await sharp(buf).resize(1024, 512, { kernel: 'lanczos3' }).jpeg({ quality, mozjpeg: true }).toBuffer();
  mkdirSync(new URL('lo/', TEXDIR), { recursive: true }); writeFileSync(new URL(`lo/${key}.jpg`, TEXDIR), lo);
  manifest[key].lo = { file: `lo/${key}.jpg`, bytes: lo.length, w: 1024, h: 512 };
  console.log(`  lo/${key}.jpg 1024×512 ${(lo.length / 1024).toFixed(0)} KB`);
  const mid = await sharp(buf).resize(2048, 1024, { kernel: 'lanczos3' }).jpeg({ quality, mozjpeg: true }).toBuffer();
  mkdirSync(new URL('mid/', TEXDIR), { recursive: true }); writeFileSync(new URL(`mid/${key}.jpg`, TEXDIR), mid);
  manifest[key].mid = { file: `mid/${key}.jpg`, bytes: mid.length, w: 2048, h: 1024 };
  console.log(`  mid/${key}.jpg 2048×1024 ${(mid.length / 1024).toFixed(0)} KB`);
}
const grey = (a, w, h) => sharp(Buffer.from(a), { raw: { width: w, height: h, channels: 1 } });
const bump = (body, a, w, h) => writeJpeg(`${body}_bump`, grey(toByte(a, ...ELEV[body]), w, h), 92);
// The globes' relief as normal maps baked from the same DEMs at full precision (the 8-bit bump maps band on smooth
// ground; the shader read slopes from them): R and G the slope (m/m) east and north, the east spacing shrunk by
// cos(latitude), stored as sign · √(|s| / SMAX) over 0–255 so gentle global slopes keep their levels (the shader squares
// it back), B unused; full chroma, so the channels stay apart. Mars and the Moon at the bump maps' 2048 px, Earth at
// 1024 (its relief only shades the land), its seas flat as its bump map has them. The bump maps stay for the app's CPU
// reads (pin terrain).
const SMAX = .5;   // src/scene/shaders/planet.frag.glsl
async function normal(body, a, w, h, W = w, H = h) {
  const z = W === w ? a : boxDown(a, w, h, W, H), px = 2 * Math.PI * RADIUS[body] * 1000 / W, rgb = new Uint8Array(W * H * 3);
  const at = (x, y) => z[Math.min(H - 1, Math.max(0, y)) * W + ((x % W) + W) % W] || 0;
  const enc = sl => Math.round(127.5 + 127.5 * Math.sign(sl) * Math.sqrt(Math.min(1, Math.abs(sl) / SMAX)));
  for (let y = 0; y < H; y++) {
    const c = Math.max(.01, Math.cos((90 - (y + .5) * 180 / H) * D2R));
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3;
      rgb[o] = enc((at(x + 1, y) - at(x - 1, y)) / (2 * px * c)); rgb[o + 1] = enc((at(x, y - 1) - at(x, y + 1)) / (2 * px)); rgb[o + 2] = 128;
    }
  }
  await writeJpeg(`${body}_normal`, sharp(Buffer.from(rgb), { raw: { width: W, height: H, channels: 3 } }), 85, { chromaSubsampling: '4:4:4' });
}
// The globes' heights (m), 2048 × 1024 from 180° W as the maps run (Mars from 0° E), from cached downloads.
const DEMS = {
  async mars() {
    const mola = await cog(SRC.mola, 3), mz = await memo('mola-ov3', async () => (await mola.read(0, 0, mola.w, mola.h))[0]);
    // The MOLA grid has pixel centres on both ±180° and both poles: drop the repeated last column and row; it starts at 180° W.
    const mw = mola.w - 1, mh = mola.h - 1, mtrim = Float32Array.from({ length: mw * mh }, (_, i) => mz[Math.floor(i / mw) * mola.w + i % mw]);
    return roll(boxDown(mtrim, mw, mh, 2048, 1024), 2048, 1024, 1024);   // Mars maps start at 0° E
  },
  async moon() { const ldem = await ldem16(), [lz] = await ldem.read(0, 0, ldem.w, ldem.h); return roll(boxDown(lz, ldem.w, ldem.h, 2048, 1024), 2048, 1024, 1024); },   // LDEM_16 starts at 0° E; Moon maps at 180° W
  async earth() { const et = await (await fromArrayBuffer(new Uint8Array(await file(SRC.etopo)).buffer)).getImage(); return Float32Array.from((await et.readRasters())[0]); },
};
async function normals() {
  await normal('mars', await DEMS.mars(), 2048, 1024); await normal('moon', await DEMS.moon(), 2048, 1024);
  await normal('earth', (await DEMS.earth()).map(v => Math.max(0, v)), 2048, 1024, 1024, 512);
}
// The LROC WAC reflectance stretched to the prototype map's brightness (mean 150, spread 29 grey levels, a slightly
// warm tint): the Hadley crops. The polar mosaic has its own curve (wacPole), with shadow kept black.
let wacStretch, wacG;
const wacGrey = () => wacG ??= (async () => {
  const wac = await pds(SRC.wac16, { whole: true }), [a] = await wac.read(0, 0, wac.w, wac.h), ok = a.filter(Number.isFinite);
  const mean = ok.reduce((s, v) => s + v, 0) / ok.length, sd = Math.sqrt(ok.reduce((s, v) => s + (v - mean) ** 2, 0) / ok.length);
  wacStretch = v => 150 + (v - mean) / sd * 29;
  return { wac, a };
})();
const TINT = [1.018, 1, .967];
// NaN-aware box blur (radius r px, 3 passes: near Gaussian) of a w × h map, wrapping east–west.
function blur(a, w, h, r) {
  let v = Float32Array.from(a, x => Number.isFinite(x) ? x : 0), m = Float32Array.from(a, x => +Number.isFinite(x));
  for (let pass = 0; pass < 6; pass++) {
    const horiz = pass % 2 === 0, len = horiz ? w : h, step = horiz ? 1 : w, lines = horiz ? h : w, nv = new Float32Array(w * h), nm = new Float32Array(w * h);
    for (let l = 0; l < lines; l++) {
      const o = horiz ? l * w : l, at = i => o + (horiz ? ((i % w) + w) % w : Math.min(h - 1, Math.max(0, i))) * step;
      let sv = 0, sm = 0; for (let i = -r; i <= r; i++) { sv += v[at(i)]; sm += m[at(i)]; }
      for (let i = 0; i < len; i++) { nv[o + i * step] = sv; nm[o + i * step] = sm; sv += v[at(i + r + 1)] - v[at(i - r)]; sm += m[at(i + r + 1)] - m[at(i - r)]; }
    }
    v = nv; m = nm;
  }
  return Float32Array.from(v, (x, i) => m[i] > 0 ? x / m[i] : NaN);
}
// The Moon's map: the LROC WAC morphologic mosaic's detail over Clementine's 750 nm albedo. WAC's high sun shows relief
// more than albedo (its maria barely darker than the highlands); Clementine's near-zero phase shows the albedo, with
// seams, gaps and stripes. So the albedo is Clementine's smoothed (~0.5°), the detail WAC over its own smoothed; past
// 60–70° of latitude (Clementine's poles are shadowed and patchy) WAC alone. Then the tones of the prototype's map:
// its grey levels at percentiles 1, 5, 10, …, 95, 99 within 60° of the equator, matched piecewise.
const MOON_TONE = [69, 81, 93, 106, 117, 126, 131, 136, 140, 143, 147, 149, 152, 155, 159, 162, 167, 171, 177, 187, 205];
const TONE_PCT = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
async function moonLum(wac, a) {
  const im = await (await fromUrl(SRC.clem)).getImage(3);
  if (im.getWidth() !== wac.w || im.getHeight() !== wac.h) throw new Error('Clementine overview 3 is not the WAC 16 px/° grid');
  const c = await memo('clem-ov3', async () => Float32Array.from((await im.readRasters())[0], v => v || NaN));   // 0: no data
  const W = wac.w, H = wac.h, lw = blur(a, W, H, 8), lc = blur(c, W, H, 8), out = new Float32Array(W * H);
  let gs = 0, gn = 0; for (let i = 0; i < W * H; i++) { const g = lc[i] / lw[i]; if (Number.isFinite(g)) { gs += g; gn++; } }
  for (let y = 0; y < H; y++) {
    const t = poleward(y, H);
    for (let x = 0; x < W; x++) { const i = y * W + x, g = lc[i] / lw[i]; out[i] = a[i] * (Number.isFinite(g) ? g * (1 - t) + gs / gn * t : gs / gn); }
  }
  return matchTones(out, W, H, MOON_TONE);
}
// A W × H map's values to the levels T at TONE_PCT, matched piecewise at its own percentiles within 60° of the equator.
function matchTones(a, W, H, T) {
  const mid = []; for (let i = W * H / 6; i < W * H * 5 / 6; i++) if (Number.isFinite(a[i])) mid.push(a[i]);
  mid.sort((p, q) => p - q); const Q = TONE_PCT.map(p => mid[Math.round(p / 100 * (mid.length - 1))]);
  return Float32Array.from(a, v => { if (!Number.isFinite(v)) return 0; let k = 1; while (k < Q.length - 1 && v > Q[k]) k++;
    return T[k - 1] + (v - Q[k - 1]) / (Q[k] - Q[k - 1]) * (T[k] - T[k - 1]); });
}
// Fraction of the way from 60° to 70° of latitude of a W × H map's row y: where a mosaic hands over to its polar fallback.
const poleward = (y, H) => Math.min(1, Math.max(0, (Math.abs(90 - (y + .5) / H * 180) - 60) / 10));
// The MDIM colour mosaic's 5760 × 2880 overview, interleaved RGB: the globe, and the colour match the crops share.
const mdimOverview = mdim => memo('mdim-ov4-rgb', async () => {
  const b = await mdim.read(0, 0, mdim.w, mdim.h); return Uint8Array.from({ length: mdim.w * mdim.h * 3 }, (_, i) => b[i % 3][Math.floor(i / 3)]);
}, Uint8Array);
// The MDIM colour mosaic per channel to the prototype map's mean and spread (R 155 ± 40, G 92 ± 33, B 59 ± 36): the
// same ground, in the orange the design system gives Mars: the crops, and the globe's caps. `marsGrade.fit` is set from
// the overview and reused for the crops.
const MARS_RGB = [[155.5, 40.3], [91.5, 33.4], [59.4, 36.4]];
function marsGrade(rgb) {
  marsGrade.fit = [0, 1, 2].map(c => { let s = 0, q = 0, n = rgb.length / 3; for (let i = c; i < rgb.length; i += 3) { s += rgb[i]; q += rgb[i] * rgb[i]; }
    const m = s / n, sd = Math.sqrt(q / n - m * m); return v => MARS_RGB[c][0] + (v - m) / sd * MARS_RGB[c][1]; });
  return Uint8Array.from(rgb, (v, i) => Math.min(255, Math.max(0, Math.round(marsGrade.fit[i % 3](v)))));
}

// The Mars globe: MDIM's detail over the MGS TES albedo. Viking's mosaic carries frost and haze (Hellas a white smear,
// a pale band over Elysium and Cerberus) and weakens the dark albedo features; TES's albedo, mapped over years, has
// none of it. Within 60° of the equator each channel is TES's smoothed (~0.5°) albedo through its straight-line fit to
// MDIM's smoothed channel, toned to the prototype map's smoothed percentiles (the design system's orange Mars), times
// MDIM's detail (the channel over its own smoothed). Past 60–70° (the caps, TES patchy) the MDIM grade alone.
const MARS_LOW = [[67, 85, 98, 110, 120, 129, 137, 142, 147, 151, 154, 157, 160, 164, 168, 174, 180, 186, 197, 208, 220],
  [58, 62, 65, 68, 71, 74, 77, 79, 81, 83, 84, 85, 87, 89, 92, 94, 97, 101, 106, 113, 122],
  [48, 49, 50, 50, 50, 50, 51, 51, 51, 51, 51, 51, 51, 51, 52, 52, 52, 52, 52, 53, 54]];
async function marsColour(W, H, mc) {
  const old = marsGrade(mc);   // also the crops' grade
  const im = await (await fromArrayBuffer(new Uint8Array(await file(SRC.tes)).buffer)).getImage(), tw = im.getWidth(), th = im.getHeight();
  if (tw * 2 !== W || th * 2 !== H) throw new Error(`TES albedo ${tw} × ${th}: not half the MDIM overview`);
  const [t0] = await im.readRasters();
  // It starts at 180° W: bilinear to the overview's pixel centres from 0° E, wrapping east–west.
  const at = (x, y) => { const v = t0[y * tw + (((x + tw / 2) % tw) + tw) % tw]; return v > 0 ? v : NaN; };
  const tes = Float32Array.from({ length: W * H }, (_, i) => { const x = (i % W + .5) / 2 - .5, y = Math.min(th - 1.001, Math.max(0, (Math.floor(i / W) + .5) / 2 - .5));
    const a = Math.floor(x), b = Math.floor(y), u = x - a, v = y - b; return (at(a, b) * (1 - u) + at(a + 1, b) * u) * (1 - v) + (at(a, b + 1) * (1 - u) + at(a + 1, b + 1) * u) * v; });
  const ab = blur(tes, W, H, 8), out = new Uint8Array(W * H * 3);
  for (let c = 0; c < 3; c++) {
    const ch = Float32Array.from({ length: W * H }, (_, i) => mc[i * 3 + c]), cb = blur(ch, W, H, 8);
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = W * H / 6; i < W * H * 5 / 6; i++) { const x = ab[i], y = cb[i]; if (Number.isFinite(x)) { n++; sx += x; sy += y; sxx += x * x; sxy += x * y; } }
    const k = (n * sxy - sx * sy) / (n * sxx - sx * sx), base = matchTones(Float32Array.from(ab, x => (sy - k * sx) / n + k * x), W, H, MARS_LOW[c]);
    for (let i = 0; i < W * H; i++) { const t = Number.isFinite(ab[i]) ? poleward(Math.floor(i / W), H) : 1;
      out[i * 3 + c] = Math.min(255, Math.max(0, Math.round(base[i] * ch[i] / Math.max(1, cb[i]) * (1 - t) + old[i * 3 + c] * t))); }
  }
  return out;
}

async function globes() {
  console.log('Mars');
  const mdim = await cog(SRC.mdim, 4), mc = await mdimOverview(mdim);
  await writeJpeg('mars', sharp(Buffer.from(await marsColour(mdim.w, mdim.h, mc)), { raw: { width: mdim.w, height: mdim.h, channels: 3 } }).resize(4096, 2048, { kernel: 'lanczos3' }));
  await bump('mars', await DEMS.mars(), 2048, 1024);

  console.log('Moon');
  const { wac, a } = await wacGrey(), lum = await moonLum(wac, a);
  const rgb = Uint8Array.from({ length: wac.w * wac.h * 3 }, (_, i) => Math.min(255, Math.max(0, Math.round(lum[Math.floor(i / 3)] * TINT[i % 3]))));
  await writeJpeg('moon', sharp(Buffer.from(rgb), { raw: { width: wac.w, height: wac.h, channels: 3 } }).resize(4096, 2048, { kernel: 'lanczos3' }));
  await bump('moon', await DEMS.moon(), 2048, 1024);

  console.log('Earth');
  // With shaded relief and bathymetry, as the prototype's map: the plain composite's near-black sea darkens the globe.
  await writeJpeg('earth_day', sharp(await file(GIBS('BlueMarble_ShadedRelief_Bathymetry', 4096, 2048, 'image/jpeg'))));
  await writeJpeg('earth_night', sharp(await file(GIBS('VIIRS_Black_Marble', 2048, 1024, 'image/jpeg', '2016-01-01'))));
  const water = await sharp(await file(GIBS('MODIS_Water_Mask', 1024, 512, 'image/png'))).ensureAlpha().extractChannel(3).raw().toBuffer();
  await writeJpeg('earth_spec', grey(water, 1024, 512));   // the mask paints water and leaves land transparent
  await bump('earth', await DEMS.earth(), 2048, 1024);
  await clouds();
  await normals();
  writeFileSync(new URL('manifest.json', TEXDIR), JSON.stringify(manifest, null, 2) + '\n');
}
// The title's clouds (Stretch: Earth clouds on the title): Blue Marble's cloud layer, grey, cover from 0 to 255 (the
// planet shader reads it as an R8 map, 2.8 MB of GPU memory with its mips). From 180° W, as the day map.
const clouds = async () => writeJpeg('earth_clouds', sharp(await file(SRC.clouds)).extractChannel(0), 80);
// The LOLA polar grid read with the PDS polar stereographic convention must agree with the global LDEM_16 where both
// are good (77–83° S): a wrong axis or sign gives kilometres of difference. Run whenever the polar grid is first read.
async function checkPolar(pole) {
  const pts = []; for (const lat of [-77, -79, -81, -83]) for (let lon = -180; lon < 180; lon += 7) pts.push([lat, lon]);
  const [a] = await sampleAll(pole, pts), [b] = await sampleAll(await ldem16(), pts);
  const rms = Math.sqrt(pts.reduce((s, _, i) => s + (a[i] * 1000 - b[i]) ** 2, 0) / pts.length);
  if (!(rms < 300)) throw new Error(`LOLA polar DEM disagrees with LDEM_16 (rms ${rms.toFixed(0)} m): projection convention?`);
  console.log(`  LOLA polar vs LDEM_16: rms ${rms.toFixed(0)} m`);
}

// The same for the LROC WAC polar mosaic against the global one (70–76° S): reflectance, so a correlation.
const wacPole = () => src('wacPole', async () => {
  const pole = await pds(SRC.wacPole, { whole: true }), pts = [];
  for (const lat of [-70, -72, -74, -76]) for (let lon = -180; lon < 180; lon += 3) pts.push([lat, lon]);
  const [a] = await sampleAll(pole, pts), [b] = await sampleAll((await wacGrey()).wac, pts), m = v => v.reduce((s, x) => s + x, 0) / v.length, ma = m(a), mb = m(b);
  const r = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0));
  if (!(r > .5)) throw new Error(`LROC WAC polar mosaic disagrees with the global one (r ${r.toFixed(2)}): projection convention?`);
  console.log(`  LROC WAC polar vs global: r ${r.toFixed(2)}`);
  // Its tone: black stays black (the shadowed ground is what makes these sites), its 99th percentile white, a 0.7
  // gamma between (a linear stretch lifts shadow to flat grey; gain alone clips a tenth of the sunlit ground).
  const all = (await pole.read(0, 0, pole.w, pole.h))[0].filter(Number.isFinite).sort(), p99 = all[Math.floor(.99 * (all.length - 1))];
  return { ...pole, tone: v => 255 * Math.max(0, v / p99) ** .7 };
});

// A NASA GIBS layer over the lat/lon box holding `pts` (no site crosses ±180°), about one image pixel per point, as a
// source of four bands (RGBA: alpha 0 where the layer has no data: transparent, or pure black as WELD's gaps are).
async function gibsBox(layer, time, pts, km) {
  let s = 90, n = -90, w = 180, e = -180;
  for (const [la, lo] of pts) { s = Math.min(s, la); n = Math.max(n, la); w = Math.min(w, lo); e = Math.max(e, lo); }
  const dy = km / 480 / 111.2, dx = dy / Math.cos(Math.min(Math.abs(s), Math.abs(n)) * D2R);
  s -= 2 * dy; n += 2 * dy; w -= 2 * dx; e += 2 * dx;
  const W = Math.ceil((e - w) / dx), H = Math.ceil((n - s) / dy);
  const { data, info } = await sharp(await file(GIBS(layer, W, H, 'image/png', time, `${s},${w},${n},${e}`))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== W || info.height !== H) throw new Error(`${layer}: ${info.width} × ${info.height}, not ${W} × ${H}`);
  const bands = [0, 1, 2, 3].map(c => Float32Array.from({ length: W * H }, (_, i) => c < 3 ? data[i * 4 + c] : data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2] ? data[i * 4 + 3] : 0));
  return { w: W, h: H, global: false, bands: 4, px: (la, lo) => [(lo - w) / (e - w) * W - .5, (n - la) / (n - s) * H - .5],
    async read(x0, y0, x1, y1) {
      return bands.map(B => { const o = new Float32Array((x1 - x0) * (y1 - y0)).fill(NaN);
        for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) o[(y - y0) * (x1 - x0) + x - x0] = B[y * W + x];
        return o; });
    } };
}

/* ---------- Sites ---------- */
async function sitesData() {
  const targets = JSON.parse(readFileSync(new URL('src/data/targets.json', ROOT), 'utf8'));
  const iau = (body, name) => { const r = targets[body].find(t => t[0] === name); if (!r) throw new Error(`${name}: not in targets.json`); return { lat: r[2], lon: r[3] }; };
  const fixtures = ['search_named_cached', 'search_named_filtered', 'search_coordinates'].flatMap(f =>
    JSON.parse(readFileSync(new URL(`contracts/examples/api/${f}.response.json`, ROOT), 'utf8')).results.map(r => [r.location.lat, r.location.lon]));
  const cells = [...new Map([...fixtures, ...MADE_UP_CELLS, ...DEMO_CELLS].map(c => [c.join(), c])).values()];
  const capKm = Math.round(2 * 10 * Math.PI * RADIUS.moon / 180);   // the south polar cap to 80° S, 1 km samples: pins there
  // A south-pole site's patch reaches a compare window past its extent on every side, at the site's own spacing (its
  // samples are the site view's): a pin near it (60 km of terrain) stays on the 240 m DEM, not the 1 km cap.
  const own = t => { const m = t.lat < -60 ? Math.round(WIN / (t.ext / 191)) : 0; return { km: t.ext * (191 + 2 * m) / 191, n: 192 + 2 * m }; };
  // The other stage sites: a patch every pin on their extent sits in (a pin's terrain is wider than Jezero or Hadley),
  // at a pin's own spacing (src/terrain/dem.ts patchFor prefers it to the site's finer or coarser patch).
  const pins = t => { const s = PIN_KM[t.body] / 191, n = Math.ceil((t.ext + PIN_KM[t.body]) / s) + 1; return t.lat < -60 ? [] : [{ body: t.body, lat: t.lat, lon: t.lon, km: (n - 1) * s, n }]; };
  const patches = [
    ...TARGETS.flatMap(t => [{ body: t.body, lat: t.lat, lon: t.lon, ...own(t) }, { body: t.body, ...(t.iau ? iau(t.body, t.iau) : t), km: WIN, n: 94 }, ...pins(t)]),
    ...PINS.map(p => ({ body: p.body, lat: p.lat, lon: p.lon, km: WIN, n: 94 })),
    ...EARTH.flatMap(e => [{ body: 'earth', lat: e.lat, lon: e.lon, km: e.ext, n: 192 }, { body: 'earth', lat: e.lat, lon: e.lon, km: WIN, n: 94 }]),
    ...cells.map(([lat, lon]) => ({ body: 'earth', lat, lon, km: WIN, n: 94 })),
    { body: 'moon', lat: -90, lon: 0, km: capKm, n: capKm + 1 },
  ].map(({ body, lat, lon, km, n }) => ({ body, lat, lon, km, n }));

  // patches/ holds exactly the manifest's: emptied first, so a patch no longer listed leaves no file behind.
  rmSync(new URL('patches/', SITEDIR), { recursive: true, force: true });
  mkdirSync(new URL('crops/', SITEDIR), { recursive: true }); mkdirSync(new URL('patches/', SITEDIR), { recursive: true });
  const out = [];
  for (const p of patches) {
    const z = await memo(`patch2 ${JSON.stringify(p)}`, () => patchHeights(p));
    let lo = Infinity, hi = -Infinity; for (const v of z) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (lo === Infinity) throw new Error(`no data for patch ${JSON.stringify(p)}`);
    const holes = z.filter(v => !Number.isFinite(v)).length;
    if (holes > z.length * .02) throw new Error(`patch ${JSON.stringify(p)}: ${holes} samples without data`);
    lo = Math.floor(lo * 10) / 10; hi = Math.max(lo + .1, Math.ceil(hi * 10) / 10);
    // shortcut: the few samples without data (at most 2 %) take the patch's lowest height, as the engine's windows do in the app.
    const u16 = Uint16Array.from(z, v => Number.isFinite(v) ? Math.round((v - lo) / (hi - lo) * 65535) : 0);
    // One file per patch, named by what it covers, so a deep link loads only the patches its views read (src/terrain/dem.ts).
    const pf = `patches/${p.body}-${createHash('sha1').update(JSON.stringify(p)).digest('hex').slice(0, 10)}.bin`;
    writeFileSync(new URL(pf, SITEDIR), new Uint8Array(u16.buffer));
    out.push({ ...p, min: lo, max: hi, src: sourceOf(p), file: pf });
    console.log(`  ${p.body} ${p.lat},${p.lon} ${p.km} km ${p.n}²: ${lo.toFixed(0)} to ${hi.toFixed(0)} m${holes ? `, ${holes} holes` : ''}`);
  }
  const crops = [];
  // The mock's Earth cells too (a double's booking listing shows them), keyed as the app finds them: at its Earth pin's
  // 4 dp centre (src/coords.ts pinId) and the compare window's width (src/data/pins.ts).
  const cellSites = cells.map(([la, lo]) => { const lat = +la.toFixed(4), lon = +lo.toFixed(4);
    return { body: 'earth', id: `cell-${lat}_${lon}`.replace(/\./g, 'p'), lat, lon, ext: WIN }; });
  for (const t of [...TARGETS, ...EARTH.map(e => ({ ...e, body: 'earth' })), ...cellSites]) for (const km of [t.ext * 12, t.ext * 3.5]) crops.push(await retry(() => crop(t, km, 240)));   // context and regional (src/ui/panel.ts strip)
  crops.push(...await drapes());
  writeFileSync(new URL('manifest.json', SITEDIR), JSON.stringify({ credits: CREDIT, provenance: provenance(SITE_SOURCES, FETCHED), patches: out, crops }, null, 1) + '\n');
  console.log(`  patches/ ${(out.reduce((s, p) => s + p.n * p.n * 2, 0) / 1024).toFixed(0)} KB, ${out.length} patches; ${crops.length} crops`);
}

// An orbital crop km wide round a site's centre, S px a side, in the app's site projection (row 0 north): Mars from the
// Viking MDIM 2.1 mosaic at the overview its pixels need, the Moon from LROC WAC (its south polar mosaic past 60° S),
// Earth from Landsat WELD with its gaps from Blue Marble. Written to crops/, listed as the manifest lists it.
async function crop(t, km, S) {
  const file = `crops/${t.body}-${t.id}-${String(+km.toFixed(1)).replace('.', '_')}.jpg`, k = 2, pts = grid(t.body, t.lat, t.lon, km, S, k);
  let rgb, from = t.body === 'mars' ? 'mdim' : t.lat < -60 ? 'wacPole' : 'wac';
  if (t.body === 'mars') {
    const pxDeg = km / S / (RADIUS.mars * D2R), level = Math.max(0, Math.floor(Math.log2(pxDeg * 256 / 2)));
    const bands = await sampleAll(await cog(SRC.mdim, level), pts);
    const avg = [0, 1, 2].map(c => average(bands[c], S, k));
    if (!marsGrade.fit) marsGrade(await mdimOverview(await cog(SRC.mdim, 4)));
    rgb = (i, c) => marsGrade.fit[c](avg[c][i]);
  } else if (t.body === 'earth') {
    // Landsat WELD's 1999 composite (30 m; 2000's has dark scene stripes over Atacama and Holuhraun). Specks of gap
    // filled from Blue Marble Next Generation (500 m; WELD's colours are premultiplied, a gap black, so the fill adds
    // it by what alpha leaves); a crop with more (open sea, Svalbard, Antarctica: the two seas differ, a seam shows)
    // is Blue Marble's.
    const weld = await sampleAll(await gibsBox('Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual', '1999-12-01', pts, km), pts);
    const gap = weld[3].filter(a => !(a > 127)).length / pts.length;
    let bands = weld; from = 'weld';
    if (weld[3].some(a => a < 255)) {
      const bm = await sampleAll(await gibsBox('BlueMarble_NextGeneration', '', pts, km), pts);
      bands = gap > .01 ? bm : [0, 1, 2].map(c => weld[c].map((v, j) => v + bm[c][j] * (1 - weld[3][j] / 255)));
      from = gap > .01 ? 'bmng500' : 'weldBmng';
    }
    const avg = [0, 1, 2].map(c => average(bands[c], S, k));
    rgb = (i, c) => avg[c][i];
    console.log(`  ${t.id} ${km} km: WELD gap ${(gap * 100).toFixed(1)} %, ${from}`);
  } else {
    await wacGrey();
    const s = from === 'wacPole' ? await wacPole() : await src('wac64', () => pds(SRC.wac64)), f = from === 'wacPole' ? s.tone : wacStretch;
    const avg = average((await sampleAll(s, pts))[0], S, k);
    rgb = (i, c) => f(avg[i]) * TINT[c];
  }
  const px = Uint8Array.from({ length: S * S * 3 }, (_, i) => Math.min(255, Math.max(0, Math.round(rgb(Math.floor(i / 3), i % 3)))) || 0);
  const buf = await sharp(Buffer.from(px), { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  writeFileSync(new URL(file, SITEDIR), buf);
  console.log(`  ${file} ${(buf.length / 1024).toFixed(0)} KB`);
  return { body: t.body, lat: t.lat, lon: t.lon, km, file, src: from };
}
// The orbital image the site view drapes over its block (src/terrain/mesh.ts): exactly its extent, 360 px, for the sites
// whose terrain is real (the featured targets on the demo path and the established Earth sites).
const drapes = () => pool([...TARGETS, ...EARTH.map(e => ({ ...e, body: 'earth' }))], 1, t => crop(t, t.ext, 360));
// --only=drape: the drapes alone, into the manifest as it stands (sitesData writes them with the rest).
async function drapeOnly() {
  const m = JSON.parse(readFileSync(new URL('manifest.json', SITEDIR), 'utf8')), d = await drapes(), files = new Set(d.map(c => c.file));
  m.crops = [...m.crops.filter(c => !files.has(c.file)), ...d]; m.provenance = provenance(SITE_SOURCES, FETCHED);
  writeFileSync(new URL('manifest.json', SITEDIR), JSON.stringify(m, null, 1) + '\n');
}

// The Moon globe's south polar cap (src/coords.ts llToCap: stereographic to 75° S, the planet shader blends it in from
// 76° S): the LROC WAC south polar mosaic, toned to moon.jpg's grey levels where both show the ground (75.5–78° S), and
// the LOLA polar DEM's slopes (LDEM_16 past its 75° S edge) baked as a normal map: R and G the slope (m/m, ±1 over
// 0–255) along the cap's +x and +z (image up), so the shader needs no height differences (8-bit heights band at 1 km).
const MOON_LON0 = -180;   // src/data/bodies.ts BODIES.moon.lon0
async function moonCap() {
  console.log('Moon south polar cap');
  const N = 1024, k = 2, R = RADIUS.moon * 1000, step = 2 / N;
  // k × k points per pixel (as grid()), over N + 2 pixels a side so every pixel has its four neighbours.
  const M = N + 2, pts = [];
  for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) for (let b = 0; b < k; b++) for (let a = 0; a < k; a++)
    pts.push(capToLL(-1 + (i + (a + .5) / k) * step, 1 - (j + (b + .5) / k) * step, MOON_LON0));
  const [lz] = await sampleAll(await lolaPole(), pts), [gz] = await sampleAll(await ldem16(), pts);
  const h = average(Float32Array.from(lz, (v, n) => Number.isFinite(v) ? v * 1000 : gz[n]), M, k);
  const [wz] = await sampleAll(await wacPole(), pts), wac = average(wz, M, k);
  // The globe's grey where the cap blends in: percentile match of the mosaic's values to moon.jpg's (its green, TINT 1).
  const g = await sharp(readFileSync(new URL('moon.jpg', TEXDIR))).extractChannel(1).raw().toBuffer({ resolveWithObject: true });
  const ring = [[], []];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [lat, lon] = capToLL(-1 + (i + .5) * step, 1 - (j + .5) * step, MOON_LON0), v = wac[(j + 1) * M + i + 1];
    if (lat < -78 || lat > -75.5 || !Number.isFinite(v)) continue;
    const x = Math.floor(((lon - MOON_LON0) % 360 + 360) % 360 / 360 * g.info.width), y = Math.floor((90 - lat) / 180 * g.info.height);
    ring[0].push(v); ring[1].push(g.data[y * g.info.width + x]);
  }
  const Q = ring.map(r => { r.sort((p, q) => p - q); return Array.from({ length: 21 }, (_, n) => r[Math.round(n / 20 * (r.length - 1))]); });
  const tone = v => { if (!Number.isFinite(v)) return 0; let n = 1; while (n < 20 && v > Q[0][n]) n++;
    return Q[1][n - 1] + (v - Q[0][n - 1]) / Math.max(1e-9, Q[0][n] - Q[0][n - 1]) * (Q[1][n] - Q[1][n - 1]); };
  const rgb = new Uint8Array(N * N * 3), nrm = new Uint8Array(N * N * 3), enc = s => Math.round(127.5 + 127.5 * Math.max(-1, Math.min(1, s)));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = (j + 1) * M + i + 1, o = (j * N + i) * 3, X = (-1 + (i + .5) * step) * CAP_S, Z = (1 - (j + .5) * step) * CAP_S;
    const px = 2 * R * step * CAP_S / (1 + X * X + Z * Z);   // a pixel's ground size: the stereographic scale 2 / (1 + X² + Z²)
    for (let ch = 0; ch < 3; ch++) rgb[o + ch] = Math.min(255, Math.max(0, Math.round(tone(wac[c]) * TINT[ch])));
    nrm[o] = enc((h[c + 1] - h[c - 1]) / (2 * px)); nrm[o + 1] = enc((h[c - M] - h[c + M]) / (2 * px)); nrm[o + 2] = 255;
  }
  await writeJpeg('moon_cap', sharp(Buffer.from(rgb), { raw: { width: N, height: N, channels: 3 } }));
  await writeJpeg('moon_cap_normal', sharp(Buffer.from(nrm), { raw: { width: N, height: N, channels: 3 } }), 92);
}

// The surface photographs: each at the library's largest web size (else its original), cut square around its crop and
// written 320 px a side, about three times the width the strip shows it at.
async function photos() {
  console.log('Surface photos'); mkdirSync(PHOTODIR, { recursive: true });
  for (const [key, p] of Object.entries(PHOTOS)) {
    const list = JSON.parse(await file(`https://images-assets.nasa.gov/image/${p.id}/collection.json`));
    const url = ['large', 'medium', 'orig'].map(k => list.find(u => u.endsWith(`~${k}.jpg`))).find(Boolean);
    if (!url) throw new Error(`${p.id}: no JPEG in the library`);
    const img = await sharp(await file(url.replace(/^http:/, 'https:'))).rotate().toBuffer(), { width: w, height: h } = await sharp(img).metadata();
    const [cx, cy, f] = p.crop, side = Math.round(Math.min(w, h) * f);
    const left = clamp(Math.round(cx * w - side / 2), 0, w - side), top = clamp(Math.round(cy * h - side / 2), 0, h - side);
    const buf = await sharp(img).extract({ left, top, width: side, height: side }).resize(320, 320).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    writeFileSync(new URL(`${key}.jpg`, PHOTODIR), buf);
    console.log(`  ${key}.jpg from ${url.split('/').pop()} (${w}×${h}), ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

// Beyond's spacecraft images: cut 16:9 around their world, grey, 320 × 180; local contrast lifted (CLAHE) and the
// world's own tones stretched from its 2nd to 99.5th percentile, so the page's dots (about 100 across a card) show its
// craters, clouds and dunes rather than an even disc. Black past the image's edges stays black.
async function beyond() {
  console.log('Beyond');
  for (const [key, p] of Object.entries(BEYOND)) {
    const list = JSON.parse(await file(`https://images-assets.nasa.gov/image/${p.id}/collection.json`));
    const url = ['large', 'medium', 'orig'].map(k => list.find(u => u.endsWith(`~${k}.jpg`))).find(Boolean);
    if (!url) throw new Error(`${p.id}: no JPEG in the library`);
    let img = await sharp(await file(url.replace(/^http:/, 'https:'))).rotate().greyscale().toBuffer();
    if (p.part) { const m = await sharp(img).metadata(), [x0, y0, x1, y1] = p.part;
      img = await sharp(img).extract({ left: Math.round(x0 * m.width), top: Math.round(y0 * m.height), width: Math.round((x1 - x0) * m.width), height: Math.round((y1 - y0) * m.height) }).toBuffer(); }
    const { width: w, height: h } = await sharp(img).metadata(), [cx, cy, f] = p.crop, H = Math.round(h * f), W = Math.round(H * 16 / 9);
    const pad = await sharp(img).extend({ top: H, bottom: H, left: W, right: W, background: '#000' }).toBuffer();   // extract runs before extend in one pipeline
    const g = await sharp(pad).extract({ left: Math.round(cx * w - W / 2) + W, top: Math.round(cy * h - H / 2) + H, width: W, height: H })
      .resize(320, 180).clahe({ width: 20, height: 20, maxSlope: 3 }).extractChannel(0).raw().toBuffer();
    const lit = Uint8Array.from(g).filter(v => v > 24).sort(), lo = lit[Math.floor(lit.length * .02)], hi = lit[Math.floor(lit.length * .995)];
    await writeJpeg(key, grey(Uint8Array.from(g, v => Math.round(Math.min(255, Math.max(0, (v - lo) / (hi - lo) * 255)))), 320, 180), 88);
  }
}

if (!only || only === 'globes') { console.log('Globes'); await globes(); }
if (!only || only === 'globes' || only === 'cap') { await moonCap(); writeFileSync(new URL('manifest.json', TEXDIR), JSON.stringify(manifest, null, 2) + '\n'); }
if (!only || only === 'sites') { console.log('Sites'); mkdirSync(SITEDIR, { recursive: true }); await sitesData(); }
if (only === 'drape') { console.log('Drapes'); await drapeOnly(); }
if (only === 'clouds') { console.log('Clouds'); await clouds(); writeFileSync(new URL('manifest.json', TEXDIR), JSON.stringify(manifest, null, 2) + '\n'); }
if (only === 'normals') { console.log('Normal maps'); await normals(); writeFileSync(new URL('manifest.json', TEXDIR), JSON.stringify(manifest, null, 2) + '\n'); }
if (!only || only === 'photos') await photos();
if (!only || only === 'beyond') { await beyond(); writeFileSync(new URL('manifest.json', TEXDIR), JSON.stringify(manifest, null, 2) + '\n'); }
// The textures' provenance after any step that wrote them; --only=provenance also rewrites the site manifest's.
if (!only || ['globes', 'cap', 'clouds', 'normals', 'photos', 'beyond', 'provenance'].includes(only))
  writeFileSync(new URL('provenance.json', TEXDIR), JSON.stringify(provenance(GLOBE_SOURCES, FETCHED_GLOBES), null, 1) + '\n');
if (only === 'provenance') {
  const m = JSON.parse(readFileSync(new URL('manifest.json', SITEDIR), 'utf8'));
  writeFileSync(new URL('manifest.json', SITEDIR), JSON.stringify({ credits: m.credits, provenance: provenance(SITE_SOURCES, FETCHED), patches: m.patches, crops: m.crops }, null, 1) + '\n');
  console.log(`provenance: sites/manifest.json fetched ${FETCHED}, textures/provenance.json fetched ${FETCHED_GLOBES}`);
}
