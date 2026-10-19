# QRMenu website

Marketing website for **QRMenu**: QR-code menus for restaurants. Guests scan a code and see
dishes in 3D, life-size on their table; owners run orders, tables, bills and analytics from one
system.

Live: https://qrmenu-preview.onrender.com (free Render plan, so the first visit after a quiet
spell can take up to a minute).

## What's on the site

- **Home page**: one scroll story in 3D. A real QR code rises into a little restaurant, a menu
  book opens on a dish with its own QR code, the dish appears in 3D on the plate, then line-drawn
  chapters show the order, kitchen and bill, and the floor turns into the owner dashboard, with
  analytics bars that fly into its hourly chart. After it: how it works, plans, FAQ, contact.
- **3D demo** at `/[lang]/demo`: the burger in the browser, with AR on phones that support it.
- **Languages**: English, German, French, Spanish, Russian, Azerbaijani, Turkish.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # run before pushing
npm run lint
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger),
three.js, `<model-viewer>`.

## Where things live

- `src/components/home/floor/`: the home page story (`FloorStory.tsx`) and its 3D scene (`scene.ts`).
- `src/i18n/dictionaries/*.ts`: all the words; English defines the shape, and the build fails if
  another language misses a key.
- `src/lib/site.ts`: brand name, contact email and site URL.
- `src/components/demo/`, `public/models/`: the 3D demo and the burger model.
- `blender/`: the burger, modelled in code with Blender's Python module.

## Deploy

The live site is a Render web service built from this branch. Pushing does not deploy by
itself: trigger a deploy in Render after pushing. `NEXT_PUBLIC_SITE_URL` must be set to the
public address (it goes into the QR codes, the sitemap and link previews).

More notes for whoever works on the site next are in `CLAUDE.md`.
