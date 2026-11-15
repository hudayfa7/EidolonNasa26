# Eidolon

NASA Space Apps Challenge 2026: *Identify Earth locations that analog the permanent Moon base locations and Mars.*

Pick a site on the Moon or Mars and Eidolon ranks the places on Earth whose terrain form comes closest at 200 m, shows the
two side by side in 3D, and helps plan a test campaign at one.

## Architecture

```
 browser (web/)                                              search engine (engine/)
 ┌─────────────────────────────────────────────┐            ┌──────────────────────────────────────────┐
 │ three.js scene: globes, 3D terrain blocks,  │            │ FastAPI server  /api/v1                  │
 │ compare (side by side, overlay, globe)      │            │  /health  /purposes  /sovereigns         │
 │                                             │   HTTP     │  /search  /targets  /elevation  /images   │
 │ src/data/client.ts  ── the one data seam ───┼───────────►│                                          │
 │   http.ts (VITE_DATA=engine)                │   JSON     │ target window: Mars MOLA–HRSC / CTX DEM,  │
 │   mock.ts (default: the engine's examples)  │            │   Moon SLDEM2015, 94 × 94 at 200 m        │
 │                                             │            │ F2s fingerprint index: 500,127 Earth      │
 │ frontend-owned: booking, mission fit,       │            │   sites from Copernicus GLO-30            │
 │ weather (Open-Meteo, NASA POWER), photos    │            │ judge model re-ranks the top matches      │
 └─────────────────────────────────────────────┘            └──────────────────────────────────────────┘
```

- **The search engine** (`engine/`, Python, FastAPI, PyTorch, GDAL). For a target on Mars or the Moon it reads an
  18.8 km elevation window at 200 m from NASA and USGS elevation models, computes its terrain fingerprint (landform
  shape and size, relief, slope, roughness, raised or incised), ranks 500,127 Earth sites by how closely their own
  fingerprints match, and re-ranks the best with a learned judge model. Named targets come from the IAU Gazetteer
  (10,100 features); a search by a named target answers from a cache in milliseconds, one by coordinates in a few seconds (it reads the elevation remotely).
- **The frontend** (`web/`, Vite, TypeScript, three.js, no UI framework). Globes of Earth, the Moon and Mars, a site
  view with real terrain, an Earth double beside it in 3D from the engine's own elevation, and a booking flow for a
  test campaign. Every engine call goes through one module (`web/src/data/client.ts`) against the engine's JSON Schemas
  (`web/contracts/`), so the app runs either on the live engine or on a mock that replays the engine's example answers.
- **Scored apart from the terrain match**: a climate fit (NASA POWER air temperature and the Global Aridity Index) and a
  mission fit per test purpose. Neither changes the engine's ranking.

`web/README.md` has the frontend in depth; `engine/README.md` the engine.

## Setup

The frontend alone, on the mock (no engine needed):

```sh
cd web
npm ci                              # Node 26
npm run dev                         # http://localhost:5173/
npx playwright install chromium     # only for npm run capture, a11y, perf and poster
```

On the live search engine:

1. **Its data** (2.6 GB, not in git): `index/`, `grid/`, `weights/`, `judge/` and `targets/` in `engine/`.
   `sh engine/fetch_data.sh` downloads them from a GitHub release and checks each file's sha256 (it needs the GitHub CLI
   signed in with access to the release, and `sha256sum` or `shasum`).
2. **A Python environment**: `conda env create -f engine/code/environment.yml` (or only what the server imports: numpy,
   scipy, pandas, matplotlib, pillow, gdal, rasterio, torch, torchvision, fastapi, uvicorn, pydantic), then
   `pip install -e engine/code`.
3. **Start it**: `sh engine/run_server.sh` (Windows: `engine\run_server.bat`).
   `http://127.0.0.1:8000/api/v1/health` says `ready` after about 35–75 s; it holds about 4.4 GB of RAM.
4. **Run the frontend on it**: `cd web && VITE_DATA=engine npm run dev`. `npm run test:live` checks the frontend against
   the running engine.

Checks: `npm test`, `npm run typecheck` and `npm run build` in `web/` (the build fails on copy rules and on a data source
without a licence); `pytest engine/code/tests` for the engine.

## NASA data

| Use | Dataset | Provider |
| --- | --- | --- |
| Mars terrain (search and 3D) | MGS MOLA – MEX HRSC Blended DEM, 200 m; Exploration Zone CTX DEMs | USGS Astrogeology, NASA PDS (MOLA); ESA/DLR (HRSC); UCLA, NASA PDS (CTX) |
| Moon terrain (search and 3D) | SLDEM2015 (LOLA and SELENE TC); LRO LOLA LDEM_16 and south polar DEM | NASA GSFC; JAXA |
| Globes and site imagery | Viking MDIM 2.1, MGS TES albedo; LROC WAC mosaics, Clementine 750 nm; Blue Marble, Black Marble, MODIS water mask, Landsat WELD (NASA GIBS) | USGS, NASA JPL, NASA Ames, ASU, NASA Earth Observatory |
| Measured at the target | LRO Diviner temperatures and rock abundance; THEMIS thermal inertia; Odyssey GRS elements and water; Mars cave candidates; lunar pits | NASA PDS Geosciences Node, USGS, ASU |
| Earth site climate and weather | NASA POWER climatology (air and skin temperature, rain, wind) | NASA Langley Research Center |
| Photographs | Apollo, rover and lander images; NASA field photographs of Earth analog sites | NASA Image and Video Library, JPL Photojournal |

Other open sources: the Copernicus DEM GLO-30 (ESA), ETOPO 1 and 2022 (NOAA), the Global Aridity Index v3.1 (CC BY 4.0),
Natural Earth, the IAU Gazetteer of Planetary Nomenclature, and Open-Meteo's forecast (CC BY 4.0). Every source, with its
licence and citation, is in [`web/docs/credits.md`](web/docs/credits.md); the data scripts write each source's URL,
licence and fetch date into the files they make.

## Licence

Eidolon is released under the MIT License ([`LICENSE`](LICENSE)). The open-source software it uses, with each licence,
is in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md); GSAP, the animation library, is free under its own Standard
License rather than an OSI licence, as stated there.

## AI use

We used Anthropic's Claude Code (an AI coding agent) to build Eidolon:

- **Implementation**: most of the frontend's code in `web/` (views, 3D scene, data seam, booking and mission fit), the
  connection between the frontend and the engine, and fixes to the engine's server.
- **Schema and type generation**: the TypeScript types the frontend builds against are generated from the engine's JSON
  Schemas (`npm run types`), and the contract tests check every example and the mock against them.
- **Testing and verification**: the unit tests, the live tests against the engine, the screenshot, accessibility and
  performance harnesses, and the build's copy and data-licence checks.
- **Research and documentation**: finding data sources, checking their licences against the Space Apps terms, and
  drafting the docs and credits.

The team directed and reviewed the work. Nothing in the app calls an AI model
at run time; the engine's terrain models are the team's own, trained on elevation data.
