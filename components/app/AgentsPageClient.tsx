"use client";

import { Component, type FormEvent, type ReactNode, type ErrorInfo, useState, useEffect, useRef } from "react";
import {
  Bot,
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

import { ApiRequestError, extractApiErrorMessage, normalizeCollection, readJson } from "@/components/app/http";
import { DashboardDialog } from "@/components/dashboard/DashboardDialog";
import { EmptyState as DashboardEmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  LiveAuthRequired,
  LiveKpiGrid,
  LiveMiniStat,
  LiveMiniStatGrid,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { type components } from "@/app/types/api";

type Agent = components["schemas"]["AgentResponse"];

type AgentCreateRequest = {
  name: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
};

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
    throw new Error(extractApiErrorMessage(payload, "Delete failed"));
  }
}

async function stopAgent(agentId: string): Promise<{ status: string }> {
  return readJson<{ status: string }>(`/api/dashboard/agents/${encodeURIComponent(agentId)}?action=stop`, {
    method: "POST",
    cache: "no-store",
  });
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
    <article className="dashboard-entry rounded-[20px] border border-[#273543] bg-[linear-gradient(180deg,#18212b_0%,#0f151d_100%)] p-5 shadow-[0_18px_40px_rgba(1,5,11,0.22)] transition hover:border-sky-300/28">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-sky-400/16 bg-sky-400/10 text-sky-200">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
                {agent.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="max-w-full truncate rounded-full border border-[#293543] bg-[#10161d] px-2.5 py-1 text-[11px] text-slate-400 font-[family:var(--font-mono)]">
                  {agent.id}
                </p>
                <button
                  onClick={copyId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#293543] bg-[#10161d] px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-200"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied" : "Copy ID"}
                </button>
              </div>
            </div>
          </div>
          
          {agent.description && (
            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>

        <StatusBadge status={asDashboardStatus(agent.status)} label={agent.status} />
      </div>

      <div className="mt-4">
        <LiveMiniStatGrid>
          <LiveMiniStat
            label="Created"
            value={formatDateTime(agent.created_at)}
            detail={formatRelativeTime(agent.created_at)}
            icon={Calendar}
          />
          <LiveMiniStat
            label="Updated"
            value={formatDateTime(agent.updated_at)}
            detail={formatRelativeTime(agent.updated_at)}
            icon={Clock}
          />
        </LiveMiniStatGrid>
      </div>

      {agent.config && Object.keys(agent.config).length > 0 && (
        <div className="mt-4 rounded-[16px] border border-[#253140] bg-[#0b1118] p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
            Configuration
          </div>
          <pre className="overflow-x-auto rounded-[12px] border border-[#1f2a36] bg-[#080d13] px-3 py-2 text-xs text-slate-400">
            {JSON.stringify(agent.config, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onStop(agent.id)}
          disabled={isStopping || !canStop}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#293543] bg-[#0e141b] px-3 py-2 text-xs text-slate-400 transition hover:border-amber-400/30 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#34212a] bg-[#130f14] px-3 py-2 text-xs text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
        </button>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <DashboardEmptyState
      title="Nothing here yet"
      message="No agents found. Authenticate and provision your first agent to see it in the fleet inventory."
      icon={<Bot className="h-8 w-8" />}
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
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
  const fieldClassName =
    "w-full rounded-[14px] border border-[#2e3946] bg-[#0b1017] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-sky-300/30 focus:outline-none";

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
    <DashboardDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Create Agent"
      description="Register a new agent in the fleet inventory and seed its initial runtime profile."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-[#2e3946] bg-[#0d131a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-300/24"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-agent-form"
            disabled={loading || !name}
            className="rounded-[12px] bg-sky-300 px-4 py-2 text-sm font-medium text-[#071018] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
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
        </>
      }
    >
      <form id="create-agent-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={fieldClassName}
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
              className={`${fieldClassName} resize-none`}
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
              className={fieldClassName}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="langchain">LangChain</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {error && (
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
      </form>
    </DashboardDialog>
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
  const [authRequired, setAuthRequired] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);

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
      const data = await readJson<unknown>("/api/dashboard/agents");
      const agentsData = normalizeCollection<Agent>(data, ["agents", "items", "data"]).filter(
        (entry): entry is Agent => Boolean(entry && typeof entry === "object" && "id" in entry),
      );

      setAgents(agentsData);
      setAuthRequired(false);
      setError("");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setAgents([]);
        setAuthRequired(true);
        setError("Sign in to view and operate agents.");
        return;
      }

      setAuthRequired(false);
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

  // Detect Mac OS
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
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
      await stopAgent(agentId);
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId ? { ...agent, status: "stopped" } : agent,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop agent");
    } finally {
      setStoppingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingState />
      </div>
    );
  }

  return (
    <AgentsErrorBoundary>
      <div className="space-y-4">
        <LiveKpiGrid>
          <LiveStatCard
            label="Fleet"
            value={String(agents.length)}
            detail="Total agents currently visible in the MUTX registry."
            status={asDashboardStatus(agents.length > 0 ? "running" : "idle")}
          />
          <LiveStatCard
            label="Running"
            value={String(runningAgents)}
            detail="Agents actively reporting running state."
            status={asDashboardStatus(runningAgents > 0 ? "running" : "idle")}
          />
          <LiveStatCard
            label="Failed"
            value={String(failedAgents)}
            detail="Agents that need intervention before the next rollout."
            status={asDashboardStatus(failedAgents > 0 ? "error" : "idle")}
          />
          <LiveStatCard
            label="Search Scope"
            value={searchQuery ? `${filteredAgents.length} visible` : "registry"}
            detail="Search matches name, id, and description fields."
            status={asDashboardStatus(searchQuery ? "active" : "idle")}
          />
        </LiveKpiGrid>

        {error && !authRequired && (
          <div className="flex items-center justify-between rounded-[18px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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

        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          searchPlaceholder={
            isMac
              ? "Search agents by name, ID, or description... (⌘K)"
              : "Search agents by name, ID, or description... (Ctrl+K)"
          }
          onReset={() => setSearchQuery("")}
          trailing={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-[14px] border border-[#2f3c49] bg-[#10161d] px-3.5 py-2 text-sm text-slate-200 transition hover:border-sky-300/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-[14px] bg-sky-300 px-3.5 py-2 text-sm font-medium text-[#071018] transition hover:bg-sky-200"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </button>
            </div>
          }
        />

        {authRequired ? (
          <LiveAuthRequired
            title="Operator session required"
            message="Sign in to load fleet inventory, lifecycle actions, and per-agent configuration from the live API."
          />
        ) : agents.length === 0 ? (
          <EmptyState />
        ) : filteredAgents.length === 0 ? (
          <DashboardEmptyState
            title="No matching agents"
            message="No agents match your search query. Try adjusting your filters."
            icon={<Search className="h-8 w-8" />}
          />
        ) : (
          <LivePanel
            title="Fleet registry"
            meta={`${filteredAgents.length} visible`}
            action={
              <span className="hidden rounded-full border border-[#2c3947] bg-[#10161d] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#90a2b6] sm:inline-flex">
                {isMac ? "⌘K search" : "Ctrl+K search"}
              </span>
            }
          >
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onDelete={handleDelete}
                  onStop={handleStop}
                  deletingId={deletingId}
                  stoppingId={stoppingId}
                />
              ))}
            </div>
          </LivePanel>
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
