// Terrain overlay (prototype 1927–1938, 2112–2127): the caption top left, and per terrain viewport the north arrow, the
// elevation legend, on the site view the toggle that drapes the site's orbital image over its block (under the arrow), the labels
// of the block's major contours and the note on where the terrain comes from. Built on each terrain swap, placed every
// frame. The overlay compare draws both blocks in viewport 0: its caption, legend and note carry both.
import * as THREE from 'three';
import { D2R, fmtM, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { doublesOf } from '../data/client';
import { siteOf } from '../data/sites';
import { landing, missionOf, ringed, sizeOf } from '../ellipse';
import { $, $$, esc, setClass, setHTML, setStyle } from '../dom';
import { state } from '../router';
import { G, P, proj, type ScreenPt } from '../scene/frame';
import { L } from '../scene/layout';
import { LAY, VPS, type Rect } from '../scene/rig';
import { creditName, cropOf } from '../terrain/dem';
import { ghost, hazard, ramp, sunAt, sunSet, TERR_S, terrScenes } from '../terrain/mesh';
import { STEEP, WINDOW_KM, type Terrain } from '../terrain/procedural';
import { ENGINE_SRC, terrainNote } from './results';
import { utcOf } from './sun';

const tui = [$('#tui0'), $('#tui1')], caps = [$('#cap0'), $('#cap1')], north: (SVGElement | null)[] = [null, null];
const _a = new THREE.Vector3(), P2: ScreenPt = { x: 0, y: 0, z: 0 };
// The route (and overlay) each caption was last written for: it changes only with them.
const capFor = ['', ''];
// A search landed and named the compare's Earth double: write the captions again.
export const redoCaptions = () => { capFor[0] = capFor[1] = ''; };

// The target's terrain where its search answered no_dem (plan, Gaps for the merge 2: the south-pole sites).
const noDem = (i: number) => i === 0 && state.body !== 'earth' && doublesOf(state.body!, siteOf(state.body, state.site!)!).err?.code === 'no_dem';
// Where the terrain comes from; the overlay's note says whose (ui/results.ts terrainNote).
const note = (Ts: Terrain[], i: number) => (noDem(i) && !Ts[0].engine ? 'No elevation data here for the search engine: it reads Moon terrain only within 59.5° of the equator. ' : '')
  + terrainNote(Ts.map(T => T.engine ? ENGINE_SRC : esc(creditName(T.src))), [BODIES[state.body!].name, BODIES.earth.name]);
/* ---------- The draped orbital image (the site view's block only) ---------- */
// The site's image over exactly its block (scripts/fetch-real-data.mjs drapes), where the block is real terrain: on
// procedural ground an image would show what isn't there. Off by default; the choice holds for the session.
const drape = { on: false }, images = new Map<string, THREE.Texture | 'loading' | 'failed'>(), loader = new THREE.TextureLoader();
function drapeOf() {
  const s = state.view === 'site' && VPS[0].kind === 'terrain' && siteOf(state.body, state.site!), T = terrScenes[0].T;
  return s && T?.src && !T.engine ? cropOf(state.body!, s.lat, s.lon, s.t.ext) : null;
}
// The block's image as the toggle has it: drawn once its file has landed (the tui marks it, for ?capture to wait on).
// The toggle and the note follow in place, so the toggle keeps the keyboard focus; a failed image leaves it unpressed and
// aria-disabled (still focusable, its title says why).
function showDrape() {
  const c = drapeOf(), im = c && images.get(c.url), u = terrScenes[0].drape, on = drape.on && im instanceof THREE.Texture, failed = im === 'failed';
  u.map.value = on ? im : u.map.value; u.k.value = on ? 1 : 0; tui[0].classList.toggle('draped', on);
  const b = tui[0].querySelector('[data-drape]'), n = tui[0].querySelector('.dimg');
  if (b) { b.setAttribute('aria-pressed', String(drape.on && !failed)); if (failed) { b.setAttribute('aria-disabled', 'true'); b.setAttribute('title', 'The orbital image didn’t load'); } }
  if (n) n.textContent = c && on ? ` Image: ${creditName(c.src)}.` : '';
  if (!c || !drape.on || im) return;
  images.set(c.url, 'loading');
  loader.load(c.url, t => { images.set(c.url, t); showDrape(); }, undefined, () => { console.warn(`orbital image ${c.url} failed to load`); images.set(c.url, 'failed'); showDrape(); });
}
tui[0].addEventListener('click', e => { if ((e.target as Element).closest('[data-drape]:not([aria-disabled])')) { drape.on = !drape.on; showDrape(); } });

export function buildTUI() {
  const dc = drapeOf(); builds++;
  tui.forEach((el, i) => {
    const { T, exag } = terrScenes[i], T1 = terrScenes[1].T;
    if (VPS[i].kind !== 'terrain' || !T || (i && ghost.on)) { el.classList.remove('on'); return; }
    const both = ghost.on && T1 ? [T, T1] : [T], ids = [state.body!, 'earth' as const], ov = both.length > 1;
    // The overlay's legend: a row per world (its dot and name, its ramp, its range), so it stays compact over the block.
    const bar = (t: Terrain, j: number) => ov
      ? `<div class="lw" style="--c:${BODIES[ids[j]].color}"><i></i><span class="w">${BODIES[ids[j]].name}</span><span class="ramp" style="background:linear-gradient(90deg,${ramp(t.pal).join(',')})"></span><span class="lv">${fmtM(t.min)} to ${fmtM(t.max)}</span></div>`
      : `<div class="ramp" style="background:linear-gradient(90deg,${ramp(t.pal).join(',')})"></div><div class="lr"><span>${fmtM(t.min)}</span><span>${fmtM(t.max)}</span></div>`;
    const m = both.map(t => `${t.minor.toLocaleString('en-GB')} m`);
    const contours = ov && m[0] !== m[1] ? m.map((x, j) => `${x} (${BODIES[ids[j]].name})`).join(' and ') : m[0];
    // The image's toggle where the block has one; its source in the note while it shows (both set by showDrape).
    const dr = !i && dc ? '<button class="drape" type="button" data-drape aria-pressed="false">Orbital image</button>' : '';
    // The slope hazard's key (ui/slope.ts): the block greyed, so its ramp goes, as under the image.
    const sk = hazard.on;
    el.innerHTML = `<div class="north" title="North"><svg viewBox="0 0 14 20"><path d="M7 1 L12 15 L7 12 L2 15 Z" fill="#E7E9EC"/><text x="7" y="20" font-size="5" text-anchor="middle" fill="#A0A6AE">N</text></svg></div>${dr}
      ${ov ? '' : terrScenes[i].marks.map(m => `<span class="cl" aria-hidden="true">${fmtM(m.lv)}</span>`).join('')}
      <div class="legend">Elevation${both.map(bar).join('')}${sk ? `<div class="sk"><i></i>Slopes over ${STEEP}°</div>` : ''}
      <div class="ct" style="margin-top:6px">Contours every ${contours}. Vertical exaggeration ${exag}×.</div></div>
      <div class="note">${note(both, i)}${dr ? '<span class="dimg"></span>' : ''}</div>`;
    el.classList.add('on'); el.classList.toggle('ov', ov); el.classList.toggle('steep', sk); north[i] = el.querySelector('svg'); labels[i] = $$('.cl', el);
  });
  showDrape();
}
const labels: HTMLElement[][] = [[], []];
// What the contour labels keep clear of, in the viewport's px: its caption, north arrow, toggle, legend and note; measured
// again when the viewport's size, its caption or its overlay changes (builds counts buildTUI's runs).
type Box = { l: number; t: number; r: number; b: number };
let builds = 0;
const boxes: Box[][] = [[], []], boxFor = ['', ''];
function measure(i: number, el: HTMLElement) {
  const box = (e: HTMLElement, x = e.offsetLeft, y = e.offsetTop) => ({ l: x, t: y, r: x + e.offsetWidth, b: y + e.offsetHeight });
  boxes[i] = [box(caps[i], 18, 16), ...$$('.north, .drape, .legend, .note', el).map(e => box(e))];
}

export function placeTUI(R: Rect[]) {
  // The detection frame's ticks and readouts would draw over the captions, note and legend: they stay hidden while
  // the frame is more than half there and fade in over its last half.
  const fade = Math.max(0, 1 - 2 * G.scanUI);
  for (let i = 0; i < 2; i++) {
    const el = caps[i], r = R[i], show = r && (state.view === 'compare' || (state.view === 'site' && i === 0 && VPS[0].kind === 'terrain'));
    if (!show) { setStyle(el, 'opacity', '0'); continue; }
    // The overlay's second caption only on its compare.
    // The sun-angle control's moment, when it lights the site view's block (ui/sun.ts; compare keeps its 315°).
    const set = state.view === 'site' && sunSet.on ? `${sunSet.h}|${sunSet.date}` : '';
    // The landing ellipse drawn on the site view's block (ui/ellipse.ts): which mission's, and whether it's pale (over the
    // slope tint, whose coral it would be mistaken for).
    const lm = state.view === 'site' && landing.on ? missionOf(state.body!) : null;
    const ov = state.view === 'compare' && ghost.on, ex = VPS[i].kind === 'terrain' ? terrScenes[i].exag : 0, key = [state.view, state.body, state.site, state.dbl, ov, ex, set, lm?.id, hazard.on].join('|');
    if (capFor[i] !== key) {
      capFor[i] = key;
      const km = state.view === 'compare' ? WINDOW_KM : siteOf(state.body, state.site!)!.t.ext;   // compare shows both sides over the engine's window
      // On terrain, the vertical exaggeration compare shares (shown on a phone, where the legend's contour line is for
      // screen readers).
      const cap = (id: Body, sid: string | null) => { const s = siteOf(id, sid ?? undefined);
        return s ? `<div class="n">${esc(s.name)}</div><div class="s" style="--c:${BODIES[id].color}"><i></i>${BODIES[id].name}, ${km}&nbsp;×&nbsp;${km}&nbsp;km${ex ? `<span class="vx" aria-hidden="true">, ${ex}× vertical</span>` : ''}</div>` : ''; };
      // Against the top bar's UTC clock (the hour the panel has; short, clear of a phone's image toggle).
      const lit = set && `<div class="s">Lit for ${utcOf(sunAt(state.body!, siteOf(state.body, state.site!)!).at)} UTC</div>`;
      // Its outline and the mission (short: a phone's line ends by the image toggle); "landing ellipse" said, not shown.
      const le = lm ? `<div class="s ell${hazard.on ? ' pale' : ''}"><i></i><span class="sr">Landing ellipse: </span>${lm.name}, ${sizeOf(lm)}</div>` : '';
      setHTML(el, i ? cap('earth', state.dbl) : cap(state.body!, state.site) + lit + le + (ov ? `<div class="c2">${cap('earth', state.dbl)}</div>` : ''));
    }
    // On compare the captions come in with the split; the overlay's, on viewport 0 alone, are there at once.
    setStyle(el, 'opacity', ((state.view === 'compare' && !(ov && !i) ? Math.min(1, LAY.split * 1.4) : 1) * fade).toFixed(3)); setStyle(el, 'transform', `translate3d(${r.x + 18}px,${r.y + 16}px,0)`);
    setStyle(el, 'max-width', `${r.w - 70}px`);   // wraps clear of the north arrow on a phone's half-width viewport
  }
  for (let i = 0; i < 2; i++) {
    // Faded out for the frame, hidden as well (hud.css): the toggle neither takes clicks nor the focus.
    const el = tui[i], r = R[i]; setStyle(el, '--fade', fade.toFixed(3)); setClass(el, 'hid', fade < .05); if (!r || VPS[i].kind !== 'terrain') continue;
    setStyle(el, 'transform', `translate3d(${r.x}px,${r.y}px,0)`); setStyle(el, 'width', `${r.w}px`); setStyle(el, 'height', `${r.h}px`);
    setClass(el, 'narrow', r.w < L.narrow);
    // North arrow: the screen direction of the terrain's north edge (−z) from its centre.
    const cam = VPS[i].cam; proj(_a.set(0, 0, 0), cam, r, P); proj(_a.set(0, 0, -1), cam, r, P2);
    const sv = north[i]; if (sv) setStyle(sv, 'transform', `rotate(${(Math.atan2(P2.x - P.x, -(P2.y - P.y)) / D2R).toFixed(1)}deg)`);
    // The major contours' labels, on their lines, where they fit inside the viewport clear of the overlay's boxes.
    // shortcut: a label isn't hidden behind a ridge, depth-test them if one reads wrong.
    const key = `${r.w}|${r.h}|${capFor[i]}|${el.className}|${builds}`;
    if (labels[i].length && boxFor[i] !== key) { boxFor[i] = key; measure(i, el); }
    // The ring that marks a landing ellipse too small to see (ui/ellipse.ts), round the block's centre: kept clear too.
    const T = terrScenes[i].T, c = T ? T.N >> 1 : 0, ell = T && state.view === 'site' && landing.on && ringed(missionOf(state.body!), T.ext);
    if (ell) proj(_a.set(0, (T.z[c * T.N + c] - T.min) * TERR_S / (T.ext * 1000) * terrScenes[i].exag, 0), cam, r, P2);
    labels[i].forEach((el, n) => { const m = terrScenes[i].marks[n]; if (!m) return; proj(_a.copy(m.p), cam, r, P);
      const x = P.x - r.x, y = P.y - r.y, hw = el.textContent!.length * 3.2 + 2, hh = 7;   // Geist 10 px: at most ~6.1 px a character
      const fits = x > hw && x < r.w - hw && y > hh && y < r.h - hh && !boxes[i].some(b => x + hw > b.l && x - hw < b.r && y + hh > b.t && y - hh < b.b)
        && !(ell && Math.abs(x - P2.x + r.x) < hw + 16 && Math.abs(y - P2.y + r.y) < hh + 16);
      setStyle(el, 'visibility', fits ? 'inherit' : 'hidden');
      setStyle(el, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%)`); });
  }
}
