"use client";

import { Activity, TrendingUp, DollarSign, Clock, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, ProgressRing } from "@/components/dashboard/ui";

const metrics = [
  { label: "Requests", value: 12453, limit: 20000, icon: Activity, color: "#4DA3FF" },
  { label: "Tokens", value: 245000, limit: 500000, icon: Zap, color: "#8B5CF6" },
  { label: "Cost", value: 45.20, limit: 100, icon: DollarSign, color: "#10B981" },
  { label: "Latency", value: 145, limit: 500, icon: Clock, color: "#F59E0B" },
];

const agentMetrics = [
  { name: "assistant-prod-01", requests: 4500, latency: "120ms", errors: 2 },
  { name: "coder-worker-02", requests: 3200, latency: "180ms", errors: 5 },
  { name: "research-main", requests: 2800, latency: "95ms", errors: 0 },
  { name: "data-processor", requests: 1953, latency: "210ms", errors: 1 },
];

export default function DashboardMonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Monitoring</h1>
          <p className="mt-1 text-sm text-text-secondary">Real-time metrics and health status</p>
        </div>
        <Button variant="secondary" size="sm">Export</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => {
          const percentage = (metric.value / metric.limit) * 100;
          return (
            <Card key={metric.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProgressRing
                    value={metric.value}
                    max={metric.limit}
                    size={56}
                    strokeWidth={5}
                    color={metric.color}
                  />
                  <div>
                    <p className="text-xs font-medium text-text-secondary">{metric.label}</p>
                    <p className="text-lg font-bold text-text-primary">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                </div>
                <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="pb-3 text-xs font-medium text-text-secondary">Agent</th>
                    <th className="pb-3 text-xs font-medium text-text-secondary">Requests</th>
                    <th className="pb-3 text-xs font-medium text-text-secondary">Latency</th>
                    <th className="pb-3 text-xs font-medium text-text-secondary">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {agentMetrics.map((agent) => (
                    <tr key={agent.name} className="border-b border-border-subtle last:border-0">
                      <td className="py-3 text-sm font-medium text-text-primary">{agent.name}</td>
                      <td className="py-3 text-sm text-text-secondary">{agent.requests.toLocaleString()}</td>
                      <td className="py-3 text-sm text-text-secondary">{agent.latency}</td>
                      <td className="py-3">
                        <span className={`text-sm ${agent.errors > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {agent.errors}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">API Health</p>
                  <p className="text-xs text-text-secondary">All systems operational</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal-accent/10">
                  <TrendingUp className="h-5 w-5 text-signal-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Uptime</p>
                  <p className="text-xs text-text-secondary">Last 30 days</p>
                </div>
              </div>
              <span className="text-sm font-bold text-text-primary">99.9%</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Alerts</p>
                  <p className="text-xs text-text-secondary">Active warnings</p>
                </div>
              </div>
              <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-500">
                2
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
