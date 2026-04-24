'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useMessages } from 'next-intl'

import { PicoSessionBanner } from '@/components/pico/PicoSessionBanner'
import { PicoShell } from '@/components/pico/PicoShell'
import { PicoSurfaceCompass } from '@/components/pico/PicoSurfaceCompass'
import {
  picoClasses,
  picoEmber,
  picoInset,
  picoPanel,
  picoSoft,
} from '@/components/pico/picoTheme'
import { usePicoLessonWorkspace } from '@/components/pico/usePicoLessonWorkspace'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoSession } from '@/components/pico/usePicoSession'
import { usePicoSetupState } from '@/components/pico/usePicoSetupState'
import { getLessonBySlug, PICO_TRACKS } from '@/lib/pico/academy'
import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'
import { usePicoHref } from '@/lib/pico/navigation'
import { picoRobotArtById } from '@/lib/picoRobotArt'

const activationChecklist = PICO_GENERATED_CONTENT.onboarding.activationChecklist
const stackSpotlights = PICO_GENERATED_CONTENT.onboarding.stackSpotlights

const runtimeStatusOptions = [
  'client_required',
  'healthy',
  'degraded',
  'offline',
  'warning',
  'unknown',
] as const

const installMethodOptions = ['npm', 'brew', 'binary', 'manual'] as const

type RuntimeDraft = {
  label: string
  status: string
  installMethod: string
  gatewayUrl: string
  assistantName: string
  workspace: string
  model: string
}

type MessageRecord = Record<string, unknown>

type TranslationValues = Record<string, string | number>

type PicoTrack = (typeof PICO_TRACKS)[number]

function getNestedMessage(messages: unknown, path: string): unknown {
  let current = messages

  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
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

function formatTimestamp(locale: string, value?: string | null, fallback = 'not recorded') {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback

  return parsed.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function PicoOnboardingPageClient() {
  const locale = useLocale()
  const pathname = usePathname()
  const messages = useMessages()
  const prefersReducedMotion = useReducedMotion()
  const session = usePicoSession()
  const { progress, derived, actions } = usePicoProgress(session.status === 'authenticated')
  const setup = usePicoSetupState(session.status === 'authenticated')
  const toHref = usePicoHref()
  const readMessage = (path: string) => getNestedMessage(messages, path)
  const readMessageString = (path: string, fallback: string) => {
    const value = readMessage(path)
    return typeof value === 'string' ? value : fallback
  }
  const readMessageStrings = (path: string, fallback: readonly string[]) => {
    const value = readMessage(path)
    return isStringArray(value) ? value : [...fallback]
  }
  const tt = (path: string, fallback: string, values?: TranslationValues) => {
    const value = readMessage(`pico.onboardingPage.${path}`)
    return formatFallback(typeof value === 'string' ? value : fallback, values)
  }
  const localizeTrack = (track: PicoTrack) => ({
    ...track,
    title: readMessageString(`pico.content.tracks.${track.slug}.title`, track.title),
    outcome: readMessageString(`pico.content.tracks.${track.slug}.outcome`, track.outcome),
    intro: readMessageString(`pico.content.tracks.${track.slug}.intro`, track.intro),
    checklist: readMessageStrings(`pico.content.tracks.${track.slug}.checklist`, track.checklist),
  })
  const localizeLesson = (lesson: ReturnType<typeof getLessonBySlug> | null | undefined) => {
    if (!lesson) {
      return lesson
    }

    return {
      ...lesson,
      title: readMessageString(`pico.content.lessons.${lesson.slug}.title`, lesson.title),
      summary: readMessageString(`pico.content.lessons.${lesson.slug}.summary`, lesson.summary),
      objective: readMessageString(`pico.content.lessons.${lesson.slug}.objective`, lesson.objective),
      outcome: readMessageString(`pico.content.lessons.${lesson.slug}.outcome`, lesson.outcome),
      expectedResult: readMessageString(
        `pico.content.lessons.${lesson.slug}.expectedResult`,
        lesson.expectedResult,
      ),
      validation: readMessageString(
        `pico.content.lessons.${lesson.slug}.validation`,
        lesson.validation,
      ),
      steps: lesson.steps.map((step, index) => ({
        ...step,
        title: readMessageString(
          `pico.content.lessons.${lesson.slug}.steps.${index}.title`,
          step.title,
        ),
      })),
    }
  }
  const notSetLabel = readMessageString('pico.onboardingPage.shared.notSet', 'not set')
  const notRecordedLabel = tt('runtime.notRecorded', 'not recorded')
  const localOnlyLabel = readMessageString('pico.onboardingPage.shared.runtime.localOnly', 'local only')
  const checkingLabel = readMessageString('pico.onboardingPage.shared.runtime.checking', 'checking')
  const notAttachedLabel = tt('hero.runtimeNotAttached', 'not attached')
  const localLabel = readMessageString('pico.onboardingPage.shared.local', 'local')
  const sealedLabel = readMessageString('pico.onboardingPage.shared.sealed', 'sealed')
  const capturedLabel = tt('mission.captured', 'captured')
  const missingLabel = tt('mission.missing', 'missing')
  const recordedLabel = readMessageString('pico.onboardingPage.shared.recorded', 'recorded')
  const onePromptAwayLabel = readMessageString('pico.onboardingPage.shared.onePromptAway', 'one prompt away')
  const installFirstLabel = readMessageString('pico.onboardingPage.shared.installFirst', 'install first')
  const noneLabel = readMessageString('pico.onboardingPage.shared.none', 'none')
  const signInLabel = readMessageString('pico.onboardingPage.shared.signIn', 'sign in')
  const pendingLabel = tt('runtime.pending', 'pending')
  const doneLabel = tt('runtime.done', 'done')
  const completedLabel = tt('mission.completed', 'completed')
  const failedLabel = tt('runtime.failed', 'failed')
  const activeLabel = tt('runtime.active', 'active')
  const checklistDismissedLabel = tt('runtime.checklistDismissed', 'checklist dismissed')
  const checklistVisibleLabel = tt('runtime.checklistVisible', 'checklist visible')
  const notStartedLabel = tt('runtime.notStarted', 'not started')
  const [runtimeDraft, setRuntimeDraft] = useState<RuntimeDraft>({
    label: 'OpenClaw',
    status: 'healthy',
    installMethod: 'manual',
    gatewayUrl: '',
    assistantName: '',
    workspace: '',
    model: '',
  })

  function formatRuntimeStatusOption(status: (typeof runtimeStatusOptions)[number]) {
    return readMessageString(
      `pico.onboardingPage.labels.runtimeStatusOptions.${status}`,
      status.replace(/_/g, ' '),
    )
  }

  function formatInstallMethodOption(method: (typeof installMethodOptions)[number]) {
    return readMessageString(
      `pico.onboardingPage.labels.installMethodOptions.${method}`,
      method,
    )
  }

  const firstTrackSource = PICO_TRACKS[0]
  const firstTrack = localizeTrack(firstTrackSource)
  const installLessonSlug = 'install-hermes-locally'
  const firstRunLessonSlug = 'run-your-first-agent'
  const installLesson = localizeLesson(getLessonBySlug(installLessonSlug))
  const firstRunLesson = localizeLesson(getLessonBySlug(firstRunLessonSlug))
  const installDone = progress.completedLessons.includes(installLessonSlug)
  const firstRunDone = progress.completedLessons.includes(firstRunLessonSlug)
  const activeTrack = localizeTrack(
    PICO_TRACKS.find((track) => track.slug === progress.selectedTrack) ?? firstTrackSource,
  )
  const nextLesson = derived.nextLesson ? localizeLesson(derived.nextLesson) : null
  const activationLessonSlug = firstRunDone
    ? (derived.nextLesson?.slug ?? activeTrack.lessons[0])
    : installDone
      ? firstRunLessonSlug
      : installLessonSlug
  const installWorkspace = usePicoLessonWorkspace(installLessonSlug, installLesson?.steps.length ?? 0, {
    progress,
    persistRemote: (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace),
  })
  const firstRunWorkspace = usePicoLessonWorkspace(firstRunLessonSlug, firstRunLesson?.steps.length ?? 0, {
    progress,
    persistRemote: (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace),
  })
  const installFocusedStep =
    installWorkspace.workspace.activeStepIndex >= 0
      ? installLesson?.steps[installWorkspace.workspace.activeStepIndex]?.title ?? notSetLabel
      : notSetLabel
  const firstRunFocusedStep =
    firstRunWorkspace.workspace.activeStepIndex >= 0
      ? firstRunLesson?.steps[firstRunWorkspace.workspace.activeStepIndex]?.title ?? notSetLabel
      : notSetLabel
  const storyRailClass =
    'mt-6 grid grid-flow-col auto-cols-[minmax(16rem,82vw)] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-visible xl:grid-cols-3'
  const missionRailClass =
    'mt-6 grid grid-flow-col auto-cols-[minmax(18rem,88vw)] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-visible xl:grid-cols-2'
  const compactRailClass =
    'grid grid-flow-col auto-cols-[minmax(15rem,82vw)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:grid-cols-2'
  const timelineRailClass =
    'grid grid-flow-col auto-cols-[minmax(15rem,82vw)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-visible'
  const kickoffDoctrine = [
    {
      label: tt('doctrine.labels.brief', '01 • Brief'),
      title: tt('doctrine.brief', 'Make the runtime open cleanly'),
      body:
        installLesson?.objective ??
        'Install Hermes and get the command working from a fresh shell.',
    },
    {
      label: '02 • Deliverable',
      title: tt('doctrine.deliverable', 'Produce one obvious proof artifact'),
      body:
        firstRunLesson?.expectedResult ??
        'Save one prompt and one answer in a file you can reopen later.',
    },
    {
      label: tt('doctrine.labels.reviewLine', '03 • Review line'),
      title: tt('doctrine.reviewLine', 'Do not widen the surface early'),
      body:
        firstRunLesson?.validation ??
        'Verify one bounded run before you touch more advanced surfaces.',
    },
  ]

  const hostedCompletionRatio = useMemo(() => {
    if (!setup.onboarding || setup.onboarding.steps.length === 0) {
      return 0
    }

    const completedCount = setup.onboarding.steps.filter((step) => step.completed).length
    return Math.round((completedCount / setup.onboarding.steps.length) * 100)
  }, [setup.onboarding])

  const currentBinding = setup.runtime?.current_binding ?? setup.runtime?.bindings[0] ?? null
  const onboardingRobot = picoRobotArtById.guide
  const proofCaptured = firstRunWorkspace.workspace.evidence.trim().length > 0 || firstRunDone
  const completedLessonStepCount =
    installWorkspace.completedStepCount + firstRunWorkspace.completedStepCount
  const totalLessonStepCount = (installLesson?.steps.length ?? 0) + (firstRunLesson?.steps.length ?? 0)
  const chapterPulsePercent = useMemo(() => {
    if (totalLessonStepCount === 0) {
      return 0
    }

    return Math.round(
      (completedLessonStepCount / totalLessonStepCount) * 100,
    )
  }, [completedLessonStepCount, totalLessonStepCount])
  const runtimeSignal =
    session.status !== 'authenticated'
      ? localOnlyLabel
      : setup.loading
        ? checkingLabel
        : setup.runtime?.status ?? notAttachedLabel
  const nextMoveTitle = !installDone
    ? tt('hero.trackInstallPrompt', 'Install Hermes now')
    : !proofCaptured
      ? (firstRunLesson?.title ?? tt('mission.runBoundedPrompt', 'Run one bounded prompt'))
      : !firstRunDone
        ? tt('hero.sealFirstWin', 'Seal the first win')
        : nextLesson
          ? tt('hero.continueWithNextLesson', 'Continue with {lessonTitle}', {
              lessonTitle: nextLesson.title,
            })
          : tt('hero.openAutopilot', 'Open Autopilot')
  const activeFocusStep = !installDone ? installFocusedStep : firstRunFocusedStep
  const activeWorkspaceLabel =
    setup.onboarding?.workspace ?? currentBinding?.workspace ?? runtimeDraft.workspace ?? notRecordedLabel
  const heroEyebrow = !proofCaptured
    ? tt('hero.proofStateHeadline.install', 'Make the first proof impossible to miss.')
    : !firstRunDone
      ? tt('hero.proofStateHeadline.prompt', 'Seal the proof while the route is still honest.')
      : tt('hero.proofStateHeadline.cleared', 'First proof is real. Keep the lane moving.')
  const hostedSyncLabel = session.status === 'authenticated' ? `${hostedCompletionRatio}%` : localLabel
  const proofSignalLabel = proofCaptured ? (firstRunDone ? sealedLabel : capturedLabel) : missingLabel
  const runtimeSignalDetail =
    session.status !== 'authenticated'
      ? tt('hero.hostedSyncDetail.offline', 'hosted sync offline')
      : setup.loading
        ? tt('hero.hostedSyncDetail.loading', 'refreshing signal')
        : setup.runtime?.gateway_url
          ? tt('hero.hostedSyncDetail.gatewayLive', 'gateway live')
          : tt('hero.hostedSyncDetail.gatewayUnbound', 'gateway unbound')
  const orbitTransition = prefersReducedMotion
    ? undefined
    : { duration: 20, repeat: Infinity, ease: 'linear' as const }
  const ambientDriftTransition = prefersReducedMotion
    ? undefined
    : { duration: 10, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
  const slowFloatTransition = prefersReducedMotion
    ? undefined
    : { duration: 14, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }

  const runtimeDraftDirty = useMemo(() => {
    const runtime = setup.runtime
    if (!runtime) {
      return runtimeDraft.gatewayUrl.length > 0 || runtimeDraft.workspace.length > 0
    }

    return (
      runtimeDraft.label !== (runtime.label ?? 'OpenClaw') ||
      runtimeDraft.status !== runtime.status ||
      runtimeDraft.installMethod !== (runtime.install_method ?? '') ||
      runtimeDraft.gatewayUrl !== (runtime.gateway_url ?? '') ||
      runtimeDraft.assistantName !== (currentBinding?.assistant_name ?? '') ||
      runtimeDraft.workspace !== (currentBinding?.workspace ?? '') ||
      runtimeDraft.model !== (currentBinding?.model ?? '')
    )
  }, [currentBinding?.assistant_name, currentBinding?.model, currentBinding?.workspace, runtimeDraft, setup.runtime])

  useEffect(() => {
    if (!progress.milestoneEvents.includes('account_created')) {
      actions.unlockMilestone('account_created')
    }
    if (!progress.selectedTrack) {
      actions.pickTrack('first-agent')
    }
    if (progress.platform.activeSurface !== 'onboarding') {
      actions.setPlatform({ activeSurface: 'onboarding' })
    }
  }, [actions, progress.milestoneEvents, progress.platform.activeSurface, progress.selectedTrack])

  useEffect(() => {
    const runtime = setup.runtime
    const binding = runtime?.current_binding ?? runtime?.bindings[0]

    setRuntimeDraft({
      label: runtime?.label ?? 'OpenClaw',
      status: runtime?.status ?? 'healthy',
      installMethod: runtime?.install_method ?? 'manual',
      gatewayUrl: runtime?.gateway_url ?? '',
      assistantName: binding?.assistant_name ?? '',
      workspace: binding?.workspace ?? setup.onboarding?.workspace ?? '',
      model: binding?.model ?? '',
    })
  }, [setup.onboarding?.workspace, setup.runtime])

  async function saveRuntimeSnapshot() {
    const binding =
      runtimeDraft.assistantName || runtimeDraft.workspace || runtimeDraft.model
        ? [
            {
              assistant_name: runtimeDraft.assistantName || null,
              workspace: runtimeDraft.workspace || null,
              model: runtimeDraft.model || null,
            },
          ]
        : []

    await setup.updateRuntimeSnapshot({
      label: runtimeDraft.label || 'OpenClaw',
      status: runtimeDraft.status || 'unknown',
      install_method: runtimeDraft.installMethod || null,
      gateway_url: runtimeDraft.gatewayUrl || null,
      bindings: binding,
      current_binding: binding[0] ?? null,
      binding_count: binding.length,
    })
  }

  return (
    <PicoShell
      eyebrow={tt('hero.shellEyebrow', 'Onboarding')}
      title={tt('hero.shellTitle', 'Get to your first working agent fast')}
      description={tt(
        'hero.shellDescription',
        'Ignore everything except the first local win. Install Hermes, run one prompt, see a real answer, then keep moving.',
      )}
      heroContent={
        <div
          className="relative overflow-hidden rounded-[28px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(135deg,rgba(var(--pico-accent-rgb),0.16),rgba(9,16,11,0.88)_38%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6"
          data-testid="pico-onboarding-hero-signal"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-10 h-40 w-40 rounded-full bg-[rgba(var(--pico-accent-rgb),0.16)] blur-3xl"
            animate={prefersReducedMotion ? undefined : { x: [-10, 18, -6], y: [0, 14, -4], scale: [1, 1.08, 0.96] }}
            transition={ambientDriftTransition}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[rgba(var(--pico-accent-rgb),0.12)] blur-3xl"
            animate={prefersReducedMotion ? undefined : { x: [12, -10, 8], y: [8, -12, 0], scale: [0.94, 1.06, 1] }}
            transition={slowFloatTransition}
          />
          <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr),18rem]">
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={picoClasses.chip}>{tt('hero.firstWinPulse', 'First-win pulse')}</span>
                <span className="inline-flex rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                  {activeTrack.title}
                </span>
              </div>
              <p className="font-[family:var(--font-site-display)] text-[clamp(1.9rem,4vw,2.9rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--pico-text)]">
                {heroEyebrow}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'hero.subtitle',
                  'Track the install, the first proof artifact, and the next move from one place.',
                )}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>{tt('hero.chapterPulse', 'Chapter pulse')}</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {chapterPulsePercent}%
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {tt('hero.stepsClear', '{completed}/{total} steps clear', {
                      completed: completedLessonStepCount,
                      total: totalLessonStepCount,
                    })}
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>{tt('hero.proofState', 'Proof state')}</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {proofSignalLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {proofCaptured
                      ? tt('hero.proofArtifactLogged', 'artifact logged')
                      : tt('hero.proofArtifactMissing', 'artifact still missing')}
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>{tt('hero.runtimeTruth', 'Runtime truth')}</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {runtimeSignal}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {runtimeSignalDetail}
                  </p>
                </div>
              </div>

              <div className={picoInset('grid gap-3 p-4 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center')}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(var(--pico-accent-rgb),0.24)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.18),rgba(7,13,8,0.5))] shadow-[0_18px_40px_rgba(var(--pico-accent-rgb),0.12)]">
                  <span className="h-3 w-3 rounded-full bg-[color:var(--pico-accent-bright)] shadow-[0_0_18px_rgba(var(--pico-accent-rgb),0.5)]" />
                </div>
                <div className="min-w-0">
                  <p className={picoClasses.label}>
                    {tt('hero.nextIrreversibleMove', 'Next irreversible move')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {nextMoveTitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {activeFocusStep} · {activeWorkspaceLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className={picoInset('relative min-h-[20rem] overflow-hidden border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[radial-gradient(circle_at_50%_22%,rgba(var(--pico-accent-rgb),0.16),rgba(6,11,7,0.94)_54%,rgba(3,5,3,0.98)_100%)] p-4')}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]"
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(var(--pico-accent-rgb),0.16)]"
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={orbitTransition}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[11rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(var(--pico-accent-rgb),0.24)]"
                animate={prefersReducedMotion ? undefined : { rotate: -360, scale: [0.98, 1.03, 0.98] }}
                transition={prefersReducedMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--pico-accent-rgb),0.28),rgba(var(--pico-accent-rgb),0.02)_62%,transparent_74%)] blur-2xl"
                animate={prefersReducedMotion ? undefined : { scale: [0.9, 1.08, 0.96], opacity: [0.35, 0.7, 0.45] }}
                transition={ambientDriftTransition}
              />

              <motion.div
                className="absolute left-4 top-4 max-w-[8.5rem] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [-2, 10, -2], x: [0, 6, 0] }}
                transition={ambientDriftTransition}
              >
                <p className={picoClasses.label}>{tt('hero.proof', 'Proof')}</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{proofSignalLabel}</p>
              </motion.div>

              <motion.div
                className="absolute right-4 top-7 max-w-[8.5rem] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [8, -6, 8], x: [0, -4, 0] }}
                transition={slowFloatTransition}
              >
                <p className={picoClasses.label}>{tt('hero.runtime', 'Runtime')}</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{runtimeSignal}</p>
              </motion.div>

              <motion.div
                className="absolute bottom-4 left-5 max-w-[9rem] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0], x: [-2, 6, -2] }}
                transition={ambientDriftTransition}
              >
                <p className={picoClasses.label}>{tt('hero.focus', 'Focus')}</p>
                <p className="mt-1 text-sm font-medium text-[color:var(--pico-text)]">{activeFocusStep}</p>
              </motion.div>

              <motion.div
                className="absolute bottom-5 right-5 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [6, -4, 6], x: [0, -6, 0] }}
                transition={slowFloatTransition}
              >
                <p className={picoClasses.label}>{tt('hero.sync', 'Sync')}</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{hostedSyncLabel}</p>
              </motion.div>

              <div className="relative flex h-full items-center justify-center">
                <div className="w-full max-w-[11rem] rounded-[30px] border border-[rgba(var(--pico-accent-rgb),0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 text-center shadow-[0_22px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                  <p className={picoClasses.label}>{tt('hero.signalCore', 'Signal core')}</p>
                  <p className="mt-3 font-[family:var(--font-site-display)] text-5xl tracking-[-0.08em] text-[color:var(--pico-text)]">
                    {chapterPulsePercent}%
                  </p>
                  <div className="mt-4 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                      style={{ width: `${chapterPulsePercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                    {tt('hero.stepsClear', '{completed}/{total} steps clear', {
                      completed: completedLessonStepCount,
                      total: totalLessonStepCount,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      railCollapsed={progress.platform.railCollapsed}
      helpLaneOpen={progress.platform.helpLaneOpen}
      onToggleRail={() =>
        actions.setPlatform({ railCollapsed: !progress.platform.railCollapsed })
      }
      onToggleHelpLane={() =>
        actions.setPlatform({ helpLaneOpen: !progress.platform.helpLaneOpen })
      }
        actions={
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link
            href={
              firstRunDone && !nextLesson
                ? toHref('/autopilot')
                : toHref(`/academy/${activationLessonSlug}`)
            }
            className={picoClasses.primaryButton}
            >
              {!installDone
                ? tt('hero.trackInstallPrompt', 'Install Hermes now')
                : !firstRunDone
                  ? tt('compass.runFirstPrompt', 'Run your first agent')
                  : nextLesson
                    ? `Continue with ${nextLesson.title}`
                    : tt('compass.inspectLiveControlRoom', 'Open Autopilot')}
            </Link>
            <Link href={toHref(`/tutor?lesson=${activationLessonSlug}`)} className={picoClasses.secondaryButton}>
              {tt('compass.askTutorAboutStep', 'Ask tutor about this step')}
            </Link>
            <Link href={toHref('/support')} className={picoClasses.tertiaryButton}>
              {tt('compass.escalateToHumanHelp', 'Open support lane')}
            </Link>
          </div>
        }
    >
      <PicoSessionBanner session={session} nextPath={pathname} />
      <PicoSurfaceCompass
        title={tt('compass.title', 'Use the shortest route that keeps the product honest')}
        body={tt(
          'compass.body',
          'Keep the first win narrow. Continue the lesson path when the sequence is clear, use tutor for one blocked command, open Autopilot only when live runtime state is the real question, and escalate last.',
        )}
        status={
          firstRunDone
            ? tt('compass.statusFirstWinCleared', 'first win cleared')
            : installDone
              ? tt('compass.statusInstallCleared', 'install cleared')
              : tt('compass.statusColdStart', 'cold start')
        }
        aside={tt(
          'compass.aside',
          'This chapter exists to compress the world, not widen it. The first proof should happen before preferences, architecture debates, or tooling tours.',
        )}
        items={[
          {
            href: toHref(`/academy/${activationLessonSlug}`),
            label: !installDone
              ? tt('compass.openInstallLesson', 'Open install lesson')
              : !firstRunDone
                ? tt('compass.runFirstPrompt', 'Run first prompt')
                : tt('compass.continueAcademyLane', 'Continue academy lane'),
            caption: tt(
              'compass.primaryCaption',
              'Stay on the primary sequence until one visible output is real.',
            ),
            note: tt('compass.nextMove', 'Next move'),
            tone: 'primary',
          },
          {
            href: toHref(`/tutor?lesson=${activationLessonSlug}`),
            label: tt('compass.askTutorAboutStep', 'Ask tutor about this step'),
            caption: tt(
              'compass.tutorCaption',
              'Use this when one concrete command or validation gate is blocking you.',
            ),
            note: tt('compass.blocked', 'Blocked'),
          },
          {
            href: toHref('/autopilot'),
            label: tt('compass.inspectLiveControlRoom', 'Inspect live control room'),
            caption: tt(
              'compass.autopilotCaption',
              'Switch here once runtime state, approvals, or spend become the bottleneck.',
            ),
            note: tt('compass.runtime', 'Runtime'),
            tone: 'soft',
          },
          {
            href: toHref('/support'),
            label: tt('compass.escalateToHumanHelp', 'Escalate to human help'),
            caption: tt(
              'compass.supportCaption',
              'Only use this when the product path stopped being truthful enough to recover alone.',
            ),
            note: tt('compass.messyEdge', 'Messy edge'),
          },
        ]}
      />

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-kickoff-doctrine">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>{tt('doctrine.label', 'Kickoff doctrine')}</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  {tt('doctrine.title', 'Start like a sharp studio, not a hobby project')}
                </h2>
              </div>
              <span className={picoClasses.chip}>{tt('doctrine.chip', 'brief • deliverable • review')}</span>
            </div>

            <div className={storyRailClass}>
              {kickoffDoctrine.map((item) => (
                <article key={item.label} className={picoInset('snap-start flex h-full flex-col p-5')}>
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
            <div className={picoEmber('p-5')}>
              <p className={picoClasses.label}>{tt('labels.chapterPosture', 'Chapter posture')}</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'doctrine.postBody',
                  'Keep Chapter 01 narrow on purpose. No browsing, no stack tourism, and no extra setup theater before one real artifact exists.',
                )}
              </p>
            </div>

            <div className={picoInset('overflow-hidden p-0')}>
              <div className="border-b border-[color:var(--pico-border)] p-5">
                <p className={picoClasses.label}>{tt('labels.guideMarker', 'Guide marker')}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'doctrine.guideMarkerBody',
                    'One clear guide cue is enough while the first proof is still forming.',
                  )}
                </p>
              </div>
              <div className="flex items-center justify-center p-6">
                <Image
                  src={onboardingRobot.src}
                  alt={onboardingRobot.alt}
                  width={220}
                  height={220}
                  className="h-auto w-full max-w-[11rem] object-contain drop-shadow-[0_12px_28px_rgba(164,255,92,0.18)]"
                  sizes="176px"
                />
              </div>
            </div>

            <div className={picoInset('p-5')}>
              <p className={picoClasses.label}>{tt('labels.trackChecklist', 'Track checklist')}</p>
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <div className={picoPanel('overflow-hidden p-0')}>
          <div className="grid gap-0 border-b border-[color:var(--pico-border)] lg:grid-cols-[minmax(0,1fr),18rem]">
            <div className="p-6 sm:p-7">
              <p className={picoClasses.label}>{tt('labels.chapterBrief', 'Chapter 01 brief')}</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                {tt('labels.chapterBriefTitle', 'Make one command work and keep the proof')}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                {tt(
                  'labels.chapterBriefBody',
                  'This first chapter should narrow the world fast: install Hermes, run one tiny prompt, and hold on to the output so the first win becomes something real.',
                )}
              </p>

              <div className={joinClasses(picoEmber('mt-6 p-5 text-sm leading-7'), 'sm:p-6')}>
                <p className="font-medium text-[color:var(--pico-text)]">
                  {tt('labels.fastestPath', 'Fastest path to value')}
                </p>
                <p className="mt-2">
                  {firstRunDone
                    ? tt(
                        'labels.fastestPathBody.done',
                        'You already cleared the first win. Do not linger here. Open the next lesson and keep the sequence moving.',
                      )
                    : installDone
                      ? tt(
                          'labels.fastestPathBody.installDone',
                          'Good. The install is done. Now run one tiny prompt and get the first visible answer.',
                        )
                      : tt(
                          'labels.fastestPathBody.installFirst',
                          'Do not compare providers, frameworks, or stacks yet. Install Hermes and make the command work first.',
                        )}
                </p>
              </div>

              <div className={picoInset('mt-6 grid gap-4 p-5 lg:grid-cols-3')}>
                <div>
                  <p className={picoClasses.label}>{tt('labels.trackLocked', 'Track locked')}</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {activeTrack.title}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>{tt('hero.nextMove', 'Next move')}</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {nextLesson?.title ?? noneLabel}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>{tt('hero.visibleSuccess', 'Visible success')}</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {firstRunWorkspace.workspace.evidence.trim() || firstRunDone
                      ? recordedLabel
                      : installDone
                        ? onePromptAwayLabel
                        : installFirstLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
              <p className={picoClasses.label}>{tt('labels.studioLedger', 'Studio ledger')}</p>
              <div className="mt-4 grid gap-3">
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('labels.completedLessons', 'Completed lessons')}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                    {derived.completedLessonCount}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('labels.hostedSync', 'Hosted sync')}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                    {session.status === 'authenticated' ? `${hostedCompletionRatio}%` : signInLabel}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('labels.runtimeStatus', 'Runtime status')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.runtime?.status ?? notAttachedLabel}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('labels.workspace', 'Workspace')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.onboarding?.workspace ?? currentBinding?.workspace ?? notRecordedLabel}
                  </p>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>{tt('labels.jumpStraightTo', 'Jump straight to')}</p>
                <div className="mt-3 grid gap-2">
                  <Link href={toHref(`/academy/${installLessonSlug}`)} className={picoClasses.secondaryButton}>
                    {tt('labels.installLesson', 'Install lesson')}
                  </Link>
                  <Link href={toHref(`/academy/${firstRunLessonSlug}`)} className={picoClasses.tertiaryButton}>
                    {tt('labels.firstPromptLesson', 'First prompt lesson')}
                  </Link>
                  <Link href={toHref('/tutor')} className={picoClasses.tertiaryButton}>
                    {tt('labels.askTutor', 'Ask tutor')}
                  </Link>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>{tt('labels.operatingRule', 'Operating rule')}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'labels.operatingRuleBody',
                    'More choice this early is just prettier procrastination. Get the first win, then widen the surface.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>{tt('labels.currentPressure', 'Current pressure')}</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('labels.install', 'Install')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {installDone ? doneLabel : pendingLabel}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('labels.firstPrompt', 'First prompt')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {firstRunWorkspace.workspace.evidence.trim() || firstRunDone
                    ? tt('labels.currentPressureFirstPrompt', 'proof captured')
                    : pendingLabel}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className={picoPanel('mt-6 p-6 sm:p-7')} data-testid="pico-onboarding-proof-protocol">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>{tt('labels.proofProtocol', 'Proof protocol')}</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              {tt('labels.visibleMoves', 'Three visible moves to clear Chapter 01')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'protocol.body',
                'These are the only moves that count before the surface earns the right to get wider.',
              )}
            </p>
          </div>
          <span className={picoClasses.chip}>{tt('mission.firstWinProtocol', 'first win protocol')}</span>
        </div>

        <div className={storyRailClass}>
          {activationChecklist.map((item, index) => (
            <article key={item.title} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent)]">
                  {tt(`protocol.items.${index}.chapter`, item.chapter)}
                </span>
                <span className={picoClasses.label}>
                  {index === 0
                    ? tt('mission.doThisNow', 'Do this now')
                    : tt('mission.visibleMove', 'Visible move')}
                </span>
              </div>
              <h3 className="mt-6 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {tt(`protocol.items.${index}.title`, item.title)}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                {tt(`protocol.items.${index}.body`, item.body)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-stack-radar">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>{tt('labels.liveStackRadar', 'Live stack radar')}</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              {tt(
                'labels.liveStackRadarTitle',
                'The onboarding lane now knows what the tracked stacks are actually shipping',
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'labels.liveStackRadarBody',
                'Pico starts with Hermes in the lesson flow, but the product now keeps the rest of the stack map visible instead of pretending there is only one runtime on earth.',
              )}
            </p>
          </div>
          <Link href={toHref('/wip')} className={picoClasses.secondaryButton}>
            {tt('labels.openLiveLedger', 'Open live ledger')}
          </Link>
        </div>

        <div className={storyRailClass}>
          {stackSpotlights.map((stack, index) => (
            <article key={stack.id} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className={picoClasses.label}>
                  {tt(`runtime.stackSpotlights.${index}.name`, stack.name)}
                </span>
                <span className={picoClasses.chip}>
                  {tt(`runtime.stackSpotlights.${index}.latestSignal`, stack.latestSignal)}
                </span>
              </div>
              <p className="mt-6 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {tt(`runtime.stackSpotlights.${index}.whyNow`, stack.whyNow)}
              </p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                {tt(
                  `runtime.stackSpotlights.${index}.body`,
                  'Keep this map in view while you execute the first lessons. Stack choice, launch posture, and remote-access decisions should stay explicit from day one.',
                )}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-mission-board">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>{tt('labels.missionBoard', 'Mission board')}</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              {tt('labels.missionBoardTitle', 'Keep the first two missions visibly grounded')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'labels.missionBoardBody',
                'Onboarding should know where the operator left off. These mission cards mirror the lesson workspace so the first win survives route changes instead of dissolving into memory.',
              )}
            </p>
          </div>
          <span className={picoClasses.chip}>{tt('labels.workspaceContinuity', 'workspace continuity')}</span>
        </div>

        <div className={missionRailClass}>
          <article className={picoInset('grid gap-4 p-5')} data-testid="pico-onboarding-install-mission">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={picoClasses.label}>{tt('labels.mission01', 'Mission 01')}</p>
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {tt('mission.installHermes', installLesson?.title ?? 'Install Hermes')}
                </h3>
              </div>
              <span className={picoClasses.chip}>
                {installWorkspace.completedStepCount}/{installLesson?.steps.length ?? 0} steps
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-[color:var(--pico-bg-input)]">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                style={{ width: `${installWorkspace.progressPercent}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('mission.focusedStep', 'Focused step')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{installFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('hero.proofState', 'Proof state')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {installWorkspace.workspace.evidence.trim()
                    ? capturedLabel
                    : installDone
                      ? completedLabel
                      : missingLabel}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href={toHref(`/academy/${installLessonSlug}`)} className={picoClasses.secondaryButton}>
                {tt('mission.resumeInstall', 'Resume install mission')}
              </Link>
              <Link href={toHref(`/tutor?lesson=${installLessonSlug}`)} className={picoClasses.tertiaryButton}>
                {tt('labels.askTutor', 'Ask tutor')}
              </Link>
            </div>
          </article>

          <article className={picoInset('grid gap-4 p-5')} data-testid="pico-onboarding-first-run-mission">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={picoClasses.label}>{tt('labels.mission02', 'Mission 02')}</p>
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {tt(
                    'mission.runBoundedPrompt',
                    firstRunLesson?.title ?? 'Run one bounded prompt',
                  )}
                </h3>
              </div>
              <span className={picoClasses.chip}>
                {firstRunWorkspace.completedStepCount}/{firstRunLesson?.steps.length ?? 0} steps
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-[color:var(--pico-bg-input)]">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,var(--pico-accent),var(--pico-accent-bright))]"
                style={{ width: `${firstRunWorkspace.progressPercent}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('mission.focusedStep', 'Focused step')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{firstRunFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('hero.proofState', 'Proof state')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {firstRunWorkspace.workspace.evidence.trim()
                    ? capturedLabel
                    : firstRunDone
                      ? completedLabel
                      : missingLabel}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href={toHref(`/academy/${firstRunLessonSlug}`)} className={picoClasses.secondaryButton}>
                {tt('mission.resumePrompt', 'Resume prompt mission')}
              </Link>
              <Link href={toHref(`/tutor?lesson=${firstRunLessonSlug}`)} className={picoClasses.tertiaryButton}>
                {tt('labels.askTutor', 'Ask tutor')}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-operator-record">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>{tt('labels.operatorRecord', 'Operator record')}</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              {tt(
                'labels.operatorRecordTitle',
                'Keep hosted kickoff and runtime truth in one place',
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'labels.operatorRecordBody',
                'Keep the hosted onboarding state, runtime truth, and next activation move in one operator record for Chapter 01.',
              )}
            </p>
          </div>
          {session.status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => void setup.refresh()}
              className={picoClasses.tertiaryButton}
            >
              {tt('labels.refreshSync', 'Refresh sync')}
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
          <div className="grid gap-4">
            {session.status !== 'authenticated' ? (
              <div className={picoSoft('p-5')}>
                <p className={picoClasses.body}>{tt('runtime.signInFirst', 'Sign in first. The runtime snapshot is per operator account.')}</p>
              </div>
            ) : setup.loading ? (
              <div className={picoSoft('p-5')}>
                <p className={picoClasses.body}>{tt('runtime.loading', 'Loading backend onboarding and runtime state.')}</p>
              </div>
            ) : setup.error ? (
              <div className={picoEmber('p-5')}>
                <p className={picoClasses.body}>{setup.error}</p>
              </div>
            ) : (
              <>
                {setup.onboarding ? (
                  <div className={compactRailClass}>
                    {(setup.onboarding.providers ?? []).map((provider) => {
                      const active = provider.id === setup.onboarding?.provider
                      return (
                        <article
                          key={provider.id}
                          className={joinClasses(
                            picoInset('snap-start grid gap-2 p-4'),
                            active && 'border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.09)]',
                            !provider.enabled && 'opacity-70',
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{provider.cue ?? '•'}</span>
                              <div>
                                <p className="font-medium text-[color:var(--pico-text)]">{provider.label}</p>
                                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                                  {active
                                    ? tt('runtime.currentProvider', 'current provider')
                                    : provider.enabled
                                      ? tt('runtime.availableSoon', 'available soon')
                                      : tt('runtime.locked', 'locked')}
                                </p>
                              </div>
                            </div>
                            <span className={picoClasses.chip}>
                              {provider.enabled ? tt('runtime.ready', 'ready') : tt('runtime.later', 'later')}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{provider.summary}</p>
                        </article>
                      )
                    })}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('runtime.wizardProgress', 'Wizard progress')}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                      {setup.onboarding ? `${hostedCompletionRatio}%` : notStartedLabel}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('runtime.currentStep', 'Current step')}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {setup.onboarding?.current_step ?? notRecordedLabel}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('labels.runtimeStatus', 'Runtime status')}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {setup.runtime?.status ?? notAttachedLabel}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('labels.currentBinding', 'Current binding')}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {currentBinding?.assistant_name ?? currentBinding?.assistant_id ?? noneLabel}
                    </p>
                  </div>
                </div>

                {setup.onboarding ? (
                  <div className={picoInset('grid gap-4 p-5')}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={picoClasses.label}>{tt('runtime.hostedKickoffReview', 'Hosted kickoff review')}</p>
                        <h3 className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {setup.onboarding.status}
                        </h3>
                      </div>
                      <span className={picoClasses.chip}>
                        {setup.onboarding.checklist_dismissed ? checklistDismissedLabel : checklistVisibleLabel}
                      </span>
                    </div>

                    {setup.onboarding.last_error ? (
                      <p className="text-sm leading-6 text-[color:var(--pico-accent)]">{setup.onboarding.last_error}</p>
                    ) : null}

                    <div className={timelineRailClass}>
                      {setup.onboarding.steps.map((step) => {
                        const active = step.id === setup.onboarding?.current_step
                        const failed = step.id === setup.onboarding?.failed_step
                        return (
                          <div
                            key={step.id}
                            className={joinClasses(
                              picoInset('snap-start flex items-center justify-between gap-4 px-4 py-3'),
                              active && 'border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.08)]',
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-[color:var(--pico-text)]">{step.title}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--pico-text-muted)]">
                                {step.id}
                              </p>
                            </div>
                            <span className={picoClasses.chip}>
                              {failed ? failedLabel : step.completed ? doneLabel : active ? activeLabel : pendingLabel}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={picoSoft('p-5')}>
                    <p className={picoClasses.body}>{tt('runtime.noHostedState', 'No hosted onboarding state has been recorded yet.')}</p>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
                  <div className={picoInset('p-5')}>
                    <p className={picoClasses.label}>{tt('runtime.operatorHostSnapshot', 'Operator host snapshot')}</p>
                    {setup.runtime ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('runtime.gateway', 'Gateway')}</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.gateway_url ?? notRecordedLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">
                            {tt('runtime.installMethod', 'Install method')}
                          </p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.install_method ?? notRecordedLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('runtime.lastSeen', 'Last seen')}</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {formatTimestamp(locale, setup.runtime.last_seen_at, notRecordedLabel)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('runtime.bindings', 'Bindings')}</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.binding_count}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt('runtime.noRuntimeSnapshot', 'No runtime snapshot has been synced yet.')}
                      </p>
                    )}
                  </div>

                  <div className={picoEmber('p-5')}>
                    <p className={picoClasses.label}>{tt('runtime.gatewayHealth', 'Gateway health')}</p>
                    <p className="mt-2 text-lg text-[color:var(--pico-text)]">
                      {setup.runtime?.gateway?.status ?? tt('runtime.unknown', 'unknown')}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {typeof setup.runtime?.gateway?.doctor_summary === 'string'
                        ? setup.runtime.gateway.doctor_summary
                        : tt('runtime.noDoctorSummary', 'No doctor summary was synced yet.')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>{tt('labels.activationTrack', 'Activation track')}</p>
              <article className={picoInset('mt-4 grid gap-4 p-5')}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={picoClasses.chip}>{tt('labels.doThisFirst', 'Do this first')}</span>
                    <span className={picoClasses.chip}>{tt('labels.outcomeDriven', 'Outcome-driven')}</span>
                  </div>
                  <h2 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {firstTrack.title}
                  </h2>
                  <p className={picoClasses.body}>{firstTrack.intro}</p>
                  <p className="text-sm text-[color:var(--pico-accent)]">
                    {tt('labels.outcome', 'Outcome:')} {firstTrack.outcome}
                  </p>
                </div>
                <div className="grid gap-3">
                  {firstTrack.checklist.map((item) => (
                    <div key={item} className={picoInset('px-4 py-3 text-sm text-[color:var(--pico-text-secondary)]')}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.body}>
                    {firstRunDone
                      ? tt(
                          'labels.activationTrackBody.done',
                          'You already got the first win. Use the main action above and keep the sequence moving.',
                        )
                      : installDone
                        ? tt(
                            'labels.activationTrackBody.installDone',
                            'Hermes is installed. Skip the overview and open the first prompt lesson now.',
                          )
                        : tt(
                            'labels.activationTrackBody.installFirst',
                            'Everything else can wait. Open the install lesson and get the command working.',
                          )}
                  </p>
                </div>
              </article>
            </section>

            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>{tt('labels.operatingRule', 'Operator rule')}</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'labels.operatorRuleBody',
                  'More choice this early is still prettier procrastination. Keep the chapter narrow until one local run and one proof artifact are both real.',
                )}
              </p>
              {firstRunDone ? (
                <div className="mt-4 grid gap-3">
                  {PICO_TRACKS.slice(1).map((track) => {
                    const localizedTrack = localizeTrack(track)
                    const selected = progress.selectedTrack === track.slug
                    const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
                    return (
                      <article key={track.slug} className={picoInset('grid gap-3 p-4')}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                              {localizedTrack.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                              {localizedTrack.intro}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => actions.pickTrack(track.slug)}
                            disabled={!unlocked}
                            className={picoClasses.tertiaryButton}
                          >
                            {selected
                              ? tt('labels.trackState.active', 'Active track')
                              : unlocked
                                ? tt('labels.trackState.set', 'Set as track')
                                : tt('labels.trackState.locked', 'Locked')}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr),22rem]">
        <section className={picoPanel('p-6 sm:p-7')}>
          <p className={picoClasses.label}>{tt('labels.hostedRuntimeEditor', 'Hosted runtime editor')}</p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
            {tt(
              'labels.hostedRuntimeEditorTitle',
              'Update the operator record without leaving the route',
            )}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            {tt(
              'labels.hostedRuntimeEditorBody',
              'This does not pretend to install anything from the browser. It stores the latest truthful runtime snapshot so the rest of Pico stops guessing.',
            )}
          </p>

          {session.status !== 'authenticated' ? (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>{tt('runtime.signInFirst', 'Sign in first. The runtime snapshot is per operator account.')}</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.runtimeLabel', 'Runtime label')}</span>
                  <input
                    value={runtimeDraft.label}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, label: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="OpenClaw"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.runtimeStatusField', 'Runtime status')}</span>
                  <select
                    value={runtimeDraft.status}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, status: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-[color:var(--pico-text)] outline-none"
                  >
                    {runtimeStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatRuntimeStatusOption(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.installMethod', 'Install method')}</span>
                  <select
                    value={runtimeDraft.installMethod}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, installMethod: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-[color:var(--pico-text)] outline-none"
                  >
                    {installMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {formatInstallMethodOption(method)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.gatewayUrl', 'Gateway URL')}</span>
                  <input
                    value={runtimeDraft.gatewayUrl}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, gatewayUrl: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="http://127.0.0.1:4111"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.assistantName', 'Assistant name')}</span>
                  <input
                    value={runtimeDraft.assistantName}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, assistantName: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="Pico Starter"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>{tt('labels.workspaceField', 'Workspace')}</span>
                  <input
                    value={runtimeDraft.workspace}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, workspace: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="founder-lab"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                <span className={picoClasses.label}>{tt('labels.modelField', 'Model')}</span>
                <input
                  value={runtimeDraft.model}
                  onChange={(event) =>
                    setRuntimeDraft((current) => ({ ...current, model: event.target.value }))
                  }
                  className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  placeholder="gpt-5.4-mini"
                />
              </label>

              <div className={picoSoft('p-4')}>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => void saveRuntimeSnapshot()}
                    className={picoClasses.primaryButton}
                    disabled={setup.pendingAction !== null || !runtimeDraftDirty}
                  >
                    {setup.pendingAction === 'runtime'
                      ? tt('labels.savingSnapshot', 'Saving snapshot...')
                      : tt('labels.saveSnapshot', 'Save runtime snapshot')}
                  </button>
                  <Link href={toHref('/academy/install-hermes-locally')} className={picoClasses.secondaryButton}>
                    {tt('labels.openInstallLesson', 'Open install lesson')}
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'labels.saveOnlyTruth',
                    'Save only what is true on the operator host right now: gateway URL, runtime health, and the bound assistant.',
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>{tt('labels.currentBindingTitle', 'Current binding')}</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('labels.assistant', 'Assistant')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.assistant_name ?? currentBinding?.assistant_id ?? notRecordedLabel}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('labels.workspace', 'Workspace')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.workspace ?? setup.onboarding?.workspace ?? notRecordedLabel}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{tt('labels.model', 'Model')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.model ?? notRecordedLabel}
                </p>
              </div>
            </div>
          </section>

          {session.status === 'authenticated' && setup.onboarding ? (
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>{tt('labels.hostedActions', 'Hosted actions')}</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => void setup.completeCurrentStep()}
                  className={picoClasses.primaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  {setup.pendingAction === 'complete_step'
                    ? tt('labels.updateStep', 'Updating step...')
                    : tt('labels.completeStep', 'Mark current step complete')}
                </button>
                <button
                  type="button"
                  onClick={() => void setup.dismissChecklist()}
                  className={picoClasses.secondaryButton}
                  disabled={setup.pendingAction !== null || setup.onboarding.checklist_dismissed}
                >
                  {setup.onboarding.checklist_dismissed
                    ? tt('labels.checklistDismissed', 'Checklist dismissed')
                    : tt('labels.dismissChecklist', 'Dismiss checklist')}
                </button>
                <button
                  type="button"
                  onClick={() => void setup.completeAll()}
                  className={picoClasses.tertiaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  {tt('labels.completeWizard', 'Complete wizard')}
                </button>
                <button
                  type="button"
                  onClick={() => void setup.resetWizard()}
                  className={picoClasses.tertiaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  {tt('labels.resetWizard', 'Reset wizard')}
                </button>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </PicoShell>
  )
}
