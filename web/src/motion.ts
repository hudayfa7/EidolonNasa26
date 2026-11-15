// The one clock. GSAP's ticker drives tweens, then the frame updates, then the render. With ?capture, time only
// moves through window.__eidolon.seek (docs/progress.md, "The ?capture contract").
import gsap from 'gsap';
import { setText } from './dom';

const hasCapture = (q: string | undefined) => new URLSearchParams(q ?? '').has('capture');
export const CAPTURE = hasCapture(location.search) || hasCapture(location.hash.split('?')[1]);

// Reduced motion, live: an ES module binding, so importers always read the current value.
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
export let RM = rmq.matches;
rmq.addEventListener('change', e => { RM = e.matches; });
/** A touch screen is the main pointer: the gesture hints say tap and pinch, not click and scroll. */
export const TOUCH = matchMedia('(pointer: coarse)').matches;

// The plan's Motion table (docs/plan.md, Design system), in seconds; [in, out] pairs where a move has two.
export const MOTION = {
  slingshot: [1.6, 1.9], dive: 1.35, panel: .9, swap: [.24, .45],
  introGap: 1.4, introHold: 3.4, bars: .95, barStagger: .07, titleMove: 4.2, titleReveal: 3.2,
  grade: [.8, 1.2], beyond: [2.4, .7, .6, .1], info: [.85, .7], footer: [3.8, 3.8, 4.2, 5.2], dissolve: .8,
  previewPause: .28, previewTurn: .9, flash: .6, flashHold: .5,
} as const;

export const T_ = (o: gsap.TweenTarget, v: gsap.TweenVars, d = .9, extra: gsap.TweenVars = {}) =>
  gsap.to(o, { ...v, duration: RM ? 0 : d, ease: 'power2.inOut', overwrite: 'auto', ...extra });

/* ---------- App clock and sim time ---------- */
const EPOCH = Date.parse('2026-10-04T12:00:00Z');
let frameN = 0, routeN = 0;                     // capture clock, in 1/60 s frames
const appTime = () => frameN / 60;
// Seconds. performance.now (not the GSAP ticker, which lag-smooths hidden tabs) so Live keeps pace with UTC.
export const clock = () => CAPTURE ? appTime() : performance.now() / 1000;
// Wall-clock ms: under capture, the fixed epoch plus capture time.
export const wallNow = () => CAPTURE ? EPOCH + appTime() * 1000 : Date.now();

// A progress bar (its scaleX) for a wait the engine reports no progress on, only a typical length: from where `t0`
// (clock seconds) puts it, to 92% at `s` seconds, holding there until the answer replaces it.
export function fillBar(el: Element, t0: number, s: number) {
  const at = clock() - t0, p = (t: number) => .92 * Math.min(1, Math.max(0, t) / s);
  gsap.fromTo(el, { scaleX: p(at) }, { scaleX: .92, duration: Math.max(0, s - at), ease: 'none', overwrite: true });
}

// Telemetry flash (plan, Should): a reading that changes after holding for flashHold seconds flashes coral and eases back
// (CSS mixes --fl into its colour). One that changes every frame (the sub-observer at ×600, a moving cursor) is drift:
// it would only strobe. `news` false: the caller knows this change is drift (a steady tick); it is written, not flashed.
// Off under reduced motion; on the one clock, so ?capture seeks it.
const lastChange = new WeakMap<Element, number>();
export function setReading(el: Element, s: string, news = true) {
  if (!setText(el, s)) return;
  const t = clock(), held = t - (lastChange.get(el) ?? -Infinity); lastChange.set(el, t);
  if (news && !RM && held >= MOTION.flashHold) gsap.fromTo(el, { '--fl': 1 }, { '--fl': 0, duration: MOTION.flash, ease: 'power2.out', overwrite: true });
}

export const TIME = { rate: 600, base: wallNow(), t0: clock() };
export const simNow = () => new Date(TIME.base + (clock() - TIME.t0) * 1000 * TIME.rate);
export function setRate(r: number) {
  TIME.base = r === 1 ? wallNow() : simNow().getTime(); TIME.t0 = clock(); TIME.rate = r;   // Live is now, not 1× from where the clock got to
  document.querySelectorAll<HTMLElement>('#rate button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.rate! === r)));
}

/* ---------- Frame loop ---------- */
type Update = (time: number, dtMs: number) => void;
const updates: Update[] = [];
let render = () => {}, applyRoute = () => {};
export const onUpdate = (u: Update) => { updates.push(u); };

// Starts the loop: updates then draw on every GSAP tick, or only inside seek() under capture.
export function run(draw: () => void, route: () => void) {
  render = draw; applyRoute = route;
  if (!CAPTURE) gsap.ticker.add((time, dt) => { for (const u of updates) u(time, dt); draw(); });
}

/* ---------- ?capture ---------- */
declare global {
  interface Window { __eidolon?: { ready: Promise<void>; seek(t: number): Promise<void>; route(hash: string): Promise<void> } }
}
const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
// A task boundary: promise callbacks queued by a step (a search landing on its delayedCall) run before the next step,
// as they do between frames outside capture.
const settle = () => new Promise<void>(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(null); });
const step = (dtMs: number) => { gsap.updateRoot(appTime()); for (const u of updates) u(appTime(), dtMs); };
let resolveReady = () => {};

if (CAPTURE) {
  document.documentElement.dataset.capture = '';
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.remove(gsap.updateRoot);
  gsap.ticker.sleep();
  window.__eidolon = {
    ready: new Promise<void>(r => { resolveReady = r; }),
    async seek(t) {                              // forward only, from the current route start
      for (const end = routeN + Math.round(t * 60); frameN < end;) { frameN++; step(1000 / 60); await settle(); }
      render(); await nextFrame();
    },
    async route(hash) {                          // '#/mars', '/mars' or 'mars'; pushState fires no hashchange
      history.pushState(null, '', '#/' + hash.replace(/^#?\/?/, ''));
      applyRoute(); routeN = frameN; step(0); render(); await nextFrame();
    },
  };
}

// Capture: resolves __eidolon.ready after one rendered frame (right away without WebGL: nothing to update or draw).
export async function markReady() {
  if (!CAPTURE) return;
  step(0); render(); await nextFrame(); resolveReady();
}
