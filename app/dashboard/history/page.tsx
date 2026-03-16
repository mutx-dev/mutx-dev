"use client";

import { useState } from "react";
import { History, Calendar, Clock, CheckCircle, XCircle, ArrowRight, Filter, ChevronRight } from "lucide-react";

interface HistoryEntry {
  id: string;
  action: string;
  agent: string;
  status: "success" | "failed" | "cancelled";
  timestamp: string;
  duration: number;
  user: string;
}

const mockHistory: HistoryEntry[] = [
  { id: "h1", action: "Deploy swarm prod-03", agent: "claude-sonnet", status: "success", timestamp: "2026-03-16T07:30:00Z", duration: 45, user: "system" },
  { id: "h2", action: "Scale swarm staging-01 to 3", agent: "gpt-operator", status: "success", timestamp: "2026-03-16T07:15:00Z", duration: 12, user: "admin@mutx.dev" },
  { id: "h3", action: "Create agent trading-bot", agent: "codex-agent", status: "success", timestamp: "2026-03-16T07:00:00Z", duration: 28, user: "system" },
  { id: "h4", action: "Delete agent test-agent-02", agent: "claude-sonnet", status: "failed", timestamp: "2026-03-16T06:45:00Z", duration: 5, user: "admin@mutx.dev" },
  { id: "h5", action: "Update webhook endpoint", agent: "opencode-agent", status: "success", timestamp: "2026-03-16T06:30:00Z", duration: 8, user: "system" },
  { id: "h6", action: "Rollback deployment v2.3.1", agent: "claude-sonnet", status: "cancelled", timestamp: "2026-03-16T06:15:00Z", duration: 0, user: "admin@mutx.dev" },
];

const statusConfig = {
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
  cancelled: { icon: Clock, color: "text-slate-400", bg: "bg-slate-400/10" },
};

export default function DashboardHistoryPage() {
  const [filter, setFilter] = useState("all");

  const filteredHistory = mockHistory.filter(h => filter === "all" || h.status === filter);
  const today = mockHistory.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-400/10 text-slate-400">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">History</h1>
          <p className="mt-1 text-sm text-slate-400">Audit trail of all fleet operations</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "success", "failed", "cancelled"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${filter === f ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:bg-white/5"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="divide-y divide-white/5">
          {filteredHistory.map((entry) => {
            const status = statusConfig[entry.status];
            const StatusIcon = status.icon;
            return (
              <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
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
                  {entry.duration > 0 && <span className="text-sm text-slate-400">{entry.duration}s</span>}
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
