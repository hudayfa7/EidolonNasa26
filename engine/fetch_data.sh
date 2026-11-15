#!/bin/sh
# Download the engine's data dirs (index, grid, weights, judge, targets; 94 files, 2.84 GB) from the private release
# into this folder and check every file against SHA256SUMS. Rerun-safe: files already present and valid are skipped.
# Uses gh's REST API (works locally and inside Claude Code cloud sessions, whose GitHub proxy blocks GraphQL).
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
REPO=hudayfa7/nasahackathon2026
TAG=engine-data-ec4e20b
if command -v sha256sum >/dev/null; then SHA="sha256sum"; else SHA="shasum -a 256"; fi

assets=$(gh api "repos/$REPO/releases/tags/$TAG" --jq '.assets[] | "\(.id) \(.name)"')
id_of() { printf '%s\n' "$assets" | awk -v n="$1" '$2 == n { print $1 }'; }
get() { gh api -H "Accept: application/octet-stream" "repos/$REPO/releases/assets/$(id_of "$1")" > "$2.part" && mv "$2.part" "$2"; }

get SHA256SUMS SHA256SUMS.tmp
while read -r sum path; do
  if [ -f "$path" ] && [ "$($SHA "$path" | cut -d' ' -f1)" = "$sum" ]; then continue; fi
  mkdir -p "${path%/*}"
  echo "fetching $path"
  get "${path##*/}" "$path"
done < SHA256SUMS.tmp
$SHA -c --quiet SHA256SUMS.tmp && echo "engine data: all files present and verified"
rm -f SHA256SUMS.tmp
