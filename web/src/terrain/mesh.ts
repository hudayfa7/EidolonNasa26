// Terrain scenes, one per viewport (prototype 1055–1106): the elevation mesh with its hypsometric tint (or the site's
// orbital image draped over it), hillshade and contour shader, a water surface on its lakes, a skirt down to a base,
// and a soft shadow underneath; lit from the site's real sun (sunOf).
import * as THREE from 'three';
import { atSolarTime, sunAzimuth, sunElevation } from '../astro';
import { D2R, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import type { Site } from '../data/sites';
import { simNow } from '../motion';
import { token } from '../scene/layout';
import { blank, canvasTex, LITE } from '../scene/renderer';
import { slopes, STEEP, type Terrain } from './procedural';

export const TERR_S = 10;   // the block's side in scene units
/** A site's four elevation-ramp stops (--ramp-* in tokens.css), low to high. */
export const ramp = (pal: string) => token(`--ramp-${pal}`).split(/\s+/);

/* ---------- Light: the site's sun ---------- */
// The block, its skirt and the site's 2D map (ui/topomap.ts) are lit from the site's real sun azimuth (astro.ts), at the
// prototype's fixed 38° height (up or not: the relief has to read). Taken once per site entry (router.ts resetSun), so
// the block and the map agree. Compare lights both sides (blocks, overlay, minis) from TWIN_AZ instead. The sun-angle
// control (ui/sun.ts) sets a time and date: then the sun at its true height, casting shadows (sunlit).
const AZ = new Map<string, number>(), ALT = Math.asin(.62) / D2R;
/** Compare's one light: the engine's twin hillshades' north-west sun (spec §3.7), so one landform shades alike on both
 *  sides and in the overlay's blend, and the top-down minis never read inverted (Decisions 185). */
export const TWIN_AZ = 315;
export const resetSun = () => AZ.clear();
/** The light on a block and its map: azimuth and, for a set sun, its height (degrees) at the block's centre, the samples
 *  it reaches (sunlit) and the body's radius (km), over which it stands higher toward it. Without a height: the fixed
 *  38°, no shadows, a flat block. */
export interface Sun { az: number; alt?: number; lit?: Uint8Array; R?: number }
/** The sun-angle control (ui/sun.ts): on, the site view's block and map are lit by the sun at local solar time h (hours)
 *  in the solar day holding `date` (YYYY-MM-DD, its noon UTC). Held for the session, applied at each site's longitude. */
export const sunSet = { on: false, h: 12, date: '' };
const LIT = new WeakMap<Terrain, { k: string; m: Uint8Array }>();
export function sunOf(body: Body, s: Site, T: Terrain): Sun {
  if (!sunSet.on) {
    const k = `${body}/${s.id}`; let az = AZ.get(k);
    if (az === undefined) AZ.set(k, az = sunAzimuth(body, s.lat, s.lon, simNow()));
    return { az };
  }
  const { az, alt } = sunAt(body, s), R = BODIES[body].R, k = `${az}|${alt}`;
  let c = LIT.get(T); if (c?.k !== k) LIT.set(T, c = { k, m: sunlit(T, az, alt, R) });   // the block and its map ask in turn
  return { az, alt, lit: c.m, R };
}
/** The set sun (sunSet) at a site: its azimuth, height and the moment. */
export function sunAt(body: Body, s: Site) {
  const at = atSolarTime(body, s.lon, new Date(`${sunSet.date}T12:00:00Z`), sunSet.h);
  return { az: sunAzimuth(body, s.lat, s.lon, at), alt: sunElevation(body, s.lat, s.lon, at), at };
}
/** Toward the sun at azimuth az and height alt (degrees): [east, up, north]. */
export const sunENU = (az: number, alt = ALT): [number, number, number] => [Math.sin(az * D2R) * Math.cos(alt * D2R), Math.sin(alt * D2R), Math.cos(az * D2R) * Math.cos(alt * D2R)];
/** 1 where a sample sees the sun at (az, alt at the grid's centre), 0 where the terrain hides it: a march toward the sun a
 *  sample at a time, at true scale (the block's exaggeration shades its relief, not its shadows), over the body's curve
 *  (R, km): the sun stands higher by a sample's offset toward it over R (radians), and the ground falls away from it
 *  with the square of the distance; till the ray clears the highest ground or leaves the grid. Row 0 north. */
// shortcut: the grid's edge is the horizon (ground outside it casts nothing), nearest samples; march a wider DEM if a
// far ridge's shadow ever matters.
export function sunlit(T: Terrain, az: number, alt: number, R: number) {
  const N = T.N, c = (N - 1) / 2, cell = T.ext * 1000 / (N - 1), dx = Math.sin(az * D2R), dy = -Math.cos(az * D2R), rise = Math.tan(alt * D2R) * cell, bend = cell * cell / (2 * R * 1000), out = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const z = T.z[j * N + i], up = rise + ((i - c) * dx + (j - c) * dy) * cell * cell / (R * 1000); let lit = 1;
    for (let n = 1; ; n++) {
      const x = Math.round(i + dx * n), y = Math.round(j + dy * n), ray = z + up * n + bend * n * n; if (x < 0 || y < 0 || x >= N || y >= N || ray > T.max) break;
      if (T.z[y * N + x] > ray) { lit = 0; break; }
    }
    out[j * N + i] = lit;
  }
  return out;
}

/* ---------- Slope hazard: ground steeper than STEEP tinted coral on the blocks and maps ---------- */
/** The slope hazard layer (ui/slope.ts): on, the site view's and compare's blocks and maps are greyed and their slopes
 *  over STEEP turn coral. Held for the session (Decisions 188). */
export const hazard = { on: false };
const SLOPE = new WeakMap<Terrain, Float32Array>();
/** Each sample's slope (degrees), once per terrain: the block and its map share it. */
export const slopeOf = (T: Terrain) => { let s = SLOPE.get(T); if (!s) SLOPE.set(T, s = slopes(T.z, T.N, T.ext)); return s; };

/* ---------- Contours: the marching squares of a height grid (also ui/topomap.ts) ---------- */
type Pt = [number, number];
/** Segments (point pairs, in sample units, row 0 north) of the level-`lv` contour of an N × N grid. */
export function contourSegs(z: Float32Array, N: number, lv: number) {
  const out: Pt[] = [];
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
    const a = z[j * N + i], b = z[j * N + i + 1], c = z[(j + 1) * N + i + 1], d = z[(j + 1) * N + i];
    const k = +(a > lv) | (+(b > lv) << 1) | (+(c > lv) << 2) | (+(d > lv) << 3); if (k === 0 || k === 15) continue;
    const T = (): Pt => [i + (lv - a) / (b - a), j], Rr = (): Pt => [i + 1, j + (lv - b) / (c - b)], B = (): Pt => [i + (lv - d) / (c - d), j + 1], L = (): Pt => [i, j + (lv - a) / (d - a)];
    switch (k) {
      case 1: case 14: out.push(L(), T()); break; case 2: case 13: out.push(T(), Rr()); break; case 3: case 12: out.push(L(), Rr()); break;
      case 4: case 11: out.push(Rr(), B()); break; case 6: case 9: out.push(T(), B()); break; case 7: case 8: out.push(L(), B()); break;
      case 5: out.push(L(), T(), Rr(), B()); break; case 10: out.push(T(), Rr(), B(), L()); break;
    }
  }
  return out;
}
/** Where the block labels its major contours (ui/terrain-ui.ts): per level, the point of its line nearest the centre,
 *  a level skipped when that point lies within a fifth of the block of one already labelled; three at most. In sample
 *  units (i east, j south). */
export function contourMarks(T: Terrain) {
  const out: { lv: number; i: number; j: number }[] = [], c = (T.N - 1) / 2, gap = (T.N - 1) / 5;
  for (let lv = Math.ceil(T.min / T.major) * T.major; lv <= T.max && out.length < 3; lv += T.major) {
    const seg = contourSegs(T.z, T.N, lv); let best: Pt | null = null, bd = Infinity;
    for (let n = 0; n < seg.length; n += 2) {
      const i = (seg[n][0] + seg[n + 1][0]) / 2, j = (seg[n][1] + seg[n + 1][1]) / 2, d = Math.hypot(i - c, j - c);
      if (d < bd) { bd = d; best = [i, j]; }
    }
    if (best && out.every(m => Math.hypot(m.i - best![0], m.j - best![1]) > gap)) out.push({ lv, i: best[0], j: best[1] });
  }
  return out;
}

/** The samples a mesh is built from: every one up to 512 a side (128 on phones, the lighter path), else every k-th (the
 *  last row and column kept), so a large tile costs no more than that. Indices into T's grid, for both axes. */
// shortcut: one stride for the whole block at every distance, not level of detail by distance; split the block into
// tiles with strides by distance once a DEM passes 512 samples a side and close-ups lose detail.
export function meshIdx(N: number, max = LITE ? 128 : 512) {
  const k = Math.ceil((N - 1) / (max - 1)), n = Math.floor((N - 1) / k) + 1;
  return Array.from({ length: n }, (_, i) => i === n - 1 ? N - 1 : i * k);
}
/** Each water sample's distance in samples to the nearest dry one (1 at the shore), 0 where dry: the lake's depth for its
 *  shading where the DEM holds only its flat surface. A breadth-first pass out from the shore. */
export function shoreDist(wet: ArrayLike<number>, N: number) {
  const d = new Float32Array(N * N), q: number[] = [];
  for (let k = 0; k < N * N; k++) if (wet[k]) { const i = k % N, j = (k / N) | 0;
    if ((i > 0 && !wet[k - 1]) || (i < N - 1 && !wet[k + 1]) || (j > 0 && !wet[k - N]) || (j < N - 1 && !wet[k + N])) { d[k] = 1; q.push(k); } }
  for (let h = 0; h < q.length; h++) { const k = q[h], i = k % N;
    for (const m of [i > 0 ? k - 1 : -1, i < N - 1 ? k + 1 : -1, k - N, k + N]) if (m >= 0 && m < N * N && wet[m] && !d[m]) { d[m] = d[k] + 1; q.push(m); } }
  return d;
}

interface TerrScene {
  scene: THREE.Scene; group: THREE.Group | null; shadow: THREE.Mesh; T: Terrain | null; topY: number; exag: number;
  light: THREE.Vector3; dl: THREE.DirectionalLight; marks: { lv: number; p: THREE.Vector3 }[];
  drape: { map: THREE.IUniform<THREE.Texture>; k: THREE.IUniform<number> };   // shared by its materials (terrain-ui.ts sets them)
  tilt: THREE.IUniform<number>;   // a set sun's curve: radians a scene unit from the centre (buildTerrain), else 0
  haz: THREE.IUniform<number>;    // 1: the slope hazard tint (buildTerrain), else 0
  ell: THREE.IUniform<THREE.Vector3>;   // a landing ellipse round the centre: semi-axes (scene units), azimuth (radians); x 0: none
}
export const terrScenes: TerrScene[] = [0, 1].map(() => {
  const scene = new THREE.Scene();
  // r155 dropped legacy light units: r128's .55 and .7 times π give the skirt the same irradiance.
  scene.add(new THREE.AmbientLight(0xffffff, .55 * Math.PI));
  const dl = new THREE.DirectionalLight(0xffffff, .7 * Math.PI); scene.add(dl);
  const st = canvasTex(256, g => { const gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(TERR_S * 2, TERR_S * 2), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  return { scene, group: null, shadow, T: null, topY: 1, exag: 1, light: new THREE.Vector3(), dl, marks: [], drape: { map: { value: blank }, k: { value: 0 } }, tilt: { value: 0 }, haz: { value: 0 }, ell: { value: new THREE.Vector3() } };
});

function terrMat(T: Terrain, ts: TerrScene) {
  // The shading math runs on the ramp's sRGB values, as the prototype's did, and decodes once at the end: the terrain
  // draws after the tone map (scene/post.ts), so its colours stay the tokens'. The draped image is sampled raw, as sRGB.
  const [c0, c1, c2, c3, coral] = [...ramp(T.pal), token('--coral')].map(c => ({ value: new THREE.Color().setStyle(c, THREE.LinearSRGBColorSpace) }));
  return new THREE.ShaderMaterial({
    // Transparent for the overlay's ghost (drawTerrain); at alpha 1 it draws as it would opaque.
    transparent: true,
    uniforms: { c0, c1, c2, c3, eMin: { value: T.min }, eMax: { value: T.max }, alpha: { value: 1 },
      minor: { value: T.minor }, major: { value: T.major }, light: { value: ts.light }, drape: ts.drape.map, drapeK: ts.drape.k, tilt: ts.tilt, haz: ts.haz, ell: ts.ell, coral },
    vertexShader: `attribute float elev; attribute float wet; attribute float lit; attribute float slope; varying float vE; varying float vW; varying float vL; varying float vS; varying vec3 vN; varying vec3 vP; varying vec2 vUv; varying vec2 vO; varying vec2 vC; varying float vZ;
void main(){ vE=elev; vW=wet; vL=lit; vS=slope; vUv=uv; vO=position.xz; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vP=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;
  vC=gl_Position.yw; vZ=gl_Position.w/projectionMatrix[1][1]; }`,
    fragmentShader: `uniform vec3 c0,c1,c2,c3,light,coral,ell; uniform float eMin,eMax,minor,major,alpha,drapeK,tilt,haz; uniform sampler2D drape;
varying float vE; varying float vW; varying float vL; varying float vS; varying vec3 vN; varying vec3 vP; varying vec2 vUv; varying vec2 vO; varying vec2 vC; varying float vZ;
vec3 ramp(float t){ t=clamp(t,0.0,1.0); if(t<0.33) return mix(c0,c1,t/0.33); if(t<0.66) return mix(c1,c2,(t-0.33)/0.33); return mix(c2,c3,(t-0.66)/0.34); }
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
// Pixels from a plan function's level line: its value off the line over its gradient (g, per plan unit) across a pixel's
// steps on the ground (sx, sy, plan units).
float px(float off,vec2 g,vec2 sx,vec2 sy){ return abs(off)/max(length(vec2(dot(g,sx),dot(g,sy))),1e-9); }
void main(){
  // A set sun over the body's curve (sunlit): the ground vO from the centre has its sky tipped by vO·tilt, so the sun
  // stands higher toward it and lower away (tilt 0 otherwise: the light as given).
  vec2 p=vO*tilt; vec3 L=normalize(vec3(light.x-p.x*light.y,light.y+dot(p,light.xz),light.z-p.y*light.y));
  float hs=clamp(dot(normalize(vN),L),0.0,1.0)*vL;   // vL: 0 in a cast shadow (sunlit)
  vec3 col=ramp((vE-eMin)/max(eMax-eMin,1.0))*(0.32+0.85*hs);
  // The site's orbital image: its own light is in it, so the block's hillshade only deepens it a little; under a set sun
  // it goes as dark as the tint where that sun doesn't reach.
  if(drapeK>0.0) col=mix(col,texture2D(drape,vUv).rgb*(tilt>0.0?0.32+0.85*hs:0.72+0.4*hs),drapeK);
  // The slope hazard: the ground greyed (a trace of its colour kept), its slopes over ${STEEP}° coral, shaded gently enough
  // to read in shadow; the edge drawn where the interpolated slope crosses the line, a pixel wide.
  if(haz>0.0){ col=mix(vec3(dot(col,vec3(0.299,0.587,0.114))),col,0.25); col=mix(col,coral*(0.55+0.55*hs),0.85*clamp((vS-${STEEP}.0)/max(fwidth(vS),1e-3)+0.5,0.0,1.0)); }
  float e1=vE/minor; float l1=1.0-min(abs(fract(e1-0.5)-0.5)/max(fwidth(e1),1e-4),1.0);
  float e2=vE/major; float l2=1.0-min(abs(fract(e2-0.5)-0.5)/max(fwidth(e2)*1.3,1e-4),1.0);
  if(vW>0.5){
    // Water (the tokens' #1F3D52 deep to #335C75 at the shore, by the distance to it), level: the sky's grey-blue in
    // its fresnel toward the horizon, and the sun's glint off a still, gently rippled surface. The ripples fade out as
    // a cell nears a pixel (rk), or the glint aliases into per-pixel speckle.
    vec3 V=normalize(cameraPosition-vP); vec2 q=vP.xz*3.0; float rk=0.1*clamp(1.0-4.0*length(fwidth(q)),0.0,1.0);
    vec3 n=normalize(vec3((vn(q)-vn(q+vec2(1.7,0.0)))*rk,1.0,(vn(q)-vn(q+vec2(0.0,1.7)))*rk));
    vec3 w=mix(vec3(0.2,0.36,0.46),vec3(0.12,0.24,0.32),clamp((vW-1.0)/6.0,0.0,1.0));
    float fr=pow(1.0-max(dot(n,V),0.0),4.0), gl=pow(max(dot(reflect(-L,n),V),0.0),90.0)*vL;
    col=mix(mix(w,vec3(0.5,0.6,0.68),fr*0.55),col,drapeK)+vec3(1.0,0.94,0.82)*gl*0.35*(1.0-drapeK); l1=0.0; l2=0.0;
  }
  col=mix(col,col*0.5,l1*0.32); col=mix(col,col*0.3,l2*0.62);
  // A landing ellipse round the centre (ui/ellipse.ts), draped: its edge 2 px of coral on a 5 px dark casing, as the map
  // draws it, pale over the slope hazard's coral. vO is east and south; the long axis along (sin az, cos az) east and north.
  // Its pixels are measured as on level ground through this point, a pixel's step (pu scene units, face on at this depth)
  // slid along the view ray back to its level: smooth, where the draped facets' own derivatives jump from facet to facet
  // and the edge's width with them. Under 8 px across (a dot), a ring 22 px across marks it too, as the map does.
  if(ell.x>0.0){ float s=sin(ell.z), c=cos(ell.z), pu=vZ*abs(dFdy(vC.x/vC.y));
    vec3 D=normalize(vP-cameraPosition), ex=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0])*pu, ey=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1])*pu;
    float dy=min(D.y,-0.05); vec2 sx=(ex-D*ex.y/dy).xz, sy=(ey-D*ey.y/dy).xz;
    vec2 q=vec2(vO.x*s-vO.y*c,vO.x*c+vO.y*s)/ell.xy; float r=max(length(q),1e-6), d=px(r-1.0,(q.x/ell.x*vec2(s,-c)+q.y/ell.y*vec2(c,s))/r,sx,sy);
    if(ell.x<4.0*pu){ float o=max(length(vO),1e-6); d=min(d,px(o-11.0*pu,vO/o,sx,sy)); }
    col=mix(col,vec3(0.024,0.027,0.039),0.75*(1.0-smoothstep(2.0,2.8,d))); col=mix(col,haz>0.0?vec3(1.0,0.89,0.824):coral,1.0-smoothstep(0.7,1.3,d)); }
  gl_FragColor=vec4(sRGBTransferEOTF(vec4(col,1.0)).rgb,alpha);
}`,
  });
}

// Builds (or keeps) viewport i's terrain at a given vertical exaggeration (compare passes one shared by both sides), then
// the skirt, lit by `sun` (its shadows too, where it has them), its slopes over STEEP tinted when `steep`, a landing
// ellipse round its centre when given one (full axes in km, azimuth in degrees). A terrain regenerated (late texture)
// or landed (engine window) is a new T.
export function buildTerrain(i: number, T: Terrain, ex: number, sun: Sun, steep = false, ell?: { a: number; b: number; az: number }) {
  const ts = terrScenes[i], [le, lu, ln] = sunENU(sun.az, sun.alt);
  ts.light.set(le, lu, -ln); ts.dl.position.copy(ts.light).multiplyScalar(10);   // the block's north is −z
  ts.tilt.value = sun.R ? T.ext / (TERR_S * sun.R) : 0;
  const k = TERR_S / T.ext / 2; ts.ell.value.set(ell ? ell.a * k : 0, ell ? ell.b * k : 0, ell ? ell.az * D2R : 0);
  if (ts.T !== T || ts.exag !== ex) build(ts, T, ex);
  const geo = (ts.group!.children[0] as THREE.Mesh).geometry, lit = geo.getAttribute('lit') as THREE.BufferAttribute, sl = geo.getAttribute('slope') as THREE.BufferAttribute, ix = meshIdx(T.N), N = ix.length;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) lit.array[j * N + i] = sun.lit ? sun.lit[ix[j] * T.N + ix[i]] : 1;
  lit.needsUpdate = true; ts.haz.value = +steep;
  if (steep) { const s = slopeOf(T); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sl.array[j * N + i] = s[ix[j] * T.N + ix[i]]; sl.needsUpdate = true; }
  return ts;
}
function build(ts: TerrScene, T: Terrain, ex: number) {
  if (ts.group) {
    ts.scene.remove(ts.group);
    ts.group.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
  }
  const S = TERR_S, ix = meshIdx(T.N), N = ix.length, k = S / (T.ext * 1000) * ex;
  const wetOf = (n: number) => T.wet ? T.wet[n] : +(T.z[n] < T.lake), shore = shoreDist(Float32Array.from(T.z, (_, n) => wetOf(n)), T.N);
  const geo = new THREE.PlaneGeometry(S, S, N - 1, N - 1); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, elev = new Float32Array(N * N), ys = new Float32Array(N * N), wet = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const n = j * N + i, m = ix[j] * T.N + ix[i], z = T.z[m];
    // A lake is level: its water at the lake's height, over a bed the DEM may or may not hold.
    elev[n] = z; wet[n] = shore[m]; ys[n] = ((shore[m] ? Math.max(z, T.lake) : z) - T.min) * k; pos.setY(n, ys[n]);
  }
  geo.setAttribute('elev', new THREE.BufferAttribute(elev, 1)); geo.computeVertexNormals();
  geo.setAttribute('wet', new THREE.BufferAttribute(wet, 1)); geo.setAttribute('lit', new THREE.BufferAttribute(new Float32Array(N * N), 1));
  geo.setAttribute('slope', new THREE.BufferAttribute(new Float32Array(N * N), 1));
  const group = new THREE.Group(); group.add(new THREE.Mesh(geo, terrMat(T, ts)));
  const base = -.32, sp: number[] = [], si: number[] = [];
  const edge = (pts: number[][]) => { const st = sp.length / 3; for (const [x, y, z] of pts) sp.push(x, y, z, x, base, z); for (let n = 0; n < pts.length - 1; n++) { const a = st + n * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  const P = (ii: number, jj: number) => [-S / 2 + S * ii / (N - 1), ys[jj * N + ii], -S / 2 + S * jj / (N - 1)];
  const R = [...Array(N).keys()];
  edge(R.map(n => P(n, 0))); edge(R.map(n => P(n, N - 1))); edge(R.map(n => P(0, n))); edge(R.map(n => P(N - 1, n)));
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals();
  group.add(new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0x1B1E23, side: THREE.DoubleSide, transparent: true })));
  ts.shadow.position.y = base - .01;
  const g = (v: number) => -S / 2 + S * v / (T.N - 1);
  ts.marks = contourMarks(T).map(c => ({ lv: c.lv, p: new THREE.Vector3(g(c.i), (c.lv - T.min) * k, g(c.j)) }));
  ts.scene.add(group); Object.assign(ts, { group, T, topY: (T.max - T.min) * k, exag: ex });
}

/** Overlay compare (views/compare.ts): the Earth double's block (scene 1) ghosted onto the target's (scene 0) in one
 *  viewport; t is the Earth side's weight, 0 to 1 (the overlay slider, ui/chrome.ts). */
export const ghost = { on: false, t: .5 };
/** Which block draws solid and which over it at opacity a: the heavier one solid, so that wherever both cover, the frame
 *  is (1 − t)·target + t·Earth, and at either end only one block shows. */
export const ghostOrder = (t: number) => t > .5 ? { solid: 1, over: 0, a: 1 - t } : { solid: 0, over: 1, a: t };
function fade(ts: TerrScene, a: number, colour: boolean) {
  ts.group!.traverse(o => { if (!(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.Material & { uniforms?: Record<string, THREE.IUniform> };
    m.colorWrite = colour; m.opacity = a; if (m.uniforms) m.uniforms.alpha.value = a; });
}
/** Viewport i's terrain, over the finished frame (scene/post.ts). Under the overlay, viewport 0 draws both blocks: the
 *  one over the other with depth cleared, so it shows whole (a ghost), its own depth first, so only its nearest surface
 *  blends; the shadow under it is the solid one's. */
// shortcut: no offscreen buffers, so where only one block covers (at the silhouettes) it shows at its own weight instead of
// blending; composite two render targets if that edge ever reads wrong (Decisions 117).
export function drawTerrain(r: THREE.WebGLRenderer, i: number, cam: THREE.Camera) {
  r.clearDepth();
  if (!ghost.on || i) { r.render(terrScenes[i].scene, cam); return; }
  const { solid, over, a } = ghostOrder(ghost.t), ts = terrScenes[over];
  r.render(terrScenes[solid].scene, cam);
  if (a <= 0 || !ts.group) return;
  r.clearDepth(); ts.shadow.visible = false;
  fade(ts, a, false); r.render(ts.scene, cam);
  fade(ts, a, true); r.render(ts.scene, cam);
  fade(ts, 1, true); ts.shadow.visible = true;
}
