"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, Command, Layers, Menu, Settings2, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_GROUPS, DASHBOARD_NAV_ITEMS, isDashboardNavItemActive } from "./dashboardNav";

interface DashboardShellProps {
  children: ReactNode;
}

interface DashboardNavProps {
  onNavigate?: () => void;
  pathname: string;
}

function DashboardNav({ onNavigate, pathname }: DashboardNavProps) {
  return (
    <nav className="space-y-1.5">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.key} className="space-y-0.5">
          {group.title ? (
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {group.title}
            </p>
          ) : group.key === "core" ? (
            <div className="h-1" />
          ) : null}

          {group.items.map((item) => {
            const isActive = isDashboardNavItemActive(pathname, item.href);

            return (
              <Link
                key={`${group.key}-${item.title}`}
                href={item.href}
                onClick={onNavigate}
                title={item.description}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "border-[#2f466b] bg-[#10233e] text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]"
                    : "border-transparent text-slate-400 hover:border-[#1d2e4a] hover:bg-[#0c1729] hover:text-slate-200",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <p className="truncate font-medium">{item.title}</p>
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = DASHBOARD_NAV_ITEMS.find((item) =>
    isDashboardNavItemActive(pathname, item.href),
  );

  const clockLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()),
    [],
  );

  const sidebarBrand = (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
        <Command className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">MUTX</p>
          <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">operator</p>
        </div>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto space-y-2 border-t border-[#172238] p-3">
      <div className="rounded-lg border border-[#1d2d46] bg-[#0a1326] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">mutx cli</p>
        <p className="mt-1 text-xs text-slate-300">CLI + SDK access for governed operators.</p>
      </div>
      <div className="rounded-lg border border-[#1d2d46] bg-[#0a1326] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">control plane</p>
        <p className="mt-1 text-xs text-slate-300">Deploy, govern, and recover agent systems.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[#1d2d46] bg-[#0a1326] px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-200">
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">Operator</p>
          <p className="truncate text-[10px] uppercase tracking-[0.15em] text-slate-500">mutx</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030813] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-20%] top-[-28%] h-[70%] w-[70%] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute right-[-18%] top-[2%] h-[55%] w-[55%] rounded-full bg-blue-500/8 blur-[140px]" />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
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
            "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-[#172238] bg-[#071122] shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-[#172238] px-4 py-4">
            <div className="min-w-0">{sidebarBrand}</div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-[#1d2d46] bg-[#0a1326] p-2 text-slate-300 hover:text-white"
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

      <div className="relative p-2 sm:p-3">
        <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1540px] overflow-hidden rounded-[20px] border border-[#1b2437] bg-[#040a16] shadow-[0_34px_120px_rgba(2,6,23,0.72)]">
          <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#172238] bg-[linear-gradient(180deg,#081121_0%,#050d1b_100%)] lg:flex">
            <div className="border-b border-[#172238] px-4 py-4">{sidebarBrand}</div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <DashboardNav pathname={pathname} />
            </div>
            {sidebarFooter}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-[#050b19]">
            <header className="border-b border-[#172238] bg-[#071122]/95 px-3 py-3 backdrop-blur sm:px-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d2d46] bg-[#0a1326] text-slate-300 hover:text-white lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="hidden items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200 sm:inline-flex">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  GW Connected
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#22314b] bg-[#0a1428] px-3 py-2 text-sm text-slate-300">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">Canonical /dashboard surface</p>
                      <p className="truncate text-xs text-slate-500">Lifecycle, governance, deployments, runs, traces, keys, and health.</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 lg:flex">
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#283a59] bg-[#111d35] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      <Layers className="h-3.5 w-3.5" />
                      Control plane
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#283a59] bg-[#111d35] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      Surface {activeItem?.title ?? "Overview"}
                    </span>
                  </div>
                </div>

                <div className="hidden items-center gap-4 text-[11px] text-slate-500 xl:flex">
                  <span>
                    Resources <span className="text-slate-300">Agents · Deployments · Runs</span>
                  </span>
                  <span>
                    Posture <span className="text-cyan-200">Governed</span>
                  </span>
                  <span className="font-mono text-slate-300">{clockLabel}</span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#1d2d46] bg-[#0a1326] text-slate-400 transition hover:text-slate-200"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#1d2d46] bg-[#0a1326] text-slate-400 transition hover:text-slate-200"
                    aria-label="Dashboard settings"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </header>

            <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
