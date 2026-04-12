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
  return 'Seal this chapter'
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
  if (difficulty === 'operator') return 'operator'
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
        <div className="flex flex-wrap gap-3">
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
      eyebrow={`Chapter ${String(Math.max(lessonIndex, 0) + 1).padStart(2, '0')} • lesson lane`}
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
          <div className="grid content-between gap-6 border-b border-[#5d412d] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="grid gap-2">
              <p className={picoClasses.label}>Lesson</p>
              <p className="font-[family:var(--font-site-display)] text-7xl leading-none tracking-[-0.08em] text-[#f0bb83] sm:text-8xl">
                {String(Math.max(lessonIndex, 0) + 1).padStart(2, '0')}
              </p>
            </div>

            <div className="grid gap-2">
              <p className={picoClasses.label}>Track</p>
              <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                {track?.title ?? 'Unmapped'}
              </p>
              <p className="text-sm leading-6 text-[#d8c0a4]">
                {track && lessonIndex >= 0 ? `${lessonIndex + 1}/${trackLessons.length}` : 'not mapped'}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoCodex.stamp}>Mission brief</span>
              <span className={picoCodex.stamp}>{hostedStamp}</span>
              <span className={picoCodex.stamp}>
                {completed ? 'sealed' : started ? 'active' : 'ready'}
              </span>
            </div>

            <div className="grid gap-4">
              <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[#fff4e6] sm:text-7xl">
                {lesson.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[#e2ccb3]">
                {lesson.objective}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-[#b99879]">
                Expected result: {lesson.expectedResult}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {renderPrimaryLessonAction(picoClasses.primaryButton)}
              <Link
                href={toHref(`/tutor?lesson=${lesson.slug}`)}
                className={cn(picoClasses.secondaryButton, 'scroll-mb-40')}
              >
                Ask the tutor about this lesson
              </Link>
            </div>

            <div className="grid gap-3 border-t border-[#5d412d] pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1">
                <p className={picoClasses.label}>State</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  {missingPrerequisiteLesson ? 'blocked' : completed ? 'sealed' : 'active'}
                </p>
                <p className="text-sm leading-6 text-[#bfa78c]">
                  {missingPrerequisiteLesson ? 'finish the prerequisite first' : 'one route lane'}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Proof</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  {evidenceReady ? 'captured' : 'pending'}
                </p>
                <p className="text-sm leading-6 text-[#bfa78c]">
                  {activeWorkspaceStep?.title ?? 'Choose a step'}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Progress</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  {completedStepCount}/{lesson.steps.length}
                </p>
                <p className="text-sm leading-6 text-[#bfa78c]">steps cleared</p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>Telemetry</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  {lesson.estimatedMinutes}m
                </p>
                <p className="text-sm leading-6 text-[#bfa78c]">
                  {lesson.xp} xp • {formatDifficulty(lesson.difficulty)}
                </p>
              </div>
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
                      ? 'border-[#e2904f] bg-[linear-gradient(180deg,rgba(103,57,29,0.28),rgba(43,24,15,0.28))] text-[#fff4e6]'
                      : 'border-[#4a3423] bg-[rgba(255,247,235,0.03)] text-[#d5c0a8]',
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
              <p className={picoClasses.label}>Chapter spine</p>
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
                          ? 'border-[#e2904f] text-[#fff4e6]'
                          : 'border-[#4a3423] text-[#d5c0a8] hover:border-[#8a623d] hover:text-[#fff4e6]',
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
              <p className={picoClasses.label}>Active route lane</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6]">
                {activeWorkspaceStep?.title ?? 'Select a step'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
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
              <p className={picoClasses.label}>Command brief</p>
              <p className="mt-4 text-base leading-8 text-[#f0deca]">
                {activeWorkspaceStep?.body ??
                  'Choose a step from the chapter spine to start the lane.'}
              </p>
              {activeWorkspaceStep?.command ? (
                <pre className="mt-5 overflow-x-auto rounded-[22px] border border-[#6a452a] bg-[#16100d] p-4 text-sm text-[#ffc88f]">
                  <code>{activeWorkspaceStep.command}</code>
                </pre>
              ) : null}
              {activeWorkspaceStep?.note ? (
                <div className={picoCodexNote('mt-5 p-4')}>
                  <p className="text-sm leading-6 text-[#f0deca]">{activeWorkspaceStep.note}</p>
                </div>
              ) : null}
            </article>

            <div id="pico-proof-composer" className="grid gap-4 lg:grid-cols-2">
              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>Proof captured</span>
                <textarea
                  value={workspace.evidence}
                  onChange={(event) => workspaceActions.setEvidence(event.target.value)}
                  placeholder="Paste the output, transcript note, or artifact that proves this chapter worked."
                  className="min-h-40 rounded-[18px] border border-[#4a3423] bg-[#120d0a] px-4 py-3 text-sm text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                  data-testid="pico-lesson-proof"
                />
              </label>

              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>Working notes</span>
                <textarea
                  value={workspace.notes}
                  onChange={(event) => workspaceActions.setNotes(event.target.value)}
                  placeholder="Capture the blocker, file path, or command variation that mattered."
                  className="min-h-40 rounded-[18px] border border-[#4a3423] bg-[#120d0a] px-4 py-3 text-sm text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className={picoCodexNote('p-5')}>
                <p className={picoClasses.label}>Seal state</p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  {completed ? 'sealed' : evidenceReady ? 'ready' : 'pending'}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#f0deca]">
                  {completed
                    ? 'The chapter is sealed. Move on while the route is still fresh.'
                    : evidenceReady
                      ? 'The proof exists. Seal the chapter and keep moving.'
                      : 'Do not seal the chapter until the proof says something real.'}
                </p>
                <div className="mt-5">{renderPrimaryLessonAction(picoClasses.secondaryButton)}</div>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>Progress meter</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                    {completedStepCount}/{lesson.steps.length}
                  </p>
                  <div className="mt-4 overflow-hidden rounded-full bg-[#1b120d]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#e2904f,#ffd0a4)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>Next move</p>
                  <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                    Finish the live step, log one proof artifact, then either seal the chapter or hand off to the next surface.
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
                  <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                    the current step still contains the answer and the route does not need escalation yet.
                  </p>
                </div>
                <Link
                  href={toHref(`/tutor?lesson=${lesson.slug}`)}
                  className={picoCodexNote('p-4 transition hover:border-[#a1714b]')}
                >
                  <p className={picoClasses.label}>Exact blocker</p>
                  <p className="mt-2 text-lg font-medium text-[#fff4e6]">Ask tutor</p>
                </Link>
                <Link
                  href={approvalLesson ? approvalSetupHref : toHref('/autopilot')}
                  className={picoCodexInset('p-4 transition hover:border-[#8a623d] hover:text-[#fff4e6]')}
                >
                  <p className={picoClasses.label}>Runtime truth</p>
                  <p className="mt-2 text-lg font-medium text-[#fff4e6]">
                    {approvalLesson ? 'Open live approval setup' : 'Inspect Autopilot'}
                  </p>
                </Link>
                <Link
                  href={toHref('/support')}
                  className={picoCodexInset('p-4 transition hover:border-[#8a623d] hover:text-[#fff4e6]')}
                >
                  <p className={picoClasses.label}>Messy edge</p>
                  <p className="mt-2 text-lg font-medium text-[#fff4e6]">Open support lane</p>
                </Link>
              </div>
            </section>
          </aside>
        ) : null}
      </motion.section>

      <div id="pico-lesson-recovery">
        <PicoSurfaceCompass
          title="Keep the lesson narrow until the proof is real"
          body="Use Tutor for one grounded blocker, switch to Autopilot when live runtime truth matters, and escalate to Support only after both stop being enough."
          status={
            missingPrerequisiteLesson
              ? 'blocked by prerequisite'
              : completed
                ? 'chapter sealed'
                : started
                  ? 'route lane active'
                  : 'ready to execute'
          }
          aside="Recovery belongs below the proof lane, not inside it."
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
              caption: 'Step back to the mapped route when the sequence itself is the problem.',
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
              label: 'Open support lane',
              caption: 'Escalate only after the lesson, tutor, and runtime views stop being enough.',
              note: 'Messy edge',
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
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[#fff4e6]">
                The smaller notes you only read when the route goes crooked
              </h2>
            </div>
            <span className={picoCodex.stamp}>{lesson.steps.length} steps</span>
          </div>

          <div className="mt-6 grid gap-4">
            {lesson.troubleshooting.map((item) => (
              <div key={item} className={picoCodexInset('px-4 py-4 text-sm leading-6 text-[#d5c0a8]')}>
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
                <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  {derived.nextCapability.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#f0deca]">
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
