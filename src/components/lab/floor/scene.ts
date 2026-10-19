/**
 * The "QR -> restaurant" model for the floor story. A real QR code is laid out as floor tiles;
 * its dark squares then rise into a little restaurant: the three corner squares become rooms
 * (kitchen, bar, till), the timing rows become planters, and the rest become tables, with chairs
 * on the free squares beside them. Seen from straight above before anything rises, it scans.
 *
 * Everything is merged into a few meshes; one shader uniform (`rise`) grows each piece from the
 * floor in turn. The same meshes draw as soft clay or as a line drawing on paper (faces painted
 * in the page colour hide the edges behind them, like LightGearLab's "lines" view), and table
 * tops can take status colours for the dashboard. One table holds a menu book that opens on a
 * dish with its own QR code, and a plate where the real 3D dish appears. For analytics, bars
 * grow out of the tables, then fly together as bricks into the "busiest hours" chart.
 */
import type * as T from "three";
import QRCode from "qrcode";
import { ORDERS_PER_HOUR } from "@/components/home/OwnerDashboard";

export type FloorState = {
  rise: number; // 0 flat code .. 1 restaurant built
  line: number; // 0 clay .. 1 line drawing
  ink: string;
  paper: string;
  admin: number; // table tops take status colours
  book: number; // 0 closed .. 1 open
  dish: number; // 0 hidden .. 1 the 3D dish fully revealed on its plate
  bars: number; // analytics bars grow out of the tables
  morph: number; // 0 bars on tables .. 1 bricks stacked into the hourly chart
  gone: number; // 0 the floor shows .. 1 it has faded into the page (only the chart is left)
  route: string; // colour of the order/bill lines (must stand out on the page colour)
  order: number; // table -> kitchen route drawn
  bill: number; // table -> till route drawn
};

export type Floor = {
  root: T.Group;
  /** Floor size in world units (code + quiet zone). */
  size: number;
  spots: { hero: T.Vector3; book: T.Vector3; page: T.Vector3; dish: T.Vector3; kitchen: T.Vector3; bar: T.Vector3; till: T.Vector3; chart: T.Vector3 };
  /**
   * Where the hourly chart's columns are, in world units on the plane z = spots.chart.z, in front of
   * the floor (centre x and height per
   * column, shared width and baseline). The story measures the dashboard's real chart and passes
   * it here, so the bricks land exactly on its bars.
   */
  setChart: (x: number[], h: number[], width: number, baseY: number) => void;
  /** Put the real dish (a loaded glTF scene, in metres) on the hero table's plate. */
  addDish: (dish: T.Object3D) => void;
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

/** `facing`: azimuth (radians, 0 = +z) the menu book is read from, i.e. where the camera looks from. */
export function buildFloor(THREE: typeof T, merge: (g: T.BufferGeometry[]) => T.BufferGeometry, url: string, facing: number): Floor {
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
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const one = new THREE.Vector3(1, 1, 1);

  type Opt = { color: string; delay: number; at: [number, number, number]; yaw?: number; tilt?: number; status?: number; edge?: number | false; hull?: boolean };
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
    attr(g, "aBase", 0);
    fills.push(g);
    if (o.edge !== false) {
      const e = new THREE.EdgesGeometry(src, o.edge ?? 20).applyMatrix4(m4);
      attr(e, "aDelay", o.delay);
      attr(e, "aBase", 0);
      edges.push(e);
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

  // a little person: legs, body, head (and a chef's hat); `yaw` 0 faces +z
  const person = (x: number, z: number, yaw: number, shirt: string, delay: number, hat = false) => {
    add(box(0.26, 0.48, 0.15), { color: "#2f2b28", delay, at: [x, 0, z], yaw });
    add(cyl(0.15, 0.18, 0.5, 14), { color: shirt, delay, at: [x, 0.48, z], hull: true, edge: 40 });
    add(new THREE.SphereGeometry(0.11, 14, 10).translate(0, 0.11, 0), { color: "#e2b48e", delay, at: [x, 0.99, z], hull: true, edge: false });
    if (hat) add(cyl(0.11, 0.09, 0.16, 14), { color: "#fbfaf7", delay, at: [x, 1.18, z], hull: true, edge: 40 });
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
    const at = (x: number, y: number, z: number): [number, number, number] => [cx + x, y, cz + z];
    const d2 = d1 + 0.04;
    const d3 = d1 + 0.08;
    if (r === 0) {
      // kitchen (door on +x): a steel range in the middle, counters round the walls, two chefs
      add(box(2.8, 0.92, 2.8), { color: COLORS.steel, delay: d1, at: at(0, 0, 0) });
      for (const [bx, bz] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) add(cyl(0.34, 0.34, 0.04), { color: COLORS.dark, delay: d1, at: at(bx, 0.92, bz), hull: true, edge: 30 });
      // oven door, handle and knobs on the front
      add(box(1.7, 0.45, 0.03), { color: COLORS.dark, delay: d1, at: at(0, 0.12, 1.41) });
      add(box(1.3, 0.04, 0.05), { color: "#e9ecea", delay: d1, at: at(0, 0.63, 1.44) });
      for (let k = 0; k < 4; k++) add(cyl(0.05, 0.05, 0.05, 12), { color: COLORS.dark, delay: d1, at: at(-1.05 + k * 0.7, 0.76, 1.4), tilt: Math.PI / 2, edge: 30 });
      // a lidded stock pot, a sauce pot and a frying pan with its handle
      add(cyl(0.3, 0.28, 0.36), { color: COLORS.tomato, delay: d2, at: at(-0.65, 0.96, -0.65), hull: true, edge: 30 });
      add(cyl(0.31, 0.31, 0.03), { color: "#e9ecea", delay: d2, at: at(-0.65, 1.32, -0.65), hull: true, edge: 30 });
      add(cyl(0.05, 0.05, 0.05, 10), { color: COLORS.dark, delay: d2, at: at(-0.65, 1.35, -0.65), edge: 30 });
      add(cyl(0.2, 0.2, 0.18), { color: COLORS.tomato, delay: d2, at: at(0.65, 0.96, -0.65), hull: true, edge: 30 });
      add(cyl(0.23, 0.2, 0.05), { color: COLORS.dark, delay: d2, at: at(0.65, 0.96, 0.65), hull: true, edge: 30 });
      add(box(0.34, 0.03, 0.06), { color: COLORS.dark, delay: d2, at: at(1.05, 0.98, 0.65) });
      // counters: along the back wall (plates, tickets pinned above) and the side wall (sink, board)
      add(box(4.6, 0.9, 0.62), { color: "#d9dcda", delay: d2, at: at(0, 0, -2.36) });
      add(box(0.62, 0.9, 2.95), { color: "#d9dcda", delay: d2, at: at(-2.36, 0, 0.12) });
      for (let k = 0; k < 4; k++) add(cyl(0.16, 0.14, 0.025, 20), { color: COLORS.card, delay: d3, at: at(1.5, 0.9 + k * 0.03, -2.36), hull: true, edge: 40 });
      for (let k = 0; k < 4; k++) add(box(0.13, 0.17, 0.01), { color: COLORS.card, delay: d3, at: at(-0.6 + k * 0.32, 0.95, -2.67) });
      add(box(1.5, 0.03, 0.03), { color: COLORS.dark, delay: d3, at: at(-0.12, 1.12, -2.67) });
      add(box(0.46, 0.02, 0.62), { color: "#7d8583", delay: d3, at: at(-2.36, 0.9, -0.45) });
      add(cyl(0.025, 0.025, 0.28, 8), { color: "#e9ecea", delay: d3, at: at(-2.58, 0.9, -0.45), edge: false });
      add(box(0.42, 0.03, 0.3), { color: COLORS.table, delay: d3, at: at(-2.36, 0.9, 0.75) });
      add(box(0.05, 0.015, 0.24), { color: "#e9ecea", delay: d3, at: at(-2.2, 0.93, 0.75) });
      // a tall fridge in the corner
      add(box(0.62, 1.9, 0.82), { color: "#eef0ee", delay: d2, at: at(-2.36, 0, 2.2) });
      add(box(0.03, 0.7, 0.04), { color: COLORS.dark, delay: d2, at: at(-2.04, 0.9, 1.95) });
      person(cx + 1.95, cz + 0.6, -Math.PI / 2, "#f4f2ee", d3, true);
      person(cx + 0.4, cz + 2.05, Math.PI, "#f4f2ee", d3, true);
    } else if (r === 1) {
      // bar (door on -x): counter with bottles, taps and a coffee machine, a back shelf, a bartender
      add(box(2.8, 1.0, 2.8), { color: COLORS.table, delay: d1, at: at(0, 0, 0) });
      for (let k = 0; k < 6; k++) add(cyl(0.07, 0.09, 0.42, 10), { color: COLORS.bottle, delay: d2, at: at(-0.9 + k * 0.36, 1.0, -0.9), hull: true, edge: 40 });
      for (let k = 0; k < 3; k++) {
        add(cyl(0.025, 0.025, 0.32, 8), { color: "#c3c6c4", delay: d2, at: at(0.55 + k * 0.22, 1.0, 0.95), edge: false });
        add(box(0.05, 0.12, 0.05), { color: COLORS.tomato, delay: d2, at: at(0.55 + k * 0.22, 1.32, 0.95) });
      }
      for (let k = 0; k < 4; k++) add(cyl(0.055, 0.045, 0.13, 12), { color: "#dfeaec", delay: d3, at: at(-0.2 + k * 0.16, 1.0, 1.1), hull: true, edge: 40 });
      add(box(0.5, 0.42, 0.4), { color: COLORS.steel, delay: d2, at: at(-0.85, 1.0, 0.55) });
      add(box(0.3, 0.05, 0.12), { color: COLORS.dark, delay: d2, at: at(-0.85, 1.22, 0.78) });
      add(box(4.4, 1.05, 0.36), { color: "#8a5a3a", delay: d2, at: at(0, 0, -2.45) });
      const glassColors = [COLORS.bottle, "#b0702b", "#d8e3e0", "#6e2a1f"];
      for (let k = 0; k < 11; k++) add(cyl(0.06, 0.08, 0.36, 10), { color: glassColors[k % 4], delay: d3, at: at(-2 + k * 0.4, 1.05, -2.45), hull: true, edge: 40 });
      for (const sx of [-1, 0, 1]) add(cyl(0.2, 0.16, 0.7, 14), { color: COLORS.leg, delay: d2, at: at(sx * 0.95, 0, 2.05), hull: true, edge: 30 });
      person(cx + 0.35, cz - 1.85, 0, "#1d3b2e", d3);
    } else {
      // till (door on +x): counter with register, card terminal, receipt printer and a bill tray;
      // a cake display, a bench for guests, the cashier and a guest paying
      add(box(2.8, 0.95, 2.8), { color: COLORS.counter, delay: d1, at: at(0, 0, 0) });
      add(box(0.7, 0.32, 0.55), { color: COLORS.dark, delay: d2, at: at(0.5, 0.95, 0) });
      add(box(0.62, 0.42, 0.05), { color: COLORS.dark, delay: d2, at: at(0.5, 1.27, -0.1), tilt: -0.3 });
      add(box(0.12, 0.22, 0.06), { color: COLORS.dark, delay: d3, at: at(1.1, 0.95, 0.8), tilt: -0.35 });
      add(box(0.08, 0.06, 0.01), { color: COLORS.tomato, delay: d3, at: at(1.1, 1.08, 0.79), tilt: -0.35, edge: false });
      add(box(0.24, 0.14, 0.22), { color: "#d8d4cd", delay: d3, at: at(1.0, 0.95, -0.75) });
      add(box(0.12, 0.2, 0.006), { color: COLORS.card, delay: d3, at: at(1.0, 1.09, -0.66), tilt: 0.25, edge: false });
      add(box(0.3, 0.02, 0.18), { color: COLORS.dark, delay: d3, at: at(0.15, 0.95, 0.95) });
      add(box(0.13, 0.006, 0.16), { color: COLORS.card, delay: d3, at: at(0.15, 0.97, 0.95), edge: false });
      add(cyl(0.09, 0.09, 0.18, 14), { color: "#cfe0e3", delay: d3, at: at(-0.45, 0.95, 0.95), hull: true, edge: 40 });
      add(cyl(0.22, 0.17, 0.3), { color: COLORS.pot, delay: d2, at: at(-0.7, 0.95, -0.6), hull: true, edge: 30 });
      add(new THREE.IcosahedronGeometry(0.32, 0), { color: COLORS.leaf, delay: d3, at: at(-0.7, 1.5, -0.6) });
      add(box(0.62, 0.85, 2.6), { color: "#e7ded2", delay: d2, at: at(-2.36, 0, 0) });
      ["#f3d9c4", "#6b3f2a", "#e8b8c8"].forEach((c, k) => add(cyl(0.2, 0.2, 0.16, 20), { color: c, delay: d3, at: at(-2.36, 0.85, -0.8 + k * 0.8), hull: true, edge: 40 }));
      add(box(2.2, 0.42, 0.45), { color: COLORS.table, delay: d2, at: at(0.2, 0, 2.3) });
      person(cx + 0.2, cz - 2.05, 0, "#1d3b2e", d3);
      person(cx + 2.05, cz + 0.45, -Math.PI / 2, "#c8873f", d3);
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
  // the hero table (front right of centre) gets the menu book and the 3D dish instead of a small card
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
    if (t !== pick) for (const sgn of [-1, 1]) add(box(0.2, 0.15, 0.012), { color: COLORS.card, delay: t.delay + 0.04, at: [t.x + Math.sin(cy) * sgn * 0.035, TOP, t.z + Math.cos(cy) * sgn * 0.035], yaw: cy, tilt: -sgn * 0.26 });
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
      if (rand() < 0.55 && t !== pick) add(cyl(0.14, 0.12, 0.025, 20), { color: COLORS.card, delay: d + 0.03, at: [W(ax) - ddx * 0.78, TOP, W(by) - ddy * 0.78], hull: true, edge: 40 });
    }
  });

  // ---- analytics: one bar per table; each later flies to a slot in the hourly chart as a brick.
  // A slot is (column, start, end) as fractions of the column; the columns themselves are uniforms.
  const HMAX = 14;
  const peak = ORDERS_PER_HOUR.indexOf(Math.max(...ORDERS_PER_HOUR));
  const total = ORDERS_PER_HOUR.reduce((a, b) => a + b, 0);
  // bricks per hour column, in proportion to that hour's orders (largest remainder)
  const raw = ORDERS_PER_HOUR.map((v) => (v / total) * tables.length);
  const counts = raw.map(Math.floor);
  raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]).slice(0, tables.length - counts.reduce((a, b) => a + b, 0)).forEach(([, i]) => counts[i]++);
  // the dashboard's colours: accent for the peak hour, accent at 45% on its card for the rest
  const slots: { at: [number, number, number]; col: string; k: number }[] = [];
  counts.forEach((cnt, j) => {
    for (let k = 0; k < cnt; k++) slots.push({ at: [j, k / cnt, (k + 1) / cnt], col: j === peak ? COLORS.tomato : "#d29486", k: j / ORDERS_PER_HOUR.length });
  });
  const HOURS_N = ORDERS_PER_HOUR.length;
  const barGeos: T.BufferGeometry[] = [];
  const barEdgeGeos: T.BufferGeometry[] = [];
  const unit = box(1, 1, 1);
  const unitEdges = new THREE.EdgesGeometry(unit);
  const vec = (g: T.BufferGeometry, name: string, v: number[]) => {
    const a = new Float32Array(g.attributes.position.count * v.length);
    for (let i = 0; i < a.length; i += v.length) a.set(v, i);
    g.setAttribute(name, new THREE.Float32BufferAttribute(a, v.length));
  };
  [...tables].sort((a, b) => a.x - b.x || a.z - b.z).forEach((t, i) => {
    const v = Math.pow(rand(), 1.6);
    const slot = slots[i];
    col.set(v > 0.5 ? COLORS.tomato : v > 0.22 ? "#e7b24c" : "#c9bfb0");
    const from = [col.r, col.g, col.b];
    col.set(slot.col);
    const per = (g: T.BufferGeometry, fill: boolean) => {
      vec(g, "aFrom", [t.x, TOP, t.z]);
      vec(g, "aSlot", slot.at);
      vec(g, "aDims", [0.6 + v * 4.2, 0.6 * (1 - v), Math.min(1, slot.k + rand() * 0.15)]); // height on table, rise delay, fly stagger
      if (fill) {
        vec(g, "color", from);
        vec(g, "aColTo", [col.r, col.g, col.b]);
      }
      return g;
    };
    barGeos.push(per(unit.toNonIndexed(), true));
    barEdgeGeos.push(per(unitEdges.clone(), false));
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
    uMorph: { value: 0 },
    uGone: { value: 0 },
    // until the story measures the dashboard: a chart standing in the middle of the floor
    uColX: { value: ORDERS_PER_HOUR.map((_, j) => (j - (ORDERS_PER_HOUR.length - 1) / 2) * 1.9) },
    uColH: { value: ORDERS_PER_HOUR.map((v) => (v / Math.max(...ORDERS_PER_HOUR)) * 14) },
    uColW: { value: 1.3 },
    uBaseY: { value: 0 },
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
  const grow = <M extends T.Material>(m: M, riseName: "uRise", opts: { push?: boolean; fill?: boolean } = {}): M => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        `attribute float aDelay;\nattribute float aBase;\nuniform float uRise;\n${opts.fill ? "attribute float aStatus;\nvarying float vStatus;\n" : ""}` +
        sh.vertexShader.replace("#include <begin_vertex>", growVertex(riseName, !!opts.push) + (opts.fill ? "\nvStatus = aStatus;" : ""));
      if (opts.fill)
        sh.fragmentShader =
          "uniform vec3 uPaper;\nuniform float uLine;\nuniform float uAdmin;\nuniform vec3 uStat[5];\nvarying float vStatus;\n" +
          sh.fragmentShader.replace(
            "#include <opaque_fragment>",
            `#include <opaque_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uPaper, uLine);
            int si = int(vStatus + 0.5);
            if (si > 0) gl_FragColor.rgb = mix(gl_FragColor.rgb, uStat[si], uAdmin);`,
          );
    };
    return m;
  };
  const fillMat = grow(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), "uRise", { fill: true });
  const lineMat = grow(new THREE.LineBasicMaterial({ color: "#0d0c0b", transparent: true, opacity: 0 }), "uRise");
  const hullMat = grow(new THREE.MeshBasicMaterial({ color: "#0d0c0b", side: THREE.BackSide, transparent: true, opacity: 0 }), "uRise", { push: true });
  const depth = () => grow(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), "uRise");
  // bars: grow on their table, then fly in an arc to their slot in the chart, thin down to flat
  // bars and take the chart's flat colour, so they become the dashboard's bars
  const flyVertex = (fill: boolean) => `
    float rr = clamp((uBars - aDims.y) / 0.35, 0.0, 1.0);
    float uu = rr - 1.0;
    float kk = rr <= 0.0 ? 0.0 : 1.0 + 2.70158 * uu * uu * uu + 1.70158 * uu * uu;
    float mm = smoothstep(0.0, 1.0, clamp((uMorph - aDims.z * 0.55) / 0.45, 0.0, 1.0));
    int j = int(aSlot.x + 0.5);
    vec3 to = vec3(uColX[j], uBaseY + aSlot.y * uColH[j], ${(size / 2 + 1).toFixed(2)});
    float hTo = max((aSlot.z - aSlot.y) * uColH[j] - 0.06 * (1.0 - mm), 0.0001);
    float wx = mix(0.56, uColW, mm);
    float wz = mix(0.56, 0.02, mm);
    float h = max(mix(aDims.x * kk, hTo, mm), 0.0001);
    vec3 base = mix(aFrom, to, mm) + vec3(0.0, sin(mm * 3.14159) * 4.0, 0.0);
    vec3 transformed = vec3(position.x * wx, position.y * h, (position.z - 0.5 * mm) * wz) + base;
    if (rr <= 0.0) transformed.y -= 1.0;
    ${fill ? "vColor.rgb = mix(color.rgb, aColTo, mm); vFlat = aColTo; vMM = mm * mm;" : ""}`;
  const fly = <M extends T.Material>(m: M, fill: boolean): M => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uBars: U.uBars, uMorph: U.uMorph, uColX: U.uColX, uColH: U.uColH, uColW: U.uColW, uBaseY: U.uBaseY });
      sh.vertexShader =
        `attribute vec3 aFrom;\nattribute vec3 aSlot;\nattribute vec3 aDims;\nuniform float uBars;\nuniform float uMorph;\nuniform float uColX[${HOURS_N}];\nuniform float uColH[${HOURS_N}];\nuniform float uColW;\nuniform float uBaseY;\n${fill ? "attribute vec3 aColTo;\nvarying vec3 vFlat;\nvarying float vMM;\n" : ""}` +
        sh.vertexShader.replace("#include <begin_vertex>", flyVertex(fill));
      if (fill)
        sh.fragmentShader =
          "varying vec3 vFlat;\nvarying float vMM;\n" + sh.fragmentShader.replace("#include <opaque_fragment>", "#include <opaque_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, vFlat, vMM);");
    };
    return m;
  };
  const bars = new THREE.Mesh(merge(barGeos), fly(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), true));
  const barLineMat = fly(new THREE.LineBasicMaterial({ color: "#0d0c0b", transparent: true }), false);
  const barLines = new THREE.LineSegments(merge(barEdgeGeos), barLineMat);
  bars.frustumCulled = barLines.frustumCulled = false; // they fly far from where their geometry starts

  const root = new THREE.Group();
  const fill = new THREE.Mesh(merge(fills), fillMat);
  fill.castShadow = fill.receiveShadow = true;
  fill.customDepthMaterial = depth();
  const lines = new THREE.LineSegments(merge(edges), lineMat);
  hulls.forEach((h) => attr(h, "aBase", 0));
  const hull = new THREE.Mesh(merge(hulls), hullMat);
  const tileMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `attribute float aDelay; uniform float uRise; varying float vK;
      void main() { vK = clamp((uRise - aDelay) / 0.35, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uInk; uniform vec3 uTile; uniform vec3 uPaper; uniform float uLine; uniform float uGone; varying float vK;
      void main() { vec3 c = mix(uInk, uTile, smoothstep(0.0, 1.0, vK)); gl_FragColor = vec4(mix(c, uPaper, max(uLine * 0.9, uGone)), 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const tiles = new THREE.Mesh(merge(tileGeos), tileMat);
  tiles.receiveShadow = false;
  root.add(fill, tiles, lines, hull, bars, barLines);

  // routes: arcs from the hero table to the kitchen and to the till, with a ticket at the head
  const routeMat = new THREE.MeshBasicMaterial({ color: COLORS.tomato });
  const route = (to: T.Vector3) => {
    const a = hero.clone().add(new THREE.Vector3(0, 0.1, 0));
    const b = to.clone();
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 4 + a.distanceTo(b) * 0.15, 0));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 90, 0.07, 8, false);
    const mesh = new THREE.Mesh(geo, routeMat);
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
  const billRoute = route(till.clone().add(new THREE.Vector3(0.15, -0.01, 0.95))); // lands on the bill tray

  // ---- the hero table's menu book: closed on the table, it opens on a dish with its own QR code
  const horiz = pick.cells.length > 1 && pick.cells[0][1] === pick.cells[1][1];
  const along = horiz ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const bookAt = hero.clone().addScaledVector(along, -0.4);
  const dishAt = hero.clone().addScaledVector(along, 0.4);
  const page = (draw: (g: CanvasRenderingContext2D) => void) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 708;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#f8f4ec";
    g.fillRect(0, 0, 512, 708);
    g.textAlign = "center";
    draw(g);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
  };
  const serif = "Georgia, 'Times New Roman', serif";
  const qrAt = (g: CanvasRenderingContext2D, x: number, y: number, w: number) => {
    const s2 = w / (n + 2);
    g.fillStyle = "#ffffff";
    g.fillRect(x, y, w, w);
    g.fillStyle = "#0d0c0b";
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) if (dark(xx, yy)) g.fillRect(x + (xx + 1) * s2, y + (yy + 1) * s2, Math.ceil(s2), Math.ceil(s2));
  };
  const leftPage = page((g) => {
    g.fillStyle = "#0d0c0b";
    g.font = `italic 44px ${serif}`;
    g.fillText("Menu", 256, 96);
    g.fillStyle = "#b83219";
    g.fillRect(226, 120, 60, 3);
    const items = [["Burrata", "€9"], ["Margherita", "€11"], ["Caesar salad", "€9"], ["Tagliatelle", "€13"], ["Tiramisu", "€6"]];
    g.textAlign = "left";
    items.forEach(([name, price], i) => {
      const y = 200 + i * 92;
      g.fillStyle = "#0d0c0b";
      g.font = `30px ${serif}`;
      g.fillText(name, 60, y);
      g.textAlign = "right";
      g.font = `30px "Times New Roman", Times, "Liberation Serif", serif`;
      g.fillText(price, 452, y);
      g.textAlign = "left";
      g.fillStyle = "#8a8884";
      g.font = "20px system-ui, sans-serif";
      g.fillText("scan to see it in 3D", 60, y + 30);
    });
  });
  const rightPage = page((g) => {
    g.fillStyle = "#8a8884";
    g.font = "22px system-ui, sans-serif";
    g.fillText("Chef's pick", 256, 84);
    g.fillStyle = "#0d0c0b";
    g.font = `italic 56px ${serif}`;
    g.fillText("Cheeseburger", 256, 152);
    g.font = "22px system-ui, sans-serif";
    g.fillStyle = "#5f5e5c";
    g.fillText("Brioche, aged cheddar, pickles · €14", 256, 196);
    qrAt(g, 136, 236, 240);
    g.fillStyle = "#b83219";
    g.beginPath();
    g.roundRect(206, 506, 100, 40, 20);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = "600 22px system-ui, sans-serif";
    g.fillText("3D", 256, 534);
    g.fillStyle = "#0d0c0b";
    g.font = `26px ${serif}`;
    g.fillText("Scan it and see the dish", 256, 600);
    g.fillText("on your table", 256, 636);
  });
  const coverArt = page((g) => {
    g.fillStyle = "#7c2414";
    g.fillRect(0, 0, 512, 708);
    g.strokeStyle = "#e8c9a8";
    g.lineWidth = 3;
    g.strokeRect(28, 28, 456, 652);
    g.fillStyle = "#f3e2cc";
    g.font = `italic 64px ${serif}`;
    g.fillText("Menu", 256, 330);
    g.font = "22px system-ui, sans-serif";
    g.fillText("· Trattoria ·", 256, 390);
  });
  // the cover art sits on the underside of the right half, so it reads upright once flipped closed
  (coverArt.map as T.Texture).center.set(0.5, 0.5);
  (coverArt.map as T.Texture).rotation = Math.PI;
  const paperEdge = new THREE.MeshStandardMaterial({ color: "#efe8da", roughness: 0.95 });
  const coverMat = new THREE.MeshStandardMaterial({ color: "#7c2414", roughness: 0.7 });
  const BW = 0.21, BH = 0.29, BT = 0.012;
  const book = new THREE.Group();
  // the dish page stays put; the left half (menu list on top, front cover underneath) swings open
  const right = new THREE.Mesh(new THREE.BoxGeometry(BW, BT, BH), [paperEdge, coverMat, rightPage, coverMat, paperEdge, paperEdge]);
  right.position.set(BW / 2, BT / 2, 0);
  const hinge = new THREE.Group();
  hinge.position.y = BT;
  const left = new THREE.Mesh(new THREE.BoxGeometry(BW, BT, BH), [coverMat, paperEdge, leftPage, coverArt, paperEdge, paperEdge]);
  left.position.set(-BW / 2, -BT / 2, 0);
  hinge.add(left);
  book.add(right, hinge);
  book.traverse((o) => (o.castShadow = o.receiveShadow = true));
  book.position.copy(bookAt);
  book.rotation.y = facing;
  root.add(book);
  const tmp = new THREE.Vector3();
  const pageAt = bookAt.clone().add(tmp.set(BW / 2, BT, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing));

  // the plate, and the real dish revealed on it by a rising scan line
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.014, 40), new THREE.MeshStandardMaterial({ color: "#fbfaf7", roughness: 0.35 }));
  plate.position.copy(dishAt).add(tmp.set(0, 0.007, 0));
  plate.castShadow = plate.receiveShadow = true;
  root.add(plate);
  const dishBase = dishAt.clone().setY(TOP + 0.014);
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.0022, 8, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: COLORS.tomato }));
  root.add(ring);
  let dishObj: T.Object3D | null = null;
  const DISH_H = 0.115;

  return {
    root,
    size,
    spots: { hero, book: bookAt.clone().setY(TOP + BT), page: pageAt, dish: dishBase, kitchen, bar, till, chart: new THREE.Vector3(0, HMAX / 2, size / 2 + 1) },
    setChart: (x, h, width, baseY) => {
      U.uColX.value = x;
      U.uColH.value = h;
      U.uColW.value = width;
      U.uBaseY.value = baseY;
    },
    addDish: (d) => {
      d.position.copy(dishBase);
      d.traverse((o) => {
        const m = o as T.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => (mat.clippingPlanes = [clip]));
      });
      dishObj = d;
      root.add(d);
    },
    set: (s) => {
      U.uRise.value = s.rise;
      // fading away: faces turn page-coloured and the lines melt into the page too
      U.uLine.value = s.line + (1 - s.line) * s.gone;
      U.uGone.value = s.gone;
      U.uAdmin.value = s.admin;
      U.uPaper.value.set(s.paper);
      lineMat.color.set(s.ink);
      hullMat.color.set(s.ink);
      lineMat.opacity = hullMat.opacity = s.line * (1 - s.gone);
      lines.visible = hull.visible = s.line > 0.01 && s.gone < 0.999;
      fill.visible = tiles.visible = s.gone < 0.999;
      // the book and plate arrive with the rest of the room
      const here = Math.min(1, Math.max(0.001, (s.rise - 0.55) * 2.5));
      book.visible = plate.visible = s.rise > 0.55;
      book.scale.setScalar(here);
      plate.scale.setScalar(here);
      hinge.rotation.z = -Math.PI * (1 - s.book);
      const h = DISH_H * s.dish;
      clip.constant = dishBase.y - 0.001 + h;
      if (dishObj) dishObj.visible = s.dish > 0.001 && s.rise > 0.55;
      ring.visible = s.dish > 0.001 && s.dish < 0.999;
      ring.position.copy(dishBase).setY(dishBase.y + h);
      ring.scale.setScalar(1 + 0.12 * Math.sin(Math.PI * s.dish));
      U.uBars.value = s.bars;
      U.uMorph.value = s.morph;
      bars.visible = barLines.visible = s.bars > 0.001;
      barLineMat.color.set(s.ink);
      barLineMat.opacity = 1 - s.morph * s.morph; // the bricks' seams melt away as they become bars
      routeMat.color.set(s.route);
      orderRoute(s.order);
      billRoute(s.bill);
    },
  };
}
