import sys, trimesh, numpy as np
src, dst = sys.argv[1], sys.argv[2]
m = trimesh.load(src).to_geometry()
tbl = 0.0237; c = np.array([0.021, -0.023])
fc = m.triangles_center; r = np.linalg.norm(fc[:, [0, 2]] - c, axis=1); h = fc[:, 1] - tbl
for thr in (0.002, 0.003, 0.004):
    print("height threshold", thr, "faces kept", int(((r < 0.150) & ((h > thr) | (r < 0.12))).sum()))
keep = (r < 0.150) & ((h > 0.003) | (r < 0.12))
p = m.submesh([np.where(keep)[0]], append=True); p.remove_unreferenced_vertices()
p.apply_translation([-c[0], -tbl, -c[1]])
b = p.bounds; print("size W x H x D (cm):", ((b[1] - b[0]) * 100).round(1).tolist(), "faces", len(p.faces))
p.export(dst)
