import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Step 1-2: remove curtain faces (flood fill from the boundary), then re-cut the top surface along a smooth
footprint contour (signed-distance iso-line, marching triangles). Saves fixB/cut.npz."""
import numpy as np, scipy.sparse as sp, scipy.ndimage as ndi
from scipy.spatial import cKDTree
from fixB_common import *
from fixB_curtain import face_adjacency, uv_stretch
from fixB_raster import raster_top
from fixB_loops import boundary_loops

PX = 0.2e-3; EXT = 0.135
def to_px(x): return (x + EXT) / PX - 0.5

def curtain_mask(Vp, UVp, Fp, wid, nw, verbose=True, max_dist=15e-3):
    Fw = wid[Fp]
    fn, fa = face_normals(Vp, Fp)
    smax, smin = uv_stretch(Vp, UVp, Fp); an = smin / np.maximum(smax, 1e-9)
    c = Vp[Fp].mean(1)
    cx, cz = np.average(c[:, 0], weights=fa), np.average(c[:, 2], weights=fa)
    rad = np.c_[c[:, 0] - cx, c[:, 2] - cz]; rad /= np.linalg.norm(rad, axis=1, keepdims=True)
    nout = fn[:, 0] * rad[:, 0] + fn[:, 2] * rad[:, 1]
    # local top height: max-filter of the top-view height map
    H, FI, _ = raster_top(Vp, Fp, [], px_mm=PX * 1e3, ext=EXT)
    Hf = np.where(np.isfinite(H), H, -1.0)
    Hmax = ndi.maximum_filter(Hf, size=int(3e-3 / PX) * 2 + 1)
    ij = np.clip(np.round(to_px(c[:, [2, 0]])).astype(int), 0, H.shape[0] - 1)
    below = c[:, 1] < Hmax[ij[:, 0], ij[:, 1]] - 4e-3
    Vw = np.zeros((nw, 3)); Vw[wid] = Vp
    loops, Eb, _ = boundary_loops(Fw, nw)
    bp = Vw[np.concatenate(loops)]
    dist = cKDTree(bp[:, [0, 2]]).query(c[:, [0, 2]])[0]
    cand = ((fn[:, 1] < 0.5) & (nout > 0.15)) | (fn[:, 1] < 0.15) | ((an < 0.25) & (fn[:, 1] < 0.75)) | below
    cand &= dist < max_dist
    A, _ = face_adjacency(Fw, nw)
    # seeds: candidate faces touching the boundary
    bset = np.zeros(nw, bool); bset[np.concatenate(loops)] = True
    seed = cand & bset[Fw].any(1)
    rem = seed.copy(); frontier = seed.copy()
    while frontier.any():
        nb = (A @ frontier.astype(np.float64)) > 0
        new = nb & cand & ~rem
        rem |= new; frontier = new
    if verbose:
        print("curtain candidates %d, seeds %d, removed %d faces (%.1f cm2), of which 'below' %d" % (cand.sum(), seed.sum(), rem.sum(), fa[rem].sum() * 1e4, (rem & below).sum()))
    return rem, (cx, cz)

def largest_component(F, wid, nw):
    Fw = wid[F]; A, _ = face_adjacency(Fw, nw)
    nc, lab = sp.csgraph.connected_components(A, directed=False)
    big = np.argmax(np.bincount(lab)); return lab == big

def footprint_sdf(V, F, blur_mm=1.2, open_mm=1.0, erode_mm=0.4):
    H, FI, _ = raster_top(V, F, [], px_mm=PX * 1e3, ext=EXT)
    m = FI >= 0
    m = ndi.binary_closing(m, iterations=3)
    m = ndi.binary_fill_holes(m)
    r = int(round(open_mm * 1e-3 / PX)); yy, xx = np.mgrid[-r:r + 1, -r:r + 1]; disk = xx ** 2 + yy ** 2 <= r * r
    m = ndi.binary_opening(m, structure=disk)
    lab, n = ndi.label(m); m = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    g = ndi.gaussian_filter(m.astype(np.float32), blur_mm * 1e-3 / PX)
    m2 = g > 0.5
    lab, n = ndi.label(m2); m2 = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    m2 = ndi.binary_fill_holes(m2)
    din = ndi.distance_transform_edt(m2) * PX; dout = ndi.distance_transform_edt(~m2) * PX
    sdf = np.where(m2, din - 0.5 * PX, -(dout - 0.5 * PX)) - erode_mm * 1e-3
    sdf = ndi.gaussian_filter(sdf, 1.0)
    return sdf, m2

def sample(img, x, z):
    """bilinear sample of a top-view image at world x,z."""
    j = to_px(x); i = to_px(z); N = img.shape[0]
    j0 = np.clip(np.floor(j).astype(int), 0, N - 2); i0 = np.clip(np.floor(i).astype(int), 0, N - 2)
    fj = np.clip(j - j0, 0, 1); fi = np.clip(i - i0, 0, 1)
    return (img[i0, j0] * (1 - fi) * (1 - fj) + img[i0, j0 + 1] * (1 - fi) * fj + img[i0 + 1, j0] * fi * (1 - fj) + img[i0 + 1, j0 + 1] * fi * fj)

def cut_mesh(V, UV, F, s):
    """Keep the part with s>=0 (s per vertex). Marching-triangles split; new vertices keyed per (unwelded) edge.
    Returns V2, UV2, F2, is_new (bool per vertex)."""
    inside = s >= 0
    cnt = inside[F].sum(1)
    keepF = F[cnt == 3]
    mixed = F[(cnt > 0) & (cnt < 3)]
    newV = []; newUV = []; emap = {}
    base = len(V)
    def ev(a, b):
        k = (a, b) if a < b else (b, a)
        if k in emap: return emap[k]
        t = s[a] / (s[a] - s[b])
        newV.append(V[a] + t * (V[b] - V[a])); newUV.append(UV[a] + t * (UV[b] - UV[a]))
        emap[k] = base + len(newV) - 1; return emap[k]
    out = []
    for f in mixed:
        ins = inside[f]
        # rotate so pattern is canonical
        if ins.sum() == 1:
            k = int(np.argmax(ins)); a, b, c = f[k], f[(k + 1) % 3], f[(k + 2) % 3]
            out.append([a, ev(a, b), ev(a, c)])
        else:
            k = int(np.argmin(ins)); c, a, b = f[k], f[(k + 1) % 3], f[(k + 2) % 3]  # c outside; a,b inside (order a->b->c)
            pa = ev(a, c); pb = ev(b, c)
            out.append([a, b, pb]); out.append([a, pb, pa])
    V2 = np.r_[V, np.array(newV).reshape(-1, 3)]; UV2 = np.r_[UV, np.array(newUV).reshape(-1, 2)]
    F2 = np.r_[keepF, np.array(out, np.int64).reshape(-1, 3)]
    used, inv = np.unique(F2, return_inverse=True)
    isnew = used >= base
    return V2[used], UV2[used], inv.reshape(-1, 3), isnew

def run(verbose=True):
    Vp, UVp, Fp = load_pizza()
    wid = weld(Vp); nw = wid.max() + 1
    rem, ctr = curtain_mask(Vp, UVp, Fp, wid, nw, verbose)
    F1 = Fp[~rem]
    keep = largest_component(F1, wid, nw); F1 = F1[keep]
    if verbose: print("after curtain removal: %d faces (dropped %d island faces)" % (len(F1), (~keep).sum()))
    sdf, m2 = footprint_sdf(Vp, F1)
    # per (welded) vertex signed distance; vertices with |s| tiny nudged inside to avoid slivers
    s = sample(sdf, Vp[:, 0], Vp[:, 2])
    s = np.where(np.abs(s) < 0.05e-3, 0.05e-3, s)
    V2, UV2, F2, isnew = cut_mesh(Vp, UVp, F1, s)
    w2 = weld(V2); nw2 = w2.max() + 1
    keep = largest_component(F2, w2, nw2); F2 = F2[keep]
    used, inv = np.unique(F2, return_inverse=True); V2, UV2, isnew = V2[used], UV2[used], isnew[used]; F2 = inv.reshape(-1, 3)
    if verbose: print("after smooth cut: %d verts %d faces, %d new boundary verts" % (len(V2), len(F2), isnew.sum()))
    np.savez(FB + "cut.npz", V=V2, UV=UV2, F=F2, isnew=isnew, sdf=sdf, mask=m2, rem=rem, ctr=np.array(ctr))
    return V2, UV2, F2, sdf

if __name__ == "__main__":
    V2, UV2, F2, sdf = run()
    w2 = weld(V2); nw2 = w2.max() + 1; Vw = np.zeros((nw2, 3)); Vw[w2] = V2
    loops, Eb, multi = boundary_loops(w2[F2], nw2)
    print("loops:", len(loops), "multi", multi)
    for lp in sorted(loops, key=len, reverse=True)[:5]:
        p = Vw[lp]; per = np.linalg.norm(np.diff(np.r_[p, p[:1]], axis=0), axis=1).sum()
        gap = (p[:, 1] - plate_y(p[:, 0], p[:, 2])) * 1e3
        print("loop n=%d perim %.1f mm gap p5/50/95 %s" % (len(lp), per * 1e3, np.percentile(gap, [5, 50, 95]).round(1)))
