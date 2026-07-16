"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { dashboardTokens } from "./tokens";
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

interface DashboardShellChip {
  label: string;
  tone: string;
  style?: CSSProperties;
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
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7e8e86]">
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 px-3.5 py-3 text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-[rgba(255,77,0,0.16)] text-[#f3f0e8]"
                    : "text-[#a8aaa4] hover:bg-[#171715] hover:text-[#f3f0e8]",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-1 w-[3px] rounded-full bg-[#ff4d00]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center transition-colors",
                    isActive
                      ? "bg-[#171715] text-[#ff4d00]"
                      : "bg-[#11110f] text-[#7e8e86] group-hover:text-[#f3f0e8]",
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
  const appShellRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeDrawerRef = useRef<HTMLButtonElement>(null);

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

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appShell = appShellRef.current;
    const previousOverflow = document.body.style.overflow;
    appShell?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeDrawerRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute("disabled"));

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      appShell?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mobileOpen]);

  const shellCopy = useMemo(() => {
    if (!platformReady) {
      return {
        eyebrow: "starting up",
        title: "Opening your workspace",
        detail: "Checking whether this session is running inside MUTX.app and syncing the latest desktop state.",
      };
    }

    if (!isDesktop) {
      return {
        eyebrow: "web workspace",
        title: "MUTX operator workspace",
        detail: "Review runs, deployments, and policy from the browser. Machine-local actions stay in the desktop app.",
      };
    }

    if (!status.authenticated) {
      return {
        eyebrow: "setup",
        title: "Finish setup from the dashboard",
        detail: "Use /dashboard to sync identity, runtime, and the local desktop contract from one native shell.",
      };
    }

    if (!status.assistant?.found) {
      return {
        eyebrow: status.mode === "local" ? "local workspace" : "hosted workspace",
        title: "Connect the first assistant",
        detail: "Stay on /dashboard to drive runtime choice and assistant setup, then move into advanced control only when needed.",
      };
    }

    if (status.mode === "local" && !status.localControlPlane?.ready) {
      return {
        eyebrow: "local runtime",
        title: `${status.assistant.name} is ready, but the local stack is offline`,
        detail: "Start the local stack before running desktop-only actions from this machine.",
      };
    }

    return {
      eyebrow: status.mode === "local" ? "desktop workspace" : "hosted workspace",
      title: `${status.assistant.name || "Assistant"} is wired into the control plane`,
      detail:
        status.openclaw?.gatewayUrl ||
        "Desktop actions, runtime health, and governance are available from this shell.",
    };
  }, [isDesktop, platformReady, status]);

  const shellChips = useMemo<DashboardShellChip[]>(
    () =>
      !platformReady
        ? [
            {
              label: "Shell Resolving",
              tone: "border-[rgba(255, 77, 0,0.28)] bg-[rgba(255, 77, 0,0.14)] text-[#f3f0e8]",
            },
          ]
        : !isDesktop
          ? [
              {
                label: "Web workspace",
                tone: "border-[rgba(233,241,232,0.12)]",
                style: {
                  backgroundColor: dashboardTokens.bgSurface,
                  color: dashboardTokens.textPrimary,
                },
              },
              {
                label: status.user?.email ? "Signed in" : "Not signed in",
                tone: status.user?.email
                  ? "border-[rgba(255,77,0,0.28)] bg-[rgba(255,77,0,0.14)] text-[#f3f0e8]"
                  : "border-[rgba(233,241,232,0.12)]",
                style: status.user?.email
                  ? undefined
                  : {
                      backgroundColor: dashboardTokens.bgSurface,
                      color: dashboardTokens.textSubtle,
                    },
              },
            ]
          : [
            {
              label: status.mode === "local" ? "Local" : status.mode === "hosted" ? "Hosted" : "Unknown",
              tone:
                status.mode === "local"
                  ? "border-[rgba(255, 77, 0,0.28)] bg-[rgba(255, 77, 0,0.14)] text-[#f3f0e8]"
                  : "border-[rgba(233,241,232,0.12)]",
              style:
                status.mode === "local"
                  ? undefined
                  : {
                      backgroundColor: dashboardTokens.bgSurface,
                      color: dashboardTokens.textLabel,
                    },
            },
            {
              label: `Gateway ${status.openclaw?.health || "unknown"}`,
              tone:
                status.openclaw?.health === "healthy" || status.openclaw?.health === "running"
                  ? "border-[rgba(255, 77, 0,0.28)] bg-[rgba(255, 77, 0,0.14)] text-[#f3f0e8]"
                  : "border-[rgba(255, 77, 0,0.2)] bg-[rgba(114,173,18,0.12)] text-[#ffb199]",
            },
            {
              label: status.faramesh?.available ? "Governance Active" : "Governance Idle",
              tone: status.faramesh?.available
                ? "border-[rgba(255, 77, 0,0.28)] bg-[rgba(255, 77, 0,0.14)] text-[#f3f0e8]"
                : "border-[rgba(233,241,232,0.12)]",
              style: status.faramesh?.available
                ? undefined
                : {
                    backgroundColor: dashboardTokens.bgSurface,
                    color: dashboardTokens.textSubtle,
                  },
            },
            {
              label: `Bridge ${status.bridge?.state || "unknown"}`,
              tone:
                status.bridge?.state === "ready"
                  ? "border-[rgba(255, 77, 0,0.28)] bg-[rgba(255, 77, 0,0.14)] text-[#f3f0e8]"
                  : status.bridge?.state === "starting" || status.bridge?.state === "restarting"
                    ? "border-[rgba(255, 77, 0,0.24)] bg-[rgba(114,173,18,0.12)] text-[#ffb199]"
                    : "border-[rgba(215,125,99,0.26)] bg-[rgba(69,29,24,0.42)] text-[#ffc6b5]",
            },
          ],
    [isDesktop, platformReady, status]
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
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgba(233,241,232,0.12)] bg-[#11110f]">
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
          <p className="truncate font-[family:var(--font-site-display)] text-[1.08rem] font-semibold tracking-[-0.04em] text-[#f3f0e8]">
            MUTX
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#ffb199]">Workspace</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto border-t border-[rgba(233,241,232,0.08)] p-3">
      <div className="border border-[rgba(233,241,232,0.1)] bg-[#11110f] px-3.5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffb199]">
            Runtime status
          </p>
          <span className="rounded-full border border-[rgba(233,241,232,0.12)] bg-[#11110f] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#f3f0e8]">
            {isDesktop ? "desktop" : "web"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: dashboardTokens.textSecondary }}>
          {isDesktop
            ? status.user?.name || "Connect this machine to a workspace account"
            : "Desktop identity and machine-local actions appear here inside MUTX.app."}
        </p>
        <p className="mt-1 text-[12px] leading-5" style={{ color: dashboardTokens.textMuted }}>
          {status.user?.email || "setup pending"}
        </p>

        <div className="mt-4 space-y-2 text-xs" style={{ color: dashboardTokens.textSecondary }}>
          {isDesktop ? (
            <>
              <div className="flex items-center justify-between border-t border-[rgba(233,241,232,0.08)] pt-3">
                <span className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#ff4d00]" />
                  Gateway
                </span>
                <span style={{ color: dashboardTokens.textMuted }}>{status.openclaw?.health || "unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" style={{ color: dashboardTokens.statusActive }} />
                  Governance
                </span>
                <span style={{ color: dashboardTokens.textMuted }}>{status.faramesh?.available ? "active" : "idle"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-[#ffb199]" />
                  Local stack
                </span>
                <span style={{ color: dashboardTokens.textMuted }}>{status.localControlPlane?.ready ? "online" : "stopped"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-t border-[rgba(233,241,232,0.08)] pt-3">
                <span>Account</span>
                <span style={{ color: dashboardTokens.textMuted }}>{status.user?.email ? "signed in" : "not signed in"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Desktop controls</span>
                <span style={{ color: dashboardTokens.textMuted }}>MUTX.app only</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (platformReady && isDesktop) {
    return <DesktopWindowShell>{children}</DesktopWindowShell>;
  }

  return (
    <div
      className="dashboard-app min-h-screen"
      style={{
        backgroundColor: dashboardTokens.bgCanvas,
        color: dashboardTokens.textPrimary,
        ...(isDesktop
          ? {
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
            }
          : undefined),
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[#0a0a09]" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setMobileOpen(false)} />

          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="absolute left-0 top-0 flex h-full w-80 flex-col border-r border-[rgba(233,241,232,0.08)] bg-[#0a0a09] shadow-2xl transition-transform"
          >
            <div className="flex items-center justify-between border-b border-[rgba(233,241,232,0.08)] px-4 py-4">
              <div className="min-w-0">{sidebarBrand}</div>
              <button
                ref={closeDrawerRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(233,241,232,0.12)] bg-[#0b1210] p-0 text-[#f3f0e8]"
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

      <div ref={appShellRef} className="relative p-2 sm:p-3">
        <div className="mx-auto max-w-[1600px] overflow-hidden border border-[rgba(233,241,232,0.12)] bg-[#0a0a09]">
          <div className="flex h-12 items-center justify-between border-b border-[rgba(233,241,232,0.08)] bg-[#11110f] px-4">
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(233,241,232,0.12)] bg-[#0b1210] text-[#f3f0e8] lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold tracking-[0.08em] text-[#f3f0e8]">
                    {activeItem?.title || "Dashboard"}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[#ffb199]">
                    {activeItem?.group === "home" ? "Workspace" : activeItem?.group || "Dashboard"}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-3 py-1 text-[11px] text-[#ffb199]">
                {status.user?.email || (isDesktop ? "desktop session" : "not signed in")}
              </div>
              <div className="rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-3 py-1 font-[family:var(--font-mono)] text-[11px] text-[#f3f0e8]">
                {clockLabel}
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-1.5rem-3rem)] lg:h-[calc(100vh-1.5rem-3rem)] lg:min-h-0">
            <aside className="hidden w-[290px] shrink-0 flex-col border-r border-[rgba(233,241,232,0.08)] bg-[#070706] lg:flex">
              <div className="border-b border-[rgba(233,241,232,0.08)] px-4 py-5">{sidebarBrand}</div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <DashboardNav
                  navigateToPanel={navigateToPanel}
                  pathname={pathname}
                  prefetchPanel={prefetchPanel}
                />
              </div>
              {sidebarFooter}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-[#11110f]">
              <header className="border-b border-[rgba(233,241,232,0.08)] bg-[#11110f] px-3 py-4 sm:px-4 lg:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffb199]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255, 77, 0,0.2)] bg-[rgba(255, 77, 0,0.12)] px-2.5 py-1 text-[#f3f0e8]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {shellCopy.eyebrow}
                      </span>
                      <span>{activeItem?.group === "home" ? "Workspace" : activeItem?.group || "Dashboard"}</span>
                    </div>

                    <div className="max-w-4xl">
                      <p className="font-[family:var(--font-site-display)] text-[1.6rem] leading-[0.98] tracking-[-0.07em] text-[#f3f0e8] sm:text-[1.95rem]">
                        {shellCopy.title}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-[rgba(243,240,232,.72)]">
                        {shellCopy.detail}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <span
                        className="rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-2.5 py-1"
                        style={{ color: dashboardTokens.textSecondary }}
                      >
                        {status.user?.email || "session needed"}
                      </span>
                      <span
                        className="rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-2.5 py-1"
                        style={{ color: dashboardTokens.textSecondary }}
                      >
                        {activeItem?.title || "Dashboard"}
                      </span>
                      {activeItem?.key &&
                      activeItem.key !== "home" &&
                      !DASHBOARD_NAV_GROUPS.some((group) =>
                        group.items.some((item) => item.key === activeItem.key),
                      ) ? (
                        <span className="rounded-full border border-[rgba(255, 77, 0,0.24)] bg-[rgba(255, 77, 0,0.14)] px-2.5 py-1 text-[#f3f0e8]">
                          preview route
                        </span>
                      ) : null}
                      {shellChips.map((chip) => (
                        <span
                          key={chip.label}
                          className={`rounded-full border px-2.5 py-1 ${chip.tone}`}
                          style={chip.style}
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
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-3.5 py-2 text-[12.5px] text-[#f3f0e8]"
                      >
                        <Settings2 className="h-4 w-4 text-[#ff4d00]" />
                        Home
                      </button>
                    ) : null}
                    {isDesktop ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("tui")}
                        disabled={actionBusy === "tui"}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-3.5 py-2 text-[12.5px] text-[#f3f0e8] disabled:opacity-50"
                      >
                        <TerminalSquare className="h-4 w-4" style={{ color: dashboardTokens.statusActive }} />
                        TUI
                      </button>
                    ) : null}
                    {showWorkspaceAction ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("workspace")}
                        disabled={actionBusy === "workspace"}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[rgba(233,241,232,0.12)] bg-[#0b1210] px-3.5 py-2 text-[12.5px] text-[#f3f0e8] disabled:opacity-50"
                      >
                        <FolderOpen className="h-4 w-4 text-[#ffb199]" />
                        Reveal Workspace
                      </button>
                    ) : null}
                    {isDesktop || showSetupAction ? (
                      <button
                        type="button"
                        onClick={() => void runDesktopAction("stack")}
                        disabled={actionBusy === "stack"}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ff4d00] bg-[#ff4d00] px-3.5 py-2 text-[12.5px] font-medium text-[#0a0a09] disabled:opacity-50"
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

              <main id="main-content" className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>

              <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(233,241,232,0.08)] bg-[#11110f] px-4 py-2.5 text-[11px] text-[#7e8e86]">
                {isDesktop ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <span>{activeItem?.title || "Dashboard"}</span>
                    <span>{status.user?.email ? "browser account connected" : "sign in to load workspace data"}</span>
                  </>
                )}
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
