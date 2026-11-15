"""Per-cell property distributions as quantile vectors, and 1-D Wasserstein distances between them.

For two 1-D distributions with quantile functions Fa^-1, Fb^-1:
    W1(a, b) = integral_0^1 |Fa^-1(u) - Fb^-1(u)| du
which we approximate on a fixed grid of quantile levels: mean |qa - qb|. Storing each
cell's property as a quantile vector makes pairwise W1 an L1 distance, so it batches.
"""
import numpy as np
import torch

# Quantile levels: midpoints of 20 equal-probability bins (no extremes, which are noisy)
LEVELS = np.linspace(0.025, 0.975, 20)


def quantiles(values: np.ndarray, min_count: int = 8) -> np.ndarray:
    """Quantile vector of the finite values, or NaNs if there are too few."""
    v = values[np.isfinite(values)]
    if v.size < min_count:
        return np.full(LEVELS.size, np.nan, dtype=np.float32)
    return np.quantile(v, LEVELS).astype(np.float32)


def pairwise_w1(qa: np.ndarray, qb: np.ndarray, chunk: int = 20000) -> np.ndarray:
    """W1 between every row of qa (N x Q) and every row of qb (M x Q). Returns N x M float32."""
    b = torch.from_numpy(np.ascontiguousarray(qb, dtype=np.float32))
    out = np.empty((qa.shape[0], qb.shape[0]), dtype=np.float32)
    for i in range(0, qa.shape[0], chunk):
        a = torch.from_numpy(np.ascontiguousarray(qa[i:i + chunk], dtype=np.float32))
        out[i:i + chunk] = (torch.cdist(a, b, p=1) / qa.shape[1]).numpy()
    return out


def body_similarity(q_earth: np.ndarray, q_ref: np.ndarray, top_frac: float = 0.05) -> np.ndarray:
    """Body-level match of each Earth cell to a reference sample of target terrain.

    Score = -(mean of the smallest top_frac of W1 distances to the reference cells): a cell that
    closely matches *some* target terrain scores high, and no single reference cell dominates.
    Rows with NaNs get NaN.
    """
    ok_ref = np.isfinite(q_ref).all(1)
    ref = q_ref[ok_ref]
    k = max(1, int(round(top_frac * ref.shape[0])))
    score = np.full(q_earth.shape[0], np.nan, dtype=np.float32)
    ok = np.isfinite(q_earth).all(1)
    idx = np.flatnonzero(ok)
    for i in range(0, idx.size, 20000):
        sel = idx[i:i + 20000]
        d = pairwise_w1(q_earth[sel], ref)
        part = np.partition(d, k - 1, axis=1)[:, :k]
        score[sel] = -part.mean(1)
    return score
