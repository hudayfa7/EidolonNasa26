// Hash routes and the apply() state machine (prototype 1248–1265, 1288–1343, back() 1522–1528, click delegation
// 1752–1758). apply() holds what every view shares; each view adds its branch.
import gsap from 'gsap';
import { UP } from './data/booking';
import { terrainOf } from './data/client';
import { siteOf } from './data/sites';
import { landing, missionOf } from './ellipse';
import { CAPTURE, MOTION, RM, setRate } from './motion';
import { parseHash, routeOf, type Route } from './routes';
import { stopInertia } from './scene/input';
import { holdNow } from './scene/frame';
import { releaseFrame, XF } from './scene/post';
import { LAY, tOrbit, VPS } from './scene/rig';
import { buildTerrain, ghost, hazard, resetSun, sunOf, TWIN_AZ } from './terrain/mesh';
import { genTerrain } from './terrain/procedural';
import { chrome } from './ui/chrome';
import { resetPreview } from './ui/coord-entry';
import { resetScan } from './ui/detection';
import { buildMarkers } from './ui/markers';
import { renderPanel } from './ui/panel';
import { buildTUI } from './ui/terrain-ui';
import { leaveBeyond, playBeyond } from './views/beyond';
import { playBody } from './views/body';
import { playCompare, toggleScale } from './views/compare';
import { playGrid } from './views/grid';
import { playSite, stopDive } from './views/site';
import { closeInfo, openInfo } from './views/info';
import { hideIntro } from './views/intro';
import { playSystem, setHover } from './views/system';
import { leaveTitle, playTitle } from './views/title';

export { routeOf, type Route } from './routes';
// `fromGrid`: a site (and its compare) opened from the site selector grid, which Esc, the panel's back button and the
// crumbs go back to.
export const state: Route & { ready: boolean; fromGrid: boolean } = { view: 'intro', body: null, site: null, dbl: null, globe: false, overlay: false, book: null, grid: false, ready: false, fromGrid: false };
export const parse = () => parseHash(location.hash);
// Under ?capture the route applies at once (hashchange is async: inside a seek it would land after the seek ends). As
// for a click, the route start doesn't move: seeks keep counting from the last route() (docs/progress.md, harness).
export function go(path: string) {
  const h = '#/' + path;
  if (location.hash === h || (path === '' && /^#?\/?$/.test(location.hash))) apply(parse());
  else if (CAPTURE) { history.pushState(null, '', h); apply(parse()); }
  else location.hash = h;
}
// Escape: one level up (a booking step goes back a step, its listing to the comparison).
export function back() {
  const s = state;
  if (s.view === 'beyond') return go('system');
  if (s.view === 'compare') return go(routeOf(s.book ? { ...s, book: UP[s.book] } : { body: s.body, site: s.site }));
  if (s.view === 'site' || (s.view === 'body' && (s.site || s.grid))) return go(s.view === 'site' && s.fromGrid ? `${s.body}/sites` : s.body!);
  if (s.view === 'body') return go('system');
}
addEventListener('hashchange', () => { if (state.ready) apply(parse()); });
document.addEventListener('click', e => {
  const t = e.target as Element;
  const b = t.closest<HTMLElement>('[data-go]'); if (b) { e.preventDefault(); go(b.dataset.go!); return; }
  if (t.closest('[data-scale]')) { toggleScale(); return; }
  const v = t.closest<HTMLElement>('#toggle button'); if (v) { go(routeOf({ ...state, globe: v.dataset.view === 'globe', overlay: v.dataset.view === 'overlay' })); return; }
  const r = t.closest<HTMLElement>('#rate button'); if (r) { setRate(+r.dataset.rate!); return; }
  if (t.closest('[data-info]')) { openInfo(); return; }
  if (t.closest('[data-close]')) closeInfo();
});

// Terrain swap (prototype 1267–1283, its curtain now a crossfade): the viewports switch between globe and terrain
// (atSwap runs then) under the frame before, which fades out. A swap to what is already shown just runs atSwap.
let terrKey = '';
// The terrain scenes for the current site (and its double on compare); also rebuilt, under a crossfade, when
// elevation lands late (app.ts).
export function buildScenes() {
  const s = siteOf(state.body, state.site!)!;
  if (state.view === 'compare') {
    // Compare to scale: both over the engine's window (its elevation once landed), at the smaller of their
    // exaggerations (the rougher side's), under one light; the slope hazard on both, as on the site view.
    const d = siteOf('earth', state.dbl!)!, A = terrainOf(state.body!, s).T, B = terrainOf('earth', d).T, ex = Math.min(A.exag, B.exag);
    buildTerrain(0, A, ex, { az: TWIN_AZ }, hazard.on); buildTerrain(1, B, ex, { az: TWIN_AZ }, hazard.on); VPS[1].kind = 'terrain';
  } else {
    // The site view: its own sun, and the landing ellipse round its centre (ui/ellipse.ts; not on compare).
    const T = genTerrain(state.body!, s), m = missionOf(state.body!);
    buildTerrain(0, T, T.exag, sunOf(state.body!, s, T), hazard.on, landing.on ? { a: m.a, b: m.b, az: landing.az } : undefined); VPS[1].kind = 'sys';
  }
  VPS[0].kind = 'terrain'; setGhost();
}
// The overlay's ghost (terrain/mesh.ts), its one writer: from the route as it is when the scenes are built or kept,
// never from a route captured earlier.
const setGhost = () => { ghost.on = VPS[0].kind === 'terrain' && state.view === 'compare' && state.overlay; };
export function setTerrain(on: boolean, atSwap?: () => void) {
  const key = on ? `${state.body}/${state.site}|${state.view === 'compare' ? state.dbl : ''}` : '';
  if (key === terrKey) { setGhost(); atSwap?.(); buildTUI(); return; }   // e.g. terrain to overlay: the ghost, its legend and note
  terrKey = key;
  crossfade(() => {
    if (on) {
      buildScenes();
      Object.assign(tOrbit, { theta: .2, phi: .1, dist: 30 });
      gsap.to(tOrbit, { theta: .62, phi: .98, dist: 21, duration: RM ? 0 : 1.6, ease: 'power3.out' });
    } else { VPS[0].kind = 'sys'; VPS[1].kind = 'sys'; setGhost(); }
    buildTUI(); atSwap?.();
  });
}
/** The frame as it stands is held (scene/post.ts), atSwap runs at once, and the held frame fades out over the new one,
 *  linear over the old curtain's in and out together, so a dive flows straight into its terrain: a terrain swap, or its
 *  rebuild when elevation lands late (app.ts). At once with reduced motion, or with nothing drawn to hold. */
export function crossfade(atSwap: () => void) {
  // Under a fade still running, the swap joins it: the held frame can't hold itself, so a second hold would drop it at once.
  if (XF.k > 0) { atSwap(); return; }
  const [in_, out] = MOTION.swap;
  gsap.killTweensOf(XF); XF.k = !RM && holdNow() ? 1 : 0;
  atSwap();
  if (XF.k) gsap.to(XF, { k: 0, duration: in_ + out, ease: 'none', onComplete: releaseFrame }); else releaseFrame();
}

export function apply(r: Route) {
  resetPreview(); stopInertia();   // a globe still coasting from a fling would undo every orientation tween below
  if (r.view !== 'title') hideIntro();
  const prev = { ...state }; Object.assign(state, r);
  if (prev.body !== r.body || prev.site !== r.site) resetSun();   // a site entered: its light from the sun as it is now
  const v = r.view;
  state.fromGrid = (v === 'site' || v === 'compare') && r.body === prev.body && (prev.grid || (prev.fromGrid && prev.site === r.site));
  document.body.dataset.view = v;
  if (v !== 'title') leaveTitle();
  // The overview's delayed ov tween isn't killed by overwrite:'auto' until it starts: it would bring its UI back here.
  if (v !== 'overview') { closeInfo(); setHover(null); gsap.killTweensOf(LAY, 'ov'); }
  if (stopDive() || v !== 'site') resetScan();
  if (v !== 'beyond' && prev.view === 'beyond') leaveBeyond();
  if (v === 'title') playTitle(false);
  else if (v === 'beyond') playBeyond(r, prev);
  else if (v === 'overview') playSystem(r, prev);
  else if (v === 'body') playBody(r, prev);
  else if (v === 'site') playSite(r, prev);
  else if (v === 'compare') playCompare(r, prev);
  renderPanel(prev); playGrid(prev); buildMarkers(); chrome();
}
