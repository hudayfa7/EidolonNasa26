// Graticule labels on the body view's globe (prototype 1834–1865): longitudes along a parallel just below the centre,
// latitudes along a meridian just left of it, every 30° (10° zoomed in); plus the coordinate preview pin.
import * as THREE from 'three';
import { clamp, latTick, lonStride, lonTick } from '../coords';
import { $, setClass, setStyle, setText } from '../dom';
import { state } from '../router';
import { bodies, facing, localDir, type BodyObj } from '../scene/bodies';
import { P, proj } from '../scene/frame';
import { W } from '../scene/layout';
import { LAY, VPS, type Rect } from '../scene/rig';
import { getPreview } from './coord-entry';
import { hudBox } from './hud';
import { onMarker } from './markers';

const gratEl = $('#grat'), ppin = $('#ppin'), chipEl = $('span', ppin);
const GRATS = [...Array(64)].map(() => { const sp = document.createElement('span'); setStyle(sp, 'visibility', 'hidden'); gratEl.appendChild(sp); return sp; });
/** Graticule step in degrees; the planet shader draws the 10° grid at the same zoom (scene/frame.ts). */
export const gratStep = () => VPS[0].rig.zoom < .62 ? 10 : 30;
const _b = new THREE.Vector3(), _c = new THREE.Vector3(), _w = new THREE.Vector3();
// The preview chip's box while it shows (graticule labels under it hide); its width is measured when its text changes.
const chip = { on: false, l: 0, r: 0, t: 0, b: 0 };
let chipTxt = '', chipW = 0;

// Label n at (lat, lon) if it sits well on the near side; returns the next free label index.
function put(n: number, o: BodyObj, cam: THREE.Camera, r: Rect, lat: number, lon: number, txt: string, dx: number, dy: number) {
  if (n >= GRATS.length) return n;
  const w = o.spin.localToWorld(localDir(o.b, lat, lon, _w)), nrm = _b.copy(w).sub(o.home).normalize();
  if (nrm.dot(_c.copy(cam.position).sub(w).normalize()) < .38) return n;
  proj(w, cam, r, P); const x = P.x + dx, y = P.y + dy, el = GRATS[n];
  // One collision pass: a label under the preview chip or on a site marker (or its label) gives way to it.
  // shortcut: label box from a fixed advance (Geist 10 px, .03em tracking: at most 6 px a character); measure if the font changes
  // And inside the viewport, within the HUD's box (it shows with the labels: hud.ts), so clear of the tape, the hint and the
  // status bar: zoomed in, the outer rings ran under the top bar and onto the hint.
  const lw = txt.length * 6.3;
  if (x < r.x + 4 || x + lw > r.x + r.w - 4 || y < hudBox.t || y + 10 > hudBox.b) return n;
  if ((chip.on && x < chip.r && x + lw > chip.l && y < chip.b && y + 10 > chip.t) || onMarker(x, y, lw, 10)) return n;
  setText(el, txt); setStyle(el, 'visibility', 'inherit');   // inherit: hidden with #ui under a full sheet (chrome.ts)
  setStyle(el, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`);
  return n + 1;
}

export function gratLabels(R: Rect[]) {
  previewPin(R);
  const on = state.view === 'body' && VPS[0].kind === 'sys' && LAY.panel > .6 && !VPS[0].rig.tween;
  let n = 0;
  if (on) {
    const o = bodies[state.body!], b = o.b, cam = VPS[0].cam, r = R[0], step = gratStep(), id = state.body!;
    const [olat, olon] = facing(o, cam);
    const rowLat = clamp(Math.round((olat - step * .5) / step) * step, -90 + step, 90 - step);
    const colLon = Math.round((olon - step * .5) / step) * step;
    o.spin.updateMatrixWorld(true);
    // Meridian labels thin out where their parallel is small on screen (round a pole).
    proj(o.spin.localToWorld(localDir(b, rowLat, colLon, _w)), cam, r, P); const x0 = P.x, y0 = P.y;
    proj(o.spin.localToWorld(localDir(b, rowLat, colLon + step, _w)), cam, r, P);
    const k = lonStride(Math.hypot(P.x - x0, P.y - y0), step);
    if (k) for (let lon = 0; lon < 360; lon += step * k) n = put(n, o, cam, r, rowLat, lon, lonTick(lon, id), 4, 4);
    for (let lat = -90 + step; lat < 90; lat += step) if (lat !== rowLat) n = put(n, o, cam, r, lat, colLon, latTick(lat), 4, -13);
  }
  for (let i = n; i < GRATS.length; i++) setStyle(GRATS[i], 'visibility', 'hidden');
}

// The coordinate preview pin; its chip flips to the pin's left when it would end within 16 px of the stage's edge.
function previewPin(R: Rect[]) {
  const p = getPreview(); chip.on = false;
  if (!(state.view === 'body' && p && VPS[0].kind === 'sys')) { setClass(ppin, 'on', false); return; }
  const o = bodies[state.body!], cam = VPS[0].cam; o.spin.updateMatrixWorld(true);
  const w = o.spin.localToWorld(localDir(o.b, p.lat, p.lon, _w)), facing = _b.copy(w).sub(o.home).normalize().dot(_c.copy(cam.position).sub(w).normalize()) > .05;
  proj(w, cam, R[0], P); setStyle(ppin, 'transform', `translate3d(${P.x.toFixed(1)}px,${P.y.toFixed(1)}px,0)`); setClass(ppin, 'on', facing);
  if (chipEl.textContent !== chipTxt) { chipTxt = chipEl.textContent!; chipW = chipEl.offsetWidth; }
  const left = P.x + 24 + chipW > W - 16; setClass(ppin, 'left', left);
  chip.on = facing; chip.l = left ? P.x - 24 - chipW : P.x + 24; chip.r = chip.l + chipW; chip.t = P.y - 11; chip.b = P.y + 12;
}
