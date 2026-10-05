#!/usr/bin/env node
/**
 * Copy React Bits components (TypeScript + Tailwind variant) into this project.
 *
 * Why not the official `npx shadcn add @react-bits/...`? It fetches from
 * reactbits.dev, which some environments (e.g. Claude Code cloud sessions)
 * cannot reach. This script reads the same registry JSON from a git clone of
 * github.com/DavidHDev/react-bits instead, so it only needs git + npm.
 *
 * Usage:
 *   node .claude/skills/react-bits/scripts/add.mjs BlurText SplashCursor [--dest src/components/react-bits] [--no-install] [--variant TS-TW]
 *   node .claude/skills/react-bits/scripts/add.mjs --list [filter]
 *
 * Env:
 *   REACT_BITS_DIR  path to an existing clone (default: ~/.cache/react-bits, cloned on first use)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_URL = "https://github.com/DavidHDev/react-bits";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const has = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
};

const dest = flag("--dest") ?? "src/components/react-bits";
const variant = flag("--variant") ?? "TS-TW";
const noInstall = has("--no-install");
const list = has("--list");

function ensureRepo() {
  const dir = process.env.REACT_BITS_DIR ?? path.join(os.homedir(), ".cache", "react-bits");
  if (fs.existsSync(path.join(dir, "public", "r"))) return dir;
  console.error(`Cloning ${REPO_URL} into ${dir} (shallow)…`);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  execFileSync("git", ["clone", "--depth", "1", REPO_URL, dir], {
    stdio: "inherit",
    env: { ...process.env, GIT_LFS_SKIP_SMUDGE: "1" },
  });
  return dir;
}

const repo = ensureRepo();
const registryDir = path.join(repo, "public", "r");

if (list) {
  const filter = (args[0] ?? "").toLowerCase();
  const names = fs
    .readdirSync(registryDir)
    .filter((f) => f.endsWith(`-${variant}.json`))
    .map((f) => JSON.parse(fs.readFileSync(path.join(registryDir, f), "utf8")))
    .filter((d) => !filter || `${d.title} ${d.description}`.toLowerCase().includes(filter));
  for (const d of names) console.log(`${d.title.padEnd(24)} ${d.description}`);
  process.exit(0);
}

if (args.length === 0) {
  console.error("Usage: add.mjs <Component> [...more] [--dest dir] [--no-install] | --list [filter]");
  process.exit(1);
}

const deps = new Set();
let copiedAny = false;

for (const name of args) {
  const file = path.join(registryDir, `${name}-${variant}.json`);
  if (!fs.existsSync(file)) {
    const close = fs
      .readdirSync(registryDir)
      .filter((f) => f.endsWith(`-${variant}.json`) && f.toLowerCase().includes(name.toLowerCase()))
      .map((f) => f.replace(`-${variant}.json`, ""));
    console.error(`✗ ${name}: not found.${close.length ? ` Did you mean: ${close.join(", ")}?` : ""}`);
    process.exitCode = 1;
    continue;
  }
  const item = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const f of item.files) {
    const out = path.join(dest, f.path);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, f.content);
    console.log(`✓ ${out}`);
  }
  for (const d of item.dependencies ?? []) deps.add(d);
  for (const r of item.registryDependencies ?? []) console.warn(`! ${name} also needs registry item: ${r}`);
  copiedAny = true;
}

if (copiedAny) {
  // The React Bits license (MIT + Commons Clause) requires keeping its notice with the copied code.
  const license = path.join(repo, "LICENSE.md");
  if (fs.existsSync(license)) fs.copyFileSync(license, path.join(dest, "LICENSE.md"));
}

if (deps.size) {
  const list = [...deps];
  if (noInstall) {
    console.log(`\nInstall dependencies with:\n  npm install ${list.join(" ")}`);
  } else {
    console.log(`\nInstalling: ${list.join(" ")}`);
    execFileSync("npm", ["install", ...list], { stdio: "inherit" });
  }
}
