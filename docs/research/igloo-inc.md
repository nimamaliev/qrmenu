# How igloo.inc is built (research notes, 2026-10-17)

Igloo Inc. (https://www.igloo.inc), by Abeto with Bureaux; Awwwards Site of the
Year and Developer Site of the Year 2024. Studied from the files the live site
ships (downloaded in a headless browser), the REA static JavaScript analysis of
its bundle, and screenshots while scrolling. Nothing here is their source code;
names below are from the minified bundle and its GLSL strings. Not copied into
this project: their code, models, textures and sounds are theirs.

## Stack (observed in the bundle)
- Svelte (UI shell and router: `/`, `/portfolio/:project`), Three.js
  (WebGL2 required; a fallback message otherwise), GSAP for tweens,
  `pmndrs/postprocessing` (EffectComposer), three-mesh-bvh, Vite chunks.
- The page is one full-screen canvas. `index.js` is 16 KB; the 1.5 MB 3D chunk
  (`App3D-*.js`) loads after it. About 230 GLSL shader strings.
- Logs "🧊 by https://abeto.co" to the console.

## Loading and assets
- Geometry: Draco (`.drc`, e.g. the igloo is 223 KB). Textures: KTX2/Basis
  (GPU-compressed), one EXR environment for the ice cubes. Fonts as MSDF atlases
  (`IBMPlexMono-Medium.json` + a KTX2 data texture). Workers decode EXR, bitmaps,
  MSDF and audio off the main thread. About 20 small OGG sounds plus music.
- Realism is baked: `igloo_color`, `igloo_exploded_color`, `ground_color`,
  `mountain_color`, `floor_color` are lightmaps rendered offline (Houdini/Blender
  per the Awwwards case study), so the live shaders are cheap. The igloo even has
  a second lightmap for its "exploded" state and cross-fades between them by
  each block's displacement.

## Scroll
- No native page scroll (document height = viewport). A wheel listener
  (`passive: false`) and touch drag feed a virtual scroll: delta adds to a
  velocity with frame-rate-independent friction (`exp(log(0.97) * frameRatio)`),
  clamped, eased toward a target. Arrow keys move it by 150 units.
- After you stop, an "auto-center" GSAP tween settles on the nearest section.
- No `prefers-reduced-motion` handling was found in the bundle.

## The scroll story (from screenshots)
1. A wireframe igloo glows into being among floating line triangles.
2. The igloo turns solid; snowy ground grows out from under it, then mountains.
3. Scrolling on, the blocks lift apart and glow at their seams; UI fades in.
4. A diagonal cut with rainbow (chromatic) edges wipes to the portfolio:
   one ice block per project, a shattered ice ring, a glowing portal ring.
5. A particle Pudgy Penguin stands on a round platform and reacts to the mouse.
6. The sequence then comes round to the igloo again (it appears to loop).

## Effects worth knowing
1. **Materialize intro.** The igloo appears bottom-up: a height falloff
   (`falloffsmooth(vPos.y, …, uIntroMaterialize)`) discards what isn't revealed
   yet, and the band at the edge glows blue with a tiling triangle texture, so
   it reads as a wireframe/scan turning solid. The ground and mountain use the
   same `uProgress` + triangle texture + noise reveal.
2. **Exploding blocks.** Igloo blocks are one batched mesh; per-block matrices
   and options live in data textures (`batchingTexture`, `tOptions`). Displaced
   blocks glow at their seams and switch to the "exploded" lightmap.
3. **Scene transition.** Two scenes render to textures; a full-screen shader
   wipes between them along a diagonal "ice cut" shaped by a noise texture
   (`scroll-datatexture`), with chromatic aberration at the cut, vertical
   parallax, and blue-noise dithering to hide banding.
4. **WebGL text.** Labels are MSDF text meshes; letters/lines carry weights so a
   shader can stagger a slide-and-fade or a masked wipe per letter
   (`uAnimationOrder`, `uAnimationProgress`, `uAnimationMargin`).
5. **Particles shaped by volume data.** GPU particles (position and velocity in
   float textures, updated by a fragment shader) are pulled toward a 3D signed
   distance field stored as a 3D texture (`sampler3D`: gradient in RGB,
   distance in A; e.g. `volumes/peachesbody_64.ktx2`, 64³). A 2D fluid
   simulation driven by the mouse pushes them around.
6. **Mouse fluid.** A small stable-fluids sim (advect, curl, divergence,
   pressure) feeds several effects (particles, ground ripples).
7. **Grade and finish.** LUT colour grading, bloom-style glow, fog, wind-noise
   textures for drifting snow, optional sound design.

## What fits QRMenu (ideas, not decisions)
- **Scan-to-3D intro for the burger**: the materialize effect is literally our
  product story (photos → 3D model). Pre-render it in Blender as part of the
  hero film (cheap at runtime), or do it live on the demo model.
- **Bake lighting** into the demo `burger.glb` so the live model looks like
  the rendered film; convert its textures to KTX2.
- **A noise-shaped wipe** between the hero film and the next section.
- **Per-letter masked text reveals** in CSS (keeps text real for SEO and
  screen readers) instead of WebGL text.
- Keep native scrolling plus our eased scrubbing (better for accessibility and
  SEO than a virtual scroll), and keep reduced-motion support.
- Particles forming a dish or a QR code: impressive but heavy; later, if ever.
