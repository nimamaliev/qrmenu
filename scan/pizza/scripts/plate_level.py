"""Compute levelling transform (scan -> model frame: table plane -> y=0, plate centre -> x=z=0) and
re-measure plate rim profile + pizza lower envelope in the levelled frame."""
import numpy as np
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); V, F, col, fcs = d["V"], d["F"], d["col"], d["fc"]
cx, cz, tbl, R = np.load(P + "plate_centre.npy")
# table plane from faces in ring 14-20 cm (scan frame)
x = fcs[:, 0] - cx; z = fcs[:, 2] - cz; r = np.hypot(x, z); hh = fcs[:, 1] - tbl
t = (r > 0.14) & (r < 0.20) & (np.abs(hh) < 0.01) & (d["fn"][:, 1] > 0.9)
A = np.c_[np.ones(t.sum()), x[t], z[t]]
for it in range(3):
    s, *_ = np.linalg.lstsq(A, hh[t], rcond=None); res = hh[t] - A @ s; k = np.abs(res) < 3 * res.std(); A = A[k]; idx = np.where(t)[0]; t[idx[~k]] = False
a0, bx, bz = s
print("table plane: h = %.3fmm + %.3f mm/m * x + %.3f mm/m * z" % (a0 * 1e3, bx * 1e3, bz * 1e3))
n = np.array([-bx, 1.0, -bz]); n /= np.linalg.norm(n)
# rotation taking n -> +Y (Rodrigues)
yv = np.array([0, 1.0, 0]); ax = np.cross(n, yv); sa = np.linalg.norm(ax); ca = n @ yv
K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]]) / sa
Rm = np.eye(3) + np.sin(np.arcsin(sa)) * K + (1 - ca) * K @ K
print("tilt corrected: %.3f deg" % np.degrees(np.arcsin(sa)))
p0 = np.array([cx, tbl + a0, cz])  # point on table plane under plate centre
T = np.eye(4); T[:3, :3] = Rm; T[:3, 3] = -Rm @ p0
np.save(P + "level_T.npy", T)
Vl = V @ Rm.T + T[:3, 3]
fc = Vl[F].mean(1)
np.save(P + "fc_level.npy", fc)
x, h, z = fc[:, 0], fc[:, 1], fc[:, 2]; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
ring = (r > 0.14) & (r < 0.2); print("levelled table h: median %.2f mm p5 %.2f p95 %.2f" % tuple(np.percentile(h[ring & (np.abs(h) < .01)], [50, 5, 95]) * 1e3))
mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.
white = (sat < 0.16) & (val > 0.55) & (h > 0.01) & (r < R + 0.0005)
fn = np.cross(Vl[F[:, 1]] - Vl[F[:, 0]], Vl[F[:, 2]] - Vl[F[:, 0]]); fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-20)
wt = white & (fn[:, 1] > 0.6)
print("\nWHITE (plate surface) radial profile, 1mm bins: r  n  p10 p25 p50 p75 p90 (mm)")
prof = []
for r0 in np.arange(0.110, 0.134, 0.001):
    s = wt & (r >= r0) & (r < r0 + 0.001)
    if s.sum() < 8: continue
    q = np.percentile(h[s], [10, 25, 50, 75, 90]) * 1e3; prof.append((r0 + 0.0005, *q))
    print("  %5.1f %5d " % ((r0 + 0.0005) * 1e3, s.sum()) + " ".join("%5.1f" % v for v in q))
np.save(P + "white_profile.npy", np.array(prof))
print("\nWHITE per 30-deg sector p50 h (mm), 1.5mm bins from 117 to 133")
for t0 in range(0, 360, 30):
    row = []
    for r0 in np.arange(0.117, 0.133, 0.0015):
        s = wt & (th >= t0) & (th < t0 + 30) & (r >= r0) & (r < r0 + 0.0015)
        row.append("%4.1f" % (np.median(h[s]) * 1e3) if s.sum() >= 4 else "  . ")
    print("%3d: " % t0 + " ".join(row))
piz = (sat > 0.28) & (h > 0.005) & (r < R)
print("\nPIZZA-coloured faces radial: r  n  p1 p2 p5 p10 p50 (mm)")
for r0 in np.arange(0.0, 0.132, 0.005):
    s = piz & (r >= r0) & (r < r0 + 0.005)
    if s.sum() < 20: continue
    print("  %5.1f %6d " % ((r0 + 0.0025) * 1e3, s.sum()) + " ".join("%5.1f" % v for v in np.percentile(h[s], [1, 2, 5, 10, 50]) * 1e3))
