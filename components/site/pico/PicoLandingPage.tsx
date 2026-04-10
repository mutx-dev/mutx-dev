'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '../SiteReveal'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */

const HOW_ICONS = ['path', 'support', 'shield', 'expert'] as const

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
  const t = useTranslations('pico')
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
              {t('nav.brand')}
              <span className={s.navTag}>{t('nav.brandTag')}</span>
            </span>
          </Link>
          <PicoLangSwitcher />
          <button className={s.navCta} onClick={() => openForm()} type="button">
            {t('nav.cta')}
          </button>
        </div>
      </nav>

      <main className={s.main}>

        {/* ---- Hero (Section 1) ---- */}
        <section className={s.hero}>
          <div className={s.heroAmbient} aria-hidden="true" />
          <div className={s.heroGrid}>
            <SiteReveal delay={0.05}>
              <span className={s.heroBadge}>{t('hero.badge')}</span>
            </SiteReveal>

            <SiteReveal delay={0.1}>
              <h1 className={s.heroTitle}>
                {t('hero.title')}
                <span className={s.heroTitleAccent}>{t('hero.titleAccent')}</span>
              </h1>
            </SiteReveal>

            <SiteReveal delay={0.16}>
              <p className={s.heroSub}>{t('hero.subtitle')}</p>
            </SiteReveal>

            <SiteReveal delay={0.22}>
              <div className={s.heroActions}>
                <button onClick={() => openForm()} className={s.btnPrimary} type="button">
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link href="/onboarding" className={s.btnSecondary}>
                  Start onboarding
                </Link>
              </div>
            </SiteReveal>

            <SiteReveal delay={0.26}>
              <p className={s.heroMeta}>{t('hero.meta')}</p>
            </SiteReveal>

            <SiteReveal delay={0.3}>
              <div className={s.trustBar}>
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={s.trustItem}>
                    {i > 0 && <span className={s.trustSep} aria-hidden="true">|</span>}
                    {t(`trustBar.items.${i}`)}
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
              <span className={s.eyebrow}>{t('problem.eyebrow')}</span>
              <h2 className={s.sectionTitle}>
                {t('problem.title')}<br />
                {t('problem.titleLine2')}
              </h2>
              <p className={s.sectionBody}>{t('problem.body')}</p>
            </div>

            <div className={s.problemScenarios}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={s.problemCard}>
                  <div className={s.problemLabel}>{t(`problem.scenarios.${i}.label`)}</div>
                  <p className={s.problemBody}>{t(`problem.scenarios.${i}.body`)}</p>
                </div>
              ))}
            </div>

            <p className={s.problemClose}>{t('problem.close')}</p>
          </div>
        </section>

        {/* ---- Platform Intro + What You Get (Sections 3+4 combined) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('platform.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('platform.title')}</h2>
              <p className={s.sectionBody}>{t('platform.body')}</p>
            </div>
            <div className={s.howGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.06}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -3 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.howCard}
                  >
                    <span className={s.howIconWrap}>
                      <HowItWorksIcon kind={HOW_ICONS[i]} />
                    </span>
                    <h3 className={s.howTitle}>{t(`platform.howItWorks.${i}.title`)}</h3>
                    <p className={s.howBody}>{t(`platform.howItWorks.${i}.body`)}</p>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Who It&apos;s For / Not For (Sections 5+6 merged) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('who.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('who.title')}</h2>
            </div>

            <div className={s.whoSplit}>
              <div className={s.whoCol}>
                <h3 className={s.whoColTitle}>{t('who.forYouTitle')}</h3>
                <ul className={s.whoList}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className={s.whoItem}>
                      <Check className={s.whoCheck} />
                      <span>{t(`who.forYou.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={s.whoDivider} aria-hidden="true" />

              <div className={s.whoCol}>
                <h3 className={s.whoColTitle}>{t('who.notForYouTitle')}</h3>
                <ul className={s.notList}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className={s.notItem}>
                      <span className={s.notDash} aria-hidden="true">—</span>
                      <span>{t(`who.notForYou.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Before / After (Section 7) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('beforeAfter.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('beforeAfter.title')}</h2>
            </div>
            <div className={s.baGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.05}>
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { y: -2 }
                    }
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.baCard}
                  >
                    <div className={`${s.baSide} ${s.baBefore}`}>
                      <p className={`${s.baLabel} ${s.baLabelBefore}`}>{t('beforeAfter.beforeLabel')}</p>
                      <p className={s.baText}>{t(`beforeAfter.items.${i}.before`)}</p>
                    </div>
                    <div className={s.baSide}>
                      <p className={`${s.baLabel} ${s.baLabelAfter}`}>{t('beforeAfter.afterLabel')}</p>
                      <p className={`${s.baText} ${s.baTextAfter}`}>{t(`beforeAfter.items.${i}.after`)}</p>
                    </div>
                  </motion.div>
                </SiteReveal>
              ))}
            </div>
            <p className={s.baClose}>{t('beforeAfter.close')}</p>
          </div>
        </section>

        {/* ---- Why Pre-Register + Founding (Sections 8+9 merged) ---- */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('earlyAccess.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('earlyAccess.title')}</h2>
              <p className={s.sectionBody}>{t('earlyAccess.body')}</p>
            </div>
            <div className={s.benefitsGrid}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={s.benefitItem}>
                  <Check className={s.benefitCheck} />
                  <span>{t(`earlyAccess.benefits.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- FAQ (Section 10) ---- */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('faq.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
            </div>
            <div className={s.faqGrid}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={s.faqCard}>
                  <h3 className={s.faqQ}>{t(`faq.items.${i}.q`)}</h3>
                  <p className={s.faqA}>{t(`faq.items.${i}.a`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Final CTA (Section 11) ---- */}
        <section id="pre-register" className={`${s.section} ${s.sectionCta}`}>
          <div className={s.shell}>
            <div className={s.ctaPanel}>
              <div className={s.ctaPanelGlow} aria-hidden="true" />
              <div className={s.ctaStack}>
                <SiteReveal delay={0.05}>
                  <span className={s.ctaEyebrow}>
                    <span className={s.ctaEyebrowDot} />
                    {t('finalCta.eyebrow')}
                  </span>
                  <h2 className={s.ctaTitle}>{t('finalCta.title')}</h2>
                </SiteReveal>

                <SiteReveal delay={0.12}>
                  <p className={s.ctaBody}>{t('finalCta.body')}</p>
                </SiteReveal>

                <SiteReveal delay={0.19}>
                  <div className={s.ctaFormWrap}>
                    <p className={s.formHeadline}>{t('finalCta.formHeadline')}</p>
                    <p className={s.formSubline}>{t('finalCta.formSubline')}</p>
                    <button
                      onClick={() => openForm()}
                      className={s.btnPrimary}
                      type="button"
                    >
                      {t('finalCta.ctaButton')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className={s.formCtaMeta}>{t('finalCta.formCtaMeta')}</p>
                  </div>
                </SiteReveal>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
