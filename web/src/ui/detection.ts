// Detection frame on a site entry (prototype 1481–1507, overlay 2105–2111, reset 1296): the frame graded in the site's
// own palette (--grade-<its ramp>) over its sky (--sky-*), both in the pipeline (scene/post.ts), and the pin dot, ring
// and readouts over the site.
import * as THREE from 'three';
import gsap from 'gsap';
import { clamp, hudLL, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { doublesOf } from '../data/client';
import { rehearsesFor, type Site } from '../data/sites';
import { $, setClass, setStyle } from '../dom';
import { fillBar, RM, setReading } from '../motion';
import { bodies, bodyQuat, localDir } from '../scene/bodies';
import { G, P, proj } from '../scene/frame';
import { token } from '../scene/layout';
import { setGrade } from '../scene/post';
import { VPS, type Rect } from '../scene/rig';
import { terrScenes } from '../terrain/mesh';
import { genTerrain } from '../terrain/procedural';
import { matchLine } from './results';

const scan = $('#scan'), pinw = $('.pinw', scan), t1 = $('.t1', scan), rd = $('.rd', scan), row = $('.scan-row', scan);
let cur: { body: Body; local: THREE.Vector3 } | null = null, t1W = 0;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), d = (s: number) => RM ? 0 : s;

export function showScan(body: Body, s: Site) {
  const [sa, sb, sc] = token(`--grade-${s.t.pal}`).split(/\s+/);
  setGrade([sa, sb, sc], token(`--sky-${s.t.pal}`));
  scan.style.setProperty('--sa', sa); scan.style.setProperty('--sb', sb); scan.style.setProperty('--sc', sc);
  t1.innerHTML = `Site acquired<br>${BODIES[body].name}`; t1W = t1.offsetWidth;
  // What the site view's block is built from (views/site.ts, router.ts): a real elevation model, or the illustrative archetype.
  $('#sc1').textContent = genTerrain(body, s).src ? 'Real elevation' : 'Illustrative';
  $('#sc2').textContent = hudLL(s.lat, s.lon, body, 2);
  scanLine(body, s);
  cur = { body, local: localDir(BODIES[body], s.lat, s.lon) };
  gsap.killTweensOf(G, 'scan,scanUI');
  gsap.to(G, { scan: 1, duration: d(.8), ease: 'power2.inOut' });
  gsap.to(G, { scanUI: 1, duration: d(.4), delay: d(.3) });
  gsap.fromTo('#scan .dot', { scale: .2 }, { scale: 1, duration: d(.7), delay: d(.35), ease: 'back.out(1.8)' });
  gsap.fromTo('#scan .ring', { scale: .4, opacity: 0 }, { scale: 1, opacity: .6, duration: d(.9), delay: d(.4), ease: 'power2.out' });
  gsap.fromTo('#scan .t, #scan .scan-row div, #scan .top', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: d(.5), stagger: d(.08), delay: d(.45) });
}

// The Matching readout: the site's search (data/client.ts, started with the route) as it stands; a Moon pin beyond 60°
// has had its no_dem answer by now. A search by coordinates still running holds the frame (views/site.ts): its bar fills,
// and its answer flashes the line as it lands. An Earth site has no search: what it rehearses.
export function scanLine(body: Body, s: Site) {
  const el = $('#sc3h'); $('.pbar', el)?.remove();
  if (body === 'earth') { el.firstChild!.nodeValue = 'Rehearses'; setReading($('#sc3'), `${rehearsesFor(s.id).length} target sites`); return; }
  const e = doublesOf(body, s), wait = e.busy && !e.res && !s.iau;
  el.firstChild!.nodeValue = 'Matching'; setReading($('#sc3'), matchLine(e, BODIES[body].name, !s.iau));
  if (wait) { el.insertAdjacentHTML('beforeend', '<span class="pbar"><i></i></span>'); fillBar($('.pbar i', el), e.t0, 10); }
}

export function hideScan() {
  gsap.to(G, { scanUI: 0, duration: d(.5), delay: d(.35) });
  gsap.to(G, { scan: 0, duration: d(1.2), delay: d(.3), ease: 'power2.inOut', onComplete: () => { cur = null; } });
}

// Leaving the site view (or a dive cut short): fade the frame out.
export function resetScan() {
  gsap.killTweensOf(G, 'scan,scanUI'); gsap.to(G, { scan: 0, scanUI: 0, duration: .3 });
  cur = null;
}

// Each frame: the frame's opacity, and the dot over the site (on the globe), or over the block once terrain shows.
export function placeScan(R: Rect[]) {
  setStyle(scan, 'opacity', G.scanUI.toFixed(3));
  // The frame's text shows only while it is more than half there, where the terrain's captions, notes, legends and
  // contour labels have faded out (ui/terrain-ui.ts placeTUI): the two never print over each other.
  const tx = clamp(4 * G.scanUI - 2, 0, 1).toFixed(3); setStyle(rd, 'opacity', tx); setStyle(row, 'opacity', tx);
  const vp = VPS[0], r = R[0]; if (G.scanUI <= .01 || !cur || !r) return;
  // Over the main viewport, as it is now: on a deep link the panel is still sliding in.
  setStyle(scan, 'left', `${r.x}px`); setStyle(scan, 'top', `${r.y}px`); setStyle(scan, 'width', `${r.w}px`); setStyle(scan, 'height', `${r.h}px`);
  // From the body's quaternion rather than its world matrix, which only updates on draw (capture steps skip draws).
  // On the globe the site can turn away (the globe stays usable while a search holds the frame): the dot hides then.
  let seen = true;
  if (vp.kind === 'sys') {
    const o = bodies[cur.body], n = _a.copy(cur.local).applyQuaternion(bodyQuat(o, _q)); seen = _b.copy(vp.cam.position).sub(o.home).dot(n) > o.r;
    proj(n.multiplyScalar(o.r).add(o.home), vp.cam, r, P);
  } else proj(_a.set(0, terrScenes[0].topY * .45, 0), vp.cam, r, P);
  setStyle(pinw, 'opacity', seen ? '1' : '0');
  // "Site acquired" reads left of the dot, or right of it where it would cross the viewport's left edge (a phone's block).
  setClass(t1, 'r', P.x - r.x - 62 - t1W < 8);
  setClass(scan, 'short', r.h < 240);
  setStyle(pinw, 'transform', `translate3d(${(P.x - r.x).toFixed(1)}px,${(P.y - r.y).toFixed(1)}px,0)`);
}
