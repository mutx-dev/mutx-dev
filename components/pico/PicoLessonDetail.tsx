'use client'

import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { getLessonBySlug, type PicoLesson } from '@/lib/pico/academy'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const { progress, derived, actions } = usePicoProgress()
  const completed = progress.completedLessons.includes(lesson.slug)
  const unlocked = derived.unlockedLessonSlugs.includes(lesson.slug)
  const nextLesson = lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null

  return (
    <PicoShell
      eyebrow={`Level ${lesson.level} • ${lesson.track.replace('-', ' ')}`}
      title={lesson.title}
      description={lesson.summary}
      actions={
        <>
          <button
            type="button"
            onClick={() => actions.startLesson(lesson.slug)}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Mark started
          </button>
          <button
            type="button"
            disabled={!unlocked}
            onClick={() => actions.completeLesson(lesson.slug)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completed ? 'Completed' : `Complete for +${lesson.xp} XP`}
          </button>
        </>
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
                  return prerequisiteLesson ? (
                    <Link
                      key={prerequisite}
                      href={`/academy/${prerequisiteLesson.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
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
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Next</p>
            {nextLesson ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-white">{nextLesson.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{nextLesson.summary}</p>
                <div className="mt-4 flex gap-3">
                  <Link href={`/academy/${nextLesson.slug}`} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                    Open next lesson
                  </Link>
                  <Link href="/tutor" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                    Ask tutor
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-300">You are at the end of this branch. Open Autopilot and inspect what the runtime is doing.</p>
                <Link href="/autopilot" className="mt-4 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                  Open autopilot
                </Link>
              </>
            )}
          </section>
        </aside>
      </div>
    </PicoShell>
  )
}
