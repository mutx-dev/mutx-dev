import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getDocSitemapRoutes } from "./docs";

// ── Types ──────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  pulled: boolean;
  commit: string | null;
  changedFiles: string[];
  docRoutes: string[];
  error?: string;
}

export interface SyncLogEntry {
  timestamp: string;
  trigger: "webhook" | "cron" | "manual";
  beforeCommit: string | null;
  afterCommit: string | null;
  pulled: boolean;
  changedFiles: string[];
  docRoutes: string[];
  durationMs: number;
  error?: string;
}

// ── Mutex + Dedup ──────────────────────────────────────

let syncLock = false;
let lastSyncedCommit: string | null = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

// Circular buffer of recent sync logs (last 50)
const syncLog: SyncLogEntry[] = [];
const MAX_LOG_ENTRIES = 50;

// SSE broadcaster — set by the events route
let broadcastFn: ((files: string[]) => void) | null = null;

export function setBroadcaster(fn: (files: string[]) => void) {
  broadcastFn = fn;
}

// ── Git helpers ────────────────────────────────────────

function getHeadCommit(): string | null {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function getBranch(): string | null {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

function gitPull(): {
  pulled: boolean;
  changedFiles: string[];
  error?: string;
} {
  const before = getHeadCommit();

  try {
    const output = execSync("git pull --ff-only", {
      encoding: "utf-8",
      timeout: 30_000,
    }).trim();

    if (output.includes("Already up to date")) {
      return { pulled: false, changedFiles: [] };
    }

    const after = getHeadCommit();

    if (before && after && before !== after) {
      const diffOutput = execSync(
        `git diff --name-only ${before}..${after}`,
        { encoding: "utf-8", timeout: 10_000 }
      ).trim();
      const changedFiles = diffOutput.split("\n").filter(Boolean);
      return { pulled: true, changedFiles };
    }

    // Pull succeeded but diff unclear — treat as changed
    return { pulled: true, changedFiles: ["unknown"] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { pulled: false, changedFiles: [], error: msg };
  }
}

// ── Change detection ───────────────────────────────────

function filterDocChanges(files: string[]): string[] {
  return files.filter((f) => {
    if (f.startsWith("docs/")) return true;
    if (f === "SUMMARY.md") return true;
    if (f.startsWith("agents/")) return true;
    return false;
  });
}

// ── Logging ────────────────────────────────────────────

function log(entry: SyncLogEntry) {
  syncLog.push(entry);
  if (syncLog.length > MAX_LOG_ENTRIES) syncLog.shift();

  // Structured log to stdout (Railway captures this)
  const level = entry.error ? "ERROR" : entry.pulled ? "INFO" : "DEBUG";
  console.log(
    `[docs-sync] ${level} trigger=${entry.trigger} ` +
      `before=${entry.beforeCommit?.slice(0, 7) ?? "none"} ` +
      `after=${entry.afterCommit?.slice(0, 7) ?? "none"} ` +
      `pulled=${entry.pulled} files=${entry.changedFiles.length} ` +
      `routes=${entry.docRoutes.length} dur=${entry.durationMs}ms` +
      (entry.error ? ` err=${entry.error}` : "")
  );
}

// ── Alerting ───────────────────────────────────────────

async function alertFailure(entry: SyncLogEntry) {
  const webhookUrl = process.env.DOCS_SYNC_ALERT_WEBHOOK;
  if (!webhookUrl) return;

  try {
    const message = {
      content:
        `[docs-sync] ${consecutiveFailures} consecutive failures. ` +
        `Last error: ${entry.error}. ` +
        `Commit: ${entry.afterCommit?.slice(0, 7) ?? "unknown"}`,
    };
    execSync(
      `curl -sfS -X POST -H 'Content-Type: application/json' ` +
        `-d '${JSON.stringify(message).replace(/'/g, "'\\''")}' ` +
        `'${webhookUrl}'`,
      { timeout: 5_000 }
    );
  } catch {
    // Alert delivery is best-effort
  }
}

// ── Search index rebuild ───────────────────────────────

function rebuildSearchIndex() {
  try {
    execSync("npx tsx scripts/build-docs-search-index.ts", {
      encoding: "utf-8",
      timeout: 60_000,
      cwd: process.cwd(),
    });
    console.log("[docs-sync] Search index rebuilt");
  } catch (err) {
    console.error("[docs-sync] Search index rebuild failed:", err);
  }
}

// ── Core sync function ─────────────────────────────────

export async function syncDocsFromGit(
  trigger: "webhook" | "cron" | "manual" = "manual"
): Promise<SyncResult> {
  // Mutex — prevent concurrent syncs
  if (syncLock) {
    return {
      success: true,
      pulled: false,
      commit: getHeadCommit(),
      changedFiles: [],
      docRoutes: [],
      error: "sync in progress",
    };
  }

  syncLock = true;
  const startTime = Date.now();

  try {
    const beforeCommit = getHeadCommit();

    // Dedup — if we already synced this exact commit, skip
    if (beforeCommit === lastSyncedCommit && trigger !== "manual") {
      return {
        success: true,
        pulled: false,
        commit: beforeCommit,
        changedFiles: [],
        docRoutes: [],
      };
    }

    const result = gitPull();

    if (result.error) {
      consecutiveFailures++;
      const entry: SyncLogEntry = {
        timestamp: new Date().toISOString(),
        trigger,
        beforeCommit,
        afterCommit: getHeadCommit(),
        pulled: false,
        changedFiles: [],
        docRoutes: [],
        durationMs: Date.now() - startTime,
        error: result.error,
      };
      log(entry);

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        alertFailure(entry);
      }

      return {
        success: false,
        pulled: false,
        commit: getHeadCommit(),
        changedFiles: [],
        docRoutes: [],
        error: result.error,
      };
    }

    // Reset failure counter on success
    consecutiveFailures = 0;

    if (!result.pulled) {
      lastSyncedCommit = beforeCommit;
      const entry: SyncLogEntry = {
        timestamp: new Date().toISOString(),
        trigger,
        beforeCommit,
        afterCommit: beforeCommit,
        pulled: false,
        changedFiles: [],
        docRoutes: [],
        durationMs: Date.now() - startTime,
      };
      log(entry);

      return {
        success: true,
        pulled: false,
        commit: beforeCommit,
        changedFiles: [],
        docRoutes: [],
      };
    }

    // New commits pulled — detect doc changes
    const afterCommit = getHeadCommit();
    lastSyncedCommit = afterCommit;

    const docChanges = filterDocChanges(result.changedFiles);
    const affectedRoutes =
      docChanges.length > 0 ? getDocSitemapRoutes() : [];

    const entry: SyncLogEntry = {
      timestamp: new Date().toISOString(),
      trigger,
      beforeCommit,
      afterCommit,
      pulled: true,
      changedFiles: result.changedFiles,
      docRoutes: affectedRoutes,
      durationMs: Date.now() - startTime,
    };
    log(entry);

    // Async rebuild search index if docs changed
    if (docChanges.length > 0) {
      // Fire and forget — don't block the response
      setTimeout(() => rebuildSearchIndex(), 100);

      // Notify SSE clients (dev mode)
      if (broadcastFn) {
        broadcastFn(docChanges);
      }
    }

    return {
      success: true,
      pulled: true,
      commit: afterCommit,
      changedFiles: result.changedFiles,
      docRoutes: affectedRoutes,
    };
  } finally {
    syncLock = false;
  }
}

// ── Status ─────────────────────────────────────────────

export function getDocLastModified(filePath: string): string | null {
  try {
    const relative = path.relative(process.cwd(), filePath);
    const output = execSync(`git log -1 --format=%cI -- "${relative}"`, {
      encoding: "utf-8",
    }).trim();
    return output || null;
  } catch {
    try {
      const stat = fs.statSync(filePath);
      return stat.mtime.toISOString();
    } catch {
      return null;
    }
  }
}

export function getSyncStatus(): {
  branch: string | null;
  commit: string | null;
  docsCount: number;
  routesCount: number;
  lastSync: SyncLogEntry | null;
  consecutiveFailures: number;
} {
  const routes = getDocSitemapRoutes();
  const docsDir = path.join(process.cwd(), "docs");

  let docsCount = 0;
  try {
    const walkDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full);
        else if (entry.name.endsWith(".md")) docsCount++;
      }
    };
    walkDir(docsDir);
  } catch {
    // docs dir might not exist
  }

  return {
    branch: getBranch(),
    commit: getHeadCommit(),
    docsCount,
    routesCount: routes.length,
    lastSync: syncLog.length > 0 ? syncLog[syncLog.length - 1] : null,
    consecutiveFailures,
  };
}

export function getSyncLog(): SyncLogEntry[] {
  return [...syncLog];
}
