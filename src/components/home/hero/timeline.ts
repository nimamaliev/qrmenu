import film from "./burger-timeline.json";

/** Rendered by blender/burger.py, which also writes the story timings below. */
export const FRAMES = film.frames;
/**
 * When each build stage becomes active (scroll progress 0–1). Stage 0 is the toasted bottom bun,
 * left alone once the other layers lift away; the rest are the layers dropping back in order.
 */
export const STAGE_STARTS = [film.liftOff[0], ...film.landings.map(([a]) => a)];

/**
 * Text panels (hero, then one per story caption) as [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
 * The gaps between panels are deliberate: only the burger is on screen while a layer lands.
 */
export const PANEL_CUES: [number, number, number, number][] = [
  [0, 0, 0.035, 0.06],
  [0.08, 0.1, 0.18, 0.2],
  [0.22, 0.245, 0.33, 0.355],
  [0.38, 0.405, 0.56, 0.585],
  [0.66, 0.685, 0.82, 0.845],
  [0.865, 0.89, 1.1, 1.2],
];

/** The "on your table" AR frame fades in once the camera settles. */
export const AR_FADE: [number, number] = [film.settle[0] + 0.02, film.settle[0] + 0.08];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smoothstep 0 → 1 between a and b (a step when a === b). */
export const ramp = (p: number, a: number, b: number) => (b <= a ? (p >= b ? 1 : 0) : smooth(clamp01((p - a) / (b - a))));

/** Space kept free under the burger for the stage line, in px. */
export const FREE_MARGIN = 56;
