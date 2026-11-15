// Eidolon-1 and its orbit line on the title (prototype 1018–1033). A low-poly model with PBR materials (a bus in gold
// foil with a white radiator, two three-panel solar wings on yokes, a high-gain dish on a boom), lit by the title's
// sun: scene/frame.ts points its light from the sun's place each frame.
import * as THREE from 'three';
import { LIGHT, sys } from './renderer';

export const sat = new THREE.Group();
{
  const foil = new THREE.MeshStandardMaterial({ color: 0xC9A35A, roughness: .38, metalness: .85 });
  const white = new THREE.MeshStandardMaterial({ color: 0xE4E6EA, roughness: .55, metalness: .1 });
  const cells = new THREE.MeshStandardMaterial({ color: 0x1E3050, roughness: .35, metalness: .3, emissive: 0x0A1220 });
  const frame = new THREE.MeshStandardMaterial({ color: 0xA9AEB6, roughness: .4, metalness: .8 });
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); sat.add(o); return o; };
  add(new THREE.BoxGeometry(.07, .05, .05), foil);
  add(new THREE.BoxGeometry(.002, .036, .036), white, .036);   // radiator on the bus's +x face
  const panel = new THREE.BoxGeometry(.058, .003, .062), rail = new THREE.BoxGeometry(.186, .004, .004), yoke = new THREE.CylinderGeometry(.0018, .0018, .03, 6);
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 3; k++) add(panel, cells, sx * (.068 + k * .062), 0, 0);
    for (const sz of [-1, 1]) add(rail, frame, sx * .13, 0, sz * .031);
    add(yoke, frame, sx * .047, 0, 0).rotation.z = Math.PI / 2;
  }
  // The dish: a shallow paraboloid, opening up, on a boom above the bus.
  const prof = [...Array(7).keys()].map(i => { const r = .024 * i / 6; return new THREE.Vector2(r, r * r * 14); });
  add(new THREE.LatheGeometry(prof, 16), new THREE.MeshStandardMaterial({ color: 0xE9EAEC, roughness: .45, metalness: .15, side: THREE.DoubleSide }), 0, .046);
  add(new THREE.CylinderGeometry(.0025, .0025, .022, 6), frame, 0, .035);
  sys.add(sat);
}
// r155 dropped legacy light units: r128's 1.2 and .5 times π give the same irradiance.
export const satLight = new THREE.DirectionalLight(0xffffff, 1.2 * Math.PI); satLight.position.copy(LIGHT).multiplyScalar(50);
sys.add(satLight, new THREE.AmbientLight(0x334455, .5 * Math.PI));

export const ORBIT_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(.42, 0, -.32));
export const orbitLine = (() => {
  const pts = [];
  for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3).applyQuaternion(ORBIT_Q)); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xE7E9EC, transparent: true, opacity: 0, depthWrite: false }));
  sys.add(l); return l;
})();
