"""Load the raw Polycam scan, compute per-face centroid/normal/area/colour (texture sampled at UV centroid
and at the 3 corners, averaged) and cache to plate/faces.npz. Also caches V,UV,F."""
import sys, time, numpy as np
sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
from glbio import load_mesh
SRC = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/polycam/raw/20.10.2026.glb"
OUT = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/faces.npz"
t = time.time()
V, UV, F, img, js = load_mesh(SRC)
print("loaded", V.shape, F.shape, img.size, img.mode, "%.1fs" % (time.time() - t), flush=True)
print("sampler", js.get("samplers"), "texcoord range", UV.min(0), UV.max(0))
tex = np.asarray(img.convert("RGB"))
H, W = tex.shape[:2]
def samp(uv):
    x = np.clip((uv[:, 0] % 1.0) * W, 0, W - 1).astype(np.int64)
    y = np.clip((uv[:, 1] % 1.0) * H, 0, H - 1).astype(np.int64)
    return tex[y, x].astype(np.float32)
tri = V[F]; tuv = UV[F]
fc = tri.mean(1)
n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); area = np.linalg.norm(n, axis=1) / 2
fn = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-20)
cuv = tuv.mean(1)
col_c = samp(cuv)
# also sample at points halfway between centroid and each corner for a more robust face colour
cs = [samp(0.5 * cuv + 0.5 * tuv[:, k]) for k in range(3)]
col = (col_c * 2 + cs[0] + cs[1] + cs[2]) / 5.0
np.savez(OUT, V=V, UV=UV, F=F, fc=fc, fn=fn, area=area, col=col, col_c=col_c)
print("saved", OUT, "%.1fs" % (time.time() - t))
