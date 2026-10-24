"""Colour statistics of plate band vs pizza vs table in levelled frame, to choose classification thresholds."""
import sys, numpy as np
sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
from plate_model import top_mm, PAR
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); col = d["col"]; fc = np.load(P + "fc_level.npy")
x, h, z = fc[:, 0], fc[:, 1] * 1e3, fc[:, 2]; r = np.hypot(x, z) * 1e3; th = np.degrees(np.arctan2(z, x)) % 360
dd = h - top_mm(np.minimum(r, PAR["R"]))
mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.
def hue(c):
    R, G, B = c[:, 0], c[:, 1], c[:, 2]; mx = c.max(1); mn = c.min(1); dl = np.maximum(mx - mn, 1e-6)
    hh = np.where(mx == R, ((G - B) / dl) % 6, np.where(mx == G, (B - R) / dl + 2, (R - G) / dl + 4)); return hh * 60
hu = hue(col)
groups = {
 "plate band (r126-131, |d|<1, az 60-150)": (r > 126) & (r < 131) & (np.abs(dd) < 1) & (th > 60) & (th < 150),
 "plate near pizza (r121-124, |d|<1, az 60-150)": (r > 121) & (r < 124) & (np.abs(dd) < 1) & (th > 60) & (th < 150),
 "pizza interior (r<90, d>3)": (r < 90) & (dd > 3),
 "pizza crust (r 100-118, d>3, az 60-150)": (r > 100) & (r < 118) & (dd > 3) & (th > 60) & (th < 150),
 "table (r 140-180)": (r > 140) & (r < 180) & (np.abs(h) < 3),
}
for k, s in groups.items():
    print("%-48s n %6d  sat p5/50/95 %.2f %.2f %.2f   val p5/50/95 %.2f %.2f %.2f   hue p5/50/95 %3.0f %3.0f %3.0f" % (k, s.sum(), *np.percentile(sat[s], [5, 50, 95]), *np.percentile(val[s], [5, 50, 95]), *np.percentile(hu[s], [5, 50, 95])))
for thr in (0.12, 0.15, 0.18, 0.21, 0.24):
    print("sat<%.2f: plate band %.3f  near-pizza plate %.3f  pizza interior %.3f  crust %.3f" % (thr, *[(sat[s] < thr).mean() for k, s in list(groups.items())[:4]]))
