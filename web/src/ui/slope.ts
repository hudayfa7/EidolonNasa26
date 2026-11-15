// The slope hazard layer (plan, Stretch): under the site view's map and sunlight, and under compare's table, a checkbox
// greys the blocks and maps and tints their ground steeper than STEEP coral (terrain/mesh.ts hazard, slopeOf); the site
// view's section adds the area that covers and the spacing it is measured over (compare's table has each side's area).
// shortcut: the layer isn't in the route (a shared link opens without it); add it to routes.ts if links must carry it.
import { fmtM, type Body } from '../coords';
import { siteOf, type Site } from '../data/sites';
import { $ } from '../dom';
import { landing, missionOf } from '../ellipse';
import { buildScenes, state } from '../router';
import { VPS } from '../scene/rig';
import { hazard } from '../terrain/mesh';
import { genTerrain, STEEP } from '../terrain/procedural';
import { swap } from './panel';
import { buildTUI } from './terrain-ui';
import { drawMap } from './topomap';

const pin = $('#pin');
const ck = () => `<label class="ck"><input type="checkbox" id="slope-on"${hazard.on ? ' checked' : ''}>Tint slopes over ${STEEP}°</label>`;
function inner(id: Body, s: Site) {
  if (!hazard.on) return `<h3 class="sec">Slope hazard</h3>${ck()}<p class="fine">Ground steeper than ${STEEP}°, in coral on the block and the map.</p>`;
  // The area as compare's table gives it (measure's share of the grid), and the caveat of the spacing it is over: the
  // samples', or the elevation's own where that is coarser (a polar pin's 1 km cap, Meteor Crater's 30 m).
  const T = genTerrain(id, s), sp = T.ext * 1000 / (T.N - 1), own = (T.res ?? 0) > sp * 1.001;
  return `<h3 class="sec">Slope hazard</h3>${ck()}<p class="skey"><i aria-hidden="true"></i>Over ${STEEP}°: ${(T.steep * T.ext * T.ext).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}&nbsp;km² of the ${T.ext}&nbsp;×&nbsp;${T.ext}&nbsp;km shown</p>
    <p class="fine">Measured over ${own ? `the elevation’s own ${fmtM(T.res!)} spacing` : `the ${fmtM(sp)} between samples`}, so steep ground narrower than that doesn’t show.${T.src ? '' : ' The terrain here is illustrative, and so are its slopes.'}</p>`;
}
/** A map's label, which says when its steep ground is tinted and, on the site view's (`id` given), a landing ellipse. */
export const mapLabel = (s: Site, id?: Body) => `Topographic map of ${s.name}${hazard.on ? `, slopes over ${STEEP}° in coral` : ''}${id && landing.on ? `, with the ${missionOf(id).name} landing ellipse` : ''}`;
/** The site panel's Slope hazard section (ui/panel.ts siteMedia), under the map it tints and the sunlight. */
export const slopeHTML = (id: Body, s: Site) => `<div class="slope" data-slope>${inner(id, s)}</div>`;
/** Compare's checkbox under its table (ui/panel.ts compareTop), whose "Slopes over 15°" row gives each side's area; not
 *  above it, where it would push "Plan a test campaign here" below a phone's half sheet. */
export const cmpSlopeHTML = () => `<div class="slope" data-slope>${ck()}</div>`;
/** The site view's section again, from its terrain as it is now (a pin's, rebuilt when its world's height map lands late:
 *  app.ts onAsset). */
export function redoSlope() {
  const el = document.querySelector<HTMLElement>('[data-slope]'), s = state.view === 'site' && siteOf(state.body, state.site ?? undefined);
  if (el && s) swap(el, inner(state.body!, s));
}

// On the document: the switch is in View tools on the site view (ui/vtools.ts), in the panel on compare.
document.addEventListener('change', e => {
  if ((e.target as HTMLElement).id !== 'slope-on') return;
  hazard.on = (e.target as HTMLInputElement).checked; redoSlope();
  if (VPS[0].kind === 'terrain') { buildScenes(); buildTUI(); }
  for (const cv of pin.querySelectorAll<HTMLCanvasElement>('canvas[data-map]')) {
    const [b, sid, win] = cv.dataset.map!.split('|') as [Body, string, string?], s = siteOf(b, sid);
    if (s) { drawMap(cv, b, s, !!win); cv.setAttribute('aria-label', mapLabel(s, win ? undefined : b)); }
  }
});
