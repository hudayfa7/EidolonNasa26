// The booking flow's logic: picking days on the weather window, the plan's checks, the indicative cost and the
// request's reference.
import { describe, expect, it, onTestFinished, vi } from 'vitest';
// This browser's storage, as a page has it, before booking.ts reads it on import: a campaign requested in an earlier
// session.
const stored = vi.hoisted(() => {
  const m = new Map<string, string>([['eidolon.booking', JSON.stringify({ requests: { 'mars/gale|@1.0000,2.0000': { ref: 'EID-261001-AAAA', name: 'Chile',
    place: 'an unnamed area in Chile', target: 'Gale Crater', plan: { purpose: 'rover_mobility', from: '2026-10-02', start: '2026-10-03', end: '2026-10-04', team: '3', gear: [], notes: '' } } } })]]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } } });
  return m;
});
import { campaigns, cost, dayRate, days, fmtDay, keptOf, lasting, offSeason, pickDay, planOf, refOf, request, requestOf, validate, windowOf, WINDOW_DAYS, type Plan } from './booking';
import type { SiteListing } from './types.gen';
import { over } from './weather';

vi.stubGlobal('location', { href: 'http://localhost/?capture' });   // no live feeds: the sample days

const NOW = Date.parse('2026-10-04T12:00:00Z');
const plan = (o: Partial<Plan> = {}): Plan => ({ purpose: 'rover_mobility', from: '2026-10-05', start: '2026-10-06', end: '2026-10-10', team: '6', gear: [], notes: '', ...o });
const PURPOSES = ['rover_mobility', 'education'];
const NAMES = { name: 'Salda Gölü', place: 'Salda Gölü', target: 'Jezero Crater' };
const L = (access: NonNullable<SiteListing['practical']['access']>): SiteListing => ({ site_id: 'earth_cell_1', name: 'x', lat: 0, lon: 0, operating_radius_km: 5, practical: { score: .5, access } });

describe('the weather window', () => {
  it('two weeks of days from the plan\'s first, each with the limits of the plan\'s purpose it goes over', () => {
    const at = { site_id: 'earth_cell_477151', lat: 34.675, lon: -105.075 }, w = windowOf(at, { from: '2026-10-05', purpose: 'eva_training' });
    expect(w.src).toBe('sample'); expect(w.days).toHaveLength(WINDOW_DAYS);
    expect(w.days[0].iso).toBe('2026-10-05'); expect(w.days.at(-1)!.iso).toBe('2026-10-18');
    for (const d of w.days) expect(d.over).toEqual(over(d, 'eva_training'));
    expect(windowOf(at, { from: '2026-10-05', purpose: 'eva_training' })).toEqual(w);   // seeded per site
  });
  it('a click starts a one-day campaign, a later one ends it there, any other starts again', () => {
    expect(pickDay({ start: '', end: '' }, '2026-10-07')).toEqual({ start: '2026-10-07', end: '2026-10-07' });
    expect(pickDay({ start: '2026-10-07', end: '2026-10-07' }, '2026-10-10')).toEqual({ start: '2026-10-07', end: '2026-10-10' });
    expect(pickDay({ start: '2026-10-07', end: '2026-10-07' }, '2026-10-06')).toEqual({ start: '2026-10-06', end: '2026-10-06' });
    expect(pickDay({ start: '2026-10-07', end: '2026-10-07' }, '2026-10-07')).toEqual({ start: '2026-10-07', end: '2026-10-07' });
    expect(pickDay({ start: '2026-10-07', end: '2026-10-10' }, '2026-10-12')).toEqual({ start: '2026-10-12', end: '2026-10-12' });
  });
  it('counts days inclusively and names them in UTC', () => {
    expect(days(plan())).toBe(5); expect(days(plan({ end: '2026-10-06' }))).toBe(1);
    expect(fmtDay('2026-10-06')).toBe('Tue 6 Oct'); expect(fmtDay('2026-10-06', true)).toBe('Tue 6 Oct 2026');
  });
  it('a plan starts on the window from tomorrow with the search\'s purpose, and is kept per target and double', () => {
    const p = planOf('mars/jezero|@1,2', 'education', NOW);
    expect(p).toMatchObject({ purpose: 'education', from: '2026-10-05', start: '', team: '', gear: [] });
    expect(planOf('mars/jezero|@1,2', 'rover_mobility', NOW + 9e8)).toBe(p);
  });
});

describe('validate', () => {
  it('a complete plan passes', () => { expect(validate(plan(), PURPOSES)).toEqual({}); });
  it('an empty plan names every missing field', () => {
    expect(Object.keys(validate(plan({ purpose: '', start: '', end: '', team: '' }), PURPOSES))).toEqual(['purpose', 'dates', 'team']);
  });
  it('the team is a whole number from 1 to 40', () => {
    expect(validate(plan({ team: ' 40 ' }), PURPOSES)).toEqual({});
    for (const team of ['0', '41', '3.5', 'six', '-2', '1e1']) expect(validate(plan({ team }), PURPOSES).team, team).toMatch(/whole number from 1 to 40/);
    expect(validate(plan({ team: '  ' }), PURPOSES).team).toBe('Enter the team size.');
  });
  it('the days lie on the window, the last not before the first', () => {
    for (const d of [{ start: '2026-10-04', end: '2026-10-05' }, { start: '2026-10-08', end: '2026-10-07' }, { start: '2026-10-17', end: '2026-10-19' }, { start: '2026-10-06', end: '' }])
      expect(validate(plan(d), PURPOSES).dates, JSON.stringify(d)).toBeDefined();
    expect(validate(plan({ start: '2026-10-05', end: '2026-10-18' }), PURPOSES)).toEqual({});
  });
  it('a purpose the plan doesn\'t offer, and notes past 1,000 characters, are refused', () => {
    expect(validate(plan({ purpose: 'polar_lighting_geometry' }), PURPOSES).purpose).toBe('Choose a test purpose.');
    expect(validate(plan({ notes: 'x'.repeat(1001) }), PURPOSES).notes).toMatch(/1,000 characters/);
    expect(validate(plan({ notes: 'x'.repeat(1000) }), PURPOSES)).toEqual({});
  });
});

describe('the best months', () => {
  const S = (best_months?: number[]): SiteListing => ({ ...L({}), practical: { score: .5, best_months } });
  it('a caveat when any picked day falls outside them (every day when there are none), none without days or months listed', () => {
    expect(offSeason(S([6, 7, 8]), plan())).toBe(true);                                   // October, a polar north site
    expect(offSeason(S([3, 4, 10, 11]), plan())).toBe(false);
    expect(offSeason(S([10]), plan({ start: '2026-10-30', end: '2026-11-02' }))).toBe(true);   // runs into November
    expect(offSeason(S([6]), plan({ start: '', end: '' }))).toBe(false);
    expect(offSeason(S(), plan())).toBe(false);
    expect(offSeason(S([]), plan())).toBe(true);                                          // no good month: every day is off
    expect(offSeason(S([]), plan({ start: '', end: '' }))).toBe(false);
  });
});

describe('indicative cost', () => {
  it('a day rate from the site\'s remoteness, low and high, to the nearest US$ 10', () => {
    expect(dayRate(L({ nearest_road_km: 0, est_travel_hours_from_airport: 0 }))).toEqual([150, 210]);
    expect(dayRate(L({ nearest_road_km: 6.7, est_travel_hours_from_airport: 4.1 }))).toEqual([220, 310]);
    expect(dayRate(L({}))).toEqual([230, 320]);   // unknown access: middling assumptions
  });
  it('the plan\'s total is the rate for the whole team over every day', () => {
    expect(cost(L({ nearest_road_km: 6.7, est_travel_hours_from_airport: 4.1 }), plan())).toEqual([220 * 30, 310 * 30]);
  });
});

describe('the request', () => {
  it('a reference from the day it was made and what it asks for', () => {
    const r = refOf('mars/jezero|@1,2', plan(), NOW);
    expect(r).toMatch(/^EID-261004-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(refOf('mars/jezero|@1,2', plan(), NOW)).toBe(r);
    expect(refOf('mars/jezero|@1,2', plan({ team: '7' }), NOW)).not.toBe(r);
  });
  it('keeps a copy of the plan as requested', () => {
    const p = plan({ gear: ['rover'] }), q = request('moon/hadley|meteor', p, NOW, NAMES);
    p.gear.push('drill'); p.team = '9';
    expect(requestOf('moon/hadley|meteor')).toBe(q);
    expect(q).toMatchObject({ plan: { team: '6', gear: ['rover'] }, ...NAMES });
  });
  it('a requested campaign is edited from its own plan in a later session; once its window has moved on, its days are picked again', () => {
    request('mars/gale|@1,2', plan({ purpose: 'education', team: '4', notes: 'n' }), NOW, NAMES);
    expect(planOf('mars/gale|@1,2', 'rover_mobility', NOW)).toEqual(plan({ purpose: 'education', team: '4', notes: 'n' }));
    request('mars/gale|@3,4', plan({ team: '4' }), NOW, NAMES);
    expect(planOf('mars/gale|@3,4', 'rover_mobility', NOW + 864e5)).toEqual(plan({ team: '4', from: '2026-10-06', start: '', end: '' }));
  });
  it('My campaigns: each request with its target and double, soonest first; again at the same pair replaces it', () => {
    request('moon/malapert|haughton', plan({ start: '2026-10-08', end: '2026-10-09' }), NOW, NAMES);
    request('mars/jezero|@34.6750,-105.0750', plan({ start: '2026-10-12', end: '2026-10-12' }), NOW, NAMES);
    request('mars/jezero|@34.6750,-105.0750', plan({ start: '2026-10-07', end: '2026-10-07' }), NOW, NAMES);
    const cs = campaigns().filter(c => ['moon/malapert|haughton', 'mars/jezero|@34.6750,-105.0750'].includes(c.key));
    expect(cs.map(c => [c.body, c.site, c.dbl, c.plan.start])).toEqual([['mars', 'jezero', '@34.6750,-105.0750', '2026-10-07'], ['moon', 'malapert', 'haughton', '2026-10-08']]);
    expect(campaigns().map(c => c.plan.start)).toEqual(campaigns().map(c => c.plan.start).sort());
  });
});

describe('kept: plans for the tab\'s session, requests in this browser', () => {
  it('requests made in an earlier session come back', () => {
    expect(lasting).toBe(true);
    expect(requestOf('mars/gale|@1.0000,2.0000')).toMatchObject({ ref: 'EID-261001-AAAA', name: 'Chile', plan: { team: '3' } });
  });
  it('another tab\'s requests are listed as it makes them, and stand when this tab requests: only its own is written over', () => {
    request('mars/jezero|salda', plan(), NOW, NAMES);
    const other = JSON.parse(stored.get('eidolon.booking')!);   // another tab, since: a new campaign, and this one again
    other.requests['moon/haworth|dryvalleys'] = { ...other.requests['mars/gale|@1.0000,2.0000'], target: 'Haworth' };
    other.requests['mars/jezero|salda'].ref = 'EID-261005-BBBB';
    stored.set('eidolon.booking', JSON.stringify(other));
    expect(campaigns().find(c => c.key === 'moon/haworth|dryvalleys')?.target).toBe('Haworth');
    expect(requestOf('mars/jezero|salda')?.ref).toBe('EID-261005-BBBB');
    other.requests['moon/malapert|haughton'] = { ...other.requests['mars/jezero|salda'], ref: 'EID-261005-CCCC' };
    stored.set('eidolon.booking', JSON.stringify(other));
    const q = request('mars/jezero|aeolis', plan(), NOW, NAMES), kept = keptOf(stored.get('eidolon.booking')!).requests;
    expect(kept['mars/jezero|salda'].ref).toBe('EID-261005-BBBB');
    expect(kept['moon/malapert|haughton'].ref).toBe('EID-261005-CCCC');
    expect(kept['mars/jezero|aeolis']).toEqual(q);
    expect(Object.keys(kept)).toEqual(expect.arrayContaining(['mars/gale|@1.0000,2.0000', 'moon/haworth|dryvalleys']));
  });
  it('a reload gets back each whole plan and request, as they were', () => {
    const k = { plans: { 'mars/jezero|salda': plan({ gear: ['rover'], notes: 'Two rovers <b>' }) }, requests: { 'mars/jezero|salda': { ref: 'EID-261004-AB12', plan: plan(), ...NAMES } } };
    expect(keptOf(JSON.stringify(k))).toEqual(k);
  });
  it('drops what isn\'t a whole plan or request, and anything else', () => {
    const k = { plans: { a: plan({ team: 6 as unknown as string }), b: { ...plan(), gear: [1] }, c: null, d: 'x', e: { ...plan(), extra: 1 }, f: plan({ start: '', end: '' }) },
      requests: { a: { plan: plan() }, b: { ref: 'EID', plan: { ...plan(), notes: undefined }, ...NAMES }, c: null,
        'mars/jezero|salda': { ref: 'EID', plan: plan() }, 'earth/x|y': { ref: 'EID', plan: plan(), ...NAMES }, 'mars/a/b|c': { ref: 'EID', plan: plan(), ...NAMES },
        'moon/a|b': { ref: 'EID', plan: plan(), ...NAMES, name: 7 } }, other: 1 };
    expect(keptOf(JSON.stringify(k))).toEqual({ plans: { e: plan(), f: plan({ start: '', end: '' }) }, requests: {} });
    // Days that aren't days (a page would show "Invalid Date", or take them as markup; Edit the plan would throw)
    for (const o of [{ from: 'x' }, { start: '<!--' }, { end: '2026-13-45' }, { start: '2026-10-06T00:00' }])
      expect(keptOf(JSON.stringify({ plans: { a: plan(o) } })).plans, JSON.stringify(o)).toEqual({});
    // A request's plan as it passed to be requested: its days on its window, the first not after the last; a whole team.
    for (const o of [{ team: 'NaN' }, { team: '0' }, { team: '41' }, { start: '', end: '' }, { start: '2026-10-09', end: '2026-10-07' }, { end: '2026-10-19' }, { from: 'x' }])
      expect(keptOf(JSON.stringify({ requests: { 'mars/jezero|salda': { ref: 'EID', plan: plan(o), ...NAMES } } })).requests, JSON.stringify(o)).toEqual({});
    for (const j of [null, '', '{', 'null', '1', '"x"', '[]', '{"plans":"abc","requests":[1]}']) expect(keptOf(j)).toEqual({ plans: {}, requests: {} });
  });
  // Blocked site data (localStorage throws on access) or a full store (it throws on writing): requests last the page.
  function fresh(ls: PropertyDescriptor) {
    const was = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!;
    onTestFinished(() => { Object.defineProperty(globalThis, 'localStorage', was); });
    vi.resetModules(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...ls });
    return import('./booking');
  }
  it('without site data, a request lasts the page, said so', async () => {
    const b = await fresh({ get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
    expect(b.lasting).toBe(false);
    const q = b.request('mars/jezero|salda', plan(), NOW, NAMES);
    expect(b.requestOf('mars/jezero|salda')).toBe(q);
    expect(b.campaigns().map(c => c.key)).toEqual(['mars/jezero|salda']);
  });
  it('a write that fails keeps the request in the page, never read over by what the browser kept', async () => {
    const m = new Map<string, string>();
    const b = await fresh({ value: { getItem: (k: string) => m.get(k) ?? null, setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); } } });
    expect(b.lasting).toBe(true);
    b.request('mars/jezero|salda', plan(), NOW, NAMES);
    expect(b.lasting).toBe(false);
    expect(b.campaigns().map(c => c.key)).toEqual(['mars/jezero|salda']);
  });
});
