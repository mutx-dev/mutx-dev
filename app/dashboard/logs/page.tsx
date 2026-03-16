"use client";

import { useState } from "react";
import { Terminal, Search, Download, Filter, ChevronDown, Play, Pause, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  message: string;
}

const mockLogs: LogEntry[] = [
  { id: "l1", timestamp: "2026-03-16T07:35:45.123Z", level: "INFO", source: "agent-runtime", message: "Starting agent claude-sonnet with config {model: 'claude-sonnet-4', max_tokens: 4000}" },
  { id: "l2", timestamp: "2026-03-16T07:35:45.456Z", level: "DEBUG", source: "tool-executor", message: "Executing tool: web_search with params {query: 'latest AI news', limit: 5}" },
  { id: "l3", timestamp: "2026-03-16T07:35:46.789Z", level: "INFO", source: "api-gateway", message: "Request completed: GET /v1/agents 200 145ms" },
  { id: "l4", timestamp: "2026-03-16T07:35:47.012Z", level: "WARN", source: "rate-limiter", message: "Approaching rate limit: 450/500 requests in current window" },
  { id: "l5", timestamp: "2026-03-16T07:35:48.345Z", level: "ERROR", source: "agent-runtime", message: "Agent execution failed: OpenAI API error - RateLimitError" },
  { id: "l6", timestamp: "2026-03-16T07:35:49.678Z", level: "INFO", source: "deploy-service", message: "Deployment swarm-prod-03 scaled to 5 instances" },
  { id: "l7", timestamp: "2026-03-16T07:35:50.901Z", level: "DEBUG", source: "memory-store", message: "Vector store updated: +128 embeddings, total: 15,548" },
  { id: "l8", timestamp: "2026-03-16T07:35:51.234Z", level: "INFO", source: "webhook-dispatcher", message: "Webhook delivered: https://example.com/callback/events - 200 OK" },
];

const levelStyles = {
  INFO: { color: "text-cyan-400", bg: "bg-cyan-400/10" },
  WARN: { color: "text-amber-400", bg: "bg-amber-400/10" },
  ERROR: { color: "text-rose-400", bg: "bg-rose-400/10" },
  DEBUG: { color: "text-slate-400", bg: "bg-slate-400/10" },
};

export default function DashboardLogsPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isPaused, setIsPaused] = useState(false);

  const sources = Array.from(new Set(mockLogs.map(l => l.source)));
  
  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Logs</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time structured runtime logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isPaused ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50">
            <option value="all">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0a0e] px-3 py-2 text-sm text-white focus:border-cyan-400/50">
            <option value="all">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
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
              {filteredLogs.map((log) => {
                const style = levelStyles[log.level];
                return (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">{log.timestamp}</td>
                    <td className="whitespace-nowrap px-4 py-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>{log.level}</span></td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-400">{log.source}</td>
                    <td className="px-4 py-2 text-slate-300">{log.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
