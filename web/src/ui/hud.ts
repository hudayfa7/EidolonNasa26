// Globe HUD on the body view (prototype 2138–2169): corner brackets around the globe, readouts left (sub-observer,
// sub-solar, rotation, time rate) and right (the surface point under the cursor), and the longitude tape above.
import * as THREE from 'three';
import { hudLocalTime, subsolar } from '../astro';
import { clamp, D2R, hudElev, hudLL, tapeLabel } from '../coords';
import { PICKABLE } from '../data/bodies';
import { $, setAttr, setClass, setStyle, setText } from '../dom';
import { setReading, TIME, TOUCH } from '../motion';
import { state } from '../router';
import { bodies, facing, localDir } from '../scene/bodies';
import { P, proj, type ScreenPt } from '../scene/frame';
import { cur as pointer, keyed } from '../scene/input';
import { sheet } from '../scene/layout';
import { LAY, VPS, type Rect } from '../scene/rig';

const hudEl = $('#hud'), cursorEl = $('#cursor'), tape = $<HTMLCanvasElement>('#tape'), tg = tape.getContext('2d')!, side = [$('.rl', hudEl), $('.rr', hudEl)];
const out = Object.fromEntries(['obs', 'sun', 'rot', 'rate', 'cur', 'elev', 'lt', 'day', 'hint'].map(k => [k, $(`#h-${k}`)]));
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), P2: ScreenPt = { x: 0, y: 0, z: 0 };
let tapeKey = '', newsKey = '', sideW = [0, 0];
// The box keeps inside the viewport, with room for the tape above it (40 px) and below it for the hint and the status
// bar (a phone shows neither).
const ROOM = { side: 12, top: 46, bottom: 76 };
/** The box's top and bottom on screen while the HUD shows: the graticule's labels keep between them, off the tape above
 *  and the hint below (ui/graticule.ts, drawn after it each frame). */
export const hudBox = { t: 0, b: 0 };

export function hud(R: Rect[], sim: Date) {
  const on = state.view === 'body' && VPS[0].kind === 'sys' && LAY.panel > .6 && !VPS[0].rig.tween, kb = on && keyed();
  setClass(hudEl, 'on', on); setAttr(hudEl, 'aria-hidden', String(!on));   // faded out, it isn't read either
  if (!on) { setClass(cursorEl, 'on', false); newsKey = ''; return; }
  const id = state.body!, o = bodies[id], cam = VPS[0].cam, r = R[0];
  proj(o.home, cam, r, P); proj(_a.copy(o.home).add(_b.set(0, o.r, 0).applyQuaternion(cam.quaternion)), cam, r, P2);
  // Round the globe, clamped to the viewport (zoomed in, the globe outgrows it: the brackets frame what shows).
  const s = Math.hypot(P2.x - P.x, P2.y - P.y) * 2 + 36;
  const x0 = Math.round(Math.max(P.x - s / 2, r.x + ROOM.side)), x1 = Math.round(Math.min(P.x + s / 2, r.x + r.w - ROOM.side));
  const y0 = Math.round(Math.max(P.y - s / 2, r.y + ROOM.top)), y1 = Math.round(Math.max(y0 + 40, Math.min(P.y + s / 2, r.y + r.h - (sheet() ? 8 : ROOM.bottom))));
  hudBox.t = y0; hudBox.b = y1; setStyle(hudEl, 'transform', `translate3d(${x0}px,${y0}px,0)`); setStyle(hudEl, 'width', `${x1 - x0}px`); setStyle(hudEl, 'height', `${y1 - y0}px`);
  const [olat, olon] = facing(o, cam);
  // While the keys drive the globe the cursor is its centre, where Enter pins (scene/input.ts).
  const cur = kb ? { on: true, lat: olat, lon: olon, x: P.x, y: P.y, local: localDir(o.b, olat, olon, _c) } : pointer;
  setClass(cursorEl, 'on', cur.on);
  if (cur.on) setStyle(cursorEl, 'transform', `translate3d(${cur.x}px,${cur.y}px,0)`);
  const [sla, slo] = subsolar(id, sim);
  // Sim time ticking these four over is drift at any rate but Live (the Moon's sub-observer would flash every 1.1 s at
  // ×600, its local time every 3 s): they flash on Live's ticks (24 s or more apart) and on news, the HUD coming on, a
  // body or rate picked, the cursor landing (Decisions 163).
  const nk = `${id}|${TIME.rate}|${cur.on}`, changed = nk !== newsKey, news = changed || TIME.rate === 1; newsKey = nk;
  setReading(out.obs, hudLL(olat, olon, id), news); setReading(out.sun, hudLL(sla, slo, id), news);
  setReading(out.rot, o.b.rot); setReading(out.rate, TIME.rate === 1 ? 'Live' : `×${TIME.rate}`);
  const el = cur.on ? Math.asin(clamp(cur.local.dot(localDir(o.b, sla, slo, _b)), -1, 1)) / D2R : 0;
  setReading(out.cur, cur.on ? hudLL(cur.lat, cur.lon, id, 2) : '-'); setReading(out.elev, cur.on ? hudElev(el) : '-', news);
  setReading(out.day, cur.on ? (el > 0 ? 'Yes' : 'No') : '-'); setReading(out.lt, cur.on ? hudLocalTime(id, cur.lon, sim, slo) : '-', news);
  // Each side's readouts only where they fit beside the box, clear of the panel and the stage's edge (hud.css: 22 px
  // out). Their widths, read when their kind of text changes (the HUD on, a body or rate picked, the cursor on or off);
  // mono figures keep them steady in between.
  if (changed) sideW = side.map(e => e.offsetWidth);
  setClass(side[0], 'off', x0 - 22 - sideW[0] < r.x + 4); setClass(side[1], 'off', x1 + 22 + sideW[1] > r.x + r.w - 4);
  setText(out.hint, kb ? `[ Arrows turn · + − zoom${PICKABLE.includes(id) ? ' · Enter pins the centre' : ''} ]`
    : PICKABLE.includes(id) ? `[ ${TOUCH ? 'Tap' : 'Click'} the surface to pin a site ]` : '[ Select a marker to open an analog site ]');
  // Longitude tape: ticks every 5°, labels every 30°, fading out 60° either side; redrawn only when it moves.
  const key = `${id}|${olon.toFixed(2)}`; if (key === tapeKey) return; tapeKey = key;
  const w = tape.width, h = tape.height, span = 60, px = w / (span * 2);
  tg.clearRect(0, 0, w, h); tg.strokeStyle = 'rgba(231,233,236,.75)'; tg.fillStyle = 'rgba(231,233,236,.85)'; tg.lineWidth = 2;
  tg.font = '20px "Geist Mono", ui-monospace, monospace'; tg.textAlign = 'center';
  for (let d = Math.ceil((olon - span) / 5) * 5; d <= olon + span; d += 5) {
    const x = w / 2 + (d - olon) * px, major = ((d % 30) + 30) % 30 === 0;
    tg.globalAlpha = Math.max(0, 1 - Math.abs(d - olon) / span); tg.beginPath(); tg.moveTo(x, h - 4); tg.lineTo(x, h - (major ? 20 : 11)); tg.stroke();
    if (major) tg.fillText(tapeLabel(d, id), x, h - 26);
  }
  tg.globalAlpha = 1; tg.fillStyle = '#F2885F'; tg.beginPath(); tg.moveTo(w / 2, h - 2); tg.lineTo(w / 2 - 7, h - 12); tg.lineTo(w / 2 + 7, h - 12); tg.fill();
}
