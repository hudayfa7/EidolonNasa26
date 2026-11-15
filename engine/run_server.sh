#!/usr/bin/env sh
HERE=$(cd "$(dirname "$0")" && pwd)
export EIDOLON_INDEX_DIR="$HERE/index"
export EIDOLON_GRID_DIR="$HERE/grid"
export EIDOLON_WEIGHTS_DIR="$HERE/weights"
export EIDOLON_JUDGE_WEIGHTS="$HERE/judge/pair1_final.pt"
export EIDOLON_TARGET_STORE="$HERE/targets"
python -m eidolon.server
