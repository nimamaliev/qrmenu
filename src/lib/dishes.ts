export type Dish = {
  src: string;
  /** USDZ for iOS Quick Look. Without one, model-viewer generates it from the GLB. */
  iosSrc?: string;
  poster: string;
  cameraOrbit: string;
};

/**
 * The 3D dishes the site can show. Models are in metres, so AR places them at real size.
 * DEMO_DISH picks the one the QR code opens (/[lang]/demo).
 */
export const DISHES = {
  /** The hero film's burger as a real-time model (blender/burger.py, Draco-compressed, 11 cm). */
  burger: {
    src: "/models/burger.glb",
    poster: "/hero/d/000.webp",
    cameraOrbit: "-30deg 72deg auto",
  },
  /**
   * A real pizza scanned with a phone (Polycam), on a modelled 26 cm plate. The GLB keeps to
   * Scene Viewer's limits (no extensions, 2048 px texture); the USDZ passes Apple's ARKit checks.
   */
  pizza: {
    src: "/models/pizza.glb",
    iosSrc: "/models/pizza.usdz",
    poster: "/models/pizza-poster.webp",
    cameraOrbit: "35deg 55deg auto",
  },
} satisfies Record<string, Dish>;

export const DEMO_DISH: keyof typeof DISHES = "pizza";
