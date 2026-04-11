'use client'

import Link from 'next/link'

import { PicoDisclosure, PicoNowNext } from '@/components/pico/PicoSimpleFlow'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { getLessonBySlug, type PicoLesson } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const completed = progress.completedLessons.includes(lesson.slug)
  const unlocked = derived.unlockedLessonSlugs.includes(lesson.slug)
  const nextLesson = lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null

  return (
    <PicoShell
      eyebrow={`Level ${lesson.level} • ${lesson.track.replace('-', ' ')}`}
      title={lesson.title}
      description={lesson.summary}
      actions={
        <button
          type="button"
          onClick={() => actions.completeLesson(lesson.slug)}
          disabled={!unlocked}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completed ? 'Completed' : `Complete for +${lesson.xp} XP`}
        </button>
      }
    >
      <PicoNowNext
        current={{
          label: 'Current step',
          title: lesson.title,
          body: `${lesson.objective} Do the actions below until the validation is true.`,
          actions: (
            <button
              type="button"
              onClick={() => actions.startLesson(lesson.slug)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Mark started
            </button>
          ),
        }}
        next={{
          label: 'Next step',
          title: nextLesson ? nextLesson.title : 'Inspect live runtime behavior',
          body: nextLesson
            ? `${nextLesson.summary} Do not jump there until this lesson validates.`
            : 'You are at the end of this branch. Open Autopilot and inspect what the runtime is doing.',
          actions: nextLesson ? (
            <Link
              href={toHref(`/academy/${nextLesson.slug}`)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Open next lesson
            </Link>
          ) : (
            <Link
              href={toHref('/autopilot')}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Open autopilot
            </Link>
          ),
        }}
      />

      <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Action list</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Do this now</h2>
          </div>
          <Link href={toHref('/tutor')} className="text-sm font-medium text-emerald-200 hover:text-emerald-100">
            Ask tutor if blocked
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          {lesson.steps.map((step, index) => (
            <article key={step.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Action {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
              {step.command ? (
                <details className="mt-4 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-white">Show command</summary>
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-emerald-200">
                    <code>{step.command}</code>
                  </pre>
                </details>
              ) : null}
              {step.note ? (
                <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {step.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <PicoDisclosure
          title="Show what done looks like"
          hint="Keep success criteria visible without dumping the full lesson brief first."
          defaultOpen
        >
          <div className="grid gap-4 text-sm text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Outcome</p>
              <p className="mt-2">{lesson.outcome}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Expected result</p>
              <p className="mt-2">{lesson.expectedResult}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Validation</p>
              <p className="mt-2">{lesson.validation}</p>
            </div>
          </div>
        </PicoDisclosure>

        <PicoDisclosure
          title="Show prerequisites and troubleshooting"
          hint="Useful when something is broken. Noise when things are moving."
        >
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Prerequisites</p>
              <div className="mt-3 space-y-2">
                {lesson.prerequisites.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3">No prerequisites. Good. Move.</p>
                ) : (
                  lesson.prerequisites.map((prerequisite) => {
                    const prerequisiteLesson = getLessonBySlug(prerequisite)
                    const prerequisiteDone = progress.completedLessons.includes(prerequisite)
                    return prerequisiteLesson ? (
                      <Link
                        key={prerequisite}
                        href={toHref(`/academy/${prerequisiteLesson.slug}`)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3"
                      >
                        <span>{prerequisiteLesson.title}</span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {prerequisiteDone ? 'done' : 'required'}
                        </span>
                      </Link>
                    ) : null
                  })
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Troubleshooting</p>
              <div className="mt-3 space-y-2">
                {lesson.troubleshooting.map((item) => (
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
