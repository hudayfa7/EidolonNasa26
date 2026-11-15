// The hash routes of the booking flow: each step deep-links under the compare's route, on terrain or globes.
import { describe, expect, it, vi } from 'vitest';

vi.mock('./terrain/sample', () => ({ BUMP: {}, ALB: {}, sampleMap: () => .5 }));
const { mapsOf, parseHash, routeOf, titleOf } = await import('./routes');
const { STEPS } = await import('./data/booking');

describe('booking routes', () => {
  const cmp = { view: 'compare', body: 'mars', site: 'jezero', dbl: 'salda' } as const;
  it('/book is the listing; a known step after it, else the listing; on the globe compare too', () => {
    expect(parseHash('#/mars/jezero/compare/salda/book')).toMatchObject({ ...cmp, globe: false, book: 'listing' });
    expect(parseHash('#/mars/jezero/compare/salda/book/plan?capture')).toMatchObject({ book: 'plan' });
    expect(parseHash('#/mars/jezero/compare/salda/book/listing').book).toBe('listing');
    expect(parseHash('#/mars/jezero/compare/salda/book/nope').book).toBe('listing');
    expect(parseHash('#/mars/jezero/compare/salda/globe/book/review')).toMatchObject({ ...cmp, globe: true, book: 'review' });
    expect(parseHash('#/mars/jezero/compare/@34.6750,-105.0750/book/done')).toMatchObject({ dbl: '@34.6750,-105.0750', book: 'done' });
  });
  it('no step without a compare, or anywhere but after it', () => {
    expect(parseHash('#/mars/jezero/compare/salda')).toMatchObject({ view: 'compare', book: null });
    expect(parseHash('#/mars/jezero/compare/salda/plan').book).toBeNull();
    expect(parseHash('#/mars/jezero/book')).toMatchObject({ view: 'site', book: null });
    expect(parseHash('#/mars/jezero/compare/nowhere/book')).toMatchObject({ view: 'site', dbl: null, book: null });
    expect(routeOf({ body: 'mars', site: 'jezero', book: 'plan' })).toBe('mars/jezero');
  });
  it('every step and stage writes the route it parses from; the listing as /book', () => {
    expect(routeOf({ ...cmp, globe: false, book: 'listing' })).toBe('mars/jezero/compare/salda/book');
    for (const book of [...STEPS, null]) for (const [globe, overlay] of [[false, false], [true, false], [false, true]]) {
      const r = { ...cmp, globe, overlay, book, grid: false };
      expect(parseHash(`#/${routeOf(r)}`), JSON.stringify(r)).toEqual(r);
    }
  });
});

describe('overlay routes', () => {
  it('/overlay after a compare is the overlay, alone or before a booking step; globe wins when both are asked', () => {
    expect(parseHash('#/mars/jezero/compare/salda/overlay')).toMatchObject({ view: 'compare', dbl: 'salda', globe: false, overlay: true, book: null });
    expect(parseHash('#/mars/jezero/compare/@34.6750,-105.0750/overlay/book/plan')).toMatchObject({ overlay: true, book: 'plan' });
    expect(parseHash('#/mars/jezero/compare/salda')).toMatchObject({ overlay: false });
    expect(parseHash('#/mars/jezero/overlay')).toMatchObject({ view: 'site', overlay: false });
    expect(routeOf({ body: 'mars', site: 'jezero', dbl: 'salda', globe: true, overlay: true })).toBe('mars/jezero/compare/salda/globe');
    expect(routeOf({ body: 'mars', site: 'jezero', overlay: true })).toBe('mars/jezero');
  });
});

describe('the site selector grid', () => {
  it('/sites after a target world is its body view with the grid; Earth has none; it round-trips', () => {
    expect(parseHash('#/mars/sites')).toMatchObject({ view: 'body', body: 'mars', site: null, grid: true });
    expect(parseHash('#/moon/sites?capture')).toMatchObject({ view: 'body', body: 'moon', grid: true });
    expect(parseHash('#/earth/sites')).toMatchObject({ view: 'body', body: 'earth', grid: false });
    expect(parseHash('#/mars')).toMatchObject({ grid: false });
    expect(parseHash('#/mars/jezero')).toMatchObject({ view: 'site', grid: false });
    expect(routeOf(parseHash('#/mars/sites'))).toBe('mars/sites');
    expect(routeOf({ ...parseHash('#/mars/sites'), view: 'site', site: 'jezero' })).toBe('mars/jezero');   // a site wins
    expect(mapsOf(parseHash('#/moon/sites'))).toEqual(mapsOf(parseHash('#/moon')));
  });
});

describe('the maps a route opens on', () => {
  const maps = (h: string) => mapsOf(parseHash(h));
  it('Earth on the title, the body on a deep link (and Earth on a compare), all three worlds on the system', () => {
    expect(maps('#/')).toEqual(['earth_day', 'earth_bump', 'earth_night', 'earth_spec']);
    expect(maps('#/mars')).toEqual(['mars', 'mars_bump']);
    expect(maps('#/moon/malapert')).toEqual(['moon', 'moon_bump', 'moon_cap', 'moon_cap_normal']);
    expect(maps('#/mars/jezero/compare/salda/book')).toEqual(['mars', 'mars_bump', 'earth_day', 'earth_bump', 'earth_night', 'earth_spec']);
    expect(maps('#/system')).toHaveLength(10);
    expect(maps('#/nowhere')).toEqual(maps('#/system'));
  });
  it('every map on Beyond', () => expect(maps('#/beyond')).toBeNull());
});

describe('the page title', () => {
  const title = (h: string) => titleOf(parseHash(h));
  it('says what the route shows, most specific first, then Eidolon', () => {
    expect(title('#/')).toBe('Eidolon');
    expect(title('#/system')).toBe('Solar system · Eidolon');
    expect(title('#/beyond')).toBe('Beyond the Moon and Mars · Eidolon');
    expect(title('#/mars')).toBe('Mars · Eidolon');
    expect(title('#/moon/sites')).toBe('Featured sites, Moon · Eidolon');
    expect(title('#/mars/jezero')).toBe('Jezero Crater, Mars · Eidolon');
    expect(title('#/earth/haughton')).toBe('Haughton Crater, Earth · Eidolon');
    expect(title('#/mars/@18.3800,77.5800')).toBe('Pin 18.3800° N, 77.5800° E, Mars · Eidolon');
    expect(title('#/moon/Statio%20Tranquillitatis@0.6741,23.4732')).toBe('Statio Tranquillitatis, Moon · Eidolon');
  });
  it('a comparison names both sides, whichever its view; a booking step its step and the Earth side', () => {
    expect(title('#/mars/jezero/compare/salda')).toBe('Jezero Crater and Lake Salda · Eidolon');
    expect(title('#/mars/jezero/compare/salda/globe')).toBe(title('#/mars/jezero/compare/salda/overlay'));
    expect(title('#/mars/jezero/compare/@34.6750,-105.0750')).toBe('Jezero Crater and 34.6750° N, 105.0750° W · Eidolon');   // a cell before its search names its country
    expect(title('#/mars/jezero/compare/salda/book/plan')).toBe('Campaign plan, Lake Salda · Eidolon');
  });
});
