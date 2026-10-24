"""Procedural plate: radial profile (top surface S(r)), closed cross-section, revolve to a smooth mesh.
Units: metres, table at y=0, plate centred on the y axis. Run as main to fit the rim to the scanned white faces."""
import numpy as np
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
# ---- parameters (mm); rim values fitted to scan, see __main__
PAR = dict(R=131.95,      # outer radius (scan D = 263.9 mm)
           F=8.0,         # floor top height above table
           r1=72.0,       # end of flat floor
           rw=121.5, Sw=24.9, m=0.25,   # well/rim junction (lowest visible plate surface next to the pizza) and slope there
           Stop=28.7,     # rim top height (just inside the lip)
           t_rim=4.5,     # wall thickness at the rim  -> lip radius t_rim/2
           t_floor=5.0,   # floor thickness
           foot_in=84.0, foot_out=92.0, foot_h=None)  # foot ring radii; foot height = F - t_floor
def herm(x, x0, x1, y0, y1, m0, m1):
    L = x1 - x0; t = (x - x0) / L; t2 = t * t; t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * L * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * L * m1
def top_mm(r, p=PAR):
    """Top-surface height (mm) at radius r (mm); outside the lip returns the lip curve (nan beyond R)."""
    r = np.asarray(r, float); y = np.full(r.shape, np.nan)
    rl = p["t_rim"] / 2; rt = p["R"] - rl
    a = r <= p["r1"]; y[a] = p["F"]
    b = (r > p["r1"]) & (r <= p["rw"]); y[b] = herm(r[b], p["r1"], p["rw"], p["F"], p["Sw"], 0.0, p["m"])
    c = (r > p["rw"]) & (r <= rt); y[c] = herm(r[c], p["rw"], rt, p["Sw"], p["Stop"], p["m"], 0.0)
    d = (r > rt) & (r <= p["R"]); y[d] = p["Stop"] - rl + np.sqrt(np.maximum(rl ** 2 - (r[d] - rt) ** 2, 0))
    return y
def S(r_m):
    """Top surface height in metres for radius in metres."""
    return top_mm(np.asarray(r_m) * 1e3) * 1e-3
def section(p=PAR, n_floor=6, n_well=36, n_rim=18, n_lip=14):
    """Closed cross-section polyline (r, y) in mm from top centre, around the lip, along the underside, foot ring,
    to bottom centre. Returns points and a 'smooth' flag per point (all smooth: corners are rounded)."""
    rl = p["t_rim"] / 2; rt = p["R"] - rl
    rs = np.r_[np.linspace(0, p["r1"], n_floor, endpoint=False), np.linspace(p["r1"], p["rw"], n_well, endpoint=False),
               np.linspace(p["rw"], rt, n_rim, endpoint=False)]
    top = np.c_[rs, top_mm(rs, p)]
    # lip: semicircle from top (rt, Stop) clockwise around the outside to (rt, Stop - 2 rl)
    ang = np.linspace(np.pi / 2, -np.pi / 2, n_lip + 1)
    lip = np.c_[rt + rl * np.cos(ang), p["Stop"] - rl + rl * np.sin(ang)]
    # underside: offset of the top curve along its downward normal by thickness (t_rim at rim -> t_floor in well)
    ru = np.linspace(rt, p["foot_out"] + 4.0, 44)
    yt = top_mm(ru, p); dy = np.gradient(yt, ru)
    nrm = np.c_[dy, -np.ones_like(dy)] / np.sqrt(1 + dy ** 2)[:, None]  # downward-pointing normal (dr, dy)
    tt = np.interp(ru, [p["foot_out"], p["rw"], rt], [p["t_floor"], p["t_rim"], p["t_rim"]])
    und = np.c_[ru, yt] + nrm * tt[:, None]
    und = und[1:]  # first point coincides with lip end
    und = und[np.argsort(-und[:, 0])]
    # foot ring (outer wall down to y=0, flat bottom, inner wall up to floor underside), rounded corners
    fh = p["F"] - p["t_floor"]; fo, fi = p["foot_out"], p["foot_in"]
    y_join = np.interp(fo + 3.0, und[::-1, 0], und[::-1, 1])
    und = und[und[:, 0] > fo + 3.0]
    cr = 1.2  # corner radius
    def arc(cx, cy, a0, a1, n=6):
        a = np.linspace(a0, a1, n); return np.c_[cx + cr * np.cos(a), cy + cr * np.sin(a)]
    foot = np.r_[np.c_[np.linspace(fo + 3.0, fo + 0.4, 4), np.linspace(y_join, cr + 0.6, 4)],  # outer wall slightly flared
                 arc(fo - cr + 0.15, cr, 0.0, -np.pi / 2),
                 np.c_[np.linspace(fo - cr, fi + cr, 6)[1:-1], np.zeros(4)],
                 arc(fi + cr, cr, -np.pi / 2, -np.pi),
                 np.c_[np.full(3, fi), np.linspace(cr + 0.5, fh - cr, 3)],
                 arc(fi - cr, fh - cr, 0.0, np.pi / 2)]
    inner = np.c_[np.linspace(fi - cr - 2.0, 0.0, 5), np.full(5, fh)]
    sec = np.r_[top, lip, und, foot, inner]
    # drop near-duplicate consecutive points
    keep = np.r_[True, np.linalg.norm(np.diff(sec, axis=0), axis=1) > 1e-4]
    return sec[keep]
def revolve(sec_mm, nseg=160):
    """Revolve closed section (from axis top to axis bottom) around Y. Returns V (m), N, F with smooth normals."""
    sec = sec_mm * 1e-3
    # 2D normals by central differences of the tangent (outward = right-hand of travel direction for this ordering)
    tg = np.gradient(sec, axis=0); tg /= np.linalg.norm(tg, axis=1, keepdims=True)
    n2 = np.c_[-tg[:, 1], tg[:, 0]]  # rotate tangent by -90deg
    # orientation check: at the first point (top centre) normal must point +y
    if n2[0, 1] < 0: n2 = -n2
    n2[0] = [0, 1]; n2[-1] = [0, -1]
    m = len(sec); ang = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)
    ring = sec[1:-1]; rn = n2[1:-1]; k = len(ring)
    V = np.zeros((2 + k * nseg, 3)); N = np.zeros_like(V)
    V[0] = [0, sec[0, 1], 0]; N[0] = [0, 1, 0]
    V[1] = [0, sec[-1, 1], 0]; N[1] = [0, -1, 0]
    rr = ring[:, 0][:, None]; V[2:, 0] = (rr * ca).ravel(); V[2:, 2] = (rr * sa).ravel(); V[2:, 1] = np.repeat(ring[:, 1], nseg)
    N[2:, 0] = (rn[:, 0][:, None] * ca).ravel(); N[2:, 2] = (rn[:, 0][:, None] * sa).ravel(); N[2:, 1] = np.repeat(rn[:, 1], nseg)
    idx = lambda i, j: 2 + i * nseg + (j % nseg)
    Fs = []
    j = np.arange(nseg)
    Fs.append(np.c_[np.zeros(nseg, int), idx(0, j + 1), idx(0, j)])       # top fan
    for i in range(k - 1):
        a, b, c, d = idx(i, j), idx(i, j + 1), idx(i + 1, j), idx(i + 1, j + 1)
        Fs.append(np.c_[a, b, d]); Fs.append(np.c_[a, d, c])
    Fs.append(np.c_[np.ones(nseg, int), idx(k - 1, j), idx(k - 1, j + 1)])  # bottom fan
    F = np.vstack(Fs)
    # ensure outward winding consistent with normals
    tri = V[F]; fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    if (np.einsum("ij,ij->i", fn, N[F].mean(1)) < 0).mean() > 0.5: F = F[:, ::-1]
    return V, N, F
if __name__ == "__main__":
    d = np.load(P + "faces.npz"); col = d["col"]; fc = np.load(P + "fc_level.npy")
    x, h, z = fc[:, 0], fc[:, 1] * 1e3, fc[:, 2]; r = np.hypot(x, z) * 1e3; th = np.degrees(np.arctan2(z, x)) % 360
    mx = col.max(1); mn = col.min(1); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.
    w = (sat < 0.15) & (val > 0.6) & (r > 121) & (r < 131.6) & (h > 20) & ~((th < 45))  # skip folded-crust sector
    # robust fit of (Sw, m, Stop) by grid search on median absolute residual
    best = None
    for Sw in np.arange(24.0, 26.6, 0.1):
        for m in np.arange(0.0, 0.9, 0.05):
            for St in np.arange(27.8, 29.4, 0.1):
                p = dict(PAR, Sw=Sw, m=m, Stop=St); res = h[w] - top_mm(r[w], p)
                cost = np.mean(np.minimum(np.abs(res), 1.5))
                if best is None or cost < best[0]: best = (cost, Sw, m, St)
    print("rim fit: cost %.3f  Sw %.1f  m %.2f  Stop %.1f  (n=%d)" % (*best, w.sum()))
    p = dict(PAR, Sw=best[1], m=best[2], Stop=best[3]); res = h[w] - top_mm(r[w], p)
    for r0 in np.arange(121, 132, 1.0):
        s = (r[w] >= r0) & (r[w] < r0 + 1)
        print("  r %5.1f  model %5.2f  data p25/p50/p75 %5.2f %5.2f %5.2f  resid med %+.2f" % (r0 + .5, top_mm(np.array([r0 + .5]), p)[0], *np.percentile(h[w][s], [25, 50, 75]), np.median(res[s])))
    sec = section(p); np.save(P + "plate_section_mm.npy", sec)
    prof = np.c_[np.linspace(0, p["R"], 400) * 1e-3, top_mm(np.linspace(0, p["R"], 400), p) * 1e-3]
    np.save(P + "plate_profile.npy", prof)
    print("section pts", len(sec), "y range", sec[:, 1].min(), sec[:, 1].max(), "r max", sec[:, 0].max())
