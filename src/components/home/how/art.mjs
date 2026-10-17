// "How it works" figure (Anatomy style): a small dish-scanning studio on a bench.
// 1 a camera photographs a burger on a turntable (24 photos, one per 15°),
// 2 a monitor builds the 3D model, 3 a printer issues the QR card,
// 4 a phone on a dock shows the dish on the table.
// Server-only: builds the static SVG once; HowItWorksLive moves the marked parts.
// Approved prototype and its standalone build: prototypes/how-it-works/.
import * as k from "../../iso/iso-kit.mjs";
import * as G from "../../iso/lathe.mjs";

const WIDTH = 640;
const HEIGHT = 360;
const AZIMUTH = 56;

// ---- world plan ------------------------------------------------------------
const PLATE = { x: -222, y: -54, w: 400, d: 98, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const PHOTOS = 24; // one photo per 15° of turntable
const TT = [-126, -3];
const PED_R = 37;
const PED_H = 7;
const PLAT_R = 32.5;
const PLAT_Z = PED_H;
const PLAT_TOP = PLAT_Z + 4;
const DISH_R = 20;
const DISH_TOP = PLAT_TOP + 1.4;

const CAM = [-194, 0];
const CAM_BODY = { x: -206, y: -14, w: 22, d: 28, r: 2.2 };
const CAM_Z = 38;
const CAM_TOP = 56;
const LENS_O = [CAM_BODY.x + CAM_BODY.w, 0, 47];

const MON_BASE = { x: -60, y: -34, w: 40, d: 22, r: 3 };
const MON_NECK = { x: -44, y: -28, w: 8, d: 6, r: 1.2 };
const MON = { x: -74, y: -22, w: 68, d: 6, r: 1.4 };
const MON_Z = 32;
const MON_H = 46;
const MON_FACE = MON.y + MON.d;

const PR_BACK = { x: 28, y: -20, w: 44, d: 17.4, r: 2 };
const PR_FRONT = { x: 28, y: -1, w: 44, d: 19, r: 2 };
const PR_BACK_H = 27;
const PR_H = 20;
const CARD = { x: 36, y: -2.6, w: 28, d: 1.2, r: 0.3 };
const CARD_H = 20;
const CARD_Z = 0;
const CARD_LIFT = 19.5;

const DOCK = { x: 122, y: -12, w: 36, d: 22, r: 3 };
const DOCK_H = 6;
const PHONE = { x: 127, y: -4, w: 26, d: 3, r: 2.2 };
const PHONE_TOP = 60;
const PHONE_FACE = PHONE.y + PHONE.d;
const LIP = { x: 125, y: -1, w: 30, d: 3.4, r: 1 };
const LIP_H = 4.6;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(MON, MON_Z, MON_Z + MON_H),
    ...k.boxCorners(CAM_BODY, 0, CAM_TOP + 5),
    ...k.boxCorners(PHONE, 0, PHONE_TOP),
    ...k.boxCorners(CARD, 0, CARD_Z + CARD_H + CARD_LIFT),
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const up = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const r1 = (v) => Math.round(v * 100) / 100;

// ---- base ------------------------------------------------------------------
const RULER = { x: -204, y: 33, w: 364, d: 6, r: 1 };
const LABEL = { x: 126, y: -46, w: 34, d: 15, r: 1.2 };

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  out.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([RULER.x + 2, RULER.y + 3.5, 0.6]), at([RULER.x + RULER.w - 2, RULER.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate with three rule lines and two screws
  out.push(S(k.slabOf(LABEL, 0, 0.8, P, 3, 0.4), { tone: "lo" }));
  for (let i = 0; i < 3; i++) {
    const y = LABEL.y + 4.5 + i * 3;
    out.push(L(k.lineOnTop([LABEL.x + 6, y], [LABEL.x + (i === 2 ? 20 : 28), y], 0.8, P), { tone: i ? "lo" : "mid", free: true }));
  }
  out.push(D([at([LABEL.x + 2.6, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.4 }));
  return out.join("");
}

// ---- data cables lying on the plate (flow when their stage is working) -----
const CABLE_Y = -45;
const CABLES = [
  [[CAM[0], -3, 0], [CAM[0], CABLE_Y, 0], [-50, CABLE_Y, 0], [-50, MON_BASE.y + 6, 0]],
  [[-30, MON_BASE.y + 6, 0], [-30, CABLE_Y, 0], [44, CABLE_Y, 0], [44, PR_BACK.y + 6, 0]],
];
function cables() {
  return CABLES.map((route, index) => {
    const pts = route.map(at);
    return `<g data-cable="${index}">${k.wireSvg(pts[0], pts[pts.length - 1], { via: pts.slice(1, -1), tone: "lo", ends: "none" })}${L(k.pathOf(pts), { tone: "mid", flow: true, className: "hw-flow" })}</g>`;
  }).join("");
}

// ---- 1 camera on a post ------------------------------------------------------
function camera() {
  const out = [];
  const [x, y] = CAM;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 9, y: y - 9, w: 18, d: 18, r: 9 }, 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.cylinder(x, y, 9, 0, 3, P, 40, 0.6), { tone: "mid" }));
  out.push(D(byDepth([[x - 5.5, y], [x + 5.5, y], [x, y - 5.5], [x, y + 5.5]]).map(([px, py]) => at([px, py, 3])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 2.6, 3, 15, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 4, 18, 6, P, 24, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 4, 18, 24, 24, P), { tone: "faint" }));
  // thumb screw on the collar
  out.push(S(k.slabOf({ x: x + 3.6, y: y - 1, w: 3, d: 2, r: 0.6 }, 20, 2, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x + 7.6, y, 1.8, 19.2, 3.6, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 2.6, 24, 11, P, 20), { tone: "mid", crease: "none" }));
  // tilt head
  out.push(S(k.slabOf({ x: x - 6, y: y - 6, w: 12, d: 12, r: 1.4 }, 35, 3, P, 3, 0.4), { tone: "mid" }));
  // body: the focus solid for stage 1
  out.push(`<g data-focus="0">${S(k.slabOf(CAM_BODY, CAM_Z, CAM_TOP - CAM_Z, P, 4, 0.8), {
    tone: "mid",
    inner: L(k.sideSeam(CAM_BODY, CAM_Z + 5, P, 4), { tone: "faint" }),
  })}</g>`);
  out.push(L(k.planOutline(k.insetPlan(CAM_BODY, 3), CAM_TOP, P, 3), { tone: "faint" }));
  // viewfinder hump, mode dial, shutter button, record lamp
  out.push(S(k.slabOf({ x: -201, y: -5, w: 11, d: 10, r: 1.4 }, CAM_TOP, 4.4, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(-199, -9.5, 3, CAM_TOP, 2.4, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(-199, -9.5, 3, CAM_TOP, CAM_TOP + 2.4, 22, P, 0.3), { tone: "lo" }));
  out.push(S(k.cylinder(-189, 9, 1.9, CAM_TOP, 1.6, P, 18), { tone: "hi" }));
  out.push(`<g data-part="lamp">${D([at([-187.5, 2.5, CAM_TOP])], { size: 0.85, tone: "lo" })}</g>`);
  // lens along +x
  const F = G.frameAlong(LENS_O, [1, 0, 0]);
  out.push(S(G.disc(0, 4, 8.4, F, P), { tone: "mid" }));
  out.push(S(G.disc(4, 12, 7.2, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 5.2, 10.8, 7.2, 40, P, { fade: [0.05, 0.45], seams: true }), { tone: "faint" }) }));
  out.push(S(G.disc(12, 15, 7.8, F, P), { tone: "mid" }));
  out.push(L(G.circleOf(F, 15, 5.6, P), { tone: "lo" }));
  out.push(L(G.circleOf(F, 15, 3.2, P), { tone: "faint" }));
  out.push(`<path data-part="flash" class="iso-line" data-tone="lit" d="${G.circleOf(F, 15, 6.8, P)}" style="opacity:0;stroke-width:1.2"/>`);
  return out.join("");
}

// ---- turntable with a burger -------------------------------------------------
const TICK_R = PED_R - 0.8;
function photoTick(index) {
  const angle = (index / PHOTOS) * Math.PI * 2;
  const len = index % 6 === 0 ? 3 : 1.8;
  const [cx, cy] = TT;
  const sx = Math.sin(angle);
  const sy = -Math.cos(angle);
  return k.lineOnTop([cx + sx * (TICK_R - len), cy + sy * (TICK_R - len)], [cx + sx * TICK_R, cy + sy * TICK_R], PED_H, P);
}
function turntableBase() {
  const out = [];
  const [x, y] = TT;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - PED_R, y: y - PED_R, w: PED_R * 2, d: PED_R * 2, r: PED_R }, 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.cylinder(x, y, PED_R, 0, PED_H, P, 72, 0.8), { tone: "mid", inner: L(k.sideArc(x, y, PED_R, 2.2, P, 40), { tone: "faint" }) }));
  // 24 photo ticks on the fixed ring; each darkens when its photo is taken
  for (let i = 0; i < PHOTOS; i++) out.push(`<path class="iso-line" data-tick="${i}" data-tone="faint" d="${photoTick(i)}"/>`);
  out.push(S(k.cylinder(x, y, PLAT_R, PLAT_Z, PLAT_TOP - PLAT_Z, P, 72, 0.6), { tone: "mid" }));
  out.push(L(k.knurl(x, y, PLAT_R, PLAT_Z, PLAT_TOP, 96, P, 0.6), { tone: "faint" }));
  out.push(L(k.ring(x, y, PLAT_R - 3.5, PLAT_TOP, P, 64), { tone: "faint" }));
  return out.join("");
}
const indexMark = (turn) => {
  const a = turn * Math.PI * 2;
  const [x, y] = TT;
  return k.lineOnTop([x + Math.sin(a) * (PLAT_R - 3.5), y - Math.cos(a) * (PLAT_R - 3.5)], [x + Math.sin(a) * (PLAT_R - 0.6), y - Math.cos(a) * (PLAT_R - 0.6)], PLAT_TOP, P);
};

const B = 1.32;
const BUN_Z = DISH_TOP;
const PATTY_Z = BUN_Z + 4.2 * B;
const CHEESE_Z = PATTY_Z + 3.6 * B;
const TOMATO_Z = CHEESE_Z + 0.8 * B;
const TOP_Z = TOMATO_Z + 1.6 * B;
const TOP_PROFILE = [[0, 9.8], [1.6, 10.1, 1], [4.4, 9.2, 1], [6.8, 7, 1], [8.6, 4, 1], [9.5, 0]].map(([a, b, c]) => (c ? [a * B, b * B, c] : [a * B, b * B]));
const CHEESE_HALF = 9.6 * B;

const cheeseRing = (turn) => {
  const a = turn * Math.PI * 2 + Math.PI / 7;
  const [x, y] = TT;
  // a square slice whose corners droop past the patty
  return [0, 1, 2, 3].map((i) => {
    const t = a + (i * Math.PI) / 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [x + CHEESE_HALF * (c - s), y + CHEESE_HALF * (s + c)];
  });
};

// sesame seeds on the dome, as (radius, angle, height) on the bun surface
const SEEDS = [];
for (let i = 0; i < 26; i++) {
  const s = (3.2 + ((i * 37) % 47) / 47 * 5) * B;
  const phi = i * 2.399;
  SEEDS.push([s, phi]);
}
const domeRadius = (s) => {
  for (let i = 1; i < TOP_PROFILE.length; i++) {
    const [s0, q0] = TOP_PROFILE[i - 1];
    const [s1, q1] = TOP_PROFILE[i];
    if (s <= s1) return q0 + ((s - s0) / (s1 - s0)) * (q1 - q0);
  }
  return 0;
};
const SEED_DATA = SEEDS.map(([s, phi]) => {
  const rr = domeRadius(s);
  const slope = (domeRadius(s + 0.2) - domeRadius(s - 0.2)) / 0.4;
  return [r1(rr), r1(phi), r1(TOP_Z + s), r1(slope)];
});

function burgerStatic() {
  const out = [];
  const [x, y] = TT;
  out.push(S(k.cylinder(x, y, DISH_R, PLAT_TOP, DISH_TOP - PLAT_TOP, P, 64, 0.4), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(x, y, DISH_R - 3.6, DISH_TOP, P, 56), { tone: "faint" }));
  out.push(S(G.solidOf([[0, 9], [1.4, 9.8, 1], [3.4, 9.8, 1], [4.2, 9.2]].map(([a, b, c]) => (c ? [a * B, b * B, c] : [a * B, b * B])), up([x, y, BUN_Z]), P), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(x, y, 10.6 * B, PATTY_Z, CHEESE_Z - PATTY_Z, P, 56), { tone: "hi", crease: "lo", inner: L(k.knurl(x, y, 10.6 * B, PATTY_Z, CHEESE_Z, 44, P, 0.5), { tone: "faint" }) + L(k.sideArc(x, y, 10.6 * B, PATTY_Z + 1.8 * B, P, 32), { tone: "lo" }) }));
  return out.join("");
}
const cheeseSvg = (turn) => S(k.extrude(cheeseRing(turn), CHEESE_Z, 0.8 * B, P), { tone: "hi", crease: "lo" });
function burgerTop() {
  const [x, y] = TT;
  return S(k.cylinder(x, y, 9.4 * B, TOMATO_Z, 1.6 * B, P, 48), { tone: "hi", crease: "lo" }) + S(G.solidOf(TOP_PROFILE, up([x, y, TOP_Z]), P), { tone: "hi", crease: "lo" });
}

// ---- 2 monitor -----------------------------------------------------------------
const SCREEN = { u0: 3, v0: 3, u1: MON.w - 3, v1: MON_H - 6 };
const monMatrix = k.sideMatrix([MON.x, MON_FACE], MON_Z + MON_H, P, "left");

// a front-view burger mesh, in screen units (u right, v down)
function burgerMesh(cx, base, scale) {
  const lines = [];
  const X = (u) => r1(cx + u * scale);
  const Y = (v) => r1(base - v * scale);
  const ell = (rx, h0, h1, steps = 24) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      pts.push([X(-rx * Math.cos(a)), Y(h0 + (h1 - h0) * Math.sin(a))]);
    }
    return pts;
  };
  const poly = (pts) => "M" + pts.map((p) => p.join(" ")).join("L");
  // dome: outline, latitudes and longitudes
  lines.push(poly(ell(14, 15, 26)));
  for (const f of [0.35, 0.65, 0.88]) {
    const h = 15 + 11 * f;
    const rx = 14 * Math.sqrt(1 - f * f);
    lines.push(poly([[X(-rx), Y(h)], [X(rx), Y(h)]]));
  }
  for (const q of [-0.72, -0.38, 0, 0.38, 0.72]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2);
      pts.push([X(14 * Math.cos(a) * q), Y(15 + 11 * Math.sin(a))]);
    }
    lines.push(poly(pts));
  }
  // cheese with drooping corners, tomato, patty, bottom bun
  lines.push(poly([[X(-14), Y(15)], [X(-17), Y(12.4)], [X(17), Y(12.4)], [X(14), Y(15)]]));
  lines.push(poly([[X(-13), Y(12.4)], [X(-13), Y(10.6)], [X(13), Y(10.6)], [X(13), Y(12.4)]]));
  lines.push(poly([[X(-15), Y(10.6)], [X(-15), Y(6.4)], [X(15), Y(6.4)], [X(15), Y(10.6)]]));
  for (const u of [-10, -5, 0, 5, 10]) lines.push(poly([[X(u), Y(10.6)], [X(u + 1.6), Y(6.4)]]));
  lines.push(poly([[X(-13.6), Y(6.4)], [X(-14.4), Y(3)], [X(-12.6), Y(0)], [X(12.6), Y(0)], [X(14.4), Y(3)], [X(13.6), Y(6.4)]]));
  for (const u of [-8, 0, 8]) lines.push(poly([[X(u - 1), Y(6.4)], [X(u + 1), Y(0)]]));
  return lines;
}
function burgerFill(cx, base, scale) {
  const X = (u) => r1(cx + u * scale);
  const Y = (v) => r1(base - v * scale);
  const dome = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    dome.push([X(-14 * Math.cos(a)), Y(15 + 11 * Math.sin(a))]);
  }
  const poly = (pts) => "M" + pts.map((p) => p.join(" ")).join("L") + "Z";
  return [
    ["bun", poly(dome)],
    ["cheese", poly([[X(-14), Y(15)], [X(-17), Y(12.4)], [X(17), Y(12.4)], [X(14), Y(15)]])],
    ["tomato", poly([[X(-13), Y(12.4)], [X(-13), Y(10.6)], [X(13), Y(10.6)], [X(13), Y(12.4)]])],
    ["patty", poly([[X(-15), Y(10.6)], [X(-15), Y(6.4)], [X(15), Y(6.4)], [X(15), Y(10.6)]])],
    ["bun", poly([[X(-13.6), Y(6.4)], [X(-14.4), Y(3)], [X(-12.6), Y(0)], [X(12.6), Y(0)], [X(14.4), Y(3)], [X(13.6), Y(6.4)]])],
  ];
}

function monitor() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(MON_BASE, 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(MON_BASE, 0, 3, P, 4, 0.6), { tone: "mid" }));
  out.push(D([[-55, -16], [-25, -16]].map(([px, py]) => at([px, py, 3])), { size: 0.4 }));
  out.push(S(k.slabOf(MON_NECK, 3, MON_Z + 8 - 3, P, 2, 0.3), { tone: "mid" }));
  out.push(`<g data-focus="1">${S(k.slabOf(MON, MON_Z, MON_H, P, 3, 0.6), { tone: "mid" })}</g>`);
  // screen, drawn in the plane of the front face
  const { u0, v0, u1, v1 } = SCREEN;
  const cx = (u0 + u1) / 2;
  const mesh = burgerMesh(cx, v1 - 9, 0.9)
    .map((d) => `<path class="iso-line hw-mesh" data-tone="mid" data-free="" d="${d}" style="opacity:0"/>`)
    .join("");
  const fill = burgerFill(cx, v1 - 9, 0.9)
    .map(([kind, d]) => `<path class="hw-${kind}" d="${d}"/>`)
    .join("");
  out.push(`<g transform="${monMatrix}">
    <defs><clipPath id="hw-mon-clip"><rect x="${u0}" y="${v0}" width="${u1 - u0}" height="${v1 - v0}" rx="1"/></clipPath></defs>
    <rect class="hw-screen" x="${u0}" y="${v0}" width="${u1 - u0}" height="${v1 - v0}" rx="1"/>
    <g clip-path="url(#hw-mon-clip)">
      <g data-part="model-fill" style="opacity:0">${fill}</g>
      <g data-part="mesh">${mesh}</g>
      <rect class="hw-bar" x="${u0 + 8}" y="${v1 - 4.6}" width="${u1 - u0 - 16}" height="1.6" rx="0.8"/>
      <rect data-part="bar" class="hw-bar-fill" x="${u0 + 8}" y="${v1 - 4.6}" width="0" height="1.6" rx="0.8"/>
    </g>
    <rect class="hw-screen-edge" x="${u0}" y="${v0}" width="${u1 - u0}" height="${v1 - v0}" rx="1"/>
    <circle class="hw-led" data-part="mon-led" cx="${u1 - 3}" cy="${(v1 + MON_H) / 2}" r="0.7"/>
  </g>`);
  return out.join("");
}

// ---- 3 printer with the QR table card ------------------------------------------
function qrModules(n = 21) {
  // finder squares in three corners, timing rows, and a fixed pseudo-random fill
  const on = [];
  const finder = (r, c) => r < 7 && c < 7 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const inF = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      let v;
      if (inF) v = finder(r % (n - 7) === r ? r : r - (n - 7), c < 8 ? c : c - (n - 7));
      else if (r === 6) v = c % 2 === 0;
      else if (c === 6) v = r % 2 === 0;
      else v = rand() > 0.52;
      if (inF && ((r === 7 || c === 7 || r === n - 8 || c === n - 8))) v = false;
      if (v) on.push([r, c]);
    }
  }
  return on;
}
function qrPath(x0, y0, size, n = 21) {
  const m = size / n;
  return qrModules(n)
    .map(([r, c]) => `M${r1(x0 + c * m)} ${r1(y0 + r * m)}h${r1(m)}v${r1(m)}h${r1(-m)}Z`)
    .join("");
}

function printerBack() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: 28, y: -20, w: 44, d: 38, r: 2 }, 0, PR_BACK_H, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(PR_BACK, 0, PR_BACK_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(PR_BACK, PR_BACK_H - 6, P, 3), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PR_BACK, 3), PR_BACK_H, P, 3), { tone: "faint" }));
  // paper roll cover hinge pins
  out.push(D([at([PR_BACK.x + 4, PR_BACK.y + 3, PR_BACK_H]), at([PR_BACK.x + PR_BACK.w - 4, PR_BACK.y + 3, PR_BACK_H])], { size: 0.45 }));
  return out.join("");
}
function card() {
  const face = CARD.y + CARD.d;
  const m = k.sideMatrix([CARD.x, face], CARD_Z + CARD_H, P, "left");
  return `<g data-part="card" transform="${k.translateAlong(P, [0, 0, 0])}"><g data-focus="2">${S(k.slabOf(CARD, CARD_Z, CARD_H, P, 2), { tone: "hi", crease: "lo" })}</g>
    <g transform="${m}">
      <path class="hw-qr" d="${qrPath(2.4, 2.2, 15.4)}"/>
      ${[0, 1, 2].map((i) => `<path class="iso-line" data-tone="${i ? "lo" : "mid"}" data-free="" d="M20 ${4 + i * 2.6}H${i === 2 ? 23.6 : 26}"/>`).join("")}
      <path class="iso-line" data-tone="faint" data-free="" d="M20 15.6H26"/>
    </g></g>`;
}
function printerFront() {
  const out = [];
  out.push(S(k.slabOf(PR_FRONT, 0, PR_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(PR_FRONT, 6, P, 3), { tone: "faint" }) }));
  // tear bar along the slot, buttons and status lamp
  out.push(S(k.slabOf({ x: 33, y: -0.6, w: 34, d: 2, r: 0.6 }, PR_H, 0.8, P, 2), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline({ x: 50, y: 5.5, w: 16, d: 9, r: 2 }, PR_H, P, 3), { tone: "faint" }));
  out.push(S(k.cylinder(61, 10, 2.4, PR_H, 1.2, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(54, 10, 1.6, PR_H, 1, P, 16), { tone: "mid" }));
  out.push(`<g data-part="pr-led">${D([at([36, 10, PR_H])], { size: 0.85, tone: "lo" })}</g>`);
  return out.join("");
}

// ---- 4 phone on a dock ------------------------------------------------------------
const phoneMatrix = k.sideMatrix([PHONE.x, PHONE_FACE], PHONE_TOP, P, "left");
function phone() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(DOCK, 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(DOCK, 0, DOCK_H, P, 4, 0.8), { tone: "mid" }));
  out.push(D([at([DOCK.x + 3.4, DOCK.y + DOCK.d - 3.4, DOCK_H]), at([DOCK.x + DOCK.w - 3.4, DOCK.y + DOCK.d - 3.4, DOCK_H])], { size: 0.45 }));
  out.push(`<g data-focus="3">${S(k.slabOf(PHONE, DOCK_H, PHONE_TOP - DOCK_H, P, 4, 0.5), { tone: "mid" })}</g>`);
  // side buttons on the +x edge
  out.push(S(k.slabOf({ x: PHONE.x + PHONE.w, y: -3, w: 0.6, d: 1.4, r: 0.2 }, 44, 6, P, 1), { tone: "mid", crease: "none" }));
  // screen in the face plane
  const W = PHONE.w;
  const H = PHONE_TOP - DOCK_H;
  const sx0 = 1.8, sx1 = W - 1.8, sy0 = 1.8, sy1 = H - LIP_H - 1;
  const cx = W / 2;
  const tableY = sy1 - 12;
  const brackets = (() => {
    const bx0 = cx - 10.4, bx1 = cx + 10.4, by0 = tableY - 17.5, by1 = tableY + 2.5, a = 2.6;
    return `M${bx0} ${by0 + a}V${by0}H${bx0 + a}M${bx1 - a} ${by0}H${bx1}V${by0 + a}M${bx1} ${by1 - a}V${by1}H${bx1 - a}M${bx0 + a} ${by1}H${bx0}V${by1 - a}`;
  })();
  const fill = burgerFill(0, 0, 0.56).map(([kind, d]) => `<path class="hw-${kind}" d="${d}"/>`).join("");
  const outline = burgerMesh(0, 0, 0.56).slice(0, 1).concat(burgerMesh(0, 0, 0.56).slice(9)).map((d) => `<path class="iso-line" data-tone="hi" data-free="" d="${d}" style="stroke-width:.5"/>`).join("");
  out.push(`<g transform="${phoneMatrix}">
    <defs><clipPath id="hw-phone-clip"><rect x="${sx0}" y="${sy0}" width="${sx1 - sx0}" height="${sy1 - sy0}" rx="2"/></clipPath></defs>
    <rect class="hw-screen" x="${sx0}" y="${sy0}" width="${sx1 - sx0}" height="${sy1 - sy0}" rx="2"/>
    <g clip-path="url(#hw-phone-clip)">
      <path class="hw-table" d="M${sx0} ${tableY - 6}L${sx1} ${tableY - 6}L${sx1} ${sy1}L${sx0} ${sy1}Z"/>
      <path class="iso-line" data-tone="faint" d="M${sx0} ${tableY - 6}H${sx1}"/>
      <ellipse class="hw-shadow" data-part="ar-shadow" cx="${cx}" cy="${tableY + 0.6}" rx="9" ry="1.6" style="opacity:0"/>
      <g data-part="ar-dish" transform="translate(${cx} ${tableY}) scale(0)">${fill}${outline}</g>
      <path data-part="ar-frame" class="iso-line" data-tone="lit" data-free="" d="${brackets}" style="opacity:0;stroke-width:.8"/>
    </g>
    <rect class="hw-screen-edge" x="${sx0}" y="${sy0}" width="${sx1 - sx0}" height="${sy1 - sy0}" rx="2"/>
    <rect class="hw-island" x="${cx - 3}" y="${sy0 + 1.4}" width="6" height="1.6" rx="0.8"/>
  </g>`);
  out.push(S(k.slabOf(LIP, DOCK_H, LIP_H, P, 2, 0.4), { tone: "mid" }));
  return out.join("");
}


const BODY = [
    base(),
    cables(),
    camera(),
    turntableBase(),
    `<path data-part="index" class="iso-line" data-tone="hi" d="${indexMark(0)}" style="stroke-width:1"/>`,
    burgerStatic(),
    `<g data-part="cheese">${cheeseSvg(0)}</g>`,
    burgerTop(),
    `<g data-part="seeds"></g>`,
    monitor(),
    printerBack(),
    card(),
    printerFront(),
    phone(),
  ].join("");

/** The figure's <svg>, with a translated accessible description. */
export const figureSvg = (label) => k.figureSvg({ width: WIDTH, height: HEIGHT, label, body: BODY });

/** What the live component needs to rebuild the turning parts (small, plain data). */
export const LIVE = { P, TT, PLAT_R, PLAT_TOP, CHEESE_Z, CHEESE_HALF, CHEESE_H: 0.8 * B, SEEDS: SEED_DATA, PHOTOS, CARD_LIFT };
