// Profile and measure (plan, Stretch): a line on the site view's map, drawn (a mouse's drag, or a click or tap at each
// end) or typed (its two ends' coordinates), gives its length along the great circle on the body's radius and the
// ground's cross-section along it, from the heights the block and the map are drawn from (profile.ts). The line is
// coral on the map (ui/topomap.ts ruler); the ends, the chart and the facts sit just under the map. On touch a line is
// two taps, never a drag, so a finger on the map still scrolls the sheet (Should 3's gestures keep theirs).
// shortcut: the line isn't in the route (a shared link opens without it); add it to routes.ts if links must carry it.
import { fmtLL, fmtM, localToLL, parseCoord, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { siteOf, type Site } from '../data/sites';
import { $, setHTML } from '../dom';
import { onUpdate, TOUCH } from '../motion';
import { fmtDist, gcKm, onGrid, profile, profileStats, type LL, type Profile } from '../profile';
import { state } from '../router';
import { genTerrain } from '../terrain/procedural';
import { swap } from './panel';
import { fact } from './results';
import { peeked } from './sheet';
import { drawMap, mapAt, mapOf, movable, ruler } from './topomap';

const pin = $('#pin');
const here = () => { const s = state.view === 'site' && siteOf(state.body, state.site ?? undefined); return s ? { id: state.body!, s } : null; };
type Here = NonNullable<ReturnType<typeof here>>;
const lineOf = (id: Body, s: Site) => ruler.on && ruler.at === `${id}|${s.id}` ? ruler : null;
const llOf = (id: Body, p?: LL) => p ? fmtLL(p[0], p[1], id, 4) : '';

// The chart's frame (viewBox units): the heights' labels left of the plot, the ends' under it.
const W = 300, H = 118, X0 = 62, X1 = W - 4, Y0 = 6, Y1 = H - 20;
// The profile on show, for the chart's hover readout.
let shown: { P: Profile; lo: number; hi: number } | null = null;
// The cross-section, its facts and its caveats; `say`, the line in a sentence for the status line (a screen reader's).
function result(id: Body, s: Site) {
  const L = lineOf(id, s); shown = null;
  if (!L?.a || !L.b) return { html: '', say: L?.a ? `A is set: ${TOUCH ? 'tap' : 'click'} the map again for B.` : '' };
  const T = genTerrain(id, s), R = BODIES[id].R, P = profile(T, R, [s.lat, s.lon], L.a, L.b);
  if (P.km < .001) return { html: '', say: SAME, err: true };
  const S = profileStats(P), rise = Math.round(S.rise), up = rise > 0 ? `+${fmtM(rise)}` : fmtM(rise);
  // Flat ground draws a level line mid-plot, not a division by nothing.
  const lo = S.hi - S.lo < 1 ? S.lo - .5 : S.lo, hi = S.hi - S.lo < 1 ? S.hi + .5 : S.hi; shown = { P, lo, hi };
  const x = (d: number) => (X0 + d / P.km * (X1 - X0)).toFixed(1), y = (z: number) => (Y1 - (z - lo) / (hi - lo) * (Y1 - Y0)).toFixed(1);
  const ln = P.d.map((d, i) => `${i ? 'L' : 'M'}${x(d)} ${y(P.z[i])}`).join('');
  // How much taller the chart draws heights than distances; the grid's true spacing, the elevation's own where coarser.
  const vx = (P.km * 1000 / (X1 - X0)) / ((hi - lo) / (Y1 - Y0)), sp = Math.max(T.ext * 1000 / (T.N - 1), T.res ?? 0);
  const say = `${fmtDist(P.km)} from A to B, ${rise ? `${fmtM(Math.abs(rise))} ${rise > 0 ? 'higher' : 'lower'} at B` : 'level at both ends'}`;
  const html = `<figure class="prof"><figcaption><span>Cross-section, A to B</span><output aria-hidden="true"></output></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" data-prof aria-label="${say}; the ground between ${fmtM(S.lo)} and ${fmtM(S.hi)}.">
      <line class="g" x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}"/><line class="g" x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}"/>
      <path class="fill" d="${ln}L${X1} ${Y1}L${X0} ${Y1}Z"/><path class="ln" d="${ln}"/>
      <text x="${X0 - 5}" y="${Y0 + 3}" text-anchor="end">${fmtM(S.hi)}</text><text x="${X0 - 5}" y="${Y1 + 3}" text-anchor="end">${fmtM(S.lo)}</text>
      <text x="${X0}" y="${H - 4}">A</text><text x="${X1}" y="${H - 4}" text-anchor="end">B, ${fmtDist(P.km)}</text>
      <g class="hov" visibility="hidden"><line y1="${Y0}" y2="${Y1}"/><circle r="3"/></g>
    </svg></figure>
    <dl class="facts">${fact('Distance', fmtDist(P.km))}${fact('Rise, A to B', up)}${fact('Climb, descent', `${fmtM(S.climb)}, ${fmtM(S.descent)}`)}${fact('Steepest grade', `${S.steep.toFixed(1)}°`)}</dl>
    <p class="fine">Distance along the great circle on ${BODIES[id].name}’s ${R.toLocaleString('en-GB')} km radius. Heights from the block’s own grid, ${fmtM(sp)} apart, so the grade is over that spacing; the chart draws them at ${vx < 10 ? vx.toFixed(1) : Math.round(vx).toLocaleString('en-GB')}× the scale of distances.${T.src ? '' : ' The terrain here is illustrative, and so is its profile.'}</p>`;
  return { html, say: `${say}.` };
}
// Under the map: its caption (what a click does while measuring; a touch screen has no hover, its readout only flashes
// as a finger lands), the switch, then the ends, the status line and the result.
function inner(id: Body, s: Site) {
  const cap = ruler.on ? (TOUCH ? 'Tap the map at each end of a line.' : 'Hover the map for coordinates and elevation. Drag across it, or click at each end, to draw a line.')
    : TOUCH ? (movable(id, s) ? 'Tap the map to move the pin.' : '') : `Hover the map for coordinates and elevation.${movable(id, s) ? ' Click to move the pin.' : ''}`;
  // Off, a single line: the caption becomes the switch's tooltip, so the doubles below the map stay high in the panel.
  const head = `${ruler.on && cap ? `<p class="mcap">${cap}</p>` : ''}<label class="ck"${!ruler.on && cap ? ` title="${cap}"` : ''}><input type="checkbox" id="ms-on"${ruler.on ? ' checked' : ''}>Measure a line on the map</label>`;
  if (!ruler.on) return head;
  // Each field's placeholder gives the format by example, as the coordinate field's does: A the map's centre, B a quarter
  // of its square east of it.
  const L = lineOf(id, s), r = result(id, s), [el, eo] = localToLL(BODIES[id].R, s.lat, s.lon, genTerrain(id, s).ext / 4, 0);
  const field = (k: string, p: LL | undefined, ex: string) => `<input id="ms-${k}" value="${llOf(id, p)}" placeholder="${ex}" aria-describedby="ms-msg" spellcheck="false" autocomplete="off">`;
  return `${head}<form class="mform" data-msform novalidate>
    <label class="fl" for="ms-a">From (A)</label><div class="cfield">${field('a', L?.a, fmtLL(s.lat, s.lon, id, 2))}</div>
    <label class="fl" for="ms-b">To (B)</label><div class="cfield">${field('b', L?.b, fmtLL(el, eo, id, 2))}<button class="btn" id="ms-go">Measure</button></div>
    <p class="${cls(r)}" id="ms-msg" aria-live="polite">${r.say || HELP}</p></form><div data-msr>${r.html}</div>`;
}
const HELP = 'Or type the coordinates of both ends<span class="kb"> and press Enter</span>.', SAME = 'A and B are the same point: put B somewhere else.';
const cls = (r: { say: string; err?: boolean }) => `cmsg${r.err ? ' err' : r.say ? ' ok' : ''}`;
/** The site panel's map caption and measure (ui/panel.ts siteMedia), just under the map. */
export const measureHTML = (id: Body, s: Site) => `<div class="meas" data-meas>${inner(id, s)}</div>`;

// The line changed: the map redrawn, the ends, status line and result in place (the status line keeps its node, so a
// screen reader says the new line).
function update({ id, s }: Here) {
  const cv = pin.querySelector<HTMLCanvasElement>('canvas[data-map]'); if (cv) drawMap(cv, id, s);
  const L = lineOf(id, s), msg = pin.querySelector<HTMLElement>('#ms-msg'); if (!msg) return;
  for (const [k, p] of [['a', L?.a], ['b', L?.b]] as const) { const el = $<HTMLInputElement>(`#ms-${k}`, pin); el.value = llOf(id, p); el.removeAttribute('aria-invalid'); }
  const r = result(id, s); msg.className = cls(r); msg.innerHTML = r.say || HELP; setHTML($('[data-msr]', pin), r.html);
}
/** The result again, from the site's terrain as it is now (a pin's, rebuilt when its world's height map lands late: app.ts onAsset). */
export function redoMeasure() { const h = here(); if (h && lineOf(h.id, h.s)?.b && pin.querySelector('#ms-msg')) update(h); }

pin.addEventListener('change', e => {
  const h = here(); if ((e.target as HTMLElement).id !== 'ms-on' || !h) return;
  ruler.on = (e.target as HTMLInputElement).checked; swap($('[data-meas]', pin), inner(h.id, h.s));
  const cv = pin.querySelector<HTMLCanvasElement>('canvas[data-map]'); if (cv) drawMap(cv, h.id, h.s);
});
// A mouse draws by dragging (A where it went down, B following it, the map redrawn once a frame); a click, or a tap,
// puts down A, then B, then starts again. The map's click-to-move waits while measuring (ui/topomap.ts).
let drag: { x: number; y: number; on: boolean } | null = null, dragged = false, dirty = false;
const put = (h: Here, k: 'a' | 'b', p: { lat: number; lon: number }) => { ruler.at = `${h.id}|${h.s.id}`; ruler[k] = [p.lat, p.lon]; };
pin.addEventListener('pointerdown', e => {
  dragged = false; const cv = mapOf(e);
  if (cv && ruler.on && here() && e.pointerType === 'mouse' && e.button === 0) { drag = { x: e.clientX, y: e.clientY, on: false }; cv.setPointerCapture(e.pointerId); }
});
pin.addEventListener('pointermove', e => {
  const cv = mapOf(e), h = here(); if (!drag || !cv || !h || (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4)) return;
  if (!drag.on) { drag.on = true; put(h, 'a', mapAt(cv, { clientX: drag.x, clientY: drag.y })!); }
  put(h, 'b', mapAt(cv, e)!); dirty = true;
});
onUpdate(() => { if (!dirty) return; dirty = false; const h = here(), cv = pin.querySelector<HTMLCanvasElement>('canvas[data-map]'); if (h && cv) drawMap(cv, h.id, h.s); });
const end = () => { dragged = !!drag?.on; drag = null; const h = here(); if (dragged && h) update(h); };
pin.addEventListener('pointerup', end); pin.addEventListener('pointercancel', end);
pin.addEventListener('click', e => {
  const cv = mapOf(e), h = here(); if (!cv || !ruler.on || !h) return;
  if (dragged) { dragged = false; return; }   // the click that ends a drag
  const m = mapAt(cv, e)!, L = lineOf(h.id, h.s);
  if (L?.a && !L.b) put(h, 'b', m); else { put(h, 'a', m); ruler.b = undefined; }
  update(h);
});
// Typed: both ends parsed as the coordinate field parses (coords.ts), each inside the map's square, whose heights the
// profile reads; what is wrong is said and marked on its field, which takes the focus.
pin.addEventListener('submit', e => {
  if (!(e.target as Element).closest('[data-msform]')) return;
  e.preventDefault(); const h = here(); if (!h) return;
  const T = genTerrain(h.id, h.s), ends: LL[] = [];
  for (const k of ['a', 'b'] as const) {
    const el = $<HTMLInputElement>(`#ms-${k}`, pin), r = parseCoord(el.value), name = k.toUpperCase();
    const err = 'empty' in r ? `Enter ${name}’s coordinates.` : 'err' in r ? `${name}: ${r.err}`
      : !onGrid(T, BODIES[h.id].R, [h.s.lat, h.s.lon], [r.lat, r.lon]) ? `${name} is outside the map’s ${T.ext} × ${T.ext} km square.`
      : ends.length && gcKm(BODIES[h.id].R, ends[0], [r.lat, r.lon]) < .001 ? SAME : '';
    if (err || !('lat' in r)) { el.setAttribute('aria-invalid', 'true'); el.focus(); const m = $('#ms-msg', pin); m.className = 'cmsg err'; m.textContent = err; return; }
    el.removeAttribute('aria-invalid'); ends.push([r.lat, r.lon]);
  }
  ruler.at = `${h.id}|${h.s.id}`; [ruler.a, ruler.b] = ends; update(h);
  if (!peeked()) $('#ms-msg', pin).scrollIntoView({ block: 'nearest' });   // the line in a sentence, under the field (on a phone, the sheet)
});
// Escape in an end's field leaves the field, not the view (as in the coordinate field).
pin.addEventListener('keydown', e => {
  const t = e.target as HTMLElement; if (e.key !== 'Escape' || !t.matches('#ms-a, #ms-b')) return;
  e.stopPropagation(); if (!e.isComposing) t.blur();
});
// The chart's readout: the point nearest the pointer, its distance from A and its height (a tap shows it on touch, and
// it stays till the next: a lifted finger's pointerout isn't a leaving).
const readAt = (e: PointerEvent) => {
  const sv = (e.target as Element).closest?.<SVGSVGElement>('svg[data-prof]'); if (!sv || !shown) return;
  const { P, lo, hi } = shown, b = sv.getBoundingClientRect(), f = Math.min(1, Math.max(0, ((e.clientX - b.left) / b.width * W - X0) / (X1 - X0)));
  const i = Math.round(f * (P.d.length - 1)), x = X0 + P.d[i] / P.km * (X1 - X0), y = Y1 - (P.z[i] - lo) / (hi - lo) * (Y1 - Y0), g = sv.querySelector('.hov')!;
  g.setAttribute('visibility', 'visible'); g.querySelector('line')!.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
  g.querySelector('circle')!.setAttribute('cx', x.toFixed(1)); g.querySelector('circle')!.setAttribute('cy', y.toFixed(1));
  sv.parentElement!.querySelector('output')!.textContent = `${fmtDist(P.d[i])} · ${fmtM(P.z[i])}`;
};
pin.addEventListener('pointermove', readAt); pin.addEventListener('pointerdown', readAt);
pin.addEventListener('pointerout', e => {
  if (e.pointerType !== 'mouse') return;
  const sv = (e.target as Element).closest?.('svg[data-prof]'); if (!sv || sv.contains(e.relatedTarget as Node)) return;
  sv.querySelector('.hov')!.setAttribute('visibility', 'hidden'); sv.parentElement!.querySelector('output')!.textContent = '';
});
