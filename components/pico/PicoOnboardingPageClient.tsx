'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

function formatTimestamp(value?: string | null) {
  if (!value) return 'not recorded'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'not recorded'

  return parsed.toLocaleString('en-US', {
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
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const session = usePicoSession()
  const { progress, derived, actions } = usePicoProgress(session.status === 'authenticated')
  const setup = usePicoSetupState(session.status === 'authenticated')
  const toHref = usePicoHref()
  const [runtimeDraft, setRuntimeDraft] = useState<RuntimeDraft>({
    label: 'OpenClaw',
    status: 'healthy',
    installMethod: 'manual',
    gatewayUrl: '',
    assistantName: '',
    workspace: '',
    model: '',
  })

  const firstTrack = PICO_TRACKS[0]
  const installLessonSlug = 'install-hermes-locally'
  const firstRunLessonSlug = 'run-your-first-agent'
  const installLesson = getLessonBySlug(installLessonSlug)
  const firstRunLesson = getLessonBySlug(firstRunLessonSlug)
  const installDone = progress.completedLessons.includes(installLessonSlug)
  const firstRunDone = progress.completedLessons.includes(firstRunLessonSlug)
  const activeTrack = PICO_TRACKS.find((track) => track.slug === progress.selectedTrack) ?? firstTrack
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
      ? installLesson?.steps[installWorkspace.workspace.activeStepIndex]?.title ?? 'not set'
      : 'not set'
  const firstRunFocusedStep =
    firstRunWorkspace.workspace.activeStepIndex >= 0
      ? firstRunLesson?.steps[firstRunWorkspace.workspace.activeStepIndex]?.title ?? 'not set'
      : 'not set'
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
      label: '01 • Brief',
      title: 'Make the runtime open cleanly',
      body:
        installLesson?.objective ??
        'Install Hermes and get the command working from a fresh shell.',
    },
    {
      label: '02 • Deliverable',
      title: 'Produce one obvious proof artifact',
      body:
        firstRunLesson?.expectedResult ??
        'Save one prompt and one answer in a file you can reopen later.',
    },
    {
      label: '03 • Review line',
      title: 'Do not widen the surface early',
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
      ? 'local only'
      : setup.loading
        ? 'checking'
        : setup.runtime?.status ?? 'not attached'
  const nextMoveTitle = !installDone
    ? 'Install Hermes now'
    : !proofCaptured
      ? 'Run one bounded prompt'
      : !firstRunDone
        ? 'Seal the first win'
        : derived.nextLesson
          ? `Continue with ${derived.nextLesson.title}`
          : 'Open Autopilot'
  const activeFocusStep = !installDone ? installFocusedStep : firstRunFocusedStep
  const activeWorkspaceLabel =
    setup.onboarding?.workspace ?? currentBinding?.workspace ?? runtimeDraft.workspace ?? 'not recorded'
  const heroEyebrow = !proofCaptured
    ? 'Make the first proof impossible to miss.'
    : !firstRunDone
      ? 'Seal the proof while the route is still honest.'
      : 'First proof is real. Keep the lane moving.'
  const hostedSyncLabel = session.status === 'authenticated' ? `${hostedCompletionRatio}%` : 'local'
  const proofSignalLabel = proofCaptured ? (firstRunDone ? 'sealed' : 'captured') : 'missing'
  const runtimeSignalDetail =
    session.status !== 'authenticated'
      ? 'hosted sync offline'
      : setup.loading
        ? 'refreshing signal'
        : setup.runtime?.gateway_url
          ? 'gateway live'
          : 'gateway unbound'
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
      eyebrow="Onboarding"
      title="Get to your first working agent fast"
      description="Ignore everything except the first local win. Install Hermes, run one prompt, see a real answer, then keep moving."
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
                <span className={picoClasses.chip}>First-win pulse</span>
                <span className="inline-flex rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                  {activeTrack.title}
                </span>
              </div>
              <p className="font-[family:var(--font-site-display)] text-[clamp(1.9rem,4vw,2.9rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--pico-text)]">
                {heroEyebrow}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                This fold should read like a launch console, not a brochure.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>Chapter pulse</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {chapterPulsePercent}%
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {completedLessonStepCount}/{totalLessonStepCount} steps clear
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>Proof state</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {proofSignalLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {proofCaptured ? 'artifact logged' : 'artifact still missing'}
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>Runtime truth</p>
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
                  <p className={picoClasses.label}>Next irreversible move</p>
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
                <p className={picoClasses.label}>Proof</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{proofSignalLabel}</p>
              </motion.div>

              <motion.div
                className="absolute right-4 top-7 max-w-[8.5rem] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [8, -6, 8], x: [0, -4, 0] }}
                transition={slowFloatTransition}
              >
                <p className={picoClasses.label}>Runtime</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{runtimeSignal}</p>
              </motion.div>

              <motion.div
                className="absolute bottom-4 left-5 max-w-[9rem] rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0], x: [-2, 6, -2] }}
                transition={ambientDriftTransition}
              >
                <p className={picoClasses.label}>Focus</p>
                <p className="mt-1 text-sm font-medium text-[color:var(--pico-text)]">{activeFocusStep}</p>
              </motion.div>

              <motion.div
                className="absolute bottom-5 right-5 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,8,5,0.62)] px-3 py-2 backdrop-blur-md"
                animate={prefersReducedMotion ? undefined : { y: [6, -4, 6], x: [0, -6, 0] }}
                transition={slowFloatTransition}
              >
                <p className={picoClasses.label}>Sync</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">{hostedSyncLabel}</p>
              </motion.div>

              <div className="relative flex h-full items-center justify-center">
                <div className="w-full max-w-[11rem] rounded-[30px] border border-[rgba(var(--pico-accent-rgb),0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 text-center shadow-[0_22px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                  <p className={picoClasses.label}>Signal core</p>
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
                    {completedLessonStepCount}/{totalLessonStepCount} steps clear
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
              firstRunDone && !derived.nextLesson
                ? toHref('/autopilot')
                : toHref(`/academy/${activationLessonSlug}`)
            }
            className={picoClasses.primaryButton}
          >
            {!installDone
              ? 'Install Hermes now'
              : !firstRunDone
                ? 'Run your first agent'
                : derived.nextLesson
                  ? `Continue with ${derived.nextLesson.title}`
                  : 'Open Autopilot'}
          </Link>

        </div>
      }
    >
      <PicoSessionBanner session={session} nextPath={pathname} />
      <PicoSurfaceCompass
        title="Use the shortest route that keeps the product honest"
        body="Keep the first win narrow. Continue the lesson path when the sequence is clear, use tutor for one blocked command, open Autopilot only when live runtime state is the real question, and escalate last."
        status={
          firstRunDone
            ? 'first win cleared'
            : installDone
              ? 'install cleared'
              : 'cold start'
        }
        aside="This chapter exists to compress the world, not widen it. The first proof should happen before preferences, architecture debates, or tooling tours."
        items={[
          {
            href: toHref(`/academy/${activationLessonSlug}`),
            label: !installDone ? 'Open install lesson' : !firstRunDone ? 'Run first prompt' : 'Continue academy lane',
            caption: 'Stay on the primary sequence until one visible output is real.',
            note: 'Next move',
            tone: 'primary',
          },
          {
            href: toHref(`/tutor?lesson=${activationLessonSlug}`),
            label: 'Ask tutor about this step',
            caption: 'Use this when one concrete command or validation gate is blocking you.',
            note: 'Blocked',
          },
          {
            href: toHref('/autopilot'),
            label: 'Inspect live control room',
            caption: 'Switch here once runtime state, approvals, or spend become the bottleneck.',
            note: 'Runtime',
            tone: 'soft',
          },
          {
            href: toHref('/support'),
            label: 'Escalate to human help',
            caption: 'Only use this when the product path stopped being truthful enough to recover alone.',
            note: 'Messy edge',
          },
        ]}
      />

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-kickoff-doctrine">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Kickoff doctrine</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  Start like a sharp studio, not a hobby project
                </h2>
              </div>
              <span className={picoClasses.chip}>brief • deliverable • review</span>
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
              <p className={picoClasses.label}>Chapter posture</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                The premium version of onboarding is narrow on purpose. No browsing, no stack tourism, no decorative busywork before one real artifact exists.
              </p>
            </div>

            <div className={picoInset('overflow-hidden p-0')}>
              <div className="border-b border-[color:var(--pico-border)] p-5">
                <p className={picoClasses.label}>Guide marker</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  The operator should feel guided, not crowded. One clear mascot cue is enough while the first proof is still forming.
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
              <p className={picoClasses.label}>Track checklist</p>
              <div className="mt-4 grid gap-3">
                {activeTrack.checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-accent)]">
                      ok
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
              <p className={picoClasses.label}>Chapter 01 brief</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                Make one command work and keep the proof
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                This first chapter should narrow the world fast: install Hermes, run one tiny prompt, and hold on to the output so the first win becomes something real.
              </p>

              <div className={joinClasses(picoEmber('mt-6 p-5 text-sm leading-7'), 'sm:p-6')}>
                <p className="font-medium text-[color:var(--pico-text)]">Fastest path to value</p>
                <p className="mt-2">
                  {firstRunDone
                    ? 'You already cleared the first win. Do not linger here. Open the next lesson and keep the sequence moving.'
                    : installDone
                      ? 'Good. The install is done. Now run one tiny prompt and get the first visible answer.'
                      : 'Do not compare providers, frameworks, or stacks yet. Install Hermes and make the command work first.'}
                </p>
              </div>

              <div className={picoInset('mt-6 grid gap-4 p-5 lg:grid-cols-3')}>
                <div>
                  <p className={picoClasses.label}>Track locked</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {activeTrack.title}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>Next move</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {derived.nextLesson?.title ?? 'none'}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>Visible success</p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                    {firstRunWorkspace.workspace.evidence.trim() || firstRunDone
                      ? 'recorded'
                      : installDone
                        ? 'one prompt away'
                        : 'install first'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
              <p className={picoClasses.label}>Studio ledger</p>
              <div className="mt-4 grid gap-3">
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Completed lessons</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                    {derived.completedLessonCount}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Hosted sync</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                    {session.status === 'authenticated' ? `${hostedCompletionRatio}%` : 'sign in'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Runtime status</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.runtime?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Workspace</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.onboarding?.workspace ?? currentBinding?.workspace ?? 'not recorded'}
                  </p>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>Jump straight to</p>
                <div className="mt-3 grid gap-2">
                  <Link href={toHref(`/academy/${installLessonSlug}`)} className={picoClasses.secondaryButton}>
                    Install lesson
                  </Link>
                  <Link href={toHref(`/academy/${firstRunLessonSlug}`)} className={picoClasses.tertiaryButton}>
                    First prompt lesson
                  </Link>
                  <Link href={toHref('/tutor')} className={picoClasses.tertiaryButton}>
                    Ask tutor
                  </Link>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>Operating rule</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  More choice this early is just prettier procrastination. Get the first win, then widen the surface.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>Current pressure</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Install</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{installDone ? 'done' : 'pending'}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">First prompt</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {firstRunWorkspace.workspace.evidence.trim() || firstRunDone ? 'proof captured' : 'pending'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className={picoPanel('mt-6 p-6 sm:p-7')} data-testid="pico-onboarding-proof-protocol">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Proof protocol</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              Three visible moves to clear Chapter 01
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              The opening sequence should read like a clean launch ritual, not a pile of setup advice. These are the only moves that count before the surface earns the right to get wider.
            </p>
          </div>
          <span className={picoClasses.chip}>first win protocol</span>
        </div>

        <div className={storyRailClass}>
          {activationChecklist.map((item, index) => (
            <article key={item.title} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent)]">
                  {item.chapter}
                </span>
                <span className={picoClasses.label}>{index === 0 ? 'Do this now' : 'Visible move'}</span>
              </div>
              <h3 className="mt-6 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-stack-radar">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Live stack radar</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              The onboarding lane now knows what the tracked stacks are actually shipping
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              Pico starts with Hermes in the lesson flow, but the product now keeps the rest of the
              stack map visible instead of pretending there is only one runtime on earth.
            </p>
          </div>
          <Link href={toHref('/wip')} className={picoClasses.secondaryButton}>
            Open live ledger
          </Link>
        </div>

        <div className={storyRailClass}>
          {stackSpotlights.map((stack) => (
            <article key={stack.id} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className={picoClasses.label}>{stack.name}</span>
                <span className={picoClasses.chip}>{stack.latestSignal}</span>
              </div>
              <p className="mt-6 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {stack.whyNow}
              </p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                Keep this map in view while you execute the first lessons. Stack choice, launch
                posture, and remote-access decisions should stay explicit from day one.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-mission-board">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Mission board</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              Keep the first two missions visibly grounded
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              Onboarding should know where the operator left off. These mission cards mirror the lesson workspace so the first win survives route changes instead of dissolving into memory.
            </p>
          </div>
          <span className={picoClasses.chip}>workspace continuity</span>
        </div>

        <div className={missionRailClass}>
          <article className={picoInset('grid gap-4 p-5')} data-testid="pico-onboarding-install-mission">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={picoClasses.label}>Mission 01</p>
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  Install Hermes
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
                <p className="text-sm text-[color:var(--pico-text-muted)]">Focused step</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{installFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Proof state</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {installWorkspace.workspace.evidence.trim() ? 'captured' : installDone ? 'completed' : 'missing'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href={toHref(`/academy/${installLessonSlug}`)} className={picoClasses.secondaryButton}>
                Resume install mission
              </Link>
              <Link href={toHref(`/tutor?lesson=${installLessonSlug}`)} className={picoClasses.tertiaryButton}>
                Ask tutor
              </Link>
            </div>
          </article>

          <article className={picoInset('grid gap-4 p-5')} data-testid="pico-onboarding-first-run-mission">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={picoClasses.label}>Mission 02</p>
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  Run one bounded prompt
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
                <p className="text-sm text-[color:var(--pico-text-muted)]">Focused step</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{firstRunFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Proof state</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {firstRunWorkspace.workspace.evidence.trim() ? 'captured' : firstRunDone ? 'completed' : 'missing'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link href={toHref(`/academy/${firstRunLessonSlug}`)} className={picoClasses.secondaryButton}>
                Resume prompt mission
              </Link>
              <Link href={toHref(`/tutor?lesson=${firstRunLessonSlug}`)} className={picoClasses.tertiaryButton}>
                Ask tutor
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-operator-record">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Operator record</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              Keep hosted kickoff and runtime truth in one place
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              This is the single operator record for Chapter 01: hosted onboarding state, runtime state, and the next activation move. The page should stop feeling like three tools pretending not to know about each other.
            </p>
          </div>
          {session.status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => void setup.refresh()}
              className={picoClasses.tertiaryButton}
            >
              Refresh sync
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
          <div className="grid gap-4">
            {session.status !== 'authenticated' ? (
              <div className={picoSoft('p-5')}>
                <p className={picoClasses.body}>
                  Sign in on the Pico host to attach the hosted onboarding wizard and the latest runtime snapshot to this page.
                </p>
              </div>
            ) : setup.loading ? (
              <div className={picoSoft('p-5')}>
                <p className={picoClasses.body}>Loading backend onboarding and runtime state.</p>
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
                                  {active ? 'current provider' : provider.enabled ? 'available soon' : 'locked'}
                                </p>
                              </div>
                            </div>
                            <span className={picoClasses.chip}>{provider.enabled ? 'ready' : 'later'}</span>
                          </div>
                          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{provider.summary}</p>
                        </article>
                      )
                    })}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Wizard progress</p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                      {setup.onboarding ? `${hostedCompletionRatio}%` : 'not started'}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Current step</p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {setup.onboarding?.current_step ?? 'not recorded'}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Runtime status</p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {setup.runtime?.status ?? 'not attached'}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Current binding</p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {currentBinding?.assistant_name ?? currentBinding?.assistant_id ?? 'none'}
                    </p>
                  </div>
                </div>

                {setup.onboarding ? (
                  <div className={picoInset('grid gap-4 p-5')}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className={picoClasses.label}>Hosted kickoff review</p>
                        <h3 className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {setup.onboarding.status}
                        </h3>
                      </div>
                      <span className={picoClasses.chip}>
                        {setup.onboarding.checklist_dismissed ? 'checklist dismissed' : 'checklist visible'}
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
                              {failed ? 'failed' : step.completed ? 'done' : active ? 'active' : 'pending'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={picoSoft('p-5')}>
                    <p className={picoClasses.body}>No hosted onboarding state has been recorded yet.</p>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),18rem]">
                  <div className={picoInset('p-5')}>
                    <p className={picoClasses.label}>Operator host snapshot</p>
                    {setup.runtime ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">Gateway</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.gateway_url ?? 'not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">Install method</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.install_method ?? 'not recorded'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">Last seen</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {formatTimestamp(setup.runtime.last_seen_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[color:var(--pico-text-muted)]">Bindings</p>
                          <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                            {setup.runtime.binding_count}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        No runtime snapshot has been synced yet.
                      </p>
                    )}
                  </div>

                  <div className={picoEmber('p-5')}>
                    <p className={picoClasses.label}>Gateway health</p>
                    <p className="mt-2 text-lg text-[color:var(--pico-text)]">
                      {setup.runtime?.gateway?.status ?? 'unknown'}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {typeof setup.runtime?.gateway?.doctor_summary === 'string'
                        ? setup.runtime.gateway.doctor_summary
                        : 'No doctor summary was synced yet.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>Activation track</p>
              <article className={picoInset('mt-4 grid gap-4 p-5')}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={picoClasses.chip}>Do this first</span>
                    <span className={picoClasses.chip}>Outcome-driven</span>
                  </div>
                  <h2 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {firstTrack.title}
                  </h2>
                  <p className={picoClasses.body}>{firstTrack.intro}</p>
                  <p className="text-sm text-[color:var(--pico-accent)]">Outcome: {firstTrack.outcome}</p>
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
                      ? 'You already got the first win. Use the main action above and keep the sequence moving.'
                      : installDone
                        ? 'Hermes is installed. Skip the overview and open the first prompt lesson now.'
                        : 'Everything else can wait. Open the install lesson and get the command working.'}
                  </p>
                </div>
              </article>
            </section>

            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>Operator rule</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                More choice this early is still prettier procrastination. Keep the chapter narrow until one local run and one proof artifact are both real.
              </p>
              {firstRunDone ? (
                <div className="mt-4 grid gap-3">
                  {PICO_TRACKS.slice(1).map((track) => {
                    const selected = progress.selectedTrack === track.slug
                    const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
                    return (
                      <article key={track.slug} className={picoInset('grid gap-3 p-4')}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                              {track.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{track.intro}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => actions.pickTrack(track.slug)}
                            disabled={!unlocked}
                            className={picoClasses.tertiaryButton}
                          >
                            {selected ? 'Active track' : unlocked ? 'Set as track' : 'Locked'}
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
          <p className={picoClasses.label}>Hosted runtime editor</p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
            Update the operator record without leaving the route
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            This does not pretend to install anything from the browser. It stores the latest truthful runtime snapshot so the rest of Pico stops guessing.
          </p>

          {session.status !== 'authenticated' ? (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>Sign in first. The runtime snapshot is per operator account.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>Runtime label</span>
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
                  <span className={picoClasses.label}>Runtime status</span>
                  <select
                    value={runtimeDraft.status}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, status: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-[color:var(--pico-text)] outline-none"
                  >
                    {runtimeStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>Install method</span>
                  <select
                    value={runtimeDraft.installMethod}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, installMethod: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-3 text-[color:var(--pico-text)] outline-none"
                  >
                    {installMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>Gateway URL</span>
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
                  <span className={picoClasses.label}>Assistant name</span>
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
                  <span className={picoClasses.label}>Workspace</span>
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
                <span className={picoClasses.label}>Model</span>
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
                    {setup.pendingAction === 'runtime' ? 'Saving snapshot...' : 'Save runtime snapshot'}
                  </button>
                  <Link href={toHref('/academy/install-hermes-locally')} className={picoClasses.secondaryButton}>
                    Open install lesson
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Save only what is true on the operator host right now: gateway URL, runtime health, and the bound assistant.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>Current binding</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Assistant</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.assistant_name ?? currentBinding?.assistant_id ?? 'not recorded'}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Workspace</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.workspace ?? setup.onboarding?.workspace ?? 'not recorded'}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Model</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {currentBinding?.model ?? 'not recorded'}
                </p>
              </div>
            </div>
          </section>

          {session.status === 'authenticated' && setup.onboarding ? (
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>Hosted actions</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => void setup.completeCurrentStep()}
                  className={picoClasses.primaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  {setup.pendingAction === 'complete_step' ? 'Updating step...' : 'Mark current step complete'}
                </button>
                <button
                  type="button"
                  onClick={() => void setup.dismissChecklist()}
                  className={picoClasses.secondaryButton}
                  disabled={setup.pendingAction !== null || setup.onboarding.checklist_dismissed}
                >
                  {setup.onboarding.checklist_dismissed ? 'Checklist dismissed' : 'Dismiss checklist'}
                </button>
                <button
                  type="button"
                  onClick={() => void setup.completeAll()}
                  className={picoClasses.tertiaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  Complete wizard
                </button>
                <button
                  type="button"
                  onClick={() => void setup.resetWizard()}
                  className={picoClasses.tertiaryButton}
                  disabled={setup.pendingAction !== null}
                >
                  Reset wizard
                </button>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </PicoShell>
  )
}
