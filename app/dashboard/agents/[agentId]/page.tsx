"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, Calendar, Clock, Copy, Power, RefreshCcw, Trash2, Loader2, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type Agent = components["schemas"]["AgentResponse"];

interface AgentDetailPageProps {
  params: Promise<{ agentId: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => { params.then((p) => setAgentId(p.agentId)); }, [params]);

  useEffect(() => {
    if (!agentId) return;
    async function fetchAgent() {
      try {
        const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(agentId)}`);
        if (response.status === 401) { setError("auth_required"); setLoading(false); return; }
        if (!response.ok) throw new Error("Failed to fetch agent");
        const data = await response.json();
        setAgent(data);
      } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
      finally { setLoading(false); }
    }
    fetchAgent();
  }, [agentId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.push("/dashboard/agents");
    } catch (err) { alert(err instanceof Error ? err.message : "Delete failed"); }
    finally { setActionLoading(false); }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(agentId)}?action=stop`, { method: "POST" });
      if (!response.ok) throw new Error("Stop failed");
      setAgent(await response.json());
    } catch (err) { alert(err instanceof Error ? err.message : "Stop failed"); }
    finally { setActionLoading(false); }
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      // For now, restart is not implemented on backend, so just refresh the agent
      const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(agentId)}`);
      if (!response.ok) throw new Error("Refresh failed");
      setAgent(await response.json());
    } catch (err) { alert(err instanceof Error ? err.message : "Refresh failed"); }
    finally { setActionLoading(false); }
  };

  const formatDate = (v?: string|null) => v ? new Date(v).toLocaleString() : "N/A";
  const getStatusColor = (s: string) => {
    switch(s) { case "running": return "bg-emerald-500/20 text-emerald-400"; case "stopped": return "bg-slate-700 text-slate-400"; default: return "bg-slate-700 text-slate-400"; }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (error) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">{error}</div>;
  if (!agent) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">Agent not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/agents")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400"><Bot className="h-6 w-6" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{agent.name}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(agent.status)}`}>{agent.status}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {agent.status === "running" && <button onClick={handleStop} disabled={actionLoading} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"><Power className="h-4 w-4" />Stop</button>}
        {(agent.status === "stopped" || agent.status === "error") && <button onClick={handleRefresh} disabled={actionLoading} className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 disabled:opacity-50"><RefreshCcw className="h-4 w-4" />Refresh</button>}
        <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 disabled:opacity-50"><Trash2 className="h-4 w-4" />Delete</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Activity className="h-5 w-5 text-cyan-400" />Agent Information</h2><dl className="space-y-4"><div className="flex justify-between"><dt className="text-sm text-slate-400">ID</dt><dd className="text-sm text-slate-200">{agent.id.slice(0,8)}...</dd></div><div className="flex justify-between"><dt className="text-sm text-slate-400">Status</dt><span className={`px-2 py-1 text-xs ${getStatusColor(agent.status)}`}>{agent.status}</span></div></dl></Card>
        <Card className="p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Clock className="h-5 w-5 text-cyan-400" />Timestamps</h2><dl className="space-y-4"><div className="flex justify-between"><dt className="text-sm text-slate-400">Created</dt><dd className="text-sm text-slate-200">{formatDate(agent.created_at)}</dd></div><div className="flex justify-between"><dt className="text-sm text-slate-400">Updated</dt><dd className="text-sm text-slate-200">{formatDate(agent.updated_at)}</dd></div></dl></Card>
      </div>
    </div>
  );
}
