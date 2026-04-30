'use client'

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

function buildRouteStep(currentItem: PicoWelcomeTourNavItem, pageTitle: string): TourStep {
  if (currentItem.href === '/academy') {
    return {
      eyebrow: '02 Lesson first',
      title: 'Work on one setup step at a time.',
      body: 'Open the current lesson, finish the visible step, and leave the rest of the archive alone until setup is stable.',
      bullets: [
        'The map explains the order.',
        'The current lesson should stay easy to find.',
        `Current page: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/tutor') {
    return {
      eyebrow: '02 One blocker',
      title: 'Tutor is for the exact next move.',
      body: 'Ask about the command, file path, provider setting, or validation step that is blocking setup.',
      bullets: [
        'If the sequence is wrong, return to Academy.',
        'If the runtime is already running, open Autopilot.',
        `Current page: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/autopilot') {
    return {
      eyebrow: '02 Runtime',
      title: 'Use Autopilot after a real run exists.',
      body: 'Use this page when the answer depends on runs, alerts, approvals, spend, or current runtime state.',
      bullets: [
        'Return to Academy when setup is still incomplete.',
        'Get human help when hosting, keys, or rollout details are unclear.',
        `Current page: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/support') {
    return {
      eyebrow: '02 Human help',
      title: 'Use support when setup needs guidance.',
      body: 'Bring the lesson, error, or runtime notes you have. A human can help with API keys, hosting, integrations, and custom implementation.',
      bullets: [
        'Most users should not have to solve hosting alone.',
        'Carry the lesson slug, error, and current runtime notes.',
        `Current page: ${pageTitle}.`,
      ],
    }
  }

  return {
    eyebrow: '02 First run',
    title: 'Onboarding gets you to one working runtime.',
    body: 'Install the runtime, run one prompt, then prepare the Markdown packet your agent can read next.',
    bullets: [
      'Leave preferences alone until the first run works.',
      'Academy gives the exact setup steps.',
      `Current page: ${pageTitle}.`,
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
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setStepIndex(0)
    }
  }, [open])

  const steps = useMemo<TourStep[]>(
    () => [
      {
        eyebrow: '01 Page',
        title: 'Each Pico page has one main job.',
        body: 'Use the page for the setup step in front of you. Do not turn every screen into a research project.',
        bullets: [
          `You are in Chapter ${currentItem.chapter}: ${currentItem.label}.`,
          previousItem ? `Back: ${previousItem.label}.` : 'Back: onboarding.',
          nextItem ? `Next: ${nextItem.label}.` : 'Next: support.',
        ],
      },
      buildRouteStep(currentItem, pageTitle),
      {
        eyebrow: '03 Output',
        title: 'Save the output before moving on.',
        body: 'The agent packet works better when setup leaves behind a command, a result, and a short note about what changed.',
        bullets: [
          'If the blocker is exact, ask Tutor.',
          'If the runtime is already live, open Autopilot.',
          'If setup needs judgment, ask Support with the notes you have.',
        ],
      },
    ],
    [currentItem, nextItem, pageTitle, previousItem],
  )

  const step = steps[stepIndex]

  if (!open) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-24 top-4 z-50 flex items-end justify-end sm:inset-x-6 sm:bottom-6 sm:top-6"
      data-testid="pico-welcome-tour"
    >
      <section className={picoCodexFrame('pointer-events-auto flex max-h-full w-full max-w-[26rem] flex-col overflow-hidden p-0')}>
        <div className="border-b border-[color:var(--pico-border)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Quick help</p>
              <h2 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                Learn the flow once, then close it.
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={picoClasses.tertiaryButton}
              aria-label="Close quick tour"
            >
              Close
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
                Back
              </button>
              {stepIndex === steps.length - 1 ? (
                <button type="button" onClick={onClose} className={picoClasses.primaryButton}>
                  Finish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
                  className={picoClasses.primaryButton}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
