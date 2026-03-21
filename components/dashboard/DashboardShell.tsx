"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Menu,
  Monitor,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_GROUPS, getDashboardNavHref, isDashboardNavItemActive } from "./dashboardNav";

interface DashboardShellProps {
  children: ReactNode;
}

interface DashboardNavProps {
  onNavigate?: () => void;
  pathname: string;
}

function DashboardNav({ onNavigate, pathname }: DashboardNavProps) {
  return (
    <nav className="space-y-2">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.key} className="space-y-0.5">
          {group.title ? (
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {group.title}
            </p>
          ) : group.key === "control" ? (
            <div className="h-1" />
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
                  "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "border-[#49607f] bg-[linear-gradient(180deg,rgba(23,37,58,0.94)_0%,rgba(11,21,35,0.96)_100%)] text-slate-50 shadow-[0_0_0_1px_rgba(114,211,255,0.12),0_18px_42px_rgba(2,8,18,0.35)]"
                    : "border-transparent text-slate-400 hover:border-[#22354d] hover:bg-[#0a1320] hover:text-slate-100",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-0 w-px rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(87,223,255,0.7)]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    isActive
                      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                      : "border-[#1a2c42] bg-[#09111d] text-slate-500 group-hover:text-slate-200",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </span>
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
  const [clockLabel, setClockLabel] = useState("--:--");

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

  const sidebarBrand = (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#2f4d68] bg-[linear-gradient(180deg,#0f1e30_0%,#09131f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Image
          src="/logo-transparent-v2.png"
          alt="MUTX"
          width={28}
          height={28}
          className="h-7 w-7 object-contain opacity-95"
          priority
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[1.05rem] font-semibold tracking-[0.22em] text-slate-100">MUTX</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Control Plane</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto space-y-3 border-t border-[#152131] p-3">
      <div className="rounded-xl border border-[#1b2a3d] bg-[linear-gradient(180deg,#08111b_0%,#060d15_100%)] px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">MUTX CLI</p>
          <span className="rounded-md border border-[#22364d] bg-[#0a1523] px-2 py-0.5 text-[10px] text-slate-400">user@flux</span>
        </div>
        <p className="mt-2 text-xs text-slate-300">Govern agent rollouts, rotate access, and inspect control-plane state from the same operator contract.</p>
      </div>
      <div className="rounded-xl border border-[#1b2a3d] bg-[linear-gradient(180deg,#08111b_0%,#060d15_100%)] px-3 py-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">PYTEE</span>
          <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">Online</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#15273a] bg-[#08111d] px-3 py-2 text-xs text-slate-400">
          <span>SE Milan</span>
          <span>H1N</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030813] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-20%] top-[-24%] h-[70%] w-[70%] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-18%] top-[6%] h-[52%] w-[52%] rounded-full bg-blue-500/8 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(152,179,212,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(152,179,212,0.12)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(circle_at_center,black,transparent_88%)]" />
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
            "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-[#172238] bg-[linear-gradient(180deg,#08111c_0%,#050b13_100%)] shadow-2xl transition-transform",
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
        <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1540px] overflow-hidden rounded-[24px] border border-[#1b2437] bg-[#040a16] shadow-[0_34px_120px_rgba(2,6,23,0.72)]">
          <aside className="hidden w-[252px] shrink-0 flex-col border-r border-[#172238] bg-[linear-gradient(180deg,#07111a_0%,#040a12_100%)] lg:flex">
            <div className="border-b border-[#172238] px-4 py-4">{sidebarBrand}</div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <DashboardNav pathname={pathname} />
            </div>
            {sidebarFooter}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#050b13_0%,#040812_100%)]">
            <header className="border-b border-[#172238] bg-[#07101a]/95 px-3 py-3 backdrop-blur sm:px-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d2d46] bg-[#0a1326] text-slate-300 hover:text-white lg:hidden"
                  aria-label="Open dashboard sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#23364c] bg-[linear-gradient(180deg,#0b1420_0%,#09111b_100%)] px-3 py-2.5 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <Search className="h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1 truncate text-slate-400">Jump to page, task, agent...</div>
                    <div className="hidden items-center gap-1 md:flex">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#2b4058] bg-[#101b29] text-slate-300">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#2b4058] bg-[#101b29] text-slate-300">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 xl:flex">
                    {[
                      "Acme Corp",
                      "Last 24h",
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#22354c] bg-[linear-gradient(180deg,#0b1420_0%,#09111b_100%)] px-3 py-2 text-sm text-slate-200"
                      >
                        {label}
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#4e6b8b] bg-[linear-gradient(180deg,#1d3755_0%,#13263f_100%)] px-4 py-2 text-sm font-medium text-slate-50 shadow-[0_18px_40px_rgba(18,38,63,0.45)]"
                    >
                      Deploy Agent
                    </button>
                  </div>
                </div>

                <div className="hidden items-center gap-2 xl:flex">
                  <span className="font-mono text-[11px] text-slate-500">{clockLabel}</span>
                  {[Monitor, CreditCard, Bell, Settings2].map((Icon, index) => (
                    <button
                      key={index}
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#213247] bg-[linear-gradient(180deg,#0b1420_0%,#09111b_100%)] text-slate-400 transition hover:text-slate-200"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
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
