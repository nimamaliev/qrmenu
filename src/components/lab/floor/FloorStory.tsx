"use client";

import { useEffect, useRef } from "react";
import type * as T from "three";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { BRAND } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import OwnerDashboard from "@/components/home/OwnerDashboard";
import { buildFloor, STATUS, type Floor } from "./scene";

/**
 * The floor story (preview): one pinned 3D scene driven by scroll.
 * QR code -> it rises into a mini restaurant -> the camera comes to a table where a menu book
 * opens on a dish with its own QR code -> the real 3D dish appears on the plate (the hook) ->
 * line-drawing chapters on bold page colours (order, kitchen, bill) -> the floor seen from above
 * in the dashboard -> analytics bars grow out of the tables and fly together as bricks into the
 * hourly chart -> the owner dashboard itself, scrolled through. Copy is draft.
 */

type Side = "l" | "r";
type Chapter = { from: number; to: number; side: Side; eyebrow: string; title: string; text: string; demo?: boolean; legend?: boolean };
const CHAPTERS: Chapter[] = [
  { from: 0.085, to: 0.225, side: "l", eyebrow: "01 · The floor", title: "Every square is a table", text: "Your code at the door and on every table. Guests scan it, and the restaurant opens on their phone." },
  { from: 0.25, to: 0.335, side: "l", eyebrow: "02 · The menu", title: "Keep your menu", text: "Printed or digital, every dish gets its own QR code next to it." },
  { from: 0.355, to: 0.43, side: "l", eyebrow: "03 · One code per dish", title: "Point the camera", text: "Guests scan the code beside a dish with their phone camera. No app to install." },
  { from: 0.445, to: 0.555, side: "l", eyebrow: "04 · The dish in 3D", title: "See it on your table", text: "The dish appears right there, life-size and in 3D, before anyone orders it.", demo: true },
  { from: 0.575, to: 0.63, side: "r", eyebrow: "05 · Order", title: "Order from the table", text: "The order goes straight to the kitchen, with the table number on it." },
  { from: 0.655, to: 0.705, side: "l", eyebrow: "06 · Kitchen", title: "The kitchen knows", text: "Who ordered what, and how long each table has been waiting." },
  { from: 0.73, to: 0.785, side: "r", eyebrow: "07 · Bill", title: "The bill, without the wait", text: "Each bill follows its table, so paying takes a minute." },
  { from: 0.815, to: 0.855, side: "l", eyebrow: "08 · Your floor, live", title: "The whole room on one screen", text: "Which tables are free, eating, waiting or paying, at a glance.", legend: true },
  { from: 0.862, to: 1.01, side: "l", eyebrow: "09 · Analytics", title: "Know what sells", text: "Every table's orders add up: sales, top dishes, peak hours and 3D views, from the same system." },
];

// route: the order/bill line, picked to stand out on each page colour
type Theme = { bg: string; fg: string; muted: string; ink: string; route: string };
const PAPER: Theme = { bg: "#f2f0ec", fg: "#0d0c0b", muted: "#5f5e5c", ink: "#0d0c0b", route: "#b83219" };
const SAFFRON: Theme = { bg: "#f0c24f", fg: "#1a1712", muted: "#4f4120", ink: "#1a1712", route: "#b83219" };
const TOMATO: Theme = { bg: "#b83219", fg: "#fff7f2", muted: "#ffd9cc", ink: "#2b0c05", route: "#fff1dc" };
const BASIL: Theme = { bg: "#1d3b2e", fg: "#eef4ee", muted: "#a9c2b2", ink: "#e3ede6", route: "#f0c24f" };
const THEMES: [number, Theme][] = [
  [0, PAPER],
  [0.555, PAPER],
  [0.572, SAFFRON],
  [0.632, SAFFRON],
  [0.645, TOMATO],
  [0.708, TOMATO],
  [0.72, BASIL],
  [0.79, BASIL],
  [0.805, PAPER],
  [1, PAPER],
];

const ramp = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const smooth = (t: number) => t * t * (3 - 2 * t);
const DEG = Math.PI / 180;
const FACE = 34; // the azimuth the menu book is read from

type Props = { url: string; lang: Locale; owners: Dictionary["owners"]; menu: Dictionary["menu"] };

export default function FloorStory({ url, lang, owners, menu }: Props) {
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
      // sharpness adapts: it starts high and steps down if frames keep running slow on this device
      let dpr = Math.min(devicePixelRatio, small ? 1.5 : 1.75);
      renderer.setPixelRatio(dpr);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      let lastShadow = "";
      let dishLoaded = false;
      renderer.localClippingEnabled = true;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(24, 1, 0.3, 900);
      const floor: Floor = buildFloor(THREE, (g) => mergeGeometries(g)!, url, FACE * DEG);
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
      const dishView = S.dish.clone().add(new THREE.Vector3(0, 0.07, 0));
      const KEYS: [number, T.Vector3, number, number, number, number][] = [
        [0, O, R * 1.2, 0.4, 0, 1],
        [0.05, O, R * 1.2, 0.4, 0, 1],
        [0.21, up(O, 0.4), R * 1.12, 54, 38, 1],
        [0.24, up(O, 0.4), R * 1.08, 56, 40, 1],
        [0.305, S.hero, 3.4, 52, FACE, 0.6],
        [0.33, S.hero, 2.6, 46, FACE, 0.55],
        [0.36, S.book.clone().lerp(S.page, 0.55), 0.92, 16, FACE, 0.35],
        [0.395, S.page, 0.64, 8, FACE, 0.3],
        [0.425, S.page, 0.64, 8, FACE, 0.3],
        [0.462, dishView, 0.66, 66, FACE + 14, 0.35],
        [0.535, dishView, 0.62, 62, FACE + 120, 0.35],
        [0.57, midOrder, R * 0.55, 52, 26, 1],
        [0.625, midOrder, R * 0.55, 52, 22, 1],
        [0.655, up(S.kitchen, 0.8), 23, 50, 28, 0.75],
        [0.7, up(S.kitchen, 0.8), 21, 50, 36, 0.75],
        [0.73, up(S.till, 0.8), 23, 50, 58, 0.75],
        [0.78, up(S.till, 0.8), 21, 50, 66, 0.75],
        [0.82, O, R * 1.6, 0.4, 0, 1],
        [0.852, O, R * 1.6, 0.4, 0, 1],
        [0.892, up(O, 1.6), R * 1.2, 52, 36, 1],
        [0.905, up(O, 1.6), R * 1.18, 53, 37, 1],
        // straight-on at the end, so the chart's plane faces the screen like the dashboard does
        [0.948, S.chart, 68, 90, 0, 1],
        [1, S.chart, 68, 90, 0, 1],
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
        return { bg: mix(A.bg, B.bg), fg: mix(A.fg, B.fg), muted: mix(A.muted, B.muted), ink: mix(A.ink, B.ink), route: mix(A.route, B.route) };
      };

      const panels = Array.from(wrap.querySelectorAll<HTMLElement>("[data-panel]"));
      const heroEl = wrap.querySelector<HTMLElement>("[data-hero]");
      const adminEl = wrap.querySelector<HTMLElement>("[data-admin]");
      const dashEl = wrap.querySelector<HTMLElement>("[data-dash]");
      const dashInner = wrap.querySelector<HTMLElement>("[data-dash-inner]");
      const scrims = Array.from(wrap.querySelectorAll<HTMLElement>("[data-scrim]"));
      // the dashboard's hourly bars, measured on screen and mapped onto the 3D chart's plane
      const hourBars = Array.from(wrap.querySelectorAll<HTMLElement>("[data-hour-bar]"));
      const ray = new THREE.Raycaster();
      const chartPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -S.chart.z);
      const hit = new THREE.Vector3();
      const ndc = new THREE.Vector2();
      const toPlane = (x: number, y: number, box: DOMRect) => {
        ndc.set(((x - box.left) / box.width) * 2 - 1, -((y - box.top) / box.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        return ray.ray.intersectPlane(chartPlane, hit) ? hit.clone() : null;
      };
      const measureChart = () => {
        const box = el.getBoundingClientRect();
        const xs: number[] = [];
        const hs: number[] = [];
        let width = 0;
        let base = 0;
        for (const bar of hourBars) {
          const r = bar.getBoundingClientRect();
          const bl = toPlane(r.left, r.bottom, box);
          const br = toPlane(r.right, r.bottom, box);
          const tl = toPlane(r.left, r.top, box);
          if (!bl || !br || !tl) return;
          xs.push((bl.x + br.x) / 2);
          hs.push(tl.y - bl.y);
          width += (br.x - bl.x) / hourBars.length;
          base += bl.y / hourBars.length;
        }
        floor.setChart(xs, hs, width, base);
      };
      let fitS = 1;
      // write a style only when it changes: most frames leave most of the page as it was
      const seen = new WeakMap<HTMLElement, Record<string, string>>();
      const css = (node: HTMLElement, prop: string, value: string) => {
        const was = seen.get(node) ?? {};
        if (was[prop] === value) return;
        was[prop] = value;
        seen.set(node, was);
        node.style.setProperty(prop, value);
      };
      const show = (node: HTMLElement, o: number, dy: number) => {
        const r = Math.round(o * 1000) / 1000;
        css(node, "opacity", String(r));
        css(node, "transform", `translateY(${((1 - r) * dy).toFixed(1)}px)`);
        css(node, "visibility", r < 0.01 ? "hidden" : "visible");
      };

      let q = target.current;
      let side = 1; // +1 scene on the right (text left), -1 scene on the left
      let raf = 0;
      let chained = false;
      let last = performance.now();
      let visible = true;
      let avg = 1 / 60;
      let streak = 0;
      const frame = (now: number) => {
        raf = 0;
        const real = (now - last) / 1000;
        const dt = Math.min(0.05, real);
        last = now;
        if (chained && real < 0.25) {
          avg += (real - avg) * 0.08;
          if (++streak > 45 && avg > 0.024 && dpr > 1) {
            dpr = Math.max(1, dpr - 0.25);
            renderer.setPixelRatio(dpr);
            renderer.setSize(el.clientWidth, el.clientHeight, false);
            streak = 0;
            avg = 1 / 60;
          }
        }
        chained = true;
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
          show(pe, o, 18);
          if (o > best) {
            best = o;
            bestSide = ch.side;
            want = ch.side === "l" ? 1 : -1;
          }
        });
        const ho = 1 - ramp(q, 0.03, 0.05);
        if (heroEl) show(heroEl, ho, -18);
        if (ho > best) {
          want = 1;
          best = ho;
          bestSide = "l";
        }
        if (q > 0.8) want = 1; // the dashboard sits on the right
        side = reduced ? want : side + (want - side) * (1 - Math.exp(-dt * 4));
        scrims.forEach((sc) => css(sc, "opacity", (sc.dataset.scrim === bestSide ? best : 0).toFixed(3)));
        if (adminEl) {
          css(adminEl, "opacity", (ramp(q, 0.805, 0.835) * (1 - ramp(q, 0.948, 0.96))).toFixed(3));
          const tab = q > 0.856 ? "analytics" : "floor";
          if (adminEl.dataset.tab !== tab) adminEl.dataset.tab = tab;
        }
        if (dashEl && dashInner) {
          // the dashboard waits, laid out but invisible, with its hourly chart in view: the bricks
          // land on its bars, then it fades in over them and the 3D scene fades away
          const d = ramp(q, 0.946, 0.958);
          css(dashEl, "opacity", d.toFixed(3));
          css(dashEl, "visibility", d < 0.01 ? "hidden" : "visible");
          css(dashEl, "pointer-events", d > 0.9 ? "auto" : "none");
          // on wide screens it's scaled to fit its frame; on phones it scrolls up from the chart
          fitS = el.clientWidth >= 1024 ? Math.min(1, dashEl.clientHeight / Math.max(1, dashInner.offsetHeight)) : 1;
          css(dashInner, "width", `${(100 / fitS).toFixed(2)}%`);
          const room = Math.max(0, dashInner.offsetHeight * fitS - dashEl.clientHeight);
          css(dashInner, "transform", `translateY(${(-room * (1 - smooth(ramp(q, 0.966, 0.996)))).toFixed(1)}px) scale(${fitS.toFixed(4)})`);
        }
        css(el, "opacity", (1 - ramp(q, 0.954, 0.966)).toFixed(3));

        // page colours
        const th = themeAt(q);
        css(wrap, "--c-bg", th.bg);
        css(wrap, "--c-fg", th.fg);
        css(wrap, "--c-muted", th.muted);

        // the model (shadows are redrawn only when something that casts them moves)
        const morph = ramp(q, 0.905, 0.945);
        const state = {
          // the room builds up, and sinks back into the code while its numbers become the chart
          rise: ramp(q, 0.05, 0.215) * (1 - ramp(q, 0.9, 0.94)),
          line: q < 0.79 ? ramp(q, 0.54, 0.575) : 1 - 0.22 * ramp(q, 0.79, 0.83),
          ink: th.ink,
          paper: th.bg,
          admin: ramp(q, 0.805, 0.845),
          book: smooth(ramp(q, 0.318, 0.352)),
          dish: ramp(q, 0.458, 0.5),
          bars: ramp(q, 0.858, 0.9),
          morph,
          gone: smooth(ramp(q, 0.9, 0.935)),
          route: th.route,
          order: ramp(q, 0.582, 0.625) * (1 - ramp(q, 0.79, 0.81)),
          bill: ramp(q, 0.737, 0.775) * (1 - ramp(q, 0.79, 0.81)),
        };
        floor.set(state);

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
        camera.near = Math.min(1, Math.max(0.01, r * 0.02));
        camera.far = r * 8 + 150;
        if (desk) camera.setViewOffset(w, h, -side * 0.2 * w, 0, w, h);
        else camera.setViewOffset(w, h, 0, 0.11 * h, w, h);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        const shadowKey = `${state.rise.toFixed(3)} ${state.book.toFixed(3)} ${state.dish.toFixed(3)} ${dishLoaded}`;
        if (shadowKey !== lastShadow) {
          lastShadow = shadowKey;
          renderer.shadowMap.needsUpdate = true;
        }
        if (q > 0.86 && q < 0.96) measureChart();
        renderer.render(scene, camera);

        const settled = q === p && Math.abs(side - want) < 1e-3;
        if (!settled && visible) raf = requestAnimationFrame(frame);
      };
      const run = () => {
        if (!raf && visible) {
          chained = false;
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
      const warm = async () => {
        const hidden: T.Object3D[] = [];
        scene.traverse((o) => {
          if (!o.visible) {
            hidden.push(o);
            o.visible = true;
          }
        });
        try {
          await renderer.compileAsync(scene, camera);
        } catch {
          // compiling up front is only an optimisation
        }
        hidden.forEach((o) => (o.visible = false));
      };
      camera.aspect = (el.clientWidth || 1) / (el.clientHeight || 1);
      await warm();
      if (disposed) return;
      resize();

      // the real 3D dish (the same model as the demo), loaded once the room is on screen
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
      if (disposed) return;
      const draco = new DRACOLoader().setDecoderPath("/draco/");
      new GLTFLoader().setDRACOLoader(draco).load("/models/burger.glb", (gltf) => {
        if (disposed) return;
        floor.addDish(gltf.scene);
        gltf.scene.traverse((o) => {
          const m = (o as T.Mesh).material as T.MeshStandardMaterial | undefined;
          if (m) [m.map, m.normalMap, m.roughnessMap].forEach((t) => t && renderer.initTexture(t));
        });
        dishLoaded = true;
        warm();
        draco.dispose();
        run();
      });

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
    <div ref={root} data-floor-story className="relative" style={{ height: "1500svh", background: "var(--c-bg)", color: "var(--c-fg)", ["--c-bg" as string]: PAPER.bg, ["--c-fg" as string]: PAPER.fg, ["--c-muted" as string]: PAPER.muted }}>
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
          <p className="mt-4 max-w-md text-base sm:text-lg" style={{ color: "var(--c-muted)" }}>From a dish in 3D on your guest&apos;s table to the whole room on your screen.</p>
          <p className="mt-6 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>Scroll ↓</p>
        </div>

        {/* chapters: text beside the scene (below it on phones) */}
        {CHAPTERS.map((ch) => (
          <div
            key={ch.eyebrow}
            data-panel
            className={`pointer-events-none invisible absolute inset-x-5 bottom-10 opacity-0 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:max-w-[min(30rem,36vw)] sm:-mt-28 ${ch.side === "l" ? "sm:left-10 lg:left-16" : "sm:right-10 lg:right-16"}`}
          >
            <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--c-muted)" }}>{ch.eyebrow}</p>
            <h2 className="headline mt-3 text-[clamp(2.4rem,5.4vw,5.25rem)]">{ch.title}</h2>
            <p className="mt-4 max-w-sm text-base sm:text-lg" style={{ color: "var(--c-muted)" }}>{ch.text}</p>
            {ch.demo && (
              <a href={`/${lang}/demo`} className="pill pointer-events-auto mt-6 h-12 px-7 text-[15px]">
                Try it yourself
              </a>
            )}
            {ch.legend && (
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

        {/* dashboard frame round the floor (sample data, same numbers as the dashboard below) */}
        <div data-admin data-tab="floor" className="group pointer-events-none absolute inset-x-3 top-20 bottom-[36svh] opacity-0 sm:inset-x-auto sm:top-[8svh] sm:right-[3vw] sm:bottom-[8svh] sm:w-[min(58vw,62rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl ring-1 ring-black/10" style={{ boxShadow: "0 30px 90px -40px rgba(13,12,11,.35)" }}>
            <div className="flex items-center gap-3 border-b border-black/10 bg-[#fbfaf7] px-4 py-2.5 text-xs text-[#5f5e5c]">
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
            <div className="grid grid-cols-3 gap-px border-b border-black/10 bg-black/10 text-[#0d0c0b]">
              {[
                ["Seated", "14 / 22", "Sales today", "€2,846"],
                ["Waiting > 10 min", "3 tables", "Orders today", "132"],
                ["Open bills", "6", "Busiest hour", "20:00"],
              ].map(([a, av, b, bv]) => (
                <div key={a} className="bg-[#fbfaf7] px-4 py-2.5">
                  <p className="text-[11px] text-[#5f5e5c]"><span className="group-data-[tab=analytics]:hidden">{a}</span><span className="hidden group-data-[tab=analytics]:inline">{b}</span></p>
                  <p className="text-sm font-medium sm:text-base"><span className="group-data-[tab=analytics]:hidden">{av}</span><span className="hidden group-data-[tab=analytics]:inline">{bv}</span></p>
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <p className="bg-[#fbfaf7] px-4 py-2 text-[10px] text-[#8a8884]">Sample data · <span className="group-data-[tab=analytics]:hidden">tables by status</span><span className="hidden group-data-[tab=analytics]:inline">orders by table, then by hour</span></p>
          </div>
        </div>

        {/* the owner dashboard itself, scrolled through as the story ends */}
        <div data-dash className="invisible absolute inset-x-3 top-20 bottom-[34svh] overflow-hidden rounded-3xl opacity-0 sm:inset-x-auto sm:top-[8svh] sm:right-[3vw] sm:bottom-[6svh] sm:w-[min(58vw,62rem)] [&_.reveal]:[animation:none]">
          <div data-dash-inner className="origin-top-left text-text">
            <OwnerDashboard lang={lang} owners={owners} menu={menu} />
          </div>
        </div>
      </div>
    </div>
  );
}
