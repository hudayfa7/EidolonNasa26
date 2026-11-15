"""E016-cnn form encoder (inference only): amplitude/scale/texture-invariant landform-shape embedding.

The weights are 4 BYOL seeds trained in experiments/E016_form_fingerprint (files e016_cnn_s{0..3}.pt). The target
embedding is the normalised sum over seeds of the normalised mean over 4 rot90 views, exactly as in the index build.
The view code below is the eval path (train=False) of experiments/E016_form_fingerprint/kaggle_main.py.
"""
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

from eidolon.models.ssl import SSLModel, dem_to_channels, detrend_plane

CROP, WIDTH, PX_M = 64, 64, 200.0


def amp_norm(z):
    """Remove the best-fit plane and scale every patch to std 50 m (amplitude is not part of the form code)."""
    r = detrend_plane(z)
    return r / (r.flatten(1).std(1)[:, None, None] + 1e-3) * 50.0


def center_view(z):
    """Deterministic centre resample of a (B, H, W) window to CROP x CROP (zoom_view with train=False)."""
    B, H, _ = z.shape
    half = torch.full((B,), CROP / H)
    zero = torch.zeros(B)
    one = torch.ones(B)
    theta = torch.stack([torch.stack([half * one, -half * zero, zero], 1), torch.stack([half * zero, half * one, zero], 1)], 1)
    grid = F.affine_grid(theta, (B, 1, CROP, CROP), align_corners=False)
    return F.grid_sample(z[:, None], grid, mode="bilinear", padding_mode="border", align_corners=False)[:, 0]


def view(z, px=PX_M):
    return dem_to_channels(amp_norm(center_view(z)), px, None)


class FormEncoder:
    def __init__(self, weights_dir):
        self.models = []
        for s in range(4):
            m = SSLModel("byol", width=WIDTH, adversary=False)
            m.load_state_dict(torch.load(Path(weights_dir) / f"e016_cnn_s{s}.pt", map_location="cpu"))
            self.models.append(m.eval())

    def __call__(self, z, px=PX_M):
        """z: (94, 94) elevation window in metres at 200 m px (NaN filled with the mean) -> unit embedding."""
        zt = torch.from_numpy(np.nan_to_num(z, nan=float(np.nanmean(z))).astype(np.float32))[None]
        emb = 0
        with torch.no_grad():
            for m in self.models:
                acc = 0
                for k in range(4):
                    acc = acc + F.normalize(m.backbone(view(torch.rot90(zt, k, dims=(1, 2)), px)), dim=1)
                emb = emb + F.normalize(acc, dim=1)[0].numpy()
        return emb / np.linalg.norm(emb)
