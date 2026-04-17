"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  FolderOpen,
  Globe,
  Menu,
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
import {
  panelHref,
  useDashboardPathname,
  useNavigateToPanel,
  usePrefetchPanel,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

import {
  ALL_DASHBOARD_NAV_ITEMS,
  DASHBOARD_NAV_GROUPS,
  getDashboardNavHref,
  isDashboardNavItemActive,
} from "./dashboardNav";

interface DashboardShellProps {
  children: ReactNode;
  spaShellEnabled?: boolean;
}

interface DashboardNavProps {
  navigateToPanel: (panel: string) => void;
  prefetchPanel: (panel: string) => void;
  onNavigate?: () => void;
  pathname: string;
}

const DASHBOARD_NAV_PANELS: Partial<Record<(typeof ALL_DASHBOARD_NAV_ITEMS)[number]["key"], string>> = {
  home: "overview",
  agents: "agents",
  sessions: "chat",
  analytics: "tokens",
  control: "settings",
}

function getDashboardNavPanel(key: (typeof ALL_DASHBOARD_NAV_ITEMS)[number]["key"]) {
  return DASHBOARD_NAV_PANELS[key] ?? key
}

function DashboardNav({ navigateToPanel, onNavigate, pathname, prefetchPanel }: DashboardNavProps) {
  return (
    <nav className="space-y-3">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.key} className="space-y-1">
          {group.title ? (
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7f97bf]">
              {group.title}
            </p>
          ) : null}

          {group.items.map((item) => {
            const isActive = isDashboardNavItemActive(pathname, item);
            const panel = getDashboardNavPanel(item.key);
            const href = pathname.startsWith("/dashboard")
              ? panelHref(panel)
              : getDashboardNavHref(pathname, item);

            return (
              <Link
                key={`${group.key}-${item.title}`}
                href={href}
                onClick={(event) => {
                  if (pathname.startsWith("/dashboard")) {
                    event.preventDefault();
                    navigateToPanel(panel);
                  }

                  onNavigate?.();
                }}
                onFocus={() => prefetchPanel(panel)}
                onMouseEnter={() => prefetchPanel(panel)}
                title={item.description}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(59,130,246,0.18)_0%,rgba(29,78,216,0.24)_100%)] text-[#f4f8ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-[#a8bfdc] hover:bg-[#152033] hover:text-[#f4f8ff]",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-1 w-[3px] rounded-full bg-[#60a5fa]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition-colors",
                    isActive
                      ? "bg-[#162235] text-[#dbeafe]"
                      : "bg-[#0f1728] text-[#7f97bf] group-hover:text-[#dbeafe]",
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

export function DashboardShell({ children, spaShellEnabled }: DashboardShellProps) {
  const pathname = useDashboardPathname(Boolean(spaShellEnabled));
  const router = useRouter();
  const navigateToPanel = useNavigateToPanel();
  const prefetchPanel = usePrefetchPanel();
  const { status, isDesktop, platformReady, refetch } = useDesktopStatus();
  const { currentWindow, openPreferences, updateCurrentWindow } = useDesktopWindow();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clockLabel, setClockLabel] = useState("--:--");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
              tone: "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.14)] text-[#dbeafe]",
            },
          ]
        : [
            {
              label: status.mode === "local" ? "Local" : status.mode === "hosted" ? "Hosted" : "Unknown",
              tone:
                status.mode === "local"
                  ? "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.14)] text-[#dbeafe]"
                  : "border-[rgba(191,219,254,0.12)] bg-[#111827] text-[#bfdbfe]",
            },
            {
              label: `Gateway ${status.openclaw?.health || "unknown"}`,
              tone:
                status.openclaw?.health === "healthy" || status.openclaw?.health === "running"
                  ? "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.14)] text-[#dbeafe]"
                  : "border-[rgba(96,165,250,0.2)] bg-[rgba(37,99,235,0.12)] text-[#bfdbfe]",
            },
            {
              label: status.faramesh?.available ? "Governance Active" : "Governance Idle",
              tone: status.faramesh?.available
                ? "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.14)] text-[#dbeafe]"
                : "border-[rgba(191,219,254,0.12)] bg-[#111827] text-[#b6caea]",
            },
            {
              label: `Bridge ${status.bridge?.state || "unknown"}`,
              tone:
                status.bridge?.state === "ready"
                  ? "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.14)] text-[#dbeafe]"
                  : status.bridge?.state === "starting" || status.bridge?.state === "restarting"
                    ? "border-[rgba(96,165,250,0.24)] bg-[rgba(37,99,235,0.12)] text-[#bfdbfe]"
                    : "border-[rgba(215,125,99,0.26)] bg-[rgba(69,29,24,0.42)] text-[#ffc6b5]",
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
  const showHomeAction = pathname !== "/dashboard";
  const showSetupAction = !isDesktop && pathname !== "/dashboard/control";
  const showWorkspaceAction = isDesktop && Boolean(status.assistant?.workspace);
  const stackActionLabel = isDesktop
    ? status.localControlPlane?.ready
      ? "Advanced Control"
      : "Start Local Stack"
    : "Open Setup";
  const StackActionIcon = isDesktop
    ? status.localControlPlane?.ready
      ? Globe
      : Server
    : Globe;

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
        router.push("/dashboard/control");
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
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-[rgba(191,219,254,0.12)] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_42%),linear-gradient(180deg,#172235_0%,#0a0f18_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(2,2,5,0.28)]">
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
          <p className="truncate font-[family:var(--font-site-display)] text-[1.08rem] font-semibold tracking-[-0.04em] text-[#f4f8ff]">
            MUTX
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">Operator Console</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto border-t border-[rgba(191,219,254,0.08)] p-3">
      <div className="rounded-[24px] border border-[rgba(191,219,254,0.1)] bg-[linear-gradient(180deg,#121a29_0%,#0a0f18_100%)] px-3.5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#93c5fd]">
            Operator memo
          </p>
          <span className="rounded-full border border-[rgba(191,219,254,0.12)] bg-[#0f1728] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#dbeafe]">
            {isDesktop ? "desktop" : "web"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#dbe7f8]">
          {isDesktop
            ? status.user?.name || "Connect this machine to an operator account"
            : "Desktop identity and machine-local actions appear here inside MUTX.app."}
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#9bb4d6]">
          {status.user?.email || "setup pending"}
        </p>

        <div className="mt-4 space-y-2 text-xs text-[#c8daf4]">
          <div className="flex items-center justify-between border-t border-[rgba(191,219,254,0.08)] pt-3">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#60a5fa]" />
              Gateway
            </span>
            <span className="text-[#9bb4d6]">{status.openclaw?.health || "unknown"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#7dd3fc]" />
              Governance
            </span>
            <span className="text-[#9bb4d6]">{status.faramesh?.available ? "active" : "idle"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-[#93c5fd]" />
              Local stack
            </span>
            <span className="text-[#9bb4d6]">{status.localControlPlane?.ready ? "online" : "stopped"}</span>
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
      className="dashboard-app min-h-screen bg-[#070b13] text-[#f4f8ff]"
      style={
        isDesktop
          ? {
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
            }
          : undefined
      }
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_18%),linear-gradient(180deg,transparent,rgba(0,0,0,0.34))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(191,219,254,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(191,219,254,0.018)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.06]" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setMobileOpen(false)} />

          <aside className="absolute left-0 top-0 flex h-full w-80 flex-col border-r border-[rgba(191,219,254,0.08)] bg-[#0b1020] shadow-2xl transition-transform">
            <div className="flex items-center justify-between border-b border-[rgba(191,219,254,0.08)] px-4 py-4">
              <div className="min-w-0">{sidebarBrand}</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-[14px] border border-[rgba(191,219,254,0.12)] bg-[#101722] p-2 text-[#dbeafe]"
                aria-label="Close dashboard sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <DashboardNav
                navigateToPanel={navigateToPanel}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
                prefetchPanel={prefetchPanel}
              />
            </div>
            {sidebarFooter}
          </aside>
        </div>
      ) : null}

      <div className="relative p-2 sm:p-3">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[36px] border border-[rgba(191,219,254,0.12)] bg-[linear-gradient(180deg,#0f1728_0%,#070b13_100%)] shadow-[0_38px_120px_rgba(2,2,5,0.58)]">
          <div className="flex h-12 items-center justify-between border-b border-[rgba(191,219,254,0.08)] bg-[linear-gradient(180deg,#141f33_0%,#0d1422_100%)] px-4">
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[14px] border border-[rgba(191,219,254,0.12)] bg-[#101722] text-[#dbeafe] lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold tracking-[0.08em] text-[#f4f8ff]">
                    {activeItem?.title || "Dashboard"}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[#93c5fd]">
                    {activeItem?.group === "home" ? "Mission Control" : activeItem?.group || "Operator"}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-3 py-1 text-[11px] text-[#bfdbfe]">
                {status.user?.email || "desktop session"}
              </div>
              <div className="rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-3 py-1 font-[family:var(--font-mono)] text-[11px] text-[#dbeafe]">
                {clockLabel}
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-1.5rem-3rem)]">
            <aside className="hidden w-[290px] shrink-0 flex-col border-r border-[rgba(191,219,254,0.08)] bg-[linear-gradient(180deg,#101722_0%,#0a0f18_100%)] lg:flex">
              <div className="border-b border-[rgba(191,219,254,0.08)] px-4 py-5">{sidebarBrand}</div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <DashboardNav
                  navigateToPanel={navigateToPanel}
                  pathname={pathname}
                  prefetchPanel={prefetchPanel}
                />
              </div>
              {sidebarFooter}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#0d1422_0%,#070b13_100%)]">
              <header className="border-b border-[rgba(191,219,254,0.08)] bg-[#0f1728]/92 px-3 py-4 backdrop-blur-xl sm:px-4 lg:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#93c5fd]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.12)] px-2.5 py-1 text-[#dbeafe]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {shellCopy.eyebrow}
                      </span>
                      <span>{activeItem?.group === "home" ? "Mission Control" : activeItem?.group || "Operator"}</span>
                    </div>

                    <div className="max-w-4xl">
                      <h1 className="font-[family:var(--font-site-display)] text-[1.6rem] leading-[0.98] tracking-[-0.07em] text-[#f4f8ff] sm:text-[1.95rem]">
                        {shellCopy.title}
                      </h1>
                      <p className="mt-2 text-[13px] leading-6 text-[#a9bfde]">
                        {shellCopy.detail}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <span className="rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-2.5 py-1 text-[#c8daf4]">
                        {status.user?.email || "operator session"}
                      </span>
                      <span className="rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-2.5 py-1 text-[#c8daf4]">
                        {activeItem?.title || "Dashboard"}
                      </span>
                      {activeItem?.key &&
                      activeItem.key !== "home" &&
                      !DASHBOARD_NAV_GROUPS.some((group) =>
                        group.items.some((item) => item.key === activeItem.key),
                      ) ? (
                        <span className="rounded-full border border-[rgba(96,165,250,0.24)] bg-[rgba(59,130,246,0.14)] px-2.5 py-1 text-[#dbeafe]">
                          preview route
                        </span>
                      ) : null}
                      {shellChips.map((chip) => (
                        <span
                          key={chip.label}
                          className={`rounded-full border px-2.5 py-1 ${chip.tone}`}
                        >
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:max-w-[28rem] xl:justify-end">
                    {showHomeAction ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("setup")}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-3.5 py-2 text-[12.5px] text-[#dbeafe]"
                      >
                        <Settings2 className="h-4 w-4 text-[#60a5fa]" />
                        Home
                      </button>
                    ) : null}
                    {isDesktop ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("tui")}
                        disabled={actionBusy === "tui"}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-3.5 py-2 text-[12.5px] text-[#dbeafe] disabled:opacity-50"
                      >
                        <TerminalSquare className="h-4 w-4 text-[#7dd3fc]" />
                        TUI
                      </button>
                    ) : null}
                    {showWorkspaceAction ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("workspace")}
                        disabled={actionBusy === "workspace"}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(191,219,254,0.12)] bg-[#101722] px-3.5 py-2 text-[12.5px] text-[#dbeafe] disabled:opacity-50"
                      >
                        <FolderOpen className="h-4 w-4 text-[#93c5fd]" />
                        Reveal Workspace
                      </button>
                    ) : null}
                    {isDesktop || showSetupAction ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("stack")}
                        disabled={actionBusy === "stack"}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.32)] bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)] px-3.5 py-2 text-[12.5px] font-medium text-[#06111f] disabled:opacity-50"
                      >
                        <StackActionIcon className="h-4 w-4" />
                        {stackActionLabel}
                      </button>
                    ) : null}
                  </div>
                </div>

                {actionError ? (
                  <div className="mt-3 rounded-[18px] border border-[rgba(215,125,99,0.3)] bg-[rgba(69,29,24,0.46)] px-3 py-2 text-xs text-[#ffd2c4]">
                    {actionError}
                  </div>
                ) : null}
              </header>

              <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>

              <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(191,219,254,0.08)] bg-[#0f1728] px-4 py-2.5 text-[11px] text-[#7f97bf]">
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
