import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_DIR = resolve(ROOT, ".next");
const STANDALONE_DIR = resolve(BUILD_DIR, "standalone");
const STANDALONE_NEXT_DIR = resolve(STANDALONE_DIR, ".next");
const STATIC_SOURCE = resolve(BUILD_DIR, "static");
const STATIC_TARGET = resolve(STANDALONE_NEXT_DIR, "static");
const PUBLIC_SOURCE = resolve(ROOT, "public");
const PUBLIC_TARGET = resolve(STANDALONE_DIR, "public");

function resetTarget(targetPath) {
  rmSync(targetPath, { recursive: true, force: true });
  mkdirSync(dirname(targetPath), { recursive: true });
}

if (!existsSync(STANDALONE_DIR)) {
  throw new Error("Standalone build output not found. Run `npm run build` before `npm run start`.");
}

if (!existsSync(STATIC_SOURCE)) {
  throw new Error("Missing `.next/static`. Run `npm run build` before `npm run start`.");
}

resetTarget(STATIC_TARGET);
cpSync(STATIC_SOURCE, STATIC_TARGET, { recursive: true });

if (existsSync(PUBLIC_SOURCE)) {
  resetTarget(PUBLIC_TARGET);
  cpSync(PUBLIC_SOURCE, PUBLIC_TARGET, { recursive: true });
}

console.log("[prepare-standalone] copied .next/static and public into .next/standalone");
