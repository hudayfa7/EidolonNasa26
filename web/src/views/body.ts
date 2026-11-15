// Body view: one globe beside the panel, with the HUD, graticule and markers (prototype 1313–1319); or the site
// selector grid over the globe (views/grid.ts), beside the panel, which on a phone gives it the whole screen.
import { T_ } from '../motion';
import { setTerrain, type Route } from '../router';
import { bodies, showOnly, sunMix } from '../scene/bodies';
import { orientTo, orientToSun, unhold } from '../scene/orient';
import { sheet } from '../scene/layout';
import { focusPose, LAY, setRig, slingshot, VPS } from '../scene/rig';

export function playBody(r: Route, prev: Route) {
  const L0 = VPS[0], id = r.body!, o = bodies[id];
  T_(LAY, { panel: r.grid && sheet() ? 0 : 1, split: 0, grat: 1, ov: 0, top: 1 });
  showOnly([id]); sunMix([id]); L0.only = null;
  if (prev.view === 'site' || prev.view === 'compare') {
    setTerrain(false, () => { L0.only = null; slingshot(L0, focusPose(id), 1.6); unhold(o); });
  } else if (prev.body !== id || prev.view !== 'body') {
    if (prev.view === 'intro') setRig(L0, focusPose(id)); else slingshot(L0, focusPose(id), 1.7);
    if (!r.site) orientToSun(id, prev.view === 'intro' ? .01 : 1.7); else unhold(o);
  }
  if (r.site) orientTo(id, r.site, L0, 1.2);
}
