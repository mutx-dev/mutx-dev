"use client";

import { useCallback, useEffect, useState } from "react";
import { Terminal, Search, Download, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  message: string;
}

interface LogsResponse {
  logs: LogEntry[];
  sources: string[];
  total: number;
}

const levelStyles = {
  INFO: { color: "text-cyan-400", bg: "bg-cyan-400/10" },
  WARN: { color: "text-amber-400", bg: "bg-amber-400/10" },
  ERROR: { color: "text-rose-400", bg: "bg-rose-400/10" },
  DEBUG: { color: "text-slate-400", bg: "bg-slate-400/10" },
};

export default function DashboardLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (isPaused) return;

    setLoading(true);
    setAuthRequired(false);

    try {
      const params = new URLSearchParams();
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/dashboard/logs?${params}`, {
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

      const data: LogsResponse = await res.json();
      setLogs(data.logs ?? []);
      setSources(data.sources ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [isPaused, levelFilter, sourceFilter, search]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      void fetchLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [isPaused, fetchLogs]);

  const filteredLogs = logs;

  const handleExport = () => {
    const content = filteredLogs
      .map((log) => `[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mutx-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Logs</h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time structured runtime logs
              {logs.length > 0 && (
                <span className="ml-2 text-cyan-400">{logs.length} entries</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchLogs()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isPaused
                ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30"
                : "text-slate-400 hover:text-white border border-transparent"
            )}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="text-sm text-white">Sign in to view live runtime logs.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
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
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e] font-mono text-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="h-3 w-40 rounded bg-white/5" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="h-5 w-12 rounded-full bg-white/5" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="h-3 w-20 rounded bg-white/5" />
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-3 w-full rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                    No log entries found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const style = levelStyles[log.level];
                  return (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-400">{log.source}</td>
                      <td className="px-4 py-2 text-slate-300">{log.message}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
