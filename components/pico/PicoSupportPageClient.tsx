'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type AbstractIntlMessages, useMessages, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

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
import { picoRobotArtById } from '@/lib/picoRobotArt'
import { cn } from '@/lib/utils'

type SupportPageMessages = (typeof import('@/messages/fr.json'))['pico']['supportPage']
type PicoContentMessages = (typeof import('@/messages/fr.json'))['pico']['content']

function getSupportPageMessages(messages: AbstractIntlMessages) {
  const pico = (messages as {
    pico?: { supportPage?: SupportPageMessages; content?: PicoContentMessages }
  }).pico

  if (!pico?.supportPage) {
    throw new Error('Missing pico.supportPage messages')
  }

  return {
    supportPage: pico.supportPage,
    content: pico.content,
  }
}

export function PicoSupportPageClient() {
  const pathname = usePathname()
  const pageT = useTranslations('pico.supportPage')
  const { supportPage, content } = getSupportPageMessages(useMessages() as AbstractIntlMessages)
  const session = usePicoSession()
  const setup = usePicoSetupState(session.status === 'authenticated')
  const { actions, progress, derived } = usePicoProgress(session.status === 'authenticated')
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const [copied, setCopied] = useState(false)
  const supportRobot = picoRobotArtById.coffee
  const localizedLessons = (content?.lessons ?? {}) as Record<string, any>
  const localizedTracks = (content?.tracks ?? {}) as Record<string, any>
  const recoveryLesson = derived.nextLesson
  const recoveryWorkspace = usePicoLessonWorkspace(
    recoveryLesson?.slug ?? 'support',
    recoveryLesson?.steps.length ?? 0,
    {
      progress,
      persistRemote: recoveryLesson
        ? (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace)
        : undefined,
    },
  )
  const supportInterestOptions = [
    { value: 'fixing-existing', label: supportPage.contact.interest.lessonBlocker },
    { value: 'runtime-truth', label: supportPage.contact.interest.runtimeMismatch },
    { value: 'hosted-session', label: supportPage.contact.interest.sessionMismatch },
    { value: 'billing-or-plan', label: supportPage.contact.interest.billingPlan },
    { value: 'other', label: supportPage.contact.interest.officeHours },
  ] as const
  const supportContactCopy = {
    title: supportPage.contact.title,
    subtitle: supportPage.contact.subtitle,
    interestLabel: supportPage.contact.interestLabel,
    messageLabel: supportPage.contact.messageLabel,
    messageOptional: supportPage.contact.messageOptional,
    messagePlaceholder: supportPage.contact.messagePlaceholder,
    submit: supportPage.contact.submit,
    submitting: supportPage.contact.submitting,
    disclaimer: supportPage.contact.disclaimer,
    successTitle: supportPage.contact.successTitle,
    successBody: supportPage.contact.successBody,
    successBack: supportPage.contact.successBack,
  } as const
  const escalationStandards = supportPage.standards.cards
  const supportLanes = supportPage.desk.lanes
  const diagnosticLabels = supportPage.packet.diagnostic
  const diagnosticValues = diagnosticLabels.values
  const recoveryFocusedStep =
    recoveryLesson && recoveryWorkspace.workspace.activeStepIndex >= 0
      ? localizedLessons[recoveryLesson.slug]?.steps?.[recoveryWorkspace.workspace.activeStepIndex]
          ?.title ??
        recoveryLesson.steps[recoveryWorkspace.workspace.activeStepIndex]?.title ??
        pageT('shared.stepNotSet')
      : pageT('shared.stepNotSet')
  const runtimeSignal =
    session.status !== 'authenticated'
      ? pageT('shared.runtime.localOnly')
      : setup.loading
        ? pageT('shared.runtime.checking')
        : setup.runtime?.status ?? pageT('shared.runtime.notAttached')
  const packetState = copied
    ? pageT('shared.packetState.copied')
    : recoveryWorkspace.workspace.evidence.trim()
      ? pageT('shared.packetState.proofAttached')
      : session.status === 'authenticated'
        ? pageT('shared.packetState.contextReady')
        : pageT('shared.packetState.needsProof')
  const returnRouteLabel =
    (recoveryLesson ? localizedLessons[recoveryLesson.slug]?.title ?? recoveryLesson.title : null) ??
    pageT('shared.returnAcademy')
  const packetPreview = [
    `${supportPage.packet.preview.route} ${pathname}`,
    `${supportPage.packet.preview.runtime} ${runtimeSignal}`,
    `${supportPage.packet.preview.return} ${returnRouteLabel}`,
    `${supportPage.packet.preview.packet} ${packetState}`,
  ].join('\n')

  useEffect(() => {
    if (progress.platform.activeSurface !== 'support') {
      actions.setPlatform({ activeSurface: 'support' })
    }
  }, [actions, progress.platform.activeSurface])

  const diagnosticPacket = [
    diagnosticLabels.title,
    `${diagnosticLabels.route} ${pathname}`,
    `${diagnosticLabels.hostedSession} ${session.status}`,
    `${diagnosticLabels.hostedPlan} ${
      session.status === 'authenticated' ? session.user.plan ?? diagnosticValues.unknown : diagnosticValues.na
    }`,
    `${diagnosticLabels.selectedTrack} ${
      progress.selectedTrack
        ? localizedTracks[progress.selectedTrack]?.title ?? progress.selectedTrack
        : diagnosticValues.none
    }`,
    `${diagnosticLabels.completedLessons} ${progress.completedLessons.length}`,
    `${diagnosticLabels.nextLesson} ${
      derived.nextLesson
        ? localizedLessons[derived.nextLesson.slug]?.title ?? derived.nextLesson.title
        : diagnosticValues.none
    }`,
    `${diagnosticLabels.recoveryWorkspace} ${recoveryWorkspace.completedStepCount}/${recoveryLesson?.steps.length ?? 0}`,
    `${diagnosticLabels.recoveryFocusedStep} ${recoveryFocusedStep}`,
    `${diagnosticLabels.recoveryProof} ${
      recoveryWorkspace.workspace.evidence.trim() ? diagnosticValues.captured : diagnosticValues.missing
    }`,
    `${diagnosticLabels.activeSurface} ${progress.platform.activeSurface ?? diagnosticValues.none}`,
    `${diagnosticLabels.lastOpenedLesson} ${
      progress.platform.lastOpenedLessonSlug
        ? localizedLessons[progress.platform.lastOpenedLessonSlug]?.title ??
          progress.platform.lastOpenedLessonSlug
        : diagnosticValues.none
    }`,
    `${diagnosticLabels.railCollapsed} ${
      progress.platform.railCollapsed ? diagnosticValues.yes : diagnosticValues.no
    }`,
    `${diagnosticLabels.helpLaneOpen} ${
      progress.platform.helpLaneOpen ? diagnosticValues.yes : diagnosticValues.no
    }`,
    `${diagnosticLabels.supportRequestsSent} ${progress.supportRequests}`,
    `${diagnosticLabels.tutorQuestionsAsked} ${progress.tutorQuestions}`,
    `${diagnosticLabels.approvalGateEnabled} ${
      progress.autopilot.approvalGateEnabled ? diagnosticValues.yes : diagnosticValues.no
    }`,
    `${diagnosticLabels.hostedOnboardingStatus} ${setup.onboarding?.status ?? diagnosticValues.notAvailable}`,
    `${diagnosticLabels.hostedOnboardingStep} ${
      setup.onboarding?.current_step ?? diagnosticValues.notAvailable
    }`,
    `${diagnosticLabels.hostedWorkspace} ${setup.onboarding?.workspace ?? diagnosticValues.notAvailable}`,
    `${diagnosticLabels.runtimeStatus} ${setup.runtime?.status ?? diagnosticValues.notAvailable}`,
    `${diagnosticLabels.gatewayUrl} ${setup.runtime?.gateway_url ?? diagnosticValues.notAvailable}`,
    `${diagnosticLabels.runtimeBindings} ${setup.runtime?.binding_count ?? 0}`,
  ].join('\n')

  const defaultSupportMessage = `${diagnosticPacket}\n\n${supportPage.packet.problemLabel}\n`

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
        eyebrow={supportPage.shell.eyebrow}
        title={supportPage.shell.title}
        description={supportPage.shell.description}
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
                  <span className={picoClasses.chip}>{supportPage.hero.badge}</span>
                  <span className="inline-flex rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                    {formOpen ? supportPage.hero.mode.open : supportPage.hero.mode.triage}
                  </span>
                </div>
                <h2 className="font-[family:var(--font-site-display)] text-[clamp(1.9rem,4vw,2.9rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--pico-text)]">
                  {supportPage.hero.title}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {supportPage.hero.body}
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>{supportPage.hero.packetState.label}</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {packetState}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {copied
                        ? supportPage.hero.packetState.readyToPaste
                        : supportPage.hero.packetState.routeAndEvidenceFirst}
                    </p>
                  </div>

                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>{supportPage.hero.runtimeTruth.label}</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {runtimeSignal}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {setup.runtime?.gateway_url
                        ? supportPage.hero.runtimeTruth.gatewayAttached
                        : supportPage.hero.runtimeTruth.attachSignal}
                    </p>
                  </div>

                  <div className={picoSoft('p-4')}>
                    <p className={picoClasses.label}>{supportPage.hero.returnLane.label}</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {returnRouteLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryFocusedStep}
                    </p>
                  </div>
                </div>

                <div
                  className={picoInset(
                    'grid gap-3 p-4 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center',
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(var(--pico-accent-rgb),0.24)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.18),rgba(7,13,8,0.5))] shadow-[0_18px_40px_rgba(var(--pico-accent-rgb),0.12)]">
                    <span className="h-3 w-3 rounded-full bg-[color:var(--pico-accent-bright)] shadow-[0_0_18px_rgba(var(--pico-accent-rgb),0.5)]" />
                  </div>
                  <div className="min-w-0">
                    <p className={picoClasses.label}>{supportPage.hero.handoff.label}</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {recoveryLesson
                        ? pageT('shared.resumeLesson', {
                            lessonTitle:
                              localizedLessons[recoveryLesson.slug]?.title ?? recoveryLesson.title,
                          })
                        : supportPage.hero.handoff.returnAcademy}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryLesson
                        ? pageT('shared.stepsClear', {
                            completed: recoveryWorkspace.completedStepCount,
                            total: recoveryLesson.steps.length,
                          })
                        : supportPage.hero.handoff.sequenceFallback}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={picoInset(
                  'grid gap-4 overflow-hidden border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[radial-gradient(circle_at_50%_20%,rgba(var(--pico-accent-rgb),0.16),rgba(6,11,7,0.94)_54%,rgba(3,5,3,0.98)_100%)] p-4',
                )}
              >
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
                  <p className={picoClasses.label}>{supportPage.hero.packetPreview.label}</p>
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
              {supportPage.actions.getHumanHelp}
            </button>
            <button
              type="button"
              onClick={() => void copyDiagnosticPacket()}
              className={picoClasses.secondaryButton}
            >
              {copied ? supportPage.actions.copiedPacket : supportPage.actions.copyPacket}
            </button>
            <button
              type="button"
              onClick={() => openEscalation('other')}
              className={picoClasses.tertiaryButton}
            >
              {supportPage.actions.requestOfficeHours}
            </button>
          </div>
        }
      >
        <PicoSessionBanner session={session} nextPath={pathname} />
        <PicoSurfaceCompass
          title={supportPage.compass.title}
          body={supportPage.compass.body}
          status={formOpen ? supportPage.compass.status.open : supportPage.compass.status.standby}
          aside={supportPage.compass.aside}
          items={[
            {
              href: derived.nextLesson
                ? toHref(`/academy/${derived.nextLesson.slug}`)
                : toHref('/academy'),
              label: derived.nextLesson
                ? pageT('shared.resumeLesson', {
                    lessonTitle:
                      localizedLessons[derived.nextLesson.slug]?.title ?? derived.nextLesson.title,
                  })
                : supportPage.compass.academy.return,
              caption: supportPage.compass.academy.caption,
              note: supportPage.compass.academy.note,
              tone: 'primary',
            },
            {
              href: toHref('/tutor'),
              label: supportPage.compass.tutor.label,
              caption: supportPage.compass.tutor.caption,
              note: supportPage.compass.tutor.note,
            },
            {
              href: toHref('/autopilot'),
              label: supportPage.compass.autopilot.label,
              caption: supportPage.compass.autopilot.caption,
              note: supportPage.compass.autopilot.note,
              tone: 'soft',
            },
          ]}
        />

        <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-support-escalation-standards">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={picoClasses.label}>{supportPage.standards.label}</p>
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                    {supportPage.standards.title}
                  </h2>
                </div>
                <span className={picoClasses.chip}>{supportPage.standards.chip}</span>
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
                <p className={picoClasses.label}>{supportPage.standards.packetPosture.label}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {supportPage.standards.packetPosture.body}
                </p>
              </div>
              <div className={picoInset('overflow-hidden p-0')}>
                <div className="border-b border-[color:var(--pico-border)] p-5">
                  <p className={picoClasses.label}>{supportPage.standards.deskTone.label}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.standards.deskTone.body}
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
                <p className={picoClasses.label}>{supportPage.standards.bestFirstMove.label}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {supportPage.standards.bestFirstMove.body}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
          <div className={picoPanel('overflow-hidden p-0')}>
            <div className="grid gap-0 border-b border-[color:var(--pico-border)] lg:grid-cols-[minmax(0,1fr),18rem]">
              <div className="p-6 sm:p-7">
                <p className={picoClasses.label}>{supportPage.desk.label}</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                  {supportPage.desk.title}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                  {supportPage.desk.body}
                </p>

                <div className={picoEmber('mt-6 p-5')}>
                  <p className="font-medium text-[color:var(--pico-text)]">
                    {supportPage.desk.callout.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.desk.callout.body}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {supportLanes.map((lane) => (
                    <article key={lane.id} className={picoInset('grid gap-4 p-5')}>
                      <div>
                        <h3 className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                          {lane.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                          {lane.body}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEscalation(lane.id)}
                        className={
                          lane.id === 'fixing-existing'
                            ? picoClasses.primaryButton
                            : picoClasses.secondaryButton
                        }
                      >
                        {lane.cta}
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
                <p className={picoClasses.label}>{supportPage.rail.label}</p>
                <div className="mt-4 grid gap-3">
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {supportPage.rail.supportRequests}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                      {progress.supportRequests}
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {supportPage.rail.tutorQuestions}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">
                      {progress.tutorQuestions}
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {supportPage.rail.plan.label}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {session.status === 'authenticated'
                        ? session.user.plan ?? supportPage.rail.plan.unknown
                        : supportPage.rail.plan.signIn}
                    </p>
                  </div>
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {supportPage.rail.activeSurface.label}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {progress.platform.activeSurface ?? supportPage.rail.activeSurface.none}
                    </p>
                  </div>
                </div>

                <div className={picoInset('mt-4 p-4')}>
                  <p className={picoClasses.label}>{supportPage.rail.tryTheseFirst}</p>
                  <div className="mt-3 grid gap-2">
                    <Link href={toHref('/tutor')} className={picoClasses.secondaryButton}>
                      {supportPage.rail.tryTutorFirst}
                    </Link>
                    <Link
                      href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                      className={picoClasses.tertiaryButton}
                    >
                      {derived.nextLesson
                        ? pageT('shared.openLesson', {
                            lessonTitle:
                              localizedLessons[derived.nextLesson.slug]?.title ??
                              derived.nextLesson.title,
                          })
                        : supportPage.rail.returnAcademy}
                    </Link>
                    <Link href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                      {supportPage.rail.openAutopilot}
                    </Link>
                  </div>
                </div>

                <div className={picoInset('mt-4 p-4')}>
                  <p className={picoClasses.label}>{supportPage.rail.directLine}</p>
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
                  <p className={picoClasses.label}>{supportPage.packet.label}</p>
                  <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {supportPage.packet.title}
                  </h2>
                </div>
                <span className={picoClasses.chip}>{supportPage.packet.chip}</span>
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
                  {copied ? supportPage.actions.copiedPacket : supportPage.actions.copyPacket}
                </button>
                <button
                  type="button"
                  onClick={() => openEscalation('fixing-existing')}
                  className={picoClasses.primaryButton}
                >
                  {supportPage.packet.openFormWithPacket}
                </button>
              </div>
            </section>

            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>{supportPage.state.label}</p>
              <div className="mt-4 grid gap-3">
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {supportPage.state.hostedOnboarding}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.onboarding?.status ?? pageT('shared.runtime.notAttached')}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {supportPage.state.runtimeStatus}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {setup.runtime?.status ?? pageT('shared.runtime.notAttached')}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {supportPage.state.currentTrack}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.selectedTrack
                      ? localizedTracks[progress.selectedTrack]?.title ?? progress.selectedTrack
                      : supportPage.state.currentTrackNotChosenYet}
                  </p>
                </div>
                <div className={picoInset('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {supportPage.state.nextLesson}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {derived.nextLesson
                      ? localizedLessons[derived.nextLesson.slug]?.title ?? derived.nextLesson.title
                      : supportPage.state.nextLessonNone}
                  </p>
                </div>
                {recoveryLesson ? (
                  <>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[color:var(--pico-text-muted)]">
                        {supportPage.state.lessonWorkspace}
                      </p>
                      <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                        {recoveryWorkspace.completedStepCount}/{recoveryLesson.steps.length}
                      </p>
                    </div>
                    <div className={picoInset('p-4')}>
                      <p className="text-sm text-[color:var(--pico-text-muted)]">
                        {supportPage.state.focusedStep}
                      </p>
                      <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                        {recoveryFocusedStep}
                      </p>
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
              <p className={picoClasses.label}>{supportPage.returnMap.label}</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
                {supportPage.returnMap.title}
              </h2>
            </div>
            <span className={picoClasses.chip}>{supportPage.returnMap.chip}</span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)]">
            <div className="grid gap-4">
              <article className={picoInset('grid gap-4 p-5')}>
                <p className={picoClasses.label}>{supportPage.returnMap.model.label}</p>
                <div className="grid gap-3">
                  {supportPage.returnMap.model.cards.map((card) => (
                    <div key={card.title} className={picoSoft('p-4')}>
                      <p className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                        {card.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {card.body}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>{supportPage.returnMap.anatomy.label}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.returnMap.anatomy.body}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {supportPage.returnMap.anatomy.cards.map((card) => (
                    <div key={card.title} className={picoSoft('p-4')}>
                      <p className="font-medium text-[color:var(--pico-text)]">{card.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {card.body}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>{supportPage.returnMap.paths.lesson.label}</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {supportPage.returnMap.paths.lesson.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.returnMap.paths.lesson.body}
                  </p>
                </div>
                <a
                  href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                  className={picoClasses.secondaryButton}
                >
                  {derived.nextLesson
                    ? pageT('shared.openLesson', {
                        lessonTitle:
                          localizedLessons[derived.nextLesson.slug]?.title ??
                          derived.nextLesson.title,
                      })
                    : supportPage.rail.returnAcademy}
                </a>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>{supportPage.returnMap.paths.tutor.label}</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {supportPage.returnMap.paths.tutor.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.returnMap.paths.tutor.body}
                  </p>
                </div>
                <a href={toHref('/tutor')} className={picoClasses.tertiaryButton}>
                  {supportPage.returnMap.paths.tutor.cta}
                </a>
              </article>

              <article className={picoInset('grid gap-4 p-5')}>
                <div>
                  <p className={picoClasses.label}>{supportPage.returnMap.paths.autopilot.label}</p>
                  <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {supportPage.returnMap.paths.autopilot.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {supportPage.returnMap.paths.autopilot.body}
                  </p>
                </div>
                <a href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                  {supportPage.returnMap.paths.autopilot.cta}
                </a>
              </article>
            </div>
          </div>
        </section>
      </PicoShell>
    </>
  )
}
