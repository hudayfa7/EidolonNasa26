// The page without WebGL, when the start fails, or when the browser loses the graphics context (plan, Should: fallback
// without WebGL): the title as a static poster (its shot pre-rendered by the capture harness, `npm run poster`, under
// the title's own lockup, wordmark and blurb, which carries the reason), then a plain list of the featured sites and
// their closest doubles from each site's own search (data/client.ts: the search needs no WebGL), which also serves
// screen readers. Every site and double links to its route: a deep link opened here lands on its site's entry, a link
// clicked marks its own; after a lost context a link reloads into the full view there. Loaded only on that path (main.ts).
import gsap from 'gsap';
import { fmtLL, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { cellsOf, doublesOf, knownOf, MOCK, query, searched, type Doubles } from '../data/client';
import { EARTH_BY, SITES, type Site } from '../data/sites';
import { esc, setHTML } from '../dom';
import { RM } from '../motion';
import { parseHash, routeOf, type Route } from '../routes';
import { banner, brief, conf, failHead, fractions, noAnalog, placeTag, purposeLabel, SAMPLE, strs, targetNote, TESTED, text } from './results';

const TOP = 3, WORLDS: Body[] = ['moon', 'mars'];   // Moon bases first, as the intro has it
const href = (r: Partial<Route>) => `#/${routeOf(r)}`;

/**
 * A featured site's doubles in words, from its search (`e`; undefined while a search by coordinates waits its turn): the
 * IAU feature searched and the capability banner, then the three closest, each linked to its comparison with its place,
 * point, shape match, summary, what differs and its own notes, and the notes all three share once; where the engine has
 * no elevation (no_dem), the site's established analog sites, unscored; else the search's state, a failure with those
 * established sites too (static: they need no engine).
 */
export function fbDoubles(id: Body, s: Site, e?: Doubles) {
  const to = (dbl: string) => href({ body: id, site: s.id, dbl }), kn = e ? knownOf(s, e) : [];
  const known = (lead: string, ids: string[]) => `<p>${lead}</p>
    <ul>${ids.map(d => `<li><a href="${to(d)}">${EARTH_BY[d].name}</a>, ${esc(EARTH_BY[d].place!)}</li>`).join('')}</ul>`;
  // The engine's no_dem is the Moon beyond 60° (plan, Gaps 2): said where it applies, so it goes when the engine reads there.
  if (kn.length) return known('The search engine reads Moon terrain only within 59.5° of the equator, so these established analog sites are unscored:', kn);
  const res = e?.res, list = res ? cellsOf(res).slice(0, TOP) : [];
  if (res && list.length) {
    const cav = list.map(({ r }) => [...new Set(strs(r.explanation?.caveats))]), shared = cav[0].filter(c => cav.every(x => x.includes(c)));
    const notes = (xs: string[]) => xs.map(n => text(fractions(n))).join(' ');
    return `${targetNote(res.target, s.name)}${banner(res.target)}<p>${noAnalog(res) ? 'No close analog in this region. The closest available:' : 'Closest Earth doubles:'}</p><ol>${list.map(({ r, id: d }, i) => {
      const l = r.location!, gaps = strs(r.explanation?.gaps), own = cav[i].filter(c => !shared.includes(c));
      return `<li><a href="${to(d)}">${text(l.country ?? 'Unnamed area')}</a><span class="c">${fmtLL(l.lat!, l.lon!, 'earth', 4)}</span>${placeTag(l.lat!, l.lon!)}
        <br>Shape match ${conf(r.fidelity?.confidence).toLowerCase()}. ${brief(r.explanation?.summary)}${gaps.length ? ` Differs: ${gaps.map(text).join(', ')}.` : ''}${own.length ? ` Note: ${notes(own)}` : ''}</li>`;
    }).join('')}</ol>${shared.length ? `<p class="fine">${['Notes', 'Notes on both', 'Notes on all three'][list.length - 1]}: ${notes(shared)}</p>` : ''}`;
  }
  const state = !e ? 'Waiting its turn: searches by coordinates run one at a time.'
    : res ? 'No Earth doubles match this search.'
    : e.busy ? s.iau ? 'Searching Earth…' : `Reading ${BODIES[id].name} terrain…`
    : e.err?.code === 'warming_up' ? 'Search engine starting up…' : null;
  if (state) return `<p>${state}</p>`;
  const fail = `${failHead(e!.err?.code ?? '')}. Reload the page to try again.`;
  return s.doubles?.length ? known(`${fail} Meanwhile, its established analog sites, unscored:`, s.doubles) : `<p>${fail}</p>`;
}

const entry = (id: Body, s: Site) => `<li id="fb-${id}-${s.id}" tabindex="-1"><h4><a href="${href({ body: id, site: s.id })}">${s.name}</a></h4><span class="c">${fmtLL(s.lat, s.lon, id, 4)}</span>
  <p>${s.kind}. ${s.note}.</p><div data-fd="${id}/${s.id}" aria-busy="true"${s.iau ? '' : ' aria-live="polite"'}></div></li>`;   // by name: all at once, unannounced

let shown = false;
/** Shows the page (the first reason wins), with `lost` the graphics context lost; resolves once the poster can be drawn. */
export function showFallback(msg = 'This view needs WebGL. Turn on hardware acceleration in your browser settings, then reload.', lost = false) {
  const el = document.querySelector<HTMLElement>('#gl-fail')!, B = import.meta.env.BASE_URL;
  if (shown) return Promise.resolve();
  shown = true;
  // The page searches as a reload would: the default purpose, no filters (the panel's, lost with the app, are session state).
  Object.assign(query, { purpose: 'rover_mobility', filters: {} });
  el.innerHTML = `<div class="hero"><picture><source media="(max-aspect-ratio: 4/5)" srcset="${B}poster-tall.jpg"><img class="fb-poster" src="${B}poster.jpg" alt=""></picture>
    <div class="lockup" aria-hidden="true"><svg class="logo"><use href="#mark"/></svg><span>Eidolon</span></div><h1 class="big">Eidolon</h1>
    <div class="blurb"><p class="fb-msg"${lost ? ' role="alert"' : ''}>${msg}</p><p><em>Permanent bases on the Moon and landings on Mars</em> are rehearsed on Earth first. <em>Eidolon</em> reads terrain form at 200&nbsp;m and finds the places on Earth that come closest.</p>
      <div class="tcta"><button class="btn primary" data-fb-sites>Featured sites</button></div></div>
    <div class="meta-row" aria-hidden="true"><span>NASA Space Apps Challenge 2026</span><span>Earth, low orbit</span><span>Scroll for featured sites</span></div></div>
  <section class="fb" aria-labelledby="fb-h"><h2 class="title" id="fb-h" tabindex="-1">Featured sites</h2>
    <p class="lede">Each site on the Moon and Mars with its closest doubles on Earth, from the site’s own search. Every name links to its view in Eidolon, which opens wherever WebGL runs.</p>
    <p class="fine">Test purpose: ${esc(purposeLabel(query.purpose))}. ${TESTED}${MOCK ? SAMPLE : ''}</p>
    <div class="fb-cols">${WORLDS.map(id => `<div><h3>${BODIES[id].name}</h3><ul>${SITES[id].map(s => entry(id, s)).join('')}</ul></div>`).join('')}</div>
    <p class="fine">The poster is Eidolon’s title view, drawn from NASA’s Blue Marble and Black Marble maps of Earth, the Blue Marble clouds, NOAA’s ETOPO1 relief and the MODIS water mask.</p></section>`;
  // shortcut: the default purpose only, no picker here; add one if this page is ever used to plan.
  el.style.display = 'block';
  // The dead app behind the overlay leaves the accessibility tree and the Tab order (none of it works without the router).
  for (const c of document.body.children) if (c !== el) c.setAttribute('inert', '');
  const h = el.querySelector<HTMLElement>('#fb-h')!;
  el.querySelector('[data-fb-sites]')!.addEventListener('click', () => { h.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); h.focus({ preventScroll: true }); });
  // The page's own links change the address without landing (the clicked link is on screen, in its entry), the current
  // route's too. Lost: the reason shows first (alerted: focus fell out of the app), and every link reloads into the full
  // view there (the GPU is usually back by then); so does going back or forward.
  why = Object.assign(document.createElement('p'), { className: 'fine', textContent: `The 3D view can’t open here. ${msg}` });
  el.addEventListener('click', e => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#/"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;   // a new tab or window: the browser's
    e.preventDefault();
    if (a.hash !== location.hash) history.pushState(null, '', a.hash);
    if (lost) location.reload(); else land(false);
  });
  addEventListener('hashchange', () => { if (lost) location.reload(); else land(); });
  if (!lost) land();
  for (const t of ['wheel', 'touchstart', 'pointerdown', 'keydown']) el.addEventListener(t, () => { hold = null; }, { passive: true });
  ask(el);
  return el.querySelector<HTMLImageElement>('.fb-poster')!.decode().catch(() => {});
}

// A deep link (on load, back, forward) lands on its site's entry (a pin, the grid or Earth have none here: the page
// stays where it is), with why its view doesn't open, kept at the top while the searches above it fill in, until the
// reader moves. `move` false (a link clicked here): the entry is only marked, focus and scroll stay.
let hold: HTMLElement | null = null;
let why: HTMLElement;
function land(move = true) {
  const r = parseHash(location.hash), li = r.site ? document.getElementById(`fb-${r.body}-${r.site}`) : null;
  document.querySelector('#gl-fail li.on')?.classList.remove('on');
  li?.classList.add('on'); hold = move ? li : null;
  if (!move) return;
  if (!li) return why.remove();
  li.querySelector(':scope > .c')!.after(why); li.focus({ preventScroll: true }); li.scrollIntoView({ block: 'start' });
}

// The searches, as the grid asks them (views/grid.ts): by name all at once, the engine's cache answers in milliseconds;
// by coordinates one at a time (spec §8: a newer one calls the last off). Each warming up is asked again 3 s later.
async function ask(el: HTMLElement) {
  const all = WORLDS.flatMap(id => SITES[id].map(s => [id, s] as const));
  const fill = () => { for (const [id, s] of all) {
    const box = el.querySelector<HTMLElement>(`[data-fd="${id}/${s.id}"]`)!, e = searched(id, s);
    box.setAttribute('aria-busy', String(!e || e.busy)); setHTML(box, fbDoubles(id, s, e));
  } hold?.scrollIntoView({ block: 'start' }); };
  const one = async (id: Body, s: Site): Promise<void> => {
    const e = doublesOf(id, s, true); fill(); await e.done; fill();
    // Called off by a newer search by coordinates: asked again. The dead app behind a lost context asks none (state.ready),
    // or the two would call each other off for good.
    if (e.err?.code === 'aborted') return one(id, s);
    if (e.err?.code === 'warming_up') { await new Promise(r => gsap.delayedCall(3, r)); return one(id, s); }
  };
  for (const [id, s] of all) if (s.iau) one(id, s);
  for (const [id, s] of all) if (!s.iau) await one(id, s);
}
