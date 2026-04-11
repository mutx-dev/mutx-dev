'use client'

import Link from 'next/link'

import { usePicoHref } from '@/lib/pico/navigation'
import {
  type PicoLessonCelebration,
  type PicoMomentumCue,
  type PicoStreakCue,
} from '@/lib/pico/progressSignals'

type PicoProgressPulseProps = {
  momentum: PicoMomentumCue
  streak: PicoStreakCue
  feedback: PicoLessonCelebration | null
  onDismissFeedback: () => void
}

export function PicoProgressPulse({
  momentum,
  streak,
  feedback,
  onDismissFeedback,
}: PicoProgressPulseProps) {
  const toHref = usePicoHref()

  return (
    <section className="mb-6 space-y-4">
      {feedback ? (
        <div
          role="status"
          className="rounded-[28px] border border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(8,15,28,0.92))] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/80">
                {feedback.kind === 'first_run' ? 'First run confirmed' : 'Lesson locked'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{feedback.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90">{feedback.body}</p>
              {feedback.chips.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {feedback.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-50"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onDismissFeedback}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
          {feedback.ctaHref && feedback.ctaLabel ? (
            <Link
              href={toHref(feedback.ctaHref)}
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              {feedback.ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Momentum</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{momentum.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{momentum.body}</p>
          <Link
            href={toHref(momentum.ctaHref)}
            className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {momentum.ctaLabel}
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Streak</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{streak.label}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{streak.body}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">Tracked on this device only</p>
        </div>
      </div>
    </section>
  )
}
