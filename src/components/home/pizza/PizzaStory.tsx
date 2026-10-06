"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import BlurText from "@/components/react-bits/BlurText/BlurText";
import Magnet from "@/components/react-bits/Magnet/Magnet";
import type { Dictionary } from "@/i18n/dictionaries";
import PizzaSvg from "../PizzaSvg";
import { FREE_MARGIN, PANEL_CUES, STAGES, STAGE_ORDER, freeTop, ramp, range } from "./timeline";

const PizzaScene = dynamic(() => import("./PizzaScene"), { ssr: false });

/** Progress value used for the single static frame shown to reduced-motion users. */
const STATIC_PROGRESS = 0.83;
/** Pixels of counter-scroll drift as a panel fades in and out. */
const DRIFT = 22;

const eyebrowCls = "text-[12.5px] tracking-[0.045em] text-muted uppercase";
const titleCls = "font-display tracking-display text-balance";
const subCls = "text-pretty text-muted";

export default function PizzaStory({ hero, story }: { hero: Dictionary["hero"]; story: Dictionary["story"] }) {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const stages = useRef<(HTMLLIElement | null)[]>([]);
  const stageLine = useRef<HTMLOListElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const ar = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const heroBox = useRef<HTMLDivElement | null>(null);
  const copyBottom = useRef(0);

  // The 3D scene frames the pizza below the hero copy, so track where that copy ends.
  useEffect(() => {
    const el = heroBox.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      copyBottom.current = el.offsetTop + el.offsetHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced) {
      progress.current = STATIC_PROGRESS;
      return;
    }
    let frame = 0;
    const fade = (el: HTMLElement | null, o: number) => {
      if (!el) return;
      el.style.opacity = String(o);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };
    const update = () => {
      frame = 0;
      const el = section.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
      progress.current = p;

      panels.current.forEach((panel, i) => {
        const [a, b, c, d] = PANEL_CUES[i];
        const enter = ramp(p, a, b);
        const leave = ramp(p, c, d);
        const o = enter * (1 - leave);
        fade(panel, o);
        if (!panel) return;
        panel.style.transform = `translate3d(0, ${(1 - enter) * DRIFT - leave * DRIFT}px, 0)`;
        panel.style.pointerEvents = o > 0.6 ? "auto" : "none";
      });

      let active = -1;
      STAGE_ORDER.forEach((key, i) => {
        if (p >= STAGES[key][0]) active = i;
      });
      stages.current.forEach((s, i) => {
        if (s) s.dataset.state = i < active ? "done" : i === active ? "active" : "todo";
      });
      fade(hint.current, 1 - ramp(p, 0.01, 0.05));
      fade(stageLine.current, ramp(p, 0.04, 0.08));
      fade(ar.current, ramp(p, 0.86, 0.92));
      if (ar.current) {
        // Same box the 3D scene frames the pizza in.
        const top = freeTop(window.innerHeight, copyBottom.current);
        const h = window.innerHeight - top - FREE_MARGIN;
        Object.assign(ar.current.style, { top: `${top + h / 2}px`, height: `${h}px`, width: `${Math.min(h * 1.6, window.innerWidth * 0.9)}px` });
      }
      if (glow.current) glow.current.style.opacity = String(Math.sin(Math.PI * range(p, STAGES.bake)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  const heroPanel = (
    <>
      <p className={`${eyebrowCls} flex items-center gap-2`}>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        {hero.eyebrow}
      </p>
      <h1 className={`${titleCls} mt-5 max-w-[15ch] text-[clamp(2.4rem,6.2vw,5.75rem)] leading-[0.98]`}>
        <BlurText text={hero.title} animateBy="words" direction="bottom" delay={90} className="justify-center" />
      </h1>
      <p className={`${subCls} mt-6 max-w-[46ch] text-[clamp(1rem,1.28vw,1.19rem)] leading-normal`}>{hero.subtitle}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Magnet padding={60} magnetStrength={4}>
          <a href="#contact" className="pill h-12 px-7 text-[15px]">
            {hero.ctaPrimary}
          </a>
        </Magnet>
        <a href="#how-it-works" className="pill-ghost h-12 bg-bg/40 px-6 text-[15px] backdrop-blur">
          {hero.ctaSecondary}
        </a>
      </div>
    </>
  );

  const fallback = <PizzaSvg className="absolute top-[70%] left-1/2 w-[44vmin] -translate-1/2" />;

  // Paper wash heavier at the top and bottom edges, where the copy and the stage line sit.
  const veil = (
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(242_240_236/0.75)_0%,rgb(242_240_236/0.35)_30%,rgb(242_240_236/0)_46%,rgb(242_240_236/0)_86%,rgb(242_240_236/0.6)_100%)]" />
  );

  // Reduced motion: one still frame and the story as plain text.
  if (reduced) {
    return (
      <section id="top" className="relative">
        <div className="relative h-svh min-h-[40rem] overflow-hidden">
          <PizzaScene progress={progress} fallback={fallback} copyBottom={copyBottom} staticFrame />
          {veil}
          <div ref={heroBox} className="relative z-10 flex flex-col items-center px-5 pt-[max(6.5rem,13svh)] text-center">
            {heroPanel}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className={`${titleCls} text-4xl`}>{story.reducedTitle}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {story.captions.map((c, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface p-6">
                <p className={`${titleCls} text-2xl`}>{c.title}</p>
                <p className="mt-2 text-muted">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="top" className="relative h-[620svh]">
      {/* Screen readers get the whole story at once; the animated copies below are decorative. */}
      <ol className="sr-only">
        {story.captions.map((c, i) => (
          <li key={i}>
            {c.title} {c.text}
          </li>
        ))}
      </ol>

      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          ref={glow}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgb(255_120_40/0.22),transparent_40%)] opacity-0"
        />
        <PizzaScene progress={progress} fallback={fallback} copyBottom={copyBottom} />
        {veil}

        {/* Cross-fading panels: hero first, then one per caption. All centred, like the brief. */}
        {[null, ...story.captions].map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              panels.current[i] = el;
              if (i === 0) heroBox.current = el;
            }}
            aria-hidden={i > 0 || undefined}
            className={`absolute inset-x-0 top-0 z-10 flex flex-col items-center px-5 pt-[max(6.5rem,13svh)] text-center ${i > 0 ? "invisible opacity-0" : ""}`}
          >
            {c === null ? (
              heroPanel
            ) : (
              <>
                <p className={eyebrowCls}>
                  {String(i).padStart(2, "0")} / {String(story.captions.length).padStart(2, "0")}
                </p>
                <p className={`${titleCls} mt-5 max-w-[16ch] text-[clamp(2.1rem,5vw,4.5rem)] leading-[1.02]`}>{c.title}</p>
                <p className={`${subCls} mt-5 max-w-[42ch] text-[clamp(1rem,1.28vw,1.19rem)] leading-normal`}>{c.text}</p>
              </>
            )}
          </div>
        ))}

        {/* "On your table" AR frame, centred on the pizza */}
        <div
          ref={ar}
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 z-0 -translate-1/2 opacity-0"
        >
          {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
            (pos) => (
              <span key={pos} className={`absolute h-9 w-9 rounded-[4px] border-text/70 ${pos}`} />
            ),
          )}
          <span className="absolute top-0 left-1/2 flex -translate-1/2 items-center gap-2 rounded-full bg-text py-1 pr-3 pl-1 text-xs font-medium whitespace-nowrap text-bg">
            <span className="rounded-full bg-accent px-2 py-0.5 text-white">{story.arBadge}</span>
            {story.arDish} · {story.arSize}
          </span>
        </div>

        {/* Bottom line: scroll hint, then the build stages */}
        <p ref={hint} className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 text-[12px] tracking-[0.04em] text-muted uppercase">
          {hero.scrollHint}
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </p>
        <ol
          ref={stageLine}
          aria-hidden="true"
          className="invisible absolute inset-x-0 bottom-6 z-10 flex flex-wrap justify-center gap-x-1 px-4 text-[12px] tracking-[0.02em] opacity-0"
        >
          {story.stages.map((label, i) => (
            <li
              key={label}
              ref={(el) => {
                stages.current[i] = el;
              }}
              data-state="todo"
              className="group flex items-center gap-1 text-text/30 transition-colors duration-500 data-[state=active]:text-text data-[state=done]:text-muted"
            >
              {i > 0 && <span className="px-1 text-text/25">·</span>}
              <span className="hidden size-1.5 rounded-full bg-accent group-data-[state=active]:inline-block" />
              {label}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
