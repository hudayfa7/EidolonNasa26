// The weather seam: each purpose's limits on a day, the two feeds' JSON read at the trust boundary (recorded responses,
// scripts/fixtures/), the best months, and the feeds asked once per place, the sample days standing in when the
// forecast fails and under ?capture.
import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from '../../scripts/fixtures/open-meteo-forecast.json';
import cl from '../../scripts/fixtures/power-climatology.json';
import dry from '../../scripts/fixtures/power-climatology-dryvalleys.json';
import { bestMonths, daysAt, LIMITS, onWeather, over, parseClimate, parseForecast, parseSkin, sampleDays, skinAt, todayAt, wxAt } from './weather';

const href = { href: 'http://localhost/' };
vi.stubGlobal('location', href);
const answer = (fail = '', climate: unknown = cl) => vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(fail && url.includes(fail) ? { ok: false, status: 503 }
  : { ok: true, json: () => Promise.resolve(url.includes('open-meteo') ? fc : climate) })));
let n = 0;   // a fresh place per test: the feeds are kept for the session
const place = () => ({ id: `p${n}`, lat: 34.675 + n++, lon: -105.075 });
afterEach(() => { href.href = 'http://localhost/'; vi.unstubAllGlobals(); vi.stubGlobal('location', href); vi.spyOn(console, 'warn').mockRestore(); });

describe('the limits', () => {
  const d = { wind: 8, rain: 0, lo: 5, hi: 25 };
  it('a day under every limit of its purpose goes; over one, it names which', () => {
    expect(over(d, 'rover_mobility')).toEqual([]);
    expect(over({ ...d, wind: 11 }, 'rover_mobility')).toEqual(['wind']);   // wind below the limit, the rest up to it
    expect(over({ ...d, rain: 2 }, 'rover_mobility')).toEqual([]);
    expect(over({ wind: 12, rain: 3, lo: -21, hi: 41 }, 'rover_mobility')).toEqual(['wind', 'rain', 'cold', 'heat']);
    expect(over({ ...d, hi: 33 }, 'eva_training')).toEqual(['heat']);
    expect(over({ ...d, lo: -1 }, 'education')).toEqual(['cold']);
  });
  it('a value the feed lacks counts as over; an unknown purpose takes rover mobility\'s', () => {
    expect(over({ ...d, rain: NaN }, 'habitat_ops')).toEqual(['rain']);
    expect(over({ ...d, wind: 10 }, 'polar_lighting_geometry')).toEqual(over({ ...d, wind: 10 }, 'rover_mobility'));
    expect(over({ ...d, wind: 12 }, '__proto__')).toEqual(['wind']);
    for (const L of Object.values(LIMITS)) expect(L.lo).toBeLessThan(L.hi);
  });
});

describe('the feeds\' JSON', () => {
  it('Open-Meteo\'s daily forecast as days, with the place\'s UTC offset; a missing value NaN', () => {
    const { off, days } = parseForecast(fc);
    expect(off).toBe(-21600); expect(days).toHaveLength(16);
    expect(days[0]).toEqual({ iso: '2026-10-04', wind: 6.11, rain: 0, hi: 22.8, lo: 9.9 });
    const gap = structuredClone(fc); (gap.daily.precipitation_sum as (number | null)[])[1] = null;
    expect(parseForecast(gap).days[1].rain).toBeNaN();
  });
  it('refuses what isn\'t a forecast in m/s', () => {
    expect(() => parseForecast(null)).toThrow();
    expect(() => parseForecast({ daily: { time: ['tomorrow'] } })).toThrow('no days');
    expect(() => parseForecast({ ...fc, daily_units: { ...fc.daily_units, wind_speed_10m_max: 'km/h' } })).toThrow('m/s');
    expect(() => parseForecast({ ...fc, daily: { ...fc.daily, temperature_2m_min: [1] } })).toThrow('temperature_2m_min');
    expect(() => parseForecast({ ...fc, utc_offset_seconds: undefined })).toThrow('UTC offset');
    expect(() => parseForecast({ ...fc, utc_offset_seconds: 1e9 })).toThrow('UTC offset');
  });
  it('NASA POWER\'s climatology as each month\'s average day; its fill value NaN', () => {
    const m = parseClimate(cl);
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ wind: 5.7, rain: .42, hi: 2.7 + 12.85 / 2, lo: 2.7 - 12.85 / 2 });
    const fill = structuredClone(cl); fill.properties.parameter.T2M.JUL = -999;
    expect(parseClimate(fill)[6].hi).toBeNaN();
    expect(() => parseClimate({ properties: { parameter: { T2M: {} } } })).toThrow('no parameters');
  });
});

describe('an Earth place\'s skin temperature (NASA POWER)', () => {
  // NASA POWER's climatology at the Atacama (-24.1, -70.0), read 2026-11-14: annual means of TS, TS_MIN and TS_MAX.
  const skin = { properties: { parameter: { TS: { ANN: 18.95 }, TS_MIN: { ANN: -2.44 }, TS_MAX: { ANN: 45.22 } } } };
  it('reads the three annual means; refuses a missing or filled value', () => {
    expect(parseSkin(skin)).toEqual({ mean: 18.95, min: -2.44, max: 45.22 });
    expect(() => parseSkin(null)).toThrow('no TS');
    expect(() => parseSkin({ properties: { parameter: { ...skin.properties.parameter, TS_MIN: { ANN: -999 } } } })).toThrow('no TS_MIN');
    expect(() => parseSkin({ properties: { parameter: { ...skin.properties.parameter, TS_MAX: {} } } })).toThrow('no TS_MAX');
  });
  it('asks once per place, for the three parameters; the value lands, then stays', async () => {
    answer('', skin); const at = place(), seen = vi.fn(); onWeather(seen);
    expect(skinAt(at).busy).toBe(true);
    await skinAt(at).done; skinAt(at);
    expect(fetch).toHaveBeenCalledTimes(1); expect(vi.mocked(fetch).mock.calls[0][0]).toContain('parameters=TS,TS_MIN,TS_MAX');
    expect(skinAt(at)).toMatchObject({ busy: false, v: { min: -2.44 } }); expect(seen).toHaveBeenCalledTimes(1);
  });
  it('a failed feed is no value, not busy; under ?capture it is not asked', async () => {
    answer('power'); vi.spyOn(console, 'warn').mockImplementation(() => {});
    const at = place(); await skinAt(at).done;
    expect(skinAt(at).v).toBeUndefined(); expect(skinAt(at).busy).toBe(false);
    answer(); href.href = 'http://localhost/?capture#/earth/meteor';
    expect(skinAt(place())).toMatchObject({ busy: false }); expect(fetch).not.toHaveBeenCalled();
  });
});

describe('a place\'s weather', () => {
  it('asks both feeds once per place; the days load, then are the forecast\'s, a day past its reach without values', async () => {
    answer(); const at = place(), seen = vi.fn(); onWeather(seen);
    const first = daysAt(at, '2026-10-18', 3);
    expect(first.src).toBe('loading'); expect(first.days.map(d => d.iso)).toEqual(['2026-10-18', '2026-10-19', '2026-10-20']); expect(first.days[0].wind).toBeNaN();
    await Promise.all([wxAt(at).fc.done, wxAt(at).cl.done]);
    expect(fetch).toHaveBeenCalledTimes(2); expect(seen).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('latitude=');
    const w = daysAt(at, '2026-10-18', 3);
    expect(w.src).toBe('forecast'); expect(w.days[0].wind).toBe(fc.daily.wind_speed_10m_max[14]); expect(w.days[2].wind).toBeNaN();
    daysAt(at, '2026-10-05', 14); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('today in the place\'s own time zone once the forecast lands (the day it starts on), UTC\'s until then', async () => {
    answer(); const at = place(), now = Date.parse('2026-10-05T03:00:00Z');   // 21:00 on the 4th at UTC−6
    expect(todayAt(at, now)).toBe('2026-10-05');
    await wxAt(at).fc.done;
    expect(todayAt(at, now)).toBe('2026-10-04');
  });
  it('the best months for each purpose from the climatology\'s months, in monthly terms', async () => {
    answer(); const at = place(); expect(bestMonths(at, 'rover_mobility')).toBeUndefined();
    await wxAt(at).cl.done;
    // Worked by hand: the mean wind ×1.5 against the limit, the mean rain against twice it.
    expect(bestMonths(at, 'rover_mobility')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);   // July's 2.22 mm a day is under 4
    expect(bestMonths(at, 'eva_training')).toEqual([1, 2, 3, 5, 8, 9, 10, 11, 12]);   // April's wind 6.01 ×1.5 over 9; June, July over 32 °C
    expect(bestMonths(at, 'education')).toEqual([3, 5, 8, 9, 10, 11]);               // winter lows under 0 °C too
    answer('', dry); const b = place(); await wxAt(b).cl.done;
    expect(bestMonths(b, 'eva_training')).toEqual([]);                                // the Dry Valleys: every month's low under −10 °C
    expect(bestMonths(b, 'rover_mobility')).toEqual([1, 12]);
  });
  it('a failed forecast gives the sample days, a failed climatology no best months', async () => {
    answer('open-meteo'); vi.spyOn(console, 'warn').mockImplementation(() => {});
    const at = place(); wxAt(at); await wxAt(at).fc.done;
    expect(daysAt(at, '2026-10-05', 7)).toEqual({ src: 'sample', days: sampleDays(at, daysAt(at, '2026-10-05', 7).days.map(d => d.iso)) });
    answer('power'); const b = place(); await wxAt(b).cl.done;
    expect(bestMonths(b, 'rover_mobility')).toBeUndefined(); expect(wxAt(b).cl.busy).toBe(false);
  });
  it('under ?capture, no feed is asked: the sample days at once; ?wx=feed asks them', () => {
    answer(); href.href = 'http://localhost/?capture#/earth/meteor';
    expect(daysAt(place(), '2026-10-05', 7).src).toBe('sample'); expect(fetch).not.toHaveBeenCalled();
    href.href = 'http://localhost/?capture&wx=feed#/earth/meteor';
    expect(daysAt(place(), '2026-10-05', 7).src).toBe('loading'); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('sample days: seeded per place, the wind as the pre-feed sample drew it', () => {
    const at = { id: 'haughton', lat: 75.38, lon: -89.68 }, isos = ['2026-10-04', '2026-10-05', '2026-10-06'], d = sampleDays(at, isos);
    let s = [...at.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7); const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    expect(d.map(x => x.wind)).toEqual(isos.map(() => Math.round(3 + rnd() * 15)));
    expect(sampleDays(at, isos)).toEqual(d);
    for (const x of d) { expect(x.lo).toBeLessThan(x.hi); expect(x.rain).toBeGreaterThanOrEqual(0); }
  });
});
