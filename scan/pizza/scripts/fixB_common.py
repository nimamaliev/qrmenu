"""Shared loading for fixB: levelled pizza mesh (scan faces kept by segmentation), welded topology helpers."""
import sys, numpy as np
S = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/"
P = S + "plate/"; FB = P + "fixB/"
sys.path.insert(0, S + "scripts")
from plate_model import top_mm, PAR, section, revolve

def load_pizza():
    d = np.load(P + "faces.npz"); V, UV, F = d["V"], d["UV"], d["F"]
    T = np.load(P + "level_T.npy"); keep = np.load(P + "pizza_faces.npy")
    Vl = V @ T[:3, :3].T + T[:3, 3]
    Fk = F[keep]; used, inv = np.unique(Fk, return_inverse=True)
    Vp = Vl[used]; UVp = UV[used]; Fp = inv.reshape(-1, 3)
    rv = np.hypot(Vp[:, 0], Vp[:, 2]); lim = (PAR['R'] - 0.4) * 1e-3; o = rv > lim
    Vp[o, 0] *= lim / rv[o]; Vp[o, 2] *= lim / rv[o]
    return Vp, UVp, Fp

def weld(V, tol=2e-6):
    _, wid = np.unique(np.round(V / tol).astype(np.int64), axis=0, return_inverse=True)
    return wid.ravel()

def plate_y(x, z):
    r = np.hypot(x, z) * 1e3
    return top_mm(np.minimum(r, PAR["R"])) * 1e-3

def face_normals(V, F):
    t = V[F]; n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]); a = np.linalg.norm(n, axis=1)
    return n / np.maximum(a, 1e-30)[:, None], a / 2
