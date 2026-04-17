"use client";

import { startTransition, useEffect, useState } from "react";
import {
  Lock,
  Radar,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import {
  ApiRequestError,
  normalizeCollection,
  readJson,
  writeJson,
} from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type ApiKeyRecord = {
  id: string;
  name?: string;
  description?: string | null;
  key_prefix?: string | null;
  status?: string | null;
  scopes?: string[];
  created_at?: string | null;
  expires_at?: string | null;
  last_used_at?: string | null;
};

type ApprovalRecord = {
  request_id: string;
  token: string;
  tool_name: string;
  reason?: string;
  expires_at?: string;
  remaining_seconds?: number;
  status?: string;
};

type BackendHealthRecord = {
  name: string;
  backend: string;
  path: string;
  ttl: number;
  is_active: boolean;
  is_healthy: boolean;
};

type GovernedIdentity = {
  agent_id: string;
  display_name?: string | null;
  trust_score?: number;
  trust_tier?: string;
  credential_status?: string;
  lifecycle_status?: string;
  launch_profile?: string | null;
  faramesh_policy?: string | null;
  capability_scope?: string[];
  resource_scope?: string[];
};

type DiscoveryRecord = {
  finding_id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  source: string;
  risk_level: string;
  registration_status: string;
  confidence: number;
};

type GovernanceAttestation = {
  summary?: {
    identities?: number;
    pending_approvals?: number;
    discovery_items?: number;
    credential_backends?: number;
    supervised_agents?: number;
  };
  coverage?: Record<string, boolean>;
  compliance?: {
    overall_satisfied?: boolean;
    checked_at?: string;
  };
};

type GovernanceRuntimeStatus = {
  status?: string;
  policy_name?: string | null;
  pending_approvals?: number;
};

type SupervisedAgentRecord = {
  agent_id: string;
  state?: string;
  pid?: number | null;
  restart_count?: number;
  started_at?: string | null;
  launch_profile?: string | null;
  faramesh_policy?: string | null;
};

type LaunchProfileRecord = {
  name: string;
  command: string[];
  env_keys: string[];
  faramesh_policy?: string | null;
};

function isAuthError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function collectFailures(results: Array<[string, PromiseSettledResult<unknown>]>) {
  return results.flatMap(([label, result]) => {
    if (result.status === "fulfilled") {
      return [];
    }

    const reason = result.reason instanceof Error ? result.reason.message : "Request failed";
    return [`${label}: ${reason}`];
  });
}

function pickItems<T>(payload: unknown): T[] {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && Array.isArray((payload as { items?: unknown[] }).items)) {
    return (payload as { items: T[] }).items;
  }
  return normalizeCollection<T>(payload, ["items", "data", "keys", "api_keys"]);
}

function SectionButton({
  label,
  onClick,
  busy = false,
  disabled = false,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: "default" | "danger" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className={[
        "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15"
          : tone === "danger"
            ? "border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
            : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      {busy ? "Working..." : label}
    </button>
  );
}

export function SecurityPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialFailures, setPartialFailures] = useState<string[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [backends, setBackends] = useState<BackendHealthRecord[]>([]);
  const [trustItems, setTrustItems] = useState<GovernedIdentity[]>([]);
  const [lifecycleItems, setLifecycleItems] = useState<GovernedIdentity[]>([]);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryRecord[]>([]);
  const [attestation, setAttestation] = useState<GovernanceAttestation | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<GovernanceRuntimeStatus | null>(null);
  const [supervisedAgents, setSupervisedAgents] = useState<SupervisedAgentRecord[]>([]);
  const [profiles, setProfiles] = useState<LaunchProfileRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);
      setPartialFailures([]);

      const requests = [
        ["keys", readJson<unknown>("/api/api-keys", { signal: controller.signal })],
        [
          "approvals",
          readJson<unknown>("/api/dashboard/governance/security/approvals", { signal: controller.signal }),
        ],
        [
          "credentialBackends",
          readJson<unknown>("/api/dashboard/governance/credentials/backends", { signal: controller.signal }),
        ],
        ["trust", readJson<unknown>("/api/dashboard/governance/trust", { signal: controller.signal })],
        [
          "lifecycle",
          readJson<unknown>("/api/dashboard/governance/lifecycle", { signal: controller.signal }),
        ],
        [
          "discovery",
          readJson<unknown>("/api/dashboard/governance/discovery", { signal: controller.signal }),
        ],
        [
          "attestations",
          readJson<unknown>("/api/dashboard/governance/attestations", { signal: controller.signal }),
        ],
        [
          "runtimeStatus",
          readJson<unknown>("/api/dashboard/runtime/governance/status", { signal: controller.signal }),
        ],
        [
          "supervised",
          readJson<unknown>("/api/dashboard/runtime/governance/supervised", { signal: controller.signal }),
        ],
        [
          "profiles",
          readJson<unknown>("/api/dashboard/runtime/governance/supervised/profiles", {
            signal: controller.signal,
          }),
        ],
      ] as const;

      const settled = await Promise.allSettled(requests.map(([, promise]) => promise));

      if (cancelled) {
        return;
      }

      const keyResult = settled[0];
      if (keyResult.status === "rejected" && isAuthError(keyResult.reason)) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (keyResult.status === "rejected") {
        setError(keyResult.reason instanceof Error ? keyResult.reason.message : "Failed to load security state");
        setLoading(false);
        return;
      }

      const labelledResults = requests.map(([label], index) => [label, settled[index]] as [string, PromiseSettledResult<unknown>]);
      startTransition(() => {
        setPartialFailures(collectFailures(labelledResults.slice(1)));
      });

      setKeys(pickItems<ApiKeyRecord>(keyResult.value));
      setApprovals(
        settled[1].status === "fulfilled" ? pickItems<ApprovalRecord>(settled[1].value) : [],
      );
      setBackends(
        settled[2].status === "fulfilled" ? pickItems<BackendHealthRecord>(settled[2].value) : [],
      );
      setTrustItems(
        settled[3].status === "fulfilled" ? pickItems<GovernedIdentity>(settled[3].value) : [],
      );
      setLifecycleItems(
        settled[4].status === "fulfilled" ? pickItems<GovernedIdentity>(settled[4].value) : [],
      );
      setDiscoveryItems(
        settled[5].status === "fulfilled" ? pickItems<DiscoveryRecord>(settled[5].value) : [],
      );
      setAttestation(settled[6].status === "fulfilled" ? (settled[6].value as GovernanceAttestation) : null);
      setRuntimeStatus(
        settled[7].status === "fulfilled" ? (settled[7].value as GovernanceRuntimeStatus) : null,
      );
      setSupervisedAgents(
        settled[8].status === "fulfilled" ? pickItems<SupervisedAgentRecord>(settled[8].value) : [],
      );
      setProfiles(
        settled[9].status === "fulfilled" ? pickItems<LaunchProfileRecord>(settled[9].value) : [],
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshToken]);

  async function runAction(actionKey: string, action: () => Promise<unknown>) {
    setBusyAction(actionKey);
    setError(null);
    try {
      await action();
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setBusyAction(null);
    }
  }

  const liveKeys = keys.filter((key) => !key.expires_at || new Date(key.expires_at).getTime() > Date.now());
  const governedIdentityCount = attestation?.summary?.identities ?? trustItems.length;
  const backendHealthyCount = backends.filter((backend) => backend.is_healthy).length;
  const coverage = attestation?.coverage ?? {};

  if (loading) {
    return <LiveLoading title="Security" />;
  }

  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect credential inventory, governance posture, and supervised runtime controls."
      />
    );
  }

  if (error && keys.length === 0) {
    return <LiveErrorState title="Security surface unavailable" message={error} />;
  }

  return (
    <div className="space-y-4">
      {partialFailures.length > 0 ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Mission Control security is running with partial data.</p>
          <p className="mt-1 text-xs text-amber-100/80">{partialFailures.slice(0, 4).join(" · ")}</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <LiveKpiGrid>
        <LiveStatCard
          label="Credentials"
          value={String(keys.length)}
          detail={`${liveKeys.length} appear active or unexpired.`}
          status={asDashboardStatus(liveKeys.length > 0 ? "healthy" : "idle")}
        />
        <LiveStatCard
          label="Approvals"
          value={String(approvals.length)}
          detail={`${attestation?.summary?.pending_approvals ?? approvals.length} actions awaiting operator review.`}
          status={asDashboardStatus(approvals.length > 0 ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="Discovery"
          value={String(discoveryItems.length || attestation?.summary?.discovery_items || 0)}
          detail="Local sessions, supervised agents, backends, and policies are tracked in one inventory."
          status={asDashboardStatus(discoveryItems.length > 0 ? "running" : "idle")}
        />
        <LiveStatCard
          label="Governed runtime"
          value={String(attestation?.summary?.supervised_agents ?? supervisedAgents.length)}
          detail={`${profiles.length} launch profiles · ${runtimeStatus?.policy_name ?? "no policy loaded"}.`}
          status={asDashboardStatus(runtimeStatus?.status ?? "unknown")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid gap-4">
          <LivePanel title="Credential inventory" meta={`${keys.length} keys`}>
            {keys.length === 0 ? (
              <LiveEmptyState
                title="No API keys returned yet"
                message="Once operator credentials exist, rotation posture will show up here."
              />
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div key={key.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{key.name || key.key_prefix || key.id}</p>
                        <p className="mt-1 text-xs text-slate-500">{key.description || key.id}</p>
                      </div>
                      <StatusBadge status={asDashboardStatus(key.status || "idle")} label={key.status || "unknown"} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>created {formatDateTime(key.created_at)}</div>
                      <div>last used {key.last_used_at ? formatRelativeTime(key.last_used_at) : "never"}</div>
                      <div>expires {key.expires_at ? formatDateTime(key.expires_at) : "no expiry"}</div>
                      <div>scopes {(key.scopes ?? []).join(", ") || "default"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Approval queue" meta={`${approvals.length} pending`}>
            {approvals.length === 0 ? (
              <LiveEmptyState
                title="No approvals waiting"
                message="Deferred actions will surface here with real approve and deny controls."
              />
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.request_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{approval.tool_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{approval.reason || "Requires operator approval"}</p>
                      </div>
                      <StatusBadge status={asDashboardStatus(approval.status || "pending")} label={approval.status || "pending"} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>expires {approval.expires_at ? formatDateTime(approval.expires_at) : "n/a"}</div>
                      <div>
                        remaining{" "}
                        {typeof approval.remaining_seconds === "number"
                          ? `${Math.floor(approval.remaining_seconds / 60)}m ${approval.remaining_seconds % 60}s`
                          : "n/a"}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SectionButton
                        label="Approve"
                        tone="primary"
                        busy={busyAction === `approve:${approval.token}`}
                        onClick={() =>
                          runAction(`approve:${approval.token}`, () =>
                            writeJson(`/api/dashboard/governance/security/approvals/${approval.token}/approve`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reviewer: "dashboard-operator",
                                comment: "Approved from Mission Control",
                              }),
                            }),
                          )
                        }
                      />
                      <SectionButton
                        label="Deny"
                        tone="danger"
                        busy={busyAction === `deny:${approval.token}`}
                        onClick={() =>
                          runAction(`deny:${approval.token}`, () =>
                            writeJson(`/api/dashboard/governance/security/approvals/${approval.token}/deny`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reviewer: "dashboard-operator",
                                comment: "Denied from Mission Control",
                              }),
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel
            title="Identity trust and lifecycle"
            meta={`${governedIdentityCount} governed`}
            action={
              <div className="flex items-center gap-2">
                <SectionButton
                  label="Scan discovery"
                  busy={busyAction === "scan-discovery"}
                  onClick={() =>
                    runAction("scan-discovery", () =>
                      writeJson("/api/dashboard/governance/discovery/scan", { method: "POST" }),
                    )
                  }
                />
                <SectionButton
                  label="Verify"
                  tone="primary"
                  busy={busyAction === "verify-attestation"}
                  onClick={() =>
                    runAction("verify-attestation", () =>
                      writeJson("/api/dashboard/governance/attestations/verify", { method: "POST" }),
                    )
                  }
                />
              </div>
            }
          >
            {trustItems.length === 0 && lifecycleItems.length === 0 ? (
              <LiveEmptyState
                title="No governed identities yet"
                message="Supervised agents and governed identities will appear here once the runtime boundary is active."
              />
            ) : (
              <div className="space-y-3">
                {lifecycleItems.slice(0, 6).map((identity) => (
                  <div key={identity.agent_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          {identity.display_name || identity.agent_id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          trust {identity.trust_score ?? "n/a"} · {identity.trust_tier ?? "unknown"} · credentials{" "}
                          {identity.credential_status ?? "unknown"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          status={asDashboardStatus(identity.lifecycle_status || "idle")}
                          label={identity.lifecycle_status || "unknown"}
                        />
                        <StatusBadge
                          status={asDashboardStatus(identity.trust_tier || "idle")}
                          label={identity.trust_tier || "unknown"}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>launch profile {identity.launch_profile || "none"}</div>
                      <div>policy {identity.faramesh_policy || "none"}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {identity.lifecycle_status !== "active" ? (
                        <SectionButton
                          label="Activate"
                          tone="primary"
                          busy={busyAction === `lifecycle:activate:${identity.agent_id}`}
                          onClick={() =>
                            runAction(`lifecycle:activate:${identity.agent_id}`, () =>
                              writeJson(`/api/dashboard/governance/lifecycle/${identity.agent_id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  state: "active",
                                  reason: "Activated from Mission Control",
                                }),
                              }),
                            )
                          }
                        />
                      ) : null}
                      {identity.lifecycle_status !== "suspended" ? (
                        <SectionButton
                          label="Suspend"
                          busy={busyAction === `lifecycle:suspend:${identity.agent_id}`}
                          onClick={() =>
                            runAction(`lifecycle:suspend:${identity.agent_id}`, () =>
                              writeJson(`/api/dashboard/governance/lifecycle/${identity.agent_id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  state: "suspended",
                                  reason: "Suspended from Mission Control",
                                }),
                              }),
                            )
                          }
                        />
                      ) : null}
                      {identity.lifecycle_status !== "decommissioned" ? (
                        <SectionButton
                          label="Decommission"
                          tone="danger"
                          busy={busyAction === `lifecycle:decommission:${identity.agent_id}`}
                          onClick={() =>
                            runAction(`lifecycle:decommission:${identity.agent_id}`, () =>
                              writeJson(`/api/dashboard/governance/lifecycle/${identity.agent_id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  state: "decommissioning",
                                  reason: "Decommissioned from Mission Control",
                                }),
                              }),
                            )
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>
        </div>

        <div className="grid gap-4">
          <LivePanel title="Governance posture" meta="live attestation">
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Attestation coverage</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge
                    status={asDashboardStatus(attestation?.compliance?.overall_satisfied === false ? "warning" : "healthy")}
                    label={attestation?.compliance?.overall_satisfied === false ? "attention" : "covered"}
                  />
                  <span className="text-xs text-slate-500">
                    {attestation?.compliance?.checked_at
                      ? `checked ${formatRelativeTime(attestation.compliance.checked_at)}`
                      : "latest bundle"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500">
                  <div>policy coverage {coverage.policy_coverage ? "present" : "missing"}</div>
                  <div>receipt integrity {coverage.receipt_integrity ? "passing" : "attention"}</div>
                  <div>discovery coverage {coverage.discovery_coverage ? "tracked" : "missing"}</div>
                  <div>
                    runtime guardrails {coverage.runtime_guardrail_presence ? "present" : "missing"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">Credential backends</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{backends.length}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {backendHealthyCount} healthy backends protecting runtime credentials.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldQuestion className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">One shell, one boundary</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  This page is the Mission Control governance surface: real approvals, discovery, attestation, credentials, and supervised runtime controls in the same operator workflow.
                </p>
              </div>
            </div>
          </LivePanel>

          <LivePanel title="Credential backends" meta={`${backends.length} configured`}>
            {backends.length === 0 ? (
              <LiveEmptyState
                title="No credential backends configured"
                message="Registered vaults and secret managers will appear here with health state."
              />
            ) : (
              <div className="space-y-3">
                {backends.map((backend) => (
                  <div key={backend.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{backend.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {backend.backend} · {backend.path}
                        </p>
                      </div>
                      <StatusBadge
                        status={asDashboardStatus(backend.is_healthy ? "healthy" : "warning")}
                        label={backend.is_healthy ? "healthy" : "attention"}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">ttl {backend.ttl}s · {backend.is_active ? "active" : "inactive"}</p>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Discovery inventory" meta={`${discoveryItems.length} findings`}>
            {discoveryItems.length === 0 ? (
              <LiveEmptyState
                title="No discovery inventory yet"
                message="Run a scan to collect local sessions, governed agents, backends, and policy findings."
              />
            ) : (
              <div className="space-y-3">
                {discoveryItems.slice(0, 6).map((item) => (
                  <div key={item.finding_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.entity_type} · {item.source} · confidence {(item.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={asDashboardStatus(item.risk_level)} label={item.risk_level} />
                        <StatusBadge
                          status={asDashboardStatus(item.registration_status === "registered" ? "healthy" : "warning")}
                          label={item.registration_status}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.entity_id}</p>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Supervised runtime" meta={`${supervisedAgents.length} agents`}>
            {supervisedAgents.length === 0 ? (
              <LiveEmptyState
                title="No supervised agents running"
                message="Faramesh-supervised agents will surface here with restart and stop controls."
              />
            ) : (
              <div className="space-y-3">
                {supervisedAgents.map((agent) => (
                  <div key={agent.agent_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{agent.agent_id}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          profile {agent.launch_profile || "none"} · policy {agent.faramesh_policy || "none"}
                        </p>
                      </div>
                      <StatusBadge status={asDashboardStatus(agent.state || "idle")} label={agent.state || "unknown"} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>pid {agent.pid ?? "n/a"}</div>
                      <div>started {agent.started_at ? formatRelativeTime(agent.started_at) : "n/a"}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SectionButton
                        label="Restart"
                        busy={busyAction === `restart:${agent.agent_id}`}
                        onClick={() =>
                          runAction(`restart:${agent.agent_id}`, () =>
                            writeJson(`/api/dashboard/runtime/governance/supervised/${agent.agent_id}/restart`, {
                              method: "POST",
                            }),
                          )
                        }
                      />
                      <SectionButton
                        label="Stop"
                        tone="danger"
                        busy={busyAction === `stop:${agent.agent_id}`}
                        onClick={() =>
                          runAction(`stop:${agent.agent_id}`, () =>
                            writeJson(`/api/dashboard/runtime/governance/supervised/${agent.agent_id}/stop`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ timeout: 10 }),
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Launch profiles" meta={`${profiles.length} profiles`}>
            {profiles.length === 0 ? (
              <LiveEmptyState
                title="No launch profiles registered"
                message="Configured Faramesh launch profiles will appear here for governed runtime starts."
              />
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div key={profile.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Radar className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">{profile.name}</span>
                    </div>
                    <p className="mt-3 font-mono text-xs text-slate-400">{profile.command.join(" ")}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      env {profile.env_keys.join(", ") || "none"} · policy {profile.faramesh_policy || "none"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>
        </div>
      </div>
    </div>
  );
}
