'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '../SiteReveal'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { value: '30 min', label: 'Average setup time' },
  { value: '<2s', label: 'Alert latency' },
  { value: '0', label: 'Code changes required' },
  { value: '100%', label: 'Audit coverage' },
] as const

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
    icon: 'eye',
    title: 'Live visibility dashboard',
    body: 'See what your agent is doing, what it called, what it returned, and what failed — in real time. No log archaeology.',
  },
  {
    icon: 'shield',
    title: 'Cost watchdog',
    body: 'Real-time token spend per agent, per workflow, per day. Budget caps and alerts so you never get a surprise bill.',
  },
  {
    icon: 'gate',
    title: 'Smart approval gates',
    body: 'Define what your agent can do autonomously vs what needs your sign-off. Approve via Slack, email, or dashboard — one click.',
  },
  {
    icon: 'trail',
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
    cta: 'Start free trial',
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
    cta: 'Get started',
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
    cta: 'Contact sales',
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
    title: "You're live.",
    body: 'Dashboard is running. Your agent works. You only get alerted when it actually needs you.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */

function FeatureIcon({ kind }: { kind: string }) {
  const sz = 20
  const clr = 'currentColor'
  switch (kind) {
    case 'eye':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'shield':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'gate':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      )
    case 'trail':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
          <path d="M3 22l1-4" />
        </svg>
      )
    default:
      return null
  }
}

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
          <Link href="https://pico.mutx.dev" className={s.navBrand}>
            <span className={s.navLogo}>
              <Image src="/logo.png" alt="MUTX" width={20} height={20} />
            </span>
            <span className={s.navName}>
              PicoMUTX
              <span className={s.navTag}> by MUTX</span>
            </span>
          </Link>
          <div className={s.navLinks}>
            <a href="#features" className={s.navLink}>Features</a>
            <a href="#pricing" className={s.navLink}>Pricing</a>
            <a href="#setup" className={s.navLink}>Setup</a>
          </div>
          <Link href="https://mutx.dev/contact" className={s.navCta}>
            Get early access
          </Link>
        </div>
      </nav>

      <main className={s.main}>
        {/* ---- Hero ---- */}
        <section className={s.hero}>
          <div className={s.heroAmbient} aria-hidden="true" />
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
                <Link href="https://mutx.dev/contact" className={s.btnPrimary}>
                  Get early access
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="https://mutx.dev" className={s.btnSecondary}>
                  MUTX for enterprise
                </Link>
              </div>
            </SiteReveal>

            <p className={s.heroMeta}>
              Live in 30 minutes. Works on top of whatever you already built.
              No new infrastructure required.
            </p>

            {/* Mock dashboard terminal */}
            <SiteReveal delay={0.28} distance={36}>
              <div className={s.heroVisual}>
                <div className={s.terminal}>
                  <div className={s.terminalBar}>
                    <span className={s.terminalDot} style={{ background: '#ef4444' }} />
                    <span className={s.terminalDot} style={{ background: '#eab308' }} />
                    <span className={s.terminalDot} style={{ background: '#22c55e' }} />
                    <span className={s.terminalTitle}>pico.mutx.dev — agent dashboard</span>
                  </div>
                  <div className={s.terminalBody}>
                    <div className={s.terminalLine}>
                      <span className={s.tGreen}>agent-01</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tWhite}>process_emails</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tGreen}>completed</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>142 tokens</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>$0.04</span>
                    </div>
                    <div className={s.terminalLine}>
                      <span className={s.tGreen}>agent-01</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tWhite}>sync_calendar</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tYellow}>awaiting approval</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>89 tokens</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>$0.02</span>
                    </div>
                    <div className={s.terminalLine}>
                      <span className={s.tGreen}>agent-02</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tWhite}>generate_report</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tGreen}>completed</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>1.2k tokens</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>$0.38</span>
                    </div>
                    <div className={s.terminalLine}>
                      <span className={s.tGreen}>agent-02</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tWhite}>send_slack digest</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tRed}>failed</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>54 tokens</span>
                      <span className={s.tDim}>|</span>
                      <span className={s.tMuted}>$0.01</span>
                    </div>
                    <div className={s.terminalStatusBar}>
                      <span>4 agents running</span>
                      <span>Budget: <span className={s.tGreen}>$127.40 / $500.00</span></span>
                      <span>Uptime: <span className={s.tGreen}>99.97%</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </SiteReveal>
          </div>
        </section>

        {/* ---- Stats bar ---- */}
        <section className={s.statsBar}>
          <div className={s.shell}>
            <div className={s.statsGrid}>
              {stats.map((stat, i) => (
                <SiteReveal key={stat.label} delay={i * 0.05}>
                  <div className={s.statItem}>
                    <span className={s.statValue}>{stat.value}</span>
                    <span className={s.statLabel}>{stat.label}</span>
                  </div>
                </SiteReveal>
              ))}
            </div>
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
        <section id="features" className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>How it works</span>
              <h2 className={s.sectionTitle}>
                Four things between you and an agent that runs itself
              </h2>
            </div>
            <div className={s.featureGrid}>
              {features.map((f, i) => (
                <SiteReveal key={f.title} delay={i * 0.06}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.featureCard}
                  >
                    <span className={s.featureIconWrap}>
                      <FeatureIcon kind={f.icon} />
                    </span>
                    <h3 className={s.featureTitle}>{f.title}</h3>
                    <p className={s.featureBody}>{f.body}</p>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Pricing ---- */}
        <section id="pricing" className={`${s.section} ${s.sectionAlt}`}>
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
                      <span className={s.pricingBadge}>Most popular</span>
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
                            <Check className="h-3 w-3" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="https://mutx.dev/contact"
                      className={`${s.pricingCta} ${
                        tier.recommended ? s.pricingCtaPrimary : ''
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p className={s.pricingUpsell}>
              Need more? When you outgrow 20 agents, that&apos;s{' '}
              <Link href="https://mutx.dev">MUTX enterprise</Link> at €18k–€50k+.
            </p>
          </div>
        </section>

        {/* ---- Setup timeline ---- */}
        <section id="setup" className={`${s.section} ${s.sectionDark}`}>
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
                  Your AI should work for you.<br />Not the other way around.
                </h2>
              </SiteReveal>
              <SiteReveal delay={0.12}>
                <p className={s.ctaBody}>
                  Join the teams already running autonomous agents with confidence.
                  Setup takes 30 minutes. No credit card required.
                </p>
              </SiteReveal>
              <SiteReveal delay={0.18}>
                <div className={s.ctaActions}>
                  <Link href="https://mutx.dev/contact" className={s.btnPrimary}>
                    Get early access
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </SiteReveal>
              <p className={s.ctaMeta}>
                Questions?{' '}
                <Link href="https://mutx.dev/contact">Talk to us</Link> or{' '}
                <Link href="https://mutx.dev">explore MUTX for enterprise</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
