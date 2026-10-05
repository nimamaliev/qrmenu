"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import BlurText from "@/components/react-bits/BlurText/BlurText";
import Magnet from "@/components/react-bits/Magnet/Magnet";
import type { Dictionary } from "@/i18n/dictionaries";
import PizzaSvg from "../PizzaSvg";
import { CAPTION_WINDOWS, STAGES, STAGE_ORDER, range, windowOpacity } from "./timeline";

const PizzaScene = dynamic(() => import("./PizzaScene"), { ssr: false });

/** Progress value used for the single static frame shown to reduced-motion users. */
const STATIC_PROGRESS = 0.83;

export default function PizzaStory({ hero, story }: { hero: Dictionary["hero"]; story: Dictionary["story"] }) {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  const stages = useRef<(HTMLLIElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const ar = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      progress.current = STATIC_PROGRESS;
      return;
    }
    let frame = 0;
    const show = (el: HTMLElement | null, o: number, dy = 0) => {
      if (!el) return;
      el.style.opacity = String(o);
      el.style.transform = `translateY(${dy * (1 - o)}px)`;
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };
    const update = () => {
      frame = 0;
      const el = section.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
      progress.current = p;

      show(heroRef.current, 1 - range(p, [0.015, 0.07]), -40);
      captions.current.forEach((c, i) => {
        const o = windowOpacity(p, CAPTION_WINDOWS[i]);
        show(c, o, 24);
        if (c) c.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      let active = -1;
      STAGE_ORDER.forEach((key, i) => {
        if (p >= STAGES[key][0]) active = i;
      });
      stages.current.forEach((s, i) => {
        if (s) s.dataset.state = i < active ? "done" : i === active ? "active" : "todo";
      });
      show(rail.current, range(p, [0.04, 0.09]));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      show(ar.current, range(p, [0.86, 0.92]));
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

  const heroBlock = (
    <div className="max-w-xl">
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-bg/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-saffron backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {hero.eyebrow}
      </p>
      <h1 className="font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
        <BlurText text={hero.title} animateBy="words" direction="bottom" delay={90} />
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted sm:text-xl">{hero.subtitle}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Magnet padding={60} magnetStrength={4}>
          <a
            href="#contact"
            className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-bg transition-colors hover:bg-accent-strong"
          >
            {hero.ctaPrimary}
          </a>
        </Magnet>
        <a
          href="#how-it-works"
          className="inline-flex h-12 items-center rounded-full border border-line bg-bg/40 px-6 font-medium backdrop-blur transition-colors hover:border-muted"
        >
          {hero.ctaSecondary}
        </a>
      </div>
    </div>
  );

  const fallback = <PizzaSvg className="absolute top-1/2 left-1/2 w-[62vmin] -translate-1/2 lg:left-[68%]" />;

  // Reduced motion: one still frame and the story as plain text.
  if (reduced) {
    return (
      <section id="top" className="relative">
        <div className="relative min-h-svh">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_55%,#2c1d11_0%,var(--bg)_62%)]" />
          <PizzaScene progress={progress} fallback={fallback} staticFrame />
          <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl items-start px-4 pt-28 sm:px-6 lg:items-center lg:pt-0">
            {heroBlock}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">{story.reducedTitle}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {story.captions.map((c, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-display text-xl font-semibold">{c.title}</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_58%,#2c1d11_0%,var(--bg)_62%)] lg:bg-[radial-gradient(ellipse_at_68%_55%,#2c1d11_0%,var(--bg)_58%)]" />
        <div
          ref={glow}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgb(255_110_40/0.32),transparent_42%)] opacity-0 lg:bg-[radial-gradient(circle_at_68%_55%,rgb(255_110_40/0.32),transparent_38%)]"
        />

        <PizzaScene progress={progress} fallback={fallback} />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-gradient-to-r from-bg/90 via-bg/55 to-transparent lg:block" />

        {/* Hero copy, fades out as the build starts */}
        <div ref={heroRef} className="relative z-10 mx-auto flex h-full max-w-7xl items-start px-4 pt-24 sm:px-6 sm:pt-28 lg:items-center lg:pt-0">
          <div className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-bg via-bg/80 to-transparent lg:hidden" />
          <div className="relative">{heroBlock}</div>
          <p className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-sm text-muted">
            {hero.scrollHint}
            <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </p>
        </div>

        {/* Story captions */}
        {story.captions.map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              captions.current[i] = el;
            }}
            aria-hidden="true"
            className="invisible absolute inset-x-4 bottom-6 z-10 rounded-3xl border border-line bg-bg/75 p-5 opacity-0 backdrop-blur-md sm:inset-x-6 lg:inset-x-auto lg:bottom-auto lg:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:top-1/2 lg:w-[30rem] lg:-translate-y-1/2 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
          >
            <p className="text-sm font-medium tracking-[0.2em] text-accent">0{i + 1}</p>
            <p className="mt-2 font-display text-2xl leading-tight font-semibold sm:text-3xl lg:text-5xl">{c.title}</p>
            <p className="mt-3 text-base text-muted lg:mt-5 lg:text-xl">{c.text}</p>
            {i === story.captions.length - 1 && (
              <a
                href="#contact"
                tabIndex={-1}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:bg-accent-strong"
              >
                {hero.ctaPrimary}
              </a>
            )}
          </div>
        ))}

        {/* "On your table" AR frame */}
        <div
          ref={ar}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-[44%] left-1/2 z-0 aspect-square w-[78vmin] -translate-1/2 opacity-0 lg:top-1/2 lg:left-[68%] lg:w-[58vmin]"
        >
          {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
            (pos) => (
              <span key={pos} className={`absolute h-10 w-10 rounded-[4px] border-white/80 ${pos}`} />
            ),
          )}
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-bg">
            {story.arBadge}
          </span>
          <span className="absolute inset-x-[14%] bottom-6 flex items-center gap-2 text-xs font-medium text-white">
            <span className="h-px flex-1 bg-white/70" />
            {story.arDish} · {story.arSize}
            <span className="h-px flex-1 bg-white/70" />
          </span>
        </div>

        {/* Stage rail */}
        <div ref={rail} aria-hidden="true" className="invisible absolute inset-x-4 top-20 z-10 opacity-0 sm:inset-x-6 lg:inset-x-auto lg:top-1/2 lg:right-8 lg:-translate-y-1/2">
          <div className="h-0.5 overflow-hidden rounded bg-line lg:hidden">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
          </div>
          <ol className="mt-3 flex justify-center gap-4 lg:mt-0 lg:flex-col lg:items-end lg:gap-3">
            {story.stages.map((label, i) => (
              <li
                key={label}
                ref={(el) => {
                  stages.current[i] = el;
                }}
                data-state="todo"
                className="group flex items-center gap-2 text-xs text-muted/50 transition-colors data-[state=active]:text-text data-[state=done]:text-muted lg:text-sm"
              >
                <span className="hidden group-data-[state=active]:inline lg:inline">{label}</span>
                <span className="h-2 w-2 rounded-full bg-current transition-transform group-data-[state=active]:scale-150 group-data-[state=active]:bg-accent" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
