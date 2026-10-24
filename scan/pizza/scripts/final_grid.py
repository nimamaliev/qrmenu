"""Compose final/grid.png (3x2) from the final renders."""
from PIL import Image, ImageDraw
D = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/final/"
names = [("final_top", "top (overhead)"), ("final_hero", "hero 40/58"), ("final_low", "low 200/78"),
         ("final_side", "side 90/86"), ("final_torn", "torn side 20/80"), ("final_close", "close-up: torn fold 55/70")]
ims = [Image.open(D + n + ".png").convert("RGB") for n, _ in names]
W, H = ims[0].size
g = Image.new("RGB", (3 * W, 2 * H), "white"); dr = ImageDraw.Draw(g)
for i, (im, (_, lab)) in enumerate(zip(ims, names)):
    x, y = (i % 3) * W, (i // 3) * H; g.paste(im, (x, y)); dr.text((x + 8, y + 8), lab, fill=(0, 0, 0))
g.save(D + "grid.png"); print(g.size)
