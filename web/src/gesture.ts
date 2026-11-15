// Touch gestures as pure steps: the phone sheet's snap on release (ui/sheet.ts) and a two-finger step on the globe and
// the terrain (scene/input.ts).

/**
 * The snap a release lands on, as an index into `snaps` (heights, ascending). A flick (faster than .5 px/ms; v > 0 is
 * up) goes on to the next snap its way, or stops at the last; a slower release settles on the nearest.
 */
export function snapTo(h: number, v: number, snaps: number[]) {
  if (v > .5) { const i = snaps.findIndex(s => s > h); return i < 0 ? snaps.length - 1 : i; }
  if (v < -.5) { for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i] < h) return i; return 0; }
  let best = 0;
  snaps.forEach((s, i) => { if (Math.abs(s - h) < Math.abs(snaps[best] - h)) best = i; });
  return best;
}

export interface Pt { x: number; y: number }
/**
 * One step of a two-finger gesture, the fingers moving from (a0, b0) to (a1, b1): the zoom factor `f` (under 1 as they
 * spread, the wheel's sense), the twist `da` in radians (clockwise on screen is +, wrapped to ±π) and the midpoint's
 * move (dx, dy).
 */
export function twoFinger(a0: Pt, b0: Pt, a1: Pt, b1: Pt) {
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y), d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
  let da = Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);
  da -= 2 * Math.PI * Math.round(da / (2 * Math.PI));
  return { f: d0 > 0 && d1 > 0 ? d0 / d1 : 1, da, dx: (a1.x + b1.x - a0.x - b0.x) / 2, dy: (a1.y + b1.y - a0.y - b0.y) / 2 };
}
