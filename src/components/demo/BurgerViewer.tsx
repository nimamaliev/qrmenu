"use client";

import { useEffect } from "react";

/**
 * The finished burger from the hero film as a real-time model (public/models/burger.glb,
 * exported by blender/burger.py). <model-viewer> adds rotate/zoom and, on phones that
 * support it, an AR button that places the dish on the table at real size (11 cm).
 * iOS Quick Look gets a USDZ that model-viewer generates from the GLB.
 */
export default function BurgerViewer({ alt, arLabel }: { alt: string; arLabel: string }) {
  useEffect(() => {
    // Self-hosted Draco decoder (public/draco, from three.js) instead of model-viewer's gstatic default.
    const w = window as unknown as { ModelViewerElement?: Record<string, unknown> };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer");
  }, []);

  return (
    <model-viewer
      src="/models/burger.glb"
      poster="/hero/d/000.webp"
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="fixed"
      camera-controls
      auto-rotate
      camera-orbit="-30deg 72deg auto"
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
