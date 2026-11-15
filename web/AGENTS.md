# web/: the frontend, for agents

Vite 8, strict TypeScript, three.js 0.186, GSAP and postprocessing. There is no UI framework: panels are TypeScript
template functions written into the DOM. Run every command from `web/`; paths below are relative to it. The repo-wide
rules are in `../AGENTS.md`.

Never read `reference/eidolon.html` whole: line 519 is 4.5 MB of base64. Read it only by line range, at the prototype
line numbers the code comments cite. Never read `docs/progress.md` whole either (see Logging).

## Scripts

| Command | What it does | Needs |
| --- | --- | --- |
| `npm run dev` | Vite dev server on :5173 (fails rather than move port) | |
| `npm run build` | `tsc --noEmit`, `vite build` to `dist/`, then `scripts/check-copy.mjs` on `dist/` | |
| `npm run preview` | Serve `dist/` on :4173 | |
| `npm test` | Vitest, `src/**/*.test.ts`, always on the mock | |
| `npm run typecheck` | `tsc --noEmit` | |
| `npm run types` | Regenerate `src/data/types.gen.ts` from `contracts/*.json` and `contracts/api/*.json` | |
| `npm run capture` | Screenshot every state in `scripts/capture-states.mjs` at 1280×800 and 390×844 into `captures/build/`, plus sheets in `captures/compare/`. Reuses or starts the dev server. `-- --states=a,b`, `-- --viewports=desktop,phone,tablet,laptop,og` | Chromium |
| `npm run capture:ref` | The same states from the prototype into `captures/reference/` (the left half of each compare sheet) | Chromium, network (cdnjs) |
| `npm run a11y` | axe, WCAG 2.1 A/AA, over the main routes at both sizes on the dev server | Chromium |
| `npm run perf` | Build, then measure the budget on `vite preview` with this machine's GPU. Aborts on a software renderer | Chromium, a real GPU |
| `npm run poster` | Capture `title-shot` and `og`, then write `public/poster.jpg`, `poster-tall.jpg` and `og.jpg` | Chromium |
| `npm run fetch:real` | Fetch the real maps, elevation, crops and photos into `public/`. Cache in `.cache/real-data/`. `-- --only=globes\|cap\|normals\|clouds\|sites\|drape\|photos\|beyond` | Network |
| `node scripts/trim-targets.mjs [bundle]` | Regenerate `src/data/targets.json` from the engine bundle (default `../../eidolon_engine/eidolon_search`). Read-only on the bundle | The bundle |

Install Chromium for Playwright once: `npx playwright install chromium`. Run only one of capture, a11y, perf or poster
at a time: they share the GPU. Capture, a11y and poster reuse (or start) the dev server on :5173; perf runs its own
`vite preview` on :4173 and stops with ":4173 is already in use" while `npm run preview` or the `eidolon-preview`
launch entry is running. `test:live` and `warm` come with the engine import.

## Module map (`src/`)

`README.md`, "Project structure", has the map. What it leaves out:

- `app.ts`: the start gate (first map tiers, elevation patches, fonts) and the late-asset hook `onAsset`.
- `router.ts`: `apply()`, the route state machine; `routes.ts` parses hashes (pure, tested).
- `motion.ts`: the one clock (GSAP ticker → updates → render), the `MOTION` table, `RM`, `?capture`.
- `dom.ts`: `$`, `$$`, the write-on-change setters (`setText`, `setStyle`, `setAttr`, `setHTML`) and `esc`.
- `data/api.ts`: `Engine` and `EngineError`. Frontend-owned in `data/`: `sites`, `bodies`, `pins`, `listing`,
  `booking`, `weather`, `photos`, `missions`.
- `scene/frame.ts`: the per-frame update and draw; `scene/post.ts`: HDR, bloom, AgX; `scene/layout.ts`: `L`, `token()`.
- `../index.html`: the static markup and some copy (the title blurb, the info sheet).

## The seam rule

- UI code gets engine data only from `src/data/client.ts`. Never import `mock.ts` or `http.ts` outside `src/data/`, and
  never import from `contracts/` in app code. Only `mock.ts` reads the examples at runtime; tests may read `contracts/`.
- `VITE_DATA=mock|engine` (default `mock`, from `.env`). Set `engine` on the command line only (`VITE_DATA=engine npm
  run dev`, `build` or `perf`), never in `.env` or `.env.local`: Vite loads them in tests too, and `npm test` breaks.
- `VITE_API`: the engine's base URL, read at build time (default `http://127.0.0.1:8000/api/v1`). `VITE_SITE_URL` (in
  `.env`): the deployed origin and path (a sub-path deploy such as GitHub Pages needs the path), no trailing slash;
  `index.html` prefixes it to `og:url` and `og:image` (`%VITE_SITE_URL%/og.jpg`).
- `?mock=` works in mock mode only, as a comma-separated list before or after the hash: `slow` (every call 10 s),
  `empty` (no close analog), `fail` (every call fails as `network`), `warming` (503 `warming_up` for 35 s), `noimage`
  (no Earth hillshades), `asengine` (label the mock's images as the engine's).
- Every failure is an `EngineError` keyed on its code (`data/api.ts`). The UI shows one state per code. Booking,
  listings, weather, photos and the featured sites are frontend-owned in both modes.
- `contracts/` is a copy of the engine bundle's `code/contracts/` (it diffs clean apart from `ENGINE_COMMIT`), and
  `docs/engine/` of its `code/docs/frontend_spec.md` and `search_engine.md`; the bundle is at
  `../../eidolon_engine/eidolon_search`. To change them, copy both again, update `contracts/ENGINE_COMMIT`, then run
  `npm run types` and `npm test`. `contracts.test.ts` checks every example and the mock's output against the schemas.

## The `?capture` contract

Full spec: `docs/progress.md`, under a `####` heading the section grep misses; find it with
`grep -n '^#### The .?capture' docs/progress.md`.

`?capture` (before or after the hash) makes screenshots deterministic. Headless software WebGL skews timing, so
mid-animation frames only match from run to run when time is seeked, not waited for. In capture mode the app clock is
frozen, sim time is pinned to 2026-10-04T12:00:00Z at ×600, and CSS motion is off under `<html data-capture>`.
`window.__eidolon` has `ready` (resolves once textures, fonts, the full maps and the first frame are in), `route(hash)`
(applies a route and resets the route start) and `seek(t)` (forward only, to `t` s after the route start, in 1/60 s
steps). To keep it working:

- Read time from `clock()`, `wallNow()` or `simNow()` in `motion.ts`. Never use `performance.now()`, `Date.now()` or
  `setTimeout` for anything animated or timed. Schedule with `gsap.delayedCall`, and run per-frame work through
  `onUpdate`. Never start a second animation loop.
- A new asset that a view needs must hold `ready`. A new view or state gets a state, with its `check` line, in
  `scripts/capture-states.mjs`. `?wx=feed` lets captures answer the weather feeds from `scripts/fixtures/`.

## Generated files: never edit them by hand

| File | Made by |
| --- | --- |
| `src/data/types.gen.ts` | `npm run types` |
| `src/data/targets.json` | `node scripts/trim-targets.mjs` |
| `src/data/surface.gen.json` | `npm run fetch:surface` (Diviner and THEMIS values at the featured sites; network) |
| `public/textures/`, `public/sites/` (patches, crops, manifests), `public/photos/` | `npm run fetch:real` |
| `public/poster.jpg`, `public/poster-tall.jpg`, `public/og.jpg` | `npm run poster` |

Change the generator or its input, then rerun it. `src/data/real-sites.ts` is a hand-kept copy for `fetch:real`;
`real-sites.test.ts` fails when it drifts from `sites.ts`, `bodies.ts` and `mock.ts`.

## Before you commit

1. `npm run typecheck`, `npm test` (all pass; 388 at hand-off) and `npm run build` (it fails on a copy breach).
2. `npm run capture -- --states=<the states you touched>`, at both viewports by default. Open
   `captures/compare/<viewport>/<state>.png` and check each one against its check line. A change to `scene/`,
   `router.ts` or shared CSS needs the full run (662 shots at hand-off).
3. `npm run a11y` after DOM, focus, label or colour changes. `npm run perf` after adding JS, textures, render targets
   or per-frame work: only about 9 KB of JS and 5 MB of GPU memory are left.

| Budget | Target | At hand-off |
| --- | --- | --- |
| JS fetched to start `#/`, gzipped, three.js included, as `npm run perf` measures it (lazy chunks such as `targets` are not counted, so `dist/assets/*.js` sums higher) | under 350 KB | 340.8 KB |
| GPU memory, all three worlds | under 300 MB | 294.6 MB |
| First paint (poster), phone on Fast 4G | under 1.5 s | 0.45–0.47 s |
| Frame rate | 60 fps laptop, 30 fps mid-range phone | 60 fps (M3, phone proxy) |
| a11y | no WCAG 2.1 A/AA violations | 52/52 |

## Conventions

- Strict TypeScript; never loosen `tsconfig.json`. Tests sit beside the code (`*.test.ts`); new pure modules get one.
- Every string from the engine, a URL or the user that goes into a template's HTML, text or attribute, goes through
  `esc` (`src/dom.ts`). Responses are typed, not checked at runtime.
- The scene lives all session; `apply()` runs each view's enter and leave. `dispose()` any geometry, material, texture
  or render target you replace (`terrain/mesh.ts` `build`), and kill the tweens and delayed calls you own before you
  start new ones (`t?.kill()`, `gsap.killTweensOf`).
- Reduced motion: read `RM` from `motion.ts` when the move starts (it updates live). Moves become instant or a
  crossfade. Every CSS animation needs a `@media (prefers-reduced-motion:reduce)` override.
- Design tokens (colour, type, layout) live in `src/tokens.css`; JS reads layout values through `scene/layout.ts`
  (`L`, `token()`) and never redefines them. Per-frame DOM writes use the setters in `dom.ts`.
- A shortcut with a known limit gets a comment: `// shortcut: <the limit>, <when to upgrade>`.
- Runtime deps: three, gsap, postprocessing. Add one only with a reason in Decisions. three stays ≤ 0.186
  (postprocessing's peer range is `< 0.187`).

## Copy rules (`docs/plan.md`: Must, copy pass; Design system, Rules)

- Say Eidolon, never MoonBnb. Say terrain form at 200 m; never claim surface brightness or features under about 600 m.
- No score as a percentage ("% analog", "68% match"): show confidence, Earth rank and the six properties; the judge
  likelihood only as a rough bar. Quote the tested line verbatim: "Typically 2 of 3 searches find a good terrain
  analog in the first five results."
- Never blend terrain fidelity and practical suitability into one number. Always show gaps, caveats, "not measurable".
- Don't promise south-pole matching (no Moon elevation beyond 59.5°). Purposes choose the land searched; never say
  they weight the match.
- Sentence case; JPL ops words (site, campaign, window, traverse, sol), never game words. Every number has its unit;
  coordinates follow the body's convention, to 4 places wherever a site is identified.

`scripts/check-copy.mjs` (in `npm run build`) fails on MoonBnb, "surface brightness", percentage scores, two retired
taglines, or a missing tested line or "terrain form at 200" in `index.html` or the JS. Review covers the rest.

## Logging and credits

Log every change that lands in `docs/progress.md`. Find a section with `grep -n '^## \|^### ' docs/progress.md`, then
read only that range (`sed -n 'A,Bp'`). Paths in the log are relative to `web/`.

- **Log:** a bullet under today's `### YYYY-MM-DD` at the top of `## Log` (newest first): what changed, in which
  files, then `Verification:` with what you ran and the numbers.
- **Decisions:** a call the plan left open, appended to `## Decisions` as `N. **Short title** (item): what and why`,
  numbered on from the last (`grep -nE '^[0-9]+\. \*\*' docs/progress.md | tail -1`; 201 at hand-off).
- **Deviations:** where the build differs from `plan.md`, `merge-plan.md` or the engine spec: a bullet under
  `## Deviations`, grouped under a bold `- **Item:**` line. Engine-side findings go in `## Merge notes`.
- **Credits:** a new outside asset gets a row in `docs/credits.md` (source, licence, credit line) and an in-app credit.
