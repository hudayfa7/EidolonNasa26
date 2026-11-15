// Pointer, wheel and keyboard input on the globe, the terrain and the system view (prototype 1940–2016, inertia 2026);
// on touch, two fingers pinch to zoom, twist and move together to orbit.
import * as THREE from 'three';
import gsap from 'gsap';
import { areaOf, clamp, fmtLL, pinId } from '../coords';
import { ORDER, PICKABLE } from '../data/bodies';
import { twoFinger, type Pt } from '../gesture';
import { onUpdate } from '../motion';
import { back, go, routeOf, state } from '../router';
import { closeInfo, infoOpen, openInfo } from '../views/info';
import { holding } from '../views/site';
import { hover, labels, setHover } from '../views/system';
import { bodies, dirToLL, facing } from './bodies';
import { stageBox } from './layout';
import { computeRects, tOrbit, VPS } from './rig';

const canvas = document.querySelector<HTMLCanvasElement>('#gl')!, stage = canvas.parentElement!, live = document.querySelector('#live')!;
// A drag: its viewport, where it started, whether it moved (else its release is a tap); `pts` holds the pointers down
// on it, by id, at their last positions: two make a pinch. `pend`: fingers down on a marker or label, which a finger
// on the canvas makes a pinch (else the marker takes its tap).
let drag: { vi: number; sx: number; sy: number; moved: boolean } | null = null;
const pts = new Map<number, Pt>(), pend = new Map<number, Pt>();
const vel = { vi: -1, x: 0, y: 0 };
/** The surface point under the pointer on the body view (HUD cursor readouts, click to pin). */
export const cur = { on: false, lat: 0, lon: 0, x: 0, y: 0, local: new THREE.Vector3() };
export const stopInertia = () => { vel.vi = -1; };
/** The 3D view has the keyboard focus (its frame shows): the hints say its keys, the HUD's cursor is its centre. */
export const keyed = () => document.activeElement === canvas && canvas.matches(':focus-visible');

const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), Y = new THREE.Vector3(), X = new THREE.Vector3(), q = new THREE.Quaternion();
const bodyOfVp = (i: number) => i === 1 ? 'earth' : state.body;
const vpAt = (x: number, y: number) => computeRects().findIndex(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
const local = (e: MouseEvent) => [e.clientX - stageBox.left, e.clientY - stageBox.top];
// The globe takes drags, wheels and pins on the body view, and while a pin's search holds the frame (views/site.ts).
const onGlobe = () => state.view === 'body' || holding();
const zooms = () => ['body', 'site', 'compare'].includes(state.view);

// A second finger anywhere on the stage makes the drag a pinch (its release is no tap; the canvas takes the finger from
// a marker, so the marker gets no click); a third is ignored.
const join = (id: number, p: Pt) => { pts.set(id, p); pend.delete(id); canvas.setPointerCapture(id); drag!.moved = true; vel.vi = -1; };
stage.addEventListener('pointerdown', e => {
  const [x, y] = local(e);
  if (e.isPrimary) { drag = null; pend.clear(); }   // a first finger starts afresh: a lost pointerup or pointercancel leaves no stale drag
  if (drag) { if (pts.size === 1) join(e.pointerId, { x, y }); return; }
  if (e.target !== canvas) { if (e.pointerType === 'touch') pend.set(e.pointerId, { x, y }); return; }
  const vi = vpAt(x, y); if (vi < 0) return;
  drag = { vi, sx: x, sy: y, moved: false }; pts.clear(); pts.set(e.pointerId, { x, y }); canvas.setPointerCapture(e.pointerId); vel.vi = -1;
  const [f] = pend; if (f) join(...f);
});
for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => pend.delete((e as PointerEvent).pointerId), true);
canvas.addEventListener('pointermove', e => {
  const [x, y] = local(e), p = drag && pts.get(e.pointerId);
  if (!drag) { if (state.view === 'overview') pickHover(x, y); else if (onGlobe()) pickSurface(x, y); return; }
  if (!p) return;
  if (pts.size > 1) {
    const [a0, b0] = [...pts.values()].map(q => ({ ...q })); p.x = x; p.y = y; const [a1, b1] = pts.values();
    pinch(drag.vi, twoFinger(a0, b0, a1, b1)); return;
  }
  const dx = x - p.x, dy = y - p.y; p.x = x; p.y = y;
  if (Math.hypot(x - drag.sx, y - drag.sy) > 4) drag.moved = true;
  if (!drag.moved) return;
  // System view: a 140 px swipe left goes Beyond, up opens the info sheet.
  if (state.view === 'overview') { if (x - drag.sx < -140) { drag = null; go('beyond'); } else if (drag.sy - y > 140) { drag = null; openInfo(); } return; }
  const k = orbit(drag.vi, dx, dy);
  if (k) { vel.vi = drag.vi; vel.x = dx * k; vel.y = dy * k; pickSurface(x, y); }
});
// A tap picks at the release point: a touch sends no pointermove before it, so hover and cur may be stale or empty. A
// pinch's finger lifting leaves the other dragging on from where it is (the system view's swipes measured from there).
const endDrag = (e: PointerEvent) => {
  if (!pts.delete(e.pointerId) || !drag) return;
  if (pts.size) { const [r] = pts.values(); drag.sx = r.x; drag.sy = r.y; return; }
  if (!drag.moved && e.type === 'pointerup') {
    vel.vi = -1;
    const [x, y] = local(e);
    if (state.view === 'overview') { pickHover(x, y); if (hover) go(hover); }
    else if (onGlobe()) { pickSurface(x, y); if (cur.on && PICKABLE.includes(state.body!)) go(`${state.body}/${pinId(cur.lat, cur.lon)}`); }
  }
  drag = null;
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { if (!drag) { if (state.view === 'overview') setHover(null); cur.on = false; } });
// System view: 260 px of sideways wheel goes Beyond, 140 px down opens the info sheet; both reset after a 450 ms pause.
let wheelAcc = 0, infoAcc = 0, wheelT: gsap.core.Tween | null = null;
canvas.addEventListener('wheel', e => {
  if (state.view === 'overview') {
    e.preventDefault();
    const horiz = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY), d = horiz ? (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) : e.deltaY;
    wheelT?.kill(); wheelT = gsap.delayedCall(.45, () => { wheelAcc = infoAcc = 0; });
    if (horiz) { wheelAcc = Math.max(0, wheelAcc + d); if (wheelAcc > 260) { wheelAcc = 0; go('beyond'); } }
    else { infoAcc = Math.max(0, infoAcc + d); if (infoAcc > 140) { infoAcc = 0; openInfo(); } }
    return;
  }
  if (!zooms()) return;
  e.preventDefault();
  const [x, y] = local(e), vi = vpAt(x, y); if (vi >= 0) zoom(vi, Math.exp(e.deltaY * .0012));
}, { passive: false });
// A key pressed: from now the panel's heading shows its ring on a keyboard arrival (panel.css .title).
addEventListener('keydown', () => document.documentElement.classList.add('kb'), { once: true });
addEventListener('keydown', e => {
  // A key while an input method composes is the IME's; one while a dialog is up (My campaigns) is the dialog's: Escape
  // closes it, natively, wherever the focus is.
  if (!state.ready || e.isComposing || document.querySelector('dialog[open]')) return;
  if (e.key === 'Escape') { if (infoOpen()) closeInfo(); else back(); return; }
  const typing = (e.target as Element).closest?.('input, textarea');
  if (!typing && (e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey && state.view === 'body' && PICKABLE.includes(state.body!)) {
    const el = document.querySelector<HTMLInputElement>('#cin'); if (el) { e.preventDefault(); el.focus(); el.select(); }
    return;
  }
  // System view: arrows move across the world labels; right past Mars goes Beyond.
  if (state.view === 'overview' && !infoOpen() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    if (e.key === 'ArrowRight' && hover === 'mars') { go('beyond'); return; }
    const i = hover ? ORDER.indexOf(hover) : -1;
    labels[ORDER[i < 0 ? 0 : clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, ORDER.length - 1)]].focus();
  }
});
// Keys on the 3D view, a Tab stop where they move it (ui/chrome.ts): arrows turn the globe or orbit the terrain as a
// 24 px drag would (right and up look east and north), + and − zoom about a wheel notch, Enter pins the globe's centre
// where a click would pin. On compare's globes they turn Earth, whose view Search this area reads. Once the keys rest,
// the centre is said (a held arrow repeats): where Enter would pin.
const KEY: Record<string, [number, number]> = { ArrowLeft: [24, 0], ArrowRight: [-24, 0], ArrowUp: [0, 24], ArrowDown: [0, -24] };
let sayT: gsap.core.Tween | null = null;
canvas.addEventListener('keydown', e => {
  if (!state.ready || !zooms() || e.altKey || e.ctrlKey || e.metaKey) return;
  const vi = state.view === 'compare' && state.globe ? 1 : 0, k = KEY[e.key], id = bodyOfVp(vi);
  if (k) orbit(vi, ...k);
  else if ('+=-_'.includes(e.key) && e.key.length === 1) zoom(vi, '-_'.includes(e.key) ? 1.15 : 1 / 1.15);
  else if (e.key === 'Enter' && onGlobe() && VPS[0].kind === 'sys' && PICKABLE.includes(state.body!)) {
    e.preventDefault(); sayT?.kill();   // the new route is said (ui/chrome.ts), not the centre
    const [lat, lon] = facing(bodies[state.body!], VPS[0].cam); go(`${state.body}/${pinId(lat, lon)}`); return;
  } else return;
  e.preventDefault();
  if (!id || VPS[vi].kind !== 'sys' || !(onGlobe() || state.view === 'compare')) return;
  const at = routeOf(state);   // a route since (Escape) has its own camera and is said itself
  sayT?.kill(); sayT = gsap.delayedCall(.4, () => { if (routeOf(state) !== at) return; const [lat, lon] = facing(bodies[id], VPS[vi].cam); live.textContent = `Centre ${fmtLL(lat, lon, id, 1)}`; });
});

// A drag's move in viewport vi: the terrain orbits; a globe turns where a drag may turn it (the radians per pixel it
// turned, for the inertia), else 0.
function orbit(vi: number, dx: number, dy: number) {
  const vp = VPS[vi];
  if (vp.kind === 'terrain') { tOrbit.theta -= dx * .006; tOrbit.phi = clamp(tOrbit.phi - dy * .005, .18, 1.38); return 0; }
  if (!onGlobe() && state.view !== 'compare') return 0;
  const k = .0055 * vp.rig.zoom; rotateGlobe(vi, dx * k, dy * k); return k;
}
// The wheel's and the pinch's zoom (f over 1 moves out), in the wheel's limits.
function zoom(vi: number, f: number) {
  const vp = VPS[vi];
  if (vp.kind === 'sys' && state.view === 'site' && !holding()) return;   // a dive under way: zoom would reframe its camera move
  if (vp.kind === 'terrain') tOrbit.dist = clamp(tOrbit.dist * f, 9, 36); else vp.rig.zoom = clamp(vp.rig.zoom * f, .35, 1.5);
}
// Two fingers: their spread zooms, their midpoint orbits as one finger does, and a twist turns the block (or the globe
// about the line of sight) with them.
function pinch(vi: number, g: ReturnType<typeof twoFinger>) {
  if (!zooms()) return;
  zoom(vi, g.f); orbit(vi, g.dx, g.dy);
  if (VPS[vi].kind === 'terrain') tOrbit.theta += g.da; else if (onGlobe() || state.view === 'compare') rotateGlobe(vi, 0, 0, -g.da);
}
// Turn the globe in viewport vi about the camera's own axes (az: about its line of sight, counter-clockwise on screen);
// a drag cancels any orientation tween.
function rotateGlobe(vi: number, ax: number, ay: number, az = 0) {
  const id = bodyOfVp(vi); if (!id) return;
  const o = bodies[id], cam = VPS[vi].cam;
  o.oTween?.kill(); o.oTween = null;
  Y.set(0, 1, 0).applyQuaternion(cam.quaternion); X.set(1, 0, 0).applyQuaternion(cam.quaternion);
  o.orient.quaternion.premultiply(q.setFromAxisAngle(X, ay)).premultiply(q.setFromAxisAngle(Y, ax));
  if (az) o.orient.quaternion.premultiply(q.setFromAxisAngle(X.set(0, 0, 1).applyQuaternion(cam.quaternion), az));
}
function pickHover(x: number, y: number) {
  const r = VPS[0].rect;
  raycaster.setFromCamera(ndc.set((x - r.x) / r.w * 2 - 1, -((y - r.y) / r.h) * 2 + 1), VPS[0].cam);
  const hit = raycaster.intersectObjects(ORDER.map(k => bodies[k].mesh), false)[0];
  setHover(hit ? ORDER.find(k => bodies[k].mesh === hit.object)! : null);
}
function pickSurface(x: number, y: number) {
  const r = VPS[0].rect, o = state.body && bodies[state.body]; if (!o || VPS[0].kind !== 'sys') { cur.on = false; return; }
  raycaster.setFromCamera(ndc.set((x - r.x) / r.w * 2 - 1, -((y - r.y) / r.h) * 2 + 1), VPS[0].cam);
  const hit = raycaster.intersectObject(o.mesh, false)[0];
  if (!hit) { cur.on = false; canvas.style.cursor = ''; return; }
  const l = o.spin.worldToLocal(hit.point).normalize(); [cur.lat, cur.lon] = dirToLL(o.b, l);
  cur.on = true; cur.x = x; cur.y = y; cur.local.copy(l); canvas.style.cursor = PICKABLE.includes(state.body!) ? 'crosshair' : 'grab';
}

/**
 * The Earth in view in the globe compare's Earth viewport, as the search's bbox (Search this area, spec §3.5): rays on a
 * 13 × 13 grid over the viewport onto the globe, plus a pole when it faces the camera inside the view. Ground seen at
 * more than 60° from face-on (foreshortened over 2×, toward the limb) doesn't count: a zoomed globe still shows a sliver
 * of limb that would stretch the area over half the hemisphere.
 */
const _s = new THREE.Sphere(), _h = new THREE.Vector3(), _n = new THREE.Vector3();
export function earthInView() {
  const vp = VPS[1], o = bodies.earth, pts: { lat: number; lon: number }[] = [];
  if (state.view !== 'compare' || vp.kind !== 'sys') return null;
  o.spin.updateMatrixWorld(true); _s.set(o.home, o.r);
  const at = (x: number, y: number) => {
    raycaster.setFromCamera(ndc.set(x, y), vp.cam);
    if (!raycaster.ray.intersectSphere(_s, _h) || _n.copy(_h).sub(o.home).normalize().dot(raycaster.ray.direction) > -.5) return null;
    const [lat, lon] = dirToLL(o.b, o.spin.worldToLocal(_h).normalize()); return { lat, lon };
  };
  _h.copy(o.home).project(vp.cam);   // the globe's centre on screen: a phone's stacked globe sits right of the view's (scene/frame.ts)
  const c = at(_h.x, _h.y); if (!c) return null;
  for (let j = 0; j <= 12; j++) for (let i = 0; i <= 12; i++) { const p = at(i / 6 - 1, 1 - j / 6); if (p) pts.push(p); }
  const pole = (y: number) => {
    o.spin.localToWorld(_h.set(0, y, 0)); _n.copy(_h).sub(o.home).normalize();
    if (_n.dot(Y.copy(vp.cam.position).sub(_h).normalize()) < .5) return false;   // far side, or within 30° of the limb
    _h.project(vp.cam); return Math.abs(_h.x) <= 1 && Math.abs(_h.y) <= 1;
  };
  return areaOf(c, pts, pole(1), pole(-1));
}

// Inertia after a drag: the last drag step repeats each frame, decaying as exp(−5 t). Only where a drag turns the globe:
// once a held search answers, a fling still coasting (or released mid-dive) would undo the dive's turn to the site.
onUpdate((_, dtMs) => {
  if (drag || vel.vi < 0 || !(onGlobe() || state.view === 'compare') || Math.abs(vel.x) + Math.abs(vel.y) <= 1e-5) return;
  rotateGlobe(vel.vi, vel.x, vel.y); const k = Math.exp(-Math.min(dtMs / 1000, .05) * 5); vel.x *= k; vel.y *= k;
});
