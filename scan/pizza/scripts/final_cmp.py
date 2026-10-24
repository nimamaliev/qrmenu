"""Side-by-side comparison: final_cmp.py DIR OUT PREFIX_A PREFIX_B name1 name2 ...  (rows = names, cols = A,B)"""
import sys
from PIL import Image, ImageDraw
d, out, pa, pb = sys.argv[1:5]; names = sys.argv[5:]
ims = [[Image.open(f"{d}/{p}{n}.png").convert("RGB") for p in (pa, pb)] for n in names]
W, H = ims[0][0].size
g = Image.new("RGB", (2 * W, len(names) * H), "white"); dr = ImageDraw.Draw(g)
for r, row in enumerate(ims):
    for c, im in enumerate(row):
        g.paste(im, (c * W, r * H)); dr.text((c * W + 6, r * H + 6), (pa, pb)[c] + names[r], fill=(0, 0, 0))
g.save(out)
