"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Rocket } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { usePicoState } from "@/components/pico/usePicoState";
import { buildPicoPath } from "@/lib/pico/routing";

type SectionResult = {
  key: string;
  ok: boolean;
  status: number;
  payload: unknown;
  error: string | null;
};

const endpoints = [
  ["assistant", "/api/dashboard/assistant/overview"],
  ["runs", "/api/dashboard/runs"],
  ["alerts", "/api/dashboard/monitoring/alerts"],
  ["budget", "/api/dashboard/budgets"],
  ["usage", "/api/dashboard/budgets/usage?period_start=30d"],
  ["runtime", "/api/dashboard/runtime/providers/openclaw"],
  ["approvals", "/api/dashboard/approvals?status=PENDING"],
  ["health", "/api/dashboard/health"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractError(payload: unknown, fallback: string) {
  if (typeof payload === "string") return payload;
  if (isRecord(payload)) {
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.message === "string") return payload.message;
    if (isRecord(payload.error) && typeof payload.error.message === "string") {
      return payload.error.message;
    }
  }
  return fallback;
}

function slugifyAssistantId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "pico-assistant";
}

function SectionCard({
  title,
  section,
  children,
}: {
  title: string;
  section?: SectionResult;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {section ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              section.ok
                ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : section.status === 401
                  ? "border border-amber-300/20 bg-amber-300/10 text-amber-200"
                  : "border border-rose-300/20 bg-rose-300/10 text-rose-200"
            }`}
          >
            {section.ok ? "Live" : section.status === 401 ? "Auth" : `Error ${section.status}`}
          </span>
        ) : null}
      </div>
      <div className="mt-4 text-sm leading-7 text-white/68">{children}</div>
      {section && !section.ok ? <p className="mt-4 text-sm text-amber-200">{section.error}</p> : null}
    </div>
  );
}

export function PicoControlPage() {
  const basePath = usePicoBasePath();
  const loginHref = buildPicoPath(basePath, "/login");
  const academyHref = buildPicoPath(basePath, "/academy");
  const { state: picoState } = usePicoState();
  const [sections, setSections] = useState<Record<string, SectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [starterName, setStarterName] = useState("Pico Assistant");
  const [starterWorkspace, setStarterWorkspace] = useState("pico-assistant");
  const [starterModel, setStarterModel] = useState("openai/gpt-5");
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployReceipt, setDeployReceipt] = useState<Record<string, unknown> | null>(null);
  const [thresholdInput, setThresholdInput] = useState("50");
  const [thresholdMessage, setThresholdMessage] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const responses = await Promise.all(
      endpoints.map(async ([key, url]) => {
        const response = await fetch(url, { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        return [
          key,
          {
            key,
            ok: response.ok,
            status: response.status,
            payload,
            error: response.ok ? null : extractError(payload, `Failed to load ${key}`),
          } satisfies SectionResult,
        ] as const;
      }),
    );

    setSections(Object.fromEntries(responses));
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const authRequired = useMemo(() => {
    const values = Object.values(sections);
    return values.length > 0 && values.every((section) => section.status === 401);
  }, [sections]);

  const assistant = sections.assistant?.payload as Record<string, unknown> | undefined;
  const assistantRuntime = isRecord(assistant) && isRecord(assistant.assistant) ? assistant.assistant : null;
  const runs =
    isRecord(sections.runs?.payload) && Array.isArray(sections.runs.payload.items)
      ? sections.runs.payload.items
      : [];
  const alerts =
    isRecord(sections.alerts?.payload) && Array.isArray(sections.alerts.payload.items)
      ? sections.alerts.payload.items
      : [];
  const approvals = Array.isArray(sections.approvals?.payload) ? sections.approvals.payload : [];
  const budget = isRecord(sections.budget?.payload) ? sections.budget.payload : null;
  const usage = isRecord(sections.usage?.payload) ? sections.usage.payload : null;
  const runtime = isRecord(sections.runtime?.payload) ? sections.runtime.payload : null;
  const health = isRecord(sections.health?.payload) ? sections.health.payload : null;
  const planLabel = picoState.plan ?? (typeof budget?.plan === "string" ? budget.plan : "FREE");
  const planNote =
    planLabel === "FREE"
      ? "Free gets the academy plus a single monitored starter lane. Billing is not wired yet, so treat this as a soft product flag, not a charge boundary."
      : planLabel === "STARTER"
        ? "Starter is the first real monitored lane: one agent, alerts, and short retention."
        : planLabel === "PRO"
          ? "Pro assumes multiple monitored agents plus stronger control habits."
          : "Team stays soft-gated until multi-user behavior is actually implemented.";
  const picoRaw = isRecord(picoState.raw) ? picoState.raw : null;
  const currentThreshold = typeof picoRaw?.cost_threshold_usd === "number" ? picoRaw.cost_threshold_usd : null;
  const approvalGateEnabled = picoRaw?.approval_gate_enabled === true;

  async function handleDeployStarter() {
    setDeploying(true);
    setDeployError(null);
    setDeployReceipt(null);

    try {
      const assistantId = slugifyAssistantId(starterName);
      const response = await fetch("/api/dashboard/templates/personal_assistant/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: starterName,
          description: "Starter assistant deployed from PicoMUTX",
          model: starterModel,
          assistant_id: assistantId,
          workspace: starterWorkspace,
          replicas: 1,
          skills: ["workspace_memory"],
          runtime_metadata: {
            launched_from: "pico",
            academy: true,
          },
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractError(payload, "Failed to deploy starter assistant"));
      }

      setDeployReceipt(isRecord(payload) ? payload : { receipt: payload });
      await fetch("/api/pico/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "starter_agent_deployed",
          metadata: isRecord(payload)
            ? {
                template_id: payload.template_id,
                agent_id: isRecord(payload.agent) ? payload.agent.id : null,
                deployment_id: isRecord(payload.deployment) ? payload.deployment.id : null,
              }
            : {},
        }),
      }).catch(() => null);
      await refresh();
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : "Failed to deploy starter assistant");
    } finally {
      setDeploying(false);
    }
  }

  async function handleSetThreshold() {
    setThresholdMessage(null);
    const threshold = Number(thresholdInput);
    if (!Number.isFinite(threshold) || threshold < 0) {
      setThresholdMessage("Enter a non-negative threshold.");
      return;
    }

    await fetch("/api/pico/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "cost_threshold_set",
        metadata: { threshold_usd: threshold },
      }),
    });
    setThresholdMessage(`Soft threshold saved at ${threshold}. This is a Pico operator guardrail, not hard budget enforcement.`);
  }

  async function handleEnableApprovalGate() {
    setApprovalMessage(null);
    const agentId = isRecord(assistantRuntime) ? assistantRuntime.agent_id : null;
    if (typeof agentId !== "string") {
      setApprovalMessage("Deploy a starter assistant first so there is a real runtime to gate.");
      return;
    }

    const response = await fetch("/api/dashboard/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentId,
        session_id: `pico-control-${Date.now()}`,
        action_type: "external_send",
        payload: { source: "pico-control", guardrail: "manual approval before risky outbound action" },
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setApprovalMessage(extractError(payload, "Failed to create approval gate request."));
      return;
    }

    await fetch("/api/pico/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "approval_gate_enabled", metadata: { action_type: "external_send" } }),
    }).catch(() => null);
    setApprovalMessage("Approval gate request created. Review the pending approvals panel below.");
    await refresh();
  }

  return (
    <PicoProductShell
      title="Control"
      description="This page surfaces live assistant, run, alert, budget, runtime, health, and approval data from the same-origin API proxies already available in the product."
      actions={
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh live data
        </button>
      }
    >
      {authRequired ? (
        <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.08] p-6 text-sm leading-7 text-amber-50">
          Sign in first. These panels read authenticated same-origin APIs and stay honest when the session is missing.
          <div className="mt-4">
            <Link href={loginHref} className="font-semibold text-white">
              Go to sign in
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/50">
          {lastUpdated ? `Last refreshed ${new Date(lastUpdated).toLocaleString()}.` : "Loading live control data..."}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/68">
          <span className="font-semibold text-white">Plan {planLabel}</span>. {planNote}
        </div>
      </div>

      {!authRequired && !assistantRuntime ? (
        <section className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
                Starter deploy
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Launch the first real Pico assistant now.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                This uses the real personal_assistant template route. It is the shortest path from lessons into a live monitored runtime.
              </p>
            </div>
            <Link href={academyHref} className="text-sm font-semibold text-white/60">
              Review the academy first if you have not finished setup.
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-white/75">
              <span>Name</span>
              <input
                value={starterName}
                onChange={(event) => setStarterName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3 text-white outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-white/75">
              <span>Workspace</span>
              <input
                value={starterWorkspace}
                onChange={(event) => setStarterWorkspace(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3 text-white outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-white/75">
              <span>Model</span>
              <input
                value={starterModel}
                onChange={(event) => setStarterModel(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDeployStarter()}
              disabled={deploying || !starterName.trim() || !starterWorkspace.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              <Rocket className={`h-4 w-4 ${deploying ? "animate-pulse" : ""}`} />
              {deploying ? "Deploying starter assistant" : "Deploy starter assistant"}
            </button>
            <span className="text-sm text-white/55">Free should stay at one monitored starter lane. More than that is a later plan-gated upgrade.</span>
          </div>

          {deployError ? <p className="mt-4 text-sm text-amber-200">{deployError}</p> : null}
          {deployReceipt ? (
            <p className="mt-4 text-sm text-emerald-200">
              Starter assistant deployed. Refresh the control cards if the new runtime summary does not appear immediately.
            </p>
          ) : null}
        </section>
      ) : null}

      {!authRequired ? (
        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Cost threshold</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Set one visible spending line.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              This saves a Pico operator threshold in learner state. It is honest soft control, not hidden fake enforcement.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={thresholdInput}
                onChange={(event) => setThresholdInput(event.target.value)}
                className="w-40 rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSetThreshold()}
                className="rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Save threshold
              </button>
            </div>
            <p className="mt-4 text-sm text-white/55">Current saved threshold: {currentThreshold ?? "not set"}</p>
            {thresholdMessage ? <p className="mt-3 text-sm text-emerald-200">{thresholdMessage}</p> : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Approval gate</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Create one real pending approval.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              This creates a real approval request for a risky outbound action when an assistant exists. It proves the gate path without pretending governance is magic.
            </p>
            <button
              type="button"
              onClick={() => void handleEnableApprovalGate()}
              className="mt-4 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              {approvalGateEnabled ? "Create another pending approval" : "Enable approval gate"}
            </button>
            <p className="mt-4 text-sm text-white/55">Gate status: {approvalGateEnabled ? "enabled" : "not yet enabled"}</p>
            {approvalMessage ? <p className="mt-3 text-sm text-emerald-200">{approvalMessage}</p> : null}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Assistant overview" section={sections.assistant}>
          {assistantRuntime ? (
            <div className="space-y-2">
              <p>Name: {String(assistantRuntime.name ?? "Unnamed assistant")}</p>
              <p>Status: {String(assistantRuntime.status ?? "unknown")}</p>
              <p>Sessions: {String(assistantRuntime.session_count ?? 0)}</p>
              <p>
                Gateway: {isRecord(assistantRuntime.gateway) ? String(assistantRuntime.gateway.status ?? "unknown") : "unknown"}
              </p>
              <p>Skills: {Array.isArray(assistantRuntime.installed_skills) ? assistantRuntime.installed_skills.length : 0}</p>
              <p>Channels: {Array.isArray(assistantRuntime.channels) ? assistantRuntime.channels.length : 0}</p>
            </div>
          ) : (
            <p>No assistant runtime is currently available for this operator session.</p>
          )}
        </SectionCard>

        <SectionCard title="Recent runs" section={sections.runs}>
          <p>
            Total visible runs: {isRecord(sections.runs?.payload) ? String(sections.runs.payload.total ?? runs.length) : runs.length}
          </p>
          <ul className="mt-3 space-y-2 text-white/60">
            {runs.slice(0, 4).map((run, index) => {
              const item = isRecord(run) ? run : {};
              return (
                <li key={String(item.id ?? index)}>
                  {String(item.status ?? "unknown")} · {String(item.started_at ?? item.created_at ?? "no timestamp")}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Alerts" section={sections.alerts}>
          <p>
            Unresolved count: {isRecord(sections.alerts?.payload) ? String(sections.alerts.payload.unresolved_count ?? 0) : "0"}
          </p>
          <ul className="mt-3 space-y-2 text-white/60">
            {alerts.slice(0, 4).map((alert, index) => {
              const item = isRecord(alert) ? alert : {};
              return (
                <li key={String(item.id ?? index)}>
                  {String(item.type ?? "alert")} · {String(item.message ?? "No message")}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Budget" section={sections.budget}>
          <p>Plan: {String(budget?.plan ?? planLabel)}</p>
          <p>
            Credits remaining: {String(budget?.credits_remaining ?? "0")} / {String(budget?.credits_total ?? "0")}
          </p>
          <p>Usage: {String(budget?.usage_percentage ?? "0")}%</p>
          <p className="mt-3 text-white/55">Top usage drivers:</p>
          <ul className="mt-2 space-y-2 text-white/60">
            {Array.isArray(usage?.usage_by_agent) ? (
              usage.usage_by_agent.slice(0, 3).map((item, index) => {
                const agent = isRecord(item) ? item : {};
                return (
                  <li key={String(agent.agent_id ?? index)}>
                    {String(agent.agent_name ?? "Unknown agent")} · {String(agent.credits_used ?? 0)} credits
                  </li>
                );
              })
            ) : (
              <li>No usage breakdown returned.</li>
            )}
          </ul>
        </SectionCard>

        <SectionCard title="Runtime" section={sections.runtime}>
          <p>Provider: {String(runtime?.label ?? runtime?.provider ?? "openclaw")}</p>
          <p>Status: {String(runtime?.status ?? "unknown")}</p>
          <p>Version: {String(runtime?.version ?? "unknown")}</p>
          <p>Binding count: {String(runtime?.binding_count ?? 0)}</p>
          <p>Gateway URL: {String(runtime?.gateway_url ?? "not set")}</p>
        </SectionCard>

        <SectionCard title="Approvals" section={sections.approvals}>
          <p>Pending approvals returned: {approvals.length}</p>
          <ul className="mt-3 space-y-2 text-white/60">
            {approvals.slice(0, 4).map((approval, index) => {
              const item = isRecord(approval) ? approval : {};
              return (
                <li key={String(item.id ?? index)}>
                  {String(item.action_type ?? "unknown action")} · {String(item.requester ?? "unknown requester")} · {String(item.status ?? "PENDING")}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Health" section={sections.health}>
          <p>Status: {String(health?.status ?? "unknown")}</p>
          <p>Database: {String(health?.database ?? "unknown")}</p>
          <p>Uptime seconds: {String(health?.uptime_seconds ?? 0)}</p>
        </SectionCard>
      </div>
    </PicoProductShell>
  );
}
