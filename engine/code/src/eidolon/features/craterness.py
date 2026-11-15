"""Crater-ness / dome-ness: position-free ring detector for circular depressions (craters, calderas, maars) and
circular rises (cones, domes) in a DEM window. Rotation-invariant; scale-resolved over fixed radii.

For each radius R: response(x) = mean(z on the annulus 0.85R..1.15R around x) - mean(z on the disk r < 0.6R around x),
on the plane-detrended window, divided by its std. Rim higher than floor -> positive (crater); centre higher -> negative
(cone). Only centres whose full annulus lies inside the window are used. C_R = max response, V_R = max(-response).
"""
import numpy as np
from scipy.signal import fftconvolve

RADII_PX = (5, 7.5, 10, 15, 20, 30)          # 1, 1.5, 2, 3, 4, 6 km at 200 m pixels
NAMES = [f"crater_r{r:g}" for r in RADII_PX] + [f"dome_r{r:g}" for r in RADII_PX]
_K = {}


def _kernels(R):
    if R not in _K:
        n = int(np.ceil(1.15 * R)) + 1
        yy, xx = np.mgrid[-n:n + 1, -n:n + 1]
        r = np.hypot(xx, yy)
        ring = ((r >= 0.85 * R) & (r <= 1.15 * R)).astype(np.float64)
        disk = (r < 0.6 * R).astype(np.float64)
        _K[R] = (ring / ring.sum() - disk / disk.sum(), n)
    return _K[R]


def _detrend(z):
    n, m = z.shape
    yy, xx = np.mgrid[:n, :m]
    zf = np.where(np.isfinite(z), z, np.nanmean(z))
    A = np.c_[xx.ravel(), yy.ravel(), np.ones(n * m)]
    r = zf - (A @ np.linalg.lstsq(A, zf.ravel(), rcond=None)[0]).reshape(n, m)
    return r / (r.std() + 1e-9)


def craterness(z):
    r = _detrend(np.asarray(z, dtype=np.float64))
    c, v = [], []
    for R in RADII_PX:
        k, n = _kernels(R)
        resp = fftconvolve(r, k[::-1, ::-1], mode="same")
        inner = resp[n:-n, n:-n] if resp.shape[0] > 2 * n else resp
        c.append(float(inner.max()))
        v.append(float(-inner.min()))
    return np.array(c + v)
