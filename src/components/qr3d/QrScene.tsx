"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * A QR code grown as a little garden (after the louisraille.fr reel the user shared): each
 * dark module is a tuft of grass on a coloured tile, a tree stands in the middle. Seen from
 * the side it's a scene; as the camera rises to straight above, the tree shrinks away and the
 * grass settles onto its tiles, which read as a real, scannable QR code.
 * The view follows the scroll and a tap; seasons recolour it. Reduced motion starts from above.
 */

type Season = "spring" | "summer" | "autumn";
const SEASONS: Record<Season, { tiles: string[]; grass: string[]; leaves: string[]; light: string }> = {
  // tile colours are what the scanner sees: all dark enough against the cream ground
  spring: { tiles: ["#2a5f33", "#336c38", "#244f33", "#3a6a2c"], grass: ["#6fae4a", "#8cc35a", "#5c9a3e"], leaves: ["#f4a6c0", "#f7c6d5", "#fbe3ea", "#e98aac"], light: "#f6f1e6" },
  summer: { tiles: ["#2e5e27", "#3d6f2c", "#24502a", "#4a6a24"], grass: ["#5d9a35", "#79b345", "#4f8a2f"], leaves: ["#4f8f36", "#68a83f", "#3f7a2e", "#86b84c"], light: "#f5f0e4" },
  autumn: { tiles: ["#a8441b", "#b8581c", "#7c5418", "#6a6420"], grass: ["#e3a62f", "#d48b23", "#c9b03b"], leaves: ["#f0a030", "#e8822a", "#f6b94a", "#d9661f"], light: "#f4eee1" },
};

type Props = { url: string; labels: { toQr: string; to3d: string; seasons: Record<Season, string> } };

export default function QrScene({ url, labels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ toggle: () => void; season: (s: Season) => void } | null>(null);
  const [top, setTop] = useState(false);
  const [season, setSeason] = useState<Season>("autumn");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
      const n = qr.modules.size;
      const c = (n - 1) / 2;
      const isDark = (x: number, y: number) => qr.modules.get(y, x) === 1;
      const rand = mulberry(11);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(22, 1, 1, 500);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c2, 1.7));
      const sun = new THREE.DirectionalLight(0xfff1df, 2.3);
      sun.position.set(-24, 50, 30);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const sz = n * 0.8;
      Object.assign(sun.shadow.camera, { left: -sz, right: sz, top: sz, bottom: -sz, near: 1, far: 160 });
      sun.shadow.bias = -0.0004;
      scene.add(sun);

      // Board: a grey slab with a cream top and a quiet zone of two modules.
      const W = n + 4;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 1.6, W), new THREE.MeshStandardMaterial({ color: "#d7d2ca", roughness: 0.95 }));
      slab.position.y = -0.8;
      slab.receiveShadow = true;
      scene.add(slab);
      const groundMat = new THREE.MeshStandardMaterial({ color: SEASONS.autumn.light, roughness: 0.95 });
      const ground = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, 0.06, W - 0.02), groundMat);
      ground.position.y = 0.03;
      ground.receiveShadow = true;
      scene.add(ground);

      // Dark modules: a coloured tile each, and a tuft of grass blades on top.
      const darks: { x: number; y: number; t: number }[] = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (isDark(x, y)) darks.push({ x, y, t: rand() });
      const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.12, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), darks.length);
      tiles.receiveShadow = true;
      const m4 = new THREE.Matrix4();
      darks.forEach((d, i) => tiles.setMatrixAt(i, m4.makeTranslation(d.x - c, 0.1, d.y - c)));
      scene.add(tiles);

      const BLADES = 4;
      const bladeGeo = new THREE.ConeGeometry(0.075, 1, 4, 1);
      bladeGeo.translate(0, 0.5, 0);
      const blades = new THREE.InstancedMesh(bladeGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), darks.length * BLADES);
      blades.castShadow = true;
      const bladeData = darks.flatMap((d) =>
        Array.from({ length: BLADES }, () => ({ x: d.x - c + (rand() - 0.5) * 0.7, z: d.y - c + (rand() - 0.5) * 0.7, h: 0.55 + rand() * 0.9, lean: (rand() - 0.5) * 0.5, turn: rand() * Math.PI, t: rand() })),
      );
      scene.add(blades);

      // The tree: trunk, branches and leaf clusters, plus a few leaves drifting down.
      const tree = new THREE.Group();
      const bark = new THREE.MeshStandardMaterial({ color: "#6b4a33", roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.75, 7, 10), bark);
      trunk.position.y = 3.5;
      trunk.castShadow = true;
      tree.add(trunk);
      const tips: InstanceType<typeof THREE.Vector3>[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + rand() * 0.5;
        const len = 2.6 + rand() * 1.4;
        const base = new THREE.Vector3(0, 4.6 + rand() * 1.8, 0);
        const dir = new THREE.Vector3(Math.cos(a), 0.9 + rand() * 0.5, Math.sin(a)).normalize();
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, len, 6), bark);
        br.position.copy(base).addScaledVector(dir, len / 2);
        br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        br.castShadow = true;
        tree.add(br);
        tips.push(base.clone().addScaledVector(dir, len));
      }
      tips.push(new THREE.Vector3(0, 8.4, 0));
      const LEAVES = 900;
      const leafGeo = new THREE.IcosahedronGeometry(0.34, 0);
      const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }), LEAVES);
      leaves.castShadow = true;
      const leafData = Array.from({ length: LEAVES }, (_, i) => {
        const tip = tips[i % tips.length];
        const r = 1.9 * Math.cbrt(rand());
        const th = rand() * Math.PI * 2;
        const ph = Math.acos(2 * rand() - 1);
        return { p: new THREE.Vector3(tip.x + r * Math.sin(ph) * Math.cos(th), tip.y + r * Math.cos(ph) * 0.75, tip.z + r * Math.sin(ph) * Math.sin(th)), s: 0.6 + rand() * 0.7, t: rand(), rot: rand() * 6 };
      });
      tree.add(leaves);
      const FALL = 40;
      const falling = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.35, 0.25), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), FALL);
      const fallData = Array.from({ length: FALL }, () => ({ x: (rand() - 0.5) * 9, z: (rand() - 0.5) * 9, y0: 6 + rand() * 4, phase: rand(), speed: 0.06 + rand() * 0.05, t: rand() }));
      tree.add(falling);
      scene.add(tree);

      const col = new THREE.Color();
      const paint = (s: Season) => {
        const pal = SEASONS[s];
        groundMat.color.set(pal.light);
        darks.forEach((d, i) => tiles.setColorAt(i, col.set(pal.tiles[Math.floor(d.t * pal.tiles.length)])));
        bladeData.forEach((b, i) => blades.setColorAt(i, col.set(pal.grass[Math.floor(b.t * pal.grass.length)])));
        leafData.forEach((l, i) => leaves.setColorAt(i, col.set(pal.leaves[Math.floor(l.t * pal.leaves.length)])));
        fallData.forEach((l, i) => falling.setColorAt(i, col.set(pal.leaves[Math.floor(l.t * pal.leaves.length)])));
        [tiles, blades, leaves, falling].forEach((im) => im.instanceColor && (im.instanceColor.needsUpdate = true));
      };
      paint("autumn");

      // t = 0 side view, 1 straight above.
      let t = reduced ? 1 : 0;
      let target = t;
      let manual = reduced;
      let clock = 0;
      const obj = new THREE.Object3D();
      const place = () => {
        const e = smooth(t);
        const grow = 1 - smooth(Math.min(1, e * 1.1)); // grass settles fully into its tile, so the code is clean from above
        bladeData.forEach((b, i) => {
          const sway = reduced ? 0 : Math.sin(clock * 1.6 + b.x * 0.6 + b.z * 0.4) * 0.08 * grow;
          obj.position.set(b.x, 0.16, b.z);
          obj.rotation.set(b.lean * grow + sway, b.turn, b.lean * 0.5 * grow);
          obj.scale.set(grow > 0.01 ? 1 : 0.0001, Math.max(0.0001, b.h * grow), grow > 0.01 ? 1 : 0.0001);
          obj.updateMatrix();
          blades.setMatrixAt(i, obj.matrix);
        });
        blades.instanceMatrix.needsUpdate = true;
        const ts = Math.max(0.0001, 1 - smooth(Math.min(1, e * 1.25)));
        tree.scale.setScalar(ts);
        tree.visible = ts > 0.002;
        leafData.forEach((l, i) => {
          const w = reduced ? 0 : Math.sin(clock * 1.3 + l.rot) * 0.06;
          obj.position.copy(l.p);
          obj.rotation.set(l.rot + w, l.rot * 0.7, w);
          obj.scale.setScalar(l.s);
          obj.updateMatrix();
          leaves.setMatrixAt(i, obj.matrix);
        });
        leaves.instanceMatrix.needsUpdate = true;
        fallData.forEach((l, i) => {
          const k = (l.phase + clock * l.speed) % 1;
          obj.position.set(l.x + Math.sin(k * 9 + l.phase * 6) * 0.8, l.y0 * (1 - k) + 0.2, l.z + Math.cos(k * 7) * 0.6);
          obj.rotation.set(k * 12, k * 7 + l.phase, k * 5);
          obj.scale.setScalar(k > 0.97 ? 0.001 : 1);
          obj.updateMatrix();
          falling.setMatrixAt(i, obj.matrix);
        });
        falling.instanceMatrix.needsUpdate = true;
        const elev = (30 + 60 * e) * (Math.PI / 180);
        const az = (45 - 45 * e) * (Math.PI / 180);
        const dist = n * (3.6 - 0.75 * e);
        camera.position.set(Math.sin(az) * Math.cos(elev) * dist, Math.sin(elev) * dist + 2 * (1 - e), Math.cos(az) * Math.cos(elev) * dist);
        camera.up.set(0, 1, 0);
        if (e > 0.999) camera.up.set(0, 0, -1); // keep the code upright when looking straight down
        camera.lookAt(0, 2.2 * (1 - e), 0);
      };

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        dirty = true;
      };
      let dirty = true;
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      let raf = 0;
      let last = performance.now();
      let visible = false;
      const tick = (now: number) => {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const before = t;
        t += (target - t) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
        if (Math.abs(target - t) < 1e-4) t = target;
        const alive = !reduced && t < 0.98; // the garden moves (wind, falling leaves) until it's a code
        if (alive) clock += dt;
        if (t !== before || alive || dirty) {
          place();
          renderer.render(scene, camera);
          dirty = false;
        }
        if (visible && (alive || t !== target)) raf = requestAnimationFrame(tick);
      };
      const run = () => {
        if (!raf && visible) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          dirty = true;
          run();
        }
      });
      io.observe(el);

      // Scroll lifts the camera as the board rises through the screen, until the visitor taps.
      const onScroll = () => {
        if (manual) return;
        const r = el.getBoundingClientRect();
        const centre = (r.top + r.height / 2) / innerHeight;
        target = Math.min(1, Math.max(0, (0.8 - centre) / 0.4));
        setTop(target > 0.5);
        run();
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      api.current = {
        toggle: () => {
          manual = true;
          target = target > 0.5 ? 0 : 1;
          setTop(target > 0.5);
          run();
        },
        season: (s) => {
          paint(s);
          dirty = true;
          run();
        },
      };

      cleanup = () => {
        removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [url]);

  const pick = (s: Season) => {
    setSeason(s);
    api.current?.season(s);
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={host} onClick={() => api.current?.toggle()} className="aspect-square w-full max-w-[36rem] cursor-pointer [&>canvas]:h-full [&>canvas]:w-full" />
      <button type="button" onClick={() => api.current?.toggle()} className="mt-3 rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-muted">
        {top ? labels.to3d : labels.toQr}
      </button>
      <div role="radiogroup" className="mt-4 flex gap-2">
        {(Object.keys(SEASONS) as Season[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={season === s}
            onClick={() => pick(s)}
            className="rounded-xl border border-line px-5 py-2 text-sm transition-colors aria-checked:border-transparent aria-checked:bg-[#efe3d4]"
          >
            {labels.seasons[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Small seeded random, so the garden is the same on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
