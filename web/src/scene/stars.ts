// 1,400 seeded random stars on a sphere around the camera (prototype 973–984), added as light (their old sRGB look).
import * as THREE from 'three';
import { addBlend, sys } from './renderer';

export const stars = (() => {
  const N = 1400, pos = new Float32Array(N * 3), sz = new Float32Array(N);
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const v = new THREE.Vector3();
  for (let i = 0; i < N; i++) { v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(800); pos.set([v.x, v.y, v.z], i * 3); sz[i] = rnd() < .05 ? 1.9 : .7 + rnd() * .8; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
  const m = addBlend(new THREE.ShaderMaterial({ uniforms: { dpr: { value: 1 }, a: { value: 0 } },
    vertexShader: `attribute float sz; uniform float dpr; void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=sz*dpr; }`,
    fragmentShader: `uniform float a; void main(){ float d=length(gl_PointCoord-0.5); gl_FragColor=vec4(pow(vec3(0.85,0.88,0.95)*smoothstep(0.5,0.1,d)*a*0.7,vec3(2.2)),1.0); }`,
    transparent: true, depthWrite: false }));
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = -5; sys.add(p); return p;
})();
