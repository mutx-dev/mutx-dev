import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PicoFocusCard = {
  label: string
  title: string
  body: string
  actions?: ReactNode
}

type PicoFocusTone = 'current' | 'next' | 'neutral'

type PicoFocusCardProps = PicoFocusCard & {
  tone?: PicoFocusTone
}

type PicoNowNextProps = {
  current: PicoFocusCard
  next: PicoFocusCard
}

type PicoDisclosureProps = {
  title: string
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}

function toneClasses(tone: PicoFocusTone) {
  if (tone === 'current') {
    return 'border-emerald-400/20 bg-emerald-400/10'
  }

  if (tone === 'next') {
    return 'border-white/15 bg-white/5'
  }

  return 'border-white/10 bg-[rgba(8,15,28,0.82)]'
}

export function PicoFocusCard({ label, title, body, actions, tone = 'neutral' }: PicoFocusCardProps) {
  return (
    <section
      className={cn(
        'rounded-[28px] border p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]',
        toneClasses(tone),
      )}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{body}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}

export function PicoNowNext({ current, next }: PicoNowNextProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PicoFocusCard {...current} tone="current" />
      <PicoFocusCard {...next} tone="next" />
    </div>
  )
}

export function PicoDisclosure({ title, hint, defaultOpen = false, children }: PicoDisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {hint ? <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p> : null}
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
            Toggle
          </span>
        </div>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  )
}
