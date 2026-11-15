"""Synthetic landforms on real backgrounds (SYN1): physically parameterised height fields for 8 landform types,
inserted into real (unlabelled, held-out-region) DEM windows of any body.

Purpose: ground-truth benchmarks and cross-body positive pairs ("same landform type, different body / size /
amplitude / rotation / erosion"). Synthetic data only ever TRAINS or SCREENS models; claims stay on real data.
All lengths in km, heights in m; grid = n x n pixels at px_km.
"""
import numpy as np
from scipy.ndimage import gaussian_filter

TYPES = ("crater", "cone", "channel", "graben", "dunes", "ridge", "mesa", "yardangs")


def _grid(n, px_km, rot, rng):
    c = (n - 1) / 2
    yy, xx = (np.mgrid[:n, :n] - c) * px_km
    ox, oy = rng.uniform(-0.15, 0.15, 2) * n * px_km                  # landform not always centred
    xx, yy = xx - ox, yy - oy
    cr, sr = np.cos(rot), np.sin(rot)
    return xx * cr + yy * sr, -xx * sr + yy * cr                       # rotated coordinates (u along, v across)


WIN_KM = 18.8          # 94 px x 200 m
MIN_KM = 0.6           # >= 3 px at 200 m (resolvability rule)


def crater(u, v, rng, size, amp):
    D = float(np.clip(size * rng.uniform(2, 12), 2 * MIN_KM, 0.7 * WIN_KM))
    r = np.hypot(u, v) / (D / 2)
    depth = 0.2 * D * 1000 * amp                                       # simple-crater d/D ~ 0.2 (Pike 1977, lunar)
    bowl = np.where(r < 1, depth * (r ** 2 - 1), 0.0)
    rim = 0.04 * D * 1000 * amp * np.where(r < 1, r ** 4, np.exp(-(r - 1) * 3.5))   # raised rim, ejecta decay
    return bowl + rim


def cone(u, v, rng, size, amp):
    Rb = float(np.clip(size * rng.uniform(1, 7.5), MIN_KM, 0.4 * WIN_KM))
    slope = np.radians(rng.choice([rng.uniform(25, 32), rng.uniform(4, 10)]))      # scoria cone vs shield
    rt = rng.uniform(0.12, 0.3)                                        # summit (crater rim) radius / base radius
    H = Rb * (1 - rt) * 1000 * np.tan(slope) * amp
    r = np.hypot(u, v) / Rb
    body = H * np.clip((1 - r) / (1 - rt), 0, 1)                       # truncated cone
    pit = np.where(r < rt, -0.5 * H * rt * (1 - (r / rt) ** 2), 0.0)  # summit crater
    return body + pit


def channel(u, v, rng, size, amp):
    w = max(MIN_KM, size * rng.uniform(0.6, 3.0))
    lam, a = rng.uniform(4, 12) * w, rng.uniform(0.3, 1.5) * w
    centre = a * np.sin(2 * np.pi * u / lam + rng.uniform(0, 6.3))
    d = np.abs(v - centre) / (w / 2)
    depth = w * 1000 * rng.uniform(0.05, 0.15) * amp
    prof = np.where(d < 1, -(1 - d ** 2) if rng.random() < 0.5 else -(1 - d), 0.0)  # U or V
    return depth * prof


def graben(u, v, rng, size, amp):
    w = max(MIN_KM * 1.5, size * rng.uniform(1, 4))
    depth = w * 1000 * rng.uniform(0.05, 0.12) * amp
    edge = w * 0.08
    return -depth * (1 / (1 + np.exp((np.abs(v) - w / 2) / edge)))


def dunes(u, v, rng, size, amp):
    lam = max(MIN_KM * 1.5, size * rng.uniform(0.6, 3.0))
    h = lam * 1000 * rng.uniform(0.02, 0.06) * amp
    phase = 2 * np.pi * u / lam + 0.6 * np.sin(2 * np.pi * v / (lam * rng.uniform(3, 8)))
    s = np.sin(phase)
    return h * np.where(s > 0, np.abs(s) ** 0.7, -np.abs(s) ** 1.6)    # asymmetric stoss/lee


def ridge(u, v, rng, size, amp):
    w = max(MIN_KM, size * rng.uniform(0.6, 2.5))
    lam, a = rng.uniform(5, 15) * w, rng.uniform(0.2, 1.0) * w
    centre = a * np.sin(2 * np.pi * u / lam)
    d = (v - centre) / (w / 2)
    return w * 1000 * rng.uniform(0.04, 0.12) * amp * np.exp(-d ** 2)


def mesa(u, v, rng, size, amp):
    R = float(np.clip(size * rng.uniform(1.5, 6), MIN_KM * 2, 0.35 * WIN_KM))
    ang = np.arctan2(v, u)
    rr = R * (1 + 0.25 * np.sin(3 * ang + rng.uniform(0, 6.3)) + 0.1 * np.sin(7 * ang))
    H = R * 1000 * rng.uniform(0.03, 0.1) * amp
    return H / (1 + np.exp((np.hypot(u, v) - rr) / (0.06 * R)))


def yardangs(u, v, rng, size, amp):
    sp = max(MIN_KM * 1.5, size * rng.uniform(0.6, 2.0))
    L = sp * rng.uniform(3, 8)
    k = np.round(v / sp)
    off = (k * 1.618 % 1.0) * L
    uu = ((u + off) % L) / L
    vv = (v - k * sp) / (sp * 0.35)
    shape = np.clip(1 - vv ** 2, 0, None) * np.clip(np.sin(np.pi * uu) ** 0.5 * (1 - uu) ** 0.3, 0, None)
    return sp * 1000 * rng.uniform(0.03, 0.08) * amp * shape


GEN = dict(zip(TYPES, (crater, cone, channel, graben, dunes, ridge, mesa, yardangs)))


def synth_window(kind, background, rng, px_km=0.2, size=None, amp=None, erosion=None, bg_weight=None):
    """Insert one landform of `kind` into a real background window (n x n, metres). Returns (z, params)."""
    n = background.shape[0]
    size = size if size is not None else float(2 ** rng.uniform(-1, 1))        # x0.5 - x2
    amp = amp if amp is not None else float(2 ** rng.uniform(-1.5, 1.5))       # +-1.5 octaves
    rot = rng.uniform(0, 2 * np.pi)
    u, v = _grid(n, px_km, rot, rng)
    h = GEN[kind](u, v, rng, size, amp)
    erosion = erosion if erosion is not None else float(rng.uniform(0, 1.5))
    if erosion > 0:
        h = gaussian_filter(h, erosion)                                   # degradation (pixels)
    bg = np.nan_to_num(background - np.nanmean(background))
    bgw = bg_weight if bg_weight is not None else float(rng.uniform(0.2, 0.7))
    return (h + bgw * bg).astype(np.float32), {"kind": kind, "size": size, "amp": amp, "rot": rot, "erosion": erosion, "bg_weight": bgw}


# ============================================================ SYN2: more realistic synthetic scenes
def caldera(u, v, rng, size, amp):
    """Shield with a summit collapse caldera (steep inward walls, flat floor)."""
    Rb = float(np.clip(size * rng.uniform(3, 9), 2 * MIN_KM, 0.45 * WIN_KM))
    H = Rb * 1000 * np.tan(np.radians(rng.uniform(4, 9))) * amp
    r = np.hypot(u, v) / Rb
    shield = H * np.clip(1 - r, 0, 1) ** 1.3
    rc = rng.uniform(0.2, 0.4)
    depth = H * rng.uniform(0.15, 0.35)
    pit = -depth / (1 + np.exp((r - rc) / 0.02))
    return shield + pit


def fan(u, v, rng, size, amp):
    """Alluvial fan: conical sector spreading from an apex, radial slope + faint radial channels."""
    L = float(np.clip(size * rng.uniform(3, 9), 2 * MIN_KM, 0.6 * WIN_KM))
    ang = np.arctan2(v, u + L / 2)
    r = np.hypot(u + L / 2, v) / L
    half = np.radians(rng.uniform(25, 60))
    sector = np.clip(1 - np.abs(ang) / half, 0, 1) ** 0.5
    H = L * 1000 * np.tan(np.radians(rng.uniform(1.5, 5))) * amp
    rad = 0.04 * H * np.sin(ang * rng.uniform(15, 40)) * (r < 1)
    return (H * np.clip(1 - r, 0, 1) + rad) * sector


def flow_lobe(u, v, rng, size, amp):
    """Lobate lava/debris flow: elongated tongue with steep margins and a rounded front."""
    L = float(np.clip(size * rng.uniform(4, 12), 3 * MIN_KM, 0.8 * WIN_KM))
    W = L * rng.uniform(0.15, 0.4)
    t = np.clip((u + L / 2) / L, 0, 1.05)
    width = W * (0.6 + 0.4 * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.5)
    inside = (np.abs(v) < width / 2) & (u > -L / 2) & (u < L / 2)
    front = np.hypot(np.clip(u - L / 2, 0, None), v) < width / 2
    H = W * 1000 * rng.uniform(0.01, 0.04) * amp
    m = (inside | front).astype(float)
    return H * gaussian_filter(m, 1.0) * (1 + 0.15 * np.sin(u / (W * 0.15)))     # pressure ridges


def landslide(u, v, rng, size, amp):
    """Amphitheatre headscarp + hummocky runout lobe below it."""
    R = float(np.clip(size * rng.uniform(1.5, 5), 2 * MIN_KM, 0.35 * WIN_KM))
    H = R * 1000 * rng.uniform(0.08, 0.2) * amp
    r = np.hypot(u, v)
    scarp = -H / (1 + np.exp(-(R - r) / (0.05 * R))) / (1 + np.exp((u - 0.3 * R) / (0.08 * R)))   # smooth open side
    lobe_d = np.hypot((u - 1.2 * R) / 1.4, v)
    lobe = 0.4 * H * np.exp(-(lobe_d / R) ** 2) * (1 + 0.3 * np.sin(u / (0.12 * R)) * np.sin(v / (0.12 * R)))
    return scarp + lobe


GEN.update({"caldera": caldera, "fan": fan, "flow_lobe": flow_lobe, "landslide": landslide})
TYPES2 = TYPES + ("caldera", "fan", "flow_lobe", "landslide")
BODY_SIZE = {"earth": (1.0, 1.0), "mars": (1.0, 3.0), "moon": (1.0, 3.0)}   # size multiplier range vs Earth (same type)


def _fractal(n, rng, beta=2.2):
    k = np.hypot(*np.meshgrid(np.fft.fftfreq(n), np.fft.fftfreq(n)))
    k[0, 0] = 1
    f = np.real(np.fft.ifft2(np.fft.fft2(rng.normal(size=(n, n))) / k ** (beta / 2)))
    return f / (f.std() + 1e-9)


def synth_window_v2(kind, background, rng, body="earth", px_km=0.2):
    """Realistic scene: primary landform `kind` (label) + 0-2 smaller secondary landforms of other types, off-centre /
    truncated placement, body-dependent size, diffusion degradation, landform-confined incised texture, real background."""
    n = background.shape[0]
    lo, hi = BODY_SIZE[body]
    size = float(2 ** rng.uniform(-1, 1)) * float(rng.uniform(lo, hi))
    amp = float(2 ** rng.uniform(-1.5, 1.5))
    u, v = _grid(n, px_km, rng.uniform(0, 2 * np.pi), rng)
    shift = rng.uniform(-0.4, 0.4, 2) * n * px_km
    h = GEN[kind](u - shift[0], v - shift[1], rng, size, amp)
    for _ in range(int(rng.integers(0, 3))):                            # secondary landforms (distractors)
        k2 = rng.choice([t for t in TYPES2 if t != kind])
        u2, v2 = _grid(n, px_km, rng.uniform(0, 2 * np.pi), rng)
        s2 = rng.uniform(-0.45, 0.45, 2) * n * px_km
        h = h + 0.4 * GEN[k2](u2 - s2[0], v2 - s2[1], rng, size * rng.uniform(0.3, 0.7), amp * rng.uniform(0.2, 0.6))
    deg = float(rng.uniform(0, 2.5))
    if deg > 0:
        h = gaussian_filter(h, deg)
    mask = gaussian_filter((np.abs(h) > 0.2 * (np.abs(h).max() + 1e-9)).astype(float), 2)
    h = h + mask * _fractal(n, rng) * float(rng.uniform(0, 0.04)) * (np.abs(h).max() + 1e-9)
    bg = np.nan_to_num(background - np.nanmean(background))
    bgw = float(rng.uniform(0.3, 1.0))
    return (h + bgw * bg).astype(np.float32), {"kind": kind, "size": size, "amp": amp, "deg": deg, "bg_weight": bgw, "body": body}
