/**
 * The "QR -> restaurant" model for the floor story. A real QR code is laid out as floor tiles;
 * its dark squares then rise into a little restaurant: the three corner squares become rooms
 * (kitchen, bar, till), the timing rows become planters, and the rest become tables, with chairs
 * on the free squares beside them. Seen from straight above before anything rises, it scans.
 *
 * Everything is merged into a few meshes; one shader uniform (`rise`) grows each piece from the
 * floor in turn. The same meshes draw as soft clay or as a line drawing on paper (faces painted
 * in the page colour hide the edges behind them, like LightGearLab's "lines" view), and table
 * tops can take status colours for the dashboard. Analytics bars grow out of the tables.
 */
import type * as T from "three";
import QRCode from "qrcode";

export type FloorState = {
  rise: number; // 0 flat code .. 1 restaurant built
  line: number; // 0 clay .. 1 line drawing
  ink: string;
  paper: string;
  admin: number; // table tops take status colours
  bars: number; // analytics bars grow
  order: number; // table -> kitchen route drawn
  bill: number; // table -> till route drawn
};

export type Floor = {
  root: T.Group;
  /** Floor size in world units (code + quiet zone). */
  size: number;
  spots: { hero: T.Vector3; card: T.Vector3; kitchen: T.Vector3; bar: T.Vector3; till: T.Vector3 };
  /** Turn the hero table's menu card to face this azimuth (radians, 0 = +z). */
  faceCard: (theta: number) => void;
  set: (s: FloorState) => void;
};

const COLORS = {
  floor: "#ece6dc",
  tile: "#e1d9cc",
  wall: "#f7f3ec",
  counter: "#ddd4c6",
  steel: "#c3c6c4",
  dark: "#34302c",
  table: "#c79a6c",
  chair: "#ede4d6",
  leg: "#4a3f37",
  pot: "#c0643f",
  leaf: "#6f8f4e",
  card: "#fbfaf7",
  tomato: "#b83219",
  bottle: "#5d7a52",
};
// dashboard: 1 free, 2 eating, 3 waiting long, 4 paying
export const STATUS = ["#000000", "#d8d1c5", "#e7b24c", "#c8452c", "#6f9a68"];

const finderAt = (n: number) => [
  [0, 0],
  [n - 7, 0],
  [0, n - 7],
];

export function buildFloor(THREE: typeof T, merge: (g: T.BufferGeometry[]) => T.BufferGeometry, url: string): Floor {
  const qr = QRCode.create(url, { errorCorrectionLevel: "L" });
  const n = qr.modules.size;
  const c = (n - 1) / 2;
  const dark = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && qr.modules.get(y, x) === 1;
  const inFinderZone = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const W = (x: number) => x - c; // grid -> world
  const delayAt = (x: number, z: number) => Math.min(0.62, 0.04 + (Math.hypot(x, z) / (n * 0.72)) * 0.5 + rand() * 0.06);

  const fills: T.BufferGeometry[] = [];
  const edges: T.BufferGeometry[] = [];
  const hulls: T.BufferGeometry[] = [];
  const barFills: T.BufferGeometry[] = [];
  const barEdges: T.BufferGeometry[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const one = new THREE.Vector3(1, 1, 1);

  type Opt = { color: string; delay: number; at: [number, number, number]; yaw?: number; tilt?: number; status?: number; edge?: number | false; hull?: boolean; base?: number; bar?: boolean };
  const attr = (g: T.BufferGeometry, name: string, v: number) => g.setAttribute(name, new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(v), 1));
  const add = (src: T.BufferGeometry, o: Opt) => {
    q.setFromEuler(new THREE.Euler(o.tilt ?? 0, o.yaw ?? 0, 0, "YXZ"));
    m4.compose(new THREE.Vector3(...o.at), q, one);
    const g = (src.index ? src.toNonIndexed() : src.clone()).applyMatrix4(m4);
    g.deleteAttribute("uv");
    col.set(o.color);
    const cols = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < cols.length; i += 3) cols.set([col.r, col.g, col.b], i);
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    attr(g, "aDelay", o.delay);
    attr(g, "aStatus", o.status ?? 0);
    attr(g, "aBase", o.base ?? 0);
    (o.bar ? barFills : fills).push(g);
    if (o.edge !== false) {
      const e = new THREE.EdgesGeometry(src, o.edge ?? 20).applyMatrix4(m4);
      attr(e, "aDelay", o.delay);
      attr(e, "aBase", o.base ?? 0);
      (o.bar ? barEdges : edges).push(e);
    }
    if (o.hull) {
      const h = g.clone();
      h.deleteAttribute("color");
      h.deleteAttribute("aStatus");
      h.deleteAttribute("aBase");
      hulls.push(h);
    }
  };
  // shapes stand on y = 0
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const cyl = (rt: number, rb: number, h: number, seg = 18) => new THREE.CylinderGeometry(rt, rb, h, seg, 1).translate(0, h / 2, 0);

  // ---- floor: a slab, plus the code's dark squares as tiles that fade into the floor pattern
  const size = n + 4;
  add(box(size, 0.4, size).translate(0, -0.4, 0), { color: COLORS.floor, delay: -1, at: [0, 0, 0] });
  const tileGeos: T.BufferGeometry[] = [];
  const cellDelay = new Map<string, number>();
  const key = (x: number, y: number) => `${x},${y}`;
  const delayFor = (x: number, y: number) => {
    const k = key(x, y);
    if (!cellDelay.has(k)) cellDelay.set(k, delayAt(W(x), W(y)));
    return cellDelay.get(k)!;
  };

  // ---- rooms in the three finder squares: walls round the ring (with a door), a counter in the core
  const rooms = finderAt(n);
  const doors = [
    [6, 3],
    [n - 7, 3],
    [6, n - 4],
  ];
  const WALL_H = 1.15;
  const WALL_T = 0.62;
  rooms.forEach(([ox, oy], r) => {
    const [dx, dy] = doors[r];
    const d0 = delayFor(ox + 3, oy + 3);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) cellDelay.set(key(ox + i, oy + j), d0);
    // straight runs of wall, split at the door. Run ends reach the neighbouring wall's face
    // (cap); ends at the door stop at the door square's edge.
    const run = (cells: [number, number][], horiz: boolean, cap: number) => {
      let seg: [number, number][] = [];
      let startCap = cap;
      const flush = (endCap: number) => {
        if (seg.length) {
          const a = horiz ? seg[0][0] : seg[0][1];
          const b = horiz ? seg[seg.length - 1][0] : seg[seg.length - 1][1];
          const lo = a - startCap, hi = b + endCap;
          const at: [number, number, number] = horiz ? [W((lo + hi) / 2), 0, W(seg[0][1])] : [W(seg[0][0]), 0, W((lo + hi) / 2)];
          add(box(horiz ? hi - lo : WALL_T, WALL_H, horiz ? WALL_T : hi - lo), { color: COLORS.wall, delay: d0, at });
        }
        seg = [];
      };
      for (const cell of cells) {
        if (cell[0] === dx && cell[1] === dy) {
          flush(0.5);
          startCap = 0.5;
        } else seg.push(cell);
      }
      flush(cap);
    };
    run(Array.from({ length: 7 }, (_, i) => [ox + i, oy] as [number, number]), true, WALL_T / 2);
    run(Array.from({ length: 7 }, (_, i) => [ox + i, oy + 6] as [number, number]), true, WALL_T / 2);
    run(Array.from({ length: 5 }, (_, i) => [ox, oy + 1 + i] as [number, number]), false, 1 - WALL_T / 2);
    run(Array.from({ length: 5 }, (_, i) => [ox + 6, oy + 1 + i] as [number, number]), false, 1 - WALL_T / 2);
    const cx = W(ox + 3);
    const cz = W(oy + 3);
    const d1 = d0 + 0.04;
    if (r === 0) {
      // kitchen: a steel range with burners and two tomato-red pots
      add(box(2.8, 0.92, 2.8), { color: COLORS.steel, delay: d1, at: [cx, 0, cz] });
      for (const [bx, bz] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) add(cyl(0.34, 0.34, 0.04), { color: COLORS.dark, delay: d1, at: [cx + bx, 0.92, cz + bz], hull: true, edge: 30 });
      add(cyl(0.3, 0.28, 0.36), { color: COLORS.tomato, delay: d1 + 0.03, at: [cx - 0.65, 0.96, cz - 0.65], hull: true, edge: 30 });
      add(cyl(0.26, 0.26, 0.22), { color: COLORS.tomato, delay: d1 + 0.03, at: [cx + 0.65, 0.96, cz + 0.65], hull: true, edge: 30 });
    } else if (r === 1) {
      // bar: a counter with bottles, stools on the free ring inside the room
      add(box(2.8, 1.0, 2.8), { color: COLORS.table, delay: d1, at: [cx, 0, cz] });
      for (let k = 0; k < 6; k++) add(cyl(0.07, 0.09, 0.42, 10), { color: COLORS.bottle, delay: d1 + 0.03, at: [cx - 0.9 + k * 0.36, 1.0, cz - 0.9], hull: true, edge: 40 });
      for (const sx of [-1, 0, 1]) add(cyl(0.2, 0.16, 0.7, 14), { color: COLORS.leg, delay: d1 + 0.05, at: [cx + sx * 0.95, 0, cz + 2.05], hull: true, edge: 30 });
    } else {
      // till: counter, register and screen
      add(box(2.8, 0.95, 2.8), { color: COLORS.counter, delay: d1, at: [cx, 0, cz] });
      add(box(0.7, 0.32, 0.55), { color: COLORS.dark, delay: d1 + 0.03, at: [cx + 0.5, 0.95, cz] });
      add(box(0.62, 0.42, 0.05), { color: COLORS.dark, delay: d1 + 0.04, at: [cx + 0.5, 1.27, cz - 0.1], tilt: -0.3 });
      add(cyl(0.22, 0.17, 0.3), { color: COLORS.pot, delay: d1 + 0.03, at: [cx - 0.7, 0.95, cz - 0.6], hull: true, edge: 30 });
      add(new THREE.IcosahedronGeometry(0.32, 0), { color: COLORS.leaf, delay: d1 + 0.05, at: [cx - 0.7, 1.5, cz - 0.6] });
    }
  });

  // ---- the data area: planters on the timing rows, tables elsewhere
  const timing = (x: number, y: number) => (x === 6 || y === 6) && !inFinderZone(x, y);
  const used = new Set<string>();
  const chairsTaken = new Set<string>();
  type Table = { cells: [number, number][]; x: number; z: number; delay: number; status: number; round: boolean };
  const tables: Table[] = [];
  const plant = (x: number, y: number) => {
    const d = delayFor(x, y);
    add(cyl(0.3, 0.22, 0.42), { color: COLORS.pot, delay: d, at: [W(x), 0, W(y)], hull: true, edge: 30 });
    add(new THREE.IcosahedronGeometry(0.42, 0), { color: COLORS.leaf, delay: d + 0.03, at: [W(x), 0.42 + 0.34, W(y)], yaw: rand() * 3 });
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!dark(x, y) || inFinderZone(x, y) || used.has(key(x, y))) continue;
      if (timing(x, y)) {
        used.add(key(x, y));
        plant(x, y);
        continue;
      }
      const free = (a: number, b: number) => dark(a, b) && !inFinderZone(a, b) && !timing(a, b) && !used.has(key(a, b));
      const cells: [number, number][] = [[x, y]];
      if (free(x + 1, y)) cells.push([x + 1, y]);
      else if (free(x, y + 1)) cells.push([x, y + 1]);
      cells.forEach(([a, b]) => used.add(key(a, b)));
      const d = delayFor(x, y);
      cells.forEach(([a, b]) => cellDelay.set(key(a, b), d));
      if (cells.length === 1 && rand() < 0.5) {
        plant(x, y);
        continue;
      }
      const tx = W(cells.reduce((s, cc) => s + cc[0], 0) / cells.length);
      const tz = W(cells.reduce((s, cc) => s + cc[1], 0) / cells.length);
      const r = rand();
      tables.push({ cells, x: tx, z: tz, delay: d, status: r < 0.3 ? 1 : r < 0.68 ? 2 : r < 0.84 ? 3 : 4, round: cells.length === 1 });
    }

  const TOP = 0.76;
  // the hero table (front right of centre) gets its own readable menu card instead of a small one
  const pick = tables.filter((t) => !t.round).sort((a, b) => Math.hypot(a.x - c * 0.3, a.z - c * 0.35) - Math.hypot(b.x - c * 0.3, b.z - c * 0.35))[0] ?? tables[0];
  const hero = new THREE.Vector3(pick.x, TOP, pick.z);
  tables.forEach((t) => {
    const s = t.status;
    if (t.round) {
      add(cyl(0.42, 0.42, 0.06, 24), { color: COLORS.table, delay: t.delay, at: [t.x, TOP - 0.06, t.z], status: s, hull: true, edge: 30 });
      add(cyl(0.05, 0.05, TOP - 0.06, 8), { color: COLORS.leg, delay: t.delay, at: [t.x, 0, t.z], edge: false });
      add(cyl(0.22, 0.24, 0.03, 18), { color: COLORS.leg, delay: t.delay, at: [t.x, 0, t.z], hull: true, edge: 30 });
    } else {
      const horiz = t.cells[0][1] === t.cells[1][1];
      add(box(horiz ? 1.76 : 0.8, 0.06, horiz ? 0.8 : 1.76), { color: COLORS.table, delay: t.delay, at: [t.x, TOP - 0.06, t.z], status: s });
      for (const [a, b] of t.cells) {
        add(box(0.1, TOP - 0.06, 0.1), { color: COLORS.leg, delay: t.delay, at: [W(a), 0, W(b)] });
        add(box(0.4, 0.03, 0.4), { color: COLORS.leg, delay: t.delay, at: [W(a), 0, W(b)] });
      }
    }
    // a little QR card on every table
    const cy = rand() * Math.PI;
    if (t !== pick) for (const sgn of [-1, 1]) add(box(0.2, 0.15, 0.012), { color: COLORS.card, delay: t.delay + 0.04, at: [t.x + Math.sin(cy) * sgn * 0.035, TOP, t.z + Math.cos(cy) * sgn * 0.035], yaw: cy, tilt: sgn * 0.26 });
    // chairs on the free squares beside it, facing the table
    const max = t.round ? 2 : 3;
    const spots: [number, number, number, number][] = [];
    for (const [a, b] of t.cells)
      for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ax = a + ddx, by = b + ddy;
        if (ax < 0 || by < 0 || ax >= n || by >= n || dark(ax, by) || inFinderZone(ax, by) || chairsTaken.has(key(ax, by))) continue;
        spots.push([ax, by, ddx, ddy]);
      }
    spots.sort(() => rand() - 0.5);
    let placed = 0;
    for (const [ax, by, ddx, ddy] of spots) {
      if (placed >= max || chairsTaken.has(key(ax, by))) continue;
      chairsTaken.add(key(ax, by));
      placed++;
      const yaw = Math.atan2(-ddx, -ddy); // seat faces the table
      const px = W(ax) - ddx * 0.2, pz = W(by) - ddy * 0.2;
      const d = t.delay + 0.05;
      add(box(0.12, 0.4, 0.12), { color: COLORS.leg, delay: d, at: [px, 0, pz], yaw });
      add(box(0.44, 0.06, 0.44), { color: COLORS.chair, delay: d, at: [px, 0.4, pz], yaw });
      add(box(0.44, 0.44, 0.06), { color: COLORS.chair, delay: d, at: [px + ddx * 0.19, 0.46, pz + ddy * 0.19], yaw });
      // a plate in front of some guests
      if (rand() < 0.55) add(cyl(0.14, 0.12, 0.025, 20), { color: COLORS.card, delay: d + 0.03, at: [W(ax) - ddx * 0.78, TOP, W(by) - ddy * 0.78], hull: true, edge: 40 });
    }
    // analytics: a bar out of every table, taller where it sold more
    const v = Math.pow(rand(), 1.6);
    add(box(0.56, 0.6 + v * 4.2, 0.56), { color: v > 0.5 ? COLORS.tomato : v > 0.22 ? "#e7b24c" : "#c9bfb0", delay: 0.6 * (1 - v), at: [t.x, TOP, t.z], base: TOP, bar: true });
  });

  // tiles for every dark square, each fading as the thing standing on it rises
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!dark(x, y)) continue;
      const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(W(x), 0.004, W(y));
      g.deleteAttribute("uv");
      g.deleteAttribute("normal");
      attr(g, "aDelay", delayFor(x, y));
      tileGeos.push(g);
    }


  // ---- materials
  const U = {
    uRise: { value: 0 },
    uBars: { value: 0 },
    uLine: { value: 0 },
    uAdmin: { value: 0 },
    uPaper: { value: new THREE.Color(COLORS.floor) },
    uInk: { value: new THREE.Color("#0d0c0b") },
    uTile: { value: new THREE.Color(COLORS.tile) },
    uStat: { value: STATUS.map((s) => new THREE.Color(s)) },
  };
  const growVertex = (riseName: string, push: boolean) => `
    #include <begin_vertex>
    float rr = clamp((${riseName} - aDelay) / 0.35, 0.0, 1.0);
    float uu = rr - 1.0;
    float kk = rr <= 0.0 ? 0.0 : 1.0 + 2.70158 * uu * uu * uu + 1.70158 * uu * uu;
    ${push ? "transformed += normalize(normal) * 0.022;" : ""}
    transformed.y = (transformed.y - aBase) * kk + aBase - (rr <= 0.0 ? 0.1 : 0.0);`;
  const grow = <M extends T.Material>(m: M, riseName: "uRise" | "uBars", opts: { push?: boolean; fill?: boolean } = {}): M => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        `attribute float aDelay;\nattribute float aBase;\nuniform float uRise;\nuniform float uBars;\n${opts.fill ? "attribute float aStatus;\nvarying float vStatus;\n" : ""}` +
        sh.vertexShader.replace("#include <begin_vertex>", growVertex(riseName, !!opts.push) + (opts.fill ? "\nvStatus = aStatus;" : ""));
      if (opts.fill)
        sh.fragmentShader =
          "uniform vec3 uPaper;\nuniform float uLine;\nuniform float uAdmin;\nuniform vec3 uStat[5];\nvarying float vStatus;\n" +
          sh.fragmentShader.replace(
            "#include <opaque_fragment>",
            `#include <opaque_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uPaper, ${riseName === "uBars" ? "0.0" : "uLine"});
            int si = int(vStatus + 0.5);
            if (si > 0) gl_FragColor.rgb = mix(gl_FragColor.rgb, uStat[si], uAdmin);`,
          );
    };
    return m;
  };
  const fillMat = grow(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), "uRise", { fill: true });
  const lineMat = grow(new THREE.LineBasicMaterial({ color: "#0d0c0b", transparent: true, opacity: 0 }), "uRise");
  const hullMat = grow(new THREE.MeshBasicMaterial({ color: "#0d0c0b", side: THREE.BackSide, transparent: true, opacity: 0 }), "uRise", { push: true });
  const barMat = grow(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), "uBars", { fill: true });
  const barLineMat = grow(new THREE.LineBasicMaterial({ color: "#0d0c0b", transparent: true, opacity: 1 }), "uBars");
  const depth = (riseName: "uRise" | "uBars") => grow(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), riseName);

  const root = new THREE.Group();
  const fill = new THREE.Mesh(merge(fills), fillMat);
  fill.castShadow = fill.receiveShadow = true;
  fill.customDepthMaterial = depth("uRise");
  const lines = new THREE.LineSegments(merge(edges), lineMat);
  hulls.forEach((h) => attr(h, "aBase", 0));
  const hull = new THREE.Mesh(merge(hulls), hullMat);
  const bars = new THREE.Mesh(merge(barFills), barMat);
  bars.castShadow = true;
  bars.customDepthMaterial = depth("uBars");
  const barLines = new THREE.LineSegments(merge(barEdges), barLineMat);
  const tileMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `attribute float aDelay; uniform float uRise; varying float vK;
      void main() { vK = clamp((uRise - aDelay) / 0.35, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uInk; uniform vec3 uTile; uniform vec3 uPaper; uniform float uLine; varying float vK;
      void main() { vec3 c = mix(uInk, uTile, smoothstep(0.0, 1.0, vK)); gl_FragColor = vec4(mix(c, uPaper, uLine * 0.9), 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const tiles = new THREE.Mesh(merge(tileGeos), tileMat);
  tiles.receiveShadow = false;
  root.add(fill, tiles, lines, hull, bars, barLines);

  // routes: arcs from the hero table to the kitchen and to the till, with a ticket at the head
  const route = (to: T.Vector3) => {
    const a = hero.clone().add(new THREE.Vector3(0, 0.1, 0));
    const b = to.clone();
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 4 + a.distanceTo(b) * 0.15, 0));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 90, 0.07, 8, false);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLORS.tomato }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mesh.material);
    root.add(mesh, head);
    return (k: number) => {
      mesh.visible = head.visible = k > 0.001;
      geo.setDrawRange(0, Math.floor(k * 90) * 8 * 6);
      head.position.copy(curve.getPoint(Math.min(1, k)));
    };
  };
  const kitchen = new THREE.Vector3(W(3), 1.0, W(3));
  const bar = new THREE.Vector3(W(n - 4), 1.0, W(3));
  const till = new THREE.Vector3(W(3), 1.0, W(n - 4));
  const orderRoute = route(kitchen);
  const billRoute = route(till);

  // the hero table's menu card: a standing card with the real code printed on it
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 340;
  const g2 = cv.getContext("2d")!;
  g2.fillStyle = COLORS.card;
  g2.fillRect(0, 0, 256, 340);
  const cell = 200 / n;
  g2.fillStyle = "#0d0c0b";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (dark(x, y)) g2.fillRect(28 + x * cell, 30 + y * cell, Math.ceil(cell), Math.ceil(cell));
  g2.font = "600 22px system-ui, sans-serif";
  g2.textAlign = "center";
  g2.fillText("Scan for the menu", 128, 270);
  g2.fillStyle = COLORS.tomato;
  g2.font = "500 18px system-ui, sans-serif";
  g2.fillText("Table 12", 128, 302);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const card = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ map: tex }));
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.012), new THREE.MeshStandardMaterial({ color: COLORS.card }));
  face.position.z = 0.007;
  const tilted = new THREE.Group();
  tilted.add(back, face);
  tilted.position.y = 0.2;
  tilted.rotation.x = -0.12;
  card.add(tilted);
  const cardEdges = new THREE.LineSegments(new THREE.EdgesGeometry(back.geometry), new THREE.LineBasicMaterial({ color: "#0d0c0b", transparent: true, opacity: 0 }));
  tilted.add(cardEdges);
  card.position.copy(hero);
  root.add(card);
  const cardAt = hero.clone().add(new THREE.Vector3(0, 0.2, 0));

  return {
    root,
    size,
    spots: { hero, card: cardAt, kitchen, bar, till },
    faceCard: (theta) => (card.rotation.y = theta),
    set: (s) => {
      U.uRise.value = s.rise;
      U.uBars.value = s.bars;
      U.uLine.value = s.line;
      U.uAdmin.value = s.admin;
      U.uPaper.value.set(s.paper);
      U.uInk.value.set("#0d0c0b");
      lineMat.color.set(s.ink);
      hullMat.color.set(s.ink);
      (cardEdges.material as T.LineBasicMaterial).color.set(s.ink);
      lineMat.opacity = hullMat.opacity = (cardEdges.material as T.LineBasicMaterial).opacity = s.line;
      lines.visible = hull.visible = s.line > 0.01;
      bars.visible = barLines.visible = s.bars > 0.001;
      card.visible = s.rise > 0.5;
      card.scale.setScalar(Math.min(1, Math.max(0.001, (s.rise - 0.5) * 3)));
      orderRoute(s.order);
      billRoute(s.bill);
    },
  };
}
