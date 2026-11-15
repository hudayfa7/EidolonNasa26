// System view: Earth, Moon and Mars in a line-up with the sun at the left edge (prototype 1308–1312), their world
// labels and hover ring (1868–1883, overlay 2078–2090), the Beyond and info cues (2136), and the cue to the site
// selector grid (views/grid.ts).
import * as THREE from 'three';
import { fmtLight, lightInfo } from '../astro';
import type { Body } from '../coords';
import { BODIES, ORDER, OV } from '../data/bodies';
import { $, setStyle } from '../dom';
import { simNow, T_ } from '../motion';
import { setTerrain, type Route } from '../router';
import { bodies, showOnly, sunMix } from '../scene/bodies';
import { P, proj } from '../scene/frame';
import { layoutKey } from '../scene/layout';
import { release } from '../scene/orient';
import { LAY, overviewPose, setRig, slingshot, VPS, type Rect } from '../scene/rig';

export function playSystem(_r: Route, prev: Route) {
  const L0 = VPS[0];
  setTerrain(false);
  T_(LAY, { panel: 0, split: 0, grat: 0, top: 1 }, 1); T_(LAY, { ov: 1 }, .6, { delay: .6 });
  L0.only = null;
  if (prev.view === 'intro') setRig(L0, overviewPose()); else slingshot(L0, overviewPose(), prev.view === 'title' ? 2.0 : 1.6);
  showOnly(ORDER, .4); sunMix([]);
  for (const k of ORDER) release(bodies[k]);
}

/* ---------- World labels and the hover ring ---------- */
const canvas = $<HTMLCanvasElement>('#gl'), ring = $('#ring'), more = $('#more'), cue = $('#cue'), sites = $('#sites');
export const labels = {} as Record<Body, HTMLButtonElement>;
for (const id of ORDER) {
  const b = BODIES[id], el = document.createElement('button');
  el.className = 'olabel'; el.dataset.go = id;
  el.innerHTML = `<span class="n">${b.name}</span><span class="s">${b.sub}</span><span class="l"></span>`;
  el.addEventListener('mouseenter', () => setHover(id)); el.addEventListener('mouseleave', () => setHover(null));
  el.addEventListener('focus', () => setHover(id)); el.addEventListener('blur', () => setHover(null));
  $('#labels').appendChild(el); labels[id] = el;
}

export let hover: Body | null = null;
export function setHover(id: Body | null) {
  if (hover === id) return; hover = id;
  for (const k of ORDER) labels[k].classList.toggle('on', k === id);
  ring.classList.toggle('on', !!id); canvas.style.cursor = id ? 'pointer' : '';
  if (id) { const li = lightInfo(id, simNow()); $('.l', labels[id]).textContent = li ? `${fmtLight(li.sec)} light time` : 'You are here'; }
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), Q = { x: 0, y: 0, z: 0 };
const at: Partial<Record<Body, { x: number; y: number; r: number }>> = {};
// Each frame: labels beside or below their worlds, the ring around the hovered one, the cues with the overview.
export function placeSystem(R: Rect[]) {
  const vp = VPS[0], ov = LAY.ov;
  for (const id of ORDER) {
    const o = bodies[id], el = labels[id];
    if (!(ov > .02 && o.alpha > .02 && vp.kind === 'sys')) { setStyle(el, 'visibility', 'hidden'); continue; }
    proj(o.home, vp.cam, R[0], P); proj(_a.copy(o.home).add(_b.set(0, o.r, 0)), vp.cam, R[0], Q);
    const pr = Math.abs(Q.y - P.y), right = OV[layoutKey].pos[id][4] === 'r';
    at[id] = { x: P.x, y: P.y, r: pr };
    setStyle(el, 'visibility', 'visible'); setStyle(el, 'opacity', (ov * o.alpha).toFixed(3));
    setStyle(el, 'transform', right ? `translate3d(${(P.x + pr + 10).toFixed(1)}px,${P.y.toFixed(1)}px,0) translateY(-50%)` : `translate3d(${P.x.toFixed(1)}px,${(P.y + pr + 12).toFixed(1)}px,0) translateX(-50%)`);
    setStyle(el, 'text-align', right ? 'left' : 'center');
  }
  const h = hover && at[hover];
  if (h && ov > .5) {
    const s = h.r * 2 + 16; setStyle(ring, 'width', `${s}px`); setStyle(ring, 'height', `${s}px`);
    setStyle(ring, 'transform', `translate3d(${(h.x - s / 2).toFixed(1)}px,${(h.y - s / 2).toFixed(1)}px,0)`);
  } else if (ov < .5) ring.classList.remove('on');
  // Hidden (not only transparent) off the overview, or Tab and Enter would still reach them.
  const o = ov.toFixed(3), pe = ov > .6 ? 'auto' : 'none', vis = ov > .02 ? 'visible' : 'hidden';
  for (const el of [more, cue, sites]) { setStyle(el, 'opacity', o); setStyle(el, 'pointer-events', pe); setStyle(el, 'visibility', vis); }
}
