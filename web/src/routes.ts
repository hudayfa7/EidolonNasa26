// Hash routes as data (router.ts applies them): '#/mars/jezero/compare/salda/globe', '#/mars/jezero/compare/salda/overlay',
// '#/mars/jezero/compare/salda/book/plan', '#/mars/sites'.
// Pure, so the parsing is tested (routes.test.ts).
import { fmtLL, type Body } from './coords';
import { BODIES, ORDER, PICKABLE } from './data/bodies';
import { STEP_NAME, STEPS, type Step } from './data/booking';
import { siteOf, type Site } from './data/sites';

type View = 'intro' | 'title' | 'overview' | 'beyond' | 'body' | 'site' | 'compare';
// `book`: a step of the booking flow (data/booking.ts), shown in the compare's panel over the compare's stage. A compare
// shows the two terrains side by side, or `overlay`, the double's ghosted onto the target's, or `globe`, the two globes.
// `grid`: a target world's body view with the site selector grid over its globe (views/grid.ts), '#/mars/sites'.
export interface Route { view: View; body: Body | null; site: string | null; dbl: string | null; globe: boolean; overlay: boolean; book: Step | null; grid: boolean }

export function routeOf(s: Partial<Route>) {
  if (s.view === 'title') return '';
  if (s.view === 'beyond') return 'beyond';
  if (!s.body) return 'system';
  const bk = s.dbl && s.book;
  return [s.body, s.site ?? (s.grid && 'sites'), s.dbl && 'compare', s.dbl, s.dbl && (s.globe ? 'globe' : s.overlay && 'overlay'), bk && 'book', bk !== 'listing' && bk].filter(Boolean).join('/');
}
// Anything after '?' in the hash (e.g. ?capture) is ignored. A booking step only follows a compare; '/book' and an
// unknown step are its listing.
export function parseHash(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  const r: Route = { view: 'title', body: null, site: null, dbl: null, globe: false, overlay: false, book: null, grid: false };
  if (!p.length) return r;
  if (p[0] === 'beyond') { r.view = 'beyond'; return r; }
  if (!Object.hasOwn(BODIES, p[0])) { r.view = 'overview'; return r; }
  r.body = p[0] as Body; r.view = 'body';
  if (p[1] === 'sites') { r.grid = PICKABLE.includes(r.body); return r; }   // no site has that id; Earth has no grid
  const s = siteOf(r.body, p[1]); if (!s || (s.custom && r.body === 'earth')) return r;   // Earth pins are compare doubles only
  r.site = s.id; r.view = 'site';
  if (p[2] === 'compare' && r.body !== 'earth' && siteOf('earth', p[3])) {
    r.view = 'compare'; r.dbl = p[3]; r.globe = p[4] === 'globe'; r.overlay = p[4] === 'overlay';
    const i = r.globe || r.overlay ? 5 : 4;
    if (p[i] === 'book') r.book = STEPS.find(x => x === p[i + 1]) ?? 'listing';
  }
  return r;
}
/** A site as the crumbs name it: a pin (not a named target) by its point. */
export const siteName = (b: Body, s: Site) => s.custom && !s.iau ? `Pin ${fmtLL(s.lat, s.lon, b, 4)}` : s.name;
/** The page's title on a route (document.title, ui/chrome.ts): what it shows, most specific first, the crumbs' names. */
export function titleOf(r: Route) {
  const b = r.body && BODIES[r.body].name, s = siteOf(r.body, r.site ?? undefined), d = siteOf('earth', r.dbl ?? undefined);
  const site = s && siteName(r.body!, s);
  const t = r.view === 'beyond' ? 'Beyond the Moon and Mars' : r.view === 'overview' ? 'Solar system'
    : r.book && d ? `${STEP_NAME[r.book]}, ${d.name}` : d ? `${site} and ${d.name}` : site ? `${site}, ${b}` : r.grid ? `Featured sites, ${b}` : b;
  return t ? `${t} · Eidolon` : 'Eidolon';
}
// The texture keys (public/textures/manifest.json) of the worlds a route opens on, as its view's showOnly: the start
// waits on these alone (app.ts), the rest load after it. Null on Beyond: every map.
export function mapsOf(r: Route): string[] | null {
  if (r.view === 'beyond') return null;
  const ids = r.view === 'title' ? ['earth' as const] : !r.body ? ORDER : r.dbl ? [r.body, 'earth' as const] : [r.body];
  return ids.flatMap(id => { const b = BODIES[id]; return [b.tex, b.bump, b.night, b.spec, ...(b.cap ?? [])].filter((k): k is string => !!k); });
}
