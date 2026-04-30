"use client";

import { useEffect, useState } from "react";
import { Database, FileStack, Sparkles } from "lucide-react";

import { ApiRequestError, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LiveMiniStat,
  LiveMiniStatGrid,
  LivePanel,
  LiveStatCard,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type MemoryPayload = {
  generatedAt: string;
  assistant: {
    name: string;
    workspace: string;
    status: string;
  } | null;
  summary: {
    sessions: number;
    activeSessions: number;
    sources: number;
    documentJobs: number;
    documentArtifacts: number;
    reasoningJobs: number;
    reasoningArtifacts: number;
  };
  sessions: Array<{
    id: string;
    label: string;
    source: string;
    channel: string;
    active: boolean;
    kind: string;
    model: string;
    lastActivity: string | null;
    flags: string[];
  }>;
  sources: Array<{ source: string; count: number }>;
  documents: Array<{
    id: string;
    templateId: string;
    status: string;
    executionMode: string;
    artifacts: number;
    createdAt: string | null;
    updatedAt: string | null;
    resultSummary: string | null;
    errorMessage: string | null;
  }>;
  reasoning: Array<{
    id: string;
    templateId: string;
    status: string;
    executionMode: string;
    artifacts: number;
    createdAt: string | null;
    updatedAt: string | null;
    resultSummary: string | null;
    errorMessage: string | null;
  }>;
  partials: string[];
};

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

export function MemoryPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MemoryPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setError(null);

      try {
        const response = await readJson<MemoryPayload>("/api/dashboard/memory");
        if (!cancelled) {
          setPayload(response);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (isAuthError(loadError)) {
            setAuthRequired(true);
          } else {
            setError(loadError instanceof Error ? loadError.message : "Failed to load memory");
          }
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LiveLoading title="Memory" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect session context, document artifacts, and reasoning outputs."
      />
    );
  }
  if (error) return <LiveErrorState title="Memory surface unavailable" message={error} />;
  if (!payload) {
    return (
      <LiveErrorState
        title="Memory surface unavailable"
        message="No memory payload was returned by the dashboard proxy."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Sessions"
          value={String(payload.summary.sessions)}
          detail={`${payload.summary.activeSessions} active context sessions are visible right now.`}
          status={payload.summary.activeSessions > 0 ? "running" : "idle"}
        />
        <LiveStatCard
          label="Sources"
          value={String(payload.summary.sources)}
          detail="Distinct context sources represented in the current inventory."
          status={payload.summary.sources > 0 ? "success" : "idle"}
        />
        <LiveStatCard
          label="Document artifacts"
          value={String(payload.summary.documentArtifacts)}
          detail={`${payload.summary.documentJobs} document jobs currently retained in the dashboard feed.`}
          status={payload.summary.documentArtifacts > 0 ? "success" : "idle"}
        />
        <LiveStatCard
          label="Reasoning artifacts"
          value={String(payload.summary.reasoningArtifacts)}
          detail={`${payload.summary.reasoningJobs} reasoning jobs currently retained in the dashboard feed.`}
          status={payload.summary.reasoningArtifacts > 0 ? "success" : "idle"}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <LivePanel title="Context inventory" meta={`${payload.sessions.length} sessions`}>
          {payload.sessions.length === 0 ? (
            <LiveEmptyState
              title="No session context discovered"
              message="Session context will appear here once assistants or local session sources report activity."
            />
          ) : (
            <div className="space-y-3">
              {payload.sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{session.label}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {session.source} · {session.channel} · {session.model}
                      </p>
                    </div>
                    <StatusBadge
                      status={session.active ? "running" : "idle"}
                      label={session.active ? "active" : "inactive"}
                    />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {session.lastActivity
                      ? `Last activity ${formatRelativeTime(session.lastActivity)}`
                      : "No activity timestamp published"}
                    {session.flags.length > 0 ? ` · flags: ${session.flags.join(", ")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <div className="space-y-4">
          <LivePanel title="Coverage" meta={payload.assistant?.workspace ?? "read-only"}>
            <LiveMiniStatGrid columns={2}>
              <LiveMiniStat
                label="Assistant"
                value={payload.assistant?.name ?? "Not published"}
                detail={payload.assistant?.workspace ?? "No assistant workspace in payload"}
                icon={Database}
              />
              <LiveMiniStat
                label="Status"
                value={payload.assistant?.status ?? "unknown"}
                detail="Assistant workspace posture if an owned assistant runtime exists."
                icon={Sparkles}
              />
              <LiveMiniStat
                label="Document jobs"
                value={String(payload.summary.documentJobs)}
                detail={`${payload.summary.documentArtifacts} artifacts in current feed`}
                icon={FileStack}
              />
              <LiveMiniStat
                label="Reasoning jobs"
                value={String(payload.summary.reasoningJobs)}
                detail={`${payload.summary.reasoningArtifacts} artifacts in current feed`}
              />
            </LiveMiniStatGrid>
          </LivePanel>

          <LivePanel title="Coverage notes" meta={`${payload.partials.length} notes`}>
            <div className="space-y-3">
              {payload.partials.map((note) => (
                <div
                  key={note}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm leading-6 text-slate-300">{note}</p>
                </div>
              ))}
            </div>
          </LivePanel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LivePanel title="Document artifacts" meta={`${payload.documents.length} jobs`}>
          {payload.documents.length === 0 ? (
            <LiveEmptyState
              title="No document jobs yet"
              message="Document workflow outputs show up here once the document engine has created jobs or artifacts."
            />
          ) : (
            <div className="space-y-3">
              {payload.documents.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{job.templateId}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {job.executionMode} · {job.artifacts} artifacts
                      </p>
                    </div>
                    <StatusBadge status={job.status === "completed" ? "success" : "warning"} label={job.status} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {job.updatedAt ? `Updated ${formatRelativeTime(job.updatedAt)}` : "No update timestamp"}
                  </p>
                  {job.resultSummary ? (
                    <p className="mt-2 text-sm text-slate-300">{job.resultSummary}</p>
                  ) : job.errorMessage ? (
                    <p className="mt-2 text-sm text-rose-300">{job.errorMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <LivePanel title="Reasoning artifacts" meta={`${payload.reasoning.length} jobs`}>
          {payload.reasoning.length === 0 ? (
            <LiveEmptyState
              title="No reasoning jobs yet"
              message="Reasoning outputs appear here once MUTX has persisted reasoning jobs or artifacts."
            />
          ) : (
            <div className="space-y-3">
              {payload.reasoning.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{job.templateId}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {job.executionMode} · {job.artifacts} artifacts
                      </p>
                    </div>
                    <StatusBadge status={job.status === "completed" ? "success" : "warning"} label={job.status} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {job.updatedAt ? `Updated ${formatRelativeTime(job.updatedAt)}` : "No update timestamp"}
                  </p>
                  {job.resultSummary ? (
                    <p className="mt-2 text-sm text-slate-300">{job.resultSummary}</p>
                  ) : job.errorMessage ? (
                    <p className="mt-2 text-sm text-rose-300">{job.errorMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </LivePanel>
      </div>
    </div>
  );
}
