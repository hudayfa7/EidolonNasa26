"""Eidolon reference HTTP server: the contract between the Eidolon search engine and the front end.

Spec: docs/frontend_spec.md. Schemas: contracts/api/*.json (+ contracts/match_result.json for each result).

  python -m eidolon.server                 # http://127.0.0.1:8000  (interactive docs at /docs)
  EIDOLON_PORT=9000 python -m eidolon.server

Data locations come from the usual env vars (EIDOLON_INDEX_DIR, EIDOLON_GRID_DIR, EIDOLON_WEIGHTS_DIR,
EIDOLON_JUDGE_WEIGHTS, EIDOLON_TARGET_STORE) or the repo layout. Startup loads everything once (~30-40 s).
"""
import io
import os
import subprocess
import threading
import time
from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, model_validator

API_VERSION = "1.0.0"
ROOT = Path(__file__).resolve().parents[2]

# ------------------------------------------------------------------------------------------------ vocabulary
PURPOSES = {   # key -> (label, surface searched, what it means); mirrors contracts/match_result.json purpose enum
    "rover_mobility": ("Rover mobility", "barren", "Drive and navigation tests over terrain of the same form and roughness."),
    "drill_isru": ("Drilling / ISRU", "barren", "Drill, excavation and resource-extraction trials on bare ground."),
    "eva_training": ("EVA training", "barren", "Astronaut field training in a look-alike landscape."),
    "habitat_ops": ("Habitat operations", "barren", "Habitat and long-duration operations in a barren setting."),
    "astrobiology": ("Astrobiology", "barren", "Field science in barren, extreme environments."),
    "thermal": ("Thermal testing", "barren", "Equipment trials in barren terrain (thermal context from environment)."),
    "education": ("Education / outreach", "any", "Landform look-alikes anywhere on land (vegetated rugged terrain allowed)."),
}
UNSUPPORTED_PURPOSES = {"polar_lighting_geometry": "Served by the lighting-geometry module (experiments/E007), not the terrain search."}
FAMILY = {"depression": {"AA", "SF", "CA", "CB", "PE"},
          "linear": {"VA", "RI", "FO", "DO", "RU", "CM", "SC", "SU", "LA", "LB"},
          "raised": {"MO", "TH", "MN", "CO", "PR", "CH", "TA", "PM"}}


def family_of(code):
    return next((f for f, cs in FAMILY.items() if code in cs), "other")


# ------------------------------------------------------------------------------------------------ request models
class TargetRef(BaseModel):
    body: Literal["mars", "moon"]
    name: Optional[str] = Field(None, description="IAU feature name (exact, case-insensitive). Fast path.")
    lat: Optional[float] = Field(None, ge=-90, le=90, description="Planetocentric latitude (deg). Used if name is absent.")
    lon: Optional[float] = Field(None, ge=-180, le=360, description="East-positive longitude (deg); 0..360 accepted.")

    @model_validator(mode="after")
    def _one_of(self):
        if self.name is None and (self.lat is None or self.lon is None):
            raise ValueError("give either target.name or both target.lat and target.lon")
        if self.lon is not None and self.lon > 180:
            self.lon -= 360
        return self


class Filters(BaseModel):
    sovereigns: Optional[List[str]] = Field(None, description="Restrict to these sovereign states (names as in /api/v1/sovereigns).")
    bbox: Optional[List[float]] = Field(None, min_length=4, max_length=4, description="[lon_min, lat_min, lon_max, lat_max] on Earth.")
    access: Optional[List[Literal["partner", "non_partner", "antarctic_treaty", "unknown"]]] = None
    exclude_polar: bool = Field(False, description="Drop sites with |lat| > 60.")
    surface: Optional[Literal["barren", "any"]] = Field(None, description="Override the purpose's default surface.")


class SearchRequest(BaseModel):
    target: TargetRef
    purpose: str = "rover_mobility"
    k: int = Field(10, ge=1, le=20)
    filters: Filters = Field(default_factory=Filters)


# ------------------------------------------------------------------------------------------------ app
app = FastAPI(title="Eidolon search API", version=API_VERSION,
              description="Earth analogs for Mars and Moon targets. See docs/frontend_spec.md.")
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("EIDOLON_CORS", "*").split(","), allow_methods=["*"], allow_headers=["*"])
STATE = {"ready": False, "error": None, "started": time.time()}


def _warm():
    try:
        from eidolon.search.api import get_index, get_judge, get_store, get_targets
        get_index(); get_judge(); get_store(); get_targets()
        STATE["ready"] = True
    except Exception as e:  # noqa: BLE001
        STATE["error"] = repr(e)


@app.on_event("startup")
def _startup():
    threading.Thread(target=_warm, daemon=True).start()


def _need_ready():
    if not STATE["ready"]:
        raise HTTPException(503, detail={"code": "warming_up", "message": STATE["error"] or "engine is loading (~30-40 s)"})


@lru_cache(maxsize=1)
def _git():
    f = ROOT / "ENGINE_COMMIT"                       # written into the data bundle's code snapshot (scripts/make_bundle.py)
    if f.exists():
        return f.read_text().strip()[:12] or None
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip() or None
    except Exception:  # noqa: BLE001
        return None


def _model_info():
    from eidolon.search.engine import MATCHER
    return {"api_version": API_VERSION, "matcher": MATCHER, "judge": "PAIR1", "engine_commit": _git()}


def _target_summary(m):
    from eidolon.search.engine import Index
    cap = Index.capability(m["body"], m["type"].split(",")[0].lower())
    return {"target_id": f"{m['body']}:{m['name']}", "body": m["body"], "name": m["name"], "type": m["type"].split(",")[0],
            "code": m["code"], "family": family_of(m["code"]), "lat": round(m["lat"], 4), "lon": round(m["lon"], 4),
            "diameter_km": m["diameter_km"], "coordinate_source": "IAU Gazetteer of Planetary Nomenclature (center point)",
            "capability": None if cap is None else {"tier": cap["tier"], "p_target_top3": float(cap["p_target_top3"]),
                                                    "n_targets": int(cap["n_targets"]), "landform_class": cap["landform_type"]},
            "image_url": f"/api/v1/images/target/{m['body']}/{m['name']}.png"}


# ------------------------------------------------------------------------------------------------ endpoints
@app.get("/api/v1/health")
def health():
    out = {"status": "ready" if STATE["ready"] else ("error" if STATE["error"] else "warming_up"), "error": STATE["error"],
           "uptime_s": round(time.time() - STATE["started"], 1), **_model_info()}
    if STATE["ready"]:
        from eidolon.search.api import get_index, get_targets
        S = get_targets()
        out.update(index_sites=int(len(get_index().d["cell"])), named_targets=len(S.meta) if S.ok else 0)
        if S.ok and S.cache.exists():
            import sqlite3
            with sqlite3.connect(f"file:{S.cache}?mode=ro", uri=True) as db:
                out["cached_queries"] = db.execute("SELECT COUNT(*) FROM r").fetchone()[0]
    return out


@app.get("/api/v1/purposes")
def purposes():
    return {"purposes": [{"key": k, "label": v[0], "surface": v[1], "description": v[2], "supported": True} for k, v in PURPOSES.items()]
            + [{"key": k, "label": "Polar lighting geometry", "surface": None, "description": v, "supported": False}
               for k, v in UNSUPPORTED_PURPOSES.items()]}


@app.get("/api/v1/sovereigns")
def sovereigns():
    _need_ready()
    from eidolon.search.api import get_index
    I = get_index()
    names, counts = np.unique(I.sovereign, return_counts=True)
    return {"sovereigns": [{"name": str(n), "sites": int(c)} for n, c in zip(names, counts) if str(n)]}


@app.get("/api/v1/targets")
def targets(body: Optional[Literal["mars", "moon"]] = None, q: Optional[str] = Query(None, description="case-insensitive substring"),
            family: Optional[Literal["depression", "linear", "raised", "other"]] = None,
            include_satellite: bool = Query(False, description="include lunar lettered satellite craters (~6,300)"),
            limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)):
    _need_ready()
    from eidolon.search.api import get_targets
    M = get_targets().meta
    ql = q.lower() if q else None
    rows = [m for m in M if (body is None or m["body"] == body) and (include_satellite or m["code"] != "SF" or (ql and ql in m["name"].lower()))
            and (ql is None or ql in m["name"].lower()) and (family is None or family_of(m["code"]) == family)]
    if ql:                                                     # prefix matches first, then by name
        rows.sort(key=lambda m: (not m["name"].lower().startswith(ql), m["name"]))
    return {"total": len(rows), "offset": offset, "targets": [_target_summary(m) for m in rows[offset:offset + limit]]}


@app.get("/api/v1/targets/{body}/{name}")
def target(body: Literal["mars", "moon"], name: str):
    _need_ready()
    from eidolon.search.api import get_targets
    T = get_targets().get(body, name)
    if T is None:
        raise HTTPException(404, detail={"code": "unknown_target", "message": f"{body}:{name} is not an IAU-named feature in the store"})
    z = T["z"]
    return {**_target_summary(T["meta"]), "relief_sd_m": round(float(np.nanstd(z)), 1),
            "window": {"size_px": int(z.shape[0]), "pixel_m": 200.0, "extent_km": round(z.shape[0] * 0.2, 1)}}


@app.post("/api/v1/search")
def search(req: SearchRequest):
    _need_ready()
    if req.purpose in UNSUPPORTED_PURPOSES:
        raise HTTPException(422, detail={"code": "unsupported_purpose", "message": UNSUPPORTED_PURPOSES[req.purpose]})
    if req.purpose not in PURPOSES:
        raise HTTPException(422, detail={"code": "unknown_purpose", "message": f"purpose must be one of {sorted(PURPOSES)}"})
    from eidolon.search.api import cache_key, get_targets, search_location, search_named
    f = {k: v for k, v in req.filters.model_dump().items() if v not in (None, False, [])}
    if "bbox" in f:
        f["bbox"] = tuple(f["bbox"])
    t0 = time.perf_counter()
    tr = req.target
    S = get_targets()
    tinfo, source = None, None
    if tr.name is not None:
        T = S.get(tr.body, tr.name) if S.ok else None
        if T is None:
            raise HTTPException(404, detail={"code": "unknown_target", "message": f"{tr.body}:{tr.name} not found; send lat/lon instead"})
        m = T["meta"]
        tinfo = _target_summary(m)
        source = "cache" if S.cached(cache_key(tr.body, m["name"], req.purpose, f)) is not None else "live"
        results = search_named(tr.body, m["name"], purpose=req.purpose, k=req.k, **f)
    else:
        try:
            results = search_location(tr.body, tr.lat, tr.lon, name=f"{tr.body}_{tr.lat:.3f}_{tr.lon:.3f}", purpose=req.purpose, k=req.k, **f)
        except LookupError as e:
            raise HTTPException(422, detail={"code": "no_dem", "message": str(e)})
        source = "remote"
        tinfo = {"target_id": f"{tr.body}:{tr.lat:.4f},{tr.lon:.4f}", "body": tr.body, "name": None, "type": None, "code": None,
                 "family": None, "lat": tr.lat, "lon": tr.lon, "diameter_km": None, "coordinate_source": "user", "capability": None,
                 "image_url": None}
    for r in results:                     # side-by-side hillshades (contract field terrain_twins; rendered on request, cached)
        r["terrain_twins"] = [{"earth_url": f"/api/v1/images/site/{r['site_id'].split('_')[-1]}.png",
                               **({"target_url": tinfo["image_url"]} if tinfo.get("image_url") else {})}]
    return {"query": {"target": tr.model_dump(), "purpose": req.purpose, "k": req.k, "filters": f}, "target": tinfo,
            "source": source, "timing_ms": round(1000 * (time.perf_counter() - t0), 1), "model": _model_info(), "results": results}


# ------------------------------------------------------------------------------------------------ images
def _png(z, scale=2):
    from PIL import Image
    from eidolon.search.judge import hillshade
    s = np.asarray(hillshade(np.asarray(z, dtype=np.float64)), dtype=np.float64)
    # Stretch to the 2nd-98th percentile so gentle terrain isn't flat grey; a flat window is left as it is.
    lo, hi = (np.nanpercentile(s, 2), np.nanpercentile(s, 98)) if np.isfinite(s).any() else (0.0, 1.0)
    if hi - lo > 1e-6:
        s = np.clip((s - lo) / (hi - lo), 0.0, 1.0)
    h = (np.nan_to_num(s) * 255).astype(np.uint8)
    im = Image.fromarray(h).resize((h.shape[1] * scale, h.shape[0] * scale), Image.BILINEAR)
    buf = io.BytesIO(); im.save(buf, format="PNG")
    return buf.getvalue()


@app.get("/api/v1/images/target/{body}/{name}.png")
def target_image(body: Literal["mars", "moon"], name: str):
    _need_ready()
    from eidolon.search.api import get_targets
    T = get_targets().get(body, name)
    if T is None:
        raise HTTPException(404, detail={"code": "unknown_target"})
    return Response(_png(T["z"]), media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})


def _cache_found(maxsize):
    """Like lru_cache, but a miss (None, a failed remote read) is never kept, so one blip doesn't stick until a restart."""
    def deco(fn):
        store = {}
        lock = threading.Lock()

        def wrapper(*args):
            with lock:
                if args in store:
                    store[args] = store.pop(args)        # most recent last
                    return store[args]
            val = fn(*args)
            if val is not None:
                with lock:
                    store[args] = val
                    while len(store) > maxsize:
                        store.pop(next(iter(store)))
            return val
        wrapper.cache_clear = store.clear
        return wrapper
    return deco


@_cache_found(4096)
def _site_z(cell):
    from eidolon.loaders.windows import earth_window
    from eidolon.search.api import get_index
    I = get_index()
    pos = np.flatnonzero(I.d["cell"] == cell)
    if not len(pos):
        return None
    return earth_window(float(I.lat[pos[0]]), float(I.lon[pos[0]]), px_m=200.0, size=94)


@app.get("/api/v1/images/site/{cell}.png")
def site_image(cell: int):
    _need_ready()
    z = _site_z(int(cell))
    if z is None:
        raise HTTPException(404, detail={"code": "no_image", "message": "unknown site or Earth DEM unavailable"})
    return Response(_png(z), media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})


# ------------------------------------------------------------------------------------------------ raw elevation
def _elev(z):
    """The exact window the hillshade is drawn from: metres, row 0 = north, column 0 = west (local AEQD grid)."""
    z = np.asarray(z, dtype=np.float32)
    return {"size_px": int(z.shape[0]), "pixel_m": 200.0, "extent_km": round(z.shape[0] * 0.2, 1), "units": "m",
            "row0": "north", "col0": "west", "z": [[None if not np.isfinite(v) else round(float(v), 1) for v in row] for row in z]}


@app.get("/api/v1/elevation/target/{body}/{name}")
def target_elevation(body: Literal["mars", "moon"], name: str):
    _need_ready()
    from eidolon.search.api import get_targets
    T = get_targets().get(body, name)
    if T is None:
        raise HTTPException(404, detail={"code": "unknown_target", "message": f"{body}:{name} is not an IAU-named feature in the store"})
    return _elev(T["z"])


@_cache_found(256)
def _point_z(body, lat, lon):
    from eidolon.search.api import target_window
    return target_window(body, lat, lon)


@app.get("/api/v1/elevation/point/{body}")
def point_elevation(body: Literal["mars", "moon"], lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=360)):
    _need_ready()
    lon = lon - 360 if lon > 180 else lon
    z = _point_z(body, round(lat, 4), round(lon, 4))          # remote DEM read, ~5-10 s first time
    if z is None:
        raise HTTPException(422, detail={"code": "no_dem", "message": f"no {body} DEM at ({lat}, {lon})"})
    return _elev(z)


@app.get("/api/v1/elevation/site/{cell}")
def site_elevation(cell: int):
    _need_ready()
    z = _site_z(int(cell))
    if z is None:
        raise HTTPException(404, detail={"code": "no_image", "message": "unknown site or Earth DEM unavailable"})
    return _elev(z)


def main():
    import uvicorn
    import eidolon.env  # noqa: F401
    uvicorn.run(app, host=os.environ.get("EIDOLON_HOST", "127.0.0.1"), port=int(os.environ.get("EIDOLON_PORT", "8000")))


if __name__ == "__main__":
    main()
