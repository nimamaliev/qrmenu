# LightGearLab and Vectr (research notes, 2026-10-17)

Two sites the user found in the GSAP community and wants the new homepage to
draw on (after deciding the 3D burger hero looks like a toy). Studied from what
they ship (code downloaded in a headless browser) and screenshots while
scrolling. Their code and models are theirs; only techniques carry over.

## LightGearLab (https://lightgearlab.com)
A web/mobile/game studio in Malaysia. One object carries the whole site.

- **Stack:** plain HTML, GSAP 3.13 + ScrollTrigger from jsDelivr, Three.js
  0.170 via an import map, Draco GLB (`engine.glb`), small sound effects. The
  3D code is one unminified inline module (~110 KB) with section comments.
- **Story:** a dark teal "projection room": a little machine (a box of gears)
  sits in front of a wall and casts its shadow on it; a projector flickers on.
  The camera comes round to the box, which is then drawn as clean technical
  lines ("hidden-line" look); a hose with fluid plugs into its side.
- **Colour per section:** the page's paper and ink colours are tweened with
  scrubbed ScrollTrigger timelines (yellow "Speed", teal "Quality development",
  dark), while the camera visits that part of the machine.
- **Take it apart:** a final scroll timeline explodes the machine in stages
  (fasteners, frame, drivetrain) and adds right-aligned monospace callout
  labels with leader lines ("Take it apart, you'll find people").
- **View modes:** Solid / Lines / X-ray toggle; deep links (`?view=`,
  `?explode=`) for testing.
- **Weight:** about 73 requests, 4.3 MB.

## Vectr (https://www.vectrfl.com)
AI-driven staffing for industrial outages. Calm and minimal.

- **Stack:** Astro, GSAP (ScrollTrigger, Flip, Observer), Lenis smooth scroll,
  three.js `WebGPURenderer` (falls back to WebGL2). In headless Chromium it only
  renders with WebGPU hidden (otherwise the failed WebGPU attempt blocks the
  WebGL context): worth knowing if we use the WebGPU renderer.
- **Look:** a pale blue-grey miniature city in a clay-model style (buildings,
  wind turbines, tiny people), one bright red accent line for a route, thin
  dotted orbit circles and a particle "arrow" logo.
- **Story:** the camera glides over the city as you scroll while a numbered
  list (01 Activation, 02 Cleared to count, 03 Proven field match, 04 Seamless
  arrival) highlights the current step; then plain white sections with icons, a
  photo, FAQ, and a dark footer with a huge wordmark.
- **Weight:** about 27 requests, 5 MB.

## What we built from them (lab previews)
`/[lang]/lab/concept-1..3`, shared code in `src/components/lab/`: a miniature
restaurant built from simple shapes in code (no downloads), red "order lines"
that draw themselves from table to kitchen to till to the owner's desk, camera
stops per step, GSAP ScrollTrigger driving one progress value.
1. Clay on paper + tomato, Vectr-style numbered list, then LightGearLab's
   take-apart into labelled layers with a dark finale.
2. Vectr's pale blue clay fly-over with the numbered list.
3. LightGearLab's line drawing (restaurant in a box) on bold full-page colours
   with poster titles and the take-apart finale.
