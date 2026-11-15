// Pinned sites ('@lat,lon' ids, prototype 865–895) and named targets ('Name@lat,lon'), built on the fly. On Mars and
// the Moon: terrain from the body's global elevation map around the pin, described by its roughness and relief;
// their Earth doubles come from the search (data/client.ts). On Earth: a double the search returned, shown only beside
// its target on compare, named by the country its search reported.
import { fmtLL, parsePinId, pinId, type Body } from '../coords';
import { BODIES } from './bodies';
import { PIN_KM } from './real-sites';
import type { Site } from './sites';
import type { MatchResult } from './types.gen';
import { clearPinTerrain, genTerrain, prunePins, WINDOW_KM } from '../terrain/procedural';
import { BUMP, sampleMap } from '../terrain/sample';

const CUSTOM: Record<string, Site> = {};
const CELLS: Record<string, NonNullable<MatchResult['location']>> = {}, CELL_ID = new Map<string, number>();
// Every result's location and engine cell under its Earth pin id, as searches land (data/client.ts). A pin shown before
// its search landed (a compare deep link) had its terrain from the bump map: dropped, so it is built again at the
// cell's elevation.
export function noteCells(rs: MatchResult[]) {
  for (const r of rs) {
    const l = r.location; if (!l || !Number.isFinite(l.lat) || !Number.isFinite(l.lon)) continue;
    const id = pinId(l.lat!, l.lon!); if (!CELLS[id]) clearPinTerrain(`earth/${id}/`);
    CELLS[id] = l;
    const c = /^earth_cell_(\d{1,9})$/.exec(r.site_id); if (c) CELL_ID.set(id, +c[1]);   // spec §4: the id after the underscore
  }
}
/** The engine cell (`earth_cell_<n>`) a search placed at an Earth pin: its elevation and image are asked by it. */
export const cellOf = (id: string) => CELL_ID.get(id);

// A named target picked from the IAU list (ui/target-search.ts) is a pin at its IAU centre carrying its name,
// 'Jezero%20Mons@18.1600,78.2300', searched by that name. The name comes from the URL (a trust boundary) and reaches
// the page unescaped as the site's name: only the characters IAU names use (letters, digits, space, . ' ’ -).
const IAU_NAME = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'’-]{0,63}$/u;
function nameOf(id: string) { try { const n = decodeURIComponent(id); return IAU_NAME.test(n) ? n : null; } catch { return null; } }

export function customSite(body: Body, id: string): Site | null {
  const at = id.indexOf('@'), p = at < 0 ? null : parsePinId(id.slice(at)), iau = at > 0 ? nameOf(id.slice(0, at)) : undefined;
  if (!p || iau === null || (iau && body === 'earth')) return null;
  const { lat, lon } = p, b = BODIES[body], h0 = sampleMap(BUMP[body], b, lat, lon), [lo, hi] = b.elev, vs = hi - lo;
  if (body === 'earth') {   // not cached: it takes its country's name when a search reports it
    const c = CELLS[id];
    return { id, custom: true, name: c?.country ?? fmtLL(lat, lon, body, 4), place: fmtLL(lat, lon, body, 4), lat, lon, kind: '',
      t: { arch: 'dem', ext: WINDOW_KM, base: c?.elevation_m ?? lo + h0 * vs, h0, vs, amp: 30, pal: 'arid' } };
  }
  const key = `${body}/${id}`; if (CUSTOM[key]) return CUSTOM[key];
  const s: Site = { id, custom: true, name: iau ?? 'Pinned site', iau, lat, lon, note: iau ? 'Centre point from the IAU gazetteer' : 'A point you pinned', kind: 'Named feature',
    t: { arch: 'dem', ext: PIN_KM[body], base: lo + h0 * vs, h0, vs, amp: body === 'mars' ? 45 : 60, craters: body === 'moon' ? 16 : 8, pal: body } };
  CUSTOM[key] = s; prunePins(CUSTOM);
  if (iau) return s;   // its IAU type (Mons, Crater…) comes with its search, in the doubles' target note; the map's roughness would call a mons plains
  const T = genTerrain(body, s);   // its form only, never its brightness (plan, copy pass)
  const rough = T.meanSlope < 1.5 ? 'Smooth' : T.meanSlope < 4 ? 'Rolling' : T.meanSlope < 9 ? 'Rugged' : 'Steep';
  s.kind = `${rough} ${T.relief / T.ext > 25 ? 'highlands' : 'plains'}`;
  return s;
}
// A texture landed late: pins (their elevation) are read again on next use.
export function clearPins() {
  for (const k in CUSTOM) delete CUSTOM[k];
  clearPinTerrain();
}
