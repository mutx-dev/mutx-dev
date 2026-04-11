'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { getLessonBySlug, type PicoLesson } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

function getStartLabel(lessonSlug: string) {
  if (lessonSlug === 'install-hermes-locally') {
    return 'Install Hermes now'
  }
  if (lessonSlug === 'run-your-first-agent') {
    return 'Run your first prompt'
  }
  return 'Start this lesson'
}

function getCompleteLabel(lessonSlug: string) {
  if (lessonSlug === 'install-hermes-locally') {
    return 'Hermes is installed'
  }
  if (lessonSlug === 'run-your-first-agent') {
    return 'Holy shit, it works'
  }
  return 'Validate and complete lesson'
}

function getCompletedNextLabel(nextLesson: PicoLesson | null) {
  if (!nextLesson) {
    return 'Open Autopilot'
  }
  if (nextLesson.slug === 'run-your-first-agent') {
    return 'Run your first agent now'
  }
  return `Open ${nextLesson.title}`
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const { progress, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const started = progress.startedLessons.includes(lesson.slug)
  const completed = progress.completedLessons.includes(lesson.slug)
  const nextLesson = lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null
  const missingPrerequisite = lesson.prerequisites.find((prerequisite) => !progress.completedLessons.includes(prerequisite))
  const missingPrerequisiteLesson = missingPrerequisite ? getLessonBySlug(missingPrerequisite) : null
  const activationLesson = lesson.slug === 'install-hermes-locally' || lesson.slug === 'run-your-first-agent'
  const approvalLesson = lesson.slug === 'add-an-approval-gate'
  const approvalSetupHref = toHref('/autopilot#approvals-section')

  useEffect(() => {
    if (!missingPrerequisiteLesson && !started && !completed) {
      actions.startLesson(lesson.slug)
    }
  }, [actions, completed, lesson.slug, missingPrerequisiteLesson, started])

  return (
    <PicoShell
      eyebrow={`Level ${lesson.level} • ${lesson.track.replace('-', ' ')}`}
      title={lesson.title}
      description={lesson.summary}
      actions={
        missingPrerequisiteLesson ? (
          <Link
            href={toHref(`/academy/${missingPrerequisiteLesson.slug}`)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Complete {missingPrerequisiteLesson.title} first
          </Link>
        ) : completed ? (
          <Link
            href={toHref(nextLesson ? `/academy/${nextLesson.slug}` : '/autopilot')}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {getCompletedNextLabel(nextLesson)}
          </Link>
        ) : approvalLesson ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href={approvalSetupHref}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Open live approval setup
            </Link>
            <button
              type="button"
              onClick={() => actions.completeLesson(lesson.slug)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {getCompleteLabel(lesson.slug)}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => actions.completeLesson(lesson.slug)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {getCompleteLabel(lesson.slug)}
          </button>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          {activationLesson ? (
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">Fastest path</p>
              <p className="mt-3 font-medium text-white">Get the first visible win before you optimize anything.</p>
              <p className="mt-2 leading-6">
                Timebox this to about {lesson.estimatedMinutes} minutes. Stop the moment you get the expected result, lock it in with the main button, then move to the next lesson.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Right now</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Main move</p>
              <p className="mt-2">
                {missingPrerequisiteLesson
                  ? `Finish ${missingPrerequisiteLesson.title} first.`
                  : completed
                    ? `You finished this lesson. Open ${nextLesson?.title ?? 'Autopilot'} now.`
                    : activationLesson
                      ? `Do the steps, get the visible result, then hit “${getCompleteLabel(lesson.slug)}”.`
                      : `Finish the steps, validate the result, then mark the lesson complete.`}
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Time</p>
                <p className="mt-2">About {lesson.estimatedMinutes} minutes</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4 text-sm text-slate-300">
                <p className="font-medium text-white">State</p>
                <p className="mt-2">{completed ? 'Completed' : started ? 'In progress' : getStartLabel(lesson.slug)}</p>
              </div>
            </div>
          </section>

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
                      href={toHref(`/academy/${prerequisiteLesson.slug}`)}
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
            <Link href={toHref(`/tutor?lesson=${lesson.slug}`)} className="mt-4 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
              Ask the tutor about this lesson
            </Link>
          </section>
        </aside>
      </div>
    </PicoShell>
  )
}
