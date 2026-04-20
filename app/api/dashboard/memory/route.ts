import { NextRequest, NextResponse } from "next/server";

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

function summarizeJobResult(job: Record<string, unknown>) {
  if (!isRecord(job.result_summary)) {
    return null;
  }

  return (
    (pickString(job.result_summary, ["headline", "summary", "status", "result"]) ??
      Object.entries(job.result_summary)
        .slice(0, 2)
        .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
        .join(" · ")) ||
    null
  );
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

    const [overview, sessions, documents, reasoning] = await Promise.all([
      fetchResource(request, `${apiBaseUrl}/v1/assistant/overview`, "Failed to fetch assistant overview"),
      fetchResource(request, `${apiBaseUrl}/v1/sessions?limit=18`, "Failed to fetch sessions"),
      fetchResource(request, `${apiBaseUrl}/v1/documents/jobs?limit=10`, "Failed to fetch document jobs"),
      fetchResource(request, `${apiBaseUrl}/v1/reasoning/jobs?limit=10`, "Failed to fetch reasoning jobs"),
    ]);

    const assistant =
      overview.status === "ok" && isRecord(overview.data) && isRecord(overview.data.assistant)
        ? overview.data.assistant
        : null;

    const sessionRecords = normalizeCollection(sessions.data, ["sessions", "items", "data"])
      .filter(isRecord)
      .map((session, index) => ({
        id:
          pickString(session, ["id", "session_id", "key"]) ??
          `session-${index + 1}`,
        label:
          pickString(session, ["agent", "assistant", "display_name", "name"]) ??
          "Context session",
        source: pickString(session, ["source"]) ?? "gateway",
        channel: pickString(session, ["channel"]) ?? "unassigned",
        active: Boolean(session.active),
        kind: pickString(session, ["kind", "type"]) ?? "session",
        model: pickString(session, ["model"]) ?? "unknown model",
        lastActivity: toIsoTimestamp(session.last_activity ?? session.lastActivity),
        flags: Array.isArray(session.flags)
          ? session.flags.filter(
              (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
            )
          : [],
      }));

    const sourceCounts = new Map<string, number>();
    for (const session of sessionRecords) {
      sourceCounts.set(session.source, (sourceCounts.get(session.source) ?? 0) + 1);
    }

    const documentJobs = normalizeCollection(documents.data, ["items", "data"])
      .filter(isRecord)
      .map((job) => ({
        id: pickString(job, ["id"]) ?? "document-job",
        templateId: pickString(job, ["template_id"]) ?? "unknown-template",
        status: pickString(job, ["status"]) ?? "unknown",
        executionMode: pickString(job, ["execution_mode"]) ?? "managed",
        artifacts: Array.isArray(job.artifacts) ? job.artifacts.length : 0,
        createdAt: toIsoTimestamp(job.created_at),
        updatedAt: toIsoTimestamp(job.updated_at),
        resultSummary: summarizeJobResult(job),
        errorMessage: pickString(job, ["error_message"]),
      }));

    const reasoningJobs = normalizeCollection(reasoning.data, ["items", "data"])
      .filter(isRecord)
      .map((job) => ({
        id: pickString(job, ["id"]) ?? "reasoning-job",
        templateId: pickString(job, ["template_id"]) ?? "unknown-template",
        status: pickString(job, ["status"]) ?? "unknown",
        executionMode: pickString(job, ["execution_mode"]) ?? "managed",
        artifacts: Array.isArray(job.artifacts) ? job.artifacts.length : 0,
        createdAt: toIsoTimestamp(job.created_at),
        updatedAt: toIsoTimestamp(job.updated_at),
        resultSummary: summarizeJobResult(job),
        errorMessage: pickString(job, ["error_message"]),
      }));

    const partials: string[] = [
      "Retention, deletion, and retrieval controls are still absent from the backend contract, so this surface is intentionally read-only.",
    ];

    if (overview.status !== "ok") {
      partials.push(overview.error ?? "Assistant workspace detail is unavailable.");
    }
    if (sessions.status !== "ok") {
      partials.push(sessions.error ?? "Session context inventory is unavailable.");
    }
    if (documents.status !== "ok") {
      partials.push(documents.error ?? "Document job inventory is unavailable.");
    }
    if (reasoning.status !== "ok") {
      partials.push(reasoning.error ?? "Reasoning job inventory is unavailable.");
    }

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      assistant: assistant
        ? {
            name: pickString(assistant, ["name"]) ?? "Assistant",
            workspace: pickString(assistant, ["workspace"]) ?? "default",
            status: pickString(assistant, ["status"]) ?? "unknown",
          }
        : null,
      summary: {
        sessions: sessionRecords.length,
        activeSessions: sessionRecords.filter((session) => session.active).length,
        sources: sourceCounts.size,
        documentJobs: documentJobs.length,
        documentArtifacts: documentJobs.reduce((sum, job) => sum + job.artifacts, 0),
        reasoningJobs: reasoningJobs.length,
        reasoningArtifacts: reasoningJobs.reduce((sum, job) => sum + job.artifacts, 0),
      },
      sessions: sessionRecords,
      sources: Array.from(sourceCounts.entries()).map(([source, count]) => ({
        source,
        count,
      })),
      documents: documentJobs,
      reasoning: reasoningJobs,
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens || pickRefreshedTokens([overview, sessions, documents, reasoning]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
