"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";

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
                  "group relative flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(255,178,91,0.14)_0%,rgba(122,72,43,0.2)_100%)] text-[#fff3e2] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-[#bda890] hover:bg-[#251d18] hover:text-[#fff1df]",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-1 w-[3px] rounded-full bg-[#d4ab73]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition-colors",
                    isActive
                      ? "bg-[#3a2b20] text-[#fff0d9]"
                      : "bg-[#181311] text-[#8d7865] group-hover:text-[#fff0d9]",
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
  const router = useRouter();
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
              tone: "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]",
            },
          ]
        : [
            {
              label: status.mode === "local" ? "Local" : status.mode === "hosted" ? "Hosted" : "Unknown",
              tone:
                status.mode === "local"
                  ? "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]"
                  : "border-[rgba(255,233,204,0.12)] bg-[#16141a] text-[#e2c4a2]",
            },
            {
              label: `Gateway ${status.openclaw?.health || "unknown"}`,
              tone:
                status.openclaw?.health === "healthy" || status.openclaw?.health === "running"
                  ? "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]"
                  : "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]",
            },
            {
              label: status.faramesh?.available ? "Governance Active" : "Governance Idle",
              tone: status.faramesh?.available
                ? "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]"
                : "border-[rgba(255,233,204,0.12)] bg-[#16141a] text-[#d2b79b]",
            },
            {
              label: `Bridge ${status.bridge?.state || "unknown"}`,
              tone:
                status.bridge?.state === "ready"
                  ? "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]"
                  : status.bridge?.state === "starting" || status.bridge?.state === "restarting"
                    ? "border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] text-[#ffd6a4]"
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
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] bg-[radial-gradient(circle_at_top,rgba(212,171,115,0.18),transparent_42%),linear-gradient(180deg,#1f1b24_0%,#0f0d12_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(2,2,5,0.28)]">
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
          <p className="truncate font-[family:var(--font-site-display)] text-[1.08rem] font-semibold tracking-[-0.04em] text-[#fff3e2]">
            MUTX
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#b09376]">Operator Console</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto border-t border-[rgba(255,233,204,0.08)] p-3">
      <div className="rounded-[24px] border border-[rgba(255,233,204,0.1)] bg-[linear-gradient(180deg,#17151b_0%,#0d0c10_100%)] px-3.5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b09376]">
            Operator memo
          </p>
          <span className="rounded-full border border-[rgba(255,233,204,0.12)] bg-[#111015] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#f0dcc0]">
            {isDesktop ? "desktop" : "web"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#ead8c1]">
          {isDesktop
            ? status.user?.name || "Connect this machine to an operator account"
            : "Desktop identity and machine-local actions appear here inside MUTX.app."}
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#b99e82]">
          {status.user?.email || "setup pending"}
        </p>

        <div className="mt-4 space-y-2 text-xs text-[#dcc7ae]">
          <div className="flex items-center justify-between border-t border-[rgba(255,233,204,0.08)] pt-3">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#d4ab73]" />
              Gateway
            </span>
            <span className="text-[#b99e82]">{status.openclaw?.health || "unknown"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#d6b07f]" />
              Governance
            </span>
            <span className="text-[#b99e82]">{status.faramesh?.available ? "active" : "idle"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-[#f0c49a]" />
              Local stack
            </span>
            <span className="text-[#b99e82]">{status.localControlPlane?.ready ? "online" : "stopped"}</span>
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
      className="dashboard-app min-h-screen bg-[#09080b] text-[#fff3e2]"
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,171,115,0.12),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(137,120,184,0.08),transparent_18%),linear-gradient(180deg,transparent,rgba(0,0,0,0.34))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,231,198,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,231,198,0.018)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.06]" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setMobileOpen(false)} />

          <aside className="absolute left-0 top-0 flex h-full w-80 flex-col border-r border-[rgba(255,233,204,0.08)] bg-[#100f13] shadow-2xl transition-transform">
            <div className="flex items-center justify-between border-b border-[rgba(255,233,204,0.08)] px-4 py-4">
              <div className="min-w-0">{sidebarBrand}</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-[14px] border border-[rgba(255,233,204,0.12)] bg-[#17151b] p-2 text-[#e7d6c1]"
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
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[36px] border border-[rgba(255,233,204,0.12)] bg-[linear-gradient(180deg,#111015_0%,#0a090d_100%)] shadow-[0_38px_120px_rgba(2,2,5,0.58)]">
          <div className="flex h-12 items-center justify-between border-b border-[rgba(255,233,204,0.08)] bg-[linear-gradient(180deg,#18161d_0%,#100f13_100%)] px-4">
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[14px] border border-[rgba(255,233,204,0.12)] bg-[#17151b] text-[#e7d6c1] lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold tracking-[0.08em] text-[#fff3e2]">
                    {activeItem?.title || "Dashboard"}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[#b09376]">
                    {activeItem?.group === "home" ? "Mission Control" : activeItem?.group || "Operator"}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-3 py-1 text-[11px] text-[#ceb79d]">
                {status.user?.email || "desktop session"}
              </div>
              <div className="rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-3 py-1 font-[family:var(--font-mono)] text-[11px] text-[#f0dcc0]">
                {clockLabel}
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-1.5rem-3rem)]">
            <aside className="hidden w-[290px] shrink-0 flex-col border-r border-[rgba(255,233,204,0.08)] bg-[linear-gradient(180deg,#141318_0%,#0d0c10_100%)] lg:flex">
              <div className="border-b border-[rgba(255,233,204,0.08)] px-4 py-5">{sidebarBrand}</div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <DashboardNav pathname={pathname} />
              </div>
              {sidebarFooter}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#121116_0%,#09080b_100%)]">
              <header className="border-b border-[rgba(255,233,204,0.08)] bg-[#111015]/92 px-3 py-4 backdrop-blur-xl sm:px-4 lg:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b09376]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,171,115,0.18)] bg-[rgba(212,171,115,0.08)] px-2.5 py-1 text-[#ffcd9f]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {shellCopy.eyebrow}
                      </span>
                      <span>{activeItem?.group === "home" ? "Mission Control" : activeItem?.group || "Operator"}</span>
                    </div>

                    <div className="max-w-4xl">
                      <h1 className="font-[family:var(--font-site-display)] text-[1.6rem] leading-[0.98] tracking-[-0.07em] text-[#fff3e2] sm:text-[1.95rem]">
                        {shellCopy.title}
                      </h1>
                      <p className="mt-2 text-[13px] leading-6 text-[#b1987e]">
                        {shellCopy.detail}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <span className="rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-2.5 py-1 text-[#d9c2a6]">
                        {status.user?.email || "operator session"}
                      </span>
                      <span className="rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-2.5 py-1 text-[#d9c2a6]">
                        {activeItem?.title || "Dashboard"}
                      </span>
                      {activeItem?.key &&
                      activeItem.key !== "home" &&
                      !DASHBOARD_NAV_GROUPS.some((group) =>
                        group.items.some((item) => item.key === activeItem.key),
                      ) ? (
                        <span className="rounded-full border border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.12)] px-2.5 py-1 text-[#ffd6a4]">
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
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("setup")}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-3.5 py-2 text-[12.5px] text-[#fff0dc]"
                    >
                      <Settings2 className="h-4 w-4 text-[#d4ab73]" />
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("tui")}
                      disabled={actionBusy === "tui"}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-3.5 py-2 text-[12.5px] text-[#e8d7c1] disabled:opacity-50"
                    >
                      <TerminalSquare className="h-4 w-4 text-[#d6b07f]" />
                      TUI
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("workspace")}
                      disabled={!status.assistant?.workspace || actionBusy === "workspace"}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,233,204,0.12)] bg-[#141318] px-3.5 py-2 text-[12.5px] text-[#e8d7c1] disabled:opacity-50"
                    >
                      <FolderOpen className="h-4 w-4 text-[#f0c49a]" />
                      Reveal Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => void runDesktopAction("stack")}
                      disabled={actionBusy === "stack"}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,171,115,0.28)] bg-[linear-gradient(180deg,#f2dfc4_0%,#c89b62_100%)] px-3.5 py-2 text-[12.5px] font-medium text-[#0f0d11] disabled:opacity-50"
                    >
                      {status.localControlPlane?.ready ? <Globe className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                      {status.localControlPlane?.ready ? "Advanced Control" : "Start Local Stack"}
                    </button>
                  </div>
                </div>

                {actionError ? (
                  <div className="mt-3 rounded-[18px] border border-[rgba(215,125,99,0.3)] bg-[rgba(69,29,24,0.46)] px-3 py-2 text-xs text-[#ffd2c4]">
                    {actionError}
                  </div>
                ) : null}
              </header>

              <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>

              <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(255,233,204,0.08)] bg-[#111015] px-4 py-2.5 text-[11px] text-[#aa8f74]">
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
