// A place's weather (docs/plan.md, Should: weather window; frontend-owned in both data modes, never the engine's): the
// Open-Meteo forecast for its days and NASA POWER's monthly climatology for its best months, both fetched from the
// browser (no key; both send CORS headers), once per place, and kept. Each test purpose sets limits on a day (LIMITS);
// a day under all of them is a go. Seeded sample days stand in when the forecast can't be had, and under ?capture, which
// must stay deterministic: no live network there unless ?wx=feed, for the harness to answer the feeds from recorded
// responses (scripts/fixtures/). The Earth site view shows a week, the booking flow's date picker two (ui/weather.ts).
import { rng } from '../coords';

/** A day's weather: its strongest wind at 10 m (m/s), rain (mm), high and low (°C). A value the feed lacks is NaN. */
export interface Day { iso: string; wind: number; rain: number; hi: number; lo: number }
export type Weather = Omit<Day, 'iso'>;
type Place = { id: string; lat: number; lon: number };

/**
 * The limits each test purpose sets on a day: wind below, rain up to, the low at or above and the high at or below.
 * Planning limits, not standards (docs/progress.md, Decisions 145, gives the reasoning). A purpose not here (one the
 * engine adds later) takes rover mobility's.
 */
export const LIMITS: Record<string, { wind: number; rain: number; lo: number; hi: number }> = {
  rover_mobility: { wind: 11, rain: 2, lo: -20, hi: 40 },
  drill_isru: { wind: 14, rain: 5, lo: -20, hi: 40 },
  eva_training: { wind: 9, rain: 1, lo: -10, hi: 32 },
  habitat_ops: { wind: 14, rain: 10, lo: -30, hi: 40 },
  astrobiology: { wind: 11, rain: 1, lo: -20, hi: 40 },
  thermal: { wind: 11, rain: 1, lo: -30, hi: 45 },
  education: { wind: 9, rain: 1, lo: 0, hi: 32 },
};
export const limitsOf = (purpose: string) => Object.hasOwn(LIMITS, purpose) ? LIMITS[purpose] : LIMITS.rover_mobility;
/** Which of the purpose's limits a day goes over (none: a go day). A value the feed lacks counts as over. */
export function over(d: Weather, purpose: string) {
  const L = limitsOf(purpose);
  return ([['wind', d.wind < L.wind], ['rain', d.rain <= L.rain], ['cold', d.lo >= L.lo], ['heat', d.hi <= L.hi]] as const).filter(([, ok]) => !ok).map(([k]) => k);
}

const DAY = 864e5;
export const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Open-Meteo's daily forecast (its JSON, a trust boundary) as days, with the place's UTC offset (s) its days are
 *  calendar days in; throws when it isn't one. */
export function parseForecast(j: unknown): { off: number; days: Day[] } {
  const o = j as { daily?: Record<string, unknown>; daily_units?: Record<string, unknown>; utc_offset_seconds?: unknown } | null, d = o?.daily, t = d?.time, off = o?.utc_offset_seconds;
  if (!Array.isArray(t) || !t.every(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x))) throw new Error('forecast: no days');
  if (o?.daily_units?.wind_speed_10m_max !== 'm/s') throw new Error('forecast: wind not in m/s');
  if (typeof off !== 'number' || !(Math.abs(off) <= 14 * 3600)) throw new Error('forecast: no UTC offset');
  const col = (k: string) => { const a = d![k]; if (!Array.isArray(a) || a.length !== t.length) throw new Error(`forecast: no ${k}`); return a.map(x => typeof x === 'number' ? x : NaN); };
  const [wind, rain, hi, lo] = ['wind_speed_10m_max', 'precipitation_sum', 'temperature_2m_max', 'temperature_2m_min'].map(col);
  return { off, days: t.map((iso: string, i) => ({ iso, wind: wind[i], rain: rain[i], hi: hi[i], lo: lo[i] })) };
}
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** NASA POWER's monthly climatology (its JSON) as each month's average day, January first: the mean wind and rain, the
 *  mean temperature less and plus half the mean daily range. Its fill value (−999) is a value it lacks. */
export function parseClimate(j: unknown): Weather[] {
  const P = (j as { properties?: { parameter?: Record<string, Record<string, unknown>> } } | null)?.properties?.parameter;
  if (!P || !['T2M', 'T2M_RANGE', 'PRECTOTCORR', 'WS10M'].every(k => P[k] && typeof P[k] === 'object')) throw new Error('climatology: no parameters');
  const v = (k: string, m: string) => { const x = P[k][m]; return typeof x === 'number' && x !== -999 ? x : NaN; };
  return MON.map(m => { const t = v('T2M', m), r = v('T2M_RANGE', m); return { wind: v('WS10M', m), rain: v('PRECTOTCORR', m), hi: t + r / 2, lo: t - r / 2 }; });
}

/** Seeded sample days for a place (its id the seed): the wind as the pre-feed sample drew it, rain and a latitude's
 *  temperatures beside it. Never a forecast: the UI says so. */
export function sampleDays(at: Place, isos: string[]): Day[] {
  let s = [...at.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7); const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const x = rng(`${at.id}|wx`);
  return isos.map(iso => {
    const wind = Math.round(3 + rnd() * 15), hi = Math.round(24 - .3 * Math.abs(at.lat) + 8 * (x() - .5));
    return { iso, wind, rain: x() < .7 ? 0 : Math.round(10 * (.5 + 12 * x() ** 2)) / 10, hi, lo: hi - Math.round(6 + 8 * x()) };
  });
}

/** A feed: its answer once landed (none when it failed), `busy` until then. */
interface Feed<T> { busy: boolean; v?: T; done: Promise<void> }
const FORECAST = 'https://api.open-meteo.com/v1/forecast', CLIMATE = 'https://power.larc.nasa.gov/api/temporal/climatology/point';
let landed = () => {};
/** Called whenever a feed lands (ui/panel.ts redraws the weather it shows). */
export const onWeather = (f: () => void) => { landed = f; };
function feed<T>(url: string, parse: (j: unknown) => T): Feed<T> {
  const f: Feed<T> = { busy: true, done: fetch(url, { signal: AbortSignal.timeout(10_000) })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))).then(j => { f.v = parse(j); })
    .catch((e: unknown) => console.warn('Eidolon: a weather feed failed, so its part shows as unavailable:', url, e))
    .finally(() => { f.busy = false; landed(); }) };
  return f;
}
const places = new Map<string, { fc: Feed<{ off: number; days: Day[] }>; cl: Feed<Weather[]> }>();
const off = { busy: false, done: Promise.resolve() };
// ?capture (motion.ts CAPTURE; read from the address here, so this module loads without a page) keeps the feeds off,
// unless ?wx=feed.
const live = () => { const u = location.href; return !/[?&]capture\b/.test(u) || /[?&]wx=feed\b/.test(u); };
/**
 * A place's two feeds, asked on first use (by coordinates to 0.01°, finer than either feed's grid) and kept: the
 * forecast's 16 days from today in the place's own time zone, and the climatology's months.
 * shortcut: kept for the session; a page left open for days keeps the first forecast (its days past it read as no
 * forecast). Ask again by date if sessions grow long.
 */
export function wxAt(at: Place) {
  const key = `${at.lat.toFixed(2)},${at.lon.toFixed(2)}`;
  let w = places.get(key);
  if (!w) {
    const q = `latitude=${at.lat}&longitude=${at.lon}`, on = live() && Number.isFinite(at.lat) && Number.isFinite(at.lon);
    w = on ? {
      fc: feed(`${FORECAST}?${q}&daily=wind_speed_10m_max,precipitation_sum,temperature_2m_max,temperature_2m_min&wind_speed_unit=ms&timezone=auto&forecast_days=16`, parseForecast),
      cl: feed(`${CLIMATE}?${q}&parameters=T2M,T2M_RANGE,PRECTOTCORR,WS10M&community=AG&format=JSON`, parseClimate),
    } : { fc: off, cl: off };
    places.set(key, w);
  }
  return w;
}

/** A place's Earth skin temperature from NASA POWER's climatology (TS, TS_MIN, TS_MAX, 2001–2025), °C: the mean, the mean
 *  daily minimum (the night-time surface) and the mean daily maximum. It is the surface the Diviner midnight temperature is
 *  of, where the engine's climate block is air temperature (docs/progress.md, Decision 205). */
export interface Skin { mean: number; min: number; max: number }
export function parseSkin(j: unknown): Skin {
  const P = (j as { properties?: { parameter?: Record<string, Record<string, unknown> | undefined> } } | null)?.properties?.parameter;
  const ann = (k: string) => { const x = P?.[k]?.ANN; if (typeof x !== 'number' || x === -999) throw new Error(`skin temperature: no ${k}`); return x; };
  return { mean: ann('TS'), min: ann('TS_MIN'), max: ann('TS_MAX') };
}
const skins = new Map<string, Feed<Skin>>();
/** A place's skin temperature, asked on first use (to 0.01°) and kept; not asked under ?capture, like the other feeds. */
export function skinAt(at: { lat: number; lon: number }): Feed<Skin> {
  const key = `${at.lat.toFixed(2)},${at.lon.toFixed(2)}`;
  let f = skins.get(key);
  if (!f) {
    f = live() && Number.isFinite(at.lat) && Number.isFinite(at.lon)
      ? feed(`${CLIMATE}?latitude=${at.lat}&longitude=${at.lon}&parameters=TS,TS_MIN,TS_MAX&community=AG&format=JSON`, parseSkin) : off;
    skins.set(key, f);
  }
  return f;
}

export type Src = 'loading' | 'forecast' | 'sample';
/** `n` days of a place's weather from `from` (ISO): the forecast's (a day past its reach without values), seeded sample
 *  days when there is no forecast, and while it loads the days without values. */
export function daysAt(at: Place, from: string, n: number): { src: Src; days: Day[] } {
  const f = wxAt(at).fc, t0 = Date.parse(`${from}T00:00:00Z`), isos = [...Array(n)].map((_, i) => isoDay(t0 + i * DAY));
  if (!f.busy && !f.v) return { src: 'sample', days: sampleDays(at, isos) };
  return { src: f.busy ? 'loading' : 'forecast', days: isos.map(iso => f.v?.days.find(d => d.iso === iso) ?? { iso, wind: NaN, rain: NaN, hi: NaN, lo: NaN }) };
}
/** Today at a place (ISO): its own calendar day once the forecast has given its UTC offset, the day the forecast starts
 *  on; UTC's until then and without one. */
export const todayAt = (at: Place, now: number) => isoDay(now + (wxAt(at).fc.v?.off ?? 0) * 1000);
/**
 * The months (1–12) whose typical day sits under the purpose's limits; undefined until (or unless) the climatology
 * lands. A month's means are held to the day's limits in monthly terms (Decisions 147): a day's strongest wind runs
 * about 1.5 times its mean wind, and rain falls on some days only, so the mean rain is held to twice the day's limit.
 * shortcut: one wind ratio everywhere (1.3–2.3 by place); a climatology of daily maxima would replace it.
 */
export const bestMonths = (at: Place, purpose: string) =>
  wxAt(at).cl.v?.flatMap((m, i) => over({ ...m, wind: m.wind * 1.5, rain: m.rain / 2 }, purpose).length ? [] : [i + 1]);
