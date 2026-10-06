"""
Pack the raw RGBA renders (blender/render/NNNN.png) into the web frames the hero scrubs.

  python blender/pack.py

- public/hero/d/NNN.webp  800x800 centre crop, desktop
- public/hero/m/NNN.webp  560x560 centre crop, phones
Frames are composited onto the page's paper colour, so the canvas edge is invisible.
Missing frames (render still running) are filled with the nearest rendered one.
"""

import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "blender", "render")
OUT = os.path.join(ROOT, "public", "hero")
FRAMES = 120
PAPER = (242, 240, 236, 255)


def fade_edges(im, margin=0.12):
    """Fade the shadow out towards the left, right and bottom edges, so it never ends in a seam."""
    a = np.asarray(im, dtype=np.float32).copy()
    h, w = a.shape[:2]
    x = np.linspace(0, 1, w)
    y = np.linspace(0, 1, h)
    fx = np.clip(np.minimum(x, 1 - x) / margin, 0, 1)
    fy = np.clip((1 - y) / margin, 0, 1)
    mask = np.outer(fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx))
    a[..., 3] *= mask
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def main():
    have = sorted(int(os.path.basename(p)[:4]) for p in glob.glob(os.path.join(RAW, "*.png")))
    if not have:
        raise SystemExit("no frames rendered yet")
    os.makedirs(os.path.join(OUT, "d"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "m"), exist_ok=True)
    cache = {}
    for f in range(FRAMES):
        src = min(have, key=lambda h: abs(h - f))
        if src not in cache:
            im = Image.open(os.path.join(RAW, f"{src:04d}.png")).convert("RGBA")
            im = fade_edges(im)
            bg = Image.new("RGBA", im.size, PAPER)
            bg.alpha_composite(im)
            cache = {src: bg.convert("RGB")}
        img = cache[src]
        w, h = img.size
        crop = img.crop(((w - h) // 2, 0, (w + h) // 2, h))  # the burger lives in the square centre
        crop.resize((800, 800), Image.LANCZOS).save(os.path.join(OUT, "d", f"{f:03d}.webp"), quality=80, method=6)
        crop.resize((560, 560), Image.LANCZOS).save(os.path.join(OUT, "m", f"{f:03d}.webp"), quality=76, method=6)
    size = sum(os.path.getsize(p) for p in glob.glob(os.path.join(OUT, "*", "*.webp")))
    print(f"packed {FRAMES} frames from {len(have)} renders, {size / 1e6:.1f} MB total")


if __name__ == "__main__":
    main()
