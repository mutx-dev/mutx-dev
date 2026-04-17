"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Layers3, Lock, Sparkles } from "lucide-react";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DashboardPanelView } from "@/components/dashboard/DashboardPanelView";
import {
  DEFAULT_DASHBOARD_PANEL,
  ESSENTIAL_DASHBOARD_PANELS,
  getDashboardPanelForPath,
  isEssentialDashboardPanel,
  normalizeDashboardPanel,
} from "@/lib/dashboardPanels";
import { useMissionControl } from "@/lib/store";

const BOOT_STEP_LABELS = {
  auth: "Auth",
  capabilities: "Capabilities",
  config: "Config",
  connect: "Connect",
  agents: "Agents",
  sessions: "Sessions",
  projects: "Projects",
  memory: "Memory",
  skills: "Skills",
} as const;

function BootOverlay() {
  const bootSteps = useMissionControl((state) => state.bootSteps);

  const entries = useMemo(
    () => Object.entries(bootSteps) as Array<[keyof typeof BOOT_STEP_LABELS, (typeof bootSteps)[keyof typeof bootSteps]]>,
    [bootSteps],
  );
  const completedCount = entries.filter(([, status]) =>
    status === "success" || status === "error" || status === "skipped",
  ).length;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-[rgba(7,11,19,0.78)] px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-[28px] border border-[rgba(191,219,254,0.14)] bg-[linear-gradient(180deg,rgba(15,23,40,0.96)_0%,rgba(7,11,19,0.96)_100%)] p-5 shadow-[0_32px_90px_rgba(2,2,5,0.52)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">
              <Sparkles className="h-3.5 w-3.5" />
              shell bootstrap
            </div>
            <div>
              <h2 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#f4f8ff]">
                Loading mission control
              </h2>
              <p className="mt-1 text-sm text-[#a9bfde]">
                Booting auth, routing state, and the core operator surfaces for the SPA shell.
              </p>
            </div>
          </div>

          <div className="rounded-[20px] border border-[rgba(191,219,254,0.08)] bg-[#101722] px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#7f97bf]">Progress</p>
            <p className="mt-1 text-2xl font-semibold text-[#f4f8ff]">
              {completedCount}/{entries.length}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {entries.map(([step, status]) => (
            <div
              key={step}
              className="rounded-[20px] border border-[rgba(191,219,254,0.08)] bg-[#0d1422] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#f4f8ff]">{BOOT_STEP_LABELS[step]}</p>
                <span
                  className={
                    status === "success"
                      ? "rounded-full border border-[rgba(96,165,250,0.26)] bg-[rgba(59,130,246,0.12)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#dbeafe]"
                      : status === "error"
                        ? "rounded-full border border-[rgba(244,114,182,0.26)] bg-[rgba(131,24,67,0.3)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#fecdd3]"
                        : status === "skipped"
                          ? "rounded-full border border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.7)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#cbd5e1]"
                          : status === "running"
                            ? "rounded-full border border-[rgba(96,165,250,0.24)] bg-[rgba(37,99,235,0.12)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#bfdbfe]"
                            : "rounded-full border border-[rgba(191,219,254,0.08)] bg-[#101722] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#7f97bf]"
                  }
                >
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EssentialModeNudge({ panel }: { panel: string }) {
  const setInterfaceMode = useMissionControl((state) => state.setInterfaceMode);

  return (
    <div className="rounded-[28px] border border-[rgba(191,219,254,0.12)] bg-[linear-gradient(180deg,#101722_0%,#0a0f18_100%)] p-6 shadow-[0_24px_80px_rgba(2,2,5,0.38)]">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">
        <Lock className="h-3.5 w-3.5" />
        essential mode
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-[family:var(--font-site-display)] text-[1.7rem] tracking-[-0.06em] text-[#f4f8ff]">
            `{panel}` is available in full mode
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#a9bfde]">
            Essential mode keeps the shell focused on the core operator loop. Switch back to full
            mode to unlock preview and support panels without leaving the SPA shell.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#7f97bf]">
            Essential panels: {ESSENTIAL_DASHBOARD_PANELS.join(", ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setInterfaceMode("full")}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.32)] bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)] px-4 py-2 text-sm font-medium text-[#06111f]"
          >
            <Layers3 className="h-4 w-4" />
            Switch to Full Mode
          </button>
          <Link
            href="/dashboard/control"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-4 py-2 text-sm text-[#dbeafe]"
          >
            Advanced Settings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardSpaContent({
  pathname,
  fallback,
  forcedPanel,
}: {
  pathname?: string | null;
  fallback?: ReactNode;
  forcedPanel?: string | null;
}) {
  const setActiveTab = useMissionControl((state) => state.setActiveTab);
  const interfaceMode = useMissionControl((state) => state.interfaceMode);
  const boot = useMissionControl((state) => state.boot);
  const bootStarted = useMissionControl((state) => state.bootStarted);
  const booting = useMissionControl((state) => state.booting);
  const bootComplete = useMissionControl((state) => state.bootComplete);

  const panel = useMemo(() => {
    if (forcedPanel) {
      return normalizeDashboardPanel(forcedPanel)
    }

    return getDashboardPanelForPath(pathname) ?? null
  }, [forcedPanel, pathname]);

  useEffect(() => {
    if (!panel) {
      return;
    }

    setActiveTab(panel || DEFAULT_DASHBOARD_PANEL);

    if (!bootStarted && !bootComplete) {
      void boot();
    }
  }, [boot, bootComplete, bootStarted, panel, setActiveTab]);

  if (!panel) {
    return <>{fallback ?? null}</>;
  }

  const showEssentialGate = interfaceMode === "essential" && !isEssentialDashboardPanel(panel);

  return (
    <div className="relative min-h-[28rem]">
      <ErrorBoundary key={panel}>
        {showEssentialGate ? <EssentialModeNudge panel={panel} /> : <DashboardPanelView panel={panel} />}
      </ErrorBoundary>
      {(booting || (bootStarted && !bootComplete)) && <BootOverlay />}
    </div>
  );
}
