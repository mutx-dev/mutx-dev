"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bot, RefreshCw, Search, Server, Activity } from "lucide-react";

import { AgentCard, type AgentCardProps } from "./AgentCard";
import { EmptyState } from "./EmptyState";

interface Agent {
  id: string;
  name: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function mapStatusToDashboardStatus(status: string): AgentCardProps["status"] {
  switch (status) {
    case "running":
      return "running";
    case "failed":
    case "error":
      return "error";
    case "stopped":
    case "idle":
      return "idle";
    case "success":
      return "success";
    default:
      return "idle";
  }
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function AgentListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="mt-2 h-4 w-48 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="mt-2 h-4 w-48 rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface AgentsListClientProps {
  initialAgents?: Agent[];
}

export function AgentsListClient({ initialAgents }: AgentsListClientProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents ?? []);
  const [loading, setLoading] = useState(!initialAgents);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function fetchAgents() {
    try {
      const response = await fetch("/api/dashboard/agents", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      const agentsData = Array.isArray(data) ? data : data.agents ?? [];
      setAgents(agentsData);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!initialAgents) {
      fetchAgents();
    }
  }, [initialAgents]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAgents();
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  const runningCount = agents.filter((a) => a.status === "running").length;
  const totalCount = agents.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 animate-pulse" />
              <div>
                <div className="h-6 w-8 rounded bg-white/10 animate-pulse" />
                <div className="mt-1 h-3 w-16 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 animate-pulse" />
              <div>
                <div className="h-6 w-8 rounded bg-white/10 animate-pulse" />
                <div className="mt-1 h-3 w-16 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 animate-pulse" />
              <div>
                <div className="h-6 w-8 rounded bg-white/10 animate-pulse" />
                <div className="mt-1 h-3 w-16 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <AgentListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="rounded-xl border border-white/10 bg-black/20 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(6, 182, 212, 0.1)", color: "#22d3ee" }}
            >
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalCount}</p>
              <p className="text-xs text-slate-500">Total Agents</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-black/20 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#34d399" }}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{runningCount}</p>
              <p className="text-xs text-slate-500">Running</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-black/20 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(148, 163, 184, 0.1)", color: "#94a3b8" }}
            >
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {totalCount - runningCount}
              </p>
              <p className="text-xs text-slate-500">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-400/20 bg-red-400/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/20"
          >
            Retry
          </button>
        </div>
      ) : null}

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          title="No agents yet"
          message="Create your first agent to see it here."
          icon={<Bot className="h-8 w-8" />}
        />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          title="No matching agents"
          message="No agents match your search query."
          icon={<Search className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              lane={agent.id.slice(0, 8)}
              currentTask={agent.description ?? "No description"}
              status={mapStatusToDashboardStatus(agent.status)}
              description={agent.description ?? undefined}
              updatedAt={formatRelativeTime(agent.updated_at)}
              icon={<Bot className="h-4 w-4" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
