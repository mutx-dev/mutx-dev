"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Server, Clock, RefreshCcw, Trash2, Activity } from "lucide-react";

import {
  ShellAuthRequiredState,
  ShellErrorState,
  ShellLoadingState,
  ShellNotFoundState,
} from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { type components } from "@/app/types/api";

type Deployment = components["schemas"]["DeploymentResponse"];

interface DeploymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DeploymentDetailPage({ params }: DeploymentDetailPageProps) {
  const router = useRouter();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setDeploymentId(p.id));
  }, [params]);

  const fetchDeployment = useCallback(async () => {
    if (!deploymentId) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/deployments/${encodeURIComponent(deploymentId)}`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        setDeployment(null);
        setError("auth_required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch deployment");
      }

      const data = await response.json();
      setDeployment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    if (!deploymentId) return;
    void fetchDeployment();
  }, [deploymentId, fetchDeployment]);

  const handleRestart = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/dashboard/deployments/${encodeURIComponent(deploymentId)}?action=restart`, { method: "POST" });
      if (!response.ok) throw new Error("Restart failed");
      setDeployment(await response.json());
    } catch (err) { alert(err instanceof Error ? err.message : "Restart failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/dashboard/deployments/${encodeURIComponent(deploymentId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.push("/dashboard/deployments");
    } catch (err) { alert(err instanceof Error ? err.message : "Delete failed"); }
    finally { setActionLoading(false); }
  };

  const formatDate = (v?: string|null) => v ? new Date(v).toLocaleString() : "N/A";
  const getStatusColor = (s: string) => {
    switch(s) { case "running": return "bg-emerald-500/20 text-emerald-400"; case "stopped": return "bg-slate-700 text-slate-400"; default: return "bg-slate-700 text-slate-400"; }
  };

  if (loading) {
    return <ShellLoadingState variant="detail" count={2} label="Loading deployment details" />;
  }

  if (error) {
    if (error === "auth_required") {
      return <ShellAuthRequiredState message="Sign in to view this deployment." />;
    }
    return <ShellErrorState message={error} onRetry={() => void fetchDeployment()} />;
  }

  if (!deployment) {
    return (
      <ShellNotFoundState
        title="Deployment not found"
        message="This deployment may have been removed or you no longer have access."
        cta={
          <button
            type="button"
            onClick={() => router.push("/dashboard/deployments")}
            className="inline-flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Back to deployments
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/deployments")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400"><Server className="h-6 w-6" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{deployment.agent_id || "Deployment"}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(deployment.status)}`}>{deployment.status}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {deployment.status === "running" && <button onClick={handleRestart} disabled={actionLoading} className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 disabled:opacity-50"><RefreshCcw className="h-4 w-4" />Restart</button>}
        <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 disabled:opacity-50"><Trash2 className="h-4 w-4" />Delete</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Activity className="h-5 w-5 text-cyan-400" />Deployment Information</h2><dl className="space-y-4"><div className="flex justify-between"><dt className="text-sm text-slate-400">ID</dt><dd className="text-sm text-slate-200">{deployment.id?.slice(0,8)}...</dd></div><div className="flex justify-between"><dt className="text-sm text-slate-400">Status</dt><span className={`px-2 py-1 text-xs ${getStatusColor(deployment.status)}`}>{deployment.status}</span></div><div className="flex justify-between"><dt className="text-sm text-slate-400">Replicas</dt><dd className="text-sm text-slate-200">{deployment.replicas || 1}</dd></div></dl></Card>
        <Card className="p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Clock className="h-5 w-5 text-cyan-400" />Timestamps</h2><dl className="space-y-4"><div className="flex justify-between"><dt className="text-sm text-slate-400">Started</dt><dd className="text-sm text-slate-200">{formatDate(deployment.started_at)}</dd></div><div className="flex justify-between"><dt className="text-sm text-slate-400">Ended</dt><dd className="text-sm text-slate-200">{formatDate(deployment.ended_at)}</dd></div></dl></Card>
      </div>
    </div>
  );
}
