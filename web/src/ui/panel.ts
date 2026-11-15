// Panel templates (prototype 1653–1751): plain template functions, rendered into #pin. A target site's Earth doubles
// come from the data seam's search (data/client.ts) and fill in when it lands.
import gsap from 'gsap';
import { fmtLight, lightInfo, lmst } from '../astro';
import { DATUM, fmtDMS, fmtKm, fmtLL, fmtM, latStr, lonStr, pinId, type Body } from '../coords';
import { BODIES, PICKABLE } from '../data/bodies';
import { AS_ENGINE, askLists, cellsOf, doublesOf, imageOf, K, knownOf, lists, MOCK, MORE, ownShadeOf, query, shadeOf, terrainOf, type Doubles, type Filters } from '../data/client';
import { fmtDay } from '../data/booking';
import { EARTH_BY, rehearsesFor, siteOf, SITES, surfaceOf, type Site } from '../data/sites';
import { EngineError } from '../data/api';
import { bestMonths, daysAt, onWeather, over, skinAt, todayAt, wxAt } from '../data/weather';
import { $, $$, copyText, esc, setHTML } from '../dom';
import { CAPTURE, fillBar, RM, simNow, TOUCH, wallNow } from '../motion';
import { FACTOR_LABEL, FACTOR_ORDER, profileOf } from '../data/mission';
import { buildScenes, go, routeOf, state, type Route } from '../router';
import { focusPanel } from '../scene/frame';
import { earthInView, keyed } from '../scene/input';
import { VPS } from '../scene/rig';
import { credit, creditName, cropOf, GLOBE_SRC } from '../terrain/dem';
import { hazard, sunSet } from '../terrain/mesh';
import { knownAnalogs } from '../data/analogs';
import { shadowOf } from '../terrain/shadowfit';
import { landing } from '../ellipse';
import { vt } from './vtools';
import { genTerrain } from '../terrain/procedural';
import { chrome, saySearch } from './chrome';
import { buildMarkers } from './markers';
import { buildTUI, redoCaptions } from './terrain-ui';
import { bookHTML, bookKey, purposeOptions } from './booking';
import { monthsText } from './listing';
import { backBtn, banner, card, detail, fact, failure, legend, noAnalog, noData, NO_SHADE, placeTag, purposeLabel, purposeText, reading, SAMPLE, skeleton, targetNote, TESTED, twins, unlistedNote, warming, existingBlock } from './results';
import { powerClimate } from '../data/climate';
import { targetSearchHTML } from './target-search';
import { peeked, setSnap } from './sheet';
import { barH, dayText, lc, limitsText, marks, monthsSrc, srcText } from './weather';
import { ellipseHTML } from './ellipse';
import { measureHTML } from './measure';
import { cmpSlopeHTML, mapLabel, slopeHTML } from './slope';
import { sunHTML } from './sun';
import { drawCrop, drawMap, movable } from './topomap';

const pin = $('#pin'), panel = $('#panel');
interface RowOpts { go: string; name: string; color: string; sub?: string; meta?: string; live?: string; sel?: boolean }
const row = (o: RowOpts) => `<li><button class="row${o.sel ? ' is-sel' : ''}" data-go="${o.go}"${o.sel ? ' aria-current="true"' : ''}><span class="dot" style="--c:${o.color}"></span><span class="nm">${o.name}</span><span class="mt"${o.live || ''}>${o.meta || ''}</span>${o.sub ? `<span class="sb">${o.sub}</span>` : ''}</button></li>`;
function facts(id: Body) {
  const b = BODIES[id], li = lightInfo(id, simNow());
  return `<dl class="facts">${b.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}${li ? `<div class="wide"><dt>One-way light from Earth</dt><dd data-live="owlt" data-body="${id}">${fmtLight(li.sec)}</dd></div>` : ''}</dl>`;
}

// A week of weather from the place's today (data/weather.ts; ui/weather.ts): each day's strongest wind as a bar, blue
// where the day sits under the limits of the search's purpose, a dot where its rain or temperature doesn't; then the
// best months for it from NASA POWER's climatology.
function wx(s: Site) {
  const p = query.purpose, name = esc(lc(purposeLabel(p))), w = daysAt(s, todayAt(s, wallNow()), 7), best = bestMonths(s, p);
  return `<div class="wx" data-wx><h3 class="sec">Weather window</h3><ol${w.src === 'loading' ? ' class="load"' : ''} aria-label="Seven-day weather">${w.days.map(d => { const o = over(d, p), t = dayText(d, o, w.src), m = marks(d, o, w.src);
    return `<li${m ? ` class="${m.trim()}"` : ''} title="${t}"><span class="bar" style="--h:${barH(d)}"></span><span class="d" aria-hidden="true">${fmtDay(d.iso).slice(0, 2)}</span><span class="sr">${t}</span></li>`; }).join('')}</ol>
    <p class="fine">Bars show each day’s strongest wind, a dot rain or temperature over the limits. Blue days sit under the limits for ${name}: ${limitsText(p)}. ${srcText(w.src)}</p>
    <dl class="facts">${fact(`Best months for ${name}`, best ? monthsText(best) : wxAt(s).cl.busy ? 'Loading…' : 'Not available', 'wide w')}</dl>
    ${best ? `<p class="fine">${monthsSrc(name)}</p>` : ''}</div>`;
}
// A weather feed landed, or the plan's purpose changed (ui/booking.ts): the panel's weather parts ([data-wx]) redraw in
// place from a fresh render, so the maps, the form and the focus outside them stay.
export function redrawWx() {
  const old = $$('[data-wx]', pin); if (!old.length || (state.view !== 'site' && state.view !== 'compare')) return;
  const t = document.createElement('template'); t.innerHTML = panelHTML();
  $$('[data-wx]', t.content).forEach((el, i) => { if (old[i]) swap(old[i], el.innerHTML); });
}
onWeather(redrawWx);
// The orbital crops (context and regional: the image cut for the site where there is one, else resampled from the
// globe's map) and the surface slot: its photograph, lazily, or why there is none (data/sites.ts surfaceOf); with the
// images' credit line, the photograph's linking its page in NASA's library (also the booking listing's).
export function strip(id: Body, s: Site) {
  const kms = [s.t.ext * 12, s.t.ext * 3.5], ph = surfaceOf(id, s);
  const crop = (km: number, kind: string) => { const c = cropOf(id, s.lat, s.lon, km);
    return `<figure><canvas width="240" height="240" data-crop="${id}|${s.lat}|${s.lon}|${km}|${s.t.ext}${c ? `|${c.url}` : ''}" aria-label="Orbital ${kind.toLowerCase()} image"></canvas><figcaption>${kind}, ${fmtKm(km)}</figcaption></figure>`; };
  const surf = typeof ph === 'string' ? `<div class="ph">${ph}</div>`
    : `<img src="${import.meta.env.BASE_URL}photos/${ph.key}.jpg" width="320" height="320" loading="lazy" decoding="async" alt="${esc(ph.alt)}">`;
  const img = [...new Set(kms.map(km => credit(cropOf(id, s.lat, s.lon, km)?.src ?? GLOBE_SRC[id])))].filter(Boolean);
  const credits = [img.length && `Images: ${img.map(esc).join('. ')}.`, typeof ph !== 'string'
    && `Surface: <a href="https://images.nasa.gov/details/${ph.id}" target="_blank" rel="noopener">${esc(ph.what)}</a> · ${esc(ph.by)}.`].filter(Boolean);
  return { html: `<div class="imgs">${crop(kms[0], 'Context')}${crop(kms[1], 'Regional')}<figure>${surf}<figcaption>Surface</figcaption></figure></div>`, credit: credits.join(' ') };
}
// Topographic map with its caption and measure, its sunlight, slope hazard and landing ellipse, then the strip, with the credit lines of
// the terrain and images shown.
const siteMedia = (id: Body, s: Site) => `${siteMap(id, s)}${siteExtras(id, s)}`;
// The topographic map, at the top of a target's site view: the site at a glance beside its doubles' orbital images.
// Measure stays under the map it draws on (one line until it is on); the look of the block and map is in View tools (renderTools).
const siteMap = (id: Body, s: Site) => `<div class="map"><canvas width="640" height="640" data-map="${id}|${s.id}"${movable(id, s) ? ' data-move' : ''} aria-label="${esc(mapLabel(s, id))}"></canvas><div class="mread" hidden></div></div>
  ${measureHTML(id, s)}`;
// The Info dropdown: under the doubles in a target's site view, so the list starts high.
function siteExtras(id: Body, s: Site) {
  const terr = credit(genTerrain(id, s).src);
  const st = strip(id, s);
  // The terrain's source, or its caveat: a phone hides the stage's note (responsive.css), so the panel says it.
  const credits = [terr ? `Terrain: ${esc(terr)}.` : 'Terrain: illustrative.', st.credit].filter(Boolean);
  return `${keep('info', 'Info', `${coordInfo(id, s)}${st.html}${credits.length ? `<p class="fine credit">${credits.join(' ')}</p>` : ''}`, false, 'Coordinates, imagery, credits')}`;
}
/**
 * The View tools window (ui/vtools.ts) for the site view: sunlight, slope hazard and landing ellipse, which change how the block and the
 * map look. Collapsed to its title until opened, and open by itself while one of them is on; empty and hidden on every other view.
 */
let vtOpen = false, vtKey = '';
vt.addEventListener('toggle', e => { const d = e.target as HTMLDetailsElement; if (d.classList?.contains('vtd')) vtOpen = d.open; }, true);
export function renderTools() {
  const s = state.view === 'site' && state.body ? siteOf(state.body, state.site ?? undefined) : undefined;
  // Written once per site, so a redraw of the same route keeps a slider's drag and the focus inside the window.
  const key = s ? `${state.body}|${s.id}|${s.lat}|${s.lon}` : '';
  if (key === vtKey) return;
  vtKey = key; vt.hidden = !s;
  if (!s) { vt.innerHTML = ''; return; }
  const id = state.body!, open = vtOpen || sunSet.on || hazard.on || landing.on;
  vt.innerHTML = `<details class="vtd"${open ? ' open' : ''}><summary><span class="chev" aria-hidden="true"></span>View tools<span class="nf">Sun, slopes, ellipse</span></summary>
    <div class="vtb">${sunHTML(id, s)}${slopeHTML(id, s)}${ellipseHTML(id, s)}</div></details>`;
}
// The site panel's dropdowns (Info, Known analogs): each keeps its open state across the panel's redraws.
const kept = new Set<string>();
const keep = (key: string, title: string, body: string, force = false, hint = '') =>
  `<details class="drawer grp" data-keep="${key}"${force || kept.has(key) ? ' open' : ''}><summary><span class="chev" aria-hidden="true"></span>${title}${hint ? `<span class="nf">${hint}</span>` : ''}</summary>${body}</details>`;
// The site's coordinates: editable (Enter moves the pin) on the target bodies, read-only on Earth.
function coordBlock(id: Body, s: Site) {
  const pick = PICKABLE.includes(id);
  // One row: the field and Copy. Its degrees-minutes-seconds and datum sit in the Info dropdown (coordInfo); the message line shows only
  // when there is something to say (an error, a move), and the editing hint is the field's description.
  const hint = pick ? `Edit and press Enter to ${s.iau && s.custom ? 'drop a pin there instead' : 'move the pin'}.` : '';
  return `<div class="cform"><div class="cfield"><input id="cin" data-mode="site" ${pick ? '' : 'readonly '}value="${fmtLL(s.lat, s.lon, id, 4)}" aria-label="Site coordinates" aria-describedby="cmsg chint"${hint ? ` title="${hint}"` : ''} spellcheck="false" autocomplete="off">
    <button class="btn" data-copy>Copy</button></div>
    <p class="cmsg site" id="cmsg" aria-live="polite"></p><span class="sr" id="chint">${hint}</span></div>`;
}
const coordInfo = (id: Body, s: Site) => `<dl class="facts">${fact('Coordinates', `${fmtDMS(s.lat, s.lon, id)}`, 'wide')}${fact('Reference', DATUM[id], 'wide w')}</dl>`;

// The doubles section: the search's results as cards (ui/results.ts) under the capability banner, five, then up to 20,
// or its state (ui/results.ts): while it runs, by its source (spec §3.5: a search by name from the cache shows nothing
// unless it is slow, one with filters a skeleton, one by coordinates its progress), and when it fails, keyed on the error
// code (spec §6): warming up (asked again by itself, with the warm-up's progress), the rest with a way on. Without
// elevation data (no_dem) a featured site lists its curated analog sites, unscored.
const btn = (attr: string, label: string) => `<div class="actions"><button class="btn" ${attr}>${label}</button></div>`;
export const failed = (id: Body, s: Site, e: Doubles) => { const c = e.err!.code; return c === 'warming_up' ? warming(e) : failure(c, c === 'unknown_target'
  ? `<div class="actions"><button class="btn" data-find>Find it by its IAU name</button><button class="btn" data-go="${id}/${pinId(s.lat, s.lon)}">Search by coordinates</button></div>`
  : c === 'unsupported_purpose' ? '' : btn('data-retry', 'Try again')); };   // the same purpose would be refused again
function doublesHTML(id: Body, s: Site, e: Doubles, sel?: string) {
  const list = e.res ? cellsOf(e.res) : [], known = knownOf(s, e);
  // Without elevation data (the Moon beyond 60°) nothing is matched: no "closest" in the head.
  // The app's main answer: in the site view a large heading high in the panel (Earth doubles), the cards straight under it.
  // Its side line names the best known analog for the mission (the list of them sits right under the cards).
  const best = knownAnalogs(query.purpose, id)[0]?.a.name;
  const head = sel ? `<h3 class="sec">Doubles for ${s.name}</h3>` : `<h3 class="dh" id="doubles">${known.length ? 'Established analog sites on Earth' : 'Earth doubles'}${
    known.length || e.err?.code === 'no_dem' || !best ? '' : `<span class="nf">best known analog: ${esc(best)}</span>`}</h3>`;
  const to = (dbl: string) => routeOf({ body: id, site: s.id, dbl });
  const compare = (dbl: string, what = 'the closest double') => sel ? '' : `<div class="actions"><button class="btn primary" data-go="${to(dbl)}">Compare with ${what}</button></div>`;
  if (e.err?.code === 'no_dem') return `${known.length ? compare(known[0], 'an analog site') : ''}${head}${noData(!!s.custom, known.length > 0, creditName(genTerrain(id, s).src))}
    ${known.length ? `<ul class="rows">${known.map(did => { const d = EARTH_BY[did];
      return row({ go: to(did), name: d.name, sub: d.place, color: BODIES.earth.color, sel: did === sel }); }).join('')}</ul>` : ''}`;
  const nf = Object.keys(query.filters).length;
  if (e.err && !e.res) return `${head}${failed(id, s, e)}`;
  if (!e.res) return `${head}${s.iau ? skeleton(!nf) : reading(e, BODIES[id].name)}`;
  const tn = targetNote(e.res.target, s.name);
  if (!list.length) return `${head}${tn}${banner(e.res.target)}<p class="fine">No Earth doubles match ${nf ? 'these filters' : 'this search'}.</p>${nf ? btn('data-filters-clear', 'Clear filters') : ''}`;
  // A compare whose Earth pin a new purpose or filter left out (only the query it was opened under asks for the 20).
  const away = !!sel && !e.busy && !!siteOf('earth', sel)?.custom && !list.some(x => x.id === sel);
  // "Show more" while the search may have more to give (it returned all it was asked for), up to 20. When it fails, the
  // cards stay and its error and Try again take the button's place.
  const more = e.busy ? btn('disabled', 'Loading more…') : e.err ? failed(id, s, e)
    : e.k < MORE && e.res.results.length >= e.k ? btn('data-more', 'Show more') : '';
  // Order: the heading, the known analogs (one collapsed line), the capability banner (spec §5.2: above the results), the cards; then
  // what explains them (the marks' legend, the count away from listed analogs, the IAU note) and the compare button.
  return `${head}${away ? '<p class="fine">The compared Earth pin isn’t among this search’s results.</p>' : ''}<div class="slim">${banner(e.res.target)}</div>
    ${noAnalog(e.res) ? `<p class="lede">No close analog in this region. These are the closest available.</p>${nf
      ? `<p class="fine">Filters narrow where on Earth the search looks. Without them it may find closer terrain.</p>${btn('data-filters-clear', 'Clear filters')}` : ''}` : ''}
    <ul class="results">${list.map(({ r, id: did }) => card(r, to(did), did === sel)).join('')}</ul>${more}
    ${sel ? '' : existingBlock(query.purpose, id, kept.has('analogs'))}
    ${legend}${unlistedNote(list.map(x => x.r))}${tn}${compare(list[0].id)}
    <p class="fine">${TESTED}${!sel && MOCK ? SAMPLE : ''}</p>`;
}
const doublesBox = (id: Body, s: Site, sel?: string) => { const e = doublesOf(id, s);
  // Not a live region: the search's state is said in a few words (ui/chrome.ts, #live-s), not its five cards read out.
  return `<div data-doubles tabindex="-1" aria-busy="${e.busy}">${doublesHTML(id, s, e, sel)}</div>`; };
// The hillshades, lazily (spec §3.7): the engine's images (`data-thumb`), or a window drawn from its elevation
// (`data-shade`: body|site, a target searched by coordinates), or from Eidolon's own terrain (`data-own`: body|site, the
// grid's where the engine has none: alone, or after `data-shade` answers no_dem). A missing one (404 no_image) shows the
// placeholder (spec §6), in place of a twin, or in a card's tile, so it reads apart from one still loading.
export function thumbs(root: ParentNode) {
  for (const img of $$<HTMLImageElement>('img[data-thumb]:not([src]),img[data-shade]:not([src]),img[data-own]:not([src])', root)) {
    const none = () => { (img.closest('.twins .th') ?? img).outerHTML = NO_SHADE; };
    const at = (k?: string) => { const [b, id] = (k ?? '').split('|') as [Body, string]; return [b, siteOf(b, id)] as const; };
    const [b, s] = at(img.dataset.shade), [ob, os] = at(img.dataset.own);
    img.onerror = none; (img.dataset.thumb ? imageOf(img.dataset.thumb) : s ? shadeOf(b, s) : Promise.reject())
      .catch((e: unknown) => os && (!s || (e instanceof EngineError && e.code === 'no_dem')) ? ownShadeOf(ob, os) : Promise.reject(e))
      .then(src => { img.src = src; }, none);
  }
}

// The progress bars of the search's waits, filled on the app clock from when each began (ui/results.ts progress).
export const bars = (root: ParentNode) => $$<HTMLElement>('.pbar i[data-t0]', root).forEach(i => fillBar(i, +i.dataset.t0!, +i.dataset.s!));
// Follows the shown site's search: when it settles, fill() shows it. warming_up asks again after 3 s (spec §6: every
// 2–5 s; the client turns a failed warm-up into start_failed); every other outcome stays until Try again.
const watched = new WeakSet<object>();
let again: gsap.core.Tween | null = null, openedQ = '';
function watch(id: Body, s: Site) {
  if (!state.ready) return;   // a lost context ends the app (app.ts): its searches stop, or they'd call off the fallback page's
  const e = doublesOf(id, s), at = routeOf(state);
  // The compare's windows land from the engine (its elevation) a little later: redraw then.
  if (state.view === 'compare') for (const { wait } of [terrainOf(id, s), terrainOf('earth', siteOf('earth', state.dbl!)!)])
    if (wait && !watched.has(wait)) { watched.add(wait); wait.then(() => fill(id, s)); }
  // A compare whose Earth pin isn't among the five (a deep link or reload of a double from Show more): ask for the 20.
  // Only under the query it was opened with: a pin a new purpose or filter leaves out is shown as such (doublesHTML).
  if (state.view === 'compare' && e.res && !e.busy && e.k < MORE && JSON.stringify(query) === openedQ && siteOf('earth', state.dbl!)?.custom && !hitOf(e, state.dbl!)) {
    doublesOf(id, s, false, MORE); fill(id, s); return;
  }
  if (e.busy) { if (!watched.has(e)) { watched.add(e); e.done.then(() => fill(id, s)); } return; }
  if (e.err?.code !== 'warming_up') return;
  again?.kill(); again = gsap.delayedCall(3, () => { if (state.ready && routeOf(state) === at) { doublesOf(id, s, true); watch(id, s); } });
}
// The site's search settled, or was asked again: redraw what shows it, in place (the coordinate field keeps its text;
// ui/chrome.ts says it). Compare also redraws the pair and table (the double's name and terrain come from the
// search), the terrain scenes once swapped in, the globe markers, crumbs and captions.
function fill(id: Body, s: Site) {
  if (!state.ready || state.body !== id || state.site !== s.id || (state.view !== 'site' && state.view !== 'compare')) return;
  const e = doublesOf(id, s), box = $('[data-doubles]', pin), sel = state.view === 'compare' ? state.dbl! : undefined;
  // The control just used (the purpose, a filter) stays where it is on screen while the parts above it redraw.
  const used = document.activeElement?.closest('[data-ask]') ? document.activeElement : null, y = used?.getBoundingClientRect().top ?? 0;
  if (sel && state.book) {
    // A booking step: the stage's terrain follows the windows as on compare; the panel redraws only when what it shows
    // of the search changed (ui/booking.ts), so a plan being filled keeps its focus and caret.
    const bk = $('[data-book]', pin), w = winOf(id, s, siteOf('earth', sel)!);
    if (bk.dataset.win !== w) { bk.dataset.win = w; if (VPS[0].kind === 'terrain') { buildScenes(); buildTUI(); } }
    if (bk.dataset.book !== bookKey()) { swap(pin, panelHTML()); thumbs(pin); bars(pin); requestAnimationFrame(drawMaps); chrome(); redoCaptions(); }
    buildMarkers(); watch(id, s); needLists(); return;   // the plan's purposes, once its form shows
  }
  if (sel) {
    // Only when what it shows of the search changed: that redraw closes the drawer. When only a window landed, only
    // what is drawn from the windows (table, maps, scenes) is, so the detail, its drawer and the focus stay. While a
    // new purpose or filter's search runs, what it shows stays until the answer lands.
    const d = siteOf('earth', sel)!, cmp = $('[data-cmp]', pin), at = e.busy && !e.res ? cmp.dataset.cmp : cmpOf(id, s, d), terr = $('[data-terr]', cmp), win = winOf(id, s, d);
    if (cmp.dataset.cmp !== at || terr.dataset.terr !== win) {
      if (cmp.dataset.cmp !== at) { cmp.dataset.cmp = at!; setHTML(cmp, compareTop(id, s, d)); thumbs(cmp); chrome(); redoCaptions(); }
      else { terr.dataset.terr = win; setHTML(terr, terrHTML(id, s, d)); }
      requestAnimationFrame(drawMaps);
      if (VPS[0].kind === 'terrain') { buildScenes(); buildTUI(); }
    }
    buildMarkers();
  } else if (VPS[0].kind === 'terrain') buildTUI();   // the terrain's note follows the answer (no_dem lands after the swap on a slow engine)
  // Show more landed while the box held the focus (its button was replaced): on to the first new card.
  const landed = document.activeElement === box && box.getAttribute('aria-busy') === 'true' && !e.busy;
  box.setAttribute('aria-busy', String(e.busy));
  // Its height kept while the new search runs, so a panel scrolled to its end doesn't pull the control down with it.
  box.style.minHeight = used && e.busy && !e.res ? `${box.offsetHeight}px` : '';
  swap(box, doublesHTML(id, s, e, sel)); thumbs(box); bars(box);
  const sk = pin.querySelector('[data-skip]'); if (sk) setHTML(sk, skip(e));
  saySearch();   // as it settles, not on the status bar's next second
  if (landed) $$<HTMLElement>('.result', box)[K]?.focus({ preventScroll: true });
  const ask = pin.querySelector<HTMLElement>('[data-ask]'); if (ask) ask.hidden = inert(e);
  if (used?.checkVisibility() && !peeked()) panel.scrollTop += used.getBoundingClientRect().top - y;
  watch(id, s); needLists();
}
// Replace a part of the panel without dropping the keyboard focus: back onto the same row, or the heading, else onto
// the part itself.
export function swap(el: HTMLElement, html: string) {
  const f = document.activeElement as HTMLElement | null, had = !!f && f !== el && el.contains(f), go = had ? f!.dataset.go : undefined, id = had ? f!.id : '';
  const h = had && f!.matches('h2[tabindex="-1"]');
  setHTML(el, html);
  if (had && !el.contains(document.activeElement)) ((id && $(`#${id}`, el)) || (go && $(`[data-go="${go}"]`, el)) || (h && $('h2[tabindex="-1"]', el)) || el).focus({ preventScroll: true });
}
pin.addEventListener('click', ev => {
  const t = ev.target as Element, retry = !!t.closest('[data-retry]');
  if (t.closest('[data-area-clear]')) { const { bbox: _, ...f } = query.filters; query.filters = f; asked(); return; }
  if (t.closest('[data-filters-clear]')) { query.filters = {}; asked(); return; }
  if (t.closest('[data-find]')) { findNext = true; go(state.body!); return; }   // unknown_target: to the body view's named-feature search
  const lk = t.closest<HTMLElement>('[data-link]'); if (lk) { copyLink(lk); return; }
  if (t.closest('[data-jump]')) {
    const box = $('[data-doubles]', pin); box.scrollIntoView({ block: 'start' }); box.focus({ preventScroll: true });   // a skip link: no glide
    return;
  }
  if (!(retry || t.closest('[data-more]')) || !state.body || !state.site) return;
  const s = siteOf(state.body, state.site)!; doublesOf(state.body, s, retry, retry ? undefined : MORE); fill(state.body, s); saySearch(true);
});
// Copy link: the view's route on this page's address, without its query (?mock, ?capture): what a deep link opens. The
// button says it took for 1.6 s (app clock), and so does the live region; if no clipboard would take it, where to copy it.
// shortcut: the route only; the purpose and filters stay session state (Decisions 36), so a compare of an engine cell
// found under another query opens without its detail. Put the query in the hash if shared links must carry it.
let linkT: gsap.core.Tween | undefined;
function copyLink(b: HTMLElement) {
  const url = `${location.origin}${location.pathname}#/${routeOf(state)}`, label = b.lastElementChild!;
  copyText(url).then(ok => {
    label.textContent = $('#live').textContent = ok ? 'Link copied' : 'Copy from the address bar';
    linkT?.kill(); linkT = gsap.delayedCall(1.6, () => { label.textContent = 'Copy link'; });   // 1.6 s from the last click
  });
}
// The search's purpose (required, spec §3.2) and filters (§3.5), above the doubles on the site and compare views. A
// change asks the search again (data/client.ts keeps one per site and query); a purpose decides where on Earth the
// search looks, not how it scores. The countries are the engine's list; the area is set from the Earth globe of a
// globe comparison (Search this area, ui/chrome.ts places the button).
let filtersOpen = false, listsTried = false, findNext = false;
// The purpose's own surface (spec §3.2): barren land, or any land (education). The surface filter offers the other one.
const ownSurface = () => lists.purposes?.find(x => x.key === query.purpose)?.surface;
function askHTML() {
  const ps = lists.purposes, p = ps?.find(x => x.key === query.purpose), f = query.filters, n = Object.keys(f).length, b = f.bbox, wide = p?.surface === 'any';
  const opt = (v: string, label: string, sel: boolean, off = false) => `<option value="${esc(v)}"${sel ? ' selected' : ''}${off ? ' disabled' : ''}>${esc(label)}</option>`;
  const ck = (id: string, on: boolean, label: string) => `<label class="ck"><input type="checkbox" id="${id}"${on ? ' checked' : ''}>${label}</label>`;
  // Until the purposes land: the one in use (always the default: the picker needs the list), and whether they failed.
  // One row: the purpose's label and picker. Its description opens with the filters (still the picker's description when closed).
  return `<div class="prow"><span class="fl" id="purpose-h">Test purpose</span>
    <select id="purpose" class="sel" aria-labelledby="purpose-h" aria-describedby="purpose-d"${ps ? '' : ' disabled'}>${ps
      ? ps.map(x => opt(x.key, `${purposeLabel(x.key, x.label)}${x.supported ? '' : ' (not part of the terrain search)'}`, x.key === query.purpose, !x.supported)).join('') : opt(query.purpose, listsTried ? purposeLabel(query.purpose) : 'Loading purposes…', true)}</select></div>
    <details class="drawer filt"${filtersOpen ? ' open' : ''}><summary><span class="chev" aria-hidden="true"></span>Filters and purpose${wbar('thin')}${n ? `<span class="nf">${n} on</span>` : ''}</summary>
      <p class="fine" id="purpose-d">${p ? `${esc(purposeText(p.key, p.description))} ${p.surface === 'barren' && f.surface !== 'any' ? 'Searches barren land only. ' : ''}` : listsTried ? 'The other purposes couldn’t be loaded from the search engine. ' : ''}A purpose decides where on Earth the search looks, not how it scores the terrain.</p>
      ${weights()}
      <label class="fl" for="country">Country</label>
      <select id="country" class="sel"${lists.sovereigns ? '' : ' disabled'}>${opt('', lists.sovereigns ? 'All countries' : listsTried ? 'All countries (list not loaded)' : 'All countries (loading the list…)', !f.sovereigns)}${(lists.sovereigns ?? []).map(c => opt(c, c, f.sovereigns?.[0] === c)).join('')}</select>
      ${ck('f-partner', !!f.access, 'Artemis Accords partners only')}${ck('f-polar', !!f.exclude_polar, 'Exclude polar sites, beyond 60° latitude')}${ck('f-surf', !!f.surface, wide ? 'Barren land only' : 'Include vegetated land')}
      <div class="area"><span class="fl">Area</span>${b ? `<span class="n">${latStr(b[1], 2)} to ${latStr(b[3], 2)}<br>${lonStr(b[0], 2, 'earth')} to ${lonStr(b[2], 2, 'earth')}</span><button class="btn" data-area-clear aria-label="Clear area">Clear</button>`
        : '<span>Anywhere on Earth</span>'}</div>
      ${b ? '' : '<p class="fine">On the globe comparison, Search this area keeps the search to the part of Earth in view.</p>'}
    </details>`;
}
// Hidden where purpose and filters change nothing: no elevation (no_dem: the Moon beyond 60°), or a name the engine
// doesn't know (unknown_target: its copy points to the named-feature search and the coordinates).
const inert = (e: Doubles) => e.err?.code === 'no_dem' || e.err?.code === 'unknown_target';
const askBox = (id: Body, s: Site) => `<div class="ask" data-ask tabindex="-1"${inert(doublesOf(id, s)) ? ' hidden' : ''}>${askHTML()}</div>`;
// The mission's weights (data/mission.ts PROFILES; docs/analog-weights.md) as one bar of shares out of 100: a thin one in the Filters
// and purpose header, always in view, and a labelled one inside it. All seven segments are always there (zero-width when unweighted),
// so a new purpose slides the shares from the old ones (asked).
const wbar = (cls: string) => { const P = profileOf(query.purpose);
  return `<span class="wbar ${cls}" aria-hidden="true">${FACTOR_ORDER.map(k => `<i class="wf-${k}" style="flex-grow:${P[k]}"></i>`).join('')}</span>`; };
// All seven legend items are always there, the unweighted ones collapsed (`off`), so a purpose that gains or drops a factor opens or
// closes its item instead of re-flowing the list.
function weights() {
  const P = profileOf(query.purpose);
  return `<p class="fl">How ${esc(lc(purposeLabel(query.purpose)))} weighs an analog, out of 100</p>${wbar('full')}
    <ul class="wleg">${FACTOR_ORDER.map(k => `<li class="${P[k] ? '' : 'off'}"><i class="wf-${k}" aria-hidden="true"></i>${FACTOR_LABEL[k]} <b>${P[k]}</b></li>`).join('')}</ul>
    <p class="fine">Eidolon’s judgment for this mission; no published source gives numeric weights. It sets each result’s mission fit; it does not change the terrain match or the order of the results.</p>`;
}
// Asked anew: the form shows the new query (the focus stays on its control), the doubles the new search.
function asked() {
  const el = pin.querySelector<HTMLElement>('[data-ask]'), was = el ? $$<HTMLElement>('.wbar i', el).map(i => i.style.flexGrow) : [];
  if (el) {
    swap(el, askHTML());
    // The shares animate from the old mission's to the new, the old state set back first. Off under reduced motion and ?capture, where
    // the new shares simply show.
    const now = $$<HTMLElement>('.wbar i', el), to = now.map(i => i.style.flexGrow);
    if (!RM && !CAPTURE && was.length === now.length) {
      const items = $$<HTMLElement>('.wleg li', el), nums = items.map(li => $('b', li)), toN = nums.map(b => +b.textContent!), fromN = was.slice(0, items.length).map(Number);
      items.forEach((li, j) => { li.classList.toggle('off', !fromN[j]); nums[j].textContent = String(fromN[j]); });
      void el.offsetWidth;
      // One smooth slide, no overshoot and no flash: every segment eases from its old width to its new together (gsap, the app's one
      // animation engine), the numbers count alongside, and a factor gained or dropped opens or closes its legend item.
      now.forEach((i, j) => {
        i.style.flexGrow = was[j];
        gsap.fromTo(i, { flexGrow: +was[j] }, { flexGrow: +to[j], duration: 1.1, ease: 'power2.inOut', overwrite: true, onComplete: () => { i.style.flexGrow = to[j]; } });
      });
      items.forEach((li, j) => li.classList.toggle('off', !toN[j]));
      toN.forEach((v, j) => { const o = { v: fromN[j] }; gsap.to(o, { v, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { nums[j].textContent = String(Math.round(o.v)); } }); });
    }
  }
  $('#area').toggleAttribute('data-on', !!query.filters.bbox);
  if (state.body && state.site) { fill(state.body, siteOf(state.body, state.site)!); saySearch(true); }
}
// The purposes and countries, asked while the form shows without them: on each render and each settled search (so
// Try again and the warming retry ask too: /sovereigns answers warming_up while the engine loads). The form shows them
// when they land, or that they couldn't be loaded.
function needLists() {
  if (!pin.querySelector('[data-ask], #b-purpose') || (lists.purposes && lists.sovereigns)) return;
  askLists().then(() => {
    listsTried = true; const el = pin.querySelector<HTMLElement>('[data-ask]'), bp = pin.querySelector('#b-purpose');
    if (el) swap(el, askHTML()); else if (bp && state.book) bp.innerHTML = purposeOptions();   // the booking plan's purposes
  });
}
pin.addEventListener('change', e => {
  const t = e.target as HTMLInputElement; if (!t.closest('[data-ask]')) return;
  const v = (id: string) => $<HTMLInputElement>(`#${id}`, pin), f: Filters = {};
  if (t.id === 'purpose') {
    query.purpose = t.value as typeof query.purpose;
    // A surface filter the new purpose already has goes: it would count as on, unclearable, and fork the search.
    if (query.filters.surface === ownSurface()) { const { surface: _, ...rest } = query.filters; query.filters = rest; }
  } else {
    if (v('country').value) f.sovereigns = [v('country').value];
    if (query.filters.bbox) f.bbox = query.filters.bbox;
    if (v('f-partner').checked) f.access = ['partner'];
    if (v('f-polar').checked) f.exclude_polar = true;
    if (v('f-surf').checked) f.surface = ownSurface() === 'any' ? 'barren' : 'any';   // overrides the purpose's (spec §3.5)
    query.filters = f;
  }
  asked();
});
pin.addEventListener('toggle', e => { const d = e.target as HTMLDetailsElement; if (d.classList?.contains('filt')) filtersOpen = d.open;
  const k = d.dataset?.keep; if (k) { if (d.open) kept.add(k); else kept.delete(k); } }, true);   // toggle doesn't bubble
// A surface photograph that doesn't load gives way to a sentence in the slot's text box: its alt text (up to 150
// characters) can't fit the 100 px square. Its credit line still links the photograph's page.
pin.addEventListener('error', e => {   // error doesn't bubble
  const t = e.target; if (t instanceof HTMLImageElement && t.closest('.imgs')) t.outerHTML = '<div class="ph">The photograph couldn’t be loaded.</div>';
}, true);
// Search this area (on the Earth globe of a globe comparison): the Earth in view becomes the search's area.
document.addEventListener('click', e => {
  if (!(e.target as Element).closest('#area')) return;
  const b = earthInView(); if (!b) return;
  query.filters = { ...query.filters, bbox: b }; filtersOpen = true; asked();
  if (!peeked()) pin.querySelector('.filt .area')?.scrollIntoView({ block: 'nearest' });   // what it set, in the panel (on a phone, the sheet)
});

// The skip link under a target site's lede: its doubles sit below the map, imagery and purpose, out of view on arrival
// (a 1280 × 800 panel, a phone's sheet), so this says they exist, or that the search is still running.
const skip = (e: Doubles) => `${e.busy && !e.res ? 'Searching Earth…' : 'Earth doubles'}<span class="chev" aria-hidden="true"></span>`;
// The site and compare views' first row: the way back, and Copy link (the route as a link to send: every view deep-links).
const LINK = '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.2" y="5.8" width="6.4" height="3.2" rx="1.6" transform="rotate(-45 4.4 7.4)"/><rect x="4.4" y="3" width="6.4" height="3.2" rx="1.6" transform="rotate(-45 7.6 4.6)"/></svg>';
const head = (back: string) => `<div class="phead">${back}<button class="back" data-link title="Copy a link to this view">${LINK}<span>Copy link</span></button></div>`;
function siteHTML(id: Body, s: Site) {
  const b = BODIES[id];
  if (id === 'earth') {
    const reh = rehearsesFor(s.id);
    return `${head(backBtn('Earth', 'earth'))}<h2 class="title" tabindex="-1">${s.name}</h2>${coordBlock(id, s)}<p class="lede">${s.kind}. ${s.place}.</p>
      ${siteMedia(id, s)}
      ${reh.length ? `<h3 class="sec">Rehearses</h3><ul class="rows">${reh.map(({ body, site: t }) => row({ go: routeOf({ body, site: t.id, dbl: s.id }), name: t.name, meta: BODIES[body].name, sub: t.kind, color: BODIES[body].color })).join('')}</ul>` : ''}
      ${wx(s)}`;
  }
  return `${head(state.fromGrid ? backBtn('Featured sites', `${id}/sites`) : backBtn(b.name, id))}<h2 class="title" tabindex="-1">${s.name}</h2>${coordBlock(id, s)}<p class="lede">${s.kind}. ${s.note}.</p>
    ${siteMap(id, s)}
    ${askBox(id, s)}
    ${doublesBox(id, s)}
    ${siteExtras(id, s)}
    ${id === 'mars' ? `<dl class="facts"><div><dt>Local solar time</dt><dd data-live="lmst" data-lon="${s.lon}">${lmst(s.lon, simNow())}</dd></div><div><dt>Gravity</dt><dd>${b.stats[0][1]}</dd></div></dl>` : ''}`;
}

// The pair side by side: names, both maps and a table, all over the engine's 18.8 km window (compare to scale), from
// its elevation once landed. The double is a search result (an Earth pin) or, from an Earth site's Rehearses list, an
// established site.
const hitOf = (e: Doubles, dbl: string) => e.res && cellsOf(e.res).find(x => x.id === dbl)?.r;
// What the compare block shows of the search (fill() redraws it when this changes): the double's detail under this
// query (its rank and purpose are the query's), names, or neither; and of the windows (fill() redraws the table, maps
// and scenes): whether each engine window has landed.
const cmpOf = (id: Body, s: Site, d: Site) => { const e = doublesOf(id, s); return hitOf(e, d.id) ? `detail ${JSON.stringify(query)}` : e.res ? 'res' : 'wait'; };
const winOf = (id: Body, s: Site, d: Site) => `${+!terrainOf(id, s).wait}${+!terrainOf('earth', d).wait}`;
// The table drawn from the two windows, and whose terrain it is.
function terrHTML(id: Body, s: Site, d: Site) {
  const b = BODIES[id], A = terrainOf(id, s).T, B = terrainOf('earth', d).T, terr = [...new Set([A.src, B.src].map(credit))].filter(Boolean);   // the Copernicus notice is owed where its windows show
  const area = (T: typeof A) => `${(T.steep * T.ext * T.ext).toFixed(1)}&nbsp;km²`;   // of the window: no percentages
  const r2 = (k: string, a: string, c: string) => `<tr><th scope="row">${k}</th><td class="n">${a}</td><td class="n">${c}</td></tr>`;
  return `<table class="cmp"><thead><tr><th><span class="sr">Measure</span></th><th>${s.name}</th><th>${esc(d.name)}</th></tr></thead><tbody>
      ${r2('Gravity', b.stats[0][1], '9.81 m/s²')}${r2('Surface pressure', b.stats[1][1], '1,013 hPa')}
      ${r2('Elevation', `${fmtM(A.min)} to ${fmtM(A.max)}`, `${fmtM(B.min)} to ${fmtM(B.max)}`)}
      ${r2('Relief', fmtM(A.relief), fmtM(B.relief))}${r2('Mean slope', `${A.meanSlope.toFixed(1)}°`, `${B.meanSlope.toFixed(1)}°`)}
      ${r2('Slopes over 15°', area(A), area(B))}${r2('Area shown', `${A.ext}&nbsp;×&nbsp;${A.ext}&nbsp;km`, `${B.ext}&nbsp;×&nbsp;${B.ext}&nbsp;km`)}
    </tbody></table>
    ${(A.engine || A.src) && (B.engine || B.src) ? '' : '<p class="fine">Where a side’s terrain is illustrative, so are its values here.</p>'}
    ${terr.length ? `<p class="fine credit">Terrain: ${terr.map(esc).join('. ')}.</p>` : ''}`;
}
function compareTop(id: Body, s: Site, d: Site) {
  const b = BODIES[id], e = doublesOf(id, s), hit = hitOf(e, d.id);
  if (hit || !d.custom) wxAt(d);   // the booking flow's weather, asked ahead of Plan a test campaign here
  const map = (bid: Body, x: Site) => `<div class="map"><canvas width="360" height="360" data-map="${bid}|${x.id}|win" aria-label="${esc(mapLabel(x))}"></canvas><div class="mread" hidden></div></div>`;
  return `<div class="pair"><div class="pa"><span class="dot" style="--c:${b.color}"></span><div><div class="pn">${s.name}</div><div class="ps">${b.name}, ${s.kind.toLowerCase()}</div></div></div>
      <div class="pa"><span class="dot" style="--c:${BODIES.earth.color}"></span><div><div class="pn">${esc(d.name)}</div>${d.place === d.name ? '' : `<div class="ps">${esc(d.place!)}</div>`}${d.custom ? placeTag(d.lat, d.lon) : ''}</div></div></div>
    <div class="minis">${map(id, s)}${map('earth', d)}</div>${sunSet.on ? '<p class="mcap">Both lit from the north-west, as the search engine’s hillshades are: the sun you set lights the site view only.</p>' : ''}
    ${hit || !d.custom ? `<div class="jump"><button class="btn primary" data-go="${routeOf({ body: id, site: s.id, dbl: d.id, book: 'listing' })}">Plan a test campaign here</button>${hit ? '<button class="back" data-jump>Other doubles<span class="chev" aria-hidden="true"></span></button>' : ''}</div>` : ''}
    ${hit ? `${twins(hit, s.name, `${id}|${s.id}`, AS_ENGINE, !!(terrainOf(id, s).T.src && terrainOf('earth', d).T.src))}${detail({ ...hit, environment: powerClimate(hit.environment, wxAt(d).cl.v) }, e.res!, hit.location && Number.isFinite(hit.location.lat) && Number.isFinite(hit.location.lon) ? skinAt({ lat: hit.location.lat!, lon: hit.location.lon! }) : undefined,
      { months: bestMonths(d, String(hit.purpose ?? query.purpose)), busy: wxAt(d).cl.busy, shadow: shadowOf(terrainOf(id, s).T, BODIES[id].R, terrainOf('earth', d).T) })}` : ''}
    <div data-terr="${winOf(id, s, d)}">${terrHTML(id, s, d)}</div>${cmpSlopeHTML()}`;
}
const compareHTML = (id: Body, s: Site, d: Site) => `${head(backBtn(s.name, routeOf({ body: id, site: s.id })))}
    <h2 class="sr" tabindex="-1">Comparison</h2>
    <div data-cmp="${esc(cmpOf(id, s, d))}">${compareTop(id, s, d)}</div>
    ${askBox(id, s)}
    ${doublesBox(id, s, d.id)}`;

function panelHTML() {
  const id = state.body!, b = BODIES[id];
  if (state.view === 'compare' && state.book) { const s = siteOf(id, state.site!)!;
    return `<div data-book="${bookKey()}" data-win="${winOf(id, s, siteOf('earth', state.dbl!)!)}">${bookHTML()}</div>`; }
  if (state.view === 'compare') return compareHTML(id, siteOf(id, state.site!)!, siteOf('earth', state.dbl!)!);
  if (state.view === 'site') return siteHTML(id, siteOf(id, state.site!)!);
  const head = `${backBtn('All worlds', 'system')}<h2 class="title" tabindex="-1">${b.name}</h2>`;
  // The site selector grid (views/grid.ts) opens over the globe from under the lede; while it shows, its own heading leads
  // back, its lede says the 60° line, and the globe the pin hint speaks of is under it.
  if (b.kind === 'target') return `${head}<p class="lede">Find a named feature, pin any point on the globe, or start from a featured site.${id === 'moon' && !state.grid ? ' Matching reaches 59.5° from the equator, so the south-pole base regions list their established analog sites, unscored, for now.' : ''}</p>
    ${state.grid ? '' : `<div class="jump"><button class="back go" data-go="${id}/sites">Featured sites and their doubles<span class="chev" aria-hidden="true"></span></button></div>`}
    ${targetSearchHTML(id)}
    <div class="cform"><label for="cin">Go to coordinates</label>
      <div class="cfield"><input id="cin" data-mode="goto" placeholder="${id === 'mars' ? '18.38° N, 77.58° E' : '86.00° S, 0.00° E'}" spellcheck="false" autocomplete="off" aria-describedby="cmsg"><button class="btn primary" data-open disabled>Open</button></div>
      <p class="cmsg" id="cmsg" aria-live="polite">${gotoHelp(id)}</p></div>
    ${state.grid ? '' : `<p class="hint">${TOUCH ? 'Or tap the surface to drop a pin. Drag to rotate, pinch to zoom.' : 'Or click the surface to drop a pin. Drag to rotate, scroll to zoom.'}</p>`}${facts(id)}
    <h3 class="sec">Featured sites</h3><ul class="rows">${SITES[id].map(s => row({ go: `${id}/${s.id}`, name: s.name, sub: s.kind, color: b.color,
      meta: id === 'mars' ? lmst(s.lon, simNow()) : latStr(s.lat, 1), live: id === 'mars' ? ` data-live="lmst" data-lon="${s.lon}" title="Local solar time"` : '' })).join('')}</ul>`;
  return `${head}<p class="lede">The ${SITES.earth.length} established analog sites, and the worlds they stand in for.</p>${facts(id)}
    <h3 class="sec">Established analog sites</h3><ul class="rows">${SITES.earth.map(s => row({ go: `earth/${s.id}`, name: s.name, sub: s.place, color: b.color, meta: s.for!.map(f => BODIES[f].name).join(', ') })).join('')}</ul>`;
}
// The coordinate field's help line, also restored by ui/coord-entry.ts when the field is cleared.
export const gotoHelp = (id: Body) => `Decimal or degrees, minutes, seconds. ${id === 'mars' ? 'East longitude, 0–360° or ±180°.' : 'N/S and E/W, or signed.'}<span class="kb"> Press <kbd>G</kbd> to jump here.</span>`;

// Re-render on every route; a new body, view or double starts at the top with focus on its heading (the Globe toggle
// keeps the place). Maps and crops draw on the next frame, as in the prototype, so the route change itself stays light.
export function renderPanel(prev: Route) {
  renderTools();
  if (state.view !== 'body' && state.view !== 'site' && state.view !== 'compare') return;
  const same = prev.body === state.body && prev.view === state.view && prev.site === state.site && prev.dbl === state.dbl && prev.book === state.book, top = panel.scrollTop;
  // The compare's Terrain, Overlay and Globe toggle: nothing in the panel depends on it (its links leave the view to
  // router.ts goKeep, the overlaid twins are panel.css's), so the panel stays: a rewrite blanked its hillshades and maps.
  if (same && state.view === 'compare' && (prev.globe !== state.globe || prev.overlay !== state.overlay)) return;
  if (!same) openedQ = JSON.stringify(query);
  (same ? swap : setHTML)(pin, panelHTML());   // the same route keeps the focus where it was
  panel.scrollTop = same ? top : 0;
  // A new panel opens the phone's sheet at half. The focus goes to its heading, unless the keys are driving the 3D view
  // (Enter pinned its centre, Escape went back): it stays there, still a Tab stop on these views.
  if (!same) { focusPanel(keyed() && !state.grid ? null : $(findNext && state.view === 'body' ? '#tq' : '[tabindex="-1"]', pin)); setSnap(1); }
  findNext = false;
  requestAnimationFrame(drawMaps); thumbs(pin); bars(pin);
  if (state.view !== 'body' && PICKABLE.includes(state.body!)) watch(state.body!, siteOf(state.body, state.site!)!);
  needLists();
}
// The site data landed after start (app.ts): what the panel draws from it (credit lines, crops, the no-data box,
// compare's terrain lines) renders again, in place.
export const refreshPanel = () => { if (state.view === 'site' || state.view === 'compare') renderPanel(state); };
// The panel's topographic maps and orbital crops; also redrawn when a texture lands late (app.ts).
export function drawMaps() {
  $$<HTMLCanvasElement>('[data-map]', pin).forEach(cv => { const [b, sid, win] = cv.dataset.map!.split('|') as [Body, string, string?], s = siteOf(b, sid); if (s) drawMap(cv, b, s, !!win); });
  $$<HTMLCanvasElement>('[data-crop]', pin).forEach(cv => { const [b, la, lo, km, ft, url] = cv.dataset.crop!.split('|'); drawCrop(cv, b as Body, +la, +lo, +km, +ft, url); });
}
