// Frontend-owned body data (prototype 646–661): facts, globe textures, atmospheres and the system-view layout.
import type { Body } from '../coords';

/** Atmosphere (scene/shaders/atmos.frag.glsl), lengths in the body's radius: top, scale height, Rayleigh and Mie
 *  scattering per radius (linear RGB), Mie asymmetry and the sun's intensity. Scale heights are some ten times the
 *  real ones, so the limb reads at globe scale. */
export interface Atmos { top: number; H: number; rayleigh: [number, number, number]; mie: [number, number, number]; g: number; sun: number }

export interface BodyInfo {
  name: string; kind: 'home' | 'target'; sub: string; color: string;
  lon0: number; face: [lat: number, lon: number]; tilt: number;
  tex: string; mean: string; bump: string; nrm: string; bumpK: number; night?: string; spec?: string; clouds?: string; cap?: [map: string, normal: string]; atmos?: Atmos; rim: string;   // texture keys: public/textures/manifest.json
  // `bump`: heights for the CPU (pin terrain); `nrm`: the globe's relief, slopes baked from the same DEM; `bumpK`: how far
  // the relief tilts the globe's normals, in units of the old bump's height step (scene/planet.ts); `clouds`: cloud
  // cover, drawn on the title shot only (scene/frame.ts)
  elev: [lo: number, hi: number];   // metres the bump map's 0 and 1 stand for (scripts/fetch-real-data.mjs ELEV)
  // `mean`: the colour map's average (sRGB, area-weighted), the globe's colour until the map lands (scene/planet.ts)
  rot: string; sid: number; R: number; stats: [string, string][];
}

export const BODIES: Record<Body, BodyInfo> = {
  earth:{ name:'Earth', kind:'home', sub:'14 established analog sites', color:'#6EA6D8', lon0:-180, face:[22,-40], tilt:23.4, tex:'earth_day', mean:'#232C3A', bump:'earth_bump', nrm:'earth_normal', bumpK:3.0, elev:[0,8800], night:'earth_night', spec:'earth_spec', clouds:'earth_clouds', rim:'#8CC6FF', atmos:{ top:1.16, H:.02, rayleigh:[.525,1.225,3], mie:[.02,.02,.02], g:.76, sun:10 }, rot:'23 h 56 m', sid:86164, R:6371,
    stats:[['Gravity','9.81 m/s²'],['Surface pressure','1,013 hPa'],['Temperature','−89 to 57 °C'],['Solar day','24 h']] },
  moon:{ name:'Moon', kind:'target', sub:'Artemis base regions', color:'#B9BDC4', lon0:-180, face:[-30,8], tilt:6.7, tex:'moon', mean:'#93908B', bump:'moon_bump', nrm:'moon_normal', bumpK:3.9, cap:['moon_cap','moon_cap_normal'], rim:'#FFFFFF', elev:[-9500,11000], rot:'27.3 d', sid:2360591, R:1737.4,
    stats:[['Gravity','1.62 m/s²'],['Surface pressure','Near vacuum'],['Temperature','−173 to 127 °C'],['Solar day','29.5 d']] },
  mars:{ name:'Mars', kind:'target', sub:'Landing sites, pin anywhere', color:'#D0774C', lon0:0, face:[-6,292], tilt:25.2, tex:'mars', mean:'#985634', bump:'mars_bump', nrm:'mars_normal', bumpK:5.5, elev:[-8500,21500], rim:'#EBA27C', atmos:{ top:1.12, H:.015, rayleigh:[0,0,0], mie:[2,.87,.47], g:.4, sun:10 }, rot:'24 h 37 m', sid:88642, R:3389.5,
    stats:[['Gravity','3.71 m/s²'],['Surface pressure','≈ 6 hPa'],['Temperature','−140 to 20 °C'],['Solar day','24 h 39 m 35 s']] },
};
export const ORDER: Body[] = ['earth','moon','mars'];
export const PICKABLE: Body[] = ['mars','moon'];

export type LayoutKey = 'wide' | 'tall';
type Pose = { ext: { w: number; h: number }; target: [number, number, number]; dir: [number, number, number] };
/** System-view line-up per layout: body position x, y, z, radius, and which side its label sits ('b'elow, 'r'ight). */
export const OV: Record<LayoutKey, Pose & { pos: Record<Body, [number, number, number, number, 'b' | 'r']> }> = {
  wide:{ ext:{ w:11, h:4.6 }, target:[.4,-.5,0], dir:[0,.12,1],
    pos:{ earth:[-3.6,0,0,2.4,'b'], moon:[.25,2.0,.4,.66,'r'], mars:[5.4,0,0,1.6,'b'] } },
  tall:{ ext:{ w:3.8, h:8.4 }, target:[1.1,.6,0], dir:[0,.06,1],
    pos:{ earth:[-.6,3.6,0,1.6,'r'], moon:[1.5,.9,.3,.42,'r'], mars:[-.6,-3.0,0,1.15,'r'] } },
};
