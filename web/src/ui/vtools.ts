// The View tools window: the site view's controls for the 3D block and the map's look (sunlight, slope hazard, landing
// ellipse), floating over the stage's right-hand side, collapsed to its title until opened. It lives outside the panel:
// the panel's `will-change: transform` would pin anything fixed inside it to the panel. ui/sun.ts, ui/slope.ts and
// ui/ellipse.ts listen here; ui/panel.ts renderTools fills it on each route (empty and hidden off the site view).
export const vt = (() => {
  const el = document.createElement('aside');
  el.id = 'vtools'; el.hidden = true; el.setAttribute('aria-label', 'View tools');
  document.body.append(el);
  return el;
})();
