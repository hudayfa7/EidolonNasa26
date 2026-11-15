"""PAIR1 pair judge: reorders the F2s shortlist by P(reviewers grade the pair >= 2 'partial analog').

A Siamese ResNet18 trained on 1,978 blind-graded TARGET | CANDIDATE hillshade pairs (experiments/PAIR1_pair_judge).
Fresh blind confirmation on 40 never-used named targets: best-of-3 0.30 -> 0.55 (p = 0.006).
Pairs are rendered and cropped exactly as in training (matplotlib figure -> panel crop -> 96 x 96 grayscale).
"""
import io
import os
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
WEIGHTS = Path(os.environ.get("EIDOLON_JUDGE_WEIGHTS", ROOT / "data/interim/pair1/pair1_final.pt"))
SIZE = 96


def hillshade(z, px=200.0):
    z = np.nan_to_num(z, nan=float(np.nanmean(z)))
    gy, gx = np.gradient(z, px)
    s, a = np.arctan(np.hypot(gx, gy)), np.arctan2(-gx, gy)
    return np.clip(np.cos(np.radians(45)) * np.cos(s) + np.sin(np.radians(45)) * np.sin(s) * np.cos(np.radians(315) - a), 0, 1)


def render_panels(zt, zc, title="target"):
    """Render the 2-panel training figure in memory and crop both panels (identical to experiments/PAIR1_pair_judge/data.py)."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from PIL import Image
    fig, ax = plt.subplots(1, 2, figsize=(8.4, 4.4))
    for axx, zz, ttl in ((ax[0], zt, "TARGET"), (ax[1], zc, "CANDIDATE")):
        axx.imshow(hillshade(zz), cmap="gray")
        axx.set_title(f"{ttl}  (relief sd {np.nanstd(zz):.0f} m)", fontsize=10)
        axx.axis("off")
    fig.suptitle(f"item | {title}", fontsize=10)
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, dpi=65, format="png")
    plt.close(fig)
    buf.seek(0)
    g = np.asarray(Image.open(buf).convert("L"), dtype=np.float32)
    body = g[int(0.12 * g.shape[0]):]
    colmask = (body < 245).mean(0) > 0.5
    runs, start = [], None
    for x, v in enumerate(colmask):
        if v and start is None:
            start = x
        if not v and start is not None:
            runs.append((start, x)); start = None
    if start is not None:
        runs.append((start, len(colmask)))
    runs = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:2])
    if len(runs) < 2:
        return None
    out = []
    for x0, x1 in runs:
        col = g[:, x0:x1]
        ys = np.flatnonzero((col < 245).mean(1) > 0.5)
        crop = Image.fromarray(col[ys.min():ys.max() + 1].astype(np.uint8)).resize((SIZE, SIZE), Image.BILINEAR)
        out.append(np.asarray(crop, dtype=np.uint8))
    return np.stack(out)


class PairJudge:
    def __init__(self, weights=WEIGHTS):
        import torch
        import torch.nn as nn
        import torchvision
        self.torch = torch

        class PairNet(nn.Module):
            def __init__(self):
                super().__init__()
                r = torchvision.models.resnet18(weights=None)
                self.enc = nn.Sequential(*list(r.children())[:-1])
                self.head = nn.Sequential(nn.Linear(1024, 128), nn.ReLU(), nn.Dropout(0.3), nn.Linear(128, 1))

        self.net = PairNet()
        self.net.load_state_dict(torch.load(weights, map_location="cpu"))
        self.net.eval()
        self.mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
        self.std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)

    def _emb(self, x):
        x = x.float().div(255.0).unsqueeze(1).repeat(1, 3, 1, 1)
        return self.net.enc((x - self.mean) / self.std).flatten(1)

    def score_panels(self, P):
        """P: (N, 2, 96, 96) uint8 -> P(good), rotation-averaged as in training evaluation."""
        torch = self.torch
        X = torch.from_numpy(P)
        with torch.no_grad():
            p = 0
            for k in range(4):
                a = self._emb(torch.rot90(X[:, 0], k, dims=(1, 2)))
                b = self._emb(torch.rot90(X[:, 1], k, dims=(1, 2)))
                p = p + torch.sigmoid(self.net.head(torch.cat([(a - b).abs(), a * b], 1)).squeeze(1))
        return (p / 4).numpy()

    def score(self, zt, candidates, title="target"):
        """zt: target window; candidates: list of Earth windows (None allowed). Returns P(good) per candidate (nan if unusable)."""
        P, idx = [], []
        for i, zc in enumerate(candidates):
            if zc is None:
                continue
            pan = render_panels(zt, zc, title)
            if pan is not None:
                P.append(pan); idx.append(i)
        out = np.full(len(candidates), np.nan)
        if P:
            out[idx] = self.score_panels(np.stack(P))
        return out

    # ---------------------------------------------------------------- fast path: precomputed candidate embeddings
    def target_embeddings(self, zt):
        """Target panel embeddings at 4 rotations (the target crop is independent of the candidate)."""
        torch = self.torch
        tp = torch.from_numpy(render_panels(zt, zt)[0][None])
        with torch.no_grad():
            return torch.stack([self._emb(torch.rot90(tp, k, dims=(1, 2)))[0] for k in range(4)])     # (4, 512)

    def score_embeddings(self, T, C):
        """T: (4, 512) target; C: (N, 4, 512) candidates -> P(good), identical to score_panels."""
        torch = self.torch
        C = torch.from_numpy(np.asarray(C, dtype=np.float32))
        with torch.no_grad():
            p = 0
            for k in range(4):
                a, b = T[k].unsqueeze(0).expand(len(C), -1), C[:, k]
                p = p + torch.sigmoid(self.net.head(torch.cat([(a - b).abs(), a * b], 1)).squeeze(1))
        return (p / 4).numpy()


class CandidateStore:
    """Memory-mapped (N, 4, 512) float16 candidate embeddings + cell ids (scripts/build_judge_emb.py consolidate)."""

    def __init__(self, idir):
        idir = Path(idir)
        self.ok = (idir / "jemb_all.npy").exists()
        if self.ok:
            inram = os.environ.get("EIDOLON_JUDGE_INRAM", "1") == "1"      # 2 GB in RAM: ~1 ms lookups vs ~80 ms cold mmap
            self.E = np.load(idir / "jemb_all.npy", mmap_mode=None if inram else "r")
            cells = np.load(idir / "jemb_cells.npy")
            self.pos = {int(c): i for i, c in enumerate(cells)}

    def get(self, cells):
        idx = [self.pos.get(int(c)) for c in cells]
        return idx, [None if i is None else np.asarray(self.E[i], dtype=np.float32) for i in idx]
