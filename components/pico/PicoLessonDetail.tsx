'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { type AbstractIntlMessages, useMessages, useTranslations } from 'next-intl'
import { useEffect } from 'react'

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
import {
  getLessonBySlug,
  getTrackBySlug,
  type PicoLesson,
  type PicoLessonDifficulty,
  type PicoLessonStep,
  type PicoTrack,
} from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

type PicoLessonDetailProps = {
  lesson: PicoLesson
}

type LessonPageMessages = (typeof import('@/messages/fr.json'))['pico']['lessonPage']
type PicoContentMessages = (typeof import('@/messages/fr.json'))['pico']['content']
type MessageRecord = Record<string, unknown>
type TranslationValues = Record<string, string | number>

type LocalizedLessonContent = Partial<Omit<PicoLesson, 'steps' | 'troubleshooting'>> & {
  steps?: Partial<PicoLessonStep>[]
  troubleshooting?: string[]
}

const revealTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
}

function getLessonDetailMessages(messages: AbstractIntlMessages) {
  const pico = (messages as {
    pico?: { lessonPage?: LessonPageMessages; content?: PicoContentMessages }
  }).pico

  return {
    lessonPage: pico?.lessonPage,
    content: pico?.content,
  }
}

function getNestedMessage(messages: unknown, path: string): unknown {
  let current = messages

  for (const segment of path.split('.')) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (Number.isNaN(index)) {
        return undefined
      }

      current = current[index]
      continue
    }

    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as MessageRecord)[segment]
  }

  return current
}

function formatFallback(template: string, values?: TranslationValues) {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function localizeLesson(
  source: PicoLesson | null,
  localizedLessons: Record<string, LocalizedLessonContent>,
) {
  if (!source) {
    return null
  }

  const localizedLesson = localizedLessons[source.slug]

  return {
    ...source,
    title: typeof localizedLesson?.title === 'string' ? localizedLesson.title : source.title,
    summary: typeof localizedLesson?.summary === 'string' ? localizedLesson.summary : source.summary,
    objective:
      typeof localizedLesson?.objective === 'string'
        ? localizedLesson.objective
        : source.objective,
    outcome: typeof localizedLesson?.outcome === 'string' ? localizedLesson.outcome : source.outcome,
    expectedResult:
      typeof localizedLesson?.expectedResult === 'string'
        ? localizedLesson.expectedResult
        : source.expectedResult,
    validation:
      typeof localizedLesson?.validation === 'string'
        ? localizedLesson.validation
        : source.validation,
    steps: source.steps.map((step, index) => {
      const localizedStep = Array.isArray(localizedLesson?.steps)
        ? localizedLesson.steps[index]
        : undefined

      return {
        ...step,
        title: typeof localizedStep?.title === 'string' ? localizedStep.title : step.title,
        body: typeof localizedStep?.body === 'string' ? localizedStep.body : step.body,
        command:
          typeof localizedStep?.command === 'string' ? localizedStep.command : step.command,
        note: typeof localizedStep?.note === 'string' ? localizedStep.note : step.note,
      }
    }),
    troubleshooting: isStringArray(localizedLesson?.troubleshooting)
      ? localizedLesson.troubleshooting
      : source.troubleshooting,
  }
}

function localizeTrack(
  source: PicoTrack | null,
  localizedTracks: Record<string, Partial<PicoTrack>>,
) {
  if (!source) {
    return null
  }

  const localizedTrack = localizedTracks[source.slug]

  return {
    ...source,
    title: typeof localizedTrack?.title === 'string' ? localizedTrack.title : source.title,
    outcome:
      typeof localizedTrack?.outcome === 'string' ? localizedTrack.outcome : source.outcome,
    intro: typeof localizedTrack?.intro === 'string' ? localizedTrack.intro : source.intro,
    checklist: isStringArray(localizedTrack?.checklist)
      ? localizedTrack.checklist
      : source.checklist,
  }
}

function getCompleteLabel(
  lessonSlug: string,
  t: (path: string, fallback: string, values?: TranslationValues) => string,
) {
  if (lessonSlug === 'install-hermes-locally') {
    return t(
      'actions.completeLabel.installHermesLocally',
      'Hermes is installed',
    )
  }

  if (lessonSlug === 'run-your-first-agent') {
    return t(
      'actions.completeLabel.runYourFirstAgent',
      'The first run worked',
    )
  }

  return t('actions.completeLabel.default', 'Seal this chapter')
}

function getCompletedNextLabel(
  nextLesson: PicoLesson | null,
  t: (path: string, fallback: string, values?: TranslationValues) => string,
) {
  if (!nextLesson) {
    return t('actions.openAutopilot', 'Open Autopilot')
  }

  if (nextLesson.slug === 'run-your-first-agent') {
    return t('actions.runYourFirstAgentNow', 'Run your first agent now')
  }

  return t('actions.openLesson', 'Open {lessonTitle}', {
    lessonTitle: nextLesson.title,
  })
}

function formatDifficulty(
  difficulty: PicoLessonDifficulty,
  t: (path: string, fallback: string, values?: TranslationValues) => string,
) {
  if (difficulty === 'setup') {
    return t('shared.difficulty.setup', 'setup')
  }

  if (difficulty === 'operator') {
    return t('shared.difficulty.operator', 'operator')
  }

  return t('shared.difficulty.builder', 'builder')
}

export function PicoLessonDetail({ lesson }: PicoLessonDetailProps) {
  const messages = useMessages()
  const intlT = useTranslations()
  const { lessonPage, content } = getLessonDetailMessages(messages as AbstractIntlMessages)
  const session = usePicoSession()
  const { progress, derived, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const localizedLessons = (content?.lessons ?? {}) as Record<string, LocalizedLessonContent>
  const localizedTracks = (content?.tracks ?? {}) as Record<string, Partial<PicoTrack>>
  const localizedLesson = localizeLesson(lesson, localizedLessons) ?? lesson
  const started = progress.startedLessons.includes(lesson.slug)
  const completed = progress.completedLessons.includes(lesson.slug)
  const nextLesson = localizeLesson(
    lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null,
    localizedLessons,
  )
  const missingPrerequisite = lesson.prerequisites.find(
    (prerequisite) => !progress.completedLessons.includes(prerequisite),
  )
  const missingPrerequisiteLesson = localizeLesson(
    missingPrerequisite ? getLessonBySlug(missingPrerequisite) : null,
    localizedLessons,
  )
  const approvalLesson = lesson.slug === 'add-an-approval-gate'
  const approvalSetupHref = toHref('/autopilot#approvals-section')
  const track = localizeTrack(getTrackBySlug(lesson.track), localizedTracks)
  const trackLessons =
    track?.lessons
      .map((slug) => getLessonBySlug(slug))
      .filter((entry): entry is PicoLesson => Boolean(entry)) ?? []
  const lessonIndex = trackLessons.findIndex((item) => item.slug === lesson.slug)
  const previousLesson = localizeLesson(
    lessonIndex > 0 ? trackLessons[lessonIndex - 1] ?? null : null,
    localizedLessons,
  )
  const tt = (path: string, fallback: string, values?: TranslationValues) => {
    const value = getNestedMessage(lessonPage, path)

    if (typeof value === 'string') {
      return intlT(`pico.lessonPage.${path}`, values)
    }

    return formatFallback(fallback, values)
  }

  const {
    workspace,
    completedStepCount,
    progressPercent,
    actions: workspaceActions,
  } = usePicoLessonWorkspace(lesson.slug, localizedLesson.steps.length, {
    progress,
    persistRemote: (lessonSlug, nextWorkspace) =>
      actions.setLessonWorkspace(lessonSlug, nextWorkspace),
  })

  const activeStepIndex = workspace.activeStepIndex >= 0 ? workspace.activeStepIndex : 0
  const activeWorkspaceStep =
    localizedLesson.steps[activeStepIndex] ?? localizedLesson.steps[0] ?? null
  const evidenceReady = workspace.evidence.trim().length > 0
  const hostedStamp =
    session.status === 'authenticated'
      ? session.user.isEmailVerified === false
        ? tt('shared.hostedStamp.verifyHost', 'verify host')
        : tt('shared.hostedStamp.hostedAttached', 'hosted attached')
      : session.status === 'unauthenticated'
        ? tt('shared.hostedStamp.localOnly', 'local only')
        : session.status === 'error'
          ? tt('shared.hostedStamp.authError', 'auth error')
          : tt('shared.hostedStamp.checking', 'checking')
  const chapterState = missingPrerequisiteLesson
    ? tt('shared.chapterState.blocked', 'blocked')
    : completed
      ? tt('shared.chapterState.sealed', 'sealed')
      : tt('shared.chapterState.active', 'active')
  const heroState = completed
    ? tt('shared.chapterState.sealed', 'sealed')
    : started
      ? tt('shared.chapterState.active', 'active')
      : tt('shared.chapterState.ready', 'ready')
  const proofState = evidenceReady
    ? tt('shared.proofState.captured', 'captured')
    : tt('shared.proofState.pending', 'pending')
  const reviewState = completed
    ? tt('shared.reviewState.sealed', 'sealed')
    : evidenceReady
      ? tt('shared.reviewState.ready', 'ready')
      : tt('shared.reviewState.pending', 'pending')
  const stepDoneLabel = tt('shared.stepState.done', 'done')
  const stepActiveLabel = tt('shared.stepState.active', 'active')
  const difficultyLabel = formatDifficulty(localizedLesson.difficulty, tt)
  const lessonNumber = String(Math.max(lessonIndex, 0) + 1).padStart(2, '0')

  const studioReviewBoard = [
    {
      label: tt('studio.cards.brief.label', '01 • Brief'),
      title: tt('studio.cards.brief.title', 'The outcome the studio is chasing'),
      body: localizedLesson.objective,
    },
    {
      label: tt('studio.cards.deliverable.label', '02 • Deliverable'),
      title: tt('studio.cards.deliverable.title', 'What the finished artifact should prove'),
      body: localizedLesson.expectedResult,
    },
    {
      label: tt('studio.cards.critique.label', '03 • Critique'),
      title: tt('studio.cards.critique.title', 'The review line before you move on'),
      body: localizedLesson.validation,
    },
  ]

  const studioContext = [
    {
      label: tt('studio.context.trackArc', 'Track arc'),
      value:
        track?.outcome ??
        tt('studio.context.trackArcFallback', 'Build one real operator outcome.'),
    },
    {
      label: tt('studio.context.lessonOutcome', 'Lesson outcome'),
      value: localizedLesson.outcome,
    },
    {
      label: tt('studio.context.timeAndWeight', 'Time and weight'),
      value: tt('studio.context.timeAndWeightValue', '{minutes}m • {xp} xp • {difficulty}', {
        minutes: localizedLesson.estimatedMinutes,
        xp: localizedLesson.xp,
        difficulty: difficultyLabel,
      }),
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
          {tt('actions.completePrerequisiteFirst', 'Complete {lessonTitle} first', {
            lessonTitle: missingPrerequisiteLesson.title,
          })}
        </Link>
      )
    }

    if (completed) {
      return (
        <Link
          href={toHref(nextLesson ? `/academy/${nextLesson.slug}` : '/autopilot')}
          className={buttonClassName}
        >
          {getCompletedNextLabel(nextLesson, tt)}
        </Link>
      )
    }

    if (approvalLesson) {
      return (
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link href={approvalSetupHref} className={buttonClassName}>
            {tt('actions.openLiveApprovalSetup', 'Open live approval setup')}
          </Link>
          <button
            type="button"
            onClick={() => actions.completeLesson(lesson.slug)}
            className={picoClasses.secondaryButton}
          >
            {getCompleteLabel(lesson.slug, tt)}
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
        {getCompleteLabel(lesson.slug, tt)}
      </button>
    )
  }

  return (
    <PicoShell
      mode="academy"
      eyebrow={tt('shell.eyebrow', 'Chapter {number} • lesson lane', {
        number: lessonNumber,
      })}
      title={localizedLesson.title}
      description={localizedLesson.summary}
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
              <p className={picoClasses.label}>{tt('hero.lessonLabel', 'Lesson')}</p>
              <p className="font-[family:var(--font-site-display)] text-7xl leading-none tracking-[-0.08em] text-[color:var(--pico-accent)] sm:text-8xl">
                {lessonNumber}
              </p>
            </div>

            <div className="grid gap-2">
              <p className={picoClasses.label}>{tt('hero.trackLabel', 'Track')}</p>
              <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {track?.title ?? tt('hero.trackUnmapped', 'Unmapped')}
              </p>
              <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {track && lessonIndex >= 0
                  ? `${lessonIndex + 1}/${trackLessons.length}`
                  : tt('hero.trackNotMapped', 'not mapped')}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoCodex.stamp}>{tt('hero.missionBrief', 'Mission brief')}</span>
              <span className={picoCodex.stamp}>{hostedStamp}</span>
              <span className={picoCodex.stamp}>{heroState}</span>
            </div>

            <div className="grid gap-4">
              <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[color:var(--pico-text)] sm:text-7xl">
                {localizedLesson.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[color:var(--pico-text-secondary)]">
                {localizedLesson.objective}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--pico-text-muted)]">
                {tt('hero.expectedResult', 'Expected result: {value}', {
                  value: localizedLesson.expectedResult,
                })}
              </p>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              {renderPrimaryLessonAction(picoClasses.primaryButton)}
              <Link
                href={toHref(`/tutor?lesson=${lesson.slug}`)}
                className={cn(picoClasses.secondaryButton, 'scroll-mb-40')}
              >
                {tt('actions.askTutorAboutLesson', 'Ask the tutor about this lesson')}
              </Link>
            </div>

            <div className="grid gap-3 border-t border-[color:var(--pico-border)] pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1">
                <p className={picoClasses.label}>{tt('hero.metrics.state', 'State')}</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {chapterState}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {missingPrerequisiteLesson
                    ? tt('hero.metrics.stateHintBlocked', 'finish the prerequisite first')
                    : tt('hero.metrics.stateHintActive', 'one route lane')}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>{tt('hero.metrics.proof', 'Proof')}</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {proofState}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {activeWorkspaceStep?.title ??
                    tt('hero.metrics.proofStepFallback', 'Choose a step')}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>{tt('hero.metrics.progress', 'Progress')}</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {completedStepCount}/{localizedLesson.steps.length}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt('hero.metrics.stepsCleared', 'steps cleared')}
                </p>
              </div>
              <div className="grid gap-1">
                <p className={picoClasses.label}>{tt('hero.metrics.telemetry', 'Telemetry')}</p>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {localizedLesson.estimatedMinutes}m
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt('hero.metrics.telemetryDetail', '{xp} xp • {difficulty}', {
                    xp: localizedLesson.xp,
                    difficulty: difficultyLabel,
                  })}
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
                <p className={picoClasses.label}>
                  {tt('studio.label', 'Studio review board')}
                </p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  {tt('studio.title', 'Brief, deliverable, critique')}
                </h2>
              </div>
              <span className={picoCodex.stamp}>
                {tt('studio.stamp', 'one real lesson at a time')}
              </span>
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
              <p className={picoClasses.label}>
                {tt('studio.context.title', 'Chapter context')}
              </p>
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
              <p className={picoClasses.label}>
                {tt('studio.posture.title', 'Studio posture')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'studio.posture.body',
                  'Keep this chapter narrow. The goal is not to feel busy or advanced. The goal is to produce one artifact a sharp operator would still trust tomorrow.',
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="xl:hidden">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {localizedLesson.steps.map((step, index) => {
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
                    {done ? <span className={picoCodex.stamp}>{stepDoneLabel}</span> : null}
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
              <p className={picoClasses.label}>{tt('chapterSpine.title', 'Chapter spine')}</p>
              <div className="mt-4 grid gap-4">
                {localizedLesson.steps.map((step, index) => {
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
                        {done ? <span className={picoCodex.stamp}>{stepDoneLabel}</span> : null}
                        {active ? <span className={picoCodex.stamp}>{stepActiveLabel}</span> : null}
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
              <p className={picoClasses.label}>{tt('workspace.label', 'Studio workspace')}</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                {activeWorkspaceStep?.title ?? tt('workspace.selectStep', 'Select a step')}
              </h2>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => workspaceActions.reset()}
                className={picoClasses.tertiaryButton}
              >
                {tt('actions.resetWorkspace', 'Reset workspace')}
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
                  ? tt('actions.reopenStep', 'Reopen step')
                  : tt('actions.markStepDone', 'Mark step done')}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <article className={picoCodexSheet('p-5')}>
              <p className={picoClasses.label}>{tt('workspace.studioBrief', 'Studio brief')}</p>
              <p className="mt-4 text-base leading-8 text-[color:var(--pico-text-secondary)]">
                {activeWorkspaceStep?.body ??
                  tt(
                    'workspace.chooseStepBody',
                    'Choose a step from the chapter spine to start the lane.',
                  )}
              </p>
              {activeWorkspaceStep?.command ? (
                <pre className="mt-5 overflow-x-auto rounded-[22px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] p-4 text-sm text-[color:var(--pico-accent-bright)]">
                  <code>{activeWorkspaceStep.command}</code>
                </pre>
              ) : null}
              {activeWorkspaceStep?.note ? (
                <div className={picoCodexNote('mt-5 p-4')}>
                  <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {activeWorkspaceStep.note}
                  </p>
                </div>
              ) : null}
            </article>

            <div id="pico-proof-composer" className="grid gap-4 lg:grid-cols-2">
              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>
                  {tt('workspace.deliverableArtifact', 'Deliverable artifact')}
                </span>
                <textarea
                  value={workspace.evidence}
                  onChange={(event) => workspaceActions.setEvidence(event.target.value)}
                  placeholder={tt(
                    'workspace.deliverablePlaceholder',
                    'Paste the output, transcript note, or artifact that proves this chapter worked.',
                  )}
                  className="min-h-40 rounded-[18px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-sm text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  data-testid="pico-lesson-proof"
                />
              </label>

              <label className={picoCodexInset('grid gap-3 p-4')}>
                <span className={picoClasses.label}>{tt('workspace.benchNotes', 'Bench notes')}</span>
                <textarea
                  value={workspace.notes}
                  onChange={(event) => workspaceActions.setNotes(event.target.value)}
                  placeholder={tt(
                    'workspace.benchNotesPlaceholder',
                    'Capture the blocker, file path, or command variation that mattered.',
                  )}
                  className="min-h-40 rounded-[18px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-sm text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className={picoCodexNote('p-5')}>
                <p className={picoClasses.label}>
                  {tt('workspace.reviewState.label', 'Review state')}
                </p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {reviewState}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {completed
                    ? tt(
                        'workspace.reviewState.sealedBody',
                        'The chapter is sealed. Move on while the route is still fresh.',
                      )
                    : evidenceReady
                      ? tt(
                          'workspace.reviewState.readyBody',
                          'The proof exists. Seal the chapter and keep moving.',
                        )
                      : tt(
                          'workspace.reviewState.pendingBody',
                          'Do not seal the chapter until the proof says something real.',
                        )}
                </p>
                <div className="mt-5">{renderPrimaryLessonAction(picoClasses.secondaryButton)}</div>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('workspace.chapterCompletion', 'Chapter completion')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {completedStepCount}/{localizedLesson.steps.length}
                  </p>
                  <div className="mt-4 overflow-hidden rounded-full bg-[color:var(--pico-bg-input)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('workspace.creativeDirection.title', 'Creative direction')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {tt(
                      'workspace.creativeDirection.body',
                      'Finish the live step, log one proof artifact, then either seal the chapter or hand off to the next surface.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {progress.platform.helpLaneOpen ? (
          <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">
            <section className={picoCodexFrame('p-5')} data-testid="pico-help-lane-panel">
              <p className={picoClasses.label}>{tt('helpLane.label', 'Field notes')}</p>
              <div className="mt-4 grid gap-3">
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('helpLane.stayHereWhen', 'Stay here when')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {tt(
                      'helpLane.stayHereBody',
                      'the current step still contains the answer and the route does not need escalation yet.',
                    )}
                  </p>
                </div>
                <Link
                  href={toHref(`/tutor?lesson=${lesson.slug}`)}
                  className={picoCodexNote('p-4 transition hover:border-[color:var(--pico-border-hover)]')}
                >
                  <p className={picoClasses.label}>
                    {tt('helpLane.exactBlocker', 'Exact blocker')}
                  </p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {tt('actions.askTutor', 'Ask tutor')}
                  </p>
                </Link>
                <Link
                  href={approvalLesson ? approvalSetupHref : toHref('/autopilot')}
                  className={picoCodexInset('p-4 transition hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]')}
                >
                  <p className={picoClasses.label}>
                    {tt('helpLane.runtimeTruth', 'Runtime truth')}
                  </p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {approvalLesson
                      ? tt('actions.openLiveApprovalSetup', 'Open live approval setup')
                      : tt('actions.inspectAutopilot', 'Inspect Autopilot')}
                  </p>
                </Link>
                <Link
                  href={toHref('/support')}
                  className={picoCodexInset('p-4 transition hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]')}
                >
                  <p className={picoClasses.label}>{tt('helpLane.messyEdge', 'Messy edge')}</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {tt('actions.openSupportLane', 'Open support lane')}
                  </p>
                </Link>
              </div>
            </section>
          </aside>
        ) : null}
      </motion.section>

      <div id="pico-lesson-recovery">
        <PicoSurfaceCompass
          title={tt(
            'surfaceCompass.title',
            'Keep the lesson narrow until the proof is real',
          )}
          body={tt(
            'surfaceCompass.body',
            'Use Tutor for one grounded blocker, switch to Autopilot when live runtime truth matters, and escalate to Support only after both stop being enough.',
          )}
          status={
            missingPrerequisiteLesson
              ? tt('surfaceCompass.status.blockedByPrerequisite', 'blocked by prerequisite')
              : completed
                ? tt('surfaceCompass.status.chapterSealed', 'chapter sealed')
                : started
                  ? tt('surfaceCompass.status.routeLaneActive', 'route lane active')
                  : tt('surfaceCompass.status.readyToExecute', 'ready to execute')
          }
          aside={tt(
            'surfaceCompass.aside',
            'Recovery belongs below the proof lane, not inside it.',
          )}
          items={[
            {
              href: toHref(`/tutor?lesson=${lesson.slug}`),
              label: tt('surfaceCompass.items.askTutorLabel', 'Ask tutor about this lesson'),
              caption: tt(
                'surfaceCompass.items.askTutorCaption',
                'Use this when one command, file path, or validation check is failing.',
              ),
              note: tt('surfaceCompass.items.blocked', 'Blocked'),
              tone: 'primary',
            },
            {
              href: missingPrerequisiteLesson
                ? toHref(`/academy/${missingPrerequisiteLesson.slug}`)
                : toHref('/academy'),
              label: missingPrerequisiteLesson
                ? tt('actions.openLesson', 'Open {lessonTitle}', {
                    lessonTitle: missingPrerequisiteLesson.title,
                  })
                : tt('surfaceCompass.items.returnToAcademyMap', 'Return to academy map'),
              caption: tt(
                'surfaceCompass.items.returnCaption',
                'Step back to the mapped route when the sequence itself is the problem.',
              ),
              note: tt('surfaceCompass.items.backtrack', 'Backtrack'),
            },
            {
              href: approvalLesson ? approvalSetupHref : toHref('/autopilot'),
              label: approvalLesson
                ? tt('actions.openLiveApprovalSetup', 'Open live approval setup')
                : tt('actions.inspectAutopilot', 'Inspect Autopilot'),
              caption: tt(
                'surfaceCompass.items.runtimeCaption',
                'Switch here when the blocker depends on live runtime or approvals.',
              ),
              note: tt('surfaceCompass.items.runtime', 'Runtime'),
              tone: 'soft',
            },
            {
              href: toHref('/support'),
              label: tt('actions.openSupportLane', 'Open support lane'),
              caption: tt(
                'surfaceCompass.items.supportCaption',
                'Escalate only after the lesson, tutor, and runtime views stop being enough.',
              ),
              note: tt('surfaceCompass.items.messyEdge', 'Messy edge'),
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
              <p className={picoClasses.label}>
                {tt('troubleshooting.label', 'Troubleshooting appendix')}
              </p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                {tt(
                  'troubleshooting.title',
                  'The smaller notes you only read when the route goes crooked',
                )}
              </h2>
            </div>
            <span className={picoCodex.stamp}>
              {tt('troubleshooting.stepsCount', '{count} steps', {
                count: localizedLesson.steps.length,
              })}
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {localizedLesson.troubleshooting.map((item) => (
              <div
                key={item}
                className={picoCodexInset(
                  'px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]',
                )}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {derived.nextCapability ? (
            <section className={picoCodexFrame('p-5')}>
              <p className={picoClasses.label}>
                {tt('troubleshooting.nextCapability', 'Next capability')}
              </p>
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
            <p className={picoClasses.label}>{tt('troubleshooting.routeMemory', 'Route memory')}</p>
            <div className={picoCodexInset('mt-4 p-4')}>
              <div className="grid gap-3">
                {previousLesson ? (
                  <Link
                    href={toHref(`/academy/${previousLesson.slug}`)}
                    className={picoClasses.tertiaryButton}
                  >
                    {tt('actions.previousLesson', 'Previous lesson')}
                  </Link>
                ) : null}
                <Link href={toHref('/academy')} className={picoClasses.secondaryButton}>
                  {tt('actions.backToAcademyMap', 'Back to academy map')}
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </motion.section>
    </PicoShell>
  )
}
