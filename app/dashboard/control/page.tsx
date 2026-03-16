"use client";

import { Gauge, Play, Pause, Square, Shield, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/dashboard/ui";

const agents = [
  { id: "1", name: "assistant-prod-01", status: "running", selected: false },
  { id: "2", name: "coder-worker-02", status: "running", selected: false },
  { id: "3", name: "research-main", status: "idle", selected: false },
  { id: "4", name: "data-processor", status: "idle", selected: false },
];

const policies = [
  { id: "auto-restart", name: "Auto-restart on failure", enabled: true },
  { id: "rate-limit", name: "Rate limiting", enabled: true },
  { id: "cost-cap", name: "Cost capping", enabled: false },
  { id: "audit-log", name: "Audit logging", enabled: true },
];

export default function DashboardControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Control Plane</h1>
          <p className="mt-1 text-sm text-text-secondary">Fleet controls and policy management</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Fleet Status</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">Running</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Gauge className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary">
              <Pause className="h-4 w-4" />
              Pause All
            </Button>
            <Button size="sm" variant="danger">
              <Square className="h-4 w-4" />
              Stop All
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Agents</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">12 / 20</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-signal-accent/10">
              <Users className="h-6 w-6 text-signal-accent" />
            </div>
          </div>
          <p className="mt-4 text-xs text-text-secondary">8 slots available</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Safety Status</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">Secure</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <p className="mt-4 text-xs text-text-secondary">All policies enforced</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-subtle bg-bg-surface accent-signal-accent"
                    />
                    <span className="text-sm font-medium text-text-primary">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      agent.status === "running" ? "bg-emerald-500/20 text-emerald-400" : "bg-bg-surface text-text-secondary"
                    }`}>
                      {agent.status}
                    </span>
                    <Button size="sm" variant="ghost">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Pause className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary">
                Start Selected
              </Button>
              <Button size="sm" variant="secondary">
                Stop Selected
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-3"
                >
                  <div className="flex items-center gap-3">
                    {policy.id === "cost-cap" || policy.id === "audit-log" ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Shield className="h-4 w-4 text-text-secondary" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{policy.name}</span>
                  </div>
                  <button
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      policy.enabled ? "bg-signal-accent" : "bg-bg-surface"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        policy.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
