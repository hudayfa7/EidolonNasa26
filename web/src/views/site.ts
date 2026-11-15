// Site view: the site's terrain block beside the panel (prototype 1320–1329). From the body view of the same body it
// dives: one timeline turns the globe until the site faces the camera, dives to the surface (1.35 s), plays the
// detection frame from .15 s into the dive and swaps to terrain at 1.45 s. A search still running when the turn ends
// (by coordinates 5–10 s, spec §3.5; by name only when the engine is slow) holds the frame on the globe with its
// progress first, the globe usable (a new pin replaces it), and dives when it answers. Any other entry frames and holds the globe and swaps straight to terrain
// under a crossfade, the detection frame playing over it (acquire).
import type * as THREE from 'three';
import type { Body } from '../coords';
import gsap from 'gsap';
import { PICKABLE } from '../data/bodies';
import { doublesOf, type Doubles } from '../data/client';
import { siteOf, type Site } from '../data/sites';
import { RM, T_ } from '../motion';
import { setTerrain, state, type Route } from '../router';
import { bodies, showOnly, sunMix } from '../scene/bodies';
import { faceSite, hold } from '../scene/orient';
import { dive, focusPose, LAY, setRig, VPS } from '../scene/rig';
import { chrome } from '../ui/chrome';
import { hideScan, scanLine, showScan } from '../ui/detection';

let diveTl: gsap.core.Timeline | null = null, held: object | null = null;
/** A search by coordinates holds the detection frame on the globe (scene/input.ts keeps the globe usable meanwhile). */
export const holding = () => !!held;

export function playSite(r: Route, prev: Route) {
  const L0 = VPS[0], id = r.body!, s = siteOf(id, r.site!)!;
  T_(LAY, { panel: 1, split: 0, grat: 1, ov: 0, top: 1 });
  showOnly([id]); sunMix([id]); L0.only = null;
  // From the body view, or from a site still on the globe (its search held the frame there: a new pin replaces it).
  if ((prev.view === 'body' || (prev.view === 'site' && L0.kind === 'sys')) && prev.body === id && !L0.rig.tween) {
    // Reduced motion makes the turn and the dive instant (orient.ts, rig.ts) but keeps the frame's hold: it's not a move.
    const { dur, q } = faceSite(id, s.lat, s.lon, L0);
    // Under reduced motion the dive is a cut, so the terrain swaps in under the frame at once and the frame holds over it
    // as long as it would have (as acquire's): held over the globe at the dive's depth, the map's texels showed blocky.
    const plunge = (at: number, q: THREE.Quaternion) => diveTl = gsap.timeline()
      .add(dive(L0, bodies[id], q, s.lat, s.lon), at)
      .call(() => setTerrain(true, RM ? undefined : hideScan), [], at + (RM ? .2 : 1.45)).call(() => { if (RM) hideScan(); }, [], at + 1.45);
    diveTl = gsap.timeline().call(() => {
      // Earth's established sites have no search (the engine's targets are Mars and Moon); a cached name has answered.
      const e = PICKABLE.includes(id) && doublesOf(id, s);
      if (!e || !e.busy) { plunge(0, q).call(() => showScan(id, s), [], .15); return; }
      const me = held = {};
      showScan(id, s); chrome();
      // Its answer (or another search of this site, asked meanwhile by a new purpose or filter: its bar restarts), then the dive.
      const land = (e: Doubles): unknown => e.done.then(() => {
        if (held !== me || !state.ready) return;   // a lost context: the fallback page searches, the dead app no more
        const now = doublesOf(id, s); if (now.busy) { scanLine(id, s); return land(now); }
        held = null; scanLine(id, s); chrome();
        const f = faceSite(id, s.lat, s.lon, L0); plunge(f.dur, f.q);
      });
      land(e);
    }, [], dur);
    return;
  }
  if (prev.body !== id || prev.view === 'intro' || prev.view === 'overview' || prev.view === 'title') setRig(L0, focusPose(id));
  hold(bodies[id]); setTerrain(true, chrome);   // the status bar follows the terrain in (a pin's search shows there)
  if (prev.body !== id || prev.site !== r.site) acquire(id, s);   // not back from its own comparison
}

/** The detection frame on a site entry without a dive (a deep link, a move on the map, the grid, a new compare): over
 *  the terrain, held as long as a dive holds it before its swap (1.3 s, reduced motion too), then out as after one. A
 *  new route stops it. */
export function acquire(id: Body, s: Site) {
  diveTl = gsap.timeline().call(() => showScan(id, s)).call(hideScan, [], 1.3);
}

// A new route supersedes a dive still under way (progress < 1, also before its first tick) or a held frame: stop it
// where it is, camera included. True if one was.
export function stopDive() {
  const was = !!held; held = null;
  if (!diveTl || diveTl.progress() === 1) return was;
  diveTl.kill(); diveTl = null; VPS[0].rig.tween = null;
  return true;
}
