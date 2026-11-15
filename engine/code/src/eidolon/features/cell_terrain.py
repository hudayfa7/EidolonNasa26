"""Terrain properties of one operating area (a square DEM window with square pixels in metres).

Body-agnostic: the same function runs on Earth (GLO-90), Mars (MOLA) and Moon (LOLA) windows
resampled to the same pixel size, so every property is compared at matched baselines.
"""
import numpy as np

from eidolon.features.distributions import LEVELS, quantiles
from eidolon.features.terrain import slope_deg

PROPERTIES = ("slope_b1", "slope_b3", "curvature", "relief", "rough_scaling")
COARSEN = 3  # second baseline = 3 x pixel size


def _block_mean(z: np.ndarray, f: int) -> np.ndarray:
    h, w = (z.shape[0] // f) * f, (z.shape[1] // f) * f
    return z[:h, :w].reshape(h // f, f, w // f, f).mean(axis=(1, 3))


def _detrend(z: np.ndarray) -> np.ndarray:
    """Remove the best-fit plane so relief reflects roughness, not regional tilt."""
    yy, xx = np.mgrid[:z.shape[0], :z.shape[1]]
    ok = np.isfinite(z)
    A = np.c_[xx[ok], yy[ok], np.ones(ok.sum())]
    coef, *_ = np.linalg.lstsq(A, z[ok], rcond=None)
    return z - (coef[0] * xx + coef[1] * yy + coef[2])


def cell_properties(z: np.ndarray, px_m: float) -> dict:
    """Quantile vectors (len(LEVELS)) for each property of a DEM window z (metres)."""
    nan = np.full(LEVELS.size, np.nan, dtype=np.float32)
    if np.isfinite(z).mean() < 0.6:
        return {p: nan for p in PROPERTIES}
    s1 = slope_deg(z, px_m, px_m)
    zc = _block_mean(z, COARSEN)
    s3 = slope_deg(zc, px_m * COARSEN, px_m * COARSEN)
    lap = (np.roll(z, 1, 0) + np.roll(z, -1, 0) + np.roll(z, 1, 1) + np.roll(z, -1, 1) - 4 * z) / px_m ** 2
    lap[[0, -1], :] = np.nan
    lap[:, [0, -1]] = np.nan
    resid = _detrend(z)
    relief = np.abs(resid[np.isfinite(resid)])
    # Roughness scaling: RMS slope ~ L^(H-1)  =>  H-1 = log(tan s3 / tan s1) / log(3), per coarse block
    t1 = _block_mean(np.tan(np.radians(s1)), COARSEN)
    t3 = np.tan(np.radians(s3))
    h = min(t1.shape[0], t3.shape[0]), min(t1.shape[1], t3.shape[1])
    with np.errstate(divide="ignore", invalid="ignore"):
        scaling = np.log(t3[:h[0], :h[1]] / t1[:h[0], :h[1]]) / np.log(COARSEN)
    return {
        "slope_b1": quantiles(s1.ravel()),
        "slope_b3": quantiles(s3.ravel(), min_count=6),
        "curvature": quantiles(lap.ravel() * 1e4),  # scaled to O(1) units (1e-4 / m)
        "relief": quantiles(relief),
        "rough_scaling": quantiles(scaling.ravel(), min_count=6),
    }
