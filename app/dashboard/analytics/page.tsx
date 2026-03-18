"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Users, Zap, Activity, TrendingUp, Clock, MousePointerClick, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventBreakdown {
  name: string;
  count: number;
  percentage: number;
}

interface DailyData {
  day: string;
  runs: number;
  agents: number;
}

interface AnalyticsResponse {
  analytics: {
    totalAgents: number;
    runningAgents: number;
    totalDeployments: number;
    activeDeployments: number;
    totalRuns: number;
  };
  eventBreakdown: EventBreakdown[];
  dailyData: DailyData[];
}

export default function DashboardAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/analytics", {
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

      const json: AnalyticsResponse = await res.json();
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const maxDailyRuns = data ? Math.max(...data.dailyData.map((d) => d.runs), 1) : 1;
  const maxDailyAgents = data ? Math.max(...data.dailyData.map((d) => d.agents), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-slate-400">
              Usage telemetry and product insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchAnalytics()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
              loading && "opacity-50 cursor-not-allowed"
            )}
            disabled={loading}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
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
      </div>

      {authRequired ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <p className="text-sm text-white">Sign in to view analytics data.</p>
        </div>
      ) : null}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Agents</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {loading ? "—" : String(data?.analytics.totalAgents ?? 0)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            {loading ? null : (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">{data?.analytics.runningAgents ?? 0}</span>
                <span className="text-slate-400">running</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Runs</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {loading ? "—" : String(data?.analytics.totalRuns ?? 0)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-400">all time</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Deployments</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {loading ? "—" : String(data?.analytics.totalDeployments ?? 0)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-slate-400">
              {loading ? "—" : `${data?.analytics.activeDeployments ?? 0} active`}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Event Count</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {loading
                  ? "—"
                  : String(
                      (data?.eventBreakdown.reduce((sum, e) => sum + e.count, 0) ?? 0) +
                        (data?.analytics.totalAgents ?? 0) +
                        (data?.analytics.totalDeployments ?? 0),
                    )}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-400">across all entities</span>
          </div>
        </div>
      </div>

      {/* Event Breakdown */}
      {data && data.eventBreakdown.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
          <div className="border-b border-white/5 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Event Breakdown</h2>
          </div>
          <div className="divide-y divide-white/5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
                        <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-2 w-32 rounded-full bg-white/5 animate-pulse" />
                  </div>
                ))
              : data.eventBreakdown.map((event) => (
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
      )}

      {/* Weekly Chart */}
      {data && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Activity</h2>
          {loading ? (
            <div className="flex h-48 items-end justify-between gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="h-32 w-full animate-pulse rounded-t bg-white/5" />
                  <div className="h-3 w-6 animate-pulse rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-end justify-between gap-2">
              {data.dailyData.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div
                      className="w-full rounded-t bg-cyan-400/60"
                      style={{ height: `${Math.max(4, (d.runs / maxDailyRuns) * 100)}%` }}
                    />
                    <div
                      className="w-full rounded-t bg-violet-400/60"
                      style={{ height: `${Math.max(4, (d.agents / maxDailyAgents) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-cyan-400/60" />
              <span className="text-xs text-slate-400">Runs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-violet-400/60" />
              <span className="text-xs text-slate-400">Agents Created</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
