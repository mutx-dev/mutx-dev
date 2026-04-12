'use client'

import Link from 'next/link'

import {
  PICO_PLAN_MATRIX,
  type PicoDerivedProgress,
  type PicoPlan,
  type PicoProgressState,
} from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import { type PicoSessionState } from '@/components/pico/usePicoSession'
import { picoClasses, picoEmber, picoInset, picoPanel, picoSoft } from '@/components/pico/picoTheme'

type PicoPlatformSurfaceProps = {
  session: PicoSessionState
  progress: PicoProgressState
  derived: PicoDerivedProgress
  syncState: string
  ready: boolean
  onSave: (patch: Partial<PicoProgressState['platform']>) => void
  onReset: () => void
  currentPath: string
}

const surfaceOptions: Array<{
  surface: NonNullable<PicoProgressState['platform']['activeSurface']>
  label: string
  note: string
}> = [
  {
    surface: 'onboarding',
    label: 'Onboarding',
    note: 'Launch bay memory',
  },
  {
    surface: 'academy',
    label: 'Academy',
    note: 'Primary learning spine',
  },
  {
    surface: 'lesson',
    label: 'Lesson',
    note: 'Active step memory',
  },
  {
    surface: 'tutor',
    label: 'Tutor',
    note: 'Grounded next-step help',
  },
  {
    surface: 'autopilot',
    label: 'Autopilot',
    note: 'Runtime control room',
  },
  {
    surface: 'support',
    label: 'Support',
    note: 'Human escalation lane',
  },
] as const

function toPlan(value: string | null | undefined): PicoPlan {
  return value === 'starter' || value === 'pro' ? value : 'free'
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

export function PicoPlatformSurface({
  session,
  progress,
  derived: _derived,
  syncState,
  ready,
  onSave,
  onReset,
  currentPath,
}: PicoPlatformSurfaceProps) {
  const toHref = usePicoHref()
  const plan = toPlan(session.status === 'authenticated' ? session.user.plan : null)
  const planMatrix = PICO_PLAN_MATRIX[plan]
  const lastOpenedLesson = progress.platform.lastOpenedLessonSlug
  const activeSurface = progress.platform.activeSurface

  function setActiveSurface(surface: NonNullable<PicoProgressState['platform']['activeSurface']>) {
    onSave({ activeSurface: surface })
  }

  return (
    <section className={picoPanel('p-6 sm:p-7')} data-testid="pico-platform-surface">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={picoClasses.label}>Platform desk</p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[#fff4e6] sm:text-4xl">
            Identity, route memory, and limits in one place
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d5c0a8]">
            This is the operator-facing control desk for the Pico account. It should tell the truth
            about plan limits, where the operator was last working, and whether the product chrome
            is tuned for focus or recovery.
          </p>
        </div>
        <span className={picoClasses.chip}>{formatSyncState(syncState, ready)}</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
        <div className="grid gap-4">
          <div className={picoInset('grid gap-4 p-5')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-[#a8896e]">Plan</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">{plan.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-[#a8896e]">Verification</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {session.status === 'authenticated'
                    ? session.user.isEmailVerified === false
                      ? 'pending'
                      : session.user.isEmailVerified === true
                        ? 'verified'
                        : 'unknown'
                    : 'sign in'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#a8896e]">Workspace saves</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {Object.keys(progress.lessonWorkspaces).length}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={picoClasses.label}>Route memory</p>
                  <p className="mt-1 text-sm leading-6 text-[#d5c0a8]">
                    The current surface should match what the operator is actually doing. Keep this
                    updated when the product shifts lanes.
                  </p>
                </div>
                <span className={picoClasses.chip} data-testid="pico-platform-active-surface">
                  {activeSurface ?? 'not recorded'}
                </span>
              </div>

              <div
                className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                data-testid="pico-platform-surface-memory"
              >
                {surfaceOptions.map((option) => {
                  const selected = activeSurface === option.surface
                  return (
                    <button
                      key={option.surface}
                      type="button"
                      onClick={() => setActiveSurface(option.surface)}
                      aria-pressed={selected}
                      className={picoSoft(
                        `grid gap-2 rounded-[24px] px-4 py-4 text-left transition hover:border-[#7d5232] hover:bg-[rgba(255,247,235,0.06)] ${
                          selected ? 'border-[#e2904f] bg-[rgba(226,144,79,0.1)]' : ''
                        }`,
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8896e]">
                        {option.note}
                      </p>
                      <p className="text-lg font-medium text-[#fff4e6]">{option.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={picoSoft('p-4')}>
                <p className={picoClasses.label}>Current surface</p>
                <p className="mt-2 text-lg font-medium text-[#fff4e6]">
                  {activeSurface ?? 'not recorded'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  Route memory should follow the operator through Pico instead of resetting every
                  time the page changes.
                </p>
              </div>

              <div className={picoSoft('p-4')}>
                <p className={picoClasses.label}>Last lesson context</p>
                <p className="mt-2 text-lg font-medium text-[#fff4e6]">
                  {lastOpenedLesson ?? 'not recorded'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5c0a8]">
                  This is the recovery point when the operator needs to re-enter the lesson spine.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-[24px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-4 text-sm leading-6 text-[#d5c0a8]">
                <input
                  type="checkbox"
                  checked={progress.platform.railCollapsed}
                  onChange={(event) => onSave({ railCollapsed: event.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[#6e4d31] bg-transparent text-[#e2904f] accent-[#e2904f]"
                />
                <span>
                  <span className="block font-medium text-[#fff4e6]">Collapse rail</span>
                  <span className="block text-[#c7af93]">
                    Use a tighter chrome when the operator already knows the route and needs more
                    room for the live surface.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-[24px] border border-[#4a3423] bg-[rgba(255,247,235,0.03)] px-4 py-4 text-sm leading-6 text-[#d5c0a8]">
                <input
                  type="checkbox"
                  checked={progress.platform.helpLaneOpen}
                  onChange={(event) => onSave({ helpLaneOpen: event.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[#6e4d31] bg-transparent text-[#e2904f] accent-[#e2904f]"
                />
                <span>
                  <span className="block font-medium text-[#fff4e6]">Keep help lane open</span>
                  <span className="block text-[#c7af93]">
                    Keep recovery guidance visible when the operator is still learning the product
                    routes.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {lastOpenedLesson ? (
                <Link href={toHref(`/academy/${lastOpenedLesson}`)} className={picoClasses.primaryButton}>
                  Resume last lesson
                </Link>
              ) : (
                <Link href={toHref('/academy')} className={picoClasses.primaryButton}>
                  Open academy
                </Link>
              )}
              {lastOpenedLesson ? (
                <button
                  type="button"
                  onClick={() => onSave({ lastOpenedLessonSlug: null })}
                  className={picoClasses.secondaryButton}
                >
                  Clear lesson memory
                </button>
              ) : null}
              <button type="button" onClick={onReset} className={picoClasses.secondaryButton}>
                Reset platform memory
              </button>
              <Link href={toHref('/autopilot')} className={picoClasses.tertiaryButton}>
                Open live control room
              </Link>
            </div>
          </div>

          <div className={picoEmber('p-5')}>
            <p className={picoClasses.label}>Entitlements</p>
            <div className="mt-4 grid gap-3">
              {(Object.entries(planMatrix) as Array<[keyof typeof planMatrix, string]>).map(([feature, value]) => (
                <div
                  key={feature}
                  className="flex items-start justify-between gap-4 border-b border-[#4a3423] pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm uppercase tracking-[0.18em] text-[#b58d65]">
                    {feature.replace('_', ' ')}
                  </span>
                  <span className="max-w-[14rem] text-right text-sm leading-6 text-[#fff4e6]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={picoInset('p-5')}>
            <p className={picoClasses.label}>Route ledger</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Current path</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">{currentPath}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Platform state updated</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {formatTimestamp(progress.platform.updatedAt)}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[#a8896e]">Sync confidence</p>
                <p className="mt-1 text-lg font-medium text-[#fff4e6]">
                  {formatSyncState(syncState, ready)}
                </p>
              </div>
            </div>
          </div>

          <div className={picoInset('p-5')}>
            <p className={picoClasses.label}>Operator truth</p>
            <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
              The product should remember the route and lesson context without pretending it knows
              more than it does. `activeSurface`, `lastOpenedLessonSlug`, the rail state, and the
              help lane are the minimum persisted memory needed to make Pico feel like one platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
