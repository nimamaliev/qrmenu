import type { DetailedHTMLProps, HTMLAttributes } from "react";

/** The <model-viewer> web component (@google/model-viewer), as used on the demo page. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "camera-orbit"?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        "touch-action"?: string;
        "interaction-prompt"?: string;
      };
    }
  }
}
