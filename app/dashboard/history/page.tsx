"use client";

import { useCallback, useEffect, useState } from "react";
import { History, CheckCircle, XCircle, Clock, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  action: string;
  agent: string;
  status: "success" | "failed" | "cancelled";
  timestamp: string;
  duration: number;
  user: string;
}

interface HistoryResponse {
  entries: HistoryEntry[];
}

const statusConfig = {
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
  cancelled: { icon: Clock, color: "text-slate-400", bg: "bg-slate-400/10" },
};

export default function DashboardHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/history", { cache: "no-store", credentials: "include" });

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: HistoryResponse = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      // silently fail, entries remain empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const filteredEntries = entries.filter(
    (h) => filter === "all" || h.status === filter
  );

  const todayCount = entries.filter(
    (h) => new Date(h.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-400/10 text-slate-400">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">History</h1>
            <p className="mt-1 text-sm text-slate-400">
              Audit trail of all fleet operations
              {todayCount > 0 && (
                <span className="ml-2 text-cyan-400">{todayCount} today</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchHistory()}
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
          <p className="text-sm text-white">
            Sign in to view your operation history.
          </p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {["all", "success", "failed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-all",
              filter === f
                ? "bg-cyan-400/20 text-cyan-400"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && entries.filter((e) => e.status === f).length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]">
                {entries.filter((e) => e.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        {loading && entries.length === 0 ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
                    <div className="h-3 w-64 rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-8 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <History className="mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">
              {filter === "all"
                ? "No operations recorded yet"
                : `No ${filter} operations recorded`}
            </p>
            <p className="mt-1 text-xs opacity-60">
              Operations will appear as agents and deployments are managed
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredEntries.map((entry) => {
              const status = statusConfig[entry.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{entry.action}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>{entry.agent}</span>
                        <span>•</span>
                        <span>{entry.user}</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {entry.duration > 0 && (
                      <span className="text-sm text-slate-400">{entry.duration}s</span>
                    )}
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        status.color,
                        status.bg,
                        "border-current/20"
                      )}
                    >
                      {entry.status}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
