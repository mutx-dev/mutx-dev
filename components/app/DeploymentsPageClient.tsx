"use client";

import { useEffect, useState, useRef } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Loader2,
  Play,
  Plus,
  Power,
  RefreshCcw,
  RotateCcw,
  Search,
  Server,
  Trash2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { DeploymentSortSelect } from "./DeploymentSortSelect";

import { Card } from "@/components/ui/Card";
import { ApiRequestError, normalizeCollection, readJson, writeJson } from "@/components/app/http";
import { DeploymentHistory } from "./DeploymentHistory";
import { type components } from "@/app/types/api";

type Deployment = components["schemas"]["DeploymentResponse"];
type Agent = components["schemas"]["AgentResponse"];

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

interface DeploymentCardProps {
  deployment: Deployment;
  onRestart: (id: string) => void;
  onStop: (id: string) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: (id: string) => boolean;
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

function DeploymentCard({ deployment, onRestart, onStop, onStart, onDelete, isProcessing, copiedId, onCopyId }: DeploymentCardProps) {
  const processing = isProcessing(deployment.id);
  const copied = copiedId === deployment.id;

  return (
    <Card className="border border-white/5 bg-white/[0.02] p-5 transition hover:border-emerald-400/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">
            {deployment.id}
          </p>
          <button
            onClick={() => onCopyId(deployment.id)}
            className="text-slate-500 hover:text-cyan-400 transition-colors"
            title="Copy ID"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
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
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          onClick={() => onRestart(deployment.id)}
          disabled={processing}
        >
          <RotateCcw className={`h-3.5 w-3.5 ${processing ? 'animate-spin' : ''}`} />
          Restart
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          onClick={() => deployment.status === "running" ? onStop(deployment.id) : onStart(deployment.id)}
          disabled={processing}
        >
          <Power className="h-3.5 w-3.5" />
          {deployment.status === "running" ? "Stop" : "Start"}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          onClick={() => {}}
        >
          <Activity className="h-3.5 w-3.5" />
          Logs
        </button>
        <DeploymentHistory deploymentId={deployment.id} />
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-50"
          onClick={() => onDelete(deployment.id)}
          disabled={processing}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
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

interface CreateDeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onSubmit: (agentId: string, replicas: number) => Promise<void>;
}

function CreateDeploymentDialog({ open, onOpenChange, agents, onSubmit }: CreateDeploymentDialogProps) {
  const [agentId, setAgentId] = useState("");
  const [replicas, setReplicas] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const availableAgents = agents.filter(a => a.status !== "deployed");

  useEffect(() => {
    if (open && availableAgents.length > 0 && !agentId) {
      setAgentId(availableAgents[0].id);
    }
  }, [open, availableAgents, agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) return;
    
    setSubmitting(true);
    setError("");
    
    try {
      await onSubmit(agentId, replicas);
      onOpenChange(false);
      setAgentId("");
      setReplicas(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deployment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create Deployment</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Agent
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            >
              {availableAgents.length === 0 ? (
                <option value="">No available agents</option>
              ) : (
                availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Replicas
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={replicas}
              onChange={(e) => setReplicas(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !agentId || availableAgents.length === 0}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Deployment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeploymentsPageClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState<"date"|"status"|"agent">("date");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      const data = await readJson<unknown>("/api/dashboard/deployments");
      const deploymentsData = normalizeCollection<Deployment>(data, ["deployments", "items", "data"]).filter(
        (entry): entry is Deployment => Boolean(entry && typeof entry === "object" && "id" in entry),
      );

      setDeployments(deploymentsData);
      setAuthRequired(false);
      setError("");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setDeployments([]);
        setAgents([]);
        setAuthRequired(true);
        setError("Sign in to view and operate deployments.");
        return;
      }

      setAuthRequired(false);
      setError(
        err instanceof Error ? err.message : "Failed to load deployments",
      );
    }
  }

  async function loadAgents() {
    try {
      const data = await readJson<unknown>("/api/dashboard/agents");
      const agentsData = normalizeCollection<Agent>(data, ["agents", "items", "data"]).filter(
        (entry): entry is Agent => Boolean(entry && typeof entry === "object" && "id" in entry),
      );

      setAgents(agentsData);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setAgents([]);
        return;
      }

      console.error("Failed to load agents:", err);
    }
  }

  async function handleCreateDeployment(agentId: string, replicas: number) {
    setProcessingIds(prev => new Set(prev).add("create"));
    try {
      await writeJson<Deployment>("/api/dashboard/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, replicas }),
      });
      await loadDeployments();
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete("create");
        return next;
      });
    }
  }

  async function handleRestart(deploymentId: string) {
    setProcessingIds(prev => new Set(prev).add(deploymentId));
    try {
      await writeJson<Deployment>(`/api/dashboard/deployments/${deploymentId}?action=restart`, {
        method: "POST",
      });
      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart deployment");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(deploymentId);
        return next;
      });
    }
  }

  async function handleStop(deploymentId: string) {
    setProcessingIds(prev => new Set(prev).add(deploymentId));
    try {
      await writeJson<Deployment>(`/api/dashboard/deployments/${deploymentId}?action=scale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replicas: 0 }),
      });
      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop deployment");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(deploymentId);
        return next;
      });
    }
  }

  async function handleStart(deploymentId: string) {
    setProcessingIds(prev => new Set(prev).add(deploymentId));
    try {
      const deployment = deployments.find(d => d.id === deploymentId);
      await writeJson<Deployment>(`/api/dashboard/deployments/${deploymentId}?action=scale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replicas: deployment?.replicas || 1 }),
      });
      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start deployment");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(deploymentId);
        return next;
      });
    }
  }

  async function handleDelete(deploymentId: string) {
    if (!confirm("Are you sure you want to delete this deployment? This action cannot be undone.")) {
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(deploymentId));
    try {
      await writeJson(`/api/dashboard/deployments/${deploymentId}`, {
        method: "DELETE",
      });
      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deployment");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(deploymentId);
        return next;
      });
    }
  }

  function isProcessing(id: string) {
    return processingIds.has(id);
  }

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await Promise.all([loadDeployments(), loadAgents()]);
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

  // Keyboard shortcut: Cmd/Ctrl + K to focus search, Escape to clear
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadDeployments(), loadAgents()]);
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
      <CreateDeploymentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        agents={agents}
        onSubmit={handleCreateDeployment}
      />
      
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
          >
            <Plus className="h-4 w-4" />
            New Deployment
          </button>
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
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span>{error}</span>
            <button
              onClick={async () => {
                setError("");
                await Promise.all([loadDeployments(), loadAgents()]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/20 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-400/30"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
          <button
            onClick={() => setError("")}
            className="text-rose-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
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
          placeholder={isMac ? "Search deployments by ID, agent ID, or status... (⌘K)" : "Search deployments by ID, agent ID, or status... (Ctrl+K)"}
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <DeploymentSortSelect value={sortBy} onChange={setSortBy} />
      </div>

      {authRequired ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-8 text-center">
          <Server className="mx-auto h-12 w-12 text-amber-300" />
          <p className="mt-4 text-lg font-medium text-white">Operator session required</p>
          <p className="mt-2 text-sm text-slate-300">
            Sign in again to load your real deployment inventory and control actions.
            If your session just expired, a refresh should recover automatically on your next request.
          </p>
        </div>
      ) : filteredDeployments.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Server className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-white">No deployments found</p>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery
              ? "Try adjusting your search query"
              : "Deployments will appear here when agents are deployed"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Create Deployment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <DeploymentCard
              key={deployment.id}
              deployment={deployment}
              onRestart={handleRestart}
              onStop={handleStop}
              onStart={handleStart}
              onDelete={handleDelete}
              isProcessing={isProcessing}
              copiedId={copiedId}
              onCopyId={handleCopyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
