# Eidolon

NASA Space Apps Challenge 2026: *Identify Earth locations that analog the permanent Moon base locations and Mars.*
Pick a site on the Moon or Mars and Eidolon ranks the places on Earth whose terrain form comes closest at 200 m, shows
them side by side, and helps plan a test campaign at one.

| Folder | What |
| --- | --- |
| [`web/`](web/) | The frontend (Vite, TypeScript, three.js). Runs on sample data by default, or on the engine with `VITE_DATA=engine`. See [`web/README.md`](web/README.md) |
| [`engine/`](engine/) | The search engine: the trained models that rank Earth's terrain. Its 2.6 GB of data is downloaded separately. See [`engine/README.md`](engine/README.md) |

The hosted site runs on sample data: saved answers from the engine. To search with the real model, run it on your own
computer.

## Run it with the real model

You need about 16 GB of RAM (8 GB can work, see below), 6 GB of free disk, an internet connection (searches at a
dropped pin read elevation online), Node 22 or later, and [Miniforge](https://conda-forge.org/download/) for Python.

```sh
git clone https://github.com/hudayfa7/EidolonNasa26.git eidolon
cd eidolon
sh engine/fetch_data.sh                            # the engine's data, 2.6 GB, checked file by file
conda env create -f engine/code/environment.yml    # once
conda activate eidolon
pip install -e engine/code                         # once
sh engine/run_server.sh                            # leave it running (Windows: engine\run_server.bat)
```

Wait until http://127.0.0.1:8000/api/v1/health says `ready` (about a minute while the models load). Then, in a
second terminal:

```sh
cd eidolon/web
npm ci
VITE_DATA=engine npm run dev                       # http://localhost:5173/ (Windows PowerShell: $env:VITE_DATA='engine'; npm run dev)
```

With 8 GB of RAM, start the engine with `EIDOLON_JUDGE_INRAM=0 EIDOLON_MASK_CACHE=1 sh engine/run_server.sh`: the
judge model is then read from disk instead of held in memory, and searches are slower.

## Setting up from a fresh clone

Everything you need is in git or on the repo's release. Nothing lives only on one laptop.

```sh
git clone https://github.com/hudayfa7/EidolonNasa26.git eidolon
cd eidolon/web
npm ci                              # Node 26
npm run dev                         # http://localhost:5173/, on mock data
npx playwright install chromium     # only for npm run capture, a11y, perf and poster
```

The engine's data (2.6 GB) is only needed to run the engine: `sh engine/fetch_data.sh` downloads it from the repo's
release and checks every file ([`engine/README.md`](engine/README.md)). To work in Claude Code cloud sessions instead
of on a laptop, see [`CLOUD.md`](CLOUD.md).

None of these are in git, and each comes back with a command, so they are safe to delete:

| Folder | Brings it back |
| --- | --- |
| `web/node_modules/` | `npm ci` |
| `web/dist/` | `npm run build` |
| `web/captures/` (screenshots) | `npm run capture` (the build) and `npm run capture:ref` (the prototype) |
| `web/.cache/` (raw downloads for the real maps) | `npm run fetch:real` (only needed to remake the files in `web/public/`) |
| `engine/{index,grid,weights,judge,targets}/` | "Getting the data" in `engine/README.md` |
