Eidolon search-engine data bundle (see docs/search_engine.md in the repo).
Set these env vars to the folders in this bundle, then use eidolon.search.api.search_location(...):
  EIDOLON_INDEX_DIR=<bundle>/index
  EIDOLON_GRID_DIR=<bundle>/grid
  EIDOLON_WEIGHTS_DIR=<bundle>/weights
  EIDOLON_JUDGE_WEIGHTS=<bundle>/judge/pair1_final.pt
  EIDOLON_TARGET_STORE=<bundle>/targets
Verify file integrity against MANIFEST.json (sha256). Target DEMs are read remotely (internet needed).
