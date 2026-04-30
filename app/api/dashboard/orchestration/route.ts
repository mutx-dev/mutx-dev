import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from "@/app/api/_lib/controlPlane";
import { unauthorized, withErrorHandling } from "@/app/api/_lib/errors";

export const dynamic = "force-dynamic";

type AuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type ResourceStatus = "ok" | "auth_error" | "error";

type ResourceResult = {
  status: ResourceStatus;
  statusCode: number;
  data: unknown | null;
  error: string | null;
  tokenRefreshed: boolean;
  refreshedTokens?: AuthTokens;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCollection(payload: unknown, keys: string[] = ["items", "data", "sessions"]) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function toIsoTimestamp(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  return null;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const detail = payload.detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  const error = payload.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

async function fetchResource(
  request: NextRequest,
  url: string,
  fallbackMessage: string,
): Promise<ResourceResult> {
  const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(request, url, {
    cache: "no-store",
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  return {
    status: response.ok
      ? "ok"
      : response.status === 401 || response.status === 403
        ? "auth_error"
        : "error",
    statusCode: response.status,
    data: response.ok ? payload : null,
    error: response.ok ? null : extractErrorMessage(payload, fallbackMessage),
    tokenRefreshed,
    refreshedTokens,
  };
}

function pickRefreshedTokens(results: Array<{ tokenRefreshed: boolean; refreshedTokens?: AuthTokens }>) {
  return results.find((result) => result.tokenRefreshed)?.refreshedTokens;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readAutonomySnapshot() {
  if (process.env.NODE_ENV !== "development") {
    return {
      available: false,
      error: "Autonomy queue data is local-only and not available in this shell.",
      data: null as null | {
        queued: number;
        running: number;
        parked: number;
        completed: number;
        activeRunners: number;
      },
    };
  }

  const repoRoot = process.env.MUTX_REPO_ROOT || "/Users/fortune/MUTX";
  const autonomyDir = path.join(repoRoot, ".autonomy");
  const queue = await readJsonFile<{ items?: Array<{ status?: string }> }>(
    path.join(repoRoot, "mutx-engineering-agents/dispatch/action-queue.json"),
    { items: [] },
  );
  const daemon = await readJsonFile<{ active_runners?: unknown[] }>(
    path.join(autonomyDir, "daemon-status.json"),
    {},
  );

  const items = Array.isArray(queue.items) ? queue.items : [];
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.status || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    available: true,
    error: null,
    data: {
      queued: counts.queued ?? 0,
      running: counts.running ?? 0,
      parked: counts.parked ?? 0,
      completed: counts.completed ?? 0,
      activeRunners: Array.isArray(daemon.active_runners) ? daemon.active_runners.length : 0,
    },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized();
    }

    const apiBaseUrl = getApiBaseUrl();
    const authResponse = await authenticatedFetch(request, `${apiBaseUrl}/v1/auth/me`, {
      cache: "no-store",
    });
    const authPayload = await authResponse.response
      .json()
      .catch(() => ({ detail: "Failed to fetch current operator" }));

    if (!authResponse.response.ok) {
      const nextResponse = NextResponse.json(authPayload, {
        status: authResponse.response.status,
      });

      if (authResponse.tokenRefreshed && authResponse.refreshedTokens) {
        applyAuthCookies(nextResponse, request, authResponse.refreshedTokens);
      }

      return nextResponse;
    }

    const [approvals, runs, sessions, blueprints, autonomy] = await Promise.all([
      fetchResource(request, `${apiBaseUrl}/v1/approvals?status=PENDING&limit=12`, "Failed to fetch approvals"),
      fetchResource(request, `${apiBaseUrl}/v1/runs?limit=18`, "Failed to fetch runs"),
      fetchResource(request, `${apiBaseUrl}/v1/sessions?limit=18`, "Failed to fetch sessions"),
      fetchResource(request, `${apiBaseUrl}/v1/swarms/blueprints`, "Failed to fetch swarm blueprints"),
      readAutonomySnapshot(),
    ]);

    const approvalItems = normalizeCollection(approvals.data, ["items", "data"])
      .filter(isRecord)
      .map((approval) => ({
        id: pickString(approval, ["id"]) ?? "approval",
        agentId: pickString(approval, ["agent_id"]),
        actionType: pickString(approval, ["action_type"]) ?? "approval",
        requester: pickString(approval, ["requester"]) ?? "operator",
        status: pickString(approval, ["status"]) ?? "PENDING",
        createdAt: toIsoTimestamp(approval.created_at),
      }))
      .filter((approval) => approval.status.toUpperCase() === "PENDING");

    const runRecoveries = normalizeCollection(runs.data, ["items", "data"])
      .filter(isRecord)
      .map((run) => {
        const status = pickString(run, ["status"]) ?? "unknown";
        return {
          id: pickString(run, ["id"]) ?? "run",
          kind: "run" as const,
          title:
            pickString(run, ["subject_label", "agent_id"]) ??
            "Execution recovery",
          detail:
            pickString(run, ["error_message", "output_text"]) ??
            `Run status: ${status}`,
          status,
          createdAt: toIsoTimestamp(run.completed_at ?? run.started_at ?? run.created_at),
          href: "/dashboard/runs",
        };
      })
      .filter((run) => ["failed", "error"].includes(run.status.toLowerCase()));

    const sessionRecoveries = normalizeCollection(sessions.data, ["sessions", "items", "data"])
      .filter(isRecord)
      .filter((session) => !session.active)
      .map((session, index) => ({
        id: pickString(session, ["id", "session_id", "key"]) ?? `session-${index + 1}`,
        kind: "session" as const,
        title:
          pickString(session, ["agent", "assistant", "name"]) ??
          "Inactive session",
        detail:
          pickString(session, ["source", "channel"]) ??
          "Session is present but not currently active.",
        status: "inactive",
        createdAt: toIsoTimestamp(session.last_activity ?? session.lastActivity),
        href: "/dashboard/sessions",
      }));

    const recoveries = [...runRecoveries, ...sessionRecoveries]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 12);

    const blueprintItems = normalizeCollection(blueprints.data, ["items", "data"])
      .filter(isRecord)
      .map((blueprint) => ({
        id: pickString(blueprint, ["id"]) ?? "blueprint",
        name: pickString(blueprint, ["name"]) ?? "Blueprint",
        summary: pickString(blueprint, ["summary"]) ?? "Coordination blueprint",
        recommendedAgents: `${blueprint.recommended_min_agents ?? 1}-${blueprint.recommended_max_agents ?? 1}`,
        roles: Array.isArray(blueprint.roles) ? blueprint.roles.length : 0,
        tags: Array.isArray(blueprint.tags)
          ? blueprint.tags.filter(
              (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
            )
          : [],
      }));

    const partials: string[] = [
      "This board is intentionally read-only until MUTX exposes first-class orchestration entities and write controls.",
    ];

    if (approvals.status !== "ok") {
      partials.push(approvals.error ?? "Approval queue detail is unavailable.");
    }
    if (runs.status !== "ok") {
      partials.push(runs.error ?? "Run recovery detail is unavailable.");
    }
    if (sessions.status !== "ok") {
      partials.push(sessions.error ?? "Session recovery detail is unavailable.");
    }
    if (blueprints.status !== "ok") {
      partials.push(blueprints.error ?? "Swarm blueprint inventory is unavailable.");
    }
    if (!autonomy.available && autonomy.error) {
      partials.push(autonomy.error);
    }

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        pendingApprovals: approvalItems.length,
        recoveryWatch: recoveries.length,
        blueprints: blueprintItems.length,
        queuedAutonomy: autonomy.data?.queued ?? null,
        runningAutonomy: autonomy.data?.running ?? null,
      },
      approvals: approvalItems,
      recoveries,
      blueprints: blueprintItems,
      autonomy: autonomy.available ? autonomy.data : null,
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens || pickRefreshedTokens([approvals, runs, sessions, blueprints]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
