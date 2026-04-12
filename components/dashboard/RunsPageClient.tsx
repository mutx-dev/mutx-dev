"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiRequestError, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  QueueDepthBar,
  asDashboardStatus,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

import type { components } from "@/app/types/api";

type Run = components["schemas"]["RunResponse"] & {
  agent_id?: string | null;
  subject_label?: string | null;
  subject_type?: string | null;
  template_id?: string | null;
  execution_mode?: string | null;
};
type RunHistory = components["schemas"]["RunHistoryResponse"];

export function RunsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const response = await readJson<RunHistory>("/api/dashboard/runs?limit=32");
        if (!cancelled) {
          setRuns(response.items ?? []);
          setLoading(false);
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

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const completed = runs.filter((run) => run.status === "completed").length;
    const failed = runs.filter((run) => run.status === "failed").length;
    const pending = runs.filter((run) => run.status === "created" || run.status === "queued").length;
    const running = runs.filter((run) => run.status === "running" && !run.completed_at).length;
    const live = runs.filter((run) => !run.completed_at).length;
    return { completed, failed, pending, running, live };
  }, [runs]);

  if (loading) return <LiveLoading title="Runs" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect live execution history and traceable run outcomes."
      />
    );
  }
  if (error) return <LiveErrorState title="Runs unavailable" message={error} />;

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard label="Total runs" value={String(runs.length)} detail="Recent execution records returned by the runs API." />
        <LiveStatCard
          label="Pending"
          value={String(totals.pending)}
          detail="Runs queued or created, awaiting agent pickup."
          status={asDashboardStatus(totals.pending > 0 ? "warning" : "idle")}
        />
        <LiveStatCard
          label="In flight"
          value={String(totals.running)}
          detail="Runs actively executing on an agent."
          status={asDashboardStatus(totals.running > 0 ? "running" : "idle")}
        />
        <LiveStatCard
          label="Completed"
          value={String(totals.completed)}
          detail="Runs that finished successfully in the current fetch window."
          status="success"
        />
        <LiveStatCard
          label="Failed"
          value={String(totals.failed)}
          detail="Runs that still need recovery or inspection."
          status={asDashboardStatus(totals.failed > 0 ? "failed" : "healthy")}
        />
      </LiveKpiGrid>

      <LivePanel title="Execution timeline" meta={`${runs.length} records`}>
        {runs.length === 0 ? (
          <LiveEmptyState
            title="No runs yet"
            message="Run history will show up here once an owned agent has executed inside MUTX."
          />
        ) : (
          <div className="space-y-4">
            <QueueDepthBar
              entries={[
                { status: "pending", count: totals.pending, label: "Pending" },
                { status: "running", count: totals.running, label: "Running" },
                { status: "completed", count: totals.completed, label: "Done" },
                { status: "failed", count: totals.failed, label: "Failed" },
              ]}
            />
            <div className="space-y-3">
              {runs.map((run) => (
              <div
                key={run.id}
                className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-white">{run.id}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {run.subject_label
                      ? `${run.subject_label} · ${run.execution_mode || "managed"}`
                      : run.agent_id
                        ? `Agent ${run.agent_id.slice(0, 8)}`
                        : "No agent binding"}{" "}
                    · {run.trace_count} traces
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>started {formatRelativeTime(run.started_at)}</span>
                    <span>created {formatRelativeTime(run.created_at)}</span>
                    {run.completed_at ? <span>finished {formatRelativeTime(run.completed_at)}</span> : null}
                  </div>
                  {run.error_message ? (
                    <p className="mt-3 text-sm text-rose-300">{run.error_message}</p>
                  ) : run.output_text ? (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-400">{run.output_text}</p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No output captured yet.</p>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
                  <StatusBadge status={asDashboardStatus(run.status)} label={run.status} />
                  <div className="text-right text-xs text-slate-500">
                    <div>{run.trace_count} trace events</div>
                    <div>{run.completed_at ? "terminal" : "live"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </LivePanel>
    </div>
  );
}
