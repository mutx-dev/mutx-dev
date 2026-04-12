'use client'

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
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

const escalationChecklist = [
  'Say which lesson or Autopilot section you were using.',
  'Paste the exact command, error, or approval problem.',
  'Say the last thing that actually worked.',
] as const

const supportLanes = [
  {
    id: 'fixing-existing',
    title: 'Runtime or lesson blocker',
    body: 'Use this when the product path stopped on a real command, lesson, or hosted state mismatch.',
  },
  {
    id: 'other',
    title: 'Office hours or deeper walkthrough',
    body: 'Use this when the problem is bigger than one blocker and you need a guided operator session.',
  },
] as const

export function PicoSupportPageClient() {
  const pathname = usePathname()
  const session = usePicoSession()
  const setup = usePicoSetupState(session.status === 'authenticated')
  const { actions, progress, derived } = usePicoProgress()
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const [copied, setCopied] = useState(false)
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
      />
      <PicoShell
        eyebrow="Human help"
        title="Get a human when the product path stops being enough"
        description="This route should triage the messy edge fast. Keep the escalation clean, attach the runtime truth, and send the operator back into motion."
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
            <button
              type="button"
              onClick={() => openEscalation('fixing-existing')}
              className={picoClasses.primaryButton}
            >
              Get human help
            </button>
            <button
              type="button"
              onClick={() => openEscalation('other')}
              className={picoClasses.secondaryButton}
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
          <div className={picoPanel('overflow-hidden p-0')}>
            <div className="grid gap-0 border-b border-[#3a291d] lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className="p-6 sm:p-7">
                <p className={picoClasses.label}>Escalation board</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6] sm:text-5xl">
                  Send context, not panic
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d5c0a8] sm:text-base">
                  Human help is for the part the product cannot truthfully close on its own. The faster you frame the blocker, the faster support can send you back to the product path.
                </p>

                <div className={picoEmber('mt-6 p-5')}>
                  <p className="font-medium text-[#fff4e6]">
                    If the next move is still obvious, go back and do it.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#f0deca]">
                    Support exists for the messy edge, not for skipping the lesson, the tutor, or the live control surface.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {escalationChecklist.map((item, index) => (
                    <div key={item} className={picoInset('p-5')}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8896e]">
                        Step {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {supportLanes.map((lane) => (
                    <article key={lane.id} className={picoInset('grid gap-4 p-5')}>
                      <div>
                        <h3 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                          {lane.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">{lane.body}</p>
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

              <div className="border-t border-[#3a291d] bg-[rgba(255,247,235,0.03)] p-6 lg:border-l lg:border-t-0">
                <p className={picoClasses.label}>Operator rail</p>
                <div className="mt-4 grid gap-3">
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[#a8896e]">Support requests</p>
                    <p className="mt-1 text-2xl font-semibold text-[#fff4e6]">{progress.supportRequests}</p>
                  </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Tutor questions</p>
                  <p className="mt-1 text-2xl font-semibold text-[#fff4e6]">{progress.tutorQuestions}</p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Plan</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {session.status === 'authenticated' ? session.user.plan ?? 'unknown' : 'sign in'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[#a8896e]">Active surface</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
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
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                    Operator packet
                  </h2>
                </div>
                <span className={picoClasses.chip}>live context</span>
              </div>

              <div className={picoSoft('mt-4 p-5')}>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[#d5c0a8]">
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
                  <p className="text-sm text-[#a8896e]">Hosted onboarding</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.onboarding?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Runtime status</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {setup.runtime?.status ?? 'not attached'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Current track</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {progress.selectedTrack ?? 'not chosen yet'}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[#a8896e]">Next lesson</p>
                  <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                    {derived.nextLesson?.title ?? 'none'}
                  </p>
                </div>
                {recoveryLesson ? (
                  <>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[#a8896e]">Lesson workspace</p>
                      <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                        {recoveryWorkspace.completedStepCount}/{recoveryLesson.steps.length}
                      </p>
                    </div>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[#a8896e]">Focused step</p>
                      <p className="mt-1 text-lg font-medium text-[#fff4e6]">{recoveryFocusedStep}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
          <div className={picoPanel('p-6 sm:p-7')}>
            <p className={picoClasses.label}>What happens here</p>
            <div className="mt-4 grid gap-4">
              <div className={picoInset('p-5')}>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  1. Send one clear problem
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Do not send a life story. Send the blocker.
                </p>
              </div>
              <div className={picoInset('p-5')}>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  2. We reply with the next move
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  The goal is to unblock the product path, not create a support maze.
                </p>
              </div>
              <div className={picoInset('p-5')}>
                <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  3. You go back to the product
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Human help exists to restore momentum, not replace the product.
                </p>
              </div>
            </div>
          </div>

          <div className={picoPanel('p-6 sm:p-7')}>
            <p className={picoClasses.label}>Support model</p>
            <div className="mt-4 grid gap-4">
              <div className={picoSoft('p-5')}>
                <p className="font-medium text-[#fff4e6]">Tutor first</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Use tutor when the next step is probably still in the lesson corpus and you want a grounded answer fast.
                </p>
              </div>
              <div className={picoSoft('p-5')}>
                <p className="font-medium text-[#fff4e6]">Human help second</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Escalate when runtime truth, approvals, security, or account state turns the situation messy.
                </p>
              </div>
              <div className={picoSoft('p-5')}>
                <p className="font-medium text-[#fff4e6]">One lane back into the product</p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  The answer should return you to the lesson or Autopilot surface with a clearer next move than before.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={picoPanel('p-6 sm:p-7')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Return routes</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                Support should send you back into the product
              </h2>
            </div>
            <span className={picoClasses.chip}>operator return map</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className={picoInset('grid gap-4 p-5')}>
              <div>
                <p className={picoClasses.label}>Lesson path</p>
                <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  Resume the academy lane
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
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
                <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  Ask tutor first if the next move is still knowable
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                  Go back here when the product still likely knows the answer but you need the exact next step.
                </p>
              </div>
              <Link href={toHref('/tutor')} className={picoClasses.tertiaryButton}>
                Open tutor
              </Link>
            </article>

            <article className={picoInset('grid gap-4 p-5')}>
              <div>
                <p className={picoClasses.label}>Runtime truth</p>
                <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                  Re-enter the control room
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                  Use Autopilot when the blocker depends on live runs, budget, approvals, or alert state.
                </p>
              </div>
              <Link href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                Open Autopilot
              </Link>
            </article>
          </div>
        </section>
      </PicoShell>
    </>
  )
}
