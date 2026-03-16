"use client";

import { useState } from "react";
import { Play, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";

interface Run {
  id: string;
  agent_name: string;
  status: "running" | "completed" | "failed" | "pending";
  started_at: string;
  duration: number;
  model?: string;
}

const mockRuns: Run[] = [
  { id: "run_1a2b3c", agent_name: "claude-sonnet", status: "completed", started_at: "2026-03-16T07:30:00Z", duration: 45, model: "claude-sonnet-4" },
  { id: "run_4d5e6f", agent_name: "gpt-operator", status: "running", started_at: "2026-03-16T07:25:00Z", duration: 0, model: "gpt-5.3" },
  { id: "run_7g8h9i", agent_name: "codex-agent", status: "failed", started_at: "2026-03-16T07:20:00Z", duration: 12, model: "codex-spark" },
  { id: "run_0j1k2l", agent_name: "claude-sonnet", status: "completed", started_at: "2026-03-16T07:15:00Z", duration: 38, model: "claude-sonnet-4" },
  { id: "run_3m4n5o", agent_name: "opencode-agent", status: "completed", started_at: "2026-03-16T07:10:00Z", duration: 120, model: "gpt-5.3" },
  { id: "run_6p7q8r", agent_name: "gpt-operator", status: "pending", started_at: "2026-03-16T07:05:00Z", duration: 0, model: "gpt-5.4" },
];

const statusConfig = {
  running: { icon: Play, color: "text-cyan-400", bg: "bg-cyan-400/10", label: "Running", pulse: true },
  completed: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Completed", pulse: false },
  failed: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-400/10", label: "Failed", pulse: false },
  pending: { icon: Clock, color: "text-slate-400", bg: "bg-slate-400/10", label: "Pending", pulse: false },
};

export default function DashboardRunsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredRuns = mockRuns.filter(run => {
    const matchesSearch = run.agent_name.toLowerCase().includes(search.toLowerCase()) || 
                          run.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || run.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Runs</h1>
            <p className="mt-1 text-sm text-slate-400">Track agent execution runs and their outcomes</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "running", "completed", "failed", "pending"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                filter === status
                  ? "bg-cyan-400/20 text-cyan-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-medium">Run ID</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Started</th>
                <th className="px-6 py-4 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRuns.map((run) => {
                const config = statusConfig[run.status];
                const StatusIcon = config.icon;
                return (
                  <tr key={run.id} className="group hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm text-cyan-400">{run.id}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-white">{run.agent_name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">{run.model}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                      {run.duration > 0 ? `${run.duration}s` : "—"}
                    </td>
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
