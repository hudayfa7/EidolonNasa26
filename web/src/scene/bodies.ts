// Body groups (root → orient → spin), atmospheres, surface directions and the system-view layout (prototype 986–1016,
// 1285–1286, 2271).
import * as THREE from 'three';
import gsap from 'gsap';
import { clamp, D2R, lon360, wrap180, type Body } from '../coords';
import { BODIES, ORDER, OV, type BodyInfo, type LayoutKey } from '../data/bodies';
import { RM } from '../motion';
import { LIGHT, sys } from './renderer';
import { atmosMat, planetMat } from './planet';
import { ovSun, OVSUN } from './sun';

export interface BodyObj {
  id: Body; b: BodyInfo; root: THREE.Group; orient: THREE.Group; spin: THREE.Group;
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>; mats: THREE.ShaderMaterial[];
  sunDir: THREE.Vector3; sunTrue: THREE.Vector3; sunMix: { v: number }; fade: { v: number }; intro: { v: number };
  hold: boolean;                      // spin frozen; only scene/orient.ts writes it
  oTween: gsap.core.Tween | null; qDefault: THREE.Quaternion; r: number; alpha: number; home: THREE.Vector3;
}

// Unit vector to (lat, lon) in the body's frame; per-frame callers pass a scratch `out`.
export function localDir(b: BodyInfo, lat: number, lon: number, out = new THREE.Vector3()) {
  const u = lon360(lon - b.lon0) / 360, ph = u * Math.PI * 2, la = lat * D2R;
  return out.set(-Math.cos(ph) * Math.cos(la), Math.sin(la), Math.sin(ph) * Math.cos(la));
}
export function dirToLL(b: BodyInfo, v: THREE.Vector3): [number, number] {
  const lat = Math.asin(clamp(v.y, -1, 1)) / D2R; let ph = Math.atan2(v.z, -v.x); if (ph < 0) ph += Math.PI * 2;
  return [lat, wrap180(ph / (Math.PI * 2) * 360 + b.lon0)];
}
export const bodyQuat = (o: BodyObj, out: THREE.Quaternion) => out.copy(o.orient.quaternion).multiply(o.spin.quaternion);
const _fq = new THREE.Quaternion(), _fv = new THREE.Vector3();
/** The surface point facing the camera, the globe's centre on screen: the HUD's sub-observer, the graticule's anchor,
 *  the point Enter pins (scene/input.ts). */
export const facing = (o: BodyObj, cam: THREE.Camera) => dirToLL(o.b, _fv.copy(cam.position).sub(o.home).normalize().applyQuaternion(bodyQuat(o, _fq).invert()));
// Rotation that puts the surface point (lat, lon) in front of a camera looking along camDir, its local north up.
// North is the meridian's direction, the point 90° further along it, so it stays defined at the poles; elsewhere it
// equals the prototype's projected axis.
export function orientFor(b: BodyInfo, lat: number, lon: number, camDir: THREE.Vector3) {
  const f = localDir(b, lat, lon), u = localDir(b, lat + 90, lon);
  const Ml = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(u, f), u, f);
  const fw = camDir.clone().normalize(), up = new THREE.Vector3(0, 1, 0), uw = up.addScaledVector(fw, -up.dot(fw)).normalize();
  const Mw = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(uw, fw), uw, fw);
  return new THREE.Quaternion().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
}

const SPH = new THREE.SphereGeometry(1, 160, 110);
export const bodies = {} as Record<Body, BodyObj>;
for (const id of ORDER) {
  const b = BODIES[id], root = new THREE.Group(), orient = new THREE.Group(), spin = new THREE.Group();
  root.add(orient); orient.add(spin); sys.add(root);
  const sunDir = LIGHT.clone();
  const mesh = new THREE.Mesh(SPH, planetMat(b, sunDir)); mesh.renderOrder = 1; spin.add(mesh);
  const o: BodyObj = { id, b, root, orient, spin, mesh, mats: [mesh.material], sunDir, sunTrue: new THREE.Vector3(), sunMix: { v: 0 }, fade: { v: 1 }, intro: { v: 0 },
    hold: false, oTween: null, r: 1, alpha: 0, home: new THREE.Vector3(),
    qDefault: new THREE.Quaternion().setFromEuler(new THREE.Euler(.12, 0, -b.tilt * D2R)) };
  // The atmosphere draws after the planet (renderOrder 2). From outside, its front faces, depth-tested so a body in front
  // hides it; from inside or close by (where the near plane would clip front faces), its back faces without the test
  // (they lie beyond the planet, which the shader stops at).
  if (b.atmos) {
    const m = atmosMat(b.atmos, sunDir), at = new THREE.Mesh(SPH, m), top = b.atmos.top;
    at.scale.setScalar(top); at.renderOrder = 2; root.add(at); o.mats.push(m);
    at.onBeforeRender = (_r, _s, cam) => { const out = cam.position.distanceTo(o.home) > o.r * top * 1.3; m.side = out ? THREE.FrontSide : THREE.BackSide; m.depthTest = out; };
  }
  orient.quaternion.copy(o.qDefault);
  const f = localDir(b, b.face[0], b.face[1]); spin.rotation.y = -Math.atan2(f.x, f.z);
  bodies[id] = o;
}

export function applyLayout(key: LayoutKey) {
  const [x, y, z] = OVSUN[key]; ovSun.position.set(x, y, z);
  for (const id of ORDER) {
    const [bx, by, bz, r] = OV[key].pos[id], o = bodies[id];
    o.home.set(bx, by, bz); o.r = r; o.root.position.copy(o.home); o.root.scale.setScalar(r);
  }
}

export function showOnly(ids: Body[], delay = .2) {
  for (const k of ORDER) gsap.to(bodies[k].fade, { v: ids.includes(k) ? 1 : 0, duration: .55, delay: ids.includes(k) ? delay : 0, overwrite: true });
}
export function sunMix(ids: Body[]) {
  // Reduced motion: the light jumps; a 1.2 s blend sweeps the terminator across the globe (a move, not a crossfade).
  for (const k of ORDER) gsap.to(bodies[k].sunMix, { v: ids.includes(k) ? 1 : 0, duration: RM ? 0 : 1.2, overwrite: true });
}
