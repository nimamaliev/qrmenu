---
name: react-bits
description: Add animated, interactive React components from React Bits (github.com/DavidHDev/react-bits) to the QRMenu marketing site — text animations, animated/WebGL backgrounds, cursor and hover effects, scroll reveals, carousels, card stacks, magnetic buttons, marquees. Use whenever a section of the website needs motion, interactivity or a "wow" effect, before hand-writing an animation from scratch.
---

# React Bits

React Bits is a library of ~210 copy-paste animated React components. Each one
ships in four variants; this project uses **TS-TW** (TypeScript + Tailwind),
which matches our Next.js + Tailwind v4 stack. Every component already starts
with `'use client'`, so it can be imported from a Server Component page.

## Find a component

- Browse `references/catalog.md` (grouped by Animations, Backgrounds,
  Components, Micro, TextAnimations, with one-line descriptions and npm deps).
- Or search: `node .claude/skills/react-bits/scripts/add.mjs --list <keyword>`

## Add it

```bash
node .claude/skills/react-bits/scripts/add.mjs BlurText CountUp
```

This copies the source into `src/components/react-bits/<Name>/`, copies the
React Bits `LICENSE.md` next to it, and runs `npm install` for the component's
dependencies (`--no-install` to only print them). It reads the registry JSON
from a git clone (`$REACT_BITS_DIR`, default `~/.cache/react-bits`, cloned on
first use), so it works even where reactbits.dev is blocked.

The official CLI does the same thing when reactbits.dev is reachable:
`npx shadcn@latest add @react-bits/BlurText-TS-TW`.

Then import it:

```tsx
import BlurText from "@/components/react-bits/BlurText/BlurText";
```

## Rules for using it well on this site

- **The code is ours after copying.** Edit it freely — retheme colors to our
  brand tokens, strip unused props, fix lint errors. Don't re-run `add.mjs` over
  an edited component without checking the diff.
- **One hero effect per viewport.** Pair a single strong background or 3D
  effect with calm text, not three competing animations. Motion should point
  at the product (QR scan → 3D dish → analytics), not decorate at random.
- **WebGL/canvas backgrounds** (deps `ogl`, `three`, `postprocessing`) are
  heavy: load them with `next/dynamic(..., { ssr: false })` from a client
  wrapper, size their container explicitly (they fill the parent), and only
  render them above the fold or when in view.
- **Respect `prefers-reduced-motion`.** Wrap decorative motion so it is
  disabled or reduced for users who ask for that.
- **Check mobile.** Cursor effects do nothing on touch devices — give touch
  users a static or tap-driven alternative, and confirm frame rate on a phone
  viewport before shipping a heavy background.
- **Dependency hygiene.** Prefer components whose deps we already have
  (`motion`, `gsap`) before introducing a new rendering library.

## License

MIT + Commons Clause: free to use, including commercially, **as part of a
website/app/product**; you may not sell or redistribute the components
themselves. Keep the copied `LICENSE.md` in `src/components/react-bits/`.
