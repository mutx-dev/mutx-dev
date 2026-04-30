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
import { PicoFooter } from '@/components/pico/PicoFooter'
import { PicoWelcomeTour } from '@/components/pico/PicoWelcomeTour'
import { getPicoRouteRobot } from '@/lib/picoRobotArt'
import { picoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/onboarding', label: 'Start', chapter: '01', note: 'install and packet' },
  { href: '/academy', label: 'Lessons', chapter: '02', note: 'step-by-step setup' },
  { href: '/tutor', label: 'Tutor', chapter: '03', note: 'one blocked command' },
  { href: '/autopilot', label: 'Autopilot', chapter: '04', note: 'runtime review' },
  { href: '/support', label: 'Human help', chapter: '05', note: '1-on-1 setup help' },
] as const

const PICO_WELCOME_TOUR_STORAGE_KEY = 'pico.welcome-tour.dismissed.v2'

type PicoShellProps = {
  eyebrow?: string
  title: string
  description: string
  heroContent?: ReactNode
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
            ? 'bg-[radial-gradient(circle_at_18%_0%,rgba(var(--pico-accent-rgb),0.1),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(104,214,255,0.06),transparent_18%),linear-gradient(180deg,#080c0a_0%,#050706_52%,#030504_100%)]'
            : 'bg-[radial-gradient(circle_at_18%_0%,rgba(var(--pico-accent-rgb),0.08),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(104,214,255,0.055),transparent_18%),linear-gradient(180deg,#080c0a_0%,#030504_100%)]',
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.95),transparent_92%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(var(--pico-accent-rgb),0.08),transparent_44%)]"
      />
    </>
  )
}

function PicoWordmark({ pathname }: { pathname: string }) {
  return (
    <Link href={picoHref(pathname, '/onboarding')} className="inline-flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px] border border-[color:var(--pico-border)] bg-[linear-gradient(145deg,rgba(var(--pico-accent-rgb),0.1),rgba(8,18,10,0.82))] shadow-[0_14px_28px_rgba(0,0,0,0.24),0_0_22px_rgba(var(--pico-accent-rgb),0.1)]">
        <Image src="/pico/logo.png" alt="PicoMUTX logo" width={28} height={28} priority />
      </span>
      <span className="grid gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--pico-text-muted)]">
          PicoMUTX
        </span>
        <span className="font-[family:var(--font-site-display)] text-xl tracking-[-0.035em] text-[color:var(--pico-text)]">
          cockpit
        </span>
      </span>
    </Link>
  )
}

function ShellRobotCard({
  title,
  caption,
  src,
  alt,
}: {
  title: string
  caption: string
  src: string
  alt: string
}) {
  return (
    <div className={picoCodexInset('grid gap-3 overflow-hidden p-3')}>
      <div className="flex items-center gap-3">
        <div className="w-16 shrink-0 overflow-hidden rounded-[12px] border border-[rgba(var(--pico-accent-rgb),0.18)] bg-[radial-gradient(circle_at_50%_14%,rgba(var(--pico-accent-rgb),0.14),transparent_52%),linear-gradient(180deg,rgba(6,12,8,0.98),rgba(2,4,3,1))]">
          <Image
            src={src}
            alt={alt}
            width={512}
            height={512}
            className="h-auto w-full p-1.5"
            sizes="4rem"
          />
        </div>
        <div className="min-w-0">
          <p className={picoClasses.label}>Pico guide</p>
          <p className="mt-1 truncate font-[family:var(--font-site-display)] text-xl tracking-[-0.035em] text-[color:var(--pico-text)]">
            {title}
          </p>
        </div>
      </div>
      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
        {caption}
      </p>
    </div>
  )
}

function ShellHelpLane({
  pathname,
  currentItem,
  nextItem,
}: {
  pathname: string
  currentItem: (typeof navItems)[number]
  nextItem: (typeof navItems)[number] | null
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3" data-testid="pico-help-lane-panel">
      <div className={picoCodexInset('p-4')}>
        <p className={picoClasses.label}>Stay here when</p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
          the next move is still inside{' '}
          <span className="text-[color:var(--pico-text)]">{currentItem.label}</span>.
        </p>
      </div>
      <Link
        href={picoHref(pathname, '/support')}
        className={picoCodexNote(
          'p-4 transition duration-200 hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(var(--pico-accent-rgb),0.16)]',
        )}
      >
        <p className={picoClasses.label}>Setup help</p>
        <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
          Get setup help
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
          Use this when setup needs API keys, hosting decisions, or custom implementation.
        </p>
      </Link>
      <Link
        href={picoHref(pathname, nextItem?.href ?? '/support')}
        className={picoCodexInset(
          'p-4 transition duration-200 hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(255,255,255,0.03)]',
        )}
      >
        <p className={picoClasses.label}>Continue sequence</p>
        <p className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
          {nextItem ? nextItem.label : 'Human help'}
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
          Continue when the next step is already clear.
        </p>
      </Link>
    </div>
  )
}

export function PicoShell({
  eyebrow,
  title,
  description,
  heroContent,
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
  const currentItem = navItems.find((item) => routeIsActive(pathname, item.href)) ?? navItems[0]
  const routeRobot = getPicoRouteRobot(pathname, academyMode)
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
      <div className="relative min-h-screen overflow-hidden bg-[color:var(--pico-bg)] text-[color:var(--pico-text)]">
        <ShellBackground academyMode />

        <div className="relative mx-auto max-w-[98rem] px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-12">
          <header className={picoCodexFrame('overflow-hidden px-5 py-5 sm:px-6 lg:px-8')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <PicoWordmark pathname={pathname} />

              <div className="flex flex-wrap items-center gap-2">
                <span className={picoCodex.stamp}>Chapter {currentItem.chapter}</span>
                <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
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
                        !railCollapsed &&
                          'border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.08)] text-[color:var(--pico-text)]',
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
                        helpLaneOpen &&
                          'border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.08)] text-[color:var(--pico-text)]',
                      )}
                    >
                      Help
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-[color:var(--pico-border)] pt-5 lg:grid-cols-[minmax(0,1fr),22rem] lg:items-end">
              <div className="grid gap-2">
                <div className="sm:hidden">
                  <button
                    type="button"
                    onClick={() => setTourOpen(true)}
                    className={picoClasses.tertiaryButton}
                    data-testid="pico-open-tour-mobile"
                  >
                    How this works
                  </button>
                </div>
                <p className={picoClasses.label}>{eyebrow ?? `Chapter ${currentItem.chapter}`}</p>
                <p className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
                  {title}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)] sm:text-base">
                  {description}
                </p>
                {heroContent ? <div className="mt-5">{heroContent}</div> : null}
              </div>

              <div className="grid gap-4">
                <div className={picoCodexInset('grid gap-3 p-4 lg:p-5')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={picoClasses.label}>Route mode</p>
                    <span className={picoCodex.stamp}>{currentItem.label}</span>
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {currentItem.note}. {railCollapsed ? 'Focus mode is active.' : 'The map stays open.'}
                  </p>
                  <div className="grid gap-1 text-[11px] uppercase tracking-[0.22em] text-[color:var(--pico-text-muted)]">
                    <span>{previousItem ? `Previous: ${previousItem.label}` : 'Start of sequence'}</span>
                    <span>{nextItem ? `Next: ${nextItem.label}` : 'Final chapter'}</span>
                  </div>
                </div>
                <ShellRobotCard
                  title={routeRobot.title}
                  caption={routeRobot.caption}
                  src={routeRobot.src}
                  alt={routeRobot.alt}
                />
              </div>
            </div>

            {helpLaneOpen && !isAcademyLessonRoute ? (
              <div className="mt-5 border-t border-[color:var(--pico-border)] pt-5">
                <ShellHelpLane pathname={pathname} currentItem={currentItem} nextItem={nextItem} />
              </div>
            ) : null}
          </header>

          <main className="mt-6 space-y-8">{children}</main>
        </div>

        <PicoFooter />

        <div className="hidden">
          <div className={picoCodexFrame('px-2 py-2 shadow-[0_18px_44px_rgba(0,0,0,0.38)]')}>
            <div className="grid grid-cols-3 gap-2">
              {isAcademyLessonRoute ? (
                <>
                  <Link
                    href={picoHref(pathname, '/academy')}
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-secondary)]"
                  >
                    Map
                  </Link>
                  <a
                    href="#pico-proof-composer"
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text)]"
                  >
                    Proof
                  </a>
                  <a
                    href="#pico-lesson-recovery"
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-secondary)]"
                  >
                    Help
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#pico-academy-workspace-summary"
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text)]"
                  >
                    Mission
                  </a>
                  <button
                    type="button"
                    onClick={onToggleRail}
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-secondary)]"
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={onToggleHelpLane}
                    className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-secondary)]"
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
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--pico-bg)] text-[color:var(--pico-text)]">
      <ShellBackground academyMode={false} />

      <div className="relative mx-auto max-w-[104rem] px-3 py-4 pb-28 sm:px-5 lg:px-6 lg:pb-4">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[16rem,minmax(0,1fr)]">
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <div className={picoPanel('overflow-hidden')}>
              <div className="border-b border-[color:var(--pico-border)] p-4">
                <PicoWordmark pathname={pathname} />
              </div>

              <div className="border-b border-[color:var(--pico-border)] px-4 py-3">
                <p className={picoClasses.label}>Current chapter</p>
                <p className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.035em] text-[color:var(--pico-text)]">
                  {currentItem.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[color:var(--pico-text-secondary)]">{currentItem.note}</p>
              </div>

              <nav className="grid gap-1.5 p-3">
                {navItems.map((item) => {
                  const active = routeIsActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={picoHref(pathname, item.href)}
                      className={cn(
                        'grid gap-1 rounded-[12px] border px-3 py-2.5 transition duration-200',
                        active
                          ? 'border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.13),rgba(10,16,12,0.32))] text-[color:var(--pico-text)] shadow-[0_12px_32px_rgba(var(--pico-accent-rgb),0.07)]'
                          : 'border-[color:rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] text-[color:var(--pico-text-secondary)] hover:border-[color:var(--pico-border)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[color:var(--pico-text)]',
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-text-muted)]">
                        {item.chapter}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-[color:var(--pico-text-muted)]">{item.note}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <header className={picoPanel('overflow-hidden')}>
              <div className="border-b border-[color:var(--pico-border)] px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-[9px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[color:var(--pico-accent-bright)]">
                      Chapter {currentItem.chapter}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pico-text-muted)]">
                      {currentItem.note}
                    </span>
                  </div>

                  <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
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

              <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr),18rem] lg:items-start">
                <div className="grid min-w-0 gap-3">
                  <div className="grid gap-2 sm:hidden">
                    <button
                      type="button"
                      onClick={() => setTourOpen(true)}
                      className={picoClasses.tertiaryButton}
                      data-testid="pico-open-tour-mobile"
                    >
                      Quick help
                    </button>
                    {nextItem ? (
                      <Link
                        href={picoHref(pathname, nextItem.href)}
                        aria-label={`Go to next chapter: ${nextItem.label}`}
                        className={picoClasses.tertiaryButton}
                      >
                        Next chapter
                      </Link>
                    ) : null}
                  </div>
                  {eyebrow ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pico-text-muted)]">
                      {eyebrow}
                    </span>
                  ) : null}
                  <h1 className="max-w-4xl font-[family:var(--font-site-display)] text-4xl leading-[1.02] tracking-[-0.04em] text-[color:var(--pico-text)] sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)] sm:text-base">
                    {description}
                  </p>
                  {heroContent ? <div className="pt-1">{heroContent}</div> : null}
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="hidden lg:block">
                    <ShellRobotCard
                      title={routeRobot.title}
                      caption={routeRobot.caption}
                      src={routeRobot.src}
                      alt={routeRobot.alt}
                    />
                  </div>
                  <div className={picoCodexInset('p-4')}>
                    <p className={picoClasses.label}>Chapter note</p>
                    <p className="mt-2 font-[family:var(--font-site-display)] text-xl tracking-[-0.035em] text-[color:var(--pico-text)]">
                      {currentItem.note}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Use this chapter to keep setup moving and choose the next practical action.
                    </p>
                  </div>
                  {actions ? (
                    <div className="grid w-full min-w-0 gap-3 [&>*]:min-w-0 [&>*]:w-full sm:flex sm:flex-wrap sm:[&>*]:w-auto">
                      {actions}
                    </div>
                  ) : null}
                </div>
              </div>

              {helpLaneOpen ? (
                <div className="border-t border-[color:var(--pico-border)] px-6 py-5 sm:px-7">
                  <ShellHelpLane pathname={pathname} currentItem={currentItem} nextItem={nextItem} />
                </div>
              ) : null}
            </header>

            <main className="space-y-6">{children}</main>
          </div>
        </div>
      </div>

      <PicoFooter />

      <div className="hidden">
        <div className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-1.5 rounded-[16px] border border-[color:var(--pico-border)] bg-[rgba(6,12,8,0.9)] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.36)] backdrop-blur">
          <Link
            href={picoHref(pathname, previousItem?.href ?? '/onboarding')}
            aria-label={previousItem ? `Go to previous chapter: ${previousItem.label}` : 'Go to onboarding'}
            className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[color:var(--pico-text-secondary)]"
          >
            Prev
          </Link>

          <div className="min-w-0 px-1">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-muted)]">
              Chapter {currentItem.chapter}
            </p>
            <p className="truncate font-[family:var(--font-site-display)] text-base tracking-[-0.035em] text-[color:var(--pico-text)]">
              {currentItem.label}
            </p>
          </div>

          <Link
            href={picoHref(pathname, nextItem?.href ?? '/support')}
            aria-label={nextItem ? `Go to next chapter: ${nextItem.label}` : 'Go to support'}
            className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:var(--pico-border)] px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[color:var(--pico-text-secondary)]"
          >
            Next
          </Link>

          <Link
            href={picoHref(pathname, currentItem.href === '/support' ? '/academy' : '/support')}
            aria-label={currentItem.href === '/support' ? 'Open academy map' : 'Open help'}
            className="inline-flex min-h-9 items-center justify-center rounded-[11px] border border-[color:rgba(var(--pico-accent-rgb),0.28)] bg-[linear-gradient(135deg,var(--pico-accent-bright)_0%,var(--pico-accent)_48%,var(--pico-accent-deep)_100%)] px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--pico-accent-contrast)]"
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
