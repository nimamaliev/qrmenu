import sys; sys.path.insert(0, "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/scripts")
"""Top-down textured view of the scan pizza (source texture) + boundary loop, plus an annotated steep/stretch map."""
import io, numpy as np
from PIL import Image, ImageDraw
from fixB_common import *
from fixB_raster import raster_top
from glbio import read_glb
from fixB_loops import boundary_loops
Image.MAX_IMAGE_PIXELS = None
Vp, UVp, Fp = load_pizza()
js, b = read_glb(S + "polycam/raw/20.10.2026.glb")
im = js["images"][0]; bv = js["bufferViews"][im["bufferView"]]
src = np.asarray(Image.open(io.BytesIO(b[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])).convert("RGB"))
np.save(FB + "src_tex_shape.npy", np.array(src.shape))
H, FI, (uvimg,) = raster_top(Vp, Fp, [UVp], px_mm=0.2)
np.savez_compressed(FB + "top_raster.npz", H=H, FI=FI, UV=uvimg)
N = H.shape[0]; m = FI >= 0
col = np.full((N, N, 3), 255, np.uint8)
u = uvimg[m, 0]; v = uvimg[m, 1]
SH, SW = src.shape[:2]
col[m] = src[np.clip((v * SH).astype(int), 0, SH - 1), np.clip((u * SW).astype(int), 0, SW - 1)]
Image.fromarray(col).save(FB + "top_tex.png")
wid = weld(Vp); nw = wid.max() + 1; Vw = np.zeros((nw, 3)); Vw[wid] = Vp
loops, Eb, _ = boundary_loops(wid[Fp], nw)
img = Image.fromarray(col); dr = ImageDraw.Draw(img)
lp = loops[0]; pts = [((Vw[k, 0] + 0.135) / 0.0002, (Vw[k, 2] + 0.135) / 0.0002) for k in lp]
dr.line(pts + pts[:1], fill=(0, 0, 255), width=2)
for a in range(0, 360, 30):
    x = 0.128 * np.cos(np.radians(a)); z = 0.128 * np.sin(np.radians(a))
    dr.text(((x + 0.135) / 0.0002, (z + 0.135) / 0.0002), str(a), fill=(0, 0, 0))
img.resize((N // 2, N // 2), Image.LANCZOS).save(FB + "top_tex_loop.png")
