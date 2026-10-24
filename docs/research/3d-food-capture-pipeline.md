# A cheap pipeline for realistic 3D food (research notes, 2026-10-24)

Goal: turn a restaurant's real dish into (1) a life-size AR model guests open from a QR code and
(2) a photoreal 3D view on the web, using free tools on the user's own kit: **Windows laptop with an
RTX 4050 (6 GB VRAM) and an iPhone**. Built from the user's links (PlayCanvas splat guide,
SmartDataScan's Windows tutorial, Jawset Postshot, an r/GaussianSplatting thread about AR food menus)
and our own pizza test (`scan/pizza/` on branch `claude/pizza-ar-demo`).

## What we learned from the pizza

- A phone scan (Polycam) gives real food texture; single-photo AI (TRELLIS.2, Meshy, Hi3D) invents
  the hidden side and looks mushy on food. Scans win for truthfulness.
- White plates scan badly. Replacing the scanned plate with a modelled one (measured diameter) and
  rebuilding the crust edge gave a look the user liked (see `scan/pizza/README.md`).
- The weak point was the food itself (not appetising), not the model: capture a better-looking dish
  in better light.

## Splats or meshes: what phones can show in AR (checked 2026-10-24)

- **iPhone, from a website:** AR goes through AR Quick Look with a **USDZ mesh**. Apple added Gaussian
  splat rendering in **iOS 27** (`GaussianSplatComponent` / `GaussianSplatResource` in RealityKit,
  Apple7 GPU or newer), but it is for **native apps**: "The framework doesn't load files directly", so
  the app parses PLY itself; the docs don't mention Quick Look or USDZ. A Feb 2026 forum post says iOS
  can't display splats saved in USDZ. So no splat AR from a QR code in Safari. (Later option to research:
  an App Clip, opened from a QR code without installing an app, rendering splats with RealityKit.)
- **Android:** Scene Viewer's spec lists ordinary glTF meshes only. Splats in AR would need WebXR in
  Chrome with an engine that renders splats (e.g. PlayCanvas), always after a tap. Untested.
- **File format:** Khronos published `KHR_gaussian_splatting` (glTF) as a release candidate in Feb 2026;
  CesiumJS and Cesium for Unreal support it; no sign of `<model-viewer>` support.

**Decision: one capture, two outputs.** A cleaned **mesh** (GLB + USDZ) for AR on every phone, and a
**splat** for the photoreal 3D view on the web page (and maybe Android AR later). Because the user's
guests on iPhone will see the mesh in AR, mesh quality matters most.

## Tools (free unless noted)

| Tool | Role | Cost / licence | Platform, GPU |
|---|---|---|---|
| RealityScan (Epic) | Align photos, **mesh + texture**, export COLMAP poses | Free for companies under $1M annual revenue | Windows; alignment without CUDA, meshing needs a supported GPU |
| COLMAP | Align photos (camera poses, sparse points) | Open source | Windows/Linux/macOS |
| Brush | Train **splats** from COLMAP/Nerfstudio data | Open source | Windows/Linux/macOS/Android/Web, WebGPU, no CUDA |
| SuperSplat | View, crop, clean, compress splats | Open source, in the browser | Any |
| Postshot (Jawset) | Alignment + splat training in one app | Free plan is non-commercial and **can't export splats**; paid otherwise | Windows, NVIDIA RTX 2060 or newer |
| LichtFeld Studio | Splat training + editing | Open source (paid installer) | Windows/Linux, CUDA 12.8+ |
| Scaniverse | Splats trained on the phone | Free tier, unlimited | iOS/Android |
| Polycam | Mesh scans (splats on paid plans) | Splats need Basic or higher | iOS/Web |
| nerfstudio / gsplat | Splat training (splatfacto), COLMAP wrapper | Open source | Linux first; Windows works with more setup |
| INRIA 3DGS | Original reference code | Research/evaluation licence only, not for us | CUDA, 24 GB for paper quality |

Not verified: how far Brush gets on 6 GB VRAM (a dish is small, so probably fine; test it).

## Capture on iPhone

From PlayCanvas's guide, the Reddit thread and the pizza:
1. **Lock focus and exposure**: in the Camera app, press and hold on the dish until "AE/AF LOCK".
   Changing focus between shots is "the number one error" (Reddit); identical exposure is "the most
   critical aspect" (PlayCanvas).
2. **Stay on the 1x lens.** iPhone Pro models can switch to the ultra-wide lens for close-ups (Settings >
   Camera > Macro Control turns that off); a lens switch changes the focal length mid-capture.
3. **4K video** (PlayCanvas: 1080p is not enough for good splats). If tools struggle with the file,
   Settings > Camera > Formats > Most Compatible, and HDR Video off.
4. **Soft, even light**: daylight from a window or overcast, no direct sun, no single hard lamp.
5. **Slow orbits at 3 heights** (low, 45°, high), 70-80 % overlap; a dish this size needs about
   50-100 views. Keep the whole plate in frame.
6. **Be quick** (2-3 minutes): food changes as it cools; steam and fresh sauce shine.
7. **Measure the plate** (diameter) for true AR size. A matte plate helps; we can model the plate anyway.
8. Avoid mirrors, glass and chrome near the dish (false features).

## Process on Windows

1. **Frames:** keep every 2nd-5th frame of the video and drop blurry ones (SharpFrames, or ffmpeg plus a
   sharpness filter). Optional: remove backgrounds with REMBG.
2. **Align + mesh in RealityScan:** import frames, align, build mesh and texture, export the mesh (OBJ
   or glTF) and the COLMAP poses.
3. **Splat in Brush:** open the COLMAP export, train, save PLY. **Clean in SuperSplat:** crop to the plate,
   remove floaters, export compressed.
4. **Mesh cleanup (in a Claude session, CPU only):** the `scan/pizza/` steps: level, cut out the food,
   modelled plate at the measured size, edge rebuild, then GLB (Scene Viewer limits: no extensions,
   2048 px, about 100k triangles) + USDZ (ARKit compliance check).
5. **On the site:** AR button = mesh (Quick Look / Scene Viewer); 3D view = splat (PlayCanvas or a
   three.js splat renderer), or the mesh until splats are proven on phones.

All software is free for this use; the cost is capture time. Training runs on the laptop: cloud
sessions here have no GPU.

## Sources
- PlayCanvas: [Creating splats](https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/),
  [Recommended tools](https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/recommended-tools/),
  [Taking photos](https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/taking-photos/)
- [SmartDataScan: Gaussian splatting on Windows](https://smartdatascan.com/tutorials/gaussian-splatting-windows/)
- [Jawset Postshot](https://www.jawset.com/)
- Apple: [GaussianSplatComponent](https://developer.apple.com/documentation/realitykit/gaussiansplatcomponent),
  [Gaussian Splat Rendering Guidelines](https://developer.apple.com/documentation/realitykit/gaussian-splat-rendering-guidelines)
- [Needle forum: Gaussian splat AR on iPhones](https://forum.needle.tools/t/gaussian-splat-ar-on-iphones/2515)
- [Khronos: glTF Gaussian splatting extension](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release)
- [Google Scene Viewer spec](https://developers.google.com/ar/develop/scene-viewer)
- r/GaussianSplatting thread "New to NeRFs — want to build realistic 3D food models for AR menus"
  (screenshots shared by the user)
