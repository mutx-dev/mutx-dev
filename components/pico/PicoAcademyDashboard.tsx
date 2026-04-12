'use client'

import { type ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'

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
  type PicoLesson,
} from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

type LessonState = 'done' | 'current' | 'ready' | 'locked'

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

function LessonStateStamp({ state }: { state: LessonState }) {
  const copy =
    state === 'done'
      ? 'cleared'
      : state === 'current'
        ? 'current'
        : state === 'ready'
          ? 'ready'
          : 'locked'

  return (
    <span
      className={cn(
        picoCodex.stamp,
        state === 'done' && 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
        state === 'current' && 'border-[#e2904f] bg-[rgba(226,144,79,0.16)] text-[#fff1df]',
        state === 'ready' && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
        state === 'locked' && 'border-[#5a3d28] bg-transparent text-[#9f8063]',
      )}
    >
      {copy}
    </span>
  )
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

function formatSyncState(syncState: string, ready: boolean) {
  if (!ready) {
    return 'hydrating'
  }

  switch (syncState) {
    case 'synced':
      return 'live'
    case 'saving':
      return 'saving'
    case 'offline':
      return 'local only'
    default:
      return syncState
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'not recorded'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'not recorded'
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PicoAcademyDashboard() {
  const pathname = usePathname()
  const session = usePicoSession()
  const { progress, derived, syncState, ready, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const reduceMotion = useReducedMotion() ?? false

  const nextLesson = derived.nextLesson
  const installDone = progress.completedLessons.includes('install-hermes-locally')
  const firstRunDone = progress.completedLessons.includes('run-your-first-agent')
  const activationLessonSlug = firstRunDone
    ? (nextLesson?.slug ?? null)
    : installDone
      ? 'run-your-first-agent'
      : 'install-hermes-locally'
  const activationLesson = activationLessonSlug ? getLessonBySlug(activationLessonSlug) : null
  const fallbackTrack = PICO_TRACKS[0]
  const activeTrack = getTrackBySlug(progress.selectedTrack ?? fallbackTrack.slug) ?? fallbackTrack
  const activeTrackLessons = activeTrack.lessons
    .map((slug) => getLessonBySlug(slug))
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
  const currentLevel = PICO_LEVELS.find((level) => level.id === derived.currentLevel)
  const allLessons = PICO_TRACKS.flatMap((track) => track.lessons)
    .map((slug) => getLessonBySlug(slug))
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
  const workspaceUpdatedAt = formatTimestamp(activationLessonWorkspace.workspace.updatedAt)
  const currentMissionTitle = activationLesson?.title ?? 'Open Autopilot'
  const currentMissionSummary = activationLesson
    ? activationLesson.objective
    : 'Step into the live control room when the lesson lane is clear.'
  const currentMissionValidation = activationLesson
    ? activationLesson.validation
    : 'Use the runtime when the question is no longer about reading the lesson.'
  const currentMissionPrimaryHref = activationLessonSlug
    ? toHref(`/academy/${activationLessonSlug}`)
    : toHref('/autopilot')
  const currentMissionPrimaryLabel = activationLessonSlug
    ? !installDone
      ? 'Install Hermes now'
      : !firstRunDone
        ? 'Run your first agent'
        : nextLesson
          ? `Continue with ${nextLesson.title}`
          : 'Open the next chapter'
    : 'Open Autopilot'
  const currentMissionSecondaryHref = toHref(
    `/tutor${activationLessonSlug ? `?lesson=${activationLessonSlug}` : ''}`,
  )
  const currentMissionSecondaryLabel = activationLessonSlug
    ? 'Ask tutor for the exact next step'
    : 'Ask tutor for route correction'
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
        ? 'verify host'
        : 'hosted attached'
      : session.status === 'unauthenticated'
        ? 'local only'
        : session.status === 'error'
          ? 'auth error'
          : 'checking'
  const hostedDetail =
    session.status === 'authenticated'
      ? session.user.email ?? session.user.name ?? 'operator'
      : session.status === 'unauthenticated'
        ? 'sign in to persist'
        : session.status === 'error'
          ? session.error
          : 'reading host state'

  const missionStrip = [
    {
      label: 'Mission state',
      value: workspaceCaptured
        ? 'captured'
        : activationLessonWorkspace.completedStepCount > 0
          ? 'in progress'
          : 'ready',
      detail: activationLesson
        ? `${activationLessonWorkspace.completedStepCount}/${activationLesson.steps.length} steps`
        : 'control room',
    },
    {
      label: 'Track progress',
      value: `${activeTrackCompletionPercent}%`,
      detail: `${activeTrackCompletedCount}/${activeTrackLessons.length} lessons`,
    },
    {
      label: 'Proof',
      value: workspaceCaptured ? 'captured' : 'missing',
      detail: focusedActivationStep?.title ?? 'Pick the next visible step',
    },
    {
      label: 'Hosted',
      value: hostedStatus,
      detail: session.status === 'authenticated' ? formatSyncState(syncState, ready) : hostedDetail,
    },
  ]

  const visibleTracks = progress.platform.railCollapsed ? [activeTrack] : PICO_TRACKS

  useEffect(() => {
    if (progress.platform.activeSurface !== 'academy') {
      actions.setPlatform({ activeSurface: 'academy' })
    }
  }, [actions, progress.platform.activeSurface])

  return (
    <PicoShell
      mode="academy"
      eyebrow="Apprentice codex"
      title="Academy"
      description="One mission. One proof. One honest next move."
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
            <div className="grid content-between gap-6 border-b border-[#5d412d] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <div className="grid gap-2">
                <p className={picoClasses.label}>Codex chapter</p>
                <p className="font-[family:var(--font-site-display)] text-7xl leading-none tracking-[-0.08em] text-[#f0bb83] sm:text-8xl">
                  {activeTrackChapter}
                </p>
              </div>

              <div className="grid gap-2">
                <p className={picoClasses.label}>Track</p>
                <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  {activeTrack.title}
                </p>
                <p className="text-sm leading-6 text-[#d8c0a4]">
                  Stop {String(missionIndex).padStart(2, '0')} of {activeTrackLessons.length}
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={picoCodex.stamp}>Current mission</span>
                <span className={picoCodex.stamp}>{hostedStatus}</span>
                {session.status === 'authenticated' && session.user.plan ? (
                  <span className={picoCodex.stamp}>
                    {session.user.plan.toLowerCase()} plan
                  </span>
                ) : null}
                <span className={picoCodex.stamp}>{formatSyncState(syncState, ready)}</span>
              </div>

              <div className="grid gap-4">
                <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-5xl leading-[0.92] tracking-[-0.08em] text-[#fff4e6] sm:text-7xl">
                  {currentMissionTitle}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[#e2ccb3]">
                  {currentMissionSummary}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-[#b99879]">
                  Validation: {currentMissionValidation}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={currentMissionPrimaryHref} className={picoClasses.primaryButton}>
                  {currentMissionPrimaryLabel}
                </Link>
                <Link href={currentMissionSecondaryHref} className={picoClasses.secondaryButton}>
                  {currentMissionSecondaryLabel}
                </Link>
              </div>

              <div
                className="grid gap-3 border-t border-[#5d412d] pt-5 sm:grid-cols-2 xl:grid-cols-4"
                data-testid="pico-academy-progress-strip"
              >
                {missionStrip.map((item) => (
                  <div key={item.label} className="grid gap-1">
                    <p className={picoClasses.label}>{item.label}</p>
                    <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                      {item.value}
                    </p>
                    <p className="text-sm leading-6 text-[#bfa78c]">{item.detail}</p>
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
                    <p className={picoClasses.label}>Active proof lane</p>
                    <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6]">
                      {focusedActivationStep?.title ?? activationLesson.title}
                    </h2>
                  </div>
                  <span className={picoCodex.stamp}>
                    {activationLessonWorkspace.completedStepCount}/{activationLesson.steps.length} steps
                  </span>
                </div>

                <div className={picoCodexSheet('p-5')}>
                  <p className={picoClasses.label}>Resume from here</p>
                  <p className="mt-4 text-base leading-8 text-[#f0deca]">
                    {focusedActivationStep?.body ??
                      'Open the lesson route and keep the proof lane short.'}
                  </p>
                  {focusedActivationStep?.command ? (
                    <pre className="mt-5 overflow-x-auto rounded-[22px] border border-[#6a452a] bg-[#16100d] p-4 text-sm text-[#ffc88f]">
                      <code>{focusedActivationStep.command}</code>
                    </pre>
                  ) : null}
                  <div className="mt-5 overflow-hidden rounded-full bg-[#1b120d]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#e2904f,#ffd0a4)]"
                      style={{ width: `${activationLessonWorkspace.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={currentMissionPrimaryHref} className={picoClasses.primaryButton}>
                      Resume mission
                    </Link>
                    <Link href={currentMissionSecondaryHref} className={picoClasses.tertiaryButton}>
                      Ask tutor
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>Proof state</p>
                  <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                    {workspaceCaptured ? 'captured' : 'missing'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                    Updated {workspaceUpdatedAt}
                  </p>
                </div>

                <div className={picoCodexNote('p-5')}>
                  <p className={picoClasses.label}>Captured proof</p>
                  <p className="mt-3 text-sm leading-6 text-[#f0deca]">
                    {workspaceCaptured
                      ? activationLessonWorkspace.workspace.evidence
                      : 'No proof has been logged yet. Save the single artifact that proves the mission actually worked.'}
                  </p>
                </div>

                <div className={picoCodexInset('p-5')}>
                  <p className={picoClasses.label}>Hosted note</p>
                  <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                    {hostedDetail}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.12} reduceMotion={reduceMotion}>
        <section
          className={picoCodexFrame('overflow-hidden')}
          data-testid="pico-academy-campaign-map"
        >
          <div className="border-b border-[#5d412d] px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Chapter ledger</p>
                <h2 className="mt-3 max-w-4xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6] sm:text-5xl">
                  Follow the route in order. Let the appendix stay quiet.
                </h2>
              </div>
              <span className={picoCodex.stamp}>
                {progress.platform.railCollapsed ? 'focus mode' : 'all chapters'}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c8b296]">
              {progress.platform.railCollapsed
                ? 'Map is narrowed to the current track. Open Map to see every chapter.'
                : 'The ledger should explain sequence without feeling like a dashboard of equal choices.'}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
            <div className="grid gap-10">
              {visibleTracks.map((track, trackIndex) => {
                const trackLessons = track.lessons
                  .map((slug) => getLessonBySlug(slug))
                  .filter((lesson): lesson is PicoLesson => Boolean(lesson))
                const completedCount = trackLessons.filter((lesson) =>
                  progress.completedLessons.includes(lesson.slug),
                ).length
                const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
                const active = track.slug === activeTrack.slug
                const chapterIndex = Math.max(
                  PICO_TRACKS.findIndex((entry) => entry.slug === track.slug),
                  trackIndex,
                )

                return (
                  <motion.article
                    key={track.slug}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: trackIndex * 0.05 }}
                    className="grid gap-5 lg:grid-cols-[15rem,minmax(0,1fr)]"
                  >
                    <div className="grid gap-3">
                      <span className={picoCodex.stamp}>
                        Track {String(chapterIndex + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6]">
                        {track.title}
                      </h3>
                      <p className="text-sm leading-6 text-[#e0c9b0]">{track.outcome}</p>
                      <p className="text-sm leading-6 text-[#b99879]">{track.intro}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#c7af93]">
                        <span>{completedCount}/{trackLessons.length} cleared</span>
                        <span>•</span>
                        <span>{unlocked ? 'route open' : 'route locked'}</span>
                        {active ? <span>•</span> : null}
                        {active ? <span>current track</span> : null}
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute left-2 top-1 bottom-1 w-px bg-[#5d412d]" />

                      <div className={cn('grid gap-5', !unlocked && 'opacity-55')}>
                        {trackLessons.map((lesson, lessonIndex) => {
                          const state = getLessonState(
                            lesson,
                            progress.completedLessons,
                            derived.unlockedLessonSlugs,
                            activationLessonSlug,
                          )
                          const dominant =
                            active &&
                            (lesson.slug === activationLessonSlug ||
                              state === 'current' ||
                              (state === 'ready' && lessonIndex === 0))

                          return (
                            <Link
                              key={lesson.slug}
                              href={toHref(`/academy/${lesson.slug}`)}
                              className={cn(
                                'relative block border-l pl-5 pr-2 py-1 transition',
                                state === 'locked'
                                  ? 'border-[#4c3424] text-[#8f7157]'
                                  : dominant
                                    ? 'border-[#e2904f] text-[#fff4e6]'
                                    : state === 'done'
                                      ? 'border-[#5f7457] text-[#d8c3a8]'
                                      : 'border-[#6a4a33] text-[#d5c0a8] hover:border-[#a1714b] hover:text-[#fff4e6]',
                              )}
                            >
                              <span
                                className={cn(
                                  'absolute -left-[0.42rem] top-4 h-3.5 w-3.5 rounded-full border bg-[#120a07]',
                                  state === 'done' && 'border-emerald-400 bg-emerald-500/20',
                                  state === 'current' && 'border-[#e2904f] bg-[#e2904f]/20',
                                  state === 'ready' && 'border-cyan-400 bg-cyan-400/15',
                                  state === 'locked' && 'border-[#4a3423]',
                                )}
                              />

                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[#b58d65]">
                                    Stop {String(lessonIndex + 1).padStart(2, '0')} • level {lesson.level}
                                  </p>
                                  <p className="mt-1 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-inherit">
                                    {lesson.title}
                                  </p>
                                </div>
                                <LessonStateStamp state={state} />
                              </div>

                              {dominant ? (
                                <div className={picoCodexNote('mt-3 p-4')}>
                                  <p className={picoClasses.label}>Dominant stop</p>
                                  <p className="mt-3 text-sm leading-6 text-[#f0deca]">
                                    {lesson.expectedResult}
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm leading-6 text-[#bfa78c]">{lesson.summary}</p>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr),minmax(0,0.96fr)]">
        <FadeIn delay={0.18} reduceMotion={reduceMotion}>
          <section className={picoCodexFrame('px-6 py-6 sm:px-8')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Codex appendix</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  The capabilities and patterns that matter after the mission is real
                </h2>
              </div>
              <span className={picoCodex.stamp}>
                {currentLevel ? currentLevel.title : 'Setup'}
              </span>
            </div>

            <div className="mt-6 grid gap-5">
              <div className={picoCodexInset('p-5')}>
                <p className={picoClasses.label}>Unlocked capabilities</p>
                <div className="mt-4 grid gap-4">
                  {derived.unlockedCapabilities.slice(0, 3).map((capability) => (
                    <div
                      key={capability.id}
                      className="grid gap-2 border-t border-[#5d412d] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                          {capability.title}
                        </h3>
                        <span className={picoCodex.stamp}>live</span>
                      </div>
                      <p className="text-sm leading-6 text-[#d5c0a8]">{capability.description}</p>
                      <Link href={toHref(capability.href)} className={picoClasses.secondaryButton}>
                        {capability.actionLabel}
                      </Link>
                    </div>
                  ))}

                  {derived.unlockedCapabilities.length === 0 ? (
                    <p className="text-sm leading-6 text-[#d5c0a8]">
                      The first capability unlock lands only after the first lessons are cleared for real.
                    </p>
                  ) : null}
                </div>
              </div>

              {derived.nextCapability ? (
                <div className={picoCodexNote('p-5')}>
                  <p className={picoClasses.label}>Next unlock</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                    {derived.nextCapability.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#f0deca]">
                    {derived.nextCapability.description}
                  </p>
                  <Link href={toHref(derived.nextCapability.href)} className={cn(picoClasses.primaryButton, 'mt-4')}>
                    {derived.nextCapability.actionLabel}
                  </Link>
                </div>
              ) : null}

              <div className={picoCodexSheet('p-5')}>
                <p className={picoClasses.label}>Control annex</p>
                <p className="mt-3 text-sm leading-6 text-[#dbc6ae]">
                  Platform memory stays available, but it sits below the codex on purpose. The Academy should lead with route and proof, not settings.
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
          </section>
        </FadeIn>

        <FadeIn delay={0.22} reduceMotion={reduceMotion}>
          <section className={picoCodexFrame('px-6 py-6 sm:px-8')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Field archive</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  Patterns, release notes, and the material that should never outrun the mission
                </h2>
              </div>
              <span className={picoCodex.stamp}>{lockedLessonCount} locked</span>
            </div>

            <div className="mt-6 grid gap-5">
              <div className={picoCodexInset('p-5')}>
                <p className={picoClasses.label}>Pattern archive</p>
                <div className="mt-4 grid gap-4">
                  {PICO_SHOWCASE_PATTERNS.slice(0, 3).map((pattern) => (
                    <div
                      key={pattern.lessonSlug}
                      className="grid gap-2 border-t border-[#5d412d] pt-4 first:border-t-0 first:pt-0"
                    >
                      <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                        {pattern.title}
                      </p>
                      <p className="text-sm leading-6 text-[#d5c0a8]">{pattern.summary}</p>
                      <Link href={toHref(`/academy/${pattern.lessonSlug}`)} className={picoClasses.tertiaryButton}>
                        Open pattern lesson
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className={picoCodexInset('p-5')}>
                <p className={picoClasses.label}>Recent field notes</p>
                <div className="mt-4 grid gap-4">
                  {PICO_RELEASE_NOTES.slice(0, 3).map((note) => (
                    <div
                      key={`${note.date}-${note.title}`}
                      className="grid gap-2 border-t border-[#5d412d] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                          {note.title}
                        </p>
                        <span className={picoCodex.stamp}>{note.date}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#d5c0a8]">{note.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={picoCodexSheet('p-5 text-sm leading-6 text-[#d5c0a8]')}>
                Locked lessons: <span className="text-[#fff4e6]">{lockedLessonCount}</span>. The Academy should stay narrower than the work it protects.
              </div>
            </div>
          </section>
        </FadeIn>
      </div>
    </PicoShell>
  )
}
