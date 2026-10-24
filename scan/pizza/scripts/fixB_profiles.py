import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from fixB_common import *
Vp, UVp, Fp = load_pizza()
fn, fa = face_normals(Vp, Fp)
c = Vp[Fp].mean(1)
r = np.hypot(c[:, 0], c[:, 2]) * 1e3; ang = np.degrees(np.arctan2(c[:, 2], c[:, 0])) % 360
y = c[:, 1] * 1e3
fig, axs = plt.subplots(6, 4, figsize=(20, 22))
rr = np.linspace(95, 132, 100)
for k, ax in enumerate(axs.ravel()):
    a0 = k * 15
    m = (np.abs(((ang - a0 + 180) % 360) - 180) < 1.5) & (r > 95)
    sc = ax.scatter(r[m], y[m], c=fn[m, 1], s=3, cmap="RdYlGn", vmin=-0.2, vmax=1)
    ax.plot(rr, top_mm(rr), "k-", lw=1)
    ax.set_title("ang %d" % a0); ax.set_xlim(95, 133); ax.set_ylim(5, 50); ax.set_aspect("equal")
plt.tight_layout(); plt.savefig(FB + "an_profiles.png", dpi=55)
