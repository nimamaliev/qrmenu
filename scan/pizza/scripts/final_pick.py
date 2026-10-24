"""Pick which pizza faces are seen at given pixels of a plate_render view.
usage: final_pick.py composed.npz 'theta phi r' 'tx ty tz' fov_deg x,y [x,y ...]   (600x500 image, vertical fov)"""
import sys, numpy as np
sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
from fixB_common import plate_y
d = np.load(sys.argv[1]); V, F, UV, nTop = d["pzV"], d["pzF"], d["pzUV"], int(d["nTop"])
th, ph, r = [float(x) for x in sys.argv[2].split()]; tgt = np.array([float(x) for x in sys.argv[3].split()]); fov = float(sys.argv[4])
th, ph = np.radians(th), np.radians(ph)
cam = tgt + r * np.array([np.sin(ph) * np.sin(th), np.cos(ph), np.sin(ph) * np.cos(th)])
fwd = (tgt - cam) / np.linalg.norm(tgt - cam); right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right); up = np.cross(right, fwd)
T0 = V[F[:, 0]]; E1 = V[F[:, 1]] - T0; E2 = V[F[:, 2]] - T0
fn = np.cross(E1, E2); fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-30)
def cast(o, dv):
    P = np.cross(dv, E2); det = np.einsum('ij,ij->i', E1, P); ok = np.abs(det) > 1e-18; inv = 1 / np.where(ok, det, 1)
    Tv = o - T0; u = np.einsum('ij,ij->i', Tv, P) * inv; Q = np.cross(Tv, E1); v = (Q @ dv) * inv; t = np.einsum('ij,ij->i', E2, Q) * inv
    hit = ok & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 0)
    idx = np.nonzero(hit)[0]
    if len(idx) == 0: return [], []
    o_ = np.argsort(t[idx]); idx = idx[o_]; return o + t[idx, None] * dv, idx
for p in sys.argv[5:]:
    x, y = [float(v) for v in p.split(",")]
    t = np.tan(np.radians(fov) / 2); ndx = (2 * (x + 0.5) / 600 - 1) * t * 600 / 500; ndy = (1 - 2 * (y + 0.5) / 500) * t
    dvec = fwd + ndx * right + ndy * up; dvec /= np.linalg.norm(dvec)
    loc, it = cast(cam, dvec)
    if len(loc) == 0: print(p, "miss"); continue
    f = it[0]; c = loc[0]
    iswall = (F[f] >= nTop).any()
    print("%s -> face %d %s pos mm %s gap %.2f mm polar %.1f normal %s uv %s" % (p, f, "WALL" if iswall else "top", (c * 1e3).round(1),
          (c[1] - plate_y(c[0], c[2])) * 1e3, np.degrees(np.arctan2(c[2], c[0])) % 360, fn[f].round(2), UV[F[f]].mean(0).round(4)))
