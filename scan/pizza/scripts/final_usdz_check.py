"""Reopen a .usdz and validate it for AR Quick Look.
Runs pxr.UsdUtils.ComplianceChecker(arkit=True, skipARKitRootLayerCheck=False) when the installed USD has it (removed in
usd-core 26.x -> run this script with venv_usd258, usd-core 25.8), and the UsdValidation framework when present (26.x).
usage: final_usdz_check.py file.usdz [report.json]"""
import sys, json, zipfile, numpy as np
from pxr import Usd, UsdGeom, UsdShade, UsdUtils
path = sys.argv[1]; rep = {"usd_version": ".".join(map(str, Usd.GetVersion()))}
print("USD", rep["usd_version"])
st = Usd.Stage.Open(path)
print("metersPerUnit", UsdGeom.GetStageMetersPerUnit(st), " upAxis", UsdGeom.GetStageUpAxis(st), " defaultPrim", st.GetDefaultPrim().GetPath())
bc = UsdGeom.BBoxCache(Usd.TimeCode.Default(), [UsdGeom.Tokens.default_, UsdGeom.Tokens.render])
r = bc.ComputeWorldBound(st.GetPseudoRoot()).ComputeAlignedRange()
mn, mx = np.array(r.GetMin()), np.array(r.GetMax())
print("world extent (m): min %s max %s size %s" % (mn.round(5), mx.round(5), (mx - mn).round(5)))
rep.update(metersPerUnit=UsdGeom.GetStageMetersPerUnit(st), upAxis=str(UsdGeom.GetStageUpAxis(st)), size_m=(mx - mn).round(5).tolist())
mats, tex = [], []
for p in st.Traverse():
    if p.IsA(UsdShade.Material): mats.append(str(p.GetPath()))
    if p.IsA(UsdShade.Shader) and UsdShade.Shader(p).GetIdAttr().Get() == "UsdUVTexture":
        fa = UsdShade.Shader(p).GetInput("file").Get(); tex.append("%s (resolved %s)" % (fa.path, fa.resolvedPath))
print("materials:", mats); print("textures:", tex); rep.update(materials=mats, textures=tex)
with zipfile.ZipFile(path) as z:
    print("package:", [(zi.filename, zi.file_size, "stored" if zi.compress_type == 0 else "COMPRESSED") for zi in z.infolist()])
if hasattr(UsdUtils, "ComplianceChecker") or True:
    try:
        from pxr.UsdUtils.complianceChecker import ComplianceChecker
    except ImportError:
        ComplianceChecker = getattr(UsdUtils, "ComplianceChecker", None)
    if ComplianceChecker is not None:
        chk = ComplianceChecker(arkit=True, skipARKitRootLayerCheck=False, rootPackageOnly=False, skipVariants=False, verbose=False)
        chk.CheckCompliance(path)
        errs, fails, warns = chk.GetErrors(), chk.GetFailedChecks(), chk.GetWarnings()
        print("ComplianceChecker(arkit=True, skipARKitRootLayerCheck=False): %d errors, %d failed checks, %d warnings" % (len(errs), len(fails), len(warns)))
        for e in errs: print("  ERROR:", e)
        for f in fails: print("  FAILED:", f)
        for w in warns: print("  WARNING:", w)
        print("  rules run:", ", ".join(type(x).__name__ for x in chk._rules))
        rep["compliance"] = dict(errors=list(errs), failed=list(fails), warnings=list(warns), rules=[type(x).__name__ for x in chk._rules])
    else:
        print("ComplianceChecker not available in this USD build")
try:
    from pxr import UsdValidation as UV
    reg = UV.ValidationRegistry()
    md = reg.GetOrLoadAllValidatorMetadata() if hasattr(reg, "GetOrLoadAllValidatorMetadata") else reg.GetAllValidatorMetadata()
    names = [m.name for m in md if not m.isSuite]
    vals = [reg.GetOrLoadValidatorByName(n) for n in names]
    errs = UV.ValidationContext(vals).Validate(st)
    out = ["%s %s: %s" % (e.GetType(), e.GetName(), e.GetMessage()) for e in errs]
    print("UsdValidation (%d validators): %d issues" % (len(vals), len(out)))
    for o in out: print("  ", o)
    rep["usdvalidation"] = dict(n_validators=len(vals), issues=out)
except ImportError:
    pass
if len(sys.argv) > 2: json.dump(rep, open(sys.argv[2], "w"), indent=1)
