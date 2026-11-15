// The booking flow's data (docs/plan.md, Must 6): frontend-owned in both modes, like the listings (listing.ts). A plan
// is kept per target and Earth double; requesting it is a mock that makes a reference number and sends nothing.
// Plans last the tab's session (sessionStorage), so a reload keeps them: after a lost graphics context every way back
// reloads the page (ui/fallback.ts), and a phone can drop the context, or the tab, while its user picks dates in a
// calendar. Requests are My campaigns (ui/campaigns.ts), kept in this browser (localStorage) until its data is cleared:
// a plan is a draft whose weather window moves on daily, a request a record (Decisions 191).
import { rng } from '../coords';
import type { SiteListing } from './types.gen';
import { daysAt, isoDay, over } from './weather';

/** The flow's steps, each a route under the compare's (`…/book`, `…/book/plan`, …), and their names. */
export const STEPS = ['listing', 'plan', 'review', 'done'] as const;
export type Step = typeof STEPS[number];
export const STEP_NAME: Record<Step, string> = { listing: 'Site listing', plan: 'Campaign plan', review: 'Review', done: 'Requested' };
/** One level up from each step (Escape and the back button): the listing goes back to the comparison. */
export const UP: Record<Step, Step | null> = { listing: null, plan: 'listing', review: 'plan', done: 'listing' };

export const WINDOW_DAYS = 14, TEAM_MAX = 40, NOTES_MAX = 1000;
export const EQUIPMENT: Record<string, string> = {
  rover: 'Rover or mobility platform', drill: 'Drill or coring rig', suits: 'Spacesuits or EVA mock-ups',
  habitat: 'Habitat or shelter module', drones: 'Drones', instruments: 'Field instruments (spectrometers, radar)',
};

/** A campaign plan as the form holds it: `team` as typed, days as ISO dates, `from` the weather window's first day. */
export interface Plan { purpose: string; from: string; start: string; end: string; team: string; gear: string[]; notes: string }
export type Field = 'purpose' | 'dates' | 'team' | 'notes';
export type Errors = Partial<Record<Field, string>>;

const DAY = 864e5;
const dayOf = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
/** 'Tue 6 Oct', with the year 'Tue 6 Oct 2026': one form on every step. */
export const fmtDay = (iso: string, year = false) =>
  new Date(dayOf(iso)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) + (year ? ` ${iso.slice(0, 4)}` : '');

/** A listing's place, for its weather (data/weather.ts). */
export const placeOf = (L: Pick<SiteListing, 'site_id' | 'lat' | 'lon'>) => ({ id: L.site_id, lat: L.lat, lon: L.lon });
/** The window the dates are picked on: WINDOW_DAYS of the listed site's weather from the plan's first day, each with
 *  the limits of the plan's purpose it goes over (data/weather.ts LIMITS). */
export function windowOf(L: Pick<SiteListing, 'site_id' | 'lat' | 'lon'>, p: Pick<Plan, 'from' | 'purpose'>) {
  const w = daysAt(placeOf(L), p.from, WINDOW_DAYS);
  return { src: w.src, days: w.days.map(d => ({ ...d, over: over(d, p.purpose) })) };
}
export const days = (p: Pick<Plan, 'start' | 'end'>) => Math.round((dayOf(p.end) - dayOf(p.start)) / DAY) + 1;
/** Whether a campaign's days reach outside the listing's best months (a caveat on the dates, never a refusal): every
 *  day does when there are none; none does when they aren't known. */
export function offSeason(L: SiteListing, p: Pick<Plan, 'start' | 'end'>) {
  const m = L.practical.best_months; if (!m || !p.start) return false;
  for (let t = dayOf(p.start); t <= dayOf(p.end); t += DAY) if (!m.includes(new Date(t).getUTCMonth() + 1)) return true;
  return false;
}
/** A click on a day: the first starts a one-day campaign, a later day then ends it there, any other click starts again. */
export const pickDay = (p: Pick<Plan, 'start' | 'end'>, d: string) => p.start && p.start === p.end && d > p.start ? { start: p.start, end: d } : { start: d, end: d };

/** What the form gets wrong, field by field (empty when the plan can be reviewed). `purposes`: the keys it offers. */
export function validate(p: Plan, purposes: string[]): Errors {
  const e: Errors = {}, team = p.team.trim(), last = isoDay(dayOf(p.from) + (WINDOW_DAYS - 1) * DAY);
  if (!purposes.includes(p.purpose)) e.purpose = 'Choose a test purpose.';
  if (!p.start || !p.end || p.start < p.from || p.end < p.start || p.end > last) e.dates = 'Pick the campaign’s days on the weather window: its first day, then its last.';
  if (!team) e.team = 'Enter the team size.';
  else if (!/^\d+$/.test(team) || +team < 1 || +team > TEAM_MAX) e.team = `Enter the team size as a whole number from 1 to ${TEAM_MAX}.`;
  if (p.notes.length > NOTES_MAX) e.notes = `Keep the notes to ${NOTES_MAX.toLocaleString('en-GB')} characters.`;
  return e;
}

/**
 * Indicative field cost per person-day in US$, low and high: a base plus the site's remoteness from the listing's access
 * block. site_listing.json has no cost (and allows no extra fields), so it is derived here, never stored in the listing.
 * shortcut: a rule of thumb on seeded access values; a costing source (or the engine's listing) replaces it.
 */
export function dayRate(l: SiteListing): [number, number] {
  const a = l.practical.access ?? {}, lo = 150 + 15 * (a.est_travel_hours_from_airport ?? 4) + 2 * (a.nearest_road_km ?? 10);
  return [Math.round(lo / 10) * 10, Math.round(lo * 1.4 / 10) * 10];
}
/** The plan's indicative field cost in US$: the day rate for the whole team over every day. */
export const cost = (l: SiteListing, p: Plan) => dayRate(l).map(r => r * +p.team * days(p)) as [number, number];

// Crockford's base 32: no I, L, O or U, so a reference read aloud or copied by hand stays unambiguous.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** A request's reference: the day it was made, then four characters drawn from everything it asks for. */
export function refOf(key: string, p: Plan, at: number) {
  const x = rng(`${key}|${JSON.stringify(p)}`);
  return `EID-${isoDay(at).slice(2).replace(/-/g, '')}-${Array.from({ length: 4 }, () => B32[Math.floor(x() * 32)]).join('')}`;
}

/** A request as kept: its reference, a copy of the plan, and the names it was made under, which My campaigns lists
 *  before (or without) the search that named its double: the double as the app labels it (an Earth pin by its cell's
 *  country), the listing's name in a sentence ('an unnamed area in Chile'), the target as the crumbs name it. */
export interface Campaign { ref: string; plan: Plan; name: string; place: string; target: string }
const plans: Record<string, Plan> = {}, requests: Record<string, Campaign> = {};
type Kept = { plans: Record<string, Plan>; requests: Record<string, Campaign> };
const str = (x: unknown): x is string => typeof x === 'string';
// A day as the window names it: fmtDay puts its year in the page as it is, and isoDay (validate) throws on a non-date.
const day = (x: unknown): x is string => str(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(dayOf(x));
type Loose = Partial<Record<keyof Plan, unknown>> | null | undefined;
const planIn = (p: Loose): Plan | null =>
  p && day(p.from) && (p.start === '' || day(p.start)) && (p.end === '' || day(p.end)) && str(p.team) && str(p.notes) && str(p.purpose) && Array.isArray(p.gear) && p.gear.every(str)
    ? { purpose: p.purpose, from: p.from, start: p.start, end: p.end, team: p.team, gear: [...p.gear], notes: p.notes } : null;
// A request's key, as the booking flow makes it: '<target body>/<site id>|<double id>' (each id a route segment).
const KEY = /^(mars|moon)\/[^/|]+\|[^/|]+$/;
/** Plans and requests as kept (JSON from site storage, a trust boundary): each whole one, nothing else. A request's
 *  plan passed the checks to be requested (its days on its window, its team a whole number from 1 to TEAM_MAX). */
export function keptOf(json: string | null): Kept {
  const out: Kept = { plans: {}, requests: {} };
  let k; try { k = JSON.parse(json ?? 'null'); } catch { return out; }
  for (const [key, p] of Object.entries<Loose>(k?.plans ?? {})) { const x = planIn(p); if (x) out.plans[key] = x; }
  for (const [key, q] of Object.entries<Partial<Record<keyof Campaign, unknown>> | null>(k?.requests ?? {})) {
    const x = planIn(q?.plan as Loose);
    if (x && !Object.keys(validate(x, [x.purpose])).length && KEY.test(key) && str(q?.ref) && str(q.name) && str(q.place) && str(q.target))
      out.requests[key] = { ref: q.ref, plan: x, name: q.name, place: q.place, target: q.target };
  }
  return out;
}
const KEPT = 'eidolon.booking';
try {
  Object.assign(plans, keptOf(sessionStorage.getItem(KEPT)).plans);
  const keep = () => { try { sessionStorage.setItem(KEPT, JSON.stringify({ plans })); } catch { /* full or blocked: kept as before */ } };
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keep(); });
} catch { /* no storage (blocked site data): plans last the page's life */ }
/** Whether requests outlast the page (this browser keeps site data): My campaigns says where they are kept. */
export let lasting = true;
// Requests as this browser keeps them now, another tab's since included. Once its storage fails (blocked site data, or
// full) the page's own copy is the record, never read over: requests then last the page.
function sync() {
  if (lasting) try { const k = keptOf(localStorage.getItem(KEPT)).requests; for (const x in requests) delete requests[x]; Object.assign(requests, k); } catch { lasting = false; }
}
sync();
/** The plan for one target and double (`key`), started on first use: a requested campaign's own (edited in a later
 *  session), its days picked again once its window has moved on; else the search's purpose, the window from tomorrow. */
export function planOf(key: string, purpose: string, now: number): Plan {
  const from = isoDay(now + DAY), q = requests[key]?.plan;
  return plans[key] ??= q ? { ...q, gear: [...q.gear], ...(q.from < from ? { from, start: '', end: '' } : {}) } : { purpose, from, start: '', end: '', team: '', gear: [], notes: '' };
}
/** Requests the plan (a mock: nothing is sent): keeps a copy of it with its reference and names. One per target and
 *  double, as its confirmation's route: requesting again replaces it.
 *  shortcut: a request can't be withdrawn (it stays until the site's data is cleared); add Withdraw to the confirmation
 *  if campaigns must be cancelled. */
export function request(key: string, p: Plan, now: number, names: Pick<Campaign, 'name' | 'place' | 'target'>) {
  const q = { ref: refOf(key, p, now), plan: { ...p, gear: [...p.gear] }, ...names };
  sync(); requests[key] = q;   // the browser's copy of every other campaign stands: another tab may have requested it since
  if (lasting) try { localStorage.setItem(KEPT, JSON.stringify({ requests })); } catch { lasting = false; }
  return q;
}
/** The request for one target and double, if any (its confirmation). */
export const requestOf = (key: string): Campaign | undefined => requests[key];
/** My campaigns: every request as this browser keeps it now, with the target body, site and double its key names,
 *  soonest first. */
export function campaigns() {
  sync();
  return Object.entries(requests).map(([key, q]) => {
    const [t, dbl] = key.split('|'), [body, site] = t.split('/');
    return { ...q, key, body: body as 'mars' | 'moon', site, dbl };
  }).sort((a, b) => a.plan.start.localeCompare(b.plan.start) || a.key.localeCompare(b.key));
}
