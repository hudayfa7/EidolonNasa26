// Coordinate entry (prototype 1760–1813; the site map readout is in ui/topomap.ts). On the body view, typing
// previews the point (the globe turns there after a pause) and Enter or Open pins it; on a site, Enter moves the pin
// and Copy copies the coordinates. Every delay runs on GSAP's clock, so ?capture seeks drive it.
import gsap from 'gsap';
import { DATUM, fmtDMS, fmtLL, parseCoord, pinId, wrap180 } from '../coords';
import { siteOf } from '../data/sites';
import { $, copyText } from '../dom';
import { MOTION, RM } from '../motion';
import { go, state } from '../router';
import { bodies } from '../scene/bodies';
import { stopInertia } from '../scene/input';
import { orientToLL, unhold } from '../scene/orient';
import { VPS } from '../scene/rig';
import { gotoHelp } from './panel';

type LL = { lat: number; lon: number };
let preview: LL | null = null, previewAt = 0, pending: gsap.core.Tween | null = null;
/** The previewed point while typing on the body view (ui/graticule.ts draws its pin). */
export const getPreview = () => preview;
// Every route change drops the preview and any pending turn or pin.
export function resetPreview() { pending?.kill(); pending = null; preview = null; }

const pin = $('#pin'), ppinLabel = $('#ppin span');
const now = () => gsap.globalTimeline.time();   // the clock gsap.delayedCall runs on
const same = (a: LL | null, b: LL) => !!a && Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7;

function setPreview(p: LL | null) {
  if (p && same(preview, p)) return;
  preview = p;
  if (!p) { if (state.view === 'body') unhold(bodies[state.body!]); return; }
  stopInertia(); orientToLL(state.body!, p.lat, p.lon, VPS[0], MOTION.previewTurn); previewAt = now();
  ppinLabel.textContent = fmtLL(p.lat, p.lon, state.body!, 4);
}
const openPin = (p: LL) => go(`${state.body}/${pinId(p.lat, p.lon)}`);

function coordInput(el: HTMLInputElement, commit: boolean) {
  const r = parseCoord(el.value), msg = $('#cmsg'), open = pin.querySelector<HTMLButtonElement>('[data-open]'), site = el.dataset.mode === 'site', id = state.body!;
  el.setAttribute('aria-invalid', String('err' in r));
  if (open) open.disabled = !('lat' in r);
  pending?.kill(); pending = null;   // before the empty/err returns: a queued preview or pin of the last valid text must not land
  if ('empty' in r) { msg.className = 'cmsg'; if (!site) { msg.innerHTML = gotoHelp(id); setPreview(null); } return; }
  if ('err' in r) { msg.className = 'cmsg err'; msg.textContent = r.err; if (!site) setPreview(null); return; }
  msg.className = 'cmsg ok';
  msg.innerHTML = `${fmtLL(r.lat, r.lon, id, 4)}<br>${fmtDMS(r.lat, r.lon, id)} · ${DATUM[id]}`;
  if (site) {
    const s = siteOf(id, state.site ?? undefined);
    if (!commit || !s || (Math.abs(r.lat - s.lat) < 1e-6 && Math.abs(wrap180(r.lon - s.lon)) < 1e-6)) return;
    return openPin(r);
  }
  if (commit) {
    // Pin once the globe has finished turning to the point (the turn plus 50 ms).
    const turn = MOTION.previewTurn + .05, wait = same(preview, r) ? Math.max(0, turn - (now() - previewAt)) : turn;
    setPreview(r); pending = gsap.delayedCall(RM ? 0 : wait, () => { if (state.view === 'body') openPin(r); });
  } else pending = gsap.delayedCall(MOTION.previewPause, () => { if (state.view === 'body') setPreview(r); });
}

pin.addEventListener('input', e => { const t = e.target as HTMLInputElement; if (t.id === 'cin') coordInput(t, false); });
pin.addEventListener('keydown', e => {
  const t = e.target as HTMLInputElement; if (t.id !== 'cin') return;
  if (e.key === 'Enter') { e.preventDefault(); coordInput(t, true); }
  if (e.key === 'Escape') {
    e.stopPropagation();   // Escape here clears the field; it doesn't leave the view
    if (t.dataset.mode === 'goto' && t.value) { t.value = ''; coordInput(t, false); } else t.blur();
  }
});
pin.addEventListener('click', e => {
  const t = e.target as Element, el = pin.querySelector<HTMLInputElement>('#cin');
  if (t.closest('[data-open]')) { if (el) coordInput(el, true); return; }
  const cb = t.closest<HTMLButtonElement>('[data-copy]'), s = cb && siteOf(state.body, state.site ?? undefined); if (!cb || !s) return;
  const done = () => { cb.textContent = 'Copied'; gsap.delayedCall(1.4, () => { cb.textContent = 'Copy'; }); };
  copyText(fmtLL(s.lat, s.lon, state.body!, 4)).then(ok => ok ? done() : el?.select());
});
