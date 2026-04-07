"use client";

import { useEffect, useState } from "react";
import { Bot, Cpu, GitBranch, TerminalSquare } from "lucide-react";

import {
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LiveMiniStat,
  LiveMiniStatGrid,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type QueueItem = {
  id?: string;
  title?: string;
  status?: string;
  lane?: string;
  runner?: string;
  area?: string;
  priority?: string;
};

type AutonomyResponse = {
  status: string;
  repoRoot: string;
  daemon: Record<string, unknown>;
  lanes: { lanes?: Record<string, { paused?: boolean; reason?: string | null; updated_at?: string | null }> };
  fleet: { roles?: Array<{ id: string; lane: string; purpose: string }> };
  generatedTasks: Array<{ id?: string; title?: string; area?: string; priority?: string; owner_role?: string; lane?: string }>;
  queue: {
    counts: Record<string, number>;
    queued: QueueItem[];
    running: QueueItem[];
    parked: QueueItem[];
    completed: QueueItem[];
  };
  activeRunners: Array<{ task_id?: string; lane?: string; runner?: string; pid?: number; started_at?: string }>;
  reports: Array<Record<string, unknown>>;
};

function QueueList({ title, items }: { title: string; items: QueueItem[] }) {
  return (
    <LivePanel title={title} meta={`${items.length} items`}>
      {items.length === 0 ? (
        <LiveEmptyState title={`No ${title.toLowerCase()}`} message="Nothing to show in this bucket right now." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id ?? item.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{item.title ?? item.id ?? "Unnamed task"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(item.id ?? "unknown")} · {item.area ?? "n/a"} · {item.lane ?? item.runner ?? "unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.priority ? <StatusBadge status={asDashboardStatus(item.priority)} label={item.priority} /> : null}
                  {item.status ? <StatusBadge status={asDashboardStatus(item.status)} label={item.status} /> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </LivePanel>
  );
}

export function AutonomyPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AutonomyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dashboard/autonomy", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Autonomy route returned ${response.status}`);
        }
        const payload = (await response.json()) as AutonomyResponse;
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load autonomy state");
          setLoading(false);
        }
      }
    }

    void load();
    const interval = setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <LiveLoading title="Autonomy" />;
  if (error || !data) return <LiveErrorState title="Autonomy unavailable" message={error ?? "No autonomy data returned."} />;

  const daemonStatus = typeof data.daemon.status === "string" ? data.daemon.status : "unknown";
  const queueCounts = data.queue.counts ?? {};
  const laneEntries = Object.entries(data.lanes.lanes ?? {});

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Daemon"
          value={daemonStatus}
          detail={`Heartbeat ${formatRelativeTime((data.daemon.heartbeat_at as string | undefined) ?? null)}`}
          status={asDashboardStatus(daemonStatus)}
        />
        <LiveStatCard
          label="Queue"
          value={String((queueCounts.queued ?? 0) + (queueCounts.running ?? 0) + (queueCounts.parked ?? 0))}
          detail={`${queueCounts.running ?? 0} running · ${queueCounts.queued ?? 0} queued · ${queueCounts.parked ?? 0} parked`}
          status={asDashboardStatus((queueCounts.running ?? 0) > 0 ? "running" : (queueCounts.queued ?? 0) > 0 ? "queued" : daemonStatus)}
        />
        <LiveStatCard
          label="Active runners"
          value={String(data.activeRunners.length)}
          detail={data.activeRunners.length > 0 ? data.activeRunners.map((runner) => runner.lane ?? runner.runner ?? "runner").join(", ") : "No active workers right now"}
          status={asDashboardStatus(data.activeRunners.length > 0 ? "running" : "idle")}
        />
        <LiveStatCard
          label="Generated tasks"
          value={String(data.generatedTasks.length)}
          detail={`${data.fleet.roles?.length ?? 0} fleet roles scanning repo/docs/whitepaper`}
          status={asDashboardStatus(data.generatedTasks.length > 0 ? "queued" : "idle")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <LivePanel title="Daemon / runtime" meta="local-only control plane">
          <LiveMiniStatGrid columns={2}>
            <LiveMiniStat label="Repo root" value={String(data.repoRoot)} icon={TerminalSquare} />
            <LiveMiniStat label="Cycle count" value={String(data.daemon.cycle_count ?? 0)} icon={Cpu} detail={`PID ${String(data.daemon.pid ?? "n/a")}`} />
            <LiveMiniStat label="Last result" value={String((data.daemon.last_result as { status?: string } | undefined)?.status ?? "unknown")} detail={formatDateTime((data.daemon.last_cycle_completed_at as string | undefined) ?? null)} icon={Bot} />
            <LiveMiniStat label="Fleet roles" value={String(data.fleet.roles?.length ?? 0)} detail="CTO, CIO, backend, frontend, UX, research" icon={GitBranch} />
          </LiveMiniStatGrid>

          <div className="mt-4 space-y-3">
            {data.activeRunners.length === 0 ? (
              <LiveEmptyState title="No active runners" message="The daemon is alive, but no worker is currently executing a task." />
            ) : (
              data.activeRunners.map((runner) => (
                <div key={`${runner.task_id}-${runner.pid}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{runner.task_id ?? "unnamed task"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {runner.runner ?? runner.lane ?? "runner"} · pid {String(runner.pid ?? "n/a")}
                      </p>
                    </div>
                    <StatusBadge status="running" label={runner.lane ?? runner.runner ?? "running"} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Started {formatRelativeTime((runner.started_at as string | undefined) ?? null)}</p>
                </div>
              ))
            )}
          </div>
        </LivePanel>

        <LivePanel title="Lane state" meta={`${laneEntries.length} lanes`}>
          <div className="space-y-3">
            {laneEntries.map(([lane, state]) => (
              <div key={lane} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{lane}</p>
                    <p className="mt-1 text-xs text-slate-500">{state.reason ?? "healthy"}</p>
                  </div>
                  <StatusBadge status={asDashboardStatus(state.paused ? "warning" : "healthy")} label={state.paused ? "paused" : "active"} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Updated {formatRelativeTime(state.updated_at ?? null)}</p>
              </div>
            ))}
          </div>
        </LivePanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueueList title="Running tasks" items={data.queue.running} />
        <QueueList title="Queued tasks" items={data.queue.queued} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueueList title="Parked tasks" items={data.queue.parked} />
        <LivePanel title="Recent reports" meta={`${data.reports.length} records`}>
          {data.reports.length === 0 ? (
            <LiveEmptyState title="No reports yet" message="Autonomy reports will appear here as the daemon cycles." />
          ) : (
            <div className="space-y-3">
              {data.reports.map((report, index) => (
                <div key={`${String(report.task_id ?? 'report')}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{String(report.task_id ?? "unknown task")}</p>
                      <p className="mt-1 text-xs text-slate-500">{String(report.summary ?? "")}</p>
                    </div>
                    <StatusBadge status={asDashboardStatus(String(report.status ?? "idle"))} label={String(report.status ?? "unknown")} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{formatDateTime(String(report.updated_at ?? ""))}</p>
                </div>
              ))}
            </div>
          )}
        </LivePanel>
      </div>

      <LivePanel title="Fleet roles" meta={`${data.fleet.roles?.length ?? 0} configured`}>
        {data.fleet.roles?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.fleet.roles.map((role) => (
              <div key={role.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{role.id}</p>
                  <StatusBadge status={asDashboardStatus(role.lane)} label={role.lane} />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{role.purpose}</p>
              </div>
            ))}
          </div>
        ) : (
          <LiveEmptyState title="No fleet roles configured" message="Add role definitions to .autonomy/fleet.json to track them here." />
        )}
      </LivePanel>
    </div>
  );
}
