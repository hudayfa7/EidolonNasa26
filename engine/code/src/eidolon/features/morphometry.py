"""Rotation-invariant morphometric descriptors of a DEM window (metres, square px), body-agnostic.

Extends `cell_terrain` (v1) with properties aimed at landform *fabric* and multi-scale shape:
multi-baseline slope, profile/plan curvature, structure-tensor coherence (linearity), radial
power-spectrum slope (fractal roughness), hypsometric integral and local relief at two radii.
Distribution-valued properties are returned as quantile vectors (LEVELS); scalars as length-1 arrays.
"""
import numpy as np
from scipy import ndimage

from eidolon.features.distributions import quantiles
from eidolon.features.terrain import slope_deg

V2_PROPERTIES = ("slope_b2", "slope_b4", "curv_profile", "curv_plan", "coherence", "spectral_slope",
                 "hypsometric", "relief_1km", "relief_4km")


def _fill(z):
    z = np.asarray(z, dtype=np.float64)
    return np.where(np.isfinite(z), z, np.nanmean(z))


def _block_mean_k(z, f):
    h, w = (z.shape[0] // f) * f, (z.shape[1] // f) * f
    return z[:h, :w].reshape(h // f, f, w // f, f).mean(axis=(1, 3))


def curvatures(z, px):
    """Profile curvature (along steepest descent) and plan curvature (across it), 1/m."""
    zy, zx = np.gradient(z, px)
    zyy, zyx = np.gradient(zy, px)
    _, zxx = np.gradient(zx, px)
    p, q = zx, zy
    g2 = p ** 2 + q ** 2 + 1e-12
    prof = -(zxx * p ** 2 + 2 * zyx * p * q + zyy * q ** 2) / (g2 * (1 + g2) ** 1.5)
    plan = -(zxx * q ** 2 - 2 * zyx * p * q + zyy * p ** 2) / (g2 ** 1.5)
    flat = g2 < (np.tan(np.radians(0.5)) ** 2)            # undefined on flats
    prof[flat], plan[flat] = np.nan, np.nan
    return prof, plan


def coherence(z, px, sigma=2.0):
    """Structure-tensor coherence in [0,1]: 1 = strongly linear fabric, 0 = isotropic. Rotation-invariant."""
    gy, gx = np.gradient(z, px)
    jxx = ndimage.gaussian_filter(gx * gx, sigma)
    jyy = ndimage.gaussian_filter(gy * gy, sigma)
    jxy = ndimage.gaussian_filter(gx * gy, sigma)
    tr = jxx + jyy
    disc = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2)
    with np.errstate(invalid="ignore", divide="ignore"):
        c = (disc / tr) ** 2
    c[tr < 1e-10] = np.nan
    return c


def spectral_slope(z, px, lam_min=400.0, lam_max=8000.0):
    """Log-log slope of the radially averaged power spectrum over wavelengths [lam_min, lam_max]."""
    n = min(z.shape)
    zz = z[:n, :n] - np.mean(z[:n, :n])
    yy, xx = np.mgrid[:n, :n]
    plane = np.linalg.lstsq(np.c_[xx.ravel(), yy.ravel(), np.ones(n * n)], zz.ravel(), rcond=None)[0]
    zz = zz - (plane[0] * xx + plane[1] * yy + plane[2])
    win = np.outer(np.hanning(n), np.hanning(n))
    P = np.abs(np.fft.fftshift(np.fft.fft2(zz * win))) ** 2
    k = np.hypot(*(np.mgrid[:n, :n] - n // 2)) / (n * px)          # cycles per metre
    ok = (k >= 1 / lam_max) & (k <= 1 / lam_min)
    if ok.sum() < 10:
        return np.nan
    kb = np.round(np.log(k[ok]) * 8) / 8
    keys = np.unique(kb)
    lk = np.array([np.log(np.mean(k[ok][kb == u])) for u in keys])
    lp = np.array([np.log(np.mean(P[ok][kb == u]) + 1e-30) for u in keys])
    return float(np.polyfit(lk, lp, 1)[0])


def local_relief(z, px, radius_m):
    s = max(3, int(round(2 * radius_m / px)) | 1)
    return ndimage.maximum_filter(z, s) - ndimage.minimum_filter(z, s)


def v2_properties(z, px):
    """Dict of V2_PROPERTIES for a window z (metres) with square pixels px (metres)."""
    nan = np.full(20, np.nan, dtype=np.float32)
    if np.isfinite(z).mean() < 0.6:
        return {k: (nan if k not in ("spectral_slope", "hypsometric") else np.array([np.nan], np.float32)) for k in V2_PROPERTIES}
    zf = _fill(z)
    prof, plan = curvatures(zf, px)
    zmin, zmax = np.nanmin(z), np.nanmax(z)
    hyp = (np.nanmean(z) - zmin) / (zmax - zmin) if zmax > zmin else np.nan
    return {
        "slope_b2": quantiles(slope_deg(_block_mean_k(zf, 2), 2 * px, 2 * px).ravel(), min_count=6),
        "slope_b4": quantiles(slope_deg(_block_mean_k(zf, 4), 4 * px, 4 * px).ravel(), min_count=6),
        "curv_profile": quantiles(prof.ravel() * 1e4),
        "curv_plan": quantiles(plan.ravel() * 1e2),
        "coherence": quantiles(coherence(zf, px).ravel()),
        "spectral_slope": np.array([spectral_slope(zf, px)], np.float32),
        "hypsometric": np.array([hyp], np.float32),
        "relief_1km": quantiles(local_relief(zf, px, 500.0).ravel()),
        "relief_4km": quantiles(local_relief(zf, px, 2000.0).ravel()),
    }
