"""F2s target fingerprint: form embedding + hand-crafted properties + amplitude, sign and scale codes + geomorphons.

Definitions match the evaluated F2s (experiments/SEARCH, experiments/EDA/eda5.prep, experiments/SEARCH/scale_term).
"""
import numpy as np
from scipy.stats import skew

from eidolon.features.cell_terrain import cell_properties
from eidolon.features.craterness import craterness
from eidolon.features.geomorphons import geomorphon_hist


def prep(z):
    """Plane-detrended, std-normalised window and its detrended std (metres)."""
    n = z.shape[0]
    yy, xx = np.mgrid[:n, :n]
    zf = np.where(np.isfinite(z), z, np.nanmean(z))
    A = np.c_[xx.ravel(), yy.ravel(), np.ones(n * n)]
    r = zf - (A @ np.linalg.lstsq(A, zf.ravel(), rcond=None)[0]).reshape(n, n)
    s = r.std()
    return r / (s + 1e-9), float(s)


def centroid_oct(z, px_km=0.2):
    """log2 of the spectral-centroid wavelength (km) of the detrended, normalised window."""
    r, _ = prep(z)
    n = r.shape[0]
    w = np.outer(np.hanning(n), np.hanning(n))
    P = np.abs(np.fft.fft2(r * w)) ** 2
    k = np.hypot(*np.meshgrid(np.fft.fftfreq(n), np.fft.fftfreq(n))) / px_km
    m = k > 0
    return float(np.log2(1.0 / ((k[m] * P[m]).sum() / P[m].sum())))


def fingerprint(z, encoder, px=200.0):
    """px: pixel size (m) of the window; must equal the index scale it is compared with (multi-scale index)."""
    r, sd = prep(z)
    return {"emb": encoder(z, px), "props": cell_properties(z, px), "amp": np.log2(sd + 1e-3),
            "sign": float(skew(r.ravel())), "scale": centroid_oct(z, px / 1000.0), "gm": geomorphon_hist(z, px=px),
            "cr": craterness(z)}
