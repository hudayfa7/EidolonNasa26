// The site selector grid (plan, Should): a target world's featured sites as cards over its globe, beside the body view's
// panel and its list (#/mars/sites; on a phone, the whole screen under the top bar). A card opens its site (the dive
// runs as the grid fades) or compares it with a double. Reached from the panel's link under the lede, the system view's
// Featured sites cue, and the grid's own world switch.
import gsap from 'gsap';
import { doublesOf, searched } from '../data/client';
import { SITES, type Site } from '../data/sites';
import { $, $$ } from '../dom';
import { RM, T_ } from '../motion';
import { state, type Route } from '../router';
import { focusPanel } from '../scene/frame';
import { sheet } from '../scene/layout';
import { LAY } from '../scene/rig';
import { gridDoubles, gridFail, gridHTML } from '../ui/grid';
import { bars, swap, thumbs } from '../ui/panel';

const el = $('#grid'), ui = $('#ui');
// shortcut: the panel beside it is the body view's, so its coordinate field previews a pin on the globe under the grid,
// unseen until Open goes there; close the grid on typing if that confuses.
const shown = () => state.ready && state.view === 'body' && state.grid;   // not after a lost context (app.ts): its searches stop
/** Fully in, with the panel beside it settled (on a phone, alone): it hides the whole stage, so the 3D render can pause. */
export const gridCovers = () => shown() && el.style.opacity === '1' && (sheet() || LAY.panel > .999);
// The panel beside it on a desktop, none on a phone (views/body.ts): kept when the window crosses the breakpoint.
addEventListener('resize', () => { if (shown()) T_(LAY, { panel: sheet() ? 0 : 1 }); });
// shortcut: Try again re-asks the searches, not a tile already showing the placeholder; reopening the grid redraws them.
el.addEventListener('click', e => { if ((e.target as Element).closest('[data-gretry]')) { askGrid(true); fillGrid(); } });

export function playGrid(prev: Route) {
  const on = shown(), id = state.body!;
  ui.inert = on;   // the globe's markers stay out of the Tab order under it
  if (!on) {
    if (!prev.grid) return;
    if (el.contains(document.activeElement)) focusPanel($('#pin [tabindex="-1"]'));
    gsap.to(el, { autoAlpha: 0, duration: RM ? 0 : .5, ease: 'power2.inOut', overwrite: true });
    return;
  }
  if (prev.view === 'body' && prev.grid && prev.body === id) return;
  askGrid();
  el.innerHTML = gridHTML(id); el.scrollTop = 0; fillGrid();
  gsap.set(el, { visibility: 'inherit' });   // autoAlpha shows it on its first tick: too late for the focus below
  gsap.to(el, { autoAlpha: 1, duration: RM ? 0 : .6, ease: 'power2.inOut', overwrite: true });
  gsap.fromTo($$('.gc', el), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: RM ? 0 : .6, stagger: RM ? 0 : .06, delay: RM ? 0 : .15, ease: 'power2.out' });
  $('h2', el).focus({ preventScroll: true });
}

// Each card's doubles from its site's search, redrawn in place when it changed (a row keeps the focus); then the
// hillshades and progress bars they brought.
function fillGrid() {
  if (!shown()) return;
  const id = state.body!;
  for (const s of SITES[id]) {
    const box = el.querySelector<HTMLElement>(`[data-gd="${s.id}"]`), e = searched(id, s); if (!box) continue;
    box.setAttribute('aria-busy', String(!e || e.busy)); swap(box, gridDoubles(id, s, e));
  }
  const f = el.querySelector<HTMLElement>('[data-gfail]'); if (f) swap(f, gridFail(SITES[id].map(s => searched(id, s))));
  thumbs(el); bars(el);
}

// The grid's searches, kept per site by data/client.ts (the site view shows the same): by name all at once, the engine's
// cache answers in milliseconds; by coordinates one at a time in the grid's order (spec §8: a remote DEM read each, and a
// newer one calls the last off), waiting on one already under way, while a grid shows. Searches still warming up are
// asked again 3 s later, as the site view's are; `again` (Try again, once every search failed) asks the failed ones too.
let running = false, retry: gsap.core.Tween | null = null;
async function askGrid(again = false) {
  if (!shown()) return;
  const id = state.body!, code = (s: Site) => searched(id, s)?.err?.code, warm = (s: Site) => code(s) === 'warming_up';
  const redo = (s: Site) => warm(s) || (again && !!code(s) && code(s) !== 'no_dem');
  for (const s of SITES[id]) if (s.iau) doublesOf(id, s, redo(s)).done.then(fillGrid);
  if (running) return;   // the one under way moves on to this world when its search settles
  running = true; retry?.kill();
  for (const s of SITES[id]) {
    const had = searched(id, s);
    if (s.iau || (had && !had.busy && !redo(s))) continue;
    if (!shown() || state.body !== id) break;
    const e = had?.busy ? had : doublesOf(id, s, true); fillGrid(); await e.done; fillGrid();
  }
  running = false;
  if (shown() && state.body !== id) askGrid();   // the world switched meanwhile
  else if (shown() && SITES[id].some(warm)) retry = gsap.delayedCall(3, askGrid);
}
