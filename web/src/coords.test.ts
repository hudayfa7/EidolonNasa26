// Pins the prototype's behaviour (reference/eidolon.html) before the port moves the callers.
// Tests marked "prototype behaviour; plan says …" are candidate fixes logged in docs/progress.md.
import { describe, expect, it } from 'vitest';
import {
  compass, clamp, smooth, wrap180, lon360, pad, EAST360, DATUM, latStr, lonStr, fmtLL, hudLL, dmsOf, fmtDMS, lonTick, latTick, lonStride,
  tapeLabel, hudElev, introElev, parseCoord, pinId, parsePinId, llToLocal, localToLL, fmtM, fmtKm, fmtSize, rng, areaOf, llToCap, capToLL, CAP_LAT,
} from './coords';

const ok = (s: string) => { const r = parseCoord(s); if (!('lat' in r)) throw new Error(`expected a coordinate for ${s}: ${JSON.stringify(r)}`); return r; };
// wrap180 adds float noise (77.58 comes back as 77.58000000000004), so compare to 10 dp.
const near = (r: { lat: number; lon: number } | null, lat: number, lon: number) => { expect(r!.lat).toBeCloseTo(lat, 10); expect(r!.lon).toBeCloseTo(lon, 10); };
const err = (s: string) => { const r = parseCoord(s); if (!('err' in r)) throw new Error(`expected an error for ${s}: ${JSON.stringify(r)}`); return r.err; };

describe('compass', () => {
  it('eight words, wrapping round north', () => {
    expect([0, 44, 46, 90, 135, 180, 225, 270, 315, 337.4, 337.6, 359.9, -45, 405].map(compass)).toEqual(
      ['north', 'north-east', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north-west', 'north', 'north', 'north-west', 'north-east']);
  });
});

describe('helpers', () => {
  it('clamp and smooth', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(smooth(0, 1, -1)).toBe(0);
    expect(smooth(0, 1, .5)).toBe(.5);
    expect(smooth(0, 1, 2)).toBe(1);
  });
  it('wrap180 maps any longitude into [-180, 180)', () => {
    expect(wrap180(0)).toBe(0);
    expect(wrap180(190)).toBe(-170);
    expect(wrap180(-190)).toBe(170);
    expect(wrap180(-180)).toBe(-180);
    expect(wrap180(180)).toBe(-180); // +180 folds to -180
    expect(wrap180(540)).toBe(-180);
    expect(wrap180(-900)).toBe(-180);
    expect(wrap180(184.3)).toBeCloseTo(-175.7, 10);
    expect(Object.is(wrap180(-0), 0)).toBe(true);
  });
  it('lon360 maps any longitude into [0, 360)', () => {
    expect(lon360(-10)).toBe(350);
    expect(lon360(360)).toBe(0);
    expect(lon360(720)).toBe(0);
    expect(lon360(-175.7)).toBeCloseTo(184.3, 10);
    expect(Object.is(lon360(-0), 0)).toBe(true);
  });
  it('pad', () => {
    expect(pad(3)).toBe('03');
    expect(pad(12)).toBe('12');
    expect(pad(123)).toBe('123');
  });
  it('body conventions', () => {
    expect(EAST360('mars')).toBe(true);
    expect(EAST360('moon')).toBe(false);
    expect(EAST360('earth')).toBe(false);
    expect(EAST360(undefined)).toBe(false);
    expect(DATUM).toEqual({ mars:'Mars 2000, planetocentric', moon:'Mean Earth/polar axis, planetocentric', earth:'WGS 84' });
  });
});

describe('latStr / lonStr / fmtLL', () => {
  it('formats latitude with a hemisphere', () => {
    expect(latStr(18.38, 4)).toBe('18.3800° N');
    expect(latStr(-86.2, 2)).toBe('86.20° S');
    expect(latStr(0, 2)).toBe('0.00° N');
    expect(latStr(-0, 2)).toBe('0.00° N');
    expect(latStr(89.996, 2)).toBe('90.00° N');
  });
  it('Mars longitude is 0–360° E whatever the input form', () => {
    expect(lonStr(77.58, 4, 'mars')).toBe('77.5800° E');
    expect(lonStr(-175.7, 4, 'mars')).toBe('184.3000° E');
    expect(lonStr(184.3, 1, 'mars')).toBe('184.3° E');
    expect(lonStr(-0, 2, 'mars')).toBe('0.00° E');
  });
  it('Moon and Earth longitude is ±180° with E/W', () => {
    expect(lonStr(1.5, 4, 'moon')).toBe('1.5000° E');
    expect(lonStr(-87, 2, 'moon')).toBe('87.00° W');
    expect(lonStr(184.3, 2, 'earth')).toBe('175.70° W');
    expect(lonStr(180, 2, 'earth')).toBe('180.00° W'); // wrap180 folds +180 to -180
    expect(lonStr(-0, 2, 'earth')).toBe('0.00° E');
  });
  it('rounds half-way values the way toFixed does', () => {
    expect(latStr(1.005, 2)).toBe('1.00° N'); // binary 1.005 is just under
    expect(latStr(18.38005, 4)).toBe('18.3801° N');
  });
  it('prototype behaviour; plan says Mars longitude is 0–360° E: rounding can show 360.00° E', () => {
    expect(lonStr(359.996, 2, 'mars')).toBe('360.00° E');
  });
  it('rounds first, then picks the hemisphere: tiny negatives that round to zero read N/E', () => {
    expect(latStr(-0.001, 2)).toBe('0.00° N');
    expect(lonStr(-0.001, 2, 'moon')).toBe('0.00° E');
    expect(latStr(-0.006, 2)).toBe('0.01° S');
    expect(lonStr(-0.006, 2, 'earth')).toBe('0.01° W');
  });
  it('fmtLL joins lat and lon, 2 dp by default, 4 dp for identified sites', () => {
    expect(fmtLL(18.38, 77.58, 'mars')).toBe('18.38° N, 77.58° E');
    expect(fmtLL(18.38, 77.58, 'mars', 4)).toBe('18.3800° N, 77.5800° E');
    expect(fmtLL(-86.2, 1.5, 'moon', 4)).toBe('86.2000° S, 1.5000° E');
    expect(fmtLL(75.38, -89.68, 'earth', 4)).toBe('75.3800° N, 89.6800° W');
  });
});

describe('hudLL', () => {
  it('zero-pads lat to 2 integer digits and lon to 3, 1 dp by default', () => {
    expect(hudLL(5, 7, 'moon')).toBe('05.0N 007.0E');
    expect(hudLL(-86.2, 1.5, 'moon', 2)).toBe('86.20S 001.50E');
    expect(hudLL(18.38, 77.58, 'mars', 2)).toBe('18.38N 077.58E');
    expect(hudLL(47.2, -175.7, 'mars')).toBe('47.2N 184.3E');
    expect(hudLL(36.5, -117.1, 'earth')).toBe('36.5N 117.1W');
  });
  it('no body (the intro telemetry) uses ±180°', () => {
    expect(hudLL(12.4, -31.2)).toBe('12.4N 031.2W');
  });
  it('rounds first, then picks the hemisphere (the pole centred: sub-observer longitude -0.00001)', () => {
    expect(hudLL(-86, -0.00001, 'moon')).toBe('86.0S 000.0E');
    expect(hudLL(-0.04, -0.04, 'earth')).toBe('00.0N 000.0E');
    expect(hudLL(-0.05, -0.06, 'earth')).toBe('00.1S 000.1W');
  });
  it('prototype behaviour; plan says Mars longitude is 0–360° E: rounding can show 360.0E', () => {
    expect(hudLL(0, 359.96, 'mars')).toBe('00.0N 360.0E');
  });
});

describe('DMS', () => {
  it('dmsOf rounds seconds and carries 60″ and 60′', () => {
    expect(dmsOf(18.38)).toBe('18°22′48″');
    expect(dmsOf(77.58)).toBe('77°34′48″');
    expect(dmsOf(-86.2)).toBe('86°12′00″');
    expect(dmsOf(0.99999999)).toBe('1°00′00″');
    expect(dmsOf(10.999999)).toBe('11°00′00″');
    expect(dmsOf(0)).toBe('0°00′00″');
  });
  it('fmtDMS follows the body convention', () => {
    expect(fmtDMS(18.38, 77.58, 'mars')).toBe('18°22′48″ N, 77°34′48″ E');
    expect(fmtDMS(47.2, -175.7, 'mars')).toBe('47°12′00″ N, 184°18′00″ E');
    expect(fmtDMS(-86, -87, 'moon')).toBe('86°00′00″ S, 87°00′00″ W');
    expect(fmtDMS(-0, 0, 'earth')).toBe('0°00′00″ N, 0°00′00″ E');
    expect(fmtDMS(-0.00001, -0.00001, 'moon')).toBe('0°00′00″ N, 0°00′00″ E');
  });
});

describe('graticule and tape labels', () => {
  it('lonTick', () => {
    expect(lonTick(0, 'moon')).toBe('0°');
    expect(lonTick(180, 'moon')).toBe('180°');
    expect(lonTick(90, 'earth')).toBe('90°E');
    expect(lonTick(270, 'earth')).toBe('90°W');
    expect(lonTick(0, 'mars')).toBe('0°E');
    expect(lonTick(270, 'mars')).toBe('270°E');
    expect(lonTick(-90, 'mars')).toBe('270°E');
  });
  it('latTick', () => {
    expect(latTick(0)).toBe('0°');
    expect(latTick(-0)).toBe('0°');
    expect(latTick(30)).toBe('30°N');
    expect(latTick(-60)).toBe('60°S');
    expect(latTick(12.5)).toBe('12.5°N'); // no rounding; callers pass whole grid steps
  });
  it('lonStride thins meridian labels to a divisor of the ring, or none', () => {
    expect(lonStride(130, 30)).toBe(1);   // the globe at rest
    expect(lonStride(40, 30)).toBe(2);
    expect(lonStride(19, 10)).toBe(3);    // round the south pole zoomed in: 30° apart
    expect(lonStride(12, 10)).toBe(6);    // 5 → 6, which divides 36
    expect(lonStride(14, 30)).toBe(4);
    expect(lonStride(8, 10)).toBe(0);     // 7 → 9: too few to read as a ring
    expect(lonStride(0, 10)).toBe(0);
  });
  it('tapeLabel pads to 3 digits', () => {
    expect(tapeLabel(0, 'moon')).toBe('000E');
    expect(tapeLabel(-30, 'moon')).toBe('030W');
    expect(tapeLabel(180, 'earth')).toBe('180W');
    expect(tapeLabel(-30, 'mars')).toBe('330E');
    expect(tapeLabel(390, 'mars')).toBe('030E');
  });
});

describe('sun elevation readouts', () => {
  it('HUD: signed, 1 dp', () => {
    expect(hudElev(12.34)).toBe('+12.3°');
    expect(hudElev(0)).toBe('+0.0°');
    expect(hudElev(-5.25)).toBe('-5.3°');
  });
  it('prototype behaviour; plan says one shared formatter: HUD uses a hyphen and shows -0.0°', () => {
    expect(hudElev(-0.04)).toBe('-0.0°');
    expect(hudElev(-0)).toBe('+0.0°');
  });
  it('intro: true minus sign, no sign for values that round to zero', () => {
    expect(introElev(-1.8)).toBe('−1.8°');
    expect(introElev(-0.04)).toBe('0.0°');
    expect(introElev(0)).toBe('0.0°');
    expect(introElev(1.25)).toBe('1.3°');
  });
});

describe('parseCoord', () => {
  it('empty input', () => {
    expect(parseCoord('')).toEqual({ empty:true });
    expect(parseCoord('   ')).toEqual({ empty:true });
  });
  it('decimal pairs with comma, space, semicolon or slash', () => {
    for (const s of ['18.38, 77.58', '18.38 77.58', '18.38;77.58', '18.38 / 77.58', '+18.38, +77.58']) {
      near(ok(s), 18.38, 77.58);
    }
  });
  it('hemisphere suffixes and prefixes, in either order, any case', () => {
    near(ok('18.38N 77.58E'), 18.38, 77.58);
    near(ok('18.38n, 77.58e'), 18.38, 77.58);
    near(ok('N18.38 E77.58'), 18.38, 77.58);
    near(ok('77.58E 18.38N'), 18.38, 77.58);
    near(ok('E77.58 N18.38'), 18.38, 77.58);
    near(ok('86.2S 87W'), -86.2, -87);
    near(ok('S86.2, W87'), -86.2, -87);
    near(ok('18.38 N77.58'), 18.38, 77.58);
  });
  it('degree signs and the DEG/º/˚ spellings', () => {
    for (const s of ['18.38° N, 77.58° E', '18.38°N 77.58°E', '18.38 deg N 77.58 deg E', '18.38º N 77.58˚ E']) {
      near(ok(s), 18.38, 77.58);
    }
  });
  it('degrees, minutes, seconds with ASCII or typographic primes', () => {
    for (const s of [`18°22'48"N 77°34'48"E`, '18°22′48″N 77°34′48″E', "18°22'48''N 77°34'48''E", '18°22’48”N 77°34’48”E']) {
      const r = ok(s);
      expect(r.lat).toBeCloseTo(18.38, 10);
      expect(r.lon).toBeCloseTo(77.58, 10);
    }
    near(ok(`18°30'N 77°15'E`), 18.5, 77.25);
  });
  it('signed values, including the Unicode minus', () => {
    near(ok('-86, 0'), -86, 0);
    near(ok('−86, −87'), -86, -87);
    near(ok('-86.2, 1.5'), -86.2, 1.5);
  });
  it('prototype behaviour; plan says coordinates to 4 dp: the parsed longitude carries wrap180 float noise', () => {
    expect(ok('18.38, 77.58').lon).toBe(77.58000000000004);
    expect(ok('18.38, 77.58').lat).toBe(18.38);
  });
  it('47.2N 184.3E is valid on any body and returns ±180; Mars formatting shows it as 184.3° E', () => {
    const r = ok('47.2N 184.3E');
    expect(r.lat).toBe(47.2);
    expect(r.lon).toBeCloseTo(-175.7, 10);
    expect(fmtLL(r.lat, r.lon, 'mars', 4)).toBe('47.2000° N, 184.3000° E');
    expect(fmtLL(r.lat, r.lon, 'moon', 4)).toBe('47.2000° N, 175.7000° W');
  });
  it('18.38N 77.58N gives a clear error', () => {
    expect(err('18.38N 77.58N')).toBe('Give one N/S latitude and one E/W longitude.');
    expect(err('18.38E 77.58E')).toBe('Give one N/S latitude and one E/W longitude.');
  });
  it('longitude range: 180° W to 360° E, wrapped to ±180', () => {
    near(ok('0, 360'), 0, 0);
    near(ok('0, -180'), 0, -180);
    near(ok('0, 180'), 0, -180);
    near(ok('0, 270'), 0, -90);
    expect(err('0, 361')).toBe('Longitude must be between 180° W and 360° E.');
    expect(err('0, -181')).toBe('Longitude must be between 180° W and 360° E.');
    expect(err('0, 190W')).toBe('Longitude must be between 180° W and 360° E.');
  });
  it('latitude range: ±90 inclusive', () => {
    near(ok('90, 0'), 90, 0);
    near(ok('-90, 0'), -90, 0);
    expect(err('91, 0')).toBe('Latitude must be between 90° S and 90° N.');
    expect(err('90.5S 0E')).toBe('Latitude must be between 90° S and 90° N.');
  });
  it('negative zero survives as -0 latitude and formats as N', () => {
    const r = ok('-0, -0');
    expect(Object.is(r.lat, -0)).toBe(true);
    expect(Object.is(r.lon, 0)).toBe(true);
    expect(fmtLL(r.lat, r.lon, 'moon', 4)).toBe('0.0000° N, 0.0000° E');
  });
  it('garbage and stray characters', () => {
    expect(err('abc')).toBe('Unrecognised “A”. Use numbers, °′″ and N, S, E or W.');
    expect(err('north 18, east 77')).toBe('Unrecognised “O”. Use numbers, °′″ and N, S, E or W.');
    expect(err('18.38x 77.58')).toBe('Unrecognised “X”. Use numbers, °′″ and N, S, E or W.');
    expect(err('1e3, 5')).toBe('Too many values. Enter one latitude and one longitude.'); // E reads as a hemisphere: 1E, 3, 5
  });
  it('wrong number of values', () => {
    expect(err('18.38')).toBe('Enter a latitude and a longitude.');
    expect(err('N')).toBe('Enter a latitude and a longitude.');
    expect(err(',')).toBe('Enter a latitude and a longitude.');
    expect(err('1 2 3')).toBe('Too many values. Enter one latitude and one longitude.');
  });
  it('hemisphere letter placement', () => {
    expect(err('18.38N E')).toBe('Put N, S, E or W after each value, or before both.');
    expect(err('18.38, N 77.58')).toBe('Put N, S, E or W after each value, or before both.');
  });
  it('prototype behaviour; plan says a clear error for bad input: a trailing letter after prefix pairs is ignored', () => {
    near(ok('N18.38 77.58E'), 18.38, 77.58);
  });
  it('minutes and seconds rules', () => {
    expect(err(`22' 10, 5`)).toBe('Minutes and seconds need a degree value first.');
    expect(err(`18°60'N 77E`)).toBe('Minutes and seconds must be under 60.');
    expect(err(`18°10'60"N 77E`)).toBe('Minutes and seconds must be under 60.');
  });
  it('sign and hemisphere together', () => {
    expect(err('-18.38S 77.58E')).toBe('Use a minus sign or a hemisphere letter, not both.');
    expect(err('18.38N -77.58W')).toBe('Use a minus sign or a hemisphere letter, not both.');
  });
});

describe('route pin ids', () => {
  it('pinId writes 4 dp', () => {
    expect(pinId(18.38, 77.58)).toBe('@18.3800,77.5800');
    expect(pinId(-86.2, 1.5)).toBe('@-86.2000,1.5000');
    expect(pinId(-0, 0)).toBe('@0.0000,0.0000');
  });
  it('prototype behaviour; plan says signs only on non-zero values: tiny negatives write -0.0000', () => {
    expect(pinId(-0.00001, 0)).toBe('@-0.0000,0.0000');
  });
  it('parsePinId reads pins, clamps latitude to ±89.5 and wraps longitude', () => {
    near(parsePinId('@18.3800,77.5800'), 18.38, 77.58);
    near(parsePinId('@-86.2000,1.5000'), -86.2, 1.5);
    expect(parsePinId('@47.2,184.3')!.lon).toBeCloseTo(-175.7, 10);
    near(parsePinId('@-89.9,0'), -89.5, 0);
    near(parsePinId('@91,0'), 89.5, 0);
    near(parsePinId('@12,3'), 12, 3);
  });
  it('parsePinId rejects anything else', () => {
    for (const s of ['jezero', '18.38,77.58', '@18.38', '@+18,77', '@18.,77', '@18, 77', '@1e2,0', '@18,77,0', '']) expect(parsePinId(s)).toBeNull();
  });
  it('round-trips through the route, normalised to ±180', () => {
    for (const id of ['@18.3800,77.5800', '@-86.2000,1.5000', '@0.0000,-180.0000', '@89.5000,179.9999']) {
      const p = parsePinId(id)!;
      expect(pinId(p.lat, p.lon)).toBe(id);
    }
    const p = ok('47.2N 184.3E');
    expect(pinId(p.lat, p.lon)).toBe('@47.2000,-175.7000');
    expect(parsePinId(pinId(p.lat, p.lon))!.lon).toBeCloseTo(-175.7, 10);
  });
  it('prototype behaviour; plan says +180 is a valid longitude: it comes back as -180', () => {
    expect(pinId(parsePinId('@0,180')!.lat, parsePinId('@0,180')!.lon)).toBe('@0.0000,-180.0000');
  });
});

describe('llToLocal / localToLL (site projection)', () => {
  const MARS = 3389.5, MOON = 1737.4;
  // Great-circle distance in km, independent of the projection.
  const gc = (R: number, a: number, b: number, c: number, d: number) => {
    const r = Math.PI / 180, h = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const centres: [string, number, number, number][] = [['Jezero', 18.38, 77.58, MARS], ['86.2 S', -86.2, 1.5, MOON], ['de Gerlache', -88.5, -87, MOON], ['south pole', -90, 0, MOON], ['north pole', 90, 40, MOON]];
  it.each(centres)('round-trips km → lat/lon → km around %s', (_, lat0, lon0, R) => {
    for (const x of [-40, -12.5, 0, 7, 40]) for (const y of [-40, -3, 0, 22, 40]) {
      const [la, lo] = localToLL(R, lat0, lon0, x, y), [x2, y2] = llToLocal(R, lat0, lon0, la, lo);
      expect(x2).toBeCloseTo(x, 6); expect(y2).toBeCloseTo(y, 6);
      expect(gc(R, lat0, lon0, la, lo)).toBeCloseTo(Math.hypot(x, y), 6);   // distance from the centre is true
    }
  });
  it.each(centres)('edges are symmetric in km around %s', (_, lat0, lon0, R) => {
    const e = [[0, 30], [0, -30], [-30, 0], [30, 0]].map(([x, y]) => localToLL(R, lat0, lon0, x, y));
    for (const [la, lo] of e) expect(gc(R, lat0, lon0, la, lo)).toBeCloseTo(30, 6);
    expect(gc(R, ...e[0], ...e[1])).toBeCloseTo(gc(R, ...e[2], ...e[3]), 6);   // N–S span equals W–E span
    expect(e[2][0]).toBeCloseTo(e[3][0], 9);                                     // W and E edges mirror each other
  });
  it('matches the prototype away from the poles (Jezero map edges, 60 km)', () => {
    const at = (x: number, y: number) => localToLL(MARS, 18.38, 77.58, x, y);
    expect(latStr(at(0, 30)[0], 2)).toBe('18.89° N'); expect(latStr(at(0, -30)[0], 2)).toBe('17.87° N');
    expect(lonStr(at(-30, 0)[1], 2, 'mars')).toBe('77.05° E'); expect(lonStr(at(30, 0)[1], 2, 'mars')).toBe('78.11° E');
  });
  it('gives a polar site its true width: 86.2° S spans ±14.6° of longitude, not the prototype\'s ±4.9°', () => {
    expect(localToLL(MOON, -86.2, 1.5, 30, 0)[1]).toBeCloseTo(16.1047, 3);
    expect(localToLL(MOON, -86.2, 1.5, -30, 0)[1]).toBeCloseTo(-13.1047, 3);
  });
  it('at a pole, north is the centre meridian and the centre maps to itself', () => {
    expect(localToLL(MOON, -90, 0, 0, 30)[1]).toBeCloseTo(0, 9);
    expect(localToLL(MOON, -90, 0, 30, 0)[1]).toBeCloseTo(90, 9);
    expect(localToLL(MOON, -90, 25, 0, 0)).toEqual([-90, 25]);
    expect(llToLocal(MOON, -90, 25, -90, 25)).toEqual([0, 0]);
  });
  it('crosses the pole from a site near it', () => {
    const [la, lo] = localToLL(MOON, -89.5, 0, 0, -30);
    expect(la).toBeCloseTo(-89.5107, 3); expect(Math.abs(lo)).toBeCloseTo(180, 9);
  });
});

describe('fmtM / fmtKm', () => {
  it('fmtM rounds, groups with commas and uses a true minus', () => {
    expect(fmtM(-2600)).toBe('−2,600 m');
    expect(fmtM(1234567.6)).toBe('1,234,568 m');
    expect(fmtM(0.5)).toBe('1 m');
    expect(fmtM(-1.5)).toBe('−1 m');
    expect(fmtM(0)).toBe('0 m');
    expect(fmtM(-0)).toBe('0 m');
  });
  it('prototype behaviour; plan says every number carries its sign correctly: small negatives show −0 m', () => {
    expect(fmtM(-0.4)).toBe('−0 m');
    expect(fmtM(-0.5)).toBe('−0 m');
  });
  it('fmtKm rounds and groups', () => {
    expect(fmtKm(60)).toBe('60 km');
    expect(fmtKm(1234.5)).toBe('1,235 km');
    expect(fmtKm(18.8)).toBe('19 km');
  });
  it('fmtSize: metres for a point feature, a decimal under 10 km, then whole km', () => {
    expect(fmtSize(.009)).toBe('9 m'); expect(fmtSize(.0001)).toBe('1 m'); expect(fmtSize(.1)).toBe('0.1 km');
    expect(fmtSize(9.94)).toBe('9.9 km'); expect(fmtSize(3560.448)).toBe('3,560 km');
  });
  it('prototype behaviour; plan says a true minus like fmtM: negative km use a hyphen', () => {
    expect(fmtKm(-1)).toBe('-1 km');
  });
});

describe('rng (seeded numbers for mock data)', () => {
  it('the same sequence for the same key, another for another, all in [0, 1)', () => {
    const a = rng('mars:Gale'), b = rng('mars:Gale'), c = rng('mars:Jezero');
    const xs = Array.from({ length: 200 }, () => a());
    expect(Array.from({ length: 200 }, () => b())).toEqual(xs);
    expect(c()).not.toBe(xs[0]);
    for (const x of xs) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
});

describe('areaOf (Search this area: the Earth in view as the search\'s bbox)', () => {
  const ll = (lat: number, lon: number) => ({ lat, lon });
  it('the box round the points seen, rounded outward', () => {
    expect(areaOf(ll(40, -110), [ll(30.123, -125.5), ll(50.001, -94.999), ll(41, -110)], false, false)).toEqual([-125.5, 30.12, -94.99, 50.01]);
  });
  it('a view across the antimeridian is cut at ±180°; a pole in view takes every longitude', () => {
    expect(areaOf(ll(0, 175), [ll(-10, 165), ll(10, -175)], false, false)).toEqual([165, -10, 180, 10]);
    expect(areaOf(ll(0, -175), [ll(-10, 165), ll(10, -165)], false, false)).toEqual([-180, -10, -165, 10]);
    expect(areaOf(ll(70, 20), [ll(55, 0), ll(80, 170)], true, false)).toEqual([-180, 55, 180, 90]);
    expect(areaOf(ll(-70, 20), [ll(-55, 0)], false, true)).toEqual([-180, -90, 180, -55]);
  });
});

describe('llToCap / capToLL (the Moon globe\'s south polar cap)', () => {
  it('the pole at the centre, the cap\'s edge latitude at radius 1', () => {
    const [x, z] = llToCap(-90, 0, -180); expect(Math.hypot(x, z)).toBeCloseTo(0, 12);
    for (const lon of [-180, -90, 0, 45, 179]) expect(Math.hypot(...llToCap(CAP_LAT, lon, -180))).toBeCloseTo(1, 12);
  });
  it('round trips, on the object frame of localDir (x = −cos φ cos λ, z = sin φ cos λ over 1 − sin λ)', () => {
    for (const [lat, lon] of [[-89.5, 0], [-86.2, 1.5], [-80, -120], [-76, 170], [-84, -45]]) {
      const [qx, qz] = llToCap(lat, lon, -180), [la, lo] = capToLL(qx, qz, -180);
      expect(la).toBeCloseTo(lat, 9); expect(wrap180(lo - lon)).toBeCloseTo(0, 9);
    }
    // 0° E on the Moon (lon0 −180°) is half a turn from the map's left edge: +x
    const [qx, qz] = llToCap(-80, 0, -180); expect(qx).toBeGreaterThan(0); expect(qz).toBeCloseTo(0, 12);
  });
});
