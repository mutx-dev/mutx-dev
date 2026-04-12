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
      eyebrow: '02 Mission first',
      title: 'The codex only wants one mission to matter.',
      body: 'Open the dominant lesson, clear the visible step, and let the archive stay quiet until the main route is done.',
      bullets: [
        'The map explains sequence. It should not compete with the mission.',
        'The current proof lane is the only part that should feel urgent.',
        `Current surface: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/tutor') {
    return {
      eyebrow: '02 One blocker',
      title: 'Tutor is for the exact next move.',
      body: 'Ask about the one command, file path, or validation step that is stopping the route.',
      bullets: [
        'If the sequence is wrong, return to Academy.',
        'If live runtime state is the blocker, open Autopilot.',
        `Current surface: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/autopilot') {
    return {
      eyebrow: '02 Runtime truth',
      title: 'Autopilot beats lesson copy when the system is live.',
      body: 'Use the runtime surface when the answer depends on runs, alerts, approvals, or current state.',
      bullets: [
        'Return to Academy when the mission sequence is the real problem.',
        'Escalate only after runtime truth is no longer enough.',
        `Current surface: ${pageTitle}.`,
      ],
    }
  }

  if (currentItem.href === '/support') {
    return {
      eyebrow: '02 Human edge',
      title: 'Support should send you back into motion fast.',
      body: 'Bring the cleanest lesson or runtime packet possible, then return to the product instead of lingering here.',
      bullets: [
        'Support is the messy edge, not the default workspace.',
        'Carry lesson slug, proof, and blocker when you escalate.',
        `Current surface: ${pageTitle}.`,
      ],
    }
  }

  return {
    eyebrow: '02 First win',
    title: 'Onboarding exists to compress the first visible success.',
    body: 'Use it to get to one working runtime and one proof artifact, then move immediately into the codex.',
    bullets: [
      'Treat preferences as noise until the first success is real.',
      'Academy becomes useful once you need the exact lane.',
      `Current surface: ${pageTitle}.`,
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
        eyebrow: '01 Mission',
        title: 'Each Pico surface should have one dominant action.',
        body: 'If a page looks equally about navigation, metrics, and explanation, it is lying. Find the one move that clears the route.',
        bullets: [
          `You are in Chapter ${currentItem.chapter}: ${currentItem.label}.`,
          previousItem ? `Backtrack target: ${previousItem.label}.` : 'Backtrack target: onboarding.',
          nextItem ? `Forward route: ${nextItem.label}.` : 'Forward route: support.',
        ],
      },
      buildRouteStep(currentItem, pageTitle),
      {
        eyebrow: '03 Proof',
        title: 'Never leave the route without a proof artifact.',
        body: 'The platform becomes trustworthy only when each cleared step leaves behind evidence, not just optimism.',
        bullets: [
          'If the blocker is exact, ask Tutor.',
          'If the blocker is live system truth, open Autopilot.',
          'If both fail, escalate to Support with the proof and notes.',
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
        <div className="border-b border-[#5d412d] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={picoClasses.label}>Quick help</p>
              <h2 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[#fff4e6]">
                Learn the codex once, then close it.
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
            <h3 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#f0deca]">{step.body}</p>
          </div>

          <div className="grid gap-3">
            {step.bullets.map((bullet) => (
              <div key={bullet} className={picoCodexInset('grid grid-cols-[0.8rem,1fr] items-start gap-3 px-4 py-4')}>
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#e2904f]" />
                <p className="text-sm leading-6 text-[#d5c0a8]">{bullet}</p>
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
                    stepIndex === index ? 'w-7 bg-[#e2904f]' : 'w-2.5 bg-[#5a3f2a]',
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
