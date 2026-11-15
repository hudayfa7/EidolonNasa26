// The phone's bottom sheet (the panel below --bp): its grip drags it between peek, half and full, and a release snaps
// (a flick goes on to the next snap its way). A tap, Enter or Space steps it up, from full round to peek; the arrows
// step it, Home and End go to either end. The snaps move as the info sheet does (plan, Motion), at once with reduced
// motion. scene/rig.ts sizes the viewports above it from SH.f, scene/frame.ts the panel.
import gsap from 'gsap';
import { snapTo } from '../gesture';
import { $, setAttr } from '../dom';
import { MOTION, RM } from '../motion';
import { H, sheet, SH, snapF } from '../scene/layout';
import { LAY } from '../scene/rig';

// Its label says where it is and where a tap takes it (index.html has the first: half).
const grip = $('#grip'), panel = $('#panel'), NAME = ['peek', 'half height', 'full height'], NEXT = ['Expand', 'Expand', 'Collapse'];

export function setSnap(i: number) {
  const up = snapF(i) > SH.f, v = { duration: RM ? 0 : MOTION.info[up ? 0 : 1], ease: up ? 'power3.out' : 'power3.inOut', overwrite: true }; SH.snap = i;
  setAttr(grip, 'aria-label', `Panel at ${NAME[i]}. ${NEXT[i]} to ${NAME[(i + 1) % 3]}`); setAttr(panel, 'data-snap', i);
  gsap.to(SH, { f: snapF(i), ...v });
  if (!i) gsap.to(panel, { scrollTop: 0, ...v });   // peek is the sheet's top (it can't scroll there): back up with the slide
}
/** The phone's sheet at peek: what the app scrolls into view in it would push its top (the back link, the toggle) out. */
export const peeked = () => sheet() && SH.snap === 0;
/** The sheet at full covers the stage: nothing there to render (scene/frame.ts). */
export const sheetCovers = () => sheet() && LAY.panel > .999 && SH.f >= snapF(2) - .001;

// A drag: its pointer, where it started, its last move and speed (px/ms, up is +); other pointers are ignored.
// `dragged` keeps the click a mouse's drag ends on from also stepping the sheet (a keyboard's click, detail 0, always
// steps).
let drag: { id: number; y0: number; f0: number; y: number; t: number; v: number } | null = null, dragged = false;
const begin = (el: Element, id: number, y: number, t: number) => {
  el.setPointerCapture(id); gsap.killTweensOf(SH); drag = { id, y0: y, f0: SH.f, y, t, v: 0 };
};
grip.addEventListener('pointerdown', e => { if (!sheet() || drag) return; dragged = false; begin(grip, e.pointerId, e.clientY, e.timeStamp); });
// At peek the content drags the sheet too (it doesn't scroll there: touch-action none, responsive.css), so a swipe up on
// the back link or heading raises it. It takes the pointer only once it moves, so a tap stays its button's; the
// overlay's slider keeps its own drags.
let down: { id: number; y: number } | null = null;
panel.addEventListener('pointerdown', e => { down = sheet() && SH.snap === 0 && !drag && !(e.target as Element).closest('#grip, input') ? { id: e.pointerId, y: e.clientY } : null; });
panel.addEventListener('pointermove', e => {
  if (!drag && down?.id === e.pointerId && Math.abs(e.clientY - down.y) > 4) { begin(panel, e.pointerId, down.y, e.timeStamp); down = null; }
  if (drag?.id !== e.pointerId) return;
  const dt = e.timeStamp - drag.t; if (dt > 0) drag.v = (drag.y - e.clientY) / dt;
  drag.y = e.clientY; drag.t = e.timeStamp;
  SH.f = Math.min(snapF(2), Math.max(snapF(0), drag.f0 + (drag.y0 - e.clientY) / H));
});
const release = (e: PointerEvent) => {
  if (down?.id === e.pointerId) down = null;
  if (drag?.id !== e.pointerId) return;
  const moved = Math.abs(e.clientY - drag.y0) > 4, v = e.type === 'pointerup' && e.timeStamp - drag.t < 100 ? drag.v : 0;   // held still: no flick
  drag = null;
  if (moved || e.type === 'pointercancel') { dragged = moved; setSnap(snapTo(SH.f * H, v, [0, 1, 2].map(i => snapF(i) * H))); }
};
panel.addEventListener('pointerup', release); panel.addEventListener('pointercancel', release);
grip.addEventListener('click', e => { if (!drag && (!dragged || !e.detail)) setSnap((SH.snap + 1) % 3); dragged = false; });
grip.addEventListener('keydown', e => {
  const i = ({ ArrowUp: SH.snap + 1, ArrowDown: SH.snap - 1, Home: 0, End: 2 } as Record<string, number>)[e.key];
  if (i === undefined) return;
  e.preventDefault(); setSnap(Math.min(2, Math.max(0, i)));
});
