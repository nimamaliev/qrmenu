"""Segment the scanned pizza from plate/table: per-face texture colour + height above the modelled plate surface,
then neighbourhood voting on a position-welded copy. Saves pizza face indices and debug images."""
import sys, numpy as np, scipy.sparse as sp
from PIL import Image, ImageDraw
sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
from plate_model import top_mm, PAR
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); V, F, col, area = d["V"], d["F"], d["col"], d["area"]
T = np.load(P + "level_T.npy"); Vl = V @ T[:3, :3].T + T[:3, 3]
fc = Vl[F].mean(1); nf = len(F)
x, h, z = fc[:, 0] * 1e3, fc[:, 1] * 1e3, fc[:, 2] * 1e3; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
R = PAR["R"]; Stop = PAR["Stop"]
S = top_mm(np.minimum(r, R)); dd = h - S
mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1)
# ---- initial per-face classification: 1 pizza, 0 plate, -1 drop (table / below plate / outside)
lab = np.full(nf, -1, np.int8)
inside = r <= R - 0.8   # crust draped over the lip is clipped at the plate edge
lab[inside & (dd >= -1.8)] = 0
lab[inside & (dd > 3.0)] = 1
lab[inside & (dd >= -1.8) & (dd <= 3.0) & (sat > 0.27)] = 1
over = np.zeros(nf, bool)
hard_drop = (lab == -1)  # never allowed to become pizza through voting
print("initial: pizza %d plate %d drop %d (overhang %d)" % ((lab == 1).sum(), (lab == 0).sum(), (lab == -1).sum(), over.sum()))
# ---- weld vertices by position (ignore UV seams), face adjacency through shared vertices
q = np.round(Vl / 2e-6).astype(np.int64)
_, wid = np.unique(q, axis=0, return_inverse=True); wid = wid.ravel()
Fw = wid[F]; nvw = wid.max() + 1
print("welded verts %d -> %d" % (len(V), nvw))
M = sp.csr_matrix((np.ones(3 * nf), (np.repeat(np.arange(nf), 3), Fw.ravel())), shape=(nf, nvw))
A = (M @ M.T).tocsr(); A.data[:] = 1.0  # vertex-sharing neighbourhood (includes self)
# work only on faces near the plate to save time
roi = r < R + 10
def vote(lab, iters, hi=0.6, lo=0.4):
    for it in range(iters):
        isp = (lab == 1).astype(float) * area
        valid = (lab >= 0).astype(float) * area + (lab == -1) * area  # drop faces count as non-pizza
        fr = (A @ isp) / np.maximum(A @ valid, 1e-30)
        new = lab.copy()
        new[roi & (lab == 1) & (fr < lo)] = 0
        new[roi & (lab == 0) & (fr > hi)] = 1
        new[hard_drop] = -1
        ch = (new != lab).sum(); lab = new
        print("  vote iter %d: changed %d  pizza %d" % (it, ch, (lab == 1).sum()))
        if ch == 0: break
    return lab
lab0 = lab.copy()
lab = vote(lab, 8)
# ---- peel off white "bridge" surfaces: Polycam bridged the bitten/torn edge with a white ramp from the crust top
# down to the plate lip (plate texture projected onto it). Remove white faces (outer zone) that are connected to the
# plate/drop region through other white faces; white toppings surrounded by sauce are not reached.
val = mx / 255.
whiteish = (sat < 0.22) & (val > 0.5) & (r > 95)
total = 0
for it in range(400):
    nonp = (lab != 1).astype(float)
    front = (A @ nonp) > 0
    cand = (lab == 1) & whiteish & front
    if not cand.any(): break
    lab[cand] = 0; total += cand.sum()
print("white bridge peel: removed %d faces in %d rounds" % (total, it))
lab = vote(lab, 4)
# ---- lifted torn edge: Polycam hung steep "curtain" faces (stretched texels) from the lifted crust down towards the
# plate. Peel steep faces well above the plate that lie within 15 mm of a boundary vertex that is >6 mm above the plate.
from scipy.spatial import cKDTree
fny = np.abs(np.cross(Vl[F[:, 1]] - Vl[F[:, 0]], Vl[F[:, 2]] - Vl[F[:, 0]]))
fny = fny[:, 1] / np.maximum(np.linalg.norm(np.cross(Vl[F[:, 1]] - Vl[F[:, 0]], Vl[F[:, 2]] - Vl[F[:, 0]]), axis=1), 1e-20)
nonp = (lab != 1).astype(float); bf = (lab == 1) & ((A @ nonp) > 0)
bv = np.unique(F[bf]); bvr = np.hypot(Vl[bv, 0], Vl[bv, 2]) * 1e3; gap = Vl[bv, 1] * 1e3 - top_mm(np.minimum(bvr, R))
lifted = Vl[bv[gap > 6.0]]
print("lifted boundary vertices (>6mm above plate): %d" % len(lifted))
near = np.zeros(nf, bool)
if len(lifted):
    dist, _ = cKDTree(lifted).query(fc, distance_upper_bound=0.015); near = np.isfinite(dist)
total = 0
for it in range(20):
    nonp = (lab != 1).astype(float)
    cand = (lab == 1) & near & (fny < 0.45) & (dd > 3.0) & ((A @ nonp) > 0)
    if not cand.any(): break
    lab[cand] = 0; total += cand.sum()
print("lifted-edge curtain peel: removed %d faces in %d rounds" % (total, it))
lab = vote(lab, 3)
# ---- tiny islands (diagnostic + removal of very small pizza islands) on the welded face graph
pz = np.where(lab == 1)[0]
Ap = A[pz][:, pz]
ncomp, cl = sp.csgraph.connected_components(Ap, directed=False)
sizes = np.bincount(cl); order = np.argsort(-sizes)
print("pizza components on welded graph: %d; largest sizes %s" % (ncomp, sizes[order[:8]].tolist()))
small = sizes[cl] < 300
print("removing %d faces in %d small islands (<300 faces)" % (small.sum(), (sizes < 300).sum()))
lab[pz[small]] = 0
# plate-labelled holes fully inside pizza: holes among non-pizza faces in roi on welded graph
npz = np.where(roi & (lab != 1))[0]
An = A[npz][:, npz]; nc2, cl2 = sp.csgraph.connected_components(An, directed=False); s2 = np.bincount(cl2)
main = np.argmax(s2); holes = (cl2 != main) & (s2[cl2] < 400) & (~hard_drop[npz])
print("non-pizza components %d; filling %d faces in %d small enclosed holes" % (nc2, holes.sum(), len(np.unique(cl2[holes]))))
lab[npz[holes]] = 1
keep = np.where(lab == 1)[0]
np.save(P + "pizza_faces.npy", keep)
print("FINAL pizza faces: %d (of %d)" % (len(keep), nf))
# ---- stats: pizza footprint
k = keep; xk, zk = x[k], z[k]
vk = np.unique(F[k]); pv = Vl[vk] * 1e3
ang = np.radians(np.arange(0, 180, 1)); proj = pv[:, 0][:, None] * np.cos(ang) + pv[:, 2][:, None] * np.sin(ang)
fer = proj.max(0) - proj.min(0)
print("pizza Feret diameter: min %.1f  max %.1f  mean %.1f mm" % (fer.min(), fer.max(), fer.mean()))
print("pizza height range: %.1f .. %.1f mm; centroid offset from plate centre (%.1f, %.1f) mm" % (pv[:, 1].min(), pv[:, 1].max(), pv[:, 0].mean(), pv[:, 2].mean()))
dk = dd[k]
print("pizza face height above plate surface d: p0.1 %.2f p1 %.2f p5 %.2f p50 %.2f" % tuple(np.percentile(dk, [0.1, 1, 5, 50])))
for r0 in range(0, 135, 10):
    s = (r[k] >= r0) & (r[k] < r0 + 10)
    if s.sum(): print("   r %3d-%3d  n %6d  d p0.5 %5.2f p2 %5.2f p10 %5.2f" % (r0, r0 + 10, s.sum(), *np.percentile(dk[s], [0.5, 2, 10])))
# ---- debug top-down images (0.5 mm raster of face centroids)
res = 0.5; Rimg = 140; n = int(2 * Rimg / res)
ix = ((x + Rimg) / res).astype(int); iz = ((z + Rimg) / res).astype(int); ok = (ix >= 0) & (ix < n) & (iz >= 0) & (iz < n)
order = np.argsort(h[ok]); I = np.where(ok)[0][order]
cls = np.zeros((n, n, 3), np.uint8)
pal = {1: None, 0: np.array([60, 120, 255]), -1: np.array([255, 60, 60])}
cimg = col.astype(np.uint8)
for L in (-1, 0, 1):
    s = I[lab[I] == L]
    cls[iz[s], ix[s]] = cimg[s] if L == 1 else (0.35 * cimg[s] + 0.65 * pal[L]).astype(np.uint8)
piz = np.zeros((n, n, 3), np.uint8); s = I[lab[I] == 1]; piz[iz[s], ix[s]] = cimg[s]
diff = np.zeros((n, n, 3), np.uint8); s = I[(lab0[I] != lab[I])]; diff[iz[s], ix[s]] = np.where((lab[s] == 1)[:, None], [0, 255, 0], [255, 0, 255])
img = Image.new("RGB", (2 * n, n)); img.paste(Image.fromarray(cls), (0, 0)); img.paste(Image.fromarray(piz), (n, 0))
dr = ImageDraw.Draw(img)
for ox in (0, n):
    dr.ellipse([ox + n / 2 - R / res, n / 2 - R / res, ox + n / 2 + R / res, n / 2 + R / res], outline=(255, 255, 0))
img.save(P + "dbg_segment.png"); Image.fromarray(diff).save(P + "dbg_segment_votes.png")
print("saved debug images")
