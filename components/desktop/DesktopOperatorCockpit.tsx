"use client";

import {
  type ElementType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Copy,
  FolderOpen,
  Globe,
  HardDrive,
  Loader2,
  Play,
  Radar,
  RefreshCw,
  Server,
  Settings2,
  Shield,
  Sparkles,
  Square,
  Terminal,
  TerminalSquare,
  Workflow,
  Wrench,
} from "lucide-react";

import { DesktopRouteListener } from "@/components/desktop/DesktopRouteListener";
import { DesktopJobNotice } from "@/components/desktop/DesktopJobNotice";
import type {
  DoctorResult,
  GovernanceStatus,
  LocalSession,
  RuntimeInfo,
  WizardState,
} from "@/components/desktop/types";
import { useDesktopJob } from "@/components/desktop/useDesktopJob";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";
import { cn } from "@/lib/utils";

const HOSTED_API_URL = "https://api.mutx.dev";
const LOCAL_API_URL = "http://localhost:8000";

type StepStatus = "pending" | "running" | "complete" | "error";
type RuntimeMode = "hosted" | "local";
type AuthMode = "login" | "register" | "local";
type RuntimeAction = "import" | "install" | "tui";
type StepId =
  | "preflight"
  | "mode"
  | "auth"
  | "runtime"
  | "assistant"
  | "verify";
type CockpitVariant = "standalone" | "home" | "advanced";

interface OnboardingStep {
  id: StepId;
  title: string;
  description: string;
  status: StepStatus;
  error?: string;
}

interface PreflightResult {
  cliAvailable: boolean;
  mutxVersion: string | null;
  apiUrl: string | null;
  apiUrlSource: string | null;
  configPath: string | null;
  mutxHome: string | null;
  authenticated: boolean;
  openclawBinary: string | null;
  openclawHealth: string;
  openclawGateway: string | null;
  openclawSummary: string | null;
  farameshAvailable: boolean;
  farameshSummary: string | null;
  localCpReady: boolean;
  localCpPath: string | null;
}

interface AccountReadiness {
  email: string | null;
  isEmailVerified: boolean | null;
  webhookCount: number | null;
  loading: boolean;
  error: string | null;
}

const STEP_ORDER: Array<Omit<OnboardingStep, "status" | "error">> = [
  {
    id: "preflight",
    title: "Environment",
    description: "Interrogate the real desktop runtime and bridge health.",
  },
  {
    id: "mode",
    title: "Target",
    description: "Point this shell at hosted or local control.",
  },
  {
    id: "auth",
    title: "Identity",
    description: "Sync browser auth, CLI auth, and the native bridge.",
  },
  {
    id: "runtime",
    title: "Runtime",
    description: "Import, repair, or inspect OpenClaw from this machine.",
  },
  {
    id: "assistant",
    title: "Assistant",
    description: "Bind a real assistant and workspace through the native flow.",
  },
  {
    id: "verify",
    title: "Control",
    description:
      "Use the same surface for day-one setup and steady-state operations.",
  },
];

function computeWizardProgress(state: WizardState | null) {
  if (!state?.steps?.length) {
    return 0;
  }

  const completed = state.steps.filter((step) => step.completed).length;
  const activeBonus =
    state.status &&
    !["complete", "completed", "failed", "error"].includes(
      state.status.toLowerCase(),
    )
      ? 0.5
      : 0;
  return Math.min(
    100,
    Math.round(
      ((completed + activeBonus) / Math.max(state.steps.length, 1)) * 100,
    ),
  );
}

function normalizeWizardState(
  state: Partial<WizardState> | null | undefined,
): WizardState | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  return {
    provider: typeof state.provider === "string" ? state.provider : "openclaw",
    status: typeof state.status === "string" ? state.status : "idle",
    current_step:
      typeof state.current_step === "string" ? state.current_step : "idle",
    completed_steps: Array.isArray(state.completed_steps)
      ? state.completed_steps
      : [],
    failed_step:
      typeof state.failed_step === "string" ? state.failed_step : null,
    last_error: typeof state.last_error === "string" ? state.last_error : null,
    steps: Array.isArray(state.steps) ? state.steps : [],
    providers: Array.isArray(state.providers) ? state.providers : [],
  };
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response
    .json()
    .catch(() => ({ detail: "Request failed" }));
  if (!response.ok) {
    throw new Error(
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Request failed",
    );
  }

  return payload;
}

function extractString(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function extractBoolean(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

function extractRecord(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function SurfaceCard({
  title,
  eyebrow,
  children,
  tone = "default",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20"
      : tone === "warn"
        ? "border-amber-500/20"
        : tone === "danger"
          ? "border-rose-500/25"
          : "border-white/10";

  return (
    <section
      className={`rounded-[28px] border bg-[rgba(6,10,18,0.82)] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.35)] ${toneClass}`}
    >
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "danger" | "neutral";
}) {
  const className =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
        : tone === "danger"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
          : "border-white/10 bg-white/5 text-slate-300";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {label}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  icon: Icon,
  disabled,
  loading,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  icon: React.ElementType;
  disabled?: boolean;
  loading?: boolean;
  tone?: "default" | "primary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/15"
      : tone === "danger"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

function SignalTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string | null;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20"
      : tone === "warn"
        ? "border-amber-500/20"
        : tone === "danger"
          ? "border-rose-500/20"
          : "border-white/10";

  return (
    <div className={`rounded-[22px] border bg-black/20 p-4 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {detail ? (
        <p className="mt-2 text-sm leading-5 text-slate-400">{detail}</p>
      ) : null}
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-3 ${tone || "border-white/10 bg-black/20"}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DeskPanel({
  title,
  meta,
  children,
  tone = "default",
  className,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  tone?: "default" | "graphite" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border shadow-[0_12px_28px_rgba(15,23,42,0.06)]",
        tone === "graphite"
          ? "border-[#2b3238] bg-[linear-gradient(180deg,#171d26_0%,#10151c_100%)] text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)]"
          : tone === "success"
            ? "border-emerald-200 bg-[linear-gradient(180deg,#f7fcf8_0%,#eef8f2_100%)]"
            : tone === "warning"
              ? "border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#fbf3e2_100%)]"
              : tone === "danger"
                ? "border-rose-200 bg-[linear-gradient(180deg,#fff6f7_0%,#fbecee_100%)]"
                : "border-[#d9dee6] bg-[linear-gradient(180deg,#fbfcfe_0%,#f4f6fa_100%)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5",
          tone === "graphite"
            ? "border-[#252c33] bg-[rgba(255,255,255,0.02)]"
            : "border-[#e3e7ee] bg-[rgba(255,255,255,0.55)]",
        )}
      >
        <div className="min-w-0">
          {meta ? (
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.18em]",
                tone === "graphite" ? "text-[#8d97a4]" : "text-[#7d8793]",
              )}
            >
              {meta}
            </p>
          ) : null}
          <h2
            className={cn(
              "mt-1 text-[0.97rem] font-semibold tracking-[-0.03em]",
              tone === "graphite" ? "text-[#f5f7fb]" : "text-[#171a1f]",
            )}
          >
            {title}
          </h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DeskMetric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string | null;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]",
        tone === "good"
          ? "border-emerald-200 bg-[linear-gradient(180deg,#f7fdf8_0%,#edf9f0_100%)]"
          : tone === "warn"
            ? "border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#fbf1dd_100%)]"
            : tone === "danger"
              ? "border-rose-200 bg-[linear-gradient(180deg,#fff7f8_0%,#fbecef_100%)]"
              : "border-[#d9dee6] bg-[linear-gradient(180deg,#ffffff_0%,#f4f6fa_100%)]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d8692]">
        {label}
      </p>
      <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.03em] text-[#171a1f]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-[11.5px] leading-5 text-[#6f7885]">{detail}</p>
      ) : null}
    </div>
  );
}

function DeskActionButton({
  label,
  onClick,
  icon: Icon,
  disabled,
  loading,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  icon: ElementType;
  disabled?: boolean;
  loading?: boolean;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] border px-3.5 py-2.5 text-[12.5px] font-medium tracking-[-0.01em] transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "border-[#526171] bg-[linear-gradient(180deg,#29323c_0%,#1d242d_100%)] text-[#f5f7fb] hover:bg-[#222a33]"
          : tone === "danger"
            ? "border-rose-200 bg-[linear-gradient(180deg,#fff7f8_0%,#fdeff1_100%)] text-[#a11d33] hover:bg-[#fde8ec]"
            : "border-[#d7dce4] bg-[linear-gradient(180deg,#ffffff_0%,#f3f5f9_100%)] text-[#2a3340] hover:bg-[#eef2f7]",
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

function DeskKeyValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e7ebf1] py-3 text-[12.5px] last:border-b-0 last:pb-0">
      <span className="text-[#76808c]">{label}</span>
      <span className="max-w-[68%] break-all text-right text-[#1b2430]">
        {value || "n/a"}
      </span>
    </div>
  );
}

function DeskStepRow({
  step,
  active,
  onClick,
}: {
  step: OnboardingStep;
  active: boolean;
  onClick: () => void;
}) {
  const statusLabel =
    step.status === "complete"
      ? "Ready"
      : step.status === "running"
        ? "Active"
        : step.status === "error"
          ? "Blocked"
          : "Waiting";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[16px] border px-3.5 py-3 text-left transition",
        active
          ? "border-[#bfc9d6] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
          : step.status === "error"
            ? "border-rose-200 bg-[#fff7f8]"
            : "border-[#e0e5ec] bg-white/72 hover:bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#171a1f]">
            {step.title}
          </p>
          <p className="mt-1 text-[11.5px] leading-5 text-[#707985]">
            {step.description}
          </p>
          {step.error ? (
            <p className="mt-2 text-[12px] text-[#b42336]">{step.error}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            step.status === "complete"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : step.status === "running"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : step.status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-[#d7dce4] bg-[#f5f7fa] text-[#66707d]",
          )}
        >
          {statusLabel}
        </span>
      </div>
    </button>
  );
}

function StepRow({
  step,
  active,
  onClick,
}: {
  step: OnboardingStep;
  active: boolean;
  onClick: () => void;
}) {
  const icon =
    step.status === "complete" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    ) : step.status === "running" ? (
      <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
    ) : step.status === "error" ? (
      <AlertCircle className="h-5 w-5 text-rose-400" />
    ) : (
      <ChevronRight className="h-5 w-5 text-slate-600" />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[22px] border p-4 text-left transition ${
        active
          ? "border-cyan-500/30 bg-cyan-500/10"
          : step.status === "error"
            ? "border-rose-500/20 bg-rose-500/5"
            : step.status === "complete"
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-white/10 bg-black/20 hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{step.title}</p>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            {step.description}
          </p>
          {step.error ? (
            <p className="mt-2 text-sm text-rose-300">{step.error}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] break-all text-right text-slate-200">
        {value || "n/a"}
      </span>
    </div>
  );
}

function SessionRow({ session }: { session: LocalSession }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">
            {session.channel || session.kind || session.id}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {session.model || "model unknown"} • {session.age || "age unknown"}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            session.active
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-slate-500/20 bg-slate-500/10 text-slate-300"
          }`}
        >
          {session.active ? "active" : "idle"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
        <span>{session.agent || "assistant unknown"}</span>
        <span>{session.tokens || "tokens unavailable"}</span>
      </div>
    </div>
  );
}

export function DesktopOperatorCockpit({
  variant = "home",
}: {
  variant?: CockpitVariant;
}) {
  const { status, refetch, isDesktop } = useDesktopStatus();
  const { currentWindow, openPreferences, updateCurrentWindow } =
    useDesktopWindow();
  const {
    job,
    resetJob,
    runDoctorJob,
    runControlPlaneStartJob,
    runControlPlaneStopJob,
    runRuntimeResyncJob,
    runGovernanceRestartJob,
  } = useDesktopJob();

  const [steps, setSteps] = useState<OnboardingStep[]>(
    STEP_ORDER.map((step, index) => ({
      ...step,
      status: index === 0 ? "running" : "pending",
    })),
  );
  const [currentStep, setCurrentStep] = useState<StepId>("preflight");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastBridgeLogRef = useRef<string | null>(null);
  const lastSetupSnapshotRef = useRef<string | null>(null);
  const [doctorResult, setDoctorResult] = useState<DoctorResult | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("hosted");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [runtimeAction, setRuntimeAction] = useState<RuntimeAction>("install");
  const [assistantName, setAssistantName] = useState("Personal Assistant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [governance, setGovernance] = useState<GovernanceStatus | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [setupState, setSetupState] = useState<WizardState | null>(null);
  const [setupStateError, setSetupStateError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [copiedGateway, setCopiedGateway] = useState(false);
  const [accountReadiness, setAccountReadiness] = useState<AccountReadiness>({
    email: null,
    isEmailVerified: null,
    webhookCount: null,
    loading: false,
    error: null,
  });

  const standalone = variant === "standalone";
  const advancedView = variant === "advanced";

  const currentStepIndex = useMemo(
    () => STEP_ORDER.findIndex((step) => step.id === currentStep),
    [currentStep],
  );

  const runtimeOpenclaw = (runtimeInfo?.openclaw || null) as Record<
    string,
    unknown
  > | null;
  const runtimeLocalControl = runtimeInfo?.local_control_plane || null;
  const runtimeGatewayUrl =
    extractString(runtimeOpenclaw, "gateway_url") ||
    preflight?.openclawGateway ||
    status.openclaw?.gatewayUrl;
  const runtimeBinaryPath =
    extractString(runtimeOpenclaw, "binary_path") || preflight?.openclawBinary;
  const runtimeConfigPath = extractString(runtimeOpenclaw, "config_path");
  const runtimePrivacySummary = extractString(
    runtimeOpenclaw,
    "privacy_summary",
  );
  const runtimeKeysStayLocal = extractBoolean(
    runtimeOpenclaw,
    "keys_remain_local",
  );

  const desktopSeatReady =
    Boolean(status.authenticated) &&
    (Boolean(status.assistant?.found) || isComplete);
  const bridgeIssue =
    !status.bridge.ready &&
    status.bridge.lastError &&
    !/Bridge exited with code:\s*0/i.test(status.bridge.lastError)
      ? status.bridge.lastError
      : null;
  const bridgeTone = status.bridge.ready
    ? "good"
    : status.bridge.state === "starting"
      ? "warn"
      : bridgeIssue
        ? "danger"
        : "neutral";
  const bridgeLabel = status.bridge.ready
    ? "Bridge Ready"
    : status.bridge.state === "starting"
      ? "Bridge Restarting"
      : bridgeIssue
        ? "Bridge Degraded"
        : "Bridge Idle";
  const environmentTone = bridgeIssue
    ? "danger"
    : !preflight
      ? "neutral"
      : !preflight.cliAvailable
        ? "danger"
        : preflight.openclawHealth === "healthy"
          ? "good"
          : "warn";
  const setupProgress = computeWizardProgress(setupState);
  const setupStateStatus = setupState?.status?.toLowerCase() || "idle";
  const setupStateActive =
    loading ||
    ["running", "pending", "starting", "in_progress"].includes(
      setupStateStatus,
    );
  const setupStateFailed = ["failed", "error"].includes(setupStateStatus);

  function addLog(message: string) {
    setLogs((prev) => [
      ...prev.slice(-119),
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  }

  function setStepState(
    id: StepId,
    nextStatus: StepStatus,
    stepError?: string,
  ) {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id
          ? { ...step, status: nextStatus, error: stepError }
          : step,
      ),
    );
  }

  function goToStep(id: StepId) {
    setCurrentStep(id);
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id && step.status === "pending"
          ? { ...step, status: "running" }
          : step,
      ),
    );
  }

  function completeStep(id: StepId) {
    setStepState(id, "complete");
  }

  const loadSnapshot = useCallback(async () => {
    if (!window.mutxDesktop?.isDesktop) {
      return;
    }

    setSnapshotLoading(true);
    setSnapshotError(null);

    try {
      const [governanceData, runtimeData, sessionData] = await Promise.all([
        window.mutxDesktop.bridge.governance.status(),
        window.mutxDesktop.bridge.runtime.inspect(),
        window.mutxDesktop.bridge.assistant.sessions(),
      ]);

      setGovernance(governanceData);
      setRuntimeInfo(runtimeData);
      setSessions(sessionData);
    } catch (snapshotErrorValue) {
      setSnapshotError(
        snapshotErrorValue instanceof Error
          ? snapshotErrorValue.message
          : "Failed to load runtime snapshot",
      );
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  const loadSetupState = useCallback(async () => {
    if (!window.mutxDesktop?.isDesktop) {
      return;
    }

    try {
      const nextSetupState = await window.mutxDesktop.bridge.setup.getState();
      setSetupState(normalizeWizardState(nextSetupState));
      setSetupStateError(null);
    } catch (setupErrorValue) {
      setSetupStateError(
        setupErrorValue instanceof Error
          ? setupErrorValue.message
          : "Failed to load the live setup state",
      );
    }
  }, []);

  const loadAccountReadiness = useCallback(async () => {
    if (!status.authenticated) {
      setAccountReadiness({
        email: null,
        isEmailVerified: null,
        webhookCount: null,
        loading: false,
        error: null,
      });
      return;
    }

    setAccountReadiness((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [meResponse, webhooksResponse] = await Promise.all([
        fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/webhooks", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const mePayload = await meResponse.json().catch(() => null);
      const webhookPayload = await webhooksResponse.json().catch(() => null);

      if (!meResponse.ok) {
        throw new Error(
          typeof mePayload?.detail === "string"
            ? mePayload.detail
            : "Failed to load account state",
        );
      }

      const rawWebhooks = Array.isArray(webhookPayload)
        ? webhookPayload
        : Array.isArray(webhookPayload?.webhooks)
          ? webhookPayload.webhooks
          : [];

      setAccountReadiness({
        email: typeof mePayload?.email === "string" ? mePayload.email : null,
        isEmailVerified:
          typeof mePayload?.is_email_verified === "boolean"
            ? mePayload.is_email_verified
            : null,
        webhookCount: rawWebhooks.length,
        loading: false,
        error: null,
      });
    } catch (accountError) {
      setAccountReadiness({
        email: null,
        isEmailVerified: null,
        webhookCount: null,
        loading: false,
        error:
          accountError instanceof Error
            ? accountError.message
            : "Failed to load account readiness",
      });
    }
  }, [status.authenticated]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    if (window.mutxDesktop) {
      void window.mutxDesktop
        .getRuntimeContext()
        .then((context) => {
          if (context.mode === "local" || context.mode === "hosted") {
            setRuntimeMode(context.mode);
          }
        })
        .catch(() => undefined);
    }

    void Promise.all([loadSnapshot(), loadSetupState()]);
  }, [isDesktop, loadSetupState, loadSnapshot]);

  useEffect(() => {
    if (!isDesktop || !setupStateActive) {
      return;
    }

    void loadSetupState();
    const timer = window.setInterval(() => {
      void loadSetupState();
    }, 1500);

    return () => window.clearInterval(timer);
  }, [isDesktop, loadSetupState, setupStateActive]);

  useEffect(() => {
    if (!isDesktop || preflight || !status.lastUpdated) {
      return;
    }

    void runPreflight();
  }, [isDesktop, preflight, status.lastUpdated, runtimeInfo, governance]);

  useEffect(() => {
    if (job.status === "completed") {
      void loadSnapshot();
      void loadSetupState();
      void refetch();
    }
  }, [job.status, loadSetupState, loadSnapshot, refetch]);

  useEffect(() => {
    void loadAccountReadiness();
  }, [loadAccountReadiness]);

  useEffect(() => {
    if (!preflight) {
      return;
    }

    completeStep("preflight");
    completeStep("mode");

    if (status.authenticated || preflight.authenticated) {
      completeStep("auth");
    }

    if (preflight.openclawBinary) {
      completeStep("runtime");
    }

    if (status.assistant?.found || isComplete) {
      completeStep("assistant");
      completeStep("verify");
      setIsComplete(true);
      setCurrentStep("verify");
      return;
    }

    if (!(status.authenticated || preflight.authenticated)) {
      setCurrentStep("auth");
      return;
    }

    if (!preflight.openclawBinary) {
      setCurrentStep("runtime");
      return;
    }

    setCurrentStep("assistant");
  }, [preflight, status.authenticated, status.assistant?.found, isComplete]);

  useEffect(() => {
    if (bridgeIssue && bridgeIssue !== lastBridgeLogRef.current) {
      lastBridgeLogRef.current = bridgeIssue;
      addLog(`Bridge degraded: ${bridgeIssue}`);
    }
  }, [bridgeIssue]);

  useEffect(() => {
    if (!setupState) {
      return;
    }

    const snapshotKey = [
      setupState.status,
      setupState.current_step,
      setupState.failed_step || "",
      setupState.last_error || "",
      (setupState.completed_steps || []).join(","),
    ].join("|");

    if (snapshotKey === lastSetupSnapshotRef.current) {
      return;
    }

    lastSetupSnapshotRef.current = snapshotKey;

    if (setupStateFailed) {
      addLog(
        `Setup state: ${setupState.current_step || setupState.failed_step || "unknown"} failed${
          setupState.last_error ? ` · ${setupState.last_error}` : ""
        }`,
      );
      return;
    }

    if (setupStateActive) {
      addLog(
        `Setup state: ${setupState.current_step || "running"} (${setupState.completed_steps.length}/${setupState.steps.length} complete)`,
      );
      return;
    }

    if (setupStateStatus === "complete" || setupStateStatus === "completed") {
      addLog("Setup state: wizard completed");
    }
  }, [setupState, setupStateActive, setupStateFailed, setupStateStatus]);

  async function runPreflight() {
    setError(null);
    setStepState("preflight", "running");
    addLog("Inspecting desktop environment...");

    try {
      const runtimeOpenclaw =
        runtimeInfo?.openclaw && typeof runtimeInfo.openclaw === "object"
          ? (runtimeInfo.openclaw as Record<string, unknown>)
          : null;
      const runtimeGateway = extractRecord(runtimeOpenclaw, "gateway");
      const nextPreflight: PreflightResult = {
        cliAvailable: status.cliAvailable,
        mutxVersion: status.mutxVersion,
        apiUrl: status.apiUrl,
        apiUrlSource: status.apiUrl ? "desktop status" : null,
        configPath: extractString(runtimeOpenclaw, "config_path"),
        mutxHome: extractString(runtimeOpenclaw, "home_path"),
        authenticated: status.authenticated,
        openclawBinary:
          status.openclaw.binaryPath ||
          extractString(runtimeOpenclaw, "binary_path"),
        openclawHealth:
          status.openclaw.health ||
          extractString(runtimeGateway, "status") ||
          "unknown",
        openclawGateway:
          status.openclaw.gatewayUrl ||
          extractString(runtimeGateway, "gateway_url"),
        openclawSummary: extractString(runtimeGateway, "doctor_summary"),
        farameshAvailable: status.faramesh.available || Boolean(governance),
        farameshSummary: null,
        localCpReady: Boolean(status.localControlPlane.ready),
        localCpPath:
          status.localControlPlane.path || runtimeLocalControl?.path || null,
      };

      setPreflight(nextPreflight);
      setRuntimeAction(nextPreflight.openclawBinary ? "import" : "install");
      addLog(
        `Bridge ${status.bridge.pythonCommand ? `using ${status.bridge.pythonCommand}` : "responded successfully"}`,
      );
      addLog(`MUTX ${nextPreflight.mutxVersion || "unknown"} detected`);
      addLog(
        `API target: ${nextPreflight.apiUrl || "unknown"} (${nextPreflight.apiUrlSource || "source unknown"})`,
      );
      addLog(`OpenClaw health: ${nextPreflight.openclawHealth}`);
      addLog(
        `Faramesh: ${nextPreflight.farameshAvailable ? "running" : "not running"}`,
      );

      completeStep("preflight");
      if (!(status.authenticated || nextPreflight.authenticated)) {
        goToStep("auth");
      } else if (!nextPreflight.openclawBinary) {
        goToStep("runtime");
      } else if (!status.assistant?.found) {
        goToStep("assistant");
      } else {
        goToStep("verify");
      }
    } catch (preflightError) {
      const message =
        preflightError instanceof Error
          ? preflightError.message
          : "Preflight failed";
      setError(message);
      addLog(`Preflight failed: ${message}`);
      setStepState("preflight", "error", message);
      setCurrentStep("preflight");
    }
  }

  async function runDoctor() {
    setLoading(true);
    setError(null);
    addLog("Running desktop diagnostics...");

    try {
      const result = (await runDoctorJob()) as DoctorResult;
      setDoctorResult(result);
      addLog(
        `Doctor: API ${result.api_health}, gateway ${result.openclaw?.status || "unknown"}`,
      );
    } catch (doctorError) {
      const message =
        doctorError instanceof Error
          ? doctorError.message
          : "Diagnostics failed";
      setError(message);
      addLog(`Doctor failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function openTerminal() {
    try {
      const cwd =
        status.assistant?.workspace ||
        runtimeLocalControl?.path ||
        preflight?.localCpPath ||
        preflight?.mutxHome ||
        undefined;
      const result = await window.mutxDesktop!.bridge.system.openTerminal(cwd);
      if (!result.success) {
        throw new Error("Could not open terminal");
      }
      addLog(`Opened Terminal${result.cwd ? ` at ${result.cwd}` : ""}`);
    } catch (terminalError) {
      const message =
        terminalError instanceof Error
          ? terminalError.message
          : "Could not open Terminal";
      setError(message);
      addLog(`Terminal launch failed: ${message}`);
    }
  }

  async function chooseMode(mode: RuntimeMode) {
    setLoading(true);
    setError(null);
    setRuntimeMode(mode);
    setStepState("mode", "running");

    try {
      const apiUrl = mode === "local" ? LOCAL_API_URL : HOSTED_API_URL;
      await window.mutxDesktop!.setRuntimeContext({ mode, apiUrl });
      addLog(`Desktop API context set to ${apiUrl}`);

      if (mode === "local" && !preflight?.localCpReady) {
        addLog("Starting the local control plane...");
        const result = await window.mutxDesktop!.bridge.controlPlane.start();
        if (!result.success) {
          throw new Error(
            result.error || "Failed to start local control plane",
          );
        }
        addLog("Local control plane is ready");
      }

      completeStep("mode");
      await refetch();
      if (status.authenticated || preflight?.authenticated) {
        goToStep(preflight?.openclawBinary ? "assistant" : "runtime");
      } else {
        goToStep("auth");
      }
    } catch (modeError) {
      const message =
        modeError instanceof Error
          ? modeError.message
          : "Could not select mode";
      setError(message);
      addLog(`Mode selection failed: ${message}`);
      setStepState("mode", "error", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth() {
    setLoading(true);
    setError(null);
    setStepState("auth", "running");

    try {
      const apiUrl = runtimeMode === "local" ? LOCAL_API_URL : HOSTED_API_URL;
      let payload: Record<string, unknown>;

      if (authMode === "local") {
        if (runtimeMode !== "local") {
          throw new Error("Local bootstrap is only available in local mode");
        }
        if (!name.trim()) {
          throw new Error("Name is required for local bootstrap");
        }
        addLog(`Creating local operator ${name}...`);
        payload = await postJson("/api/auth/local-bootstrap", { name });
      } else if (authMode === "register") {
        if (!name.trim()) {
          throw new Error("Name is required for registration");
        }
        if (!email.trim() || !password) {
          throw new Error("Email and password are required");
        }
        addLog(`Registering ${email}...`);
        payload = await postJson("/api/auth/register", {
          name,
          email,
          password,
        });
      } else {
        if (!email.trim() || !password) {
          throw new Error("Email and password are required");
        }
        addLog(`Logging in as ${email}...`);
        payload = await postJson("/api/auth/login", { email, password });
      }

      const accessToken =
        typeof payload.access_token === "string" ? payload.access_token : null;
      const refreshToken =
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : undefined;
      const requiresEmailVerification =
        payload.requires_email_verification === true;

      if (authMode === "register" && requiresEmailVerification) {
        const verificationMessage = `Verification email sent to ${email}. Confirm it before syncing desktop auth.`;
        setError(verificationMessage);
        addLog(verificationMessage);
        setStepState(
          "auth",
          "error",
          "Email verification required before desktop sync",
        );
        return;
      }

      if (!accessToken) {
        throw new Error(
          "Authentication succeeded but no access token was returned",
        );
      }

      await window.mutxDesktop!.bridge.auth.storeTokens(
        accessToken,
        refreshToken,
        apiUrl,
      );
      addLog("Browser session and CLI auth are synced");

      completeStep("auth");
      await refetch();
      goToStep(preflight?.openclawBinary ? "assistant" : "runtime");
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Authentication failed";
      setError(message);
      addLog(`Authentication failed: ${message}`);
      setStepState("auth", "error", message);
    } finally {
      setLoading(false);
    }
  }

  async function openHostedAuthSurface(mode: Exclude<AuthMode, "local">) {
    if (typeof window === "undefined") {
      return;
    }

    const targetUrl = new URL(`/${mode}`, window.location.origin);
    targetUrl.searchParams.set("next", "/dashboard");

    if (email.trim()) {
      targetUrl.searchParams.set("email", email.trim());
    }

    try {
      if (window.mutxDesktop?.openExternal) {
        await window.mutxDesktop.openExternal(targetUrl.toString());
      } else {
        window.open(targetUrl.toString(), "_blank", "noopener,noreferrer");
      }

      addLog(`Opened hosted ${mode} flow in the browser`);
    } catch (openError) {
      const message =
        openError instanceof Error
          ? openError.message
          : "Could not open the hosted auth surface";
      setError(message);
      addLog(`Hosted auth launch failed: ${message}`);
    }
  }

  async function openTui() {
    setLoading(true);

    try {
      setRuntimeAction("tui");
      addLog("Opening OpenClaw surface in Terminal...");
      const result =
        await window.mutxDesktop!.bridge.runtime.openSurface("tui");
      if (!result.success) {
        throw new Error(result.error || "Could not open OpenClaw TUI");
      }
      addLog("OpenClaw TUI opened");
    } catch (tuiError) {
      const message =
        tuiError instanceof Error ? tuiError.message : "Could not open TUI";
      setError(message);
      addLog(`TUI launch failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function openRuntimeConfig() {
    try {
      const result =
        await window.mutxDesktop!.bridge.runtime.openSurface("configure");
      if (!result.success) {
        throw new Error(result.error || "Could not open runtime configuration");
      }
      addLog("Opened runtime configuration surface");
    } catch (configError) {
      const message =
        configError instanceof Error
          ? configError.message
          : "Runtime config failed";
      setError(message);
      addLog(`Runtime config launch failed: ${message}`);
    }
  }

  async function openSettingsPane(pane: "runtime" | "advanced") {
    if (!window.mutxDesktop?.isDesktop) {
      return;
    }

    await openPreferences(pane);
    addLog(`Opened ${pane} preferences`);
  }

  async function continueRuntime() {
    completeStep("runtime");
    goToStep("assistant");
  }

  async function deployAssistant() {
    setLoading(true);
    setError(null);
    setStepState("assistant", "running");

    try {
      addLog(`Running MUTX setup for ${assistantName}...`);
      await loadSetupState();
      const result = await window.mutxDesktop!.bridge.setup.start(
        runtimeMode,
        assistantName,
        runtimeAction,
        "npm",
      );

      if (!result.success) {
        throw new Error(result.error || "Setup failed");
      }

      if (result.assistant_id) {
        addLog(`Assistant ready: ${result.assistant_id}`);
      }
      if (result.workspace) {
        addLog(`Workspace: ${result.workspace}`);
      }

      await loadSetupState();

      completeStep("assistant");
      completeStep("verify");
      setCurrentStep("verify");
      setIsComplete(true);
      addLog("Desktop seat is ready. Control surface can be launched.");
      await loadSnapshot();
      await refetch();
    } catch (setupError) {
      const message =
        setupError instanceof Error
          ? setupError.message
          : "Could not deploy assistant";
      setError(message);
      addLog(`Setup failed: ${message}`);
      await loadSetupState();
      setStepState("assistant", "error", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealWorkspace() {
    if (!status.assistant?.workspace) {
      return;
    }

    try {
      const result = await window.mutxDesktop!.bridge.system.revealInFinder(
        status.assistant.workspace,
      );
      if (!result.success) {
        throw new Error(result.error || "Could not reveal workspace");
      }
      addLog(`Revealed workspace ${status.assistant.workspace}`);
    } catch (workspaceError) {
      const message =
        workspaceError instanceof Error
          ? workspaceError.message
          : "Workspace reveal failed";
      setError(message);
      addLog(`Workspace reveal failed: ${message}`);
    }
  }

  async function handleRevealPolicy() {
    try {
      const result =
        await window.mutxDesktop!.bridge.system.revealInFinder(
          "~/.mutx/policies",
        );
      if (!result.success) {
        throw new Error(result.error || "Could not reveal policy directory");
      }
      addLog("Opened policy directory in Finder");
    } catch (policyError) {
      const message =
        policyError instanceof Error
          ? policyError.message
          : "Policy reveal failed";
      setError(message);
      addLog(`Policy reveal failed: ${message}`);
    }
  }

  async function handleCopyGateway() {
    if (!runtimeGatewayUrl) {
      return;
    }
    await navigator.clipboard.writeText(runtimeGatewayUrl);
    setCopiedGateway(true);
    addLog(`Copied gateway URL ${runtimeGatewayUrl}`);
    window.setTimeout(() => setCopiedGateway(false), 1500);
  }

  async function handleRuntimeResync() {
    try {
      await runRuntimeResyncJob();
      addLog("Runtime state resynced");
    } catch (resyncError) {
      const message =
        resyncError instanceof Error
          ? resyncError.message
          : "Runtime resync failed";
      setError(message);
      addLog(`Runtime resync failed: ${message}`);
    }
  }

  async function handleGovernanceRestart() {
    try {
      await runGovernanceRestartJob();
      addLog("Governance daemon restarted");
    } catch (governanceError) {
      const message =
        governanceError instanceof Error
          ? governanceError.message
          : "Governance restart failed";
      setError(message);
      addLog(`Governance restart failed: ${message}`);
    }
  }

  async function handleControlPlaneToggle() {
    try {
      if (status.localControlPlane?.ready) {
        await runControlPlaneStopJob();
        addLog("Local control plane stopped");
      } else {
        await runControlPlaneStartJob();
        addLog("Local control plane started");
      }
    } catch (controlPlaneError) {
      const message =
        controlPlaneError instanceof Error
          ? controlPlaneError.message
          : "Control plane action failed";
      setError(message);
      addLog(`Control plane action failed: ${message}`);
    }
  }

  function navigate(route: string) {
    if (!window.mutxDesktop?.isDesktop) {
      window.location.href = route;
      return;
    }

    void (async () => {
      if (route === "/dashboard/control") {
        await openPreferences("advanced");
        return;
      }

      const nextPayload =
        route === "/dashboard"
          ? {
              ...currentWindow.currentWindow.payload,
              pane: "overview",
            }
          : currentWindow.currentWindow.payload;

      await updateCurrentWindow({
        route,
        payload: nextPayload,
      });
    })();
  }

  function launchDashboard() {
    navigate("/dashboard");
  }

  function launchAdvancedControl() {
    navigate("/dashboard/control");
  }

  function renderPreflightPanel() {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <SignalTile
            label="CLI"
            value={preflight?.cliAvailable ? "Available" : "Missing"}
            detail={
              preflight?.configPath ||
              "Bridge-backed CLI config not detected yet."
            }
            tone={preflight?.cliAvailable ? "good" : "danger"}
          />
          <SignalTile
            label="Bridge"
            value={status.bridge.ready ? "Ready" : "Degraded"}
            detail={
              status.bridge.lastError ||
              status.bridge.pythonCommand ||
              "Python bridge has not reported its interpreter path yet."
            }
            tone={status.bridge.ready ? "good" : "danger"}
          />
          <SignalTile
            label="OpenClaw"
            value={
              preflight?.openclawBinary
                ? preflight.openclawHealth
                : "Not installed"
            }
            detail={
              preflight?.openclawSummary ||
              preflight?.openclawBinary ||
              "No local runtime detected."
            }
            tone={
              !preflight?.openclawBinary
                ? "warn"
                : preflight.openclawHealth === "healthy"
                  ? "good"
                  : "warn"
            }
          />
          <SignalTile
            label="Governance"
            value={preflight?.farameshAvailable ? "Active" : "Idle"}
            detail={
              preflight?.farameshSummary ||
              "Faramesh daemon status unavailable."
            }
            tone={preflight?.farameshAvailable ? "good" : "warn"}
          />
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
          <DetailRow label="MUTX version" value={preflight?.mutxVersion} />
          <DetailRow label="API target" value={preflight?.apiUrl} />
          <DetailRow label="API source" value={preflight?.apiUrlSource} />
          <DetailRow label="Gateway URL" value={preflight?.openclawGateway} />
          <DetailRow
            label="Python command"
            value={status.bridge.pythonCommand}
          />
          <DetailRow label="Bridge script" value={status.bridge.scriptPath} />
        </div>
      </div>
    );
  }

  function renderModePanel() {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => void chooseMode("hosted")}
          disabled={loading}
          className={`rounded-[24px] border p-5 text-left transition ${
            runtimeMode === "hosted"
              ? "border-cyan-500/30 bg-cyan-500/10"
              : "border-white/10 bg-black/20 hover:bg-white/5"
          }`}
        >
          <Globe className="h-8 w-8 text-cyan-300" />
          <p className="mt-4 text-lg font-semibold text-white">Hosted</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use the managed MUTX control plane at{" "}
            <span className="text-slate-200">{HOSTED_API_URL}</span>.
          </p>
        </button>

        <button
          type="button"
          onClick={() => void chooseMode("local")}
          disabled={loading}
          className={`rounded-[24px] border p-5 text-left transition ${
            runtimeMode === "local"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-white/10 bg-black/20 hover:bg-white/5"
          }`}
        >
          <Server className="h-8 w-8 text-emerald-300" />
          <p className="mt-4 text-lg font-semibold text-white">Local</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Drive a local stack on{" "}
            <span className="text-slate-200">{LOCAL_API_URL}</span> and
            bootstrap the control plane if needed.
          </p>
        </button>
      </div>
    );
  }

  function renderAuthPanel() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(["login", "register", "local"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAuthMode(mode)}
              className={`rounded-2xl border px-3 py-3 text-sm font-medium ${
                authMode === mode
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {mode === "login"
                ? "Login"
                : mode === "register"
                  ? "Register"
                  : "Local Bootstrap"}
            </button>
          ))}
        </div>

        {(authMode === "register" || authMode === "local") && (
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Operator name"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
          />
        )}

        {authMode !== "local" && (
          <>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
            />
          </>
        )}

        <ActionButton
          label={
            authMode === "login"
              ? "Sync Login"
              : authMode === "register"
                ? "Create Operator"
                : "Create Local Operator"
          }
          onClick={() => void handleAuth()}
          icon={Shield}
          loading={loading}
          tone="primary"
        />

        {authMode !== "local" ? (
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Hosted provider auth
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Google, GitHub, Discord, and the real email confirmation flow now
              live on the hosted auth pages. Use that lane when you need
              provider signup or inbox verification on the Railway deployment,
              then return here to sync the desktop bridge with password auth.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton
                label={
                  authMode === "register"
                    ? "Open Hosted Sign Up"
                    : "Open Hosted Sign In"
                }
                onClick={() =>
                  void openHostedAuthSurface(
                    authMode === "register" ? "register" : "login",
                  )
                }
                icon={ArrowUpRight}
              />
              <ActionButton
                label={
                  authMode === "register"
                    ? "Open Hosted Sign In"
                    : "Open Hosted Sign Up"
                }
                onClick={() =>
                  void openHostedAuthSurface(
                    authMode === "register" ? "login" : "register",
                  )
                }
                icon={Globe}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderRuntimePanel() {
    return (
      <div className="space-y-4">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setRuntimeAction("import")}
            className={`rounded-[22px] border p-4 text-left ${
              runtimeAction === "import"
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-white/10 bg-black/20 hover:bg-white/5"
            }`}
          >
            <FolderOpen className="h-7 w-7 text-amber-300" />
            <p className="mt-3 text-base font-semibold text-white">
              Import existing runtime
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Adopt the local OpenClaw installation without relocating it.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRuntimeAction("install")}
            className={`rounded-[22px] border p-4 text-left ${
              runtimeAction === "install"
                ? "border-cyan-500/30 bg-cyan-500/10"
                : "border-white/10 bg-black/20 hover:bg-white/5"
            }`}
          >
            <Wrench className="h-7 w-7 text-cyan-300" />
            <p className="mt-3 text-base font-semibold text-white">
              Install or repair runtime
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Let MUTX reconcile the local runtime into a sane state.
            </p>
          </button>

          <button
            type="button"
            onClick={() => void openTui()}
            className={`rounded-[22px] border p-4 text-left ${
              runtimeAction === "tui"
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-black/20 hover:bg-white/5"
            }`}
          >
            <Terminal className="h-7 w-7 text-slate-200" />
            <p className="mt-3 text-base font-semibold text-white">
              Inspect via TUI first
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Open the runtime surface in Terminal before letting setup
              continue.
            </p>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            label="Lock Runtime Choice"
            onClick={() => void continueRuntime()}
            icon={ArrowRight}
            tone="primary"
          />
          <ActionButton
            label="Configure Runtime"
            onClick={() => void openRuntimeConfig()}
            icon={Settings2}
          />
          <ActionButton
            label={
              status.localControlPlane?.ready
                ? "Stop Local Stack"
                : "Start Local Stack"
            }
            onClick={() => void handleControlPlaneToggle()}
            icon={status.localControlPlane?.ready ? Square : Play}
            loading={
              (job.id === "controlPlaneStart" ||
                job.id === "controlPlaneStop") &&
              job.status === "running"
            }
            tone={status.localControlPlane?.ready ? "danger" : "default"}
          />
        </div>
      </div>
    );
  }

  function renderAssistantPanel() {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={assistantName}
          onChange={(event) => setAssistantName(event.target.value)}
          placeholder="Assistant name"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
        />

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">
            This runs the real desktop setup wizard through the Python bridge.
            It is the point where MUTX actually binds a workspace and assistant,
            not just a cosmetic step.
          </p>
        </div>

        {setupState ? (
          <div
            className={cn(
              "rounded-[22px] border p-4",
              setupStateFailed
                ? "border-rose-500/25 bg-rose-500/10"
                : setupStateActive
                  ? "border-cyan-500/25 bg-cyan-500/10"
                  : "border-white/10 bg-black/20",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Live wizard state
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {setupState.current_step ||
                    setupState.failed_step ||
                    "waiting"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {setupState.last_error ||
                    `Provider ${setupState.provider || "unknown"} · ${setupState.completed_steps.length}/${setupState.steps.length} steps complete.`}
                </p>
              </div>
              <StatusPill
                label={setupState.status || "idle"}
                tone={
                  setupStateFailed
                    ? "danger"
                    : setupStateActive
                      ? "warn"
                      : "neutral"
                }
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-full border border-white/10 bg-black/30">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  setupStateFailed
                    ? "bg-rose-400"
                    : setupStateActive
                      ? "bg-cyan-300"
                      : "bg-emerald-300",
                )}
                style={{ width: `${Math.max(setupProgress, 6)}%` }}
              />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {setupState.steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-[16px] border px-3 py-2.5 text-sm",
                    step.completed
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                      : setupState.current_step === step.id
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : setupState.failed_step === step.id
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                          : "border-white/10 bg-black/20 text-slate-400",
                  )}
                >
                  {step.title}
                </div>
              ))}
            </div>
            {setupStateError ? (
              <p className="mt-4 text-sm text-amber-200">{setupStateError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <ActionButton
            label={
              setupStateFailed
                ? "Retry Real Setup"
                : setupStateActive
                  ? "Continue Setup"
                  : "Run Real Setup"
            }
            onClick={() => void deployAssistant()}
            icon={Sparkles}
            loading={loading}
            disabled={!assistantName.trim()}
            tone="primary"
          />
          <ActionButton
            label="Refresh Setup State"
            onClick={() => void loadSetupState()}
            icon={RefreshCw}
          />
          <ActionButton
            label="Runtime Preferences"
            onClick={() => void openSettingsPane("runtime")}
            icon={Settings2}
          />
          <ActionButton
            label="Advanced Recovery"
            onClick={() => void openSettingsPane("advanced")}
            icon={Wrench}
          />
        </div>
      </div>
    );
  }

  function renderVerifyPanel() {
    const readyLabel = standalone
      ? "Launch Dashboard"
      : advancedView
        ? "Return Home"
        : "Open Advanced Control";
    const readyAction = standalone
      ? launchDashboard
      : advancedView
        ? () => navigate("/dashboard")
        : launchAdvancedControl;

    return (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm leading-6 text-emerald-100">
            The desktop seat has enough state to move into steady-state
            operation. You can stay here for recovery and setup, or shift into
            the advanced control view.
          </p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow
              label="Hosted identity"
              value={accountReadiness.email || status.user?.email}
            />
            <DetailRow
              label="Email verification"
              value={
                accountReadiness.loading
                  ? "checking"
                  : accountReadiness.isEmailVerified === true
                    ? "verified"
                    : accountReadiness.isEmailVerified === false
                      ? "pending"
                      : "unknown"
              }
            />
            <DetailRow
              label="Webhook routes"
              value={
                accountReadiness.loading
                  ? "loading"
                  : accountReadiness.webhookCount != null
                    ? `${accountReadiness.webhookCount} configured`
                    : "unknown"
              }
            />
            <DetailRow
              label="Readiness notes"
              value={
                accountReadiness.error ||
                "Identity and webhook state are loaded from the live hosted APIs."
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            label={readyLabel}
            onClick={readyAction}
            icon={ArrowRight}
            tone="primary"
          />
          <ActionButton
            label="Open Webhooks"
            onClick={() => navigate("/dashboard/webhooks")}
            icon={Workflow}
          />
          <ActionButton
            label="Open Terminal"
            onClick={() => void openTerminal()}
            icon={Terminal}
          />
          <ActionButton
            label="Reveal Workspace"
            onClick={() => void handleRevealWorkspace()}
            icon={FolderOpen}
            disabled={!status.assistant?.workspace}
          />
        </div>
      </div>
    );
  }

  function renderCurrentPanel() {
    if (!isDesktop) {
      return (
        <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          This surface only makes sense inside MUTX.app.
        </div>
      );
    }

    switch (currentStep) {
      case "preflight":
        return renderPreflightPanel();
      case "mode":
        return renderModePanel();
      case "auth":
        return renderAuthPanel();
      case "runtime":
        return renderRuntimePanel();
      case "assistant":
        return renderAssistantPanel();
      case "verify":
        return renderVerifyPanel();
      default:
        return null;
    }
  }

  if (!isDesktop) {
    return standalone ? (
      <div className="min-h-screen bg-[linear-gradient(180deg,#04070d_0%,#09111d_55%,#050910_100%)]">
        <DesktopRouteListener />
        <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
          <SurfaceCard
            title="Desktop mode required"
            eyebrow="MUTX.app"
            tone="warn"
          >
            <p className="text-sm leading-7 text-slate-300">
              The native operator cockpit depends on the Electron bridge. Open
              this route inside MUTX.app to use runtime inspection, local stack
              control, governance, and setup actions.
            </p>
          </SurfaceCard>
        </main>
      </div>
    ) : null;
  }

  if (!standalone) {
    return (
      <div className="grid gap-4 min-[1360px]:grid-cols-[minmax(220px,0.5fr)_minmax(0,1.14fr)] min-[1600px]:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)_minmax(280px,0.62fr)]">
        <div className="space-y-4">
          <DeskPanel title="Operator Rail" meta="Setup and recovery">
            <div className="space-y-2.5">
              {steps.map((step, index) => (
                <DeskStepRow
                  key={step.id}
                  step={step}
                  active={index === currentStepIndex}
                  onClick={() => setCurrentStep(step.id)}
                />
              ))}
            </div>
          </DeskPanel>

          <DeskPanel
            title="Machine Brief"
            meta="Live state"
            tone={
              environmentTone === "danger"
                ? "danger"
                : environmentTone === "warn"
                  ? "warning"
                  : "default"
            }
          >
            <div className="space-y-1">
              <DeskKeyValue
                label="MUTX version"
                value={preflight?.mutxVersion || status.mutxVersion}
              />
              <DeskKeyValue label="CLI config" value={preflight?.configPath} />
              <DeskKeyValue label="MUTX home" value={preflight?.mutxHome} />
              <DeskKeyValue
                label="API target"
                value={preflight?.apiUrl || status.apiUrl}
              />
              <DeskKeyValue label="Gateway URL" value={runtimeGatewayUrl} />
              <DeskKeyValue
                label="Local control path"
                value={
                  runtimeLocalControl?.path ||
                  preflight?.localCpPath ||
                  status.localControlPlane?.path
                }
              />
              <DeskKeyValue
                label="Python command"
                value={status.bridge.pythonCommand}
              />
              <DeskKeyValue
                label="Bridge script"
                value={status.bridge.scriptPath}
              />
            </div>
          </DeskPanel>
        </div>

        <div className="space-y-4">
          <DeskPanel
            title={
              advancedView ? "Advanced Operator Control" : "Mission Control"
            }
            meta={
              advancedView ? "Native control surface" : "Desktop operator seat"
            }
            className="min-h-[320px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d7dce4] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6a76]">
                {advancedView ? "Advanced Control" : "Native Workspace"}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                  status.authenticated
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {status.authenticated ? "Session Synced" : "Session Pending"}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                  bridgeTone === "good"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : bridgeTone === "warn"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : bridgeTone === "danger"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-[#d7dce4] bg-[#f5f7fa] text-[#66707d]",
                )}
              >
                {bridgeLabel}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                  status.faramesh?.available
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#d7dce4] bg-[#f5f7fa] text-[#66707d]",
                )}
              >
                {status.faramesh?.available
                  ? "Governance Active"
                  : "Governance Idle"}
              </span>
            </div>

            <div className="mt-4 grid gap-5 min-[1560px]:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
              <div className="min-w-0">
                <h1 className="text-[1.55rem] font-semibold tracking-[-0.055em] text-[#171a1f] min-[1800px]:text-[1.75rem]">
                  {advancedView
                    ? "Operate the machine directly, without falling back to a browser mirror."
                    : "Use the whole window like an operator desk, not a web dashboard."}
                </h1>
                <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#66707d]">
                  The desktop shell now keeps setup, recovery, runtime control,
                  and local diagnostics in one native workspace. The summary,
                  active setup lane, and machine-side inspector stay visible
                  together so the window feels useful when it expands.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <DeskActionButton
                    label="Refresh Environment"
                    onClick={() => void runPreflight()}
                    icon={RefreshCw}
                    loading={loading && currentStep === "preflight"}
                  />
                  <DeskActionButton
                    label="Run Doctor"
                    onClick={() => void runDoctor()}
                    icon={Radar}
                    loading={job.id === "doctor" && job.status === "running"}
                  />
                  <DeskActionButton
                    label="Open Terminal"
                    onClick={() => void openTerminal()}
                    icon={Terminal}
                  />
                  <DeskActionButton
                    label="Open TUI"
                    onClick={() => void openTui()}
                    icon={TerminalSquare}
                  />
                  <DeskActionButton
                    label={
                      status.localControlPlane?.ready
                        ? "Stop Local Stack"
                        : "Start Local Stack"
                    }
                    onClick={() => void handleControlPlaneToggle()}
                    icon={status.localControlPlane?.ready ? Square : Play}
                    loading={
                      (job.id === "controlPlaneStart" ||
                        job.id === "controlPlaneStop") &&
                      job.status === "running"
                    }
                    tone={
                      status.localControlPlane?.ready ? "danger" : "default"
                    }
                  />
                  {!advancedView ? (
                    <DeskActionButton
                      label="Open Advanced Control"
                      onClick={launchAdvancedControl}
                      icon={ArrowRight}
                      tone="primary"
                    />
                  ) : (
                    <DeskActionButton
                      label="Return Home"
                      onClick={() => navigate("/dashboard")}
                      icon={ArrowRight}
                      tone="primary"
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(145px,1fr))] self-start">
                <DeskMetric
                  label="Environment"
                  value={
                    !preflight
                      ? "Inspecting"
                      : preflight.cliAvailable
                        ? "Reachable"
                        : "Broken"
                  }
                  detail={
                    !preflight
                      ? "Bridge preflight is still running."
                      : preflight.configPath
                  }
                  tone={environmentTone}
                />
                <DeskMetric
                  label="Bridge"
                  value={
                    status.bridge.ready
                      ? "Ready"
                      : status.bridge.state === "starting"
                        ? "Restarting"
                        : bridgeIssue
                          ? "Degraded"
                          : "Idle"
                  }
                  detail={
                    bridgeIssue ||
                    status.bridge.pythonCommand ||
                    "Interpreter unresolved"
                  }
                  tone={bridgeTone}
                />
                <DeskMetric
                  label="API Target"
                  value={runtimeMode === "local" ? "Local" : "Hosted"}
                  detail={
                    runtimeMode === "local" ? LOCAL_API_URL : HOSTED_API_URL
                  }
                  tone={runtimeMode === "local" ? "good" : "neutral"}
                />
                <DeskMetric
                  label="Runtime"
                  value={
                    runtimeAction === "install"
                      ? "Repair"
                      : runtimeAction === "import"
                        ? "Import"
                        : "TUI"
                  }
                  detail={
                    preflight?.openclawBinary ||
                    "No OpenClaw binary detected yet."
                  }
                  tone={runtimeAction === "install" ? "warn" : "neutral"}
                />
                <DeskMetric
                  label="Seat State"
                  value={
                    desktopSeatReady
                      ? "Ready"
                      : isComplete
                        ? "Almost Ready"
                        : "Not Ready"
                  }
                  detail={
                    desktopSeatReady
                      ? status.assistant?.workspace ||
                        "Desktop handoff is live."
                      : "Finish identity, runtime, and assistant binding."
                  }
                  tone={desktopSeatReady ? "good" : "warn"}
                />
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-[16px] border border-rose-200 bg-[#fff6f7] px-4 py-3 text-[12.5px] leading-6 text-[#b42336]">
                {error}
              </div>
            ) : null}

            {bridgeIssue ? (
              <div className="mt-4 rounded-[16px] border border-amber-200 bg-[#fff8eb] px-4 py-3 text-[12.5px] leading-6 text-[#9a6700]">
                Bridge recovery: MUTX is currently using{" "}
                <span className="font-mono text-[#6b4900]">
                  {status.bridge.pythonCommand || "an unknown interpreter"}
                </span>
                . The latest bridge failure was{" "}
                <span className="font-mono text-[#6b4900]">{bridgeIssue}</span>.
              </div>
            ) : null}
          </DeskPanel>

          <DeskPanel
            title={STEP_ORDER[currentStepIndex]?.title || "Setup"}
            meta="Active work"
            tone="graphite"
            className="min-h-[460px]"
          >
            <p className="mb-5 max-w-2xl text-[13px] leading-6 text-[#97a0ad]">
              {STEP_ORDER[currentStepIndex]?.description}
            </p>
            <div className="mb-5">
              <DesktopJobNotice job={job} onDismiss={resetJob} />
            </div>
            {renderCurrentPanel()}
          </DeskPanel>

          <div className="grid gap-4 min-[1680px]:grid-cols-2">
            <DeskPanel title="Runtime Topology" meta="Local runtime">
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                <DeskMetric
                  label="Assistant"
                  value={status.assistant?.name || "Not bound"}
                  detail={
                    status.assistant?.workspace ||
                    "Run setup to bind the desktop workspace."
                  }
                  tone={status.assistant?.found ? "good" : "warn"}
                />
                <DeskMetric
                  label="Gateway"
                  value={runtimeGatewayUrl ? "Available" : "Missing"}
                  detail={runtimeGatewayUrl || "Gateway URL not detected yet."}
                  tone={runtimeGatewayUrl ? "good" : "warn"}
                />
                <DeskMetric
                  label="Binary Path"
                  value={runtimeBinaryPath ? "Detected" : "Unavailable"}
                  detail={runtimeBinaryPath || "OpenClaw binary not found."}
                  tone={runtimeBinaryPath ? "good" : "warn"}
                />
              </div>

              <div className="mt-4 space-y-1">
                <DeskKeyValue
                  label="Runtime config"
                  value={runtimeConfigPath}
                />
                <DeskKeyValue
                  label="Local control plane"
                  value={
                    runtimeLocalControl?.path || status.localControlPlane?.path
                  }
                />
                <DeskKeyValue
                  label="Privacy"
                  value={
                    runtimePrivacySummary ||
                    (runtimeKeysStayLocal === null
                      ? "Key locality unavailable"
                      : runtimeKeysStayLocal
                        ? "Keys remain local"
                        : "Keys may be proxied through the runtime")
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <DeskActionButton
                  label={copiedGateway ? "Gateway Copied" : "Copy Gateway"}
                  onClick={() => void handleCopyGateway()}
                  icon={Copy}
                  disabled={!runtimeGatewayUrl}
                />
                <DeskActionButton
                  label="Resync Runtime"
                  onClick={() => void handleRuntimeResync()}
                  icon={RefreshCw}
                  loading={
                    job.id === "runtimeResync" && job.status === "running"
                  }
                />
                <DeskActionButton
                  label="Reveal Workspace"
                  onClick={() => void handleRevealWorkspace()}
                  icon={FolderOpen}
                  disabled={!status.assistant?.workspace}
                />
              </div>
            </DeskPanel>

            <DeskPanel
              title="Governance Snapshot"
              meta="Machine policy"
              tone={status.faramesh?.available ? "success" : "warning"}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DeskMetric
                  label="Provider"
                  value={governance?.provider || "unknown"}
                />
                <DeskMetric
                  label="Pending"
                  value={String(governance?.pending_approvals ?? 0)}
                />
                <DeskMetric
                  label="Permits Today"
                  value={String(governance?.permits_today ?? 0)}
                />
                <DeskMetric
                  label="Defers Today"
                  value={String(governance?.defers_today ?? 0)}
                />
              </div>
              <div className="mt-4 space-y-1">
                <DeskKeyValue
                  label="Daemon status"
                  value={
                    governance?.status ||
                    (status.faramesh?.available ? "active" : "idle")
                  }
                />
                <DeskKeyValue
                  label="Last decision"
                  value={formatTimestamp(governance?.last_decision_at)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <DeskActionButton
                  label="Restart Daemon"
                  icon={RefreshCw}
                  onClick={() => void handleGovernanceRestart()}
                  loading={
                    job.id === "governanceRestart" && job.status === "running"
                  }
                />
                <DeskActionButton
                  label="Open Policy"
                  icon={FolderOpen}
                  onClick={() => void handleRevealPolicy()}
                />
              </div>
            </DeskPanel>
          </div>
        </div>

        <div className="space-y-4 min-[1600px]:col-start-3 min-[1600px]:row-start-1">
          <DesktopJobNotice job={job} onDismiss={resetJob} tone="light" />

          <DeskPanel title="Operator Feed" meta="Setup log" tone="graphite">
            <div className="h-[340px] overflow-y-auto rounded-[16px] border border-[#2a3139] bg-black/30 p-4 font-mono text-[12px] leading-6 text-[#d9e1ea]">
              {logs.length === 0 ? (
                <p className="text-[#758090]">
                  Waiting for the first real bridge event...
                </p>
              ) : (
                logs.map((log, index) => <p key={index}>{log}</p>)
              )}
            </div>
          </DeskPanel>

          <DeskPanel title="Local Sessions" meta="Activity">
            <div className="space-y-3">
              {snapshotLoading && sessions.length === 0 ? (
                <div className="rounded-[16px] border border-[#e1e6ed] bg-white/70 px-4 py-5 text-[13px] text-[#6b7582]">
                  Loading local session snapshot...
                </div>
              ) : sessions.length > 0 ? (
                sessions.slice(0, 6).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-[16px] border border-[#e1e6ed] bg-white/78 px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#171a1f]">
                          {session.channel || session.kind || session.id}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6d7784]">
                          {session.model || "model unknown"} •{" "}
                          {session.age || "age unknown"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#d7dce4] bg-[#f5f7fa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66707d]">
                        {session.active ? "active" : "idle"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#d7dce4] bg-white/60 px-4 py-5 text-[13px] leading-6 text-[#6b7582]">
                  No local assistant sessions detected yet. Open the TUI or
                  start a conversation to see local activity here.
                </div>
              )}
            </div>
          </DeskPanel>

          <DeskPanel title="Diagnostics" meta="Doctor">
            {doctorResult ? (
              <div className="grid gap-3">
                <DeskMetric
                  label="API"
                  value={doctorResult.api_health || "unknown"}
                  detail={doctorResult.api_url}
                  tone={
                    doctorResult.api_health === "ok" ||
                    doctorResult.api_health === "healthy"
                      ? "good"
                      : "warn"
                  }
                />
                <DeskMetric
                  label="Gateway"
                  value={doctorResult.openclaw.status || "unknown"}
                  detail={doctorResult.openclaw.doctor_summary}
                  tone={
                    doctorResult.openclaw.status === "healthy" ? "good" : "warn"
                  }
                />
                <DeskMetric
                  label="Assistant"
                  value={doctorResult.assistant?.name || "Not ready"}
                  detail={
                    doctorResult.assistant?.workspace ||
                    "No desktop-bound assistant yet."
                  }
                  tone={doctorResult.assistant ? "good" : "warn"}
                />
              </div>
            ) : (
              <div className="rounded-[16px] border border-[#e1e6ed] bg-white/70 px-4 py-4 text-[13px] leading-6 text-[#67717e]">
                Run the desktop doctor when you want a deeper snapshot of API
                reachability, runtime state, and assistant wiring.
              </div>
            )}
          </DeskPanel>
        </div>
      </div>
    );
  }

  const content = (
    <main
      className={
        standalone
          ? "flex min-h-screen w-full flex-col gap-6 px-4 py-5 lg:px-6 xl:px-8 2xl:px-10"
          : "flex flex-col gap-6"
      }
    >
      <section className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1.42fr)_minmax(360px,0.78fr)]">
        <div className="rounded-[34px] border border-[#183044] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,rgba(7,15,27,0.96)_0%,rgba(4,9,16,0.98)_100%)] p-6 shadow-[0_32px_120px_rgba(2,8,23,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-50">
                <Radar className="h-3.5 w-3.5" />
                {advancedView
                  ? "Advanced Operator Cockpit"
                  : "Native Operator Cockpit"}
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {advancedView
                  ? "Operate the local runtime without falling back to the web mirror."
                  : "Make this machine a serious operator seat."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The desktop app now uses one mission-control home for first-run
                setup, recovery, and steady-state runtime work. The browser
                mirror still exists, but it no longer pretends to be the native
                product.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={
                  status.authenticated ? "Session Synced" : "Session Pending"
                }
                tone={status.authenticated ? "good" : "warn"}
              />
              <StatusPill label={bridgeLabel} tone={bridgeTone} />
              <StatusPill
                label={
                  status.faramesh?.available
                    ? "Governance Active"
                    : "Governance Idle"
                }
                tone={status.faramesh?.available ? "good" : "neutral"}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
            <SignalTile
              label="Environment"
              value={
                !preflight
                  ? "Inspecting"
                  : preflight.cliAvailable
                    ? "Reachable"
                    : "Broken"
              }
              detail={
                !preflight
                  ? "Bridge preflight is still running."
                  : preflight.configPath
              }
              tone={environmentTone}
            />
            <SignalTile
              label="Bridge"
              value={
                status.bridge.ready
                  ? "Ready"
                  : status.bridge.state === "starting"
                    ? "Restarting"
                    : bridgeIssue
                      ? "Degraded"
                      : "Idle"
              }
              detail={
                bridgeIssue ||
                status.bridge.pythonCommand ||
                "Interpreter unresolved"
              }
              tone={bridgeTone}
            />
            <SignalTile
              label="API Target"
              value={runtimeMode === "local" ? "Local" : "Hosted"}
              detail={runtimeMode === "local" ? LOCAL_API_URL : HOSTED_API_URL}
              tone={runtimeMode === "local" ? "good" : "neutral"}
            />
            <SignalTile
              label="Runtime"
              value={
                runtimeAction === "install"
                  ? "Repair"
                  : runtimeAction === "import"
                    ? "Import"
                    : "TUI"
              }
              detail={
                preflight?.openclawBinary || "No OpenClaw binary detected yet."
              }
              tone={runtimeAction === "install" ? "warn" : "neutral"}
            />
            <SignalTile
              label="Seat State"
              value={
                desktopSeatReady
                  ? "Ready"
                  : isComplete
                    ? "Almost Ready"
                    : "Not Ready"
              }
              detail={
                desktopSeatReady
                  ? status.assistant?.workspace || "Dashboard handoff is live."
                  : "Use the rail below to finish auth, runtime, and assistant binding."
              }
              tone={desktopSeatReady ? "good" : "warn"}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton
              label="Refresh Environment"
              onClick={() => void runPreflight()}
              icon={RefreshCw}
              loading={loading && currentStep === "preflight"}
            />
            <ActionButton
              label="Run Doctor"
              onClick={() => void runDoctor()}
              icon={Radar}
              loading={job.id === "doctor" && job.status === "running"}
            />
            <ActionButton
              label="Open Terminal"
              onClick={() => void openTerminal()}
              icon={Terminal}
            />
            <ActionButton
              label="Open TUI"
              onClick={() => void openTui()}
              icon={TerminalSquare}
            />
            <ActionButton
              label={
                status.localControlPlane?.ready
                  ? "Stop Local Stack"
                  : "Start Local Stack"
              }
              onClick={() => void handleControlPlaneToggle()}
              icon={status.localControlPlane?.ready ? Square : Play}
              loading={
                (job.id === "controlPlaneStart" ||
                  job.id === "controlPlaneStop") &&
                job.status === "running"
              }
              tone={status.localControlPlane?.ready ? "danger" : "default"}
            />
            {!advancedView ? (
              <ActionButton
                label="Open Advanced Control"
                onClick={launchAdvancedControl}
                icon={ArrowRight}
                tone="primary"
              />
            ) : (
              <ActionButton
                label="Return Home"
                onClick={() => navigate("/dashboard")}
                icon={ArrowRight}
                tone="primary"
              />
            )}
          </div>

          {error ? (
            <div className="mt-6 rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {bridgeIssue ? (
            <div className="mt-4 rounded-[22px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Bridge recovery: MUTX is currently using{" "}
              <span className="font-mono text-amber-50">
                {status.bridge.pythonCommand || "an unknown interpreter"}
              </span>
              . The latest bridge failure was{" "}
              <span className="font-mono text-amber-50">{bridgeIssue}</span>.
            </div>
          ) : null}
        </div>

        <SurfaceCard
          title="System Brief"
          eyebrow="Live State"
          tone={
            environmentTone === "danger"
              ? "danger"
              : environmentTone === "warn"
                ? "warn"
                : "good"
          }
        >
          <div className="space-y-3">
            <DetailRow
              label="MUTX version"
              value={preflight?.mutxVersion || status.mutxVersion}
            />
            <DetailRow label="CLI config" value={preflight?.configPath} />
            <DetailRow label="MUTX home" value={preflight?.mutxHome} />
            <DetailRow
              label="API target"
              value={preflight?.apiUrl || status.apiUrl}
            />
            <DetailRow label="Gateway URL" value={runtimeGatewayUrl} />
            <DetailRow
              label="Local control path"
              value={
                runtimeLocalControl?.path ||
                preflight?.localCpPath ||
                status.localControlPlane?.path
              }
            />
            <DetailRow
              label="Python command"
              value={status.bridge.pythonCommand}
            />
            <DetailRow label="Bridge script" value={status.bridge.scriptPath} />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 min-[1480px]:grid-cols-[minmax(280px,0.62fr)_minmax(0,1.18fr)] min-[1860px]:grid-cols-[minmax(280px,0.6fr)_minmax(0,1.18fr)_minmax(340px,0.82fr)]">
        <SurfaceCard title="Setup Lane" eyebrow="Progress Rail">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Real desktop setup
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {setupState?.current_step || currentStep}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {setupState
                      ? `${setupState.completed_steps.length}/${setupState.steps.length} wizard steps complete`
                      : "The native setup rail mirrors the live bridge state when available."}
                  </p>
                </div>
                <StatusPill
                  label={setupState?.status || (loading ? "running" : "idle")}
                  tone={
                    setupStateFailed
                      ? "danger"
                      : setupStateActive
                        ? "warn"
                        : "neutral"
                  }
                />
              </div>
              <div className="mt-4 overflow-hidden rounded-full border border-white/10 bg-black/30">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    setupStateFailed
                      ? "bg-rose-400"
                      : setupStateActive
                        ? "bg-cyan-300"
                        : "bg-emerald-300",
                  )}
                  style={{ width: `${Math.max(setupProgress, 6)}%` }}
                />
              </div>
              {setupState?.last_error ? (
                <p className="mt-3 text-sm text-rose-200">
                  {setupState.last_error}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <StepRow
                  key={step.id}
                  step={step}
                  active={index === currentStepIndex}
                  onClick={() => setCurrentStep(step.id)}
                />
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title={STEP_ORDER[currentStepIndex]?.title || "Setup"}
          eyebrow="Active Work"
          tone={
            steps[currentStepIndex]?.status === "error"
              ? "danger"
              : steps[currentStepIndex]?.status === "complete"
                ? "good"
                : "default"
          }
        >
          <p className="mb-5 max-w-2xl text-sm leading-6 text-slate-400">
            {STEP_ORDER[currentStepIndex]?.description}
          </p>
          <div className="mb-5">
            <DesktopJobNotice job={job} onDismiss={resetJob} />
          </div>
          {renderCurrentPanel()}
        </SurfaceCard>

        <div className="grid gap-6 md:grid-cols-2 min-[1860px]:grid-cols-1">
          <DesktopJobNotice job={job} onDismiss={resetJob} tone="light" />

          <SurfaceCard title="Operator Feed" eyebrow="Setup Log">
            <div className="h-[360px] overflow-y-auto rounded-[22px] border border-white/10 bg-black/40 p-4 font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-slate-600">
                  Waiting for the first real bridge event...
                </p>
              ) : (
                logs.map((log, index) => (
                  <p key={index} className="leading-6 text-slate-300">
                    {log}
                  </p>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Diagnostics"
            eyebrow="Doctor"
            tone={doctorResult ? "good" : "default"}
          >
            {doctorResult ? (
              <div className="space-y-3">
                <SignalTile
                  label="API"
                  value={doctorResult.api_health || "unknown"}
                  detail={doctorResult.api_url}
                  tone={
                    doctorResult.api_health === "ok" ||
                    doctorResult.api_health === "healthy"
                      ? "good"
                      : "warn"
                  }
                />
                <SignalTile
                  label="Gateway"
                  value={doctorResult.openclaw.status || "unknown"}
                  detail={doctorResult.openclaw.doctor_summary}
                  tone={
                    doctorResult.openclaw.status === "healthy" ? "good" : "warn"
                  }
                />
                <SignalTile
                  label="Assistant"
                  value={doctorResult.assistant?.name || "Not ready"}
                  detail={
                    doctorResult.assistant?.workspace ||
                    "No desktop-bound assistant yet."
                  }
                  tone={doctorResult.assistant ? "good" : "warn"}
                />
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                Run the desktop doctor when you want a deeper snapshot of API
                reachability, runtime state, and assistant wiring.
              </div>
            )}
          </SurfaceCard>
        </div>
      </section>

      <section className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1.16fr)_minmax(340px,0.84fr)]">
        <SurfaceCard
          title="Runtime Topology"
          eyebrow="Operator Detail"
          tone={status.openclaw?.health === "healthy" ? "good" : "default"}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {status.assistant?.name || "Assistant not bound"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {status.assistant?.workspace ||
                        "Run setup to bind the desktop workspace."}
                    </p>
                  </div>
                  <Bot className="h-5 w-5 text-cyan-300" />
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Gateway URL
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {runtimeGatewayUrl || "not detected"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyGateway()}
                    disabled={!runtimeGatewayUrl}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedGateway ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                <HardDrive className="mt-0.5 h-4 w-4 text-sky-300" />
                <div>
                  <p className="font-medium text-white">Binary Path</p>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {runtimeBinaryPath || "not available"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                <Server className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <p className="font-medium text-white">Local Control Plane</p>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {runtimeLocalControl?.path ||
                      status.localControlPlane?.path ||
                      "not available"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                <Workflow className="mt-0.5 h-4 w-4 text-cyan-300" />
                <div>
                  <p className="font-medium text-white">Runtime Details</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {runtimePrivacySummary ||
                      "Desktop runtime state is synced from the local OpenClaw install."}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {runtimeKeysStayLocal === null
                      ? "Key locality unavailable"
                      : runtimeKeysStayLocal
                        ? "Keys remain local"
                        : "Keys may be proxied through the runtime"}
                  </p>
                  {runtimeConfigPath ? (
                    <p className="mt-2 break-all text-xs text-slate-600">
                      {runtimeConfigPath}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Governance Snapshot"
          eyebrow="Machine Policy"
          tone={status.faramesh?.available ? "good" : "warn"}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricChip
              label="Provider"
              value={governance?.provider || "unknown"}
            />
            <MetricChip
              label="Pending"
              value={String(governance?.pending_approvals ?? 0)}
            />
            <MetricChip
              label="Permits Today"
              value={String(governance?.permits_today ?? 0)}
            />
            <MetricChip
              label="Defers Today"
              value={String(governance?.defers_today ?? 0)}
            />
          </div>
          <div className="mt-4 space-y-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-sm font-medium text-white">Daemon Status</p>
                <p className="mt-1 text-xs text-slate-500">
                  {governance?.status ||
                    (status.faramesh?.available ? "active" : "idle")}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Last decision: {formatTimestamp(governance?.last_decision_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                label="Restart Daemon"
                icon={RefreshCw}
                onClick={() => void handleGovernanceRestart()}
                loading={
                  job.id === "governanceRestart" && job.status === "running"
                }
              />
              <ActionButton
                label="Open Policy"
                icon={FolderOpen}
                onClick={() => void handleRevealPolicy()}
              />
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 min-[1500px]:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)]">
        <SurfaceCard title="Local Sessions" eyebrow="Activity">
          <div className="space-y-3">
            {snapshotLoading && sessions.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-5 text-sm text-slate-500">
                Loading local session snapshot...
              </div>
            ) : sessions.length > 0 ? (
              sessions
                .slice(0, 4)
                .map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-slate-500">
                No local assistant sessions detected yet. Open the TUI or start
                a conversation to see local activity here.
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Maintenance" eyebrow="Actions">
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label="Run Doctor"
              icon={AlertCircle}
              onClick={() => void runDoctor()}
              loading={job.id === "doctor" && job.status === "running"}
              tone="primary"
            />
            <ActionButton
              label="Resync Runtime"
              icon={RefreshCw}
              onClick={() => void handleRuntimeResync()}
              loading={job.id === "runtimeResync" && job.status === "running"}
            />
            <ActionButton
              label="Reveal Workspace"
              icon={FolderOpen}
              onClick={() => void handleRevealWorkspace()}
              disabled={!status.assistant?.workspace}
            />
            <ActionButton
              label="Open Terminal"
              icon={ArrowUpRight}
              onClick={() => void openTerminal()}
            />
          </div>

          {job.error || snapshotError ? (
            <div className="mt-5 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {job.error || snapshotError}
            </div>
          ) : null}

          {doctorResult ? (
            <details className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <summary className="cursor-pointer font-medium text-white">
                Raw diagnostics payload
              </summary>
              <pre className="mt-4 max-h-80 overflow-auto text-xs text-slate-400">
                {JSON.stringify(doctorResult, null, 2)}
              </pre>
            </details>
          ) : null}
        </SurfaceCard>
      </section>
    </main>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_22%),linear-gradient(180deg,#04070d_0%,#09111d_55%,#050910_100%)]">
        <DesktopRouteListener />
        {content}
      </div>
    );
  }

  return <div className="space-y-6">{content}</div>;
}
