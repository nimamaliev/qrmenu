"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Look, Palette } from "./restaurant";
import { STOPS } from "./restaurant";
import { createStage, mixStops, type Stage } from "./stage";

export type Theme = { bg: string; fg: string; muted: string; ink?: string; fill?: string };
export type StoryStep = { key: "scan" | "order" | "kitchen" | "bill" | "insights"; title: string; text: string };
export type ConceptConfig = {
  look: Look;
  palette: Palette;
  ui: "list" | "poster"; // list: Vectr-style numbered steps; poster: LightGearLab-style big titles
  hero: { eyebrow: string; title: string; text: string };
  steps: StoryStep[];
  apart?: { title: string; text: string };
  /** One theme for the hero, one per step, (one for the apart view). Fewer = repeat the last. */
  themes: Theme[];
  frame?: boolean;
};

const ramp = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The concept previews' scroll story: a sticky full-screen scene; scrolling flies the camera
 * from the overview to each step (scan -> order -> kitchen -> bill -> insights) while the order
 * lines draw themselves; optionally the restaurant then comes apart into labelled layers.
 * Page colours blend between themes as you go. Reduced motion: same story, no easing.
 */
export default function ConceptStory({ config }: { config: ConceptConfig }) {
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const progress = useRef(0);
  const apply = useRef<(p: number) => void>(() => {});

  const n = config.steps.length;
  const flyEnd = config.apart ? 0.74 : 0.96;
  // camera keyframes: overview, each step, overview again
  const keys = [STOPS.overview, ...config.steps.map((s) => STOPS[s.key]), STOPS.overview];
  const at = keys.map((_, i) => (i / (keys.length - 1)) * flyEnd);
  const themeAt = (i: number) => config.themes[Math.min(i, config.themes.length - 1)];

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    createStage(el, { look: config.look, palette: config.palette, fov: config.look === "lines" ? 24 : 28 }).then((s) => {
      if (disposed) return s.dispose();
      stage.current = s;
      const THREE = s.three;
      if (config.frame) {
        // the restaurant sits in a box, like LightGearLab's machine
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(19, 4.4, 12));
        const frame = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: config.palette.ink }));
        frame.position.y = 1.8;
        frame.name = "frame";
        s.restaurant.root.add(frame);
      }
      const labels = root.current?.querySelectorAll<HTMLElement>("[data-layer-label]") ?? [];
      s.onFrame(() => {
        if (!config.apart) return;
        const a = smooth(ramp(progress.current, flyEnd + 0.02, flyEnd + 0.16));
        s.restaurant.layers.forEach((l, i) => {
          const label = labels[i];
          if (!label) return;
          const [x, y] = s.project(9.2, l.group.position.y + 0.35, 5.2);
          const maxX = (host.current?.clientWidth ?? 0) - label.offsetWidth - 8;
          label.style.transform = `translate(${Math.min(x, maxX)}px, ${y}px)`;
          label.style.opacity = String(ramp(a, 0.6 + i * 0.05, 0.9 + i * 0.015));
        });
      });
      apply.current(progress.current);
    });
    return () => {
      disposed = true;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [config, flyEnd]);

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
      const items = gsap.utils.toArray<HTMLElement>("[data-step]");
      const wrap = root.current!;

      apply.current = (p: number) => {
        progress.current = p;
        // which keyframe span we're in, eased with a hold at each stop
        let i = 0;
        while (i < at.length - 2 && p > at[i + 1]) i++;
        const local = ramp(p, at[i], at[i + 1]);
        const t = smooth(ramp(local, 0.3, 0.8));
        const s = stage.current;
        if (s) {
          s.setView(mixStops(keys[i], keys[i + 1], t));
          const seg = (k: number) => ramp(p, at[k], at[k + 1]); // span k -> k+1
          s.restaurant.setRoutes({ order: seg(1), serve: ramp(p, at[3], at[3] + (at[4] - at[3]) * 0.5), bill: ramp(p, at[3] + (at[4] - at[3]) * 0.5, at[4]), insights: seg(4) });
          s.restaurant.setScreens(ramp(p, at[1] + 0.02, at[5]));
          if (config.apart) {
            const a = smooth(ramp(p, flyEnd + 0.02, flyEnd + 0.16));
            s.restaurant.layers.forEach((l, k) => (l.group.position.y = k * 1.75 * a));
            if (a > 0) s.setView(mixStops(STOPS.overview, { pos: [24, 13, 22], target: [0, 5.4, 0] }, a));
          }
        }
        // the nearest stop is the active step; panels cross-fade around it
        const nearest = Math.round((p / flyEnd) * (keys.length - 1));
        const active = p > flyEnd + 0.02 && config.apart ? n + 1 : Math.min(nearest, n + 1);
        panels.forEach((el) => {
          const k = Number(el.dataset.panel);
          const on = k === 0 ? p < at[1] * 0.5 : k === n + 1 ? config.apart && p > flyEnd + 0.06 : active === k && k <= n;
          el.style.opacity = on ? "1" : "0";
          el.style.transform = on ? "translateY(0)" : "translateY(14px)";
          el.style.pointerEvents = on ? "auto" : "none";
        });
        items.forEach((el, k) => (el.dataset.on = String(k + 1 === active)));
        wrap.dataset.started = String(p > at[1] * 0.4 && !(config.apart && p > flyEnd + 0.02));
        // page colours: blend from one theme to the next near each boundary
        const f = config.apart && p > flyEnd ? keys.length - 1 + smooth(ramp(p, flyEnd, flyEnd + 0.06)) : (p / flyEnd) * (keys.length - 1);
        const k0 = Math.floor(f);
        const mixT = smooth(ramp(f - k0, 0.35, 0.65));
        const A = themeAt(k0);
        const B = themeAt(k0 + 1);
        const c = (x: string, y: string) => gsap.utils.interpolate(x, y, mixT) as string;
        wrap.style.setProperty("--c-bg", c(A.bg, B.bg));
        wrap.style.setProperty("--c-fg", c(A.fg, B.fg));
        wrap.style.setProperty("--c-muted", c(A.muted, B.muted));
        if (s && config.look === "lines" && A.ink && B.ink) {
          s.restaurant.setInk(c(A.ink, B.ink), c(A.fill ?? A.bg, B.fill ?? B.bg));
          const frame = s.restaurant.root.getObjectByName("frame") as unknown as { material: { color: { set: (c: string) => void } } } | undefined;
          frame?.material.color.set(c(A.ink, B.ink));
          s.invalidate();
        }
      };

      ScrollTrigger.create({ trigger: wrap, start: "top top", end: "bottom bottom", onUpdate: (self) => apply.current(self.progress) });
      apply.current(0);
    },
    { scope: root, dependencies: [config] },
  );

  const t0 = themeAt(0);
  return (
    <div
      ref={root}
      className="relative"
      style={{ height: `${(n + 2 + (config.apart ? 2.5 : 0)) * 100}svh`, background: "var(--c-bg)", color: "var(--c-fg)", ["--c-bg" as string]: t0.bg, ["--c-fg" as string]: t0.fg, ["--c-muted" as string]: t0.muted }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={host} className="absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42%] sm:hidden" style={{ background: "linear-gradient(var(--c-bg) 55%, transparent)" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] sm:hidden" style={{ background: "linear-gradient(transparent, var(--c-bg) 45%)" }} />

        {/* Hero */}
        <div data-panel="0" className="pointer-events-none absolute inset-x-0 top-0 px-5 pt-24 transition-[opacity,transform] duration-700 ease-out sm:px-10 sm:pt-28 lg:max-w-3xl">
          <p className="text-[12.5px] tracking-[0.045em] uppercase" style={{ color: "var(--c-muted)" }}>{config.hero.eyebrow}</p>
          <h1 className="headline mt-3 text-[clamp(2.6rem,7vw,6.5rem)] sm:mt-4">{config.hero.title}</h1>
          <p className="mt-4 max-w-md text-base sm:mt-5 sm:text-lg" style={{ color: "var(--c-muted)" }}>{config.hero.text}</p>
          <p className="mt-6 font-mono sm:mt-10 text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>Scroll ↓</p>
        </div>

        {config.ui === "list" ? (
          // Vectr: a quiet numbered list; the active step grows and shows its sentence
          <ol className="absolute inset-x-5 bottom-8 transition-opacity duration-500 sm:right-auto sm:bottom-16 sm:left-10 sm:w-[min(26rem,80vw)] [[data-started=false]_&]:opacity-0">
            {config.steps.map((s, k) => (
              <li key={s.key} data-step={k} className="group grid grid-cols-[2.5rem_1fr] items-start gap-x-3 py-1.5 data-[on=false]:max-sm:hidden">
                <span className="mt-0.5 font-mono text-xs transition-colors group-data-[on=true]:text-[var(--c-fg)]" style={{ color: "var(--c-muted)" }}>{String(k + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm font-medium transition-[font-size] duration-500 group-data-[on=true]:text-2xl">{s.title}</p>
                  <p className="grid grid-rows-[0fr] text-sm transition-[grid-template-rows] duration-500 group-data-[on=true]:grid-rows-[1fr]" style={{ color: "var(--c-muted)" }}>
                    <span className="overflow-hidden">{s.text}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          // LightGearLab: one big poster title per step
          config.steps.map((s, k) => (
            <div key={s.key} data-panel={k + 1} className="pointer-events-none absolute inset-x-5 bottom-8 max-w-xl opacity-0 transition-[opacity,transform] duration-700 ease-out sm:right-auto sm:bottom-16 sm:left-10">
              <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>{String(k + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
              <p className="headline mt-2 text-[clamp(3.25rem,8vw,7rem)] sm:mt-3">{s.title}</p>
              <p className="mt-3 max-w-sm text-base" style={{ color: "var(--c-muted)" }}>{s.text}</p>
            </div>
          ))
        )}

        {config.apart && (
          <>
            <div data-panel={n + 1} className="pointer-events-none absolute inset-x-5 top-24 max-w-md opacity-0 transition-[opacity,transform] duration-700 ease-out sm:right-auto sm:top-28 sm:left-10">
              <p className="headline text-[clamp(2.4rem,6vw,5rem)]">{config.apart.title}</p>
              <p className="mt-3 text-sm sm:mt-4 sm:text-base" style={{ color: "var(--c-muted)" }}>{config.apart.text}</p>
            </div>
            {["Floor & walls", "Tables & QR stands", "Guests & staff", "Kitchen", "Till & bills", "Owner's dashboard", "Orders"].map((name) => (
              <span key={name} data-layer-label className="pointer-events-none absolute top-0 left-0 flex items-center gap-2 font-mono text-[10px] tracking-wider whitespace-nowrap uppercase opacity-0 sm:text-[11px]">
                <span className="h-px w-5 sm:w-10" style={{ background: "var(--c-fg)" }} />
                {name}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
