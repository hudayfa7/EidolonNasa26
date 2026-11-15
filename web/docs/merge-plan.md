# Eidolon step 2: merge with the engine

2026-10-22 · @Hudayfa Sarfaraz

Step 1 (docs/plan.md) built the frontend on mock data behind one data module. This plan covers step 2: run the frontend on the real engine, put both in one repo on GitHub, and add AGENTS.md files. It is built from three drafts (demo first, contract first, repo first) and four surveys (engine, data seam, repo, map accuracy). Where the drafts disagreed, the choice and the reason are under Settled in this plan.

Names used below. **E** is the engine bundle, a sibling folder of this repo on the frontend owner's Mac: `E=../eidolon_engine/eidolon_search` from the repo root. It is a reference copy and stays read-only. Paths starting with `web/` and `engine/` are inside the merged repo (Phase 1). Merge notes are cited by their bold titles in `web/docs/progress.md` "Merge notes".

## Goal and definition of done

**Goal.** The demo path runs on the live engine, warm and online, and has a fallback that works offline. Both halves live in one repo on GitHub, so a teammate or an agent can clone it and run it.

- [ ] The repo has `web/` (the frontend, with its history) and `engine/` (engine source; the data stays out of git). It is pushed to `hudayfa7/nasahackathon2026` `main`, and CI is green. No tracked file is over 50 MB.
- [ ] There is an `AGENTS.md` at the root, in `web/` and in `engine/`. Each of the three folders has a one-line `CLAUDE.md`: `@AGENTS.md`.
- [ ] The engine boots from `engine/` on the demo machine, and `/api/v1/health` says `ready`. Warm-up time, RSS and pin latency are logged in `web/docs/progress.md`.
- [ ] The live contract suite passes, once cold and once warm.
- [ ] `npm run typecheck`, `npm test` (mock, unchanged) and the engine build pass; on the live engine the capture subset, a11y, and perf within budget pass.
- [ ] The demo path has been rehearsed cold three times, once with the engine killed (`?mock=on`). `web/scripts/warm.mjs` exits 0.
- [ ] Repo visibility, licence, description and the judge-facing link are decided and in place.
- [ ] E is untouched: `find "$E" -newermt 2026-10-22 -print -quit` prints nothing.

## Where we are

**Frontend (step 1).** Every Must, Should and Stretch item is done.
- Gates at `50587c2`: 388/388 tests, 662/662 captures, 52/52 a11y, JS 340.8 of 350 KB gzip, GPU 294.6 of 300 MB.
- All data goes through `src/data/client.ts`. `VITE_DATA=mock` is the default; `http.ts` has never run against an engine.

**Engine.** E is a 2.6 GB bundle and not a git repo.
- It is commit `ec4e20b7` plus local edits from Oct 19 (the elevation routes, the spec and two error examples).
- Its 11 routes match the spec, the raw elevation endpoint included.
- Data: `index/jemb_all.npy` is 2.05 GB and `targets/targets.npz` is 236 MB. Both are over GitHub's 100 MB file limit.
- It needs conda with Python 3.11 and GDAL, about 5 GB of RAM, 30–40 s to warm up, and internet for pins.
- The spec names Isaam as deployment owner (`engine/code/docs/frontend_spec.md` §8, "Deployment notes (Isaam)").
- **This Mac:** 8 GB of RAM (`hw.memsize` 8589934592) and only Homebrew Python 3.13. No engine environment exists yet. It is the only machine where `engine/` is linked to the data (Phase 1).

**Repo.**
- Local `main`: 94 commits, about 37 MB packed, largest tracked file 4.7 MB, no remote.
- GitHub `hudayfa7/nasahackathon2026`: private, empty, description "Moonbnb". 1509Chamma and IsaamSyy have write access.

## Decisions for the team

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| D1 | Repo layout | (a) `web/` + `engine/` as peers (git mv, history kept); (b) the frontend stays at the root, with `engine/` inside it | (a). The root holds only shared files, each half has its own AGENTS.md, and the engine's data and Python caches stay out of the Vite project. (b) skips about 30 minutes of path fixes |
| D2 | Where the engine source lives | The monorepo copy becomes the source of truth / the upstream engine repo stays the source (its location is unknown; it is not on hudayfa7) | The monorepo copy. The engine owner confirms and reviews `engine/` diffs. The import commit records base `ec4e20b7` |
| D3 | Where the data lives | (a) Local only; just the demo machine needs it; (b) GitHub Release assets: 94 flat files, `jemb_all.npy` 99 MB under the 2 GiB asset cap; (c) a Hugging Face dataset | (b), uploaded only when a second machine needs the engine (a VM or a teammate). Until then, (a). Release assets go public with the repo (D6) |
| D4 | Machine for the live pitch | This Mac (8 GB); the engine owner's Windows laptop (the env file was written for it; RAM unknown); a cloud VM with 16 GB (needs D3 b or a copy of the data). Setup for each under Phase 3, Other machines | The engine owner's laptop, if it has at least 16 GB and passes Phase 3's RSS check; Isaam owns it (spec §8). Else a 16 GB VM, if someone owns it for the window. This Mac only if Phase 3 shows headroom with `EIDOLON_JUDGE_INRAM=0` |
| D5 | What judges reach during the judging window | (a) A static mock-mode build (cannot go down; its copy labels sample data) plus a video of the live engine; (b) an always-on VM behind Caddy on one origin (cost, someone owns it, systemd restart); (c) both | (a). Add (b) only if someone owns the VM for the whole window (Isaam by spec §8, unless he declines). Netlify or Vercel serve at the root; GitHub Pages needs the repo public and `base` set to the sub-path |
| D6 | Visibility and licence at submission | Stay private and share the demo link and video / go public | Public at submission, because judges can't open a private repo. Licence: MIT for `web/`. `engine/` goes public only with its owner's OK, under the licence he picks (MIT suggested). D3 b's assets go public with the repo: check the data's source terms first. Keep the history as it is: the author email shows on all 94 commits, and rewriting it would break the SHAs that progress.md cites |
| D7 | South-pole Moon matching | Ask the engine owner now for a south-pole loader for pins only (`moon_window` falls back to a LOLA polar DEM; no new named targets or index) / pitch it as the next step | Ask today for a scoping answer. Build it only if it fits in a day and a COG of the polar DEM is readable over HTTPS (not checked). Otherwise pitch it. plan.md leaned "ask now"; all three drafts leaned "live with it" |
| D8 | How teammates work | Push straight to `main` / branches and PRs with CI | PRs, with CI as the gate. Never force-push `main` (a free private repo can't enforce this, so it is a convention) |
| D9 | Repo name and description | The description says "Moonbnb"; the product is Eidolon (the build's copy check fails on the word) | Set the description to Eidolon's one-liner before the repo goes public. The repo name can stay |
| D10 | Who records the live-engine video, and by when | Any teammate with the D4 machine | Whoever runs Phase 8's first clean rehearsal records it then, before the freeze. D5 a, offline fallback 4 and the run-of-show depend on it |
| D11 | Submission deadline and judging window | Fill in | Lay the Timeline's estimates against them. Freeze (Phase 8) at least 24 h before judging |

## Timeline

Estimates, to be laid against D11.

| Phase | Effort | Gate |
| --- | --- | --- |
| 0 | 1 h | D1, D2, D7 today |
| 1–2 | 2 h | Teammates can clone after 2 |
| 3 | Half a day; more if conda won't solve | D4 answered after it |
| 4 and 5, in parallel | Half a day each | |
| 6 | 1 day | |
| 7 | Half a day | |
| 8 | Half a day, plus three rehearsals | Freeze 24 h before judging; D6, D9 before the deadline |

## Settled in this plan

These are technical calls between the drafts, not team decisions.

| Question | Chosen | Why |
| --- | --- | --- |
| Boot the engine before or after the repo move | After: boot from the `engine/` copy | `pip install -e` and Python write `*.egg-info` and `__pycache__` into the source tree. Booting from E would change it |
| How the data gets into `engine/` | Symlinks to E on this Mac, gitignored with no trailing slash | The engine opens `results.sqlite` read-only (`api.py:133`, `server.py:144`) and writes nothing to the data dirs. A `dir/` ignore pattern does not match a symlink |
| `.env` | Keep it tracked; it holds no secrets | `index.html:14,16,23` use `%VITE_SITE_URL%`, and Vite leaves an undefined `%VAR%` in the page literally. Secrets go in `.env.local`, which is already ignored |
| Where `VITE_DATA=engine` is set | On the command line: `VITE_DATA=engine npm run dev`, `build` or `perf`. Never in `.env` or `.env.local` | Vite loads both in every mode, test included (`getEnvFilesForMode` in `node_modules/vite/dist/node/chunks/node.js`). Vitest would get `MOCK=false` (`client.ts:20,36`), and `client.test.ts`, which stubs `./mock` (lines 12–13), would run against the real `httpEngine` |
| Contract copies | Keep `web/contracts`; CI diffs it against `engine/code/contracts`. Delete `web/docs/engine` | `mock.ts` imports the examples at runtime, and `gen-types` and `contracts.test.ts` read the schemas; Vite's dev server refuses files outside its root. The docs copy has 4 references (Phase 1) |
| Mock in the engine build | Keep it bundled and add `?mock=on` | About 3 KB, within budget. It gives an offline fallback at the same URL. The lazy import (last line of **Data seam, engine mode**) is left as a lever if the budget breaks |
| Grey engine card PNGs | E5: the engine stretches its PNG hillshade to the 2nd–98th percentile. Thumbnails keep loading the engine's PNG URLs | This is the change **Hillshade contrast** suggests. Drawing thumbnails from `/elevation/*` instead loses lazy loading: `thumbs()` (`ui/panel.ts:138–146`) calls `imageOf` for every `img[data-thumb]` at once. Opening the Mars grid would then fire about 18 `/elevation/site/{cell}` GLO-30 reads (`ui/grid.ts` `TOP=3` per card) plus the cards' own, about 70 KB of JSON each, on the one engine process. A PNG URL leaves the fetch to `loading="lazy"`. If the engine owner declines E5, live with grey thumbnails (cosmetic) |
| A transient DEM failure in the engine | Stop caching `None` (E1). No new error code | Smallest fix. A `dem_unreachable` code would touch `error.json`, `errorFrom`, the copy and the tests |
| `no_dem` where the DEM does cover | The seam maps it to `network` in a search by coordinates only (`client.ts:87`), not in `ask` | Offline, a Mars pin search today gets the Moon "within 60°" copy. As `network` it shows "didn't answer" with Try again; searches are not retried by themselves (only `warming_up` is, `ui/panel.ts` `watch`). Not in `ask`: it retries `network` 20 times, 3 s apart (`client.ts:124`), and each retry costs the engine a three-try read of about 10 s, so about 4 minutes of blocking reads per offline window on one process. Left as `no_dem` there, the window keeps the frontend's terrain, whose note reads the search's error, not the window's (`ui/terrain-ui.ts:30`) |
| Caching coordinate searches | Measure first; E2 only if a repeat is still slow | GDAL may already cache the ranges |
| Client timeout | Keep 60 s unless Phase 3's slowest pin is over 45 s | A demo can't wait two minutes anyway |
| Live fixtures | None recorded into `contracts/` | `contracts.test.ts:30` counts 18 examples, and `:33` fails a file with no schema rule (live health, sovereigns and elevation match none). A 94×94 elevation fixture (about 70 KB raw) would eat most of the ~9 KB JS headroom if the mock replayed it, and the mock draws its own terrain (`frontZ`). The live suite checks their shape instead |
| How the live suite reaches the engine | `vitest run --mode live`; the base is `http.ts`'s `API` | `http.ts:7` reads `VITE_API` at import, so the run sets it (`VITE_API=<base> npm run test:live` for another host; the default is `127.0.0.1:8000`). `--mode` works on Windows, where an env-var prefix does not |
| Release asset shape | 94 flat files | The basenames are unique, and each sha256 comes straight from MANIFEST, with no tar step |
| When to push | After the restructure and AGENTS.md (Phase 2) | Teammates have write access and an empty repo |
| Live suite in CI | No; it is a manual `npm run test:live` | CI has no engine |
| Mock filter re-ranking to match the engine | Not done | The demo is scripted, and the mock stays a test double |

## Phases

Each phase lists its owner type, tasks, verification and exit. Order: 0 → 1 → 2 → 3; then 4 and 5 in parallel, both on Phase 3's running engine; then 5 → 6 → 7 (7 takes its Earth cells from 6's live results); everything → 8.

### Phase 0: decide (team)

- [ ] D1 and D2 before Phase 1, and D7 today. D3 with D4: a VM needs D3 b. D4 from Phase 3's numbers; D4, D5 and D10 before Phase 8. D6, D9 and D11 before the submission deadline.

**Exit:** each answer is recorded in this file's table.

### Phase 1: restructure locally (repo)

- [x] Commit 1: `git mv` every tracked top-level entry into `web/`. Move the ignored `node_modules`, `captures`, `.cache` and `dist` with a plain `mv`. No filter-repo.
- [ ] Commit 2, "engine: import bundle ec4e20b + Oct 19 local edits (unmodified)":
  - `rsync -a --exclude .DS_Store "$E"/{code,run_server.sh,run_server.bat,MANIFEST.json,QUICKSTART.md,README.txt} engine/`
  - `git add --chmod=+x engine/run_server.sh`, a mode change only.
- [ ] Symlink `engine/{index,grid,weights,judge,targets}` to `$E/…`.
- [ ] Commit 3, root files and path fixes:
  - **Root `.gitignore`:** `engine/index`, `engine/grid`, `engine/weights`, `engine/judge`, `engine/targets`, `engine/.dl/`, `__pycache__/`, `*.egg-info/`, `.pytest_cache/`, `.DS_Store`, `.env*.local`, `.claude/settings.local.json`.
  - **`.claude/launch.json`:** move it to the root, change the web entries to `npm --prefix web …`, and add `eidolon-engine`: `conda run --no-capture-output -n eidolon sh engine/run_server.sh`, port 8000 (macOS and Linux; Windows uses `run_server.bat`, Phase 3).
  - **Root `README.md`:** a short pointer to both halves. Fix the `docs/engine/` and `contracts/` rows in `web/README.md:86`.
  - **`web/scripts/trim-targets.mjs:6,10`:** default path `../engine`.
  - **`web/docs/engine`:** delete it. Point `web/src/data/http.ts:1`, `web/src/data/api.ts:3` and the `web/docs/progress.md:3–5` header (the agents' entry point) at `engine/code/docs/frontend_spec.md`.

**Verify:**
- `git log --follow web/src/data/client.ts` shows the full history.
- In `web/`: `npm ci && npm run typecheck && npm test && npm run build` passes, with 388/388 tests.
- `diff -r -x ENGINE_COMMIT engine/code/contracts web/contracts` is clean, and `git check-ignore engine/index` matches.
- `git ls-files -z | xargs -0 du -k | sort -n | tail -1` stays at about 4.7 MB, and E is untouched.

**Exit:** 3 local commits, the gates are green, nothing is pushed.

### Phase 2: AGENTS.md, CI, first push (repo; needs your go-ahead)

- [ ] Write the three AGENTS.md files, and a `CLAUDE.md` of one line, `@AGENTS.md`, at the root, in `web/` and in `engine/`. Claude Code loads a nested CLAUDE.md, not a nested AGENTS.md (see Repo, push and AGENTS.md).
- [ ] Add `.github/workflows/ci.yml`, run on push and PR:
  - **web:** Node 26 (local is v26.8.2) with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, then `npm ci`, `typecheck`, `test`, `build`.
  - **engine:** Python 3.11, `pip install pytest jsonschema numpy fastapi`, `pytest engine/code/tests`, then the contracts diff above.
- [ ] Push: `git remote add origin https://github.com/hudayfa7/nasahackathon2026.git && git push -u origin main` (about 37 MB).
  - If GitHub rejects it with GH007 (the account blocks pushes that expose a private email), the account owner unticks "Block command line pushes that expose my email" in GitHub's email settings, then pushes again. D6 keeps the history, so the author is not rewritten.

**Verify:**
- A fresh clone in a scratch folder runs `cd web && npm ci && npm run build`.
- The first CI run is green, and the repo size on GitHub is about 40 MB.

**Exit:** teammates can clone, run mock mode, and open PRs.

### Phase 3: engine environment and first boot (engine; on this Mac first)

This Mac is the only machine with the data linked, so the first boot is here. D4 is answered from these numbers. If D4 picks another machine, repeat the measurements there before Phase 8.

- [ ] Install Miniforge (`brew install --cask miniforge`) so QUICKSTART's commands work as written. Then run `conda env create -f engine/code/environment.yml` and `pip install -e engine/code`.
- [ ] If osx-arm64 won't solve the `libcurl=8.19` or OpenBLAS pins, add `engine/code/environment.server.yml` (E4). It lists only what the server imports: numpy, torch, torchvision, rasterio, gdal, scipy, pandas, matplotlib, pillow, fastapi, pydantic and uvicorn, plus pytest and jsonschema. torchvision matters: `search/judge.py:69` imports it in `PairJudge`, and `_warm` calls `get_judge()`, so without it `/health` says `error` and the client shows `start_failed`. Check what `env.py`'s Windows `Library/` paths do on macOS.
- [ ] Run `sh engine/run_server.sh`. On 8 GB, also try `EIDOLON_JUDGE_INRAM=0 EIDOLON_MASK_CACHE=1`.
- [ ] Measure and log in progress.md:
  - the warm-up time until `/health` says `ready`. Hold it against the client's constants: the warm-up bar's 40 s and its "30 to 40 seconds" copy (`ui/results.ts:218–219`), and `ask`'s retry window of 20 × 3 s = 60 s (`client.ts:124`). Over 60 s, a compare window asked during warm-up gives up for the session: raise `ask`'s `n` (and the bar) to cover it;
  - peak RSS with INRAM 1 and 0, with Chrome open;
  - the Jezero POST (expect `source:"cache"`, a few ms);
  - Jezero with one country filter (expect `source:"live"`, 0.15–0.3 s), also under INRAM 0 and MASK_CACHE 1, since the demo path uses it;
  - Elysium `(4.5, 135.6)`, first and second ask (expect `remote`, 5–10 s);
  - the Moon by coordinates at Taurus–Littrow's point `(20.19, 30.77)`, and `/elevation/point/moon` there. SLDEM is the slowest remote read (`env.py:22`);
  - the slowest of 5 pins;
  - with Wi-Fi off: Jezero works, and a Mars pin answers 422 `no_dem` after its retries.

**Other machines (D4):**
- **The engine owner's Windows laptop:** clone the repo. Put the data in `engine\` by copying the five dirs or linking them with `mklink /J engine\index <bundle>\index` (junctions need no admin). `run_server.bat` hard-sets the paths to `%HERE%…`, so they must be there. The bundle likely came from this laptop, so the data may already be on it. Then Miniforge, `conda env create -f engine\code\environment.yml` (written for it), and Node 26. Run the engine with `engine\run_server.bat` in the activated env; the root `launch.json` engine entry uses `sh`. Build the frontend in PowerShell: `$env:VITE_DATA='engine'; npm run build; npm run preview`.
- **A VM:** needs D3 b and `fetch_data.py` (or a copy of the data), then this phase's Linux path, then Caddy (Phase 8).

**Verify:** `/health` reports `engine_commit` `ec4e20b7203b`. `pytest engine/code/tests` passes.

**Exit:** the numbers are logged. D4 can be answered from them.

### Phase 4: engine patches (engine)

- [ ] E1 is required. E5 with the engine owner's OK. E2 only if Phase 3's second Elysium ask took over 2 s. See Engine changes.
- [ ] Add `engine/code/tests/test_server_cache.py` for E1 (and E2 if made).
- [ ] List the patches in `engine/AGENTS.md` against `ec4e20b7`.

**Verify:**
- `pytest engine/code/tests` passes.
- With Wi-Fi off, a new Earth cell's `/elevation/site/{cell}` gives 404. With Wi-Fi back on, the same cell gives 200 without a restart. If it still gives 404, add E1's fallback and check again.
- With E5, a gentle window's card thumbnail (one of Jezero's results) is no longer flat grey.
- With E2, a repeat Elysium POST takes under 1 s.

**Exit:** a PR merged with only these diffs under `engine/code/src`.

### Phase 5: contract checks against the live engine (frontend)

- [ ] Add `web/src/data/live.test.ts` and `npm run test:live` (see Contract checks).

**Verify:** `npm run test:live` passes twice: once started within 2 s of the engine's start, which runs the warming probe, and once warm.

**Exit:** every seam function has passed against the live engine.

### Phase 6: frontend on the live engine (frontend)

- [ ] Make the changes under Frontend changes.
- [ ] Run `VITE_DATA=engine npm run dev`, with the variable on the command line (Settled).
- [ ] Capture the engine-relevant subset: `npm run capture -- --states=…` with every state named `results-*`, `ask-*`, `grid-*`, `engine-*`, `compare-*`, `targets-*`, `no-webgl-*` and `context-lost-*`, minus the 22 that set `?mock=`. Those test the mock, and `?mock=` does nothing when `MOCK` is false (`client.ts:20–35`).
  - **Pass:** the harness exits 0, with every `expect` and `until` met inside its 120 s per state (pin states make real 5–10 s reads). The sheets also show engine terrain and engine copy where the mock showed its own.
  - A state whose check names mock-only data is logged as mock-specific, not counted as an engine failure.
- [ ] Go through the progress.md merge notes, by title:
  - **Data seam, engine mode:** the probe flows; stop the engine (network states), then start it again (warming).
  - **Fallback page:** the `no-webgl-*` and `context-lost-*` states, in the subset above.
  - **Progressive textures:** Jezero's caption reads 18.4082° N, 77.6873° E before and after the search lands.
  - **Purpose and filters, round 2:** the live suite checks the site_ids. In the UI, a country filter on Jezero (rank 1 may move).
  - **Product name:** "moonbnb" appears nowhere in the responses.
  - **Results rework 1/4, engine side:** summaries go through `brief`, `unplace` and `fractions`; `capability` is on every response's target. A null judge shows 0 bars without breaking.
  - **States by source:** aborted pins show up in the engine log.
  - **Compare window (Results rework 2/4: wired):** watch the swap from illustrative to real terrain, which has no curtain (the jump is bigger than the mock's), and decide whether to add one. Check that an Earth window with nulls draws them at its lowest height without a false pit.
  - **Site selector grid:** the spaced names "Utopia Planitia" and "Taurus Littrow Valley" load. The Mars grid's three `/elevation/point` reads run in parallel with the search chain on one process: if they queue badly, chain them. On a phone, scroll the grid to its foot and check the lazy tiles land.
  - **Site projection** and **Overlay compare:** closed by code. `loaders/windows.py:37` warps onto `from_origin(-half, half, …)` in a local AEQD, so row 0 is north and column 0 is west. The live `row0`/`col0` strings prove nothing alone, because `server.py:276–277` hard-codes them. Mark both notes closed.
  - **Should 12**, **Slope hazard layer**, **Profile and measure**, **Landing ellipse** and **Sun-angle slider:** nothing to do. They apply only if the site view moves to engine windows, and it stays on frontend patches (**Real data**).
- [ ] With the dev server above running, set `CELL` in `scripts/a11y.mjs:23` to a live cell from a Jezero result, in place of `@34.6750,-105.0750`, and run `npm run a11y`.
- [ ] Run `VITE_DATA=engine npm run perf`.
- [ ] Fix only what breaks, and log it in progress.md.

**Verify:** `npm run typecheck`, `npm test` (mock, unchanged) and `VITE_DATA=engine npm run build` pass; the capture subset, a11y and perf pass on the live engine.

**Exit:** the demo path works live at desktop and phone sizes.

### Phase 7: map accuracy for the demo path (frontend)

- [ ] Make the Map accuracy follow-ups 1–3 below. Follow-up 2 needs Phase 6's live cells.

**Verify:** capture those sites, then run `VITE_DATA=engine npm run perf` (GPU memory is at 294.6 of 300 MB). Check how much `public/sites` grows.

**Exit:** no illustrative terrain is left on the demo path, and the demo's Earth cells have real crops.

### Phase 8: demo readiness and freeze (all)

- [ ] Add `web/scripts/warm.mjs` and its `warm` npm script.
- [ ] On the live-pitch machine: `cd web && VITE_DATA=engine npm run build && npm run preview` (port 4173; the engine's CORS default `*` allows it). On Windows, use the PowerShell form under Phase 3.
- [ ] Deploy as D5 says. For the mock site: `VITE_DATA=mock VITE_SITE_URL=… npm run build`.
  - For a VM, also: `VITE_DATA=engine VITE_API=/api/v1`, with Caddy proxying `/api/v1` to :8000 on the same origin.
  - After the deploy, paste the judge link into a chat app and check its preview card (**Share and meta**).
- [ ] Upload the data if D3 says so (see Repo, push and AGENTS.md).
- [ ] Rehearse three times from cold (see Demo readiness), record the video (D10), then tag `demo-v1`.

**Verify:** `warm.mjs` exits 0 on the final machine, and the judge link opens on a phone.

**Exit:** the run-of-show checklist is all ticked.

## Engine changes

Code patches, each its own commit on top of the import commit:

| # | Change | Where | Why |
| --- | --- | --- | --- |
| E1 (must) | `_site_z` and `_point_z` stop caching a failed read: the cached inner function raises on `None`, and the wrapper returns `None`. The routes keep their 404 `no_image` and 422 `no_dem`. Fallback, if Phase 4's Wi-Fi check still fails after Wi-Fi returns: also call `gdal.VSICurlClearCache()` in the `None` path, because GDAL's `/vsicurl/` can keep a failed open cached as missing (plausible, not verified on GDAL 3.12) | `server.py:252–260`, `290–293` | Today one S3 blip sticks as `no_image`/`no_dem` until a restart: `lru_cache` keeps the `None`. This is the worst demo failure that is cheap to fix |
| E2 (if measured) | Memoise successful `target_window` results by (body, lat and lon to 4 dp, px), at most 64 entries (about 70 KB each). `search_location` and `_point_z` share the cache | `search/api.py:22` | Arcadia, Meridiani and Elysium have no `iau` (`web/src/data/sites.ts:28,33,35`), so each visit is a 5–10 s remote read, and warm-up can't help them otherwise |
| E3 | `run_server.sh` executable | In the import commit | `./run_server.sh` fails today |
| E4 (if needed) | A slim `environment.server.yml`, torchvision included | `engine/code/` | Only if the full environment won't solve on osx-arm64 |
| E5 (with the owner's OK) | Stretch the hillshade to its 2nd–98th percentile before `* 255` (two lines) | `server.py:236` (`_png`) | Gentle windows come out near-uniform grey on the card thumbnails (**Hillshade contrast**); the same stretch as compare's twins |

**Tests:** `engine/code/tests/test_server_cache.py` stubs `eidolon.search.api` and `eidolon.loaders.windows` in `sys.modules`, then checks that a `None` read is not cached and a hit is. It needs numpy and fastapi (pydantic comes with it), not GDAL or torch, so CI runs it.

**Other files the merge adds under `engine/`:** `AGENTS.md`, `CLAUDE.md`, and `fetch_data.py` (D3 b only).

**Not changed (we live with these):**
- schemas for health, purposes, sovereigns and elevation (the live suite checks their shape instead);
- percent phrasing in summaries (`fractions` rewrites it);
- "MoonBnb" in docstrings;
- `capability` null for pins;
- no place names and no `site_listing`;
- the 59.5° cutoff (the web copy is fixed instead);
- `ENGINE_COMMIT` (it names the base; the patches are listed in `engine/AGENTS.md`);
- polar DEMs, unless D7 says otherwise;
- one worker, no auth, aborted pins still running on the server.

## Frontend changes

| Change | Where | Why |
| --- | --- | --- |
| `?mock=on` fallback: `MOCK = import.meta.env.VITE_DATA !== 'engine' \|\| modes.has('on')`, moved below `modes` | `web/src/data/client.ts:20–22` | The same build and URL switch to labelled sample data if the engine or network dies |
| In a search by coordinates, `no_dem` where `!noDemAt(body, lat)` is rethrown as `EngineError(0, 'network')`. Not in `ask` (Settled). New `client.test.ts` cases: a Mars pin answered `no_dem` ends as `network`; a Moon pin beyond 59.5° still ends as `no_dem` with no request | `client.ts:87` (the search's catch), `client.test.ts` | The engine answers `no_dem` for any failed read, so an offline Mars pin today shows the Moon "within 60°" copy |
| Copy "within 60°" and "reaches 60°" → "59.5°" | `ui/terrain-ui.ts:32`, `ui/fallback.ts:32`, `ui/results.ts:237,253`, `ui/target-search.ts:47`, `ui/panel.ts:393`, `ui/grid.ts:68`, `index.html:124,144`, the check texts in `scripts/capture-states.mjs:152,707`, and their tests | The engine cuts at 59.5°. Leave the "Exclude polar sites, beyond 60°" filter label: `engine.py:137` uses 60 |
| Hadley's compare caption says the window is centred on Rima Hadley, about 18 km south-west of the Apollo 15 site | The compare caption for `hadley` | The compared square leaves out the landing site; say so rather than move it |
| `TIMEOUT_MS` | `http.ts:10` | Only if Phase 3's slowest pin is over 45 s |
| The warm-up bar's 40 s and copy; `ask`'s `n` | `ui/results.ts:218–219`, `client.ts:124` | Only if Phase 3's warm-up is over 40 s (bar) or 60 s (`n`) |
| Fix stale notes in progress.md: "30 s timeout" at `:835`, `:1392` and `:6395` (it is 60 s); **Booking flow review fixes** says the weather seam is "still synchronous" (`data/weather.ts:76–80` fetches Open-Meteo and NASA POWER and calls `landed`); **Data seam, engine mode** and **Performance budget** set `VITE_DATA=engine` "in .env" (on the command line now); **Site projection** and **Overlay compare** closed (Phase 6) | `docs/progress.md` | They are wrong now |
| `live.test.ts`; `test:live`: `vitest run --mode live --testTimeout=90000 src/data/live.test.ts`; `scripts/warm.mjs` and `warm`: `node scripts/warm.mjs` | New files, `package.json` | Contract checks; demo warm-up |
| `CELL` → a live cell | `scripts/a11y.mjs:23` | Phase 6 |
| `DEMO_CELLS`, plus five `real-sites.ts` entries | `src/data/real-sites.ts`, `scripts/fetch-real-data.mjs:503` | Map accuracy 1–2 |

**Not done:**
- lazy-importing the mock (the last line of **Data seam, engine mode**);
- mock filter re-ranking;
- evicting failed windows or images client-side (a reload re-asks, and the route is in the hash);
- pin blocks built from `/elevation/point`;
- types generated from `/openapi.json` (plan.md, Data seam): the JSON Schemas stay the one source, and the live suite's mock-vs-live check catches drift.

## Contract checks

`web/src/data/live.test.ts` runs only under `npm run test:live`: it is wrapped in `describe.skipIf(import.meta.env.MODE !== 'live')`, so `npm test` skips it. It calls the real `httpEngine` (not the client, so the client's own `noDemAt` refusal is bypassed). The base is `http.ts`'s `API`: `VITE_API`, read at import, else `http://127.0.0.1:8000/api/v1`. The timeout is 90 s per test: pins take 5–10 s, and Moon lat 70's `no_dem` takes about 10 s, because `target_window` tries 3 times, 5 s apart (`search/api.py:22–36`). Raw JSON goes through the same Ajv setup as `contracts.test.ts` wherever a schema exists.

| Check | Expect |
| --- | --- |
| `/health` | `ready`, `engine_commit` `ec4e20b7203b`, `index_sites` > 0 |
| `/purposes` | The mock's 7 keys; polar lighting `supported:false` |
| `/sovereigns` | Non-empty `{name,sites}` (188 expected) |
| `/targets?body=mars&q=jez&limit=8`, `/targets/mars/Jezero` | Schema-valid; Jezero at 18.4082, 77.6873 |
| POST Jezero, default | `source:"cache"`, schema-valid |
| POST Jezero, `rover_mobility` and `drill_isru` | The same `site_id`s, `purpose` echoed (**Purpose and filters, round 2**) |
| POST Jezero, `filters.exclude_polar` | Rank 1's `site_id` unchanged |
| POST Jezero, `filters.sovereigns` set | `source:"live"`; rank 1 may differ (log it) |
| POST Mars by coordinates, lon `282.3127` vs `-77.6873` | `remote`; the same results both ways |
| POST Moon by coordinates `(20.19, 30.77)` | `remote`, schema-valid |
| `/elevation/target`, `/point` (Mars and Moon), `/site` | `size_px` 94, `pixel_m` 200, `z` 94×94 of numbers or null |
| `/images/target/…png` (with `Utopia%20Planitia` and `Taurus%20Littrow%20Valley`), `/images/site/{cell}.png` | `image/png`, 188 px |
| Mock vs live | Every field `mock.ts` emits exists live with the same type. This catches null judges, the landform clause and key drift |
| Copy | No "moonbnb" in summaries or caveats; percentages match what `fractions` rewrites |

**Must fail with:**
- `unknown_target`, for a made-up name;
- `invalid_request`, for k=21 and for limit=501 (FastAPI's array `detail`);
- `unsupported_purpose`;
- `unknown_purpose`;
- `no_dem`, for Moon lat 70;
- `no_image`, for cell 999999999.

**Warming probe:** the suite reads `/health` first.
- If it says `warming_up` (the run started within 2 s of the engine), the probe runs: `/search` gives 503 `warming_up`, and `/purposes` gives 200. Then a `beforeAll` polls `/health` every 3 s until `ready` (up to 120 s) before the other checks.
- If it says `ready`, the probe is skipped and the run is logged as warm.

**Offline probe (Wi-Fi off):**
- Cached named searches and the target elevation still pass.
- A Mars pin shows the network copy in the UI, not the Moon no-data copy.

## Repo, push and AGENTS.md

**Layout (D1 a):**

```
/        README.md  AGENTS.md  CLAUDE.md (@AGENTS.md)  .gitignore  .github/workflows/ci.yml  .claude/launch.json
web/     the frontend (history kept) + AGENTS.md + CLAUDE.md (@AGENTS.md)
engine/  code/ (src, contracts, docs, tests, data/*.csv, environment.yml, pyproject, ENGINE_COMMIT),
         run_server.sh/.bat, MANIFEST.json, QUICKSTART.md, README.txt, AGENTS.md, CLAUDE.md (@AGENTS.md),
         fetch_data.py (only with D3 b); index/ grid/ weights/ judge/ targets/ gitignored
```

**Root `AGENTS.md`:**
- the layout, and that each half has its own AGENTS.md;
- the quickstart for both halves, with two terminals: the engine, then `cd web && VITE_DATA=engine npm run dev`;
- the data step. Under D3 a: get a copy of the bundle from the engine owner, then link (`ln -s`) the five data dirs into `engine/`, or on Windows copy them or use `mklink /J`. Under D3 b: `python engine/fetch_data.py` in a fresh clone;
- where the docs are:
  - `web/docs/plan.md` and this file;
  - `web/docs/progress.md`: read "Final state" and "Merge notes" only, because the file is 0.9 MB;
  - `engine/code/docs/frontend_spec.md`;
- the contract loop: edit `engine/code/contracts`, copy it to `web/contracts`, then run `npm run types`, `npm test` and `npm run test:live`.

**Never:**
- commit `engine/{index,grid,weights,judge,targets}`, any file over 50 MB, `captures/`, `.cache/`, `dist/`, `node_modules`, `.env.local`, `.claude/settings.local.json`, `~/.netrc` or a Kaggle token;
- put `VITE_DATA=engine` in `.env` or `.env.local`;
- hand-edit generated files;
- force-push `main`;
- run the engine from E.

**`web/AGENTS.md`:**
- the npm scripts: dev on :5173, build, test, typecheck, types, capture, a11y, perf, fetch:real, test:live, warm;
- the seam rule: the UI calls only `src/data/client.ts`, set with `VITE_DATA` (on the command line), `VITE_API` and `?mock=on`;
- generated files: `types.gen.ts`, `targets.json`, `public/`;
- the `?capture` and `?mock=` conventions;
- log work in progress.md.

**`engine/AGENTS.md`:**
- conda setup and its pins;
- the env vars: the five data paths that `run_server.sh` sets, plus `EIDOLON_HOST`, `_PORT`, `_CORS`, `_JUDGE_INRAM` and `_MASK_CACHE`;
- what running it takes: `sh run_server.sh` (Windows: `run_server.bat`), the measured warm-up and RSS, internet for pins, one worker;
- tests: `pytest code/tests`;
- the contracts are the source of truth;
- patches E1–E5 against `ec4e20b7`.

**Push:** Phase 2, on your go-ahead only.

**Data (D3 b), only when a second machine needs it:**
- `gh release create data-ec4e20b7 engine/{index,targets,weights,judge,grid}/*` uploads 94 files, 2.84 GB.
- `engine/fetch_data.py`, Python standard library only: `gh release download` into `engine/.dl`, then move each file to its MANIFEST path. It fails on any sha256 mismatch (sha256 was not run on E yet).
- It refuses to run when any of the five target dirs is a symlink or already holds files. On this Mac they are links into E, and moving files there would overwrite E. It runs in a fresh clone only.
- A private repo needs `gh auth` to download. A public repo's assets are public (D6).

## Demo readiness

**Demo path:**

| Stop | Engine source | Expect |
| --- | --- | --- |
| `#/mars/jezero`, compare on result 1 | cache; `/elevation/site` (warmed) | Instant; the caption stays at the IAU centre |
| Jezero with one country filter | live, 0.15–0.3 s | Rank 1 may move. Rehearse the exact filter |
| `#/mars/gale`, `#/moon/hadley` | cache | Instant; Hadley caption from Frontend changes |
| Utopia or Taurus–Littrow | cache | Real terrain after Phase 7 |
| Elysium or Meridiani | remote, unless E2 and warmed | 5–10 s with the detection frame, or instant if warmed |
| One rehearsed pin | remote | 5–10 s; one pin at a time |
| Booking, My campaigns | frontend | Unchanged |
| A south-pole site (optional) | none | Terrain plus the honest no-data note. Use it to make the point, not to search |

**Warm-up:**
1. Start the engine on the final machine at least 5 minutes before the pitch and wait for `ready`.
2. Run `npm --prefix web run warm`, about 30 lines. It polls /health, POSTs every demo-path search, and GETs each result's `/elevation/site/{cell}` and each target's elevation. It prints timings and exits 1 on any failure, so it is also the smoke test.
3. Don't restart the engine after warming: every cache is in memory.

**Offline fallback, in order:**
1. A phone hotspot.
2. `?mock=on` on the same URL. It works with no network and labels sample data.
3. The D5 hosted mock link.
4. The video (D10).

Without internet, cached named searches and target elevation still work. Pins, unwarmed Earth cells and weather do not (weather shows labelled sample days).

**Run-of-show checks:**
- [ ] `/health` is `ready`, and `engine_commit` is as expected.
- [ ] `warm.mjs` exits 0.
- [ ] RSS has headroom with Chrome open.
- [ ] The browser shows the production preview build (Phase 8), not dev.
- [ ] The hotspot has been tested, and the hosted mock link opens on a phone.
- [ ] The video is ready.
- [ ] If a card shows "no image" mid-demo: reload (the hash keeps the route). With E1 in, the engine has not cached the failure.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| 8 GB of RAM swaps with the engine, Chrome and Vite | High if this Mac runs the demo | High | Measure in Phase 3; `JUDGE_INRAM=0`, `MASK_CACHE=1`; preview instead of dev; D4 |
| The conda environment won't solve on osx-arm64 (libcurl 8.19 and OpenBLAS pins) | Medium | High | E4 slim environment; or run on the Windows laptop the env file was written for |
| `http.ts` breaks on first live contact | High | Medium | Phase 5 before the UI pass; budget half a day |
| Warm-up on the demo machine is over 60 s, so compare windows asked meanwhile give up | Low | Medium | Phase 3 measures it; raise `ask`'s `n` |
| Venue internet or S3 is slow or down | Medium | High for pins | Demo path on cached names; warm; hotspot; `?mock=on` |
| One S3 blip sticks as `no_image`/`no_dem` | Medium | High | E1 (and its `VSICurlClearCache` fallback); reload recovers the client |
| An offline Mars pin shows the Moon no-data copy | High when offline | Medium | The search maps `no_dem` to `network` |
| Filters move rank 1 | Certain | Low if scripted | Rehearse the exact filter |
| JS budget (340.8 of 350 KB) or GPU budget (294.6 of 300 MB) breaks | Medium | Low | perf after Phases 6 and 7; lazy-import the mock; unload the cloud map (2.8 MB) |
| GitHub rejects the push (GH007, email privacy) | Medium | Low | Untick the setting (Phase 2) |
| Judges can't open a private repo | High if forgotten | High | D6 before the deadline |
| Aborted pins keep running on the server; a burst stalls it | Low | Medium | One pin at a time in the demo; the client already aborts the older pin |
| Teammates have no engine data after cloning | Certain | Medium for them | D3 b with `fetch_data.py` when needed |
| `jemb_all.npy` grows past the 2 GiB asset cap | Low | Medium | `split` it and join it in `fetch_data.py` |
| The bundle differs from `ec4e20b7` (Oct 19 edits) | Certain | Low | The import commit says so; the engine owner confirms |
| Open-Meteo is free for non-commercial use only | Low | Low | Already credited; fine for a hackathon |

## Map accuracy follow-ups

Only these are worth doing for the demo. They come from the accuracy survey's top improvements.

1. **Real terrain for the five illustrative targets.** Add Utopia, Arcadia, Meridiani, Elysium and Taurus–Littrow to `web/src/data/real-sites.ts`, then run `npm run fetch:real -- --only=sites`. All five are inside the MOLA–HRSC and SLDEM coverage, and Utopia and Taurus are cached demo stops.
2. **Real 30 m crops for the demo's Earth cells.** Add a `DEMO_CELLS` list, taken from Phase 6's live demo-path results, to `cells` in `fetch-real-data.mjs:503`. Today a result cell's 65.8 km crop is about 7 globe pixels.
3. **Flag Hadley's compare window.** Copy only; see Frontend changes.

**Not for the demo:**
- pin blocks built from `/elevation/point` (the pin block is 140 km wide; the window is 18.8 km);
- runtime GIBS crops per cell;
- caps for the Moon's north pole and Mars's poles;
- calibrated Mars colour, and the mismatch between Viking detail and TES albedo;
- WAC seams;
- lander photo coordinates.

## Out of scope

- South-pole matching, unless D7 says so.
- Nearest place names.
- A `site_listing` endpoint.
- Engine schemas for health, purposes, sovereigns and elevation.
- Fractions phrasing in engine summaries.
- Engine auth, rate limits, more workers, and mask or performance tuning.
- The live suite in CI.
- Git LFS.
- Rewriting history or the author email.
- Step-1 leftovers: the Stars row, the final logo, KTX2 textures.
- A hosted engine at all, unless D5 b.
