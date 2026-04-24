'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocale, useMessages } from 'next-intl'
import { type ReactNode, useEffect } from 'react'

import { PicoPlatformSurface } from '@/components/pico/PicoPlatformSurface'
import { PicoShell } from '@/components/pico/PicoShell'
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
  PICO_LEVELS,
  PICO_RELEASE_NOTES,
  PICO_SHOWCASE_PATTERNS,
  PICO_TRACKS,
  getLessonBySlug,
  getTrackBySlug,
  type PicoCapabilityUnlock,
  type PicoLesson,
  type PicoLessonStep,
  type PicoLevel,
  type PicoTrack,
} from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

type LessonState = 'done' | 'current' | 'ready' | 'locked'
type AcademyPageMessages = (typeof import('@/messages/fr.json'))['pico']['academyPage']
type PicoContentMessages = (typeof import('@/messages/fr.json'))['pico']['content']
type MessageRecord = Record<string, unknown>
type TranslationValues = Record<string, string | number>
type PicoReleaseNote = {
  title: string
  date: string
  body: string
}
type PicoShowcasePattern = {
  title: string
  lessonSlug: string
  summary: string
}

type LocalizedLessonContent = Partial<Omit<PicoLesson, 'steps' | 'troubleshooting'>> & {
  steps?: Partial<PicoLessonStep>[]
  troubleshooting?: string[]
}

type LocalizedTrackContent = Partial<Omit<PicoTrack, 'lessons'>> & {
  checklist?: string[]
}

type LocalizedLevelContent = Partial<PicoLevel>
type LocalizedReleaseNoteContent = Partial<Omit<PicoReleaseNote, 'date'>>
type LocalizedShowcasePatternContent = Partial<Omit<PicoShowcasePattern, 'lessonSlug'>>
type LocalizedCapabilityContent = Partial<Omit<PicoCapabilityUnlock, 'href' | 'unlockEvent'>>

function FadeIn({
  children,
  className,
  delay = 0,
  reduceMotion = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  reduceMotion?: boolean
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function LessonStateStamp({ state, label }: { state: LessonState; label: string }) {
  return (
    <span
      className={cn(
        picoCodex.stamp,
        state === 'done' && 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
        state === 'current' && 'border-[color:var(--pico-accent)] bg-[rgba(var(--pico-accent-rgb),0.16)] text-[color:var(--pico-text)]',
        state === 'ready' && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
        state === 'locked' && 'border-[color:var(--pico-border)] bg-transparent text-[color:var(--pico-text-muted)]',
      )}
    >
      {label}
    </span>
  )
}

function getAcademyDashboardMessages(messages: unknown) {
  const pico = (messages as {
    pico?: { academyPage?: AcademyPageMessages; content?: PicoContentMessages }
  }).pico

  return {
    academyPage: pico?.academyPage,
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
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

function localizeLesson(
  source: PicoLesson | null,
  localizedLessons: Record<string, LocalizedLessonContent>,
): PicoLesson | null {
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
        command: typeof localizedStep?.command === 'string' ? localizedStep.command : step.command,
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
  localizedTracks: Record<string, LocalizedTrackContent>,
): PicoTrack | null {
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

function localizeLevel(
  source: PicoLevel | undefined,
  localizedLevels: Record<string, LocalizedLevelContent>,
): PicoLevel | undefined {
  if (!source) {
    return undefined
  }

  const localizedLevel = localizedLevels[String(source.id)]

  return {
    ...source,
    title: typeof localizedLevel?.title === 'string' ? localizedLevel.title : source.title,
    objective:
      typeof localizedLevel?.objective === 'string'
        ? localizedLevel.objective
        : source.objective,
    projectOutcome:
      typeof localizedLevel?.projectOutcome === 'string'
        ? localizedLevel.projectOutcome
        : source.projectOutcome,
    completionState:
      typeof localizedLevel?.completionState === 'string'
        ? localizedLevel.completionState
        : source.completionState,
    badge: typeof localizedLevel?.badge === 'string' ? localizedLevel.badge : source.badge,
    recommendedNextStep:
      typeof localizedLevel?.recommendedNextStep === 'string'
        ? localizedLevel.recommendedNextStep
        : source.recommendedNextStep,
  }
}

function localizeReleaseNote(
  source: PicoReleaseNote,
  index: number,
  localizedReleaseNotes: LocalizedReleaseNoteContent[],
): PicoReleaseNote {
  const localizedReleaseNote = localizedReleaseNotes[index]

  return {
    ...source,
    title:
      typeof localizedReleaseNote?.title === 'string'
        ? localizedReleaseNote.title
        : source.title,
    body: typeof localizedReleaseNote?.body === 'string' ? localizedReleaseNote.body : source.body,
  }
}

function localizeShowcasePattern(
  source: PicoShowcasePattern,
  index: number,
  localizedShowcasePatterns: LocalizedShowcasePatternContent[],
): PicoShowcasePattern {
  const localizedShowcasePattern = localizedShowcasePatterns[index]

  return {
    ...source,
    title:
      typeof localizedShowcasePattern?.title === 'string'
        ? localizedShowcasePattern.title
        : source.title,
    summary:
      typeof localizedShowcasePattern?.summary === 'string'
        ? localizedShowcasePattern.summary
        : source.summary,
  }
}

function localizeCapability(
  source: PicoCapabilityUnlock | null,
  localizedCapabilities: Record<string, LocalizedCapabilityContent>,
): PicoCapabilityUnlock | null {
  if (!source) {
    return null
  }

  const localizedCapability = localizedCapabilities[source.id]

  return {
    ...source,
    title:
      typeof localizedCapability?.title === 'string'
        ? localizedCapability.title
        : source.title,
    description:
      typeof localizedCapability?.description === 'string'
        ? localizedCapability.description
        : source.description,
    actionLabel:
      typeof localizedCapability?.actionLabel === 'string'
        ? localizedCapability.actionLabel
        : source.actionLabel,
  }
}

function getLessonState(
  lesson: PicoLesson,
  completedLessons: string[],
  unlockedLessonSlugs: string[],
  currentLessonSlug: string | null,
): LessonState {
  if (completedLessons.includes(lesson.slug)) {
    return 'done'
  }

  if (currentLessonSlug === lesson.slug) {
    return 'current'
  }

  if (unlockedLessonSlugs.includes(lesson.slug)) {
    return 'ready'
  }

  return 'locked'
}

function formatLessonState(
  state: LessonState,
  t: (path: string, fallback: string, values?: TranslationValues) => string,
) {
  if (state === 'done') {
    return t('lessonState.cleared', 'cleared')
  }

  if (state === 'current') {
    return t('lessonState.current', 'current')
  }

  if (state === 'ready') {
    return t('lessonState.ready', 'ready')
  }

  return t('lessonState.locked', 'locked')
}

function formatSyncState(
  syncState: string,
  ready: boolean,
  t: (path: string, fallback: string, values?: TranslationValues) => string,
) {
  if (!ready) {
    return t('syncState.hydrating', 'hydrating')
  }

  switch (syncState) {
    case 'synced':
      return t('syncState.live', 'live')
    case 'saving':
      return t('syncState.saving', 'saving')
    case 'offline':
      return t('syncState.localOnly', 'local only')
    default:
      return syncState
  }
}

function formatTimestamp(locale: string, value?: string | null, fallback = 'not recorded') {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PicoAcademyDashboard() {
  const locale = useLocale()
  const pathname = usePathname()
  const messages = useMessages()
  const { academyPage, content } = getAcademyDashboardMessages(messages)
  const session = usePicoSession()
  const { progress, derived, syncState, ready, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const reduceMotion = useReducedMotion() ?? false
  const localizedLessons = (content?.lessons ?? {}) as Record<string, LocalizedLessonContent>
  const localizedTracks = (content?.tracks ?? {}) as Record<string, LocalizedTrackContent>
  const localizedLevels = (content?.levels ?? {}) as Record<string, LocalizedLevelContent>
  const localizedReleaseNotes = Array.isArray(content?.releaseNotes)
    ? (content.releaseNotes as LocalizedReleaseNoteContent[])
    : []
  const localizedShowcasePatterns = Array.isArray(content?.showcasePatterns)
    ? (content.showcasePatterns as LocalizedShowcasePatternContent[])
    : []
  const localizedCapabilities = (content?.capabilities ?? {}) as Record<
    string,
    LocalizedCapabilityContent
  >
  const tt = (path: string, fallback: string, values?: TranslationValues) => {
    const value = getNestedMessage(academyPage, path)
    return formatFallback(typeof value === 'string' ? value : fallback, values)
  }

  const nextLesson = localizeLesson(derived.nextLesson, localizedLessons)
  const installDone = progress.completedLessons.includes('install-hermes-locally')
  const firstRunDone = progress.completedLessons.includes('run-your-first-agent')
  const activationLessonSlug = firstRunDone
    ? (nextLesson?.slug ?? null)
    : installDone
      ? 'run-your-first-agent'
      : 'install-hermes-locally'
  const activationLesson = localizeLesson(
    activationLessonSlug ? getLessonBySlug(activationLessonSlug) : null,
    localizedLessons,
  )
  const fallbackTrack = localizeTrack(PICO_TRACKS[0], localizedTracks) ?? PICO_TRACKS[0]
  const activeTrack = localizeTrack(
    getTrackBySlug(progress.selectedTrack ?? fallbackTrack.slug) ?? PICO_TRACKS[0],
    localizedTracks,
  ) ?? fallbackTrack
  const activeTrackLessons = activeTrack.lessons
    .map((slug) => localizeLesson(getLessonBySlug(slug), localizedLessons))
    .filter((lesson): lesson is PicoLesson => Boolean(lesson))
  const activeTrackIndex = Math.max(
    PICO_TRACKS.findIndex((track) => track.slug === activeTrack.slug),
    0,
  )
  const activeTrackChapter = String(activeTrackIndex + 1).padStart(2, '0')
  const activeTrackCompletedCount = activeTrackLessons.filter((lesson) =>
    progress.completedLessons.includes(lesson.slug),
  ).length
  const activeTrackCompletionPercent =
    activeTrackLessons.length > 0
      ? Math.round((activeTrackCompletedCount / activeTrackLessons.length) * 100)
      : 0
  const currentLevel = localizeLevel(
    PICO_LEVELS.find((level) => level.id === derived.currentLevel),
    localizedLevels,
  )
  const allLessons = PICO_TRACKS.flatMap((track) => track.lessons)
    .map((slug) => localizeLesson(getLessonBySlug(slug), localizedLessons))
    .filter((lesson): lesson is PicoLesson => Boolean(lesson))
  const lockedLessonCount = allLessons.filter(
    (lesson) => !derived.unlockedLessonSlugs.includes(lesson.slug),
  ).length

  const activationLessonWorkspace = usePicoLessonWorkspace(
    activationLessonSlug ?? 'activation',
    activationLesson?.steps.length ?? 0,
    {
      progress,
      persistRemote: activationLessonSlug
        ? (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace)
        : undefined,
    },
  )

  const focusedActivationStep =
    activationLesson && activationLessonWorkspace.workspace.activeStepIndex >= 0
      ? activationLesson.steps[activationLessonWorkspace.workspace.activeStepIndex] ?? null
      : null
  const workspaceCaptured = Boolean(activationLessonWorkspace.workspace.evidence.trim())
  const workspaceUpdatedAt = formatTimestamp(
    locale,
    activationLessonWorkspace.workspace.updatedAt,
    tt('shared.notRecorded', 'not recorded'),
  )
  const currentMissionTitle = activationLesson?.title ?? tt('mission.titleFallback', 'Open Autopilot')
  const currentMissionSummary = activationLesson
    ? activationLesson.objective
    : tt(
        'mission.summaryFallback',
        'Step into the live control room when the lesson lane is clear.',
      )
  const currentMissionValidation = activationLesson
    ? activationLesson.validation
    : tt(
        'mission.validationFallback',
        'Use the runtime when the question is no longer about reading the lesson.',
      )
  const currentMissionPrimaryHref = activationLessonSlug
    ? toHref(`/academy/${activationLessonSlug}`)
    : toHref('/autopilot')
  const currentMissionPrimaryLabel = activationLessonSlug
    ? !installDone
      ? tt('shared.installHermesNow', 'Install Hermes now')
      : !firstRunDone
        ? tt('shared.runFirstAgent', 'Run your first agent')
        : nextLesson
          ? tt('shared.continueWithNextLesson', 'Continue with {title}', {
              title: nextLesson.title,
            })
          : tt('shared.openNextChapter', 'Open the next chapter')
    : tt('shared.openAutopilot', 'Open Autopilot')
  const currentMissionSecondaryHref = toHref(
    `/tutor${activationLessonSlug ? `?lesson=${activationLessonSlug}` : ''}`,
  )
  const currentMissionSecondaryLabel = activationLessonSlug
    ? tt('shared.askTutorNextStep', 'Ask tutor for the exact next step')
    : tt('shared.askTutorRouteCorrection', 'Ask tutor for route correction')
  const missionIndex =
    activationLesson && activeTrackLessons.length > 0
      ? Math.max(
          activeTrackLessons.findIndex((lesson) => lesson.slug === activationLesson.slug),
          0,
        ) + 1
      : 1

  const hostedStatus =
    session.status === 'authenticated'
      ? session.user.isEmailVerified === false
        ? tt('shared.verifyHost', 'verify host')
        : tt('shared.hostedAttached', 'hosted attached')
      : session.status === 'unauthenticated'
        ? tt('syncState.localOnly', 'local only')
        : session.status === 'error'
          ? tt('shared.authError', 'auth error')
          : tt('shared.checking', 'checking')
  const hostedDetail =
    session.status === 'authenticated'
      ? session.user.email ?? session.user.name ?? tt('shared.operator', 'operator')
      : session.status === 'unauthenticated'
        ? tt('shared.signInToPersist', 'sign in to persist')
        : session.status === 'error'
          ? session.error
          : tt('shared.readingHostState', 'reading host state')

  const missionStrip = [
    {
      label: tt('strip.missionState', 'Mission state'),
      value: workspaceCaptured
        ? tt('shared.captured', 'captured')
        : activationLessonWorkspace.completedStepCount > 0
          ? tt('shared.inProgress', 'in progress')
          : tt('shared.ready', 'ready'),
      detail: activationLesson
        ? tt('shared.steps', '{completed}/{total} steps', {
            completed: activationLessonWorkspace.completedStepCount,
            total: activationLesson.steps.length,
          })
        : tt('shared.controlRoom', 'control room'),
    },
    {
      label: tt('strip.trackProgress', 'Track progress'),
      value: `${activeTrackCompletionPercent}%`,
      detail: tt('shared.lessons', '{completed}/{total} lessons', {
        completed: activeTrackCompletedCount,
        total: activeTrackLessons.length,
      }),
    },
    {
      label: tt('strip.proof', 'Proof'),
      value: workspaceCaptured ? tt('shared.captured', 'captured') : tt('shared.missing', 'missing'),
      detail: focusedActivationStep?.title ?? tt('shared.previewStep', 'Pick the next visible step'),
    },
    {
      label: tt('strip.hosted', 'Hosted'),
      value: hostedStatus,
      detail:
        session.status === 'authenticated'
          ? formatSyncState(syncState, ready, tt)
          : hostedDetail,
    },
  ]

  const studioMethod = [
    {
      label: tt('studio.steps.0.label', '01 • Brief'),
      title: tt('studio.steps.0.title', 'Read the mission like a client brief'),
      body: currentMissionSummary,
    },
    {
      label: tt('studio.steps.1.label', '02 • Deliverable'),
      title: tt('studio.steps.1.title', 'Make one artifact worth keeping'),
      body: activationLesson?.expectedResult ?? currentMissionValidation,
    },
    {
      label: tt('studio.steps.2.label', '03 • Critique'),
      title: tt('studio.steps.2.title', 'Use the validation like studio review'),
      body: currentMissionValidation,
    },
  ]

  const academyStandards = [
    {
      label: tt('standards.trackOutcome', 'Track outcome'),
      value: activeTrack.outcome,
    },
    {
      label: tt('standards.levelReward', 'Level reward'),
      value:
        currentLevel?.projectOutcome ??
        tt('standards.levelRewardFallback', 'Ship one real operator outcome.'),
    },
    {
      label: tt('standards.nextStandard', 'Next standard'),
      value:
        currentLevel?.recommendedNextStep ??
        tt('standards.nextStandardFallback', 'Keep the chapter narrow and honest.'),
    },
  ]

  const chapterPreviewTracks = progress.platform.railCollapsed
    ? []
    : PICO_TRACKS.filter((track) => track.slug !== activeTrack.slug)
        .map((track) => localizeTrack(track, localizedTracks))
        .filter((track): track is PicoTrack => Boolean(track))
  const unlockedCapabilities = derived.unlockedCapabilities
    .map((capability) => localizeCapability(capability, localizedCapabilities))
    .filter((capability): capability is PicoCapabilityUnlock => Boolean(capability))
  const nextCapability = localizeCapability(derived.nextCapability, localizedCapabilities)
  const showcasePatterns = PICO_SHOWCASE_PATTERNS.slice(0, 2).map((pattern, index) =>
    localizeShowcasePattern(pattern, index, localizedShowcasePatterns),
  )
  const fieldNotes = PICO_RELEASE_NOTES.slice(0, 2).map((note, index) =>
    localizeReleaseNote(note, index, localizedReleaseNotes),
  )

  useEffect(() => {
    if (progress.platform.activeSurface !== 'academy') {
      actions.setPlatform({ activeSurface: 'academy' })
    }
  }, [actions, progress.platform.activeSurface])

  return (
    <PicoShell
      mode="academy"
      eyebrow={tt('shell.eyebrow', 'Apprentice codex')}
      title={tt('shell.title', 'Academy')}
      description={tt('shell.description', 'One mission. One proof. One honest next move.')}
      railCollapsed={progress.platform.railCollapsed}
      helpLaneOpen={progress.platform.helpLaneOpen}
      onToggleRail={() =>
        actions.setPlatform({ railCollapsed: !progress.platform.railCollapsed })
      }
      onToggleHelpLane={() =>
        actions.setPlatform({ helpLaneOpen: !progress.platform.helpLaneOpen })
      }
    >
      <FadeIn reduceMotion={reduceMotion}>
        <section
          className={picoCodexFrame('overflow-hidden px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10')}
          data-testid="pico-academy-mission-billboard"
        >
          <div className="grid gap-8 lg:grid-cols-[8rem,minmax(0,1fr)]">
            <div className="grid content-between gap-6 border-b border-[color:var(--pico-border)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <div className="grid gap-2">
                <p className={picoClasses.label}>{tt('billboard.chapterLabel', 'Codex chapter')}</p>
                <p className="font-[family:var(--font-site-display)] text-7xl leading-none tracking-[-0.08em] text-[color:var(--pico-accent)] sm:text-8xl">
                  {activeTrackChapter}
                </p>
              </div>

              <div className="grid gap-2">
                <p className={picoClasses.label}>{tt('billboard.trackLabel', 'Track')}</p>
                <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {activeTrack.title}
                </p>
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt('billboard.stopOf', 'Stop {current} of {total}', {
                    current: String(missionIndex).padStart(2, '0'),
                    total: activeTrackLessons.length,
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={picoCodex.stamp}>{tt('billboard.currentMission', 'Current mission')}</span>
                <span className={picoCodex.stamp}>{hostedStatus}</span>
                {session.status === 'authenticated' && session.user.plan ? (
                  <span className={picoCodex.stamp}>
                    {tt('shared.plan', '{plan} plan', {
                      plan: session.user.plan.toLowerCase(),
                    })}
                  </span>
                ) : null}
                <span className={picoCodex.stamp}>{formatSyncState(syncState, ready, tt)}</span>
              </div>

              <div className="grid gap-4">
                <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[color:var(--pico-text)] sm:text-7xl">
                  {currentMissionTitle}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[color:var(--pico-text-secondary)]">
                  {currentMissionSummary}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-[color:var(--pico-text-muted)]">
                  {tt('billboard.validationPrefix', 'Validation:')} {currentMissionValidation}
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <Link href={currentMissionPrimaryHref} className={picoClasses.primaryButton}>
                  {currentMissionPrimaryLabel}
                </Link>
                <Link href={currentMissionSecondaryHref} className={picoClasses.secondaryButton}>
                  {currentMissionSecondaryLabel}
                </Link>
              </div>

              <div
                className="grid gap-3 border-t border-[color:var(--pico-border)] pt-5 sm:grid-cols-2 xl:grid-cols-4"
                data-testid="pico-academy-progress-strip"
              >
                {missionStrip.map((item) => (
                  <div key={item.label} className="grid gap-1">
                    <p className={picoClasses.label}>{item.label}</p>
                    <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {item.value}
                    </p>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {activationLesson ? (
        <FadeIn delay={0.08} reduceMotion={reduceMotion}>
          <section
            id="pico-academy-workspace-summary"
            className={picoCodexFrame('px-6 py-6 sm:px-8 sm:py-8')}
            data-testid="pico-academy-workspace-summary"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(18rem,0.9fr)]">
              <div className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className={picoClasses.label}>{tt('workspace.activeProofLane', 'Active proof lane')}</p>
                    <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                      {focusedActivationStep?.title ?? activationLesson.title}
                    </h2>
                  </div>
                  <span className={picoCodex.stamp}>
                    {tt('shared.steps', '{completed}/{total} steps', {
                      completed: activationLessonWorkspace.completedStepCount,
                      total: activationLesson.steps.length,
                    })}
                  </span>
                </div>

                <div className={picoCodexSheet('p-5')}>
                  <p className={picoClasses.label}>{tt('workspace.resumeFromHere', 'Resume from here')}</p>
                  <p className="mt-4 text-base leading-8 text-[color:var(--pico-text-secondary)]">
                    {focusedActivationStep?.body ??
                      tt('shared.resumeBody', 'Open the lesson route and keep the proof lane short.')}
                  </p>
                  {focusedActivationStep?.command ? (
                    <pre className="mt-5 overflow-x-auto rounded-[22px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] p-4 text-sm text-[color:var(--pico-accent-bright)]">
                      <code>{focusedActivationStep.command}</code>
                    </pre>
                  ) : null}
                  <div className="mt-5 overflow-hidden rounded-full bg-[color:var(--pico-bg-input)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                      style={{ width: `${activationLessonWorkspace.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={currentMissionPrimaryHref} className={picoClasses.primaryButton}>
                      {tt('shared.resumeMission', 'Resume mission')}
                    </Link>
                    <Link href={currentMissionSecondaryHref} className={picoClasses.tertiaryButton}>
                      {tt('shared.askTutor', 'Ask tutor')}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>{tt('workspace.proofState', 'Proof state')}</p>
                  <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {workspaceCaptured
                      ? tt('workspace.proofCaptured', 'captured')
                      : tt('workspace.proofMissing', 'missing')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {tt('shared.updated', 'Updated {timestamp}', {
                      timestamp: workspaceUpdatedAt,
                    })}
                  </p>
                </div>

                <div className={picoCodexNote('p-5')}>
                  <p className={picoClasses.label}>{tt('workspace.capturedProof', 'Captured proof')}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {workspaceCaptured
                      ? activationLessonWorkspace.workspace.evidence
                      : tt(
                          'shared.noProofLogged',
                          'No proof has been logged yet. Save the single artifact that proves the mission actually worked.',
                        )}
                  </p>
                </div>

                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>{tt('workspace.hostedNote', 'Hosted note')}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {hostedDetail}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.1} reduceMotion={reduceMotion}>
        <section
          className={picoCodexFrame('px-6 py-6 sm:px-8 sm:py-8')}
          data-testid="pico-academy-studio-method"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={picoClasses.label}>{tt('studio.label', 'Studio method')}</p>
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                    {tt('studio.title', 'Learn like a boutique studio ships')}
                  </h2>
                </div>
                <span className={picoCodex.stamp}>{tt('studio.stamp', 'brief • deliverable • critique')}</span>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {studioMethod.map((item) => (
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
                <p className={picoClasses.label}>{tt('standards.label', 'Track standards')}</p>
                <div className="mt-4 grid gap-4">
                  {academyStandards.map((item) => (
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
                <p className={picoClasses.label}>{tt('chapterLedger.chapterChecklist', 'Chapter checklist')}</p>
                <div className="mt-4 grid gap-3">
                  {activeTrack.checklist.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-accent)]">
                        {tt('shared.ok', 'ok')}
                      </span>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.12} reduceMotion={reduceMotion}>
        <section
          className={picoCodexFrame('overflow-hidden')}
          data-testid="pico-academy-campaign-map"
        >
          <div className="border-b border-[color:var(--pico-border)] px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={picoClasses.label}>{tt('chapterLedger.label', 'Chapter ledger')}</p>
                <h2 className="mt-3 max-w-4xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                  {tt(
                    'chapterLedger.title',
                    'One dominant chapter, with the rest of the map kept quiet.',
                  )}
                </h2>
              </div>
              <span className={picoCodex.stamp}>
                {progress.platform.railCollapsed
                  ? tt('chapterLedger.focusMode', 'focused atlas')
                  : tt('chapterLedger.guidedAtlas', 'guided atlas')}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'chapterLedger.body',
                'The current track gets the full editorial treatment. The rest of the atlas stays visible, but compressed, so the route still feels authored instead of equally loud everywhere.',
              )}
            </p>
          </div>

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr),22rem]">
            <div className="px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
              <motion.article
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.04 }}
                className="grid gap-6"
              >
                <div className="grid gap-5 lg:grid-cols-[16rem,minmax(0,1fr)]">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <span className={picoCodex.stamp}>
                        {tt('shared.track', 'Track {number}', {
                          number: String(activeTrackIndex + 1).padStart(2, '0'),
                        })}
                      </span>
                      <Image
                        src="/pico/mascot/pico-sprout.svg"
                        alt={tt('chapterLedger.mascotAlt', 'PicoMUTX academy mascot')}
                        width={32}
                        height={32}
                        className="drop-shadow-[0_2px_8px_rgba(164,255,92,0.15)]"
                      />
                    </div>
                    <h3 className="font-[family:var(--font-site-display)] text-5xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                      {activeTrack.title}
                    </h3>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{activeTrack.outcome}</p>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-muted)]">{activeTrack.intro}</p>
                    <div className="grid gap-3 pt-2">
                      <div className={picoCodexInset('p-4')}>
                        <p className={picoClasses.label}>{tt('chapterLedger.routeState', 'Route state')}</p>
                        <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                          {tt('shared.clearedCount', '{completed}/{total} cleared', {
                            completed: activeTrackCompletedCount,
                            total: activeTrackLessons.length,
                          })}
                        </p>
                      </div>
                      <div className={picoCodexInset('p-4')}>
                        <p className={picoClasses.label}>
                          {tt('chapterLedger.nextDominantStop', 'Next dominant stop')}
                        </p>
                        <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                          {activationLesson?.title ?? tt('chapterLedger.openAutopilot', 'Open Autopilot')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-2 top-1 bottom-1 w-px bg-[color:var(--pico-border)]" />

                    <div className="grid gap-5">
                      {activeTrackLessons.map((lesson, lessonIndex) => {
                        const state = getLessonState(
                          lesson,
                          progress.completedLessons,
                          derived.unlockedLessonSlugs,
                          activationLessonSlug,
                        )
                        const dominant =
                          lesson.slug === activationLessonSlug ||
                          state === 'current' ||
                          (state === 'ready' && lessonIndex === 0)

                        return (
                          <Link
                            key={lesson.slug}
                            href={toHref(`/academy/${lesson.slug}`)}
                            className={cn(
                              'relative block border-l pl-5 pr-2 py-1 transition',
                              state === 'locked'
                                ? 'border-[color:var(--pico-border)] text-[color:var(--pico-text-muted)]'
                                : dominant
                                  ? 'border-[color:var(--pico-accent)] text-[color:var(--pico-text)]'
                                  : state === 'done'
                                    ? 'border-[color:var(--pico-border-hover)] text-[color:var(--pico-text-secondary)]'
                                    : 'border-[color:var(--pico-border)] text-[color:var(--pico-text-secondary)] hover:border-[color:var(--pico-border-hover)] hover:text-[color:var(--pico-text)]',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute -left-[0.42rem] top-4 h-3.5 w-3.5 rounded-full border bg-[color:var(--pico-bg)]',
                                state === 'done' && 'border-emerald-400 bg-emerald-500/20',
                                state === 'current' &&
                                  'border-[color:var(--pico-accent)] bg-[rgba(var(--pico-accent-rgb),0.2)]',
                                state === 'ready' && 'border-cyan-400 bg-cyan-400/15',
                                state === 'locked' && 'border-[color:var(--pico-border)]',
                              )}
                            />

                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--pico-text-muted)]">
                                  {tt('chapterLedger.stopLevel', 'Stop {number} • level {level}', {
                                    number: String(lessonIndex + 1).padStart(2, '0'),
                                    level: lesson.level,
                                  })}
                                </p>
                                <p className="mt-1 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-inherit">
                                  {lesson.title}
                                </p>
                              </div>
                              <LessonStateStamp state={state} label={formatLessonState(state, tt)} />
                            </div>

                            {dominant ? (
                              <div className={picoCodexNote('mt-3 p-4')}>
                                <p className={picoClasses.label}>
                                  {tt('chapterLedger.dominantStop', 'Dominant stop')}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                                  {lesson.expectedResult}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                                {lesson.summary}
                              </p>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.article>
            </div>

            <aside className="border-t border-[color:var(--pico-border)] bg-[rgba(5,14,8,0.62)] px-6 py-6 sm:px-8 xl:border-l xl:border-t-0">
              <div className="grid gap-4">
                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>
                    {tt('chapterLedger.missionCorrection', 'Mission correction')}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {tt(
                      'chapterLedger.missionCorrectionBody',
                      'The atlas stays useful only if it keeps pushing you back into the current mission.',
                    )}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <Link href={currentMissionPrimaryHref} className={picoClasses.primaryButton}>
                      {currentMissionPrimaryLabel}
                    </Link>
                    <Link href={currentMissionSecondaryHref} className={picoClasses.tertiaryButton}>
                      {currentMissionSecondaryLabel}
                    </Link>
                  </div>
                </div>

                {!progress.platform.railCollapsed && chapterPreviewTracks.length > 0 ? (
                  <div className={picoCodexNote('p-5')}>
                    <p className={picoClasses.label}>{tt('chapterLedger.otherChapters', 'Other chapters')}</p>
                    <div className="mt-4 grid gap-3">
                      {chapterPreviewTracks.map((track, trackIndex) => {
                        const trackLessons = track.lessons
                          .map((slug) => localizeLesson(getLessonBySlug(slug), localizedLessons))
                          .filter((lesson): lesson is PicoLesson => Boolean(lesson))
                        const completedCount = trackLessons.filter((lesson) =>
                          progress.completedLessons.includes(lesson.slug),
                        ).length
                        const unlocked = derived.unlockedTrackSlugs.includes(track.slug)

                        return (
                          <article key={track.slug} className={picoCodexInset('grid gap-3 p-4')}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={picoClasses.label}>
                                  {tt('shared.track', 'Track {number}', {
                                    number: String(trackIndex + 2).padStart(2, '0'),
                                  })}
                                </p>
                                <h3 className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                                  {track.title}
                                </h3>
                              </div>
                              <span className={picoCodex.stamp}>
                                {unlocked ? tt('shared.open', 'open') : tt('shared.locked', 'locked')}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                              {track.outcome}
                            </p>
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                              {tt('shared.clearedCount', '{completed}/{total} cleared', {
                                completed: completedCount,
                                total: trackLessons.length,
                              })}
                            </p>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.18} reduceMotion={reduceMotion}>
        <section className={picoCodexFrame('px-6 py-6 sm:px-8')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={picoClasses.label}>{tt('referenceAnnex.label', 'Reference annex')}</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {tt(
                  'referenceAnnex.title',
                  'Capability, archive, and platform memory stay below the route on purpose',
                )}
              </h2>
            </div>
            <span className={picoCodex.stamp}>
              {currentLevel?.title ?? tt('referenceAnnex.setup', 'Setup')} • {lockedLessonCount}{' '}
              {tt('referenceAnnex.locked', 'locked')}
            </span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.04fr),minmax(0,0.96fr)]">
            <div className="grid gap-5">
              <div className={picoCodexInset('p-5')}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={picoClasses.label}>{tt('capabilities.label', 'Unlocked capabilities')}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt(
                        'capabilities.body',
                        'The pieces that matter after the mission is already real.',
                      )}
                    </p>
                  </div>
                  <span className={picoCodex.stamp}>
                    {unlockedCapabilities.length} {tt('capabilities.liveSuffix', 'live')}
                  </span>
                </div>
                <div className="mt-4 grid gap-4">
                  {unlockedCapabilities.slice(0, 2).map((capability) => (
                    <div
                      key={capability.id}
                      className="grid gap-2 border-t border-[color:var(--pico-border)] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {capability.title}
                        </h3>
                        <span className={picoCodex.stamp}>{tt('capabilities.live', 'live')}</span>
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {capability.description}
                      </p>
                      <Link href={toHref(capability.href)} className={picoClasses.secondaryButton}>
                        {capability.actionLabel}
                      </Link>
                    </div>
                  ))}

                  {unlockedCapabilities.length === 0 ? (
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt(
                        'capabilities.firstUnlockEmpty',
                        'The first capability unlock lands only after the first lessons are cleared for real.',
                      )}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {nextCapability ? (
                  <div className={picoCodexNote('p-5')}>
                    <p className={picoClasses.label}>{tt('capabilities.nextUnlock', 'Next unlock')}</p>
                    <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {nextCapability.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {nextCapability.description}
                    </p>
                    <Link href={toHref(nextCapability.href)} className={cn(picoClasses.primaryButton, 'mt-4')}>
                      {nextCapability.actionLabel}
                    </Link>
                  </div>
                ) : null}

                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>{tt('capabilities.patternArchive', 'Pattern archive')}</p>
                  <div className="mt-4 grid gap-4">
                    {showcasePatterns.map((pattern) => (
                      <div
                        key={pattern.lessonSlug}
                        className="grid gap-2 border-t border-[color:var(--pico-border)] pt-4 first:border-t-0 first:pt-0"
                      >
                        <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {pattern.title}
                        </p>
                        <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                          {pattern.summary}
                        </p>
                        <Link href={toHref(`/academy/${pattern.lessonSlug}`)} className={picoClasses.tertiaryButton}>
                          {tt('capabilities.openPatternLesson', 'Open pattern lesson')}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className={picoCodexInset('p-5')}>
                <p className={picoClasses.label}>{tt('capabilities.fieldNotes', 'Field notes')}</p>
                <div className="mt-4 grid gap-4">
                  {fieldNotes.map((note) => (
                    <div
                      key={`${note.date}-${note.title}`}
                      className="grid gap-2 border-t border-[color:var(--pico-border)] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {note.title}
                        </p>
                        <span className={picoCodex.stamp}>{note.date}</span>
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{note.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={picoCodexSheet('p-5')}>
                <p className={picoClasses.label}>{tt('capabilities.controlAnnex', 'Control annex')}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'referenceAnnex.body',
                    'Platform memory stays available, but it sits under the codex on purpose. The Academy leads with route and proof, then exposes configuration only when you need it.',
                  )}
                </p>
                <div className="mt-5">
                  <PicoPlatformSurface
                    session={session}
                    progress={progress}
                    derived={derived}
                    syncState={syncState}
                    ready={ready}
                    onSave={(patch) => actions.setPlatform(patch)}
                    onReset={() =>
                      actions.setPlatform({
                        activeSurface: 'academy',
                        lastOpenedLessonSlug: null,
                        railCollapsed: false,
                        helpLaneOpen: false,
                      })
                    }
                    currentPath={pathname}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>
    </PicoShell>
  )
}
