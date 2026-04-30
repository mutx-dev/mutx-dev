import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from "@/app/api/_lib/controlPlane";
import { unauthorized, withErrorHandling } from "@/app/api/_lib/errors";

export const dynamic = "force-dynamic";

type DashboardStatus = "idle" | "running" | "success" | "warning" | "error";

type ResourceStatus = "ok" | "auth_error" | "error";

type AuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type ResourceResult = {
  status: ResourceStatus;
  statusCode: number;
  data: unknown | null;
  error: string | null;
  tokenRefreshed: boolean;
  refreshedTokens?: AuthTokens;
};

type NotificationItem = {
  id: string;
  kind: "alert" | "approval" | "webhook" | "governance" | "runtime";
  title: string;
  detail: string;
  status: DashboardStatus;
  createdAt: string | null;
  source: string;
  href: string | null;
  meta: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
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

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
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

  if (isRecord(error)) {
    const nestedMessage = error.message;
    if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
      return nestedMessage;
    }
  }

  return fallback;
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

function asDashboardStatus(value: string | null | undefined): DashboardStatus {
  const normalized = (value ?? "").toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("success") ||
    normalized.includes("approved") ||
    normalized.includes("resolved") ||
    normalized.includes("active")
  ) {
    return "success";
  }

  if (
    normalized.includes("running") ||
    normalized.includes("pending") ||
    normalized.includes("queued")
  ) {
    return "running";
  }

  if (
    normalized.includes("warn") ||
    normalized.includes("defer") ||
    normalized.includes("stale")
  ) {
    return "warning";
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("deny") ||
    normalized.includes("error") ||
    normalized.includes("forbidden")
  ) {
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

function mapAlertItems(payload: unknown) {
  return normalizeCollection(payload, ["items", "alerts", "data"])
    .filter(isRecord)
    .map((alert) => ({
      id: pickString(alert, ["id"]) ?? `alert-${Math.random().toString(36).slice(2, 8)}`,
      kind: "alert" as const,
      title: pickString(alert, ["message"]) ?? "Alert requires review",
      detail: pickString(alert, ["type"]) ?? "Monitoring alert",
      status: pickString(alert, ["resolved"]) === "true" ? "success" : "error",
      createdAt: toIsoTimestamp(alert.created_at),
      source: "monitoring",
      href: "/dashboard/monitoring",
      meta: pickString(alert, ["agent_id"]),
      resolved: Boolean(alert.resolved),
    }))
    .filter((item) => !item.resolved);
}

function mapApprovalItems(payload: unknown) {
  return normalizeCollection(payload, ["items", "data"])
    .filter(isRecord)
    .map((approval) => {
      const status = pickString(approval, ["status"]) ?? "PENDING";
      return {
        id: pickString(approval, ["id"]) ?? `approval-${Math.random().toString(36).slice(2, 8)}`,
        kind: "approval" as const,
        title: pickString(approval, ["action_type"]) ?? "Approval request",
        detail:
          pickString(approval, ["requester"]) ??
          pickString(approval, ["agent_id"]) ??
          "Approval requires operator attention.",
        status: asDashboardStatus(status),
        createdAt: toIsoTimestamp(approval.created_at),
        source: "approvals",
        href: "/dashboard/orchestration",
        meta: pickString(approval, ["agent_id"]),
        approvalStatus: status,
      };
    })
    .filter((item) => (item.approvalStatus ?? "").toUpperCase() === "PENDING");
}

function mapRuntimeItems(payload: unknown) {
  return asArray(payload)
    .filter(isRecord)
    .map((agent) => {
      const status = pickString(agent, ["status"]) ?? "unknown";
      return {
        id: pickString(agent, ["agent_id"]) ?? `runtime-${Math.random().toString(36).slice(2, 8)}`,
        kind: "runtime" as const,
        title: pickString(agent, ["agent_id"]) ?? "Supervised runtime",
        detail:
          pickString(agent, ["error", "policy_name"]) ??
          `Supervisor status: ${status}`,
        status: asDashboardStatus(status),
        createdAt: toIsoTimestamp(agent.started_at),
        source: "runtime supervision",
        href: "/dashboard/security",
        meta: pickString(agent, ["pid"]),
        runtimeStatus: status,
      };
    })
    .filter((item) => !["running", "active", "healthy"].includes((item.runtimeStatus ?? "").toLowerCase()));
}

function mapGovernanceItem(payload: unknown): NotificationItem | null {
  if (!isRecord(payload)) return null;

  const pendingApprovals = pickNumber(payload, ["pending_approvals"]);
  const status = pickString(payload, ["status"]) ?? "unknown";

  if ((pendingApprovals ?? 0) === 0 && status.toLowerCase() === "healthy") {
    return null;
  }

  return {
    id: "governance-status",
    kind: "governance",
    title: "Governance runtime posture",
    detail:
      pendingApprovals && pendingApprovals > 0
        ? `${pendingApprovals} approval decision${pendingApprovals === 1 ? "" : "s"} waiting in governance.`
        : `Runtime governance status: ${status}.`,
    status: asDashboardStatus(
      pendingApprovals && pendingApprovals > 0 ? "pending" : status,
    ),
    createdAt: null,
    source: "governance",
    href: "/dashboard/security",
    meta: pickString(payload, ["policy_name"]),
  };
}

function mapWebhookItems(deliveries: Array<Record<string, unknown>>) {
  return deliveries.map((delivery) => ({
    id: pickString(delivery, ["id"]) ?? `webhook-${Math.random().toString(36).slice(2, 8)}`,
    kind: "webhook" as const,
    title: pickString(delivery, ["event"]) ?? "Webhook delivery failed",
    detail:
      pickString(delivery, ["error_message"]) ??
      (pickNumber(delivery, ["status_code"]) ? `HTTP ${pickNumber(delivery, ["status_code"])}` : "Delivery failed"),
    status: "error" as const,
    createdAt: toIsoTimestamp(delivery.created_at ?? delivery.delivered_at),
    source: "webhooks",
    href: "/dashboard/webhooks",
    meta: pickString(delivery, ["webhook_url", "webhook_id"]),
  }));
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

    const [alerts, approvals, governance, supervised, webhooks] = await Promise.all([
      fetchResource(
        request,
        `${apiBaseUrl}/v1/monitoring/alerts?limit=12`,
        "Failed to fetch alerts",
      ),
      fetchResource(
        request,
        `${apiBaseUrl}/v1/approvals?status=PENDING&limit=12`,
        "Failed to fetch approvals",
      ),
      fetchResource(
        request,
        `${apiBaseUrl}/v1/runtime/governance/status`,
        "Failed to fetch governance runtime status",
      ),
      fetchResource(
        request,
        `${apiBaseUrl}/v1/runtime/governance/supervised/`,
        "Failed to fetch supervised runtime status",
      ),
      fetchResource(request, `${apiBaseUrl}/v1/webhooks`, "Failed to fetch webhooks"),
    ]);

    const webhooksList = normalizeCollection(webhooks.data, ["items", "webhooks", "data"])
      .filter(isRecord)
      .filter((webhook) => Boolean(webhook.is_active))
      .slice(0, 8);

    const deliveryResults = await Promise.all(
      webhooksList.map(async (webhook) => {
        const webhookId = pickString(webhook, ["id"]);
        if (!webhookId) {
          return null;
        }

        const result = await fetchResource(
          request,
          `${apiBaseUrl}/v1/webhooks/${webhookId}/deliveries?success=false&limit=2`,
          "Failed to fetch webhook deliveries",
        );

        return {
          webhookId,
          webhookUrl: pickString(webhook, ["url"]),
          result,
        };
      }),
    );

    const alertItems = mapAlertItems(alerts.data);
    const approvalItems = mapApprovalItems(approvals.data);
    const runtimeItems = supervised.status === "ok" ? mapRuntimeItems(supervised.data) : [];
    const governanceItem = governance.status === "ok" ? mapGovernanceItem(governance.data) : null;

    const webhookDeliveries = deliveryResults
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .flatMap(({ webhookId, webhookUrl, result }) => {
        if (result.status !== "ok") {
          return [];
        }

        return normalizeCollection(result.data, ["items", "deliveries", "data"])
          .filter(isRecord)
          .filter((delivery) => delivery.success === false)
          .map((delivery) => ({
            ...delivery,
            webhook_id: webhookId,
            webhook_url: webhookUrl,
          }));
      });

    const webhookItems = mapWebhookItems(webhookDeliveries);
    const items = [
      ...alertItems,
      ...approvalItems,
      ...runtimeItems,
      ...webhookItems,
      ...(governanceItem ? [governanceItem] : []),
    ].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });

    const partials: string[] = [
      "Governance notifications are summarized from runtime status because the backend does not expose a decision-by-decision event feed yet.",
    ];

    if (governance.status !== "ok") {
      partials.push(
        governance.error ??
          "Governance runtime detail is unavailable for this operator session.",
      );
    }

    if (supervised.status !== "ok") {
      partials.push(
        supervised.error ??
          "Supervised runtime incidents are unavailable for this operator session.",
      );
    }

    for (const deliveryResult of deliveryResults) {
      if (deliveryResult?.result.status && deliveryResult.result.status !== "ok") {
        partials.push(
          deliveryResult.result.error ??
            `Webhook delivery history for ${deliveryResult.webhookId} is unavailable.`,
        );
      }
    }

    const governancePending = governance.status === "ok" && isRecord(governance.data)
      ? pickNumber(governance.data, ["pending_approvals"])
      : null;

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        alerts: alertItems.length,
        approvals: approvalItems.length,
        webhookFailures: webhookItems.length,
        runtimeIncidents: runtimeItems.length,
        governancePendingApprovals: governancePending,
      },
      items,
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens ||
      pickRefreshedTokens([
        alerts,
        approvals,
        governance,
        supervised,
        webhooks,
        ...deliveryResults
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          .map((entry) => entry.result),
      ]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
