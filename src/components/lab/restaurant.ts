/**
 * A miniature restaurant, built from simple shapes in code (no downloads), for the concept
 * previews: dining tables with QR stands, guests, a kitchen with an order screen, a till and the
 * owner's desk, plus the "order lines" that run between them. Two looks: soft clay (shadows,
 * like an architect's model) or clean line drawing (paper fill + ink edges).
 */
import type * as T from "three";

export type Look = "clay" | "lines";

export type Palette = {
  floor: string;
  wall: string;
  furniture: string;
  people: string;
  detail: string; // screens, POS, stand faces
  accent: string; // order lines and lit screens
  ink: string; // edges in the line look
};

export const PALETTES = {
  paper: { floor: "#e0dbd2", wall: "#d8d2c8", furniture: "#f7f4ef", people: "#cfc6b9", detail: "#2e2a27", accent: "#b83219", ink: "#0d0c0b" },
  cool: { floor: "#c7d6e1", wall: "#bccdd9", furniture: "#e8f0f5", people: "#b3c4d1", detail: "#4f6273", accent: "#ff4d5a", ink: "#1b2733" },
  bold: { floor: "#f2f0ec", wall: "#f2f0ec", furniture: "#f2f0ec", people: "#f2f0ec", detail: "#f2f0ec", accent: "#b83219", ink: "#0d0c0b" },
} satisfies Record<string, Palette>;

export type Stop = { pos: [number, number, number]; target: [number, number, number] };

/** Camera stops, one per step of the story. */
export const STOPS: Record<"overview" | "scan" | "order" | "kitchen" | "bill" | "insights", Stop> = {
  overview: { pos: [15, 14, 17], target: [0, 0, 0] },
  scan: { pos: [1.6, 3.2, 6.4], target: [-2, 0.8, 1.5] },
  order: { pos: [6.5, 7.5, 9], target: [1.5, 0.8, -1.5] },
  kitchen: { pos: [11.5, 6.2, 5.5], target: [5.2, 1.1, -2.8] },
  bill: { pos: [12.5, 5.6, 11], target: [5.4, 0.8, 2.4] },
  insights: { pos: [-1.8, 6.2, 3.2], target: [-7.2, 1, -4.2] },
};

export type Restaurant = {
  root: T.Group;
  /** Groups that the "take it apart" view lifts separately, bottom to top. */
  layers: { name: string; group: T.Group }[];
  /** 0..1 how much of each order line is drawn. */
  setRoutes: (p: { order: number; serve: number; bill: number; insights: number }) => void;
  /** 0..1 how lit the screens are (kitchen tickets, dashboard bars). */
  setScreens: (k: number) => void;
  /** Line look only: recolour edges and fills to sit on a new page colour. */
  setInk: (ink: string, fill: string) => void;
};

export async function buildRestaurant(three: typeof T, palette: Palette, look: Look): Promise<Restaurant> {
  const THREE = three;
  const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");

  const root = new THREE.Group();
  const mats = new Map<string, T.Material>();
  const edgeMat = new THREE.LineBasicMaterial({ color: palette.ink });
  const mat = (color: string, opts: { emissive?: boolean } = {}) => {
    const key = color + (opts.emissive ? "e" : "");
    let m = mats.get(key);
    if (!m) {
      if (look === "lines") m = new THREE.MeshBasicMaterial({ color: opts.emissive ? palette.accent : color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      else m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...(opts.emissive ? { emissive: new THREE.Color(color), emissiveIntensity: 0.6 } : {}) });
      mats.set(key, m);
    }
    return m;
  };
  const add = (parent: T.Object3D, geo: T.BufferGeometry, color: string, at: [number, number, number], opts: { rot?: [number, number, number]; emissive?: boolean; edges?: boolean } = {}) => {
    const mesh = new THREE.Mesh(geo, mat(color, opts));
    mesh.position.set(...at);
    if (opts.rot) mesh.rotation.set(...opts.rot);
    if (look === "clay") mesh.castShadow = mesh.receiveShadow = true;
    else if (opts.edges !== false) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat));
    parent.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, r = 0.04) => (look === "clay" && r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d));
  const cyl = (rt: number, rb: number, h: number, seg = 28) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const group = (name: string) => {
    const g = new THREE.Group();
    g.name = name;
    root.add(g);
    return g;
  };

  const floor = group("Floor & walls");
  const furniture = group("Tables & QR stands");
  const people = group("Guests & staff");
  const kitchen = group("Kitchen");
  const till = group("Till & bills");
  const office = group("Owner's dashboard");
  const routes = group("Orders");

  // Floor slab and a cutaway corner of walls, like a diorama.
  add(floor, box(18, 0.4, 11, 0.12), palette.floor, [0, -0.2, 0]);
  add(floor, box(18, 2.6, 0.2, 0.05), palette.wall, [0, 1.3, -5.4]);
  add(floor, box(0.2, 2.6, 11, 0.05), palette.wall, [-8.9, 1.3, 0]);
  for (const [x, z] of [[-8.2, 4.6], [8.2, -4.7]] as const) {
    add(floor, cyl(0.32, 0.26, 0.55), palette.furniture, [x, 0.275, z]);
    add(floor, new THREE.IcosahedronGeometry(0.62, 1), palette.people, [x, 1.05, z]);
  }

  // Dining room: six round tables, chairs, a QR stand on each.
  const person = (parent: T.Object3D, x: number, z: number, seated: boolean, face = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = face;
    const body = seated ? 0.52 : 0.78;
    add(g, new THREE.CapsuleGeometry(0.19, body, 6, 14), palette.people, [0, (seated ? 0.45 : 0) + body / 2 + 0.19, 0], { edges: false });
    add(g, new THREE.SphereGeometry(0.15, 18, 14), palette.people, [0, (seated ? 0.45 : 0) + body + 0.52, 0], { edges: false });
    if (look === "lines") {
      // a simple outline instead of edge soup on round shapes
      const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.19, 0.19, body + 0.38, 12, 1), 30), edgeMat);
      ring.position.y = (seated ? 0.45 : 0) + (body + 0.38) / 2;
      g.add(ring);
    }
    parent.add(g);
    return g;
  };
  const tables: [number, number][] = [[-5, -2], [-2, -2], [1, -2], [-5, 1.5], [-2, 1.5], [1, 1.5]];
  tables.forEach(([x, z], i) => {
    add(furniture, cyl(0.62, 0.62, 0.06, 36), palette.furniture, [x, 0.75, z]);
    add(furniture, cyl(0.05, 0.05, 0.72, 10), palette.furniture, [x, 0.36, z]);
    add(furniture, cyl(0.28, 0.32, 0.04, 20), palette.furniture, [x, 0.02, z]);
    for (const a of [0, Math.PI]) {
      const cx = x + Math.cos(a) * 0.95;
      const cz = z + Math.sin(a) * 0.95;
      add(furniture, box(0.45, 0.06, 0.45, 0.03), palette.furniture, [cx, 0.45, cz]);
      add(furniture, box(0.06, 0.5, 0.45, 0.02), palette.furniture, [cx + Math.cos(a) * 0.2, 0.72, cz]);
      for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) add(furniture, box(0.04, 0.44, 0.04, 0), palette.furniture, [cx + lx, 0.22, cz + lz], { edges: look === "lines" });
    }
    // QR stand: a small tent card with a dark face
    const stand = new THREE.Group();
    stand.position.set(x + 0.15, 0.78, z - 0.1);
    stand.rotation.y = -0.5;
    add(stand, box(0.2, 0.26, 0.02, 0.01), palette.furniture, [0, 0.13, 0], { rot: [-0.18, 0, 0] });
    add(stand, new THREE.PlaneGeometry(0.13, 0.13), palette.detail, [0, 0.15, 0.022], { rot: [-0.18, 0, 0], edges: false });
    furniture.add(stand);
    if (i % 2 === 0 || i === 4) {
      person(people, x - 0.95, z, true, Math.PI / 2);
      if (i !== 2) person(people, x + 0.95, z, true, -Math.PI / 2);
    }
  });
  // the guest scanning: a phone in hand above the table at (-2, 1.5)
  add(people, box(0.09, 0.17, 0.015, 0.01), palette.detail, [-2.55, 1.25, 1.55], { rot: [-0.9, 0.4, 0] });
  // waiter between the tables and the pass
  person(people, 2.6, -0.4, false, -0.9);
  add(people, cyl(0.25, 0.25, 0.03, 24), palette.furniture, [2.85, 1.25, -0.35]);

  // Kitchen: back counter with burners, an island with the pass and the order screen above it.
  add(kitchen, box(4.8, 0.9, 0.8, 0.05), palette.furniture, [6, 0.45, -4.8]);
  for (let k = 0; k < 4; k++) add(kitchen, cyl(0.16, 0.16, 0.04, 20), palette.detail, [4.3 + k * 1.1, 0.92, -4.8]);
  add(kitchen, box(0.9, 0.9, 4.2, 0.05), palette.furniture, [3.9, 0.45, -2.6]);
  add(kitchen, box(1.1, 0.05, 4.2, 0.02), palette.furniture, [3.9, 1.55, -2.6]);
  for (const z of [-4.4, -0.8]) add(kitchen, box(0.05, 0.6, 0.05, 0), palette.furniture, [3.9, 1.22, z], { edges: look === "lines" });
  const screen = add(kitchen, box(1.5, 0.85, 0.06, 0.03), palette.detail, [6, 2.05, -4.95]);
  const tickets: T.Mesh[] = [];
  for (let k = 0; k < 4; k++) tickets.push(add(kitchen, box(0.26, 0.5, 0.01, 0), palette.furniture, [5.45 + k * 0.36, 2.05, -4.91], { emissive: true, edges: false }));
  person(kitchen, 5.2, -3.8, false, Math.PI);
  person(kitchen, 6.8, -3.7, false, Math.PI + 0.3);

  // Till: a bar counter with a card terminal; the bill comes out here.
  add(till, box(3.2, 1.05, 0.8, 0.05), palette.furniture, [6, 0.525, 3.4]);
  add(till, box(0.34, 0.06, 0.26, 0.02), palette.detail, [5.6, 1.1, 3.3], { rot: [0, 0, -0.2] });
  add(till, box(0.18, 0.06, 0.28, 0.02), palette.detail, [6.4, 1.08, 3.25]);
  person(till, 6, 4.3, false, Math.PI);

  // Owner's desk with the dashboard.
  add(office, box(2, 0.06, 0.9, 0.03), palette.furniture, [-7.4, 0.75, -4.4]);
  for (const [lx, lz] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) add(office, box(0.05, 0.72, 0.05, 0), palette.furniture, [-7.4 + lx, 0.36, -4.4 + lz], { edges: look === "lines" });
  add(office, box(1.1, 0.65, 0.05, 0.02), palette.detail, [-7.4, 1.25, -4.7]);
  const bars: T.Mesh[] = [];
  [0.3, 0.5, 0.38, 0.62, 0.46].forEach((h, k) => {
    const b = add(office, box(0.12, 1, 0.01, 0), palette.furniture, [-7.75 + k * 0.18, 1.0, -4.665], { emissive: true, edges: false });
    b.userData.h = h;
    bars.push(b);
  });
  person(office, -7.4, -3.5, true, Math.PI);
  add(office, box(0.45, 0.06, 0.45, 0.03), palette.furniture, [-7.4, 0.45, -3.5]);

  // Order lines: thin tubes on the floor with rounded corners, drawn as the story goes.
  const lift = 0.04;
  const path = (pts: [number, number][], r = 0.6) => {
    const cp = new THREE.CurvePath<T.Vector3>();
    const v = pts.map(([x, z]) => new THREE.Vector3(x, lift, z));
    let from = v[0].clone();
    for (let k = 1; k < v.length - 1; k++) {
      const a = v[k].clone().sub(v[k - 1]).normalize();
      const b = v[k + 1].clone().sub(v[k]).normalize();
      const p0 = v[k].clone().addScaledVector(a, -r);
      const p1 = v[k].clone().addScaledVector(b, r);
      cp.add(new THREE.LineCurve3(from, p0));
      cp.add(new THREE.QuadraticBezierCurve3(p0, v[k].clone(), p1));
      from = p1;
    }
    cp.add(new THREE.LineCurve3(from, v[v.length - 1]));
    return cp;
  };
  const lineMat = new THREE.MeshBasicMaterial({ color: palette.accent });
  const route = (pts: [number, number][], offsets = [-0.12, 0, 0.12]) => {
    const meshes = offsets.map((o) => {
      const p = path(pts.map(([x, z], k) => (k === 0 || k === pts.length - 1 ? [x, z] : [x + o, z + o]) as [number, number]));
      const geo = new THREE.TubeGeometry(p as unknown as T.Curve<T.Vector3>, 220, 0.028, 6);
      const m = new THREE.Mesh(geo, lineMat);
      m.geometry.setDrawRange(0, 0);
      routes.add(m);
      return m;
    });
    return (k: number) => meshes.forEach((m) => m.geometry.setDrawRange(0, Math.floor((m.geometry.index?.count ?? 0) * Math.max(0, Math.min(1, k)) / 6) * 6));
  };
  const order = route([[-2, 1.5], [-2, 0], [2.8, 0], [2.8, -3.6], [6, -3.6]]);
  const serve = route([[3.4, -1], [2.2, -1], [2.2, 0.6], [-1.4, 0.6]], [0]);
  const bill = route([[-2, 2.3], [-2, 3.6], [4.2, 3.6]], [-0.08, 0.08]);
  const insights = route([[5, 2.6], [5, 2.2], [-6.4, 2.2], [-6.4, -3.2]], [-0.08, 0.08]);

  return {
    root,
    layers: [
      { name: floor.name, group: floor },
      { name: furniture.name, group: furniture },
      { name: people.name, group: people },
      { name: kitchen.name, group: kitchen },
      { name: till.name, group: till },
      { name: office.name, group: office },
      { name: routes.name, group: routes },
    ],
    setRoutes: (p) => {
      order(p.order);
      serve(p.serve);
      bill(p.bill);
      insights(p.insights);
    },
    setInk: (ink, fill) => {
      edgeMat.color.set(ink);
      mats.forEach((m, key) => {
        if (look === "lines" && !key.endsWith("e")) (m as T.MeshBasicMaterial).color.set(fill);
      });
    },
    setScreens: (k) => {
      tickets.forEach((t, i) => (t.visible = k > i / tickets.length));
      bars.forEach((b) => {
        const h = Math.max(0.001, (b.userData.h as number) * k);
        b.scale.y = h;
        b.position.y = 1.0 - 0.25 + h / 2;
      });
      screen.visible = true;
    },
  };
}
