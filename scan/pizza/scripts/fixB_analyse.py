import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
import numpy as np
from PIL import Image
from fixB_common import *
Vp, UVp, Fp = load_pizza()
print("pizza verts %d faces %d" % (len(Vp), len(Fp)))
fn, fa = face_normals(Vp, Fp)
c = Vp[Fp].mean(1)
gap = (c[:, 1] - plate_y(c[:, 0], c[:, 2])) * 1e3
r = np.hypot(c[:, 0], c[:, 2]) * 1e3
print("normal y percentiles", np.percentile(fn[:, 1], [1, 5, 10, 25, 50]))
for th in [0.0, 0.3, 0.5, 0.7]:
    m = fn[:, 1] < th; print("ny<%.1f: %d faces, area %.1f cm2, gap p5/50/95 %s r p5/50/95 %s" % (th, m.sum(), fa[m].sum() * 1e4, np.percentile(gap[m], [5, 50, 95]).round(1) if m.any() else '-', np.percentile(r[m], [5, 50, 95]).round(1) if m.any() else '-'))
print("gap overall p1/5/50/95/99", np.percentile(gap, [1, 5, 50, 95, 99]).round(2))
# top view maps
N = 1000; ext = 0.135
ix = ((c[:, 0] + ext) / (2 * ext) * N).astype(int).clip(0, N - 1); iz = ((c[:, 2] + ext) / (2 * ext) * N).astype(int).clip(0, N - 1)
img = np.full((N, N, 3), 255, np.uint8)
# colour by verticality: red = steep, green = flat
order = np.argsort(-fn[:, 1])  # draw flat first then steep on top
v = np.clip(fn[:, 1], 0, 1)
img[iz[order], ix[order]] = np.c_[(255 * (1 - v[order])), (255 * v[order]), np.zeros(len(order))].astype(np.uint8)
Image.fromarray(img).save(FB + "an_steep.png")
g = np.clip(gap / 25, 0, 1)
img2 = np.full((N, N, 3), 255, np.uint8)
img2[iz, ix] = (np.c_[g, g, g] * 255).astype(np.uint8)
Image.fromarray(img2).save(FB + "an_gap.png")
# angle sectors: max top height and boundary info per angle
ang = np.degrees(np.arctan2(c[:, 2], c[:, 0])) % 360
for a0 in range(0, 360, 15):
    m = (ang >= a0) & (ang < a0 + 15) & (r > 100)
    st = m & (fn[:, 1] < 0.5)
    print("ang %3d: rmax %.1f  top gap p90 %.1f  steep n %d steep area %.2f cm2 steep gap range %.1f..%.1f" % (a0, r[m].max(), np.percentile(gap[m], 90), st.sum(), fa[st].sum() * 1e4, gap[st].min() if st.any() else 0, gap[st].max() if st.any() else 0))
