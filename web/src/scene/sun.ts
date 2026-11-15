// Suns as additive sprites: the title's limb sun (glare, core and an HDR disc that bloom picks up; prototype 1034–1036,
// 1043–1044; its streak is the lens flare's, scene/post.ts) and the system view's sun at the left edge of the line-up
// (1046–1053). Sprites draw before planets (renderOrder), so a body hides the sun by draw order alone.
import * as THREE from 'three';
import type { LayoutKey } from '../data/bodies';
import { addBlend, asLight, canvasTex, glowTex, sys } from './renderer';

const sprite = (map: THREE.Texture, color: number) => new THREE.Sprite(addBlend(new THREE.SpriteMaterial({ map, color, transparent: true, opacity: 0, depthWrite: false })));
const discTex = asLight(canvasTex(256, (g, s) => {
  const r = s / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.62, 'rgba(255,250,240,1)'); gr.addColorStop(.74, 'rgba(255,228,196,.55)'); gr.addColorStop(1, 'rgba(255,200,160,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}));

export const glare = sprite(glowTex, 0xFFE2CC), core = sprite(glowTex, 0xFFFFFF), disc = sprite(discTex, 0xFFFFFF);
disc.material.color.multiplyScalar(8);   // HDR: bloom picks the disc up
glare.renderOrder = 0;
sys.add(glare, core, disc);
export const sunPos = new THREE.Vector3();   // the title sun, for the lens flare

export const ovSun = new THREE.Group();
export const ovDisc = sprite(discTex, 0xFFF6E8), ovCorona = sprite(glowTex, 0xFFD2A8), ovGlow = sprite(glowTex, 0xF2A27A);
ovDisc.material.color.multiplyScalar(12);   // HDR: white-hot after AgX, and bloom picks it up (no lens flare, Decisions 95)
ovDisc.scale.setScalar(6.2); ovCorona.scale.setScalar(15); ovGlow.scale.setScalar(36); ovSun.add(ovGlow, ovCorona, ovDisc);
sys.add(ovSun);
/** System sun position x, y, z and glow strength per layout. */
export const OVSUN: Record<LayoutKey, [number, number, number, number]> = { wide: [-13.2, .3, -3, 1], tall: [-5, 4.4, -3, .55] };
