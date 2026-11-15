"""Terrain features computed from DEMs. Body-agnostic: inputs are heights in metres and
pixel spacing in metres, so the same code serves Earth, Moon and Mars."""
import numpy as np


def slope_deg(dem: np.ndarray, dx: float, dy: float) -> np.ndarray:
    """Slope in degrees from a 2-D height grid (metres) with pixel spacing dx, dy (metres).

    Masked/NaN cells propagate as NaN. The baseline of the slope is the pixel spacing, so
    compare bodies only after resampling to the same spacing.
    """
    z = np.ma.filled(np.ma.asarray(dem, dtype="float64"), np.nan)
    gy, gx = np.gradient(z, dy, dx)
    s = np.degrees(np.arctan(np.hypot(gx, gy)))
    s[np.isnan(z)] = np.nan  # central differences skip the centre cell, so mask it explicitly
    return s


def hillshade(dem: np.ndarray, dx: float, dy: float, azimuth: float = 315.0, altitude: float = 45.0) -> np.ndarray:
    """Lambertian hillshade in [0, 1] with a fixed sun, for display and as a T3 input channel."""
    z = np.ma.filled(np.ma.asarray(dem, dtype="float64"), np.nan)
    gy, gx = np.gradient(z, dy, dx)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = np.radians(azimuth), np.radians(altitude)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    shade = np.clip(shade, 0, 1)
    shade[np.isnan(z)] = np.nan
    return shade
