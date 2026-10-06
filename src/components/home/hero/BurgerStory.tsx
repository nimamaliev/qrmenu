"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import BlurText from "@/components/react-bits/BlurText/BlurText";
import Magnet from "@/components/react-bits/Magnet/Magnet";
import type { Dictionary } from "@/i18n/dictionaries";
import FrameScrubber from "./FrameScrubber";
import { AR_FADE, PANEL_CUES, STAGE_STARTS, ramp } from "./timeline";

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Hydration-safe: the server and the first client render agree (animated), then the real preference applies. */
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(REDUCE).matches, () => false);

/** Pixels of counter-scroll drift as a panel fades in and out. */
const DRIFT = 22;

const eyebrowCls = "text-[12.5px] tracking-[0.045em] text-muted uppercase";
const titleCls = "font-display tracking-display text-balance";
const subCls = "text-pretty text-muted";
/** Desktop: copy in the left column, the burger fills the right. Below lg: copy on top, burger under it. */
const panelCls =
  "absolute inset-x-0 top-0 z-10 flex flex-col items-center px-5 pt-[max(6.5rem,13svh)] text-center lg:inset-y-0 lg:right-auto lg:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:w-[min(34rem,38vw)] lg:items-start lg:justify-center lg:px-0 lg:pt-0 lg:text-left";
const colRight = "lg:left-[40%]";

export default function BurgerStory({ hero, story }: { hero: Dictionary["hero"]; story: Dictionary["story"] }) {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const stages = useRef<(HTMLLIElement | null)[]>([]);
  const stageLine = useRef<HTMLOListElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const ar = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const heroBox = useRef<HTMLDivElement | null>(null);

  // Below lg the burger sits in the space under the hero copy, so track where that copy ends.
  useEffect(() => {
    const copy = heroBox.current;
    const frame = box.current;
    if (!copy || !frame) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const place = () => {
      frame.style.top = mq.matches ? "" : `${copy.offsetTop + copy.offsetHeight}px`;
    };
    const ro = new ResizeObserver(place);
    ro.observe(copy);
    mq.addEventListener("change", place);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", place);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
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

      const active = STAGE_STARTS.findLastIndex((start) => p >= start);
      stages.current.forEach((s, i) => {
        if (s) s.dataset.state = i < active ? "done" : i === active ? "active" : "todo";
      });
      fade(hint.current, 1 - ramp(p, 0.01, 0.05));
      // hidden again at the very end, so it doesn't slide up under the header as the hero scrolls away
      fade(stageLine.current, ramp(p, STAGE_STARTS[0] - 0.02, STAGE_STARTS[0] + 0.02) * (1 - ramp(p, 0.97, 0.995)));
      fade(ar.current, ramp(p, ...AR_FADE));
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
      <h1 className={`${titleCls} mt-5 max-w-[15ch] text-[clamp(2.4rem,5.4vw,4.75rem)] leading-[0.98]`}>
        <BlurText text={hero.title} animateBy="words" direction="bottom" delay={90} className="justify-center lg:justify-start" />
      </h1>
      <p className={`${subCls} mt-6 max-w-[42ch] text-[clamp(1rem,1.28vw,1.19rem)] leading-normal`}>{hero.subtitle}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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

  // The burger's box: right column on desktop, under the copy below lg (top set from JS).
  const burgerBox = (
    <div ref={box} className={`absolute inset-x-0 bottom-14 [container-type:size] lg:top-16 ${colRight}`}>
      <FrameScrubber progress={progress} still={reduced} />
      {!reduced && (
        <div
          ref={ar}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-1/2 left-1/2 aspect-square w-[74cqmin] -translate-1/2 opacity-0"
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
      )}
    </div>
  );

  // Reduced motion: the finished burger as one still, and the story as plain text.
  if (reduced) {
    return (
      <section id="top" className="relative">
        <div className="relative h-svh min-h-[40rem] overflow-hidden">
          {burgerBox}
          <div ref={heroBox} className={panelCls}>
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
        {burgerBox}

        {/* Cross-fading panels: hero first, then one per caption. */}
        {[null, ...story.captions].map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              panels.current[i] = el;
              if (i === 0) heroBox.current = el;
            }}
            aria-hidden={i > 0 || undefined}
            className={`${panelCls} ${i > 0 ? "invisible opacity-0" : ""}`}
          >
            {c === null ? (
              heroPanel
            ) : (
              <>
                <p className={eyebrowCls}>
                  {String(i).padStart(2, "0")} / {String(story.captions.length).padStart(2, "0")}
                </p>
                <p className={`${titleCls} mt-5 max-w-[16ch] text-[clamp(2.1rem,4.4vw,4.25rem)] leading-[1.02]`}>{c.title}</p>
                <p className={`${subCls} mt-5 max-w-[40ch] text-[clamp(1rem,1.28vw,1.19rem)] leading-normal`}>{c.text}</p>
              </>
            )}
          </div>
        ))}

        {/* Bottom line under the burger: scroll hint, then the build stages */}
        <p
          ref={hint}
          className={`absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-1.5 text-[12px] tracking-[0.04em] text-muted uppercase ${colRight}`}
        >
          {hero.scrollHint}
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </p>
        <ol
          ref={stageLine}
          aria-hidden="true"
          className={`invisible absolute inset-x-0 bottom-5 z-10 flex flex-wrap justify-center gap-x-1 px-4 text-[12px] tracking-[0.02em] opacity-0 ${colRight}`}
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
