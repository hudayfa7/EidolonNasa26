"""Sun-elevation geometry for the polar-lighting analog (P6), latitude-only baseline (no terrain horizon).

Same spherical-astronomy formula on both bodies:
    sin(elev) = sin(lat) sin(dec) + cos(lat) cos(dec) cos(hour_angle)
Earth: solar declination from day of year (Cooper/Spencer approximation, ~0.5 deg accurate); the hour angle
       cycles over 24 h. Moon: the subsolar latitude oscillates within +-1.54 deg (lunar spin axis vs the
       ecliptic) over the ~346.6-day draconic/eclipse year; the hour angle cycles over the 29.53-day synodic month.
Geometry only: Earth's atmosphere scatters light into shadows, so these analogs suit camera/geometry tests,
not photometric fidelity (see docs/user_needs.md).
"""
import numpy as np

MOON_OBLIQUITY_DEG = 1.54
MOON_SYNODIC_DAYS = 29.530589
MOON_ECLIPSE_YEAR_DAYS = 346.62


def earth_declination_deg(day_of_year):
    """Solar declination (deg), Spencer (1971) Fourier series."""
    g = 2 * np.pi * (np.asarray(day_of_year, dtype=float) - 1) / 365.0
    dec = (0.006918 - 0.399912 * np.cos(g) + 0.070257 * np.sin(g) - 0.006758 * np.cos(2 * g)
           + 0.000907 * np.sin(2 * g) - 0.002697 * np.cos(3 * g) + 0.00148 * np.sin(3 * g))
    return np.degrees(dec)


def elevation_deg(lat_deg, dec_deg, hour_angle_deg):
    lat, dec, h = map(np.radians, (lat_deg, dec_deg, hour_angle_deg))
    s = np.sin(lat) * np.sin(dec) + np.cos(lat) * np.cos(dec) * np.cos(h)
    return np.degrees(np.arcsin(np.clip(s, -1, 1)))


def earth_elevations(lat_deg, month, samples_per_day=96):
    """All sun elevations (deg) through a calendar month at a latitude, sampled every 15 min."""
    starts = np.cumsum([0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
    days = np.arange(starts[month - 1] + 1, starts[month] + 1)
    t = np.arange(samples_per_day) / samples_per_day
    dec = earth_declination_deg(days)[:, None]
    ha = 360.0 * (t[None, :] - 0.5)                                # local solar time; 0 at noon
    return elevation_deg(lat_deg, dec, ha).ravel()


def moon_elevations(lat_deg, n=200_000, seed=0):
    """Sun elevations (deg) at a lunar latitude over a full eclipse year (random uniform sampling in time)."""
    rng = np.random.default_rng(seed)
    t = rng.uniform(0, MOON_ECLIPSE_YEAR_DAYS, n)
    dec = MOON_OBLIQUITY_DEG * np.sin(2 * np.pi * t / MOON_ECLIPSE_YEAR_DAYS)
    ha = 360.0 * ((t / MOON_SYNODIC_DAYS) % 1.0) - 180.0
    return elevation_deg(lat_deg, dec, ha)


def lighting_stats(elev):
    """Summary used for matching: sunlit fraction, and the distribution of elevation while the Sun is up."""
    up = elev[elev > 0]
    q = np.quantile(up, np.linspace(0.05, 0.95, 19)) if up.size else np.full(19, np.nan)
    return {"sunlit_frac": float((elev > 0).mean()), "elev_q": q,
            "median_up": float(np.median(up)) if up.size else np.nan,
            "frac_up_below_5deg": float((up < 5).mean()) if up.size else np.nan}


def lighting_distance(a, b):
    """W1 between elevation-while-up quantile vectors, plus the sunlit-fraction difference (in 10-deg units)."""
    if not (np.isfinite(a["elev_q"]).all() and np.isfinite(b["elev_q"]).all()):
        return np.inf
    return float(np.abs(a["elev_q"] - b["elev_q"]).mean() + 10 * abs(a["sunlit_frac"] - b["sunlit_frac"]))
