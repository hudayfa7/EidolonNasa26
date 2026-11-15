"""Fixed-size DEM windows with exact square metric pixels, on any body.

Each window is warped into a local azimuthal-equidistant (AEQD) projection centred on the point,
so a 94 x 94 window at 60 m is the same 5.6 km square on Earth, Mars or the Moon, with no
latitude distortion. Sources:
  Earth  Copernicus GLO-30 (streamed; neighbouring tiles mosaicked in an in-memory VRT)
  Mars   UCLA Exploration Zone CTX DEMs (Day et al. 2023, ~18 m; nearest DEM from the index)
"""
import math
from pathlib import Path

import eidolon.env  # noqa: F401
import numpy as np
import pandas as pd
import rasterio
from osgeo import gdal
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.vrt import WarpedVRT

ROOT = Path(__file__).resolve().parents[3]
CTX_INDEX = ROOT / "data" / "reference" / "ucla_ctx_dem_index.csv"
CTX_URL = ("https://asc-pds-individual-investigations.s3.us-west-2.amazonaws.com/"
           "mars_mro_hirise_explorationzones_day_2023/data/{stem}_tied-dem.tif")
R_MARS = 3396190.0
gdal.UseExceptions()


def _aeqd(lat, lon, radius=None):
    shape = f"+R={radius}" if radius else "+ellps=WGS84"
    return CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} {shape} +units=m +no_defs")


def _warp(src, lat, lon, px_m, size, dst_crs):
    half = px_m * size / 2
    tr = from_origin(-half, half, px_m, px_m)
    with WarpedVRT(src, crs=dst_crs, transform=tr, width=size, height=size,
                   resampling=Resampling.average, src_nodata=src.nodata, nodata=np.nan, dtype="float32") as vrt:
        z = vrt.read(1).astype(np.float32)
    if src.nodata is not None:
        z[z == src.nodata] = np.nan
    return z


def _glo30_url(la, lo):
    ns, ew = ("N" if la >= 0 else "S"), ("E" if lo >= 0 else "W")
    n = f"Copernicus_DSM_COG_10_{ns}{abs(la):02d}_00_{ew}{abs(lo):03d}_00_DEM"
    return f"/vsicurl/https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif"


def earth_window(lat, lon, px_m=60.0, size=94):
    """GLO-30 heights (m) in a size x size window of px_m pixels centred on (lat, lon), or None."""
    pad_lat = px_m * size / 111320 + 0.01
    pad_lon = pad_lat / max(math.cos(math.radians(lat)), 0.05)
    tiles = sorted({(math.floor(a), math.floor(b))
                    for a in (lat - pad_lat, lat + pad_lat) for b in (lon - pad_lon, lon + pad_lon)})
    srcs = [_glo30_url(a, b) for a, b in tiles]
    import threading
    vrt_path = f"/vsimem/earth_{lat:.5f}_{lon:.5f}_{threading.get_ident()}.vrt"
    try:
        vrt = gdal.BuildVRT(vrt_path, srcs)
        if vrt is None:
            return None
        vrt = None
        with rasterio.open(vrt_path) as src:
            z = _warp(src, lat, lon, px_m, size, _aeqd(lat, lon))
    except Exception:
        return None
    finally:
        try:
            gdal.Unlink(vrt_path)        # may not exist if BuildVRT failed (e.g. ocean tiles)
        except RuntimeError:
            pass
    return z if np.isfinite(z).mean() >= 0.6 else None


_ctx = None


def ctx_dem_for(lat, lon, max_km=60.0):
    """Stem of the CTX DEM whose centre is nearest (lat, lon) on Mars, or None if > max_km away."""
    global _ctx
    if _ctx is None:
        _ctx = pd.read_csv(CTX_INDEX)
    a, b = np.radians(lat), np.radians(lon)
    c, d = np.radians(_ctx.lat.values), np.radians(_ctx.lon.values)
    h = np.sin((c - a) / 2) ** 2 + np.cos(a) * np.cos(c) * np.sin((d - b) / 2) ** 2
    dist = 2 * R_MARS / 1000 * np.arcsin(np.sqrt(h))
    i = int(np.argmin(dist))
    return (_ctx.stem[i], float(dist[i])) if dist[i] <= max_km else (None, float(dist[i]))


def mars_window(lat, lon, px_m=60.0, size=94):
    """CTX DEM heights (m) around (lat, lon) on Mars (lon east, -180..180), or None if not covered."""
    stem, _ = ctx_dem_for(lat, lon)
    if stem is None:
        return None
    try:
        with rasterio.open("/vsicurl/" + CTX_URL.format(stem=stem)) as src:
            z = _warp(src, lat, lon, px_m, size, _aeqd(lat, lon, radius=R_MARS))
    except Exception:
        return None
    return z if np.isfinite(z).mean() >= 0.6 else None


# Moon: SLDEM2015 (LOLA + Kaguya TC merge), 512 ppd (~59 m), 60S-60N; streamed (22 GB file, windowed reads).
SLDEM_URL = "/vsicurl/https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/LolaKaguya_Topo/Lunar_LRO_LOLAKaguya_DEMmerge_60N60S_512ppd.tif"
R_MOON = 1737400.0


def moon_window(lat, lon, px_m=60.0, size=94):
    """SLDEM2015 heights (m) around (lat, lon) on the Moon (lon east, -180..180), or None outside +-60 deg."""
    if abs(lat) > 59.5:
        return None
    try:
        with rasterio.open(SLDEM_URL) as src:
            z = _warp(src, lat, lon, px_m, size, _aeqd(lat, lon, radius=R_MOON))
            z = z * (src.scales[0] or 1.0)
    except Exception:
        return None
    return z if np.isfinite(z).mean() >= 0.6 else None


# Mars global: MOLA-HRSC blended DEM v2 (~200 m), streamed (11 GB uncompressed BigTIFF; strip range reads).
BLEND_URL = "/vsicurl/https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif"


def mars_blend_window(lat, lon, px_m=200.0, size=94):
    """MOLA-HRSC blend heights (m) around (lat, lon) on Mars (lon east, -180..180); global coverage."""
    try:
        with rasterio.open(BLEND_URL) as src:
            z = _warp(src, lat, lon, px_m, size, _aeqd(lat, lon, radius=R_MARS))
    except Exception:
        return None
    return z if np.isfinite(z).mean() >= 0.6 else None
