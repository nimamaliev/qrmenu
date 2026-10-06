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

## Tools to reach for

Personal skills (installed per user, not in this repo), when available:
`motionsites` (design briefs), `react-bits` (animated components),
`screenshot-to-code` (match designs + visual checks), `crawl4ai` (competitor
research), `reverse-engineer-anything` (how an interaction works),
`ponytail` (keep code lean, but never drop requested features, visual
quality or accessibility).

## Where things live

- Copy: `src/i18n/dictionaries/{en,de,fr,es,ru}.ts`. English defines the shape;
  TypeScript fails the build if another language misses a key.
- Brand name and contact email: `src/lib/site.ts` (both placeholders).
- Home page sections: `src/components/home/`. The hero is a pre-rendered
  burger film scrubbed by scroll (`hero/BurgerStory.tsx`, `hero/FrameScrubber.tsx`,
  frames in `public/hero/{d,m}/NNN.webp`). "Try it yourself" QR section:
  `TryIt.tsx`, leading to `/[lang]/demo` (`components/demo/BurgerViewer.tsx`,
  `<model-viewer>` with `public/models/burger.glb`, self-hosted Draco in `public/draco`).
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
  tomato accent `#b83219` (all AA on paper). Inter Tight 400/500 only (covers
  Cyrillic); big display type at weight 400 with `tracking-display` (-0.036em).
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
- **Contact email** stays a placeholder until the user provides one.
- **Translations**: the user is reviewing de/fr/es/ru.
- **Mobile polish is deferred** until the design settles; don't spend time on it.
- Claims to confirm before launch: which phones support the AR view; that
  restaurants can edit dishes and prices themselves.

Next up: the user's feedback on the burger film and the QR demo (and AR tests
on their phones); possibly a separate Pricing page. Before opening another MotionSites prompt, show the user a
shortlist (only 2 free opens left).
The user's earlier experiment, https://restaurant-3d-eight.vercel.app/, is
blocked from cloud sessions; ask for its GitHub repo or screenshots.

Live preview: https://qrmenu-preview.onrender.com (Render free web service
`qrmenu-preview`, auto-deploys the branch `claude/nice-ramanujan-rqzau5`; sleeps
when idle, so the first visit takes up to a minute). The Vercel connector can't
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

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run build`: production build (run before pushing)
- `npm run lint`: ESLint
