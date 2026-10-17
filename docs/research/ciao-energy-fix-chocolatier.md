# Ciao Energy and FIX Chocolatier (research notes, 2026-10-17)

Two product sites the user likes for their interaction, motion and smoothness.
Studied from what they ship (code downloaded in a headless browser) and
screenshots while scrolling. Their code, models, videos and sounds are theirs;
only techniques carry over.

## Ciao Energy (https://www.ciaoenergy.com)
Energy drink, six flavours. Dark violet studio, one fixed WebGL canvas behind
the page.

- **Stack:** Webflow, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3 smooth
  scroll (`infinite: true`, `syncTouch: true`), Three.js with EffectComposer.
  The 3D and UI code is inline and unminified (French comments).
- **One timeline for the whole page.** A plain object holds the scene's state
  (camera position/rotation/fov, can scale/position/rotation, spin, wave,
  swirl, light intensity, tint). A paused GSAP timeline has one tween per
  section, each lasting `section height / scroll height`, and every frame does
  `timeline.seek(scroll / scrollHeight)`. The render loop then reads the object.
  Adding a section means adding one tween of target values.
- **Smoothing on top:** carousel position and pointer are lerped each frame
  (`lerp(a, b, delta * 10)`), cans tilt a little toward the cursor, so the
  scene never snaps even when the scroll does.
- **Carousel of cans:** 6 labels (AVIF textures on one GLB can), duplicated to
  24 (12 on phones), wrapped around on a wave. Drag/swipe, arrows, click a can
  to go to it; a short sound on every change; a looping background video per
  flavour.
- **Section snapping** on desktop after scrolling stops (debounced `scrollend`),
  infinite scroll that loops back to the top.
- **Text:** SplitText line masks (`mask: 'lines'`, `yPercent` 110 -> 0,
  staggered), toggled by ScrollTrigger as sections enter and leave.
- **Phones:** lighter material (Standard instead of Physical), fewer cans,
  pixel ratio capped; WebGL context loss handled (iOS).
- **Weight:** about 74 requests, 8 MB (videos and textures).

## FIX Chocolatier (https://www.fixchocolatier.com)
"The original Dubai chocolate". Warm brown studio.

- **Stack:** Next.js (Turbopack build, like ours), React Three Fiber + drei,
  Three.js r181, GSAP with ScrollTrigger and ScrollSmoother, Draco GLBs, an EXR
  studio environment for reflections, Vimeo-hosted videos up to 2160p.
- **Story:** a percentage preloader, then the gift bag drops in from above and
  lands with its shadow (an animated, skinned GLB, `bag_drop_sequence`), bars
  burst out of it, then a slow-motion cascade of bars tumbles past the camera
  as you scroll.
- **Weight:** about 218 requests and 38 MB. The smoothness costs a long
  preload; the user sees only a percentage until it is done.

## What fits QRMenu
- **A single scroll timeline driving one scene** (Ciao's pattern) suits our
  hero if we ever move from pre-rendered frames to live 3D: keyframe the camera
  and each ingredient per section, seek by scroll, lerp on top.
- **Lerp everything toward its target** (we already do this for the frame
  scrubber) and add a small pointer tilt to 3D objects.
- **Line-mask text reveals** for body copy, alongside our word focus headings.
- **A dish carousel** (several dishes, drag/swipe, a click opens it) once we
  have more than the burger.
- **Not taking:** long preloaders and 8-38 MB pages (we stay fast), infinite
  scroll loops and forced snapping (they fight accessibility and SEO), sound on
  by default.
