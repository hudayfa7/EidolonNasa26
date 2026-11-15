// Stage size, layout tokens and resize (prototype 2272–2283). Layout constants live in src/tokens.css only.
import gsap from 'gsap';
import type { LayoutKey } from '../data/bodies';
import { state } from '../router';
import { applyLayout } from './bodies';
import { pixelRatio, renderer } from './renderer';
import { focusPose, overviewPose, setRig, titlePose, VPS } from './rig';
import { targetPose } from '../views/compare';

export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
/** Layout tokens: px values (peek with the safe area under it), sheet as a fraction of the height. Read on resize, when
 * the stylesheet has surely applied. */
export const L = { top: 0, panel: 0, sheet: 0, bp: 0, portrait: 0, narrow: 0, peek: 0 };
export let W = 1, H = 1, TOPH = 0, layoutKey: LayoutKey = 'wide';
export const sheet = () => innerWidth < L.bp;   // the panel is a bottom sheet
/** The bottom sheet's snap (0 peek, 1 half, 2 full; ui/sheet.ts) and its height now, as a fraction of the page height. */
export const SH = { snap: 1, f: .54 };
const stageEl = document.querySelector<HTMLElement>('#stage')!, topEl = document.querySelector<HTMLElement>('#top')!, mixEl = document.querySelector<HTMLElement>('#mix')!;
const hintEl = document.querySelector<HTMLElement>('#shint')!;
// A snap's height as a fraction of the page: peek (with the gesture hint's line and the overlay's slider, their rows
// too, so the back link stays in it), half (--sheet), full (up to the top bar).
export const snapF = (i: number) => i === 0 ? (L.peek + hintEl.offsetHeight + mixEl.offsetHeight) / H : i === 1 ? L.sheet : 1 - TOPH / H;

/** The stage's page box: pointer events are mapped into stage coordinates with it. */
export let stageBox = stageEl.getBoundingClientRect();
export function resize() {
  for (const k of ['top', 'panel', 'bp', 'portrait', 'narrow', 'peek'] as const) L[k] = parseFloat(token(`--${k}`));
  L.sheet = parseFloat(token('--sheet')) / 100;
  L.peek += parseFloat(getComputedStyle(document.documentElement).paddingBottom) || 0;   // the root's padding is the safe area
  stageBox = stageEl.getBoundingClientRect(); W = Math.round(stageBox.width); H = Math.round(stageBox.height); TOPH = topEl.offsetHeight || L.top;
  gsap.killTweensOf(SH); SH.f = snapF(SH.snap);   // its snap's height at the new size
  renderer.setPixelRatio(pixelRatio()); renderer.setSize(W, H, false);
  const key = W / H < L.portrait ? 'tall' : 'wide';
  if (key === layoutKey) return;
  layoutKey = key; applyLayout(key);
  const L0 = VPS[0];
  if (!L0.rig.tween) { if (state.view === 'overview') setRig(L0, overviewPose()); else if (state.view === 'title') setRig(L0, titlePose()); else if (state.body) setRig(L0, state.view === 'compare' ? targetPose(state.body) : focusPose(state.body)); }
  if (state.view === 'compare' && !VPS[1].rig.tween) setRig(VPS[1], focusPose('earth'));
}
addEventListener('resize', resize);
