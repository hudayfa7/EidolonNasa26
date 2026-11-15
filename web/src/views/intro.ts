// Intro: three brief lines in a measured frame with telemetry corners over Earth's air seen edge on (scene/rig.ts
// limbPose), then sunrise into the title in the same shot (prototype 532–536, 1575–1616).
import gsap from 'gsap';
import { hudLL, introElev, pad } from '../coords';
import { $, $$, setText } from '../dom';
import { MOTION, onUpdate, RM, setReading, wallNow } from '../motion';
import { state } from '../router';
import { showOnly } from '../scene/bodies';
import { G } from '../scene/frame';
import { FX } from '../scene/post';
import { limbPose, setRig, VPS } from '../scene/rig';
import { playTitle } from './title';

const LINES = [
  'Permanent bases on the Moon and landings\u00a0on\u00a0Mars are rehearsed on Earth first.',   // no-break: the desktop rag falls after "Moon and"
  'Few of the places we rehearse in were ever measured against the ground they stand in for.',
  'Eidolon reads terrain form at 200\u00a0m and finds the places on Earth that come closest.',
];
const intro = $('#intro');
let introDone = false, introTl: gsap.core.Timeline | null = null, SUNRISE_AT = 8;

export function runIntro() {
  introDone = false;
  intro.hidden = false; gsap.set(intro, { opacity: 1, scale: 1 }); document.body.dataset.view = 'intro';
  // Replay from the title: leaveTitle's fade of these values must not run on into the intro.
  gsap.killTweensOf(G, 'dawn,glare,title');
  setRig(VPS[0], limbPose()); Object.assign(G, { dawn: 0, glare: 0, title: 1 }); showOnly(['earth'], 0);
  FX.title = 0;   // a replay: the title's ground goes at once, as on a first visit (its fade would show through the sky)
  const ps = $$('#intro .lines p'); ps.forEach((p, i) => { p.innerHTML = `<span>${LINES[i]}</span>`; });
  gsap.set(ps, { opacity: 0, y: 0, filter: 'blur(6px)' }); gsap.set('#intro .ih', { opacity: 0 });
  gsap.set('#intro .frm', { opacity: 0 }); setText($('#intro .fl2'), '00 / 03');
  buildIntro(0);
}
// A font landed late: rebuild the timeline from the new line sizes and pick it up where it was.
export function remeasureIntro() {
  if (!introTl || introDone) return;
  const t = introTl.time(); introTl.kill(); buildIntro(t);
}
// The frame hugs the lines shown so far, so it needs their laid-out size (fonts are loaded by the start gate).
function buildIntro(at: number) {
  const ps = $$('#intro .lines p'), hs = ps.map(p => p.offsetHeight || 40), ws = ps.map(p => p.firstElementChild!.getBoundingClientRect().width || 300), gap = 36;
  const total = (k: number) => hs.slice(0, k).reduce((a, b) => a + b, 0) + gap * (k - 1);
  const layout = (k: number) => { let y = -total(k) / 2; return hs.map((h, j) => { const v = y; if (j < k) y += h + gap; return v; }); };
  // Tweens take their start values from the elements when the playhead reaches them, so a rebuild picked up at `at`
  // replays the same chain from this initial size.
  // The frame hugs the widest line plus its corners, but never runs off a narrow screen (12 px each side).
  const frameW = (k: number) => Math.min(Math.max(...ws.slice(0, k)) + 96, innerWidth - 24);
  gsap.set('#intro .frm', { width: frameW(1), height: hs[0] + 64 });
  const tl = introTl = gsap.timeline({ onComplete: endIntro });
  tl.to('#intro .ih', { opacity: 1, duration: RM ? 0 : 1 }, 0);
  LINES.forEach((_, k) => {
    const t0 = RM ? 0 : .5 + k * MOTION.introGap, ys = layout(k + 1);
    tl.to('#intro .frm', { width: frameW(k + 1), height: total(k + 1) + 64, opacity: 1, duration: RM ? 0 : .8, ease: 'power3.out' }, t0)
      .add(() => setReading($('#intro .fl2'), `0${k + 1} / 03`), t0);
    for (let j = 0; j < k; j++) tl.to(ps[j], { y: ys[j], duration: RM ? 0 : .8, ease: 'power3.out' }, t0);
    tl.fromTo(ps[k], { y: ys[k] + 28, opacity: 0, filter: 'blur(6px)' }, { y: ys[k], opacity: 1, filter: 'blur(0px)', duration: RM ? 0 : .9, ease: 'power3.out' }, t0);
  });
  // Sunrise: the last line has been read for introHold seconds. The sun's glare swells under the horizon; the title
  // (playTitle) takes it from there with the dawn and the pull-back.
  SUNRISE_AT = RM ? 6 : .5 + 2 * MOTION.introGap + .9 + MOTION.introHold;
  tl.to(ps, { opacity: 0, y: '-=20', filter: 'blur(6px)', duration: RM ? 0 : .8, ease: 'power2.in', stagger: RM ? 0 : .05 }, SUNRISE_AT)
    .to('#intro .ih, #intro .frm', { opacity: 0, duration: RM ? 0 : .7 }, SUNRISE_AT + .1)
    .to(G, { glare: .75, duration: RM ? 0 : 1.1, ease: 'power2.in' }, SUNRISE_AT);
  if (at) tl.time(at);
}

// Telemetry corners: wall-clock UTC, countdown to sunrise, drifting sub-point, sun elevation rising to the horizon.
// Only the countdown flashes (and the frame's counter as each line arrives): UTC ticks out of phase with it, so the
// corner would pulse twice a second, and the sub-point and elevation drift in dark text over the glow, where coral
// all but vanishes (Decisions 163).
const tUtc = $('#i-utc'), tCd = $('#i-cd'), tLl = $('#i-ll'), tSe = $('#i-se');
onUpdate(() => {
  if (!introTl || introDone) return;
  const t = introTl.time(), rem = Math.max(0, SUNRISE_AT - t), f = Math.min(1, t / SUNRISE_AT);
  setText(tUtc, new Date(wallNow()).toISOString().slice(11, 19));
  setReading(tCd, `T−00:00:${pad(Math.ceil(rem))}`);
  setText(tLl, hudLL(12.4 + t * .012, -31.2 + t * .064));
  setText(tSe, introElev(-1.8 + 1.8 * f));
});

function endIntro() {
  if (introDone) return;
  introDone = true; introTl?.kill(); introTl = null;
  gsap.to(intro, { opacity: 0, scale: .93, duration: RM ? 0 : 1.3, ease: 'power2.inOut', onComplete: () => { intro.hidden = true; gsap.set(intro, { scale: 1 }); } });
  state.view = 'title'; playTitle(true);
}
// A deep link (or leaving the title) drops the intro at once.
export function hideIntro() { if (!introDone) { introDone = true; intro.hidden = true; } }
$('#intro .skip').addEventListener('click', endIntro);
