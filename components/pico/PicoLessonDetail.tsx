'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { PicoSurfaceCompass } from '@/components/pico/PicoSurfaceCompass'
import {
  picoClasses,
  picoCodex,
  picoCodexFrame,
  picoCodexInset,
  picoCodexNote,
  picoCodexSheet,
} from '@/components/pico/picoTheme'
import { usePicoLessonWorkspace } from '@/components/pico/usePicoLessonWorkspace'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoSession } from '@/components/pico/usePicoSession'
import { getLessonBySlug, getTrackBySlug, type PicoLesson } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

const revealTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
}

function getCompleteLabel(lessonSlug: string) {
  if (lessonSlug === 'install-hermes-locally') {
    return 'Hermes is installed'
  }
  if (lessonSlug === 'run-your-first-agent') {
    return 'Holy shit, it works'
  }
  return 'Complete this lesson'
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

function formatDifficulty(difficulty: PicoLesson['difficulty']) {
  if (difficulty === 'setup') return 'setup'
  if (difficulty === 'operator') return 'runtime'
  return 'builder'
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const session = usePicoSession()
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()

  const started = progress.startedLessons.includes(lesson.slug)
  const completed = progress.completedLessons.includes(lesson.slug)
  const nextLesson = lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null
  const missingPrerequisite = lesson.prerequisites.find(
    (prerequisite) => !progress.completedLessons.includes(prerequisite),
  )
  const missingPrerequisiteLesson = missingPrerequisite
    ? getLessonBySlug(missingPrerequisite)
    : null
  const approvalLesson = lesson.slug === 'add-an-approval-gate'
  const approvalSetupHref = toHref('/autopilot#approvals-section')
  const track = getTrackBySlug(lesson.track)
  const trackLessons =
    track?.lessons.map((slug) => getLessonBySlug(slug)).filter((entry): entry is PicoLesson => Boolean(entry)) ?? []
  const lessonIndex = trackLessons.findIndex((item) => item.slug === lesson.slug)
  const previousLesson = lessonIndex > 0 ? trackLessons[lessonIndex - 1] ?? null : null

  const {
    workspace,
    completedStepCount,
    progressPercent,
    actions: workspaceActions,
  } = usePicoLessonWorkspace(lesson.slug, lesson.steps.length, {
    progress,
    persistRemote: (lessonSlug, nextWorkspace) =>
      actions.setLessonWorkspace(lessonSlug, nextWorkspace),
  })

  const activeStepIndex = workspace.activeStepIndex >= 0 ? workspace.activeStepIndex : 0
  const activeWorkspaceStep = lesson.steps[activeStepIndex] ?? lesson.steps[0] ?? null
  const evidenceReady = workspace.evidence.trim().length > 0
  const hostedStamp =
    session.status === 'authenticated'
      ? session.user.isEmailVerified === false
        ? 'verify host'
        : 'hosted attached'
      : session.status === 'unauthenticated'
        ? 'local only'
        : session.status === 'error'
          ? 'auth error'
        : 'checking'

  const studioReviewBoard = [
    {
      label: '01 • Brief',
      title: 'The lesson outcome',
      body: lesson.objective,
    },
    {
      label: '02 • Deliverable',
      title: 'What the saved output should show',
      body: lesson.expectedResult,
    },
    {
      label: '03 • Critique',
      title: 'The check before you move on',
      body: lesson.validation,
    },
  ]

  const studioContext = [
    {
      label: 'Track arc',
      value: track?.outcome ?? 'Build one working setup outcome.',
    },
    {
      label: 'Lesson outcome',
      value: lesson.outcome,
    },
    {
      label: 'Time and weight',
      value: `${lesson.estimatedMinutes}m • ${lesson.xp} xp • ${formatDifficulty(lesson.difficulty)}`,
    },
  ]

  useEffect(() => {
    if (!missingPrerequisiteLesson && !started && !completed) {
      actions.startLesson(lesson.slug)
    }
    if (
      progress.platform.activeSurface !== 'lesson' ||
      progress.platform.lastOpenedLessonSlug !== lesson.slug
    ) {
      actions.setPlatform({
        activeSurface: 'lesson',
        lastOpenedLessonSlug: lesson.slug,
      })
    }
  }, [
    actions,
    completed,
    lesson.slug,
    missingPrerequisiteLesson,
    progress.platform.activeSurface,
    progress.platform.lastOpenedLessonSlug,
    started,
  ])

  function renderPrimaryLessonAction(buttonClassName: string) {
    if (missingPrerequisiteLesson) {
      return (
        <Link
          href={toHref(`/academy/${missingPrerequisiteLesson.slug}`)}
          className={buttonClassName}
        >
          Complete {missingPrerequisiteLesson.title} first
        </Link>
      )
    }

    if (completed) {
      return (
        <Link
          href={toHref(nextLesson ? `/academy/${nextLesson.slug}` : '/autopilot')}
          className={buttonClassName}
        >
          {getCompletedNextLabel(nextLesson)}
        </Link>
      )
    }

    if (approvalLesson) {
      return (
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link href={approvalSetupHref} className={buttonClassName}>
            Open live approval setup
          </Link>
          <button
            type="button"
            onClick={() => actions.completeLesson(lesson.slug)}
            className={picoClasses.secondaryButton}
          >
            {getCompleteLabel(lesson.slug)}
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => actions.completeLesson(lesson.slug)}
        className={buttonClassName}
      >
        {getCompleteLabel(lesson.slug)}
      </button>
    )
  }

  return (
    <PicoShell
      mode="academy"
      eyebrow={`Lesson ${String(Math.max(lessonIndex, 0) + 1).padStart(2, '0')}`}
      title={lesson.title}
      description={lesson.summary}
      railCollapsed={progress.platform.railCollapsed}
      helpLaneOpen={progress.platform.helpLaneOpen}
      onToggleRail={() =>
        actions.setPlatform({ railCollapsed: !progress.platform.railCollapsed })
      }
      onToggleHelpLane={() =>
        actions.setPlatform({ helpLaneOpen: !progress.platform.helpLaneOpen })
      }
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
        className={picoCodexFrame('overflow-hidden px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10')}
        data-testid="pico-lesson-campaign-hero"
      >
        <div className="grid gap-8 lg:grid-cols-[8rem,minmax(0,1fr)]">
          <div className="grid content-between gap-6 border-b border-[color:var(--pico-border)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="grid gap-2">
              <p className={picoClasses.label}>Lesson</p>
              <p className="font-[family:var(--font-site-display)] text-7xl leading-none tracking-[-0.08em] text-[color:var(--pico-accent)] sm:text-8xl">
                {String(Math.max(lessonIndex, 0) + 1).padStart(2, '0')}
              </p>
            </div>

            <div className="grid gap-2">
              <p className={picoClasses.label}>Track</p>
              <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {track?.title ?? 'Unmapped'}
              </p>
              <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {track && lessonIndex >= 0 ? `${lessonIndex + 1}/${trackLessons.length}` : 'not mapped'}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoCodex.stamp}>Lesson brief</span>
              <span className={picoCodex.stamp}>{hostedStamp}</span>
              <span className={picoCodex.stamp}>
                {completed ? 'sealed' : started ? 'active' : 'ready'}
              </span>
            </div>

            <div className="grid gap-4">
              <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[color:var(--pico-text)] sm:text-7xl">
                {lesson.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[color:var(--pico-text-secondary)]">
                {lesson.objective}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--pico-text-muted)]">
                Expected result: {lesson.expectedResult}
              </p>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              {renderPrimaryLessonAction(picoClasses.primaryButton)}
              <Link
                href={toHref(`/tutor?lesson=${lesson.slug}`)}
                className={cn(picoClasses.secondaryButton, 'scroll-mb-40')}
              >
                Ask the tutor about this lesson
              </Link>
            </div>

            <div className="grid gap-3 border-t border-[color:var(--pico-border)] pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1">
                <p className={picoClasses.label}>State</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {missingPrerequisiteLesson ? 'blocked' : completed ? 'sealed' : 'active'}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {missingPrerequisiteLesson ? 'finish the prerequisite first' : 'one setup step'}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Output</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {evidenceReady ? 'saved' : 'pending'}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {activeWorkspaceStep?.title ?? 'Choose a step'}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Progress</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {completedStepCount}/{lesson.steps.length}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">steps cleared</p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Telemetry</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {lesson.estimatedMinutes}m
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {lesson.xp} xp • {formatDifficulty(lesson.difficulty)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...revealTransition, delay: 0.04 }}
        className={picoCodexFrame('px-6 py-6 sm:px-8 sm:py-8')}
        data-testid="pico-lesson-studio-review"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Lesson review</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  Brief, output, check
                </h2>
              </div>
              <span className={picoCodex.stamp}>one real lesson at a time</span>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {studioReviewBoard.map((item) => (
                <article key={item.label} className={picoCodexInset('flex h-full flex-col p-5')}>
                  <p className={picoClasses.label}>{item.label}</p>
                  <h3 className="mt-5 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className={picoCodexNote('p-5')}>
              <p className={picoClasses.label}>Chapter context</p>
              <div className="mt-4 grid gap-4">
                {studioContext.map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-2 border-t border-[color:var(--pico-border)] pt-4 first:border-t-0 first:pt-0"
                  >
                    <p className={picoClasses.label}>{item.label}</p>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={picoCodexInset('p-5')}>
              <p className={picoClasses.label}>Lesson rule</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                Keep this lesson narrow. The goal is to save one useful output you can reopen later.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="xl:hidden">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {lesson.steps.map((step, index) => {
              const active = activeStepIndex === index
              const done = workspace.completedStepIndexes.includes(index)

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => workspaceActions.setActiveStep(index)}
                  className={cn(
                    'grid min-w-[13rem] gap-2 rounded-[24px] border px-4 py-4 text-left transition',
                    active
                      ? 'border-[color:var(--pico-accent)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.22),rgba(8,16,10,0.32))] text-[color:var(--pico-text)]'
                      : 'border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] text-[color:var(--pico-text-secondary)]',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={picoCodex.stamp}>{String(index + 1).padStart(2, '0')}</span>
                    {done ? <span className={picoCodex.stamp}>done</span> : null}
                  </div>
                  <span className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em]">
                    {step.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
        className={cn(
          'grid gap-6',
          !progress.platform.railCollapsed && progress.platform.helpLaneOpen
            ? 'xl:grid-cols-[14rem,minmax(0,1fr),17rem]'
            : !progress.platform.railCollapsed
              ? 'xl:grid-cols-[14rem,minmax(0,1fr)]'
              : progress.platform.helpLaneOpen
                ? 'xl:grid-cols-[minmax(0,1fr),17rem]'
                : 'xl:grid-cols-[minmax(0,1fr)]',
        )}
      >
        {!progress.platform.railCollapsed ? (
          <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">
            <section className={picoCodexFrame('p-5')}>
              <p className={picoClasses.label}>Lesson steps</p>
              <div className="mt-4 grid gap-4">
                {lesson.steps.map((step, index) => {
                  const active = activeStepIndex === index
                  const done = workspace.completedStepIndexes.includes(index)

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => workspaceActions.setActiveStep(index)}
                      className={cn(
                        'grid gap-2 border-l pl-4 text-left transition',
                        active
                          ? 'border-[color:var(--pico-accent)] text-[color:var(--pico-text)]'
                          : 'border-[color:var(--pico-border)] text-[color:var(--pico-text-secondary)] hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={picoCodex.stamp}>{String(index + 1).padStart(2, '0')}</span>
                        {done ? <span className={picoCodex.stamp}>done</span> : null}
                        {active ? <span className={picoCodex.stamp}>active</span> : null}
                      </div>
                      <span className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em]">
                        {step.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </aside>
        ) : null}

        <section className={picoCodexFrame('p-6 sm:p-7')} data-testid="pico-lesson-workspace">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Lesson workspace</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                {activeWorkspaceStep?.title ?? 'Select a step'}
              </h2>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => workspaceActions.reset()}
                className={picoClasses.tertiaryButton}
              >
                Reset workspace
              </button>
              <button
                type="button"
                onClick={() => workspaceActions.toggleStep(activeStepIndex)}
                className={
                  workspace.completedStepIndexes.includes(activeStepIndex)
                    ? picoClasses.secondaryButton
                    : picoClasses.primaryButton
                }
                data-testid={activeStepIndex === 0 ? 'pico-step-toggle-first' : undefined}
              >
                {workspace.completedStepIndexes.includes(activeStepIndex)
                  ? 'Reopen step'
                  : 'Mark step done'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <article className={picoCodexSheet('p-5')}>
              <p className={picoClasses.label}>Step brief</p>
              <p className="mt-4 text-base leading-8 text-[color:var(--pico-text-secondary)]">
                {activeWorkspaceStep?.body ??
                  'Choose a step from the lesson to start.'}
              </p>
              {activeWorkspaceStep?.command ? (
                <pre className="mt-5 overflow-x-auto rounded-[22px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] p-4 text-sm text-[color:var(--pico-accent-bright)]">
                  <code>{activeWorkspaceStep.command}</code>
                </pre>
              ) : null}
              {activeWorkspaceStep?.note ? (
                <div className={picoCodexNote('mt-5 p-4')}>
                  <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{activeWorkspaceStep.note}</p>
                </div>
              ) : null}
            </article>

            <div id="pico-proof-composer" className="grid gap-4 lg:grid-cols-2">
              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>Saved output</span>
                <textarea
                  value={workspace.evidence}
                  onChange={(event) => workspaceActions.setEvidence(event.target.value)}
                  placeholder="Paste the output, transcript note, or file path from this step."
                  className="min-h-40 rounded-[18px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-sm text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  data-testid="pico-lesson-proof"
                />
              </label>

              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>Bench notes</span>
                <textarea
                  value={workspace.notes}
                  onChange={(event) => workspaceActions.setNotes(event.target.value)}
                  placeholder="Capture the blocker, file path, or command variation that mattered."
                  className="min-h-40 rounded-[18px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-sm text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className={picoCodexNote('p-5')}>
                <p className={picoClasses.label}>Review state</p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {completed ? 'sealed' : evidenceReady ? 'ready' : 'pending'}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {completed
                    ? 'The lesson is complete. Move on while the context is fresh.'
                    : evidenceReady
                      ? 'The output is saved. Mark the lesson complete and keep moving.'
                      : 'Save the output before marking the lesson complete.'}
                </p>
                <div className="mt-5">{renderPrimaryLessonAction(picoClasses.secondaryButton)}</div>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>Chapter completion</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {completedStepCount}/{lesson.steps.length}
                  </p>
                  <div className="mt-4 overflow-hidden rounded-full bg-[color:var(--pico-bg-input)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className={picoCodexInset('p-4')}>
                <p className={picoClasses.label}>Next action</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Finish the step, save the output, then either complete the lesson or get help.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {progress.platform.helpLaneOpen ? (
          <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">
            <section className={picoCodexFrame('p-5')} data-testid="pico-help-lane-panel">
              <p className={picoClasses.label}>Field notes</p>
              <div className="mt-4 grid gap-3">
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>Stay here when</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    the current step still contains the answer and the setup does not need escalation yet.
                  </p>
                </div>
                <Link
                  href={toHref(`/tutor?lesson=${lesson.slug}`)}
                  className={picoCodexNote('p-4 transition hover:border-[color:var(--pico-border-hover)]')}
                >
                  <p className={picoClasses.label}>Exact blocker</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">Ask tutor</p>
                </Link>
                <Link
                  href={approvalLesson ? approvalSetupHref : toHref('/autopilot')}
                  className={picoCodexInset('p-4 transition hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]')}
                >
                  <p className={picoClasses.label}>Runtime state</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {approvalLesson ? 'Open live approval setup' : 'Inspect Autopilot'}
                  </p>
                </Link>
                <Link
                  href={toHref('/support')}
                  className={picoCodexInset('p-4 transition hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]')}
                >
                  <p className={picoClasses.label}>Setup help</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">Get setup help</p>
                </Link>
              </div>
            </section>
          </aside>
        ) : null}
      </motion.section>

      <div id="pico-lesson-recovery">
        <PicoSurfaceCompass
          title="Keep the lesson narrow until the output is saved"
          body="Use Tutor for one blocked command, switch to Autopilot when runtime state matters, and get human help when setup needs API keys, hosting, integrations, or custom work."
          status={
            missingPrerequisiteLesson
              ? 'blocked by prerequisite'
              : completed
                ? 'lesson complete'
                : started
                  ? 'lesson active'
                  : 'ready to execute'
          }
          aside="Keep support below the lesson so the main step stays clear."
          items={[
            {
              href: toHref(`/tutor?lesson=${lesson.slug}`),
              label: 'Ask tutor about this lesson',
              caption: 'Use this when one command, file path, or validation check is failing.',
              note: 'Blocked',
              tone: 'primary',
            },
            {
              href: missingPrerequisiteLesson
                ? toHref(`/academy/${missingPrerequisiteLesson.slug}`)
                : toHref('/academy'),
              label: missingPrerequisiteLesson
                ? `Open ${missingPrerequisiteLesson.title}`
                : 'Return to academy map',
              caption: 'Step back to the lesson map when the sequence itself is the problem.',
              note: 'Backtrack',
            },
            {
              href: approvalLesson ? approvalSetupHref : toHref('/autopilot'),
              label: approvalLesson ? 'Open live approval setup' : 'Inspect Autopilot',
              caption: 'Switch here when the blocker depends on live runtime or approvals.',
              note: 'Runtime',
              tone: 'soft',
            },
            {
              href: toHref('/support'),
              label: 'Get setup help',
              caption: 'Use this when the lesson, Tutor, and runtime view are not enough.',
              note: 'Support',
            },
          ]}
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr),18rem]"
      >
        <section className={picoCodexFrame('p-6')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Troubleshooting appendix</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                The smaller notes you only read when setup gets stuck
              </h2>
            </div>
            <span className={picoCodex.stamp}>{lesson.steps.length} steps</span>
          </div>

          <div className="mt-6 grid gap-4">
            {lesson.troubleshooting.map((item) => (
              <div key={item} className={picoCodexInset('px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]')}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {derived.nextCapability ? (
            <section className={picoCodexFrame('p-5')}>
              <p className={picoClasses.label}>Next capability</p>
              <div className={picoCodexNote('mt-4 p-5')}>
                <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {derived.nextCapability.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {derived.nextCapability.description}
                </p>
                <Link
                  href={toHref(derived.nextCapability.href)}
                  className={cn(picoClasses.primaryButton, 'mt-4')}
                >
                  {derived.nextCapability.actionLabel}
                </Link>
              </div>
            </section>
          ) : null}

          <section className={picoCodexFrame('p-5')}>
            <p className={picoClasses.label}>Route memory</p>
            <div className={picoCodexInset('mt-4 p-4')}>
              <div className="grid gap-3">
                {previousLesson ? (
                  <Link
                    href={toHref(`/academy/${previousLesson.slug}`)}
                    className={picoClasses.tertiaryButton}
                  >
                    Previous lesson
                  </Link>
                ) : null}
                <Link href={toHref('/academy')} className={picoClasses.secondaryButton}>
                  Back to academy map
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </motion.section>
    </PicoShell>
  )
}
