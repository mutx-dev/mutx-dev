'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { PicoDisclosure, PicoNowNext } from '@/components/pico/PicoSimpleFlow'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_TRACKS, getTrackBySlug } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

const setupTruths = [
  'Pick one track instead of trying to do everything at once.',
  'Finish the first useful lesson before touching deployment polish.',
  'Choose the environment you will actually run in: local only or persistent host.',
  'Add cost visibility and an approval gate before you trust outbound actions.',
]

export function PicoOnboardingPageClient() {
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const selectedTrack = progress.selectedTrack ? getTrackBySlug(progress.selectedTrack) : null
  const nextLesson = derived.nextLesson

  useEffect(() => {
    if (!progress.milestoneEvents.includes('account_created')) {
      actions.unlockMilestone('account_created')
    }
  }, [actions, progress.milestoneEvents])

  return (
    <PicoShell
      eyebrow="Onboarding"
      title="Start narrow, then move"
      description="Pico should feel small on the surface. Pick one lane, do the next useful thing, ignore the rest until it matters."
      actions={
        <Link
          href={nextLesson ? toHref(`/academy/${nextLesson.slug}`) : toHref('/academy')}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          {nextLesson ? 'Open next lesson' : 'Open academy'}
        </Link>
      }
    >
      <PicoNowNext
        current={{
          label: 'Current step',
          title: selectedTrack ? selectedTrack.title : 'Pick one lane',
          body: selectedTrack
            ? `${selectedTrack.outcome} Keep everything else out of view until this lane works.`
            : 'Choose the single result you want live first. Pico can stay simple if you do not ask it to solve all five tracks at once.',
          actions: selectedTrack ? (
            <Link
              href={toHref(`/academy/${selectedTrack.lessons[0]}`)}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Open active track
            </Link>
          ) : null,
        }}
        next={{
          label: 'Next step',
          title: nextLesson ? nextLesson.title : 'Start the academy',
          body: nextLesson
            ? `${nextLesson.validation} That is enough for now.`
            : 'Once you pick a lane, Pico will route the next concrete action instead of dumping the full map on you.',
          actions: (
            <>
              <Link
                href={nextLesson ? toHref(`/academy/${nextLesson.slug}`) : toHref('/academy')}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                {nextLesson ? 'Start next lesson' : 'Browse lessons'}
              </Link>
              <Link
                href={toHref('/tutor')}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Ask tutor
              </Link>
            </>
          ),
        }}
      />

      <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracks</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Choose the lane that matches the thing you need live</h2>
          </div>
          {selectedTrack ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100">
              Active: {selectedTrack.title}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {PICO_TRACKS.map((track) => {
            const selected = progress.selectedTrack === track.slug
            return (
              <article key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{track.outcome}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => actions.pickTrack(track.slug)}
                    className={selected
                      ? 'rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950'
                      : 'rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200'}
                  >
                    {selected ? 'Active track' : 'Set active'}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={toHref(`/academy/${track.lessons[0]}`)}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Start track
                  </Link>
                  <Link
                    href={toHref('/tutor')}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                  >
                    Ask tutor first
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <PicoDisclosure
          title="Show why these tracks exist"
          hint="Keep the detail hidden until you actually need it."
        >
          <div className="space-y-4">
            {PICO_TRACKS.map((track) => (
              <div key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                <p className="font-medium text-white">{track.title}</p>
                <p className="mt-2">{track.intro}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.checklist.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PicoDisclosure>

        <PicoDisclosure
          title="Show progress details"
          hint="Useful if you want the raw state. Not required to move fast."
        >
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p>Selected track: {progress.selectedTrack ?? 'none yet'}</p>
              <p className="mt-2">Completed lessons: {derived.completedLessonCount}</p>
              <p className="mt-2">Current level: {derived.currentLevel}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Ground rules</p>
              <div className="mt-3 space-y-2">
                {setupTruths.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PicoDisclosure>
      </div>
    </PicoShell>
  )
}
