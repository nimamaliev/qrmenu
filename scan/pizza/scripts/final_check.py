import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Release gate for the final pizza: topology, contact with the analytic plate surface (dense barycentric samples),
floating-gap check per 2-degree sector, radius vs plate. usage: final_check.py composed.npz [dequantized.glb]"""
import numpy as np, scipy.sparse as sp
from fixB_common import plate_y, weld, PAR
np.set_printoptions(precision=3, suppress=True)
d = np.load(sys.argv[1]); V, F, UV, nTop = d["pzV"], d["pzF"], d["pzUV"], int(d["nTop"])
istop = ~(F >= nTop).any(1)
w = weld(V, 1e-6); nw = w.max() + 1; Fw = w[F]
deg = (Fw[:, 0] == Fw[:, 1]) | (Fw[:, 1] == Fw[:, 2]) | (Fw[:, 0] == Fw[:, 2])
E = np.sort(np.r_[Fw[~deg][:, [0, 1]], Fw[~deg][:, [1, 2]], Fw[~deg][:, [2, 0]]], 1)
key = E[:, 0] * nw + E[:, 1]; uk, cnt = np.unique(key, return_counts=True)
be = uk[cnt == 1]; bA, bB = be // nw, be % nw
A = sp.coo_matrix((np.ones(len(be)), (bA, bB)), shape=(nw, nw))
nc, lab = sp.csgraph.connected_components(A, directed=False)
bv = np.unique(np.r_[bA, bB]); sizes = np.bincount(lab[bv])
sizes = np.sort(sizes[sizes > 0])[::-1]
t = V[F]; uvt = UV[F]
uva = 0.5 * np.abs((uvt[:, 1, 0] - uvt[:, 0, 0]) * (uvt[:, 2, 1] - uvt[:, 0, 1]) - (uvt[:, 2, 0] - uvt[:, 0, 0]) * (uvt[:, 1, 1] - uvt[:, 0, 1]))
area = 0.5 * np.linalg.norm(np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]), axis=1)
print("faces %d (top %d, wall %d), welded verts %d, degenerate (welded) faces %d, zero-area faces %d, zero-UV-area faces %d" % (
    len(F), istop.sum(), (~istop).sum(), nw, deg.sum(), (area < 1e-12).sum(), (uva < 1e-12).sum()))
print("non-manifold edges (>2 faces) %d; boundary edges %d in %d loops, loop sizes %s" % ((cnt > 2).sum(), len(be), len(sizes), sizes[:6]))
# dense contact check on top faces (analytic plate surface)
rng = np.random.default_rng(0)
tt = t[istop]; n_per = np.clip(np.ceil(area[istop] / area[istop].mean() * 40).astype(int), 4, 400)
idx = np.repeat(np.arange(len(tt)), n_per); r1 = np.sqrt(rng.random(len(idx))); r2 = rng.random(len(idx))
P = (1 - r1)[:, None] * tt[idx, 0] + (r1 * (1 - r2))[:, None] * tt[idx, 1] + (r1 * r2)[:, None] * tt[idx, 2]
gap = (P[:, 1] - plate_y(P[:, 0], P[:, 2])) * 1e3
print("top surface: %d samples; gap above plate min %.3f mm, below 0: %d samples, p0.01 %.3f mm" % (len(P), gap.min(), (gap < 0).sum(), np.percentile(gap, 0.01)))
# whole pizza: max penetration, contact per sector, radius
gv = (V[:, 1] - plate_y(V[:, 0], V[:, 2])) * 1e3
print("all pizza vertices: deepest below plate surface %.2f mm (wall bottom sinks by design, plate wall 4.5 mm)" % (-gv.min()))
r = np.hypot(V[:, 0], V[:, 2]) * 1e3; ang = np.degrees(np.arctan2(V[:, 2], V[:, 0])) % 360
sec = (ang // 2).astype(int); lowest = np.full(180, np.inf); np.minimum.at(lowest, sec, gv)
print("per 2-deg sector lowest pizza point relative to plate: max %.2f mm (all sectors must be <= 0 -> no floating gap), min %.2f mm" % (lowest.max(), lowest.min()))
print("pizza max radius %.2f mm (plate R %.2f mm)" % (r.max(), PAR["R"]))
print("pizza y range %.2f .. %.2f mm" % (V[:, 1].min() * 1e3, V[:, 1].max() * 1e3))
if len(sys.argv) > 2:
    import trimesh
    sc = trimesh.load(sys.argv[2], force="scene", process=False)
    world = {}
    for node in sc.graph.nodes_geometry:
        T, gname = sc.graph[node]; g = sc.geometry[gname].copy(); g.apply_transform(T); world[gname] = g
        print("dequantized GLB mesh %s (world space): %d verts %d faces bounds mm %s .. %s" % (gname, len(g.vertices), len(g.faces), (g.bounds[0] * 1e3).round(2), (g.bounds[1] * 1e3).round(2)))
    pz = [g for n, g in world.items() if "pizza" in n][0]
    Vq = np.asarray(pz.vertices); gq = (Vq[:, 1] - plate_y(Vq[:, 0], Vq[:, 2])) * 1e3
    secq = ((np.degrees(np.arctan2(Vq[:, 2], Vq[:, 0])) % 360) // 2).astype(int); lq = np.full(180, np.inf); np.minimum.at(lq, secq, gq)
    print("dequantized pizza: deepest %.2f mm below plate, sector-lowest max %.2f mm, max radius %.2f mm" % (-gq.min(), lq.max(), np.hypot(Vq[:, 0], Vq[:, 2]).max() * 1e3))
