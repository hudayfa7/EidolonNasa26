// The booking flow (docs/plan.md, Must 6) as panel templates: from an Earth double on the compare view to a requested
// test campaign, in four steps that each deep-link under the compare's route (…/book, …/book/plan, …/book/review,
// …/book/done) over the compare's stage. The listing is practical suitability only (data/listing.ts, the engine's
// site_listing.json; its templates in ui/listing.ts), never combined with the terrain match; the mission fit (ui/results.ts
// bookingFit, data/mission.ts) is a separate labelled block on the listing, the plan and the review, a warning and never a
// block; the plan is checked on Review with inline errors; the request is a mock and sends nothing.
import { fmtLL, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { cost, days, EQUIPMENT, fmtDay, NOTES_MAX, offSeason, pickDay, placeOf, planOf, request, requestOf, STEP_NAME, STEPS, TEAM_MAX, UP, validate, windowOf, type Errors, type Field, type Plan, type Step } from '../data/booking';
import { cellsOf, data, doublesOf, lists, query, terrainOf, type Doubles } from '../data/client';
import { siteOf, type Site } from '../data/sites';
import type { MatchResult, SiteListing } from '../data/types.gen';
import { bestMonths, wxAt } from '../data/weather';
import { $, $$, esc } from '../dom';
import { ic } from './icons';
import { wallNow } from '../motion';
import { go, routeOf, state } from '../router';
import { siteName } from '../routes';
import { listingBody, listingLede, months, permits, usd } from './listing';
import { failed, redrawWx, refreshPanel, strip } from './panel';
import { shadowOf } from '../terrain/shadowfit';
import { backBtn, bookingFit, box, fact, purposeLabel, reading, text } from './results';
import { powerClimate } from '../data/climate';
import { barH, dayText, lc, limitsText, marks, monthsSrc, noMonths, srcText } from './weather';

interface Ctx { id: Body; s: Site; d: Site; e: Doubles; hit?: MatchResult; key: string }
// The target, its Earth double and, when the double is a search result (an Earth pin), that result.
function ctx(): Ctx {
  const id = state.body!, s = siteOf(id, state.site!)!, d = siteOf('earth', state.dbl!)!, e = doublesOf(id, s);
  return { id, s, d, e, hit: e.res ? cellsOf(e.res).find(x => x.id === d.id)?.r : undefined, key: `${id}/${s.id}|${d.id}` };
}
const at = (step: Step | null) => routeOf({ ...state, book: step });
// What the listing is derived from: the search result, or an established site's own facts (data/sites.ts: the engine's
// country and access there; the height at its window's centre where that terrain is real; Decisions 70).
const srcOf = (c: Ctx) => c.hit ?? { site_id: c.d.id, location: { lat: c.d.lat, lon: c.d.lon, country: c.d.country, sovereign: c.d.country, access: c.d.access, elevation_m: centreM(c.d) } };
const centreM = (d: Site) => { const T = terrainOf('earth', d).T; return T.src ? Math.round(T.z[(T.N >> 1) * (T.N + 1)]) : undefined; };
const planNow = (c: Ctx) => planOf(c.key, query.purpose, wallNow());
/** What the panel shows of the search (ui/panel.ts fill() redraws when it changes): an established site needs none. */
export const bookKey = () => { const c = ctx(); return !c.d.custom ? 'site' : c.hit ? 'hit' : c.e.err && !c.e.res ? `err:${c.e.err.code}` : c.e.busy ? 'wait' : 'none'; };

// The purposes the plan offers: the search's supported ones once listed, else the one in use.
const offered = (p: Plan) => lists.purposes?.filter(x => x.supported).map(x => x.key) ?? [p.purpose];
const purposeName = (k: string) => purposeLabel(k, lists.purposes?.find(x => x.key === k)?.label);
// The plan's purpose in a sentence: 'rover mobility', 'EVA training' (HTML: a purpose the frontend doesn't name is the
// engine's label).
const purposeIn = (k: string) => esc(lc(purposeName(k)));
// The listing, its best months from NASA POWER's climatology for the plan's purpose once that lands (data/weather.ts),
// none while it loads, else the sample listing's own, said so in its season note.
function listed(c: Ctx) {
  const L = data.listing(srcOf(c)), P = L.practical, p = planNow(c).purpose, m = bestMonths(placeOf(L), p), busy = wxAt(placeOf(L)).cl.busy;
  return { ...L, practical: { ...P, best_months: m ?? (busy ? undefined : P.best_months),
    season_note: m ? monthsSrc(lc(purposeName(p))) : busy ? undefined : `Sample months: the climatology couldn’t be loaded.${P.season_note ? ` ${P.season_note}` : ''}` } };
}
/** The purpose select's options (ui/panel.ts fills them again when the purposes land). */
export const purposeOptions = () => { const p = planNow(ctx()); return offered(p).map(k => `<option value="${esc(k)}"${k === p.purpose ? ' selected' : ''}>${esc(purposeName(k))}</option>`).join(''); };

const steps = (now: Step) => `<ol class="bsteps" aria-label="Campaign steps">${STEPS.map((x, i) =>
  `<li${x === now ? ' aria-current="step"' : i < STEPS.indexOf(now) ? ' class="done"' : ''}>${STEP_NAME[x]}</li>`).join('')}</ol>`;
const head = (step: Step, title: string) => { const up = UP[step]; return `${backBtn(up ? STEP_NAME[up] : 'Comparison', at(up))}${steps(step)}<h2 class="title" tabindex="-1">${title}</h2>`; };
const btn = (to: string, label: string, primary = false) => `<button class="btn${primary ? ' primary' : ''}" data-go="${to}">${label}</button>`;
// Names (Decisions 75): each step is headed by the double as the app labels it everywhere (crumbs, stage, compare: an
// established site's name, else a cell's country); sentences use the listing's own name (schema: the nearest named
// place), 'Unnamed area in X' (the engine's: 'near <place>') reading 'an unnamed area in X'.
const placeOfL = (L: SiteListing) => L.known_analog ? L.name : L.name.replace(/^Unnamed/, 'an unnamed');
const named = (L: SiteListing) => text(placeOfL(L));
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const span = (p: Pick<Plan, 'start' | 'end'>) => `${fmtDay(p.start, true)}${days(p) > 1 ? ` to ${fmtDay(p.end, true)}` : ''}`;
// The caveat on days that reach outside the listing's best months: the climatology's for the plan's purpose (every day,
// when it has none), or the sample listing's with its season note (HTML: the note is escaped); none while they load.
const season = (L: SiteListing, p: Plan) => !offSeason(L, p) ? ''
  : bestMonths(placeOf(L), p.purpose) ? L.practical.best_months!.length ? `Outside the best months for ${purposeIn(p.purpose)} (${months(L)}).` : noMonths(purposeIn(p.purpose))
  : `Outside the field site’s best months (${months(L)}).${L.practical.season_note ? ` ${text(L.practical.season_note)}` : ''}`;

// The mission fit for the campaign's purpose (ui/results.ts bookingFit): terrain and climate from the search result when the double is one,
// the workable months and the shadow fit from the site's weather and both windows. A warning, never a block.
// The result's climate is NASA POWER's (data/climate.ts powerClimate), not the engine's WorldClim values.
const hitClimate = (c: Ctx, L: SiteListing) => c.hit && { ...c.hit, environment: powerClimate(c.hit.environment, wxAt(placeOf(L)).cl.v) };
const fitHTML = (c: Ctx, L: SiteListing, purpose: string) => bookingFit({ r: hitClimate(c, L), purpose, label: purposeName(purpose), body: c.id, months: bestMonths(placeOf(L), purpose),
  busy: wxAt(placeOf(L)).cl.busy, shadow: shadowOf(terrainOf(c.id, c.s).T, BODIES[c.id].R, terrainOf('earth', c.d).T) });

function listingHTML(c: Ctx, L: SiteListing) {
  const st = strip('earth', c.d);
  return `${head('listing', esc(c.d.name))}<p class="coords">${ic('site')}${fmtLL(L.lat, L.lon, 'earth', 4)}</p>
    ${listingLede(L.name === c.d.name ? c.d.place ?? L.name : L.name, L, c.s.name)}
    ${fitHTML(c, L, planNow(c).purpose)}
    <div class="actions">${btn(at('plan'), 'Plan a test campaign here', true)}</div>
    ${st.html}${st.credit ? `<p class="fine credit">${st.credit}</p>` : ''}
    ${listingBody(L, srcOf(c).location, hitClimate(c, L)?.environment, !!c.hit, `Best months for ${purposeIn(planNow(c).purpose)}`, wxAt(placeOf(L)).cl.busy)}`;
}

// The weather window as day buttons (the dates are picked on it): a click starts the campaign, a later one ends it.
const inRange = (p: Plan, iso: string) => !!p.start && iso >= p.start && iso <= p.end;
// How many of the plan's days sit under its purpose's limits: none said while the forecast loads.
const under = (L: SiteListing, p: Plan) => { const w = windowOf(L, p); return w.src === 'loading' ? '' : `, ${w.days.filter(d => inRange(p, d.iso) && !d.over.length).length} under the limits`; };
// The summary under the days, as HTML (the click handler writes it so too).
function datesLine(L: SiteListing, p: Plan) {
  if (!p.start) return 'No days picked yet.';
  const n = days(p), out = season(L, p);
  return `${fmtDay(p.start)}${n > 1 ? ` to ${fmtDay(p.end)}` : ''} · ${plural(n, 'day', 'days')}${under(L, p)}.${out ? ` ${out}` : ''}`;
}

function planHTML(c: Ctx, L: SiteListing) {
  const p = planNow(c), er = errs[c.key] ?? {}, win = windowOf(L, p);
  const inv = (f: Field) => er[f] ? ' aria-invalid="true"' : '';
  const desc = (f: Field, ...ids: string[]) => { const x = [...ids, er[f] && `b-${f}-e`].filter(Boolean).join(' '); return x ? ` aria-describedby="${x}"` : ''; };
  const msg = (f: Field) => er[f] ? `<p class="ferr" id="b-${f}-e">${er[f]}</p>` : '';
  // A dates error describes each day too: screen readers skip a group's description when the focus lands inside it.
  // The month shows on the first day and where a month starts.
  // Each day has an id, so a redraw of the window (the forecast landing, a new purpose) keeps the focus on it.
  // Its weather is in its name, and its tooltip for a mouse: why a grey day is grey (a dot says rain or temperature).
  // The name is its content and starts with what it shows ("Mo 5, Mon 5 Oct: wind …"; WCAG 2.5.3, so voice control can
  // say it), the marks themselves hidden: as separate grid items they'd read "Mo5".
  const day = (w: typeof win.days[number], i: number) => { const m = i === 0 || w.iso.endsWith('-01'), t = dayText(w, w.over, win.src);
    const wd = m ? fmtDay(w.iso).slice(-3) : fmtDay(w.iso).slice(0, 2), n = +w.iso.slice(8);
    return `<li><button type="button" id="b-day-${w.iso}" class="day${marks(w, w.over, win.src)}" data-day="${w.iso}" aria-pressed="${inRange(p, w.iso)}" title="${t}"${er.dates ? ' aria-describedby="b-dates-e"' : ''}>
      <span class="sr">${wd} ${n}, ${t}</span><span class="bar" style="--h:${barH(w)}" aria-hidden="true"></span><span class="w${m ? ' m' : ''}" aria-hidden="true">${wd}</span><span class="n" aria-hidden="true">${n}</span></button></li>`; };
  return `${head('plan', 'Plan a campaign')}<p class="lede">At ${named(L)}, testing for ${c.s.name}.</p>
    <form class="bform" data-plan data-try="${tries}" novalidate>
      <p class="fine">Test purpose, dates and team size are required; equipment and notes are optional.</p>
      <label class="fl" for="b-purpose">${ic('purpose')}Test purpose</label>
      <select id="b-purpose" class="sel" aria-required="true"${inv('purpose')}${desc('purpose')}>${purposeOptions()}</select>${msg('purpose')}
      ${fitHTML(c, L, p.purpose)}
      <fieldset class="fs" data-wx${inv('dates')}${desc('dates', 'b-dates-s', 'b-dates-h')}><legend class="fl">${ic('dates')}Dates</legend>
        <ol class="days${win.src === 'loading' ? ' load' : ''}">${win.days.map(day).join('')}</ol>
        <p class="dsum" id="b-dates-s" aria-live="polite">${datesLine(L, p)}</p>
        <p class="fine" id="b-dates-h">The next ${win.days.length} days. Bars show each day’s strongest wind, a dot rain or temperature over the limits. Blue days sit under the limits for ${purposeIn(p.purpose)}: ${limitsText(p.purpose)}. Pick the first day, then the last. ${srcText(win.src)}</p>
      </fieldset>${msg('dates')}
      <label class="fl" for="b-team">${ic('team')}Team size</label>
      <div class="cfield"><input id="b-team" inputmode="numeric" autocomplete="off" spellcheck="false" aria-required="true" value="${esc(p.team)}"${inv('team')}${desc('team', 'b-team-h')}></div>
      <p class="fine" id="b-team-h">People on site, 1 to ${TEAM_MAX}.</p>${msg('team')}
      <fieldset class="fs"><legend class="fl">${ic('equipment')}Equipment</legend>${Object.entries(EQUIPMENT).map(([k, v]) =>
        `<label class="ck"><input type="checkbox" name="gear" value="${k}"${p.gear.includes(k) ? ' checked' : ''}>${v}</label>`).join('')}</fieldset>
      <label class="fl" for="b-notes">${ic('notes')}Notes</label>
      <textarea id="b-notes" rows="4" maxlength="${NOTES_MAX}"${inv('notes')}${desc('notes', 'b-notes-h')}>${esc(p.notes)}</textarea>
      <p class="fine" id="b-notes-h">Optional: objectives, access needs, anything the field site should know.</p>${msg('notes')}
      <div class="actions"><button class="btn primary" type="submit">Review the request</button></div>
    </form>
    <p class="fine">A mock-up: nothing is sent.</p>`;
}

function reviewHTML(c: Ctx, L: SiteListing) {
  const p = planNow(c);
  if (Object.keys(validate(p, offered(p))).length) return `${head('review', 'Review the request')}${box('No complete plan to review yet', '',
    'The plan needs a test purpose, its days on the weather window and a team size.', `<div class="actions">${btn(at('plan'), 'Plan a campaign', true)}</div>`)}`;
  const n = days(p), team = +p.team, [lo, hi] = cost(L, p), out = season(L, p);
  return `${head('review', 'Review the request')}<p class="lede">A test campaign for ${c.s.name}, ${BODIES[c.id].name}, at one of its Earth doubles.</p>
    <dl class="facts" data-wx>${fact('Field site', `${esc(c.d.name)}<span class="sub n">${fmtLL(L.lat, L.lon, 'earth', 4)}</span>`, 'wide w')}
      ${fact('Test purpose', esc(purposeName(p.purpose)), 'wide w')}
      ${fact('Dates', `${span(p)}<span class="sub">${plural(n, 'day', 'days')}${under(L, p)}</span>${out ? `<span class="sub">${out}</span>` : ''}`, 'wide w')}
      ${fact('Team size', plural(team, 'person', 'people'), 'w')}${fact('Days on site', plural(n, 'day', 'days'), 'w')}
      ${fact('Equipment', p.gear.map(k => EQUIPMENT[k]).filter(Boolean).join(', ') || 'None listed', 'wide w')}
      ${fact('Notes', p.notes.trim() ? esc(p.notes.trim()) : 'None', 'wide w pre')}</dl>
    ${fitHTML(c, L, p.purpose)}
    <h3 class="sec">${ic('cost')}Indicative cost</h3><dl class="facts">${fact('Field costs on site', `US$&nbsp;${usd(lo)}–${usd(hi)}`, 'wide')}</dl>
    <p class="fine">The field site’s day rate for ${plural(team, 'person', 'people')} over ${plural(n, 'day', 'days')}. Flights and equipment shipping not included; not a quote.</p>
    <h3 class="sec">${ic('permits')}Permits</h3>${permits(srcOf(c).location, L)}
    <div class="actions">${btn(at('plan'), 'Edit the plan')}<button class="btn primary" data-request>Request the campaign</button></div>
    <p class="fine">A mock-up: requesting sends nothing and contacts no one. It ends with a sample reference number.</p>`;
}

// From the request alone (its names as made): My campaigns opens it in a later session, its double's search not in yet.
function doneHTML(c: Ctx) {
  const q = requestOf(c.key);
  if (!q) return `${head('done', 'Campaign requested')}${box('No campaign requested here yet', '', 'Plan a campaign at this field site, review it, then request it.',
    `<div class="actions">${btn(at('plan'), 'Plan a campaign', true)}</div>`)}`;
  const p = q.plan, team = +p.team;
  return `${head('done', 'Campaign requested')}<p class="ref"><span>Reference</span>${esc(q.ref)}</p>
    <p class="lede">A team of ${team} testing for ${c.s.name} at ${text(q.place)}, ${span(p)}.</p>
    <div class="actions">${btn(at(null), 'Back to the comparison', true)}${btn(at('plan'), 'Edit the plan')}</div>
    <p class="fine">It’s listed in <button data-camps aria-haspopup="dialog">My campaigns</button>. A mock-up: nothing was sent and no one was contacted.</p>`;
}

/** The current booking step for the compare's target and double. A double that is a search result waits for it, and
 *  shows its failure as the compare does (warming up asked again by itself, the rest with Try again). */
export function bookHTML() {
  const c = ctx(), step = state.book!;
  if (step === 'done' && requestOf(c.key)) return doneHTML(c);
  if (c.d.custom && !c.hit) return `${head(step, esc(c.d.name))}${c.e.err && !c.e.res ? failed(c.id, c.s, c.e)
    : c.e.busy ? c.s.iau ? '<p class="fine">Searching Earth…</p>' : reading(c.e, BODIES[c.id].name)
    : box('This Earth pin isn’t among the search’s results', '', 'Its listing comes from the search that found it. Pick one of the doubles on the comparison.', `<div class="actions">${btn(at(null), 'Back to the comparison')}</div>`)}`;
  const L = listed(c);
  return step === 'plan' ? planHTML(c, L) : step === 'review' ? reviewHTML(c, L) : step === 'done' ? doneHTML(c) : listingHTML(c, L);
}

// The form writes through to the plan as it is filled, so a redraw (a late search, the purposes landing) keeps it.
const pin = $('#pin'), errs: Record<string, Errors> = {};
// Counts Reviews, so each one redraws its errors: fixed() takes them out in place, behind setHTML's cache of the panel.
let tries = 0;
function edit(e: Event) {
  const t = e.target as HTMLInputElement; if (!state.book || !t.closest('[data-plan]')) return;
  const c = ctx(), p = planNow(c);
  if (t.id === 'b-purpose') { p.purpose = t.value; redrawWx(); }   // the days' marks, limits and best months follow it
  else if (t.id === 'b-team') p.team = t.value;
  else if (t.id === 'b-notes') p.notes = t.value;
  else if (t.name === 'gear') p.gear = $$<HTMLInputElement>('[name="gear"]:checked', pin).map(x => x.value);
  fixed(c, p);
}
// An error shown on Review goes as soon as its field is right (new ones wait for the next Review), in place: from
// every element it describes (the dates' group and each day).
function fixed(c: Ctx, p: Plan) {
  const er = errs[c.key], now = validate(p, offered(p)); if (!er) return;
  for (const f of Object.keys(er) as Field[]) {
    if (now[f]) continue;
    delete er[f]; pin.querySelector(`#b-${f}-e`)?.remove();
    for (const el of $$(`[aria-describedby~="b-${f}-e"]`, pin)) {
      const d = el.getAttribute('aria-describedby')!.replace(`b-${f}-e`, '').trim();
      el.removeAttribute('aria-invalid'); if (d) el.setAttribute('aria-describedby', d); else el.removeAttribute('aria-describedby');
    }
  }
}
pin.addEventListener('input', edit);
pin.addEventListener('change', edit);
// Escape in the purpose or a text field leaves the field, not the step (as in the coordinate field); while an input
// method composes, it is the IME's.
pin.addEventListener('keydown', e => {
  const t = e.target as HTMLElement;
  if (e.key !== 'Escape' || !state.book || !t.matches('#b-purpose, #b-team, #b-notes')) return;
  e.stopPropagation(); if (!e.isComposing) t.blur();
});
pin.addEventListener('click', e => {
  if (!state.book) return;
  const t = e.target as Element, day = t.closest<HTMLElement>('[data-day]');
  if (day) {
    // Marked in place (no redraw): the focused day and the live summary line stay the same elements.
    const c = ctx(), p = planNow(c);
    Object.assign(p, pickDay(p, day.dataset.day!));
    $$('[data-day]', pin).forEach(b => b.setAttribute('aria-pressed', String(inRange(p, b.dataset.day!))));
    $('#b-dates-s', pin).innerHTML = datesLine(listed(c), p);
    fixed(c, p);
  } else if (t.closest('[data-request]')) {
    const c = ctx(); request(c.key, planNow(c), wallNow(), { name: c.d.name, place: placeOfL(listed(c)), target: siteName(c.id, c.s) }); go(at('done'));
  }
});
// Review: checked here; what is wrong shows under each field and the first one takes the focus (its error is in its
// description).
pin.addEventListener('submit', e => {
  if (!(e.target as Element).closest('[data-plan]')) return;
  e.preventDefault();
  const c = ctx(), p = planNow(c), er = validate(p, offered(p)), first = Object.keys(er)[0];
  if (!first) { delete errs[c.key]; go(at('review')); return; }
  errs[c.key] = er; tries++; refreshPanel();
  $(first === 'dates' ? '[data-day]' : `#b-${first}`, pin).focus();
});
