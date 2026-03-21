"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Clock3,
  CreditCard,
  GitBranch,
  Globe,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BASE_SIGNALS,
  QUICK_ACTIONS,
  NAV_ITEMS,
  relativeStamp,
  rotate,
} from "@/components/dashboard/demo/demoContent";
import type { AuditItem, SignalItem } from "@/components/dashboard/demo/demoContent";
import { QuickActionButton, RailSection, SearchBar, SignalToneIcon, StatusBadge, TopControl } from "@/components/dashboard/demo/demoPrimitives";
import {
  AgentsSection,
  DeploymentsSection,
  EnvironmentsSection,
  OverviewSection,
  PlaceholderSection,
  RunsSection,
} from "@/components/dashboard/demo/routeSections";
import type { DemoSection } from "@/components/dashboard/demo/demoSections";

export function MutxDemoApp({ section }: { section: DemoSection }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const signals = rotate(BASE_SIGNALS, tick).map((signal, index) => ({
    ...signal,
    stamp: relativeStamp(1 + index * 8 + ((tick + index) % 4)),
  }));
  const auditItems: AuditItem[] = [
    { title: "Rotate API key", resource: "External operator credential", actor: "Creator", role: "operator", stamp: relativeStamp(8 + (tick % 4)) },
    { title: "Deployment promoted", resource: "Sales Ops Assistant v1.4.x", actor: "Release Bot", role: "automation", stamp: relativeStamp(16 + (tick % 5)) },
    { title: "Webhook updated", resource: "Stripe outbound delivery", actor: "Integrator", role: "platform", stamp: relativeStamp(26 + (tick % 6)) },
  ];
  const activeAction = tick % QUICK_ACTIONS.length;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#05090f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,91,124,0.16),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(9,118,141,0.11),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/[0.055] bg-[#070c12]">
          <div className="lg:hidden">
            <div className="flex h-14 items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-transparent-v2.png"
                  alt="MUTX"
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
                  priority
                />
                <div>
                  <div className="text-[16px] font-semibold tracking-[0.14em] text-white">MUTX</div>
                  <div className="text-[10px] font-medium tracking-[0.12em] text-white/42">Control plane</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,108,129,0.18),rgba(7,81,99,0.18))] px-3 text-sm font-medium text-cyan-50"
                >
                  Deploy
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
                >
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 pb-3">
              <SearchBar />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-14 grid-cols-[224px_minmax(0,1fr)] lg:grid xl:grid-cols-[232px_minmax(0,1fr)]">
            <div className="flex items-center gap-3 border-r border-white/[0.055] px-4">
              <Image
                src="/logo-transparent-v2.png"
                alt="MUTX"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
                priority
              />
              <div>
                <div className="text-[17px] font-semibold tracking-[0.15em] text-white">MUTX</div>
                <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/42">control plane</div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 px-3">
              <SearchBar />
              <div className="hidden items-center gap-2 xl:flex">
                <TopControl label="Acme Corp" icon={GitBranch} compact />
                <TopControl label="Production" icon={Globe} compact />
                <TopControl label="Last 24h" icon={Clock3} compact />
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,108,129,0.18),rgba(7,81,99,0.18))] px-4 text-sm font-medium text-cyan-50"
                >
                  Deploy Agent
                </button>
              </div>
              <div className="ml-auto hidden items-center gap-2 xl:flex">
                {[Bell, CreditCard, Settings2].map((Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.055] bg-[#070c12] px-2.5 py-2 lg:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.key === section;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-[12px] border px-3 text-[13px] transition",
                    active
                      ? "border-cyan-400/12 bg-[#102130] text-white"
                      : "border-transparent bg-white/[0.02] text-white/60",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active ? "text-cyan-200" : "text-white/38")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_248px] 2xl:grid-cols-[240px_minmax(0,1fr)_256px]">
          <aside className="hidden min-h-0 flex-col border-r border-white/[0.055] bg-[#060b11] lg:flex">
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3">
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = item.key === section;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-[12px] border px-3 text-[14px] transition",
                        active
                          ? "border-cyan-400/10 bg-[#102130] text-white"
                          : "border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", active ? "text-cyan-200" : "text-white/38")} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] p-3">
              <div className="rounded-[12px] border border-white/[0.055] bg-[#0a1016] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/34">MUTX CLI</div>
                  <div className="rounded-full border border-white/[0.055] bg-[#0f151d] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/42">
                    user@flux
                  </div>
                </div>
                <div className="mt-2 text-[12px] leading-5 text-white/52">
                  Operate rollouts, access, and control-plane state from the same contract.
                </div>
              </div>
              <div className="rounded-[12px] border border-white/[0.055] bg-[#0a1016] p-3">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">
                  <span>PYTEE</span>
                  <StatusBadge label="Online" tone="healthy" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px] text-white/56">
                  <span>SE Milan</span>
                  <span>H1N</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto overflow-x-hidden bg-[#070c12] p-2 lg:overflow-hidden">
            <div className="flex min-h-full flex-col lg:h-full lg:overflow-hidden">
              <div className="min-h-0 flex-1 overflow-visible lg:overflow-hidden">
                {section === "overview" ? (
                  <OverviewSection
                    tick={tick}
                    signals={signals}
                    auditItems={auditItems}
                    activeAction={activeAction}
                  />
                ) : null}
                {section === "agents" ? <AgentsSection tick={tick} /> : null}
                {section === "deployments" ? <DeploymentsSection tick={tick} /> : null}
                {section === "runs" ? <RunsSection tick={tick} /> : null}
                {section === "environments" ? <EnvironmentsSection tick={tick} /> : null}
                {section === "access" || section === "connectors" || section === "audit" || section === "usage" || section === "settings" ? (
                  <PlaceholderSection section={section} tick={tick} />
                ) : null}
              </div>
            </div>
          </main>

          <aside className="hidden min-h-0 overflow-hidden border-l border-white/[0.055] bg-[#060b11] p-2 xl:block">
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,0.94fr)_minmax(0,0.62fr)_auto] gap-2.5 overflow-hidden">
              <RailSection title="Live Signals" meta={`${signals.length} items`}>
                <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto overscroll-contain pr-1">
                  {signals.map((signal: SignalItem) => (
                    <div key={`${signal.title}-${signal.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <SignalToneIcon tone={signal.tone} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-[13px] font-semibold text-white">{signal.title}</div>
                            <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">
                              {signal.stamp}
                            </div>
                          </div>
                          <div className="mt-1 overflow-hidden text-[12px] leading-5 text-white/56 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                            {signal.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RailSection>

              <RailSection title="Audit Trail" meta="operator actions">
                <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto overscroll-contain pr-1">
                  {auditItems.map((item) => (
                    <div key={`${item.title}-${item.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-[12px] text-white/56">{item.resource}</div>
                          <div className="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">
                            {item.role} · {item.actor}
                          </div>
                        </div>
                        <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">{item.stamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </RailSection>

              <RailSection title="Quick Actions" meta="operator controls">
                <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-auto overscroll-contain">
                  {QUICK_ACTIONS.map((action, index) => (
                    <QuickActionButton key={action.label} action={action} active={index === activeAction} />
                  ))}
                </div>
              </RailSection>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
