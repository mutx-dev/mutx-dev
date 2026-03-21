"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bot, Layers3, Wallet, Webhook } from "lucide-react";

import { ApiRequestError, normalizeCollection, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatCurrency,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

import type { components } from "@/app/types/api";

type Agent = components["schemas"]["AgentResponse"];
type Deployment = components["schemas"]["DeploymentResponse"];
type Alert = components["schemas"]["AlertResponse"];
type Budget = components["schemas"]["BudgetResponse"];
type Run = components["schemas"]["RunResponse"];

type WebhookSummary = {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
};

function summarizeRunHealth(runs: Run[]) {
  const completed = runs.filter((run) => run.status === "completed").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  return {
    total: runs.length,
    completed,
    failed,
  };
}

export function DashboardOverviewPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const results = await Promise.allSettled([
          readJson<unknown>("/api/dashboard/agents"),
          readJson<unknown>("/api/dashboard/deployments"),
          readJson<components["schemas"]["RunHistoryResponse"]>("/api/dashboard/runs"),
          readJson<components["schemas"]["AlertListResponse"]>("/api/dashboard/monitoring/alerts"),
          readJson<unknown>("/api/webhooks"),
          readJson<Budget>("/api/dashboard/budgets"),
          readJson<unknown>("/api/dashboard/health"),
        ]);

        const authFailure = results.find(
          (result) =>
            result.status === "rejected" &&
            result.reason instanceof ApiRequestError &&
            (result.reason.status === 401 || result.reason.status === 403),
        );
        if (authFailure) {
          if (!cancelled) {
            setAuthRequired(true);
            setLoading(false);
          }
          return;
        }

        const hardFailure = results.find((result) => result.status === "rejected");
        if (hardFailure && hardFailure.status === "rejected") {
          throw hardFailure.reason;
        }

        const [
          agentsResult,
          deploymentsResult,
          runsResult,
          alertsResult,
          webhooksResult,
          budgetResult,
          healthResult,
        ] = results as [
          PromiseFulfilledResult<unknown>,
          PromiseFulfilledResult<unknown>,
          PromiseFulfilledResult<components["schemas"]["RunHistoryResponse"]>,
          PromiseFulfilledResult<components["schemas"]["AlertListResponse"]>,
          PromiseFulfilledResult<unknown>,
          PromiseFulfilledResult<Budget>,
          PromiseFulfilledResult<unknown>,
        ];

        if (!cancelled) {
          setAgents(normalizeCollection<Agent>(agentsResult.value, ["agents", "items", "data"]));
          setDeployments(
            normalizeCollection<Deployment>(deploymentsResult.value, ["deployments", "items", "data"]),
          );
          setRuns(runsResult.value.items ?? []);
          setAlerts(alertsResult.value.items ?? []);
          setWebhooks(normalizeCollection<WebhookSummary>(webhooksResult.value, ["webhooks", "items", "data"]));
          setBudget(budgetResult.value);
          setHealth((healthResult.value as Record<string, unknown>) ?? null);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard overview");
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const runHealth = useMemo(() => summarizeRunHealth(runs), [runs]);
  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);
  const activeDeployments = deployments.filter((deployment) =>
    ["running", "healthy", "ready", "deploying"].includes(deployment.status),
  );
  const liveAgents = agents.filter((agent) => ["running", "healthy"].includes(agent.status));
  const activeWebhooks = webhooks.filter((webhook) => webhook.is_active);
  const healthStatus = typeof health?.status === "string" ? health.status : "unknown";

  if (loading) {
    return <LiveLoading title="Overview" />;
  }

  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to load fleet posture, run activity, alerts, and budget telemetry."
      />
    );
  }

  if (error) {
    return <LiveErrorState title="Overview unavailable" message={error} />;
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Fleet"
          value={String(agents.length)}
          detail={`${liveAgents.length} agents currently reporting healthy or running state.`}
          status={asDashboardStatus(liveAgents.length > 0 ? "running" : "idle")}
        />
        <LiveStatCard
          label="Deployments"
          value={String(activeDeployments.length)}
          detail={`${deployments.length} total deployment records across all owned agents.`}
          status={asDashboardStatus(activeDeployments.length > 0 ? "healthy" : "idle")}
        />
        <LiveStatCard
          label="Runs"
          value={String(runHealth.total)}
          detail={`${runHealth.completed} completed, ${runHealth.failed} failed in the current window.`}
          status={asDashboardStatus(runHealth.failed > 0 ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="Credits"
          value={budget ? formatCurrency(budget.credits_remaining) : "$0"}
          detail={budget ? `${budget.plan} plan, ${budget.usage_percentage}% of the envelope used.` : "Budget API returned no data."}
          status={asDashboardStatus(budget && budget.usage_percentage >= 80 ? "warning" : "healthy")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-4">
          <LivePanel title="Operator posture" meta="first viewport">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Control plane health</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge status={asDashboardStatus(healthStatus)} label={healthStatus} />
                  <span className="text-xs text-slate-500">
                    {(typeof health?.timestamp === "string" && formatRelativeTime(health.timestamp)) || "fresh check"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  One surface for deployments, execution, alerts, keys, and delivery posture. No route shells pretending to be live data.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-medium">Alert pressure</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  {unresolvedAlerts.length}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  unresolved alerts across the current operator scope
                </p>
              </div>
            </div>
          </LivePanel>

          <LivePanel title="Recent execution" meta={`${runs.length} runs`}>
            {runs.length === 0 ? (
              <LiveEmptyState
                title="No runs yet"
                message="Runs will appear here once an owned agent has executed inside the current session boundary."
              />
            ) : (
              <div className="grid gap-3">
                {runs.slice(0, 5).map((run) => (
                  <div
                    key={run.id}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-white">{run.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Agent {run.agent_id.slice(0, 8)} · {run.trace_count} traces · {formatRelativeTime(run.started_at)}
                      </p>
                    </div>
                    <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
                      <StatusBadge status={asDashboardStatus(run.status)} label={run.status} />
                      <span className="text-xs text-slate-500">
                        {run.completed_at ? formatRelativeTime(run.completed_at) : "in flight"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>
        </div>

        <div className="grid gap-4">
          <LivePanel title="Live alerts" meta={`${alerts.length} items`}>
            {alerts.length === 0 ? (
              <LiveEmptyState
                title="No alert stream yet"
                message="Alerts will surface here when monitoring starts capturing agent and deployment failures."
              />
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{alert.type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                      </div>
                      <StatusBadge
                        status={alert.resolved ? "success" : "warning"}
                        label={alert.resolved ? "resolved" : "open"}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(alert.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Delivery surface" meta={`${activeWebhooks.length} active`}>
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Webhook className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Active endpoints</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  {activeWebhooks.length}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {webhooks.length} configured webhook routes across the operator scope.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Bot className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Live agents</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-white">{liveAgents.length}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Layers3 className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Hot deployments</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-white">{activeDeployments.length}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Wallet className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Spend posture</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Infra and model spend stay in separate surfaces so operators can tell whether the cost problem is deployment shape or token burn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </LivePanel>
        </div>
      </div>
    </div>
  );
}
