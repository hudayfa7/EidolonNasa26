"""SSL training loop shared by the local E002 run and the Kaggle GPU kernel (torch + numpy only)."""
import time
from pathlib import Path

import numpy as np
import torch

from eidolon.models.ssl import SSLModel, augment, dem_to_channels

CONFIGS = [(o, a) for o in ("vicreg", "simclr", "byol") for a in (False, True)]


def config_name(obj, adv, seed=0):
    """seed 0 is the pre-registered primary run; extra seeds get a suffix."""
    return f"{obj}{'_adv' if adv else ''}" + (f"_s{seed}" if seed else "")


def train_config(X, y, obj, adv, out_dir: Path, epochs=20, batch=256, width=32, lr=1e-3, px_m=463.0, seed=0, log=print,
                 crop=None, prefix=""):
    """Train one config on DEM patches X (N,P,P float32, metres) with body labels y; save embeddings + weights.
    crop: if set, each batch is trained on an independent random crop x crop of the patches (embeddings at
    the end use the full patches; the backbone is size-agnostic via global pooling)."""
    name = prefix + config_name(obj, adv, seed)
    out = Path(out_dir) / f"{name}.npz"
    if out.exists():
        return out
    X = np.asarray(X, dtype=np.float32)
    if not np.isfinite(X).all():
        raise ValueError(f"{name}: training patches contain non-finite values; filter them before training")
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    Xt, yt = torch.from_numpy(np.asarray(X, dtype=np.float32)), torch.from_numpy(np.asarray(y)).long()
    torch.manual_seed(seed)
    m = SSLModel(obj, width=width, adversary=adv).to(dev)
    opt = torch.optim.AdamW(m.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, epochs)
    t0, hist = time.time(), []
    for ep in range(epochs):
        m.train()
        perm = torch.randperm(len(Xt))
        tot = [0.0, 0.0]
        for i in range(0, len(Xt) - batch + 1, batch):
            idx = perm[i:i + batch]
            zb, yb = Xt[idx].to(dev), yt[idx].to(dev)
            if crop:
                i0 = int(torch.randint(0, zb.shape[1] - crop + 1, (1,)))
                j0 = int(torch.randint(0, zb.shape[2] - crop + 1, (1,)))
                zb = zb[:, i0:i0 + crop, j0:j0 + crop]
            loss, ls, la = m.loss(augment(zb, px_m, yb), augment(zb, px_m, yb), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
            m.update_target()
            tot[0] += ls
            tot[1] += la
        sched.step()
        hist.append(tot)
        if not np.isfinite(tot[0]):
            raise FloatingPointError(f"{name}: SSL loss became non-finite at epoch {ep + 1}; aborting")
        log(f"T: {name} [{dev}] ep {ep + 1}/{epochs} ssl {tot[0]:.2f} adv {tot[1]:.2f} ({time.time() - t0:.0f}s)")
    m.eval()
    with torch.no_grad():
        emb = torch.cat([m.embed(dem_to_channels(Xt[i:i + 512].to(dev), px_m)).cpu() for i in range(0, len(Xt), 512)])
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    np.savez_compressed(out, emb=emb.numpy(), hist=np.array(hist), seconds=time.time() - t0, device=dev)
    torch.save(m.state_dict(), Path(out_dir) / f"{name}.pt")
    return out
