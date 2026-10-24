import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
DOC = """Approach B: rebuild the crust side.
1. curtain faces removed + top surface re-cut along a smooth footprint contour (fixB_cut.run)
2. new side wall generated along the (single) outer boundary loop: rounded crust bead down into the plate, undercut
   (lifted-edge) profile where the crust top is high above the plate (torn/folded side, rim overhang).
   Lower rings are offset along streamlines of the smooth footprint SDF (no crossing at concave corners) and use
   sub-sampled columns (zipper strip to the full-resolution top ring).
3. wall textured from a procedural crust strip (global, seamless noise in physical mm) packed into the atlas,
   colour matched to the scan's edge colour at the seam
4. smooth normals over top+wall (welded), plate re-used from composed.npz, GLB written + quantized.
Usage: fixB_build.py [out_name]   (writes fixB/<out_name>.glb, default pizza_plate)"""
import io, os, json, struct, subprocess, numpy as np, scipy.sparse as sp, scipy.ndimage as ndi
from PIL import Image
from fixB_common import *
from fixB_loops import boundary_loops
from fixB_raster import raster_top
import fixB_cut as cutmod
from glbio import read_glb
Image.MAX_IMAGE_PIXELS = None
OUT = sys.argv[1] if len(sys.argv) > 1 else "pizza_plate"
TEX, QUAL = 4096, 88
RHO = 5.0          # strip texels per mm (before atlas scale)
SINK = 1.0e-3      # wall bottom below the plate surface
K = 10             # wall rings below the top ring
COL_STEP = 1.4e-3  # column spacing of the lower rings (keeps total pizza verts < 65536 -> u16 indices)
TALL_A, TALL_B = 8e-3, 12.5e-3  # wall height range over which the bead blends into a lifted/folded edge (roll + shadowed undercut)
def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

# ------------------------------------------------------------------ 1. cut top surface
V, UV, F, sdf = cutmod.run(verbose=True)
wid = weld(V); nw = wid.max() + 1
Vw = np.zeros((nw, 3)); Vw[wid] = V
Fw = wid[F]
loops, Eb, multi = boundary_loops(Fw, nw)
assert len(loops) == 1 and multi == 0, (len(loops), multi)
L = loops[0]
tri = Vw[Fw]; fnr = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
Ntop = np.zeros((nw, 3))
for k in range(3): np.add.at(Ntop, Fw[:, k], fnr)
Ntop /= np.maximum(np.linalg.norm(Ntop, axis=1, keepdims=True), 1e-20)

# ------------------------------------------------------------------ 2. wall geometry
T = Vw[L].copy(); n = len(L)
seg = np.linalg.norm(np.roll(T, -1, 0) - T, axis=1)
s_col = np.r_[0, np.cumsum(seg)[:-1]]; PER = seg.sum()
print("boundary loop: %d verts, perimeter %.1f mm, edge len p5/50/95 %s mm" % (n, PER * 1e3, np.percentile(seg * 1e3, [5, 50, 95]).round(2)))

def smooth_loop(x, sigma_m):
    """Gaussian smoothing of per-column values along the closed loop by arc length (irregular spacing)."""
    x = np.asarray(x, float)
    ds = s_col[None, :] - s_col[:, None]; ds = (ds + PER / 2) % PER - PER / 2
    w = np.exp(-0.5 * (ds / sigma_m) ** 2) * ((seg + np.roll(seg, 1)) / 2)[None, :]
    w /= w.sum(1, keepdims=True)
    return w @ x

gy, gx = np.gradient(sdf, cutmod.PX)  # d/dz (rows), d/dx (cols)
def sdf_at(xz): return cutmod.sample(sdf, xz[:, 0], xz[:, 1])
def grad_at(xz): return np.c_[cutmod.sample(gx, xz[:, 0], xz[:, 1]), cutmod.sample(gy, xz[:, 0], xz[:, 1])]
o = -grad_at(T[:, [0, 2]])
o = smooth_loop(o, 2.0e-3); o /= np.linalg.norm(o, axis=1, keepdims=True)
ctr = Vw.mean(0); assert np.mean(np.einsum("ij,ij->i", o, T[:, [0, 2]] - ctr[[0, 2]])) > 0
O3 = np.c_[o[:, 0], np.zeros(n), o[:, 1]]
nt = smooth_loop(Ntop[L], 1.5e-3); nt /= np.linalg.norm(nt, axis=1, keepdims=True)
no = np.einsum("ij,ij->i", nt, O3); nyy = nt[:, 1]
th_top = np.degrees(np.arctan2(no, np.maximum(nyy, 0.05)))  # >0: surface descends outward at the edge
R_lim = (PAR["R"] - 0.3) * 1e-3
def plate_at(xz): return plate_y(xz[:, 0], xz[:, 1])
def clamp_r(xz):
    r = np.linalg.norm(xz, axis=1); return np.where((r > R_lim)[:, None], xz * (R_lim / np.maximum(r, 1e-9))[:, None], xz)
def offset_xz(p0, qoff, iters=40, maxstep=0.25e-3):
    """Move points along the SDF gradient streamline until sdf = sdf(p0) - qoff (qoff>0 outward)."""
    p = p0.copy(); target = sdf_at(p0) - qoff
    for _ in range(iters):
        g = grad_at(p); gn2 = np.maximum((g ** 2).sum(1), 0.25)
        step = ((sdf_at(p) - target) / gn2)[:, None] * g
        ln = np.linalg.norm(step, axis=1, keepdims=True); step *= np.minimum(1, maxstep / np.maximum(ln, 1e-12))
        p = p - step
    return p

gap0 = T[:, 1] - plate_at(T[:, [0, 2]])
print("wall height (top above plate) mm p5/25/50/75/95/max", np.percentile(gap0 * 1e3, [5, 25, 50, 75, 95, 100]).round(1))
H_s = smooth_loop(gap0 + SINK, 4e-3)                     # smooth height (shape parameters only)
tau = smooth_loop(smoothstep(TALL_A, TALL_B, H_s), 3e-3)  # 0: crust bead resting on the plate, 1: lifted/folded edge
thick_t = np.clip(0.6 * H_s, 6.5e-3, 10e-3)               # dough roll thickness on lifted edges
under = np.clip(H_s - thick_t, 0, None)
bx = smooth_loop((1 - tau) * 0.3e-3 + tau * -np.minimum(0.5 * under + 1e-3, 6e-3), 4e-3)
theta = np.radians(np.clip(smooth_loop(th_top, 2.5e-3) * (1 - 0.5 * tau) + 8.0, 5.0, 60.0))
Bxz = clamp_r(offset_xz(T[:, [0, 2]], bx))
By = plate_at(Bxz) - SINK
H = np.maximum(T[:, 1] - By, 0.6e-3)
bxe = sdf_at(T[:, [0, 2]]) - sdf_at(Bxz)  # effective outward offset after clamping
# control points (q outward, y up, relative to the top point), blended between bead (n) and roll (t)
Hn = H; thk = np.minimum(thick_t, 0.95 * H)
y1 = (1 - tau) * 0.42 * Hn + tau * 0.45 * thk
b1 = (1 - tau) * np.minimum(0.2 * Hn, 1.8e-3) + tau * np.minimum(0.32 * thk, 3.0e-3)
q2 = (1 - tau) * 0.6 * b1 + tau * -0.3e-3
y2 = (1 - tau) * 0.78 * Hn + tau * thk
t2 = np.stack([(1 - tau) * -0.25 + tau * -0.8, (1 - tau) * -1.0 + tau * -0.6], 1)
t3 = np.stack([(1 - tau) * -0.4 + tau * -0.15, -np.ones(n)], 1)
ctrl = [np.c_[np.zeros(n), np.zeros(n)], np.c_[b1, -y1], np.c_[q2, -y2], np.c_[bxe, -H]]
tang = [np.c_[np.cos(theta), -np.sin(theta)], np.c_[np.zeros(n), -np.ones(n)], t2, t3]
tang = [t / np.linalg.norm(t, axis=1, keepdims=True) for t in tang]
tt = np.linspace(0, 1, 33)[None, :]
h00 = 2 * tt ** 3 - 3 * tt ** 2 + 1; h10 = tt ** 3 - 2 * tt ** 2 + tt; h01 = -2 * tt ** 3 + 3 * tt ** 2; h11 = tt ** 3 - tt ** 2
qs = []; ys = []; seg_end = []
for k_ in range(3):
    p0, p1, m0, m1 = ctrl[k_], ctrl[k_ + 1], tang[k_], tang[k_ + 1]
    ch = np.linalg.norm(p1 - p0, axis=1)[:, None]
    qq = h00 * p0[:, :1] + h10 * ch * m0[:, :1] + h01 * p1[:, :1] + h11 * ch * m1[:, :1]
    yy = h00 * p0[:, 1:] + h10 * ch * m0[:, 1:] + h01 * p1[:, 1:] + h11 * ch * m1[:, 1:]
    if k_ > 0: qq, yy = qq[:, 1:], yy[:, 1:]
    qs.append(qq); ys.append(yy)
q = np.concatenate(qs, 1); yv = np.concatenate(ys, 1)
yv = np.minimum.accumulate(np.minimum(yv, 0), axis=1)
dl = np.hypot(np.diff(q, axis=1), np.diff(yv, axis=1)); cl = np.c_[np.zeros(n), np.cumsum(dl, 1)]
Lp = cl[:, -1]
d_fold = cl[:, 64]  # arc length at control point 2 (end of the dough roll)
thick = smooth_loop((1 - tau) * Lp + tau * d_fold, 3e-3)  # colour: dough down to here, shadowed underside below
# sub-sampled columns for the lower rings
targets = np.arange(0, PER - 0.5 * COL_STEP, COL_STEP)
sub = np.unique(np.clip(np.searchsorted(s_col, targets), 0, n - 1)); m = len(sub)
fr = (np.arange(K + 1) / K) ** 1.15
Dsub = Lp[sub, None] * fr[None, :]
Qs = np.zeros((m, K + 1)); Ys = np.zeros((m, K + 1))
for j, i in enumerate(sub):
    Qs[j] = np.interp(Dsub[j], cl[i], q[i]); Ys[j] = np.interp(Dsub[j], cl[i], yv[i])
WV = np.zeros((m, K + 1, 3))
for k in range(K + 1):
    xz = clamp_r(offset_xz(T[sub][:, [0, 2]], Qs[:, k]))
    WV[:, k, 0] = xz[:, 0]; WV[:, k, 2] = xz[:, 1]; WV[:, k, 1] = T[sub, 1] + Ys[:, k]
WV[:, K, 1] = np.minimum(WV[:, K, 1], plate_at(WV[:, K][:, [0, 2]]) - 0.5 * SINK)  # bottom ring inside the plate
WV[:, 0] = T[sub]
print("wall: %d columns (top ring %d), profile length mm p5/50/95/max %s, max bulge %.2f mm, undercut columns %d (max %.1f mm)" % (
    m, n, np.percentile(Lp * 1e3, [5, 50, 95, 100]).round(1), Qs.max() * 1e3, (bxe < -1e-3).sum(), -bxe.min() * 1e3))
print("lifted-edge weight tau>0.5 on %.0f%% of the loop" % (100 * (tau > 0.5).mean()))

# ------------------------------------------------------------------ 3. texture: atlas repack + strip patches
js, bin_ = read_glb(S + "polycam/raw/20.10.2026.glb")
im = js["images"][0]; bv = js["bufferViews"][im["bufferView"]]
src = Image.open(io.BytesIO(bin_[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])).convert("RGB")
SW, SH = src.size; srcA = np.asarray(src)
Hr, FIr, (uvr,) = raster_top(V, F, [UV], px_mm=0.2)
def scan_col(xz):
    Nr = uvr.shape[0]
    j = np.clip(np.round(cutmod.to_px(xz[:, 0])).astype(int), 0, Nr - 1); i = np.clip(np.round(cutmod.to_px(xz[:, 1])).astype(int), 0, Nr - 1)
    u = uvr[i, j, 0]; v = uvr[i, j, 1]
    ok = np.isfinite(u) & np.isfinite(v); u = np.nan_to_num(u); v = np.nan_to_num(v)
    c = srcA[np.clip((v * SH).astype(int), 0, SH - 1), np.clip((u * SW).astype(int), 0, SW - 1)].astype(float)
    return c, ok
def band(d0, d1, nsamp):
    allc = []; oks = []
    for d in np.linspace(d0, d1, nsamp):
        c, ok = scan_col(T[:, [0, 2]] - o * d); allc.append(c); oks.append(ok)
    return np.array(allc), np.array(oks)
cbe, oke = band(0.3e-3, 1.0e-3, 4)
c_edge = (cbe * oke[..., None]).sum(0) / np.maximum(oke.sum(0), 1)[:, None]
c_edge = smooth_loop(c_edge, 0.8e-3)
cb, okb = band(1.0e-3, 6e-3, 11)
lum = cb.mean(2); redness = cb[..., 0] - cb[..., 1]
crustlike = okb & (lum > 140) & (redness < 75)
DOUGH_GOLD = np.array([212., 166., 104.])
cc = (cb * crustlike[..., None]).sum(0) / np.maximum(crustlike.sum(0), 1)[:, None]
frac = crustlike.mean(0)
c_crust = np.where(frac[:, None] > 0.15, cc, DOUGH_GOLD)
c_crust = smooth_loop(c_crust, 6e-3); frac_s = np.clip(smooth_loop(frac, 6e-3), 0.3, 1)
c_crust = c_crust * frac_s[:, None] + DOUGH_GOLD * (1 - frac_s)[:, None]
print("edge colour mean", c_edge.mean(0).round(0), " crust colour mean", c_crust.mean(0).round(0), " crust-like fraction mean %.2f" % frac.mean())

# strip segments: boundaries on sub-columns
NSEG = 8
jb = [int(round(k * m / NSEG)) for k in range(NSEG)] + [m]
PADS = 3
s_sub = s_col[sub]
def s_of_sub(j): return PER if j == m else s_sub[j]
segs = []
for k in range(NSEG):
    ja, jb_ = jb[k], jb[k + 1]
    s0, s1 = s_of_sub(ja), s_of_sub(jb_)
    ca = sub[ja]; cb_ = n if jb_ == m else sub[jb_]
    dmax = Lp[np.r_[np.arange(ca, cb_), cb_ % n]].max()
    segs.append(dict(j=(ja, jb_), c=(ca, cb_), s0=s0, s1=s1, w=int(np.ceil((s1 - s0) * 1e3 * RHO)) + 2 * PADS, h=int(np.ceil(dmax * 1e3 * RHO)) + 2 * PADS))
print("strip segments (px):", [(g["w"], g["h"]) for g in segs])

nf = len(F)
Mx = sp.csr_matrix((np.ones(3 * nf), (np.repeat(np.arange(nf), 3), F.ravel())), shape=(nf, len(V)))
nc, fcl = sp.csgraph.connected_components(Mx @ Mx.T, directed=False)
vch = np.zeros(len(V), np.int64); vch[F.ravel()] = np.repeat(fcl, 3)
px = UV[:, 0] * SW; py = UV[:, 1] * SH
pad = 3
x0 = np.full(nc, np.inf); y0 = np.full(nc, np.inf); x1 = np.full(nc, -np.inf); y1 = np.full(nc, -np.inf)
np.minimum.at(x0, vch, px); np.minimum.at(y0, vch, py); np.maximum.at(x1, vch, px); np.maximum.at(y1, vch, py)
x0 = np.clip(np.floor(x0) - pad, 0, SW).astype(int); y0 = np.clip(np.floor(y0) - pad, 0, SH).astype(int)
x1 = np.clip(np.ceil(x1) + pad, 0, SW).astype(int); y1 = np.clip(np.ceil(y1) + pad, 0, SH).astype(int)
w = np.r_[x1 - x0, [g["w"] for g in segs]]; h = np.r_[y1 - y0, [g["h"] for g in segs]]
nc_real = nc; ncall = nc + NSEG
def shelf(s, Ls):
    dw = np.maximum(np.ceil(w * s).astype(int), 2); dh = np.maximum(np.ceil(h * s).astype(int), 2)
    order = np.argsort(-dh); X = np.zeros(ncall, int); Yp = np.zeros(ncall, int); cx = cy = rowh = 0
    for i in order:
        if cx + dw[i] > Ls: cx = 0; cy += rowh + 1; rowh = 0
        X[i], Yp[i] = cx, cy; cx += dw[i] + 1; rowh = max(rowh, dh[i])
    return cy + rowh <= Ls, X, Yp, dw, dh
lo, hi = 0.1, 1.0
if shelf(1.0, TEX)[0]: s_at = 1.0
else:
    for _ in range(25):
        mid = (lo + hi) / 2
        if shelf(mid, TEX)[0]: lo = mid
        else: hi = mid
    s_at = lo
ok, X, Yp, dw, dh = shelf(s_at, TEX)
print("atlas %d: chart scale %.3f (effective source texels kept %.0f%%)" % (TEX, s_at, 100 * s_at * s_at))
mean_col = tuple(int(c) for c in np.asarray(src.resize((256, 256), Image.BOX)).reshape(-1, 3).mean(0))
dst = Image.new("RGB", (TEX, TEX), mean_col)
for i in range(nc_real):
    crop = src.crop((x0[i], y0[i], x1[i], y1[i]))
    if (dw[i], dh[i]) != crop.size: crop = crop.resize((dw[i], dh[i]), Image.LANCZOS)
    dst.paste(crop, (X[i], Yp[i]))
sx = dw[:nc_real] / w[:nc_real]; sy = dh[:nc_real] / h[:nc_real]
UVt = np.c_[(X[vch] + (px - x0[vch]) * sx[vch]) / TEX, (Yp[vch] + (py - y0[vch]) * sy[vch]) / TEX]

# ---- procedural crust strip (noise defined globally in physical mm -> seamless across segments)
PER_mm = PER * 1e3
def make_noise(cell_s, cell_d, seed):
    ns = max(8, int(round(PER_mm / cell_s))); cs = PER_mm / ns; nd = int(np.ceil(45 / cell_d)) + 6
    g = np.random.default_rng(seed).random((nd, ns))
    g = ndi.spline_filter(g, order=3, mode="grid-wrap")
    return lambda Smm, Dmm: ndi.map_coordinates(g, [Dmm / cell_d + 2, (Smm % PER_mm) / cs], order=3, mode="grid-wrap", prefilter=False)
N_fine = make_noise(1.1, 0.8, 11); N_mid = make_noise(3.5, 2.2, 12); N_big = make_noise(9.0, 5.0, 13); N_spk = make_noise(0.45, 0.45, 14)
order_ = np.argsort(s_col)
def at(v, sm):
    xp = np.r_[s_col[order_] - PER, s_col[order_], s_col[order_] + PER]
    if v.ndim == 1: return np.interp(sm, xp, np.r_[v[order_], v[order_], v[order_]])
    return np.stack([np.interp(sm, xp, np.r_[v[order_, c], v[order_, c], v[order_, c]]) for c in range(v.shape[1])], 1)
def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
PALE = np.array([224., 182., 122.]); GOLD = np.array([204., 144., 76.]); BROWN = np.array([158., 96., 46.])
UNDER = np.array([176., 136., 92.]); DARK = np.array([112., 90., 70.])
def crust_colour(Smm, Dmm, ce, ccr, lp, th_, tw):
    """Smm, Dmm: (h,w) mm along the loop / down the profile; per-column params broadcast as (1,w[,3]).
    tw: lifted/folded-edge weight (roll of folded dough over a shadowed underside)."""
    nf_, nm_, nb_, ns_ = N_fine(Smm, Dmm), N_mid(Smm, Dmm), N_big(Smm, Dmm), N_spk(Smm, Dmm)
    twc = tw[..., None]
    # baked rim band right under the top edge
    rim_w = np.clip(0.35 * th_, 1.5, 3.5)
    t_rim = smoothstep(0.5 * rim_w, 1.5 * rim_w + 1.5 * (nb_ - 0.5), Dmm)
    gold = ccr * 0.5 + GOLD * 0.5
    bm = (np.clip((nm_ - 0.42) * 2.0, 0, 1) * 0.55 + np.clip((nb_ - 0.5) * 1.2, 0, 0.3))[..., None]
    rimc = gold * (1 - bm) + BROWN * bm
    # dough side: pale with golden blotches; on folded edges the visible dough is the baked underside -> more golden/brown
    gside = (np.clip((nm_ - 0.35) * 1.4, 0, 1) * 0.45 + np.clip((nb_ - 0.45), 0, 0.4))[..., None]
    side = PALE * (1 - gside) + GOLD * gside
    under_bake = GOLD * (1 - np.clip((nm_ - 0.4) * 1.8, 0, 0.7))[..., None] + BROWN * np.clip((nm_ - 0.4) * 1.8, 0, 0.7)[..., None]
    side = side * (1 - 0.5 * twc) + under_bake * (0.5 * twc)
    col = rimc * (1 - t_rim[..., None]) + side * t_rim[..., None]
    # shadowed underside below the roll
    t_u = smoothstep(th_ - 1.5, th_ + 2.5, Dmm) * tw
    crease = np.exp(-0.5 * ((Dmm - th_) / 0.9) ** 2) * tw
    t_dark = smoothstep(th_ + 1.0, lp - 0.5, Dmm)
    underc = UNDER * (1 - 0.8 * t_dark[..., None]) + DARK * (0.8 * t_dark[..., None])
    col = col * (1 - t_u[..., None]) + underc * t_u[..., None]
    col = col * (1 - 0.22 * crease)[..., None]
    # seam: match the scan's own edge colour over the first ~1 mm
    t_e = 1 - smoothstep(0.2, 1.2, Dmm)
    col = col * (1 - t_e[..., None]) + ce * t_e[..., None]
    # grain + irregular baked specks (density varies along the rim)
    col = col * (1 + 0.08 * (nf_ - 0.5) + 0.04 * (ns_ - 0.5))[..., None]
    thr = 0.86 + 0.10 * (nb_ - 0.5) - 0.03 * tw
    spk = np.clip((ns_ - thr) * 7, 0, 1) * (Dmm > 0.8) * (Dmm < th_ + 0.5)
    col = col * (1 - 0.30 * spk)[..., None]
    ao = 1 - 0.32 * smoothstep(lp - 3.0, lp - 0.7, Dmm) * (1 - 0.6 * tw)
    return np.clip(col * ao[..., None], 0, 255)

def strip_patch(g, k_scale):
    W_, H_ = max(int(np.ceil(g["w"] * k_scale)), 2), max(int(np.ceil(g["h"] * k_scale)), 2)
    ii = (np.arange(W_) + 0.5) / k_scale; jj = (np.arange(H_) + 0.5) / k_scale
    s = g["s0"] + (ii - PADS) / RHO * 1e-3; d = np.clip((jj - PADS) / RHO * 1e-3, 0, None)
    sm = s % PER
    ce = at(c_edge, sm)[None]; ccr = at(c_crust, sm)[None]; lp = at(Lp, sm)[None] * 1e3; th_ = at(thick, sm)[None] * 1e3; tw = at(tau, sm)[None]
    Smm, Dmm = np.meshgrid(s * 1e3, d * 1e3, indexing="xy")
    return crust_colour(Smm, Dmm, ce, ccr, lp, th_, tw).astype(np.uint8)

dbg_patches = []
for k, g in enumerate(segs):
    i = nc_real + k
    ksc = dw[i] / w[i]
    patch = strip_patch(g, ksc)
    dst.paste(Image.fromarray(patch[:dh[i], :dw[i]]), (X[i], Yp[i]))
    g["X"], g["Y"], g["k"] = X[i], Yp[i], ksc
    dbg_patches.append(patch)
_W = max(p.shape[1] for p in dbg_patches)
Image.fromarray(np.concatenate([np.pad(p, ((0, 4), (0, _W - p.shape[1]), (0, 0)), constant_values=255) for p in dbg_patches], 0)).save(FB + OUT + "_strip.png")
def uv_of(g, s_m, d_m): return np.c_[(g["X"] + (PADS + (s_m - g["s0"]) * 1e3 * RHO) * g["k"]) / TEX, (g["Y"] + (PADS + d_m * 1e3 * RHO) * g["k"]) / TEX]

# ---- wall mesh per segment: zipper (top ring, all boundary verts) -> ring 1 (sub columns), then grid
wallV = []; wallUV = []; wallF = []; base = 0
for g in segs:
    ja, jb_ = g["j"]; ca, cb_ = g["c"]
    cols0 = np.arange(ca, cb_ + 1)                 # top ring columns (cb_ may be n -> wraps to 0)
    js_ = np.arange(ja, jb_ + 1)                   # sub columns (jb_ may be m -> wraps to 0)
    s0c = np.where(cols0 == n, PER, s_col[cols0 % n])
    ssub = np.where(js_ == m, PER, s_sub[js_ % m])
    top_v = T[cols0 % n]; top_uv = uv_of(g, s0c, np.zeros(len(cols0)))
    lowP = WV[js_ % m, 1:]                        # (nj, K, 3)
    lowD = Dsub[js_ % m, 1:]
    low_uv = np.stack([uv_of(g, ssub, lowD[:, k]) for k in range(K)], 1)  # (nj, K, 2)
    nt0 = len(cols0); nj = len(js_)
    wallV += [top_v, lowP.reshape(-1, 3)]; wallUV += [top_uv, low_uv.reshape(-1, 2)]
    tid = base + np.arange(nt0); lid = base + nt0 + np.arange(nj * K).reshape(nj, K)
    fl = []
    for jj in range(nj - 1):
        a = int(np.searchsorted(cols0, sub[js_[jj] % m] if js_[jj] < m else n)); b = int(np.searchsorted(cols0, sub[js_[jj + 1] % m] if js_[jj + 1] < m else n))
        mid = (a + b) // 2
        for c in range(a, b):
            fl.append([tid[c], tid[c + 1], lid[jj, 0] if c < mid else lid[jj + 1, 0]])
        fl.append([tid[mid], lid[jj + 1, 0], lid[jj, 0]])
    A_ = lid[:-1, :-1]; B_ = lid[1:, :-1]; C_ = lid[1:, 1:]; D_ = lid[:-1, 1:]
    fl = np.r_[np.array(fl), np.c_[A_.ravel(), B_.ravel(), C_.ravel()], np.c_[A_.ravel(), C_.ravel(), D_.ravel()]]
    wallF.append(fl); base += nt0 + nj * K
wallV = np.concatenate(wallV); wallUV = np.concatenate(wallUV); wallF = np.concatenate(wallF)
fnw = np.cross(wallV[wallF[:, 1]] - wallV[wallF[:, 0]], wallV[wallF[:, 2]] - wallV[wallF[:, 0]])
outv = wallV[wallF].mean(1)[:, [0, 2]] - ctr[[0, 2]]
if np.mean(np.einsum("ij,ij->i", fnw[:, [0, 2]], outv) > 0) < 0.5: wallF = wallF[:, [0, 2, 1]]
fnw = np.cross(wallV[wallF[:, 1]] - wallV[wallF[:, 0]], wallV[wallF[:, 2]] - wallV[wallF[:, 0]])
outfrac = np.einsum("ij,ij->i", fnw[:, [0, 2]], outv) > 0
print("wall: %d verts %d faces; outward-facing fraction %.3f (area-weighted %.3f)" % (len(wallV), len(wallF), outfrac.mean(), (np.linalg.norm(fnw, axis=1) * outfrac).sum() / np.linalg.norm(fnw, axis=1).sum()))

buf = io.BytesIO(); dst.save(buf, "JPEG", quality=QUAL, optimize=True, progressive=False, subsampling=2)
jpg = buf.getvalue(); print("texture JPEG %dx%d q%d: %.2f MB" % (TEX, TEX, QUAL, len(jpg) / 1e6))
open(FB + OUT + "_tex.jpg", "wb").write(jpg)

# ------------------------------------------------------------------ 4. normals over top + wall (welded by position)
allV = np.r_[V, wallV]; allF = np.r_[F, wallF + len(V)]; allUV = np.r_[UVt, wallUV]
wa = weld(allV, 1e-6); na = wa.max() + 1
Fa = wa[allF]; tri = allV[allF]; fr_ = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
fu = fr_ / np.maximum(np.linalg.norm(fr_, axis=1, keepdims=True), 1e-30)
Na = np.zeros((na, 3))
for k in range(3):
    e1 = tri[:, (k + 1) % 3] - tri[:, k]; e2 = tri[:, (k + 2) % 3] - tri[:, k]
    ang = np.arccos(np.clip(np.einsum("ij,ij->i", e1, e2) / np.maximum(np.linalg.norm(e1, axis=1) * np.linalg.norm(e2, axis=1), 1e-30), -1, 1))
    np.add.at(Na, Fa[:, k], fu * ang[:, None])
Na /= np.maximum(np.linalg.norm(Na, axis=1, keepdims=True), 1e-20)
istop_only = np.ones(na, bool); istop_only[wa[len(V):]] = False
Na_area = np.zeros((na, 3))
for k in range(3): np.add.at(Na_area, Fa[:, k], fr_)
Na_area /= np.maximum(np.linalg.norm(Na_area, axis=1, keepdims=True), 1e-20)
Na[istop_only] = Na_area[istop_only]
allN = Na[wa]
pzV, pzN, pzUV, pzF = allV, allN, allUV, allF
d0 = np.load(P + "composed.npz"); plV, plN, plF = d0["plV"], d0["plN"], d0["plF"]
np.savez(FB + OUT + "_composed.npz", pzV=pzV, pzN=pzN, pzUV=pzUV, pzF=pzF, plV=plV, plN=plN, plF=plF, nTop=len(V))
print("pizza total: %d verts %d faces (top %d + wall %d)" % (len(pzV), len(pzF), len(F), len(wallF)))
print("pizza y range %.2f .. %.2f mm; plate y max %.2f mm" % (pzV[:, 1].min() * 1e3, pzV[:, 1].max() * 1e3, plV[:, 1].max() * 1e3))

# ------------------------------------------------------------------ 5. GLB
def pad4(b, ch=b"\x00"): return b + ch * ((4 - len(b) % 4) % 4)
parts = []; views = []; accs = []; off = 0
def add(arr, comp, typ, target=None, minmax=False):
    global off
    raw = arr.tobytes(); views.append({"buffer": 0, "byteOffset": off, "byteLength": len(raw), **({"target": target} if target else {})})
    a = {"bufferView": len(views) - 1, "componentType": comp, "count": int(len(arr)), "type": typ}
    if minmax: a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
    accs.append(a); parts.append(pad4(raw)); off += len(pad4(raw)); return len(accs) - 1
f32 = lambda a: np.ascontiguousarray(a, np.float32)
pz_attr = {"POSITION": add(f32(pzV), 5126, "VEC3", 34962, True), "NORMAL": add(f32(pzN), 5126, "VEC3", 34962), "TEXCOORD_0": add(f32(pzUV), 5126, "VEC2", 34962)}
pz_ind = add(np.ascontiguousarray(pzF.reshape(-1), np.uint32), 5125, "SCALAR", 34963)
pl_attr = {"POSITION": add(f32(plV), 5126, "VEC3", 34962, True), "NORMAL": add(f32(plN), 5126, "VEC3", 34962)}
pl_ind = add(np.ascontiguousarray(plF.reshape(-1), np.uint32), 5125, "SCALAR", 34963)
views.append({"buffer": 0, "byteOffset": off, "byteLength": len(jpg)}); parts.append(pad4(jpg)); off += len(pad4(jpg))
gl = {"asset": {"version": "2.0", "generator": "plate-pipeline fixB (scanned pizza, rebuilt crust side + procedural plate)"},
      "scene": 0, "scenes": [{"name": "pizza_on_plate", "nodes": [0]}],
      "nodes": [{"name": "pizza_on_plate", "children": [1, 2]}, {"name": "plate", "mesh": 0}, {"name": "pizza", "mesh": 1}],
      "meshes": [{"name": "plate", "primitives": [{"attributes": pl_attr, "indices": pl_ind, "material": 0}]},
                 {"name": "pizza", "primitives": [{"attributes": pz_attr, "indices": pz_ind, "material": 1}]}],
      "materials": [{"name": "white_ceramic", "pbrMetallicRoughness": {"baseColorFactor": [0.93, 0.93, 0.91, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.25}},
                    {"name": "pizza_scan", "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 0.85}}],
      "textures": [{"source": 0, "sampler": 0}], "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
      "images": [{"name": "pizza_basecolor", "bufferView": len(views) - 1, "mimeType": "image/jpeg"}],
      "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": off}]}
jbin = pad4(json.dumps(gl, separators=(",", ":")).encode(), b" "); binb = b"".join(parts)
outf = FB + OUT + "_float.glb"
with open(outf, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(jbin) + 8 + len(binb)))
    f.write(struct.pack("<II", len(jbin), 0x4E4F534A)); f.write(jbin); f.write(struct.pack("<II", len(binb), 0x004E4942)); f.write(binb)
outq = FB + OUT + ".glb"
subprocess.run(["gltf-transform", "quantize", outf, outq], check=True, capture_output=True)
print("wrote %s (%.2f MB float) and %s (%.2f MB quantized)" % (outf, os.path.getsize(outf) / 1e6, outq, os.path.getsize(outq) / 1e6))
