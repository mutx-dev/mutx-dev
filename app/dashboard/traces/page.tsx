"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, AlertCircle, ChevronRight, Clock, Tag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TraceEntry {
  id: string;
  trace_id: string;
  agent: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, string>;
}

interface TracesResponse {
  traces: TraceEntry[];
  agents: string[];
  total: number;
}

const levelColors = {
  info: { bg: "bg-cyan-400/10", text: "text-cyan-400", border: "border-cyan-400/20" },
  warn: { bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20" },
  error: { bg: "bg-rose-400/10", text: "text-rose-400", border: "border-rose-400/20" },
  debug: { bg: "bg-slate-400/10", text: "text-slate-400", border: "border-slate-400/20" },
};

export default function DashboardTracesPage() {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const params = new URLSearchParams();
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (agentFilter !== "all") params.set("agent", agentFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/dashboard/traces?${params}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: TracesResponse = await res.json();
      setTraces(data.traces ?? []);
      setAgents(data.agents ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [levelFilter, agentFilter, search]);

  useEffect(() => {
    void fetchTraces();
  }, [fetchTraces]);

  const groupedTraces = traces.reduce((acc, trace) => {
    if (!acc[trace.trace_id]) acc[trace.trace_id] = [];
    acc[trace.trace_id].push(trace);
    return acc;
  }, {} as Record<string, TraceEntry[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Traces</h1>
            <p className="mt-1 text-sm text-slate-400">
              Structured execution traces with correlation IDs
              {traces.length > 0 && (
                <span className="ml-2 text-cyan-400">{traces.length} entries</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchTraces()}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
            loading && "opacity-50 cursor-not-allowed"
          )}
          disabled={loading}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="text-sm text-white">Sign in to view execution traces.</p>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search traces by ID or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50"
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trace Groups */}
      {loading && traces.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0e] overflow-hidden animate-pulse">
              <div className="flex items-center justify-between px-6 py-4 bg-white/5">
                <div className="h-4 w-48 rounded bg-white/5" />
                <div className="h-4 w-24 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTraces).map(([traceId, traceGroup]) => {
            const first = traceGroup[0];
            const hasError = traceGroup.some((t) => t.level === "error");
            const totalDuration = traceGroup.find((t) => t.duration)?.duration || 0;

            return (
              <div
                key={traceId}
                className="rounded-xl border border-white/10 bg-[#0a0a0e] overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/5">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-cyan-400">{traceId}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                      {first.agent}
                    </span>
                    {hasError && (
                      <span className="flex items-center gap-1 text-xs text-rose-400">Error</span>
                    )}
                    {totalDuration > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {totalDuration}ms
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setSelectedTrace(selectedTrace === traceId ? null : traceId)
                    }
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    {selectedTrace === traceId ? "Hide" : "Show"} {traceGroup.length} events
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${selectedTrace === traceId ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>

                {selectedTrace === traceId && (
                  <div className="divide-y divide-white/5">
                    {traceGroup.map((trace) => {
                      const colors = levelColors[trace.level];
                      return (
                        <div key={trace.id} className="flex gap-4 px-6 py-3 hover:bg-white/5">
                          <div className="mt-0.5 flex-shrink-0">
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              {trace.level}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{trace.message}</p>
                            {trace.metadata && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {Object.entries(trace.metadata).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400"
                                  >
                                    <Tag className="h-2.5 w-2.5" />
                                    {k}: {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-xs text-slate-500">
                            {new Date(trace.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {traces.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-white">No traces found</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
