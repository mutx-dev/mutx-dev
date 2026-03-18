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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Overview of your agents and deployments</p>
        </div>
        {health && (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${getHealthColor(health.status)}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="hidden sm:inline">API: {health.status}</span>
            <span className="sm:hidden">{health.status}</span>
          </div>
        )}
      </div>

      {/* Stats Grid - responsive: 2 cols on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">Total Agents</p>
          <p className="mt-1 text-2xl font-bold text-white sm:mt-2 sm:text-3xl">{agents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">Active Agents</p>
          <p className="mt-1 text-2xl font-bold text-cyan-400 sm:mt-2 sm:text-3xl">
            {agents.filter((a) => a.status === "running").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">Total Deployments</p>
          <p className="mt-1 text-2xl font-bold text-white sm:mt-2 sm:text-3xl">{deployments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">Active Deployments</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400 sm:mt-2 sm:text-3xl">
            {deployments.filter((d) => d.status === "running").length}
          </p>
        </div>
      </div>

      {/* Quick Links - responsive: 1 col mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Agents Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Agents</h2>
            <Link
              href="/dashboard/agents"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 sm:text-sm"
            >
              View all →
            </Link>
          </div>
          {agents.length === 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-400">No agents yet</p>
              <Link href="/dashboard/agents" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/30 sm:px-4 sm:text-sm">
                Create your first agent →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2 sm:space-y-3">
              {agents.slice(0, 3).map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2.5 sm:p-3"
                >
                  <span className="truncate text-sm text-slate-200">{agent.name}</span>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Deployments</h2>
            <Link
              href="/dashboard/deployments"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 sm:text-sm"
            >
              View all →
            </Link>
          </div>
          {deployments.length === 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-400">No deployments yet</p>
              <Link href="/dashboard/agents" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/30 sm:px-4 sm:text-sm">
                Deploy an agent →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2 sm:space-y-3">
              {deployments.slice(0, 3).map((deployment) => (
                <li
                  key={deployment.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2.5 sm:p-3"
                >
                  <span className="truncate text-sm text-slate-200">{deployment.agent_name}</span>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white sm:text-lg">Webhooks</h2>
            <Link
              href="/dashboard/webhooks"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 sm:text-sm"
            >
              Manage →
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">Configure webhook endpoints for real-time events</p>
        </div>
      </div>
    </div>
  );
}
