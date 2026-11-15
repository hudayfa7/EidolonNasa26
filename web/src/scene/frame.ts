// Per-frame update and draw (prototype 2019–2074, terrain viewports 2061–2064, overlay 2091–2135). frame() advances
// spin, sunlight, sprites, cameras, the pipeline's inputs and the DOM overlays; draw() renders the frame through
// scene/post.ts. Under ?capture, seek() runs frame() every 1/60 s and draw() once at the end.
import * as THREE from 'three';
import { subsolar } from '../astro';
import { ORDER } from '../data/bodies';
import { $, setStyle } from '../dom';
import { clamp, smooth } from '../coords';
import { RM, simNow, TIME } from '../motion';
import { state } from '../router';
import { footerCovers } from '../ui/carousel';
import { placeChrome } from '../ui/chrome';
import { sheetCovers } from '../ui/sheet';
import { placeScan } from '../ui/detection';
import { gratLabels, gratStep } from '../ui/graticule';
import { hud } from '../ui/hud';
import { placeMarkers } from '../ui/markers';
import { placeTUI } from '../ui/terrain-ui';
import { ghost, terrScenes } from '../terrain/mesh';
import { beyondCovers } from '../views/beyond';
import { gridCovers } from '../views/grid';
import { infoCovers } from '../views/info';
import { placeSystem } from '../views/system';
import { updateAnnot } from '../views/title';
import { bodies, bodyQuat, localDir, type BodyObj } from './bodies';
import { H, layoutKey, sheet, SH, W } from './layout';
import { sunVisible } from './occlude';
import { FX, holdFrame, renderPost } from './post';
import { BACKLIGHT, isPaused, LIGHT, measure, renderer } from './renderer';
import { camDist, computeRects, LAY, TAN, tOrbit, VPS, type Rect } from './rig';
import { ORBIT_Q, orbitLine, sat, satLight } from './satellite';
import { stars } from './stars';
import { core, disc, glare, ovCorona, ovDisc, ovGlow, ovSun, OVSUN, sunPos } from './sun';

/** Tweened scene state: title shot, limb glare, dawn (backlight → sunlight), title annotations, detection grade. */
export const G = { title: 0, glare: 0, dawn: 1, annot: 0, scan: 0, scanUI: 0 };

const _p = new THREE.Vector3(), _u = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion();
export type ScreenPt = { x: number; y: number; z: number };
export const P: ScreenPt = { x: 0, y: 0, z: 0 };
// World point → CSS pixels inside viewport rect r.
export function proj(v: THREE.Vector3, cam: THREE.Camera, r: Rect, out: ScreenPt) {
  _p.copy(v).project(cam); out.x = r.x + (_p.x * .5 + .5) * r.w; out.y = r.y + (-_p.y * .5 + .5) * r.h; out.z = _p.z; return out;
}

const panel = $('#panel');
let R: Rect[] = [], flare = 0, dtLast = 0;
// The panel is visibility:hidden until LAY.panel passes .01, and a hidden element can't take focus: on its way in (a phone's
// sheet, the panel after the system view), the focus a route gives it waits for it, unless the focus moved meanwhile.
let want: HTMLElement | null = null, from: Element | null = null;
export function focusPanel(t: HTMLElement | null) {
  want = null;
  if (panel.style.visibility === 'visible') t?.focus({ preventScroll: true }); else { want = t; from = document.activeElement; }
}
const occluders = ORDER.map(id => ({ c: bodies[id].home, r: 0 }));
// How far a phone's stacked compare viewport frames its block or globe beside its legend or caption (frame()).
const k2 = (asp: number) => sheet() ? LAY.split * smooth(1.3, 2, asp) : 0;
const lin = (a: number) => a ** 2.2;   // a glow's opacity, authored over sRGB, as light (renderer.ts asLight)

export function frame(time: number, dtMs: number) {
  const dt = dtLast = Math.min(dtMs / 1000, .05), sim = simNow(); R = computeRects();
  setStyle(panel, 'visibility', LAY.panel > .01 ? 'visible' : 'hidden');
  if (want && LAY.panel > .01) { const a = document.activeElement; if (a === from || a === document.body || !a) want.focus({ preventScroll: true }); want = null; }
  setStyle(panel, 'transform', sheet() ? `translateY(${((1 - LAY.panel) * 100).toFixed(2)}%)` : `translateX(${((LAY.panel - 1) * 100).toFixed(2)}%)`);
  setStyle(panel, 'height', sheet() ? `${(SH.f * 100).toFixed(2)}%` : '');   // the sheet at its snap, or where its grip is dragged
  const live = state.view === 'body' || state.view === 'compare' || state.view === 'site';
  for (const id of ORDER) {
    const o = bodies[id], u = o.mesh.material.uniforms;
    if (!o.hold) o.spin.rotation.y += (live && !RM ? 2 * Math.PI * TIME.rate / o.b.sid : (RM ? 0 : id === 'earth' && G.title > .5 ? .02 : .03)) * dt;
    o.alpha = o.fade.v * o.intro.v;
    const [la, lo] = subsolar(id, sim); bodyQuat(o, _q);
    localDir(o.b, la, lo, o.sunTrue).applyQuaternion(_q);
    // The dawn's light leads the camera's pull-back (eased out), so the terminator sweeps over the disc as it comes into
    // view rather than the camera passing close over the night side.
    const base = id === 'earth' && G.dawn < 1 ? _a.copy(BACKLIGHT).lerp(LIGHT, 1 - (1 - G.dawn) ** 3).normalize() : LIGHT;
    o.sunDir.copy(base).lerp(o.sunTrue, o.sunMix.v).normalize();
    // The views that read ground (body, site, compare) keep their sites with the sim clock, through its nights: a dim
    // fill from the viewer keeps the night side legible there (planet.frag.glsl); the opening keeps its dark night. Eased.
    u.fill.value += ((live ? .25 : 0) - u.fill.value) * (RM ? 1 : Math.min(1, dt * 2));
    const du = state.body === id ? G.scan : 0;   // the dived body's atmosphere fades under the grade
    for (let mi = 0; mi < o.mats.length; mi++) o.mats[mi].uniforms.opacity.value = o.alpha * (mi ? 1 - .75 * du : 1);
    u.grat.value = LAY.grat;
    const fine = id === state.body && state.view === 'body' && gratStep() === 10; u.gdiv.value.set(fine ? 36 : 12, fine ? 18 : 6);
  }
  // A held body keeps turning at the time rate with the camera tracking its site (Decisions 8), drawn in the body's own
  // frame: its site stays put and its light already follows the sim clock (the real subsolar point), so what is left is
  // its viewport's stars, which wheel the other way about its axis at the rate it would spin.
  if (live && !RM) for (let i = 0; i < R.length; i++) {
    const vp = VPS[i], sid = vp.only ?? state.body, o = sid ? bodies[sid] : null;
    if (o?.hold && vp.kind === 'sys') vp.starQ.premultiply(_q.setFromAxisAngle(_a.set(0, 1, 0).applyQuaternion(o.orient.quaternion), -2 * Math.PI * TIME.rate / o.b.sid * dt));
  }
  // Title satellite and the sunrise glare on Earth's limb
  const e = bodies.earth, ta = G.title * e.alpha, so1 = ta * G.dawn;   // Eidolon-1 and its orbit wait for the dawn (not in the intro's sky)
  const sa = time * .11; sat.position.set(Math.cos(sa) * 3.3, 0, Math.sin(sa) * 3.3).applyQuaternion(ORBIT_Q).add(e.home); sat.rotation.set(sa * .7, sa, .3);
  sat.visible = so1 > .01; orbitLine.position.copy(e.home); orbitLine.material.opacity = lin(.28 * so1); orbitLine.visible = so1 > .01;
  // Earth's clouds come and go with the title shot, drifting east at an eighth of its turn there (still under reduced
  // motion, as the turn is); on the frame clock, so ?capture seeks them.
  const eu = e.mesh.material.uniforms; eu.cloudK.value = G.title; if (!RM) eu.cloudU.value = (eu.cloudU.value + .0004 * dt) % 1;
  const gg = ta * G.glare; flare = gg;
  // The glare is small in the intro's close shot and the title's by full dawn.
  glare.scale.setScalar(e.r * (1.2 + 3.8 * G.glare * G.dawn)); glare.material.opacity = lin(gg * .8);
  core.scale.setScalar(e.r * (.75 + .45 * G.glare)); core.material.opacity = lin(gg);
  disc.scale.setScalar(e.r * .22); disc.material.opacity = lin(gg);
  const so = LAY.ov * Math.min(1, e.intro.v); ovSun.visible = so > .01;
  const sk = OVSUN[layoutKey][3]; ovDisc.material.opacity = lin(so); ovCorona.material.opacity = lin(so * .75 * sk); ovGlow.material.opacity = lin(so * .32 * sk);
  stars.material.uniforms.a.value = Math.min(1, Math.max(e.intro.v, G.title) * 1.5);
  stars.material.uniforms.dpr.value = renderer.getPixelRatio();
  // The grounds the CSS drew: the title's fades over 1.6 s as its transition did (on the app clock); grain with it.
  const tg = document.body.dataset.view === 'title' ? 1 : 0; FX.title += clamp(tg - FX.title, -dt / 1.6, dt / 1.6);
  FX.sky = G.scan; FX.grain = .08 * FX.title;
  // Cameras (the overlays below project through them before draw renders): a terrain viewport orbits its block,
  // pulled back on narrow viewports; a globe viewport follows its rig.
  for (let i = 0; i < R.length; i++) {
    const r = R[i], vp = VPS[i], cam = vp.cam, asp = r.w / r.h; vp.rect = r; cam.aspect = asp;
    if (vp.kind === 'terrain') {
      // The overlay frames the taller of its two blocks. Above the phone's sheet a block in a wide viewport draws smaller
      // and beside its legend (the camera steps along its own screen axis): a lone one (the site's, the overlay's; k1)
      // 15 % of the view to the left of the plate at the lower right, under its captions; each of the stacked pair (k2)
      // a tenth to the right of the legend at the lower left, a little smaller. By the split, so the toggle eases between
      // them, and by the viewport's shape, so a taller one (the sheet dragged to peek) frames its block whole and centred.
      // A tenth of the view lower (the target higher): the overlay's block, below its two captions, and each of the pair
      // (.15), its back corner below its caption's last line; the site's a tenth higher, its right corner above the plate.
      const k1 = sheet() ? (1 - LAY.split) * smooth(.75, 1, asp) : 0, kk = k2(asp);
      const d = tOrbit.dist * Math.max(1, 1.4 / asp) * (1 + .45 * k1 + .55 * kk), s = .2 * d * TAN * asp * (1.5 * k1 - kk);
      const ty = (ghost.on ? Math.max(terrScenes[i].topY, terrScenes[1].topY) : terrScenes[i].topY) * .35 + d * TAN * (ghost.on ? .1 * k1 : .15 * kk - .1 * k1);
      const ox = s * Math.cos(tOrbit.theta), oz = -s * Math.sin(tOrbit.theta);
      cam.position.set(ox + d * Math.sin(tOrbit.phi) * Math.sin(tOrbit.theta), ty + d * Math.cos(tOrbit.phi), oz + d * Math.sin(tOrbit.phi) * Math.cos(tOrbit.theta));
      cam.near = .05; cam.lookAt(ox, ty, oz);
    } else {
      // Each of a phone's stacked globes beside its caption: larger (to ~3/4 of the viewport's height) and right of the
      // caption, clear of Search this area in the Earth one's corner (the camera steps left).
      const k = k2(asp), d = camDist(vp.rig, asp) * (1 - .05 * k); cam.position.copy(vp.rig.target).addScaledVector(vp.rig.dir, d); cam.near = Math.max(.002, d * .02);
      cam.lookAt(vp.rig.target);
      if (k) { cam.updateMatrixWorld(); cam.position.addScaledVector(_a.setFromMatrixColumn(cam.matrixWorld, 0), -.4 * d * TAN * asp * k); }
    }
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }
  placeSun(e, VPS[0].cam);
  satLight.position.subVectors(sunPos, sat.position);   // Eidolon-1 lit from where the title's sun is
  // The stage's warm glow follows the light as the main viewport's camera sees it: the terrain's (the site's sun), the
  // globe's (its real subsolar point), else the system's; eased (2 per second), so a swap or an orbit slides it round.
  const v0 = VPS[0], body = state.body && live ? bodies[state.body] : null;
  _a.copy(v0.kind === 'terrain' ? terrScenes[0].light : body ? body.sunDir : LIGHT).transformDirection(v0.cam.matrixWorldInverse);
  const wl = Math.hypot(_a.x, _a.y), wx = wl > .2 ? _a.x / wl : -1, wy = wl > .2 ? -_a.y / wl : 0, ke = RM ? 1 : Math.min(1, dt * 2);
  FX.warmX += (wx - FX.warmX) * ke; FX.warmY += (wy - FX.warmY) * ke;
  overlay(sim);
  if (!covered()) measure(dtMs);   // only frames draw() renders: idle covered frames would read as smooth
}

// The title sun. Its path in the scene runs from just under the intro's horizon (dawn 0) to the title's upper-left limb
// (dawn 1), which passes behind Earth while the camera pulls back from the limb. So, seen from the camera, it keeps at
// least `lift` sun radii above Earth's limb, lift growing as the dawn starts: the sun rises clear of the horizon and
// stays in view through the move, and the path takes over again near the title. It sits on the path's side of the
// disc, turned toward the top of the frame early in the move (where narrow frames would cut the path's side off).
// limbUp: how far its centre is above the limb, in sun radii (fades the flare's streak, which would lie on the horizon).
const SUN_R = .07;   // the disc's radius in Earth radii (the sprite's bright core; also sunVisible's)
let limbUp = 0;
function placeSun(e: BodyObj, camera: THREE.Camera) {
  const cam = camera.position, w = _a.set(0, e.r * .49, -e.r * 1.25).lerp(_b.set(-e.r * 1.02, e.r * .92, -e.r * .7), G.dawn);
  const c = _c.copy(e.home).sub(cam), D = c.length(); c.divideScalar(D);
  const v = _p.copy(c).multiplyScalar(D).add(w), dist = v.length(), raw = v.angleTo(c);
  const side = _b.copy(w).addScaledVector(c, -w.dot(c)).normalize();
  const up = _u.setFromMatrixColumn(camera.matrixWorld, 1); side.lerp(up.addScaledVector(c, -up.dot(c)).normalize(), 1 - G.dawn).normalize();
  const limb = Math.asin(Math.min(1, e.r / D)), rs = Math.asin(Math.min(1, SUN_R * e.r / dist));
  const th = Math.max(raw, limb + 1.6 * rs * smooth(0, .1, G.dawn));
  limbUp = (th - limb) / rs;
  sunPos.copy(cam).addScaledVector(c, Math.cos(th) * dist).addScaledVector(side, Math.sin(th) * dist);
  glare.position.copy(sunPos); core.position.copy(sunPos); disc.position.copy(sunPos);
}

function overlay(sim: Date) {
  placeSystem(R); placeMarkers(R); hud(R, sim); gratLabels(R); placeScan(R); placeTUI(R); placeChrome(R);
  const opening = state.view === 'title' || state.view === 'intro';
  if (opening) updateAnnot();
  // The title sun's lens flare, dimmed by how much of its disc the bodies leave in view.
  FX.flare = 0;
  if (opening && flare > .005) {
    for (let i = 0; i < ORDER.length; i++) occluders[i].r = bodies[ORDER[i]].alpha > .5 ? bodies[ORDER[i]].r : 0;
    proj(sunPos, VPS[0].cam, R[0], P); FX.sunX = P.x / W; FX.sunY = 1 - P.y / H;
    FX.flare = flare * sunVisible(VPS[0].cam.position, sunPos, bodies.earth.r * SUN_R, occluders);
  }
  FX.streak = smooth(.5, 1.5, limbUp);
}

// Nothing renders while the stage can't be seen: a hidden tab, or Beyond, the info sheet, the title's credits, the site
// selector grid or the phone's sheet at full covering it whole (the canvas keeps its last frame underneath).
const covered = () => beyondCovers() || infoCovers() || footerCovers() || gridCovers() || sheetCovers();
/** Holds the frame as it stands for a crossfade (router.ts); false when nothing is drawn (paused, or covered). */
export function holdNow() {
  if (isPaused() || covered()) return false;
  holdFrame(R, G.scan); return true;
}
export function draw() {
  if (isPaused() || covered()) return;
  renderPost(R, dtLast, G.scan);   // the grade, like the sky, follows G.scan: a dive and its fade out
}
