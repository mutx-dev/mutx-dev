"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Loader2,
  Play,
  Power,
  RefreshCcw,
  RotateCcw,
  Search,
  Server,
} from "lucide-react";
import { DeploymentSortSelect } from "./DeploymentSortSelect";

import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type Deployment = components["schemas"]["DeploymentResponse"];
type DeploymentEvent = components["schemas"]["DeploymentEventResponse"];

async function readJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await response
    .json()
    .catch(() => ({ detail: "Request failed" }));

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Request failed");
  }

  return payload as T;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "Not recorded";

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Invalid timestamp";

  const diffMs = then - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return rtf.format(days, "day");
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" || status === "healthy"
      ? "bg-emerald-300"
      : status === "failed" || status === "error" || status === "unhealthy"
        ? "bg-rose-300"
        : "bg-amber-300";

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function statusTone(status: string) {
  if (status === "running" || status === "healthy") {
    return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
  }

  if (status === "failed" || status === "error" || status === "unhealthy") {
    return "bg-rose-400/10 text-rose-300 border-rose-400/20";
  }

  return "bg-amber-400/10 text-amber-300 border-amber-400/20";
}

function DeploymentCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-48 rounded bg-white/10" />
          <div className="mt-2 h-4 w-32 rounded bg-white/5" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="h-12 rounded-lg bg-white/5" />
        <div className="h-12 rounded-lg bg-white/5" />
        <div className="h-12 rounded-lg bg-white/5" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 rounded bg-white/5" />
        <div className="h-8 w-20 rounded bg-white/5" />
        <div className="h-8 w-20 rounded bg-white/5" />
      </div>
    </div>
  );
}

function DeploymentCard({ deployment }: { deployment: Deployment }) {
  return (
    <Card className="border border-white/5 bg-white/[0.02] p-5 transition hover:border-emerald-400/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {deployment.id}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Agent: {deployment.agent_id}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusTone(
            deployment.status,
          )}`}
        >
          <StatusDot status={deployment.status} />
          {deployment.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
          <Server className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">Replicas</p>
            <p className="text-sm font-medium text-white">
              {deployment.replicas}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
          <Calendar className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">Created</p>
            <p className="text-sm font-medium text-white">
              {formatRelativeDate(deployment.started_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
          <Clock className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">Updated</p>
            <p className="text-sm font-medium text-white">
              {formatRelativeDate(deployment.ended_at)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          onClick={() => console.log("restart", deployment.id)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          onClick={() => console.log("start/stop", deployment.id)}
        >
          <Power className="h-3.5 w-3.5" />
          {deployment.status === "running" ? "Stop" : "Start"}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          onClick={() => console.log("logs", deployment.id)}
        >
          <Activity className="h-3.5 w-3.5" />
          Logs
        </button>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <DeploymentCardSkeleton />
      <DeploymentCardSkeleton />
      <DeploymentCardSkeleton />
    </div>
  );
}

export function DeploymentsPageClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date"|"status"|"agent">("date");

  const runningDeployments = deployments.filter(
    (d) => d.status === "running",
  ).length;

  const lastUpdated = deployments.length > 0
    ? deployments.reduce((latest, d) => {
        const dDate = d.started_at ? new Date(d.started_at).getTime() : 0;
        return dDate > latest ? dDate : latest;
      }, 0)
    : null;

  const filteredDeployments = deployments
    .filter(
      (deployment) =>
        deployment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deployment.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deployment.status.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        const aDate = a.started_at ? new Date(a.started_at).getTime() : 0;
        const bDate = b.started_at ? new Date(b.started_at).getTime() : 0;
        return bDate - aDate;
      }
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return a.agent_id.localeCompare(b.agent_id);
    });

  async function loadDeployments() {
    try {
      const data = await readJson<Deployment[]>("/api/dashboard/deployments");
      setDeployments(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load deployments",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadDeployments();
      } catch {
        // Error already handled in loadDeployments
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadDeployments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDeployments();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-48 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Deployments</h1>
              <p className="mt-1 text-sm text-slate-400">
                Deployment timeline and recovery controls
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {deployments.length}
              </p>
              <p className="text-xs text-slate-500">Total Deployments</p>
            </div>
          </div>
        </Card>
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {runningDeployments}
              </p>
              <p className="text-xs text-slate-500">Running</p>
            </div>
          </div>
        </Card>
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {lastUpdated ? formatRelativeDate(new Date(lastUpdated).toISOString()) : "N/A"}
              </p>
              <p className="text-xs text-slate-500">Last Updated</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search deployments by ID, agent ID, or status..."
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <DeploymentSortSelect value={sortBy} onChange={setSortBy} />
      </div>

      {filteredDeployments.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Server className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-white">No deployments found</p>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery
              ? "Try adjusting your search query"
              : "Deployments will appear here when agents are deployed"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <DeploymentCard key={deployment.id} deployment={deployment} />
          ))}
        </div>
      )}
    </div>
  );
}
