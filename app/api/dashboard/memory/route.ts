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

function artifactCount(job: Record<string, unknown>) {
  return Array.isArray(job.artifacts) ? job.artifacts.length : 0;
}

function pickRefreshedTokens(results: Array<{ tokenRefreshed: boolean; refreshedTokens?: AuthTokens }>) {
  return results.find((result) => result.tokenRefreshed)?.refreshedTokens;
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

    const overview = await fetchResource(
      request,
      `${apiBaseUrl}/v1/assistant/overview`,
      "Failed to fetch assistant overview",
    );
    const assistant =
      overview.status === "ok" && isRecord(overview.data) && isRecord(overview.data.assistant)
        ? overview.data.assistant
        : null;
    const agentId = assistant ? pickString(assistant, ["agent_id", "id"]) : null;

    const sessions = await fetchResource(
      request,
      agentId
        ? `${apiBaseUrl}/v1/sessions?agent_id=${encodeURIComponent(agentId)}`
        : `${apiBaseUrl}/v1/sessions`,
      "Failed to fetch assistant sessions",
    );
    const documentJobs = await fetchResource(
      request,
      `${apiBaseUrl}/v1/documents/jobs?limit=20`,
      "Failed to fetch document jobs",
    );
    const reasoningJobs = await fetchResource(
      request,
      `${apiBaseUrl}/v1/reasoning/jobs?limit=20`,
      "Failed to fetch reasoning jobs",
    );

    const sessionItems = normalizeCollection(sessions.data, ["sessions", "items", "data"]).filter(
      isRecord,
    );
    const documentItems = normalizeCollection(documentJobs.data, ["items", "data"]).filter(isRecord);
    const reasoningItems = normalizeCollection(reasoningJobs.data, ["items", "data"]).filter(isRecord);
    const partials = [
      "Memory inventory is read-only and derived from live sessions plus artifact-producing jobs.",
    ];

    if (overview.status !== "ok") partials.push(overview.error ?? "Assistant overview is unavailable.");
    if (sessions.status !== "ok") partials.push(sessions.error ?? "Session memory is unavailable.");
    if (documentJobs.status !== "ok") partials.push(documentJobs.error ?? "Document jobs are unavailable.");
    if (reasoningJobs.status !== "ok") partials.push(reasoningJobs.error ?? "Reasoning jobs are unavailable.");

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      assistant,
      summary: {
        sessions: sessionItems.length,
        activeSessions: sessionItems.filter((session) => Boolean(session.active)).length,
        documentJobs: documentItems.length,
        documentArtifacts: documentItems.reduce((sum, job) => sum + artifactCount(job), 0),
        reasoningJobs: reasoningItems.length,
        reasoningArtifacts: reasoningItems.reduce((sum, job) => sum + artifactCount(job), 0),
      },
      sessions: sessionItems,
      documentJobs: documentItems,
      reasoningJobs: reasoningItems,
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens ||
      pickRefreshedTokens([overview, sessions, documentJobs, reasoningJobs]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
