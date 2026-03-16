"use client";

import { Layers, ArrowRight, Plus, Settings, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/dashboard/ui";

const lanes = [
  { id: "1", name: "ingress", agents: ["api-gateway"], status: "active", queueDepth: 12 },
  { id: "2", name: "processing", agents: ["assistant-prod", "coder-worker"], status: "active", queueDepth: 8 },
  { id: "3", name: "storage", agents: ["data-processor"], status: "active", queueDepth: 3 },
  { id: "4", name: "notification", agents: ["notify-service"], status: "paused", queueDepth: 0 },
];

const handoffs = [
  { from: "ingress", to: "processing", rule: "round-robin" },
  { from: "processing", to: "storage", rule: "weighted" },
  { from: "processing", to: "notification", rule: "on-error" },
];

export default function DashboardOrchestrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orchestration</h1>
          <p className="mt-1 text-sm text-text-secondary">Lane definitions and execution flow</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Lane
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Lanes</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{lanes.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-signal-accent/10">
              <Layers className="h-6 w-6 text-signal-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Queue Depth</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">23</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Layers className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Flows</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">3</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <ArrowRight className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lanes.map((lane) => (
                <div
                  key={lane.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-surface">
                      <Layers className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{lane.name}</p>
                      <p className="text-xs text-text-secondary">{lane.agents.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Queue</p>
                      <p className="text-sm font-medium text-text-primary">{lane.queueDepth}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      lane.status === "active" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-bg-surface text-text-secondary"
                    }`}>
                      {lane.status}
                    </span>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handoff Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {handoffs.map((handoff, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-accent/10">
                      <span className="text-xs font-medium text-signal-accent">{handoff.from.slice(0, 2)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-secondary" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                      <span className="text-xs font-medium text-purple-400">{handoff.to.slice(0, 2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary">
                      {handoff.rule}
                    </span>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="mt-4 w-full">
              <Plus className="h-4 w-4" />
              Add Handoff Rule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
