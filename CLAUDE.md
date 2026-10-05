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
- Home page sections: `src/components/home/`. The scroll-built pizza is
  `pizza/PizzaScene.tsx`, a code-made placeholder until the team supplies a
  real scanned model (or step-by-step photos).
- Copied React Bits components: `src/components/react-bits/` (keep its LICENSE).

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run build`: production build (run before pushing)
- `npm run lint`: ESLint
