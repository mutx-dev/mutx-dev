#!/usr/bin/env npx tsx
/**
 * Dev file watcher for docs live reload.
 * Watches docs/, SUMMARY.md, agents/ for changes.
 * Triggers POST /api/docs/sync on the local dev server
 * so SSE clients get notified and auto-refresh.
 *
 * Run: npx tsx scripts/docs-watcher.ts
 * (or: npm run docs:watch if added to package.json)
 */

import fs from "fs";
import path from "path";
import http from "http";

const WATCH_DIRS = ["docs", "agents"];
const WATCH_FILES = ["SUMMARY.md"];
const DEBOUNCE_MS = 300;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingChanges: string[] = [];

function triggerSync(files: string[]) {
  const payload = JSON.stringify({ manual: true, files });

  const req = http.request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/docs/sync",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode < 300) {
          console.log(
            `[docs-watcher] Sync triggered (${files.length} files changed)`
          );
        } else {
          console.error(
            `[docs-watcher] Sync failed: ${res.statusCode} ${body}`
          );
        }
      });
    }
  );

  req.on("error", (err) => {
    // Dev server might not be running yet — that's fine
    console.error(`[docs-watcher] Dev server not reachable: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

function onChange(filePath: string) {
  const relative = path.relative(process.cwd(), filePath);
  pendingChanges.push(relative);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const files = [...pendingChanges];
    pendingChanges = [];
    debounceTimer = null;
    triggerSync(files);
  }, DEBOUNCE_MS);
}

function watchDir(dir: string) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`[docs-watcher] Skipping ${dir}/ — not found`);
    return;
  }

  fs.watch(fullPath, { recursive: true }, (event, filename) => {
    if (!filename) return;
    if (!filename.endsWith(".md") && !filename.endsWith(".json")) return;

    const filePath = path.join(fullPath, filename);
    if (!fs.existsSync(filePath)) return; // deleted

    onChange(filePath);
  });

  console.log(`[docs-watcher] Watching ${dir}/`);
}

function watchFile(file: string) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`[docs-watcher] Skipping ${file} — not found`);
    return;
  }

  fs.watch(fullPath, (event) => {
    if (event === "change") onChange(fullPath);
  });

  console.log(`[docs-watcher] Watching ${file}`);
}

console.log("[docs-watcher] Starting docs file watcher...");
for (const dir of WATCH_DIRS) watchDir(dir);
for (const file of WATCH_FILES) watchFile(file);
console.log("[docs-watcher] Ready. Edit docs files to trigger live reload.");
