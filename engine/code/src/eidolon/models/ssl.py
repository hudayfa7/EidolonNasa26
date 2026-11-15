"""Cross-body self-supervised terrain embedding (P4 / T3): backbone, augmentations, objectives.

All objectives share the same backbone, augmentations and budget so the E002 pilot compares
objectives, not plumbing. An optional gradient-reversal body classifier pushes the embedding to
be uninformative about which body (Earth/Mars/Moon) a patch came from.
Runs on CPU (pilot) and CUDA (Colab) unchanged.
"""
import copy
import math

import torch
import torch.nn as nn
import torch.nn.functional as F

CHANNELS = ("slope", "curvature", "tpi", "roughness", "hillshade", "elev_std")


# ----------------------------------------------------------------------------- input channels
_PLANE = {}


def detrend_plane(z: torch.Tensor) -> torch.Tensor:
    """Remove the least-squares plane from each (B, H, W) patch. The design matrix is fixed per grid size, so the
    fit is one precomputed pseudo-inverse matmul (identical to lstsq; fast and supported on GPU/TPU/AMP)."""
    B, H, W = z.shape
    key = (H, W, str(z.device))
    if key not in _PLANE:
        yy, xx = torch.meshgrid(torch.linspace(-1, 1, H, dtype=torch.float64), torch.linspace(-1, 1, W, dtype=torch.float64),
                                indexing="ij")
        A = torch.stack([xx.flatten(), yy.flatten(), torch.ones(H * W, dtype=torch.float64)], 1)   # (HW, 3)
        _PLANE[key] = (A.float().to(z.device), torch.linalg.pinv(A).float().to(z.device))         # (HW,3), (3,HW)
    A, Ap = _PLANE[key]
    zf = z.reshape(B, H * W).float()
    return (zf - (zf @ Ap.T) @ A.T).reshape(B, H, W).to(z.dtype)


def dem_to_channels(z: torch.Tensor, px_m: float, sun_az: torch.Tensor | None = None) -> torch.Tensor:
    """z: (B, H, W) heights in metres -> (B, 6, H, W) body-agnostic channels.
    Absolute elevation is excluded (it identifies the body); elevation is detrended and standardised per patch."""
    B, H, W = z.shape
    zp = F.pad(z[:, None], (1, 1, 1, 1), mode="replicate")
    gx = (zp[..., 1:-1, 2:] - zp[..., 1:-1, :-2]) / (2 * px_m)
    gy = (zp[..., 2:, 1:-1] - zp[..., :-2, 1:-1]) / (2 * px_m)
    slope = torch.atan(torch.sqrt(gx ** 2 + gy ** 2))                      # radians
    lap = (zp[..., 1:-1, 2:] + zp[..., 1:-1, :-2] + zp[..., 2:, 1:-1] + zp[..., :-2, 1:-1] - 4 * z[:, None]) / px_m ** 2
    mean5 = F.avg_pool2d(F.pad(z[:, None], (2, 2, 2, 2), mode="replicate"), 5, stride=1)
    tpi = z[:, None] - mean5
    rough = torch.sqrt(F.avg_pool2d(F.pad(tpi ** 2, (1, 1, 1, 1), mode="replicate"), 3, stride=1) + 1e-6)
    if sun_az is None:
        sun_az = torch.full((B,), math.radians(315.0), device=z.device)
    aspect = torch.atan2(-gx, gy)
    alt = math.radians(45.0)
    hs = math.sin(alt) * torch.cos(slope) + math.cos(alt) * torch.sin(slope) * torch.cos(sun_az[:, None, None, None] - aspect)
    # detrend (plane fit) and standardise elevation per patch
    resid = detrend_plane(z)
    elev = resid / (resid.flatten(1).std(1)[:, None, None] + 1.0)                              # +1 m avoids blow-up on flats
    ch = torch.cat([
        torch.rad2deg(slope) / 10.0,
        torch.clamp(lap * 1e4, -5, 5),
        torch.clamp(tpi / 20.0, -5, 5),
        torch.log1p(rough) / 3.0,
        hs.clamp(0, 1),
        elev[:, None].clamp(-4, 4),
    ], 1)
    return ch


# ----------------------------------------------------------------------------- augmentations
def augment(z: torch.Tensor, px_m: float, body: torch.Tensor) -> torch.Tensor:
    """Random view of a batch of DEM patches -> channels. Geometry: rot90/flips. Sensor: random
    resolution degradation, small-amplitude noise, MOLA-like along-track striping (any body, so it
    can't be used to tell bodies apart). Illumination: random sun azimuth for the hillshade channel."""
    B = z.shape[0]
    k = int(torch.randint(0, 4, (1,)))
    z = torch.rot90(z, k, dims=(1, 2))
    if torch.rand(1) < 0.5:
        z = torch.flip(z, dims=(2,))
    # resolution degradation (blur by down/up-sampling) on a random half of the batch
    deg = torch.rand(B, device=z.device) < 0.5
    if deg.any():
        f = int(torch.randint(2, 4, (1,)))
        low = F.avg_pool2d(z[deg][:, None], f)
        z = z.clone()
        z[deg] = F.interpolate(low, size=z.shape[-2:], mode="bilinear", align_corners=False)[:, 0]
    rel = z.flatten(1).std(1)[:, None, None] + 1.0
    z = z + torch.randn_like(z) * 0.02 * rel
    stripe = (torch.rand(B, device=z.device) < 0.2)[:, None, None]
    z = z + stripe * torch.randn(B, 1, z.shape[2], device=z.device) * 0.05 * rel
    sun = torch.rand(B, device=z.device) * 2 * math.pi
    return dem_to_channels(z, px_m, sun)


# ----------------------------------------------------------------------------- backbone
def _block(cin, cout, stride):
    return nn.Sequential(nn.Conv2d(cin, cout, 3, stride, 1, bias=False), nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
                         nn.Conv2d(cout, cout, 3, 1, 1, bias=False), nn.BatchNorm2d(cout), nn.ReLU(inplace=True))


class Backbone(nn.Module):
    """Small CNN (~0.4 M params at width=32) -> embedding of size 4*width."""

    def __init__(self, cin=len(CHANNELS), width=32):
        super().__init__()
        self.net = nn.Sequential(_block(cin, width, 1), _block(width, 2 * width, 2), _block(2 * width, 4 * width, 2),
                                 _block(4 * width, 4 * width, 2), nn.AdaptiveAvgPool2d(1), nn.Flatten())
        self.dim = 4 * width

    def forward(self, x):
        return self.net(x)


def mlp(din, dh, dout, last_bn=False):
    layers = [nn.Linear(din, dh), nn.BatchNorm1d(dh), nn.ReLU(inplace=True), nn.Linear(dh, dout)]
    if last_bn:
        layers.append(nn.BatchNorm1d(dout, affine=False))
    return nn.Sequential(*layers)


# ----------------------------------------------------------------------------- gradient reversal
class _GradReverse(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, lam):
        ctx.lam = lam
        return x.view_as(x)

    @staticmethod
    def backward(ctx, g):
        return -ctx.lam * g, None


def grad_reverse(x, lam=1.0):
    return _GradReverse.apply(x, lam)


# ----------------------------------------------------------------------------- objectives
def vicreg_loss(a, b, sim=25.0, var=25.0, cov=1.0):
    inv = F.mse_loss(a, b)
    def _var(x):
        std = torch.sqrt(x.var(0) + 1e-4)
        return F.relu(1 - std).mean()
    def _cov(x):
        x = x - x.mean(0)
        c = (x.T @ x) / (x.shape[0] - 1)
        off = c - torch.diag(torch.diag(c))
        return (off ** 2).sum() / x.shape[1]
    return sim * inv + var * (_var(a) + _var(b)) + cov * (_cov(a) + _cov(b))


def nt_xent(a, b, tau=0.2):
    z = F.normalize(torch.cat([a, b]), dim=1)
    s = z @ z.T / tau
    n = a.shape[0]
    s.fill_diagonal_(-1e9)
    target = torch.cat([torch.arange(n, 2 * n), torch.arange(0, n)]).to(a.device)
    return F.cross_entropy(s, target)


def byol_loss(p, z):
    return 2 - 2 * F.cosine_similarity(p, z.detach(), dim=-1).mean()


class SSLModel(nn.Module):
    def __init__(self, objective: str, width=32, proj=256, adversary=False, n_bodies=3, adv_lambda=0.3):
        super().__init__()
        assert objective in ("vicreg", "simclr", "byol")
        self.objective, self.adversary, self.adv_lambda = objective, adversary, adv_lambda
        self.backbone = Backbone(width=width)
        d = self.backbone.dim
        self.projector = mlp(d, 512, proj, last_bn=objective == "vicreg")
        if objective == "byol":
            self.predictor = mlp(proj, 512, proj)
            self.target_backbone = copy.deepcopy(self.backbone)
            self.target_projector = copy.deepcopy(self.projector)
            for p in list(self.target_backbone.parameters()) + list(self.target_projector.parameters()):
                p.requires_grad = False
        if adversary:
            self.body_head = nn.Sequential(nn.Linear(d, 128), nn.ReLU(), nn.Linear(128, n_bodies))

    @torch.no_grad()
    def update_target(self, m=0.99):
        if self.objective != "byol":
            return
        for o, t in ((self.backbone, self.target_backbone), (self.projector, self.target_projector)):
            for po, pt in zip(o.parameters(), t.parameters()):
                pt.mul_(m).add_((1 - m) * po)

    def embed(self, x):
        return self.backbone(x)

    def loss(self, x1, x2, body):
        h1, h2 = self.backbone(x1), self.backbone(x2)
        z1, z2 = self.projector(h1), self.projector(h2)
        if self.objective == "vicreg":
            l_ssl = vicreg_loss(z1, z2)
        elif self.objective == "simclr":
            l_ssl = nt_xent(z1, z2)
        else:
            with torch.no_grad():
                t1 = self.target_projector(self.target_backbone(x1))
                t2 = self.target_projector(self.target_backbone(x2))
            l_ssl = byol_loss(self.predictor(z1), t2) + byol_loss(self.predictor(z2), t1)
        l_adv = torch.zeros((), device=x1.device)
        if self.adversary:
            logits = self.body_head(grad_reverse(torch.cat([h1, h2]), self.adv_lambda))
            l_adv = F.cross_entropy(logits, torch.cat([body, body]))
        return l_ssl + l_adv, float(l_ssl.detach()), float(l_adv.detach())
