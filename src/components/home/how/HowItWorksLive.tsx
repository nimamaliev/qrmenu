"use client";

import { useEffect } from "react";
import { depthOf, dotsSvg, extrude, iso, lineOnTop, solidSvg, translateAlong } from "@/components/iso/iso-kit.mjs";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LIVE as LiveData } from "./art.mjs";

type Point = [number, number, number];
type Readout = Dictionary["how"]["figure"]["readout"];

/** Seconds each station works, and the pause before the tour moves on. */
const DUR = [5.4, 3.6, 2.6, 3.0];
const HOLD = 1.1;
/** Pointer position across the drawing (0..1) where each next station takes over. */
const ZONES = [0.34, 0.55, 0.75];
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Brings the server-built figure to life: a calm tour through the four stations, steered by
 * pointer, keyboard or the step list; it only runs on screen and rests on the last station
 * under reduced motion. Attributes are written straight to the SVG; nothing re-renders.
 */
export default function HowItWorksLive({ live, readout, titles }: { live: typeof LiveData; readout: Readout; titles: string[] }) {
  useEffect(() => {
    const root = document.getElementById("hw-figure");
    const stage = root?.querySelector<HTMLElement>(".iso-stage");
    const svg = stage?.querySelector("svg");
    const out = root?.querySelector("[data-readout]");
    if (!root || !stage || !svg || !out) return;
    const q = <T extends Element = SVGElement>(sel: string) => svg.querySelector<T>(sel)!;
    const parts = {
      index: q('[data-part="index"]'),
      cheese: q('[data-part="cheese"]'),
      seeds: q('[data-part="seeds"]'),
      flash: q<SVGElement>('[data-part="flash"]'),
      lamp: q<SVGCircleElement>('[data-part="lamp"] circle'),
      fill: q<SVGElement>('[data-part="model-fill"]'),
      bar: q('[data-part="bar"]'),
      monLed: q('[data-part="mon-led"]'),
      card: q('[data-part="card"]'),
      prLed: q<SVGCircleElement>('[data-part="pr-led"] circle'),
      dish: q('[data-part="ar-dish"]'),
      shadow: q<SVGElement>('[data-part="ar-shadow"]'),
      frame: q<SVGElement>('[data-part="ar-frame"]'),
    };
    const ticks = [...svg.querySelectorAll<SVGElement>("[data-tick]")];
    const mesh = [...svg.querySelectorAll<SVGElement>(".hw-mesh")];
    const focus = [...svg.querySelectorAll("[data-focus] > .iso-solid")];
    const cables = [...svg.querySelectorAll("[data-cable]")];
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
    const barW = Number(svg.querySelector(".hw-bar")?.getAttribute("width"));
    const dishBase = parts.dish.getAttribute("transform")!.replace(/scale\([^)]*\)/, "");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const { P, TT, PLAT_R, PLAT_TOP, CHEESE_Z, CHEESE_HALF, CHEESE_H, SEEDS, PHOTOS, CARD_LIFT } = live;

    const cheeseRing = (turn: number) => {
      const a = turn * Math.PI * 2 + Math.PI / 7;
      return [0, 1, 2, 3].map((i) => {
        const t = a + (i * Math.PI) / 2;
        const c = Math.cos(t);
        const s = Math.sin(t);
        return [TT[0] + CHEESE_HALF * (c - s), TT[1] + CHEESE_HALF * (s + c)];
      });
    };
    const indexMark = (turn: number) => {
      const a = turn * Math.PI * 2;
      const [x, y] = TT;
      return lineOnTop([x + Math.sin(a) * (PLAT_R - 3.5), y - Math.cos(a) * (PLAT_R - 3.5)], [x + Math.sin(a) * (PLAT_R - 0.6), y - Math.cos(a) * (PLAT_R - 0.6)], PLAT_TOP, P);
    };
    const drawTurntable = (turn: number) => {
      parts.index.setAttribute("d", indexMark(turn));
      parts.cheese.innerHTML = solidSvg(extrude(cheeseRing(turn), CHEESE_Z, CHEESE_H, P), { tone: "hi", crease: "lo" });
      const a0 = turn * Math.PI * 2;
      const dots = [];
      for (const [rr, phi, z, slope] of SEEDS) {
        const nx = Math.cos(phi + a0);
        const ny = Math.sin(phi + a0);
        if (depthOf([nx, ny, -slope], P) < 0.25) continue; // seeds on the far side of the bun
        dots.push(iso([TT[0] + rr * nx, TT[1] + rr * ny, z] as Point, P));
      }
      parts.seeds.innerHTML = dotsSvg(dots, { size: 0.55, tone: "mid" });
    };
    const flag = (el: Element, on: boolean, name = "data-on") => (on ? el.setAttribute(name, "") : el.removeAttribute(name));

    let s = 0, t = 0, touring = true, cycle = 0;
    let shownTurn = 0, card = 0, lastPhoto = -1, flashAt = -9, clock = 0;
    let frame = 0, last = 0, visible = false, idleTimer = 0;

    const apply = (dt: number, calm: boolean) => {
      // station s at local time t; later stations assume earlier ones are done
      const p = Math.min(1, t / DUR[s]);
      const photos = s > 0 ? PHOTOS : Math.min(PHOTOS, Math.floor(p * (PHOTOS + 0.999)));
      const model = s > 1 ? 1 : s === 1 ? smooth(p) : 0;
      const cardTo = s > 2 ? 1 : s === 2 ? smooth(p) : 0;
      const ar = s === 3 ? p : 0;

      if (s === 0 && photos > 0 && photos > lastPhoto) flashAt = clock;
      lastPhoto = photos;
      const turn = cycle + photos / PHOTOS;
      shownTurn = calm ? turn : shownTurn + (turn - shownTurn) * (1 - Math.exp(-dt / 0.09));
      if (Math.abs(turn - shownTurn) < 1e-4) shownTurn = turn;
      drawTurntable(shownTurn % 1);
      ticks.forEach((el, i) => {
        const want = i < photos ? "hi" : "faint";
        if (el.dataset.tone !== want) el.dataset.tone = want;
      });
      parts.flash.style.opacity = calm ? "0" : Math.max(0, 1 - (clock - flashAt) / 0.22).toFixed(3);
      const shooting = s === 0 && photos < PHOTOS;
      parts.lamp.style.opacity = shooting ? "1" : "";
      parts.lamp.setAttribute("r", shooting ? "1" : "0.85");

      mesh.forEach((el, i) => (el.style.opacity = Math.min(1, Math.max(0, model * 1.25 * mesh.length - i)).toFixed(3)));
      parts.fill.style.opacity = smooth((model - 0.75) / 0.25).toFixed(3);
      parts.bar.setAttribute("width", (barW * model).toFixed(2));
      flag(parts.monLed, s === 1 && model < 1);

      card = calm ? cardTo : card + (cardTo - card) * (1 - Math.exp(-dt / 0.18));
      if (Math.abs(card - cardTo) < 1e-3) card = cardTo;
      parts.card.setAttribute("transform", translateAlong(P, [0, 0, card * CARD_LIFT]));
      parts.prLed.style.opacity = s === 2 && cardTo < 1 ? "1" : "";

      const pop = s === 3 ? (calm ? 1 : 1 - Math.exp(-ar * 9) * Math.cos(ar * 14)) : 0; // a small springy landing
      parts.dish.setAttribute("transform", `${dishBase}scale(${Math.max(0, pop).toFixed(3)})`);
      parts.shadow.style.opacity = s === 3 ? smooth(ar * 3).toFixed(3) : "0";
      parts.frame.style.opacity = s === 3 ? smooth(ar * 2.5).toFixed(3) : "0";

      focus.forEach((el, i) => flag(el, i === s, "data-lit"));
      cables.forEach((el, i) => flag(el, (i === 0 && ((s === 0 && photos > 0) || (s === 1 && model < 1))) || (i === 1 && s === 2 && cardTo < 1)));
      steps.forEach((el, i) => flag(el, i === s));

      const text =
        s === 0 ? `1 · ${readout.photos} ${photos}/${PHOTOS}`
        : s === 1 ? `2 · ${readout.model} ${Math.round(model * 100)}%`
        : s === 2 ? `3 · ${cardTo < 1 ? readout.printing : readout.ready}`
        : `4 · ${readout.table}`;
      if (out.textContent !== text) out.textContent = text;
      stage.setAttribute("aria-valuenow", String(s + 1));
      stage.setAttribute("aria-valuetext", `${s + 1}/4: ${titles[s]}`);
      return p >= 1 && shownTurn === turn && card === cardTo;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      clock += dt;
      t += dt;
      if (touring && t > DUR[s] + HOLD) {
        t = 0;
        s = (s + 1) % 4;
        if (s === 0) cycle += 1;
      }
      const done = apply(dt, still.matches);
      frame = visible && (touring || !done || clock - flashAt < 0.3) ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (!frame && visible) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const go = (next: number) => {
      next = Math.max(0, Math.min(3, next));
      touring = false;
      if (next !== s) {
        if (next === 0) cycle += 1;
        s = next;
        t = still.matches ? DUR[s] : 0;
      }
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        touring = !still.matches;
        run();
      }, 4200);
      run();
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) run();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(stage);
    if (still.matches) {
      touring = false;
      s = 3;
      t = DUR[3];
    }
    const onPointer = (e: PointerEvent) => {
      const box = svg.getBoundingClientRect();
      const fx = (e.clientX - box.left) / box.width;
      go(ZONES.filter((z) => fx > z).length);
    };
    const onKey = (e: KeyboardEvent) => {
      const to = { ArrowRight: s + 1, ArrowDown: s + 1, ArrowLeft: s - 1, ArrowUp: s - 1, Home: 0, End: 3 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      go(to);
    };
    const onStep = (e: Event) => go(Number((e.currentTarget as HTMLElement).dataset.step));
    stage.addEventListener("pointermove", onPointer);
    stage.addEventListener("pointerdown", onPointer);
    stage.addEventListener("keydown", onKey);
    steps.forEach((el) => el.addEventListener("pointerenter", onStep));
    apply(1 / 60, true);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      io.disconnect();
      stage.removeEventListener("pointermove", onPointer);
      stage.removeEventListener("pointerdown", onPointer);
      stage.removeEventListener("keydown", onKey);
      steps.forEach((el) => el.removeEventListener("pointerenter", onStep));
    };
  }, [live, readout, titles]);

  return null;
}
