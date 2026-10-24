"""Measure plate centre/diameter, rim height and radial profile, plate floor height and pizza extent from the scan."""
import numpy as np
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); fc, col, fn = d["fc"], d["col"], d["fn"]
tbl = float(np.load(P + "topmaps.npz")["tbl"])
h = fc[:, 1] - tbl
mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.
def fitcircle(px, pz):
    A = np.c_[px, pz, np.ones_like(px)]; b = px ** 2 + pz ** 2
    s = np.linalg.lstsq(A, b, rcond=None)[0]; cx, cz = s[0] / 2, s[1] / 2
    return cx, cz, np.sqrt(s[2] + cx ** 2 + cz ** 2)
def robust(px, pz):
    keep = np.ones(len(px), bool)
    for _ in range(8):
        cx, cz, R = fitcircle(px[keep], pz[keep]); res = np.hypot(px - cx, pz - cz) - R
        keep = np.abs(res) < max(2.5 * np.std(res[keep]), 0.001)
    return cx, cz, R, keep, res
cx, cz = 0.016, -0.006
for it in range(4):
    x = fc[:, 0] - cx; z = fc[:, 2] - cz; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
    pts = {}
    for thr in (0.004, 0.008, 0.012):
        q = []
        for k in range(0, 360, 1):
            s = (th >= k) & (th < k + 1) & (r > 0.10) & (r < 0.17)
            rb = ((r[s] - 0.10) / 0.0005).astype(int); hb = np.full(140, -1.0); np.maximum.at(hb, rb, h[s])
            # outermost bin whose max height exceeds thr (requiring 2 consecutive bins to reject specks)
            good = np.where((hb[:-1] > thr) & (hb[1:] > thr))[0]
            if len(good) == 0: continue
            rr = 0.10 + (good.max() + 1.5) * 0.0005; a = np.radians(k + 0.5)
            q.append((cx + rr * np.cos(a), cz + rr * np.sin(a)))
        pts[thr] = np.array(q)
    res_ = {thr: robust(p[:, 0], p[:, 1]) for thr, p in pts.items()}
    cx, cz = res_[0.008][0], res_[0.008][1]
    for thr, (a, b, R, keep, res) in res_.items():
        print("iter %d thr %4.1fmm: centre (%.4f, %.4f) D=%.1f mm inl %d/%d rms %.2f mm" % (it, thr * 1e3, a, b, 2 * R * 1e3, keep.sum(), len(keep), np.std(res[keep]) * 1e3))
R8 = res_[0.008][2]
x = fc[:, 0] - cx; z = fc[:, 2] - cz; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
np.save(P + "plate_centre.npy", np.array([cx, cz, tbl, R8]))
# Visible white plate faces: low saturation, bright
white = (sat < 0.16) & (val > 0.55) & (h > 0.002) & (r < R8 + 0.002)
print("white faces", white.sum())
print("\nRadial profile of WHITE faces (plate surface) all azimuths, 2 mm bins: r, n, h p10/p50/p90 (mm)")
for r0 in np.arange(0.06, 0.140, 0.002):
    s = white & (r >= r0) & (r < r0 + 0.002)
    if s.sum() < 5: continue
    print("  r %5.1f n %5d  h %5.1f %5.1f %5.1f   upN %.2f" % ((r0 + 0.001) * 1e3, s.sum(), *(np.percentile(h[s], [10, 50, 90]) * 1e3), np.median(fn[s, 1])))
print("\nNon-white faces radial profile (pizza): r, n, h p10/p50/p90")
piz = (sat > 0.25) & (h > 0.002)
for r0 in np.arange(0.0, 0.140, 0.005):
    s = piz & (r >= r0) & (r < r0 + 0.005)
    if s.sum() < 5: continue
    print("  r %5.1f n %6d  h %5.1f %5.1f %5.1f" % ((r0 + 0.0025) * 1e3, s.sum(), *(np.percentile(h[s], [10, 50, 90]) * 1e3)))
# per-sector profile for white faces
print("\nPer-30deg sector WHITE median h (mm) in 2mm bins r=100..136mm")
print("      " + " ".join("%4d" % v for v in range(101, 137, 2)))
for t0 in range(0, 360, 30):
    row = []
    for r0 in np.arange(0.100, 0.136, 0.002):
        s = white & (th >= t0) & (th < t0 + 30) & (r >= r0) & (r < r0 + 0.002)
        row.append("%4.1f" % (np.median(h[s]) * 1e3) if s.sum() >= 3 else "   .")
    print("%3d:  " % t0 + " ".join(row))
