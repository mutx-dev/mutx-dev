'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import core from '../marketing/MarketingCore.module.css'
import { SiteReveal } from '../SiteReveal'

const features = [
  {
    id: 'visibility',
    title: 'Live visibility dashboard',
    body: 'See exactly what your agent is doing, what it called, what it returned, and what failed — in real time. No more guessing. No more log archaeology.',
  },
  {
    id: 'cost',
    title: 'Cost watchdog',
    body: 'Real-time token spend per agent, per workflow, per day. Set budget caps and alerts. Never get a surprise bill again.',
  },
  {
    id: 'approvals',
    title: 'Smart human approval gates',
    body: 'Define exactly what your agent can do autonomously vs what needs your sign-off. Approvals via Slack, email, or dashboard — one click.',
  },
] as const

const tiers = [
  {
    name: 'Starter',
    price: '\u20AC49',
    period: '/mo',
    agents: '1 agent',
    features: [
      'Dashboard',
      'Cost alerts',
      'Basic failure notifications',
      '7-day audit trail',
    ],
  },
  {
    name: 'Pro',
    price: '\u20AC149',
    period: '/mo',
    agents: 'Up to 5',
    features: [
      'Full observability',
      'Cost caps + budget governance',
      'Human approval gates',
      '30-day audit trail',
      'Slack + email alerts',
    ],
  },
  {
    name: 'Team',
    price: '\u20AC399',
    period: '/mo',
    agents: 'Up to 20',
    features: [
      'Everything in Pro',
      'Multi-user access',
      'Role-based permissions',
      '90-day audit trail',
      'Priority support',
    ],
  },
] as const

const beforeAfter = [
  {
    before: 'You built an AI agent to save time — now you check on it every hour.',
    after: 'Your agent runs by itself — you open the dashboard once a day.',
  },
  {
    before: 'You got a $3,800 API bill last month and spent two days figuring out why.',
    after: 'You set a $500/month budget cap. It has never exceeded it once.',
  },
  {
    before: 'Your boss saw one bad output — now every action needs manual Slack approval.',
    after: 'You defined what it can do alone vs what needs approval. Your boss trusts it.',
  },
] as const

export function PicoLandingPage() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={`${core.page} ${core.publicPage}`}>
      <main className={core.main}>
        {/* Hero */}
        <section
          style={{
            position: 'relative',
            minHeight: 'max(100dvh, 44rem)',
            overflow: 'clip',
            color: '#f7f4ef',
            background:
              'radial-gradient(circle at 60% 22%, rgba(34, 197, 94, 0.14), transparent 24rem), linear-gradient(180deg, #06080d 0 44rem, #0f1015 44rem 50rem, #f8f6f3 50rem 100%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(100% - 2.5rem, 64rem)',
              margin: '0 auto',
              paddingTop: 'clamp(5rem, 10vh, 7rem)',
              paddingBottom: 'clamp(4rem, 8vh, 6rem)',
              display: 'grid',
              gap: '1.4rem',
              maxWidth: '38rem',
            }}
          >
            <p
              style={{
                margin: 0,
                width: 'fit-content',
                minHeight: '2.2rem',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 0.92rem',
                borderRadius: 999,
                border: '1px solid rgba(247, 244, 239, 0.16)',
                background: 'rgba(255, 255, 255, 0.04)',
                fontFamily: 'var(--font-marketing-accent), sans-serif',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              by MUTX
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-marketing-display), serif',
                fontSize: 'clamp(3.2rem, 7vw, 5.2rem)',
                fontWeight: 300,
                lineHeight: 0.92,
                letterSpacing: '-0.06em',
                maxWidth: '12ch',
              }}
            >
              Stop babysitting your AI.
            </h1>
            <p
              style={{
                margin: 0,
                color: 'rgba(247, 244, 239, 0.82)',
                fontSize: 'clamp(1.05rem, 1rem + 0.25vw, 1.18rem)',
                lineHeight: 1.5,
                maxWidth: '28rem',
              }}
            >
              You built an AI agent that was supposed to save you time, but now you spend more time
              watching it than doing the work it was supposed to replace. PicoMUTX fixes that in 30
              minutes.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.9rem',
                alignItems: 'center',
                paddingTop: '0.5rem',
              }}
            >
              {/* TODO: Wire to sign-up flow when ready */}
              <span
                className={core.buttonPrimary}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </span>
              <Link href="/" className={core.buttonGhost}>
                MUTX for enterprise
              </Link>
            </div>
            <p
              style={{
                margin: 0,
                color: 'rgba(247, 244, 239, 0.48)',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              Live in 30 minutes. Works on top of whatever you already built. No new infrastructure
              required.
            </p>
          </div>
        </section>

        {/* The problem */}
        <section
          style={{
            padding: 'clamp(4.4rem, 8vw, 6.6rem) 0',
            borderTop: '1px solid rgba(19, 26, 36, 0.08)',
          }}
        >
          <div className={core.shell}>
            <div style={{ display: 'grid', gap: '0.85rem', maxWidth: '42rem' }}>
              <p className={core.sectionTitle} style={{ color: '#131a24' }}>
                Before and after PicoMUTX
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '1.35rem',
                marginTop: '2rem',
              }}
            >
              {beforeAfter.map((item, i) => (
                <SiteReveal key={i} delay={i * 0.07}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -4, scale: 1.005 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'grid',
                      gap: '1rem',
                      padding: '1.15rem',
                      borderRadius: '1.4rem',
                      border: '1px solid rgba(19, 26, 36, 0.1)',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.68))',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-marketing-accent), sans-serif',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#ef4444',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Before
                      </p>
                      <p style={{ margin: 0, lineHeight: 1.56, color: 'rgba(19,26,36,0.72)' }}>
                        {item.before}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-marketing-accent), sans-serif',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#22c55e',
                          marginBottom: '0.35rem',
                        }}
                      >
                        After
                      </p>
                      <p style={{ margin: 0, lineHeight: 1.56, color: '#131a24', fontWeight: 600 }}>
                        {item.after}
                      </p>
                    </div>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            padding: 'clamp(4.4rem, 8vw, 6.6rem) 0',
            borderTop: '1px solid rgba(247, 244, 239, 0.08)',
            color: '#f7f4ef',
            background:
              'radial-gradient(circle at 16% 18%, rgba(34, 197, 94, 0.1), transparent 18rem), linear-gradient(180deg, rgba(9, 11, 16, 1), rgba(5, 6, 9, 1))',
          }}
        >
          <div className={core.shell}>
            <div style={{ display: 'grid', gap: '0.85rem', maxWidth: '42rem' }}>
              <p
                style={{
                  margin: 0,
                  width: 'fit-content',
                  minHeight: '2.2rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.92rem',
                  borderRadius: 999,
                  border: '1px solid rgba(247, 244, 239, 0.14)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontFamily: 'var(--font-marketing-accent), sans-serif',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#f7f4ef',
                }}
              >
                How it works
              </p>
              <p className={core.sectionTitle} style={{ color: '#f7f4ef' }}>
                Four things between you and an agent that runs itself.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '1.35rem',
                marginTop: '2rem',
              }}
            >
              {features.map((f, i) => (
                <SiteReveal key={f.id} delay={i * 0.07}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -4, scale: 1.005 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'grid',
                      gap: '0.65rem',
                      padding: '1.15rem',
                      borderRadius: '1.4rem',
                      border: '1px solid rgba(247, 244, 239, 0.08)',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-marketing-accent), sans-serif',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#4ade80',
                      }}
                    >
                      0{i + 1}
                    </p>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 'clamp(1.2rem, 1.9vw, 1.55rem)',
                        fontWeight: 600,
                        lineHeight: 1.06,
                        letterSpacing: '-0.04em',
                        color: '#f7f4ef',
                      }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.56, color: 'rgba(247,244,239,0.74)' }}>
                      {f.body}
                    </p>
                  </motion.div>
                </SiteReveal>
              ))}
              {/* 04 - Failure alerts + audit trail */}
              <SiteReveal delay={0.21}>
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.005 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'grid',
                    gap: '0.65rem',
                    padding: '1.15rem',
                    borderRadius: '1.4rem',
                    border: '1px solid rgba(247, 244, 239, 0.08)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-marketing-accent), sans-serif',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#4ade80',
                    }}
                  >
                    04
                  </p>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 'clamp(1.2rem, 1.9vw, 1.55rem)',
                      fontWeight: 600,
                      lineHeight: 1.06,
                      letterSpacing: '-0.04em',
                      color: '#f7f4ef',
                    }}
                  >
                    Failure alerts + audit trail
                  </h3>
                  <p style={{ margin: 0, lineHeight: 1.56, color: 'rgba(247,244,239,0.74)' }}>
                    Instant alert when something breaks. Full history of every action the agent
                    took. When something goes wrong — and it will — you know exactly what happened
                    and when.
                  </p>
                </motion.div>
              </SiteReveal>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          style={{
            padding: 'clamp(4.4rem, 8vw, 6.6rem) 0',
            borderTop: '1px solid rgba(19, 26, 36, 0.08)',
          }}
        >
          <div className={core.shell}>
            <div style={{ display: 'grid', gap: '0.85rem', maxWidth: '42rem' }}>
              <p className={core.sectionTitle} style={{ color: '#131a24' }}>
                Self-serve pricing. No sales call required.
              </p>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.58, color: 'rgba(19,26,36,0.72)' }}>
                {/* TODO: Wire pricing cards to payment/sign-up flow when ready */}
                Start with one agent. Upgrade when you need more. Every PicoMUTX customer is a
                potential MUTX enterprise client in the making.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '1.35rem',
                marginTop: '2rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
              }}
            >
              {tiers.map((tier, i) => (
                <SiteReveal key={tier.name} delay={i * 0.07}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -4, scale: 1.005 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'grid',
                      gap: '0.85rem',
                      padding: '1.4rem',
                      borderRadius: '1.4rem',
                      border:
                        tier.name === 'Pro'
                          ? '2px solid rgba(75, 141, 255, 0.4)'
                          : '1px solid rgba(19, 26, 36, 0.1)',
                      background:
                        tier.name === 'Pro'
                          ? 'linear-gradient(180deg, rgba(75,141,255,0.06), rgba(255,255,255,0.82))'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.68))',
                      boxShadow:
                        tier.name === 'Pro'
                          ? '0 18px 42px rgba(75, 141, 255, 0.12)'
                          : '0 24px 60px rgba(13,19,32,0.08)',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-marketing-accent), sans-serif',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(19,26,36,0.5)',
                      }}
                    >
                      {tier.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                      <span
                        style={{
                          fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {tier.price}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(19,26,36,0.5)' }}>
                        {tier.period}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'rgba(19,26,36,0.6)',
                      }}
                    >
                      {tier.agents}
                    </p>
                    <ul
                      style={{
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        display: 'grid',
                        gap: '0.45rem',
                      }}
                    >
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.45,
                            color: 'rgba(19,26,36,0.78)',
                            paddingLeft: '1rem',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: 0,
                              color: '#22c55e',
                            }}
                          >
                            +
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {/* TODO: Wire CTA to sign-up/payment flow */}
                    <span
                      className={core.buttonSecondary}
                      style={{ opacity: 0.6, cursor: 'not-allowed', textAlign: 'center' }}
                    >
                      Coming soon
                    </span>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p
              style={{
                margin: '1.4rem 0 0',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                color: 'rgba(19,26,36,0.5)',
              }}
            >
              Need more? When you ask &ldquo;can we do this for all 50+ agents across the
              company?&rdquo; — that&rsquo;s{' '}
              <Link href="/" style={{ color: '#4b8dff', textDecoration: 'underline' }}>
                MUTX
              </Link>{' '}
              at &euro;18k&ndash;&euro;50k+.
            </p>
          </div>
        </section>

        {/* Setup */}
        <section
          style={{
            padding: 'clamp(4.4rem, 8vw, 6.6rem) 0',
            borderTop: '1px solid rgba(247, 244, 239, 0.08)',
            color: '#f7f4ef',
            background:
              'radial-gradient(circle at 78% 26%, rgba(34, 197, 94, 0.12), transparent 20rem), linear-gradient(180deg, rgba(7, 9, 13, 1), rgba(5, 6, 9, 1))',
          }}
        >
          <div className={core.shell}>
            <div style={{ display: 'grid', gap: '0.85rem', maxWidth: '42rem' }}>
              <p className={core.sectionTitle} style={{ color: '#f7f4ef' }}>
                Live in 30 minutes. Three steps.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '1.35rem',
                marginTop: '2rem',
                maxWidth: '36rem',
              }}
            >
              {[
                {
                  step: '01',
                  time: '5 min',
                  title: 'Connect your existing agent',
                  body: 'LangChain, n8n, Make, custom API, anything with a webhook or SDK wrapper. No rearchitecting. Nothing to rebuild.',
                },
                {
                  step: '02',
                  time: '10 min',
                  title: 'Set your thresholds',
                  body: 'Cost alerts, failure notifications, which actions require human approval before execution.',
                },
                {
                  step: '03',
                  time: '15 min',
                  title: 'Done.',
                  body: 'Dashboard is live. Your agent runs. You get alerted only when it actually needs you.',
                },
              ].map((s, i) => (
                <SiteReveal key={s.step} delay={i * 0.07}>
                  <div
                    style={{
                      display: 'grid',
                      gap: '0.5rem',
                      padding: '1.15rem',
                      borderRadius: '1.2rem',
                      border: '1px solid rgba(247, 244, 239, 0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-marketing-accent), sans-serif',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#4ade80',
                        }}
                      >
                        {s.step}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-marketing-accent), sans-serif',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'rgba(247,244,239,0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {s.time}
                      </span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        color: '#f7f4ef',
                      }}
                    >
                      {s.title}
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.56, color: 'rgba(247,244,239,0.68)' }}>
                      {s.body}
                    </p>
                  </div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            padding: 'clamp(4.4rem, 8vw, 6.6rem) 0',
            borderTop: '1px solid rgba(19, 26, 36, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            className={core.shell}
            style={{
              display: 'grid',
              gap: '1rem',
              justifyItems: 'center',
              maxWidth: '32rem',
              margin: '0 auto',
            }}
          >
            <p className={core.sectionTitle} style={{ color: '#131a24' }}>
              Your AI should work for you. Not the other way around.
            </p>
            {/* TODO: Wire to sign-up flow */}
            <span
              className={core.buttonPrimary}
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(19,26,36,0.45)' }}>
              {/* STUB: Payment flow not yet wired */}
              Sign-up coming soon.{' '}
              <Link href="/" style={{ color: '#4b8dff' }}>
                Explore MUTX for enterprise
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
