'use client'

import { useState } from 'react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics',
    features: [
      '100 monthly credits',
      'Limited tutor access',
      'Academy lessons (basic)',
      'Community support',
    ],
    cta: 'Current Plan',
    priceId: null,
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '€9',
    period: '/mo',
    description: 'Full learning experience',
    features: [
      '1,000 monthly credits',
      'Full tutor access',
      'All academy lessons',
      'Autopilot mode',
      'Priority support',
    ],
    cta: 'Start 7-Day Trial',
    priceId: 'price_1TMrgMLqNfXHzKqSL3dPg1JS',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€29',
    period: '/mo',
    description: 'For serious builders',
    features: [
      '10,000 monthly credits',
      'Full tutor + BYOK',
      'API access',
      'Priority support',
      'Custom workflows',
      'Early feature access',
    ],
    cta: 'Start 7-Day Trial',
    priceId: 'price_1TMrdKLqNfXHzKqS15LrJt9C',
    highlight: false,
  },
]

export function PicoPricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

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
        const err = await res.json().catch(() => ({ error: 'Checkout failed' }))
        throw new Error(err.error || err.detail || 'Checkout failed')
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
        <h1 style={{
          fontFamily: 'var(--pico-font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 700,
          color: 'var(--pico-text)',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Simple, transparent pricing
        </h1>
        <p style={{
          color: 'var(--pico-text-secondary)',
          fontSize: '1.1rem',
          maxWidth: '32rem',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Start free. Upgrade when you need more power.
          Every paid plan includes a 7-day free trial.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {PLANS.map((plan) => (
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
                Most Popular
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
              onClick={() => handleCheckout(plan.id, plan.priceId)}
              disabled={loading === plan.id || !plan.priceId}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--pico-radius-sm)',
                fontFamily: 'var(--pico-font-accent)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: plan.priceId ? 'pointer' : 'default',
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
              {loading === plan.id ? 'Loading...' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p style={{
        textAlign: 'center',
        color: 'var(--pico-text-muted)',
        fontSize: '0.8rem',
        marginTop: '2.5rem',
      }}>
        Need more? <a href="/support" style={{ color: 'var(--pico-accent)' }}>Contact us</a> for Enterprise pricing (100K+ credits, SSO, SLA).
      </p>
    </div>
  )
}
