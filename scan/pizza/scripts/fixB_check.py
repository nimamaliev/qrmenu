import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Numeric checks on a fixB composed npz: contact with the plate, sinking, radius, normals, UV stretch on the wall."""
import numpy as np
from fixB_common import *
from fixB_curtain import uv_stretch
name = sys.argv[1] if len(sys.argv) > 1 else "pizza_plate"
d = np.load(FB + name + "_composed.npz"); V, N, UV, F, nTop = d["pzV"], d["pzN"], d["pzUV"], d["pzF"], int(d["nTop"])
top = V[:nTop]; wall = V[nTop:]
gt = (top[:, 1] - plate_y(top[:, 0], top[:, 2])) * 1e3
gw = (wall[:, 1] - plate_y(wall[:, 0], wall[:, 2])) * 1e3
print("top surface height above plate (mm): min %.2f p1 %.2f p50 %.2f; verts below plate by >0.5mm: %d" % (gt.min(), np.percentile(gt, 1), np.median(gt), (gt < -0.5).sum()))
print("wall vertex height above plate (mm): min %.2f; below -4mm (could poke through 4.5mm plate wall): %d" % (gw.min(), (gw < -4).sum()))
# lowest wall ring = vertices with the lowest gap in each column: approximate by vertices with gw<0
print("wall vertices inside plate (gw<0): %d of %d; max gap among those touching (min per 2deg sector) %.2f mm" % ((gw < 0).sum(), len(gw), 0))
ang = np.degrees(np.arctan2(wall[:, 2], wall[:, 0])) % 360
sec = (ang // 2).astype(int); mins = np.full(180, np.inf); np.minimum.at(mins, sec, gw)
print("per-2deg-sector lowest wall point vs plate (mm): max %.2f (should be <0 => no floating gap), sectors without wall: %d" % (mins[np.isfinite(mins)].max(), (~np.isfinite(mins)).sum()))
r = np.hypot(V[:, 0], V[:, 2]) * 1e3
print("max pizza radius %.2f mm (plate R %.2f)" % (r.max(), PAR["R"]))
wf = F[F.min(1) >= nTop]
smax, smin = uv_stretch(V, UV, wf, tex_px=4096)
print("wall texels/mm: smax p5/50/95 %s smin p1/5/50 %s anisotropy smin/smax p1/5/50 %s" % (np.percentile(smax, [5, 50, 95]).round(2), np.percentile(smin, [1, 5, 50]).round(2), np.percentile(smin / np.maximum(smax, 1e-9), [1, 5, 50]).round(2)))
print("normals unit: %.4f..%.4f" % (np.linalg.norm(N, axis=1).min(), np.linalg.norm(N, axis=1).max()))
print("bounds mm", (V.min(0) * 1e3).round(2), (V.max(0) * 1e3).round(2))
