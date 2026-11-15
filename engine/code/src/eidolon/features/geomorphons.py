"""Geomorphons (Jasiewicz & Stepinski 2013): 10 landform elements per cell from the line-of-sight pattern in 8 directions.

Lookup table verified verbatim against GRASS GIS r.geomorphon (raster/r.geomorphon/geom.c): rows = number of
directions where the neighbour is LOWER ("minus"), columns = number where it is HIGHER ("plus").
Per direction: zenith/nadir from the max and min elevation angle along the ray up to L pixels; '+' if the max upward
angle exceeds the flatness threshold t and dominates, '-' if the max downward angle does, else 0.
"""
import numpy as np

FORMS = ("flat", "peak", "ridge", "shoulder", "spur", "slope", "hollow", "footslope", "valley", "pit")
FL, PK, RI, SH, SP, SL, HL, FS, VL, PT, XX = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1
TABLE = np.array([
    [FL, FL, FL, FS, FS, VL, VL, VL, PT],
    [FL, FL, FS, FS, FS, VL, VL, VL, XX],
    [FL, SH, SL, SL, HL, HL, VL, XX, XX],
    [SH, SH, SL, SL, SL, HL, XX, XX, XX],
    [SH, SH, SP, SL, SL, XX, XX, XX, XX],
    [RI, RI, SP, SP, XX, XX, XX, XX, XX],
    [RI, RI, RI, XX, XX, XX, XX, XX, XX],
    [RI, RI, XX, XX, XX, XX, XX, XX, XX],
    [PK, XX, XX, XX, XX, XX, XX, XX, XX]])
DIRS = ((0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1))


def geomorphons(z, L, px=200.0, t_deg=1.0):
    """Return an int map of geomorphon classes (0-9) for a DEM window (NaN-safe; border cells use shorter rays)."""
    z = np.asarray(z, dtype=np.float64)
    n0, n1 = z.shape
    zp = np.pad(np.nan_to_num(z, nan=np.nanmean(z)), L, mode="constant", constant_values=np.nan)
    t = np.radians(t_deg)
    plus = np.zeros(z.shape, int)
    minus = np.zeros(z.shape, int)
    for dy, dx in DIRS:
        step = px * np.hypot(dy, dx)
        up = np.full(z.shape, -np.inf)
        dn = np.full(z.shape, np.inf)
        for k in range(1, L + 1):
            nb = zp[L + dy * k:L + dy * k + n0, L + dx * k:L + dx * k + n1]
            ang = np.arctan((nb - z) / (step * k))
            ok = np.isfinite(ang)
            up = np.where(ok, np.maximum(up, ang), up)
            dn = np.where(ok, np.minimum(dn, ang), dn)
        up = np.where(np.isfinite(up), up, 0.0)
        dn = np.where(np.isfinite(dn), dn, 0.0)
        is_plus = (up > t) & (up > -dn)
        is_minus = (-dn > t) & (-dn > up)
        plus += is_plus
        minus += is_minus
    cls = TABLE[minus, plus]
    return np.where(cls < 0, SL, cls)


def geomorphon_hist(z, Ls=(5, 15), px=200.0, t_deg=1.0):
    """Concatenated class-fraction histograms at several lookup distances (default 1 km and 3 km)."""
    out = []
    for L in Ls:
        g = geomorphons(z, L, px, t_deg)
        out.append(np.bincount(g.ravel(), minlength=10) / g.size)
    return np.concatenate(out)
