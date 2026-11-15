"""Make GDAL plugin drivers (JP2, HDF4/5, netCDF) and their DLLs visible when the env's python is
run without `conda activate` (e.g. from scripts or IDE run buttons). Import before rasterio."""
import os
import sys
from pathlib import Path

_lib = Path(sys.prefix) / "Library"
if (_lib / "lib" / "gdalplugins").exists():
    os.environ.setdefault("GDAL_DRIVER_PATH", str(_lib / "lib" / "gdalplugins"))
    os.environ.setdefault("GDAL_DATA", str(_lib / "share" / "gdal"))
    os.environ.setdefault("PROJ_DATA", str(_lib / "share" / "proj"))
    if str(_lib / "bin") not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(_lib / "bin") + os.pathsep + os.environ.get("PATH", "")
os.environ.setdefault("GDAL_PAM_ENABLED", "NO")
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
os.environ.setdefault("GDAL_HTTP_MAX_RETRY", "4")
os.environ.setdefault("GDAL_HTTP_RETRY_DELAY", "2")
os.environ.setdefault("GDAL_HTTP_TIMEOUT", "60")          # no default timeout: one stalled read can block a pool forever
os.environ.setdefault("GDAL_HTTP_CONNECTTIMEOUT", "15")
os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS", ".tif,.TIF")
# The Mars/Moon global mosaics are uncompressed full-width strips (213-368 KB per row). Direct IO reads only the
# needed bytes of each strip with multi-range requests: 49 s -> 6 s (Mars), >180 s -> 9 s (Moon), identical values.
os.environ.setdefault("GTIFF_DIRECT_IO", "YES")
os.environ.setdefault("GDAL_HTTP_MULTIRANGE", "YES")
