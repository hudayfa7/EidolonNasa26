# Eidolon search engine bundle (engine code @ ec4e20b720 + indexed Earth)

## 1. Install (once)
    conda env create -f code/environment.yml        # creates env "eidolon" (CPU torch, GDAL, fastapi, ...)
    conda activate eidolon
    pip install -e code                              # editable: the engine reads code/data/*.csv next to it

## 2. Run the API server (front end builds against this; spec: code/docs/frontend_spec.md)
    run_server.bat            (Windows)      or      ./run_server.sh     (macOS/Linux)
    -> http://127.0.0.1:8000/docs   (wait ~40 s for /api/v1/health to say "ready")

## 3. Or experiment in Python
    # set the env vars from run_server.* first (they point at the folders in this bundle), then:
    from eidolon.search.api import search_named, search_location
    search_named("mars", "Jezero", purpose="rover_mobility", k=5)          # IAU name: ~2 ms from cache
    search_named("moon", "Rima Hadley", k=5, sovereigns=["Australia"])     # custom filters: ~0.2 s
    search_location("mars", -4.59, 137.44, purpose="astrobiology", k=5)    # any point: ~5-10 s (remote DEM read)
    from eidolon.search.api import get_index; I = get_index()             # the 500k-site Earth index (I.lat, I.lon, I.d ...)

## Contents
    code/      engine source (src/eidolon), contracts, spec, tests       index/    500,127 Earth sites (F2s fingerprints, judge embeddings)
    grid/      site grid + country/access                                 weights/  form encoder (4 seeds)
    judge/     PAIR1 pair judge                                           targets/  10,100 IAU Mars/Moon targets + precomputed results
    MANIFEST.json  sha256 of every data file
Accuracy (blind, 160 never-used named targets): good analog in top 1 / 3 / 5 = 34% / 52.5% / 64%.
