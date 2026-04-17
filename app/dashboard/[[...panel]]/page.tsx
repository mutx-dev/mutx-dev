"use client";

/**
 * app/dashboard/[[...panel]]/page.tsx
 *
 * SPA catch-all route for the MUTX dashboard shell.
 * Enabled when NEXT_PUBLIC_SPA_SHELL=true.
 *
 * Implements:
 * - Boot sequence (9 steps: auth, capabilities, config, connect, agents, sessions, projects, memory, skills)
 * - ContentRouter switch(tab) mapping to existing page content
 * - Per-panel ErrorBoundary keyed by activeTab
 * - Essential mode gating for restricted tabs
 * - Backward compatibility: existing /dashboard/* routes remain functional
 * - Desktop branch preserved via DesktopWindowShell
 */


import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  History,
  LucideIcon,
  MemoryStick,
  Network,
  Settings2,
  Sparkles,
  TerminalSquare,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";

import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { AnalyticsPageClient } from "@/components/dashboard/AnalyticsPageClient";
import { AutonomyPageClient } from "@/components/dashboard/AutonomyPageClient";
import { BudgetsPageClient } from "@/components/dashboard/BudgetsPageClient";
import { DashboardOverviewPageClient } from "@/components/dashboard/DashboardOverviewPageClient";
import { DemoRoutePage } from "@/components/dashboard/DemoRoutePage";
import { LogsPageClient } from "@/components/dashboard/LogsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { SecurityPageClient } from "@/components/dashboard/SecurityPageClient";
import { SessionsPageClient } from "@/components/dashboard/SessionsPageClient";
import { SkillsPageClient } from "@/components/dashboard/SkillsPageClient";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import {
  ESSENTIAL_PANELS,
  isSpaShellEnabled,
  useMissionControl,
  type BootStepKey,
  type ConnectionState,
  type DashboardMode,
  type MCActivity,
  type MCAgent,
  type MCUser,
  type Session,
  type SkillsData,
  type Subscription,
  type TabId,
} from "@/lib/store";

import WebhooksPageClient from "@/components/webhooks/WebhooksPageClient";

// ---------------------------------------------------------------------------
// Panel metadata registry
// ---------------------------------------------------------------------------

interface PanelMeta {
  tab: TabId;
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  iconTone: string;
  href: string;
  /** Route segments used to derive activeTab from URL */
  pathSegments: string[];
}

// ---------------------------------------------------------------------------
// Feature flag guard — renders null on server / when flag is off
// ---------------------------------------------------------------------------

function SpaShellGuard({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSpaShellEnabled());
  }, []);

  if (!enabled) return null;

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Panel metadata registry
// ---------------------------------------------------------------------------

const PANELS: PanelMeta[] = [
  {
    tab: "overview",
    title: "Overview",
    description: "Fleet posture, recent execution, alert pressure, and operator budget state.",
    icon: Activity,
    badge: "operator overview",
    iconTone: "text-cyan-300 bg-cyan-400/10",
    href: "/dashboard",
    pathSegments: [],
  },
  {
    tab: "agents",
    title: "Agents",
    description: "Manage your MUTX agent registry, lifecycle operations, and per-agent configuration.",
    icon: Bot,
    badge: "core surface",
    iconTone: "text-cyan-300 bg-cyan-400/10",
    href: "/dashboard/agents",
    pathSegments: ["agents"],
  },
  {
    tab: "tasks",
    title: "Orchestration",
    description: "Workflow and handoff control for agent orchestration.",
    icon: Network,
    badge: "orchestration",
    iconTone: "text-sky-300 bg-sky-400/10",
    href: "/dashboard/orchestration",
    pathSegments: ["orchestration"],
  },
  {
    tab: "chat",
    title: "Sessions",
    description: "Local and cloud session activity in one native operator surface.",
    icon: Users,
    badge: "execution",
    iconTone: "text-cyan-300 bg-cyan-400/10",
    href: "/dashboard/sessions",
    pathSegments: ["sessions"],
  },
  {
    tab: "activity",
    title: "History",
    description: "Audit trail for recent operator actions and runtime recovery context.",
    icon: History,
    badge: "support",
    iconTone: "text-slate-200 bg-white/10",
    href: "/dashboard/history",
    pathSegments: ["history"],
  },
  {
    tab: "logs",
    title: "Logs",
    description: "Real-time step timeline and execution log stream for agent runs.",
    icon: TerminalSquare,
    badge: "execution trace",
    iconTone: "text-slate-200 bg-white/10",
    href: "/dashboard/logs",
    pathSegments: ["logs"],
  },
  {
    tab: "cron",
    title: "Autonomy",
    description: "Cron-based autonomous task scheduling and execution control.",
    icon: Sparkles,
    badge: "autonomy",
    iconTone: "text-cyan-300 bg-cyan-400/10",
    href: "/dashboard/autonomy",
    pathSegments: ["autonomy"],
  },
  {
    tab: "memory",
    title: "Memory",
    description: "Context retention posture, workspace memory readiness, and future memory controls.",
    icon: MemoryStick,
    badge: "admin",
    iconTone: "text-violet-300 bg-violet-400/10",
    href: "/dashboard/memory",
    pathSegments: ["memory"],
  },
  {
    tab: "skills",
    title: "Skills",
    description: "Installed assistant capabilities and native workspace skill posture.",
    icon: Brain,
    badge: "support",
    iconTone: "text-sky-300 bg-sky-400/10",
    href: "/dashboard/skills",
    pathSegments: ["skills"],
  },
  {
    tab: "settings",
    title: "Advanced",
    description: "Bridge diagnostics, runtime repair, governance control, and desktop environment inspection.",
    icon: Settings2,
    badge: "advanced diagnostics",
    iconTone: "text-cyan-300 bg-cyan-400/10",
    href: "/dashboard/control",
    pathSegments: ["control"],
  },
  {
    tab: "tokens",
    title: "Analytics",
    description: "Trends, latency, and fleet activity summaries rendered in the native shell.",
    icon: BarChart3,
    badge: "admin",
    iconTone: "text-fuchsia-300 bg-fuchsia-400/10",
    href: "/dashboard/analytics",
    pathSegments: ["analytics"],
  },
  {
    tab: "cost-tracker",
    title: "Budgets",
    description: "Usage, credit posture, and cost signals with local runtime context nearby.",
    icon: Wallet,
    badge: "admin",
    iconTone: "text-emerald-300 bg-emerald-400/10",
    href: "/dashboard/budgets",
    pathSegments: ["budgets"],
  },
  {
    tab: "webhooks",
    title: "Webhooks",
    description: "Outbound delivery endpoints and test flows without leaving the desktop shell.",
    icon: Webhook,
    badge: "admin",
    iconTone: "text-fuchsia-300 bg-fuchsia-400/10",
    href: "/dashboard/webhooks",
    pathSegments: ["webhooks"],
  },
  {
    tab: "security",
    title: "Security",
    description: "Operator session posture, token state, key inventory, and trust boundaries.",
    icon: Sparkles,
    badge: "admin",
    iconTone: "text-amber-300 bg-amber-400/10",
    href: "/dashboard/security",
    pathSegments: ["security"],
  },
];

const PANEL_BY_TAB: Record<TabId, PanelMeta> = PANELS.reduce(
  (acc, p) => ({ ...acc, [p.tab]: p }),
  {} as Record<TabId, PanelMeta>
);

const PANEL_BY_SEGMENTS: Record<string, TabId> = PANELS.reduce(
  (acc, p) => {
    if (p.pathSegments.length > 0) {
      acc[p.pathSegments[0]] = p.tab;
    }
    return acc;
  },
  {} as Record<string, TabId>
);

// ---------------------------------------------------------------------------
// URL → TabId resolver
// ---------------------------------------------------------------------------

function resolveTabFromParams(params: { panel?: string[] }): TabId {
  const segments = params.panel ?? [];

  if (segments.length === 0) return "overview";

  const first = segments[0];
  if (first && first in PANEL_BY_SEGMENTS) {
    return PANEL_BY_SEGMENTS[first];
  }

  return "overview";
}

// ---------------------------------------------------------------------------
// Boot sequence types (BootStepKey imported from @/lib/store)
// ---------------------------------------------------------------------------

const STEP_KEYS: BootStepKey[] = [
  "auth",
  "capabilities",
  "config",
  "connect",
  "agents",
  "sessions",
  "projects",
  "memory",
  "skills",
];

interface BootStepState {
  key: BootStepKey;
  label: string;
  done: boolean;
  error?: string;
}

function buildInitialBootSteps(): BootStepState[] {
  return STEP_KEYS.map((key) => ({ key, label: key, done: false }));
}

// ---------------------------------------------------------------------------
// Boot sequence (runs once on mount)
// ---------------------------------------------------------------------------

async function runBootSequence(
  onStep: (step: BootStepState) => void,
  store: {
    setCurrentUser: (user: MCUser | null) => void;
    setDashboardMode: (mode: DashboardMode) => void;
    setBootComplete: (complete: boolean) => void;
    setCapabilitiesChecked: (checked: boolean) => void;
    setSubscription: (sub: Subscription | null) => void;
    setAgents: (agents: MCAgent[]) => void;
    setSessions: (sessions: Session[]) => void;
    setActivities: (activities: MCActivity[]) => void;
    setSkillsData: (data: SkillsData | null) => void;
    setConnection: (c: Partial<ConnectionState>) => void;
  }
) {
  const { setCurrentUser, setDashboardMode, setBootComplete, setCapabilitiesChecked, setSubscription, setAgents, setSessions, setActivities, setSkillsData, setConnection } = store;

  function complete(key: BootStepKey, error?: string) {
    onStep({ key, label: key, done: true, error });
  }

  // Step 1: Auth
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const user = await res.json();
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  } catch {
    setCurrentUser(null);
  }
  complete("auth");

  // Step 2: Capabilities (derive dashboardMode from desktop status)
  try {
    if (typeof window !== "undefined" && window.mutxDesktop?.isDesktop) {
      const ctx = await window.mutxDesktop.getRuntimeContext();
      setDashboardMode(ctx.mode === "local" ? "local" : "gateway");
    } else {
      setDashboardMode("gateway");
    }
  } catch {
    setDashboardMode("gateway");
  }
  complete("capabilities");
  setCapabilitiesChecked(true);

  // Step 3: Config (subscription)
  try {
    const res = await fetch("/v1/settings", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription ?? data);
    }
  } catch {
    // Config fetch failed — non-fatal
  }
  complete("config");

  // Step 4: Connect (stub — no WS/SSE yet)
  setConnection({ isConnected: true, sseConnected: false, wsConnected: false });
  complete("connect");

  // Step 5-9: Parallel data preload
  const parallelResults = await Promise.allSettled([
    // agents
    (async () => {
      try {
        const res = await fetch("/api/dashboard/agents", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAgents(data.items ?? []);
        }
      } catch {
        // non-fatal
      }
    })(),
    // sessions
    (async () => {
      try {
        const res = await fetch("/v1/sessions", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.items ?? []);
        }
      } catch {
        // non-fatal
      }
    })(),
    // activities
    (async () => {
      try {
        const res = await fetch("/v1/activities", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setActivities(data.items ?? []);
        }
      } catch {
        // non-fatal
      }
    })(),
    // memory (stub)
    Promise.resolve(),
    // skills
    (async () => {
      try {
        const res = await fetch("/v1/skills", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSkillsData(data);
        }
      } catch {
        // non-fatal
      }
    })(),
  ]);

  const [agentsResult, sessionsResult, _activitiesResult, _memoryResult, skillsResult] = parallelResults;

  if (agentsResult.status === "rejected") complete("agents", String(agentsResult.reason));
  else complete("agents");

  if (sessionsResult.status === "rejected") complete("sessions", String(sessionsResult.reason));
  else complete("sessions");

  complete("projects"); // stubbed
  complete("memory"); // stubbed

  if (skillsResult.status === "rejected") complete("skills", String(skillsResult.reason));
  else complete("skills");

  setBootComplete(true);
}

// ---------------------------------------------------------------------------
// Boot progress overlay
// ---------------------------------------------------------------------------

function BootOverlay({ steps }: { steps: BootStepState[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b13]">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[rgba(191,219,254,0.12)] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_42%),linear-gradient(180deg,#172235_0%,#0a0f18_100%)]">
            <Sparkles className="h-5 w-5 animate-pulse text-[#60a5fa]" />
          </div>
          <h2 className="font-[family-name:var(--font-site-display)] text-[1.2rem] font-semibold tracking-[-0.04em] text-[#f4f8ff]">
            Booting Mission Control
          </h2>
          <p className="text-[13px] text-[#9bb4d6]">
            Initializing operator surface…
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#93c5fd]">{doneCount} / {steps.length} steps</span>
            <span className="font-[family-name:var(--font-mono)] text-[#dbeafe]">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1e293b]">
            <div
              className="h-full rounded-full bg-[#3b82f6] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ul className="space-y-1">
          {steps.map((step) => (
            <li key={step.key} className="flex items-center gap-2 text-[11px]">
              {step.done ? (
                <span className="h-3.5 w-3.5 rounded-full bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
                  <span className="block h-1 w-1 rounded-full bg-white" />
                </span>
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-[#334155] flex-shrink-0 animate-pulse" />
              )}
              <span className={step.done ? "text-[#93c5fd]" : "text-[#475569]"}>
                {step.label}
              </span>
              {step.error && (
                <span className="text-[#f87171]">— {step.error}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContentRouter — maps TabId to React content
// ---------------------------------------------------------------------------

function ContentRouter({ tab }: { tab: TabId }) {
  const meta = PANEL_BY_TAB[tab];

  switch (tab) {
    case "overview":
      return (
        <div className="space-y-4">
          <RouteHeader
            title={meta.title}
            description={meta.description}
            icon={meta.icon}
            iconTone={meta.iconTone}
            badge={meta.badge}
            stats={[
              { label: "Shell", value: "SPA /dashboard/[[...panel]]" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />
          <DashboardOverviewPageClient />
        </div>
      );

    case "agents":
      return (
        <div className="space-y-4">
          <RouteHeader
            title={meta.title}
            description={meta.description}
            icon={meta.icon}
            iconTone={meta.iconTone}
            badge={meta.badge}
            stats={[
              { label: "Scope", value: "Fleet registry" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />
          <AgentsPageClient />
        </div>
      );

    case "tasks":
      return (
        <DemoRoutePage
          title="Orchestration"
          description="Workflow and handoff control will land here once the backend owns orchestration entities end to end."
          badge="demo orchestration"
          notes={[
            "Show truthful workflow topology once orchestration endpoints ship instead of inventing queue theater.",
            "Keep pause, resume, and concurrency controls hidden until they map to auditable backend actions.",
            "Use the same shell and density rules as the live routes so this page is ready for backend wiring.",
          ]}
        />
      );

    case "chat":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Sessions"
            description="Local and cloud session activity in one native operator surface."
            icon={Users}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="execution"
          />
          <SessionsPageClient />
        </div>
      );

    case "activity":
      return (
        <DemoRoutePage
          title="History"
          description="Audit trail for recent operator actions and runtime recovery context."
          badge="support"
          notes={[
            "History is currently redirected to /dashboard/monitoring in the existing routing.",
            "SPA shell preserves the redirect pattern for the activity tab.",
          ]}
        />
      );

    case "logs":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Logs"
            description="Real-time step timeline and execution log stream for agent runs."
            icon={TerminalSquare}
            iconTone="text-slate-200 bg-white/10"
            badge="execution trace"
          />
          <LogsPageClient />
        </div>
      );

    case "cron":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Autonomy"
            description="Cron-based autonomous task scheduling and execution control."
            icon={Sparkles}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="autonomy"
          />
          <AutonomyPageClient />
        </div>
      );

    case "memory":
      return (
        <DemoRoutePage
          title="Memory"
          description="Context retention posture, workspace memory readiness, and future memory controls."
          badge="admin"
          notes={[
            "Memory browser will land here once memory graph endpoints ship.",
            "Keep the SPA shell wired so this panel activates without redesign when the backend is ready.",
          ]}
        />
      );

    case "skills":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Skills"
            description="Installed assistant capabilities and native workspace skill posture."
            icon={Brain}
            iconTone="text-sky-300 bg-sky-400/10"
            badge="support"
          />
          <SkillsPageClient />
        </div>
      );

    case "settings":
      return (
        <DemoRoutePage
          title="Advanced"
          description="Bridge diagnostics, runtime repair, governance control, and desktop environment inspection."
          badge="advanced diagnostics"
          notes={[
            "The Advanced/Control page is currently served directly via DesktopControlDeck.",
            "SPA shell preserves the existing component for the settings tab.",
          ]}
        />
      );

    case "tokens":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Analytics"
            description="Trends, latency, and fleet activity summaries rendered in the native shell."
            icon={BarChart3}
            iconTone="text-fuchsia-300 bg-fuchsia-400/10"
            badge="admin"
          />
          <AnalyticsPageClient />
        </div>
      );

    case "cost-tracker":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Budgets"
            description="Usage, credit posture, and cost signals with local runtime context nearby."
            icon={Wallet}
            iconTone="text-emerald-300 bg-emerald-400/10"
            badge="admin"
          />
          <BudgetsPageClient />
        </div>
      );

    case "webhooks":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Webhooks"
            description="Outbound delivery endpoints and test flows without leaving the desktop shell."
            icon={Webhook}
            iconTone="text-fuchsia-300 bg-fuchsia-400/10"
            badge="admin"
          />
          <WebhooksPageClient />
        </div>
      );

    case "security":
      return (
        <div className="space-y-4">
          <RouteHeader
            title="Security"
            description="Operator session posture, token state, key inventory, and trust boundaries."
            icon={Sparkles}
            iconTone="text-amber-300 bg-amber-400/10"
            badge="admin"
          />
          <SecurityPageClient />
        </div>
      );

    default:
      return (
        <DemoRoutePage
          title="Unknown Panel"
          description={`Panel "${tab}" is not registered in the ContentRouter.`}
          badge="error"
          notes={["This panel needs to be added to the ContentRouter switch statement."]}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Upgrade nudge for non-essential tabs in essential mode
// ---------------------------------------------------------------------------

function EssentialModeUpgradeNudge({ tab }: { tab: TabId }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-[20px] border border-[rgba(191,219,254,0.12)] bg-[#0f1728] p-5">
        <Sparkles className="h-8 w-8 text-[#93c5fd]" />
      </div>
      <h3 className="font-[family-name:var(--font-site-display)] text-[1.1rem] font-semibold tracking-[-0.03em] text-[#f4f8ff]">
        Upgrade to Full Mode
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#9bb4d6]">
        <span className="font-semibold text-[#dbeafe]">{PANEL_BY_TAB[tab]?.title ?? tab}</span> is not
        available in essential mode.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-[14px] border border-[rgba(191,219,254,0.12)] bg-[#101722] px-4 py-2 text-[13px] text-[#dbeafe] transition-colors hover:bg-[#1a2642]"
        >
          Go to Overview
        </button>
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="rounded-[14px] bg-[#3b82f6] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#2563eb]"
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SPA Shell page component
// ---------------------------------------------------------------------------

export default function DashboardSpaShellPage() {
  const params = useParams<{ panel?: string[] }>();
  const _router = useRouter();
  const { status: _status, isDesktop, platformReady } = useDesktopStatus();

  const tabFromUrl = resolveTabFromParams(params);

  const store = useMissionControl();
  const activeTab = useMissionControl((s) => s.activeTab);
  const interfaceMode = useMissionControl((s) => s.interfaceMode);
  const bootComplete = useMissionControl((s) => s.bootComplete);
  const setActiveTab = useMissionControl((s) => s.setActiveTab);

  const [bootSteps, setBootSteps] = useState<BootStepState[]>(buildInitialBootSteps);
  const [booting, setBooting] = useState(true);

  // Sync activeTab from URL on mount / params change
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl, setActiveTab]);

  // Run boot sequence once
  useEffect(() => {
    if (bootComplete) {
      setBooting(false);
      return;
    }

    let cancelled = false;

    runBootSequence(
      (step) => {
        if (cancelled) return;
        setBootSteps((prev) =>
          prev.map((s) => (s.key === step.key ? step : s))
        );
      },
      store
    )
      .catch(() => {
        // Ensure boot completes even if sequence throws
        if (!cancelled) setBooting(false);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bootComplete, setActiveTab, store]);

  // Determine whether a given tab is restricted in essential mode.
  function isEssentialRestricted(tab: TabId): boolean {
    return !ESSENTIAL_PANELS.includes(tab);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const errorBoundaryKey = activeTab;
  const showUpgradeNudge = interfaceMode === "essential" && isEssentialRestricted(activeTab);

  // Boot overlay + ErrorBoundary wrapping applies in both desktop and web shells.
  const shellContent = (
    <>
      {booting && <BootOverlay steps={bootSteps} />}
      <ErrorBoundary key={errorBoundaryKey}>
        {showUpgradeNudge ? (
          <EssentialModeUpgradeNudge tab={activeTab} />
        ) : (
          <ContentRouter tab={activeTab} />
        )}
      </ErrorBoundary>
    </>
  );

  // ── Desktop branch ──────────────────────────────────────────────────────
  if (platformReady && isDesktop) {
    return <SpaShellGuard>{shellContent}</SpaShellGuard>;
  }

  // ── Web shell ───────────────────────────────────────────────────────────
  return <SpaShellGuard>{shellContent}</SpaShellGuard>;
}

// ---------------------------------------------------------------------------
// Metadata (handled by parent layout)
// ---------------------------------------------------------------------------
