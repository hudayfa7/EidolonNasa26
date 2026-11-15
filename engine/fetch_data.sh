#!/bin/sh
# Download the engine's data dirs (index, grid, weights, judge, targets; 94 files, 2.6 GB) from this repo's public
# release into this folder and check every file against SHA256SUMS. Rerun-safe: files already present and valid are
# skipped. Needs only curl and sha256sum (or shasum); no GitHub login. On Windows, run it from Git Bash.
#
# Where the data comes from (MANIFEST.json "provenance" maps every file to its sources; web/docs/credits.md credits them):
#   index/site_attrs.npz   ETOPO 2022 elevation (NOAA, public domain); WorldClim 2.1 temperature and precipitation (no
#                          licence stated; the app does not show them); Global Aridity Index v3.1 (CC BY 4.0)
#   grid/cell_country.npz  Natural Earth admin-0 boundaries (public domain)
#   index/, grid/earth_grid.npz   Copernicus DEM GLO-30/GLO-90 (free use with attribution); the barren mask's source is
#                          not recorded here (ask the engine owner)
#   targets/               IAU Gazetteer of Planetary Nomenclature (public domain); Mars and Moon DEMs (USGS, NASA PDS)
#   weights/, judge/       the team's own models, trained on the elevation above
set -e
cd "$(dirname "$0")"
BASE=https://github.com/hudayfa7/EidolonNasa26/releases/download/engine-data-ec4e20b
if command -v sha256sum >/dev/null 2>&1; then SHA="sha256sum"
elif command -v shasum >/dev/null 2>&1; then SHA="shasum -a 256"
else echo "fetch_data.sh needs sha256sum or shasum (Git Bash, macOS and Linux have one)" >&2; exit 1; fi

get() { curl -fL --retry 3 -sS -o "$2.part" "$BASE/$1" && mv "$2.part" "$2"; }

get SHA256SUMS SHA256SUMS.tmp
while read -r sum path; do
  if [ -f "$path" ] && [ "$($SHA "$path" | cut -d' ' -f1)" = "$sum" ]; then continue; fi
  mkdir -p "${path%/*}"
  echo "fetching $path"
  get "${path##*/}" "$path"
done < SHA256SUMS.tmp
$SHA -c --quiet SHA256SUMS.tmp
echo "engine data: all files present and verified"
rm -f SHA256SUMS.tmp
