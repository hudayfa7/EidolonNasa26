// Compare: the target site beside an Earth double, split 50/50 (prototype 1330–1341). Terrain mode shows both over the
// engine's 18.8 km window at one vertical exaggeration (setTerrain builds the pair); overlay mode shows the same pair in
// one viewport, the double's block ghosted onto the target's (terrain/mesh.ts drawTerrain); globe mode shows both
// globes, each holding its site toward the camera, optionally at their true sizes.
import type { Body } from '../coords';
import { BODIES } from '../data/bodies';
import { T_ } from '../motion';
import { setTerrain, state, type Route } from '../router';
import { bodies, showOnly, sunMix } from '../scene/bodies';
import { hold, orientTo } from '../scene/orient';
import { copyRig, focusPose, LAY, setRig, slingshot, VPS } from '../scene/rig';
import { siteOf } from '../data/sites';
import { chrome } from '../ui/chrome';
import { acquire } from './site';

// Same scale (off by default, the prototype's framing): the target globe framed as if it were Earth-sized, so it shows
// at its true radius beside Earth's (Moon .273, Mars .532).
let same = false;
export const sameScale = () => same;
export function targetPose(id: Body) {
  const p = focusPose(id), k = same ? BODIES.earth.R / BODIES[id].R : 1;
  p.ext.w *= k; p.ext.h *= k; return p;
}
export function toggleScale() {
  same = !same; chrome();
  if (state.view === 'compare' && state.globe) slingshot(VPS[0], targetPose(state.body!), 1.1);
}

export function playCompare(r: Route, prev: Route) {
  const [L0, R1] = VPS, id = r.body!;
  if (prev.body !== id || prev.site !== r.site) acquire(id, siteOf(id, r.site!)!);   // a target arrived at here, not from its site view
  T_(LAY, { panel: 1, grat: 1, ov: 0, top: 1 }); T_(LAY, { split: r.overlay ? 0 : 1 }, 1.1);
  showOnly([id, 'earth']); sunMix([id, 'earth']);
  // Terrain and overlay share their scenes: between the two only the split and the ghost (setTerrain) change, no crossfade.
  if (!r.globe) { setRig(R1, focusPose('earth')); hold(bodies[id]); setTerrain(true); return; }
  if (prev.view === 'compare' && prev.globe) { orientTo('earth', r.dbl, R1, 1.1); orientTo(id, r.site, L0, 1.1); return; }
  setTerrain(false, () => {
    // L0 shows only its body from the start (the prototype waited for R1's move): framed to scale, Earth can sit in its corner.
    setRig(L0, targetPose(id)); L0.only = id; R1.only = null;
    copyRig(R1, L0); slingshot(R1, focusPose('earth'), 1.6, () => { R1.only = 'earth'; });
    orientTo(id, r.site, L0, .01); orientTo('earth', r.dbl, R1, 1.6);
  });
}
