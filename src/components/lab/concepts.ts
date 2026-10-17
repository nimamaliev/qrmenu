import { PALETTES } from "./restaurant";
import type { ConceptConfig, StoryStep } from "./ConceptStory";

// Draft English copy for the previews only. Before launch, confirm which operations features are
// built (ordering from the phone, kitchen screen, bills, dashboard) and move the words to the dictionaries.
const steps: StoryStep[] = [
  { key: "scan", title: "Scan", text: "A guest scans the QR code on the table. Your menu opens in their browser, every dish in 3D." },
  { key: "order", title: "Order", text: "The order goes straight to the kitchen screen, with the table number on it." },
  { key: "kitchen", title: "Cook", text: "The kitchen sees what to cook next and how long each table has waited." },
  { key: "bill", title: "Pay", text: "The bill is ready when the table is. No waving, no waiting." },
  { key: "insights", title: "Know", text: "Every table, order and wait time adds up on your dashboard." },
];
const hero = { eyebrow: "QR menus · 3D dishes · One system", title: "One QR code runs the whole room", text: "From the guest's first scan to your end-of-day numbers, every step flows through one system." };
const apart = { title: "Take it apart, it's one system", text: "Guests, tables, kitchen, bills and your dashboard are layers of the same thing, so nothing gets lost between them." };

const paper = { bg: "#f2f0ec", fg: "#0d0c0b", muted: "#5f5e5c" };
export const CONCEPT_1: ConceptConfig = {
  look: "clay",
  palette: PALETTES.paper,
  ui: "list",
  hero,
  steps,
  apart,
  themes: [paper, paper, { ...paper, bg: "#f4e8df" }, { ...paper, bg: "#f5e6c8" }, paper, { ...paper, bg: "#e8e5df" }, paper, { bg: "#0d0c0b", fg: "#f2f0ec", muted: "#a9a6a1" }],
};

const cool = { bg: "#d3e0e9", fg: "#12202c", muted: "#4f6171" };
export const CONCEPT_2: ConceptConfig = { look: "clay", palette: PALETTES.cool, ui: "list", hero, steps, themes: [cool] };

const night = { bg: "#0d0c0b", fg: "#f2f0ec", muted: "#a9a6a1", ink: "#f2f0ec", fill: "#0d0c0b" };
export const CONCEPT_3: ConceptConfig = {
  look: "lines",
  palette: PALETTES.bold,
  ui: "poster",
  frame: true,
  hero,
  steps,
  apart,
  themes: [
    night,
    { bg: "#b83219", fg: "#f2f0ec", muted: "#f3d2c8", ink: "#f2f0ec", fill: "#b83219" },
    { bg: "#e9a23b", fg: "#0d0c0b", muted: "#4a3412", ink: "#0d0c0b", fill: "#e9a23b" },
    { bg: "#f2f0ec", fg: "#0d0c0b", muted: "#5f5e5c", ink: "#0d0c0b", fill: "#f2f0ec" },
    { bg: "#1f5c55", fg: "#f2f0ec", muted: "#bcd6d2", ink: "#f2f0ec", fill: "#1f5c55" },
    night,
    night,
    { bg: "#f2f0ec", fg: "#0d0c0b", muted: "#5f5e5c", ink: "#0d0c0b", fill: "#f2f0ec" },
  ],
};
