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
  signals: string[]
  surfaces: string[]
  outcomes: string[]
  icon: ComponentType<{ className?: string }>
}

const tabs: ControlLoopTab[] = [
  {
    id: 'observe',
    label: 'Observe',
    kicker: 'live state',
    title: 'Read the runtime.',
    signals: ['Sessions', 'Deployments', 'Health'],
    surfaces: ['Browser', 'CLI', 'TUI'],
    outcomes: ['Find drift', 'Read incidents', 'Recover fast'],
    icon: Radar,
  },
  {
    id: 'orchestrate',
    label: 'Orchestrate',
    kicker: 'runtime moves',
    title: 'Move it forward.',
    signals: ['Setup', 'Deploy', 'Channels'],
    surfaces: ['Template', 'Assistant', 'Rollout'],
    outcomes: ['Start clean', 'Ship changes', 'Keep posture'],
    icon: LifeBuoy,
  },
  {
    id: 'automate',
    label: 'Automate',
    kicker: 'follow-on flows',
    title: 'Extend the loop.',
    signals: ['Skills', 'Wakeups', 'Fallbacks'],
    surfaces: ['Workspace', 'Signals', 'Recovery'],
    outcomes: ['Scale workflows', 'Keep traceability', 'Stay recoverable'],
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

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)]">
        <div>
          <div className="landing-kicker">{active.kicker}</div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-50 sm:text-3xl">
            {active.title}
          </h3>

          <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-black/20 p-4">
            <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Signals
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {active.signals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-sm font-medium text-slate-100"
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[1.8rem] border border-white/10 bg-black/20 p-4">
            <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Surfaces
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.surfaces.map((surface) => (
                <span key={surface} className="landing-chip">
                  {surface}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[1.8rem] border border-white/10 bg-[#050b16]/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Outcomes
              </p>
              <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-50">
                Stay in control
              </h4>
            </div>
            <Command className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="mt-6 grid gap-3">
            {active.outcomes.map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium text-slate-200"
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
