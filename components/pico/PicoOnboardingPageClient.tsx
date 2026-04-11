'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_TRACKS } from '@/lib/pico/academy'
import { getPicoPrimaryJourney, getPicoTrackTarget } from '@/lib/pico/journey'
import { usePicoHref } from '@/lib/pico/navigation'

const checklist = [
  'Pick one track instead of trying to do everything at once.',
  'Finish the first two lessons and keep proof the runtime answered.',
  'Choose the environment you will actually run in: local only or persistent host.',
  'Do not skip control. Add cost visibility and an approval gate before you trust outbound actions.',
]

export function PicoOnboardingPageClient() {
  const router = useRouter()
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const primaryJourney = useMemo(() => getPicoPrimaryJourney(progress), [progress])

  useEffect(() => {
    if (!progress.milestoneEvents.includes('account_created')) {
      actions.unlockMilestone('account_created')
    }
  }, [actions, progress.milestoneEvents])

  function openTrack(trackSlug: string) {
    const target = getPicoTrackTarget(progress, trackSlug)
    actions.pickTrack(target.track.slug)
    actions.startLesson(target.lesson.slug)
    router.push(toHref(`/academy/${target.lesson.slug}`))
  }

  function openPrimaryJourney() {
    if (primaryJourney.lesson) {
      actions.pickTrack(primaryJourney.track.slug)
      actions.startLesson(primaryJourney.lesson.slug)
    }

    router.push(toHref(primaryJourney.href))
  }

  return (
    <PicoShell
      eyebrow="Onboarding"
      title="Start narrow, not cute"
      description="Pick one lane. Finish one useful agent. Then add control. Everything else is procrastination with better branding."
      actions={
        <button
          type="button"
          onClick={openPrimaryJourney}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          {primaryJourney.label}
        </button>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Checklist</p>
          <div className="mt-4 space-y-3">
            {checklist.map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <span className="mr-3 text-emerald-200">0{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
            <p className="font-medium text-white">Current state</p>
            <p className="mt-3">Selected track: {progress.selectedTrack ?? 'none yet'}</p>
            <p className="mt-2">Completed lessons: {derived.completedLessonCount}</p>
            <p className="mt-2">Current level: {derived.currentLevel}</p>
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Next action</p>
              <p className="mt-2 font-medium text-white">{primaryJourney.label}</p>
              <p className="mt-2 text-slate-200">{primaryJourney.description}</p>
              <button
                type="button"
                onClick={openPrimaryJourney}
                className="mt-4 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {primaryJourney.label}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Choose your lane</p>
          <div className="mt-5 grid gap-4">
            {PICO_TRACKS.map((track) => {
              const target = getPicoTrackTarget(progress, track.slug)
              return (
                <article key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{track.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{track.intro}</p>
                      <p className="mt-3 text-sm text-emerald-100">Outcome: {track.outcome}</p>
                    </div>
                    {target.selected ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100">
                        Active track
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-2 text-sm font-medium text-slate-200">
                        Starts with {target.lesson.title}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {track.checklist.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-300">
                    Next lesson: <span className="font-medium text-white">{target.lesson.title}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openTrack(track.slug)}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      {target.selected ? `Continue with ${target.lesson.title}` : `Start with ${target.lesson.title}`}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>Blocked before you start?</span>
            <Link href={toHref('/tutor')} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
              Ask tutor
            </Link>
          </div>
        </div>
      </section>
    </PicoShell>
  )
}
