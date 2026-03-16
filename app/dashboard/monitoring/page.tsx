"use client";

import { useState } from "react";
import { Activity, Cpu, Zap, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

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

const mockHealth: HealthMetric[] = [
  { name: "API Latency", value: "124ms", status: "healthy", trend: "down" },
  { name: "Error Rate", value: "0.02%", status: "healthy", trend: "stable" },
  { name: "Active Agents", value: "12/15", status: "degraded", trend: "down" },
  { name: "Token Usage", value: "2.4M/day", status: "healthy", trend: "up" },
];

const mockAlerts: Alert[] = [
  { id: "alert_1", severity: "critical", message: "Agent codex-agent-03 failed to start", timestamp: "2026-03-16T07:35:00Z", resolved: false },
  { id: "alert_2", severity: "warning", message: "High memory usage on gpt-operator instance", timestamp: "2026-03-16T07:20:00Z", resolved: false },
  { id: "alert_3", severity: "info", message: "Scheduled scale-down completed for swarm prod-01", timestamp: "2026-03-16T07:00:00Z", resolved: true },
];

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

export default function DashboardMonitoringPage() {
  const [alerts, setAlerts] = useState(mockAlerts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Monitoring</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time fleet health and performance metrics</p>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockHealth.map((metric) => (
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
                <span className="text-slate-400">vs last hour</span>
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
          {alerts.map((alert) => (
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
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Compute Units</p>
              <p className="text-xl font-semibold text-white">847/hr</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tokens Today</p>
              <p className="text-xl font-semibold text-white">2.4M</p>
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
              <p className="text-xl font-semibold text-white">99.94%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
