"use client";

import { useEffect, useState } from "react";
import { ArrowUpCircle, CheckCircle, Circle, XCircle } from "lucide-react";

import { ApiRequestError, readJson } from "@/components/app/http";
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

type Run = components["schemas"]["RunResponse"] & {
  agent_id?: string | null;
  subject_label?: string | null;
  execution_mode?: string | null;
};
type RunHistory = components["schemas"]["RunHistoryResponse"];

interface RunStep {
  id: string;
  type: string;
  tool_name?: string;
  success?: boolean;
  duration_ms?: number;
  started_at: string;
  ended_at?: string;
  step_metadata?: Record<string, unknown>;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

interface RunDetail {
  id: string;
  agent_id: string;
  agent_name?: string;
  model?: string;
  provider?: string;
  status: string;
  outcome?: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  steps?: RunStep[];
  error?: string;
}

function StepIcon({ type, success }: { type: string; success?: boolean }) {
  if (type === "tool_call" || type === "tool") {
    return success === false ? (
      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
    ) : success === true ? (
      <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
    ) : (
      <Circle className="h-3.5 w-3.5 shrink-0 text-slate-500" />
    );
  }
  if (type === "reasoning") {
    return <Circle className="h-3.5 w-3.5 shrink-0 text-purple-400" />;
  }
  if (type === "error" || type === "failure") {
    return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  }
  return <CheckCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />;
}

function LogEntry({ step, runId }: { step: RunStep; runId: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
      <div className="mt-0.5 shrink-0">
        <StepIcon type={step.type} success={step.success} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-white/80">
            {step.tool_name || step.type}
          </span>
          <span className="shrink-0 text-slate-500">
            {step.duration_ms ? `${(step.duration_ms / 1000).toFixed(2)}s` : ""}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
          <span className="font-mono text-slate-600">{runId.slice(0, 12)}</span>
          <span>·</span>
          <span>{formatDateTime(step.started_at)}</span>
          {step.success !== undefined && (
            <>
              <span>·</span>
              <span className={step.success ? "text-green-400" : "text-red-400"}>
                {step.success ? "success" : "failed"}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const response = await readJson<RunHistory>("/api/dashboard/runs?limit=48");
        if (!cancelled) {
          const items = response.items ?? [];
          setRuns(items);
          if (items.length > 0) {
            void loadRunDetail(items[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError instanceof ApiRequestError &&
            (loadError.status === 401 || loadError.status === 403)
          ) {
            setAuthRequired(true);
          } else {
            setError(loadError instanceof Error ? loadError.message : "Failed to load runs");
          }
          setLoading(false);
        }
      }
    }

    async function loadRunDetail(runId: string) {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const detail = await readJson<RunDetail>(`/api/dashboard/runs/${runId}`);
        if (!cancelled) {
          setSelectedRun(detail);
          setDetailLoading(false);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setDetailError(e instanceof Error ? e.message : "Failed to load run detail");
          setDetailLoading(false);
          setLoading(false);
        }
      }
    }

    void loadRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectRun = async (runId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await readJson<RunDetail>(`/api/dashboard/runs/${runId}`);
      setSelectedRun(detail);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Failed to load run detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const totals = {
    completed: runs.filter((r) => r.status === "completed").length,
    failed: runs.filter((r) => r.status === "failed" || r.status === "error").length,
    running: runs.filter((r) => r.status === "running" || r.status === "pending").length,
  };

  if (loading) return <LiveLoading title="Logs" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to access the log stream."
      />
    );
  }
  if (error) return <LiveErrorState title="Logs unavailable" message={error} />;

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard label="Total runs" value={String(runs.length)} detail="Recent agent runs in the log stream." />
        <LiveStatCard
          label="Completed"
          value={String(totals.completed)}
          detail="Runs that finished successfully."
          status="success"
        />
        <LiveStatCard
          label="Failed"
          value={String(totals.failed)}
          detail="Runs that encountered errors."
          status={totals.failed > 0 ? "error" : undefined}
        />
        <LiveStatCard
          label="In flight"
          value={String(totals.running)}
          detail="Runs currently executing."
          status={totals.running > 0 ? "running" : "idle"}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
        {/* Run list */}
        <LivePanel title="Run log stream" meta={`${runs.length} records`}>
          {runs.length === 0 ? (
            <LiveEmptyState
              title="No runs recorded"
              message="Agent run events will appear here as they complete."
            />
          ) : (
            <div className="space-y-1.5">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => handleSelectRun(run.id)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                    selectedRun?.id === run.id
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="truncate font-mono text-[11px] text-white/70">
                        {run.id.slice(0, 16)}
                      </span>
                      {run.subject_label && (
                        <span className="ml-2 text-[10px] text-slate-400">{run.subject_label}</span>
                      )}
                    </span>
                    <StatusBadge
                      status={asDashboardStatus(run.status)}
                      label={run.status}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{formatRelativeTime(run.created_at)}</span>
                    {run.execution_mode && (
                      <>
                        <span>·</span>
                        <span>{run.execution_mode}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </LivePanel>

        {/* Step log detail */}
        <LivePanel
          title="Run steps"
          meta={selectedRun ? selectedRun.id.slice(0, 16) : "-"}
          action={
            selectedRun ? (
              <button
                onClick={() => {
                  if (selectedRun) void handleSelectRun(selectedRun.id);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Refresh
              </button>
            ) : undefined
          }
        >
          {detailLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-white/5"
                />
              ))}
            </div>
          ) : detailError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {detailError}
            </div>
          ) : selectedRun ? (
            <div className="space-y-4">
              {/* Run meta */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Agent</div>
                  <div className="mt-0.5 truncate font-mono text-xs text-white/80">
                    {selectedRun.agent_id.slice(0, 16)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Model</div>
                  <div className="mt-0.5 truncate text-xs text-white/80">
                    {selectedRun.model || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Duration</div>
                  <div className="mt-0.5 text-xs text-white/80">
                    {selectedRun.duration_ms
                      ? `${(selectedRun.duration_ms / 1000).toFixed(2)}s`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Outcome</div>
                  <div className="mt-0.5 text-xs text-white/80">
                    {selectedRun.outcome || selectedRun.status || "—"}
                  </div>
                </div>
              </div>

              {/* Steps as log entries */}
              {selectedRun.steps && selectedRun.steps.length > 0 ? (
                <div className="space-y-1">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
                    Steps ({selectedRun.steps.length})
                  </div>
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {selectedRun.steps.map((step) => (
                      <LogEntry key={step.id} step={step} runId={selectedRun.id} />
                    ))}
                  </div>
                </div>
              ) : (
                <LiveEmptyState
                  title="No step data"
                  message="No step events have been recorded for this run yet."
                />
              )}

              {selectedRun.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-red-400">Error</div>
                  {selectedRun.error}
                </div>
              )}
            </div>
          ) : (
            <LiveEmptyState
              title="No run selected"
              message="Select a run from the log stream to inspect its step timeline."
            />
          )}
        </LivePanel>
      </div>
    </div>
  );
}
