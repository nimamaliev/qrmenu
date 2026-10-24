"""Create final_build.py from fixB_build.py with the final grafts (settle of the high non-tear arcs, contact clamp,
grey/pale edge-texel neutralisation, varied underside colour). fixB_build.py itself is left untouched."""
S = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/"
src = open(S + "scripts/fixB_build.py").read()
def rep(old, new, count=1):
    global src
    assert src.count(old) == count, (old[:60], src.count(old))
    src = src.replace(old, new)

rep('DOC = """Approach B: rebuild the crust side.', 'DOC = """FINAL build = Approach B (rebuild the crust side) + grafts: selective settle of the high non-tear arcs,\ncontact clamp, grey/pale edge-texel neutralisation, varied underside colour.\nApproach B:')
rep('OUT = sys.argv[1] if len(sys.argv) > 1 else "pizza_plate"',
    'OUT = sys.argv[1] if len(sys.argv) > 1 else "final"\nWD = S + "final/work/"; os.makedirs(WD, exist_ok=True)\nSETTLE_GT = float(os.environ.get("SETTLE_GT", "5.0")) * 1e-3  # target edge height above the plate on settled arcs (<=0: off)\nRECOLOUR = os.environ.get("RECOLOUR", "1") == "1"')
# move "import os" before use: the original imports os on the next line already; put OUT block after imports
rep('import io, os, json, struct, subprocess, numpy as np, scipy.sparse as sp, scipy.ndimage as ndi\n', '')
rep('import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")\n',
    'import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")\nimport io, os, json, struct, subprocess, numpy as np, scipy.sparse as sp, scipy.ndimage as ndi\n')

rep('V, UV, F, sdf = cutmod.run(verbose=True)\n', r'''cutmod.FB = WD  # cut.npz goes to final/work (fixB/cut.npz is not touched)
V, UV, F, sdf = cutmod.run(verbose=True)

# ------------------------------------------------------------------ 1b. FINAL graft: settle the high non-tear arcs
# On the arc opposite the tear (polar 210-310 deg, atan2(z, x)) the scan's crust top sits 8-14 mm above the plate,
# which made B's wall read as a thick pie crust. Lower the edge band smoothly to SETTLE_GT above the plate there
# (falloff over 10-24 mm inward). The torn/folded side (polar 0-45) and the left step flap (195-210) are not touched.
from scipy.spatial import cKDTree
_w0 = weld(V); _n0 = _w0.max() + 1; _Vw0 = np.zeros((_n0, 3)); _Vw0[_w0] = V
_L0 = boundary_loops(_w0[F], _n0)[0][0]; B0 = _Vw0[_L0]
_sg = np.linalg.norm(np.roll(B0, -1, 0) - B0, axis=1); _sb = np.r_[0, np.cumsum(_sg)[:-1]]; _PB = _sg.sum()
def smooth_b(x, sig):
    ds = _sb[None, :] - _sb[:, None]; ds = (ds + _PB / 2) % _PB - _PB / 2
    w = np.exp(-0.5 * (ds / sig) ** 2) * ((_sg + np.roll(_sg, 1)) / 2)[None, :]; w /= w.sum(1, keepdims=True); return w @ x
ang_b = np.degrees(np.arctan2(B0[:, 2], B0[:, 0])) % 360
gap_b = B0[:, 1] - plate_y(B0[:, 0], B0[:, 2])
if SETTLE_GT > 0:
    w_ang = smoothstep(205.0, 220.0, ang_b) * (1 - smoothstep(300.0, 318.0, ang_b))
    e_b = smooth_b(np.clip(smooth_b(gap_b, 4e-3) - SETTLE_GT, 0, None) * w_ang, 3e-3)
    Dv = np.maximum(cutmod.sample(sdf, V[:, 0], V[:, 2]), 0)
    dd, ii = cKDTree(B0[:, [0, 2]]).query(V[:, [0, 2]], k=64)
    wg = np.exp(-0.5 * ((dd - dd[:, :1]) / 4e-3) ** 2)
    e_v = (wg * e_b[ii]).sum(1) / wg.sum(1)
    Lb = np.clip(1.6 * e_v + 8e-3, 10e-3, 24e-3)
    dy = e_v * (1 - smoothstep(0.0, 1.0, Dv / Lb))
    py_ = plate_y(V[:, 0], V[:, 2])
    ynew = np.maximum(V[:, 1] - dy, np.minimum(V[:, 1], py_ + 1.5e-3))
    print("settle: boundary excess max %.1f mm on %.0f%% of the loop; vertices lowered %d (max %.1f mm)" % (
        e_b.max() * 1e3, 100 * (e_b > 0.5e-3).mean(), (V[:, 1] - ynew > 1e-5).sum(), (V[:, 1] - ynew).max() * 1e3))
    V[:, 1] = ynew
# contact clamp: no top-surface vertex below the plate surface (+0.2 mm)
_py = plate_y(V[:, 0], V[:, 2]); _low = V[:, 1] < _py + 0.2e-3
print("contact clamp: %d top vertices raised (max %.2f mm)" % (_low.sum(), ((_py + 0.2e-3 - V[:, 1]) * _low).max() * 1e3))
V[_low, 1] = _py[_low] + 0.2e-3
''')

rep('SW, SH = src.size; srcA = np.asarray(src)\n', r'''SW, SH = src.size; srcA = np.asarray(src)
if RECOLOUR:
    # ---- FINAL graft: neutralise grey/shadow and whitish scan-edge texels within ~5-8 mm of the outline (they showed as
    # a pale highlight along the tear lip and a pale shelf next to the left step). Texture-only, geometry unchanged.
    srcA = srcA.copy()
    Dmm = np.maximum(cutmod.sample(sdf, V[:, 0], V[:, 2]), 0) * 1e3
    fsel = Dmm[F].min(1) < 8.5
    U3 = np.c_[UV[:, 0] * SW * 1e-3 - SW * 0.5e-3, np.zeros(len(UV)), UV[:, 1] * SH * 1e-3 - SH * 0.5e-3]
    _, FIt, (Dt,) = raster_top(U3, F[fsel], [Dmm[:, None]], px_mm=1.0, ext=SW * 0.5e-3)
    del _
    mt = np.isfinite(Dt[..., 0]) & (FIt >= 0); del FIt
    c = srcA[mt].astype(float); mx = c.max(1); mn = c.min(1); sat = (mx - mn) / np.maximum(mx, 1)
    LW = np.array([0.299, 0.587, 0.114]); lum = c @ LW
    CR = np.array([214., 172., 104.])
    w_ = (1 - smoothstep(5.0, 8.0, Dt[mt][:, 0])) * np.clip((0.50 - sat) / 0.18, 0, 1) * 0.8
    tgt = CR[None] * np.clip(lum / (CR @ LW), 0.55, 1.08)[:, None]
    srcA[mt] = np.clip(c * (1 - w_[:, None]) + tgt * w_[:, None], 0, 255).round().astype(np.uint8)
    print("edge recolour: %d texels in the 8 mm band, %d changed (w>0.05), mean w %.2f" % (mt.sum(), (w_ > 0.05).sum(), w_[w_ > 0.05].mean() if (w_ > 0.05).any() else 0))
    del Dt
    src = Image.fromarray(srcA)
''')

rep('''    underc = UNDER * (1 - 0.8 * t_dark[..., None]) + DARK * (0.8 * t_dark[..., None])
''', '''    underc = UNDER * (1 - 0.8 * t_dark[..., None]) + DARK * (0.8 * t_dark[..., None])
    underc = underc * (1 + 0.18 * (nm_ - 0.5) + 0.14 * (nb_ - 0.5) + 0.08 * (nf_ - 0.5))[..., None]  # FINAL: less uniform underside
''')
# outputs -> final/work
rep('Image.fromarray(np.concatenate([np.pad(p, ((0, 4), (0, _W - p.shape[1]), (0, 0)), constant_values=255) for p in dbg_patches], 0)).save(FB + OUT + "_strip.png")',
    'Image.fromarray(np.concatenate([np.pad(p, ((0, 4), (0, _W - p.shape[1]), (0, 0)), constant_values=255) for p in dbg_patches], 0)).save(WD + OUT + "_strip.png")')
rep('open(FB + OUT + "_tex.jpg", "wb").write(jpg)', 'open(WD + OUT + "_tex.jpg", "wb").write(jpg)')
rep('np.savez(FB + OUT + "_composed.npz"', 'np.savez(WD + OUT + "_composed.npz"')
rep('outf = FB + OUT + "_float.glb"', 'outf = WD + OUT + "_float.glb"')
rep('outq = FB + OUT + ".glb"', 'outq = WD + OUT + ".glb"')
rep('"generator": "plate-pipeline fixB (scanned pizza, rebuilt crust side + procedural plate)"',
    '"generator": "plate-pipeline final (scanned pizza, rebuilt crust side + procedural plate)"')
open(S + "scripts/final_build.py", "w").write(src)
print("wrote final_build.py")
