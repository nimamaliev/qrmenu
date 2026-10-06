"use client";

import { useEffect, useRef, type RefObject } from "react";
import { FRAMES } from "./timeline";

const src = (set: string, i: number) => `/hero/${set}/${String(i).padStart(3, "0")}.webp`;

/** Coarse-to-fine load order: every 16th frame first, so scrubbing works early and fills in. */
function loadOrder() {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < FRAMES; i += step) {
      if (seen.has(i)) continue;
      seen.add(i);
      order.push(i);
    }
  }
  return order;
}

/**
 * Plays the pre-rendered burger film on a canvas, scrubbed by scroll.
 * The shown position eases toward the scroll target (never snaps), and neighbouring
 * frames are cross-faded so slow scrolling stays smooth between rendered frames.
 */
export default function FrameScrubber({ progress, still }: { progress: RefObject<number>; still?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || still) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const set = window.matchMedia("(max-width: 639px)").matches ? "m" : "d";
    const imgs: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let alive = true;
    let dirty = true;

    // Load with a small pool so the first coarse pass arrives quickly.
    const queue = loadOrder();
    const next = () => {
      const i = queue.shift();
      if (i === undefined || !alive) return;
      const img = new Image();
      img.src = src(set, i);
      img
        .decode()
        .then(() => {
          imgs[i] = img;
          dirty = true;
        })
        .catch(() => {})
        .finally(next);
    };
    for (let k = 0; k < 6; k++) next();

    const nearest = (i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        if (imgs[i - d]) return imgs[i - d];
        if (imgs[i + d]) return imgs[i + d];
      }
      return null;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let shown = progress.current ?? 0;
    let last = performance.now();
    let raf = 0;
    const draw = (img: HTMLImageElement, alpha: number) => {
      // "contain", centred: same fit as the poster's object-contain
      const s = Math.min(el.width / img.naturalWidth, el.height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (el.width - w) / 2, (el.height - h) / 2, w, h);
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = progress.current ?? 0;
      const gap = target - shown;
      if (Math.abs(gap) > 1e-4) {
        shown += gap * (1 - Math.exp(-dt * 7.3));
        dirty = true;
      }
      if (!dirty) return;
      const f = shown * (FRAMES - 1);
      const i = Math.floor(f);
      const a = nearest(i);
      if (!a) return;
      dirty = false;
      ctx.clearRect(0, 0, el.width, el.height);
      draw(a, 1);
      const b = imgs[Math.min(i + 1, FRAMES - 1)];
      if (b && imgs[i] && f - i > 0.01) draw(b, f - i);
      ctx.globalAlpha = 1;
      if (poster.current) poster.current.style.visibility = "hidden";
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [progress, still]);

  return (
    <>
      {/* First frame as a real image: paints before any script runs. */}
      <picture>
        <source media="(max-width: 639px)" srcSet={src("m", 0)} />
        <img ref={poster} src={src("d", 0)} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-contain" />
      </picture>
      {!still && <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
    </>
  );
}
