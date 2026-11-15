// Camera rigs, viewports and moves (prototype 1181–1216). A rig frames an extent (w × h world units) around a target
// from a direction; camDist fits that extent to the viewport.
import * as THREE from 'three';
import gsap from 'gsap';
import { D2R, smooth, type Body } from '../coords';
import { BODIES, OV } from '../data/bodies';
import { MOTION, RM } from '../motion';
import { bodies, localDir, type BodyObj } from './bodies';
import { H, L, layoutKey, sheet, SH, TOPH, W } from './layout';
import { renderer } from './renderer';

const FOV = 32;
export const TAN = Math.tan(FOV / 2 * D2R);
const FOCUS_DIR = new THREE.Vector3(.16, .1, 1).normalize();

interface Pose { target: THREE.Vector3; dir: THREE.Vector3; ext: { w: number; h: number } }
export interface Rig extends Pose { zoom: number; tween: gsap.core.Tween | null; final: { target: THREE.Vector3; dir: THREE.Vector3 } }
export interface Rect { x: number; y: number; w: number; h: number }
// starQ: the stars' turn in this viewport, which wheels while its body is held (scene/frame.ts)
export interface Viewport { cam: THREE.PerspectiveCamera; rig: Rig; kind: 'sys' | 'terrain'; only: Body | null; rect: Rect; starQ: THREE.Quaternion }

const mkRig = (): Rig => ({ target: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), ext: { w: 1, h: 1 }, zoom: 1, tween: null, final: { target: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1) } });
export const VPS: Viewport[] = [0, 1].map(() => ({ cam: new THREE.PerspectiveCamera(FOV, 1, .005, 5000), rig: mkRig(), kind: 'sys', only: null, rect: { x: 0, y: 0, w: 1, h: 1 }, starQ: new THREE.Quaternion() }));
// Layout blend weights, tweened between views: panel open, split compare, system overview, graticule, top bar.
export const LAY = { panel: 0, split: 0, ov: 0, grat: 0, top: 0 };
// Terrain orbit camera (prototype 1184): drag and wheel move it; setTerrain (router.ts) eases it in on each swap.
export const tOrbit = { theta: .55, phi: .95, dist: 21 };

export const camDist = (rig: Rig, asp: number) => Math.max(rig.ext.h / TAN, rig.ext.w / (TAN * asp)) * rig.zoom;
export function overviewPose(): Pose { const o = OV[layoutKey]; return { target: new THREE.Vector3(...o.target), dir: new THREE.Vector3(...o.dir).normalize(), ext: { ...o.ext } }; }
export function focusPose(id: Body): Pose { const o = bodies[id], e = o.r * 1.62; return { target: o.home.clone(), dir: FOCUS_DIR.clone(), ext: { w: e, h: e } }; }
export function titlePose(): Pose {
  const h = bodies.earth.home;
  return layoutKey === 'tall'
    ? { target: h.clone().add(new THREE.Vector3(0, -2.9, 0)), dir: new THREE.Vector3(0, .04, 1).normalize(), ext: { w: 2.75, h: 6.2 } }
    : { target: h.clone().add(new THREE.Vector3(-2.5, -1.05, 0)), dir: new THREE.Vector3(0, .04, 1).normalize(), ext: { w: 5.4, h: 3.35 } };
}
// The intro's shot: Earth's air edge on, from above the top of the planet (a camera L from its horizon sits L² / 2R up,
// the horizon L / R below level), above the dense air (six scale heights) and tilted so the horizon sits just above the
// frame's bottom edge. The brief's gradient is that sky, and the title's pull-back starts from it, so there is no cut.
// The bottom telemetry sits on the glow above the horizon: a wide frame's horizon curves down below it at the corners,
// a tall frame's barely curves, so there it sits lower (about 2 % of the height up, under the corners).
export function limbPose(): Pose {
  const e = bodies.earth, R = e.r, L = Math.sqrt(12 * BODIES.earth.atmos!.H) * R, h = L * TAN;
  const up = FOV / 2 * D2R - L / R - (layoutKey === 'tall' ? -.01 : .03);
  const dir = new THREE.Vector3(0, -Math.sin(up), Math.cos(up)), cam = new THREE.Vector3(0, R + L * L / (2 * R), 0).add(e.home);
  return { target: cam.addScaledVector(dir, -L), dir, ext: { w: h * .4, h } };
}

export function setRig(vp: Viewport, p: Pose) {
  const r = vp.rig; r.tween?.kill(); r.tween = null;
  r.target.copy(p.target); r.dir.copy(p.dir); r.ext = { ...p.ext }; r.zoom = 1; r.final = { target: p.target.clone(), dir: p.dir.clone() };
}
// Camera move between poses: extent interpolated in log space, lifted by an arc so long moves pull out on the way.
export function slingshot(vp: Viewport, to: Pose, dur: number, done?: () => void, ease = 'power2.inOut') {
  const rig = vp.rig; rig.tween?.kill();
  const t0 = rig.target.clone(), d0 = rig.dir.clone(), w0 = rig.ext.w * rig.zoom, h0 = rig.ext.h * rig.zoom;
  const dq = new THREE.Quaternion().setFromUnitVectors(d0, to.dir), qi = new THREE.Quaternion(), qq = new THREE.Quaternion();
  const lift = Math.min(.9, t0.distanceTo(to.target) / Math.min(Math.max(w0, h0), Math.max(to.ext.w, to.ext.h)) * .12);
  // Zoom folds into the extent now, so a move that starts later (a dive after its orient phase) doesn't jump first.
  rig.final = { target: to.target.clone(), dir: to.dir.clone() }; rig.ext = { w: w0, h: h0 }; rig.zoom = 1;
  const st = { p: 0 };
  return rig.tween = gsap.to(st, { p: 1, duration: RM ? .001 : dur, ease,
    onUpdate() {
      const s = st.p, Lf = Math.exp(lift * Math.sin(Math.PI * s));
      rig.target.lerpVectors(t0, to.target, smooth(.03, .95, s));
      qq.copy(qi).slerp(dq, s); rig.dir.copy(d0).applyQuaternion(qq);
      rig.ext.w = Math.exp(Math.log(w0) + (Math.log(to.ext.w) - Math.log(w0)) * s) * Lf;
      rig.ext.h = Math.exp(Math.log(h0) + (Math.log(to.ext.h) - Math.log(h0)) * s) * Lf;
    }, onComplete() { rig.tween = null; done?.(); } });
}
// Dive (prototype 1240–1245): down to a surface point, ending just above it and looking mostly straight down. The point
// is taken at the body orientation q (the body is held), so the dive can be built before an orient phase that ends on q.
export function dive(vp: Viewport, o: BodyObj, q: THREE.Quaternion, lat: number, lon: number) {
  const n = localDir(o.b, lat, lon).applyQuaternion(q), pW = n.clone().multiplyScalar(o.r).add(o.home);
  const dir = n.clone().multiplyScalar(.8).add(vp.rig.dir.clone().multiplyScalar(.2)).normalize();
  return slingshot(vp, { target: pW, dir, ext: { w: o.r * .07, h: o.r * .07 } }, MOTION.dive, undefined, 'power3.inOut');
}
export function copyRig(dst: Viewport, src: Viewport) {
  const a = dst.rig, b = src.rig; a.tween?.kill();
  a.target.copy(b.target); a.dir.copy(b.dir); a.ext = { w: b.ext.w * b.zoom, h: b.ext.h * b.zoom }; a.zoom = 1;
}
// Viewport rectangles under the top bar, beside the panel (or down to the sheet's top edge, wherever it is), split for
// compare: side by side, or on a phone stacked, the target above its double (a wide viewport suits a block and a
// caption's line).
// The same two rect objects every call (no per-frame garbage): they always hold the current layout. Their edges are
// rounded to the drawing buffer's pixels, so the viewports (scene/post.ts) and the overlays placed from these rects
// agree, and a split's two viewports share one edge: no 1 px seam while the panel slides or compare splits.
const RA: Rect = { x: 0, y: 0, w: 1, h: 1 }, RB: Rect = { x: 0, y: 0, w: 1, h: 1 }, ONE = [RA], TWO = [RA, RB];
const set = (r: Rect, x: number, y: number, w: number, h: number) => {
  const p = renderer.getPixelRatio(), x0 = Math.round(x * p), y0 = Math.round(y * p);
  r.x = x0 / p; r.y = y0 / p; r.w = (Math.round((x + w) * p) - x0) / p; r.h = (Math.round((y + h) * p) - y0) / p;
};
export function computeRects(): Rect[] {
  const y = LAY.top * TOPH; let x = 0, w = W, h = H - y;
  if (sheet()) h = Math.max(1, H - y - H * SH.f * LAY.panel); else { x = L.panel * LAY.panel; w = W - x; }
  if (LAY.split < .002) { set(RA, x, y, w, h); return ONE; }
  if (sheet()) { const ht = h * (1 - .5 * LAY.split); set(RA, x, y, w, ht); set(RB, x, y + ht, w, h - ht); return TWO; }
  const wl = w * (1 - .5 * LAY.split);
  set(RA, x, y, wl, h); set(RB, x + wl, y, w - wl, h); return TWO;
}
