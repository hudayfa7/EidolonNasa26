// The booking flow's site listing (ui/booking.ts) as pure templates on the engine's schema (contracts/site_listing.json):
// its lede, then below the strip practical suitability (apart from the terrain match), access and the permits copy it
// drives, surface and climate, season and an indicative cost. Tested on the engine's own example (listing.test.ts).
import { fmtM } from '../coords';
import { dayRate } from '../data/booking';
import { inCountry } from '../data/listing';
import type { MatchResult, SiteListing } from '../data/types.gen';
import { esc } from '../dom';
import { ic } from './icons';
import { ACCESS, climate, fact, SURFACE, text, word } from './results';

type Loc = MatchResult['location'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FOOTPRINT: Record<string, string> = { very_low: 'Very low', low: 'Low', moderate: 'Moderate', high: 'High' };
/** Months (1–12) as 'Mar, Apr, Oct', 'Nov to May, Aug' (a run of three or more, across the new year too, by its ends),
 *  'All year but Jul', 'All year' or 'None'. */
export function monthsText(m: number[]) {
  m = m.filter(x => Number.isInteger(x) && x >= 1 && x <= 12);
  const M = (x: number) => MONTHS[(x - 1) % 12];
  const name = (xs: number[]) => { const on = (x: number) => xs.includes(((x - 1) % 12 + 12) % 12 + 1);
    return [...new Set(xs)].filter(a => !on(a - 1)).sort((a, b) => a - b).map(a => { let b = a; while (on(b + 1) && b - a < 11) b++;
      return b - a > 1 ? `${M(a)} to ${M(b)}` : b > a ? `${M(a)}, ${M(b)}` : M(a); }).join(', '); };
  const rest = MONTHS.map((_, i) => i + 1).filter(x => !m.includes(x));
  return !rest.length ? 'All year' : rest.length < 4 ? `All year but ${name(rest)}` : name(m) || 'None';
}
/** The listing's best months ('' when it has none listed). */
export const months = (L: SiteListing) => L.practical.best_months ? monthsText(L.practical.best_months) : '';
export const usd = (x: number) => Math.round(x).toLocaleString('en-GB');

// The permits line by the site's access (spec: partner, non_partner, antarctic_treaty, unknown), then a protected area's note.
export function permits(l: Loc, L: SiteListing) {
  const who = l?.sovereign ? esc(inCountry(l.sovereign)).replace(/^t/, 'T') : 'The host state', a = l?.access, pa = L.practical.protected_area;
  const t = a === 'partner' ? `${who} is an Artemis Accords signatory. A field test still needs the land manager’s permission; plan on a research permit.`
    : a === 'non_partner' ? `${who} isn’t an Artemis Accords signatory: a campaign usually goes through a host institution there, as well as the land manager’s permission.`
    : a === 'antarctic_treaty' ? 'Antarctica, under the Antarctic Treaty: field work needs a permit from a national Antarctic programme and an environmental impact assessment.'
    : 'Access isn’t known for this site: check the host country’s rules for field research before planning.';
  return `<p class="note">${t}</p>${pa?.is_protected ? `<p class="fine">${text(pa.permit_note ?? 'Inside a protected area: a permit from its managing authority is needed.')}</p>` : ''}`;
}

/** The lede: `own`, the listing's name as a sentence (or the place, where the title already gives its name), whether it
 *  is a documented analog and where it is documented. */
export const listingLede = (own: string, L: SiteListing, target: string) =>
  `<p class="lede">${text(own)}${L.known_analog ? ', an established analog site' : ''}. Access, permits, season and cost for a test campaign for ${target}; how alike the terrain is stays on the comparison.</p>${
    L.known_analog?.citation ? `<p class="fine">Documented in ${text(L.known_analog.citation)}.</p>` : ''}`;

/** Everything below the strip. `l`, `env`: the place's location and climate (a search result's); `cell`: whether it is
 *  an engine cell, which alone has a surface class and climate; `best`: the best months' label (HTML), `busy` while
 *  they load. */
export function listingBody(L: SiteListing, l: Loc, env: MatchResult['environment'] | undefined, cell: boolean, best = 'Best months', busy = false) {
  const P = L.practical, a = P.access ?? {}, pa = P.protected_area, [lo, hi] = dayRate(L);
  const n = (x: number | undefined, d: number, u = '') => x == null ? '—' : `${x.toFixed(d)}${u}`, km = n(a.nearest_airport_km, 0, '&nbsp;km');
  return `<h3 class="sec">${ic('practical')}Practical suitability</h3><dl class="facts">
      ${fact('Practical score', n(P.score, 2))}${fact('Operating radius', n(L.operating_radius_km, 1, '&nbsp;km'))}
      ${fact('Nearest road', n(a.nearest_road_km, 1, '&nbsp;km'))}${fact('From the airport', n(a.est_travel_hours_from_airport, 1, '&nbsp;h'))}
      ${fact('Nearest airport', a.nearest_airport ? `${esc(a.nearest_airport)}<span class="n">${km}</span>` : km, `wide${a.nearest_airport ? ' w' : ''}`)}
      ${fact('Barren share of the area', n(P.barren_fraction, 2))}${fact('Human footprint', word(FOOTPRINT, P.human_footprint), 'w')}</dl>
    <p class="fine">Practical suitability is scored apart from the terrain match and never combined with it.</p>
    <h3 class="sec">${ic('access')}Access and permits</h3><dl class="facts">
      ${fact('Country', esc(l?.country ?? L.country ?? '—'), 'w')}${fact('Sovereign state', l?.sovereign ? esc(l.sovereign) : '—', 'w')}
      ${fact('Access', word(ACCESS, l?.access, 'Unknown'), 'wide w')}
      ${fact('Protected area', !pa ? '—' : !pa.is_protected ? 'No' : pa.name ? esc(pa.name) : 'Yes', 'wide w')}</dl>${permits(l, L)}
    <h3 class="sec">${ic('surface')}Surface and climate</h3><dl class="facts">
      ${fact('Surface', word(SURFACE, l?.surface), 'w')}${fact('Elevation', l?.elevation_m == null ? '—' : fmtM(l.elevation_m))}</dl>
    ${cell ? climate(env) : '<p class="fine">No surface class or climate: the search engine measures them for its own cells, and an established site isn’t one of its results.</p>'}
    <div data-wx><h3 class="sec">${ic('season')}Season</h3><dl class="facts">${fact(best, busy ? 'Loading…' : months(L) || '—', 'wide w')}</dl>
    ${P.season_note ? `<p class="fine">${text(P.season_note)}</p>` : ''}</div>
    <h3 class="sec">${ic('cost')}Indicative cost</h3><dl class="facts">${fact('Field costs on site, per person-day', `US$&nbsp;${usd(lo)}–${usd(hi)}`, 'wide')}</dl>
    <p class="fine">Lodging, vehicles and local support, estimated from how remote the site is. Flights not included; not a quote.</p>
    <p class="fine">Sample listing: practical values are seeded until access, permit and land-use data are connected.</p>`;
}
