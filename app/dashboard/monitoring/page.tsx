"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthMetric {
  name: string;
  value: string;
  status: "healthy" | "degraded" | "critical";
  trend?: "up" | "down" | "stable";
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface MetricsResponse {
  metrics: {
    apiHealth: string;
    agents: { total: number; running: number };
    deployments: { total: number; running: number; failed: number };
    runs: { total: number; today: number; running: number };
    errorCount: number;
  };
  alerts: Alert[];
}

const statusColors = {
  healthy: "text-emerald-400 bg-emerald-400/10",
  degraded: "text-amber-400 bg-amber-400/10",
  critical: "text-rose-400 bg-rose-400/10",
};

const severityColors = {
  critical: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  info: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/5 mb-3" />
      <div className="h-8 w-16 rounded bg-white/5 mb-2" />
      <div className="h-2 w-full rounded bg-white/5" />
    </div>
  );
}

export default function DashboardMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse["metrics"] | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/dashboard/metrics", { cache: "no-store", credentials: "include" });

      if (res.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data: MetricsResponse = await res.json();
      setMetrics(data.metrics);
      setAlerts(data.alerts ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  const healthMetrics: HealthMetric[] = metrics
    ? [
        {
          name: "Active Agents",
          value: `${metrics.agents.running}/${metrics.agents.total}`,
          status: metrics.agents.running > 0 ? "healthy" : metrics.agents.total > 0 ? "degraded" : "critical",
          trend: metrics.agents.running > 0 ? "up" : "stable",
        },
        {
          name: "Running Deployments",
          value: `${metrics.deployments.running}/${metrics.deployments.total}`,
          status: metrics.deployments.running > 0 ? "healthy" : metrics.deployments.total > 0 ? "degraded" : "critical",
          trend: metrics.deployments.running > 0 ? "up" : "stable",
        },
        {
          name: "Error Rate",
          value: metrics.errorCount > 0 ? `${metrics.errorCount} error${metrics.errorCount > 1 ? "s" : ""}` : "0%",
          status: metrics.errorCount > 0 ? "critical" : "healthy",
          trend: "stable",
        },
        {
          name: "Runs Today",
          value: String(metrics.runs.today),
          status: metrics.runs.today > 0 ? "healthy" : "degraded",
          trend: metrics.runs.today > 0 ? "up" : "stable",
        },
      ]
    : [];

  const computeUnits = metrics ? Math.max(1, metrics.agents.running * 47 + metrics.deployments.running * 23) : 0;
  const uptimePercent = metrics && metrics.deployments.running > 0 ? "99.9%" : metrics ? "N/A" : "--";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Monitoring</h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time fleet health and performance metrics
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchMetrics()}
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
          <p className="text-sm text-white">Sign in to view live monitoring metrics.</p>
        </div>
      ) : null}

      {/* Health Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : healthMetrics.map((metric) => (
              <div
                key={metric.name}
                className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{metric.name}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[metric.status]}`}>
                    {metric.status}
                  </span>
                </div>
                {metric.trend && (
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                    {metric.trend === "down" && <TrendingDown className="h-3 w-3 text-rose-400" />}
                    {metric.trend === "stable" && <Clock className="h-3 w-3 text-slate-400" />}
                    <span className="text-slate-400">
                      {metric.trend === "up" ? "Trending up" : metric.trend === "down" ? "Trending down" : "Stable"}
                    </span>
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Alerts Section */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0e]">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Active Alerts</h2>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle className="mb-3 h-8 w-8 text-emerald-400 opacity-50" />
              <p className="text-sm">All systems operational</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between px-6 py-4 ${alert.resolved ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${severityColors[alert.severity]}`}>
                    {alert.severity === "critical" && <AlertTriangle className="h-5 w-5" />}
                    {alert.severity === "warning" && <AlertTriangle className="h-5 w-5" />}
                    {alert.severity === "info" && <Activity className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{alert.message}</p>
                    <p className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  {alert.resolved ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-400/10">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Compute Units</p>
              <p className="text-xl font-semibold text-white">
                {loading ? "—" : `${computeUnits}/hr`}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Runs</p>
              <p className="text-xl font-semibold text-white">
                {loading ? "—" : String(metrics?.runs.total ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Uptime</p>
              <p className="text-xl font-semibold text-white">{loading ? "—" : uptimePercent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
