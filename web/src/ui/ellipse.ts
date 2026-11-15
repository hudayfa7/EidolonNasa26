// The landing ellipse (plan, Stretch): under the site view's map, its sunlight and slope hazard, a checkbox draws a
// mission's landing ellipse at its true size round the site's centre on the block and the map (terrain/mesh.ts
// buildTerrain, ui/topomap.ts drawMap): a mission from presets (data/missions.ts), its long axis turned by a slider,
// and the share of it steeper than STEEP from the slope grid the hazard layer tints (ellipse.ts ellSteep). The site
// view only: compare shows the engine's windows, not a landing.
// shortcut: site view only, so an engine-found Earth double (it opens on compare alone) never shows one; pass the target's
// mission to compare's buildTerrain and minis, with a checkbox under its table, if campaigns are planned from there.
// shortcut: the ellipse isn't in the route (a shared link opens without it); add it to routes.ts if links must carry it.
import { fmtM, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import type { Mission } from '../data/missions';
import { siteOf, type Site } from '../data/sites';
import { $, setHTML } from '../dom';
import { axisWords, ellSteep, landedOf, landing, missionOf, missionsOf, ringed, shareOf, sizeOf } from '../ellipse';
import { onUpdate } from '../motion';
import { buildScenes, state } from '../router';
import { VPS } from '../scene/rig';
import { slopeOf } from '../terrain/mesh';
import { genTerrain, STEEP } from '../terrain/procedural';
import { swap } from './panel';
import { fact } from './results';
import { mapLabel } from './slope';
import { drawMap } from './topomap';

import { vt } from './vtools';
const pin = $('#pin');
const here = () => { const s = state.view === 'site' && siteOf(state.body, state.site ?? undefined); return s ? { id: state.body!, s } : null; };
const km2 = (x: number) => `${x.toLocaleString('en-GB', { minimumFractionDigits: x < 1 ? 2 : 1, maximumFractionDigits: x < 1 ? 2 : 1 })}&nbsp;km²`;
const axis = (az: number) => `${az}°, ${axisWords(az)}`;
// The ellipse's facts and caveats: its size and area, the share of it over STEEP (of the part inside the map's square,
// whose slopes are known; its centre always is), its long axis; where the size comes from (on the mission's own site,
// where it really landed), and what the share can't see.
function readout(id: Body, s: Site) {
  const m = missionOf(id), T = genTerrain(id, s), r = ellSteep(slopeOf(T), T.N, T.ext, m.a, m.b, landing.az, STEEP), inn = r.area * r.inside;
  const sp = T.ext * 1000 / (T.N - 1), own = (T.res ?? 0) > sp * 1.001, gap = own ? T.res! : sp, circle = m.a === m.b;
  const spacing = own ? `the elevation’s own ${fmtM(gap)} spacing` : `the ${fmtM(gap)} between samples`;
  return `<dl class="facts">${fact('Size', circle ? `${sizeOf(m).replace(' across', '')}<span class="sub w">Across, a circle</span>` : sizeOf(m))}${fact('Area', km2(r.area))}
      ${fact(`Over ${STEEP}°`, `${shareOf(r.steep)}${r.steep ? `<span class="sub">${km2(r.steep * inn)}</span>` : ''}`)}${fact('Long axis', circle ? 'Any<span class="sub w">A circle</span>' : `${landing.az}°<span class="sub w">${axisWords(landing.az).replace(/^./, c => c.toUpperCase())}</span>`)}</dl>
    <p class="fine">${m.src}. Centred on the site, the map’s crosshair${circle ? '.' : '; the long axis lies along the approach, so turn it to the mission’s.'} ${landedOf(m, id, s)}
      ${ringed(m, T.ext) ? 'Too small to see at this scale: a ring marks it, larger than its true size.' : ''}
      ${r.inside < .999 ? `It runs past the map’s ${T.ext}&nbsp;×&nbsp;${T.ext}&nbsp;km square: the share is of the ${km2(inn)} inside it.` : ''}
      Slopes measured over ${spacing}, ${m.b * 1000 < gap ? 'more than the ellipse is wide: the share is the slope of the ground around it, not of the ground inside.' : 'so steep ground narrower than that doesn’t show.'}${T.src ? '' : ' The terrain here is illustrative, and so is the share.'}</p>`;
}
const opt = (m: Mission) => `<option value="${m.id}"${m.id === landing.id ? ' selected' : ''}>${m.name}, ${sizeOf(m)}</option>`;
function inner(id: Body, s: Site) {
  const ck = `<label class="ck"><input type="checkbox" id="ell-on"${landing.on ? ' checked' : ''}>Draw a mission’s landing ellipse</label>`;
  if (!landing.on) return `${ck}<p class="fine">At its true size round the site’s centre, on the block and the map, with how much of it is steeper than ${STEEP}°.</p>`;
  // Earth tests both worlds' missions: grouped by the world each lands on.
  const ms = missionsOf(id), m = missionOf(id), opts = id === 'earth'
    ? (['mars', 'moon'] as const).map(b => `<optgroup label="${BODIES[b].name}">${ms.filter(x => x.body === b).map(opt).join('')}</optgroup>`).join('') : ms.map(opt).join('');
  return `${ck}<label class="fl" for="ell-m">Mission</label><select class="sel" id="ell-m">${opts}</select>
    ${m.a === m.b ? '' : `<label class="fl" for="ell-az">Long axis, from north</label>
    <div class="srange"><input type="range" id="ell-az" min="0" max="175" step="5" value="${landing.az}" aria-valuetext="${axis(landing.az)}"><output for="ell-az">${landing.az}°</output></div>`}
    <div data-ellr>${readout(id, s)}</div>`;
}
/** The site panel's Landing ellipse section (ui/panel.ts siteMedia), after the slope hazard whose slopes it reads. */
export const ellipseHTML = (id: Body, s: Site) => `<div class="ell" data-ell><h3 class="sec">Landing ellipse</h3>${inner(id, s)}</div>`;
/** The facts again, from the site's terrain as it is now (a pin's, rebuilt when its world's height map lands late: app.ts onAsset). */
export function redoEllipse() { const h = here(), el = vt.querySelector<HTMLElement>('[data-ellr]'); if (h && el) setHTML(el, readout(h.id, h.s)); }

// The block and the map follow on the app's next frame (once a frame however many inputs a drag sends).
let dirty = false;
onUpdate(() => {
  if (!dirty) return; dirty = false;
  const h = here(), cv = pin.querySelector<HTMLCanvasElement>('canvas[data-map]'); if (!h) return;
  if (VPS[0].kind === 'terrain') buildScenes();
  if (cv) { drawMap(cv, h.id, h.s); cv.setAttribute('aria-label', mapLabel(h.s, h.id)); }
});
vt.addEventListener('change', e => {
  const t = e.target as HTMLInputElement, h = here(); if ((t.id !== 'ell-on' && t.id !== 'ell-m') || !h) return;
  if (t.id === 'ell-on') landing.on = t.checked; else landing.id = t.value;
  swap($('[data-ell]', vt), `<h3 class="sec">Landing ellipse</h3>${inner(h.id, h.s)}`); dirty = true;
});
// The slider: only the readouts change in place, so it keeps its drag and the focus.
vt.addEventListener('input', e => {
  const t = e.target as HTMLInputElement, h = here(); if (t.id !== 'ell-az' || !h) return;
  landing.az = +t.value; t.setAttribute('aria-valuetext', axis(landing.az)); $('.ell .srange output', vt).textContent = `${landing.az}°`;
  setHTML($('[data-ellr]', vt), readout(h.id, h.s)); dirty = true;
});
