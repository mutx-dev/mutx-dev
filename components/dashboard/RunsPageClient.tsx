"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";

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
import { FilterBar } from "@/components/dashboard/FilterBar";
import { EmptyState as DashboardEmptyState } from "@/components/dashboard/EmptyState";

import type { components } from "@/app/types/api";

type Run = components["schemas"]["RunResponse"];
type RunHistory = components["schemas"]["RunHistoryResponse"];

export function RunsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setAuthRequired(false);

    try {
      const response = await readJson<RunHistory>("/api/dashboard/runs?limit=32");
      if (!cancelledRef.current) {
        setRuns(response.items ?? []);
      }
    } catch (loadError) {
      if (!cancelledRef.current) {
        if (
          loadError instanceof ApiRequestError &&
          (loadError.status === 401 || loadError.status === 403)
        ) {
          setAuthRequired(true);
        } else {
          setError(loadError instanceof Error ? loadError.message : "Failed to load runs");
        }
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }

  const cancelledRef = { current: false };

  useEffect(() => {
    cancelledRef.current = false;
    void load();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Detect Mac OS
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const q = searchQuery.toLowerCase();
    return runs.filter(
      (run) =>
        run.id.toLowerCase().includes(q) ||
        run.agent_id.toLowerCase().includes(q) ||
        run.error_message?.toLowerCase().includes(q) ||
        run.output_text?.toLowerCase().includes(q),
    );
  }, [runs, searchQuery]);

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

      {error && !authRequired && (
        <div className="flex items-center justify-between rounded-[18px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span> {error}
          </div>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        searchPlaceholder={
          isMac
            ? "Search runs by ID, agent, or output... (⌘K)"
            : "Search runs by ID, agent, or output... (Ctrl+K)"
        }
        onReset={() => setSearchQuery("")}
        trailing={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-[14px] border border-[#2f3c49] bg-[#10161d] px-3.5 py-2 text-sm text-slate-200 transition hover:border-sky-300/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      <LivePanel
        title="Execution timeline"
        meta={searchQuery ? `${filteredRuns.length} of ${runs.length} visible` : `${runs.length} records`}
        action={
          searchQuery ? (
            <span className="hidden rounded-full border border-[#2c3947] bg-[#10161d] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#90a2b6] sm:inline-flex">
              {isMac ? "⌘K search active" : "Ctrl+K search active"}
            </span>
          ) : (
            <span className="hidden rounded-full border border-[#2c3947] bg-[#10161d] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#90a2b6] sm:inline-flex">
              {isMac ? "⌘K search" : "Ctrl+K search"}
            </span>
          )
        }
      >
        {runs.length === 0 ? (
          <LiveEmptyState
            title="No runs yet"
            message="Run history will show up here once an owned agent has executed inside MUTX."
          />
        ) : (
          <>
            <QueueDepthBar
              entries={[
                { status: "pending", count: totals.pending, label: "Pending" },
                { status: "running", count: totals.running, label: "Running" },
                { status: "completed", count: totals.completed, label: "Done" },
                { status: "failed", count: totals.failed, label: "Failed" },
              ]}
            />
            {filteredRuns.length === 0 && searchQuery ? (
              <DashboardEmptyState
                title="No matching runs"
                message="No runs match your search query. Try adjusting your filters."
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="space-y-3">
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-white">{run.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Agent {run.agent_id.slice(0, 8)} · {run.trace_count} traces
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
            )}
          </>
        )}
      </LivePanel>
    </div>
  );
}
