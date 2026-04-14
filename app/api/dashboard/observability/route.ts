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
    const [runsResult, telemetryConfigResult, telemetryHealthResult] = await Promise.all([
      fetchResource(request, targetUrl.toString(), "Failed to fetch observability runs"),
      fetchResource(
        request,
        `${apiBaseUrl}/v1/telemetry/config`,
        "Failed to fetch telemetry configuration",
      ),
      fetchResource(
        request,
        `${apiBaseUrl}/v1/telemetry/health`,
        "Failed to fetch telemetry health",
      ),
    ]);

    const refreshedTokens =
      runsResult.refreshedTokens ||
      telemetryConfigResult.refreshedTokens ||
      telemetryHealthResult.refreshedTokens;

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

    const nextResponse = NextResponse.json(
      {
        ...runsPayload,
        items: Array.isArray(runsPayload.items) ? runsPayload.items : [],
        telemetry: {
          config: telemetryConfigResult.response.ok ? telemetryConfigResult.payload : null,
          health: telemetryHealthResult.response.ok ? telemetryHealthResult.payload : null,
          errors: Object.keys(telemetryErrors).length > 0 ? telemetryErrors : null,
        },
      },
      { status: runsResult.response.status },
    );

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
