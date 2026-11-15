// Planet and atmosphere materials (prototype 918–971), in linear HDR for scene/post.ts.
import * as THREE from 'three';
import { CAP_S } from '../coords';
import type { Atmos, BodyInfo } from '../data/bodies';
import { addBlend, blank, LITE, tex, TEX } from './renderer';
import PVS from './shaders/planet.vert.glsl?raw';
import PFS from './shaders/planet.frag.glsl?raw';
import AVS from './shaders/atmos.vert.glsl?raw';
import AFS from './shaders/atmos.frag.glsl?raw';

export function planetMat(b: BodyInfo, sunDir: THREE.Vector3) {
  // The normal map holds slopes (m/m). The bump map's relief tilted the normals by bumpK × (two texels' height difference
  // over its range): per unit of slope, bumpK × 2 × its texel's width at the equator ÷ its range. So the globe keeps the
  // relief it had (its east slopes now right at every latitude), and the Moon's cap the same.
  const [lo, hi] = b.elev, k = b.bumpK * 2 * (2 * Math.PI * b.R * 1000 / TEX[b.bump].w) / (hi - lo);
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex(b.tex) }, nmap: { value: tex(b.nrm) }, night: { value: b.night ? tex(b.night) : blank }, spec: { value: b.spec ? tex(b.spec) : blank },
      bumpK: { value: k }, nOn: { value: 0 }, fill: { value: 0 }, hasNight: { value: b.night ? 1 : 0 }, hasSpec: { value: b.spec ? 1 : 0 },
      ls: { value: b.atmos ? 0 : 1 },   // the airless Moon: Lommel-Seeliger
      cap: { value: b.cap ? tex(b.cap[0]) : blank }, capN: { value: b.cap ? tex(b.cap[1]) : blank }, hasCap: { value: b.cap ? 1 : 0 }, capS: { value: CAP_S }, capK: { value: k },
      // The thin edge of the design tokens (Atmosphere: Earth #8CC6FF, Mars #EBA27C), a fresnel rim on the lit side under
      // the scattered limb, HDR so Earth's blooms a little; the airless Moon's a faint white one.
      sunDir: { value: sunDir }, opacity: { value: 1 }, grat: { value: 0 }, rimC: { value: new THREE.Color(b.rim) }, rimK: { value: b.atmos ? (b.night ? 2.8 : .7) : .12 },
      gdiv: { value: new THREE.Vector2(12, 6) },
      // Until the colour map (and the Moon's cap) land, the globe draws in the map's mean colour; app.ts turns `ready` to 1,
      // and `nOn` (the relief) once the normal map lands. When the full map replaces the low tier, `mapLo` holds the low
      // one while app.ts turns `sharp` from 0 back to 1.
      mean: { value: new THREE.Color(b.mean) }, ready: { value: 0 }, mapLo: { value: blank }, sharp: { value: 1 },
      // Earth's clouds: `cloudK` how much of them shows (the title shot's, scene/frame.ts), `cloudU` their drift east in u,
      // `cOn` turned to 1 by app.ts as the map lands. Repeat-wrapped: the drift moves the map past its seam.
      cloud: { value: b.clouds ? Object.assign(tex(b.clouds), { wrapS: THREE.RepeatWrapping }) : blank }, cloudK: { value: 0 }, cloudU: { value: 0 }, cOn: { value: 0 },
    },
    vertexShader: PVS, fragmentShader: PFS, transparent: true,
  });
}

export function atmosMat(a: Atmos, sunDir: THREE.Vector3) {
  return addBlend(new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: sunDir }, top: { value: a.top }, H: { value: a.H }, betaR: { value: new THREE.Vector3(...a.rayleigh) },
      betaM: { value: new THREE.Vector3(...a.mie) }, g: { value: a.g }, sunI: { value: a.sun }, discK: { value: .15 }, opacity: { value: 1 } },
    defines: { STEPS: LITE ? 10 : 16 },
    vertexShader: AVS, fragmentShader: AFS, transparent: true, depthWrite: false,
  }));
}
