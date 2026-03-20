'use client'

import type { ComponentType } from 'react'
import { useState } from 'react'
import { Command, LifeBuoy, Radar, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

type ControlLoopTabId = 'observe' | 'orchestrate' | 'automate'

type ControlLoopTab = {
  id: ControlLoopTabId
  label: string
  kicker: string
  title: string
  body: string
  points: string[]
  outcome: string
  icon: ComponentType<{ className?: string }>
}

const tabs: ControlLoopTab[] = [
  {
    id: 'observe',
    label: 'Observe',
    kicker: 'sessions + logs + health',
    title: 'See assistant state, gateway health, and live sessions from one control plane.',
    body: 'MUTX turns the first assistant into something operators can inspect truthfully instead of hiding runtime state behind a chat-only UI.',
    points: [
      'Assistant overview combines starter template metadata, deployment state, and gateway posture',
      'Session listings come from the mounted runtime state rather than synthetic browser samples',
      'Logs and health stay attached to the same assistant and deployment records operators manage',
      'Browser, CLI, and TUI surfaces all point at the same assistant-first `/v1/*` routes',
    ],
    outcome: 'Operators can answer whether the assistant is live, where it is connected, and what changed recently without leaving the control plane.',
    icon: Radar,
  },
  {
    id: 'orchestrate',
    label: 'Orchestrate',
    kicker: 'setup + deployment + channels',
    title: 'Make the first deployment a real assistant, not a generic placeholder.',
    body: 'MUTX starts with `Personal Assistant`, then layers channels, skills, and deployment control onto that same runtime instead of forcing users through an empty fleet setup.',
    points: [
      'Starter deployment route creates the assistant record and deployment in one action',
      'OpenClaw-backed runtime defaults provide workspace, model, skills, and safe channel policy',
      'Deployments stay durable and operable with restart, scale, delete, and event history',
      'The web control plane adopts Mission Control-style navigation without inventing fake capabilities',
    ],
    outcome: 'Operators move from install to a working assistant quickly, while the system still preserves truthful deployment state.',
    icon: LifeBuoy,
  },
  {
    id: 'automate',
    label: 'Automate',
    kicker: 'skills + wakeups + follow-on flows',
    title: 'Extend the assistant with skills and scheduled wakeups once the starter deployment is alive.',
    body: 'Automation belongs after the assistant exists. MUTX keeps those extensions in the same control plane instead of scattering them across side tools.',
    points: [
      'Skill installation and removal are backed by the assistant workspace and registry model',
      'Wakeups and cron state can be surfaced as assistant resources instead of internal runtime trivia',
      'The CLI and TUI provide a recovery path even while richer browser panels continue to land',
      'Docs, installer, and quickstart stay aligned so automation starts from a truthful deployed baseline',
    ],
    outcome: 'Teams can expand from one assistant to a fuller control loop without changing the product story halfway through onboarding.',
    icon: Sparkles,
  },
]

export function ControlLoopTabs() {
  const [activeId, setActiveId] = useState<ControlLoopTabId>('observe')
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#1b2740] bg-[linear-gradient(180deg,#0a1322_0%,#060d18_100%)] text-white shadow-[0_30px_90px_rgba(2,6,23,0.35)]">
      <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-4 sm:px-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              activeId === tab.id
                ? 'border-cyan-400/20 bg-cyan-400 text-slate-950 shadow-[0_12px_34px_rgba(34,211,238,0.25)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-slate-100',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            {active.kicker}
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-50 sm:text-3xl">
            {active.title}
          </h3>
          <p className="mt-4 text-base leading-8 text-slate-300">{active.body}</p>

          <div className="mt-6 grid gap-3">
            {active.points.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-300"
              >
                {point}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[24px] border border-white/10 bg-[#050b16] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Operational outcome
              </p>
              <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-50">What this buys you</h4>
            </div>
            <Command className="h-5 w-5 text-cyan-300" />
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">{active.outcome}</p>

          <div className="mt-6 grid gap-3">
            {[
              'Honest surface boundaries',
              'Assistant-first onboarding',
              'Durable deployment records',
              'Recoverable operator paths',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
