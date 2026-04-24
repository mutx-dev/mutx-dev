'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import {
  picoClasses,
  picoCodex,
  picoCodexFrame,
  picoCodexInset,
  picoCodexNote,
} from '@/components/pico/picoTheme'
import { cn } from '@/lib/utils'

export type PicoWelcomeTourNavItem = {
  href: string
  label: string
  chapter: string
  note: string
}

type PicoWelcomeTourProps = {
  open: boolean
  onClose: () => void
  currentItem: PicoWelcomeTourNavItem
  previousItem: PicoWelcomeTourNavItem | null
  nextItem: PicoWelcomeTourNavItem | null
  pageTitle: string
}

type TourStep = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
}

function buildRouteKey(currentItem: PicoWelcomeTourNavItem) {
  if (currentItem.href === '/academy') {
    return 'academy'
  }

  if (currentItem.href === '/tutor') {
    return 'tutor'
  }

  if (currentItem.href === '/autopilot') {
    return 'autopilot'
  }

  if (currentItem.href === '/support') {
    return 'support'
  }

  return 'onboarding'
}

function buildRouteStep(
  t: ReturnType<typeof useTranslations<'pico.welcomeTour'>>,
  currentItem: PicoWelcomeTourNavItem,
  pageTitle: string,
): TourStep {
  const routeKey = buildRouteKey(currentItem)

  if (routeKey === 'academy') {
    return {
      eyebrow: t('steps.route.academy.eyebrow'),
      title: t('steps.route.academy.title'),
      body: t('steps.route.academy.body'),
      bullets: [
        t('steps.route.academy.bullets.map'),
        t('steps.route.academy.bullets.proof'),
        t('steps.route.academy.bullets.currentSurface', { pageTitle }),
      ],
    }
  }

  if (routeKey === 'tutor') {
    return {
      eyebrow: t('steps.route.tutor.eyebrow'),
      title: t('steps.route.tutor.title'),
      body: t('steps.route.tutor.body'),
      bullets: [
        t('steps.route.tutor.bullets.academy'),
        t('steps.route.tutor.bullets.autopilot'),
        t('steps.route.tutor.bullets.currentSurface', { pageTitle }),
      ],
    }
  }

  if (routeKey === 'autopilot') {
    return {
      eyebrow: t('steps.route.autopilot.eyebrow'),
      title: t('steps.route.autopilot.title'),
      body: t('steps.route.autopilot.body'),
      bullets: [
        t('steps.route.autopilot.bullets.academy'),
        t('steps.route.autopilot.bullets.support'),
        t('steps.route.autopilot.bullets.currentSurface', { pageTitle }),
      ],
    }
  }

  if (routeKey === 'support') {
    return {
      eyebrow: t('steps.route.support.eyebrow'),
      title: t('steps.route.support.title'),
      body: t('steps.route.support.body'),
      bullets: [
        t('steps.route.support.bullets.notDefault'),
        t('steps.route.support.bullets.packet'),
        t('steps.route.support.bullets.currentSurface', { pageTitle }),
      ],
    }
  }

  return {
    eyebrow: t('steps.route.onboarding.eyebrow'),
    title: t('steps.route.onboarding.title'),
    body: t('steps.route.onboarding.body'),
    bullets: [
      t('steps.route.onboarding.bullets.noise'),
      t('steps.route.onboarding.bullets.academy'),
      t('steps.route.onboarding.bullets.currentSurface', { pageTitle }),
    ],
  }
}

export function PicoWelcomeTour({
  open,
  onClose,
  currentItem,
  previousItem,
  nextItem,
  pageTitle,
}: PicoWelcomeTourProps) {
  const t = useTranslations('pico.welcomeTour')
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setStepIndex(0)
    }
  }, [open])

  const steps = useMemo<TourStep[]>(
    () => [
      {
        eyebrow: t('steps.mission.eyebrow'),
        title: t('steps.mission.title'),
        body: t('steps.mission.body'),
        bullets: [
          t('steps.mission.bullets.currentSurface', {
            chapter: currentItem.chapter,
            label: currentItem.label,
          }),
          previousItem
            ? t('steps.mission.bullets.backtrackPrevious', { label: previousItem.label })
            : t('steps.mission.bullets.backtrackOnboarding'),
          nextItem
            ? t('steps.mission.bullets.forwardNext', { label: nextItem.label })
            : t('steps.mission.bullets.forwardSupport'),
        ],
      },
      buildRouteStep(t, currentItem, pageTitle),
      {
        eyebrow: t('steps.proof.eyebrow'),
        title: t('steps.proof.title'),
        body: t('steps.proof.body'),
        bullets: [
          t('steps.proof.bullets.tutor'),
          t('steps.proof.bullets.autopilot'),
          t('steps.proof.bullets.support'),
        ],
      },
    ],
    [currentItem, nextItem, pageTitle, previousItem, t],
  )

  const step = steps[stepIndex]

  return (
    <div
      id="pico-welcome-tour"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-24 top-4 z-50 items-end justify-end sm:inset-x-6 sm:bottom-6 sm:top-6',
        open ? 'flex' : 'hidden peer-checked:flex',
      )}
      data-testid="pico-welcome-tour"
      aria-hidden={!open}
    >
      <section className={picoCodexFrame('pointer-events-auto flex max-h-full w-full max-w-[26rem] flex-col overflow-hidden p-0')}>
        <div className="border-b border-[color:var(--pico-border)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>{t('quickHelp')}</p>
              <h2 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                {t('title')}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={picoClasses.tertiaryButton}
              aria-label={t('closeLabel')}
            >
              {t('close')}
            </button>
          </div>
        </div>

        <div className="grid min-h-0 gap-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className={picoCodexNote('p-4')}>
            <p className={picoClasses.label}>{step.eyebrow}</p>
            <h3 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{step.body}</p>
          </div>

          <div className="grid gap-3">
            {step.bullets.map((bullet) => (
              <div key={bullet} className={picoCodexInset('grid grid-cols-[0.8rem,1fr] items-start gap-3 px-4 py-4')}>
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--pico-accent)]" />
                <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{bullet}</p>
              </div>
            ))}
          </div>

          <div className={cn(picoCodexInset('flex items-center justify-between gap-4 p-4'), picoCodex.parchment)}>
            <div className="flex items-center gap-2">
              {steps.map((tourStep, index) => (
                <span
                  key={tourStep.eyebrow}
                  className={cn(
                    'h-2.5 rounded-full transition',
                    stepIndex === index
                      ? 'w-7 bg-[color:var(--pico-accent)]'
                      : 'w-2.5 bg-[color:var(--pico-border)]',
                  )}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                className={picoClasses.tertiaryButton}
                disabled={stepIndex === 0}
              >
                {t('controls.back')}
              </button>
              {stepIndex === steps.length - 1 ? (
                <button type="button" onClick={onClose} className={picoClasses.primaryButton}>
                  {t('controls.finish')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
                  className={picoClasses.primaryButton}
                >
                  {t('controls.next')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
