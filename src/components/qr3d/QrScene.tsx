"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type * as T from "three";

/**
 * A tree that is a QR code (after the louisraille.fr reel the user shared). The board is a QR
 * code laid in paving stones; a tall tree stands on it. Its leaves are square plates that sit only
 * above the code's dark squares, so in the isometric side view it's a tree, and seen from straight above
 * (orthographic camera) the leaves land exactly on the dark squares and it scans. Dark squares
 * outside the canopy are grass. Tap (or scroll) to turn between the two; seasons recolour it.
 * Reduced motion starts from above and keeps still.
 */

type Season = "spring" | "summer" | "autumn";
type Palette = { leaves: string[]; grass: string[]; turf: string[]; stone: string[]; under: string; rain: boolean; deep: number };
const SEASONS: Record<Season, Palette> = {
  // leaf and turf colours are what the scanner sees from above, so they stay well darker than the stone
  autumn: { leaves: ["#ef9f3c", "#f4b450", "#e5873a", "#f6c264", "#dc7430"], grass: ["#e8b83c", "#dcaa2e", "#efc955"], turf: ["#8c6a1d", "#9a7a23", "#7c6a20"], stone: ["#eeebe5", "#e6e3dd", "#f3f1ec", "#dedbd5"], under: "#b8b4ad", rain: true, deep: 0.62 },
  spring: { leaves: ["#f2a9c0", "#f6bfd0", "#ec96b3", "#f8d3df", "#e486a8"], grass: ["#8cc65a", "#a3d36c", "#76b64a"], turf: ["#4f8a33", "#5a9638", "#457a2e"], stone: ["#efede8", "#e7e5df", "#f4f2ee", "#dfddd7"], under: "#b9b6b0", rain: false, deep: 0.74 },
  summer: { leaves: ["#5ea43d", "#74b74a", "#4b8f33", "#8bc55c", "#3f7f2c"], grass: ["#79b84a", "#8fc95a", "#67a540"], turf: ["#3f7428", "#4a802e", "#376626"], stone: ["#efede8", "#e7e5df", "#f4f2ee", "#dfddd7"], under: "#b9b6b0", rain: false, deep: 0.5 },
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
      const small = innerWidth < 768;
      const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
      const n = qr.modules.size;
      const c = (n - 1) / 2;
      const isDark = (x: number, y: number) => qr.modules.get(y, x) === 1;
      const rand = mulberry(5);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      // Orthographic: an isometric look from the side, and an exact plan view from above.
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d3c8, 1.9));
      const sun = new THREE.DirectionalLight(0xfff2e2, 2.0);
      sun.castShadow = true;
      sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
      const s = n * 1.3;
      Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 300 });
      sun.shadow.bias = -0.0005;
      scene.add(sun, sun.target);

      // Board: a stone slab; every module is a paving stone; quiet zone of three modules.
      const W = n + 6;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, W), new THREE.MeshStandardMaterial({ color: "#d9d5ce", roughness: 0.95 }));
      slab.position.y = -0.6;
      slab.receiveShadow = true;
      scene.add(slab);

      // The canopy's footprint: a ragged rounded square over the middle of the code. Dark squares
      // under it carry leaves; dark squares outside it (edges, finder corners) carry grass.
      const R = n * 0.43;
      const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      const reach = (x: number, y: number) => Math.pow((x - c) ** 4 + (y - c) ** 4, 0.25) / R;
      type Cell = { x: number; y: number; k: number };
      const stones: Cell[] = [];
      const turf: Cell[] = [];
      const canopyDark: Cell[] = [];
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const cell = { x, y, k: rand() };
          if (!isDark(x, y)) stones.push(cell);
          else if (!finder(x, y) && reach(x, y) < 1 - rand() * 0.12) canopyDark.push(cell);
          else turf.push(cell);
        }
      // quiet-zone stones round the code
      for (let y = -3; y < n + 3; y++) for (let x = -3; x < n + 3; x++) if (x < 0 || y < 0 || x >= n || y >= n) stones.push({ x, y, k: rand() });

      const m4 = new THREE.Matrix4();
      const tileGeo = new THREE.BoxGeometry(0.94, 0.3, 0.94);
      const stoneMesh = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), stones.length);
      stones.forEach((t, i) => stoneMesh.setMatrixAt(i, m4.makeTranslation(t.x - c, 0.15, t.y - c)));
      stoneMesh.receiveShadow = true;
      const underMesh = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), canopyDark.length);
      canopyDark.forEach((t, i) => underMesh.setMatrixAt(i, m4.makeTranslation(t.x - c, 0.15, t.y - c)));
      underMesh.receiveShadow = true;
      const turfMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.34, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), turf.length);
      turf.forEach((t, i) => turfMesh.setMatrixAt(i, m4.makeTranslation(t.x - c, 0.17, t.y - c)));
      turfMesh.receiveShadow = true;
      scene.add(stoneMesh, underMesh, turfMesh);

      // Tall grass tufts on the dark squares outside the canopy.
      const bladeGeo = new THREE.ConeGeometry(0.1, 1, 4, 1);
      bladeGeo.translate(0, 0.5, 0);
      const blades = turf.flatMap((t) => Array.from({ length: small ? 6 : 8 }, () => ({ x: t.x - c + (rand() - 0.5) * 0.8, z: t.y - c + (rand() - 0.5) * 0.8, h: 0.8 + rand() * 1.3, lean: (rand() - 0.5) * 0.8, turn: rand() * 6, k: rand() })));
      const bladeMesh = new THREE.InstancedMesh(bladeGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), blades.length);
      bladeMesh.castShadow = true;
      scene.add(bladeMesh);

      // The tree: a trunk and branches (thin cylinders), and leaf plates stacked only above dark squares.
      const tree = new THREE.Group();
      const Ht = n * 1.3; // top of the crown
      const limbs: { a: T.Vector3; b: T.Vector3; r: number }[] = [];
      const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
      const trunkTop = Ht * 0.62;
      limbs.push({ a: V(0, 0, 0), b: V(0.3, trunkTop * 0.5, -0.2), r: 1.25 }, { a: V(0.3, trunkTop * 0.5, -0.2), b: V(-0.2, trunkTop, 0.3), r: 0.85 });
      for (let k = 0; k < 9; k++) {
        const ang = (k / 9) * Math.PI * 2 + rand() * 0.5;
        const y0 = Ht * (0.3 + 0.32 * (k / 9) + rand() * 0.05);
        const out = R * (0.55 + rand() * 0.4);
        const root = V(0, y0, 0);
        const mid = V(Math.cos(ang) * out * 0.5, y0 + Ht * 0.16, Math.sin(ang) * out * 0.5);
        const end = V(Math.cos(ang) * out, Math.min(Ht * 0.92, y0 + Ht * (0.3 + rand() * 0.12)), Math.sin(ang) * out);
        limbs.push({ a: root, b: mid, r: 0.42 }, { a: mid, b: end, r: 0.26 });
        for (let j = 0; j < 2; j++) {
          const side = ang + (j ? 0.8 : -0.8) + (rand() - 0.5) * 0.4;
          const tip = mid.clone().add(V(Math.cos(side) * R * 0.35, Ht * (0.12 + rand() * 0.1), Math.sin(side) * R * 0.35));
          limbs.push({ a: mid, b: tip, r: 0.18 });
        }
      }
      const limbGeo = new THREE.CylinderGeometry(0.7, 1, 1, 6, 1);
      limbGeo.translate(0, 0.5, 0);
      const limbMesh = new THREE.InstancedMesh(limbGeo, new THREE.MeshStandardMaterial({ color: "#5c3a26", roughness: 0.9 }), limbs.length);
      const yAxis = V(0, 1, 0);
      const dir = V(0, 0, 0);
      const quat = new THREE.Quaternion();
      limbs.forEach((l, i) => {
        dir.subVectors(l.b, l.a);
        const len = dir.length();
        quat.setFromUnitVectors(yAxis, dir.normalize());
        m4.compose(l.a, quat, V(l.r, len, l.r));
        limbMesh.setMatrixAt(i, m4);
      });
      limbMesh.castShadow = true;
      tree.add(limbMesh);

      // Leaves: thin square plates, sparse up each column (so the branches show through) with one
      // plate always at the column's top. They lie flat and full-size as we reach the plan view.
      const leaves: { x: number; y: number; z: number; s: number; rx: number; rz: number; k: number; ph: number }[] = [];
      canopyDark.forEach((t) => {
        const q = Math.min(1, reach(t.x, t.y));
        const top = Ht * (1 - 0.2 * q * q) + (rand() - 0.5) * 3;
        const bottom = Ht * (0.36 + 0.24 * q * q) + rand() * 2;
        const leaf = (y: number, s: number) => leaves.push({ x: t.x - c, y, z: t.y - c, s, rx: (rand() - 0.5) * 1.1, rz: (rand() - 0.5) * 1.1, k: rand(), ph: rand() * 6 });
        leaf(top, 1);
        for (let y = bottom; y < top - 1; y += 1) {
          const clump = 0.5 + 0.5 * Math.sin(t.x * 0.55 + y * 0.35) * Math.sin(t.y * 0.5 - y * 0.3);
          if (rand() < 0.1 + 0.32 * clump) leaf(y, 0.75 + rand() * 0.25);
        }
      });
      // The plate's top face gets its own material, so leaves can deepen from above (where the scanner looks).
      const leafSide = new THREE.MeshStandardMaterial({ roughness: 0.8 });
      const leafTop = new THREE.MeshStandardMaterial({ roughness: 0.8 });
      const leafMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.2, 1), [leafSide, leafSide, leafTop, leafSide, leafSide, leafSide], leaves.length);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      scene.add(leafMesh);
      // Fallen leaves all over the paving; the ones on light squares are swept away for the code.
      const fallen = [...stones, ...canopyDark]
        .filter((t) => t.x >= 0 && t.y >= 0 && t.x < n && t.y < n && rand() < 0.16)
        .map((t) => ({ x: t.x - c + (rand() - 0.5) * 0.4, z: t.y - c + (rand() - 0.5) * 0.4, r: rand() * 3, k: rand(), light: !isDark(t.x, t.y) }));
      const fallenMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.06, 0.45), new THREE.MeshStandardMaterial({ roughness: 0.8 }), fallen.length);
      scene.add(fallenMesh);
      // Leaves drifting down, and autumn rain.
      const DRIFT = 26;
      const drift = Array.from({ length: DRIFT }, () => ({ x: (rand() - 0.5) * n * 0.9, z: (rand() - 0.5) * n * 0.9, y0: Ht * (0.4 + rand() * 0.5), ph: rand(), sp: 0.05 + rand() * 0.05, k: rand() }));
      const driftMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), DRIFT);
      tree.add(driftMesh);
      const RAIN = small ? 70 : 140;
      const rain = Array.from({ length: RAIN }, () => ({ x: (rand() - 0.5) * W * 1.6, z: (rand() - 0.5) * W * 1.6, ph: rand(), sp: 0.5 + rand() * 0.4 }));
      const rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 3.2, 0.06), new THREE.MeshBasicMaterial({ color: "#9a968f", transparent: true, opacity: 0.35 }), RAIN);
      scene.add(rainMesh, tree);

      const col = new THREE.Color();
      let deep = SEASONS.autumn.deep;
      const pick = (list: string[], k: number) => list[Math.floor(k * list.length) % list.length];
      const paint = (p: Palette) => {
        stones.forEach((t, i) => stoneMesh.setColorAt(i, col.set(pick(p.stone, t.k))));
        canopyDark.forEach((_, i) => underMesh.setColorAt(i, col.set(p.under)));
        turf.forEach((t, i) => turfMesh.setColorAt(i, col.set(pick(p.turf, t.k))));
        blades.forEach((b, i) => bladeMesh.setColorAt(i, col.set(pick(p.grass, b.k))));
        leaves.forEach((l, i) => leafMesh.setColorAt(i, col.set(pick(p.leaves, l.k))));
        fallen.forEach((f, i) => fallenMesh.setColorAt(i, col.set(pick(p.leaves, f.k))));
        drift.forEach((f, i) => driftMesh.setColorAt(i, col.set(pick(p.leaves, f.k))));
        [stoneMesh, underMesh, turfMesh, bladeMesh, leafMesh, fallenMesh, driftMesh].forEach((im) => im.instanceColor && (im.instanceColor.needsUpdate = true));
        rainMesh.visible = p.rain;
        deep = p.deep;
      };
      paint(SEASONS.autumn);

      // t = 0 isometric side view, 1 straight above.
      let t = reduced ? 1 : 0;
      let target = t;
      let manual = reduced;
      let clock = 0;
      const obj = new THREE.Object3D();
      const v3 = new THREE.Vector3();
      const place = () => {
        const e = smooth(t);
        const still = reduced || e > 0.97;
        // grass lies down and branches/drift/rain clear away as we reach the plan view
        const grow = 1 - smooth(Math.min(1, e * 1.15));
        blades.forEach((b, i) => {
          const sway = still ? 0 : Math.sin(clock * 1.5 + b.x * 0.5 + b.z * 0.3) * 0.1 * grow;
          obj.position.set(b.x, 0.34, b.z);
          obj.rotation.set(b.lean * grow + sway, b.turn, b.lean * 0.4 * grow);
          const h = Math.max(0.0001, b.h * grow);
          obj.scale.set(grow > 0.02 ? 1 : 0.0001, h, grow > 0.02 ? 1 : 0.0001);
          obj.updateMatrix();
          bladeMesh.setMatrixAt(i, obj.matrix);
        });
        bladeMesh.instanceMatrix.needsUpdate = true;
        const flat = 1 - smooth(Math.min(1, e * 1.3));
        leaves.forEach((l, i) => {
          const w = still ? 0 : Math.sin(clock * 1.2 + l.ph) * 0.08 * (1 - e);
          obj.position.set(l.x, l.y, l.z);
          obj.rotation.set(l.rx * flat + w, 0, l.rz * flat + w * 0.7);
          const s = l.s + (1 - l.s) * e;
          obj.scale.set(s * 0.97, 1, s * 0.97);
          obj.updateMatrix();
          leafMesh.setMatrixAt(i, obj.matrix);
        });
        leafMesh.instanceMatrix.needsUpdate = true;
        fallen.forEach((f, i) => {
          obj.position.set(f.x, 0.33, f.z);
          obj.rotation.set(0, f.r, 0);
          obj.scale.setScalar(f.light ? Math.max(0.0001, 1 - smooth(Math.min(1, e * 1.6))) : 1);
          obj.updateMatrix();
          fallenMesh.setMatrixAt(i, obj.matrix);
        });
        fallenMesh.instanceMatrix.needsUpdate = true;
        tree.visible = e < 0.9;
        drift.forEach((f, i) => {
          const k = (f.ph + clock * f.sp) % 1;
          obj.position.set(f.x + Math.sin(k * 8 + f.ph * 5) * 1.2, f.y0 * (1 - k) + 0.5, f.z + Math.cos(k * 6) * 0.9);
          obj.rotation.set(k * 11, k * 6 + f.ph, k * 4);
          obj.scale.setScalar(k > 0.96 || e > 0.6 ? 0.0001 : 1);
          obj.updateMatrix();
          driftMesh.setMatrixAt(i, obj.matrix);
        });
        driftMesh.instanceMatrix.needsUpdate = true;
        rain.forEach((r, i) => {
          const k = (r.ph + clock * r.sp) % 1;
          obj.position.set(r.x, (1 - k) * Ht * 1.6 - 2, r.z);
          obj.rotation.set(0, 0, 0);
          obj.scale.setScalar(e > 0.5 || k > 0.97 ? 0.0001 : 1);
          obj.updateMatrix();
          rainMesh.setMatrixAt(i, obj.matrix);
        });
        rainMesh.instanceMatrix.needsUpdate = true;
        // leaf tops deepen toward the plan view, so the code reads with good contrast
        leafTop.color.setScalar(1 - deep * e);
        leafSide.color.setScalar(1 - 0.2 * e);
        // the sun swings overhead, so from above every shadow falls on its own dark square
        const se = (40 + 50 * e) * (Math.PI / 180);
        sun.position.set(-Math.cos(se) * 60, Math.sin(se) * 80 + 5, Math.cos(se) * 40);
        // camera: isometric (45°, 32°) -> plan view, turning a quarter on the way
        const elev = (32 + 58 * e) * (Math.PI / 180);
        const az = (45 - 45 * e) * (Math.PI / 180);
        camera.position.set(Math.sin(az) * Math.cos(elev) * 400, Math.sin(elev) * 400, Math.cos(az) * Math.cos(elev) * 400);
        camera.up.set(0, 1, 0);
        if (e > 0.999) camera.up.set(0, 0, -1); // keep the code upright when looking straight down
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        // frame the board and the tree (while it stands) in whatever shape the canvas has
        const h = Ht * (1 - smooth(Math.min(1, Math.max(0, (e - 0.6) / 0.35))));
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const sx of [-1, 1])
          for (const sz of [-1, 1])
            for (const y of [-1.2, h]) {
              v3.set((sx * W) / 2, y, (sz * W) / 2).applyMatrix4(camera.matrixWorldInverse);
              x0 = Math.min(x0, v3.x);
              x1 = Math.max(x1, v3.x);
              y0 = Math.min(y0, v3.y);
              y1 = Math.max(y1, v3.y);
            }
        const aspect = el.clientWidth / Math.max(1, el.clientHeight);
        const half = Math.max((y1 - y0) / 2, (x1 - x0) / 2 / aspect) * 1.04;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        camera.left = cx - half * aspect;
        camera.right = cx + half * aspect;
        camera.top = cy + half;
        camera.bottom = cy - half;
        camera.updateProjectionMatrix();
      };

      let dirty = true;
      const resize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight, false);
        dirty = true;
        run();
      };
      const ro = new ResizeObserver(resize);

      let raf = 0;
      let last = performance.now();
      let visible = false;
      const tick = (now: number) => {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const before = t;
        t += (target - t) * (reduced ? 1 : 1 - Math.exp(-dt * 3.2));
        if (Math.abs(target - t) < 1e-4) t = target;
        const alive = !reduced && t < 0.97; // wind, drifting leaves and rain until it's a code
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
      ro.observe(el);
      io.observe(el);

      // Scroll turns it as the board rises through the screen, until the visitor taps.
      const onScroll = () => {
        if (manual) return;
        const r = el.getBoundingClientRect();
        const centre = (r.top + r.height / 2) / innerHeight;
        target = Math.min(1, Math.max(0, (0.75 - centre) / 0.35));
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
        season: (name) => {
          paint(SEASONS[name]);
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

  const choose = (s: Season) => {
    setSeason(s);
    api.current?.season(s);
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={host} onClick={() => api.current?.toggle()} className="aspect-[4/5] w-full max-w-[36rem] cursor-pointer [&>canvas]:h-full [&>canvas]:w-full" />
      <button type="button" onClick={() => api.current?.toggle()} className="mt-3 rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-muted">
        {top ? labels.to3d : labels.toQr}
      </button>
      <div role="radiogroup" className="mt-4 grid w-full max-w-[28rem] grid-cols-3 gap-2">
        {(["spring", "summer", "autumn"] as Season[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={season === s}
            onClick={() => choose(s)}
            className="rounded-xl border border-line px-4 py-2 text-sm transition-colors aria-checked:border-transparent aria-checked:bg-[#efe3d4]"
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

/** Small seeded random, so the tree grows the same on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
