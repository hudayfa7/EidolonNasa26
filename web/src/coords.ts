// Coordinate conventions, formatters and the coordinate parser, ported verbatim from reference/eidolon.html
// (lines 528–530, 559, 581–638; inline route/HUD formatters from 882–883, 1608, 1776, 2155, 2166).
// Behaviour is pinned by coords.test.ts; candidate fixes are logged in docs/progress.md (fix 2, hemisphere after
// rounding, applied in round 2). The site
// projection (llToLocal/localToLL) is new: it replaced the prototype's siteSpan in the polar-sites fix.

export type Body = 'earth' | 'moon' | 'mars';

export const D2R = Math.PI / 180;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const wrap180 = (x: number) => ((x % 360) + 540) % 360 - 180;
// Lives here rather than astro.ts so coords and astro don't import each other.
export const pad = (n: number) => String(n).padStart(2, '0');
// Deterministic numbers in [0, 1) seeded by a string (mulberry32 on an FNV-1a hash): the mock data's only randomness.
export function rng(key: string) {
  let s = [...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Longitude conventions: Mars uses planetocentric east longitude, 0–360°E (Mars 2000 / MOLA).
// The Moon and Earth use ±180° with E/W. Input accepts either form for any body.
export const lon360 = (lon: number) => ((lon % 360) + 360) % 360;
export const EAST360 = (b?: Body) => b === 'mars';
export const DATUM: Record<Body, string> = { mars:'Mars 2000, planetocentric', moon:'Mean Earth/polar axis, planetocentric', earth:'WGS 84' };
// S or W only when the value as written isn't zero: round first, then pick the hemisphere (-0.00001 is 0.00° N).
const neg = (v: number, written: string) => v < 0 && /[1-9]/.test(written);
export const latStr = (lat: number, d: number) => { const s = Math.abs(lat).toFixed(d); return `${s}° ${neg(lat, s) ? 'S' : 'N'}`; };
export const lonStr = (lon: number, d: number, b: Body) => { if (EAST360(b)) return `${lon360(lon).toFixed(d)}° E`; const L = wrap180(lon), s = Math.abs(L).toFixed(d); return `${s}° ${neg(L, s) ? 'W' : 'E'}`; };
export const fmtLL = (lat: number, lon: number, b: Body, d = 2) => `${latStr(lat, d)}, ${lonStr(lon, d, b)}`;
export const hudLL = (lat: number, lon: number, b?: Body, d = 1) => {
  const a = Math.abs(lat).toFixed(d), la = `${a.padStart(d + 3, '0')}${neg(lat, a) ? 'S' : 'N'}`;
  if (EAST360(b)) return `${la} ${lon360(lon).toFixed(d).padStart(d + 4, '0')}E`;
  const L = wrap180(lon), o = Math.abs(L).toFixed(d); return `${la} ${o.padStart(d + 4, '0')}${neg(L, o) ? 'W' : 'E'}`;
};
export const dmsOf = (v: number) => { const a = Math.abs(v); let d = Math.floor(a), m = Math.floor((a - d) * 60), sc = Math.round(((a - d) * 60 - m) * 60); if (sc === 60) { sc = 0; m++; } if (m === 60) { m = 0; d++; } return `${d}°${pad(m)}′${pad(sc)}″`; };
export const fmtDMS = (lat: number, lon: number, b: Body) => { const L = EAST360(b) ? lon360(lon) : wrap180(lon), a = dmsOf(lat), o = dmsOf(L); return `${a} ${neg(lat, a) ? 'S' : 'N'}, ${o} ${neg(L, o) ? 'W' : 'E'}`; };
export const lonTick = (lon: number, b: Body) => { if (EAST360(b)) return `${Math.round(lon360(lon))}°E`; const L = Math.round(wrap180(lon)); return L === 0 || Math.abs(L) === 180 ? `${Math.abs(L)}°` : `${Math.abs(L)}°${L < 0 ? 'W' : 'E'}`; };
export const latTick = (lat: number) => lat === 0 ? '0°' : `${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}`;
/** Meridian labels every k-th grid step, k dividing the ring, so labels `gap` px apart sit about 56 px apart; 0 for
 *  none when even every sixth would crowd (a parallel tiny on screen, round a pole). */
export function lonStride(gap: number, step: number) {
  let k = Math.ceil(56 / Math.max(1, gap));
  if (k > 6) return 0;
  while ((360 / step) % k) k++;
  return k <= 6 ? k : 0;
}
// Longitude tape label at a major tick (prototype line 2166, inline in hud()).
export const tapeLabel = (d: number, b: Body) => EAST360(b) ? String(Math.round(lon360(d))).padStart(3, '0') + 'E' : String(Math.abs(wrap180(d))).padStart(3, '0') + (wrap180(d) < 0 ? 'W' : 'E');
// Sun elevation readouts: the HUD's (2155) and the intro telemetry's (1608) differ; see progress.md candidate fixes.
export const hudElev = (el: number) => `${el >= 0 ? '+' : ''}${el.toFixed(1)}°`;
export const introElev = (se: number) => `${se < -.05 ? '−' : ''}${Math.abs(se).toFixed(1)}°`;

type ParsedCoord = { empty: true } | { err: string } | { lat: number; lon: number };
type Group = { n: number[]; neg: boolean; h: string | null };

// Accepts decimal or degrees-minutes-seconds, signed or with N/S/E/W, in either order.
// "18.38, 77.58" · "18.38N 77.58E" · "N18.38 E77.58" · "18°22'48\"N 77°34'48\"E" · "-86, 0" · "47.2N 184.3E"
export function parseCoord(str: string): ParsedCoord {
  const t = String(str).trim().toUpperCase().replace(/[′’‘`´]/g, "'").replace(/[″”“]/g, '"').replace(/''/g, '"').replace(/[º˚]/g, '°').replace(/DEG/g, '°');
  if (!t) return { empty:true };
  const TOK = /[+\-−]?\d+(?:\.\d+)?\s*[°'"]?|[NSEW]|[,;\/]/g;
  const stray = t.replace(TOK, '').replace(/\s+/g, '');
  if (stray) return { err:`Unrecognised “${stray[0]}”. Use numbers, °′″ and N, S, E or W.` };
  const toks = t.match(TOK) || [], prefix = /^[NSEW]$/.test(toks[0] || ''), groups: Group[] = []; let cur: Group | null = null;
  const close = () => { if (cur && cur.n.length) groups.push(cur); cur = null; };
  for (const k of toks) {
    if (/^[,;\/]$/.test(k)) { close(); continue; }
    if (/^[NSEW]$/.test(k)) {
      if (prefix) { close(); cur = { n:[], neg:false, h:k }; }
      else { if (!cur || !cur.n.length) return { err:'Put N, S, E or W after each value, or before both.' }; cur.h = k; close(); }
      continue;
    }
    const raw = k.replace('−', '-').replace(/\s/g, ''), u = raw.slice(-1), v = Math.abs(parseFloat(raw)), neg = raw[0] === '-';
    if (cur && u === "'" && cur.n.length === 1) { cur.n.push(v); continue; }
    if (cur && u === '"' && cur.n.length === 2) { cur.n.push(v); continue; }
    if (u === "'" || u === '"') return { err:'Minutes and seconds need a degree value first.' };
    if (cur && cur.n.length) close();
    if (!cur) cur = { n:[], neg:false, h:null };
    cur.n.push(v); cur.neg = neg;
  }
  close();
  if (groups.length !== 2) return { err:groups.length < 2 ? 'Enter a latitude and a longitude.' : 'Too many values. Enter one latitude and one longitude.' };
  for (const g of groups) { if ((g.n[1] || 0) >= 60 || (g.n[2] || 0) >= 60) return { err:'Minutes and seconds must be under 60.' }; if (g.neg && g.h) return { err:'Use a minus sign or a hemisphere letter, not both.' }; }
  const val = (g: Group) => { const a = g.n[0] + (g.n[1] || 0) / 60 + (g.n[2] || 0) / 3600; return (g.neg || g.h === 'S' || g.h === 'W') ? -a : a; };
  let [A, B] = groups; const ew = (h: string | null) => h === 'E' || h === 'W', ns = (h: string | null) => h === 'N' || h === 'S';
  if (ew(A.h) || ns(B.h)) [A, B] = [B, A];
  if ((A.h && !ns(A.h)) || (B.h && !ew(B.h))) return { err:'Give one N/S latitude and one E/W longitude.' };
  const lat = val(A), lon = val(B);
  if (Math.abs(lat) > 90) return { err:'Latitude must be between 90° S and 90° N.' };
  if (lon < -180 || lon > 360) return { err:'Longitude must be between 180° W and 360° E.' };
  return { lat, lon:wrap180(lon) };
}

// Route id of a pinned site, e.g. "@18.3800,77.5800" (prototype 1776, 1832; the globe click at 1965 used 3 dp).
export const pinId = (lat: number, lon: number) => `@${lat.toFixed(4)},${lon.toFixed(4)}`;
// Inverse of pinId, from customSite (882–883): null when the id isn't a pin.
export function parsePinId(id: string): { lat: number; lon: number } | null {
  const m = id.match(/^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/); if (!m) return null;
  return { lat:clamp(+m[1], -89.5, 89.5), lon:wrap180(+m[2]) };
}

// A site's local map projection: azimuthal equidistant, centred on (lat0, lon0), on a sphere of radius R km; x is km
// east, y km north. Distance and bearing from the centre are true at any latitude (the prototype's siteSpan stretched
// longitude by 1/cos(lat), which broke polar sites). At a pole, north is the lon0 meridian.
export function llToLocal(R: number, lat0: number, lon0: number, lat: number, lon: number): [number, number] {
  const p0 = lat0 * D2R, p = lat * D2R, dl = (lon - lon0) * D2R;
  const x = Math.cos(p) * Math.sin(dl), y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl);
  const s = Math.hypot(x, y), c = Math.atan2(s, Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl));
  const k = s < 1e-15 ? R : R * c / s;
  return [x * k, y * k];
}
export function localToLL(R: number, lat0: number, lon0: number, x: number, y: number): [number, number] {
  const p0 = lat0 * D2R, rho = Math.hypot(x, y); if (rho < 1e-12) return [lat0, wrap180(lon0)];
  const c = rho / R, sc = Math.sin(c), cc = Math.cos(c);
  const lat = Math.asin(clamp(cc * Math.sin(p0) + y * sc * Math.cos(p0) / rho, -1, 1));
  return [lat / D2R, wrap180(lon0 + Math.atan2(x * sc, rho * Math.cos(p0) * cc - y * Math.sin(p0) * sc) / D2R)];
}
// The Moon globe's south polar cap (plan, Rendering "Poles"): a stereographic projection of the body's unit sphere
// from its north pole, in the frame of scene/bodies.ts localDir (x, y up, z), scaled so ±1 reaches CAP_LAT. The planet
// shader samples the cap from its object-space normal; scripts/fetch-real-data.mjs writes the cap's images.
export const CAP_LAT = -75, CAP_S = Math.cos(CAP_LAT * D2R) / (1 - Math.sin(CAP_LAT * D2R));
export function llToCap(lat: number, lon: number, lon0: number): [number, number] {
  const ph = lon360(lon - lon0) * D2R, la = lat * D2R, k = Math.cos(la) / (1 - Math.sin(la)) / CAP_S;
  return [-Math.cos(ph) * k, Math.sin(ph) * k];
}
export function capToLL(qx: number, qz: number, lon0: number): [number, number] {
  const X = qx * CAP_S, Z = qz * CAP_S, s = X * X + Z * Z;
  return [Math.asin((s - 1) / (s + 1)) / D2R, wrap180(Math.atan2(Z, -X) / D2R + lon0)];
}
/** An azimuth (degrees clockwise from north) as one of eight compass words. */
/** How far (km) and which way a point lies from another, on a sphere of radius R km: true distance and bearing. */
export function offsetOf(R: number, lat0: number, lon0: number, lat: number, lon: number) {
  const [x, y] = llToLocal(R, lat0, lon0, lat, lon);
  return { km: Math.hypot(x, y), dir: compass(Math.atan2(x, y) / D2R) };
}
export const compass = (az: number) => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round((((az % 360) + 360) % 360) / 45) % 8];
export const fmtM = (x: number) => `${x < 0 ? '−' : ''}${Math.abs(Math.round(x)).toLocaleString('en-GB')} m`;
export const fmtKm = (x: number) => `${Math.round(x).toLocaleString('en-GB')} km`;
/** A named feature's size: metres under 0.1 km (a landing site's IAU point, 9 m), then to 0.1 km under 10, then whole km. */
export const fmtSize = (d: number) => d < .1 ? `${Math.max(1, Math.round(d * 1000))} m` : d < 10 ? `${d.toFixed(1)} km` : fmtKm(d);
/**
 * The search's bbox, [lon_min, lat_min, lon_max, lat_max] (spec §3.5), around the points seen of the Earth globe, `c`
 * the one at the view's centre; a pole in view takes every longitude from the pole down. Rounded outward to 0.01°.
 * shortcut: the engine's bbox can't cross the antimeridian (engine.py mask), so a view across it is cut at ±180°.
 */
export function areaOf(c: { lat: number; lon: number }, pts: { lat: number; lon: number }[], north: boolean, south: boolean): [number, number, number, number] {
  let la0 = c.lat, la1 = c.lat, d0 = 0, d1 = 0;
  for (const p of pts) { const d = wrap180(p.lon - c.lon); la0 = Math.min(la0, p.lat); la1 = Math.max(la1, p.lat); d0 = Math.min(d0, d); d1 = Math.max(d1, d); }
  const pole = north || south, dn = (x: number) => Math.floor(x * 100) / 100, up = (x: number) => Math.ceil(x * 100) / 100;
  return [pole ? -180 : Math.max(-180, dn(c.lon + d0)), south ? -90 : dn(la0), pole ? 180 : Math.min(180, up(c.lon + d1)), north ? 90 : up(la1)];
}
