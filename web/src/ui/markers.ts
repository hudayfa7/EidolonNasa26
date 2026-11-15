// Site markers on the globes (prototype 1884–1904, projection 2091–2103): the featured sites on the body view; on
// the globe compare, the target's sites (or its pin) on the left and the site's Earth doubles (its search results
// once they land, or its curated analog sites when the engine has no elevation there) on the right, over the 14
// established analog sites as a faint layer (plan, Data seam). A result is an Earth pin: a square for its 18.8 km
// footprint, ringed and tagged when it lies inside an established analog site.
import * as THREE from 'three';
import { fmtLL, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { cellsOf, doublesOf, knownOf } from '../data/client';
import { establishedAt, SITES, siteOf, type Site } from '../data/sites';
import { $, $$, esc, setClass, setStyle } from '../dom';
import { go, routeOf, state } from '../router';
import { bodies, localDir } from '../scene/bodies';
import { P, proj } from '../scene/frame';
import { LAY, VPS, type Rect } from '../scene/rig';
import { labelSpot } from './label-spot';

const markersEl = $('#markers');
interface Marker { el: HTMLButtonElement; ml: HTMLElement; local: THREE.Vector3; x: number; y: number; on: boolean; faint: boolean; w: number; h: number; dx: number; dy: number }
let MK: Marker[][] = [[], []];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const bodyOfVp = (i: number) => i === 1 ? 'earth' : state.body;

// Rebuilt as the doubles change (a search or Show more landing): a marker that held the focus gets it back.
export function buildMarkers() {
  const f = markersEl.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.k : undefined;
  markersEl.innerHTML = ''; MK = [[], []];
  const add = (vi: number, id: Body, list: Site[], sel: string | null, faint = false) => { for (const s of list) {
    // Pins (search results are Earth pins) carry their coordinates: two cells can share a country. An Earth pin's
    // footprint is drawn at the marker's size (at globe scale 18.8 km is under 2 px); a ring round it marks the tag,
    // which its label spells out.
    const fp = s.custom && id === 'earth', k = fp ? establishedAt(s.lat, s.lon) : undefined;
    const el = document.createElement('button'); el.className = `marker${fp ? ' fp' : ''}${k ? ' tagged' : ''}${faint ? ' est' : ''}`; el.dataset.k = `${vi}|${s.id}`;
    el.setAttribute('aria-label', s.custom ? `${s.name}, ${fmtLL(s.lat, s.lon, id, 4)}${fp ? ', 18.8 km footprint' : ''}${k ? `, inside ${k.name}` : ''}` : `${s.name}${faint ? ', established analog site' : ''}`);
    if (faint) el.tabIndex = -1;   // a reference layer: Tab goes through the doubles; the Earth view lists these sites
    el.innerHTML = `<span class="ml">${esc(s.name)}${k ? `<i>Analog site: ${k.name}</i>` : ''}</span>`; el.addEventListener('click', () => markerClick(vi, s.id));
    el.classList.toggle('is-sel', s.id === sel);
    markersEl.appendChild(el); MK[vi].push({ el, ml: el.firstElementChild as HTMLElement, local: localDir(BODIES[id], s.lat, s.lon).multiplyScalar(1.004), x: 0, y: 0, on: false, faint, w: 0, h: 0, dx: 0, dy: 0 });
  } };
  const id = state.body!;
  if (state.view === 'body') add(0, id, SITES[id], state.site);
  if (state.view === 'compare' && state.globe) {
    const s = siteOf(id, state.site!)!, e = doublesOf(id, s), dbls = e.res ? cellsOf(e.res).map(x => x.id) : [...knownOf(s, e)];
    if (!dbls.includes(state.dbl!)) dbls.push(state.dbl!);   // a double from an Earth site's Rehearses list isn't a result
    add(0, id, s.custom ? [s] : SITES[id], state.site);
    add(1, 'earth', SITES.earth.filter(k => !dbls.includes(k.id)), null, true);   // first, so the doubles draw over them
    add(1, 'earth', dbls.map(d => siteOf('earth', d)!), state.dbl);
  }
  if (f) $$<HTMLElement>('.marker', markersEl).find(m => m.dataset.k === f)?.focus({ preventScroll: true });
}
function markerClick(vi: number, id: string) {
  if (state.view !== 'compare') return go(`${state.body}/${id}`);
  if (vi === 1) return go(routeOf({ ...state, dbl: id, book: null }));   // another double: its comparison, not the same booking step
  // Another target site: compared with its first double, or opened when it has none. A search by name waits for its
  // answer (a cached name: 20 ms); one by coordinates (5–10 s) opens the site at once, whose panel shows the progress.
  const body = state.body!, globe = state.globe, at = routeOf(state), t = siteOf(body, id)!, e = doublesOf(body, t);
  const open = () => { const d = e.res ? cellsOf(e.res)[0]?.id : knownOf(t, e)[0]; go(routeOf(d ? { body, site: id, dbl: d, globe } : { body, site: id })); };
  if (e.res || e.err || !t.iau) return open();
  e.done.then(() => { if (routeOf(state) === at) open(); });
}

// Each frame: follow the globe; hide markers on the far side, while the camera moves, and while the panel slides.
export function placeMarkers(R: Rect[]) {
  MK.forEach((list, i) => {
    const vp = VPS[i], r = R[i], id = bodyOfVp(i), o = id && bodies[id];
    const ok = !!r && !!o && vp.kind === 'sys' && (state.view === 'body' || state.view === 'compare') && LAY.panel > .6 && !vp.rig.tween;
    if (!ok) { for (const m of list) setClass(m.el, 'away', true); return; }
    o.spin.updateMatrixWorld(true);
    for (const m of list) {
      o.spin.localToWorld(_a.copy(m.local)); _b.copy(_a).sub(o.home).normalize();
      proj(_a, vp.cam, r, P); m.x = P.x; m.y = P.y;
      // Facing the camera and inside its own viewport: a zoomed globe's markers would land on the other one.
      m.on = _b.dot(_c.copy(vp.cam.position).sub(_a).normalize()) > .12 && o.alpha >= .5 && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
      setClass(m.el, 'away', !m.on);
    }
    spread(list);
    for (const m of list) {
      setStyle(m.el, 'transform', `translate3d(${m.x.toFixed(1)}px,${m.y.toFixed(1)}px,0)`);
      // Its label goes where it stays inside the viewport and off the other markers (ui/label-spot.ts): results
      // cluster by region, and the selected label is always shown.
      if (!m.on) continue;
      if (!m.w) { m.w = m.ml.offsetWidth; m.h = m.ml.offsetHeight; }
      [m.dx, m.dy] = labelSpot(m, m.w, m.h, r, list);
      setStyle(m.ml, 'transform', `translate(${m.dx.toFixed(1)}px,${m.dy.toFixed(1)}px)`);
    }
  });
}
/** Whether a box (CSS px) touches a visible marker of the first globe or its label: the graticule's labels keep off them
 *  (ui/graticule.ts, placed after the markers each frame). */
export function onMarker(l: number, t: number, w: number, h: number) {
  for (const m of MK[0]) if (m.on && ((l < m.x + 11 && l + w > m.x - 11 && t < m.y + 11 && t + h > m.y - 11)
    || (l < m.x + m.dx + m.w && l + w > m.x + m.dx && t < m.y + m.dy + m.h && t + h > m.y + m.dy))) return true;
  return false;
}

// Visible markers closer than SPREAD px on screen (the Moon's four south-pole sites) are pushed apart pairwise over a
// few passes, so each stays visible and clickable; the push grows smoothly from zero as they converge. Hidden ones
// (`on` false) are skipped, and the faint layer moves only among itself: a result inside a site sits on it.
const SPREAD = 14;
function spread(list: Marker[]) {
  for (let pass = 0; pass < 4; pass++) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (!a.on || !b.on || a.faint !== b.faint || d >= SPREAD) continue;
    if (d < 1e-3) { dx = Math.cos(j); dy = Math.sin(j); d = 1; }   // coincident: any fixed direction
    const k = (SPREAD - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k;
  }
}
