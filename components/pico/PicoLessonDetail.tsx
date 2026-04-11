'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { getLessonBySlug, type PicoLesson } from '@/lib/pico/academy'
import { getPicoLessonFollowUp } from '@/lib/pico/journey'
import { usePicoHref } from '@/lib/pico/navigation'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const completed = progress.completedLessons.includes(lesson.slug)
  const unlocked = derived.unlockedLessonSlugs.includes(lesson.slug)
  const followUp = useMemo(() => getPicoLessonFollowUp(progress, lesson.slug), [progress, lesson.slug])

  useEffect(() => {
    if (!progress.startedLessons.includes(lesson.slug)) {
      actions.startLesson(lesson.slug)
    }
  }, [actions, lesson.slug, progress.startedLessons])

  return (
    <PicoShell
      eyebrow={`Level ${lesson.level} • ${lesson.track.replace('-', ' ')}`}
      title={lesson.title}
      description={lesson.summary}
      actions={
        followUp?.kind === 'complete' ? (
          <button
            type="button"
            disabled={!unlocked || completed}
            onClick={() => actions.completeLesson(lesson.slug)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {followUp.label}
          </button>
        ) : followUp?.href ? (
          <Link
            href={toHref(followUp.href)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {followUp.label}
          </Link>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lesson brief</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Objective</p>
              <p className="mt-2">{lesson.objective}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Outcome</p>
              <p className="mt-2">{lesson.outcome}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Expected result</p>
              <p className="mt-2">{lesson.expectedResult}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Validation</p>
              <p className="mt-2">{lesson.validation}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {lesson.steps.map((step, index) => (
              <article key={step.title} className="rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
                {step.command ? (
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-emerald-200">
                    <code>{step.command}</code>
                  </pre>
                ) : null}
                {step.note ? <p className="mt-3 text-sm text-amber-100">{step.note}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Prerequisites</p>
            <div className="mt-4 space-y-2">
              {lesson.prerequisites.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">No prerequisites. Good. Move.</p>
              ) : (
                lesson.prerequisites.map((prerequisite) => {
                  const prerequisiteLesson = getLessonBySlug(prerequisite)
                  const prerequisiteDone = progress.completedLessons.includes(prerequisite)
                  if (!prerequisiteLesson) {
                    return null
                  }

                  return (
                    <Link
                      key={prerequisite}
                      href={toHref(`/academy/${prerequisiteLesson.slug}`)}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      <span>{prerequisiteLesson.title}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {prerequisiteDone ? 'done' : 'required'}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Troubleshooting</p>
            <div className="mt-4 space-y-3">
              {lesson.troubleshooting.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Next action</p>
            {followUp ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-white">{followUp.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{followUp.description}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {followUp.kind === 'complete' ? (
                    <button
                      type="button"
                      disabled={!unlocked || completed}
                      onClick={() => actions.completeLesson(lesson.slug)}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {followUp.label}
                    </button>
                  ) : followUp.href ? (
                    <Link href={toHref(followUp.href)} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                      {followUp.label}
                    </Link>
                  ) : null}
                  {!completed ? (
                    <Link href={toHref('/tutor')} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                      Ask tutor if blocked
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-300">Ask tutor if you need help finding the next step.</p>
            )}
          </section>
        </aside>
      </div>
    </PicoShell>
  )
}
