"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * A QR code built as a little 3D table: dark modules are blocks of varied height, the burger
 * sits in the middle. Seen from the side it's a scene; as the camera rises to straight above,
 * the blocks settle flat and it reads as a real, scannable QR code (error correction H keeps
 * it readable with the burger covering the centre).
 * The view follows the section's scroll and a toggle; reduced motion starts from above.
 */

const PALETTE = ["#0d0c0b", "#1d1511", "#2b1a12", "#3b1f12", "#5c2212"]; // ink, crusts, deep tomato: all dark enough to scan
const PAPER = "#f2f0ec";
const HOLE = 4.6; // modules cleared around the centre for the burger (radius)

type Props = { url: string; labels: { toQr: string; to3d: string; hint: string } };

export default function QrScene({ url, labels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ setTarget: (t: number) => void; target: () => number } | null>(null);
  const [top, setTop] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
      if (disposed) return;

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
      const n = qr.modules.size;
      const c = (n - 1) / 2;
      const isDark = (x: number, y: number) => qr.modules.get(y, x) === 1;
      // keep finder patterns intact; clear a disc in the middle for the burger
      const inHole = (x: number, y: number) => Math.hypot(x - c, y - c) < HOLE;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(24, 1, 1, 400);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c7, 1.6));
      const sun = new THREE.DirectionalLight(0xfff3e6, 2.2);
      sun.position.set(-20, 46, 26);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const s = n * 0.75;
      Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 140 });
      sun.shadow.bias = -0.0004;
      sun.shadow.radius = 4;
      scene.add(sun);

      // The board: a paper slab with a quiet zone of two modules all round.
      const quiet = 2;
      const W = n + quiet * 2;
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(W, 1.6, W),
        [
          new THREE.MeshStandardMaterial({ color: "#d9d1c4", roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: "#d9d1c4", roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.95 }),
          new THREE.MeshStandardMaterial({ color: "#cfc6b8", roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: "#e3dbcf", roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: "#e3dbcf", roughness: 0.9 }),
        ],
      );
      slab.position.y = -0.8;
      slab.receiveShadow = true;
      scene.add(slab);

      // Dark modules: one instanced box mesh, each with its own colour and side-view height.
      const cells: { x: number; y: number; h: number; d: number }[] = [];
      const rand = mulberry(7);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) if (isDark(x, y) && !inHole(x, y)) cells.push({ x, y, h: 0.5 + rand() ** 2 * 2.6, d: rand() });
      const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }), cells.length);
      blocks.castShadow = blocks.receiveShadow = true;
      const col = new THREE.Color();
      cells.forEach((cell, i) => blocks.setColorAt(i, col.set(PALETTE[Math.floor(cell.d * PALETTE.length)])));
      scene.add(blocks);

      // Light modules: low paper tiles, so the board has a grid in the side view.
      const lights: { x: number; y: number }[] = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!isDark(x, y) && !inHole(x, y)) lights.push({ x, y });
      const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: "#fbfaf7", roughness: 0.9 }), lights.length);
      tiles.receiveShadow = true;
      const m = new THREE.Matrix4();
      lights.forEach((t, i) => tiles.setMatrixAt(i, m.makeTranslation(t.x - c, 0.06, t.y - c)));
      scene.add(tiles);

      // A round plate where the burger stands.
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(HOLE - 0.3, HOLE - 0.1, 0.35, 64), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35 }));
      plate.position.y = 0.17;
      plate.receiveShadow = true;
      scene.add(plate);

      const draco = new DRACOLoader().setDecoderPath("/draco/");
      const loader = new GLTFLoader().setDRACOLoader(draco);
      loader.load("/models/burger.glb", (gltf) => {
        if (disposed) return;
        const burger = gltf.scene;
        const box = new THREE.Box3().setFromObject(burger);
        const size = box.getSize(new THREE.Vector3());
        const k = ((HOLE - 0.9) * 2) / Math.max(size.x, size.z);
        burger.scale.setScalar(k);
        burger.position.set(-((box.min.x + box.max.x) / 2) * k, 0.35 - box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
        burger.traverse((o) => {
          if ((o as import("three").Mesh).isMesh) o.castShadow = o.receiveShadow = true;
        });
        scene.add(burger);
        dirty = true;
      });

      // View: t = 0 side, t = 1 straight above. Blocks settle flat and close their gaps as t -> 1.
      let t = reduced ? 1 : 0;
      let target = t;
      let shown = -1;
      let dirty = true;
      const place = () => {
        const e = smooth(t);
        cells.forEach((cell, i) => {
          const h = cell.h + (0.5 - cell.h) * e;
          const w = 0.9 + 0.1 * e;
          m.makeScale(w, h, w).setPosition(cell.x - c, h / 2, cell.y - c);
          blocks.setMatrixAt(i, m);
        });
        blocks.instanceMatrix.needsUpdate = true;
        const elev = (32 + 58 * e) * (Math.PI / 180);
        const az = (-38 + 38 * e) * (Math.PI / 180);
        const dist = n * (3.5 - 0.6 * e); // further out from the side, where the board is widest on screen
        camera.position.set(Math.sin(az) * Math.cos(elev) * dist, Math.sin(elev) * dist, Math.cos(az) * Math.cos(elev) * dist);
        camera.up.set(0, 1, 0);
        if (e > 0.999) camera.up.set(0, 0, -1); // keep the code upright when looking straight down
        camera.lookAt(0, 0, 0);
      };

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        dirty = true;
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      let raf = 0;
      let last = performance.now();
      let visible = false;
      const tick = (now: number) => {
        raf = visible ? requestAnimationFrame(tick) : 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += (target - t) * (reduced ? 1 : 1 - Math.exp(-dt * 3.2));
        if (Math.abs(target - t) < 1e-4) t = target;
        if (t !== shown || dirty) {
          place();
          renderer.render(scene, camera);
          shown = t;
          dirty = false;
        }
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      });
      io.observe(el);

      // Scroll drives the view (side -> above as the scene rises through the screen) until the
      // visitor takes over with a tap or the button.
      let manual = reduced;
      const onScroll = () => {
        if (manual) return;
        const r = el.getBoundingClientRect();
        const centre = (r.top + r.height / 2) / innerHeight; // 1 = bottom of the screen, 0 = top
        target = Math.min(1, Math.max(0, (0.85 - centre) / 0.4));
        setTop(target > 0.5);
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      api.current = {
        setTarget: (v) => {
          manual = true;
          target = v;
          setTop(v > 0.5);
          if (visible && !raf) {
            last = performance.now();
            raf = requestAnimationFrame(tick);
          }
        },
        target: () => target,
      };

      cleanup = () => {
        removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        draco.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [url]);

  const toggle = () => api.current?.setTarget(api.current.target() > 0.5 ? 0 : 1);

  return (
    <div className="flex flex-col items-center">
      <div ref={host} onClick={toggle} className="aspect-square w-full max-w-[34rem] cursor-pointer [&>canvas]:h-full [&>canvas]:w-full" />
      <button type="button" onClick={toggle} className="pill-ghost mt-4 h-11 px-5 text-sm">
        {top ? labels.to3d : labels.toQr}
      </button>
      <p className="mt-2 text-sm text-muted">{labels.hint}</p>
    </div>
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Small seeded random, so the skyline is the same on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
