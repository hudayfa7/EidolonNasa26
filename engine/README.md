# engine/: the Eidolon search engine

The Eidolon search engine (Python, FastAPI), connected to the frontend in `../web/`: the frontend calls it when built or run with `VITE_DATA=engine`, and `npm run test:live` in `web/` checks the
two against each other. On mock data (the default) the frontend doesn't need it.

- Its data is **not in git**. The server needs five data dirs, 2.6 GB in all: `index/` (2.4 GB), `targets/`,
  `weights/`, `judge/` and `grid/`. They are gitignored and stored as assets on this repo's public GitHub release
  [`engine-data-ec4e20b`](https://github.com/hudayfa7/EidolonNasa26/releases/tag/engine-data-ec4e20b). Until they
  are downloaded into this folder, `run_server.sh` cannot start. `MANIFEST.json` lists each file's sha256 and, under
  `provenance`, the sources and licences it derives from.
- Run it: a conda environment with its packages, then `sh run_server.sh` (Windows: `run_server.bat`); `/api/v1/health`
  says `ready` after about 35–75 s. `pytest code/tests` runs its tests.

What is here, from the bundle (engine commit `ec4e20b` in `code/ENGINE_COMMIT`, plus local edits of 2026-10-19 and the
engine patches): `code/` (source, contracts, docs, tests, environment), `run_server.sh`, `run_server.bat`,
`MANIFEST.json`, `QUICKSTART.md` and `README.txt` (the bundle's own instructions).

## Getting the data

The release holds the 94 data files flat (GitHub assets can't have folders) plus `SHA256SUMS`, which gives each file's
folder and checksum. You need `curl`, `sha256sum` (or `shasum`) and 2.6 GB free; no GitHub login. From the repo root
(on Windows, use Git Bash):

```sh
sh engine/fetch_data.sh
```

It downloads each file into its folder, skips files that are already there and valid, and ends with
"engine data: all files present and verified". Rerun it if a download breaks off. The five data dirs are gitignored,
so none of this gets committed.

## Running it with the frontend

The repo's `README.md` (Setup) has the steps: the data, a conda environment, the server, then the frontend with
`VITE_DATA=engine`.
