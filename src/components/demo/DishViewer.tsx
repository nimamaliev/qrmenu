"use client";

import { useEffect, useRef } from "react";
import type { Dish } from "@/lib/dishes";

type ModelViewer = HTMLElement & { canActivateAR: boolean; activateAR: () => Promise<void> };

/**
 * A dish as a real-time model. <model-viewer> adds rotate/zoom and, on phones that support it,
 * an AR button that places the dish on the table at real size (Scene Viewer on Android, Quick Look
 * on iOS: the dish's USDZ, or one model-viewer generates from the GLB).
 *
 * With autoAR, a phone that arrives from outside the site (the QR code) is sent straight into AR
 * once per tab. Browsers may refuse AR without a tap (iOS needs one); the AR button stays as the way in.
 */
export default function DishViewer({
  dish,
  alt,
  arLabel,
  autoAR = false,
}: {
  dish: Dish;
  alt: string;
  arLabel: string;
  autoAR?: boolean;
}) {
  const ref = useRef<ModelViewer>(null);

  useEffect(() => {
    // Self-hosted Draco decoder (public/draco, from three.js) instead of model-viewer's gstatic default.
    const w = window as unknown as { ModelViewerElement?: Record<string, unknown> };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    let timer = 0;
    import("@google/model-viewer").then(() => {
      if (!autoAR || !fromOutside() || !matchMedia("(pointer: coarse)").matches || triedThisTab()) return;
      // canActivateAR turns true once model-viewer has checked the device; give it a few seconds.
      const started = performance.now();
      const tryAR = () => {
        const viewer = ref.current;
        if (viewer?.canActivateAR) viewer.activateAR().catch(() => {});
        else if (performance.now() - started < 5000) timer = window.setTimeout(tryAR, 100);
      };
      tryAR();
    });
    return () => clearTimeout(timer);
  }, [autoAR]);

  return (
    <model-viewer
      ref={ref}
      src={dish.src}
      ios-src={dish.iosSrc}
      poster={dish.poster}
      alt={alt}
      ar
      // Scene Viewer first: it can open from a page load, while WebXR always needs a tap.
      ar-modes="scene-viewer webxr quick-look"
      ar-scale="fixed"
      camera-controls
      auto-rotate
      camera-orbit={dish.cameraOrbit}
      shadow-intensity="0.9"
      environment-image="neutral"
      exposure="1.05"
      touch-action="pan-y"
      interaction-prompt="none"
      className="block h-full w-full bg-transparent"
    >
      <span slot="progress-bar" />
      <button slot="ar-button" className="pill absolute bottom-5 left-1/2 h-12 -translate-x-1/2 px-6 text-[15px]">
        {arLabel}
      </button>
    </model-viewer>
  );
}

/** True when the visitor came from another site or a scanned QR code, not from a link on this site. */
function fromOutside() {
  try {
    return !document.referrer || new URL(document.referrer).origin !== location.origin;
  } catch {
    return true;
  }
}

/** Remembers the attempt so a reload, or coming back from AR, doesn't launch it again. */
function triedThisTab() {
  try {
    if (sessionStorage.getItem("auto-ar")) return true;
    sessionStorage.setItem("auto-ar", "1");
  } catch {}
  return false;
}
