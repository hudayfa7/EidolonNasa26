#!/bin/sh
# Download the engine's data dirs (index, grid, weights, judge, targets; 94 files, 2.84 GB) from the repo's release
# into this folder and check every file against SHA256SUMS. Rerun-safe: files already present and valid are skipped.
set -e
cd "$(dirname "$0")"
URL=https://github.com/hudayfa7/EidolonNasa26/releases/download/engine-data-ec4e20b
if command -v sha256sum >/dev/null; then SHA="sha256sum"; else SHA="shasum -a 256"; fi
get() { curl -fsSL --retry 3 -o "$2.part" "$URL/$1" && mv "$2.part" "$2"; }

get SHA256SUMS SHA256SUMS.tmp
while read -r sum path; do
  if [ -f "$path" ] && [ "$($SHA "$path" | cut -d' ' -f1)" = "$sum" ]; then continue; fi
  mkdir -p "${path%/*}"
  echo "fetching $path"
  get "${path##*/}" "$path"
done < SHA256SUMS.tmp
$SHA -c --quiet SHA256SUMS.tmp && echo "engine data: all files present and verified"
rm -f SHA256SUMS.tmp
