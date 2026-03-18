"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Server } from "lucide-react";

import { EmptyState, ShellAuthRequiredState, ShellErrorState, ShellLoadingState } from "@/components/dashboard";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { DashboardOverview } from "@/components/ui/dashboard-widgets";

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
  status: "healthy" | "degraded" | "unhealthy" | "unknown" | string;
  error?: string;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [agentsRes, deploymentsRes, healthRes] = await Promise.all([
        fetch("/api/dashboard/agents", { cache: "no-store" }),
        fetch("/api/dashboard/deployments", { cache: "no-store" }),
        fetch("/api/dashboard/health", { cache: "no-store" }),
      ]);

      if (agentsRes.status === 401 || deploymentsRes.status === 401) {
        setError("auth_required");
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

      setAgents(agentsData.agents || []);
      setDeployments(deploymentsData.deployments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return <ShellLoadingState variant="cards" count={4} />;
  }

  if (error) {
    if (error === "auth_required") {
      return <ShellAuthRequiredState message="Please sign in to view your dashboard." />;
    }
    return <ShellErrorState message={error} onRetry={fetchData} />;
  }

  const agentStats = {
    total: agents.length,
    running: agents.filter((a) => a.status === "running").length,
    stopped: agents.filter((a) => a.status !== "running").length,
  };

  const deploymentStats = {
    total: deployments.length,
    running: deployments.filter((d) => d.status === "running").length,
    failed: deployments.filter((d) => d.status === "failed").length,
  };

  const apiHealth: HealthStatus["status"] = health?.status ?? "unknown";

  return (
    <div className="space-y-8">
      {/* Ported from mutx-control dashboard.tsx — enriched overview with SignalPills + metric cards */}
      <DashboardOverview
        agentStats={agentStats}
        deploymentStats={deploymentStats}
        apiHealth={apiHealth as "healthy" | "degraded" | "unhealthy" | "unknown"}
      />

      {/* Quick Links */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agents Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Agents</h2>
            <Link
              href="/dashboard/agents"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              View all →
            </Link>
          </div>
          {agents.length === 0 ? (
            <EmptyState
              className="mt-4 border-white/10 bg-black/30 px-4 py-8"
              title="No agents yet"
              message="Create your first agent to start running tasks."
              icon={<Bot className="h-7 w-7" />}
              ctaLabel="Create agent"
              ctaHref="/dashboard/agents"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {agents.slice(0, 3).map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <AgentAvatar name={agent.name} size="sm" />
                    <span className="truncate text-slate-200">{agent.name}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      agent.status === "running"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {agent.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Deployments Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Deployments</h2>
            <Link
              href="/dashboard/deployments"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              View all →
            </Link>
          </div>
          {deployments.length === 0 ? (
            <EmptyState
              className="mt-4 border-white/10 bg-black/30 px-4 py-8"
              title="No deployments yet"
              message="Deploy an agent to monitor runtime health and status."
              icon={<Server className="h-7 w-7" />}
              ctaLabel="Deploy agent"
              ctaHref="/dashboard/agents"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {deployments.slice(0, 3).map((deployment) => (
                <li
                  key={deployment.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <span className="text-slate-200">{deployment.agent_name}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      deployment.status === "running"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {deployment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Webhooks Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Webhooks</h2>
            <Link
              href="/dashboard/webhooks"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              Manage →
            </Link>
          </div>
          <p className="mt-4 text-slate-400">Configure webhook endpoints for real-time events</p>
        </div>
      </div>
    </div>
  );
}
