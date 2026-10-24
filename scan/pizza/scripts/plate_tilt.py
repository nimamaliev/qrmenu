"""Check tilt: table height per sector in a ring around the plate, and plate rim height per sector; fit planes."""
import numpy as np
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); fc, col, fn = d["fc"], d["col"], d["fn"]
cx, cz, tbl, R = np.load(P + "plate_centre.npy")
h = fc[:, 1] - tbl; x = fc[:, 0] - cx; z = fc[:, 2] - cz; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.
def plane(sel, w=None):
    A = np.c_[np.ones(sel.sum()), x[sel], z[sel]]
    s, *_ = np.linalg.lstsq(A, h[sel], rcond=None); res = h[sel] - A @ s
    return s, res
for lo, hi in ((0.14, 0.16), (0.16, 0.20), (0.20, 0.30)):
    t = (r > lo) & (r < hi) & (np.abs(h) < 0.01) & (fn[:, 1] > 0.9)
    s, res = plane(t)
    print("table ring %.2f-%.2f: n %d  h0 %.2f mm  slope x %.2f mm/m  z %.2f mm/m  (tilt %.2f deg) rms %.2f mm" % (lo, hi, t.sum(), s[0] * 1e3, s[1] * 1e3, s[2] * 1e3, np.degrees(np.arctan(np.hypot(s[1], s[2]))), res.std() * 1e3))
print("table h per 30deg sector (ring 14-18cm):", " ".join("%5.1f" % (np.median(h[(r > .14) & (r < .18) & (th >= t0) & (th < t0 + 30) & (np.abs(h) < .01)]) * 1e3) for t0 in range(0, 360, 30)))
# Rim top: white faces r in [126,131] mm -> plane fit
w = (sat < 0.16) & (val > 0.55) & (r > 0.125) & (r < 0.1315) & (h > 0.015) & (fn[:, 1] > 0.7)
for it in range(4):
    s, res = plane(w)
    keep = np.abs(res) < 2.5 * res.std(); idx = np.where(w)[0]; w[idx[~keep]] = False
print("rim (white, r 125-131.5mm) plane: n %d h0 %.2f mm slope x %.2f mm/m z %.2f mm/m tilt %.2f deg  rms %.2f mm" % (w.sum(), s[0] * 1e3, s[1] * 1e3, s[2] * 1e3, np.degrees(np.arctan(np.hypot(s[1], s[2]))), res[keep].std() * 1e3))
print("rim h per 30deg sector:", " ".join(("%5.1f" % (np.median(h[w & (th >= t0) & (th < t0 + 30)]) * 1e3)) if (w & (th >= t0) & (th < t0 + 30)).sum() > 3 else "   . " for t0 in range(0, 360, 30)))
np.save(P + "rim_plane.npy", s)
# outer skirt: does the scan drape to table? h distribution just outside R
for rr in (0.130, 0.132, 0.134, 0.136, 0.138):
    s_ = (r > rr) & (r < rr + 0.002)
    print("r %.0f-%.0f mm: h p10/50/90 = %.1f %.1f %.1f  n %d" % (rr * 1e3, rr * 1e3 + 2, *(np.percentile(h[s_], [10, 50, 90]) * 1e3), s_.sum()))
