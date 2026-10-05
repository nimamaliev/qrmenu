@AGENTS.md

# QRMenu marketing website

This repo is the **public marketing website** for QRMenu, a QR-code menu
service for restaurants. A colleague builds the product itself in a separate
codebase, so don't build product features (admin panel, analytics backend,
menu editor) here. This site *presents* them.

Product features the site showcases:
- QR-code digital menus guests open on their phone
- 3D models of dishes guests can rotate before ordering
- An admin panel for restaurants with analytics (scans, popular dishes, peak hours)

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

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run build`: production build (run before pushing)
- `npm run lint`: ESLint
