// The sun-angle control (plan, Stretch: illumination decides the lunar south pole): under the site view's map, a local
// solar time and a date light its block and map from the sun as it stands then over the site (terrain/mesh.ts sunOf:
// astro.ts's subsolar point for the body, the true height, cast shadows). Off, both keep the relief light (Decisions
// 181). Not on compare, which lights both worlds from the twins' north-west (Decisions 185, 186).
// shortcut: the time and date aren't in the route (a shared link opens lit as now), add them to routes.ts if links must carry them.
import { hms, marsLs, solarDate, solarTime, subsolar } from '../astro';
import { compass, introElev, latStr, type Body } from '../coords';
import { siteOf, type Site } from '../data/sites';
import { $, setHTML } from '../dom';
import { onUpdate, simNow } from '../motion';
import { buildScenes, state } from '../router';
import { VPS } from '../scene/rig';
import { sunAt, sunSet } from '../terrain/mesh';
import { swap } from './panel';
import { fact } from './results';
import { drawMap } from './topomap';

import { vt } from './vtools';
const pin = $('#pin'), hm = (h: number) => hms(h).slice(0, 5);
/** The set sun's moment, as the facts and the stage's caption (ui/terrain-ui.ts) give it. */
export const utcOf = (at: Date) => at.toISOString().slice(0, 16).replace('T', ' ');
// What the sun is doing then: the slider says its height and direction as it moves; the facts add the moment and the
// season (Mars's Ls; elsewhere the sun's latitude, which on the Moon is the poles' season: ±1.5°).
function readout(id: Body, s: Site) {
  const { az, alt, at } = sunAt(id, s), up = alt >= 0 ? 'up' : 'below the horizon';
  return {
    say: `${hm(sunSet.h)}, the sun ${introElev(Math.abs(alt))} ${up}, from the ${compass(az)}`,
    html: `<dl class="facts">${fact('Sun height', `${introElev(alt)}${alt < 0 ? '<span class="sub">Below the horizon</span>' : ''}`)}${fact('Sun direction', `${Math.round(az) % 360}°<span class="sub">From the ${compass(az)}</span>`)}
      ${fact('Moment, UTC', utcOf(at))}${id === 'mars' ? fact('Season', `Ls ${Math.round(marsLs(at)) % 360}°`) : fact('Sun’s latitude', latStr(subsolar(id, at)[0], 1))}</dl>
      <p class="fine">Shadows fall at true scale over the curve of the ground; only ground inside the map’s square casts them. The vertical exaggeration shades the slopes only.${alt < 0 ? ' High ground sees past the level horizon, so it can catch a sun below it.' : ''}${id === 'moon' ? ' A lunar day lasts 29.5 Earth days: the moment falls in the one that holds the date.' : ''}</p>`,
  };
}
function inner(id: Body, s: Site) {
  const ck = `<label class="ck"><input type="checkbox" id="sun-on"${sunSet.on ? ' checked' : ''}>Set the sun’s time and date</label>`;
  if (!sunSet.on) return `${ck}<p class="fine">Lit from the sun’s direction now, raised to 38° so the relief reads at any hour.</p>`;
  const r = readout(id, s);
  // On the Moon the date picks a whole lunar day (29.5 days), not that day.
  return `${ck}<label class="fl" for="sun-h">Time of day (local solar)</label>
    <div class="srange"><input type="range" id="sun-h" min="0" max="23.75" step="0.25" value="${sunSet.h}" aria-valuetext="${r.say}"><output for="sun-h">${hm(sunSet.h)}</output></div>
    <label class="fl" for="sun-d">${id === 'moon' ? 'Lunar day holding' : 'Date'}</label><div class="cfield"><input type="date" id="sun-d" value="${sunSet.date}" required></div>
    <p class="ferr" id="sun-de" hidden></p>
    <div data-sunr>${r.html}</div>`;
}
/** The site panel's Sunlight section (ui/panel.ts siteMedia), under the map it lights. */
export const sunHTML = (id: Body, s: Site) => `<div class="sun" data-sun><h3 class="sec">Sunlight</h3>${inner(id, s)}</div>`;

// The block and the map follow on the app's next frame (one clock: a drag's many inputs light them once a frame; the
// shadows march the whole grid).
let dirty = false;
onUpdate(() => {
  if (!dirty) return; dirty = false;
  const s = state.view === 'site' && siteOf(state.body, state.site!), cv = pin.querySelector<HTMLCanvasElement>('canvas[data-map]');
  if (!s) return;
  if (VPS[0].kind === 'terrain') buildScenes();
  if (cv) drawMap(cv, state.body!, s);
});
vt.addEventListener('change', e => {
  const t = e.target as HTMLInputElement, s = siteOf(state.body, state.site ?? undefined); if (t.id !== 'sun-on' || !s) return;
  sunSet.on = t.checked;
  // First on: the date and the local time as they are now, so the light turns only to its true height (the date of now's
  // own solar day there: its UTC date can be a day, a sol or a lunation off).
  if (sunSet.on && !sunSet.date) { const now = simNow(); sunSet.date = solarDate(state.body!, s.lon, now); sunSet.h = Math.round(solarTime(state.body!, s.lon, now) * 4) / 4 % 24; }
  swap($('[data-sun]', vt), `<h3 class="sec">Sunlight</h3>${inner(state.body!, s)}`); dirty = true;
});
vt.addEventListener('input', e => {
  const t = e.target as HTMLInputElement, s = siteOf(state.body, state.site ?? undefined); if ((t.id !== 'sun-h' && t.id !== 'sun-d') || !s) return;
  if (t.id === 'sun-h') sunSet.h = +t.value;
  else {
    // Cleared or half typed (the input's value is then empty): marked, said, and the last whole date holds.
    const ok = /^\d{4}-\d\d-\d\d$/.test(t.value) && !isNaN(Date.parse(t.value)), m = $('#sun-de', vt);
    t.setAttribute('aria-invalid', String(!ok)); m.hidden = ok; m.textContent = ok ? '' : `Not a whole date: the sun stays as on ${sunSet.date}.`;
    if (ok) t.removeAttribute('aria-describedby'); else { t.setAttribute('aria-describedby', 'sun-de'); return; }
    sunSet.date = t.value;
  }
  // Only the readouts change in place: the slider keeps its drag and the focus.
  const r = readout(state.body!, s), h = $<HTMLInputElement>('#sun-h', vt);
  h.setAttribute('aria-valuetext', r.say); $('.srange output', vt).textContent = hm(sunSet.h); setHTML($('[data-sunr]', vt), r.html); dirty = true;
});
