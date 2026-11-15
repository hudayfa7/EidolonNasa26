// Info sheet over the system view (prototype 1508–1521): slides up on a scroll or swipe down, closes on Escape, its
// back button, leaving the system view, or 160 px of upward wheel or downward swipe at its scroll top.
import gsap from 'gsap';
import { $ } from '../dom';
import { MOTION, RM } from '../motion';
import { state } from '../router';

const sheet = $('#sysinfo'), stage = $('#stage'), closeBtn = $<HTMLButtonElement>('[data-close]', sheet);
let open = false, closeAcc = 0, opener: Element | null = null;
gsap.set(sheet, { yPercent: 102, autoAlpha: 0 });

export const infoOpen = () => open;
// Fully up: it hides the whole stage below the top bar, so the 3D render can pause.
export const infoCovers = () => open && gsap.getProperty(sheet, 'yPercent') === 0;

export function openInfo() {
  if (open || state.view !== 'overview') return;
  open = true; sheet.scrollTop = 0;
  // The stage behind leaves the Tab order. Focus that was on it (the cue, a label) moves into the sheet, which can
  // take it once visible; opened from the canvas, nothing had focus and Tab reaches the sheet after the top bar.
  opener = document.activeElement; stage.inert = true; sheet.style.visibility = 'inherit';
  if (opener !== document.body) closeBtn.focus({ preventScroll: true });
  gsap.to(sheet, { yPercent: 0, autoAlpha: 1, duration: RM ? 0 : MOTION.info[0], ease: 'power3.out', overwrite: true });
}
export function closeInfo() {
  if (!open) return;
  open = false; closeAcc = 0; stage.inert = false;
  if (sheet.contains(document.activeElement)) (opener as HTMLElement | null)?.focus?.({ preventScroll: true });
  opener = null;
  gsap.to(sheet, { yPercent: 102, autoAlpha: 0, duration: RM ? 0 : MOTION.info[1], ease: 'power3.inOut', overwrite: true });
}
sheet.addEventListener('wheel', e => {
  if (sheet.scrollTop > 0 || e.deltaY >= 0) { closeAcc = 0; return; }
  closeAcc -= e.deltaY; if (closeAcc > 160) closeInfo();
}, { passive: true });
// Touch: a swipe that starts at the scroll top and pulls down 160 px closes it (the sheet's overscroll is contained).
let touchY: number | null = null;
sheet.addEventListener('touchstart', e => { touchY = sheet.scrollTop > 0 ? null : e.touches[0].clientY; }, { passive: true });
sheet.addEventListener('touchmove', e => {
  if (touchY === null || sheet.scrollTop > 0) { touchY = null; return; }
  if (e.touches[0].clientY - touchY > 160) { touchY = null; closeInfo(); }
}, { passive: true });
