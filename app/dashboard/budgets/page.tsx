"use client";

import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";

interface BudgetItem {
  id: string;
  name: string;
  spent: number;
  limit: number;
  period: "daily" | "weekly" | "monthly";
}

interface UsageEntry {
  id: string;
  agent: string;
  type: string;
  amount: number;
  timestamp: string;
}

const mockBudgets: BudgetItem[] = [
  { id: "b1", name: "Compute (GPU)", spent: 847.50, limit: 1000, period: "monthly" },
  { id: "b2", name: "API Calls", spent: 234.20, limit: 500, period: "monthly" },
  { id: "b3", name: "Storage", spent: 45.80, limit: 100, period: "monthly" },
  { id: "b4", name: "Vector Embeddings", spent: 156.00, limit: 200, period: "monthly" },
];

const mockUsage: UsageEntry[] = [
  { id: "u1", agent: "claude-sonnet", type: "compute", amount: 124.50, timestamp: "2026-03-16T07:30:00Z" },
  { id: "u2", agent: "gpt-operator", type: "api_calls", amount: 45.20, timestamp: "2026-03-16T07:25:00Z" },
  { id: "u3", agent: "codex-agent", type: "embeddings", amount: 32.00, timestamp: "2026-03-16T07:20:00Z" },
  { id: "u4", agent: "opencode-agent", type: "compute", amount: 89.00, timestamp: "2026-03-16T07:15:00Z" },
  { id: "u5", agent: "claude-sonnet", type: "storage", amount: 12.50, timestamp: "2026-03-16T07:10:00Z" },
];

export default function DashboardBudgetsPage() {
  const [period, setPeriod] = useState("monthly");
  
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalLimit = mockBudgets.reduce((sum, b) => sum + b.limit, 0);
  const utilization = (totalSpent / totalLimit) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Budgets</h1>
            <p className="mt-1 text-sm text-slate-400">Track spending and resource limits across your fleet</p>
          </div>
        </div>
        <div className="flex gap-2 rounded-lg bg-white/5 p-1">
          {["daily", "weekly", "monthly"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${period === p ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <p className="text-xs text-slate-400">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-white">${totalSpent.toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>12% from last period</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <p className="text-xs text-slate-400">Total Budget</p>
          <p className="mt-1 text-2xl font-bold text-white">${totalLimit.toFixed(2)}</p>
          <div className="mt-2 text-xs text-slate-400">${(totalLimit - totalSpent).toFixed(2)} remaining</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <p className="text-xs text-slate-400">Utilization</p>
          <p className="mt-1 text-2xl font-bold text-cyan-400">{utilization.toFixed(1)}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${utilization}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <p className="text-xs text-slate-400">Daily Average</p>
          <p className="mt-1 text-2xl font-bold text-white">${(totalSpent / 30).toFixed(2)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-400">
            <ArrowDownRight className="h-3 w-3" />
            <span>3% from last period</span>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Budget Categories</h2>
        </div>
        <div className="divide-y divide-white/5">
          {mockBudgets.map((budget) => {
            const percent = (budget.spent / budget.limit) * 100;
            const isOver = percent > 100;
            const isWarning = percent > 80;
            return (
              <div key={budget.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{budget.name}</p>
                    <p className="text-xs text-slate-400">${budget.spent.toFixed(2)} / ${budget.limit}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}>
                      {percent.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className={`h-2 rounded-full transition-all ${isOver ? "bg-rose-400" : isWarning ? "bg-amber-400" : "bg-emerald-400"}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Usage */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockUsage.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-white">{entry.agent}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">{entry.type}</span></td>
                  <td className="px-6 py-4 text-emerald-400">${entry.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
