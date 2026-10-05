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

/** Caption windows, one per story caption in the dictionary. */
export const CAPTION_WINDOWS: [number, number][] = [
  [0.09, 0.19],
  [0.21, 0.33],
  [0.35, 0.47],
  [0.5, 0.83],
  [0.86, 1.01],
];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const range = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

/** 0 → 1 → 0 across a window, with `fade` long ramps at both ends. */
export const windowOpacity = (p: number, [a, b]: readonly [number, number], fade = 0.025) =>
  clamp01(Math.min((p - a) / fade, (b - p) / fade));
