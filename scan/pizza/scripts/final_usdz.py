"""Build final/pizza.usdz (iPhone AR Quick Look) from the shipped final/pizza.glb.
Geometry is read from the GLB itself (KHR_mesh_quantization dequantized, node transforms applied) so the USDZ matches
the GLB. Stage: upAxis Y, metersPerUnit 1, defaultPrim /pizza_on_plate; meshes with vertex normals and primvars:st
(V flipped relative to glTF); UsdPreviewSurface materials; the GLB's own JPEG as the pizza texture.
Packaged with UsdUtils.CreateNewARKitUsdzPackage, then reopened and checked with the ARKit ComplianceChecker."""
import os, sys, json, struct, shutil, numpy as np
from pxr import Usd, UsdGeom, UsdShade, Sdf, Gf, Vt, Kind, UsdUtils

S = "/tmp/claude-0/-home-user/12e952ac-eae9-53b7-b289-1461284fa09f/scratchpad/"
GLB = S + "final/pizza.glb"; OUTZ = S + "final/pizza.usdz"
WD = S + "final/work/usd/"
os.makedirs(WD + "textures", exist_ok=True)
for f in ("pizza.usdc", "textures/pizza_basecolor.jpg"):
    if os.path.exists(WD + f): os.remove(WD + f)

# ---------------------------------------------------------------- read GLB
b = open(GLB, "rb").read()
off = 12; js = binb = None
while off < len(b):
    cl, ct = struct.unpack_from("<II", b, off); off += 8
    if ct == 0x4E4F534A: js = json.loads(b[off:off + cl])
    elif ct == 0x004E4942: binb = b[off:off + cl]
    off += cl
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
NORM = {5120: 127.0, 5121: 255.0, 5122: 32767.0, 5123: 65535.0}
def acc(i):
    a = js["accessors"][i]; bv = js["bufferViews"][a["bufferView"]]; dt = np.dtype(CT[a["componentType"]]); n = NC[a["type"]]
    start = bv.get("byteOffset", 0) + a.get("byteOffset", 0); stride = bv.get("byteStride", 0) or dt.itemsize * n
    raw = np.frombuffer(binb, np.uint8, count=stride * (a["count"] - 1) + dt.itemsize * n, offset=start)
    arr = np.lib.stride_tricks.as_strided(raw, (a["count"], dt.itemsize * n), (stride, 1)).copy().view(dt).reshape(a["count"], n)
    arr = arr.astype(np.float64)
    if a.get("normalized"):
        arr = np.maximum(arr / NORM[a["componentType"]], -1.0)
    return arr
def node_matrix(nd):
    if "matrix" in nd: return np.array(nd["matrix"], float).reshape(4, 4).T
    M = np.eye(4); t = nd.get("translation", [0, 0, 0]); r = nd.get("rotation", [0, 0, 0, 1]); s = nd.get("scale", [1, 1, 1])
    x, y, z, w = r
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M[:3, :3] = R * np.array(s)[None, :]; M[:3, 3] = t; return M
# world matrices
parents = {c: i for i, nd in enumerate(js["nodes"]) for c in nd.get("children", [])}
def world(i):
    M = node_matrix(js["nodes"][i])
    while i in parents: i = parents[i]; M = node_matrix(js["nodes"][i]) @ M
    return M
meshes = {}
for i, nd in enumerate(js["nodes"]):
    if "mesh" not in nd: continue
    M = world(i); me = js["meshes"][nd["mesh"]]; pr = me["primitives"][0]
    P = acc(pr["attributes"]["POSITION"]); P = P @ M[:3, :3].T + M[:3, 3]
    N = acc(pr["attributes"]["NORMAL"]); Nm = np.linalg.inv(M[:3, :3]).T; N = N @ Nm.T
    N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)
    UV = acc(pr["attributes"]["TEXCOORD_0"]) if "TEXCOORD_0" in pr["attributes"] else None
    F = acc(pr["indices"]).astype(np.int64).reshape(-1, 3)
    meshes[me["name"]] = dict(P=P, N=N, UV=UV, F=F, mat=js["materials"][pr["material"]])
    print("GLB mesh %-6s: %6d verts %6d tris, world bbox m %s .. %s" % (me["name"], len(P), len(F), P.min(0).round(5), P.max(0).round(5)))
img = js["images"][0]; bv = js["bufferViews"][img["bufferView"]]
jpg = binb[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
assert jpg[:2] == b"\xff\xd8", "texture is not a JPEG"
open(WD + "textures/pizza_basecolor.jpg", "wb").write(jpg)

# ---------------------------------------------------------------- USD stage
root = WD + "pizza.usdc"
stage = Usd.Stage.CreateNew(root)
UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
UsdGeom.SetStageMetersPerUnit(stage, 1.0)
top = UsdGeom.Xform.Define(stage, "/pizza_on_plate")
stage.SetDefaultPrim(top.GetPrim())
Usd.ModelAPI(top.GetPrim()).SetKind(Kind.Tokens.component)
stage.SetMetadata("comment", "Pizza on a white plate - scanned pizza with rebuilt crust side, procedural plate. Metres, Y up, plate bottom at y=0.")
UsdGeom.Scope.Define(stage, "/pizza_on_plate/Materials")

def make_material(name, mat):
    m = UsdShade.Material.Define(stage, "/pizza_on_plate/Materials/" + name)
    sh = UsdShade.Shader.Define(stage, m.GetPath().AppendChild("PreviewSurface"))
    sh.CreateIdAttr("UsdPreviewSurface")
    pbr = mat["pbrMetallicRoughness"]
    sh.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(float(pbr.get("roughnessFactor", 1.0)))
    sh.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(float(pbr.get("metallicFactor", 1.0)))
    sh.CreateInput("useSpecularWorkflow", Sdf.ValueTypeNames.Int).Set(0)
    sh.CreateInput("opacity", Sdf.ValueTypeNames.Float).Set(1.0)
    if "baseColorTexture" in pbr:
        rd = UsdShade.Shader.Define(stage, m.GetPath().AppendChild("stReader"))
        rd.CreateIdAttr("UsdPrimvarReader_float2")
        rd.CreateInput("varname", Sdf.ValueTypeNames.String).Set("st")
        rd.CreateOutput("result", Sdf.ValueTypeNames.Float2)
        tx = UsdShade.Shader.Define(stage, m.GetPath().AppendChild("diffuseTexture"))
        tx.CreateIdAttr("UsdUVTexture")
        tx.CreateInput("file", Sdf.ValueTypeNames.Asset).Set(Sdf.AssetPath("textures/pizza_basecolor.jpg"))
        tx.CreateInput("st", Sdf.ValueTypeNames.Float2).ConnectToSource(rd.ConnectableAPI(), "result")
        tx.CreateInput("wrapS", Sdf.ValueTypeNames.Token).Set("clamp")
        tx.CreateInput("wrapT", Sdf.ValueTypeNames.Token).Set("clamp")
        tx.CreateInput("sourceColorSpace", Sdf.ValueTypeNames.Token).Set("sRGB")
        tx.CreateInput("fallback", Sdf.ValueTypeNames.Float4).Set(Gf.Vec4f(0.7, 0.5, 0.3, 1.0))
        tx.CreateOutput("rgb", Sdf.ValueTypeNames.Float3)
        sh.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).ConnectToSource(tx.ConnectableAPI(), "rgb")
    else:
        c = pbr.get("baseColorFactor", [1, 1, 1, 1])
        sh.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*[float(v) for v in c[:3]]))
    m.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), "surface")
    return m

# plate material as specified for AR: white ceramic diffuse ~(0.93,0.93,0.91), roughness ~0.25, metallic 0
mats = {}
for name, d in meshes.items():
    mats[name] = make_material(d["mat"]["name"], d["mat"])

for name in ["plate", "pizza"]:
    d = meshes[name]
    mesh = UsdGeom.Mesh.Define(stage, "/pizza_on_plate/" + name)
    mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
    mesh.CreateOrientationAttr(UsdGeom.Tokens.rightHanded)
    mesh.CreateDoubleSidedAttr(False)
    mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(d["P"].astype(np.float32)))
    mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(d["F"]), 3, np.int32)))
    mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(d["F"].reshape(-1).astype(np.int32)))
    mesh.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(d["N"].astype(np.float32)))
    mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
    mesh.CreateExtentAttr(UsdGeom.PointBased.ComputeExtent(mesh.GetPointsAttr().Get()))
    if d["UV"] is not None:
        st = d["UV"].copy(); st[:, 1] = 1.0 - st[:, 1]   # glTF v points down, USD st origin bottom-left
        pv = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar("st", Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex)
        pv.Set(Vt.Vec2fArray.FromNumpy(st.astype(np.float32)))
    UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(mats[name])
stage.GetRootLayer().Save()
print("wrote", root)

# ---------------------------------------------------------------- package
if os.path.exists(OUTZ): os.remove(OUTZ)
cwd = os.getcwd(); os.chdir(WD)
ok = UsdUtils.CreateNewARKitUsdzPackage(Sdf.AssetPath("pizza.usdc"), OUTZ)
os.chdir(cwd)
print("CreateNewARKitUsdzPackage ->", ok, OUTZ, os.path.getsize(OUTZ), "bytes")

# ---------------------------------------------------------------- validate
st2 = Usd.Stage.Open(OUTZ)
print("reopened: metersPerUnit", UsdGeom.GetStageMetersPerUnit(st2), " upAxis", UsdGeom.GetStageUpAxis(st2), " defaultPrim", st2.GetDefaultPrim().GetPath())
bc = UsdGeom.BBoxCache(Usd.TimeCode.Default(), [UsdGeom.Tokens.default_, UsdGeom.Tokens.render])
rng = bc.ComputeWorldBound(st2.GetPseudoRoot()).ComputeAlignedRange()
mn, mx = np.array(rng.GetMin()), np.array(rng.GetMax())
print("world extent min %s max %s size (m) %s" % (mn.round(5), mx.round(5), (mx - mn).round(5)))
for p in st2.Traverse():
    if p.IsA(UsdGeom.Mesh):
        mm = UsdGeom.Mesh(p); bnd = UsdShade.MaterialBindingAPI(p).ComputeBoundMaterial()[0]
        print("mesh %s: %d points, %d faces, normals %s, st %s, material %s" % (p.GetPath(), len(mm.GetPointsAttr().Get()), len(mm.GetFaceVertexCountsAttr().Get()),
              mm.GetNormalsInterpolation(), UsdGeom.PrimvarsAPI(p).GetPrimvar("st").GetInterpolation() if UsdGeom.PrimvarsAPI(p).HasPrimvar("st") else "-", bnd.GetPath() if bnd else None))
    if p.IsA(UsdShade.Material):
        print("material", p.GetPath())
    if p.IsA(UsdShade.Shader):
        sh = UsdShade.Shader(p); sid = sh.GetIdAttr().Get()
        if sid == "UsdUVTexture":
            fa = sh.GetInput("file").Get(); print("   texture shader %s file %s -> resolved %s" % (p.GetPath(), fa.path, fa.resolvedPath))
        if sid == "UsdPreviewSurface":
            dc = sh.GetInput("diffuseColor"); print("   %s diffuseColor %s roughness %s metallic %s" % (p.GetPath(), dc.Get() if not dc.HasConnectedSource() else "<texture>",
                  sh.GetInput("roughness").Get(), sh.GetInput("metallic").Get()))
import zipfile
with zipfile.ZipFile(OUTZ) as z:
    for zi in z.infolist(): print("   package file %-36s %9d bytes  stored=%s  offset%%64=%d" % (zi.filename, zi.file_size, zi.compress_type == 0, (zi.header_offset + 30 + len(zi.filename) + len(zi.extra)) % 64))
# ARKit compliance: pxr.UsdUtils.ComplianceChecker was removed in usd-core 26.x -> run the checker script with usd-core 25.8
# (venv_usd258) and with this USD (UsdValidation framework).
import subprocess
for py, tag in [(S + "venv_usd258/bin/python", "usd25.8"), (sys.executable, "usd26.8")]:
    if os.path.exists(py):
        env = dict(os.environ)
        if tag == "usd25.8":  # the usd-core 25.8 wheel ships without the usdShaders plugin resources (shaderDefs.usda)
            env["PXR_PLUGINPATH_NAME"] = S + "final/work/usd258_plugins/usdShaders/resources"
        r = subprocess.run([py, "-W", "ignore", S + "scripts/final_usdz_check.py", OUTZ, WD + "check_%s.json" % tag], capture_output=True, text=True, env=env)
        print("---- check with", tag); print(r.stdout + r.stderr)
