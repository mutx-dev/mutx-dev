import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import core from '@/components/site/marketing/MarketingCore.module.css'

const SITE = 'https://mutx.dev'

const atlasLinks = [
  { href: '/pico/onboarding', label: 'Onboarding', note: 'first visible win' },
  { href: '/pico/academy', label: 'Academy', note: 'the working path' },
  { href: '/pico/tutor', label: 'Tutor', note: 'grounded critique' },
  { href: '/pico/autopilot', label: 'Autopilot', note: 'live control room' },
  { href: '/pico/support', label: 'Support', note: 'the messy edge' },
] as const

const mutxLinks: Array<{
  href: string
  labelKey: string
  external?: boolean
}> = [
  { href: `${SITE}/releases`, labelKey: 'links.releases' },
  { href: 'https://docs.mutx.dev', labelKey: 'links.docs', external: true },
  { href: 'https://github.com/mutx-dev/mutx-dev', labelKey: 'links.github', external: true },
  { href: `${SITE}/download`, labelKey: 'links.download' },
  { href: `${SITE}/contact`, labelKey: 'links.contact' },
  { href: `${SITE}/privacy-policy`, labelKey: 'links.privacy' },
] as const

export function PicoFooter({
  className,
  showAtlasLinks = true,
}: {
  className?: string
  showAtlasLinks?: boolean
}) {
  const t = useTranslations('pico.footer')

  return (
    <footer
      data-testid="pico-footer"
      className={cn(
        className,
        'relative z-[1] border-t border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(6,12,8,0.96),rgba(2,6,3,0.99))] text-[color:var(--pico-text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
      )}
    >
      <div className={cn(core.shell, 'grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr),minmax(0,0.8fr)]')}>
        <div className="grid gap-5">
          <Link href="/pico" className="inline-flex w-fit items-center gap-3 text-[color:var(--pico-text)] no-underline">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-[color:var(--pico-border)] bg-[linear-gradient(145deg,rgba(var(--pico-accent-rgb),0.12),rgba(8,18,10,0.82))] shadow-[0_16px_36px_rgba(0,0,0,0.26)]">
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={22} height={22} />
            </span>
            <span className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]">
                PicoMUTX
              </span>
              <span className="font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em]">
                operator atlas
              </span>
            </span>
          </Link>

          <p className="max-w-[32rem] text-sm leading-7 text-[color:var(--pico-text-secondary)]">
            Pico should feel like one premium studio product from the first lesson to the messy edge.
            The route matters. The proof matters. Human help is the last lane, not the default one.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.22)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent-bright)]">
              green studio system
            </span>
            <span className="inline-flex rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.22)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent-bright)]">
              proof-first learning
            </span>
            <span className="inline-flex rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.22)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent-bright)]">
              premium operator flow
            </span>
          </div>
        </div>

        {showAtlasLinks ? (
          <div className="grid gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]">
              Atlas routes
            </p>
            <div className="grid gap-2">
              {atlasLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="grid gap-1 rounded-[20px] border border-[color:rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] px-4 py-3 no-underline transition duration-200 hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(var(--pico-accent-rgb),0.08)]"
                >
                  <span className="font-medium text-[color:var(--pico-text)]">{item.label}</span>
                  <span className="text-xs text-[color:var(--pico-text-muted)]">{item.note}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]">
            MUTX links
          </p>
          <div className="grid gap-2">
            {mutxLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center rounded-[18px] border border-[color:rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] px-4 py-3 text-sm text-[color:var(--pico-text-secondary)] no-underline transition duration-200 hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[color:var(--pico-text)]"
              >
                {t(item.labelKey)}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[color:rgba(255,255,255,0.05)]">
        <div className={cn(core.shell, 'flex flex-wrap items-center justify-between gap-3 py-4')}>
          <p className="text-sm text-[color:var(--pico-text-muted)]">{t('copyright')}</p>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--pico-text-muted)]">
            pico.mutx.dev / operator atlas
          </p>
        </div>
      </div>
    </footer>
  )
}
