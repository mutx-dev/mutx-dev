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

    const assistantRecord =
      overview.status === "ok" && isRecord(overview.data) && isRecord(overview.data.assistant)
        ? overview.data.assistant
        : null;
    const hasAssistant =
      overview.status === "ok" &&
      isRecord(overview.data) &&
      Boolean(overview.data.has_assistant) &&
      Boolean(assistantRecord);
    const agentId = assistantRecord ? pickString(assistantRecord, ["agent_id"]) : null;

    const [channelsResult, sessionsResult] = hasAssistant && agentId
      ? await Promise.all([
          fetchResource(
            request,
            `${apiBaseUrl}/v1/assistant/${agentId}/channels`,
            "Failed to fetch assistant channels",
          ),
          fetchResource(
            request,
            `${apiBaseUrl}/v1/sessions?agent_id=${encodeURIComponent(agentId)}`,
            "Failed to fetch assistant sessions",
          ),
        ])
      : [
          { status: "ok", statusCode: 200, data: null, error: null, tokenRefreshed: false } as ResourceResult,
          { status: "ok", statusCode: 200, data: null, error: null, tokenRefreshed: false } as ResourceResult,
        ];

    const channels = (
      channelsResult.status === "ok"
        ? normalizeCollection(channelsResult.data, ["items", "data"])
        : assistantRecord
          ? normalizeCollection(assistantRecord.channels, ["items", "data"])
          : []
    )
      .filter(isRecord)
      .map((channel) => {
        const channelId = pickString(channel, ["id"]) ?? "unknown";
        const sessions = normalizeCollection(sessionsResult.data, ["sessions", "items", "data"])
          .filter(isRecord)
          .filter((session) => pickString(session, ["channel"]) === channelId);
        const activeSessions = sessions.filter((session) => Boolean(session.active)).length;
        const latestActivity = sessions.reduce<string | null>((latest, session) => {
          const candidate = toIsoTimestamp(session.last_activity ?? session.lastActivity);
          if (!candidate) return latest;
          if (!latest) return candidate;
          return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
        }, null);
        const sources = Array.from(
          new Set(
            sessions
              .map((session) => pickString(session, ["source"]))
              .filter((value): value is string => Boolean(value)),
          ),
        );

        return {
          id: channelId,
          label: pickString(channel, ["label"]) ?? channelId,
          enabled: Boolean(channel.enabled),
          mode: pickString(channel, ["mode"]) ?? "unknown",
          allowFrom: Array.isArray(channel.allow_from)
            ? channel.allow_from.filter(
                (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
              )
            : [],
          sessionCount: sessions.length,
          activeSessions,
          latestActivity,
          sources,
        };
      });

    const sessionSourceMap = new Map<string, number>();
    for (const session of normalizeCollection(sessionsResult.data, ["sessions", "items", "data"]).filter(
      isRecord,
    )) {
      const source = pickString(session, ["source"]) ?? "unknown";
      sessionSourceMap.set(source, (sessionSourceMap.get(source) ?? 0) + 1);
    }

    const partials: string[] = [];

    if (overview.status !== "ok") {
      partials.push(overview.error ?? "Assistant overview is unavailable.");
    }

    if (hasAssistant && channelsResult.status !== "ok") {
      partials.push(
        channelsResult.error ??
          "Channel detail is unavailable, so the surface is falling back to assistant overview data.",
      );
    }

    if (hasAssistant && sessionsResult.status !== "ok") {
      partials.push(
        sessionsResult.error ??
          "Session activity is unavailable, so live channel counts are partial.",
      );
    }

    const nextResponse = NextResponse.json({
      generatedAt: new Date().toISOString(),
      hasAssistant,
      assistant: hasAssistant && assistantRecord
        ? {
            agentId,
            name: pickString(assistantRecord, ["name"]) ?? "Assistant",
            workspace: pickString(assistantRecord, ["workspace"]) ?? "default",
            status: pickString(assistantRecord, ["status"]) ?? "unknown",
            gatewayStatus: isRecord(assistantRecord.gateway)
              ? pickString(assistantRecord.gateway, ["status"]) ?? "unknown"
              : "unknown",
            gatewayUrl: isRecord(assistantRecord.gateway)
              ? pickString(assistantRecord.gateway, ["gateway_url"])
              : null,
            doctorSummary: isRecord(assistantRecord.gateway)
              ? pickString(assistantRecord.gateway, ["doctor_summary"]) ?? "No gateway doctor summary available."
              : "No gateway doctor summary available.",
            wakeups: Array.isArray(assistantRecord.wakeups) ? assistantRecord.wakeups : [],
          }
        : null,
      summary: {
        configuredChannels: channels.length,
        enabledChannels: channels.filter((channel) => channel.enabled).length,
        liveChannels: channels.filter((channel) => channel.activeSessions > 0).length,
        activeSessions: channels.reduce((sum, channel) => sum + channel.activeSessions, 0),
        sources: sessionSourceMap.size,
      },
      channels,
      sessionSources: Array.from(sessionSourceMap.entries()).map(([source, count]) => ({
        source,
        count,
      })),
      partials,
    });

    const refreshedTokens =
      authResponse.refreshedTokens ||
      pickRefreshedTokens([overview, channelsResult, sessionsResult]);

    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
