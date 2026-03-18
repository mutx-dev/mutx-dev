"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_ITEMS, isDashboardNavItemActive } from "./dashboardNav";
import { LiveHealthPill } from "./LiveHealthPill";

interface DashboardShellProps {
  children: ReactNode;
}

interface DashboardNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  pathname: string;
}

function DashboardNav({ collapsed = false, onNavigate, pathname }: DashboardNavProps) {
  return (
    <nav className="space-y-1">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const isActive = isDashboardNavItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              isActive
                ? "border-cyan-400/20 bg-cyan-400/10 text-white"
                : "border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200",
              collapsed && "justify-center px-2",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {item.description}
                </p>
              </div>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeItem = DASHBOARD_NAV_ITEMS.find((item) =>
    isDashboardNavItemActive(pathname, item.href),
  );

  return (
    <div className="min-h-screen bg-[#030307] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-12%] h-[44%] w-[44%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-12%] top-[22%] h-[34%] w-[34%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/70 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[#030307] p-5 shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  app.mutx.dev
                </p>
                <p className="text-sm font-semibold text-white">Mission Control</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
              aria-label="Close dashboard sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <DashboardNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid gap-6",
            sidebarCollapsed
              ? "lg:grid-cols-[88px_minmax(0,1fr)]"
              : "lg:grid-cols-[280px_minmax(0,1fr)]",
          )}
        >
          <aside className="panel hidden h-[calc(100vh-7.5rem)] rounded-[24px] border border-white/10 bg-black/30 p-4 backdrop-blur-xl lg:sticky lg:top-24 lg:block">
            <div
              className={cn(
                "mb-8 flex items-center gap-3",
                sidebarCollapsed && "justify-center",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Command className="h-5 w-5" />
              </div>

              {!sidebarCollapsed ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    app.mutx.dev
                  </p>
                  <p className="text-sm font-semibold text-white">Mission Control</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                    dashboard shell
                  </p>
                </div>
              ) : null}
            </div>

            <DashboardNav pathname={pathname} collapsed={sidebarCollapsed} />
          </aside>

          <div className="min-w-0">
            <header className="sticky top-20 z-20 mb-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 lg:hidden"
                    aria-label="Open dashboard sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white sm:text-lg">
                      {activeItem?.title ?? "Dashboard"}
                    </p>
                    <p className="truncate text-[11px] uppercase tracking-[0.15em] text-slate-400">
                      {activeItem?.description ?? "Operator control surface"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <LiveHealthPill />

                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((current) => !current)}
                    className="hidden rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 lg:inline-flex"
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </header>

            <main className="min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
