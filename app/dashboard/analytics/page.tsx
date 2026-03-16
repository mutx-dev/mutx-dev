"use client";

import { useState } from "react";
import { BarChart3, Users, Zap, Activity, TrendingUp, Clock, MousePointerClick } from "lucide-react";

interface AnalyticsData {
  dailyActiveUsers: number;
  agentRunsPerDay: number;
  apiCallsPerDay: number;
  avgResponseTime: string;
}

interface EventBreakdown {
  name: string;
  count: number;
  percentage: number;
}

const mockAnalytics: AnalyticsData = {
  dailyActiveUsers: 142,
  agentRunsPerDay: 1847,
  apiCallsPerDay: 24560,
  avgResponseTime: "234ms",
};

const mockEventBreakdown: EventBreakdown[] = [
  { name: "agent_run.completed", count: 1245, percentage: 42 },
  { name: "agent_run.started", count: 1189, percentage: 40 },
  { name: "api_key.used", count: 856, percentage: 29 },
  { name: "user.login", count: 324, percentage: 11 },
  { name: "agent_run.failed", count: 89, percentage: 3 },
  { name: "api_key.created", count: 67, percentage: 2 },
];

const mockDailyData = [
  { day: "Mon", users: 98, runs: 1234 },
  { day: "Tue", users: 112, runs: 1456 },
  { day: "Wed", users: 134, runs: 1678 },
  { day: "Thu", users: 128, runs: 1590 },
  { day: "Fri", users: 145, runs: 1890 },
  { day: "Sat", users: 87, runs: 890 },
  { day: "Sun", users: 76, runs: 678 },
];

export default function DashboardAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-slate-400">Usage telemetry and product insights</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-[#0a0a0e] p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-cyan-400/20 text-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Daily Active Users</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mockAnalytics.dailyActiveUsers}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">+12%</span>
            <span className="text-slate-400">vs last week</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Agent Runs / Day</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mockAnalytics.agentRunsPerDay.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">+8%</span>
            <span className="text-slate-400">vs last week</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">API Calls / Day</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mockAnalytics.apiCallsPerDay.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">+23%</span>
            <span className="text-slate-400">vs last week</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Avg Response Time</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mockAnalytics.avgResponseTime}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-rose-400 rotate-180" />
            <span className="text-emerald-400">-15%</span>
            <span className="text-slate-400">vs last week</span>
          </div>
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Event Breakdown</h2>
        </div>
        <div className="divide-y divide-white/5">
          {mockEventBreakdown.map((event) => (
            <div key={event.name} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{event.name}</p>
                  <p className="text-xs text-slate-400">{event.count.toLocaleString()} events</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${event.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm text-slate-400">{event.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Chart Placeholder */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Activity</h2>
        <div className="flex h-48 items-end justify-between gap-2">
          {mockDailyData.map((data) => (
            <div key={data.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1">
                <div
                  className="w-full rounded-t bg-cyan-400/60"
                  style={{ height: `${(data.runs / 2000) * 100}%`, minHeight: "4px" }}
                />
                <div
                  className="w-full rounded-t bg-violet-400/60"
                  style={{ height: `${(data.users / 160) * 100}%`, minHeight: "4px" }}
                />
              </div>
              <span className="text-xs text-slate-400">{data.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-cyan-400/60" />
            <span className="text-xs text-slate-400">Agent Runs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-violet-400/60" />
            <span className="text-xs text-slate-400">Active Users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
