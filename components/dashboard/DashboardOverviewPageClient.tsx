"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  KeyRound,
  Layers3,
  ShieldCheck,
  Wallet,
  Webhook,
} from "lucide-react";

import { ApiRequestError, normalizeCollection, readJson } from "@/components/app/http";
import {
  BriefingBar,
  FlowStatusBar,
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

type OverviewResource<T = unknown> = {
  status: "ok" | "auth_error" | "error";
  statusCode: number;
  data: T | null;
  error: string | null;
};

type GovernanceIdentity = {
  agent_id: string;
  trust_tier?: string;
  lifecycle_status?: string;
  credential_status?: string;
};

type GovernanceAttestation = {
  summary?: {
    identities?: number;
    pending_approvals?: number;
    credential_backends?: number;
    supervised_agents?: number;
    discovery_items?: number;
  };
  coverage?: Record<string, boolean>;
  compliance?: {
    overall_satisfied?: boolean;
  };
};

type GovernanceRuntimeStatus = {
  status?: string;
  policy_name?: string | null;
  pending_approvals?: number;
};

type DashboardOverviewPayload = {
  generatedAt: string;
  session: {
    email: string;
    name: string;
    plan: string;
  };
  resources: {
    agents: OverviewResource<unknown>;
    deployments: OverviewResource<unknown>;
    runs: OverviewResource<components["schemas"]["RunHistoryResponse"]>;
    alerts: OverviewResource<components["schemas"]["AlertListResponse"]>;
    webhooks: OverviewResource<unknown>;
    budget: OverviewResource<unknown>;
    health: OverviewResource<Record<string, unknown>>;
    securityMetrics: OverviewResource<Record<string, unknown>>;
    securityCompliance: OverviewResource<Record<string, unknown>>;
    securityApprovals: OverviewResource<unknown>;
    governanceCredentialBackends: OverviewResource<unknown>;
    governanceTrust: OverviewResource<{ items?: GovernanceIdentity[] } | unknown>;
    governanceLifecycle: OverviewResource<{ items?: GovernanceIdentity[] } | unknown>;
    governanceDiscovery: OverviewResource<{ items?: unknown[] } | unknown>;
    governanceAttestation: OverviewResource<GovernanceAttestation>;
    governanceRuntimeStatus: OverviewResource<GovernanceRuntimeStatus>;
    governedSupervision: OverviewResource<unknown>;
    governedProfiles: OverviewResource<unknown>;
    runtime: OverviewResource<OpenClawRuntimeSnapshot>;
    onboarding: OverviewResource<OpenClawOnboardingState>;
  };
};

type GovernanceOverviewState = {
  approvals: number;
  backendCount: number;
  healthyBackendCount: number;
  trustItems: GovernanceIdentity[];
  lifecycleItems: GovernanceIdentity[];
  discoveryCount: number;
  attestation: GovernanceAttestation | null;
  runtimeStatus: GovernanceRuntimeStatus | null;
  supervisedAgents: number;
  profileCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickBudget(payload: unknown): Budget | null {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return (payload[0] as Budget | undefined) ?? null;
  }

  if (isRecord(payload)) {
    const budgetItems = normalizeCollection<Budget>(payload, ["items", "budgets", "data"]);
    if (budgetItems.length > 0) {
      return budgetItems[0] ?? null;
    }

    if (
      typeof payload.plan === "string" &&
      typeof payload.credits_remaining === "number" &&
      typeof payload.usage_percentage === "number"
    ) {
      return payload as Budget;
    }
  }

  return null;
}

function summarizeRunHealth(runs: Run[]) {
  const completed = runs.filter((run) => run.status === "completed").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  const inFlight = runs.filter((run) => run.status === "running" && !run.completed_at).length;
  return {
    total: runs.length,
    completed,
    failed,
    inFlight,
  };
}

function isAuthError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function pickGovernanceCollection<T>(payload: unknown): T[] {
  if (isRecord(payload) && Array.isArray(payload.items)) {
    return payload.items as T[];
  }
  return normalizeCollection<T>(payload, ["items", "data"]);
}

export function DashboardOverviewPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialFailures, setPartialFailures] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [openclawRuntime, setOpenclawRuntime] = useState<OpenClawRuntimeSnapshot | null>(null);
  const [openclawOnboarding, setOpenclawOnboarding] = useState<OpenClawOnboardingState | null>(
    null,
  );
  const [governance, setGovernance] = useState<GovernanceOverviewState>({
    approvals: 0,
    backendCount: 0,
    healthyBackendCount: 0,
    trustItems: [],
    lifecycleItems: [],
    discoveryCount: 0,
    attestation: null,
    runtimeStatus: null,
    supervisedAgents: 0,
    profileCount: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);
      setPartialFailures([]);

      try {
        const payload = await readJson<DashboardOverviewPayload>("/api/dashboard/overview", {
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        const {
          agents: agentsResult,
          deployments: deploymentsResult,
          runs: runsResult,
          alerts: alertsResult,
          webhooks: webhooksResult,
          budget: budgetResult,
          health: healthResult,
          governanceTrust: governanceTrustResult,
          governanceLifecycle: governanceLifecycleResult,
          governanceDiscovery: governanceDiscoveryResult,
          governanceAttestation: governanceAttestationResult,
          governanceCredentialBackends: governanceCredentialBackendsResult,
          governanceRuntimeStatus: governanceRuntimeStatusResult,
          securityApprovals: securityApprovalsResult,
          governedSupervision: governedSupervisionResult,
          governedProfiles: governedProfilesResult,
          runtime: runtimeResult,
          onboarding: onboardingResult,
        } = payload.resources;

        const coreResults = [agentsResult, deploymentsResult, runsResult, alertsResult, budgetResult];
        const coreHasData = coreResults.some((result) => result.status === "ok");
        const coreHardFailure = coreResults.find((result) => result.status === "error");

        if (!coreHasData && coreHardFailure) {
          throw new Error(coreHardFailure.error || "Failed to load dashboard overview");
        }

        setPartialFailures(
          Object.entries(payload.resources).flatMap(([key, result]) =>
            result.status === "ok" || !result.error ? [] : [`${key}: ${result.error}`],
          ),
        );
        setAgents(
          agentsResult.status === "ok"
            ? normalizeCollection<Agent>(agentsResult.data, ["agents", "items", "data"])
            : [],
        );
        setDeployments(
          deploymentsResult.status === "ok"
            ? normalizeCollection<Deployment>(deploymentsResult.data, ["deployments", "items", "data"])
            : [],
        );
        setRuns(runsResult.status === "ok" ? runsResult.data?.items ?? [] : []);
        setAlerts(alertsResult.status === "ok" ? alertsResult.data?.items ?? [] : []);
        setWebhooks(
          webhooksResult.status === "ok"
            ? normalizeCollection<WebhookSummary>(webhooksResult.data, ["webhooks", "items", "data"])
            : [],
        );
        setBudget(budgetResult.status === "ok" ? pickBudget(budgetResult.data) : null);
        setHealth(healthResult.status === "ok" ? (healthResult.data ?? null) : null);
        setOpenclawRuntime(runtimeResult.status === "ok" ? runtimeResult.data : null);
        setOpenclawOnboarding(onboardingResult.status === "ok" ? onboardingResult.data : null);

        const backends = pickGovernanceCollection<Record<string, unknown>>(
          governanceCredentialBackendsResult.status === "ok"
            ? governanceCredentialBackendsResult.data
            : null,
        );
        const trustItems = pickGovernanceCollection<GovernanceIdentity>(
          governanceTrustResult.status === "ok" ? governanceTrustResult.data : null,
        );
        const lifecycleItems = pickGovernanceCollection<GovernanceIdentity>(
          governanceLifecycleResult.status === "ok" ? governanceLifecycleResult.data : null,
        );
        const discoveryItems = pickGovernanceCollection<Record<string, unknown>>(
          governanceDiscoveryResult.status === "ok" ? governanceDiscoveryResult.data : null,
        );
        const approvals = normalizeCollection<Record<string, unknown>>(
          securityApprovalsResult.status === "ok" ? securityApprovalsResult.data : null,
          ["items", "data"],
        );
        const supervisedAgents = normalizeCollection<Record<string, unknown>>(
          governedSupervisionResult.status === "ok" ? governedSupervisionResult.data : null,
          ["items", "data"],
        );
        const profiles = normalizeCollection<Record<string, unknown>>(
          governedProfilesResult.status === "ok" ? governedProfilesResult.data : null,
          ["items", "data"],
        );

        setGovernance({
          approvals:
            approvals.length ||
            Number(governanceAttestationResult.data?.summary?.pending_approvals ?? 0),
          backendCount: backends.length,
          healthyBackendCount: backends.filter((backend) => backend.is_healthy).length,
          trustItems,
          lifecycleItems,
          discoveryCount:
            discoveryItems.length ||
            Number(governanceAttestationResult.data?.summary?.discovery_items ?? 0),
          attestation: governanceAttestationResult.status === "ok" ? governanceAttestationResult.data : null,
          runtimeStatus:
            governanceRuntimeStatusResult.status === "ok" ? governanceRuntimeStatusResult.data : null,
          supervisedAgents:
            supervisedAgents.length ||
            Number(governanceAttestationResult.data?.summary?.supervised_agents ?? 0),
          profileCount: profiles.length,
        });
        setLoading(false);
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof DOMException && loadError.name === "AbortError") {
            return;
          }

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
      controller.abort();
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
  const governanceCoverage = governance.attestation?.coverage ?? {};
  const governedIdentityCount =
    governance.attestation?.summary?.identities ?? governance.trustItems.length;
  const complianceSatisfied = governance.attestation?.compliance?.overall_satisfied;

  const briefingBarEntries = [
    {
      label: "Control plane",
      value: healthStatus === "ok" || healthStatus === "healthy" ? "Healthy" : healthStatus,
      status: (healthStatus === "ok" || healthStatus === "healthy"
        ? "healthy"
        : healthStatus === "degraded"
          ? "degraded"
          : "critical") as "healthy" | "degraded" | "critical" | "unknown",
    },
    {
      label: "Fleet",
      value: `${liveAgents.length}/${agents.length}`,
      status: (liveAgents.length > 0 ? "healthy" : "unknown") as "healthy" | "degraded" | "critical" | "unknown",
    },
    {
      label: "Queue",
      value: runHealth.total > 0 ? `${runHealth.inFlight} in flight` : "empty",
      status: (runHealth.failed > 0
        ? "degraded"
        : runHealth.inFlight > 0
          ? "healthy"
          : "unknown") as "healthy" | "degraded" | "critical" | "unknown",
    },
    {
      label: "Governance",
      value: `${governedIdentityCount} tracked`,
      status: (complianceSatisfied === false
        ? "degraded"
        : governedIdentityCount > 0
          ? "healthy"
          : "unknown") as "healthy" | "degraded" | "critical" | "unknown",
    },
    {
      label: "Alerts",
      value: String(unresolvedAlerts.length),
      status: (unresolvedAlerts.length > 0 ? "degraded" : "healthy") as "healthy" | "degraded" | "critical" | "unknown",
    },
    {
      label: "Credits",
      value: budget ? `${budget.usage_percentage}%` : "N/A",
      status: (budget && budget.usage_percentage >= 80
        ? "degraded"
        : budget
          ? "healthy"
          : "unknown") as "healthy" | "degraded" | "critical" | "unknown",
    },
  ];

  if (loading) {
    return <LiveLoading title="Overview" />;
  }

  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to load fleet posture, governance state, and runtime telemetry."
      />
    );
  }

  if (error) {
    return <LiveErrorState title="Overview unavailable" message={error} />;
  }

  return (
    <div className="space-y-4">
      {partialFailures.length > 0 ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Overview is running with partial data.</p>
          <p className="mt-1 text-xs text-amber-100/80">{partialFailures.slice(0, 4).join(" · ")}</p>
        </div>
      ) : null}

      <BriefingBar entries={briefingBarEntries} />

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
          label="Governance"
          value={String(governedIdentityCount)}
          detail={`${governance.approvals} approvals pending · ${governance.discoveryCount} discovery items tracked.`}
          status={asDashboardStatus(complianceSatisfied === false ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="Credits"
          value={budget ? formatCurrency(budget.credits_remaining) : "$0"}
          detail={
            budget
              ? `${budget.plan} plan, ${budget.usage_percentage}% of the envelope used.`
              : "Budget API returned no data."
          }
          status={asDashboardStatus(budget && budget.usage_percentage >= 80 ? "warning" : "healthy")}
        />
      </LiveKpiGrid>

      {runs.length > 0 ? (
        <LivePanel title="Run flow" meta="queue orchestration">
          <FlowStatusBar
            stages={[
              {
                status: "pending",
                count: runs.filter((run) => run.status === "created" || run.status === "queued").length,
                maxCount: runs.length,
              },
              {
                status: "running",
                count: runHealth.inFlight,
                maxCount: runs.length,
              },
              {
                status: "completed",
                count: runHealth.completed,
                maxCount: runs.length,
              },
              {
                status: "failed",
                count: runHealth.failed,
                maxCount: runs.length,
              },
            ]}
          />
        </LivePanel>
      ) : null}

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
                    {(typeof health?.timestamp === "string" && formatRelativeTime(health.timestamp)) ||
                      "fresh check"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  One surface for deployments, execution, governance, credentials, and recovery.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Governance boundary</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  {governedIdentityCount}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  governed identities with live trust, lifecycle, discovery, and attestation signals
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
              <div className="grid gap-4">
                <FlowStatusBar
                  stages={[
                    {
                      status: "pending",
                      count: runs.filter((run) => run.status === "created" || run.status === "queued").length,
                      maxCount: runs.length,
                    },
                    { status: "running", count: runHealth.inFlight, maxCount: runs.length },
                    { status: "completed", count: runHealth.completed, maxCount: runs.length },
                    { status: "failed", count: runHealth.failed, maxCount: runs.length },
                  ]}
                />
                <div className="grid gap-3">
                  {runs.slice(0, 5).map((run) => (
                    <Link
                      key={run.id}
                      href="/dashboard/runs"
                      className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-white">{run.id}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Agent {typeof run.agent_id === "string" ? run.agent_id.slice(0, 8) : "unknown"} ·{" "}
                          {run.trace_count} traces · {formatRelativeTime(run.started_at)}
                        </p>
                      </div>
                      <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
                        <StatusBadge status={asDashboardStatus(run.status)} label={run.status} />
                        <span className="text-xs text-slate-500">
                          {run.completed_at ? formatRelativeTime(run.completed_at) : "in flight"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </LivePanel>

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
                      {openclawRuntime?.binding_count ?? 0} tracked binding
                      {openclawRuntime?.binding_count === 1 ? "" : "s"}
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
                </div>
              </div>
            ) : (
              <LiveEmptyState
                title="No OpenClaw runtime synced yet"
                message="Once the operator host imports or resyncs OpenClaw, the bound instance will surface here immediately after sign-in."
              />
            )}
          </LivePanel>
        </div>

        <div className="grid gap-4">
          <LivePanel title="Governance boundary" meta="mission control">
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Attestation posture</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge
                    status={asDashboardStatus(complianceSatisfied === false ? "warning" : "healthy")}
                    label={complianceSatisfied === false ? "attention" : "covered"}
                  />
                  <span className="text-xs text-slate-500">
                    policy {governance.runtimeStatus?.policy_name ?? "not loaded"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Trust, lifecycle, discovery, receipts, and runtime guardrails are exposed in the same shell instead of a disconnected security console.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <KeyRound className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm font-medium">Credential backends</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{governance.backendCount}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {governance.healthyBackendCount} healthy · approvals {governance.approvals}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Layers3 className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm font-medium">Governed runtime</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{governance.supervisedAgents}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {governance.profileCount} launch profiles · {governance.runtimeStatus?.status ?? "unknown"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-medium">Coverage summary</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <div>
                    policy coverage: {governanceCoverage.policy_coverage ? "present" : "missing"}
                  </div>
                  <div>
                    receipt integrity: {governanceCoverage.receipt_integrity ? "passing" : "attention"}
                  </div>
                  <div>
                    discovery: {governanceCoverage.discovery_coverage ? "tracked" : "missing"}
                  </div>
                  <div>
                    runtime guardrails:{" "}
                    {governanceCoverage.runtime_guardrail_presence ? "present" : "missing"}
                  </div>
                </div>
              </div>
            </div>
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
                      <Wallet className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Spend posture</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {budget ? `${budget.usage_percentage}%` : "N/A"}
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
