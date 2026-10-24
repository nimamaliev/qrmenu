# Pizza scan → AR model

How the demo pizza (`public/models/pizza.glb`, `pizza.usdz`, `pizza-poster.webp`) was made, kept so the
next dish can get the same look. The user liked the result (clean modelled plate, real scanned food,
baked crust edge) but not this pizza as food, so it is not on the live site.

- `source/pizza-polycam.glb`: the user's Polycam scan (2026-10-20), ~75 x 83 cm of table, Y-up, metres,
  one 8192 px JPEG texture, 298k triangles, no normals. The real plate measured 26-27 cm.
- `preview.png`: renders of the finished model.
- `scripts/`: the Python that did it. A working record, not a tool yet: paths point at the session's
  temporary folder (`/tmp/claude-0/.../scratchpad`), and the plate centre and table height are this
  scan's values. Python 3.13 with trimesh 4.5.3, numpy, scipy, pillow; usd-core for the USDZ;
  gltf-transform 4.1 on the command line; renders with Playwright + a local `<model-viewer>` page.

## Steps

1. **Measure** (`plate_topmap.py`, `plate_faces.py`, `plate_measure.py`, `plate_tilt.py`, `plate_level.py`,
   `plate_section.py`): top-down height and colour maps, plate circle fit, level the scan so the table
   is flat, rim and floor heights. Plate came out at 26.4 cm.
2. **Separate the food** (`plate_segment.py`): sample the texture at each face; white plate, beige wood
   and pizza are told apart by colour plus radius and height. Keep every pizza face, including the
   real torn crust.
3. **Model the plate** (`plate_model.py`): a revolved profile with a flat floor, curved rim, rounded lip
   and foot ring, glazed white (roughness 0.25). The scanned plate is thrown away; white ceramic
   scans badly.
4. **Put the food on it** (`plate_build.py`): pizza placed on the plate floor, texture repacked to the
   pizza's own UV islands (4096 JPEG).
5. **Rebuild the crust edge** (`fixB_*.py`, then `final_make_build.py` writes `final_build.py`): the scan's
   steep faces between crust and plate had stretched, streaky texture. They are cut away and a short
   crust wall with real crust colour is built down to the plate; the high arcs are eased down, grey
   edge texels recoloured, and no point sits below the plate.
6. **Export**: `final_build.py` writes the 4K GLB (KHR_mesh_quantization). `final_usdz.py` writes the
   USDZ (metersPerUnit 1, UsdPreviewSurface); `final_usdz_check.py` and `final_check.py` verify it
   (ARKit ComplianceChecker: 0 errors). The web/Android GLB is the 4K one made Scene Viewer-safe:
   `gltf-transform dequantize`, `weld`, `simplify --ratio 0.6 --error 0.0004`,
   `resize --width 2048 --height 2048` (~96k triangles, 3.0 MB, no extensions).

## Capture tips for the next dish

Shoot it on a matte plate in soft, even light, walk all the way round at two heights, and measure the
plate. Glossy sauces and white plates are the hardest parts to scan; the plate can be replaced as here.
