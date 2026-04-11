"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Bell,
  FolderOpen,
  Globe,
  Menu,
  RotateCcw,
  Server,
  Settings2,
  Shield,
  Sparkles,
  TerminalSquare,
  X,
} from "lucide-react";

import { DesktopWindowShell } from "@/components/desktop/DesktopWindowShell";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/components/dashboard/livePrimitives";
import { getResumeVisit, trackDashboardVisit, type DashboardVisitRecord } from "@/components/dashboard/returnLoopState";

import {
  ALL_DASHBOARD_NAV_ITEMS,
  DASHBOARD_NAV_GROUPS,
  getDashboardNavHref,
  isDashboardNavItemActive,
} from "./dashboardNav";

interface DashboardShellProps {
  children: ReactNode;
}

interface DashboardNavProps {
  onNavigate?: () => void;
  pathname: string;
}

function DashboardNav({ onNavigate, pathname }: DashboardNavProps) {
  return (
    <nav className="space-y-3">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.key} className="space-y-1">
          {group.title ? (
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f7a88]">
              {group.title}
            </p>
          ) : null}

          {group.items.map((item) => {
            const isActive = isDashboardNavItemActive(pathname, item);
            const href = getDashboardNavHref(pathname, item);

            return (
              <Link
                key={`${group.key}-${item.title}`}
                href={href}
                onClick={onNavigate}
                title={item.description}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(97,129,157,0.26)_0%,rgba(55,71,87,0.22)_100%)] text-[#f5f7fa] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-[#9ba8b8] hover:bg-[#151c24] hover:text-[#f3f5f8]",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-1 w-[3px] rounded-full bg-[#93dbff]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                    isActive
                      ? "bg-[#223140] text-[#e7eef6]"
                      : "bg-[#0f151c] text-[#6b7481] group-hover:text-[#dce4ee]",
                  )}
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium">{item.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, isDesktop, platformReady, refetch } = useDesktopStatus();
  const { currentWindow, openPreferences, updateCurrentWindow } = useDesktopWindow();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clockLabel, setClockLabel] = useState("--:--");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resumeVisit, setResumeVisit] = useState<DashboardVisitRecord | null>(null);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const syncClock = () => setClockLabel(formatter.format(new Date()));
    syncClock();
    const timer = window.setInterval(syncClock, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const query = searchParams?.toString();
    const nextState = trackDashboardVisit(pathname, query ? `?${query}` : "");
    setResumeVisit(getResumeVisit(nextState.visits, pathname));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const shellCopy = useMemo(() => {
    if (!platformReady) {
      return {
        eyebrow: "shell bootstrap",
        title: "Resolving native operator context",
        detail: "Checking whether this session is running inside MUTX.app and syncing the latest desktop state.",
      };
    }

    if (!isDesktop) {
      return {
        eyebrow: "web shell",
        title: "Canonical MUTX operator surface",
        detail: "Desktop-only actions stay gated until this session is running inside MUTX.app.",
      };
    }

    if (!status.authenticated) {
      return {
        eyebrow: "mission control",
        title: "The home surface is now the setup surface",
        detail: "Use /dashboard to sync identity, runtime, and the local desktop contract from one native shell.",
      };
    }

    if (!status.assistant?.found) {
      return {
        eyebrow: status.mode === "local" ? "local workspace" : "hosted workspace",
        title: "Bind the first assistant from mission control",
        detail: "Stay on /dashboard to drive runtime choice and assistant setup, then move into advanced control only when needed.",
      };
    }

    if (status.mode === "local" && !status.localControlPlane?.ready) {
      return {
        eyebrow: "local runtime",
        title: `${status.assistant.name} is ready, but the local stack is offline`,
        detail: "Bring the control plane online to turn this machine into an active operator seat.",
      };
    }

    return {
      eyebrow: status.mode === "local" ? "desktop operator" : "hosted operator",
      title: `${status.assistant.name || "Assistant"} is wired into the control plane`,
      detail:
        status.openclaw?.gatewayUrl ||
        "Desktop actions, runtime health, and governance are available from this shell.",
    };
  }, [isDesktop, platformReady, status]);

  const shellChips = useMemo(
    () =>
      !platformReady
        ? [
            {
              label: "Shell Resolving",
              tone: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
            },
          ]
        : [
            {
              label: status.mode === "local" ? "Local" : status.mode === "hosted" ? "Hosted" : "Unknown",
              tone:
                status.mode === "local"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
            },
            {
              label: `Gateway ${status.openclaw?.health || "unknown"}`,
              tone:
                status.openclaw?.health === "healthy" || status.openclaw?.health === "running"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-200",
            },
            {
              label: status.faramesh?.available ? "Governance Active" : "Governance Idle",
              tone: status.faramesh?.available
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-slate-500/20 bg-slate-500/10 text-slate-300",
            },
            {
              label: `Bridge ${status.bridge?.state || "unknown"}`,
              tone:
                status.bridge?.state === "ready"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : status.bridge?.state === "starting" || status.bridge?.state === "restarting"
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                    : "border-rose-400/20 bg-rose-400/10 text-rose-200",
            },
          ],
    [platformReady, status]
  );

  const activeItem = useMemo(
    () =>
      ALL_DASHBOARD_NAV_ITEMS.find((item) => isDashboardNavItemActive(pathname, item)) ??
      ALL_DASHBOARD_NAV_ITEMS[0],
    [pathname],
  );

  async function runDesktopAction(action: "setup" | "tui" | "workspace" | "stack") {
    setActionError(null);
    setActionBusy(action);

    try {
      if (action === "setup") {
        if (window.mutxDesktop?.isDesktop) {
          await updateCurrentWindow({
            route: "/dashboard",
            payload: {
              ...currentWindow.currentWindow.payload,
              pane: "overview",
            },
          });
        } else {
          router.push("/dashboard");
        }
        return;
      }

      if (!window.mutxDesktop?.isDesktop) {
        return;
      }

      if (action === "tui") {
        await window.mutxDesktop.bridge.runtime.openSurface("tui");
      }

      if (action === "workspace" && status.assistant?.workspace) {
        await window.mutxDesktop.bridge.system.revealInFinder(status.assistant.workspace);
      }

      if (action === "stack") {
        if (status.localControlPlane?.ready) {
          if (window.mutxDesktop?.isDesktop) {
            await openPreferences("runtime");
          } else {
            router.push("/dashboard/control");
          }
        } else {
          const result = await window.mutxDesktop.bridge.controlPlane.start();
          if (!result.success) {
            throw new Error(result.error || "Could not start local control plane");
          }
          await refetch();
        }
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Desktop action failed");
    } finally {
      setActionBusy(null);
    }
  }

  const sidebarBrand = (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#34404f] bg-[radial-gradient(circle_at_top,rgba(125,214,255,0.14),transparent_42%),linear-gradient(180deg,#202a36_0%,#11171f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(2,6,12,0.22)]">
        <Image
          src="/logo-transparent-v2.png"
          alt="MUTX"
          width={24}
          height={24}
          className="h-6 w-6 object-contain opacity-95"
          priority
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="truncate font-[family:var(--font-site-body)] text-[0.98rem] font-semibold tracking-[0.12em] text-[#f4f7fb]">
            MUTX
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#7b899a]">Operator Console</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto space-y-3 border-t border-[#202833] p-3">
      <div className="rounded-[18px] border border-[#2b3948] bg-[linear-gradient(180deg,#1a222d_0%,#10161d_100%)] px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b99aa]">Operator</p>
          <span className="rounded-full border border-[#3a495b] bg-[#10161d] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#d0d9e2]">
            {isDesktop ? (status.user?.email || "setup pending") : "web mode"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#d8e0e9]">
          {isDesktop
            ? status.user?.name || "Connect this machine to an operator account"
            : "Desktop identity and machine-local actions appear here inside MUTX.app."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em]">
          {shellChips.map((chip) => (
            <span key={chip.label} className={`rounded-md border px-2 py-1 ${chip.tone}`}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      {resumeVisit ? (
        <div className="rounded-[18px] border border-[#2b3948] bg-[linear-gradient(180deg,#161d26_0%,#0f141a_100%)] px-3.5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b99aa]">Resume Session</p>
            <RotateCcw className="h-3.5 w-3.5 text-[#8fd8ff]" />
          </div>
          <p className="mt-2 text-sm font-medium text-[#edf4fb]">{resumeVisit.title}</p>
          <p className="mt-1 text-xs leading-5 text-[#9fb0c2]">
            Last thing you were doing {formatRelativeTime(resumeVisit.visitedAt)}{resumeVisit.context ? ` · ${resumeVisit.context}` : ''}
          </p>
          <Link
            href={resumeVisit.href}
            className="mt-3 inline-flex items-center gap-2 rounded-[12px] border border-cyan-400/24 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/14"
          >
            Resume
            <RotateCcw className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#2b3948] bg-[linear-gradient(180deg,#161d26_0%,#0f141a_100%)] px-3.5 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b99aa]">Machine Runtime</p>
        <div className="mt-3 space-y-2 text-xs text-[#cfd6df]">
          <div className="flex items-center justify-between rounded-[12px] border border-[#24303d] bg-[#0d1218] px-3 py-2.5">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-[#8fc7ef]" /> Gateway</span>
            <span className="text-[#9ba5b2]">{status.openclaw?.health || "unknown"}</span>
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#24303d] bg-[#0d1218] px-3 py-2.5">
            <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-[#8ad0b4]" /> Governance</span>
            <span className="text-[#9ba5b2]">{status.faramesh?.available ? "active" : "idle"}</span>
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#24303d] bg-[#0d1218] px-3 py-2.5">
            <span className="flex items-center gap-2"><Server className="h-3.5 w-3.5 text-[#9fb5ff]" /> Local Stack</span>
            <span className="text-[#9ba5b2]">{status.localControlPlane?.ready ? "online" : "stopped"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (platformReady && isDesktop) {
    return <DesktopWindowShell>{children}</DesktopWindowShell>;
  }

  return (
    <div
      className="dashboard-app min-h-screen bg-[#06080d] text-[#edf1f6]"
      style={
        isDesktop
          ? {
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
            }
          : undefined
      }
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(138,216,255,0.08),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(255,189,102,0.06),transparent_18%),linear-gradient(180deg,transparent,rgba(0,0,0,0.34))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.07]" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setMobileOpen(false)} />

          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-[#222c37] bg-[#11171e] shadow-2xl transition-transform">
            <div className="flex items-center justify-between border-b border-[#222c37] px-4 py-4">
              <div className="min-w-0">{sidebarBrand}</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-[10px] border border-[#2f3b48] bg-[#141a21] p-2 text-[#d3dae4]"
                aria-label="Close dashboard sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <DashboardNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            {sidebarFooter}
          </aside>
        </div>
      ) : null}

      <div className="relative p-2 sm:p-3">
        <div className="mx-auto max-w-[1560px] overflow-hidden rounded-[24px] border border-[#26303a] bg-[#0f141a] shadow-[0_30px_120px_rgba(0,0,0,0.46)]">
          <div className="flex h-12 items-center justify-between border-b border-[#242c35] bg-[linear-gradient(180deg,#171d25_0%,#12171d_100%)] px-4">
            <div className="flex items-center gap-2.5">
              {isDesktop ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#2f3b48] bg-[#141a21] text-[#d3dae4] lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold tracking-[0.06em] text-[#f4f6f9]">
                  {activeItem?.title || "Dashboard"}
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-[#8d97a6]">
                  {activeItem?.group === "home" ? "Mission Control" : activeItem?.group || "Operator"}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-full border border-[#2c3947] bg-[#131920] px-3 py-1 text-[11px] text-[#aab3bf]">
                {status.user?.email || "desktop session"}
              </div>
              <div className="rounded-full border border-[#2c3947] bg-[#131920] px-3 py-1 font-[family:var(--font-mono)] text-[11px] text-[#c8d0da]">
                {clockLabel}
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-1.5rem-3rem)]">
            <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[#222c37] bg-[linear-gradient(180deg,#131922_0%,#0d1218_100%)] lg:flex">
              <div className="border-b border-[#222c37] px-4 py-4">{sidebarBrand}</div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <DashboardNav pathname={pathname} />
              </div>
              {sidebarFooter}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#10161d_0%,#0b1016_100%)]">
              <header className="border-b border-[#222c37] bg-[#121820]/94 px-3 py-3 backdrop-blur sm:px-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8791a0]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#2b3948] bg-[#10161d] px-2.5 py-1 text-[#9edfff]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {shellCopy.eyebrow}
                      </span>
                      <span className="rounded-full border border-[#2b3948] bg-[#10161d] px-2.5 py-1 text-[#b6c3d1]">
                        {status.user?.email || "operator session"}
                      </span>
                      <span className="rounded-full border border-[#2b3948] bg-[#10161d] px-2.5 py-1 text-[#b6c3d1]">
                        {activeItem?.title || "Dashboard"}
                      </span>
                    </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeItem?.key && activeItem.key !== "home" && !DASHBOARD_NAV_GROUPS.some((group) =>
                      group.items.some((item) => item.key === activeItem.key),
                    ) ? (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                        preview route
                      </span>
                    ) : null}
                    {shellChips.map((chip) => (
                      <span
                        key={chip.label}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${chip.tone}`}
                        >
                          {chip.label}
                        </span>
                      ))}
                      <p className="hidden text-[11.5px] text-[#8f99a8] xl:block">{shellCopy.detail}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("setup")}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#2f3c49] bg-[#10161d] px-3 py-2 text-[12.5px] text-[#eef2f7]"
                    >
                      <Settings2 className="h-4 w-4 text-[#9cc8e8]" />
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("tui")}
                      disabled={actionBusy === "tui"}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#2f3c49] bg-[#10161d] px-3 py-2 text-[12.5px] text-[#dbe2eb] disabled:opacity-50"
                    >
                      <TerminalSquare className="h-4 w-4 text-[#8ad0b4]" />
                      TUI
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("workspace")}
                      disabled={!status.assistant?.workspace || actionBusy === "workspace"}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#2f3c49] bg-[#10161d] px-3 py-2 text-[12.5px] text-[#dbe2eb] disabled:opacity-50"
                    >
                      <FolderOpen className="h-4 w-4 text-[#d8bf86]" />
                      Reveal Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("stack")}
                      disabled={actionBusy === "stack"}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#597387] bg-[linear-gradient(180deg,#24303c_0%,#16202a_100%)] px-3.5 py-2 text-[12.5px] font-medium text-[#f4f7fb] disabled:opacity-50"
                    >
                      {status.localControlPlane?.ready ? <Globe className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                      {status.localControlPlane?.ready ? "Advanced Control" : "Start Local Stack"}
                    </button>
                    <div className="hidden items-center gap-2 rounded-[12px] border border-[#2f3c49] bg-[#10161d] px-3 py-2 text-[11.5px] text-[#a8b1bc] 2xl:inline-flex">
                      <Bell className="h-4 w-4 text-[#7f8896]" />
                      {activeItem?.description || "Operator route"}
                    </div>
                  </div>
                </div>

                {actionError ? (
                  <div className="mt-3 rounded-[14px] border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {actionError}
                  </div>
                ) : null}
              </header>

              <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">{children}</main>

              <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#222c37] bg-[#10161d] px-4 py-2 text-[11px] text-[#97a0ad]">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span>{activeItem?.title || "Dashboard"}</span>
                  <span>{status.mode === "local" ? "local runtime" : status.mode === "hosted" ? "hosted runtime" : "runtime unknown"}</span>
                  <span>{status.bridge.pythonCommand || "python unresolved"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{status.uiServer?.state || "ui server unknown"}</span>
                  <span>{status.openclaw?.gatewayUrl || "gateway unavailable"}</span>
                  <span>{status.localControlPlane?.ready ? "stack online" : "stack offline"}</span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
