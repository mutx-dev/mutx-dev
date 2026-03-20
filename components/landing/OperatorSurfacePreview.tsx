import Image from 'next/image'
import {
  Bot,
  Cable,
  CloudCog,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Radio,
  Rocket,
  Settings2,
  TerminalSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

type EventItem = {
  title: string
  detail: string
  tone: 'cyan' | 'emerald' | 'violet' | 'amber'
}

const navItems: NavItem[] = [
  { label: 'Setup', icon: Settings2 },
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Agents', icon: Bot },
  { label: 'Deployments', icon: CloudCog },
  { label: 'Sessions', icon: Radio },
  { label: 'Logs', icon: FileText },
  { label: 'Skills', icon: Rocket },
  { label: 'Channels', icon: Cable },
  { label: 'Health', icon: HeartPulse },
]

const eventFeed: EventItem[] = [
  {
    title: 'starter.deployed',
    detail: 'Personal Assistant rollout completed',
    tone: 'cyan',
  },
  {
    title: 'assistant.session.started',
    detail: 'telegram channel opened a new runtime session',
    tone: 'amber',
  },
  {
    title: 'assistant.skill.installed',
    detail: 'browser_control synced into the assistant workspace',
    tone: 'emerald',
  },
  {
    title: 'gateway.health.updated',
    detail: 'doctor summary reports healthy runtime and valid channel policy',
    tone: 'violet',
  },
] as const

const routePills = [
  '/v1/templates',
  '/v1/assistant',
  '/v1/sessions',
  '/v1/deployments',
  '/v1/clawhub',
  '/v1/auth',
] as const

function toneClass(tone: EventItem['tone']) {
  if (tone === 'emerald') return 'bg-emerald-400'
  if (tone === 'violet') return 'bg-violet-400'
  if (tone === 'amber') return 'bg-amber-300'
  return 'bg-cyan-400'
}

export function OperatorSurfacePreview() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#1b2740] bg-[linear-gradient(180deg,#060d18_0%,#040914_100%)] shadow-[0_40px_120px_rgba(2,6,23,0.5)]">
      <div className="border-b border-white/10 bg-[#09101c]/95 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-cyan-400/15 bg-white/[0.04]">
              <Image src="/logo.png" alt="" fill sizes="2.25rem" className="object-contain p-2" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">MUTX control plane</p>
              <p className="truncate text-xs text-slate-500">Setup, assistant state, sessions, channels, skills, and health.</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              assistant online
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              web control plane
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="border-b border-r border-white/10 bg-[#08111f] p-4 lg:border-b-0">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  item.active
                    ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.active ? <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operator rule</p>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              The browser shell stays honest: it reflects the same assistant, session, skills, and deployment routes the CLI and TUI use.
            </p>
          </div>
        </aside>

        <div className="min-w-0 border-b border-white/10 p-4 sm:p-5 lg:border-b-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Control loop status:</span> starter deployment, assistant sessions,
            channel policy, workspace skills, and gateway health available from one surface.
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              { label: 'Setup', value: 'Ready', tone: 'emerald' },
              { label: 'Mounted API', value: '/v1/*', tone: 'cyan' },
              { label: 'Operator paths', value: 'Web + CLI + TUI', tone: 'violet' },
              { label: 'Starter', value: 'Personal Assistant', tone: 'amber' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-[#091324] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                <p
                  className={cn(
                    'mt-3 text-lg font-semibold',
                    card.tone === 'emerald' && 'text-emerald-300',
                    card.tone === 'cyan' && 'text-cyan-300',
                    card.tone === 'violet' && 'text-violet-300',
                    card.tone === 'amber' && 'text-amber-200',
                  )}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="rounded-[24px] border border-white/10 bg-[#081220] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Assistant overview
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-100">Deployment with durable state</h3>
                </div>
                <CloudCog className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  'Starter deployment creates the assistant and deployment record in one truthful action.',
                  'Sessions expose channel activity instead of hiding it behind a dashboard-only state model.',
                  'Skills and workspace state stay attached to the assistant runtime, not a demo-only settings drawer.',
                  'Health, wakeups, and channels are visible as operator data instead of browser-only hints.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#081220] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Surface map
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-100">MUTX control-plane routes</h3>
                </div>
                <TerminalSquare className="h-5 w-5 text-violet-300" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {routePills.map((route) => (
                  <span
                    key={route}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-slate-300"
                  >
                    {route}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                The browser shell, CLI, TUI, and installer all orbit the same assistant-first contract.
              </p>
            </div>
          </div>
        </div>

        <aside className="border-l border-white/10 bg-[#060d18] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live event stream</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">Operator signals</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              newest first
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {eventFeed.map((event) => (
              <div key={event.title + event.detail} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <span className={cn('h-2.5 w-2.5 rounded-full', toneClass(event.tone))} />
                  <p className="font-mono text-xs text-slate-200">{event.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{event.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-400/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">What this proves</p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              MUTX is not only a monitoring skin. It keeps starter deployment, assistant state, sessions, skills, channels,
              and recovery in the same operator model.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
