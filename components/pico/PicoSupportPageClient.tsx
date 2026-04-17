'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { PicoContactForm } from '@/components/pico/PicoContactForm'
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
import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'
import { usePicoHref } from '@/lib/pico/navigation'
import { picoRobotArtById } from '@/lib/picoRobotArt'
import { cn } from '@/lib/utils'

const supportLanes = PICO_GENERATED_CONTENT.support.lanes

const escalationStandards = PICO_GENERATED_CONTENT.support.escalationStandards

const supportInterestOptions = [
  { value: 'fixing-existing', label: 'Lesson or command blocker' },
  { value: 'runtime-truth', label: 'Live runtime or Autopilot mismatch' },
  { value: 'hosted-session', label: 'Hosted session or account mismatch' },
  { value: 'billing-or-plan', label: 'Billing, approvals, or plan question' },
  { value: 'other', label: 'Office hours or deeper walkthrough' },
] as const

const supportContactCopy = {
  title: 'Tell us where the product path broke',
  subtitle: 'Share the route, blocker, and proof. We will answer like humans, not a waitlist.',
  interestLabel: 'What broke?',
  messageLabel: 'What happened?',
  messageOptional: '(include the packet)',
  messagePlaceholder: 'Paste the exact blocker, route, command, or runtime mismatch.',
  submit: 'Send support request',
  submitting: 'Sending support request...',
  disclaimer: 'No waitlist. No launch theater. Just a human reply.',
  successTitle: 'Support request sent.',
  successBody: 'We got the packet. Expect a human reply that points you back into the product.',
  successBack: 'Back to support',
} as const

export function PicoSupportPageClient() {
  const pathname = usePathname()
  const session = usePicoSession()
  const setup = usePicoSetupState(session.status === 'authenticated')
  const { actions, progress, derived } = usePicoProgress(session.status === 'authenticated')
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const [copied, setCopied] = useState(false)
  const supportRobot = picoRobotArtById.coffee
  const recoveryLesson = derived.nextLesson
  const recoveryWorkspace = usePicoLessonWorkspace(recoveryLesson?.slug ?? 'support', recoveryLesson?.steps.length ?? 0, {
    progress,
    persistRemote: recoveryLesson
      ? (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace)
      : undefined,
  })
  const recoveryFocusedStep =
    recoveryLesson && recoveryWorkspace.workspace.activeStepIndex >= 0
      ? recoveryLesson.steps[recoveryWorkspace.workspace.activeStepIndex]?.title ?? 'not set'
      : 'not set'
  const runtimeSignal =
    session.status !== 'authenticated'
      ? 'local only'
      : setup.loading
        ? 'checking'
        : setup.runtime?.status ?? 'not attached'
  const packetState = copied
    ? 'copied'
    : recoveryWorkspace.workspace.evidence.trim()
      ? 'proof attached'
      : session.status === 'authenticated'
        ? 'context ready'
        : 'needs proof'
  const returnRouteLabel = recoveryLesson?.title ?? 'academy'
  const packetPreview = [
    `Route ${pathname}`,
    `Runtime ${runtimeSignal}`,
    `Return ${returnRouteLabel}`,
    `Packet ${packetState}`,
  ].join('\n')

  useEffect(() => {
    if (progress.platform.activeSurface !== 'support') {
      actions.setPlatform({ activeSurface: 'support' })
    }
  }, [actions, progress.platform.activeSurface])

  const diagnosticPacket = useMemo(
    () =>
      [
        'Pico diagnostic packet',
        `Route: ${pathname}`,
        `Hosted session: ${session.status}`,
        `Hosted plan: ${session.status === 'authenticated' ? session.user.plan ?? 'unknown' : 'n/a'}`,
        `Selected track: ${progress.selectedTrack ?? 'none'}`,
        `Completed lessons: ${progress.completedLessons.length}`,
        `Next lesson: ${derived.nextLesson?.title ?? 'none'}`,
        `Recovery lesson workspace: ${recoveryWorkspace.completedStepCount}/${recoveryLesson?.steps.length ?? 0}`,
        `Recovery lesson focused step: ${recoveryFocusedStep}`,
        `Recovery lesson proof: ${recoveryWorkspace.workspace.evidence.trim() ? 'captured' : 'missing'}`,
        `Active surface: ${progress.platform.activeSurface ?? 'none'}`,
        `Last opened lesson: ${progress.platform.lastOpenedLessonSlug ?? 'none'}`,
        `Rail collapsed: ${progress.platform.railCollapsed ? 'yes' : 'no'}`,
        `Help lane open: ${progress.platform.helpLaneOpen ? 'yes' : 'no'}`,
        `Support requests sent: ${progress.supportRequests}`,
        `Tutor questions asked: ${progress.tutorQuestions}`,
        `Approval gate enabled: ${progress.autopilot.approvalGateEnabled ? 'yes' : 'no'}`,
        `Hosted onboarding status: ${setup.onboarding?.status ?? 'not available'}`,
        `Hosted onboarding step: ${setup.onboarding?.current_step ?? 'not available'}`,
        `Hosted workspace: ${setup.onboarding?.workspace ?? 'not available'}`,
        `Runtime status: ${setup.runtime?.status ?? 'not available'}`,
        `Gateway URL: ${setup.runtime?.gateway_url ?? 'not available'}`,
        `Runtime bindings: ${setup.runtime?.binding_count ?? 0}`,
      ].join('\n'),
    [
      derived.nextLesson?.title,
      pathname,
      progress.autopilot.approvalGateEnabled,
      progress.completedLessons.length,
      progress.selectedTrack,
      progress.supportRequests,
      progress.tutorQuestions,
      progress.platform.activeSurface,
      progress.platform.helpLaneOpen,
      progress.platform.lastOpenedLessonSlug,
      progress.platform.railCollapsed,
      recoveryFocusedStep,
      recoveryLesson?.steps.length,
      recoveryWorkspace.completedStepCount,
      recoveryWorkspace.workspace.evidence,
      session.status,
      setup.onboarding?.current_step,
      setup.onboarding?.status,
      setup.onboarding?.workspace,
      setup.runtime?.binding_count,
      setup.runtime?.gateway_url,
      setup.runtime?.status,
    ],
  )

  const defaultSupportMessage = `${diagnosticPacket}\n\nProblem:\n`

  function openEscalation(defaultInterest: string) {
    setInterest(defaultInterest)
    setFormOpen(true)
  }

  async function copyDiagnosticPacket() {
    try {
      await navigator.clipboard.writeText(diagnosticPacket)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={interest}
        defaultMessage={defaultSupportMessage}
        source={interest === 'other' ? 'pico-office-hours' : 'pico-support'}
        onSuccess={() => actions.recordSupportRequest()}
        copy={supportContactCopy}
        interestOptions={supportInterestOptions}
      />
      <PicoShell
        eyebrow="Human help"
        title="Get a human when the product path stops being enough"
        description="Triage the messy edge fast, attach the real signal, and get back to the next honest move without turning support into a maze."
        heroContent={
          <div
            className="relative overflow-hidden rounded-[28px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(135deg,rgba(var(--pico-accent-rgb),0.14),rgba(9,15,10,0.92)_36%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6"
            data-testid="pico-support-hero-signal"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%,transparent_72%,rgba(255,255,255,0.02))]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-[rgba(var(--pico-accent-rgb),0.14)] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(var(--pico-accent-rgb),0.1)] blur-3xl"
            />
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr),18rem]">
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={picoClasses.chip}>Escalation pulse</span>
                  <span className="inline-flex rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                    {formOpen ? 'desk open' : 'triage mode'}
                  </span>
                </div>
                <h2 className="font-[family:var(--font-site-display)] text-[clamp(1.9rem,4vw,2.9rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--pico-text)]">
                  Send the blocker with enough proof to fix it fast.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Name the route, attach the signal, and point to the return lane. That gives support enough context to answer without slowing the next move down.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>Packet state</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {packetState}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {copied ? 'ready to paste' : 'route and evidence first'}
                    </p>
                  </div>

                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>Runtime truth</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {runtimeSignal}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {setup.runtime?.gateway_url ? 'gateway attached' : 'attach the signal if it matters'}
                    </p>
                  </div>

                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>Return lane</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {returnRouteLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryFocusedStep}
                    </p>
                  </div>
                </div>

                <div className={picoInset('grid gap-3 p-4 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center')}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(var(--pico-accent-rgb),0.24)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.18),rgba(7,13,8,0.5))] shadow-[0_18px_40px_rgba(var(--pico-accent-rgb),0.12)]">
                    <span className="h-3 w-3 rounded-full bg-[color:var(--pico-accent-bright)] shadow-[0_0_18px_rgba(var(--pico-accent-rgb),0.5)]" />
                  </div>
                  <div className="min-w-0">
                    <p className={picoClasses.label}>Shortest clean handoff</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {recoveryLesson ? `Resume ${recoveryLesson.title}` : 'Route back into academy'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryLesson
                        ? `${recoveryWorkspace.completedStepCount}/${recoveryLesson.steps.length} steps clear`
                        : 'If the blocker is still fundamentally sequence-related, return there first.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={picoInset('grid gap-4 overflow-hidden border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[radial-gradient(circle_at_50%_20%,rgba(var(--pico-accent-rgb),0.16),rgba(6,11,7,0.94)_54%,rgba(3,5,3,0.98)_100%)] p-4')}>
                <div className="overflow-hidden rounded-[24px] border border-[rgba(var(--pico-accent-rgb),0.2)] bg-[linear-gradient(180deg,rgba(6,12,6,0.98),rgba(2,4,2,1))]">
                  <Image
                    src={supportRobot.src}
                    alt={supportRobot.alt}
                    width={320}
                    height={320}
                    className="h-auto w-full p-4"
                    sizes="(max-width: 1024px) 100vw, 18rem"
                  />
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>Packet preview</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    <code>{packetPreview}</code>
                  </pre>
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
            <button
              type="button"
              onClick={() => openEscalation('fixing-existing')}
              className={picoClasses.primaryButton}
            >
              Get human help
            </button>
            <button
              type="button"
              onClick={() => void copyDiagnosticPacket()}
              className={picoClasses.secondaryButton}
            >
              {copied ? 'Copied packet' : 'Copy packet'}
            </button>
            <button
              type="button"
              onClick={() => openEscalation('other')}
              className={picoClasses.tertiaryButton}
            >
              Request office hours
            </button>
          </div>
        }
      >
        <PicoSessionBanner session={session} nextPath={pathname} />
        <PicoSurfaceCompass
          title="Support only exists to return the operator to the product"
          body="Escalate cleanly, attach the packet, then go back to the surface that can move the work again. Academy is for sequence problems, tutor is for one knowable next step, and Autopilot is for live runtime truth."
          status={formOpen ? 'escalation open' : 'human help standby'}
          aside="Human help should resolve the messy edge, not replace the product. The best support interaction ends with a clearer route back into Pico."
          items={[
            {
              href: derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy'),
              label: derived.nextLesson ? `Resume ${derived.nextLesson.title}` : 'Return to academy',
              caption: 'Go back here when the blocker was still fundamentally a lesson sequence problem.',
              note: 'Sequence',
              tone: 'primary',
            },
            {
              href: toHref('/tutor'),
              label: 'Ask tutor first',
              caption: 'Use this when the product probably still knows the answer but you need the exact next move.',
              note: 'Knowable',
            },
            {
              href: toHref('/autopilot'),
              label: 'Re-enter Autopilot',
              caption: 'Open the control room when the blocker depends on live runs, budget, alerts, or approvals.',
              note: 'Runtime',
              tone: 'soft',
            },
          ]}
        />

        <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-support-escalation-standards">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={picoClasses.label}>Escalation standards</p>
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                    Hand off the problem like a sharp operator
                  </h2>
                </div>
                <span className={picoClasses.chip}>route • evidence • return</span>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {escalationStandards.map((item) => (
                  <article key={item.label} className={picoInset('flex h-full flex-col p-5')}>
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
                <p className={picoClasses.label}>Packet posture</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Strong support starts with a clean packet. The best escalation reads like an operator handoff, not a panic dump.
                </p>
              </div>
              <div className={picoInset('overflow-hidden p-0')}>
                <div className="border-b border-[color:var(--pico-border)] p-5">
                  <p className={picoClasses.label}>Desk tone</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Support should lower the temperature without slowing the route back into action.
                  </p>
                </div>
                <div className="flex items-center justify-center p-6">
                  <Image
                    src={supportRobot.src}
                    alt={supportRobot.alt}
                    width={220}
                    height={220}
                    className="h-auto w-full max-w-[11rem] object-contain drop-shadow-[0_12px_28px_rgba(164,255,92,0.18)]"
                    sizes="176px"
                  />
                </div>
              </div>
              <div className={picoInset('p-5')}>
                <p className={picoClasses.label}>Best first move</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Copy the packet, choose the right lane, and ask for the shortest route back into Academy, Tutor, or Autopilot.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
          <div className={picoPanel('overflow-hidden p-0')}>
            <div className="grid gap-0 border-b border-[color:var(--pico-border)] lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className="p-6 sm:p-7">
                <p className={picoClasses.label}>Support desk</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                  Send context, not noise
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                  Human help is for the part the product cannot truthfully close on its own. The faster you frame the blocker, the faster support can send you back to the product path.
                </p>

                <div className={picoEmber('mt-6 p-5')}>
                  <p className="font-medium text-[color:var(--pico-text)]">
                    If the next move is still obvious, go back and do it.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Support exists for the messy edge, not for skipping the lesson, the tutor, or the live control surface.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {supportLanes.map((lane) => (
                    <article key={lane.id} className={picoInset('grid gap-4 p-5')}>
                      <div>
                        <h3 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {lane.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{lane.body}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEscalation(lane.id)}
                        className={lane.id === 'fixing-existing' ? picoClasses.primaryButton : picoClasses.secondaryButton}
                      >
                        {lane.id === 'fixing-existing' ? 'Start escalation' : 'Book office hours'}
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
                <p className={picoClasses.label}>Operator rail</p>
                <div className="mt-4 grid gap-3">
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Support requests</p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{progress.supportRequests}</p>
                  </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Tutor questions</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{progress.tutorQuestions}</p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Plan</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {session.status === 'authenticated' ? session.user.plan ?? 'unknown' : 'sign in'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Active surface</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.platform.activeSurface ?? 'none'}
                  </p>
                </div>
              </div>

                <div className={picoInset('mt-4 p-4')}>
                  <p className={picoClasses.label}>Try these first</p>
                  <div className="mt-3 grid gap-2">
                    <Link href={toHref('/tutor')} className={picoClasses.secondaryButton}>
                      Try tutor first
                    </Link>
                    <Link
                      href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                      className={picoClasses.tertiaryButton}
                    >
                      {derived.nextLesson ? `Open ${derived.nextLesson.title}` : 'Return to academy'}
                    </Link>
                    <Link href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                      Open Autopilot
                    </Link>
                  </div>
                </div>

                <div className={picoInset('mt-4 p-4')}>
                  <p className={picoClasses.label}>Direct line</p>
                  <a href="mailto:hello@mutx.dev" className={cn(picoClasses.link, 'mt-3 inline-flex')}>
                    hello@mutx.dev
                  </a>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className={picoPanel('p-5')}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={picoClasses.label}>Diagnostic packet</p>
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    Operator packet
                  </h2>
                </div>
                <span className={picoClasses.chip}>live context</span>
              </div>

              <div className={picoSoft('mt-4 p-5')}>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  <code>{diagnosticPacket}</code>
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void copyDiagnosticPacket()}
                  className={picoClasses.secondaryButton}
                >
                  {copied ? 'Copied packet' : 'Copy packet'}
                </button>
                <button
                  type="button"
                  onClick={() => openEscalation('fixing-existing')}
                  className={picoClasses.primaryButton}
                >
                  Open form with packet
                </button>
              </div>
            </section>

            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>Live operator state</p>
              <div className="mt-4 grid gap-3">
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Hosted onboarding</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.onboarding?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Runtime status</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.runtime?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Current track</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.selectedTrack ?? 'not chosen yet'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Next lesson</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {derived.nextLesson?.title ?? 'none'}
                  </p>
                </div>
                {recoveryLesson ? (
                  <>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[color:var(--pico-text-muted)]">Lesson workspace</p>
                      <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                        {recoveryWorkspace.completedStepCount}/{recoveryLesson.steps.length}
                      </p>
                    </div>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[color:var(--pico-text-muted)]">Focused step</p>
                      <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{recoveryFocusedStep}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </aside>
        </section>

        <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-support-return-map">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Return map</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
                Human help should end in one cleaner route back into Pico
              </h2>
            </div>
            <span className={picoClasses.chip}>operator return map</span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)]">
            <div className="grid gap-4">
              <article className={picoInset('grid gap-4 p-5')}>
                <p className={picoClasses.label}>Support return model</p>
                <div className="grid gap-3">
                  <div className={picoSoft('p-4')}>
                    <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      1. Route the blocker fast
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Do not send a life story. Lead with the exact surface that broke.
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      2. Attach the evidence
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Send the command, runtime fact, or approval state that proves what failed.
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      3. Return to the product
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      The response should restore momentum, not create a support maze.
                    </p>
                  </div>
                </div>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>Packet anatomy</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    A premium escalation packet always reads in the same order: route, evidence, return lane.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className={picoSoft('p-4')}>
                    <p className="font-medium text-[color:var(--pico-text)]">Route first</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Name the exact surface that broke.
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="font-medium text-[color:var(--pico-text)]">Evidence second</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Attach the signal that proves the failure.
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="font-medium text-[color:var(--pico-text)]">Return third</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Ask for the cleanest way back into motion.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>Lesson path</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    Resume the academy lane
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Use this when the blocker was still fundamentally a lesson or setup sequence problem.
                  </p>
                </div>
                <Link
                  href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                  className={picoClasses.secondaryButton}
                >
                  {derived.nextLesson ? `Open ${derived.nextLesson.title}` : 'Return to academy'}
                </Link>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>Grounded answer</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    Ask tutor if the next move is still knowable
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Go back here when the product likely still knows the answer but you need the exact next step.
                  </p>
                </div>
                <Link href={toHref('/tutor')} className={picoClasses.tertiaryButton}>
                  Open tutor
                </Link>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>Runtime truth</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    Re-enter the control room
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Use Autopilot when the blocker depends on live runs, budget, approvals, or alert state.
                  </p>
                </div>
                <Link href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                  Open Autopilot
                </Link>
              </article>
            </div>
          </div>
        </section>
      </PicoShell>
    </>
  )
}
