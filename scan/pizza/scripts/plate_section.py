"""Cross-section scatter images (r vs h, face colour) for several azimuth sectors in the levelled frame."""
import numpy as np, sys
from PIL import Image, ImageDraw
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); col = d["col"]
fc = np.load(P + "fc_level.npy")
x, h, z = fc[:, 0], fc[:, 1], fc[:, 2]; r = np.hypot(x, z); th = np.degrees(np.arctan2(z, x)) % 360
sx = 6; sy = 12; r0, r1 = 60, 140; h1 = 46
W = (r1 - r0) * sx; Hh = h1 * sy
secs = [int(a) for a in sys.argv[1].split(",")] if len(sys.argv) > 1 else [0, 45, 90, 135, 180, 225, 270, 315]
halfw = float(sys.argv[2]) if len(sys.argv) > 2 else 4
prof = np.load(P + "plate_profile.npy") if len(sys.argv) > 3 else None
only = None
if len(sys.argv) > 5 and sys.argv[5] == "pizza":
    only = np.zeros(len(fc), bool); only[np.load(P + "pizza_faces.npy")] = True
tiles = []
for a in secs:
    dth = (th - a + 180) % 360 - 180; s = (np.abs(dth) < halfw) & (r * 1e3 > r0) & (r * 1e3 < r1) & (h > -0.002)
    if only is not None: s &= only
    img = Image.new("RGB", (W, Hh), (20, 20, 40)); px = img.load(); dr = ImageDraw.Draw(img)
    for mm in range(0, h1, 5): dr.line([(0, Hh - mm * sy), (W, Hh - mm * sy)], fill=(60, 60, 80))
    for mm in range(r0, r1, 10): dr.line([((mm - r0) * sx, 0), ((mm - r0) * sx, Hh)], fill=(60, 60, 80))
    idx = np.where(s)[0]; idx = idx[np.argsort(-np.abs(dth[idx]))]
    for i in idx:
        u = int((r[i] * 1e3 - r0) * sx); v = int(Hh - h[i] * 1e3 * sy)
        if 0 <= u < W - 1 and 0 <= v < Hh - 1:
            c = tuple(int(q) for q in col[i])
            for du in (0, 1):
                for dv in (0, 1): px[u + du, v + dv] = c
    if prof is not None:
        pts = [((pr * 1e3 - r0) * sx, Hh - ph * 1e3 * sy) for pr, ph in prof if pr * 1e3 >= r0]
        dr.line(pts, fill=(0, 255, 255), width=1)
    dr.text((5, 5), "az %d deg (+-%g), grid 10mm x 5mm" % (a, halfw), fill=(255, 255, 0))
    tiles.append(img)
out = Image.new("RGB", (W, Hh * len(tiles)))
for k, t in enumerate(tiles): out.paste(t, (0, k * Hh))
fn = P + ("dbg_section%s.png" % (sys.argv[4] if len(sys.argv) > 4 else ""))
out.save(fn); print(fn, out.size)
