import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Curtain-face detection: steep / downward / UV-stretched faces reachable from the boundary."""
import numpy as np, scipy.sparse as sp
from fixB_common import *

def face_adjacency(Fw, nw):
    """Edge-adjacent face pairs over welded vertices."""
    m = len(Fw)
    E = np.r_[Fw[:, [0, 1]], Fw[:, [1, 2]], Fw[:, [2, 0]]]; fid = np.tile(np.arange(m), 3)
    key = np.minimum(E[:, 0], E[:, 1]) * nw + np.maximum(E[:, 0], E[:, 1])
    o = np.argsort(key, kind="stable"); ks = key[o]; fs = fid[o]
    same = ks[1:] == ks[:-1]
    a = fs[:-1][same]; b = fs[1:][same]
    A = sp.coo_matrix((np.ones(len(a)), (a, b)), shape=(m, m)).tocsr(); A = A + A.T
    cnt = np.bincount(np.r_[np.unique(key, return_counts=True)[1]], minlength=4)
    return A, key

def uv_stretch(V, UV, F, tex_px=8192):
    """Per-face singular values (texels per mm) of the 3D->UV map: (smax, smin)."""
    t = V[F] * 1e3; u = UV[F] * tex_px
    e1 = t[:, 1] - t[:, 0]; e2 = t[:, 2] - t[:, 0]
    n = np.cross(e1, e2); A2 = np.linalg.norm(n, axis=1); A2 = np.maximum(A2, 1e-12)
    # local 2D frame
    x = e1 / np.maximum(np.linalg.norm(e1, axis=1, keepdims=True), 1e-12); yv = np.cross(n / A2[:, None], x)
    P = np.stack([np.c_[np.zeros(len(F)), np.zeros(len(F))], np.c_[np.einsum('ij,ij->i', e1, x), np.einsum('ij,ij->i', e1, yv)],
                  np.c_[np.einsum('ij,ij->i', e2, x), np.einsum('ij,ij->i', e2, yv)]], 1)  # m,3,2
    dP = np.stack([P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]], 2)  # m,2,2 columns = edges
    dU = np.stack([u[:, 1] - u[:, 0], u[:, 2] - u[:, 0]], 2)
    det = dP[:, 0, 0] * dP[:, 1, 1] - dP[:, 0, 1] * dP[:, 1, 0]
    inv = np.stack([np.stack([dP[:, 1, 1], -dP[:, 0, 1]], 1), np.stack([-dP[:, 1, 0], dP[:, 0, 0]], 1)], 1) / np.where(np.abs(det) < 1e-12, 1e-12, det)[:, None, None]
    J = dU @ inv  # m,2,2 texels per mm
    s = np.linalg.svd(J, compute_uv=False)
    return s[:, 0], s[:, 1]

if __name__ == "__main__":
    from PIL import Image
    Vp, UVp, Fp = load_pizza()
    wid = weld(Vp); nw = wid.max() + 1; Fw = wid[Fp]
    fn, fa = face_normals(Vp, Fp)
    smax, smin = uv_stretch(Vp, UVp, Fp)
    print("texels/mm smax p5/50/95", np.percentile(smax, [5, 50, 95]).round(2), " smin", np.percentile(smin, [1, 5, 50, 95]).round(2))
    an = smin / np.maximum(smax, 1e-9)
    print("anisotropy smin/smax p1/5/50", np.percentile(an, [1, 5, 50]).round(3))
    c = Vp[Fp].mean(1); cx, cz = np.average(c[:, 0], weights=fa), np.average(c[:, 2], weights=fa); print("pizza centroid mm", cx * 1e3, cz * 1e3)
    rad = np.c_[c[:, 0] - cx, c[:, 2] - cz]; rad /= np.linalg.norm(rad, axis=1, keepdims=True)
    nout = fn[:, 0] * rad[:, 0] + fn[:, 2] * rad[:, 1]
    r = np.hypot(c[:, 0] - cx, c[:, 2] - cz) * 1e3
    gap = (c[:, 1] - plate_y(c[:, 0], c[:, 2])) * 1e3
    for name, m in [("stretched an<0.25", an < 0.25), ("smin<1.0", smin < 1.0), ("steep ny<0.5", fn[:, 1] < 0.5)]:
        print(name, m.sum(), "r p5/50/95", np.percentile(r[m], [5, 50, 95]).round(1))
    np.savez(FB + "curtain_feats.npz", smax=smax, smin=smin, ny=fn[:, 1], nout=nout, r=r, gap=gap, cx=cx, cz=cz)
    # map
    H = np.load(FB + "top_raster.npz"); FI = H["FI"]; N = FI.shape[0]
    img = np.full((N, N, 3), 255, np.uint8); m = FI >= 0; f = FI[m]
    col = np.zeros((len(f), 3)); col[:] = 200
    col[an[f] < 0.3] = [0, 0, 255]; col[fn[f, 1] < 0.5] = [255, 0, 0]; col[(fn[f, 1] < 0.5) & (an[f] < 0.3)] = [255, 0, 255]
    img[m] = col
    Image.fromarray(img).resize((N // 2, N // 2), Image.NEAREST).save(FB + "an_curtain.png")
