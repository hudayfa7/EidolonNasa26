// Booking listings (docs/plan.md, booking flow): frontend-owned whatever VITE_DATA says. The engine defines the shape
// (contracts/site_listing.json) but implements none, so each listing is derived from the search result it lists, or for an
// established analog site (a compare double that is no search result) from its place alone.
// shortcut: the practical values are seeded per cell, not measured; road, airport and protected-area layers replace them.
import { rng } from '../coords';
import { establishedAt } from './sites';
import type { MatchResult, SiteListing } from './types.gen';

const rd = (x: number, d = 1) => +x.toFixed(d);
// Country names that take 'the' in a sentence ('Unnamed area in the United States of America').
export const inCountry = (c: string) => /^(United |Republic |Democratic |Central African|Dominican|Czech|Netherlands|Philippines|Bahamas|Gambia|Solomon|Marshall|Maldives|Comoros)/.test(c) ? `the ${c}` : c;

export function listing(r: Pick<MatchResult, 'site_id' | 'location' | 'terrain_twins'>): SiteListing {
  const l = r.location ?? {}, lat = l.lat ?? 0, lon = l.lon ?? 0, x = rng(r.site_id), polar = Math.abs(lat) > 60, south = lat < 0;
  const known = establishedAt(lat, lon);
  const prot = x() < .3, hill = r.terrain_twins?.[0]?.earth_url;
  return {
    site_id: r.site_id, name: known?.name ?? `Unnamed area in ${l.country ? inCountry(l.country) : 'an unlisted country'}`, ...(l.country ? { country: l.country } : {}),
    lat, lon, operating_radius_km: rd(2 + 8 * x()), ...(known ? { known_analog: { label_ids: [known.id] } } : {}),
    practical: {
      score: rd(.4 + .5 * x(), 2),
      access: { nearest_road_km: rd(40 * x()), nearest_airport_km: rd(40 + 260 * x(), 0), est_travel_hours_from_airport: rd(1 + 7 * x()) },
      barren_fraction: rd(.6 + .4 * x(), 2), human_footprint: (['very_low', 'low', 'moderate'] as const)[Math.floor(3 * x())],
      protected_area: prot ? { is_protected: true, permit_note: 'Inside a protected area: a research permit from the managing authority is needed.' } : { is_protected: false },
      best_months: polar ? (south ? [12, 1, 2] : [6, 7, 8]) : (south ? [4, 5, 9, 10] : [3, 4, 10, 11]),
      season_note: polar ? 'Reachable in the local summer only.' : 'Spring and autumn avoid the summer heat.',
    },
    ...(hill ? { media: { hillshade_url: hill } } : {}),
  };
}
