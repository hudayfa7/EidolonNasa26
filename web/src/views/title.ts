// Title: Earth from low orbit, the sun on the limb, Eidolon-1, the wordmark reveal and the annotations (prototype
// 1531–1574, 1617–1649).
import * as THREE from 'three';
import gsap from 'gsap';
import { ORDER } from '../data/bodies';
import { fmtLL } from '../coords';
import { SITES } from '../data/sites';
import { $, $$, setAttr, setStyle, setText } from '../dom';
import { MOTION, RM, T_ } from '../motion';
import { setTerrain } from '../router';
import { bodies, facing, localDir, showOnly, sunMix } from '../scene/bodies';
import { G, P, proj } from '../scene/frame';
import { H, layoutKey, W } from '../scene/layout';
import { release, unhold } from '../scene/orient';
import { LAY, limbPose, setRig, slingshot, titlePose, VPS } from '../scene/rig';
import { sunVisible } from '../scene/occlude';
import { sat } from '../scene/satellite';
import { runIntro } from './intro';

const titleEl = $('#title'), bigEl = $('.big');
bigEl.innerHTML = [...'Eidolon'].map(c => `<span class="ch"><span class="g">${c}</span><span class="bar"></span></span>`).join('');
let titleTl: gsap.core.Timeline | null = null, revealTl: gsap.core.Timeline | null = null;

// From the intro: dawn breaks on the limb while the camera pulls back to the title shot; the wordmark lands at 3.2 s.
// From elsewhere: a shorter move, wordmark at 1.1 s.
export function playTitle(fromIntro: boolean) {
  const L0 = VPS[0];
  document.body.dataset.view = 'title';
  T_(LAY, { panel: 0, split: 0, grat: 0, ov: 0, top: 0 }, .8);
  setTerrain(false); L0.only = null;   // Back from a site or compare (a deep link's history): the globe again, so the intro too
  showOnly(['earth'], 0); sunMix([]);
  for (const k of ORDER) if (k === 'earth') release(bodies.earth); else unhold(bodies[k]);
  gsap.to(titleEl, { autoAlpha: 1, duration: .6, delay: fromIntro ? .8 : 0 });
  titleEl.scrollTop = 0;
  titleTl?.kill(); revealTl?.kill();
  resetWord();
  const tl = titleTl = gsap.timeline(), at = (s: number) => RM ? 0 : s;
  if (fromIntro) {
    // Skip intro leaves the glare short of the sunrise's .75: it swells there first, as the sunrise does, not in one frame.
    const swell = G.glare < .75 ? at(.7) : 0;
    setRig(L0, limbPose()); Object.assign(G, { dawn: 0, title: 1 });
    tl.to(G, { glare: .75, duration: swell, ease: 'power2.in' }, 0)
      .to(G, { dawn: 1, duration: at(MOTION.titleMove), ease: 'power2.inOut' }, at(.1))
      .to(G, { glare: 1, duration: at(MOTION.titleMove), ease: 'power2.inOut' }, Math.max(at(.1), swell))
      .add(() => { slingshot(L0, titlePose(), MOTION.titleMove); }, at(.1));
  } else {
    G.dawn = 1; tl.to(G, { glare: 1, title: 1, duration: 1 }, 0);
    slingshot(L0, titlePose(), 1.8);
  }
  // The reveal is built when it plays: it measures the wordmark, and its first sets render immediately.
  tl.add(revealTitle, at(fromIntro ? MOTION.titleReveal : 1.1));
}
// Leaving mid-move: the killed timeline owned the dawn tween, so dawn finishes here (else Earth stays backlit).
export function leaveTitle() {
  titleTl?.kill(); revealTl?.kill(); titleTl = revealTl = null;
  // Only the title's own values: overwrite:true would also kill the detection frame's delayed fade-out on G.
  gsap.to(titleEl, { autoAlpha: 0, duration: .5 }); gsap.killTweensOf(G, 'title,glare,annot,dawn');
  gsap.to(G, { title: 0, glare: 0, annot: 0, duration: .8 }); gsap.to(G, { dawn: 1, duration: RM ? 0 : .8 });   // the dawn's light sweeps the terminator: a move
}
function resetWord() {
  gsap.set('.big .g', { opacity: 0 }); gsap.set('.big .bar', { visibility: 'hidden', scaleX: 1, y: 0 });
  gsap.set('.blurb, .meta-row, .lockup', { opacity: 0, y: 12 }); G.annot = 0;
}
// Seven bars carry one gradient across the whole word (--bw, --bx), measured from the laid-out letters (again when
// a font lands late), drop in from above and below, then collapse to uncover the letters.
export function measureBars() {
  const wr = bigEl.getBoundingClientRect();
  return $$('.big .ch').map(ch => {
    const r = ch.getBoundingClientRect(), bar = $('.bar', ch);
    bar.style.setProperty('--bw', wr.width + 'px'); bar.style.setProperty('--bx', -(r.left - wr.left) + 'px');
    return bar;
  });
}
function revealTitle() {
  const bars = measureBars(), split = 3, d = (s: number) => RM ? 0 : s;
  const far = innerHeight * .9, tl = revealTl = gsap.timeline();
  tl.set(bars, { visibility: 'visible' })
    .fromTo(bars.slice(0, split), { y: -far }, { y: 0, duration: d(MOTION.bars), ease: 'power4.out', stagger: { each: d(MOTION.barStagger), from: 'end' } }, 0)
    .fromTo(bars.slice(split), { y: far }, { y: 0, duration: d(MOTION.bars), ease: 'power4.out', stagger: d(MOTION.barStagger) }, 0)
    .set('.big .g', { opacity: 1 }, d(1.15))
    .to(bars, { scaleX: 0, duration: d(.7), ease: 'power3.inOut', stagger: d(.06) }, d(1.3))
    .to('.lockup, .blurb, .meta-row', { opacity: 1, y: 0, duration: d(.9), ease: 'power2.out', stagger: d(.14) }, d(1.6))
    .to(G, { annot: 1, duration: d(1.2) }, d(1.5));
}
$('#replay').addEventListener('click', () => { gsap.to(titleEl, { autoAlpha: 0, duration: .3 }); leaveTitle(); runIntro(); });
$('#totop').addEventListener('click', () => titleEl.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

/* ---------- Annotations: a dashed frame, crosshair, rings and labels on Earth's analog sites, Eidolon-1 ---------- */
const NS = 'http://www.w3.org/2000/svg', ann = $<SVGSVGElement>('#annot');
const mk = (tag: string, at: Record<string, string | number>, par: Element = ann) => {
  const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, String(at[k])); par.appendChild(e); return e;
};
const mono = 'Geist Mono, ui-monospace, monospace';
const A = {
  frame: mk('rect', { fill: 'none', stroke: 'rgba(255,255,255,.32)', 'stroke-dasharray': '4 6', 'stroke-width': 1 }),
  vl: mk('line', { stroke: 'rgba(255,255,255,.18)', 'stroke-dasharray': '4 6' }), hl: mk('line', { stroke: 'rgba(255,255,255,.18)', 'stroke-dasharray': '4 6' }),
  star: mk('path', { stroke: '#fff', 'stroke-width': 1, fill: 'none' }),
  circles: [0, 1, 2].map(() => mk('circle', { fill: 'none', stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1 })),
  sites: SITES.earth.map(s => {
    const g = mk('g', {}) as SVGGElement; mk('circle', { r: 3.5, fill: '#E9EDF0' }, g);
    const t = mk('text', { x: 9, y: 3.5, fill: 'rgba(233,237,240,.82)', 'font-size': 10, 'font-family': mono }, g) as SVGTextElement;
    t.textContent = `${s.name}  ${fmtLL(s.lat, s.lon, 'earth')}`;
    return { s, g, t, w: 0, x: 0, y: 0, d: 0, on: false };
  }),
  sat: (() => {
    const g = mk('g', {}); mk('circle', { r: 3, fill: '#F2885F' }, g);
    const t = mk('text', { x: 9, y: -7, fill: 'rgba(233,237,240,.9)', 'font-size': 10, 'font-family': mono }, g) as SVGTextElement;
    t.textContent = 'Eidolon-1  412 km';
    return { g, t, w: 0 };
  })(),
};
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _v = new THREE.Vector3();
const RING_R = [64, 104, 150], placed = A.sites.map(() => ({ x: 0, y: 0 })), occ = [{ c: new THREE.Vector3(), r: 0 }];

// Labels and rings keep out of the lockup, wordmark and blurb: their layout boxes in the hero, which are the SVG's
// own coordinates (offsets ignore the reveal's transforms), measured again when the stage size changes.
type Box = { l: number; t: number; r: number; b: number };
let boxes: Box[] = [], boxW = 0, boxH = 0;
function textBoxes() {
  if (W === boxW && H === boxH) return boxes;
  boxW = W; boxH = H;
  return boxes = $$('.lockup, .big, .blurb').map(e => ({ l: e.offsetLeft, t: e.offsetTop, r: e.offsetLeft + e.offsetWidth, b: e.offsetTop + e.offsetHeight }));
}
function overlaps(l: number, t: number, r: number, b: number) {
  for (const x of boxes) if (l < x.r && r > x.l && t < x.b && b > x.t) return true;
  return false;
}
function boxDist(x: number, y: number) {
  let d = Infinity;
  for (const q of boxes) d = Math.min(d, Math.hypot(Math.max(q.l - x, 0, x - q.r), Math.max(q.t - y, 0, y - q.b)));
  return d;
}

// The annotations are fixed over the canvas (they mark what it shows) while the hero's text scrolls: they fade out over
// the first eighth of a screen of scroll, so the text never runs into them.
let scrolled = 0;
titleEl.addEventListener('scroll', () => { scrolled = titleEl.scrollTop; }, { passive: true });
const tCoord = $('#t-coord');
export function updateAnnot() {
  // The meta row's place: the point of Earth the title looks down on, as Earth turns under it.
  const [la, lo] = facing(bodies.earth, VPS[0].cam); setText(tCoord, `Low orbit over ${fmtLL(la, lo, 'earth', 0)}`);
  const op = G.annot * Math.max(0, 1 - scrolled / (H * .125));
  setStyle(ann, 'opacity', op.toFixed(3)); if (op < .01) return;
  const tall = layoutKey === 'tall', fx = W * (tall ? .08 : .2), fy = H * (tall ? .1 : .2), fw = W * (tall ? .84 : .56), fh = H * (tall ? .4 : .5), cx = fx + fw * .5, cy = fy + fh * .5;
  setAttr(A.frame, 'x', fx); setAttr(A.frame, 'y', fy); setAttr(A.frame, 'width', fw); setAttr(A.frame, 'height', fh);
  setAttr(A.vl, 'x1', cx); setAttr(A.vl, 'x2', cx); setAttr(A.vl, 'y1', 0); setAttr(A.vl, 'y2', H);
  setAttr(A.hl, 'y1', cy); setAttr(A.hl, 'y2', cy); setAttr(A.hl, 'x1', 0); setAttr(A.hl, 'x2', W);
  setAttr(A.star, 'd', `M${cx - 12} ${cy}H${cx + 12}M${cx} ${cy - 12}V${cy + 12}M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx + 5} ${cy - 5}L${cx - 5} ${cy + 5}`);
  const e = bodies.earth, cam = VPS[0].cam, r = VPS[0].rect; e.spin.updateMatrixWorld(true); textBoxes();
  const inset = Math.max(18, Math.min(60, W * .04));   // the hero's side inset (.blurb's right)
  for (const a of A.sites) {
    const p = e.spin.localToWorld(localDir(e.b, a.s.lat, a.s.lon, _p));
    a.on = _n.copy(p).sub(e.home).normalize().dot(_v.copy(cam.position).sub(p).normalize()) > .2;
    proj(p, cam, r, P); a.x = P.x; a.y = P.y; a.d = p.distanceTo(cam.position);
    setAttr(a.g, 'transform', `translate(${P.x.toFixed(1)},${P.y.toFixed(1)})`); setStyle(a.g, 'opacity', a.on ? '1' : '0');
  }
  // A label shows when it clears the text boxes, the labels already placed and every other visible site dot. The rings
  // go round the three facing sites nearest the camera.
  let k = 0, np = 0;
  const near = A.sites.filter(a => a.on).sort((p, q) => p.d - q.d).slice(0, 3);
  for (const a of A.sites) {
    if (!a.w) a.w = a.t.getComputedTextLength();
    const l = a.x - 6, rt = a.x + 9 + a.w + 4, t = a.y - 9, b = a.y + 9;
    let clear = a.on && a.y > 70 && a.x < W - 200 && rt < W - inset && !overlaps(l, t, rt, b);
    for (let j = 0; clear && j < np; j++) clear = Math.abs(placed[j].y - a.y) > 22 || Math.abs(placed[j].x - a.x) > 220;
    for (const o of A.sites) if (clear && o !== a && o.on && o.x > l && o.x < rt && o.y > t && o.y < b) clear = false;
    setStyle(a.t, 'opacity', clear ? '1' : '0'); if (clear) { placed[np].x = a.x; placed[np].y = a.y; np++; }
    if (near.includes(a)) {   // the ring shrinks to stay out of the text boxes, and goes when it gets too small
      const c = A.circles[k++], rr = Math.min(RING_R[k - 1], boxDist(a.x, a.y) - 6);
      setAttr(c, 'cx', a.x); setAttr(c, 'cy', a.y); setAttr(c, 'r', rr < 16 ? 0 : rr.toFixed(1));
    }
  }
  for (; k < 3; k++) setAttr(A.circles[k], 'r', 0);
  // The satellite tag reads right of its dot; it flips left when a site dot sits under it or the viewport's edge cuts it,
  // and hides if both sides are taken, or while Eidolon-1 is behind Earth (as its model is, by depth).
  const S = A.sat; proj(sat.position, cam, r, P); setAttr(S.g, 'transform', `translate(${P.x.toFixed(1)},${P.y.toFixed(1)})`);
  occ[0].c.copy(e.home); occ[0].r = e.r; setStyle(S.g, 'opacity', sunVisible(cam.position, sat.position, .05, occ) > .5 ? '1' : '0');
  if (!S.w) S.w = S.t.getComputedTextLength();
  const dotIn = (l: number, rt: number) => A.sites.some(a => a.on && a.x > l - 4 && a.x < rt + 4 && a.y > P.y - 21 && a.y < P.y + 1);
  const right = P.x + 9 + S.w < W - 4 && !dotIn(P.x + 9, P.x + 9 + S.w), left = !right && P.x - 9 - S.w > 4 && !dotIn(P.x - 9 - S.w, P.x - 9);
  setAttr(S.t, 'x', right ? 9 : -9); setAttr(S.t, 'text-anchor', right ? 'start' : 'end'); setStyle(S.t, 'opacity', right || left ? '1' : '0');
}
