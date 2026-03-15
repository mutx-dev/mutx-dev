"use client";

import { Component, type FormEvent, type ReactNode, type ErrorInfo, useState, useEffect } from "react";
import {
  Bot,
  Activity,
  Calendar,
  Clock,
  Copy,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Server,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type Agent = components["schemas"]["AgentResponse"];

type AgentCreateRequest = {
  name: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
};

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

async function createAgent(data: AgentCreateRequest): Promise<Agent> {
  return readJson<Agent>("/api/dashboard/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(agentId)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Delete failed" }));
    throw new Error(payload.detail || "Delete failed");
  }
}

async function stopAgent(agentId: string): Promise<Agent> {
  return readJson<Agent>(`/api/agents/${encodeURIComponent(agentId)}/stop`, {
    method: "POST",
    cache: "no-store",
  });
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

function AgentCard({ agent, onDelete, onStop, deletingId, stoppingId }: { agent: Agent; onDelete: (id: string) => void; onStop: (id: string) => void; deletingId: string | null; stoppingId: string | null }) {
  const [copied, setCopied] = useState(false);
  const isDeleting = deletingId === agent.id;
  const isStopping = stoppingId === agent.id;
  const canStop = agent.status === "running";

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
        <button
          onClick={() => onStop(agent.id)}
          disabled={isStopping || !canStop}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition hover:border-amber-400/30 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStopping ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Power className="h-3 w-3" />
          )}
          Stop
        </button>
        <button
          onClick={() => onDelete(agent.id)}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition hover:border-rose-400/30 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
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

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAgentModal({ isOpen, onClose, onSuccess }: CreateAgentModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState("openai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createAgent({
        name,
        description: description || undefined,
        type: agentType,
      });
      setName("");
      setDescription("");
      setAgentType("openai");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create Agent</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
              placeholder="my-agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Type
            </label>
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="langchain">LangChain</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Agent"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AgentsErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Agents page error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01] py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <X className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-white">Something went wrong</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.05]"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AgentsPageClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

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
      const data = await readJson<{ agents?: Agent[] } | Agent[]>("/api/dashboard/agents");
      
      let agentsData: Agent[];
      if (Array.isArray(data)) {
        agentsData = data;
      } else if (data.agents) {
        agentsData = data.agents;
      } else {
        agentsData = [];
      }
      
      setAgents(agentsData);
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

  async function handleCreateSuccess() {
    await loadAgents();
  }

  async function handleDelete(agentId: string) {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return;
    }

    setDeletingId(agentId);
    try {
      await deleteAgent(agentId);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStop(agentId: string) {
    if (!confirm(`Are you sure you want to stop agent ${agentId}?`)) {
      return;
    }

    setStoppingId(agentId);
    try {
      const updated = await stopAgent(agentId);
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop agent");
    } finally {
      setStoppingId(null);
    }
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
    <AgentsErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-cyan-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
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
          <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span> {error}
            </div>
            <button
              onClick={() => { setError(""); loadAgents(); }}
              className="rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/30"
            >
              Retry
            </button>
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
              <AgentCard key={agent.id} agent={agent} onDelete={handleDelete} onStop={handleStop} deletingId={deletingId} stoppingId={stoppingId} />
            ))}
          </div>
        )}

        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </AgentsErrorBoundary>
  );
}
