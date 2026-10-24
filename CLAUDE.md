@AGENTS.md

# QRMenu marketing website

This repo is the **public marketing website** for QRMenu, a QR-code menu
service for restaurants. A colleague builds the product itself in a separate
codebase, so don't build product features (admin panel, analytics backend,
menu editor) here. This site *presents* them.

## The product

Where it started: a guest scans a QR code at the table, and their phone camera
shows a life-size 3D model of the dish sitting on their table. They can judge
the size and how good it looks before ordering. There's no app to install;
the phone camera and browser are enough.

What it grew into is a central system for running a restaurant:
- **Digital menu** opened by scanning a QR code. Restaurants can also keep
  their printed menus and add a QR code per dish that opens its 3D model.
- **3D / AR dishes**: a novelty that makes guests curious to try things.
- **Operations**: which table ordered what, bills, table status, how long
  guests have been waiting, staff management.
- **Analytics** across all of the above.

Who it's for: restaurant owners and managers buy it; guests experience the
"wow". The site sells to owners and uses the guest experience as the hook.

Don't advertise a feature as available unless the user has confirmed it is
built. Ask when unsure, and label planned features "coming soon".

## Goal

A high-quality, interactive, fast website: strong visuals and motion that
point at the product, while staying responsive on mobile, accessible
(reduced-motion, contrast, keyboard) and SEO-friendly.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4.
Animation: `motion` (React), CSS scroll timelines, and GSAP 3.15 (free incl. all
plugins, gsap.com/standard-license) with `@gsap/react`: import from `@/lib/gsap`
(registers ScrollTrigger, SplitText, Flip once; rarer plugins are imported where
used), animate inside `useGSAP` in Client Components, gate with `gsap.matchMedia()`
+ `REDUCED_OK`. three.js 0.183 (pinned to model-viewer's version) for live 3D.

## Tools to reach for

Personal skills (installed per user, not in this repo), when available:
`motionsites` (design briefs), `react-bits` (animated components),
`screenshot-to-code` (match designs + visual checks), `crawl4ai` (competitor
research), `reverse-engineer-anything` (how an interaction works),
`ponytail` (keep code lean, but never drop requested features, visual
quality or accessibility).

## Where things live

- Copy: `src/i18n/dictionaries/{en,de,fr,es,ru,az,tr}.ts`. English defines the shape;
  TypeScript fails the build if another language misses a key.
- Brand name and contact email: `src/lib/site.ts` (both placeholders).
- Home page (2026-10-19): the **floor story** (`components/home/floor/`: `FloorStory.tsx` +
  `scene.ts`, words in the dictionaries under `floor`), then How it works (`home/how/`), Plans, FAQ,
  Contact (`home/Sections.tsx`). "For owners" jumps to `#owners`, a marker near the story's end
  (the dashboard). `/[lang]/lab/floor` redirects home. The story's "Try it yourself" leads to
  `/[lang]/demo` (`components/demo/BurgerViewer.tsx`, `<model-viewer>` with `public/models/burger.glb`,
  self-hosted Draco in `public/draco`).
- **Saved, not live (2026-10-24): the scanned pizza demo** on branch `claude/pizza-ar-demo`: a real
  Polycam scan of the user's pizza on a modelled 26 cm plate (`public/models/pizza.*`), a reusable
  `DishViewer` + `lib/dishes.ts` (`DEMO_DISH` switch, burger kept), AR straight from the QR code with a
  "point it at a table in good light" hint, and `scan/pizza/` (source scan, scripts, README with the
  steps). The user liked how the 3D model looks but not that pizza as food: wait for a more appetising
  dish, then make it the same way. It was reverted here so a deploy can't ship it; bring it back with
  `git revert` of the revert commit (or cherry-pick from that branch).
- No longer on the home page (kept for now, ask before deleting): the burger film hero
  (`home/hero/`, frames in `public/hero/`), `TryIt.tsx`, the `Owners` section; their dictionary keys
  (`hero`, `story`, `journey`) are unused.
- The burger itself: `blender/burger.py` (Blender as a Python module; geometry,
  numpy textures, lights and animation all in code) and `blender/pack.py`
  (renders -> web frames). See "Re-rendering the burger" below.
- Copied React Bits components: `src/components/react-bits/` (keep its LICENSE).

## Current status (update this when you finish a chunk of work)

Done (v1, desktop-first): one-page home in en/de/fr/es/ru with the
scroll-built pizza hero, guest journey phone, how it works, owner dashboard
demo, plans (no prices, "Get a quote"), FAQ (+ FAQPage JSON-LD) and contact.

Done (v2 design, 2026-10-06): restyled after the MotionSites prompt
**Cast and Render** (the user picked it; opened once, 2 free opens left on the
account, don't re-open it). What we took from it:
- Light editorial look: paper `#f2f0ec`, ink `#0d0c0b`, muted `#5f5e5c`, one
  tomato accent `#b83219` (all AA on paper). Inter Tight 400/500 (covers
  Cyrillic) for text; headlines changed to Anton later (see below).
- Fine SVG grain over the page (`body::after`), black `.pill` CTAs and
  `.pill-ghost` (in `globals.css`), header as a paper gradient fade with a
  2px scroll-progress hairline (CSS scroll timeline, no JS).
- Hero: fixed stage; scroll eases the 3D build (never snaps) while centred
  text panels cross-fade with smoothstep ramps, 22px drift and quiet gaps
  between them (`PANEL_CUES` in `pizza/timeline.ts`). The pizza is framed in
  the space measured under the hero copy, so long translations and short
  screens don't overlap. Build stages sit in a centred line at the bottom.
- Not taken: the brief's stock studio video and its full-screen preloader
  (would hurt first load).

Done (v3, 2026-10-06): the code-made pizza and the phone mockup are gone (the
user found the pizza too basic and the phone too close to armenu.co.uk).
- Hero: a realistic cheeseburger modelled and path-traced in Blender, styled on
  the user's reference clip (frames were shared in chat, not kept): toasted bun,
  craggy seared patty, cheese that melts and drips, pickles, shredded onion,
  sauce, glossy brioche. Story: finished burger -> layers lift away -> each
  ingredient drops back -> camera orbits -> AR frame. Light paper background
  (the user chose it over the reference's dark set). Desktop: copy left, burger
  right; below lg: copy on top, burger under it.
- Guest section: "Try it yourself" with a real QR code to `/[lang]/demo` (live 3D
  burger, AR button on supporting phones) plus the five numbered steps.
- Unverified: AR on real phones (model-viewer: Scene Viewer on Android, a USDZ it
  generates itself for iOS Quick Look). Ask the user to test on their phones.

Decided / waiting on the user:
- **Realism**: the procedural burger is the current best; a real photogrammetry
  scan (or the team's own filmed build) would beat it. Don't use the reference
  YouTube clip itself on the site (not ours).
- **Launch** (user said "launch", 2026-10-19): stays on onrender.com, free plan, brand "QR Menu".
  robots.txt + sitemap.xml (all locales, hreflang) and `app/icon.svg` (logo mark) added.
- **Contact email** still a placeholder: the user is giving the real sales inbox (change `CONTACT_EMAIL`).
- **Translations**: the user is reviewing de/fr/es/ru. Azerbaijani and Turkish added 2026-10-19
  (machine-quality first drafts by Claude: get a native speaker to read them before launch). Azerbaijani
  numbers are formatted with the German rules (identical, and every browser has them).
- **Mobile polish is deferred** until the design settles; don't spend time on it.
- Claims to confirm before launch: which phones support the AR view; that
  restaurants can edit dishes and prices themselves.

Done (2026-10-17): headlines switched to tall condensed capitals after the
user's Le Pain Quotidien reference (it uses Druk, a paid font). The user chose
Anton (free) with Oswald 700 catching Russian letters (Anton has no Cyrillic);
`.headline` in `globals.css`, fonts in `[lang]/layout.tsx`. Inter Tight stays for
body text and small titles. Section headings use `FocusHeadline`: words go from
blurred to grey to ink as the heading scrolls up (CSS scroll timeline, still under
reduced motion; browsers without scroll timelines show plain text).

In progress (2026-10-17): a "scan to 3D" intro for the burger film (dots -> tomato
wireframe -> a glowing scan line builds the real burger; last frame = film frame 0),
in `blender/burger.py` (`--intro-still N`, `--intro [--half]`). Preview first, then
decide with the user how it plays on the site (once on load is the plan).

Done (2026-10-17): "How it works" is an Anatomy-style isometric figure (camera +
turntable -> monitor builds the 3D model -> printer issues the QR code -> phone
shows the dish), with the four steps under it. The server builds the SVG once
(`home/how/art.mjs`, from the approved prototype in `prototypes/how-it-works/`);
`HowItWorksLive.tsx` tours the stations, follows pointer/keys/step hover, pauses
offscreen, rests on the last station under reduced motion. Kit (MIT) vendored in
`src/components/iso/`. Words in `how.figure` in the dictionaries.

In progress (2026-10-17): the user wants the 3D burger OUT of the hero (too toy-like)
and a new concept after lightgearlab.com + vectrfl.com (`docs/research/lightgearlab-vectr.md`). Three
previews, unlinked noindex: `/[lang]/lab/concept-1` (clay miniature restaurant on
paper + tomato, numbered steps, then it comes apart into labelled layers),
`concept-2` (pale-blue Vectr-style fly-over), `concept-3` (line drawing in a box on
bold full-page colours). Shared code in `src/components/lab/` (procedural restaurant
kit, stage, `ConceptStory`, configs with draft copy). Waiting for the user's pick.
The 3D burger STAYS as the hook in "Try it yourself" and on /demo.

In progress (2026-10-18): the user liked the concepts' idea but found them sloppy (lines crossing,
"sketch" look). New direction, after LightGearLab's frames: **floor story** preview at
`/[lang]/lab/floor` (`components/lab/floor/`): a real QR code rises into a mini restaurant
(finder squares = kitchen/bar/till rooms, timing rows = planters, other dark squares = tables,
chairs on free squares) -> a menu book on one table opens on a dish with its own (real) QR code ->
the real burger (`public/models/burger.glb`, metres = life-size) is revealed on the plate by a
rising scan ring (clipping plane) and the camera circles it, "Try it yourself" -> line-drawing
chapters on saffron/tomato/basil (order, kitchen, bill) -> floor inside a dashboard frame with
status colours -> analytics bars grow out of the tables, the room sinks back into the code and the
bars fly together as bricks and land exactly on the dashboard's "Busiest hours" bars (the story
measures `[data-hour-bar]` on screen and maps them onto the 3D chart's plane; the camera ends
straight-on) -> the real `OwnerDashboard` fades in over them, the 3D scene fades out -> (the user's favourite) scrolled through as the finale. One merged-geometry scene, one shader `rise`; clay and line looks
share meshes (paper-coloured faces + 20° edges + inverted-hull outlines, LightGearLab's method).
Rooms (2026-10-19): kitchen (range with oven door/knobs, lidded pot, pan, wall counters with sink,
board, plates, tickets pinned on the wall, fridge, two chefs), bar (back shelf of bottles, taps, glasses,
coffee machine, bartender), till (card terminal, receipt printer, bill tray where the bill line lands,
tip jar, cake display, bench, cashier, a guest paying). Smoothness: shadows redrawn only when the room
changes (`shadowMap.autoUpdate = false`), shaders/textures compiled up front (`compileAsync`),
adaptive pixel ratio, style writes only on change, no backdrop blur or multiply grain over the canvas.
It became the home page on 2026-10-19 (the user: "this will be our main website"), in all seven
languages. Sample data; the dashboard features (orders, kitchen, bills, table status, analytics) are
described in the existing site copy too, but confirm with the user before launch.
Headlines: `.headline` line-height is 0.94 for English, 1.12 for az/tr and 1.02 for de/fr/es
(marks on capitals collided).

3D QR (`components/qr3d/QrScene.tsx`, lab page `/[lang]/lab/qr`): rebuilt (2026-10-18) from
the user's louisraille.fr reel frames: a tall tree whose leaves are square plates stacked only
above the code's dark squares, grey paving with fallen leaves, tall grass on the edges and finder
corners, rain in autumn; an orthographic camera turns from isometric to straight above, where it
scans (all seasons checked with jsQR on downscaled shots; per-season `deep` darkens leaf tops).
Not on the homepage yet.

Research: how the Awwwards-winning igloo.inc is built, and what fits QRMenu,
is in `docs/research/igloo-inc.md`; Ciao Energy and FIX Chocolatier in
`docs/research/ciao-energy-fix-chocolatier.md`. awwwards.com resets connections from cloud
sessions (even with domain access).

Next up: the user's feedback on the burger film and the QR demo (and AR tests
on their phones); possibly a separate Pricing page. Before opening another MotionSites prompt, show the user a
shortlist (only 2 free opens left).
The user's earlier experiment, https://restaurant-3d-eight.vercel.app/, is
blocked from cloud sessions; ask for its GitHub repo or screenshots.

Live preview: https://qrmenu-preview.onrender.com (Render free web service
`qrmenu-preview`, id `srv-db2bvgrtqb8s73cs6gqg`, branch `claude/nice-ramanujan-rqzau5`;
sleeps when idle, so the first visit takes up to a minute). Render reports auto-deploy
on commit (2026-10-24); after pushing, check with the Render tools that a deploy started
and reaches "live", and trigger one if none did. `NEXT_PUBLIC_SITE_URL` is set there for the QR code. The Vercel connector can't
create projects in the user's team (403 on scope), hence Render. Cloud sessions
can't open onrender.com; check deploys with the Render tools instead.

Re-rendering the burger: `uv venv -p 3.13 bl && uv pip install -p bl/bin/python
bpy pillow numpy`, then `bl/bin/python blender/burger.py --still 0 44 --full` to
check a look, `--frames` for all 120 frames (about 1 min each on 4 CPU cores,
resumable, coarse-to-fine order), `bl/bin/python blender/pack.py` to write the
web frames, and `--export` + the gltf-transform command in `export_models()` for
the demo model. Timings live in burger.py and are written to
`src/components/home/hero/burger-timeline.json` for the site.

Checking visuals: run `npm run dev`, then use Playwright with
`executablePath: "/opt/pw-browsers/chromium"` and
`--use-gl=angle --use-angle=swiftshader` so WebGL renders. Scroll with
`behavior: "instant"`, because the site uses smooth scrolling. Most outside
websites are blocked by the cloud network policy.

Security (2026-10-24): Next.js 16.4.3 (16.3.8 had a critical advisory, GHSA-2464-fhr4-w9xw);
security headers incl. a strict CSP live in `next.config.ts`. Everything is self-hosted, so the CSP
allows only our origin: anything new from another domain (fonts, analytics, video) must be added
there or it will be blocked. Run `npm audit` before launch-type changes.

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run build`: production build (run before pushing)
- `npm run lint`: ESLint
