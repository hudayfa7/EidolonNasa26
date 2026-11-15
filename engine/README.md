# engine/

The Eidolon search engine: a Python (FastAPI) server whose trained models rank Earth's terrain against a site on the
Moon or Mars. The frontend in `../web/` calls it when started with `VITE_DATA=engine`; to run both, see "Run it with
the real model" in [`../README.md`](../README.md).

Its data is **not in git**. The server needs five data dirs, 2.6 GB in all: `index/` (2.4 GB), `targets/`, `weights/`,
`judge/` and `grid/`. They are gitignored and stored as assets on this repo's GitHub release
[`engine-data-ec4e20b`](https://github.com/hudayfa7/EidolonNasa26/releases/tag/engine-data-ec4e20b). Until they are
downloaded into this folder, `run_server.sh` cannot start.

What is here, copied from the engine bundle (engine commit `ec4e20b` in `code/ENGINE_COMMIT`, plus local edits of
2026-10-19): `code/` (source, contracts, docs, tests, environment), `run_server.sh`, `run_server.bat`, `MANIFEST.json`
(the data files and their sizes), `QUICKSTART.md` and `README.txt` (the bundle's own instructions).

## Getting the data

The release holds the 94 data files flat (GitHub assets can't have folders) plus `SHA256SUMS`, which gives each file's
folder and checksum. You need `curl` and 2.6 GB free. From the repo root (on Windows, use Git Bash):

```sh
sh engine/fetch_data.sh
```

It downloads each file into its folder, skips files that are already there and valid, and ends with
"engine data: all files present and verified". Rerun it if a download breaks off. The five data dirs are gitignored,
so none of this gets committed.
