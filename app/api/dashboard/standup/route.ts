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
type DashboardStatus = "idle" | "running" | "success" | "warning" | "error";

type ResourceResult = {
  status: ResourceStatus;
  statusCode: number;
  data: unknown | null;
  error: string | null;
  tokenRefreshed: boolean;
  refreshedTokens?: AuthTokens;
};

type BriefItem = {
  id: string;
  title: string;
  detail: string;
  status: DashboardStatus;
  createdAt: string | null;
  source: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCollection(payload: unknown, keys: string[] = ["items", "data"]) {
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

function asDashboardStatus(value: string | null | undefined): DashboardStatus {
  const normalized = (value ?? "").toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("success") ||
    normalized.includes("approved") ||
    normalized.includes("completed")
  ) {
    return "success";
  }

  if (normalized.includes("running") || normalized.includes("pending")) {
    return "running";
  }

  if (normalized.includes("warn") || normalized.includes("queued") || normalized.includes("stale")) {
    return "warning";
  }

  if (normalized.includes("fail") || normalized.includes("deny") || normalized.includes("error")) {
    return "error";
  }

  return "idle";
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

async function readAutonomyBacklog() {
  if (process.env.NODE_ENV !== "development") {
    return { count: null as number | null, note: "Autonomy backlog is local-only in this shell." };
  }

  const repoRoot = process.env.MUTX_REPO_ROOT || "/Users/fortune/MUTX";
  const queue = await readJsonFile<{ items?: Array<{ status?: string }> }>(
    path.join(repoRoot, "mutx-engineering-agents/dispatch/action-queue.json"),
    { items: [] },
  );
  const items = Array.isArray(queue.items) ? queue.items : [];
  return {
    count: items.filter((item) => item.status === "queued" || item.status === "running").length,
    note: null as string | null,
  };
}

async function loadWebhookFailures(
  request: NextRequest,
  apiBaseUrl: string,
): Promise<{
  items: BriefItem[];
  errors: string[];
  tokenResults: ResourceResult[];
}> {
  const webhookList = await fetchResource(request, `${apiBaseUrl}/v1/webhooks`, "Failed to fetch webhooks");
  if (webhookList.status !== "ok") {
    return {
      items: [],
      errors: [webhookList.error ?? "Webhook inventory is unavailable."],
      tokenResults: [webhookList],
    };
  }

  const activeWebhooks = normalizeCollection(webhookList.data, ["items", "webhooks", "data"])
    .filter(isRecord)
    .filter((webhook) => Boolean(webhook.is_active))
    .slice(0, 6);

  const deliveries = await Promise.all(
    activeWebhooks.map(async (webhook) => {
      const webhookId = pickString(webhook, ["id"]);
      if (!webhookId) return null;
      const result = await fetchResource(
        request,
        `${apiBaseUrl}/v1/webhooks/${webhookId}/deliveries?success=false&limit=1`,
        "Failed to fetch webhook deliveries",
      );
      return { webhookId, url: pickString(webhook, ["url"]), result };
    }),
  );

  const items = deliveries
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .flatMap(({ webhookId, url, result }) => {
      if (result.status !== "ok") {
        return [];
      }

      return normalizeCollection(result.data, ["items", "deliveries", "data"])
        .filter(isRecord)
        .filter((delivery) => delivery.success === false)
        .map((delivery) => ({
          id: pickString(delivery, ["id"]) ?? `webhook-${webhookId}`,
          title: pickString(delivery, ["event"]) ?? "Webhook delivery failed",
          detail:
            pickString(delivery, ["error_message"]) ??
            (pickString(delivery, ["status_code"]) ? `HTTP ${pickString(delivery, ["status_code"])}` : url ?? "Webhook route"),
          status: "error" as const,
          createdAt: toIsoTimestamp(delivery.created_at ?? delivery.delivered_at),
          source: "webhooks",
        }));
    });

  const errors = deliveries
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .flatMap((entry) => (entry.result.status === "ok" ? [] : [entry.result.error ?? "Webhook delivery history is unavailable."]));

  return {
    items,
    errors,
    tokenResults: [
      webhookList,
      ...deliveries
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .map((entry) => entry.result),
    ],
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

    const [alerts, approvals, runs, autonomy] = await Promise.all([
      fetchResource(request, `${apiBaseUrl}/v1/monitoring/alerts?limit=10`, "Failed to fetch alerts"),
      fetchResource(request, `${apiBaseUrl}/v1/approvals?status=PENDING&limit=10`, "Failed to fetch approvals"),
      fetchResource(request, `${apiBaseUrl}/v1/runs?limit=16`, "Failed to fetch runs"),
      readAutonomyBacklog(),
    ]);
    const webhookFailures = await loadWebhookFailures(request, apiBaseUrl);

    const blockers: BriefItem[] = [
      ...normalizeCollection(alerts.data, ["items", "data"])
        .filter(isRecord)
        .filter((alert) => !alert.resolved)
        .map((alert) => ({
          id: pickString(alert, ["id"]) ?? "alert",
          title: pickString(alert, ["message"]) ?? "Alert requires review",
          detail: pickString(alert, ["type"]) ?? "Monitoring alert",
          status: "error" as const,
          createdAt: toIsoTimestamp(alert.created_at),
          source: "alerts",
        })),
      ...normalizeCollection(approvals.data, ["items", "data"])
        .filter(isRecord)
        .map((approval) => ({
          id: pickString(approval, ["id"]) ?? "approval",
          title: pickString(approval, ["action_type"]) ?? "Pending approval",
          detail:
            pickString(approval, ["requester"]) ??
            pickString(approval, ["agent_id"]) ??
            "Approval requires an operator decision.",
          status: "warning" as const,
          createdAt: toIsoTimestamp(approval.created_at),
          source: "approvals",
        })),
      ...webhookFailures.items,
    ]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 12);

    const watchlist: BriefItem[] = normalizeCollection(runs.data, ["items", "data"])
      .filter(isRecord)
      .map((run) => {
        const status = pickString(run, ["status"]) ?? "unknown";
        return {
          id: pickString(run, ["id"]) ?? "run",
          title:
            pickString(run, ["subject_label", "agent_id"]) ??
            "Execution watch item",
          detail:
            pickString(run, ["error_message"]) ??
            `Run status: ${status}`,
          status: asDashboardStatus(status),
          createdAt: toIsoTimestamp(run.completed_at ?? run.started_at ?? run.created_at),
          source: "runs",
          runStatus: status,
        };
      })
      .filter((item) => ["failed", "error", "running", "queued", "created"].includes((item.runStatus ?? "").toLowerCase()))
      .map(({ runStatus: _runStatus, ...item }) => item)
      .slice(0, 10);

    const completions: BriefItem[] = normalizeCollection(runs.data, ["items", "data"])
      .filter(isRecord)
      .map((run) => {
        const status = pickString(run, ["status"]) ?? "unknown";
        return {
          id: pickString(run, ["id"]) ?? "run",
          title:
            pickString(run, ["subject_label", "agent_id"]) ??
            "Completed run",
          detail:
            pickString(run, ["output_text"]) ??
            `Run status: ${status}`,
          status: "success" as const,
          createdAt: toIsoTimestamp(run.completed_at ?? run.started_at ?? run.created_at),
          source: "runs",
          runStatus: status,
        };
      })
      .filter((item) => item.runStatus?.toLowerCase() === "completed")
      .map(({ runStatus: _runStatus, ...item }) => item)
      .slice(0, 6);

    const focus =
      blockers.length > 0
        ? `Clear ${blockers.length} blocking signal${blockers.length === 1 ? "" : "s"} before opening new operator lanes.`
        : watchlist.length > 0
          ? `Review ${watchlist.length} live or failed execution signal${watchlist.length === 1 ? "" : "s"} next.`
          : completions.length > 0
            ? `No urgent blockers detected. Review ${completions.length} recent completion${completions.length === 1 ? "" : "s"} and close the loop.`
            : "No urgent signals detected across the current dashboard feeds.";

    const partials: string[] = [];
    if (alerts.status !== "ok") {
      partials.push(alerts.error ?? "Alert coverage is unavailable.");
    }
    if (approvals.status !== "ok") {
      partials.push(approvals.error ?? "Approval coverage is unavailable.");
    }
    if (runs.status !== "ok") {
      partials.push(runs.error ?? "Run coverage is unavailable.");
    }
    partials.push(...webhookFailures.errors);
    if (autonomy.note) {
      partials.push(autonomy.note);
    }

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      focus,
      metrics: {
        openAlerts: blockers.filter((item) => item.source === "alerts").length,
        pendingApprovals: blockers.filter((item) => item.source === "approvals").length,
        failedRuns: watchlist.filter((item) => item.status === "error").length,
        queuedAutonomy: autonomy.count,
      },
      blockers,
      watchlist,
      completions,
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens ||
      pickRefreshedTokens([alerts, approvals, runs, ...webhookFailures.tokenResults]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
