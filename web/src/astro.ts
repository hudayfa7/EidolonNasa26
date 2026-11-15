// JPL orbital elements, light time, Mars time and the subsolar point, ported verbatim from reference/eidolon.html
// (538–580; inline HUD/status formatters from 2156 and 2172). Dropped as dead code (plan, Porting): the mercury,
// venus and jupiter elements and the europa/mercury/venus branches, which only bodies outside the globe views used.
import { clamp, D2R, pad, wrap180, type Body } from './coords';

// JPL approximate Keplerian elements (1800–2050): [a, e, I, L, long. perihelion, long. node] and their rates per century.
const EL: Record<'earth' | 'mars', number[][]> = {
  earth:[[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0],[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0]],
  mars:[[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]],
};
export const jd = (d: Date) => d.getTime() / 86400000 + 2440587.5;
export function helio(p: 'earth' | 'mars', T: number): [number, number, number] {
  const [e0, r] = EL[p];
  const a = e0[0] + r[0]*T, e = e0[1] + r[1]*T, I = (e0[2] + r[2]*T) * D2R, L = e0[3] + r[3]*T, wb = e0[4] + r[4]*T, Om = e0[5] + r[5]*T;
  const w = (wb - Om) * D2R, O = Om * D2R, M = ((((L - wb) % 360) + 540) % 360 - 180) * D2R;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - e*Math.sin(E) - M) / (1 - e*Math.cos(E));
  const xp = a*(Math.cos(E) - e), yp = a*Math.sqrt(1 - e*e)*Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return [(cw*cO - sw*sO*cI)*xp + (-sw*cO - cw*sO*cI)*yp, (cw*sO + sw*cO*cI)*xp + (-sw*sO + cw*cO*cI)*yp, sw*sI*xp + cw*sI*yp];
}
export function rangeAU(p: 'mars', d: Date) { const T = (jd(d) - 2451545) / 36525, a = helio('earth', T), b = helio(p, T); return Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]); }
export function marsTime(d: Date) { const msd = (jd(d) + 69.184/86400 - 2405522.0028779) / 1.0274912517; return { msd, mtc:(((msd % 1) + 1) % 1) * 24 }; }
export function hms(h: number) { const s = Math.floor((((h % 24) + 24) % 24) * 3600); return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60) % 60)}:${pad(s % 60)}`; }
export const lmst = (lon: number, d: Date) => hms(marsTime(d).mtc + lon / 15).slice(0, 5);
export function fmtLight(sec: number) { if (sec < 60) return `${sec.toFixed(2)} s`; const t = Math.round(sec); return `${Math.floor(t/60)} m ${pad(t % 60)} s`; }
// shortcut: d defaults to the wall clock as in the prototype; the port passes simNow() so capture mode stays deterministic.
export function lightInfo(id: Body, d = new Date()) {
  if (id === 'earth') return null;
  if (id === 'moon') return { sec:1.282, range:'384,400 km' };
  const au = rangeAU(id, d);
  return { sec:au * 499.004784, range:`${au.toFixed(2)} AU` };
}
// Mars areocentric solar longitude Ls, degrees (Allison & McEwen 2000, the Mars24 algorithm steps B-1 to B-5; its
// planetary perturbation terms, under .03°, are left out).
export function marsLs(d: Date) {
  const t = jd(d) + 69.184 / 86400 - 2451545, M = (19.3871 + .52402073 * t) * D2R;
  const eoc = (10.691 + 3e-7 * t) * Math.sin(M) + .623 * Math.sin(2 * M) + .05 * Math.sin(3 * M) + .005 * Math.sin(4 * M) + .0005 * Math.sin(5 * M);
  return (((270.3871 + .524038496 * t + eoc) % 360) + 360) % 360;
}
// The Moon's subsolar latitude, the Sun's selenographic latitude b0 (Meeus, Astronomical Algorithms ch. 53, without its
// libration terms): the lunar equator sits 1.543° off the ecliptic with its node on the orbit's (Cassini's laws), so b0
// swings ±1.54° over a draconic year (346.6 days). It decides which polar slopes and crater floors the sun reaches.
export function moonSunLat(d: Date) {
  const T = (jd(d) - 2451545) / 36525, M = (357.52911 + 35999.05029 * T) * D2R;
  const ls = 280.46646 + 36000.76983 * T + (1.914602 - .004817 * T) * Math.sin(M) + .019993 * Math.sin(2 * M);   // the Sun's true longitude (Meeus 25)
  const om = 125.04452 - 1934.136261 * T;   // the lunar orbit's mean ascending node (Meeus 47)
  return Math.asin(Math.sin(1.54242 * D2R) * Math.sin((ls - om) * D2R)) / D2R;
}
// Subsolar point per body. Mars: latitude from its season (obliquity 25.19°, so ±25.2° over a Mars year).
export function subsolar(id: Body, d: Date): [number, number] {
  const J = jd(d);
  if (id === 'earth') {
    const h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    const doy = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
    return [23.44 * Math.sin(2 * Math.PI * (284 + doy) / 365), wrap180(-15 * (h - 12))];
  }
  if (id === 'mars') return [Math.asin(Math.sin(25.19 * D2R) * Math.sin(marsLs(d) * D2R)) / D2R, wrap180((12 - marsTime(d).mtc) * 15)];
  const age = (((J - 2451550.26) / SOL.moon) % 1 + 1) % 1; return [moonSunLat(d), wrap180(180 - age * 360)];
}
/** The sun's azimuth at a surface point, degrees clockwise from north: the bearing from the point to the subsolar point
 *  (the sun at infinity), whether it is up or not. Lights the site's terrain and maps (terrain/mesh.ts sunOf). */
export function sunAzimuth(id: Body, lat: number, lon: number, d: Date) {
  const [sl, so] = subsolar(id, d), a = lat * D2R, b = sl * D2R, dl = (so - lon) * D2R;
  return (Math.atan2(Math.sin(dl) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(dl)) / D2R + 360) % 360;
}
/** The sun's height above the horizon at a surface point, degrees (the sun at infinity, the body a sphere). */
export function sunElevation(id: Body, lat: number, lon: number, d: Date) {
  const [sl, so] = subsolar(id, d), a = lat * D2R, b = sl * D2R;
  return Math.asin(clamp(Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos((so - lon) * D2R), -1, 1)) / D2R;   // rounding can step past ±1 under the sun or opposite it
}
/** A body's mean solar day, in Earth days: a sol, a lunation. */
export const SOL: Record<Body, number> = { earth: 1, mars: 1.0274912517, moon: 29.530588 };
/** Local mean solar time at longitude lon, hours 0–24: 12 under the sun (LMST on Mars). */
export const solarTime = (id: Body, lon: number, d: Date) => ((12 + wrap180(lon - subsolar(id, d)[1]) / 15) % 24 + 24) % 24;
/** The moment local solar time at lon is h (0–24) in the solar day, local midnight to midnight, that holds `day`: on
 *  Earth that place's own date when `day` is noon UTC; on the Moon up to a lunation (29.5 days) round it. */
export const atSolarTime = (id: Body, lon: number, day: Date, h: number) => new Date(day.getTime() + (h - solarTime(id, lon, day)) / 24 * SOL[id] * 864e5);
/** The date (YYYY-MM-DD) whose noon UTC falls in d's own solar day at lon: its local noon's UTC date, within half a day
 *  of that noon, so atSolarTime from it at d's solar time gives d back (the UTC date of d itself can be a day off). */
export const solarDate = (id: Body, lon: number, d: Date) => new Date(d.getTime() + (12 - solarTime(id, lon, d)) / 24 * SOL[id] * 864e5).toISOString().slice(0, 10);
// HUD local time under the cursor (2156): LMST on Mars, UTC-offset clock on Earth, sun-relative clock on the Moon.
// slo is the subsolar longitude from subsolar(body, sim).
export const hudLocalTime = (body: Body, lon: number, sim: Date, slo: number) => body === 'mars' ? `LMST ${lmst(lon, sim)}` : body === 'earth' ? hms(sim.getUTCHours() + sim.getUTCMinutes() / 60 + lon / 15).slice(0, 5) : hms(12 + wrap180(lon - slo) / 15).slice(0, 5);
// Status-bar sim clock (2172): "MM/DD HH:MM" in UTC.
export const utcStamp = (now: Date) => `${now.toISOString().slice(5, 10).replace('-', '/')} ${now.toISOString().slice(11, 16)}`;
