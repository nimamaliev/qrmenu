"use client";
/* eslint-disable react-hooks/immutability -- react-three-fiber animates by mutating three.js objects inside useFrame, outside React render. */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { STAGES, clamp01, range } from "./timeline";

/*
 * A Margherita assembled from code: every layer is procedural geometry plus a
 * canvas-generated texture, so there are no asset downloads. When the 3D team
 * delivers scanned layers (.glb), swap the matching component for a useGLTF mesh.
 */

type Progress = RefObject<number>;

// ---------- small math helpers ----------

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth periodic noise around a circle (integer frequencies keep it seamless). */
function ringNoise(seed: number) {
  const r = rng(seed);
  const waves = [2, 3, 5, 7, 11].map((k) => ({ k, phase: r() * Math.PI * 2, amp: 1 / k }));
  return (angle: number) => waves.reduce((sum, w) => sum + Math.sin(angle * w.k + w.phase) * w.amp, 0);
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
function easeOutBounce(t: number) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

/** Points scattered in a disc with a minimum spacing (simple rejection sampling). */
function scatter(seed: number, count: number, radius: number, minDist: number, avoid: THREE.Vector2[] = []) {
  const r = rng(seed);
  const pts: THREE.Vector2[] = [];
  for (let tries = 0; pts.length < count && tries < 4000; tries++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * radius;
    const p = new THREE.Vector2(Math.cos(a) * d, Math.sin(a) * d);
    if ([...pts, ...avoid].every((q) => q.distanceTo(p) > minDist)) pts.push(p);
  }
  return pts;
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, seed: number, count: number, colors: string[], maxR: number) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.beginPath();
    ctx.ellipse(r() * size, r() * size, r() * maxR + 0.5, r() * maxR + 0.5, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- colours (allocated once) ----------

const C = {
  doughRaw: new THREE.Color("#ecd9b2"),
  crustBaked: new THREE.Color("#d9a35a"),
  crustDeep: new THREE.Color("#a8642a"),
  sauceRaw: new THREE.Color("#ad291a"),
  sauceBaked: new THREE.Color("#8c1e11"),
  cheeseRaw: new THREE.Color("#f8f4ea"),
  cheeseBaked: new THREE.Color("#efd08a"),
  tomatoRaw: new THREE.Color("#e03a24"),
  tomatoBaked: new THREE.Color("#b52816"),
};
const tmp = new THREE.Color();

// ---------- layers ----------

function Board() {
  const map = useMemo(
    () =>
      canvasTexture(1024, (ctx, s) => {
        const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        g.addColorStop(0, "#7a4d2b");
        g.addColorStop(1, "#4a2c17");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, s, s);
        const r = rng(3);
        for (let ring = 6; ring < s / 2; ring += 5 + r() * 9) {
          ctx.strokeStyle = `rgba(40, 22, 10, ${0.12 + r() * 0.18})`;
          ctx.lineWidth = 1 + r() * 2.5;
          ctx.beginPath();
          ctx.ellipse(s / 2 + r() * 4, s / 2 + r() * 4, ring, ring * (0.97 + r() * 0.05), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        speckle(ctx, s, 4, 900, ["rgba(30,15,5,0.25)", "rgba(255,220,180,0.06)"], 1.6);
      }),
    [],
  );
  return (
    <group position={[0, -0.06, 0]}>
      <mesh>
        <cylinderGeometry args={[2.05, 2.05, 0.12, 96]} />
        <meshStandardMaterial map={map} roughness={0.75} />
      </mesh>
    </group>
  );
}

function Crust({ progress }: { progress: Progress }) {
  const group = useRef<THREE.Group>(null);
  const lastBake = useRef(-1);

  const { geometry, charAmount, rimAmount, speckles } = useMemo(() => {
    // Profile: underside → outer rim → puffy cornicione → flat centre (outward normals).
    const pts: THREE.Vector2[] = [new THREE.Vector2(0.001, 0), new THREE.Vector2(1.3, 0)];
    for (let i = 0; i <= 24; i++) {
      const theta = -Math.PI / 2 + (i / 24) * Math.PI * 1.5; // bottom → outer → top → inner
      pts.push(new THREE.Vector2(1.43 + Math.cos(theta) * 0.15, 0.1 + Math.sin(theta) * 0.11));
    }
    pts.push(new THREE.Vector2(1.18, 0.074), new THREE.Vector2(0.6, 0.07), new THREE.Vector2(0.001, 0.07));
    const geo = new THREE.LatheGeometry(pts, 160);

    const wobble = ringNoise(11);
    const lift = ringNoise(12);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const char = new Float32Array(pos.count);
    const rim = new Float32Array(pos.count);
    const r = rng(13);
    const spots = Array.from({ length: 46 }, () => ({ a: r() * Math.PI * 2, h: 0.12 + r() * 0.1, size: 0.03 + r() * 0.06 }));

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const radius = Math.hypot(x, z);
      const angle = Math.atan2(z, x);
      const rimness = clamp01((radius - 1.15) / 0.2);
      const scale = 1 + wobble(angle) * 0.022 * rimness;
      pos.setXYZ(i, x * scale, y + lift(angle) * 0.025 * rimness * clamp01(y / 0.1), z * scale);
      rim[i] = rimness * clamp01((y - 0.08) / 0.12);
      // Leopard spotting: dark blisters on the top of the rim.
      let c = 0;
      for (const s of spots) {
        const da = Math.atan2(Math.sin(angle - s.a), Math.cos(angle - s.a)) * 1.45;
        const d = Math.hypot(da, (y - s.h) * 1.4);
        c = Math.max(c, clamp01(1 - d / s.size));
      }
      char[i] = c * rimness;
    }
    geo.computeVertexNormals();
    // Planar UVs: the lathe's own UVs pinch into streaks at the centre.
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 3 + 0.5, pos.getZ(i) / 3 + 0.5);
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));

    const tex = canvasTexture(512, (ctx, s) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 14, 2600, ["rgba(120,80,40,0.10)", "rgba(90,60,30,0.08)", "rgba(255,255,255,0.5)"], 2.2);
      speckle(ctx, s, 15, 60, ["rgba(140,100,60,0.05)"], 40);
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return { geometry: geo, charAmount: char, rimAmount: rim, speckles: tex };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const bake = easeOut(range(p, STAGES.bake));
    // Recolour only while the bake value changes.
    if (Math.abs(bake - lastBake.current) > 0.002) {
      lastBake.current = bake;
      const colors = geometry.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < colors.count; i++) {
        tmp.lerpColors(C.crustBaked, C.crustDeep, rimAmount[i]);
        tmp.lerpColors(C.doughRaw, tmp, bake);
        tmp.multiplyScalar(1 - 0.78 * charAmount[i] * bake);
        colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
      }
      colors.needsUpdate = true;
    }
    // Dough ball stretched into a base.
    const stretch = easeOut(range(p, STAGES.dough));
    group.current?.scale.set(0.8 + 0.2 * stretch, 1.35 - 0.35 * stretch, 0.8 + 0.2 * stretch);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors map={speckles} roughness={0.82} />
      </mesh>
    </group>
  );
}

function Sauce({ progress }: { progress: Progress }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);

  const { geometry, map } = useMemo(() => {
    const geo = new THREE.CircleGeometry(1.2, 160, 0, Math.PI * 2);
    geo.rotateX(-Math.PI / 2);
    const edge = ringNoise(21);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const radius = Math.hypot(x, z) / 1.2;
      const k = 1 + edge(Math.atan2(z, x)) * 0.05 * radius;
      pos.setXYZ(i, x * k, 0.014 * (1 - radius * radius), z * k);
    }
    geo.computeVertexNormals();
    const tex = canvasTexture(512, (ctx, s) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, s, s);
      const r = rng(22);
      for (let i = 0; i < 160; i++) {
        const x = r() * s;
        const y = r() * s;
        const rad = 10 + r() * 50;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, r() > 0.5 ? "rgba(255,190,170,0.35)" : "rgba(90,0,0,0.25)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      speckle(ctx, s, 23, 500, ["rgba(70,0,0,0.45)", "rgba(255,120,90,0.4)", "rgba(40,70,20,0.35)"], 2.4);
    });
    return { geometry: geo, map: tex };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const s = easeOut(range(p, STAGES.sauce));
    if (!mesh.current || !material.current) return;
    mesh.current.visible = s > 0.002;
    mesh.current.scale.setScalar(Math.max(s, 0.001));
    mesh.current.rotation.y = (1 - s) * 1.6;
    material.current.color.lerpColors(C.sauceRaw, C.sauceBaked, range(p, STAGES.bake));
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[0, 0.072, 0]}>
      <meshPhysicalMaterial ref={material} map={map} roughness={0.45} clearcoat={0.45} clearcoatRoughness={0.35} />
    </mesh>
  );
}

function Cheese({ progress }: { progress: Progress }) {
  const pieces = useRef<(THREE.Mesh | null)[]>([]);
  // One material shared by every piece, so melting recolours them all at once.
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: C.cheeseRaw, roughness: 0.6, sheen: 0.4, sheenColor: "#fff6dd" }),
    [],
  );

  const { geometries, items } = useMemo(() => {
    const geometries = [31, 32, 33].map((seed) => {
      const geo = new THREE.IcosahedronGeometry(1, 5);
      const n1 = ringNoise(seed);
      const n2 = ringNoise(seed + 50);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.multiplyScalar(1 + n1(Math.atan2(v.z, v.x)) * 0.12 + n2(v.y * 3) * 0.06);
        if (v.y < 0) v.y *= 0.3; // flatter underside, without a hard crease
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    });
    const r = rng(34);
    const items = scatter(35, 11, 0.95, 0.45).map((p, i) => ({
      x: p.x,
      z: p.y,
      size: 0.13 + r() * 0.05,
      delay: (i / 11) * 0.62,
      spin: (r() - 0.5) * 6,
      rot: r() * Math.PI * 2,
      geo: i % 3,
    }));
    return { geometries, items };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const local = range(p, STAGES.cheese);
    const melt = easeOut(range(p, STAGES.bake));
    items.forEach((it, i) => {
      const m = pieces.current[i];
      if (!m) return;
      const t = clamp01((local - it.delay) / 0.38);
      m.visible = t > 0;
      m.position.y = 0.1 + (1 - easeOutBounce(t)) * 2.4 + 0.02 * (1 - melt);
      m.rotation.set((1 - t) * it.spin, it.rot, (1 - t) * it.spin * 0.5);
      const spread = 1 + 0.5 * melt;
      m.scale.set(it.size * spread, it.size * (0.42 - 0.2 * melt), it.size * spread);
    });
    material.color.lerpColors(C.cheeseRaw, C.cheeseBaked, melt);
    material.roughness = 0.6 - 0.3 * melt;
    material.clearcoat = 0.1 + 0.5 * melt;
  });

  return (
    <group>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(m) => {
            pieces.current[i] = m;
          }}
          geometry={geometries[it.geo]}
          material={material}
          position={[it.x, 0.1, it.z]}
          visible={false}
        />
      ))}
    </group>
  );
}

function Tomatoes({ progress }: { progress: Progress }) {
  const halves = useRef<(THREE.Group | null)[]>([]);
  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({ color: C.tomatoRaw, roughness: 0.25, clearcoat: 0.8 }), []);

  const { items, cutMap } = useMemo(() => {
    const r = rng(41);
    const items = scatter(42, 7, 0.95, 0.55).map((p, i) => ({
      x: p.x,
      z: p.y,
      delay: (i / 7) * 0.55,
      rot: r() * Math.PI * 2,
      size: 0.15 + r() * 0.03,
    }));
    const cutMap = canvasTexture(256, (ctx, s) => {
      const c = s / 2;
      const g = ctx.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, "#f7a07d");
      g.addColorStop(0.55, "#e2462c");
      g.addColorStop(0.92, "#c92a17");
      g.addColorStop(1, "#a51d0e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // Seed chambers with gel and seeds.
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4;
        const x = c + Math.cos(a) * s * 0.22;
        const y = c + Math.sin(a) * s * 0.22;
        ctx.fillStyle = "rgba(255, 210, 150, 0.55)";
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.13, s * 0.09, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f6dd8a";
        for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a + j) * s * 0.06, y + Math.sin(a + j) * s * 0.04, 5, 3, a + j, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    return { items, cutMap };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const local = range(p, STAGES.tomato);
    const roast = range(p, STAGES.bake);
    items.forEach((it, i) => {
      const g = halves.current[i];
      if (!g) return;
      const t = clamp01((local - it.delay) / 0.42);
      g.visible = t > 0;
      g.position.y = 0.19 + (1 - easeOutBounce(t)) * 2.2 - 0.04 * roast;
      g.rotation.set((1 - t) * 4, it.rot, 0);
      g.scale.setScalar(it.size * (1 - 0.1 * roast));
    });
    skin.color.lerpColors(C.tomatoRaw, C.tomatoBaked, roast);
  });

  return (
    <group>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(g) => {
            halves.current[i] = g;
          }}
          position={[it.x, 0.14, it.z]}
          visible={false}
        >
          <mesh rotation={[Math.PI, 0, 0]} scale={[1, 0.7, 1]} material={skin}>
            <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <circleGeometry args={[1, 32]} />
            <meshStandardMaterial map={cutMap} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Basil({ progress }: { progress: Progress }) {
  const leaves = useRef<(THREE.Mesh | null)[]>([]);

  const { geometry, items } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.6, 0.3, 0.5, 0.95, 0, 1.3);
    shape.bezierCurveTo(-0.5, 0.95, -0.6, 0.3, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 16);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Arch along the length, cup across the width.
      pos.setZ(i, 0.16 * Math.sin((Math.PI * y) / 1.3) + 0.35 * x * x);
    }
    geo.translate(0, -0.65, 0);
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    const r = rng(51);
    const items = scatter(52, 5, 0.75, 0.38).map((p, i) => ({
      x: p.x,
      z: p.y,
      delay: (i / 5) * 0.5,
      rot: r() * Math.PI * 2,
      size: 0.2 + r() * 0.06,
      flutter: 0.5 + r(),
    }));
    return { geometry: geo, items };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const local = range(p, STAGES.basil);
    items.forEach((it, i) => {
      const m = leaves.current[i];
      if (!m) return;
      const t = clamp01((local - it.delay) / 0.5);
      m.visible = t > 0;
      const fall = 1 - easeOut(t);
      m.position.set(it.x + Math.sin(t * 9 * it.flutter) * 0.15 * fall, 0.17 + fall * 1.8, it.z);
      m.rotation.set(Math.sin(t * 11) * 0.7 * fall, it.rot + fall * 2, Math.cos(t * 7) * 0.5 * fall);
      m.scale.setScalar(it.size);
    });
  });

  return (
    <group>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(m) => {
            leaves.current[i] = m;
          }}
          geometry={geometry}
          visible={false}
        >
          <meshPhysicalMaterial color="#2f6d26" roughness={0.4} clearcoat={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Flour({ progress }: { progress: Progress }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const r = rng(61);
    const arr = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.3 + r() * 2.2;
      arr.set([Math.cos(a) * d, r() * 1.6, Math.sin(a) * d], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const o = 0.55 * (1 - range(p, [0.1, 0.24]));
    if (material.current) material.current.opacity = o;
    if (points.current) {
      points.current.visible = o > 0.01;
      points.current.rotation.y = state.clock.elapsedTime * 0.04;
      points.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial ref={material} size={0.018} color="#fff4e2" transparent depthWrite={false} />
    </points>
  );
}

function OvenGlow({ progress }: { progress: Progress }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const g = Math.sin(Math.PI * range(progress.current ?? 0, STAGES.bake));
    if (light.current) light.current.intensity = g * 6;
  });
  return <pointLight ref={light} position={[0, 0.9, 0.4]} color="#ff7a2e" distance={6} intensity={0} />;
}

// ---------- camera, layout and the scene ----------

function Rig({ progress, smoothed }: { progress: Progress; smoothed: RefObject<number> }) {
  const { camera, size, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.08, 0), []);
  const state = useRef({ radius: 8, polar: 0.98, azimuth: -0.55 });
  const pizza = useRef<THREE.Group>(null);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    return () => {
      cam.clearViewOffset();
    };
  }, [camera]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 5);
    smoothed.current = (smoothed.current ?? 0) + ((progress.current ?? 0) - (smoothed.current ?? 0)) * k;
    const p = smoothed.current;
    const build = range(p, [0, 0.82]);
    const table = easeOut(range(p, STAGES.table));
    const narrow = size.width < 640 ? 1.55 : 1;
    const goal = {
      radius: (8 - 0.9 * build + 0.6 * table) * narrow,
      polar: 0.98 - 0.08 * build - 0.2 * table + pointer.y * 0.04,
      azimuth: -0.55 + 1.1 * build + 0.4 * table + pointer.x * 0.12,
    };
    const s = state.current;
    s.radius += (goal.radius - s.radius) * k;
    s.polar += (goal.polar - s.polar) * k;
    s.azimuth += (goal.azimuth - s.azimuth) * k;
    camera.position.setFromSphericalCoords(s.radius, s.polar, s.azimuth).add(target);
    camera.lookAt(target);
    // Desktop: pizza sits right of the copy. Mobile: starts below the headline, rises as the hero fades.
    const desktop = size.width >= 1024;
    const yShift = desktop ? 0 : size.height * (-0.22 + 0.27 * range(p, [0, 0.08]));
    (camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, desktop ? -size.width * 0.2 : 0, yShift, size.width, size.height);
    if (pizza.current) pizza.current.rotation.y += dt * 0.05;
  });

  return (
    <group ref={pizza}>
      <Crust progress={smoothed} />
      <Sauce progress={smoothed} />
      <Cheese progress={smoothed} />
      <Tomatoes progress={smoothed} />
      <Basil progress={smoothed} />
    </group>
  );
}

export default function PizzaScene({
  progress,
  fallback,
  staticFrame = false,
}: {
  progress: Progress;
  fallback: React.ReactNode;
  /** Reduced motion: render once, no animation loop. */
  staticFrame?: boolean;
}) {
  const smoothed = useRef(progress.current ?? 0);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      frameloop={staticFrame ? "demand" : "always"}
      camera={{ fov: 32, near: 0.1, far: 50, position: [0, 3, 4.5] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      fallback={fallback}
      aria-hidden="true"
    >
      <ambientLight intensity={0.25} />
      <hemisphereLight args={["#fff3e0", "#2a1a10", 0.55]} />
      <directionalLight position={[-3, 5, 2.5]} intensity={2.4} color="#ffe2b8" />
      <directionalLight position={[3, 2.5, -3]} intensity={1.1} color="#ffb98a" />
      <OvenGlow progress={smoothed} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.5} position={[-3, 4, 2]} scale={[4, 2, 1]} color="#fff1dc" />
        <Lightformer form="rect" intensity={1.2} position={[4, 2, -2]} scale={[3, 1.5, 1]} color="#ffc9a0" />
        <Lightformer form="ring" intensity={0.8} position={[0, 5, 0]} scale={3} color="#ffffff" />
      </Environment>
      <Board />
      <Flour progress={smoothed} />
      <Rig progress={progress} smoothed={smoothed} />
      <ContactShadows position={[0, -0.121, 0]} opacity={0.6} scale={7} blur={2.6} far={2} />
    </Canvas>
  );
}
