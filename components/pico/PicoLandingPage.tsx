'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import s from './PicoLanding.module.css'
import { SiteReveal } from '@/components/site/SiteReveal'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'
import { picoRobotArtById } from '@/lib/picoRobotArt'

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

export function PicoLandingPage() {
  const t = useTranslations('pico')
  const prefersReducedMotion = useReducedMotion()
  const [formOpen, setFormOpen] = useState(false)
  const [formInterest, setFormInterest] = useState<string | undefined>()
  const heroRobot = picoRobotArtById.heroWave

  const openForm = useCallback((interest?: string) => {
    setFormInterest(interest)
    setFormOpen(true)
  }, [])

  return (
    <div data-testid="pico-waitlist-landing" className={s.page}>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={formInterest}
      />

      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/pico" className={s.navBrand}>
            <span className={s.navLogo}>
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={20} height={20} priority />
            </span>
            <span className={s.navName}>
              {t('nav.brand')}
              <span className={s.navTag}>{t('nav.brandTag')}</span>
            </span>
          </Link>
          <div className={s.navActions}>
            <PicoLangSwitcher />
            <button className={s.navCta} onClick={() => openForm()} type="button">
              {t('nav.cta')}
            </button>
          </div>
        </div>
      </nav>

      <main className={s.main}>
        <section className={s.hero}>
          <div className={s.heroAmbient} aria-hidden="true" />
          <div className={s.heroShell}>
            <div className={s.heroCopy}>
              <SiteReveal delay={0.05}>
                <span className={s.heroBadge}>{t('hero.badge')}</span>
              </SiteReveal>

              <SiteReveal delay={0.1}>
                <h1 className={s.heroTitle}>
                  <span className={s.heroTitleMain}>{t('hero.title')}</span>
                  <span className={s.heroTitleAccent}>{t('hero.titleAccent')}</span>
                </h1>
              </SiteReveal>

              <SiteReveal delay={0.16}>
                <p className={s.heroSub}>{t('hero.subtitle')}</p>
              </SiteReveal>

              <SiteReveal delay={0.22}>
                <div className={s.heroActions}>
                  <div className={s.heroCtaRow}>
                    <button
                      type="button"
                      className={s.heroCtaPrimary}
                      onClick={() => openForm('building-first')}
                    >
                      {t('hero.cta')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <a href="#launch-path" className={s.heroCtaSecondary}>
                      {t('hero.ctaSecondary') || 'See pricing'}
                    </a>
                  </div>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.26}>
                <p className={s.heroMeta}>{t('hero.meta')}</p>
              </SiteReveal>

              <SiteReveal delay={0.3}>
                <div className={s.trustBar}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={s.trustItem}>
                      {t(`trustBar.items.${i}`)}
                    </span>
                  ))}
                </div>
              </SiteReveal>
            </div>

            <SiteReveal delay={0.18}>
              <div className={s.heroVisualRail}>
                <div className={s.heroRobotStage} aria-hidden="true">
                  <div className={s.heroRobotGlow} />
                  <div className={s.heroVisualLabel}>PicoMUTX</div>
                  <div className={s.heroRobotFrame}>
                    <Image
                      src={heroRobot.src}
                      alt=""
                      width={1536}
                      height={1024}
                      priority
                      className={s.heroRobotImage}
                      sizes="(max-width: 768px) 78vw, (max-width: 1180px) 42vw, 34rem"
                    />
                  </div>
                </div>
              </div>
            </SiteReveal>
          </div>
        </section>

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

        <section id="launch-path" className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.launchIntro}>
              <div className={s.sectionHeader}>
                <span className={s.eyebrow}>{t('platform.eyebrow')}</span>
                <h2 className={s.sectionTitle}>{t('platform.title')}</h2>
                <p className={s.sectionBody}>{t('platform.body')}</p>
              </div>
              <p className={s.launchNote}>{t('beforeAfter.close')}</p>
            </div>
            <ol className={s.launchSteps}>
              {Array.from({ length: 4 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.06}>
                  <motion.li
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={s.launchStep}
                  >
                    <span className={s.launchIndex}>0{i + 1}</span>
                    <div className={s.launchStepIcon}>
                      <HowItWorksIcon kind={HOW_ICONS[i]} />
                    </div>
                    <div className={s.launchStepContent}>
                      <h3 className={s.launchTitle}>{t(`platform.howItWorks.${i}.title`)}</h3>
                      <p className={s.launchBody}>{t(`platform.howItWorks.${i}.body`)}</p>
                    </div>
                  </motion.li>
                </SiteReveal>
              ))}
            </ol>
          </div>
        </section>

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
                    whileHover={prefersReducedMotion ? undefined : { y: -2 }}
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

        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('faq.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
            </div>
            <div className={s.faqStack}>
              {Array.from({ length: 5 }, (_, i) => (
                <details key={i} className={s.faqItem} open={i === 0}>
                  <summary className={s.faqSummary}>
                    <h3 className={s.faqQ}>{t(`faq.items.${i}.q`)}</h3>
                    <span className={s.faqToggle} aria-hidden="true">+</span>
                  </summary>
                  <p className={s.faqA}>{t(`faq.items.${i}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('pricing.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('pricing.title')}</h2>
            </div>
            <div className={s.pricingGrid}>
              {(['starter', 'pro', 'enterprise'] as const).map((tier) => {
                const isRecommended = tier === 'pro'
                const ctaHref = t(`pricing.tiers.${tier}.ctaHref`)
                const isExternalCta = ctaHref.startsWith('http')
                return (
                  <div
                    key={tier}
                    className={`${s.pricingCard} ${isRecommended ? s.pricingCardRecommended : ''}`}
                  >
                    {isRecommended && <span className={s.pricingBadge}>Recommended</span>}
                    <h3 className={s.pricingName}>{t(`pricing.tiers.${tier}.name`)}</h3>
                    <div className={s.pricingPrice}>
                      <span className={s.pricingAmount}>{t(`pricing.tiers.${tier}.price`)}</span>
                      <span className={s.pricingPeriod}>{t(`pricing.tiers.${tier}.period`)}</span>
                    </div>
                    <p className={s.pricingAgents}>{t(`pricing.tiers.${tier}.description`)}</p>
                    <ul className={s.pricingFeatures}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <li key={i} className={s.pricingFeature}>
                          <span className={s.pricingFeatureCheck}>
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{t(`pricing.tiers.${tier}.features.${i}`)}</span>
                        </li>
                      ))}
                    </ul>
                    {isExternalCta ? (
                      <a
                        href={ctaHref}
                        target="_blank"
                        rel="noreferrer"
                        className={`${s.pricingCta} ${isRecommended ? s.pricingCtaPrimary : ''}`}
                      >
                        {t(`pricing.tiers.${tier}.cta`)}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openForm(isRecommended ? 'evaluating' : 'building-first')}
                        className={`${s.pricingCta} ${isRecommended ? s.pricingCtaPrimary : ''}`}
                      >
                        {t('finalCta.ctaButton')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

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
