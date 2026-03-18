"use client";

import { Suspense, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Command,
  FileText,
  GitBranch,
  Github,
  HeartPulse,
  History,
  KeyRound,
  Layers,
  Menu,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { AppDashboardClient } from "@/components/app/AppDashboardClient";
import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { ApiKeysPageClient } from "@/components/app/ApiKeysPageClient";
import { DeploymentsPageClient } from "@/components/app/DeploymentsPageClient";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { LogsMetricsStateClient } from "@/components/app/LogsMetricsStateClient";
import { TerminalWindow } from "@/components/TerminalWindow";
import WebhooksPageClient from "@/components/webhooks/WebhooksPageClient";

type SurfaceKind = "live" | "shell";
type SurfaceGroup = "core" | "workflow";

type SurfaceItem = {
  id:
    | "overview"
    | "agents"
    | "deployments"
    | "apiKeys"
    | "health"
    | "webhooks"
    | "observability"
    | "runs"
    | "traces"
    | "logs"
    | "orchestration"
    | "budgets"
    | "history"
    | "control";
  label: string;
  hint: string;
  href: string;
  group: SurfaceGroup;
  kind: SurfaceKind;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
};

type WorkflowSurfaceId = "runs" | "traces" | "logs" | "orchestration" | "budgets" | "history" | "control";

const SURFACES: SurfaceItem[] = [
  {
    id: "overview",
    label: "Overview",
    hint: "fleet summary and health",
    href: "/app",
    group: "core",
    kind: "live",
    icon: ShieldCheck,
    title: "Overview",
    subtitle: "Control Plane Summary",
    description: "Primary operator surface for authentication, fleet posture, and recovery readiness.",
  },
  {
    id: "agents",
    label: "Agents",
    hint: "manage your agent fleet",
    href: "/app/agents",
    group: "core",
    kind: "live",
    icon: Bot,
    title: "Agents",
    subtitle: "Inventory and Lifecycle",
    description: "Create, inspect, and govern agent definitions with operator-grade inventory controls.",
  },
  {
    id: "deployments",
    label: "Deployments",
    hint: "runtime topology and recovery",
    href: "/app/deployments",
    group: "core",
    kind: "live",
    icon: Rocket,
    title: "Deployments",
    subtitle: "Runtime Operations",
    description: "Track deployment state, restart flows, and live execution posture from one console.",
  },
  {
    id: "apiKeys",
    label: "API Keys",
    hint: "non-browser control access",
    href: "/app/api-keys",
    group: "core",
    kind: "live",
    icon: KeyRound,
    title: "API Keys",
    subtitle: "Access Governance",
    description: "Issue, rotate, and revoke machine credentials without leaving the control plane.",
  },
  {
    id: "health",
    label: "Health",
    hint: "proxy and platform reachability",
    href: "/app/health",
    group: "core",
    kind: "live",
    icon: HeartPulse,
    title: "Health",
    subtitle: "Control Plane Integrity",
    description: "Verify service heartbeat, dependency health, and recovery state in real time.",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    hint: "event delivery endpoints",
    href: "/app/webhooks",
    group: "core",
    kind: "live",
    icon: Activity,
    title: "Webhooks",
    subtitle: "Delivery Automation",
    description: "Manage outbound event integrations and test delivery flows with auditable controls.",
  },
  {
    id: "observability",
    label: "Observability",
    hint: "runs, traces, and state",
    href: "/app/observability",
    group: "core",
    kind: "live",
    icon: Activity,
    title: "Observability",
    subtitle: "Runtime Telemetry",
    description: "Inspect run traces and state transitions sourced from live dashboard proxy routes.",
  },
  {
    id: "runs",
    label: "Runs",
    hint: "execution timeline",
    href: "/app/runs",
    group: "workflow",
    kind: "shell",
    icon: GitBranch,
    title: "Runs",
    subtitle: "Execution Timeline",
    description: "Operator timeline surface for run lifecycle, duration, and status visibility.",
  },
  {
    id: "traces",
    label: "Traces",
    hint: "execution drill-down",
    href: "/app/traces",
    group: "workflow",
    kind: "shell",
    icon: Activity,
    title: "Traces",
    subtitle: "Event Drill-Down",
    description: "Detailed event-level trace stream for run debugging and runtime forensics.",
  },
  {
    id: "logs",
    label: "Logs",
    hint: "runtime output stream",
    href: "/app/logs",
    group: "workflow",
    kind: "shell",
    icon: FileText,
    title: "Logs",
    subtitle: "Runtime Output",
    description: "Consolidated output stream for agents, deployments, and orchestration workflows.",
  },
  {
    id: "orchestration",
    label: "Orchestration",
    hint: "workflow lane topology",
    href: "/app/orchestration",
    group: "workflow",
    kind: "shell",
    icon: Layers,
    title: "Orchestration",
    subtitle: "Workflow Topology",
    description: "Control lane definitions, handoffs, and operational guardrails for execution policy.",
  },
  {
    id: "budgets",
    label: "Budgets",
    hint: "spend and quota posture",
    href: "/app/budgets",
    group: "workflow",
    kind: "shell",
    icon: BarChart3,
    title: "Budgets",
    subtitle: "Spend Governance",
    description: "Operator spend and quota controls across agents, deployments, and execution workflows.",
  },
  {
    id: "history",
    label: "History",
    hint: "event chronology",
    href: "/app/history",
    group: "workflow",
    kind: "shell",
    icon: History,
    title: "History",
    subtitle: "Execution Chronicle",
    description: "Immutable event timeline for run milestones, operator actions, and recovery checkpoints.",
  },
  {
    id: "control",
    label: "Control",
    hint: "policy and runtime knobs",
    href: "/app/control",
    group: "workflow",
    kind: "shell",
    icon: SlidersHorizontal,
    title: "Control",
    subtitle: "Policy Surface",
    description: "Central control panel for lane policy, automation posture, and execution constraints.",
  },
];

const HERO_SIGNALS = [
  { label: "Auth path", value: "session cookie -> dashboard proxy" },
  { label: "Operator loop", value: "fleet truth -> key control -> recovery" },
  { label: "Surface model", value: "live data where MUTX already supports it" },
] as const;

const WORKFLOW_COPY: Record<WorkflowSurfaceId, { area: string; integrations: [string, string, string] }> = {
  runs: {
    area: "Operator execution",
    integrations: [
      "Bind this route to a truthful MUTX runs endpoint before rendering run rows or status chips.",
      "Reuse stable run identifiers and statuses exposed by backend APIs for deep-link trace context.",
      "Add server-driven filtering (status/agent/date) after backend contracts exist.",
    ],
  },
  traces: {
    area: "Runtime traces",
    integrations: [
      "Wire this shell to the run trace stream so operators can inspect ordered event payloads.",
      "Expose per-trace severity and sequence metadata from MUTX APIs, not synthetic labels.",
      "Add export and copy actions only after backend trace retrieval contracts stabilize.",
    ],
  },
  logs: {
    area: "Runtime logs",
    integrations: [
      "Connect logs to deployment and run outputs from the control plane event stream.",
      "Expose source filters (agent/deployment/runtime) once backend fields are finalized.",
      "Add retention and pagination controls only when server guarantees become explicit.",
    ],
  },
  orchestration: {
    area: "Operator workflows",
    integrations: [
      "Connect lane cards and dependency graph to real orchestration entities when MUTX publishes workflow APIs.",
      "Expose pause/resume and concurrency controls only when actions map to backend mutations.",
      "Keep handoff views focused on truthful lane state instead of synthetic queue simulations.",
    ],
  },
  budgets: {
    area: "Operator economics",
    integrations: [
      "Render spend totals only from trustworthy billing and usage APIs.",
      "Wire budget categories to real quota boundaries (compute, API, storage).",
      "Add burn-rate panels only when historical usage data is available server-side.",
    ],
  },
  history: {
    area: "Audit history",
    integrations: [
      "Feed this route with immutable action logs from control-plane audit events.",
      "Align event filters with canonical actor/action/resource fields from backend payloads.",
      "Support timeline export only after policy and retention semantics are finalized.",
    ],
  },
  control: {
    area: "Operator policy",
    integrations: [
      "Attach runtime policy toggles only where backend mutation endpoints already exist.",
      "Represent automation modes and safeguards using server-truth configuration.",
      "Expose approval and blast-radius controls once governance contracts are available.",
    ],
  },
};

function PageLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-36 rounded-2xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}

function isSurfaceActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app" || pathname === "/app/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveSurface(pathname: string) {
  const sorted = [...SURFACES].sort((left, right) => right.href.length - left.href.length);
  return sorted.find((item) => isSurfaceActive(pathname, item.href)) ?? SURFACES[0];
}

function SidebarGroup({
  label,
  items,
  activeHref,
  onNavigate,
}: {
  label: string;
  items: SurfaceItem[];
  activeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {items.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                isActive
                  ? "border-cyan-400/25 bg-cyan-400/12 text-white"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.15em] text-slate-500">{item.hint}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  activeHref,
  coreItems,
  workflowItems,
}: {
  open: boolean;
  onClose: () => void;
  activeHref: string;
  coreItems: SurfaceItem[];
  workflowItems: SurfaceItem[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-[82%] max-w-xs border-r border-white/10 bg-[#03060d] p-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Command className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">app.mutx.dev</p>
              <p className="text-sm font-semibold text-white">Mission Control</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-300"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <SidebarGroup label="Core surfaces" items={coreItems} activeHref={activeHref} onNavigate={onClose} />
          <SidebarGroup label="Operator workflows" items={workflowItems} activeHref={activeHref} onNavigate={onClose} />
        </div>

        <div className="absolute inset-x-5 bottom-5 space-y-2 border-t border-white/10 pt-4">
          <a
            href="https://github.com/fortunexbt/mutx-dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-400 transition hover:bg-white/[0.03] hover:text-slate-200"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://mutx.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
          >
            <ArrowRight className="h-4 w-4" />
            Marketing site
          </a>
        </div>
      </aside>
    </div>
  );
}

function SurfaceFrame({ surface, children }: { surface: SurfaceItem; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">{surface.subtitle}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{surface.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">{surface.description}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              surface.kind === "live"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
            }`}
          >
            {surface.kind === "live" ? "Live surface" : "Shell mapped"}
          </span>
        </div>
      </div>
      {children}
    </section>
  );
}

function WorkflowShellPanel({ surface }: { surface: SurfaceItem }) {
  const copy = WORKFLOW_COPY[surface.id as WorkflowSurfaceId];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#040916] p-4 sm:p-5">
      <div className="rounded-2xl border border-[#193363] bg-[#030713] p-4 sm:p-5">
        <p className="text-xs text-slate-500">Dashboard &gt; {surface.title}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{surface.title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">{surface.description}</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <article className="rounded-2xl border border-white/10 bg-black/45 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{copy.area}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This route now uses the control-plane section shell, while content remains constrained to truthful MUTX support.
              </p>
              <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                No fake data
              </span>
            </article>

            <div className="grid gap-3 md:grid-cols-3">
              {copy.integrations.map((integration, index) => (
                <article key={integration} className="rounded-xl border border-[#1d2f57] bg-[#060a17] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Next integration {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{integration}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <article className="rounded-xl border border-[#1d2f57] bg-[#060a17] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Port note</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Route shell is production-ready. API panels should land route by route as soon as backend contracts are stable.
              </p>
            </article>

            <article className="rounded-xl border border-[#1d2f57] bg-[#060a17] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Operator principle</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Build shell, navigation, and panel density first. Wire live data only where MUTX exposes truthful signals.
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppPreviewPage() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeSurface = useMemo(() => getActiveSurface(pathname), [pathname]);
  const coreItems = useMemo(() => SURFACES.filter((item) => item.group === "core"), []);
  const workflowItems = useMemo(() => SURFACES.filter((item) => item.group === "workflow"), []);

  function renderContent() {
    if (activeSurface.id === "overview") {
      return (
        <div className="space-y-5">
          <section className="rounded-[24px] border border-white/10 bg-gradient-to-br from-cyan-400/[0.1] via-[#07111f] to-[#040814] p-5 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                  Control-plane live surface
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  High-signal operations for agent infrastructure.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Authenticate once, then inspect fleet truth, deployment posture, API key lifecycle, and runtime telemetry from one cohesive operator shell.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {HERO_SIGNALS.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{signal.label}</p>
                      <p className="mt-2 text-sm text-white">{signal.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <TerminalWindow title="dashboard-proxy.ts" path="app/api/dashboard" label="network">
                <div className="space-y-2.5">
                  <div className="terminal-line">
                    <span className="terminal-prompt">$</span>
                    <span className="text-slate-300">POST /api/auth/login <span className="text-emerald-400">-&gt;</span> FastAPI/Auth</span>
                  </div>
                  <div className="terminal-line">
                    <span className="terminal-prompt">$</span>
                    <span className="text-slate-300">GET /api/dashboard/agents <span className="text-emerald-400">-&gt;</span> FastAPI/Agents</span>
                  </div>
                  <div className="terminal-line">
                    <span className="terminal-prompt">$</span>
                    <span className="text-slate-300">GET /api/dashboard/deployments <span className="text-emerald-400">-&gt;</span> FastAPI/Deployments</span>
                  </div>
                  <div className="terminal-line">
                    <span className="terminal-prompt">$</span>
                    <span className="text-slate-300">GET /api/dashboard/runs <span className="text-emerald-400">-&gt;</span> FastAPI/Runs</span>
                  </div>
                  <div className="terminal-line pt-1.5">
                    <span className="terminal-prompt">$</span>
                    <span className="terminal-caret text-cyan-300">|</span>
                  </div>
                </div>
              </TerminalWindow>
            </div>
          </section>

          <AppDashboardClient />
        </div>
      );
    }

    if (activeSurface.id === "agents") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <AgentsPageClient />
        </SurfaceFrame>
      );
    }

    if (activeSurface.id === "deployments") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <ErrorBoundary>
            <DeploymentsPageClient />
          </ErrorBoundary>
        </SurfaceFrame>
      );
    }

    if (activeSurface.id === "apiKeys") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <ApiKeysPageClient />
        </SurfaceFrame>
      );
    }

    if (activeSurface.id === "health") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <AppDashboardClient />
        </SurfaceFrame>
      );
    }

    if (activeSurface.id === "webhooks") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <WebhooksPageClient />
        </SurfaceFrame>
      );
    }

    if (activeSurface.id === "observability") {
      return (
        <SurfaceFrame surface={activeSurface}>
          <LogsMetricsStateClient />
        </SurfaceFrame>
      );
    }

    return (
      <SurfaceFrame surface={activeSurface}>
        <WorkflowShellPanel surface={activeSurface} />
      </SurfaceFrame>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040a] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-14%] h-[44%] w-[40%] rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute right-[-8%] top-[18%] h-[36%] w-[34%] rounded-full bg-blue-500/12 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeHref={activeSurface.href}
        coreItems={coreItems}
        workflowItems={workflowItems}
      />

      <div className="relative mx-auto max-w-[1500px] px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden rounded-[24px] border border-white/10 bg-black/35 p-4 backdrop-blur-xl lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)]">
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-[#081b2b] text-cyan-300">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">app.mutx.dev</p>
                <p className="text-sm font-semibold text-white">Mission Control</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">dashboard shell</p>
              </div>
            </div>

            <div className="h-[calc(100%-7rem)] space-y-5 overflow-y-auto pr-1">
              <SidebarGroup label="Core surfaces" items={coreItems} activeHref={activeSurface.href} />
              <SidebarGroup label="Operator workflows" items={workflowItems} activeHref={activeSurface.href} />
            </div>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <a
                href="https://github.com/fortunexbt/mutx-dev"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-400 transition hover:bg-white/[0.03] hover:text-slate-200"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://mutx.dev"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
              >
                <ArrowRight className="h-4 w-4" />
                Marketing site
              </a>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <header className="sticky top-20 z-20 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">{activeSurface.title}</p>
                    <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">{activeSurface.subtitle}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:inline-flex">
                    app shell
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      activeSurface.kind === "live"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    }`}
                  >
                    {activeSurface.kind}
                  </span>
                </div>
              </div>
            </header>

            <main className="rounded-[24px] border border-white/10 bg-black/40 p-4 backdrop-blur-xl sm:p-5 lg:p-6">
              <Suspense fallback={<PageLoadingSkeleton />}>{renderContent()}</Suspense>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
