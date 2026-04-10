'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '../SiteReveal'
import { PicoContactForm } from './PicoContactForm'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TRUST_BAR_ITEMS = [
  'For founders, operators, and small teams',
  'Step-by-step guidance',
  'Built-in safeguards from day one',
]

const PROBLEMS = [
  {
    label: '"I want an AI agent, but I don\'t know where to start."',
    body: 'There are too many tools, too many opinions, and too many people assuming you already know the basics. The gap between "I have an idea" and "I have something working" feels larger than it should.',
  },
  {
    label: '"I already tried — and got stuck."',
    body: 'You made progress, hit a wall, and had nobody to ask who could actually help. So the project stalled, and now the idea is sitting in your backlog instead of creating value.',
  },
  {
    label: '"I spent money, and it still isn\'t working properly."',
    body: 'Maybe you hired someone. Maybe you paid for tools. Maybe you built something half-functional that breaks under real conditions. Now you are not just uncertain — you are skeptical.',
  },
  {
    label: '"I don\'t want to deploy something I can\'t trust."',
    body: 'An agent that gives the wrong answer, behaves unpredictably, or creates hidden costs is not an asset. It is a liability.',
  },
]

const HOW_IT_WORKS = [
  {
    icon: 'path',
    title: 'Step-by-step implementation paths',
    body: 'Follow structured paths based on what you are actually trying to build — from customer support agents to internal automations and workflow assistants. No generic theory. No endless searching.',
  },
  {
    icon: 'support',
    title: 'Guided support when you get stuck',
    body: 'When something breaks, becomes unclear, or feels risky, you don\'t have to figure it out alone. PicoMUTX is designed to keep momentum alive instead of letting projects die in confusion.',
  },
  {
    icon: 'shield',
    title: 'Built-in safety from day one',
    body: 'Cost awareness, visibility, and guardrails matter. You should know what your agent is doing, what it is costing, and when something needs attention.',
  },
  {
    icon: 'community',
    title: 'Community that improves the process',
    body: 'You are not building in a vacuum. You are inside an environment where questions, obstacles, and practical solutions become part of a shared learning system.',
  },
  {
    icon: 'expert',
    title: 'Live expert touchpoints',
    body: 'Some things are too nuanced for static documentation. PicoMUTX includes live guidance moments designed to help you unblock faster and make better decisions as you build.',
  },
]

const WHO_IT_S_FOR = [
  'You want to build an AI agent but don\'t want to depend entirely on developers',
  'You\'ve tried before and got stuck halfway',
  'You already spent money on tools or implementation and still don\'t trust the outcome',
  'You want a practical path, not more theory',
  'You care about building something useful, safe, and real',
  'You want support while building, not only after something goes wrong',
]

const WHO_IT_S_NOT_FOR = [
  'You are looking for a shortcut with zero learning',
  'You already run a mature enterprise agent stack and need complex governance infrastructure',
  'You want entertainment, trends, or hype more than execution',
  'You want a one-off fix, not a system',
  'You are not ready to change how the business actually operates',
  'You expect AI to replace judgment, leadership, or accountability',
]

const BEFORE_AFTER = [
  {
    before: 'You have an idea, but no clear path',
    after: 'You have a structured way forward',
  },
  {
    before: 'You waste time jumping between tools, docs, and tutorials',
    after: 'You follow guided implementation paths',
  },
  {
    before: 'You are unsure what\'s safe, stable, or worth deploying',
    after: 'You build with safeguards and visibility',
  },
  {
    before: 'You get stuck and lose momentum',
    after: 'You get support before the project dies',
  },
  {
    before: 'You spend money without confidence',
    after: 'You move with more control and less waste',
  },
  {
    before: 'Your agent stays in theory',
    after: 'Your agent gets built and put to work',
  },
]

const FAQS = [
  {
    q: 'Do I need to know how to code?',
    a: 'No. PicoMUTX is built for people who want to build useful AI agents without needing deep technical expertise. You do not need to be an engineer to get started.',
  },
  {
    q: 'What if I\'ve already tried and failed?',
    a: 'That is exactly one of the people this is for. PicoMUTX is designed to reduce the confusion and fragmentation that usually cause people to stop halfway.',
  },
  {
    q: 'What if I already spent money on tools or freelancers?',
    a: 'Then you already know the real problem: access to tools is not the same as having a reliable path. PicoMUTX is meant to give you more structure, more confidence, and fewer expensive mistakes.',
  },
  {
    q: 'What kind of agents can I build?',
    a: 'Practical ones — the kind that save time, support operations, improve workflows, and help businesses run better. The focus is usefulness, not toy demos.',
  },
  {
    q: 'Is pre-registration free?',
    a: 'Yes. Pre-registration is free and does not require payment.',
  },
  {
    q: 'What happens after I pre-register?',
    a: 'You will be added to the early access list and be among the first to hear when access opens, founding spots become available, and rollout details are released.',
  },
  {
    q: 'Is this for enterprises?',
    a: 'PicoMUTX is better suited to founders, operators, and small teams who want a guided way to build and deploy AI agents. Larger enterprise governance needs belong more to the broader MUTX ecosystem.',
  },
]

const PREREGE_BENEFITS = [
  'Early access before public release',
  'Priority consideration for founding member spots',
  'Early onboarding and launch updates',
  'The ability to influence early use cases and rollout priorities',
  'First visibility into pricing, availability, and access terms',
  'Access to founding-member incentives when available',
]

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */

function HowItWorksIcon({ kind }: { kind: string }) {
  const sz = 20
  const clr = 'currentColor'
  switch (kind) {
    case 'path':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'support':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'shield':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'community':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'expert':
      return (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
  const [formOpen, setFormOpen] = useState(false)
  const [formInterest, setFormInterest] = useState<string | undefined>()

  const openForm = useCallback((interest?: string) => {
    setFormInterest(interest)
    setFormOpen(true)
  }, [])

  return (
    <div className={s.page}>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={formInterest}
      />

      {/* Navigation */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="https://pico.mutx.dev" className={s.navBrand}>
            <span className={s.navLogo}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="5" fill="url(#grad)" />
                <path d="M6 10l3 3 5-5" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="20" y2="20">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className={s.navName}>
              PicoMUTX
              <span className={s.navTag}> by MUTX</span>
            </span>
          </Link>
          <button className={s.navCta} onClick={() => openForm()} type="button">
            Pre-register
          </button>
        </div>
      </nav>

      <main className={s.main}>

        {/* ---- Hero (Section 1) ---- */}
        <section className={s.hero}>
          <div className={s.heroAmbient} aria-hidden="true" />
          <div className={s.heroGrid}>
            <span className={s.heroBadge}>
              <span className={s.heroBadgeDot} />
              Early Access &middot; Limited Spots
            </span>

            <SiteReveal delay={0.05}>
              <h1 className={s.heroTitle}>
                Build and deploy AI agents{' '}
                <span className={s.heroTitleAccent}>without hiring a developer.</span>
              </h1>
            </SiteReveal>

            <SiteReveal delay={0.12}>
              <p className={s.heroSub}>
                PicoMUTX gives you a safe, guided path to a working AI agent — whether
                you are starting from scratch, fixing an agent that is not working, or
                trying to avoid another expensive mistake.
              </p>
            </SiteReveal>

            <SiteReveal delay={0.19}>
              <div className={s.heroActions}>
                <button onClick={() => openForm()} className={s.btnPrimary} type="button">
                  Pre-Register for Early Access
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </SiteReveal>

            <SiteReveal delay={0.22}>
              <p className={s.heroMeta}>
                Free to pre-register &middot; No credit card required &middot; Founding spots limited
              </p>
            </SiteReveal>

            <SiteReveal delay={0.26}>
              <div className={s.trustBar}>
                {TRUST_BAR_ITEMS.map((item, i) => (
                  <span key={item} className={s.trustItem}>
                    {i > 0 && <span className={s.trustSep} aria-hidden="true">路</span>}
                    {item}
                  </span>
                ))}
              </div>
            </SiteReveal>
          </div>
        </section>

        {/* ---- Problem (Section 2) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>The Problem</span>
              <h2 className={s.sectionTitle}>
                The problem is not the idea.<br />
                It is everything that happens after it.
              </h2>
              <p className={s.sectionBody}>
                Most people don&apos;t get stuck because they lack ambition. They get stuck
                because building an AI agent still feels like entering a world designed
                by engineers, for engineers.
              </p>
            </div>

            <div className={s.problemScenarios}>
              {PROBLEMS.map((p) => (
                <div key={p.label} className={s.problemCard}>
                  <div className={s.problemLabel}>{p.label}</div>
                  <p className={s.problemBody}>{p.body}</p>
                </div>
              ))}
            </div>

            <p className={s.problemClose}>
              That&apos;s exactly why PicoMUTX exists.
            </p>
          </div>
        </section>

        {/* ---- Platform Intro (Section 3) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>What PicoMUTX Is</span>
              <h2 className={s.sectionTitle}>
                PicoMUTX is where AI agents go from &ldquo;interesting idea&rdquo; to
                &ldquo;working system.&rdquo;
              </h2>
              <p className={s.sectionBody}>
                PicoMUTX is a guided platform for people who want to build and run AI
                agents safely — without needing to become full-time engineers. It gives
                you the structure, support, and safeguards that are usually missing when
                people try to do this alone.
              </p>
              <p className={s.sectionBody}>
                Instead of forcing you to assemble everything from scratch, PicoMUTX
                helps you move step by step: from idea to implementation, from confusion
                to clarity, from prototype to something you can actually use.
              </p>
              <p className={`${s.sectionBody} ${s.sectionBodyAccent}`}>
                This is not just content. Not just a tool. Not just a community.
                It&apos;s a practical environment designed to help you build, deploy, and
                run AI agents with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* ---- How It Works (Section 4) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>How It Works</span>
              <h2 className={s.sectionTitle}>
                What you get inside PicoMUTX
              </h2>
            </div>
            <div className={s.howGrid}>
              {HOW_IT_WORKS.map((item, i) => (
                <SiteReveal key={item.title} delay={i * 0.06}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.howCard}
                  >
                    <span className={s.howIconWrap}>
                      <HowItWorksIcon kind={item.icon} />
                    </span>
                    <h3 className={s.howTitle}>{item.title}</h3>
                    <p className={s.howBody}>{item.body}</p>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Who It&apos;s For (Section 5) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>Who It&apos;s For</span>
              <h2 className={s.sectionTitle}>
                PicoMUTX is for you if&hellip;
              </h2>
            </div>
            <ul className={s.whoList}>
              {WHO_IT_S_FOR.map((item) => (
                <li key={item} className={s.whoItem}>
                  <Check className={s.whoCheck} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- Who It&apos;s Not For (Section 6) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>Who It&apos;s Not For</span>
              <h2 className={s.sectionTitle}>
                PicoMUTX is not for everyone.
              </h2>
              <p className={s.sectionBody}>
                PicoMUTX is for people who want to build properly — with support,
                structure, and a safer path forward.
              </p>
            </div>
            <ul className={s.notList}>
              {WHO_IT_S_NOT_FOR.map((item) => (
                <li key={item} className={s.notItem}>
                  <span className={s.notDash} aria-hidden="true">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- Before / After (Section 7) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>The Shift</span>
              <h2 className={s.sectionTitle}>
                What changes when you stop trying to figure it out alone
              </h2>
            </div>
            <div className={s.baGrid}>
              {BEFORE_AFTER.map((item, i) => (
                <SiteReveal key={i} delay={i * 0.05}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -2 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.baCard}
                  >
                    <div className={`${s.baSide} ${s.baBefore}`}>
                      <p className={`${s.baLabel} ${s.baLabelBefore}`}>Before</p>
                      <p className={s.baText}>{item.before}</p>
                    </div>
                    <div className={s.baSide}>
                      <p className={`${s.baLabel} ${s.baLabelAfter}`}>After</p>
                      <p className={`${s.baText} ${s.baTextAfter}`}>{item.after}</p>
                    </div>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p className={s.baClose}>
              The goal is not to &ldquo;learn AI someday.&rdquo; The goal is to get your
              agent live — safely, clearly, and with less friction.
            </p>
          </div>
        </section>

        {/* ---- Why Pre-Register (Section 8 + 9) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>Why Pre-Register</span>
              <h2 className={s.sectionTitle}>
                PicoMUTX is opening access in stages.
              </h2>
              <p className={s.sectionBody}>
                Pre-registering now puts you ahead of the public rollout and inside the
                group that will help shape the platform early. Early users do not just
                get access — they get a closer line to the product, earlier onboarding,
                and more influence over what gets prioritized first.
              </p>
            </div>
            <div className={s.benefitsGrid}>
              {PREREGE_BENEFITS.map((benefit) => (
                <div key={benefit} className={s.benefitItem}>
                  <Check className={s.benefitCheck} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className={s.foundingBlock}>
              <h3 className={s.foundingTitle}>
                Founding access won&apos;t stay open forever
              </h3>
              <p className={s.foundingBody}>
                The first wave of users matters more than the rest. These are the people
                closest to the build — the ones who arrive early, give feedback early,
                and have exclusive benefits. That&apos;s why founding access will be limited.
              </p>
              <p className={s.foundingBody}>
                If you know you want a safer, more guided path to building AI agents,
                pre-register now and secure your place before public launch changes the
                terms.
              </p>
            </div>
          </div>
        </section>

        {/* ---- FAQ / Objection Handling (Section 10) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>Questions</span>
              <h2 className={s.sectionTitle}>
                Questions people usually have before joining
              </h2>
            </div>
            <div className={s.faqGrid}>
              {FAQS.map((faq) => (
                <div key={faq.q} className={s.faqCard}>
                  <h3 className={s.faqQ}>{faq.q}</h3>
                  <p className={s.faqA}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Pre-Register CTA (Section 11) ---- */}
        <section id="pre-register" className={`${s.section} ${s.sectionCta}`}>
          <div className={s.shell}>
            <div className={s.ctaStack}>
              <SiteReveal delay={0.05}>
                <span className={s.ctaEyebrow}>Early Access</span>
                <h2 className={s.ctaTitle}>
                  Your agent does not need to stay an unfinished idea.
                </h2>
              </SiteReveal>

              <SiteReveal delay={0.12}>
                <p className={s.ctaBody}>
                  You do not need more tabs open. You do not need another tutorial. You
                  do not need another expensive detour. What you need is a clearer path
                  to something that works. PicoMUTX is built for that moment — the one
                  where you decide to stop circling the idea and finally build it
                  properly.
                </p>
              </SiteReveal>

              <SiteReveal delay={0.19}>
                <div className={s.ctaFormWrap}>
                  <h3 className={s.formHeadline}>Pre-register for PicoMUTX</h3>
                  <p className={s.formSubline}>
                    Join the early access list and be first to know when PicoMUTX opens.
                  </p>
                  <button
                    onClick={() => openForm()}
                    className={s.btnPrimary}
                    type="button"
                  >
                    Join the early access list
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className={s.formCtaMeta}>
                    Free to pre-register &middot; No credit card required &middot; Early
                    users get priority access
                  </p>
                </div>
              </SiteReveal>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
