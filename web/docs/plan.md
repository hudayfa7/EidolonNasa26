# Eidolon frontend: remaining work

Oct 15, 2026 · @Hudayfa Sarfaraz

This doc is step 1: the frontend working fully on its own, on mock data behind one data module. Step 2 is the merge with the engine, which the agents handle, then the push to GitHub and the AGENTS.md files. The data module and the questions under What to ask the engine are what make step 2 a swap, not a rewrite. The engine's answers of 16 October are folded in below; its contract now drives the data seam.

## Baseline

The v10 mock (`eidolon.html`, one file, 4.7 MB) is the visual reference for the build. Every view below exists and was checked in a headless browser at desktop and phone sizes. What remains is real data, the booking flow, the logo and copy, polish that needs post-processing, and the port.

| View | Route | State |
| --- | --- | --- |
| Intro: sunrise brief, three lines, telemetry corners | `#/` | Built; hand-off to the 3D shot needs post-processing |
| Title: Earth, sun, Eidolon-1, wordmark reveal | `#/` after intro | Built |
| Footer carousel: logo, Earth, system, links | Title, scroll down | Built; logo step waits on the logo |
| System: Earth, Moon, Mars | `#/system` | Built |
| Info sheet | Scroll down on the system view | Built; copy is a first draft |
| Beyond | `#/beyond`, sideways past Mars | Scene built; card imagery undecided |
| Body: globe, HUD, graticule, coordinate entry | `#/mars`, `#/moon`, `#/earth` | Built |
| Site: terrain, topo map, orbital crops, doubles | `#/mars/jezero`, `#/mars/@18.3800,77.5800` | Built on placeholder data |
| Detection frame on a dive | Pin from the globe | Built; grades need refining |
| Compare: side-by-side terrain or globes | `#/mars/jezero/compare/salda` (+ `/globe`) | Built |
| Booking flow | None | Not started |

**Real already:** orbital positions and light time from JPL elements, Mars time, sunlight from the real subsolar point per body, site coordinates and body facts, coordinate parsing and conventions (Mars 0–360° E, Moon and Earth ±180°).

**Placeholder:** terrain (procedural archetypes for featured sites; pins seeded from a 2K global map), match scores (stand-in on slope, steepness, relief and brightness), orbital crops (cut from global maps), surface photos (empty slot), weather (seeded), the Mars texture (community 2K map), the logo and all copy.

## Design system

Carry these over exactly; they are what keeps the build from drifting back to a game look. Put them in one `tokens.css` and one `motion.ts`.

**Colour**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#06070A` | Stage, page |
| `--surface` / `-2` / `-3` | `#0D0F12` / `#13161A` / `#1A1E23` | Panels, hover, selected row |
| `--line` / `--line-2` | `rgba(255,255,255,.07)` / `.14` | Dividers, borders |
| `--text` / `-2` / `-3` | `#E7E9EC` / `#A0A6AE` / `#6C727A` | Body, secondary, labels |
| `--coral` | `#F2885F` | The only accent: selection, pins, match scores, wordmark |
| Mars / Moon / Earth | `#D0774C` / `#B9BDC4` / `#6EA6D8` | Body dots and captions only |
| Title ground | `#06191B` with a coral glow top right | Title screen |
| Intro ground | `#030405` to `#DCEBF4`, top to bottom | Sunrise brief |
| Beyond ground | `#2B5CC4` at the edges to `#050A1A` | Beyond scene |
| Detection grade: Mars | `#3B2A3D` → `#D9714A` → `#FBB884` | Dive tint, shadows to highlights |
| Detection grade: Moon | `#1A2032` → `#8691A8` → `#EEF1F6` | Dive tint |
| Detection grade: Earth | `#0A2630` → `#3B92A5` → `#D3F0F4` | Dive tint |

**Terrain, atmosphere and light**

| Token | Value, low to high | Use |
| --- | --- | --- |
| Terrain: Mars | `#3A2016` `#7A3F25` `#B26A3E` `#DDB08A` | Elevation ramp, stops at 0, .33, .66, 1 |
| Terrain: Moon | `#2C2D31` `#55575D` `#8C8E94` `#C9CACE` | Elevation ramp |
| Terrain: arid | `#4B3B2B` `#806748` `#B79D74` `#E0D0AE` | Atacama, Death Valley, Hanksville, Salda, Meteor Crater |
| Terrain: polar | `#39404A` `#6A7480` `#A6AFBA` `#E6EBF0` | Haughton, Dry Valleys, Svalbard |
| Terrain: basalt | `#1E1F23` `#3A3A3E` `#6C615A` `#A99A8C` | Lanzarote, Mauna Kea, Holuhraun |
| Terrain: ferric | `#3A1E14` `#6E3420` `#A85C35` `#D49A6C` | Río Tinto, Pilbara |
| Terrain: salt | `#4A4033` `#8A7A55` `#CBBB7C` `#EFE9C9` | Dallol |
| Terrain: water | `#1F3D52` to `#335C75` by hillshade | Lakes; contours stop at the shoreline |
| Atmosphere: Earth | `#8CC6FF` thin edge, `#3F7EFF` wide glow | Halo `#5E9CFF` |
| Atmosphere: Mars | `#EBA27C` | Halo in the body colour |
| System sun | Disc `#FFF6E8`, corona `#FFD2A8`, glow `#F2A27A` | Left edge of the system view |
| Title sun | Glare `#FFE2CC`, streak `#FFD7BD`, white core | Limb flare on the title |
| Night lights | Tint `#FFB86B` | Earth's dark side |
| Wordmark bars | `#0E5458` → `#2E8C86` → `#F2885F` → `#FFE3D2` | One gradient running across all seven letters |

**Type**

| Face | Weights | Use |
| --- | --- | --- |
| Geist, one variable file (100–900) | 300, 400, 500, 600 | Everything: wordmarks at 600; titles, names and leads at 300–400; interface, data and HUD at 400–500. Tabular figures site-wide (`base.css`) |

**Type scale**

| Role | Face and size | Notes |
| --- | --- | --- |
| Title wordmark | Geist 600, 76–212 px (13.5 vw) | Tracking −.05 em, line height .86, coral |
| Info sheet lockup | Geist 600, 84–260 px (17 vw) | Tracking −.05 em |
| Other wordmarks: top bar, title lockup, poster, credits footer | Geist 600, 21–58 px | Tracking −.02 em; the credits footer's −.04 em |
| Info sheet lead | Geist 300, 28–44 px (3.4 vw) |  |
| Intro lines | Geist 300, 22–32 px (2.8 vw) | Line height 1.42, 36 px between lines |
| View and panel titles | Geist 300–400, 34 px (28 on phones) | Tracking −.012 em |
| Compare pair names | Geist 400, 22 px |  |
| Terrain captions | Geist 400, 20 px |  |
| World labels | Geist 400, 19 px |  |
| Body and panel text | Geist 400, 14 px | Line height 1.5–1.55 |
| Section heads | Geist 500, 12.5 px | Sentence case |
| Labels and captions | Geist 400, 11.5–12.5 px |  |
| Data | Geist 400, 12–13 px | Tabular figures |
| HUD and telemetry | Geist 400, 10–11 px | Caps, tracking .06–.1 em |

**Motion.** One GSAP clock drives the camera, shader uniforms and DOM together; never a second animation loop.

| Move | Duration | Ease |
| --- | --- | --- |
| Slingshot between bodies (log-space distance plus a lift arc) | 1.6–1.9 s | `power2.inOut` |
| Dive into a site | 1.35 s | `power3.inOut` |
| Panel in or out | 0.9 s | `power2.inOut` |
| Terrain swap (shadow-colour curtain) | 0.24 s in, 0.45 s out | linear |
| Intro lines | 1.4 s apart, 3.4 s hold | `power3.out` |
| Wordmark bars | 0.95 s, 70 ms stagger | `power4.out` |
| Title: camera from the limb, wordmark at 3.2 s | 4.2 s | `power2.inOut` |
| Detection grade in (from 0.15 s into the dive) and out (after the swap) | 0.8 s in, 1.2 s out | `power2.inOut` |
| Beyond: reveal left to right, then orbits, then cards | 2.4 s, 0.7 s, 0.6 s with 0.1 s stagger | `power2.inOut` |
| Info sheet up and down | 0.85 s up, 0.7 s down | `power3.out / power3.inOut` |
| Footer carousel steps, with a dissolve between | 3.8, 3.8, 4.2, 5.2 s; 0.8 s dissolve | linear |
| Coordinate preview: globe turns after a 280 ms typing pause | 0.9 s | `power2.inOut` |

With `prefers-reduced-motion`, every move above becomes instant or a crossfade.

**Rules**

- Colour belongs to the bodies; coral is the only interface accent.
- Sentence case everywhere. JPL ops words (site, campaign, window, traverse, sol), never game words (loadout, deploy, lock on).
- One face, Geist. Tabular figures, not a monospace face, keep numbers, coordinates and telemetry steady.
- HUD lives in corners and around the globe, never as a background pattern or ornament.
- Every number carries its unit; coordinates follow the body's convention, to 4 decimal places wherever a site is identified.
- Panels are solid, with 1 px lines and 8–14 px radii; no glass, no glow on interface chrome.
- Terrain fidelity and practical suitability stay separate. Never blend them into one number, and never show fidelity as a percentage.
- Gaps, caveats and "not measurable" are always shown, never hidden.

**Layout**

| Constant | Value |
| --- | --- |
| Top bar | 52 px plus the safe area |
| Status bar | 34 px |
| Panel | 360 px on the left; a bottom sheet at 54% height with a 14 px top radius below 760 px |
| Portrait layout (system and title) | Width over height below 0.8 |
| Narrow terrain overlay | Viewport below 520 px wide |
| Radii | Buttons and inputs 8 px, fact grids 10 px, cards 14 px, pills fully round |
| Panel padding | 18 px top, 22 px sides (16 and 18 on phones) |

## Must do for the demo

Ten items, in this order. The booking flow is the largest build; reworking the results for the engine's real output is the most important.

- [ ] **Port the mock into the build.** Split the file into modules and upgrade three.js before adding anything new (see Porting, including its pitfalls). Everything after this lands in real code.
- [ ] **Fix the Must rows under Visual bugs in the mock** during the port, starting with the polar sites.
- [ ] **Data module on the engine's contract.** Copy the engine's spec, schemas and example responses into the repo, generate the types, and run the mock on them (see Data seam).
- [ ] **Rework the results for the engine's output** (see Engine answers, and sections 4 and 5 of the engine's frontend spec):
  - Cards: rank, place, shape-match confidence, summary, two or three property chips, a hillshade thumbnail, and a notes marker when there are caveats. Five by default, "show more" up to 20.
  - Detail: all six properties with their status (gaps never hidden, "not measurable at 200 m" in grey), strengths and gaps, every caveat, a climate panel (mean temperature, precipitation, aridity band), location, a surface badge, and an expert drawer with the raw values and the engine build.
  - No percentages: the score is a secondary number, and the judge likelihood appears only as a rough bar.
  - A capability banner above the results when the target's tier is fair or weak.
  - Comparison: the engine's twin hillshades side by side now; 3D terrain of the same 18.8 km window once the raw endpoint exists.
  - Earth pins with their 18.8 km footprint, tagged when inside one of the 14 established sites.
  - Purpose picker (required, default rover mobility, polar lighting shown disabled) and filters: country, search this area, Artemis Accords partners only, exclude polar, surface.
  - Targets: IAU autocomplete; featured sites by IAU name; a note when a target is larger than the 18.8 km window.
  - States by source: instant for cached names; a skeleton for filtered searches; for pins, a 5–10 s progress state ("Reading Mars terrain…") with the globe still usable and one pin search at a time. Plus warming up, no elevation data (Moon beyond 60°), no close analog, and errors.
- [ ] **Real data on the demo path.** Frontend-owned textures and crops for the sites you will click on stage: Jezero and Gale, a mid-latitude Moon site, the south-pole regions if the engine gains polar data, and their top doubles (see Placeholder to real).
- [ ] **Booking flow.** From an Earth double to a requested test campaign, in the same panel and type system. The practical panel stays separate from terrain fidelity; the two are never combined into one number.
  - Site listing: the cell's name, country, sovereign and access (which drives the permits copy), surface and climate; photo strip, logistics and indicative cost are mocked to the engine's `site_listing.json` schema.
  - Plan a campaign: test purpose, dates picked on the weather window, team size, equipment, notes.
  - Review, then a confirmation with a reference number. Mock only; nothing is sent.
- [ ] **Logo.** Separate chat. Then replace the mark in the favicon, top bar, title lockup, info sheet and carousel step 1, and the title wordmark if the logo comes with its own lettering. It must survive dithering at about 150 dots across, so no hairlines.
- [ ] **Copy pass.** Covers the intro lines, title blurb, info sheet, panel ledes, purposes, Beyond, and the empty, warming and error states.
  - Lead with permanent Moon base locations and Mars, but don't promise south-pole matching until the engine has polar data.
  - Say terrain form at 200 m. Never claim surface brightness (the info sheet does today) or features under about 600 m.
  - Never call a score "% analog". Use the engine's tested line: "Typically 2 of 3 searches find a good terrain analog in the first five results."
  - Every user-facing string says Eidolon.
- [ ] **Rendering pipeline and the opening.** The six Must rows under Rendering and shaders, starting with the HDR pipeline.
- [ ] **Meet the performance budget** on a mid-range laptop and phone (see Verification).

## Should do

These lift the demo from working to convincing; take them once the must-dos land.

- [ ] **Overlay compare.** Ghost the Earth double's terrain onto the target at the same scale, with a slider between them. One image that shows "close enough" better than the table.
- [ ] **Site selector grid.** The map-select screen from the first brief: featured targets and their doubles as cards with hillshade thumbnails (the engine serves these), beside the list.
- [ ] **Touch.** Pinch to zoom on the globe and terrain (wheel only today), two-finger orbit, a bottom sheet you can drag between peek, half and full, and phone layouts for compare and terrain.
- [ ] **Weather window from a real feed.** Open-Meteo forecast from the browser, plus best months from NASA POWER climatology; mark days under the limits for the chosen purpose.
- [ ] **Surface photos.** Fill the empty slot with rover, lander and Apollo images where they exist, credited; say so plainly where none exist.
- [ ] **Progressive textures.** Load each body at low resolution first, then the 8K maps, with a quiet loading indicator.
- [ ] **Telemetry flash.** HUD values flash briefly when they change, as in the first brief.
- [ ] **Beyond imagery.** Replace the painted scenes (see Open decisions).
- [ ] **Fallback without WebGL.** A static poster and a plain list of sites and doubles, which also serves screen readers.
- [ ] **Accessibility pass.** Focus order through panel and globe, labels on every control, contrast on the faint HUD and graticule labels.
- [ ] **Share and meta.** Copy-link on site and compare views (routes already deep-link), Open Graph image, page titles per route, self-hosted fonts.
- [ ] **The Should rows under Rendering and shaders and under Visual bugs in the mock.**

## Stretch

Only if time is left over; none of these blocks the demo.

- [ ] **Sun-angle slider on terrain.** Shade the block for any time of day or season. Illumination is the deciding factor at the lunar south pole, so this one earns its place first.
- [ ] **Slope hazard layer.** Tint slopes over 15° on the terrain and the map.
- [ ] **Profile and measure.** Draw a line on the map to get distance and an elevation cross-section.
- [ ] **Landing ellipse.** Draw a target ellipse on the map and terrain, sized per mission.
- [ ] **My campaigns.** A list of requested campaigns with their dates and sites.
- [ ] **Earth clouds on the title.** Brought back only there, where sites don't need to be read.

## Rendering and shaders

The mock's look comes from hand-written shaders, sprites, Canvas 2D drawing and CSS overlays. Each is listed below with its target. The HDR pipeline goes first, because the atmosphere, sun and colour grade all depend on it.

| Element | Now in the mock | Target | Priority |
| --- | --- | --- | --- |
| Render pipeline | Shaders output gamma-corrected colour by hand; built-in MSAA; a transparent canvas over CSS gradients | Shaders output linear HDR, then bloom, AgX tone mapping, grain and SMAA (the composer drops MSAA). The canvas becomes opaque, so the stage, title, intro and Beyond backgrounds move into the scene as a full-screen gradient pass | Must |
| Atmosphere | Two rim-glow shells per body, plus sprite halos | A single-scattering shader (Rayleigh plus Mie) for Earth and a thin dust layer for Mars. The limb brightens toward the sun at sunrise. Drop the sprite halos once bloom is in | Must |
| Sun | Sprite disc, core, glow and streak, plus a CSS screen-blend flare | An HDR disc that bloom picks up, and a restrained lens flare (ghosts and streak) that dims when the sun goes behind a body | Must |
| Intro to title | A CSS gradient crossfades into the WebGL shot of Earth's limb | One scene and one camera: the gradient is the atmosphere seen edge-on, so the zoom-out is continuous | Must |
| Poles | The equirectangular sphere pinches and smears at the poles | Blend a polar stereographic cap into the planet shader, or move to a cube-sphere. Every south-pole site depends on it | Must |
| First paint | Nothing; the page waits on textures for up to 7 s | A designed static frame of the title, shown until WebGL is ready | Must |
| Planet surface | Colour map with bump normals derived per pixel; Lambert lighting everywhere | Normal maps baked from the DEMs; Lommel-Seeliger lighting for the Moon (Lambert makes it look plastic); keep Earth's night lights and ocean glint | Should |
| Terrain surface | Hypsometric tint, hillshade, contour lines, a skirt | A toggle to drape orbital imagery; labelled contours; a water shader for lakes; level of detail for tiles above 512 samples | Should |
| Terrain swap | A solid curtain in the body's shadow colour | Crossfade between two render targets, so the dive flows straight into the terrain | Should |
| Detection grade | A duotone uniform on the planet shader, plus a CSS sky and dot | One colour-grade pass on the whole frame, eased in and out, with the palette taken from each site's own terrain colour rather than one per body; the dot and readouts stay as an overlay | Should |
| Beyond reveal | Canvas 2D, redrawn every frame during the reveal | GPU lines with an eased left-to-right reveal, then one held frame; same layout | Should |
| Footer carousel | A Canvas 2D dot loop on the CPU | One dither shader on a quad; the same four steps | Should |
| Eidolon-1 | A box with two panels | A low-poly model with PBR materials, lit by the real sun | Should |
| Icons | CSS chevrons only | 10–12 line icons in the HUD style for the booking flow: dates, team, equipment, permits, access | Should |
| Phones | The same pipeline everywhere | A lighter path: bloom at half resolution, fewer terrain samples, 2K textures | Should |
| Stars | 1,400 random points | A real bright-star catalogue with a faint Milky Way band, oriented to the real sky | Stretch |

## Visual bugs in the mock

Found by reading the mock's code end to end. Fix these in the port rather than carrying them over; the first five affect the demo path.

| Bug | Where | Fix | Priority |
| --- | --- | --- | --- |
| Polar sites break: orbital crops stretch while the footprint stays centred, edge coordinates and the hover readout are wrong, markers pile into one cluster, and the globe can't centre them (orientation is clamped to ±50°) | Moon south pole, all four sites | Draw site maps and crops in a local polar projection; lift the clamp; offset or cluster markers near the pole | Must |
| Clicking a featured site from the body view dives without turning the globe first; a back-side site swings the camera round, possibly through the planet | Body to site | Orient, then dive | Must |
| Compare is not to scale: both globes are framed alike (the Moon looks as big as Earth), and terrains fill the same block whatever their extent (Gale 180 km, Meteor Crater 4 km), each with its own vertical exaggeration | Compare | Show the engine's 18.8 km window on both sides at one exaggeration, which fixes the terrain; give the globes a same-scale toggle | Must |
| Late assets: the app starts after 7 s whether or not textures loaded. Late textures leave pins flat, crops blank and the footer black, and nothing redraws. Late fonts misplace the wordmark gradient and the intro frame | Everywhere | Gate the start on textures and `document.fonts.ready`; redraw maps, crops and art when assets arrive | Must |
| The detection readout row overflows its frame: it inherits the panel's `.row` style | Dive | Scope the class | Must |
| The Terrain/Globe toggle sits under the bottom sheet on phones, so globe compare is unreachable; status hints are hidden too | Phone, compare | Move the toggle and hints into the sheet header | Should |
| The detection frame only plays on a dive from the body view, not on deep links, map-click moves or compare | Site | Play it on every site entry | Should |
| The HUD's left readout runs under the panel below about 1,300 px wide; the longitude tape can slide under the top bar when zoomed | Body | Clamp the HUD to the viewport; drop the side readouts when there is no room | Should |
| Title annotations: the satellite tag shows through Earth; site labels can overlap the wordmark and blurb; the rings pick the first facing sites, not the nearest; coordinates are signed decimals unlike everywhere else; the SVG scrolls while the canvas stays put | Title | Occlude by depth, keep labels out of text boxes, pick nearest, use the shared formatter, fix the SVG in place | Should |
| Lighting disagrees: the warm glow on the left stays on whatever the real sun direction; terrain light is fixed from the north-west; the 2D map's hillshade differs from the 3D terrain's | Body, site | Drive all three from the site's real sun azimuth (ties in with the sun-angle stretch item) | Should |
| Label collisions: marker labels (Hanksville, Meteor Crater, Death Valley), graticule labels against markers and the preview chip, Beyond labels on phones, the wordmark against the blurb near 1,000 px | Several | One collision pass for overlay labels; responsive positions for the Beyond labels | Should |
| Reduced motion is partial: staggers, fades and some transitions still run, and the setting is read only once | Everywhere | Route all motion through `motion.ts` and watch the media query | Should |
| The hover state sticks after leaving the system view | System | Clear it on exit | Should |
| The crosshair cursor shows on maps that can't be clicked | Site panel | Crosshair only where a click moves the pin | Should |
| 1 px seams are possible during panel and split tweens (fractional viewports) | Body, compare | Round viewport and scissor rectangles | Should |
| Logo variants differ: the favicon and the dithered logo don't match the mark | Brand | Generate every variant from one source once the logo is final | Should |
| Static text never updates: the title's "Earth, low orbit" and the dive's "Generating" | Title, dive | Wire them to real state | Stretch |

## Placeholder to real

Every swap below keeps the current rendering; only the inputs change. In step 1 they ship as static files with the frontend; at the merge, whatever the engine already produces comes from it instead. Dataset names are from memory, so confirm resolution, access and credit lines when you pull each one.

| Placeholder now | Replace with | Notes |
| --- | --- | --- |
| Mars globe: community 2K colour map | Viking MDIM 2.1 colour mosaic (USGS Astrogeology), 8K | Mars 2000 planetocentric, east longitude; matches the coordinate code |
| Moon globe: 4K map, blurred poles | LROC WAC global mosaic, 8K, plus a polar cap | Poles need the cap or the south-pole sites stay smeared |
| Earth globe: Blue Marble 4K | Blue Marble Next Generation for the current month, 8K; Black Marble for night lights |  |
| Global elevation (bump and pin terrain) | MOLA MEGDR (Mars), LOLA LDEM (Moon), NASADEM (Earth) | Drives both the globe relief and terrain for any pin |
| Lunar polar terrain: banded | LOLA polar stereographic DEMs around the south pole | Fixes the banding below about 80° S; the engine has no Moon data beyond 59.5°, so this is frontend-only until it adds polar DEMs |
| Featured site terrain: procedural archetypes | The engine's 18.8 km windows once the raw endpoint exists (MOLA-HRSC 200 m, SLDEM2015, Copernicus GLO-30); HiRISE DTMs for close-ups later | Once real, featured sites can allow click-to-move like pins |
| Orbital crops: cut from the global maps | CTX global mosaic (Mars), LROC NAC and WAC (Moon), NASA GIBS imagery (Earth) | Context and regional scales per site |
| Surface photos: empty slot | Mars rover and lander raw images; Apollo surface photographs; licensed photos of Earth sites | Credit line under each image |
| Weather: seeded | Open-Meteo forecast; NASA POWER climatology | Forecast for the window, climatology for best season |
| Match scores: stand-in | Mock scores in step 1; the engine at the merge | Through the data module; see Data seam |
| Beyond scenes: painted | MESSENGER (Mercury), Galileo (Callisto), Cassini (Titan), a NASA Venus image | Akatsuki images are under JAXA terms, not NASA's |

Ship textures as KTX2 with mipmaps and terrain as 16-bit PNG or float32 tiles. The current file embeds 3.3 MB of JPEG as base64; nothing should be embedded in the build.

## Data seam

The engine's contract is the source of truth: `code/docs/frontend_spec.md`, the JSON Schemas in `code/contracts/`, and the checked-in example responses. Copy all three into the frontend repo now and build step 1 on them, so the mock returns the same JSON the server will. Where this doc disagrees with the engine's spec on data, the spec wins; on visuals, this doc wins.

- **Types.** Generate TypeScript from the schemas now and from `/openapi.json` once the server runs. Views use the engine's types directly; there is no second, invented shape to map.
- **One client.** `src/data/` is the only code that talks to the engine. `mock.ts` replays the fixtures; `http.ts` calls `http://127.0.0.1:8000/api/v1`. `VITE_DATA=mock|engine` switches between them, so the merge is flipping that switch.
- **Endpoints used:** `GET /health`, `GET /purposes`, `GET /sovereigns`, `GET /targets?body=&q=` (autocomplete, debounced at 150 ms), `GET /targets/{body}/{name}`, `POST /search`, and the hillshades `/images/target/{body}/{name}.png` and `/images/site/{cell}.png`, lazy-loaded (each result's `terrain_twins[0]` carries both URLs). A raw elevation endpoint is still to ask for.
- **Fixtures** come from `contracts/examples/api/`, generated by the engine's own script and checked by its tests.
- **Mock latency matches the engine's:** named target 20 ms, filtered search 0.3 s, coordinate pin 6 s, site image 2 s the first time.
- **Mock failure modes:** `?mock=warming` returns 503 `warming_up` for the first 35 s; `?mock=nodem` returns 422 `no_dem` for any Moon pin beyond 60°; `?mock=empty` returns low confidence and the "No close analog" summary; `?mock=fail` rejects every call.
- **Pins without a fixture** are synthesised by the mock generator in the engine's schema, on the engine's window: 94 × 94 samples at 200 m, 18.8 km square.
- **Frontend-owned data, never from the engine:** globe textures and global elevation, orbital crops, surface photos, weather (Open-Meteo), the curated featured targets (by IAU name), the 14 established Earth analog sites as a labelled layer, and booking listings.

## Engine answers

From the engine repo on 16 October. Its frontend spec (v1.0.0) is the fuller source; the example responses are generated by the engine's own script and checked by its tests.

| Topic | What the engine does | What the frontend does about it |
| --- | --- | --- |
| Running | FastAPI on port 8000, routes under `/api/v1`, `./run_server.sh`. Warms up for 30–40 s using about 5 GB RAM; one worker only; needs internet to stream target DEMs from S3 | Poll `/health` and show a warming state; start the server well before any demo |
| CORS | `EIDOLON_CORS`, default `*` | Vite calls it directly |
| Coordinates | Planetocentric latitude, east-positive longitude; ±180 in responses, 0–360 accepted; Earth WGS 84 | Already matches; Mars still displayed as 0–360° E |
| Search | `POST /search` with a target (IAU name, or lat and lon), a purpose, k of 1–20, and optional filters: sovereigns, bbox, access, exclude polar, surface | Purpose is required, so the objective selector is a must; add filters to the doubles list |
| Targets | 10,100 IAU-named features (2,051 Mars, 8,049 Moon) via `GET /targets?q=`; ids like `mars:Jezero`; names used verbatim | Feature-name search comes free; featured sites must use IAU names ("Rima Hadley", not "Hadley Rille") |
| Earth sites | 500,127 unnamed grid cells, `earth_cell_<n>`, each with location (lat, lon, elevation, country, sovereign, access, surface) and environment; no list endpoint | Doubles are cells, not named places; no "all Earth sites" view; booking listings are frontend mock |
| Scores | `fidelity.score` 0–1 (not "% analog"); confidence high, medium or low; `percentile_earth`; six properties (landform shape, relief, slope, roughness, raised vs incised, landform size), each match, partial, gap or not measurable; explanation with summary, strengths, gaps and caveats; ordered by a judge probability that is not shown | Replace "68%" with confidence, Earth rank and the six-property breakdown |
| Physical values | Elevation, mean temperature, precipitation, aridity, relief ratio; target diameter and relief spread | The conditions block of the compare table |
| Terrain | Compares a 94 × 94 window at 200 m (18.8 km) on a local projection; serves only a 188 px hillshade PNG lit from the north-west; north-up row order unverified | 3D needs a raw endpoint; showing the same 18.8 km window on both sides fixes the compare scale bug |
| DEMs | Mars MOLA-HRSC Blend v2 at 200 m; Moon SLDEM2015, only within about 59.5° of the equator; Earth Copernicus GLO-30 | Every Moon south-pole pin returns `no_dem` |
| Images | Hillshades only; no orbital photos, no credit lines | Orbital crops and surface photos stay frontend-owned |
| Timing | Named target 2–25 ms from cache; filtered 0.15–0.3 s; coordinate pin 5–10 s; site image 1–3 s the first time; no streaming | A pin needs a real loading state, longer than the 1.5 s dive |
| No match | Not an error: low confidence and a summary starting "No close analog in this region; best available." | Drive the empty state from confidence and show the summary |
| Purposes | Rover mobility, drill and ISRU, EVA training, habitat ops, astrobiology, thermal, education; polar lighting geometry exists but is unsupported. They choose which land is searched, not score weights | Selector copy must not claim to weight the match |
| Errors | `{detail: {code, message}}`: 503 `warming_up`, 404 `unknown_target` and `no_image`, 422 `no_dem`, `unsupported_purpose` and `unknown_purpose` | One error component keyed on the code |
| Repo | Python 3.11 with conda, no git, no JS tooling; suggests the frontend lives in the empty sibling folder `NasaSpaceApps26/eidolon` | No clashes |
| Accuracy | Blind test on 160 named targets: a good analog at rank 1 for 34%, in the top 3 for 52.5%, in the top 5 for 64% | Five results by default, "show more" to 20; the engine's tested copy line |
| Honesty rules | Every result's caveats must be visible; a capability banner when the target's landform class is fair or weak; fidelity and practical suitability never combined | Notes marker on cards, caveats on the detail view, banner above the results |
| Practical suitability | site\_listing.json defines a listing (name, roads, permits), but nothing implements it | Booking listing mocked to that schema |

## Gaps for the merge

None of these block step 1. The frontend builds against the engine as it stands; at the merge, the agents close these in the engine code, or the team decides to live with them.

1. **Raw elevation.** The engine serves only a hillshade PNG. Until a 94 × 94 elevation endpoint is added (a small change to `server.py`), compare uses the hillshade twins and the 3D terrain stays frontend-generated.
2. **South pole.** The engine has no Moon data beyond 60°, so the Artemis regions can't be matched. The frontend shows them with terrain and a "no elevation data" note; adding LOLA's polar DEMs is a later engine change.
3. **Site names.** Results carry a country, not a place name. The frontend shows coordinates and country, plus the established-site tag; a nearest-place name can be added on either side.
4. **Practical panel.** `site_listing.json` has no implementation, so the booking listing is mocked to that schema.
5. **Product name.** Every engine-generated summary and caveat the app shows says Eidolon, never another name; check them at the merge.
6. **Demo server.** One process, about 5 GB, internet needed for pin searches; decide where it runs during judging.

## Porting the mock

Keep the scene in plain three.js with Vite and TypeScript. The mock is already plain three.js, and moving it to React Three Fiber is a rewrite with no visual gain. Panels and the booking forms stay as the mock's TypeScript template functions; no UI framework is needed.

**Module map.** The mock's sections split cleanly:

| Module | From the mock |
| --- | --- |
| `astro.ts` | JPL elements, light time, Mars time, subsolar point |
| `coords.ts` | Conventions, formatters, the coordinate parser (add unit tests first) |
| `scene/` | Renderer, planet and atmosphere shaders, stars, suns, satellite, camera rigs, slingshot, split viewports |
| `terrain/` | Tile loader (new), mesh and skirt builder, contour shader, the procedural generator kept as a fallback |
| `views/` | Intro, title, system, body, site, compare, Beyond, info sheet |
| `ui/` | Panel templates, HUD, graticule labels, markers, topo map canvas, detection frame, footer carousel |
| `router.ts` | Hash routes and the `apply()` state machine |
| `tokens.css`, `motion.ts` | Design system above |
| `data/` | New: the data seam, with mock.ts and its JSON now and engine.ts at the merge |

**three.js r128 to current: what breaks.**

- `outputEncoding` and texture `.encoding` became `outputColorSpace` and `.colorSpace`.
- The planet, atmosphere and terrain shaders do their own gamma (`pow 2.2`). Remove it when the post-processing pipeline goes in: shaders output linear HDR, and tone mapping and the output pass apply sRGB once. Compare against the mock's screenshots.
- Light units changed, so the terrain and satellite (Lambert and Standard materials) render darker. Retune intensities by eye against the mock.
- `extensions: { derivatives: true }` goes; `fwidth` is built into WebGL2.

**Post-processing.** Use the `postprocessing` library: bloom on the sun and atmospheres, AgX or ACES tone mapping, and a noise pass for grain. It replaces the mock's CSS flare and grain overlays. Run it on the full-screen views (intro, title, system, body); the split compare view can go without.

**Performance in the port.** KTX2 textures through `KTX2Loader`; load each body's textures when it is first shown; a static poster as first paint with three.js loaded behind it; `compileAsync` before the intro; pause rendering when the tab is hidden; keep the adaptive pixel ratio.

**Capture flag.** Add `?capture` exposing `seek(t)` on the GSAP timeline. Software rendering in headless browsers skews animation timing, which is why the mock's mid-animation frames could not be checked; seeking makes them deterministic.

**Pitfalls the port must handle.** These only work in the mock because of how it is built.

- **The transparent canvas carries the look.** Stars, halos, atmospheres and sun sprites add light over the CSS backgrounds by never writing canvas alpha (custom blending). An opaque canvas or a composer render target breaks all of it until the backgrounds move into the scene (Rendering and shaders, first row).
- **Glows will shift.** In r128 the canvas-drawn glow, disc and streak textures are decoded to linear and never re-encoded, so the glows are tighter than their authored gradients. Proper colour management changes every glow; retune against screenshots.
- **Draw order is doing the occlusion.** Atmosphere shells depend on the planet writing depth first. Sprites draw before planets, so the sun is hidden behind a body by draw order alone, and the CSS flare is never hidden at all.
- **Rotation holds.** Every orientation tween first folds the spin into the orientation, then holds the planet; releases happen in several callbacks. Put hold and release in one place.
- **Timings are coupled.** The dive runs 1.35 s, the detection frame starts at 0.15 s and the terrain swap lands at 1.45 s. Coordinate entry waits 950 ms for a 0.9 s turn. The title reveal starts 3.2 s into a 4.2 s camera move. Build each transition as one timeline, not separate delayed calls.
- **Per-frame DOM writes.** Labels, markers, the HUD, 64 graticule labels, captions and about 50 SVG attributes on the title are written every frame, often through uncached lookups. Cache the elements and write only on change.
- **Main-thread work.** Terrain generation (192 × 192 with noise) and ranking all 14 Earth sites run synchronously, hidden behind the curtain. Move both to a worker.
- **Adaptive pixel ratio** is measured during shader compile and never steps back up. Measure after warm-up and allow recovery.
- **Hidden rendering.** The 3D scene keeps rendering under the opaque Beyond view, info sheet and title footer. Pause it there.
- **Duplicated constants.** Panel width (360 px), sheet height (54%) and the phone breakpoint (760 px in JS, 759 px in CSS) are defined twice. Define them once in the tokens and read them in JS.
- **Dead code to drop:** the old intro elements and their CSS, the unused rays sprite, the empty facilities branch, the Venus, Mercury and Europa branches outside Beyond, and unused colour tokens.

## Verification

Run a Playwright screenshot pass at 1280 × 800 and 390 × 844 after every change, and compare against the mock. This loop is what kept the mock's quality; without it Claude Code designs blind.

| State | Route or action | Check |
| --- | --- | --- |
| Intro | `#/`, seek 2 s, 6 s, 8 s | Lines evenly spaced, frame hugs the text, telemetry counts down |
| Sunrise into title | `#/`, seek 9–13 s | One continuous move, atmosphere on the limb, no cut |
| Title and footer | `#/`, scroll down | Wordmark reveal, sun visible, all four carousel steps |
| System | `#/system` | Three worlds, sun at the left edge, labels clear of the heading on phone |
| Info sheet and Beyond | Scroll down; scroll sideways | Sheet closes on scroll up; Beyond holds still once drawn |
| Body | `#/mars`, `#/moon` | HUD, graticule labels, 10° grid when zoomed |
| Coordinate entry | Type `47.2N 184.3E`, then `18.38N 77.58N` | Globe turns and pin shows; second gives a clear error |
| Dive | Click the surface, seek 0.8 s | Detection grade on the real surface, dot on the pin |
| Site | `#/mars/jezero`, `#/moon/@-86.2000,1.5000`, `#/earth/haughton` | Map edges labelled, hover readout, no polar banding once real tiles land |
| Compare | `#/mars/jezero/compare/salda`, then `/globe` | Both terrains at matching framing; Globe toggle |
| Edge states | ?mock=slow, ?mock=empty, ?mock=fail | Loading holds the frame; no-match and error copy |
| Reduced motion, no WebGL | OS setting; WebGL disabled | Crossfades only; poster and site list |
| Engine states | ?mock=warming; a Moon pin at 85° S; a Mars pin (6 s) | Warming screen; no-data state; detection frame holds with progress while the globe stays usable |
| Results | Jezero and Rima Hadley fixtures | No percentages; six properties with status; explanation text; cells named and tagged |

**Performance budget**

| Measure | Target |
| --- | --- |
| Frame rate, laptop with integrated graphics | 60 fps on system and body views |
| Frame rate, mid-range phone | 30 fps |
| Time to first paint (poster) | Under 1.5 s on a fast mobile connection |
| JavaScript, gzipped, three.js included | Under 350 KB |
| GPU memory with all three worlds loaded | Under 300 MB |

## Open decisions

Eight calls left for step 1. The first three only matter at the merge; step 1 builds around them.

| Decision | Options | Lean |
| --- | --- | --- |
| South pole | The engine adds LOLA's south-polar DEMs; or the demo leads with Mars and a mid-latitude Moon site, and polar sites show terrain without matching | Ask for polar DEMs now: the challenge names permanent Moon base locations, and every Artemis candidate region is near the south pole |
| Names for Earth doubles | The engine returns the nearest named place and region; the frontend looks it up; coordinates and country only | Engine side, plus a tag when the cell sits inside one of the 14 established sites |
| 3D terrain source | The engine adds a raw elevation endpoint; the frontend reads the same DEMs itself | Engine endpoint, so the terrain shown is exactly the window that was compared |
| Booking flow depth | Listing, request and confirmation; or that plus My campaigns | Listing to confirmation; My campaigns only if time allows |
| Logo | Own chat | Must survive the dithered carousel step |
| Beyond imagery | Dithered spacecraft images; diagrams | Dithered images, matching the footer |
| Demo conditions | Named targets come from the engine's cache in milliseconds; pins stream DEMs from S3 and need internet | Demo on named targets and pins run beforehand; keep the server warm and online |
| Rotation while a site is selected | Hold the planets still (the mock, in compare globes and the coordinate preview); or keep them turning at the time rate with the camera tracking each site | Keep them turning; you asked that selecting a site not freeze rotation |
