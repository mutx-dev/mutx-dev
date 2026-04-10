'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '../SiteReveal'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const beforeAfter = [
  {
    before:
      'You built an AI agent to save time — now you check on it every hour.',
    after:
      'Your agent runs itself. You open the dashboard once a day — and everything is fine.',
  },
  {
    before:
      'You got a $3,800 API bill last month and spent two days figuring out why.',
    after:
      'You set a $500/mo budget cap. Your agent has never exceeded it once.',
  },
  {
    before:
      'Your boss saw one bad output — now every action needs manual Slack approval.',
    after:
      'You defined what your agent can do alone vs what needs approval. Your boss trusts it.',
  },
] as const

const features = [
  {
    num: '01',
    title: 'Live visibility dashboard',
    body: 'See what your agent is doing, what it called, what it returned, and what failed — in real time. No log archaeology.',
  },
  {
    num: '02',
    title: 'Cost watchdog',
    body: 'Real-time token spend per agent, per workflow, per day. Budget caps and alerts so you never get a surprise bill.',
  },
  {
    num: '03',
    title: 'Smart approval gates',
    body: 'Define what your agent can do autonomously vs what needs your sign-off. Approve via Slack, email, or dashboard — one click.',
  },
  {
    num: '04',
    title: 'Failure alerts + audit trail',
    body: 'Instant alert when something breaks. Full history of every action the agent took — you always know what happened and when.',
  },
] as const

const tiers = [
  {
    name: 'Starter',
    price: '€49',
    period: '/mo',
    agents: '1 agent',
    recommended: false,
    features: [
      'Dashboard',
      'Cost alerts',
      'Basic failure notifications',
      '7-day audit trail',
    ],
  },
  {
    name: 'Pro',
    price: '€149',
    period: '/mo',
    agents: 'Up to 5 agents',
    recommended: true,
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
    price: '€399',
    period: '/mo',
    agents: 'Up to 20 agents',
    recommended: false,
    features: [
      'Everything in Pro',
      'Multi-user access',
      'Role-based permissions',
      '90-day audit trail',
      'Priority support',
    ],
  },
] as const

const setupSteps = [
  {
    num: '1',
    time: '5 min',
    title: 'Connect your existing agent',
    body: 'LangChain, n8n, Make, custom API — anything with a webhook or SDK wrapper. No rearchitecting.',
  },
  {
    num: '2',
    time: '10 min',
    title: 'Set your thresholds',
    body: 'Cost alerts, failure notifications, which actions require human approval before execution.',
  },
  {
    num: '3',
    time: '15 min',
    title: 'You\'re live.',
    body: 'Dashboard is running. Your agent works. You only get alerted when it actually needs you.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PicoLandingPage() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={s.page}>
      {/* Navigation */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/pico" className={s.navBrand}>
            <span className={s.navLogo}>
              <Image src="/logo.png" alt="MUTX" width={20} height={20} />
            </span>
            <span className={s.navName}>
              PicoMUTX
              <span className={s.navTag}> by MUTX</span>
            </span>
          </Link>
          <Link href="/contact" className={s.navCta}>
            Get early access
          </Link>
        </div>
      </nav>

      <main className={s.main}>
        {/* ---- Hero ---- */}
        <section className={s.hero}>
          <div className={s.heroGrid}>
            <span className={s.heroBadge}>
              <span className={s.heroBadgeDot} />
              Now in early access
            </span>

            <SiteReveal delay={0.05}>
              <h1 className={s.heroTitle}>
                Stop babysitting{' '}
                <span className={s.heroTitleAccent}>your AI.</span>
              </h1>
            </SiteReveal>

            <SiteReveal delay={0.12}>
              <p className={s.heroSub}>
                You built an AI agent to save time. Now you spend more time
                watching it than doing the work it was supposed to replace.
                PicoMUTX fixes that in 30 minutes.
              </p>
            </SiteReveal>

            <SiteReveal delay={0.19}>
              <div className={s.heroActions}>
                <Link href="/contact" className={s.btnPrimary}>
                  Get early access
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className={s.btnSecondary}>
                  MUTX for enterprise
                </Link>
              </div>
            </SiteReveal>

            <p className={s.heroMeta}>
              Live in 30 minutes. Works on top of whatever you already built.
              No new infrastructure required.
            </p>
          </div>
        </section>

        {/* ---- Before / After ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>The shift</span>
              <h2 className={s.sectionTitle}>
                Before PicoMUTX vs. after
              </h2>
            </div>
            <div className={s.baGrid}>
              {beforeAfter.map((item, i) => (
                <SiteReveal key={i} delay={i * 0.07}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.baCard}
                  >
                    <div className={`${s.baSide} ${s.baBefore}`}>
                      <p className={`${s.baLabel} ${s.baLabelBefore}`}>
                        Before
                      </p>
                      <p className={s.baText}>{item.before}</p>
                    </div>
                    <div className={s.baSide}>
                      <p className={`${s.baLabel} ${s.baLabelAfter}`}>
                        After
                      </p>
                      <p className={`${s.baText} ${s.baTextAfter}`}>
                        {item.after}
                      </p>
                    </div>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>How it works</span>
              <h2 className={s.sectionTitle}>
                Four things between you and an agent that runs itself
              </h2>
            </div>
            <div className={s.featureGrid}>
              {features.map((f, i) => (
                <SiteReveal key={f.num} delay={i * 0.06}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.featureCard}
                  >
                    <p className={s.featureNum}>{f.num}</p>
                    <h3 className={s.featureTitle}>{f.title}</h3>
                    <p className={s.featureBody}>{f.body}</p>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Pricing ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div
              className={`${s.sectionHeader} ${s.sectionHeaderCenter}`}
            >
              <span className={`${s.eyebrow} ${s.eyebrowBlue}`}>
                Pricing
              </span>
              <h2 className={s.sectionTitle}>
                Self-serve. No sales call required.
              </h2>
              <p className={s.sectionBody}>
                Start with one agent. Scale when you need more.
              </p>
            </div>
            <div className={s.pricingGrid}>
              {tiers.map((tier, i) => (
                <SiteReveal key={tier.name} delay={i * 0.07}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={`${s.pricingCard} ${
                      tier.recommended ? s.pricingCardRecommended : ''
                    }`}
                  >
                    {tier.recommended && (
                      <span className={s.pricingBadge}>Recommended</span>
                    )}
                    <p className={s.pricingName}>{tier.name}</p>
                    <div className={s.pricingPrice}>
                      <span className={s.pricingAmount}>{tier.price}</span>
                      <span className={s.pricingPeriod}>{tier.period}</span>
                    </div>
                    <p className={s.pricingAgents}>{tier.agents}</p>
                    <ul className={s.pricingFeatures}>
                      {tier.features.map((f) => (
                        <li key={f} className={s.pricingFeature}>
                          <span className={s.pricingFeatureCheck}>
                            +
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact"
                      className={`${s.pricingCta} ${
                        tier.recommended ? s.pricingCtaPrimary : ''
                      }`}
                    >
                      {tier.recommended ? 'Get started' : 'Get started'}
                    </Link>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p className={s.pricingUpsell}>
              Need more? When you outgrow 20 agents, that&apos;s{' '}
              <Link href="/">MUTX enterprise</Link> at €18k–€50k+.
            </p>
          </div>
        </section>

        {/* ---- Setup timeline ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div
              className={`${s.sectionHeader} ${s.sectionHeaderCenter}`}
            >
              <span className={s.eyebrow}>Setup</span>
              <h2 className={s.sectionTitle}>
                Live in 30 minutes. Three steps.
              </h2>
            </div>
            <div className={s.setupGrid}>
              {setupSteps.map((step, i) => (
                <SiteReveal key={step.num} delay={i * 0.08}>
                  <div className={s.setupStep}>
                    <div className={s.setupMarker}>
                      <span className={s.setupDot}>{step.num}</span>
                    </div>
                    <div className={s.setupContent}>
                      <span className={s.setupTime}>{step.time}</span>
                      <h3 className={s.setupTitle}>{step.title}</h3>
                      <p className={s.setupBody}>{step.body}</p>
                    </div>
                  </div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Final CTA ---- */}
        <section className={s.ctaSection}>
          <div className={s.shell}>
            <div className={s.ctaStack}>
              <SiteReveal delay={0.05}>
                <h2 className={s.ctaTitle}>
                  Your AI should work for you. Not the other way around.
                </h2>
              </SiteReveal>
              <SiteReveal delay={0.12}>
                <Link href="/contact" className={s.btnPrimary}>
                  Get early access
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </SiteReveal>
              <p className={s.ctaMeta}>
                Questions?{' '}
                <Link href="/contact">Talk to us</Link> or{' '}
                <Link href="/">explore MUTX for enterprise</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
