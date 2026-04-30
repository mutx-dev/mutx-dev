"use client";

import { useEffect, useState } from "react";
import { GitBranchPlus, ShieldCheck, Workflow } from "lucide-react";

import { ApiRequestError, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LiveMiniStat,
  LiveMiniStatGrid,
  LivePanel,
  LiveStatCard,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type OrchestrationPayload = {
  generatedAt: string;
  summary: {
    pendingApprovals: number;
    recoveryWatch: number;
    blueprints: number;
    queuedAutonomy: number | null;
    runningAutonomy: number | null;
  };
  approvals: Array<{
    id: string;
    agentId: string | null;
    actionType: string;
    requester: string;
    status: string;
    createdAt: string | null;
  }>;
  recoveries: Array<{
    id: string;
    kind: "run" | "session";
    title: string;
    detail: string;
    status: string;
    createdAt: string | null;
    href: string;
  }>;
  blueprints: Array<{
    id: string;
    name: string;
    summary: string;
    recommendedAgents: string;
    roles: number;
    tags: string[];
  }>;
  autonomy: {
    queued: number;
    running: number;
    parked: number;
    completed: number;
    activeRunners: number;
  } | null;
  partials: string[];
};

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function statusForRecovery(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error")) return "error" as const;
  if (normalized.includes("running") || normalized.includes("pending")) return "running" as const;
  if (normalized.includes("inactive")) return "warning" as const;
  return "idle" as const;
}

export function OrchestrationPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<OrchestrationPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setError(null);

      try {
        const response = await readJson<OrchestrationPayload>("/api/dashboard/orchestration");
        if (!cancelled) {
          setPayload(response);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (isAuthError(loadError)) {
            setAuthRequired(true);
          } else {
            setError(
              loadError instanceof Error ? loadError.message : "Failed to load orchestration",
            );
          }
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LiveLoading title="Orchestration" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect approvals, recovery watchlists, and blueprint posture."
      />
    );
  }
  if (error) return <LiveErrorState title="Orchestration unavailable" message={error} />;
  if (!payload) {
    return (
      <LiveErrorState
        title="Orchestration unavailable"
        message="No orchestration payload was returned by the dashboard proxy."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Approval queue"
          value={String(payload.summary.pendingApprovals)}
          detail="Pending operator approvals currently visible in the control plane."
          status={payload.summary.pendingApprovals > 0 ? "warning" : "success"}
        />
        <LiveStatCard
          label="Recovery watch"
          value={String(payload.summary.recoveryWatch)}
          detail="Failed runs and inactive sessions sampled into the read-only recovery lane."
          status={payload.summary.recoveryWatch > 0 ? "error" : "success"}
        />
        <LiveStatCard
          label="Blueprints"
          value={String(payload.summary.blueprints)}
          detail="Curated swarm blueprints currently available to operators."
          status={payload.summary.blueprints > 0 ? "success" : "idle"}
        />
        <LiveStatCard
          label="Autonomy backlog"
          value={payload.summary.queuedAutonomy === null ? "partial" : String(payload.summary.queuedAutonomy)}
          detail="Local autonomy queue when the shell is running on the operator host."
          status={
            payload.summary.queuedAutonomy && payload.summary.queuedAutonomy > 0
              ? "warning"
              : payload.summary.queuedAutonomy === null
                ? "idle"
                : "success"
          }
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <LivePanel title="Approval queue" meta={`${payload.approvals.length} pending`}>
          {payload.approvals.length === 0 ? (
            <LiveEmptyState
              title="Approval queue is clear"
              message="No visible pending approval requests are currently blocking operator work."
            />
          ) : (
            <div className="space-y-3">
              {payload.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{approval.actionType}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {approval.requester}
                        {approval.agentId ? ` · ${approval.agentId}` : ""}
                      </p>
                    </div>
                    <StatusBadge status="warning" label={approval.status} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {approval.createdAt
                      ? `Opened ${formatRelativeTime(approval.createdAt)}`
                      : "No approval timestamp"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <div className="space-y-4">
          <LivePanel title="Workflow board" meta="read-only">
            <LiveMiniStatGrid columns={2}>
              <LiveMiniStat
                label="Autonomy queued"
                value={
                  payload.autonomy ? String(payload.autonomy.queued) : "not available"
                }
                detail="Local queue items waiting for pickup"
                icon={Workflow}
              />
              <LiveMiniStat
                label="Autonomy running"
                value={
                  payload.autonomy ? String(payload.autonomy.running) : "not available"
                }
                detail="Local workers currently executing"
                icon={ShieldCheck}
              />
              <LiveMiniStat
                label="Active runners"
                value={
                  payload.autonomy ? String(payload.autonomy.activeRunners) : "not available"
                }
                detail="Current local worker count"
              />
              <LiveMiniStat
                label="Blueprint roles"
                value={String(payload.blueprints.reduce((sum, blueprint) => sum + blueprint.roles, 0))}
                detail="Role count across the visible blueprint catalog"
                icon={GitBranchPlus}
              />
            </LiveMiniStatGrid>
          </LivePanel>

          <LivePanel title="Coverage notes" meta={`${payload.partials.length} notes`}>
            <div className="space-y-3">
              {payload.partials.map((note) => (
                <div
                  key={note}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm leading-6 text-slate-300">{note}</p>
                </div>
              ))}
            </div>
          </LivePanel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LivePanel title="Recovery watchlist" meta={`${payload.recoveries.length} items`}>
          {payload.recoveries.length === 0 ? (
            <LiveEmptyState
              title="Recovery lane is clear"
              message="No failed runs or inactive sessions were sampled into the watchlist."
            />
          ) : (
            <div className="space-y-3">
              {payload.recoveries.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    </div>
                    <StatusBadge
                      status={statusForRecovery(item.status)}
                      label={item.kind}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {item.createdAt
                      ? `Observed ${formatRelativeTime(item.createdAt)}`
                      : "No observation timestamp"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <LivePanel title="Blueprint catalog" meta={`${payload.blueprints.length} blueprints`}>
          {payload.blueprints.length === 0 ? (
            <LiveEmptyState
              title="No blueprints available"
              message="Swarm blueprints will appear here once orchestration presets are published."
            />
          ) : (
            <div className="space-y-3">
              {payload.blueprints.map((blueprint) => (
                <div
                  key={blueprint.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{blueprint.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{blueprint.summary}</p>
                    </div>
                    <StatusBadge status="success" label={`${blueprint.recommendedAgents} agents`} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {blueprint.roles} roles
                    {blueprint.tags.length > 0 ? ` · ${blueprint.tags.join(", ")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </LivePanel>
      </div>
    </div>
  );
}
