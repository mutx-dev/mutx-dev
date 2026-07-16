"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Menu, Search, Settings2, X } from "lucide-react";

import { DesktopWindowShell } from "@/components/desktop/DesktopWindowShell";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
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
  getDashboardNavPanel,
  isDashboardNavItemActive,
  type DashboardNavGroup,
} from "./dashboardNav";
import { DashboardCommandPalette } from "./DashboardCommandPalette";

interface DashboardShellProps {
  children: ReactNode;
  spaShellEnabled?: boolean;
}

interface DashboardNavProps {
  navigateToPanel: (panel: string) => void;
  pathname: string;
  prefetchPanel: (panel: string) => void;
  onNavigate?: () => void;
}

const GROUP_LABELS: Record<DashboardNavGroup["key"], string> = {
  home: "Workspace",
  core: "Operate",
  execution: "Inspect",
  admin: "Manage",
  support: "Extend",
};

function DashboardNav({
  navigateToPanel,
  pathname,
  prefetchPanel,
  onNavigate,
}: DashboardNavProps) {
  return (
    <nav className="space-y-7" aria-label="Dashboard navigation">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="mb-2 px-3 font-[family:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.2em] text-[#817f77]">
            {GROUP_LABELS[group.key]}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isDashboardNavItemActive(pathname, item);
              const panel = getDashboardNavPanel(item.key);
              const href = pathname.startsWith("/dashboard")
                ? panelHref(panel)
                : getDashboardNavHref(pathname, item);
              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={item.description}
                  onFocus={() => prefetchPanel(panel)}
                  onMouseEnter={() => prefetchPanel(panel)}
                  onClick={(event) => {
                    if (pathname.startsWith("/dashboard")) {
                      event.preventDefault();
                      navigateToPanel(panel);
                    }
                    onNavigate?.();
                  }}
                  className={cn(
                    "group relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-[#f2efe6] font-medium text-[#151512]"
                      : "text-[#b7b3aa] hover:bg-[#24231f] hover:text-white",
                  )}
                >
                  <ItemIcon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-[#f04a00]" : "text-[#6f6d66] group-hover:text-[#b7b3aa]",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.title}</span>
                  {active ? <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#8b877e]" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function MutxBrand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label="MUTX dashboard home">
      <span className="grid h-8 w-8 grid-cols-2 overflow-hidden border border-[#484741]" aria-hidden="true">
        <span className="bg-[#f04a00]" />
        <span className="bg-[#f2efe6]" />
        <span className="bg-[#f2efe6]" />
        <span className="bg-[#24231f]" />
      </span>
      <span>
        <span className="block font-[family:var(--font-site-body)] text-[17px] font-semibold leading-none tracking-[-0.05em] text-[#f2efe6]">
          MUTX
        </span>
        <span className="mt-1 block font-[family:var(--font-mono)] text-[8px] uppercase tracking-[0.22em] text-[#8d8980]">
          Control plane
        </span>
      </span>
    </Link>
  );
}

export function DashboardShell({ children, spaShellEnabled }: DashboardShellProps) {
  const pathname = useDashboardPathname(Boolean(spaShellEnabled));
  const navigateToPanel = useNavigateToPanel();
  const prefetchPanel = usePrefetchPanel();
  const { status, isDesktop, platformReady } = useDesktopStatus();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);

  const activeItem = useMemo(
    () =>
      ALL_DASHBOARD_NAV_ITEMS.find((item) => isDashboardNavItemActive(pathname, item)) ??
      ALL_DASHBOARD_NAV_ITEMS[0],
    [pathname],
  );

  const activeGroup = GROUP_LABELS[activeItem.group];
  const controlPlaneReady = status.localControlPlane?.ready || status.openclaw?.health === "healthy";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const appContent = appContentRef.current;
    appContent?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("button, a")?.focus());

    const handleDrawerKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleDrawerKeys);
    return () => {
      window.removeEventListener("keydown", handleDrawerKeys);
      appContent?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      (previousFocus?.isConnected ? previousFocus : mobileTriggerRef.current)?.focus({
        preventScroll: true,
      });
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (platformReady && isDesktop) return;

    const openPalette = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      event.stopPropagation();
      setPaletteOpen(true);
    };

    window.addEventListener("keydown", openPalette, true);
    return () => window.removeEventListener("keydown", openPalette, true);
  }, [isDesktop, platformReady]);

  if (platformReady && isDesktop) {
    return <DesktopWindowShell>{children}</DesktopWindowShell>;
  }

  return (
    <div
      className="dashboard-app min-h-screen bg-[#f2efe6] text-[#191916]"
      data-dashboard-theme="editorial"
    >
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
            aria-label="Close dashboard navigation"
            tabIndex={-1}
          />
          <aside
            id="dashboard-mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="relative flex h-full w-[min(86vw,18rem)] flex-col bg-[#151512] shadow-2xl"
          >
            <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-4">
              <MutxBrand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-[#b7b3aa] hover:bg-white/10 hover:text-white"
                aria-label="Close dashboard sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-6">
              <DashboardNav
                navigateToPanel={navigateToPanel}
                pathname={pathname}
                prefetchPanel={prefetchPanel}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <DashboardCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        navigateToPanel={navigateToPanel}
        prefetchPanel={prefetchPanel}
      />

      <div
        ref={appContentRef}
        className="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]"
      >
        <aside className="hidden h-screen flex-col bg-[#151512] lg:sticky lg:top-0 lg:flex">
          <div className="flex h-[4.5rem] items-center border-b border-white/10 px-5">
            <MutxBrand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-6">
            <DashboardNav
              navigateToPanel={navigateToPanel}
              pathname={pathname}
              prefetchPanel={prefetchPanel}
            />
          </div>
          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex items-center gap-2 text-[11px] text-[#b7b3aa]">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  controlPlaneReady ? "bg-[#20a36a]" : "bg-[#aaa69d]",
                )}
                aria-hidden="true"
              />
              <span>{controlPlaneReady ? "Control plane connected" : "Browser workspace"}</span>
            </div>
            <p className="mt-2 truncate text-[10px] text-[#6f6d66]">
              {status.user?.email || "Sign in to load workspace data"}
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-[4.5rem] items-center border-b border-[#d8d3c7] bg-[rgba(242,239,230,0.92)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <button
              ref={mobileTriggerRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mr-3 flex h-11 w-11 items-center justify-center rounded-md border border-[#d8d3c7] bg-[#faf8f2] text-[#191916] lg:hidden"
              aria-label="Open dashboard sidebar"
              aria-controls="dashboard-mobile-navigation"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="font-[family:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b877e]">
                {activeGroup}
              </p>
              <p className="mt-1 truncate text-[15px] font-medium tracking-[-0.02em] text-[#191916]">
                {activeItem.title}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden min-h-11 items-center gap-2 rounded-md border border-[#d8d3c7] bg-[#faf8f2] px-3 text-[12px] text-[#6f6b63] transition hover:border-[#b7b0a3] hover:text-[#191916] md:inline-flex"
                aria-label="Open command palette"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Find a surface</span>
                <kbd className="ml-2 rounded border border-[#d8d3c7] bg-white px-1.5 py-0.5 font-[family:var(--font-mono)] text-[9px] text-[#8b877e]">
                  &#8984;K
                </kbd>
              </button>
              <Link
                href="/docs"
                className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-[12px] text-[#6f6b63] transition hover:bg-[#e5e0d5] hover:text-[#191916] sm:inline-flex"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Docs
              </Link>
              <Link
                href="/dashboard/control"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#191916] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#f04a00]"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Setup</span>
              </Link>
            </div>
          </header>

          <main id="main-content" className="dashboard-content mx-auto w-full max-w-[94rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
