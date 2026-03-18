"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, X, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  created_at: string;
  description?: string;
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

async function createAgent(data: { name: string; description?: string; type?: string }) {
  const response = await fetch("/api/dashboard/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(payload.detail || payload.error || "Request failed");
  }
  
  return response.json();
}

function CreateAgentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
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

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  async function handleCreateSuccess() {
    // Refresh agents list
    try {
      const agentsRes = await fetch("/api/dashboard/agents");
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents || []);
      }
    } catch {
      // Ignore errors on refresh
    }
  }

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-cyan-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
          {health && (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${getHealthColor(health.status)}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              API: {health.status}
            </div>
          )}
        </div>
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
            {agents.filter((a) => a.status === "running").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Total Deployments</p>
          <p className="mt-2 text-3xl font-bold text-white">{deployments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Active Deployments</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {deployments.filter((d) => d.status === "running").length}
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
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30"
              >
                Create your first agent →
              </button>
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

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
