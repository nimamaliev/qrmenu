"use client";

/**
 * GSAP for the whole site: import from here, not from "gsap", so plugins are registered once.
 *
 *   import { gsap, useGSAP, ScrollTrigger, SplitText } from "@/lib/gsap";
 *
 * Client Components only. Use `useGSAP(() => { ... }, { scope: ref })` (cleans up on unmount)
 * and gate motion with `gsap.matchMedia()` + REDUCED_OK so reduced-motion visitors still see
 * all content. GSAP is free for commercial use (gsap.com/standard-license); every plugin ships
 * in the npm package. Rarer plugins (DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin,
 * ScrambleTextPlugin, Draggable, InertiaPlugin, ScrollSmoother, CustomEase, Observer) are
 * imported and registered where they're used, so pages that don't need them don't ship them.
 * Note: ScrollSmoother would need `scroll-behavior: smooth` removed from globals.css.
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip);

/** matchMedia query for "motion is fine": `gsap.matchMedia().add(REDUCED_OK, () => { ... })`. */
export const REDUCED_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };
