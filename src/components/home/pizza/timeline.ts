/** Scroll progress (0–1) windows for each build stage. Shared by the 3D scene and the HTML overlays. */
export const STAGES = {
  dough: [0.06, 0.18],
  sauce: [0.2, 0.32],
  cheese: [0.34, 0.46],
  tomato: [0.48, 0.58],
  bake: [0.6, 0.72],
  basil: [0.74, 0.82],
  table: [0.85, 0.95],
} as const;

export const STAGE_ORDER = ["dough", "sauce", "cheese", "tomato", "bake", "basil", "table"] as const;

/**
 * Text panels (hero, then one per story caption) as [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
 * The gaps between panels are deliberate: only the pizza is on screen while a layer lands.
 */
export const PANEL_CUES: [number, number, number, number][] = [
  [0, 0, 0.035, 0.07],
  [0.09, 0.115, 0.165, 0.19],
  [0.21, 0.235, 0.305, 0.33],
  [0.35, 0.375, 0.445, 0.47],
  [0.5, 0.525, 0.8, 0.83],
  [0.86, 0.885, 1.1, 1.2],
];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const range = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smoothstep 0 → 1 between a and b (a step when a === b). */
export const ramp = (p: number, a: number, b: number) => (b <= a ? (p >= b ? 1 : 0) : smooth(clamp01((p - a) / (b - a))));

/** Space kept free under the pizza for the stage line, in px. */
export const FREE_MARGIN = 48;
/** Top of the area the pizza is framed in: just under the copy, which may use at most 62% of the screen. */
export const freeTop = (height: number, copyBottom?: number) => Math.min(copyBottom || height * 0.5, height * 0.62);
