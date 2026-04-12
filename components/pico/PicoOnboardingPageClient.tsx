'use client'

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
import { usePicoHref } from '@/lib/pico/navigation'

const activationChecklist = [
  {
    chapter: '01',
    title: 'Install Hermes',
    body: 'Make sure the command opens from a fresh shell. Nothing else matters until that is real.',
  },
  {
    chapter: '02',
    title: 'Run one tiny prompt',
    body: 'Pick the smallest prompt with an obvious answer so success cannot hide inside ambiguity.',
  },
  {
    chapter: '03',
    title: 'Keep proof',
    body: 'Save the output. The first win should become a reusable artifact, not a feeling.',
  },
] as const

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
  const { progress, derived, actions } = usePicoProgress()
  const session = usePicoSession()
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

  const hostedCompletionRatio = useMemo(() => {
    if (!setup.onboarding || setup.onboarding.steps.length === 0) {
      return 0
    }

    const completedCount = setup.onboarding.steps.filter((step) => step.completed).length
    return Math.round((completedCount / setup.onboarding.steps.length) * 100)
  }, [setup.onboarding])

  const currentBinding = setup.runtime?.current_binding ?? setup.runtime?.bindings[0] ?? null

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
      railCollapsed={progress.platform.railCollapsed}
      helpLaneOpen={progress.platform.helpLaneOpen}
      onToggleRail={() =>
        actions.setPlatform({ railCollapsed: !progress.platform.railCollapsed })
      }
      onToggleHelpLane={() =>
        actions.setPlatform({ helpLaneOpen: !progress.platform.helpLaneOpen })
      }
      actions={
        <div className="flex flex-wrap gap-3">
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
          {!installDone ? (
            <Link
              href={toHref(`/academy/${firstRunLessonSlug}`)}
              className={picoClasses.secondaryButton}
            >
              Already installed? Go to first prompt
            </Link>
          ) : null}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <div className={picoPanel('overflow-hidden p-0')}>
          <div className="grid gap-0 border-b border-[#3a291d] lg:grid-cols-[minmax(0,1fr),18rem]">
            <div className="p-6 sm:p-7">
              <p className={picoClasses.label}>Opening sequence</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6] sm:text-5xl">
                Make one command work and keep the proof
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d5c0a8] sm:text-base">
                This first chapter should narrow the world fast: install Hermes, run one tiny prompt, and hold on to the output so the first win becomes something real.
              </p>

              <div className={joinClasses(picoEmber('mt-6 p-5 text-sm leading-7'), 'sm:p-6')}>
                <p className="font-medium text-[#fff5e8]">Fastest path to value</p>
                <p className="mt-2">
                  {firstRunDone
                    ? 'You already cleared the first win. Do not linger here. Open the next lesson and keep the sequence moving.'
                    : installDone
                      ? 'Good. The install is done. Now run one tiny prompt and get the first visible answer.'
                      : 'Do not compare providers, frameworks, or stacks yet. Install Hermes and make the command work first.'}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {activationChecklist.map((item) => (
                  <article key={item.title} className={picoInset('grid gap-3 p-5')}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#6e4d31] bg-[rgba(226,144,79,0.12)] text-xs font-semibold uppercase tracking-[0.18em] text-[#f0bb83]">
                        {item.chapter}
                      </span>
                      <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                        {item.title}
                      </h3>
                    </div>
                    <p className={picoClasses.body}>{item.body}</p>
                  </article>
                ))}
              </div>

              <div className={picoInset('mt-6 grid gap-4 p-5 lg:grid-cols-3')}>
                <div>
                  <p className={picoClasses.label}>Track locked</p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                    {activeTrack.title}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>Next move</p>
                  <p className="mt-2 text-lg font-medium text-[#fff4e6]">
                    {derived.nextLesson?.title ?? 'none'}
                  </p>
                </div>
                <div>
                  <p className={picoClasses.label}>Visible success</p>
                  <p className="mt-2 text-lg font-medium text-[#fff4e6]">
                    {firstRunWorkspace.workspace.evidence.trim() || firstRunDone
                      ? 'recorded'
                      : installDone
                        ? 'one prompt away'
                        : 'install first'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#3a291d] bg-[rgba(255,247,235,0.03)] p-6 lg:border-l lg:border-t-0">
              <p className={picoClasses.label}>Launch ledger</p>
              <div className="mt-4 grid gap-3">
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Completed lessons</p>
                  <p className="mt-1 text-2xl font-semibold text-[#fff4e6]">
                    {derived.completedLessonCount}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Hosted sync</p>
                  <p className="mt-1 text-2xl font-semibold text-[#fff4e6]">
                    {session.status === 'authenticated' ? `${hostedCompletionRatio}%` : 'sign in'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Runtime status</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.runtime?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Workspace</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
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
                <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                  More choice this early is just prettier procrastination. Get the first win, then widen the surface.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>First win definition</p>
            <div className="mt-4 grid gap-3">
              <div className={picoInset('p-4')}>
                <p className="font-medium text-[#fff4e6]">1. Command opens</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Hermes runs from a fresh shell without hand-waving or invisible environment fixes.
                </p>
              </div>
              <div className={picoInset('p-4')}>
                <p className="font-medium text-[#fff4e6]">2. Prompt returns</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  One tiny prompt produces an obvious answer you can inspect in seconds.
                </p>
              </div>
              <div className={picoInset('p-4')}>
                <p className="font-medium text-[#fff4e6]">3. Proof survives</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  The output becomes an artifact you can reuse, not a vague memory of success.
                </p>
              </div>
            </div>
          </section>

          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>Current pressure</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Install</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">{installDone ? 'done' : 'pending'}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">First prompt</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {firstRunWorkspace.workspace.evidence.trim() || firstRunDone ? 'proof captured' : 'pending'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-onboarding-mission-board">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Mission board</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6] sm:text-4xl">
              Keep the first two missions visibly grounded
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d5c0a8]">
              Onboarding should know where the operator left off. These mission cards mirror the lesson workspace so the first win survives route changes instead of dissolving into memory.
            </p>
          </div>
          <span className={picoClasses.chip}>workspace continuity</span>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <article className={picoInset('grid gap-4 p-5')} data-testid="pico-onboarding-install-mission">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={picoClasses.label}>Mission 01</p>
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  Install Hermes
                </h3>
              </div>
              <span className={picoClasses.chip}>
                {installWorkspace.completedStepCount}/{installLesson?.steps.length ?? 0} steps
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-[#1b120d]">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#e2904f,#ffd0a4)]"
                style={{ width: `${installWorkspace.progressPercent}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Focused step</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">{installFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Proof state</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {installWorkspace.workspace.evidence.trim() ? 'captured' : installDone ? 'completed' : 'missing'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
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
                <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  Run one bounded prompt
                </h3>
              </div>
              <span className={picoClasses.chip}>
                {firstRunWorkspace.completedStepCount}/{firstRunLesson?.steps.length ?? 0} steps
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-[#1b120d]">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#e2904f,#ffd0a4)]"
                style={{ width: `${firstRunWorkspace.progressPercent}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Focused step</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">{firstRunFocusedStep}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Proof state</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {firstRunWorkspace.workspace.evidence.trim() ? 'captured' : firstRunDone ? 'completed' : 'missing'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <section className={picoPanel('p-6 sm:p-7')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Hosted setup state</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6] sm:text-4xl">
                Real onboarding sync
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d5c0a8]">
                This is the hosted operator record for this Pico account: wizard progress, provider selection, and the latest runtime snapshot.
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

          {session.status !== 'authenticated' ? (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>
                Sign in on the Pico host to attach the hosted onboarding wizard and the last synced runtime snapshot to this page.
              </p>
            </div>
          ) : setup.loading ? (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>Loading backend onboarding and runtime state.</p>
            </div>
          ) : setup.error ? (
            <div className={picoEmber('mt-5 p-5')}>
              <p className={picoClasses.body}>{setup.error}</p>
            </div>
          ) : setup.onboarding ? (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {(setup.onboarding.providers ?? []).map((provider) => {
                  const active = provider.id === setup.onboarding?.provider
                  return (
                    <article
                      key={provider.id}
                      className={joinClasses(
                        picoInset('grid gap-2 p-4'),
                        active && 'border-[#7d5232] bg-[rgba(226,144,79,0.09)]',
                        !provider.enabled && 'opacity-70',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{provider.cue ?? '•'}</span>
                          <div>
                            <p className="font-medium text-[#fff4e6]">{provider.label}</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-[#a8896e]">
                              {active ? 'current provider' : provider.enabled ? 'available soon' : 'locked'}
                            </p>
                          </div>
                        </div>
                        <span className={picoClasses.chip}>{provider.enabled ? 'ready' : 'later'}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#d5c0a8]">{provider.summary}</p>
                    </article>
                  )
                })}
              </div>

              <div className={picoInset('grid gap-4 p-5')}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={picoClasses.label}>Wizard state</p>
                    <h3 className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                      {hostedCompletionRatio}% complete
                    </h3>
                  </div>
                  <span className={picoClasses.chip}>{setup.onboarding.status}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#1b120d]">
                  <div
                    className="h-full rounded-full bg-[#e2904f] transition-[width] duration-300"
                    style={{ width: `${hostedCompletionRatio}%` }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[#a8896e]">Current step</p>
                    <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                      {setup.onboarding.current_step}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#a8896e]">Checklist</p>
                    <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                      {setup.onboarding.checklist_dismissed ? 'dismissed' : 'visible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#a8896e]">Assistant</p>
                    <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                      {setup.onboarding.assistant_name ?? 'not recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#a8896e]">Workspace</p>
                    <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                      {setup.onboarding.workspace ?? 'not recorded'}
                    </p>
                  </div>
                </div>

                {setup.onboarding.last_error ? (
                  <p className="text-sm leading-6 text-[#f0bb83]">{setup.onboarding.last_error}</p>
                ) : null}

                <div className="grid gap-3">
                  {setup.onboarding.steps.map((step) => {
                    const active = step.id === setup.onboarding?.current_step
                    const failed = step.id === setup.onboarding?.failed_step
                    return (
                      <div
                        key={step.id}
                        className={joinClasses(
                          picoInset('flex items-center justify-between gap-4 px-4 py-3'),
                          active && 'border-[#7d5232] bg-[rgba(226,144,79,0.08)]',
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-[#fff4e6]">{step.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#a8896e]">
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

                <div className={picoSoft('p-4')}>
                  <div className="flex flex-wrap gap-3">
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
                  <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                    This block is backed by the hosted onboarding/runtime APIs, not just local lesson progress.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>No hosted onboarding state has been recorded yet.</p>
            </div>
          )}
        </section>

        <section className={picoPanel('p-6 sm:p-7')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Runtime snapshot</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6] sm:text-4xl">
                Last synced operator host
              </h2>
            </div>
            {setup.runtime ? <span className={picoClasses.chip}>{setup.runtime.status}</span> : null}
          </div>

          {session.status !== 'authenticated' ? (
            <div className={picoSoft('mt-4 p-5')}>
              <p className={picoClasses.body}>
                Sign in to view the runtime snapshot tied to this Pico operator.
              </p>
            </div>
          ) : setup.runtime ? (
            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Gateway</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.runtime.gateway_url ?? 'not recorded'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Install method</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.runtime.install_method ?? 'not recorded'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Last seen</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {formatTimestamp(setup.runtime.last_seen_at)}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Bindings</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.runtime.binding_count}
                  </p>
                </div>
              </div>

              <div className={picoEmber('p-5')}>
                <p className={picoClasses.label}>Gateway health</p>
                <p className="mt-2 text-lg text-[#fff4e6]">
                  {setup.runtime.gateway?.status ?? 'unknown'}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#f0deca]">
                  {typeof setup.runtime.gateway?.doctor_summary === 'string'
                    ? setup.runtime.gateway.doctor_summary
                    : 'No doctor summary was synced yet.'}
                </p>
              </div>

              <div className="grid gap-3">
                {(setup.runtime.bindings.length ? setup.runtime.bindings : [null]).map((binding, index) =>
                  binding ? (
                    <article key={`${binding.assistant_name ?? 'binding'}-${index}`} className={picoInset('grid gap-2 p-4')}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-[#fff4e6]">
                          {binding.assistant_name ?? binding.assistant_id ?? 'Unnamed binding'}
                        </p>
                        <span className={picoClasses.chip}>{binding.model ?? 'model pending'}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#d5c0a8]">
                        Workspace: {binding.workspace ?? 'not recorded'}
                      </p>
                    </article>
                  ) : (
                    <div key="binding-empty" className={picoSoft('p-4')}>
                      <p className={picoClasses.body}>No assistant binding has been synced yet.</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className={picoSoft('mt-4 p-5')}>
              <p className={picoClasses.body}>No runtime snapshot has been synced yet.</p>
            </div>
          )}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr),minmax(0,0.98fr)]">
        <section className={picoPanel('p-6 sm:p-7')}>
          <p className={picoClasses.label}>Hosted runtime editor</p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6] sm:text-4xl">
            Update the operator snapshot
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d5c0a8]">
            This does not pretend to install anything from the browser. It stores the latest truthful runtime snapshot for the Pico account so the product surfaces stay coherent.
          </p>

          {session.status !== 'authenticated' ? (
            <div className={picoSoft('mt-5 p-5')}>
              <p className={picoClasses.body}>Sign in first. The runtime snapshot is per operator account.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Runtime label</span>
                  <input
                    value={runtimeDraft.label}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, label: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-3 text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                    placeholder="OpenClaw"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Runtime status</span>
                  <select
                    value={runtimeDraft.status}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, status: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[#120d0a] px-4 py-3 text-[#fff4e6] outline-none"
                  >
                    {runtimeStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Install method</span>
                  <select
                    value={runtimeDraft.installMethod}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, installMethod: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[#120d0a] px-4 py-3 text-[#fff4e6] outline-none"
                  >
                    {installMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Gateway URL</span>
                  <input
                    value={runtimeDraft.gatewayUrl}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, gatewayUrl: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-3 text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                    placeholder="http://127.0.0.1:4111"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Assistant name</span>
                  <input
                    value={runtimeDraft.assistantName}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, assistantName: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-3 text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                    placeholder="Pico Starter"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[#d5c0a8]">
                  <span className={picoClasses.label}>Workspace</span>
                  <input
                    value={runtimeDraft.workspace}
                    onChange={(event) =>
                      setRuntimeDraft((current) => ({ ...current, workspace: event.target.value }))
                    }
                    className="rounded-[20px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-3 text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                    placeholder="founder-lab"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[#d5c0a8]">
                <span className={picoClasses.label}>Model</span>
                <input
                  value={runtimeDraft.model}
                  onChange={(event) =>
                    setRuntimeDraft((current) => ({ ...current, model: event.target.value }))
                  }
                  className="rounded-[20px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-3 text-[#fff4e6] outline-none placeholder:text-[#8f7157]"
                  placeholder="gpt-5.4-mini"
                />
              </label>

              <div className={picoSoft('p-4')}>
                <div className="flex flex-wrap gap-3">
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
                <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                  Save only what is true on the operator host right now: gateway URL, runtime health, and the bound assistant.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={picoPanel('p-6 sm:p-7')}>
          <p className={picoClasses.label}>Activation track</p>
          <article className={picoInset('mt-4 grid gap-4 p-5')}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={picoClasses.chip}>Do this first</span>
                <span className={picoClasses.chip}>Outcome-driven</span>
              </div>
              <h2 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                {firstTrack.title}
              </h2>
              <p className={picoClasses.body}>{firstTrack.intro}</p>
              <p className="text-sm text-[#f0bb83]">Outcome: {firstTrack.outcome}</p>
            </div>
            <div className="grid gap-3">
              {firstTrack.checklist.map((item) => (
                <div key={item} className={picoInset('px-4 py-3 text-sm text-[#d8c1a6]')}>
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

          {firstRunDone ? (
            <div className="mt-6 grid gap-4">
              <p className={picoClasses.label}>Unlocked next</p>
              {PICO_TRACKS.slice(1).map((track) => {
                const selected = progress.selectedTrack === track.slug
                const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
                return (
                  <article key={track.slug} className={picoInset('grid gap-4 p-5')}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                          {track.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">{track.intro}</p>
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
          ) : (
            <div className={picoSoft('mt-6 p-5')}>
              <p className={picoClasses.body}>
                Ignore the later tracks until the first local run works. More choices this early are just prettier procrastination.
              </p>
            </div>
          )}
        </section>
      </section>
    </PicoShell>
  )
}
