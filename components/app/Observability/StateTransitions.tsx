"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GitBranch,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Server,
  ArrowRight,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type DeploymentEventResponse = components["schemas"]["DeploymentEventResponse"];

interface StateTransitionsProps {
  deploymentId: string;
  title?: string;
}

const _EVENT_TYPES = [
  "created",
  "starting",
  "running",
  "stopping",
  "stopped",
  "restarting",
  "scaling",
  "failed",
  "healthy",
  "unhealthy",
] as const;

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) return "Never";

  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "Invalid";

  const diffMs = then - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return rtf.format(days, "day");
}

function getEventIcon(eventType: string, status: string) {
  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus === "success" || normalizedStatus === "healthy" || normalizedStatus === "running") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  if (normalizedStatus === "failed" || normalizedStatus === "error" || normalizedStatus === "unhealthy") {
    return <XCircle className="h-4 w-4 text-rose-400" />;
  }

  const normalizedEvent = eventType?.toLowerCase() ?? "";
  if (normalizedEvent === "created" || normalizedEvent === "healthy") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  if (normalizedEvent === "failed" || normalizedEvent === "error") {
    return <XCircle className="h-4 w-4 text-rose-400" />;
  }
  if (normalizedEvent === "starting" || normalizedEvent === "restarting" || normalizedEvent === "scaling") {
    return <RefreshCcw className="h-4 w-4 text-amber-400 animate-spin" />;
  }
  if (normalizedEvent === "stopping" || normalizedEvent === "stopped") {
    return <Clock className="h-4 w-4 text-slate-400" />;
  }

  return <Server className="h-4 w-4 text-cyan-400" />;
}

function getEventColor(eventType: string, status: string): string {
  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus === "success" || normalizedStatus === "healthy" || normalizedStatus === "running") {
    return "border-emerald-400/20 bg-emerald-400/5";
  }
  if (normalizedStatus === "failed" || normalizedStatus === "error" || normalizedStatus === "unhealthy") {
    return "border-rose-400/20 bg-rose-400/5";
  }

  const normalizedEvent = eventType?.toLowerCase() ?? "";
  if (normalizedEvent === "created" || normalizedEvent === "healthy") {
    return "border-emerald-400/20 bg-emerald-400/5";
  }
  if (normalizedEvent === "failed" || normalizedEvent === "error") {
    return "border-rose-400/20 bg-rose-400/5";
  }
  if (normalizedEvent === "starting" || normalizedEvent === "restarting" || normalizedEvent === "scaling") {
    return "border-amber-400/20 bg-amber-400/5";
  }
  if (normalizedEvent === "stopping" || normalizedEvent === "stopped") {
    return "border-slate-400/20 bg-slate-400/5";
  }

  return "border-cyan-400/20 bg-cyan-400/5";
}

function getStatusBadge(status?: string | null) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let tone = "bg-slate-400/10 text-slate-400 border-slate-400/20";

  if (normalized === "success" || normalized === "healthy" || normalized === "running") {
    tone = "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
  } else if (normalized === "failed" || normalized === "error" || normalized === "unhealthy") {
    tone = "bg-rose-400/10 text-rose-400 border-rose-400/20";
  } else if (normalized === "pending" || normalized === "starting" || normalized === "restarting") {
    tone = "bg-amber-400/10 text-amber-400 border-amber-400/20";
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

async function fetchEvents(deploymentId: string): Promise<DeploymentEventResponse[]> {
  const response = await fetch(`/deployments/${deploymentId}/events?limit=50`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  const data = await response.json();
  return data.items ?? [];
}

export function StateTransitions({
  deploymentId,
  title = "State Transitions",
}: StateTransitionsProps) {
  const [events, setEvents] = useState<DeploymentEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async function loadEvents() {
    if (!deploymentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchEvents(deploymentId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 10000);
    return () => clearInterval(interval);
  }, [deploymentId, loadEvents]);

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );

  return (
    <Card className="border border-white/5 bg-white/[0.01] p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-3 text-violet-400">
          <GitBranch className="h-5 w-5" />
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Deployment lifecycle events and state changes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-violet-400/10 px-2.5 py-1 text-[10px] font-medium text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Live
          </span>
          <button
            onClick={loadEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 border-b border-white/5 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          Loading events...
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <GitBranch className="mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No state transitions recorded</p>
          <p className="text-xs text-slate-600 mt-1">
            Events will appear once the deployment starts
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <div className="relative p-4">
            <div className="absolute left-[27px] top-8 bottom-4 w-px bg-gradient-to-b from-violet-400/30 via-violet-400/10 to-transparent" />

            <div className="space-y-4">
              {sortedEvents.map((event, index) => {
                const nextEvent = sortedEvents[index + 1];

                return (
                  <div key={event.id ?? `${event.created_at}-${index}`} className="relative flex gap-4">
                    <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-xl border ${getEventColor(event.event_type, event.status ?? "")}`}>
                      {getEventIcon(event.event_type, event.status ?? "")}
                    </div>

                    <div className="flex-1 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">
                          {event.event_type?.replace(/_/g, " ") ?? "Unknown event"}
                        </span>
                        {getStatusBadge(event.status)}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(event.created_at)}
                        </span>
                        {event.node_id && (
                          <span className="font-[family:var(--font-mono)]">
                            Node: {event.node_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      {event.error_message && (
                        <div className="mt-2 rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs text-rose-200">
                          <span className="font-medium">Error:</span> {event.error_message}
                        </div>
                      )}

                      {nextEvent && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <ArrowRight className="h-3 w-3" />
                          <span>
                            Next: {nextEvent.event_type?.replace(/_/g, " ") ?? "Unknown"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
