// The site panel's topographic map and orbital crops (prototype 1108–1178), and the map readout with click-to-move
// (1814–1833), and the measured line and landing ellipse drawn on it (ui/measure.ts, ui/ellipse.ts). Maps, edge labels, readout, line and crops all use the
// site's local azimuthal-equidistant projection (coords.ts), so polar sites keep their true size and their footprint
// stays centred.
import { clamp, D2R, fmtM, latStr, llToLocal, localToLL, lon360, lonStr, pinId, type Body } from '../coords';
import { BODIES, PICKABLE } from '../data/bodies';
import { centreOf, terrainOf } from '../data/client';
import { siteOf, type Site } from '../data/sites';
import { landing, missionOf, ringed } from '../ellipse';
import { fmtDist, gcAt, gcKm, type LL } from '../profile';
import { go, state } from '../router';
import { token } from '../scene/layout';
import { image, sharpest } from '../scene/renderer';
import { contourSegs, hazard, ramp, slopeOf, sunENU, sunOf, TWIN_AZ, type Sun } from '../terrain/mesh';
import { genTerrain, STEEP, type Terrain } from '../terrain/procedural';

const hexRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// Per terrain object, so a pin's terrain regenerated after a late texture (or an engine window landed) gets a new map;
// and per light (terrain/mesh.ts sunOf) and slope hazard, which the block shares.
const mapCache = new WeakMap<Terrain, { k: string; c: HTMLCanvasElement }>();
// A site's own terrain, or (compare's minis) its 18.8 km window as compare shows it, and where that is centred.
const terrOf = (b: Body, s: Site, win: boolean) => win ? terrainOf(b, s).T : genTerrain(b, s);
const midOf = (b: Body, s: Site, win: boolean) => win ? centreOf(b, s) : s;
/** The measured line (ui/measure.ts): drawn while on, on the site it was drawn on (`body|id`); B unset while A waits. */
export const ruler: { on: boolean; at: string; a?: LL; b?: LL } = { on: false, at: '' };
/** Whether a click on a site's map moves its pin: a pin's, not a named target's (that would drop its name). */
export const movable = (b: Body, s: Site) => !!s.custom && !s.iau && PICKABLE.includes(b);
// A site's map: its own extent, or the compare window (`win`).
export function drawMap(cv: HTMLCanvasElement, bodyId: Body, site: Site, win = false) {
  const T = terrOf(bodyId, site, win), N = T.N, S = cv.width, g = cv.getContext('2d')!, sun: Sun = win ? { az: TWIN_AZ } : sunOf(bodyId, site, T), haz = hazard.on, key = `${sun.az}|${sun.alt}|${haz}`;
  let off = mapCache.get(T)?.k === key ? mapCache.get(T)!.c : null;
  if (!off) {
    off = document.createElement('canvas'); off.width = off.height = N; const og = off.getContext('2d')!, img = og.createImageData(N, N), pal = ramp(T.pal).map(hexRgb);
    // Lit as the block is (terrain/mesh.ts: the site's sun and its shadows, compare's TWIN_AZ); the map keeps its own mild
    // relief (2.5×), so its contours read. Under a set sun, the ground tips away from the centre over the body's curve
    // by its offset over R (true, unexaggerated), as the block's shader has it.
    const cell = T.ext * 1000 / (N - 1), [Le, Lu, Ln] = sunENU(sun.az, sun.alt), c = (N - 1) / 2, tq = sun.R ? cell / (sun.R * 1000) : 0;
    const sl = haz ? slopeOf(T) : null, cor = hexRgb(token('--coral'));   // the slope hazard, as the block's shader has it
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const e = T.z[j * N + i], t = clamp((e - T.min) / T.relief, 0, 1);
      const seg = t < .33 ? 0 : t < .66 ? 1 : 2, f = seg === 0 ? t / .33 : seg === 1 ? (t - .33) / .33 : (t - .66) / .34;
      const c0 = pal[seg], c1 = pal[seg + 1];
      const gx = (T.z[j * N + Math.min(i + 1, N - 1)] - T.z[j * N + Math.max(i - 1, 0)]) / (2 * cell) * 2.5 - (i - c) * tq;
      const gy = (T.z[Math.max(j - 1, 0) * N + i] - T.z[Math.min(j + 1, N - 1) * N + i]) / (2 * cell) * 2.5 - (c - j) * tq;
      const nl = Math.hypot(gx, gy, 1), hs = clamp((-gx * Le - gy * Ln + Lu) / nl, 0, 1) * (sun.lit ? sun.lit[j * N + i] : 1), sh = .35 + .8 * hs;
      const water = T.wet ? T.wet[j * N + i] === 1 : e < T.lake, o = (j * N + i) * 4;
      img.data[o] = water ? 40 + 30 * hs : (c0[0] + (c1[0] - c0[0]) * f) * sh; img.data[o + 1] = water ? 70 + 40 * hs : (c0[1] + (c1[1] - c0[1]) * f) * sh;
      img.data[o + 2] = water ? 92 + 40 * hs : (c0[2] + (c1[2] - c0[2]) * f) * sh; img.data[o + 3] = 255;
      if (sl && !water) {
        const y = .299 * img.data[o] + .587 * img.data[o + 1] + .114 * img.data[o + 2], k = sl[j * N + i] > STEEP ? .85 : 0;
        for (let ch = 0; ch < 3; ch++) { const g = y + (img.data[o + ch] - y) * .25; img.data[o + ch] = g + (cor[ch] * (.55 + .55 * hs) - g) * k; }
      }
    }
    og.putImageData(img, 0, 0); mapCache.set(T, { k: key, c: off });
  }
  g.imageSmoothingQuality = 'high'; g.drawImage(off, 0, 0, S, S);
  const k = S / (N - 1);
  const levels = []; for (let lv = Math.ceil(T.min / T.minor) * T.minor; lv <= T.max; lv += T.minor) levels.push(lv);
  for (const lv of levels) {
    const major = Math.abs(lv / T.major - Math.round(lv / T.major)) < 1e-6, seg = contourSegs(T.z, N, lv);
    g.strokeStyle = major ? 'rgba(10,8,6,.62)' : 'rgba(10,8,6,.3)'; g.lineWidth = major ? S / 420 : S / 700; g.beginPath();
    for (let n = 0; n < seg.length; n += 2) { g.moveTo(seg[n][0] * k, seg[n][1] * k); g.lineTo(seg[n + 1][0] * k, seg[n + 1][1] * k); }
    g.stroke();
  }
  // The landing ellipse round the centre (ui/ellipse.ts; the site view's map only), at its true size: coral on a dark
  // casing as the measured line, pale over the slope hazard's coral; under the map's labels. Too small to see (a dot), a
  // ring 22 u across marks it too, clear of the crosshair's ring (as the block's shader).
  const u = S / 320;
  if (landing.on && !win) {
    const m = missionOf(bodyId), k = S / T.ext / 2, ring = ringed(m, T.ext);
    for (const [w, col] of [[5 * u, 'rgba(6,7,10,.75)'], [2 * u, haz ? '#FFE3D2' : token('--coral')]] as const) {
      g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.ellipse(S / 2, S / 2, m.a * k, m.b * k, (landing.az - 90) * D2R, 0, Math.PI * 2);
      if (ring) { g.moveTo(S / 2 + 11 * u, S / 2); g.arc(S / 2, S / 2, 11 * u, 0, Math.PI * 2); }
      g.stroke();
    }
  }
  // Frame ticks, crosshair, scale bar, north
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.fillStyle = '#fff'; g.lineWidth = 1.2 * u;
  for (let q = 1; q < 4; q++) { const p = S * q / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 6 * u); g.moveTo(p, S); g.lineTo(p, S - 6 * u); g.moveTo(0, p); g.lineTo(6 * u, p); g.moveTo(S, p); g.lineTo(S - 6 * u, p); g.stroke(); }
  const cx = S / 2; g.beginPath(); g.arc(cx, cx, 7 * u, 0, Math.PI * 2); g.moveTo(cx - 14 * u, cx); g.lineTo(cx - 4 * u, cx); g.moveTo(cx + 4 * u, cx); g.lineTo(cx + 14 * u, cx); g.moveTo(cx, cx - 14 * u); g.lineTo(cx, cx - 4 * u); g.moveTo(cx, cx + 4 * u); g.lineTo(cx, cx + 14 * u); g.stroke();
  const barKm = [1, 2, 5, 10, 20, 25, 50].find(x => x >= T.ext / 5) || 50, bw = barKm / T.ext * S;
  g.fillStyle = 'rgba(6,7,10,.7)'; g.fillRect(10 * u, S - 30 * u, bw + 50 * u, 20 * u);
  g.fillStyle = '#fff'; g.fillRect(16 * u, S - 18 * u, bw, 2.5 * u); g.font = `${10 * u}px Geist, system-ui, sans-serif`; g.textBaseline = 'middle'; g.fillText(`${barKm} km`, 22 * u + bw, S - 17 * u);
  g.textAlign = 'center'; g.fillText('N', S - 16 * u, 18 * u); g.beginPath(); g.moveTo(S - 16 * u, 26 * u); g.lineTo(S - 20 * u, 36 * u); g.lineTo(S - 12 * u, 36 * u); g.closePath(); g.fill(); g.textAlign = 'left';
  const ext = `${T.ext} × ${T.ext} km`, ew = g.measureText(ext).width + 12 * u;   // sized to its text, as chip() below
  g.fillStyle = 'rgba(6,7,10,.7)'; g.fillRect(10 * u, 10 * u, ew, 20 * u); g.fillStyle = '#fff'; g.fillText(ext, 16 * u, 20 * u);
  // Edge coordinates: the midpoint of each edge, half the extent from the centre along its own bearing.
  const half = T.ext / 2, c = midOf(bodyId, site, win), at = (x: number, y: number) => localToLL(BODIES[bodyId].R, c.lat, c.lon, x, y);
  // What the map's labels cover (x, y, w, h): the extent, the scale bar, north and each chip, for the line's length to clear.
  const boxes = [[10 * u, 10 * u, ew, 20 * u], [10 * u, S - 30 * u, bw + 50 * u, 20 * u], [S - 24 * u, 8 * u, 16 * u, 30 * u]];
  const chip = (txt: string, x: number, y: number, al: 'c' | 'l' | 'r') => {
    g.font = `${9.5 * u}px Geist, system-ui, sans-serif`; const w = g.measureText(txt).width + 10 * u, h = 17 * u;
    const x0 = al === 'c' ? x - w / 2 : al === 'r' ? x - w : x; boxes.push([x0, y - h / 2, w, h]); g.fillStyle = 'rgba(6,7,10,.72)'; g.fillRect(x0, y - h / 2, w, h);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.textAlign = 'left'; g.fillText(txt, x0 + 5 * u, y + .5 * u);
  };
  chip(latStr(at(0, half)[0], 2), S / 2, 12 * u, 'c'); chip(latStr(at(0, -half)[0], 2), S - 4 * u, S - 14 * u, 'r');
  chip(lonStr(at(-half, 0)[1], 2, bodyId), 4 * u, S / 2 - 22 * u, 'l'); chip(lonStr(at(half, 0)[1], 2, bodyId), S - 4 * u, S / 2 - 22 * u, 'r');
  // The measured line along its great circle, coral on a dark casing (pale over the slope hazard's coral), its ends
  // lettered and its length by B (the site view's map only).
  const { a, b } = ruler; if (win || !ruler.on || ruler.at !== `${bodyId}|${site.id}` || !a) return;
  const pts = Array.from({ length: 49 }, (_, i) => { const [x, y] = llToLocal(BODIES[bodyId].R, c.lat, c.lon, ...gcAt(a, b ?? a, i / 48)); return [(x / T.ext + .5) * S, (.5 - y / T.ext) * S]; });
  const coral = token('--coral'), dark = 'rgba(6,7,10,.75)'; g.lineCap = g.lineJoin = 'round';
  if (b) for (const [w, col] of [[5 * u, dark], [2 * u, haz ? '#FFE3D2' : coral]] as const) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); for (const [x, y] of pts) g.lineTo(x, y); g.stroke(); }
  g.font = `600 ${9 * u}px Geist, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [[x, y], t] of b ? [[pts[0], 'A'], [pts[48], 'B']] as const : [[pts[0], 'A']] as const) {
    g.beginPath(); g.arc(x, y, 7 * u, 0, Math.PI * 2); g.fillStyle = coral; g.fill(); g.lineWidth = 1.5 * u; g.strokeStyle = dark; g.stroke();
    g.fillStyle = '#0B0C0E'; g.fillText(t, x, y + .5 * u);
  }
  g.textAlign = 'left'; if (!b) return;
  // Beside B away from A, over or under it away from A, then the other two (over the line's end): the first spot inside
  // the map and clear of its labels.
  const t = fmtDist(gcKm(BODIES[bodyId].R, a, b)), [ax, ay] = pts[0], [bx, by] = pts[48], d = 11 * u, h = 17 * u; g.font = `${9.5 * u}px Geist, system-ui, sans-serif`;
  const w = g.measureText(t).width + 10 * u, R = [bx + d, by - h / 2], L = [bx - d - w, by - h / 2], U = [bx - w / 2, by - d - h], D = [bx - w / 2, by + d];
  const spots = [ax <= bx ? R : L, ay >= by ? U : D, ay >= by ? D : U, ax <= bx ? L : R];
  const m = 3 * u, clear = ([x, y]: number[]) => x >= m && y >= m && x + w <= S - m && y + h <= S - m && !boxes.some(([X, Y, W, H]) => x < X + W + m && X < x + w + m && y < Y + H + m && Y < y + h + m);
  const [x, y] = spots.find(clear) ?? spots[0]; chip(t, x, y + h / 2, 'l');
}

// An orbital crop km wide around (lat, lon), with the site's footprint (foot km) outlined in the middle: the image cut
// for it (`url`, scripts/fetch-real-data.mjs, drawn when it lands), else resampled pixel by pixel from the body's colour
// map in the site's local projection, once its full map is in (the 1024 px low tier is a smear at these widths: the
// empty frame shows till then, as for an image still loading). One pending draw per image (the latest canvas asking),
// run when it loads or fails.
const crops = new Map<string, HTMLImageElement>(), pending = new WeakMap<HTMLImageElement, () => void>();
export function drawCrop(cv: HTMLCanvasElement, bodyId: Body, lat: number, lon: number, km: number, foot: number, url?: string) {
  const g = cv.getContext('2d')!, S = cv.width, outline = () => {
    const fs = foot / km * S; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1, S / 160); g.strokeRect(S / 2 - fs / 2, S / 2 - fs / 2, Math.max(fs, 3), Math.max(fs, 3));
  };
  if (url) {
    let im = crops.get(url);
    if (!im) { const i = im = new Image(); i.onload = i.onerror = () => pending.get(i)?.(); i.src = url; crops.set(url, i); }
    if (im.complete && im.naturalWidth) { g.drawImage(im, 0, 0, S, S); outline(); return; }
    if (!im.complete) { pending.set(im, () => drawCrop(cv, bodyId, lat, lon, km, foot, url)); return; }   // failed: complete, no width, so the cut below
  }
  const b = BODIES[bodyId], img = image(b.tex);
  if (!img?.width || !sharpest(b.tex)) return;
  const W = img.width, H = img.height, half = km / 2;
  // Only the rows the crop can reach (its corners lie half·√2 away), full width: a polar crop wraps every longitude.
  const reach = half * Math.SQRT2 / b.R / D2R;
  const y0 = Math.max(0, Math.floor((90 - Math.min(90, lat + reach)) / 180 * H) - 1), y1 = Math.min(H, Math.ceil((90 - Math.max(-90, lat - reach)) / 180 * H) + 2), bh = y1 - y0;
  const band = document.createElement('canvas'); band.width = W; band.height = bh;
  const bg = band.getContext('2d', { willReadFrequently: true })!; bg.drawImage(img, 0, y0, W, bh, 0, 0, W, bh);
  const src = bg.getImageData(0, 0, W, bh).data, out = g.createImageData(S, S), d = out.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const [la, lo] = localToLL(b.R, lat, lon, ((i + .5) / S * 2 - 1) * half, (1 - (j + .5) / S * 2) * half);
    const x = lon360(lo - b.lon0) / 360 * W - .5, y = clamp((90 - la) / 180 * H - .5 - y0, 0, bh - 1.001);
    const xf = Math.floor(x), yf = Math.floor(y), fx = x - xf, fy = y - yf, X0 = ((xf % W) + W) % W, X1 = (X0 + 1) % W;
    const a = (yf * W + X0) * 4, c = (yf * W + X1) * 4, e = ((yf + 1) * W + X0) * 4, f = ((yf + 1) * W + X1) * 4, o = (j * S + i) * 4;
    for (let ch = 0; ch < 3; ch++) d[o + ch] = (src[a + ch] * (1 - fx) + src[c + ch] * fx) * (1 - fy) + (src[e + ch] * (1 - fx) + src[f + ch] * fx) * fy;
    d[o + 3] = 255;
  }
  g.putImageData(out, 0, 0); outline();
}

/* ---------- Map readout: coordinates and elevation under the cursor; a click moves a pin ---------- */
const pin = document.querySelector<HTMLElement>('#pin')!;
export function mapAt(cv: HTMLCanvasElement, e: { clientX: number; clientY: number }) {
  const [b, sid, win] = cv.dataset.map!.split('|') as [Body, string, string?], s = siteOf(b, sid); if (!s) return null;
  const r = cv.getBoundingClientRect(), fx = clamp((e.clientX - r.left) / r.width, 0, 1), fy = clamp((e.clientY - r.top) / r.height, 0, 1);
  const T = terrOf(b, s, !!win), N = T.N, half = T.ext / 2, c = midOf(b, s, !!win), [lat, lon] = localToLL(BODIES[b].R, c.lat, c.lon, (2 * fx - 1) * half, (1 - 2 * fy) * half);
  return { b, s, fx, fy, lat, lon, elev: T.z[Math.round(fy * (N - 1)) * N + Math.round(fx * (N - 1))] };
}
export const mapOf = (e: Event) => (e.target as Element).closest?.<HTMLCanvasElement>('canvas[data-map]');
pin.addEventListener('pointermove', e => {
  const cv = mapOf(e); if (!cv) return;
  const m = mapAt(cv, e), rd = cv.parentElement!.querySelector<HTMLElement>('.mread'); if (!m || !rd) return;
  rd.hidden = false; rd.innerHTML = `${latStr(m.lat, 4)}<br>${lonStr(m.lon, 4, m.b)}<br>${fmtM(m.elev)}`;
  const box = cv.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
  // Flips to the cursor's other side when it would run past the map's edge (the compare minis are only ~150 px).
  const fx = x + 12 + rd.offsetWidth > box.width, fy = y + 12 + rd.offsetHeight > box.height;
  rd.style.transform = `translate(${fx ? x - rd.offsetWidth - 12 : x + 12}px,${fy ? y - rd.offsetHeight - 12 : y + 12}px)`;
});
pin.addEventListener('pointerout', e => { const rd = mapOf(e)?.parentElement!.querySelector<HTMLElement>('.mread'); if (rd) rd.hidden = true; });
pin.addEventListener('click', e => {
  const cv = mapOf(e); if (!cv || state.view !== 'site' || ruler.on) return;   // measuring, a click is a line's end (ui/measure.ts)
  const m = mapAt(cv, e); if (!m || !movable(m.b, m.s) || m.b !== state.body) return;
  go(`${m.b}/${pinId(m.lat, m.lon)}`);
});
