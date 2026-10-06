"""
Procedural cheeseburger for the hero film and the "try it yourself" 3D demo.
Styled after the user's reference clip: toasted bun, craggy seared patty, melting
cheese, pickles, shredded onion, sauce drizzle, glossy brioche top.

Run with Blender's Python module (pip install bpy, Python 3.13):
  python blender/burger.py --still 0 40 90 [--full] [--samples N]   # test stills
  python blender/burger.py --frames                                  # all frames (resumes)
  python blender/burger.py --export                                  # glb for the 3D/AR demo
Add --retex to regenerate the numpy textures.

Everything (geometry, textures, animation) is generated here, so the same scene
feeds the path-traced film and the real-time model.
"""

import json
import math
import os
import sys

import bpy  # must come first: it makes bmesh and mathutils importable
import bmesh  # noqa: E402
import numpy as np
from mathutils import Vector, noise
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "blender", "tex")
RAW = os.path.join(ROOT, "blender", "render")  # raw RGBA frames (not committed)
TIMELINE_JSON = os.path.join(ROOT, "src", "components", "home", "hero", "burger-timeline.json")

FRAMES = 120
RES = (960, 960)

# ---------------------------------------------------------------------------
# Story, as scroll progress 0..1 (shared with the site through TIMELINE_JSON)
# ---------------------------------------------------------------------------
# Finished burger -> layers lift away, leaving the toasted bottom bun -> each ingredient
# drops in (the cheese melts, the sauce pours) -> camera orbits -> settles for the AR frame.
LIFT_OFF = (0.06, 0.17)
LAYERS = ["patty", "cheese", "pickles", "onion", "sauce", "top"]
LANDINGS = {
    "patty": (0.2, 0.27),
    "cheese": (0.29, 0.36),
    "pickles": (0.42, 0.48),
    "onion": (0.49, 0.55),
    "sauce": (0.56, 0.63),
    "top": (0.64, 0.71),
}
MELT = (0.35, 0.41)
ORBIT = (0.72, 0.86)
SETTLE = (0.87, 0.95)

R_BUN, H_BOT, R_PATTY, H_PATTY = 0.056, 0.022, 0.0575, 0.0175
BASE_Z = {"bottom": 0.0, "patty": 0.0215, "cheese": 0.0405, "pickles": 0.0425, "onion": 0.0465, "sauce": 0.0, "top": 0.0545}
OUT_OF_FRAME = 0.22


def clamp01(x):
    return max(0.0, min(1.0, x))


def ramp(p, a, b):
    return clamp01((p - a) / (b - a))


def smooth(t):
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------------------
# Textures (tileable numpy noise)
# ---------------------------------------------------------------------------
def fnoise(n, beta=2.0, seed=0, aniso=(1.0, 1.0)):
    """Tileable fractal noise in 0..1, via 1/f^beta filtering of white noise."""
    r = np.random.default_rng(seed)
    white = r.normal(size=(n, n))
    fy = np.fft.fftfreq(n)[:, None] * aniso[1]
    fx = np.fft.fftfreq(n)[None, :] * aniso[0]
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    spec = np.fft.fft2(white) / f ** (beta / 2)
    spec[0, 0] = 0
    out = np.real(np.fft.ifft2(spec))
    out -= out.min()
    return out / out.max()


def cells(n, count, seed, size=(0.002, 0.01)):
    """Tileable soft blobs (crumb pores, toast spots, seeds) as a 0..1 mask."""
    r = np.random.default_rng(seed)
    m = np.zeros((n, n))
    for _ in range(count):
        cx, cy = r.random(2) * n
        rad = r.uniform(*size) * n
        x0, x1 = int(cx - rad) - 1, int(cx + rad) + 2
        y0, y1 = int(cy - rad) - 1, int(cy + rad) + 2
        yy, xx = np.mgrid[y0:y1, x0:x1]
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        blob = np.clip(1 - d / rad, 0, 1) ** 1.5
        iy, ix = np.ix_(np.arange(y0, y1) % n, np.arange(x0, x1) % n)
        m[iy, ix] = np.maximum(m[iy, ix], blob)
    return m


def mix(a, b, t):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    return a + (b - a) * np.asarray(t)[..., None]


def hexc(h):
    h = h.lstrip("#")
    return [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]


def sm(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def save(name, arr):
    os.makedirs(TEX, exist_ok=True)
    arr = np.clip(arr, 0, 1)
    mode = "L" if arr.ndim == 2 else "RGB"
    Image.fromarray((arr * 255).astype(np.uint8), mode).save(os.path.join(TEX, name + ".png"))


def normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    nn = np.dstack([-dx, dy, np.ones_like(h)])
    nn /= np.linalg.norm(nn, axis=2, keepdims=True)
    return nn * 0.5 + 0.5


def make_textures():
    if os.path.exists(os.path.join(TEX, "sauce_col.png")) and "--retex" not in sys.argv:
        return
    n = 1024
    v = np.linspace(1, 0, n)[:, None] * np.ones((1, n))  # UV v per pixel row (row 0 = v 1)
    yy, xx = (np.mgrid[0:n, 0:n] / n - 0.5) * 2  # planar UV, -1..1
    rr = np.sqrt(xx * xx + yy * yy)

    # Brioche crust (u = angle, v = rim -> crown): glossy deep orange-brown, wrinkled skin.
    mott = fnoise(n, 2.4, 1)
    fine = fnoise(n, 1.0, 2)
    wr = fnoise(n, 2.2, 3, aniso=(1.0, 4.0))
    t = np.clip(sm((v - 0.05) / 0.5) + (mott - 0.5) * 0.35, 0, 1)
    col = mix(hexc("#d9984a"), hexc("#a24a12"), np.clip(t * 1.5, 0, 1))
    col = mix(col, hexc("#6e2a07"), np.clip((t - 0.55) * 1.8, 0, 1) * (0.6 + mott * 0.6))
    col *= 0.94 + fine[..., None] * 0.1
    save("brioche_col", col)
    save("brioche_nrm", normal_from_height(wr * 0.9 + fine * 0.25, 4.0))
    save("brioche_rgh", np.clip(0.2 + fine * 0.12 + (1 - t) * 0.15 + wr * 0.1, 0.15, 0.6))

    # Toasted cut face of the bottom bun (planar UV): golden crumb, browned edge and patches.
    pores = cells(n, 2600, 4, (0.002, 0.008))
    patches = fnoise(n, 2.6, 5)
    edge = sm((rr - 0.62) / 0.33)
    toast = np.clip(edge * 0.8 + (patches - 0.45) * 1.6 + fnoise(n, 1.6, 17) * 0.25, 0, 1)
    col = mix(hexc("#bf8c52"), hexc("#99581f"), np.clip(toast * 1.5, 0, 1))
    col = mix(col, hexc("#4a1f08"), np.clip((toast - 0.5) * 2.0, 0, 1))
    col = mix(col, col * 0.55, pores * 0.9)
    save("toast_col", col)
    save("toast_nrm", normal_from_height(-pores * 0.9 + fnoise(n, 1.2, 6) * 0.3, 3.0))

    # Pale crumb (underside of the top bun).
    col = mix(hexc("#f0dcae"), hexc("#d8b77a"), np.clip(pores * 0.9 + fnoise(n, 1.4, 7) * 0.3, 0, 1))
    save("crumb_col", col)

    # Seared patty: near-black crevices, brown lumps, a few reddish highlights.
    big = fnoise(n, 2.2, 8)
    grit = fnoise(n, 0.5, 9)
    lumps = cells(n, 1800, 10, (0.004, 0.012))
    t = np.clip(lumps * 0.8 + big * 0.4 + grit * 0.2, 0, 1)
    col = mix(hexc("#1c0c05"), hexc("#5a2c14"), np.clip(t * 1.3, 0, 1))
    col = mix(col, hexc("#8f4c26"), np.clip((t - 0.65) * 2.5, 0, 1))
    save("patty_col", col)
    save("patty_nrm", normal_from_height(lumps * 0.8 + grit * 0.5, 5.0))
    save("patty_rgh", np.clip(0.5 - lumps * 0.35 + grit * 0.15, 0.14, 0.8))

    # Melted American cheese.
    cv = fnoise(n, 2.6, 11)
    save("cheese_col", mix(hexc("#eb9a1c"), hexc("#dc800c"), cv))
    save("cheese_nrm", normal_from_height(fnoise(n, 2.4, 12) * 0.5, 1.5))

    # Crinkle-cut pickle face (planar UV): pale flesh, seed ring, dark skin edge.
    col = np.ones((n, n, 3)) * hexc("#a3a63c")
    col = mix(col, hexc("#c9c46a"), sm(1 - np.abs(rr - 0.45) / 0.18) * 0.8)
    seeds = np.zeros((n, n))
    rs = np.random.default_rng(13)
    for _ in range(22):
        a = rs.uniform(0, 2 * math.pi)
        rad = rs.uniform(0.38, 0.52)
        d = np.sqrt((xx - math.cos(a) * rad) ** 2 + ((yy - math.sin(a) * rad) / 0.6) ** 2)
        seeds = np.maximum(seeds, np.clip(1 - d / 0.05, 0, 1))
    col = mix(col, hexc("#e6dfa4"), seeds * 0.8)
    col = mix(col, hexc("#3f5a14"), sm((rr - 0.86) / 0.08))
    col *= 0.92 + fnoise(n, 1.4, 14)[..., None] * 0.12
    save("pickle_col", col)

    # White onion and burger sauce: subtle variation only.
    save("onion_col", mix(hexc("#f6f2e6"), hexc("#e8e0c4"), fnoise(n, 2.0, 15)))
    save("sauce_col", mix(hexc("#eb9a6c"), hexc("#d9794c"), fnoise(n, 2.2, 16)))


# ---------------------------------------------------------------------------
# Scene helpers
# ---------------------------------------------------------------------------
def image(name, color=True):
    img = bpy.data.images.load(os.path.join(TEX, name + ".png"), check_existing=True)
    img.colorspace_settings.name = "sRGB" if color else "Non-Color"
    return img


def material(name, col=None, nrm=None, rgh=None, rough=0.5, nstr=1.0, sss=0.0, sss_radius=(1, 0.4, 0.2), coat=0.0, base=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    if col:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = image(col)
        nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    elif base:
        p.inputs["Base Color"].default_value = (*hexc(base), 1)
    if rgh:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = image(rgh, False)
        nt.links.new(t.outputs["Color"], p.inputs["Roughness"])
    else:
        p.inputs["Roughness"].default_value = rough
    if nrm:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = image(nrm, False)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = nstr
        nt.links.new(t.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    if sss:
        p.inputs["Subsurface Weight"].default_value = sss
        p.inputs["Subsurface Radius"].default_value = sss_radius
        p.inputs["Subsurface Scale"].default_value = 0.004
    if coat:
        p.inputs["Coat Weight"].default_value = coat
        p.inputs["Coat Roughness"].default_value = 0.2
    return m


def obj_from_bmesh(name, bm, mats, smooth_shade=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    if smooth_shade:
        for poly in me.polygons:
            poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def flat(r0, r1, z, v0, v1, mat, steps=10):
    """Profile points across a flat face, so surface relief has vertices to move."""
    return [(r0 + (r1 - r0) * k / steps, z, v0 + (v1 - v0) * k / steps, mat) for k in range(1, steps)]


def lathe(name, profile, mats, segs=128, jitter=None, planar=(), planar_r=0.06):
    """profile: (r, z, v, mat_index) from the bottom centre to the top centre.
    UVs: u = angle, v = profile value; faces whose material is in `planar` get a top-down UV."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rings = []
    for (r, z, _, _) in profile:
        ring = []
        for j in range(segs):
            a = 2 * math.pi * j / segs
            x, y = math.cos(a) * r, math.sin(a) * r
            if jitter and r > 1e-4:
                d = jitter(x, y, z)
                x, y = x * (1 + d), y * (1 + d)
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for i in range(len(profile) - 1):
        for j in range(segs):
            j2 = (j + 1) % segs
            f = bm.faces.new((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]))
            f.material_index = profile[i][3]
            if f.material_index in planar:
                for loop in f.loops:
                    loop[uv].uv = (loop.vert.co.x / (2 * planar_r) + 0.5, loop.vert.co.y / (2 * planar_r) + 0.5)
                continue
            us = (j / segs, (j + 1) / segs)
            vs = (profile[i][2], profile[i + 1][2])
            for loop, (uu, vv) in zip(f.loops, ((us[0], vs[0]), (us[1], vs[0]), (us[1], vs[1]), (us[0], vs[1]))):
                loop[uv].uv = (uu, vv)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.normal_update()
    return obj_from_bmesh(name, bm, mats)


def relief(ob, kind, size, strength, level=2, mid=0.5):
    """Subdivide and push the surface along its normals with a procedural texture."""
    if level and not any(m.type == "SUBSURF" for m in ob.modifiers):
        sub = ob.modifiers.new("subd", "SUBSURF")
        sub.levels = sub.render_levels = level
    tex = bpy.data.textures.new(f"{ob.name}_{kind}", kind)
    if kind == "VORONOI":
        tex.distance_metric = "DISTANCE"
        tex.color_mode = "INTENSITY"
    else:
        tex.noise_depth = 4
    tex.noise_scale = size
    mod = ob.modifiers.new(kind.lower(), "DISPLACE")
    mod.texture = tex
    mod.texture_coords = "LOCAL"
    mod.strength = strength
    mod.mid_level = mid
    return mod


def n3(x, y, z, f):
    return noise.noise(Vector((x * f, y * f, z * f)))


def ribbon(name, pts, width, thick, mat):
    """A curve with a flat (onion sliver) or round (sauce) cross-section."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts):
        p.co = (*co, 1)
    sp.use_endpoint_u = True
    sp.order_u = 4
    cu.extrude = width
    cu.bevel_depth = thick
    cu.bevel_resolution = 3
    cu.resolution_u = 16
    cu.use_fill_caps = True
    cu.materials.append(mat)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------------------
# Burger parts (each part is parented to an empty that the animation moves)
# ---------------------------------------------------------------------------
def build():
    sc = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)

    M = {
        "brioche": material("Brioche", "brioche_col", "brioche_nrm", "brioche_rgh", nstr=0.8, sss=0.06, sss_radius=(1, 0.5, 0.25), coat=0.3),
        "toast": material("Toast", "toast_col", "toast_nrm", rough=0.8, nstr=1.4, sss=0.05, sss_radius=(1, 0.7, 0.4)),
        "crumb": material("Crumb", "crumb_col", "toast_nrm", rough=0.85, nstr=0.8, sss=0.08, sss_radius=(1, 0.8, 0.5)),
        "patty": material("Patty", "patty_col", "patty_nrm", "patty_rgh", nstr=1.2),
        "cheese": material("Cheese", "cheese_col", "cheese_nrm", rough=0.3, nstr=0.6, sss=0.18, sss_radius=(1, 0.6, 0.15)),
        "pickle": material("Pickle", "pickle_col", rough=0.25, sss=0.2, sss_radius=(0.5, 1, 0.3)),
        "pickle_skin": material("PickleSkin", base="#3d5512", rough=0.3, sss=0.2, sss_radius=(0.6, 1, 0.3)),
        "onion": material("Onion", "onion_col", rough=0.25, sss=0.35, sss_radius=(1, 1, 0.9)),
        "sauce": material("Sauce", "sauce_col", rough=0.18, sss=0.2, sss_radius=(1, 0.6, 0.4)),
    }
    groups = {}

    def group(name):
        e = bpy.data.objects.new(name, None)
        sc.collection.objects.link(e)
        groups[name] = e
        return e

    # Bottom bun: brioche heel with a toasted cut face up.
    R = R_BUN
    prof = [(1e-4, 0.0015, 0.0, 0)]
    for k in range(13):
        a = -math.pi / 2 + (k / 12) * math.pi / 2
        prof.append((R - 0.009 + math.cos(a) * 0.009, 0.0095 + math.sin(a) * 0.008, 0.02 + 0.4 * k / 12, 0))
    prof += [(R + 0.0005, 0.017, 0.5, 0), (R - 0.0008, 0.0212, 0.6, 1)] + flat(R - 0.0008, 1e-4, H_BOT, 0, 0, 1, 16) + [(1e-4, H_BOT, 0.0, 1)]
    bot = lathe("BunBottom", prof, [M["brioche"], M["toast"]], jitter=lambda x, y, z: n3(x, y, z, 30) * 0.025, planar=(1,), planar_r=R)
    for v in bot.data.vertices:  # gently uneven toasted face
        if v.co.z > H_BOT - 1e-4:
            v.co.z += n3(v.co.x, v.co.y, 0, 60) * 0.0006
    relief(bot, "CLOUDS", 0.004, 0.0004, level=1)
    bot.parent = group("bottom")

    # Patty: thick, lumpy ground beef with a seared crust.
    g = group("patty")
    Rp, Hp = R_PATTY, H_PATTY
    prof = [(1e-4, 0.0, 0.0, 0)] + flat(1e-4, Rp - 0.006, 0.0, 0.0, 0.15, 0, 16)
    for k in range(19):
        a = -math.pi / 2 + (k / 18) * math.pi
        prof.append((Rp - 0.006 + math.cos(a) * 0.006, Hp / 2 + math.sin(a) * Hp / 2, 0.15 + 0.7 * k / 18, 0))
    prof += flat(Rp - 0.006, 1e-4, Hp, 0.85, 1.0, 0, 16) + [(1e-4, Hp, 1.0, 0)]
    patty = lathe("Patty", prof, [M["patty"]], segs=200, jitter=lambda x, y, z: n3(x, y, z, 35) * 0.06 + n3(x, y, z, 140) * 0.02)
    for v in patty.data.vertices:
        if math.hypot(v.co.x, v.co.y) < Rp - 0.007:
            v.co.z += (n3(v.co.x, v.co.y, 0, 70) * 0.0015 + n3(v.co.x, v.co.y, 1, 220) * 0.0007) * (1 if v.co.z > Hp / 2 else -1)
    relief(patty, "VORONOI", 0.0032, -0.0024, level=2, mid=0.3)  # cell centres bulge: clumps of mince
    relief(patty, "VORONOI", 0.0011, -0.0007, level=0, mid=0.3)
    relief(patty, "CLOUDS", 0.0006, 0.00035, level=0)
    patty.parent = g

    # Cheese: a square slice that lands flat and melts over the patty ("Melted" shape key),
    # with long drips where it runs down the side.
    g = group("cheese")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=90, y_segments=90, size=0.048)
    uvl = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            loop[uvl].uv = (loop.vert.co.x / 0.096 + 0.5, loop.vert.co.y / 0.096 + 0.5)
    cheese = obj_from_bmesh("Cheese", bm, [M["cheese"]])
    cheese.rotation_euler.z = 0.3
    cheese.shape_key_add(name="Flat")
    sk = cheese.shape_key_add(name="Melted")
    drips = [(0.4, 0.17, 1.9), (1.75, 0.12, 1.4), (3.2, 0.2, 2.2), (4.6, 0.14, 1.6), (5.6, 0.1, 1.2)]
    for i, vtx in enumerate(cheese.data.vertices):
        x, y = vtx.co.x, vtx.co.y
        r = math.hypot(x, y)
        a = math.atan2(y, x) + cheese.rotation_euler.z
        edge = Rp - 0.0035
        if r <= edge:
            co = Vector((x, y, n3(x, y, 0, 80) * 0.0007 + n3(x, y, 1, 220) * 0.00025))  # soft, irregular melt
        else:
            hang = r - edge
            for da, w, extra in drips:
                d = math.atan2(math.sin(a - da), math.cos(a - da))
                hang *= 1 + (extra - 1) * math.exp(-((d / w) ** 2))
            k = edge + 0.0018 + 0.0012 * clamp01(hang / 0.004)  # hugs the patty side
            co = Vector((x / r * k, y / r * k, -hang * 0.95 + n3(x, y, 0, 80) * 0.0006))
        sk.data[i].co = co
    mod = cheese.modifiers.new("solid", "SOLIDIFY")
    mod.thickness = 0.0018
    mod.offset = 1
    sub = cheese.modifiers.new("subd", "SUBSURF")
    sub.levels = sub.render_levels = 1
    cheese.parent = g
    # drops pooling on the bun at the end of the drips (grow as the cheese melts)
    for k, (da, _, _) in enumerate(drips[:4]):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1)
        bmesh.ops.scale(bm, vec=(0.0062, 0.0042, 0.0012), verts=bm.verts)  # flat puddle
        drop = obj_from_bmesh(f"CheeseDrop{k}", bm, [M["cheese"]])
        drop.location = (math.cos(da) * (Rp + 0.001), math.sin(da) * (Rp + 0.001), -H_PATTY - 0.0002)
        drop.rotation_euler.z = da
        drop.parent = g

    # Pickles: three crinkle-cut slices.
    g = group("pickles")
    for i, (a, d, tilt) in enumerate(((0.6, 0.018, 0.08), (2.7, 0.017, -0.1), (4.6, 0.019, 0.06))):
        bm = bmesh.new()
        uvl = bm.loops.layers.uv.new("UVMap")
        S, RINGS, Rk, T = 72, 8, 0.0175, 0.0042
        tops, bots = [], []
        for side, zs in ((tops, T / 2), (bots, -T / 2)):
            for ri in range(RINGS + 1):
                rr = Rk * ri / RINGS + 1e-4
                ring = []
                for j in range(S):
                    t = 2 * math.pi * j / S
                    wob = 1 + 0.04 * math.sin(14 * t)  # crinkle-cut edge
                    ridge = math.copysign(0.0007, zs) * math.sin(rr / Rk * 9 * math.pi) * (rr / Rk)  # crinkle ridges
                    ring.append(bm.verts.new((math.cos(t) * rr * wob, math.sin(t) * rr * wob, zs + ridge)))
                side.append(ring)
        for side, flip in ((tops, False), (bots, True)):
            for ri in range(RINGS):
                for j in range(S):
                    q = (side[ri][j], side[ri][(j + 1) % S], side[ri + 1][(j + 1) % S], side[ri + 1][j])
                    f = bm.faces.new(q[::-1] if flip else q)
                    for loop in f.loops:
                        loop[uvl].uv = (loop.vert.co.x / (2 * Rk) + 0.5, loop.vert.co.y / (2 * Rk) + 0.5)
        for j in range(S):
            f = bm.faces.new((bots[RINGS][j], bots[RINGS][(j + 1) % S], tops[RINGS][(j + 1) % S], tops[RINGS][j]))
            f.material_index = 1
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bm.normal_update()
        ob = obj_from_bmesh(f"Pickle{i}", bm, [M["pickle"], M["pickle_skin"]])
        ob.location = (math.cos(a) * d, math.sin(a) * d, T / 2 + i * 0.0014)
        ob.rotation_euler = (tilt, -tilt * 0.7, a)
        ob.parent = g

    # Shredded white onion: a loose pile of curved slivers.
    g = group("onion")
    ro = np.random.default_rng(31)
    for i in range(26):
        rad = ro.uniform(0.008, 0.02)
        span = ro.uniform(1.2, 2.6)
        a0 = ro.uniform(0, 2 * math.pi)
        cx, cy = ro.uniform(-0.016, 0.016, 2)
        z0 = ro.uniform(0.0, 0.007)
        tiltx, tilty = ro.uniform(-0.6, 0.6, 2)
        pts = []
        for k in range(7):
            t = a0 + span * k / 6
            px, py = cx + math.cos(t) * rad, cy + math.sin(t) * rad
            pz = z0 + px * tiltx * 0.25 + py * tilty * 0.25 + 0.002 * math.sin(k)
            pts.append((px, py, max(pz, 0.0005)))
        ob = ribbon(f"Onion{i}", pts, 0.0012, 0.0005, M["onion"])
        ob.data.twist_mode = "MINIMUM"
        ob.parent = g

    # Sauce: poured from above, running over the onion and down the front of the cheese.
    g = group("sauce")
    path = [(0.004, -0.004, 0.06), (0.002, -0.01, 0.055), (-0.003, -0.022, 0.05), (-0.006, -0.034, 0.047), (-0.009, -0.047, 0.043), (-0.01, -0.0565, 0.038), (-0.011, -0.0595, 0.031), (-0.012, -0.06, 0.026)]
    sauce = ribbon("Sauce", path, 0.0, 0.0023, M["sauce"])
    for k, p in enumerate(sauce.data.splines[0].points):
        p.radius = 1.3 - 0.5 * k / (len(path) - 1)
    sauce.parent = g

    # Top bun: tall glossy brioche dome with a pale crumb underside.
    g = group("top")
    Rt, Ht = 0.0565, 0.046

    def dome_z(r):
        return Ht * (1 - (r / Rt) ** 2.4) ** 0.5

    prof = [(1e-4, 0.0, 0.0, 1)] + flat(1e-4, Rt - 0.003, 0.0, 0.0, 0.95, 1) + [(Rt - 0.003, 0.0, 0.95, 1)]
    for k in range(48):
        t = k / 47
        r = max(Rt * math.cos(t * math.pi / 2), 1e-4)
        prof.append((r, dome_z(min(r, Rt)) + 0.0012 * math.sin(min(t * 5, math.pi)), 0.02 + 0.98 * t, 0))
    top = lathe("BunTop", prof, [M["brioche"], M["crumb"]], segs=160, jitter=lambda x, y, z: n3(x, y, z, 20) * 0.02 + n3(x, y, z, 60) * 0.006, planar=(1,), planar_r=Rt)
    relief(top, "CLOUDS", 0.01, 0.0008, level=1)
    relief(top, "CLOUDS", 0.0025, 0.00025, level=0)
    top.parent = g
    return groups


# ---------------------------------------------------------------------------
# Lighting, camera, render settings
# ---------------------------------------------------------------------------
def stage():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 40
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 4
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    # Standard keeps food colours saturated (AgX drifts orange towards pink); lights stay moderate.
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = -0.8
    sc.frame_start, sc.frame_end = 0, FRAMES - 1

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.95, 0.94, 0.92, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18
    sc.world = world

    # Shadow-catching floor: only the burger's shadow ends up in the frame.
    bpy.ops.mesh.primitive_plane_add(size=4)
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.is_shadow_catcher = True

    def area(name, loc, power, size, color=(1, 0.96, 0.9), shadow=True):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = power
        light.size = size
        light.color = color
        light.use_shadow = shadow
        ob = bpy.data.objects.new(name, light)
        sc.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0.04)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return ob

    # Food-photo setup: warm soft key high front-left, shadowless fill, strong rim for the glaze and grease.
    area("Key", (-0.45, -0.55, 0.6), 34, 0.5)
    area("Fill", (0.8, -0.6, 0.25), 5, 1.2, (0.95, 0.97, 1), shadow=False)
    area("Rim", (0.25, 0.55, 0.75), 22, 0.35, shadow=False)  # high, so flat glossy tops don't mirror it
    area("Kicker", (-0.55, 0.35, 0.55), 8, 0.3, shadow=False)

    target = bpy.data.objects.new("CamTarget", None)
    sc.collection.objects.link(target)
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 85
    cam_data.sensor_width = 36
    cam_data.sensor_fit = "VERTICAL"
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = target
    cam_data.dof.aperture_fstop = 8
    cam = bpy.data.objects.new("Cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    return cam, target


# ---------------------------------------------------------------------------
# Animation
# ---------------------------------------------------------------------------
def pose(p):
    lift = smooth(ramp(p, *LIFT_OFF))
    layers = {"bottom": (0.0, 1.0)}
    for i, name in enumerate(LAYERS):
        a, b = LANDINGS[name]
        land = ramp(p, a, b)
        fall = min(1.0, land / 0.75)
        fall = fall * fall  # accelerates like a real drop
        # top layers leave first when lifting off, then everything drops back in order
        gone = smooth(clamp01(lift * 1.4 - (len(LAYERS) - 1 - i) * 0.08))
        z = BASE_Z[name] + OUT_OF_FRAME * (gone if p < a else (1 - fall))
        squash = 1 - 0.07 * math.sin(math.pi * clamp01((land - 0.75) / 0.25)) if 0.75 < land < 1 else 1.0
        if name == "sauce":  # the sauce doesn't fly: it vanishes with the lift-off and pours back
            z, squash = (0.0 if p < LIFT_OFF[0] + 0.01 or p >= a else OUT_OF_FRAME), 1.0
        layers[name] = (z, squash)
    melt = max(1 - lift, smooth(ramp(p, *MELT)))
    pour = max(1 - lift, smooth(ramp(p, *LANDINGS["sauce"])))

    orbit = smooth(ramp(p, *ORBIT))
    settle = smooth(ramp(p, *SETTLE))
    az = math.radians(-28 + 170 * orbit + 18 * settle)
    el = math.radians(13 + 9 * settle + 3 * (1 - orbit) * lift)
    dist = 0.78 - 0.04 * settle
    tz = 0.048 - 0.012 * lift * (1 - smooth(ramp(p, LANDINGS["patty"][0], LANDINGS["top"][1])))
    return layers, melt, pour, az, el, dist, tz


def animate(groups, cam, target):
    cheese = bpy.data.objects["Cheese"]
    drops = [o for o in bpy.data.objects if o.name.startswith("CheeseDrop")]
    sauce = bpy.data.objects["Sauce"]
    for f in range(FRAMES):
        p = f / (FRAMES - 1)
        layers, melt, pour, az, el, dist, tz = pose(p)
        for name, (z, squash) in layers.items():
            g = groups[name]
            g.location = (0, 0, z)
            g.scale = (1 + (1 - squash) * 0.5, 1 + (1 - squash) * 0.5, squash)
            g.keyframe_insert("location", frame=f)
            g.keyframe_insert("scale", frame=f)
        kb = cheese.data.shape_keys.key_blocks["Melted"]
        kb.value = melt
        kb.keyframe_insert("value", frame=f)
        grow = clamp01((melt - 0.6) / 0.4)
        for d in drops:
            s = max(grow, 1e-3)
            d.scale = (s, s, s)
            d.keyframe_insert("scale", frame=f)
        sauce.data.bevel_factor_end = max(pour, 1e-3)
        sauce.data.keyframe_insert("bevel_factor_end", frame=f)
        target.location = (0, 0, tz)
        target.keyframe_insert("location", frame=f)
        cam.location = (dist * math.cos(el) * math.cos(az), dist * math.cos(el) * math.sin(az), tz + dist * math.sin(el))
        cam.keyframe_insert("location", frame=f)


def write_timeline():
    data = {
        "frames": FRAMES,
        "liftOff": LIFT_OFF,
        "landings": [LANDINGS[n] for n in LAYERS],
        "orbit": ORBIT,
        "settle": SETTLE,
    }
    os.makedirs(os.path.dirname(TIMELINE_JSON), exist_ok=True)
    with open(TIMELINE_JSON, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def setup():
    make_textures()
    groups = build()
    cam, target = stage()
    animate(groups, cam, target)
    write_timeline()
    return groups


def export_models():
    """The finished burger as a real-time model: public/models/burger.glb (+ .usdz for iOS AR)."""
    sc = bpy.context.scene
    sc.frame_set(0)  # assembled, cheese melted, sauce poured
    for ob in sc.objects:  # lighter than the film: the real-time model leans on its normal maps
        for m in getattr(ob, "modifiers", []):
            if m.type == "SUBSURF":
                m.levels = 0 if ob.name == "Cheese" else min(m.levels, 1)
        if ob.type == "CURVE":
            ob.data.resolution_u = 6
            ob.data.bevel_resolution = 1
    food = [o for o in sc.objects if o.type in {"MESH", "CURVE"} and o.name != "Floor"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in food:
        o.select_set(True)
    bpy.context.view_layer.objects.active = food[0]
    bpy.ops.object.convert(target="MESH")  # bakes modifiers, shape keys and curves at this frame
    for o in list(sc.objects):
        if o not in food and o.type != "EMPTY":
            bpy.data.objects.remove(o)
    for o in sc.objects:
        o.animation_data_clear()
        if o.type == "MESH" and o.data.shape_keys:
            o.shape_key_clear()
    bpy.ops.object.select_all(action="SELECT")
    out = os.path.join(ROOT, "public", "models")
    os.makedirs(out, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out, "burger.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_image_format="JPEG",
        export_jpeg_quality=82,
    )
    # iOS Quick Look gets a USDZ generated from this GLB by <model-viewer>; shrink it with
    #   npx @gltf-transform/cli optimize public/models/burger.glb public/models/burger.glb \
    #     --compress draco --texture-compress webp --texture-size 1024
    print("burger.glb", round(os.path.getsize(os.path.join(out, "burger.glb")) / 1e6, 2), "MB")


def render_frames(frames, scale=100, folder=RAW):
    sc = bpy.context.scene
    sc.render.resolution_percentage = scale
    os.makedirs(folder, exist_ok=True)
    for f in frames:
        out = os.path.join(folder, f"{f:04d}.png")
        if os.path.exists(out):
            continue
        sc.frame_set(f)
        sc.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print("rendered", out, flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    setup()
    if "--still" in args:
        rest = args[args.index("--still") + 1 :]
        frames = [int(a) for a in rest[: next((i for i, a in enumerate(rest) if a.startswith("--")), len(rest))]]
        if "--samples" in args:
            bpy.context.scene.cycles.samples = int(args[args.index("--samples") + 1])
        render_frames(frames, 100 if "--full" in args else 50, os.path.join(ROOT, "blender", "stills"))
    if "--frames" in args:
        order, seen = [], set()
        for step in (8, 4, 2, 1):
            for f in range(0, FRAMES, step):
                if f not in seen:
                    seen.add(f)
                    order.append(f)
        render_frames(order + [FRAMES - 1])
    if "--export" in args:
        export_models()
    if "--blend" in args:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", "burger.blend"))
