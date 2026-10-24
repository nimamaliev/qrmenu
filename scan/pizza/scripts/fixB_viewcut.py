import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
import io, numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
from fixB_common import *
from fixB_loops import boundary_loops
d = np.load(FB + "cut.npz"); V, UV, F, rem = d["V"], d["UV"], d["F"], d["rem"]
Vp, UVp, Fp = load_pizza()
# profile plots: original faces (grey), removed (red), kept cut mesh (green)
def cents(V, F):
    c = V[F].mean(1); return np.hypot(c[:, 0], c[:, 2]) * 1e3, np.degrees(np.arctan2(c[:, 2], c[:, 0])) % 360, c[:, 1] * 1e3
r0, a0_, y0 = cents(Vp, Fp); r1, a1, y1 = cents(V, F)
w = weld(V); nw = w.max() + 1; Vw = np.zeros((nw, 3)); Vw[w] = V
loops, _, _ = boundary_loops(w[F], nw); lp = Vw[loops[0]]
rb = np.hypot(lp[:, 0], lp[:, 2]) * 1e3; ab = np.degrees(np.arctan2(lp[:, 2], lp[:, 0])) % 360
fig, axs = plt.subplots(6, 4, figsize=(20, 22)); rr = np.linspace(95, 132, 100)
for k, ax in enumerate(axs.ravel()):
    a0 = k * 15
    sel = lambda a: np.abs(((a - a0 + 180) % 360) - 180) < 1.5
    m = sel(a0_) & (r0 > 95); ax.scatter(r0[m], y0[m], c="0.7", s=4)
    m = sel(a0_) & (r0 > 95) & rem; ax.scatter(r0[m], y0[m], c="r", s=4)
    m = sel(a1) & (r1 > 95); ax.scatter(r1[m], y1[m], c="g", s=2)
    m = sel(ab); ax.scatter(rb[m], lp[m, 1] * 1e3, c="b", s=10)
    ax.plot(rr, top_mm(rr), "k-", lw=1); ax.set_title("ang %d" % a0); ax.set_xlim(95, 133); ax.set_ylim(5, 50); ax.set_aspect("equal")
plt.tight_layout(); plt.savefig(FB + "an_profiles_cut.png", dpi=55)
# top view with old and new boundary
img = Image.open(FB + "top_tex.png").convert("RGB"); dr = ImageDraw.Draw(img)
P = lambda p: [((q[0] + 0.135) / 0.0002, (q[2] + 0.135) / 0.0002) for q in p]
w0 = weld(Vp); n0 = w0.max() + 1; V0 = np.zeros((n0, 3)); V0[w0] = Vp
l0, _, _ = boundary_loops(w0[Fp], n0); p0 = P(V0[l0[0]]); dr.line(p0 + p0[:1], fill=(0, 0, 255), width=1)
p1 = P(lp); dr.line(p1 + p1[:1], fill=(0, 255, 0), width=2)
img.save(FB + "top_cut_full.png")
img.crop((int((0.06 + .135) / .0002), int((-0.04 + .135) / .0002), int((0.135 + .135) / .0002), int((0.09 + .135) / .0002))).save(FB + "top_cut_torn.png")
img.crop((0, 0, int((-0.03 + .135) / .0002), int((-0.03 + .135) / .0002))).save(FB + "top_cut_ul.png")
