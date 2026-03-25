"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Clock3,
  CreditCard,
  GitBranch,
  Globe,
  Settings2,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BASE_SIGNALS,
  NAV_ITEMS,
  QUICK_ACTIONS,
  SECTION_META,
  getSectionTheme,
  relativeStamp,
  rotate,
} from "@/components/dashboard/demo/demoContent";
import type { AuditItem, SignalItem } from "@/components/dashboard/demo/demoContent";
import {
  QuickActionButton,
  RailSection,
  SearchBar,
  SignalToneIcon,
  StatusBadge,
  TopControl,
} from "@/components/dashboard/demo/demoPrimitives";
import {
  AgentsSection,
  DeploymentsSection,
  EnvironmentsSection,
  OverviewSection,
  PlaceholderSection,
  RunsSection,
} from "@/components/dashboard/demo/routeSections";
import type { DemoSection } from "@/components/dashboard/demo/demoSections";

function DemoStageHeader({ section, tick }: { section: DemoSection; tick: number }) {
  const meta = SECTION_META[section];
  const theme = getSectionTheme(section);
  const pulseStamp = relativeStamp(2 + (tick % 5));

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(13,18,24,0.98)_0%,rgba(7,10,14,1)_100%)] px-4 py-4 shadow-[0_30px_110px_rgba(2,6,12,0.34)] sm:px-5 sm:py-5",
        theme.heroBorder,
      )}
    >
      <div className={cn("pointer-events-none absolute -right-12 top-[-18%] h-48 w-48 rounded-full blur-[90px]", theme.heroGlow)} />
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-r opacity-70", theme.heroTint)} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", theme.heroBadge)}>
                {meta.eyebrow}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/36">
                demo mode locked to /control
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl font-[family:var(--font-control-display)] text-[2.15rem] font-semibold leading-[0.94] tracking-[-0.06em] text-white sm:text-[2.6rem] xl:text-[3rem]">
              {meta.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62 sm:text-[15px] sm:leading-7">
              {meta.detail}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.chips.map((chip) => (
                <span
                  key={`${section}-${chip}`}
                  className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", theme.chip)}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:max-w-[560px]">
            {meta.heroStats.map((item) => (
              <div
                key={`${section}-${item.label}`}
                className="rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,24,32,0.94)_0%,rgba(10,14,19,1)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/36">{item.label}</div>
                <div className="mt-2 font-[family:var(--font-control-display)] text-[1.6rem] font-semibold leading-none tracking-[-0.05em] text-white">
                  {item.value}
                </div>
                <div className="mt-2 text-[11px] leading-5 text-white/56">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[20px] border border-white/[0.08] bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
              <Sparkles className={cn("h-3.5 w-3.5", theme.textAccent)} />
              Demo cue
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">{meta.command}</p>
          </div>
          <div className="flex items-center justify-between rounded-[20px] border border-white/[0.08] bg-black/20 px-4 py-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Pulse</div>
              <div className="mt-1 text-sm text-white/72">Last visible system change {pulseStamp}</div>
            </div>
            <StatusBadge label="Live demo" tone="focus" />
          </div>
        </div>
      </div>
      <div className={cn("pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r", theme.heroRule)} />
    </motion.section>
  );
}

function DemoBriefRail({ section }: { section: DemoSection }) {
  const meta = SECTION_META[section];
  const theme = getSectionTheme(section);

  return (
    <RailSection title="Demo Script" meta="talk track">
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto overscroll-contain pr-1">
        <div className="rounded-[18px] border border-white/[0.08] bg-black/20 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/34">Opening line</div>
          <div className={cn("mt-2 text-sm leading-6", theme.textAccent)}>{meta.command}</div>
        </div>
        {meta.narrative.map((item, index) => (
          <div
            key={`${section}-narrative-${index}`}
            className="rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] px-3.5 py-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
              Beat {String(index + 1).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/64">{item}</div>
          </div>
        ))}
      </div>
    </RailSection>
  );
}

export function MutxDemoApp({ section }: { section: DemoSection }) {
  const [tick, setTick] = useState(0);
  const sectionMeta = SECTION_META[section];

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
  const activeAction = tick % QUICK_ACTIONS.length;

  const auditItems: AuditItem[] = [
    { title: "Rotate API key", resource: "External operator credential", actor: "Creator", role: "operator", stamp: relativeStamp(8 + (tick % 4)) },
    { title: "Deployment promoted", resource: "Sales Ops Assistant v1.4.x", actor: "Release Bot", role: "automation", stamp: relativeStamp(16 + (tick % 5)) },
    { title: "Webhook updated", resource: "Stripe outbound delivery", actor: "Integrator", role: "platform", stamp: relativeStamp(26 + (tick % 6)) },
  ];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#06090d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(227,107,44,0.13),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(58,159,192,0.14),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(42,74,104,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/[0.06] bg-[#090d12]/95 backdrop-blur">
          <div className="lg:hidden">
            <div className="flex h-16 items-center justify-between px-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,26,36,0.98)_0%,rgba(10,14,20,1)_100%)] shadow-[0_18px_48px_rgba(3,8,15,0.34)]">
                  <Image
                    src="/logo-transparent-v2.png"
                    alt="MUTX"
                    width={30}
                    height={30}
                    className="h-7 w-7 object-contain"
                    priority
                  />
                </div>
                <div>
                  <div className="font-[family:var(--font-control-display)] text-[1.05rem] font-semibold tracking-[0.16em] text-white">
                    MUTX
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                    control demo
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                  Demo
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] text-white/46"
                >
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3.5 pb-3.5">
              <SearchBar />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] text-white/46"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-16 grid-cols-[264px_minmax(0,1fr)] lg:grid xl:grid-cols-[276px_minmax(0,1fr)]">
            <div className="flex items-center gap-3 border-r border-white/[0.06] px-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,26,36,0.98)_0%,rgba(10,14,20,1)_100%)] shadow-[0_18px_48px_rgba(3,8,15,0.34)]">
                <Image
                  src="/logo-transparent-v2.png"
                  alt="MUTX"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="font-[family:var(--font-control-display)] text-[1.12rem] font-semibold tracking-[0.18em] text-white">
                  MUTX
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                  <span>control plane demo</span>
                  <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-2 py-0.5 text-cyan-100">private route set</span>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 px-3">
              <SearchBar />
              <div className="hidden items-center gap-2 xl:flex">
                <TopControl label="Acme Corp" icon={GitBranch} compact />
                <TopControl label={sectionMeta.eyebrow} icon={Globe} compact />
                <TopControl label="Last 24h" icon={Clock3} compact />
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50 shadow-[0_18px_42px_rgba(8,145,178,0.16)]"
                >
                  Live walkthrough
                </button>
              </div>
              <div className="ml-auto hidden items-center gap-2 xl:flex">
                {[Bell, CreditCard, Settings2].map((Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] text-white/44 transition hover:text-white/82"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.06] bg-[#090d12]/90 px-2.5 py-2.5 lg:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-0.5">
            {NAV_ITEMS.map((item) => {
              const active = item.key === section;
              const theme = getSectionTheme(item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] transition",
                    active
                      ? theme.navActive
                      : "border-white/[0.08] bg-white/[0.03] text-white/62",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active ? "text-white" : "text-white/38")} />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[276px_minmax(0,1fr)_300px]">
          <aside className="hidden min-h-0 flex-col border-r border-white/[0.06] bg-[#070b10] lg:flex">
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-3 py-3.5">
              <div className="rounded-[20px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,24,33,0.92)_0%,rgba(10,14,20,0.98)_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">Demo shell</div>
                <div className="mt-2 font-[family:var(--font-control-display)] text-[1.25rem] font-semibold tracking-[-0.04em] text-white">
                  Executive mission control
                </div>
                <div className="mt-2 text-[13px] leading-6 text-white/56">
                  Every route stays inside `/control` and exists to tell the operator story cleanly in a live room.
                </div>
              </div>

              <nav className="mt-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active = item.key === section;
                  const theme = getSectionTheme(item.key);

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-[18px] border px-3 py-3 transition",
                        active
                          ? theme.navActive
                          : "border-transparent bg-transparent text-white/60 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-white",
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.25)]" />
                      ) : null}
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] text-white/42 transition",
                          active ? theme.navIcon : "group-hover:border-white/[0.12] group-hover:text-white/80",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                          {SECTION_META[item.key].eyebrow}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] p-3">
              <div className="rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">Operator handle</div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
                    user@flux
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/56">
                  Use the control demo to narrate posture, prove actionability, and never fall back into the real authenticated dashboard.
                </div>
              </div>
              <div className="rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">
                  <span>PYTEE</span>
                  <StatusBadge label="Online" tone="healthy" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px] text-white/58">
                  <span>SE Milan</span>
                  <span>H1N</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto overflow-x-hidden bg-transparent p-2.5 lg:overflow-hidden lg:p-3">
            <div className="flex min-h-full flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-hidden">
              <DemoStageHeader section={section} tick={tick} />
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-0 flex-1 overflow-visible lg:overflow-hidden"
              >
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
              </motion.div>
            </div>
          </main>

          <aside className="hidden min-h-0 overflow-hidden border-l border-white/[0.06] bg-[#070b10] p-3 xl:block">
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,0.95fr)_minmax(0,1fr)_auto] gap-3 overflow-hidden">
              <DemoBriefRail section={section} />

              <RailSection title="Live Signals" meta={`${signals.length} items`}>
                <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-auto overscroll-contain pr-1">
                  {signals.map((signal: SignalItem) => (
                    <div key={`${signal.title}-${signal.stamp}`} className="rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <SignalToneIcon tone={signal.tone} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-[13px] font-semibold text-white">{signal.title}</div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/28">
                              {signal.stamp}
                            </div>
                          </div>
                          <div className="mt-1.5 overflow-hidden text-[12px] leading-5 text-white/58 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                            {signal.detail}
                          </div>
                        </div>
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
