// Capture states for scripts/capture.mjs: one per row or sub-step of the Verification table in docs/plan.md.
//
// A state is data:
//   name     file name and manifest key
//   route    hash route loaded at the start (the route start is t = 0 for every `seek`)
//   query    query string before the hash, without `?` (the build target always adds `capture`)
//   seq      states sharing a seq run in ONE page, in list order, each continuing from the previous one;
//            the first state of a seq sets route/query/context options for the whole seq
//   steps    run in order before the screenshot:
//              { seek: s }                 advance to s seconds after the current route start
//              { route: '#/x' }            change route mid-state; resets the route start
//              { fill: sel, text }         set an input's text (one input event), like a paste
//              { press: key }              keyboard press on the focused element
//              { tap: sel }                pointer move + click at the centre of sel's box (works through
//                                          pointer-events:none overlays, e.g. #hud, which is centred on the globe)
//              { tap: sel, fx, fy }        the same at fractions fx, fy of sel's box (a point on the globe off its centre)
//              { hover: sel, fx, fy }      the tap's pointer move without the click (the globe's cursor readouts)
//              { wheel: { dx, dy }, at }   mouse wheel over the first point whose topmost element is `at`
//              { wheel, at, fx, fy }       mouse wheel at fractions fx, fy of `at`'s box (e.g. the compare's right globe)
//              { select: sel, value }      choose a <select>'s option by value (input and change events)
//              { eval: js }                runs js (an expression, as a string) in the page: what no input can do, e.g. losing
//                                          the WebGL context or leaving only the canvas on screen
//              { reload: true }            reloads the page (as the browser's button: the route and the tab's session
//                                          storage stay) and waits for the app's start; the route start is t = 0 again
//              { wait: ms }                real time, page time frozen: lets a lazy chunk (the mock's target list) load
//              { expect: sel }             fails the state unless sel matches (what a screenshot can't show, e.g. a
//                                          native select's disabled option)
//              { until: sel }              waits (real time, up to 60 s) until sel matches: with noReady, until the app
//                                          has started (e.g. a state whose held request holds __eidolon.ready)
//              { inView: sel }             fails the state unless sel is wholly on screen and uncovered at its centre
//                                          (above the fold, not under the sheet's edge)
//              { scroll: sel, to? }        scroll that element to its bottom, or until the element `to` sits at its top
//              { drag: sel, fx, fy, tx, ty }  a mouse drag from fractions fx, fy of sel's box to tx, ty, in 10 moves
//              { touch: sel, fx, fy, dx, dy, fingers, spread, twist, hold }
//                                          a touch gesture at fractions fx, fy of sel's box (default its centre): one
//                                          finger (or `fingers: 2`, 52 px apart across the point) moves by (dx, dy) in 10
//                                          steps, two fingers' gap going to `spread` px and turning `twist` degrees
//                                          clockwise; `hold` ms still before the lift (no flick). Phone states: the
//                                          desktop context has no touch
//   scale          the context's device scale factor (default 1), e.g. 2 for a retina laptop, where the pixel budget
//                  (scene/renderer.ts) draws the scene below the screen's ratio; the PNG is that many times larger
//   reducedMotion  true: context emulates prefers-reduced-motion: reduce
//   noWebGL        true: getContext('webgl'|'webgl2'|'experimental-webgl') returns null
//   noStorage      true: localStorage and sessionStorage throw on access, as with the browser's site data blocked
//   block          requests whose path contains this (or any of a list) answer 404 (e.g. '/sites/': the site data failing)
//   hold           requests whose path contains this (or any of a list) never answer (e.g. '/textures/': the start waits)
//   serve          { pathPart: file } requests whose path contains pathPart answer with that recorded JSON file (with
//                  query 'wx=feed': the weather feeds from scripts/fixtures/, as WX below)
//   noReady        don't wait for the app's start: the screenshot shows what paints before it (the first-paint poster)
//   refNA          the reference can't show this state (captured anyway; flagged in the manifest)
//   only           'phone' or 'desktop': the seq (set on its first state) runs at that viewport only
//   check          what to look for (from the Verification table)
//
// Seeks are absolute within a state's route start, so they mean the same on both targets. The footer carousel in the
// reference runs on GSAP's global clock (17 s loop: 3.8, 3.8, 4.2, 5.2 s), so its steps sit at 17 s + mid-step.

// The weather feeds' recorded answers (scripts/fixtures/: Open-Meteo's forecast, re-dated to start on the capture day,
// and NASA POWER's climatology, both for the Jezero example's first cell), for states with query 'wx=feed'.
const POWER = { '/climatology/point': 'scripts/fixtures/power-climatology.json' }, FORECAST = { '/v1/forecast': 'scripts/fixtures/open-meteo-forecast.json' };
const WX = { ...FORECAST, ...POWER }, FEEDS = ['/v1/forecast', '/climatology/point'];
// The McMurdo Dry Valleys' (recorded 2026-10-21 at 162° E, 77.5° S; UTC+13, so its forecast re-dated to start on the
// capture day's local date, 2026-10-05): October lows of −20 to −28 °C.
const DRY = { '/v1/forecast': 'scripts/fixtures/open-meteo-forecast-dryvalleys.json', '/climatology/point': 'scripts/fixtures/power-climatology-dryvalleys.json' };

// Steps run in the page (`eval`): the canvas's WebGL context lost, as a GPU reset does; only the canvas left on screen.
const LOSE = "document.getElementById('gl').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()";
const SCENE_ONLY = "document.head.insertAdjacentHTML('beforeend', '<style>body *{visibility:hidden!important} #gl{visibility:visible!important}</style>')";
const OG_ONLY = "document.head.insertAdjacentHTML('beforeend', '<style>#title .tcta, #title .blurb p:first-child, #title .blurb::before, #title .meta-row span:last-child, #annot > rect, #annot > circle, #annot > g:not(:last-of-type){visibility:hidden!important} #title .blurb{translate:0 54px!important}</style>')";
// Copy link (Share and meta): a spy on what reaches the clipboard (html[data-copied]), through the Clipboard API or,
// with it gone, the copy command's selected text; the button's label asserted.
const SPY_API = "{ const c = navigator.clipboard, w = c.writeText.bind(c); c.writeText = t => (document.documentElement.dataset.copied = t, w(t)); }";
const SPY_CMD = "{ Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); const x = document.execCommand.bind(document); document.execCommand = c => (document.documentElement.dataset.copied = document.activeElement.value, x(c)); }";
const NO_CMD = "document.execCommand = () => false";
// The back link and Copy link on one row: the same height, side by side.
const ONE_ROW = "{ const [b, l] = document.querySelectorAll('#pin .phead > *'), r = b.getBoundingClientRect(), q = l.getBoundingClientRect(); if (r.height !== q.height || r.right > q.left) throw new Error(`the back link ${r.height}px high, right ${r.right}; Copy link ${q.height}px, left ${q.left}`); }";
const label = t => `{ const l = document.querySelector('[data-link]').textContent; if (l !== ${JSON.stringify(t)}) throw new Error('the button says ' + l); }`;
// The landing ellipse's section holds each of these words (a size's number held to its unit: `nb` for its spaces).
const nb = t => t.replaceAll(' ', '\u00a0'), ellT = (...w) => `{ const t = document.querySelector('[data-ell]').textContent; for (const w of ${JSON.stringify(w)}) if (!t.includes(w)) throw new Error(w + ' not in: ' + t); }`;
const copied = t => `{ const c = document.documentElement.dataset.copied; if (c !== location.origin + '/' + ${JSON.stringify(t)}) throw new Error('copied ' + c); delete document.documentElement.dataset.copied; }`;

// My campaigns: a row's double at its point; the dialog's right edge on its button's (desktop, inside the gutter);
// Arcadia's confirmation by its reference.
const rowLL = (i, t) => `{ const l = document.querySelector('#camps .rows li:nth-child(${i}) .ll')?.textContent; if (l !== ${JSON.stringify(t)}) throw new Error('the row reads ' + l); }`;
const UNDER_BTN = "{ const d = document.getElementById('camps').getBoundingClientRect(), b = document.getElementById('camps-btn').getBoundingClientRect(); if (innerWidth >= 760 && Math.abs(d.right - Math.max(b.right, d.width + 12)) > 1) throw new Error(`the dialog ends at ${d.right}, its button at ${b.right}`); }";
const REF_RBJS = "{ const r = document.querySelector('#pin .ref')?.textContent; if (!r?.endsWith('EID-261004-RBJS')) throw new Error('the reference is ' + r); }";

export const STATES = [
  // Intro, sunrise and title: one page. Reference timeline: lines at .5/1.9/3.3 s, sunrise at 7.6 s, intro ends
  // ~8.7 s, then the title's 4.2 s camera move with the wordmark reveal at 3.2 s into it.
  { name: 'intro-2s', seq: 'opening', route: '#/', steps: [{ seek: 2 }], check: 'Lines evenly spaced, frame hugs the text, telemetry counts down (the frame\'s counter just stepped to 02 / 03: coral, the telemetry flash; UTC, sub-point and sun elevation white); line 1 "Permanent bases on the Moon and landings on Mars…"' },
  { name: 'intro-6s', seq: 'opening', steps: [{ seek: 6 }], check: 'Three lines, frame hugs the text; line 3 says terrain form at 200 m' },
  { name: 'intro-8s', seq: 'opening', steps: [{ seek: 8 }], check: 'Lines out, glare rising' },
  // 9.5 and 10.5 s: the pull-back's close pass, where the sun must stay above the limb (no rise, set, rise).
  ...[9, 9.5, 10, 10.5, 11, 12, 13].map(s => ({ name: `sunrise-${s}s`, seq: 'opening', steps: [{ seek: s }], check: 'One continuous move, atmosphere on the limb, no cut; the sun above the limb throughout' })),
  { name: 'title', seq: 'opening', steps: [{ seek: 16 }], check: 'Wordmark revealed, sun visible; the blurb (Moon bases and Mars first, terrain form at 200 m) clear of the wordmark and globe; Earth under its clouds (build), the blurb\'s lines shaded where they cross the globe, the site labels edged dark' },
  { name: 'footer-step1-develop', seq: 'opening', steps: [{ scroll: '#title' }, { seek: 16.8 }], check: 'Carousel wrap into step 1, three quarters through the dissolve: step 4 fading, the mark\'s light dots half in (build); the reference dissolves its whole mark in. Above the footer, no title annotations (build: they fade as the text scrolls; the reference scrolls them away)' },
  { name: 'footer-step1', seq: 'opening', steps: [{ seek: 18.9 }], check: 'Carousel step 1: logo, "The Moon and Mars, on Earth" (phone: one line, clear of the step dashes)' },
  { name: 'footer-step2', seq: 'opening', steps: [{ seek: 22.7 }], check: 'Carousel step 2: Earth' },
  { name: 'footer-step3', seq: 'opening', steps: [{ seek: 26.7 }], check: 'Carousel step 3: solar system' },
  { name: 'footer-step4', seq: 'opening', steps: [{ seek: 31.4 }], check: 'Carousel step 4: Mars to Earth' },
  // Skip intro at 3 s, long before the sunrise: the glare swells in on the horizon over .7 s (no pop), then the move.
  { name: 'skip-3.1s', seq: 'skip', route: '#/', steps: [{ seek: 3 }, { tap: '#intro .skip' }, { seek: 3.1 }], check: 'Skip intro: the brief fading, the sun only starting to glow on the horizon (no bright disc, glow or flare in one frame)' },
  { name: 'skip-3.4s', seq: 'skip', steps: [{ seek: 3.4 }], check: 'The glare swelling on the horizon, between 3.1 s and 4 s' },
  { name: 'skip-4s', seq: 'skip', steps: [{ seek: 4 }], check: 'The sunrise glare at full, the pull-back starting; no step from 3.1 s' },
  // Earth's clouds (Stretch: Earth clouds on the title): on the title shot only, drifting east on the frame clock (so a
  // seek places them), gone with the shot; the title as before when their map fails.
  { name: 'title-clouds-late', route: '#/', refNA: true, steps: [{ seek: 46 }],
    check: 'The title 30 s after `title`: Earth turned on, its clouds still in full, drifted about 4° east against the coasts' },
  { name: 'title-clouds-leave', seq: 'clouds-off', route: '#/', refNA: true, steps: [{ seek: 16 }, { route: '#/system' }, { seek: .4 }],
    check: 'Enter the system, .4 s on: Earth pulling back, its clouds half faded' },
  { name: 'title-clouds-off', seq: 'clouds-off', refNA: true, steps: [{ seek: 2.5 }], check: 'The system reached from the title: Earth clear of clouds, as in `system`' },
  // Back to the title (playTitle(false)): G.title, so the clouds, eases back to 1 over 1 s.
  { name: 'title-clouds-back', seq: 'clouds-off', refNA: true, steps: [{ route: '#/' }, { seek: .5 }],
    check: 'Back to the title from the system, .5 s on: Earth closing in, its clouds fading back in (about three-quarters)' },
  { name: 'title-clouds-back-full', seq: 'clouds-off', refNA: true, steps: [{ seek: 2 }],
    check: 'The title 2 s after coming back: Earth framed, its clouds in full as in `title` (the wordmark mid-reveal)' },
  { name: 'title-clouds-blocked', route: '#/', block: '/textures/earth_clouds.jpg', refNA: true, steps: [{ seek: 16 }],
    check: 'The cloud map failing (its one intended 404): the title as before the clouds, the ocean clear' },
  // Back to the title from a site or compare reached by a deep link (the browser's Back): the terrain goes with them,
  // and so out of Replay intro and the worlds after it.
  { name: 'title-from-site', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { route: '#/' }, { seek: 4 }, { expect: '#tui0:not(.on)' }],
    check: 'The title after Jezero: Earth framed with its clouds and annotations, no terrain block, legend, caption or arrow (asserted)' },
  { name: 'title-from-compare', seq: 'title-back', route: '#/mars/jezero/compare/salda', refNA: true,
    steps: [{ seek: 3 }, { route: '#/' }, { seek: 4 }, { expect: '#tui0:not(.on)' }, { expect: '#tui1:not(.on)' }],
    check: 'The title after compare: as `title-from-site`, neither legend over the other (asserted)' },
  { name: 'title-from-compare-replay', seq: 'title-back', refNA: true, steps: [{ tap: '#replay' }, { seek: 6 }],
    check: 'Replay intro from there, 2 s in: the brief over Earth\'s night limb, as `intro-2s`, not over Mars\'s terrain' },
  { name: 'title-from-compare-earth', seq: 'title-back', refNA: true, steps: [{ route: '#/earth' }, { seek: 2.5 }],
    check: 'Earth from there: the globe, as `body-earth`, not a terrain block' },
  // Compare's Globe mode leaves the left viewport drawing only the site's world (VPS[0].only): the title clears it.
  { name: 'title-from-compare-globe', route: '#/mars/jezero/compare/salda/globe', refNA: true, steps: [{ seek: 3 }, { route: '#/' }, { seek: 4 }],
    check: 'The title after Globe compare: Earth framed as in `title-from-site`, not missing, no Mars' },

  // System, info sheet (scroll down), sheet closed (scroll up), Beyond (scroll sideways).
  { name: 'system', seq: 'system', route: '#/system', steps: [{ seek: 2.5 }], check: 'Three worlds, sun at the left edge, labels clear of the heading on phone; labels "Artemis base regions", "Landing sites, pin anywhere", "14 established analog sites"' },
  { name: 'info-sheet', seq: 'system', steps: [{ wheel: { dx: 0, dy: 400 }, at: '#gl' }, { seek: 4 }], check: 'Info sheet up: "Read its terrain" (terrain form of an 18.8 km window at 200 m, nothing under about 600 m, no surface brightness), the tested line and the 60° Moon note under Find its doubles' },
  { name: 'info-closed', seq: 'system', steps: [{ wheel: { dx: 0, dy: -400 }, at: '#sysinfo' }, { seek: 5.5 }], check: 'Sheet closes on scroll up' },
  { name: 'beyond', seq: 'system', steps: [{ wheel: { dx: 400, dy: 0 }, at: '#gl' }, { seek: 11 }], check: 'Beyond drawn and holding still; lead "… Eidolon starts with the Moon and Mars."; the cards\' worlds in the footer\'s dots, each in its own ink (Venus, Mercury, Callisto, Titan from Mariner 10, MESSENGER, Galileo, Cassini), its mission (linked) and credit on a line under the image' },
  { name: 'beyond-held', seq: 'system', steps: [{ seek: 40 }], check: 'The same pixels as beyond but the top bar\'s clocks (sim time runs): once drawn, Beyond holds still' },
  // Beyond's reveal on the compositor (drawn once, then a clip and fades): half-way, the path wiping in left to right.
  { name: 'beyond-reveal', route: '#/system', refNA: true, steps: [{ seek: 3 }, { wheel: { dx: 400, dy: 0 }, at: '#gl' }, { seek: 5.2 }],
    check: 'Mid-reveal: the galactic glow in, the path and the planets\' trails drawn about half-way toward the Sun, no orbits or Sun yet' },
  // A deep link (the reveal at once); on the phone the page scrolled to the cards' strip, captions and copy.
  { name: 'beyond-cards', route: '#/beyond', steps: [{ seek: 5 }, { scroll: '#beyond' }], check: 'Beyond by deep link, all four worlds drawn, captions under the images; phone: the first card whole' },
  // An image that never lands: its frame stays empty (the card's navy) under its caption; the others draw as before.
  { name: 'beyond-late', route: '#/beyond', block: '/textures/venus.jpg', refNA: true, steps: [{ seek: 5 }, { scroll: '#beyond' }, { expect: '#beyond canvas[data-scene="venus"][aria-hidden="true"]' }], check: 'Venus\'s frame empty with its caption ("Mariner 10", "NASA/JPL-Caltech") and hidden from screen readers, the other worlds drawn; no error (phone: the first card)' },
  { name: 'info-sheet-foot', seq: 'sysfoot', route: '#/system', steps: [{ seek: 2.5 }, { wheel: { dx: 0, dy: 400 }, at: '#gl' }, { seek: 4 }, { scroll: '#sysinfo' }, { seek: 4.2 }], check: 'Info sheet foot: the mark and the big lockup; "Eidolon, 2026" and "The Moon and Mars, on Earth" one line each (phone)' },

  // Body views.
  { name: 'body-mars', seq: 'mars', route: '#/mars', steps: [{ seek: 2.5 }], check: 'HUD, graticule labels' },
  { name: 'body-mars-zoomed', seq: 'mars', steps: [{ wheel: { dx: 0, dy: -500 }, at: '#gl' }, { seek: 4 }], check: '10° grid when zoomed; the HUD\'s brackets clamped inside the viewport, the tape below the top bar, a side\'s readouts gone where they have no room; the graticule labels inside the brackets, none on the hint or the tape' },
  { name: 'body-moon', route: '#/moon', steps: [{ seek: 2.5 }, { expect: '#hud:not(:has(dd[style*="--fl: 0."]))' }], check: 'HUD (its readouts white: the sub-observer\'s and sub-solar\'s ~1.1 s ticks at ×600 are drift, never flashed), graticule labels; the lede: "Matching reaches 60° from the equator, so the south-pole base regions list their established analog sites, unscored, for now."' },
  { name: 'body-earth', route: '#/earth', steps: [{ seek: 2.5 }], check: 'Earth lede "The 14 established analog sites, and the worlds they stand in for." over "Established analog sites"' },
  // A world whose colour map hasn't landed (outside ?capture the maps after the route's load after start; both its tiers
  // blocked here, so neither lands): it draws in its map's mean colour until the map turns it over .9 s (app.ts
  // showMaps). The console shows the two 404s.
  { name: 'system-moon-late', route: '#/system', block: ['/textures/moon.jpg', '/textures/lo/moon.jpg', '/textures/mid/moon.jpg'], refNA: true, steps: [{ seek: 2.5 }],
    check: 'The Moon without its map: a lit, even grey globe with its faint rim and terminator, never a black disc; Earth and Mars as in system' },
  { name: 'body-moon-late', route: '#/moon', block: ['/textures/moon.jpg', '/textures/lo/moon.jpg', '/textures/mid/moon.jpg'], refNA: true, steps: [{ seek: 2.5 }],
    check: 'The Moon\'s body view without its map: an even grey globe, its relief shaded from its normal map, graticule and HUD as in body-moon; the polar cap in the same grey' },
  // Progressive textures (Should 6): the worlds start on their 1024 px low tier; the 4K maps load after start (held here,
  // so they never land, and __eidolon.ready, which waits on them, never resolves: noReady, until the app has started).
  { name: 'system-maps-loading', route: '#/system', hold: ['/textures/earth_day.jpg', '/textures/moon.jpg', '/textures/mars.jpg', '/textures/mid/'], noReady: true, refNA: true,
    steps: [{ until: '#st-m.on' }, { seek: 2.5 }],
    check: 'The three worlds on their low tiers, in the tones of system (no darker or paler globe), a little softer; the status bar\'s right: a grey dot and "LOADING FULL-RESOLUTION MAPS" in the HUD\'s caps in place of "Choose a world"; on the phone no line (the system view has no sheet; its globes are smaller than the low tier holds)' },
  { name: 'body-mars-loading', route: '#/mars', hold: ['/textures/mars.jpg', '/textures/mid/mars.jpg'], noReady: true, refNA: true, steps: [{ until: '#st-m.on' }, { seek: 2.5 }],
    check: 'Mars on its 1024 px tier: the albedo as in body-mars, softer detail; HUD, graticule and markers as there; the loading line in the hints\' place; on the phone that line alone just above the sheet' },
  // The line follows the globes on screen (ui/chrome.ts mapsLine): a full map that fails clears it, the hint comes back
  // and the globe stays on its low tier (the console shows the 404); a site, a terrain compare (and so a booking) never
  // show it, nor the phone's status line, while the full maps load; a globe compare does.
  { name: 'body-mars-full-fail', route: '#/mars', block: ['/textures/mars.jpg', '/textures/mid/mars.jpg'], refNA: true, steps: [{ seek: 2.5 }, { expect: '#st-m:not(.on)' }],
    check: 'Mars on its low tier (as body-mars-loading); no loading line: desktop the hint "Drag to rotate. Scroll to zoom." back at the right; the phone no status line' },
  { name: 'site-jezero-loading', route: '#/mars/jezero', hold: ['/textures/earth_day.jpg', '/textures/moon.jpg', '/textures/mars.jpg', '/textures/mid/'], noReady: true, refNA: true,
    steps: [{ until: 'body[data-view="site"]' }, { seek: 3 }, { expect: '#st-m:not(.on)' }],
    check: 'As site-jezero: no loading line, desktop the hint "Drag to orbit. Scroll to zoom. Esc returns to the globe." at the right; the phone no status line, the legend at its usual place' },
  { name: 'compare-jezero-salda-loading', route: '#/mars/jezero/compare/salda', hold: ['/textures/earth_day.jpg', '/textures/moon.jpg', '/textures/mars.jpg', '/textures/mid/'], noReady: true, refNA: true,
    steps: [{ until: 'body[data-view="compare"]' }, { seek: 3 }, { expect: '#st-m:not(.on)' }],
    check: 'As compare-jezero-salda: no loading line, desktop the hint at the right; the phone no status line, both legends at their usual places' },
  { name: 'compare-globe-loading', route: '#/mars/jezero/compare/salda/globe', hold: ['/textures/earth_day.jpg', '/textures/moon.jpg', '/textures/mars.jpg', '/textures/mid/'], noReady: true, refNA: true,
    steps: [{ until: '#st-m.on' }, { seek: 2.5 }],
    check: 'As compare-globe, Mars and Earth on their low tiers; the loading line in the hint\'s place on desktop, alone just above the sheet on the phone, Search this area clear of the line' },

  // Coordinate entry: 280 ms typing pause, then a 0.9 s turn.
  { name: 'coord-valid', seq: 'coord', route: '#/mars', steps: [{ seek: 2.5 }, { fill: '#cin', text: '47.2N 184.3E' }, { seek: 4 }], check: 'Globe turns and pin shows' },
  { name: 'coord-error', seq: 'coord', steps: [{ fill: '#cin', text: '18.38N 77.58N' }, { seek: 5 }], check: 'A clear error' },
  // Rotation while a site is selected (Decisions 8): a held body keeps turning at the time rate with the view tracking its
  // site, so 20 s at 10 min/s (~49° of Mars's turn) leaves the point centred, the terminator moved and the stars wheeled.
  { name: 'coord-held-20s', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { fill: '#cin', text: '47.2N 184.3E' }, { seek: 24 }],
    check: 'As coord-valid 20 s on: the pin still centred, the terminator further across, the stars turned about Mars\'s axis' },

  // Dive: click the surface (centre of the HUD box = centre of the globe), 0.8 s into the dive.
  // A surface click is a search by coordinates (6 s in the mock): the frame holds on the globe until it answers (Must 4
  // part 4), so the reference's dive under way is the build's held frame.
  { name: 'dive-0.8s', route: '#/mars', steps: [{ seek: 2.5 }, { tap: '#hud' }, { seek: 3.3 }], check: 'Detection grade on the real surface, dot on the pin (build: held on the globe, the Matching bar filling)' },
  // An established Earth site from the Earth globe has no search (the engine's targets are Mars and Moon): it dives at once.
  { name: 'dive-earth', route: '#/earth', refNA: true, steps: [{ seek: 2.5 }, { route: '#/earth/haughton' }, { seek: 1.8 }], check: 'Diving into Haughton (not held on the globe): graded in its polar ramp\'s palette (grey-blue), the dot (the readouts come in after the swap: dive-earth-swap, "Rehearses 4 target sites"), status bar without "Click the surface…"' },

  // The Should rows under Rendering and shaders and Visual bugs (docs/progress.md, "Rendering and visual-bug Should rows").
  // The terrain swap a crossfade (the frame before held and fading out over the new one), mid-way: the dive into
  // Haughton flowing into its block, graded in its palette; and compare's terrain giving way to the globes.
  { name: 'dive-earth-swap', route: '#/earth', refNA: true, steps: [{ seek: 2.5 }, { route: '#/earth/haughton' }, { seek: 2.95 }],
    check: 'Mid-crossfade from the dived globe to Haughton\'s block (no curtain): the graded globe fading out over the block, both in the polar palette; the frame\'s dot and readouts over it' },
  { name: 'compare-globe-xfade', route: '#/mars/jezero/compare/salda', refNA: true, steps: [{ seek: 3 }, { tap: '#toggle [data-view="globe"]' }, { seek: 3.35 }],
    check: 'Terrain to Globe, mid-crossfade: the two blocks fading out over the two globes (no dark curtain)' },
  // Every site entry plays the detection frame: a deep link, over its terrain, in the site's own palette.
  { name: 'site-acquire', route: '#/mars/jezero', refNA: true, steps: [{ seek: 1.1 }],
    check: 'Deep link: "Site acquired / Mars" (phone: right of the dot, whole), the dot on the block, the readout row in (Terrain, Position, Matching), the block graded in Mars\'s palette over the dive\'s sky; gone by 3 s (site-jezero)' },
  { name: 'site-acquire-haughton', route: '#/earth/haughton', refNA: true, steps: [{ seek: 1.1 }],
    check: 'Deep link to an Earth site: the frame graded in its own ramp\'s palette (polar, grey-blue), "Rehearses 4 target sites"; phone: "Site acquired / Earth" whole, right of the dot' },
  // A compare arrived at with a new target plays the frame too: one grade, the target's palette (Decisions 182).
  { name: 'compare-acquire', route: '#/mars/jezero/compare/salda', refNA: true, steps: [{ seek: 1.1 }],
    check: 'Compare deep link: "Site acquired / Mars" over Jezero\'s block, both blocks graded in Mars\'s palette, the captions and legends faded out under the frame; no readout row (it ran under the view toggle)' },
  // Reduced motion: the turn and the dive instant, the frame still held (not a move), then gone at the swap with the
  // block's overlay back; a deep link holds it too.
  { name: 'dive-rm', seq: 'drm', route: '#/earth', reducedMotion: true, refNA: true, steps: [{ seek: 2.5 }, { route: '#/earth/haughton' }, { seek: 1 }, { expect: '#scan[style*="opacity: 1;"]' }],
    check: 'Reduced motion, Haughton clicked: the globe already at the dive\'s end, graded in the polar palette, the frame held (asserted shown)' },
  { name: 'dive-rm-end', seq: 'drm', steps: [{ seek: 2.2 }, { expect: '#scan[style*="opacity: 0;"]' }, { expect: '#tui0.on:not(.hid)' }],
    check: 'Then Haughton\'s block ungraded, the frame gone (asserted), its caption, legend and north arrow shown (asserted)' },
  { name: 'site-acquire-rm', route: '#/mars/jezero', reducedMotion: true, refNA: true, steps: [{ seek: 1.1 }, { expect: '#scan[style*="opacity: 1;"]' }],
    check: 'Reduced motion, deep link: the frame held over Jezero\'s block (asserted shown), as site-acquire' },
  // The site's orbital image draped over its block (toggled under the north arrow), the image credited in the note.
  { name: 'site-jezero-drape', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { tap: '[data-drape]' }, { until: '#tui0.draped' }, { seek: 3.5 }],
    check: 'Jezero\'s Viking MDIM image over its block (the crater, the delta), lit a little by the block\'s hillshade, contours over it; the toggle pressed (coral edge); the note adds "Image: Viking MDIM 2.1 colour mosaic"' },
  { name: 'site-salda-drape', route: '#/earth/salda', refNA: true, steps: [{ seek: 3 }, { tap: '[data-drape]' }, { until: '#tui0.draped' }, { seek: 3.5 }],
    check: 'Lake Salda\'s Landsat image over its block: the lake in its own blue, no water shader over it' },
  // The toggle by the keyboard keeps its focus as the image lands; a crop that doesn't load leaves it unpressed and
  // aria-disabled, its title saying why; one still on its way, pressed over the hypsometric block.
  { name: 'site-jezero-drape-kb', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('[data-drape]').focus()" }, { press: 'Enter' },
    { until: '#tui0.draped' }, { seek: 3.5 }, { expect: '[data-drape][aria-pressed="true"]:focus' }],
    check: 'Enter on the focused toggle: the image draped, the toggle pressed and still focused (asserted), its ring whole; the legend\'s range and contour line without the ramp' },
  { name: 'site-jezero-drape-fail', route: '#/mars/jezero', block: '/crops/mars-jezero-60.jpg', refNA: true, steps: [{ seek: 3 }, { tap: '[data-drape]' },
    { until: '[data-drape][aria-disabled="true"]' }, { seek: 3.5 }, { expect: '[data-drape][aria-pressed="false"][title]' }, { expect: '#tui0:not(.draped)' }],
    check: 'The image blocked: the toggle dimmed, unpressed, aria-disabled with its title (asserted); the block in its hypsometric tint, the legend\'s ramp, no image in the note' },
  { name: 'site-jezero-drape-loading', route: '#/mars/jezero', hold: '/crops/mars-jezero-60.jpg', refNA: true, steps: [{ seek: 3 }, { tap: '[data-drape]' }, { seek: 3.5 },
    { expect: '[data-drape][aria-pressed="true"]' }, { expect: '#tui0:not(.draped)' }],
    check: 'The image on its way: the toggle pressed (coral edge), the block in its hypsometric tint until the image lands' },
  // Back to the globe: the terrain overlay hidden, its toggle no longer taking clicks or the Tab key over the globe.
  { name: 'site-leave-tui', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { route: '#/mars' }, { seek: 2.5 }, { wait: 400 },
    { eval: "{ const b = document.querySelector('[data-drape]'); if (b && getComputedStyle(b).visibility !== 'hidden') throw new Error('the drape toggle is still visible'); }" }],
    check: 'Mars\'s globe after Jezero: no legend, arrow or toggle over it (the toggle hidden, asserted)' },

  // The sun-angle control under the site map (Stretch 1): Malapert (86° S) on 2026-11-15, the lunar south pole's summer
  // (the sun's selenographic latitude −1.5°), at two sun angles: 06:00, 1.5° up from the east; 12:00, 5.5° up from the
  // north. The block and the map lit alike, shadows cast at true scale.
  { name: 'site-sun-am', seq: 'sun', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#sun-on').click()" },
    { fill: '#sun-d', text: '2026-11-15' }, { fill: '#sun-h', text: '6' }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { expect: '#sun-h[aria-valuetext="06:00, the sun 1.5° up, from the east"]' }],
    check: 'Sun 1.5° up from the east: the massif\'s east faces lit, long shadows west of every rise, the plains dark; the map lit the same way; the facts say 1.5°, 90° from the east, the moment (UTC), the lunar day\'s line' },
  { name: 'site-sun-noon', seq: 'sun', refNA: true, steps: [{ fill: '#sun-h', text: '12' }, { seek: 4 }, { expect: '#sun-h[aria-valuetext="12:00, the sun 5.5° up, from the north"]' },
    { eval: "{ const c = document.querySelector('#cap0').textContent; if (!c.includes('Lit for 2026-11-24 16:19 UTC')) throw new Error(`caption: ${c}`); }" }],
    check: 'Noon, 5.5° up from the north: the north faces lit, shadows to the south shorter, the far (north) side\'s longer; block and map turned together; the caption says the moment it is lit for (asserted)' },
  // The empty state: the pole's midnight, the sun 2.5° under the horizon from the south.
  { name: 'site-sun-night', seq: 'sun', refNA: true, steps: [{ fill: '#sun-h', text: '0' }, { seek: 4.5 }, { expect: '#sun-h[aria-valuetext*="below the horizon"]' }],
    check: 'Midnight: block and map at their ambient only (dim, not black), the facts "Below the horizon"; the stage\'s warm glow toward the sun\'s side' },
  // The slope hazard under that midnight: the steep ground still coral where the sun doesn't reach (its coral shaded
  // gently, .55 + .55 · hillshade); then off again, the colours and the ramp back.
  { name: 'site-slope-night', seq: 'sun', refNA: true, steps: [{ eval: "document.querySelector('#slope-on').click()" }, { seek: 4.7 },
    { expect: '#tui0.steep .legend .sk' }, { expect: '#sun-h[aria-valuetext*="below the horizon"]' }],
    check: 'Midnight with the slope tint: block and map greyed and dim, the massif\'s steep flanks still coral in the dark (not black), the summit lit; the legend\'s coral row' },
  { name: 'site-slope-off', seq: 'sun', refNA: true, steps: [{ eval: "document.querySelector('#slope-on').click()" }, { seek: 4.9 },
    { expect: '#tui0:not(.steep) .legend > .ramp' }, { expect: '[data-slope]:not(:has(.skey)) #slope-on:not(:checked)' }, { expect: 'canvas[data-map]:not([aria-label*="coral"])' }],
    check: 'The tint off again: as site-sun-night (block and map in the Moon\'s greys at midnight, the legend\'s ramp back, no coral row; asserted)' },
  // A cleared date (as a half-typed one leaves the input's value): marked and said; the light keeps the last whole date.
  // On a phone, the Moon's controls and facts in the sheet.
  { name: 'site-sun-nodate', seq: 'sun', refNA: true, steps: [{ scroll: '#panel', to: '[data-sun]' }, { fill: '#sun-d', text: '' }, { seek: 5 },
    { expect: '#sun-d[aria-invalid="true"][aria-describedby="sun-de"]' }, { expect: '#sun-de:not([hidden])' }, { expect: '#sun-h[aria-valuetext*="below the horizon"]' }],
    check: 'The date field\'s coral edge and "Not a whole date: the sun stays as on 2026-11-15."; the block, map and facts unchanged (midnight, below the horizon); the Date in the lunar day label, the four facts' },
  // The orbital image under the set sun: its own light stays in it, but it goes as dark as the tint where that sun
  // doesn't reach (here midnight: all but the summit).
  { name: 'site-sun-drape', seq: 'sun', refNA: true, steps: [{ tap: '[data-drape]' }, { until: '#tui0.draped' }, { seek: 5.5 }],
    check: 'The image draped at midnight: dark but for the summit the sun still reaches, not the image\'s own daylight' },
  // By the keyboard: the slider takes the arrows (a quarter hour each), keeps its focus, says the sun as it moves.
  { name: 'site-sun-kb', seq: 'sunkb', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#sun-on').click()" }, { scroll: '#panel', to: '[data-sun]' },
    { eval: "document.querySelector('#sun-h').focus()" }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { seek: 3.5 },
    { eval: "{ const h = document.querySelector('#sun-h'); if (document.activeElement !== h || h.value !== '10' || document.querySelector('.srange output').textContent !== '10:00') throw new Error(`slider ${h.value}, focus on ${document.activeElement?.id}`); }" }],
    check: 'Jezero, the control on at 09:00 (now), four arrows on: 10:00, the slider focused with its ring (asserted), the sun higher in the east, Season Ls on Mars' },
  // On to compare with the control on: the set sun doesn't apply there (Decisions 186), and its panel says so.
  { name: 'compare-sun', seq: 'sunkb', refNA: true, steps: [{ route: '#/mars/jezero/compare/salda' }, { seek: 3 }, { expect: '.minis + .mcap' }],
    check: 'Compare as ever (both lit from the north-west, 315°), a line under the minis: the sun you set lights the site view only' },

  // The slope hazard layer under the site map (Stretch 2): the block and map greyed, their slopes over 15° coral, the key
  // in the panel and in the stage's legend.
  { name: 'site-slope-jezero', seq: 'slope', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { expect: '#tui0.steep .legend .sk' }, { expect: '[data-slope] .skey' }, { expect: 'canvas[data-map][aria-label$="slopes over 15° in coral"]' }],
    check: 'Jezero greyed, the crater\'s inner walls coral on block and map alike; the panel\'s key "Over 15°: … km² of the 60 × 60 km shown" and the spacing line (314 m); the stage legend\'s coral row, its ramp gone (asserted present)' },
  // With the orbital image draped: the image greyed under the same coral.
  { name: 'site-slope-drape', seq: 'slope', refNA: true, steps: [{ tap: '[data-drape]' }, { until: '#tui0.draped' }, { seek: 4 }],
    check: 'The image draped and greyed, the steep walls still coral over it' },
  // Held for the session: on to compare, both blocks and both minis tinted, the checkbox under the minis.
  { name: 'compare-slope', seq: 'slope', refNA: true, steps: [{ route: '#/mars/jezero/compare/salda' }, { seek: 3 }, { expect: '#tui0.steep .legend .sk' }, { expect: '#tui1.steep .legend .sk' },
    { expect: '[data-terr] + [data-slope] #slope-on:checked' }, { expect: '.minis canvas[data-map][aria-label$="slopes over 15° in coral"]' }],
    check: 'Compare greyed both sides: Jezero\'s window all grey (0.0 km² over 15° in the table), Lake Salda\'s steep shore and hills coral, on blocks and minis alike; each legend\'s coral row, no ramp; the checkbox, checked, under the table (asserted)' },
  // Its overlay: one legend, a row per world, their ramps hidden (columns kept), the key under them; the panel at the
  // table, the checkbox under it.
  { name: 'compare-slope-overlay', seq: 'slope', refNA: true, steps: [{ route: '#/mars/jezero/compare/salda/overlay' }, { seek: 3 }, { scroll: '#panel', to: '[data-terr]' }, { seek: 3.2 },
    { expect: '#tui0.ov.steep .legend .sk' }],
    check: 'The overlay greyed, Salda\'s coral through the ghost; the legend\'s two rows with their ranges, no ramps, and the coral row; the table\'s "Slopes over 15°" (0.0 and 28.5 km²) with the checkbox under it' },
  // By the keyboard, at the Moon's south pole: Space on the checkbox, which keeps its focus.
  { name: 'site-slope-kb', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-slope]' }, { eval: "document.querySelector('#slope-on').focus()" }, { press: 'Space' }, { seek: 3.5 },
    { expect: '#slope-on:checked:focus' }, { expect: '#tui0.steep' }],
    check: 'Malapert: the massif\'s flanks coral, the plains grey; the checkbox checked and still focused with its ring (asserted)' },
  // Where the source is coarser than the samples, the caveat gives its spacing: GLO-30's 30 m, not the samples' 21 m.
  { name: 'site-slope-meteor', route: '#/earth/meteor', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { seek: 3.5 }, { expect: '#tui0.steep' },
    { eval: "{ const t = document.querySelector('[data-slope]').textContent; if (!t.includes('the elevation’s own 30 m spacing')) throw new Error(t); }" }],
    check: 'Meteor Crater (4 km, samples 21 m apart): its walls a coral ring on block and map; the caveat says GLO-30\'s own 30 m (asserted)' },
  // A Moon pin near the south pole away from the featured sites reads the 1 km cap: the caveat says 1,000 m, as the
  // terrain's credit says "resampled to 1 km", not the samples' 314 m.
  { name: 'site-slope-polar', route: '#/moon/@-86.5000,120.0000', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { scroll: '#panel', to: '[data-slope]' }, { seek: 3.5 },
    { eval: "{ const t = document.querySelector('[data-slope]').textContent; if (!t.includes('the elevation’s own 1,000 m spacing') || t.includes('illustrative')) throw new Error(t); }" }],
    check: 'A polar Moon pin on the 1 km cap: "Measured over the elevation\'s own 1,000 m spacing" (asserted), no illustrative line; the credit "resampled to 1 km" below' },
  // The empty state: Dallol's salt flats, nothing over 15°: the block and map all grey, "Over 15°: 0.0 km²".
  { name: 'site-slope-flat', route: '#/earth/dallol', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { eval: "{ const t = document.querySelector('[data-slope] .skey').textContent; if (!t.includes('Over 15°: 0.0')) throw new Error(t); }" }],
    check: 'Dallol greyed throughout, no coral on block or map; the key "Over 15°: 0.0 km² of the 16 × 16 km shown" (asserted)' },
  // A pin's terrain is illustrative: so are its slopes, and the panel says so.
  { name: 'site-slope-pin', route: '#/mars/@-14.0000,175.0000', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { scroll: '#panel', to: '[data-slope]' }, { seek: 3.5 },
    { eval: "{ const t = document.querySelector('[data-slope]').textContent; if (!t.includes('illustrative, and so are its slopes')) throw new Error(t); }" }],
    check: 'A Mars pin: the key, and "The terrain here is illustrative, and so are its slopes." (asserted)' },

  // Profile and measure (Stretch 3): a line on the site map, typed (the keyboard's way), dragged, clicked or tapped, its
  // length on the body's radius and the ground's cross-section under the map. `prof` asserts the chart and its words.
  { name: 'site-measure-on', seq: 'measure', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ms-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { expect: '#ms-on:checked' }, { expect: '#ms-msg:not(.ok)' }, { expect: '#pin:not(:has(svg[data-prof]))' },
    { eval: "{ const a = document.querySelector('#ms-a'), b = document.querySelector('#ms-b'); if (a.value || b.value || a.placeholder !== '18.38° N, 77.58° E' || !b.placeholder) throw new Error(`${a.value} | ${a.placeholder}`); }" }],
    check: 'On, no line yet: the caption "Drag across it, or click at each end" (phone: "Tap the map at each end of a line."), the From (A) and To (B) fields empty with their examples (A the map\'s centre, asserted; B east of it), the help line; Sunlight below as before' },
  { name: 'site-measure-typed', seq: 'measure', refNA: true, steps: [{ fill: '#ms-a', text: '18.30N 77.32E' }, { fill: '#ms-b', text: '18.45N 77.80E' }, { press: 'Enter' }, { seek: 4 },
    { expect: 'svg[data-prof][aria-label*="from A to B"]' }, { expect: '#ms-msg.ok' }, { inView: '#ms-msg' },
    { eval: "{ const a = document.querySelector('#ms-a').value, t = document.querySelector('#ms-msg').textContent; if (a !== '18.3000° N, 77.3200° E' || !/^\\d+\\.\\d km from A to B, [\\d,]+ m (higher|lower) at B\\.$/.test(t)) throw new Error(`${a} | ${t}`); }" }],
    check: 'Typed ends, Enter: the coral line from A (west plains) over the crater rim to B on the map, its ends lettered, "28.4 km" by B; the fields rewritten to 4 dp; the status line "… km from A to B, … at B." (asserted), in view (asserted; on a phone the sheet scrolled to it)' },
  { name: 'site-measure-result', seq: 'measure', refNA: true, steps: [{ scroll: '#panel', to: '.prof' }, { hover: 'svg[data-prof]', fx: .45, fy: .5 }, { seek: 4.2 },
    { eval: "{ const o = document.querySelector('.prof output').textContent; if (!/ km · −[\\d,]+ m$/.test(o)) throw new Error(o); }" }],
    check: 'The cross-section: coral line over a faint coral fill, the rim\'s rise, highest and lowest labelled, A and B with the distance; the hover rule, dot and readout "… km · −… m" (asserted); the four facts; the great-circle and spacing line' },
  { name: 'site-measure-err', seq: 'measure', refNA: true, steps: [{ scroll: '#panel', to: '[data-meas]' }, { fill: '#ms-b', text: '18.95N 77.58E' }, { press: 'Enter' }, { seek: 4.5 },
    { expect: '#ms-b[aria-invalid="true"]:focus' }, { expect: '#ms-msg.err' },
    { eval: "{ const t = document.querySelector('#ms-msg').textContent; if (t !== 'B is outside the map’s 60 × 60 km square.') throw new Error(t); }" }],
    check: 'B past the map\'s north edge: the coral edge on To (B), focused, and "B is outside the map\'s 60 × 60 km square." (asserted); the last line and chart kept' },
  { name: 'site-measure-same', seq: 'measure', refNA: true, steps: [{ fill: '#ms-b', text: '18.30N 77.32E' }, { press: 'Enter' }, { seek: 4.6 },
    { expect: '#ms-b[aria-invalid="true"]:focus' }, { expect: '#ms-msg.err' }, { expect: 'svg[data-prof]' },
    { eval: "{ const t = document.querySelector('#ms-msg').textContent; if (t !== 'A and B are the same point: put B somewhere else.') throw new Error(t); }" }],
    check: 'B typed as A: an error like the others, To (B) marked and focused, "A and B are the same point: put B somewhere else." in coral (asserted); the last line and chart kept' },
  { name: 'site-measure-empty', seq: 'measure', refNA: true, steps: [{ fill: '#ms-a', text: '' }, { press: 'Enter' }, { seek: 4.7 },
    { expect: '#ms-a[aria-invalid="true"]:focus' }, { expect: '#ms-msg.err' },
    { eval: "{ const t = document.querySelector('#ms-msg').textContent; if (t !== 'Enter A’s coordinates.') throw new Error(t); }" }],
    check: 'A emptied: From (A) marked and focused, "Enter A\'s coordinates." (asserted)' },
  { name: 'site-measure-garbled', seq: 'measure', refNA: true, steps: [{ fill: '#ms-a', text: '18.3N 77.3Q' }, { press: 'Enter' }, { seek: 4.8 },
    { expect: '#ms-a[aria-invalid="true"]:focus' }, { expect: '#ms-msg.err' },
    { eval: "{ const t = document.querySelector('#ms-msg').textContent; if (t !== 'A: Unrecognised “Q”. Use numbers, °′″ and N, S, E or W.') throw new Error(t); }" }],
    check: 'A garbled: the parser\'s own message after "A: " (asserted), From (A) marked and focused' },
  // A mouse: a drag draws the line; then a click puts down A alone, the next one B.
  { name: 'site-measure-drag', seq: 'measuredrag', only: 'desktop', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ms-on').click()" }, { scroll: '#panel', to: '.map' },
    { drag: 'canvas[data-map]', fx: .2, fy: .55, tx: .62, ty: .4 }, { seek: 3.5 }, { expect: 'svg[data-prof]' }, { eval: "{ if (!document.querySelector('#ms-a').value) throw new Error('no A'); }" }],
    check: 'Dragged west to east across the delta and crater floor: the line on the map, the chart under it, the fields filled' },
  { name: 'site-measure-click', seq: 'measuredrag', refNA: true, steps: [{ tap: 'canvas[data-map]', fx: .3, fy: .25 }, { seek: 3.7 }, { expect: '#pin:not(:has(svg[data-prof]))' },
    { eval: "{ const t = document.querySelector('#ms-msg').textContent; if (t !== 'A is set: click the map again for B.' || document.querySelector('#ms-b').value) throw new Error(t); }" }],
    check: 'One click: A alone on the map, From (A) filled, To (B) empty, "A is set: click the map again for B." (asserted), no chart' },
  { name: 'site-measure-click2', seq: 'measuredrag', refNA: true, steps: [{ tap: 'canvas[data-map]', fx: .7, fy: .8 }, { seek: 3.9 }, { expect: 'svg[data-prof]' }],
    check: 'The second click: B, the line north-west to south-east over the rim, the chart' },
  // A pin's map moves the pin on a click; measuring, a click is a line's end and the pin stays. Its terrain illustrative.
  { name: 'site-measure-pin', seq: 'measurepin', route: '#/mars/@-14.0000,175.0000', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ms-on').click()" }, { scroll: '#panel', to: '.map' },
    { tap: 'canvas[data-map]', fx: .25, fy: .3 }, { tap: 'canvas[data-map]', fx: .8, fy: .7 }, { seek: 3.5 }, { expect: 'svg[data-prof]' },
    { eval: "{ const t = document.querySelector('[data-msr]').textContent; if (location.hash !== '#/mars/@-14.0000,175.0000' || !t.includes('illustrative, and so is its profile')) throw new Error(location.hash); }" }],
    check: 'Two clicks on a pin\'s map: a line, not a move (the route unchanged, asserted); "illustrative, and so is its profile" (asserted)' },
  { name: 'site-measure-off', seq: 'measurepin', refNA: true, steps: [{ eval: "document.querySelector('#ms-on').click()" }, { seek: 3.7 },
    { expect: '#ms-on:not(:checked)' }, { expect: '#pin:not(:has(#ms-a)):not(:has(svg[data-prof]))' },
    { eval: "{ const t = document.querySelector('.mcap').textContent; if (!/^(Hover the map for coordinates and elevation\\. Click|Tap the map) to move the pin\\.$/.test(t)) throw new Error(t); }" }],
    check: 'Measure off on the pin: the line gone from the map, the fields and chart gone, the caption back to "… Click to move the pin." (phone "Tap the map to move the pin.", asserted)' },
  // Earth: its radius, and longitudes west.
  { name: 'site-measure-earth', route: '#/earth/haughton', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ms-on').click()" },
    { fill: '#ms-a', text: '75.33N 89.80W' }, { fill: '#ms-b', text: '75.43N 89.55W' }, { press: 'Enter' }, { scroll: '#panel', to: '.map' }, { seek: 3.5 }, { expect: 'svg[data-prof]' },
    { eval: "{ const a = document.querySelector('#ms-a').value, t = document.querySelector('[data-msr]').textContent; if (a !== '75.3300° N, 89.8000° W' || !t.includes('on Earth’s 6,371 km radius')) throw new Error(a); }" }],
    check: 'Haughton: the line across the crater, its length by B; the fields in ° W (asserted); "Earth\'s 6,371 km radius" (asserted)' },
  // The line over the slope hazard's coral: pale, on its dark casing.
  { name: 'site-measure-slope', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#slope-on').click()" }, { eval: "document.querySelector('#ms-on').click()" },
    { scroll: '#panel', to: '.map' }, { tap: 'canvas[data-map]', fx: .2, fy: .3 }, { tap: 'canvas[data-map]', fx: .78, fy: .62 }, { seek: 3.5 }, { expect: 'svg[data-prof]' }, { expect: '#tui0.steep' }],
    check: 'Malapert tinted, the line across the massif\'s coral flanks: pale on its dark casing, it reads over coral and grey; the ends coral, the length by B' },
  // Touch: two taps draw the line; a swipe on the map still scrolls the sheet and leaves the line.
  { name: 'site-measure-touch', seq: 'measuretouch', only: 'phone', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ms-on').click()" }, { scroll: '#panel', to: '.map' },
    { touch: 'canvas[data-map]', fx: .25, fy: .4 }, { touch: 'canvas[data-map]', fx: .75, fy: .6 }, { seek: 3.5 }, { expect: 'svg[data-prof]' }],
    check: 'Two taps on Malapert\'s map: the line over the massif, its length by B on the map (the result below the fold), "Tap the map at each end of a line."' },
  { name: 'site-measure-swipe', seq: 'measuretouch', refNA: true, steps: [{ eval: "window.__top = document.querySelector('#panel').scrollTop" },
    { touch: 'canvas[data-map]', fx: .5, fy: .7, dy: -220, hold: 100 }, { seek: 4 },
    { eval: "{ const p = document.querySelector('#panel').scrollTop; if (p < window.__top + 100 || !document.querySelector('svg[data-prof]') || !document.querySelector('#ms-b').value) throw new Error(`${window.__top} → ${p}`); }" }],
    check: 'A swipe up on the map scrolls the sheet (asserted), the line kept: the chart and facts in view' },
  { name: 'site-measure-tap', seq: 'measuretouch', refNA: true, steps: [{ scroll: '#panel', to: '.prof' }, { touch: 'svg[data-prof]', fx: .55, fy: .5 }, { seek: 4.2 },
    { expect: '.prof .hov[visibility="visible"]' }, { eval: "{ const o = document.querySelector('.prof output').textContent; if (!/ km · [−\\d,]+ m$/.test(o)) throw new Error(o); }" }],
    check: 'A finger\'s tap on the chart: the rule, dot and readout stay after it lifts (asserted)' },

  // The landing ellipse (Stretch 4): a mission's ellipse at its true size round the site's centre on the block and the
  // map, its long axis turned, the share of it over 15° in the panel. `ellT` asserts the panel's text.
  { name: 'site-ellipse-jezero', seq: 'ellipse', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { expect: '#cap0 .s.ell' }, { expect: 'canvas[data-map][aria-label$="with the Perseverance landing ellipse"]' }, { expect: '#ell-m' }, { expect: '#ell-az[aria-valuetext="90°, east–west"]' },
    { eval: ellT('The size of Perseverance’s ellipse', nb('7.7 × 6.6 km'), '39.9', `Not where it landed: Perseverance came down ${nb('8 km')} north-west of the crosshair, at Octavia E. Butler Landing`) }],
    check: 'Jezero: Perseverance\'s 7.7 × 6.6 km ellipse, long axis east–west, coral on its dark casing round the crater floor\'s centre on block and map alike; the caption "Perseverance, 7.7 × 6.6 km" after the outline glyph (asserted); the facts (size, 39.9 km², over 15°, 90° east–west), the source line citing the size only and, its own site, where it really landed, 8 km north-west (asserted)' },
  { name: 'site-ellipse-turn', seq: 'ellipse', refNA: true, steps: [{ scroll: '#panel', to: '[data-ell]' }, { eval: "document.querySelector('#ell-az').focus()" },
    ...Array(9).fill({ press: 'ArrowLeft' }), { seek: 4 }, { expect: '#ell-az:focus[aria-valuetext="45°, north-east–south-west"]' },
    { eval: "{ const o = document.querySelector('.ell .srange output').textContent; if (o !== '45°') throw new Error(o); }" }],
    check: 'Nine arrows left: the long axis at 45°, north-east–south-west, on block and map; the slider focused with its ring, its value and the Long axis fact in step (asserted)' },
  { name: 'site-ellipse-curiosity', seq: 'ellipse', refNA: true, steps: [{ eval: "document.querySelector('#ell-m').focus()" }, { select: '#ell-m', value: 'curiosity' }, { scroll: '#panel', to: '.map' }, { seek: 4.5 },
    { expect: '#ell-m:focus' }, { eval: ellT('The size of Curiosity’s ellipse', nb('20 × 7 km'), '110.0') },
    { eval: "if (document.querySelector('[data-ell]').textContent.includes('Not where it landed')) throw new Error('a landing line off its own site')" }],
    check: 'Curiosity\'s 20 × 7 km at 45°: the long ellipse over the crater floor and its rim; the select keeps the focus, its option whole ("Curiosity, 20 × 7 km", clear of the chevron); 110.0 km² (asserted); the source line cites the size, and Jezero isn\'t Curiosity\'s site, so no landing line (asserted)' },
  { name: 'site-ellipse-slope', seq: 'ellipse', refNA: true, steps: [{ eval: "document.querySelector('#slope-on').click()" }, { scroll: '#panel', to: '[data-ell]' }, { seek: 5 }, { expect: '#tui0.steep' }, { expect: '#cap0 .s.ell.pale' },
    { eval: "{ const t = document.querySelector('[data-ellr] .facts').textContent; if (!/Over 15°(None|Under 0\\.01|0\\.\\d\\d)/.test(t)) throw new Error(t); }" }],
    check: 'With the slope tint: the ellipse pale on its casing over the grey and the walls\' coral on the block, the caption\'s outline pale with it (asserted); the section in view, the share over 15° in the facts (asserted)' },
  { name: 'site-ellipse-off', seq: 'ellipse', refNA: true, steps: [{ eval: "document.querySelector('#slope-on').click()" }, { eval: "document.querySelector('#ell-on').click()" }, { seek: 5.5 },
    { expect: '#cap0:not(:has(.ell))' }, { expect: 'canvas[data-map]:not([aria-label*="ellipse"])' }, { expect: '[data-ell] #ell-on:not(:checked)' }, { expect: '#pin:not(:has(#ell-m))' }],
    check: 'Off: no ellipse on block or map, the caption\'s line gone, the section back to its checkbox and line (asserted)' },
  // Held for the session, the site view only: compare shows the engine's windows, no ellipse.
  { name: 'compare-ellipse', seq: 'ellipse', refNA: true, steps: [{ eval: "document.querySelector('#ell-on').click()" }, { route: '#/mars/jezero/compare/salda' }, { seek: 3 },
    { expect: '#cap0:not(:has(.ell))' }, { expect: '#pin:not(:has([data-ell]))' }],
    check: 'Compare as ever: no ellipse on either block or mini, no caption line, no section (asserted)' },
  // The Moon: Artemis's crewed lander, within 100 m of its target, a 200 m circle: a coral dot in the crosshair at
  // Malapert's 60 km, finer than the elevation; then Apollo 11's long ellipse across the massif.
  { name: 'site-ellipse-artemis', seq: 'ellipsemoon', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 },
    { expect: '#pin:not(:has(#ell-az))' }, { eval: ellT(`within ${nb('100 m')} of its target`, 'a ring marks it, larger than its true size') }],
    check: 'Malapert: Artemis HLS by default, its 200 m circle a coral dot at the centre, too small to see, so ringed: on the map a coral ring 22 px across on its casing round the crosshair, on the block a ring as wide round the dot, clear of the contour labels; no axis slider (asserted)' },
  { name: 'site-ellipse-artemis-facts', seq: 'ellipsemoon', refNA: true, steps: [{ scroll: '#panel', to: '[data-ell]' }, { seek: 3.7 },
    { eval: ellT(nb('200 m') + 'Across, a circle', 'AnyA circle', 'a ring marks it, larger than its true size', 'more than the ellipse is wide') }],
    check: 'The section in view: Size "200 m" over "Across, a circle", Long axis "Any" over "A circle" (asserted), the share over 15°; the fine print: the source, the ring "larger than its true size", the slopes measured over more than the ellipse is wide (asserted)' },
  { name: 'site-ellipse-apollo', seq: 'ellipsemoon', refNA: true, steps: [{ select: '#ell-m', value: 'apollo11' }, { scroll: '#panel', to: '[data-ell]' }, { seek: 4 },
    { expect: '#ell-az' }, { eval: ellT('Tranquility Base', nb('18.5 × 4.8 km'), '69.7') },
    { eval: "{ const t = document.querySelector('[data-ellr] .facts').textContent; if (!/Over 15°0\\.\\d\\d/.test(t) || /Over 15°0\\.0[0-9]/.test(t)) throw new Error(t); }" }],
    check: 'Apollo 11\'s 18.5 × 4.8 km east–west across the massif: a large share over 15° on its flanks; the slider back (asserted)' },
  // Earth: both worlds' missions, grouped; Perseverance's ellipse is wider than Meteor Crater's 4 km square.
  { name: 'site-ellipse-meteor', route: '#/earth/meteor', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" }, { scroll: '#panel', to: '[data-ell]' }, { seek: 3.5 },
    { expect: '#ell-m optgroup[label="Mars"] + optgroup[label="Moon"]' }, { eval: ellT(`runs past the map’s ${nb('4 × 4 km')} square: the share is of the 16.0`) }],
    check: 'Meteor Crater: the ellipse wider than the map, so neither block nor map shows its edge; Mars and Moon groups in the select; "It runs past the map\'s 4 × 4 km square: the share is of the 16.0 km² inside it." (asserted: the whole square, exactly)' },
  // A mission's own site: the ellipse has NASA's size on the site's centre, so the panel says where it really landed.
  { name: 'site-ellipse-gale', route: '#/mars/gale', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" }, { select: '#ell-m', value: 'curiosity' },
    { scroll: '#panel', to: '[data-ell]' }, { seek: 3.5 },
    { eval: ellT('The size of Curiosity’s ellipse', `Not where it landed: Curiosity came down ${nb('52 km')} north-west of the crosshair, at Bradbury Landing, inside NASA’s own ellipse.`) }],
    check: 'Gale, Curiosity\'s own site: its 20 × 7 km on the crater\'s centre, block and map; the fine print cites the size only and says Curiosity came down 52 km north-west of the crosshair, at Bradbury Landing, inside NASA\'s own ellipse (asserted)' },
  // With the other layers: a set sun (a phone's caption four lines: name, body, Lit for, the ellipse), and the orbital
  // image draped with a measured line across the map.
  { name: 'site-ellipse-sun', route: '#/mars/jezero', only: 'phone', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#sun-on').click()" },
    { eval: "document.querySelector('#ell-on').click()" }, { scroll: '#panel', to: '.map' }, { seek: 3.5 }, { expect: '#cap0 .s + .s + .s.ell' }],
    check: 'Phone: the caption\'s four lines (name, Mars 60 × 60 km, Lit for … UTC, Perseverance 7.7 × 6.6 km; asserted) clear of the block and of the image toggle; the ellipse on the block under the set sun and on the map' },
  { name: 'site-ellipse-drape', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" },
    { eval: "document.querySelector('#ms-on').click()" }, { fill: '#ms-a', text: '18.30N 77.32E' }, { fill: '#ms-b', text: '18.45N 77.80E' }, { press: 'Enter' },
    { tap: '[data-drape]' }, { until: '#tui0.draped' }, { scroll: '#panel', to: '.map' }, { seek: 3.5 }, { expect: 'svg[data-prof]' }, { expect: '#cap0 .s.ell' }],
    check: 'The orbital image draped: the ellipse coral on its casing over the image on the block; on the map the measured line (A, B, its length) over the ellipse, both read' },
  // A pin: its terrain illustrative, and so the share.
  { name: 'site-ellipse-pin', route: '#/mars/@-14.0000,175.0000', refNA: true, steps: [{ seek: 3 }, { eval: "document.querySelector('#ell-on').click()" }, { scroll: '#panel', to: '[data-ell]' }, { seek: 3.5 },
    { eval: ellT('illustrative, and so is the share') }],
    check: 'A Mars pin: the ellipse on its block and map; "The terrain here is illustrative, and so is the share." (asserted)' },

  // Sites.
  { name: 'site-jezero', route: '#/mars/jezero', steps: [{ seek: 3 }], check: 'Map edges labelled, hover readout' },
  // A retina screen (Must 10): at 1280 × 800 the scene draws at a ratio of 1.56, not the reference's 2 (phones keep 2).
  { name: 'body-mars-zoomed-2x', route: '#/mars', scale: 2, steps: [{ seek: 2.5 }, { wheel: { dx: 0, dy: -500 }, at: '#gl' }, { seek: 4 }], check: 'Device scale 2 (build: scene at 1.56 on desktop): relief and glows as at 2; graticule lines a little heavier and softer, labels and HUD sharp' },
  { name: 'site-jezero-2x', route: '#/mars/jezero', scale: 2, steps: [{ seek: 3 }], check: 'Device scale 2 (build: scene at 1.56 on desktop): terrain relief as at 2; contours a little heavier and softer, panel text sharp' },
  { name: 'site-moon-south', route: '#/moon/@-86.2000,1.5000', steps: [{ seek: 3 }], check: 'Polar pin: no stretched crop, no banding (terrain from the LOLA polar cap)' },
  { name: 'site-haughton', route: '#/earth/haughton', steps: [{ seek: 3 }], check: 'Map edges labelled' },
  { name: 'site-moon-malapert', route: '#/moon/malapert', steps: [{ seek: 3 }], check: 'Polar featured site: edges and crops in the local projection, footprint centred' },
  // Real data on the demo path (Must 5): Gale and Hadley–Apennine over their DEM patches; the orbital crops cut for the
  // site, with the terrain's and the images' credit lines (Jezero from the Viking MDIM mosaic, Malapert from the LROC
  // WAC polar mosaic over the LOLA polar DEM).
  { name: 'site-gale', route: '#/mars/gale', steps: [{ seek: 3 }], check: 'MOLA–HRSC terrain: Gale crater, Aeolis Mons; the terrain note names the DEM; MDIM crops' },
  { name: 'site-hadley', route: '#/moon/hadley', steps: [{ seek: 3 }], check: 'SLDEM2015 terrain: the rille and the Apennine front; LROC WAC crops' },
  { name: 'site-jezero-media', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'Crops from the MDIM mosaic: Isidis rim (context), Jezero crater (regional), footprint centred; the surface photo (Santa Cruz hill from Perseverance); "Terrain: MOLA–HRSC…", "Images: Viking MDIM 2.1…" and "Surface: Santa Cruz hill, Perseverance Mastcam-Z, 2021 · NASA/JPL-Caltech/ASU/MSSS." credit lines' },
  { name: 'site-malapert-media', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'LROC WAC polar crops in the local projection, shadow black, footprint centred; the surface slot "No lander, rover or crew has photographed this area."; "Terrain: LOLA south polar DEM…" and "Images: LROC WAC south polar mosaic…" credit lines' },
  { name: 'site-hadley-media', route: '#/moon/hadley', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'LROC WAC crops of the Apennine front and the rille; the surface photo (James Irwin and the rover, Mount Hadley behind); "Terrain: SLDEM2015…" and "Surface: James Irwin and the rover, Apollo 15, 1971 · NASA, photograph by David Scott." credit lines' },
  { name: 'site-haughton-media', route: '#/earth/haughton', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'Landsat WELD crops (the crater, Devon Island\'s fjords); the surface photo (two K-10 rovers on the crater\'s rubble); the Copernicus GLO-30 notice in full, "Images: Landsat WELD…" and "Surface: K-10 rovers at Haughton Crater, 2007 · NASA, photograph by Matt Deans."' },
  // Surface photos (Should 5): an established Earth site's NASA field photograph (Atacama, Gale's double); the slot
  // saying plainly why there is none (an established site without one, Utopia beside its lede, a pin outside every
  // featured site); a pin inside Jezero's square showing Perseverance's; a photograph that doesn't load.
  { name: 'site-atacama-media', route: '#/earth/atacama', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'The surface photo (a dry streambed of gravel on an alluvial fan, scientists beyond); "Surface: Dry streambed on an alluvial fan · NASA/UC Berkeley." credit, linked' },
  { name: 'site-hanksville-media', route: '#/earth/hanksville', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'The surface slot "No NASA field photograph of this site." in the slot\'s box, grey, no Surface credit' },
  { name: 'site-utopia-media', route: '#/mars/utopia', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'Lede "Viking 2 and Zhurong region."; the surface slot "No photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south." inside its box, no Surface credit' },
  { name: 'site-pin-media', route: '#/mars/@18.4000,77.5000', refNA: true, steps: [{ seek: 10 }, { scroll: '#panel', to: '.imgs' }],
    check: 'A pin inside Jezero\'s square, 4 km from Perseverance\'s landing: the Santa Cruz photo and its "Surface: Santa Cruz hill, Perseverance Mastcam-Z, 2021 · NASA/JPL-Caltech/ASU/MSSS." credit' },
  { name: 'site-pin-far-media', route: '#/mars/@40.0000,200.0000', refNA: true, steps: [{ seek: 10 }, { scroll: '#panel', to: '.imgs' }],
    check: 'A pin outside every featured site: "No surface photograph on file for this point.", no Surface credit' },
  // A named target at a landing with no featured site (Apollo 11's Tranquility Base, from the IAU list): the landing's
  // photograph, as for any pin whose 18.8 km window holds a landing.
  { name: 'site-tranquillitatis-media', route: '#/moon/Statio%20Tranquillitatis@0.6741,23.4732', refNA: true, steps: [{ seek: 10 }, { scroll: '#panel', to: '.imgs' }],
    check: 'Statio Tranquillitatis: the surface photo (Buzz Aldrin beside the flag, a leg of Eagle at the left) and its "Surface: Buzz Aldrin and the flag, Apollo 11, 1969 · NASA, photograph by Neil Armstrong." credit, linked' },
  { name: 'site-jezero-photo-404', route: '#/mars/jezero', block: '/photos/', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'The photograph refused: the slot reads "The photograph couldn’t be loaded." in the slot\'s box, grey (no broken-image icon or clipped alt text); the "Surface: Santa Cruz hill…" credit stays, linked' },
  // The doubles sit below the map, imagery and purpose: a skip link under the lede says they exist (or that the search
  // is running) and jumps to them. On screen without scrolling at both sizes (inView), the longest lede included.
  { name: 'site-skip', seq: 'skip-link', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { inView: '[data-skip]' }],
    check: '"Earth doubles" with a down chevron under the lede, on screen without scrolling (phone: on the sheet)' },
  { name: 'site-skip-jump', seq: 'skip-link', refNA: true, steps: [{ tap: '[data-skip]' }, { seek: 3.3 }],
    check: 'After the skip link: "Closest Earth doubles" at the top of the panel (phone: the sheet), the cards below' },
  { name: 'site-skip-searching', route: '#/mars/@18.3800,77.5800', refNA: true, steps: [{ seek: 3 }, { inView: '[data-skip]' }],
    check: 'A pin\'s search running (6 s): the link says "Searching Earth…", on screen without scrolling' },
  { name: 'site-skip-malapert', route: '#/moon/malapert', refNA: true, steps: [{ seek: 3 }, { inView: '[data-skip]' }],
    check: 'The longest lede (two lines): "Earth doubles" still on screen without scrolling' },
  // The site data failing to load: procedural terrain, crops cut from the globe, no credit lines (they come with the
  // site manifest); the console shows the two 404s.
  { name: 'site-nodata-fallback', route: '#/mars/jezero', block: '/sites/', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.imgs' }],
    check: 'The archetype terrain ("Illustrative terrain." note), crops cut from the globe with no credit line of their own; the surface photo and its "Surface:" credit stay (photos aren\'t site data)' },
  // Pins on the stage sites (wider than Jezero and Hadley): real terrain from each site's pin patch (Jezero's is
  // engine-mars-pin-done).
  { name: 'site-pin-hadley', route: '#/moon/@26.1322,3.6339', refNA: true, steps: [{ seek: 10 }],
    check: 'A pin at Apollo 15\'s landing site: SLDEM2015 terrain over the 60 km pin view (the rille, the Apennine front), note "Terrain: SLDEM2015…", not "Illustrative terrain."' },
  { name: 'site-pin-gale', route: '#/mars/@-4.5900,137.4400', refNA: true, steps: [{ seek: 10 }],
    check: 'The engine\'s coordinates example, a pin in Gale: MOLA–HRSC terrain over the 80 km pin view (Aeolis Mons\' flank), note "Terrain: MOLA–HRSC…"' },
  // Its crops are cut from Mars's colour map (no file of their own): with the full map held, the empty frames show, not
  // the 1024 px tier's smear (ui/topomap.ts drawCrop); the surface photo is its own file.
  { name: 'site-pin-gale-loading', route: '#/mars/@-4.5900,137.4400', hold: '/textures/mars.jpg', noReady: true, refNA: true,
    steps: [{ until: 'body[data-view="site"]' }, { seek: 10 }, { scroll: '#panel', to: '.imgs' }],
    check: 'The two orbital frames empty (the panel\'s surface-2 ground and 1 px line, as an image still loading), the surface photo beside them; terrain as site-pin-gale' },
  // The globe turns to a south-pole point (reference: clamped at 50° S) and the four polar markers spread apart.
  { name: 'coord-moon-pole', route: '#/moon', steps: [{ seek: 2.5 }, { fill: '#cin', text: '86S 0E' }, { seek: 4 }], check: 'Pole centred; Malapert, Haworth, Nobile and de Gerlache markers apart' },
  // Rendering "Poles": the globe zoomed in on the south pole (the cap replaces the pinched equirectangular map there).
  { name: 'moon-pole-zoomed', route: '#/moon', steps: [{ seek: 2.5 }, { fill: '#cin', text: '86S 0E' }, { seek: 4 }, { wheel: { dx: 0, dy: -500 }, at: '#gl' }, { seek: 5.5 }], check: 'South pole up close: craters from the polar cap, no pinch or radial streaks at the pole' },

  // Compare, then the Globe toggle (as a route change, since the toggle sits under the sheet on phones in the reference).
  { name: 'compare-jezero-salda', seq: 'compare', route: '#/mars/jezero/compare/salda', steps: [{ seek: 3 }], check: 'Both terrains at matching framing, both blocks and both minis lit from the north-west like the twins (Decisions 185): Salda\'s bowl reads as a bowl' },
  { name: 'compare-globe', seq: 'compare', steps: [{ route: '#/mars/jezero/compare/salda/globe' }, { seek: 2.5 }], check: 'Globe compare, same-scale toggle' },
  // Compare with a search result: the double is an Earth pin at the Jezero example's first cell (data seam, Must 3),
  // as terrain, then as globes (the result markers on Earth).
  { name: 'compare-jezero-cell', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }], check: 'Double from the search results: country, coordinates, shape match, Earth terrain at the cell' },
  { name: 'compare-globe-cell', route: '#/mars/jezero/compare/@34.6750,-105.0750/globe', refNA: true, steps: [{ seek: 3 }], check: 'Globe compare with a result: the five result markers on Earth, the selected one marked, Jezero markers on Mars' },
  { name: 'compare-globe-held-20s', route: '#/mars/jezero/compare/@34.6750,-105.0750/globe', refNA: true, steps: [{ seek: 23 }],
    check: 'As compare-globe-cell 20 s on (Decisions 8): both sites still centred, each terminator moved, each half\'s stars turned about its own body\'s axis' },
  // Results rework 2/4: the engine's twin hillshades on the compare (Jezero by name: the engine's target image; Arcadia,
  // searched by coordinates, has none: its twin is drawn from its window's elevation), and the results as Earth pins
  // on the globe, each a footprint square over the established sites' faint circles; Arcadia's 2nd double lies inside
  // Hanksville: its square ringed, its label tagged.
  { name: 'compare-twins', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3:has(+ .twins)' }], check: 'Terrain twins: Jezero\'s window beside the cell\'s, with relief (each stretched to its own range), named, the mock\'s note; the 3D terrain and minis from the same windows' },
  { name: 'compare-twins-point', route: '#/mars/arcadia/compare/@38.4250,-110.7750', refNA: true, steps: [{ seek: 9 }, { scroll: '#panel', to: 'h3:has(+ .twins)' }], check: 'A coordinate target\'s twin drawn from its elevation, beside the Hanksville cell\'s' },
  { name: 'compare-globe-pins', route: '#/mars/arcadia/compare/@38.4250,-110.7750/globe', refNA: true, steps: [{ seek: 9 }], check: 'Earth pins: five footprint squares over faint established-site circles, the selected one coral and ringed, its label "Analog site: Hanksville" (left of the pin where the right edge is near)' },
  // The Hanksville cell unselected (Arcadia's 1st double selected): its ring still says it lies inside an analog site.
  { name: 'compare-globe-tagged', route: '#/mars/arcadia/compare/@39.0750,-117.1750/globe', refNA: true, steps: [{ seek: 9 }], check: 'An unselected tagged pin: ringed square beside the selected coral one; faint established-site circles' },
  // A result whose Earth window the engine can't serve (?mock=noimage: 404 no_image): the twin's placeholder, the
  // frontend's terrain for the cell.
  { name: 'compare-twins-noimage', route: '#/mars/jezero/compare/@34.6750,-105.0750', query: 'mock=noimage', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3:has(+ .twins)' }], check: 'Jezero\'s twin beside "No hillshade for this window"' },
  // The copy the merge shows (?mock=asengine labels the mock's windows and images as the engine's): the terrain note,
  // the twins' note, and the table without the stand-in line.
  { name: 'compare-asengine', seq: 'asengine', route: '#/mars/jezero/compare/@34.6750,-105.0750', query: 'mock=asengine', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3:has(+ .twins)' }], check: 'Twins: "The engine’s hillshades…" (the terrain notes, "The search engine’s elevation…", show only on viewports 520 px or wider: probed at 1700 px)' },
  { name: 'compare-asengine-table', seq: 'asengine', refNA: true, steps: [{ scroll: '#panel', to: '[data-terr]' }, { seek: 3.2 }], check: 'The table without "Where a side’s terrain is illustrative…"' },
  // A side whose terrain is illustrative (Arcadia's, beside Haughton's real elevation): the table says so.
  { name: 'compare-illustrative-table', route: '#/mars/arcadia/compare/haughton', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-terr]' }, { seek: 3.2 }], check: 'Under the table: "Where a side’s terrain is illustrative, so are its values here…"' },
  // Overlay compare (Should 1): the Earth double's block ghosted onto the target's in one viewport at the same scale, the
  // slider between them in the toggle (on a phone, its own row at the top of the sheet, stuck there as the sheet scrolls;
  // between 760 and ~880 px wide too, its own row). By deep link at the default
  // half and half; the slider set to 0 (Jezero alone); End on the keyboard (Earth alone); back to half, the twins.
  { name: 'compare-overlay-50', seq: 'overlay', route: '#/mars/jezero/compare/@34.6750,-105.0750/overlay', refNA: true, steps: [{ seek: 3 }],
    check: 'One viewport, both blocks at one scale, the cell\'s seen through Jezero\'s at half; toggle on Overlay with "● Mars —●— ● Earth", thumb centred; both captions top left; the legend\'s two ramps (Mars, Earth)' },
  { name: 'compare-overlay-0', seq: 'overlay', refNA: true, steps: [{ fill: '#mix input', text: '0' }, { seek: 3.2 }], check: 'Slider at 0: Jezero\'s block alone, as on the terrain compare' },
  { name: 'compare-overlay-100', seq: 'overlay', refNA: true, steps: [{ press: 'End' }, { seek: 3.4 }], check: 'Slider at 100 by the keyboard (End): the cell\'s block alone, thumb at the Earth end, focus ring on the slider' },
  { name: 'compare-overlay-twins', seq: 'overlay', refNA: true, steps: [{ fill: '#mix input', text: '50' }, { scroll: '#panel', to: 'h3:has(+ .twins)' }, { seek: 3.6 }],
    check: 'Terrain twins as one tile, the cell\'s hillshade over Jezero\'s at half, each lightly tinted in its world\'s colour, the two names at either end with their dots; the note ends "Overlaid: the overlay slider sets how much of each shows." On a phone the toggle and slider stuck at the top of the sheet, the twins below them' },
  // Back to the site from the overlay (review fix): the caption had the Earth double's under Jezero's while the curtain
  // closed (a crossfade since Should 12), with no double left in the route. Jezero's terrain and caption alone.
  { name: 'compare-overlay-back', seq: 'overlay', refNA: true, steps: [{ route: '#/mars/jezero' }, { seek: 1.2 }], check: 'The site view: Jezero\'s block and its caption alone ("Mars, 60 × 60 km"), one ramp; no console error' },
  // From Terrain by the toggle, half a second in: the Earth viewport narrows away while the ghost is already on.
  { name: 'compare-overlay-toggle', route: '#/mars/jezero/compare/salda', refNA: true, steps: [{ seek: 3 }, { tap: '#toggle [data-view="overlay"]' }, { seek: 3.5 }],
    check: 'Mid-move from Terrain to Overlay, no curtain: Salda\'s half narrowing on the right, Salda already ghosted on Jezero on the left; toggle on Overlay, the slider shown' },
  // An established site, with its lake: the arid ramp ghosted on the Mars one.
  { name: 'compare-overlay-salda', route: '#/mars/jezero/compare/salda/overlay', refNA: true, steps: [{ seek: 3 }], check: 'Lake Salda ghosted onto Jezero at half, both lit from the north-west so the relief keeps its shading, the lake visible through the crater; no twins (not a search result). On a phone the block smaller and up-left: below both captions, the legend\'s plate (its two rows, the contour line for screen readers only) clipping only its front corner' },
  // A target without elevation data (the Moon beyond 60°): the note says so for the Moon's block only; Moon and Earth ramps.
  { name: 'compare-overlay-nodem', route: '#/moon/malapert/compare/haughton/overlay', refNA: true, steps: [{ seek: 3 }],
    check: 'Haughton ghosted onto Malapert; legend rows "● Moon … 1,377 m to 5,167 m", "● Earth … 51 m to 344 m", "Contours every 500 m (Moon) and 25 m (Earth)" (desktop; on a phone for screen readers only); note (desktop) "No elevation data here for the search engine…" once, then "Moon: LOLA south polar DEM, 240 m. Earth: Copernicus DEM GLO-30."; slider "● Moon —●— ● Earth"' },
  // One illustrative side (Arcadia's, against Haughton's real elevation): the note says which block is illustrative.
  { name: 'compare-overlay-illustrative', route: '#/mars/arcadia/compare/haughton/overlay', refNA: true, steps: [{ seek: 3 }],
    check: 'Note (desktop) "Mars: illustrative terrain. Earth: Copernicus DEM GLO-30."; the contour line attributed if the intervals differ' },
  // The overlay before a booking step: the slider stays in the toggle (it drives the ghost on the stage behind the plan).
  { name: 'compare-overlay-book', route: '#/mars/jezero/compare/@34.6750,-105.0750/overlay/book/plan', refNA: true, steps: [{ seek: 3 }],
    check: 'The plan step in the panel; the toggle on Overlay with its slider; the ghosted blocks on the stage' },
  // A twin without its hillshade (?mock=noimage): not ghosted over the other; side by side, the note without its overlay line.
  { name: 'compare-overlay-noimage', route: '#/mars/jezero/compare/@34.6750,-105.0750/overlay', query: 'mock=noimage', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3:has(+ .twins)' }, { seek: 3.2 }],
    check: 'Jezero\'s twin (Mars-tinted, dot) beside "No hillshade for this window", not ghosted; the note without "Overlaid: …"' },
  // A swap after a later same-key route (review fix; since Should 12 the swap is at once): Salda to Haughton, then Overlay 0.1 s later.
  { name: 'compare-overlay-race', route: '#/mars/jezero/compare/salda', refNA: true, steps: [{ seek: 3 }, { route: '#/mars/jezero/compare/haughton' }, { seek: .1 }, { route: '#/mars/jezero/compare/haughton/overlay' }, { seek: 2 }],
    check: 'Haughton ghosted onto Jezero (both blocks in the one viewport), not Jezero alone; both captions; two legend rows' },

  // Edge states (mock modes), the panel scrolled to its foot, where the doubles are.
  { name: 'edge-slow', route: '#/mars/jezero', query: 'mock=slow', refNA: true, steps: [{ seek: 1.5 }, { scroll: '#panel' }], check: 'Loading holds the frame: five skeleton cards under "Closest Earth doubles" (a search by name, slow)' },
  { name: 'edge-empty', route: '#/mars/jezero', query: 'mock=empty', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'No-match copy above the rows' },
  { name: 'edge-empty-filtered', route: '#/mars/jezero', query: 'mock=empty', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { tap: '.filt summary' }, { select: '#country', value: 'Australia' },
    { seek: 3.5 }, { scroll: '#panel', to: '[data-doubles]' }, { expect: '[data-doubles] .lede ~ .actions [data-filters-clear]' }], check: 'No close analog under a filter: "Filters narrow where on Earth the search looks…" and Clear filters above the cards' },
  { name: 'edge-fail', route: '#/mars/jezero', query: 'mock=fail', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel' }], check: 'Error box: "The search engine didn’t answer", "It may be offline or restarting.", Try again' },
  // A search by name with filters (~0.3 s, spec §3.5 live): the inline skeleton, 0.1 s in.
  { name: 'edge-skeleton', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { tap: '.filt summary' }, { select: '#country', value: 'Australia' },
    { seek: 3.1 }, { scroll: '#panel', to: '[data-doubles]' }, { expect: '[data-doubles] .skel:not(.late)' }], check: 'Five skeleton cards under "Closest Earth doubles" while the filtered search runs' },
  // A slow search by name from the body view holds the frame on the globe like a pin's ("Loading holds the frame").
  { name: 'edge-slow-dive', route: '#/mars', query: 'mock=slow', refNA: true, steps: [{ seek: 2.5 }, { route: '#/mars/jezero' }, { seek: 3 }], check: 'Held on the globe over Jezero: "Site acquired", Matching "Searching Earth" (no bar), the status hint' },
  // A no_dem answer landing after the terrain swap (a slow engine): the terrain's note follows it.
  { name: 'edge-slow-nodem', route: '#/moon/malapert', query: 'mock=slow', refNA: true, steps: [{ seek: 11 }], check: 'Terrain note "No elevation data here…" (viewports 520 px and wider), the panel\'s no-elevation box' },

  // Reduced motion and no WebGL.
  // Rendering "First paint": the static title frame that paints before the scene (the textures held, so it stays).
  { name: 'poster', route: '#/', hold: '/textures/', noReady: true, refNA: true, steps: [{ wait: 1500 }], check: 'First paint on #/: the intro\'s first frame (Earth\'s air edge on, the horizon glow; no wordmark), "Loading the Moon, Mars and Earth" where the brief comes in' },
  { name: 'poster-deep', route: '#/system', hold: '/textures/', noReady: true, refNA: true, steps: [{ wait: 1500 }], check: 'First paint on a deep link: the title\'s ground, lockup (the mark drawn), coral wordmark, a drawn globe with its sun placed as in the title (phone: clear of the lockup), "Loading the Moon, Mars and Earth"' },
  { name: 'reduced-motion', seq: 'rm', route: '#/', reducedMotion: true, steps: [{ seek: 2 }], check: 'Crossfades only (all intro lines at once); the poster gone at once; telemetry and the frame\'s counter without flashes' },
  { name: 'reduced-motion-title', seq: 'rm', steps: [{ seek: 9 }], check: 'Reduced motion, past the intro: the title at once (no pull-back), wordmark revealed, sun on the limb, grain still; its clouds on, not drifting' },
  // The no-WebGL page (plan, Should: fallback without WebGL): the title as a poster, then the featured sites with their
  // doubles from each site's search (by name at once; by coordinates 6 s each, one at a time: all in by 42 s).
  { name: 'no-webgl', seq: 'nogl', route: '#/system', noWebGL: true, steps: [{ seek: 1 }], check: 'The title as a poster: the title shot under its lockup, wordmark and blurb; the reason first (white), what Eidolon does (Moon bases and Mars first), Featured sites; desktop: the meta row "Scroll for featured sites"' },
  // The Featured sites button (a real wait: its scroll is smooth).
  { name: 'no-webgl-list', seq: 'nogl', refNA: true, steps: [{ tap: '[data-fb-sites]' }, { wait: 1500 }, { seek: 1.5 }], check: 'Featured sites, its heading 40 px below the top: purpose, the tested line, sample results; the Moon then Mars (desktop: two columns); the south-pole regions\' established sites under "reads Moon terrain only within 60° of the equator"; a named site\'s three closest doubles linked (country, point, shape match, summary), the IAU feature and Jezero\'s banner, the notes all three share once; Mars\'s first search by coordinates "Reading Mars terrain…", the rest "Waiting its turn…"' },
  { name: 'no-webgl-done', seq: 'nogl', refNA: true, steps: [{ seek: 45 }, { scroll: '#gl-fail', to: '#fb-mars-arcadia' }], check: 'Every search in: Mars\'s sites searched by coordinates (Arcadia, then Utopia by name, Meridiani) with their three doubles each, no IAU note or banner on those by coordinates' },
  // A slow engine (every answer 10 s), so the search above Gale's entry (Jezero's) lands after the landing.
  { name: 'no-webgl-deeplink', seq: 'nogl-deep', route: '#/mars/gale/compare/atacama', query: 'mock=slow', noWebGL: true, refNA: true, steps: [{ seek: 1 }], check: 'A deep link without WebGL lands on its site: Gale Crater\'s entry as high as the page scrolls yet (nothing has landed), highlighted (the selected row\'s surface), "The 3D view can’t open here. This view needs WebGL…" under its name; Jezero above it still searching' },
  { name: 'no-webgl-deeplink-later', seq: 'nogl-deep', refNA: true, steps: [{ seek: 12 }], check: 'Jezero\'s search (above it) and Gale\'s own landed meanwhile: Gale\'s entry held at the top (24 px) with its three doubles, kept there until the reader moves' },
  { name: 'no-webgl-click', seq: 'nogl-deep', refNA: true, steps: [{ tap: '#fb-mars-gale ol li:nth-child(3) a' }, { seek: 12.5 }], check: 'A double\'s link clicked on the page: nothing moves (as no-webgl-deeplink-later), Gale still highlighted' },
  // Every search failing (the engine down): each site still lists its established analog sites, unscored.
  { name: 'no-webgl-fail', route: '#/system', query: 'mock=fail', noWebGL: true, refNA: true, steps: [{ seek: 20 }, { scroll: '#gl-fail', to: '#fb-h' }], check: 'Every search failed: each site "The search engine didn’t answer. Reload the page to try again. Meanwhile, its established analog sites, unscored:" with them linked' },
  { name: 'context-lost', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: LOSE }, { until: '#gl-fail .big' }, { seek: 3.5 }],
    check: 'The graphics context lost on a site: the same page over the dead stage, its reason "The 3D view stopped…" first, at the top (no landing on the site: the reason shows); no console errors' },
  // Lost while a campaign plan is being filled (a phone can drop the context while its user picks dates in a calendar):
  // the plan is kept for the tab's session, so the reload the page asks for goes back to it.
  { name: 'context-lost-book', seq: 'lost-book', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/plan', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.days' },
    { tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(6) .day' }, { fill: '#b-team', text: '6' }, { scroll: '#panel', to: '#b-team' },
    { tap: '.ck:has(input[value="rover"])' }, { fill: '#b-notes', text: 'Night drives on the second and third days.' },
    { eval: LOSE }, { until: '#gl-fail .big' }, { seek: 3.5 }],
    check: 'The page over the dead booking step: "The 3D view stopped: the browser lost its graphics context. Your campaign plan is kept: reload the page to go back to it."' },
  { name: 'context-lost-book-reload', seq: 'lost-book', refNA: true, steps: [{ reload: true }, { seek: 3 }, { scroll: '#panel', to: '.days' },
    { expect: '.days li:nth-child(4) .day[aria-pressed="true"]' }, { expect: '#b-team[value="6"]' }, { expect: '.ck input[value="rover"]:checked' }, { expect: '#b-notes:not(:empty)' }],
    check: 'Reloaded: the same plan step, as it was left: days 2 to 6 picked, team 6 and rover (asserted), the notes' },
  // Lost while a pin's search by coordinates runs (5–10 s): the dead app asks no more searches (state.ready), so the
  // page's own, one at a time, aren't called off and every site fills in (the two called each other off for good).
  { name: 'context-lost-pin', seq: 'lost-pin', route: '#/mars/@10.0000,20.0000', refNA: true, steps: [{ seek: 2 }, { eval: LOSE }, { until: '#gl-fail .big' }, { seek: 2.5 }],
    check: 'The page, its reason first; the tab doesn\'t freeze' },
  { name: 'context-lost-pin-done', seq: 'lost-pin', refNA: true, steps: [{ seek: 48 }, { expect: '#gl-fail:not(:has([aria-busy="true"]))' }, { scroll: '#gl-fail', to: '#fb-mars-arcadia' }],
    check: 'Every search in (asserted: no box busy): Arcadia, Meridiani and Elysium (searched by coordinates) with their three doubles each, none "Reading…" or "Waiting its turn"' },
  // The same with a pin clicked on the globe, its search holding the detection frame there (views/site.ts waits on it).
  { name: 'context-lost-pin-held', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { route: '#/mars/@18.3800,77.5800' }, { seek: 3 }, { expect: '#sc3h .pbar' },
    { eval: LOSE }, { until: '#gl-fail .big' }, { seek: 50 }, { expect: '#gl-fail:not(:has([aria-busy="true"]))' }, { scroll: '#gl-fail', to: '#fb-mars-arcadia' }],
    check: 'As context-lost-pin-done: every search in (asserted), Arcadia, Meridiani and Elysium with their doubles' },
  // The link preview's image (`npm run poster` makes public/og.jpg from it): the title at 1200 × 630, device scale 2,
  // without its buttons and scroll hint, which a picture can't offer, and the blurb's first paragraph, which at this
  // height runs under the satellite's tag: the second says what Eidolon does. Without the Earth sites' dots and rings,
  // whose labels the text boxes hide at this size (unlabelled, they read as specks), and the dashed frame, whose foot
  // runs through the blurb; the crosshair, its lines and Eidolon-1 stay. The blurb drops off the limb's glow, its last
  // line on the wordmark's baseline.
  { name: 'og', only: 'og', route: '#/', scale: 2, refNA: true, steps: [{ seek: 16 }, { eval: OG_ONLY }],
    check: 'The title at a link preview\'s 1200 × 630: Earth and the sun, the lockup, the coral wordmark, "Eidolon reads terrain form at 200 m…", the crosshair and Eidolon-1\'s tag; no buttons, no first paragraph, no "Scroll for credits", no site dots or rings, no dashed frame' },
  // The poster's source (`npm run poster` makes public/poster*.jpg from it): the title shot alone, at device scale 2.
  { name: 'title-shot', route: '#/', scale: 2, refNA: true, steps: [{ seek: 16 }, { eval: SCENE_ONLY }], check: 'The title\'s scene only: Earth\'s limb, the sun and its flare, the orbit, the ground; no lockup, wordmark, text, frame lines or annotations' },

  // Engine states, the panel scrolled to its foot, where the doubles are. Warming: the mock answers 503 warming_up for
  // its first 35 s (the panel asks again every 3 s), then the doubles.
  { name: 'engine-warming-note', seq: 'warming', route: '#/mars/jezero', query: 'mock=warming', refNA: true, steps: [{ seek: 2.5 }], check: 'Warming screen: "Search engine starting up…" in the status bar (phone: one line above the sheet), from /health polled at boot' },
  { name: 'engine-warming', seq: 'warming', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel' }], check: 'Warming state: "Starting up…" with its bar (the engine\'s uptime) and the 30 to 40 seconds' },
  { name: 'engine-warming-done', seq: 'warming', refNA: true, steps: [{ seek: 40 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'Warmed up: the five cards, asked again by themselves' },
  { name: 'engine-moon-pin-85S', seq: 'nodem', route: '#/moon', query: 'mock=nodem', refNA: true, steps: [{ seek: 2.5 }, { route: '#/moon/@-85.0000,30.0000' }, { seek: 3 }, { scroll: '#panel' }], check: 'No-data state: frame "No elevation data", the panel\'s no-elevation box under "Earth doubles" (no "closest")' },
  { name: 'engine-moon-pin-85S-terrain', seq: 'nodem', refNA: true, steps: [{ seek: 5 }], check: 'The frame gone: the terrain\'s note "No elevation data here: … Illustrative terrain." (viewports 520 px and wider)' },
  // Mock pin latency is 6 s: mid-search the frame holds on the globe with its bar; then the dive, terrain and doubles.
  { name: 'engine-mars-pin-6s', seq: 'pin', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { route: '#/mars/@18.3800,77.5800' }, { seek: 3 }, { scroll: '#panel' }], check: 'Detection frame holds on the globe with progress ("Reading Mars terrain" and its bar), the panel\'s "Reading Mars terrain…" box, status bar "Click the surface to search another point instead."' },
  { name: 'engine-mars-pin-lands', seq: 'pin', refNA: true, steps: [{ seek: 6.2 }, { expect: '#sc3[style*="--fl: 0."]' }], check: 'The answer just landed (6 s): the frame\'s Matching line "Earth doubles" coral, easing back (the telemetry flash), the bar gone; the globe starting to turn for the dive' },
  { name: 'engine-mars-pin-done', seq: 'pin', refNA: true, steps: [{ seek: 10 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'The search answered: dived to the terrain, five cards' },
  // A pin moved on the site view (a map click) swaps to terrain at once, the panel back at its top: the status bar
  // (on a phone, one line above the sheet) says its search is running, 3 s in.
  { name: 'engine-pin-moved', route: '#/mars/@18.3800,77.5800', refNA: true, steps: [{ seek: 7 }, { scroll: '#panel', to: '.map' }, { tap: '[data-map]', fx: .7, fy: .35 }, { seek: 10 },
    { expect: '#st-l .eng' }], check: 'Status bar "Reading Mars terrain…" with its dot (phone: above the sheet); the crumb and coordinates of the moved pin, the panel at its top' },
  // The globe stays usable while a pin's search holds the frame: a second pin (left of the first) replaces it and its
  // search (one search by coordinates at a time), and the globe zooms out.
  { name: 'engine-pin-second', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { route: '#/mars/@18.3800,77.5800' }, { seek: 2 }, { tap: '#hud', fx: .3, fy: .5 }, { seek: 3 },
    { wheel: { dx: 0, dy: 300 }, at: '#gl' }, { seek: 3.5 }], check: 'Held on the second pin (crumb and frame position): the globe turned to it and zoomed out, the frame and the panel\'s progress from its own start' },

  // Results on the engine fixtures, the panel scrolled to the doubles (the reference, which has none of the new markup,
  // to its foot: its stand-in doubles). Cards under the capability banner, "show more" to 20, then a result's detail on
  // the compare view (the Jezero example's first cell; Rima Hadley's first card, tapped).
  { name: 'results-jezero', seq: 'res-jezero', route: '#/mars/jezero', steps: [{ seek: 3.5 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'Capability banner (crater, 9 of 17, no percentage); cards: rank, country, coordinates, shape match, notes, summary, chips, hillshade' },
  { name: 'results-jezero-foot', seq: 'res-jezero', refNA: true, steps: [{ scroll: '#panel' }, { seek: 3.6 }], check: 'Under the five cards: Show more, then "Typically 2 of 3 searches find a good terrain analog in the first five results. These are sample results. Run Eidolon with the real model (a link to the repo)."' },
  { name: 'results-jezero-more', seq: 'res-jezero', refNA: true, steps: [{ scroll: '#panel', to: '[data-more]' }, { tap: '[data-more]' }, { seek: 6 }, { scroll: '#panel' }], check: 'Show more: 20 cards with their hillshades, no Show more left' },
  { name: 'results-rima-hadley', seq: 'res-hadley', route: '#/moon/hadley', steps: [{ seek: 3.5 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'Capability banner (rille, 9 of 16); cards with no percentages' },
  { name: 'results-rima-hadley-detail', seq: 'res-hadley', refNA: true, steps: [{ tap: '[data-doubles] li:first-child .result' }, { seek: 6.5 }, { scroll: '#panel', to: '.res' }], check: 'Detail of the first card: shape match, score, likelihood bar, summary, six properties with status' },
  { name: 'results-jezero-detail', seq: 'res-detail', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.res' }], check: 'Shape match High, score, rough likelihood bar, surface badge, summary, six properties with status, matches and differs' },
  { name: 'results-jezero-notes', seq: 'res-detail', refNA: true, steps: [{ scroll: '#panel', to: 'h3:has(+ .notes)' }, { seek: 3.2 }], check: 'Every caveat, climate (°C, mm/yr, aridity band), location with access and surface' },
  { name: 'results-jezero-engine', seq: 'res-detail', refNA: true, steps: [{ scroll: '#panel', to: '.res .drawer' }, { tap: '.res .drawer summary' }, { seek: 3.4 }], check: 'Expert drawer open: raw values (no judge number) and the engine build' },
  { name: 'results-jezero-list', seq: 'res-detail', refNA: true, steps: [{ scroll: '#panel', to: '[data-jump]' }, { tap: '[data-jump]' }, { seek: 3.6 }], check: 'Other doubles: the list from its head, card 01 selected' },
  // Another card picked from that list: a new double starts its compare from the top, focus on the Comparison heading.
  { name: 'results-jezero-pick', seq: 'res-detail', refNA: true, steps: [{ scroll: '#panel', to: '[data-doubles] li:nth-child(3)' }, { tap: '[data-doubles] li:nth-child(3) .result' }, { seek: 5 }], check: 'Card 03 picked: the panel back at the top on the new pair and maps, its detail under them' },
  // A double from Show more by deep link (rank 13: Haughton, polar): the 20 are asked for, so its detail shows, with a
  // part-filled likelihood bar and the polar note; then the list, its card selected.
  { name: 'results-jezero-low', seq: 'res-low', route: '#/mars/jezero/compare/@75.3750,-89.6750', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.res' }], check: 'Rank 13 detail by deep link: likelihood 4 of 5, Shape match Medium, landform shape a match, 3 notes, Analog site: Haughton' },
  { name: 'results-jezero-low-list', seq: 'res-low', refNA: true, steps: [{ scroll: '#panel', to: '[data-doubles] .is-sel' }, { seek: 3.2 }], check: 'Card 13 selected among the 20' },
  // Show more on a slow engine (?mock=slow: 10 s per call): the disabled "Loading more…" under the five.
  { name: 'results-loading-more', route: '#/mars/jezero', query: 'mock=slow', refNA: true, steps: [{ seek: 10.5 }, { scroll: '#panel', to: '[data-more]' }, { tap: '[data-more]' }, { seek: 12 }, { scroll: '#panel' }], check: 'Loading more… disabled (dimmed, no hover), the five cards kept' },
  // An Artemis site: the engine has no Moon elevation beyond 60° (no_dem); its curated analog sites stand in, unscored.
  { name: 'results-moon-malapert', route: '#/moon/malapert', steps: [{ seek: 3.5 }, { scroll: '#panel' }, { expect: '[data-ask][hidden]' }], check: 'No-elevation note for this site, Compare with an analog site, "Established analog sites on Earth" without a shape match; no purpose or filters (hidden: they change nothing without elevation)' },

  // Results rework 3/4: the purpose picker and filters, IAU targets. The Rima Hadley example's own query (EVA training,
  // United States of America): the form with the filters open, then its cards (the fixture's US cells), then the
  // first card's detail (a gap, the polar note, a humid climate).
  { name: 'ask-hadley', seq: 'ask-hadley', route: '#/moon/hadley', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { select: '#purpose', value: 'eva_training' }, { tap: '.filt summary' },
    { select: '#country', value: 'United States of America' }, { seek: 4 }, { scroll: '#panel', to: '[data-ask]' }, { expect: '#purpose option[value="polar_lighting_geometry"]:disabled' }],
    check: 'Test purpose EVA training with its description; Filters "1 on" open: country United States of America, the three toggles, Area anywhere. Asserted: polar lighting geometry listed, disabled (a native popup isn\'t captured)' },
  { name: 'ask-hadley-results', seq: 'ask-hadley', refNA: true, steps: [{ scroll: '#panel', to: '[data-doubles]' }, { seek: 6.5 }], check: 'The Rima Hadley example\'s five US cells, "Searched as the IAU feature Rima Hadley · Rima · ≈ 116 km across. Larger than the 18.8 km comparison window…", the rille banner' },
  { name: 'ask-hadley-detail', seq: 'ask-hadley', refNA: true, steps: [{ tap: '[data-doubles] li:first-child .result' }, { seek: 8.5 }, { scroll: '#panel', to: '.res' }], check: 'The example\'s first cell: purpose eva_training, its gap, notes and climate' },
  // Education searches all land: a rugged, likely vegetated cell (the mock's New Zealand one) among the results.
  { name: 'ask-education', seq: 'ask-education', route: '#/mars/gale', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { select: '#purpose', value: 'education' }, { tap: '.filt summary' }, { seek: 3.5 }, { scroll: '#panel', to: '[data-ask]' }], check: 'Education and outreach and its description, no "barren land only"; Filters open, the surface box offers "Barren land only" (education already searches any land)' },
  { name: 'ask-education-rugged', seq: 'ask-education', refNA: true, steps: [{ scroll: '#panel', to: '[data-doubles]' }, { tap: '[data-doubles] .result:has-text("New Zealand")' }, { seek: 6 }, { scroll: '#panel', to: '.res' }], check: 'The rugged cell\'s detail: badge "Rugged, likely vegetated" and "Terrain form matches; the surface is likely vegetated."' },
  // Named-feature search on the body view: three matches for "jez" (the engine's targets_jez example), the first active;
  // the second picked by keyboard opens Jezero Mons, a named target searched by its IAU name.
  { name: 'targets-jez', seq: 'targets', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { fill: '#tq', text: 'jez' }, { seek: 2.8 }, { wait: 1500 }, { seek: 3.2 }], check: 'Jezero (Featured: Jezero Crater), Jezero Mons, Jezza with type, coordinates and size; the first active; "3 named features"' },
  { name: 'targets-named', seq: 'targets', refNA: true, steps: [{ press: 'ArrowDown' }, { press: 'Enter' }, { seek: 8 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'Jezero Mons by IAU name: "IAU feature · Mons · ≈ 27 km across. Larger than the 18.8 km…", the mountain banner, five cards' },
  { name: 'targets-named-top', seq: 'targets', refNA: true, steps: [{ scroll: '#panel', to: '.back' }, { seek: 8.2 }], check: 'The named target\'s head: title Jezero Mons, crumbs and status bar by name, coordinates at 4 dp, lede "Named feature. Centre point from the IAU gazetteer." (no landform guessed from the map), no "move the pin"' },
  // Back to Mars, the field fresh: Enter on it opens nothing (the last list's options are gone).
  { name: 'targets-fresh', seq: 'targets', refNA: true, steps: [{ route: '#/mars' }, { seek: 2.5 }, { tap: '#tq' }, { press: 'Enter' }, { seek: 3 }, { expect: '#tq[aria-expanded="false"]' }], check: 'Still the Mars body view after Enter on the empty field; the help line' },
  // The Moon's south pole: the engine lists Moon features only within 60°. A featured south-pole site by name, then a
  // polar feature the search can't find, with the limit stated.
  { name: 'targets-polar', seq: 'targets-moon', route: '#/moon', refNA: true, steps: [{ seek: 2.5 }, { fill: '#tq', text: 'malapert' }, { seek: 2.8 }, { wait: 1500 }, { seek: 3.2 }], check: 'Malapert Massif, "Featured site · 86.0000° S, 0.0000° E", active; "1 named feature"' },
  { name: 'targets-nomatch', seq: 'targets-moon', refNA: true, steps: [{ fill: '#tq', text: 'Shackleton' }, { seek: 3.6 }], check: '"No named feature on Moon matches “Shackleton”. The search engine lists Moon features only within 60° of the equator; the south-pole sites are under Featured sites."' },
  // The field's failure copy: the engine down, then warming up.
  { name: 'targets-fail', route: '#/mars', query: 'mock=fail', refNA: true, steps: [{ seek: 2.5 }, { fill: '#tq', text: 'jez' }, { seek: 2.8 }, { wait: 1500 }, { seek: 3.2 }], check: '"Named features couldn’t be loaded: the search engine could not be reached." No list' },
  { name: 'targets-warming', route: '#/mars', query: 'mock=warming', refNA: true, steps: [{ seek: 2.5 }, { fill: '#tq', text: 'jez' }, { seek: 2.8 }, { wait: 1500 }, { seek: 3.2 }], check: '"The search engine is starting up. Try again in a moment." No list' },
  // A name the engine doesn't know (unknown_target): its copy and both ways on.
  { name: 'targets-unknown', route: '#/mars/Nowhere%20Mons@10.0000,20.0000', refNA: true, steps: [{ seek: 1 }, { wait: 1500 }, { seek: 3 }, { scroll: '#panel', to: '[data-doubles]' }], check: '"This feature isn’t in the search engine’s list of named targets. Find it under its IAU name, or search its coordinates instead." Find it by its IAU name, Search by coordinates; no purpose or filters' },
  // A target below the engine's 200 m resolution (Shorty, by IAU name): the form properties "Not measurable at 200 m".
  { name: 'targets-shorty', seq: 'shorty', route: '#/moon', refNA: true, steps: [{ seek: 2.5 }, { fill: '#tq', text: 'Shorty' }, { seek: 2.8 }, { wait: 1500 }, { seek: 3.2 }, { press: 'Enter' },
    { seek: 8 }, { scroll: '#panel', to: '[data-doubles]' }, { tap: '[data-doubles] li:first-child .result' }, { seek: 10 }, { scroll: '#panel', to: '.res' }], check: 'Grey dashes and "Not measurable at 200 m" on landform shape, raised vs incised and landform size; Shape match Low' },
  // Search this area: the Earth globe zoomed in on the first double, then searched: the doubles inside the area only.
  { name: 'compare-area', seq: 'area', route: '#/mars/jezero/compare/@34.6750,-105.0750/globe', refNA: true, steps: [{ seek: 3 },
    { wheel: { dx: 0, dy: -500 }, at: '#gl', fx: .8, fy: .3 }, { wheel: { dx: 0, dy: -500 }, at: '#gl', fx: .8, fy: .3 }, { seek: 3.5 }, { tap: '#area' }, { seek: 4.5 }], check: 'Search this area in the Earth viewport\'s corner; the Earth pins only inside the view' },
  { name: 'compare-area-filters', seq: 'area', refNA: true, steps: [{ scroll: '#panel', to: '[data-ask]' }, { seek: 4.7 }], check: 'Filters "1 on" open: Area with its latitudes and longitudes and Clear' },
  // A filter that leaves the compared Earth pin out: five results (not the 20 a deep link asks for), the pin said to be out.
  { name: 'compare-away', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { tap: '.filt summary' }, { select: '#country', value: 'Australia' },
    { seek: 4 }, { scroll: '#panel', to: '[data-doubles]' }], check: '"The compared Earth pin isn’t among this search’s results." over five Australian cards, Show more (no Loading more…)' },
  // The purpose picks only the surface (the engine caches by target and surface): Drilling and ISRU on Jezero gives rover
  // mobility's five, the engine's cached cells. On a compare, a filter only takes cells out: Exclude polar keeps the
  // compared pin (34.68° N), its detail stays above and the form where it was, the toggle still focused.
  { name: 'ask-purpose-same', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { select: '#purpose', value: 'drill_isru' },
    { seek: 3.5 }, { scroll: '#panel', to: '[data-doubles]' }], check: 'Drilling and ISRU: the same five as rover mobility: United States, Australia twice, Algeria twice' },
  { name: 'compare-filter-keep', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { tap: '.filt summary' }, { tap: '#f-polar' },
    { seek: 3.6 }, { expect: '#f-polar:focus' }, { expect: '[data-cmp] .res' }, { expect: '[data-doubles] .is-sel' }],
    check: 'Filters "1 on", Exclude polar checked and focused, the form at the panel\'s top as before; asserted: the detail kept, the compared pin selected among the results' },
  // Filters no cell passes (Algeria is no Artemis Accords partner): said so, with Clear filters.
  { name: 'ask-empty', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '[data-ask]' }, { tap: '.filt summary' }, { select: '#country', value: 'Algeria' }, { tap: '#f-partner' },
    { seek: 4 }, { scroll: '#panel', to: '[data-ask]' }], check: 'Filters "2 on"; below, "No Earth doubles match these filters." and Clear filters' },

  // Booking flow (Must 6): from the Jezero example's first cell on compare, Plan a test campaign here, through the
  // listing, the plan (Review with nothing filled: inline errors, focus on the first day; then filled), the review and
  // the confirmation. Each step is its own route (…/book, /book/plan, /book/review, /book/done).
  { name: 'book-listing', seq: 'book', route: '#/mars/jezero/compare/@34.6750,-105.0750', refNA: true, steps: [{ seek: 3 }, { tap: '.jump .btn.primary' }, { seek: 3.5 }, { wait: 400 }],   // the crop files land (real time)
    check: 'Back "Comparison", the four steps on one line (1 Site facts current), title United States of America, coordinates, "Unnamed area in the United States of America." lede, Plan a test campaign here, the strip clear of it (context and regional: the cell\'s own Landsat WELD crops, not a cut from the globe; the surface slot "No field photographs of this area."), "Images: Landsat WELD…" credit' },
  { name: 'book-listing-practical', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: 'h3.sec' }, { seek: 3.6 }],
    check: 'Practical suitability apart from the terrain match (score, operating radius 0.0 km, road, travel, airport, barren ground, footprint); Access and permits: protected area, partner copy' },
  { name: 'book-listing-foot', seq: 'book', refNA: true, steps: [{ scroll: '#panel' }, { seek: 3.7 }], check: 'Surface and climate; "Best months for rover mobility" with the sample listing\'s months and "Sample months: the climatology couldn’t be loaded." before its season note; indicative cost per person-day, the sample-listing line' },
  { name: 'book-plan', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: '.back' }, { tap: '#pin .actions .btn.primary' }, { seek: 4 },
    { eval: "for (const b of document.querySelectorAll('.day')) { const v = `${b.querySelector('.w').textContent} ${b.querySelector('.n').textContent}, `; if (!b.querySelector('.sr').textContent.startsWith(v)) throw new Error(`day not named by what it shows: ${v}`); }" }],
    check: 'Step 2 current; Test purpose (Rover mobility), the 14 days of the weather window as buttons with wind bars, "No days picked yet."' },
  { name: 'book-plan-errors', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: '.bform .actions' }, { tap: '.bform button[type="submit"]' }, { seek: 4.2 },
    { expect: '#b-team[aria-invalid="true"]' }, { expect: '[data-day]:focus' }, { expect: '[data-day][aria-describedby="b-dates-e"]' }, { expect: 'fieldset[aria-invalid="true"]' },
    { expect: '#b-purpose[aria-required="true"]' }, { expect: '#b-team[aria-required="true"]' }],
    check: 'Inline errors under Dates (coral), focus on the first day (the error in each day\'s description, asserted), "Test purpose, dates and team size are required…"' },
  { name: 'book-plan-errors-team', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: '#b-dates-e' }, { seek: 4.25 }], check: 'The dates error, then Team size outlined in coral with "Enter the team size."' },
  { name: 'book-plan-filled', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: '.days' }, { tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(6) .day' },
    { fill: '#b-team', text: '6' }, { scroll: '#panel', to: '#b-team' }, { tap: '.ck:has(input[value="rover"])' }, { fill: '#b-notes', text: 'Night drives on the second and third days.' },
    { scroll: '#panel', to: '.days' }, { seek: 4.4 }, { expect: '.days li:nth-child(4) .day[aria-pressed="true"]' }],
    check: 'Days 2 to 6 picked (coral outline), the summary line "… to … · 5 days, n under the limits"; errors still shown until Review is pressed again' },
  { name: 'book-review', seq: 'book', refNA: true, steps: [{ scroll: '#panel', to: '.bform .actions' }, { tap: '.bform button[type="submit"]' }, { seek: 4.6 }],
    check: 'Step 3: site United States of America with coordinates, purpose, dates "Tue 6 Oct 2026 to …" with days under the limits, team size 6 people, 5 days (sans), rover, the notes' },
  { name: 'book-review-foot', seq: 'book', refNA: true, steps: [{ scroll: '#panel' }, { seek: 4.7 }], check: 'Indicative cost for 6 people over 5 days, permits, Edit the plan and Request the campaign, the mock line' },
  { name: 'book-done', seq: 'book', refNA: true, steps: [{ tap: '[data-request]' }, { seek: 5 }], check: 'Step 4: "Campaign requested", the reference EID-…, the summary, Back to the comparison and Edit the plan on one row; "It’s listed in My campaigns (underlined). A mock-up: nothing was sent…"' },
  // My campaigns (Stretch 5) from the confirmation: the campaign just requested, selected; the focus on the heading.
  { name: 'book-done-camps', seq: 'book', refNA: true, steps: [{ tap: '#pin [data-camps]' }, { seek: 5.1 }, { expect: '#camps[open] .row.is-sel[aria-current]' }, { expect: '#camps-h:focus' },
    { eval: rowLL(1, '34.6750° N, 105.0750° W') }, { eval: UNDER_BTN }],
    check: 'The dialog (the panel\'s look, its right edge under the top bar\'s button (asserted); a bottom sheet on a phone) over a dimmed page: Close, "My campaigns", one row: United States of America, 34.6750° N, 105.0750° W (mono), "Tue 6 Oct 2026 to Sat 10 Oct 2026 · 5 days", "For Jezero Crater, Mars · 6 people", EID-261004-W4DC, selected; "Kept in this browser only. A mock-up: …"' },
  // The listing of a cell inside an established site (Pilbara, Jezero's double): the site's surface photo, its credit.
  { name: 'book-listing-photo', route: '#/mars/jezero/compare/@-21.2250,119.4250/book', refNA: true, steps: [{ seek: 3 }, { wait: 400 }, { scroll: '#panel', to: '.imgs' }],
    check: 'Context and regional crops, then the Pilbara photo (a stromatolite outcrop: domed red rock, pale chert cracked into blocks); "Images: Landsat WELD…" and "Surface: Stromatolite outcrop in the Pilbara, 2019 · NASA/JPL-Caltech."' },
  // An established analog site as the double (an Artemis region's, no search result): the listing from its place alone.
  { name: 'book-established', route: '#/moon/malapert/compare/haughton/book', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3.sec' }],
    check: 'Haughton Crater listing: country and sovereign Canada, an Accords signatory with the partner copy; below, surface — and "No surface class or climate", the centre\'s elevation within the stage legend\'s range' },
  // Its plan in October: the polar north's best months are Jun to Aug, so the dates carry the caveat, to the review.
  // On the way, a team error fixed then broken again comes back on the next Review (asserted; the panel's HTML cache
  // once kept it out).
  { name: 'book-offseason-plan', seq: 'book-off', route: '#/moon/malapert/compare/haughton/book/plan', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.days' },
    { tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(4) .day' }, { fill: '#b-team', text: '' }, { press: 'Enter' }, { seek: 3.1 }, { expect: '#b-team-e' },
    { fill: '#b-team', text: '5' }, { expect: '#b-team:not([aria-invalid])' }, { fill: '#b-team', text: '' }, { press: 'Enter' }, { seek: 3.15 },
    { expect: '#b-team-e' }, { expect: '#b-team[aria-invalid="true"][aria-describedby~="b-team-e"]:focus' },
    { fill: '#b-team', text: '4' }, { scroll: '#panel', to: '.days' }, { seek: 3.2 }],
    check: 'The month on the first day ("Oct"); summary "… · 3 days, n under the limits. Outside the site’s best months (Jun to Aug). Sample months: the climatology couldn’t be loaded. Reachable in the local summer only."' },
  { name: 'book-offseason-review', seq: 'book-off', refNA: true, steps: [{ scroll: '#panel', to: '.bform .actions' }, { tap: '.bform button[type="submit"]' }, { seek: 3.4 }],
    check: 'Review: site Haughton Crater; under Dates the best-months caveat' },
  // Antarctica: the Antarctic Treaty's permits copy.
  { name: 'book-antarctic', route: '#/moon/haworth/compare/dryvalleys/book', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: 'h3.sec:nth-of-type(2)' }],
    check: 'McMurdo Dry Valleys: Country and sovereign Antarctica, access Antarctic Treaty, the treaty\'s permits copy' },
  // On the globe compare: the step over the globes; no Search this area; the hint says Esc goes back a step.
  { name: 'book-globe', route: '#/mars/jezero/compare/@34.6750,-105.0750/globe/book', refNA: true, steps: [{ seek: 3 }, { expect: '#area[hidden]' }],
    check: 'The listing over the two globes, the compare toggle on Globe, no Search this area (asserted), status hint "Drag to rotate. Scroll to zoom. Esc goes back a step."' },
  // The confirmation deep-linked without a request.
  { name: 'book-done-empty', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/done', refNA: true, steps: [{ seek: 3 }],
    check: '"No campaign requested here yet", spaced under the heading, with Plan a campaign' },
  // An Earth pin the search doesn't return (here: none near it).
  { name: 'book-pin-away', route: '#/mars/jezero/compare/@10.0000,10.0000/book', refNA: true, steps: [{ seek: 3 }],
    check: '"This Earth pin isn’t among the search’s results" with Back to the comparison' },
  // The search that found the double failing: as on compare, keyed on the code.
  { name: 'book-warming', route: '#/mars/jezero/compare/@34.6750,-105.0750/book', query: 'mock=warming', refNA: true, steps: [{ seek: 2.5 }],
    check: '"Starting up…" with its bar under the heading (not the not-among-results box)' },
  { name: 'book-fail', route: '#/mars/jezero/compare/@34.6750,-105.0750/book', query: 'mock=fail', refNA: true, steps: [{ seek: 2.5 }],
    check: '"The search engine didn’t answer" with Try again' },
  // A team out of range (the notes can't pass 1,000 characters: the field's maxlength stops typing and pasting there).
  { name: 'book-plan-invalid', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/plan', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.days' },
    { tap: '.days li:nth-child(3) .day' }, { fill: '#b-team', text: '41' }, { scroll: '#panel', to: '.bform .actions' },
    { tap: '.bform button[type="submit"]' }, { seek: 3.2 }, { expect: '#b-team:focus' }, { scroll: '#panel', to: 'label[for="b-team"]' }],
    check: 'Team size "41" outlined, "Enter the team size as a whole number from 1 to 40.", focus on it' },
  // A deep link to a step with nothing to show: the review without a plan.
  { name: 'book-review-empty', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/review', refNA: true, steps: [{ seek: 3 }],
    check: '"No complete plan to review yet" with Plan a campaign' },
  // My campaigns (Stretch 5) with nothing requested: from the top bar (its icon below 1,100 px), the empty box.
  { name: 'camps-empty', route: '#/mars', refNA: true, steps: [{ seek: 3 }, { tap: '#camps-btn' }, { seek: 3.1 }, { expect: '#camps[open]' }, { expect: '#camps-btn[aria-label="My campaigns"]' }],
    check: 'The top bar\'s My campaigns (words on desktop, the calendar-with-a-tick icon on a phone, no count); its dialog: "No campaigns requested yet" with how to request one and Featured sites on Mars, "Kept in this browser only."' },
  // Requests outlast the page: one at a target searched by coordinates (6 s), the page reloaded, its confirmation from
  // the request alone while that search runs again; a second at a Moon site; both listed soonest first, one opened, and
  // Escape closing the dialog, not the step.
  { name: 'camps-pin-reload', seq: 'camps', route: '#/mars/arcadia/compare/@38.4250,-110.7750/book', refNA: true, steps: [{ seek: 9 }, { tap: '#pin .actions .btn.primary' }, { seek: 9.5 },
    { scroll: '#panel', to: '.days' }, { tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(4) .day' }, { fill: '#b-team', text: '4' },
    { scroll: '#panel', to: '.bform .actions' }, { tap: '.bform button[type="submit"]' }, { seek: 10 }, { scroll: '#panel' }, { tap: '[data-request]' }, { seek: 10.5 }, { expect: '.ref' },
    { reload: true }, { seek: 1 }, { expect: '#pin [data-book="wait"] .ref' }],
    check: 'Reloaded, the pin\'s search running again (asserted: the step keyed wait; the status line shows the compared window, Arcadia Planitia\'s point): "Campaign requested", its reference, "A team of 4 testing for Arcadia Planitia at Hanksville, Tue 6 Oct 2026 to Thu 8 Oct 2026."' },
  { name: 'camps-two', seq: 'camps', refNA: true, steps: [{ route: '#/moon/malapert/compare/haughton/book/plan' }, { seek: 3 }, { scroll: '#panel', to: '.days' },
    { tap: '.days li:nth-child(3) .day' }, { tap: '.days li:nth-child(5) .day' }, { fill: '#b-team', text: '6' }, { scroll: '#panel', to: '.bform .actions' },
    { tap: '.bform button[type="submit"]' }, { seek: 3.2 }, { scroll: '#panel' }, { tap: '[data-request]' }, { seek: 3.4 }, { tap: '#camps-btn' }, { seek: 3.5 }, { expect: '#camps .rows li:nth-child(2) .row.is-sel' },
    { eval: rowLL(1, '38.4250° N, 110.7750° W') }, { expect: '#camps-btn[aria-label="My campaigns, 2 requested"]' }],
    check: 'Two rows, soonest first: United States of America at 38.4250° N, 110.7750° W for Arcadia Planitia, Mars (Tue 6 to Thu 8 Oct, 4 people), then Haughton Crater at its point for Malapert Massif, Moon (Wed 7 to Fri 9 Oct, 6 people), selected; the top bar\'s count 2 (a badge on the icon on a phone), in its name (asserted)' },
  { name: 'camps-open', seq: 'camps', refNA: true, steps: [{ tap: '#camps .rows li:nth-child(1) .row' }, { seek: 4.5 }, { expect: '#camps:not([open])' },
    { expect: '#crumbs [data-go="mars/arcadia"]' }, { eval: REF_RBJS }, { tap: '#camps-btn' }, { press: 'Escape' }, { expect: '#camps:not([open])' }, { expect: '#camps-btn:focus' }, { eval: REF_RBJS }],
    check: 'Arcadia Planitia\'s confirmation over its compare (asserted: its crumbs and reference EID-261004-RBJS), the dialog closed; asserted: opened again, Escape closes it, the focus back on its button, the step kept' },
  // By keyboard: Enter on the button opens it, Tab reaches the first row (its focus ring), the pointer over the second.
  { name: 'camps-keys', seq: 'camps', refNA: true, steps: [{ press: 'Enter' }, { seek: 5 }, { expect: '#camps-h:focus' }, { press: 'Tab' }, { expect: '#camps .rows li:nth-child(1) .row:focus-visible' },
    { hover: '#camps .rows li:nth-child(2) .row' }],
    check: 'The dialog over Arcadia\'s confirmation: its row selected and ringed white (keyboard focus), Malapert\'s under the pointer (hover ground)' },
  // Blocked site data (both storages throw): the request lasts the page, and the dialog says so.
  { name: 'camps-blocked', route: '#/moon/malapert/compare/haughton/book/plan', noStorage: true, refNA: true, steps: [{ seek: 3 }, { scroll: '#panel', to: '.days' },
    { tap: '.days li:nth-child(3) .day' }, { tap: '.days li:nth-child(5) .day' }, { fill: '#b-team', text: '6' }, { scroll: '#panel', to: '.bform .actions' },
    { tap: '.bform button[type="submit"]' }, { seek: 3.2 }, { scroll: '#panel' }, { tap: '[data-request]' }, { seek: 3.4 }, { expect: '#pin .ref' },
    { scroll: '#panel' }, { tap: '#pin [data-camps]' }, { seek: 3.5 }, { expect: '#camps .row.is-sel' }, { expect: '#camps-btn[aria-label="My campaigns, 1 requested"]' },
    { eval: "{ const t = document.querySelector('#camps .fine').textContent; if (!t.startsWith('This browser keeps no site data')) throw new Error(t); }" }],
    check: 'One row, Haughton Crater for Malapert Massif, Moon, selected; the fine print "This browser keeps no site data, so they last until the page is closed. A mock-up: …"; the count 1' },

  // A target searched by coordinates (6 s): the listing waits for the search that found its cell, then fills in place.
  { name: 'book-pin-wait', seq: 'book-pin', route: '#/mars/arcadia/compare/@38.4250,-110.7750/book', refNA: true, steps: [{ seek: 3 }], check: '"Reading Mars terrain…" with its bar' },
  { name: 'book-pin-listing', seq: 'book-pin', refNA: true, steps: [{ seek: 9 }], check: 'The listing of the Hanksville cell: "Hanksville", United States of America' },

  // Weather window from a real feed (Should 4; data/weather.ts): under ?capture the feeds stay off and the sample days
  // show (every state above); with wx=feed the harness answers them from recorded responses. Days are marked under the
  // limits of the purpose; the best months come from the climatology.
  { name: 'wx-site-feed', route: '#/earth/meteor', query: 'wx=feed', serve: WX, refNA: true, steps: [{ seek: 3 }, { wait: 300 }, { scroll: '#panel' }, { seek: 3.1 }],
    check: 'Meteor Crater\'s week from Sun 4 Oct (its local today at UTC−6): Su Mo Tu blue, We to Sa grey with a dot (rain over 2 mm); "a dot rain or temperature over the limits … limits for rover mobility: wind under 11 m/s, rain up to 2 mm, −20 to 40 °C. Forecast: Open-Meteo.com (CC BY 4.0)." with both names linked; Best months for rover mobility: All year; the NASA POWER line' },
  { name: 'wx-site-local', route: '#/earth/dryvalleys', query: 'wx=feed', serve: DRY, refNA: true, steps: [{ seek: 3 }, { wait: 300 }, { scroll: '#panel' }, { seek: 3.1 },
    { expect: '.wx li:first-child[title^="Mon 5 Oct: wind"]' }],
    check: 'The Dry Valleys\' week from Mon 5 Oct, their local today at UTC+13 (UTC\'s is Sun 4 Oct): every day with its forecast, none empty; grey with a dot (lows under −20 °C) but We, blue (−19.8 °C); Best months for rover mobility: Dec, Jan' },
  { name: 'wx-site-loading', route: '#/earth/meteor', query: 'wx=feed', hold: FEEDS, refNA: true, steps: [{ seek: 3 }, { scroll: '#panel' }, { seek: 3.1 }, { expect: '.wx ol.load' }],
    check: 'Both feeds loading: seven pulsing placeholder bars (taller than a calm day\'s stub), none blue, "Loading the forecast…"; Best months for rover mobility "Loading…"' },
  { name: 'wx-site-fail', route: '#/earth/meteor', query: 'wx=feed', block: FEEDS, refNA: true, steps: [{ seek: 3 }, { wait: 300 }, { scroll: '#panel' }, { seek: 3.1 }],
    check: 'Both feeds refused (404), as offline: the sample days, "Sample weather: the forecast couldn’t be loaded."; Best months for rover mobility "Not available", no POWER line' },
  { name: 'book-listing-feed', seq: 'book-feed', route: '#/mars/jezero/compare/@34.6750,-105.0750/book', query: 'wx=feed', serve: WX, refNA: true, steps: [{ seek: 3 }, { wait: 300 }, { scroll: '#panel' }, { seek: 3.1 }],
    check: 'Season: "Best months for rover mobility: All year" (the climatology), its NASA POWER line in place of the sample note' },
  { name: 'book-listing-wx-loading', route: '#/mars/jezero/compare/@34.6750,-105.0750/book', query: 'wx=feed', hold: '/climatology/point', serve: FORECAST, refNA: true,
    steps: [{ seek: 3 }, { scroll: '#panel' }, { seek: 3.1 }],
    check: 'The climatology loading: Season "Best months for rover mobility: Loading…", no season note (no sample months shown first)' },
  { name: 'book-plan-feed', seq: 'book-feed', refNA: true, steps: [{ scroll: '#panel', to: '.back' }, { tap: '#pin .actions .btn.primary' }, { seek: 3.5 }, { scroll: '#panel', to: 'label[for="b-purpose"]' }],
    check: 'Rover mobility; 14 days from Mon 5 Oct, from the forecast: blue except 7–10 Oct (rain) and 16 Oct (wind 11.0 m/s); the limits for rover mobility and "Forecast: Open-Meteo.com (CC BY 4.0)." in the hint' },
  { name: 'book-plan-feed-eva', seq: 'book-feed', refNA: true, steps: [{ select: '#b-purpose', value: 'eva_training' }, { seek: 3.6 }, { expect: '#b-day-2026-10-14:not(.go)' }, { expect: '#b-day-2026-10-12.go' }],
    check: 'EVA training: the days marked again under its limits (14–17 Oct grey now: wind 9 m/s and over), the hint "wind under 9 m/s, rain up to 1 mm, −10 to 32 °C"' },
  { name: 'book-plan-feed-picked', seq: 'book-feed', refNA: true, steps: [{ tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(6) .day' }, { seek: 3.7 }],
    check: 'Summary "Tue 6 Oct to Sat 10 Oct · 5 days, 1 under the limits." with no caveat (October is among EVA training\'s best months here: Jan to Mar, May, Aug to Dec); the rain days 7–10 Oct with a dot' },
  { name: 'book-plan-wx-loading', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/plan', query: 'wx=feed', hold: '/v1/forecast', serve: POWER, refNA: true,
    steps: [{ seek: 3 }, { scroll: '#panel', to: '.days' }, { tap: '.days li:nth-child(2) .day' }, { seek: 3.1 }, { expect: '.day:not(.go)' }, { expect: '.days.load li:nth-child(1) .day[title$="forecast loading"]' }, { expect: '.days.load li:nth-child(1) .day > .sr' }],
    check: 'The forecast loading: 14 days with pulsing placeholder bars, none blue, no dots; "Tue 6 Oct · 1 day." with no count; "Loading the forecast…" in the hint' },
  { name: 'book-plan-wx-fail', route: '#/mars/jezero/compare/@34.6750,-105.0750/book/plan', query: 'wx=feed', block: '/v1/forecast', serve: POWER, refNA: true,
    steps: [{ seek: 3 }, { wait: 300 }, { scroll: '#panel', to: '.days' }, { seek: 3.1 }],
    check: 'The forecast refused (404): the sample days, "Sample weather: the forecast couldn’t be loaded." in the hint' },
  // No month good for the purpose: every picked day carries the caveat, in its own words.
  { name: 'book-plan-feed-none', route: '#/moon/haworth/compare/dryvalleys/book/plan', query: 'wx=feed', serve: DRY, refNA: true,
    steps: [{ seek: 3 }, { wait: 300 }, { select: '#b-purpose', value: 'eva_training' }, { scroll: '#panel', to: '.days' }, { tap: '.days li:nth-child(2) .day' }, { tap: '.days li:nth-child(4) .day' }, { seek: 3.1 }],
    check: 'EVA training at the Dry Valleys: every day grey with a dot (lows under −10 °C); "Tue 6 Oct to Thu 8 Oct · 3 days, 0 under the limits. No month’s typical day sits under the limits for EVA training."' },

  // The site selector grid (Should: site selector grid; views/grid.ts): a target world's featured sites as cards over its
  // globe, beside the panel (on a phone, the whole screen). Searches by name land at once, by coordinates one at a time
  // (the mock's 6 s each).
  { name: 'grid-mars', seq: 'grid', route: '#/mars/sites', refNA: true, steps: [{ seek: 3 }],
    check: 'Six Mars cards beside the body panel (no pin hint beside the grid): hillshades, names, kinds, points; Jezero, Gale and Utopia with the IAU feature searched (larger than the window for Gale and Utopia), the crater banner on Jezero and Gale, three doubles each (rank, notes, country, point at 4 dp, shape match); Arcadia "Reading Mars terrain…" with its bar; Mars pressed in the world switch' },
  { name: 'grid-mars-done', seq: 'grid', refNA: true, steps: [{ seek: 21 }],
    check: 'Every card with its doubles and hillshades, the three by coordinates after one another' },
  { name: 'grid-mars-foot', seq: 'grid', refNA: true, steps: [{ scroll: '#grid' }, { seek: 21.1 }],
    check: 'The last cards, the tested line, the hillshade note (illustrative where the mock has no real elevation) and the elevation credits, Copernicus\'s notice whole' },
  { name: 'grid-switch', seq: 'grid', refNA: true, steps: [{ scroll: '#grid', to: '.gh' }, { tap: '#grid .tabs [data-go="moon/sites"]' }, { seek: 23 }],
    check: 'The world switch to the Moon: the Moon\'s six cards, the crumbs "Solar system / Moon / Featured sites"' },
  { name: 'grid-wait', route: '#/mars/sites', refNA: true, steps: [{ seek: 3 }, { scroll: '#grid', to: '[aria-labelledby="gn-meridiani"]' }, { seek: 3.1 }],
    check: 'Meridiani and Elysium "Waiting its turn: searches by coordinates run one at a time." over their skeleton rows; Utopia\'s doubles' },
  { name: 'grid-moon', route: '#/moon/sites', refNA: true, steps: [{ seek: 3 }],
    check: 'The four south-pole regions with their established analog sites (unscored, hillshades from Eidolon\'s own elevation); Hadley–Apennine "Searched as the IAU feature Rima Hadley", the rille banner, and Taurus–Littrow with their doubles; the 60° line once, in the grid\'s lede' },
  { name: 'grid-open', seq: 'grid-open', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { tap: '#pin [data-go="mars/sites"]' }, { seek: 2.8 }, { expect: '#grid h2:focus' }],
    check: 'From the link under the body panel\'s lede: the grid fading in over the globe, the cards rising' },
  { name: 'grid-dive', seq: 'grid-open', refNA: true, steps: [{ seek: 4 }, { tap: '#grid .gt[data-go="mars/jezero"]' }, { seek: 4.3 }],
    check: 'Jezero picked on the grid: the grid fading out as the globe turns and dives' },
  { name: 'grid-system', route: '#/system', refNA: true, steps: [{ seek: 2.5 }, { tap: '#sites' }, { seek: 4.5 }, { expect: '#grid h2:focus' }],
    check: 'From the system view\'s Featured sites cue (bottom left, opposite Beyond): the Mars grid' },
  { name: 'grid-back', route: '#/moon/sites', refNA: true, steps: [{ seek: 3 }, { press: 'Escape' }, { seek: 4.2 }, { expect: '#grid[style*="hidden"]' }, { expect: '#pin h2:focus' }],
    check: 'Esc from the grid: the Moon\'s globe and its panel, the link to the grid under the lede' },
  // A site opened from the grid goes back to it: the crumbs and the panel's back button name it, Esc returns there.
  { name: 'grid-site', seq: 'grid-return', route: '#/mars/sites', refNA: true, steps: [{ seek: 3 }, { tap: '#grid .gt[data-go="mars/jezero"]' }, { seek: 6.5 }, { expect: '#pin h2:focus' }],
    check: 'Jezero opened from the grid: crumbs "Solar system / Mars / Featured sites / Jezero Crater", the panel\'s back button "Featured sites", the status "Esc returns to the featured sites."' },
  { name: 'grid-return', seq: 'grid-return', refNA: true, steps: [{ press: 'Escape' }, { seek: 9 }, { expect: '#grid[style*="opacity: 1"]' }, { expect: '#grid h2:focus' }],
    check: 'Esc from that site: back on the Mars grid (asserted shown)' },
  // The grid's engine and edge states (plan, Verification: Edge states, Engine states).
  { name: 'grid-warming', route: '#/mars/sites', query: 'mock=warming', refNA: true, steps: [{ seek: 3 }],
    check: 'The named cards "Search engine starting up…" over their skeleton rows; Arcadia "Reading Mars terrain…"; no failure box' },
  { name: 'grid-empty', route: '#/mars/sites', query: 'mock=empty', refNA: true, steps: [{ seek: 3 }],
    check: 'The named cards: "No close analog in this region. These are the closest available." as a lede above their doubles, shape match Low' },
  // mock=fail: by name at once, by coordinates at 6, 12 and 18 s.
  { name: 'grid-fail', route: '#/mars/sites', query: 'mock=fail', refNA: true, steps: [{ seek: 19.5 }],
    check: 'Every search failed: one box above the cards, "The search engine didn’t answer", with Try again; each card "The search engine didn’t answer. Open the site to try again." without skeleton rows; the targets\' tiles empty, their windows asked again for a minute (as a loading tile)' },
  // Earth windows the engine can't serve (404 no_image): each double's tile the dashed placeholder, the targets' drawn.
  { name: 'grid-noimage', route: '#/mars/sites', query: 'mock=noimage', refNA: true, steps: [{ seek: 4 }],
    check: 'The named cards\' doubles each on a dashed tile (missing), not an empty one (loading); the targets\' hillshades drawn' },

  // Touch (Should 3), phone only (390 × 844): the sheet dragged by its grip between peek, half and full (a slow
  // release settles on the nearest snap, a flick goes on to the next), its keys; the compare pair stacked; pinch, twist
  // and two-finger orbit on the terrain and the globes; a one-finger tap still pins.
  { name: 'sheet-half', seq: 'sheet', only: 'phone', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { inView: '#grip' }],
    check: 'The sheet at half (54 %) as before, its grip on top: a 36 px pill on the sheet\'s ground, the back link and heading under it' },
  { name: 'sheet-peek', seq: 'sheet', only: 'phone', refNA: true, steps: [{ touch: '#grip', dy: 350, hold: 150 }, { seek: 4.2 }, { expect: '#grip[aria-label^="Panel at peek"]' }],
    check: 'Dragged down and released slowly: the sheet at peek (112 px: grip, "‹ Mars", the heading), the terrain block over the stage above it, legend and caption clear of it' },
  { name: 'sheet-full', seq: 'sheet', only: 'phone', refNA: true, steps: [{ touch: '#grip', dy: -700 }, { seek: 5.4 }, { expect: '#grip[aria-label^="Panel at full"]' }],
    check: 'Flicked up: the sheet at full, up to the top bar, the panel scrolling under its grip; the stage under it not drawn' },
  { name: 'sheet-keys', seq: 'sheet', only: 'phone', refNA: true, steps: [{ tap: '#grip' }, { press: 'End' }, { press: 'ArrowDown' }, { seek: 7 }, { expect: '#grip:focus' }, { expect: '#grip[aria-label="Panel at half height. Expand to full height"]' }],
    check: 'A click steps full round to peek, End goes to full, ArrowDown back to half: the sheet at half, the focus ring round the pill' },
  { name: 'sheet-flick', seq: 'sheet', only: 'phone', refNA: true, steps: [{ touch: '#grip', dy: 120 }, { seek: 8.5 }, { expect: '#grip[aria-label^="Panel at peek"]' }],
    check: 'A short flick down from half: on to peek, though it moved only 120 px' },
  { name: 'sheet-rm', only: 'phone', route: '#/mars/jezero', reducedMotion: true, refNA: true, steps: [{ seek: 3 }, { touch: '#grip', dy: 350, hold: 150 }, { seek: 3.02 }, { expect: '#grip[aria-label^="Panel at peek"]' }],
    check: 'Reduced motion: a release lands on its snap at once (peek a frame after the release, no slide)' },
  { name: 'compare-phone-half', seq: 'sheet-compare', only: 'phone', route: '#/mars/jezero/compare/salda', refNA: true, steps: [{ seek: 3 }],
    check: 'Compare on a phone: the pair stacked, Jezero above Lake Salda, a line between; each caption on one line, each legend clear of its block; the toggle under the sheet\'s grip' },
  { name: 'compare-phone-peek', seq: 'sheet-compare', only: 'phone', refNA: true, steps: [{ touch: '#grip', dy: 350, hold: 150 }, { seek: 4.2 }],
    check: 'The sheet at peek: both blocks larger, the toggle still in reach at the top of the sheet' },
  { name: 'compare-phone-globe', seq: 'sheet-compare', only: 'phone', refNA: true, steps: [{ tap: '#toggle [data-view="globe"]' }, { seek: 7 }],
    check: 'Globe from the toggle: the sheet stays at peek, Mars above Earth, the magnifier at the Earth viewport\'s lower left, above the sheet, clear of the globe and its labels' },
  { name: 'compare-phone-pinch', seq: 'sheet-compare', only: 'phone', refNA: true, steps: [{ touch: '#gl', fy: .66, fingers: 2, spread: 150, twist: 30 }, { seek: 7.5 }],
    check: 'Two fingers spread and twisted on Earth: Earth zoomed in about 2× and turned clockwise with them; Mars unchanged' },
  { name: 'compare-phone-overlay', seq: 'sheet-compare', only: 'phone', refNA: true, steps: [{ tap: '#toggle [data-view="overlay"]' }, { seek: 10 }],
    check: 'Overlay at peek: one block, the toggle with its slider on two rows under the grip, both in the peeked sheet, and "‹ Jezero Crater" whole below them (peek takes in the slider\'s row)' },
  { name: 'pinch-terrain', seq: 'pinch', only: 'phone', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { touch: '#tui0', fy: .55, fingers: 2, spread: 180, twist: 45 }, { seek: 3.5 }],
    check: 'Two fingers spread and twisted on the terrain: the block closer (to the zoom limit) and turned 45° clockwise with them, the north arrow with it' },
  { name: 'orbit-terrain', seq: 'pinch', only: 'phone', refNA: true, steps: [{ touch: '#tui0', fy: .55, fingers: 2, dy: 60, hold: 100 }, { seek: 4 }],
    check: 'Two fingers moved down together: the block orbits as for one finger, seen from higher up; no zoom, no turn' },
  { name: 'pinch-globe', only: 'phone', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { touch: '#hud', fingers: 2, spread: 170, twist: -30 }, { seek: 3 }, { expect: 'body[data-view="body"]' }],
    check: 'Pinch on the globe: Mars zoomed in to the 10° grid and turned 30° anticlockwise; no pin dropped on release' },
  { name: 'touch-pin', only: 'phone', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { touch: '#hud' }, { seek: 3.3 }],
    check: 'A one-finger tap on the globe still pins: the detection frame at the tap, as dive-0.8s' },
  // Touch review fixes: the content drags the sheet at peek; the body view at peek; a two-finger orbit on a globe;
  // compare under a full sheet.
  { name: 'sheet-swipe', only: 'phone', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { touch: '#grip', dy: 350, hold: 150 }, { seek: 4.2 },
    { touch: '#pin .back >> nth=0', dy: -250, hold: 150 }, { seek: 5.2 }, { expect: '#grip[aria-label^="Panel at half"]' }, { expect: 'body[data-view="site"]' }],
    check: 'At peek, a slow swipe up that starts on "‹ Mars" raises the sheet (to half, the nearest snap) instead of scrolling it; the back link not followed' },
  { name: 'sheet-body-peek', only: 'phone', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { touch: '#grip', dy: 350, hold: 150 }, { seek: 4 }, { expect: '#grip[aria-label^="Panel at peek"]' }],
    check: 'The body view with the sheet at peek: Mars whole and centred in the taller stage, the HUD\'s brackets round it, the longitude tape above it, graticule labels on it; the sheet shows its grip, "‹ All worlds" and "Mars"' },
  { name: 'orbit-globe', only: 'phone', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { touch: '#hud', fingers: 2, dy: 80, hold: 100 }, { seek: 3 }, { expect: 'body[data-view="body"]' }],
    check: 'Two fingers moved down together on the globe: Mars turned as for a one-finger drag (its north tipped toward the viewer, against pinch-globe), the same size, not turned about the line of sight; no pin dropped' },
  { name: 'compare-phone-full', only: 'phone', route: '#/mars/jezero/compare/salda/globe', refNA: true, steps: [{ seek: 3 }, { touch: '#grip', dy: -700 }, { seek: 4.2 },
    { expect: '#grip[aria-label^="Panel at full"]' }, { expect: '#ui[style*="visibility: hidden"] #area:not([hidden])[style*="visibility: inherit"]' }],
    check: 'Globe compare with the sheet flicked to full: up to the top bar, nothing of the stage through it (no magnifier by the clock), the toggle under the grip' },
  // Touch review fixes, round 2: a sheet scrolled at half shows its top again at peek (it can't scroll there), and a
  // tap on Search this area at peek leaves it there.
  { name: 'sheet-peek-scrolled', only: 'phone', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3.5 }, { scroll: '#panel', to: '[data-doubles]' }, { seek: 3.6 },
    { touch: '#grip', dy: 350, hold: 150 }, { seek: 4.8 }, { expect: '#grip[aria-label^="Panel at peek"]' }, { inView: '#pin .back' }, { inView: '#pin .title' }],
    check: 'Scrolled to the results at half, then dragged to peek: the peeked sheet shows its top, the grip, "‹ Mars" and the heading, not a slice of the results' },
  { name: 'compare-phone-peek-scrolled', seq: 'peek-area', only: 'phone', route: '#/mars/jezero/compare/salda/globe', refNA: true, steps: [{ seek: 3 }, { scroll: '#panel' }, { seek: 3.1 },
    { touch: '#grip', dy: 350, hold: 150 }, { seek: 4.3 }, { inView: '#toggle [data-view="globe"]' }, { inView: '#pin .back' }],
    check: 'Globe compare scrolled to its foot at half, then dragged to peek: the toggle and "‹ Jezero Crater" in the peeked sheet; the magnifier at the Earth viewport\'s lower left' },
  { name: 'compare-phone-peek-area', seq: 'peek-area', only: 'phone', refNA: true, steps: [{ tap: '#area' }, { seek: 5.5 }, { expect: '#area[data-on]' }, { inView: '#toggle [data-view="globe"]' }],
    check: 'Search this area tapped at peek: the magnifier coral (the area on), the Earth pins in view; the sheet still shows its top, the toggle in reach' },
  // Telemetry flash (Should 7): a HUD or telemetry reading that changes after holding for .5 s flashes coral and eases back
  // over .6 s; drift (a reading changing every frame, or sim time ticking it over at any rate but Live) doesn't; off under
  // reduced motion. The HUD's readouts are desktop only. `--fl: 0.` is a flash under way (GSAP leaves `--fl: 0` after).
  { name: 'hud-flash-in', only: 'desktop', route: '#/mars', refNA: true, steps: [{ seek: .55 }],
    check: 'The HUD just on: its left readouts (sub-observer, sub-solar, rotation, time rate) coral, easing back; the cursor\'s readouts "-"' },
  { name: 'hud-flash-rate', only: 'desktop', route: '#/mars', refNA: true, steps: [{ seek: 2.5 }, { tap: '#rate [data-rate="1"]' }, { seek: 2.6 }, { expect: '#h-rate[style*="--fl: 0."]' }],
    check: 'Live picked: time rate "LIVE" coral, easing back; sub-observer and sub-solar (changing every frame at ×600 until then) in the HUD\'s white, not flashing' },
  { name: 'hud-flash-rm', only: 'desktop', route: '#/mars', reducedMotion: true, refNA: true, steps: [{ seek: 2.5 }, { tap: '#rate [data-rate="1"]' }, { seek: 2.6 }, { expect: '#h-rate:not([style*="--fl"])' }],
    check: 'Reduced motion: as hud-flash-rate, "LIVE" in the HUD\'s white, no flash' },
  { name: 'intro-tick', route: '#/', refNA: true, steps: [{ seek: 2.65 }],
    check: 'Intro telemetry: the countdown just ticked to T−00:00:05, coral easing back; UTC, the sub-point and the rising sun elevation (drift: the bottom corners\' dark text over the glow never flashes) and the frame\'s counter (stepped at 1.9 s) white' },
  { name: 'hud-flash-cursor', seq: 'hud-cursor', only: 'desktop', route: '#/moon', refNA: true,
    steps: [{ seek: 2.5 }, { hover: '#hud' }, { seek: 2.6 }, { expect: '#h-elev[style*="--fl: 0."]' }, { expect: '#h-obs:not([style*="--fl: 0."])' }],
    check: 'Pointer onto the Moon at ×600: the cursor\'s four readouts (cursor, sun elevation, local time, daylight) coral, easing back; the sub-observer and sub-solar white' },
  { name: 'hud-flash-cursor-rest', seq: 'hud-cursor', steps: [{ seek: 8 }, { expect: '#hud:not(:has(dd[style*="--fl: 0."]))' }],
    check: 'The pointer resting 5.4 s on: every readout white, though the sun elevation, local time and sub-observer have ticked over every 1–3 s (drift at ×600)' },
  // Accessibility pass (Should 10): the skip link, the 3D view's keys and focus frame, the search said as it changes
  // (#live-s), the top bar out of the Tab order on the title. `npm run a11y` runs axe over the main routes.
  { name: 'a11y-skip', seq: 'a11y-skip', route: '#/mars/jezero', refNA: true, steps: [{ seek: 3 }, { eval: "document.getElementById('skipto').focus()" }, { inView: '#skipto' }, { seek: 3.05 }],
    check: 'The skip link, the first Tab stop, shown over the top bar\'s left end while it has the focus: "Skip to the panel" in a solid surface-2 button' },
  { name: 'a11y-skip-go', seq: 'a11y-skip', refNA: true, steps: [{ press: 'Enter' }, { seek: 3.1 }, { expect: '#pin h2:focus' }, { expect: '#skipto:not(:focus)' }],
    check: 'Enter on it: the focus on the panel\'s heading (Jezero Crater), the skip link gone; the white ring round the heading\'s words shows where the focus went' },
  { name: 'a11y-skip-grid', seq: 'a11y-skip-grid', route: '#/mars/sites', refNA: true, steps: [{ seek: 3 }, { eval: "document.getElementById('skipto').focus()" }, { inView: '#skipto' }, { expect: '#skipto:not([hidden])' }, { seek: 3.05 }],
    check: 'The grid\'s skip link focused: "Skip to the featured sites" over the top bar\'s left end (on a phone over the logo, short of the time toggle)' },
  { name: 'a11y-skip-grid-go', seq: 'a11y-skip-grid', refNA: true, steps: [{ press: 'Enter' }, { seek: 3.1 }, { expect: '#grid h2:focus' }],
    check: 'Enter on it: the focus on the grid\'s heading, its ring round "Featured sites"' },
  { name: 'a11y-crumbs-ring', only: 'desktop', route: '#/mars/jezero', refNA: true, scale: 2,
    steps: [{ seek: 3 }, { eval: "document.getElementById('skipto').focus()" }, { press: 'Tab' }, { press: 'Tab' }, { expect: '#crumbs button:first-child:focus-visible' }, { seek: 3.05 }],
    check: 'Tab past the skip link and the logo: the ring whole round "Solar system", the first crumb (at 2×: not cut by the crumbs\' overflow)' },
  { name: 'a11y-globe-keys', seq: 'a11y-globe', only: 'desktop', route: '#/mars', refNA: true,
    steps: [{ seek: 2.5 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { press: 'ArrowUp' }, { press: '+' }, { seek: 3.2 },
      { expect: '#gl:focus-visible[role="application"][aria-label^="Mars globe. Arrow keys turn it"]' }, { eval: "if (getComputedStyle(document.getElementById('kf')).visibility !== 'visible') throw new Error('no focus frame')" },
      { expect: '#cursor.on' }, { expect: '#hud[aria-hidden="false"]' }, { eval: "if (!/^\\[ Arrows turn · \\+ − zoom · Enter pins the centre \\]$/.test(document.getElementById('h-hint').textContent) || !/^Arrow keys turn the globe\\. \\+ and − zoom\\. Enter pins the centre\\./.test(document.getElementById('st-r').textContent) || document.getElementById('h-cur').textContent === '-') throw new Error('the keys not shown')" }],
    check: 'The globe focused by keyboard: a white 1.5 px frame 6 px inside its viewport, ending above the status bar; three right arrows, one up and + turned it east and north and zoomed it in (the HUD\'s sub-observer east and north of body-mars\'s 4.2° S, 168.2° E). The keys shown: the HUD\'s hint "[ Arrows turn · + − zoom · Enter pins the centre ]", the status bar "Arrow keys turn the globe. + and − zoom. Enter pins the centre."; the reticle on the globe\'s centre, the cursor readouts (cursor = sub-observer, sun elevation, local time, daylight) filled for it (asserted)' },
  { name: 'a11y-globe-said', seq: 'a11y-globe', refNA: true, steps: [{ seek: 3.7 }, { eval: "if (!/^Centre \\d/.test(document.getElementById('live').textContent)) throw new Error('the centre was not said')" }],
    check: 'The keys at rest: the centre said in the live region ("Centre …° N, …° E", asserted); the frame still on' },
  { name: 'a11y-globe-enter', seq: 'a11y-globe', refNA: true, steps: [{ press: 'Enter' }, { seek: 4.5 }, { expect: 'body[data-view="site"]' }, { expect: '#gl:focus-visible[aria-label$="Enter searches the point at its centre instead."]' },
    { eval: "if (!location.hash.includes('/@') || !/^Reading Mars terrain/.test(document.getElementById('live-s').textContent) || !/^Mars, Pin /.test(document.getElementById('live').textContent)) throw new Error('no pin, its search not said, or the centre said over the route')" },
    { eval: "if (!/Enter searches the centre instead\\.$/.test(document.getElementById('st-r').textContent)) throw new Error('the hold\\'s keys not shown')" }],
    check: 'Enter: a pin at the centre, its search holding the detection frame on the globe; the focus still on the 3D view (its frame on, its name and the status bar now "…Enter searches the centre instead."); "Mars, Pin …" and "Reading Mars terrain…" said, no centre over them (asserted)' },
  { name: 'a11y-search-said', seq: 'a11y-globe', refNA: true, steps: [{ seek: 16 }, { expect: '#gl:focus-visible[aria-label^="Terrain of"]' }, { eval: "if (!/^5 Earth doubles found\\. The closest: /.test(document.getElementById('live-s').textContent)) throw new Error('the results were not said')" }],
    check: 'The pin\'s search in, the dive settled on its terrain (no frame ghost, no grade); the focus still on the 3D view, now "Arrow keys orbit…" (status bar); "5 Earth doubles found. The closest: …, shape match …." said (asserted)' },
  { name: 'a11y-globe-phone', only: 'phone', route: '#/mars', refNA: true,
    steps: [{ seek: 2.5 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowRight' }, { press: 'ArrowRight' }, { press: 'ArrowUp' }, { seek: 3.2 },
      { expect: '#gl:focus-visible[aria-label^="Mars globe. Arrow keys turn it"]' }, { expect: '#cursor.on' }],
    check: 'Phone, the globe focused by keyboard: the frame inside the globe\'s viewport, above the sheet (and above the full maps\' line while it shows); the reticle on the globe\'s centre' },
  { name: 'a11y-purpose-said', seq: 'a11y-purpose', route: '#/mars/jezero', refNA: true,
    steps: [{ seek: 3 }, { eval: "window.__said = []; new MutationObserver(() => __said.push(document.getElementById('live-s').textContent)).observe(document.getElementById('live-s'), { childList: true, characterData: true, subtree: true })" },
      { scroll: '#panel', to: '[data-ask]' }, { select: '#purpose', value: 'education' }, { seek: 3.6 },
      { eval: "if (!__said.includes('') || !/^5 Earth doubles found\\./.test(__said.at(-1))) throw new Error('the new search not said: ' + JSON.stringify(__said))" }],
    check: 'Education picked on Jezero: its search said afresh (the region emptied, then "5 Earth doubles found. The closest: …" written 0.15 s later, asserted), though it settles within milliseconds and says the same as before' },
  { name: 'a11y-filter-said', seq: 'a11y-purpose', refNA: true,
    steps: [{ eval: "__said.length = 0" }, { tap: '.filt summary' }, { tap: '#f-polar' }, { seek: 4.2 },
      { eval: "if (!__said.includes('') || !/^5 Earth doubles found\\./.test(__said.at(-1))) throw new Error('the filtered search not said: ' + JSON.stringify(__said))" }],
    check: 'Exclude polar checked: said afresh too (emptied, "Searching Earth…", then the same sentence as before; asserted)' },
  { name: 'a11y-keys-escape', only: 'desktop', route: '#/mars', refNA: true,
    steps: [{ seek: 2.5 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowRight' }, { press: 'Escape' }, { seek: 3.5 }, { expect: 'body[data-view="overview"]' },
      { eval: "if (document.getElementById('live').textContent !== 'Solar system') throw new Error('a centre said over the route: ' + document.getElementById('live').textContent)" }],
    check: 'An arrow, then Escape within 0.4 s: the system view, "Solar system" said and left (no "Centre …" from the system camera, asserted)' },
  { name: 'a11y-terrain-keys', only: 'desktop', route: '#/mars/jezero', refNA: true,
    steps: [{ seek: 3 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowLeft' }, { press: 'ArrowLeft' }, { press: 'ArrowLeft' }, { press: 'ArrowDown' }, { press: '-' }, { seek: 3.5 },
      { expect: '#gl:focus-visible[aria-label^="Terrain of Jezero Crater"]' }, { expect: '#hud[aria-hidden="true"]' }, { eval: "if (!/^Arrow keys orbit\\. \\+ and − zoom\\. Esc returns to the globe\\.$/.test(document.getElementById('st-r').textContent)) throw new Error('the keys not shown')" }],
    check: 'The terrain focused (the globe\'s faded HUD hidden from screen readers, asserted): the frame round its viewport, above the status bar, which says "Arrow keys orbit. + and − zoom. Esc returns to the globe."; the block orbited round to the right, lower and farther than site-jezero' },
  { name: 'a11y-compare-keys', only: 'desktop', route: '#/mars/jezero/compare/salda/globe', refNA: true,
    steps: [{ seek: 3 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowLeft' }, { press: 'ArrowLeft' }, { press: 'ArrowLeft' }, { seek: 3.5 }],
    check: 'Compare\'s globes focused: the frame round Earth\'s viewport only (the keys turn Earth), above the status bar; Earth turned west of compare-globe\'s; the status bar "Arrow keys turn Earth. + and − zoom it."' },
  { name: 'a11y-compare-terrain-keys', route: '#/mars/jezero/compare/salda', refNA: true,
    steps: [{ seek: 3 }, { eval: "document.getElementById('gl').focus()" }, { press: 'ArrowLeft' }, { press: 'ArrowLeft' }, { seek: 3.5 }, { expect: '#gl:focus-visible[aria-label^="Terrain of Jezero Crater"]' }],
    check: 'Compare\'s terrains focused: one frame round both viewports (the keys orbit both blocks), above the status bar on a laptop, above the sheet on a phone; both blocks orbited alike' },
  { name: 'a11y-title-tab', only: 'desktop', route: '#/', refNA: true, steps: [{ seek: 16 }, { press: 'Tab' }, { expect: '#title .tcta .btn.primary:focus' }],
    check: 'Tab on the title: the focus ring on Enter the system, not on the hidden top bar' },

  // Share and meta: Copy link on the site and compare views, the page title per route.
  { name: 'share-site', route: '#/mars/jezero', refNA: true,
    steps: [{ seek: 3 }, { eval: SPY_API }, { tap: '[data-link]' }, { seek: 3.1 }, { eval: label('Link copied') }, { eval: copied('#/mars/jezero') },
      { eval: "if (document.title !== 'Jezero Crater, Mars · Eidolon' || document.getElementById('live').textContent !== 'Link copied') throw new Error(document.title)" }],
    check: 'Copy link at the right of the back link\'s row (phone: on the sheet\'s, above the heading); tapped: "Link copied" (the route, without ?capture, on the clipboard; the tab titled "Jezero Crater, Mars · Eidolon"; asserted)' },
  { name: 'share-compare', seq: 'share', route: '#/mars/jezero/compare/salda/overlay', refNA: true,
    steps: [{ seek: 3 }, { eval: SPY_CMD }, { tap: '[data-link]' }, { seek: 3.1 }, { eval: label('Link copied') }, { eval: copied('#/mars/jezero/compare/salda/overlay') },
      { eval: "if (document.title !== 'Jezero Crater and Lake Salda · Eidolon') throw new Error(document.title)" }],
    check: 'Compare\'s overlay, no Clipboard API (plain http): the copy command\'s fallback copies the overlay\'s route, "Link copied" (asserted)' },
  { name: 'share-fail', seq: 'share', refNA: true,
    steps: [{ seek: 4.8 }, { eval: label('Copy link') }, { eval: NO_CMD }, { tap: '[data-link]' }, { seek: 4.9 }, { eval: label('Copy from the address bar') }, { eval: ONE_ROW }],
    check: 'Back to "Copy link" 1.6 s on (asserted); no clipboard at all: "Copy from the address bar" (asserted), clear of "‹ Jezero Crater" on one row (asserted)' },
  // A long way back (an IAU name, 23 characters) beside the failure's words: it gives way with an ellipsis, one row.
  { name: 'share-fail-long', route: '#/moon/Promontorium%20Archerusia@16.8043,21.9434/compare/maunakea', refNA: true,
    steps: [{ seek: 4 }, { eval: SPY_CMD }, { eval: NO_CMD }, { tap: '[data-link]' }, { seek: 4.1 }, { eval: label('Copy from the address bar') }, { eval: ONE_ROW }],
    check: 'Compare from Promontorium Archerusia, no clipboard: "Copy from the address bar" at the right, the back link "‹ Promontorium…" cut with an ellipsis, both on one row (asserted); the panel below unmoved' },
  // Copy link by keyboard: Tab from the back link, then Enter.
  { name: 'share-focus', seq: 'share-kb', route: '#/mars/jezero', refNA: true,
    steps: [{ seek: 3 }, { eval: "document.querySelector('#pin .phead [data-go]').focus()" }, { press: 'Tab' }, { expect: '[data-link]:focus-visible' }, { seek: 3.05 }],
    check: 'Tab from the back link: the white focus ring whole round Copy link\'s icon and words (phone: on the sheet\'s back row)' },
  { name: 'share-focus-copied', seq: 'share-kb', refNA: true,
    steps: [{ eval: SPY_API }, { press: 'Enter' }, { seek: 3.15 }, { eval: label('Link copied') }, { eval: copied('#/mars/jezero') }, { expect: '[data-link]:focus-visible' }],
    check: 'Enter: "Link copied" (asserted), the focus kept on the button, its ring round the new words' },
];
