# Merging the engine with the frontend

The build steps to bring the search engine into `engine/` and run the frontend (`web/`) on it. Line references, the
reasons behind each step and the measurements to log are in `web/docs/merge-plan.md` (Phases 1 and 3–7, Engine
changes, Frontend changes, Contract checks). Already done: the frontend lives in `web/`, plus the root README, the
launch config and the AGENTS.md files.

## What you need

- The engine bundle folder, `eidolon_search/`: code plus 2.6 GB of data (`index`, `grid`, `weights`, `judge`,
  `targets`). It is not in git. Below, `E` is its path.
- Miniforge (conda), Node 26 and git. The engine holds about 5 GB in memory, so 16 GB of RAM is safest.
- Internet for pin searches: the engine streams elevation from S3.

## 1. Finish the import (one PR)

Done already: the engine's code is in `engine/` (unmodified, base `ec4e20b`), `run_server.sh` is executable, and the
root `.gitignore` keeps the data dirs out of git. Left:

```sh
E=/path/to/eidolon_search      # the bundle that holds the data
for d in index grid weights judge targets; do ln -s "$E/$d" "engine/$d"; done   # or copy them; never commit them
```

On Windows, link each data dir with `mklink /J engine\index <bundle>\index` (no admin needed), or copy them.

In the same PR:

- `web/scripts/trim-targets.mjs`: default bundle path becomes `../engine`.
- Delete `web/docs/engine/`. Point `web/src/data/http.ts:1`, `web/src/data/api.ts:3` and the header of
  `web/docs/progress.md` at `engine/code/docs/frontend_spec.md`; fix the `contracts/` and `docs/engine/` rows in
  `web/README.md`.
- `.claude/launch.json`: add `eidolon-engine` (`conda run --no-capture-output -n eidolon sh engine/run_server.sh`, port
  8000).

Check:

```sh
diff -r -x ENGINE_COMMIT engine/code/contracts web/contracts   # clean
git check-ignore engine/index                                  # matches
cd web && npm ci && npm run typecheck && npm test && npm run build   # 388 tests
```

From now on the engine's `code/contracts` is the source of truth. When it changes, copy it to `web/contracts`, then run
`npm run types` and `npm test` in `web/`.

## 2. Boot the engine

```sh
conda env create -f engine/code/environment.yml
conda activate eidolon
pip install -e engine/code
sh engine/run_server.sh                         # Windows: engine\run_server.bat
curl http://127.0.0.1:8000/api/v1/health        # repeat until it says ready
pytest engine/code/tests
```

- On 8 GB of RAM, start it with `EIDOLON_JUDGE_INRAM=0 EIDOLON_MASK_CACHE=1 sh engine/run_server.sh`.
- If the environment won't solve on Apple Silicon, add `engine/code/environment.server.yml` with only what the server
  imports: numpy, torch, torchvision, rasterio, gdal, scipy, pandas, matplotlib, pillow, fastapi, pydantic, uvicorn,
  pytest, jsonschema. Keep torchvision: the judge needs it, or `/health` reports an error.
- Measure and log in `web/docs/progress.md`: time to `ready`, peak memory, a Jezero search (cached, a few ms), Jezero
  with a country filter (0.15–0.3 s), a Mars pin such as Elysium (5–10 s). Then:
  - warm-up over 40 s: raise the warm-up bar and its copy in `web/src/ui/results.ts:218–219`;
  - warm-up over 60 s: also raise `ask`'s retry count `n` in `web/src/data/client.ts:124`;
  - slowest pin over 45 s: raise `TIMEOUT_MS` in `web/src/data/http.ts:10`.

## 3. Engine patches

Each its own commit on top of the import, with a test in `engine/code/tests/test_server_cache.py`, and listed in a new
`engine/AGENTS.md` against base `ec4e20b7`.

| # | Change | Where |
| --- | --- | --- |
| E1 (must) | `_site_z` and `_point_z` stop caching a failed read (`lru_cache` keeps the `None`, so one S3 blip sticks until a restart). If it still sticks, also call `gdal.VSICurlClearCache()` on failure | `engine/code/src/eidolon/server.py:252–260, 290–293` |
| E2 (if a repeat Elysium search takes over 2 s) | Memoise `target_window` by body, lat/lon to 4 dp and px, at most 64 entries | `engine/code/src/eidolon/search/api.py:22` |
| E5 (with the engine owner's OK) | Stretch the hillshade to its 2nd–98th percentile before `* 255`, so gentle terrain isn't flat grey on the cards | `engine/code/src/eidolon/server.py:236` (`_png`) |

Check: `pytest engine/code/tests` passes. With Wi-Fi off a new Earth cell's `/elevation/site/{cell}` gives 404; with Wi-Fi
back on, the same cell gives 200 without a restart.

## 4. Run the frontend on the engine

```sh
cd web
VITE_DATA=engine npm run dev        # set it on the command line, never in .env or .env.local (it breaks npm test)
```

Set `VITE_API` too if the engine isn't on `http://127.0.0.1:8000/api/v1`. Frontend changes:

| Change | Where |
| --- | --- |
| `?mock=on` falls back to sample data in an engine build: `MOCK = import.meta.env.VITE_DATA !== 'engine' \|\| modes.has('on')`, moved below `modes` | `web/src/data/client.ts:20–22` |
| A coordinate search answered `no_dem` where the body has data is rethrown as `EngineError(0, 'network')`, so an offline Mars pin doesn't show the Moon's "no data" copy. Add both cases to `client.test.ts` | `web/src/data/client.ts:87` |
| "within 60°" / "reaches 60°" become "59.5°" (the engine's cutoff); leave the "Exclude polar sites, beyond 60°" filter label | `ui/terrain-ui.ts`, `ui/fallback.ts`, `ui/results.ts`, `ui/target-search.ts`, `ui/panel.ts`, `ui/grid.ts`, `index.html`, `scripts/capture-states.mjs` and their tests |
| Hadley's compare caption says the window is centred on Rima Hadley, about 18 km south-west of Apollo 15 | the compare caption for `hadley` |

## 5. Prove the seam matches the live engine

- Add `web/src/data/live.test.ts` and the script `"test:live": "vitest run --mode live --testTimeout=90000
  src/data/live.test.ts"`. It calls every function in `client.ts` against the running engine and checks the answers
  against the schemas and the mock's shapes (cases in merge-plan.md, Contract checks). Run it twice: once within 2 s of
  starting the engine (the warming path) and once warm.
- Capture the engine states: `npm run capture -- --states=...` with every `results-*`, `ask-*`, `grid-*`, `engine-*`,
  `compare-*`, `targets-*`, `no-webgl-*` and `context-lost-*` state, minus those that set `?mock=`. Look at
  `captures/compare/`.
- Set `CELL` in `web/scripts/a11y.mjs:23` to a live cell from a Jezero result, then `npm run a11y`.
- `VITE_DATA=engine npm run perf`.
- Go through the Merge notes in `web/docs/progress.md` (merge-plan.md Phase 6 lists what to check for each).
- Fix only what breaks, and log it in `web/docs/progress.md`.

## 6. Map accuracy (after it works)

- Make the five illustrative sites real: add Arcadia, Utopia, Meridiani, Elysium and Taurus–Littrow to
  `web/src/data/real-sites.ts`, then `npm run fetch:real -- --only=sites`.
- Give the engine's Earth result cells real image crops (`DEMO_CELLS` in `web/scripts/fetch-real-data.mjs`).
- Re-run `VITE_DATA=engine npm run perf`: GPU memory is at 294.6 of 300 MB.

## Done when

- The engine boots to `ready` and `pytest engine/code/tests` passes.
- `npm run test:live` passes, both during warm-up and warm.
- `npm run typecheck`, `npm test` and `VITE_DATA=engine npm run build` pass; the capture subset, a11y and perf pass
  on the live engine.
- The whole flow works live at 1280×800 and 390×844: Mars, Jezero, results, compare, booking.
