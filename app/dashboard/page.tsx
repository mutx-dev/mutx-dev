"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, deploymentsRes, healthRes] = await Promise.all([
          fetch("/api/dashboard/agents"),
          fetch("/api/dashboard/deployments"),
          fetch("/api/dashboard/health"),
        ]);

        // Check for authentication errors first
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
        return "text-slate-400 bg-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    if (error === "auth_required") {
      return (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-cyan-400">Please sign in to view your dashboard</p>
          <a href="/login" className="mt-2 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200">
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Overview of your agents and deployments</p>
        </div>
        {health && (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${getHealthColor(health.status)}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            API: {health.status}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Total Agents</p>
          <p className="mt-2 text-3xl font-bold text-white">{agents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Active Agents</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400">
            {(Array.isArray(agents) ? agents.filter((a: Agent) => a.status === "running").length : 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Total Deployments</p>
          <p className="mt-2 text-3xl font-bold text-white">{deployments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Active Deployments</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {(Array.isArray(deployments) ? deployments.filter((d: Deployment) => d.status === "running").length : 0)}
          </p>
        </div>
      </div>

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
            <div className="mt-4 space-y-3">
              <p className="text-slate-400">No agents yet</p>
              <Link href="/dashboard/agents" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30">
                Create your first agent →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {agents.slice(0, 3).map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <span className="text-slate-200">{agent.name}</span>
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
            <div className="mt-4 space-y-3">
              <p className="text-slate-400">No deployments yet</p>
              <Link href="/dashboard/agents" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30">
                Deploy an agent →
              </Link>
            </div>
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
