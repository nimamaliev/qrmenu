"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import PizzaSvg from "./PizzaSvg";

type Props = { lang: Locale; journey: Dictionary["journey"]; menu: Dictionary["menu"] };

/** Decorative QR pattern: three finder squares plus seeded modules. Not scannable on purpose. */
function QrPattern({ className }: { className?: string }) {
  const n = 25;
  const cells: [number, number][] = [];
  let seed = 7;
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      seed = (seed * 16807) % 2147483647;
      if (!finder(x, y) && seed % 100 < 46) cells.push([x, y]);
    }
  const square = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#111" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className={className} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" rx="1.5" />
      {cells.map(([x, y]) => (
        <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill="#111" />
      ))}
      {square(0, 0)}
      {square(n - 7, 0)}
      {square(0, n - 7)}
    </svg>
  );
}

function Brackets({ color = "border-emerald-300" }: { color?: string }) {
  return (
    <>
      {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
        (pos) => (
          <span key={pos} className={`absolute h-6 w-6 rounded-[3px] ${color} ${pos}`} />
        ),
      )}
    </>
  );
}

/** Blurred "camera feed" of a dining room. Swap for a real photo when we have one. */
function CameraFeed() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#3b3530]">
      <div className="absolute inset-0 scale-110 blur-[6px]">
        <div className="absolute top-[6%] right-[8%] h-[38%] w-[34%] rounded-sm bg-[#cfd8dc]/70" />
        <div className="absolute top-[6%] right-[8%] h-[38%] w-[3%] translate-x-[1100%] bg-[#7f1d1d]" />
        <div className="absolute top-[30%] left-[6%] h-[22%] w-[22%] rounded-t-xl bg-[#d4a017]/80" />
        <div className="absolute top-[28%] left-[40%] h-[24%] w-[18%] rounded-t-xl bg-[#1e5aa8]/80" />
        <div className="absolute top-[34%] right-[14%] h-[20%] w-[16%] rounded-t-xl bg-[#1e5aa8]/70" />
        <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-[#e8e2d8]/40 to-transparent" />
      </div>
    </div>
  );
}

export default function GuestJourney({ lang, journey, menu }: Props) {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const s = journey.screen;
  const price = (n: number) => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }).format(n);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      // Mobile: the sticky phone covers the top of the screen, so a step counts once its text is below it.
      { rootMargin: matchMedia("(min-width: 1024px)").matches ? "-45% 0px -45% 0px" : "-72% 0px -14% 0px" },
    );
    steps.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const dishes = [
    { name: menu.margherita, price: 11.5 },
    { name: menu.diavola, price: 13 },
    { name: menu.quattro, price: 14 },
    { name: menu.funghi, price: 12.5 },
  ];

  const screens = [
    // 0 · scan
    <div key="scan" className="relative h-full">
      <CameraFeed />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-[#8a5a34] to-[#5c3a20]" />
      <div className="absolute top-1/2 left-1/2 w-[46%] -translate-1/2">
        <div className="relative p-3">
          <Brackets />
          <QrPattern className="w-full rounded" />
          <span className="absolute inset-x-3 top-3 h-0.5 animate-[scan_2.2s_ease-in-out_infinite] bg-emerald-300 shadow-[0_0_12px_2px] shadow-emerald-300/70" />
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-6 rounded-2xl bg-white p-3 text-[#111] shadow-xl">
        <p className="text-[11px] text-neutral-500">{s.detected}</p>
        <p className="mt-0.5 flex items-center justify-between text-sm font-medium">
          {s.restaurant}
          <span className="rounded-full bg-[#111] px-3 py-1 text-xs text-white">{s.openMenu}</span>
        </p>
      </div>
    </div>,
    // 1 · menu
    <div key="menu" className="h-full bg-[#faf7f2] px-4 pt-12 text-[#1c1b19]">
      <p className="text-[11px] text-neutral-500">{s.table}</p>
      <p className="font-display tracking-display text-xl font-medium">{s.restaurant}</p>
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-hidden">
        {s.categories.map((c, i) => (
          <span key={c} className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${i === 0 ? "bg-[#1c1b19] text-white" : "bg-white text-neutral-600"}`}>
            {c}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {dishes.map((d, i) => (
          <li key={d.name} className={`flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ${i === 0 ? "ring-2 ring-accent" : ""}`}>
            <PizzaSvg className="h-12 w-12 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] leading-tight font-medium">{d.name}</span>
              <span className="text-xs text-neutral-500">{price(d.price)}</span>
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-[#b0431a]">{s.view3d}</span>
          </li>
        ))}
      </ul>
    </div>,
    // 2 · 3D view
    <div key="3d" className="flex h-full flex-col bg-gradient-to-b from-[#f4efe7] to-[#e6ddd0] px-4 pt-12 text-[#1c1b19]">
      <span className="self-start rounded-full bg-[#1c1b19] px-2.5 py-1 text-[10px] font-medium text-white">{s.view3d}</span>
      <div className="relative mx-auto mt-4 aspect-square w-[88%]">
        <div className="absolute inset-x-[8%] bottom-[2%] h-[14%] rounded-[50%] bg-black/25 blur-md" />
        <div className="h-full w-full [perspective:600px]">
          <div className="h-full w-full [transform:rotateX(52deg)] [transform-style:preserve-3d]">
            <PizzaSvg className="h-full w-full animate-[spin_14s_linear_infinite] drop-shadow-xl" />
          </div>
        </div>
      </div>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
        </svg>
        {s.dragHint}
      </p>
      <p className="mt-auto font-display tracking-display text-lg font-medium">{menu.margherita}</p>
      <p className="text-sm text-neutral-500">{price(11.5)} · Ø 30 cm</p>
      <span className="mt-3 mb-6 rounded-full bg-[#1c1b19] py-2.5 text-center text-sm font-medium text-white">{s.seeOnTable}</span>
    </div>,
    // 3 · AR on the table (layout follows the client's reference)
    <div key="ar" className="relative h-full">
      <CameraFeed />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-b from-[#a0703f] to-[#6e4524] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]" />
      <div className="absolute bottom-[10%] left-1/2 w-[92%] -translate-x-1/2 [perspective:500px]">
        <div className="[transform:rotateX(58deg)]">
          <div className="rounded-full bg-[#b9b4ad] p-[3%] shadow-[0_30px_30px_-10px_rgba(0,0,0,0.55)]">
            <PizzaSvg className="w-full" />
          </div>
        </div>
      </div>
      <span className="absolute top-12 left-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white uppercase">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        {s.live}
      </span>
      <div className="absolute inset-x-4 top-11 bottom-[38%]">
        <Brackets />
      </div>
      <span className="absolute inset-x-0 bottom-3 text-center text-[10px] font-medium text-white/90">{s.tapToPlace}</span>
    </div>,
    // 4 · order and pay
    <div key="order" className="flex h-full flex-col bg-[#faf7f2] px-4 pt-12 text-[#1c1b19]">
      <p className="font-display tracking-display text-xl font-medium">{s.yourOrder}</p>
      <p className="text-[11px] text-neutral-500">
        {s.restaurant} · {s.table}
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {[
          { name: menu.margherita, qty: 1, price: 11.5 },
          { name: menu.diavola, qty: 1, price: 13 },
          { name: menu.lemonade, qty: 2, price: 4.5 },
        ].map((it) => (
          <li key={it.name} className="flex justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <span>
              {it.qty}× {it.name}
            </span>
            <span className="text-neutral-600">{price(it.qty * it.price)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between border-t border-neutral-200 pt-3 font-medium">
        {s.total}
        <span>{price(33.5)}</span>
      </p>
      <div className="mt-auto mb-6 space-y-2">
        <span className="block rounded-full bg-accent py-2.5 text-center text-sm font-medium text-white">{s.payByPhone}</span>
        <span className="block rounded-full border border-neutral-300 py-2.5 text-center text-sm font-medium">{s.callWaiter}</span>
      </div>
    </div>,
  ];

  return (
    <section id="guests" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <div className="reveal max-w-3xl">
        <p className="flex items-center gap-2 text-[12.5px] tracking-[0.045em] text-muted uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {journey.eyebrow}
        </p>
        <h2 className="mt-4 font-display tracking-display text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02] text-balance">{journey.title}</h2>
        <p className="mt-4 text-lg text-muted">{journey.subtitle}</p>
      </div>

      <div className="mt-10 grid gap-x-16 lg:mt-16 lg:grid-cols-2">
        {/* Phone: sticky while the steps scroll past */}
        <div className="sticky top-16 z-10 -mx-4 bg-bg px-4 pt-4 pb-8 shadow-[0_28px_28px_var(--bg)] lg:order-2 lg:top-24 lg:mx-0 lg:h-fit lg:bg-transparent lg:px-0 lg:pt-0 lg:shadow-none">
          {/* Designed at 300×633 and zoomed to fit, so the mock screens keep their proportions. */}
          <div className="relative mx-auto h-[633px] w-[300px] [zoom:0.6] sm:[zoom:0.8] lg:[zoom:1] [@media(max-height:700px)]:[zoom:0.5]">
            <div className="absolute inset-0 overflow-hidden rounded-[2.4rem] border-[9px] border-[#1d1a17] bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              <span className="absolute top-2 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
              {screens.map((screen, i) => (
                <div
                  key={i}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
                >
                  {screen}
                </div>
              ))}
            </div>
            <span className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md bg-[#163a2c] px-3 py-2 font-mono text-[10px] font-medium tracking-wider whitespace-nowrap text-emerald-100 uppercase shadow-lg sm:text-xs lg:top-[58%] lg:bottom-auto lg:-left-14 lg:translate-x-0">
              {s.noApp}
            </span>
          </div>
        </div>

        <ol className="pb-[28svh] lg:order-1 lg:pb-0">
          {journey.steps.map((step, i) => (
            <li
              key={step.title}
              data-index={i}
              ref={(el) => {
                steps.current[i] = el;
              }}
              className={`flex min-h-[40svh] items-center transition-opacity duration-500 lg:min-h-[72svh] ${i === active ? "opacity-100" : "opacity-35"}`}
            >
              <div className="flex gap-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line font-display tracking-display text-lg text-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display tracking-display text-2xl sm:text-3xl">{step.title}</h3>
                  <p className="mt-2 max-w-md text-lg text-muted">{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
