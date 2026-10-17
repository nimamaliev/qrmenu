/**
 * Shared WebGL stage for the concept previews: a transparent canvas (the page colour shows
 * through), soft studio light for the clay look, a camera that eases toward a position/target,
 * and a render loop that only runs while something changes and the canvas is on screen.
 */
import type * as T from "three";
import { buildRestaurant, type Look, type Palette, type Restaurant, type Stop } from "./restaurant";

export type Stage = {
  three: typeof T;
  restaurant: Restaurant;
  /** Where the camera should be; it eases there (or jumps, under reduced motion). */
  view: { pos: T.Vector3; target: T.Vector3 };
  setView: (stop: Stop) => void;
  /** Ask for a frame (call after changing the scene). */
  invalidate: () => void;
  /** Called after every rendered frame (e.g. to place HTML labels). */
  onFrame: (fn: () => void) => void;
  /** World point -> CSS pixels inside the canvas, for the current camera. */
  project: (x: number, y: number, z: number) => [number, number];
  dispose: () => void;
};

export async function createStage(el: HTMLElement, opts: { look: Look; palette: Palette; fov?: number }): Promise<Stage> {
  const THREE = await import("three");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (opts.look === "clay") {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
  }
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.5, 200);
  if (opts.look === "clay") {
    scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color(opts.palette.floor).multiplyScalar(0.85), 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(-9, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 10, bottom: -10, near: 1, far: 50 });
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 5;
    scene.add(sun);
  }

  const restaurant = await buildRestaurant(THREE, opts.palette, opts.look);
  scene.add(restaurant.root);

  const view = { pos: new THREE.Vector3(15, 14, 17), target: new THREE.Vector3() };
  const pos = view.pos.clone();
  const target = view.target.clone();
  camera.position.copy(pos);
  camera.lookAt(target);

  let dirty = true;
  let visible = false;
  let frameFn: (() => void) | undefined;
  const v3 = new THREE.Vector3();
  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 4.5);
    pos.lerp(view.pos, k);
    target.lerp(view.target, k);
    camera.position.copy(pos);
    camera.lookAt(target);
    renderer.render(scene, camera);
    frameFn?.();
    const moving = pos.distanceToSquared(view.pos) > 1e-5 || target.distanceToSquared(view.target) > 1e-5;
    if ((moving || dirty) && visible) raf = requestAnimationFrame(tick);
    dirty = false;
  };
  const invalidate = () => {
    dirty = true;
    if (!raf && visible) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  const resize = () => {
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) invalidate();
  });
  io.observe(el);
  resize();

  return {
    three: THREE,
    restaurant,
    view,
    setView: (stop) => {
      view.pos.set(...stop.pos);
      view.target.set(...stop.target);
      invalidate();
    },
    invalidate,
    onFrame: (fn) => (frameFn = fn),
    project: (x, y, z) => {
      v3.set(x, y, z).project(camera);
      return [((v3.x + 1) / 2) * el.clientWidth, ((1 - v3.y) / 2) * el.clientHeight];
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** Blend two camera stops (t in 0..1) for scroll-scrubbed moves. */
export function mixStops(a: Stop, b: Stop, t: number): Stop {
  const m = (x: number[], y: number[]) => x.map((v, i) => v + (y[i] - v) * t) as [number, number, number];
  return { pos: m(a.pos, b.pos), target: m(a.target, b.target) };
}
