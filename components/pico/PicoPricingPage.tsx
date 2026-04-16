'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'
import { picoRobotArtById } from '@/lib/picoRobotArt'

type PricingTierId = 'free' | 'starter' | 'pro' | 'enterprise'

type PricingTierContent = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
}

const PLAN_CONFIG: Array<{
  id: PricingTierId
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

function formatShortDate(value?: string | null) {
  if (!value) return 'Unavailable'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unavailable'
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCompactNumber(value?: number | null) {
  if (typeof value !== 'number') return 'n/a'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function PicoPricingPage() {
  const t = useTranslations('pico')
  const pageT = useTranslations('pico.pricingPage')
  const [loading, setLoading] = useState<string | null>(null)
  const pricingRobot = picoRobotArtById.coins
  const generated = PICO_GENERATED_CONTENT
  const plans = PLAN_CONFIG.map((plan) => ({
    ...plan,
    ...(t.raw(`pricing.tiers.${plan.id}`) as PricingTierContent),
  }))

  async function handleCheckout(planId: string, priceId: string | null) {
    if (!priceId) return
    setLoading(planId)

    try {
      const res = await fetch('/api/pico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (res.status === 401) {
        window.location.href = '/login?next=' + encodeURIComponent('/pricing')
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: pageT('checkoutError') }))
        throw new Error(err.error || err.detail || pageT('checkoutError'))
      }

      const data = await res.json()
      const url = data.url || data.checkout_url
      if (url) {
        window.location.href = url
        return
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      maxWidth: 'var(--pico-shell)',
      margin: '0 auto',
      padding: '4rem 1.5rem 6rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: 'min(12rem, 44vw)',
            borderRadius: '1.75rem',
            border: '1px solid rgba(164, 255, 92, 0.16)',
            background: 'linear-gradient(180deg, rgba(6, 12, 7, 0.94), rgba(3, 7, 4, 0.98))',
            boxShadow: '0 20px 44px rgba(0, 0, 0, 0.28)',
            padding: '1rem',
          }}>
            <Image
              src={pricingRobot.src}
              alt={pricingRobot.alt}
              width={320}
              height={320}
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
              sizes="(max-width: 640px) 44vw, 12rem"
            />
          </div>
        </div>
        <h1 style={{
          fontFamily: 'var(--pico-font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 700,
          color: 'var(--pico-text)',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          {pageT('title')}
        </h1>
        <p style={{
          color: 'var(--pico-text-secondary)',
          fontSize: '1.1rem',
          maxWidth: '32rem',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          {pageT('subtitle')}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: plan.highlight
                ? 'var(--pico-bg-surface)'
                : 'var(--pico-bg-raised)',
              border: plan.highlight
                ? '1px solid var(--pico-accent)'
                : '1px solid var(--pico-border)',
              borderRadius: 'var(--pico-radius)',
              padding: '2rem',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
          >
            {plan.highlight && (
              <div style={{
                position: 'absolute',
                top: '-0.75rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--pico-accent)',
                color: 'var(--pico-accent-contrast)',
                fontFamily: 'var(--pico-font-accent)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--pico-radius-full)',
              }}>
                {pageT('badgePopular')}
              </div>
            )}

            <h2 style={{
              fontFamily: 'var(--pico-font-accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: plan.highlight ? 'var(--pico-accent)' : 'var(--pico-text-muted)',
              marginBottom: '0.5rem',
            }}>
              {plan.name}
            </h2>

            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--pico-font-display)',
                fontSize: '2.8rem',
                fontWeight: 700,
                color: 'var(--pico-text)',
                lineHeight: 1,
              }}>
                {plan.price}
              </span>
              <span style={{
                color: 'var(--pico-text-muted)',
                fontSize: '0.95rem',
                marginLeft: '0.25rem',
              }}>
                {plan.period}
              </span>
            </div>

            <p style={{
              color: 'var(--pico-text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              {plan.description}
            </p>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 1.75rem 0',
            }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.35rem 0',
                  color: 'var(--pico-text-secondary)',
                  fontSize: '0.88rem',
                }}>
                  <span style={{
                    color: 'var(--pico-accent)',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => plan.id === 'enterprise'
                ? window.location.href = (plan.supportHref ?? '/pico/support')
                : handleCheckout(plan.id, plan.priceId)
              }
              disabled={loading === plan.id || (!plan.priceId && plan.id !== 'enterprise')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--pico-radius-sm)',
                fontFamily: 'var(--pico-font-accent)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: plan.priceId || plan.id === 'enterprise' ? 'pointer' : 'default',
                border: plan.highlight
                  ? '1px solid var(--pico-accent)'
                  : '1px solid var(--pico-border)',
                background: plan.highlight
                  ? 'var(--pico-accent)'
                  : 'transparent',
                color: plan.highlight
                  ? 'var(--pico-accent-contrast)'
                  : 'var(--pico-text-secondary)',
                opacity: loading === plan.id ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading === plan.id ? pageT('loading') : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <section style={{ marginTop: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {generated.pricing.truthStrip.map((item) => (
            <div
              key={item}
              style={{
                borderRadius: '1.15rem',
                border: '1px solid var(--pico-border)',
                background: 'var(--pico-bg-surface)',
                padding: '1rem 1.1rem',
                color: 'var(--pico-text-secondary)',
                lineHeight: 1.55,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{
          borderRadius: '1.6rem',
          border: '1px solid rgba(164, 255, 92, 0.18)',
          background: 'linear-gradient(180deg, rgba(7, 14, 8, 0.96), rgba(4, 8, 5, 0.98))',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--pico-font-accent)',
            fontSize: '0.74rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--pico-accent)',
          }}>
            Live content footing
          </p>
          <h2 style={{
            margin: '0.85rem 0 0',
            fontFamily: 'var(--pico-font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 2.3rem)',
            color: 'var(--pico-text)',
            letterSpacing: '-0.03em',
          }}>
            Pricing now sits on the same tracked stack truth as the rest of Pico
          </h2>
          <p style={{
            margin: '0.85rem 0 0',
            maxWidth: '48rem',
            color: 'var(--pico-text-secondary)',
            lineHeight: 1.65,
          }}>
            Builder-pack docs last refreshed {formatShortDate(generated.packSnapshot.refreshedAt)} now feed
            the product copy, while live repo metadata keeps the stack briefings honest instead of frozen.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {generated.stacks.map((stack) => (
            <article
              key={stack.id}
              style={{
                borderRadius: '1.5rem',
                border: '1px solid var(--pico-border)',
                background: 'var(--pico-bg-raised)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <p style={{
                    margin: 0,
                    fontFamily: 'var(--pico-font-accent)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--pico-accent)',
                  }}>
                    {stack.name}
                  </p>
                  <h3 style={{
                    margin: '0.55rem 0 0',
                    fontFamily: 'var(--pico-font-display)',
                    fontSize: '1.45rem',
                    color: 'var(--pico-text)',
                    letterSpacing: '-0.03em',
                  }}>
                    {stack.live?.latestRef?.label ?? 'Tracked repo'}
                  </h3>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--pico-text-muted)', fontSize: '0.8rem' }}>
                  <div>{formatCompactNumber(stack.live?.stars)} stars</div>
                  <div>{formatShortDate(stack.live?.latestRef?.publishedAt ?? stack.live?.pushedAt)}</div>
                </div>
              </div>

              <p style={{
                margin: '0.9rem 0 0',
                color: 'var(--pico-text-secondary)',
                lineHeight: 1.65,
                fontSize: '0.94rem',
              }}>
                {stack.productProfile}
              </p>

              <ul style={{
                listStyle: 'none',
                margin: '1rem 0 0',
                padding: 0,
                display: 'grid',
                gap: '0.45rem',
                color: 'var(--pico-text-secondary)',
                fontSize: '0.88rem',
              }}>
                {stack.strengths.slice(0, 3).map((item) => (
                  <li key={item} style={{ display: 'flex', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--pico-accent)' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '1rem',
                fontSize: '0.86rem',
              }}>
                {stack.docsUrl ? (
                  <a href={stack.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--pico-accent)' }}>
                    Docs
                  </a>
                ) : null}
                {stack.repoUrl ? (
                  <a href={stack.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--pico-text-secondary)' }}>
                    Repo
                  </a>
                ) : null}
                {stack.live?.latestRef?.url ? (
                  <a href={stack.live.latestRef.url} target="_blank" rel="noreferrer" style={{ color: 'var(--pico-text-secondary)' }}>
                    Latest ship
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <p style={{
        textAlign: 'center',
        color: 'var(--pico-text-muted)',
        fontSize: '0.8rem',
        marginTop: '2.5rem',
      }}>
        {pageT('enterpriseSupport')}{' '}
        <a href="/pico/support" style={{ color: 'var(--pico-accent)' }}>
          {pageT('enterpriseSupportCta')}
        </a>{' '}
        {pageT('enterpriseSupportBody')}
      </p>
    </div>
  )
}
