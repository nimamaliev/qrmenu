"use client";

import { useEffect, useRef } from "react";
import type * as T from "three";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { BRAND } from "@/lib/site";
import { buildFloor, STATUS, type Floor } from "./scene";

/**
 * The floor story (preview): one pinned 3D scene driven by scroll.
 * QR code -> it rises into a mini restaurant -> the camera dives to a table's menu card ->
 * the digital menu -> line-drawing chapters on bold page colours (order, kitchen, bill) ->
 * the floor seen from above inside the dashboard -> analytics bars grow out of the tables.
 * Copy is draft; features shown in the dashboard still need confirming.
 */

type Side = "l" | "r";
type Chapter = { from: number; to: number; side: Side; eyebrow: string; title: string; text: string };
const CHAPTERS: Chapter[] = [
  { from: 0.085, to: 0.225, side: "l", eyebrow: "01 · The floor", title: "Every square is a table", text: "Your code at the door and on every table. Guests scan it, and the restaurant opens on their phone." },
  { from: 0.25, to: 0.335, side: "l", eyebrow: "02 · The table", title: "A menu on every table", text: "A small card with a QR code. No app to install: the phone's camera opens it." },
  { from: 0.36, to: 0.435, side: "l", eyebrow: "03 · The menu", title: "The whole menu, live", text: "Photos, prices, and dishes in 3D that guests can place on the table in front of them." },
  { from: 0.485, to: 0.555, side: "r", eyebrow: "04 · Order", title: "Order from the table", text: "The order goes straight to the kitchen, with the table number on it." },
  { from: 0.565, to: 0.64, side: "l", eyebrow: "05 · Kitchen", title: "The kitchen knows", text: "Who ordered what, and how long each table has been waiting." },
  { from: 0.65, to: 0.725, side: "r", eyebrow: "06 · Bill", title: "The bill, without the wait", text: "Each bill follows its table, so paying takes a minute." },
  { from: 0.775, to: 0.85, side: "l", eyebrow: "07 · Your floor, live", title: "The whole room on one screen", text: "Which tables are free, eating, waiting or paying, at a glance." },
  { from: 0.875, to: 1.01, side: "l", eyebrow: "08 · Analytics", title: "Know what sells", text: "Sales by table, dish and hour, from the same system." },
];

type Theme = { bg: string; fg: string; muted: string; ink: string };
const PAPER: Theme = { bg: "#f2f0ec", fg: "#0d0c0b", muted: "#5f5e5c", ink: "#0d0c0b" };
const SAFFRON: Theme = { bg: "#f0c24f", fg: "#1a1712", muted: "#4f4120", ink: "#1a1712" };
const TOMATO: Theme = { bg: "#b83219", fg: "#fff7f2", muted: "#ffd9cc", ink: "#2b0c05" };
const BASIL: Theme = { bg: "#1d3b2e", fg: "#eef4ee", muted: "#a9c2b2", ink: "#e3ede6" };
const THEMES: [number, Theme][] = [
  [0, PAPER],
  [0.465, PAPER],
  [0.485, SAFFRON],
  [0.553, SAFFRON],
  [0.567, TOMATO],
  [0.638, TOMATO],
  [0.652, BASIL],
  [0.73, BASIL],
  [0.755, PAPER],
  [1, PAPER],
];

const ramp = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const smooth = (t: number) => t * t * (3 - 2 * t);
const DEG = Math.PI / 180;

export default function FloorStory({ url }: { url: string }) {
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const el = host.current;
    const wrap = root.current;
    if (!el || !wrap) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { mergeGeometries } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");
      if (disposed) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = innerWidth < 768;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(24, 1, 0.3, 900);
      const floor: Floor = buildFloor(THREE, (g) => mergeGeometries(g)!, url);
      scene.add(floor.root);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xcdc4b6, 1.55));
      const sun = new THREE.DirectionalLight(0xfff3e4, 1.9);
      sun.position.set(-26, 48, 22);
      sun.castShadow = true;
      sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
      const sh = floor.size * 0.75;
      Object.assign(sun.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh, near: 1, far: 140 });
      sun.shadow.bias = -0.0004;
      scene.add(sun);

      // camera keys: [progress, target, distance, polar angle°, azimuth°, how much it widens on narrow screens]
      const S = floor.spots;
      const R = ((floor.size / 2) * 1.04) / Math.tan(12 * DEG);
      const O = new THREE.Vector3();
      const up = (v: T.Vector3, y: number) => v.clone().setY(y);
      const midOrder = S.hero.clone().lerp(S.kitchen, 0.5).setY(1.5);
      const CARD_TH = 34;
      floor.faceCard(CARD_TH * DEG);
      const KEYS: [number, T.Vector3, number, number, number, number][] = [
        [0, O, R * 1.2, 0.4, 0, 1],
        [0.05, O, R * 1.2, 0.4, 0, 1],
        [0.21, up(O, 0.4), R * 1.12, 54, 38, 1],
        [0.24, up(O, 0.4), R * 1.08, 56, 40, 1],
        [0.31, up(S.hero, 0.9), 11, 55, CARD_TH, 0.6],
        [0.35, S.card, 1.45, 82, CARD_TH, 0.3],
        [0.375, S.card, 0.78, 86, CARD_TH, 0.15],
        [0.428, S.card, 0.78, 86, CARD_TH, 0.15],
        [0.48, midOrder, R * 0.55, 52, 26, 1],
        [0.548, midOrder, R * 0.55, 52, 22, 1],
        [0.578, up(S.kitchen, 0.8), 23, 50, 28, 0.75],
        [0.635, up(S.kitchen, 0.8), 21, 50, 36, 0.75],
        [0.668, up(S.till, 0.8), 23, 50, 58, 0.75],
        [0.725, up(S.till, 0.8), 21, 50, 66, 0.75],
        [0.78, O, R * 1.6, 0.4, 0, 1],
        [0.852, O, R * 1.6, 0.4, 0, 1],
        [0.93, up(O, 1.6), R * 1.2, 52, 36, 1],
        [1, up(O, 1.6), R * 1.15, 54, 40, 1],
      ];
      const tgt = new THREE.Vector3();
      const view = (q: number) => {
        let i = 0;
        while (i < KEYS.length - 2 && q > KEYS[i + 1][0]) i++;
        const a = KEYS[i];
        const b = KEYS[i + 1];
        const t = smooth(ramp(q, a[0], b[0]));
        tgt.copy(a[1]).lerp(b[1], t);
        const r = Math.exp(Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * t);
        return { r, phi: (a[3] + (b[3] - a[3]) * t) * DEG, th: (a[4] + (b[4] - a[4]) * t) * DEG, wide: a[5] + (b[5] - a[5]) * t };
      };
      const themeAt = (q: number): Theme => {
        let i = 0;
        while (i < THEMES.length - 2 && q > THEMES[i + 1][0]) i++;
        const [pa, A] = THEMES[i];
        const [pb, B] = THEMES[i + 1];
        const t = smooth(ramp(q, pa, pb));
        const mix = (x: string, y: string) => "#" + new THREE.Color(x).lerp(new THREE.Color(y), t).getHexString();
        return { bg: mix(A.bg, B.bg), fg: mix(A.fg, B.fg), muted: mix(A.muted, B.muted), ink: mix(A.ink, B.ink) };
      };

      const panels = Array.from(wrap.querySelectorAll<HTMLElement>("[data-panel]"));
      const heroEl = wrap.querySelector<HTMLElement>("[data-hero]");
      const menuEl = wrap.querySelector<HTMLElement>("[data-menu]");
      const adminEl = wrap.querySelector<HTMLElement>("[data-admin]");
      const scrims = Array.from(wrap.querySelectorAll<HTMLElement>("[data-scrim]"));

      let q = target.current;
      let side = 1; // +1 scene on the right (text left), -1 scene on the left
      let raf = 0;
      let last = performance.now();
      let visible = true;
      const frame = (now: number) => {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const p = target.current;
        q = reduced ? p : q + (p - q) * (1 - Math.exp(-dt * 7));
        if (Math.abs(p - q) < 1e-5) q = p;

        // text panels, and which side the scene should sit on
        let want = side;
        let best = 0;
        let bestSide: Side = "l";
        panels.forEach((pe, k) => {
          const ch = CHAPTERS[k];
          const o = ramp(q, ch.from, ch.from + 0.014) * (1 - ramp(q, ch.to - 0.014, ch.to));
          pe.style.opacity = String(o);
          pe.style.transform = `translateY(${(1 - o) * 18}px)`;
          if (o > best) {
            best = o;
            bestSide = ch.side;
            want = ch.side === "l" ? 1 : -1;
          }
        });
        const ho = 1 - ramp(q, 0.03, 0.05);
        if (heroEl) {
          heroEl.style.opacity = String(ho);
          heroEl.style.transform = `translateY(${(1 - ho) * -18}px)`;
        }
        if (ho > best) {
          want = 1;
          best = ho;
          bestSide = "l";
        }
        scrims.forEach((sc) => (sc.style.opacity = String(sc.dataset.scrim === bestSide ? best : 0)));
        if (q > 0.76) want = 1; // the dashboard sits on the right
        side = reduced ? want : side + (want - side) * (1 - Math.exp(-dt * 4));
        const mo = ramp(q, 0.368, 0.385) * (1 - ramp(q, 0.425, 0.442));
        if (menuEl) {
          menuEl.style.opacity = String(mo);
          menuEl.style.transform = `translateY(${(1 - mo) * 30}px) scale(${0.94 + 0.06 * mo})`;
        }
        if (adminEl) {
          const ao = ramp(q, 0.765, 0.795);
          adminEl.style.opacity = String(ao);
          adminEl.dataset.tab = q > 0.858 ? "analytics" : "floor";
        }

        // page colours
        const th = themeAt(q);
        wrap.style.setProperty("--c-bg", th.bg);
        wrap.style.setProperty("--c-fg", th.fg);
        wrap.style.setProperty("--c-muted", th.muted);

        // the model
        floor.set({
          rise: ramp(q, 0.05, 0.215),
          line: q < 0.735 ? ramp(q, 0.44, 0.48) : 1 - 0.22 * ramp(q, 0.735, 0.775),
          ink: th.ink,
          paper: th.bg,
          admin: ramp(q, 0.765, 0.8),
          bars: ramp(q, 0.862, 0.95),
          order: ramp(q, 0.492, 0.548) * (1 - ramp(q, 0.725, 0.745)),
          bill: ramp(q, 0.655, 0.71) * (1 - ramp(q, 0.725, 0.745)),
        });

        // camera
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        const aspect = w / h;
        const desk = w >= 1024;
        const v = view(q);
        const effA = desk ? aspect * 0.6 : aspect;
        const r = v.r * Math.pow(Math.max(1, 1 / effA), v.wide);
        camera.position.set(tgt.x + r * Math.sin(v.phi) * Math.sin(v.th), tgt.y + r * Math.cos(v.phi), tgt.z + r * Math.sin(v.phi) * Math.cos(v.th));
        camera.up.set(0, 1, 0);
        camera.lookAt(tgt);
        camera.aspect = aspect;
        if (desk) camera.setViewOffset(w, h, -side * 0.2 * w, 0, w, h);
        else camera.setViewOffset(w, h, 0, 0.11 * h, w, h);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        const settled = q === p && Math.abs(side - want) < 1e-3;
        if (!settled && visible) raf = requestAnimationFrame(frame);
      };
      const run = () => {
        if (!raf && visible) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      kick.current = run;
      const resize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight, false);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        run();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) run();
      });
      io.observe(wrap);
      resize();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [url]);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          target.current = self.progress;
          kick.current();
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative" style={{ height: "1150svh", background: "var(--c-bg)", color: "var(--c-fg)", ["--c-bg" as string]: PAPER.bg, ["--c-fg" as string]: PAPER.fg, ["--c-muted" as string]: PAPER.muted }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={host} className="absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] sm:hidden" style={{ background: "linear-gradient(transparent, var(--c-bg) 42%)" }} />
        {/* a soft wash of page colour behind the text, so close-ups never fight the words */}
        <div aria-hidden="true" data-scrim="l" className="pointer-events-none absolute inset-y-0 left-0 w-[48vw] opacity-0 max-sm:hidden" style={{ background: "linear-gradient(90deg, var(--c-bg) 38%, transparent)" }} />
        <div aria-hidden="true" data-scrim="r" className="pointer-events-none absolute inset-y-0 right-0 w-[48vw] opacity-0 max-sm:hidden" style={{ background: "linear-gradient(270deg, var(--c-bg) 38%, transparent)" }} />

        {/* hero */}
        <div data-hero className="pointer-events-none absolute inset-x-5 bottom-10 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-10 sm:max-w-[min(34rem,40vw)] sm:-translate-y-1/2 lg:left-16">
          <p className="text-[12.5px] tracking-[0.045em] uppercase" style={{ color: "var(--c-muted)" }}>QR menus for restaurants</p>
          <h1 className="headline mt-3 text-[clamp(2.6rem,6.2vw,6rem)]">Your restaurant in one QR code</h1>
          <p className="mt-4 max-w-md text-base sm:text-lg" style={{ color: "var(--c-muted)" }}>Scan it, or keep scrolling: the code becomes the room it runs.</p>
          <p className="mt-6 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>Scroll ↓</p>
        </div>

        {/* chapters: text beside the scene (below it on phones) */}
        {CHAPTERS.map((ch) => (
          <div
            key={ch.eyebrow}
            data-panel
            className={`pointer-events-none absolute inset-x-5 bottom-10 opacity-0 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:max-w-[min(30rem,36vw)] sm:-mt-28 ${ch.side === "l" ? "sm:left-10 lg:left-16" : "sm:right-10 lg:right-16"}`}
          >
            <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>{ch.eyebrow}</p>
            <h2 className="headline mt-3 text-[clamp(2.4rem,5.4vw,5.25rem)]">{ch.title}</h2>
            <p className="mt-4 max-w-sm text-base sm:text-lg" style={{ color: "var(--c-muted)" }}>{ch.text}</p>
            {ch.eyebrow.startsWith("07") && (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {["Free", "Eating", "Waiting long", "Paying"].map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="size-3 rounded-[3px]" style={{ background: STATUS[i + 1] }} />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* the digital menu the table card opens (sample) */}
        <div className="pointer-events-none absolute top-[14svh] left-1/2 w-[min(19rem,78vw)] -translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 lg:left-[70%]">
          <div data-menu className="rounded-[28px] bg-[#fbfaf7] p-4 text-[#0d0c0b] opacity-0 shadow-[0_30px_80px_-24px_rgba(13,12,11,0.45)] ring-1 ring-black/5">
            <div className="flex items-center justify-between text-xs text-[#5f5e5c]">
              <span>Table 12</span>
              <span className="rounded-full bg-[#f2f0ec] px-2 py-0.5">EN</span>
            </div>
            <p className="mt-2 text-lg font-medium">Today&apos;s menu</p>
            <div className="mt-3 flex gap-1.5 text-xs">
              {["Mains", "Pizza", "Salads", "Desserts"].map((c, i) => (
                <span key={c} className={`rounded-full px-2.5 py-1 ${i === 0 ? "bg-[#0d0c0b] text-white" : "bg-[#f2f0ec] text-[#5f5e5c]"}`}>{c}</span>
              ))}
            </div>
            <ul className="mt-2">
              {[
                ["Cheeseburger", "Brioche, aged cheddar, pickles", "14", "#c8873f"],
                ["Margherita", "Tomato, fior di latte, basil", "11", "#c8452c"],
                ["Caesar salad", "Romaine, parmesan, croutons", "9", "#7d9a55"],
              ].map(([name, desc, price, tone]) => (
                <li key={name} className="flex items-center gap-3 border-t border-black/5 py-2.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: `${tone}26` }}>
                    <span className="size-6 rounded-full" style={{ background: tone }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {name}
                      <span className="rounded bg-[#b83219] px-1 text-[10px] leading-4 text-white">3D</span>
                    </span>
                    <span className="block truncate text-xs text-[#5f5e5c]">{desc}</span>
                  </span>
                  <span className="text-sm">€{price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 rounded-full bg-[#0d0c0b] py-2.5 text-center text-sm text-white">See it on your table</p>
            <p className="mt-2 text-center text-[10px] text-[#8a8884]">Sample menu</p>
          </div>
        </div>

        {/* dashboard frame round the floor (sample data) */}
        <div data-admin data-tab="floor" className="group pointer-events-none absolute inset-x-3 top-20 bottom-[36svh] opacity-0 sm:inset-x-auto sm:top-[8svh] sm:right-[3vw] sm:bottom-[8svh] sm:w-[min(58vw,62rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl ring-1 ring-black/10" style={{ boxShadow: "0 30px 90px -40px rgba(13,12,11,.35)" }}>
            <div className="flex items-center gap-3 border-b border-black/10 bg-[#fbfaf7]/90 px-4 py-2.5 text-xs text-[#5f5e5c] backdrop-blur">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-black/10" />)}
              </span>
              <span className="font-medium text-[#0d0c0b]">{BRAND} · Dashboard</span>
              <span className="ml-auto flex gap-1">
                {["Floor", "Orders", "Menu", "Analytics"].map((t) => (
                  <span
                    key={t}
                    className={`rounded-full px-2.5 py-1 transition-colors max-sm:[&:nth-child(2)]:hidden max-sm:[&:nth-child(3)]:hidden ${t === "Floor" ? "group-data-[tab=floor]:bg-[#0d0c0b] group-data-[tab=floor]:text-white" : t === "Analytics" ? "group-data-[tab=analytics]:bg-[#0d0c0b] group-data-[tab=analytics]:text-white" : ""}`}
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
            <div className="relative grid grid-cols-3 gap-px border-b border-black/10 bg-black/10 text-[#0d0c0b]">
              {[
                ["Seated", "14 / 22", "Sales today", "€2,480"],
                ["Waiting > 10 min", "3 tables", "Top dish", "Cheeseburger"],
                ["Open bills", "6", "Busiest hour", "19:00"],
              ].map(([a, av, b, bv]) => (
                <div key={a} className="bg-[#fbfaf7]/90 px-4 py-2.5 backdrop-blur">
                  <p className="text-[11px] text-[#5f5e5c]"><span className="group-data-[tab=analytics]:hidden">{a}</span><span className="hidden group-data-[tab=analytics]:inline">{b}</span></p>
                  <p className="text-sm font-medium sm:text-base"><span className="group-data-[tab=analytics]:hidden">{av}</span><span className="hidden group-data-[tab=analytics]:inline">{bv}</span></p>
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <p className="bg-[#fbfaf7]/90 px-4 py-2 text-[10px] text-[#8a8884] backdrop-blur">Sample data · <span className="group-data-[tab=analytics]:hidden">tables by status</span><span className="hidden group-data-[tab=analytics]:inline">sales by table, today</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
