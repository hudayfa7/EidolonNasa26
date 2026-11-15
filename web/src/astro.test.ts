// Pins the prototype's astronomy and time formatters (reference/eidolon.html 538–580, 2156, 2172) before the port.
import { describe, expect, it } from 'vitest';
import { jd, helio, rangeAU, marsTime, marsLs, hms, lmst, fmtLight, lightInfo, subsolar, sunAzimuth, hudLocalTime, utcStamp, moonSunLat, sunElevation, solarTime, atSolarTime, solarDate, SOL } from './astro';

// The capture epoch (docs/progress.md, ?capture contract).
const EPOCH = new Date('2026-10-04T12:00:00Z');

describe('time scales', () => {
  it('jd: J2000.0 is 2451545', () => {
    expect(jd(new Date('2000-01-01T12:00:00Z'))).toBe(2451545);
  });
  it('marsTime matches the published Mars Sol Date (44795.9998 at 2000-01-06 00:00 UTC)', () => {
    expect(marsTime(new Date('2000-01-06T00:00:00Z')).msd).toBeCloseTo(44795.9998, 3);
  });
  it('marsTime at the capture epoch', () => {
    const t = marsTime(EPOCH);
    expect(t.msd).toBeCloseTo(54303.13672309, 7);
    expect(t.mtc).toBeCloseTo(3.28135409, 7);
  });
});

describe('hms / lmst', () => {
  it('hms wraps hours into a day and floors to the second', () => {
    expect(hms(0)).toBe('00:00:00');
    expect(hms(25.5)).toBe('01:30:00');
    expect(hms(-1)).toBe('23:00:00');
    expect(hms(24)).toBe('00:00:00');
    expect(hms(23.99999999)).toBe('23:59:59');
    expect(hms(12 + 34 / 60 + 56.9 / 3600)).toBe('12:34:56');
  });
  it('lmst is mean solar time at an east longitude, HH:MM', () => {
    expect(lmst(0, EPOCH)).toBe('03:16');
    expect(lmst(77.58, EPOCH)).toBe('08:27');
    expect(lmst(15, EPOCH)).toBe('04:16');
    expect(lmst(-345, EPOCH)).toBe(lmst(15, EPOCH));
  });
});

describe('light time', () => {
  it('fmtLight: seconds under a minute, else minutes and seconds', () => {
    expect(fmtLight(1.282)).toBe('1.28 s');
    expect(fmtLight(0)).toBe('0.00 s');
    expect(fmtLight(59.994)).toBe('59.99 s');
    expect(fmtLight(60)).toBe('1 m 00 s');
    expect(fmtLight(754.4)).toBe('12 m 34 s');
    expect(fmtLight(754.5)).toBe('12 m 35 s');
    expect(fmtLight(1342)).toBe('22 m 22 s');
  });
  it('prototype behaviour; plan says every number carries its unit cleanly: 59.995–59.999 s shows "60.00 s"', () => {
    expect(fmtLight(59.996)).toBe('60.00 s');
  });
  it('lightInfo: none for Earth, fixed for the Moon, from JPL elements for Mars', () => {
    expect(lightInfo('earth', EPOCH)).toBeNull();
    expect(lightInfo('moon', EPOCH)).toEqual({ sec:1.282, range:'384,400 km' });
    const m = lightInfo('mars', EPOCH)!;
    expect(m.range).toBe('1.64 AU');
    expect(m.sec).toBeCloseTo(818.92843004, 6);
    expect(fmtLight(m.sec)).toBe('13 m 39 s');
  });
  it('rangeAU stays within the Earth–Mars bounds', () => {
    expect(rangeAU('mars', EPOCH)).toBeCloseTo(1.6411234046, 9);
    for (let y = 2024; y <= 2030; y++) {
      const r = rangeAU('mars', new Date(Date.UTC(y, 3, 1)));
      expect(r).toBeGreaterThan(0.37);
      expect(r).toBeLessThan(2.68);
    }
  });
  it('helio: Earth at J2000 is near 1 AU', () => {
    const [x, y, z] = helio('earth', 0);
    expect(x).toBeCloseTo(-0.1771712491, 9);
    expect(y).toBeCloseTo(0.9672144850, 9);
    expect(Math.abs(z)).toBeLessThan(1e-6);
  });
});

describe('subsolar point', () => {
  it('Earth: declination from day of year, longitude from UTC', () => {
    const [la, lo] = subsolar('earth', new Date('2026-06-21T12:00:00Z'));
    expect(la).toBeCloseTo(23.44, 2);
    expect(lo).toBe(0);
    const [la2, lo2] = subsolar('earth', EPOCH);
    expect(la2).toBeCloseTo(-5.3983649, 6);
    expect(lo2).toBe(0);
    expect(subsolar('earth', new Date('2026-10-04T18:00:00Z'))[1]).toBe(-90);
  });
  it('Mars Ls matches the Mars24 worked example (2000-01-06 00:00 UTC: Ls 277.18758°)', () => {
    expect(marsLs(new Date('2000-01-06T00:00:00Z'))).toBeCloseTo(277.1876, 1);
  });
  it('Mars: latitude from the season (Ls ≈ 2° at the capture epoch, just after Mars year 39 began), longitude from local time', () => {
    expect(marsLs(EPOCH)).toBeGreaterThan(1); expect(marsLs(EPOCH)).toBeLessThan(3);
    expect(subsolar('mars', EPOCH)[0]).toBeCloseTo(Math.asin(Math.sin(25.19 * Math.PI / 180) * Math.sin(marsLs(EPOCH) * Math.PI / 180)) * 180 / Math.PI, 9);
    expect(subsolar('mars', EPOCH)[0]).toBeGreaterThan(.4); expect(subsolar('mars', EPOCH)[0]).toBeLessThan(1.3);
    expect(subsolar('mars', new Date('2000-01-06T00:00:00Z'))[0]).toBeCloseTo(-24.98, 1);   // near southern summer solstice (Ls 270°)
    expect(subsolar('mars', EPOCH)[1]).toBeCloseTo(130.77968865, 6);
  });
  it('Moon: latitude the Sun\'s selenographic b0, longitude from lunar phase', () => {
    expect(subsolar('moon', EPOCH)[0]).toBeCloseTo(-1.0667, 3);
    expect(subsolar('moon', EPOCH)[1]).toBeCloseTo(-96.07122486, 6);
  });
  it('moonSunLat: Meeus example 53.a (1992 Apr 12, 0h TD: b0 +1.46°), bounded by the lunar equator\'s 1.543° tilt', () => {
    expect(moonSunLat(new Date(Date.UTC(1992, 3, 11, 23, 59, 1)))).toBeCloseTo(1.46, 1);
    for (let d = 0; d < 400; d += 7) expect(Math.abs(moonSunLat(new Date(EPOCH.getTime() + d * 864e5)))).toBeLessThanOrEqual(1.5425);
  });
});

describe('sun elevation', () => {
  it('90° under the sun, 0 a quarter turn away, the pole at the subsolar latitude', () => {
    const [la, lo] = subsolar('mars', EPOCH);
    expect(sunElevation('mars', la, lo, EPOCH)).toBeCloseTo(90, 4);
    expect(sunElevation('mars', 0, lo + 90, EPOCH)).toBeCloseTo(0, 6);
    expect(sunElevation('moon', -90, 0, EPOCH)).toBeCloseTo(1.0667, 3);   // b0 south: the south pole's sun is up
    expect(sunElevation('earth', 90, 0, EPOCH)).toBeCloseTo(-5.40, 1);    // the arctic winter begins
    // Opposite the sun: −90°, never NaN (the sum rounds below −1 at about 1 point in 20)
    for (let d = 0; d < 100; d++) for (const id of ['earth', 'mars', 'moon'] as const) {
      const t = new Date(EPOCH.getTime() + d * 864e5 + d * 3.7e6), [la, lo] = subsolar(id, t);
      expect(sunElevation(id, -la, lo + 180, t)).toBeCloseTo(-90, 4);
    }
  });
});

describe('local solar time', () => {
  it('noon under the sun; LMST on Mars', () => {
    const lo = subsolar('earth', EPOCH)[1];
    expect(solarTime('earth', lo, EPOCH)).toBeCloseTo(12, 9);
    expect(solarTime('earth', lo + 90, EPOCH)).toBeCloseTo(18, 9);
    expect(hms(solarTime('mars', 77.58, EPOCH)).slice(0, 5)).toBe(lmst(77.58, EPOCH));
  });
  it('atSolarTime: the moment that time comes, in the solar day (midnight to midnight) that holds the date', () => {
    const day = new Date('2026-11-15T12:00:00Z');
    for (const id of ['earth', 'mars', 'moon'] as const) for (const lon of [-170, 0, 77.58]) {
      const a = atSolarTime(id, lon, day, 0), b = atSolarTime(id, lon, day, 23.75);
      expect(a.getTime()).toBeLessThanOrEqual(day.getTime()); expect(b.getTime()).toBeGreaterThan(day.getTime());
      expect(b.getTime() - a.getTime()).toBeCloseTo(23.75 / 24 * SOL[id] * 864e5, -1);
      for (const h of [0, 6.25, 12, 23.75]) expect((solarTime(id, lon, atSolarTime(id, lon, day, h)) - h + 36) % 24 - 12).toBeCloseTo(0, 3);   // 0 may come back as 23.9999…; Earth's subsolar point counts whole seconds
    }
    expect(atSolarTime('earth', 0, day, 12).toISOString()).toBe('2026-11-15T12:00:00.000Z');   // Greenwich: mean noon at 12 UTC
  });
  it('solarDate: the date that gives now back at now\'s solar time, where the UTC date is a solar day off', () => {
    for (const id of ['earth', 'mars', 'moon'] as const) for (const lon of [-170, 0, 162, 170]) for (let hr = 0; hr < 24; hr += 1.5) {
      const now = new Date(Date.UTC(2026, 9, 4, 0, hr * 60)), back = atSolarTime(id, lon, new Date(`${solarDate(id, lon, now)}T12:00:00Z`), solarTime(id, lon, now));
      expect(Math.abs(back.getTime() - now.getTime())).toBeLessThan(2000);   // Earth's subsolar point counts whole seconds
    }
    // The Dry Valleys (162° E) at 14:00 UTC: past local midnight, the next day there; its UTC date lands a day early.
    const dv = new Date('2026-10-04T14:00:00Z');
    expect(solarDate('earth', 162, dv)).toBe('2026-10-05');
    expect(atSolarTime('earth', 162, new Date('2026-10-04T12:00:00Z'), solarTime('earth', 162, dv)).getTime()).toBe(dv.getTime() - 864e5);
  });
});

describe('sun azimuth', () => {
  // The capture epoch's subsolar points: Earth 5.40° S 0°, the Moon 1.07° S 96.07° W.
  it('points along the bearing to the subsolar point', () => {
    expect(sunAzimuth('earth', 40, 0, EPOCH)).toBeCloseTo(180, 6);   // due south of a point north of it
    expect(sunAzimuth('earth', -60, 0, EPOCH)).toBeCloseTo(0, 6);     // due north from the south
    expect(sunAzimuth('moon', 0, 0, EPOCH)).toBeCloseTo(268.93, 2);   // on the equator, west toward it, a little south
    expect(sunAzimuth('moon', 0, -150, EPOCH)).toBeCloseTo(91.32, 2);
    const ne = sunAzimuth('earth', -30, -40, EPOCH); expect(ne).toBeGreaterThan(0); expect(ne).toBeLessThan(90);
  });
  it('stays in [0, 360) at a pole and round the date line', () => {
    for (const [la, lo] of [[-90, 0], [89.99, 179.9], [10, -179.9]]) { const a = sunAzimuth('mars', la, lo, EPOCH); expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(360); }
  });
});

describe('HUD and status-bar formatters', () => {
  it('hudLocalTime per body', () => {
    expect(hudLocalTime('mars', 77.58, EPOCH, 0)).toBe('LMST 08:27');
    expect(hudLocalTime('earth', -90, EPOCH, 0)).toBe('06:00');
    expect(hudLocalTime('earth', 0, new Date('2026-10-04T12:35:59Z'), 0)).toBe('12:35'); // seconds dropped
    expect(hudLocalTime('moon', 30, EPOCH, subsolar('moon', EPOCH)[1])).toBe('20:24');
    expect(hudLocalTime('moon', 10, EPOCH, 10)).toBe('12:00'); // under the sun is noon
  });
  it('prototype behaviour; plan says real clocks: hms floors float noise, so 12:34 UTC on Earth reads 12:33', () => {
    expect(hudLocalTime('earth', 0, new Date('2026-10-04T12:34:00Z'), 0)).toBe('12:33');
    expect(hms(12 + 34 / 60)).toBe('12:33:59');
  });
  it('utcStamp is "DD Mon HH:MM" in UTC, the day first', () => {
    expect(utcStamp(EPOCH)).toBe('04 Oct 12:00');
    expect(utcStamp(new Date('2026-01-02T03:04:59Z'))).toBe('02 Jan 03:04');
    expect(utcStamp(new Date('2026-09-30T23:59:00Z'))).toBe('30 Sep 23:59');
  });
});
