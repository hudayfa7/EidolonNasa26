# MoonBnb search engine: how to use it (for backend and front end)

**What it does:** given a Mars or Moon location, it ranks Earth sites by terrain similarity using the **F2s v1.0 fingerprint**. Results come back as `match_result` objects (`contracts/match_result.json`).

## Run a search
```
python scripts/search_analogs.py --body mars --lat -28.16 --lon -41.68 --name Nirgal_Vallis \
    --type amphitheater_headed_canyon --k 10 --out results.json
# filters (any combination):
#   --sovereign "United Kingdom"                # sovereign land incl. territories (Natural Earth SOVEREIGNT names)
#   --bbox lon0 lat0 lon1 lat1                  # map box
#   --access partner antarctic_treaty           # Artemis Accords partners (+ Antarctica) preset
#   --exclude-polar                             # |lat| <= 60 only
```
Python (backend): the engine is the package `eidolon.search` (`src/eidolon/search/`). Install the repo (`pip install -e .` in the `eidolon` env), then:

```python
from eidolon.search.api import search_location            # loads the index once per process (measured: 12 s, 1.5 GB RAM)
results = search_location("mars", -28.16, -41.68, name="Nirgal_Vallis", target_type="amphitheater_headed_canyon",
                          purpose="rover_mobility", k=10, sovereigns=["United Kingdom"])   # list of match_result dicts
```

Lower level: `from eidolon.search import Index; Index().search(dem_window, target_id=..., ...)` takes your own 94 × 94 window at 200 m. `experiments/INDEX/query.py` is now a shim over the package, and its outputs are verified identical (`tests/test_search_engine.py`).

**Data bundle the backend needs** (2.56 GB with the judge embeddings; not in git). `python scripts/make_bundle.py build` assembles it in `data/bundle/eidolon_search/` with a sha256 `MANIFEST.json`; `... check` loads the engine purely from the bundle and runs a judged query (verified 2026-10-09). Set the environment variables or keep the repo layout:

| what | default location | env var | size |
|---|---|---|---|
| index features + embeddings (`index_*.npz`, `emb_*.npz`, `ext_grid.npz`) | `data/interim/index/` | `EIDOLON_INDEX_DIR` | 115 + 200 + 3 MB |
| site grid + country/access (`earth_grid.npz`, `cell_country.npz`) | `data/interim/e001/` | `EIDOLON_GRID_DIR` | 12 + 2 MB |
| form-encoder weights (`e016_cnn_s0..3.pt`) | `data/interim/e016/cnn/` | `EIDOLON_WEIGHTS_DIR` | 84 MB |
| landform resolvability table | `data/landform_resolvability.csv` (in git) | – | – |

- **Target DEMs are read remotely** (Mars CTX / MOLA-HRSC blend, Moon SLDEM2015, from USGS/AWS URLs in `eidolon.loaders.windows`), so the server needs internet access for new targets.
- **Measured on the ML laptop (Ryzen AI 5 340):** index load 12 s, 1.5 GB RAM; then 1.2 s per query.
- **Result diversity:** global searches return at most 2 sites within 200 km of each other (`crowd=(2, 200)`, Google-style host crowding). Searches restricted by `sovereigns` or `bbox` turn this off, so a country search can return several nearby sites. Pass `crowd=False` to disable it, or a tuple to tune it. Sites closer than 20 km are always merged (NMS).

## What a result contains
- `fidelity`:
  - `score`: mean of the property scores
  - `percentile_earth`: share of candidates in the region ranked below this site
  - `matcher`: `F2s-200m-v1.1`
  - `confidence`: high / medium / low, from shape similarity; forced to low for sub-resolution targets
- `properties`: shown as bars on the card. Each has a status of match, partial, gap or not_measurable.
  - `terrain_form`: learned shape code (blind to rotation, scale and amplitude)
  - `relief`: amplitude ratio, ±1 octave tolerance
  - `slope`
  - `roughness`
  - `landform_polarity`: raised vs incised
  - `landform_scale`: characteristic size
- `explanation`:
  - `summary`: country, coordinates, shape similarity, relief ratio, and landform-element mix at 3 km from geomorphons
  - `strengths` and `gaps`
  - `caveats`: surface-model canopy, 600 m resolvability limit, polar access
- "No close analog in this region; best available." is prepended when the best shape similarity is below 0.80. Show it prominently.

## What the evidence supports (`docs/findings.md`)
- **Validation:** blind reviewer agents (inter-rater κ 0.67–0.75) and catalogue type precision. Volcano targets hit real Earth volcanoes at 5.6× the base rate.
- F2s beat a learned ranker **121–18** on an unbiased pool. It generalises because every term compares target against candidate.
- **Limits:**
  - Earth impact structures are eroded, so fresh-crater targets have few true analogs.
  - Landforms narrower than ~600 m are not measurable at 200 m.
  - In vegetated or urban areas, GLO-30 is a surface model (trees and buildings).

## Index coverage
332,494 barren-mask sites at 0.1° (~11 km). Build: `experiments/INDEX/README.md`.
- **Region searches in vegetated countries** (the UK, most of Europe) need the region grid pipeline (`experiments/SEARCH/region_search.py`): the barren index has few cells there.
- **Example result** from the full v1.1 index (non-polar, k = 3): `contracts/examples/match_nirgal_index_REAL.json`. This is real output, not fake, and `tests/test_contracts.py` validates it.
- **Surface (2026-10-07):** the index now also holds 171k rugged non-barren cells (mountains, likely vegetated; `experiments/INDEX/README.md`).
  - Field purposes (`rover_mobility`, `drill_isru`, `eva_training`, `habitat_ops`, `astrobiology`, `thermal`) search barren land only by default.
  - `education` and `polar_lighting_geometry` include rugged land; those results carry a "likely vegetated" caveat.
  - Override with `surface="any"` or `surface="barren"` (CLI `--surface`). Suggested UI: an "Include vegetated mountain terrain" toggle.
- **What `fidelity.confidence` means (2026-10-07):** only how similar the landform shape is (high: form cosine ≥ 0.90; medium: ≥ 0.80).
  - Two blind reviewer tests found it does **not** predict how good an analog an expert would judge the site (CAL1, CAL2).
  - Label it in the UI as "shape match", not "confidence".
  - Honest expectation for arbitrary Mars/Moon points: most results are textural look-alikes (grade "weak"). Only about 5% are judged the same landform type.
  - Named landforms with clear Earth counterparts (volcanoes, cones) do much better.

- **Capability notes (2026-10-07):** pass `target_type` as the IAU feature type (`crater`, `vallis`, `mons`, `patera`, `tholus`, `cavus`, `chaos`, `mensa`, `fossa`, `dorsum`, `rima`, `catena`, `rupes`, `promontorium`).
  - `search_location` passes the body through automatically.
  - Types rated *weak* or *fair* on the blind named-target benchmark (MT1, `data/landform_capability.csv`) get an explicit caveat in every result, e.g. "Earth analogs for moon crater targets were rated weak: 0% partial-or-better".
  - **Good:** wrinkle ridges, mountains, Mars valleys and mesas, lunar headlands.
  - **Weak:** craters, paterae, chaos, tholi, cavi, catenae, rupes.
  - Suggested UI: show that note above the results, not hidden in a tooltip.
- **Extra result blocks (2026-10-07), all optional in `contracts/match_result.json`:**
  - `location`: lat, lon, elevation_m (ETOPO 2022), country, sovereign, access, surface.
  - `raw`: unranked physical values for decision layers such as TOPSIS:
    - `ranking_score`;
    - `shape_cosine`;
    - `relief_ratio`;
    - mismatches in relief, polarity and scale (target minus site, 0 = identical);
    - `terrain_properties_pct`.
  - `environment`: `t_mean_c` and `precip_mm` (WorldClim 2.1), `aridity_index` (Global AI v3.1), sampled at the site centre (`scripts/build_site_attrs.py` → `data/interim/index/site_attrs.npz`, part of the data bundle).
- **Pair judge (PAIR1, adopted 2026-10-08):** `search_location` retrieves the F2s top 20, then orders it with a learned pair judge.
  - Fresh blind test: good analog in the top 3 for 55% of named targets, vs 30% for F2s alone.
  - `raw.judge_p_good` = the judge's P(partial-or-better); `raw.f2s_rank` = the rank before reordering. Pass `judge=False` for pure F2s.
  - Extra bundle files:
    - `data/interim/pair1/pair1_final.pt` (45 MB, `EIDOLON_JUDGE_WEIGHTS`);
    - precomputed candidate embeddings `jemb_all.npy` + `jemb_cells.npy` in the index dir (about 2 GB, memory-mapped).
  - Without the embeddings the judge falls back to remote window reads, which is correct but about 1 min per query.
  - **Measured (2026-10-08):** embeddings cover 500,119 of 500,127 sites. Judged query: about 2 s search + 0.35 s judge (warm); the first query adds about 10 s to load the model.
    - Embedded scores come from the Kaggle-extracted windows, so they differ slightly from scores on live window reads (e.g. 0.867 vs 0.832). High/low separation is preserved.


## Fast search (FAST1, 2026-10-09)
| query | how | latency (ML laptop) |
|---|---|---|
| IAU-named target, default filters | `search_named(body, name, purpose, k)` → precomputed judged results (SQLite) | **~1.6 ms** median, 3 ms p90 |
| IAU-named target, custom filters (country, bbox, access) | precomputed target fingerprint + judge embeddings → live FAST1 scoring + judge | ~0.2–0.3 s |
| arbitrary Mars/Moon coordinate | `search_location(...)`: remote DEM read (now direct S3 + GTIFF direct IO) + live path | ~6–10 s (read-bound) |

- **Target store** (`scripts/build_target_store.py`): every adopted IAU feature (Mars all, Moon |lat| ≤ 60; 10,100 usable
  of 10,157). Window, F2s fingerprint and judge target embeddings in `data/interim/target_store/targets.npz` + `targets.json`
  (236 MB). Env `EIDOLON_TARGET_STORE`.
- **Result cache** (`scripts/build_result_cache.py`): judged top 20 per target × {barren, all land} with default filters,
  `results.sqlite` (gzip JSON). Lookups are keyed by body, name, surface and filters, so any other filter combination
  falls through to the live path.
- **FAST1 scoring** (`Index.search(fast=True)`, default): torch float32 on per-filter cached arrays (LRU of 2, about
  0.45 GB each). Ranks are quantile-interpolated with the exact top 512 order statistics, and display ranks are exact
  (binary search / counting). Agrees with the exact path (`fast=False`) on 98% of the top 20 and 98.5% of the top 3
  (65 MT1 targets).
- **Remote DEM reads:** the Mars/Moon mosaics are uncompressed full-width strips. `GTIFF_DIRECT_IO=YES` +
  `GDAL_HTTP_MULTIRANGE=YES` (set in `eidolon.env`) cut reads from 49 s to 6 s (Mars) and from >180 s to 9 s (Moon).
  The loaders use the S3 URLs directly; the usgs.gov Cloudflare redirect throttled bulk reads.
- **RAM:** index ~1.5 GB + judge embeddings 2 GB (in RAM by default; `EIDOLON_JUDGE_INRAM=0` memory-maps instead) +
  FAST1 caches ~0.9 GB + target store 0.24 GB.
