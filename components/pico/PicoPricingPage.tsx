'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { PicoContactForm } from '@/components/pico/PicoContactForm'
import { PicoFooter } from '@/components/pico/PicoFooter'
import { PicoLangSwitcher } from '@/components/pico/PicoLangSwitcher'
import { PicoSessionBanner } from '@/components/pico/PicoSessionBanner'
import {
  picoClasses,
  picoCodex,
  picoCodexFrame,
  picoCodexNote,
  picoCodexSheet,
  picoEmber,
  picoInset,
  picoPanel,
  picoSoft,
} from '@/components/pico/picoTheme'
import { usePicoSession } from '@/components/pico/usePicoSession'
import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'
import { usePicoHref } from '@/lib/pico/navigation'
import { picoRobotArtById } from '@/lib/picoRobotArt'
import { cn } from '@/lib/utils'

type AccessTierContent = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  anchorPrice?: string
  priceNote?: string
  recommended?: boolean
}

type LivePlanId = 'free' | 'starter' | 'pro' | 'enterprise'

type LivePlanContent = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
}

const ACCESS_TIER_IDS = ['trial', 'starter', 'pro', 'enterprise'] as const

const LIVE_PLAN_CONFIG: Array<{
  id: LivePlanId
  priceId: string | null
  highlight: boolean
  supportHref?: string
}> = [
  {
    id: 'free',
    priceId: null,
    highlight: false,
  },
  {
    id: 'starter',
    priceId: 'price_1TMrgMLqNfXHzKqSL3dPg1JS',
    highlight: true,
  },
  {
    id: 'pro',
    priceId: 'price_1TMrdKLqNfXHzKqS15LrJt9C',
    highlight: false,
  },
  {
    id: 'enterprise',
    priceId: null,
    highlight: false,
    supportHref: 'https://calendly.com/mutxdev',
  },
]

function formatShortDate(locale: string, value?: string | null) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }

  return parsed.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCompactNumber(locale: string, value?: number | null) {
  if (typeof value !== 'number') return '—'

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatHostLabel(value?: string | null) {
  if (!value) return null

  try {
    return new URL(value).host.replace(/^www\./, '')
  } catch {
    return value
  }
}

export function PicoPricingPage() {
  const pathname = usePathname()
  const locale = useLocale()
  const pageT = useTranslations('pico.pricingPage')
  const session = usePicoSession()
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [formInterest, setFormInterest] = useState<string | undefined>()
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const pricingRobot = picoRobotArtById.coins
  const generated = PICO_GENERATED_CONTENT
  const packSnapshot = generated.packSnapshot
  const currentPlanId =
    session.status === 'authenticated' ? session.user.plan?.toLowerCase() ?? null : null

  const accessPlans = ACCESS_TIER_IDS.map((id) => ({
    id,
    ...(pageT.raw(`accessPlans.tiers.${id}`) as AccessTierContent),
  }))

  const accessTruths = pageT.raw('accessPlans.truths') as string[]

  const livePlans = LIVE_PLAN_CONFIG.map((plan) => ({
    ...plan,
    ...(pageT.raw(`livePlans.tiers.${plan.id}`) as LivePlanContent),
  }))

  const liveTruths = pageT.raw('livePlans.truths') as string[]

  function openPricingForm(interest?: string) {
    setFormInterest(interest)
    setFormOpen(true)
  }

  async function handleCheckout(planId: string, priceId: string) {
    setLoading(planId)
    setCheckoutError(null)

    try {
      const res = await fetch('/api/pico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(toHref('/pricing'))}`
        return
      }

      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          typeof payload?.error === 'string' && payload.error
            ? payload.error
            : typeof payload?.detail === 'string' && payload.detail
              ? payload.detail
              : pageT('livePlans.checkoutError'),
        )
      }

      const url =
        typeof payload?.url === 'string'
          ? payload.url
          : typeof payload?.checkout_url === 'string'
            ? payload.checkout_url
            : null

      if (url) {
        window.location.href = url
        return
      }

      setCheckoutError(pageT('livePlans.checkoutError'))
    } catch (error) {
      setCheckoutError(
        error instanceof Error && error.message ? error.message : pageT('livePlans.checkoutError'),
      )
    } finally {
      setLoading(null)
    }
  }

  const sessionChip =
    session.status === 'authenticated'
      ? pageT('routeState.sessionAttached')
      : session.status === 'loading'
        ? pageT('routeState.sessionLoading')
        : pageT('routeState.sessionMissing')

  const sessionPlan =
    session.status === 'authenticated' && session.user.plan
      ? session.user.plan.toLowerCase()
      : pageT('routeState.planFallback')

  return (
    <>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={formInterest}
        source="pico-pricing"
      />

      <div
        className="relative min-h-screen overflow-hidden bg-[color:var(--pico-bg)] text-[color:var(--pico-text)]"
        data-testid="pico-pricing-route"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(var(--pico-accent-rgb),0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(115,239,190,0.08),transparent_18%),linear-gradient(180deg,#081108_0%,#030603_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.95),transparent_92%)]"
        />

        <div className="relative mx-auto max-w-[106rem] px-4 py-5 pb-16 sm:px-6 lg:px-8">
          <header className={picoCodexFrame('overflow-hidden')}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--pico-border)] px-6 py-4 sm:px-7">
              <Link href={toHref('/')} className="inline-flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-[color:var(--pico-border)] bg-[linear-gradient(145deg,rgba(var(--pico-accent-rgb),0.1),rgba(8,18,10,0.82))] shadow-[0_18px_36px_rgba(0,0,0,0.28),0_0_28px_rgba(var(--pico-accent-rgb),0.12)]">
                  <Image src="/pico/logo.png" alt="PicoMUTX logo" width={24} height={24} priority />
                </span>
                <span className="grid gap-0.5">
                  <span className={picoClasses.label}>PicoMUTX</span>
                  <span className="font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {pageT('eyebrow')}
                  </span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <PicoLangSwitcher />
                <span className={picoClasses.chip}>{pageT('eyebrow')}</span>
                <Link href={toHref('/support')} className={picoClasses.tertiaryButton}>
                  {pageT('secondaryCta')}
                </Link>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.06fr),22rem]">
              <div className="grid gap-5">
                <div className="grid gap-3">
                  <p className={picoClasses.label}>{pageT('eyebrow')}</p>
                  <h1 className="max-w-[11ch] font-[family:var(--font-site-display)] text-[clamp(2.8rem,10vw,4.8rem)] leading-[0.92] tracking-[-0.065em] text-[color:var(--pico-text)] sm:max-w-[11ch]">
                    {pageT('title')}
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                    {pageT('subtitle')}
                  </p>
                </div>

                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => openPricingForm('build')}
                    className={picoClasses.primaryButton}
                  >
                    {pageT('primaryCta')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link href={toHref('/support')} className={picoClasses.secondaryButton}>
                    {pageT('secondaryCta')}
                  </Link>
                  <Link href={`${toHref('/')}#pricing`} className={picoClasses.tertiaryButton}>
                    {pageT('returnToLanding')}
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {accessTruths.map((item, index) => (
                    <div key={item} className={picoInset('p-4')}>
                      <p className={picoClasses.label}>0{index + 1}</p>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-sm leading-6 text-[color:var(--pico-text-muted)]">
                  {pageT('accessPlans.meta')}
                </p>
              </div>

              <div className="grid gap-4">
                <div className={picoCodexSheet('overflow-hidden p-4 sm:p-5')}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={picoClasses.label}>{pageT('routeState.signalLabel')}</p>
                    <span className={picoCodex.stamp}>{sessionChip}</span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[rgba(var(--pico-accent-rgb),0.2)] bg-[radial-gradient(circle_at_50%_14%,rgba(var(--pico-accent-rgb),0.18),transparent_52%),linear-gradient(180deg,rgba(6,12,6,0.98),rgba(2,4,2,1))]">
                    <Image
                      src={pricingRobot.src}
                      alt={pricingRobot.alt}
                      width={512}
                      height={512}
                      className="h-auto w-full p-3"
                      sizes="(max-width: 1024px) 100vw, 20rem"
                    />
                  </div>
                </div>

                <div className={picoSoft('grid gap-4 p-4 sm:p-5')}>
                  <div>
                    <p className={picoClasses.label}>{pageT('routeState.label')}</p>
                    <p className="mt-3 font-[family:var(--font-site-display)] text-2xl leading-[1.02] tracking-[-0.05em] text-[color:var(--pico-text)]">
                      {pageT('routeState.title')}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {pageT('routeState.body')}
                  </p>
                  <div className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                      <span>{pageT('routeState.planLabel')}</span>
                      <span className="text-[color:var(--pico-text)]">{sessionPlan}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                      <span>{pageT('routeState.docsLabel')}</span>
                      <span className="text-[color:var(--pico-text)]">{packSnapshot.visibleDocCount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{pageT('routeState.stacksLabel')}</span>
                      <span className="text-[color:var(--pico-text)]">{generated.stacks.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mt-6 space-y-6">
            <PicoSessionBanner session={session} nextPath={pathname} />

            <section
              className={picoPanel('overflow-hidden')}
              data-testid="pico-pricing-access-lanes"
            >
              <div className="grid gap-6 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,0.82fr),minmax(0,1.18fr)]">
                <div className="grid gap-4">
                  <div>
                    <p className={picoClasses.label}>{pageT('accessPlans.label')}</p>
                    <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                      {pageT('accessPlans.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                      {pageT('accessPlans.body')}
                    </p>
                  </div>

                  <div className={picoCodexNote('p-4 sm:p-5')}>
                    <p className={picoClasses.label}>{pageT('accessPlans.noteLabel')}</p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {pageT('accessPlans.note')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  {accessPlans.map((plan) => {
                    const isHighlighted = plan.recommended ?? false

                    return (
                      <article
                        key={plan.id}
                        className={cn(
                          picoInset('flex h-full flex-col gap-5 p-5'),
                          isHighlighted &&
                            'border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.16),rgba(10,19,11,0.34))] shadow-[0_24px_56px_rgba(var(--pico-accent-rgb),0.08)]',
                        )}
                      >
                        <div className="grid gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[color:var(--pico-text)]">
                              {plan.name}
                            </p>
                            {isHighlighted ? (
                              <span className={picoClasses.chip}>{pageT('accessPlans.recommended')}</span>
                            ) : null}
                          </div>

                          <div className="grid gap-1">
                            {plan.anchorPrice ? (
                              <span className="text-sm font-semibold tracking-[0.01em] text-[rgba(255,255,255,0.48)] [text-decoration:line-through] [text-decoration-color:rgba(var(--pico-accent-rgb),0.7)]">
                                {plan.anchorPrice}
                              </span>
                            ) : null}
                            <div className="flex items-end gap-2">
                              <span className="font-[family:var(--font-site-display)] text-5xl leading-none tracking-[-0.07em] text-[color:var(--pico-text)]">
                                {plan.price}
                              </span>
                              <span className="pb-1 text-sm text-[color:var(--pico-text-muted)]">
                                {plan.period}
                              </span>
                            </div>
                          </div>

                          {plan.priceNote ? (
                            <p className="text-xs leading-5 text-[color:var(--pico-accent-bright)]">
                              {plan.priceNote}
                            </p>
                          ) : null}

                          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {plan.description}
                          </p>
                        </div>

                        <ul className="grid gap-3">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]"
                            >
                              <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--pico-accent)]" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-2">
                          {plan.id === 'enterprise' ? (
                            <Link href={toHref('/support')} className={picoClasses.secondaryButton}>
                              {plan.cta}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (plan.id === 'trial' || plan.id === 'starter') {
                                  openPricingForm('build')
                                  return
                                }

                                openPricingForm('fix')
                              }}
                              className={cn(
                                'w-full',
                                isHighlighted ? picoClasses.primaryButton : picoClasses.secondaryButton,
                              )}
                            >
                              {plan.cta}
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className={picoPanel('overflow-hidden')} data-testid="pico-pricing-live-plans">
              <div className="border-b border-[color:var(--pico-border)] px-6 py-4 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={picoClasses.label}>{pageT('livePlans.label')}</p>
                    <h2 className="mt-3 max-w-4xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                      {pageT('livePlans.title')}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                      {pageT('livePlans.body')}
                    </p>
                  </div>
                  <span className={picoClasses.chip}>{pageT('livePlans.badge')}</span>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-7 xl:grid-cols-[18rem,minmax(0,1fr)]">
                <div className="grid content-start gap-3">
                  {liveTruths.map((item) => (
                    <div key={item} className={picoInset('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{item}</p>
                    </div>
                  ))}

                  {checkoutError ? (
                    <div className={picoEmber('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text)]">{checkoutError}</p>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {livePlans.map((plan) => {
                    const isCurrent = currentPlanId === plan.id

                    return (
                      <article
                        key={plan.id}
                        className={cn(
                          picoInset('flex h-full flex-col gap-5 p-5'),
                          plan.highlight &&
                            'border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.12),rgba(10,19,11,0.26))] shadow-[0_20px_52px_rgba(var(--pico-accent-rgb),0.07)]',
                        )}
                      >
                        <div className="grid gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[color:var(--pico-text)]">
                              {plan.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {plan.highlight ? (
                                <span className={picoClasses.chip}>{pageT('livePlans.badgePopular')}</span>
                              ) : null}
                              {isCurrent ? (
                                <span className={picoClasses.chip}>{pageT('livePlans.currentPlan')}</span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-end gap-2">
                            <span className="font-[family:var(--font-site-display)] text-5xl leading-none tracking-[-0.07em] text-[color:var(--pico-text)]">
                              {plan.price}
                            </span>
                            <span className="pb-1 text-sm text-[color:var(--pico-text-muted)]">
                              {plan.period}
                            </span>
                          </div>

                          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {plan.description}
                          </p>
                        </div>

                        <ul className="grid gap-3">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]"
                            >
                              <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--pico-accent)]" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-2">
                          {plan.priceId ? (
                            <button
                              type="button"
                              onClick={() => handleCheckout(plan.id, plan.priceId!)}
                              disabled={loading === plan.id}
                              className={cn(
                                'w-full',
                                plan.highlight ? picoClasses.primaryButton : picoClasses.secondaryButton,
                                loading === plan.id && 'opacity-70',
                              )}
                            >
                              {loading === plan.id ? pageT('livePlans.loading') : plan.cta}
                            </button>
                          ) : plan.supportHref ? (
                            <a
                              href={plan.supportHref}
                              target="_blank"
                              rel="noreferrer"
                              className={picoClasses.secondaryButton}
                            >
                              {plan.cta}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <Link
                              href={
                                session.status === 'authenticated'
                                  ? toHref('/onboarding')
                                  : `/login?next=${encodeURIComponent(toHref('/onboarding'))}`
                              }
                              className={picoClasses.secondaryButton}
                            >
                              {plan.cta}
                            </Link>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr),minmax(0,1.22fr)]">
              <div className={picoPanel('p-6 sm:p-7')}>
                <p className={picoClasses.label}>{pageT('stackLabel')}</p>
                <h2 className="mt-3 max-w-2xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                  {pageT('stackTitle')}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                  {pageT('stackBody')}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {generated.pricing.truthStrip.map((item) => (
                    <div key={item} className={picoInset('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-muted)]">
                    {pageT('stackFooterPrefix')}{' '}
                  <span className="text-[color:var(--pico-text)]">
                    {formatShortDate(locale, packSnapshot.refreshedAt)}
                  </span>{' '}
                  {pageT('stackFooterMiddle')}{' '}
                  <span className="text-[color:var(--pico-text)]">{packSnapshot.visibleDocCount}</span>{' '}
                  {pageT('stackFooterDocs')}{' '}
                  <span className="text-[color:var(--pico-text)]">{generated.stacks.length}</span>{' '}
                  {pageT('stackFooterStacks')}
                </p>
              </div>

              <div className={picoPanel('p-6 sm:p-7')}>
                <div className="grid gap-3 md:grid-cols-2">
                  {generated.stacks.slice(0, 4).map((stack) => (
                    <article key={stack.id} className={picoInset('grid gap-4 p-4')}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={picoClasses.label}>{stack.name}</p>
                          <h3 className="mt-2 font-[family:var(--font-site-display)] text-2xl leading-[1.02] tracking-[-0.05em] text-[color:var(--pico-text)]">
                            {stack.live?.latestRef?.label ?? stack.name}
                          </h3>
                        </div>
                        <div className="text-right text-xs leading-5 text-[color:var(--pico-text-muted)]">
                          <div>★ {formatCompactNumber(locale, stack.live?.stars)}</div>
                          <div>{formatShortDate(locale, stack.live?.latestRef?.publishedAt ?? stack.live?.pushedAt)}</div>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {stack.strengths.slice(0, 2).map((item) => (
                          <div key={item} className="flex gap-2">
                            <span className="text-[color:var(--pico-accent)]">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {stack.docsUrl ? (
                          <a
                            href={stack.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[color:var(--pico-accent-bright)] transition hover:text-[color:var(--pico-accent)]"
                          >
                            {formatHostLabel(stack.docsUrl)}
                          </a>
                        ) : null}
                        {stack.repoUrl ? (
                          <a
                            href={stack.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[color:var(--pico-text-secondary)] transition hover:text-[color:var(--pico-text)]"
                          >
                            {formatHostLabel(stack.repoUrl)}
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className={picoCodexFrame('overflow-hidden p-6 sm:p-7')}>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
                <div>
                  <p className={picoClasses.label}>{pageT('finalLabel')}</p>
                  <h2 className="mt-3 max-w-3xl font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                    {pageT('finalTitle')}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                    {pageT('finalBody')}
                  </p>
                </div>

                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <Link href={toHref('/support')} className={picoClasses.primaryButton}>
                    {pageT('finalPrimary')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={toHref('/')} className={picoClasses.secondaryButton}>
                    {pageT('finalSecondary')}
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>

        <PicoFooter />
      </div>
    </>
  )
}
