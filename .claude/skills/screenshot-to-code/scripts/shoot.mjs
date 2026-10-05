#!/usr/bin/env node
/**
 * Full-page desktop + mobile screenshots of a URL, for comparing a build
 * against a reference design.
 *
 * Usage: node shoot.mjs <url> [outDir]
 *
 * Needs the `playwright` package (`npm install -D playwright` if missing).
 * In cloud sessions Chromium is already at /opt/pw-browsers (used as a fallback).
 */
import fs from "node:fs";
import path from "node:path";

const [url, outDir = "screenshots"] = process.argv.slice(2);
if (!url) {
  console.error("Usage: node shoot.mjs <url> [outDir]");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright is not installed. Run: npm install -D playwright");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// Cloud sessions pre-install one Chromium build; if the project's playwright
// version expects a different revision, fall back to that binary.
const PREINSTALLED = "/opt/pw-browsers/chromium";
let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  if (!fs.existsSync(PREINSTALLED)) throw err;
  browser = await chromium.launch({ executablePath: PREINSTALLED });
}
const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

for (const [name, vp] of Object.entries(viewports)) {
  const { width, height, ...rest } = vp;
  const page = await browser.newPage({ viewport: { width, height }, ...rest });
  await page.goto(url, { waitUntil: "networkidle" });
  // Let entrance animations settle before capturing.
  await page.waitForTimeout(1500);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`✓ ${file}`);
  await page.close();
}

await browser.close();
