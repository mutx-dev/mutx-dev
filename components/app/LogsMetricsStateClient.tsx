"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  Clock,
  History,
  Layers,
  Search,
  Server,
  Terminal,
} from "lucide-react";

import { Card } from "@/components/ui/Card";

type RunItem = {
  id: string;
  agent_id: string;
  status: string;
  input_text?: string | null;
  output_text?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  trace_count?: number;
};

type RunsPayload = {
  items: RunItem[];
  total: number;
};

type TraceItem = {
  id: string;
  run_id: string;
  event_type: string;
  message?: string | null;
  payload?: Record<string, unknown>;
  sequence?: number;
  timestamp?: string | null;
};

type TracesPayload = {
  items: TraceItem[];
  total: number;
};

type TabType = "logs" | "metrics" | "state";

function formatTime(isoString?: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRelativeTime(isoString?: string | null) {
  if (!isoString) return "unknown";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Date.now() - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function LogLevelBadge({ level }: { level: string }) {
  const tone = level === "failed" || level === "error"
    ? "bg-rose-400/10 text-rose-300 border-rose-400/20"
    : level === "running" || level === "completed"
      ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
      : "bg-amber-400/10 text-amber-300 border-amber-400/20";

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${tone}`}>
      {level}
    </span>
  );
}

function SimpleBars({ values, color, label }: { values: number[]; color: string; label: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span>{values.length} points</span>
      </div>
      <div className="relative h-24 w-full overflow-hidden rounded-lg border border-white/5 bg-black/20 p-2">
        <div className="absolute inset-2 flex items-end gap-1">
          {values.map((value, index) => (
            <div
              key={index}
              className={`flex-1 rounded-t-sm ${color}`}
              style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogsMetricsStateClient() {
  const [activeTab, setActiveTab] = useState<TabType>("logs");
  const [logFilter, setLogFilter] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingTraces, setLoadingTraces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRuns() {
      try {
        setLoadingRuns(true);
        setError(null);
        const response = await fetch('/api/dashboard/runs?limit=50', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({ items: [] }))) as RunsPayload;
        if (!response.ok) throw new Error('Failed to load runs');
        if (cancelled) return;
        setRuns(payload.items || []);
        if (!selectedRunId && payload.items?.length) {
          setSelectedRunId(payload.items[0].id);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load runs');
        }
      } finally {
        if (!cancelled) setLoadingRuns(false);
      }
    }
    void loadRuns();
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) {
      setTraces([]);
      return;
    }

    let cancelled = false;
    async function loadTraces() {
      try {
        setLoadingTraces(true);
        const response = await fetch(`/api/dashboard/runs/${selectedRunId}/traces?limit=100`, { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({ items: [] }))) as TracesPayload;
        if (!response.ok) throw new Error('Failed to load traces');
        if (!cancelled) {
          setTraces(payload.items || []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load traces');
        }
      } finally {
        if (!cancelled) setLoadingTraces(false);
      }
    }

    void loadTraces();
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0] || null;

  const filteredTraces = useMemo(() => {
    return traces.filter((trace) => {
      if (!logFilter) return true;
      const needle = logFilter.toLowerCase();
      return (
        trace.event_type?.toLowerCase().includes(needle) ||
        trace.message?.toLowerCase().includes(needle) ||
        JSON.stringify(trace.payload || {}).toLowerCase().includes(needle)
      );
    });
  }, [traces, logFilter]);

  const metrics = useMemo(() => {
    const traceCount = traces.length;
    const errorCount = traces.filter((trace) => /error|fail/i.test(trace.event_type || '') || /error|fail/i.test(trace.message || '')).length;
    const messageLengths = traces.map((trace) => (trace.message || '').length || 1);
    const sequenceSpread = traces.map((trace, index) => typeof trace.sequence === 'number' ? trace.sequence + 1 : index + 1);
    const completedRuns = runs.filter((run) => run.status === 'completed').length;
    const failedRuns = runs.filter((run) => run.status === 'failed' || run.status === 'error').length;
    return {
      traceCount,
      errorCount,
      completedRuns,
      failedRuns,
      messageLengths,
      sequenceSpread,
    };
  }, [runs, traces]);

  const stateTransitions = useMemo(() => {
    return filteredTraces.map((trace, index) => ({
      id: trace.id || `${index}`,
      from: index === 0 ? 'queued' : filteredTraces[index - 1]?.event_type || 'step',
      to: trace.event_type || 'event',
      trigger: trace.message || 'trace event',
      timestamp: trace.timestamp || selectedRun?.started_at || selectedRun?.created_at || null,
    }));
  }, [filteredTraces, selectedRun?.created_at, selectedRun?.started_at]);

  return (
    <div className="space-y-6">
      <Card className="border border-white/5 bg-white/[0.01] p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 p-6">
          <div className="flex items-center gap-3 text-violet-400">
            <Activity className="h-5 w-5" />
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">Observability Hub</h3>
              <p className="mt-1 text-xs text-slate-500">Live runs + traces from the control plane</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="max-w-[240px] bg-transparent text-sm text-white focus:outline-none"
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {String(run.agent_id).slice(0, 8)} · {run.status} · {formatRelativeTime(run.started_at || run.created_at)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-1 border-b border-white/5 px-6">
          {([
            { id: "logs" as const, label: "Traces", icon: Terminal },
            { id: "metrics" as const, label: "Metrics", icon: BarChart3 },
            { id: "state" as const, label: "State", icon: Layers },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-violet-400 text-violet-300"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error ? <div className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
          {loadingRuns ? <div className="text-sm text-slate-400">Loading runs…</div> : null}
          {!loadingRuns && runs.length === 0 ? <div className="text-sm text-slate-400">No runs found yet.</div> : null}

          {activeTab === "logs" && selectedRun && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Search traces..."
                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-400">
                  {loadingTraces ? 'Loading traces…' : `${filteredTraces.length} traces`}
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 font-[family:var(--font-mono)] text-xs">
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {filteredTraces.map((trace) => (
                    <div key={trace.id} className="flex items-start gap-3 border-b border-white/5 px-4 py-2.5 hover:bg-white/[0.02]">
                      <span className="shrink-0 text-slate-500">{formatTime(trace.timestamp)}</span>
                      <LogLevelBadge level={trace.event_type || 'event'} />
                      <span className="text-slate-300">{trace.message || JSON.stringify(trace.payload || {})}</span>
                    </div>
                  ))}
                  {!loadingTraces && filteredTraces.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No traces match your filter</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "metrics" && selectedRun && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Run status</span>
                    <Activity className="h-4 w-4 text-cyan-400" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{selectedRun.status}</p>
                  <p className="mt-2 text-xs text-slate-500">Started {formatRelativeTime(selectedRun.started_at || selectedRun.created_at)}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Trace count</span>
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{metrics.traceCount}</p>
                  <p className="mt-2 text-xs text-slate-500">{metrics.errorCount} error-like traces</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Completed runs</span>
                    <Clock className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{metrics.completedRuns}</p>
                  <p className="mt-2 text-xs text-slate-500">{metrics.failedRuns} failed/error runs</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Completed at</span>
                    <History className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">{formatTime(selectedRun.completed_at)}</p>
                  <p className="mt-2 text-xs text-slate-500">Created {formatTime(selectedRun.created_at)}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <SimpleBars values={metrics.messageLengths.length ? metrics.messageLengths : [1]} color="bg-cyan-400" label="trace message size" />
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <SimpleBars values={metrics.sequenceSpread.length ? metrics.sequenceSpread : [1]} color="bg-violet-400" label="trace sequence progression" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "state" && selectedRun && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Run state transitions</span>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">{selectedRun.status}</span>
                </div>
                <div className="space-y-2">
                  {stateTransitions.map((transition) => (
                    <div key={transition.id} className="flex items-center gap-3 text-xs rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                      <span className="font-medium text-slate-300">{transition.from}</span>
                      <ChevronDown className="h-3 w-3 rotate-[-90deg] text-cyan-400" />
                      <span className="font-medium text-emerald-300">{transition.to}</span>
                      <span className="ml-auto text-slate-500 truncate">{transition.trigger}</span>
                      <span className="text-slate-600">{formatRelativeTime(transition.timestamp)}</span>
                    </div>
                  ))}
                  {stateTransitions.length === 0 ? <div className="text-sm text-slate-400">No state transitions yet.</div> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
