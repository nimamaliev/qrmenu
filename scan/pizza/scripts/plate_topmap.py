"""Top-down 1mm maps (max height, colour of top face, saturation) around the plate for inspection."""
import numpy as np
from PIL import Image
P = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/plate/"
d = np.load(P + "faces.npz"); fc, col = d["fc"], d["col"]
c = np.array([0.016, -0.006]); R = 0.18; res = 0.001; n = int(2 * R / res)
ring = np.hypot(fc[:, 0] - c[0], fc[:, 2] - c[1]); ring = (ring > 0.15) & (ring < 0.18)
tbl = np.median(fc[ring, 1]); print("table y (ring 15-18cm) median %.5f p10 %.5f p90 %.5f" % (tbl, *np.percentile(fc[ring, 1], [10, 90])))
ix = ((fc[:, 0] - c[0] + R) / res).astype(int); iz = ((fc[:, 2] - c[1] + R) / res).astype(int)
ok = (ix >= 0) & (ix < n) & (iz >= 0) & (iz < n)
ix, iz, h, cl = ix[ok], iz[ok], fc[ok, 1] - tbl, col[ok]
hm = np.full((n, n), np.nan); hmx = np.full((n, n), -1.0); np.maximum.at(hmx, (iz, ix), h); hm[hmx > -1] = hmx[hmx > -1]
order = np.argsort(h); cm = np.zeros((n, n, 3)); cm[iz[order], ix[order]] = cl[order]
np.savez(P + "topmaps.npz", hm=hm, cm=cm, c=c, R=R, res=res, tbl=tbl)
hv = np.clip(np.nan_to_num(hm, nan=0) / 0.035, 0, 1)
img = (np.stack([hv] * 3, -1) * 255).astype(np.uint8); img[np.isnan(hm)] = [255, 0, 0]
yy, xx = np.mgrid[0:n, 0:n]; rr = np.hypot(xx - n / 2 + 0.5, yy - n / 2 + 0.5) * res
for rc, cc in ((0.10, [0, 255, 0]), (0.12, [255, 255, 0]), (0.13, [255, 128, 0]), (0.14, [255, 0, 255])):
    img[np.abs(rr - rc) < 0.0005] = cc
Image.fromarray(img).resize((720, 720), Image.NEAREST).save(P + "dbg_height.png")
Image.fromarray(cm.astype(np.uint8)).resize((720, 720), Image.NEAREST).save(P + "dbg_color.png")
