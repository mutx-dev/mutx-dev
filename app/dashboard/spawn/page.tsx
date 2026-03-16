"use client";

import { Zap, Layers, Play, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/dashboard/ui";

const templates = [
  { id: "assistant", name: "Assistant Agent", description: "General purpose conversational agent", icon: "🤖" },
  { id: "coder", name: "Code Agent", description: "Specialized in code generation and review", icon: "💻" },
  { id: "researcher", name: "Research Agent", description: "Web search and information gathering", icon: "🔍" },
  { id: "data", name: "Data Agent", description: "Data processing and analysis", icon: "📊" },
];

const recentSpawns = [
  { id: "1", name: "assistant-prod-01", template: "Assistant Agent", status: "running", time: "2 min ago" },
  { id: "2", name: "coder-worker-02", template: "Code Agent", status: "completed", time: "15 min ago" },
  { id: "3", name: "research-main", template: "Research Agent", status: "idle", time: "1 hour ago" },
];

export default function DashboardSpawnPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Spawn</h1>
          <p className="mt-1 text-sm text-text-secondary">Provision new agents from templates</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <button
                key={template.id}
                className="flex flex-col items-start rounded-lg border border-border-subtle bg-bg-canvas p-4 text-left transition-colors hover:border-signal-accent/50"
              >
                <span className="text-2xl">{template.icon}</span>
                <p className="mt-3 text-sm font-medium text-text-primary">{template.name}</p>
                <p className="mt-1 text-xs text-text-secondary">{template.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Runtime Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Agent Name</label>
              <Input placeholder="e.g., my-agent-prod" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Environment</label>
              <div className="mt-1.5 flex gap-2">
                <Button variant="secondary" size="sm">Development</Button>
                <Button variant="ghost" size="sm">Staging</Button>
                <Button variant="ghost" size="sm">Production</Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Memory (MB)</label>
              <Input type="number" placeholder="512" className="mt-1.5" />
            </div>
            <Button className="w-full">
              <Zap className="h-4 w-4" />
              Spawn Agent
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Spawns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSpawns.map((spawn) => (
                <div
                  key={spawn.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-surface">
                      {spawn.status === "running" ? (
                        <Play className="h-4 w-4 text-signal-accent" />
                      ) : spawn.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{spawn.name}</p>
                      <p className="text-xs text-text-secondary">{spawn.template}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary">{spawn.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
