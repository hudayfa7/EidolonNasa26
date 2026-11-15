@echo off
set HERE=%~dp0
set EIDOLON_INDEX_DIR=%HERE%index
set EIDOLON_GRID_DIR=%HERE%grid
set EIDOLON_WEIGHTS_DIR=%HERE%weights
set EIDOLON_JUDGE_WEIGHTS=%HERE%judge\pair1_final.pt
set EIDOLON_TARGET_STORE=%HERE%targets
python -m eidolon.server
