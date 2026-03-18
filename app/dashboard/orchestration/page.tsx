"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Settings, ArrowRight, Layers, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lane {
  id: string;
  name: string;
  type: "builder" | "ship" | "qa" | "control";
  status: "active" | "paused" | "idle";
  concurrency: number;
  queueDepth: number;
  nextHandoff?: string;
  agents: string[];
}

interface OrchestrationResponse {
  lanes: Lane[];
}

const typeColors = {
  builder: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  ship: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  qa: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  control: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

const statusConfig = {
  active: { color: "text-emerald-400", dot: "bg-emerald-400" },
  paused: { color: "text-amber-400", dot: "bg-amber-400" },
  idle: { color: "text-slate-400", dot: "bg-slate-400" },
};

export default function DashboardOrchestrationPage() {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchLanes = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/orchestration", {
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

      const data: OrchestrationResponse = await res.json();
      setLanes(data.lanes ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLanes();
  }, [fetchLanes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Orchestration</h1>
            <p className="mt-1 text-sm text-slate-400">Agent lanes, handoffs, and execution graph</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchLanes()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
              loading && "opacity-50 cursor-not-allowed"
            )}
            disabled={loading}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-400/20">
            <Plus className="h-4 w-4" /> New Lane
          </button>
        </div>
      </div>

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="text-sm text-white">Sign in to view your orchestration lanes.</p>
        </div>
      ) : null}

      {/* Lane Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 animate-pulse">
                <div className="h-5 w-32 rounded bg-white/5 mb-3" />
                <div className="h-4 w-16 rounded bg-white/5 mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 rounded bg-white/5" />
                  <div className="h-4 w-12 rounded bg-white/5" />
                </div>
              </div>
            ))
          : lanes.map((lane) => {
              const status = statusConfig[lane.status];
              return (
                <div
                  key={lane.id}
                  className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{lane.name}</h3>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeColors[lane.type]}`}
                        >
                          {lane.type}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        <span className={`text-sm ${status.color}`}>{lane.status}</span>
                      </div>
                    </div>
                    <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-400">Concurrency</p>
                      <p className="font-medium text-white">{lane.concurrency}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Queue</p>
                      <p className="font-medium text-white">{lane.queueDepth}</p>
                    </div>
                  </div>
                  {lane.agents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {lane.agents.slice(0, 3).map((agent) => (
                        <span
                          key={agent}
                          className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          {agent}
                        </span>
                      ))}
                      {lane.agents.length > 3 && (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                          +{lane.agents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {lane.nextHandoff && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-400">Handoff to</span>
                      <span className="text-cyan-400">{lane.nextHandoff}</span>
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      {/* Execution Graph Preview */}
      {lanes.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Execution Flow</h2>
          <div className="flex flex-wrap items-center justify-start gap-2">
            {lanes.map((lane, i) => (
              <div key={lane.id} className="flex items-center">
                <div className="flex h-12 min-w-32 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300">
                  {lane.name}
                </div>
                {i < lanes.length - 1 && (
                  <ArrowRight className="mx-2 h-4 w-4 flex-shrink-0 text-slate-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
