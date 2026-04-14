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

type ResourceFetchResult = {
  response: Response;
  payload: unknown;
  error: string | null;
  tokenRefreshed: boolean;
  refreshedTokens?: AuthTokens;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCollection(
  payload: unknown,
  keys: string[] = ["items", "sessions", "data"],
) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
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

function pickBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return false;
}

function toTimestamp(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  return null;
}

function summarizeSessions(payload: unknown) {
  const sessions = normalizeCollection(payload, ["sessions", "items", "data"]).filter(isRecord);
  const channels = new Set<string>();
  const sources = new Set<string>();
  let active = 0;
  let latestActivityAt: string | null = null;
  let latestTimestamp = 0;

  for (const session of sessions) {
    const channel = pickString(session, ["channel"]);
    if (channel) channels.add(channel);

    const source = pickString(session, ["source"]);
    if (source) sources.add(source);

    if (pickBoolean(session, ["active"])) {
      active += 1;
    }

    const timestamp = toTimestamp(session.last_activity ?? session.lastActivity);
    if (timestamp && timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
      latestActivityAt = new Date(timestamp).toISOString();
    }
  }

  return {
    total: sessions.length,
    active,
    channels: channels.size,
    sources: sources.size,
    latestActivityAt,
  };
}

function cloneRequestWithAccessToken(request: NextRequest, tokens: AuthTokens) {
  const headers = new Headers("headers" in request ? request.headers : undefined);
  headers.set("authorization", `Bearer ${tokens.access_token}`);

  return new NextRequest(request.url, {
    method: request.method || "GET",
    headers,
  });
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

  return fallback;
}

async function fetchResource(
  request: NextRequest,
  url: string,
  fallbackMessage: string,
): Promise<ResourceFetchResult> {
  const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(request, url, {
    cache: "no-store",
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  return {
    response,
    payload,
    error: response.ok ? null : extractErrorMessage(payload, fallbackMessage),
    tokenRefreshed,
    refreshedTokens,
  };
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized();
    }

    const targetUrl = new URL(`${getApiBaseUrl()}/v1/observability/runs`);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    if (!targetUrl.searchParams.has("limit")) {
      targetUrl.searchParams.set("limit", "50");
    }

    const apiBaseUrl = getApiBaseUrl();
    const runsResult = await fetchResource(
      request,
      targetUrl.toString(),
      "Failed to fetch observability runs",
    );
    const followupRequest = runsResult.refreshedTokens
      ? cloneRequestWithAccessToken(request, runsResult.refreshedTokens)
      : request;
    const [telemetryConfigResult, telemetryHealthResult, sessionsResult] = await Promise.all([
      fetchResource(
        followupRequest,
        `${apiBaseUrl}/v1/telemetry/config`,
        "Failed to fetch telemetry configuration",
      ),
      fetchResource(
        followupRequest,
        `${apiBaseUrl}/v1/telemetry/health`,
        "Failed to fetch telemetry health",
      ),
      fetchResource(
        followupRequest,
        `${apiBaseUrl}/v1/sessions?limit=100`,
        "Failed to fetch session summary",
      ),
    ]);

    const refreshedTokens =
      runsResult.refreshedTokens ||
      telemetryConfigResult.refreshedTokens ||
      telemetryHealthResult.refreshedTokens ||
      sessionsResult.refreshedTokens;

    if (!runsResult.response.ok) {
      const nextResponse = NextResponse.json(
        runsResult.payload ?? { detail: "Failed to fetch observability runs" },
        { status: runsResult.response.status },
      );

      if (refreshedTokens) {
        applyAuthCookies(nextResponse, request, refreshedTokens);
      }

      return nextResponse;
    }

    const runsPayload = isRecord(runsResult.payload) ? runsResult.payload : {};
    const telemetryErrors: Record<string, string> = {};

    if (telemetryConfigResult.error) {
      telemetryErrors.config = telemetryConfigResult.error;
    }

    if (telemetryHealthResult.error) {
      telemetryErrors.health = telemetryHealthResult.error;
    }

    if (sessionsResult.error) {
      telemetryErrors.sessions = sessionsResult.error;
    }

    const nextResponse = NextResponse.json(
      {
        ...runsPayload,
        items: Array.isArray(runsPayload.items) ? runsPayload.items : [],
        telemetry: {
          config: telemetryConfigResult.response.ok ? telemetryConfigResult.payload : null,
          health: telemetryHealthResult.response.ok ? telemetryHealthResult.payload : null,
          errors: Object.keys(telemetryErrors).length > 0 ? telemetryErrors : null,
        },
        sessionSummary: sessionsResult.response.ok ? summarizeSessions(sessionsResult.payload) : null,
        sessionSummaryError: sessionsResult.error ?? null,
      },
      { status: runsResult.response.status },
    );

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
