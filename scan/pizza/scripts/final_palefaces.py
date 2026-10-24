import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Locate low-saturation (pale / grey) top-surface faces near the outline, incl. ones hidden from the top view."""
import io, numpy as np
from PIL import Image
from fixB_common import *
from glbio import read_glb
import fixB_cut as cutmod
Image.MAX_IMAGE_PIXELS = None
W = S + "final/work/"
c = np.load(W + "cut.npz"); V, UV, F, sdf = c["V"], c["UV"], c["F"], c["sdf"]
js, b = read_glb(S + "polycam/raw/20.10.2026.glb")
im = js["images"][0]; bv = js["bufferViews"][im["bufferView"]]
src = np.asarray(Image.open(io.BytesIO(b[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])).convert("RGB"))
SH, SW = src.shape[:2]
# sample colour at 4 points per face (centroid + 3 inner points)
bc = np.array([[1/3, 1/3, 1/3], [.6, .2, .2], [.2, .6, .2], [.2, .2, .6]])
cols = []
for w in bc:
    uv = (UV[F] * w[None, :, None]).sum(1)
    cols.append(src[np.clip((uv[:, 1] * SH).astype(int), 0, SH - 1), np.clip((uv[:, 0] * SW).astype(int), 0, SW - 1)].astype(float))
col = np.mean(cols, 0); mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255
cen = V[F].mean(1); D = cutmod.sample(sdf, cen[:, 0], cen[:, 2]) * 1e3
pol = np.degrees(np.arctan2(cen[:, 2], cen[:, 0])) % 360
fn, fa = face_normals(V, F)
gap = (cen[:, 1] - plate_y(cen[:, 0], cen[:, 2])) * 1e3
pale = (sat < 0.30) & (val > 0.62); grey = (sat < 0.30) & (val <= 0.62)
print("pale area by sector (mm2) for D bins [0,2,4,6,8,12]")
for a0 in range(0, 360, 10):
    k = (pol >= a0) & (pol < a0 + 10)
    row = []
    for d0, d1 in [(0, 2), (2, 4), (4, 6), (6, 8), (8, 12)]:
        m = k & (D >= d0) & (D < d1)
        row.append("%5.0f/%4.0f" % (fa[m & pale].sum() * 1e6, fa[m & grey].sum() * 1e6))
    if any(float(r.split('/')[0]) > 3 or float(r.split('/')[1]) > 3 for r in row): print("%3d " % a0, "  ".join(row))
np.savez(W + "facecol.npz", col=col, sat=sat, val=val, D=D, pol=pol, gap=gap, ny=fn[:, 1])
