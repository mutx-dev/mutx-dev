'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  picoClasses,
  picoCodex,
  picoCodexFrame,
  picoCodexInset,
  picoCodexNote,
  picoPanel,
} from '@/components/pico/picoTheme'
import { PicoWelcomeTour } from '@/components/pico/PicoWelcomeTour'
import { picoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/onboarding', label: 'Start', chapter: '01', note: 'first visible win' },
  { href: '/academy', label: 'Lessons', chapter: '02', note: 'the working path' },
  { href: '/tutor', label: 'Tutor', chapter: '03', note: 'one grounded answer' },
  { href: '/autopilot', label: 'Autopilot', chapter: '04', note: 'live control room' },
  { href: '/support', label: 'Human help', chapter: '05', note: 'the messy edge' },
] as const

const PICO_WELCOME_TOUR_STORAGE_KEY = 'pico.welcome-tour.dismissed.v2'

type PicoShellProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  mode?: 'default' | 'academy'
  railCollapsed?: boolean
  helpLaneOpen?: boolean
  onToggleRail?: () => void
  onToggleHelpLane?: () => void
  children: ReactNode
}

function routeIsActive(pathname: string, href: string) {
  const absoluteHref = `/pico${href}`
  return pathname === absoluteHref || pathname.startsWith(`${absoluteHref}/`)
}

function ShellBackground({ academyMode }: { academyMode: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          academyMode
            ? 'bg-[radial-gradient(circle_at_18%_0%,rgba(212,171,115,0.18),transparent_22%),radial-gradient(circle_at_82%_10%,rgba(142,121,196,0.08),transparent_18%),linear-gradient(180deg,#141218_0%,#0e0d12_52%,#08070b_100%)]'
            : 'bg-[radial-gradient(circle_at_18%_0%,rgba(212,171,115,0.16),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(142,121,196,0.08),transparent_18%),linear-gradient(180deg,#121116_0%,#08070b_100%)]',
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.92),transparent_92%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(255,233,205,0.08),transparent_44%)]"
      />
    </>
  )
}

function PicoWordmark({ pathname }: { pathname: string }) {
  return (
    <Link href={picoHref(pathname, '/onboarding')} className="inline-flex items-center gap-3">
      <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(255,233,204,0.12)] bg-[rgba(255,247,235,0.04)] shadow-[0_18px_36px_rgba(2,2,5,0.28)]">
        <Image src="/pico/logo.png" alt="PicoMUTX logo" width={28} height={28} priority />
      </span>
      <span className="grid gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#b78f67]">
          PicoMUTX
        </span>
        <span className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
          operator atlas
        </span>
      </span>
    </Link>
  )
}

export function PicoShell({
  eyebrow,
  title,
  description,
  actions,
  mode = 'default',
  railCollapsed = false,
  helpLaneOpen = false,
  onToggleRail,
  onToggleHelpLane,
  children,
}: PicoShellProps) {
  const pathname = usePathname()
  const [tourOpen, setTourOpen] = useState(false)
  const academyMode = mode === 'academy'
  const currentItem =
    navItems.find((item) => routeIsActive(pathname, item.href)) ?? navItems[0]
  const currentIndex = navItems.findIndex((item) => item.href === currentItem.href)
  const previousItem = currentIndex > 0 ? navItems[currentIndex - 1] : null
  const nextItem = currentIndex < navItems.length - 1 ? navItems[currentIndex + 1] : null
  const isAcademyLessonRoute = pathname.startsWith('/pico/academy/')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const dismissed = window.localStorage.getItem(PICO_WELCOME_TOUR_STORAGE_KEY) === 'dismissed'
    setTourOpen(false)
    if (dismissed) {
      return
    }
  }, [pathname])

  function closeTour() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PICO_WELCOME_TOUR_STORAGE_KEY, 'dismissed')
    }
    setTourOpen(false)
  }

  if (academyMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#09080b] text-[#fff0df]">
        <ShellBackground academyMode />

        <div className="relative mx-auto max-w-[96rem] px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <header className={picoCodexFrame('px-5 py-5 sm:px-6 lg:px-8')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <PicoWordmark pathname={pathname} />

              <div className="flex flex-wrap items-center gap-2">
                <span className={picoCodex.stamp}>Chapter {currentItem.chapter}</span>
                <button
                  type="button"
                  onClick={() => setTourOpen(true)}
                  className={picoClasses.tertiaryButton}
                  data-testid="pico-open-tour"
                >
                  How this works
                </button>
                {onToggleRail ? (
                  <button
                    type="button"
                    onClick={onToggleRail}
                    aria-pressed={!railCollapsed}
                    className={cn(
                      picoClasses.tertiaryButton,
                      !railCollapsed && 'border-[rgba(212,171,115,0.24)] text-[#fff4e6]',
                    )}
                  >
                    Map
                  </button>
                ) : null}
                {onToggleHelpLane ? (
                  <button
                    type="button"
                    onClick={onToggleHelpLane}
                    aria-pressed={helpLaneOpen}
                    className={cn(
                      picoClasses.tertiaryButton,
                      helpLaneOpen && 'border-[rgba(212,171,115,0.24)] text-[#fff4e6]',
                    )}
                  >
                    Help
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-[rgba(255,233,204,0.1)] pt-4">
              <div className="grid gap-1">
                <p className={picoClasses.label}>
                  {eyebrow ?? `Chapter ${currentItem.chapter}`}
                </p>
                <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  {currentItem.label}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-[#d3bea6]">
                  {currentItem.note}. {railCollapsed ? 'Focus mode is active.' : 'The codex map is open.'}
                </p>
              </div>

              <div className="grid gap-1 text-right text-sm text-[#b99879]">
                <span>{title}</span>
                <span>{description}</span>
              </div>
            </div>

            {helpLaneOpen && !isAcademyLessonRoute ? (
              <div
                className="mt-5 grid gap-3 border-t border-[rgba(255,233,204,0.1)] pt-5 lg:grid-cols-3"
                data-testid="pico-help-lane-panel"
              >
                <div className={picoCodexInset('p-4')}>
                  <p className={picoClasses.label}>Stay here when</p>
                  <p className="mt-3 text-sm leading-6 text-[#dbc6ae]">
                    the next move is still visible on this page and you only need a clearer reading of the mission.
                  </p>
                </div>

                <Link href={picoHref(pathname, '/tutor')} className={picoCodexNote('p-4 transition hover:border-[#a1714b]')}>
                  <p className={picoClasses.label}>Exact blocker</p>
                  <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                    Ask tutor
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#f1dfcb]">
                    Use this when a command, path, or validation step is failing.
                  </p>
                </Link>

                <div className="grid gap-3">
                  <Link href={picoHref(pathname, '/autopilot')} className={picoCodexInset('p-4 transition hover:border-[rgba(212,171,115,0.24)] hover:text-[#fff4e6]')}>
                    <p className={picoClasses.label}>Runtime truth</p>
                    <p className="mt-2 text-lg font-medium text-[#fff4e6]">Open Autopilot</p>
                  </Link>
                  <Link href={picoHref(pathname, '/support')} className={picoCodexInset('p-4 transition hover:border-[rgba(212,171,115,0.24)] hover:text-[#fff4e6]')}>
                    <p className={picoClasses.label}>Messy edge</p>
                    <p className="mt-2 text-lg font-medium text-[#fff4e6]">Open support lane</p>
                  </Link>
                </div>
              </div>
            ) : null}
          </header>

          <main className="mt-6 space-y-8">{children}</main>
        </div>

        <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
          <div className={picoCodexFrame('px-3 py-3')}>
            <div className="grid grid-cols-3 gap-2">
              {isAcademyLessonRoute ? (
                <>
                  <Link
                    href={picoHref(pathname, '/academy')}
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e3c7aa]"
                  >
                    Back to map
                  </Link>
                  <a
                    href="#pico-proof-composer"
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.08)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff4e6]"
                  >
                    Proof
                  </a>
                  <a
                    href="#pico-lesson-recovery"
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e3c7aa]"
                  >
                    Help
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#pico-academy-workspace-summary"
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.08)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff4e6]"
                  >
                    Open mission
                  </a>
                  <button
                    type="button"
                    onClick={onToggleRail}
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e3c7aa]"
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={onToggleHelpLane}
                    className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e3c7aa]"
                  >
                    Help
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <PicoWelcomeTour
          open={tourOpen}
          onClose={closeTour}
          currentItem={currentItem}
          previousItem={previousItem}
          nextItem={nextItem}
          pageTitle={title}
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0806] text-[#fff0df]">
      <ShellBackground academyMode={false} />

      <div className="relative mx-auto max-w-[104rem] px-4 py-4 pb-28 sm:px-6 lg:px-8 lg:pb-4">
        <div className="grid gap-6 lg:grid-cols-[17rem,minmax(0,1fr)]">
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <div className={picoPanel('overflow-hidden')}>
              <div className="border-b border-[#3a291d] p-5">
                <PicoWordmark pathname={pathname} />
              </div>

              <div className="border-b border-[#3a291d] px-5 py-4">
                <p className={picoClasses.label}>Current chapter</p>
                <p className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[#fff4e6]">
                  {currentItem.label}
                </p>
                <p className="mt-2 text-sm text-[#c7af93]">{currentItem.note}</p>
              </div>

              <nav className="grid gap-2 p-4">
                {navItems.map((item) => {
                  const active = routeIsActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={picoHref(pathname, item.href)}
                      className={cn(
                        'grid gap-1 rounded-[22px] border px-4 py-3 transition',
                        active
                          ? 'border-[rgba(212,171,115,0.24)] bg-[linear-gradient(180deg,rgba(212,171,115,0.18),rgba(37,31,25,0.28))] text-[#fff0df]'
                          : 'border-[#3e2c20] bg-[rgba(255,247,235,0.03)] text-[#d3b99d] hover:border-[#5d412b] hover:bg-[rgba(255,247,235,0.06)] hover:text-[#fff4e6]',
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b58d65]">
                        {item.chapter}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-[#b59a7f]">{item.note}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <div className="space-y-6">
            <header className={picoPanel('overflow-hidden')}>
              <div className="border-b border-[#3a291d] px-6 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full border border-[rgba(255,233,204,0.12)] bg-[rgba(255,247,235,0.04)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e1a56b]">
                      Chapter {currentItem.chapter}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a8896e]">
                      {currentItem.note}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTourOpen(true)}
                      className={picoClasses.tertiaryButton}
                      data-testid="pico-open-tour"
                    >
                      Quick help
                    </button>
                    {previousItem ? (
                      <Link
                        href={picoHref(pathname, previousItem.href)}
                        aria-label={`Go to previous chapter: ${previousItem.label}`}
                        className={picoClasses.tertiaryButton}
                      >
                        Previous chapter
                      </Link>
                    ) : null}
                    {nextItem ? (
                      <Link
                        href={picoHref(pathname, nextItem.href)}
                        aria-label={`Go to next chapter: ${nextItem.label}`}
                        className={picoClasses.tertiaryButton}
                      >
                        Next chapter
                      </Link>
                    ) : null}
                    {onToggleHelpLane ? (
                      <button type="button" onClick={onToggleHelpLane} className={picoClasses.tertiaryButton}>
                        {helpLaneOpen ? 'Hide recovery' : 'Show recovery'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr),18rem] lg:items-start">
                <div className="grid gap-3">
                  {eyebrow ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a8896e]">
                      {eyebrow}
                    </span>
                  ) : null}
                  <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[#fff4e6] sm:text-6xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[#d2bca2] sm:text-base">
                    {description}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className={picoCodexInset('p-5')}>
                    <p className={picoClasses.label}>Chapter note</p>
                    <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                      {currentItem.note}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#c7af93]">
                      This surface should reduce uncertainty immediately and point to the next irreversible action.
                    </p>
                  </div>
                  {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                </div>
              </div>

              {helpLaneOpen ? (
                <div className="border-t border-[#3a291d] px-6 py-5 sm:px-7" data-testid="pico-help-lane-panel">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className={picoCodexInset('p-4')}>
                      <p className={picoClasses.label}>Stay here when</p>
                      <p className="mt-3 text-sm leading-6 text-[#d5c0a8]">
                        the next move is still inside <span className="text-[#fff4e6]">{currentItem.label}</span>.
                      </p>
                    </div>
                    <Link
                      href={picoHref(pathname, '/support')}
                      className={picoCodexInset('p-4 transition hover:border-[rgba(212,171,115,0.24)] hover:bg-[rgba(255,247,235,0.05)]')}
                    >
                      <p className={picoClasses.label}>Recovery route</p>
                      <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                        Open help lane
                      </p>
                    </Link>
                    <Link
                      href={picoHref(pathname, nextItem?.href ?? '/support')}
                      className={picoCodexInset('p-4 transition hover:border-[rgba(212,171,115,0.24)] hover:bg-[rgba(255,247,235,0.05)]')}
                    >
                      <p className={picoClasses.label}>Continue sequence</p>
                      <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[#fff4e6]">
                        {nextItem ? nextItem.label : 'Human help'}
                      </p>
                    </Link>
                  </div>
                </div>
              ) : null}
            </header>

            <main className="space-y-6">{children}</main>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-2 rounded-[24px] border border-[rgba(255,233,204,0.12)] bg-[rgba(13,12,16,0.94)] p-2 shadow-[0_24px_60px_rgba(2,2,5,0.4)] backdrop-blur">
          <Link
            href={picoHref(pathname, previousItem?.href ?? '/onboarding')}
            aria-label={previousItem ? `Go to previous chapter: ${previousItem.label}` : 'Go to onboarding'}
            className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-medium uppercase tracking-[0.16em] text-[#d9c1a4]"
          >
            Prev
          </Link>

          <div className="min-w-0 px-2">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8896e]">
              Chapter {currentItem.chapter}
            </p>
            <p className="truncate font-[family:var(--font-site-display)] text-xl tracking-[-0.05em] text-[#fff4e6]">
              {currentItem.label}
            </p>
          </div>

          <Link
            href={picoHref(pathname, nextItem?.href ?? '/support')}
            aria-label={nextItem ? `Go to next chapter: ${nextItem.label}` : 'Go to support'}
            className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(255,233,204,0.12)] px-3 text-xs font-medium uppercase tracking-[0.16em] text-[#d9c1a4]"
          >
            Next
          </Link>

          <Link
            href={picoHref(pathname, currentItem.href === '/support' ? '/academy' : '/support')}
            aria-label={currentItem.href === '/support' ? 'Open academy map' : 'Open help lane'}
            className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-[rgba(212,171,115,0.28)] bg-[linear-gradient(135deg,#f2dfc4_0%,#c89b62_100%)] px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f0d11]"
          >
            {currentItem.href === '/support' ? 'Map' : 'Help'}
          </Link>
        </div>
      </div>

      <PicoWelcomeTour
        open={tourOpen}
        onClose={closeTour}
        currentItem={currentItem}
        previousItem={previousItem}
        nextItem={nextItem}
        pageTitle={title}
      />
    </div>
  )
}
