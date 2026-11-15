// Beyond: past Mars, the camera slings off the line-up and the Solar System's path around the galactic centre draws
// left to right, then holds still; four concept cards below, each with a spacecraft's image of its world in the
// footer's dots (prototype 1299–1307, 1344–1395; its painted scenes, 1397–1480, replaced: Should, Beyond imagery).
import gsap from 'gsap';
import { ORDER } from '../data/bodies';
import { BEYOND } from '../data/photos';
import { $, $$ } from '../dom';
import { RM, T_ } from '../motion';
import { setTerrain, state, type Route } from '../router';
import { bodies } from '../scene/bodies';
import { layoutKey } from '../scene/layout';
import { image, loadTextures } from '../scene/renderer';
import { LAY, overviewPose, setRig, slingshot, VPS } from '../scene/rig';
import { BAYER } from '../ui/carousel';

const beyondEl = $('#beyond'), backBtn = $('.bhero [data-go]', beyondEl);
// Fully faded in: its opaque background hides the stage, so the 3D render can pause.
export const beyondCovers = () => state.view === 'beyond' && beyondEl.style.opacity === '1';

export function playBeyond(_r: Route, prev: Route) {
  const L0 = VPS[0], instant = prev.view === 'intro';
  setTerrain(false);
  T_(LAY, { panel: 0, split: 0, grat: 0, ov: 0, top: 1 }, .7);
  L0.only = null;
  const p = overviewPose(); if (layoutKey === 'tall') p.target.y -= 30; else p.target.x += 32;
  if (instant) setRig(L0, p); else slingshot(L0, p, 1.9, undefined, 'power2.in');
  for (const k of ORDER) gsap.to(bodies[k].fade, { v: 0, duration: .7, delay: .9, overwrite: true });
  loadTextures(Object.keys(BEYOND));   // asked for when first shown (each once), not left behind the worlds' full maps
  reveal(instant);
}
export function leaveBeyond() { revealTl?.kill(); gsap.to(beyondEl, { autoAlpha: 0, duration: .5, overwrite: true }); }

// The reveal: sheet in, galaxy path left to right, orbits, hero copy, labels, the cards' worlds, cards. One at a time:
// re-entering mid-reveal starts it over instead of running two on the same values.
const GAL = { prog: 0, q: 0 }, GAL_T = 9.7;
let revealTl: gsap.core.Timeline | null = null;
function reveal(instant: boolean) {
  revealTl?.kill();
  const d = RM || instant ? 0 : 1, hadFocus = document.activeElement !== document.body;
  beyondEl.scrollTop = 0;   // it scrolls: each entry starts at the top, where the way back is
  fitLabels();
  gsap.set('#beyond .bin', { opacity: 1 }); gsap.set('#beyond .bhero', { opacity: 0, y: 12 }); gsap.set('#beyond .gl', { opacity: 0 }); gsap.set('#beyond .card', { opacity: 0, y: 16 });
  GAL.prog = 0; GAL.q = 0; drawGalaxy();
  revealTl = gsap.timeline()
    .to(beyondEl, { autoAlpha: 1, duration: .8 * d }, .9 * d)
    // Focus that was on the label or cue (hidden by now) moves to the way back; after a wheel or swipe there was none.
    .call(() => { if (hadFocus) backBtn.focus({ preventScroll: true }); }, [], 1.7 * d)
    .to(GAL, { prog: 1, duration: 2.4 * d, ease: 'power2.inOut', onUpdate: showGalaxy }, 1.0 * d)
    .to(GAL, { q: 1, duration: .7 * d, ease: 'power1.out', onUpdate: showGalaxy }, 3.0 * d)
    .to('#beyond .bhero', { opacity: 1, y: 0, duration: .8 * d, ease: 'power2.out' }, 1.3 * d)
    .to('#beyond .gl', { opacity: 1, duration: .5 * d, stagger: .4 * d }, 2.0 * d)
    .add(drawScenes, 3.2 * d)
    .to('#beyond .card', { opacity: 1, y: 0, duration: .6 * d, stagger: .1 * d, ease: 'power2.out' }, 3.3 * d);
}

/* ---------- The Solar System on its path around the galactic centre ---------- */
// Three layers, each drawn once when Beyond shows (and on a resize), then revealed on the compositor, never redrawn by the
// tweens: the galactic glow fading in (its own canvas, at 1×: a soft gradient), the path, its band and the planets'
// trails wiping in left to right with the Sun (a clip eased to the Sun, the whole layer as the path arrives), then the
// orbits and planets fading in. Then it holds.
const [galC, pathC, orbC] = ['#galaxy', '#gpath', '#gorb'].map(q => $<HTMLCanvasElement>(q));
const PLAN = [{ a: .05, P: 2.2, c: '#C9CCD2' }, { a: .085, P: 3.4, c: '#EAD8B2' }, { a: .12, P: 4.8, c: '#86BBEB' }, { a: .165, P: 6.9, c: '#F2885F' }, { a: .25, P: 10.5, c: '#DDB78F' }, { a: .34, P: 15.5, c: '#C3E3F7' }];
function layer(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); return g;
}
let galW = 0;
function drawGalaxy() {
  const w = galW = galC.clientWidth, h = galC.clientHeight; if (!w) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const sx = w * .66, sy = h * .38, S = Math.min(w, h * 1.4) * .62, v = w * .05, gcx = -w * .08, time = GAL_T;
  let gal = layer(galC, w, h, 1), gr = gal.createRadialGradient(gcx, sy, 0, gcx, sy, w * .55);
  gr.addColorStop(0, 'rgba(240,248,255,.95)'); gr.addColorStop(.1, 'rgba(180,212,255,.62)'); gr.addColorStop(.38, 'rgba(84,134,232,.24)'); gr.addColorStop(1, 'rgba(40,80,180,0)');
  gal.fillStyle = gr; gal.fillRect(0, 0, w, h);
  gal = layer(pathC, w, h, dpr);
  gal.setLineDash([2, 7]); gal.strokeStyle = 'rgba(225,238,255,.32)'; gal.lineWidth = 1;
  gal.beginPath(); gal.arc(gcx, sy, sx - gcx, -.55, .55); gal.stroke(); gal.setLineDash([]);
  gal.save(); gal.beginPath(); gal.rect(0, 0, sx + 6, h); gal.clip();   // the path ends at the Sun
  gr = gal.createLinearGradient(0, 0, sx, 0); gr.addColorStop(0, 'rgba(140,190,255,0)'); gr.addColorStop(.55, 'rgba(175,212,255,.32)'); gr.addColorStop(1, 'rgba(248,252,255,.95)');
  gal.fillStyle = gr; gal.beginPath(); gal.moveTo(0, sy - S * .1); gal.quadraticCurveTo(sx * .62, sy - S * .016, sx, sy); gal.quadraticCurveTo(sx * .62, sy + S * .016, 0, sy + S * .1); gal.closePath(); gal.fill();
  const k = .34, trail = sx / v, step = .03;
  for (const p of PLAN) {
    const a = p.a * S; gal.strokeStyle = p.c; gal.lineWidth = 1.15;
    for (let seg = 0; seg < 20; seg++) {
      const a0 = seg / 20 * trail, a1 = (seg + 1) / 20 * trail; gal.globalAlpha = .85 * Math.pow(1 - seg / 20, 1.5); gal.beginPath();
      for (let age = a0; age <= a1 + 1e-6; age += step) { const th = 2 * Math.PI * (time - age) / p.P, x = sx - v * age + a * Math.sin(th) * k, y = sy + a * Math.cos(th); if (age === a0) gal.moveTo(x, y); else gal.lineTo(x, y); }
      gal.stroke();
    }
  }
  gal.restore(); gal.globalAlpha = 1;
  gr = gal.createRadialGradient(sx, sy, 0, sx, sy, S * .12); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(225,238,255,.7)'); gr.addColorStop(1, 'rgba(160,200,255,0)');
  gal.fillStyle = gr; gal.fillRect(sx - S * .13, sy - S * .13, S * .26, S * .26);
  gal.fillStyle = '#fff'; gal.beginPath(); gal.arc(sx, sy, 4, 0, Math.PI * 2); gal.fill();
  gal = layer(orbC, w, h, dpr);
  for (const p of PLAN) {
    const a = p.a * S; gal.strokeStyle = 'rgba(225,238,255,.3)'; gal.lineWidth = 1; gal.beginPath(); gal.ellipse(sx, sy, a * k, a, 0, 0, Math.PI * 2); gal.stroke();
    const th = 2 * Math.PI * time / p.P; gal.fillStyle = p.c; gal.beginPath(); gal.arc(sx + a * Math.sin(th) * k, sy + a * Math.cos(th), 2.6, 0, Math.PI * 2); gal.fill();
  }
  showGalaxy();
}
// The reveal as it stands (GAL.prog, GAL.q): the layers' opacity and the path's clip, written by the tweens.
function showGalaxy() {
  const pr = GAL.prog, edge = galW ? (galW * .66 + 6) * pr / galW : pr;
  galC.style.opacity = String(Math.min(1, pr * 2.2));
  pathC.style.clipPath = pr > .97 ? 'none' : `inset(0 ${(100 - edge * 100).toFixed(2)}% 0 0)`;
  orbC.style.opacity = String(GAL.q);
}
// The labels are fixed over the galaxy and the cards scroll: hidden wherever a card can reach one (a short window, two
// columns). Measured, not a breakpoint: the cards' height follows the width, so the height that clears them does too.
const cardsEl = $('.cards', beyondEl), labels = $$('.gl', beyondEl);
function fitLabels() {
  const foot = cardsEl.getBoundingClientRect().top - (beyondEl.scrollHeight - beyondEl.clientHeight - beyondEl.scrollTop);   // the cards' top, scrolled to the end
  beyondEl.classList.toggle('nogl', labels.some(g => g.offsetTop + g.offsetHeight > foot));
}
addEventListener('resize', () => { if (state.view === 'beyond') { fitLabels(); drawGalaxy(); if (painted) scenes().forEach(paintOne); } });

/* ---------- The cards' worlds: a spacecraft's image of each, in the footer's dots ---------- */
// The footer's treatment (ui/carousel.ts): the image's brightness at each dot against the 4×4 Bayer matrix, square dots
// at its pitch, one ink. Each image (data/photos.ts BEYOND) is a texture key of its own and loads with the maps. Drawn
// as the cards come in, again on a resize, and otherwise held.
const scenes = () => $$<HTMLCanvasElement>('#beyond canvas.scene');
const grid = document.createElement('canvas'), gg = grid.getContext('2d', { willReadFrequently: true })!;
function paintOne(cv: HTMLCanvasElement) {
  const k = cv.dataset.scene!, im = image(k), w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);   // also clears it
  if (!im?.width || !w) return;   // not landed (redrawScenes draws it when it does) or not laid out
  cv.removeAttribute('aria-hidden');   // drawn: its words now describe what shows
  const P = w > 600 ? 3 : 2.5, cols = Math.floor(w / P), rows = Math.floor(h / P), dot = P * .72, ox = (w - cols * P) / 2, oy = (h - rows * P) / 2;
  grid.width = cols; grid.height = rows; gg.imageSmoothingQuality = 'high'; gg.drawImage(im, 0, 0, cols, rows);
  const d = gg.getImageData(0, 0, cols, rows).data, g = cv.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = BEYOND[k].ink;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    if (d[(r * cols + c) * 4] / 255 > BAYER[((r & 3) << 2) | (c & 3)]) g.fillRect(ox + (c + .5) * P - dot / 2, oy + (r + .5) * P - dot / 2, dot, dot);
}
// Each image's caption (its mission, linking its page in NASA's library, and its credit) and words for it, unread until
// the image is drawn (paintOne): an empty frame has only its caption.
for (const cv of scenes()) {
  const p = BEYOND[cv.dataset.scene!];
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', p.alt); cv.setAttribute('aria-hidden', 'true');
  cv.insertAdjacentHTML('afterend', `<figcaption><a href="https://images.nasa.gov/details/${p.id}" target="_blank" rel="noopener">${p.what}</a><span>${p.by}</span></figcaption>`);
}
let painted = false;
const drawScenes = () => { painted = true; scenes().forEach(paintOne); };
// An image that lands after the cards were drawn (a slow link) fades in over its empty frame (the frame's ground is the
// figure's, beyond.css, so only the dots fade), as the globes turn to their maps, so nothing pops.
export function redrawScenes(k: string) {
  const cv = painted && scenes().find(c => c.dataset.scene === k); if (!cv) return;
  paintOne(cv); gsap.fromTo(cv, { opacity: 0 }, { opacity: 1, duration: RM ? 0 : .9, ease: 'power2.inOut', overwrite: true });
}
