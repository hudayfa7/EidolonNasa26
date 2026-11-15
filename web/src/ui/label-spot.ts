// Where a globe marker's label goes (ui/markers.ts), as its top-left from the marker's centre in px: right of the
// marker, else left, under or above it (under and above: centred, then running right from it, then left, each kept
// inside the viewport). Of the spots inside the viewport, the first that covers no other visible marker, else the one
// that covers fewest (results cluster by region; a phone's half-width globe can't always clear them); else under it.
import { clamp } from '../coords';

export interface Pt { x: number; y: number; on: boolean }
interface Box { x: number; y: number; w: number; h: number }
// The label's gap beside a marker, half the marker's 22 px box, a marker's reach (its 15 px ring), the viewport inset.
const GAP = 8, HALF = 11, REACH = 8, EDGE = 11;

export function labelSpot(m: Pt, w: number, h: number, r: Box, list: Pt[]): [number, number] {
  const lo = Math.max(HALF - w, r.x + EDGE - m.x), hi = Math.min(-HALF, r.x + r.w - EDGE - w - m.x), c = clamp(-w / 2, lo, hi);
  const spots: [number, number][] = [[GAP, -h / 2], [-GAP - w, -h / 2]];
  for (const dy of [HALF, -HALF - h]) spots.push([c, dy], [hi, dy], [lo, dy]);
  const inside = ([dx, dy]: [number, number]) => m.x + dx >= r.x + EDGE && m.x + dx + w <= r.x + r.w - EDGE && m.y + dy >= r.y && m.y + dy + h <= r.y + r.h;
  const hits = ([dx, dy]: [number, number]) => { let k = 0;
    for (const o of list) if (o !== m && o.on && o.x + REACH > m.x + dx && o.x - REACH < m.x + dx + w && o.y + REACH > m.y + dy && o.y - REACH < m.y + dy + h) k++;
    return k; };
  const fit = spots.filter(inside);
  return fit.length ? fit.reduce((a, b) => hits(b) < hits(a) ? b : a) : [-w / 2, HALF];
}
