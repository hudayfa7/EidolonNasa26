// Body orientation holds (prototype 1218–1239, 1762–1767). The only module that writes `hold`: a held body stops
// spinning; every orientation tween first folds the spin into the orientation.
import * as THREE from 'three';
import gsap from 'gsap';
import { subsolar } from '../astro';
import { clamp, type Body } from '../coords';
import { siteOf } from '../data/sites';
import { RM, simNow } from '../motion';
import { bodies, bodyQuat, localDir, orientFor, type BodyObj } from './bodies';
import type { Viewport } from './rig';

const Y = new THREE.Vector3(0, 1, 0);
function foldSpin(o: BodyObj) { o.orient.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Y, o.spin.rotation.y)); o.spin.rotation.y = 0; }

// Fold the spin, set the hold, then slerp the orientation to q.
function turn(o: BodyObj, q: THREE.Quaternion, dur: number, hold: boolean, onComplete?: () => void) {
  o.hold = hold; foldSpin(o);
  const q0 = o.orient.quaternion.clone(), st = { t: 0 }; o.oTween?.kill();
  o.oTween = gsap.to(st, { t: 1, duration: RM ? .001 : dur, ease: 'power2.inOut', onUpdate() { o.orient.quaternion.copy(q0).slerp(q, st.t); }, onComplete });
}
// No latitude clamp (the prototype's ±50° kept polar sites off-centre): orientFor stays defined at the poles.
const faceQ = (o: BodyObj, lat: number, lon: number, vp: Viewport) => orientFor(o.b, lat, lon, vp.rig.final.dir);

export function hold(o: BodyObj) { o.hold = true; }
export function unhold(o: BodyObj) { o.hold = false; }

// Let the body spin again and ease it back to its default tilt.
export const release = (o: BodyObj) => turn(o, o.qDefault, 1.4, false);

// Hold a body with a site (or its default face) in front of a viewport's camera.
export function orientTo(id: Body, siteId: string | null, vp: Viewport, dur = 1.3) {
  const o = bodies[id], s = siteOf(id, siteId ?? undefined), [lat, lon] = s ? [s.lat, s.lon] : o.b.face;
  turn(o, faceQ(o, lat, lon, vp), dur, true);
}
// Orient phase of a dive (plan, visual bugs: orient, then dive). Turns the body until the site faces vp's camera,
// north up, over up to 1.2 s scaled by the turn (√ of its share of a half turn, so short turns don't snap), and holds
// it. A site already facing the camera within 2° (a surface click near the centre) gets no turn at all, so the dive
// starts at once as in the prototype (a turn still under way, e.g. a coordinate preview, stops where it is). Returns
// the turn's length and the orientation the body ends on.
const FACING = 2 * Math.PI / 180;
export function faceSite(id: Body, lat: number, lon: number, vp: Viewport) {
  const o = bodies[id], q0 = bodyQuat(o, new THREE.Quaternion());
  if (localDir(o.b, lat, lon).applyQuaternion(q0).angleTo(vp.rig.final.dir) < FACING) { o.oTween?.kill(); o.hold = true; return { dur: 0, q: q0 }; }
  const q = faceQ(o, lat, lon, vp);
  turn(o, q, 1.2 * Math.sqrt(q0.angleTo(q) / Math.PI), true);
  return { dur: o.oTween!.duration(), q };
}
export const orientToLL = (id: Body, lat: number, lon: number, vp: Viewport, dur: number) => turn(bodies[id], faceQ(bodies[id], lat, lon, vp), dur, true);

// Turn a body so its current day side faces the viewer, then let it spin. Sunlight stays tied to real geography and time.
const SUNVIEW = new THREE.Vector3(-.55, .25, .8).normalize();
export function orientToSun(id: Body, dur: number) {
  const o = bodies[id], [la, lo] = subsolar(id, simNow());
  turn(o, orientFor(o.b, clamp(la, -60, 60), lo, SUNVIEW), dur, true, () => { o.hold = false; });
}
