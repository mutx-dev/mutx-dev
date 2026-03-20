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
    title: 'See the live surface.',
    body: 'Sessions, deployments, health, and runtime posture read as one operator view.',
    points: [
      'Live session and deployment state',
      'Health stays tied to the runtime',
      'Same surface language as the browser demo',
    ],
    outcome: 'Know what is live, what shifted, and where to intervene.',
    icon: Radar,
  },
  {
    id: 'orchestrate',
    label: 'Orchestrate',
    kicker: 'setup + deployment + channels',
    title: 'Move the runtime forward.',
    body: 'Deploy the starter assistant, add channels, and keep the operator path legible.',
    points: [
      'One-shot starter deployment',
      'Defaults already wired for real runtime work',
      'Durable deployment controls',
    ],
    outcome: 'Go from install to a live assistant without inventing a second story.',
    icon: LifeBuoy,
  },
  {
    id: 'automate',
    label: 'Automate',
    kicker: 'skills + wakeups + follow-on flows',
    title: 'Extend without breaking the loop.',
    body: 'Install skills, surface wakeups, and keep fallback paths alive in CLI and TUI.',
    points: [
      'Workspace-backed skills',
      'Wakeups as operator data',
      'Recoverable fallback paths',
    ],
    outcome: 'Grow the control loop while keeping the runtime readable.',
    icon: Sparkles,
  },
]

export function ControlLoopTabs() {
  const [activeId, setActiveId] = useState<ControlLoopTabId>('observe')
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  return (
    <div className="landing-panel-strong overflow-hidden text-white">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
        <div>
          <div className="landing-kicker">{active.kicker}</div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-50 sm:text-3xl">
            {active.title}
          </h3>
          <p className="mt-4 text-base leading-7 text-slate-300">{active.body}</p>

          <div className="mt-6 grid gap-3">
            {active.points.map((point) => (
              <div
                key={point}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
              >
                {point}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.8rem] border border-white/10 bg-[#050b16]/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Operational outcome
              </p>
              <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-50">
                What this buys you
              </h4>
            </div>
            <Command className="h-5 w-5 text-cyan-300" />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">{active.outcome}</p>

          <div className="mt-6 grid gap-3">
            {[
              'Honest surface boundaries',
              'Assistant-first onboarding',
              'Durable deployment records',
              'Recoverable operator paths',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
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
