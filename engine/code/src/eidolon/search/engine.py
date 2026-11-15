"""Earth analog search over the global F2s fingerprint index; emits contract-valid `match_result` objects.

  from eidolon.search import Index
  idx = Index()                       # data locations: EIDOLON_INDEX_DIR, EIDOLON_GRID_DIR, EIDOLON_WEIGHTS_DIR
  res = idx.search(target_window, target_id="Nirgal_Vallis", sovereigns=["United Kingdom"], k=10)

Scoring is identical to the evaluated F2s: rank(form cosine) + hand_v1 rank-mean - amplitude (sigma 1 oct, x2)
- sign (sigma 1.232) - scale (sigma 1.5 oct); ranks are taken within the candidate set AFTER filtering.
QA (seam > 25 or water > 0.15) -> excluded from ranking. Spatial NMS 20 km; host crowding for global searches.
Moved from experiments/INDEX/query.py (2026-10-07); outputs verified identical (tests/test_search_engine.py).
"""
import glob
import json
import os
from pathlib import Path

import numpy as np

from eidolon.search.encoder import FormEncoder
from eidolon.search.fingerprint import fingerprint

ROOT = Path(__file__).resolve().parents[3]
RESOLVABILITY = ROOT / "data/landform_resolvability.csv"
CAPABILITY = ROOT / "data/landform_capability_v2.csv"        # production (F2s + judge) capability from fresh blind tests
CROWD_DEFAULT = (2, 200.0)
# Field purposes need exposed bare ground, so they search the barren index only. Terrain-form purposes also search the
# rugged non-barren extension (likely vegetated; flagged per result). Override with search(..., surface="any"|"barren").
BARREN_PURPOSES = {"rover_mobility", "drill_isru", "eva_training", "habitat_ops", "astrobiology", "thermal"}
USE_RERANK = False                        # RR1 shortlist re-ranker: off until the fresh blind confirmation passes
RERANK = json.load(open(Path(__file__).with_name("rerank_rr1.json")))
USE_CR = False                            # CR1 ring term: off until the blind MT1 confirmation passes
MASK_CACHE = int(os.environ.get("EIDOLON_MASK_CACHE", "2"))   # FAST1 per-filter array caches kept in RAM
EXT0 = 10_000_000                         # first extension-grid cell id (experiments/INDEX/ext_grid.py)
MATCHER = "F2s-200m-v1.1"   # v1.1: index embeddings from float32 windows (v1.0 fp16 bug)
PROPS = ("slope_b1", "slope_b3", "curvature", "relief", "rough_scaling")
SEAM_MAX, WATER_MAX = 25.0, 0.15
GM_NAMES = ("flat", "peak", "ridge", "shoulder", "spur", "slope", "hollow", "footslope", "valley", "pit")


def _num(v, nd):
    v = float(v)
    return None if not np.isfinite(v) else round(v, nd)


def _rr(x):
    return x.argsort().argsort() / max(len(x) - 1, 1)


def _hav(la, lo, LA, LO):
    la, lo, LA, LO = map(np.radians, (la, lo, LA, LO))
    return 2 * 6371 * np.arcsin(np.sqrt(np.minimum(1, np.sin((LA - la) / 2) ** 2 + np.cos(la) * np.cos(LA) * np.sin((LO - lo) / 2) ** 2)))


class Index:
    def __init__(self, idir=None, grid_dir=None, weights_dir=None, verbose=True):
        idir = Path(idir or os.environ.get("EIDOLON_INDEX_DIR", ROOT / "data/interim/index"))
        grid_dir = Path(grid_dir or os.environ.get("EIDOLON_GRID_DIR", ROOT / "data/interim/e001"))
        self.weights_dir = Path(weights_dir or os.environ.get("EIDOLON_WEIGHTS_DIR", ROOT / "data/interim/e016/cnn"))
        self._encoder = None
        self.idir = idir
        sj = idir / "scale.json"                         # multi-scale index: pixel size of this index level (default 200 m)
        self.px = float(json.load(open(sj))["px"]) if sj.exists() else 200.0
        parts = {}
        for f in sorted(glob.glob(str(idir / "index_*.npz"))):
            name = Path(f).stem[len("index_"):]
            d = dict(np.load(f))
            if "emb" not in d:
                ef = idir / f"emb_{name}.npz"
                if not ef.exists():
                    continue
                e = dict(np.load(ef))
                pos = {c: i for i, c in enumerate(e["cell"])}
                keep = np.array([c in pos for c in d["cell"]])
                d = {k: v[keep] for k, v in d.items()}
                d["emb"] = e["emb"][[pos[c] for c in d["cell"]]]
            parts[name] = d
        keys = list(next(iter(parts.values())).keys())
        self.d = {k: np.concatenate([p[k] for p in parts.values()]) for k in keys}
        self.chunks = sorted(parts)
        g = dict(np.load(grid_dir / "earth_grid.npz"))
        cc = dict(np.load(grid_dir / "cell_country.npz"))
        c = self.d["cell"]
        if (c >= EXT0).any():                     # extension cells (ext_grid.py: rugged land outside the barren grid)
            x = dict(np.load(idir / "ext_grid.npz"))
            ext = c >= EXT0
            e = c[ext] - EXT0
            b = np.where(ext, 0, c)
            self.lat = np.where(ext, 0, g["lat"][b]).astype(np.float32)
            self.lon = np.where(ext, 0, g["lon"][b]).astype(np.float32)
            self.lat[ext], self.lon[ext] = x["lat"][e], x["lon"][e]
            self.country, self.sovereign, self.access = (np.where(ext, "", cc[k][b]).astype("<U36") for k in ("admin", "sovereign", "access"))
            self.country[ext], self.sovereign[ext], self.access[ext] = x["admin"][e], x["sovereign"][e], x["access"][e]
        else:
            self.lat, self.lon = g["lat"][c].astype(np.float32), g["lon"][c].astype(np.float32)
            self.country, self.sovereign, self.access = cc["admin"][c], cc["sovereign"][c], cc["access"][c]
        self.is_ext = c >= EXT0
        self.emb = self.d["emb"].astype(np.float32)
        self.qa_ok = (self.d["seam"] <= SEAM_MAX) & (self.d["water"] <= WATER_MAX)
        self.attrs = None                                # per-site environment (scripts/build_site_attrs.py), if present
        af = idir / "site_attrs.npz"
        if af.exists():
            a = dict(np.load(af))
            pa = {int(x): i for i, x in enumerate(a["cell"])}
            if all(int(cc) in pa for cc in c):
                ix = np.array([pa[int(cc)] for cc in c])
                self.attrs = {k: a[k][ix] for k in ("elevation_m", "t_mean_c", "precip_mm", "aridity")}
        self.cr = None                                   # crater/dome ring features (CR1), if computed for every site
        crf = sorted(glob.glob(str(idir / "cr_*.npz")))
        if crf:
            cr = {}
            for f in crf:
                e = dict(np.load(f))
                cr.update(zip(e["cell"].tolist(), e["cr"]))
            if all(int(cc) in cr for cc in c):
                self.cr = np.stack([cr[int(cc)] for cc in c]).astype(np.float32)
                self.cr_scale = self.cr[self.qa_ok].std(0) + 1e-6
        if verbose:
            print(f"index: {len(c)} sites from chunks {self.chunks}")

    def target_fingerprint(self, z):
        if self._encoder is None:                                      # load the 4 encoder seeds once per process
            self._encoder = FormEncoder(self.weights_dir)
        return fingerprint(z, self._encoder, self.px)

    def mask(self, sovereigns=None, bbox=None, access=None, exclude_polar=False, surface="any"):
        m = self.qa_ok.copy()
        if surface == "barren":
            m &= ~self.is_ext
        if sovereigns:
            m &= np.isin(self.sovereign, sovereigns)
        if access:
            m &= np.isin(self.access, access)
        if bbox:
            lo0, la0, lo1, la1 = bbox
            m &= (self.lon >= lo0) & (self.lon <= lo1) & (self.lat >= la0) & (self.lat <= la1)
        if exclude_polar:
            m &= np.abs(self.lat) <= 60
        return m

    @staticmethod
    def resolvable(target_type):
        """True/False from data/landform_resolvability.csv; None if the type is unknown or not given."""
        if not target_type:
            return None
        import csv
        for r in csv.DictReader(open(RESOLVABILITY, encoding="utf-8")):
            if r["landform_type"] == target_type:
                return r["resolvable_200m"] == "yes"
        return None

    @staticmethod
    def capability(body, target_type):
        """Fresh-blind-test row for (body, landform type), e.g. ('moon', 'crater') or ('mars', 'fossa (graben)');
        IAU descriptor terms map to classes via the aliases column (scripts/build_capability_v2.py). None if unknown."""
        if not body or not target_type or not CAPABILITY.exists():
            return None
        import csv
        t = str(target_type).lower().split(" (")[0].strip()
        for r in csv.DictReader(open(CAPABILITY, encoding="utf-8")):
            if r["body"] == body and (t == r["landform_type"] or t in r["aliases"].split()):
                return r
        return None

    def _select(self, order, idx, k_short, nms_km, crowd):
        """Greedy spatial NMS + host crowding over candidates in score order."""
        keep = []
        kla, klo, kcos = (np.empty(k_short) for _ in range(3))           # kept sites in radians (same maths as _hav)
        lat, lon = self.lat, self.lon
        for o in order:
            n = len(keep)
            if n >= k_short:
                break
            la, lo = np.radians(float(lat[idx[o]])), np.radians(float(lon[idx[o]]))
            if n:
                h = np.sin((kla[:n] - la) / 2) ** 2 + np.cos(la) * kcos[:n] * np.sin((klo[:n] - lo) / 2) ** 2
                dk = 2 * 6371 * np.arcsin(np.sqrt(np.minimum(1, h)))
                if dk.min() < nms_km or (crowd and (dk < crowd[1]).sum() >= crowd[0]):
                    continue
            kla[n], klo[n], kcos[n] = la, lo, np.cos(la)
            keep.append(o)
        return keep

    def _fast_score(self, t, idx, use_cr=False):
        """FAST1: the full F2s score in torch float32 on cached, mask-contiguous arrays (multithreaded). Same formula as the
        exact path; ranks via _rank_fn (exact in the upper tail). Returns numpy arrays aligned with idx."""
        import torch
        if not hasattr(self, "_Tc"):
            self._Tc = {}                                 # per-mask caches, at most MASK_CACHE kept (LRU)
        key = (len(idx), int(idx[0]), int(idx[-1]), int(idx[len(idx) // 2]))   # cheap identity of the mask
        if key not in self._Tc:                           # one-off per mask: contiguous float32 subsets (~0.45 GB)
            sub = lambda a: torch.from_numpy(np.ascontiguousarray(np.asarray(a)[idx], dtype=np.float32))  # noqa: E731
            if len(self._Tc) >= MASK_CACHE:
                self._Tc.pop(next(iter(self._Tc)))
            self._Tc[key] = {"key": key, "emb": sub(self.emb), "P": [sub(self.d[f"p_{p}"]) for p in PROPS],
                             "amp": sub(self.d["amp"]), "sign": sub(self.d["sign"]), "scale": sub(self.d["scale"]),
                             "cr": None if self.cr is None else sub(self.cr), "rank": self._rank_fn(len(idx))}
        self._Tc[key] = self._Tc.pop(key)                 # mark most recently used
        self._T = T = self._Tc[key]
        rr = T["rank"]
        f32 = lambda v: torch.as_tensor(np.asarray(v, dtype=np.float32))  # noqa: E731
        with torch.no_grad():
            form = torch.mv(T["emb"], f32(t["emb"]))
            hand = {}
            for P, p in zip(T["P"], PROPS):
                d = torch.cdist(P, f32(t["props"][p])[None], p=1)[:, 0] / 20.0
                hand[p] = rr(-torch.nan_to_num(d, nan=float("inf")))
            da, ds, dc = float(t["amp"]) - T["amp"], float(t["sign"]) - T["sign"], float(t["scale"]) - T["scale"]
            rform = rr(form)
            score = rform + sum(hand.values()) / len(PROPS) - 2 * da ** 2 / 2 * 0.25                 - ds ** 2 / (2 * 1.232 ** 2) * 0.25 - dc ** 2 / (2 * 1.5 ** 2) * 0.25
            if use_cr and T["cr"] is not None:
                score = score - 0.25 * (((f32(t["cr"])[None] - T["cr"]) / f32(self.cr_scale)) ** 2).mean(1) / 2
        n = lambda x: x.numpy()  # noqa: E731
        return n(form), {p: n(v) for p, v in hand.items()}, n(rform), n(score), n(da), n(ds), n(dc)

    def _rank_fn(self, n, m=16384, q=1025, top=512):
        """Fast stand-in for _rr on a torch float32 vector (rank fraction in [0, 1], ascending; -inf ranks lowest).
        Piecewise-linear interpolation over knots = quantiles of a fixed random sample of m entries plus the EXACT top
        `top` order statistics, so ranks are exact where results come from (the upper tail), ~1/q-accurate in the body."""
        import torch
        rng = np.random.default_rng(0)
        s = torch.from_numpy(rng.choice(n, min(m, n), replace=False) if n > m else np.arange(n))
        grid = torch.linspace(0.0, 1.0, q)

        def rr(xt):
            N = len(xt)
            fin = torch.isfinite(xt)
            nf = int(fin.sum())
            xs = xt[s]
            xs = xs[torch.isfinite(xs)]
            if nf < 2 or len(xs) < 2:
                return torch.from_numpy(_rr(xt.numpy()).astype(np.float32))
            ss = torch.sort(xs).values
            kv = ss[(grid * (len(ss) - 1)).round().long()]
            kr = (N - nf) / (N - 1) + grid * (nf - 1) / (N - 1)
            kt = min(top, nf)
            thr = ss[max(0, int(len(ss) * (1 - 3.0 * kt / nf)) - 1)]
            cand = xt[xt >= thr]
            if len(cand) < kt:
                cand = xt[fin]
            tv = torch.topk(cand, kt).values.flip(0) if len(cand) > 4 * kt else torch.sort(cand).values[-kt:]
            tr = (N - kt + torch.arange(kt, dtype=torch.float32)) / (N - 1)
            keep = kv < tv[0]
            kv = torch.cat([kv[keep], tv]); kr = torch.cat([kr[keep], tr])
            i = torch.bucketize(xt, kv).clamp_(1, len(kv) - 1)
            v0, v1, r0, r1 = kv[i - 1], kv[i], kr[i - 1], kr[i]
            out = torch.minimum(r0 + (xt - v0).clamp_(min=0) / (v1 - v0).clamp_(min=1e-12) * (r1 - r0), r1)
            out = torch.where(xt >= kv[-1], kr[-1], out)
            return torch.where(fin, out, torch.zeros(()))
        return rr

    def search(self, z, target_id, purpose="rover_mobility", k=10, nms_km=20.0, target_type=None, crowd=None, use_cr=USE_CR,
               body=None, rerank=USE_RERANK, fingerprint=None, fast=True, **filters):
        """crowd = (max_sites, radius_km): Google-style host crowding, at most max_sites results within radius_km of each
        other (a presentation rule; scores are unchanged). Default: (2, 200) for global searches, off when a sovereign or
        bbox filter already restricts the area (see experiments/INDEX/README.md, hubness).
        fingerprint: precomputed target fingerprint (target store) instead of computing it from z.
        fast=True: multithreaded scoring with quantile-interpolated ranks and partial selection (FAST1); fast=False is the
        exact reference implementation."""
        if crowd is None:
            crowd = None if (filters.get("sovereigns") or filters.get("bbox")) else CROWD_DEFAULT
        t = fingerprint if fingerprint is not None else self.target_fingerprint(z)
        if filters.get("surface") is None:
            filters["surface"] = "barren" if purpose in BARREN_PURPOSES else "any"
        idx = np.flatnonzero(self.mask(**filters))
        if not len(idx):
            return []
        if fast:
            form, hand, rform, score, da, ds, dc = self._fast_score(t, idx, use_cr)
        else:
            form = self.emb[idx] @ t["emb"]
            hand = {}
            for p in PROPS:
                d = np.abs(self.d[f"p_{p}"][idx].astype(np.float32) - t["props"][p][None]).mean(1)
                hand[p] = _rr(-np.where(np.isfinite(d), d, np.inf))
            da = t["amp"] - self.d["amp"][idx]
            ds = t["sign"] - self.d["sign"][idx]
            dc = t["scale"] - self.d["scale"][idx]
            rform = _rr(form)
            score = rform + np.mean([hand[p] for p in PROPS], axis=0) - 2 * da ** 2 / 2 * 0.25                 - ds ** 2 / (2 * 1.232 ** 2) * 0.25 - dc ** 2 / (2 * 1.5 ** 2) * 0.25
            if use_cr and self.cr is not None:            # CR1 crater/dome ring term (experiments/CR1_craterness)
                score = score - 0.25 * (((t["cr"][None] - self.cr[idx]) / self.cr_scale) ** 2).mean(1) / 2
        hand_mean = np.mean([hand[p] for p in PROPS], axis=0)
        k_short = max(k, RERANK["shortlist_k"]) if rerank else k
        M = 4000 + 100 * k_short
        if fast and len(score) > 4 * M:                   # partial selection of the best M; full sort only if exhausted
            top = np.argpartition(-score, M)[:M]
            order = top[np.argsort(-score[top])]
        else:
            order = np.argsort(-score)
        keep = self._select(order, idx, k_short, nms_km, crowd)
        if len(keep) < k_short and len(order) < len(score):             # partial selection exhausted: exact full sort
            keep = self._select(np.argsort(-score), idx, k_short, nms_km, crowd)
        def disp(x):                                     # display-only rank, evaluated at the kept rows only (exact)
            v = np.full(len(score), np.nan)
            if keep:
                x = np.asarray(x, dtype=np.float32)
                v[keep] = np.count_nonzero(x[None, :] < x[keep][:, None], axis=1) / max(len(x) - 1, 1)
            return v
        def disp_close(key, delta):                      # exact rank of -|t - a_j| via two binary searches on sorted a
            if not (fast and keep):
                return disp(-np.abs(delta))
            srt = self._T.setdefault(f"sorted_{key}", np.sort(np.asarray(self.d[key])[idx].astype(np.float64)))
            v = np.full(len(score), np.nan)
            d = np.abs(delta[keep]).astype(np.float64) * (1 + 1e-6) + 1e-9      # include the site itself (float32 rounding)
            c = float(t[key])
            within = np.searchsorted(srt, c + d, side="right") - np.searchsorted(srt, c - d, side="left")
            v[keep] = np.clip((len(srt) - within) / max(len(srt) - 1, 1), 0.0, 1.0)
            return v
        pct = disp(score)
        comp = {"terrain_form": rform, "relief": disp_close("amp", da), "slope": (hand["slope_b1"] + hand["slope_b3"]) / 2,
                "roughness": hand["rough_scaling"], "landform_polarity": disp_close("sign", ds), "landform_scale": disp_close("scale", dc)}
        if rerank and keep:                              # RR1: reorder the F2s shortlist (experiments/RR1_rerank)
            short = keep[:RERANK["shortlist_k"]]
            F = []
            for r, o in enumerate(short):
                j = idx[o]
                F.append({"shape_cosine": float(form[o]), "abs_relief": abs(float(da[o])), "abs_polarity": abs(float(ds[o])),
                          "abs_scale": abs(float(dc[o])), "terrain_pct": float(hand_mean[o]), "ranking_score": float(score[o]),
                          "rank": r + 1, "gm_l1": float(np.abs(self.d["gm"][j].astype(np.float32) - t["gm"]).sum()),
                          "cr_dist": float(np.sqrt((((t["cr"] - self.cr[j]) / self.cr_scale) ** 2).mean())) if self.cr is not None else 0.0,
                          "is_ext": float(self.is_ext[j])})
            Xr = (np.array([[f[n] for n in RERANK["features"]] for f in F]) - np.array(RERANK["mean"])) / np.array(RERANK["scale"])
            pr = Xr @ np.array(RERANK["coef"]) + RERANK["intercept"]
            keep = [short[i] for i in np.argsort(-pr, kind="stable")] + keep[len(short):]
        keep = keep[:k]
        res_ok = self.resolvable(target_type)
        zf = None if z is None else np.nan_to_num(np.asarray(z, dtype=np.float64), nan=float(np.nanmean(z)))
        flat = zf is not None and (float(zf.std()) < 15.0 or float((np.abs(np.diff(zf, axis=1)) < 1e-6).mean()) > 0.3)
        flat_note = (["The target window is nearly flat at 200 m (relief sd < 15 m or quantised elevations), so its 'shape' is "
                      "mostly DEM noise. Check the target coordinates, or treat matches as texture-only."] if flat else [])
        cap = self.capability(body, target_type)
        cap_note = ([f"In blind tests on {cap['n_targets']} never-used {body} {cap['landform_type']} targets, the top 3 "
                     f"contained at least a partial analog for {float(cap['p_target_top3']):.0%} of targets "
                     f"({float(cap['p_partial_or_better']):.0%} of individual results; tier {cap['tier']}). Treat these as the "
                     f"best available terrain-form matches."] if cap and cap["tier"] in ("weak", "fair") else [])
        best_form = float(form[keep[0]]) if keep else 0.0
        out = []
        for r, o in enumerate(keep):
            j = idx[o]
            props = []
            for key, label in (("terrain_form", "Landform shape"), ("relief", "Relief"), ("slope", "Slope"), ("roughness", "Roughness"),
                               ("landform_polarity", "Raised vs incised"), ("landform_scale", "Landform size")):
                v = float(comp[key][o])
                status = "match" if v >= 0.9 else ("partial" if v >= 0.6 else "gap")
                if res_ok is False and key in ("terrain_form", "landform_scale", "landform_polarity"):
                    status = "not_measurable"                          # diagnostic feature narrower than ~3 px at 200 m
                props.append({"key": key, "label": label, "score": None if status == "not_measurable" else round(v, 3),
                              "percentile_earth": None if status == "not_measurable" else round(v, 3), "weight": 1.0,
                              "status": status, "baseline_m": 200.0})
            fc = float(form[o])
            shape_tier = "close" if fc >= 0.90 else ("partial" if fc >= 0.80 else "weak")
            tier = "high" if fc >= 0.90 else ("medium" if fc >= 0.80 else "low")
            if res_ok is False:
                tier = "low"                                           # sub-resolution target: low confidence regardless
            strengths = [p["label"].lower() for p in props if p["status"] == "match"]
            gaps = [p["label"].lower() for p in props if p["status"] == "gap"]
            gm_t, gm_c = t["gm"][10:], self.d["gm"][j][10:].astype(np.float32)          # 3 km scale composition
            top = np.argsort(-gm_c)[:2]
            ratio = 2 ** -float(da[o])
            out.append({
                "target_id": target_id, "purpose": purpose, "site_id": f"earth_cell_{int(self.d['cell'][j])}", "rank": r + 1,
                "fidelity": {"score": round(float(np.mean([p["score"] for p in props if p["score"] is not None])), 3), "percentile_earth": round(float(pct[o]), 4),
                             "matcher": MATCHER, "confidence": tier},
                "properties": props,
                "location": {"lat": round(float(self.lat[j]), 4), "lon": round(float(self.lon[j]), 4),
                             "elevation_m": None if self.attrs is None else _num(self.attrs["elevation_m"][j], 0),
                             "country": str(self.country[j]) or None, "sovereign": str(self.sovereign[j]) or None,
                             "access": str(self.access[j]) or None,
                             "surface": "rugged_extension" if self.is_ext[j] else "barren"},
                "raw": {"ranking_score": round(float(score[o]), 4), "shape_cosine": round(float(form[o]), 4),
                        "relief_ratio": round(2 ** -float(da[o]), 3), "relief_mismatch_oct": round(float(da[o]), 3),
                        "polarity_mismatch": round(float(ds[o]), 3), "scale_mismatch_oct": round(float(dc[o]), 3),
                        "terrain_properties_pct": round(float(hand_mean[o]), 4)},
                "environment": None if self.attrs is None else {
                    "t_mean_c": _num(self.attrs["t_mean_c"][j], 1), "precip_mm": _num(self.attrs["precip_mm"][j], 0),
                    "aridity_index": _num(self.attrs["aridity"][j], 4),
                    "source": "WorldClim 2.1 BIO1/BIO12 (5'), Global Aridity Index v3.1 (30''), ETOPO 2022 (60''); site centre point"},
                "explanation": {
                    "summary": ("No close analog in this region; best available. " if best_form < 0.80 else "")
                    + (f"{self.country[j]} ({self.lat[j]:.2f}, {self.lon[j]:.2f}): shape similarity {fc:.2f} ({shape_tier}); "
                                f"relief {ratio:.1f}x the target; landform mix at 3 km: {GM_NAMES[top[0]]} {gm_c[top[0]]:.0%}, "
                                f"{GM_NAMES[top[1]]} {gm_c[top[1]]:.0%} (target {GM_NAMES[top[0]]} {gm_t[top[0]]:.0%})."),
                    "strengths": strengths, "gaps": gaps,
                    "caveats": ["Copernicus GLO-30 is a surface model: in vegetated or built-up areas canopy/buildings add texture.",
                                "Terrain form only, matched at 200 m: features narrower than ~600 m are not resolvable."]
                    + ([f"Target landform type '{target_type}' is below 200 m resolvability: form-based properties are not measurable."]
                       if res_ok is False else [])
                    + (["Polar site (|lat| > 60): access is seasonal and ice may border the terrain."] if abs(float(self.lat[j])) > 60 else [])
                    + (["Rugged non-barren land (index extension): terrain form matches, but the site is likely vegetated, "
                        "so surface materials and environment differ from the target."] if self.is_ext[j] else [])
                    + cap_note + flat_note}})
        return out
