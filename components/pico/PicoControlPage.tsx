"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Rocket } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { picoFieldClass, picoPrimaryButtonClass, picoSecondaryButtonClass, picoSectionLabelClass, picoSurfaceClass, picoSurfaceInsetClass, picoSurfaceStrongClass } from "@/components/pico/picoUi";
import { normalizePicoState, usePicoState } from "@/components/pico/usePicoState";
import { describePicoProgressMoment, getNextMissingPicoMilestone } from "@/lib/pico/progressionSignals";
import { buildPicoPath } from "@/lib/pico/routing";

type SectionResult = {
  key: string;
  ok: boolean;
  status: number;
  payload: unknown;
  error: string | null;
};

type ActionReceipt = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  nextLabel?: string;
  nextHref?: string;
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

export function extractPicoControlError(payload: unknown, fallback: string) {
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

export function slugifyAssistantId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "pico-assistant";
}

export function buildStarterDeployPayload({
  name,
  workspace,
  model,
}: {
  name: string;
  workspace: string;
  model: string;
}) {
  return {
    name,
    description: "Starter assistant deployed from PicoMUTX",
    model,
    assistant_id: slugifyAssistantId(name),
    workspace,
    replicas: 1,
    skills: ["workspace_memory"],
    runtime_metadata: {
      launched_from: "pico",
      academy: true,
    },
  };
}

export function buildStarterDeployEventPayload(payload: unknown) {
  return {
    event: "starter_agent_deployed",
    metadata: isRecord(payload)
      ? {
          template_id: payload.template_id,
          agent_id: isRecord(payload.agent) ? payload.agent.id : null,
          deployment_id: isRecord(payload.deployment) ? payload.deployment.id : null,
        }
      : {},
  };
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
            {section.ok ? "Live" : section.status === 401 ? "Sign in" : `Issue ${section.status}`}
          </span>
        ) : null}
      </div>
      <div className="mt-4 text-sm leading-7 text-white/68">{children}</div>
      {section && !section.ok ? <p className="mt-4 text-sm text-amber-200">{section.error}</p> : null}
    </div>
  );
}

type SummaryItem = {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
};

type KeyValueItem = {
  label: string;
  value: string;
  mono?: boolean;
};

function formatControlValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatControlTimestamp(value: unknown, fallback = "No recent update yet") {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
}

function formatControlDuration(value: unknown, fallback = "—") {
  const totalSeconds =
    typeof value === "number" ? value : typeof value === "string" && value.trim().length > 0 ? Number(value) : Number.NaN;

  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return fallback;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${Math.floor(totalSeconds)}s`;
}

function summaryToneClass(tone: SummaryItem["tone"]) {
  if (tone === "good") {
    return "text-emerald-200";
  }

  if (tone === "warn") {
    return "text-amber-200";
  }

  return "text-white";
}

function SummaryGrid({ items }: { items: SummaryItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={`${picoSurfaceInsetClass} p-3`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{item.label}</p>
          <p className={`mt-2 text-lg font-semibold ${summaryToneClass(item.tone)}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function KeyValueList({ items }: { items: KeyValueItem[] }) {
  return (
    <dl className="mt-4 space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-4 border-t border-white/8 pt-3 first:border-t-0 first:pt-0"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{item.label}</dt>
          <dd className={`max-w-[70%] text-right text-sm font-medium text-white ${item.mono ? "break-all font-mono text-xs sm:text-sm" : ""}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CompactList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary?: string; meta?: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className={`${picoSurfaceInsetClass} flex items-start justify-between gap-3 p-3`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-6 text-white break-words">{item.primary}</p>
                {item.secondary ? <p className="mt-1 text-xs text-white/55">{item.secondary}</p> : null}
              </div>
              {item.meta ? <p className="shrink-0 text-xs font-medium text-cyan-100/90">{item.meta}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/55">{emptyLabel}</p>
      )}
    </div>
  );
}

export function PicoControlPage() {
  const basePath = usePicoBasePath();
  const academyHref = buildPicoPath(basePath, "/academy");
  const startHref = buildPicoPath(basePath, "/start");
  const { state: picoState, refresh: refreshPicoState } = usePicoState();
  const [sections, setSections] = useState<Record<string, SectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [starterName, setStarterName] = useState("Pico Assistant");
  const [starterWorkspace, setStarterWorkspace] = useState("pico-assistant");
  const [starterModel, setStarterModel] = useState("openai/gpt-5");
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployReceipt, setDeployReceipt] = useState<Record<string, unknown> | null>(null);
  const [actionReceipts, setActionReceipts] = useState<ActionReceipt[]>([]);
  const [thresholdInput, setThresholdInput] = useState("50");
  const [thresholdMessage, setThresholdMessage] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const responses = await Promise.allSettled(
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
            error: response.ok ? null : extractPicoControlError(payload, `Failed to load ${key}`),
          } satisfies SectionResult,
        ] as const;
      }),
    );

    const normalized = responses.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      const [key] = endpoints[index];
      return [
        key,
        {
          key,
          ok: false,
          status: 0,
          payload: null,
          error: result.reason instanceof Error ? result.reason.message : `Failed to load ${key}`,
        } satisfies SectionResult,
      ] as const;
    });

    setSections(Object.fromEntries(normalized));
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
  const healthDetail =
    typeof health?.error === "string" && health.error.length > 0
      ? health.error
      : typeof health?.detail === "string" && health.detail.length > 0
        ? health.detail
        : null;
  const healthComponents = isRecord(health?.components) ? Object.keys(health.components) : [];
  const planLabel = picoState.plan ?? (typeof budget?.plan === "string" ? budget.plan : "FREE");
  const planNote =
    planLabel === "FREE"
      ? "Free includes Academy and one monitored starter lane. Billing is not enforced yet, so treat this as an access label today."
      : planLabel === "STARTER"
        ? "Starter gives you one monitored assistant with alerts and a short activity history."
        : planLabel === "PRO"
          ? "Pro is built for multiple monitored assistants and tighter operator habits."
          : "Team access stays limited until shared operator workflows are ready.";
  const currentThreshold = picoState.costThresholdUsd;
  const approvalGateEnabled = picoState.approvalGateEnabled;
  const tutorAccessLabel =
    picoState.plan === null
      ? "Sign in to load your tutor allowance for this workspace."
      : picoState.tutorAccess.limit === null
        ? "Grounded tutor is currently not capped on this plan."
        : `Grounded tutor used ${picoState.tutorAccess.used} of ${picoState.tutorAccess.limit} lookups, with ${picoState.tutorAccess.remaining} left.`;

  function pushReceipt(receipt: ActionReceipt) {
    setActionReceipts((current) => [receipt, ...current.filter((item) => item.id !== receipt.id)].slice(0, 3));
  }

  function buildOutcomeReceipt(
    payload: unknown,
    fallback: Omit<ActionReceipt, "id">,
  ): ActionReceipt {
    const nextState = normalizePicoState(payload, true);
    const latestEvent = nextState.recentEvents[nextState.recentEvents.length - 1] ?? null;
    const moment = latestEvent ? describePicoProgressMoment(latestEvent) : null;
    const missingMilestone = getNextMissingPicoMilestone({
      completedLessonSlugs: nextState.completedLessonSlugs,
      completedTrackIds: nextState.completedTrackIds,
      milestones: nextState.milestones,
    });

    const hasFreshProgressSignal = Boolean(
      moment &&
        (moment.chips.length > 0 ||
          moment.unlockedBadges.length > 0 ||
          moment.unlockedMilestones.length > 0 ||
          moment.unlockedTracks.length > 0 ||
          moment.levelUp),
    );

    return {
      id: `${fallback.title}-${Date.now()}`,
      title: hasFreshProgressSignal && moment ? moment.title : fallback.title,
      summary: hasFreshProgressSignal && moment?.chips[0] ? moment.chips[0] : fallback.summary,
      detail:
        hasFreshProgressSignal && moment
          ? `${moment.body} ${missingMilestone ? `Next: ${missingMilestone.title}.` : fallback.detail}`
          : fallback.detail,
      nextLabel: missingMilestone?.actionLabel ?? fallback.nextLabel,
      nextHref: missingMilestone ? buildPicoPath(basePath, missingMilestone.path) : fallback.nextHref,
    };
  }

  async function handleDeployStarter() {
    setDeploying(true);
    setDeployError(null);
    setDeployReceipt(null);

    try {
      const response = await fetch("/api/dashboard/templates/personal_assistant/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildStarterDeployPayload({
            name: starterName,
            workspace: starterWorkspace,
            model: starterModel,
          }),
        ),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractPicoControlError(payload, "Could not launch the starter assistant."));
      }

      setDeployReceipt(isRecord(payload) ? payload : { receipt: payload });
      const deploymentId = isRecord(payload) && isRecord(payload.deployment) ? payload.deployment.id : null;
      const agentId = isRecord(payload) && isRecord(payload.agent) ? payload.agent.id : null;
      const progressResponse = await fetch("/api/pico/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStarterDeployEventPayload(payload)),
      }).catch(() => null);
      const progressPayload = progressResponse ? await progressResponse.json().catch(() => null) : null;
      pushReceipt(
        buildOutcomeReceipt(progressPayload, {
          title: "Starter assistant launched",
          summary: `${starterName} is now live in ${starterWorkspace}.`,
          detail: `Assistant ${String(agentId ?? "unknown")} is on its first lane. Launch receipt ${String(deploymentId ?? "pending")}. Next: refresh the live cards and confirm activity is flowing.`,
          nextLabel: "Review live controls",
          nextHref: `${buildPicoPath(basePath, "/control")}#assistant-overview`,
        }),
      );
      await Promise.all([refresh(), refreshPicoState()]);
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : "Could not launch the starter assistant.");
    } finally {
      setDeploying(false);
    }
  }

  async function handleSetThreshold() {
    setThresholdMessage(null);
    const threshold = Number(thresholdInput);
    if (!Number.isFinite(threshold) || threshold < 0) {
      setThresholdMessage("Enter a USD spend line of 0 or more.");
      return;
    }

    const response = await fetch("/api/pico/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "cost_threshold_set",
        metadata: { threshold_usd: threshold },
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setThresholdMessage(extractPicoControlError(payload, "Could not save the USD spend line."));
      return;
    }

    await refreshPicoState();
    setThresholdMessage(
      currentThreshold === null
        ? `Alert threshold saved at ${threshold}. Pico now has a real warning line.`
        : `Alert threshold updated to ${threshold}. Pico will keep showing it as a visible warning line, not a hard stop.`,
    );
    pushReceipt(
      buildOutcomeReceipt(payload, {
        title: currentThreshold === null ? "Alert threshold configured" : "Alert threshold updated",
        summary: `USD spend line saved at ${threshold}.`,
        detail: "This is your visible spend guardrail in Pico. Next: check the budget card and decide whether the line still feels right.",
        nextLabel: "Review budget",
        nextHref: `${buildPicoPath(basePath, "/control")}#budget-card`,
      }),
    );
  }

  async function handleEnableApprovalGate() {
    setApprovalMessage(null);
    const agentId = isRecord(assistantRuntime) ? assistantRuntime.agent_id : null;
    if (typeof agentId !== "string") {
      setApprovalMessage("Launch a starter assistant first so Pico has something real to hold for review.");
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
      setApprovalMessage(extractPicoControlError(payload, "Could not create the approval request."));
      return;
    }

    const progressResponse = await fetch("/api/pico/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "approval_gate_enabled", metadata: { action_type: "external_send" } }),
    }).catch(() => null);
    const progressPayload = progressResponse ? await progressResponse.json().catch(() => null) : null;
    const approvalId = isRecord(payload) ? payload.id : null;
    setApprovalMessage("Approval request created. Review it in the pending approvals panel below.");
    pushReceipt(
      buildOutcomeReceipt(progressPayload, {
        title: "Approval request queued",
        summary: "A higher-risk action is now waiting for an operator decision.",
        detail: `Request ${String(approvalId ?? "pending")} is now waiting in Approvals. Next: open the queue below and resolve it deliberately.`,
        nextLabel: "Review approvals",
        nextHref: `${buildPicoPath(basePath, "/control")}#approvals-card`,
      }),
    );
    await Promise.all([refresh(), refreshPicoState()]);
  }

  return (
    <PicoProductShell
      title="Control"
      description="Watch your live assistant, activity, alerts, spend, approvals, runtime, and health in one operator view."
      actions={
        <button
          type="button"
          onClick={() => void refresh()}
          className={picoSecondaryButtonClass}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh control view
        </button>
      }
    >
      {authRequired ? (
        <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.08] p-6 text-sm leading-7 text-amber-50">
          Open Pico Start first. These panels use your signed-in workspace session, so they stay empty until you are authenticated.
          <div className="mt-4">
            <Link href={startHref} className="font-semibold text-white">
              Open Pico Start
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className={`${picoSurfaceClass} px-5 py-4 text-sm text-white/50`}>
          {lastUpdated ? `Last refreshed ${new Date(lastUpdated).toLocaleString()}.` : "Loading your control view..."}
        </div>
        <div className={`${picoSurfaceClass} px-5 py-4 text-sm text-white/68`}>
          <span className="font-semibold text-white">Plan {planLabel}</span>. {planNote}
        </div>
        <div className={`${picoSurfaceClass} px-5 py-4 text-sm text-white/68`}>
          <span className="font-semibold text-white">Tutor access</span>. {tutorAccessLabel}
        </div>
      </div>

      {!authRequired && !assistantRuntime ? (
        <section id="starter-deploy" className={`${picoSurfaceStrongClass} p-6 scroll-mt-24`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className={picoSectionLabelClass}>Quick launch</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Launch your first Pico assistant.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Start the default assistant in one click. Open the extra settings only if you need to rename the assistant, workspace, or model.
              </p>
            </div>
            <Link href={academyHref} className="text-sm font-semibold text-white/60">
              Need setup first? Review Academy.
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDeployStarter()}
              disabled={deploying || !starterName.trim() || !starterWorkspace.trim()}
              className={`${picoPrimaryButtonClass} px-4 py-3 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40`}
            >
              <Rocket className={`h-4 w-4 ${deploying ? "animate-pulse" : ""}`} />
              {deploying ? "Launching starter assistant" : "Launch starter assistant"}
            </button>
            <span className="text-sm text-white/55">Default launch: {starterName} in {starterWorkspace} on {starterModel}.</span>
          </div>

          <details className={`${picoSurfaceInsetClass} mt-5 p-4`}>
            <summary className="cursor-pointer text-sm font-semibold text-white">Adjust launch settings</summary>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <label className="space-y-2 text-sm text-white/75">
                <span>Assistant name</span>
                <input
                  value={starterName}
                  onChange={(event) => setStarterName(event.target.value)}
                  className={picoFieldClass}
                />
              </label>
              <label className="space-y-2 text-sm text-white/75">
                <span>Workspace slug</span>
                <input
                  value={starterWorkspace}
                  onChange={(event) => setStarterWorkspace(event.target.value)}
                  className={picoFieldClass}
                />
              </label>
              <label className="space-y-2 text-sm text-white/75">
                <span>Model</span>
                <input
                  value={starterModel}
                  onChange={(event) => setStarterModel(event.target.value)}
                  className={picoFieldClass}
                />
              </label>
            </div>
          </details>

          {deployError ? <p className="mt-4 text-sm text-amber-200">{deployError}</p> : null}
          {deployReceipt ? (
            <p className="mt-4 text-sm text-emerald-200">
              Starter assistant launched. Refresh the control cards if the live summary does not appear right away.
            </p>
          ) : null}
        </section>
      ) : null}

      {!authRequired ? (
        <section id="control-review" className="grid gap-5 xl:grid-cols-2 scroll-mt-24">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Spend line</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Set a visible spend guardrail.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Save the amount Pico should flag in this operator view. It is a clear warning line, not an automatic shutdown.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={thresholdInput}
                onChange={(event) => setThresholdInput(event.target.value)}
                className={`${picoFieldClass} w-40`}
              />
              <button
                type="button"
                onClick={() => void handleSetThreshold()}
                className={`${picoPrimaryButtonClass} px-4 py-3`}
              >
                Save spend line
              </button>
            </div>
            <p className="mt-4 text-sm text-white/55">Current spend line (USD): {currentThreshold ?? "not set"}</p>
            {thresholdMessage ? <p className="mt-3 text-sm text-emerald-200">{thresholdMessage}</p> : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Manual review</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Put one real action behind review.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Create a live approval request for a higher-risk outbound action when an assistant is running. This verifies the review flow with a real queue item.
            </p>
            <button
              type="button"
              onClick={() => void handleEnableApprovalGate()}
              className={`mt-4 ${picoPrimaryButtonClass} px-4 py-3`}
            >
              {approvalGateEnabled ? "Queue another approval" : "Create approval request"}
            </button>
            <p className="mt-4 text-sm text-white/55">Review gate: {approvalGateEnabled ? "on" : "not active yet"}</p>
            {approvalMessage ? <p className="mt-3 text-sm text-emerald-200">{approvalMessage}</p> : null}
          </div>
        </section>
      ) : null}

      {actionReceipts.length > 0 ? (
        <section className={`${picoSurfaceClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={picoSectionLabelClass}>Operator receipts</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Recent control changes that actually landed</h2>
            </div>
            <p className="text-sm text-white/50">Every meaningful control change should leave a receipt.</p>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {actionReceipts.map((receipt) => (
              <div key={receipt.id} className={`${picoSurfaceInsetClass} p-4`}>
                <p className="text-sm font-semibold text-white">{receipt.title}</p>
                <p className="mt-2 text-sm text-cyan-100/90">{receipt.summary}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{receipt.detail}</p>
                {receipt.nextHref && receipt.nextLabel ? (
                  <Link href={receipt.nextHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                    {receipt.nextLabel} <RefreshCw className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <div id="assistant-overview">
          <SectionCard title="Assistant overview" section={sections.assistant}>
            {assistantRuntime ? (
              <>
                <SummaryGrid
                  items={[
                    {
                      label: "Status",
                      value: formatControlValue(assistantRuntime.status, "unknown"),
                      tone:
                        String(assistantRuntime.status ?? "").toLowerCase().includes("run") ||
                        String(assistantRuntime.status ?? "").toLowerCase().includes("health") ||
                        String(assistantRuntime.status ?? "").toLowerCase().includes("ok") ||
                        String(assistantRuntime.status ?? "").toLowerCase().includes("active")
                          ? "good"
                          : "default",
                    },
                    {
                      label: "Sessions",
                      value: formatControlValue(assistantRuntime.session_count, "0"),
                    },
                    {
                      label: "Connection",
                      value: formatControlValue(
                        isRecord(assistantRuntime.gateway) ? assistantRuntime.gateway.status : null,
                        "unknown",
                      ),
                      tone:
                        String(isRecord(assistantRuntime.gateway) ? assistantRuntime.gateway.status ?? "" : "")
                          .toLowerCase()
                          .includes("health") ||
                        String(isRecord(assistantRuntime.gateway) ? assistantRuntime.gateway.status ?? "" : "")
                          .toLowerCase()
                          .includes("ok")
                          ? "good"
                          : "default",
                    },
                  ]}
                />
                <KeyValueList
                  items={[
                    {
                      label: "Name",
                      value: formatControlValue(assistantRuntime.name, "Unnamed assistant"),
                    },
                    {
                      label: "Assistant ID",
                      value: formatControlValue(assistantRuntime.assistant_id, "Unavailable"),
                      mono: true,
                    },
                    {
                      label: "Workspace",
                      value: formatControlValue(assistantRuntime.workspace, "Unavailable"),
                      mono: true,
                    },
                    {
                      label: "Installed skills",
                      value: formatControlValue(
                        Array.isArray(assistantRuntime.installed_skills) ? assistantRuntime.installed_skills.length : 0,
                        "0",
                      ),
                    },
                    {
                      label: "Channels",
                      value: formatControlValue(Array.isArray(assistantRuntime.channels) ? assistantRuntime.channels.length : 0, "0"),
                    },
                    {
                      label: "Last activity",
                      value: formatControlTimestamp(assistantRuntime.last_activity, "No activity timestamp"),
                    },
                  ]}
                />
              </>
            ) : (
              <p>No live assistant is connected to this operator view yet.</p>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Recent activity" section={sections.runs}>
          <p>
            Visible activity items: {isRecord(sections.runs?.payload) ? String(sections.runs.payload.total ?? runs.length) : runs.length}
          </p>
          <ul className="mt-3 space-y-2 text-white/60">
            {runs.slice(0, 4).map((run, index) => {
              const item = isRecord(run) ? run : {};
              return (
                <li key={String(item.id ?? index)}>
                  {String(item.status ?? "unknown")} · {String(item.started_at ?? item.created_at ?? "No timestamp yet")}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Alerts" section={sections.alerts}>
          <p>
            Open alerts: {isRecord(sections.alerts?.payload) ? String(sections.alerts.payload.unresolved_count ?? 0) : "0"}
          </p>
          <ul className="mt-3 space-y-2 text-white/60">
            {alerts.slice(0, 4).map((alert, index) => {
              const item = isRecord(alert) ? alert : {};
              return (
                <li key={String(item.id ?? index)}>
                  {String(item.type ?? "alert")} · {String(item.message ?? "No message yet")}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div id="budget-card">
          <SectionCard title="Budget" section={sections.budget}>
            <SummaryGrid
              items={[
                {
                  label: "Plan",
                  value: formatControlValue(budget?.plan ?? planLabel, planLabel),
                },
                {
                  label: "Credits left",
                  value: formatControlValue(budget?.credits_remaining, "0"),
                },
                {
                  label: "Usage",
                  value: `${formatControlValue(budget?.usage_percentage, "0")}%`,
                  tone: Number(budget?.usage_percentage ?? 0) >= 80 ? "warn" : "default",
                },
              ]}
            />
            <KeyValueList
              items={[
                {
                  label: "Credits total",
                  value: formatControlValue(budget?.credits_total, "0"),
                },
                {
                  label: "Credits used",
                  value: formatControlValue(budget?.credits_used ?? usage?.total_credits_used, "0"),
                },
                {
                  label: "Reset date",
                  value: formatControlTimestamp(budget?.reset_date, "Not scheduled yet"),
                },
                {
                  label: "Usage window",
                  value:
                    typeof usage?.period_start === "string" && typeof usage?.period_end === "string"
                      ? `${formatControlTimestamp(usage.period_start)} → ${formatControlTimestamp(usage.period_end)}`
                      : "Last 30 days",
                },
              ]}
            />
            <CompactList
              title="Top spend drivers"
              emptyLabel="No spend breakdown available yet."
              items={
                Array.isArray(usage?.usage_by_agent)
                  ? usage.usage_by_agent.slice(0, 3).map((item, index) => {
                      const agent = isRecord(item) ? item : {};
                      return {
                        id: String(agent.agent_id ?? index),
                        primary: formatControlValue(agent.agent_name, "Unknown agent"),
                        secondary:
                          agent.event_count !== undefined ? `${formatControlValue(agent.event_count, "0")} events this period` : undefined,
                        meta: `${formatControlValue(agent.credits_used, "0")} cr`,
                      };
                    })
                  : []
              }
            />
          </SectionCard>
        </div>

        <SectionCard title="Runtime service" section={sections.runtime}>
          <SummaryGrid
            items={[
              {
                label: "Provider",
                value: formatControlValue(runtime?.label ?? runtime?.provider, "openclaw"),
              },
              {
                label: "Status",
                value: formatControlValue(runtime?.status, "unknown"),
                tone:
                  String(runtime?.status ?? "").toLowerCase().includes("health") ||
                  String(runtime?.status ?? "").toLowerCase().includes("ok")
                    ? "good"
                    : String(runtime?.status ?? "").toLowerCase().includes("degrad") ||
                        String(runtime?.status ?? "").toLowerCase().includes("stale")
                      ? "warn"
                      : "default",
              },
              {
                label: "Connected lanes",
                value: formatControlValue(runtime?.binding_count, "0"),
              },
            ]}
          />
          <KeyValueList
            items={[
              {
                label: "Version",
                value: formatControlValue(runtime?.version, "unknown"),
                mono: true,
              },
              {
                label: "Gateway address",
                value: formatControlValue(runtime?.gateway_url, "not set"),
                mono: true,
              },
              {
                label: "Tracking mode",
                value: formatControlValue(runtime?.tracking_mode ?? runtime?.install_method, "Unavailable"),
              },
              {
                label: "Last heartbeat",
                value: formatControlTimestamp(runtime?.last_seen_at, "No heartbeat yet"),
              },
            ]}
          />
        </SectionCard>

        <div id="approvals-card">
          <SectionCard title="Approvals" section={sections.approvals}>
            <SummaryGrid
              items={[
                {
                  label: "Review gate",
                  value: approvalGateEnabled ? "Enabled" : "Not enabled",
                  tone: approvalGateEnabled ? "good" : "warn",
                },
                {
                  label: "Pending",
                  value: formatControlValue(approvals.length, "0"),
                  tone: approvals.length > 0 ? "warn" : "default",
                },
                {
                  label: "Queue",
                  value: approvals.length > 0 ? "Needs operator review" : "Clear",
                  tone: approvals.length > 0 ? "warn" : "good",
                },
              ]}
            />
            <KeyValueList
              items={[
                {
                  label: "Review guidance",
                  value: approvalGateEnabled ? "Higher-risk outbound actions can be held for review." : "Create a request above to put one real action behind review.",
                },
                {
                  label: "Latest request",
                  value: approvals.length > 0 && isRecord(approvals[0]) ? formatControlValue(approvals[0].status, "PENDING") : "No pending approvals yet",
                },
              ]}
            />
            <CompactList
              title="Pending review queue"
              emptyLabel="No pending approvals yet."
              items={approvals.slice(0, 4).map((approval, index) => {
                const item = isRecord(approval) ? approval : {};
                return {
                  id: String(item.id ?? index),
                  primary: formatControlValue(item.action_type, "unknown action"),
                  secondary: formatControlValue(item.requester, "unknown requester"),
                  meta: formatControlValue(item.status, "PENDING"),
                };
              })}
            />
          </SectionCard>
        </div>

        <SectionCard title="Health" section={sections.health}>
          <SummaryGrid
            items={[
              {
                label: "Status",
                value: formatControlValue(health?.status, "unknown"),
                tone:
                  String(health?.status ?? "").toLowerCase().includes("ok") ||
                  String(health?.status ?? "").toLowerCase().includes("health")
                    ? "good"
                    : String(health?.status ?? "").toLowerCase().includes("degrad")
                      ? "warn"
                      : "default",
              },
              {
                label: "Data store",
                value: formatControlValue(health?.database, "unknown"),
                tone:
                  String(health?.database ?? "").toLowerCase().includes("ok") ||
                  String(health?.database ?? "").toLowerCase().includes("healthy") ||
                  String(health?.database ?? "").toLowerCase().includes("ready")
                    ? "good"
                    : String(health?.database ?? "").toLowerCase().includes("degrad") ||
                        String(health?.database ?? "").toLowerCase().includes("down")
                      ? "warn"
                      : "default",
              },
              {
                label: "Uptime",
                value: formatControlDuration(health?.uptime_seconds ?? health?.uptime, "0s"),
              },
            ]}
          />
          <KeyValueList
            items={[
              {
                label: "Checked at",
                value: formatControlTimestamp(health?.timestamp, "Unavailable"),
              },
              {
                label: "Version",
                value: formatControlValue(health?.version, "Unavailable"),
                mono: true,
              },
              {
                label: "Services checked",
                value: healthComponents.length > 0 ? healthComponents.join(", ") : "Unavailable",
              },
              {
                label: "Operator note",
                value: formatControlValue(healthDetail, "No extra context yet"),
              },
            ]}
          />
        </SectionCard>
      </div>
    </PicoProductShell>
  );
}
