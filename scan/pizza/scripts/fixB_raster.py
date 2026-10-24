"""Top-down orthographic z-buffer rasteriser (max-y wins) with per-vertex attribute interpolation."""
import numpy as np

def raster_top(V, F, attrs, px_mm=0.2, ext=0.135):
    """V (n,3) metres, F (m,3); attrs: (n,k) per-vertex (or (m,3,k) per-corner). Returns height img, face id img, attr img.
    Pixel (i,j) centre at x = -ext + (j+0.5)*px, z = -ext + (i+0.5)*px."""
    px = px_mm * 1e-3; N = int(round(2 * ext / px))
    H = np.full((N, N), -np.inf); FI = np.full((N, N), -1, np.int64)
    tri = V[F]  # m,3,3
    X = (tri[..., 0] + ext) / px - 0.5; Z = (tri[..., 2] + ext) / px - 0.5; Y = tri[..., 1]
    j0 = np.floor(X.min(1)).astype(int) + 1; j1 = np.floor(X.max(1)).astype(int)
    i0 = np.floor(Z.min(1)).astype(int) + 1; i1 = np.floor(Z.max(1)).astype(int)
    j0 = np.clip(j0, 0, N - 1); j1 = np.clip(j1, -1, N - 1); i0 = np.clip(i0, 0, N - 1); i1 = np.clip(i1, -1, N - 1)
    w = j1 - j0 + 1; h = i1 - i0 + 1; ok = (w > 0) & (h > 0)
    B = np.zeros((len(F), 3))
    sizes = np.maximum(w, h)
    for s in np.unique(sizes[ok]):
        idx = np.nonzero(ok & (sizes == s))[0]
        for start in range(0, len(idx), max(1, 2_000_000 // (s * s))):
            t = idx[start:start + max(1, 2_000_000 // (s * s))]
            dj, di = np.meshgrid(np.arange(s), np.arange(s)); dj = dj.ravel(); di = di.ravel()
            jj = j0[t, None] + dj[None]; ii = i0[t, None] + di[None]
            valid = (jj <= j1[t, None]) & (ii <= i1[t, None])
            x0, x1, x2 = X[t, 0, None], X[t, 1, None], X[t, 2, None]; z0, z1, z2 = Z[t, 0, None], Z[t, 1, None], Z[t, 2, None]
            den = (z1 - z2) * (x0 - x2) + (x2 - x1) * (z0 - z2)
            den = np.where(np.abs(den) < 1e-12, 1e-12, den)
            l0 = ((z1 - z2) * (jj - x2) + (x2 - x1) * (ii - z2)) / den
            l1 = ((z2 - z0) * (jj - x2) + (x0 - x2) * (ii - z2)) / den
            l2 = 1 - l0 - l1
            inside = valid & (l0 >= -1e-9) & (l1 >= -1e-9) & (l2 >= -1e-9)
            y = l0 * Y[t, 0, None] + l1 * Y[t, 1, None] + l2 * Y[t, 2, None]
            tt = np.broadcast_to(t[:, None], jj.shape)
            ii, jj, y, tt = ii[inside], jj[inside], y[inside], tt[inside]
            # z-buffer: process in order of y so max wins
            o = np.argsort(y); ii, jj, y, tt = ii[o], jj[o], y[o], tt[o]
            cur = H[ii, jj]; upd = y > cur
            # with duplicates, numpy assignment keeps last -> sorted ascending so the max is last
            H[ii[upd], jj[upd]] = y[upd]; FI[ii[upd], jj[upd]] = tt[upd]
    # attributes via barycentric at pixel centre of winning face
    m = FI >= 0; ii, jj = np.nonzero(m); t = FI[ii, jj]
    x0, x1, x2 = X[t, 0], X[t, 1], X[t, 2]; z0, z1, z2 = Z[t, 0], Z[t, 1], Z[t, 2]
    den = (z1 - z2) * (x0 - x2) + (x2 - x1) * (z0 - z2); den = np.where(np.abs(den) < 1e-12, 1e-12, den)
    l0 = ((z1 - z2) * (jj - x2) + (x2 - x1) * (ii - z2)) / den; l1 = ((z2 - z0) * (jj - x2) + (x0 - x2) * (ii - z2)) / den; l2 = 1 - l0 - l1
    out = []
    for a in attrs:
        a = np.asarray(a, float)
        if a.ndim == 2 and len(a) == len(V): ac = a[F]  # m,3,k
        else: ac = a
        img = np.full((N, N, ac.shape[-1]), np.nan)
        img[ii, jj] = l0[:, None] * ac[t, 0] + l1[:, None] * ac[t, 1] + l2[:, None] * ac[t, 2]
        out.append(img)
    return H, FI, out
