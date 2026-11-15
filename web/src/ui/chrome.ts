// Chrome around the views (prototype 1905–1926, 2128–2131, 2170–2176): breadcrumbs, the compare toggle (with the
// globe compare's same-scale button and the overlay's slider), Search this area on the Earth globe, the status bar and
// its hints, the live region, and the top-bar clocks ticking once a second on the app clock.
import gsap from 'gsap';
import { fmtLight, hms, lightInfo, lmst, marsTime, utcStamp } from '../astro';
import { fmtLL, parsePinId, type Body } from '../coords';
import { BODIES, PICKABLE } from '../data/bodies';
import { campaigns, STEP_NAME } from '../data/booking';
import { centreOf, doublesOf, engine, noDemAt, query, searched } from '../data/client';
import { SITES, siteOf } from '../data/sites';
import { $, $$, esc, setHTML, setStyle, setText } from '../dom';
import { onUpdate, simNow, TOUCH } from '../motion';
import { routeOf, state } from '../router';
import { mapsOf, siteName, titleOf } from '../routes';
import { sheet, SH } from '../scene/layout';
import { sharpest } from '../scene/renderer';
import { keyed } from '../scene/input';
import { LAY, VPS, type Rect } from '../scene/rig';
import { ghost } from '../terrain/mesh';
import { WINDOW_KM } from '../terrain/procedural';
import { sameScale } from '../views/compare';
import { holding } from '../views/site';
import { mixText, searchSay } from './results';
import { setSnap, sheetCovers } from './sheet';

const crumbs = $('#crumbs'), toggle = $('#toggle'), stR = $('#st-r'), stL = $('#st-l'), stM = $('#st-m'), live = $('#live');
let tw = 0, aw = 0;   // the toggle's and Search this area's widths (chrome)
const ui = $('#ui'), panel = $('#panel'), status = $('#status'), divider = $('#divider'), cUtc = $('#c-utc'), cUtd = $('#c-utd'), campsB = $('#camps-btn'), campsN = $('#camps-btn .n'), cMtc = $('#c-mtc'), scaleBtn = $('#toggle [data-scale]'), area = $('#area');
const shint = $('#shint'), mix = $('#mix'), mixIn = $<HTMLInputElement>('#mix input'), mixA = $('#mix .mb');
const skipTo = $('#skipto'), gl = $('#gl'), kf = $('#kf'), liveS = $('#live-s');
skipTo.addEventListener('click', () => document.querySelector<HTMLElement>(skipTo.dataset.to!)?.focus());

// The overlay's slider: the Earth double's weight in the ghosted terrain (terrain/mesh.ts) and in the panel's overlaid
// twins (--mix, panel.css). It keeps its place across routes.
// shortcut: the value isn't in the route (a shared /overlay link opens at 50), add it to routes.ts if links must carry a mix.
function mixed() {
  const v = +mixIn.value, a = siteOf(state.body, state.site ?? undefined), d = siteOf('earth', state.dbl ?? undefined);
  ghost.t = v / 100; setStyle(panel, '--mix', String(ghost.t));
  if (a && d) mixIn.setAttribute('aria-valuetext', mixText(v, a.name, d.name));
}
mixIn.addEventListener('input', mixed);

export function chrome() {
  const s = state, c: [string, string, boolean?][] = [['Solar system', 'system']];
  if (s.view === 'beyond') c.push(['Beyond', 'beyond']);
  if (s.body) c.push([BODIES[s.body].name, s.body]);
  if (s.grid || s.fromGrid) c.push(['Featured sites', `${s.body}/sites`]);
  const st = siteOf(s.body, s.site ?? undefined);
  // The site's and double's names give way first where the bar is short (top.css .lg), never the current step.
  if (st) c.push([siteName(s.body!, st), `${s.body}/${s.site}`, true]);
  if (s.dbl) c.push([`Compared with ${siteOf('earth', s.dbl)!.name}`, routeOf({ ...s, book: null }), true]);
  if (s.book) c.push([STEP_NAME[s.book], routeOf(s)]);
  crumbs.innerHTML = c.map(([l, g, lg], i) => { const k = lg ? ' class="lg"' : '';
    return i === c.length - 1 ? `<span aria-current="page"${k}>${esc(l)}</span>` : `<button data-go="${g}"${k}>${esc(l)}</button><span class="sep">/</span>`; }).join('');
  const on = s.view === 'compare'; toggle.hidden = !on; toggle.style.visibility = on ? 'visible' : 'hidden'; gsap.to(toggle, { opacity: on ? 1 : 0, duration: .3 });
  const mode = s.globe ? 'globe' : s.overlay ? 'overlay' : 'terrain';
  $$('#toggle [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === mode)));
  scaleBtn.hidden = !(on && s.globe); scaleBtn.setAttribute('aria-pressed', String(sameScale()));
  const mixOn = !!(on && s.overlay);
  if (mix.hidden === mixOn) { mix.hidden = !mixOn; if (sheet() && SH.snap === 0) setSnap(0); }   // peek takes in (or gives back) the slider's row (layout.ts)
  if (on && s.overlay) {
    const a = siteOf(s.body, s.site!)!, d = siteOf('earth', s.dbl!)!, b = BODIES[s.body!];
    setStyle(mixA, '--c', b.color); setText(mixA.lastElementChild!, b.name);
    mixIn.setAttribute('aria-label', `Overlay, from ${a.name} to ${d.name}`); mixed();
  }
  // Search this area fades in with the toggle; data-on marks it while the search keeps to an area (ui/panel.ts sets it too).
  // Not during a booking: a new area would change the search under the plan's double. Nor where the search engine has no
  // elevation for the target (no_dem: its doubles are the curated sites, there is no search to keep to an area).
  const areaOn = on && s.globe && !s.book && !(st && !st.iau && noDemAt(s.body!, st.lat));
  if (areaOn && area.hidden) gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: .3 });
  area.hidden = !areaOn; area.toggleAttribute('data-on', !!query.filters.bbox);
  if (areaOn) { tw = toggle.offsetWidth; aw = area.offsetWidth; }   // for placeChrome, as they change only here
  hint();
  gsap.to('#intro-ov', { autoAlpha: s.view === 'overview' ? 1 : 0, duration: .4 });
  live.textContent = c.map(x => x[0]).slice(1).join(', ') || 'Solar system';
  document.title = titleOf(s);
  count();   // a request lands on its confirmation's route
  // The skip link past the top bar: to the panel's heading, or the site grid's.
  const to = s.grid ? '#grid h2' : ['body', 'site', 'compare'].includes(s.view) ? '#pin [tabindex="-1"]' : '';
  skipTo.hidden = !to; skipTo.dataset.to = to; skipTo.textContent = s.grid ? 'Skip to the featured sites' : 'Skip to the panel';
  // The 3D view is a Tab stop where its keys move it (scene/input.ts), named for what they do there.
  const keys = keyView(), b = s.body && BODIES[s.body].name, ter = onTerrain();
  // Elsewhere not focusable at all, not even by a click: the info sheet and Beyond read a focused opener as the keyboard path.
  for (const [k, v] of [['tabindex', '0'], ['role', 'application']]) if (keys) gl.setAttribute(k, v); else gl.removeAttribute(k);
  gl.setAttribute('aria-label', !keys ? '3D view' : ter ? `Terrain${st ? ` of ${st.name}` : ''}. Arrow keys orbit it, plus and minus zoom.`
    : s.view === 'compare' ? `${b} and Earth globes. Arrow keys turn Earth, plus and minus zoom it.`
    : `${b} globe. Arrow keys turn it, plus and minus zoom${PICKABLE.includes(s.body!) ? `, Enter ${s.view === 'site' ? 'searches the point at its centre instead' : 'pins the point at its centre'}` : ''}.`);
  updateStatus();
}

/** My campaigns (ui/campaigns.ts), each with its double's and target's points. One whose site or double this version of
 *  the app can't open (kept by another) is left out: its row would open another view than its confirmation. */
export function listed() {
  return campaigns().flatMap(c => {
    const d = siteOf('earth', c.dbl), t = c.site.startsWith('@') ? parsePinId(c.site) : siteOf(c.body, c.site);
    return d && t ? [{ ...c, d, t }] : [];
  });
}
/** The top bar's count of them, in the button's name too: its words and number would read as one ("My campaigns2"). */
export function count() {
  const k = listed().length; setText(campsN, String(k || ''));
  campsB.setAttribute('aria-label', k ? `My campaigns, ${k} requested` : 'My campaigns');
}

const keyView = () => !state.grid && ['body', 'site', 'compare'].includes(state.view);
const onTerrain = () => !state.globe && (state.view === 'compare' || (state.view === 'site' && !holding()));
// The status bar's hint: the view's gestures, or its keys while the 3D view has the keyboard focus (its frame shows),
// in the same branches as the canvas's name.
function hint() {
  // A touch screen's hints leave Esc out, unless a keyboard drives the 3D view.
  const s = state, kb = keyed() && keyView(), escK = !TOUCH || kb, up = s.book && escK ? ' Esc goes back a step.' : '', zoom = TOUCH ? 'Pinch to zoom.' : 'Scroll to zoom.';
  const out = !escK ? '' : up || ` Esc returns to the ${s.view === 'site' && s.fromGrid ? 'featured sites' : 'globe'}.`, pick = PICKABLE.includes(s.body!);
  stR.textContent = s.view === 'overview' ? 'Select a world'
    : kb ? onTerrain() ? `Arrow keys orbit. + and − zoom.${out}` : s.view === 'compare' ? `Arrow keys turn Earth. + and − zoom it.${up}`
      : `Arrow keys turn the globe. + and − zoom.${pick ? holding() ? ' Enter searches the centre instead.' : ' Enter pins the centre.' : ''}${up}`
    : holding() ? `Drag to rotate. ${TOUCH ? 'Tap' : 'Click'} the surface to search another point instead.`
    : (s.view === 'site' || (s.view === 'compare' && !s.globe)) ? `Drag to orbit. ${zoom}${out}` : `Drag to rotate. ${zoom}${up}`;
  shint.textContent = stR.textContent;   // the phone's sheet shows it under its grip (plan, Visual bugs: Should row)
}
gl.addEventListener('focus', hint); gl.addEventListener('blur', hint);

function updateStatus() {
  const id = state.body;
  let t = `Targets: Moon and Mars. ${SITES.earth.length} established analog sites on Earth`;
  const s = (state.view === 'site' || state.view === 'compare') && siteOf(id, state.site ?? undefined);
  const km = state.view === 'compare' ? WINDOW_KM : s && s.t.ext;
  const c = s && state.view === 'compare' ? centreOf(id!, s) : s;   // compare: the window the engine compared
  if (s && c) t = `${s.custom && !s.iau ? 'Pinned site' : s.name}, ${fmtLL(c.lat, c.lon, id!, 4)}, ${km} × ${km} km`;
  else if (id === 'earth') t = `${SITES.earth.length} established analog sites`;
  else if (id) { const li = lightInfo(id, simNow())!; t = `Earth to ${BODIES[id].name}: one-way light <span class="v">${fmtLight(li.sec)}</span>, range <span class="v">${li.range}</span>`; }
  // A search by coordinates (5–10 s) and a cold engine say so here at once: the doubles box with their progress is
  // below the fold once the terrain shows (a deep link, a pin moved on the site view; on the globe the held frame's
  // readout says it). On a phone the line shows above the sheet (responsive.css).
  const d = state.ready && state.view === 'site' && VPS[0].kind === 'terrain' && s && !s.iau && PICKABLE.includes(id!) ? doublesOf(id!, s) : null;
  if (d?.busy && !d.res) t = `<span class="eng"><i aria-hidden="true"></i>Reading ${BODIES[id!].name} terrain…</span>`;
  if (engine.warming && id) t = '<span class="eng"><i aria-hidden="true"></i>Search engine starting up…</span>';
  setHTML(stL, t);
  saySearch();
  mapsLine();
}
/**
 * The shown site's search in a few words (index.html #live-s), only read here, never asked: on each status update, as
 * its search settles (ui/panel.ts fill) and when one is asked (`again`: a new purpose, filter or area, Try again, Show
 * more) or another site shows. Those empty the region and write it 0.15 s later, so the same sentence as before (a new
 * purpose finding the same closest double, a search settling within the frame it was asked in) is said again.
 */
let sayT: gsap.core.Tween | null = null, sayAt = '';
export function saySearch(again = false) {
  const id = state.body, s = (state.view === 'site' || state.view === 'compare') && siteOf(id, state.site ?? undefined), at = s ? `${id}/${s.id}` : '';
  if (again || at !== sayAt) { sayAt = at; sayT?.kill(); liveS.textContent = ''; sayT = gsap.delayedCall(.15, () => { sayT = null; saySearch(); }); return; }
  const d = state.ready && s ? searched(id!, s) : undefined, t = d && s ? searchSay(d, BODIES[id!].name, !s.iau) : '';
  if (!sayT && liveS.textContent !== t) liveS.textContent = t;
}
/**
 * The quiet line in the status bar (index.html #st-m) while a globe on screen is still on its low tier: the route's
 * worlds (routes.ts mapsOf), on the views that show a globe; never over terrain or the site grid, where it would only hide
 * the hint (and, on a phone, add a line). Asked on each route and status update, and as the full maps land or fail (app.ts).
 */
export function mapsLine() {
  const s = state, globe = s.view === 'overview' || (s.view === 'body' && !s.grid) || (s.view === 'compare' && s.globe);
  stM.classList.toggle('on', globe && !!mapsOf(s)?.some(k => !sharpest(k)));
}

// Status bar, divider and toggle follow the viewports (the panel slides, compare splits; on a phone the sheet moves and
// the pair stacks). On a phone the toggle sits at the top of the bottom sheet, under its grip, instead: over the stage
// it would be under the sheet (plan, Visual bugs: Should row).
export function placeChrome(R: Rect[]) {
  if (sheet() !== (toggle.parentElement === panel)) { if (sheet()) shint.after(toggle); else ui.append(toggle); }
  if (R[1]) { setStyle(divider, 'opacity', String(Math.min(1, LAY.split * 2))); setStyle(divider, 'transform', sheet() ? `translateY(${R[1].y}px)` : `translateX(${R[1].x}px)`); } else setStyle(divider, 'opacity', '0');
  const x = R[0].x, w = (R[1] ? R[1].x + R[1].w : R[0].x + R[0].w) - x;
  setStyle(toggle, 'left', sheet() ? '' : `${x + w / 2}px`);   // in the sheet it flows (and sticks, responsive.css)
  setStyle(status, 'transform', `translateX(${x}px)`); setStyle(status, 'width', `${w}px`);
  setStyle(status, 'bottom', sheet() ? `${(SH.f * 100).toFixed(2)}%` : '');   // on a phone its one line sits on the sheet
  // Search this area: the Earth viewport's lower right, level with the toggle; on a phone its lower left, just above the
  // sheet (the globe and its pins' labels sit right of the caption there; responsive.css anchors it by its left edge).
  if (!area.hidden) {
    setStyle(area, 'visibility', R[1] ? 'inherit' : 'hidden');   // inherit: hidden with #ui under a full sheet (below)
    if (R[1]) {
      // Above the toggle where the stage is too narrow for the two side by side (a tablet, a narrow laptop window).
      const up = !sheet() && x + w / 2 + tw / 2 + 8 > R[1].x + R[1].w - 14 - aw;
      setStyle(area, 'left', `${sheet() ? R[1].x + 14 : R[1].x + R[1].w - 14}px`); setStyle(area, 'top', `${R[1].y + R[1].h - (sheet() ? 14 : up ? 92 : 48)}px`);
    }
  }
  setStyle(ui, 'visibility', sheetCovers() ? 'hidden' : '');   // under a full sheet the stage's labels would show through the top bar
  // The 3D view's focus frame (hud.css #kf), 6 px inside the viewports its keys move (Earth's on compare's globes),
  // ending above the status bar (hud.css takes its height off --kh).
  const a = state.view === 'compare' && state.globe && R[1] ? R[1] : R[0], z = R[1] && !(state.view === 'compare' && state.globe) ? R[1] : a;
  setStyle(kf, 'transform', `translate(${a.x + 6}px,${a.y + 6}px)`); setStyle(kf, 'width', `${z.x + z.w - a.x - 12}px`); setStyle(kf, '--kh', `${z.y + z.h - a.y - 12}px`);
}

// Top-bar clocks and the live values in the panel (light time, Mars local solar time), once a second.
let lastSec = -1;
onUpdate(time => {
  const sec = Math.floor(time); if (sec === lastSec) return; lastSec = sec;
  const now = simNow();
  const u = utcStamp(now); setText(cUtd, u.slice(0, 6)); setText(cUtc, u.slice(6)); setText(cMtc, hms(marsTime(now).mtc).slice(0, 5));   // the date apart: a narrow phone hides it (responsive.css)
  $$('[data-live="owlt"]').forEach(el => setText(el, fmtLight(lightInfo(el.dataset.body as Body, now)!.sec)));
  $$('[data-live="lmst"]').forEach(el => setText(el, lmst(+el.dataset.lon!, now)));
  if (['body', 'site', 'compare', 'overview'].includes(state.view)) updateStatus();
});
