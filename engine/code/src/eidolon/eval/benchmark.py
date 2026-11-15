"""Known-analog benchmark: area-weighted percentile ranks of known sites, bootstrap CIs.

A method is a score per candidate cell (higher = more analog-like). A known site's rank is the
best-scoring candidate cell within its operating area (pin +- radius), which absorbs pin error.
Percentile = area-weighted share of candidate cells scoring strictly better (0 = best).
"""
import numpy as np


def weighted_percentile_of(scores: np.ndarray, weights: np.ndarray, value: float) -> float:
    ok = np.isfinite(scores)
    better = ok & (scores > value)
    return float(weights[better].sum() / weights[ok].sum())


def site_percentiles(scores, weights, cell_lat, cell_lon, sites, radius_km=5.0, mode="nearest"):
    """sites: iterable of (site_id, lat, lon). Returns {site_id: percentile or nan if no candidate nearby}.

    mode="nearest" (default): rank the single candidate cell nearest the pin (within radius_km).
    mode="best": rank the best cell within radius_km. BIASED: a best-of-k max favours noisy scores
    and sites with more nearby cells (random scores get median ~0.1 instead of 0.5). Kept only to
    reproduce the original E001 run."""
    out = {}
    for sid, lat, lon in sites:
        dlat = np.radians(cell_lat - lat)
        dlon = np.radians(cell_lon - lon)
        a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat)) * np.cos(np.radians(cell_lat)) * np.sin(dlon / 2) ** 2
        d = 2 * 6371 * np.arcsin(np.sqrt(a))
        near = (d <= radius_km) & np.isfinite(scores)
        if not near.any():
            out[sid] = np.nan
            continue
        if mode == "best":
            v = scores[near].max()
        else:
            v = scores[near][np.argmin(d[near])]
        out[sid] = weighted_percentile_of(scores, weights, v)
    return out


def median_ci(pcts, n_boot=5000, seed=0):
    v = np.array([p for p in pcts if np.isfinite(p)])
    if v.size == 0:
        return np.nan, (np.nan, np.nan), 0
    rng = np.random.default_rng(seed)
    boots = np.median(rng.choice(v, size=(n_boot, v.size), replace=True), axis=1)
    return float(np.median(v)), (float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5))), int(v.size)


def paired_bootstrap(pa: dict, pb: dict, n_boot=5000, seed=0):
    """P(method A's median percentile is NOT better than B's) under resampling of sites.
    Small values mean A ranks known sites better (lower percentile) than B."""
    ids = [k for k in pa if np.isfinite(pa[k]) and np.isfinite(pb.get(k, np.nan))]
    a = np.array([pa[k] for k in ids])
    b = np.array([pb[k] for k in ids])
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(ids), size=(n_boot, len(ids)))
    diff = np.median(a[idx], axis=1) - np.median(b[idx], axis=1)
    return float((diff >= 0).mean()), len(ids)


def recall_at(pcts, frac):
    v = np.array([p for p in pcts if np.isfinite(p)])
    return float((v <= frac).mean()) if v.size else np.nan
