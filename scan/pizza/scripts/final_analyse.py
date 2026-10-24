import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Analyse fixB cut surface: edge height above plate per polar sector, low-saturation texels in the edge band."""
import io, numpy as np, scipy.ndimage as ndi
from PIL import Image
from fixB_common import *
from fixB_loops import boundary_loops
from fixB_raster import raster_top
from glbio import read_glb
import fixB_cut as cutmod
Image.MAX_IMAGE_PIXELS = None
W = S + "final/work/"
d = np.load(FB + "cut.npz"); V, UV, F = d["V"], d["UV"], d["F"]
wid = weld(V); nw = wid.max() + 1; Vw = np.zeros((nw, 3)); Vw[wid] = V
loops, Eb, multi = boundary_loops(wid[F], nw); L = loops[0]
T = Vw[L]; a = np.degrees(np.arctan2(T[:, 2], T[:, 0])) % 360
gap = (T[:, 1] - plate_y(T[:, 0], T[:, 2])) * 1e3
print("sector  gap p10/50/90 (mm)   top y (mm)")
for s0 in range(0, 360, 15):
    m = (a >= s0) & (a < s0 + 15)
    print("%3d-%3d  %s   %.1f" % (s0, s0 + 15, np.percentile(gap[m], [10, 50, 90]).round(1), np.median(T[m, 1]) * 1e3))
js, b = read_glb(S + "polycam/raw/20.10.2026.glb")
im = js["images"][0]; bv = js["bufferViews"][im["bufferView"]]
src = np.asarray(Image.open(io.BytesIO(b[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])).convert("RGB"))
SH, SW = src.shape[:2]
H, FI, (uvimg,) = raster_top(V, F, [UV], px_mm=0.2)
N = H.shape[0]; m = FI >= 0
col = np.full((N, N, 3), 255, np.uint8)
col[m] = src[np.clip((uvimg[m, 1] * SH).astype(int), 0, SH - 1), np.clip((uvimg[m, 0] * SW).astype(int), 0, SW - 1)]
c = col.astype(float); mx = c.max(2); mn = c.min(2); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255
din = ndi.distance_transform_edt(m) * 0.2  # mm from the outline
band = m & (din < 4)
grey = band & (sat < 0.38) & (val < 0.65)
pale = band & (sat < 0.25) & (val >= 0.65)
yy, xx = np.nonzero(band); ang = np.degrees(np.arctan2((yy + 0.5) * 0.2e-3 - 0.135, (xx + 0.5) * 0.2e-3 - 0.135)) % 360
print("band pixels %d, grey %d (%.1f%%), pale %d (%.1f%%)" % (band.sum(), grey.sum(), 100 * grey.sum() / band.sum(), pale.sum(), 100 * pale.sum() / band.sum()))
g_ = grey[yy, xx]; p_ = pale[yy, xx]
for s0 in range(0, 360, 15):
    k = (ang >= s0) & (ang < s0 + 15)
    print("%3d-%3d grey %.1f%% pale %.1f%%" % (s0, s0 + 15, 100 * g_[k].mean(), 100 * p_[k].mean()))
vis = col.copy(); vis[grey] = [0, 0, 255]; vis[pale] = [255, 0, 255]
Image.fromarray(vis).resize((N // 2, N // 2), Image.LANCZOS).save(W + "an_band.png")
np.savez_compressed(W + "an_top.npz", col=col, H=H, FI=FI, din=din)
