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
  asDashboardStatus,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface MutxCost {
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  cost_usd?: number;
  model?: string;
}

interface MutxStep {
  id: string;
  type: string;
  tool_name?: string;
  success?: boolean;
  duration_ms?: number;
  started_at: string;
  step_metadata?: Record<string, unknown>;
}

interface MutxRun {
  id: string;
  agent_id: string;
  agent_name?: string;
  model?: string;
  provider?: string;
  runtime?: string;
  status: string;
  outcome?: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  tools_available?: string[];
  cost?: MutxCost;
  steps?: MutxStep[];
  error?: string;
  run_metadata?: Record<string, unknown>;
}

interface ObservabilityResponse {
  items: MutxRun[];
  total: number;
  skip: number;
  limit: number;
}

export function ObservabilityPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<MutxRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<MutxRun | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const response = await readJson<ObservabilityResponse>("/api/dashboard/observability?limit=50");
        if (!cancelled) {
          setRuns(response.items ?? []);
          if (response.items?.length > 0 && !selectedRun) {
            setSelectedRun(response.items[0]);
          }
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
            setError(loadError instanceof Error ? loadError.message : "Failed to load observability data");
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
    const running = runs.filter((run) => run.status === "running").length;
    const totalCost = runs.reduce((sum, run) => sum + (run.cost?.cost_usd || 0), 0);
    return { completed, failed, running, totalCost };
  }, [runs]);

  if (loading) return <LiveLoading title="Observability" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect agent run observability data."
      />
    );
  }
  if (error) return <LiveErrorState title="Observability unavailable" message={error} />;

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard label="Total runs" value={String(runs.length)} detail="Agent runs tracked by MUTX observability." />
        <LiveStatCard
          label="Running"
          value={String(totals.running)}
          detail="Runs currently in progress."
          status={totals.running > 0 ? "running" : "idle"}
        />
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
      </LiveKpiGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <LivePanel title="Agent Runs" meta={`${runs.length} records`}>
          {runs.length === 0 ? (
            <LiveEmptyState
              title="No runs yet"
              message="Agent run observability data will appear here once agents emit runs."
            />
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedRun?.id === run.id
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-sm text-white">{run.id.slice(0, 16)}...</span>
                    <StatusBadge
                      status={asDashboardStatus(run.status)}
                      label={run.status}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {run.agent_id.slice(0, 12)} · {run.model || "no model"}
                  </div>
                  {run.cost && (
                    <div className="mt-1 text-xs text-slate-500">
                      ${run.cost.cost_usd?.toFixed(4)} · {run.cost.input_tokens + run.cost.output_tokens} tokens
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </LivePanel>

        <LivePanel title="Run Detail" meta={selectedRun ? selectedRun.id.slice(0, 16) : "-"}>
          {selectedRun ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="text-sm text-white">{selectedRun.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Agent</div>
                  <div className="truncate text-sm text-white">{selectedRun.agent_id}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Model</div>
                  <div className="text-sm text-white">{selectedRun.model || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Provider</div>
                  <div className="text-sm text-white">{selectedRun.provider || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-sm text-white">
                    {selectedRun.duration_ms ? `${(selectedRun.duration_ms / 1000).toFixed(2)}s` : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Steps</div>
                  <div className="text-sm text-white">{selectedRun.steps?.length || 0}</div>
                </div>
              </div>

              {selectedRun.cost && (
                <div>
                  <div className="mb-2 text-xs text-slate-500">Cost Breakdown</div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg text-white">{selectedRun.cost.input_tokens.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Input</div>
                      </div>
                      <div>
                        <div className="text-lg text-white">{selectedRun.cost.output_tokens.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Output</div>
                      </div>
                      <div>
                        <div className="text-lg text-cyan-400">${selectedRun.cost.cost_usd?.toFixed(4) || "0"}</div>
                        <div className="text-xs text-slate-500">Cost</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRun.steps && selectedRun.steps.length > 0 && (
                <div>
                  <div className="mb-2 text-xs text-slate-500">Steps ({selectedRun.steps.length})</div>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {selectedRun.steps.slice(0, 20).map((step, i) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] p-2 text-xs"
                      >
                        <span className="w-6 text-slate-500">{i + 1}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            step.type === "tool_call"
                              ? "bg-blue-500/20 text-blue-300"
                              : step.type === "reasoning"
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {step.type}
                        </span>
                        <span className="flex-1 truncate text-slate-300">{step.tool_name || "-"}</span>
                        {step.success !== undefined && (
                          <span className={step.success ? "text-green-400" : "text-red-400"}>
                            {step.success ? "✓" : "✗"}
                          </span>
                        )}
                        {step.duration_ms && <span className="text-slate-500">{step.duration_ms}ms</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRun.error && (
                <div>
                  <div className="mb-2 text-xs text-slate-500">Error</div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {selectedRun.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LiveEmptyState title="No run selected" message="Select a run from the list to view details." />
          )}
        </LivePanel>
      </div>
    </div>
  );
}
