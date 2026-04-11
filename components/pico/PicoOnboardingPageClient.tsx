'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_TRACKS } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

const activationChecklist = [
  'Install Hermes and make sure the command opens from a fresh shell.',
  'Run one tiny prompt and get one visible answer back.',
  'Save proof of the output, then worry about deployment later.',
]

export function PicoOnboardingPageClient() {
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const firstTrack = PICO_TRACKS[0]
  const installLessonSlug = 'install-hermes-locally'
  const firstRunLessonSlug = 'run-your-first-agent'
  const installDone = progress.completedLessons.includes(installLessonSlug)
  const firstRunDone = progress.completedLessons.includes(firstRunLessonSlug)
  const activeTrack = PICO_TRACKS.find((track) => track.slug === progress.selectedTrack) ?? firstTrack
  const activationLessonSlug = firstRunDone
    ? (derived.nextLesson?.slug ?? activeTrack.lessons[0])
    : installDone
      ? firstRunLessonSlug
      : installLessonSlug

  useEffect(() => {
    if (!progress.milestoneEvents.includes('account_created')) {
      actions.unlockMilestone('account_created')
    }
    if (!progress.selectedTrack) {
      actions.pickTrack('first-agent')
    }
  }, [actions, progress.milestoneEvents, progress.selectedTrack])

  return (
    <PicoShell
      eyebrow="Onboarding"
      title="Get to your first working agent fast"
      description="Ignore everything except the first local win. Install Hermes, run one prompt, see a real answer, then keep moving."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href={toHref(`/academy/${activationLessonSlug}`)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            {installDone ? 'Run your first agent' : 'Install Hermes now'}
          </Link>
          {!installDone ? (
            <Link
              href={toHref(`/academy/${firstRunLessonSlug}`)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200"
            >
              Already installed? Go to first prompt
            </Link>
          ) : null}
        </div>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">First 10 minutes</p>
          <div className="mt-4 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-slate-200">
            <p className="font-medium text-white">Fastest path to value</p>
            <p className="mt-2">
              {firstRunDone
                ? 'You already cleared the first win. Keep momentum and open the next lesson now.'
                : installDone
                  ? 'Good. The install is done. Now run one tiny prompt and get the first visible answer.'
                  : 'Do not pick a framework. Do not compare tools. Install Hermes and make the command work first.'}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {activationChecklist.map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <span className="mr-3 text-emerald-200">0{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
            <p className="font-medium text-white">Current state</p>
            <p className="mt-3">Lane locked: {activeTrack.title}</p>
            <p className="mt-2">Completed lessons: {derived.completedLessonCount}</p>
            <p className="mt-2">Next lesson: {derived.nextLesson?.title ?? 'none'}</p>
            <p className="mt-2">Visible success moment: {firstRunDone ? 'done' : installDone ? 'one prompt away' : 'install first'}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Activation lane</p>
          <article className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{firstTrack.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{firstTrack.intro}</p>
                <p className="mt-3 text-sm text-emerald-100">Outcome: {firstTrack.outcome}</p>
              </div>
              <span className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">Do this first</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {firstTrack.checklist.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-300">
              {firstRunDone
                ? 'You already got the first win. Use the main action above and keep the sequence moving.'
                : installDone
                  ? 'Hermes is installed. Skip the overview and open the first prompt lesson now.'
                  : 'Everything else can wait. Open the install lesson and get the command working.'}
            </div>
          </article>

          {firstRunDone ? (
            <div className="mt-6 grid gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unlocked next</p>
              {PICO_TRACKS.slice(1).map((track) => {
                const selected = progress.selectedTrack === track.slug
                const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
                return (
                  <article key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{track.intro}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => actions.pickTrack(track.slug)}
                        disabled={!unlocked}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {selected ? 'Active lane' : unlocked ? 'Set as lane' : 'Locked'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
              Ignore the later lanes until the first local run works. More choices this early are just prettier procrastination.
            </div>
          )}
        </div>
      </section>
    </PicoShell>
  )
}
