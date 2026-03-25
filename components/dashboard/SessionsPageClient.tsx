"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiRequestError, normalizeCollection, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

import type { components } from "@/app/types/api";

type AssistantOverviewEnvelope = components["schemas"]["AssistantOverviewEnvelope"];
type AssistantOverview = components["schemas"]["AssistantOverviewResponse"];

interface SessionRecord {
  id: string;
  key: string;
  agent: string;
  kind: string;
  age: string;
  model: string;
  tokens: string;
  channel: string;
  flags: string[];
  active: boolean;
  source: string;
  startTime: string | null;
  lastActivity: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function pickString(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

function pickBoolean(record: Record<string, unknown>, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
}

function pickStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    }
  }

  return [];
}

function toIsoTimestamp(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  return null;
}

function normalizeSession(session: Record<string, unknown>, index: number): SessionRecord {
  const id =
    pickString(session, ["id", "session_id", "key"], `session-${index + 1}`) || `session-${index + 1}`;

  return {
    id,
    key: pickString(session, ["key", "session_key"], id),
    agent: pickString(session, ["agent", "assistant", "assistant_name"], "Assistant session"),
    kind: pickString(session, ["kind", "type"], "session"),
    age: pickString(session, ["age"], "n/a"),
    model: pickString(session, ["model"], "unknown model"),
    tokens: pickString(session, ["tokens"], "n/a"),
    channel: pickString(session, ["channel"], "unassigned"),
    flags: pickStringArray(session, ["flags"]),
    active: pickBoolean(session, ["active"], false),
    source: pickString(session, ["source"], "gateway"),
    startTime: toIsoTimestamp(session.start_time),
    lastActivity: toIsoTimestamp(session.last_activity),
  };
}

function extractAssistantOverview(payload: unknown): AssistantOverview | null {
  if (!isRecord(payload)) return null;

  const { assistant } = payload as AssistantOverviewEnvelope;
  return assistant ?? null;
}

export function SessionsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [assistant, setAssistant] = useState<AssistantOverview | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setError(null);

      try {
        await readJson<Record<string, unknown>>("/api/auth/me");

        const [sessionsResult, overviewResult] = await Promise.allSettled([
          readJson<unknown>("/api/dashboard/sessions"),
          readJson<unknown>("/api/dashboard/assistant/overview"),
        ]);

        if (cancelled) return;

        if (sessionsResult.status === "rejected") {
          throw sessionsResult.reason;
        }

        const nextSessions = normalizeCollection<Record<string, unknown>>(sessionsResult.value, [
          "sessions",
          "items",
          "data",
        ])
          .map(normalizeSession)
          .sort((left, right) => {
            const leftTime = left.lastActivity ? new Date(left.lastActivity).getTime() : 0;
            const rightTime = right.lastActivity ? new Date(right.lastActivity).getTime() : 0;
            return rightTime - leftTime;
          });

        setSessions(nextSessions);
        setAssistant(
          overviewResult.status === "fulfilled" ? extractAssistantOverview(overviewResult.value) : null,
        );
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;

        if (isAuthError(loadError)) {
          setAuthRequired(true);
        } else {
          setError(loadError instanceof Error ? loadError.message : "Failed to load sessions");
        }
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.active).length,
    [sessions],
  );
  const channels = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.channel).filter(Boolean))),
    [sessions],
  );
  const sources = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.source).filter(Boolean))),
    [sessions],
  );

  if (loading) return <LiveLoading title="Sessions" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect assistant sessions, channel activity, and gateway availability."
      />
    );
  }
  if (error) return <LiveErrorState title="Session surface unavailable" message={error} />;

  const enabledChannels = assistant?.channels?.filter((channel) => channel.enabled).length ?? 0;
  const gatewayStatus = assistant?.gateway.status ?? "unknown";

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Live sessions"
          value={String(sessions.length)}
          detail={`${activeSessions} sessions currently marked active.`}
          status={asDashboardStatus(activeSessions > 0 ? "running" : "idle")}
        />
        <LiveStatCard
          label="Channels"
          value={String(Math.max(channels.length, enabledChannels))}
          detail={
            assistant
              ? `${enabledChannels} enabled OpenClaw channels on ${assistant.workspace}.`
              : "Channel coverage appears here when assistant overview is available."
          }
        />
        <LiveStatCard
          label="Sources"
          value={String(sources.length)}
          detail={
            sources.length > 0
              ? `${sources.join(", ")} are currently represented in the session feed.`
              : "No session sources were returned yet."
          }
        />
        <LiveStatCard
          label="Gateway"
          value={gatewayStatus}
          detail={
            assistant?.gateway.gateway_url
              ? assistant.gateway.gateway_url
              : "Gateway URL has not been synced into the web surface yet."
          }
          status={asDashboardStatus(gatewayStatus)}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <LivePanel title="Session registry" meta={`${sessions.length} records`}>
          {sessions.length === 0 ? (
            <LiveEmptyState
              title="No sessions discovered yet"
              message="Once your OpenClaw runtime or other session sources report activity, live sessions will appear here."
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{session.agent}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.channel} · {session.kind} · {session.model}
                      </p>
                    </div>
                    <StatusBadge
                      status={session.active ? "running" : "idle"}
                      label={session.active ? "active" : "idle"}
                    />
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <div>source {session.source}</div>
                    <div>tokens {session.tokens}</div>
                    <div>age {session.age}</div>
                    <div>
                      last activity {session.lastActivity ? formatRelativeTime(session.lastActivity) : "Not recorded"}
                    </div>
                  </div>

                  {session.flags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {session.flags.map((flag) => (
                        <span
                          key={`${session.id}-${flag}`}
                          className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <LivePanel title="Gateway posture" meta={assistant ? assistant.runtime : "assistant overview"}>
          {!assistant ? (
            <LiveEmptyState
              title="Assistant overview not returned"
              message="The assistant overview route has not reported a tracked OpenClaw assistant for this operator yet."
            />
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{assistant.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{assistant.assistant_id}</p>
                  </div>
                  <StatusBadge status={asDashboardStatus(gatewayStatus)} label={gatewayStatus} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Workspace
                  </p>
                  <p className="mt-2 text-sm text-white">{assistant.workspace}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Session count
                  </p>
                  <p className="mt-2 text-sm text-white">{assistant.session_count}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Gateway URL
                  </p>
                  <p className="mt-2 break-all text-sm text-white">
                    {assistant.gateway.gateway_url || "Not synced"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Last activity
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {assistant.last_activity ? formatDateTime(assistant.last_activity) : "Not recorded"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Enabled channels
                </p>
                <p className="mt-2 text-sm text-white">
                  {enabledChannels > 0
                    ? assistant.channels
                        ?.filter((channel) => channel.enabled)
                        .map((channel) => channel.label)
                        .join(", ")
                    : "No enabled channels reported yet."}
                </p>
              </div>
            </div>
          )}
        </LivePanel>
      </div>
    </div>
  );
}
