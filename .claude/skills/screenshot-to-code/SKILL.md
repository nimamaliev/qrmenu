---
name: screenshot-to-code
description: Turn a screenshot, mockup, Figma export or reference website image into matching Next.js + Tailwind code for the QRMenu marketing site, then verify it visually with a Playwright screenshot. Use when the user shares an image of a design or a site section they like and wants it built or matched. Adapted from the workflow in github.com/abi/screenshot-to-code.
---

# Screenshot → code

The screenshot-to-code project (abi/screenshot-to-code) is a hosted app plus a
FastAPI/React self-hostable version that needs its own OpenAI / Anthropic /
Gemini API keys. We don't need to run it: Claude can read images directly. This
skill reuses its replication rules and its "generate, screenshot, compare, fix"
loop, but outputs code that fits *this* repo instead of a single HTML file.

## Workflow

1. **Read the image(s) closely.** Note the layout grid, spacing rhythm, type
   scale, colors, radii, shadows, and every piece of text.
2. **Decide the scope.** Is it a whole page, one section, or one component? Map
   it onto existing files in `src/app` and `src/components` before creating new
   ones.
3. **Build it in our stack** — Next.js App Router, TypeScript, Tailwind v4,
   brand tokens from `src/app/globals.css`. Reach for the `react-bits` skill
   when the design implies motion (animated text, backgrounds, hover effects).
4. **Screenshot your result and compare** (see below). Fix layout, spacing and
   color differences, then screenshot again. Check desktop *and* mobile.
5. **Report** in one or two sentences what was built, and any part you could
   not match (missing assets, fonts, unclear interactions).

## Replication rules (from screenshot-to-code)

- Make it look like the screenshot: same structure, spacing and hierarchy.
- Use the exact text from the screenshot — unless it is a competitor's
  reference, in which case keep the *layout idea* and write QRMenu copy.
  Never copy another company's branding, logos, or copy into our site.
- Never embed the screenshot itself (or a crop of it) as an image to fake the
  layout. Code the layout; use images only for real imagery.
- If an image asset can't be extracted, use a clearly-marked placeholder in
  `public/` and list it for the user to replace.
- Multiple screenshots: different pages → separate routes linked together;
  different tabs/states of one view → one component with navigation between
  them. Mobile screenshots: ignore device frame and browser chrome.

## Visual check with Playwright

Chromium is pre-installed in cloud sessions (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`;
never run `playwright install`). With the dev server running (`npm run dev`):

```bash
node .claude/skills/screenshot-to-code/scripts/shoot.mjs http://localhost:3000/ out-dir
```

This writes `desktop.png` (1440 wide) and `mobile.png` (390 wide), full page.
Open them with the Read tool and compare against the source image.
