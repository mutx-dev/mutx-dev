"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, ProgressRing } from "@/components/dashboard/ui";

interface Agent {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Deployment {
  id: string;
  agent_name: string;
  status: string;
  created_at: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unknown" | string;
  error?: string;
}

interface UsageStats {
  tokens: { used: number; limit: number };
  requests: { used: number; limit: number };
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, deploymentsRes, healthRes, usageRes] = await Promise.all([
          fetch("/api/dashboard/agents"),
          fetch("/api/dashboard/deployments"),
          fetch("/api/dashboard/health"),
          fetch("/api/dashboard/usage"),
        ]);

        if (agentsRes.status === 401 || deploymentsRes.status === 401) {
          setError("auth_required");
          setLoading(false);
          return;
        }

        if (!agentsRes.ok || !deploymentsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const agentsData = await agentsRes.json();
        const deploymentsData = await deploymentsRes.json();
        
        if (healthRes.ok) {
          try {
            const healthData = await healthRes.json();
            setHealth(healthData);
          } catch {
            setHealth({ status: "unknown" });
          }
        } else {
          setHealth({ status: "unknown" });
        }

        if (usageRes.ok) {
          try {
            const usageData = await usageRes.json();
            setUsage(usageData);
          } catch {
            setUsage(null);
          }
        }

        setAgents(agentsData.agents || []);
        setDeployments(deploymentsData.deployments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-400 bg-emerald-500/20";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-text-secondary bg-bg-surface";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-emerald-400 bg-emerald-500/20";
      case "idle":
        return "text-text-secondary bg-bg-surface";
      case "error":
        return "text-red-400 bg-red-500/20";
      case "completed":
        return "text-signal-accent bg-signal-accent/20";
      default:
        return "text-text-secondary bg-bg-surface";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal-accent border-t-transparent" />
      </div>
    );
  }

  if (error) {
    if (error === "auth_required") {
      return (
        <div className="rounded-lg border border-signal-accent/20 bg-signal-accent/10 p-4">
          <p className="text-signal-accent">Please sign in to view your dashboard</p>
          <a href="/login" className="mt-2 inline-block text-sm font-medium text-signal-accent/80 hover:text-signal-accent">
            Sign in →
          </a>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    );
  }

  const runningAgents = agents.filter((a) => a.status === "running").length;
  const runningDeployments = deployments.filter((d) => d.status === "running").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Overview of your agents and deployments</p>
        </div>
        {health && (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${getHealthColor(health.status)}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            API: {health.status}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Agents</p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{agents.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-canvas">
              <Bot className="h-5 w-5 text-text-secondary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Agents</p>
              <p className="mt-2 text-3xl font-bold text-signal-accent">{runningAgents}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-signal-accent/10">
              <Activity className="h-5 w-5 text-signal-accent" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Deployments</p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{deployments.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-canvas">
              <Zap className="h-5 w-5 text-text-secondary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{runningDeployments}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Agents</CardTitle>
            <Link href="/dashboard/agents" className="text-xs font-medium text-signal-accent hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="py-8 text-center">
                <Bot className="mx-auto h-8 w-8 text-text-secondary" />
                <p className="mt-3 text-sm text-text-secondary">No agents yet</p>
                <Link href="/dashboard/spawn">
                  <Button size="sm" className="mt-4">Create Agent</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-canvas p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface">
                        <Bot className="h-4 w-4 text-text-secondary" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-6 py-4">
              <ProgressRing
                value={usage?.tokens.used ?? 75000}
                max={usage?.tokens.limit ?? 100000}
                size={80}
                strokeWidth={8}
                color="#4DA3FF"
              />
              <div className="text-center">
                <p className="text-xs text-text-secondary">Tokens Used</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {(usage?.tokens.used ?? 75000).toLocaleString()} / {(usage?.tokens.limit ?? 100000).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Requests</span>
                <span className="font-medium text-text-primary">{usage?.requests.used ?? 1234} / {usage?.requests.limit ?? 5000}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-canvas">
                <div 
                  className="h-full rounded-full bg-signal-accent" 
                  style={{ width: `${((usage?.requests.used ?? 1234) / (usage?.requests.limit ?? 5000)) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/spawn" className="group">
          <Card className="h-full transition-colors hover:border-signal-accent/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal-accent/10">
                <Zap className="h-5 w-5 text-signal-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Spawn Agent</p>
                <p className="text-xs text-text-secondary">Create new agent</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/monitoring" className="group">
          <Card className="h-full transition-colors hover:border-signal-accent/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Monitoring</p>
                <p className="text-xs text-text-secondary">View metrics</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/orchestration" className="group">
          <Card className="h-full transition-colors hover:border-signal-accent/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Orchestration</p>
                <p className="text-xs text-text-secondary">Manage lanes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/logs" className="group">
          <Card className="h-full transition-colors hover:border-signal-accent/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Activity className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Logs</p>
                <p className="text-xs text-text-secondary">View logs</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
