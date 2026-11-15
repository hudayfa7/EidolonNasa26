// Start (prototype 2285–2299), loaded by main.ts only once WebGL works. Gated on the first tier of the maps of the worlds
// the route opens on (routes.ts mapsOf: Earth's 1024 px colour map and data maps for the intro, ~0.3 MB), on a site or
// compare the real elevation its views read first (terrain/dem.ts: its own patches, ~0.1 MB for Jezero), and the
// measured font faces: the intro frame and the wordmark gradient are sized from laid-out text. The rest loads after
// start by need, one batch at a time so the next one needed has the link: the site manifest, the route's worlds at full
// resolution (a quiet line in the status bar while a globe on screen waits for its own: ui/chrome.ts mapsLine), the
// other worlds' first tiers, then their full maps, then Beyond's (on entry if Beyond shows first). Elevation patches
// load when a view first reads one, and a world's featured sites' from when it shows (a click reads them at once).
// Under ?capture the first tiers and every patch hold the start and the full maps hold __eidolon.ready. Assets that land
// after start go through onAsset.
import gsap from 'gsap';
import type { Body } from './coords';
import { BODIES, ORDER } from './data/bodies';
import { centreOf, loadMock, MOCK, pollHealth, terrainOf } from './data/client';
import { clearPins } from './data/pins';
import { SITES, siteOf } from './data/sites';
import { $ } from './dom';
import { CAPTURE, markReady, RM, run, onUpdate } from './motion';
import { apply, buildScenes, crossfade, parse, state } from './router';
import { mapsOf, parseHash } from './routes';
import { applyLayout, bodies } from './scene/bodies';
import { draw, frame } from './scene/frame';
import { layoutKey, resize } from './scene/layout';
import { precompile } from './scene/post';
import { blank, landed, loadTextures, lost, onLateTexture, renderer, takeLow, TEX } from './scene/renderer';
import './scene/input';   // listeners, and the inertia update that must run before frame()
import { VPS } from './scene/rig';
import { loadAllPatches, loadSites, onLatePatch, sitesLoaded } from './terrain/dem';
import { clearPinTerrain, genTerrain, needSite } from './terrain/procedural';
import { prepareMaps } from './terrain/sample';
import './ui/campaigns';   // My campaigns' dialog and its openers
import { mapsLine } from './ui/chrome';
import { drawMaps, refreshPanel } from './ui/panel';
import { redoEllipse } from './ui/ellipse';
import { redoMeasure } from './ui/measure';
import { redoSlope } from './ui/slope';
import { buildTUI } from './ui/terrain-ui';
import { redrawScenes } from './views/beyond';
import { remeasureIntro, runIntro } from './views/intro';
import { measureBars } from './views/title';

// The fonts stylesheet has settled before this runs (module scripts wait for pending stylesheets). A face that fails
// doesn't hold the start, nor (outside ?capture) one that stalls past 7 s: what lands later goes through onAsset.
async function fontsLoaded() {
  await Promise.all([document.fonts.load('300 1em Newsreader'), document.fonts.load('600 1em Geist')]).catch(() => {});
  await document.fonts.ready;
}
const ceiling = (p: Promise<unknown>) => CAPTURE ? p : Promise.race([p, new Promise(r => setTimeout(r, 7000))]);

// A world draws in its map's mean colour until its colour map (and the Moon's cap) land, then turns to them; when its
// full map replaces the low tier, the low one fades out over it (same exposure: it is the full map downsampled). At
// once before start, over .9 s after it.
function showMaps(fade: boolean) {
  const duration = fade && !RM ? .9 : 0;
  for (const id of ORDER) {
    const b = BODIES[id], u = bodies[id].mesh.material.uniforms, lo = takeLow(b.tex);
    if (u.ready.value < 1 && [b.tex, ...(b.cap ?? [])].every(landed)) gsap.to(u.ready, { value: 1, duration, ease: 'power2.inOut', overwrite: true });
    if (u.nOn.value < 1 && landed(b.nrm)) gsap.to(u.nOn, { value: 1, duration, ease: 'power2.inOut', overwrite: true });   // the relief, from flat
    if (u.cOn.value < 1 && b.clouds && landed(b.clouds)) gsap.to(u.cOn, { value: 1, duration, ease: 'power2.inOut', overwrite: true });   // the title's clouds
    if (lo) { u.mapLo.value = lo; gsap.fromTo(u.sharp, { value: 0 }, { value: 1, duration, ease: 'power2.inOut', overwrite: true, onComplete: () => { u.mapLo.value = blank; lo.dispose(); } }); }
  }
}

// The real elevation the site on show reads (its terrain; on compare both windows), by source: '' where none. A compare
// window still on its way is redrawn when it lands or fails (ui/panel.ts fill), from the terrain then cached.
const shownSrc = () => {
  const s = (state.view === 'site' || state.view === 'compare') && siteOf(state.body, state.site ?? undefined);
  if (!s) return '';
  if (state.view !== 'compare') return genTerrain(state.body!, s).src ?? '';
  const A = terrainOf(state.body!, s), B = terrainOf('earth', siteOf('earth', state.dbl!)!);
  return A.wait || B.wait ? 'window' : `${A.T.src}|${B.T.src}`;
};
// Elevation patches a view read before they landed (terrain/dem.ts onLatePatch): the terrains built without them are
// built again; what shows the site is redrawn only if it now reads real elevation it didn't (a window the engine sent,
// one built from a patch loaded meanwhile, or one the window on its way will replace stays as it is: no second swap).
function onLatePatches() {
  const was = shownSrc(); clearPinTerrain('');
  if (shownSrc() !== was) onAsset('sites');
}

// A texture, font or the real site elevation that landed after start (or a full map that failed: the low tier stays):
// redo what was drawn without it (the terrain, its legend and note, under a crossfade; with the site data, the panel's
// credit lines, crops and no-data box). The globes turn from their placeholder (showMaps; three uploads the texture when
// it lands), the loading line follows the globes on screen, and the footer art redraws on its own loop.
function onAsset(key: string) {
  if (lost) return;   // the fallback page has replaced the app: nothing to redraw, no search to ask again
  if (key === 'font') { measureBars(); remeasureIntro(); return; }
  showMaps(!CAPTURE); mapsLine();   // under ?capture the full maps land before ready: at once, so every state sees them alike
  // Pins, site maps and terrain read the worlds' height and colour maps; the others only the globes (three uploads them),
  // and Beyond's cards their own images.
  const map = ORDER.find(id => key === BODIES[id].bump || key === BODIES[id].tex);
  if (key !== 'sites' && !map) { redrawScenes(key); return; }
  const elev = key === 'sites' || key === BODIES[map!].bump;   // pins and terrain read elevation; colour, the site maps
  if (key === 'sites') clearPinTerrain('');
  prepareMaps(); if (elev) clearPins();
  // The terrain shown is rebuilt only for elevation it reads: the site data, its world's or (compare) Earth's map.
  const reads = elev && (key === 'sites' || map === state.body || (map === 'earth' && state.view === 'compare'));
  const onTerrain = () => reads && VPS[0].kind === 'terrain' && (state.view === 'site' || state.view === 'compare');
  // A pin's terrain is rebuilt from a late height map: the slope hazard's area beside its tint too (ui/slope.ts), and
  // a measured line's cross-section (ui/measure.ts).
  const redraw = () => { if (key === 'sites') refreshPanel(); else if (elev) { redoSlope(); redoMeasure(); redoEllipse(); } drawMaps(); };
  if (onTerrain()) crossfade(() => { buildScenes(); buildTUI(); redraw(); });
  else redraw();
}

export async function start() {
  // A lost context ends the app for good (main.ts shows the fallback page): its window listeners (Esc, the router's
  // hashchange) stand down, so a key or a link there doesn't route the dead app behind it.
  renderer.domElement.addEventListener('webglcontextlost', () => { state.ready = false; });
  if (!MOCK) document.querySelectorAll('[data-mock]').forEach(e => e.remove());   // index.html's "results are samples" notes: the hosted site's only
  const r0 = parse(), all = Object.keys(TEX), first = CAPTURE ? all : mapsOf(r0) ?? all;
  // A site or compare deep link opens on its real terrain; its site (a pin's, built by parse() before its world's height
  // map) is built again after the gate (clearPins below).
  const elev = CAPTURE ? loadSites().then(loadAllPatches) : r0.view === 'site' || r0.view === 'compare'
    ? Promise.all(([[r0.body!, r0.site], ['earth', r0.dbl]] as [Body, string | null][]).map(([b, id]) => { const s = siteOf(b, id ?? undefined); return s && needSite(b, s, centreOf(b, s)); })) : null;
  await Promise.all([ceiling(loadTextures(first)), ceiling(fontsLoaded()), ...(elev ? [ceiling(elev)] : [])]);
  onLateTexture(onAsset); onLatePatch(onLatePatches); document.fonts.addEventListener('loadingdone', () => onAsset('font'));
  showMaps(false);
  const worlds = mapsOf(parseHash('#/system'))!;
  const sites = () => sitesLoaded ? null : loadSites().then(() => { if (sitesLoaded) onAsset('sites'); });
  // The shown world's featured sites: a click on one reads its elevation at once (the panel's map, then the dive's
  // terrain), so their patches (~0.1–0.3 MB a site, each once) load whenever a world shows, from when the route's own
  // full maps are in.
  let near = false;
  const nearSites = () => { const b = state.body; if (near && b) for (const s of SITES[b]) needSite(b, s, centreOf(b, s)); };
  addEventListener('hashchange', nearSites);   // after the router's: the route applied
  // The relief's normal maps (and Earth's clouds, which only the title shows) come with the full maps (the globes start
  // flat and clear): they hold no start.
  const nrm = (keys: string[]) => [...keys, ...ORDER.filter(id => keys.includes(BODIES[id].tex)).flatMap(id => [BODIES[id].nrm, BODIES[id].clouds])
    .filter((k): k is string => !!k)];
  const full = (async () => {
    await sites(); await loadTextures(nrm(first), true); near = true; nearSites();
    await loadTextures(worlds); await loadTextures(nrm(worlds), true);
  })();
  full.then(() => loadTextures(all));
  resize(); applyLayout(layoutKey); prepareMaps(); clearPins();
  try { await precompile(VPS[0].cam); } catch (e) { console.warn('shader precompile failed; the first frame compiles instead', e); }
  const r = parse();
  // The intro's sky is already on the poster (index.html), so Earth is there from the first frame; elsewhere the worlds
  // fade in under the poster's fade.
  if (r.view === 'title') bodies.earth.intro.v = 1;
  ORDER.forEach((k, i) => gsap.to(bodies[k].intro, { v: 1, duration: RM ? 0 : .9, ease: 'power2.out', delay: RM ? 0 : .1 + i * .08 }));
  onUpdate(frame);
  // /health from boot (the status bar's "starting up"). The mock engine loads after the start (data/client.ts loadMock):
  // its /health waits for the poster to give way; under ?capture it loads here, so every state's timing is as before.
  if (CAPTURE && MOCK) await loadMock();
  const later = MOCK && !CAPTURE;
  if (!later) pollHealth();
  state.ready = !lost;
  if (r.view === 'title') runIntro(); else { $('#intro').hidden = true; apply(r); }
  run(draw, () => apply(parse()));
  // The first-paint poster (index.html) gives way to the first frame.
  gsap.to('#poster', { autoAlpha: 0, duration: RM ? 0 : .8, onComplete: () => { $('#poster').remove(); if (later) pollHealth(); } });
  if (CAPTURE) await full;
  await markReady();
}
