# Eidolon frontend: progress log

Step 1 of 2: a fully working frontend on mock data, no engine running. Plan: `docs/plan.md`. Visual reference:
`reference/eidolon.html` (line 519 is 4.5 MB of base64 textures; never print it). Engine contract copied to
`contracts/` (engine commit in `contracts/ENGINE_COMMIT`); the spec is `engine/code/docs/frontend_spec.md`.

**2026-10-23: the frontend moved into `web/`** (merge-plan D1 a; pushed to github.com/hudayfa7/nasahackathon2026).
Every path in this log is relative to `web/`, except `.claude/launch.json`, which stays at the repo root and runs
`npm --prefix web …`. `scripts/trim-targets.mjs` now defaults to `../engine`.

## Final state (hand-off to step 2, 2026-10-22)

**Items.** Must 10/10, Should 12/12 and Stretch 6/6 done, then the final review (38 findings: 27 fixed, 11 logged).
Not delivered: the plan's Stars row under Rendering and shaders (Stretch); the logo is an in-house stand-in (one-file
swap, `src/brand/logo.svg`). Run and scripts: `README.md`; Claude desktop preview: `.claude/launch.json` (`eidolon-dev`
on :5173, `eidolon-preview` on :4173; both npm scripts now use `--strictPort`, so neither drifts to another port).

**Gates** (after the final review fixes, `50587c2`; the full run at `456348a` is in `captures/final-gates.md`):

| Gate | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm test` | 388/388 (30 files) |
| `npm run build` | pass, copy check clean, no chunk notice (limit raised to 700 kB raw; the gzipped budget is what counts) |
| `npm run capture` | 662/662 at desktop and phone; console errors only from states that refuse a resource on purpose |
| `npm run a11y` | 52/52 (26 routes × 2 sizes), no WCAG 2.1 A/AA violations |
| `npm run perf` | within budget: JS 340.8 of 350 KB gzip, GPU 294.6 of 300 MB, first paint 0.45–0.47 s (Fast 4G, phone), 60 fps |
| Hand-off | `rm -rf dist && npm run build`, `npm run preview` and `npm run dev` from scratch: `/` and a JS chunk 200 on both; `#/`, `#/mars/jezero`, `…/compare/salda` start with no console errors; servers stopped |

**Known limits that matter for the demo.**
- (Fixed 2026-11-14: the five featured targets Utopia, Arcadia, Meridiani, Elysium and Taurus–Littrow were added to
  `real-sites.ts` and fetched, so they show real elevation. The engine's demo-path Earth cells, `DEMO_CELLS`, are in
  there too.)
- Intermittent black compare globes on ANGLE Metal (2 of ~40 tries in one review; not reproduced; not checked on real
  Metal hardware here). If seen, reload; then check `sunDir` and the colour maps' upload.
- The copy says "within 60°" (the spec) while the Moon cutoff is 59.5° (the engine's): a pin between the two reads as
  no data.
- Budgets nearly full: about 9 KB of JS and 5 MB of GPU memory left. Frame rate measured only on this M3 and a
  CPU-throttled phone proxy, never on a real mid-range phone.
- The weather window needs the network (Open-Meteo, NASA POWER); offline it shows sample days, labelled.
- Stars are 1,400 seeded points; the system view's sun has no lens flare; textures are JPEG, 4K at most.

**Top merge notes** (all of them under "Merge notes"):
- `http.ts` has never run against an engine: set `VITE_DATA=engine` (and `VITE_API` if not `127.0.0.1:8000`), then run
  the full capture, the probe flows and `npm run perf` on the engine build.
- Engine summaries carry percentages and a place prefix; `brief`, `unplace` and `fractions` (`ui/results.ts`) rewrite
  them by matching `engine.py`'s summary shape: update them if it changes, or have the engine phrase fractions.
- `/elevation/*` has no example fixture; the mock's shape is the spec's. Check the illustrative-to-real terrain swap.
- Real crops exist only for the mock's 19 Earth cells: rerun `fetch:real -- --only=sites` with the stage searches'
  engine cells added.
- Drop or lazy-import `mock.ts` in an engine build (~3 KB gzip). At deploy, set `VITE_SITE_URL` for absolute link
  previews.

## Status

### Must (plan order)
- [x] Port the mock into the build (module map, three.js upgrade, visual parity), in five stages:
  - [x] Stage 1: skeleton, ?capture contract and the opening (intro, sunrise, title) — see "Port stage 1"
  - [x] Stage 2: body globe view and its UI — see "Port stage 2"
  - [x] Stage 3: site view by deep link, then the polar fix — see "Port stage 3"
  - [x] Stage 4: dive, detection frame and compare — see "Port stage 4"
  - [x] Stage 5: system, info sheet, Beyond, footer carousel; late assets; full parity sweep — see "Port stage 5"
  - [x] Parity fixes, round 1 (30 reviewer findings) — see "Port parity fixes, round 1"
  - [x] Parity fixes, round 2 (18 reviewer findings) — see "Port parity fixes, round 2"
  - [x] Parity fixes, round 3 (1 reviewer finding) — see "Port parity fixes, round 3"
- [x] Fix the Must rows under Visual bugs in the mock (polar sites done in port stage 3; orient then dive, compare to
  scale and the detection readout row in stage 4; late assets in stage 5)
- [x] Data module on the engine's contract (spec, schemas, examples copied; types generated; mock.ts replays them) — see "Data module (Must 3)"
  - [x] Review fixes (22 reviewer findings) — see "Data module review fixes"
  - [x] Review fixes, round 2 (1 reviewer finding: the Artemis sites' doubles) — see "Data module review fixes, round 2"
- [x] Rework the results for the engine's output (cards, detail, no percentages, capability banner, compare twins, Earth pins + footprint, purpose picker + filters, IAU targets, states by source)
  - [x] Part 1: cards, detail, no percentages, capability banner — see "Results rework 1/4"
    - [x] Review fixes (22 reviewer findings) — see "Results rework 1/4 review fixes"
    - [x] Review fixes, round 2 (2 reviewer findings) — see "Results rework 1/4 review fixes, round 2"
  - [x] Part 2: compare twins, Earth pins with their footprint — see "Results rework 2/4"
    - [x] Review fixes (15 reviewer findings) — see "Results rework 2/4 review fixes"
    - [x] Review fixes, round 2 (3 reviewer findings) — see "Results rework 2/4 review fixes, round 2"
  - [x] Part 3: purpose picker and filters, IAU targets — see "Results rework 3/4"
    - [x] Review fixes (19 reviewer findings) — see "Results rework 3/4 review fixes"
    - [x] Review fixes, round 2 (4 reviewer findings) — see "Results rework 3/4 review fixes, round 2"
  - [x] Part 4: states by source — see "Results rework 4/4"
    - [x] Review fixes (14 reviewer findings) — see "Results rework 4/4 review fixes"
    - [x] Review fixes, round 2 (1 reviewer finding: a pin's search above the fold) — see "Results rework 4/4 review fixes, round 2"
- [x] Real data on the demo path (textures and crops for the stage sites and their top doubles) — see "Real data on the demo path (Must 5)"
  - [x] Review fixes (21 reviewer findings) — see "Real data on the demo path review fixes"
  - [x] Review fixes, round 2 (3 reviewer findings: pins on the stage sites, the phone compare legend, Hellas) — see "Real data on the demo path review fixes, round 2"
- [x] Booking flow (listing, plan a campaign, review, confirmation; mock only) — see "Booking flow (Must 6)" and its review fixes
  - [x] Review fixes, round 2 (1 reviewer finding: an inline error that failed to come back) — see "Booking flow review fixes, round 2"
- [x] Logo (an in-house stand-in mark until the logo chat delivers; every variant from `src/brand/logo.svg`) — see "Logo (Must 7)"
  - [x] Review fixes (6 reviewer findings) — see "Logo review fixes"
- [x] Copy pass (intro, title, info sheet, ledes, purposes, Beyond, states, booking; the MoonBnb guard; the bundle's copy check) — see "Copy pass (Must 8)"
  - [x] Review fixes (15 reviewer findings) — see "Copy pass review fixes"
- [x] Rendering pipeline and the opening (the six Must rows under Rendering and shaders, HDR first) — see "Rendering pipeline and the opening (Must 9)"
  - [x] Review fixes (29 reviewer findings) — see "Rendering pipeline and the opening review fixes"
  - [x] Review fixes, round 2 (2 reviewer findings: Skip intro popped the sunrise in) — see "Rendering pipeline and the opening review fixes, round 2"
- [x] Meet the performance budget (at Must 10: JS 308 KB gzip, GPU memory 284 MB; at the final gates, with every
  Should and Stretch item in: JS 340.2 of 350 KB (340.8 after the final review fixes), GPU memory 294.6 of 300 MB at 1280 × 800 @2, so about 10 KB and 5 MB
  of headroom; first paint 0.45–0.8 s on Fast 4G; 60 fps measured only on this Apple M3 laptop and on a phone proxy (the
  M3's GPU at 390 × 844 @3 with a 4× CPU slowdown): no mid-range laptop or real mid-range phone was measured; `npm run
  perf`, `captures/final-gates.md`) — see "Performance budget (Must 10)"
  - [x] Review fixes (9 reviewer findings: the start waits on the opening route's maps only, 3.3 s on #/ over Fast 4G
    where it was ~9 s; buffers counted, 288 MB; perf fails on a route that stops drawing) — see "Performance budget review fixes"
  - [x] Review fixes, round 2 (2 reviewer findings: a site or compare deep link waits on its real elevation, the rest
    loads by need, a world draws in its mean colour until its map lands) — see "Performance budget review fixes, round 2"
- [x] Must list: holistic review fixes (3 cross-item findings: a skip link to the Earth doubles, held bodies keep
  turning with the view tracking the site, real crops for the mock's Earth cells) — see "Must list holistic review fixes"

### Should
- [x] Overlay compare (the double's terrain ghosted onto the target's, a slider between them; 3D and twins; `/overlay`) — see "Overlay compare (Should 1)"
  - [x] Review fixes (13 reviewer findings: Back from the overlay threw every frame, a curtain's swap turned the ghost
    off, the toggle overran an iPad-portrait stage, notes and contours said whose, a compact phone legend and a sticky
    slider, tinted twins) — see "Overlay compare review fixes"
  - [x] Review fixes, round 2 (1 reviewer finding: on a phone the block framed smaller and up-left, below both
    captions; the legend's plate two rows, clipping only its front corner) — see "Overlay compare review fixes, round 2"
- [x] Site selector grid (`#/mars/sites`: a target world's featured sites as cards with their windows' hillshades and
  three closest doubles, over the globe beside the body panel's list; the whole screen on a phone) — see "Site selector grid (Should 2)"
  - [x] Review fixes (15 reviewer findings: rows as a result card's head with rank, notes and point, the IAU feature
    and capability banner on the card, one failure box with Try again, a placeholder for a missing hillshade, back to
    the grid from a site, the panel's copy beside it, the panel across the breakpoint) — see "Site selector grid review fixes"
  - [x] Review fixes, round 2 (1 reviewer finding: the grid's and the panel's headings never took the focus, both still
    hidden when asked; the panel's focus now waits for it on its way in) — see "Site selector grid review fixes, round 2"
- [x] Touch (pinch, twist and two-finger orbit on the globe and terrain; the phone's sheet dragged by its grip between
  peek, half and full; compare stacked on a phone, blocks framed beside their legends) — see "Touch (Should 3)"
  - [x] Review fixes (19 reviewer findings: gesture copy by the main pointer, the illustrative-terrain caveat and the
    shared exaggeration back on a phone, larger stacked globes, markers kept to their viewport, the divider drawn, peek
    with the slider's row and dragged by its content, the plate clear of a lone block, stale or second pointers, nothing
    of the stage under a full sheet, the worker dropped for step 1) — see "Touch review fixes"
  - [x] Review fixes, round 2 (4 reviewer findings, one defect seen three times: peek kept the panel's scroll offset, so
    a sheet scrolled at half showed a slice of mid-content at peek, the back link and compare's toggle out of reach;
    Search this area under the selected Earth pin's label on a phone; plus Search this area doing nothing on a phone at
    half, found on the way) — see "Touch review fixes, round 2"
- [x] Weather window from a real feed (the Open-Meteo forecast and NASA POWER's climatology fetched in the browser for
  the Earth site or double on screen; days marked under the chosen purpose's limits, one table; best months from the
  climatology; the booking plan's date picker on it; sample days offline and under ?capture) — see "Weather window from
  a real feed (Should 4)"
  - [x] Review fixes (15 reviewer findings: the site view's week from the place's own today, no month good for the
    purpose caveated, best months in monthly terms, a dot for rain or temperature over the limits, the Open-Meteo
    credit linked, the listing's Season loading and its sample months said so, pulsing placeholders, month runs as
    ranges, purposes escaped, three site-view states and two booking states) — see "Weather window review fixes"
- [x] Surface photos (12 NASA photographs, web-sized and lazy: the rover, lander and Apollo sites (Jezero, Gale,
  Meridiani, Elysium, Hadley–Apennine, Taurus–Littrow) and six established Earth sites; elsewhere the slot says why there
  is none; each credited under the strip, linked to its page in NASA's library, and in `docs/credits.md`) — see "Surface
  photos (Should 5)"
  - [x] Review fixes (9 reviewer findings: NASA field photographs of Atacama and Mauna Kea added, the no-photo sentences
    no longer deny photos that exist, a pin inside a featured site's square shows its photograph, Utopia's own
    sentence, a photograph that doesn't load gives way to a sentence, the Dry Valleys and Pilbara recropped) — see
    "Surface photos review fixes"
  - [x] Review fixes, round 2 (3 reviewer findings: ten more landings photographed (Apollo 11, 12, 14 and 16, Viking 1
    and 2, Pathfinder, Phoenix, Spirit, Opportunity at Endeavour), shown for a pin or named target whose 18.8 km window
    holds the spot; Viking 2's distance from the Utopia site back to about 680 km) — see "Surface photos review fixes,
    round 2"
- [x] Progressive textures (each world starts on a 1024 px low tier of its colour map and crossfades to the 4K map,
  the highest the 300 MB GPU budget allows; a quiet HUD line in the status bar while they load; the elevation patches a
  file each, loaded when a view first reads one: site and compare deep links start in 2.0–2.7 s on Fast 4G, were
  8.9–9.4 s) — see "Progressive textures (Should 6)"
  - [x] Review fixes (11 reviewer findings: a named target's compare window on its IAU centre from the first frame, so
    the start waits on the patch compare keeps; a world's featured sites' patches load when it shows; the loading line
    only while a globe on screen is on its low tier; cut crops wait for the full map, Beyond's repaint crossfades; late
    patches redraw only what changed; the 4K upload's ~125 ms measured; stale patch files removed) — see "Progressive
    textures review fixes"
  - [x] Review fixes, round 2 (1 finding: on the phone, Search this area rises clear of the status line) — see
    "Progressive textures review fixes, round 2"
- [x] Telemetry flash (a HUD or telemetry reading that changes after holding for .5 s flashes coral and eases back over
  .6 s: the globe HUD's eight readouts and the intro's four telemetry values; drift, a reading changing every frame,
  doesn't strobe; off under reduced motion; on the one clock) — see "Telemetry flash (Should 7)"
  - [x] Review fixes (10 reviewer findings: on the globe, sim time ticking a reading over is drift at any rate but Live,
    so the Moon's HUD no longer pulses coral at ×600; the intro flashes only its countdown and the frame's counter, not
    the bottom corners' dark text over the glow; the detection frame's Matching line flashes as a pin's search lands;
    a hover step and four states) — see "Telemetry flash review fixes"
- [x] Beyond imagery (each card's world as a spacecraft saw it, in the footer's dots and the world's ink: Venus from
  Mariner 10, Mercury from MESSENGER, Callisto from Galileo, Titan from Cassini; public-domain NASA images, credited on
  each image's foot, linked to the library, and in `docs/credits.md`; drawn as the cards come in, then held) — see
  "Beyond imagery (Should 8)"
  - [x] Review fixes (10 reviewer findings: Beyond's images asked for on entry, not behind every world's full map; an
    empty frame hidden from screen readers until its image is drawn; a late image fades only its dots, the frame
    holds; in four narrow columns every caption keeps two lines so the headings line up; each entry starts at the top;
    the capture checks name Mariner 10) — see "Beyond imagery review fixes"
  - [x] Review fixes, round 2 (1 reviewer finding: the caption line made the cards taller, so they ran into the galaxy's
    labels on short desktop windows and scrolled past them in two columns; the labels now hide wherever a card can reach
    them, measured) — see "Beyond imagery review fixes, round 2"
- [x] Fallback without WebGL (no WebGL, a failed start or a lost graphics context: the title as a static poster, its
  shot pre-rendered by the capture harness under the title's own lockup, wordmark and blurb with the reason; then the
  featured sites and their three closest doubles from each site's own search, which also serves screen readers; every
  site and double links to its route, a deep link lands on its site, after a lost context a link reloads into the full
  view) — see "Fallback without WebGL (Should 9)"
  - [x] Review fixes (18 reviewer findings: links to the current route, the lost page announced, its searches on the
    default query, caveats per double, the poster's crop, the reason on a deep link, clicks that don't jump, a sticky
    stop and the dead app's keys after a lost context, two new states) — see "Fallback without WebGL review fixes"
  - [x] Review fixes, round 2 (2 reviewer findings: a context lost during a search by coordinates froze the tab, the
    page and the dead app calling each other's searches off for good: the dead app now asks none; a campaign plan
    being filled was lost with the context: plans and requests are kept for the tab's session, the page says so) —
    see "Fallback without WebGL review fixes, round 2"
- [x] Accessibility pass (a skip link to the panel or the site grid; the 3D view a Tab stop where its keys move it:
  arrows turn the globe or orbit the terrain, + and − zoom, Enter pins the globe's centre, the centre said; a focus frame
  round its viewport; one focus ring, inputs included; the top bar and far-side markers out of the Tab order; the site's
  search said in a few words as it changes; `--text-3` at AA, the HUD's labels and the graticule brighter; `npm run
  a11y`: axe over 20 routes at both sizes, no violations) — see "Accessibility pass (Should 10)"
  - [x] Review fixes (12 reviewer findings: a new search said afresh though it says the same, the keys shown on screen
    while the 3D view has the focus (status bar, HUD hint, the reticle and cursor readouts on its centre), the focus kept
    there after Enter pins, the heading's ring on keyboard arrival, the frame above the status bar, the crumbs' ring
    whole, the faded HUD hidden from screen readers, booking days named from what they show, a stale centre no longer
    said over a route, eight new states) — see "Accessibility pass review fixes"
  - [x] Review fixes, round 2 (1 reviewer finding: the graticule labels still unreadable over the Moon's lit ground;
    a solid 1 px dark edge in place of the soft halo) — see "Accessibility pass review fixes, round 2"
- [x] Share and meta (Copy link on the site and compare views, with the copy command as a fallback and a brief
  confirmation; a page title per route; Open Graph and Twitter meta with a 1200 × 630 image of the title made by the
  capture harness; the three faces self-hosted from Google Fonts' own files, OFL beside them) — see "Share and meta (Should 11)"
  - [x] Review fixes (5 reviewer findings, 1 = 5: `og:url`; a long way back cut with an ellipsis beside Copy link's
    words, which are shorter; the preview image without the unlabelled site dots, their rings and the dashed frame, its
    blurb off the limb's glow; the copied link's missing query logged as a shortcut; three new states) — see "Share and
    meta review fixes"
- [x] Should rows under Rendering and shaders and under Visual bugs (all twenty rows: the globes' relief from normal
  maps baked from the DEMs and the Moon lit by Lommel-Seeliger; the site's orbital image draped over its block, labelled
  contours, a water shader, level of detail; the terrain swap a crossfade of the held frame; the detection grade in
  each site's own palette over the bodies and blocks (masked by alpha, not the whole frame: Deviations), on every site
  entry; Beyond's reveal and the footer's dots off the CPU;
  Eidolon-1 low-poly PBR; twelve booking icons; the phones' half-resolution bloom, 128-sample meshes and 2K maps; the
  phone sheet's gesture hint; the HUD clamped; title annotations by depth and nearest; all lit from the site's sun;
  one label pass; reduced motion completed; crosshair only where it moves the pin; viewports on whole pixels; the
  hover state and logo variants from earlier items) — see "Rendering and visual-bug Should rows (Should 12)"
  - [x] Review fixes (22 reviewer findings, three seen twice or thrice: the terrain overlay hidden off its view and under
    the frame, so its image toggle no longer takes clicks or the Tab key over the globe; the toggle updated in place,
    keeping the focus, unpressed and aria-disabled on a failed image, a 44 px touch target; the ramp hidden while draped;
    contour labels inside their viewport and clear of the overlay's boxes; "Site acquired" whole on phones; the title's
    annotations fading as it scrolls; graticule labels inside the HUD's box, off its hint; no Esc on touch screens; the
    held frame 8-bit; a crossfade joining one under way; seven deviations logged; five new states) — see "Rendering and
    visual-bug Should rows review fixes"
  - [x] Review fixes, round 2 (2 reviewer findings: under reduced motion a dive left the frame and its grade on for
    good and the terrain overlay hidden, now the frame shown before the swap and held as with motion, on a deep link
    too; no readout row on compare, where it ran under the view toggle; three new states) — see "Rendering and
    visual-bug Should rows review fixes, round 2"
- [x] Should list: holistic review fixes (1 cross-item finding: compare lit from one light, both blocks, the overlay
  and both minis from the twins' north-west 315°, where each side had its own site's sun) — see "Should list holistic
  review fixes"

### Stretch
- [x] Sun-angle slider on terrain (under the site view's map: a local solar time and a date light the block and the map
  from that body's sun as it stands then, at its true height, shadows cast at true scale over the body's curve; the
  Moon's subsolar latitude now real (±1.54°), its polar season; off, the relief light as before; not on compare, which
  keeps the twins' 315°) — see "Sun-angle slider (Stretch 1)"
  - [x] Review fixes (18 reviewer findings, four seen twice: the curve now whole, each sample's sun higher toward it
    and lower away by its offset over the body's radius, in the shadow march, the block's shader and the map; the
    caveats in the app (only ground inside the square casts shadows; high ground catches a sun below the level horizon);
    first on, the date of now's own solar day; the sun's latitude on the Moon and Earth; the orbital image darkened
    under a set sun; "Lit for … UTC" on the stage and a line on compare; "Time of day (local solar)", "Lunar day
    holding"; a whole-date check; four new states) — see "Sun-angle slider review fixes"
- [x] Slope hazard layer (under the site view's map, "Tint slopes over 15°": the block and the map greyed, their ground
  steeper than 15° coral, from one slope grid per terrain at its true spacing; the key with the area over 15° and the
  spacing it is measured over in the panel, a coral row in the stage's legend; not on compare, which says so; the
  GLO-30 tile seam that left Meteor Crater a 100 m trench fixed in the fetch script) — see "Slope hazard layer (Stretch 2)"
  - [x] Review fixes (8 reviewer findings, one seen twice: compare tinted too, both blocks, minis and legends, its
    checkbox under its table; the caveat gives the elevation's own spacing where it is coarser than the samples (a polar
    pin's 1 km, Meteor Crater's 30 m); the section after Sunlight; a pin's area redone when its height map lands late; the
    phone legend clear of the block; five new states) — see "Slope hazard layer review fixes"
- [x] Profile and measure (under the site view's map, "Measure a line on the map": a mouse drags or clicks each end,
  touch taps each end, the keyboard types both ends' coordinates; the line coral along its great circle on the map, its
  length on the body's radius, a cross-section chart from the block's own heights with a hover readout, and its rise,
  climb and descent, steepest grade; a swipe on the map still scrolls the sheet) — see "Profile and measure (Stretch 3)"
  - [x] Review fixes (11 reviewer findings, three seen twice: a tap's chart readout stays after the finger lifts; the
    line's length in a chip by B on the map, and a typed line's status line scrolled into view; the same point an error
    like the others; the fields' placeholders; larger chart labels; the line pale over the slope tint; `Profile.u`/`.v`
    gone; seven new states) — see "Profile and measure review fixes"
- [x] Landing ellipse (under the site view's map, after Slope hazard, "Draw a mission's landing ellipse": a mission's
  ellipse at its true size round the site's centre, coral on its dark casing on the block (in its shader, draped) and
  the map; presets per body, Perseverance 7.7 × 6.6 km and Curiosity 20 × 7 km on Mars, Artemis HLS's 200 m circle and
  Apollo 11's 18.5 × 4.8 km on the Moon, all four on Earth; the long axis turned by a slider; its size, area and share
  over 15° (a fraction, of the part inside the map) with the source and caveats; the stage's caption names it; not on
  compare) — see "Landing ellipse (Stretch 4)"
  - [x] Review fixes (13 reviewer findings: a ring marks an ellipse too small to see (Artemis's 200 m at Malapert) on
    the block and map, the contour labels clear of it; the block's edge measured on level ground, even and without
    speckles; the presets in `src/data/missions.ts`; shorter options; sizes held to their units; the caption's outline
    pale over the slope tint; "Over 0.99" and "All"; the map's label escaped; the Moon facts, sun and drape captured)
    — see "Landing ellipse review fixes"
  - [x] Review fixes, round 2 (1 finding: the Mars source lines cite the size only, and on the mission's own site,
    Jezero or Gale, the fine print says where it really landed, how far and which way from the crosshair) — see
    "Landing ellipse review fixes, round 2"
- [x] My campaigns (the campaigns requested in this browser, soonest first, with their dates, sites, targets, teams and
  references: a dialog in the panel's look from the top bar's "My campaigns" (an icon below 1,100 px, a count once
  there are any) and from the booking confirmation; each opens its confirmation, which now shows the request as made,
  without the search that found its double; kept in localStorage through `data/booking.ts`, the plans still for the
  tab's session; editing one in a later session starts from what it asked for) — see "My campaigns (Stretch 5)"
  - [x] Review fixes (17 reviewer findings: each row's double at its point, a pin target to 4 places; another tab's
    requests read as the dialog opens and the count is written, never written over; a kept request's days and team
    checked as they were to be requested; reads through `requestOf`; the dialog moves in and out and sits under its
    button; the crumbs ellipsize the site's and double's names, never the current step; My campaigns a quiet link on
    the confirmation; Featured sites from the empty box; a calendar-with-a-tick icon and a count badge on phones; the
    button's name with its count; blocked storage tested and captured) — see "My campaigns review fixes"
- [x] Earth clouds on the title (Blue Marble's own 2K cloud layer as cover in Earth's shader, on the title shot only:
  shown with the shot (`G.title`), through the sunrise and the title, faded out with it on leaving, never on a body,
  site or compare view; drifting east on the frame clock, so `?capture` seeks it, still under reduced motion; an R8 map,
  2.8 MB of GPU memory, peak 294.6 of 300 MB; the blurb shaded and the site labels edged where they cross the clouds;
  poster and link preview remade) — see "Earth clouds on the title (Stretch 6)"
  - [x] Review fixes (3 reviewer findings: the poster's credits name the cloud layer, the link preview's size 54 KB;
    two states for the clouds coming back with the title; the title's ghost button and meta row kept legible over the
    clouds when scrolled to the credits) — see "Earth clouds on the title review fixes"
- [x] Stretch list: holistic review fixes (1 cross-item finding: Back to the title from a site or compare reached by a
  deep link left its terrain block, legends and caption where Earth should be, and on into Replay intro and the worlds
  after it; the title now turns the terrain off) — see "Stretch list holistic review fixes"

### Final review
- [x] Final review fixes, round 1 (38 findings: 27 fixed, 11 logged as not done or not worth it now; the Stretch row
  "Static text never updates" now done; the Stars row under Rendering and shaders (Stretch) is not: the one Stretch row
  not delivered) — see "Final review fixes, round 1"

### Foundation (done)
- [x] git repo (main), `.gitignore`, plan renamed to `docs/plan.md`
- [x] Vite + TypeScript scaffold, deps installed (see Log for versions)
- [x] Prototype textures extracted to `public/textures/` (placeholders) via `npm run extract:textures`; since Must 5 only
  Venus and Mercury (Beyond) were; since Should 8 none (the script is gone): the globes' maps and Beyond's images come
  from `npm run fetch:real`
- [x] Engine contracts copied to `contracts/`, spec to `docs/engine/`, types generated to `src/data/types.gen.ts` (`npm run types`), hand-written envelope types in `src/data/api.ts`
- [x] Playwright capture harness (`npm run capture`, `npm run capture:ref`) and reference baselines: see Verification harness

## Plan for items 1 and 2

### Item 1: scaffold (done, see Log)

1. `git init -b main`; `.gitignore`: node_modules, dist, captures/, test-results/, playwright-report/, .DS_Store, *.log, .env*.local.
2. Vite + TypeScript, no framework. Scripts: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (vitest run),
   `typecheck`, `types` (scripts/gen-types.mjs), `capture` (placeholder until the harness lands), `extract:textures`.
3. Deps: three, @types/three, gsap, postprocessing; dev: typescript, vite, vitest, playwright (+ chromium), json-schema-to-typescript.
4. `scripts/extract-textures.mjs` streams the prototype, parses `window.EIDOLON_TEX` (11 JPEGs: earth_day, earth_night,
   earth_spec, earth_bump, moon, moon_bump, mars, mars_bump, europa, venus, mercury) into `public/textures/<key>.jpg` plus
   `manifest.json` (`{key: {file, mime, w, h}}`). Placeholders: real maps (KTX2) replace them under "Real data".
5. Contracts copied verbatim; `scripts/gen-types.mjs` → `src/data/types.gen.ts`; envelopes without a schema hand-typed in `src/data/api.ts`.

### Item 2: port the prototype

Order inside the item: (a) unit tests for `coords.ts` and the formatters written against the prototype's behaviour
*before* the code moves; (b) `?capture` contract and `motion.ts` clock; (c) mechanical port into the module map at
r128-equivalent colour (parity mode, below); (d) capture both builds at both sizes and compare; (e) fix the five
visual-bug Must rows; (f) re-capture. Only then the Must list continues.

#### Module map (plan, Porting section) with prototype sources

Prototype line numbers below are file lines of `reference/eidolon.html`.

| Module | Prototype source |
| --- | --- |
| `index.html` | HTML 380–516 (top bar, stage + overlays, panel, title, sysinfo, beyond, intro, live region, gl-fail). Drop the old `#intro-ov` copy only if unused after port (it is used on overview, keep). Fonts link from line 8–10 until self-hosted (Should: share and meta). Favicon (line 7) and Symbol `#mark` (382–388) are empty placeholders since Must 7: `src/brand/brand.ts` fills them |
| `src/tokens.css` | `:root` tokens 12–26 plus the plan's tokens (detection grades, terrain ramps, layout constants: top 52, status 34, panel 360, sheet 54%, phone breakpoint 760, portrait ratio .8, narrow 520). Drop unused tokens (`--europa`, `--venus`, `--mercury`, `--ice` only if unused, `--teal`) |
| `src/styles/*.css` | Top bar 34–51; stage, grain, flare, scan, labels, markers 53–100; HUD, cursor, toggle, captions, terrain UI, status, more/cue 101–148; sysinfo 149–171; beyond 172–194; panel 196–282; intro 284–318; title + footer 320–354; gl-fail 356; phone ≤759 px 358–377 (read the breakpoint from tokens); reduced motion 378 |
| `src/astro.ts` | 538–580: `EL`, `jd`, `helio`, `rangeAU`, `marsTime`, `pad`, `hms`, `lmst`, `fmtLight`, `lightInfo`, `subsolar`; sim time 640–643 (`TIME`, `simNow`, `setRate`) reading the app clock from `motion.ts`. Drop the europa/venus/mercury/jupiter branches outside Beyond (dead code list). Since Should 12 `sunAzimuth`; since Stretch 1 `sunElevation`, `SOL`, `solarTime`, `atSolarTime`, `solarDate` and the Moon's subsolar latitude `moonSunLat` |
| `src/ellipse.ts` | New (Stretch 4): the missions' landing ellipses (`missionsOf`, `missionOf`, `sizeOf`), the session's choice (`landing`), an axis in words (`axisWords`), a point against an ellipse (`ellR`) and its share over a slope (`ellSteep`); since its review fixes `ringed` (too small to see on the map) and `shareOf` (the share in words), and since round 2 `landedOf` (on a mission's own site, where it really landed). Pure but for `landing`, tested in `src/ellipse.test.ts` |
| `src/profile.ts` | New (Stretch 3): great-circle distance and points (`gcKm`, `gcAt`), bilinear heights (`heightAt`), a point on a site's grid (`onGrid`), the cross-section (`profile`, `profileStats`), `fmtDist`. Pure, tested in `src/profile.test.ts` |
| `src/coords.ts` | 581–638: `lon360`, `EAST360`, `DATUM`, `latStr`, `lonStr`, `fmtLL`, `hudLL`, `dmsOf`, `fmtDMS`, `lonTick`, `latTick`, `parseCoord` (600–634), `fmtM`, `fmtKm`; helpers `clamp`, `smooth`, `wrap180` from 528–530. `siteSpan` (636) moved here, then was replaced in stage 3 by the site projection `llToLocal`/`localToLL` (polar fix). Tests first: `src/coords.test.ts` |
| `src/motion.ts` | All durations/eases from the plan's Motion table as named constants; reduced motion (`RM`, line 524) as a live `matchMedia` watcher, not read once; `T_` (1284); the single GSAP clock and the `?capture` contract (below); since Should 7 `setReading`, the telemetry flash (tested in `motion.test.ts`), with its review fixes a `news` flag for a change its caller knows is drift |
| `src/data/` | `types.gen.ts`, `api.ts` (envelopes), `client.ts` (the one interface), `mock.ts`, `http.ts` (merge). Frontend-owned data: `bodies.ts` (BODIES 646–653, ORDER, PICKABLE 654–655), `sites.ts` (featured SITES 662–690, the 14 Earth analog sites 691–706, `SITE_BY`, `rehearsesFor`, `siteOf` 709–718). During the port only, the matching stand-in (`features`, `score`, `rankEarth`, `customSite`, `doublesFor`, 865–895) lives in `data/standin.ts`; it is deleted when mock.ts lands (Must 3). FACILITIES/FAC_BY (708, 710) are dead: drop |
| `src/scene/renderer.ts` | 897–916: renderer, pixel ratio cap and adaptive measurement (2021, 2073: measure after warm-up, allow recovery), `addBlend`, `canvasTex`, `glowTex`, `blank`, texture loader/cache (`tex`) reading `public/textures/manifest.json`; since Must 9 `LITE` (the phone path) and `asLight` (glows as light); `streakTex` gone; since Must 10 a 2.5 M-pixel budget on the ratio and the data maps as R8/RG8; since its review fixes `tex` only creates the texture and `loadTextures(keys)` fetches (once each), so the start gates on the route's maps (`routes.ts` `mapsOf`); since round 2 `landed(k)`, which `app.ts` `showMaps` reads to turn a globe from its mean colour; since Should 6 `loadTextures(keys, final)`: the first tier (the colour maps' 1024 px `lo` tier from the manifest) or, with `final`, the 4K map replacing it in the same texture (decoded off the main thread first), `takeLow` (the replaced low tier for the planet shader's crossfade) and, since its review fixes, `sharpest(k)` (the full map landed or failed) and a failed full map reported to `onLateTexture` |
| `src/scene/planet.ts` + `shaders/` | `PVS`, `planetMat`, `atmosMat` 918–971 (GLSL into `.glsl` files imported with `?raw`); since Must 9 the planet in linear HDR with the Moon's polar cap, the atmosphere a single-scattering shader |
| `src/scene/post.ts` + `shaders/finish.frag.glsl` | New (Must 9): the HDR pipeline (EffectComposer, half float): globe viewports, bloom, the finish effect (lens flare, AgX, grade, the grounds), terrain viewports, SMAA and grain; `FX`, `setGrade`, `renderPost`; since Should 12 the detection duotone in the last pass over globes and terrain (alpha-masked) with the swap's crossfade (`holdFrame`, `XF`) |
| `src/scene/occlude.ts` | New (Must 9): `sunVisible`, how much of the sun's disc the bodies leave in view (dims the lens flare) |
| `src/scene/stars.ts` | 973–984 |
| `src/scene/bodies.ts` | 986–1016: body groups (root/orient/spin), halos, `localDir`, `dirToLL`, `bodyQuat`, `orientFor`; layout positions `applyLayout` 2271 and `OV` 656–661 |
| `src/scene/sun.ts` | Title sun sprites glare/streak/core/disc 1034–1044, system sun `ovSun`/`OVSUN` 1046–1053, `sunPos`/`sunFlare`. Drop the rays sprite 1037–1042, 1045 (dead) |
| `src/scene/satellite.ts` | Eidolon-1 and orbit line 1018–1033 (drop the zero-intensity PointLight 1027); since Should 12 a low-poly PBR model lit from the title sun (`satLight`) |
| `src/scene/rig.ts` | Rigs, viewports and moves 1180–1245: `mkRig`, `VPS`, `LAY`, `camDist`, poses (`overviewPose`, `focusPose`, `titlePose`, `limbPose`), `setRig`, `slingshot`, `copyRig`, `computeRects` (round rects: Should bug), `dive` |
| `src/scene/orient.ts` | Hold and release in one place (pitfall): `foldSpin`, `orientTo`, `orientToSun`, `release` 1218–1239, `orientToLL` 1762–1767, the `hold` flags spread through `apply()` |
| `src/scene/frame.ts` | `frame()` 2018–2074 (body uniforms, title sun, satellite, scissored viewports), `proj` 2020; the per-frame DOM work moves to the ui modules and writes only on change |
| `src/scene/input.ts` | 1940–2016: drag, inertia, wheel, keys, `rotateGlobe`, `pickHover`, `pickSurface` |
| `src/scene/layout.ts` | 2270–2283: `resize`, layout key (portrait below .8) |
| `src/terrain/procedural.ts` | 720–832: `makeNoise`, `hash2`, `voronoiEdge`, `terrace`, `ARCH`, `NICE`, `genTerrain` (kept as fallback; to a worker per pitfall, after parity); since Should 6 `needSite(body, site, at)`: the patches a site's views read first, its compare window at `at` (`centreOf`); since Stretch 2 `slopes` (each sample's slope at the grid's true spacing, which `measure` now counts from) and `STEEP` (15°) |
| `src/terrain/sample.ts` | 834–863: `BUMP`, `ALB`, `sampleMap`, `readMap`, `prepareMaps` (`MEANLUM` and `albedoAt` dropped in the copy pass review fixes: no pin is described by its brightness) |
| `src/terrain/mesh.ts` | 1055–1106: terrain scenes, `terrMat` (contour shader), `buildTerrain` (mesh + skirt + shadow). `PAL` 800–804 goes to tokens as the terrain ramps and is imported here; since Should 12 the site's sun (`sunENU`), the drape, the water shader; since Stretch 1 the set sun (`sunSet`, `sunOf`, `sunAt`, `Sun`, the shadow march `sunlit`, the shader's curve `tilt`), `contourSegs` (from `ui/topomap.ts`) and `contourMarks`, `meshIdx`, `shoreDist`; since Stretch 2 the slope hazard (`hazard`, `slopeOf`, the shader's `slope` attribute and `haz` uniform, `buildTerrain`'s `steep`); since Stretch 4 the landing ellipse (`buildTerrain`'s `ell`, the shader's `ell` uniform) |
| `src/ui/icons.ts` | New (Should 12): the booking flow's twelve line icons |
| `src/terrain/tiles.ts` | New: engine-shaped elevation (`{size_px:94, pixel_m:200, z}`) into a Terrain (`fromElevation`) and back (`windowZ` of `procedural.ts` `heights` at 94, the mock's); added in Must 4 part 2 |
| `src/terrain/dem.ts` | New: the real elevation patches and orbital crops (`public/sites/`, made by `scripts/fetch-real-data.mjs`), `patchFor`/`demHeights` for `heights`, the credit lines; added in Must 5; since Should 6 a file per patch (`patches/*.bin`, listed in the manifest): `loadSites` loads the manifest only, `needPatch` loads the patch a window reads, `patchFor` starts a missing one and reports the pass's reads once they land (`onLatePatch`), `loadAllPatches` for `?capture`; since Stretch 2's review fixes `resOf` (a patch's true spacing: its step or its source's, `NATIVE_M`) |
| `src/data/real-sites.ts` | New: what the real-data script fetches for (featured sites, established sites, the mock's cells, radii, bump ranges), node-importable; added in Must 5 |
| `src/data/booking.ts` | New: the booking flow's data and rules (steps, the weather window's days, the plan's checks, the indicative cost, the reference, plans and requests kept for the tab's session, `keptOf`); added in Must 6 |
| `src/data/missions.ts` | New (Stretch 4 review fixes): the landing ellipse's mission presets (`MISSIONS`, `Mission`), each one's published size and source line; since round 2 the Mars presets' landing points (`landed`) |
| `src/data/weather.ts` | The seam's weather module (since Should 4): the Open-Meteo forecast and NASA POWER's climatology, fetched in the browser once per place and kept; the purposes' limits (`LIMITS`, `over`); the best months; the seeded sample days (offline, ?capture) |
| `src/ui/weather.ts` | New (Should 4): the weather window's words (a day for screen readers and tooltips, a purpose's limits, the source line), pure |
| `src/ui/booking.ts` | New: the booking flow's panel templates (listing, plan, review, confirmation) and its form handling; added in Must 6 |
| `src/views/intro.ts` | `LINES` 532–536, `runIntro`, intro telemetry ticker, `endIntro`, skip 1575–1616 |
| `src/views/title.ts` | Wordmark 1531–1532, `playTitle`, `leaveTitle`, `resetWord`, `revealTitle` 1533–1574, replay/totop 1617–1618, annotations 1620–1649 |
| `src/views/system.ts` | `apply()` overview branch 1308–1312, labels + hover ring 1869–1883 and 2079–2090, swipe/scroll to Beyond and info (1955, 1973–1979, 1991–1995) |
| `src/views/info.ts` | Info sheet 1508–1521 |
| `src/views/beyond.ts` | `GAL`, `playBeyond`, `drawGalaxy` 1344–1395; painted scenes + helpers 1397–1480 replaced in Should 8 by `paintOne`, each card's spacecraft image (`data/photos.ts BEYOND`) in the footer's dots, its caption, and `redrawScenes(key)` for an image that lands late |
| `src/views/body.ts` | `apply()` body branch 1313–1319 |
| `src/views/site.ts` | `apply()` site branch 1320–1329 (dive → detection → terrain swap as ONE timeline) |
| `src/views/compare.ts` | `apply()` compare branch 1330–1341 |
| `src/router.ts` | State and routing 1247–1343: `state`, `routeOf`, `parse`, `go`, hashchange, `setTerrain`, `showOnly`, `sunMix`, `apply()` (dispatches to views), `back()` 1522–1528; click delegation 1752–1758 |
| `src/ui/panel.ts` | Panel templates 1651–1751: `backBtn`, `row`, `facts`, `wx`, `siteMedia`, `coordBlock`, `panelHTML`, `renderPanel` (template functions, no framework) |
| `src/ui/coord-entry.ts` | 1760–1813: preview pin, `setPreview`, `openPin`, `coordInput`, keyboard, copy |
| `src/ui/topomap.ts` | 1108–1178: `hexRgb`, `contourSegs`, `drawMap`, `drawCrop`; map readout and click-to-move 1814–1833; since Stretch 3 the measured line (`ruler`, drawn by `drawMap`), `movable` (the click-to-move rule, shared), `mapAt` and `mapOf` exported; since Stretch 4 the landing ellipse drawn by `drawMap` (site view's map only) |
| `src/ui/graticule.ts` | 1834–1865 (64 labels, preview pin projection) |
| `src/ui/markers.ts` | `buildMarkers`, `markerClick` 1884–1904, marker projection 2091–2103 |
| `src/ui/label-spot.ts` | New: where a globe marker's label goes (right, left, under, above; off the other markers); added in Must 4 part 2 review fixes, round 2 |
| `src/ui/target-search.ts` | New: the named-feature search (IAU autocomplete combobox) on the Mars and Moon body views; added in Must 4 part 3 |
| `src/ui/grid.ts`, `src/views/grid.ts`, `src/styles/grid.css` | New: the site selector grid, its templates (pure, tested) and its view (show and hide over the body view, the searches one at a time, the cards' doubles filled in place); added in Should 2 |
| `src/data/targets.json` | New: the mock's IAU target list, trimmed from the engine's store by `scripts/trim-targets.mjs`, a lazy chunk; added in Must 4 part 3 |
| `src/ui/chrome.ts` | `chrome` (crumbs, toggle, status hint, live region), `updateStatus` 1905–1926, `tick1s` 2170–2176, captions/divider/toggle/status placement 2112–2136; since Should 6's review fixes `mapsLine` (the full-maps loading line, globe views only) |
| `src/ui/terrain-ui.ts` | `buildTUI` 1927–1938, north arrow 2122–2127; since Stretch 1 the caption's "Lit for" line; since Stretch 2 the legend's slope key (`.steep`); since Stretch 4 the caption's landing ellipse line |
| `src/ui/sun.ts` | New (Stretch 1): the site panel's Sunlight section (`sunHTML`: the checkbox, the time-of-day slider, the date, the sun's facts) and its handlers; `utcOf` |
| `src/ui/measure.ts` | New (Stretch 3): the map's caption and Measure block under the site map (`measureHTML`: the checkbox, the From (A) and To (B) fields, the status line, the cross-section chart and facts), its pointer, form and key handlers, the chart's hover readout, `redoMeasure` (app.ts, a late height map) |
| `src/ui/ellipse.ts` | New (Stretch 4): the site panel's Landing ellipse section (`ellipseHTML`: the checkbox, the mission select, the long axis slider, the facts and caveats), its handlers, `redoEllipse` (app.ts, a late height map) |
| `src/ui/slope.ts` | New (Stretch 2): the site panel's Slope hazard section (`slopeHTML`: the checkbox, the key with the area over 15°, the spacing caveat), its handler, `mapLabel`; since its review fixes compare's checkbox (`cmpSlopeHTML`) and `redoSlope` (app.ts, a late height map) |
| `src/ui/hud.ts` | `hud()` 2138–2169 (corner brackets, readouts, longitude tape) |
| `src/ui/detection.ts` | `SCANPAL`, `showScan`, `hideScan` 1481–1507; overlay position 2105–2111 |
| `src/ui/carousel.ts` | Footer dither art 2178–2268; since Should 12 its dots one dither shader on a quad (a WebGL context of its own), its lines on the 2D canvas |
| `src/brand/` | New: `logo.svg` (the mark) and `brand.ts`, the one source for the `#mark` sprite, the favicon and the image the footer art dithers; `alpha-box.ts`, the mark's inked box the footer art fits; added in Must 7 |
| `src/main.ts` | Start 2285–2299: gate on textures AND `document.fonts.ready` (bug fix), `compileAsync`, intro or `apply(parse())`; WebGL failure → `#gl-fail` (900–901) |

#### three.js r128 → current: what changes (grepped in the prototype)

- **Imports:** global `THREE` from cdnjs → `import * as THREE from 'three'` (ES modules, tree-shaken); GSAP from npm.
- **WebGL2 only** (r163 dropped WebGL1): the try/catch around `new WebGLRenderer` (900–901) stays the no-WebGL path.
- **Colour management (r152).** r128 ran with `outputEncoding = LinearEncoding` (never set), no `ColorManagement`, map
  textures sampled raw (default `LinearEncoding`) and canvas glow textures marked `sRGBEncoding` (914, the only
  `.encoding`). Shaders gamma by hand: `pow(…, 2.2)` on albedo, night map, `rimC`, `duoA/B/C` and `pow(col, 1/2.2)` out (939–954).
  **Parity mode** for the port: `THREE.ColorManagement.enabled = false`, `renderer.outputColorSpace = THREE.LinearSRGBColorSpace`,
  map textures `colorSpace = NoColorSpace`, canvas textures `colorSpace = SRGBColorSpace` (replaces `.encoding`). This
  reproduces r128 output exactly, including the "tight glows" quirk. The HDR pipeline (Must 9) then flips to
  `ColorManagement.enabled = true`, `SRGBColorSpace` maps, removes every `pow 2.2` and outputs linear HDR into postprocessing.
- **`extensions: { derivatives: true }`** (956, 1083) removed; `fwidth` is core in GLSL ES 3.0.
- **GLSL 1 idioms** in ShaderMaterial (`texture2D` ×7, `gl_FragColor` ×4) still compile through three's WebGL2 prefix
  defines; rewrite to `texture`/`out` only when the shaders move to `.glsl` files if it costs nothing, else leave.
- **Lights (r155: `useLegacyLights` removed, physically-correct units).** Affected: Eidolon-1 `MeshStandardMaterial` ×2
  with `DirectionalLight(1.2)` + `AmbientLight(.5)` (1022–1030); terrain scenes `AmbientLight(.55)` + `DirectionalLight(.7)`
  (1059–1060) lighting the `MeshLambertMaterial` skirt (1102) (the terrain surface is a ShaderMaterial and is unaffected).
  Start by multiplying these intensities by π, then retune by eye against the reference captures. `PointLight(0xffffff,0,0)`
  (1027) has zero intensity and its decay default changed (1 → 2): drop it.
- **No `THREE.Geometry`/`Face3`** in the prototype (BufferGeometry, Plane/Box/Sphere/Cylinder geometries only): nothing to convert.
- **`raycaster.setFromCamera({x,y})`** (2005, 2011) needs a `THREE.Vector2` under TypeScript.
- **Tone mapping** default is still `NoToneMapping`; unchanged in parity mode. AgX comes with postprocessing (Must 9).
- **`renderer.compile`** (2288) → `await renderer.compileAsync(sys, cam)` (r158+) before the intro.
- **`Quaternion.invert()`, `slerp`, `Matrix4.makeBasis`, `Sprite`, `CustomBlending`, `DataTexture(…, RGBAFormat)`,
  `CanvasTexture`, `LoadingManager`, `getMaxAnisotropy`** are unchanged.
- **Transparent canvas** (`alpha:true`, `setClearColor(0,0)`, additive `addBlend` that never writes alpha) is kept as-is in
  parity mode. It breaks the moment a composer is added: the backgrounds move into the scene first (pitfall 1, Must 9).

#### Porting pitfalls the port must respect (plan)

- Transparent canvas carries the look (custom blending over CSS backgrounds): keep it until the backgrounds are in-scene.
- Glows shift under proper colour management: retune against captures when Must 9 lands, not during the port.
- Draw order does the occlusion (planet writes depth before atmosphere shells; sprites draw before planets; the CSS flare is never occluded).
- Rotation holds: one `orient.ts` owns fold-spin, hold and release.
- Coupled timings: dive 1.35 s, detection frame at 0.15 s, terrain swap at 1.45 s; coordinate entry waits 950 ms for a
  0.9 s turn; title reveal at 3.2 s of a 4.2 s move. Each transition is ONE GSAP timeline (no `setTimeout`, no stray `delayedCall`s).
- Per-frame DOM writes: cache elements, write only on change (labels, markers, HUD, 64 graticule labels, captions, ~50 SVG attributes).
- Main-thread work (192² terrain with noise, ranking 14 sites): worker, after parity.
- Adaptive pixel ratio: measure after warm-up, allow recovery.
- Hidden rendering: pause the 3D render under Beyond, the info sheet and the title footer.
- Duplicated constants: panel 360 px, sheet 54%, breakpoint 760 (JS) vs 759 (CSS) defined once in tokens, read in JS.
- Dead code: old intro elements/CSS, rays sprite, facilities branch, Venus/Mercury/Europa branches outside Beyond, unused colour tokens.
- Determinism sources to route through the app clock: `Date.now()`/`new Date()` at 563, 641, 1605, 1661; `performance.now()`
  at 641–643, 1773, 1793; `setTimeout` at 531, 1794–1795, 1811, 1976, 2298.

#### Visual bugs: the Must rows, fixed during the port

1. **Polar sites** (Moon south pole: Malapert, Haworth, Nobile, de Gerlache). **Done in port stage 3.** Site maps, crops, edge chips and hover
   readout use an equirectangular span with `1/cos(lat)` (636, 796, 861, 1163–1169, 1173, 1815–1820). Fix: draw maps and
   crops in a local azimuthal (polar-aware) projection around the site; edge labels and readout from the same projection.
   Lift the ±50° clamp in `orientTo`/`orientToLL` (1222, 1764) so the globe can centre polar sites. Offset or cluster
   markers that land within a few pixels of each other near the pole.
2. **Orient, then dive.** A featured site clicked from the body view dives without turning the globe (1324–1328). Fix:
   one timeline that orients the globe so the site faces the camera, then dives; a back-side site never swings through the planet.
3. **Compare to scale.** Show the engine's 18.8 km window on both sides at one vertical exaggeration (both terrains
   generated over 18.8 km, shared `exag`), and give the globe compare a same-scale toggle (true radii ratio).
4. **Late assets.** **Done in port stage 5.** Start only when textures AND `document.fonts.ready` resolve (no 7 s blind start, 2298); when an asset
   arrives late, redraw maps, crops, pins and footer art. Fonts gate the wordmark gradient and intro frame measurement.
5. **Detection readout overflow.** `#scan .row` inherits the panel's `.row` grid (214). Scope it (`.scan-row`).

#### Views, routes, camera moves and timings kept identical

- Routes: `#/` (intro → title), `#/system` (overview; any unknown first segment also maps here), `#/beyond`, `#/{earth|moon|mars}`,
  `#/{body}/{siteId}`, `#/{mars|moon}/@lat,lon` (4 dp), `#/{body}/{site}/compare/{earthSite}`, and `…/globe`.
- Camera: FOV 32°, `camDist = max(h/tan, w/(tan·aspect))·zoom`; poses `OV.wide/tall`, `focusPose` (FOCUS_DIR .16,.1,1;
  ext r·1.62), `titlePose`, `limbPose`; slingshot = log-space extent + lift arc, `power2.inOut` by default.
- Intro: lines at .5/1.9/3.3 s (.9 s `power3.out`, frame .8 s), sunrise at 7.6 s (lines out .8 s, glare 1.1 s, ground
  scaleY .45), skip; `endIntro` fades 1.3 s to scale .93 while `playTitle(true)` runs.
- Title from intro: limb pose; dawn + glare 4.2 s from .1 s; slingshot to title pose 4.2 s `power2.inOut` from .1 s; reveal
  at 3.2 s. From elsewhere: slingshot 1.8 s, reveal at 1.1 s. Reveal: bars .95 s `power4.out` 70 ms stagger (first three from
  above, reversed), glyphs at 1.15 s, bars collapse .7 s from 1.3 s (60 ms stagger), lockup/blurb/meta .9 s from 1.6 s, annotations 1.2 s from 1.5 s.
- System: slingshot 2.0 s from title, 1.6 s otherwise; panel/split/grat/top .9–1 s; overview UI .6 s after .6 s; bodies fade .55 s after .4 s; release 1.4 s.
- Body: slingshot 1.7 s (1.6 s after leaving terrain); `orientToSun` 1.7 s; `orientTo` 1.2 s for a selected site.
- Site from body: dive 1.35 s `power3.inOut`; detection frame from .15 s (grade .8 s in; UI .4 s after .3 s; dot .7 s
  `back.out(1.8)`; ring .9 s; readouts .5 s, 80 ms stagger); terrain swap at 1.45 s (curtain .24 s in / .45 s out, linear);
  grade out 1.2 s after .3 s; terrain orbit from θ .2 φ .1 d 30 to θ .62 φ .98 d 21 over 1.6 s `power3.out`.
- Compare: split 1.1 s; globe view slingshot 1.6 s and `orientTo` 1.6 s / 1.1 s.
- Beyond: slingshot 1.9 s `power2.in`, bodies out .7 s after .9 s; reveal timeline (sheet .8 s at .9 s, galaxy 2.4 s at 1.0 s,
  orbits .7 s at 3.0 s, hero .8 s at 1.3 s, labels .5 s stagger .4 s at 2.0 s, cards .6 s stagger .1 s at 3.3 s).
- Info sheet .85 s up `power3.out`, .7 s down `power3.inOut`; closes on 160 px of upward wheel at scroll top.
- Coordinate preview: 280 ms typing pause, .9 s turn, commit waits 950 ms. Footer carousel 3.8/3.8/4.2/5.2 s, .8 s dissolve, ~15 fps.

#### The `?capture` contract (implemented in the app by the port; the harness builds on it)

Activation: the string `capture` appears as a query key either before the hash (`/?capture#/mars`) or after it
(`/#/mars?capture`). The router ignores any `?…` suffix inside the hash when parsing routes.

In capture mode the app:
1. Calls `gsap.ticker.lagSmoothing(0)`, removes GSAP's own driver (`gsap.ticker.remove(gsap.updateRoot)`; the ticker's
   RAF loop is put to sleep) and never advances time on its own. The app clock (`motion.ts`) is frozen; nothing reads
   `performance.now()`, `Date.now()` or `setTimeout` for animation or sim time.
2. Pins sim time to a fixed epoch, `2026-10-04T12:00:00Z`, at rate ×600 (the default), so sun directions, clocks and
   "live" readouts are identical across runs.
3. Creates the renderer with `preserveDrawingBuffer: true`, fixes the pixel ratio (no adaptive measurement), and does not
   pause on `visibilitychange`.
4. Sets `<html data-capture>`; CSS under `[data-capture]` disables CSS transitions and keyframe animations (caret blink, pin spin).
5. Exposes:

```ts
window.__eidolon = {
  ready: Promise<void>,               // textures loaded + document.fonts.ready + first frame rendered
  seek(seconds: number): Promise<void>,
  route(hash: string): Promise<void>,
};
```

- `ready` resolves once, after the start gate (textures and fonts) and the first rendered frame. (Should 6: and
  after the worlds' full-resolution maps have landed; the start gate holds their low tiers.)
- `route(hash)` accepts `'#/mars'`, `'/mars'` or `'mars'`; sets `location.hash`, runs `apply()` synchronously, then sets the
  **route start** to the current app time, renders one frame and resolves on the next `requestAnimationFrame`.
  The initial page load counts as a route start (time 0 = `ready`), so `/?capture#/` then `seek(2)` shows the intro at 2 s.
- `seek(t)` advances to `t` seconds after the current route start: from the current app time to the target in fixed
  1/60 s substeps, each substep calling `gsap.updateRoot(appTime)` and the app's update callbacks (spin, inertia, uniforms,
  DOM overlays) and then yielding one task, so promise callbacks (mock data landing on its `delayedCall`) run between
  steps as between frames; it renders once at the end and resolves on the next `requestAnimationFrame`. Seeking is forward-only;
  a `t` earlier than the current time is a no-op (to reshoot, call `route()` again).
- User input still works in capture mode, but nothing moves until the next `seek`.

#### Verification approach

- The harness (`scripts/capture.mjs`, `npm run capture`) runs the states of the plan's Verification table at 1280 × 800
  and 390 × 844 with Playwright Chromium, writing `captures/<target>/<viewport>/<state>.png` (see Verification harness).
- Build side: `/?capture#<route>`, `await __eidolon.ready`, `route()`, `seek(t)`, screenshot. Actions (typing coordinates,
  clicking the surface, scrolling to the footer, Beyond) are driven between seeks.
- Reference side: the prototype has no capture flag; drive it with Playwright's fake clock (`page.clock.install()` with a
  fixed time, then `page.clock.runFor(ms)`), which controls `Date`, `performance.now`, timers and `requestAnimationFrame`,
  so the prototype's GSAP ticker becomes deterministic too. It loads three r128 and GSAP from cdnjs (network needed).
- Compare by eye side by side (contact sheet per state); a pixel diff is advisory only, because parity mode is exact for
  colour but layout fonts and texture decoding can differ by a pixel.

### Port stage 1: skeleton, ?capture and the opening (done)

**Modules.** `index.html` (prototype HTML 380–516 in full: every id later stages and the harness use, favicon, fonts,
`#mark`); `src/tokens.css` (colour, type, layout constants `--top --status --panel --sheet --bp --portrait --narrow`,
detection grades `--grade-*`, terrain ramps `--ramp-*` from PAL); `src/styles/{base,top,stage,hud,sysinfo,beyond,panel,
intro,title,responsive}.css` (all prototype CSS, in the prototype's cascade order; the phone block and reduced motion
last); `src/motion.ts`; `src/dom.ts`; `src/data/{bodies,sites}.ts`; `src/scene/{renderer,planet,stars,bodies,sun,
satellite,rig,orient,frame,layout}.ts` + `scene/shaders/*.glsl`; `src/router.ts`; `src/views/{intro,title}.ts`;
`src/main.ts` (entry) and `src/app.ts` (start).

**How later stages plug in.** `apply()` (router.ts) holds the shared part; each view adds its branch. Per-frame work
registers with `onUpdate()` (motion.ts) or is called from `frame()` (scene/frame.ts); per-frame DOM writes go through
`setStyle/setAttr/setText` (dom.ts, write only on change; not on elements GSAP also animates). Layout constants come
from `L` (scene/layout.ts, read from the tokens on resize); colour tokens through `token()`. Only `scene/orient.ts`
writes `hold` (`unhold`, `release`; stage 2 adds `orientTo`, `orientToSun` there).

**Still to come in apply()/frame()** (left out, not stubbed): `closeInfo` and the Beyond fade (stage 5), the coordinate
preview reset (stage 2), `scanSite` (stage 4), `renderPanel/buildMarkers/chrome` (stage 2); in `frame()` the globe
inertia, the fine 10° graticule `gdiv`, `tick1s` top-bar clocks and every overlay but the annotations and flare
(stage 2+), the terrain branch (stage 3).

**Parity** (2026-10-19, `npm run capture`, both viewports): intro-2s/6s/8s, sunrise-9s…13s, title, reduced-motion,
no-webgl all match the reference to the pixel or nearly: mean absolute difference 0.00–0.21 / 255, at most 0.15 % of
pixels off by more than 24 (sub-pixel annotation and limb-edge positions). Checked by eye on the compare sheets too.
The satellite lights needed no retune beyond ×π. Normal (non-capture) mode smoke-tested on `vite preview`: intro →
title → "Enter the system", deep link, no console errors.

### Port stage 2: body globe view and its UI (done)

**Modules.** `src/views/body.ts` (apply()'s body branch); `src/scene/orient.ts` now holds every orientation move
(`orientTo`, `orientToSun`, `orientToLL`, `release`, one private `turn()` that folds the spin, sets the hold and slerps);
`src/scene/input.ts` (drag, inertia as an `onUpdate` that runs before `frame()`, wheel zoom .35–1.5, terrain orbit drag
and wheel on `tOrbit`, G and Escape, `rotateGlobe`, `pickSurface` with a `THREE.Vector2`); `src/ui/{hud,graticule,
markers,chrome,panel,coord-entry}.ts`. `router.ts` gains `prev`, `back()`, the `setTerrain` hook, the shared tail
(`renderPanel`, `buildMarkers`, `chrome`) and the coordinate-preview reset; `rig.ts` gains `tOrbit`; `layout.ts`
exports `stageBox`; `dom.ts` gains `setHTML` and `setClass` (write on change). A surface click routes through
`pinId` (4 dp). A featured-site or surface click routes to a site, which stays a no-op until stage 3 (pins parse as
the body view until `siteOf` learns them). The reference's south-pole marker pile-up on `#/moon` was kept (stage 3 spreads the markers).

**Still to come in apply()/frame()**: the overview branch with its labels, hover ring, `#more`/`#cue`, swipe, arrows and
`closeInfo` on Escape (stage 5); site and compare branches, captions, terrain UI, the scan overlay and the site/compare
panel branches (stages 3–4); the second viewport's markers (stage 4).

**Parity** (2026-10-19, both viewports): body-mars, body-mars-zoomed, body-moon, coord-valid, coord-error match the
reference: mean absolute difference 0.01–0.05 / 255 on desktop, 0.02–0.15 on phone; what differs is sub-pixel label
and tape positions and the HUD's sub-observer/sub-solar readouts (±0.3°, see Deviations). Stage 1's 11 states are
unchanged (0.00–0.21). Checked by eye on every compare sheet. Normal mode smoke-tested (Playwright, `vite`): hover
readouts, drag with inertia, wheel to the 10° grid, G, typing preview, Enter and Open, Escape in the field and out of a
site, marker and row clicks, surface click, rate buttons, Earth; no console errors.

### Port stage 3: site view by deep link, then the polar fix (done)

**Modules.** `src/terrain/procedural.ts` (noise, archetypes, `genTerrain` with its cache; synchronous behind the
curtain), `src/terrain/sample.ts` (`BUMP`/`ALB`, `sampleMap`, `readMap`, `prepareMaps` called once after the start gate,
`albedoAt`), `src/terrain/mesh.ts` (two terrain scenes, the contour shader without `extensions.derivatives`, mesh +
skirt + shadow, `ramp()` reading `--ramp-*`; lights ×π), `src/data/standin.ts` (`features`, `score`, `rankEarth`,
`customSite`, `doublesFor`; `shortcut:` deleted when mock.ts lands), `src/ui/topomap.ts` (`drawMap`, `drawCrop`, map
readout and click-to-move), `src/ui/terrain-ui.ts` (`buildTUI`, captions and north arrow placed per frame),
`src/views/site.ts`. `router.ts` gains the real `setTerrain` (curtain timeline, terrain build, orbit ease-in, `buildTUI`)
and the site branch; `frame.ts` the terrain cameras (in `frame()`) and terrain render (in `draw()`); `panel.ts` the
site branches, `wx` (days from `simNow`), `siteMedia`, `coordBlock`, and the map/crop draw on the next frame;
`siteOf` builds `@lat,lon` pins. No `terrain/tiles.ts` yet.

**Polar fix.** `coords.ts` `llToLocal`/`localToLL`: a spherical azimuthal-equidistant projection centred on the site
(x km east, y km north; at a pole, north is the centre meridian). Used by the map edge chips, the map readout, the
crops (now resampled pixel by pixel, footprint and crop in the same projection), pin terrain (`dem` archetype) and
`albedoAt`. `orientTo`/`orientToLL` lost the ±50° clamp; `orientFor(b, lat, lon, camDir)` takes north from the meridian
(`localDir(lat + 90, lon)`), identical to the old projected axis below 90° and defined at the pole. Markers closer than
14 px on screen are pushed apart pairwise (four passes): the four south-pole markers on `#/moon` now sit ~14 px apart
around their true spot. Tests: round trips at 18.38°, −86.2°, −88.5° and both poles, edges symmetric in km and at the
true great-circle distance, Jezero's edges equal to the prototype's, a pin near the pole crossing it (80 tests).

**Parity** (2026-10-19, both viewports, mean absolute difference / 255): site-jezero 0.00–0.02, site-haughton
0.00–0.16 (crop resampling), results-jezero 0.00–0.02, results-rima-hadley 0.00–0.04, edge-slow/empty/fail and
engine-warming 0.00–0.02 (they show the plain Jezero site, `?mock` ignored, as in the reference), site-moon-malapert
0.13–0.14 (edge chips 13.90° W/E instead of 4.95°, crops). Intentionally different: site-moon-south (6.5–8.0: edges
13.10° W / 16.10° E instead of 3.45° W / 6.45° E, the terrain sampled in the local projection) and coord-moon-pole
(2.7–2.8: the globe centres 86° S instead of stopping at 50° S; markers spread). Stages 1–2's 16 states unchanged
(0.00–0.21). Checked by eye on every compare sheet. Normal mode smoke-tested (Playwright, `vite preview`): featured
row → site, map readout, terrain drag and wheel, Escape back to the globe, surface click → pin, map click moves the
pin, coordinates typed on a site, a Moon pole pin, the Earth site; no console errors (SwiftShader driver warnings only).

**Known limits.** Pin terrain near the Moon's south pole shows radial streaks: the 1440 × 720 `moon_bump` is smeared
around the pole, and the projection now samples it truthfully (it was vertical bands before). LOLA polar tiles fix it
(Placeholder to real). `body-moon` looks unchanged: at its sun-facing orientation the polar markers sit on the far limb.

### Port stage 4: dive, detection frame and compare (done)

**Modules.** `src/ui/detection.ts` (`showScan`, `hideScan`, `resetScan` (the reference's reset at 1296), `placeScan`
per frame: frame and sky opacity, dot over the site or the block); `src/views/compare.ts` (apply()'s compare branch,
`targetPose`, the same-scale toggle); `src/views/site.ts` (the dive timeline, `stopDive`); `scene/rig.ts` `dive()`;
`scene/orient.ts` `faceSite()` (the orient phase). `router.ts` dispatches compare, builds the compare pair in
`setTerrain`, stops a dive still under way on any new route and resets the scan when leaving the site view (or when it
stopped a dive). `ui/markers.ts` keeps one list per viewport (compare globes: the target's sites, or its pin, left; the
site's doubles right; clicks as in the reference). `ui/panel.ts` gains the compare branch; `ui/topomap.ts` and
`terrain/procedural.ts` take a window. Tokens: `--sky-{mars,moon,earth}` (the dive sky); the grade colours come from
`--grade-*`.

**Dive (orient, then dive).** Any route body → site on the same body with the camera at rest (surface click, featured
row, marker, `route()`): one GSAP timeline. `faceSite` turns the globe until the site faces the camera along the rig's
final direction, north up, over `1.2 s × √(turn / 180°)` `power2.inOut` (a back-side site: 1.2 s; 90°: .85 s), or not
at all when the site already faces the camera within 2° (a surface click at the globe centre), so `dive-0.8s` keeps
the reference timing. The dive slingshot (1.35 s `power3.inOut`, ext r·.07) is built at once from the orientation the
turn ends on and nested in the timeline at the turn's end; `showScan` at +.15 s, `setTerrain(true, hideScan)` at
+1.45 s. The camera never passes through the planet: after the turn the dive goes straight down the site's normal.

**Detection frame.** As the reference: grade .8 s `power2.inOut`, UI .4 s after .3 s, dot .7 s `back.out(1.8)` after
.35 s, ring .9 s after .4 s, readouts .5 s with 80 ms stagger after .45 s; out: UI .5 s after .35 s, grade 1.2 s after
.3 s. The duotone uniforms `duoA–C`, `#scanbg` (sky) and `#curtain` (shadow colour) are set per body. Bug fix: the
readout row is `.scan-row` (index.html, `stage.css`), so it no longer inherits the panel's `.row` (width 100 %,
padding, bottom border).

**Compare.** Split 1.1 s; terrain mode builds both scenes in `setTerrain`; globe mode: curtain out, `setRig(L0)`,
`copyRig(R1, L0)`, R1 slingshots to Earth 1.6 s with `orientTo` 1.6 s; between two globe routes `orientTo` 1.1 s;
`.only` set per viewport. Panel branch (pair, two maps, table, doubles), both captions, divider and `#toggle` as the
reference. **Compare to scale** (bug fix): both terrains are generated over the engine's 18.8 km window
(`WINDOW_KM` = 94 × 200 m) centred on each site, sampled at true physical scale (`genTerrain(body, site, win)`), at one
shared vertical exaggeration (the smaller of the two, i.e. the rougher side's); the minis, captions, status bar and the
table's Area shown read 18.8 × 18.8 km. The globe compare gets a **Same scale** button (aria-pressed) beside
Terrain/Globe, shown only in globe mode: on, the target is framed as if Earth-sized, so it shows at its true radius
ratio to Earth (Moon .273, Mars .532); off (default) is the reference framing. It slingshots L0 over 1.1 s and stays
on for the session.

**Harness.** A `tap` step now waits 250 ms (real time, page time frozen) after the click: Chromium delivers the
hashchange ~40 ms later, which the build's synchronous `seek` loop otherwise outran (the route then started after the
seek). The reference's `dive-0.8s` baseline was retaken with it (its route had started a frame or two late, ~.75 s
into the dive at "0.8 s").

**Parity** (2026-10-19, both viewports, mean absolute difference / 255): `dive-0.8s` 0.56–0.78 (same frame, dot, grade
and timing; the pin is 0.0003° off the reference's — a sub-pixel pick difference that reseeds the pin's terrain, so
the panel map and "Rolling" vs "Smooth plains" differ; the readout row is the fixed `.scan-row`). Intentionally
different: `compare-jezero-salda` (3.95–6.37: both terrains over 18.8 km at one exaggeration, table and captions
18.8 × 18.8 km, captions wrap clear of the north arrow on phones), `compare-globe` (1.78–5.16: globes, markers and
framing match; the minis, table, captions and the Same scale button differ), `engine-moon-pin-85S` and
`engine-mars-pin-6s` (17–24: they take the dive path, but the orient phase (~.9 s here; the pins sit ~90° off the
view centre) delays the swap, so at 3 s the terrain shows under the fading detection frame instead of plain terrain;
the Moon pin also keeps stage 3's projection). Stages 1–3: all 27 states unchanged (0.00–0.21; site-moon-south and
coord-moon-pole at their stage 3 values). `info-closed` and `beyond` fail as before (stage 5). Checked by eye on every
compare sheet, plus probe shots of a featured-site dive (Utopia: the globe turns, then dives, frame and readouts in
place) and the same-scale Moon/Earth pair. Normal mode smoke-tested (Playwright, `vite` and `vite preview`): featured
row dive, Escape mid-dive (back to the globe, frame gone), surface click dive, Compare, Globe, Same scale, a double's
row, Terrain, Escape twice; no console errors.

### Port stage 5: system, info sheet, Beyond, footer carousel; late assets (done)

**Modules.** `src/views/system.ts` (apply()'s overview branch: LAY panel/split/grat/top over 1 s, `ov` .6 s after .6 s;
`setRig` from the intro, else a 2.0 s slingshot from the title and 1.6 s from anywhere else; bodies fade in .55 s after
.4 s; release 1.4 s; the world labels with their light-time line, the hover ring, `#more`/`#cue` opacity from `LAY.ov`,
placed per frame through `setStyle`); `src/views/info.ts` (up .85 s `power3.out`, down .7 s `power3.inOut`, closes on 160 px
of upward wheel at its scroll top, Escape, its back button, or leaving the view); `src/views/beyond.ts` (apply()'s beyond
branch: slingshot 1.9 s `power2.in` to the overview pose +32 x (−30 y when tall), bodies out .7 s after .9 s; the reveal
timeline, `drawGalaxy` and the four painted scenes, which sample venus, mercury and moon); `src/ui/carousel.ts` (Bayer
dither art, 3.8/3.8/4.2/5.2 s with a .8 s dissolve, drawn at ~15 fps on the app clock while the footer is on screen).
`scene/input.ts` gains the overview branches (`pickHover`, 140 px swipe left → Beyond, up → info, wheel accumulators of
260 sideways and 140 down reset after a 450 ms `gsap.delayedCall` on the motion clock, ArrowLeft/Right across the
labels, right past Mars → Beyond, Escape closes the sheet first). `router.ts` dispatches the two branches, closes the
sheet and clears the hover off the system view, fades Beyond out (.5 s) when leaving it, and delegates `[data-info]` and
`[data-close]`. `europa.jpg` was already dropped in stage 1; no scene uses it.

**Hidden rendering.** `draw()` skips `renderer.render` while Beyond is fully faded in, the info sheet is fully up
(`yPercent` 0), or the title's credits footer reaches the top of the viewport; `frame()` still runs (tweens, overlays) and
the canvas keeps its last frame underneath. Checked in normal mode by counting WebGL draw calls: 0 per second under
Beyond and the sheet, drawing again as soon as either moves. At 1280 × 800 and 390 × 844 the footer is shorter than the
viewport, so the title never pauses there (the hero stays partly visible, as the footer captures show).

**Late assets (Must bug).** The start gate stays (textures and `document.fonts.ready`, fonts measured). A texture that
fails resolves its gate entry with a warning and stays empty (three binds its black placeholder, i.e. blank). Outside
`?capture` the texture half of the gate gives up after 7 s (see Decisions), so a texture can land after start; it is
reported through `onLateTexture` to `onAsset(key)` (app.ts), which re-runs `prepareMaps` (a missing map is now skipped
per map, not per body), clears the pins (pin sites, pin terrain, stand-in features), rebuilds the terrain scenes when a
site or compare is shown, redraws the panel's `[data-map]`/`[data-crop]` (`drawMaps`, the topo map cache is now keyed by
terrain object) and repaints the Beyond scenes if they were painted. The footer art needs nothing: it redraws on its
own loop from the new `ALB`. On `document.fonts` `loadingdone`, `onAsset('font')` re-measures the wordmark bars
(`measureBars`) and rebuilds the intro timeline at its current time (`remeasureIntro`; tweens take their start values
when the playhead reaches them, so the rebuild replays the same chain, no jump). Tested with a throwaway Playwright
script (not committed): `mars_bump.jpg` held 12 s on `#/mars/@18.3800,77.5800` (the app started at 8 s on a flat pin,
then the map and the 3D terrain showed the real relief when it landed); `venus.jpg` held 14 s on `#/beyond` (scenes
painted without it, the Venus card repainted when it landed); a FontFace loaded mid-intro (bars measured, frame size
unchanged, intro still ends in the title). No console errors.

**Parity** (2026-10-19, both viewports, mean absolute difference / 255): system, info-sheet, info-closed and beyond
0.00; footer-step1–4 0.00–0.18 (the dither frame is drawn up to 66 ms before the seek time on either side). All 32
earlier states unchanged (stage 1–4 values, including the logged intentional differences). Checked by eye on every
stage 5 compare sheet and a sample of the earlier ones. Normal mode smoke-tested (Playwright, `vite`): labels, hover
ring and light time, arrows, wheel down/up, swipe up, `#cue`, the sheet's back button, Escape, wheel sideways, swipe
left, `#more`, Back to the system, ArrowRight past Mars, globe hover and click, footer art animating; no console errors.

**Known limits.** `onAsset` redraws a pin's maps and terrain but not the panel text built from them (the "Smooth, dark
plains" descriptor and the doubles list) until the next route: re-rendering the panel would wipe the coordinate field.
The terrain rebuild after a late texture swaps without the curtain.

### Port parity fixes, round 1 (done)

Thirty findings from independent reviewers of the port (2026-10-19). Most were quirks the reference shares; those
fixed here differ from the reference on purpose (Deviations, "Round 1").

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Leaving the title mid-move (or the intro) leaves `G.dawn` < 1: Earth stays backlit on the system view | Fixed: `leaveTitle` eases `dawn` to 1 with the other title values (.8 s); `runIntro` kills those tweens first, or Replay would fade the intro's dawn up |
| 2, 15 | Phone: the intro frame is wider than the viewport (corners and labels clipped) | Fixed: frame width `min(widest line + 96, innerWidth − 24)`; height unchanged |
| 3 | Sunrise at 9 s: hard seam where the intro gradient ends over the limb | Deferred to Must 9 (Rendering and shaders, "Intro to title": one scene, one camera). Identical to the reference |
| 4, 15 | Phone: Skip intro covers the bottom telemetry | Fixed: at ≤ 560 px Skip sits 78 px up, above the telemetry (kept: it carries sub-point and sun elevation) |
| 5 | Title annotations collide with the blurb, lockup and wordmark; signed-decimal labels | Fixed: labels use `fmtLL`; a label shows only clear of the lockup, wordmark and blurb boxes (measured per stage size, in the SVG's coordinates), of the labels already placed and of every other visible dot; the three rings shrink to stay out of the text boxes and drop out under 16 px. Rest of the Should row not done: occlusion by depth, nearest-site rings, the SVG scrolling while the canvas stays |
| 6 | Phone: the footer caption sits on the dither art | Fixed: `.artcap` flows below the canvas at ≤ 759 px |
| 7 | Touch: tapping a globe on the system view does nothing | Fixed at the root: a tap (pointerup with no move) picks at the release point, for the system view's hover and the body view's surface point (a tap there pinned the last drag's point, or nothing) |
| 8 | Touch: the info sheet can't be swiped closed | Fixed: a 160 px downward swipe that starts at the sheet's scroll top closes it |
| 9 | No WebGL: no poster or site list; three logs a context error | Fixed (Should "Fallback without WebGL", minimal): WebGL2 is tested on a scratch canvas before three; `ui/fallback.ts` fills `#gl-fail` with the title's ground and wordmark, the reason, and the featured Mars and Moon sites with coordinates and their doubles |
| 10 | Phone: the system sun sits above the frame | Fixed (deliberate change): `OVSUN.tall` (−5, 4.4, −3): a sliver of the disc at the left edge beside Earth, as on desktop |
| 11, 20 | Phone: the top bar overflows; the UTC clock is clipped | Fixed: at ≤ 430 px the clock's "UTC" label is hidden and the bar's gaps and rate padding tighten (the clock reads `10/04 12:20`) |
| 12 | Phone: Beyond's labels sit behind the cards | Fixed: the labels hide wherever the cards stack (≤ 760 px wide or ≤ 620 px tall) |
| 13 | The Beyond reveal timeline is never killed | Fixed: one reveal timeline, killed on re-entry and on leaving |
| 14 | Reduced motion: staggers still run | Fixed: the intro and title staggers are gated; the remaining fades (Beyond's bodies, `showOnly`, `sunMix`) stay as crossfades |
| 16–18 | Warming screen, no-elevation-data state, pin search progress | Not this round: Must 3/4 (data module, states by source). The three capture states still show the plain views |
| 19 | Mars subsolar latitude hard-coded to 0 | Fixed: `marsLs` (Allison & McEwen 2000, Mars24 steps B-1–B-5 without the < .03° perturbations) and latitude asin(sin 25.19° · sin Ls); test anchored to the Mars24 worked example (2000-01-06, Ls 277.188°). At the capture epoch Ls ≈ 2.2°, latitude ≈ +0.9°. The Moon stays 0 (shortcut comment; truly ±1.5°) |
| 21 | Coordinate errors aren't announced | Fixed: `#cmsg` is `aria-live="polite"`; the site-mode `#cin` is described by it |
| 22 | Phone compare: the Terrain/Globe/Same scale toggle is under the sheet | Fixed with the plan's Should fix: on phones `placeChrome` moves the toggle to the top of the sheet (back over the stage above the breakpoint); hidden off compare. The finding's `bottom: calc(var(--sheet) + 12px)` would overlap the terrain legends: only 28 px separate them from the sheet |
| 23 | Map readout clipped on the compare minis | Fixed: it flips on the space actually left, not at fixed fractions |
| 24 | A fling's inertia cancels the orient turn of a dive (row or marker click) | Fixed: `apply()` stops inertia on every route (also protects release, orientTo, orientToSun); wheel zoom is ignored on a site view while the globe is still shown (the dive). Drags already turn no globe on a site view |
| 25 | `buildTerrain` keeps the old mesh after a pin's terrain is regenerated | Fixed: the cache needs the same key and the same Terrain object |
| 26 | The font gate can hang if the stylesheet failed | Fixed: the link wait is gone (module scripts run only after pending stylesheets settle), a face that fails is caught, and outside `?capture` the font gate gives up after 7 s like the textures |
| 27 | Start-up failures end in a black page | Fixed: `compileAsync` is guarded (the first frame compiles instead, as in the prototype); the manifest is read by `loadManifest()` from `main.ts` (no top-level await); any start failure shows the fallback page with "Eidolon could not start" and resolves `__eidolon.ready` |
| 28 | `?capture` contract gaps | Fixed: (a) no pause on `visibilitychange` under capture; (b) under capture `go()` pushes the route and applies it at once (hashchange is async). Like a click, it leaves the route start where it is (Deviations) |
| 29 | Per-frame allocations | Fixed: `localDir(…, out)` with scratch vectors (frame, title, graticule), loops for the closures, `computeRects` fills two reused rects, markers spread without `filter`, captions rebuilt only when the route changes, the north arrow's svg cached, title constants hoisted. Left: `subsolar` tuples (four per frame), one sim `Date`, the setStyle value strings |
| 30 | Pin caches never evict | Fixed: `prunePins` keeps the 12 most recent pin entries in `terrCache`, `CUSTOM` and `featCache` (oldest first; shortcut comment) |

**Parity** (2026-10-19, full capture, 40 states × 2 viewports, mean absolute difference / 255 against the reference):
desktop: every state the round didn't touch is at its earlier value (0.00–0.21; site-moon-south, coord-moon-pole,
compare and the two engine pins at their logged intentional values); `title` 0.21 (labels and rings); `body-mars`
0.98 and `body-mars-zoomed` 3.72 (subsolar latitude); `dive-0.8s` 4.12 (another pin under the HUD centre, see
Deviations); `no-webgl` 18.5 (fallback page). Phone: 0.39 on every view with the top bar (the clock lost its label;
nothing else moved), plus the intended changes: intro and reduced motion 0.8–1.0 (frame, Skip), title 0.55, footer
steps 9–12 (caption below the art, so the page scrolls further), system and info-closed 7.4 (sun), compare 14.5–15.6
(toggle in the sheet), `no-webgl` 23.5, beyond 0.43 (labels hidden). Checked by eye on the compare sheets of every
changed state at both sizes (intro, sunrise-9s, title, footer, system, info-closed, beyond, body-mars, coord-error,
dive, compare, reduced motion, no-WebGL).

### Port parity fixes, round 2 (done)

Eighteen findings from the second review round (2026-10-19), all minor; all fixed. Most are quirks the reference
shares; those changes are logged under Deviations, "Round 2".

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Title: the Atacama label (now `fmtLL`, longer) ends 8 px from the right edge, across the limb | Fixed: a label must end inside the hero's side inset, `clamp(18, 4vw, 60)` (`.blurb`'s right); at 1280 × 800 the Atacama label now hides and its dot stays |
| 2 | Phone title: the Atacama dot sits under "412" of the satellite tag | Fixed: the tag's box (x+9 … x+9+length, y−17 … y−3, 4 px margin) is tested against every visible site dot; blocked, it flips left of the satellite dot (`text-anchor: end`), and hides if the left is blocked too |
| 3 | No WebGL: the dead app DOM stays in the accessibility tree and the Tab order | Fixed: `showFallback()` sets `inert` on every body child but `#gl-fail` (also the failed-start path). Tab now lands on the fallback list itself (Chrome makes the scrolling `#gl-fail` focusable) |
| 4 | Fallback copy says "Match scores" but shows none | Fixed: "The doubles are stand-ins until the matching engine is connected." |
| 5 | `#more` and `#cue` stay focusable at opacity 0 off the system view (Enter on `#more` from `#/mars` goes Beyond) | Fixed: `visibility: hidden` below `ov` .02, like the world labels |
| 6 | Info sheet and Beyond don't manage focus; arrows act under the open sheet | Fixed: on open, `#stage` goes `inert` and focus moves to the sheet's Back to the system; on close, focus returns to the opener. Beyond focuses its Back to the system after the fade-in. The arrow branch is gated on `!infoOpen()`. Both move focus only when something had focus (see Deviations) |
| 7 | Reduced motion: `sunMix` sweeps the terminator over 1.2 s on every route change | Fixed: `duration: RM ? 0 : 1.2` |
| 8 | Reduced motion: the footer art keeps rotating and step 3 zooms out | Fixed: under RM each step is a still frame at 2.5 s into its step (moves finished: p = 1, links drawn), and only the .8 s dissolve remains |
| 9 | The detection frame's ticks and readouts overprint the terrain caption, note and legend | Fixed: `placeTUI` fades the captions and `.tui` (via `--fade`) as `max(0, 1 − 2 · scanUI)`: hidden while the frame is over half there, fading in over its last half. Holds through Must 4's pin search too |
| 10 | The coordinate preview chip covers a graticule label; on the phone it ends 4 px from the edge | Fixed (plan Should row, label collisions): graticule labels whose box overlaps the chip hide; the chip flips to the pin's left (`#ppin.left`) when it would end within 16 px of the stage's right edge. Desktop already had no overlap (240°E sits beside the chip) |
| 11 | The system view's delayed `ov` tween survives leaving within .6 s and brings its labels, sun and cues back | Fixed: `apply()` calls `gsap.killTweensOf(LAY, 'ov')` on every route that isn't the overview |
| 12 | `leaveTitle`'s `overwrite: true` kills `hideScan`'s delayed fades: the frame sticks over terrain after a quick pin move | Fixed: it kills only `title,glare,annot,dawn` on `G`, then tweens them without overwrite |
| 13 | Idle covered frames (Beyond, sheet, footer) count as smooth: the pixel ratio steps back up | Fixed: `measure()` runs only on frames `draw()` renders (`covered()` shared by both) |
| 14 | Galaxy and footer art buffers resize on width only (stretched after a height-only resize) | Fixed: both compare the height too |
| 15 | HUD sub-observer at the pole reads `86.0S 000.0W` | Fixed: candidate fix 2 (round first, then pick the hemisphere) in `latStr`, `lonStr`, `hudLL` and `fmtDMS`; tests: `hudLL(-86, -0.00001, 'moon')` → `86.0S 000.0E`, tiny negatives, DMS |
| 16 | Weather-window weekdays use the host time zone | Fixed: `timeZone: 'UTC'` |
| 17 | `hud()` allocates a vector per frame for the sun elevation | Fixed: scratch `_b` |
| 18 | Three copies of `lon360(lon − lon0)` | Fixed: `bodies.ts`, `terrain/sample.ts`, `ui/topomap.ts` import `lon360` |

**Parity** (2026-10-19, full capture, 40 states × 2 viewports, mean absolute difference / 255): every state is at its
round 1 value except the intended changes: desktop `title` 0.22 (Atacama label hidden), `engine-mars-pin-6s` 23.95 and
`engine-moon-pin-85S` 23.27 (terrain UI hidden under the frame; both refNA and already intentionally different);
phone `title` 0.71 (satellite tag left of its dot), `coord-valid` 1.36 (chip left of the pin, 240°E shown), the two
engine pins 18.0–18.4, `coord-moon-pole` (HUD `000.0E`). Checked by eye on the compare sheets of title, no-webgl,
system, info-sheet, beyond, coord-valid, coord-moon-pole and both engine pins at both sizes. Normal-mode smoke test
(throwaway Playwright script on `vite`): Enter on `#cue` focuses the sheet's button and inerts the stage; arrows do
nothing under it; Escape returns focus to `#cue`; Enter on `#more` ends on Beyond's Back to the system; `#/system` then
`#/mars` within 150 ms leaves the cues hidden and no world label shown; a dive then a pin move within 1.5 s of the
swap ends with the frame and sky at 0 and the curtain's colour cleared; no-WebGL: app DOM inert, Tab to the list;
reduced motion: footer frames identical within a step; no console errors.

### Port parity fixes, round 3 (done)

One finding from the third review round (2026-10-19), major; fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Coordinate entry, typed key by key: the 280 ms preview queued by the last valid keystroke still fires after an error or a cleared field (`18.38N 77.58N` ends red but the globe turns to 18.38N 77.58E with the chip up; `10N 20E` then Escape leaves the pin at 10N 20E) | Fixed: `coordInput` kills and nulls `pending` right after parsing, before the empty and error returns (it ran only on the valid path). A pin queued by Enter is cancelled the same way when the text turns invalid or empty within the turn |

**Reproduced and verified** with a throwaway Playwright probe on `vite` (`?capture#/mars`, one key per 50 ms of seek,
then 1.5 s): before, both cases ended with `#ppin.on` and the stale chip at 1280 × 800 and 390 × 844; after, `#ppin`
is off and the chip empty, the message and `aria-invalid` unchanged, and a valid `47.2N 184.3E` still previews. The
`coord-*` capture states can't show it (`fill()` sends one input event) and are unchanged.

**Parity** (2026-10-19, full capture, 40 states × 2 viewports, mean absolute difference / 255): every state at its
round 2 value (desktop `coord-error` 0.15, `coord-valid` 0.13; phone 0.55 and 1.36). Checked by eye on the compare
sheets of coord-error and coord-valid at both sizes.

### Data module (Must 3, done)

**The seam.** `src/data/client.ts` is the one module the UI calls for engine data: `data` (the engine's endpoints plus
the booking `listing`), `MOCK`, `doublesOf(body, site)` (a target site's default search, kept per site) and `cellsOf`
(results with a location, each with its Earth pin id). `VITE_DATA=mock` (default, `.env`) picks `mockEngine`,
`VITE_DATA=engine` picks `httpEngine`; both implement `Engine` (`api.ts`: `health`, `purposes`, `sovereigns`,
`targets` (autocomplete query), `target`, `search` (named, coordinates, filters), `elevation` (target, point or
cell)). Every failure rejects with `EngineError {status, code, message}` built by `errorFrom` from the engine's body
(`{detail:{code,message}}`, FastAPI's validation array → `invalid_request`), plus `network` (no answer) and
`bad_response`. Only `mock.ts` imports fixtures.

| File | What |
| --- | --- |
| `api.ts` | Hand-typed envelopes (as before), `TargetsQuery`, `ElevationOf`, the `Engine` interface, `EngineError`, `errorFrom` |
| `mock.ts` | `mockEngine(modes, clock)`: replays the 11 API examples verbatim when the query matches (k may be smaller; a larger k extends them), derives the rest, refuses with the fixtures' error bodies |
| `http.ts` | `httpEngine` against `http://127.0.0.1:8000/api/v1`: GET paths and the JSON POST of the spec, 30 s timeout, error mapping |
| `listing.ts` | `listing(result)`: a `site_listing.json` listing derived from a result (frontend-owned in both modes) |
| `pins.ts` | Was `standin.ts`, minus the stand-in ranking (`features`, `score`, `rankEarth`, `doublesFor`: deleted). `customSite` for target pins as before; Earth pins (`earth/@lat,lon`) are search results, named by the country a landed search reported (`noteCells`), terrain from the Earth bump map at the cell's elevation |
| `sites.ts` | Featured targets gain `iau` (Decisions 10); `siteOf(b, '@…')` builds pins on every body (Earth pins only as compare doubles: `parse()` refuses `#/earth/@…`) |

**Mock behaviour.** Latencies (`LATENCY`, seconds): named target without filters .02 (`source: cache`), with
filters .3 (`live`), coordinates 6 (`remote`), an Earth cell's elevation 2 the first time, a point's 6 the first
time, then .02; refusals (validation, unknown target or purpose, `no_dem`, `warming_up`) come back in .02. The clock
is injected: the app passes GSAP's (`gsap.delayedCall`, so `?capture` seeks drive the latencies like any
animation) and `clock()`; tests pass fake timers. Derived searches: the examples' 15 real Earth cells, filtered by
the request's filters (sovereigns, access, exclude polar, bbox, surface), shuffled per query (seeded without k, so
"show more" keeps the first ranks), re-scored (six property scores and their statuses, shape cosine → confidence,
judge probability falling with rank, the DEM caveats plus the polar one beyond 60°); past 15 the same cells .3° further
north. Target catalogue: the examples' targets plus the featured IAU features Gale, Utopia Planitia, Taurus Littrow
Valley (`targets?q=` sorts prefix matches first, as the server does). Modes (`?mock=`, comma-separated, before or
after the hash): `slow` every call 10 s, `empty` low confidence and summaries prefixed "No close analog in this
region; best available.", `fail` every call rejects with `network`, `warming` 503 `warming_up` on every data
endpoint for the first 35 s (health says `warming_up`; purposes answer, as the server's do). Moon points beyond 60°
always get 422 `no_dem` (engine behaviour; `?mock=nodem` changes nothing).

**UI on the seam** (visuals unchanged except where the data's shape forces it). Site panel (Mars, Moon): the doubles
section (`[data-doubles]`: Compare button, "Closest doubles on Earth", rows) comes from `doublesOf`; rows show the
country, the cell's coordinates (4 dp) and the shape-match confidence in the coral meta slot (no percentages),
link to compare with the cell as an Earth pin (`#/mars/jezero/compare/@34.6750,-105.0750`). While the search runs:
"Searching Earth…" (named) or "Reading Mars terrain…" (coordinates); on failure one line keyed on the code
(warming_up, no_dem, unknown_target, else "could not be reached"); "No close analog…" as a lede above the rows; "Sample
results until the search engine is connected." under them in mock mode. When the search lands on the same route the
section fills in place (the coordinate field keeps its text); the compare panel renders again with its globe markers,
crumbs and captions; while warming it asks again every 3 s. Compare: the table's Match row is now "Shape match" (the
result's confidence, "—" for an established site reached from Rehearses, which is no result), the stand-in note says
only the terrain is a stand-in, the doubles list is the results. Globe compare markers: the results (plus the
selected double if it isn't one); a target marker compares that site with its first double once its search lands.
Crumbs, captions, markers and the compare pair escape names (`esc`, dom.ts): country names come from the engine.
Unchanged, frontend-owned through `src/data/`: bodies, featured sites, the 14 established sites (Earth view,
Rehearses, title, carousel, detection frame, fallback page with its curated doubles).

**Tests** (129, was 86): `data/contracts.test.ts` (ajv 2020-12, new dev dependency `ajv` 8.20.0): all 18 examples
validate against their schema (a rule per file name; a new example without a rule fails), and so do derived searches
(featured name, pin with k 20, an example extended to 20, filters, a filter no cell fits), every listing of their
results, the targets list and every target's detail, plus the requests the UI sends. `data/mock.test.ts` (fake
timers): each example replayed at its latency (20 ms, 300 ms, 6 s), determinism, "show more" prefix, pin naming,
filters, refusals (no_dem, unknown target and purpose, unsupported purpose, k 21), all four modes, elevation shape and
caching. `data/http.test.ts` (stubbed fetch): the POST, every GET path of the spec, error mapping.

**Verification** (2026-10-20). Full capture, 41 states × 2 viewports, no console errors. Every state the item doesn't
reach is at its round 3 value (desktop 0.00–0.22 / 255 and the logged intentional differences; phone 0.39 top bar
plus the logged ones). Changed by the item: desktop `compare-jezero-salda` 4.66 and `compare-globe` 2.53 (the
"Shape match —" row wraps to two lines and pushes the table down 14 px; the Earth globe shows the result markers),
`edge-fail`, `edge-slow`, `engine-warming` 0.23 (no Compare button peeking at the panel's foot); the doubles
themselves sit below the fold in the captures. New state `compare-jezero-cell` (refNA): the compare with the
Jezero example's first cell (United States of America, shape match High). Doubles sections probed with a throwaway
Playwright script (capture and normal mode): Jezero (the example's five cells), Gale, Hadley (derived), Arcadia (6 s
pin search: "Reading Mars terrain…" at 3 s, five rows at 7 s), Malapert (no elevation data), empty, fail, warming,
slow, phone; normal mode: rows → Compare (crumb "Compared with United States of America") → Globe (result markers) →
Gale marker (compares Gale with its first double), a pin's progress then rows, `#/earth/@…` falls back to the Earth
view; no console errors.

**Known limits** (both fixed in the review round below). A deep link to a compare with an Earth pin built the Earth
terrain from the bump map and kept it; under `?capture` the terrain caption kept the coordinates.

### Data module review fixes (done)

Twenty-two findings from the independent review of Must 3 (2026-10-20), one blocker; 21 fixed, one deferred to Must 4
(16). Several findings overlap (2/14, 4/12/22, 7/21, 9/19); each is listed once.

| # | Finding | Outcome |
| --- | --- | --- |
| 18 | Blocker: a failed search was asked again at once, forever (`doublesOf` re-asked whenever the stored search had an error; `watch()` then never saw one): 60 section writes in 2 s, a POST storm against the engine | Fixed: `doublesOf(body, site, again)` keeps failures and asks again only when told (`again` after a failure). `watch()` attaches one settle handler per search (WeakSet); on warming_up it asks again after 3 s (one `gsap.delayedCall`, killed on re-schedule, dropped if the route changed); every other outcome stays until Try again. Production-build probe (`vite preview`): `#/moon/malapert`, `?mock=fail#/mars/jezero` and `#/moon/malapert/compare/haughton` write the panel 0 times in 2 s; `?mock=warming` holds "Starting up" with no rewrites, then lands at 35 s. Fake-timer test: a failure is not sent again in 60 s until asked |
| 5 | The answer was processed in `then(ok, err)`: a body without `results` threw past the error handler, the panel stuck on "Searching Earth…" | Fixed: `.then(ok).catch(…)`: anything thrown (or a non-`EngineError`) ends as `bad_response`; `http.ts` checks `Array.isArray(results)` on search answers. Tests in `client.test.ts` and `http.test.ts` |
| 6 | Spec §6 handling incomplete: unknown_target, client bugs swallowed, health error retried forever | Fixed: invalid_request and unknown_purpose (and anything thrown) go to `console.error` and get their own copy; unknown_target offers "Search by coordinates" (a pin at the site, searched by lat/lon); a warming_up after `/health` says `error` becomes the client code `start_failed` ("The search engine failed to start.", Try again), so the 3 s retry stops. The autocomplete suggestion waits for Must 4's target search (Deviations) |
| 1 | The mock dropped the filters when no pool cell fit them (US cells for an Iceland bbox) | Fixed with the engine's semantics: the filters are a hard mask (`engine.py mask()`); a filter no cell passes gives fewer results or none (the engine returns `[]` for an empty mask). Laps past the pool's end are re-checked against the mask. Empty list copy: "No Earth sites match this search." Decisions 14 |
| 3 | Mock results never showed an established-site cell, a rugged_extension cell, `not_measurable`, null scores, or weak/good tiers | Fixed: four made-up cells join the 15 real ones (Hanksville US, Pilbara AU, Haughton CA: inside established sites per `listing.ts`'s ±.085°; a rugged_extension cell in New Zealand's Southern Alps, education or surface "any" only, with the engine's rugged caveat). Targets under 0.6 km across (spec §9) get the engine's sub-resolution treatment: the three form properties `not_measurable` with null scores, confidence low, the engine's caveat text; Shorty (Apollo 17, 0.11 km) is in the catalogue. Nirgal Vallis (weak) and Mons Hadley (good) join it with their real capability rows. The Rima Hadley doubles now include Hanksville and Pilbara (`results-rima-hadley`) |
| 2, 14 | The detection frame said "Matching 14 Earth sites" (the deleted stand-in's count) | Fixed: "Matching / Earth sites", or "No elevation data" when the site's search answered no_dem (it has by the frame's start: the refusal takes 20 ms). `engine-moon-pin-85S` shows it |
| 4, 12, 22 | No capture showed the doubles section | Fixed: `{ scroll: '#panel' }` after the seek in edge-slow/empty/fail, engine-warming, engine-moon-pin-85S, engine-mars-pin-6s, results-jezero and results-rima-hadley (the two results states have reference baselines: retaken with the same step); new refNA state `compare-globe-cell` |
| 13 | Under `?capture`, a seek stepped every frame before any promise callback ran: data that landed mid-seek got no frame (stale caption, no markers, a stray label) | Fixed: `seek` yields a task (`MessageChannel`) after every 1/60 s step, so promise callbacks run between frames as outside capture. `compare-jezero-cell` captions "United States of America"; `compare-globe-cell` shows the markers |
| 8 | A compare deep link with an Earth pin kept its bump-map terrain (2,268–2,434 m for a 1,671 m cell) | Fixed: `noteCells` drops a pin's terrain the first time a search names it; when the compare's search lands, the pair and table redraw and, once swapped in, `buildScenes()` + `buildTUI()` (no curtain, like `onAsset`). Now 1,591–1,757 m. Test in `pins.test.ts` |
| 9, 19 | A compare-globe marker click waited for that site's search (6 s for Arcadia, Meridiani, Elysium, pins) with no feedback | Fixed: results already there → compare at once; a search by name waits (20 ms); one by coordinates opens the site at once, whose panel shows "Reading Mars terrain…". Probe: Arcadia goes to `#/mars/arcadia` at once, Gale to its first double |
| 7, 21 | Shape match shown as a bare "High" (label in `title` only); doubles section not announced; duplicate marker names; focus dropped when a compare search lands | Fixed: a visible column head "Shape match" right of the section head (`.sec.cols`) and sr-only "Shape match: " in each row's value, so a row reads "United States of America, Shape match: High, 34.6750° N…"; `[data-doubles]` is `aria-live="polite"` with `aria-busy` while the search runs, `tabindex="-1"`; pin markers' accessible names carry their coordinates; when a search lands only the parts that change are redrawn (`[data-cmp]` and `[data-doubles]`; back button and heading stay), and a focused row keeps focus (`swap()`). Probe: focus stays on the back button across a 6 s compare search |
| 15 | "Shape match" wrapped to two lines; a coral "—" when the double is no result | Fixed: the match row's label doesn't wrap; the row is left out when the double isn't a result (Rehearses compares). `compare-jezero-salda` is back to the reference's table position |
| 17 | No live region; no recovery from a failure but a reload | Fixed: aria-live/aria-busy (above) and a "Try again" `.btn` on every error but warming_up (automatic), no_dem (permanent) and unknown_target (offers the coordinate search) |
| 20 | Engine strings unescaped (confidence); `ERRORS[code]` on a plain object | Fixed: confidence goes through a fixed map (`CONF`, `Object.hasOwn`), error copy through `Object.hasOwn(ERRORS, code)` |
| 10 | No tests for `doublesOf`, `cellsOf`, `noteCells`, Earth pin naming, `esc`, `rng` | Fixed: `data/client.test.ts` (7: one search per site, no re-send until asked, warming vs start_failed, bad_response logged, client bugs logged, pins pruned to 12, `cellsOf`), `data/pins.test.ts`, `dom.test.ts`, an `rng` test in `coords.test.ts` |
| 11 | Seeded weather generated in the UI module; progress said 6 catalogue targets (it had 7) | Fixed: `data/weather.ts` `weather(siteId, from)` (the panel only formats it); the catalogue now has 10 targets |
| 16 | Rows named by country only ("Australia, Australia…"); two cells 0.3° apart stack on the globe | Deferred to Must 4 (the finding's own call): its cards name and tag cells, and its globe spreads or clusters result markers. Accessible names carry coordinates now (21) |

**Verification** (2026-10-20). typecheck, 147 tests (was 129) and build green; production JS 220 KB gzip. Full
capture, 42 states × 2 viewports (84/84), no console errors. Mean absolute difference against the reference: every
state this round doesn't reach is at its earlier value (desktop 0.00–0.22 and the logged intentional differences;
phone 0.39 top bar plus the logged ones); `compare-jezero-salda` 4.62 (was 4.66: no "Shape match —" row),
`compare-globe` 2.49. Looked at the build and compare sheets of every changed state at both sizes: compare-jezero-cell
(caption and table named, Earth terrain at 1,591–1,757 m, one-line Shape match), compare-globe-cell (result markers,
no stray label), edge-slow ("Searching Earth…"), edge-empty (the no-close-analog lede over five Low rows), edge-fail
("could not be reached", Try again), engine-warming ("Starting up"), engine-moon-pin-85S (frame "No elevation data",
panel no-data copy), engine-mars-pin-6s ("Reading Mars terrain…" under the frame), results-jezero and
results-rima-hadley (column head, rows, Hanksville and Pilbara cells); spot-checked title, system, body-mars,
site-jezero, compare-jezero-salda against the reference. Normal mode probed on `vite preview` (throwaway Playwright
script): no rewrite loops (above), Try again (busy, then the error again, focus kept), warming to results at 35 s, a
compare deep link to a cell (named caption, table at the cell's elevation), Arcadia and Gale markers on the globe
compare, a 6 s pin search's progress then rows; no console errors.

### Data module review fixes, round 2 (done)

One finding (major, visual), fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The four Artemis south-pole sites (Malapert, Haworth, Nobile, de Gerlache) stopped at one grey no_dem line: no Compare, no Earth sites, where the prototype offered both. The curated analogs were still in `sites.ts` and compare already takes an established site as the double | Fixed: `knownOf(site, doubles)` (`data/client.ts`) gives a featured site's curated `doubles` when its search answered no_dem (pins have none). The panel keeps the note and lists them under it: "Compare with Earth doubles" (to the first), head "Known analog sites on Earth" ("Doubles for …" in compare, the shown one selected), note "No elevation data for this site. The search engine reads Moon terrain only within 60° of the equator, so it can't score these established analog sites.", then plain rows (name, place; no shape-match value, no coral meta, no "Sample results" line: they aren't mock output). A pin keeps "…for this point." and nothing else. Globe compare: the Earth markers are the curated sites, and a polar site's marker compares it with its first one once its search has answered (Decisions 16) |

**Verification** (2026-10-20). typecheck, 148 tests (was 147; `knownOf`: no_dem site, pin, other error, pending) and
build green. Full capture, 43 states × 2 viewports (86/86), no console errors; every state other than the new one at
its logged value (desktop 0.00–0.22 plus the logged intentional ones; phone 0.39 top bar plus the logged ones). New
state `results-moon-malapert` (`#/moon/malapert`, seek 3.5, panel scrolled to the doubles; reference baseline taken:
the prototype's Compare button and two scored rows), 3.87 desktop / 15.38 phone: same button and section position, the
note under the head, Haughton Crater and Mauna Kea unscored (the prototype ranked Mauna Kea first by its stand-in
score; the curated order is the site's own). `engine-moon-pin-85S` still says "this point" with no rows. Normal mode
probed on the dev server (throwaway Playwright script): `#/moon/malapert` → Compare → `…/compare/haughton` (Haughton
selected in "Doubles for Malapert Massif") → Mauna Kea row → `…/compare/maunakea`; `…/compare/haughton/globe` shows
Haughton Crater and Mauna Kea as Earth markers; the Nobile marker opens `#/moon/nobile` (its search not yet asked)
with Bockfjorden and Meteor Crater; no console errors.

### Results rework 1/4: cards, detail, no percentages, capability banner (Must 4, part 1, done)

**Where.** `src/ui/results.ts` (new): the templates `banner`, `card`, `detail`, plus `chips`, `aridity`, `rough`,
`placeTag`. `ui/panel.ts`: the doubles box shows cards under the banner, "Show more", and loads the hillshades
(`thumbs`); the compare panel shows the detail of its double when the double is a result (Decisions 17). Seam
(`data/client.ts`): `Doubles` gains `k` and `busy`; `doublesOf(body, site, again, k)` asks again for `MORE` (20) and
keeps the five while it runs; `imageOf(url)` and `windowOf(url)` (the engine's two image paths only); `data/hillshade.ts`
(new) draws the mock's images. `data/sites.ts` `establishedAt(lat, lon)` (was inline in `listing.ts`, which now uses it).

**Cards** (site panel and compare's doubles list): hillshade thumbnail (72 px, lazy: the engine's PNG, or in the mock a
hillshade of the mock elevation landing 2 s after the first ask; a failed one leaves the empty tile), rank, notes marker
("2 notes", a line-icon triangle) when there are caveats, country (Newsreader 18), coordinates (4 dp), the
established-site tag ("Analog site: Hanksville") when the cell's window holds one (gap 3), "Shape match High", the
engine summary (three lines), and three property chips: the two best-scored properties, then the weakest other one (a
gap before a not-measurable property, before a partial), each with its status mark. Five by default, "Show more" asks
for 20 ("Loading more…" while it runs) and disappears when the answer is shorter than asked. The selected double's card
is `is-sel` with `aria-current` on compare.

**Capability banner** above the cards when the target's tier is fair or weak (spec §5.2), without the percentage:
"For crater targets, our blind tests found a good Earth analog in the top 3 for 9 of the 17 tested. These are the best
available terrain matches." (Decisions 18). Nothing for good, insufficient data or no capability. Jezero (crater, fair)
and Rima Hadley (rille, fair) both show it.

**Detail** (compare view with a result as the double, between the minis and the table): Shape match word, "Score 0.91"
(secondary, mono, grey), surface badge (Barren / Rugged, likely vegetated, with "Terrain form matches; the surface is
likely vegetated."), match likelihood as five coral segments and the word "rough" (never a number; `role="img"` with
"a rough estimate: n of 5"), the engine summary, all six properties (mark, label, status word, score; not measurable:
grey dash, grey label, "Not measurable at 200 m", "—"), "Matches: … · Differs: …", every caveat under Notes, Climate
(mean temperature °C, precipitation mm/yr, aridity band and index, the source line), Location (coordinates, elevation
a.s.l., surface, country, sovereign state, access: Artemis Accords signatory / not / Antarctic Treaty / unknown, and the
established analog site when inside one), and a `<details>` drawer "Engine values": `fidelity.*`, every `raw.*`,
`site_id`, `purpose`, then "Engine build" (api_version, matcher, judge, engine_commit, source, timing_ms). The compare
pair also carries the established-site tag. The table's "Shape match" row is gone (the detail has it).

**No percentages.** Shape match is a word, the score a two-decimal secondary number, the judge a rough bar; property
scores are two-decimal numbers; the banner gives a count; the compare table's "Slopes over 15°" is now an area of the
window (km²) instead of a percentage. The engine's own summary text was shown verbatim with its landform-mix
percentages ("flat 42%"); the review round rewrites engine prose (see "Results rework 1/4 review fixes").

**Escaping.** Every engine string (country, sovereign, summary, strengths, gaps, caveats, property labels, landform
class, climate source, raw keys and values, model fields, image URL) goes through `esc`; enums (confidence, status,
access, surface) only through fixed maps with `Object.hasOwn`; numbers only after a finite-number check. Tested with an
`<img onerror>` payload in every field.

**Mock.** The mock elevation (used only by the mock's images so far) is seeded value noise, four octaves, instead of six
sine waves, whose hillshades looked like moiré. Thumbnails get `filter: brightness(.8) contrast(1.15)` so a grey
hillshade (engine or mock) sits in the dark panel.

**Tests** (167, was 148): `ui/results.test.ts` (chips choice, banner text and tiers, card fields and tag, detail: six
properties, statuses, caveats, climate, location, drawer, not measurable, gap, missing climate, unknown access and
status, escaping, no "%" outside the engine summary; aridity bands; rough bar), `data/hillshade.test.ts` (flat grey,
north-west lit, no data transparent), `data/client.test.ts` (show more keeps the five then 20, Try again keeps k 20,
`windowOf` accepts only the two paths, `imageOf` refuses others as no_image).

**Harness.** `{ scroll: sel, to }` scrolls until `to` sits at the scroller's top (the foot when `to` doesn't exist, so
the reference's existing baselines still match the step). New states (all refNA but the first two, which keep their
reference baselines): `results-jezero` and `results-rima-hadley` now scroll to the doubles (banner and cards),
`results-jezero-more` (Show more tapped: 20 cards with hillshades), `results-rima-hadley-detail` (first card tapped:
the detail), `results-jezero-detail`, `results-jezero-notes`, `results-jezero-engine` (drawer opened). On the reference
the tap states fail (no such elements); their baselines aren't needed.

**Verification** (2026-10-20). typecheck, 167 tests and build green; production JS 223 KB gzip. Full capture, 48 states
× 2 viewports (96/96), no console errors. Mean absolute difference against the reference: every state this item doesn't
reach at its logged value (desktop: title 0.22, system 0.00, body-mars 0.97, body-mars-zoomed 3.71, dive 4.12,
compare-jezero-salda 4.62, compare-globe 2.49, results-moon-malapert 3.87; phone at its logged values). The edge-*/engine-*
states compare against unscrolled reference baselines since the review round's scroll step (10–58, not a change of this
item). Looked at the build captures of every results state at both sizes, compare-jezero-cell, compare-globe-cell,
compare-jezero-salda, edge-empty, edge-fail, and spot-checked the rest. Throwaway probes on `vite`: a sub-resolution
target's result (Shorty, rugged New Zealand cell) in the detail and as a card (grey dashes, "Not measurable at 200 m",
the rugged badge and line); normal mode: five cards, banner, five hillshades, Enter on Show more → 20 cards and 20
hillshades, no button left; a card → its compare with the detail and the card selected; the drawer opens; no "%" in the
panel outside engine summaries; `?mock=fail` → Try again; no console errors.

**Known limits.** After Show more, focus stays on the doubles box (the live region announces the list), not on card 6
(fixed in the review round: card 6). The not-measurable state can't be captured by route until targets can be picked by IAU name (part 3): the mock gives it
only to sub-resolution targets such as Shorty (part 3: `targets-shorty`). The live region re-reads the whole box when 20 cards land.

### Results rework 1/4 review fixes (done)

Twenty-two findings from the independent review (2026-10-20), three major (9 and 15: percentages on the demo path; 16:
the judge's number); all fixed, or logged where they wait on part 3. Overlaps: 2/16, 3/9/15, 5/19, 7/22.

| # | Finding | Outcome |
| --- | --- | --- |
| 9, 15, 3 | Percentages on the demo path: every card and the detail printed the engine summary verbatim ("landform mix at 3 km: flat 42%, shoulder 15%"), the capability caveat the engine adds for fair and weak targets ("for 53% of targets") would show under Notes, and the test exempted the summary | Fixed in `ui/results.ts` with two tested pure formatters. `fractions(s)` writes every "n%" as the fraction it stands for ("flat 0.42", "for 0.53 of targets"): lossless, the engine prints whole percents. `brief(s)` is a card's line: the summary without the "<country> (<lat>, <lon>): " prefix (finding 10), the "No close analog…" opener (the lede above the list says it) and the "; landform mix …" clause (the chips carry the form), so "Shape similarity 0.93 (close); relief 0.9x the target."; another shape falls back to fractions. The detail shows the full summary with fractions, caveats and property notes too. The `ours()` exemption is gone: no "%" in a card or the detail of any fixture, nor in the cap caveat. Deviations, Decisions 23 |
| 10 | The card's summary repeated the country and the engine's signed 2-dp coordinates under the card's own 4-dp ones | Fixed by `brief()` (above); the detail keeps the full summary |
| 16, 2 | The drawer printed `raw.judge_p_good` (0.9321) | Fixed: left out of the raw rows (the bar shows it); test flipped (no `judge_p_good`, no 0.9321 in the detail) |
| 1 | `results-rima-hadley` never shows the Rima Hadley fixture (eva_training, sovereigns USA): the app sends rover_mobility without filters, so the mock derives the cells; only the target's capability is the fixture's | Logged (Deviations): waits on part 3's purpose picker and filters; add a state on the fixture's query then |
| 4 | Chip status as an icon only, no legend; a not-measurable chip looked neutral | Fixed: a not-measurable chip's label is grey (`.chip.s-not_measurable`), and a one-line legend of the four marks ("Match, Partial, Gap, Not measurable at 200 m", `aria-hidden`: each chip already reads its status) sits above the cards |
| 5, 19 | A compare deep link or reload for a double ranked 6–20 ran k 5: no detail, no selected card | Fixed: `watch()` asks for the 20 (`doublesOf(…, MORE)`) when a compare's Earth pin isn't among the results; the detail and the selected card follow. New states `results-jezero-low` (rank 13 by deep link) and `results-jezero-low-list` |
| 6 | The confidence word was in Geist Mono | Fixed: Geist 500, coral |
| 7, 22 | All 20 thumbnails asked at once | Fixed: `loading="lazy"` on the thumb `<img>` (the engine fetch waits until the card nears the viewport; in the mock the drawing is local) |
| 8 | Aridity bands past the spec's three unlogged; `properties[].note` never shown; per-property raw values missing from the drawer | Fixed: bands logged (Decisions 22); a property's note shows under its row (escaped, fractions); the drawer lists `percentile_earth, weight, baseline_m` per property under a column row |
| 11 | `edge-empty` scrolled to the foot: the no-match lede and banner off screen | Fixed: `{ scroll: '#panel', to: '[data-doubles]' }` |
| 12 | No capture of the detail's non-ideal states | Partly fixed: `results-jezero-low` shows a rank-13 cell (likelihood 3 of 5, Medium, a gap, the polar note, Analog site: Haughton Crater). Not-measurable and the rugged badge need a purpose or an IAU target the app can't pick yet: capture TODO for part 3 (Deviations); both are unit-tested |
| 13 | "Loading more…" had no disabled style | Fixed: `.btn[disabled]` (opacity .4, default cursor) for every button, hover only on enabled ones. New state `results-loading-more` (`?mock=slow`) |
| 14 | On compare the doubles list sits ~1,500 px under the detail; the selected card was never captured | Fixed: an "Other doubles" skip link (right-aligned under the maps, only when the detail shows) scrolls to the list and focuses it (Decisions 24). New states `results-jezero-list` (the link tapped: list head, card 01 selected) and `results-jezero-low-list` (card 13 selected among 20) |
| 17 | A failed Show more wiped the five cards; Try again restarted from "Searching Earth…" | Fixed: the cards stay, the error and Try again take the button's place; the retry keeps the five (`doublesOf` keeps `res` on every re-ask). Client test |
| 18 | Show more on compare rebuilt the detail twice (closing the drawer, redrawing maps and scenes) | Fixed: `[data-cmp]` carries what it shows of the search (`detail`, `res`, `wait`); `fill()` redraws it only when that changes. Markers are rebuilt every time (Show more adds markers). Probe: the drawer stays open through Show more |
| 20 | After Show more, focus fell back to the box | Fixed: when the 20 land and the box holds the focus, card 6 gets it (`preventScroll`). Probe: Enter on Show more, focus on card 06 |
| 21 | `esc(c.landform_class)`, `esc(e.source)` on unchecked values | Fixed: `text()` |

**Verification** (2026-10-20). typecheck, 173 tests (was 167: `fractions`, `brief`, judge left out, cap caveat and
property note, chip and legend, failed Show more keeps the five) and build green. Full capture, 52 states × 2 viewports
(104/104), no console errors. Desktop states this round doesn't reach at their logged values (title 0.22, system 0.00,
body-mars 0.97, body-mars-zoomed 3.71, dive 4.12, compare-jezero-salda 4.62, compare-globe 2.49, results-moon-malapert
3.87; the skip link shows only with a detail, so compare-jezero-salda is unchanged). Looked at the build captures of
every results state, edge-empty and compare-jezero-cell at both sizes, and spot-checked the rest. A first run showed a
class clash (the legend's `.legend` restyled the terrain HUD's elevation legend); renamed `.marks`, re-captured.
Throwaway Playwright probe on the dev server: Show more by keyboard → focus on card 06; compare drawer open → Show more
→ drawer still open, 20 cards; Other doubles → focus on the box, 18 px under the panel top, page not scrolled; a fresh
deep link to rank 13 → its detail, card 13 selected among 20, 3 likelihood segments; no "%" anywhere in the panel; no
console errors.

### Results rework 1/4 review fixes, round 2 (done)

Two major findings from the second independent review (2026-10-20); both fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The mock's derived results contradicted themselves: six random property scores beside a cosine and a judge that fell only with rank, so Rima Hadley's rank 1 showed "Shape match High", "0.94 (close)", then "Landform shape Partial 0.61", "Matches: none" and a full likelihood bar; the summary said "(moderate)"; `?mock=empty` kept "0.93 (close)" under "Low" | Fixed in `data/mock.ts` (Decisions 25). `derive()`: `terrain_form` is set from rank (0.995 − 0.004·rank − up to 0.01, so a match through rank 20, as `rr(form)` in engine.py); the judge falls 0.02 a rank from 0.95; the other five scatter ±0.2 around judge − 0.03; the shape cosine follows their mean (0.55 + 0.45·mean); the summary uses engine.py's close / partial / weak. `noAnalog()`: cosine to min(0.79, cosine − 0.2), confidence low, the summary's similarity and tier rewritten ("0.73 (weak)"), judge halved. Rima Hadley rank 1 now: High, 0.95 (close), Landform shape Match 0.99, five segments, "Matches: landform shape, roughness, raised vs incised". Test: on Gale, Rima Hadley and Jezero (20 each, fixture ranks included), landform shape a match, confidence and tier word from the cosine, judge strictly falling, rough bar within one segment of the mean; empty: cosine under 0.80 and "(weak)" |
| 2 | Picking another card in the compare's doubles list kept `panel.scrollTop` (2,084 px) and moved no focus: the new double's detail sat off screen, focus on `BODY` | Fixed in `ui/panel.ts` `renderPanel`: a new double (`prev.dbl !== state.dbl`) is a new view, so the panel goes to the top and focus to the "Comparison" heading; the Globe toggle keeps the place. New state `results-jezero-pick` (from `results-jezero-list`, card 03 tapped) |

**Verification** (2026-10-20). typecheck, 174 tests (was 173) and build green. Full capture, 53 states × 2 viewports
(106/106), no console errors. Desktop states this round doesn't reach at their logged values (title 0.22, system 0.00,
body-mars 0.97, body-mars-zoomed 3.71, dive 4.12, compare-jezero-salda 4.62, compare-globe 2.49, results-moon-malapert
3.87). Looked at the build captures of results-rima-hadley(-detail), results-jezero-more, results-jezero-low,
results-jezero-pick and edge-empty at both sizes, and spot-checked compare-jezero-salda and the other results states.
Throwaway Playwright probe on the dev server (the reviewer's steps): Other doubles, Enter on card 03 → route
`@-27.8250,127.1250`, `scrollTop` 0, focus on the "Comparison" heading, card 03 selected, at both sizes; then the Globe
toggle → `scrollTop` kept; no console errors. Probe of the mock's 20 for Rima Hadley, Jezero and Jezero empty: every
rank's landform shape a match, confidence mostly High through rank ~12 and Medium after, gaps only from rank ~9.

**Known limit.** Past an example's five, the derived ranks start their judge at 0.85; the Rima Hadley (0.71 at rank 5)
and coordinates (0.24) examples sit below it, so their rank 6 would read higher than rank 5. Neither query is reachable
until part 3's purpose picker; give `derive()` the example's last judge as a ceiling then. (Fixed in part 3.)

### Results rework 2/4: compare twins, Earth pins (Must 4, part 2, done)

**Where.** `src/terrain/tiles.ts` (new): `fromElevation(e, pal, engine)` reads an engine window (validated: a square
grid with at least one height; no-data samples at the lowest height) into the `Terrain` every view draws, and
`windowZ(T)` resamples a frontend terrain to the engine's 94 × 94 (bilinear, 0.1 m). `terrain/procedural.ts`:
`genTerrain`'s statistics moved into `measure(z, N, win, pal, lake)` (shared); `Terrain.engine` marks the engine's own
elevation. `terrain/mesh.ts` `buildTerrain(i, T, exag)` takes the terrain itself. Seam (`data/client.ts`):
`terrainOf(body, site)` and `shadeOf(body, site)`, over a per-window cache of `data.elevation` (asked once, failures
kept); `imageOf` draws the mock's images from the same cache. `data/pins.ts` records each Earth pin's engine cell
(`cellOf`, from `site_id`). `data/mock.ts` `mockEngine(modes, clock, terrain)`: the mock's elevation is now the
frontend's terrain of the place (`MockTerrain`, passed in by the client), not value noise. `ui/results.ts` `twins`;
`ui/markers.ts` Earth pins; `ui/panel.ts` and `ui/topomap.ts` read the compare windows through `terrainOf`.

**3D terrain of the compared window** (plan gap 1, now wired). Compare builds both terrains, both minis, the table and
the hover readout from `terrainOf`: the engine's 94 × 94 window at 200 m once `GET /elevation/...` has landed
(target by IAU name or by its point, as its search; an Earth pin by the cell its search placed there), the frontend's
own terrain of the same 18.8 km window until then and wherever the engine has none (an established Earth site such as
Salda has no cell; no_dem; a failure). When a window lands, the compare block (`[data-cmp]`, its key now carries the
two windows' state) and, if shown, the terrain scenes are rebuilt in place, as when the search lands. In the mock the
window *is* the frontend's terrain of that place (the featured site there, by IAU name or by its point; else a pin;
an Earth cell's pin at the cell's elevation), resampled to 94 × 94, so the merge is the swap of `data.elevation`. With
the engine's windows the terrain note reads "The search engine’s elevation of the window it compared, 200 m samples."
and the table's stand-in line goes (both keyed on `Terrain.engine`, false in mock mode).

**Twin hillshades** (spec §4 `terrain_twins`, §7.6). Under the minis and the "Other doubles" link, when the double is a
result: "Terrain twins", the target's window beside the cell's (`terrain_twins[0].target_url` and `earth_url`,
lazy like the card thumbnails, captions with the two names), and "The engine’s hillshades of the two 18.8 km windows it
compared, lit from the north-west." The fixtures carry image URLs, no image data: in the mock both are drawn from the
mock's elevation of those windows (the frontend's terrain, Decisions 26). A target searched by coordinates (Arcadia,
pins) has no `target_url` in the engine's answer: its twin is drawn from its point window's elevation
(`data-shade`, `shadeOf`), in both modes, with the engine's lighting.

**Earth pins** (spec §4: "map pin, plus an 18.8 km square footprint"). On the globe compare every result on Earth is a
square marker (its footprint) instead of the circle the established sites keep; the selected one coral. At globe scale
18.8 km is under 2 px (18.8 / 6,371 × ~400 px at the closest zoom), so the square is drawn at the marker's size, as the
crops floor their footprint at 3 px. A pin inside one of the 14 established analog sites (`establishedAt`, ±.085° as
the cards) gets a white dot in its square, its label a second line "Analog site: Hanksville", and its accessible name
"…, 18.8 km footprint, inside Hanksville". The pair on the compare panel already carried the tag (part 1).

**The 14 established sites** are the frontend's (`data/sites.ts` `SITES.earth`): the engine has no such list (spec,
contracts, examples and engine code searched): its only notion is `site_listing.known_analog {label_ids, citation}`,
with one example (TS01, Green River, Hayden et al. 2019), which `listing.ts` already fills from `establishedAt`. The
plan lists them as frontend-owned data (Data seam).

**Tests** (184, was 174): `terrain/tiles.test.ts` (3: a window's statistics and row order, no-data and malformed
windows, the resample keeps corners and range), `data/client.test.ts` (4: a target's window by name and by point,
frontend terrain until it lands then the engine's, asked once; failures and malformed windows keep the frontend's and
aren't asked again; Earth by cell only, an established site none; a coordinate target's twin from its point window),
`data/mock.test.ts` (1: the place handed to the terrain, a name at its IAU centre, a cell at its location, a derived
lap cell, unknown cell 404 no_image, unknown name), `ui/results.test.ts` (2: twins markup and fallback, escaping).

**Harness.** New refNA states: `compare-twins` (Jezero by name with its first cell, scrolled to the twins),
`compare-twins-point` (Arcadia, a coordinate target, with Hanksville's cell at 9 s: the point twin, the tagged pair),
`compare-globe-pins` (the same pair as globes: five footprint squares, the selected one dotted and labelled "Analog
site: Hanksville").

**Verification** (2026-10-20). typecheck, 184 tests and build green; production JS ~217 KB gzip. Full capture, 56
states × 2 viewports (112/112), no console errors. Mean absolute difference against the reference, every state this
item doesn't reach at its logged value (desktop title 0.22, system 0.00, body-mars 0.97, body-mars-zoomed 3.71, dive
4.12, site-* 0.02–0.16, coord-* 0.13–0.15, results-moon-malapert 3.87; phone at its logged values);
`compare-jezero-salda` 4.62 and `compare-globe` 2.49, unchanged to two decimals although Jezero's terrain is now the
94 × 94 window and the result pins squares. Looked at the build captures of the three new states, compare-jezero-cell,
compare-globe, compare-globe-cell, results-jezero, results-jezero-low, results-rima-hadley-detail at both sizes, the
compare-jezero-salda sheet (framing as before), and spot-checked the rest. Throwaway Playwright probe on the dev
server (normal mode): a cell compare deep link (both windows landed, twins loaded), `?mock=fail` (windows failed, the
frontend's terrain, no errors), Malapert/Haughton (no_dem and no cell: frontend terrain), Arcadia → second card →
compare (the point window lands 6 s later, then its twin and terrain) → Globe (five squares, one tagged) → Terrain; no
console errors.

**Known limits.** A coordinate target's window is asked only when its compare opens: in the mock 6 s after the click
(the engine: 5–10 s first time), with the frontend's terrain and an empty target twin until then. A window that failed
(including `warming_up` under `?mock=warming`) stays the frontend's terrain for the session (review fixes: warming_up
and network failures are retried). The mock's windows read the textures loaded when asked; one asked before a late
texture keeps the flat terrain. The mock's Earth twins and card thumbnails are nearly flat grey: the frontend's Earth
pin terrain is the 4K bump map (≈10 km a pixel) plus 30 m of noise, and the hillshade uses true slopes like the
engine's (review fixes: each hillshade stretched to its own range). The terrain swap when a window lands has no
curtain (Decisions 27).

### Results rework 2/4 review fixes (done)

Fifteen findings from the independent review (2026-10-20), three major (8 and 12: blank twins and thumbnails; 1: the
compare block redrawn under the reader when a window lands). All fixed. Overlaps: 1/13, 3/14, 4/10, 7/8/12.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 13 | A window landing (1–10 s after compare opens) redrew the whole `[data-cmp]` block and the markers: the Engine values drawer closed, focus on Other doubles, the drawer summary or a globe marker fell to `BODY` | Fixed in `ui/panel.ts` (the finding's first option): the block's key is only what it shows of the search (`cmpOf`: detail, res, wait); the windows' state (`winOf`) keys an inner `[data-terr]` (the table and its stand-in line, `terrHTML`). When only a window lands, `fill()` redraws that part, the maps and, in terrain mode, the scenes and terrain overlay; the pair, twins, detail and drawer stay. `buildMarkers` gives the focus back to the marker that held it (`data-k` = viewport and site). Probe (both sizes, Arcadia's Hanksville cell): drawer opened and its summary focused at 6.5 s, the Earth window landed by 14 s (`data-terr` 10 → 11), drawer still open, focus still on the summary; a focused globe marker kept its focus through the rebuild |
| 2 | A failed elevation call stayed cached for the session, warming_up and network errors included | Fixed in `data/client.ts`: the window's promise asks again on warming_up and network every 3 s (spec §6: 2–5 s) for a minute (20 tries; the engine warms up in 30–40 s, spec §1), so `settled` waits through a warm-up and the compare redraws when it lands; no_dem, no_image and unknown_target stay cached. Not the finding's first option (drop the entry): the redraw its failure triggers (`fill` → `terrainOf`) would ask again at once, a loop at the failure's latency (20 ms in the mock). Test on fake timers |
| 3, 14 | The twins' note said "The engine’s hillshades…" in mock mode and for a coordinate target, whose tile is drawn in the browser | Fixed: `twins(…, engine)` (`AS_ENGINE`: engine mode, or `?mock=asengine`). Mock: "Hillshades of the two 18.8 km windows, lit from the north-west, each at its own contrast. Drawn from sample terrain until the search engine is connected." Engine: "The engine’s hillshades of the two 18.8 km windows it compared, lit from the north-west."; with a coordinate target: "Hillshades of the two 18.8 km windows the search compared, lit from the north-west: the engine’s, and the target’s drawn here from its elevation." Tested |
| 4, 10 | Phone: the selected Earth pin's label ran off the screen, hiding "Analog site: Hanksville" | Fixed in `ui/markers.ts` `placeMarkers`: a label that would run past its viewport's right edge goes left of the marker when it fits there (`flip`), else under it, centred (`drop`); the width is measured once per marker. On the phone's half-width globes neither side fits, so both selected labels sit under their markers, inside their viewport (Deviations). A shown label (selected, hover, focus) is raised over markers drawn after it |
| 5 | With results shown, the 14 established sites weren't drawn on the Earth globe, so a tagged pin had no visible reference | Fixed: the established sites not among the doubles are a faint layer (7 px hollow circles, `.est`) drawn first, under the doubles; labelled on hover like any marker, a click compares with that site (the Rehearses path); `tabindex -1` (a reference layer: Tab goes through the doubles; the Earth view lists the sites), accessible name "…, established analog site". Marker spread moves the layer only among itself, so a result inside a site sits on it |
| 6 | No test or capture rendered the engine-mode copy (`Terrain.engine`) | Fixed: `?mock=asengine` labels the mock's windows and images as the engine's (`AS_ENGINE`); new states `compare-asengine` (the twins' engine note) and `compare-asengine-table` (the table without the stand-in line). The terrain overlay's note is hidden on viewports under 520 px (`.tui.narrow`, prototype), which both compare viewports are at 1280 and 390 px: probed at 1700 × 900 instead, where both read "The search engine’s elevation of the window it compared, 200 m samples." |
| 7, 8, 12 | The twins (and, since part 2, every mock card thumbnail) were near-uniform grey squares: a 1× hillshade of gentle 18.8 km relief, under `brightness(.8)` | Fixed in `data/hillshade.ts`: each hillshade is stretched to its own 2nd–98th percentile, as the judge's figures of the same windows are (matplotlib `imshow`, auto-normalised; `judge.py render_panels`); under one grey level of spread it stays as lit (a flat window is still one grey). Its slopes now follow numpy's `gradient` (the engine's): one-sided at the edges, where they had been half-slopes that a stretch turned into a frame. Covers both twins and the card thumbnails, mock and coordinate-target drawings; the engine's own PNGs get it at the merge (Merge notes). Decisions 30. Test: a 4.5 m bowl spans 0–255, lit side bright |
| 9 | Loading, a 404 no_image and a missing `earth_url` all showed the same empty square under the hillshade note | Fixed: a twin without a URL, or whose image failed, shows the panel's placeholder tile (`.imgs .ph`, as the Surface tile) "No hillshade for this window" (`NO_SHADE`); one still loading stays the empty tile. Cards (72 px) keep the empty tile. New mode `?mock=noimage` (every Earth cell answers 404 no_image, as for a cell without DEM) and state `compare-twins-noimage`. Tested |
| 11 | An unselected tagged pin was a 3 px dot in a 9 px square: no key, no hover on touch, no capture state; `compare-twins-point`'s check named a pair it scrolls past | Fixed: the tag is a 15 px ring round the square (an established site's circle around its cell), readable unselected and on touch; with the faint layer beneath, that is the key. New state `compare-globe-tagged` (Arcadia's first cell selected, the Hanksville cell ringed beside it). `compare-twins-point`'s check corrected. No separate key line |
| 15 | Each mock window ran `genTerrain` at 192² synchronously (~17 ms; Show more asked 15 at once) and went through `prunePins`, evicting the user's own pin terrains | Fixed: `procedural.ts` `heights(body, site, win, N)` is `genTerrain`'s sampling, uncached; the mock draws its windows at the engine's 94² directly (the same samples, edge to edge, so the same ground) with no cache entry. 16.5 → 4.2 ms a window (Node, sample maps stubbed). `windowZ` now only rounds rows. Not done: computing the answer after the latency (all of Show more's windows land on the same tick anyway) |

**Verification** (2026-10-20). typecheck, 189 tests (was 184: the hillshade stretch, the elevation retry, `?mock=noimage`,
twins copy and placeholder) and build green. Full capture, 60 states × 2 viewports (120/120), no console errors.
Mean absolute difference against the reference, states this round doesn't reach at their logged values (desktop
title 0.22, system 0.00, body-mars 0.97, body-mars-zoomed 3.71, dive 4.12, compare-jezero-salda 4.62,
results-moon-malapert 3.87); compare-globe 2.49 → 2.50 desktop (the faint layer), and on the phone its Mars label sits
under the marker. Looked at the build captures of compare-twins, compare-twins-point, compare-twins-noimage,
compare-asengine(-table), compare-globe(-pins, -tagged, -cell), results-jezero-list and results-jezero-more at both
sizes, the compare-jezero-salda sheet (framing unchanged), and spot-checked the rest. Probes (throwaway Playwright,
`?capture` on `vite`): drawer and focus through a window landing, marker focus through a rebuild, the engine note at
1700 px.

**Known limits.** The stretch shows the frontend's Earth pin terrain as it is: a window that straddles a bump-map pixel
(≈10 km, 8-bit) shows its facets as a two-tone crease (Arcadia's Hanksville twin, some thumbnails past rank 15); the 3D
terrain has the same crease at 8×. Real DEMs replace it at the merge. Each side is at its own contrast, so brightness
isn't comparable across the pair (the table's relief row is). The elevation retry gives up after a minute; an engine
down longer keeps the frontend's terrain until reload.

### Results rework 2/4 review fixes, round 2 (done)

Three major findings from the second independent review (2026-10-20); all fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | A named target's engine window is centred on the IAU centre (Jezero 18.4082° N, 77.6873° E; Rima Hadley 25.7159° N, 3.1467° E), but compare labelled it at the featured point (6.3 and 18.2 km off): edge chips, hover readout and status bar. The mock hid it by drawing the featured point's terrain under the name, so at the merge the ground would have shifted under unchanged labels | Fixed (the finding's first option). `data/client.ts centreOf(body, s)`: a named target's window centre is where its search says the target is (`res.target.lat/lon`, the engine's own answer), else (a coordinate target, a pin, Earth, or until the search lands) the site's point. The compare minis' edge chips and hover readout (`ui/topomap.ts`) and the compare status bar (`ui/chrome.ts`) use it. The frontend's terrain of the window is drawn there too: `procedural.ts heights/genTerrain(…, at)` sample the site's archetype around another centre (the same ground, shifted; cached per centre), used by `terrainOf`'s fallback and by the mock's named windows (`frontZ` now draws at the lat/lon the mock's catalogue gives, i.e. the IAU centre, as `server.py target_elevation` does). Labels, fallback terrain, mock window and engine window now all sit on one centre, so the merge is the swap of `data.elevation`. The site view keeps the featured point and its own extent. Decisions 33 |
| 2 | The selected marker's label (always shown, drawn on top) checked only its viewport's edge: on desktop `compare-globe-tagged` it hid the ringed Hanksville square it exists to show; on the phone the dropped labels covered a Mars site marker and an Earth square | Fixed in `ui/markers.ts placeMarkers` with a tested pure helper, `ui/label-spot.ts labelSpot`: the label's box is tried right of the marker, left, under and above (under and above centred, then running right from the marker, then left, each clamped inside the viewport), against every other visible marker in the same viewport (its 15 px ring's reach); the first clear spot inside the viewport wins, else the one covering fewest markers (first of equals: the old right, left, under order), else under it. The label is placed by a `transform` from the marker's centre (the `.flip` / `.drop` classes are gone); its size is measured once. Desktop `compare-globe-tagged`: the label goes left, the ringed square shows. Phone: "Arcadia Planitia" runs right under its marker, clear of the Mars markers; the `compare-globe-pins` Earth label clears every square. Phone `compare-globe-tagged`: no spot is clear (a 150 px label on a 195 px globe over a 50 px cluster), so the label takes the spot that covers fewest, half of one square (Deviations). Decisions 35 |
| 3 | The twins' stretch worked only in the mock: in engine mode they were the engine's 1× PNGs (near-uniform grey for gentle windows), and a coordinate target's stretched drawing sat beside an unstretched engine Earth PNG | Fixed (the finding's option): `ui/results.ts twins` draws both twins from the windows' elevation in every mode (`data-shade`: the target by its site, the cell by its Earth pin, `shadeOf`), the same windows compare already fetched through `terrainOf` (same cache key: no extra request), each stretched to its own range like every hillshade the frontend draws. The engine's PNGs stay on the card thumbnails only. Copy: mock unchanged; engine "Hillshades of the two 18.8 km windows the search compared, drawn from the engine’s elevation, lit from the north-west, each at its own contrast." (shown by `compare-asengine`). A missing window (404 no_image, `?mock=noimage`) still shows the placeholder. Merge note and Decisions 30 updated; Decisions 34 |

**Tests** (195, was 189): `ui/label-spot.test.ts` (4: right when clear, left when blocked or at the edge, under then above shifted inside the viewport, hidden markers no obstacle, fewest-covered fallback and the last resort), `terrain/procedural.test.ts` (a window centred elsewhere is the same ground, shifted), `data/client.test.ts` (a named target's window centre from its search; a pin's on itself; the fallback terrain at that centre); `ui/results.test.ts` twins rewritten (both drawn from elevation, no `data-thumb`, the placeholder, both notes, escaping).

**Verification** (2026-10-20). typecheck, 195 tests and build green; production JS 218 KB gzip. Full capture, 60 states × 2 viewports (120/120), no console errors. Mean absolute difference against the reference, states this round doesn't reach at their logged values (desktop title 0.22, system 0.00, body-mars 0.97, body-mars-zoomed 3.71, dive 4.12, site-* 0.02–0.16, coord-* 0.13–0.15, results-moon-malapert 3.87). Changed on purpose: `compare-jezero-salda` 4.62 → 5.16 and `compare-globe` 2.50 → 2.71 desktop (the status bar reads the window's centre, 18.4082° N, 77.6873° E; the Jezero window, minis and table are the archetype around the IAU centre: crater floor and eastern rim instead of the floor around the landing site); framing unchanged. Looked at the build captures of compare-globe-tagged, compare-globe-pins, compare-globe, compare-twins-point, compare-twins-noimage, compare-asengine at both sizes (phone ones also cropped and enlarged), compare-jezero-salda's sheet and results-rima-hadley-detail (window at 25.7159° N, 3.1467° E), and spot-checked the rest.

**Known limits.** A named target is labelled at its featured point until its search lands (20 ms from the cache), and stays so if its search fails while its window lands (engine mode only; `shortcut:` in `centreOf`). Rima Hadley's window, 18.2 km from the featured point, no longer holds the rille the site view shows: that is the window the engine compares (part 3 may move featured points to their IAU centres, Decisions 10). On the phone's half-width globes a long label over a tight cluster can still cover part of a marker.

### Results rework 3/4: purpose picker, filters, IAU targets (Must 4, part 3, done)

**Where.** `ui/panel.ts` (the form `[data-ask]`: purpose and filters, above the doubles on the site and compare views;
the target note in the doubles box), `ui/target-search.ts` (new: the named-feature search on the Mars and Moon body
views), `ui/chrome.ts` (Search this area, `#area` in `index.html`; crumbs and status bar name a named target),
`scene/input.ts` `earthInView()` and `coords.ts` `areaOf()` (the Earth in view as a bbox), `ui/results.ts`
`targetNote()`. Seam (`data/client.ts`): `query` (purpose and filters) on every search, kept per site and query;
`lists` / `askLists()` (purposes and countries, checked); `centreOf` from a per-site centre map. `data/pins.ts`:
named targets. `data/mock.ts`: the lazy catalogue (`catalogue()`, `src/data/targets.json` from
`scripts/trim-targets.mjs`), and derived judges kept under an example's last.

**Purpose picker** (spec §3.2, plan Must 4). A native `<select>` styled as the panel's inputs (`.sel`: 38 px, 8 px
radius, `--surface-2`, a chevron), headed "Test purpose", from `GET /purposes` through the seam; required, rover mobility
by default (`query.purpose`); polar lighting geometry listed disabled as "Polar lighting geometry (lighting module, not
this search)". Under it the engine's description of the purpose, "Searches barren land only." for the barren ones (the
education text already says "anywhere on land"), and "A purpose decides where on Earth the search looks, not how it
scores the terrain." (plan: selector copy must not claim to weight the match).

**Filters** (spec §3.5, §7 flow 4), in a "Filters" disclosure (the drawer pattern) under the purpose, with "n on" in
coral when any is set: Country (a `<select>` of `GET /sovereigns`, "All countries" first) → `sovereigns: [name]`;
"Artemis Accords partners only" → `access: ['partner']`; "Exclude polar sites, beyond 60° latitude" →
`exclude_polar: true`; "Include vegetated land" → `surface: 'any'` (checked and greyed for education, whose surface is
already any); Area: "Anywhere on Earth", or the bbox's latitudes and longitudes with Clear. Filters go in the request
only when one is set (spec: the default search is the fastest); a change re-renders the form (focus kept on its
control by id, the disclosure's state kept) and asks the search again through `fill()`: the doubles, compare block,
markers and live region update as when any search lands. Each site and query keeps its own search (switching back is
instant; key: purpose plus the filters with sorted keys).

**Search this area** (spec §3.5 filter tips). On the globe compare a button in the Earth viewport's bottom-right corner
(level with the toggle; on a phone just above the sheet; the toggle's look, a line magnifier). It casts 13 × 13 rays
over the Earth viewport onto the globe (an analytic sphere), drops ground seen more than 60° from face-on (a zoomed
globe still shows a sliver of limb that stretched the area over half a hemisphere), adds a pole when it faces the
camera inside the view, and makes the bbox (`areaOf`: lat range, longitudes as offsets from the view's centre, rounded
outward to 0.01°; a pole takes every longitude; cut at ±180°, the engine's bbox can't wrap). It sets the area filter,
opens the disclosure and asks again.

**Targets** (spec §3.3–3.4, §7 flow 1). The Mars and Moon body views gain "Find a named feature" above "Go to
coordinates" (lede: "Find a named feature, pin any point on the globe, or start from a featured one."). An ARIA 1.2
combobox with list autocomplete and automatic selection: `GET /targets?body=&q=&limit=8` through the seam, debounced
150 ms on the app clock; options as the panel's rows (name, size "≈ 27 km" in mono, "Mons · 18.16° N, 78.23° E", and
"Featured: Jezero Crater" when a featured site carries that IAU name); the first active when results land
(`aria-activedescendant`, `aria-selected`), ArrowDown/ArrowUp move (wrapping), Enter opens, Escape closes the list,
then clears the field (and never leaves the view), a press on an option keeps the focus in the field; the count or
"No named feature on Mars matches …" in a polite live line; warming and failure copy. The answer is checked (body,
name, finite position). A pick opens its featured site (Jezero → `#/mars/jezero`), or else the **named target**
`#/mars/Jezero%20Mons@18.1600,78.2300`: a pin at the IAU centre carrying the name (`Site.iau`), searched and its
elevation asked by name (cache, 20 ms), its terrain from the global map like any pin, titled, crumbed and status-barred
by name. The name comes from the URL, so `customSite` accepts only the characters IAU names use (letters, marks,
digits, space, . ' ’ -; 64 at most): it reaches the page unescaped as the site's name. A name the engine doesn't know
gets its unknown_target copy and the coordinate search.

**Featured sites by their IAU name, and the size note** (spec §3.4). Once a named search lands, the doubles box says
what was compared, from the answer's target: "Searched as the IAU feature Rima Hadley · Rima · ≈ 116 km across. Larger
than the 18.8 km comparison window: the search matches its central part." (a featured site whose name differs), "IAU
feature · Mons · ≈ 27 km across. …" (a named target), nothing for a search by coordinates. Every named featured target
is wider than the window (Jezero 48 km, Gale 154, Utopia 3,560, Rima Hadley 116, Taurus Littrow Valley 21).

**Mock.** `GET /targets` answers from the engine's store without the 6,252 lunar satellite craters (code SF, which the
engine hides unless asked or matched): 3,848 targets (2,051 Mars, 1,797 Moon), lat/lon at 4 dp as `server.py` rounds
them, diameters as stored, family from `server.py`'s FAMILY, capability from `landform_capability_v2.csv` matched as
`engine.py Index.capability` does. 163 KB raw, 73 KB gzip, its own chunk, loaded on the first call that needs it
(autocomplete, or a name the small built-in list lacks); the built-in answers keep their exact latency. Unit test: the
`targets_jez` example is reproduced exactly from it, and the built-in featured targets equal its rows (it caught Mons
Hadley's diameter typed 26.3956 for 26.395605). Rima Hadley's example query (EVA training, United States of America) is
now reachable from the form; past an example's five, derived judges now fall from its last (Known limit of part 1
round 2, fixed).

**Tests** (206, was 195): `client.test.ts` (the query in the request, filters omitted when empty, a query per search
and kept, key order; purposes and countries checked, a failure asked again), `pins.test.ts` (named targets, names the
IAU doesn't write refused, none on Earth; a picked target's route reads back as it, `sites.ts targetSiteId`), `coords.test.ts` (`areaOf`: rounding outward, antimeridian cut, poles),
`results.test.ts` (`targetNote`), `mock.test.ts` (the catalogue against the fixture and the built-in targets, a
catalogue-only name searched; judges falling past the filtered and coordinates examples), `contracts.test.ts` (every
filter the panel sets, on a catalogue target, validates against `search_request`).

**Harness.** Steps `{ select: sel, value }`, `{ wait: ms }` (real time, page time frozen: the catalogue chunk loads)
and `{ wheel, at, fx, fy }` (wheel at fractions of an element's box: the compare's right globe). New refNA states:
`ask-hadley`, `ask-hadley-results`, `ask-hadley-detail` (the Rima Hadley example's own query, its US cells and their
detail), `ask-education`, `ask-education-rugged` (Gale: the rugged New Zealand cell and its badge),
`targets-jez`, `targets-named` (Jezero Mons by keyboard), `targets-shorty` (not measurable at 200 m), `compare-area`,
`compare-area-filters`. They close part 1's capture TODOs (the fixture's query, not measurable, the rugged badge).

**Verification** (2026-10-20). typecheck, 206 tests and build green; production JS 230 KB gzip at start (was 218: the
form, the search box, the mock's own code), plus the 74 KB target list chunk loaded on the first named search. Full
capture, 70 states × 2 viewports (140/140), no console errors (a first run failed `results-jezero-engine` and the two
states after it: its `.drawer summary` now also matched the Filters disclosure; the state taps `.res .drawer summary`).
Mean absolute difference against the reference, desktop: untouched views at their logged values (title 0.22, system,
info and Beyond 0.00, intro and sunrise 0.00–0.08, footer 0.04–0.18, dive 4.12, site-haughton 0.16, site-moon-malapert
0.13, site-moon-south 6.48, compare-jezero-salda 5.14); changed by the new panel parts: body-mars 3.02 (was 0.97),
body-mars-zoomed 5.76, body-moon 2.19, coord-valid 2.96, coord-error 2.46, coord-moon-pole 5.62 (the named-feature
search above the coordinates), site-jezero 0.23 (the form's head below the fold instead of the Compare button's top),
compare-globe 2.79 (Search this area), results-jezero 8.12, results-rima-hadley 10.14, results-moon-malapert 9.39 (the
form above the doubles, the target note). Phone: the same states move the same way (compare-globe 15.47 with the button
over the Earth half); the rest at their logged values. Looked at the build captures of every new state at both sizes
(ask-hadley with its US cells and their detail, ask-education and the rugged badge, targets-jez, targets-named,
targets-shorty, compare-area and its filters) and at the compare sheets of body-mars, site-jezero and phone
compare-globe; spot-checked the rest. Throwaway Playwright probes (`?capture` on `vite`): the filters' country select
first overflowed the panel by 48 px (Chrome's details slot doesn't pass `box-sizing` on: fixed); the area first came
out 22.81° S–81.09° N, 180° W–5.18° W for a view of North America (the limb sliver: fixed, now 3.07° S–69.60° N,
154.48° W–55.67° W); education's top five per featured site (Gale's has the New Zealand cell first).

**Known limits.** Purpose and filters aren't in the route (Decisions 36). The mock's area search chooses among its 19
pool cells (laps .3° apart fill the 20), so an area away from them comes back empty and a full one shows clustered
pins. The Earth area can't cross the antimeridian. The mock lists no satellite craters. One country at a time. The
target note needs the search's answer (20 ms named; never for a failed search).

### Results rework 3/4 review fixes (done)

Nineteen findings from the independent review (2026-10-20), seven major (1: the south-pole sites unfindable by name;
2/14: Enter opening a stale option; 7: lists stuck on Loading; 8/15: a filter change asking for 20; 9: a live form on
no_dem sites). All fixed but the area outline of 13 (Deviations). Overlaps: 2/12/14/18, 3/7/16, 4/17, 8/15.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The engine's targets stop at 59.24° on the Moon: Malapert, Haworth, Nobile, de Gerlache, Shackleton found nothing, with no word on why | Fixed. `data/sites.ts featuredByName`: featured sites without an IAU name whose name holds the text are listed first ("Malapert Massif · Featured site · 86.0000° S, 0.0000° E"), opening the featured site (its no_dem state). On the Moon, no match says "The search engine lists Moon features only within 60° of the equator; the south-pole sites are under Featured sites." (spec §9). Also lists Mars's featured sites the engine names elsewhere (Arcadia, Meridiani, Elysium) beside the IAU feature. States `targets-polar`, `targets-nomatch`. Tested |
| 2, 12, 14, 18 | Combobox state survived a re-render and a new text: Enter on an empty field on another view opened the last pick; Enter inside the 150 ms debounce opened the old first option; the list stayed open (aria-expanded) after focus left; no line while the first query loads | Fixed in `ui/target-search.ts`. `targetSearchHTML` drops the last field's options, pending ask and late answers (seq). Each input empties the options (`opts`: routes of the options for the current text) and the active one, so arrows and Enter wait for the new answer; the old rows stay visible (no flicker) and a click on one opens what it shows (`data-to`). Enter needs the list shown and an active option. `focusout` on the field closes the list (an option press keeps the focus); ArrowDown on a closed list with text asks again. "Searching named features…" while the first query runs (the lazy chunk). Probed: 'jez' → 'jezero mons' + Enter in the debounce stays on #/mars, arrows inert, the answer lands with Jezero Mons active; Tab closes (aria-expanded false); Enter on the fresh Moon field stays. State `targets-fresh` (asserts the field closed) |
| 3, 7, 16 | Purposes and countries asked only on a route change: `?mock=fail` showed "Loading purposes…" for good; after warm-up Country stayed "(list not loaded)" | Fixed in `ui/panel.ts needLists()`: asked on render and at the end of every `fill()` (so Try again and the warming retry ask too) while a list is missing; the form redraws when the ask settles. Once an ask has settled without them: the purpose in use ("Rover mobility", the only one possible without the list) and "The other purposes couldn’t be loaded from the search engine."; Country "All countries (list not loaded)"; while loading "Loading purposes…" / "All countries (loading the list…)". Probed: `?mock=warming` Country enabled with its 7 countries after the warm-up (42 s); `edge-fail` shows the failure copy |
| 4, 17 | Only half the surface filter: barren never sent; education kept a stale `surface:'any'` (counted on, unclearable, a cache fork); "Searches barren land only." with vegetated land included | Fixed: the box offers the other side of the purpose's own surface ("Include vegetated land" → `any` for the barren purposes, "Barren land only" → `barren` for education); a purpose change drops a surface filter equal to the new purpose's own; the barren sentence only when no `any` filter. Mock: the filter overrides the purpose's surface (`purposes.json`). Probed both ways. Tests: mock (education + barren has no rugged cells), contract (`surface: 'barren'` validates) |
| 5 | Option rows at 2 dp | Fixed: 4 dp (`targets-jez`) |
| 6 | unknown_target offered only the coordinates | Fixed: "…Find it under its IAU name, or search its coordinates instead." with "Find it by its IAU name" (to the body view, focus in its search field) beside "Search by coordinates". State `targets-unknown` |
| 8, 15 | Any purpose or filter change on a compare whose pin left the five asked for 20 (12 s on a pin target) | Fixed: the 20 are asked only under the query the compare was opened with (`openedQ`, set when the route's pair changes). Under another, five, and "The compared Earth pin isn’t among this search’s results." over them. Probed (Arcadia's Hanksville cell, Australia): five cards, no Loading more, at +7 s and +15 s. State `compare-away`; `compare-area` now five pins |
| 9 | On no_dem sites (the Artemis regions) the form was live and changed nothing | Fixed: the form is hidden while the search answers no_dem (and unknown_target, Deviations); `fill()` hides it when the answer lands. `results-moon-malapert` asserts it hidden |
| 10 | An empty filtered search said "No Earth sites match this search." | Fixed: "No Earth sites match these filters." and Clear filters (all filters off, searched again). State `ask-empty` (Algeria + Artemis Accords partners) |
| 11 | No captures of the autocomplete's failure copy, the empty filtered search, a named target's head; the lede called any feature plains; nothing proved polar lighting disabled | Fixed: states `targets-fail`, `targets-warming`, `ask-empty`, `targets-named-top`. A named target's lede is "Named feature. Centre point from the IAU gazetteer." (`data/pins.ts`: its IAU type comes with its search, in the doubles' target note; the map's roughness no longer names a landform). Harness step `{ expect: sel }`; `ask-hadley` asserts `#purpose option[value="polar_lighting_geometry"]:disabled` |
| 13 | Search this area gave nothing to see; popped in; 145 px of a 195 px phone globe; pins over the phone Earth caption | Fixed but the outline: a coral border and icon while an area is set (`data-on`), a 0.3 s fade-in with the toggle, the panel scrolls to the Area row (on a phone the sheet), the magnifier alone on phones (36 px, the name kept for screen readers). No area outline on the globe, and the caption layering stays (Deviations) |
| 19 | Area "Clear" out of context; a named target offered "move the pin", dropping its name | Fixed: `aria-label="Clear area"`; a named target's map doesn't move it (no "Click to move the pin."), its field says "Edit and press Enter to drop a pin there instead." |

**Tests** (208, was 206): `pins.test.ts` (`featuredByName`: the south-pole sites by name, not the IAU-named ones, nothing for Shackleton or blank; a named target's kind and note), `mock.test.ts` (barren overrides education), `contracts.test.ts` (education with `surface: 'barren'`).

**Harness.** Step `{ expect: sel }` (fails the state unless sel matches). New states: `targets-named-top`, `targets-fresh`, `targets-polar`, `targets-nomatch`, `targets-fail`, `targets-warming`, `targets-unknown`, `compare-away`, `ask-empty`.

**Verification** (2026-10-20). typecheck, 208 tests and build green; app chunk 54 KB gzip, target list chunk 74 KB unchanged. Full capture, 79 states × 2 viewports (158/158), no console errors. Looked at the build captures of every new state at both sizes, `results-moon-malapert`, `engine-moon-pin-85S` (form hidden), `edge-fail`, `ask-education`, `compare-area` (five pins, the coral button; phone: the magnifier, the sheet at the Area row), `targets-jez`, and the compare sheets of `site-jezero` and phone `compare-globe`; spot-checked the rest. Throwaway Playwright probe (`?capture` on `vite`): the combobox sequences, the warming lists, the fail copy, Arcadia + Australia, the surface flips, Find it by its IAU name (lands on #/mars with the focus in the search field).

**Known limits.** The message line keeps the count after a blur closes the list (ArrowDown reopens it). Featured matches don't show when the engine call fails. The on-state of Search this area doesn't say which area (the panel's Area row does).

### Results rework 3/4 review fixes, round 2 (done)

Four findings from the independent review (2026-10-20), all major; 1–3 are one cause (the mock's ranking), all fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 3 | The mock's doubles changed with the purpose, even between barren ones (seed and example match keyed on purpose and filters): Jezero's Drilling / ISRU kept 1 of 5 rover mobility doubles, against the panel's own copy and the engine (`api.py cache_key`, `engine.py search`: the purpose picks only the surface) | Fixed in `data/mock.ts ranked()`: one ranking per target and surface (`sameRanking`, `surfaceOf`: the filter's surface, else the purpose's), seeded as the surface's default query (every unfiltered answer but two keeps its order and scores, Decisions 45); an example heads its target and surface's ranking; the request's purpose echoed in `query` and every result. Source and timing from the request (the example's timing when its source matches). Tests: all six barren purposes give rover mobility's results but `purpose` (Jezero's example, Gale, the Arcadia point); surface `any` on rover mobility is education's. Merge note |
| 2, 3 | A filter reordered and rescored the cells: after Search this area Jezero's first double (34.68° N, 105.08° W, inside the area) dropped out ("The compared Earth pin isn’t among this search’s results."); Exclude polar replaced 4 of 5 though none is polar; Artemis Accords partners dropped the US cell | Fixed: the cells are scored in ranking order whether the mask keeps them or not, then the filters (country, partners, polar, area) mask that one ranking, ranks renumbered. A filtered answer is the unfiltered one with cells taken out, each keeping its scores. The judge's floor now keeps falling past rank 20 (`.1/(i+1)`, unchanged above it) and property scores stop at 0, since a sparse mask reaches deep. Tests: exclude polar, partners, the compare-area bbox and Australia + polar are the unfiltered order with the same scores; the bbox keeps Jezero's example cell first, as in the fixture |
| 4 | On compare a purpose or filter change dropped the double's detail while the search ran ('wait') and laid the panel out again: the focused control went from y 419 to −657 | Fixed in `ui/panel.ts fill()`: while a new query's search runs (busy, no answer yet) the compare block keeps what it shows; its key is the query with the detail (`cmpOf`), so the answer redraws it once; the doubles box keeps its height while busy (a panel scrolled to its end would clamp up); and the focused control in `[data-ask]` is held where it was (`panel.scrollTop` compensated after the redraws). Probed (Playwright, real time, both sizes): Exclude polar and Drilling / ISRU on `#/mars/jezero/compare/@34.6750,-105.0750` with the panel at its end, Australia there (the pin leaves: detail dropped), Exclude polar on the rank-13 Haughton cell, the site view, Arcadia's 6 s pin search: the control's y unchanged at 30 ms, 0.3 s, 1 s and 7 s, no console errors. New states `ask-purpose-same`, `compare-filter-keep` |

**Tests** (210, was 208): `mock.test.ts` (one ranking per target and surface; filters only take cells out). The
Hanksville/Pilbara test now asks Rima Hadley for 12 (they follow its example's five).

**Harness.** New refNA states `ask-purpose-same` (Jezero, Drilling / ISRU: rover mobility's five) and
`compare-filter-keep` (asserts the toggle focused, the detail kept and the pin selected among the results).

**Verification** (2026-10-20). typecheck, 210 tests and build green. A dump of 22 unfiltered searches (11 targets ×
rover mobility and education, k 20) before and after the change: identical but Rima Hadley's and the coordinates
example point's barren answers (Decisions 45). Full capture, 81 states × 2 viewports (162/162), no console errors.
Looked at both sizes of `compare-area-filters` (no "isn’t among" line, the US pin first and selected),
`compare-filter-keep`, `ask-purpose-same`, `results-rima-hadley` and its detail (the example's US cells), and at
`compare-away` (Australia: the example's two Australian cells first, their scores as in the fixture),
`results-jezero-low`, `ask-hadley-results`; every other state shows the same mock answers as before by construction.

**Known limits.** A filtered cell keeps its unfiltered scores where the engine re-ranks some within the mask
(Deviations). The doubles box keeps its old height, below "Searching Earth…", while a new query's search runs with the
focus in the form.

### Results rework 4/4: states by source (Must 4, part 4, done)

**Where.** `ui/results.ts` (the state templates: `skeleton`, `progress`, `reading`, `warming`, `failure`, `noData`,
`noAnalog`, `matchLine`), `ui/panel.ts` (`doublesHTML` picks the state; `bars` fills the progress bars),
`views/site.ts` (the pin hold, `holding()`), `scene/input.ts` (the globe usable while held), `ui/detection.ts`
(`scanLine`: the frame's Matching readout and bar; the dot hides when the site turns away), `ui/chrome.ts` (the status
hint while held), `ui/terrain-ui.ts` (the no-elevation terrain note), `motion.ts` `fillBar`. Seam (`data/client.ts`):
`Doubles.t0` (when asked) and `Doubles.up` (when the engine started, from `/health`'s `uptime_s` on warming_up); one
search by coordinates at a time (an `AbortController` per search; `Engine.search(req, signal)`, in `http.ts` combined
with the 30 s timeout, in `mock.ts` racing the latency); `ErrorCode` gains the client's `aborted`.

**States by source** (spec §3.5's latency table, chosen from what the request is, since `source` comes only with the
answer). A search by name without filters (`cache`, 2–25 ms) shows nothing new: five skeleton cards are drawn but fade
in only after 0.4 s (CSS delay), so the usual answer lands with no flash and a slow one still shows them
(`?mock=slow`, a cold engine cache). With filters (`live`, ~0.3 s): the same skeleton at once (`edge-skeleton`). By
coordinates (`remote`, 5–10 s; pins and the featured sites searched by coordinates, Arcadia, Meridiani, Elysium): a
state box "Reading Mars terrain…" with a coral bar and "A search by coordinates takes 5 to 10 seconds while the search
engine reads the elevation around this point. A new pin replaces this search." The bar fills on the app clock from when
the search was asked to 92% at 10 s (the spec's upper bound) and holds there (the engine reports no progress), so a
re-render resumes it and `?capture` seeks drive it. Skeleton cards pulse (1.6 s, not under reduced motion) and are
`aria-hidden` with an sr-only "Searching Earth…"; the box stays `aria-busy` until the answer.

**Pin progress on the globe** (plan Verification, Engine states: "detection frame holds with progress while the globe
stays usable"). From the body view (a surface click, Go to coordinates, a featured site searched by coordinates), the
globe turns to the site as before; if its search by coordinates is still running when the turn ends, the detection
frame holds on the globe instead of diving: the grade, the dot over the site, "Site acquired", and the Matching readout
"Reading Mars terrain" with the same bar in the body's grade colour. Meanwhile the globe takes drags (the dot follows,
hidden when the site turns to the far side), wheel zoom and clicks: a new pin replaces the held one (its route, frame
and search; the old search is aborted). The status bar says "Drag to rotate. Click the surface to search another point
instead." When the search answers (results, no_dem, an error, also a new purpose or filter's search asked meanwhile),
the readout says so ("Earth sites", "No close analog", "No elevation data", "Engine starting up", "Search failed"), the
globe turns back to the site if it was moved, and the dive and terrain swap run as before. Escape during the hold goes
back to the body view. A search that answers within the turn (named, cached, a 20 ms no_dem) dives at once as before.
Deep links and site-to-site moves (coordinate edit, map click) swap to terrain at once; the panel shows the progress
(and, since round 2 of the review fixes, the status bar: Decisions 54).

**One pin search at a time** (spec §8: remote searches are network-bound; queue or cancel). A new search by
coordinates aborts the one still running and forgets it (asked again if that site is shown again); searches by name
are never aborted. A late answer can't overwrite a newer view: an aborted one rejects at once as `aborted` (never shown),
and every redraw was already keyed on the shown site and query (`fill()`'s guard). Leaving a pin for another view
doesn't abort its search: it lands in the cache.

**Warming up** (spec §1, §6). The doubles box shows "Starting up…" with a bar from the engine's start (`/health`
`uptime_s`, asked after each warming_up) to 40 s, and "The search engine loads its index of Earth’s land when it
starts, which takes 30 to 40 seconds. The doubles follow as soon as it is ready."; the search is asked again every 3 s
as before, and the cards replace it when it is ready (`engine-warming-done`, 40 s). The frame's readout says "Engine
starting up"; the named-feature search keeps its own copy.

**Errors** (spec §6, one component keyed on the code): a state box with a head, a line and its buttons: no answer
("The search engine didn’t answer" / "It may be offline or restarting.", also any unknown code), start_failed,
bad_response, invalid_request and unknown_purpose (a bug on our side, logged), unknown_target (its two ways on, as
before); Try again on all but unknown_target. A failed Show more puts the same box under the kept cards.

**No elevation data** (plan Gaps 2): the same box, "No elevation data for this point" (or site) and "The search engine
reads Moon terrain only within 60° of the equator, so it can’t score Earth sites against it. The terrain shown here is
illustrative." (the Artemis sites: "…these established analog sites", their rows below as before). The terrain overlay's
note says "No elevation data here: the search engine reads Moon terrain only within 60° of the equator. Illustrative
terrain." (viewports 520 px and wider, like every terrain note); the frame says "No elevation data".

**No close analog** (spec §5.3): the lede as before; under filters, "Filters narrow where on Earth the search looks.
Without them it may find closer terrain." and Clear filters.

**Tests** (218, was 210): `client.test.ts` (one search by coordinates at a time: the older aborted, forgotten, never
landing, asked again when shown; a search by name never aborted; a finished one not; warming notes the engine's start),
`mock.test.ts` (an aborted search rejects at once), `http.test.ts` (an abort is `aborted`, not `network`),
`results.test.ts` (skeleton, progress bars from t0, warming from the uptime, failures by code and unknown codes,
no elevation data, the frame's Matching line, `noAnalog`).

**Harness.** Step `{ tap: sel, fx, fy }` (a point off the centre of sel's box). New refNA states: `edge-skeleton`,
`engine-warming-done`, `engine-mars-pin-done`, `engine-pin-second`; `engine-warming` and `engine-mars-pin-6s` now share
a page with their after states; checks of the edge and engine states rewritten.

**Verification** (2026-10-20). typecheck, 218 tests and build green; app chunk 55 KB gzip (was 54). Full capture, 85
states × 2 viewports (170/170), no console errors. Mean absolute difference against the reference, desktop: states this
item doesn't reach at their logged values (title 0.22, system, info and Beyond 0.00, intro and sunrise 0.00–0.08,
footer 0.04–0.18, body-mars 3.02, body-mars-zoomed 5.76, body-moon 2.19, coord-* 2.46–5.62, site-jezero 0.23,
site-haughton 0.16, compare-jezero-salda 5.14, compare-globe 2.79, results-jezero 8.12); changed on purpose:
`dive-0.8s` 4.12 → 43.64 (the held frame on the globe, Deviations), site-moon-malapert 0.13 → 0.28 and site-moon-south
6.48 → 6.63 (the terrain's no-elevation note), results-moon-malapert 9.39 → 9.07 (the no-elevation box); the edge and
engine states compare against unscrolled reference views. Phone: the same states move the same way; the rest at their
logged values. Looked at the build captures of every new and changed state at desktop (edge-slow and edge-skeleton:
five skeleton cards; edge-fail: the error box with Try again; engine-warming: "Starting up…" and its bar;
engine-warming-done: the cards; engine-moon-pin-85S: frame "No elevation data", the panel's box; engine-mars-pin-6s:
the frame held on the globe, "Reading Mars terrain" with its bar, the panel's box, the status hint; engine-mars-pin-done:
dived, five cards; engine-pin-second: held on the second pin, zoomed out; dive-0.8s; site-moon-malapert's terrain
note; results-moon-malapert) and at the phone (the same plus targets-unknown and edge-empty), and spot-checked the rest.
Throwaway Playwright probes on `vite` in real time: a surface click holds the frame ("Reading Mars terrain", the
status hint), a drag turns the globe without leaving the pin, wheel zooms, a second click moves the hold to a new pin
and its answer lands 6 s later with the dive (the first never lands); Escape during a hold goes back to the body view
and the abandoned answer changes nothing; a filter changed during a hold keeps it until the new search answers; a
named site from the cache never shows the skeleton, under `?mock=slow` it fades in at 0.4 s; no console errors.

**Known limits.** The bars are time-based (no progress from the engine). An answer landing mid-drag starts the dive
from where the drag leaves the globe. ~~Nothing shows the engine warming up until a search meets it~~ (fixed in the
review fixes: `/health` polled from boot).

### Results rework 4/4 review fixes (done)

Fourteen findings from the independent review (2026-10-20), three major (1/10: an Earth site dive searched Earth;
11: a fling undid the dive's turn). All fixed; none skipped. Overlaps: 1/10, 3/5, 7/14.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 10 | `playSite` asked the search for every body: an established Earth site from the Earth globe searched `target.body: 'earth'` (off the contract; 6 s hold in the mock, 422 + console.error from the engine, a running pin aborted, "Click the surface…" on an unpickable globe) | Fixed in `views/site.ts`: only `PICKABLE` bodies consult the search; Earth plunges and shows the frame ("Rehearses N target sites") as before. State `dive-earth` (`#/earth` → Haughton, 1.8 s: diving, status "Drag to orbit…") |
| 2 | The terrain's no-elevation note was set only at the terrain swap: a no_dem landing after it (slow engine, deep link) left "Illustrative terrain. DEM tiles replace it…" | Fixed in `ui/panel.ts fill()`: on the site view with terrain shown, `buildTUI()` runs with every redraw. State `edge-slow-nodem` (`#/moon/malapert?mock=slow`, 11 s: "No elevation data here…") |
| 3, 5 | A slow search by name dived at once (`\|\| s.iau`): "Loading holds the frame" was only the late skeleton, below the fold on desktop; the decision unlogged | Fixed: the hold is for any search still running when the turn ends (Decisions 52); a cached or filtered name answers within the turn and dives at once as before. The frame's Matching says "Searching Earth" (no bar: a name has no expected duration). State `edge-slow-dive` (`#/mars` → Jezero under `?mock=slow`: held, "Searching Earth") |
| 4 | `unsupported_purpose` (spec §6: route to the lighting module) fell through to "didn't answer" with a Try again that repeats the refusal | Fixed: "Not a purpose this search serves" / "Polar lighting geometry belongs to the lighting module, not the terrain search. Pick another purpose above.", no Try again, logged to the console like the other refusals. Tested |
| 6 | Phone, held frame: POSITION / MATCHING coral on the orange limb, barely legible | Fixed in `responsive.css` (below 760 px): a scrim behind the scan row, the grade's shadow colour (`--sa`) fading up to transparent; it fades with the frame. Looked at `engine-mars-pin-6s`, `engine-pin-second`, `dive-0.8s`, `edge-slow-dive` (phone, upscaled crop) |
| 7, 14 | No capture of no close analog under a filter, nor of the 85° S terrain note (the 85S state is mid-frame, where the note hides) | Fixed: `edge-empty-filtered` (`?mock=empty`, Australia; asserts `.lede ~ .actions [data-filters-clear]`), `engine-moon-pin-85S-terrain` (5 s, the note on desktop) |
| 8 | Warming showed only where a search met it: a cold-engine deep link showed nothing above the fold for 30–40 s | Fixed: `data/client.ts pollHealth()` from boot (`app.ts start`), every 3 s while `/health` says warming_up (down or failed is not warming: the search's states say so); `ui/chrome.ts` puts "Search engine starting up…" (a pulsing coral dot) in the status bar's left slot on the body, site and compare views; on a phone, where the status bar is hidden, that one line shows above the sheet. State `engine-warming-note` (2.5 s, unscrolled); gone in `engine-warming-done`. Tested |
| 9 | Skeleton cards ~130 px against ~190 px real cards: the list jumped when results landed | Fixed: three summary lines and a chips row of pills: 194 px against 189 px (measured on `edge-slow` / `edge-empty-filtered`) |
| 11 | The dive that starts when a held search answers isn't a route change, so a coasting fling (or one released mid-dive) killed `faceSite`'s turn (Deviation 24 again) | Fixed in `scene/input.ts`: inertia runs only where a drag turns the globe (body view, a held frame, compare); after the hold ends the view is `site`, so it stops |
| 12 | Each warming retry recomputed `up`, so the box's markup changed and was re-announced every 3 s, and each fill stacked a 40 s tween | Fixed: a retry after warming_up carries `up` over (`??=`), so the markup is identical and `setHTML` skips it; `fillBar` tweens with `overwrite: true`. Tested |
| 13 | A purpose or filter change during a hold: the frame's bar stayed on the old search's t0 | Fixed: `land()` calls `scanLine` when it moves on to the newer busy search |

**Tests** (219, was 218): `client.test.ts` (`pollHealth`: warming, every 3 s, stops when ready; error and down are not
warming; a warming retry keeps `up`), `results.test.ts` (unsupported_purpose copy, "Searching Earth").

**Harness.** New refNA states: `dive-earth`, `edge-slow-dive`, `edge-slow-nodem`, `edge-empty-filtered`,
`engine-warming-note` (now the first of the `warming` seq), `engine-moon-pin-85S-terrain` (seq `nodem` with
`engine-moon-pin-85S`).

**Verification** (2026-10-20). typecheck, 219 tests and build green. Full capture, 91 states × 2 viewports (182/182),
no console errors. Looked at both sizes of every new state, `engine-mars-pin-6s`, `engine-pin-second`, `engine-warming`,
`engine-warming-done` (no note), `edge-slow` (taller skeleton), and spot-checked `targets-named` (a named dive from the
body view, unchanged), `results-loading-more`, `site-*`.

**Known limits.** ~~On a phone the warming line above the sheet covers the last line of the terrain legend for the
warm-up's 30–40 s.~~ (fixed in round 2: the legend moves up while the line shows) A named search held by a slow engine shows no bar (its duration is unknown).

### Results rework 4/4 review fixes, round 2 (done)

One finding from the independent review (2026-10-20), major: fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | A pin's 5–10 s search showed on screen only from the body view (the held frame). A pin moved on the site view (map click, coordinate edit) or opened by deep link swaps to terrain at once and the panel goes back to its top: the "Reading Mars terrain…" box sits below the map, imagery, purpose and filters (out of view at 1280 × 800, far down the phone sheet), and the status bar said "Pinned site, …" | Fixed in `ui/chrome.ts updateStatus`: on the site view with the terrain shown, while the site's search by coordinates has no answer, the status bar's left slot says "Reading Mars terrain…" (or Moon) with the warming line's pulsing coral dot; on a phone that line shows above the sheet (the same `.eng` rule as warming). Not while the frame holds on the globe: its Matching readout says it there, and on a phone the line would sit under the scan row. `views/site.ts` passes `chrome` to `setTerrain` so the line comes in with the terrain (else the 1 s tick); it goes on the tick after the answer. The warming line still wins. `responsive.css`: below 760 px the terrain legend moves up by the status height while that line shows, so it no longer covers the legend's last line (also the warming known limit of round 1). Decisions 54. State `engine-pin-moved` (deep link to a pin, a map click at 7 s, 3 s later, panel at its top; `expect: '#st-l .eng'`) |

**Tests** (219, unchanged): the new branch is DOM wiring over `doublesOf`; the capture state asserts the line
(`expect`) and shows it at both sizes.

**Verification** (2026-10-20). typecheck, 219 tests and build green. Full capture, 92 states × 2 viewports (184/184),
no console errors. Looked at `engine-pin-moved` (desktop: status bar "Reading Mars terrain…" with its dot under the
terrain, crumb "Pin 18.59° N, 77.86° E", panel at its top; phone: the line above the sheet, the legend clear of it),
`engine-mars-pin-6s` (desktop: the held frame's readout, status bar "Pinned site, …" as before; phone: no line under
the scan row), `engine-mars-pin-done` (no line), `engine-pin-second`, `engine-warming-note` (phone: the legend now clear
of the warming line), `engine-moon-pin-85S-terrain`, and spot-checked `site-jezero` (phone compare sheet, unchanged).

### Real data on the demo path (Must 5, done)

**Script.** `npm run fetch:real` (`scripts/fetch-real-data.mjs`, `-- --only=globes|sites`) fetches from the official
sources and writes only web assets; downloads and finished patches are cached in `.cache/real-data/` (gitignored, ~850 MB
after a full run), so a rerun is offline. New dev dependencies: `geotiff` 3.0.5 (COG windows and overviews, the
GeoTIFF headers) and `sharp` 0.35.5 (resize, JPEG). It reads the USGS global DEMs (uncompressed strip TIFFs) by ranged
requests of just the columns needed (checked: int16, one row per strip, rows back to back), PDS raw images by whole
blocks of rows (the LROC archive throttles many small requests: HTTP 429 waits it out), COGs through `geotiff`, GIBS and
NOAA by one export each. Every patch and crop is resampled into the app's site projection (`coords.ts` `localToLL`,
imported by node from the `.ts` file: Node 26 strips the types), averaging up to 4 × 4 source points per sample like
the engine's averaging warp. Two self-checks fail the run on a wrong polar stereographic convention: the LOLA polar DEM
against LDEM_16 at 77–83° S (rms 53 m) and the LROC WAC polar mosaic against the global one at 70–76° S (r 0.94). What
it fetches for lives in `src/data/real-sites.ts` (no imports, so node can load it); `real-sites.test.ts` fails when
it drifts from `sites.ts`, `bodies.ts` or the mock's cells. Sources, licences and credit lines: `docs/credits.md`.

**Globes** (`public/textures/`, `manifest.json` updated in place; `extract:textures` now leaves them alone and only
extracts Venus and Mercury for Beyond). 4.9 MB of JPEG, was 3.2 MB.

| Map | Was | Now |
| --- | --- | --- |
| `mars` | community 2K | Viking MDIM 2.1 colourised mosaic (USGS COG overview 5760 × 2880) → 4096 × 2048, colours matched per channel to the prototype map's mean and spread |
| `mars_bump` | 2048, unknown | MOLA MEGDR 128/64 merge (COG overview), area-averaged to 2048 × 1024, −8,500 to 21,500 m (the old map's span, so `bumpK` 5.5 stays) |
| `moon` | 4K, blurred poles | LROC WAC global morphologic mosaic v1.3, 16 px/° → 4096 × 2048, stretched to the old map's brightness (mean 150, spread 29) and tint |
| `moon_bump` | 1440 × 720 | LOLA LDEM_16 → 2048 × 1024, −9,500 to 11,000 m; `bumpK` 4.5 → 3.9 for the same relief (the old map spanned ~33.5 km over 1440 px) |
| `earth_day` | Blue Marble 4K | Blue Marble Next Generation with shaded relief and bathymetry, NASA GIBS, 4096 × 2048 (the plain composite's near-black sea darkened the globe against the reference) |
| `earth_night` | 2K | Black Marble 2016, NASA GIBS, 2048 × 1024 |
| `earth_spec` | 1K | MODIS water mask (MOD44W), NASA GIBS, 1024 × 512 |
| `earth_bump` | 2K | ETOPO1 ice surface (NOAA NCEI export), 2048 × 1024, 0 to 8,800 m |

The bump maps now say what their grey levels mean: `BODIES[b].elev` (metres for 0 and 1), which pin terrain reads
(`pins.ts`: `base = lo + h0 · span`, was a per-body guess).

**Site elevation** (`public/sites/patches.bin`, 2.9 MB, 63 patches; `manifest.json`). 16-bit heights, each patch
scaled to its own range (a 1.5 km relief steps by 2 cm), n × n samples edge to edge in the site projection, as
`heights()` lays its own. Patches: each featured site on the demo path over its extent (Jezero, Gale: MOLA–HRSC 200 m;
Hadley–Apennine: SLDEM2015 59 m; Malapert, Haworth, Nobile, de Gerlache: LOLA LDEM_75S_240M) and over its compare window
(18.8 km at 94 samples, the IAU centre for named targets); the engine's coordinates example (a Mars pin by Gale); the 14
established Earth sites over their extent and window and every Earth cell the mock hands out (Copernicus GLO-30, the
engine's own Earth source; sea tiles count as 0 m); and the lunar south polar cap to 80° S at 1 km (606 km, 607²) for
pins there. `terrain/dem.ts` loads them (`loadSites`, validated: bodies, finite numbers, every patch inside the file,
crop files under `crops/`; all or none) and `patchFor(body, centre, win, N)` picks the finest patch that holds the
whole window and is at most 4 times coarser than its samples; `heights()` samples it (`demHeights`) and only falls back
to the archetypes where none does. So the site view, its topo map, the compare's stand-in windows and the mock's
elevation windows (and so its hillshades and twins) are real wherever a patch is; `Terrain.src` names the source. A
lake site over real elevation (Lake Salda) floods at the height the DEM flattened the water to.

**Loading.** The site data loads beside the textures but holds the start only under `?capture`; landing later it goes
through `onAsset('sites')` (every terrain dropped and rebuilt, maps redrawn, like a late texture), and the mock's
elevation answers wait for it while it loads (`sitesPending`), so no compare window keeps the stand-in.

**Orbital crops** (`public/sites/crops/`, 14 JPEGs, 240 px, 5–17 KB): context (12 × extent) and regional (3.5 ×) for
the seven featured sites: Mars from the MDIM colour COG at the overview nearest the crop's scale (same colour match),
Hadley from the LROC WAC 64 px/° mosaic, the polar regions from the LROC WAC south polar 64 px/° mosaic (same stretch).
`drawCrop` draws the file when there is one (async; the footprint on top) and otherwise cuts from the globe as before
(every other site, Earth's included); a file that fails to load falls back to the cut.

**Credits in the app.** Site panel: a line under the crops, "Terrain: <model> · <owners>. Images: <mosaic> · <owners>."
(the globe's source when the crop is cut from it). Terrain view: the note names the elevation model ("Terrain:
MOLA–HRSC blended DEM, 200 m."; the south pole: "No elevation data here for the search engine… Terrain: LOLA south
polar DEM, 240 m."), "Illustrative terrain." only where it still is. The no-data box says the terrain shown is the LOLA
polar DEM. Compare's "Terrain is a stand-in…" line shows only when a side has no real data. Info sheet: the Data
column lists the real sources, with what is still sample data; the title footer's Data line says whose data it is.

**Tests** (229, was 219): `terrain/dem.test.ts` (loading to within a 16-bit step, crops and credits, a crop file
outside `crops/` dropped, the finest holding patch, none past an edge or for samples 4 times finer, sampling a plane
back in another window's projection, a real lake's level, a short `patches.bin` loading nothing, an HTTP error),
`data/real-sites.test.ts` (the script's sites, cells, radii and bump ranges equal the app's).

**Verification** (2026-10-20). typecheck, 229 tests (was 219) and build green; production JS unchanged but for
`dem.ts` (+0.6 KB gzip). Full capture, 96 states × 2 viewports (192/192), no console errors. New states:
`site-gale`, `site-hadley` (reference baselines taken: the prototype's procedural terrain), `site-jezero-media`,
`site-malapert-media` (refNA: crops and credit lines). Mean absolute difference against the reference, desktop: intro,
reduced motion 0.00–0.34; sunrise 0.21–1.57, title 0.64, system 0.50, footer 0.39–0.59, info-closed 0.50 (the new
Earth, Mars and Moon maps, the footer art sampling them); info-sheet 1.60 (Data column); body-mars 3.73, body-mars-zoomed
8.51, body-moon 5.11 (new maps); site-jezero 10.42, site-gale 7.79, site-hadley 9.56, site-haughton 12.43,
site-moon-malapert 6.92, site-moon-south 8.09 (real terrain, maps and crops); compare-jezero-salda 6.21, compare-globe
3.71. Phone alike. All intended (Deviations). Looked at the build and compare sheets of every site, compare and body
state at both sizes, system, title, info-sheet, footer-step2, dive-0.8s and compare-twins: Jezero's crater and western
inlet, Gale with Aeolis Mons, Rima Hadley winding past the Apennine front, Malapert's massif, the south-pole pin without
banding, Haughton's crater, Lake Salda flooded at its level, the twins from real windows; no layout moved. First run of
the Moon's map showed the maria weak against the prototype (Decisions 57); the first Earth map (the plain BMNG
composite) darkened the globe's sea against the reference, replaced by the relief-and-bathymetry composite (title 1.94
→ 0.64, system 0.73 → 0.50).

**Known limits.** 2.9 MB of patches and 4.9 MB of textures load at start (outside `?capture` the patches don't hold it);
per-body loading belongs to Progressive textures and the performance item (done there: the start waits on the route's
worlds only, the rest load after it; Performance budget review fixes). JPEG, not KTX2 (Deviations). ~~Earth's crops
are still cut from the 4K globe (Meteor Crater's regional crop is ~14 km over ~6 globe pixels).~~ (fixed in the review
fixes: Landsat WELD crops) A pin on Mars or the
Moon away from the patches keeps the bump-map terrain with its illustrative detail. Patches past the demo path (Arcadia,
Utopia, Meridiani, Elysium, Taurus–Littrow) are not made; add them to `real-sites.ts` and rerun.

### Real data on the demo path review fixes (done)

Twenty-one findings from the independent review (2026-10-20), six major (1: site data landing late left the panel and
legend stale; 2/8/17: no Earth crops; 7/16: the Moon's maria lost). All fixed; none skipped. Overlaps: 1/18, 2/8/17,
3 with 7/16, 4/9, 10/20, 6/20.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 18 | Site data landing after start (any normal load: outside `?capture` the 2.9 MB patches don't hold it) rebuilt the terrain and maps but not the legend, the note ("Illustrative terrain."), the panel's crops (rendered without the crop URL), its credit lines, the polar no-data box or compare's stand-in and twins lines | Fixed in `app.ts onAsset`: the terrain overlay is rebuilt with the scenes (also right for a late texture: a pin's legend), and for `sites` the panel re-renders in place (`panel.ts refreshPanel`: the same route keeps its scroll and, through `swap`, its focus; every write of the panel now goes through `setHTML`, so its cache stays true). Not by holding the start: the patches would add their download to every first paint (Decisions 65). Checked outside `?capture` with `patches.bin` held 9 s (Playwright: Jezero, Malapert, a Jezero compare): before, "Illustrative terrain." and no credit line; after, the DEM's legend and note, the crop URLs, "Terrain: … Images: …", the no-data box naming the LOLA DEM, compare's stand-in line gone and the GLO-30 notice under its table. No capture can show it (`?capture` holds the start on the site data) |
| 2, 8, 17 | Earth crops were still cut from the 4K globe (Haughton's regional crop a white blur, Meteor Crater's ~6 globe pixels) | Fixed: the 14 established Earth sites get context and regional crops (28 files, 2–17 KB) from NASA GIBS: Landsat WELD's 1999 true-colour composite (30 m), resampled into the site projection like the Mars and Moon crops (`gibsBox`: one WMS export over the crop's lat/lon box, about a pixel per sample). Specks of gap filled from Blue Marble Next Generation at 500 m; a crop with more gap (open sea at Atacama and Lanzarote; Svalbard and the Dry Valleys, outside WELD) is Blue Marble's. Credit keys `weld`, `weldBmng`, `bmng500`; the panel's image credit names each crop's source once. 2000's composite has dark scene stripes over Atacama and Holuhraun; 1999's is clean. New state `site-haughton-media`. Decisions 63 |
| 3 | The plan's polar cap for the Moon globe was neither shipped nor logged; `moon.jpg` has straight seams at ±90° longitude from ~60° S to the pole | Logged (Deviations): the cap is the Rendering "Poles" row (Must 8: blend a polar stereographic cap into the planet shader); the LROC WAC south polar mosaic it needs is already fetched for the crops. The seams are in the source: the WAC polar mosaic shows the same quadrant seams (looked at it), so resampling it into the map wouldn't remove them |
| 4, 9 | The 1 km south polar cap shared the 240 m credit key, so pins on it were labelled "LOLA south polar DEM, 240 m"; even the `site-moon-south` pin, 7 km from Malapert, fell back to it (the featured patches covered exactly their extent), showing bilinear facets in the 640 px map | Fixed: the cap has its own key `lolaCap` ("LOLA south polar DEM, resampled to 1 km"); the four south-pole sites' patches reach one compare window (18.8 km) past their extent on every side, at the site's own spacing and on its grid (the site view samples them 1:1), so a pin within ~19 km of a centre stays at 240 m. `site-moon-south` now reads Malapert's patch. +0.5 MB in `patches.bin` (3.4 MB). Decisions 64 |
| 5 | The info sheet claimed real imagery and elevation "at the featured sites", five of which have none | Fixed: "Real imagery and elevation at Jezero, Gale, Hadley–Apennine, the south-pole regions and the established Earth sites, and real elevation at every Earth double; elsewhere the terrain is illustrative." |
| 6, 20 | The Copernicus GLO-30 notice showed only in the Earth site panel, without "all rights reserved"; compare and twins named GLO-30 without its owners; the polar crops were credited to the global WAC mosaic | Fixed: the notice (with "all rights reserved") in the credit key and on its own line in the info sheet's Data column; compare's table is followed by "Terrain: <model> · <owners>." for both windows (`terrHTML`), so the notice shows wherever GLO-30 windows do, twins included (same panel). The polar crops credit `wacPole` ("LROC WAC south polar mosaic"). The 3D note keeps the model's name only (30 ch wide; Deviations) |
| 7, 16 | The Moon globe had nearly lost its maria (Imbrium, Serenitatis, Procellarum ~125–130 against highlands ~152; the prototype's 67–95 against 150–186): the LROC WAC morphologic mosaic shows relief, and the mean/spread stretch flattened it further | Fixed: `moon.jpg` is the WAC mosaic's detail (over its own ~0.5° blur) times the albedo of the Clementine UVVIS 750 nm mosaic (USGS map server COG overview at 16 px/°, the same blur, which hides its seams, gaps and stripes); WAC alone past 60–70° of latitude (Clementine's poles are shadowed and patchy); tones matched piecewise to the prototype map's percentiles within 60°. Now Imbrium 97, Serenitatis 96, Procellarum 80, Tranquillitatis 78, highlands 150–175, far side 160 (prototype 95, 88, 67, 67, 150–186, 163). 2.1 MB (was 1.7). Decisions 62 (amends 57) |
| 10 | Polar crops credited "LROC WAC global mosaic" | Fixed with 20: `wacPole` |
| 11 | The polar crops' linear stretch lifted black to a flat grey (~80): the shadowed ground read as missing data | Fixed: the polar mosaic's own curve: black stays black, its 99th percentile white, gamma 0.7 between (gain alone clipped a tenth of the sunlit ground to white). Decisions 66 |
| 12 | The Lake Salda window flooded lower ground at its west edge | Fixed: `procedural.ts flood()` marks the samples below the lake's level joined (4-connected) to the one nearest the window's centre; `Terrain.wet` carries it to the mesh (a `wet` vertex attribute; the shader's `water` level is gone) and the topo map. The archetype lake keeps its level. Tested (a deeper pit in a corner stays dry) |
| 13 | The no-data box's heading ("No elevation data for this site") contradicted its body and the real terrain beside it | Fixed: "The search engine has no data for this site/point"; the body unchanged. Test updated |
| 14 | No capture showed an Earth site's credit line (the GLO-30 notice), Hadley's, or the fallback when the site data fails | Fixed: `site-haughton-media`, `site-hadley-media`, `site-nodata-fallback` (new state option `block`: requests whose path contains it answer 404; here `/sites/`, so its console shows the two 404s on purpose) |
| 15 | Phone: the terrain legend over Haughton's bright terrain was unreadable | Fixed in `responsive.css`: below 760 px the legend sits on the north arrow's plate (`rgba(13,15,18,.6)`, `--line-2` border, 9 px radius; 132 px wide). A text shadow alone was tried first and left "Elevation" and "9 m" unreadable |
| 19 | The fetch script let failures through: a ranged GET answered 200 (whole file) was used as the rows; any non-OK HEAD for a GLO-30 tile counted as sea (0 m); `pds()` read every non-REAL sample as int16 LE; the LOLA polar check ran only with the globes | Fixed: ranged requests must answer 206; GLO-30 tiles are sea only on 403/404, anything else but 200 stops the run; `pds()` reads only PC_REAL float32 or LSB_INTEGER int16 and throws otherwise (both LOLA labels checked); the polar check runs whenever the LOLA polar grid is first read (`lolaPole()`), so `--only=sites` checks it too |
| 21 | `CREDITS[genTerrain(...).src!]` indexed with undefined; `drawCrop` added a load/error listener pair per redraw while a crop was pending | Fixed: `dem.ts creditName(src)` (the no-data box, the terrain note; tested); one `onload`/`onerror` per image runs the latest pending draw (`WeakMap`), a failed load falling back to the cut |

**Assets.** `npm run fetch:real` rerun (cached sources plus Clementine's overview and the GIBS exports): `moon.jpg`
2.1 MB (the other globes byte-identical), `patches.bin` 3.4 MB (63 patches), 42 crops (+28 Earth); `public/sites`
3.9 MB, `public/textures` 5.4 MB.

**Tests** (229, unchanged in number): `dem.test.ts` (`creditName`; the lake floods only round the centre, a deeper
corner pit stays dry), `results.test.ts` (the no-data heading).

**Verification** (2026-10-20). typecheck, 229 tests and build green. Full capture, 99 states × 2 viewports
(198/198); console errors only the two intended 404s of `site-nodata-fallback`. Then the phone legend's plate
(finding 15: a text shadow alone left "Elevation" and "9 m" unreadable on Haughton) and a phone recapture of
`site-haughton`, `site-jezero`, `site-moon-malapert`, `compare-jezero-salda`, `engine-warming-note`, `engine-pin-moved`
(6/6). Looked at: `body-moon` (Procellarum and the near-side maria dark as on the reference; mean absolute difference
against it 5.11 → 3.28), `system`, `info-sheet` (both new Data lines), the three new states at both sizes,
`site-malapert-media` (black shadow, "LROC WAC south polar mosaic"), `site-moon-south` (Malapert's 240 m patch, no
facets), `compare-jezero-salda` (only the lake is water, the credit line under the table) and the phone legends.
Desktop differences against the reference: system 0.50, title 0.64, coord-moon-pole 5.84, site-moon-south 8.54,
site-moon-malapert 7.97, site-haughton 13.15, compare-jezero-salda 6.28 (real data, intended).

**Known limits.** Crops for pins and Earth cells are still cut from the globe (Decisions 63; the mock's 19 cells got
WELD crops in the holistic review fixes). The Svalbard and Dry
Valleys crops are Blue Marble at 500 m (outside WELD), soft at 70 km. `moon.jpg` grew to 2.1 MB.

### Real data on the demo path review fixes, round 2 (done)

Three findings from the independent review (2026-10-20), all major. All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Pins on or near the stage sites still got the bump-map terrain ("Illustrative terrain.", faceted planes, procedural craters) though a real patch covered their centre: `patchFor` needs the whole window inside one patch, and a pin's terrain (80 km on Mars, 60 on the Moon) is wider than Jezero's (60) and Hadley's (30) patches. `engine-mars-pin-done` (a pin on Jezero's centre) showed -3,602 to -1,590 m beside real twins; Perseverance's landing site and pins at Hadley alike | Fixed (the finding's second option): Jezero, Gale and Hadley–Apennine each get a pin patch over their extent plus a pin's terrain, at a pin's own spacing (80/191 km on Mars, 60/191 on the Moon): 140 km (336²), 260 km (622²) and 90 km (288²), +1.1 MB (`patches.bin` 4.5 MB, 66 patches). Every pin whose centre is on a stage site's extent now has real terrain, its compare window too (from the site's own patch near the centre, else the pin patch, ≤ 2.1 × coarser). `patchFor` now takes the holding patch closest to the samples' spacing (the coarsest no coarser than they are, else the finest), so Gale's own view keeps its own 0.94 km patch rather than point-sampling the finer pin patch (Decisions 67). A pin's width lives in `real-sites.ts` `PIN_KM` (read by `pins.ts` and the script). New states `site-pin-hadley` (Apollo 15's landing site) and `site-pin-gale` (the engine's coordinates example); `engine-mars-pin-done` now shows Jezero's crater at -3,072 to -507 m, "Terrain: MOLA–HRSC blended DEM, 200 m." |
| 2 | Phone compare: the terrain legend's plate (round 1, finding 15) covered the lower half of each ~195 px half's terrain block (Lake Salda's lake mostly hidden) and narrowed the text, so "Vertical exaggeration 3×" wrapped | Fixed in `responsive.css`: no plate on compare (`body[data-view="compare"]`), so the legend sits below the block as in the prototype; the single site view keeps its plate (Haughton's snow) |
| 3 | The Mars globe (Viking MDIM 2.1) had Hellas as a blown-out white smear (frost and haze in the source) right below Jezero, a pale haze band across Elysium and Cerberus, and weaker dark albedo features than the prototype; not logged | Fixed as the Moon was (Decisions 62): within 60° of the equator, MDIM's detail (each channel over its own ~0.5° blur) over the MGS TES albedo (USGS Astrogeology global mosaic, 7.4 km; the same blur), coloured through each channel's straight-line fit to MDIM's blurred colour and toned to the prototype map's blurred percentiles; past 60–70° the MDIM grade as before (white caps; TES is patchy there). Hellas now matches Noachis around it, no haze band, Syrtis, Acidalia and the Cimmerium–Tyrrhenum band dark as on the prototype. `mars.jpg` 1.6 MB (was 1.7). Crops keep the MDIM grade. Credit key `mdimTes` (crops cut from the globe), the info sheet's Mars line ("Viking MDIM 2.1 and MGS TES imagery"), `docs/credits.md`. Decisions 68 |

**Assets.** `npm run fetch:real` rerun (cached sources plus the TES mosaic, 16.6 MB): `mars.jpg` (the other globes
byte-identical), `patches.bin` 4.5 MB (66 patches, +3), the 42 crops byte-identical; `public/sites` 5.0 MB,
`public/textures` 5.3 MB. The Moon's percentile match moved into a shared `matchTones` (same output).

**Tests** (229, unchanged in number): `dem.test.ts` (the patch closest to the samples' spacing: the coarser one on
their spacing over a finer one, the finer one when the other is 2.5 times coarser).

**Verification** (2026-10-20). typecheck, 229 tests and build green. Full capture, 101 states × 2 viewports
(202/202); console errors only the two intended 404s of `site-nodata-fallback`. Looked at: `engine-mars-pin-done`
(Jezero's crater and delta, MOLA–HRSC note), `site-pin-hadley` and `site-pin-gale` at both sizes (the rille and the
Apennine front; Aeolis Mons' flank), `compare-jezero-salda`, `compare-twins`, `compare-jezero-cell` on the phone
(legends below the blocks, Lake Salda's lake clear) and `site-haughton` on the phone (its plate kept), `compare-globe`,
`body-mars`, `system` at both sizes (Hellas in tone with Noachis, Syrtis and the Cimmerium band dark, white caps),
`info-sheet` (the Mars line still two lines). Desktop differences against the reference: system 0.42 (was 0.50),
title 0.64, body-mars 3.88 (3.73), body-mars-zoomed 9.08 (8.51), compare-globe 3.71, coord-valid 3.91; the rest as in
round 1. The capture sheets use the reference's Mars; the build's differs on purpose (real albedo, Decisions 68).

**Known limits.** A pin off the stage sites' extents (Mars, the Moon within 60°) keeps the bump-map terrain. The Mars
globe follows TES's albedo (1999–2004): Cerberus, a dark streak in Viking's and the prototype's maps, is faint now (it
faded under dust; real). TES's ground-track striping is under the 0.5° blur.

### Booking flow (Must 6, done)

**Where.** Each step is a route under the compare's, over the compare's stage (terrain or globes), in the same panel:
`#/mars/jezero/compare/@34.6750,-105.0750/book` (site listing), `…/book/plan`, `…/book/review`, `…/book/done`; with
`/globe` before `/book` on the globe compare. `router.ts`: `Route.book` (a `Step` or null), `routeOf`/`parse`, Escape
goes back a step (the listing to the comparison, the confirmation to the listing: `UP`). Crumbs end with the step
("Site listing", "Campaign plan", "Review", "Requested"), the compare crumb links the compare itself. `data/booking.ts`
holds the rules (pure, tested), `ui/booking.ts` the templates and the form's handling; `ui/panel.ts` renders the step in
place of the compare panel (`[data-book]` keyed on what it shows of the search, `bookKey`), and `fill()` redraws it only
when that changes (a pin double's search landing) while the stage's terrain follows the windows as on compare.
Entry: "Plan a test campaign here" (primary) in the compare's jump row, left of "Other doubles", when the double is a
result of the current search or an established site (Decisions 76).

**Site listing** (`data/listing.ts`, on `contracts/site_listing.json`, through `data.listing`). Title: the established
site inside the cell, else its country (as cards name cells); coordinates (4 dp); "An unnamed area. How practical a test
campaign for Jezero Crater is here; how alike the terrain is stays on the comparison."; Plan a campaign here; the strip
(the double's context and regional orbital crops, from `panel.ts` `strip`, shared with the site view, and the surface
slot: "No field photographs of this area yet.") with its image credit line; Practical suitability (practical score,
operating area, nearest road, airport, hours from it, barren share, human footprint) and "Practical suitability is
scored apart from the terrain match and never combined with it."; Access and permits (country, sovereign state,
access, then the permits copy keyed on access: partner, non_partner, antarctic_treaty, unknown; a protected area's
permit note); Surface and climate (the result's surface and elevation, the detail's climate block); Season (best months,
season note); Indicative cost (US$ per person-day, Decisions 71); the sample-listing line. An established-site double
(Decisions 70) shows its place, sovereign "—", access Unknown, no surface or climate data: the gaps shown. A pin double
whose search hasn't landed shows its wait (by coordinates "Reading Mars terrain…" with its bar; by name "Searching
Earth…"); one the current search doesn't return, a box back to the comparison.

**Plan a campaign.** A `<form novalidate>`: Test purpose (a native select of the search's supported purposes, default
the search's), Dates (a fieldset: the weather window's 14 days from tomorrow as toggle buttons with their wind bars,
blue under the 11 m/s test limit; first click a one-day campaign, a later day ends it, any other click starts again;
the summary line "Tue 6 Oct to Sat 10 Oct · 5 days, 1 under the wind limit" is a polite live region), Team size (text,
`inputmode="numeric"`, 1 to 40), Equipment (six checkboxes), Notes (textarea, 1,000 characters), Review the request.
Every field writes through to the plan as it changes, so a redraw keeps it. Review checks the plan (`validate`):
errors under their fields in coral (`.ferr`), `aria-invalid` and `aria-describedby` on the control, focus to the first;
an error goes as soon as its field is right; Enter in the team field submits. "A mock: nothing is sent."

**Review**: site with coordinates, purpose, dates with days under the wind limit, team, days on site, equipment, notes
(escaped, line breaks kept), indicative cost for the team and days, the permits copy, Edit the plan / Request the
campaign, and "A mock: requesting sends nothing and contacts no one…". Without a complete plan (a deep link, a reload):
"No complete plan to review yet" and Plan a campaign. **Confirmation**: "Campaign requested", the reference
(`EID-261004-W4DC`: the day, then four Crockford base-32 characters drawn from the plan), the summary, Back to the
comparison / Edit the plan, "A mock: nothing was sent and no one was contacted."; without a request, "No campaign
requested here yet".

**Keyboard and screen readers.** Each step starts with focus on its heading; the steps list marks the current one
(`aria-current="step"`); every control is native (buttons, select, checkboxes, text fields) with a visible label or
legend; day buttons carry `aria-pressed` and a label with the date, wind and limit, and are marked in place (no redraw,
so focus and the live summary stay); errors are in each control's description. Probed keyboard-only on the dev server
(throwaway Playwright script, normal mode): compare → Enter on Plan a test campaign here → Tab, Enter → plan; Tab to
the purpose, the days (Space, Tab, Enter: a three-day range, summary updated); team "abc", a checkbox by Space, notes;
Enter on Review → focus on the team field, `aria-invalid`, its error in `aria-describedby`; fixing it removes both; Enter
→ review (focus on its heading) → Request → done with the reference; Escape → listing → comparison; Escape inside the
notes goes back a step and the plan keeps what was typed. No console errors.

**Styles** (`panel.css`, after the results' states): `.bsteps` (numbers in mono), `.days`/`.day` (the weather window's
bars as in the site view's `.wx`, a picked day on surface-3 with a coral outline: selection), `.dsum`, `.ferr`, the
textarea in the inputs' style, `.ref` (the reference in mono, 24 px), `.facts dd .sub` (a second line in a fact);
`.jump` spaces its two buttons apart.

**Tests** (243, was 229): `data/booking.test.ts` (13: the window's days and their limit, `pickDay`'s transitions, days and
UTC dates, a plan from tomorrow kept per key, `validate`'s fields (team bounds and forms, days on the window, purposes
offered, notes length), the day rate and the total, the reference's format and determinism, the request's copy);
`data/contracts.test.ts` (every established site's listing validates against `site_listing.json` and names it).

**Verification** (2026-10-20). typecheck, 243 tests (was 229) and build green; the app chunk 61.8 KB gzip. Full
capture, 114 states × 2 viewports (228/228); console errors only the two intended 404s of `site-nodata-fallback`. The
13 new `book-*` states (refNA) looked at at both sizes (after the last fix, the bar started on a redraw, they were taken
again): the listing's head, strip and credit, practical facts, partner permits copy, climate, season and cost; the plan
with the 14 days, its errors (Dates and Team size, the field outlined), then days 2 to 6 picked with the errors gone;
the review and its foot; the confirmation with `EID-261004-W4DC`; Haughton's listing with its gaps ("Place", sovereign
"—", access Unknown, no climate data); the empty review; the pin's "Reading Mars terrain…" then the Hanksville
listing filled in place (crumbs and caption renamed). Mean absolute difference against the reference, desktop: the
states the item doesn't reach at their logged values (system 0.42, title 0.64, body-mars 3.88, body-mars-zoomed 9.09,
coord-valid 3.91, site-jezero 10.42, site-gale 7.79, site-hadley 9.56, intro and reduced motion 0.00); the compares with
an established double move with the new button row, `compare-jezero-salda` 7.72 (6.21 when last logged) and
`compare-globe` 5.14 (3.71). Spot-checked `compare-globe`, `compare-jezero-cell` (the button beside Other doubles),
`results-jezero-detail` and `compare-jezero-salda` on the phone, and `site-haughton-media` (the site view's strip and
credit lines unchanged after moving into `strip`). Keyboard probe as above.

**Known limits.** Plans and requests last for the page (Decisions 74). The dates are confined to the seeded 14-day
window; nothing plans further out (the best months say when). Cost and every practical value are seeded rules of thumb,
said so on the page. The permits copy is a first draft keyed only on access. The Earth site view (`#/earth/haughton`)
has no booking: booking hangs off a target's double. No line icons yet (Should row).

### Booking flow review fixes (done)

Twenty-two findings from the independent review (2026-10-20), three major (1/10/17: established-site listings mostly
gaps). Fixed except where noted; overlaps: 1/10/17, 2/19, 3/20, 5/22, 7/12/21, 8/18, 9/11.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 10, 17 | An established-site double (every Moon south-pole region's, Arcadia's) listed sovereign "—", access Unknown with its copy, surface "—", elevation "—" beside a 51–344 m legend; the Dry Valleys never got the Antarctic Treaty copy | Fixed: the 14 sites carry the engine's own `country` and `access` (`data/sites.ts`), read from its grid (`grid/cell_country.npz`, the nearest cell to each, ≤ 4 km except Río Tinto 69 km and Salda 33 km, same country; read-only, stdlib parse) — 12 partner, Dallol non_partner, the Dry Valleys antarctic_treaty; the sovereign equals the country for all 14. `srcOf` passes them as the location with the elevation at the centre of the site's window where its terrain is real (the Dry Valleys 920 m, within the stage legend's 90–2,027 m). Surface class and climate stay gaps, now with a line saying why. Decisions 77 (amends 70); `book-established`'s check updated; new `book-antarctic` |
| 2, 19 | A pin double whose search failed (warming, unreachable, aborted, no_dem…) said "isn't among the search's results", flipping with the wait under the warming retry | Fixed: `bookHTML` renders `panel.ts failed()` (exported) when the search has an error and no answer — warming's progress, the rest with Try again — and `bookKey` gains `err:<code>`, so the panel redraws on each change. During a warming retry it shows the wait for the retry's moment, as the compare's doubles box does (Deviations). New `book-warming`, `book-fail` |
| 3, 20 | Dates error only in the fieldset's description (skipped by screen readers when focus lands inside), no `aria-invalid`; required fields unmarked | Fixed: with a dates error every day button's `aria-describedby` is `b-dates-e` and the fieldset gets `aria-invalid`; `fixed()` strips it from every element it describes. `aria-required` on the purpose and team; a line atop the form: "Test purpose, dates and team size are required; equipment and notes are optional." Asserted in `book-plan-errors`; probed in a browser (focus on the first day carries `b-dates-e`; picking a day removes it everywhere) |
| 4 | October dates at Haughton, the Dry Valleys or Svalbard went through without the season caveat | Fixed: `offSeason(listing, plan)` (tested); the dates summary and the review's Dates add "Outside the site's best months (Jun, Jul, Aug). Reachable in the local summer only." Decisions 79. New `book-offseason-plan`, `book-offseason-review` |
| 5, 22 | The listing's own name never shown; citation, protected-area name and media unused; airport name never mocked; the Green River example unused | Fixed: the listing lede starts with the listing's name ("Unnamed area in the United States of America.", "Hanksville, an established analog site."; the place where the title already names it), then the citation ("Documented in …") when present; a Protected area fact (its name, "Yes", "No" or "—"). The listing's templates moved to a pure `ui/listing.ts`, tested on `site_green_river.json` (`ui/listing.test.ts`: name, citation, airport by name, 140 km, months, season note, permits by access, escaping). Media and the mock's airport names: not done (Deviations; Merge notes) |
| 6 | The weather seam was keyed on a site id only, synchronous | Fixed in part: `weather(at: {id, lat, lon}, from, n)`; `windowOf(listing, from)` passes the listing's coordinates; the site view passes its site. Still synchronous: the change to async is in Merge notes |
| 7, 12, 21 | Escape in a plan field (or during an IME composition) went back a step; the stage hint said "Esc returns to the globe" on every step | Fixed: Escape in the purpose, team or notes blurs the field and stops there (as the coordinate field); a second Escape goes back a step. The global handler ignores keys while `isComposing`. The hint reads "… Esc goes back a step." on booking steps. Probed in a browser |
| 8, 18 | A globe marker during a booking step jumped to that double's same step; Search this area stayed during booking | Fixed: a marker opens the other double's comparison (`book: null`); `#area` is hidden while `state.book` is set (asserted in `book-globe`). Probed |
| 9, 11 | Missing states (globe, done without a request, pin not among results, warming/error, team errors) and no route test | Fixed: `book-globe`, `book-done-empty`, `book-pin-away`, `book-warming`, `book-fail`, `book-plan-errors-team`, `book-plan-invalid` (team 41) plus the season and Antarctic ones above: 11 new states. Route parsing moved to a pure `src/routes.ts` (`parseHash`, `routeOf`; `router.ts` re-exports), tested in `routes.test.ts` (default listing, unknown step, globe index, round trip of every step and stage). Over-long notes: no state (Deviations) |
| 13 | `.state` flush under the heading; the strip 8 px under the button; "4 Requested" wrapping on desktop | Fixed: `[data-book] .title + .state` 16 px, `[data-book] .actions + .imgs` 20 px, `.bsteps` gap 12 px and 5 px after the number: one line at 316 px (`book-listing`) |
| 14 | One site under four names; "in United States of America"; two date formats | Fixed: each step is headed by the double as the app labels it (crumbs, stage, compare); sentences use the listing's name; country names take "the" where they need it (`inCountry`, tested; also in the permits copy: "The United States of America is…"); one date form, "Tue 6 Oct" and "Tue 6 Oct 2026". Decisions 78 (amends 75) |
| 15 | Words in mono ("5.0 km radius", "6 people"); "Days on site 5" without a unit | Fixed: "Operating radius 5.0 km"; "Team size 6 people" and "Days on site 5 days" in sans; the airport's name in sans with its distance in mono |
| 16 | No month on the day grid | Fixed: the first day and any first of a month show the month ("Oct") in place of the weekday letters, in text-2. Decisions 80 |

**Tests** (253, was 243): `routes.test.ts` (3), `ui/listing.test.ts` (6), `booking.test.ts` (`offSeason`; `windowOf` on a
listing; one date form), `contracts.test.ts` (each established site has a country and an access the permits copy knows,
its listing carries the country).

**Verification** (2026-10-20). typecheck, 253 tests and build green. Full capture, 124 states × 2 viewports
(248/248); console errors only the two intended 404s of `site-nodata-fallback`. Looked at: every `book-*` state at
desktop and most at phone size (the listing's steps on one line and its spacing, Haughton's Canada facts, the Dry
Valleys' treaty copy and 920 m, the off-season summary and review, the plan's required line, errors and team error,
warming and failure boxes, the empty confirmation, the pin not among results, the globe step without Search this area);
spot-checked `compare-globe` (Search this area back outside booking) and `site-haughton` (hint and weather unchanged).
Browser probe (dev server, normal mode, throwaway script): Escape in the team field keeps the plan step and blurs; a
second Escape goes to the listing; the plan keeps the team; Review with no days focuses the first day with
`aria-describedby="b-dates-e"` and the fieldset invalid; picking a day clears both; on `…/globe/book/review` the area
button is hidden, the hint says Esc goes back a step, and another double's marker opens its comparison. No console
errors.

### Booking flow review fixes, round 2 (done)

One finding from the independent review (2026-10-20), major: fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | On the plan step an error fixed then broken again didn't come back on the next Review: `fixed()` takes errors out of the DOM in place, but `setHTML`'s cache of `#pin` still held the string with the error, so Review's identical redraw was skipped (no `#b-team-e`, no `aria-invalid`; the focus moved with nothing said). Reproduced on Haughton; Jezero's pin hid it (a late redraw refreshed the cache) | Fixed: a Review counter in the form's markup (`data-try`), bumped on every Review with errors, so its redraw always differs. Chosen over setting errors in place (the inverse of `fixed()`), which would have duplicated `planHTML`'s error markup. Asserted in `book-offseason-plan` (Review with no team by Enter, type 5: the error goes, clear it, Enter: `#b-team-e` back and the field invalid, described and focused); the state fails without the fix |

**Verification** (2026-10-20). typecheck, 253 tests and build green. Throwaway Playwright probe (dev server, the
reviewer's steps on Haughton and Jezero): before the fix the second Review on Haughton had no error; after, both bring
it back with `aria-invalid`. Full capture, 124 states × 2 viewports
(248/248); console errors only the two intended 404s of `site-nodata-fallback`. Looked at: `book-offseason-plan` at
both sizes (team 4, no error left, unchanged), `book-offseason-review`, `book-plan-errors-team`, `book-plan-invalid`
(phone), `book-done` (phone); spot-checked `compare-jezero-cell`.

### Logo (Must 7, done)

The plan's logo chat hasn't delivered, so this is an in-house stand-in (Decisions 81), wired so the final mark is a
one-file swap.

**The mark** (`src/brand/logo.svg`, 48 × 48 viewBox, 0.75 KB with its comment). A world and its double: a solid disc (r 12, in
`currentColor`) and a coral ring of the same size (r 12, 5 wide) offset 19 units at 32° down and right behind it, cut
by a uniform 2.5-unit gap round the disc so it reads as behind. Two shapes, two colours, no stroke under 2.5 units:
at 16 px the ring is ~1.7 px with a ~0.8 px gap and still reads as a disc and a ring; dithered in the footer art (82
dots across on phone, 124 on a 1280 desktop: the reference's 81 and 123) the ring is ~9 dots wide on phone and the gap
~5. The root's `color="#E7E9EC"` gives the light parts
their colour where nothing else does (favicon, the footer's image). Tried and dropped (scratch renders): the ring cut
by a straight mirror line (reads as a cup under a ball), a closer offset (the ring reads as a hook), a solid coral
double (an eclipse, too much accent).

**One source** (`src/brand/brand.ts`, imported first by `main.ts`). It parses `logo.svg?raw` once and makes:
- the inline sprite `#mark` (its shapes without the root, so `currentColor` follows each placement: the top bar's
  `--text`, the lockups' white), used unchanged by the top bar, the title lockup, the credits footer and the info
  sheet;
- the favicon: the mark on the stage colour in the old favicon's 48-unit tile (rx 11), so the light disc still reads
  on a light tab strip; a data URL on `link[rel=icon]` (`index.html` holds `data:,` until then);
- `logoImg`, the mark at 256 px (with a size: Firefox draws no SVG image without one) for the footer art.

**Footer step 1** (`ui/carousel.ts` `dotLogo`). The mark's inked box (its pixels with alpha, found once in the 256 px
image by `brand/alpha-box.ts`, so the viewBox's margins don't count) fits within .62 of the columns and .84 of the rows
(the height of step 2's Earth), centred; at that size the image is rasterised once, read once, then dithered every
frame in two inks: coral where the pixel's red beats its
blue by 70 (the coral parts), light dots elsewhere, alpha as the dither value (shortcut: two inks, coral by hue; a final
logo in more colours needs an ink per colour). The dots develop in Bayer order from the start of the
dissolve in (so step 4 crossfades into it), light over the 1.2 s from there and coral 0.5 s behind, and hold to the
dissolve out (reduced motion: the step's still frame is fully developed). A canvas the SVG
taints (old WebKit) can't be read: the step then shows only its caption rather than throwing in the frame loop. The
old per-frame redraw of the mark (canvas paths per channel) is gone.

**Swapping in the final logo.** Replace `src/brand/logo.svg`: any viewBox (the footer art fits the inked box whatever
its aspect, but every other placement fits the viewBox into a square CSS box, so a wide mark also needs the `.logo`
widths changed in `top.css`, `title.css`, `sysinfo.css` and `responsive.css`);
light parts in `currentColor` with a `color` on the root for standalone use; coral parts in the coral (they dither as
coral dots; other colours dither light). If the final mark carries its own lettering, the placements' "Eidolon" text
and the title wordmark are decided again (Decisions 82). The Should row "Logo variants differ" is met by this: every
variant now comes from the one file.

**States** (Verification table): `title`, `footer-step1`, `info-sheet` (top bar) as before; new
`footer-step1-develop` (seek 16.8 since the review fixes: the wrap's dissolve three quarters through, step 4 fading and
the mark's light dots half in) and `info-sheet-foot` (the info
sheet scrolled to its foot: the mark beside the big lockup). Reference baselines taken for both.

**Verification** (2026-10-20). typecheck, 253 tests (no new pure logic: the module is DOM wiring) and build green.
Scratch renders (sharp, not committed) at 16, 26, 46 and 150 px and a Bayer dither at 63 and 100 dots before wiring;
in the app (throwaway Playwright probe on the dev server) the favicon's data URL drawn at 16 px reads as disc and ring
on its tile, `#mark` holds the file's shapes, no console errors. Full capture, 126 states × 2 viewports (252/252; one
state, `site-pin-gale` desktop, was re-run after a source edit reloaded the dev server mid-run); console errors only
the two intended 404s of `site-nodata-fallback`. Looked at: `title`, `footer-step1`, `footer-step1-develop`,
`info-sheet`, `info-sheet-foot`, `system` at both sizes, with the dithered phone step 1 zoomed 3× (disc edge clean,
ring ~7 dots, gap ~3, coral and light inks apart); spot-checked `footer-step4` (phone) and `compare-jezero-salda`
(desktop): only the mark differs.

### Logo review fixes (done)

Six findings from the independent review (2026-10-20), all minor: all fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The dithered mark was much smaller than the reference's: `dotLogo` fitted the square 48-unit viewBox into min(.62 cols, .78 rows), and the mark fills only ~40 × 34 of it (84 dots across on desktop) | Fixed: the footer art fits the mark's inked box (`src/brand/alpha-box.ts`, its pixels with alpha in the 256 px image, found once; unit-tested) within .62 cols and .84 rows, centred. Now 124 dots across on a 1280 desktop and 82 on phone, against the reference's 123 and 81 (measured on the captures). progress.md's "~150 dots across (the phone's footer art)" is replaced by these numbers |
| 2 | The dissolve into step 1 no longer crossfaded: the incoming step is drawn at a negative time, where the develop was still 0 | Fixed: the develop runs on the step's time plus the dissolve (light over the 1.2 s from the start of the dissolve in, coral 0.5 s behind), so step 4 fades out while the mark's dots come in. `footer-step1-develop` moves to seek 16.8 (the wrap's dissolve three quarters through) and shows both; reference baseline retaken at 16.8 |
| 3 | The same, seen on the step 4 → step 1 wrap: step 4 faded to an empty frame and the caption switched over nothing | Fixed by 2 |
| 4 | The square, rows-limited box left step 1 the smallest step on phone (~130 px of a 354 px panel), and every `.logo` CSS box is square, so "any viewBox" overstated the swap | Fixed: the inked-box fit (1) sizes the box from the mark's own aspect, and .84 rows (step 2's Earth height, up from .78) fills a little more: ~205 px on phone, the reference's ~200. The CSS boxes stay square (the stand-in is square); "Swapping in the final logo" now says a wide mark also needs the `.logo` widths changed, and in which files |
| 5 | The module map had no row for `src/brand/`, and the `index.html` row still pointed the favicon and `#mark` at the prototype's lines | Fixed: a "New:" row for `src/brand/` (`logo.svg`, `brand.ts`, `alpha-box.ts`; Must 7); the `index.html` row says both are empty placeholders `brand.ts` fills |
| 6 | Status didn't record that Must 7 closed the Visual-bugs Should row "Logo variants differ" | Fixed: noted on the Status line of the Should rows under Rendering and Visual bugs |

**Verification** (2026-10-20). typecheck, 256 tests (3 new: `alpha-box.test.ts`) and build green. Full capture, 126
states × 2 viewports (252/252); console errors only the two intended 404s of `site-nodata-fallback`. Reference
baseline `footer-step1-develop` retaken at its new seek. Looked at: `footer-step1` and `footer-step1-develop` at both
sizes (the mark as wide as the reference's; in the wrap, step 4 at a quarter and the mark's light dots half in), the
phone step 1 zoomed 3× (disc edge clean, ring ~9 dots, gap ~5, inks apart); spot-checked `footer-step4` (phone),
`title` (desktop) and `info-sheet-foot` (phone): unchanged.

### Copy pass (Must 8, done)

Every user-facing string read against the plan's rules and the design system's voice (sentence case, ops words, no
game words) and rewritten where it broke one or read as a draft. The rules: lead with permanent Moon base locations and
Mars without promising south-pole matching; say terrain form at 200 m; never claim surface brightness or features under
about 600 m; never a score as "% analog"; the engine's tested line verbatim; Eidolon everywhere, never MoonBnb.

| Where | Was | Now |
| --- | --- | --- |
| Intro lines (`views/intro.ts`) | "Hardware bound for the Moon and Mars…", "Most of the places … never measured…", "Eidolon finds the closest double on Earth for any site you plan to land." | "Permanent bases on the Moon and landings on Mars are rehearsed on Earth first." / "Few of the places we rehearse in were ever measured against the ground they stand in for." / "Eidolon reads terrain form at 200 m and finds the places on Earth that come closest." Same rhythm: two lines each on desktop, three on phone (a no-break space keeps "200 m" together) |
| Title blurb (`index.html`) | the old intro lines | the new ones, Moon bases and Mars in coral |
| Credits footer, carousel step 1, info-sheet foot | "Every target has a double" (untrue: no close analog happens, the south pole has none yet); "Pick a landing site…" | "Earth doubles for the Moon and Mars"; "Pick a base location on the Moon or a site on Mars: Eidolon ranks the places on Earth whose terrain form comes closest at 200 m, then helps plan a test campaign at one." |
| Info sheet | lead "bound for the Moon or Mars"; step 2 "Characterise it: terrain, slope, roughness and surface brightness…" | lead "bound for a Moon base or Mars"; step 1 names candidate Moon base locations first; step 2 "Read its terrain: the terrain form of an 18.8 km window at 200 m (landform shape and size, relief, slope, roughness, raised or incised); features under about 600 m across don't show"; step 3 carries the tested line; the Data fine print says the search reads the Moon within 60°, so the south-pole base regions show terrain without a match for now |
| System heading | "Pick a target body, then pin any point on it…" | "Pick the Moon or Mars, then a site on it, to find the places on Earth that come closest." (phone: `#intro-ov` gets `right: 18px`, the line had run to 4 px from the edge) |
| Body ledes (`ui/panel.ts`) | "Target body. Find a named feature…"; Earth "14 field analog sites." | Mars and Moon "Find a named feature, pin any point on the globe, or start from a featured site."; the Moon adds "Matching reaches 60° from the equator, so the south-pole base regions show terrain only, for now."; Earth "The 14 established analog sites, and the Moon and Mars sites they stand in for." over "Established analog sites" (status bar too) |
| Doubles | "Sample results until the search engine is connected." | under every result list: the tested line, "Typically 2 of 3 searches find a good terrain analog in the first five results.", then the sample line in mock mode |
| Purposes | the engine's labels and descriptions ("Drilling / ISRU", "(thermal context from environment)", "Served by the lighting-geometry module (experiments/E007)…"); the disabled option "(lighting module, not this search)" | Eidolon's words by key (`ui/results.ts` `PURPOSES`, Decisions 83): "Drilling and ISRU", "Education and outreach", each a plain line of what the trials are; the disabled option "(not part of the terrain search)"; the `unsupported_purpose` box "a separate lighting study, not part of the terrain search" |
| Beyond | "…Earth can only partly stage. They come online here as our reach and our tech grow." (a feature promise); Mercury "Ice and metals for everything that comes after." | "…ask for habitats Earth can only partly rehearse. Eidolon starts with the Moon and Mars."; "…a short traverse from ground that reaches 430 °C by day." |
| Site and booking strips | "Perseverance rover images. Linked in the build." | "Perseverance rover images, not added yet." |
| Compare table | "Terrain is a stand-in until DEM tiles are connected." | "Where a side's terrain is illustrative, so are its values here, until the search engine's elevation is connected." |
| Fallback page | "Closest doubles on Earth: …" (curated, not matched); "stand-ins until the matching engine is connected" | "Established analog sites: …"; "These are known analogs, not search results: the search needs the full view." |
| Pins | lede "…. Custom site." | "…. A point you pinned." |
| Booking | listing lede "How practical a test campaign for X is here; how alike the terrain is stays on the comparison."; "A mock: …" | "Access, permits, season and cost for a test campaign for X; how alike the terrain is stays on the comparison."; "A mock-up: …", the review's "It ends with a sample reference number." |

Read and kept (already within the rules, written in Must 4 and 6): the warming, reading, no-data, failure and empty
states, the capability banner, the twins' notes, the coordinate parser's errors, the named-feature search's messages,
the plan form's errors and the permits copy. "The search engine" stays the name of the service behind Eidolon (the
copy never calls it anything else).

**MoonBnb** (plan, Gaps for the merge 5). Scanned every fixture (`contracts/examples/**`: summaries, caveats, notes,
labels, descriptions, messages, sources, listing fields) and the engine's code: no fixture says MoonBnb; the engine
says it only in two docstrings (`server.py`, `search/__init__.py`), never in a response. Guard: `eidolon()` in
`ui/results.ts` maps "MoonBnb" (any case, "Moon Bnb") to Eidolon at display time in `text`, `prose` and `brief`, so
every engine string on a card, the detail, the drawer, the banner and the twins goes through it; the listing's free
text (name, citation, season and permit notes) uses `text` too, and so does an engine purpose the frontend doesn't name.

**Copy check on the bundle** (`scripts/check-copy.mjs`, run by `npm run build` after `vite build`): greps
`dist/index.html` and `dist/assets/*.js` (the app's strings and the fixtures the mock replays, as served) and fails
the build on "MoonBnb", "surface brightness", a percentage beside "analog" or "match", "finds the closest double" or
"Every target has a double"; and when the tested line or "terrain form at 200" is missing. Probed: a dist with those
phrases injected and the tested line reworded fails with all four breaches named.

**Tests** (258, was 256; two new in `results.test.ts`, "copy"): `eidolon` (cases, spacing, escaped, a card and detail with
MoonBnb in the summary and caveats), `purposeLabel`/`purposeText` (by key, the engine's for an unknown key, from the key
without a label, `constructor` not read off the prototype); the `unsupported_purpose` copy updated.

**States** (Verification table for the copy): checks updated on `intro-2s`, `intro-6s`, `title`, `footer-step1`,
`info-sheet`, `beyond`, `body-moon`, `no-webgl`, `compare-asengine-table`; new `body-earth` (the Earth lede and list
head; reference baseline taken) and `results-jezero-foot` (the tested line under the five cards; refNA).

**Verification** (2026-10-20). typecheck, 258 tests and build (with the copy check) green. Full capture, 128 states × 2 viewports (256/256; `site-pin-hadley` desktop re-run after a source edit reloaded the dev server mid-run); console errors only the two intended 404s of `site-nodata-fallback`. Looked at: `intro-2s` and `intro-6s` at both sizes (two lines a paragraph on desktop, three on phone, evenly spaced, the frame hugging them), `title` (blurb clear of the wordmark, as before), `footer-step1` (tagline), `info-sheet` at both sizes, `beyond`, `system` on phone (the heading wraps 18 px from the edge), `body-moon` at both sizes, `body-earth` (with its reference), `results-jezero-foot` at both sizes, `ask-education` (the purpose's line), `no-webgl`, `book-listing`, `book-review-foot`; spot-checked `compare-jezero-salda` and `results-jezero`: only copy differs.

### Copy pass review fixes (done)

Fifteen findings from the independent review (2026-10-20): two major, thirteen minor. All fixed; 1 and 15 are one
finding, 2 and 12 overlap.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 15 | A pin's lede and the compare caption still described the point by its brightness ("Rolling, dark plains"), read from the albedo map | Fixed: `customSite` (`data/pins.ts`) describes a pin by roughness and relief only ("Rolling plains"); `albedoAt` and `MEANLUM` (`terrain/sample.ts`), used by nothing else, are gone, and the tests' mocks of it with them; the header comments say so |
| 2, 12 | The credits footer promised a ranking for Moon base locations, all beyond 60° (no data); the info sheet's qualifier sat in another column | Fixed (Decisions 87): footer "Pick a site on the Moon or Mars: … then helps plan a test campaign at one. On the Moon, matching reaches 60° from the equator for now."; the info sheet's Find its doubles step carries "On the Moon, matching reaches 60° from the equator for now, so the south-pole base regions show terrain only.", taken from the Data fine print. The lead and step 1 keep the Moon bases first (picking one is real; its terrain shows) |
| 3 | A Moon pin beyond 60° showed "Closest doubles on Earth" over "The search engine has no data" | Fixed: under no_dem with no established sites the head is "Earth doubles" (`ui/panel.ts`); with them, "Established analog sites on Earth" (was "Known analog sites on Earth", Decisions 86) |
| 4 | The detail's Matches / Differs escaped the engine's strengths and gaps with `esc`, skipping the MoonBnb guard | Fixed: `strs(xs).map(text)`; the "copy" test puts MoonBnb in the strengths and gaps too |
| 5 | The tagline (35 characters) wrapped on phones: both info-sheet foot spans broke ("Mars" orphaned), and carousel step 1's caption ran into the step dashes at 375 px and below | Fixed by shortening (Decisions 84): "The Moon and Mars, on Earth", 27 characters, the length of step 4's caption; one line each at 390 px (captures) and 360 px (probe). No CSS change: the reference's layout holds again |
| 6 | The worlds' labels said "Target, pin anywhere" (and the Moon can't be matched everywhere); the 14 sites had two names | Fixed (Decisions 86): Moon "Artemis base regions" (first "Base regions, Apollo sites", which ran to the phone's right edge in the capture: shortened to the reference label's 115 px), Mars "Landing sites, pin anywhere", Earth "14 established analog sites", from `BODIES[…].sub` (`views/system.ts` reads it for all three); carousel step 2 and the system status bar say "established analog sites" too |
| 7 | The Earth lede promised the Moon and Mars sites, but each row's meta names only worlds | Fixed: "The 14 established analog sites, and the worlds they stand in for." |
| 8 | Intro line 1 broke "landings / on Mars" on desktop | Fixed: "landings on Mars" joined with no-break spaces (`views/intro.ts`); desktop breaks after "Moon and", phone unchanged in rhythm (three lines a paragraph, evenly spaced) |
| 9 | The compare table's illustrative note had no capture | Fixed: new state `compare-illustrative-table` (`#/mars/arcadia/compare/haughton`, scrolled to the table: Arcadia's terrain is illustrative, Haughton's real) |
| 10 | The fallback led with Mars and never said what Eidolon does | Fixed: the intro's lines 1 and 3 under the reason ("Permanent bases on the Moon and landings on Mars are rehearsed on Earth first. Eidolon reads terrain form at 200 m and finds the places on Earth that come closest."), "Featured sites on the Moon and Mars", the Moon's list first |
| 11 | "…, not added yet." in the surface slot and the booking strip read like a TODO | Fixed: "Perseverance rover images aren’t shown here." (the source named, nothing promised), the booking's "Field photographs aren’t shown here." and, for a cell, "No field photographs of this area." |
| 13 | The copy check joined the page and the JS, so the tested line could leave the results unnoticed; dist's JSON wasn't scanned | Fixed: each required line must be in `index.html` and in the JS apart; the forbidden scan walks all of `dist/` for `.js`, `.html` and `.json` (the sites' and textures' manifests). Probed on a copy of dist: the tested line removed from the JS only, and MoonBnb put in `sites/manifest.json`, fail with both named |
| 14 | Two Verification checks named the engine's old labels | Fixed: "Education and outreach", "Drilling and ISRU" in `ask-education` and `ask-purpose-same` (check and comment) |

**States** (Verification table): checks updated on `footer-step1`, `system`, `info-sheet`, `info-sheet-foot`,
`body-earth`, `no-webgl`, `engine-moon-pin-85S`, `results-moon-malapert`, `ask-education`, `ask-purpose-same`; new
`compare-illustrative-table` (refNA).

**Verification** (2026-10-20). typecheck, 258 tests (the "copy" case now with MoonBnb in the strengths and gaps) and
build (with the copy check) green. Full capture, 129 states × 2 viewports (258/258); console errors only the two
intended 404s of `site-nodata-fallback`; the `system` sequence re-run at both sizes after the Moon label was
shortened. Probed (throwaway Playwright on the dev server) at 360, 375 and 390 px: carousel step 1's tagline ends 35 px
before the step dashes at 360, each info-sheet foot span one line; the Moon label's text 115 px from 233 px (360) and
248 px (390). Looked at: `intro-2s` (desktop) and `intro-6s` at both sizes (desktop breaks after "Moon and", phone
three lines a paragraph, evenly spaced, frame hugging), `footer-step1` and `info-sheet-foot` at both sizes, `system`
and `info-sheet` at both sizes, `body-earth`, `engine-moon-pin-85S` at both sizes, `results-moon-malapert` (phone),
`compare-illustrative-table` at both sizes, `no-webgl`, `site-jezero-media`, `site-pin-gale` ("Rugged highlands. A
point you pinned."), `book-listing`; spot-checked `compare-jezero-salda` (desktop): unchanged.

### Rendering pipeline and the opening (Must 9, done)

The six Must rows under Rendering and shaders. The parity mode of the port (no colour management, gamma by hand, a
transparent canvas over CSS grounds) is gone.

| Row | Done |
| --- | --- |
| Render pipeline | `THREE.ColorManagement` on; colour maps decode from sRGB in the sampler (`tex()`: bump, spec and normal maps stay raw); every `pow 2.2` gone from the planet shader, which outputs linear HDR. `scene/post.ts`: an `EffectComposer` on half-float buffers, no MSAA (the renderer is `antialias: false, alpha: false`, an opaque canvas). Passes: the globe viewports (the old `draw()` loop, viewports and scissors on the buffer, floored as before) into a cleared transparent buffer, whose alpha is what the bodies cover; one `EffectPass` with bloom (`luminanceThreshold` .9, mipmap blur; `BlendFunction.DST`, so it is computed but not blended) and the **finish** effect (`shaders/finish.frag.glsl`): bloom × .25 and the lens flare added in HDR, exposure .9, AgX, a saturation grade of 1.1, the detection duotone, then the grounds the CSS drew behind the canvas (the stage's two glows, the title's ground, the dive's sky) under what alpha leaves uncovered; the terrain viewports draw after it; then SMAA and the grain (`NoiseEffect`, overlay, .08 on the title) to the screen. The composer resizes itself when the drawing buffer changes (resize, the adaptive pixel ratio) |
| Atmosphere | `shaders/atmos.frag.glsl`: single scattering, Rayleigh plus Mie, ray-marched (16 steps; 10 on phones) through an exponential atmosphere, the light at each sample dimmed by Schüler's Chapman approximation toward the sun (which shadows the night side); one shell per body (Earth: scale height 2 % of the radius, top at 1.16; Mars: a dust layer, Mie only, 1.5 %, top 1.12), drawn additively after the planet (front faces depth-tested from outside, back faces untested from inside or near the shell). Over the disc the haze is turned down away from the limb (`discK` .15). The limb brightens toward the sun when backlit (the sunrise). The sprite halos are gone; bloom does the wide glow. The design tokens' thin edge (Earth #8CC6FF, Mars #EBA27C) stays as the planet shader's fresnel rim on the lit side |
| Sun | The title sun's disc is HDR (× 8) and blooms; its glare sprite stays (small in the intro's close shot, growing with the dawn); the streak sprite and the CSS `#flare` are gone. The lens flare is in the finish: a thin streak across the frame and three faint ghosts on the line from the sun through the centre, its strength the glare's times `sunVisible` (`scene/occlude.ts`: how much of the sun's disc the bodies in front leave in view, soft over the disc's angular radius), so it fades as the sun goes behind Earth. The system sun's disc is × 1.6 (a little bloom). Sprites and glows authored over sRGB grounds are re-expressed as light (`asLight`: texture alpha and opacities raised to 2.2), so they keep their size |
| Intro to title | One scene, one camera. `limbPose` is now the brief's shot: from above Earth's dense air (six scale heights up), tilted so the horizon sits just above the frame's bottom edge; the sky gradient is the atmosphere seen edge on, lit by a sun just under the horizon (`BACKLIGHT` (0, −.4, −.92), the dawn sun sprite at (0, .49R, −1.25R)). `#intro .ig` and `.glare` are gone: at sunrise the intro raises the scene's glare and `playTitle` takes it from there (dawn, the sun rising over the horizon, the pull-back) with no cut. Eidolon-1 and its orbit wait for the dawn |
| Poles | The Moon's south polar cap: `moon_cap.jpg` (the LROC WAC south polar mosaic toned to `moon.jpg`) and `moon_cap_normal.jpg` (the LOLA polar DEM's slopes baked as a normal map: 8-bit heights band at 1 km), 1024² each, stereographic to 75° S (`coords.ts` `llToCap`/`capToLL`, tested), made by `npm run fetch:real -- --only=cap` from cached sources. The planet shader blends the cap's colour and normal in from 76° to 79° S, sampled from the object-space normal (no pinch); at the other poles of all three bodies the bump fades out above 80°, where the equirectangular tangent frame degenerates |
| First paint | (Review fixes: two frames, and first paint does wait on the head's stylesheets, Decisions 98, 103.) `#poster` in `index.html`, styled inline so it paints before any script or stylesheet of the app: the title's ground, lockup and coral wordmark, a drawn globe with the atmosphere tokens' rim and a sun, and "Loading the Moon, Mars and Earth". `app.ts` fades it out (.8 s; instantly with reduced motion) when the scene's first frame is drawn; the no-WebGL fallback removes it |

**Determinism and motion.** Under `?capture` the grain's pattern holds (the composer gets dt 0), the title ground's
1.6 s fade integrates on the app clock in `frame()`, and every new value (glare, dawn, flare, sky, grade) comes from the
tweened scene state, so seeks reproduce frames. Reduced motion: the intro still cuts straight to the title (instant,
as before); the poster's fade is instant.

**Performance.** Expensive passes scale down on phones (`LITE`: a coarse pointer at up to 1024 px): 10 atmosphere
samples instead of 16, 6 bloom levels instead of 8, no SMAA (their pixels are dense). The adaptive pixel ratio steps
the whole pipeline down with it (the composer follows the drawing buffer). The canvas still stops rendering under
Beyond, the info sheet and the footer. Production JS: the start path's chunks are 306 KB gzip (232 before;
postprocessing adds 74, 50 of them SMAA's embedded area texture), under the 350 KB budget; Must 10 measures frame rates.

**Verification** (2026-10-20). typecheck, 263 tests and build (with the copy check) green. Full capture, 131 states
× 2 viewports (262/262); console errors only the two intended 404s of `site-nodata-fallback`. Before/after: the
previous build's captures kept aside and compared state by state with region colour stats. Looked at, both sizes:
the opening (`intro-2s`, `intro-6s`, `intro-8s`: the brief over a blue twilight sky, lines and frame as before, the
dark telemetry corners readable on the horizon's glow; `sunrise-9s…13s`: the sun rising over the limb, the pull-back
to the title, the atmosphere on the limb throughout, no cut; `title`), `system`, `body-mars`, `body-moon`,
`body-earth`, `dive-0.8s` and `dive-earth` (the grade and sky as before), `site-jezero` (terrain pixel means identical
to before), `compare-jezero-salda`, `compare-globe`, `beyond`, `footer-step2`, `info-sheet`, `no-webgl`,
`reduced-motion`, `poster`, `moon-pole-zoomed` and `coord-moon-pole` (no pinch or streaks at the pole). Normal mode
smoke-tested (Playwright on `vite`): poster, intro, title, Enter the system, a site; no console errors (driver notes
only). Judged against the reference: the opening is one move now and the globes read at least as well; Earth's limb is
softer than the reference's drawn line (Known limits).

**Known limits.** Frame rates aren't measured here (SwiftShader; Must 10). SMAA's area texture is bundled for phones
too, which never use it (50 KB gzip). The phone path is chosen once at load. ~~The pull-back passes close over the night
side for about a second, where the 4K map is soft. Earth's limb is softer than the reference's drawn shell line~~ (both
addressed by the review fixes below).

**Tests** (263, was 258): `llToCap`/`capToLL` (centre and edge, round trips, the frame of `localDir`), `sunVisible`
(in front, aside, half on the limb, behind the sun, inside, radius 0).

**States** (Verification table for the rendering): new `poster` (first paint, the textures held so the app never
starts; refNA) and `moon-pole-zoomed` (the globe zoomed in on the south pole; the reference shows the pinch). The
harness gains two state options: `hold` (requests that never answer) and `noReady` (shoot without waiting for the
start). The opening's states (`intro-*`, `sunrise-9s…13s`, `title`) are the "Intro" and "Sunrise into title" rows.

**Retuning** (each by captures and region colour stats against the pre-change build, the atmosphere also by a JS
model of its shader): exposure and saturation fitted to the old planet colours (Mars, the Moon and Earth's ocean within
~10 %); AgX's toe crushed the night side, so its fill is .03 (was .006); the terrain's shading math stays in sRGB and
decodes at the end, so its ramps render exactly as before (checked: identical pixel means on `site-jezero`).

### Rendering pipeline and the opening review fixes (done)

Twenty-nine findings from the independent review (2026-10-20): six major, twenty-three minor. All fixed, none skipped;
several are one finding seen twice (1, 10, 22; 2, 14; 3, 23; 4, 11; 5, 20; 6, 21; 8, 15, 26).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 10, 22 | The sun rose at 9 s, went behind Earth during the pull-back (gone at 10 s) and rose again at 12 s; the 10 s frame was a close, purple, smeared night side with an olive band | Fixed (Decisions 99–101): `placeSun` keeps the sun above the limb as seen from the moving camera, turned to the frame's top early on (phones); the light leads the camera; the night map shows its lights only (the purple was its moonlit blue base, found by probing the frame with the atmosphere and then the night map switched off). Now: rises 9–9.5 s, above the limb at 10, 10.5, 11 s, on the title's limb from 12 s, at both sizes |
| 2, 14 | Dark dashes along the intro's horizon (phones worst): a dark 2 px notch at every stair step | Fixed at the cause: the atmosphere stopped its rays at the unit sphere while the planet is the 160 × 110 mesh, up to 3e-4 inside it; the slivers between got neither. The ground hit is now at .9997 (`atmos.frag.glsl`). Phones keep no SMAA: the staircase is plain, with no notches (zoomed 4×) |
| 3, 23 | The detection duotone was gated on the site view while the dive sky followed `G.scan`: leaving mid-dive cut the grade in one frame | Fixed: `renderPost(R, dt, G.scan)`; `G.scan` is non-zero only in a dive and its fade |
| 4, 11 | The poster was the full title frame (gave the wordmark reveal away, a cut before the one move); on phones its sun sat on the lockup | Fixed (Decisions 103): on #/ the poster is the intro's first frame and Earth is drawn from the intro's first frame; a deep link keeps the title frame, its globe and sun placed as in the phone title (clear of the lockup) |
| 5, 20 | The poster's loading line was aria-hidden | Fixed: `role="status"`; only the drawing is aria-hidden |
| 6, 21 | `compileAsync` built the canvas variants (output colour space is in three's program key), so every program compiled again on the first frame, and the pipeline's never | Fixed (Decisions 104): `precompile` with the composer's buffer bound, both atmosphere sides, then one composer run, before the poster fades |
| 7 | "Paints before any stylesheet" was wrong in production (two render-blocking stylesheets in the head) | Corrected in `index.html` and Decisions 98; carried to Must 10 in the Status list |
| 8, 15, 26 | The dark bottom telemetry sat on the planet's grey-blue (phones ~3.7:1, labels ~2.2:1); Skip intro was white on the rising sun (~2:1) | Fixed (Decisions 102): tall frames put the horizon under the corners, labels at .75 (desktop 6.0:1 and 4.0:1, phones 6.6:1 and 4.3:1, measured on the captures); `.skip` on rgba(0,0,0,.55) (white on it over the sun's white is 4.8:1; .45 as suggested gives 3.4:1) |
| 9 | Some deviations were only Decisions; the Should fallback line promised the poster | Fixed: Beyond's CSS ground, the suns' sprites beside bloom and the system sun without a flare are under Deviations; the fallback line says why it doesn't reuse the poster |
| 12 | The system sun was a grey-cream ball after AgX | Fixed: disc × 12 (was 1.6): white (254, 252, 250) with the warm corona and glow kept, bloom picks it up; no flare (Decisions 95) |
| 13 | Ring banding in the sunrise sky and the system sun's halo | Fixed (Decisions 105): the glow textures are half float, and the last pass dithers; a ×5 contrast stretch of both crops shows rings before, none after |
| 16 | Ghosts on the wordmark's "n", the "Earth, low orbit" caption and beside Replay intro; at 9 s the streak lay along the horizon | Fixed: ghosts between the sun and the centre (.3, .55, .75); the streak's share fades with the sun's height above the limb (`FX.streak`) |
| 17 | Earth's thin edge (#8CC6FF) didn't show | Fixed (Decisions 106): a ~2 px screen-space line over a soft fresnel |
| 18 | No state in the 9.5–10.5 s window; no reduced-motion title | Fixed: `sunrise-9.5s`, `sunrise-10.5s`, `reduced-motion-title` (and `poster-deep`) |
| 19 | Meridian labels piled into a ring round the pole on `moon-pole-zoomed` | Fixed: `lonStride` (`coords.ts`, tested) thins them to every k-th, k dividing the ring, about 56 px apart, none when a ring is tiny; round the zoomed pole every 30° now |
| 24 | The title's grain moved under reduced motion | Fixed: `composer.render(CAPTURE \|\| RM ? 0 : dt)` |
| 25 | The poster's mark was empty until scripts ran | Fixed: an `<img>` of `logo.svg` (a data URI in the build, checked in `dist/index.html`) |
| 27 | No check that half-float buffers are renderable | Fixed: 8-bit buffers without `EXT_color_buffer_float`/`_half_float` (Decisions 105); probed with both hidden: system and title draw |
| 28 | Replay intro showed the title's ground through the intro's sky for 1.6 s | Fixed: `runIntro` sets `FX.title = 0` |
| 29 | The grounds were GLSL constants and again in the poster | Fixed: `--glow-warm`, `--glow-cool`, `--title-*` in `tokens.css`; the finish reads them (with `--bg`, `--coral`) as `setGrade` does the sky; the fallback's CSS uses them too; the poster keeps a documented copy |

**States** (Verification table): new `sunrise-9.5s`, `sunrise-10.5s`, `poster-deep` (refNA), `reduced-motion-title`
(seq `rm` with `reduced-motion`); checks updated on the sunrise states, `poster`, `reduced-motion`.

**Tests** (264, was 263): `lonStride`.

**Verification** (2026-10-20). typecheck, 264 tests and build (with the copy check) green. Full capture, 136 states
× 2 viewports (272/272; `compare-globe-tagged` desktop re-run alone after an edit to `index.html` reloaded the dev
server mid-run); console errors only the two intended 404s of `site-nodata-fallback`. Reference baselines taken for the
new states (`sunrise-9.5s`, `sunrise-10.5s`, the `rm` seq). Before/after against the Must 9 captures. Probes
(throwaway Playwright on the dev server, with a temporary hook since removed): the 10 s frame with the atmosphere, then
the night map, switched off (the purple was the map's base); the poster against the intro's first frame on a grid of
samples; the 8-bit fallback with the float-buffer extensions hidden; a ×5 contrast stretch of the sunrise sky and the
system sun's halo (rings before, none after); the phone horizon at 4× (no notches). Looked at, both sizes: the opening
(`intro-2s`, `intro-6s`, `intro-8s`, `sunrise-9s` … `sunrise-13s` with 9.5 and 10.5: the sun rises at 9–9.5 s and stays
above the limb to the title; `title`), `poster`, `poster-deep`, `reduced-motion`, `reduced-motion-title`, `system`,
`body-earth`, `body-mars`, `body-moon`, `moon-pole-zoomed` (meridian labels every 30° round the pole), `compare-globe`,
`dive-0.8s`; spot-checked `dive-earth`, `site-jezero`, `compare-jezero-salda`, `beyond`, `footer-step2`, `info-sheet`:
unchanged. Judged against the reference: the opening is one sunrise now, where the reference cut; Earth's thin edge
reads again; the title matches it at both sizes.

**Known limits.** On phones, 10–10.5 s still passes close over the night side (dark now, the night map's city lights
magnified into blobs for about half a second). The desktop poster's sky is within ~5–10 levels of the canvas's (phones
~3). On phones the system sun is a large disc at the frame's edge (the tall layout's framing), now white-hot. The
first paint's dependence on the head's stylesheets is for Must 10 to measure.

### Rendering pipeline and the opening review fixes, round 2 (done)

Two findings from the independent review (2026-10-20), both major and the same defect seen twice. Fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 2 | Skip intro before the sunrise (~8.7 s) popped the sun in: `playTitle(true)` set the glare from 0 to .75 in one frame, so the half disc on the limb (HDR × 8), its glare sprite, the bloom and the flare's ghosts appeared at once over the twilight sky. Before Must 9 the intro's opaque `.ig` gradient hid this while it crossfaded out; the intro is transparent over the scene now | Fixed (Decisions 107): `playTitle(true)` keeps the glare where the intro left it and swells it to .75 over .7 s (`power2.in`, the intro's swell compressed), then .75 → 1 over the move as before; dawn 0 and title 1 still set at once. The natural path arrives at .75, so its swell is 0 s and its frames are unchanged; reduced motion is instant as before. New states `skip-3.1s`, `skip-3.4s`, `skip-4s` (Skip intro tapped at 3 s): before the fix the full sunrise disc and glow were already there at 3.1 s; now no sun at 3.1 s, a faint glow at 3.4 s, the full sunrise at 4 s, at both sizes |

**States** (Verification table, rows "Intro" and "Sunrise into title"): new seq `skip`: `skip-3.1s`, `skip-3.4s`,
`skip-4s` (tap `#intro .skip` at 3 s, then seek). Reference baselines taken (the reference's opaque gradient
crossfades out over its sky).

**Verification** (2026-10-20). typecheck, 264 tests and build (with the copy check) green; no new pure logic (one
branch in a view; the `skip-*` states are its check). Before/after: the three `skip-*` states shot on the previous code
first (the full sunrise disc and glow at 3.1 s) and kept aside. Full capture, 138 states × 2 viewports (276/276;
desktop `reduced-motion` and `reduced-motion-title` re-run alone after a dev-server reload mid-load, the same flake as
round 1); console errors only the two intended 404s of `site-nodata-fallback`. Looked at, both sizes: `skip-3.1s`,
`skip-3.4s`, `skip-4s` (no sun, a faint glow, the full sunrise: a swell, no step), `sunrise-9.5s`, `sunrise-11s`,
`title`, `reduced-motion-title` (the natural and reduced-motion paths as before); spot-checked `system`. Judged
against the reference: its skip washes the frame white as its gradient crossfades; ours swells the sunrise on the
horizon, as the natural opening does.

### Performance budget (Must 10, done)

The plan's Verification budget, measured on the production build by `npm run perf` (`scripts/perf.mjs`: `vite build`,
then `vite preview` on :4173 and Playwright Chromium on this machine's GPU, an Apple M3 laptop, integrated graphics,
through ANGLE Metal; it aborts on a software renderer and exits 1 if anything misses). Don't run it during a capture:
both use the GPU.

**Performance** (2026-10-20, after the fixes below)

| Measure | Budget | Measured | Method |
| --- | --- | --- | --- |
| JavaScript, gzipped, three.js included | < 350 KB | **308 KB** on #/ and #/system (renderer + three 161, app 135, sites 10, entry and preload 2); the IAU targets (71) and the fallback (1) load only when used; CSS 10 | The `.js` files the browser fetches until the poster fades, each gzipped (zlib default, as Vite reports) |
| Time to first paint (poster) | < 1.5 s on a fast mobile connection | **628 ms** on #/ (runs 472, 744, 628), **480 ms** on #/system | Phone 390 × 844 @3, cold cache, DevTools' Fast 4G (165 ms, 9 Mbit/s down, 1.5 up, × .9) and 4× CPU slowdown; first-contentful-paint, median of 3. Google Fonts live |
| GPU memory, all three worlds loaded | < 300 MB | **284 MB** laptop 1280 × 800 @2 and 1512 × 860 @2 (this Mac full screen); 263 MB at 1920 × 1080 @1; 214 MB phone 390 × 844 @3. Was 394 MB at 1280 × 800 @2 | WebGL calls tallied by an init script (every texture, render target and renderbuffer by size and format, mip levels included, freed on delete) plus two drawing buffers; peak over system, the three bodies, a site and a compare. Self-check: a 4K colour map tallies at 4096 · 2048 · 4 · 4/3 bytes |
| Frame rate, laptop with integrated graphics | 60 fps on system and body views | **60.0 fps** on every route (system, Mars, Moon, Earth, a site, a compare), p95 frame 16.8 ms, at 1280 × 800 @2 and 1512 × 860 @2; 22–32 draw calls and 1–4 ms of main thread a frame. Without vsync 214–240 fps (240 is GSAP's ticker cap): **3.6× to ≥ 4× headroom** | rAF intervals over 4 s after a 3.5 s settle, frames with draw calls only; main thread from CDP `Performance.getMetrics` |
| Frame rate, mid-range phone | 30 fps | **Proxy only:** 60.0 fps on every route with the phone path (390 × 844 @3, buffer 780 × 1688) at 4× CPU, 1–5 ms of main thread a frame; without vsync ≥ 7.9× headroom over 30 (240 cap) | No phone here; the GPU is the M3, so this bounds the CPU side. A phone GPU up to ~8× slower than an M3 still holds 30 fps at the phone path's 1.3 M pixels, and the adaptive pixel ratio steps down from 2 below that |

**Fixes** (what was over: GPU memory, 394 MB at 1280 × 800 @2: maps 186, pipeline buffers 177, drawing buffer 31)

- **A pixel budget on the pixel ratio** (Decisions 108): `pixelRatio()` is also capped at √(2.5 M / window pixels),
  never under 1. The pipeline's buffers cost ~51 MB per million pixels (two RGBA16F composer buffers and the bloom's
  full-size luminance target, two depth textures, SMAA's two RGBA8 targets, the bloom chain, two drawing buffers): at 2
  a 1280 × 800 window had 4.1 M of them. Now 1.56 there (2000 × 1250), 1.39 at 1512 × 860; phones keep 2 (their
  windows are small), a 1080p window at 1 is unchanged. Resize already re-reads it; the adaptive step-down now starts
  from the effective ratio.
- **Single-channel data maps** (Decisions 109): the three bump maps and Earth's gloss map upload as R8, the Moon cap's
  normal map as RG8 (the shader reads `.r` and `.rg`): −29 MB, no visual change. The CPU readers (`prepareMaps`, the
  topo map) read the images, not the textures.

**Not changed** (Decisions 110): fonts stay on Google Fonts (first paint is 0.5–0.8 s with them, so the Status
line's "self-host if it misses" doesn't apply; self-hosting stays under Should: Share and meta); no more code splitting
or tree-shaking work (42 KB under the JS budget; three's namespace import is already shaken by member: its loaders, animation system and
unused geometries aren't in the chunk); no KTX2 (no encoder
here, and the maps fit); no render-on-demand (the worlds turn on every frame); offscreen worlds already skip drawing
(`alpha` under .004) and the canvas stops under Beyond, the info sheet and the footer.

**Known limits.** GPU timer queries can't be used here: on ANGLE Metal a pass of 8 × 5 pixels reads 2 ms, so GPU time
per frame isn't reported; the no-vsync rate stands in as throughput, capped at 240 by GSAP's ticker. The memory tally
leaves out 2D canvases (crops, topo maps, the footer art, Beyond) and the compositor's layers. A window over 2.5 M CSS
pixels at device scale 1 (2560 × 1440) stays at ratio 1 and goes over 300 MB (~345); not a laptop with integrated
graphics. ~~On Fast 4G the app starts (poster fades) at ~8.6–9.2 s: the 5.8 MB of maps and the 4.7 MB of site
elevation share the link (`loadSites` starts beside the maps); outside the budget, which is first paint.~~ (fixed in
the review fixes: 3.3 s on #/, the start waits on the route's maps only)

**Verification** (2026-10-20). typecheck, 264 tests and build (with the copy check) green; `npm run perf` exits 0
(all five measures within the budget). Full capture, 138 states × 2 viewports (276/276; desktop `site-jezero-media`
re-run alone after an edit to `index.html` reloaded the dev server mid-run); console errors only the two intended 404s
of `site-nodata-fallback`. Captures run at device scale 1, where the pixel budget changes nothing, so only the R8 maps
could show: a pixel diff against the previous run's captures finds 237 of 276 identical and the rest different only in
DOM text (the intro's lines, globe and graticule labels: glyph anti-aliasing, mean ≤ .5 of a level), no WebGL pixel.
Looked at: `system`, `moon-pole-zoomed`, `body-earth` (phone), `site-jezero`, and the diff masks of `intro-2s`,
`system` (phone), `body-mars-zoomed`. On the real GPU (production build, 1280 × 800 @2): Mars zoomed and the Moon,
relief as before at a 2000 × 1250 buffer, no console errors or warnings. No new states: nothing visible changed;
`npm run perf` is this item's check. (Corrected in the review fixes: on a retina screen the pixel budget is visible,
graticule lines and contours a little heavier; states `body-mars-zoomed-2x`, `site-jezero-2x` capture it.)

### Performance budget review fixes (done)

Nine findings from the independent review (2026-10-20): one major, eight minor. All fixed, none skipped; 1 and 6 are
one finding seen twice.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 6 | The start waited on all 12 maps (Venus and Mercury included) while `loadSites` pulled 4.7 MB over the same link: on Fast 4G the poster held ~9 s on #/, a deep link fell back to the 7 s ceiling; the plan's "load each body's textures when it is first shown" was neither built nor logged | Fixed (Decisions 111): `tex(k)` only creates the texture, `loadTextures(keys)` fetches each once; the start waits on the opening route's worlds (`routes.ts` `mapsOf`, tested: Earth on #/, the body on a deep link, Earth too on a compare, all three on the system, everything on Beyond), then the other maps and the site elevation load, reported through `onAsset`. `onAsset` now rebuilds the terrain only for elevation it reads, clears pins only for a height map, and `prepareMaps` keeps maps already read. `?capture` still waits on everything. Fast 4G, phone, 4× CPU: app start **3.3 s on #/** (was ~8.6–9.2), **4.0 s on #/mars/jezero**, 8.3 s on #/system (its three worlds' 5.9 MB). Not per body when first shown: Deviations |
| 2 | `genTerrain` wasn't moved to a worker, nor logged; the shortcut named Must 10 | Logged (Decisions 112, Deviations): it stays on the main thread behind the closed curtain; the shortcut in `procedural.ts` names the phone terrain layouts (Should: Touch) |
| 3 | Must 5's "JPEG, not KTX2 … revisit with the performance item" left open | Closed there; the final call is under Deviations, Performance budget (Must 10): no encoder here and the maps fit |
| 4 | `fps()` passed a route that drew fewer than 2 frames (NaN < target is false) | Fixed: such a route is over budget ("n frames drawn") and its row says so; no `median([])` |
| 5 | No merge note for the budget (measured on the mock build only) | Added under Merge notes: rerun `npm run perf` on the engine build |
| 7 | The pixel budget (visible only on a retina screen) had no capture; the note said nothing visible changed | Fixed: a per-state `scale` option in `capture.mjs` (the context's device scale factor), states `body-mars-zoomed-2x` and `site-jezero-2x` at scale 2 (reference baselines taken); the Must 10 note corrected, the heavier lines under Deviations |
| 8 | `fps()`'s no-vsync browser was closed only on its last line: a throw would leave Chromium keeping Node alive | Fixed: hoisted beside `browser`, closed in the top-level `finally` |
| 9 | Vertex and index buffers weren't in the GPU tally, nor in its "not counted" note | Fixed: `bindBuffer`/`bufferData`/`deleteBuffer` are tallied (a new column): 3.1 MB, total 287.6 MB at 1280 × 800 @2 |

**Performance** (2026-10-20, `npm run perf`, rows that changed; the rest as in Must 10)

| Measure | Budget | Measured | Method |
| --- | --- | --- | --- |
| Time to first paint (poster) | < 1.5 s on a fast mobile connection | **476 ms** on #/ (468, 476, 492), 528 on #/system, 504 on #/mars/jezero. App start (poster fades): 3317 ms on #/, 8333 on #/system, 3951 on #/mars/jezero (was ~8.6–9.2 s on every route) | As in Must 10, with a site's deep link added |
| GPU memory, all three worlds loaded | < 300 MB | **287.6 MB** laptop 1280 × 800 @2 (textures 157.3, targets 108.1, buffers 3.1, drawing buffer 19.1), 287.5 at 1512 × 860 @2, 265.9 at 1920 × 1080 @1, 217.0 phone | As in Must 10, plus vertex and index buffers (`bufferData`, freed on `deleteBuffer`) |
| Frame rate | 60 fps laptop, 30 phone | 60.0 fps on every route at both laptop sizes and the phone proxy; without vsync ≥ 4.0× on the laptop (Earth 3.4×), ≥ 7.9× on the phone proxy | Unchanged method; a route with < 2 frames drawn now fails the run |

**States** (Verification table, Performance budget): new `body-mars-zoomed-2x` and `site-jezero-2x`, with `scale: 2`
(the phone runs them at scale 2 too, where its ratio stays 2). The harness multiplies a `wheel` step's delta by the
state's scale: Chromium hands the page the delta divided by the device scale (probed: −500 arrived as −250 at scale 2,
so the zoomed state didn't zoom on either target).

**Tests** (266, was 264): `mapsOf` (the maps each route opens on; Beyond's null).

**Verification** (2026-10-20). typecheck, 266 tests and build (with the copy check) green; `npm run perf` exits 0.
Outside `?capture` on the real GPU (production build, a throwaway Playwright script): deep links to `#/mars/jezero`
and its compare request only their worlds' maps before start, then the rest and the site data; the site's real DEM
lands and replaces the procedural terrain; the system after it shows all three worlds textured; Beyond after #/ shows
its Venus and Mercury scenes; no console errors. Full capture, 140 states × 2 viewports (280/280); console errors
only the two intended 404s of `site-nodata-fallback`; the two `-2x` states re-run on both targets after the wheel fix,
reference baselines taken for them. Looked at: `body-mars-zoomed-2x` and `site-jezero-2x` at both sizes, full
resolution against the reference at 2 (relief, glows and labels as before; the graticule lines a little softer and
greyer, contours likewise, as logged), `system`, `beyond` (phone), `compare-jezero-salda`: unchanged (`?capture` still
waits on every map, so the other states can't move).

**Known limits.** #/system still waits on its three worlds (5.9 MB, 8.3 s on Fast 4G): it opens on all three. The
other maps load right after start rather than when their world is first shown (Deviations). `genTerrain` still blocks
the main thread at each terrain swap (Decisions 112).

### Performance budget review fixes, round 2 (done)

Two findings from the independent review (2026-10-20), both major, both caused by round 1's lazier start. Both fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | On a site or compare deep link the site elevation queued behind every other map (Venus and Mercury included): on Fast 4G the demo path showed the procedural "Illustrative terrain" crater for ~8 s, then hard-cut to the real DEM (another shape, legend, exaggeration, contours) with a credit line popping into the panel, outside any curtain | Fixed (Decisions 113): a site or compare route also waits on the real elevation (`loadSites`, as `?capture` did), under the same 7 s ceiling. After start the rest loads by need, one batch at a time: the three worlds' maps and the site elevation (a body view's sites first, else the worlds), then Beyond's two maps. Elevation that still lands after start (past the ceiling, or on a site reached before its batch) rebuilds the terrain, its legend and note, the panel's credits and maps behind the `#curtain` (router.ts `curtain`, shared with the terrain swap), not as a cut |
| 2 | A world whose map hadn't landed drew as a black disc with only its rim (#/mars → the system: Earth and the Moon; the Moon still black 4 s in, its map fetched after Beyond's); clicking into it gave a black globe; no capture state could show it | Fixed (Decisions 114): the planet shader draws the world in its colour map's mean colour (`BODIES[id].mean`, sRGB, area-weighted) until the map (and the Moon's cap) land, then turns to the map over .9 s (app.ts `showMaps`; at once before start). Relief, rim, night lights and graticule draw as before over it. Moon and Mars now load before Venus and Mercury (finding 1's order). New states `system-moon-late`, `body-moon-late` (`block: '/textures/moon.jpg'`) |

**Measured** (production build, `vite preview`, phone 390 × 844 @3, Fast 4G and 4× CPU, cold cache; `npm run perf --
--only=paint` medians of 3, and a throwaway Playwright probe of the resource timings, one run per route):

| Route | First paint | App start | Real DEM at start | Load order after start (responseEnd, s) |
| --- | --- | --- | --- | --- |
| #/ | 496 ms | 3.2 s (was 3.3) | n/a | Earth (gated) → Moon, Mars 3.6–7.6 → sites 12.6 → Venus, Mercury 13.3 |
| #/system | 480 ms | 8.0 s (was 8.3) | n/a | three worlds (gated) → sites 13.1 → Venus, Mercury 13.7 |
| #/mars | n/a | 3.4 s | n/a | Mars (gated) → sites 7.8 → Earth, Moon 8.8–12.5 → Venus, Mercury 13.0 |
| #/mars/jezero | 548 ms | 8.9 s (was 4.0, the real DEM cutting in at ~15 s) | yes (patches.bin 8.1 s) | Mars and sites (gated) → Earth, Moon 9.3–13.1 → Venus, Mercury 13.6 |
| #/mars/jezero/compare/salda | n/a | 9.4 s | yes (8.9 s) | Mars, Earth and sites (gated) → Moon 11.2–13.1 → Venus, Mercury 13.6 |

The site deep link starts ~5 s later than round 1, on the poster (first paint unchanged, the budget's measure), and
opens on the terrain it keeps. Late paths, checked outside `?capture` on the real GPU with a delayed response: site
data held 11 s on #/mars/jezero (start at the 7 s ceiling, "Illustrative terrain"), then the curtain closes, the real
DEM and "Terrain: MOLA–HRSC blended DEM, 200 m." are in when it opens (curtain opacity sampled: 0 → .81 → 0 over
~.7 s); the Moon's map held 9 s on #/mars → #/system: the grey placeholder Moon, half turned 450 ms after the map
landed, the map at 1.6 s; no console errors.

**States** (Verification table, Performance budget): `system-moon-late` and `body-moon-late` (refNA): the Moon's map
blocked, so it never lands; the placeholder on the system and on the Moon's body view (graticule, HUD, the cap in the
same grey, relief from the height map). The console shows their one intended 404.

**Verification** (2026-10-20). typecheck, 266 tests and build (with the copy check) green; `npm run perf --
--only=paint` within the budget (table above). Full capture, 142 states × 2 viewports (284/284; 14 desktop states
re-run after an edit to `app.ts` reloaded the dev server mid-run); console errors only the intended 404s of
`site-nodata-fallback` and the two new states. Under `?capture` every map is in before start, so `ready` is 1 and the
shader's mix returns the map exactly: no other state can change. Looked at: `system-moon-late` and `body-moon-late`
at both sizes (a lit grey Moon with its rim, relief and graticule, the cap seamless in the same grey; Earth and Mars
as in `system`), `system` (phone), `body-moon`, `site-jezero`, `compare-jezero-salda`: as before. The late paths
outside `?capture` as described above (probe re-run after the last edit: the curtain rebuild as before).

**Known limits.** ~~A site or compare deep link holds the poster until its 4.7 MB elevation lands (~9 s on Fast 4G);
past the 7 s ceiling it starts on the procedural terrain and swaps behind the curtain when the data lands.~~ (fixed in
Progressive textures: it waits on its own patches, ~0.1 MB, and starts at 2.0–2.7 s) A world's
relief (height map) appears when it lands, not with the colour's fade; the night lights likewise.

### Must list holistic review fixes (done)

Three cross-item findings from the review after the must list (2026-10-20), all major. All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The Earth doubles, the main output, sat well below the fold on the site view and nothing on screen said they exist: at 1280 × 800 the panel is 748 px tall and the first card was at 1,308 px; on the phone's 455 px sheet about three sheets down (the reference had Compare at the fold; the credits, purpose form and banner pushed it out) | Fixed in `ui/panel.ts`: a skip link under a target site's lede, "Earth doubles", or "Searching Earth…" while the site's search has no answer (`fill()` relabels it as the search lands or is asked again), in a `.jump` row with the `.back` style and compare's down chevron. It reuses compare's `[data-jump]` handler: the doubles box to the top of the panel (the sheet on a phone), focused. Earth sites have no doubles, so no link. New harness step `inView` (fails unless the element is wholly on screen and uncovered at its centre) and states `site-skip` (Jezero), `site-skip-jump` (after the tap: Compare and "Closest doubles on Earth" at the top), `site-skip-searching` (a pin's 6 s search), `site-skip-malapert` (the longest lede, two lines on the phone). Decisions 115 |
| 2 | Decisions 8 ("keep bodies turning at the time rate, with the camera tracking the site") never landed and nothing recorded it: the compare globes and the coordinate preview still froze the body, as the prototype did | Fixed (Decisions 8, amended), drawn in the body's own frame: a held body keeps its site where the hold put it, its light already followed the sim clock (the real subsolar point, so the terminator crosses it at the time rate), and now its viewport's stars wheel the other way about its axis at the rate it would spin (`scene/frame.ts`; a star turn per viewport, `Viewport.starQ`, which `post.ts` sets before each viewport draws). The frame a camera turning with the body would see, without moving the rig or the orientation that the hold, the dive and the markers are built on. Live views (body, site, compare) only; none under reduced motion. New states `coord-held-20s`, `compare-globe-held-20s` (20 s on: the point centred, the terminators moved, the stars turned) |
| 3 | Must 5's "crops for … their top doubles": only the 14 established Earth sites had real crops; the mock's Earth cells, the top doubles on the demo path (Jezero's rank 1 in New Mexico, Rima Hadley's in Alaska, the coordinates example's in China), were cut from the 4K Blue Marble globe: on the main booking path the listing's "Context, 226 km" was a blur and "Regional, 66 km" one flat beige square. Logged only as a Known limit | Fixed: `npm run fetch:real -- --only=sites` runs the same Landsat WELD routine for the mock's 19 cells (the script's cell list: the examples' and `MADE_UP_CELLS`), at their compare window's 225.6 and 65.8 km: 38 files `crops/earth-cell-*`, 4–18 KB, 420 KB in all; 32 WELD, 6 WELD with Blue Marble specks (Hawaiʻi's and New Zealand's sea, Alaska), none Blue Marble alone. The 80 other outputs byte-identical. The listing's strip and its "Images: Landsat WELD…" line find them through `cropOf`, whose key is now by value (Decisions 116): a double's centre comes back through its route, -105.075 as -105.07499999999999, and the float key missed it (the new test caught that). `docs/credits.md` updated. `book-listing` waits 400 ms of real time for the crop files (they draw when they land) |

**Tests** (267, was 266): `real-sites.test.ts`: every mock cell's context and regional crop is found by `cropOf` at
its Earth pin's centre, from the shipped manifest (failed before the key fix).

**Verification** (2026-10-20). typecheck, 267 tests and build (copy check) green. Full capture, 148 states × 2
viewports (296/296); console errors only the intended 404s of `site-nodata-fallback`, `system-moon-late` and
`body-moon-late`; the four desktop states captured while an edit to `frame.ts` reloaded the dev server were re-run.
`inView` passed for all four skip states at both sizes. Looked at: the four `site-skip*` states at both sizes (the
link under the lede at ~318 px of the desktop panel, on the phone's sheet at ~648 px of 844; "Searching Earth…" on
the pin; Malapert's two-line lede; the jump puts Compare and "Closest doubles on Earth" at the top), `coord-valid`
against `coord-held-20s` and `compare-globe-cell` against `compare-globe-held-20s` (the point and both sites centred,
sub-solar 121.0° E → 72.4° E on Mars, dawn reaching the US on Earth, the stars turned), `book-listing` at both sizes
(WELD context and regional of the New Mexico cell, "Images: Landsat WELD true-colour composite, 1999 · …"); for
regressions `site-jezero-media`, `site-skip-malapert`, `dive-0.8s`, `compare-globe` (and its sheet), `results-jezero-list`,
the phone `system` sheet: as before, the site panel's content ~40 px lower.

**Known limits.** Engine cells past the mock's 19 keep the globe cut (Merge notes). The stars wheel only while a body
is held: a globe that isn't (the body view with no site) spins as before, its stars still. The skip link's label
doesn't count the doubles (Decisions 115).

### Overlay compare (Should 1, done)

**What.** A third compare mode beside Terrain and Globe: Overlay (`#/mars/jezero/compare/<double>/overlay`, also before
a booking step, `…/overlay/book/plan`). One terrain viewport shows both blocks of the compare, over the same 18.8 km
window at the compare's one vertical exaggeration (same scale), the Earth double's ghosted onto the target's; a slider
between them sets the mix, from the target alone (0) through half and half (the default) to the double alone (100).
The panel's terrain twins (when the double is a search result) overlay the same way, at the same mix: one tile, the
cell's hillshade over the target's, the two names at either end as on the slider.

**Where.** `routes.ts` (`Route.overlay`, `/overlay` parsed and written; globe wins if both are set), `router.ts` (the
toggle's third button; `buildScenes` sets the ghost from the route; a same-key `setTerrain` rebuilds the overlay UI;
terrain off turns the ghost off), `views/compare.ts` (split 0 for the overlay; terrain and overlay share their scenes,
so no curtain between them), `terrain/mesh.ts` (`ghost {on, t}`, `ghostOrder`, `drawTerrain`; the terrain and skirt
materials are transparent, drawn identically at alpha 1), `scene/post.ts` (terrain viewports draw through
`drawTerrain`), `scene/frame.ts` (the overlay frames the taller block), `ui/terrain-ui.ts` (the caption lists both
sites; the legend has a ramp per world, labelled Mars/Moon and Earth, and both contour intervals; the note both
sources), `ui/chrome.ts` (the slider: shown with Overlay, labels, `aria-label` "Overlay, from Jezero Crater to Lake
Salda", `aria-valuetext` from `mixText`; it sets `ghost.t` and `--mix` on the panel), `ui/results.ts` (`twins(…, ov)`,
`mixText`), `ui/panel.ts` (passes the mode), `index.html` (the Overlay button and `#mix`), `styles/hud.css`,
`styles/panel.css`, `styles/responsive.css`.

**The ghost** (Decisions 117). Both blocks render from the same camera into the one viewport: the heavier one (by the
slider) solid, the lighter one over it at its weight (never above .5) with depth cleared, so it shows whole like an
onion skin; its own depth goes first, so only its nearest surface blends (no back faces showing through). Wherever both
cover, the frame is (1 − t)·target + t·Earth exactly; at 0 and 100 one block alone. Each keeps its own ramp and
contours, so the ghost reads in the colours of the side-by-side view; where one block rises above the other, that part
shows at its own weight over the ground.

**The slider** (Decisions 118). In the compare toggle, after a divider as Same scale is on the globes: "● Mars —●— ●
Earth" (the target's world and colour, the Moon's on a Moon site). A native range input, 0–100 in steps of 5: arrows,
Page Up/Down, Home and End work; the focus ring is the app's. On a phone the toggle sits at the top of the sheet and
the slider takes a row of its own under the three buttons. Its value isn't in the route (the plan's example is the
mode) and keeps its place for the session.

**Tests** (271, was 267): `routes.test.ts` (overlay round-trips with every booking step, `/overlay` alone and before a
step, globe wins, no overlay outside a compare), `terrain/mesh.test.ts` (new: `ghostOrder` gives (1 − t, t) wherever both
cover, the ghost never the heavier, one block alone at either end), `ui/results.test.ts` (`twins` with `ov`: one tile
class, both windows, the note; `mixText` at the ends and between, no percent sign).

**Harness.** New refNA states: `compare-overlay-50` (deep link to Jezero and its first cell, at the default),
`compare-overlay-0` (the slider set to 0), `compare-overlay-100` (End on the keyboard), `compare-overlay-twins` (back to
50, the panel at the twins), `compare-overlay-toggle` (from Terrain by the toggle, half a second in: the Earth half
narrowing away, the ghost already on), `compare-overlay-salda` (an established site: no twins; the lake through the
crater), `compare-overlay-nodem` (Malapert, no elevation data: the note once, for the Moon's block; Moon and Earth
ramps; the slider "● Moon —●— ● Earth").

**Verification** (2026-10-20). typecheck, 271 tests and build (copy check) green; app and renderer chunks 139 + 164 KB gzip.
Full capture, 154 states × 2 viewports (308/308), then `compare-overlay-nodem` and `book-established` after a fix to
the notes' index (viewport 1's no-data note keyed on the target's search); console errors only the intended 404s of `site-nodata-fallback`,
`system-moon-late` and `body-moon-late`. Looked at the six new states at both sizes: at 0 Jezero's block alone, at 100
(by End) the cell's alone with the slider's focus ring, at 50 both, contours of each showing through; the twins tile
follows the slider (0, 50, 100), names at either end; mid-toggle the Earth half narrows while the ghost is on; Salda's
lake shows through the crater and its taller rim rises above Jezero's block. Regression: the states the change can
reach (title, system, body-mars, coord-valid, dive-0.8s, site-jezero, -gale, -haughton, -pin-hadley, -jezero-media,
compare-jezero-salda, -globe, -jezero-cell, -twins, results-jezero-detail, book-listing, book-globe) captured at
HEAD and diffed against this build: every site and terrain view pixel-identical (the transparent terrain materials
draw as before at alpha 1); on compare only the toggle differs (its third button) plus a few sky specks that differ
between runs in untouched states too; on the phone the toggle with Same scale still fits the sheet on one row.

**Known limits.** Where only one block covers (one block's silhouette above the other's), that block shows at its own
weight over the ground rather than blending with the other (the cost of no offscreen buffers, Decisions 117). Each
twin is still at its own contrast (Results rework 2/4), so the overlaid tile compares shapes, not brightness. On a
phone the overlay's taller legend (two ramps) sits on its plate over the right of the block, as the site view's does.
The slider's value isn't deep-linked.

### Overlay compare review fixes (done)

Thirteen findings from the review of Should 1 (2026-10-20), two major. All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 12 | (major) Leaving the overlay for the site view (Back, Esc, a crumb): until the curtain's swap `ghost.on` stayed true while the route had no double, so `placeTUI` wrote the second caption from `siteOf('earth', null)!` and threw every frame (`__eidolon.route('#/mars/jezero')` rejected) | Fixed in `ui/terrain-ui.ts placeTUI`: the overlay's second caption (its key and the caption opacity) only when `state.view === 'compare' && ghost.on`; `cap` takes the route's ids as they are and writes nothing for a missing site (no non-null assertion). New state `compare-overlay-back` (the overlay seq, then route `#/mars/jezero`, seek 1.2): FAILS on the previous commit with that TypeError, passes now |
| 13 | A curtain's `atSwap` closure kept the route from when it started: Salda to Haughton (curtain), then Overlay 0.1 s later; the swap ran after the same-key call and turned the ghost off, so the overlay showed Jezero alone and the slider did nothing | Fixed in `router.ts`: `setGhost()` is the ghost's one writer, read from the route at the moment the scenes are built (`buildScenes`, also on late elevation), swapped off, or kept on a same-key route; `playCompare` passes no closure. New state `compare-overlay-race` (those three routes, seek 2): Jezero alone on the previous commit, both blocks now |
| 1, 6 | Desktop layout at 760–~880 px wide (iPad portrait): the toggle with the slider (~472 px, `max-content`) was wider than the stage (408 px at 768), centred on it, so ~32 px ran under the panel and ~32 px off the right edge | Fixed in `styles/responsive.css`: up to 879 px wide (the phone included) the slider takes a row of its own under the view buttons (the phone's rules, now shared), the toggle 262 px wide; between 760 and 879 px the overlay's legend sits 32 px higher, clear of the taller toggle. The harness gains an opt-in `tablet` viewport (768 × 1024, `--viewports=tablet`, not in a full run): `compare-overlay-50/-0/-100/-nodem/-illustrative` and `compare-globe` there show the toggle inside the stage (x 433–695 of 360–768) and the legend above it |
| 2, 10 | The overlay's note and contour line merged both blocks without saying whose: "Illustrative terrain. Terrain: Copernicus DEM GLO-30." (which block?), "Contours every 500 and 25 m", "Terrain: LOLA… Terrain: Copernicus…" | Fixed: `ui/results.ts terrainNote` (tested) says each source by its world when the two differ ("Mars: illustrative terrain. Earth: Copernicus DEM GLO-30.", "Moon: LOLA south polar DEM, 240 m. Earth: Copernicus DEM GLO-30."), once when they share it (both illustrative, both the engine's), and as before on one block; the no-elevation sentence still leads (it names the Moon). Contours "every 500 m (Moon) and 25 m (Earth)" when they differ. New state `compare-overlay-illustrative` (Arcadia, illustrative, on Haughton) |
| 3, 5 | Phone: the overlay legend (two labelled ramps, min and max under each, the contour line) was ~194 px tall on its plate, over the right third of the one block and up to the caption | Fixed: the overlay legend is a row per world at every size (dot, name, ramp, "−2,740 m to −2,502 m" in fixed columns, so the ramps line up; Decisions 120); on a phone the names drop (the captions above name each dot) and the plate is 210 px wide: ~100 px tall (y 243–356 at 390 × 844, was 162–356), clear of the captions, the site view's plate size. Logged as a deviation: the phone's compare layout is the Touch item's |
| 7 | Phone: the slider sat at the top of the scrolling sheet, out of view at the overlaid twins it drives | Fixed: with the slider shown, the toggle sticks at the top of the sheet (`position:sticky`, the sheet's ground behind it and over the 8 px above), and the sheet's `scroll-padding-top` puts what it scrolls to (Other doubles' jump) below it; `placeChrome` leaves the toggle's `left` unset in the sheet (a sticky element would read it as an offset). The harness's `scroll … to` honours a scroller's `scroll-padding-top` (12 px when none, as before) |
| 8 | The overlaid twins were two greys: at 50 an even grey with nothing saying which relief was whose; the captions lacked the slider ends' world dots | Fixed: overlaid, each figure carries its world's colour token: a dot by its caption, and its hillshade lightly tinted (`mix-blend-mode: color`, .35) so the two reliefs read apart in the ghost, as the 3D ramps do. Side-by-side twins unchanged (pixel-identical `compare-twins`) |
| 9 | No states for the overlay before a booking step, or for overlaid twins without a hillshade (the placeholder ghosted over Jezero's, the note still saying the slider mixes them) | Fixed: states `compare-overlay-book` (`…/overlay/book/plan`: the slider stays in the toggle, it drives the stage behind the plan) and `compare-overlay-noimage` (`?mock=noimage`); a twin showing its placeholder is no longer ghosted: the pair stays side by side and the note drops its overlay sentence (`panel.css`, `:has(.ph)`; Decisions 121) |
| 4 | No `shortcut:` comments on the two known limits | Fixed: `terrain/mesh.ts drawTerrain` (no offscreen buffers: one block alone at its silhouette shows at its own weight) and `ui/chrome.ts mixed` (the slider's value isn't in the route) |
| 11 | Compare sheets of four states were written from the previous commit's build images | Fixed by the full capture below, which rewrote every sheet after its build images |

**Tests** (273, was 271): `ui/results.test.ts`: `terrainNote` (one block; two sharing a source; two differing, by world,
the engine's included); the overlaid twins carry `--c:var(--mars)` and `--c:var(--earth)`, a dot in each caption, the
note's overlay sentence in its own span; the side-by-side twins none of these.

**Harness.** New states `compare-overlay-back`, `-race`, `-illustrative`, `-book`, `-noimage` (refNA). Opt-in viewport
`tablet` (768 × 1024). `scroll … to` lands at the scroller's `scroll-padding-top` when it has one.

**Verification** (2026-10-20). typecheck, 273 tests and build (copy check) green; app and renderer chunks 139.7 + 166.2 KB
gzip (HEAD 139.4 + 166.2). The two new regression states run against the previous commit: `compare-overlay-back` failed
with the TypeError, `compare-overlay-race` showed Jezero alone; both right now. Full capture, 160 states × 2 viewports
(320/320), every compare sheet rewritten after its build image; console errors only the intended 404s of
`site-nodata-fallback`, `system-moon-late` and `body-moon-late`. Tablet (opt-in): `compare-jezero-salda`, `-globe`,
`compare-overlay-50/-0/-100/-nodem/-illustrative`. Looked at the overlay states at both sizes (and tablet): the legend
rows (phone y 243–356, was 162–356; desktop at the block's lower right as before, ramps lined up), the attributed notes
and contour lines (`-nodem`, `-illustrative`, `-race`), the tinted twins with their dots (`-twins`), the toggle stuck at
the top of the phone's sheet over the twins, the unghosted pair with no overlay sentence (`-noimage`), the slider during
the plan step (`-book`), Jezero's own caption and legend after Back (`-back`). Regression: `compare-twins`,
`compare-jezero-salda`, `-jezero-cell`, `-twins-noimage`, `compare-illustrative-table`, `site-jezero`,
`results-jezero-detail` byte-identical to the previous commit's captures at both sizes, `compare-globe` too on the
desktop (on the phone a few sky specks, as between any two runs).

**Known limits.** On a phone the overlay legend still covers the block's lower right (smaller than the site view's
plate) and the second caption sits close to the block's back edge: the phone's compare and terrain layout is the Touch
item's (Deviations). The tablet viewport isn't in a full run (a full run stays at the plan's two sizes).

### Overlay compare review fixes, round 2 (done)

One finding (major, visual) from the second review of Should 1 (2026-10-20). Fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Phone (390 × 844), `compare-overlay-salda/-50/-nodem/-illustrative`: the legend's plate (210 × ~115–130 px, y ~226–358) sat over the one block's centre right, hiding Salda's lake, and the second caption's last line ("Earth, 18.8 × 18.8 km") ran onto the block's back corner | Fixed, the finding's second option (Decisions 123): `scene/frame.ts` frames the overlay's block on the sheet at ~69 % (camera 1.45× as far) and ~40 px left (camera and target step 2.3 units along the camera's screen right), weighted by `1 − LAY.split` so the toggle eases into it; `styles/responsive.css` keeps the phone's plate with its two rows and moves the contour and exaggeration line (`.ct`, `ui/terrain-ui.ts`) to screen readers only (the `#area .t` clip). Measured on the captures (coloured block pixels): the block x 43–267, top y 171 (`-50`), 182 (`-salda`), 173 (`-illustrative`), was x 27–352 from y 147, so it starts ~10–20 px below the second caption's last line (y ~161); the plate y ~283–360 (was ~243–358) clips only the block's front corner; Salda's lake is whole. The finding's first option (the legend unplated below the block) doesn't fit: under the two captions the visible stage has ~225 px, and a ~105 px legend below would leave a block ~140 px wide |

**Harness.** No new states: the finding's four states are the check; `compare-overlay-salda` and `-nodem` checks say
what the phone shows now.

**Verification** (2026-10-20). typecheck, 273 tests and build (copy check) green. Full capture, 160 states × 2
viewports (320/320); console errors only the intended 404s of `site-nodata-fallback`, `system-moon-late` and
`body-moon-late`. Looked at the phone's `compare-overlay-50/-0/-100/-salda/-nodem/-illustrative/-twins/-race/-book`:
the block below both captions, the two-row plate on its front corner at most, Salda's lake whole; `-toggle` (half a
second in) the narrowing block easing toward that framing; `-back` Jezero's site view framed as before. Desktop
`compare-overlay-salda` unchanged (the contour line shown, the block as before: `sheet()` is false there);
`compare-jezero-salda` on the phone unchanged (the ghost is off, so k is 0).

### Site selector grid (Should 2, done)

**What.** The map-select screen: a target world's six featured sites as cards, each with the hillshade of its 18.8 km
window, its name, kind and point (4 dp), and its three closest doubles on Earth as rows (hillshade, country with the
established-site tag, shape match), from the site's own search for the current purpose and filters. A card's head opens
the site (the dive runs as the grid fades); a double opens the comparison. Where the engine has no elevation (the
Moon's south-pole regions, no_dem) a card lists the site's established analog sites instead, unscored, said so. Every
search state shows on its card: waiting its turn, searching, "Reading Mars terrain…" with its bar, starting up,
failed ("Open the site to try again"), no match for the filters, the engine's no-match line.

**Where it lives** (Decisions 124). `#/mars/sites`, `#/moon/sites`: the body view with the grid over its globe, beside
the panel and its Featured sites list (the plan's "beside the list"); the globe stops rendering while the grid covers
it. On a phone the sheet slides away and the grid takes the screen under the top bar, one card per row, scrolling.
Reached from the body panel's link under the lede ("Featured sites and their doubles ›"), the system view's new
Featured sites cue (bottom left, opposite Beyond; it opens Mars), and the grid's own world switch (Mars | Moon). Its
"‹ Mars" button, the crumb and Esc go back to the globe. Earth has no grid (`#/earth/sites` is the Earth body view).

**Modules.** `routes.ts` (`Route.grid`, `/sites` parsed and written, a site wins), `router.ts` (state, Esc, `playGrid`
from `apply`), `views/body.ts` (the sheet away on a phone), `views/grid.ts` (new: show and hide, the searches, the
cards' doubles redrawn in place through `swap`, `gridCovers` for `scene/frame.ts`), `ui/grid.ts` (new: `gridHTML`,
`gridCard`, `gridDoubles`), `data/client.ts` (`searched`: a site's search without asking it; `targetImage`: a named
target's image path; `ownShadeOf`: a window drawn from Eidolon's own elevation), `ui/panel.ts` (`thumbs` reads
`data-own`, after `data-shade` answers no_dem or alone; `thumbs`, `bars`, `swap` exported; the link under the lede),
`ui/results.ts` (`backBtn` moved here, pure, so the grid's templates are testable), `ui/chrome.ts` (the crumb),
`views/system.ts` and `index.html` (the cue, `#grid`), `styles/grid.css` (new), `styles/hud.css`, `styles/panel.css`,
`styles/responsive.css`.

**Searches** (Decisions 125). The grid asks what the site view would: one search per site and query, kept by
`data/client.ts`, so a card and its site view agree and opening one costs nothing. By name all at once (the engine's
cache, milliseconds); by coordinates one at a time in the grid's order (spec §8; a newer one calls the last off),
waiting on one already under way, only while a grid shows; a world switch mid-chain moves on to the new world when the
search under way settles. Warming searches are asked again every 3 s, as the site view's.

**Hillshades** (Decisions 126), through the data seam as the result cards': a named target's from the engine's image
path (`targetImage`, `imageOf`), a target by coordinates' window drawn from the engine's elevation (`shadeOf`, as its
twin), a cell's from `terrain_twins[0].earth_url`; the south-pole regions (no_dem) and the established analog sites from
Eidolon's own elevation (`ownShadeOf`: the LOLA polar DEM, Copernicus patches). The foot says how they're drawn (mock:
"from the elevation models the search engine reads where Eidolon has them, elsewhere illustrative") and credits the
elevation models, Copernicus's notice whole.

**Tests** (281, was 273): `routes.test.ts` (`/sites` on Mars and the Moon, none on Earth, round trip, a site wins, the
maps it opens on), `ui/grid.test.ts` (new: three doubles each to its comparison with the engine's hillshade, country and
shape match; engine strings escaped; the no-match line; no_dem's established sites with `data-own`; every search state,
skeleton rows only while rows are to come; a named target's encoded image path, a point's shade and own; six cards, the
world switch, purpose, tested line; no percentages).

**Harness.** New refNA states `grid-mars`, `grid-mars-done`, `grid-mars-foot`, `grid-switch`, `grid-moon`, `grid-open`,
`grid-dive`, `grid-system`, `grid-back`, `grid-fail` (see the States table).

**Verification** (2026-10-20). typecheck, 281 tests and build (copy check) green; app and renderer chunks 141.9 +
166.2 KB gzip (HEAD 139.7 + 166.2). Full capture, 170 states × 2 viewports (340/340; the three `skip-*` desktop states
first failed on a dev-server reload from an edit made mid-run and passed on their rerun); console errors only the
intended 404s of `site-nodata-fallback`, `system-moon-late` and `body-moon-late`. Looked at the ten new states at both
sizes: Mars's cards at 3 s (named filled, Arcadia reading with its bar, two waiting) and at 21 s (all filled, the
Hanksville tag on Arcadia's and Elysium's), the foot (tested line, hillshade note, credits), the switch to the Moon,
the Moon's south-pole cards with their established sites and LOLA hillshades, the fade in from the panel's link, the
dive from a card (the grid gone by 0.6 s), the system cue (bottom left at both sizes, clear of the info cue and Beyond on
the phone), Esc back to the globe (the link under the lede), `?mock=fail` (each card's failure line, no skeleton). The
first pass had coordinates wrapping their last letter and failures over skeleton rows: fixed (nowrap halves; rows only
while some are to come). Regression: `system`, `body-mars`, `body-moon` (the panel's new row; on the phone the sheet's
fields ~40 px lower), `site-*`, `results-*`, `compare-*`, `book-*` looked at on both sizes: unchanged but for that row.

**Known limits.** The panel beside the grid is the body view's: its coordinate field previews a pin on the globe under
the grid, unseen until Open goes there (`shortcut:` in `views/grid.ts`). Cards show three doubles and no Show more (the
site view has the 20). The grid's scroll isn't kept across visits; the purpose is changed on a site, not on the grid.

### Site selector grid review fixes (done)

Fifteen findings (independent review of Should 2, 2026-10-20), several the same defect seen twice (2 = 9, 1 + 3 = 10,
8 = 11 = 15). All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 10 | No capability banner on the grid: Jezero, Gale (crater, fair) and Rima Hadley (rille, fair) showed results without it (spec §2, §5.2; plan Must 4) | Fixed: `gridDoubles` puts `banner(res.target)` between the card's "Closest doubles on Earth" and its rows (compact in `grid.css`: 12 px, 8 × 10 padding). Tested on Jezero's fair tier (9 of the 17), none for a good tier |
| 2, 9 | A double's row showed only the country: Arcadia's, Meridiani's and Elysium's three read "United States of America · Shape match High" alike, same accessible names; no point at 4 dp (plan Gap 3, spec §5.5) | Fixed: a row is now the result card's head, shared (`cardHead` in `ui/results.ts`, which `card()` uses too): rank and notes, country, the Earth point at 4 dp in mono, the established-site tag, shape match; country on its own line (Decision 127's reason kept), the hillshade 48 px (was 40) beside four short lines. Tested: three distinct points |
| 3, 10 | No notes marker (spec §5.1: every result carries at least 2 caveats) and no rank on a row; the no-close-analog line in `.fine` (spec §5.3: prominently) | Fixed: `cardHead` brings the rank and the NOTE marker with its count; the no-analog line is a `.lede` (13.5 px in a card). Tested |
| 4 | The card didn't say which IAU feature was searched (Hadley–Apennine is searched and imaged as Rima Hadley, ~18 km from the printed point), nor that Gale, Utopia, Taurus Littrow Valley are larger than the 18.8 km window (spec §3.4) | Fixed: `targetNote(res.target, s.name)`, the site view's, under the card's point once its search lands ("Searched as the IAU feature Rima Hadley · Rima · ≈ 116 km across. Larger than the 18.8 km comparison window…"). Tested |
| 5 | No `loading="lazy"` on the grid's tiles (spec §3.7); a failed hillshade left a blank tile, alike to one still loading (spec §6: a placeholder) | Fixed: every grid tile is lazy (engine mode sets `src` to the URL, so the browser defers the off-screen ones). In `ui/panel.ts` `thumbs`, a missing hillshade now puts `NO_SHADE` in the tile (was: the image removed), and a result without a URL gets it at once (`thumb` in `ui/results.ts`): a dashed tile with "No hillshade for this window" (in the 48 px rows the words are for screen readers only). The result cards in the panel get the same (shared code). Decisions 131. New state `grid-noimage` |
| 6 | The cards' doubles boxes had no `aria-busy`/`aria-live` | Fixed: `aria-busy` on every box (true until its search settles, `views/grid.ts` sets it); `aria-live="polite"` only on the cards searched by coordinates (one at a time, seconds apart); by name they land together at open, under the heading's focus, unannounced. The grid's failure box is live too. Tested |
| 7 | A site or compare opened from the grid had no way back to it: Esc, the panel's back button and the crumbs went to the globe | Fixed: `state.fromGrid` (`router.ts`): set when a site or compare opens from the grid, kept while on that site and its compare. Esc from the site, its back button ("‹ Featured sites") and the crumbs ("Solar system / Mars / Featured sites / Jezero Crater") go back to the grid; the status says "Esc returns to the featured sites." Decisions 129. New states `grid-site`, `grid-return` |
| 8, 11, 15 | `grid-fail`'s check and the progress note said "every card failed, over skeleton rows" against a capture where Arcadia still read and two waited, and the code drops the skeletons; no grid state for `?mock=warming`, `?mock=empty`, the waiting line (below the fold), and `grid-dive` at 4.6 s showed the grid already gone | Fixed: `grid-fail` seeks 19.5 s (by coordinates the mock fails at 6, 12, 18 s), its check says what shows; new `grid-warming`, `grid-empty`, `grid-wait` (scrolled to Meridiani's card); `grid-dive` at 4.3 s. Filters on ("No Earth sites match these filters") stays unit-tested only: setting a filter needs a site's form, and the line is the same template |
| 12 | Every error read "The search failed…", whatever its code; all six cards repeated it with no retry in the grid; a missing tile looked like a loading one | Fixed: the card's line is keyed on the code (`failHead`: "The search engine didn’t answer. Open the site to try again."); when every search of the world failed (none answered, running or warming; no_dem is an answer), one `failure()` box above the cards with Try again, which asks the failed ones again (not no_dem) through `askGrid(true)` (Decisions 130); the placeholder as in 5. Tested (`gridFail`) |
| 13 | Beside the grid the panel still said "Or click the surface to drop a pin…" over a covered globe; on the Moon its lede said the south-pole regions "show terrain only" while the grid's said they "list their established analog sites, unscored", the 60° sentence twice side by side | Fixed: while the grid shows, the panel drops the pin hint and its 60° sentence (the grid's lede says it at both sizes); the panel's own lede now agrees with the grid's: "…so the south-pole base regions list their established analog sites, unscored, for now." (`body-moon`'s check updated) |
| 14 | The panel's target was set once per route: crossing 760 px with the grid open left the sheet over the cards (phone) or no panel and a frozen strip (desktop); `gridCovers` paused rendering while the panel was still sliding in | Fixed: `gridCovers` also waits for the panel (`sheet() \|\| LAY.panel > .999`); a resize while the grid shows tweens the panel to its target (`views/grid.ts`). Checked with an ad-hoc Playwright resize 1280 → 390 → 1280: the sheet off-screen (y 844) on the phone, the panel back at x 0 on the desktop |

**Harness.** New refNA states `grid-wait`, `grid-site`, `grid-return`, `grid-warming`, `grid-empty`, `grid-noimage`;
`grid-fail` at 19.5 s and `grid-dive` at 4.3 s; checks of `grid-mars`, `grid-moon`, `body-moon` updated (States table).

**Tests** (285, was 281): `ui/grid.test.ts` (rows as a card's head: rank, notes, point, three distinct points; the
IAU feature note and banner above the rows, none for a good tier; the placeholder for a double without a hillshade;
the failure line keyed on the code; `gridFail`: one box keyed on the code with Try again, none while any waits, runs,
warms up or answered, none for no_dem alone; the boxes' `aria-busy`/`aria-live`), `ui/results.test.ts` (a card
without a hillshade URL shows the placeholder).

**Verification** (2026-10-20): see the Log entry.

### Site selector grid review fixes, round 2 (done)

One finding (independent review, 2026-10-20), fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Focus management on the grid did nothing on most entry paths: `playGrid` focused the grid's heading while `#grid` was still `visibility: hidden` (autoAlpha shows it on its first tick), and the panel's heading (Esc from the grid, a site opened from it on a phone) while `#panel` was hidden (`frame()` shows it once `LAY.panel` passes .01). Focus ended on `<body>` from the panel's link and the system cue at both sizes, on the panel's "Moon" heading after Esc from a grid site on a desktop, and on `<body>` on every phone path but the world switch | Fixed at the root: the grid is shown (`gsap.set` visibility `inherit`) before its heading takes the focus; a route's focus into the panel goes through `focusPanel` (`scene/frame.ts`): at once when the panel shows, else on the frame that shows it, unless the focus moved meanwhile (to the grid's heading, focused right after). `renderPanel` and the grid's hide use it, so the phone sheet's heading also gets the focus after any route that brings the sheet in, and the panel's after the system view (Decisions 132). Capture checks `#grid h2:focus` on `grid-open`, `grid-system`, `grid-return` and `#pin h2:focus` on `grid-site`, `grid-back`: all failed on the old code at both sizes (but desktop `grid-site`), all pass |

**Verification** (2026-10-20): see the Log entry.

### Touch (Should 3, done)

**What.** On touch, two fingers on the globe or the terrain pinch to zoom (the wheel's limits), twist (the block's
bearing turns with them, a globe turns about the line of sight) and move together to orbit as one finger does; a
finger landing on a marker joins the pinch. On a phone the bottom sheet has a grip: drag it between peek (112 px plus
the safe area: the grip, the back link and the heading; on compare the toggle), half (54 %, as before) and full (up to
the top bar). A slow release settles on the nearest snap, a flick goes on to the next one its way; a tap, Enter or
Space steps it up and round, the arrows step it, Home and End go to the ends. Snaps move as the info sheet does (0.85 s
up, `power3.out`; 0.7 s down, `power3.inOut`), at once with reduced motion. The stage follows the sheet live: the
viewports end at its top edge. Compare on a phone stacks the pair (the target above its double), each block framed
beside its legend and each globe beside its caption; a lone block above the sheet (site, overlay) frames clear of the
legend's plate in a wide viewport, and every one whole and centred in a tall one (the sheet at peek). Mouse and wheel
behave as before.

**Where.** `src/gesture.ts` (new, pure: `snapTo`, `twoFinger`), `scene/input.ts` (pointers by id, two make a pinch;
`pend`, a finger on a marker; `orbit`, `zoom` (the wheel's), `pinch`; the stage takes the pointerdown, the canvas the
rest), `scene/layout.ts` (`SH`, the snap and the height now; `snapF`; `L.peek` with the safe area), `ui/sheet.ts` (new:
the grip's drag, release, click and keys; `setSnap`; `sheetCovers`), `scene/rig.ts` (`computeRects`: down to the sheet's
top edge, stacked on a phone), `scene/frame.ts` (the panel's height; covered at full; the terrain framing `k1`/`k2`),
`ui/chrome.ts` (the toggle under the grip, the divider across, the status line and Search this area on the sheet, the
stage's overlays hidden under a full sheet), `ui/panel.ts` (a new panel opens the sheet at half), `index.html`
(`#grip`; the canvas label "scroll or pinch to zoom"), `tokens.css` (`--peek`), `styles/panel.css`,
`styles/responsive.css`, `terrain/procedural.ts` (its shortcut, Decisions 137).

**Decisions** 133–138. **Tests** (292, was 285): `gesture.test.ts` (new: the nearest snap on a slow release; a flick
on to the next its way, from anywhere between, stopping at the ends; spread and pinch as the wheel's factor; the
midpoint's move; twist clockwise +, wrapped across ±π; fingers on one point give no zoom).

**Harness.** New step `touch` (CDP touch points, as a phone sends them, so `touch-action` holds: one or two fingers, a
move, a spread, a twist, a still hold before the lift) and the seq option `only` (`phone`: the desktop context has no
touch, and no grip). New refNA phone states (390 × 844): `sheet-half`, `-peek`, `-full`, `-keys`, `-flick`, `-rm`;
`compare-phone-half`, `-peek`, `-globe`, `-pinch`, `-overlay`; `pinch-terrain`, `orbit-terrain`, `pinch-globe`,
`touch-pin` (see the States table).

**Verification** (2026-10-20). typecheck, 292 tests and build (copy check) green; app and renderer chunks 143.9 +
166.2 KB gzip. Full capture, 191 states (176 at desktop, 191 at phone: the 15 touch states are phone only), 367/367;
console errors only the intended 404s of `site-nodata-fallback`, `system-moon-late` and `body-moon-late`; then the ten
compare globe states at both sizes again after framing the stacked globes (22/22). Looked at every new state: the grip
at half; peek (the block whole and centred, its plate clear); full (the stage hidden, nothing through the top bar);
keys (the focus ring on the pill, at half: asserted by the label); a 120 px flick on to peek; reduced motion at peek a
frame after the release; compare stacked at half (blocks right of their legends) and at peek (larger, the toggle in
the peeked sheet), Globe kept at peek, a pinch with one finger on an Earth pin zooming and turning Earth only (a
probe showed that finger's pointerdown on the marker: before the stage took it, only the other finger drove, as a
drag), the overlay at peek; the block pinched to the zoom limit and turned 45° with the north arrow, two-finger orbit
from higher up; the globe pinched to the 10° grid and turned, no pin; a one-finger tap still pins. A Playwright
probe at desktop: a mouse drag orbits the terrain and turns the globe (no pin), the wheel zooms, a click pins.
Regression: desktop `compare-jezero-salda`, `-overlay-50`, `-globe-pins` unchanged; phone `site-jezero`,
`-haughton` (smaller, left of the plate), `results-jezero` (lands under the grip), `engine-mars-pin-6s`, `-done`,
`compare-overlay-50/-salda/-illustrative` (block top at y 171/181/172, was 171/182/173: below the captions as in
round 2), `-twins` (the toggle sticks under the grip), `compare-area`, `grid-mars` (the sheet away), `book-warming`
(the status line on the sheet, the lower legend above it).

**Known limits.** The sheet drags by its grip only (review fixes: at peek by its content too): its content keeps the
browser's scrolling (pulling down at its top doesn't close it), since a pointer can't take a pan over from the browser
once it starts. A pinch on the panel zooms
the page (the browser's own). Touch was checked with Playwright's CDP touch on SwiftShader, not on a real phone; nor is
the terrain generation's cost on one (Decisions 137). Compare at half on a phone gives each block a 390 × 168
viewport: legible, larger at peek.

### Touch review fixes (done)

Nineteen findings (independent review of Should 3, 2026-10-20), several the same defect seen twice (1 = 12, 4 = 17,
9 = 19). All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 12 | The visible gesture copy was mouse-only: the body panel's hint ("click … scroll to zoom"), the map's caption ("Hover the map…", "Click to move the pin"), the status hints and the HUD hint on a touch tablet | Fixed: `TOUCH` (`motion.ts`, `(pointer: coarse)`, read once) picks the copy: "Or tap the surface to drop a pin. Drag to rotate, pinch to zoom."; the status "Pinch to zoom." and "Tap the surface…"; the HUD "[ Tap the surface to pin a site ]"; the map's caption drops Hover on touch ("Tap the map to move the pin." on a movable pin, else none). The canvas label says "click or tap". Decisions 139 |
| 2 | A phone hides the stage's terrain note, so an illustrative site (`#/mars/arcadia`) showed no caveat: the panel's credit line named a DEM only | Fixed, the finding's second option: `siteMedia` (`ui/panel.ts`) always says the terrain's source, "Terrain: illustrative." where it has none (both sizes). Compare already said it in its panel ("Where a side's terrain is illustrative…") |
| 3 | The stacked compare made "Contours every … Vertical exaggeration N×." screen-reader only: the shared exaggeration was invisible on a phone, logged only as "without the contour line" | Fixed as the finding suggests: on a phone's compare each terrain caption's line ends ", 3× vertical" (`.vx`, `ui/terrain-ui.ts`, aria-hidden: the legend's line still reads it), the overlay's two captions too; not on Globe. Deviations updated |
| 4, 17 | `#area` (Search this area) set an inline `visibility: visible`, which beat `#ui`'s hidden under a full sheet: it ghosted through the top bar by the clock and stayed Tab-focusable; the graticule's labels the same | Fixed at the root: both now set `visibility: inherit` (`ui/chrome.ts`, `ui/graticule.ts`), so `#ui`'s hidden reaches them. Probe: at full, `#area` computes hidden and `focus()` doesn't land; new state `compare-phone-full` asserts it |
| 5 | Decisions 137 deferred the worker again to a trigger step 1 can't meet; Deviations cited only Decisions 112 | Logged: dropped for step 1 (Deviations, citing 137; not pending on Touch). The shortcut in `terrain/procedural.ts` keeps the trigger |
| 6 | Globe compare at half (the default on a phone) drew each stacked globe ~75 px across, under its label chips (the reference's side-by-side ~120 px) | Fixed, the finding's first option: each stacked globe drawn larger, not smaller (camera 0.95× as far, was 1.45×), right of its caption (40 % of the half-width, was 20 %): ~135 px across in the 390 × 168 viewport, clear of the caption's longest line and of Search this area in the Earth one's corner (`scene/frame.ts`). Decisions 142 |
| 7 | Markers were hidden only on the far side: a pinched Earth's established-site rings leaked into the Mars viewport as live buttons | Fixed: `placeMarkers` also hides a marker whose point falls outside its own viewport (`ui/markers.ts`); `compare-phone-pinch` shows Mars clean, Earth's rings at its own left edge |
| 8 | The divider between the stacked pair was 0 px wide (no `left`) | Fixed: `left:0` in the phone's `#divider` rule; the line shows at the seam in `compare-phone-half`, `-peek`, `-pinch`, `compare-globe` |
| 9, 19 | At peek the overlay's two-row toggle cut "‹ Jezero Crater" at the screen's edge | Fixed, the finding's first option: `snapF(0)` adds the slider row's height while it shows (`scene/layout.ts`); `chrome()` re-snaps a peeked sheet when the slider comes or goes (`ui/chrome.ts`). Decisions 141 |
| 10 | At half the site's plate still covered 20–30 px of the lone block's right corner | Fixed: the lone block steps 15 % of the view left (was 10 %) and a tenth up (`k1`, `scene/frame.ts`); its right corner ends above-left of the plate (`sheet-half`, `site-haughton`, `results-jezero`); the overlay's block moves left with it, clipping less of its front corner under the plate. The stacked pair's blocks sit a tenth lower, below their captions' longer line. Decisions 142 |
| 11 | At peek only the 24 px grip dragged the sheet: a swipe up on the back link or heading scrolled the content in an ~88 px window | Fixed as the finding suggests: at peek `#panel[data-snap="0"]` is `overflow:hidden; touch-action:none`, and a pointer down on its content drags the sheet once it moves 4 px (it takes the pointer only then, so a tap stays its button's: probe, the back link at peek still goes to Mars); half and full scroll natively (`ui/sheet.ts`). Decisions 140. New state `sheet-swipe` |
| 13 | The grip had no hover or active state; the cursor stayed `grab` while dragging | Fixed: the pill in `--text-2` on hover and while pressed, `cursor: grabbing` while pressed (`styles/responsive.css`) |
| 14 | No phone state for the body view at peek, a two-finger orbit on a globe, compare under a full sheet | Added `sheet-body-peek`, `orbit-globe`, `compare-phone-full` (States table) |
| 15 | A pinch on the system view dropping to one finger kept measuring the 140 px swipes from the lifted finger's start: a 6 px move went to Beyond (or opened the info sheet) | Fixed as the finding suggests: `endDrag` re-bases the drag's start on the remaining finger (`scene/input.ts`). A CDP probe at 390 × 844 lifting the first finger (fingers at 340,760 and 160,580; 120,650 and 300,300) went to `#/beyond` and opened the info sheet on the old code, stays on `#/system` now |
| 16 | A stale drag (a lost pointerup) never cleared: every later touch joined a pinch against a phantom point, taps never pinned | Fixed as the finding suggests: a primary pointerdown starts afresh (the drag and the fingers waiting on markers cleared). Probe: a synthetic pointerdown with no pointerup, then a one-finger tap on Mars: no pin on the old code, pins now |
| 18 | The grip's drag didn't keep its pointer: a second finger's pointerup ended the first's drag and snapped by its own position | Fixed: the drag keeps its `pointerId`; other pointers' moves and releases are ignored, and a click during a drag doesn't step the sheet. Probe: finger A drags up, B taps the grip, A goes on to full: on the old code B's lift snapped back to half and A's moves did nothing |

**Harness.** New refNA phone states `sheet-swipe`, `sheet-body-peek`, `orbit-globe`, `compare-phone-full`;
`compare-phone-overlay`'s check says the back link shows whole (States table). The probes for 15, 16, 18 lift one
finger of two (CDP `touchEnd` with that finger's point), which the harness's `touch` step doesn't do: they stayed ad hoc.

**Verification** (2026-10-20): see the Log entry.

### Touch review fixes, round 2 (done)

Four findings (independent review, 2026-10-20); 1, 2 and 4 are one defect. All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 2, 4 | Peek kept the panel's `scrollTop`: scrolled at half (by the user down the results, or by the app keeping the purpose in place during a pin's search), then dragged or tapped to peek, the 112 px peek showed a slice of mid-content that couldn't scroll (`overflow: hidden` there), "‹ Mars" and the heading above it (y −83 at `scrollTop` 500); on compare's Terrain or Globe the toggle (not sticky there) left the peeked sheet, the plan's "toggle unreachable under the sheet" again | Fixed at the root: `setSnap(0)` tweens `#panel`'s `scrollTop` to 0 with the slide (its duration and ease; at once with reduced motion), so peek is always the sheet's top (`ui/sheet.ts`). The app no longer scrolls a peeked sheet either (`peeked()`): the purpose kept in place during a search (`ui/panel.ts` `fill`) and Search this area's row in the filters (`ui/panel.ts`). The offset isn't restored on the way back up (the finding's option; Decisions 143). New phone states `sheet-peek-scrolled` and `compare-phone-peek-scrolled` (scroll at half, then peek; the back link, heading and toggle asserted on screen): both failed on the old code (`#pin .back`, the Globe button not on screen) and pass |
| 3 | Phone Globe compare at half: the selected Earth pin's label chip ("United States of America / Analog site: Hanksville") lay over the magnifier at the Earth viewport's lower right (`compare-globe-pins`, `compare-area`, `compare-globe-held-20s`) | Fixed, the finding's first option: on a phone Search this area sits at the Earth viewport's lower left (`ui/chrome.ts`; anchored by its left edge, `styles/responsive.css`), empty on Globe since the globe and its labels sit right of the caption (Decisions 144). Desktop keeps the lower right. Checked at half (`compare-globe-pins`, `compare-area`, `compare-globe-held-20s`) and at peek (`compare-phone-globe`, `-peek-scrolled`, `-peek-area`) |
| (found) | Looking at `compare-area` on a phone: Search this area did nothing at half. `earthInView` started from the view's centre, which missed the stacked globe since round 1 moved it right of its caption (Decisions 142), so it returned no area | Fixed: it starts from the globe's centre on screen (`scene/input.ts`). Desktop's area is unchanged (3.07° S–69.60° N, 154.48° W–55.67° W, as logged in Must 4 part 3); the phone's `compare-area` now shows the magnifier coral and the area's row in the filters. New state `compare-phone-peek-area` taps it at peek (the area on: asserted; the toggle still on screen: asserted) |

**Harness.** New refNA phone states `sheet-peek-scrolled`, `compare-phone-peek-scrolled`, `compare-phone-peek-area`
(States table); `compare-phone-globe`'s check moves the magnifier to the lower left.

**Verification** (2026-10-20): see the Log entry.

### Weather window from a real feed (Should 4, done)

**What.** The weather window reads a real forecast. For the place on screen (an established Earth site's page, or the
Earth double of a booking flow) the browser asks Open-Meteo's forecast (16 days, no key: the day's strongest wind at
10 m, rain, high and low, in the place's time zone) and NASA POWER's monthly climatology (mean temperature and daily
range, rain, wind), once per place, and keeps both. A day is blue when it sits under every limit of the chosen purpose
(one table, `LIMITS`: wind, rain, the low and the high; Decisions 145); the bars still show the day's strongest wind,
and each day's name (screen readers) and tooltip (a mouse) give its weather and which limits it goes over. The best
months are those whose average day sits under the same limits (Decisions 147). Where it shows:
- the Earth site view's week (from today by the wall clock, for the search's purpose; Decisions 148), with "Best months
  for rover mobility" and the POWER line under it;
- the booking plan's 14 days, for the plan's purpose: a new purpose marks them again in place, the hint states the
  limits ("wind under 11 m/s, rain up to 2 mm, −20 to 40 °C") and the source, the summary and the review count the days
  "under the limits";
- the booking listing's Season fact and the plan's off-season caveat, from the climatology for the plan's purpose
  ("Outside the best months for EVA training (Jan, Feb, …)").

While the forecast loads the days show empty bars and "Loading the forecast…"; when it fails (and under `?capture`)
seeded sample days stand in, said so ("Sample weather: the forecast couldn’t be loaded."); without the climatology
the booking keeps the sample listing's months and the site view says "Not available". A feed landing redraws only the
weather's parts (`[data-wx]`; Decisions 149). The compare view asks its double's weather ahead of "Plan a test campaign
here". The info sheet's Data column names both feeds, the title footer's data line Open-Meteo; `docs/credits.md` has
their licences.

**Where.** `src/data/weather.ts` (rewritten: `LIMITS`, `limitsOf`, `over`, `parseForecast`, `parseClimate`,
`sampleDays`, `wxAt`, `daysAt`, `bestMonths`, `onWeather`; `isoDay` moved here from `booking.ts`), `src/ui/weather.ts`
(new, pure: `dayText`, `limitsText`, `srcText`, `monthsSrc`, `barH`, `isGo`, `lc`), `data/booking.ts` (`windowOf(L,
plan)`, each day with the limits it goes over; `placeOf`), `ui/booking.ts` (`listed`: the listing's best months from
the climatology; the days with ids, marks and tooltips; hint, summary and review; a purpose change calls `redrawWx`),
`ui/panel.ts` (`wx` rewritten; `redrawWx`, registered with `onWeather`; compare's early ask; `fill()`'s booking branch,
below), `ui/listing.ts` (`monthsText`; the Season block a weather part), `index.html` (the info sheet's Data column and
note, the footer's data line), `docs/credits.md`, `scripts/capture.mjs` (`serve`), `scripts/capture-states.mjs`,
`scripts/fixtures/` (new).

**Found on the way.** A booking plan reached by deep link, or whose search by coordinates landed while it showed, never
got its purposes outside `?capture`: `fill()`'s booking branch returned before `needLists()`, so the select kept its one
option for good (the capture states reach the plan by a route change, which asks). Fixed: that branch asks too.
Probed in a live browser (below).

**Decisions** 145–149. **Tests** (305, was 292): `data/weather.test.ts` (new: the limits per purpose, a missing value
counting as over, an unknown purpose and `__proto__` taking rover mobility's; both feeds' recorded JSON parsed, a null
NaN, POWER's −999 NaN, shapes refused (no days, wind in km/h, a short column, no parameters); one ask per place per feed
and the landing callback; loading, then the forecast's days, a day past its reach empty; the best months for rover
mobility, EVA training and education from the recorded climatology, worked by hand; a failed forecast gives the sample,
a failed climatology no months; under ?capture no ask, with wx=feed both; the sample's winds as the pre-feed sample drew
them), `ui/weather.test.ts` (new: a day under and over, the list of limits, no forecast, loading; a go only once known;
bars capped; the limits phrase; `lc`), `ui/listing.test.ts` (`monthsText`), `data/booking.test.ts` (the window with each
day's limits, sample days under capture).

**Harness.** New state option `serve` (`{pathPart: file}`: recorded JSON with the CORS header the feeds send) and
`scripts/fixtures/` (one Open-Meteo forecast and one POWER climatology for the Jezero example's first cell, recorded
2026-10-20; the forecast's dates moved to the capture day). Under `?capture` the app asks no feed (the sample days)
unless `wx=feed` (Decisions 146). New refNA states `wx-site-feed`, `book-listing-feed`, `book-plan-feed`,
`book-plan-feed-eva`, `book-plan-feed-picked`, `book-plan-wx-loading` (the forecast held), `book-plan-wx-fail` (the
forecast refused) (States table).

**Verification** (2026-10-20). typecheck, 305 tests and build (copy check) green; app chunk 146.5 KB gzip. Full
capture, 205 states (183 desktop, 205 phone), 388/388; console errors only the intended 404s of `site-nodata-fallback`,
`system-moon-late`, `body-moon-late` and the new `book-plan-wx-fail`. Looked at every new state at both sizes: the
Meteor Crater week (Su–Tu blue, the rainy days grey), "All year but Jul" with the POWER line; the listing's Season
from the climatology; the plan's 14 forecast days for rover mobility, marked again for EVA training (14–17 Oct grey:
asserted), days 6–10 Oct with "1 under the limits" and the off-season caveat naming EVA training; loading (empty bars,
no count); the forecast refused (the sample days, said so). Regression: `book-plan`, `book-plan-filled` (the sample's
winds as before, "1 under the limits"), `book-review`, `book-offseason-plan`/`-review` (the sample listing's months
and note, unchanged), `site-haughton`, `info-sheet` (the Data column's weather row on two lines). A live probe
(Playwright, real network, no `?capture`): Meteor Crater's week from Open-Meteo for 20–26 Oct, best months "All year
but Jul, Aug"; the deep-linked plan's 14 days, its purposes now loaded, education marking them again with the focus
kept on a day; four requests in all (two places, two feeds each).

**Known limits.** The limits are planning rules of thumb, not standards (Decisions 145); heat uses the air
temperature where the heat index would need humidity. The best months judge a month's typical day from its means,
with one wind ratio everywhere (1.3–2.3 by place, Decisions 147): a month of rare storms passes. Both feeds are kept for the session (`shortcut:` in `wxAt`). Open-Meteo's free API is for non-commercial use.
The live feeds were checked from this machine with a Playwright probe, not on a phone.

### Weather window review fixes (done)

Fifteen findings (independent review of Should 4, 2026-10-20); several the same defect seen twice (1 = 7 = 13, 2 = 15,
4 = 9, 6 = 10). All fixed; none skipped.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 7, 13 | The Earth site view's week started on the UTC date while the forecast (`timezone=auto`) starts on the place's: east of UTC, after its midnight, the first day fell outside the forecast, an empty grey "no forecast for this day" (the Dry Valleys, UTC+13, 11 h of every UTC day; confirmed live again on 2026-10-20 at 23:27 UTC, its series starting 2026-10-21) | Fixed, the finding's first option: the week starts on the place's own today. `parseForecast` keeps Open-Meteo's `utc_offset_seconds` (refused when missing or past ±14 h), and `todayAt(place, now)` (`data/weather.ts`) is the UTC date shifted by it once the forecast lands, the day the forecast starts on (UTC's while it loads and without one). Not `past_days=1`: that would show the place's yesterday first. The booking window (from UTC tomorrow) is unchanged. Decisions 148 amended. New state `wx-site-local` (the Dry Valleys from Mon 5 Oct; asserted) |
| 2, 15 | No good month (`bestMonths` `[]`, live for the Dry Valleys and Haughton for EVA training or education) read "Best months: None" but dropped the off-season caveat: `offSeason` returned false on an empty list | Fixed at the root: `offSeason` (`data/booking.ts`) is false only when the months aren't known; an empty list puts every day off-season. The caveat has its own words, "No month’s typical day sits under the limits for EVA training." (`noMonths`, `ui/weather.ts`). Tested (`data/booking.test.ts`, `ui/weather.test.ts`); new state `book-plan-feed-none` (the Dry Valleys for EVA training) |
| 3 | Best months held monthly means to daily limits: mean daily rain against the 1 mm wet-day threshold (Haughton's Jun–Sep at 1.2–1.7 mm a day lost its field season) and mean wind against the day's strongest wind (never binding) | Fixed, the finding's first option: the means are held in monthly terms (`bestMonths`): the mean wind ×1.5 stands for the days' strongest, the mean rain is held to twice the day's limit. Both measured on ERA5 (Open-Meteo's archive, 2016–2025) at five doubles (Decisions 147, amended). Haughton now: EVA training Jun to Sep, education Jul, Aug, astrobiology May to Oct; the Dry Valleys still none for EVA training (every month's low under −10 °C). The in-app line says "typical day … estimated from". Tests re-derived by hand |
| 4, 9 | Why a short bar was grey (rain or temperature) showed only in a tooltip and screen-reader text: nothing on a touch screen | Fixed, the finding's second option, on both windows: a 4 px dot over the bar where the day's rain or temperature goes over a limit (`marks`, `ui/weather.ts`; `.dot` in `panel.css`); none while loading or for a day without a forecast. Both hints say "Bars show each day’s strongest wind, a dot rain or temperature over the limits." The summary line was left alone: it is already long, and the site view's days aren't buttons |
| 5 | The Open-Meteo credit wasn't linked | Fixed: "Open-Meteo.com" links https://open-meteo.com/ and "CC BY 4.0" the licence, new tab (`srcText`); `.fine a` in the fine print's grey, underlined. It still shows only while the forecast is the source (the sample days use none of its data) |
| 6, 10 | The booking listing's Season showed the sample listing's months while the climatology loaded (then swapped), as if real after it failed; its label lacked the purpose; the caveat showed the sample months first | Fixed: `listed()` (`ui/booking.ts`) gives no months while the climatology loads, so the listing's Season reads "Best months for rover mobility: Loading…" (`listingBody`'s new `best` and `busy`) and no caveat shows; without it the sample months stay, the note starting "Sample months: the climatology couldn’t be loaded." (in the caveat too). New state `book-listing-wx-loading` |
| 8 | Only the site view's feed case was captured | Added `wx-site-loading` (both feeds held), `wx-site-fail` (both refused: the offline demo), `book-listing-wx-loading` (the climatology held); `block` and `hold` take a list (`scripts/capture.mjs`) |
| 11 | Loading bars were 3 px stubs, the same as calm days with no data | Fixed: while the forecast loads the bars are 16 px (site) and 12 px (plan) placeholders pulsing as the skeleton does (`@keyframes skel`; still under reduced motion) |
| 12 | A long run of months listed one by one wrapped to three lines | Fixed: `monthsText` names a run of three or more by its ends, across the new year too: "Nov to May", "Jan to Mar, May, Aug to Dec", "All year but Dec to Feb"; shorter runs month by month. Tested |
| 14 | `lc(purposeName(…))` reached `innerHTML` unescaped in four places: an engine-added purpose's label would be raw HTML | Fixed: `purposeIn` (`ui/booking.ts`) escapes it for the hint, caveat and the listing's label; the site view's `name` is escaped once and used for its label, hint and POWER line. Where it goes into the season note it stays raw, which `text()` escapes |

**Harness.** New fixtures `scripts/fixtures/open-meteo-forecast-dryvalleys.json` and `power-climatology-dryvalleys.json`
(recorded 2026-10-20/21; the forecast re-dated to start on 2026-10-05, the capture instant's local date at UTC+13).
New refNA states `wx-site-local`, `wx-site-loading`, `wx-site-fail`, `book-listing-wx-loading`, `book-plan-feed-none`
(States table); `book-plan-wx-loading` asserts `.days.load`; checks updated where the copy changed (`wx-site-feed`,
`book-listing-feed`, `book-plan-feed-picked`: October is now among EVA training's best months there, so no caveat;
`book-listing-foot`, `book-offseason-plan`).

**Verification** (2026-10-21): see the Log entry. The live forecast for the Dry Valleys at 23:27 UTC on 2026-10-20
started on 2026-10-21 (`utc_offset_seconds` 46800), as the review found; the recorded fixture is that answer.

### Surface photos (Should 5, done)

**What.** The surface slot of the strip (the site panel's and the booking listing's third square, empty until now) shows
a photograph taken on the ground where one is openly licensed: 12 from NASA's Image and Video Library, cut square at
320 px (12–32 KB each, 236 KB in all), lazily loaded, each with alt text that says what it shows.
- Mars: Jezero (Perseverance Mastcam-Z, Santa Cruz hill, natural colour), Gale (Curiosity Mastcam, buttes on Mount
  Sharp), Meridiani (Opportunity Pancam, the Eagle crater outcrop), Elysium (InSight's first selfie).
- Moon: Hadley–Apennine (James Irwin and the rover, Mount Hadley behind), Taurus–Littrow (Harrison Schmitt at the
  split boulder).
- Earth: Lake Salda, Pilbara, Haughton Crater, Holuhraun, Death Valley (Mars Hill), the McMurdo Dry Valleys; an Earth
  cell inside one of them (the established-site tag) shows that site's, so the Pilbara cell's listing does.

Elsewhere the slot says plainly why there is none (`surfaceOf`, Decisions 150): a featured target "No lander, rover or
crew has photographed this area." (Arcadia, Utopia, the four south-pole regions), a pin or named feature "No surface
photograph for this point.", an established Earth site "No openly licensed field photograph of this site." (eight of
14), an Earth cell "No field photographs of this area.". The credit goes on the strip's credit line, as the crops'
do: "Surface: <what> · <owner>." with the name linking the photograph's page (images.nasa.gov/details/<id>, new tab);
the info sheet's Data column gains a Photos row. Each photo's id, crop, credit and alt live in `src/data/photos.ts`;
`npm run fetch:real -- --only=photos` downloads (cached) and crops them.

**Where.** `src/data/photos.ts` (new: `PHOTOS`), `src/data/sites.ts` (`surfaceOf`; the `surface` field dropped),
`src/ui/panel.ts` (`strip(id, s)`: the photo or the sentence, and the whole credit line), `src/ui/booking.ts` (the
listing's strip), `src/styles/panel.css` (`.imgs img` as the crops, its alt text grey), `index.html` (info sheet Data:
Photos), `scripts/fetch-real-data.mjs` (`--only=photos`), `public/photos/` (12 JPEGs), `docs/credits.md`.

**Decisions** 150–151. **Tests** (310, was 307): `data/photos.test.ts` (new: every photo a featured or established
site's, its file there, its words and crop; the photo for Jezero, Hadley and the Pilbara cell; the four sentences).

**Harness.** New refNA states `site-atacama-media` (an established site without a photo), `site-pin-media` (a pin),
`book-listing-photo` (the Pilbara cell's listing, the site's photo); checks updated on `site-jezero-media`,
`site-malapert-media`, `site-hadley-media`, `site-haughton-media`, `book-listing` (States table).

**Verification** (2026-10-21): see the Log entry.

**Known limits.** One photograph per site, cropped square to about 100 px on screen; the whole picture is a click away
on its NASA page. Whether a photo lies inside the site's square was checked for the Moon and Mars landing sites (all
within it); the Earth ones are of the named place (Decisions 151). Pins never show one, even beside a landing site
(review fixes: inside a featured site's square they now show its photograph; round 2: also when their 18.8 km window
holds one of ten other landings).

### Surface photos review fixes (done)

Nine findings (independent review of Should 5, 2026-10-21); several the same defect seen twice (1 = 7, 2 = 4 = 8,
3 = 9). All fixed; one suggestion inside finding 1 and the direction of finding 6's crop not taken (Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 7 | The slot told eight established sites "No openly licensed field photograph of this site.", and credits.md said NASA's library had been searched and nothing found; but PIA16191 (a dry streambed on an alluvial fan in the Atacama, NASA/UC Berkeley) and PIA22219 (stone stripes on Mauna Kea at 4,100 m, Washington University in St. Louis/NASA, R. E. Arvidson) are JPL Photojournal ground photos under the same policy as the set's; and ESA's Lanzarote photos are openly licensed | Fixed: `earth-atacama` and `earth-maunakea` added to `PHOTOS` (14 now, 271 KB), fetched by `fetch:real --only=photos`, credited in-app and in `docs/credits.md`. The sentence claims only NASA: "No NASA field photograph of this site." (Decisions 150). The other six re-searched by name and field project (Bockfjorden, Lanzarote, Río Tinto, Hanksville, Dallol, Meteor Crater: no NASA ground photograph; Hanksville and Dallol 0 hits), the search written up in `docs/credits.md`. PIA24048 (RIMFAX in Svalbard) checked and left out (Deviations). `site-atacama-media` now shows the photo; the no-photo state is the new `site-hanksville-media`; the test's no-photo case is Hanksville |
| 2, 4, 8 | A Mars or Moon pin always said "No surface photograph for this point.", even 4 km from Perseverance's landing inside Jezero's square, while an Earth cell inside an established site got that site's photo | Fixed, the findings' first option: a pin or named target inside a featured site's square (`photoAt`, `data/sites.ts`: the site's terrain extent in its map's projection, `llToLocal`) shows that site's photograph, as `establishedAt` does on Earth; outside every one the sentence no longer denies photos that may exist: "No surface photograph on file for this point." (Decisions 151). Tested: a pin 4 km and one 29 km east of Jezero's centre show Perseverance's, one 35 km east the sentence, a named target (Aeolis Mons) Curiosity's. `site-pin-media` now shows the photo; new `site-pin-far-media` the sentence |
| 3, 9 | Utopia's lede "Viking 2 and Zhurong region." sat over "No lander, rover or crew has photographed this area." | Fixed, the findings' second option (Viking 2's photo was taken some 3,900 km away: not this square's, Decisions 151; corrected in round 2: about 680 km): Utopia's slot has its own sentence, `nophoto` on the site, "Viking 2 and Zhurong landed over 1,000 km away; no photograph of this area." Decision 151's "680 km" for Viking 2 was wrong (134° W read as east), now about 3,900 km, in credits.md too (itself wrong: round 2 restored 680 km). New state `site-utopia-media` (the sentence fits the slot at both sizes, six lines on desktop) |
| 5 | No state covered a photo that fails to load; the 10.5 px alt text would not fit the square | Fixed: a capture-phase `error` listener on the panel (`ui/panel.ts`) swaps a strip image that fails for the slot's text box, "The photograph couldn’t be loaded."; the credit line still links its page. The alt-text styling on `.imgs img` dropped. New state `site-jezero-photo-404` (`block: '/photos/'`; its 404 in the console is intended) |
| 6 | The Dry Valleys crop half-cut Chris McKay at the right; the Pilbara photo read at 100 px as a crowd, not the ground | Fixed: the Dry Valleys at `[.55, .5, .76]` (the station's shield at the left, McKay whole; the suggested .4 moves the square left and cuts him more); the Pilbara cut to the stromatolite outcrop at lower right, `[.8, .78, .46]`, its `what` "Stromatolite outcrop in the Pilbara, 2019" and alt text redone. `book-listing-photo`'s check updated |

**Tests** (310, unchanged in count): `data/photos.test.ts` re-cut: photos for Atacama, a pin inside Jezero's square (4
and 29 km from the centre), a named target in Gale; sentences for Utopia, a pin 35 km from Jezero, a Moon pin in
Malapert's square (a featured site without a photo), Hanksville.

**Harness.** New refNA states `site-hanksville-media`, `site-utopia-media`, `site-pin-far-media`,
`site-jezero-photo-404`; `site-atacama-media`, `site-pin-media` and `book-listing-photo` checks rewritten (States table).

**Verification** (2026-10-21): see the Log entry.

### Surface photos review fixes, round 2 (done)

Three findings (independent review, 2026-10-21); 2 and 3 the same defect. All fixed; finding 2's and 3's "about
670 km" taken as 680 (Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Photos covered featured sites only, so landing sites reachable by IAU name (Statio Tranquillitatis, West; Surveyor, Head, Bench; Cone; North Ray, South Ray, Plum, Spook; Gusev; Endeavour) said "No surface photograph on file for this point." though NASA's library has public-domain photos of each; Decisions 150–151 gave no reason | Fixed: ten landings added to `PHOTOS` (`src/data/photos.ts`, keyed `body-landing`, each with `at`, the published landing point): Apollo 11 (AS11-40-5875, Aldrin and the flag), 12 (AS12-48-7134, Conrad at Surveyor 3), 14 (AS14-66-9232, Shepard and the flag), 16 (AS16-113-18339, Young's jump salute); Viking 1 (PIA00563) and 2 (PIA00568), Pathfinder (PIA04318, Sojourner), Phoenix (PIA10713, polygonal ground), Spirit (PIA17760, south from Husband Hill, 3 km from its landing) and Opportunity at Endeavour (PIA15684, false colour; `at` the crater it looks across, its IAU centre). `photoAt` (`data/sites.ts`) first looks for a landing whose spot the point's 18.8 km window (±9.4 km, `llToLocal`) holds, then a featured site's square as before (Decisions 151). Fetched by `fetch:real --only=photos` (24 photos, 420 KB; the 14 already there byte-identical), credited in `docs/credits.md` with each `at`, alt text for each. New state `site-tranquillitatis-media` |
| 2, 3 | Utopia's slot said "Viking 2 and Zhurong landed over 1,000 km away"; the round-1 fix had read Viking 2's 225.7° W (west-positive) as 134° W, putting it in Amazonis about 3,900 km off; it landed at 134.3° E, inside Utopia Planitia, about 680 km east of the site | Fixed: "No photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south." (shorter than before: five lines in the slot on desktop, four on the phone), credits.md "about 680 km", Decision 151 corrected, the test and `site-utopia-media`'s check. Utopia keeps no photo: 680 km is far outside its ±15 km square. A pin at Viking 2's landing now shows its photo |

**Tests** (311, was 310): `data/photos.test.ts`: every photo a site's or a landing's with a place (not both); a new case,
named targets near landings (Statio Tranquillitatis, Surveyor, Cone, South Ray 6.4 km off, Gusev 3.7 km off,
Endeavour given at −5.1955°) and a Viking 2 pin show that landing's, a pin 9.9 km east of Apollo 11 none; Utopia's
sentence.

**Harness.** New refNA state `site-tranquillitatis-media`; `site-utopia-media`'s check updated (States table).

**Verification** (2026-10-21): see the Log entry.

### Progressive textures (Should 6, done)

**Tiers.** The three 4K colour maps (`mars`, `moon`, `earth_day`) get a low tier, the 4K map downsampled to 1024 × 512
(`public/textures/lo/`, 100, 121 and 78 KB against 1,630, 2,052 and 946 KB), written by `npm run fetch:real --
--only=globes` beside each full map (`writeJpeg`, `TIERED`) and listed in the texture manifest as `lo`. The rerun
left every other globe file and every crop byte-identical. The full tier stays 4K, not the plan's 8K: an 8K RGBA map
with its mips is 179 MB of GPU memory on its own, against a 300 MB budget already at 287.6 MB (Decisions 152). The
height, night, gloss and cap maps (66–296 KB each) keep one tier.

**Loading** (`app.ts start`, `scene/renderer.ts loadTextures`). The start waits on the first tier of the route's maps
(the low colour map where there is one, the others' only file); after start, one batch at a time: the site manifest,
the route's worlds at full resolution, the other worlds' first tiers, their full maps, then Beyond's. A full map
replaces the low tier in the same texture (disposed first: a new size needs new GPU storage), so everything reading
`tex(k).image` (the crops cut from the globe, Beyond's scenes) gets the best landed; the albedo the footer art samples
(512 px) is read once, from the low tier.

**The swap** (Decisions 153): the planet shader samples the low tier (`mapLo`, kept as a texture of its own for the
fade, `takeLow`) and the full map and mixes them by `sharp`, which `showMaps` turns 0 → 1 over .9 s (`power2.inOut`, as
the mean-colour fade before it); then the low texture is released (`blank`) and disposed. Same exposure: the low tier is
the full map downsampled, so only detail changes. At once under reduced motion and before start.

**Indicator** (Decisions 154): `#st-m` in the status bar, "LOADING FULL-RESOLUTION MAPS" in the HUD's mono caps (10.5
px, .06 em, the HUD labels' grey) after a 5 px dot pulsing as the engine line's does (still under reduced motion), in
the hints' place, from start until the worlds' full maps have all landed or failed; `aria-hidden` (nothing to act on).
On a phone it is the status line over the sheet's edge on the body, site and compare views (alone, unless a pin's search
or the engine's warm-up line shows, which wins); not on the system view, which has no sheet and where the globes are
~150 px across, below what the low tier holds. Hidden with the status bar on the intro, title and Beyond.

**?capture** (Decisions 155): the first tiers and every elevation patch hold the start; the full maps hold
`__eidolon.ready` (`app.ts`: `if (CAPTURE) await full`) and swap at once when they land, so every existing state sees
the final tier as before. The low tier and the indicator are captured by holding the full maps (`hold`) with `noReady`
and a new harness step `{ until: sel }` (waits, real time, until the app has started).

**Elevation patches per site** (Decisions 156). `public/sites/patches.bin` (4.7 MB, one file) is now
`public/sites/patches/` (66 files, 17–756 KB, named by their definition's hash; byte for byte the old file's slices),
listed with `file` in the site manifest (`fetch-real-data.mjs`). `terrain/dem.ts`: `loadSites` loads the manifest only
(credits, crops, the patch list); `needPatch(body, at, win, N)` loads the patch a window reads (`pick`, the old
`patchFor` rule over loaded or not); `patchFor` returns it once its heights are in, and a read before that starts its
load and gets the procedural terrain: the reads of one pass are reported once their patches settle (`onLatePatch` →
`onAsset('sites')`: the terrain rebuilt behind the curtain, the panel redrawn), a patch that failed is not asked again.
A site or compare deep link waits on the patches its views read first (`procedural.ts needSite`: its terrain at its
extent, its compare window at its point at 192 and 94 samples; the double's too), ~0.1 MB for Jezero; the mock's
elevation waits for the patch its window reads (`client.ts frontZ`, the mock's terrain hook may now be async), as do
the grid's own hillshades. Nothing prefetches the rest.

**Pins by deep link** (found under Surface photos, not fixed there): a pin opened by deep link was built by `parse()`
before its world's height map and any patch were in, and its illustrative terrain kept in the cache; the start now
drops the pins built before its gate (`clearPins`), so `site-pin-gale` and `site-pin-hadley` open on their pin patches.

**Measured** (`npm run perf -- --only=paint,memory`, production build, phone 390 × 844 @3, Fast 4G, 4× CPU, cold,
median of 3; was: Performance budget review fixes, round 2):

| Route | First paint | App start | Fetched before start (textures, sites) |
| --- | --- | --- | --- |
| #/ | 584 ms | **2.0 s** (was 3.2) | Earth's low tier and data maps, 0.3 MB |
| #/system | 464 ms | **3.2 s** (was 8.0) | three low tiers and their data maps, the Moon's cap, 1.7 MB |
| #/mars/jezero | 464 ms | **2.0 s** (was 8.9) | Mars's low tier and height map, one 72 KB patch |
| #/mars/jezero/compare/salda | 456 ms | **2.7 s** (was 9.4) | Mars's and Earth's, Jezero's and Lake Salda's patches |

GPU memory peak 287.6 MB at 1280 × 800 @2 (unchanged: a low tier's texture lives only through its fade). A probe on the
same throttle (resource timings, one run each): Jezero's deep link opens on "Terrain: MOLA–HRSC blended DEM, 200 m.",
its full Mars map in at 3.9 s; a Gale pin by deep link waits on its 756 KB pin patch, start 3.1 s; Malapert compared
with Haughton 3.8 s; the status line off once the last world's full map lands (8.5–9.6 s). On the real GPU with Mars's
full map held 4 s: `sharp` sampled 0 → .07 → .5 → 1 over .9 s, the low texture released after; Gale reached from the
globe with its patch held 9 s: the dive lands on "Illustrative terrain.", and when the patch lands one curtain (0 → .98
→ 0) brings "Terrain: MOLA–HRSC blended DEM, 200 m."; no console errors or warnings.

**Where.** `scripts/fetch-real-data.mjs` (low tiers, a file per patch), `public/textures/lo/`, `public/sites/patches/`,
both manifests; `src/scene/renderer.ts` (`loadTextures(keys, final)`, `takeLow`), `src/scene/planet.ts` and
`shaders/planet.frag.glsl` (`mapLo`, `sharp`), `src/app.ts` (`start`, `showMaps`), `src/terrain/dem.ts` (`needPatch`,
`loadAllPatches`, `onLatePatch`), `src/terrain/procedural.ts` (`needSite`), `src/data/client.ts` (`frontZ`,
`ownShadeOf`), `src/data/mock.ts` (an async terrain hook), `index.html` (`#st-m`), `src/styles/hud.css`,
`src/styles/responsive.css`, `src/terrain/sample.ts` (comment), `scripts/capture.mjs` (`until`),
`scripts/capture-states.mjs`, `scripts/perf.mjs` (the compare deep link's start), `docs/credits.md`.

**Tests** (314, was 311): `terrain/dem.test.ts` (a file per patch; `needPatch` fetches only the patch a window reads; a
read before a patch lands starts it and is reported once; a patch file of the wrong length stays out alone and isn't
asked again; a patch file outside `patches/` refuses the manifest), `data/real-sites.test.ts` (every shipped patch file
holds its n × n heights; every low tier's size as listed).

**Harness.** New refNA states `system-maps-loading` (the three full maps held) and `body-mars-loading` (Mars's held);
`system-moon-late` and `body-moon-late` block both of the Moon's tiers (States table).

**Verification** (2026-10-21): see the Log entry.

**Known limits.** The low tier's albedo feeds the footer's dithered globe (read once; finer than the 512 px it is
sampled to). A patch that fails stays procedural for the session. The 8K tier would need KTX2 (compressed, ~4× smaller
on the GPU) and an encoder this machine doesn't have; the Rendering table's phone row (2K maps on phones) is not done:
phones get the 4K maps after the low tier as laptops do.

### Progressive textures review fixes (done)

Eleven findings (independent review of Should 6, 2026-10-21); several the same defect seen twice (1 = 8, 3 = 5). All
fixed; 10 measured and only partly fixable within the item (Deviations), finding 1's optional fallback not taken.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 8 | A compare deep link to a named target (Jezero, Gale, Hadley) preloaded its compare window at the featured point, but compare and the mock read it at the IAU centre once the search landed (6.6 km off for Jezero, ~18 km for Hadley): another 17 KB patch, asked only after start, so the swap could race it and land on illustrative terrain, then a second curtain | Fixed at the root: the five IAU featured sites carry their feature's centre (`iauAt`, `data/sites.ts`, tested against `data/targets.json`) and `centreOf` falls back to it before the search lands, so compare reads one window from the first frame; `needSite(body, site, at)` takes that centre (`app.ts`: `centreOf`). Probe (production build, phone, Fast 4G, 4× CPU): Jezero's IAU patch is requested with its site patch before start and, held 3 s, holds the start (5.6 s) and the deep link opens on MOLA–HRSC; Gale's compare loads its site and IAU patches (90 KB) instead of the 756 KB pin patch its point picked, start 2.7 s; Hadley's 3.3 s. Held 9 s (past the 7 s ceiling): illustrative terrain until it lands, then one change (the mock window's redraw), no second curtain (Decisions 157, 161). The optional `patchFor` fallback not taken (Decisions 157) |
| 2 | Clicking a featured site from the body view started with no elevation loaded: the panel drew the procedural map and "Illustrative terrain.", then redrew; on a slow link the dive landed on it too (Decisions 156 was wrong) | Fixed: a world's featured sites' patches load when it shows, from when the route's own full maps are in (`app.ts nearSites` on start and every `hashchange`; Decisions 159). Probe: on #/mars Jezero's and Gale's four patches are asked as Mars's 4K map lands (3.9 s); Gale opened at 8 s shows "Terrain: MOLA–HRSC…" at once, never "illustrative" |
| 3, 5 | The loading line stayed until all three worlds' full maps were in (8.5–9.6 s on #/mars, whose own map was in at 3.9 s), and on site, compare-terrain, booking and pin views, which show no globe, it hid the desktop hint and added a phone status line | Fixed: `ui/chrome.ts mapsLine` shows it only while a globe on screen (the route's worlds, `mapsOf`) is on its low tier, on body (not the grid), system and globe compare views, asked on every status update and as each full map lands or fails (Decisions 158). Probe: #/mars line on at start, off at 3.9 s with Mars's map; on #/mars/jezero/compare/salda never on. The phone's legend offsets for the line went with it (it never shows over terrain) |
| 4 | The module map's `renderer.ts` and `dem.ts` rows were not updated | Fixed: both rows, and `procedural.ts` (`needSite`) and `chrome.ts` (`mapsLine`) |
| 6 | Crops cut from a colour map (a pin's) were drawn from the 1024 px tier (orange smears), then repainted in one frame; Beyond's painted Moon crop the same | Fixed: `drawCrop` keeps the empty frame until the world's full map has landed or failed (`sharpest`), as an image crop does while it loads; Beyond's `redrawScenes` fades the new picture in over the old over .9 s (Decisions 160) |
| 7 | No states for a site or compare deep link while the full maps load, a full map that fails, or the pin crops | Fixed: `site-jezero-loading`, `compare-jezero-salda-loading` (no line, hint kept, phone legends as usual; `expect: '#st-m:not(.on)'`), `compare-globe-loading` (the line on a globe compare), `body-mars-full-fail` (`block` the 4K map: no line, hint back, the low tier), `site-pin-gale-loading` (empty crop frames). The terrain states wait `until` their view applies, since the line no longer shows there |
| 9 | Every batch of late patches cleared the terrain cache, redrew the panel and ran a curtain, even when the scenes already had real data (the engine window's direct rebuild, then a curtain ~0.3 s later that changed nothing) | Fixed: `app.ts onLatePatches` rebuilds the cached terrains but redraws only when the site on show now reads real elevation it didn't (`shownSrc`); a compare window on its way is left to `fill()` (Decisions 161). Probe: the 9 s hold above shows the start's curtain only |
| 10 | The 4K decode and upload now happen mid-session on the main thread; not measured | Measured (production build, laptop 1280 × 800 @2, real GPU, Mars's 4K map held 2.5 s so it lands after start): a 131–136 ms long task at the swap. `img.decode()` before the upload (taken): 123–128 ms; a CPU profile puts ~120 ms in `texSubImage2D` itself (the 32 MB copy), not decoding. An ImageBitmap from the element (tried, reverted): `createImageBitmap` ran 210 ms on the main thread, two 72–78 ms tasks. Left as a `shortcut:` in `renderer.ts` (Deviations) |
| 11 | `fetch-real-data.mjs` never removed patch files the manifest no longer lists | Fixed: it empties `public/sites/patches/` before writing; `real-sites.test.ts` also checks every file there is listed. Rerun (`--only=sites`): 66 patches and 80 crops, byte-identical |

**Tests** (315, was 314): `data/real-sites.test.ts` (each IAU featured site's `iauAt` is its targets.json centre;
`patches/` holds exactly the manifest's files), `data/client.test.ts` (a featured site's centre before its search is
its `iauAt`).

**Harness.** New refNA states `body-mars-full-fail`, `site-jezero-loading`, `compare-jezero-salda-loading`,
`compare-globe-loading`, `site-pin-gale-loading` (States table).

**Verification** (2026-10-21): see the Log entry.

### Progressive textures review fixes, round 2 (done)

One finding (second independent review, 2026-10-21), major: fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Phone globe compare: the loading line's band (`--status` tall, over `#area` in DOM order) ran through the lower ~20 px of Search this area, whose bottom sits 14 px above the sheet; the engine-warming (`.eng`) line had the same latent overlap | Fixed in `responsive.css`: while either line shows (`body:has(#st-m.on)`, `body:has(#status .eng)`) the phone's `#area` takes `margin-top: calc(-1 * var(--status))`, as the legends' `.eng` offsets do, so its bottom sits 14 px above the line. `compare-globe-loading`'s check now reads "Search this area clear of the line" |

**Verification** (2026-10-21): see the Log entry.

### Telemetry flash (Should 7, done)

**The rule** (Decisions 162). `motion.ts setReading(el, s)` writes a reading (through `dom.ts setText`, which now
returns whether it wrote) and, when the reading changed after holding for at least `MOTION.flashHold` (.5 s), flashes
it: GSAP tweens the element's `--fl` from 1 to 0 over `MOTION.flash` (.6 s, `power2.out`), and `hud.css` mixes that
share of `--coral` into its colour (`color-mix(in srgb, var(--coral) calc(var(--fl, 0) * 100%), currentColor)`;
`currentColor` in `color` is the inherited colour, so each readout eases back to its own). A reading that changes every
frame is drift, not news: the sub-observer and sub-solar point at ×600, the cursor's readouts as the globe turns under
it or the pointer moves. Flashing those would strobe the HUD (they change 24 times a second at the default rate), and
gating them to once a second would pulse it forever; the plan keeps the HUD calm (no ornament).

**Where.** The globe HUD's eight readouts (`ui/hud.ts`: sub-observer, sub-solar, rotation, time rate, cursor, sun
elevation, local time, daylight; not the hint line) and the intro's telemetry corners (`views/intro.ts`: UTC,
countdown, sub-point, sun elevation). So: the left column flashes as the HUD comes on ("-" to a reading), the time rate
when a rate is picked (and the sub-observer and sub-solar too when they start moving again from Live), the cursor's
four when the pointer lands on the globe, daylight when the terminator crosses the cursor; at Live, a readout flashes
as it ticks over (the sub-observer about every 25 s on Mars). The Moon turns slowly enough that at ×600 its
sub-observer and sub-solar tick over about once a second (0.09° a second at one decimal), so they flash on each tick as
UTC does; at 1 h/s they are drift again. In the intro, UTC and the countdown flash on each
second, the sub-point every ~1.6 s; the sun elevation rises in .1° steps every .42 s, drift, so it doesn't.

**Reduced motion** (read live, `RM`): the readings are written, no tween. **?capture**: the hold is measured on
`clock()` and the tween runs on the one GSAP clock, so a seek lands on the same phase every run (UTC at a whole
second is at its peak: `intro-2s`'s check says so).

**Not flashed** (not HUD readouts, or not changing): the status bar's line (rewritten whole, prose), the top bar's
clocks (chrome, and at ×600 the UTC minute is drift), the detection frame's position (written once per dive), the site
map's hover readout (follows the pointer: drift by this rule).

**Tests.** `src/motion.test.ts` (3): the first reading and a change after holding flash with `--fl` 1; a reading
changing every frame for half a second, an unchanged write and a change .4 s after drift don't; reduced motion,
switched live, writes without flashing. 318 tests in all.

**Verification table** (`scripts/capture-states.mjs`, all `refNA`: the reference has no flash):

| State | Check |
| --- | --- |
| `hud-flash-in` (desktop) | `#/mars` at .55 s: the HUD just on, its left readouts coral easing back; the cursor's "-" |
| `hud-flash-rate` (desktop) | Live picked at 2.5 s, seek 2.6: TIME RATE "LIVE" coral; sub-observer and sub-solar (drift until then) white |
| `hud-flash-rm` (desktop, reduced motion) | As above, "LIVE" white |
| `intro-tick` | `#/` at 2.65 s: the countdown just ticked, coral; UTC between ticks and the sun elevation white |

The HUD's readouts are hidden on a phone (`responsive.css`), so its three states are desktop only; `intro-tick` runs at
both sizes. `intro-2s` and `reduced-motion` checks mention the flash.

### Telemetry flash review fixes (done)

Ten findings (independent review of Should 7, 2026-10-21); 1 = 6 = 10 and 4 = 9 are the same defect seen twice or
three times. All fixed; finding 1's and 6's suggested longer hold not taken, finding 7's state at the default rate
rather than Live (Decisions 163, Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 6, 10 | On the Moon at ×600 the sub-observer and sub-solar tick over every ~1.1 s, past the .5 s hold, so they (and, with the cursor resting, sun elevation and local time) flashed coral for as long as the globe was open, the pulse Decisions 162 rejected; `body-moon` showed it | Fixed in `ui/hud.ts`: the four readouts sim time moves (sub-observer, sub-solar, sun elevation, local time) pass `news` to `setReading` only at Live (ticks 24 s or more apart) or on the frame something happened: the HUD coming on, a body or rate picked, the cursor landing on or leaving the globe (a key of body, rate and `cur.on`). Otherwise their changes are written and recorded as changes (so the hold still sees them as drift) but never flashed (`motion.ts setReading(el, s, news)`; Decisions 163). A longer hold not taken: the Moon's local time ticks every ~3 s and its sun elevation near local noon slower still, so any hold leaves a pulse somewhere. `body-moon` now `expect`s no flash under way; its check says so |
| 2 | The detection frame's Matching line changes as a pin's search lands ("Reading Mars terrain" to "Earth sites", "No close analog", "No elevation data"), the change most worth a flash, and didn't flash | Fixed: the line is a stable `#sc3` written by `setReading` (`ui/detection.ts scanLine`, the Earth branch's "Rehearses" line folded in), the bar added and removed beside it. `stage.css`: coral mixed in as in the HUD, and the line's .62 opacity lifted to 1 at the peak, since coral barely parts from Mars's peach `--sc`. New state `engine-mars-pin-lands` |
| 3 | The intro frame's counter (00 / 03 to 03 / 03) steps as each line arrives and didn't flash | Fixed: the timeline writes it through `setReading` (its reset through `setText`); `intro.css` mixes coral into its own .62 white. `intro-2s` (02 / 03 just stepped) shows it |
| 4, 9 | The bottom intro corners' dark text (#0C1A26, 4–6:1 over the horizon glow) went to coral at ~1.4:1 on every sub-point flash (every ~1.6 s) and on the first frame; the `#intro .tl span` rule sat in `hud.css` | Fixed: the sub-point and sun elevation are written with `setText` (drift, never flashed); the flash rule for the intro moved to `intro.css`, for the countdown and the counter only, both over dark sky |
| 5 | `hud-flash-rate`'s `expect: '#h-rate[style*="--fl"]'` passed on the `--fl: 0` GSAP leaves after the HUD-on flash | Fixed: `[style*="--fl: 0."]`, a flash under way (~.74 at 2.6 s). The new states use the same test |
| 7 | No state shows the cursor's four readouts flashing as the pointer lands | Fixed: a `hover` step in the harness (the tap's pointer move without the click) and `hud-flash-cursor` (desktop, `#/moon` at ×600: the four coral, the sub-observer and sub-solar white, both `expect`ed) with `hud-flash-cursor-rest` (5.4 s on, the pointer resting: no flash under way). At the default rate rather than Live, since landing flashes at any rate now and ×600 on the Moon is the case finding 1 is about |
| 8 | UTC ticks on whole seconds and the countdown at x.6 s, so the top-right corner pulsed twice a second for the whole intro | Fixed: only the countdown flashes; UTC is written with `setText` |

**Tests** (319, was 318): `motion.test.ts` (a change marked drift is written without a flash and still counts as a
change, so a news change .2 s later doesn't flash).

**Harness.** `capture.mjs`: a `{ hover: sel, fx, fy }` step. New refNA states `engine-mars-pin-lands`,
`hud-flash-cursor`, `hud-flash-cursor-rest`; `body-moon` and `hud-flash-rate` `expect`s; `intro-2s`, `intro-tick`,
`reduced-motion` and `body-moon` checks reworded.

**Verification** (2026-10-21): see the Log entry.

### Beyond imagery (Should 8, done)

**What shows.** Each Beyond card's 16:9 frame holds its world as a spacecraft saw it, drawn in the footer carousel's
dots: the image's brightness at each dot against the same 4×4 Bayer matrix (`ui/carousel.ts BAYER`, now exported),
square dots .72 of the pitch, the footer's pitch (3 CSS px over 600 px wide, else 2.5), one ink per world: Venus
`#EAD8B2` and Mercury `#C9CCD2` (their orbits' colours in the galaxy diagram above), Callisto `#CFC4B2`, Titan `#E2A561`
(their own tones). Venus from Mariner 10 (PIA23791, the 2020 reprocessing's contrast-enhanced version), Mercury from
MESSENGER (PIA16853, the enhanced-colour global mosaic), Callisto from Galileo (PIA03456), Titan from Cassini's
infrared spectrometer (PIA20016, the dunes through the haze). Each world fills about .8 of the frame's height,
centred (Decisions 164). Under the frame a caption line: the mission at the left, linking the image's page in NASA's
library, the credit at the right (Geist 11.5 px in the cards' muted text, ~4.9:1; a long credit wraps, right-aligned,
in a narrow card). The canvas is `role="img"` with words for the image (it was `aria-hidden` while painted), hidden
from screen readers until its image is drawn (review fixes). The info sheet's Data column gains a Beyond line.

**Beyond scrolls when it must.** The caption line makes each card 22 px taller, and `#beyond` was a fixed, unscrolled
page above 620 px tall: at 1280 wide it would have clipped the cards' foot below ~658 px tall (636 before), and in the
two-column range (761–1000 px wide) the 2 × 2 grid already ran up to ~300 px off the bottom with no way to reach it
(900 × 800: 299 px). `#beyond` now scrolls vertically and its column is at least the window's height (`min-height`
where it was `height`), so where everything fits nothing changes (1280 × 800, 1024 × 768: no scroll, the same layout)
and where it doesn't the page scrolls; the short-window rule keeps only the cards' strip.

**Data and assets.** `src/data/photos.ts BEYOND` (beside the surface photographs; the script imports it): each image's
NASA id, `crop` (frame centre and height as fractions of the image), `part` (Venus: the right of the page's two
versions), ink, caption and alt text. `npm run fetch:real -- --only=beyond` (`beyond()` in `fetch-real-data.mjs`)
fetches each from the library like the photos, cuts the 16:9 frame (black past the image's edges), greys it, lifts local
contrast (CLAHE 20 × 20, slope 3) and stretches the world's own tones (2nd to 99.5th percentile of its lit pixels),
then writes `public/textures/<key>.jpg`, 320 × 180, into the textures manifest. (A first cut put the caption over the
frame's empty corners with each world a little above the middle; at 1024 px Titan's credit wrapped up onto its disc, so
the caption moved under the frame and the worlds back to the centre.) As texture keys they load with the maps
(after the worlds, or on entering Beyond if that comes first; everything on a Beyond deep link and under `?capture`),
never reach the GPU (no material reads them), and replace the prototype's embedded `venus.jpg` (8 KB) and `mercury.jpg`
(106 KB) placeholders: 26 KB for the four. `scripts/extract-textures.mjs` and `npm run extract:textures` are gone:
nothing was left to extract, and a run would have written the placeholders back over the images.

**Drawing.** `views/beyond.ts paintOne` sizes the canvas to its box × the pixel ratio (≤ 2), draws the image into a
grid of one pixel per dot and dots the grid. The reveal draws all four at 3.2 s (before the cards fade in at 3.3 s),
on every entry, so a resize away from Beyond is picked up; a resize on Beyond draws them again. Nothing else draws
them: Beyond holds still (`beyond-held` against `beyond`: only the top bar's clocks differ). An image that lands after
the cards were drawn (`app.ts onAsset` → `redrawScenes(key)`, that card only) draws and fades its canvas in over .9 s
over the empty frame; one that never lands leaves the frame empty under its caption. `onAsset` no longer repaints
Beyond for the worlds' maps (it read the Moon's map for Callisto's ground): Decisions 160's crossfade is now this fade.

**Tests** (320, was 319): `photos.test.ts`: every card's scene in `index.html` has a `BEYOND` entry, each with its
320 × 180 manifest entry, words, a hex ink and a crop inside the image.

**Verification table** (`scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `beyond` (check reworded) | The four worlds in dots, each in its ink, the mission and credit on each image's foot clear of the world |
| `beyond-held` | 29 s later: the same pixels but the top bar's clocks |
| `beyond-cards` | A Beyond deep link (the reveal at once), `#beyond` scrolled to its foot (no scroll at 1280 × 800): all four drawn; phone: the first card whole |
| `beyond-late` (refNA) | `venus.jpg` answering 404: Venus's frame empty under its caption, the others drawn, no error |

**Verification** (2026-10-21): see the Log entry.

### Beyond imagery review fixes (done)

Ten findings (independent review of Should 8, 2026-10-21); 1 = 4 = 9 and 3 = 8 are the same defect seen more than once.
All fixed; finding 7's two-line caption only where a credit can wrap (Decisions 165, Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 4, 9 | The `beyond` and `beyond-late` checks still named Galileo / "NASA/JPL" for Venus (an earlier pick); the build shows Mariner 10, NASA/JPL-Caltech | Fixed: both checks name Mariner 10 and NASA/JPL-Caltech |
| 2 | Entering Beyond never asked for its images: they waited for the site data and every world's full map (~4.7 MB), so a quick sideways scroll from a fresh `#/system` on a slow link showed four empty frames | Fixed: `playBeyond` calls `loadTextures(Object.keys(BEYOND))` (each fetched once, `first[k]`); images landing before the cards draw at 3.2 s are drawn then, later ones fade in through `redrawScenes`. Probed with the worlds' maps held back 15 s: all four asked for 13 ms after entry. `app.ts`'s load-order comment says so |
| 3, 8 | Each canvas was `role="img"` with its words from module load, so an image that failed or hadn't landed (`beyond-late`) was announced over an empty frame | Fixed: each canvas starts `aria-hidden="true"`; `paintOne` drops it once it has drawn the image. The caption still credits the source. `beyond-late` `expect`s Venus's canvas hidden |
| 5 | The phone compare sheets were from the first capture run (caption over the frame's corner): the commit landed while the second run was still writing | Fixed: full capture re-run to the end before this commit; the compare sheets match the build |
| 6 | The late-image fade tweened the whole canvas, whose CSS background was the empty frame, so the frame blinked to the card's lighter ground and back | Fixed: the frame's ground and radius are on `.card figure::before` (a 16:9 box under the canvas); the canvas is transparent, so the fade moves only the dots. Probed at opacity .15: the frame stays navy |
| 7 | In four narrow columns Titan's credit wraps to two lines, pushing Titan's label, heading and copy ~15 px below the others | Fixed: from 1001 to 1199 px wide (and over 620 px tall, where the grid shows) every caption is at least two lines; probed 1001–1440: the four headings level at every width (Titan wraps below 1070 px in Chromium; the reviewer saw ~1150, hence the margin) |
| 10 | `#beyond` scrolls, but `reveal()` never reset it, so a return reopened partway down with the focused Back button off-screen | Fixed: `reveal()` sets `scrollTop = 0` first. Probed at 900 × 700: 399 px down, out to the system and back, 0 |

**Verification** (2026-10-21): see the Log entry.

### Beyond imagery review fixes, round 2 (done)

One finding (independent review of Should 8, 2026-10-21). Fixed, by measuring rather than the finding's breakpoint
(Decisions 166, Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The caption line makes every card 22 px taller, so on short desktop windows the cards ran into the galaxy's labels (1366 × 657: 27 px into cards 1 and 4, through their translucent ground; 1280 × 680: 19 px; 1536 × 730: 4 px); in two columns (900 × 800, 768 × 1024) the cards scrolled past the fixed labels | Fixed: `views/beyond.ts fitLabels` hides the labels (`#beyond.nogl .gl{ visibility:hidden }`) whenever a label's bottom is below the cards' top scrolled to the end, on each entry and resize. Probed 6,525 windows (761–3840 wide, 621–1400 tall): no shown label meets a card; the five sizes above hide them, 1280 × 800, 1440 × 789, 1536 × 760, 1920 × 960 and 1000 × 1600 still show them clear (14–103 px) |

**Verification** (2026-10-21): see the Log entry.

### Fallback without WebGL (Should 9, done)

Round 1 (port parity fixes, round 1, finding 9) put up a minimal page: the title's ground and coral wordmark in CSS, the
reason, and the featured sites with their curated established analog sites. This round makes it the plan's item.

**When it shows.** `main.ts`: no WebGL2 context (tested on a scratch canvas before three, as before), a start that
throws (as before), and now a lost context: `webglcontextlost` on `#gl` shows the page with "The 3D view stopped: the
browser lost its graphics context. Reload the page, or open a site below, to start it again." The first reason wins
(`showFallback` shows once). While the context is lost the scene doesn't draw (`renderer.ts isPaused`); a restore is
not waited on (Decisions 167).

**The poster.** The page's first screen is the title, frozen: `public/poster.jpg` (1920 × 1200, 46 KB) or, below
width/height .8 as the title's portrait layout, `public/poster-tall.jpg` (780 × 1688, 22 KB) as a cover image, with the
title's own lockup, `h1.big` wordmark, blurb and meta row laid over it (title.css's classes, shown at once), so at the
capture sizes the text sits exactly where the title's does. The blurb's first line is the reason (white, 500), then the
title's two sentences in one paragraph (Moon bases and Mars, terrain form at 200 m), then Featured sites (a primary
button that scrolls to the list and focuses its heading); the meta row's right reads "Scroll for featured sites". The
title's ground in CSS stays under the image until it is in, or if it fails. The images are the scene alone (no DOM),
from the capture state `title-shot` (`#/`, seek 16, device scale 2, an `eval` step hiding everything but the canvas),
web-sized by `scripts/poster.mjs` (sharp, mozjpeg 76): `npm run poster` runs both. Credited under the list and in
`docs/credits.md`. Must 9's first-paint `#poster` is still removed when the page shows.

**The list.** "Featured sites" (h2), a lede, the purpose (rover mobility, the default: no picker here), the engine's
tested line and the sample-results note, then the Moon and Mars (h3; two columns from about 970 px wide) with each featured
site (h4 linking `#/<world>/<site>`, its point to 4 dp, kind and note) and its doubles from the data seam: the site's
own search (`data/client.ts doublesOf`, the one the site view and the grid show; the search needs no WebGL). By name
all at once (the engine's cache), by coordinates one at a time (Arcadia, Meridiani, Elysium: 6 s each in the mock;
the south-pole regions answer no_dem at once), each warming up asked again 3 s later, as the grid asks them. Per site
(`fallback.ts fbDoubles`, pure, tested): the IAU feature searched and the capability banner, then the three closest
in an ordered list, each its country linked to its comparison (`#/<world>/<site>/compare/@lat,lon`), its point, the
established-site tag, "Shape match high." and the card's summary line, and "Differs: …" when the engine names gaps;
the results' caveats once under the three ("Notes: …"); the engine's no-match wording in place of the list's lead.
Where the engine has no elevation (no_dem: the four Artemis regions) the site's established analog sites, unscored,
each linked to its comparison. Otherwise the search's state in words: waiting its turn, Searching Earth…, Reading
Mars terrain…, Search engine starting up…, or the failure's heading with "Reload the page to try again." A box is
`aria-busy` until its search settles; boxes searched by coordinates are `aria-live` (by name: all at once, unannounced),
as the grid's cards.

**Links.** Without WebGL a deep link (on load, and on any hash change, so also a click) lands on its site's entry: the
entry is focused, takes the selected row's surface and is scrolled to the top, and kept there while the searches above
it fill in, until the reader scrolls, taps or types (a pin, the grid or an Earth route have no entry: the page stays at
the poster). After a lost context the page opens on the poster (the reason shows; no landing), and a link reloads the
page at its route, into the full view when a new context works (Decisions 167).

**Tests** (325, was 320): `ui/fallback.test.ts` (5): the three closest linked to their comparisons with country, point,
shape match and summary; the IAU feature, banner and the notes said once; what differs, the no-match wording, escaping;
no_dem's established sites linked and unscored; every state in words.

**Verification table** (`scripts/capture-states.mjs`; the harness gains an `eval` step: a JS expression run in the page):

| State | Check |
| --- | --- |
| nogl: `no-webgl` (check reworded) | The title as a poster: the title shot under its lockup, wordmark and blurb; the reason first; Featured sites; desktop: "Scroll for featured sites" |
| nogl: `no-webgl-list` (refNA) | Scrolled to Featured sites at 1.5 s: the Moon then Mars (desktop: two columns), named sites with their three doubles, Jezero's banner, the notes once; the south pole's established sites; Mars by coordinates reading or waiting |
| nogl: `no-webgl-done` (refNA) | 45 s, scrolled to Arcadia: every search in, Mars's sites by coordinates with their doubles |
| nogl-deep: `no-webgl-deeplink`, `-later` (refNA) | `#/mars/utopia/compare/salda` without WebGL: Utopia's entry highlighted at the top (as far as the page scrolls); at 8 s, after Arcadia's search above it landed, still there |
| `context-lost` (refNA) | `#/mars/jezero`, seek 3, the context lost (`WEBGL_lose_context`): the page, its reason "The 3D view stopped…", at the poster |
| `title-shot` (refNA) | The poster's source: the title's scene alone at device scale 2 |

**Verification** (2026-10-21): see the Log entry.

### Fallback without WebGL review fixes (done)

Eighteen findings (independent review of Should 9, 2026-10-21); 1 = 8 = 17 are the same defect. All fixed but 5,
logged as a reading of the plan (Decisions 167); 1's no-WebGL half and 12's "polar sites only" taken differently
(Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 8, 17 | After a lost context a link to the route already in the address (Jezero Crater on `#/mars/jezero`) changed no hash, so nothing reloaded | Fixed: `fallback.ts` handles the page's own `a[href^="#/"]` clicks (no modifier key: a new tab stays the browser's): `pushState` the link's hash when it differs, then lost: `location.reload()`. Back and forward still reload through `hashchange`. Probed: lost on `#/mars/jezero`, Jezero Crater's link reloads into the full site view. The no-WebGL half (land again on the current link) follows finding 11 instead (Deviations) |
| 2 | A lost context was never announced: focus fell out of the now inert app | Fixed: after a lost context the reason (`.fb-msg`) is `role="alert"` |
| 3 | After a lost context the list searched with the panel's filters (country, area, partners…) while saying only the purpose | Fixed: `showFallback` resets `query` to rover mobility, no filters, as a reload searches (the links reload): the page's searches, its purpose line, the shortcut and Decisions 167 agree on every path |
| 4 | The three doubles' caveats merged into one "Notes" line, so Hadley's polar note (rows 1 and 2) read as covering row 3 | Fixed: caveats all three share are said once ("Notes on all three: …"), the others on their own row ("Note: …"); tested. `no-webgl-deeplink-later` (desktop) shows Hadley's polar note on rows 1 and 2 only |
| 5 | Screen readers reach the plain list only when WebGL fails | Not changed; logged (Decisions 167): with WebGL the site grid (`#/<world>/sites`) lists the same sites and their three closest doubles as text, and each site's panel its results; a skip link into a second mode of the app is the Accessibility pass's call |
| 6 | The poster's credit named only Blue Marble and Black Marble | Fixed: "…drawn from NASA’s Blue Marble and Black Marble maps of Earth, NOAA’s ETOPO1 relief and the MODIS water mask."; `docs/credits.md` quotes it |
| 7 | "Matching on the Moon reaches 60°…" was always shown, and would outlive polar DEMs at the merge | Fixed: the sentence is gone from the purpose line; the no_dem entries lead with the site view's own wording ("The search engine reads Moon terrain only within 60° of the equator, so these established analog sites are unscored:"), so it goes when no_dem does (Merge notes) |
| 9 | The poster's centred crop cut the sun at the top on windows wider than 16:10 | Fixed: `.fb-poster{object-position:50% 0}`. New opt-in `laptop` viewport (1440 × 810, 16:9): `title` and `no-webgl` there both run the sun's streak through the lockup |
| 10 | A deep link landed mid-list with the reason nowhere on screen | Fixed: the landed entry carries "The 3D view can’t open here. <reason>" (`.fine`) under its name, moved with each landing |
| 11 | A click on a double's link focused its entry and scrolled it to the top (the link jumped ~200 px; Tab restarted at the site) | Fixed: a click on the page's own link marks its entry only (`land(false)`): focus stays on the link, the scroll stays. Loading, back, forward and a pasted link still land (focus, scroll, hold). Probed: Jezero's third double and Gale's link: scroll and focus unchanged; back lands. New state `no-webgl-click` |
| 12 | No state showed the engine failing (every entry a failure line, the polar sites without their static analogs), and the deep-link states sat at maximum scroll, so the hold went untested | Fixed: a failed search lists its site's established analog sites, unscored, under the failure line (every site: Deviations); tested; new state `no-webgl-fail` (`mock=fail`, 20 s). The deep-link states open `#/mars/gale/compare/atacama` with `mock=slow` (every answer at 10 s): Jezero's results land above Gale after the landing and Gale is held at the top (24 px) at 12 s |
| 13 | Featured sites put its heading flush with the top | Fixed: `#fb-h{scroll-margin-top:40px}`; `no-webgl-list` now taps the button (a real 1.5 s wait for its smooth scroll): the heading 40 px down |
| 14 | three restores a lost context, and `isPaused` read it live, so the scene drew again behind the page | Fixed: `renderer.ts` sets a sticky `lost` on the first `webglcontextlost`; `isPaused = paused \|\| lost` |
| 15 | After a lost context the dead app's Escape and hashchange still routed (Escape reloaded into `#/mars`) | Fixed: `app.ts start()` sets `state.ready = false` on `webglcontextlost` (and ends with `state.ready = !lost`, for a context lost during the start), so `input.ts`'s keys and the router's `hashchange` stand down. Done in app.ts, not main.ts (Decisions 167). Probed: Escape on the lost page: no reload, hash unchanged |
| 16 | After a lost context on a grid route the grid's queue aborted the page's searches, leaving "Waiting its turn…" for good | Fixed: `one()` asks again on `aborted`. Probed: lost on `#/mars/sites`: all six Mars entries in by 20 s |
| 18 | `strs` copied from `ui/results.ts`; `.fb li.on` declared twice | Fixed: `strs` exported from results.ts and imported; the rules folded |

**Tests** (327, was 325): `ui/fallback.test.ts` (7, was 5): a note on some rows stays on those rows, the shared ones
said once; a failed search still lists the site's established analog sites, unscored; the no_dem lead's 60° wording.

**Verification table** (changed and new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| nogl: `no-webgl-list` (refNA) | Tapped Featured sites: the heading 40 px down; the south pole's established sites under "reads Moon terrain only within 60° of the equator"; the notes all three share once |
| nogl-deep: `no-webgl-deeplink`, `-later` (refNA) | `#/mars/gale/compare/atacama?mock=slow` without WebGL: Gale's entry highlighted with "The 3D view can’t open here…", as high as the page scrolls at 1 s; at 12 s, Jezero's and its own results in, held at the top |
| nogl-deep: `no-webgl-click` (refNA) | Gale's third double clicked: nothing moves, Gale still highlighted |
| `no-webgl-fail` (refNA) | `mock=fail`, 20 s: every site the failure line, then its established analog sites, unscored, linked |
| opt-in `laptop`: `title`, `no-webgl` | 1440 × 810: the poster's sun and streak through the lockup, as the title's |

**Verification** (2026-10-21): see the Log entry.

### Fallback without WebGL review fixes, round 2 (done)

Two findings (independent review of the round-1 fixes, 2026-10-21), both fixed; finding 1 by its first option.

| # | Finding | Outcome |
| --- | --- | --- |
| 2 | A context lost while the app's search by coordinates ran (a pin, or Arcadia, Meridiani or Elysium, 5–10 s) froze the tab: the page's first search by coordinates (Malapert) called the app's off; the panel's `watch` resolved into `fill()`, whose `doublesOf` asked the deleted search again and called the page's off; `one()` asked again at once, and so on, every step a microtask. chrome.ts's once-a-second status line did the same, slower | Fixed at the root: once the context is lost the dead app asks no search. `state.ready` (false on `webglcontextlost`, `app.ts`, before the page's chunk loads) is checked in `panel.ts fill()`, `watch()` and its warming retry, `chrome.ts updateStatus`'s search line, `views/grid.ts shown()` (so `askGrid`, its queue and `fillGrid` stop), and `views/site.ts`'s held dive, which waits on a globe pin's search and asked it again the same way (not in the finding: probed, it froze too). `app.ts onAsset` returns once `lost` (a late map or the site data redrew the dead panel, which asked once more). `one()` still asks again when called off. Reproduced before the fix: `context-lost-pin` and `context-lost-pin-held` time out (the tab never answers); after it both pass and every entry fills in. Probed too: lost on `#/mars/sites` mid-queue and on a warming Arcadia (`mock=warming`): every entry in |
| 1 | A lost context on a booking step covered the half-filled campaign plan with the page; every way back reloads, and plans lived in memory, so the dates, team, gear and notes were gone (a phone switching to its calendar can drop the context) | Fixed (the finding's first option): `data/booking.ts` keeps plans and requests in `sessionStorage` (`eidolon.booking`) on `pagehide` and when the page is hidden, and reads them back on load through `keptOf` (a trust boundary: each whole plan and request, field by field, nothing else; bad JSON or blocked storage start afresh). So a reload, after a lost context or not, goes back to the plan as it was (Decisions 168). On `…/book/plan` and `…/book/review` the lost page's reason says so: "The 3D view stopped: the browser lost its graphics context. Your campaign plan is kept: reload the page to go back to it." The second option (keep the panel working over the dead stage) not taken (Deviations) |

**Tests** (329, was 327): `data/booking.test.ts` (2): a kept plan and request come back as they were; what isn't a
whole plan or request (a number for the team, a gear item that isn't a string, a missing field, a request without its
reference, bad JSON, the wrong shapes) is dropped, and extra fields with it.

**Harness:** a `reload` step (the page reloaded as the browser's button does, then the app's start awaited; the route
start is t = 0 again).

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| lost-book: `context-lost-book` (refNA) | `…/compare/@34.6750,-105.0750/book/plan`, days 2 to 6, team 6, rover and notes filled, then lost: the page, "…Your campaign plan is kept: reload the page to go back to it." |
| lost-book: `context-lost-book-reload` (refNA) | Reloaded: the same step as it was left (days, team 6 and rover asserted; the notes) |
| lost-pin: `context-lost-pin`, `-done` (refNA) | `#/mars/@10.0000,20.0000`, lost at 2 s mid-search: the page (no freeze); at 48 s no entry busy (asserted), Arcadia, Meridiani and Elysium with their doubles |
| `context-lost-pin-held` (refNA) | A pin clicked on the Mars globe, its search holding the detection frame, lost at 3 s: at 50 s no entry busy (asserted) |

**Verification** (2026-10-21): see the Log entry.

### Accessibility pass (Should 10, done)

**axe** (`npm run a11y`, `scripts/a11y.mjs`, dev dependency `@axe-core/playwright` 4.14.0): each of 20 main routes
(intro, title, system, info sheet, Beyond, the three body views, the site grid, a featured site, a pin, an Earth site,
compare terrain, globe and overlay, a search result's compare, the booking listing, plan and its errors, the page without
WebGL) loads `/?capture#<route>` on the dev server, seeks to a settled moment and runs axe with the WCAG 2.1 A and AA
rules, at 1280 × 800 and 390 × 844; exit code 1 on any violation. Before: 36 of 40 runs failed, on two rules.
`color-contrast` (30): `--text-3` (#6C727A, the labels' grey) at 3.73–4.17:1 on every surface. `label-content-name-mismatch`
(6): `#cue`'s name "About Eidolon" against its visible "More about Eidolon", and the booking days' names ("Mon 5 Oct:
wind …") against their visible "Oct 5". After: none. axe's best-practice rules, run once by hand: the compare table's
empty corner header (fixed, below); `label-title-only` on the purpose select, which is named by its visible "Test
purpose" heading through `aria-labelledby` (Chrome's name is right; the rule wants a `<label>`): left.

**Contrast.** `--text-3` is #80868E (Decisions 169): 4.56:1 on `--surface-3` (the selected row), 5.5:1 on `--bg`. axe
can't see behind text over the canvas (every such node "needs review"), so the HUD and graticule were set by measure:
the HUD's labels `rgba(160,166,174,.9)` (about 6:1 over the stage's ground, was .75), the full-maps loading line the
same, the graticule labels `rgba(231,233,236,.8)` (was .55; their dark halo carries them over a lit surface). The
intro's craft telemetry stays as it is: decorative, the brief's lines (live) carry the message.

**Focus order.** Tab runs: the skip link, the top bar, the 3D view, its markers and buttons, then the panel (a route
puts the focus on the panel's heading, as before). Fixed on the way: the top bar slid off the intro and title but was
still a Tab stop (four stops above the screen); it is `visibility:hidden` once off. A marker on the globe's far side
faded out but kept its Tab stop (two of Mars's six at 2.5 s); it is hidden once faded.

**Skip link** (`#skipto`, first in the body): shown over the top bar's left end while it has the focus, "Skip to the
panel" on the body, site and compare views (to the panel's heading), "Skip to the featured sites" on the grid (to its
heading); not on the views without either (intro, title, system, Beyond). A button: the router owns the hash.

**Keyboard on the 3D view** (`scene/input.ts`). On the body, site and compare views the canvas is a Tab stop with role
`application` (screen readers pass the arrows through) and a name for what its keys do there ("Mars globe. Arrow keys
turn it, plus and minus zoom, Enter pins the point at its centre." / "Terrain of Jezero Crater. Arrow keys orbit it…" /
"Mars and Earth globes. Arrow keys turn Earth…"); elsewhere it isn't focusable at all. Arrows are a 24 px drag (right
and up look east and north; on terrain, orbit), + / = and − / _ zoom about a wheel notch, Enter pins the point facing the
camera wherever a click would pin (the body view, and a held pin's search: another point). On compare's globes the keys
turn Earth, whose view Search this area reads. 0.4 s after the keys rest the globe's centre is said in `#live`
("Centre 15.9° N, 192.6° E"): where Enter would pin. `scene/bodies.ts facing()` (new) is that point, shared with the
HUD's sub-observer and the graticule. Focus shows as a white 1.5 px frame 6 px inside the viewports the keys move
(`#kf`, placed by `ui/chrome.ts placeChrome`): an outline on the full-screen canvas would sit under the top bar and panel.

**Focus styles.** One ring, the base `:focus-visible` (1.5 px white, 2 px off): the selects, the coordinate and search
fields and the notes textarea dropped their `outline:none` (their border still brightens). The skip link and the 3D
view's frame use the same white.

**Search said as it changes.** A static `#live-s` (`role="status"`) says the shown site's search in a few words:
"Searching Earth…", "Reading Mars terrain… A search by coordinates takes 5 to 10 seconds.", "Loading more doubles…",
"The search engine is starting up…", "5 Earth doubles found. The closest: United States of America, shape match
high.", the no-match wording, no elevation data, or the failure's heading (`ui/results.ts searchSay`, pure, tested).
Written by `ui/chrome.ts updateStatus` (on each route and once a second) from `searched()`, which never starts a search;
a warm-up's retries stay one state. The doubles box is no longer `aria-live` (Decisions 169). The grid's cards by
coordinates and the fallback page keep theirs.

**Labels.** `#cue` named by its text. A booking day's name is its content: the weather sentence in `.sr`, the bar, the
two-letter mark and the date `aria-hidden` (its tooltip unchanged). The compare table's rows are row headers
(`th scope="row"`) under a corner named "Measure" (screen-reader text). `#intro-ov` (the system view's "Choose a world")
hides with `autoAlpha`, so its h1 isn't read on every other view. `#cursor` is `aria-hidden`.

**Tests** (330, was 329): `ui/results.test.ts` (1): the search said running (by name, by coordinates, more), found, no
match, no sites, failed (with and without cards kept), called off, no elevation, and a warm-up's retry as the warm-up.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| a11y-skip: `a11y-skip`, `a11y-skip-go` (refNA) | `#/mars/jezero`: the skip link focused, on screen over the top bar ("Skip to the panel"); Enter: the focus on the panel's heading (asserted) |
| a11y-globe: `a11y-globe-keys`, `-said`, `-enter`, `a11y-search-said` (refNA, desktop) | `#/mars`, the 3D view focused, three right arrows, one up and +: the frame inside its viewport, the globe turned east and north and zoomed (role, name and frame asserted); 0.5 s on the centre said; Enter: a pin at the centre, its search held on the globe, "Reading Mars terrain…" said; at 12 s, dived, "5 Earth doubles found…" said (asserted) |
| `a11y-terrain-keys` (refNA, desktop) | `#/mars/jezero` focused, three left arrows, down and −: the frame round the terrain, the block orbited, lower and farther |
| `a11y-compare-keys` (refNA, desktop) | Compare's globes focused, three left arrows: the frame round Earth's viewport only, Earth turned |
| `a11y-title-tab` (refNA, desktop) | Tab on the title: the ring on Enter the system, not the hidden top bar (asserted) |

**Verification** (2026-10-21): see the Log entry.

### Accessibility pass review fixes (done)

Twelve findings (independent review of Should 10, 2026-10-21); 4 = 6 = 12 and 5 = 11 are the same defect. All fixed;
two parts left as they were, logged (Deviations): 7's frame across the zoomed HUD's left readouts, 9's grid skip link
over the phone's time toggle.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | A new search from the purpose, a filter or Search this area wasn't said: `#live-s` was written once a second and only on a change, and a named target's search settles within milliseconds to the same sentence as before; the same on a route to a site whose summary matched the last | Fixed: `ui/chrome.ts saySearch(again)` (was inline in `updateStatus`). Asked afresh (`ui/panel.ts asked()`: purpose, filters, area; Try again and Show more) or another site shown: the region is emptied and written 0.15 s later (app clock), so the same sentence is said again; `fill()` calls it as a search settles, not on the next second. A warm-up's retries still stay one state. Probed in states (MutationObserver): Education on Jezero empties then writes "5 Earth doubles found…"; Exclude polar empties, "Searching Earth…", then the same sentence |
| 2 | The crumbs' `overflow:hidden` cut the focus ring's top and bottom (and the first crumb's left) | Fixed: `#crumbs{margin:-4px; padding:4px}`, room for the 3.5 px ring, the crumbs where they were. State `a11y-crumbs-ring` (2×): the ring whole round "Solar system" |
| 3 | The HUD was hidden by opacity only: every view read "Sub-observer -, …" and "[ Click the surface to pin a site ]" (wrong on terrain) | Fixed: `ui/hud.ts` sets `aria-hidden` with its `on` class (asserted in `a11y-terrain-keys` true, `a11y-globe-keys` false) |
| 4, 6, 12 | Sighted keyboard users saw only the frame: the hints still said click, drag and scroll; nothing marked where Enter pins; the cursor readouts stayed "-" | Fixed: while the 3D view has the keyboard focus (`scene/input.ts keyed()`: focused and `:focus-visible`) the status bar says its keys in the branches of its name ("Arrow keys turn the globe. + and − zoom. Enter pins the centre." / "…Enter searches the centre instead." / "Arrow keys orbit. + and − zoom. Esc returns to the globe." / "Arrow keys turn Earth. + and − zoom it."; `chrome.ts hint()`, on focus and blur too), the HUD hint "[ Arrows turn · + − zoom · Enter pins the centre ]", and the reticle sits on the globe's centre with the cursor readouts (cursor, sun elevation, local time, daylight) for `facing()`. Asserted in `a11y-globe-keys`, `-enter`, `a11y-terrain-keys` |
| 5, 11 | The booking days' names didn't hold what they show ("Mo 5", "Oct 1"); hiding the marks only silenced axe | Fixed: the name starts with the visible text: "Mo 5, Mon 5 Oct: wind …" (the `.sr` text; the marks stay hidden, as two grid items they'd read "Mo5"). Asserted for every day in `book-plan` |
| 7 | The frame ran under the status bar | Fixed: it ends above it (`--kh` less `--status`; on a phone only while the status line shows, as `#area`). Its left edge across the HUD's left readouts when zoomed in: left (Deviations) |
| 8 | Enter's pin moved the focus to the panel's heading (no ring there, the keys dead, the hold's name on a control just left); the skip link's arrival unmarked too | Fixed: a route while the 3D view has the keyboard focus leaves it there (`renderPanel`, not on the grid, where the view isn't a Tab stop); `.title` keeps its `outline:none` only until a key is first pressed (`html.kb`, set once by `scene/input.ts`) and fits its words, so a keyboard arrival (the skip link, a row by Enter, Enter in the coordinate field) shows the ring, a click doesn't, and a deep link's load doesn't (Chrome rings a script focus before any input as a keyboard one: the first full capture showed it on every site, body and compare view) |
| 9 | Capture states missing or weak: the grid's skip link, compare's terrain frame, a phone keyboard state; `a11y-search-said` mid-dive | Fixed: `a11y-skip-grid`, `-go` (both sizes), `a11y-compare-terrain-keys` (both), `a11y-globe-phone`; `a11y-search-said` at 16 s, settled |
| 10 | The 0.4 s "Centre …" fired after a route: over Enter's new route on every keyboard pin, and from the system camera after an arrow then Escape | Fixed: Enter schedules no centre (and kills one pending); the call keeps the route it was scheduled on and is dropped if it changed (as `panel.ts watch()`). Asserted: `a11y-globe-enter` ("Mars, Pin …" left in `#live`), new `a11y-keys-escape` ("Solar system" left) |

**Verification table** (changed and new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `a11y-crumbs-ring` (refNA, desktop, 2×) | Tab past the skip link and logo: the ring whole round "Solar system" |
| a11y-skip: `a11y-skip-go` | The ring round the heading's words (Jezero Crater) where the skip link sent the focus |
| a11y-skip-grid: `a11y-skip-grid`, `-go` (refNA) | `#/mars/sites`: "Skip to the featured sites" over the top bar's left end (on a phone over the logo and the time toggle's first button, while focused); Enter: the grid's heading focused, ringed |
| a11y-globe: `a11y-globe-keys` (desktop) | The frame above the status bar; the status bar, HUD hint, reticle on the centre and filled cursor readouts asserted; the HUD readable (`aria-hidden="false"`) |
| a11y-globe: `a11y-globe-enter` | Enter: the focus still on the 3D view, its name and status bar "…Enter searches the centre instead."; "Mars, Pin …" left in `#live` (asserted) |
| a11y-globe: `a11y-search-said` | At 16 s: dived and settled, the focus still on the view (now terrain), the results said (asserted) |
| `a11y-globe-phone` (refNA, phone) | Phone, the globe focused: the frame inside the globe's viewport above the sheet; the reticle on the centre |
| a11y-purpose: `a11y-purpose-said`, `a11y-filter-said` (refNA) | Education, then Exclude polar on Jezero: each said afresh (emptied, then the sentence; asserted) |
| `a11y-keys-escape` (refNA, desktop) | An arrow, Escape within 0.4 s: "Solar system" left in `#live` (asserted) |
| `a11y-terrain-keys` (desktop) | The status bar's keys asserted; the faded HUD `aria-hidden` |
| `a11y-compare-terrain-keys` (refNA) | Compare's terrains focused: one frame round both viewports, above the status bar (desktop) or the sheet (phone) |
| book: `book-plan` | Every day's name starts with what it shows (asserted) |

**Verification** (2026-10-21): see the Log entry.

### Accessibility pass review fixes, round 2 (done)

One finding (independent review, 2026-10-21), fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The graticule labels over the Moon's lit regolith measured about 1.3 to 2.3:1 (`body-moon`: 90°W, 60°W, 30°W, 60°S): light text on light ground, and the 4 px blurred halo too soft at 10 px for the .8 alpha to help | Fixed (Decisions 171): `#grat span`'s halo is a solid 1 px edge of `#06070A` (eight 1 px text-shadow offsets) under a 4 px soft one; colour unchanged (.8). Measured in `body-moon` (desktop; brightest glyph pixel against the darkest pixel of its edge): 90°W 8.3:1, 60°W 8.7, 30°W 7.9, 60°S 7.8 (were 4.0, 5.0, 5.4, 5.2, the halo's darkest pixel touching only a few strokes; the review's 1.3–2.3 is the glyphs against the ground). Looked at: `body-moon`, `moon-pole-zoomed`, `body-mars`, `body-mars-zoomed-2x` at both sizes |

No new capture state: `body-moon`, `moon-pole-zoomed` and `body-mars` already show the labels over lit ground.

**Verification** (2026-10-21): see the Log entry.

### Share and meta (Should 11, done)

**Copy link.** On the site and compare views (Earth sites too) the panel's first row holds the way back and, on its
right, Copy link (`ui/panel.ts head`: a `.back`-styled button with a 12 px line icon of two links, `.phead`). It copies
the view's route on this page's address, `origin + pathname + #/route` (`routeOf(state)`: compare's terrain, overlay or
globe as shown), without the query (`?mock`, `?capture`, `?wx` are development switches). `dom.ts copyText`: the
Clipboard API, else the copy command over a hidden textarea (a page over plain http has no `navigator.clipboard`), the
focus put back; the coordinate Copy uses it too (its select-the-field fallback stays, after the copy command). The
button says "Link copied" for 1.6 s (app clock), and `#live` says it; if neither way takes, "Copy it from the address
bar" ("Copy from the address bar" since the review fixes). Not on the booking steps: a plan isn't in the route
(Decisions 172).

**Page titles.** `routes.ts titleOf(route)` (pure, tested), set by `ui/chrome.ts chrome()` on every route (and as a
search names a cell's country): what the route shows, most specific first, then "· Eidolon": "Solar system", "Beyond
the Moon and Mars", "Mars", "Featured sites, Mars", "Jezero Crater, Mars", "Pin 18.38° N, 77.58° E, Mars", "Jezero
Crater and Lake Salda" (any compare view), "Campaign plan, Lake Salda" (a booking step: its step and the Earth side);
the intro and title "Eidolon". The same route has the same title however it was reached (the crumbs' "Featured sites"
from the grid isn't in it).

**Meta.** `index.html`: `description` (the title footer's paragraph), `og:type`, `og:site_name`, `og:url` (review
fixes), `og:title` ("Eidolon:
the Moon and Mars, on Earth", the footer art's line), `og:description`, `og:image` with its size and alt, and the
`twitter:` card (`summary_large_image`) with the same. Scrapers need an absolute image URL: `og:image` is
`%VITE_SITE_URL%/og.jpg`, `VITE_SITE_URL` in `.env` (empty in development, so `/og.jpg`; set it at deploy, Merge notes).

**Open Graph image.** `public/og.jpg`, 1200 × 630, 39 KB: the title view at a link preview's size, from the capture
harness's new opt-in viewport `og` (1200 × 630) and state `og` (`#/`, seek 16, device scale 2, an `eval` hiding the
buttons, the blurb's first paragraph and "Scroll for credits"), downsampled by `scripts/poster.mjs` (now three images).
`npm run poster` captures `title-shot` and `og` and writes all three; the posters are byte-identical after it.

**Self-hosted fonts.** The Google Fonts stylesheet and its two preconnects are gone from `index.html`. `public/fonts/`
holds Google Fonts' own woff2 files for the request the page made (Newsreader with its optical-size axis at 300 and
400, Geist 400–600, Geist Mono 400; all variable), latin and latin-ext, 275 KB in all, with `OFL-Newsreader.txt` and
`OFL-Geist.txt` beside them (SIL OFL 1.1; `docs/credits.md`, Fonts). Six `@font-face` rules in `tokens.css` with
Google's unicode ranges and `font-display:swap`, so in production they arrive in the app's one head stylesheet: first
paint no longer waits on a cross-origin stylesheet. Rendering is unchanged: `site-jezero`, `site-haughton` and
`compare-jezero-salda` at both sizes differ from the last commit's only in the Copy link button's pixels.

**Tests** (332, was 330): `routes.test.ts` (2): every view's title; a comparison's on each of its views, a cell before
its country, a booking step.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `share-site` (refNA) | Copy link right of "‹ Mars" (phone: on the sheet's back row); tapped: "Link copied", `http://localhost:5173/#/mars/jezero` reached the Clipboard API, `#live` "Link copied", the title "Jezero Crater, Mars · Eidolon" (asserted) |
| share: `share-compare` (refNA) | The overlay, no Clipboard API: the copy command's fallback copied `…/#/mars/jezero/compare/salda/overlay`, "Link copied", the title "Jezero Crater and Lake Salda · Eidolon" (asserted) |
| share: `share-fail` (refNA) | At 4.8 s back to "Copy link"; neither way takes: "Copy from the address bar" (review fixes), clear of "‹ Jezero Crater" on one row (asserted) |
| `og` (refNA, opt-in `--viewports=og`) | The title at 1200 × 630 (2×): Earth and the sun, the lockup, the wordmark, "Eidolon reads terrain form at 200 m…"; no buttons |

**Verification** (2026-10-21): see the Log entry.

### Share and meta review fixes (done)

Five findings (independent review of Should 11, 2026-10-21); 1 and 5 are the same. All fixed; 2 by its second option,
the limit logged (Deviations), not the query in the link.

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 5 | `og:url` missing: one of the Open Graph protocol's four required properties; Facebook's debugger warns, LinkedIn guesses | Fixed: `<meta property="og:url" content="%VITE_SITE_URL%/">`, absolute at deploy as `og:image` is (built with `VITE_SITE_URL=https://eidolon.example`: `https://eidolon.example/`; in development `/`). Merge notes |
| 2 | The copied compare link carries only the route: a compare of an engine cell found under another purpose or filters opens for the recipient without its twins, detail, country or Plan a test campaign here; Decisions 172 never took Decisions 36 up again | Logged, not changed: a `shortcut:` comment at `ui/panel.ts copyLink` and a Deviation. The query in the hash means parsing and validating a purpose and five filters from the URL (the countries against the engine's list, which loads after the route), for links the plan never asked to carry it (routes already deep-link); Decisions 36's "put them in the hash if links must" is the upgrade |
| 3 | "Copy it from the address bar" (about 190 px) wrapped any way back of about 16 characters or more (Meridiani Planum, a named target like Promontorium Archerusia) onto two lines; only the short Jezero Crater was captured; no keyboard state | Fixed both ways: the words are "Copy from the address bar"; the way back's label is its own span (`results.ts backBtn`, every caller) and on the panel's head row it gives way with an ellipsis (`.phead > [data-go]{min-width:0}`, the span `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`; `.chev{flex:none}`, so the chevron holds its 7 px), so the row never wraps and the panel never jumps for the 1.6 s. Its full name is in the comparison's pair below. New states `share-fail-long` (compare from Promontorium Archerusia: "‹ Promontorium A…" beside "Copy from the address bar", one row asserted), `share-focus` and `share-focus-copied` (Tab from the back link: the ring whole round Copy link; Enter: "Link copied", the focus and ring kept); `share-fail` asserts one row too |
| 4 | `og.jpg` showed four unlabelled white site dots (the title hides their labels at 1200 × 630), read as specks; the tagline on the limb's glow, the dashed frame's foot running into "Eidolon" | Fixed in `OG_ONLY` (the `og` state): the Earth sites' dots and their rings and the dashed frame hidden (the crosshair, its lines and Eidolon-1's tag stay), the blurb 54 px lower, off the glow onto dark ground, its last line on the wordmark's baseline. `npm run poster` rerun: `public/og.jpg` 37 KB; the two posters byte-identical |

**Verification table** (changed and new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| share: `share-fail` (refNA) | "Copy from the address bar", clear of "‹ Jezero Crater", one row (asserted) |
| `share-fail-long` (refNA) | Compare from Promontorium Archerusia, no clipboard: "‹ Promontorium A…" cut with an ellipsis beside "Copy from the address bar", one row (asserted); the chevron whole |
| share-kb: `share-focus` (refNA) | Tab from the back link: the white ring whole round Copy link's icon and words (phone: the sheet's back row) |
| share-kb: `share-focus-copied` (refNA) | Enter: "Link copied" (asserted, the route on the clipboard), the focus and its ring kept on the button |
| `og` (refNA, opt-in) | No site dots, rings or dashed frame; the crosshair and Eidolon-1's tag; the blurb on dark ground, its last line on the wordmark's baseline |

**Verification** (2026-10-21): see the Log entry.

### Rendering and visual-bug Should rows (Should 12, done)

Every row marked Should in the plan's "Rendering and shaders" (nine) and "Visual bugs in the mock" (eleven) tables, each
read against the code: done here, done by an earlier item (said so), or done with a deviation (said why; Deviations).

**Rendering and shaders**

| Row | Outcome |
| --- | --- |
| Planet surface | Done. Normal maps baked from the DEMs at full precision (`mars_normal`, `moon_normal` 2048 × 1024, `earth_normal` 1024 × 512; `npm run fetch:real -- --only=normals`): slopes east and north, the east spacing shrunk by cos(latitude), stored as sign · √(\|s\| / .5) so gentle global slopes keep their levels; the planet shader reads them instead of four height differences of the 8-bit bump map (which banded on smooth ground and under-shaded east–west slopes at high latitude). The relief keeps its strength (`bumpK` converted per body, `planet.ts`); the Moon's cap shares the factor. The bump maps stay for the CPU (pin terrain) and are no longer uploaded. The normal maps load with the full maps after the start (no start cost), the relief fading in from flat (`nOn`, `app.ts showMaps`). The Moon is lit by Lommel-Seeliger mixed with Lambert (McEwen's lunar function, L .6): as bright face on, a flatter disc, a crisper terminator. Earth's night lights and ocean glint unchanged (Decisions 174, 175) |
| Terrain surface | Done, all four. **Drape**: "Orbital image" under the north arrow on the site view, where the block is real terrain and the site has a drape (21: Jezero, Gale, Hadley–Apennine, the four south-pole regions, the 14 established Earth sites; 360 px over exactly the block, `npm run fetch:real -- --only=drape`, 372 KB): the image over the block, lit a little by its hillshade, contours over it, its source in the terrain note ("Image: Viking MDIM 2.1 colour mosaic."); off by default, held for the session; a failed image disables the toggle (Decisions 176). **Labelled contours**: up to three major levels labelled on their lines (`mesh.ts contourMarks`: the line's point nearest the centre, a fifth of the block apart), projected each frame, hidden on narrow viewports and the overlay. **Water**: the lake level at its height (the DEM's bed or flat water alike), tinted from the tokens' #335C75 at the shore to #1F3D52 by the distance to it (`shoreDist`), a fresnel of the sky's grey-blue, the sun's glint off fine static ripples. **Level of detail**: a mesh takes at most 512 samples a side (every k-th, the last row and column kept; `meshIdx`); no tile is that large yet (Jezero's 336) |
| Terrain swap | Done. The curtain is gone: `router.ts crossfade` holds the frame as it stands (`frame.ts holdNow`: drawn once more, then the pipeline's last input copied at half size, `post.ts holdFrame`), swaps at once and fades the held frame out over .69 s (the curtain's .24 + .45), linear, in the last pass; at once with reduced motion or when nothing is drawn. A dive now flows from the graded globe into the graded block (`dive-earth-swap`); the late-elevation rebuild uses it too. The buffer is let go after each fade (Decisions 177) |
| Detection grade | Done. The duotone moved from the finish to the pipeline's last pass, over the globes and the terrain alike: the finish now leaves the bodies' coverage in alpha and the blocks write theirs, so the grounds and the dive's sky keep their colours. The palette is the site's own: `--grade-<ramp>` and `--sky-<ramp>` per terrain ramp (Mars and Moon as the plan's; new arid, polar, basalt, ferric and salt in the same style; `--grade-earth`/`--sky-earth` retired) (Decisions 178) |
| Beyond reveal | Done with a deviation: drawn once (on entry and a resize) into three canvases, the glow, the path with its trails and the Sun, the orbits with the planets, and revealed on the compositor by the same eased tweens (the glow's opacity, the path's `clip-path` wiping left to right to the Sun, the orbits' opacity), then held: no Canvas 2D redraw per frame. Not WebGL lines (Deviations, Decisions 179) |
| Footer carousel | Done. One dither shader on a quad (`ui/carousel.ts`: a WebGL context of its own, made when the art first draws, under the 2D canvas, which keeps the orbit and link lines): per dot the layers' values (a world's albedo lit from the upper left, a glow, a halo, the mark's two inks) against the Bayer matrix, composited in order, the dot's share of each pixel antialiased as the canvas's `fillRect` did. The same four steps, frames indistinguishable from before; a world fades its orbit line where its dots cover (Decisions 180) |
| Eidolon-1 | Done. A low-poly model with PBR materials (`scene/satellite.ts`): a gold-foil bus with a white radiator, two three-panel solar wings on yokes with rails, a high-gain dish on a boom; lit from where the title's sun is each frame (`frame.ts`) |
| Icons | Done. Twelve line icons in the panel's icon style (`ui/icons.ts`: dates, team, equipment, permits, access, purpose, notes, cost, season, surface, practical, site) on the booking flow's form labels, section heads and the listing's coordinates |
| Phones | Done. The lighter path (`LITE`) now also blooms at half resolution (one level fewer, the same glow), builds terrain meshes of at most 128 samples a side, and loads 2K colour maps (`textures/mid/`, made beside the low tier) as its full maps: phone GPU memory 111 MB (was 214) |

**Visual bugs in the mock**

| Row | Outcome |
| --- | --- |
| Terrain/Globe toggle under the sheet; status hints hidden | The toggle: done in the port (round 1). The hints: now in the sheet's header, a line under the grip (`#shint`, the status bar's hint), in the peek (its height adds to `snapF(0)`); hidden at full, where the stage is covered |
| Detection frame only on a dive from the body view | Done. `views/site.ts acquire` plays it on every other site entry (a deep link, a pin moved on the map, from the grid, a compare arrived at with a new target): over the terrain, in the site's palette, held 1.3 s as a dive holds it, then out as after a dive; not when coming back from its own compare. The frame follows the viewport as the panel slides in |
| HUD's left readout under the panel; tape under the top bar | Done. The HUD's box is clamped to the viewport, with room for the tape above it and the hint and status bar below; each side's readouts show only where they fit beside it (`hud.ts`; widths read when their kind of text changes) |
| Title annotations | Done. `fmtLL` text and labels out of the text boxes: port round 1. Now: Eidolon-1's tag hides while it is behind Earth (`sunVisible`, as the model is by depth); the rings go round the three facing sites nearest the camera; `#annot` is fixed, so it stays on the canvas as the title scrolls (the footer covers both) |
| Lighting disagrees | Done. The block, its skirt and the site's 2D map are lit from the site's real sun azimuth (`astro.ts sunAzimuth`, tested; a fixed 38° height so the relief reads at night too), taken once per site entry so map and block agree (the map keeps its own mild 2.5× relief, so its contours read). The stage's warm glow sits on the side the light comes from as the main camera sees it (the block's sun, the globe's subsolar light, else the system's), the cool one opposite, eased (Decisions 181). Compare (Terrain, Overlay and both minis) lights both sides from one azimuth, the engine twins' north-west 315°, not each site's sun (Should list holistic review fixes, Decisions 185) |
| Label collisions | Done. One pass for the globe's overlay labels: graticule labels give way to the preview chip and now to the site markers and their labels (`markers.ts onMarker`) and keep inside the viewport, above the status bar (zoomed in they ran under the top bar); marker labels place themselves (Must 4) and spread near the pole (port); Beyond's labels hide where cards reach them (port round 1, Should 8 round 2). The wordmark against the blurb near 1,000 px: already clear in the build (probed at 900–1180 px wide, 600–820 high: 108–142 px apart), no change |
| Reduced motion partial | Done. The setting was already live (`motion.ts`). An audit of every tween and CSS motion left four moves: the dawn's light sweep on leaving the title, the drawer's chevron turn, the coordinate preview's spinning ring, the stage glow's slide: now instant or still. Fades stay as crossfades (the plan's rule) |
| Hover state sticks | Done in port stage 5 |
| Crosshair on maps that can't be clicked | Done. The crosshair only on the site map whose click moves the pin (`[data-move]`: a pin on Mars or the Moon, not a named target), not on featured sites' or compare's minis |
| 1 px seams | Done. `rig.ts computeRects` rounds each rect's edges to the drawing buffer's pixels, so the viewports and scissors (`post.ts`) and the overlays placed from the same rects agree, and a split's two viewports share one edge |
| Logo variants differ | Done in Must 7 (every variant from `src/brand/logo.svg`) |

**Tests** (339, was 332): `astro.test.ts` (2): the sun's azimuth toward the subsolar point, in range at a pole and the
date line; `mesh.test.ts` (4): `meshIdx`, `shoreDist`, `contourSegs` and `contourMarks` on a cone, `sunENU`.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `dive-earth-swap` (refNA) | 2.95 s into the dive to Haughton: the graded globe crossfading into its block, both in the polar palette; the frame's dot and readouts over them |
| `compare-globe-xfade` (refNA) | Terrain to Globe, .35 s in: the two blocks fading out over the two globes, no curtain |
| `site-acquire` (refNA) | Deep link at .6 s: "Site acquired / Mars", the dot on the block, block and sky in Mars's palette |
| `site-acquire-haughton` (refNA) | Deep link to an Earth site: its polar palette, "Rehearses 4 target sites" |
| `site-jezero-drape`, `site-salda-drape` (refNA) | The orbital image draped (Jezero's crater and delta; Salda's lake in its own blue, no water shader over it), the toggle pressed, the note naming the image (desktop) |
| `beyond-reveal` (refNA) | Half-way: the glow in, the path and trails half drawn toward the Sun, no orbits yet |
| `dive-earth` | Graded in the polar palette (was "the Earth grade") |
| `body-mars-zoomed` | The HUD's brackets inside the viewport, the tape under the top bar, readouts gone without room |

**Performance** (`npm run perf -- --only=bundle,memory`): JS to start #/ 327.8 KB gzip (was 308; budget 350); GPU
memory peak 291.6 MB at 1280 × 800 @2 (was 288; budget 300: the normal maps, RG8, replace the bump maps' R8 upload),
269.9 at 1920 × 1080, phone 111.1 (was 214: the 2K maps). Frame rates and first paint not re-measured (one extra
render at a swap; the normal maps hold no start).

**Known limits.** Contour labels aren't hidden behind ridges (shortcut). The drape's Earth images from Blue Marble
(Svalbard, the Dry Valleys, Lanzarote) are soft. A swap draws one extra frame (to hold it). The footer's dots need a
second WebGL context while it shows. The Beyond reveal is a compositor clip, not WebGL lines (Decisions 179).

**Verification** (2026-10-21): see the Log entry.

### Rendering and visual-bug Should rows review fixes (done)

Twenty-two findings (independent review of Should 12, 2026-10-21); 1 = 17, 2 = 14 = 19 (the focus) and 11 = 18. All
fixed, or logged where the finding asked for a Deviation; finding 20's memory figure was wrong (below).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 17 | Off its view (site to globe, to a globe compare) the terrain overlay only lost `.on`: its "Orbital image" toggle stayed, invisible but clickable (`pointer-events:auto`) and a Tab stop over the next view, turning the drape on unseen; the same under the 1.3 s frame (`--fade` 0) | Fixed: `.tui:not(.on), .tui.hid{ visibility:hidden }` once its .3 s fade is out (`visibility 0s .3s`, the markers' `.away` pattern); `placeTUI` sets `.hid` while the frame fades it under .05. The whole overlay, so its stale legend and note leave the accessibility tree too. `site-leave-tui` asserts the toggle hidden on Mars's globe after Jezero |
| 2, 14, 19 | Pressing the toggle, and the image landing, rebuilt the overlay's HTML: keyboard focus fell to `<body>` twice; a failed image left the toggle `disabled` but `aria-pressed="true"`; 26 px tall on phones | Fixed: `showDrape` updates the toggle's `aria-pressed`, the note's image line (`.dimg`) and `.draped` in place; the loader calls it, not `buildTUI`. A failed image: unpressed, `aria-disabled="true"` (focusable, so the focus isn't lost to `disabled` either) with its title; the click skips it. A 44 px hit area under a coarse pointer (`::before`, 9 px out). States `site-jezero-drape-kb` (Enter on the focused toggle: draped, pressed, focus kept, asserted), `site-jezero-drape-fail` (crop blocked: unpressed, aria-disabled, titled, asserted), `site-jezero-drape-loading` (crop held: pressed, the block still hypsometric) |
| 3 | Level of detail built as a fixed cap (every k-th sample at every distance); Deviations didn't say | Logged (Deviations) and a `shortcut:` at `mesh.ts meshIdx`. Not quite "only the unit test": phones cap at 128, so every phone block above 128 samples (Jezero's 336) runs it |
| 4 | One held still at half size for "two render targets"; its softness unmentioned | Logged (Deviations, Decisions 177) |
| 5 | Compare graded in the target's palette over the Earth double too; the frame skips a compare where only the double changes; the grade masked, not the whole frame | Logged (Deviations; Decisions 178, 182) |
| 6, 22 | Contour labels never on phones or the overlay, not in a collision pass, and placed with no check against the viewport (over the other viewport in a split, over the legend) | Fixed in part: a label shows only inside its viewport and clear of its caption, north arrow, toggle, legend and note (`terrain-ui.ts measure`: the boxes read when the viewport's size, its caption, its classes or the build change, not each frame); phones and the overlay without them logged (Deviations) |
| 7 | The water shader tints by distance to the shore with a fresnel, where the token says "by hillshade" | Logged (Deviations) |
| 8 | Eidolon-1 lit from the composed title sun, not the real sun | Logged (Deviations) |
| 9 | Beyond's labels hidden where cards reach them, not repositioned; never on phones | Logged (Deviations) |
| 10 | `#annot` fixed: scrolled to the footer, its labels, rings, the satellite's tag and the dashed lines lay over the scrolled blurb, buttons and meta row | Fixed: the annotations fade out over the first eighth of a screen of scroll (`title.ts`, a passive scroll listener on `#title`), held over the canvas while they show. Not the other option (boxes less `scrollTop`, avoidance re-run): the frame and crosshair lines would still cross the text. Footer states show none |
| 11, 18 | On phones "Site acquired / <world>" ran off the viewport's left edge ("TE ACQUIRED") on every site entry | Fixed: `placeScan` flips it right of the dot (`.t1.r`) where its box (measured when written) would come within 8 px of the edge; with the graticule labels' dark edge, since there it reads over the block (unreadable on a polar site's snow). Found on the way: in a phone's stacked compare (a 168 px viewport) the readout row ran into the dot and label, so it hides under 240 px (`#scan.short`); new state `compare-acquire` |
| 12 | Zoomed in, the clamped HUD's hint came on screen and "40°S" sat on "CLICK" | Fixed: graticule labels keep within the HUD's box (`hud.ts hudBox`, the two show together), so off the tape above and the hint below; this replaces their viewport and status-bar limits, which the box already keeps inside |
| 13 | The sheet's hint said "Esc returns to the globe." on a touch screen | Fixed: `hint()` leaves Esc out on a touch screen unless the keys drive the 3D view (the status bar's text too) |
| 15 | No drape failure, loading or compare-entry states; the acquire states seeked before the readouts; "2 target sites" | Fixed: the three drape states above, `compare-acquire`, `site-leave-tui`; `site-acquire` and `site-acquire-haughton` at 1.1 s; "Rehearses 4 target sites" (`dive-earth`'s check says its readouts come after its 1.8 s) |
| 16 | Draped, the legend kept the hypsometric ramp | Fixed: the ramp hidden while draped (`.tui.draped .legend > .ramp`), the range and the contour line kept |
| 20 | The held frame half float: "~8.2 MB at 1280 × 800 @2, not ~5"; tone-mapped values gain nothing from it | Fixed: 8-bit, stored as sRGB so the darks don't band. The figure was right, though: the pipeline's buffers are capped at 2.5 M pixels (`renderer.ts MAX_PX`, a ratio of 1.56 there), so half size was 625 k pixels, 5 MB in half floats; now 2.5 MB at most, a transient peak of ~294 MB |
| 21 | A second crossfade during one popped (the held frame can't hold itself; `XF.k` back to 1) | Fixed: a crossfade while one runs joins it, `atSwap` under the fade already running (`router.ts crossfade`) |

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `site-acquire` (refNA) | At 1.1 s: the readout row in; phone: "Site acquired / Mars" right of the dot, whole |
| `site-acquire-haughton` (refNA) | At 1.1 s: "Rehearses 4 target sites"; phone: "Site acquired / Earth" whole, legible over the snow |
| `compare-acquire` (refNA) | Compare deep link: the frame over Jezero's block, both blocks in Mars's palette; phone: no readout row in the short viewport |
| `site-jezero-drape-kb` (refNA) | Enter on the focused toggle: draped, pressed and still focused (asserted); the legend's range without the ramp |
| `site-jezero-drape-fail` (refNA) | The crop blocked: the toggle dimmed, unpressed, aria-disabled, titled (asserted); the ramp back |
| `site-jezero-drape-loading` (refNA) | The crop held: the toggle pressed, the block hypsometric |
| `site-leave-tui` (refNA) | Mars's globe after Jezero: the toggle hidden (asserted), no legend or arrow |
| `body-mars-zoomed` | The graticule labels inside the brackets, none on the hint or the tape |
| `footer-step1-develop` | No title annotations over the scrolled hero |

**Verification** (2026-10-21): see the Log entry.

### Rendering and visual-bug Should rows review fixes, round 2 (done)

Two findings (independent review of the round-1 fixes, 2026-10-21), both fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Under reduced motion a dive (click Haughton on `#/earth`, or a Mars or Moon site whose search has answered) left the frame on for good: the swap's crossfade now runs `atSwap` at once, and with `k` 0 the swap's call (inserted first) ran `hideScan` before `showScan` at the same time, which then killed the hide and set `scan` and `scanUI` to 1. The block stayed graded, the dot and readouts over it, and the terrain overlay `.hid` (caption, legend, arrow, contour labels, the image toggle) until the route changed. Related: `acquire` hid at 0 under reduced motion, so a deep link never showed the frame | Fixed by keeping the hold: the turn and the dive are already instant under reduced motion (`orient.ts turn`, `rig.ts slingshot`), so `views/site.ts` no longer scales the frame's times by `k`: shown at .15 s, the swap at 1.45 s, as with motion. `showScan` now always comes first, and the frame is seen (held over the dived globe, then gone at once with the swap). `acquire` holds 1.3 s under reduced motion too. The finding's own asserts: `dive-rm-end` fails on the old code ("nothing matches `#scan[style*="opacity: 0;"]`") and passes now (Decisions 184) |
| 2 | On a compare entry with a new target (desktop) the frame's readout row ran under the centred Terrain / Overlay / Globe toggle ("EARTH" of "SEARCHING EARTH" under "Terrain" for the whole hold), and its "Matching: Searching Earth" read wrong beside Lake Salda already shown | Fixed (the finding's first option): no readout row on compare (`body[data-view="compare"] #scan .scan-row`, beside `.short`); the dot, "Site acquired" and the grade stay. Not lifting it above the toggle (it would sit on the blocks' middles) nor fading the toggle with the frame (the view's only control, hidden 1.3 s on every new target) |

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| drm: `dive-rm` (refNA) | Reduced motion, Haughton clicked from `#/earth`, at 1 s: the globe already at the dive's end, graded, the frame held (asserted shown) |
| drm: `dive-rm-end` (refNA) | At 2.2 s: the block ungraded, the frame gone (asserted), the terrain overlay shown, not `.hid` (asserted) |
| `site-acquire-rm` (refNA) | Reduced motion, `#/mars/jezero` at 1.1 s: the frame held over the block (asserted shown) |
| `compare-acquire` (refNA) | Desktop: no readout row, the view toggle clear |

**Verification** (2026-10-21): see the Log entry.

### Should list holistic review fixes (done)

One cross-item finding from the review after the should list (2026-10-21), major. Fixed.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Should 12's Lighting row lit each compare block, and each compare mini map, from its own site's sun (`#/mars/jezero/compare/salda`: Jezero 102°, Salda 219°, 117° apart): side by side, and above all in the Overlay ghost (Should 1), the same landform shaded from different directions, and at 50 % the blend washed the relief out; Salda's mini lit from the south-west read inverted (craters as domes). Decisions 181 didn't cover compare | Fixed (Decisions 185): compare lights both sides from one azimuth, the engine twins' north-west 315° (`mesh.ts TWIN_AZ`, the engine's `hillshade(azimuth=315)`): `router.ts buildScenes` builds both blocks (so the overlay's ghost too) under it, and `topomap.ts drawMap` lights the compare window maps (`win`, compare's minis only) under it. The site view keeps its site's real sun (Decisions 181); the stage glow follows the block's light, so on compare it sits north-west too. The height stays the blocks' fixed 38° (the twins' 45°) |

**Tests** (339, unchanged): a constant passed where a per-site azimuth was; nothing new to unit-test.

**Verification table** (changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `compare-jezero-salda` | Both blocks and both minis lit from the north-west like the twins: Salda's bowl reads as a bowl |
| `compare-overlay-salda` (refNA) | The ghost and the block under one light, so the relief keeps its shading at half |

**Verification** (2026-10-21): see the Log entry.

### Sun-angle slider (Stretch 1, done)

Shades the site view's block and its map for any time of day or season, from the real sun (plan, Stretch 1: illumination
decides the lunar south pole). Decisions 186.

- **Control** (`ui/sun.ts`, under the map in `ui/panel.ts siteMedia`, Earth sites too): a "Sunlight" section with a
  checkbox, "Set the sun's time and date", off by default (the relief light, Decisions 181: every earlier state as it
  was). On: "Local solar time", a slider 00:00 to 23:45 a quarter hour a step (the overlay's slider look; arrows, Page
  Up/Down, Home/End; `aria-valuetext` "06:00, the sun 1.5° up, from the east"; a 44 px target on touch), its value
  beside it; "Date", the native date input (dark picker; a half-typed or malformed date is ignored, the last whole one
  holds); then facts: sun height (and "Below the horizon"), direction in degrees and a compass word, the moment (UTC),
  on Mars the season (Ls); a line that shadows fall at true scale, and on the Moon that a lunar day lasts 29.5 Earth
  days. First on: the sim clock's date and the site's local time now. Held for the session and applied at each site's
  longitude (the same hour and date at the next site); not in the route (`shortcut:`).
- **Sun** (`astro.ts`): `solarTime` (local mean solar time from the subsolar longitude: LMST on Mars), `atSolarTime`
  (the moment that hour comes in the solar day, local midnight to midnight, holding the date's noon UTC: on Earth the
  place's own date, on Mars a sol, on the Moon a lunation), `sunElevation`, `SOL`. The Moon's subsolar latitude, a
  shortcut of 0 until now, is the Sun's selenographic latitude (`moonSunLat`, Meeus ch. 53: ±1.54° over a 346.6-day
  draconic year), which sets the pole's season: Malapert's noon sun 5.5° up in November 2026, 2.5° in May.
- **Light** (`terrain/mesh.ts`): `sunSet` (on, hour, date); `sunOf` gives the relief light as before, or the set sun
  (`sunAt`: azimuth, true height, moment) with the samples it reaches, `sunlit`: from each sample a march toward the
  sun, a sample at a time, at true scale (the block's exaggeration shades its slopes, not its shadows), the ground
  falling away with the body's curve (2 km over the Moon's 85 km diagonal), stopping once the ray clears the highest
  ground; memoised per terrain and light, so the block and the map share one march (192² samples: 2–6 ms in Node on this M3).
  The block takes it as a `lit` vertex attribute on its hillshade (and the water's glint); `sunENU` takes a height. The
  map multiplies its hillshade by the same mask, cached by the light. The stage's warm glow follows the block's light
  (unchanged code).
- **Applied** on the app's clock (`onUpdate`), once a frame however many inputs a drag sends: `buildScenes` (the same
  terrain: only the light and the mask change) and the site map redrawn; the readouts change in place, so the slider
  keeps its drag and the focus.
- **Compare**: not applied (Decisions 186). Compare's panel has no Sunlight section; both blocks, the overlay and the
  minis keep the twins' 315° whether the control is on or off.

**Tests** (347, was 339): `astro.test.ts` (+4, 2 updated): `moonSunLat` against Meeus's example 53.a (b0 +1.46°) and
its 1.543° bound; `sunElevation` (90° under the sun, 0 a quarter turn away, the poles); `solarTime` (noon under the sun,
LMST); `atSolarTime` (the hour comes back, the day straddles the date, Greenwich noon at 12 UTC); the Moon's subsolar
point and azimuths at the epoch now with b0 −1.07°. `mesh.test.ts` (+3): `sunENU` at a height; `sunlit` (a wall's shadow
length on both sides, a high sun, a sun below the horizon, the curve dropping a far wall). `coords.test.ts` (+1):
`compass`.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| sun: `site-sun-am` (refNA) | Malapert on 2026-11-15 at 06:00: the sun 1.5° up from the east (asserted in the slider's text); the massif's east faces lit, long shadows west of every rise, the plains dark; the map lit alike; the facts (1.5°, 90° from the east, the moment, the lunar day's line) |
| sun: `site-sun-noon` (refNA) | 12:00: 5.5° up from the north (asserted); the north faces lit, shorter shadows; block and map turned together |
| `site-sun-kb` (refNA) | Jezero, on at 09:00, four arrow presses: 10:00, the slider still focused (asserted), the sun higher in the south-east, Season Ls 2° |

**Known limits.** The block's edge is the horizon: ground outside the site's square casts no shadow (at the pole a rim
100 km off could), and the march takes nearest samples (`shortcut:` at `mesh.ts sunlit`). Shadowed ground keeps the
block's ambient (.32; the map's .35), so a permanently shadowed floor reads dim, not black. The Moon's subsolar
longitude is still the mean synodic phase (no libration, a few degrees), Earth's has no equation of time (up to 16
minutes). On an exaggerated block a shadow's edge and the shading of the exaggerated slope can disagree slightly.

**Verification** (2026-10-21): see the Log entry.

### Sun-angle slider review fixes (done)

Eighteen findings (independent review of Stretch 1, 2026-10-21); 1 = 14, 3 = 15, 7 = 13 = 17. All fixed; none wrong,
though finding 9's "the block and map drop to ambient light only" holds for low ground only (below).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 14 | The curve half modelled: every sample used the centre's sun height, so the sun stood no higher toward it nor lower away (±0.99° across Malapert's 60 km, ±1.5° across Nobile's 90 km, against a 1.5° sun), and the shader and map lit every sample with the centre's light | Fixed: `sunlit` adds each sample's offset toward the sun over R to its rise a step (`up`, the reviewer's term); the block's shader turns its light per fragment by its offset from the centre times `tilt` (a uniform, radians a scene unit, set by `buildTerrain` from the new `Sun.R`; 0 for the relief light and compare), the water's glint too; `drawMap` tips each sample's gradient the same way (true, not the map's 2.5×). Test: two 10 m walls 200 m east of samples 300 m either side of the centre, a 2° sun on a 10 km body: the sunward one lit, the other shaded (both shaded without the term); the curve test now from the centre. Seen side by side at 06:00 (the code with and without): the west half darker, the east brighter |
| 2 | "Shadows fall at true scale" while ground outside the square casts none, logged only in code and here | Fixed, every body: "Shadows fall at true scale over the curve of the ground; only ground inside the map's square casts them." |
| 3, 15 | First on, the date was now's UTC date, but the moment comes from the solar day holding that date's noon UTC: a day (a sol, a lunation) off where the two differ (the Dry Valleys after ~13:10 UTC) | Fixed: `astro.ts solarDate`, the UTC date of now's own local noon (its noon UTC is within half a day of it, so in the same solar day). Test: for Earth, Mars and the Moon at −170°, 0°, 162°, 170°, every 1.5 h of a day, `atSolarTime` from it at now's solar time gives now back; the Dry Valleys at 14:00 UTC give the next day |
| 4 | Only Mars had a season fact; the Moon's b0 was computed and never shown | Fixed: "Sun's latitude" on the Moon (b0, its poles' season: 1.5° S in Nov 2026) and on Earth (the subsolar latitude); four facts on every body, the moment no longer full width |
| 5 | Draped, a set sun only nudged the image (`0.72+0.4*hs`): bright under a sun below the horizon | Fixed: under a set sun the image takes the tint's light (`0.32+0.85*hs`, so the ambient where the sun doesn't reach); its own shadows stay in it (Known limits). State `site-sun-drape` |
| 6 | Nothing on the stage said the block was lit for a set moment (the top bar's clock says another); compare silently back to 315° | Fixed: the caption's third line "Lit for 2026-11-17 07:08 UTC" (against the top bar's UTC; the hour is the panel's, and a longer line ran under a phone's image toggle); on compare with the control on, under the minis: "Both lit from the north-west, as the search engine's hillshades are: the sun you set lights the site view only." State `compare-sun` |
| 7, 13, 17 | Two "Local solar time" on Mars's panel, the slider (set) and the LMST fact (now) | Fixed: the slider is "Time of day (local solar)"; its `aria-valuetext` didn't use the label |
| 8 | Module map: no `ui/sun.ts`, `mesh.ts` still `sunAz`, `astro.ts` without the new functions | Fixed |
| 9 | No state with the sun below the horizon | Fixed: `site-sun-night`, Malapert at 00:00 (2.5° below, from the south; asserted). The low ground drops to the ambient; the massif's summit stays lit: a peak 5 km up sees 4.3° past the level horizon (√(2h/R)), and the march finds nothing in the square to hide it. Physical (Malapert is a high-illumination candidate), so kept, and said: under a sun below the horizon the fine print adds "High ground sees past the level horizon, so it can catch a sun below it." The stage's glow stays on the sun's side (its light is near level) |
| 10 | A cleared or half-typed date ignored silently | Fixed: `aria-invalid` on `#sun-d` while its value isn't a whole date, and a line under it, `.ferr` (the booking form's field error, sans): "Not a whole date: the sun stays as on 2026-11-15.", tied by `aria-describedby`; both cleared on a whole date. State `site-sun-nodate` |
| 11 | On phones the sun states showed the map only, never the Moon's controls | Fixed: `site-sun-nodate` scrolls the panel to the section (the Moon's controls, the date's error and the four facts at 390 px); `site-sun-am`, `-noon` and `-night` keep the map |
| 12 | On the Moon the date picks a lunation, labelled "Date" | Fixed: "Lunar day holding" on the Moon (the moment's date is in the facts and on the stage) |
| 16 | `sunElevation` clamped only above: NaN opposite the sun | Fixed: `clamp(…, -1, 1)`. Test: the antisolar point of each body on 100 dates is −90° (the sum rounds below −1 about one time in twenty; the test fails without the clamp) |
| 18 | `Sun.at` never read | Removed; `sunOf` returns `{ az, alt, lit, R }`, the readouts call `sunAt` |

**Tests** (349, was 347): `astro.test.ts` (+1, 1 extended): `solarDate`; `sunElevation` opposite the sun. `mesh.test.ts`
(+1, 1 changed): the off-centre sun; the curve's fall measured from the centre.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| sun: `site-sun-noon` (refNA) | As before, the caption "Lit for 2026-11-24 16:19 UTC" (asserted) |
| sun: `site-sun-night` (refNA) | Midnight, 2.5° below from the south (asserted): low ground at the ambient, the summit lit; "Below the horizon" and the high-ground line |
| sun: `site-sun-nodate` (refNA) | The date cleared: coral edge, the error line, `aria-invalid` and `aria-describedby` (asserted); the light unchanged; phone: the Moon's controls and facts |
| sun: `site-sun-drape` (refNA) | The image draped at midnight: dark but for the summit, not the image's daylight |
| sunkb: `compare-sun` (refNA) | From `site-sun-kb` (now seq `sunkb`) on to compare: 315° as ever, the line under the minis (asserted) |

**Known limits** (added): the curve's correction is first order (the sun's height shifts by the offset over R, the
shader's light by a small turn): within about 0.02° across these blocks for a low sun, looser for a high one, whose
shadows are short; draped, the image keeps its own shadows from its own sun.

**Verification** (2026-10-21): see the Log entry.

### Slope hazard layer (Stretch 2, done)

Tints the site view's slopes over 15° on its block and its map (plan, Stretch 2). Decisions 188.

- **Slopes** (`terrain/procedural.ts slopes`): each sample's slope in degrees from its neighbours' heights at the grid's
  true spacing, `ext / (N − 1)` (60 km over 192 samples: 314 m; the engine's 18.8 km over 94: 202 m, the repo's edge to
  edge convention, Merge notes), central differences inside and one-sided along the edges. `measure` now counts its mean
  slope and share over `STEEP` (15°) from the same grid (its interior, as before), so the tint and the area beside it
  are one computation; `mesh.ts slopeOf` memoises it per terrain (a `WeakMap`, only once the layer is on), the block
  and the map share it.
- **Block** (`terrain/mesh.ts`): `buildTerrain(…, steep)` (the router passes `hazard.on`, on compare to both blocks)
  fills a `slope` vertex attribute from the grid at the mesh's samples and sets the `haz` uniform. The shader greys the
  ground (its luminance, a quarter of its colour kept, so Mars still reads as Mars) and mixes in coral at .85 where the
  interpolated slope crosses 15°, a pixel-wide edge (`fwidth`), the coral shaded gently (.55 + .55·hillshade) so steep
  ground in shadow, or under a set sun's night, still shows. Water keeps its colours. Draped, the image greys the same.
- **Map** (`ui/topomap.ts drawMap`): the same grey and coral per sample (over 15°), cached by the light and the layer.
- **Control** (`ui/slope.ts`, under the map in `ui/panel.ts siteMedia`, after Sunlight since the review fixes): "Slope hazard", a checkbox
  "Tint slopes over 15°", off by default, held for the session (not in the route, `shortcut:`). Off, one line says what
  it does. On: the key, a coral square and "Over 15°: 75.2 km² of the 60 × 60 km shown" (`steep · ext²`, as compare's
  table has it: no percentages), and the caveat "Measured over the 314 m between samples, so steep ground narrower than
  that doesn't show." (or "over the elevation's own 1,000 m spacing" where that is coarser: review fixes), plus "The terrain here is illustrative, and so are its slopes." where it is. The map's label adds
  ", slopes over 15° in coral". The checkbox redraws the block, the legend and the map at once; the section swaps in
  place, keeping the focus.
- **Legend** (`ui/terrain-ui.ts`): on, the stage's elevation legend drops its ramp (the block isn't in those colours, as
  when draped) and adds a coral row "Slopes over 15°".
- **Compare** (since the review fixes): both blocks, both minis and both legends tinted alike, the checkbox "Tint slopes
  over 15°" under its table (whose "Slopes over 15°" row gives each side's area). Until then it kept its colours and said so.
- **Data fix found on the way**: Meteor Crater's 4 km patch had two columns of no data at the GLO-30 tile seam (111° W),
  drawn at its lowest height: a 100 m trench along the block's east edge, which the layer showed as a coral stripe. The
  fetch script's `cogTile.px` now clamps to the tile's pixel centres (a point in its outer half pixel took a no-data
  neighbour); the patch refetched (`npm run fetch:real -- --only=sites`, its cache entry removed first): no holes, and
  only that file changed. No other patch had a line of holes (scanned).

**Tests** (353, was 349): `procedural.test.ts` (+4): a plane's slope at every sample, edges included, east, south and
diagonal; the scale correction (the same heights over twice the width: half the tangent); the engine's window (94 over
18.8 km) with planes at 15.2° and 14.8° either side of the line, and `measure` counting all or none; a ridge (30° on its
flanks, 0 on its crest and the plain, half at its foot).

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| slope: `site-slope-jezero` (refNA) | Jezero greyed, the crater's inner walls coral on block and map; the key (75.2 km² of 60 × 60 km) and the 314 m line; the legend's coral row, no ramp (asserted present, and the map's label) |
| slope: `site-slope-drape` (refNA) | The image draped and greyed, the walls still coral |
| slope: `compare-slope` (refNA) | On to compare: its colours, no key on either side (asserted), the line under the minis |
| `site-slope-kb` (refNA) | Malapert by Space on the focused checkbox: checked and still focused (asserted); the massif's flanks coral |
| `site-slope-meteor` (refNA) | Meteor Crater (21 m spacing): its walls a coral ring; no seam along the east edge |
| `site-slope-pin` (refNA) | A Mars pin: the illustrative caveat (asserted) |

**Known limits.** The slope is over the grid's spacing (314 m at Jezero, 942 m at Gale's 180 km, 21 m at Meteor
Crater): a steep scarp narrower than that is averaged into gentler ground, so the layer under-reports at wide sites,
and the panel says so with the spacing (the source's own where it is coarser: review fixes). A symmetric crest reads
flat (central differences).

**Verification** (2026-10-21): see the Log entry.

### Slope hazard layer review fixes (done)

Eight findings (independent review of Stretch 2, 2026-10-21); 2 = 8. All fixed; none wrong. Finding 5 took its second
option (the section after Sunlight), finding 2/8 its first (compare tinted).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The caveat always gave the samples' spacing, even where the elevation behind them is coarser: a polar Moon pin on the 1 km cap said "314 m" beside a credit "resampled to 1 km"; Meteor Crater said 21 m over 30 m GLO-30 | Fixed: `dem.ts resOf`, a patch's true spacing, its own step or its source's (`NATIVE_M`: MOLA–HRSC 200 m, SLDEM2015 59 m, LOLA polar 240 m, the cap 1 km, GLO-30 30 m, as the credits name them), carried as `Terrain.res` by `genTerrain`; where it is coarser than the samples the caveat reads "Measured over the elevation's own 1,000 m spacing, so …". Test (`dem.test.ts`): steps, a source coarser and finer than its step, the cap, Meteor Crater, an unknown source. States `site-slope-polar` (asserted), `site-slope-meteor` (asserted) |
| 2, 8 | Compare never tinted, though the plan says "on the terrain and the map" and `hazard.on` is session-wide; an engine-found double, where a campaign is planned, only opens there; the 18.8 km / 94 scale only met in tests | Fixed: both compare blocks (`router.ts buildScenes`), both minis (`drawMap` tints its window too) and both legends (`sk`) follow `hazard.on`; the minis' labels say so (`mapLabel`); the line "The slope tint shows on the site view…" gives way to the checkbox itself, under the table beside its "Slopes over 15°" row (`cmpSlopeHTML`; the handler redraws every map in the panel), so the tint can be turned off where it shows. Not under the minis: there it pushed "Plan a test campaign here" below a phone's half sheet (the phone `book` seq's tap missed it; seen at 390 px). On the overlay the legend's rows keep their columns with their ramps hidden. Decisions 188 rewritten |
| 3 | The phone's stage legend a row taller with the key: its plate over the block's right corner (Known limits only) | Fixed (`responsive.css`): tinted, the plate sits 14 px lower (as much as the row adds; the status line's offset kept), clear of the corner as when off; the overlay's wider plate puts the key on its heading's line instead (no taller). Seen: `site-slope-jezero`, `-drape`, `-pin`, `compare-slope-overlay` at 390 px |
| 4 | The spacing `ext / (N − 1)` against the brief's "18.8 km / grid size" noted only under Merge notes | Added to Deviations |
| 5 | The section between the map and Sunlight pushed Sunlight 100 px down: `site-sun-am` lost the second row of facts and the lunar day's line | Fixed: the section moves after Sunlight (the plan ranks the sun first; `.slope + .imgs` keeps the strip's gap), so the sun states read as before |
| 6 | Claimed behaviour without a state: the tint under a set sun's night, the layer turned off, the empty state; `site-slope-kb` cut off below the checkbox | Fixed: `site-slope-night` and `site-slope-off` in seq `sun` after `site-sun-night` (on, then off: `nodate` and `drape` after them unchanged), `site-slope-flat` (Dallol, 0.0 km², asserted), `site-slope-kb` scrolled to the section |
| 7 | A late height map rebuilt a pin's terrain, tint and map, but the panel's "Over 15°" stayed from the old one | Fixed: `app.ts onAsset` runs `redoSlope` (the section again from the terrain as it is) for an elevation key other than the site data (which re-renders the panel already) |

**Tests** (354, was 353): `dem.test.ts` (+1) `resOf`.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| sun: `site-slope-night` (refNA) | Malapert at midnight with the tint: greyed and dim, the steep flanks still coral in the dark, the summit lit; the legend's coral row (asserted) |
| sun: `site-slope-off` (refNA) | Off again: as `site-sun-night`, the ramp back, no key, the map's label without coral (asserted) |
| slope: `compare-slope` (refNA) | Compare greyed both sides: Jezero's window all grey (0.0 km²), Salda's shore and hills coral, blocks and minis alike; both legends' coral rows, the checkbox checked under the table, the minis' labels (asserted) |
| slope: `compare-slope-overlay` (refNA) | The overlay greyed, Salda's coral through the ghost; the rows' ranges without ramps, the key (asserted; on a phone on the heading's line); the panel at the table, the checkbox under it |
| `site-slope-kb` (refNA) | As before, the panel scrolled to the section: the key and its caveat in frame |
| `site-slope-meteor` (refNA) | As before, the caveat "the elevation's own 30 m spacing" (asserted) |
| `site-slope-polar` (refNA) | A Moon pin at 86.5° S, 120° E on the 1 km cap: "the elevation's own 1,000 m spacing", no illustrative line (asserted); the credit "resampled to 1 km" |
| `site-slope-flat` (refNA) | Dallol all grey, no coral; "Over 15°: 0.0 km² of the 16 × 16 km shown" (asserted) |

**Verification** (2026-10-21): see the Log entry.

### Profile and measure (Stretch 3, done)

Draw a line on the site view's map to get its length and the ground's cross-section along it (plan, Stretch 3).
Decisions 189.

- **Math** (`src/profile.ts`, pure): `gcKm`, the great-circle distance on the body's radius (`BODIES[id].R`: Mars
  3,389.5 km, the Moon 1,737.4, Earth 6,371), from the central angle as atan2 of the cross and dot products, exact for
  a metre and for a quarter turn, so no switch between flat and spherical; `gcAt`, the point a fraction along the great
  circle (slerp); `onGrid`, where a point falls on a site's grid in its local projection (`llToLocal`; null outside the
  square); `heightAt`, bilinear between samples, held at the edges; `profile`, the line sampled at two points per grid
  step (`ext / (N − 1)`, at least 16, at most 1,024) with each one's distance from A and height; `profileStats`: rise A
  to B, climb and descent (each positive), lowest and highest, steepest grade between neighbouring points (degrees);
  `fmtDist`, metres under a kilometre, then three figures in km.
- **Map** (`ui/topomap.ts`): `ruler` holds the line (on, the site it belongs to as `body|id`, A and B as latitude and
  longitude). `drawMap` draws it last, along its great circle (49 points projected, so a long line off the centre bows as
  it should), coral 2 px over a dark 5 px casing (pale `#FFE3D2` while the slope hazard tints the ground coral: review
  fixes), the ends coral discs lettered A and B in dark mono; A alone while B waits; the length in an edge-label chip
  beside B, clear of the map's own labels (review fixes). Only on the site view's own map (not compare's minis). The map's click-to-move waits while measuring; the
  rule for which maps move a pin is `movable`, now shared by the click and the panel.
- **Panel** (`ui/measure.ts`, in `ui/panel.ts siteMedia` straight under the map, before Sunlight): the map's caption
  (moved here: it says what a click does) and a checkbox "Measure a line on the map", off by default. On, the caption is
  "Hover the map for coordinates and elevation. Drag across it, or click at each end, to draw a line." ("Tap the map at
  each end of a line." on touch); then "From (A)" and "To (B)" fields (the coordinate field's look, mono; since the
  review fixes their placeholders give the format by example, A the map's centre, B a quarter of the square east) with a Measure
  button, and a status line (`aria-live`): "Or type the coordinates of both ends and press Enter." (no "press Enter" on
  touch), "A is set: click the map again for B.", or the line in a sentence, "28.4 km from A to B, 567 m lower at B.".
  Under it the cross-section in the facts' frame: "Cross-section, A to B" with a hover readout ("9.09 km · −2,590 m",
  a dashed rule and a coral dot on the line; a tap shows it on touch and, since the review fixes, it stays after the
  finger lifts), the profile as a coral line over a faint coral
  fill, its highest and lowest heights at the left, A and "B, 28.4 km" under it (an SVG, `role="img"` with the sentence
  and the range as its label); the facts Distance, Rise A to B (signed), Climb and descent, Steepest grade; and a fine
  line: the distance along the great circle on the body's radius, the heights from the block's own grid and its spacing
  (the elevation's own where coarser, as the slope layer says it), so the grade is over that spacing, and how much the
  chart stretches heights ("at 18× the scale of distances"); "The terrain here is illustrative, and so is its profile."
  where it is.
- **Input**: a mouse drags (A where it went down, B following, the map redrawn once a frame on the app's clock; the
  panel at the release) or clicks (A, then B, then a new A). Touch taps each end and never drags: the map keeps the
  browser's touch handling, so a finger's swipe on it scrolls the sheet (Should 3; state `site-measure-swipe`). The
  keyboard types both ends (Enter or Measure): parsed as the coordinate field parses (`coords.ts parseCoord`, every
  format and its messages, "B: …"), each inside the map's square ("B is outside the map's 60 × 60 km square."), the
  field with the error marked (`aria-invalid`) and focused, the message in the status line it is described by; Escape
  leaves the field, not the view. A line drawn by pointer fills the fields (4 dp, the body's convention); one typed is
  rewritten in it.
- **Held** for the session (not in the route, `shortcut:`), one line, on the site it was drawn on; off hides it, on
  again shows it. A pin's late height map redraws the profile (`redoMeasure`, beside `redoSlope` in `app.ts`).

**Tests** (368, was 354): `profile.test.ts` (new, 14): `gcKm` (a quarter turn three ways, a degree of Mars's latitude
59.16 km, across the antimeridian the short way, a metre at the lunar pole to 1 µm, and equal to the map projection's
distance from its centre for 60 random points round three centres, 18° N, 86° S and 75° N); `gcAt` (the ends, the
midpoint of a quarter turn, a parallel's chord bowing poleward, a fraction of the way is that fraction of the length,
a line of no length); `heightAt` (samples, bilinear, held at the edges); `onGrid` (the centre the middle sample, north
up and east right, past the edge off it); `profile` and `profileStats` on a plane rising 10 m a sample east (19 km,
39 points, rising 190 m at 0.57°; east to west the descent; north to south level), a ridge (up 90 m, down 90 m, rise 0,
its crest the highest), a short line's 16 segments and a long one's two a sample; `fmtDist`.

**Verification table** (new rows; `scripts/capture-states.mjs`; a `drag` step added to `scripts/capture.mjs`, a mouse
drag in 10 moves):

| State | Check |
| --- | --- |
| measure: `site-measure-on` (refNA) | Jezero, on, no line: the caption ("Tap the map at each end of a line." on a phone), empty fields, the help line (asserted); Sunlight below |
| measure: `site-measure-typed` (refNA) | Typed `18.30N 77.32E` and `18.45N 77.80E`, Enter: the line from the western rim over the crater floor on the map, the fields at 4 dp, "28.4 km from A to B, 567 m lower at B." (asserted by pattern) |
| measure: `site-measure-result` (refNA) | The chart, the hover readout "… km · −… m" (asserted), the facts, the fine line |
| measure: `site-measure-err` (refNA) | B at 18.95° N: "B is outside the map's 60 × 60 km square.", the field marked and focused (asserted); the last line kept |
| measuredrag: `site-measure-drag` (desktop, refNA) | A mouse drag across the delta and crater: the line, the chart, the fields filled (asserted) |
| measuredrag: `site-measure-click` (desktop, refNA) | One click: A alone, "A is set: click the map again for B.", B empty, no chart (asserted) |
| measuredrag: `site-measure-click2` (desktop, refNA) | The second click: the line and its chart |
| `site-measure-pin` (refNA) | Two clicks on a Mars pin's map: a line, the route unchanged (no move), the illustrative line (asserted) |
| measuretouch: `site-measure-touch` (phone, refNA) | Two CDP taps on Malapert's map: the line over the massif and its chart (asserted) |
| measuretouch: `site-measure-swipe` (phone, refNA) | A one-finger swipe up on the map: the sheet scrolls over 100 px, the line and its ends kept (asserted) |

`npm run a11y` gains `site-measure` (the control on, its fields).

**Known limits.** The body is a sphere of its mean radius: on Earth and Mars (flattened about 1/300 and 1/170) a
geodesic on the ellipsoid differs by up to about 0.5 %, more along a meridian; the Moon's is negligible. Heights are
bilinear between the grid's samples, so the chart, the climb and the grade are as fine as that spacing (the panel
gives it); a line ends inside the map's square, whose heights it reads. The line is drawn on the map, not on the 3D
block. The chart's hover readout is pointer only: its numbers for the keyboard and screen readers are the facts and
the chart's label (ends, distance, lowest and highest).

**Verification** (2026-10-21): see the Log entry.

### Profile and measure review fixes (done)

Eleven findings (independent review of Stretch 3, 2026-10-21); 1 = 9, 3 = 4, 5 = 11. All fixed; none wrong. Findings
3/4 took both options in part: the length on the map for every input, and the status line scrolled into view after a
typed line, not after a tap (Decisions 189, Deviations).

| # | Finding | Outcome |
| --- | --- | --- |
| 1, 9 | On touch the chart's readout only flashed: after pointerup the browser fires pointerout (relatedTarget null) for a pointer that can't hover, which hid it; the phone `site-measure-result` showed one only because the harness hovers with a mouse | Fixed (`ui/measure.ts`): the pointerout handler returns unless `pointerType === 'mouse'`, so a tap's readout stays till the next tap or the chart's next line. New phone state `site-measure-tap`: a CDP finger tap on the chart, the rule and readout still there after it lifts (asserted) |
| 2 | Typed ends at the same point stored the line and said "A and B are the same point…" styled as a success (`cmsg ok`), B neither marked nor focused, the old chart dropped | Fixed: the submit loop reports it as B's error (`gcKm` under 1 m), marked, focused, `cmsg err`, the last line and chart kept like every other typed error; a click on A's own spot (the pointer's way to it) now shows the same message as an error too (`result` returns `err`). State `site-measure-same` (asserted) |
| 3, 4 | Phone: after the second tap or Enter the only change in view was the line; the status line, facts and chart sat ~250 px below the sheet's fold (with the keyboard up, the typed result hidden too) | Fixed: the line's length is drawn on the map in an edge-label chip by B (`topomap.ts`; beside B away from A, else over or under it away from A, then the two spots over the line's end: the first inside the map and 3 units clear of its labels, the extent, scale bar, north and the edge chips, which the first try ran into on the phone's typed line and the desktop drag), so a tap's result is where the finger is, at every size and input; after a typed line the panel (on a phone the sheet, unless peeked) scrolls `#ms-msg` into view with `block: 'nearest'` (as "Search this area" does). The tap path doesn't scroll: the sheet would slide the map from under the finger that is drawing on it, and the next tap starts a new line (Deviations). `site-measure-typed` asserts the status line in view; phone `site-measure-touch` shows "32.3 km" by B |
| 5, 11 | From (A) and To (B) had no placeholder, unlike `#cin` | Fixed: placeholders in the site's own format at 2 dp as `#cin`'s: A the map's centre, B a quarter of the square east of it (a different point, so copying both examples draws a line). `site-measure-on` asserts A's |
| 6 | Chart labels at 10 viewBox units rendered ~9.6 px in the 288 px desktop chart, under the 10 px map chips | Fixed: `.prof text` 10.5 units (10.1 px desktop, ~11.5 px phone); the gutter 62 (was 60), labels 5 from the plot, so "−10,000 m" still fits |
| 7 | The coral line over the slope hazard's coral tint was told apart only by its casing; no state had both | Fixed: while the hazard is on the line is the wordmark ramp's pale stop `#FFE3D2` on the same dark casing; the ends stay coral discs. State `site-measure-slope` (Malapert, both on): the pale line reads over coral and grey alike |
| 8 | No states for an Earth site, the same-point message, the empty and garbled errors, Measure off | Added: `site-measure-same`, `-empty`, `-garbled` (seq `measure`, after `-err`; each message asserted, its field marked and focused), `site-measure-off` (seq `measurepin` after `-pin`: no fields or chart, the caption back to "… Click to move the pin." / "Tap the map to move the pin.", asserted), `site-measure-earth` (Haughton: ° W fields and "Earth's 6,371 km radius", asserted) |
| 10 | `Profile.u` and `.v` filled on every render, read by nothing | Removed |

**Tests** (368, unchanged): the profile tests never read `u`/`v`; the chip's placement is canvas drawing, checked in
the captures below.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| measure: `site-measure-on` (refNA) | As before, the fields' placeholders (A "18.38° N, 77.58° E", asserted; B east of it) |
| measure: `site-measure-typed` (refNA) | As before, "28.4 km" by B on the map (desktop; on a phone over B, scrolled above the sheet's top), the status line in view (asserted; on a phone the sheet scrolled to it) |
| measure: `site-measure-same` (refNA) | B typed as A: "A and B are the same point: put B somewhere else." in coral, To (B) marked and focused, the chart kept (asserted) |
| measure: `site-measure-empty` (refNA) | A emptied: "Enter A's coordinates.", From (A) marked and focused (asserted) |
| measure: `site-measure-garbled` (refNA) | A "18.3N 77.3Q": "A: Unrecognised "Q". Use numbers, °′″ and N, S, E or W." (asserted) |
| measurepin: `site-measure-off` (refNA) | Off on the pin: the line gone, no fields or chart, the pin caption back (asserted) |
| `site-measure-earth` (refNA) | Haughton: the line across the crater, "13.1 km" by B, the fields in ° W and Earth's 6,371 km radius (asserted) |
| `site-measure-slope` (refNA) | Malapert with the slope tint: the pale line on its casing over coral and grey, the ends coral, "39.8 km" by B |
| measuretouch: `site-measure-touch` (phone, refNA) | As before, "32.3 km" by B on the map |
| measuretouch: `site-measure-tap` (phone, refNA) | A finger's tap on the chart: the rule, dot and readout stay after it lifts (asserted) |

**Verification** (2026-10-21): see the Log entry.

### Landing ellipse (Stretch 4, done)

A mission's landing ellipse at its true size on the site view's block and map (plan, Stretch 4). Decisions 190.

- **Missions** (`src/ellipse.ts MISSIONS`), the full long × short axes, each with the source line the panel shows:

  | Mission | Body | Ellipse | Source |
  | --- | --- | --- | --- |
  | Perseverance (Mars 2020) | Mars | 7.7 × 6.6 km | NASA/JPL, "Perseverance Rover Landing Ellipse in Jezero Crater" (PIA24350, 2021): "4.8 miles by 4.1 miles (7.7 kilometers by 6.6 kilometers)", https://www.jpl.nasa.gov/images/pia24350-perseverance-rover-landing-ellipse-in-jezero-crater/ ; ESA, "Jezero landing ellipse" (2021), https://www.esa.int/ESA_Multimedia/Images/2021/02/Jezero_landing_ellipse |
  | Curiosity (Mars Science Laboratory) | Mars | 20 × 7 km | NASA/JPL, "Landing Target for Mars Rover Curiosity, in Stereo" (PIA15688, June 2012): "about 12 miles long and 4 miles wide (20 kilometers by 7 kilometers)", narrowed from 25 × 20 km, https://science.nasa.gov/resource/landing-target-for-mars-rover-curiosity-in-stereo ; The Planetary Society, "Curiosity's shrinking landing ellipse" (2012-06-11), https://www.planetary.org/articles/20120611-curiosity-landing-ellipse |
  | Artemis HLS (crewed lander) | Moon | a circle 200 m across | NASA, "Lunar Communications and Navigation Architecture" (2024), §III: "a Human Landing System accuracy requirement of within 100 meters of a planned landing site", https://www.nasa.gov/wp-content/uploads/2024/01/lunar-communications-and-navigation-architecture.pdf (read from the PDF's text) |
  | Apollo 11 (Lunar Module) | Moon | 18.5 × 4.8 km, east–west by north–south | 11.5 by 3.0 statute miles: A. Chaikin, *A Man on the Moon* (2007), p. 88, as cited by Wikipedia's "Tranquility Base"; D. Eppler, "Human Lunar Landing Experience on Project Apollo" (NASA slides), https://www.nasa.gov/wp-content/uploads/2023/06/eppler-slides-apollo-lunar-landing-experience-report-20070-r4.pdf, as cited by Wikipedia's "List of landing ellipses on extraterrestrial bodies" (the slides' text is in an embedded font that couldn't be extracted here, so this one is second-hand); LROC's "Oceanus Procellarum Base Here" (https://lroc.im-ldi.com/posts/1122) places the landing "near the southwest edge of the Site 2 landing ellipse" |

  A body offers its own missions; Earth, where analogs are tested, all four (the select grouped Mars and Moon). The
  chosen one holds for the session; a body without it takes its first (Perseverance, Artemis HLS).
- **Block** (`terrain/mesh.ts`): `buildTerrain(…, ell)` (the router's site branch passes the chosen mission and the
  axis while on; compare passes none) sets a uniform, the semi-axes in scene units and the azimuth. The fragment shader
  measures each fragment's plan position against the ellipse (`r`, 1 on its edge) and draws its edge in screen pixels
  (`fwidth`): 2 px of coral over a 5 px dark casing, after the contours and water, so it lies draped over the ground
  whatever the exaggeration; pale `#FFE3D2` while the slope hazard tints the ground coral (as the measured line).
- **Map** (`ui/topomap.ts drawMap`): the same ellipse round the map's centre, `ctx.ellipse` at its true size, coral 2 px
  on a 5 px casing (pale over the slope tint), under the map's crosshair and labels and under a measured line. The
  map's label adds ", with the Perseverance landing ellipse" (`slope.ts mapLabel(s, id)`).
- **Panel** (`ui/ellipse.ts`, in `ui/panel.ts siteMedia` after Slope hazard, whose slopes it reads): "Landing ellipse",
  a checkbox "Draw a mission's landing ellipse", off by default; off, one line ("At its true size round the site's
  centre, on the block and the map, with how much of it is steeper than 15°."). On: "Mission", the panel's select
  (`.sel`) of the body's missions ("Perseverance (Mars 2020), 7.7 × 6.6 km"); "Long axis, from north", the sun's
  slider look, 0° to 175° by 5° (arrows, Home/End; `aria-valuetext` "45°, north-east–south-west"; 44 px on touch;
  hidden for a circle), its value beside it; then four facts: Size, Area (km²), Over 15° (the share as a fraction to
  two places, "None" or "Under 0.01", the km² under it), Long axis (degrees and words; "Any, a circle"); and the fine
  print: the source line, "Centred on the site, the map's crosshair; the long axis lies along the approach, so turn it
  to the mission's.", where it runs past the map's square "the share is of the … km² inside it", the slopes' spacing
  ("so steep ground narrower than that doesn't show", or for an ellipse narrower than it, "more than the ellipse is
  wide: the share is the slope of the ground around it, not of the ground inside"), and the illustrative line on a pin.
  The checkbox and the select swap the section in place (the focus kept); the slider changes only the readouts.
- **Share over 15°** (`ellipse.ts ellSteep`): 256 × 256 points spread evenly over the part of the ellipse's bounding
  box inside the map's square, those inside the ellipse kept, each one's slope bilinear between the slope grid's
  samples (`slopeOf`, the hazard layer's grid, as the block's tint interpolates it), counted over 15°. Whether it runs
  past the square is exact (its half-widths east and north), and so is the part inside when the square lies wholly
  within it (Meteor Crater's 16.0 km²); 1–2 ms a call, so the slider redoes it on every input.
- **Stage**: the caption's line under the body's, an outline glyph and "Perseverance, 7.7 × 6.6 km" ("Landing ellipse:"
  for screen readers; short, so a phone's line ends clear of the image toggle).
- **Applied** on the app's clock (once a frame however many inputs a drag sends): `buildScenes` (uniforms only: the same
  mesh) and the map redrawn. Held for the session, not in the route (`shortcut:`); a pin's late height map redoes the
  facts (`redoEllipse` in `app.ts`, beside `redoSlope`).

**Tests** (376, was 368): `ellipse.test.ts` (new, 8): the missions per body and the chosen one's fallback; `sizeOf`;
`axisWords` (north–south at 0° and 175°, east–west at 90° and 100°, the diagonals northern end first); `ellR` 1 at both
axes' ends whichever way the long one points; `ellSteep` all or none on even ground and its area, half where the ground
east of its centre is steep at four azimuths, none on north–south and the circle-segment share on east–west for steep
flanks 1.55 km out, and past the square the part inside (the whole 100 km² square inside a 20 km circle, exactly; a
16 × 4 km ellipse's band across a 10 km square against its integral; a 13 km one along the diagonal wholly inside)
with the steep share of that part.

**Verification table** (new rows; `scripts/capture-states.mjs`; `ellT` asserts the section's words):

| State | Check |
| --- | --- |
| ellipse: `site-ellipse-jezero` (refNA) | Jezero: Perseverance's 7.7 × 6.6 km east–west, coral on its casing on the crater floor, block and map alike; the caption line (asserted), the map's label, the slider's "90°, east–west", the source, 39.9 km² (asserted) |
| ellipse: `site-ellipse-turn` (refNA) | Nine arrows left: 45°, north-east–south-west, the slider focused, its value in step (asserted) |
| ellipse: `site-ellipse-curiosity` (refNA) | Curiosity's 20 × 7 km at 45° on the crater floor; the select keeps the focus; 110.0 km² (asserted) |
| ellipse: `site-ellipse-slope` (refNA) | With the slope tint: the ellipse pale over grey and coral; the share in the facts (asserted) |
| ellipse: `site-ellipse-off` (refNA) | Off: no ellipse, no caption line, the section back to its checkbox (asserted) |
| ellipse: `compare-ellipse` (refNA) | On, then compare: no ellipse, caption line or section (asserted) |
| ellipsemoon: `site-ellipse-artemis` (refNA) | Malapert: Artemis HLS's 200 m circle, a coral dot at the crosshair's centre on the map and the block; no slider; "Across, a circle", the narrower-than-the-spacing line (asserted) |
| ellipsemoon: `site-ellipse-apollo` (refNA) | Apollo 11's 18.5 × 4.8 km east–west across the massif; the slider back; 69.7 km² (asserted) |
| `site-ellipse-meteor` (refNA) | Meteor Crater: the ellipse wider than the 4 km map (no edge on block or map); the select's Mars and Moon groups; "runs past the map's 4 × 4 km square: the share is of the 16.0" (asserted: the whole square, exactly) |
| `site-ellipse-pin` (refNA) | A Mars pin: "The terrain here is illustrative, and so is the share." (asserted) |

`npm run a11y` gains `site-ellipse` (the control on: its select, slider and facts).

**Known limits.** The ellipse is centred on the site (its featured or IAU centre, or the pin); a pin moves it with the
pin, a named site can't move it. One axis for every mission (90° to start), not each mission's own approach. The share
over 15° is only as fine as the slope grid (the panel gives the spacing): Artemis's 200 m circle is finer than any
site's samples here. The ellipse is drawn in the map's plane on the local projection, which keeps distances true from
the centre: at these sizes (20 km at most) the difference from a true geodesic ellipse is far below a pixel. Site view
only (`shortcut:`): an engine-found Earth double opens on compare alone, so it never shows one.

**Verification** (2026-10-21): see the Log entry.

### Landing ellipse review fixes (done)

Thirteen findings (independent review of Stretch 4, 2026-10-21); 4 = 9, 5 = 10, 6 = 11. All fixed; none wrong. Finding
4 offered Apollo 11 first instead; the ring keeps Artemis, the challenge's own mission, first (Decisions 190). Finding
7's suggested fix (the plan position's derivatives with r's gradient) is still the draped facets' derivatives, so the
edge is measured on level ground instead (below).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The mission presets, curated sourced data, sat outside `src/data/` | Fixed: `MISSIONS` and `Mission` moved to `src/data/missions.ts` (imports nothing); the logic stays in `src/ellipse.ts` |
| 2 | Merge note: Apollo 11's 18.5 km can't run past the engine's 18.8 km window (half-length 9.25 km, half-width 9.4); Curiosity's only near north–south or east–west | Fixed: Apollo 11 dropped; Curiosity's runs past within about 21° of north–south or east–west (0–20°, 70–110°, 160–175° on the slider's 5° steps), fits at 45° (half-widths 7.5 km) |
| 3 | Sizes written with plain spaces: on a phone the caption and fine print could wrap between a number and its unit | Fixed: `sizeOf` holds them with `&nbsp;` ("7.7&nbsp;×&nbsp;6.6&nbsp;km", "200&nbsp;m across"; the option text gets U+00A0 from the same entity), so does the "runs past the map's T&nbsp;×&nbsp;T&nbsp;km square" line; the source lines' "100 m", "18.5 km" and "4.8 km" use U+00A0. The states' assertions now match the held spaces (`nb` in `capture-states.mjs`) |
| 4, 9 | Artemis HLS, the Moon's default, a 200 m circle: 2–3 px on Malapert's block, half under the "5,000 m" contour label; on the map inside the crosshair's ring, not told from it | Fixed: under 8 px across, the true-size dot stays and a ring 22 px across marks it too, 2 px coral on the 5 px casing. Map (`topomap.ts`): at 11 u round the centre, clear of the crosshair's 7 u ring, its ticks over it, when `ellipse.ts ringed(m, ext)` (the full axis under 8 of the map's 320 u). Block (shader): at 11 px round the centre whenever the semi-axis is under 4 px at the block's zoom, so it goes when you zoom in far enough to see the dot; drawn on the ground, so it lies as a ground circle. While `ringed`, the contour labels keep clear of the block's centre (±16 px, `terrain-ui.ts`): "5,000 m" no longer sits on the ring (a first try kept them clear for every ellipse and hid Meteor Crater's one label, inside Perseverance's). The fine print adds "Too small to see at this scale: a ring marks it, larger than its true size." when `ringed` |
| 5, 10 | The closed select clipped "Curiosity (Mars Science Laboratory), 20 × 7 kr" under its chevron | Fixed: options are name and size ("Curiosity, 20 × 7 km"); `Mission.craft` deleted (the source line names the mission) |
| 6, 11 | With the slope tint on, the block and map draw the ellipse pale but the caption's outline stayed coral, the legend's colour for slopes; and the outline's 12 + 5 px put its text 3 px right of the body line's | Fixed: the caption's line takes `.pale` while `hazard.on` (the outline `#FFE3D2`), with `hazard.on` in the caption's key so it's rewritten when the tint toggles; the outline 11 × 7 px with margins −2 and 5 px, centred under the dot's 7 px column and its text in line with the body line's (14 px). `site-ellipse-slope` asserts `.ell.pale` |
| 7 | On the block the edge wobbled in width and its casing left black speckles outside it (Malapert's flanks, the phone): `fwidth(r)` read the bumpy draped facets | Fixed: the shader measures the edge as on level ground through each fragment: a pixel's step (`pu`, the scene units a pixel spans face on at the fragment's depth, from the clip w over P11 and the NDC's own `dFdy`, which is exact) along the camera's right and up, slid along the view ray back to the fragment's level; r's analytic plan gradient across those two steps gives its screen gradient (`px()`). Nothing reads the facets' derivatives, so the width is even, 2 px over 5 px, with no speckles; the ellipse is still draped. A first try at a constant plan width (`pu` alone) broke up the far side into dashes, where the ground is foreshortened |
| 8 | Capture gaps: the Moon and slope states scrolled to the map, so the circle's facts and Apollo's share were off-screen and Apollo's "large share" unasserted; nothing captured sun + ellipse, drape + ellipse, or a measured line with it | Fixed: `site-ellipse-slope` and `-apollo` scroll to the section; `-apollo` asserts a share of at least 0.10 (0.29, 20.0 km²); new `site-ellipse-artemis-facts` (the section: "200 m / Across, a circle", "Any / A circle", the ring line, asserted) after `-artemis` (which keeps the map for its ring); new `site-ellipse-sun` (phone: the caption's four lines, asserted, clear of the block's top) and `site-ellipse-drape` (the orbital image draped, and a typed line measured across the map over the ellipse) |
| 12 | A share from 0.995 to under 1 read "1.00" | Fixed: `ellipse.ts shareOf` (tested): "None", "Under 0.01", the fraction to two places, "Over 0.99", "All" for exactly 1 |
| 13 | The site map's `aria-label` put the site's name into the attribute unescaped (`panel.ts siteMedia`) | Fixed: `esc(mapLabel(s, id))`, as compare's map |

**Tests** (378, was 376): `ellipse.test.ts` gains `ringed` (under 8 px on a 320 px map: Artemis at 60 and 10 km, not at
8 km exactly or 4 km, Perseverance never at 60 km) and `shareOf` (each band and both edges); `sizeOf`'s expectations hold
the units with `&nbsp;`.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| ellipse: `site-ellipse-curiosity` (refNA) | As before; the closed select reads "Curiosity, 20 × 7 km" whole, clear of its chevron |
| ellipse: `site-ellipse-slope` (refNA) | Scrolled to the section: the pale ellipse on the block, the caption's outline pale with it (asserted), the share in the facts (asserted) |
| ellipsemoon: `site-ellipse-artemis` (refNA) | Malapert: the true-size dot with a coral ring 22 px across on the block, clear of the contour labels, and round the crosshair on the map; the ring line in the fine print (asserted) |
| ellipsemoon: `site-ellipse-artemis-facts` (refNA) | The section: Size "200 m" over "Across, a circle", Long axis "Any" over "A circle", the ring and spacing lines (asserted) |
| ellipsemoon: `site-ellipse-apollo` (refNA) | Scrolled to the section: 0.29 over 15° (20.0 km²; asserted at least 0.10), 69.7 km²; the block's edge even, no speckles |
| `site-ellipse-sun` (phone, refNA) | A set sun and the ellipse: the caption's four lines (name, body, Lit for, Perseverance; asserted) clear of the block's top and the image toggle |
| `site-ellipse-drape` (refNA) | The orbital image draped with the ellipse coral on its casing over it; on the map a typed line (28.4 km) over the ellipse |

**Verification** (2026-10-21): see the Log entry.

### Landing ellipse review fixes, round 2 (done)

One finding (independent review, 2026-10-21), right, fixed by its option (b).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Every ellipse sits on the site's centre, but the Mars source lines read "Perseverance's ellipse at Jezero" and "Curiosity's ellipse at Gale", as if it were NASA's own ellipse there. Gale's point is the crater's centre, on Mount Sharp, about 52 km from where Curiosity landed; Jezero's about 8 km from Perseverance's landing; the share over 15° then describes ground the mission never aimed for. Fix (a): each Mars preset's published centre, the ellipse there on its own site; or (b): the source lines cite the size only, and the mission's own site says it isn't where it landed | Fixed by (b). The source lines now read "The size of Perseverance's ellipse (NASA/JPL, 2021)" and "The size of Curiosity's ellipse as narrowed in June 2012 (NASA/JPL)". Each Mars preset gains `landed` (`data/missions.ts`: its own site's id, the landing's name and point); on that site the fine print adds, after the centring line, "Not where it landed: Curiosity came down 52 km north-west of the crosshair, at Bradbury Landing, inside NASA's own ellipse." (Jezero: "Perseverance came down 8 km north-west …, at Octavia E. Butler Landing, …"), the distance and the 8-point direction computed from the site's point on the site map's projection (`ellipse.ts landedOf`, `llToLocal`, `compass`). Off its own site, on a pin (even on the same point) and on the Moon and Earth: nothing. (a) not taken: no published centre of either ellipse could be found from NASA, JPL or ESA pages (the captions give sizes, and ESA only that Curiosity's narrowed ellipse moved toward Mount Sharp); centring on the landing point instead would draw an ellipse NASA never drew (Perseverance landed 1.7 km from its centre, Curiosity under 2.4 km from its) |

**Landing points** (`data/missions.ts landed`):

| Mission | Landing | Point | Source |
| --- | --- | --- | --- |
| Perseverance | Octavia E. Butler Landing | 18.4446° N, 77.4509° E | NASA MMGIS `M20_waypoints.json`, first waypoint (sol 13, before its first drive), as the engine's `contracts/examples/target_jezero.json` gives it ("Jezero crater (Perseverance landing point)") |
| Curiosity | Bradbury Landing | 4.5895° S, 137.4417° E (4°35′22″ S, 137°26′30″ E) | Wikipedia, "Bradbury Landing" (citing NBC News, 2012-08-06, and Sky & Telescope, 2012-08-07); the name: NASA/JPL, "NASA Mars Rover Begins Driving at Bradbury Landing" (2012-08-22), https://www.jpl.nasa.gov/news/nasa-mars-rover-begins-driving-at-bradbury-landing/ ; the engine's `search_coordinates` example uses the same point to two places (−4.59, 137.44) |

Both landed inside their ellipses: Perseverance 1.7 km from its centre (J. Foust, "Perseverance lands on Mars", SpaceNews,
2021-02-18), Curiosity under 2.4 km from its (CNN, "'Impressive' Curiosity landing only 1.5 miles off, NASA says",
2012-08-14), both as cited by Wikipedia.

**Tests** (379, was 378): `ellipse.test.ts` gains `landedOf`: Curiosity at Gale's point, the whole line, 52 km
north-west; Perseverance at Jezero's, 8 km north-west, at Octavia E. Butler Landing; nothing for Perseverance at Gale,
for Curiosity on a pin at Gale's own point, or for Apollo 11 at Malapert.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| ellipse: `site-ellipse-jezero` (refNA) | As before; the source line cites the size, and the fine print says Perseverance came down 8 km north-west of the crosshair, at Octavia E. Butler Landing (asserted) |
| ellipse: `site-ellipse-curiosity` (refNA) | As before, at Jezero: the size source line, and no landing line, Jezero not being Curiosity's site (asserted) |
| `site-ellipse-gale` (new, refNA) | Gale, Curiosity's own site: its 20 × 7 km on the crater's centre (Mount Sharp's flank) on block and map; the section in view: "The size of Curiosity's ellipse …", "Not where it landed: Curiosity came down 52 km north-west of the crosshair, at Bradbury Landing, inside NASA's own ellipse." (asserted) |

**Verification** (2026-10-22): see the Log entry.

### My campaigns (Stretch 5, done)

The campaigns requested in this browser (plan, Stretch 5; the open decision Booking flow depth, Decisions 4 and 191).

- **Store** (`data/booking.ts`, the data seam's booking module; mock persistence, frontend-owned in both modes as the
  listings are). A request (`Campaign`) keeps, beside its reference and a copy of the plan, the names it was made
  under: the double as the app labels it (`name`: an established site's name, an engine cell's country), the listing's
  name in a sentence (`place`: "an unnamed area in the United States of America", "Hanksville") and the target as the
  crumbs name it (`target`: "Jezero Crater", "Pin 18.38° N, 77.58° E"; `routes.ts siteName`, now shared by the crumbs
  and the page title). Requests live in `localStorage` (`eidolon.booking`), written as each is made over what another
  tab kept since (so neither tab's is lost); plans stay in `sessionStorage` on `pagehide` as before (Decisions 168).
  `keptOf` reads both (a trust boundary): a request needs every field and a key of the booking flow's shape
  (`mars|moon/<site>|<double>`), or it is dropped. Blocked site data: requests last the page (`lasting` false, said in
  the dialog). `campaigns()` lists them with the body, site and double their key names, soonest start first.
  `planOf` starts a missing plan from its request (a campaign edited in a later session: purpose, team, gear, notes;
  its days dropped once its weather window has moved on, the window from tomorrow). One request per target and double,
  as its confirmation's route: requesting again replaces it.
- **Top bar** (`index.html`, `top.css`): "My campaigns" left of the rate buttons, in their size and line (30 px, 8 px
  radius, 12 px text-2); the count in mono once there are any (`chrome()` writes it on each route; a request lands on its
  confirmation's route). Below 1,100 px (where the crumbs need the room) the calendar icon (`icons.ts dates`), the words
  kept for screen readers and as its tooltip. Measured (throwaway Playwright, the longest crumbs, "Compared with United
  States of America / Requested"): at 1,280 px the crumbs still fit whole with the words and a count. On narrow phones
  (≤ 479 px) the clock shows the time without its date and the count hides; ≤ 380 px the bar's gaps close to 8 px and
  the rate buttons' padding to 5 px: at 360 px the bar now ends at its 14 px gutter (it ran 14 px past it before).
- **Dialog** (`ui/campaigns.ts`, `<dialog id="camps">`, opened by any `[data-camps]`): a native modal (`showModal`: the
  page inert behind it, dimmed), in the panel's look and type: 360 px under the top bar at the right, a bottom sheet
  (80% at most, 14 px top radius) on a phone; Close, the heading "My campaigns" (focused on opening, as a panel's), the
  lede "The test campaigns you requested, soonest first. Each opens its confirmation.", then one row per campaign
  (`.row`: Earth's dot, the double, its dates and days, "For Jezero Crater, Mars · 6 people", the reference in mono; the
  campaign on screen selected, `aria-current`), or "No campaigns requested yet" with how to request one; the fine
  print "Kept in this browser only." (or that this browser keeps no site data) and the mock line. Escape (native), Close,
  the backdrop or a browser back closes it, the focus back on its opener; a row closes it and opens that campaign's
  confirmation (`…/compare/<double>/book/done`), whose heading takes the focus. While a dialog is up the app's global
  keys stand down (`scene/input.ts`): Escape closes the dialog, not the view, wherever the focus is.
- **Confirmation** (`ui/booking.ts`): with a request it renders from the request alone (`bookHTML` before the search
  wait), so a campaign opened in a later session shows at once, though the search that found its double (6 s by
  coordinates, or under another purpose) hasn't landed or doesn't return it. A third button, "My campaigns".
  `panel.ts swap` keeps the focus on the panel's heading when a redraw replaces it (a search landing under a step: it
  fell to the page before).

**Tests** (383, was 379): `data/booking.test.ts` with a page-like `localStorage` set before the module reads it: a
request from an earlier session comes back (`lasting`); a request is kept at once over another tab's, both kept; a
requested campaign edited in a later session from its own plan, its days dropped once its window moved on; `campaigns()`
soonest first with each key's body, site and double, again at the same pair replacing it; `keptOf` drops requests
without names, with a name that isn't a string, or under a key not of the flow's shape. `vite.config.ts` runs the tests
with Node's own web storage off (Node 26 warned on every read without a file).

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| book: `book-done-camps` (refNA) | After `book-done` (now with My campaigns beside Edit the plan): the dialog from the confirmation, one row (United States of America, "Tue 6 Oct 2026 to Sat 10 Oct 2026 · 5 days", "For Jezero Crater, Mars · 6 people", EID-261004-W4DC) selected (asserted), the heading focused (asserted) |
| `camps-empty` (refNA) | `#/mars`: the top bar's My campaigns (words on desktop, the icon on a phone, no count); "No campaigns requested yet", "Kept in this browser only." |
| camps: `camps-pin-reload` (refNA) | Arcadia (searched by coordinates): its Hanksville double's plan, Review, Request; reloaded, at 1 s the search running again (asserted: the step keyed `wait`): "Campaign requested", its reference, "A team of 4 testing for Arcadia Planitia at Hanksville, Tue 6 Oct 2026 to Thu 8 Oct 2026." |
| camps: `camps-two` (refNA) | A second request at Malapert and Haughton Crater; from the top bar: two rows soonest first, Arcadia's (kept over the reload) then Malapert's, selected (asserted); the count 2 (desktop) |
| camps: `camps-open` (refNA) | The first row: Arcadia's confirmation, the dialog closed (asserted); opened again and Escape: closed, the focus on its button, the step kept (asserted) |

`npm run a11y` gains `campaigns` (the dialog, empty): no violations, with `mars` and `compare-cell`.

**Keyboard probe** (throwaway Playwright on the dev server, normal mode, two requests stored): Tab reaches the button
after the crumbs; Enter opens the dialog on its heading; Tab runs the rows; an arrow key leaves the globe be; Escape
closes it on `#/mars` (before the guard it also went back to the system view: the focus had left the dialog past its
last row), the focus on the button; Enter on a row opens `#/moon/malapert/compare/haughton/book/done`, the focus on
"Campaign requested"; the confirmation's My campaigns opens it with that row selected; the browser's back and a click
on the backdrop close it. A request stored alone (no plan in the session) opens Edit the plan with its purpose, team,
gear and notes, its days kept under `?capture` (the same window) and dropped live (the window moved on). No console
errors.

**Known limits.** Requests live in this browser only (no account, no sync); a cleared site storage clears them. One
campaign per target and double (its route's); requesting again replaces it. No withdrawing a request: it stays until
the site's data is cleared (`shortcut:` at `data/booking.ts request`). The dialog has no route of its own: My campaigns
is personal to the browser, so there is no link to share; a reload closes it. Names are kept as requested: an Earth
cell's country from the search then, never refreshed.

**Verification** (2026-10-22): see the Log entry.

### My campaigns review fixes (done)

Seventeen findings (independent review of Stretch 5, 2026-10-22); 2 = 15, 3 = 14, 5 = 8, 6 = 13 (in part). All fixed;
none wrong. Finding 5's choice: the dialog now moves (finding 8), and its place at the right and the phone sheet's
80% are listed under Deviations with their reasons. Finding 7's choice: the crumbs ellipsize (switching to the icon
below 1,300 px alone would still cut the current step at 1,180 px, measured).

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | A row named an Earth cell double by its country alone, with no point; two US cells read alike; a pin target at 2 places | Fixed: under the double's name its point to 4 places in mono (`.ll`, a result card's), from the key's double (`siteOf('earth', dbl)`: an `@lat,lon` cell or an established site), nothing new stored; a pin target reads "For Pin 18.3800° N, 77.5800° E" from its key (`parsePinId`), a named target or featured site by its stored name |
| 2, 15 | The list and count read the page's load-time copy; a request wrote this tab's stale copy of every key over another tab's newer one | Fixed: `data/booking.ts sync()` re-reads `keptOf(localStorage)` whenever `campaigns()` lists (the dialog opening, the count on each route and on another tab's `storage` event); `request()` syncs, then sets only its own key and writes: every other campaign as the browser keeps it. Once storage fails (blocked, or full) the page's copy is the record and is never read over (no request made in the page is lost) |
| 3, 14 | `keptOf` checked shapes only: empty or non-ISO days ("Invalid Date · NaN days", a stored `<!--` commenting out the dialog, `isoDay` throwing in Edit the plan), a team of "NaN"; a key that doesn't resolve opened a site route | Fixed: `planIn` (plans and requests) requires `from` as an ISO day (`/^\d{4}-\d{2}-\d{2}$/` that parses) and `start`/`end` the same or empty; a request's plan must pass `validate()` as it did to be requested (its days on its window, the first not after the last; a whole team from 1 to 40; notes within 1,000). A campaign whose site or double this version can't open is left out of the list and the count (`ui/chrome.ts listed`) |
| 4 | The merge note's "only two calls" was wrong: the confirmation, the count and `planOf` read `requests` directly | Fixed: `requests` is private to `data/booking.ts`; the confirmation reads `requestOf(key)`, the count `campaigns()`; the note now names `request()`, `requestOf()`, `campaigns()` and `planOf`'s read, and the storage beside them |
| 5, 8 | No motion where every panel and sheet moves; three departures logged only under Decisions | Fixed: CSS transitions (`@starting-style` and `allow-discrete`, so the native backdrop fades too): on desktop and tablet it drops 10 px from under the bar as it fades in, the page dimming with it, 0.9 s power2.inOut (the panel's move); on a phone the sheet comes up 0.85 s power3.out and goes down 0.7 s power3.inOut (the info sheet's). Under reduced motion a crossfade (desktop) or at once (phone); under `?capture` none (the capture rule now covers `::backdrop`). On its way out it takes no clicks. The way out animates where a closing dialog can stay on top (Chromium's `overlay`); elsewhere it goes at once. Position and height: Deviations |
| 6 | No test or state for blocked storage | Fixed: two tests with a fresh import (`vi.resetModules`) under a stubbed `localStorage`: one throwing on access (`lasting` false, the request lasting the page, listed) and one throwing on write (`lasting` turns false, the request kept and not read over); state `camps-blocked` (`noStorage`) |
| 7 | From 1,100 to ~1,265 px the longest crumbs lost their current step | Fixed: the site's and double's crumbs (`.lg`, marked in `chrome()`) shrink with an ellipsis, the double's four times as fast; the rest and the current step stay whole. In the icon's range (≤ 1,099 px) "Solar system" goes when a world follows it (the brand leads there too); at ≤ 879 px (a tablet in portrait) the site's and double's go too unless current (collapsed, a few pixels of each read as specks). Measured (throwaway Playwright on the longest trail, `…/jezero/compare/@34.6750,-105.0750/book/done`): "Requested" whole at 1,300, 1,180, 1,099, 900, 880, 879, 768 and 760 px (at 768 it had been cut before this item too); the tablet's `camps-two` looked at |
| 9 | The confirmation's third button wrapped onto a line of its own | Fixed: a quiet link in the fine line, "It’s listed in My campaigns. A mock-up: …" (`.fine button`, underlined as a credit's link) |
| 10 | The empty box was a dead end | Fixed: "Featured sites on Mars" (or the Moon, on its routes), primary, in the box's actions row: the target world's site selector grid |
| 11 | On a phone a bare calendar icon by the clock, its count hidden | Fixed: a calendar with a tick (`icons.ts booked`), and at 479 px and under the count as a badge on its corner (the primary button's light ground, 16 px), taking no room from the bar |
| 12 | Pinned to the viewport's right, not under its button as the docs said | Fixed: `--r` puts its right edge on the button's (inside the 12 px gutters, set on opening and on resize); asserted in `book-done-camps` |
| 13 | Never captured: blocked storage, a row's focus or hover; `camps-pin-reload`'s check said the status line read "Reading Mars terrain…" | Fixed: `camps-blocked` and `camps-keys`; the check now says the status line shows the compared window. The tablet's icon variant measured instead (finding 7) |
| 16 | The button's name read "My campaigns2", or without the count on a phone | Fixed: `chrome.ts count()` sets `aria-label` "My campaigns, 2 requested" (or "My campaigns"), asserted in `camps-two`, `camps-empty`, `camps-blocked` |
| 17 | `camps-open`'s `#pin .ref` couldn't fail | Fixed: asserts the Arcadia crumb and the reference EID-261004-RBJS |

**Tests** (385, was 383): `booking.test.ts`: another tab's requests listed as it makes them and kept when this tab
requests (its newer request of the same pair too; only this tab's key written); `keptOf` drops plans with days that
aren't days (`x`, `<!--`, `2026-13-45`, a time) and requests whose plan wouldn't pass (team NaN, 0, 41; no days; the
last before the first; past the window; `from` not a day), keeps a plan with no days picked; blocked and full storage
as above.

**Verification table** (new and changed rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| book: `book-done` (refNA) | Back to the comparison and Edit the plan on one row; "It’s listed in My campaigns (underlined). A mock-up: …" |
| book: `book-done-camps` (refNA) | As before, the row with 34.6750° N, 105.0750° W under its name (asserted); the dialog's right edge on its button's (asserted) |
| `camps-empty` (refNA) | The calendar-with-a-tick icon on a phone; Featured sites on Mars in the box; the button named "My campaigns" (asserted) |
| camps: `camps-pin-reload` (refNA) | Check text corrected: the status line shows the compared window |
| camps: `camps-two` (refNA) | Each row's point (Arcadia's double 38.4250° N, 110.7750° W, asserted); the count 2 (a badge on the icon on a phone), the button named "My campaigns, 2 requested" (asserted) |
| camps: `camps-open` (refNA) | Asserted: Arcadia's crumb and its reference EID-261004-RBJS, before and after Escape |
| camps: `camps-keys` (new, refNA) | Enter on the button opens it on its heading (asserted), Tab rings the first row (asserted `:focus-visible`), the pointer over the second |
| `camps-blocked` (new, refNA, `noStorage`) | Both storages throw: Malapert's plan, Review, Request; from the confirmation's link one row, selected; "This browser keeps no site data, so they last until the page is closed." (asserted); the count 1 in its name (asserted) |

`capture.mjs` gains the context option `noStorage` (both storages throw on access, as with site data blocked).

**Verification** (2026-10-22): see the Log entry.

### Earth clouds on the title (Stretch 6, done)

Earth's clouds back on the title shot only, where no site has to be read (plan, Stretch 6; Decisions 192).

- **Map** (`public/textures/earth_clouds.jpg`, `npm run fetch:real -- --only=clouds`, also in `--only=globes`): Blue
  Marble's cloud layer at NASA's own web size, 2048 × 1024, one grey channel (385 KB), from 180° W as the day map;
  credited in `docs/credits.md` and the info sheet's Data column ("Blue Marble clouds"). Uploaded as R8 like the
  bump and gloss maps (`renderer.ts made`: no colour space, one channel), repeat-wrapped in u so the drift runs past
  its seam: 2.8 MB of GPU memory with its mips.
- **Loading** (`app.ts`): with the full maps of the route's worlds (`nrm()`, the normal maps' batch: after start, so
  it holds no start; a title, system or compare route), else with the rest. `BODIES.earth.clouds` names it. If it
  lands while the title shows, the clouds fade in over .9 s (`cOn`, turned by `showMaps` as the relief's `nOn` is);
  if it fails, the title is as before (a console warning, the one 404).
- **Shader** (`planet.frag.glsl`, uniforms in `planet.ts`): cover, not a second shell: from the title's distance a
  deck 10 km up is a fraction of a pixel off the ground. `cl = smoothstep(.12, .85, cover) · cloudK · cOn` mixes the
  albedo to .62 (linear; at full sun .78, under the bloom's .9 threshold), flattens the relief under it, takes the
  glint off and 80% of the night lights; the thinnest haze (under .12) left out, so the coasts read. Lit by the same
  sun and terminator as the ground. Sampled only while `cloudK > 0`.
- **When** (`frame.ts`): `cloudK` is `G.title`, the opening's shot value: 1 from the intro on (backlit there, so
  unlit until the dawn reaches them), through the sunrise and the title; `leaveTitle` takes it to 0 over .8 s, so the
  clouds fade as Earth pulls back, and every other view has none. Drift: `cloudU` += .0004 of a turn a second (east,
  an eighth of the title's turn: about 4° against the coasts in 30 s), on the frame clock's `dt`, so `?capture`'s
  seek places the clouds as it does the spin; none under reduced motion (the globe holds still there too).
- **Legibility** (`title.css`): at desktop sizes the blurb's lines cross the globe's lower edge, now often over lit
  cloud. Measured on `title` (desktop), the coral first line against the median ground under it: 6.7 : 1 over the
  clear ocean before, 3.1 over cloud, 3.3 with a text shadow alone (tried, dropped), 5.0 with the scrim kept: the
  title's ground at .72 blurred 20 px under the blurb's lines (not its buttons; off in the portrait layout, where the
  blurb sits below the globe). It also covers a desert or the bright limb turning under the text, as could happen before.
  `.blurb` isolates its layer, so the scrim also lies over the poster on the no-WebGL page (`#gl-fail .blurb`), whose
  poster now has the clouds.
  The title's SVG labels (site names, Eidolon-1) take the HUD's dark 1 px edge (`paint-order: stroke`).
- **Poster and link preview** remade (`npm run poster`): the title shot now has its clouds; the `og` state hides the
  scrim with the first paragraph it shades.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `title` | Check text: Earth under its clouds (build), the blurb's lines shaded where they cross the globe, the site labels edged dark |
| `title-clouds-late` (new, refNA) | `#/` at 46 s, 30 s after `title`: the clouds in full, drifted about 4° east against the coasts |
| clouds-off: `title-clouds-leave` (new, refNA) | From the title (16 s) to `#/system`, .4 s on: Earth pulling back, its clouds half faded |
| clouds-off: `title-clouds-off` (new, refNA) | The system reached from the title, 2.5 s on: Earth clear of clouds, as in `system` |
| `title-clouds-blocked` (new, refNA, `block`) | The cloud map failing (its one intended 404): the title as before, the ocean clear |
| rm: `reduced-motion-title` | Check text: its clouds on, not drifting |
| `og` | The scrim hidden with the paragraph it shades |
| nogl: `no-webgl` and the rest of its seq | The poster with its clouds; the message and blurb shaded over the globe (desktop) |

**Drift probe** (throwaway, reverted): with the title's spin set to 0, `title-clouds-late` at 16 s and at 46 s: the
ground in place, the clouds moved east (the cloud band over the southern United States out toward the Atlantic, the
Gulf's specks right). **Seek probe**: `title-clouds-late` captured twice, 5 bytes of 3,072,000 differ by one level.

**Performance** (`npm run perf -- --only=memory`, 2026-10-22): GPU memory peak 294.6 MB at 1280 × 800 @2 (was 291.6;
textures 164.0, targets 108.1, buffers 3.4, drawing buffer 19.1), 294.5 at 1512 × 860 @2, 272.9 at 1920 × 1080 @1,
113.9 phone; peak on the compare, as before (the walk's routes hold every map; the title holds fewer).

**Known limits.** One static composite (Blue Marble, 2002), not today's weather; the whole deck drifts east at one
rate (no latitude bands); no cloud shadows or parallax; the drift counts from page load, not from the sim clock.
5.4 MB of the 300 MB budget left (Merge notes).

**Verification** (2026-10-22): see the Log entry.

### Earth clouds on the title review fixes (done)

Three findings (independent review of Stretch 6, 2026-10-22). All fixed; none wrong.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | The poster's credit row listed the Earth maps without `earth_clouds.jpg`; the og row said 39 KB; the no-WebGL page's poster credit didn't name the clouds, unlike the info sheet | Fixed: `docs/credits.md` poster row adds `earth_clouds.jpg`, the og row reads 54 KB (55,511 bytes); the page's line (and its quote in credits) reads "…drawn from NASA’s Blue Marble and Black Marble maps of Earth, the Blue Marble clouds, NOAA’s ETOPO1 relief and the MODIS water mask." |
| 2 | No state showed the clouds coming back with the title (`playTitle(false)` eases `G.title` to 1 over 1 s) | Fixed: `title-clouds-back` and `title-clouds-back-full` in the clouds-off seq, after `title-clouds-off`: `#/` from the system, .5 s on (`G.title` ≈ .75 under power1.out) and 2 s on (full) |
| 3 | Scrolled to the credits, the hero's foot (the ghost "Replay intro", the meta row) crosses the fixed globe's lit clouds, below the scrim | Fixed (`title.css`): the title's ghost button takes the scrim's ground, `rgba(4,16,18,.5)` (not while hovered: the panel's hover ground stays); the meta row a dark edge and halo in the same colour (`0 0 1px` twice, `3px` at .9, `10px` at .8). The scrim isn't run under `.tcta`: it would grow its blurred box over the buttons on the title shot itself, where they sit on dark ground |

**Measured** (`footer-step1`, desktop; throwaway probe states, reverted: each screenshot twice, the second with the
text transparent, so the glyph cores' contrast is read against the ground actually under them; p10 of the cores):

| Text | Before | After | Over dark ground (unchanged) |
| --- | --- | --- | --- |
| "Replay intro" | 3.9 : 1 (ground p90 .25) | 8.3 : 1 (ground p90 .07) | |
| "Earth, low orbit" (over cloud and glare) | 1.9 : 1, median 2.4 | 4.2 : 1, median 4.6 | 4.2 : 1, median 4.6 ("NASA Space Apps…", "Scroll for credits") |

Two lighter shadows were tried and dropped: a 2 px and 8 px halo alone (2.9 : 1 p10 over cloud), a 3 px pair with a
12 px halo (2.9); a single 1 px edge (3.8). The tight double edge is what brings the cloud case to the dark-ground one.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| clouds-off: `title-clouds-back` (new, refNA) | Back to the title from the system, .5 s on: Earth closing in, its clouds fading back in (about three-quarters) |
| clouds-off: `title-clouds-back-full` (new, refNA) | 2 s on: Earth framed, its clouds in full as in `title` (the wordmark mid-reveal) |
| opening: `footer-step1-develop` … `footer-step4` (desktop) | The hero's foot over the globe: "Replay intro" on the scrim's ground, the meta row edged dark |
| nogl: `no-webgl` | The poster's credit names the Blue Marble clouds |

**Verification** (2026-10-22): see the Log entry.

### Stretch list holistic review fixes (done)

One cross-item finding from the review after the stretch list (2026-10-22), major. Fixed; not wrong.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | `#/` (the title, and Replay intro) reached straight from `#/<body>/<site>` or `…/compare/…` (a deep link, then the browser's Back) left the terrain on screen: Jezero's block where Earth should be, its contour labels, legend, caption and north arrow (`#tui0`/`#tui1` on); from compare both legends on top of each other. Replay intro then played the brief over it, and `#/mars` or `#/earth` after it kept the block, since `playBody` only swaps when the previous view was a site or compare | Fixed (Decisions 194): `views/title.ts playTitle` calls `setTerrain(false)` and clears `VPS[0].only`, as `playSystem` and `playBeyond` do; so the intro, which only starts from the title, and every view after it find the globe. From a site the swap is the usual crossfade under the title's pull-back; from the intro's own end it is a no-op. `only` mattered too: compare's Globe mode leaves `L0.only` on the site's world, which would have hidden Earth on the title. `playBody` keeps keying its swap on the previous view (Decisions 194) |

**Tests** (385, unchanged): a call added to a view; nothing new to unit-test. Both title states fail without the fix
(`nothing matches #tui0:not(.on)`, checked by reverting `title.ts` for one run); without the `only` reset,
`title-from-compare-globe` shows the title with no Earth at all (the sun, rings and labels over empty space), checked
the same way.

**Verification table** (new rows; `scripts/capture-states.mjs`):

| State | Check |
| --- | --- |
| `title-from-site` (new, refNA) | `#/mars/jezero`, then `#/`, 4 s on: the title with Earth, its clouds and annotations; no terrain block, legend, caption or arrow (`#tui0` off, asserted) |
| title-back: `title-from-compare` (new, refNA) | `…/compare/salda`, then `#/`: as above, neither legend (`#tui0`, `#tui1` off, asserted) |
| title-back: `title-from-compare-replay` (new, refNA) | Replay intro from there, 2 s in: the brief over Earth's night limb, as `intro-2s` |
| title-back: `title-from-compare-earth` (new, refNA) | `#/earth` after it: the globe, as `body-earth` |
| `title-from-compare-globe` (new, refNA) | `…/compare/salda/globe`, then `#/`: Earth on the title, not hidden by compare's `only` |

**Verification** (2026-10-22): see the Log entry.

### Final review fixes, round 1 (done)

38 findings from the final review (2026-10-22): 5 major and 33 minor. 27 fixed, 11 logged (not done, or not worth it
now, with why). Blockers: none.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | Stars are the mock's 1,400 random points: no bright-star catalogue, Milky Way band or real orientation (plan's Stars row, Stretch) | Not done; logged (Deviations). The one Stretch row in Rendering and shaders not delivered |
| 2 | Static text: the title's "Earth, low orbit" and the frame's "Terrain Generating" never change (Stretch) | Fixed: the meta row reads "Low orbit over 1° S, 111° W", the point of Earth the title looks down on, as Earth turns (`views/title.ts`, `facing`); the readout's Terrain says "Real elevation" or "Illustrative" from the block the site view builds (`ui/detection.ts`, `genTerrain(...).src`). Decisions 200 |
| 3 | Should 12's tick said the detection grade covers the whole frame; it is alpha-masked to the bodies and blocks | Fixed the tick's wording (Status) |
| 4 | Must 10's tick still gave 308 KB and 284 MB; the final gates measure 340.2/350 KB and 294.6/300 MB; frame rate only on the M3 and a phone proxy | Fixed the tick: both sets of numbers, the headroom, and what was not measured |
| 5 | Five featured targets (Utopia, Arcadia, Meridiani, Elysium, Taurus–Littrow) still show illustrative terrain inside existing DEM coverage | Not done; logged (Known limits): it needs `npm run fetch:real -- --only=sites` with the five added to `TARGETS`, a networked run of remote DEM reads this round doesn't make |
| 6 | The match detail prints the engine summary whole: "United States of America (34.67, -105.07): …", signed 2-place coordinates | Fixed: `unplace` (`ui/results.ts`) drops the place prefix in the detail as in the card (after the no-match lede, which the detail keeps); Location below gives it to 4 places |
| 7 | Textures ship as JPEG, not KTX2; the full tier is 4K, not 8K | Logged (Decisions 109, 152: the 300 MB GPU budget); no change |
| 8 | Terrain generation on the main thread; LOD a fixed stride cap, not tiles by distance | Logged (Decisions 112, 137; `meshIdx` shortcut); no change |
| 9 | The system view's sun has no lens flare (plan's Sun row asks for one that dims behind a body) | Logged (Decisions 95: the system sun sits at the frame's edge, where ghosts would cross the heading); no change |
| 10 | The logo is still the in-house stand-in | Logged: waiting on the logo chat; every variant comes from `src/brand/logo.svg`, so the swap is one file |
| 11 | Intermittent: both compare globes black (no map, graticule or atmosphere) on ANGLE Metal, 2 of ~40 tries, early in a session | Not reproduced (SwiftShader here; none of the reviewer's later ~30 tries either); cause unknown, nothing in this round aims at it. Logged (Known limits) |
| 12 | Compare globes and the body globe after Esc go near-black when the sim clock turns their site into night | Fixed: on the views that read ground (body, site, compare) the globe's night side takes a dim fill from the viewer (`fill`, .25 of the light, eased in and out; the title and system keep the dark night; Earth's city lights still show). `planet.frag.glsl`, `scene/frame.ts`. Decisions 195 |
| 13 | Compare's globe toolbar overlaps Search this area at ~760–1000 px | Fixed: Search this area rises above the toggle where the two don't fit side by side (`ui/chrome.ts`; widths measured as the toggle changes). Probed at 1280, 1024, 960, 900, 820, 768: no overlap |
| 14 | Search this area does nothing visible on a south-pole target (no_dem) | Fixed: hidden there, as the purpose and filters are (`ui/chrome.ts`, `noDemAt`) |
| 15 | Live sets 1× but keeps the fast-forwarded clock | Fixed: Live jumps the clock to now (`motion.ts setRate`). Decisions 199 |
| 16 | Copy: ASCII "0.9x"; pin and cell names to 2 places beside 4 in the panel | Fixed: engine prose shows "0.9×" (`fractions`); pins are "Pin 47.2000° N, 184.3000° E" in crumbs and titles, an unnamed Earth cell "34.6750° N, 105.0750° W" (its place line then not repeated, `ui/panel.ts`) |
| 17 | The engine is slow to say no_dem (3 reads, 5 s apart): Moon south-pole searches take ≥ 10 s; the mock's cutoff is 60°, the engine's 59.5° | Fixed: the client refuses a Moon search or `/elevation/point` by coordinates beyond 59.5° itself, sending nothing (`data/client.ts noDemAt`); the mock's cutoff 59.5° (`mock.ts`). Names still go to the engine. Decisions 197 |
| 18 | Merge notes: "/health asked only after a warming_up" is out of date | Fixed (Merge notes, Data seam) |
| 19 | Merge notes contradict themselves on gap 1 | Fixed (Merge notes, Progressive textures) |
| 20 | The engine address is fixed in code; the 30 s timeout is under the engine's ~40 s worst case | Fixed: `VITE_API` (build time) else the default; 60 s (`data/http.ts`, `vite-env.d.ts`) |
| 21 | knip: 5 values and 11 types exported but used only in their file | Fixed: `export` dropped (and `View` from `router.ts`'s re-export) |
| 22 | `scripts/capture-states.mjs` is 1,064 lines | Not split: harness code, never shipped; a split by view group is churn with no user effect. Logged |
| 23 | `reference/eidolon.html` carries 11 JPEGs of unrecorded provenance | Fixed: a row in `docs/credits.md` (Other): provenance unknown, reference only, never served |
| 24 | No README | Fixed: `README.md`, one screen (run, the data switch, the checks, the docs) |
| 25 | The diameter formatter duplicated | Fixed: `fmtSize` in `coords.ts`, used by both (tested) |
| 26 | Lake Salda's water reads as white-noise static: the glint off sub-pixel ripples aliases | Fixed: ripples a third of the frequency, faded out as a cell nears a pixel (`fwidth`), the glint's gain .55 → .35 (`terrain/mesh.ts`): a clean lake at both sizes |
| 27 | On a south-pole pin the frame's readouts print over the terrain's note, legend and a contour label | Fixed: the frame's text shows only while the frame is more than half there, where the terrain's overlay has faded out (`ui/detection.ts`): the two never overlap. Decisions 198 |
| 28 | Phone: Eidolon-1's tag cut off at the right edge | Fixed: it flips left (or hides) where the viewport's edge would cut it (`views/title.ts`) |
| 29 | "≈ 0.0 km across" for a 9 m IAU point feature | Fixed: metres under 0.1 km, "≈ 9 m across" (`fmtSize`) |
| 30 | Reduced-motion dive: the frame held 1.3 s over Earth's map magnified to blocky texels | Fixed: under reduced motion the terrain swaps in under the frame at once and the frame holds over it as long as it would have (`views/site.ts`). Decisions 196 |
| 31 | The US double sits on Earth's night side at the captured hours: the cell barely visible | Fixed by 12 |
| 32 | Haughton's GLO-30 at 10× reads spiky | Fixed: Earth's real elevation capped at 5× (`terrain/procedural.ts`). Decisions 201 |
| 33 | Phone stacked compare: each block's back corner grazes its caption's last line | Fixed: the pair framed a little smaller and lower (`scene/frame.ts`) |
| 34 | Stale tablet overlay captures (20 Oct) | Recaptured at the tablet size (harness only) |
| 35 | JS 340.2 of 350 KB gzip | Logged (Known limits); this round adds ~0.6 KB |
| 36 | GPU memory 294.6 of 300 MB | Logged (Known limits); this round adds none |
| 37 | Phone frame rate is a proxy | Logged (Known limits): no real mid-range phone here |
| 38 | Vite's > 500 kB chunk warning (three.js, 630 kB raw) | Fixed: `chunkSizeWarningLimit: 700` in `vite.config.ts`, as the gzipped budget is what `npm run perf` checks |

**Tests** (388, was 385): `coords.test.ts` `fmtSize`; `results.test.ts` the detail's summary without its place (and
with the no-match lede kept), a 9 m feature; `client.test.ts` a Moon pin past 59.5° refused with nothing sent, 59.5°
asked; `mock.test.ts` the 59.5° cutoff; the "×" and 4-place names in `results`, `fallback`, `routes`, `pins` tests.

**Known limits.** The five featured targets above keep illustrative terrain until a networked `fetch:real` run (5).
The compare globes' black discs (11) were not reproduced; if they come back, check `sunDir` and the colour maps'
upload on that GPU. Copy still says "within 60°" (the spec's |lat| ≤ 60°) where the cutoff is 59.5°: a pin between the
two reads as no data under a line that says 60°. JS 340.8 of 350 KB (after this round) and GPU memory 294.6 of 300 MB leave little room;
the 30 fps phone budget is met only on a CPU-throttled proxy (M3 GPU).

**Verification**: see the Log entry (2026-10-22).

### Item 2 prerequisites: parser & formatter tests (done)

Copied verbatim (TypeScript types added, nothing else) into `src/coords.ts` and `src/astro.ts`, with behaviour pinned by
colocated `src/coords.test.ts` and `src/astro.test.ts` (68 tests; vitest's `include` is `src/**/*.test.ts`, so tests sit
next to their module). The port imports these and deletes the prototype copies; it doesn't re-port them.

| Prototype (line) | What | Now in |
| --- | --- | --- |
| `clamp`, `smooth`, `wrap180` (528–530) | helpers | `coords.ts` |
| `D2R` (525) | degrees → radians | `coords.ts` (astro imports it) |
| `pad` (559) | 2-digit zero pad | `coords.ts` (not astro: `dmsOf` needs it and astro needs `wrap180`; avoids an import cycle) |
| `lon360`, `EAST360`, `DATUM` (583–585) | body conventions: Mars 0–360° E, Moon/Earth ±180° | `coords.ts` |
| `latStr`, `lonStr`, `fmtLL` (586–588) | `18.3800° N, 77.5800° E` | `coords.ts` |
| `hudLL` (589–593) | HUD `18.38N 077.58E` | `coords.ts` |
| `dmsOf`, `fmtDMS` (594–595) | `18°22′48″ N, 77°34′48″ E` | `coords.ts` |
| `lonTick`, `latTick` (596–597) | graticule labels | `coords.ts` |
| `parseCoord` (598–634) | the coordinate parser | `coords.ts`; result typed `{empty:true} \| {err} \| {lat,lon}` (callers narrow with `'err' in r`) |
| `siteSpan` (636) | site square half-extent in degrees | replaced in port stage 3 by `llToLocal`/`localToLL` (azimuthal equidistant around the site) |
| `fmtM`, `fmtKm` (637–638) | `−2,600 m`, `1,235 km` | `coords.ts` |
| inline 2166 | longitude tape label `030W` / `330E` | `coords.ts` `tapeLabel(d, b)` |
| inline 2155 | HUD sun elevation `+12.3°` | `coords.ts` `hudElev(el)` |
| inline 1608 | intro sun elevation `−1.8°` | `coords.ts` `introElev(se)` |
| inline 1776, 1832 (and 1965 at 3 dp) | route pin id `@18.3800,77.5800` | `coords.ts` `pinId(lat, lon)` (always 4 dp) |
| inline 882–883 (`customSite`) | pin id → `{lat, lon}`, lat clamped ±89.5, lon wrapped | `coords.ts` `parsePinId(id)` (null if not a pin) |
| `EL`, `jd`, `helio`, `rangeAU` (539–557) | JPL elements | `astro.ts` (earth and mars only) |
| `marsTime`, `hms`, `lmst` (558–561) | Mars Sol Date, MTC, `HH:MM:SS`, LMST | `astro.ts` |
| `fmtLight`, `lightInfo` (562–568) | `13 m 39 s`, `1.64 AU` | `astro.ts` |
| `subsolar` (569–580) | subsolar point per body | `astro.ts` |
| inline 2156 | HUD local time under the cursor (LMST / UTC-offset / sun-relative) | `astro.ts` `hudLocalTime(body, lon, sim, slo)` |
| inline 2172 | status-bar sim clock `10/04 12:00` | `astro.ts` `utcStamp(d)` |

Left inline (trivial, listed so the port knows they exist): MTC `hms(mtc).slice(0, 5)` (2172), intro clock
`toISOString().slice(11, 19)` (1605) and countdown `` `T−00:00:${pad(ceil(rem))}` `` (1606), site-list meta
`` `${abs(lat).toFixed(1)}° N|S` `` (1735; identical to `latStr(lat, 1)`, use that), title annotations
`` `${lat.toFixed(2)}, ${lon.toFixed(2)}` `` (1628; plan Should bug: use `fmtLL`), compare table `toFixed(1)°` and
`(steep*100).toFixed(1)%` (1697–1699; replaced by engine data in Must 4), contour interval `toLocaleString('en-GB') m`
(1934), weather weekday `toLocaleDateString('en-GB', {weekday:'short'})` (1661; seeded placeholder), map readout
(1824, uses `latStr`/`lonStr`/`fmtM`).

Deviations from verbatim: the europa/mercury/venus/jupiter branches of `EL`, `lightInfo` and `subsolar` were dropped (plan
dead-code list; only the three globe bodies ever call them), so `subsolar`'s Moon branch is now the fall-through.
`lightInfo(id, d = new Date())` keeps its wall-clock default; the port must pass `simNow()` (determinism, capture mode).

**Candidate fixes** (pinned as current behaviour, tests marked "prototype behaviour; plan says …"; not changed yet):

1. `lonStr`/`hudLL` on Mars can round to `360.00° E` / `360.0E` (e.g. 359.996°); should wrap to 0.
2. `latStr`/`lonStr` keep S/W on values that round to zero (`-0.001` → `0.00° S`), and `pinId(-0.00001, 0)` writes
   `@-0.0000,…`. Round first, then pick the hemisphere/sign. **Applied in round 2** to `latStr`, `lonStr`, `hudLL` and
   `fmtDMS` (the polar HUD read `000.0W`); `pinId` (route ids) unchanged.
3. `fmtM(-0.4)` → `−0 m`; `fmtKm(-1)` uses a hyphen, not `−`.
4. Two sun-elevation formatters disagree: HUD `hudElev` uses a hyphen and shows `-0.0°`; intro `introElev` uses `−` and
   no sign near zero. Use one.
5. `fmtLight(59.996)` → `60.00 s` (should be `1 m 00 s`).
6. `hms` floors float noise: `hms(12 + 34/60)` → `12:33:59`, so the Earth HUD clock can read a minute early. Round to
   the second (or add an epsilon) before flooring.
7. `parseCoord` returns `wrap180` float noise (`77.58` → `77.58000000000004`); harmless for display (`toFixed`) and the
   1e-6 comparisons, but round to ~1e-9 if results are ever compared exactly or sent to the engine.
8. `parseCoord` silently ignores a trailing hemisphere letter after prefix-style pairs (`N18.38 77.58E` parses; the `E`
   is dropped); `1e3, 5` reads `E` as a hemisphere and reports "Too many values".
9. Route pins: `+180` longitude round-trips as `-180` (`wrap180`), Mars pins are stored ±180 (`@47.2000,-175.7000` for
   184.3° E) though displayed 0–360° E, the globe click (1965) wrote 3 dp while everything else writes 4 (plan: 4 dp; the
   port uses `pinId` everywhere), and `parsePinId` clamps latitude to ±89.5 (pins at the pole move).
10. `siteSpan` uses equirectangular `1/cos(lat)` floored at .2: wrong for polar sites. **Fixed in port stage 3** (site projection).

### Verification harness (done)

Run after every item: `npm run capture` (build), `npm run capture:ref` (reference; baselines already taken, rerun only
if the harness or a state changes). The performance budget has its own run, `npm run perf` (Must 10; not during a capture),
and so has axe, `npm run a11y` (Should 10: WCAG 2.1 A and AA over 20 routes at both sizes; `--routes=a,b`
`--viewports=…` `--url=…`; not during a capture). Options: `--states=a,b` `--viewports=desktop,phone` (also opt-in: `tablet`, 768 × 1024; `laptop`, 1440 × 810; `og`, 1200 × 630, the link preview's image) `--url=http://…/`
`--timeout=120` (s per state) `--compare-only` (rebuild the side-by-side sheets from existing captures). Exit code 1 if
any state failed. Full run, both viewports: about 4.5 min for the reference on this machine; the build will be similar.

- **Files.** `scripts/capture.mjs` (runner), `scripts/capture-states.mjs` (states as data: route, query, seq, steps,
  `scale`, `reducedMotion`, `noWebGL`, `block`, `hold`, `serve`, `noReady`, `refNA`, check; the header documents every step type). Output, gitignored:
  `captures/<reference|build>/<desktop|phone>/<state>.png`, `captures/<target>/manifest.json` (per `viewport/state`:
  ok, error, console errors, ms, note; merged across partial runs), `captures/compare/<viewport>/<state>.png`
  (reference left, build right, with state, check and any error/note in the header).
- **Browser.** One headless Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  (the run aborts if WebGL2 is missing; it prints the renderer, SwiftShader). A fresh context per page group (seq), so
  each starts at the same epoch with its own clock. Desktop 1280 × 800; phone 390 × 844 with `isMobile`/`hasTouch`, both
  at device scale 1 unless a state sets `scale` (the `-2x` states: a retina screen). Screenshots use `animations: 'disabled'` (CSS transitions run on real time; this finishes them).
  cdnjs and Google Fonts responses are fetched once per run and replayed to every context.
- **Reference target.** Served from a throwaway `node:http` server. Time is Playwright's fake clock, installed and paused
  at the capture epoch 2026-10-04T12:00:00Z before navigation, advanced only by `seek` (`clock.runFor` in 1 s chunks).
  Route start = the moment the prototype starts (intro un-hidden, `body[data-view]` set by a deep link, or `#gl-fail`
  shown). The fake `requestAnimationFrame` is throttled to 20 fps: SwiftShader costs ~80 ms a frame at desktop size and
  the prototype has no frame-rate-dependent state (tweens are time-based; spin and inertia integrate `dt`, capped at
  exactly 50 ms). This cut the run from ~14 to ~4.5 min.
- **Build target.** Reuses a Vite dev server already serving Eidolon on `localhost:5173`, else starts one (`--strictPort`)
  and stops it at the end. Loads `/?capture[&query]#route`. If `window.__eidolon` appears within 10 s it drives the
  contract (`ready`, `seek`, `route`); otherwise it falls back to the fake clock with `document.readyState` as ready
  (manifest note "fake-clock fallback"). Until the port lands, every interactive state fails cleanly on the
  placeholder page (no `#gl`, `#cin`, `#hud`).
- **A tap waits 250 ms** (real time; page time stays frozen) so a click's hashchange routes before the next seek.
- **Seeks are absolute within a route start** on both targets: after `{ route }` mid-state, or for a click that changes
  route (dive), keep counting from the last route start (the dive taps at 2.5 s, so `dive-0.8s` seeks to 3.3).
- **Selectors the build must keep** (or the states get edited): `#gl` (canvas), `#title` (scrolling title section),
  `#sysinfo`, `#cin` (coordinate input), `#hud` (box centred on the globe; the dive taps its centre).

**States** (seq groups share one page, in order):

| Seq / state | Route, query | Steps |
| --- | --- | --- |
| opening: `intro-2s`, `intro-6s`, `intro-8s`, `sunrise-9s`, `sunrise-9.5s`, `sunrise-10s`, `sunrise-10.5s`, `sunrise-11s` … `sunrise-13s`, `title` | `#/` | seek 2, 6, 8, 9, 9.5, 10, 10.5, 11–13, 16 |
| opening: `footer-step1-develop`, `footer-step1` … `footer-step4` | (same page) | scroll `#title` to the bottom; seek 17.9 (the mark half developed), 18.9, 22.7, 26.7, 31.4 |
| system: `system`, `info-sheet`, `info-closed`, `beyond` | `#/system` | seek 2.5; wheel down on `#gl`, seek 4; wheel up on `#sysinfo`, seek 5.5; wheel sideways on `#gl`, seek 11 |
| `info-sheet-foot` | `#/system` | seek 2.5, wheel down on `#gl`, seek 4, scroll `#sysinfo` to the bottom, seek 4.2 (the mark beside the big lockup) |
| mars: `body-mars`, `body-mars-zoomed` | `#/mars` | seek 2.5; wheel −500 on `#gl` (zoom .55 < .62 → 10° grid), seek 4 |
| `body-moon` | `#/moon` | seek 2.5 |
| `body-earth` | `#/earth` | seek 2.5 (the Earth lede and list head; Copy pass) |
| `system-moon-late`, `body-moon-late` (refNA) | `#/system`, `#/moon`, `block` both of the Moon's tiers (`/textures/moon.jpg`, `/textures/lo/moon.jpg`) | seek 2.5 (a world before its map: its mean colour, Must 10 review fixes, round 2) |
| `system-maps-loading`, `body-mars-loading` (refNA) | `#/system`, `#/mars`, `hold` the full maps (the three; Mars's), `noReady` | until `#st-m.on` (the app started; ready waits on the held maps), seek 2.5 (the low tiers and the loading line, Should 6) |
| `body-mars-full-fail` (refNA) | `#/mars`, `block` `/textures/mars.jpg` | seek 2.5, expect `#st-m:not(.on)` (a full map that fails: no line, the hint back, the low tier; Should 6 review fixes) |
| `site-jezero-loading`, `compare-jezero-salda-loading`, `compare-globe-loading` (refNA) | `#/mars/jezero`, `…/compare/salda`, `…/compare/salda/globe`, `hold` the three full maps, `noReady` | until the view applies (`body[data-view=…]`; the globe compare: `#st-m.on`), seek 3 (2.5), expect `#st-m:not(.on)` on the terrain views (the line only over globes) |
| `site-pin-gale-loading` (refNA) | `#/mars/@-4.5900,137.4400`, `hold` `/textures/mars.jpg`, `noReady` | until the site view applies, seek 10, scroll `#panel` to `.imgs` (crops cut from the map: empty frames until the full map) |
| coord: `coord-valid`, `coord-error` | `#/mars` | seek 2.5, fill `#cin` "47.2N 184.3E", seek 4; fill "18.38N 77.58N", seek 5 |
| `dive-0.8s` | `#/mars` | seek 2.5, tap centre of `#hud`, seek 3.3 (build: the pin's search holds the frame on the globe, Decisions 47) |
| `site-jezero`, `site-moon-south`, `site-haughton` | `#/mars/jezero`, `#/moon/@-86.2000,1.5000`, `#/earth/haughton` | seek 3 |
| `site-moon-malapert` | `#/moon/malapert` | seek 3 (polar featured site: edges, crops) |
| `coord-moon-pole` | `#/moon` | seek 2.5, fill `#cin` "86S 0E", seek 4 (pole centred, polar markers apart; the reference's panel is still hidden at 0 s, so the fill waits) |
| `moon-pole-zoomed` | `#/moon` | as `coord-moon-pole`, then wheel −500 on `#gl`, seek 5.5 (the south pole up close: the polar cap, Must 9) |
| compare: `compare-jezero-salda`, `compare-globe` | `#/mars/jezero/compare/salda` | seek 3; route `…/globe`, seek 2.5 |
| `compare-jezero-cell`, `compare-globe-cell` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750` (+ `/globe`) | seek 3 (a search result as the double) |
| `edge-slow`, `edge-empty`, `edge-fail` (refNA) | `#/mars/jezero` + `mock=slow|empty|fail` | seek 1.5 / 3 / 3, scroll `#panel` (skeleton; no-match lede; the error box) |
| `edge-skeleton` (refNA) | `#/mars/jezero` | seek 3, Filters, country Australia, seek 3.1, scroll to the doubles (a filtered search's skeleton, asserted not the late one) |
| `poster` (refNA) | `#/`, `hold: '/textures/'`, `noReady` | wait 1.5 s real time (the first-paint frame: the app never starts, Must 9; since its review fixes the intro's first frame) |
| `poster-deep` (refNA) | `#/system`, as `poster` | the deep-link poster: a frame of the title (Must 9 review fixes) |
| rm: `reduced-motion`, `reduced-motion-title` | `#/`, emulated `prefers-reduced-motion` | seek 2 (all three intro lines at once); seek 9 (past the intro: the title at once) |
| nogl: `no-webgl`, `no-webgl-list`, `no-webgl-done` | `#/system`, `getContext('webgl*')` → null | seek 1 (the poster); scroll `#gl-fail` to the list, seek 1.5; seek 45, scroll to Arcadia (Should 9; the last two refNA) |
| nogl-deep: `no-webgl-deeplink`, `-later` (refNA) | `#/mars/utopia/compare/salda`, no WebGL | seek 1; seek 8 (the deep link's entry held at the top) |
| `context-lost` (refNA) | `#/mars/jezero` | seek 3, `eval` the context lost, until `#gl-fail .big`, seek 3.5 |
| `title-shot` (refNA) | `#/`, scale 2 | seek 16, `eval` a style leaving only `#gl` (the poster's source, `npm run poster`) |
| warming: `engine-warming`, `engine-warming-done` (refNA) | `#/mars/jezero` + `mock=warming` | seek 3, scroll `#panel` (Starting up… and its bar); seek 40, scroll to the doubles (asked again by itself, five cards) |
| `engine-moon-pin-85S` (refNA) | `#/moon` + `mock=nodem` | seek 2.5, route `#/moon/@-85.0000,30.0000`, seek 3, scroll `#panel` |
| pin: `engine-mars-pin-6s`, `engine-mars-pin-done` (refNA) | `#/mars` | seek 2.5, route `#/mars/@18.3800,77.5800`, seek 3 (mid-search, the frame held on the globe; the mock pin takes 6 s), scroll `#panel`; seek 10, scroll to the doubles (dived, terrain, five cards) |
| `engine-pin-second` (refNA) | `#/mars` | seek 2.5, route the same pin, seek 2, tap `#hud` at (.3, .5) (a second pin), seek 3, wheel out on `#gl`, seek 3.5 (held on the second pin, zoomed out) |
| res-jezero: `results-jezero`, `results-jezero-foot`, `results-jezero-more` (refNA) | `#/mars/jezero` | seek 3.5, scroll `#panel` to `[data-doubles]` (reference: its foot); scroll to the foot, seek 3.6 (the tested line); then scroll to and tap `[data-more]`, seek 6, scroll to the foot |
| res-hadley: `results-rima-hadley`, `results-rima-hadley-detail` (refNA) | `#/moon/hadley` | seek 3.5, scroll to `[data-doubles]`; then tap the first card, seek 6.5, scroll to `.res` (`hadley` is the reference's id; switch to the build's IAU-name route when it changes) |
| res-detail: `results-jezero-detail`, `results-jezero-notes`, `results-jezero-engine` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750` | seek 3, scroll to `.res`; scroll to the Notes head, seek 3.2; scroll to `.res .drawer`, tap its summary, seek 3.4 |
| `results-moon-malapert` | `#/moon/malapert` | seek 3.5, scroll `#panel` to the doubles (no_dem: the curated analog sites, unscored) |
| `compare-twins` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750` | seek 3, scroll `#panel` to the "Terrain twins" head |
| `compare-twins-point` (refNA) | `#/mars/arcadia/compare/@38.4250,-110.7750` | seek 9 (search 6 s, then the cell's window 2 s), scroll to the twins (a coordinate target's twin from its window) |
| `compare-globe-pins` (refNA) | `#/mars/arcadia/compare/@38.4250,-110.7750/globe` | seek 9: Earth pins as footprint squares, the selected one tagged Hanksville |
| ask-hadley: `ask-hadley`, `ask-hadley-results`, `ask-hadley-detail` (refNA) | `#/moon/hadley` | seek 3, purpose EVA training, open Filters, country United States of America, seek 4; scroll to the doubles, seek 6.5; tap card 1, seek 8.5 (the Rima Hadley example's query) |
| ask-education: `ask-education`, `ask-education-rugged` (refNA) | `#/mars/gale` | seek 3, purpose education, open Filters, seek 3.5; tap the New Zealand card, seek 6 (the rugged badge) |
| targets: `targets-jez`, `targets-named` (refNA) | `#/mars` | seek 2.5, fill `#tq` "jez", seek 2.8, wait 1.5 s, seek 3.2; ArrowDown, Enter (Jezero Mons), seek 8 |
| `targets-shorty` (refNA) | `#/moon` | "Shorty", Enter, seek 8, tap card 1, seek 10 (not measurable at 200 m) |
| area: `compare-area`, `compare-area-filters` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750/globe` | seek 3, two wheels on the Earth globe, seek 3.5, tap `#area`, seek 4.5; scroll to the form |
| book: `book-listing`, `-practical`, `-foot`, `book-plan`, `book-plan-errors`, `book-plan-filled`, `book-review`, `book-review-foot`, `book-done` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750` | seek 3, tap Plan a test campaign here, seek 3.5; scroll to Practical suitability; to the foot; tap Plan a campaign here, seek 4; Review with nothing filled (errors, focus on a day); days 2 to 6, team 6, rover, notes; Review; scroll to the foot; Request, seek 5 |
| `book-established`, `book-review-empty` (refNA) | `#/moon/malapert/compare/haughton/book`; `…/@34.6750,-105.0750/book/review` | seek 3 (an established site's listing, its gaps; a review deep link without a plan) |
| book-pin: `book-pin-wait`, `book-pin-listing` (refNA) | `#/mars/arcadia/compare/@38.4250,-110.7750/book` | seek 3 (the search by coordinates' wait), seek 9 (the Hanksville cell's listing, filled in place) |
| `site-atacama-media`, `site-pin-media` (refNA) | `#/earth/atacama`; `#/mars/@18.4000,77.5000` | seek 3 / 10, scroll `#panel` to `.imgs` (review fixes: Atacama's NASA field photograph; a pin inside Jezero's square with Perseverance's) |
| `site-hanksville-media`, `site-utopia-media`, `site-pin-far-media` (refNA) | `#/earth/hanksville`; `#/mars/utopia`; `#/mars/@40.0000,200.0000` | seek 3 / 3 / 10, scroll `#panel` to `.imgs` (the slot's sentences: no NASA field photograph; Utopia's own beside its lede; none on file for a point) |
| `site-tranquillitatis-media` (refNA) | `#/moon/Statio%20Tranquillitatis@0.6741,23.4732` | seek 10, scroll `#panel` to `.imgs` (review fixes, round 2: a named target at Apollo 11's landing shows Aldrin and the flag, credited to Neil Armstrong) |
| `site-jezero-photo-404` (refNA) | `#/mars/jezero`, `block: '/photos/'` | seek 3, scroll `#panel` to `.imgs` (the photograph refused: "The photograph couldn’t be loaded." in the slot, the credit kept; its 404 intended) |
| `book-listing-photo` (refNA) | `#/mars/jezero/compare/@-21.2250,119.4250/book` | seek 3, wait 400 ms, scroll to `.imgs` (the Pilbara cell's listing with the established site's photo and its "Surface:" credit) |
| `wx-site-feed` (refNA) | `#/earth/meteor` + `wx=feed`, both feeds served | seek 3, wait 300 ms (the feeds land), scroll the panel to its foot, seek 3.1 (the week from the forecast, the best months) |
| `wx-site-local` (refNA) | `#/earth/dryvalleys` + `wx=feed`, the Dry Valleys' feeds served | as `wx-site-feed`; the first day Mon 5 Oct, the place's today at UTC+13 (asserted) |
| `wx-site-loading`, `wx-site-fail` (refNA) | `#/earth/meteor` + `wx=feed`, both feeds held; refused (404) | seek 3, scroll to the foot, seek 3.1 (the pulsing placeholders: asserted; Loading…); seek 3, wait 300 ms, scroll, seek 3.1 (the sample days, Not available) |
| `book-listing-wx-loading` (refNA) | `…/@34.6750,-105.0750/book` + `wx=feed`, the climatology held | seek 3, scroll to the foot, seek 3.1 (Season "Loading…") |
| `book-plan-feed-none` (refNA) | `#/moon/haworth/compare/dryvalleys/book/plan` + `wx=feed`, the Dry Valleys' feeds served | seek 3, wait 300 ms, purpose EVA training, days 2 to 4, seek 3.1 (no good month: the caveat on every day) |
| book-feed: `book-listing-feed`, `book-plan-feed`, `-eva`, `-picked` (refNA) | `#/mars/jezero/compare/@34.6750,-105.0750/book` + `wx=feed`, both feeds served | seek 3, wait 300 ms, scroll to the foot (the Season from the climatology); tap Plan a campaign here, seek 3.5 (the forecast's days); purpose EVA training, seek 3.6 (marked again: two days asserted); days 2 to 6, seek 3.7 (the count and the off-season caveat) |
| `book-plan-wx-loading`, `book-plan-wx-fail` (refNA) | `…/@34.6750,-105.0750/book/plan` + `wx=feed`, the forecast held; refused (404) | seek 3, scroll to the days, day 2, seek 3.1 (loading: asserted); seek 3, wait 300 ms, seek 3.1 (the sample days) |
| grid: `grid-mars`, `grid-mars-done`, `grid-mars-foot`, `grid-switch` (refNA) | `#/mars/sites` | seek 3 (named cards filled, Arcadia reading, two waiting); seek 21 (all filled); scroll `#grid`, seek 21.1 (notes, credits); scroll to `.gh`, tap Moon in the world switch, seek 23 |
| `grid-wait`, `grid-moon` (refNA) | `#/mars/sites`; `#/moon/sites` | seek 3, scroll `#grid` to Meridiani's card, seek 3.1 (waiting its turn); seek 3 (south-pole cards with their established sites, Rima Hadley's note and banner) |
| `grid-warming`, `grid-empty`, `grid-noimage`, `grid-fail` (refNA) | `#/mars/sites` + `mock=warming`, `empty`, `noimage`, `fail` | seek 3 (starting up); seek 3 (no close analog, as a lede); seek 4 (the doubles' dashed placeholders); seek 19.5 (every search failed: the box with Try again, each card's line by the code) |
| grid-open: `grid-open`, `grid-dive` (refNA) | `#/mars` | seek 2.5, tap the panel's grid link, seek 2.8 (fading in, the focus on its heading: asserted); seek 4, tap Jezero's card, seek 4.3 (the dive as the grid fades) |
| grid-return: `grid-site`, `grid-return` (refNA) | `#/mars/sites` | seek 3, tap Jezero's card, seek 6.5 (crumbs and back button name the grid, the focus on the site's heading: asserted); Esc, seek 9 (the grid shown, the focus on its heading: asserted) |
| `grid-system`, `grid-back` (refNA) | `#/system`; `#/moon/sites` | tap the Featured sites cue, seek 4.5 (the focus on the grid's heading: asserted); Esc at 3 s, seek 4.2 (the globe, the grid hidden, the focus on the panel's heading: asserted) |
| sheet: `sheet-half`, `sheet-peek`, `sheet-full`, `sheet-keys`, `sheet-flick` (refNA, phone only) | `#/mars/jezero` | seek 3 (the grip on screen: asserted); touch the grip 350 px down, held, seek 4.2 (peek: asserted by its label); flick it 700 px up, seek 5.4 (full); click it, End, ArrowDown, seek 7 (half, the focus on the grip: asserted); flick 120 px down, seek 8.5 (on to peek) |
| `sheet-rm` (refNA, phone only) | `#/mars/jezero`, reduced motion | seek 3, touch the grip down, held, seek 3.02 (already at peek) |
| sheet-compare: `compare-phone-half`, `-peek`, `-globe`, `-pinch`, `-overlay` (refNA, phone only) | `#/mars/jezero/compare/salda` | seek 3 (stacked, at half); grip down, seek 4.2 (peek); tap Globe, seek 7; two fingers on Earth spread to 150 px and turned 30°, seek 7.5; tap Overlay, seek 10 |
| pinch: `pinch-terrain`, `orbit-terrain` (refNA, phone only) | `#/mars/jezero` | seek 3, two fingers on the block spread to 180 px and turned 45°, seek 3.5; two fingers 60 px down together, held, seek 4 |
| `pinch-globe`, `touch-pin` (refNA, phone only) | `#/mars` | seek 2.5, two fingers on the globe spread to 170 px and turned −30°, seek 3 (no pin: asserted); a one-finger touch on the globe, seek 3.3 (the detection frame) |
| `sheet-swipe` (refNA, phone only) | `#/mars/jezero` | seek 3, the grip down to peek, seek 4.2; a slow swipe 250 px up from "‹ Mars", seek 5.2 (half, still on the site: asserted) |
| `sheet-body-peek`, `orbit-globe` (refNA, phone only) | `#/mars` | seek 2.5, the grip down to peek, seek 4 (asserted); seek 2.5, two fingers 80 px down together on the globe, held, seek 3 (no pin: asserted) |
| `compare-phone-full` (refNA, phone only) | `#/mars/jezero/compare/salda/globe` | seek 3, the grip flicked 700 px up, seek 4.2 (full, `#ui` hidden with Search this area inheriting it: asserted) |
| `sheet-peek-scrolled` (refNA, phone only) | `#/mars/jezero` | seek 3.5, scroll the panel to the results, seek 3.6; the grip down to peek, held, seek 4.8 (peek, "‹ Mars" and the heading on screen: asserted) |
| peek-area: `compare-phone-peek-scrolled`, `compare-phone-peek-area` (refNA, phone only) | `#/mars/jezero/compare/salda/globe` | seek 3, scroll the panel to its foot, seek 3.1; the grip down to peek, held, seek 4.3 (the Globe button and back link on screen: asserted); tap `#area`, seek 5.5 (the area on, the Globe button on screen: asserted) |

**Reference baselines** (2026-10-19): 76/76 states at both viewports (80/80 since stage 3 added `site-moon-malapert` and
`coord-moon-pole`), checked by eye: intro lines and frame, sunrise
frames all distinct (glare, limb, camera pull-out, wordmark bars), title, all four carousel steps, system with three
worlds and the sun, info sheet up and closed, Beyond, Mars and Moon with HUD and graticule, 10° grid when zoomed, preview
pin and parse error, dive grade with the dot, Jezero, polar Moon pin, Haughton, compare terrains and globes, the
WebGL message. **Reference quirks** seen in the baselines (not harness faults): refNA states show the plain view
(`?mock` is ignored; pins already show terrain at 3 s); `sunrise-9s` shows the intro box shrinking (scale .93) over the
limb, i.e. the visible cut the plan's "intro to title" row removes; on the phone the intro frame is wider than the
viewport (corner label clipped) and "Skip intro" overlaps the velocity readout; zoomed on the phone, the longitude tape
slides under the top bar (known Should bug); the footer carousel runs on GSAP's global clock, not from when the footer
appears; `dive-0.8s` tap lands at 4.85° S 168.2° E on desktop (wherever the globe centre is at 2.5 s sim time).

## Decisions

The plan's eight open decisions, each taken at its lean (2026-10-19), and later decisions of the port:

1. **South pole:** took the lean: ask the engine for LOLA south-polar DEMs at the merge. Until then the frontend shows the
   four Artemis regions with frontend terrain and a "no elevation data" note, and the mock returns `422 no_dem` for Moon pins beyond 60°.
2. **Names for Earth doubles:** took the lean: names come from the engine side at the merge. The frontend shows country
   and coordinates now, plus a tag when a result cell falls inside one of the 14 established analog sites.
3. **3D terrain source:** took the lean: the engine endpoint. Finding: the engine's `server.py` already implements
   `GET /api/v1/elevation/{target/{body}/{name} | point/{body}?lat=&lon= | site/{cell}}` (spec §3.7). The data seam
   consumes that shape; the mock synthesises it (94 × 94 at 200 m) until the merge.
4. **Booking flow depth:** took the lean: listing → request → review → confirmation. My campaigns stays a stretch item.
   (Done as Stretch 5, Decisions 191.)
5. **Logo:** took the lean: separate chat. The current mark stays as a placeholder; every variant (favicon, top bar, lockup,
   info sheet, carousel step 1) will be generated from one source and must survive dithering at ~150 dots. Amended by
   81: the chat hadn't delivered by Must 7, so an in-house stand-in now fills that one source.
6. **Beyond imagery:** took the lean: dithered spacecraft images in the footer's dot style (Should item).
7. **Demo conditions:** took the lean: demo on named targets (cache, ms) and pins run beforehand; server kept warm and
   online. The frontend's warming state and pin progress state cover the rest.
8. **Rotation while a site is selected:** took the lean: keep bodies turning at the time rate, with the camera tracking
   the site. Applied after visual parity is reached (parity captures need the prototype's hold behaviour first); logged
   as a deliberate deviation from the reference when it lands. It hadn't landed by the end of the must list (holistic
   review fixes, finding 2); now it has, drawn in the body's own frame: a held body (compare globes, the coordinate
   preview, a pin's held frame, a dive's orient phase) keeps its site where the hold put it, its light follows the sim
   clock (the real subsolar point, already so), and its viewport's stars wheel the other way about its axis at the
   rate it would spin (`scene/frame.ts`, `Viewport.starQ`). That is exactly the frame a camera turning with the body
   sees. Not by letting the body spin and orbiting the camera rig: the hold is what the orientation tweens, the dive
   (`faceSite` returns the orientation it builds on), the markers and the drag are built on, and a rig moved every
   frame would fight the slingshot's tween of the same vectors. Live views only, nothing under reduced motion.
9. **Late textures** (stage 5): the start gate waits for every texture to load or fail, but outside `?capture` no longer
   than 7 s; fonts are always waited for. Without a ceiling no texture could ever land after start (so `onAsset`, which
   the Must bug asks for, would only ever see fonts), and one stalled request would hold a black screen. Unlike the
   reference's 7 s start, everything drawn from a late texture is now redrawn when it lands. The static first-paint
   frame (Must 9) covers the wait visually. Round 1: the font half got the same 7 s ceiling outside `?capture` (a font
   that lands later is re-measured through `onAsset('font')`), and a face that fails no longer rejects the gate.

10. **Featured targets by IAU name** (Must 3): a featured site carries `iau` when the IAU feature's centre lies within
   ~20 km of the featured point (the engine compares an 18.8 km window around the centre): Jezero (6.3 km), Gale (2.0),
   Utopia Planitia (2.3), Rima Hadley (18.2), Taurus Littrow Valley (3.7). Arcadia (186 km), Meridiani (181 km) and
   Elysium (1,133 km) would match a different place by name, so they search by coordinates (6 s, `remote`); the polar
   Moon sites aren't in the engine's store (no Moon data beyond 60°) and get `no_dem`. Must 4 ("featured sites by IAU
   name") may move those featured points to the IAU centres instead (it didn't: Decisions 39). The compare window of a
   named target is centred and labelled on the IAU centre, where the engine compares (Decisions 33).
11. **Earth doubles in routes** (Must 3): a search result is addressed as an Earth pin, `compare/@lat,lon` (4 dp of the
   cell's centre), not by `earth_cell_<n>`: deep links stay synchronous (the engine has no cell endpoint to resolve an
   id), and the established-site ids (`compare/salda`, from Rehearses) keep working beside them.
12. **Default search** (Must 3): purpose `rover_mobility` (the plan's default) and k 5 (the spec's default view) until
   the purpose picker and "show more" (Must 4); one search per site, kept for the session (pins: the 12 most recent).
13. **Mock latencies on the app clock** (Must 3): the mock waits on `gsap.delayedCall`, so `?capture` is deterministic
   and the latencies match the spec's under seeks; tests inject fake timers.
14. **Mock filters** (review fixes): a hard mask over the mock's 19 cells, as the engine's `mask()`: never a cell
   outside the filters, fewer or no results when few or none pass (finding 1's second option). Wrong results would
   mislead a demo; an empty list with its copy is honest.
15. **Detection frame readout** (review fixes): "Matching / Earth sites" without a count (the index size belongs to
   `/health`, and the frame shows for 1.3 s), or "No elevation data" when the site's search answered no_dem.
16. **Doubles without elevation data** (review fixes, round 2): when a featured site's search answers no_dem (the
   Artemis regions), its curated established analog sites (`Site.doubles`) stand in under the no-data note, unscored
   and in their curated order, with Compare on the first (the established-site compare from Rehearses). Plan gap 2
   asks only for the note; removing the compare path cost the challenge's own sites their demo. On the globe compare
   they are the Earth markers; a polar site's marker compares it with its first one once its search has answered (a
   search not yet asked opens the site, as for any coordinate search). Pins beyond 60° have no curated sites: the
   note alone.

17. **Result detail on the compare view** (Must 4 part 1): a card opens the compare route with that cell as the double
   (as the rows did), and the compare panel shows the result's detail between the minis and the table. No new route:
   compare is already the one-double page (side by side, deep-linkable), and part 2's twins belong there too. A compare
   whose double is no result (an established site from Rehearses) shows no detail.
18. **Capability banner without a percentage** (Must 4 part 1): spec §5.2's "{p_target_top3:.0%} of targets" is shown
   as a count, `round(p × n)` of the n tested ("9 of the 17"), to keep "no percentages anywhere"; same numbers.
19. **Card chips** (Must 4 part 1): the two best-scored properties, then the weakest of the rest (gap, then not
   measurable, then partial), so a card never shows only the good side; the detail lists all six.
20. **Mock hillshades** (Must 4 part 1): drawn in the browser from the mock's elevation for the image's window
   (`imageOf`), lit from the north-west like the engine's, landing at the engine's site-image latency (2 s the first
   time). The plan's deviation note for Must 3 asked for this.
21. **Show more** (Must 4 part 1): a second search with k 20 replaces the first; the five stay on screen until it lands
   (the mock keeps the first ranks; the engine is deterministic). A failure shows the error and Try again asks for 20.
   Review fixes: the five stay through a failure and its retry; a compare of a double past the five asks for the 20.
22. **Aridity bands** (review fixes): the spec's three (< 0.05 hyper-arid, < 0.2 arid, < 0.5 semi-arid), then the UNEP
   classes the index comes from: < 0.65 dry sub-humid, else humid. The spec stops at semi-arid, but the engine also
   returns humid cells (the Rima Hadley fixture's Alaska cells); a band is needed for every value.
23. **Engine prose without percentages** (review fixes): "No percentages anywhere" covers engine text too. Percentages
   become fractions (`fractions`, lossless), a card shows `brief(summary)` (no place prefix, no landform mix), the
   detail the full summary with fractions. The verbatim strings aren't kept in the drawer: the fractions lose nothing,
   and the drawer would be the one place with a "%".
24. **Other doubles on compare** (review fixes): a skip link above the detail (only when there is one) rather than
   moving the list above the detail or the long sections under it: the prototype's order (pair, maps, table, list)
   stays, and the link is the standard pattern for keyboard and screen readers too. Instant scroll (a skip link).
25. **Mock scores that agree** (review fixes, round 2): the mock's derived results follow engine.py's rules rather
   than being independent draws: landform shape from rank (a match near the top), the judge falling with rank and the
   other five properties around it, the cosine from their mean, engine.py's close / partial / weak, and `?mock=empty`
   pulling every cosine under 0.80 (the engine's "No close analog" threshold) with the judge halved. Picking another
   double on compare starts its panel at the top with focus on the heading (the finding's first option): the pair and
   maps change too, so the top is where the new view begins.

26. **Mock elevation and hillshades from the frontend's terrain** (Must 4 part 2): the fixtures carry hillshade URLs,
   no image data, so the mock draws them; its elevation windows are the frontend's terrain of the same place (the
   featured site by IAU name or by its point, else a pin; an Earth cell's pin), resampled to the engine's 94 × 94, not
   value noise. Compare, its twins and the card thumbnails then show the same ground, and the merge swaps
   `data.elevation` only.
27. **Compare terrain while a window loads** (Must 4 part 2): the frontend's terrain of the window stands in until the
   engine's lands, then both the block and the scenes are rebuilt in place without the curtain (as when the search
   lands, and `onAsset`). Holding the curtain would blank the stage for 2–10 s; a curtain flash 2 s in was judged more
   jarring than the swap, which in the mock changes only the sampling. Earth by cell only: the engine has no Earth
   point endpoint, so an established site (Salda) keeps the frontend's terrain.
28. **Twins placement** (Must 4 part 2): above the result's detail, under the minis (spec §7.6 lists the side-by-side
   hillshades first in the detail). A coordinate target has no target image: its twin is drawn in the browser from
   the point window's elevation with the engine's lighting, rather than left empty.
29. **Earth pins on the globe** (Must 4 part 2): results are squares (their footprint) at the marker's size, since the
   true 18.8 km is under 2 px at globe scale; the established sites keep circles. The tag is a dot in the square plus
   the label's second line, not a label always shown: persistent labels covered the selected pin's label on desktop
   and ran off the phone's half-width viewport. The 14 established sites are the frontend's list (the engine has
   none; see "Results rework 2/4").
30. **Hillshades at their own contrast** (Must 4 part 2 review fixes): every hillshade the frontend draws is stretched
   to its own 2nd–98th percentile, the judge's view of the same windows (its matplotlib figures auto-normalise), rather
   than drawn at the compare's shared vertical exaggeration: the stretch also covers windows the compare doesn't show
   (cards) and needs no exaggeration from elsewhere. Round 2: the twins are drawn by the frontend in every mode
   (Decisions 34); only the cards' engine PNGs would need the engine's stretch.
31. **Earth pins, revised** (review fixes): the tag is a ring round the square (was a dot in it), the 14 established
   sites a faint layer of hollow circles under the doubles on the globe compare (out of the Tab order), and a label
   that doesn't fit right of its marker goes left, or under it. Supersedes Decisions 29's dot and "no layer".
32. **Two test modes** (review fixes): `?mock=noimage` (Earth cells answer 404 no_image) and `?mock=asengine` (the
   mock's windows and images labelled as the engine's) exist only so the capture can show the placeholder and the
   merge's copy; neither is on the demo path.
33. **Compare window centre** (review fixes, round 2): a named target's compare window is labelled and drawn around
   the target its search answered for (`res.target`, the IAU centre), not the featured point (Decisions 10: up to
   ~20 km apart). Taken from the search rather than a second `/targets/{body}/{name}` call or centres copied into
   `sites.ts`: the search is always asked on compare and is the engine's own statement of what it compared. The
   frontend's terrain there is the featured site's archetype sampled around that centre (one geography with the site
   view), not the archetype moved onto it.
34. **Twins drawn from elevation** (review fixes, round 2): both twins are hillshades the frontend draws from the two
   windows' elevation in every mode (supersedes Decisions 28's engine images and its coordinate-target special
   case), so the pair always shares one lighting and stretch and needs no engine change. The engine's PNGs serve the
   card thumbnails only.
35. **Marker labels off the other markers** (review fixes, round 2): right, left, under, above (under/above shifted
   inside the viewport), the first clear of every visible marker, else the one covering fewest. Supersedes Decisions
   31's flip-or-drop rule. Faint established-site circles count as markers: they are the key to the ring.
36. **Purpose and filters are session state** (Must 4 part 3): one query for every target site's search, kept for the
   session, not in the route; a reload or deep link searches with rover mobility and no filters. The plan asks for a
   picker and filters, not links that carry them; a deep link to a double found only under another query shows the
   compare without its detail (the double isn't one of that query's results). Put them in the hash if links must.
37. **The form's place and controls** (Must 4 part 3): above the doubles box, outside its live region (re-reading
   the form on every search landing would be noise), on the site and compare views; native `<select>`s for the
   purpose (8) and the country (the engine's 188), styled as the panel's inputs, because they bring keyboard and screen
   reader support for free; filters in a disclosure so the cards stay near the map. One country at a time (the
   request takes a list; a multi-select costs a custom widget for no demo gain).
38. **Search this area** (Must 4 part 3): a button on the Earth globe of the globe compare (the only Earth map shown
   beside a target), in its bottom-right corner; the area is the ground seen within 60° of face-on, cut at ±180°
   (the engine's bbox can't wrap). The area shows and clears in the filters on every view.
39. **Named targets as pins with a name** (Must 4 part 3): a picked IAU feature opens as a site at its IAU centre,
   `Name@lat,lon` (the name URL-encoded), so a deep link builds it synchronously like a pin, with no lookup; searched
   by name. A featured site carrying that IAU name opens instead. Featured points stay where they are (landing sites,
   the reference's views): the note in the doubles box names the IAU feature the search compared and its size, and
   compare already centres the window on the IAU centre (Decisions 33). Supersedes Decisions 10's "may move".
40. **The mock's target list** (Must 4 part 3): the engine's store without the lunar satellite craters (163 KB, 73 KB
   gzip, a lazy chunk) rather than all 10,100 (461 KB, 165 KB gzip) or names derived from the fixtures (autocomplete
   would find almost nothing). Typing a satellite crater's name ("Abulfeda Q") finds it in the engine, not the mock.
41. **Featured sites in the named-feature search** (part 3 review fixes): featured sites without an IAU name are matched
   by name in the frontend and listed first ("Featured site"), so the Artemis regions the engine can't list (beyond
   60°) are found by name; the Moon's no-match line states the 60° limit (spec §9, plan Gaps 2).
42. **Combobox options belong to one text** (part 3 review fixes): a new keystroke voids the options (arrows and Enter
   wait for the answer) but leaves the rows drawn, rather than closing the list on each keystroke (the finding's
   first option), which would collapse and reopen it under the typist every 150 ms.
43. **The surface box flips with the purpose** (part 3 review fixes): one box for the side the purpose doesn't search
   (vegetated land for barren purposes, barren only for education), dropped when a purpose change makes it redundant.
44. **The compare's 20 only under its opening query** (part 3 review fixes): remembered when the pair is opened (deep
   link, reload, a pick), not cleared on the first `asked()`, so switching the query back still finds the pair.
45. **The mock ranks per target and surface** (part 3 review fixes, round 2): as the engine caches (`api.py
   cache_key`), the purpose only picks the surface, so the six barren purposes share one ranking (purpose echoed);
   the other filters are a mask over it, each cell keeping its scores. An example heads the ranking of its target and
   surface whatever its filters, so the Rima Hadley example (EVA training, United States) now leads Rima Hadley's
   unfiltered doubles too (the finding's alternative, matching the filters as well, would let the US filter drop the
   unfiltered list's US cells, the inconsistency the findings are about). Seeded as the surface's default query, so
   every other unfiltered answer keeps its order and scores (checked against a dump of 22 searches before the change).
46. **A new query's search doesn't move the form** (part 3 review fixes, round 2, finding 4's "better still" plus its
   first option): the compare keeps the shown detail until the answer lands; while it runs the doubles box keeps its
   height (a panel scrolled to its end would otherwise clamp up); and whatever redraws above, the control just used
   is held where it was on screen (scroll compensation, rather than `scrollIntoView` 'nearest', which would still
   jump it to an edge).
47. **A pin's progress holds the frame on the globe** (Must 4 part 4): from the body view, a search by coordinates still
   running when the turn ends holds the detection frame on the globe, usable, and the dive waits for the answer (the
   plan's Verification row: "detection frame holds with progress while the globe stays usable"). Not the dive at once
   with progress over the terrain: there would be no globe to use or to pin again on. Only from the body view (and a
   held site): a deep link or a site-to-site move has no globe shown, so it swaps to terrain and the panel shows the
   progress. The answer starts the dive even mid-drag (the drag cuts the turn back to the site; known limit).
48. **A second pin cancels, not queues** (Must 4 part 4): the plan says one pin search at a time and leaves the choice
   open; spec §8 says queue them "if needed". The user has moved on to the new point, and a queue would spend the
   engine's 5–10 s on the old one first. Aborting is client-side (`AbortController`): the engine may finish the read
   anyway (merge note). Leaving a pin for another view doesn't abort it (nothing newer is waiting; it lands in the cache).
49. **Loading state from the request, not the answer's `source`** (Must 4 part 4): by name without filters is
   `cache`, with filters `live`, by coordinates `remote`, as spec §3.5's table defines them; `source` arrives with the
   answer, too late to pick a loading state. The cache case draws the skeleton behind a 0.4 s fade-in delay instead of
   drawing nothing, so a slow engine still shows it.
50. **Time-based progress** (Must 4 part 4): the engine streams nothing, so the bars fill on the app clock toward the
   spec's typical times (10 s for a pin, the upper bound; 40 s for a warm-up, from `/health`'s `uptime_s`) and stop at
   92%, without numbers or stages. Staged copy ("Measuring its landforms…") would claim steps the client can't see.
51. **One state box** (Must 4 part 4): waits, failures and no elevation data share the capability banner's look
   (surface-2, line-2, 10 px radius) with a 14 px head, the fine line and the buttons inside, so every state of the
   search reads the same; the no-close-analog lede stays a lede above the cards (spec §5.3: prominent, and the cards
   are still the answer).
52. **Any search still running when the turn ends holds the frame** (part 4 review fixes, findings 3 and 5): not only a
   pin's. A name from the cache (2–25 ms) or with filters (~0.3 s) has answered by then and dives at once, as before;
   one that hasn't (a slow or cold engine, `?mock=slow`) holds on the globe with "Searching Earth", which is what the
   plan's "Loading holds the frame" asks. No bar for it: a name has no expected duration to fill toward.
53. **Warming from boot, in the status bar** (part 4 review fixes, finding 8): `/health` is polled from the start while
   it says warming_up, and the status bar's left slot says "Search engine starting up…" on the body, site and compare
   views (where searches start); on a phone, which hides the status bar, that line alone shows above the sheet. Not a
   top-bar chip: the phone's bar has no room beside the brand, rates and clock.
54. **A pin's search in the status bar** (part 4 review fixes, round 2; amends 47's "the panel shows the progress"): once
   the terrain shows (a deep link, a pin moved on the site view), the status bar's left slot says "Reading Mars
   terrain…" with the warming line's dot until the answer, since the panel's box is below the fold there. The status
   bar, not the frame's Matching readout over the terrain (the Should row "play the frame on every site entry"): the
   line already exists for warming, shows above the sheet on phones, and costs no new overlay. Not during the hold on
   the globe, where the frame's readout says the same thing.

55. **Globe maps at 4K** (Must 5): 4096 × 2048 colour, 2048 × 1024 elevation, as before. 8K RGBA with mipmaps is
   ~170 MB of GPU memory per map, so three would break the 300 MB budget on their own; the 8K step belongs to the
   Should item Progressive textures.
56. **Colour matched to the prototype** (Must 5): the real mosaics are stretched to the prototype maps' mean and spread
   (Mars per channel, the Moon in grey with its tint), so the shaders tuned on them keep their look and Mars keeps the
   design system's orange. The ground is the real one; only the tone curve is ours. Logged in `docs/credits.md`.
57. **The Moon's map is the LROC WAC morphologic mosaic** (Must 5): the plan's "LROC WAC global mosaic". Its large sun
   angles show relief more than albedo, so the maria read weaker than on the prototype's map. The albedo products
   (NASA SVS's LROC colour kit, unreachable when fetched; LROC's 643 nm normalised tiles, 700 MB at 64 px/°) were not
   used; revisit with Progressive textures if the near side should read darker.
58. **Real elevation as patches in the site projection** (Must 5): the plan asks for 16-bit PNG or float32 tiles; the
   patches are raw 16-bit heights in one file, each scaled to its own range (canvas decodes PNG to 8 bits; float32 is
   twice the size). `heights()` uses a patch wherever one holds the window, at most 4 times coarser than its samples, so
   every view and the mock's windows follow from one rule.
59. **Which places get patches** (Must 5): the featured sites on stage (Jezero, Gale, Hadley–Apennine, the four south-pole
   regions) and their compare windows, the engine's coordinates example, the 14 established Earth sites and the mock's
   19 Earth cells (every double the mock can show), and the lunar south polar cap (pins there, no banding).
60. **Crops** (Must 5): the seven featured sites get files (Mars from the MDIM colour mosaic, the Moon from LROC WAC
   global and south polar mosaics); everything else keeps the in-browser cut from the globe. CTX was not used for Mars:
   the crops run 0.6–9 km per pixel, where MDIM's 232 m is already finer than the crop; CTX belongs to a future
   close-up scale.
61. **Site data loading** (Must 5): beside the textures, holding the start only under `?capture`; landing late, it goes
   through `onAsset` like a late texture, and the mock's elevation waits for it so no window keeps the stand-in.
62. **The Moon's map: WAC detail over Clementine albedo** (Must 5 review fixes; amends 57): neither source alone is the
   prototype's Moon (WAC: relief without maria; Clementine 750 nm: albedo with seams, gaps and stripes). Their product,
   each over a ~0.5° blur, keeps WAC's craters and rays and Clementine's maria; poleward of 60–70° WAC alone. Tones by
   percentile match to the prototype map (a mean/spread stretch is skewed by the equirectangular poles' shadow).
63. **Earth crops from Landsat WELD 1999** (Must 5 review fixes): the plan's "NASA GIBS imagery". WELD (30 m) is the one
   cloud-free GIBS composite fine enough for Meteor Crater's 14 km crop; MODIS/VIIRS daily true colour has clouds, and
   Blue Marble on GIBS is snow-covered at Haughton. Blue Marble (500 m) only where WELD has no data, never both seas in
   one crop (a seam). The established sites only: pins and cells keep the globe cut (Known limits). Amended by the
   holistic review fixes: the mock's 19 Earth cells (the top doubles on the demo path) get the same crops; pins, and
   engine cells past the mock's, keep the globe cut.
64. **South-pole patches padded by a window** (Must 5 review fixes): the cap stays 1 km (500 m would be 2.9 MB); the
   four sites' patches grow at their own spacing instead, so pins near the stage sites stay on 240 m, labelled as such.
65. **Late site data re-renders the panel** (Must 5 review fixes; amends 61): rather than holding the start for 2.9 MB.
   The re-render keeps scroll and focus (same route, `swap`); open drawers close (once, in the first seconds).
66. **Polar crops keep their shadow black** (Must 5 review fixes): a curve of their own (black point 0, 99th percentile
   white, gamma 0.7); the Hadley crops keep the global mosaic's stretch.
67. **Pin patches for the stage sites, and the patch closest to the samples** (Must 5 review fixes, round 2; amends 58):
   a second, coarser patch per stage site (its extent plus a pin's terrain, at a pin's spacing) rather than padding the
   site's own patch (at Jezero's 0.31 km and Hadley's 0.16 km that costs more and covers less). With patches both finer
   and coarser than a view's samples, `patchFor` takes the coarsest no coarser than them (a finer patch point-sampled
   aliases), else the finest within 4 times. Side effect: an established Earth site's 18.8 km window at its centre now
   reads its window patch (the engine's averaging, 200 m) instead of the site's finer own patch.
68. **The Mars globe: MDIM detail over TES albedo** (Must 5 review fixes, round 2; amends 56 for Mars): MDIM alone keeps
   Viking's frost and haze (Hellas white); compressing its highlights would also flatten Tharsis and Arabia. TES's
   albedo carries the large scale, MDIM the detail and (through the per-channel fit) the colour, the prototype map the
   tone statistics only (its pixels are of unknown licence, so none are used). The caps stay MDIM's.

69. **Booking routes under the compare's** (Must 6): `…/compare/<double>[/globe]/book[/plan|/review|/done]`, not the
   task's example `#/earth/<double>/book`. The listing is derived from the search result, which only the target's search
   gives (an Earth pin is no site view, Decisions 11), the target and purpose travel with the route, and the stage stays
   the pair being tested. The listing's own route is `/book` (`/book/listing` and an unknown step parse to it).
70. **Established sites can be booked too** (Must 6): an established analog site as the double (Rehearses, the Artemis
   regions' known analog sites, Decisions 16) gets a listing from its place alone: name and known analog from
   `establishedAt`, seeded practical values, sovereign "—", access Unknown (with its permits copy), no surface or climate
   (no engine cell there). Without it the challenge's south-pole sites couldn't plan a campaign. A pin the current
   search doesn't return gets a box back to the comparison, not a listing from coordinates alone.
71. **Indicative cost beside the listing, not in it** (Must 6): `site_listing.json` has no cost and allows no extra
   properties, so `dayRate(listing)` derives US$ per person-day from its access block (150 + 15 per hour from the
   airport + 2 per km to the road, high ×1.4, to US$ 10) and the review multiplies it by team and days. Field costs
   only, "not a quote".
72. **Dates as day buttons on a 14-day window** (Must 6): the plan asks for dates picked on the weather window, and the
   forecast feed it waits for (Should) covers about 16 days. The window starts tomorrow by the wall clock (`wallNow`: the
   capture epoch under `?capture`), not sim time, which runs at ×600, and is fixed when the plan starts. First click a
   one-day campaign, a later day ends it, any other click starts again (`pickDay`). Native date inputs were the
   alternative: they don't show the window. Campaigns further out read the listing's best months.
73. **Checked on Review** (Must 6): errors computed on submit, shown under their fields, focus to the first; an error
   goes as soon as its field is right (in place), new ones wait for the next Review. The team field is text with
   `inputmode="numeric"`: a number input reports "abc" as empty, so the message would be wrong.
74. **Plans and requests in memory** (Must 6): one plan per target and double for the page's life, like the query
   (Decisions 36); a reload of `/book/review` or `/book/done` says there is nothing to show and offers the plan. Not
   sessionStorage: a stored plan is input from outside the page and adds a trust boundary for no demo gain. The
   reference is `EID-<yymmdd>-<4 Crockford base-32 characters from the plan>`, deterministic (captures). (Storage
   superseded by Decisions 168: a lost context made the gain real; requests by 191.)
75. **The listing named as the app names cells** (Must 6): title the established site inside it, else its country (as
   the cards and the compare); the listing's own name ("Unnamed area in …", the engine's "Unnamed area near <place>") in
   the review and in sentences ("At an unnamed area in …").
76. **Entry on the compare** (Must 6): "Plan a test campaign here" as the compare's one primary button, in the jump row
   left of "Other doubles" (no new row when the double is a result), for a result of the current search or an
   established site.

77. **Established sites carry the engine's facts** (amends 70; Booking review fixes): `country` and `access` on the 14
   established Earth sites, read once from the engine's grid (`grid/cell_country.npz`, the cell nearest each site;
   sovereign = country for all 14), and the elevation at the centre of the site's window where its terrain is real.
   Static facts the frontend owns (plan: the 14 sites are frontend-owned), so the permits copy and access work on the
   south-pole path. Surface class and climate stay gaps (said so): they belong to engine cells, and copying the grid's
   climate would be engine data out of its result.
78. **One name per step chain** (amends 75): every step is headed by the double as the app labels it (crumbs, stage,
   compare pair: an established site's name, else a cell's country), the review's Site too; the listing's own name
   (the schema's nearest named place) opens the listing's lede and is used in sentences ("At an unnamed area in the
   United States of America"); "the" before country names that take it (`inCountry`). One date form: "Tue 6 Oct",
   "Tue 6 Oct 2026".
79. **Best months as a caveat** (Booking review fixes): days outside the listing's best months are allowed (the window
   is the next 14 days; refusing them would leave polar sites unbookable most of the year) and say so in the dates
   summary and the review, with the season note.
80. **The month on the day grid** (Booking review fixes): the first day and any first of a month show the month in
   place of the weekday letters (the full date stays in each day's label); a month row above the grid would not show
   where the month changes.
81. **Logo: an in-house stand-in, pending the logo chat** (Must 7, amends 5). The logo chat hasn't delivered, so the
   frontend drew its own mark: a world (a solid disc in the text colour) and its double (a coral ring of the same size)
   offset behind it, parted by a gap: "eidolon", a phantom double. Geometric and solid (no stroke under 2.5 of 48
   units), so it reads as a 16 px favicon and as dots at ~150 across. It is a stand-in, not the brand: when the logo
   chat delivers, its mark replaces `src/brand/logo.svg` and nothing else changes (see "Logo (Must 7)", Swapping).
82. **The title wordmark stays** (Must 7): the stand-in carries no lettering, so the coral bars wordmark and its reveal
   stay as they are, and every placement keeps "Eidolon" in Newsreader beside the mark. A final logo with its own
   lettering would decide this again (the placements would then drop their text).
83. **Purposes in Eidolon's words** (Must 8): the picker, its description line and the booking plan show a frontend
   label and line per engine purpose key (`ui/results.ts` `PURPOSES`); a key the frontend doesn't know shows the
   engine's own label and description. The engine's strings named an experiment path and used slashes; the plan puts
   purposes in the copy pass. The keys, `supported` and `surface` stay the engine's (the spec wins on data).
84. **The tagline** (Must 8; review fixes): "The Moon and Mars, on Earth" replaces "Every target has a double" (carousel
   step 1, info-sheet foot): some targets have no close analog, and the south-pole regions none yet. The pass's first
   "Earth doubles for the Moon and Mars" (35 characters) wrapped on phones in 11 px tracked caps; the tagline is 27,
   the length of step 4's caption, so both lines hold one line each at 360 px and up, as the reference's did.
85. **Where the tested line goes** (Must 8): under every result list (site and compare) and in the info sheet's third
   step, verbatim; the build fails without it in either the page or the JS (review fixes: checked apart).
86. **One name for the 14 sites, and the worlds' labels** (Must 8 review fixes): "established analog sites" everywhere
   (Earth's world label, carousel step 2, the system status bar, the Earth view, the no-data list head "Established
   analog sites on Earth", the fallback); the Moon's world label "Artemis base regions" (no "pin anywhere": matching
   stops at 60°; 115 px, the reference label's width, so it clears the phone's right edge, where "Base regions, Apollo
   sites" ran to it) and Mars' "Landing sites, pin anywhere", both in `BODIES[…].sub` (Earth's was already; the Moon
   and Mars ones were unused).
87. **The Moon's 60° limit beside every promise of a ranking** (Must 8 review fixes): the credits footer ("On the Moon,
   matching reaches 60° from the equator for now.") and the info sheet's Find its doubles step, which takes the
   sentence from the Data fine print (said once, where the ranking is). The footer asks for "a site on the Moon or
   Mars" (the intro, blurb and info sheet keep the lead with Moon bases). A no-data pin's doubles head is "Earth
   doubles" (no "closest" where nothing is matched).

88. **AgX, then the grounds** (Must 9): the plan's AgX, at exposure .9 with a saturation grade of 1.1 (fitted to the
   port's planet colours: AgX's path to white desaturates), and the grounds the CSS drew (stage, title, the dive's sky)
   laid after the tone map, under what the bodies leave uncovered, so their token colours stay exact. Tried and
   dropped: Khronos Neutral (keeps the tokens' glows saturated, but its toe crushed Mars' blue channel to near 0).
89. **Terrain skips the tone map** (Must 9): the terrain viewports render after the finish, so the elevation ramps are
   the design tokens as authored; their shading runs on the sRGB values, as before, and decodes once at the end.
90. **Beyond keeps its CSS ground** (Must 9): Beyond is an opaque page in front of the stage, which stops rendering
   under it; its ground can't be hidden by the opaque canvas, so moving it into the scene would only cost a frame.
91. **The detection grade moves into the pipeline** (Must 9): the duotone is applied in the finish, after the tone
   map, over what the bodies cover (alpha), so its --grade-* palette survives AgX; still one palette per body (the
   Should row's per-site palette isn't done).
92. **Exaggerated, hazed-down atmospheres** (Must 9): scale heights of 2 % (Earth) and 1.5 % (Mars) of the radius,
   some ten times real, so the limb reads at globe scale and the intro's sky spans the frame; the haze over the disc
   turned down away from the limb (`discK`); parameters tuned with a JS model of the shader against the reference's
   intro gradient (pure Rayleigh plus a trace of Mie matched it within a few grey levels). The design tokens' thin edge
   stays as the planet's fresnel rim.
93. **The intro's camera sits above the dense air** (Must 9): six scale heights up, so the sky darkens to space at the
   top, with the horizon on screen (a camera inside the air washed the frame out); the telemetry's dark bottom
   corners sit on the horizon's glow, as they sat on the gradient.
94. **A polar cap for the Moon's south pole only** (Must 9): every south-pole site is there; the other poles fade
   their bump out instead (no site depends on them). Slopes are baked as a normal map rather than heights: 8-bit
   heights over the cap's ±8 km band at 1 km pixels.
95. **The lens flare is the title sun's** (Must 9): the system sun sits at the frame's edge, where ghosts would cross
   the heading; it gets its bloom only.
96. **The phone path** (Must 9): `LITE` = a coarse pointer at up to 1024 px, decided once at load: fewer atmosphere
   samples and bloom levels, no SMAA. Desktop windows of any size keep the full path.
97. **Glows as light** (Must 9): every additive sprite authored over the old sRGB grounds has its texture alpha and
   opacity raised to 2.2 (`asLight`, `lin`), which keeps its look in linear light; stars decode the same way.
98. **The first paint is CSS** (Must 9): a static frame of the title drawn in `index.html` (ground, lockup, wordmark, a
   drawn globe and sun), not a screenshot: no extra request, crisp at any size; it fades into the intro (or a deep
   link's view) at the first frame. (Review fixes: two frames, Decisions 103. It needs no script and none of the app's
   CSS, but in production first paint still waits on the two stylesheets in the head, the app's and Google Fonts'; the
   earlier "paints before any stylesheet" was wrong. Must 10 measures it.)
99. **The title sun stays above the limb** (Must 9 review fixes): its scene path (a lerp by dawn from under the intro's
   horizon to the title's upper-left limb) passes behind Earth while the camera pulls back, so it rose, set and rose.
   Seen from the camera it is now kept at least 1.6 disc radii above Earth's limb once the dawn starts (`placeSun`,
   `scene/frame.ts`), on the path's side of the disc turned toward the frame's top early in the move (a narrow frame
   cut the path's side off), and the path takes over near the title (unchanged end frame). Chosen over retiming the
   dawn against the slingshot: no timing keeps a sun 1.3 R from Earth in view from a camera that swings over the top.
   The flare's streak fades while the sun is within about a radius of the limb (it read as a second horizon).
100. **The dawn's light leads the camera** (review fixes): the light's blend from the intro's backlight to the title's
   light takes a cubic ease out of `G.dawn`, so the terminator sweeps over the disc as the pull-back shows it; the
   camera's move keeps the plan's power2.inOut.
101. **Night lights, lights only** (review fixes): the Black Marble map's moonlit blue base, tinted warm, read as a
   purple smear up close (the 10 s frame); the planet shader keeps a pixel by its luminance (smoothstep .02–.35), so
   cities stay and the base goes.
102. **The intro's horizon by frame shape** (review fixes): a wide frame's horizon curves below the bottom telemetry at
   the corners; a tall one's barely curves, so tall frames put it at ~2 % of the height (`limbPose`), and the dark
   corners sit on the glow at both sizes (values ~6:1, labels at .75 ~4:1; were 3.7:1 and 2.2:1 on phones).
103. **Two first-paint frames** (review fixes): on #/ the poster is the intro's first frame (Earth's air edge on: one
   CSS radial gradient by height above the horizon, concentric with the planet, which the fixed vertical field of view
   makes the same at any size), so it hands off to the intro with no visible change and doesn't give the wordmark
   reveal away; Earth is drawn from the intro's first frame (no fade under the poster). A deep link keeps the title
   frame, its globe and sun placed as in the title at each size. A two-line inline script picks the frame from the hash.
   The poster's lockup is an `<img>` of `logo.svg` (inlined as a data URI by the build), since the `#mark` sprite is
   filled by script. Its loading line is a `role="status"`; the rest is hidden from screen readers.
104. **One precompile for the pipeline** (review fixes): `precompile` (`scene/post.ts`) compiles the scene's programs
   with the composer's buffer bound (three keys a program on the output colour space; the canvas variants were being
   compiled and then compiled again on the first frame), for both atmosphere sides, then runs the composer once with no
   viewports for its own programs, all before the poster fades.
105. **Glows as half-float textures** (review fixes): `asLight` builds a half-float texture from the canvas gradient
   (colour decoded, alpha to 2.2); 8-bit alpha after the power kept a few levels in a glow's tail, which banded as
   rings; the last pass also dithers (±.5 of an 8-bit level) on every view. Without float colour buffers the composer
   falls back to 8-bit ones (warns; no HDR headroom) rather than a black page.
106. **Earth's thin edge as a screen-space line** (review fixes): N·V over its screen derivative is about twice the
   distance to the limb in pixels, so the rim is a ~2 px line at any globe size (the reference's shell line) over a
   soft fresnel, HDR on Earth (× 2.8) so it blooms a little; Mars and the Moon keep faint ones.
107. **Skip intro swells the sunrise's glare first** (review fixes, round 2): when Skip intro ends the brief before
   the sunrise, `playTitle(true)` tweens the glare from where it is to the sunrise's .75 over .7 s (`power2.in`, the
   intro's own swell compressed), then .75 → 1 over the move as before. Not 0 → 1 over the whole move (the other option
   offered): with that ease the sun stays dim for the first second and a half while the dawn already lights Earth, so
   the skip path would lose the sunrise. The natural path reaches `playTitle` at .75 exactly, so its swell is 0 s and
   its tweens are unchanged; reduced motion sets everything at once as before.
108. **A pixel budget, not a lower ratio cap** (Must 10): GPU memory over 300 MB came from the pipeline's buffers,
   which grow with buffer pixels, so the ratio is capped at √(2.5 M / window pixels) (never under 1) beside the cap of
   2 and the adaptive step-down. A flat cap of 1.5 on desktops (tried first) still went over in this Mac's full-screen
   window (306 MB at 2268 × 1290) and softened small windows and phones for nothing. Not dropping SMAA at high ratios
   (−19 MB at 2.5 M pixels, not enough alone, and the adaptive ratio can fall back to 1 where it's needed), nor the
   bloom's luminance target at half size (its first mip level would sample a coarser source: a wider bloom on the
   opening's sun, retuned in Must 9).
109. **Data maps in one or two channels** (Must 10): bump and gloss maps upload as R8, the cap's normal as RG8.
   Same values in the shader, a quarter or half the memory; the cheapest of the texture options (KTX2 needs an encoder
   this machine lacks and a transcoder on every device; 2K maps on phones is a Should row).
110. **How the budget is measured** (Must 10): GPU memory from the WebGL calls themselves (an init script in
   `scripts/perf.mjs`), not a `?capture` readout of `renderer.info`: it needs no app code, counts what three and
   postprocessing allocate behind the renderer (render targets, depth textures, mip chains) and catches frees. Frame
   rate on the real GPU through ANGLE Metal in headless Chromium (SwiftShader would measure the CPU), with vsync for
   the budget and without it for the headroom; GPU timer queries read nonsense on ANGLE Metal. First paint on the
   phone size with Fast 4G and 4× CPU, Google Fonts live (what production loads), medians of three cold loads. Fonts
   stay on Google Fonts and no more code is split: both measures are inside the budget.
111. **The start waits on the route's worlds** (Must 10 review fixes): the plan's "load each body's textures when it is
   first shown", at its cheapest. `tex(k)` creates an empty texture and `loadTextures(keys)` fetches; the start waits
   on the maps of the worlds the opening route shows (`routes.ts` `mapsOf`, as each view's `showOnly`), then fetches
   every other map and the site elevation at once, reported through `onAsset`. Not lazily per world: after #/ the next
   view is the system, all three worlds, a few seconds later; fetching on first show would put black globes there and
   pop them in, where loading behind the intro has them ready. The other maps don't wait for the site data or the
   reverse: they share the link after start. `?capture` waits on everything as before (deterministic frames).
   (Round 2: a site or compare route also waits on its elevation, and the rest loads by need in batches: Decisions 113.)
112. **Terrain generation stays on the main thread** (Must 10 review fixes): the plan's pitfall asks for a worker. A
   window takes 8–67 ms on this M3 (the reviewer's measure), so ~30–270 ms on a phone's 4× slower CPU; it runs once per
   site at the terrain swap, behind the closed curtain, so the cost is the curtain's .45 s fade-out starting that much
   further in (GSAP's lag smoothing only steps in past 500 ms), not a dropped frame in a moving view, and the budget's
   frame rates (system and body views) don't include it. A worker means an async swap and moving the elevation maps
   and patches to it; it goes with the phone terrain layouts (Should: Touch), where a real phone shows whether the
   hitch matters (the shortcut in `terrain/procedural.ts` says so).
113. **A site opens on its real terrain; the rest loads by need** (Must 10 review fixes, round 2): a site or compare
   route waits on the site elevation too (4.7 MB, one file), under the 7 s ceiling: the view opens on the terrain it
   keeps, at the cost of a later start (8.9 s on Fast 4G on #/mars/jezero, first paint unchanged). After start, one
   batch at a time, so the next one needed has the link: the three worlds' maps and the site elevation, a body view's
   sites first (its next step is a dive) and otherwise the worlds (the title and system lead to them), then Beyond's
   Venus and Mercury. Elevation landing after start rebuilds what reads it behind the curtain (the terrain swap's
   0.24 s in, 0.45 s out), panel credits and maps included, never a cut. Not per world on first show (Decisions 111
   still holds); not split into per-site files (the merge replaces them with the engine's windows).
114. **A world without its map draws in its mean colour** (Must 10 review fixes, round 2): the planet shader mixes
   the map with `BODIES[id].mean` by a `ready` uniform, 0 until the colour map (and the Moon's cap) land, then turned
   to 1 over .9 s (`power2.inOut`; at once before start and with reduced motion). The mean is the map's area-weighted
   sRGB average (Moon #93908B, Mars #985634, Earth #232C3A; the linear-light average reads grey on Earth, its ice
   outweighing the oceans), so the placeholder reads as that world, lit, with its relief, rim and graticule. Chosen
   over fading the world in (an empty system slot under its label, an empty globe under the body HUD) and over a
   low-resolution map first (the plan's Should: Progressive textures, more files and fetches). A map that fails keeps
   the placeholder for good. The mean is hard-coded beside the texture keys: recompute it if a globe map changes.
115. **A skip link to the doubles** (holistic review fixes): under a target site's lede, "Earth doubles", or
   "Searching Earth…" while its search has no answer, never a count (the count changes with Show more and filters,
   and a stale one would mislead). The `.back` style with compare's down chevron, not a primary button: the primary
   action stays "Compare with Earth doubles" at the head of the doubles, where the link lands. It reuses compare's
   `[data-jump]` handler (no glide, focus on the box, which announces the list).
116. **Crops keyed by value** (holistic review fixes): `cropOf` keys a crop by its centre to 4 dp and width to 0.1 km,
   not by float identity: a double's centre comes back through its route (`parsePinId` wraps the longitude), and
   -105.075 came back as -105.07499999999999. No two of the manifest's 80 crops share a key.
117. **Overlay compare as a ghost, not a morph** (Should 1): both blocks from the same camera in one viewport, the
   heavier solid and the lighter over it at its weight, depth cleared (its own depth first). Exact (1 − t)·target +
   t·Earth wherever both cover, one block alone at either end, two extra draws of a 94 × 94 mesh. Not a morph of the
   heights (the halfway terrain would exist nowhere and a still image would show neither); not two offscreen buffers
   composited (exact at the silhouettes too, but a second set of render targets for the one place they differ).
118. **One slider, in the compare toggle** (Should 1): it drives the 3D ghost and the panel's overlaid twins together
   (a second slider in the panel would be two controls for one value). Default 50, the point of the view; steps of 5.
   Its spoken value says "Lake Salda over Jezero Crater, at 50 percent" (the copy check reads a percent sign after a
   number as a score). The route carries the mode only.
119. **Terrain and overlay without a curtain** (Should 1): they draw the same two scenes, so switching tweens the split
   (1.1 s) and turns the ghost on or off: the Earth half narrows away as its block appears over the target's.
120. **The overlay legend as a row per world** (Overlay review fixes): dot, name, ramp and "min to max", in fixed columns
   (the name 36 px, the range 20 characters right-aligned) so the two ramps line up; the contour interval said per
   world in the line under them when they differ. Not two columns of the site legend side by side (as wide, no
   shorter on a phone), not the ramps alone (the range is what the legend says). On a phone the names go: the two
   captions right above carry the same dots and names.
121. **No ghost without both hillshades** (Overlay review fixes): when a twin shows its placeholder (no_image), the
   overlaid pair falls back to side by side and the note drops "Overlaid: …"; ghosting a "No hillshade" card over a
   relief shows nothing. Done in CSS (`.twins.ov:has(.ph)`), so it follows the placeholder whenever it lands.
122. **The overlay's slider stays reachable** (Overlay review fixes): on a phone the toggle sticks at the top of the
   sheet while the slider shows (only then: the plain toggle scrolls away as before); up to 879 px wide the slider
   wraps to its own row (the phone's rule), the width at which the one-row toggle (~472 px) no longer fits the stage
   beside the 360 px panel with a margin.
123. **The phone's overlay: a smaller block up-left, a two-row plate** (Overlay review fixes, round 2): on the sheet the
   one block draws at ~69 % (camera 1.45× as far) and ~40 px left (the camera steps 2.3 units right along its screen
   axis, so a drag keeps it there), below the two captions; the legend keeps its plate (the site view's) with its two
   rows and puts its contour line for screen readers only (visually hidden, as `#area .t`). Not the legend unplated
   below the block (the finding's other option): under two captions (~100 px) the 336 px of visible stage leaves no
   band for a ~105 px legend below a block wider than ~140 px. The plate clips the block's front corner at most, as the
   site view's does. The framing eases in with the split (the toggle).
124. **The site selector grid is a mode of the body view, `#/{mars|moon}/sites`** (Should 2): the plan's "beside the
   list": on a desktop the body panel with its Featured sites list stays beside it and the grid takes the globe's
   place; on a phone the sheet goes and the grid takes the screen, one card per row. Not a view of its own for both
   worlds (`#/sites`, like Beyond): no panel beside it, and the panel's target search and coordinates are the other
   half of picking a site. Reached from the body panel (a link under the lede, above the fold at both sizes), the
   system view (a Featured sites cue opposite Beyond, opening Mars, the demo's lead) and its own world switch; Earth
   has none (its sites aren't targets).
125. **A card's doubles are its site's own search** (Should 2): the head (three) of the five the site view shows, for
   the current purpose and filters, kept by the data seam, so card and site agree and opening a card asks nothing new.
   By coordinates one at a time in the grid's order while a grid shows (spec §8); no Show more on a card; a failure
   points to the site, whose Try again it has.
126. **Hillshades where the engine has none come from Eidolon's own elevation** (Should 2): the south-pole regions
   (no_dem) and the established analog sites (the engine serves Earth by cell) draw their windows from the real
   patches the site and compare views already show (LOLA polar DEM, Copernicus), said in the grid's foot and
   credited. Not a placeholder: four of the Moon's six cards would have none, and the cards' point is the terrain.
127. **Cards with a hillshade beside the name, doubles as rows** (Should 2): the target's hillshade (92 px) beside its
   name, kind and point; the doubles as the panel's rows with a 40 px hillshade, so a country like "United States of
   America" stays on one line. Not tiles (a third of a card is too narrow for country names), not a 16:9 banner (it
   would crop the window the search compared). Up to three columns.
128. **A grid row is a result card's head** (Site selector grid review fixes): rank and notes, country, the Earth point
   at 4 dp, the established-site tag and shape match, shared with the panel's cards (`cardHead`), beside a 48 px
   hillshade; the card's summary and chips stay on the site view (the card is the site's, its rows a glance). Above
   the rows, as on the site view: the IAU feature searched (under the card's point) and the capability banner.
129. **Back to the grid from a site opened on it** (review fixes): a flag beside the route (`state.fromGrid`), not in
   it, so a site's link stays one link and a deep link or reload goes back to the globe as before. Kept while on that
   site and its compare (and booking); a pin moved on the site view drops it.
130. **One failure box for the grid** (review fixes): shown only when every search of the world has failed (none
   answered, none running, none warming up; no_dem counts as an answer), keyed on the first failure's code, with Try
   again (asks the failed ones again, not no_dem). A card's own line names its failure by code and points to its
   site. Not a box per card: six of them would bury the cards.
131. **A missing hillshade shows the placeholder in its tile** (review fixes): `thumbs` puts `NO_SHADE` where the
   image was (a twin keeps its figure-wide one), so a missing tile reads apart from one loading (empty). In the 48 px
   rows the words are screen-reader only and the dashed edge says it. Applies to the panel's result cards too.
132. **A route's focus into a hidden panel waits for it** (Site selector grid review fixes, round 2): the panel stays
   `visibility: hidden` until `LAY.panel` passes .01 (off screen it stays out of the Tab order and the accessibility
   tree), so a focus asked while it's hidden is kept (`focusPanel`) and given on the frame that shows it, ~4 frames into
   the .9 s slide, only if the focus is still where it was when asked or fell to `<body>`: the grid's heading, focused
   right after, keeps it. Not: showing the panel at once on its way in (`frame()` would hide it again on the tween's
   first frames), nor one rAF later (too early, `LAY.panel` still under .01).
133. **The sheet's three snaps and its grip** (Should 3): peek 112 px plus the safe area (the grip, the back link and
   the heading; on compare the toggle), half the plan's 54 %, full up to the top bar. Dragged by a 24 px grip that
   sticks at the top of the sheet, not by its content: the content keeps the browser's scrolling, and a pointer can't
   take a pan over once the browser starts it (`pointercancel`); a drag that also scrolls would need touch events and
   our own scrolling. A release under .5 px/ms (or held still 100 ms) settles on the nearest snap, a faster one goes on
   to the next its way (`snapTo`, tested). The grip is a button (a tap, Enter or Space step it up and round; the
   arrows, Home and End too), labelled with where it is and where a tap takes it ("Panel at half height. Expand to
   full height"): screen readers on phones work a button reliably, not an ARIA separator's or slider's value. The snaps
   move with the info sheet's timings and eases (the plan's nearest move, a sheet), at once with reduced motion. A new
   panel (another route's) opens at half, the plan's height, so its content is in view; a compare mode or the same
   route keeps the snap.
134. **The viewports end at the sheet's top edge** (Should 3): the prototype's ended at 54 % of the stage under the top
   bar, 28 px under the sheet at half (7 to 49 px as the sheet moves), so a legend, or the lower of a stacked pair, sat
   partly under it. Now exactly above the sheet wherever it is (at least 1 px); the phone's legend sits 28 px from the
   bottom (56 from the old bottom: the same place at half), the overlay's block a tenth of the view lower (its target
   raised; the round-2 framing's place, below its two captions). At half a phone's globe draws ~8 % smaller, 14 px higher.
135. **Compare stacks on a phone; blocks framed beside their legends** (Should 3): the pair one above the other (the
   target first), not side by side: two 390 × 168 viewports at half (390 × 340 at peek) suit a block, its caption on one
   line and its legend, where 195 × 336 halves pulled each block back to under half the width. Each legend at its
   viewport's lower left, unplated (the empty side of the block's near corner at the default orbit), its contour and
   exaggeration line for screen readers as the overlay's (Decisions 123). In a wide viewport the block draws smaller
   (1.45× as far) and a tenth of the view to the right of it (`k2`); a lone block (the site's, the overlay's) as the
   overlay's was, to the left of its plate (`k1`, now also the site view's: its plate covered the block's right
   corner). The stacked globes as their blocks, smaller and right of their captions (at half a long name, "United
   States of America", ran into the globe). All ease with the viewport's shape (a taller one, the sheet at peek, frames
   the block or globe whole and centred) and with the split (the toggle eases between them).
136. **Two fingers** (Should 3): their spread zooms (the wheel's limits and its dive guard), their midpoint orbits as one
   finger does, a twist turns the block's bearing or the globe about the line of sight, all at once, with no inertia.
   The stage takes the pointerdowns, so a finger landing on a marker or label joins a pinch (the canvas captures it, so
   the marker gets no click); alone, its tap is the marker's. A third finger is ignored; one lifting leaves the other
   dragging on. No gesture library: pointer events and two pure functions.
137. **Terrain generation still on the main thread** (Should 3; Decisions 112 deferred it to this item): there is no
   real phone in this run, and under a 4× CPU throttle every SwiftShader frame is itself a 130–300 ms long task, so the
   swap's own cost can't be told apart in headless Chromium. The shortcut in `terrain/procedural.ts` now names a real
   phone showing the curtain holding as the trigger for the worker.
138. **A full sheet covers the stage** (Should 3): nothing renders under it (`sheetCovers`, as the grid and Beyond), and
   the stage's overlays hide (the top bar is 90 % opaque: the terrain legend showed through it).
139. **Gesture copy by the main pointer** (Touch review fixes): `(pointer: coarse)`, read once at load, picks "tap" and
   "pinch" over "click" and "scroll" in the visible hints (the body panel, the status line, the HUD, the map's caption),
   not both words in one line: a hybrid laptop with a fine main pointer reads the mouse's. The map's caption drops
   "Hover" on touch (no hover; the readout only flashes as a finger lands) rather than a touch readout.
140. **At peek the sheet's content drags it** (Touch review fixes): there only the back link and heading show, which a
   finger swipes up to raise the sheet; the content doesn't scroll at peek (`overflow: hidden`, `touch-action: none`),
   so the pointer stays the page's. The drag takes the pointer only once it moves 4 px: captured at the pointerdown, the
   tap's click would go to the panel, not the back link. Half and full keep native scrolling (Decisions 133).
141. **Peek takes in the overlay's slider** (Touch review fixes): peek is the grip, the toggle and the back link on
   compare; the overlay's slider wraps to a second row on a phone, so peek grows by that row while it shows (measured,
   `#mix`'s height), and a peeked sheet re-snaps when it comes or goes.
142. **The phone's framing, round 2** (Touch review fixes; amends 135): each stacked globe is drawn larger than its plain
   fit (0.95× as far) and 40 % of the half-width right, beside its caption: ~135 px across at half (the reference's side
   by side ~120 px) and clear of Search this area; side by side at half was the other option, but it would split the
   captions and the toggle's modes into two layouts. The lone block (site, overlay) steps 15 % left and a tenth up,
   clear of the plate; each block of the stacked pair a tenth lower, below its caption's line (which now carries the
   exaggeration).
143. **Peek is the sheet's top** (Touch review fixes, round 2): the content can't scroll at peek (Decisions 140), so
   going to peek scrolls the panel back to its top with the slide (its tween; at once with reduced motion), and the app
   doesn't scroll a peeked sheet (the purpose kept in place during a search, Search this area's row). Leaving peek
   doesn't restore the old offset: the sheet rises from the top peek showed, with no jump under the finger.
144. **Search this area on a phone** (Touch review fixes, round 2; amends 142): at the Earth viewport's lower left, just
   above the sheet; on Globe the globe and its pins' labels sit right of the caption, so that corner is empty (at the
   lower right the selected pin's label covered it). The area starts from the globe's centre on screen, not the view's,
   which a stacked globe sits right of.
145. **The purposes' weather limits** (Should 4): one table (`data/weather.ts` `LIMITS`) on four daily values: the
   strongest sustained wind at 10 m, the day's rain, the low and the high. Rules of thumb for planning, shown beside the
   days, not standards. The reasoning:
   - Wind. 11 m/s, where Beaufort force 6 starts (strong breeze, 10.8–13.8 m/s: large branches move, umbrellas are hard
     to use): blowing dust and sand start to cut what navigation cameras and lidar see, and small survey drones reach
     their rated limits (about 10–12 m/s). For rover mobility, astrobiology (sampling under blowing dust) and thermal
     testing (forced convection swamps a thermal balance). 9 m/s, under force 6 (force 5, fresh breeze, 8.0–10.7 m/s),
     for people on foot in suits or suit mock-ups (a backpack and visor catch the wind) and for public groups: EVA
     training, education. 14 m/s, where force 7 starts (near gale, 13.9 m/s: walking against the wind is hard), for
     rigged heavy kit, a drill mast or a shelter: drilling and ISRU, habitat operations.
   - Rain. 1 mm, the climatological threshold of a wet day (the ETCCDI indices' ≥1 mm): sampling, suits, the public and
     thermal readings stop (wet samples and suits, evaporative cooling). 2 mm for rover mobility: a shower dries off,
     more changes the ground's traction against a dry analogue. 5 mm for drilling (cuttings turn to mud). 10 mm for
     habitat operations: a shelter should stand weather, and only a heavy-rain day (ETCCDI's R10mm) stops set-up.
   - Heat, the day's high. 32 °C, about where the US National Weather Service's heat index reaches "extreme caution"
     (90 °F), for exertion in suits or mock-ups and for public groups; 40 °C (about NWS "danger", 103 °F) for crews
     outdoors otherwise; 45 °C for thermal testing, which goes looking for heat. The air temperature stands in for the
     heat index, which needs humidity.
   - Cold, the day's low. −20 °C, the low end of common lithium-ion cells' discharge rating, which rovers, drills and
     field instruments run on; −10 °C for suited crews (frostbite risk climbs fast with wind below it); 0 °C for
     education (frost, the public); −30 °C for habitat operations (a heated shelter is the point) and thermal testing.
   A purpose the engine adds later takes rover mobility's limits; polar lighting geometry (unsupported) can't be chosen.
146. **Both feeds from the browser; the sample under capture** (Should 4): both APIs send
   `Access-Control-Allow-Origin: *` (checked 2026-10-20), so both are fetched in the browser and no POWER precompute
   ships (the item's fallback was for a CORS block). Weather is frontend-owned in both data modes (plan, Data seam).
   Under `?capture`, which must stay deterministic, no feed is asked and the seeded sample days show; `?wx=feed` lets
   the harness answer the feeds from recorded responses (`serve`), so the real path has capture states. The sample
   keeps the pre-feed winds (the same seed), so earlier captures' bars hold; its rain and temperatures are seeded apart.
   `data/weather.ts` reads `?capture` from the address itself, not from `motion.ts`, so `data/booking.ts` stays
   importable in Node tests.
147. **Best months from the typical day** (Should 4; amended by its review fixes): a month counts when its typical
   day sits under the purpose's limits: its mean temperature less and plus half the mean daily range as the low and the
   high, and its mean wind and rain held in monthly terms. Wind: a day's strongest wind averaged 1.3–2.3 times its mean
   wind at five doubles (ERA5 daily, Open-Meteo's archive, 2016–2025: the Dry Valleys 1.3, Haughton 1.4, Pilbara 1.7,
   Lake Salda 1.9, Hanksville 2.3), so the mean ×1.5 stands for the days' strongest, toward the steady polar winds the
   demo path leans on (`shortcut:` in `bestMonths`). Rain: it falls on some days only; in months averaging 1.4–1.9 mm a
   day, 26–34 % of days had over 1 mm, so a month whose mean is twice the day's limit still keeps about two days in
   three under it: the mean is held to twice the limit. (Before: the means against the day's limits, which cost
   Haughton its Jul–Aug field season and never let wind bind.) POWER's `T2M_MAX`, `T2M_MIN` and `WS10M_MAX` are the period's extremes, not daily means, so they
   aren't used. In the booking flow the climatology's months replace the sample listing's `best_months` for the plan's
   purpose (the listing is frontend-owned; the plan's Placeholder-to-real row puts the best season on the climatology),
   with the source as its season note, and the off-season caveat names the purpose. Twelve months read "All year",
   nine to eleven "All year but …", none "None" (every day then off-season, its own caveat); a run of three or more by
   its ends ("Nov to May"). While the climatology loads the listing says "Loading…" and no caveat shows; without it the
   sample listing's months stay, said to be samples.
148. **Whose weather, from when, for which purpose** (Should 4): the Earth site view's week starts today by the wall
   clock (it read the sim date, which runs at 600×; a forecast is for real days) and is judged for the search's purpose
   (`query.purpose`: the site view has no picker, so its copy names the purpose). The booking plan's window starts
   tomorrow, as before, for the plan's purpose. The forecast is asked in the place's own time zone (`timezone=auto`), so
   each day is the site's calendar day; the app's day names stay plain dates. Review fixes: "today" is the place's own
   (`todayAt`: the wall clock shifted by the forecast's `utc_offset_seconds`), the day its forecast starts on, so east of
   UTC the week no longer opens on a day the forecast has passed; until the forecast lands the UTC date stands in (the
   loading and sample days). Places key at 0.01°, so an Earth pin's
   listing and its compare double share one ask.
149. **The weather redraws in place** (Should 4): every part drawn from the weather is marked `[data-wx]` (the site
   view's window, the plan's Dates fieldset, the review's facts, the listing's Season); when a feed lands, or the plan's
   purpose changes, those parts alone take a fresh render's, so the maps, crops, the rest of the form and the focus
   stay (a focused day keeps it: each has an id). Values show to one decimal, so a day just under a whole-number limit
   (10.7 m/s against 11) doesn't read as on it. Each day also carries its weather as a tooltip: a grey day says why.

150. **Surface photos: which, and what the slot says without one** (Should 5): photographs from NASA's Image and Video
   Library only (one official, searchable source whose images are free to use with credit; JPL's under its image use
   policy), taken on the ground, never an illustration (InSight's "on the surface" picture there is an artist's) or an
   orbital view (the crops already are). One per site, its best-known view where it reads at 100 px, else a landscape.
   The slot is square like the crops, so each photo is cut square at the script (`crop`), not by CSS; the whole picture
   is one click away on its page. Without one the slot says why, by case (`surfaceOf`), instead of the old "… aren't
   shown here.", which implied photos the app hid. Zhurong's images (CNSA) aren't openly licensed; ESA's PANGAEA photos
   of Lanzarote are CC BY-SA, left out for one licence across the set. The credit joins the strip's existing credit
   line ("Surface: …") rather than a caption under the 100 px square, where it wouldn't fit; the figcaption stays
   "Surface". `site_listing.media.thumbnail_url` stays unused (the schema has no credit for it; Merge notes).
   Review fixes: the sentences claim only what the app knows. An established Earth site without one says "No NASA
   field photograph of this site." ("No openly licensed…" was false: ESA's Lanzarote photos are), a pin or named target
   "No surface photograph on file for this point." (one may exist beside a landing site the app doesn't feature);
   Utopia has its own (`nophoto`, Decisions 151). Round 2: the other US landings too (Apollo 11, 12, 14, 16; Viking 1
   and 2, Pathfinder, Phoenix, Spirit; Opportunity at Endeavour), one photo each from the same library, so a landing
   site reached by IAU name or pin shows its photo; Zhurong, Chang'e and Luna stay out (not openly licensed). A
   photograph that doesn't load gives way to "The photograph couldn’t be loaded." in the slot's text box (its
   120–150-character alt text can't fit a 100 px square), the credit line still linking its page.
151. **Where a photo counts as the site's** (Should 5): on the Moon and Mars only where the lander, rover or crew stood
   inside the site's square (Perseverance about 8 km from Jezero's centre, Curiosity's landing about 52 km inside
   Gale's 180 km, Opportunity, InSight, Apollo 15 and 17 at the centre); so Utopia gets none (Viking 2 landed about
   680 km east, at 47.64° N, 134.29° E, which is 225.71° in the old west-positive system; Zhurong about 1,300 km
   south; round 1 wrongly made Viking 2 3,900 km by reading 225.71° W as 134° W), and its lede still names them. On
   Earth the established sites are named places ("Pilbara", "Death Valley"), so a photograph of the place counts; an
   Earth cell inside one (`establishedAt`, the results' tag) shows that site's. Review fixes: a pin or named target
   on the Moon or Mars inside a featured site's square (its terrain's extent in its map's projection,
   `photoAt` in `data/sites.ts`) shows that site's photograph too, as the Earth cell does: the site panel already
   counts the photo as the whole square's, so a pin 4 km from Perseverance's landing denying it read false. Utopia's
   slot says why in its own words, now "No photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south.", not
   the featured sites' "No lander, rover or crew has photographed this area.", which read against its lede. Round 2:
   a pin or named target whose 18.8 km window (the engine's, ±9.4 km) holds a landing's `at` shows that landing's
   photo, checked before the featured squares (the more specific photo wins; no landing lies in a featured square
   with a photo of its own). Endeavour's `at` is the crater's IAU centre, the view's subject: Opportunity stood on the
   rim about 10 km west, so a pin on Cape York itself gets none (a `shortcut:` comment in `photos.ts`): the list is
   one spot per landing, not every rover stop.

152. **Two tiers, 1K and 4K, for the colour maps only** (Should 6): the plan asks for the 8K maps "or the highest the
   performance budget allows". An 8K RGBA map with mips is 8192 · 4096 · 4 · 4/3 = 179 MB on the GPU; the walk's peak
   is already 287.6 MB of 300 with the three 4K maps (42.7 MB each), so 4K is the highest tier that fits, and it is
   the tier shipped since Must 5. The low tier is 1024 × 512: ~100 KB a world, about the detail a 470 px globe shows
   on a laptop at ratio 1; a 512 px tier would blur the body view. The data maps (height, night, gloss, the Moon's cap)
   are 66–296 KB, one tier each: a second would cost a request for little.
153. **Crossfade, not a hard swap** (Should 6): a hard swap at the same exposure was allowed, but a globe sharpening
   in one frame reads as a pop at body-view size; the shader mixes the two tiers over .9 s (the mean-colour fade's
   duration and ease), the low tier as its own texture for that time (5.6 MB, then disposed), so the peak memory never
   holds both for more than one world at a time.
154. **The indicator in the status bar, in the HUD's type** (Should 6): the bar is where background work already shows
   (a pin's search, the engine's warm-up), so the line takes the hints' place there for the few seconds the full maps
   take, in mono caps like the HUD's labels, grey, with the engine line's pulsing dot. No percentage: the image loader
   reports none, and a bar would ask for attention the line shouldn't. Screen readers skip it (aria-hidden): sharper
   maps change nothing they can use. Phones show it above the sheet on views with a sheet; not on the system view.
   (Review fixes: it shows only while a globe on screen is on its low tier, the route's own worlds, on the views that
   show a globe: body, system and globe compare; never over terrain or the site grid, where it hid the hint for the
   whole load. Decisions 158.)
155. **?capture: first tiers hold the start, full maps hold ready** (Should 6): so `__eidolon.ready` means the final
   resolution (every state as before, pixel for pixel on the globes) while the low tier stays reachable for its own
   states by holding the full maps (`noReady` and the new `until` step). Swaps under capture are instant, so no state
   depends on when a map landed.
156. **Elevation patches a file each, loaded when read** (Should 6): one file per patch rather than one per site, so a
   deep link loads exactly the patches its views read (a site's pin patch, 166–756 KB, only for pins) and the mock's
   windows only theirs; HTTP/2 makes 66 small files cheap. The start of a site or compare deep link waits on the
   patches of its site's terrain and compare window at its point (Decisions 113's "opens on the terrain it keeps", now
   for ~0.1 MB instead of 4.7 MB); everything else is by need, with the late path (curtain rebuild) when a read came
   first. No background prefetch: a click's patches (~90 KB for a featured site) land during the 1.35 s dive.
   (Review fixes: wrong on two counts. The compare window is read at the IAU centre, not the point, so the start now
   waits on that window's patch (Decisions 157); and the panel reads the site's terrain at the click, not after the
   dive, so a world's featured sites' patches load when it shows (Decisions 159).)
157. **A featured target's compare window sits on its IAU centre from the first frame** (Progressive textures review
   fixes): the five featured sites with an IAU name carry that feature's centre (`iauAt`, `data/sites.ts`, checked
   against `data/targets.json` by `real-sites.test.ts`), and `centreOf` falls back to it until the search reports the
   engine's own (Decisions 10 and 33: the engine compares there). Before, compare read the window at the featured point
   for the search's 20 ms and at the IAU centre after: two windows, two patches (6.6 km apart for Jezero, 18 km for
   Rima Hadley), and the start gate held only the first. One centre means the start waits on the patch compare keeps
   (`needSite(body, site, centreOf(...))`), the panel's maps and caption don't move at 20 ms, and a Gale compare deep
   link no longer loads the 756 KB pin patch its point's 94-sample window happened to pick. Not taken: the finding's
   optional `patchFor` fallback to a coarser loaded patch while the best one loads (the gate makes it moot on the deep
   links; elsewhere the late path redraws once).
158. **The loading line follows the globes on screen** (Progressive textures review fixes): `ui/chrome.ts mapsLine`,
   asked on every status update (each route, each second) and as each full map lands or fails (`app.ts onAsset`; a
   failed full map is reported as an asset event so what waited on it goes on with the low tier). On the views without a
   globe the hint stays and the phone shows no line, so the phone's legend offsets for the line went (only the pin
   search's and warm-up's lines lift the legends).
159. **A world's featured sites' patches load when it shows** (Progressive textures review fixes): from when the
   route's own full maps are in, and on every later route with a world (`app.ts nearSites`, `needSite` per featured
   site; each patch once): ~0.18 MB on Mars, ~0.9 MB on the Moon (its four polar sites), ~1.3 MB on Earth (14 sites),
   against the 4.7 MB the old prefetch loaded. A click from the body view then opens on real terrain; a click before
   they land still takes the late path.
160. **Cut crops wait for the full map; Beyond's repaint crossfades** (Progressive textures review fixes): a crop cut
   from a colour map (no file of its own: pins, a few featured sites) keeps its empty frame until the world's full map
   has landed or failed, as an image crop does while it loads, rather than show the low tier's smear (`drawCrop`,
   `sharpest`). Beyond's painted scenes have no empty state, so a repaint (a late texture, the Moon's full map) fades
   the new picture in over the old over .9 s, as the globes do.
161. **Late patches redraw only what changed** (Progressive textures review fixes): a batch of late patches rebuilds
   the cached terrains (`clearPinTerrain('')`, cheap: rebuilt when read) but redraws the panel and runs the curtain only
   when the site on show now reads real elevation it didn't (`app.ts shownSrc`, by source). A compare window still on
   its way is left to `fill()`, which redraws when it lands; before, the late batch's curtain followed that direct
   rebuild ~0.3 s later and changed nothing.
162. **Telemetry flash: news, not drift** (Should 7): the plan's motion table has no entry for it and the first brief
   isn't in the repo, so: coral (the HUD's accent already: the tape's pointer, the cursor's ring), full at the change
   and back to the readout's own colour over .6 s `power2.out`; only for a change after the reading held .5 s
   (`MOTION.flash`, `flashHold`), so per-frame drift never strobes and a 1 Hz tick (UTC, the countdown) flashes each
   time. Rejected: flashing every change (the HUD lit solid at ×600), at most once a second (a permanent 1 Hz pulse on
   six readouts at the default rate). Off under reduced motion. Scope: the globe HUD and the intro's telemetry, the
   two places the plan's type scale calls HUD and telemetry. (Narrowed by 163.)
163. **Telemetry flash: sim time's steady ticks are drift; the intro flashes its countdown** (Telemetry flash review
   fixes): the hold alone let the Moon's ~1.1 s ticks at ×600 count as news, a permanent pulse. On the globe HUD, the
   readouts sim time moves (sub-observer, sub-solar, sun elevation, local time) flash only at Live (real telemetry,
   ticks 24 s or more apart) or on an event (the HUD on, a body or rate picked, the cursor landing or leaving); rotation,
   time rate, the cursor and daylight keep the hold rule. Rejected: a longer hold for the globe HUD (the Moon's local
   time ticks every ~3 s, its sun elevation near noon slower still: any hold leaves a pulse). In the intro only the
   countdown (and the frame's counter, as lines arrive) flashes: UTC ticks half a second out of phase with it, and the
   bottom corners' dark text over the glow loses coral (~1.4:1). Scope grows by one readout: the detection frame's
   Matching line, which flashes as a pin's search lands.
164. **Beyond imagery: the worlds, as spacecraft saw them, in the footer's dots** (Should 8; the plan's lean, open
   decision "Beyond imagery", Decisions 6): the plan's Placeholder table names the sources (MESSENGER for Mercury,
   Galileo for Callisto, Cassini for Titan, a NASA Venus image), so each card shows its world's whole disc from that
   mission, not a picture of the spacecraft or a habitat; the cards' copy keeps "Concept" for the habitats. Whole
   discs, as the footer's Earth: at ~100 × 58 dots a surface scene dithers to noise, a disc stays a world. One ink per
   world (colour belongs to the bodies), taken from the galaxy diagram's orbits where it has the planet, else the
   world's own tone. The credit is a line under the image (mission linked, credit beside it), as the strip's surface
   photograph has one; over the image's corners it met the disc in narrow cards. `#beyond` scrolls when its content
   is taller than the window, rather than clip the cards. Images picked for discs whose features
   survive the dots (credits.md lists the ones passed over). The tone work (CLAHE, stretch) is baked into the
   shipped JPEG so the page only thresholds. Supersedes 160's Beyond half: no scene reads a world's map any more; a late
   image fades in over its empty frame.
165. **Beyond imagery review fixes** (Should 8): Beyond's images are asked for when Beyond shows, as the plan's "load
   each body's textures when it is first shown", and otherwise still after the worlds' full maps (26 KB, never ahead
   of a globe). An image's words are read only once it is drawn: an empty frame is its caption alone. The empty frame
   is the figure's ground, not the canvas's, so a late image fades in dots only. A caption keeps two lines in the
   four-column band 1001–1199 px (over 620 px tall) rather than everywhere: at 1280 no credit wraps and a blank
   second line would open 15 px under every image. Each entry starts at the top, like the title, grid and info sheet.
166. **Beyond's galaxy labels hide where a card can reach them, measured** (Beyond imagery review fixes, round 2): the
   labels are fixed at 38% of the window's height and the cards' height follows the width (their frames are 16:9), so
   the height that clears them climbs with the width: 696–726 px up to 1440 wide, 803 at 1800, 945 at 2560, ~1200 at
   3840 (probed). One breakpoint can't follow that, and a band per width range would rest on where the copy wraps;
   `fitLabels` compares the labels' box with the cards' top scrolled to the end, on entry and on resize (fonts are in
   before any route plays). `visibility`, not `display`, so the labels keep the box it measures. The rule hiding them
   where the cards stack (≤ 760 px wide or ≤ 620 px tall, Port parity round 1 finding 12) stays: on a phone The Sun's
   label would run off the window's edge even where the cards clear it.
167. **Fallback without WebGL** (Should 9). The poster is the title's scene alone, pre-rendered, with the title's own
   lockup, wordmark and blurb as live text over it: the whole title frame as one image would bake in its Enter the
   system and Replay intro buttons, which do nothing here, and its copy; live text stays crisp, matches the title at
   both capture sizes and reads to screen readers. JPEG, not WebP: the browsers that land here are the oldest. Two
   images, landscape and portrait, switched where the title's layout switches (width/height .8). The list takes each
   featured site's own search through the data seam (the merge note's open question: engine doubles, not
   frontend-only), the same search the site view and the grid show, so the page lists real doubles where it listed
   curated ones; the copy pass's "known analogs, not search results" goes with them, and the polar sites' established
   analog sites stay, unscored, where the engine answers no_dem. The results' caveats are shown once per site, not on
   each of three rows that repeat them (never hidden). A deep link lands on its site's entry and holds it at the top
   while the searches fill in, until the reader moves: scroll anchoring alone kept the first visible node (the
   heading, or the other column's entry) in place, so the entry slid away as results grew above it. A lost context
   opens on the reason, not the entry, and its links reload: three asks the browser for a restore, but whether every
   map, patch and render target the app uploaded comes back with it was never tested (some decoded images are let go
   after upload), and the route carries what a reload needs; after a GPU reset a new context usually works (probed:
   Gale's link reloaded into the full site view). The purpose is the default: there is no
   picker on this page.
  - (review fixes) The page serves screen readers where it shows (no WebGL, a failed start, a lost context). With
    WebGL the app's own text carries the same content: the site grid (`#/<world>/sites`) lists each featured site and
    its three closest doubles, each site's panel its results. No skip link into the page from the working app: it
    would be a second mode of the app over a live one; the Accessibility pass decides.
  - (review fixes) Caveats are per double again: the ones all three share once, the rest on their row (spec §4, §5).
    A failed search lists the site's established analog sites, unscored (static, they need no engine).
  - (review fixes) After a lost context the page searches as a reload would (default purpose, no filters), and the dead
    app stands down for good: the scene's stop is sticky (`renderer.ts lost`), its keys and router ignore input
    (`state.ready` false, set in `app.ts`, which has the state and the canvas: importing the router from `main.ts`
    would split the app chunk for one line).
  - (review fixes) A link clicked on the page marks its entry and leaves focus and scroll alone (the clicked link is
    always in its own entry, on screen); only a load, back, forward or pasted link lands, with the reason in the entry.
168. **Plans kept for the tab's session; the dead app asks nothing** (Fallback without WebGL review fixes, round 2).
   After a lost context every way back is a reload, so a plan in memory was lost with it: plans and requests now live
   in `sessionStorage` (Decisions 74's open upgrade), saved on `pagehide` and whenever the page is hidden (the last
   moment a phone's tab is sure to run before it's dropped), read back through `keptOf`, which keeps only whole plans
   and requests (values reach the form escaped, as typed ones). Every reload keeps them, not only one after a lost
   context: one rule, and the more useful one; the query (purpose, filters) still starts afresh (Decisions 36), the
   plan carrying its own purpose. The lost page says the plan is kept only on the plan and review steps, where there is
   one being filled. The dead app's stand-down (Decisions 167) now covers its searches: `state.ready` is checked where
   the app asks one outside a route change (a settled search's redraw, the warming retry, the status line, the grid's
   queue, the held dive), since those are the only ways a dead app still runs; the page's own `one()` keeps asking
   again when called off, now only ever once.
169. **Accessibility pass** (Should 10). AA for text that carries information, so the labels' grey moves: `--text-3`
   from the plan's #6C727A (4.15:1 on `--bg`, 3.45 on `--surface-3`) to #80868E, the least that passes on every
   surface it sits on, the selected row's `--surface-3` included (#7A8088 would stop at `--surface-2`); the three greys
   keep their steps (E7, A0, 80). Decorative telemetry may stay faint: the graticule labels are `aria-hidden` and the
   HUD's sub-observer and the keys' spoken centre carry the same point, but they read over a lit globe, so .8 with the
   halo; the intro's corners stay as they are. The panel stays after the stage in the DOM: moving the `aside` would
   rework the stacking the views rely on for a Tab order the skip link and the route's focus on the panel's heading
   already give. The skip link is a button (an `<a href="#…">` would route) and shows only where there is a panel or
   the grid to skip to; elsewhere the content follows the top bar's four stops (the deferred question in Decisions 167:
   no skip link into the fallback page, the grid already lists the same sites as text). The 3D view is
   `role="application"`, the one place it fits: a screen reader in browse mode would take the arrows otherwise. Its keys
   are a drag of 24 px, not a separate model, so direction and speed match the pointer's, and Enter pins only where a
   click pins. Its focus is a frame round the viewports the keys move, since the canvas spans the top bar and panel too;
   off the keyed views it has no `tabindex` (a click doesn't focus it, so the info sheet and Beyond still read a focused
   opener as the keyboard path). The search's state is said by one static status region in a few words, not by the
   doubles box: a region rendered with its content isn't announced (the box is new with every panel), and as a live
   region it read all five cards (and again with each Show more) on landing; the cards are a Tab or the "Earth doubles"
   skip link away. The grid's coordinate cards and the fallback's keep their regions: three rows each, their own views.
   One focus ring everywhere, the base `:focus-visible`, inputs included.
170. **Accessibility pass review fixes.** The search is said afresh by emptying `#live-s` and writing it 0.15 s later on
   the app clock (`gsap.delayedCall`, which the capture harness seeks): a write in the same task or frame as the
   emptying is no change to a screen reader. Only asking (purpose, filters, area, Try again, Show more) and another site
   do it, not each settled search, so a warm-up's retries aren't said every 3 s. A route while the 3D view has the
   keyboard focus leaves it there (Escape back to the globe as well as Enter's pin): the keys go on working and the
   route is said in `#live`; a pointer click on the canvas isn't `:focus-visible`, so the heading takes the focus as
   before. The panel's heading shows the base ring once a key has been pressed (`html.kb`): Chrome then draws it only
   for a keyboard arrival, but before any input it rings a script focus too, so a deep link would load ringed. It fits
   its words (`width:fit-content`) rather than ringing the panel's width. While the keys drive the globe the HUD's cursor is its
   centre, even with the pointer over the globe: that is where Enter pins.
171. **Graticule labels' edge** (Accessibility pass review fixes, round 2). A solid dark edge, not more alpha: over the
   Moon's lit ground the labels are light on light, and a blurred halo fades to nothing a pixel off the stroke at 10 px.
   Eight 1 px `text-shadow` offsets rather than `-webkit-text-stroke` with `paint-order:stroke`: the same look, and
   where `paint-order` isn't honoured on HTML text the stroke would eat into 10 px glyphs; the offsets work everywhere.
   Not a chip like `.mread`: 64 boxes over the globe would read as UI, not as a map's labels.

172. **Share and meta** (Should 11). Fonts: Google Fonts' own files, downloaded, not `@fontsource` packages: the same
   files the app always rendered with (captures unchanged), Newsreader keeps its optical-size axis (fontsource's static
   Newsreader has none; its variable package renames the family "Newsreader Variable"), and no dependency. Latin and
   latin-ext only (shortcut in `tokens.css`). No `preload`: they swap in as before. The Open Graph image is the title,
   the brand's own frame, rather than a compare view whose panel reads as UI at thumbnail size; at 630 px high the
   blurb's first paragraph runs under the satellite's tag, so the card keeps the second, which says what Eidolon does
   (a preview on X shows only the image). `og:image` absolute through `VITE_SITE_URL` (one `.env` line): relative image
   URLs fail on most scrapers, and step 1 has no deploy URL. Copy link sits on the panel's back row (on a phone the
   sheet's, in reach at peek), not the top bar, which is the same on every view and full on a phone; it isn't on the
   booking steps (the plan isn't in the route: a link would open an empty plan). The copied link drops the query: a
   shared link opens the app as anyone would. Page titles name what the route shows, most specific first; the static
   `og:title` is the footer art's line, the description the title footer's paragraph (copy-pass text).
173. **Share and meta review fixes.** A way back too long for its row is cut with an ellipsis, not wrapped: a wrap
   moves the whole panel down for the 1.6 s the button's words last, and only a compare's way back (the target's name)
   runs that long, whole in the comparison's pair right below it; shorter failure words as well, so most stay whole. The preview card hides
   what it can't label (the site dots, their rings) and the frame whose foot crossed the blurb, and moves the blurb off
   the glow: a card is a still, not the live title, as with the buttons and first paragraph it already left out. The
   copied link stays the route (Decisions 36 holds; Deviations).

174. **Globe relief from baked normal maps** (Should 12, Planet surface). Slopes, not heights: the shader needs no
   neighbours, and the cos(latitude) of the east spacing is baked in. Stored as sign · √(|s| / .5): global slopes at 5–20
   km a pixel are mostly under .05, which a linear 8-bit code would flatten to a few levels. JPEG at 85 with full chroma
   (the two channels kept apart; 734 and 1290 KB for Mars and the Moon, 47 for Earth at 1024 px, whose relief only
   shades land under its lights and glint), loaded with the full maps after the start, the relief fading in from flat,
   so the start and first paint don't pay for them. The bump maps stay (pins read heights) but aren't uploaded: GPU +4 MB.
175. **The Moon's photometry** (Should 12). Lommel-Seeliger mixed with Lambert at L .6 (McEwen's lunar function) rather
   than pure Lommel-Seeliger, which doubles the brightness toward the limb at full phase; the mix equals Lambert face
   on, so the Moon's exposure stays as tuned in Must 9.
176. **The drape** (Should 12, Terrain surface). Only where the block is real terrain (an image over procedural ground
   would show what isn't there), and only on the site view: its block is the site's own extent, which the best open
   mosaics resolve (MDIM at ~230 m: Jezero's 60 km in ~260 px); compare's 18.8 km windows would get 40–80 px of Mars or
   Moon imagery. Cut to exactly the block at 360 px by the same script and sources as the site crops, so it registers
   with the block (same local projection, row 0 north). Off by default (the hypsometric tint is the design's terrain
   look), its toggle under the north arrow, where it is clear of the legend on a phone too.
177. **The swap's crossfade** (Should 12, Terrain swap). A held frame rather than two live render targets: the old view
   is a globe mid-dive that has stopped moving, so a still of it is what a second target would draw, at no per-frame
   cost. Drawn once more at the swap (so ?capture holds the right frame between seeks), copied at half size (5 MB at a
   laptop's size, let go after the fade; 2.5 MB since the review fixes, 8-bit sRGB: Decisions 183).
   .69 s linear, the curtain's in and out together; the swap itself moves to the
   curtain's old start (1.45 s into a dive, .24 s earlier than the terrain used to appear).
178. **One grade over the whole frame** (Should 12, Detection grade). Moved after the terrain pass, masked by alpha
   (what the bodies and blocks cover), so the dive's sky and the grounds keep their colours as before. Each ramp gets a
   grade and a sky in the style of the plan's Mars and Moon ones (shadow deeper and cooler, mid more saturated,
   highlight paler; the sky round the shadow); the per-body Earth pair goes, since every Earth site has its own ramp.
179. **Beyond's reveal on the compositor** (Should 12; a deviation from "GPU lines"). Beyond is a DOM overlay over a
   paused scene: WebGL lines would need a second context or the scene's canvas drawing under an opaque overlay. The
   row's aim, no per-frame CPU redraw, an eased left-to-right reveal and one held frame, the same layout, is met by
   drawing the three layers once and animating their opacity and clip; the Sun sits on the path's layer, which unclips
   as the path arrives (as it appeared at 97 % before).
180. **The footer's dither shader** (Should 12). A context of its own (the scene's renderer is paused under the footer),
   made when the art first draws; without one the steps keep their captions and lines. The lines stay on the 2D canvas
   above (dashed arcs and Béziers are a few calls there, much code in a shader); where a world's dots covered an orbit
   line the line fades by the dots' share (.72²), so the look holds.
181. **Light from the site's sun** (Should 12, Lighting disagrees). The azimuth is real; the height fixed at the
   prototype's 38°, so a site at night still shows its relief. Taken once per site entry (sim time runs at ×600:
   a live sun would wheel the shading round every few minutes and re-render the map). The 2D map shares the light, not
   the block's exaggeration: at 8–12× (low-relief sites) the top-down map read embossed and its contours were lost, so it
   keeps its 2.5×. The stage's warm glow follows the light's direction on screen, eased at 2 a second.
182. **The sheet's hint line and the frame on every entry** (Should 12). The hint is a 16 px line under the grip, part
   of the peek (which grows by it), where the status bar's hint would be relative to a phone's stage. `acquire` holds
   the frame 1.3 s (a dive's .15 s to its 1.45 s swap) and plays on a compare only when its target is new.
183. **Should 12 review fixes.** The terrain overlay hides by `visibility` once faded (off its view or under the frame)
   rather than having its HTML cleared: the legend and arrow keep their .3 s fade out. The drape toggle updates in place
   and a failed image makes it `aria-disabled`, not `disabled`, which would blur a focused button. The title's
   annotations fade with the scroll rather than avoid the moved text: their frame and crosshair lines span the hero and
   would cross it whatever the labels did; at the top they are as before. The graticule labels' limit is the HUD's box,
   which already keeps clear of the tape, the hint and the status bar. "Site acquired" flips right of the dot by its
   measured width, and wears the graticule labels' dark edge there (it reads over the block). A crossfade during one
   joins it: re-holding would need the graded output (one more copy each swap) for a case that only a late elevation or
   a quick second route meets. The held frame is 8-bit sRGB: its values are tone-mapped already.
184. **Reduced motion keeps the detection frame's hold** (Should 12 review fixes, round 2). The plan makes every move
   instant or a crossfade; the frame's 1.3 s hold isn't a move, so a dive and a site entry hold it as with motion,
   only the turn, the dive and the frame's own fades instant. A reduced-motion dive so takes its 1.45 s to the block,
   on the dived globe under the frame, as a deep link holds it over the block.
185. **Compare under one light** (Should list holistic review fixes). Both compare blocks, the overlay's ghost and both
   minis are lit from the engine twins' north-west 315°, not the target's sun: the twins sit in the same panel, so all
   six images of a pair shade alike; a top-down map lit from the north-west never reads inverted, where a target's sun
   from the south would invert both minis; and compare is about form, not the hour. The site view keeps its real sun
   (Decisions 181); entering compare is a crossfade, so the light's turn isn't seen.

186. **The sun-angle control** (Stretch 1). In the panel under the site's map, not on the stage: the map it lights sits
   just above it, it works the same in a phone's sheet (the phone's stage has no room left beside the legend and the
   image toggle), and its controls are the panel's. Opt-in: the relief light (Decisions 181) stays the default, so a
   site entered at night still shows its relief; on, the sun's height is true and a sun below the horizon leaves the
   block in its ambient. Shadows are cast, not only shaded: near the lunar south pole the sun stays within a few degrees
   of the horizon, so whether ground is lit depends on the ridges between it and the sun, which a hillshade can't show;
   at true scale, since the exaggeration is for reading form. The hour is local mean solar time at the site (one scale
   for every body), the date an Earth date; the moment is the one in the solar day that holds the date's noon UTC: the
   place's own date on Earth, and on the Moon a lunation, so the moment can be days from the date (the facts give it).
   First on, both are now. **Not on compare** (the task's open question): compare lights both worlds from the engine
   twins' 315° (Decisions 185) so one landform shades alike in the pair, the overlay and the twins; a time of day is
   one body's and the pair spans two, and the twins are fixed at 315°. The Moon's subsolar latitude is computed now
   (its shortcut said "if it ever shows": at the pole it is the season).
187. **The set sun, said where it shows** (Stretch 1 review fixes). The stage's caption names the moment in UTC, the
   top bar's scale, and not the hour (the panel has it); compare says in its panel, under the minis, that the set sun
   isn't its light. The season fact is the sun's latitude on the Moon and Earth (Ls on Mars). Draped under a set sun,
   the orbital image takes the tint's light (dark where the sun doesn't reach) rather than a caveat that it keeps its
   own: the control's point is what is lit. A summit that sees a sun below the centre's level horizon stays lit, as it
   would (a peak's horizon dips by √(2h/R)), and the panel says so.
188. **The slope hazard layer** (Stretch 2). In the panel under the map, beside Sunlight, not on the stage: like the sun
   it changes both the block and the map, the map sits just above it, and the panel has room for the area and the
   spacing caveat (a phone's stage has none beside the legend and the image toggle). The block's legend carries its key.
   Computed on the CPU once per terrain, not from the mesh's normals in the shader: the mesh is the exaggerated and, on
   phones, decimated surface, the map needs the same numbers, and the area beside the key is `measure`'s count of the
   same grid. One line at 15° (the compare table's "Slopes over 15°"), no classes. The ground greys under it, a quarter
   of its colour kept: coral is the one accent, and over Mars's ramp a coral tint alone doesn't separate. **On compare
   too** (review fixes; it was site-only at first): the layer is session-wide, the plan says "on the terrain and the
   map", and compare is where a site and its double are judged for a campaign (an engine-found double opens only
   there). Its checkbox sits under the table, whose "Slopes over 15°" row gives each side's area (under the minis it
   pushed the campaign button below a phone's half sheet).
   Under Sunlight on the site panel, not above it: the plan ranks the sun first, and the sun's states keep their facts
   in frame.
189. **Profile and measure** (Stretch 3). Straight under the map, before Sunlight, not a section after Slope hazard:
   you draw on the map and read the result, so the fields, chart and facts sit just below it (after a drag at 1280 ×
   800 the chart's top is in view beside the map). Off it costs the one checkbox row under the map's caption, and the
   sun states keep both rows of facts in frame at desktop. Opt-in, like the other two layers: while on, a click on the
   map is a line's end, not a pin move, and the caption says which. Touch taps each end and never drags, so measuring
   adds no gesture of its own: a finger's drag on the map scrolls the sheet as before (Should 3), the peek drag and the
   browser's pinch untouched; a mouse drags or clicks. The keyboard way is two typed ends, with the coordinate field's
   parser and messages, both inside the map's square (the profile reads its heights). One distance for every length:
   great-circle on the body's mean radius, exact short and long (the plan's "great-circle for long lines" without a
   threshold where a flat estimate takes over). Heights from the very grid the block and the map are drawn from,
   bilinear, two points per grid step. The facts are distance, rise A to B, climb and descent, and steepest grade (the
   numbers a traverse is judged by); the lowest and highest label the chart. A single series, so no legend: coral line
   (the selection's colour, as on the map) over a faint coral fill, two hairlines at the range, text in text tokens. Not
   on the 3D block (the plan says on the map), not in the route, one line held for the session per site.
   (review fixes) The result has to show where the drawing happens: the length goes on the map in an edge-label chip
   by B, for every input and size; a typed line also scrolls its status line into view (the keyboard user is in the
   fields, the map above), but a tap doesn't scroll, since the sheet would slide the map from under the finger drawing
   on it. Over the slope hazard's coral the line turns pale (the wordmark ramp's last stop), the ends stay coral.
190. **The landing ellipse** (Stretch 4). In the panel after Slope hazard, whose slope grid gives its share over 15°,
   like the other layers opt-in and held for the session; on the stage only a caption line names it. Centred on the
   site, not placed by a click: a click on the map already moves a pin (and, measuring, ends a line), and a named site's
   centre is the target the panel describes; to land elsewhere, drop a pin there (the ellipse follows it). Presets
   only, two per world, each with its published size and source: on Mars, Perseverance (the plan's example) and
   Curiosity; on the Moon, Artemis's crewed lander, the permanent-base mission the challenge is about, whose
   requirement is a 100 m radius, not an ellipse (shown as the 200 m circle, a dot at a 60 km site, and said to be finer
   than the slopes), and Apollo 11, the one crewed landing ellipse with a published size; on Earth all four, since an
   analog is where a campaign rehearses either world's landing. One orientation for the session (90° to start: Apollo 11's), a slider rather than a field: 5° steps are finer than any of these ellipses'
   uncertainty. The share over 15° is a fraction to two places (the engine prose's convention, Decisions 23: no
   percentages anywhere) with its area in km², of the part inside the map's square where it runs past it. The block's
   ellipse is drawn in its shader from the plan position (a uniform, no geometry), so it drapes over any exaggeration
   and costs nothing to turn; edge 2 px coral on a 5 px casing as the map's and the measured line, pale over the slope
   tint. **Not on compare**: compare shows the engine's 18.8 km windows centred on the IAU centre and the Earth cell,
   for form, under one light; the ellipse is a site-view planning tool (`shortcut:` in `ui/ellipse.ts` for the upgrade).
   Review fixes: an ellipse under 8 px across (Artemis's 200 m at a 30–60 km site) keeps its true-size dot and gains a
   ring 22 px across, on the map at the map's scale (`ringed`) and on the block at its zoom, said in the fine print to be
   larger than its true size; Artemis stays the Moon's first preset (the reviewer's other option, Apollo 11 first, would
   open the Moon on a 1969 ellipse rather than the base mission). The block's edge widths are screen pixels on level
   ground through each point, not the draped facets' derivatives. The presets live in `src/data/missions.ts`.
   Review fixes, round 2: the ellipse stays on the site's centre everywhere, even on a mission's own site. The Mars
   source lines cite only the size, and on Jezero and Gale the fine print says where Perseverance and Curiosity came
   down (distance and direction from the crosshair, the landing's name, inside NASA's own ellipse): no published centre
   for either ellipse was found, and the landing point isn't the ellipse's centre.
191. **My campaigns** (Stretch 5; the open decision Booking flow depth, now past its lean: listing to confirmation,
   then My campaigns since time allowed). A dialog, not a route or the side panel: it is reached from every view with a
   top bar (the system view and Beyond have no panel) and is personal to this browser, so a link to it would open
   empty anywhere else; a native modal `<dialog>` gives the focus, the inert page and Escape for free, in the panel's
   look and type (under its button at the right, a bottom sheet on a phone). (Review fixes: it now moves, by CSS
   transitions, which reach the native backdrop where GSAP can't: the panel's 0.9 s power2.inOut on desktop, the info
   sheet's 0.85 / 0.7 s on a phone; its right edge on its button's.) Requests move to `localStorage`
   (a record of what was asked), plans stay in `sessionStorage` (Decisions 168: a draft, whose weather window moves on
   daily); the same key and `keptOf`, its request now with the names it was made under, so the list and the
   confirmation need no search, and a key of the flow's shape. A campaign opens its confirmation (the plan's "review,
   then a confirmation"; its Edit the plan leads on to the plan and review). One per target and double, as the
   confirmation's route addresses one. On the top bar: words at 1,100 px and wider, the icon below, so the crumbs keep
   the room they had; on narrow phones the clock drops its date, as phones already drop the Mars clock. (Review fixes:
   where the crumbs still run short, the site's and double's names ellipsize, never the current step; requests are
   read again from storage as they're listed, and a request writes only its own key, so tabs don't lose each other's;
   a kept request must pass the checks it passed to be requested.)
192. **Earth's clouds on the title** (Stretch 6). Cover in Earth's own shader, not a cloud shell: at the title's
   distance a shell adds a draw and an ordering question with the atmosphere for no visible parallax. Shown by
   `G.title`, the value the opening's shot already eases in and out, so the clouds come and go with it and no other
   view (body, site, compare, where sites are read) ever draws them; that includes the intro and sunrise, the same shot.
   The map: Blue Marble's own 2K cloud layer as R8, resident once loaded (the plan's first option, "size the cloud map
   so the budget still holds"): 2.8 MB takes the peak from 291.6 to 294.6 MB; a 4K one (11.2 MB) would break 300, and
   loading per title and disposing on leaving would save the 2.8 MB for a rebind and a re-upload on every return,
   not needed while the budget holds. 2K gives about a texel per pixel on the title's globe at 1280 × 800 (≈600 px
   across 180°: 1,024 texels). Drift east at an eighth of the title's turn on the frame clock (seekable, as the spin),
   none under reduced motion. The blurb's lines over cloud get a soft scrim of the title's ground (shade, not glow),
   measured to 5 : 1 for its coral line; the SVG labels the HUD's dark edge.
193. **The title's foot over the clouds** (Stretch 6 review). Scrolled to the credits, the hero's last ~225 px lie over
   the fixed globe. The ghost button takes the scrim's colour at .5 as its ground rather than the scrim growing under
   the buttons (which would darken the title shot's dark ground for nothing); the meta row a tight dark edge with a
   halo, the HUD's way of edging text over imagery, measured to its own contrast over the dark ground (4.2 : 1 p10).
194. **The title turns the terrain off** (Stretch list holistic review fixes). Every view that shows no terrain turns it
   off on entry (system, Beyond, body from a site or compare; now the title), so the intro, which starts only from the
   title, needs nothing of its own. The finding's optional second change, keying `playBody`'s swap on
   `VPS[0].kind === 'terrain'` instead of the previous view, is not taken: with the title fixed the terrain can only be
   on when the previous view was a site or compare, and compare's Globe mode (terrain off, `L0.only` set) needs that
   branch's move (`L0.only` cleared, slingshot to the focus pose), which keying on the kind would skip.

195. **A night fill on the globes that read ground** (Final review fixes, round 1): on the body, site and compare views
   a globe's night side takes a dim light from the viewer, a quarter of the sun's (`fill`, .25, eased over about half a
   second), so a held site the sim clock turns into night, or a compare's double on Earth's night side, still reads; the
   terminator stays and Earth's city lights still show over it. The title and the system keep the dark night. Chosen over
   turning the globes toward the day side: compare holds each site in front of its camera (Decisions 8), which a turn
   would undo.
196. **A reduced-motion dive swaps at once** (Final review fixes, round 1): the dive is a cut there, so the terrain swaps
   in under the frame .2 s in (the frame shown first) and the frame holds over the terrain to 1.45 s, as a deep link's
   does (`acquire`); held over the globe at the dive's depth, its map's texels showed.
197. **The client refuses a Moon search by coordinates beyond 59.5°** (Final review fixes, round 1): the engine's
   `windows.py` has no window there, but `api.py target_window` retries the remote read 3 times, 5 s apart, before its
   422 no_dem. `data/client.ts noDemAt` answers the same `EngineError(422, 'no_dem')` without a request, for searches
   and `/elevation/point`; names still go to the engine (its store answers for them). The mock's cutoff is 59.5° too.
   The copy keeps the spec's "within 60°".
198. **The frame's text and the terrain's overlay never show together** (Final review fixes, round 1): the overlay
   already faded in over the frame's last half (`placeTUI`); the frame's text (Site acquired and the readout row) now
   fades over its upper half (`clamp(4 × scanUI − 2)`), so one is gone before the other comes. The dot, ring and grade
   fade as before.
199. **Live is now** (Final review fixes, round 1): Live sets the clock to the wall clock as well as the rate to 1×; the
   other rates keep going from where the clock is. The prototype only set the rate.
200. **The static text tells real state** (Final review fixes, round 1; plan, Visual bugs, Stretch): the title's meta row
   names the point of Earth the title looks down on, to the degree ("Low orbit over 1° S, 111° W"), as Earth turns;
   the frame's Terrain readout says what the block is built from, "Real elevation" or "Illustrative" (the site view's
   own `genTerrain` source). The no-WebGL poster page keeps "Earth, low orbit": nothing turns there.
201. **Earth's real elevation at 5× at most** (Final review fixes, round 1): GLO-30's 30 m ground keeps a fine roughness
   the planets' coarser models smooth away, and Haughton at 10× read as spikes. The cap is on `genTerrain` (Earth sites
   and their windows), so a compare with an established Earth site shares at most 5×; the engine's Earth cells (the mock's
   too) keep the shared rule.
202. **What a match covers, and what Earth can't reproduce** (result detail): the match measures one factor of an analog
   (terrain form at 200 m), so the detail says so, with each other factor as "Not assessed" and not a zero, and lists the
   target world's gravity, pressure, temperature, radiation and signal delay beside Earth's. The world's gravity,
   pressure and temperature are `data/bodies.ts`'s, so one screen has one value; they differ slightly from the research
   report's (Moon −173 to 127 °C here, −178 to 117 °C there; Mars gravity 3.71 here, 3.73 there) and want one cited value.
   Radiation (Zhang et al. 2020; Hassler et al. 2014) and delay (ESA Nebula) are new numbers with their sources in the
   drawer's note; the report marks Mars's 0.64 mSv/day as still to verify. The nearest established analog is the
   great-circle distance to the 14 sites `data/sites.ts` lists, 150 km at most, so "none" means none of those 14.
203. **A separate climate fit, and NASA surface values that are not scored** (result detail): weather and climate enter as
   a "Climate fit" word (Close, Partial, Weak) from two bands, the Earth result's mean annual air temperature (0 °C or below
   matches, up to 15 °C partial) and aridity index (below 0.2 matches, below 0.5 partial) against a cold, dry target. It
   sits beside the terrain match, never re-ranks or filters, and is never blended with it (plan.md: never blend terrain
   fidelity and practical suitability). The thresholds are our own, not a measured distance, because the Moon and Mars
   have no air-temperature or aridity map comparable to the Earth side. Diviner midnight temperature and rock abundance
   (Moon) and THEMIS thermal inertia (Mars) are shown as "Measured at the target" and not scored: Earth has no like-for-like
   value in our data, and a midnight surface temperature is not an annual mean air temperature. Retraining the terrain
   matcher on the new challenge datasets was not done: it would void the blind-test numbers (34, 52.5 and 64 percent at top
   1, 3 and 5) and its training data is not in the repo. The Moon's south-pole sites are left out (no Moon elevation beyond
   59.5°).
204. **Rock type, caves and biology: NASA data for the target where a catalogue exists, not scored** (result detail): the
   three factors the detail lists as "Not assessed" have no like-for-like Earth value in our data, so none enters a score.
   Caves: NASA's Mars cave candidate catalogue and the LROC pit atlas give the target's nearest entry, labelled a candidate.
   Rock type and chemistry: not covered; Clementine's 1 km iron oxide product is colour-binned, so it gives no values (the
   full-resolution maps need its bands 2 and 4 from a 4 GB mosaic); Lunar Prospector and Odyssey gamma-ray and neutron
   maps are next. Biology and habitability: not covered; no NASA map of it exists to read, and the climate fit and the
   Earth result's barren or vegetated flag are the nearest we hold. No literature notes per analog site were added: they
   would be claims we have not checked against the sources.
205. **A verdict block, an "unlisted" tag, and Earth skin temperature beside the Moon's midnight value** (result detail and
   cards): the brief asks to explain what is analogous, where it breaks down and how it could help, so one block gathers what the
   detail holds (no new claim, no score). A cell away from all 14 listed analog sites is tagged "Not near a listed analog", never
   "new" or "undiscovered". The engine's climate is air temperature while Diviner and THEMIS are surface values, so NASA POWER's
   skin temperature (TS_MIN, the mean daily minimum, is the night-time surface) is shown beside the Moon's midnight value; it is
   a feed per Earth result (asked once per place, kept, not under `?capture`) and is not part of the climate fit.
206. **Mars chemistry and water from the Odyssey GRS, and a hedged process line** (result detail): this supersedes the part of
   Decision 204 that left rock chemistry uncovered, for Mars only: the GRS's element tables are small, simple and NASA's, so each Mars
   site shows its bin's water, iron, silicon, potassium, chlorine and thorium, regional and never scored (the Moon's chemistry and all
   of Earth's still are not covered; biology never). "Water" is hydrogen read as water-equivalent in the top metre, ice and mineral-bound
   water together, so the page says so and does not call it ice. The process line comes from the IAU descriptor alone, so each is
   hedged ("commonly") and labelled inferred: the descriptor names a form, not an origin.
207. **Mission fit: factor weights by mission, a provisional tier** (result detail; asked for by the team on 2026-11-14 from the
   analog-scoring report's template): weights per mission over six factor groups, not the template's word for word. Changed from it:
   target fidelity (gravity, pressure, radiation) has no weight, since it is the same at every field site on Earth and cannot rank
   them; terrain leads rover mobility at 50, not 35; habitation keeps some terrain and climate; four more profiles (drilling, EVA,
   thermal, education) cover the engine's other purposes. Only three factors have data (terrain: the engine's score; climate: the
   climate fit's band; operations: workable months from NASA POWER), so the score re-normalises over those, shows the weight
   assessed, and withholds the tier under 50 of 100. Safety and permitting are not assessed, so every tier is "provisional". The
   weights are judgment, said so on the page; Foucher et al. 2021 (functional analogues: judged against the use) is the only
   source behind the approach, and no source gives numeric weights.
208. **Three tracks, fidelity weighted, existing analogs listed** (supersedes 207's zero weight on fidelity; the team's analog research,
   2026-11-14): gravity, pressure and radiation now carry weight in the missions that need a facility (EVA training 25, habitation 15,
   thermal 15, rover and ISRU 10), and are N/A, not zero, for field sites, which cannot differ on them. Existing analogs are ranked by the
   share of a mission's weight each stands in for (strengths 0 to 1 per factor, our judgment from sourced facts) and listed above the
   engine's doubles, so a facility or known site shows when it is the better answer. Facts the team's notes held without a source
   (parabolic flight, altitude chambers, Kraken, MMEA, VaPER) are left out until sourced; see `docs/analog-weights.md`.
209. **A shadow fit inside Operations** (mission fit; asked for by the team on 2026-11-14): the sun control's shadows come from a plain CPU
   function over the elevation grid (`sunlit`), not from the shader, so the same march runs on both sites' windows. Their shadowed shares at
   grazing sun heights are compared into a 0 to 100 fit that counts for part of Operations in the missions that move over the ground
   (rover 40, EVA 40, drilling 30 of the factor's 100; judgment, no source). It overlaps relief and slope, which the terrain match already has,
   so it adds the horizon view and not new information; it is scored only where both windows are real elevation; the Moon's south pole, where
   illumination matters most, has no elevation here. The heights are 1°, 2° and 4° because at 200 m spacing a higher sun is blocked by almost
   nothing and every pair would score 100.

## Deviations

- **Mission fit blends terrain and suitability (Decision 207):** `plan.md` (Design system: Rules) says never to blend terrain
  fidelity and practical suitability into one number, and that purposes never weight the match. The mission fit is such a number,
  added at the team's request. Kept from the rule: the terrain score and rank are untouched and shown on their own, no percentage
  is shown, every factor's own score and weight is listed, and the copy says the mission weights the fit, not the match.
  `AGENTS.md`'s copy rules still state the old rule: the team should confirm and reword them.

- `npm test` runs `vitest run --passWithNoTests` so the empty suite passes until the coords tests land.
- `public/textures/manifest.json` adds `file`, `mime` and `bytes` per entry next to the prototype's `w`/`h`. `europa.jpg`
  is extracted too although only the dead Europa branch used it; drop it with the dead code in the port.
- Hand-written `PurposesResponse` follows the fixture (`{purposes:[…]}`), not the spec's prose (a bare list); fixtures are real server output.
- **Stage 1 (port):**
  - `start()` lives in `src/app.ts`, not `main.ts`: `main.ts` creates the renderer and imports `app.ts` only when that
    works, so without WebGL no scene module runs and no texture downloads (the no-WebGL path shows `#gl-fail` and
    resolves `__eidolon.ready` once fonts are in).
  - New `src/dom.ts`: `$`, `$$` and the write-on-change setters every overlay needs.
  - `showOnly`/`sunMix` live in `scene/bodies.ts` (they tween bodies; no routing), not `router.ts`.
  - Sim time runs on `clock()` = `performance.now()` (capture: the frozen capture clock), not GSAP's ticker time, which
    lag-smooths hidden tabs and would let Live drift from UTC. The intro UTC reads `wallNow()` (capture: epoch + time).
  - Title transition is one timeline (dawn/glare tween, the slingshot call at .1 s, the reveal call at 3.2 s / 1.1 s).
    The reveal stays its own timeline, built when it plays: it measures the wordmark then, and its first `set` renders
    immediately (built early, the bars would show at ±90 % height). `leaveTitle` kills both. The slingshot stays a
    standalone tween so `rig.tween` keeps meaning "camera moving".
  - Capture `route()` uses `history.pushState` (no `hashchange`, so `apply()` runs once); `route()` and `ready` run one
    update step (dt 0) before drawing so cameras and overlays match the new state.
  - Detection-grade uniforms (`duoA/B/C`) start black; stage 4 sets them per body from `--grade-*` when a dive plays.
  - Adaptive pixel ratio: 60 warm-up frames skipped, 120-frame windows, down a step at > 24 ms (to 1 at > 34 ms), up a
    step after 5 windows under 18 ms; measurement and drawing pause while the tab is hidden. Capture: fixed `min(dpr, 2)`.
    The stars' point-size uniform follows the pixel ratio every frame.
  - Route lookups use `Object.hasOwn` (`#/constructor` no longer resolves to `Object.prototype`); `parse()` drops the
    `!s.t` check (every site has terrain now that facilities are gone).
  - Dropped as dead: `europa.jpg` (manifest, file, extract script), the rays sprite, the zero-intensity PointLight,
    `extensions.derivatives`, FACILITIES/FAC_BY and `.marker.fac`, `.cards-wrap`, the old intro CSS (`.imark`, `.ring`,
    `.arc`, `.bk*`, `.sq`, `.hatch`, `.caret`/`blink`), tokens `--ice --teal --europa --venus --mercury`, the theme
    rules that re-set the same values (25–26), and `#intro .tl3,.tl4{display:none}` at ≤ 560 px, which never applied
    (it lost the cascade to `#intro .tl`); dropping it keeps the reference look (bottom telemetry shows on phones).
  - CSS media queries hard-code 759 px (= `--bp` − 1): custom properties can't be read in media queries.
- **Stage 2 (port):**
  - `draw()` floors viewport and scissor rects (at the pixel ratio) as r128 did; current three rounds them, which moved
    the phone globe (sheet at 54 % → fractional height) 1 px. The overlays still use the unrounded rect, as in the
    reference; the Should row "round viewport and scissor rectangles" fixes both together.
  - HUD readouts are computed every frame and written on change (the reference throttled to every third frame); the
    tape canvas redraws only when the sub-observer longitude moves by .01°. In captures the reference shows a reading up
    to two of its frames old, so sub-observer and sub-solar can differ by ~.3°.
  - Coordinate entry runs on GSAP's clock: the 280 ms pause and the commit are `gsap.delayedCall`s, the turn start is
    `gsap.globalTimeline.time()`, Copied resets after a 1.4 s `delayedCall`. The commit wait is `previewTurn + .05`.
    One pending call (typing pause or commit) is killed on every route change; the reference only cleared the typing
    timer, so a commit could fire after switching bodies.
  - `orientToLL` doesn't touch input state: `setPreview` calls `stopInertia()` first. Drag still kills an orientation
    tween without releasing its hold, as in the reference.
  - Click delegation for `#toggle` and `#rate` joins the `data-go` delegation in `router.ts` (where stage 1 put it), not
    `panel.ts`. `tick1s` is an `onUpdate` in `ui/chrome.ts` (runs before the frame; it reads only sim time).
  - `setTerrain(on, atSwap)` in `router.ts` runs `atSwap` at once: there is no terrain to swap before stage 3.
  - Kept as in the reference although unreachable since facilities were dropped: apply()'s `if (r.site) orientTo(…)` in
    the body branch and `back()`'s body-with-site case. Dropped as dead: the HUD's "Chamber body" hint (only three
    bodies), the body view's custom-pin marker (pins are site views). `Site.custom` added for stage 3's pins.
  - Markers: one viewport's list (`shortcut:` comment); compare's Earth viewport and its click branch come in stage 4.

- **Stage 3 (port):**
  - The terrain curtain runs linear (`ease: 'none'`), as the plan's Motion table says; the prototype used GSAP's default
    `power1.out`. Not visible in captures (the curtain is gone by .69 s).
  - Every site entry takes the deep-link branch (frame and hold the globe, then the terrain swap) until the dive lands
    in stage 4, so a featured-site or surface click from the body view swaps straight to terrain behind the curtain.
  - `siteSpan` replaced by the site projection everywhere it was used, including `albedoAt` (all sites): mid-latitude
    edges are equal to 2 dp, but one stand-in score moved a point (Jezero's Hanksville 66 → 65 %, below the fold).
  - `drawCrop` resamples bilinearly from a band of the colour map (rows the crop can reach, full width) instead of
    `drawImage` of an equirectangular window: mid-latitude crops differ by sub-pixel resampling (Haughton's are turned
    very slightly, as meridians converge at 75° N); polar crops no longer stretch or slide off-centre.
  - Pins' terrain spec carries `h0`/`vs` and no `src`: the `dem` archetype gets the site and body from `genTerrain`.
    The archetypes read the numeric params through one cast in `genTerrain`.
  - `data/sites.ts` ↔ `data/standin.ts` import each other (`siteOf` builds pins, the stand-in ranks against `SITES`);
    both use the other only at call time.
  - Terrain lights ×π needed no retune: the site states match at 0.00–0.02.
  - The terrain overlay's narrow class reads `--narrow` (`L.narrow`), not a literal 520.
  - Marker spread applies on every body view (it also separates Meteor Crater and Hanksville on Earth).
  - `orientToSun` keeps its ±60° clamp (only the site and preview turns were clamped at ±50°).

- **Stage 4 (port):**
  - The dive is one timeline with the orient phase first (plan: orient, then dive), so every featured-site dive from
    the body view, and any surface click off the centre, takes up to 1.2 s longer than the reference. The orient
    duration scales as √ of the turn (the task's "scaled by the turn angle"; linear made short turns snap).
  - The dive slingshot is nested in the timeline (built at once from the turn's end orientation) instead of a call at
    the turn's end, so its timing is exact; `slingshot` now folds the zoom into the extent when it starts, so a move
    that starts later (or a zoomed globe) doesn't jump to zoom 1 first.
  - A new route kills a dive still under way (the reference only guarded its delayed calls with `state.view`), and
    resets the scan if it did.
  - The scan dot is projected from the body quaternion, not the spin's world matrix (stale between capture draws).
  - Compare globes: L0 shows only its body from the swap on (the reference waited for R1's 1.6 s move); framed to scale
    the Moon's view would otherwise catch Earth in its corner.
  - Compare terrain: one shared exaggeration (the smaller one) and 18.8 km windows; contour intervals and elevation
    ramps stay per side. Compare captions and status bar read the window; the site view keeps the site's own extent.
  - Captions get `max-width: viewport − 70 px` and the area string uses no-break spaces, so on a phone's half-width
    viewport the longer "18.8 × 18.8 km" wraps under the name instead of running under the north arrow.
  - The compare minis gained `aria-label`s (the site map had one; the reference minis had none).
  - Same scale is a session toggle, not part of the route (the plan didn't ask for a deep link).
  - Harness: the tap wait (Verification harness) and the retaken `dive-0.8s` reference baseline.

- **Stage 5 (port):**
  - The texture gate's 7 s ceiling outside `?capture` (Decisions 9); a failed texture warns (`console.warn`) and never blocks.
  - `prepareMaps` reads each map on its own (a missing bump no longer drops that body's albedo) and runs again on
    every late texture.
  - The Beyond scenes paint once per page as in the reference, but without waiting for the venus texture (the
    reference skipped every scene until venus loaded); a missing texture is left out and the scenes repaint when it lands.
  - The world labels' light time reads `simNow()` (the reference used the wall clock).
  - The hover state is cleared when leaving the system view (plan Should row "hover state sticks"; one line).
  - The carousel reads the footer's position at the start of each tick while on the title, instead of an
    IntersectionObserver: deterministic under `?capture` (the observer reports asynchronously), and the same read
    feeds the hidden-render check.
  - The wheel accumulators reset on a 450 ms `gsap.delayedCall` (motion clock) instead of `setTimeout`.
  - `setTerrain`'s build step is `buildScenes()` (router.ts), also called by `onAsset`.
  - Hidden rendering pauses `renderer.render` only; per-frame updates keep running.

- **Round 1 (parity fixes; see "Port parity fixes, round 1"):**
  - Reference quirks fixed on purpose, so these captures now differ from the reference: the phone intro frame (clamped
    to the viewport) and Skip intro (raised above the telemetry, not the prototype's hidden telemetry, which carries
    the sub-point and sun elevation); the title annotations (`fmtLL` text, fewer labels, rings shrunk clear of the
    text: on the phone title no site label clears the text and the dots); the phone footer caption (below the art, so
    the footer is taller and scrolls further); the phone system sun (`OVSUN.tall` (−5, 4.4, −3), from (−3.6, 13.4, −3));
    the ≤ 430 px top bar (no "UTC" label); Beyond's labels (hidden where the cards stack); the phone compare toggle (at
    the top of the sheet, which pushes the sheet's content down ~50 px); the no-WebGL page (poster and site list).
  - Mars subsolar latitude is real (+0.9° at the capture epoch): the HUD reads `00.9N`, the terminator tilts, and
    `orientToSun` turns Mars ~1° differently, so `body-mars-zoomed`'s grid shifts and `dive-0.8s`'s tap at the HUD
    centre pins 4.2146° S, 168.1698° E instead of 4.8510° S, 168.2180° E (another pin's terrain, same dive and grade).
  - Finding 28b asked `go()` under capture to also reset the route start; it doesn't: the harness counts seeks after a
    click-made route from the last `route()` (Verification harness), and `go()` is what a click runs.
  - Finding 22 offered `#toggle{bottom:calc(var(--sheet) + 12px)}`; the toggle moved into the sheet instead (the plan's
    Should fix), because the terrain legends end 28 px above the sheet and the toggle is 36 px tall.
  - Finding 24 also asked to ignore canvas drags during a dive: a drag on a site view already turns no globe, so only
    the wheel (zoom would reframe the dive) is ignored there.
  - Marker spread: coincident markers (within 1e-3 px) are pushed along a direction indexed in the full list, not the
    visible one; no capture has coincident markers.
  - `main.ts` reads the texture manifest (`loadManifest`) before importing the app, so `renderer.ts` has no top-level
    await; the build now emits a small shared `standin` chunk (the fallback page and the app both import the site data).
  - Not done this round: finding 3 (sunrise seam: Must 9, "Intro to title"), findings 16–18 (warming, no-DEM and pin
    search states: Must 3/4). The rest of the title-annotation Should row (occlusion by depth, nearest-site rings, the
    SVG scrolling with the hero) is still open.

- **Round 2 (parity fixes; see "Port parity fixes, round 2"):**
  - Reference quirks fixed on purpose, so these captures differ from the reference: the desktop title's Atacama label
    (hidden: it can't end inside the hero's inset), the phone title's satellite tag (left of its dot), the phone
    preview chip (left of the pin) and the graticule labels under it, the polar HUD (`000.0E`).
  - Finding 6 asked to always focus into the sheet on open and into Beyond after its fade-in. Focus moves only when
    something had focus before (the keyboard path: `#cue`, a world label, `#more`); a wheel or swipe from the canvas
    leaves it on the body, because programmatic focus from there draws a focus ring on the button that the reference
    never shows. The stage is inert either way, so Tab reaches the sheet right after the top bar. Beyond reads the
    focus when its reveal starts: by the fade-in's end `#more` is hidden (finding 5) and Chrome has moved focus to the body.
  - Finding 9 offered hiding the terrain UI or scoping the scan to the globe; the UI hands off instead (hidden above
    `scanUI` .5, fading in below), so the frame never draws over it and nothing pops.
  - Finding 2 offered hiding the tag or flipping it; it flips, and hides only when both sides are blocked.
  - Finding 10: the chip's width is measured when its text changes; a graticule label's box is estimated from the
    mono advance (`shortcut:` comment).
  - Finding 15's rule (hemisphere after rounding) also went into `latStr`, `lonStr` and `fmtDMS`, which share the bug;
    the two "prototype behaviour" tests for it now pin the fixed behaviour.
  - `astro.ts` `marsLs` keeps its own `((x % 360) + 360) % 360` (round 1 code, not one of the three copies named).

- **Round 3 (parity fixes; see "Port parity fixes, round 3"):**
  - The stale coordinate preview is a reference bug too (its `clearTimeout` is also only on the valid path); fixed on
    purpose. No capture state differs: the harness fills the field in one input event.

- **Data module (Must 3):**
  - `?mock=nodem` is accepted but changes nothing: the mock always answers 422 `no_dem` for Moon points beyond 60°,
    as the engine does (the plan listed it as a mode). `?mock=slow` is 10 s per call (the plan named the mode, not
    its delay: the upper end of a pin search). `?mock=fail` rejects with a `network` error after the call's latency.
  - `standin.ts` became `pins.ts` (the pins stay; the ranking and its percentages are gone, as the plan's module map
    said). Pins no longer carry `doubles`; featured sites keep their curated `doubles` for the fallback page and the
    Rehearses lists only.
  - Hillshade images (`/images/...`) are not in the seam yet: nothing shows them before Must 4's cards and twins. Add
    `image(url)` then (engine: the absolute URL; mock: a hillshade drawn from the mock elevation, 2 s the first time).
  - The mock's target catalogue had 7 targets, not 6 (now 10, review fixes); its sovereigns list is the pool's states.
  - `rng` (seeded numbers) lives in `coords.ts` with the other small helpers; only mock data uses it.
- **Data module review fixes:**
  - Finding 1 offered two fixes; the mock takes the engine's (filters as a hard mask, fewer or no results), not cells
    placed to fit. Placing cells inside an arbitrary bbox would need a country for each point, which the mock can't
    know (Decisions 14). A "search this area" away from the pool's 19 cells comes back empty in the mock.
  - The four extra pool cells and their climate values are made up (plausible, labelled `shortcut:` in `mock.ts`);
    Haughton is Canada, `partner`, the NZ cell `partner`. Its sovereigns list now has 7 states.
  - Sub-resolution in the mock is decided by the target's diameter (< 0.6 km, spec §9); the engine decides by landform
    type (`landform_resolvability.csv`), and through the API no IAU type matches that table today, so the engine
    itself may never send `not_measurable`. The mock's case is there so Must 4's grey "not measurable at 200 m" can be
    seen.
  - Finding 7 offered "Shape match: high" inline or a visible column header: the column header was taken (the inline
    label at 12 px mono would wrap the country names), with the full "Shape match: High" as the row's accessible text.
  - Finding 6's "suggest autocomplete" isn't done: there is no target search box before Must 4. The unknown_target
    state offers the coordinate search only. (Since the part 3 review fixes it also offers "Find it by its IAU name".)
  - `start_failed` is a client error code (api.ts `ErrorCode`): the engine answers warming_up for good after a failed
    warm-up (`server.py _need_ready`), and only `/health` says `error`.
  - Try again isn't offered on warming_up (it retries by itself), no_dem (permanent) or unknown_target.
  - When a compare's search lands, the pair, maps and table (`[data-cmp]`) are rebuilt as one block (the minis redraw
    on the next frame) rather than cell by cell; nothing in that block is focusable.
  - Finding 13's suggested fix (flush once after the seek loop) became a task boundary after every step, so data that
    lands mid-seek is seen by later steps too (the detection frame reads the no_dem answer at its start).
  - `results-jezero` and `results-rima-hadley` now scroll the panel to its foot; their reference baselines were
    retaken with the same step (the reference shows its stand-in doubles there).

- **Results rework 1/4:**
  - "Slopes over 15°" in the compare table is an area (km² of the 18.8 km window), not a share in %: no percentages.
  - Show more is a button under the cards, not infinite scroll; the notes marker is a line-icon triangle, not "⚠"
    (an emoji on some systems).
  - The mock elevation changed from sine waves to value noise (its only consumer is the mock's images).
  - `results-jezero` and `results-rima-hadley` now scroll to the doubles, not the foot; on the reference the step falls
    back to the foot, so their baselines stand.
- **Results rework 1/4 review fixes:**
  - Engine prose isn't shown verbatim (Decisions 23): percentages as fractions everywhere, and a card's summary drops
    the engine's place prefix and landform-mix clause. `brief()` matches the summary shape of `engine.py` (and the
    mock's); another shape is shown whole with fractions. Ask the engine for fractions at the merge (Merge notes).
  - `results-rima-hadley` and `results-rima-hadley-detail` don't show the Rima Hadley fixture's results (its query is
    eva_training with sovereigns USA; the app sends rover_mobility without filters until part 3), so its US cells, the
    "Raised vs incised" gap, the polar note and the humid climate never reach a capture. Only the target and its
    capability are the fixture's. Part 3: add a state on the fixture's query (purpose EVA training, country USA). (Done: `ask-hadley`.)
  - Capture TODO for part 3: the grey "Not measurable at 200 m" (a sub-resolution target such as Shorty, by IAU name)
    and the rugged badge with "surface is likely vegetated" (purpose education, or surface any) need the target search
    and purpose picker; until then they are unit-tested and were probed by hand (Results rework 1/4). (Done in part 3:
    `targets-shorty`, `ask-education-rugged`.)
  - Finding 14's alternatives (the list above the detail, or the drawer and long sections under it) not taken: a skip
    link instead (Decisions 24).

- **Results rework 2/4:**
  - Compare's terrains, minis and table now come from 94 × 94 windows (the engine's grid) once landed, not the
    frontend's 192 × 192: the mesh and maps are a little coarser; the site view keeps its own extent at 192.
  - The mock's hillshades (cards and twins) are drawn from the frontend's terrain instead of value noise: Earth cells
    read nearly flat grey (Known limits under "Results rework 2/4").
  - `buildTerrain(i, T, exag)` takes a Terrain (was body, site, window); the compare minis' `data-map` carries `win`
    as its third field instead of the window's km; `mockEngine` takes the terrain as a third argument.
  - Globe compare: result markers are squares (the reference's are circles); `compare-globe` shows them.
- **Results rework 2/4 review fixes:**
  - Finding 2's first option (drop a transient failure from the cache) not taken: the redraw the failure triggers would
    ask again at once. Retries run inside the window's promise instead, every 3 s for a minute.
  - Finding 4/10's flip goes left only when the label fits there; otherwise under the marker. On the phone both
    selected compare labels now sit under their markers (the reference runs the Mars label across the divider), and
    `compare-globe` phone shows the faint established sites and the label under Jezero's marker.
  - Finding 6: the terrain overlay's engine note can't be captured at the harness's sizes (hidden under 520 px per
    viewport, prototype); probed at 1700 px.
  - Finding 9's placeholder is for the twins only; a card's 72 px tile stays empty on a 404.
  - Finding 11: no separate key line; the ring over the faint established-site circles is the key.
  - Finding 15: the mock's answer is still worked out when asked (the slow part is now 4 ms a window).
  - Two new mock modes outside the plan's list, for the capture only (Decisions 32).
- **Results rework 2/4 review fixes, round 2:**
  - Finding 1: the compare's Jezero and Rima Hadley windows moved (6.3 and 18.2 km) to their IAU centres, so
    `compare-jezero-salda` and the Hadley compares show other ground than before (and than the reference) and the
    compare status bar reads the window's centre. The site view is unchanged.
  - Finding 2: when no spot clears every marker (phone `compare-globe-tagged`) the label takes the spot covering
    fewest, not the finding's "current order" (which is now only the tie-break). The viewport inset is 11 px on every
    side (it was 11 px left and right only, none for the dropped label).
  - Finding 3: the twins no longer read `terrain_twins[0]` URLs at all (the windows are addressed by site and cell);
    `windowOf` still accepts the target image path (unused by the UI now, kept on the trust-boundary allowlist).
- **Results rework 3/4:**
  - The site and compare panels gain the purpose and filters form above the doubles, and the Mars and Moon body views
    the named-feature search (and a lede naming it), so every capture of those panels differs from the reference
    there (body-mars, body-moon, coord-*, site-*, compare-*, results-*). (Since the review fixes the form is hidden on
    the Artemis sites, where every search answers no_dem.)
  - `results-rima-hadley` keeps the default query (its reference baseline); the example's own query is `ask-hadley`.
  - The capture harness gains three step types (`select`, `wait`, positioned `wheel`); `wait` is real time, used only
    where a lazy chunk must load between two seeks.
  - `prunePins` and `clearPinTerrain` match any key with '@' (named targets are pins too), not only '/@'.
- **Results rework 3/4 review fixes:**
  - The form is hidden while a search answers no_dem (finding 9's first option) and also unknown_target (not asked:
    purpose and filters change nothing there either, and its copy points elsewhere).
  - Search this area draws no outline of the area on the globe (finding 13): the button's on-state, the panel's Area
    row and the scroll to it say what was set; an outline needs a globe overlay (do it with the overlay compare). On a
    phone the Earth pins still draw over the Earth viewport's caption (layering since the port; markers sit above captions).
  - On a phone the button is the magnifier alone (finding 13 asked for a shorter label; any text label fills the globe).
  - Featured-site copy keeps "Edit and press Enter to move the pin." (the reference's); only named targets changed.
- **Results rework 3/4 review fixes, round 2:**
  - Rima Hadley's default doubles are now the example's five US cells (Alaska, Nevada), then the derived ones
    (Hanksville 10th, Pilbara 12th): `results-rima-hadley` shows them (Decisions 45). The coordinates example's point
    (4.59° S, 137.44° E) likewise leads with its five for every barren purpose.
  - A filtered cell keeps its unfiltered scores (finding 2). The engine's `terrain_form`, relief, polarity and scale
    are ranks within the mask, so they rise a little under a filter there; the judge's likelihood and the shape
    cosine are per cell, as in the mock. Crowding (at most 2 within 200 km, off under a country or area filter) isn't
    modelled.
  - With the US cells now first, Rima Hadley's default cards show the stand-in terrain's blocky Alaska hillshades
    (62° N; already in `ask-hadley-results`); real Earth windows replace them under Real data.

- **Results rework 4/4:**
  - `dive-0.8s` shows the frame held on the globe, where the reference dives: the tap is a pin, whose search takes 6 s
    in the mock (Decisions 47). Every other state reaches the dive as before.
  - On a phone the frame's readouts sit over the globe's lower edge while held (as the reference's frame sits over the
    terrain on a dive) and "Reading Mars terrain" wraps to two lines. (Review fixes: a scrim in the grade's shadow
    colour behind them, on phones, during dives too.)
  - The frame's Terrain readout still says "Generating" (the Stretch row on static text); Matching carries the search.
  - ~~No warming indicator outside the search's own places~~: fixed in the review fixes (Decisions 53).
- **Results rework 4/4 review fixes:**
  - The phone's scan-row scrim also shows during dives (over terrain), where the reference has none: one rule for every
    frame on a phone rather than a held-only class.

- **Real data on the demo path (Must 5):**
  - Earth's elevation map is ETOPO1 (NOAA NCEI, public domain), not NASADEM: a 2K global map from NASADEM means
    aggregating ~14,000 1° tiles; ETOPO1's land comes from SRTM30. The site patches use Copernicus GLO-30, the engine's.
  - JPEG, not KTX2: the KTX2 loader adds a transcoder (JS and wasm) to the bundle for no change on screen at 4K; three
    builds the mipmaps. ~~Revisit with the performance item.~~ Revisited and kept: see Performance budget (Must 10).
  - Blue Marble Next Generation is GIBS's one composite, not "the current month": Visible Earth's monthly files moved
    (404) and GIBS serves a single BMNG.
  - The globes and every view built on real terrain differ from the reference on purpose (new maps, real crops, real
    relief, credit lines). The Lake Salda window floods at the lake's real level, which also floods lower ground at the
    window's west edge (one level, no outline).
  - The 14 established Earth sites' patches use their `sites.ts` centres; the engine's cells near them have their own.
  - (review fixes) The plan's "plus a polar cap" for the Moon globe is deferred to the Rendering "Poles" row (Must 8),
    which blends a polar stereographic cap into the planet shader; the LROC WAC south polar mosaic it needs is already
    fetched (`WAC_GLOBAL_P900S0000_064P.IMG`). Until then `moon.jpg` keeps the WAC mosaic's straight seams at ±90°
    longitude from ~60° S to the pole (in the source: its polar mosaic has the same quadrant seams).
  - (review fixes) The Moon globe mixes in Clementine (NASA/DoD, USGS mosaic), not only the plan's LROC WAC (Decisions 62).
  - (review fixes) Compare's 3D terrain note names the elevation model only (it is 30 ch wide); the owners, the
    Copernicus notice among them, are on the credit line under compare's table.
  - (review fixes) Lake Salda no longer floods lower ground outside the lake (the deviation above is fixed).
  - (review fixes, round 2) The Mars globe's large scale is TES's albedo (Decisions 68), so it differs from the
    prototype's map where Mars changed since Viking (Cerberus faint) and the caps blend in from 60–70°.

- **Booking flow (Must 6):**
  - The compare views gain the "Plan a test campaign here" button: with an established double (`compare-jezero-salda`)
    in a new row that moves the table down; with a result, in the jump row, now a button's height.
  - The dates can only be picked within the seeded 14-day window (Decisions 72).
  - The listing's strip is the double's orbital crops (cut from the Blue Marble globe for cells, the Landsat WELD crops
    for established sites; since the holistic review fixes WELD for the mock's 19 cells too) and an empty surface slot
    (since Should 5 a photo or a sentence saying why there is none); `media.thumbnail_url` is never set.
  - The plan's line icons (dates, team, equipment, permits, access: Should row under Rendering) aren't drawn.
- **Booking flow review fixes:**
  - The mock still names no airport (finding 5): a name for a seeded cell would be invented; the listing shows
    `nearest_airport` when the listing has it (tested on the Green River example).
  - `media.thumbnail_url` and `hillshade_url` aren't rendered (findings 5, 22): the schema has no credit for a photo,
    and the compare's twins already show the cell's hillshade; see Merge notes.
  - No capture of the over-long notes error: the field's `maxlength` stops typing and pasting at 1,000; the check stays
    as a guard and is unit-tested.
  - The dates group gets `aria-invalid` though ARIA 1.2 doesn't list it for a group (harmless; some readers announce
    it); the error reaches readers through each day's description. No `aria-required` on the group (unsupported):
    the form's first line says which fields are required.
  - Under warming_up, each 3 s retry shows the wait for the retry's moment before "Starting up…" returns, as the
    compare's doubles box does (a new search has no error until it answers).
- **Copy pass (Must 8):**
  - The intro lines, title blurb, info sheet, system heading, tagline, Beyond lead and the Earth view's lede and list
    head differ from the reference by design (the copy pass); every capture of them differs in text only. Since the
    review fixes the worlds' labels in the system view too (Decisions 86), and the credits footer has a third sentence
    (the Moon's 60° limit, Decisions 87).
  - (review fixes) A pin's lede and compare caption lose the prototype's brightness word ("Rolling, dark plains" is now
    "Rolling plains"); `albedoAt` is gone with it.
  - The system heading on phones now stops 18 px from the right edge (`right: 18px`), where the reference's ran to
    the edge's 42ch.
- **Logo (Must 7):**
  - Every mark differs from the reference by design (the new stand-in): favicon, top bar, title lockup, credits footer,
    info sheet, and footer step 1, which no longer orbits a coral arc round the mark: the mark develops in Bayer order
    from the start of the dissolve in (light dots over 1.2 s, the coral double 0.5 s behind) and holds, where the
    reference's mark dissolves in whole.
  - The favicon is set by `brand.ts` when the page's script runs (`index.html` has `data:,` until then, which also stops
    a `/favicon.ico` request); the app needs its script anyway.

- **Rendering pipeline and the opening (Must 9):**
  - Every state that shows a globe differs from the reference by design: AgX tone mapping, scattered atmospheres
    instead of rim shells and halos, bloom, the lens flare. (Review fixes: Earth's edge is a ~2 px line again, over the
    scattered limb.) Before the review fixes: Earth's rim is a blue scattered limb with a soft glow, where
    the reference's shells drew a crisp cyan-white line; the night sides are a little darker (AgX's toe).
  - The intro's gradient is now Earth's sky: a dark top, a blue band and a white glow over an orange limb at the very
    bottom; the reference's was a flat CSS gradient. From 9 s the sun rises over the horizon while the camera pulls back
    to the title: the reference cut from the gradient box to the limb shot.
  - (Superseded by the review fixes: the sun stays above the limb and the light leads the camera.) Between about 9.5 and
    10.5 s the pull-back passed close over the night side, where the 4K globe map shows soft.
  - The title's grain is per-pixel noise at .08 (the CSS's was fractal noise at .16); it moves outside `?capture` and
    reduced motion.
  - Beyond keeps its CSS ground (Decisions 90): the plan's row moves every ground into the scene; Beyond's is an opaque
    page over a stage that stops rendering under it.
  - The suns keep sprites beside bloom: the title's glare and core, the system sun's corona and glow. The plan's Sun row
    asks for an HDR disc that bloom picks up; the discs are (× 8 title, × 12 system since the review fixes), and the
    sprites carry the wide warm glare the reference had, which bloom alone (kept restrained so the planets don't haze)
    doesn't reach.
  - The system sun has no lens flare (Decisions 95), where the plan's Sun row gives the sun one.
- **Rendering pipeline and the opening, review fixes:**
  - The title sun's path is no longer a straight line in the scene: from the camera it is kept above Earth's limb
    (Decisions 99), so mid-move it sits elsewhere than the path's lerp would put it; the title's end frame is unchanged.
  - The dawn's light leads the camera (cubic ease out of the same tween, Decisions 100): Earth is lit through 10.5–11 s
    where it was backlit; the title's light is unchanged.
  - The night-lights map shows its lights only (Decisions 101): the Black Marble's moonlit base is dropped, so the
    night side is darker than in Must 9 (nearer the reference's).
  - Phones and other tall frames put the intro's horizon at ~2 % of the height (desktop ~8 %), so the bottom telemetry
    sits on the glow (Decisions 102); the reference put a flat gradient there.
  - The first-paint poster on #/ is the intro's first frame, not the title (Decisions 103); its sky is a CSS copy of the
    canvas's, within ~3 levels on phones and ~5–10 at desktop size (the canvas's glow is a little brighter toward the
    middle). It leaves out the telemetry corners, which fade in with the intro as before.
  - On the intro route Earth is drawn from the first frame (it faded in over 0.9 s), since the poster already shows its sky.
  - The ghosts sit between the sun and the frame's centre (.3, .55, .75 of the way), where they sat beyond it (.55, 1.7,
    2.1); the streak fades while the sun is within about a radius of a horizon.
  - On phones the system sun is still a large disc at the frame's edge (the tall layout's framing), now white-hot.
  - Phones render without SMAA (Decisions 96).
  - The bundle's start path grew 74 KB gzip (306 KB): postprocessing, 50 KB of it SMAA's embedded area texture.
  - The cap shows the WAC polar mosaic's own quadrant seams (in the source, as the globe's map).
- **Performance budget (Must 10):**
  - Laptops with a retina screen render below a pixel ratio of 2 (1.56 in a 1280 × 800 window, 1.39 at 1512 × 860;
    Decisions 108): the reference capped at 2. The interface is DOM and stays sharp; the globes and terrain are
    upscaled by up to 1.4. Phones and small windows keep 2. (Review fixes) Relief, glows and Earth look the same, but
    the graticule lines and terrain contours, about one buffer pixel wide, draw a little heavier and softer at 1.56
    than the reference's at 2 (`body-mars-zoomed-2x`, `site-jezero-2x`).
  - (review fixes) No KTX2 (the plan's "KTX2 textures through KTX2Loader"): the maps stay JPEG, decoded by the browser,
    mipmapped by three. No Basis encoder (`basisu`, `toktx`) on this machine, the transcoder would add JS and wasm on
    every device, and the maps fit: textures are 157 MB of the 288 MB peak (Decisions 109). Closes Must 5's "revisit".
  - (review fixes) Maps load per opening route, not per world when first shown: the start waits on the route's worlds,
    and every other map loads right after it (Decisions 111); since round 2 by need, in batches, and a site or compare
    route waits on its elevation too, so its start on Fast 4G is ~9 s (round 1: 4 s), on the poster (Decisions 113).
  - (review fixes, round 2) A world whose map hasn't landed draws in its mean colour, then turns to the map
    (Decisions 114); the reference waited on every map, so it never showed this state.
  - (review fixes) Terrain generation stays on the main thread (the plan's pitfall: a worker; Decisions 112), dropped
    for step 1 (Decisions 137; see Touch below).
- **Must list holistic review fixes:**
  - A target site's panel gains a row under the lede (the skip link, Decisions 115): the map and all below it sit
    ~40 px lower than in the reference.
  - A held globe's stars wheel about its body's axis at the time rate (Decisions 8): the reference's stayed put. The
    plan's open decision, taken at its lean; at 10 min/s Mars and Earth turn ~2.5° a second, the Moon ~0.1°.
- **Overlay compare (Should 1):** the compare toggle has a third button, Overlay, between Terrain and Globe, and
  in overlay mode a slider after a divider (the reference's toggle has two buttons). The reference has no overlay:
  its states are refNA.
  - (review fixes) On a phone the overlay keeps the site view's arrangement (a plated legend over the block's lower
    right, now a row per world without names; the two captions above the block), and its toggle sticks at the top of
    the sheet. (Round 2) There the block is framed smaller and up-left of the plate, and the plate shows the two rows
    only: the contour and exaggeration line is for screen readers (Decisions 123). The phone layout for compare and terrain belongs to the Touch item (plan, Should): this is the stopgap.
    Between 760 and 879 px wide the toggle wraps the slider to a second row (the reference has no slider).
- **Site selector grid (Should 2):** the reference has no grid (its states are refNA). The body panel of a target world
  gains a row under the lede (the link to the grid), so everything below sits ~40 px lower than in the reference; the
  system view gains a fourth cue, Featured sites, bottom left. The plan says the engine serves the grid's hillshades:
  it does for named targets and cells (and a target by coordinates' window, drawn from its elevation); the south-pole
  regions and the established analog sites are drawn from Eidolon's own elevation (Decisions 126).
- **Touch (Should 3):** the reference's sheet is fixed at 54 % with no grip: the build's has a 24 px grip on top, so
  the panel's content sits 12 px lower and the compare toggle 14 px lower. The phone's viewports end at the sheet's top
  edge (the reference's ran 28 px under it at half), so at half a globe draws ~8 % smaller and 14 px higher, and a
  site's terrain block draws smaller and left of its legend's plate (as the overlay's); compare on a phone stacks the
  pair (the reference's sat side by side, its legends under the blocks; now at their lower left, without the contour
  line). The refNA touch states are phone only.
  - (review fixes) On a phone's compare the contour and exaggeration line is for screen readers; the shared
    exaggeration shows on each terrain caption's line instead ("Mars, 18.8 × 18.8 km, 3× vertical"; the reference's
    captions have no exaggeration). Stacked globes draw ~135 px across beside their captions (the reference's side by
    side ~120 px). The gesture hints say tap and pinch on a touch screen (the reference's say click and scroll
    everywhere), and the site panel's credit line always names the terrain's source ("Terrain: illustrative." where it
    has none; the reference named none).
  - (review fixes, round 2) On a phone Search this area sits at the Earth viewport's lower left (the reference's at its
    lower right, under the selected pin's label in the stacked layout; Decisions 144).
  - (review fixes) Terrain generation stays on the main thread: the plan's pitfall (a worker) is dropped for step 1
    (Decisions 137, after 112). Not pending on Touch: the trigger is a real phone showing the curtain holding, which no
    step 1 run has; the merge should not assume a worker exists.
- **Weather window (Should 4):** the reference's week is sample wind from the sim date; the build's is the forecast from
  today (rain and temperature in each day's name and tooltip) with the best months under it, and the booking plan's 14
  days likewise. Under `?capture` the sample days show with "Sample weather: the forecast couldn’t be loaded." (the
  reference's line: "Sample data until the forecast feed is connected."), and the site view's best months read "Not
  available". The info sheet's Data column names the feeds (it said "NASA POWER, planned").
- **Surface photos (Should 5):** the reference's slot reads "Perseverance rover images. Linked in the build." (or "No
  surface imagery at this point."); the build shows the photograph, with a "Surface: …" credit in the strip's credit line
  (the strip's credit paragraph gets a line or two longer), or a sentence saying why there is none. Utopia's slot no
  longer promises Viking 2 and Zhurong images (Decisions 151). The info sheet's Data column has a Photos row.
  - (review fixes) Not taken from the findings: PIA24048 for Bockfjorden (finding 1's "worth checking"): it shows a
    RIMFAX radar test on a glacier somewhere in Svalbard (no place given, credited FFI), not Bockfjorden or its
    springs, and Decision 151 counts only a photograph of the named place; Bockfjorden keeps the sentence. Finding 6's
    "cx about .4" for the Dry Valleys: that moves the square left and cuts McKay more; .55 keeps him and the station.
    The Earth cell's "No field photographs of this area." stays as it was (not raised; a cell is no named place).
  - (review fixes, round 2) Findings 2 and 3 asked for "about 670 km" from the Utopia site to Viking 2: that comes
    from Viking 2's planetographic 47.97° N; the app's coordinates are planetocentric, where it landed at 47.64° N,
    134.29° E, 676 km away on R = 3,389.5 km, so the copy says 680. Finding 2's sentence ("Viking 2 landed 670 km
    east.") would drop Zhurong, which the lede names; the slot keeps both in 72 characters.

- **Progressive textures (Should 6):** the plan's full tier is 8K; the build's stays 4K (Decisions 152). The reference
  has no low tier and no loading line: for a few seconds after start the build's globes are its 1024 px maps
  (`system-maps-loading`, `body-mars-loading`), and the status bar's right shows "LOADING FULL-RESOLUTION MAPS" where
  the hint was. The footer's dithered globe samples its albedo from the low tier (the 4K map's 512 px read before).
  `site-pin-gale` and `site-pin-hadley` now show their pin patches, as their checks always said (a deep-link bug, fixed).
  - (review fixes) Finding 10's fix ("decode off-thread") taken but it doesn't get the swap under 50 ms: decoding was
    ~8 ms of the 131–136 ms long task on an M3; the rest is `texSubImage2D` copying the 32 MB map (CPU profile), which
    no decode option removes. ImageBitmaps decoded from the fetched blob would roughly halve it (the profile's upload of
    a bitmap: ~63 ms) but need every colour map uploaded unflipped with the planet shader flipping V and a second copy
    for the 2D readers (crops, Beyond, the albedo); left as a `shortcut:` in `scene/renderer.ts` for if the stutter
    shows on stage. One task per world, at the start of its crossfade (sharp still 0, so nothing visible changes in it).
  - (review fixes) Finding 7's suggested states waited `until: '#st-m.on'` on a site and a compare deep link; the line
    no longer shows there (finding 5), so they wait until their view applies (`body[data-view=…]`) and `expect` the
    line off. The phone rules they were to guard (the legends lifted under the line) were removed with it.
  - (review fixes) Finding 1's optional `patchFor` fallback to an already-loaded coarser patch not taken (Decisions 157).

- **Telemetry flash (Should 7):** the reference has no flash; the build's HUD readouts and intro telemetry flash coral
  as they change after holding (Decisions 162, 163), so `intro-2s` (the frame's counter at 02 / 03 just stepped) and
  `intro-6s` (the countdown's flash nearly out) differ from the reference there. Sim time's ticks at ×600 never flash,
  so `body-mars`, `body-moon` and `body-earth` are as before.
  - (review fixes) Finding 1's and 6's longer hold for the globe HUD not taken: no hold covers the Moon's local time
    (~3 s) or its sun elevation near noon; sim-time readouts flash on events and at Live instead (Decisions 163).
  - (review fixes) Finding 7's state is at the default ×600 on the Moon, not at Live: the cursor landing flashes its
    readouts at any rate now, and ×600 also shows the sub-observer and sub-solar not flashing.
  - (review fixes) `dive-earth` at 1.8 s shows the dot but not the frame's readouts ("Rehearses 2 target sites" in its
    check); the same on the commit before these fixes, so not from them; left for the detection frame's next pass.
- **Fallback without WebGL (Should 9):** `no-webgl` differs from the reference by design: the reference's `#gl-fail` is a
  one-line message; the page is the title as a poster over the site list. Round 1's CSS poster (the ground and a coral
  wordmark at the top) is replaced by the pre-rendered image under the title's own layout; the CSS ground stays under
  it until it loads. The reason sits in the title's blurb, not above the list. The copy pass's fallback lines
  ("Established analog sites: …" for every site, "These are known analogs, not search results: the search needs the
  full view") are gone: every site lists its search's doubles, and only no_dem sites their established analog sites
  (Decisions 167). Without WebGL a link changes the address and lands on its site's entry; there is no view to open.
  The meta row's "Earth, low orbit" is static, as the title's is until it is wired (Visual bugs, Stretch).
  - The south-pole regions answer no_dem at once in the mock (an error is answered at the fast latency), so only
    Mars's three sites searched by coordinates take 6 s each; `no-webgl-list` shows the Moon complete.
  - A deep link to a site near the end of its column (Utopia, Meridiani, Elysium) lands as high as the page scrolls,
    not at the very top. (review fixes) The deep-link states moved to Gale with `mock=slow`, where the hold shows.
  - (review fixes) Finding 1's no-WebGL half (a click on the current route's link lands on its entry again) is not
    taken: finding 11 asks that a click never move focus or scroll, and the clicked link is always in its own entry,
    on screen. Such a click changes nothing; a pasted link, back or forward lands.
  - (review fixes) Finding 12 asked for the curated analogs on a failure for the polar sites; every site gets them: all
    fifteen have established analog sites, static, and with the engine down they are the page's only doubles.
  - (review fixes) Finding 13's capture: the harness's `scroll … to` ignores `scroll-margin`, so `no-webgl-list` taps
    the button instead, with a real 1.5 s wait (smooth scrolling isn't on the app clock); the reference run has no
    such button (refNA).
  - (review fixes, round 2) Finding 1's second option (on booking routes, keep the panel working over the dead stage
    with the reason as a banner) not taken: each booking step is a route, and the router stands down after a lost
    context (its views drive the dead scene), so Review and Request couldn't move on; the first option keeps the plan
    across the reload the page already offers.
  - (review fixes, round 2) Finding 2's grid guard is in `views/grid.ts shown()`, not in `askGrid` and `fillGrid`
    each: both, the queue's loop and its retry start with it; and the held dive in `views/site.ts`, not named in the
    finding, is guarded too (it froze the same way, `context-lost-pin-held`).
- **Beyond imagery (Should 8):** the reference's painted scenes (airships over Venus's clouds, a Mercury mine, a
  Callisto base under Jupiter, a Titan shoreline) are gone: `beyond`, `beyond-held` and `beyond-cards` differ from the
  reference in the four frames (dotted discs, each with a caption line under it, 22 px more per card), by design
  (Decisions 164). The frames' canvases are sized to their box (they were a fixed 560 × 315). `#beyond` scrolls when its
  content is taller than the window (the reference clipped it above 620 px tall). `scripts/extract-textures.mjs` removed (Foundation
  line amended), so the prototype's textures can no longer be re-extracted; none is used.
  - (review fixes) Finding 7's two-line caption is scoped to the four-column band (1001–1199 px wide, over 620 px
    tall), not every card at every width: elsewhere no credit wraps (Decisions 165).
  - (review fixes) `beyond-cards` has no `expect` that all four canvases are drawn (not `aria-hidden`): the reference's
    painted canvases are `aria-hidden`, so it would fail the reference run; `beyond-late` (refNA) carries the check.
  - (review fixes, round 2) The finding's fix was a breakpoint, `(max-width:1000px)` and about `(max-height:720px)`, on
    the labels' `display:none`. Not taken: the clearing height grows with the width, so 720 still let the cards into
    the labels at the finding's own 1536 × 730 (and up to 741 at 1536, 800 at 1920, 945 at 2560), while two columns on
    a tall window (1000 × 1600) clear them. Measured instead (Decisions 166). No capture state shows it: the harness's
    viewports are 1280 × 800 (labels clear, shown) and the phone (hidden by the phone rule); the opt-in tablet
    viewport (`--viewports=tablet --states=beyond-cards`, 768 × 1024) hides them.
- **Accessibility pass (Should 10):** `--text-3` is #80868E, not the plan's #6C727A (Decisions 169), so every label,
  caption and secondary line is a little lighter than the reference's; the graticule labels too (.8, was .55, and a
  solid 1 px dark edge for the reference's soft halo: review fixes, round 2, Decisions 171), and the
  HUD's labels (.9, was .75). Inputs show the white focus ring as well as their brighter border. The doubles box is no
  longer `aria-live` (Results rework 1/4 review fixes, findings 7 and 21, made it so): `#live-s` says the search instead
  (Decisions 169). Not tried with a screen reader: axe, the accessibility tree (Playwright) and keyboard probes only.
  - (review fixes) Finding 7's second half not changed: zoomed in (+), the globe's HUD reaches past its viewport and its
    left readouts already run under the panel; the frame's left edge crosses what shows of them. Moving the frame or the
    HUD for it would break the frame's one rule (6 px inside the viewport). Finding 9's grid skip link at 390 px covers
    the logo and the time toggle's Live button while it has the focus (`a11y-skip-grid`, phone): a skip link sits over
    the bar it skips, and the next Tab, onto the logo, hides it; the label stays whole rather than a phone-only short one.
- **Share and meta (Should 11):** fonts ship latin and latin-ext only, where Google also served cyrillic(-ext),
  vietnamese and Geist Mono's box-drawing subset: text in those scripts falls back to the system's faces (none in the
  copy or the engine's English country names). Link previews are one static card for every route: hash routes never
  reach a server and scrapers don't run scripts, so `document.title` per route shows in tabs, history and bookmarks
  only. The no-WebGL page keeps the static "Eidolon" title (it isn't routed).
  - (review fixes) Finding 2: the copied link is the route alone; the purpose, filters and searched area stay session
    state (Decisions 36), so a compare of an engine cell found under another query opens for its recipient without
    the cell's detail, twins and Plan a test campaign here (`shortcut:` at `ui/panel.ts copyLink`; upgrade: the query
    in the hash, parsed and checked on load). Featured sites, established doubles and default-query cells open whole.

- **Rendering and visual-bug Should rows (Should 12):**
  - Beyond's reveal is drawn once and revealed on the compositor, not with GPU lines (Decisions 179).
  - The drape is on the site view's real-terrain blocks only (21 sites): not on compare's windows, pins, procedural
    sites or engine windows (Decisions 176); three Earth drapes (Svalbard, the Dry Valleys, Lanzarote) are Blue Marble's
    500 m, soft at 16–30 km.
  - The terrain appears .24 s earlier in a dive (the swap at the old curtain's start, Decisions 177).
  - `--grade-earth` and `--sky-earth` (the plan's design table) are retired for per-ramp palettes (Decisions 178).
  - The terrain's light has a fixed height, and the 2D map keeps its own 2.5× relief rather than the block's (Decisions 181).
  - (holistic review fixes) Compare is lit from the twins' north-west, not a site's sun (Decisions 185).
  - Contour labels aren't hidden behind ridges (`shortcut:` in `ui/terrain-ui.ts`).
  - The wordmark against the blurb near 1,000 px needed no change (already clear in the build).
  - `npm run perf` measured bundle and memory only; first paint and frame rates not re-measured.
  - (review fixes) Level of detail is a cap: a mesh takes at most 512 samples a side (128 on phones) at every
    distance, every k-th sample (`meshIdx`, `shortcut:` there), not tiles by distance; so a close-up shows no more than
    a far view. No desktop block passes 512 yet (Jezero's 336); phones do run it.
  - (review fixes) The swap's crossfade holds one still at half size, not two live render targets: the outgoing frame
    is a little softer for the .69 s (Decisions 177).
  - (review fixes) The detection grade covers what the bodies and blocks cover, not the whole frame (the grounds and
    the dive's sky keep their colours, Decisions 178). On compare it is one pass in the target's palette over both
    viewports, so the Earth double's block is graded in Mars's or the Moon's colours (the frame acquires the target);
    and it skips a compare where only the double changes (Decisions 182), though the plan's bug row lists compare.
  - (review fixes) Contour labels: none on narrow viewports (every phone) or on the overlay compare (two worlds'
    contours: a label wouldn't say whose); they give way to the terrain overlay's own boxes (caption, arrow, toggle,
    legend, note), not in the globe's label pass, which never shares their viewport.
  - (review fixes) Water: the token's #1F3D52 to #335C75 "by hillshade" is by distance to the shore (#335C75 at the
    shore, #1F3D52 offshore), with a fresnel toward the sky's grey-blue and the sun's glint on fine ripples.
  - (review fixes) Eidolon-1 is lit from the title's sun as composed (`sunPos`, moving with the dawn), not the real
    solar direction: the shot's sun is placed for the frame, and the model lit from elsewhere would contradict the
    flare beside it.
  - (review fixes) Beyond's labels hide wherever a card can reach them (Decisions 166) rather than move: never on
    phones.
  - (review fixes) The title's annotations fade out over the first eighth of a screen of scroll; the reference scrolls
    them away with the text (`footer-step*` show none either way).
  - (review fixes) The detection frame's readout row hides in a viewport under 240 px tall (a phone's stacked compare);
    "Site acquired" reads right of the dot near the viewport's left edge, with a dark edge.
  - (review fixes, round 2) On compare the frame has no readout row at all (it ran under the view toggle, and its
    "Matching" line is the site view's): the dot, "Site acquired" and the grade only.

- **Sun-angle slider (Stretch 1):**
  - The control is in the panel under the site map, not over the block on the stage (Decisions 186).
  - Opt-in by a checkbox: the relief light stays the default (Decisions 181, 186).
  - Not on compare: the twins' 315° holds there (Decisions 186).
  - Shadows: the block's edge is the horizon, nearest samples (`shortcut:` at `mesh.ts sunlit`); shadowed ground keeps
    the ambient (dim, not black).
  - The Moon's subsolar latitude is now real (±1.54°, was 0): the Moon globe's terminator and the Moon sites' relief
    light move by a degree or two (more in azimuth at the pole); the Moon captures shift slightly.
  - The hour and date are session state, not in the route (`shortcut:` in `ui/sun.ts`).
  - (review fixes) Finding 9 expected a sun below the horizon to leave the block and map at the ambient: low ground,
    yes; Malapert's summit stays lit at midnight (its horizon dips 4.3°), which is physical, so kept and said in the
    panel (Decisions 187).
  - (review fixes) Draped under a set sun, the image is darkened by that sun (Decisions 187); its own shadows remain.
- **Slope hazard layer (Stretch 2):**
  - The plan says "tint slopes over 15°"; the ground under the tint also greys (a quarter of its colour kept), since a
    coral tint alone doesn't separate from Mars's ramp (Decisions 188). The stage legend drops its ramp while on.
  - (review fixes) Compare is tinted too, with its own checkbox under its table (Decisions 188); it was site-only.
  - The brief's scale correction is "18.8 km / grid size"; the code spaces samples `ext / (N − 1)`, the repo's edge to
    edge convention (`heights`, `demHeights`, the map and the mesh all place sample 0 and N − 1 on the window's edges):
    202 m for the engine's 94 over 18.8 km against its 200 m pixels, slopes about 1 % shallower (Merge notes).
  - Outside the item: `scripts/fetch-real-data.mjs` (GLO-30 sampling clamped to the tile) and Meteor Crater's 4 km patch
    refetched, a pre-existing hole along a tile seam that the layer made plain.
- **Profile and measure (Stretch 3):**
  - "Draw a line on the map": a mouse drags (or clicks each end); touch taps each end rather than dragging, so a finger
    on the map still scrolls the sheet (Should 3; Decisions 189).
  - The line shows on the map only, not on the 3D block.
  - The map's caption moved from `ui/panel.ts siteMedia` into the measure block (`ui/measure.ts`), since measuring
    changes what a click does; off, it reads as before.
  - The body is a sphere of its mean radius (the plan's "on the body's radius"): on Earth and Mars up to about 0.5 % off
    an ellipsoid's geodesic (Known limits).
  - (review fixes) Findings 3/4 asked for the result in view on a phone after a line completes: a tap's completion
    doesn't scroll the sheet (the length shows on the map by B instead; the chart stays a swipe away), a typed line's
    does (Decisions 189). Over the slope tint the line is pale, not coral.
- **Landing ellipse (Stretch 4):**
  - Artemis HLS's preset is a circle 200 m across (its requirement: within 100 m of the target), not an ellipse; at a
    60 km site it draws as a dot under the crosshair, and its share over 15° is of the ground around it (said).
  - "Shows the fraction of the ellipse over 15°": as a decimal fraction ("0.06") with its km², not a percentage
    (Decisions 23, 190).
  - The ellipse sits on the site's centre (no placement of its own) and on the site view only, not compare
    (Decisions 190; `shortcut:`).
  - Apollo 11's size is cited second-hand (a 2007 book and NASA slides whose text couldn't be extracted here, both as
    cited by Wikipedia); the other three from NASA's own pages or PDF text.
  - (review fixes) An ellipse too small to see is drawn larger than its true size, a ring round its true-size dot (said
    in the fine print). Finding 7's suggested derivatives (the plan position's, with r's gradient) would still read the
    draped facets; the edge is measured on level ground instead. The caption's outline is 14 px with its margins, as
    asked, but centred under the dot (a −2 px left margin) rather than starting at its left edge.
  - (review fixes, round 2) The finding's option (b), not (a): the Mars ellipses keep the site's centre on their own
    sites too, said in the fine print with where each mission landed, since neither ellipse's published centre could
    be found (Decisions 190).

- **My campaigns (Stretch 5):**
  - A dialog from the top bar, not a route: no deep link to it (Decisions 191); a reload closes it.
  - The top bar changes on narrow screens to fit it: below 1,100 px its button is an icon (the crumbs keep their room);
    at 479 px and under the UTC clock shows the time without the date and the count is a badge on the icon (review
    fixes; it was hidden); at 380 px and under the bar's gaps and the rate buttons' padding shrink (the bar had run 14 px
    past its gutter at 360 px). Where the crumbs still run short, the site's and double's names ellipsize; below 1,100 px
    "Solar system" leaves the trail after a world, and below 880 px the site's and double's leave it unless current
    (review fixes).
  - (review fixes) Three departures from the Design system's panel: the dialog sits under its button at the right, not
    as the 360 px panel on the left (the panel holds the current view's content, a booking step under it; a list
    opened from the top bar's right drops from there); on a phone its sheet runs up to 80% of the height, not the
    panel sheet's 54% half snap (a short modal list with no peek or snaps to drag between: two campaigns fit without
    scrolling); its motion is the panel's and the info sheet's timings on a fade-and-drop (desktop) and a slide
    (phone), by CSS, not GSAP (the native backdrop is out of GSAP's reach, and `?capture` turns CSS motion off). Its
    way out animates only where a closing dialog can stay on top (Chromium's `overlay`); elsewhere it goes at once.
  - Requests in `localStorage`, plans still in `sessionStorage` (Decisions 168, 191); a request made before this item
    (kept in the session, without its names) isn't read back.
  - The confirmation of a campaign with a request renders from the request alone, ahead of the double's search (the
    other steps still wait for it); its lede names the target as the site does ("Pinned site" for a pin).
- **Earth clouds on the title (Stretch 6):**
  - The clouds show through the intro and sunrise too, not only once the title is framed: one shot, one value
    (`G.title`); backlit in the intro they stay dark until the dawn reaches them (Decisions 192).
  - The blurb gains a soft dark scrim under its lines on wide layouts and the title's SVG labels a 1 px dark edge: new
    on the title, for text over cloud (Beyond's hero and the HUD already do the like). The link preview hides the scrim
    with the paragraph it shades.
  - A 2K map, NASA's own web size, not the 8K the plan's Placeholder table names for the globes: the GPU budget.
  - Cover only: no cloud shadows, no parallax, one static 2002 composite drifting at one rate.
  - (review fixes) The title's ghost button ("Replay intro") has a translucent ground, the scrim's colour at .5, where
    every other ghost button is unfilled: over the clouds when the title is scrolled to the credits (Decisions 193).
    `og.jpg` wasn't remade for the meta row's dark edge: over the preview's dark ground it doesn't show. (Remade at
    the hand-off, for the meta row's new "Low orbit over …"; the two posters came out byte-identical, not stale.)

- **Final review fixes, round 1:**
  - The plan's Stars row (Stretch: a bright-star catalogue, a faint Milky Way band, oriented to the real sky) is not
    done: the stars are still the prototype's 1,400 seeded points. Every other Stretch row is.
  - Five featured targets (Utopia, Arcadia, Meridiani, Elysium, Taurus–Littrow) keep illustrative terrain: Must 5
    covered the demo path only, and adding them takes a networked `npm run fetch:real -- --only=sites` run.
  - As before and recorded: textures JPEG, the full tier 4K (Decisions 109, 152); terrain on the main thread and a
    stride cap for level of detail (Decisions 112, 137); the lens flare on the title's sun only (Decisions 95); the logo
    an in-house stand-in (Must 7).
  - The detection grade is masked by alpha to the bodies and blocks, not the whole frame (Should 12's tick now says so).
  - The no_dem cutoff is the engine's 59.5° (Decisions 197); the copy keeps the spec's 60°.

## Merge notes

- **Data seam, engine mode** (Must 3): `http.ts` was never run against the engine (none runs in step 1); its paths
  and error mapping are unit-tested with a stubbed `fetch`. To merge: start the engine, set `VITE_DATA=engine` in
  `.env`, run the full capture and the probe flows (featured site, pin, compare, `?mock` states have engine
  equivalents: stop the engine for `fail`, restart it for `warming`). The base URL is `API` in `http.ts`: `VITE_API` at build
  time, else `http://127.0.0.1:8000/api/v1` (gap 6 decides where the demo server runs; set `VITE_API` for another host
  or port, EIDOLON_HOST/PORT). Requests time out at 60 s (the engine's worst case for a pin, a transient remote-DEM
  failure read three times with 10 s of sleeps, is about 40 s). Responses are typed, not schema-checked at runtime (both
  repos test the contract); strings from the engine are escaped where they enter HTML. `/health` is asked at boot
  (`app.ts` `pollHealth`) and every 3 s while it says warming_up, which drives the top bar's "Search engine starting
  up…"; after a search's warming_up its `uptime_s` drives the warm-up bar (Results rework 4/4). An engine build still bundles the mock's fixtures (~3 KB gzip): drop `mock.ts` or import it dynamically
  at the merge.
- **Engine data the mock imitates:** derived results reuse the examples' 15 cells plus four made-up ones (Hanksville,
  Pilbara, Haughton, a rugged NZ cell) and a size rule for sub-resolution targets; at the merge every result is real.
- **Review fixes, engine side:** `http.ts` checks only that a search answer has a `results` array (anything else is
  `bad_response`); a warming_up whose `/health` says `error` is shown as `start_failed`; client bugs
  (invalid_request, unknown_purpose) are logged with `console.error`. The warming retry re-asks the search every 3 s
  and asks `/health` after each warming_up.
  `search` sends `{target, purpose, k}` with `target` `{body, name}` (featured IAU name) or `{body, lat, lon}`.
- **Results rework 1/4, engine side:** thumbnails load `terrain_twins[0].earth_url` as `API` + the path after
  `/api/v1` (`imageOf`); a 404 `no_image` removes the img and leaves the empty tile. Only `/images/site/{digits}.png`
  and `/images/target/{mars|moon}/{name}.png` are accepted. Engine summaries and the capability caveat carry
  percentages ("flat 42%", "for 53% of targets"); the frontend writes them as fractions (and "0.9x" as "0.9×") and drops the
  summary's place prefix (cards and detail) and landform-mix clause (cards) by matching `engine.py`'s summary shape
  (`brief`, `unplace`, `fractions` in `ui/results.ts`). Ask the engine to phrase them as fractions; if the summary's
  shape changes, update `brief` and `unplace`.
  `percentile_earth` appears only in the drawer, as the raw number. Check that `capability` arrives on `target` in
  every search response (the banner reads `res.target.capability`).
- **Engine commit** of the copied contracts: see `contracts/ENGINE_COMMIT` (bundle README says engine code @ `ec4e20b720`;
  health example reports `engine_commit: bc9477e`).
- **Gap 1 (raw elevation) looks closed engine-side** (wired in Results rework 2/4, see Compare window below):
  `server.py` lines 272–310 serve `/api/v1/elevation/...` returning
  `{size_px, pixel_m, extent_km, units:"m", row0:"north", col0:"west", z:[[…]]}` (null = no data). No example fixture
  exists in `contracts/examples/api/`; the hand-written type is in `src/data/api.ts`. Ask the engine to add an example.
- **Schemas cover** match_result, site_listing, target, and the API envelopes `search_request`, `search_response`,
  `target_summary`, `targets_list`, `error`. **No schema** for `/health`, `/purposes`, `/sovereigns`, `/elevation/*`:
  hand-typed in `src/data/api.ts` from the spec. No `/sovereigns` example fixture either.
- **Error fixtures** carry an extra top-level `status` (HTTP code) next to `detail`; the real server sends only `detail`
  with the HTTP status. The mock uses `status` for the HTTP code and returns only `detail` as the body.
- **Two "Target" shapes:** `contracts/target.json` (legacy, ids like `mars-jezero`) vs `api/target_summary.json`
  (`mars:Jezero`, used by the API). The frontend uses `TargetSummary`.
- **Engine data that the frontend may use later** (read-only, don't copy wholesale):
  - `targets/targets.json` (1.5 MB): all 10,100 IAU targets `{body, name, type, code, lat, lon, diameter_km}`. A trimmed
    copy would let the mock answer `/targets?q=` autocomplete realistically.
  - `targets/results.sqlite` (42 MB): precomputed judged top 20 per target (gzip JSON). Could generate more mock fixtures
    for the featured sites (Jezero, Gale, Rima Hadley, …) with a one-off script; needs Python, not run here.
  - `grid/` (country/access per cell), `index/` (2.2 GB fingerprints), `judge/`, `weights/`: engine-only, nothing for the frontend.
  - No hillshade PNGs are stored; the server renders them from DEMs on request. No site list endpoint (500,127 cells).
- **Product name (gap 5, Copy pass):** no fixture says "MoonBnb" (the engine says it only in docstrings); every
  engine string the UI shows goes through `eidolon()` (`ui/results.ts`), which maps it to Eidolon (the detail's
  Matches and Differs lists too, since the review fixes), and the build's copy check (`scripts/check-copy.mjs`) fails
  on the word in the bundle and in the JSON shipped beside it. At the merge, check a few live summaries and
  caveats; if the engine implements `site_listing`, its free text already goes through the guard. Purposes: the
  frontend shows its own label and line per key (Decisions 83); a new engine key shows the engine's, a renamed key
  needs its row in `PURPOSES`.
- **Compare window centre (round 2):** a named target's window is labelled at `res.target.lat/lon` (`centreOf`),
  which must be the centre `/elevation/target/{body}/{name}` and `/images/target/...` use (`server.py
  target_elevation`: the IAU centre). If the engine ever centres those windows elsewhere, return that centre in the
  search response's target and nothing here changes.
- **Compare window (Results rework 2/4: wired):** compare reads both sides through `terrainOf` (`data/client.ts`):
  `GET /elevation/target/{body}/{name}` for featured targets, `/elevation/point/{body}?lat=&lon=` for the others and
  pins, `/elevation/site/{cell}` for an Earth pin (the cell from the result's `site_id`); the frontend's terrain until
  it lands and where there is none (established Earth sites, no_dem, failures). With `VITE_DATA=engine` it is real at
  once; `Terrain.engine` changes the terrain note and drops the table's stand-in line. Check at the merge: the swap
  from illustrative to real terrain happens without the curtain (Decisions 27; consider the curtain then, the jump is
  bigger than in the mock); the engine's windows have no example fixture (the mock's shape is the spec's); no-data
  samples are drawn at the window's lowest height; the frontend spaces 94 samples over 18.8 km edge to edge (202 m),
  the engine's pixels are 200 m (1 %). Both twins are drawn client-side from these windows in every mode (round 2);
  the engine's 188 px PNGs show only as card thumbnails.
- **Hillshade contrast (review fixes, revised in round 2):** the frontend stretches every hillshade it draws to its
  own 2nd–98th percentile (`data/hillshade.ts`, Decisions 30), and draws both twins itself from the engine's elevation
  (Decisions 34), so the twins need no engine change. The engine's PNGs (`server.py _png`, 1×) now appear only as the
  72 px card thumbnails, where gentle windows come out near-uniform grey: optionally ask the engine to stretch `h`
  before `* 255` (one line). Stretching the 8-bit PNG in a canvas instead would posterize gentle windows and lose the
  thumbnails' lazy loading.
- **Elevation retries:** warming_up and network failures of `/elevation/*` are asked again every 3 s for a minute
  (`data/client.ts ask`); confirm the warm-up time against a real start. `?mock=asengine` shows the engine-mode copy on
  mock data (terrain note at viewports ≥ 520 px, twins' note, no stand-in line).
- **Late textures:** `onLateTexture` (scene/renderer.ts) → `onAsset` (app.ts) is the one hook for any texture that
  lands after start; per-body lazy loading and the KTX2/8K maps (Should: progressive textures) should report through it.
  (Must 10 review fixes: every map outside the opening route's worlds now lands through it, `loadTextures`.)
- **South pole (gap 2):** the curated analog rows on the Artemis sites appear only while the engine answers no_dem
  (`knownOf`); once it serves LOLA polar DEMs those sites get real results and the rows go away by themselves. Their
  copy says the search can't score them, which stays true only while no_dem is the answer.
- **Fallback page:** `ui/fallback.ts` (no WebGL, a failed start or a lost context) lists each featured site's own
  search through the data seam (Should 9, Decisions 167), so at the merge it asks the engine like the site view: five
  named searches from its cache at once, Mars's three by coordinates one at a time (5–10 s each, remote DEM reads),
  the four south-pole regions no_dem; a warming engine is asked again every 3 s. Check once with `VITE_DATA=engine` and
  WebGL off (the `no-webgl-*` states). The poster (`npm run poster`) is regenerated by hand after the title's scene
  changes. (review fixes) The "reads Moon terrain only within 60° of the equator" line is in the no_dem entries only, so
  polar DEMs in the engine remove it with the curated rows; a failed search still shows the curated rows (`no-webgl-fail`
  with the engine stopped). (review fixes, round 2) With the engine, the page's searches by coordinates are real requests: run
  `context-lost-pin`, `-held` and `context-lost-book` with `VITE_DATA=engine` (an aborted `fetch` rejects as the mock
  does, so the dead app asking none is what keeps them from calling each other off).
- **Purpose, filters, targets (Results rework 3/4):** `GET /purposes` and `GET /sovereigns` fill the form (checked:
  strings only, supported only when `true`); a sovereigns failure (warming_up) leaves "All countries" and is asked
  again on the next panel render. `filters` is sent only when one is set, as `{sovereigns: [one], bbox, access:
  ['partner'], exclude_polar: true, surface: 'any'}` (validated against `search_request.json` in the contract tests);
  the bbox never wraps the antimeridian (engine.py `mask`). Autocomplete calls `GET /targets?body=&q=&limit=8`; the
  engine lists satellite craters the mock lacks. Named targets search `{body, name}` and ask
  `/elevation/target/{body}/{name}`; their window centre is the answer's `target` (as for featured sites).
- **Purpose and filters, round 2:** the mock now behaves as `engine.py search` / `api.py cache_key` read: the barren
  purposes give the same cells, a filter only removes cells. At the merge, check on Jezero that Rover mobility and
  Drilling / ISRU return the same `site_id`s (with `purpose` echoed), and that Exclude polar or an area round the
  first double keeps it first; its form-property scores may shift under a filter (ranks within the mask, Deviations),
  which redraws the compare's detail once the answer lands (its key is the query).
- **States by source (Results rework 4/4):** `search(req, signal)`: `http.ts` passes `AbortSignal.any([signal,
  AbortSignal.timeout(30 s)])` (Chrome 116, Safari 17.4, Firefox 124); an abort rejects as `aborted`, never shown.
  FastAPI doesn't stop a sync handler when the client goes, so an aborted pin search likely still finishes in the
  engine (and lands in its cache): check its log; if a burst of pins stalls it, queue instead (Decisions 48). The
  warm-up bar reads `/health` `uptime_s` against 40 s: time a real start. The loading state is chosen from the request
  (Decisions 49): a named search that misses the engine's cache shows the late skeleton, which is right.
- **Site projection:** the frontend draws site maps, crops and pin terrain in a spherical azimuthal-equidistant
  projection centred on the site, north up (`coords.ts` `llToLocal`/`localToLL`). The engine compares windows "on a
  local projection" (spec); confirm which one and its row order (`row0: north`) so engine elevation and hillshades
  line up with the map and footprint at the merge.

- **Real data (Must 5):** in engine mode the engine's windows replace the mock's, but the site views (a featured site's
  own extent), the established Earth sites (no engine window) and the polar cap stay frontend patches; an engine cell
  outside the mock's 19 shows the bump-map stand-in until its window lands, as before. The engine warps with R 3,396.19
  km on Mars, the app with 3,389.5 (0.2 % in scale, invisible). If the featured sites move (Decisions 10, 39),
  `real-sites.test.ts` fails until `real-sites.ts` follows and `npm run fetch:real -- --only=sites` is rerun. A pin's
  terrain width is `PIN_KM` in `real-sites.ts` (the pin patches are sized on it): change it there and rerun the same.
  (Holistic review fixes) Real crops exist for the mock's 19 Earth cells only (`crops/earth-cell-*`): engine cells
  past them fall back to the cut from the Blue Marble globe. For the stage, add the cells the stage targets' engine
  searches return to the script's cell list (it reads the examples and `MADE_UP_CELLS`) and rerun `--only=sites`; or
  crop from GIBS in the browser (one WMS export per crop, about 1 s).

- **Booking flow (Must 6):** frontend-owned; nothing reaches the engine. If the engine implements `site_listing`
  (gap 4), point `data.listing` at it: the listing UI reads only schema fields plus the result's `location` and
  `environment`; check its "Unnamed area near <place>" names read in `ui/booking.ts` `named()`. If it adds a cost,
  drop `dayRate`. The weather window's seam is `data/weather.ts` `weather(siteId, from, n)` (Should: Open-Meteo).
  A real request service (none planned) would replace `request()` in `data/booking.ts`.
- **Booking flow review fixes:** the weather seam now takes the place (`weather({id, lat, lon}, from, n)`; the booking
  flow passes the listing's coordinates) but is still synchronous. Open-Meteo is an async browser fetch: load the
  window once per site and day (cache it in `data/weather.ts`), render the days' placeholders until it lands, then
  `refreshPanel()`; callers are `windowOf` (plan, dates summary, review, the day click) and `panel.ts wx()`. If the
  engine implements `site_listing`: `media.thumbnail_url` needs a credit line before it can show (the surface slot of
  the strip, which since Should 5 shows the frontend's own photos, `data/photos.ts`), `hillshade_url` duplicates the
  compare's twins; `known_analog.citation` and `protected_area.name` already
  show. The established sites' `country`/`access` are copied from the engine's grid as of this commit: re-read them
  if the grid changes.

- **Performance budget (Must 10):** measured on the mock build only (`VITE_DATA=mock`: its mock-only 71 KB targets
  chunk loads on demand, and the walk's compare `#/mars/jezero/compare/salda` is a fixture). After the merge rerun `npm run perf`
  on the engine build (`VITE_DATA=engine` in `.env`, engine up and warm; it builds first) and check that the JS fetched
  to start stays under 350 KB gzip and the peak GPU memory under 300 MB (the engine's windows add terrain and crops);
  if the engine's compare route differs, change `WALK` and `ROUTES` in `scripts/perf.mjs`. First paint and the app
  start don't wait on the engine (no request to it holds the start), so they should hold.
- **Site selector grid (Should 2):** with the engine, a world's grid sends one search per featured site: by name from
  the cache (ms), by coordinates one at a time (Mars's three, 5–10 s each, so its last card fills after 15–30 s; the
  Moon's four south-pole regions are refused at once, no_dem: since the final review fixes the client refuses a Moon
  search or `/elevation/point` by coordinates beyond 59.5° itself, sending nothing, as the engine's `target_window`
  would otherwise retry its remote read 3 times, 5 s apart, before its 422; the mock's cutoff is 59.5° too, as
  `windows.py`). Named targets' hillshades come from
  `/images/target/{body}/{name}.png` (`targetImage` builds the path, names percent-encoded: check "Utopia Planitia"
  and "Taurus Littrow Valley" load); the three Mars targets by coordinates draw theirs from `/elevation/point`, asked
  in parallel with the chain: if the single worker queues them badly, ask them through the chain too. If the engine
  gains polar DEMs (gap 2), the south-pole cards turn to search results and engine windows by themselves (the
  established sites and own hillshades are only for no_dem). (Review fixes) Every grid tile is `loading="lazy"`; with
  the engine the browser fetches only the site images near the view (18 per world, 1–3 s each on its one worker the
  first time): check a phone scrolled to the foot still gets them. Try again in the grid re-asks the searches, not
  a tile already showing the placeholder (`shortcut:` in `views/grid.ts`).
- **Weather window (Should 4):** nothing to swap: weather stays frontend-owned (plan, Data seam), the browser asking
  Open-Meteo and NASA POWER itself. The demo needs internet for them (pin searches do anyway); offline the sample days
  show, said so. If the engine implements `site_listing` (gap 4) with `best_months`, `ui/booking.ts` `listed()` still
  puts the climatology's for the plan's purpose over them: drop that if the engine's are better. Open-Meteo's free API
  is non-commercial; a public deployment after the hackathon needs its paid API or a self-hosted instance.
- **Surface photos (Should 5):** nothing to swap: photos stay frontend-owned (plan, Data seam). With the engine an
  Earth double is a cell; one inside an established site still shows that site's photo through `establishedAt` (the
  results' tag), the rest the "No field photographs" line. A cell's place name from the engine (gap 3) wouldn't change
  that. Photos are static files (`public/photos/`, 236 KB), loaded only when the strip scrolls near.
- **Overlay compare (Should 1):** nothing to swap: it ghosts the two windows `terrainOf` returns and overlays the
  twins `shadeOf` draws, so with the engine it shows the two windows the search compared. It makes the engine's row
  order visible: if its windows aren't north-up (plan, Engine answers: unverified), the overlay pairs a flipped target
  with a north-up double, so check one asymmetric pair (Jezero's delta on the west rim) at the merge.

- **Progressive textures (Should 6):** nothing to swap: globe textures and the elevation patches stay frontend-owned
  (plan, Data seam). With `VITE_DATA=engine` the compare windows come from the engine's raw elevation
  (`/elevation/target|point|site`, gap 1 closed, see Gap 1 above and the smoke run), but the site view's terrain still reads `public/sites/patches/` on demand; only the
  mock's `frontZ` waits on a patch. A deploy must serve `public/textures/lo/` and the 66 files of
  `public/sites/patches/` (static, as before; `patches.bin` is gone). Rerun `npm run perf -- --only=paint` on the
  engine build: a deep link's start doesn't wait on the engine, so it should hold at 2–3 s on Fast 4G.
  (Review fixes) A featured target's compare window sits on its `iauAt` (a copy of the engine's targets.json centre)
  until the engine's search reports `target.lat/lon`, which then wins (`centreOf`); if the two ever differ, the compare
  moves once when the search lands. Check Jezero's caption reads 18.4082° N, 77.6873° E before and after.
- **Telemetry flash (Should 7):** nothing to swap: the HUD and intro readouts are frontend-computed (astro, coords).
- **Beyond imagery (Should 8):** nothing to swap: Beyond's images are frontend-owned static files
  (`public/textures/{venus,mercury,callisto,titan}.jpg`, 26 KB), loaded with the maps; a deploy serves them as before.
- **Accessibility pass (Should 10):** `npm run a11y` checks whatever the dev server on :5173 serves; at the merge run
  it against `VITE_DATA=engine npm run dev` with the engine warm. `ui/results.ts searchSay` reads the engine's country
  and confidence as plain text (`textContent`); a real pin search should say "Reading Mars terrain…" then its results.
  Its routes use the mock's cells (`@34.6750,-105.0750`); with the engine pick a cell from a live result.
- **Share and meta (Should 11):** nothing to swap for the engine. At deploy: set `VITE_SITE_URL` (`.env` or the
  build's environment) to the deployed origin and path, no trailing slash, so `og:url`, `og:image` and
  `twitter:image` are absolute; serve `public/fonts/` (with its two OFL files) and `public/og.jpg`. A deploy under a sub-path needs Vite's
  `base` too (the fonts' `/fonts/…` URLs follow it). Check a preview once deployed (e.g. a link pasted in Slack).
  Rerun `npm run poster` if the title's scene changes.

- **Should 12 (rendering rows):** the drape reads `public/sites/` crops cut at the site view's extent; if the site view
  moves to the engine's elevation windows, cut drapes for them (`--only=drape`) or the toggle stays off there
  (`T.engine`). The swap's held frame copies `composer.outputBuffer` (postprocessing swaps its buffers in a local:
  the last pass's input is the one it calls output): re-check `holdFrame` if postprocessing is upgraded.

- **Slope hazard layer (Stretch 2):** nothing to swap: slopes are computed in the browser from whatever terrain the site
  view shows. If the site view moves to the engine's raw window, the layer follows (`slopeOf` reads any Terrain). The
  frontend spaces a window's samples `extent_km / (N − 1)` apart (202 m for the engine's 94 over 18.8 km, where its
  pixels are 200 m; compare's windows are tinted since the review fixes, so this is where it shows): slopes about 1 %
  shallower than at 200 m; pass `pixel_m` to `measure`/`slopes` if that ever
  matters. The engine's own slope property (one of its six) is its measure, at its baseline; the layer and compare's
  "Slopes over 15°" are the frontend's, and nothing here claims they agree.
- **Profile and measure (Stretch 3):** nothing to swap: the profile reads whatever terrain the site view shows
  (`genTerrain`), so if the site view moves to the engine's elevation windows (gap 1) it reads those, its line kept
  inside their 18.8 km square and its grid spacing `extent_km / (N − 1)` (202 m for 94 samples, as the slope layer
  notes). Distances never come from the engine.
- **Landing ellipse (Stretch 4):** nothing to swap: the ellipse and its share over 15° come from whatever terrain the
  site view shows (`genTerrain`, `slopeOf`). On the engine's 18.8 km windows (gap 1) Curiosity's 20 × 7 km ellipse runs
  past the square when its long axis is within about 21° of north–south or east–west (half-widths over 9.4 km; at 45°
  they are 7.5 km): the panel says so and measures the part inside. Apollo 11's 18.5 km never does (half-length 9.25 km).
  (Review fixes, round 2) The landing line (`ellipse.ts landedOf`) measures from the site's point: if the site view
  moves Jezero to the engine's `mars-jezero` target, which is Perseverance's landing point itself, the line would read
  "0 km"; then drop it on that site (or say the ellipse is round the landing, not NASA's centre).
- **Sun-angle slider (Stretch 1):** nothing to swap: the sun is computed in the browser (`astro.ts`) and lights whatever
  terrain the site view shows. If the site view moves to the engine's elevation windows (gap 1), shadows march those:
  94 × 94 samples at 200 m, an 18.8 km horizon, where the featured sites' blocks reach 30–60 km. Polar DEMs from the
  engine (gap 2) would want a window wider than the area shown for far ridges' shadows.
- **My campaigns (Stretch 5):** frontend-owned mock persistence, nothing reaches the engine (it has no booking
  endpoint). A real request service would replace `request()`, `requestOf()` and `campaigns()` in `data/booking.ts`
  (the UI reads requests through these three alone: the confirmation, the dialog and the top bar's count; a request keeps
  the names it was made under, so the list needs nothing else), `planOf`'s read of a request's plan, and `sync()` with
  the `localStorage` read and write beside them. Names kept: if the engine starts naming cells (gap 3), new requests carry its name; earlier ones
  keep the country they were made with.
- **Earth clouds on the title (Stretch 6):** frontend-owned, nothing from the engine. The peak GPU memory is 294.6 of
  300 MB with it: if the merge adds GPU memory (the engine's terrain windows, more crops) and `npm run perf` goes over,
  load the cloud map on entering the title and dispose of it on leaving (`leaveTitle`: bind `blank` to `cloud` before
  `tex('earth_clouds').dispose()`, rebind on `playTitle`) to win back its 2.8 MB.

## Log

### 2026-11-14
- Mission fit in the booking flow (`ui/results.ts` bookingFit, `ui/booking.ts`; tests in `ui/results.test.ts`): the listing, the plan and
  the review each show a compact "Mission fit for <purpose>" block for the campaign's own purpose (the plan's purpose select redraws it):
  tier and score, what was scored, a warning and never a block when the tier is C, D or F ("You can still request this campaign"), and, for a
  mission that puts 25 or more of its weight on fidelity and crew (EVA training, habitation, thermal testing), the best facility to pair with
  the site (ARGOS for EVA on Mars, CHAPEA for habitation). The listing stays practical suitability only; the block is separate and labelled.
  Not done: the request does not carry the fit (it would change `data/booking.ts`, its stored requests and My campaigns) and the done step
  does not show it. Verification: typecheck and 440 tests (1 new) green; the listing and plan steps read in headless Chromium, the plan
  following its purpose select (rover mobility S, EVA training A with ARGOS, habitat operations no tier with CHAPEA), no page errors.
- Shadow fit in the mission fit's Operations (`terrain/shadowfit.ts`, `data/mission.ts` operationsScore and SHADOW_W, `ui/results.ts`,
  `ui/panel.ts`; tests in `terrain/shadowfit.test.ts`, `data/mission.test.ts`, `ui/results.test.ts`): the site view's own shadow march
  (`sunlit`) run on the target's window and the Earth double's (both 94 × 94 at 200 m) gives each window's shadowed share at sun heights
  1°, 2° and 4° (eight directions each); the fit is how alike they are, 0 to 100. It counts for 40 of Operations for rover mobility and EVA
  training, 30 for drilling, 0 for the rest; only where both windows are real elevation (Decision 209). My first heights (10°, 25°, 45°) gave
  0.00 on both real windows and so a fit of 100 for every pair; 2°, 5°, 10° still left 0.00 above 2°, so the heights are 1°, 2° and 4°
  (Jezero against a search-result cell: 0.30, 0.09, 0.01 against 0.22, 0.04, 0.00, a fit of 83). Verification: typecheck and 439 tests
  (9 new) green; the compare view read in headless Chromium with no page errors. Not run: the build and a11y after this change, capture, perf.
- Site panel decluttered (`ui/panel.ts`, `ui/results.ts`, `data/analogs.ts`, `styles/panel.css`; tests in `data/mission.test.ts`,
  `ui/results.test.ts`): the map's tools (measure, sunlight, slope hazard, landing ellipse) and the imagery strip with its credits move
  into collapsible "Tools" and "Imagery and credits" dropdowns; Tools opens by itself while a tool is on, and each dropdown keeps its
  open state across redraws. "Known analogs" is one collapsed dropdown (its summary names the best) of three compact ranked rows (rank,
  name, kind and place, cover of 100); a row opens to its fact and source. Field sites and hybrids rank together, with at most one
  facility and only when the mission puts at least 25 of its 100 weight on fidelity and crew (`knownAnalogs`, `FACILITY_NEED`).
  Verification: typecheck and 430 tests green; the Jezero site view in headless Chromium shows the three dropdowns, no page errors.
  Not run: capture (its tool states may need the Tools dropdown open), perf.
- Three analog tracks, fidelity weights and existing analogs (`data/mission.ts`, `data/analogs.ts`, `ui/results.ts`, `ui/panel.ts`,
  `styles/panel.css`, `docs/analog-weights.md`; tests in `data/mission.test.ts`, `ui/results.test.ts`): field, facility and hybrid tracks;
  a seventh factor group, target fidelity (gravity, pressure, radiation), weighted where a mission needs a facility and N/A for field sites;
  re-weighted profiles; a catalogue of 14 existing analogs (7 facilities, 3 hybrids, 4 field sites), each fact sourced; and an "Existing
  analogs" list above the Earth doubles with the best for the mission on the target's world (Decision 208). `docs/analog-weights.md`
  records every weight's reasoning, every analog's strengths and 16 sources, plus what was left out for want of a source and where sources
  disagree. Verification: typecheck and 429 tests (5 new) green.
- Mission fit and a regrouped result detail (`data/mission.ts`, `ui/results.ts`, `ui/panel.ts`, `styles/panel.css`; tests in
  `data/mission.test.ts`, `ui/results.test.ts`): a "Mission fit" card at the top of the detail weights six factor groups for the
  search's mission (seven profiles), scores the three Eidolon holds data for (terrain, climate fit, workable months), re-normalises
  over them, and gives a provisional S to F tier only when at least 50 of the 100 weight is assessed (Decision 207; a deviation
  from the no-blending rule, logged under Deviations). The detail is regrouped: Mission fit and Analog verdict as cards, then
  drawers "Terrain: Earth site against the target" (open), "Climate: Earth site against the target", "Target: measured on Mars /
  the Moon" and "Earth site: location and access"; the count of results away from the listed analog sites is now a banner.
  Verification: typecheck, 424 tests (8 new) and the build with the copy check green; the compare view loaded in headless Chromium
  at 1280×800 with no page errors, the card showing tier S, 88 of 100, 80 of 100 assessed for Jezero's first result, and the five
  cards tagged. Not run: capture, a11y (after this change), perf. The user's screen recording could not be opened here (no ffmpeg).
- Mars rock chemistry and water, and the kind of landform (`scripts/fetch-surface.mjs`, `data/surface.gen.json`, `data/climate.ts`,
  `data/process.ts`, `ui/results.ts`; tests in `ui/results.test.ts`, `data/process.test.ts`): the Odyssey GRS element concentrations
  (NASA PDS Geosciences Node; six small ASCII tables, smoothed 5° bins) give each Mars site's water, iron, silicon, potassium, chlorine
  and thorium in "Measured at the target" (regional, about 300 km across; weight percent spelled out; never scored), and the verdict's
  "Not assessed" row now reads "for the Earth site" with a "Read at the target, not scored" row beside it; a "Kind of landform searched"
  row gives the process commonly behind the target's IAU descriptor, hedged and marked inferred (Decision 206). Verification:
  typecheck, 416 tests (5 new) and the build with the copy check green. Not run: capture, perf; not looked at in a browser.
- Matching the brief better (`ui/results.ts`, `ui/panel.ts`, `data/weather.ts`; tests in `ui/results.test.ts` and
  `data/weather.test.ts`): an "Analog verdict" block at the top of the result detail (strong, partial, gap, not measurable,
  climate fit, listed analogs, not assessed, what it was searched for, how it could help; derived from data the detail already
  holds, scoring nothing); a "Not near a listed analog" tag on cards and a count above them for cells neither inside nor within
  150 km of the 14 listed analog sites; and a "Surface temperature" block with the Earth site's night-time and day-time skin
  temperature from NASA POWER (TS_MIN, TS_MAX; no login) beside the Moon's Diviner midnight value (Decision 205). Verification:
  typecheck and 411 tests (7 new) green. Not run: the build's copy check after these edits, capture, perf; not looked at in a browser.
- Climate fit and NASA surface values in the result detail (`data/climate.ts`, `ui/results.ts`, `data/surface.gen.json`,
  `scripts/fetch-surface.mjs`, `npm run fetch:surface`; tests in `data/climate.test.ts` and `ui/results.test.ts`). A
  "Climate fit" (Close, Partial or Weak) from two coarse bands, the Earth result's mean annual air temperature and aridity
  index against a cold, dry target; separate from the terrain match and never blended into it (Decision 203). "Measured at
  the target": LRO Diviner midnight surface and regolith temperature and rock abundance for Hadley and Taurus–Littrow, and
  THEMIS thermal inertia for Jezero, Gale, Meridiani, Elysium and Arcadia, each the median over about 2 km, read by HTTP
  range request from files of 2.5 to 3.3 GB (nothing downloaded whole). Not read: the Moon's south-pole sites (no Moon
  elevation beyond 59.5°; the mosaics stop at 70°), Utopia (no valid THEMIS pixels), any pin more than 40 km from a featured
  site. Caves, the "Subsurface and caves" factor for the target: the distance to the nearest entry of NASA's Mars Global
  Cave Candidate Catalog (Cushing) or the LROC Lunar Pit Atlas (Wagner and Robinson) and the count within 100 km, read whole
  by the script (a small zip and CSV) and never called a confirmed cave; no featured site has an entry within 100 km (nearest
  614 km at Jezero, 367 km at Taurus–Littrow). Rock type and chemistry and biology stay "Not assessed" (Decision 204).
  Credits and the README's "How the climate fit works" written. User looked at the climate fit and measured blocks in a
  browser: fine. a11y: no violations (all routes, both sizes). Verification: typecheck, 405 tests (14 new) and the
  build with the copy check green; `npm run perf` hung on this Windows machine with no browser or preview server under it
  (`scripts/perf.mjs` line 128 spawns the extensionless `node_modules/.bin/vite`, ENOENT on Windows; a Node-entry spawn did
  not get it running either), so perf is not run; values plausible (Moon midnight 98–105 K, Tycho's rim warmer and rockier as a control; Mars
  thermal inertia 158 to 322, dusty at Arcadia and Elysium, sandier at Meridiani, rockier at Jezero and Gale). Not run:
  capture, a11y, perf, and the new blocks have not been looked at in a browser. Not checked: the PDS and USGS licence lines.
- Engine connected (branch `engine-merge`): the frontend runs on the live engine (`VITE_DATA=engine`, engine on :8000).
  Import cleanup (`web/docs/engine` deleted, spec cited at `engine/code/docs/frontend_spec.md`, `trim-targets.mjs`
  default `../engine`, `eidolon-engine` launch entry); real terrain for the five featured targets that had illustrative
  terrain (Arcadia, Utopia, Meridiani, Elysium, Taurus–Littrow) and for the engine's top-5 Earth cells of the demo searches
  (`DEMO_CELLS` in `data/real-sites.ts`, 25 cells, read from the live engine); `fetch-real-data.mjs` retries a crop after a
  dropped connection. Verification: the three example searches match the contract's keys and result counts (0.1 s cached,
  7.7 s a Mars pin); Jezero, Hadley, Gale, Utopia, the five targets, compare, globe and overlay, and a Mars and a Moon pin
  load against the engine in Edge with no console errors (the Moon pin only in the user's own browser: a software-rendered
  test browser starves the engine of CPU); production build in engine mode served on :4173. Not run: capture, a11y, perf.
- Result detail reads more like the analog-scoring report (`ui/results.ts`, `ui/results.test.ts`): "What this match
  covers" (terrain form measured, climate modelled, rock type and chemistry, subsurface and caves, biology not
  assessed: the N/A-not-zero rule), a line that the match is on terrain form at 200 m, not on how the places look, the
  nearest of the 14 established analog sites (inside, within 150 km, or none), and a "What Earth can’t reproduce" drawer
  for the target's world (gravity, pressure, temperature from `data/bodies.ts`; radiation and one-way signal delay here,
  sourced in the note). Purposes still choose the land searched and weight nothing. Verification: typecheck, 391 tests
  (3 new; the property count now reads the Terrain properties list only) and the engine-mode build with the copy check
  green; the new sections looked at on the built compare view at 1280×800.

### 2026-10-22
- Final review fixes, round 1 (38 findings: 27 fixed, 11 logged; see "Final review fixes, round 1", Decisions
  195–201, Deviations): `planet.frag.glsl`/`planet.ts`/`scene/frame.ts` (night fill; the phone pair's framing),
  `terrain/mesh.ts` (water), `terrain/procedural.ts` (Earth 5× cap), `ui/detection.ts` + `index.html` (readout text
  fade, Terrain readout), `views/title.ts` (meta row, satellite tag), `views/site.ts` (reduced-motion dive),
  `ui/chrome.ts` (Search this area: above the toggle when narrow, hidden on no_dem), `data/client.ts`/`mock.ts`
  (no_dem at 59.5°, client-side), `data/http.ts` (`VITE_API`, 60 s), `motion.ts` (Live is now), `ui/results.ts` +
  `coords.ts` (`unplace`, "×", `fmtSize`), `routes.ts`/`pins.ts`/`ui/panel.ts` (4-place names), 16 exports dropped,
  `vite.config.ts` (chunk notice), `README.md`, `docs/credits.md`. Verification: typecheck, 388 tests and build (copy
  check, no chunk notice) green. Full capture 662/662 over both viewports (`dive-0.8s` re-run after a comment edit
  reloaded the dev server mid-run); console errors only the intended 404s (the same 20 captures, 10 states). Tablet
  `compare-globe`, `compare-jezero-salda` and the five `compare-overlay-*` recaptured (34). `npm run a11y` 52/52, no
  violations. `npm run perf`: within budget, JS 340.8 KB on #/ and #/system (+0.6), GPU 294.6 MB, 60 fps on every
  route; a no-vsync dip on #/earth (152–185 fps) showed on the code before this round too, run to run (A/B with the
  changes stashed: 152.6 before, 239.3 after). Toggle vs Search this area probed at 1280, 1024, 960, 900, 820 and 768 px:
  no overlap; hidden on `#/moon/malapert/compare/haughton/globe`. Looked at, both sizes: `compare-jezero-salda` (a clean
  lake, z-cropped), `compare-globe`, `compare-globe-cell` (the US double legible on Earth's night side), `body-moon`,
  `engine-moon-pin-85S` (no text over text), `dive-rm` (the frame over Haughton's block, "Real elevation"),
  `site-haughton` (5×), `compare-jezero-cell` (phone: the blocks below their captions), `results-jezero-detail` (no
  place prefix, "0.9×"), `site-tranquillitatis-media` ("≈ 9 m across"), `title` ("Low orbit over 1° S, 111° W"),
  phone `title-from-site` (the tag flipped left, whole).
- Stretch list holistic review fixes (1 finding, major; see "Stretch list holistic review fixes", Decisions 194):
  `views/title.ts` (`playTitle` turns the terrain off and clears `VPS[0].only`), `capture-states.mjs` (new
  `title-from-site`; title-back seq `title-from-compare`, `-replay`, `-earth`; `title-from-compare-globe`).
  Verification: typecheck, 385 tests and build (copy check) green. Full capture 660/660 over both viewports, then
  `title-from-compare-globe` (added after) 2/2; console errors only the intended 404s (the same 20 states). Each new
  state failed or showed the bug with `title.ts` reverted. Looked at, both sizes: the five new states; desktop `title`
  and `compare-jezero-salda` (against the reference), `title-clouds-back`: no regressions.
- Earth clouds on the title review fixes (3 findings; see "Earth clouds on the title review fixes", Decisions 193,
  Deviations): `ui/fallback.ts` (the poster credit names the Blue Marble clouds), `docs/credits.md` (the poster row's
  `earth_clouds.jpg`, the og row's 54 KB, the quoted credit), `title.css` (`.hero .btn.ghost` ground, `.meta-row`
  edge), `capture-states.mjs` (new `title-clouds-back`, `title-clouds-back-full`). Verification: typecheck, 385 tests
  and build (copy check) green. Contrast measured with throwaway probe states (reverted). Full capture 652/652 over
  both viewports, console errors only the intended 404s (20 states, `title-clouds-blocked` among them). Looked at, both
  sizes: `title-clouds-back`, `title-clouds-back-full`, `title`, `footer-step1`; desktop `footer-step1-develop`,
  `footer-step3` (against the reference), `footer-step4`, `no-webgl`; phone `no-webgl-done`; the new credit line in
  the built fallback chunk. Spot-checked `system` (desktop, against the reference): no regressions.
- Earth clouds on the title (Stretch 6; see "Earth clouds on the title (Stretch 6)", Decisions 192, Deviations, Merge
  notes): `public/textures/earth_clouds.jpg` and its manifest entry (`fetch-real-data.mjs`: `SRC.clouds`, `clouds()`,
  `--only=clouds`, in `globes()`), `data/bodies.ts` (`clouds`), `scene/renderer.ts` (R8, no colour space),
  `scene/planet.ts` (`cloud`, `cloudK`, `cloudU`, `cOn`, repeat-wrapped), `planet.frag.glsl` (cover over the albedo,
  relief, glint and lights), `scene/frame.ts` (`cloudK` = `G.title`, the drift on `dt`), `app.ts` (loaded with the
  full maps; `cOn` faded in by `showMaps`), `title.css` (the blurb's scrim, `isolation`; `#annot text` edged),
  `index.html` (the Data column's "Blue Marble clouds"), `docs/credits.md`, `capture-states.mjs` (new
  `title-clouds-late`, `title-clouds-leave`, `title-clouds-off`, `title-clouds-blocked`; check texts of `title` and
  `reduced-motion-title`; `og` hides the scrim), `public/poster.jpg`, `poster-tall.jpg`, `og.jpg` remade (`npm run
  poster`). Verification: typecheck, 385 tests and build (copy check) green; `npm run perf -- --only=memory` within
  budget, peak 294.6 MB (was 291.6). Full capture 648/648 captures over both viewports, console errors only the
  intended ones (the new `title-clouds-blocked`'s 404 among them); after the last CSS edit (`isolation`, for the no-WebGL
  page) the title, no-WebGL and `title-clouds-*` states re-run (45/45). Looked at, both sizes: `title`,
  `title-clouds-late`, `title-clouds-leave`, `title-clouds-off`, `title-clouds-blocked`, `reduced-motion-title`,
  `no-webgl`, `og`, `title-shot`; desktop `sunrise-9.5s`–`13s`, `skip-4s`, `intro-8s`, `info-sheet` (the Earth line now
  three lines), `info-sheet-foot`, `footer-step1-develop`, `footer-step2`, `body-earth`, `compare-globe`, `dive-earth`,
  `system`, `book-globe` (no clouds off the title). Drift and seek probes as in the section.
- My campaigns review fixes (17 findings; see "My campaigns review fixes", Decisions 191, Deviations, Merge notes):
  `data/booking.ts` (`requests` private, `requestOf`; `sync()` re-reads storage when listing and before a request,
  which writes its own key only; `planIn` days as ISO days, a request's plan through `validate()`), `ui/campaigns.ts`
  (rows with the double's point and a pin target's to 4 places, Featured sites in the empty box, under its button,
  the `storage` event), `ui/chrome.ts` (`listed`, `count` with the button's `aria-label`; the crumbs' `.lg`),
  `ui/booking.ts` (`requestOf`; My campaigns a link in the fine line), `ui/icons.ts` (`booked`), `top.css` (the crumbs
  give way), `panel.css` (the dialog's motion and `--r`; `.fine button`), `responsive.css` (the sheet's motion, reduced
  motion, the phone's badge, `::backdrop` under `?capture`), `capture.mjs` (`noStorage`), `capture-states.mjs` (new
  `camps-keys`, `camps-blocked`; assertions in `book-done-camps`, `camps-empty`, `camps-two`, `camps-open`; check
  texts). Verification: typecheck, 385 tests (was 383) and build (copy check) green. Full capture 640 states at both
  sizes, all ok; console errors only the intended 404s (18 states). `npm run a11y`: no violations (`campaigns` among
  them). Looked at every changed and new state at both sizes (the rows' points, the confirmation's link on its fine
  line, the empty box's button, the dialog under its button, the phone's badge and tick icon, the focus ring, the
  blocked-storage line) and `camps-two` at tablet; spot-checked `compare-jezero-salda` (desktop, against the reference)
  and `site-jezero-media` (phone) for regressions: none. The crumbs measured at 760–1,300 px and the dialog's motion
  probed in a normal (not `?capture`) page at desktop, phone and reduced motion (throwaway Playwright): in, settled,
  out (kept on top and unclickable, then gone). The crumbs' tablet rules came after the full run (they apply only at
  ≤ 1,099 px, which neither default viewport reaches); `camps-two` re-run at tablet and desktop after them.
- My campaigns (Stretch 5; see "My campaigns (Stretch 5)", Decisions 4 and 191, Deviations, Merge notes):
  `data/booking.ts` (requests in `localStorage` with the names they were made under, written over another tab's;
  `Campaign`, `campaigns()`, `lasting`; `keptOf` checks a request's names and key; `planOf` from a request),
  `ui/campaigns.ts` (new: the dialog and its openers), `ui/booking.ts` (the request's names; the confirmation from the
  request alone; My campaigns on it), `ui/chrome.ts` (the count; the clock's date apart), `ui/panel.ts` (`swap` keeps
  the heading's focus), `routes.ts` (`siteName`), `scene/input.ts` (the global keys stand down under a dialog),
  `app.ts`, `index.html` (the button, the dialog, the clock's date), `top.css`, `panel.css`, `responsive.css`,
  `vite.config.ts` (Node's web storage off in tests), `a11y.mjs` (`campaigns`). States `book-done-camps` (seq `book`),
  `camps-empty`, `camps-pin-reload`, `camps-two`, `camps-open` (seq `camps`). Verification: typecheck, 383 tests (was
  379) and build (copy check) green; the app chunk 144.0 KB gzip. Full capture 636 states at both sizes: 634 ok in the
  run, the two that failed (desktop `dive-rm-end`, `site-slope-flat`) were the pages in flight when a source edit
  reloaded the dev server mid-run; both ok re-run with their neighbours (6/6). Console errors only the intended 404s
  (18 states). `npm run a11y` on `campaigns`, `mars` and `compare-cell`: no violations. Looked at every new state at
  both sizes (the dialog's rows, the reference on its own line so a long country name keeps one line, the empty box, the
  confirmation from the request during the pin's search, the count, the phone's sheet and top bar), and spot-checked
  `system` (both sizes, against the reference), `beyond-cards`, `site-jezero`, `compare-jezero-salda` and `book-done`
  (phone) for regressions: none beyond the new button. Top bar measured at 360–1,280 px (throwaway Playwright): inside
  its gutters everywhere, with and without a count; the crumbs whole at 1,280 px. Keyboard probe as in the section.
- Landing ellipse review fixes, round 2 (1 finding; see "Landing ellipse review fixes, round 2", Decisions 190,
  Deviations, Merge notes): `data/missions.ts` (the Mars source lines cite the size only; `landed` on Perseverance and
  Curiosity), `ellipse.ts` (`landedOf`, tested), `ui/ellipse.ts` (the landing line in the fine print). States:
  `site-ellipse-jezero` and `-curiosity` assert the new source lines (and Curiosity at Jezero no landing line); new
  `site-ellipse-gale`. Verification: typecheck, 379 tests (was 378) and build (copy check) green. Full capture 626 states at
  both sizes, all ok. Looked at `site-ellipse-gale` at both sizes (the 20 × 7 km on Mount Sharp's flank on block and
  map, the landing line under the centring line), `site-ellipse-jezero` and `-curiosity`, and spot-checked
  `site-ellipse-meteor` (phone) and `-apollo` for regressions: none.

### 2026-10-21
- Landing ellipse review fixes (13 findings; see "Landing ellipse review fixes", Decisions 190, Deviations, Merge
  notes): `data/missions.ts` (new: the presets, `craft` gone), `ellipse.ts` (`sizeOf` with `&nbsp;`, `ringed`,
  `shareOf`), `ui/ellipse.ts` (options name and size, the ring line, the held "runs past" line, `shareOf`),
  `ui/topomap.ts` (the map's ring), `terrain/mesh.ts` (the edge measured on level ground, the block's ring),
  `ui/terrain-ui.ts` (the caption's outline pale over the slope tint, `hazard.on` in its key; contour labels clear of
  the ring), `hud.css` (the outline centred under the dot), `ui/panel.ts` (the map's label escaped). States: new
  `site-ellipse-artemis-facts`, `site-ellipse-sun` (phone), `site-ellipse-drape`; `-slope` and `-apollo` scroll to the
  section, `-apollo` asserts its share, `-slope` the pale outline; the size assertions hold their units. Verification:
  typecheck, 378 tests (was 376) and build (copy check) green. Full capture 624 states at both sizes, all ok; console
  errors only the intended 404s (18 states). Looked at every ellipse state at both sizes (the Artemis ring on block and
  map clear of the labels, Apollo's edge even without speckles at both sizes, the phone's four-line caption clear of the
  block, the pale outline, "Curiosity, 20 × 7 km" whole in the select, the drape with a measured line) and spot-checked
  `site-jezero`, `site-slope-meteor`, `compare-ellipse` and `site-measure-*` for regressions: none. After the full run the
  label rule narrowed to a ringed ellipse (it had hidden Meteor Crater's one label); its four Moon and Meteor states
  re-run and checked.
- Landing ellipse (Stretch 4; see "Landing ellipse (Stretch 4)", Decisions 190, Deviations, Merge notes): `ellipse.ts`
  (new, pure but for the session's `landing`: the four missions and their sources, `missionsOf`, `missionOf`, `sizeOf`,
  `axisWords`, `ellR`, `ellSteep`), `ui/ellipse.ts` (new: the "Landing ellipse" section after Slope hazard, its
  checkbox, mission select, long axis slider, facts and caveats; `redoEllipse`), `terrain/mesh.ts` (`buildTerrain`'s
  `ell`, the shader's draped edge), `router.ts` (the site view passes it), `ui/topomap.ts` (drawn on the site map),
  `ui/slope.ts` (`mapLabel(s, id)` names it), `ui/terrain-ui.ts` (the caption's line), `ui/panel.ts`, `app.ts`,
  `hud.css`, `panel.css` (`.ell` shares the sun's slider and facts styles; `.ell + .imgs` keeps the strip's gap);
  `a11y.mjs` gains `site-ellipse`. States `site-ellipse-jezero`, `-turn`, `-curiosity`, `-slope`, `-off`,
  `compare-ellipse` (seq `ellipse`), `site-ellipse-artemis`, `-apollo` (seq `ellipsemoon`), `-meteor`, `-pin`.
  Sources checked on the web (NASA/JPL image pages, the NASA navigation architecture PDF's text; Apollo 11's
  second-hand). Verification: typecheck, 376 tests (was 368) and build (copy check) green. Full capture 619 states at
  both sizes: 615 ok in the run, the four that failed (desktop `site-measure-drag`, `-click`, `-click2` in their seq,
  and `-earth`: a page reload mid-state and a 120 s timeout while the machine's load average sat near 17) all ok when
  re-run alone; console errors only the intended 404s (18 states). Then `ellSteep` sampled the bounding box inside the
  square (Meteor Crater's inside area read 15.9 km² for its exact 16), and the ten ellipse states re-ran at both
  sizes: 20/20. `npm run a11y` on `site` and `site-ellipse`: no violations. Looked at: every ellipse state at both
  sizes (Perseverance round Jezero's centre on block and map alike, turned to 45°, Curiosity's long one, pale over
  the slope tint, off and compare with none, Artemis's dot in Malapert's crosshair, Apollo 11 across the massif,
  Meteor Crater inside the ellipse and the facts, the pin's line), the phone caption clear of the image toggle once
  shortened; for regressions desktop `site-jezero` (the section off, below the fold), `site-slope-jezero`.
- Profile and measure review fixes (11 findings; see "Profile and measure review fixes", Decisions 189, Deviations):
  `ui/measure.ts` (the chart's readout kept after a finger lifts: pointerout ignored but for a mouse; the same point a
  typed error on B, and an error-styled message when clicked; the fields' placeholders; a typed line scrolls its status
  line into view unless the sheet is peeked; the chart's gutter 62), `ui/topomap.ts` (the line's length in a chip by
  B, clear of the map's labels; the line pale `#FFE3D2` over the slope tint), `profile.ts` (`Profile.u`/`.v` removed),
  `panel.css` (`.prof text` 10.5). States `site-measure-same`, `-empty`, `-garbled` (seq `measure`), `-off` (seq
  `measurepin`, with `-pin`), `-earth`, `-slope`, `-tap` (phone, seq `measuretouch`); `-on` and `-typed` assert more.
  Verification: typecheck, 368 tests and build (copy check) green. Full capture 599/599 states, console errors only the
  intended 404s (18 states); then the chip's placement changed twice (a 3-unit margin, then over B before its A side,
  after the desktop drag's chip touched an edge chip, then covered the line's end), so every measure state re-run at
  both sizes: 28/28. `npm run a11y` on `site-measure`: no violations. Looked at: every new measure state at both
  sizes (the coral same-point error with B focused, the Earth line in ° W with "13.1 km" by B, the pale line on its
  casing over Malapert's coral, the pin's caption back after off, the tap's readout kept), phone `-touch` ("32.3 km" by
  B), phone `-typed` (the status line in view), desktop `-drag`, `-click2` (the chip clear of the edge chips and of the
  line), desktop `-result` and `-same` (the larger chart labels, "−2,067 m" whole), `-on` (the placeholders); for
  regressions phone `-swipe`.
- Profile and measure (Stretch 3; see "Profile and measure (Stretch 3)", Decisions 189, Deviations, Merge notes):
  `profile.ts` (new, pure: `gcKm`, `gcAt`, `heightAt`, `onGrid`, `profile`, `profileStats`, `fmtDist`), `ui/measure.ts`
  (new: the map's caption and "Measure a line on the map" under the map, the From (A) and To (B) fields, the status
  line, the cross-section chart with its hover readout, the facts and caveats; drag, click, tap, typed ends, Escape),
  `topomap.ts` (`ruler`, the line drawn along its great circle, `movable` shared, `mapAt`/`mapOf` exported, no pin move
  while measuring), `panel.ts` (`siteMedia` takes the block), `app.ts` (`redoMeasure` on a late height map),
  `panel.css`; `capture.mjs` gains a `drag` step; `a11y.mjs` gains `site-measure`. States `site-measure-on`, `-typed`,
  `-result`, `-err` (seq `measure`), `-drag`, `-click`, `-click2` (seq `measuredrag`, desktop), `-pin`, `-touch`,
  `-swipe` (seq `measuretouch`, phone). Verification: typecheck, 368 tests (was 354) and build (copy check) green. Full
  capture 586/586 states, console errors only the intended 404s (18 states). `npm run a11y` on `site` and
  `site-measure`: no violations. Looked at: every measure state at both sizes (the line and its lettered ends on the
  map, the chart's labels clear of the frame once its gutter widened to 60, the hover rule and readout, the facts, the
  outside-the-square error, A alone after one click, the pin's map kept still, two taps over Malapert, the swipe
  scrolling the sheet with the line kept); for regressions desktop `site-jezero` (off: the checkbox under the caption),
  `site-sun-am` and `-noon` (both rows of facts still in frame), phone `site-sun-am`, `site-haughton-media`.
- Slope hazard layer review fixes (8 findings; see "Slope hazard layer review fixes", Decisions 188, Deviations):
  `dem.ts resOf` and `Terrain.res` (the caveat's spacing, the source's where coarser), `ui/slope.ts` (that caveat,
  `cmpSlopeHTML`, `redoSlope`, the handler redrawing every map), `router.ts`/`topomap.ts`/`terrain-ui.ts` (compare
  tinted: blocks, minis, legends), `panel.ts` (the section after Sunlight; compare's checkbox under the table, the minis'
  labels), `app.ts` (`redoSlope` on a late height map), `responsive.css` (the phone legend's plate lower when tinted,
  the overlay's key on its heading line), `hud.css` (the overlay rows' ramps hidden), `panel.css` (`.slope + .imgs`).
  States `site-slope-night`, `site-slope-off` (seq `sun`), `compare-slope-overlay`, `site-slope-polar`,
  `site-slope-flat`; `compare-slope`, `site-slope-kb`, `site-slope-meteor` changed. `a11y.mjs` gains `compare-slope`.
  Verification: typecheck, 354 tests (was 353) and build (copy check) green. A first full capture (571 states) failed
  the phone `book` seq: compare's checkbox, then under the minis, pushed "Plan a test campaign here" below the half
  sheet, so the tap missed (the same states pass with the change stashed); moved under the table, the full capture again:
  571/571, console errors only the intended 404s (18 states). `npm run a11y` on `site-sun`, `site-slope`, `compare` and
  `compare-slope`: no violations. Looked at: every slope state at both sizes (the phone legend clear of the block's
  corner on Jezero and the drape, the overlay's key on its heading line, the polar pin's "1,000 m" and Meteor Crater's
  "30 m", Dallol all grey with 0.0 km², Malapert's coral flanks in the midnight dark and the colours back when off, the
  checkbox's focus ring in frame, compare tinted both sides); for regressions `site-sun-am` desktop (both rows of facts
  in frame again), `compare-sun`, phone `compare-jezero-salda` and `book-listing` (the campaign button in reach).
- Slope hazard layer (Stretch 2; see "Slope hazard layer (Stretch 2)", Decisions 188, Deviations, Merge notes):
  `procedural.ts` (`slopes`, each sample's slope at the grid's true spacing, `ext / (N − 1)`; `STEEP` 15°; `measure`
  counts from it), `mesh.ts` (`hazard`, `slopeOf` memoised per terrain, a `slope` attribute and `haz` uniform: the
  ground greyed, coral over 15°, a pixel-wide edge), `topomap.ts` (the map alike, cached by light and layer),
  `ui/slope.ts` (the Slope hazard section under the map: checkbox, key with the area over 15°, the spacing caveat, the
  illustrative caveat; the map's label), `terrain-ui.ts` (the legend's coral row, no ramp while on), `router.ts`
  (`hazard.on` on the site view only), `panel.ts` (the section; compare's line under the minis). Found on the way:
  Meteor Crater's 4 km patch had two columns of holes at the GLO-30 tile seam (111° W), a 100 m trench the layer drew
  as a coral stripe: `fetch-real-data.mjs cogTile.px` clamped to the tile's pixel centres, the patch refetched (no
  holes; only that file changed; no other patch has a line of holes). `a11y.mjs` gains `site-slope`. States
  `site-slope-jezero`, `site-slope-drape`, `compare-slope` (seq `slope`), `site-slope-kb`, `site-slope-meteor`,
  `site-slope-pin`. Verification: typecheck, 353 tests (was 349) and build (copy check) green. Full capture 561
  states: 556 in the run, the five desktop `sun` states failed when a source edit mid-run made Vite reload their page,
  passed on their rerun (with the six slope states at both sizes); console errors only the intended 404s (18 states).
  `npm run a11y` on `site`, `site-sun`, `site-slope` and `compare`: no violations. Looked at: every slope state at both
  sizes (Jezero's inner walls and Malapert's flanks coral on block and map alike, the image greyed under the coral,
  Meteor Crater's wall ring with the seam gone, the pin's caveat, the focus ring after Space, compare in its colours
  with its line; on a phone the legend's plate reaches a few pixels over the block's corner); for regressions desktop
  `site-jezero` (off: the block as before, the section under the map), `site-sun-am` (the Sunlight section below it),
  `compare-jezero-salda` (its table's slope rows unchanged, 1.4° and 0.0 / 28.5 km²).
- Sun-angle slider review fixes (18 findings; see "Sun-angle slider review fixes", Decisions 187, Deviations): the
  curve whole (`mesh.ts sunlit`'s per-sample rise, the shader's `tilt`, `topomap.ts drawMap`'s gradient; `Sun.R`, no
  `Sun.at`), `astro.ts solarDate` (first on) and `sunElevation` clamped, `ui/sun.ts` (the caveats, "Sun's latitude",
  "Time of day (local solar)", "Lunar day holding", the date's error line), the drape darkened under a set sun, the
  stage caption's "Lit for … UTC" (`terrain-ui.ts`), compare's line under the minis (`panel.ts`); states
  `site-sun-night`, `site-sun-nodate`, `site-sun-drape`, `compare-sun` (`site-sun-kb` now in seq `sunkb`).
  Verification: typecheck, 349 tests (was 347) and build (copy check) green; full capture 549/549 states, console
  errors only the intended 404s (18 states); `npm run a11y` on `site-sun` and `compare`: no violations. Looked at: all
  six sun states and `compare-sun` at both sizes (the night's lit summit, the date's coral edge and line, the dark
  drape, the caption, compare's line; on a phone the caption first ran under the image toggle, so it gives the UTC
  moment alone); `site-sun-am` and `-noon` with and without the curve's term side by side (the half away from the sun
  darker); for regressions `site-jezero-drape` and `site-moon-south` (the control off: as before), phone
  `compare-jezero-salda` (no line with the control off).
- Sun-angle slider on terrain (Stretch 1; see "Sun-angle slider (Stretch 1)", Decisions 186, Deviations, Merge notes):
  `ui/sun.ts` (a Sunlight section under the site map: a checkbox, a local solar time slider, a date, the sun's height,
  direction, moment and on Mars its season), `astro.ts` (`solarTime`, `atSolarTime`, `sunElevation`, `SOL`, the Moon's
  subsolar latitude `moonSunLat`), `terrain/mesh.ts` (`sunSet`, `sunOf`/`sunAt`, `sunlit`'s shadow march, a `lit`
  attribute on the block), `topomap.ts` (the map's hillshade shadowed alike), `router.ts` (the site view's light from
  `sunOf`; compare keeps `{ az: TWIN_AZ }`); the overlay's slider look shared (`.srange`). Not on compare (the task's
  open question; Decisions 186). Verification: typecheck, 347 tests (was 339) and build (copy check) green. Full
  capture 541 states: 540 in the run, `desktop/site-jezero-drape-fail` timed out when a comment edit mid-run made Vite
  reload its page, passed on its own rerun; console errors only the intended 404s (18 states). `npm run a11y` on the
  site routes plus a new `site-sun` (the control on): no violations. Looked at: `site-sun-am`, `site-sun-noon` and
  `site-sun-kb` at both sizes (block and map lit together from the east at 1.5°, then the north at 5.5°, long shadows
  at the pole; the keyboard state's focus ring and Mars's Ls); for regressions desktop `site-jezero` and
  `site-moon-south` (the control off: relief light as before, the section under the map), `compare-jezero-salda`
  (still 315°), `body-moon` (its HUD's sub-solar now 1.1° S).
- Should list holistic review fixes (1 finding; see "Should list holistic review fixes", Decisions 185, Deviations):
  compare lit from one light, the engine twins' north-west 315° (`mesh.ts TWIN_AZ`): both blocks and so the overlay's
  ghost (`router.ts buildScenes`) and both minis (`topomap.ts drawMap`, the `win` maps); the site view keeps its site's
  sun. Checks of `compare-jezero-salda` and `compare-overlay-salda` updated. Verification: typecheck, 339 tests and
  build (copy check) green. Full capture 535/535, console errors only the intended 404s (18 states). Looked at:
  `compare-jezero-salda` at both sizes (blocks and minis lit from the north-west, Salda's bowl and Jezero's small
  crater read as hollows), `compare-overlay-salda` at both sizes and desktop `compare-overlay-50`,
  `compare-overlay-twins` (blocks, minis and twins shade alike); for regressions desktop `site-jezero` (still its own
  sun) and `compare-acquire`.
- Rendering and visual-bug Should rows review fixes, round 2 (2 findings; see "Rendering and visual-bug Should rows
  review fixes, round 2", Decisions 184, Deviations): under reduced motion the dive's frame times no longer scale to 0
  (`views/site.ts`: the turn and dive are instant already), so `showScan` comes before the swap's `hideScan` and the
  frame is held, then gone with the terrain overlay back; `acquire` holds 1.3 s under reduced motion too; no readout
  row on compare (`stage.css`). States `dive-rm`, `dive-rm-end`, `site-acquire-rm`; `dive-rm-end`'s assert fails on
  the old `site.ts` and passes now. Verification: typecheck, 339 tests and build (copy check) green. Full capture
  535/535, console errors only the intended 404s (18 states). Looked at, both sizes: `compare-acquire` (desktop: the
  toggle clear, no row), `dive-rm`, `dive-rm-end`, `site-acquire-rm`, `dive-earth`, `dive-earth-swap`, `site-acquire`;
  phone `sheet-rm`; desktop `compare-globe-loading`.
- Rendering and visual-bug Should rows review fixes (22 findings; see "Rendering and visual-bug Should rows review
  fixes", Decisions 183, Deviations): the terrain overlay hidden off its view and under the frame (`.tui:not(.on)`,
  `.tui.hid`); the drape toggle updated in place (`showDrape`: `aria-pressed`, `.dimg`, `.draped`), `aria-disabled`
  and unpressed on a failed image, a 44 px coarse-pointer hit area, the ramp hidden while draped; contour labels inside
  their viewport and clear of the caption, arrow, toggle, legend and note (`measure`); "Site acquired" right of the dot
  near the left edge with a dark edge, the readout row hidden under 240 px; `#annot` fading over the first eighth of a
  screen of scroll; graticule labels within the HUD's box (`hudBox`); no Esc in the hints on touch screens; the held
  frame 8-bit sRGB (2.5 MB at most: the finding's 8.2 MB assumed an uncapped buffer); a crossfade during one joins it;
  `shortcut:` at `meshIdx`; seven deviations logged. States `compare-acquire`, `site-jezero-drape-kb`,
  `site-jezero-drape-fail`, `site-jezero-drape-loading`, `site-leave-tui`; the acquire states at 1.1 s, "4 target
  sites". Verification: typecheck, 339 tests and build (copy check) green; `npm run a11y`: no violations. Full capture
  529/529, console errors only the intended 404s (18 states: `site-jezero-drape-fail` added). Looked at, both sizes:
  `site-acquire`, `site-acquire-haughton`, `compare-acquire`, `dive-earth-swap`, `site-jezero-drape`,
  `site-jezero-drape-kb`, `site-jezero-drape-fail`, `body-mars-zoomed`; desktop `footer-step1-develop`, `footer-step1`,
  `title`, `compare-globe-xfade` (the 8-bit held frame), `body-mars`; phone `book-plan` and `sheet-peek` (no Esc). `npm
  run perf` not re-run (steady state unchanged; the held frame is transient and smaller).
- Rendering and visual-bug Should rows (Should 12; see "Rendering and visual-bug Should rows (Should 12)", Decisions
  174–182, Deviations, Merge notes): all twenty rows. Rendering: the globes' relief from normal maps baked from the DEMs
  (`--only=normals`, 2.1 MB) and the Moon's Lommel-Seeliger mix; the drape toggle (21 crops, `--only=drape`, 372 KB),
  labelled major contours, the lakes' water shader and level of detail on the terrain; the curtain replaced by a
  crossfade of the held frame; the detection grade in the last pass over globes and terrain, per-ramp palettes; Beyond's
  galaxy drawn once and revealed by clip and opacity; the footer's dots one dither shader; Eidolon-1 low-poly PBR lit
  from the title sun; twelve booking icons (`ui/icons.ts`); phones' half-resolution bloom, 128-sample meshes and 2K maps
  (`textures/mid/`, 1.2 MB). Visual bugs: the phone sheet's gesture hint (`#shint`); the detection frame on every site
  entry (`acquire`); the HUD clamped to its viewport; title annotations by depth and nearest, `#annot` fixed; terrain,
  skirt and 2D map lit from the site's sun (`astro.ts sunAzimuth`), the stage's warm glow on the light's side; graticule
  labels off the markers and inside the viewport; the last moves stopped under reduced motion; the crosshair only on a
  movable map; viewports on whole pixels. Harness: new `dive-earth-swap`, `compare-globe-xfade`, `site-acquire`,
  `site-acquire-haughton`, `site-jezero-drape`, `site-salda-drape`, `beyond-reveal`; the map-loading states hold or block
  the phones' `mid/` maps too. Verification: typecheck, 339 tests and build (copy check) green; `npm run perf --
  --only=bundle,memory`: JS 327.8 KB gzip, GPU 291.6 MB laptop @2, 111.1 MB phone; `npm run a11y`: no violations. Full
  capture 519/519 twice (the second after the last fixes: the 2D map back to its own relief, the hint hidden at full, the
  graticule kept in view, the footer canvas resized only on change), console errors only the intended 404s (16 states);
  `npm run poster` rerun (the satellite changed: 46, 22 and 36 KB). Against the last commit's captures 70 of 505 nearly
  unchanged, the rest by design: lighting from the site's sun, the frame on deep links, the phone sheet's hint line, the
  phones' 2K maps. Looked at, both sizes: `site-jezero`, `site-jezero-drape`, `site-salda-drape`, `site-acquire`,
  `site-acquire-haughton`, `dive-earth`, `dive-earth-swap`, `compare-jezero-salda`, `compare-globe-xfade`, `body-moon`,
  `body-mars`, `body-mars-zoomed`, `footer-step1`–`4`, `beyond`, `beyond-reveal`, `title`, `system`, `book-plan`,
  `book-listing`, `sheet-full`, `compare-phone-full`, `compare-globe-loading`, `edge-slow`, `engine-moon-pin-85S`; the
  wordmark against the blurb probed at 900–1180 px (no overlap); spot-checked `intro-6s`, `site-haughton`, `og`.
- Share and meta review fixes (5 findings; see "Share and meta review fixes", Decisions 173, Deviations, Merge
  notes): `og:url` in `index.html` (`%VITE_SITE_URL%/`; `.env`'s note says so); the way back on the panel's head row
  cut with an ellipsis rather than wrapped (`backBtn`'s label in a span, `.chev{flex:none}`), the failure words "Copy
  from the address bar"; `og.jpg` without the unlabelled site dots, their rings and the dashed frame, the blurb off the
  limb's glow (`OG_ONLY`; `npm run poster`, 37 KB, posters unchanged); the copied link's missing query a `shortcut:` at
  `copyLink` and a Deviation. States `share-fail-long`, `share-focus`, `share-focus-copied`; `share-fail` asserts one row.
  Verification: typecheck, 332 tests and build (copy check) green; built with `VITE_SITE_URL=https://eidolon.example`,
  `og:url` `https://eidolon.example/`. Full capture 505/505 (`body-mars` and `body-mars-zoomed` re-run: a `.env` edit
  mid-run reloaded the dev server), console errors only the intended 404s (16 states). Against the pre-fix captures 58
  of 505 differ: `share-fail-long` (the chevron no longer squeezed), the rest graticule and marker labels and the
  intro's lines by a pixel (run-to-run; spot-checked `intro-6s`, `body-moon`, `sheet-body-peek`, `touch-pin`); no
  panel changed, booking and grid back links included. Looked at: `share-fail`, `share-fail-long`, `share-focus`,
  `share-focus-copied` at both sizes, `compare-jezero-salda` (desktop head), `og` and `public/og.jpg`. `npm run a11y`
  not re-run (the back link's words moved into a span, nothing else).
- Share and meta (Should 11; see "Share and meta (Should 11)", Decisions 172, Deviations, Merge notes): Copy link on
  the site and compare views' back row (`dom.ts copyText`: the Clipboard API, else the copy command; "Link copied" for
  1.6 s and in `#live`; the coordinate Copy shares it); `document.title` per route (`routes.ts titleOf`, tested); Open
  Graph and Twitter meta in `index.html`, `og:image` absolute through `VITE_SITE_URL` (`.env`, empty in development);
  `public/og.jpg` (1200 × 630, 39 KB) from the new opt-in `og` viewport and state, made by `npm run poster`; the three
  faces self-hosted (`public/fonts/`, Google Fonts' own latin and latin-ext woff2, 275 KB, OFL beside them;
  `@font-face` in `tokens.css`), the Google Fonts links gone. Harness: viewport `og`; states `share-site`,
  `share-compare`, `share-fail`, `og`. Verification: typecheck, 332 tests and build (copy check) green; the built
  `index.html` has no Google link and `og:image` `/og.jpg` (`https://eidolon.example/og.jpg` with `VITE_SITE_URL` set);
  `npm run a11y` on site, site-earth, compare and compare-cell: no violations (8 runs). Full capture 499/499, console
  errors only the intended 404s (16 states); `og` captured on its own (opt-in). Against the last commit's captures:
  327 identical (the fonts render the same), the rest differ only in the Copy link button, or by sub-pixel text and
  label placement that two runs of the same code also show (re-captured `intro-2s`, `body-mars`, `coord-error`).
  Looked at: `share-site`, `share-compare`, `share-fail` at both sizes, `og` (and `public/og.jpg`), `site-jezero`,
  `compare-jezero-salda` (desktop), crops of `compare-globe-loading`, `compare-phone-peek-scrolled`, `touch-pin`,
  `a11y-globe-enter`. `npm run perf` not re-run (first paint can only gain: one same-origin stylesheet where there were
  two).
- Accessibility pass review fixes, round 2 (1 finding; see "Accessibility pass review fixes, round 2", Decisions 171,
  Deviations): the graticule labels' soft halo is a solid 1 px dark edge (eight 1 px text-shadow offsets under the 4 px
  halo), so they read over the Moon's and Mars's lit ground: in `body-moon` 7.8–8.7:1 glyph to edge (were 4.0–5.4).
  Verification: typecheck, 330 tests and build (copy check) green. Full capture 493/493, console errors only the
  intended 404s. Looked at: `body-moon`, `moon-pole-zoomed`, `body-mars`, `body-mars-zoomed-2x` at both sizes (the
  labels crisp at 2×), `site-jezero` (desktop) for regressions. `npm run a11y` not re-run: a text-shadow over the canvas
  is outside what axe measures.
- Accessibility pass review fixes (12 findings; see "Accessibility pass review fixes", Decisions 170, Deviations):
  `#live-s` said afresh on each ask and new site (`saySearch`), as a search settles too; the 3D view's keys on screen
  while it has the keyboard focus (status bar, HUD hint, reticle and cursor readouts on its centre); the focus kept on
  the view through Enter's pin; the heading ringed on a keyboard arrival (`html.kb`); the frame above the status bar;
  the crumbs' ring whole; the faded HUD `aria-hidden`; booking days named from what they show; the centre's call
  dropped after a route. Harness: new `a11y-crumbs-ring`, `a11y-skip-grid`, `-go`, `a11y-globe-phone`,
  `a11y-purpose-said`, `a11y-filter-said`, `a11y-keys-escape`, `a11y-compare-terrain-keys`; more asserted in
  `a11y-globe-keys`, `-enter`, `a11y-search-said` (16 s), `a11y-terrain-keys`, `book-plan`. Verification: typecheck,
  330 tests and build (copy check) green; `npm run a11y` no violations (40 runs). Full capture 493/493 twice: the first
  showed the heading's new ring on every deep link's load (Chrome rings a script focus before any input), so the ring
  waits for a key (`html.kb`); the second clean, console errors only the intended 404s (16 states). Looked at: every
  `a11y-*` state at both sizes, `a11y-crumbs-ring` cropped at 2×; `site-jezero` (both: no ring on load), `body-mars`
  (phone), `coord-held-20s`, `book-plan-filled`, `a11y-compare-keys` (desktop) for regressions.
- Accessibility pass (Should 10; see "Accessibility pass (Should 10)", Decisions 169, Deviations, Merge notes): `npm run
  a11y` (axe, WCAG 2.1 A and AA, 20 routes at both sizes; `@axe-core/playwright` 4.14.0) found 36 of 40 runs failing on
  `--text-3`'s contrast and two names that didn't hold their visible text (`#cue`, the booking days); now none.
  `--text-3` #80868E; the HUD's labels, the loading line and the graticule brighter. A skip link to the panel or the
  grid; the 3D view a Tab stop (`role="application"`) on the body, site and compare views: arrows turn or orbit, + and −
  zoom, Enter pins the centre (`scene/bodies.ts facing`, shared with the HUD and graticule), the centre said in `#live`,
  a white frame round its viewport; the top bar (intro, title) and far-side markers out of the Tab order; inputs on the
  one focus ring; the site's search said in `#live-s` (`searchSay`, tested), the doubles box no longer live; the
  compare table's row headers; `#intro-ov` hidden off the system view. Harness: states `a11y-skip`, `-skip-go`,
  `a11y-globe-keys`, `-said`, `-enter`, `a11y-search-said`, `a11y-terrain-keys`, `a11y-compare-keys`, `a11y-title-tab`;
  `book-plan-wx-loading` reads the day's `title` (its `aria-label` is gone). Verification: typecheck, 330 tests and
  build (copy check) green; `npm run a11y` no violations. Full capture 477/480, run to the end: `site-gale` (desktop)
  lost its page to a dev-server reload from a comment edit mid-run, and `book-plan-wx-loading` (both) asserted the old
  `aria-label`; the three re-run after the fix, ok (480/480); console errors only the intended 404s (16 states). Looked
  at: every `a11y-*` state; `body-mars`, `results-jezero`, `info-sheet` (desktop) beside the reference (the labels a
  shade lighter, the graticule brighter); `book-plan-filled` (the days unchanged, the notes field's ring); `body-mars`,
  `grid-mars-done` (phone). Probed with Playwright on the dev server: Tab order on the title, system, Mars (skip link,
  top bar, 3D view, the four near-side markers, panel); keys on the Mars globe (east, north, zoom in and out, Enter
  pinned 15.91° N, 191.34° E as said, "Reading Mars terrain…" then "5 Earth doubles found…"), on Jezero's terrain and
  compare's Earth.
- Fallback without WebGL review fixes, round 2 (2 findings, both fixed; see "Fallback without WebGL review fixes,
  round 2", Decisions 168, Deviations, Merge notes): a context lost during a search by coordinates no longer freezes
  the tab: the dead app asks no search once lost (`state.ready` in the panel's fill, watch and warming retry, the
  status line, the grid, the held dive; `onAsset` returns once `lost`); a campaign plan being filled survives the
  lost context: plans and requests kept in `sessionStorage` for the tab's session (`keptOf`, tested), and the lost
  page on a plan or review step says so. Harness: a `reload` step; states `context-lost-book`, `-reload`,
  `context-lost-pin`, `-done`, `context-lost-pin-held`. Verification: typecheck, 329 tests and build (copy check) green.
  Full capture 469/469 and the compare sheets, run to the end; console errors only the intended 404s (16 states).
  Before the fix `context-lost-pin` and the held-pin case time out (the tab never answers again); after it they pass,
  every entry filled. Looked at, both sizes: `context-lost-book` (the reason says the plan is kept), `-reload` (days 2
  to 6, team 6, rover, notes back), `context-lost-pin`, `-done`, `context-lost-pin-held`, `context-lost`; spot-checked
  `engine-mars-pin-6s` (the held frame reading), `grid-mars-done` (desktop), `book-done` (phone): unchanged. Probed:
  lost on `#/mars/sites` mid-queue and on a warming Arcadia (`mock=warming`): every entry in.
- Fallback without WebGL review fixes (18 findings: 17 fixed, 5 logged as a reading of the plan; see "Fallback without
  WebGL review fixes", Decisions 167, Deviations, Merge notes): the page's own links are handled on click (a link to
  the current route works; after a lost context each reloads; without WebGL a click marks its entry and leaves focus
  and scroll alone, a load, back or forward lands with "The 3D view can’t open here…" in the entry); the lost page's
  reason is an alert, its searches use the default query, the scene's stop is sticky and the dead app's keys and router
  stand down; a search called off is asked again; caveats per double (shared ones once); a failed search lists the
  site's established analog sites; the 60° line in the no_dem entries; the poster cropped from the bottom; the heading
  clear of the top; the credit names ETOPO1 and the MODIS water mask; `strs` shared. Harness: an opt-in `laptop`
  viewport (1440 × 810); states `no-webgl-click`, `no-webgl-fail` new, `no-webgl-list` taps the button, the deep-link
  pair moved to Gale with `mock=slow`. Verification: typecheck, 327 tests and build (copy check) green. Full capture
  459/459 and 459 compare sheets, run to the end; console errors only the intended 404s (16 states); then the eight
  fallback states re-run after the shared-notes label learned "both" (16/16). Looked at, both sizes: every `no-webgl-*`
  state and `context-lost`; `no-webgl` beside the reference; `laptop` `title` beside `no-webgl` (the sun's streak
  through the lockup in both); spot-checked `compare-jezero-salda` (desktop), `body-mars` (phone): unchanged. Probed
  with Playwright on the dev server: lost on `#/mars/jezero`, the reason `role="alert"`, Escape changes nothing, the
  Jezero Crater link reloads into the full site view; lost on `#/mars/sites`, every Mars entry in by 20 s; without
  WebGL on `#/mars/jezero`, clicks on a double and on Gale keep scroll and focus, back lands on Jezero's entry.
- Fallback without WebGL (Should 9; see "Fallback without WebGL (Should 9)", Decisions 167): the page now also shows on
  a lost graphics context (`webglcontextlost` on `#gl`; the scene stops drawing, `renderer.ts isPaused`), opens on the
  title frozen (`public/poster.jpg`, `poster-tall.jpg`: the title's scene pre-rendered by the new `title-shot` capture
  state at scale 2 and web-sized by `npm run poster`, 46 and 22 KB, credited; the title's own lockup, wordmark, blurb
  with the reason and meta row over it), then lists every featured site with its three closest doubles from its own
  search through the data seam (`fbDoubles`, tested), the south pole's established analog sites unscored. Sites link
  to their view, doubles to their comparison; a deep link without WebGL lands on its site's entry and holds it at the
  top while the searches fill in; after a lost context a link reloads into the full view. The harness gains an `eval`
  step; states `no-webgl` (reworded), `no-webgl-list`, `no-webgl-done`, `no-webgl-deeplink`, `-later`, `context-lost`,
  `title-shot`. Verification: typecheck, 325 tests and build (copy check) green; JS on #/ 329 KB gzip, as on the
  commit before. Full capture 455/455 and 455 compare sheets, run to the end; console errors only the intended 404s;
  then the six fallback states re-run after the list's scrollbar style and `no-webgl-done`'s scroll target changed
  (12/12). Looked at, both sizes: every new state; `no-webgl` beside the reference's one-line message; `poster-deep`,
  `site-jezero`, `body-mars`, `compare-jezero-salda` (phone): unchanged. Probed with Playwright on the dev server: a
  lost context on `#/mars/jezero` shows the page at the poster, then Gale's link reloads into the full site view (no
  console errors); on `vite preview` without WebGL (phone) the portrait poster loads and every search settles in 25 s.
- Beyond imagery review fixes, round 2 (1 finding, fixed; see "Beyond imagery review fixes, round 2", Decisions 166):
  the galaxy's labels hide (`#beyond.nogl`, `visibility`) wherever a card can reach one, measured by `views/beyond.ts
  fitLabels` on each entry and resize, instead of the finding's `max-height` breakpoint (Deviations: 720 px still
  overlapped at 1536 × 730). Verification: typecheck, 320 tests and build (copy check) green. Full capture 443/443 and
  443 compare sheets, run to the end; console errors only the intended 404s (16 states). Looked at `beyond` (compare,
  desktop: labels shown and clear as before), `beyond-cards` (desktop labels shown; phone hidden; opt-in tablet
  768 × 1024 hidden), `beyond-late` (phone), `system`. Probed with Playwright on a dev server: 6,525 windows from
  761 to 3840 wide and 621 to 1400 tall, scrolled through, no shown label over a card; hidden at the finding's 1366 ×
  657, 1280 × 680, 1536 × 730, 900 × 800 and 768 × 1024; shown, clear by 14–103 px, at 1280 × 800, 1440 × 789,
  1536 × 760, 1920 × 960 and 1000 × 1600. Screenshots at 1366 × 657, 900 × 800 (scrolled) and 1536 × 760 looked at.
- Beyond imagery review fixes (10 findings, all fixed; see "Beyond imagery review fixes", Decisions 165): `playBeyond`
  asks for Beyond's images on entry; each canvas is `aria-hidden` until `paintOne` draws its image; the empty frame is
  `.card figure::before`, so a late image's fade moves only its dots; from 1001 to 1199 px wide every caption keeps
  two lines (the four headings level); `reveal()` resets `#beyond`'s scroll; the `beyond` and `beyond-late` checks
  name Mariner 10 and NASA/JPL-Caltech, `beyond-late` `expect`s Venus's canvas hidden. Verification: typecheck, 320
  tests and build (copy check) green. Full capture 443/443 and 443 compare sheets, run to the end before committing
  (the phone sheets now show the caption under the frame); console errors only the intended 404s. Looked at `beyond`
  (compare, both sizes), `beyond-cards` and `beyond-late` (Venus's empty frame navy under its caption, both sizes),
  `beyond-held` (pixel diff against `beyond`: only the top bar's clocks, both sizes), `system`, `info-sheet` (phone).
  Probed with Playwright on a dev server: the headings level at 1001–1440 px; scroll reset (900 × 700: 399 → 0 after
  a return); a canvas at opacity .15 over a navy frame; the four images asked for 13 ms after entering Beyond from
  `#/system` with the worlds' maps held back 15 s, all drawn and none `aria-hidden` 5 s later.
- Beyond imagery (Should 8; see "Beyond imagery (Should 8)", Decisions 164): the four painted scenes are replaced by
  each world as a spacecraft saw it (Venus from Mariner 10, Mercury from MESSENGER, Callisto from Galileo, Titan from
  Cassini), dithered in the footer's dots (`ui/carousel.ts BAYER`, its pitch) in the world's ink, drawn as the cards
  come in and then held; a caption line under each (mission linked to NASA's library, credit), words for each image,
  the info sheet's Data line. Images: `src/data/photos.ts BEYOND`, `npm run fetch:real -- --only=beyond`
  (`public/textures/{venus,mercury,callisto,titan}.jpg`, 26 KB; the prototype's Venus and Mercury placeholders and
  `scripts/extract-textures.mjs` gone); credits in `docs/credits.md`. A late image fades in over its empty frame
  (`redrawScenes(key)`); `onAsset` no longer repaints Beyond for the worlds' maps. `#beyond` scrolls when its content
  is taller than the window. New states `beyond-held`, `beyond-cards`, `beyond-late`; `beyond`'s check reworded.
  Verification: typecheck, 320 tests and build (copy check) green. Full capture 443/443 (run twice: after the first,
  the caption moved under the image); console errors only the intended 404s (`beyond-late`'s `venus.jpg` among them).
  Looked at `beyond` (compare sheet and phone), `beyond-cards`, `beyond-late` (Venus's frame empty under its caption),
  `beyond-held` (pixel diff against `beyond`: only the top bar's clocks, both sizes), `info-sheet` (the Beyond Data
  line), `footer-step2` (phone, the footer's dots unchanged), `system`. Probed 1280 × 640, 1024 × 768, 900 × 800 and
  768 × 1024 with Playwright on a dev server: no scroll where the cards fit, Beyond scrolling where they don't (900 ×
  800: 299 px, unreachable before); Titan's credit wraps to two lines under its frame at 1024.
- Telemetry flash review fixes (10 findings, all fixed; see "Telemetry flash review fixes", Decisions 163): on the
  globe HUD the readouts sim time moves flash only at Live or on an event (`setReading(el, s, news)`, `ui/hud.ts`'s key
  of body, rate and cursor), so the Moon's HUD no longer pulses at ×600; the intro flashes only its countdown and the
  frame's counter (UTC, sub-point and sun elevation on `setText`; the rule moved to `intro.css`); the detection frame's
  Matching line is a stable `#sc3` flashed as a pin's search lands (`stage.css`, full opacity at the peak); a `hover`
  harness step. Verification: typecheck, 319 tests and build (copy check) green. Full capture 437/437; console errors
  only the intended 404s. Looked at `hud-flash-cursor` (the cursor's four coral, sub-observer and sub-solar white),
  `hud-flash-cursor-rest` and `body-moon` (all white; both `expect` no flash under way), `engine-mars-pin-lands`
  (Matching "Earth sites" coral, both sizes), `intro-2s` (the counter just stepped, coral), `intro-tick` (phone: the
  countdown coral, the rest white), `hud-flash-rate`, `hud-flash-in`, `dive-0.8s`, `engine-moon-pin-85S` (phone: "No
  elevation data"), `dive-earth` (its readouts missing at 1.8 s, as on the commit before: Deviations).
- Telemetry flash (Should 7): `motion.ts setReading` writes a HUD or telemetry reading and, when it changed after
  holding .5 s, tweens its `--fl` 1 → 0 over .6 s (`power2.out`) on the one clock; `hud.css` mixes that much coral into
  the readout's own colour. Drift (a reading changing every frame) doesn't strobe; off under reduced motion
  (Decisions 162). Used for the globe HUD's eight readouts and the intro's four telemetry values; `dom.ts setText` now
  returns whether it wrote. New `src/motion.test.ts` (3 tests). New states `hud-flash-in`, `hud-flash-rate`,
  `hud-flash-rm` (desktop: the HUD's readouts are hidden on a phone) and `intro-tick`; `intro-2s` and
  `reduced-motion` checks mention the flash. Verification: typecheck, 318 tests and build (copy check) green. Full
  capture, 433/433; console errors only the intended 404s. Looked at the four new states (the readouts coral as the
  HUD comes on; "LIVE" coral with the drifting sub-observer white; "LIVE" white under reduced motion; the countdown
  coral, UTC and the sun elevation white, phone too), and `intro-2s` (UTC at its peak), `body-mars-zoomed`,
  `coord-valid` (flash out by 4 s), `body-moon` (the sub-observer's tick, faint).
- Progressive textures review fixes, round 2 (1 finding, fixed): on the phone, Search this area rises by `--status`
  while the maps' loading line or the engine line shows, clear of the line (`responsive.css`); `compare-globe-loading`'s
  check says so. Verification: typecheck, 315 tests and build green. Full capture, 428/428, no new console errors.
  Looked at phone `compare-globe-loading` (the magnifier ~14 px above the line, Earth's limb clear) against
  `compare-globe` (no line, the button where it was), desktop `compare-globe-loading` (unchanged) and phone
  `compare-phone-peek-area` (no line, unchanged).
- Progressive textures review fixes (11 findings, all fixed; 1 = 8, 3 = 5; finding 10 measured, its decode taken but
  the upload's cost left as a `shortcut:`, Deviations). A featured target's compare window sits on its IAU centre
  (`iauAt`, tested against targets.json) from the first frame, and a site or compare deep link waits on that window's
  patch (Decisions 157); a world's featured sites' patches load when it shows, from when the route's own full maps are
  in (159); the loading line only while a globe on screen is on its low tier, never over terrain (158); crops cut from
  a colour map wait for its full map, Beyond's repaint crossfades (160); late patches redraw only what they changed
  (161); the 4K map decoded off the main thread before its upload; `fetch-real-data.mjs` empties `patches/` first
  (rerun `--only=sites`: byte-identical). Module map rows for `renderer.ts`, `dem.ts`, `procedural.ts`, `chrome.ts`.
  New states `body-mars-full-fail`, `site-jezero-loading`, `compare-jezero-salda-loading`, `compare-globe-loading`,
  `site-pin-gale-loading`. Verification: typecheck, 315 tests and build (copy check) green. Full capture, 225 states
  (203 desktop, 225 phone), 428/428; console errors only the intended 404s (now also `body-mars-full-fail`'s). Looked
  at the five new states at both sizes (no line and the hint on the terrain views, the phone's legends where they
  were; the line on the globe compare; the empty crop frames beside the pin's photo; the low tier and the hint back
  after a failed map), and `body-mars-loading`, `compare-jezero-salda`, `compare-globe`, `site-jezero`,
  `site-pin-gale`, `system`, `beyond` (unchanged). Probes on the production build (phone, Fast 4G, 4× CPU; laptop
  for the long task): Jezero's compare deep link asks its IAU patch before start and, held 3 s, starts on MOLA–HRSC at
  5.6 s; Gale's and Hadley's compares start in 2.7 and 3.3 s on their site and IAU patches (Gale no longer pulls its
  756 KB pin patch); held 9 s, one change when it lands and no second curtain; on #/mars the line goes off with Mars's
  map at 3.9 s and Jezero's and Gale's patches load then, so Gale opened at 8 s shows real terrain at once; the 4K
  swap's long task 123–128 ms (131–136 before the decode) on an M3.
- Progressive textures (Should 6): each world's colour map comes in two tiers, a 1024 px low tier the start waits on and
  the 4K map (the highest the 300 MB GPU budget allows; 8K would be 179 MB a map, Decisions 152), made by `npm run
  fetch:real -- --only=globes` (`public/textures/lo/`, 299 KB in all; every other globe file and crop byte-identical);
  the planet shader crossfades low to full over .9 s (Decisions 153); "LOADING FULL-RESOLUTION MAPS" in the status
  bar's HUD caps until the worlds' full maps are in (Decisions 154). Under `?capture` the first tiers hold the start
  and the full maps hold `__eidolon.ready` (Decisions 155). The 4.7 MB `patches.bin` is 66 files in `public/sites/
  patches/`, each loaded when a view first reads it; a site or compare deep link waits on its own (Decisions 156).
  App start on Fast 4G, phone, 4× CPU: #/ 2.0 s (was 3.2), #/system 3.2 (8.0), #/mars/jezero 2.0 (8.9),
  #/mars/jezero/compare/salda 2.7 (9.4); GPU peak 287.6 MB (unchanged); first paint 456–584 ms. Fixed on the way: a
  pin opened by deep link kept the illustrative terrain built before its height map and patches (found under Surface
  photos); `site-pin-gale` and `site-pin-hadley` now show the MOLA–HRSC and SLDEM2015 terrain. New states
  `system-maps-loading`, `body-mars-loading`; harness step `until`. Verification: typecheck, 314 tests and build (copy
  check) green; `npm run perf -- --only=paint,memory` within budget. Full capture, 220 states (198 desktop, 220
  phone), 418/418; console errors only the intended 404s (`site-nodata-fallback` now one: the manifest; the Moon-late
  states two each: both tiers). Looked at the two new states at both sizes (the low tiers in the full maps' tones,
  softer; the line in the hints' place on desktop, above the sheet on the phone's body view, none on the phone's system
  view after a first run put it mid-screen there), `site-pin-gale` and `site-pin-hadley` at both sizes (real terrain
  and notes), `body-moon-late` (the grey placeholder kept with both tiers blocked); spot-checked `system`, `body-mars`,
  `site-jezero`, `compare-jezero-salda`, `footer-step2` (the dithered Earth from the low tier's albedo: as before by
  eye). Probes outside capture (production build on Fast 4G; dev server on the real GPU with Mars's full map and
  Gale's patch held): the crossfade, the late patch's one curtain, no console errors (details in the section).
- Surface photos review fixes, round 2 (3 findings, all fixed; 2 = 3): ten more US landings photographed, from NASA's
  library (Apollo 11, 12, 14, 16; Viking 1 and 2, Pathfinder, Phoenix, Spirit; Opportunity at Endeavour), each with
  its landing point (`at`), alt text and credit in-app and in `docs/credits.md` (24 photos, 420 KB; the 14 already
  there re-fetched byte-identical); a pin or named target whose 18.8 km window holds a landing shows its photo, so
  Statio Tranquillitatis, Surveyor, Cone, North and South Ray, Gusev and Endeavour from the IAU list do. Viking 2's
  distance from the Utopia site back to about 680 km (round 1 had read 225.71° W as 134° W), in the slot ("No
  photograph here: Viking 2 landed 680 km east, Zhurong 1,300 km south."), credits.md and Decision 151; the
  findings' 670 km taken as 680 (Deviations). New state `site-tranquillitatis-media`. Verification: typecheck, 311
  tests and build (copy check) green. Full capture, 218 states (196 desktop, 218 phone), 413/414 with `desktop/
  body-moon` dropped by the run (no error logged), re-captured alone: ok; console errors only the intended 404s. Looked
  at `site-tranquillitatis-media` (Aldrin and the flag, the "Surface: Buzz Aldrin and the flag, Apollo 11, 1969 ·
  NASA, photograph by Neil Armstrong." credit linked) and `site-utopia-media` (the sentence in five lines on desktop,
  four on the phone, inside the slot) at both sizes, the ten new photos at full size; spot-checked
  `site-pin-media`, `site-pin-far-media`, `site-hadley-media`, `body-moon` (unchanged).
- Surface photos review fixes (9 findings, all fixed; 1 = 7, 2 = 4 = 8, 3 = 9): NASA field photographs of the Atacama
  (PIA16191) and Mauna Kea (PIA22219) added, credited in-app and in `docs/credits.md` (14 photos, 271 KB); an
  established site without one says "No NASA field photograph of this site." (the six left re-searched and written up
  in credits.md; PIA24048 left out, Deviations); a pin or named target inside a featured site's square shows its
  photograph (`photoAt`), elsewhere "No surface photograph on file for this point."; Utopia's slot has its own sentence
  (and Viking 2 sits about 3,900 km away, not 680; wrong, see round 2: 680 km); a photograph that doesn't load gives way to "The photograph
  couldn’t be loaded."; the Dry Valleys and Pilbara recropped. New states `site-hanksville-media`, `site-utopia-media`,
  `site-pin-far-media`, `site-jezero-photo-404`. Verification: typecheck, 310 tests and build (copy check) green.
  Full capture, 217 states (195 desktop, 217 phone), 412/412; console errors only the intended 404s (now with
  `site-jezero-photo-404`'s). Looked at every new and changed state at both sizes (`site-atacama-media`: the streambed
  photo and its linked credit; `site-hanksville-media`: the NASA sentence; `site-utopia-media`: its sentence in six
  lines inside the slot on desktop; `site-pin-media`: Perseverance's photo; `site-pin-far-media`: the "on file"
  sentence; `site-jezero-photo-404`: the sentence, credit kept, no broken icon; `book-listing-photo`: the outcrop crop)
  and the four photos at full size; spot-checked `site-jezero-media`, `-hadley-media`, `-haughton-media`,
  `-malapert-media`, `book-listing`, `site-nodata-fallback`, `results-jezero` (unchanged).
- Surface photos (Should 5): the strip's surface slot shows a NASA photograph where one is openly licensed (12:
  Perseverance at Jezero, Curiosity at Gale, Opportunity at Meridiani, InSight at Elysium, Apollo 15 at Hadley–Apennine,
  Apollo 17 at Taurus–Littrow; Lake Salda, Pilbara, Haughton, Holuhraun, Death Valley, the Dry Valleys), 320 px squares
  cut by `npm run fetch:real -- --only=photos` from NASA's Image and Video Library, lazily loaded, alt text for each,
  credited on the strip's credit line with the name linking its NASA page, and in `docs/credits.md`; an Earth cell
  inside an established site shows that site's. Elsewhere the slot says why there is none, by case (Decisions 150–151).
  Verification: typecheck, 310 tests and build (copy check) green; app chunk 147.1 KB gzip. Full capture, 213 states
  (191 desktop, 213 phone), 404/404; console errors only the intended 404s (`site-nodata-fallback`, `system-moon-late`,
  `body-moon-late`, `book-plan-wx-fail`, `wx-site-fail`). Looked at the new states at both sizes (`site-atacama-media`:
  "No openly licensed field photograph of this site."; `site-pin-media`: "No surface photograph for this point.";
  `book-listing-photo`: the Pilbara photo and its credit) and the changed ones (`site-jezero-media`, `-hadley-media`,
  `-haughton-media`: the photo beside the crops, the "Surface:" credit linked; `-malapert-media`: the sentence;
  `book-listing`: "No field photographs of this area."; `site-nodata-fallback`: the photo and its credit stay, check
  updated; `info-sheet`, `info-sheet-foot`: the Photos row); spot-checked `title`, `system`, `site-gale`,
  `compare-jezero-salda`, `results-jezero`, `book-plan`, `book-established`, `grid-mars-done`, `wx-site-feed`
  (unchanged). The 12 crops checked by eye before shipping.
  Found, not fixed (before this change: the 00:32 capture of the weather review fixes shows it too): a pin opened by
  deep link (`site-pin-gale`, `site-pin-hadley`) shows the illustrative terrain ("Illustrative terrain.", procedural
  craters), not its site's pin patch as their checks expect; the same pin reached by a route change
  (`engine-mars-pin-done`) has the real terrain.
- Weather window review fixes (15 findings, all fixed; 1 = 7 = 13, 2 = 15, 4 = 9, 6 = 10): the Earth site view's week
  starts on the place's own today (`todayAt`, from the forecast's UTC offset), so east of UTC it no longer opens on an
  empty day; no good month for the purpose puts every day off-season with its own caveat; best months judge monthly
  means in monthly terms (wind ×1.5, rain against twice the day's limit, measured on ERA5 at five doubles; Decisions
  147); a dot over a bar marks rain or temperature over the limits (touch has no tooltip); the Open-Meteo credit and
  its licence linked; the listing's Season says Loading… while the climatology loads and marks the sample months
  without it, its label naming the purpose; loading bars pulse as placeholders; runs of months as ranges ("Nov to
  May"); purpose names escaped. New fixtures (the Dry Valleys' forecast and climatology) and states `wx-site-local`,
  `wx-site-loading`, `wx-site-fail`, `book-listing-wx-loading`, `book-plan-feed-none`; `block`/`hold` take a list.
  Verification: typecheck, 307 tests and build (copy check) green. Full capture, 210 states (188 desktop, 210 phone),
  398/398; console errors only the intended 404s (now with `wx-site-fail`'s). Looked at every new state at both sizes
  (`wx-site-local`: Mon 5 Oct first, every day with its forecast; `-loading`: pulsing placeholders, Loading… twice;
  `-fail`: the sample days, Not available; `book-listing-wx-loading`; `book-plan-feed-none`: the caveat in its own
  words, every day dotted) and the changed ones (`wx-site-feed`, `book-listing-feed`, `book-plan-feed-picked`,
  `book-plan-wx-loading`, `book-listing-foot`, `book-offseason-plan`, `-review`); spot-checked `site-haughton`,
  `book-plan`, `results-jezero` (unchanged but for the dots on the sample days). Details under "Weather window review
  fixes".

### 2026-10-20
- Weather window from a real feed (Should 4): the Open-Meteo forecast and NASA POWER's monthly climatology, both
  fetched in the browser (both send CORS headers: no precompute shipped) for the Earth site or double on screen, once
  per place; days blue under the chosen purpose's limits (one table, reasoning in Decisions 145), each day's weather and
  the limits it goes over in its name and tooltip; best months from the climatology's average day (Decisions 147) on
  the Earth site view and in the booking listing and caveat; the booking plan's 14 days marked again in place when its
  purpose changes. Sample days when the forecast fails and under `?capture` (`?wx=feed` lets the harness serve recorded
  responses: new option `serve`, `scripts/fixtures/`). Found on the way: a deep-linked booking plan never got its
  purposes (`fill()`'s booking branch skipped `needLists`); fixed. Verification: typecheck, 305 tests and
  build green; full capture 388/388 (183 desktop, 205 phone), console errors only the intended 404s (now with
  `book-plan-wx-fail`'s); a live probe against both feeds. Details under "Weather window from a real feed (Should 4)".
- Touch review fixes, round 2 (4 findings, all fixed; 1, 2, 4 one defect): going to peek scrolls the panel back to its
  top with the slide (at once with reduced motion), and the app no longer scrolls a peeked sheet, so peek always shows
  the grip, the back link and the heading, and on compare the toggle (Decisions 143); on a phone Search this area sits
  at the Earth viewport's lower left, clear of the selected pin's label (Decisions 144). Found on the way: on a phone at
  half Search this area did nothing (the area started from the view's centre, which missed the stacked globe since
  round 1); it starts from the globe's centre on screen now. New phone states `sheet-peek-scrolled`,
  `compare-phone-peek-scrolled` (both failed on the old code: the back link, the Globe button off screen) and
  `compare-phone-peek-area`. Verification: typecheck, 292 tests and build (copy check) green. Full capture, 198 states
  (176 desktop, 198 phone), 374/374; console errors only the intended 404s of `site-nodata-fallback`,
  `system-moon-late` and `body-moon-late`. Looked at phone `sheet-peek-scrolled`, `compare-phone-peek-scrolled`,
  `-peek-area`, `-globe`, `-overlay`, `compare-globe-pins`, `compare-area` (now the area on, its row in the filters),
  `compare-globe-held-20s`, `sheet-rm`, `engine-mars-pin-6s`; desktop `compare-area` (the same area as before),
  `compare-globe` unchanged. Details under "Touch review fixes, round 2".
- Touch review fixes (19 findings, all fixed): gesture copy by the main pointer (tap and pinch on touch; the map's
  caption without Hover there), "Terrain: illustrative." in the site panel's credit line, the shared exaggeration on a
  phone's compare captions, stacked globes ~135 px beside their captions, markers hidden outside their own viewport, the
  divider drawn, peek taking in the overlay slider's row and dragged by its content, the lone block clear of its plate,
  a stale drag cleared by a primary pointerdown, the swipe start re-based when a pinch drops a finger, the grip's drag
  kept to its pointer, `#area` and the graticule inheriting `#ui`'s hidden under a full sheet, the grip's hover and
  active states; the worker dropped for step 1 (Deviations). Decisions 139–142. New phone states `sheet-swipe`,
  `sheet-body-peek`, `orbit-globe`, `compare-phone-full`. Verification: typecheck, 292 tests and build (copy check)
  green. Full capture, 195 states (176 desktop, 195 phone): 370/371, then `desktop/site-jezero-2x` again (it failed on a
  dev-server reload from an edit made mid-run), 371/371; console errors only the intended 404s of
  `site-nodata-fallback`, `system-moon-late` and `body-moon-late`. Looked at phone `sheet-half`, `-peek`, `-swipe`,
  `-body-peek`, `site-haughton`, `results-jezero`, `compare-globe`, `-globe-pins`, `-area`, `compare-phone-half`,
  `-globe`, `-pinch`, `-overlay`, `-full`, `compare-overlay-50`, `-salda`, `-illustrative`, `orbit-globe`, `body-mars`;
  desktop `body-mars`, `compare-globe`, `compare-jezero-salda` unchanged. Ad-hoc CDP probes (lifting one finger of two)
  for findings 15, 16, 18 failed on the old code and pass; a tap on the back link at peek still follows it; the copy and
  the credit line read on a phone and a desktop context. Details under "Touch review fixes".
- Touch (Should 3): pinch to zoom, twist and two-finger orbit on the globe and the terrain (a finger on a marker joins
  the pinch); on a phone the bottom sheet drags by its grip between peek, half and full (a flick goes on to the next
  snap; tap and keys step it; the info sheet's motion, instant with reduced motion); the viewports end at the sheet's
  top edge and follow it; compare stacks the pair on a phone, each block framed beside its legend, and a lone block
  frames clear of its plate in a wide viewport (Decisions 133–138). New harness step `touch` (CDP touch points) and seq
  option `only`; new phone states `sheet-*`, `compare-phone-*`, `pinch-terrain`, `orbit-terrain`, `pinch-globe`,
  `touch-pin`. Verification: typecheck, 292 tests and build green; full capture 367/367 (176 desktop, 191 phone),
  console errors only the intended 404s; a desktop mouse probe (drag orbits, wheel zooms, click pins). Details under
  "Touch (Should 3)".
- Site selector grid review fixes, round 2 (1 finding, fixed): the grid is shown before its heading takes the focus,
  and a route's focus into the panel waits for the frame that shows it (`focusPanel` in `scene/frame.ts`, used by
  `renderPanel` and the grid's hide), unless the focus moved meanwhile (Decisions 132). Focus checks added to
  `grid-open`, `-system`, `-return` (the grid's heading) and `grid-site`, `-back` (the panel's); they failed on the old
  code. Verification: typecheck, 285 tests and build (copy check) green. Full capture, 176 states × 2 viewports
  (352/352); console errors only the intended 404s. Looked at `grid-open`, `-system`, `-site`, `-back`, `-return` at
  both sizes (no focus ring on the headings, unchanged otherwise); regression: `body-mars` (phone), `site-jezero`
  (desktop) unchanged.
- Site selector grid review fixes (15 findings, all fixed): each double as a result card's head (rank, notes, country,
  the Earth point at 4 dp, shape match), the IAU feature searched and the capability banner on the card, no-analog as a
  lede; one failure box keyed on the code with Try again when every search failed, the card's line keyed on it too; a
  missing hillshade shows the placeholder (the panel's cards too); lazy tiles; `aria-busy`/`aria-live` on the boxes;
  back to the grid from a site opened on it (Esc, back button, crumbs); no pin hint or second 60° line beside the grid;
  the panel follows a resize across 760 px (Decisions 128–131). New states `grid-wait`, `-site`, `-return`, `-warming`,
  `-empty`, `-noimage`; `grid-fail` at 19.5 s, `grid-dive` at 4.3 s. Verification: typecheck, 285 tests and build (copy check)
  green; app 142.2 KB gzip (was 141.9). Full capture, 176 states × 2 viewports (352/352; `dive-0.8s` desktop first
  failed on a dev-server reload from a comment edit made mid-run and passed on its rerun); console errors only the
  intended 404s. Looked at every grid state at both sizes (rows with rank, notes and distinct points; the IAU note and
  crater/rille banners; the failure box; dashed tiles in `grid-noimage`; the crumbs, back button and status naming the
  grid in `grid-site`, the grid back in `grid-return`; the Moon's 60° line once); regression: `results-jezero-list`,
  `compare-twins-noimage` (the card tiles' placeholder), `body-moon` and `grid-back` (the reworded lede, the pin hint).
- Site selector grid (Should 2): `#/mars/sites` and `#/moon/sites`, a target world's featured sites as cards over the
  globe beside the body panel's list (the whole screen on a phone): each window's hillshade, name, kind and point, and
  its three closest doubles from the site's own search (by coordinates one at a time), or the established analog sites
  where the engine has no elevation; reached from the body panel, the system view's new Featured sites cue and its
  world switch (Decisions 124–127). New states `grid-mars`, `-mars-done`, `-mars-foot`, `-switch`, `-moon`, `-open`,
  `-dive`, `-system`, `-back`, `-fail`. Details under "Site selector grid (Should 2)".
- Overlay compare review fixes, round 2 (1 finding, fixed): on a phone the overlay's block is framed at ~69 % and
  ~40 px left (`frame.ts`, eased in with the split), below both captions, and the legend's plate shows its two rows
  (the contour line for screen readers only), so it clips only the block's front corner; Salda's lake shows whole
  (Decisions 123). Details under "Overlay compare review fixes, round 2".
- Overlay compare review fixes (13 findings, all fixed): Back from the overlay no longer throws every frame until the
  curtain's swap (the second caption only on the overlay's compare); the ghost has one writer, read from the route when
  the scenes swap or stay (a late curtain turned it off); up to 879 px wide the slider wraps to its own row (it overran
  an iPad-portrait stage); the overlay note and contour line say whose ("Mars: illustrative terrain. Earth: …";
  `terrainNote`, tested); the overlay legend is a row per world (phone ~100 px tall, was ~194); the phone's toggle sticks
  at the top of the sheet; overlaid twins tinted with world dots, not ghosted without both hillshades; `shortcut:`
  comments on the two known limits (Decisions 120–122). New states `compare-overlay-back`, `-race`, `-illustrative`,
  `-book`, `-noimage`; opt-in harness viewport `tablet`. Details under "Overlay compare review fixes".
- Overlay compare (Should 1): a third compare mode, `/overlay`: the Earth double's block ghosted onto the target's
  in one viewport at the same scale, a slider between them in the toggle (0, 50, 100: the target, half and half, the
  double), the panel's twins overlaid at the same mix (Decisions 117–119). New states `compare-overlay-50`, `-0`,
  `-100`, `-twins`, `-toggle`, `-salda`, `-nodem`. Details under "Overlay compare (Should 1)".
- Must list holistic review fixes (3 findings, all fixed): a skip link under a target site's lede ("Earth doubles",
  "Searching Earth…" while the search runs) to the doubles, on screen without scrolling at both sizes (harness step
  `inView`; Decisions 115); the rotation decision landed: a held body's stars wheel about its axis at the time rate
  while its site stays centred and its terminator moves (Decisions 8 amended); Landsat WELD crops for the mock's 19
  Earth cells (38 files, 420 KB), so the booking listing's strip is real imagery, and crops keyed by value
  (Decisions 116). New states `site-skip`, `site-skip-jump`, `site-skip-searching`, `site-skip-malapert`,
  `coord-held-20s`, `compare-globe-held-20s`. Details under "Must list holistic review fixes".
- Performance budget review fixes, round 2 (2 findings, both fixed): a site or compare deep link waits on its real
  elevation (start 8.9 s on Fast 4G on #/mars/jezero, on the poster; it no longer cuts from the procedural crater to
  the DEM ~8 s later), the rest loads by need in batches (Moon and Mars before Venus and Mercury), late elevation
  rebuilds behind the curtain (Decisions 113); a world without its map draws in its mean colour and turns to the map
  over .9 s (Decisions 114). New states `system-moon-late`, `body-moon-late`. Details under "Performance budget review
  fixes, round 2".
- Performance budget review fixes (9 findings, all fixed): the start waits on the opening route's worlds only, then
  loads the other maps and the site elevation (Decisions 111): app start on Fast 4G 3.3 s on #/ (was ~9 s), 4.0 s on
  a site's deep link. `npm run perf` now counts vertex/index buffers (288 MB, within 300), fails a route that draws
  under two frames and always closes its no-vsync browser; `genTerrain` stays on the main thread (Decisions 112); KTX2
  closed (Deviations). New `scale` capture option and states `body-mars-zoomed-2x`, `site-jezero-2x`. Merge note to
  rerun `npm run perf` on the engine build. Details under "Performance budget review fixes".
- Performance budget (Must 10): `npm run perf` (`scripts/perf.mjs`) measures the production build on this Mac's GPU:
  JS 308 KB gzip on the start path, first paint 480–628 ms (phone, Fast 4G, 4× CPU), 60 fps on every view at
  1280 × 800 @2 and 1512 × 860 @2 with 3.6–4× headroom, the phone path at 60 fps under 4× CPU. GPU memory was over
  (394 MB at 1280 × 800 @2): the pixel ratio now has a 2.5 M-pixel budget (Decisions 108) and the data maps upload as
  R8/RG8 (109), 284 MB now. Fonts stay on Google Fonts (110). Killed the orphaned vitest worker (PID 12855) left from
  an earlier run. Details under "Performance budget (Must 10)".
- Rendering pipeline and the opening review fixes, round 2 (2 findings, one defect): Skip intro no longer pops the
  sunrise in; the glare swells from where the intro left it to .75 over .7 s, then the move as before (Decisions 107).
  New states `skip-3.1s`, `skip-3.4s`, `skip-4s`. Details under "Rendering pipeline and the opening review fixes,
  round 2".
- Rendering pipeline and the opening review fixes (29 findings, all fixed): the title sun kept above Earth's limb from
  the moving camera, so the sunrise is one rise (Decisions 99), the dawn's light leading the camera (100), night lights
  without the map's blue base (101); the atmosphere's ground hit at the mesh (no horizon dashes); the grade on `G.scan`;
  two first-paint frames, the intro's on #/ and the title's on deep links, with a status line and a drawn mark (103);
  one precompile for the pipeline (104); half-float glows and a dithered last pass (105), 8-bit buffers without float
  ones; Earth's thin edge as a ~2 px line (106); the system sun white-hot; ghosts short of the centre and the streak
  off the horizon; the intro's horizon by frame shape and darker labels (102); grain still under reduced motion; replay
  without the title ground; ground colours as tokens; meridian labels thinned round a pole (`lonStride`, tested). New
  states `sunrise-9.5s`, `sunrise-10.5s`, `poster-deep`, `reduced-motion-title`. Details under "Rendering pipeline and
  the opening review fixes".
- Rendering pipeline and the opening (Must 9): the HDR pipeline (`scene/post.ts`: half-float composer, bloom, the
  finish effect with the lens flare, AgX, the colour grade, the detection duotone and the grounds the CSS drew; terrain
  after the tone map; SMAA and grain; an opaque canvas), single-scattering atmospheres for Earth and Mars (sprite
  halos gone), an HDR sun with a lens flare that dims behind Earth, the intro as Earth's sky seen edge on from the
  same camera as the title (no cut), the Moon's south polar cap (`moon_cap*.jpg`, `--only=cap`), and a CSS first-paint
  poster. Phones take a lighter path. Decisions 88–98; tests 258 → 263; new states `poster`, `moon-pole-zoomed` (harness
  options `hold`, `noReady`). Details under "Rendering pipeline and the opening (Must 9)".
- Copy pass review fixes (15 findings, all fixed): pins described by roughness and relief only (`albedoAt` dropped);
  the credits footer and info sheet tie Moon matching to 60° from the equator (Decisions 87); "Earth doubles" over a
  no-data pin; the detail's Matches / Differs through the MoonBnb guard; the tagline shortened to "The Moon and Mars,
  on Earth" (fits phones again, Decisions 84); the worlds' labels and one name for the 14 sites (Decisions 86); the
  Earth lede; "landings on Mars" kept together on the intro; the fallback leads with what Eidolon does, the Moon first;
  the surface slots without "not added yet"; the copy check per part and over dist's JSON; new state
  `compare-illustrative-table`; two stale check strings. Details under "Copy pass review fixes".
- Copy pass (Must 8): intro lines, title blurb, credits footer, info sheet (no surface brightness; terrain form of an
  18.8 km window at 200 m; nothing under ~600 m; the Moon's 60° limit), system heading, body ledes (the Moon's 60°
  note), purposes in Eidolon's words by key (Decisions 83), Beyond, fallback, strips, compare table and booking copy
  rewritten; the tagline is "Earth doubles for the Moon and Mars" (Decisions 84); the engine's tested line under every
  result list and in the info sheet (Decisions 85). A display-time MoonBnb → Eidolon guard on engine strings (none in
  the fixtures). `npm run build` now greps the bundle for forbidden phrases (`scripts/check-copy.mjs`). New states
  `body-earth`, `results-jezero-foot`. Details under "Copy pass (Must 8)".
- Logo review fixes: 6 findings (minor), all fixed. Footer step 1 fits the mark's inked box (new
  `src/brand/alpha-box.ts`, tested), as wide as the reference's mark (124 dots on desktop, 82 on phone), and develops
  from the start of the dissolve in, so the wrap from step 4 crossfades again (`footer-step1-develop` re-seeked to
  16.8, reference retaken). Docs: module map row for `src/brand/`, the swap note on square `.logo` boxes, the Should
  Status note. Full capture 252/252. Details under "Logo review fixes".
- Logo (Must 7): the logo chat hasn't delivered, so an in-house stand-in mark (Decisions 81): a solid world disc and
  its coral double, a ring of the same size offset behind it, parted by a gap. `src/brand/logo.svg` is the one source:
  `brand.ts` makes the inline sprite (top bar, title lockup, credits footer, info sheet), the favicon (on a dark tile)
  and the image footer step 1 dithers (two inks, developing in Bayer order). The title wordmark stays (Decisions 82).
  New states `footer-step1-develop`, `info-sheet-foot` (reference baselines taken); full capture 252/252. Details under
  "Logo (Must 7)".
- Booking flow review fixes, round 2: 1 finding (major), fixed. A Review after an error was fixed then broken again
  now always redraws the errors (a Review counter in the form's markup beats `setHTML`'s cache, which `fixed()`'s
  in-place removal left stale). Regression asserted in `book-offseason-plan`. Details under "Booking flow review
  fixes, round 2".
- Booking flow review fixes: 22 findings, fixed but for the airport names, media fields and the notes capture
  (Deviations). Established sites carry the engine's country and access (Haughton: Canada, partner; the Dry Valleys:
  the Antarctic Treaty copy) and their centre elevation; the flow shows the search's warming and failure states;
  dates errors reach screen readers on each day; required fields marked; best-months caveat; Escape in a field
  blurs it; markers and Search this area behave during booking; one name and date form per chain; spacing and mono
  fixes; month on the day grid; listing templates pure and tested on the Green River example; routes in a tested
  `routes.ts`. Tests 243 → 253; 11 new states; full capture 248/248. Decisions 77–80. Details under "Booking flow
  review fixes".
- Booking flow (Must 6): from an Earth double on the compare view ("Plan a test campaign here") to a requested test
  campaign, each step a route under the compare's (`…/book`, `/book/plan`, `/book/review`, `/book/done`) over the
  compare's stage. Site listing on `site_listing.json` (practical suitability apart from the terrain match, access and
  the permits copy it drives, surface and climate, season, an indicative cost per person-day, the orbital strip);
  the plan (purpose, days picked on a 14-day weather window, team, equipment, notes) checked on Review with inline
  errors that clear when fixed; review; confirmation with a reference; a mock that says it sends nothing. Established
  analog sites can be booked too (the Artemis regions' doubles). `data/booking.ts`, `ui/booking.ts`; tests 229 → 243;
  13 new states; full capture 228/228. Decisions 69–76. Details under "Booking flow (Must 6)".
- Real data on the demo path review fixes, round 2: 3 findings, all fixed. Pins on Jezero, Gale and Hadley–Apennine
  get real terrain (a pin patch per stage site over its extent plus a pin's width, at a pin's spacing; `patchFor`
  takes the patch closest to the samples); the phone compare legend drops its plate and sits below the block again;
  the Mars globe is MDIM's detail over the MGS TES albedo (Hellas no longer white, no haze band, dark features back).
  2 new states. Details under "Real data on the demo path review fixes, round 2".
- Real data on the demo path review fixes: 21 findings, all fixed. Site data landing after start now redraws the
  terrain legend and note and re-renders the panel (crops, credit lines, no-data box, compare's lines); the Moon globe
  is LROC WAC detail over Clementine 750 nm albedo, maria back (Procellarum 80 against 67 on the prototype, was ~125);
  28 Earth crops for the established sites from Landsat WELD 1999 via NASA GIBS (Blue Marble where WELD has none); the
  polar cap has its own "resampled to 1 km" credit and the south-pole patches reach a window further, so nearby pins
  stay at 240 m; polar crops keep black shadow and their own credit; Lake Salda floods only the lake; the Copernicus
  notice in full in the info sheet and under compare; the no-data heading names the search engine; the phone legend
  on a plate; fetch-script checks (206, GLO-30 HEAD, PDS sample type, polar check with sites). 3 new states; 198/198
  captures. Details under "Real data on the demo path review fixes".
- Real data on the demo path (Must 5): `npm run fetch:real` (`scripts/fetch-real-data.mjs`; dev deps `geotiff`,
  `sharp`) fetches from USGS Astrogeology, PDS (LROC, LOLA), NASA GIBS, NOAA NCEI and Copernicus on AWS. Globes: Viking
  MDIM 2.1 colour (Mars), LROC WAC (Moon), Blue Marble NG with relief and bathymetry, Black Marble, MODIS water mask
  (Earth), MOLA, LOLA and ETOPO1 bump maps with stated ranges; 4K. Site elevation: 63 16-bit patches (2.9 MB) for
  Jezero, Gale, Hadley–Apennine, the four south-pole regions (LOLA polar), their compare windows, the established Earth
  sites, every mock Earth cell and the lunar south polar cap; `heights()` uses them wherever one holds the window, so
  site views, maps, compare windows and the mock's windows and twins are real there. 14 orbital crops (MDIM, LROC WAC
  global and polar). Credit lines in the site panel and terrain note, sources in the info sheet and footer,
  `docs/credits.md`. Tests 219 → 229; 4 new states; full capture 192/192, no console errors. Details under "Real data on
  the demo path (Must 5)".
- Results rework 4/4 review fixes, round 2: 1 finding, fixed. A pin's search by coordinates now shows in the status
  bar ("Reading Mars terrain…" with the pulsing dot; above the sheet on phones) once the terrain shows: deep links and
  pins moved on the site view, whose progress box is below the fold. The phone's terrain legend moves clear of that
  line (and of the warming line). New state `engine-pin-moved`. 219 tests, 184/184 captures.
- Results rework 4/4 review fixes: 14 findings, all fixed. Earth site dives no longer search (only Mars and Moon
  consult it); any search still running when the turn ends holds the frame ("Searching Earth" for a slow name); a
  fling no longer undoes the dive's turn; the frame's bar follows a newer search; the terrain's no-elevation note
  follows a late no_dem; unsupported_purpose copy without Try again; `/health` polled from boot with "Search engine
  starting up…" in the status bar (above the sheet on phones); warming retries redraw nothing; skeleton cards at a real
  card's height; a scrim behind the phone frame's readouts. Tests 218 → 219; 6 new states; full capture 182/182, no
  console errors; typecheck, tests and build green. Details under "Results rework 4/4 review fixes".
- Results rework 4/4 (Must 4 part 4, Must 4 done): states by source. A search by name shows nothing for its
  milliseconds (a skeleton only if slow), with filters a skeleton, by coordinates a "Reading Mars terrain…" box with a
  time-based bar; from the body view a pin's search holds the detection frame on the globe with the same bar, the globe
  usable (drag, zoom, a new pin replaces it), then dives when it answers. One search by coordinates at a time (an
  AbortController through the seam; a late answer never lands). Warming up with a bar from `/health`'s uptime, then the
  cards by themselves; errors, no elevation data and failed Show more in one state box keyed on the code; the terrain's
  no-elevation note; no close analog under filters offers Clear filters. Tests 210 → 218. Harness: tap at fractions;
  4 new states. Details under "Results rework 4/4".
- Results rework 3/4 review fixes, round 2: 4 findings, all fixed. The mock ranks per target and surface (the six
  barren purposes share their doubles, purpose echoed) and the filters mask that one ranking, each cell keeping its
  scores (Search this area keeps Jezero's first double; Exclude polar and partners only take cells out). On compare a
  purpose or filter change keeps the detail until the answer lands, the doubles box keeps its height while busy, and
  the control used stays where it was. Tests 208 → 210; 2 new states; full capture 162/162, no console errors;
  typecheck, tests and build green. Details under "Results rework 3/4 review fixes, round 2".
- Results rework 3/4 review fixes: 19 findings, all fixed but the globe's area outline (Deviations). Named-feature
  search: featured sites matched by name (the Artemis regions), the Moon's 60° limit stated, 4 dp, options voided per
  keystroke and per render (no stale Enter), closes on blur; the purposes and countries asked again on every settled
  search with failure copy; the surface box both ways; the compare's 20 only under its opening query, else "isn’t
  among this search’s results"; the form hidden on no_dem and unknown_target; "No Earth sites match these filters." +
  Clear filters; unknown_target's "Find it by its IAU name"; named targets' lede and copy; Search this area on-state,
  fade, scroll, phone magnifier. Harness `expect`; 9 new states. Tests 206 → 208. Full capture 158/158, no console
  errors; typecheck, tests and build green. Details under "Results rework 3/4 review fixes".
- Results rework 3/4 (Must 4 part 3): purpose picker (required, rover mobility by default, polar lighting disabled,
  from `/purposes`) and filters (country from `/sovereigns`, Artemis Accords partners only, exclude polar, include
  vegetated land, area) above the doubles on the site and compare views, each change asking the search again through
  the seam (one search per site and query); Search this area on the globe compare's Earth globe (the ground in view as
  a bbox); the named-feature search (IAU autocomplete, an ARIA combobox) on the Mars and Moon body views, opening
  featured sites by their IAU name and any other feature as a named target (`Name@lat,lon`); the note naming the IAU
  feature compared and when it is wider than the 18.8 km window. Mock: the engine's 3,848 targets (no satellite
  craters) as a lazy 73 KB chunk (`scripts/trim-targets.mjs`); judges past an example fall from its last. New
  `ui/target-search.ts`, `docs/credits.md`. Tests 195 → 206. Harness: `select`, `wait`, positioned `wheel`; 10 new
  states. Full capture 140/140, no console errors; typecheck, tests and build green. Details under "Results rework 3/4".
- Results rework 2/4 review fixes, round 2: 3 findings, all fixed. A named target's compare window is labelled and
  drawn on the IAU centre its search reports (`centreOf`; the mock's named windows and the fallback terrain sample the
  archetype there), so labels, mock and engine windows agree; marker labels go right, left, under or above, off the
  other markers (`ui/label-spot.ts`); both twins are drawn from the windows' elevation in every mode (engine PNGs on
  the cards only). Tests 189 → 195. Full capture 120/120, no console errors; typecheck, tests and build green. Details
  under "Results rework 2/4 review fixes, round 2".
- Results rework 2/4 review fixes: 15 findings, all fixed. A window landing redraws only the table, maps and scenes
  (drawer and focus stay; markers give focus back); warming_up and network elevation failures retried every 3 s for a
  minute; hillshades stretched to their own range (twins and thumbnails show relief; numpy edge gradients); honest
  twins copy per source; a placeholder for a missing or failed twin; Earth pin labels flip left or under, the tag a
  ring, the 14 established sites a faint layer; mock windows drawn at 94² uncached (4 ms, no pin eviction). New mock
  modes `noimage` and `asengine` (capture only). Tests 184 → 189. 4 new capture states. Full capture 120/120, no
  console errors; typecheck, tests and build green. Details under "Results rework 2/4 review fixes".
- Results rework 2/4 (Must 4 part 2): the compare's 3D terrain, minis and table come from the data seam's elevation
  windows (`terrainOf`: target by name or point, Earth pin by cell; the frontend's terrain until they land and where
  there are none), and the mock's elevation is now the frontend's terrain of the same window (no more value noise), so
  the merge is a swap. The engine's twin hillshades side by side above the result's detail (a coordinate target's
  drawn from its point window). Earth pins on the globe compare: footprint squares, a dot and an "Analog site" label
  line when inside one of the 14 established sites (the frontend's list: the engine has none). New `terrain/tiles.ts`;
  `measure` split out of `genTerrain`. Tests 174 → 184. 3 new capture states. Full capture 112/112, no console errors;
  typecheck, tests and build green. Details under "Results rework 2/4".
- Results rework 1/4 review fixes, round 2: 2 findings. The mock's derived scores now agree with each other as the
  engine's do (landform shape from rank, judge and properties in line, cosine from their mean, close / partial / weak,
  empty mode under 0.80); picking another double on compare starts at the top with focus on its heading. New state
  `results-jezero-pick`. Tests 173 → 174. Full capture 106/106, no console errors; typecheck, tests and build green.
  Details under "Results rework 1/4 review fixes, round 2".
- Results rework 1/4 review fixes: 22 findings. No percentages on the demo path any more (engine prose as fractions,
  cards without the place prefix and landform mix, judge number out of the drawer); chips greyed and a legend; compare
  deep links past the five ask for 20; Show more keeps the cards on failure, keeps the drawer open, moves focus to card
  6; lazy thumbnails; disabled button style; property notes and per-property raw values; an "Other doubles" skip link.
  Capture: edge-empty scrolled to the doubles, 4 new states (`results-jezero-list`, `results-jezero-low`,
  `results-jezero-low-list`, `results-loading-more`). Tests 167 → 173. Full capture 104/104, no console errors;
  typecheck, tests and build green. Details under "Results rework 1/4 review fixes".
- Results rework 1/4 (Must 4 part 1): cards (hillshade, rank, notes, country, coordinates, established-site tag, shape
  match, summary, three status chips), five then "Show more" to 20, the capability banner for fair and weak targets (a
  count, not a percentage), the result detail on the compare view (shape match, score, rough likelihood bar, surface
  badge, all six properties with status, matches and differs, every caveat, climate, location, engine values drawer).
  No percentages of ours anywhere (table's steep slopes now km²); every engine string escaped. New `ui/results.ts`,
  `data/hillshade.ts`; seam: show more, `imageOf`/`windowOf`. Tests 148 → 167. Harness: scroll `to`; 5 new states.
  Full capture 96/96, no console errors; typecheck, tests and build green; production JS 223 KB gzip. Details under
  "Results rework 1/4".
- Data module review fixes, round 2: the Artemis south-pole sites list their curated analog sites under the
  no-elevation note ("this site"; "this point" for pins), unscored, with "Compare with Earth doubles" on the first;
  the globe compare shows them as Earth markers. `knownOf` in the seam (+1 test, 148). New capture state
  `results-moon-malapert` (reference baseline taken). Full capture 86/86, no console errors; typecheck, tests and
  build green. Details under "Data module review fixes, round 2".
- Data module review fixes: 22 findings, 21 fixed, 1 deferred to Must 4 (cell names and marker spread). Blocker: a
  failed search no longer re-asks in a loop (`doublesOf(…, again)`, one settle handler per search, warming retry every
  3 s that stops at `start_failed`). Mock filters are a hard mask; four made-up pool cells (established sites,
  rugged), sub-resolution targets and weak/good tiers; answers handled in a guarded path; spec §6 copy, Try again,
  coordinate search; Shape match column head and sr text; live region; focus kept; detection frame copy from the
  search; compare Earth terrain rebuilt when the search names the pin; marker clicks without the 6 s wait; weather in
  `data/weather.ts`; `?capture` seeks yield a task per step. Capture: scroll steps on the doubles states, new
  `compare-globe-cell`, results reference baselines retaken. Tests 129 → 147. Full capture 84/84, no console errors.
  typecheck, tests and build green; production JS 220 KB gzip. Details under "Data module review fixes".
- Must 3, data module on the engine's contract: `data/client.ts` (the seam), `mock.ts` (examples replayed at the
  engine's latencies, derived responses, `?mock=slow|empty|fail|warming`, `no_dem` beyond 60° on the Moon), `http.ts`
  (VITE_DATA=engine, not run), `listing.ts` (booking listings), `pins.ts` (was `standin.ts`, ranking deleted),
  featured IAU names. The site and compare panels, compare markers, crumbs and captions now read the search results
  (country, coordinates, shape match; no percentages); compare takes Earth pins as doubles. New dev dependency ajv
  8.20.0. Tests 86 → 129 (schemas, mock modes and latencies on fake timers, HTTP requests and errors). New capture
  state `compare-jezero-cell`. Full capture 82/82, no console errors. typecheck, tests and build green; production JS
  219 KB gzip. Details under "Data module (Must 3)".

### 2026-10-19
- Renamed `docs/Eidolon frontend remaining work.md` → `docs/plan.md`; `git init -b main`; `.gitignore`.
- Read the plan, the prototype (all but line 519), the engine spec, search engine doc, contracts README, every schema
  and every example; surveyed the engine bundle (findings under Merge notes).
- Wrote this log and the plan for items 1 and 2.
- Scaffold: Vite 8.3.4, TypeScript 7.0.2 (native `tsc`), Vitest 5.0.5, three 0.186.1 (+ @types/three 0.186.0),
  GSAP 3.15.0, postprocessing 6.39.5, Playwright 1.64.1 with Chromium 156, json-schema-to-typescript 16.0.0.
  postprocessing's peer range is `three >= 0.168 < 0.187`: don't bump three past 0.186 without bumping postprocessing.
- `.env` sets `VITE_DATA=mock` (typed in `src/vite-env.d.ts`); `.env*.local` stays ignored.
- `npm run extract:textures`: 11 JPEGs (6.6 MB total) + manifest in `public/textures/`.
- Contracts copied verbatim (`diff -r` clean) to `contracts/`; spec + search engine doc to `docs/engine/`;
  `contracts/ENGINE_COMMIT` = `ec4e20b7203bdda79acb06f1ccadea2b4dbcb342`. `npm run types` writes
  `src/data/types.gen.ts` (MatchResult, SiteListing, Target, ApiError, SearchRequest, SearchResponse, TargetSummary,
  TargetsList); `src/data/api.ts` hand-types Health, Purpose(s), Sovereigns, TargetDetail, Elevation.
- Verified: `npm run typecheck`, `npm test` (exit 0, no tests yet), `npm run build`, `npm run dev` serves `/`,
  `/src/main.ts` and `/textures/*.jpg` (200).
- Item 2 prerequisite: `src/coords.ts` and `src/astro.ts` copied verbatim from the prototype with colocated tests
  (68 passing); `npm test` and `npm run typecheck` green. Function list, deviations and 10 candidate fixes under
  "Item 2 prerequisites". Sanity anchor: `marsTime` reproduces the published MSD 44795.9998 at 2000-01-06 00:00 UTC.
- Capture harness: `scripts/capture.mjs` + `scripts/capture-states.mjs`, 38 states × 2 viewports; reference baselines
  76/76 in ~4.5 min (fake clock, rAF throttled to 20 fps); build target probed against the placeholder (falls back to the
  fake clock, interactive states fail cleanly until the port). Details under Verification harness.
- Port stage 1 (skeleton, ?capture, intro, sunrise, title): shell, tokens and styles, motion clock and the ?capture
  contract, body/site data, scene modules in r128 parity colour, router, intro and title views. 11 states × 2
  viewports at pixel parity with the reference (details under "Port stage 1"). typecheck, 68 tests and build green.
  Production bundle: 164.5 KB gzip JS (three included), under the 350 KB budget.
- Port stage 2 (body globe view and its UI): views/body.ts, orient (orientTo/orientToSun/orientToLL), input, HUD,
  graticule, markers, chrome and clocks, panel (target and home), coordinate entry. 5 new states × 2 viewports at
  parity, stage 1's 11 unchanged (details under "Port stage 2"). typecheck, 68 tests and build green; production JS
  187 KB gzip.
- Port stage 3 (site view by deep link, then the polar fix): terrain modules (procedural, sample, mesh), the stand-in
  and pins, topo map and crops, terrain overlay, site view, `setTerrain`, terrain viewports, panel site branches; then
  the site projection (`llToLocal`/`localToLL`) for edges, readout, crops and pin sampling, the ±50° clamp lifted,
  `orientFor` defined at the poles, markers spread. Two new states (`site-moon-malapert`, `coord-moon-pole`) with
  reference baselines. 8 of the 9 parity states match; site-moon-south and the two new polar states differ on
  purpose; stages 1–2 unchanged (details under "Port stage 3"). typecheck, 80 tests and build green; production JS
  196 KB gzip.
- Port stage 4 (dive, detection frame and compare): `ui/detection.ts`, `views/compare.ts`, the dive timeline in
  `views/site.ts` (orient phase `faceSite`, nested `dive()`), compare markers per viewport, the panel's compare
  branch, `.scan-row`, compare to scale (18.8 km windows, one exaggeration, Same scale globes). New test
  `terrain/procedural.test.ts` (window samples the same ground). Harness tap wait; `dive-0.8s` reference retaken.
  dive-0.8s at parity; compare and the two engine pin states differ on purpose; stages 1–3 unchanged (details under
  "Port stage 4"). typecheck, 82 tests and build green; production JS 198 KB gzip.
- Port stage 5 (system, info sheet, Beyond, footer carousel; late assets; full parity sweep): `views/system.ts`,
  `views/info.ts`, `views/beyond.ts`, `ui/carousel.ts`, the overview input branches, hidden rendering in `draw()`, and
  the late-asset fix (tolerant gate with a 7 s ceiling outside capture, `onAsset` for textures and fonts). The 8 stage 5
  states match the reference (0.00–0.18 / 255); a full capture of all 40 states × 2 viewports shows the 32 earlier ones
  unchanged. Late assets tested with a throwaway Playwright script. Item 1 (port) and item 2 (Must visual bugs) ticked.
  typecheck, 82 tests and build green; production JS 206 KB gzip. Details under "Port stage 5".
- Port parity fixes, round 1: 30 reviewer findings worked through. Fixed 26 (dawn after leaving the title, phone intro
  frame and Skip, title annotations, footer caption, touch taps on globes, swipe-close of the info sheet, no-WebGL
  fallback page, phone system sun, phone top bar, Beyond labels and reveal timeline, reduced-motion staggers, Mars
  subsolar latitude from Ls, coordinate error announced, phone compare toggle in the sheet, map readout flip, inertia
  stopped on every route, terrain cache key, font gate, start-up failures, two ?capture gaps, per-frame allocations,
  pin cache cap); deferred 4 (sunrise seam to Must 9; warming, no-DEM and pin-search states to Must 3/4). New tests:
  Mars Ls against the Mars24 worked example, `prunePins`. Normal-mode smoke test (throwaway Playwright script on
  `vite preview`): phone tap on Earth, swipe-close, phone compare toggle (Globe, Same scale, hidden off compare, back
  over the stage on desktop), fling then featured-row dive (dot centred), no-WebGL page without console errors,
  manifest failure page, start with font files blocked, leaving the title mid-move. Full capture, 40 states × 2
  viewports: details under "Port parity fixes, round 1". typecheck, 85 tests and build green; production JS 207 KB gzip.
- Port parity fixes, round 2: 18 reviewer findings, all fixed (title label inset and satellite tag flip, no-WebGL
  app DOM inert and copy, cues hidden off the overview, info sheet and Beyond focus, reduced-motion light blend and
  footer stills, terrain UI handed off under the detection frame, graticule labels clear of the preview chip and the
  chip's flip, the overview's delayed `ov` tween killed, `leaveTitle`'s scoped kill, pixel-ratio measurement on
  rendered frames only, height-only canvas resizes, hemisphere after rounding, UTC weekdays, one scratch vector,
  `lon360` reuse). New tests: `hudLL` at the pole, tiny negatives, DMS (86). Full capture, 40 states × 2 viewports,
  and a normal-mode smoke test: details under "Port parity fixes, round 2". typecheck, 86 tests and build green.
- Port parity fixes, round 3: 1 reviewer finding (major), fixed: a typing-pause preview queued by the last valid
  keystroke no longer lands after an error or a cleared field (`coordInput` kills `pending` before its early
  returns). Reproduced and verified key by key with a throwaway Playwright probe at both sizes; full capture, 40
  states × 2 viewports, unchanged. typecheck, 86 tests and build green. Details under "Port parity fixes, round 3".
