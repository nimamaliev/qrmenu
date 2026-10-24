"""Compose levelled scanned pizza + procedural plate, smooth normals, edge skirt down into the plate,
texture re-pack of the pizza UV charts into a 4096 JPEG atlas, write float GLB + intermediate npz (for USDZ)."""
import sys, io, json, struct, numpy as np, scipy.sparse as sp
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
from plate_model import top_mm, PAR, section, revolve
from glbio import read_glb
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
SRC = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/polycam/raw/20.10.2026.glb"
TEX = int(sys.argv[1]) if len(sys.argv) > 1 else 4096
QUAL = int(sys.argv[2]) if len(sys.argv) > 2 else 88
d = np.load(P + "faces.npz"); V, UV, F = d["V"], d["UV"], d["F"]
T = np.load(P + "level_T.npy"); keep = np.load(P + "pizza_faces.npy")
Vl = V @ T[:3, :3].T + T[:3, 3]
Fk = F[keep]; used, inv = np.unique(Fk, return_inverse=True)
Vp = Vl[used]; UVp = UV[used]; Fp = inv.reshape(-1, 3)
rv = np.hypot(Vp[:, 0], Vp[:, 2]); lim = (PAR['R'] - 0.4) * 1e-3; o = rv > lim
Vp[o, 0] *= lim / rv[o]; Vp[o, 2] *= lim / rv[o]; print('pulled %d pizza vertices radially inside the lip (max shift %.2f mm)' % (o.sum(), (rv[o].max() - lim) * 1e3 if o.any() else 0))
print("pizza: %d verts %d faces" % (len(Vp), len(Fp)))
# ---------------- welded topology
_, wid = np.unique(np.round(Vp / 2e-6).astype(np.int64), axis=0, return_inverse=True); wid = wid.ravel(); nw = wid.max() + 1
Fw = wid[Fp]
tri = Vp[Fp]; fnr = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])  # area-weighted
print("pizza faces with downward normal: %.1f%%" % (100 * (fnr[:, 1] < 0).mean()))
Nw = np.zeros((nw, 3))
for k in range(3): np.add.at(Nw, Fw[:, k], fnr)
Nw /= np.maximum(np.linalg.norm(Nw, axis=1, keepdims=True), 1e-20)
Np = Nw[wid]
# ---------------- boundary edges (welded) and skirt
E = np.r_[np.c_[Fp[:, 0], Fp[:, 1]], np.c_[Fp[:, 1], Fp[:, 2]], np.c_[Fp[:, 2], Fp[:, 0]]]
EF = np.r_[np.arange(len(Fp)), np.arange(len(Fp)), np.arange(len(Fp))]
Ew = np.sort(wid[E], axis=1); key = Ew[:, 0] * nw + Ew[:, 1]
uk, ui, cnt = np.unique(key, return_index=True, return_counts=True)
bnd = ui[cnt == 1]; Eb = E[bnd]; fb = EF[bnd]
R = PAR["R"]
def S_m(xz):
    r = np.hypot(xz[:, 0], xz[:, 1]) * 1e3; return top_mm(np.minimum(r, R)) * 1e-3, r
ya = Vp[Eb[:, 0], 1]; yb = Vp[Eb[:, 1], 1]
Sa, ra = S_m(Vp[Eb[:, 0]][:, [0, 2]]); Sb, rb = S_m(Vp[Eb[:, 1]][:, [0, 2]])
ga = (ya - Sa) * 1e3; gb = (yb - Sb) * 1e3
print("boundary edges: %d; boundary vertex gap above plate (mm): p5 %.2f p25 %.2f p50 %.2f p75 %.2f p95 %.2f max %.2f" % (len(Eb), *np.percentile(np.r_[ga, gb], [5, 25, 50, 75, 95]), max(ga.max(), gb.max())))
need = (np.maximum(ga, gb) > -0.3)
tall = np.maximum(ga, gb) > 4.0  # lifted torn edge: shade with a crust->shadow gradient instead of stretched texels
print("skirt edges: %d, of which tall (>4mm) %d (skipped, already sunk: %d)" % (need.sum(), (need & tall).sum(), (np.maximum(ga, gb) <= -0.3).sum()))
Eb, fb, Sa, Sb, tall = Eb[need], fb[need], Sa[need], Sb[need], tall[need]
ns = len(Eb)
a_top = Vp[Eb[:, 0]]; b_top = Vp[Eb[:, 1]]
a_bot = a_top.copy(); a_bot[:, 1] = np.minimum(a_top[:, 1], Sa) - 0.0012
b_bot = b_top.copy(); b_bot[:, 1] = np.minimum(b_top[:, 1], Sb) - 0.0012
SV = np.stack([a_top, b_top, b_bot, a_bot], 1)  # quad per edge
SUVidx = np.stack([Eb[:, 0], Eb[:, 1], Eb[:, 1], Eb[:, 0]], 1)  # source pizza vertex for UV
qn = np.cross(SV[:, 1] - SV[:, 0], SV[:, 3] - SV[:, 0])
outward = 0.5 * (a_top + b_top) - Vp[Fp[fb]].mean(1); outward[:, 1] = 0
flip = np.einsum("ij,ij->i", qn, outward) < 0
SV[flip] = SV[flip][:, [1, 0, 3, 2]]; SUVidx[flip] = SUVidx[flip][:, [1, 0, 3, 2]]
STOP = np.tile([True, True, False, False], (ns, 1))  # which quad corners are on top (order preserved by the flip)
qn = np.cross(SV[:, 1] - SV[:, 0], SV[:, 3] - SV[:, 0]); qn /= np.maximum(np.linalg.norm(qn, axis=1, keepdims=True), 1e-20)
# blend skirt normal with the top-vertex smooth normal at the top for softer shading
SN = np.repeat(qn[:, None], 4, 1)
skV = SV.reshape(-1, 3); skN = SN.reshape(-1, 3); skSrc = SUVidx.reshape(-1)
base = len(Vp) + np.arange(ns) * 4
skF = np.r_[np.c_[base, base + 1, base + 2], np.c_[base, base + 2, base + 3]]
print("skirt: %d quads, height mm p50 %.2f max %.2f" % (ns, np.median((SV[:, 0, 1] - SV[:, 3, 1]) * 1e3), ((SV[:, :2, 1] - SV[:, 2:, 1][:, ::-1]) * 1e3).max()))
# ---------------- texture repack (charts = components over shared original vertices)
js, bin_ = read_glb(SRC)
im = js["images"][0]; bv = js["bufferViews"][im["bufferView"]]
src = Image.open(io.BytesIO(bin_[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])).convert("RGB")
SW, SH = src.size
nf = len(Fp)
M = sp.csr_matrix((np.ones(3 * nf), (np.repeat(np.arange(nf), 3), Fp.ravel())), shape=(nf, len(Vp)))
nc, fcl = sp.csgraph.connected_components(M @ M.T, directed=False)
vch = np.zeros(len(Vp), np.int64); vch[Fp.ravel()] = np.repeat(fcl, 3)
px = UVp[:, 0] * SW; py = UVp[:, 1] * SH
pad = 3
x0 = np.full(nc, np.inf); y0 = np.full(nc, np.inf); x1 = np.full(nc, -np.inf); y1 = np.full(nc, -np.inf)
np.minimum.at(x0, vch, px); np.minimum.at(y0, vch, py); np.maximum.at(x1, vch, px); np.maximum.at(y1, vch, py)
x0 = np.clip(np.floor(x0) - pad, 0, SW).astype(int); y0 = np.clip(np.floor(y0) - pad, 0, SH).astype(int)
x1 = np.clip(np.ceil(x1) + pad, 0, SW).astype(int); y1 = np.clip(np.ceil(y1) + pad, 0, SH).astype(int)
w = x1 - x0; h = y1 - y0
GW, GH = 24, 128  # gradient patch for tall skirts (packed as an extra pseudo-chart)
w = np.r_[w, GW]; h = np.r_[h, GH]; nc_real = nc; nc = nc + 1
print("charts %d, bbox area %.1f Mpx (source %dx%d)" % (nc, (w * h).sum() / 1e6, SW, SH))
def shelf(s, L):
    dw = np.maximum(np.ceil(w * s).astype(int), 2); dh = np.maximum(np.ceil(h * s).astype(int), 2)
    order = np.argsort(-dh); X = np.zeros(nc, int); Y = np.zeros(nc, int); cx = cy = rowh = 0
    for i in order:
        if cx + dw[i] > L: cx = 0; cy += rowh + 1; rowh = 0
        X[i], Y[i] = cx, cy; cx += dw[i] + 1; rowh = max(rowh, dh[i])
    return cy + rowh <= L, X, Y, dw, dh
lo, hi = 0.1, 1.0
ok, *_ = shelf(1.0, TEX)
if ok: s = 1.0
else:
    for _ in range(25):
        mid = (lo + hi) / 2
        if shelf(mid, TEX)[0]: lo = mid
        else: hi = mid
    s = lo
ok, X, Y, dw, dh = shelf(s, TEX)
print("atlas %d: chart scale %.3f (effective source texels kept %.0f%%)" % (TEX, s, 100 * s * s))
mean_col = tuple(int(c) for c in np.asarray(src.resize((256, 256), Image.BOX)).reshape(-1, 3).mean(0))
dst = Image.new("RGB", (TEX, TEX), mean_col)
# patch covers 0..GDEPTH mm below the lifted edge: pale dough edge (~2.5 mm) -> deep shadow -> shadowed plate grey
GDEPTH = 25.0; tt_ = np.linspace(0, GDEPTH, dh[-1])
kx = [0.0, 2.5, 5.0, 9.0, 25.0]; kc = np.array([[208, 176, 130], [176, 146, 104], [92, 78, 64], [78, 70, 62], [128, 124, 118.]])
gpatch = np.stack([np.interp(tt_, kx, kc[:, k]) for k in range(3)], 1).astype(np.uint8)
dst.paste(Image.fromarray(np.repeat(gpatch[:, None, :], dw[-1], 1)), (X[-1], Y[-1]))
for i in range(nc_real):
    crop = src.crop((x0[i], y0[i], x1[i], y1[i]))
    if (dw[i], dh[i]) != crop.size: crop = crop.resize((dw[i], dh[i]), Image.LANCZOS)
    dst.paste(crop, (X[i], Y[i]))
sx = dw / w; sy = dh / h
c = vch
UVn = np.c_[(X[c] + (px - x0[c]) * sx[c]) / TEX, (Y[c] + (py - y0[c]) * sy[c]) / TEX]
buf = io.BytesIO(); dst.save(buf, "JPEG", quality=QUAL, optimize=True, progressive=False, subsampling=0 if QUAL >= 92 else 2)
jpg = buf.getvalue(); print("texture JPEG %dx%d q%d: %.2f MB" % (TEX, TEX, QUAL, len(jpg) / 1e6))
open(P + "pizza_tex.jpg", "wb").write(jpg)
# ---------------- assemble pizza (+skirt) and plate
skUV = UVn[skSrc].copy()
gu = (X[-1] + dw[-1] / 2) / TEX; gv0 = (Y[-1] + 2.0) / TEX; gv1 = (Y[-1] + dh[-1] - 2.0) / TEX
tq = np.repeat(tall, 4); topc = STOP.reshape(-1)
depth = np.clip((np.repeat(np.max(SV[:, :2, 1], 1), 4) - skV[:, 1]) * 1e3, 0, GDEPTH)  # mm below the higher top corner
skUV[tq, 0] = gu; skUV[tq, 1] = gv0 + (gv1 - gv0) * depth[tq] / GDEPTH
pzV = np.r_[Vp, skV]; pzN = np.r_[Np, skN]; pzUV = np.r_[UVn, skUV]; pzF = np.r_[Fp, skF]
sec = section(PAR); plV, plN, plF = revolve(sec, 160)
print("plate: %d verts %d faces; bounds %s .. %s" % (len(plV), len(plF), plV.min(0).round(4), plV.max(0).round(4)))
np.savez(P + "composed.npz", pzV=pzV, pzN=pzN, pzUV=pzUV, pzF=pzF, plV=plV, plN=plN, plF=plF)
# ---------------- write GLB (float), then quantize with gltf-transform CLI
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
gl = {"asset": {"version": "2.0", "generator": "plate-pipeline (scanned pizza + procedural plate)"},
      "scene": 0, "scenes": [{"name": "pizza_on_plate", "nodes": [0]}],
      "nodes": [{"name": "pizza_on_plate", "children": [1, 2]}, {"name": "plate", "mesh": 0}, {"name": "pizza", "mesh": 1}],
      "meshes": [{"name": "plate", "primitives": [{"attributes": pl_attr, "indices": pl_ind, "material": 0}]},
                 {"name": "pizza", "primitives": [{"attributes": pz_attr, "indices": pz_ind, "material": 1}]}],
      "materials": [{"name": "white_ceramic", "pbrMetallicRoughness": {"baseColorFactor": [0.93, 0.93, 0.91, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.25}},
                    {"name": "pizza_scan", "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 0.85}}],
      "textures": [{"source": 0, "sampler": 0}], "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
      "images": [{"name": "pizza_basecolor", "bufferView": len(views) - 1, "mimeType": "image/jpeg"}],
      "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": off}]}
jb = pad4(json.dumps(gl, separators=(",", ":")).encode(), b" "); binb = b"".join(parts)
out = P + "pizza_plate_float.glb"
with open(out, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(binb)))
    f.write(struct.pack("<II", len(jb), 0x4E4F534A)); f.write(jb); f.write(struct.pack("<II", len(binb), 0x004E4942)); f.write(binb)
print("wrote", out, "%.2f MB" % ((12 + 16 + len(jb) + len(binb)) / 1e6))
