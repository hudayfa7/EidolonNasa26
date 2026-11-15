# Eidolon

NASA Space Apps Challenge 2026: *Identify Earth locations that analog the permanent Moon base locations and Mars.*
Pick a site on the Moon or Mars and Eidolon ranks the places on Earth whose terrain form comes closest at 200 m, shows
them side by side, and helps plan a test campaign at one.

This folder, `web/`, is the frontend (Vite, TypeScript, three.js 0.186, GSAP, postprocessing; no UI framework). It runs
two ways: on a mock that replays the search engine's own example responses (the default: everything works offline), or
on the live search engine in `../engine/` (`VITE_DATA=engine`). Run every command below from `web/`.

## Quick start

```sh
cd web
npm ci                 # not npm install: it keeps package-lock.json from churning
npm run dev            # http://localhost:5173/, on the mock
```

On the live engine: start it first (the repo's `README.md`, Run it with the real model: its data, a conda environment,
then `engine/run_server.bat` or `run_server.sh`, ready in about 35–75 s), then

```sh
VITE_DATA=engine npm run dev          # PowerShell: $env:VITE_DATA='engine'; npm run dev
```

`npm run build && npm run preview` serves the production build at http://localhost:4173/. Both ports are strict (the
command fails rather than move to another port).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck, build to `dist/`, then the two gates: the bundle's copy (`scripts/check-copy.mjs`) and the data licences (`scripts/check-credits.mjs`) |
| `npm run preview` | Serve `dist/` on :4173 |
| `npm test` | Unit tests (Vitest, `src/**/*.test.ts`), always on the mock |
| `npm run test:live` | The data seam against the running engine: every call, answers checked against the schemas (run once while it warms up, once warm) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run types` | Regenerate `src/data/types.gen.ts` from the engine's JSON Schemas in `contracts/` |
| `npm run check:credits` | Fails if a source the data scripts read has no entry in `scripts/sources.mjs`, no licence, or no row in `docs/credits.md` |
| `npm run capture` | Screenshots of every state at desktop and phone size into `captures/build/` (`--states=a,b`, `--viewports=…`); reuses or starts the dev server on :5173. With `VITE_DATA=engine` the mock-only states are skipped |
| `npm run capture:ref` | The same states from the prototype into `captures/reference/`; needs your own local `reference/eidolon.html` (not in git) |
| `npm run a11y` | axe (WCAG 2.1 A/AA) over the main routes at both sizes |
| `npm run perf` | Build, then measure the budget: gzipped JS, first paint, GPU memory, frame rate. Needs a real GPU (Metal on macOS, Direct3D 11 on Windows) |
| `npm run poster` | Remake `public/poster.jpg`, `poster-tall.jpg` (the no-WebGL page) and `og.jpg` (link preview) from captures |
| `npm run fetch:surface` | Networked: read the Diviner, THEMIS, cave, pit and GRS values at the featured sites into `src/data/surface.gen.json`, with each source's provenance (range requests, nothing large downloaded) |
| `npm run fetch:real` | Networked: fetch the real maps, elevation patches, crops and photos into `public/`, with provenance (`-- --only=globes\|sites\|…`; `--only=provenance` rewrites just the provenance records, downloading nothing) |

Run one of capture, a11y, perf or poster at a time. The harness scripts run on macOS and Windows.

## Configuration

Build-time variables (`.env`):

- `VITE_DATA`: `mock` (default) replays the engine's examples in the browser; `engine` calls the engine over HTTP. Set
  `engine` on the command line only, never in `.env` (Vite loads it in tests too). In an engine build, `?mock=on` falls
  back to the mock.
- `VITE_API`: the engine's base URL in engine mode, default `http://127.0.0.1:8000/api/v1`.
- `VITE_SITE_URL`: the deployed origin, no trailing slash; makes `og:url` and `og:image` absolute. Empty in development.

URL switches (before the hash or after it, `/?mock=slow#/mars` or `#/mars?mock=slow`):

- `?mock=` (mock mode only, comma-separated): `slow` (every call 10 s), `empty` (no close analog), `fail` (engine down),
  `warming` (503 warming_up for 35 s), `noimage` (no Earth hillshades), `asengine` (label the mock's images as the
  engine's).
- `?capture`: deterministic mode for the harness: frozen clock, fixed sim epoch, no transitions, `window.__eidolon`
  to seek time and wait for readiness. `?wx=feed` lets captures answer the
  weather feeds from `scripts/fixtures/`.

## Routes

| Hash | View |
| --- | --- |
| `#/` | Intro on first load, then the title (Earth from low orbit) |
| `#/system` | Earth, Moon and Mars in a line-up; the info sheet below |
| `#/beyond` | Beyond the Moon and Mars |
| `#/mars`, `#/moon`, `#/earth` | A world's globe beside its panel: featured sites, search, pins |
| `#/mars/sites`, `#/moon/sites` | Site selector grid |
| `#/mars/jezero` | A site's terrain and its Earth doubles; pins are `#/mars/@18.3800,77.5800` |
| `#/mars/jezero/compare/salda` | The site beside an Earth double; add `/globe` or `/overlay` for the other modes |
| `…/compare/salda/book[/plan\|/review\|/done]` | Booking flow: listing, plan, review, requested |

## Project structure

| Path | Contents |
| --- | --- |
| `src/main.ts`, `app.ts` | Entry: WebGL check, then the start (gated on the opening route's maps) |
| `src/router.ts`, `routes.ts` | Hash routes as data (pure, tested) and the state machine that applies them |
| `src/motion.ts` | The one clock (GSAP ticker → frame → render); `?capture` freezes it |
| `src/coords.ts`, `astro.ts` | Coordinate formats and parser; orbital elements, sun position, Mars time |
| `src/profile.ts`, `ellipse.ts`, `gesture.ts`, `dom.ts` | Measure line, landing ellipses, touch steps, DOM write helpers |
| `src/data/` | The data seam: `client.ts` (what the UI calls), `mock.ts`, `http.ts`, generated types, sites, bodies, booking, weather, photos |
| `src/scene/` | three.js: renderer, HDR post, planets and shaders, camera rigs, per-frame draw, input, sun, stars, Eidolon-1 |
| `src/terrain/` | Terrain blocks: real elevation patches, procedural fallback, engine-shaped windows, the mesh |
| `src/views/` | One module per view: intro, title, system, beyond, body, grid, site, compare, info sheet |
| `src/ui/` | DOM: panel, results, booking, campaigns, HUD, markers, chrome, phone sheet, no-WebGL fallback, Stretch tools |
| `src/brand/` | The logo (`logo.svg`, every variant derives from it) |
| `src/styles/`, `tokens.css` | CSS by area; layout and colour tokens |
| `contracts/` | The engine's schemas and example responses (a copy of `engine/code/contracts`; engine commit in `contracts/ENGINE_COMMIT`). The spec is `engine/code/docs/frontend_spec.md` |
| `public/` | Textures, elevation patches and crops, photos, fonts, posters |
| `scripts/` | Capture, a11y and perf harnesses, copy check, type generation, real-data fetch |
| `reference/eidolon.html` | The original prototype (visual reference only; very large single file). Local only, not in git: its textures have no recorded provenance |

## Data seam and the engine

The UI reads engine data only through `src/data/client.ts`, which picks `mock.ts` or `http.ts` by `VITE_DATA`. Both
implement the same `Engine` interface (`src/data/api.ts`) on the engine's contract in `contracts/`. Booking listings,
plans, weather, photos and featured sites are frontend-owned in both modes. The mock and its example responses load
after the start (a chunk of their own), so they cost nothing on the title screen and an engine build never fetches them.

The engine is connected: `npm run test:live` passes during warm-up and warm, the 99 engine capture states pass at both
sizes, and a11y and perf pass on the engine build. What the connection changed:

- **Warm-up.** The engine takes about 35 s to start warm and 56–74 s from a cold disk (its spec says 30–40 s). The
  "Starting up…" bar fills over 90 s, and an elevation window is asked again for 90 s; searches retry until it is ready.
- **No elevation where the body has data.** A search by coordinates the engine answers `no_dem` inside the Moon's 59.5°
  (or anywhere on Mars) is a network failure, not "no data"; beyond 59.5° on the Moon the client refuses it at once.
- **The Moon's cutoff is 59.5°**, the engine's, in every line of copy. The "Exclude polar sites, beyond 60° latitude"
  filter stays at 60, as the engine filters.
- **Hadley's compare caption** says its window is centred on Rima Hadley, about 18 km south-west of the Apollo 15 landing
  site (any site whose window is centred on a named feature over 10 km away says so).
- **Engine patches** (in `../engine/code`): a failed elevation read is no longer cached (E1), a repeat pin search reuses
  its window (E2), and the card hillshades are contrast-stretched (E5, which needs the engine owner's OK).
- **Known engine behaviour** (for its owner): an area filter round the first double can drop it (it merges sites under
  20 km to a different representative), and Arcadia, Meridiani and Elysium's live cells have no real image crops yet.

## How the climate fit works

Each result's detail shows a **Climate fit** (a word: Match, Partial or Gap) beside the terrain match. It is separate from
the terrain match and never blended into it: the ranking is terrain form at 200 m only, and the climate fit does not
re-rank, filter or weight anything.

**The two rows** (`src/data/climate.ts`, `climateFit`), each a coarse band, not a measured distance:

| Row | Earth side | Match | Partial | Gap |
| --- | --- | --- | --- | --- |
| Temperature | Mean annual air temperature, NASA POWER climatology (`T2M`; `powerClimate`) | 0 °C or below | up to 15 °C | above 15 °C |
| Dryness | Aridity index, Global Aridity Index v3.1 (the engine's `environment` block) | below 0.2 (arid) | below 0.5 (semi-arid) | 0.5 or more |

The engine also sends WorldClim 2.1 temperature and precipitation; Eidolon doesn't show them. WorldClim states no
licence, so it can't be shown to be "freely available without restriction", as the Space Apps participant terms require
of non-NASA data. NASA POWER's climatology, which the app already asks for each site, takes their place.

Each row scores 2 for a match, 1 for partial, 0 for a gap; 4 points is **Match**, 2 or 3 **Partial**, fewer **Gap**. An
Earth double with no climate (its climatology not loaded or unavailable) has no fit; it is never shown as a zero. The
bands are fixed because the Moon and Mars are far below freezing on average (`src/data/bodies.ts`) and have no liquid
surface water; the thresholds are our choice, set once at the top of `climate.ts`.

**What it cannot say.** The Earth side is air temperature and aridity at the Earth double's centre. The Moon and Mars
have no map of either that is comparable, so air is only roughly set against surface. It says nothing about rock type,
subsurface, biology, gravity or radiation (the detail lists those as not assessed or as what Earth can't reproduce).

**The NASA surface values** ("Measured at the site") describe the site and are *not* scored, because Earth has no
like-for-like value in our data. `scripts/fetch-surface.mjs` (`npm run fetch:surface`, network, no login) reads them by HTTP
range request, so nothing large is downloaded, and writes `src/data/surface.gen.json`:

| World | Dataset (provider) | Values | Resolution |
| --- | --- | --- | --- |
| Moon | LRO Diviner global high-resolution mosaics (NASA PDS Geosciences Node) | Bolometric and regolith temperature at local midnight, rock abundance | about 237 m/px, 70°S–70°N |
| Mars | THEMIS-derived global thermal inertia mosaic (USGS Astropedia; Fergason et al. 2006) | Thermal inertia, J m⁻² K⁻¹ s⁻¹ᐟ² (lower is dust or fine sand, higher is rock) | 100 m/px |
| Mars | Mars Global Cave Candidate Catalog v1 (USGS Astrogeology, NASA PDS; Cushing 2012, 2016), about 1,060 candidate entrances | Distance to the nearest candidate, and how many lie within 100 km | The catalogue's own points |
| Moon | Lunar Pit Atlas (LROC, Arizona State University, NASA PDS; Wagner and Robinson 2021), about 280 pits | Distance to the nearest pit, and how many lie within 100 km | The catalogue's own points |

**Caves.** This is how the "Subsurface and caves" factor is handled for the site. A catalogued entry is a *candidate* or a mapped
pit, never a confirmed cave, and the page says so. None of the featured sites has an entry within 100 km (the nearest is 614 km away
at Jezero and 367 km at Taurus–Littrow), which is a fact about the catalogues: the Mars candidates cluster around the Tharsis volcanoes.
The factor stays "Not assessed" for the Earth doubles: we hold no Earth cave data, so nothing is compared.

**Rock chemistry and water (Mars only).** The Odyssey Gamma-Ray Spectrometer's element concentrations (NASA PDS Geosciences Node,
Boynton et al. 2007; smoothed 5° bins, six small ASCII tables read whole) give each Mars site's iron, silicon, potassium, chlorine and
thorium, and water read from hydrogen (weight percent, sensed in the top metre or so: ice and water bound in minerals together). A bin is
about 300 km across at the equator, so these are regional values, not the site's own. Not scored, and shown in weight percent spelled out.

**Not covered.** Rock type and chemistry on the Moon (Clementine's 1 km iron oxide product is a colour-binned picture, not values, so it is
not used; Lunar Prospector's maps are the next candidate), rock type and chemistry on Earth (a lithology map, such as USGS GLiM, is not NASA data
and is not held), and biology and habitability anywhere (no NASA map of it exists to read). Rock abundance (Moon) and thermal inertia (Mars)
above are how rocky the ground is, not what it is made of.

**Kind of landform.** The verdict's "Kind of landform searched" gives, for a named feature, the process commonly behind its IAU descriptor
(`src/data/process.ts`: Vallis, Mons, Patera, …). The IAU names a landform's form, not its origin, so every line says "commonly" and the page
says it is inferred from the descriptor, not a finding about the site.

Each value is the median of the valid pixels in a window of about 2 km at the site's centre; the page shows the window, the
valid pixel count and the date. A searched site takes a featured site's values only within 40 km of the featured site's
centre. Not read: the Moon's south-pole sites (the engine has no Moon elevation beyond 59.5° and the mosaics stop at 70°),
Utopia Planitia (the THEMIS tile holds no valid pixels there), and any pin away from a featured site. Diviner midnight
temperature is the night-time floor, not an annual mean. Credits: `docs/credits.md`, "Surface values read at the targets".

## How the mission fit works

Each result's detail opens with a **Mission fit** card: the factor groups an analog can be judged on, weighted for the mission the
search is for (`src/data/mission.ts`, `missionBlock` in `src/ui/results.ts`). It is separate from the terrain match: it never changes the
engine's score, the order of the results, or which land is searched.

**The full method, every weight's reasoning and every source are in [`docs/analog-weights.md`](docs/analog-weights.md).** In short:

- **Three tracks.** Field sites (the engine's Earth doubles) are judged on terrain, climate, astrobiology, operations and infrastructure;
  facilities (HERA, CHAPEA, the NBL, ARGOS, NSRL…) on gravity, pressure and radiation, on crew and on infrastructure;
  hybrids (HI-SEAS, MDRS, Concordia) on both. A factor that does not apply is N/A; one with no data is "not assessed". Neither counts as zero.
- **Seven mission profiles** weight seven factor groups (sum 100). Gravity, pressure and radiation, and crew, carry weight where a mission needs
  them (EVA training, habitation, thermal testing), which no field site can give, so the app then says to pair a facility with a field site.
- **Scored today for a field site:** terrain (the engine's score), climate (the climate fit's band) and operations (workable months from NASA
  POWER; for rover mobility, EVA training and drilling also a **shadow fit**: the site view's own shadow march run on the site's and the Earth
  double's windows at grazing sun heights of 1°, 2° and 4°, compared; a judgment score, `src/terrain/shadowfit.ts`). A provisional tier (A 70+ … F) needs the field site to reach at least 50 of the mission's weight and half of that to be assessed.
- **In the booking flow.** The listing, the plan and the review each show a compact **Mission fit** block for the campaign's own purpose
  (it follows the plan's purpose select): the tier and score, what was scored, a warning (never a block) when the fit is only marginal or
  worse, and, for missions that need what no field site gives, the best facility to pair with the site (`bookingFit` in `src/ui/results.ts`).
  An established site has no search result behind it, so its terrain and climate are not scored there. It stays apart from the listing's
  practical suitability, and nothing in the request changes.
- **Known analogs.** A collapsed dropdown under the Earth doubles: the three established sites that stand in for most of the mission's
  weight, as compact ranked rows that open to their fact and source (`existingBlock`, `knownAnalogs` in `src/data/analogs.ts`). Field
  sites and hybrids rank together; one facility joins them only when the mission puts at least 25 of its 100 weight on gravity,
  pressure and radiation, and crew.
- **View tools and the site panel.** Sunlight, slope hazard and landing ellipse, which change how the block and the map
  look, sit in a **View tools** window over the stage (`src/ui/vtools.ts`), collapsed to its title until opened and open
  while a tool is on. Measure stays under the map it draws on. The panel keeps Imagery and credits and Known analogs as
  dropdowns, and the mission's weights as a bar in the "Filters and purpose" header.

This is a deliberate departure from `docs/plan.md`'s rule never to blend terrain fidelity and practical suitability into one number: the terrain score stays on its own line beside it, and the fit shows every factor's own score.

**The detail's layout.** The two answers first (Mission fit, Analog verdict), then one group each, named for whose values it holds:
"Terrain: Earth double against the site", "Climate: Earth double against the site", "Site: measured on Mars" (or the Moon), and
"Earth double: location and access".

## The analog verdict, listed analogs and Earth surface temperature

Three additions to the result detail and the cards, all derived from data we already hold or read from NASA, none of them scored:

- **Analog verdict** (`verdict` in `src/ui/results.ts`): one block that says what is strong, partial, a gap and not measurable (the six
  properties' statuses), the climate fit, the nearest listed analog site, what is not assessed, what the search was for and how the
  analog could help (trials that depend on terrain form; gravity, vacuum and radiation need other facilities). It adds no claim and
  never weights anything: a purpose says what the search was for, not how it scored.
- **Not near a listed analog** (`placeTag`, `unlistedNote`): a card is tagged, and a line above the cards counts them, when its cell is
  neither inside nor within 150 km of any of the 14 established analog sites Eidolon lists (`src/data/sites.ts`). It is only against those 14,
  so it means "a candidate for a site not yet characterised here", never "undiscovered": the literature may know the place.
- **Surface temperature** (`skinAt` in `src/data/weather.ts`, `skinBlock`): the Earth double's night-time and day-time *skin* temperature
  from NASA POWER's climatology (TS_MIN and TS_MAX, 2001 to 2025, asked from the browser, no login), beside the Moon's local-midnight surface
  temperature from Diviner. The climate fit's temperature is air temperature, so this is the like-for-like of the two (surface, night-time).
  It is not part of the climate fit, and it is not asked under `?capture`; if the feed fails the block says "Not available".

## Data licences and provenance

Space Apps asks that every non-NASA dataset be freely available without restriction (or OSI open source) and every
source be cited. How this folder meets that:

- **One registry.** `scripts/sources.mjs` lists every source the data scripts read, with its provider, URL, licence and
  citation. `npm run build` fails if a source has no entry or licence, or no row in `docs/credits.md`, or a row whose
  licence is left unchecked (`scripts/check-credits.mjs`).
- **Provenance in the data.** The generated files record each source's URL, licence, citation and fetch date:
  `public/sites/manifest.json` (`provenance`), `public/textures/provenance.json` (a file of its own: the app loads every
  key of `textures/manifest.json` as a texture) and `src/data/surface.gen.json`.
- **WorldClim 2.1 is not shown.** It states no licence, so the climate's temperature and rainfall come from NASA POWER
  (How the climate fit works, above).
- **Software.** Eidolon is licensed under the Apache License 2.0 (`../LICENSE`); the packages it uses and their licences are in
  `../THIRD_PARTY_NOTICES.md`. GSAP is the one non-OSI package, under its free Standard License, stated there.
- **The prototype**, `reference/eidolon.html`, is not in git: its textures have no recorded provenance.

## Docs

- `docs/plan.md`: what step 1 set out to build.
- `docs/merge-plan.md`: connecting the engine (step 2), its decisions and phases.
- `docs/analog-weights.md`: the mission fit's tracks, weights and existing analogs, with the reasoning and sources for each.
- `docs/credits.md`: every data source, image and font, with its provider, licence and citation.
- `../README.md`: the licence, the data and the AI-use disclosure.
