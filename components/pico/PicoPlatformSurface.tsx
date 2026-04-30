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
import { cn } from '@/lib/utils'

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
    note: 'Runtime review',
  },
  {
    surface: 'support',
    label: 'Support',
    note: 'Human setup help',
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
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-4xl">
            Identity, page memory, and limits in one place
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            This account panel shows plan limits, the last Pico page used, and whether the interface
            is set for a tighter workspace.
          </p>
        </div>
        <span className={picoClasses.chip}>{formatSyncState(syncState, ready)}</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
        <div className="grid gap-4">
          <div className={picoInset('grid gap-4 p-5')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Plan</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{plan.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Verification</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
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
                <p className="text-sm text-[color:var(--pico-text-muted)]">Workspace saves</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {Object.keys(progress.lessonWorkspaces).length}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={picoClasses.label}>Page memory</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    Keep this aligned with the page you are actually using.
                  </p>
                </div>
                <span className={picoClasses.chip} data-testid="pico-platform-active-surface">
                  {activeSurface ?? 'not recorded'}
                </span>
              </div>

              <div className="grid gap-3" data-testid="pico-platform-surface-memory">
                {surfaceOptions.map((option) => {
                  const selected = activeSurface === option.surface
                  return (
                    <button
                      key={option.surface}
                      type="button"
                      onClick={() => setActiveSurface(option.surface)}
                      aria-pressed={selected}
                      className={picoSoft(
                        `grid gap-3 rounded-[24px] px-4 py-4 text-left transition sm:grid-cols-[minmax(0,1fr),auto] sm:items-center hover:border-[color:var(--pico-border-hover)] hover:bg-[color:var(--pico-bg-surface-hover)] ${
                          selected
                            ? 'border-[color:var(--pico-accent)] bg-[rgba(var(--pico-accent-rgb),0.1)]'
                            : ''
                        }`,
                      )}
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                          {option.note}
                        </p>
                        <p className="mt-2 text-xl font-medium text-[color:var(--pico-text)]">{option.label}</p>
                      </div>
                      <span className={cn(picoClasses.chip, selected && 'text-[color:var(--pico-text)]')}>
                        {selected ? 'active now' : 'set page'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>Current page</p>
                <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                  {activeSurface ?? 'not recorded'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Page memory should follow you through Pico instead of resetting every time the page changes.
                </p>
              </div>

              <div className={picoSoft('p-4')}>
                <p className={picoClasses.label}>Last lesson context</p>
                <p className="mt-2 text-lg font-medium text-[color:var(--pico-text)]">
                  {lastOpenedLesson ?? 'not recorded'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  This is the recovery point when you need to re-enter the lesson flow.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                <input
                  type="checkbox"
                  checked={progress.platform.railCollapsed}
                  onChange={(event) => onSave({ railCollapsed: event.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[color:var(--pico-border)] bg-transparent text-[color:var(--pico-accent)] accent-[color:var(--pico-accent)]"
                />
                <span>
                  <span className="block font-medium text-[color:var(--pico-text)]">Collapse rail</span>
                  <span className="block text-[color:var(--pico-text-secondary)]">
                    Use a tighter layout when you already know the page and need more room.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                <input
                  type="checkbox"
                  checked={progress.platform.helpLaneOpen}
                  onChange={(event) => onSave({ helpLaneOpen: event.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[color:var(--pico-border)] bg-transparent text-[color:var(--pico-accent)] accent-[color:var(--pico-accent)]"
                />
                <span>
                  <span className="block font-medium text-[color:var(--pico-text)]">Keep help panel open</span>
                  <span className="block text-[color:var(--pico-text-secondary)]">
                    Keep guidance visible while the setup path is still unfamiliar.
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
                Open Autopilot
              </Link>
            </div>
          </div>

          <div className={picoEmber('p-5')}>
            <p className={picoClasses.label}>Entitlements</p>
            <div className="mt-4 grid gap-3">
              {(Object.entries(planMatrix) as Array<[keyof typeof planMatrix, string]>).map(([feature, value]) => (
                <div
                  key={feature}
                  className="flex items-start justify-between gap-4 border-b border-[color:var(--pico-border)] pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                    {feature.replace('_', ' ')}
                  </span>
                  <span className="max-w-[14rem] text-right text-sm leading-6 text-[color:var(--pico-text)]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={picoInset('p-5')}>
            <p className={picoClasses.label}>Page record</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Current path</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{currentPath}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Platform state updated</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {formatTimestamp(progress.platform.updatedAt)}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Sync confidence</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {formatSyncState(syncState, ready)}
                </p>
              </div>
            </div>
          </div>

          <div className={picoInset('p-5')}>
            <p className={picoClasses.label}>Stored page state</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              Pico remembers the current page, last lesson, rail state, and help panel so setup can
              resume without asking you to rebuild context.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
