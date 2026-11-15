// The booking listing's templates on the engine's own example (contracts/examples/site_green_river.json): every field
// the schema gives is shown (name, citation, airport, season), the permits copy follows the access, and listing text
// is escaped.
import { describe, expect, it, vi } from 'vitest';
import type { SiteListing } from '../data/types.gen';
import green from '../../contracts/examples/site_green_river.json';

vi.mock('../terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { listingBody, listingLede, months, monthsText, permits } = await import('./listing');
const { listing } = await import('../data/listing');

const G = green as SiteListing, EVIL = '<img src=x onerror="alert(1)">';
const loc = { lat: G.lat, lon: G.lon, country: 'United States of America', sovereign: 'United States of America', access: 'partner', surface: 'barren' as const, elevation_m: 1402 };

describe('the listing on the engine\'s example', () => {
  it('the lede: its name, a documented analog, and where it is documented', () => {
    const h = listingLede(G.name, G, 'Jezero Crater');
    expect(h).toContain('Green River sinuous ridges (Cedar Mountain Fm), Utah, an established analog site.');
    expect(h).toContain('Documented in Hayden et al. 2019, Icarus, doi:10.1016/j.icarus.2019.04.019.');
  });
  it('the body: practical values with their units, the airport by name, access and its permits copy, season', () => {
    const h = listingBody(G, loc, undefined, true);
    for (const s of ['0.74', 'Operating radius', '5.0&nbsp;km', '1.2&nbsp;km', 'Grand Junction (GJT) [FAKE]<span class="n">140&nbsp;km</span>', '2.0&nbsp;h', '0.93', 'Very low',
      'Artemis Accords signatory', 'The United States of America is an Artemis Accords signatory', 'Protected area</dt><dd>No', 'Barren', '1,402 m',
      'No climate data', 'Best months</dt><dd>Mar to May, Sep, Oct', 'FAKE EXAMPLE VALUES: avoid July-August heat.', 'US$'])
      expect(h, s).toContain(s);
    expect(h).not.toContain('km radius');   // the word in the label, not beside the number
    expect(months(G)).toBe('Mar to May, Sep, Oct');
    expect([monthsText([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12]), monthsText([3, 4, 5, 6, 7, 8, 9, 10, 11]), monthsText([...Array(12)].map((_, i) => i + 1)), monthsText([])])
      .toEqual(['All year but Jul', 'All year but Dec to Feb', 'All year', 'None']);
    // Runs of three or more by their ends, across the new year too; shorter ones month by month.
    expect([monthsText([1, 2, 3, 4, 5, 11, 12]), monthsText([12, 1, 2]), monthsText([1, 12]), monthsText([3, 4, 10, 11]), monthsText([6, 7, 8, 8, 13, 0])])
      .toEqual(['Nov to May', 'Dec to Feb', 'Dec, Jan', 'Mar, Apr, Oct, Nov', 'Jun to Aug']);
    expect(listingBody(G, loc, undefined, true, 'Best months for EVA training', true)).toContain('Best months for EVA training</dt><dd>Loading…');
  });
  it('an established site: no surface class or climate, said so', () => {
    expect(listingBody(G, { ...loc, surface: undefined }, undefined, false)).toContain('No surface class or climate: the search engine measures them for its own cells');
  });
  it('the permits copy by access; a protected area by name with its note', () => {
    expect(permits({ ...loc, access: 'antarctic_treaty' }, G)).toContain('Antarctic Treaty');
    expect(permits({ ...loc, access: 'non_partner', sovereign: 'Ethiopia' }, G)).toContain('Ethiopia isn’t an Artemis Accords signatory');
    expect(permits(undefined, G)).toContain('Access isn’t known');
    const P: SiteListing = { ...G, practical: { ...G.practical, protected_area: { is_protected: true, name: 'Canyonlands National Park', permit_note: 'A research permit from the park.' } } };
    expect(listingBody(P, loc, undefined, true)).toContain('Protected area</dt><dd>Canyonlands National Park');
    expect(permits(loc, P)).toContain('A research permit from the park.');
  });
  it('escapes the listing\'s text', () => {
    const E: SiteListing = { ...G, name: EVIL, known_analog: { citation: EVIL }, practical: { ...G.practical, season_note: EVIL, access: { nearest_airport: EVIL },
      protected_area: { is_protected: true, name: EVIL, permit_note: EVIL } } };
    expect(listingLede(E.name, E, 'Jezero Crater') + listingBody(E, { ...loc, country: EVIL, sovereign: EVIL }, undefined, true) + permits({ ...loc, sovereign: EVIL }, E)).not.toContain('<img');
  });
});

describe('a cell\'s listing name', () => {
  it('in its country, with "the" where the name takes it', () => {
    const at = (country: string) => listing({ site_id: 'earth_cell_1', location: { lat: 30, lon: 10, country } }).name;
    expect(at('United States of America')).toBe('Unnamed area in the United States of America');
    expect(at('Algeria')).toBe('Unnamed area in Algeria');
  });
});
