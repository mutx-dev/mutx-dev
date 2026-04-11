'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PicoDisclosure, PicoNowNext } from '@/components/pico/PicoSimpleFlow'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_LEVELS, PICO_TRACKS, getLessonBySlug, getTrackBySlug } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

export function PicoAcademyDashboard() {
  const router = useRouter()
  const { progress, derived, syncState, ready, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const nextLesson = derived.nextLesson
  const currentLesson = [...progress.startedLessons]
    .reverse()
    .map((lessonSlug) => getLessonBySlug(lessonSlug))
    .find((lesson) => lesson && !progress.completedLessons.includes(lesson.slug)) ?? null
  const selectedTrack = progress.selectedTrack ? getTrackBySlug(progress.selectedTrack) : null

  return (
    <PicoShell
      eyebrow="Academy core"
      title="Move one lesson at a time"
      description="The academy should tell you where you are and what to do next. The rest can stay folded away until it matters."
      actions={
        nextLesson ? (
          <Link
            href={toHref(`/academy/${nextLesson.slug}`)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Continue with {nextLesson.title}
          </Link>
        ) : (
          <Link
            href={toHref('/autopilot')}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Open autopilot
          </Link>
        )
      }
    >
      <PicoNowNext
        current={{
          label: 'Current step',
          title: currentLesson?.title ?? selectedTrack?.title ?? 'Pick your first track',
          body: currentLesson
            ? `${currentLesson.objective} Keep working until the validation is true.`
            : selectedTrack
              ? `${selectedTrack.outcome} Pico will keep routing inside this lane.`
              : 'No active track yet. Pick one lane so the product can stay quiet and useful.',
          actions: currentLesson ? (
            <Link
              href={toHref(`/academy/${currentLesson.slug}`)}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Resume current lesson
            </Link>
          ) : null,
        }}
        next={{
          label: 'Next step',
          title: nextLesson ? nextLesson.title : 'Run the control loop',
          body: nextLesson
            ? `${nextLesson.validation} That is the next useful move.`
            : 'You cleared the current map. Now inspect live behavior, spend, and approvals in Autopilot.',
          actions: (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!nextLesson) {
                    router.push(toHref('/autopilot'))
                    return
                  }

                  actions.startLesson(nextLesson.slug)
                  router.push(toHref(`/academy/${nextLesson.slug}`))
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                {nextLesson ? 'Start next lesson' : 'Open autopilot'}
              </button>
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
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active lane</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {selectedTrack ? selectedTrack.title : 'Choose the path you actually want live'}
            </h2>
          </div>
          <Link href={toHref('/onboarding')} className="text-sm font-medium text-emerald-200 hover:text-emerald-100">
            Change lane
          </Link>
        </div>

        {selectedTrack ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">{selectedTrack.outcome}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/60">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${
                    (selectedTrack.lessons.filter((lessonSlug) => progress.completedLessons.includes(lessonSlug)).length /
                      selectedTrack.lessons.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              {
                selectedTrack.lessons.filter((lessonSlug) => progress.completedLessons.includes(lessonSlug)).length
              }/{selectedTrack.lessons.length} lessons complete
            </p>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {selectedTrack.lessons.map((lessonSlug) => {
                const lesson = getLessonBySlug(lessonSlug)
                if (!lesson) return null
                const completed = progress.completedLessons.includes(lesson.slug)
                return (
                  <Link
                    key={lesson.slug}
                    href={toHref(`/academy/${lesson.slug}`)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <span>{lesson.title}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {completed ? 'done' : 'open'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {PICO_TRACKS.map((track) => (
              <article key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{track.outcome}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => actions.pickTrack(track.slug)}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Set active
                  </button>
                  <Link
                    href={toHref(`/academy/${track.lessons[0]}`)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                  >
                    Open first lesson
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <PicoDisclosure
          title="Show progress details"
          hint="XP, badges, sync state, and counters are useful, but they should not drown the next action."
        >
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p>XP: {derived.xp}</p>
              <p className="mt-2">Lessons: {derived.completedLessonCount}/{derived.totalLessons}</p>
              <p className="mt-2">Level: L{derived.currentLevel}</p>
              <p className="mt-2">Ready: {ready ? 'yes' : 'loading'}</p>
              <p className="mt-2">Sync: {syncState}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p>Selected track: {progress.selectedTrack ?? 'none yet'}</p>
              <p className="mt-2">Started lessons: {progress.startedLessons.length}</p>
              <p className="mt-2">Tutor questions: {progress.tutorQuestions}</p>
              <p className="mt-2">Support requests: {progress.supportRequests}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {derived.badges.length > 0 ? (
                  derived.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No badges yet.</span>
                )}
              </div>
            </div>
          </div>
        </PicoDisclosure>

        <PicoDisclosure
          title="Show full academy map"
          hint="Keep the whole progression map available, just not shoved in the user's face by default."
        >
          <div className="space-y-4">
            {PICO_LEVELS.map((level) => {
              const completed = progress.completedLessons.filter((lessonSlug) => {
                const lesson = getLessonBySlug(lessonSlug)
                return lesson?.level === level.id
              }).length
              const total = PICO_TRACKS.flatMap((track) => track.lessons).filter(
                (lessonSlug) => getLessonBySlug(lessonSlug)?.level === level.id,
              ).length
              return (
                <div key={level.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Level {level.id}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{level.title}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {level.badge}
                    </span>
                  </div>
                  <p className="mt-3">{level.objective}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {completed}/{total} lessons complete • reward {level.xpReward} xp
                  </p>
                </div>
              )
            })}
          </div>
        </PicoDisclosure>
      </div>
    </PicoShell>
  )
}
