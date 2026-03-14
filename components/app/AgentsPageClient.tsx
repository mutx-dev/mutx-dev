"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Activity,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Server,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type Agent = components["schemas"]["AgentResponse"];

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

function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="mt-2 h-4 w-48 rounded bg-white/5" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="h-12 rounded-lg bg-white/5" />
        <div className="h-12 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(agent.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-white/5 bg-white/[0.02] p-5 transition hover:border-cyan-400/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white truncate">{agent.name}</h3>
              <p className="mt-1 text-xs text-slate-500 font-[family:var(--font-mono)]">
                {agent.id}
              </p>
            </div>
          </div>
          
          {agent.description && (
            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>
        
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusTone(agent.status)}`}
        >
          <StatusDot status={agent.status} />
          {agent.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
            <Calendar className="h-3 w-3" />
            Created
          </div>
          <p className="mt-2 text-sm text-white font-[family:var(--font-mono)]">
            {formatDate(agent.created_at)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatRelativeDate(agent.created_at)}
          </p>
        </div>
        
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
            <Clock className="h-3 w-3" />
            Updated
          </div>
          <p className="mt-2 text-sm text-white font-[family:var(--font-mono)]">
            {formatDate(agent.updated_at)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatRelativeDate(agent.updated_at)}
          </p>
        </div>
      </div>

      {agent.config && Object.keys(agent.config).length > 0 && (
        <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            <FileText className="h-3 w-3" />
            Configuration
          </div>
          <pre className="text-xs text-slate-400 overflow-x-auto">
            {JSON.stringify(agent.config, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={copyId}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-400"
        >
          {copied ? (
            <>
              <Copy className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy ID
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01] py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500">
        <Bot className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">No agents found</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Agents you create will appear here. Authenticate and provision your first agent to see it in the fleet inventory.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <AgentCardSkeleton />
      <AgentCardSkeleton />
      <AgentCardSkeleton />
    </div>
  );
}

export function AgentsPageClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const runningAgents = agents.filter((a) => a.status === "running").length;
  const failedAgents = agents.filter(
    (a) => a.status === "failed" || a.status === "error",
  ).length;

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  async function loadAgents() {
    try {
      const data = await readJson<Agent[]>("/api/dashboard/agents");
      setAgents(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadAgents();
      } catch {
        // Error already handled in loadAgents
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

  async function handleRefresh() {
    setRefreshing(true);
    await loadAgents();
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Agents</h1>
              <p className="mt-1 text-sm text-slate-400">
                Live inventory of your agent fleet
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{agents.length}</p>
              <p className="text-xs text-slate-500">Total Agents</p>
            </div>
          </div>
        </Card>
        
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{runningAgents}</p>
              <p className="text-xs text-slate-500">Running</p>
            </div>
          </div>
        </Card>
        
        <Card className="border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{failedAgents}</p>
              <p className="text-xs text-slate-500">Failed</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents by name, ID, or description..."
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
        />
      </div>

      {agents.length === 0 ? (
        <EmptyState />
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01] py-16 text-center">
          <Search className="h-8 w-8 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No matching agents</h3>
          <p className="mt-2 text-sm text-slate-400">
            No agents match your search query. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
