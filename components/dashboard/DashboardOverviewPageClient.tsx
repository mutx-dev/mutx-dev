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
  formatDateTime,
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

type OpenClawBinding = {
  assistant_id?: string | null;
  assistant_name?: string | null;
  workspace?: string | null;
  model?: string | null;
};

type OpenClawRuntimeSnapshot = {
  label: string;
  status: string;
  gateway_url?: string | null;
  binary_path?: string | null;
  privacy_summary?: string | null;
  last_seen_at?: string | null;
  last_synced_at?: string | null;
  binding_count: number;
  bindings: OpenClawBinding[];
  current_binding?: OpenClawBinding | null;
  stale: boolean;
  keys_remain_local?: boolean;
};

type OpenClawOnboardingState = {
  status: string;
  current_step: string;
  assistant_id?: string | null;
  assistant_name?: string | null;
  workspace?: string | null;
  gateway_url?: string | null;
  last_error?: string | null;
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

function isAuthError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function isSettledAuthError(result: PromiseSettledResult<unknown>) {
  return result.status === "rejected" && isAuthError(result.reason);
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
  const [openclawRuntime, setOpenclawRuntime] = useState<OpenClawRuntimeSnapshot | null>(null);
  const [openclawOnboarding, setOpenclawOnboarding] = useState<OpenClawOnboardingState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        await readJson<unknown>("/api/auth/me");

        const results = await Promise.allSettled([
          readJson<unknown>("/api/dashboard/agents"),
          readJson<unknown>("/api/dashboard/deployments"),
          readJson<components["schemas"]["RunHistoryResponse"]>("/api/dashboard/runs"),
          readJson<components["schemas"]["AlertListResponse"]>("/api/dashboard/monitoring/alerts"),
          readJson<unknown>("/api/webhooks"),
          readJson<Budget>("/api/dashboard/budgets"),
          readJson<unknown>("/api/dashboard/health"),
          readJson<OpenClawRuntimeSnapshot>("/api/dashboard/runtime/providers/openclaw"),
          readJson<OpenClawOnboardingState>("/api/dashboard/onboarding?provider=openclaw"),
        ]);

        if (cancelled) {
          return;
        }

        const [
          agentsResult,
          deploymentsResult,
          runsResult,
          alertsResult,
          webhooksResult,
          budgetResult,
          healthResult,
          runtimeResult,
          onboardingResult,
        ] = results;

        const coreResults = [
          agentsResult,
          deploymentsResult,
          runsResult,
          alertsResult,
          budgetResult,
        ];
        const coreHasData = coreResults.some((result) => result.status === "fulfilled");
        const coreHardFailure = coreResults.find(
          (result) => result.status === "rejected" && !isSettledAuthError(result),
        );

        if (!coreHasData && coreHardFailure?.status === "rejected") {
          throw coreHardFailure.reason;
        }

        setAgents(
          agentsResult.status === "fulfilled"
            ? normalizeCollection<Agent>(agentsResult.value, ["agents", "items", "data"])
            : [],
        );
        setDeployments(
          deploymentsResult.status === "fulfilled"
            ? normalizeCollection<Deployment>(deploymentsResult.value, ["deployments", "items", "data"])
            : [],
        );
        setRuns(runsResult.status === "fulfilled" ? runsResult.value.items ?? [] : []);
        setAlerts(alertsResult.status === "fulfilled" ? alertsResult.value.items ?? [] : []);
        setWebhooks(
          webhooksResult.status === "fulfilled"
            ? normalizeCollection<WebhookSummary>(webhooksResult.value, ["webhooks", "items", "data"])
            : [],
        );
        setBudget(budgetResult.status === "fulfilled" ? budgetResult.value : null);
        setHealth(
          healthResult.status === "fulfilled"
            ? ((healthResult.value as Record<string, unknown>) ?? null)
            : null,
        );
        setOpenclawRuntime(runtimeResult.status === "fulfilled" ? runtimeResult.value : null);
        setOpenclawOnboarding(
          onboardingResult.status === "fulfilled" ? onboardingResult.value : null,
        );
        setLoading(false);
      } catch (loadError) {
        if (!cancelled) {
          if (isAuthError(loadError)) {
            setAuthRequired(true);
            setLoading(false);
            return;
          }

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
  const openclawBinding =
    openclawRuntime?.current_binding ??
    openclawRuntime?.bindings?.[0] ??
    (openclawOnboarding?.assistant_name ||
    openclawOnboarding?.assistant_id ||
    openclawOnboarding?.workspace
      ? {
          assistant_id: openclawOnboarding?.assistant_id,
          assistant_name: openclawOnboarding?.assistant_name,
          workspace: openclawOnboarding?.workspace,
        }
      : null);
  const hasOpenClawRuntime = Boolean(
    openclawBinding ||
      openclawRuntime?.binary_path ||
      openclawRuntime?.gateway_url ||
      openclawOnboarding?.gateway_url,
  );
  const openclawStatus = openclawRuntime?.status ?? openclawOnboarding?.status ?? "unknown";

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
          <LivePanel title="OpenClaw runtime" meta="tracked provider">
            {hasOpenClawRuntime ? (
              <div className="grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Bot className="h-4 w-4 text-cyan-300" />
                        <span className="text-sm font-medium">OpenClaw instance</span>
                      </div>
                      <p className="mt-3 truncate text-xl font-semibold text-white">
                        {openclawBinding?.assistant_name ?? openclawRuntime?.label ?? "OpenClaw"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {openclawBinding?.workspace
                          ? `Workspace ${openclawBinding.workspace} is bound into the operator surface.`
                          : openclawRuntime?.privacy_summary ??
                            "The dashboard is showing the last synced OpenClaw runtime snapshot from the operator host."}
                      </p>
                    </div>
                    <StatusBadge status={asDashboardStatus(openclawStatus)} label={openclawStatus} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Assistant
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {openclawBinding?.assistant_id ?? openclawBinding?.assistant_name ?? "Not bound"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {openclawRuntime?.binding_count ?? 0} tracked binding{openclawRuntime?.binding_count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Workspace
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {openclawBinding?.workspace ?? openclawOnboarding?.workspace ?? "Not recorded"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {openclawBinding?.model ?? "Model metadata syncs when the binding is available."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Gateway
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {openclawRuntime?.gateway_url ?? openclawOnboarding?.gateway_url ?? "Not recorded"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {openclawRuntime?.keys_remain_local
                        ? "Keys remain local to the operator host."
                        : "Gateway metadata is synced from the last known runtime snapshot."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Sync state
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {formatDateTime(openclawRuntime?.last_synced_at ?? openclawRuntime?.last_seen_at)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {openclawRuntime?.stale
                        ? `Snapshot is stale. Setup is waiting on ${openclawOnboarding?.current_step ?? "resync"}.`
                        : "Snapshot is fresh enough for the current dashboard session."}
                    </p>
                  </div>
                </div>

                {openclawOnboarding?.last_error ? (
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                    {openclawOnboarding.last_error}
                  </div>
                ) : null}
              </div>
            ) : (
              <LiveEmptyState
                title="No OpenClaw runtime synced yet"
                message="Once the operator host imports or resyncs OpenClaw, the bound instance will surface here immediately after sign-in."
              />
            )}
          </LivePanel>

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
