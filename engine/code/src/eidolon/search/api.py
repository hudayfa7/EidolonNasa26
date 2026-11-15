"""One-call search for the backend: Mars/Moon coordinates -> contract-valid match_result list.

  from eidolon.search.api import search_location
  results = search_location("mars", -28.16, -41.68, name="Nirgal_Vallis", purpose="rover_mobility",
                            sovereigns=["United Kingdom"], k=10)

Target DEMs: Mars = CTX / MOLA-HRSC blend, Moon = SLDEM2015 (eidolon.loaders.windows), 94 x 94 at 200 m.
The Index (measured 1.5 GB RAM, 12 s load for 500k sites) is loaded once per process and reused.
"""
from functools import lru_cache

import numpy as np

from eidolon.search.engine import Index


@lru_cache(maxsize=1)
def get_index():
    return Index()


def target_window(body, lat, lon, tries=3, wait_s=5.0, px=200.0):
    """Remote DEM read (USGS/AWS). The loaders return None both for 'no coverage' and for transient network failures,
    so retry a few times before concluding there is no DEM here."""
    import time
    from eidolon.loaders.windows import mars_blend_window, moon_window
    if body not in ("mars", "moon"):
        raise ValueError(f"body must be 'mars' or 'moon', got {body!r}")
    fn = mars_blend_window if body == "mars" else moon_window
    for k in range(tries):
        z = fn(lat, lon, px_m=px, size=94)
        if z is not None:
            return z
        if k < tries - 1:
            time.sleep(wait_s)
    return None


JUDGE_SHORTLIST = 20


@lru_cache(maxsize=1)
def get_judge():
    from eidolon.search.judge import PairJudge
    return PairJudge()


@lru_cache(maxsize=1)
def get_store():
    from eidolon.search.judge import CandidateStore
    return CandidateStore(get_index().idir)


def judge_rerank(z, results, title="target", k=10, T=None):
    """PAIR1: reorder an F2s shortlist by the learned pair judge (fresh blind test: best-of-3 0.30 -> 0.55).
    Fast path: precomputed candidate embeddings; sites without one fall back to a remote window read."""
    J = get_judge()
    cells = [int(r["site_id"].split("_")[-1]) for r in results]
    _, C = get_store().get(cells) if get_store().ok else (None, [None] * len(cells))
    p = np.full(len(results), np.nan)
    have = [i for i, c in enumerate(C) if c is not None]
    if have:
        T = J.target_embeddings(z) if T is None else J.torch.as_tensor(np.asarray(T, dtype=np.float32))
        p[have] = J.score_embeddings(T, np.stack([C[i] for i in have]))
    miss = [i for i, c in enumerate(C) if c is None]
    if miss:
        from concurrent.futures import ThreadPoolExecutor
        from eidolon.loaders.windows import earth_window
        with ThreadPoolExecutor(12) as ex:
            W = list(ex.map(lambda i: earth_window(results[i]["location"]["lat"], results[i]["location"]["lon"], px_m=200.0, size=94), miss))
        p[miss] = J.score(z, W, title)
    order = sorted(range(len(results)), key=lambda i: (-(p[i] if np.isfinite(p[i]) else -1.0), i))
    out = []
    for new_rank, i in enumerate(order[:k], start=1):
        r = dict(results[i])
        r["raw"] = {**r["raw"], "judge_p_good": None if not np.isfinite(p[i]) else round(float(p[i]), 4), "f2s_rank": results[i]["rank"]}
        r["rank"] = new_rank
        out.append(r)
    return out


def search_location(body, lat, lon, name="target", target_type=None, purpose="rover_mobility", k=10, judge=True, **filters):
    """filters: sovereigns, bbox (lon0, lat0, lon1, lat1), access, exclude_polar, surface ('barren'|'any'), crowd.
    judge=True (default, adopted 2026-10-08): F2s retrieves the top 20, the PAIR1 pair judge picks the order."""
    z = target_window(body, lat, lon)
    if z is None:
        raise LookupError(f"no {body} DEM at ({lat}, {lon})")
    res = get_index().search(z, target_id=name, purpose=purpose, k=max(k, JUDGE_SHORTLIST) if judge else k,
                             target_type=target_type, body=body, **filters)
    if not judge or not res:
        return res[:k]
    return judge_rerank(z, res, f"target: {name} ({body}, {target_type or 'unknown'})", k)


# ------------------------------------------------------------------ fast path for IAU-named targets (FAST1)
import json as _json
import os as _os
from pathlib import Path as _Path

TARGET_DIR = _Path(_os.environ.get("EIDOLON_TARGET_STORE", _Path(__file__).resolve().parents[3] / "data/interim/target_store"))
_FILTER_KEYS = ("sovereigns", "bbox", "access", "exclude_polar", "surface", "crowd")


class TargetStore:
    """Precomputed target side for every IAU-named Mars/Moon feature (scripts/build_target_store.py): window, F2s
    fingerprint and judge target embeddings. Lookup is case-insensitive on 'body:name'."""

    def __init__(self, d=TARGET_DIR):
        d = _Path(d)
        self.ok = (d / "targets.npz").exists()
        if not self.ok:
            return
        self.a = dict(np.load(d / "targets.npz"))
        self.meta = _json.load(open(d / "targets.json"))
        self.pos = {f"{m['body']}:{m['name']}".lower(): i for i, m in enumerate(self.meta)}
        self.cache = d / "results.sqlite"

    def get(self, body, name):
        i = self.pos.get(f"{body}:{name}".lower())
        if i is None:
            return None
        a = self.a
        fp = {"emb": a["emb"][i], "props": dict(zip(("slope_b1", "slope_b3", "curvature", "relief", "rough_scaling"), a["props"][i])),
              "amp": float(a["amp"][i]), "sign": float(a["sign"][i]), "scale": float(a["scale"][i]), "gm": a["gm"][i], "cr": a["cr"][i]}
        return {"meta": self.meta[i], "fp": fp, "jt": a["jt"][i].astype(np.float32), "z": a["Z"][i].astype(np.float32)}

    def cached(self, key):
        if not self.cache.exists():
            return None
        import gzip
        import sqlite3
        if not hasattr(self, "_db"):
            self._db = sqlite3.connect(f"file:{self.cache}?mode=ro", uri=True, check_same_thread=False)
        row = self._db.execute("SELECT v FROM r WHERE k = ?", (key,)).fetchone()
        return None if row is None else _json.loads(gzip.decompress(row[0]))


@lru_cache(maxsize=1)
def get_targets():
    return TargetStore()


def cache_key(body, name, purpose, filters):
    from eidolon.search.engine import BARREN_PURPOSES
    surface = filters.get("surface") or ("barren" if purpose in BARREN_PURPOSES else "any")
    f = {k: filters[k] for k in sorted(filters) if k in _FILTER_KEYS and k != "surface" and filters[k] not in (None, False, [], ())}
    return f"{body}:{name}".lower() + f"|{surface}|" + _json.dumps(f, sort_keys=True)


def search_named(body, name, purpose="rover_mobility", k=10, judge=True, use_cache=True, **filters):
    """Fast search for an IAU-named Mars/Moon feature: no remote DEM read, no neural-net forward on the target.
    Default filters hit the precomputed result cache (milliseconds); other filters run the live FAST1 path (~0.2 s).
    Falls back to search_location for names not in the target store."""
    T = get_targets().get(body, name) if get_targets().ok else None
    if T is None:
        raise LookupError(f"{body}:{name} is not in the target store; use search_location(body, lat, lon, ...)")
    m = T["meta"]
    if use_cache and judge and k <= 20:
        hit = get_targets().cached(cache_key(body, m["name"], purpose, filters))
        if hit is not None:
            return [{**r, "purpose": purpose} for r in hit[:k]]
    res = get_index().search(T["z"], target_id=m["name"], purpose=purpose, k=max(k, JUDGE_SHORTLIST) if judge else k,
                             target_type=m["type"], body=body, fingerprint=T["fp"], **filters)
    if not judge or not res:
        return res[:k]
    return judge_rerank(T["z"], res, f"target: {m['name']} ({body}, {m['type']})", k, T=T["jt"])
