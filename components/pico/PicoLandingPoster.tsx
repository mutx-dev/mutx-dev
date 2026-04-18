'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check, Map, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

import s from './PicoLandingPoster.module.css'
import { SiteReveal } from '@/components/site/SiteReveal'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'
import { picoRobotArtById } from '@/lib/picoRobotArt'

const STEP_ICONS = [Map, MessageSquare, ShieldCheck, Sparkles] as const
const PRICING_TIERS = ['trial', 'starter', 'pro', 'enterprise'] as const
const FOUNDER_CALL_URL = 'https://calendly.com/mutxdev'

type LandingPricingTierContent = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
  anchorPrice?: string
  priceNote?: string
  recommended?: boolean
}

export function PicoLandingPoster() {
  const t = useTranslations('pico')
  const prefersReducedMotion = useReducedMotion()
  const [formOpen, setFormOpen] = useState(false)
  const [formInterest, setFormInterest] = useState<string | undefined>()
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroCopyY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -46])
  const heroCopyOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [1, prefersReducedMotion ? 1 : 0.66],
  )
  const heroVisualY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 82])
  const heroVisualScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, prefersReducedMotion ? 1 : 0.93],
  )
  const heroBackdropScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, prefersReducedMotion ? 1 : 1.08],
  )
  const heroBackdropOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [0.95, prefersReducedMotion ? 0.95 : 0.58],
  )
  const heroSignalOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [1, prefersReducedMotion ? 1 : 0.52],
  )

  const heroRobot = picoRobotArtById.heroWave

  function openForm(interest?: string) {
    setFormInterest(interest)
    setFormOpen(true)
  }

  function handlePricingAction(tier: (typeof PRICING_TIERS)[number], href: string) {
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    if (tier === 'trial' || tier === 'starter') {
      openForm('build')
      return
    }

    if (tier === 'pro') {
      openForm('fix')
      return
    }

    openForm()
  }

  return (
    <div data-testid="pico-landing" className={s.page}>
      <a href="#main-content" className={s.skipLink}>
        {t('nav.skipToMain')}
      </a>

      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={formInterest}
        source="pico-waitlist"
      />

      <header className={s.nav}>
        <div className={s.navInner}>
          <Link href="/pico" className={s.navBrand}>
            <span className={s.navLogo}>
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={20} height={20} priority />
            </span>
            <span className={s.navBrandCopy}>
              <span className={s.navName}>{t('nav.brand')}</span>
              <span className={s.navTag}>{t('nav.brandTag')}</span>
            </span>
          </Link>

          <nav className={s.navLinks} aria-label={t('nav.sectionsLabel')}>
            <a href="#fit" className={s.navLink}>
              {t('problem.eyebrow')}
            </a>
            <a href="#path" className={s.navLink}>
              {t('platform.eyebrow')}
            </a>
            <a href="#pricing" className={s.navLink}>
              {t('pricing.eyebrow')}
            </a>
          </nav>

          <div className={s.navActions}>
            <PicoLangSwitcher />
            <button type="button" className={s.navCta} onClick={() => openForm()}>
              <span className={s.navCtaLabel}>{t('nav.cta')}</span>
              <span className={s.navCtaLabelMobile}>{t('nav.ctaMobile')}</span>
              <ArrowRight className={s.navCtaIcon} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className={s.main}>
        <section ref={heroRef} className={s.hero}>
          <motion.div
            aria-hidden="true"
            className={s.heroBackdrop}
            style={{ scale: heroBackdropScale, opacity: heroBackdropOpacity }}
          />
          <motion.div
            aria-hidden="true"
            className={s.heroScanline}
            style={{ opacity: heroSignalOpacity }}
          />

          <div className={s.heroShell}>
            <motion.div className={s.heroCopy} style={{ y: heroCopyY, opacity: heroCopyOpacity }}>
              <SiteReveal delay={0.04}>
                <div className={s.heroPrelude}>
                  <span className={s.heroBadge}>{t('hero.badge')}</span>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.11}>
                <h1 className={s.heroTitle}>
                  <span>{t('hero.title')}</span>
                  <span className={s.heroTitleAccent}>{t('hero.titleAccent')}</span>
                </h1>
              </SiteReveal>

              <SiteReveal delay={0.18}>
                <p className={s.heroSubtitle}>{t('hero.subtitle')}</p>
              </SiteReveal>

              <SiteReveal delay={0.25}>
                <div className={s.heroActions}>
                  <button
                    type="button"
                    className={s.heroPrimary}
                    onClick={() => openForm('build')}
                  >
                    {t('hero.cta')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <a href="#path" className={s.heroSecondary}>
                    {t('hero.ctaSecondary')}
                  </a>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.31}>
                <p className={s.heroMeta}>{t('hero.meta')}</p>
              </SiteReveal>
            </motion.div>

            <SiteReveal delay={0.16} className={s.heroVisualWrap}>
              <motion.div
                className={s.heroVisual}
                style={{ y: heroVisualY, scale: heroVisualScale }}
              >
                <div className={s.heroVisualHeader}>
                  <span className={s.heroVisualKicker}>{t('platform.eyebrow')}</span>
                  <span className={s.heroVisualSignal}>{t('trustBar.items.1')}</span>
                </div>

                <div className={s.heroRobotStage} aria-hidden="true">
                  <div className={s.heroRobotGlow} />
                  <Image
                    src={heroRobot.src}
                    alt=""
                    width={1536}
                    height={1024}
                    priority
                    className={s.heroRobotImage}
                    sizes="(max-width: 900px) 78vw, 38rem"
                  />
                </div>

                <div className={s.heroSignalRail}>
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className={s.heroSignal}>
                      <span className={s.heroSignalIndex}>0{index + 1}</span>
                      <p className={s.heroSignalText}>{t(`trustBar.items.${index}`)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </SiteReveal>
          </div>

        </section>

        <section id="fit" className={s.qualifySection}>
          <div className={s.sectionShell}>
            <div className={s.qualifyGrid}>
              <SiteReveal className={s.qualifyIntro} delay={0.04}>
                <p className={s.eyebrow}>{t('problem.eyebrow')}</p>
                <h2 className={s.sectionTitle}>
                  <span className={s.titleLine}>{t('problem.title')}</span>{' '}
                  <span className={s.titleLine}>{t('problem.titleLine2')}</span>
                </h2>
                <p className={s.sectionBody}>{t('problem.body')}</p>
                <p className={s.sectionClose}>{t('problem.close')}</p>
              </SiteReveal>

              <div className={s.scenarioBoard}>
                {Array.from({ length: 4 }, (_, index) => (
                  <SiteReveal key={index} delay={0.08 + index * 0.05}>
                    <motion.article
                      className={s.scenarioItem}
                      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={s.scenarioLine}>
                        <span className={s.scenarioNumber}>0{index + 1}</span>
                        <p className={s.scenarioLabel}>{t(`problem.scenarios.${index}.label`)}</p>
                      </div>
                      <p className={s.scenarioBody}>{t(`problem.scenarios.${index}.body`)}</p>
                    </motion.article>
                  </SiteReveal>
                ))}
              </div>
            </div>

            <SiteReveal delay={0.22}>
              <div className={s.whoBoard}>
                <div className={s.whoColumn}>
                  <p className={s.eyebrow}>{t('who.eyebrow')}</p>
                  <h3 className={s.whoTitle}>{t('who.forYouTitle')}</h3>
                  <ul className={s.whoList}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <li key={index} className={s.whoItem}>
                        <Check className={s.whoCheck} aria-hidden="true" />
                        <span>{t(`who.forYou.${index}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={s.whoDivider} aria-hidden="true" />

                <div className={s.whoColumn}>
                  <p className={s.eyebrow}>{t('who.title')}</p>
                  <h3 className={s.whoTitle}>{t('who.notForYouTitle')}</h3>
                  <ul className={s.notList}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <li key={index} className={s.notItem}>
                        <span className={s.notDash} aria-hidden="true" />
                        <span>{t(`who.notForYou.${index}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SiteReveal>
          </div>
        </section>

        <section id="path" className={s.pathSection}>
          <div className={s.sectionShell}>
            <div className={s.pathGrid}>
              <SiteReveal className={s.pathSticky} delay={0.04}>
                <div className={s.pathIntro}>
                  <p className={s.eyebrow}>{t('platform.eyebrow')}</p>
                  <h2 className={s.sectionTitle}>{t('platform.title')}</h2>
                  <p className={s.sectionBody}>{t('platform.body')}</p>
                  <p className={s.sectionClose}>{t('beforeAfter.close')}</p>
                </div>
              </SiteReveal>

              <ol className={s.pathList}>
                {Array.from({ length: 4 }, (_, index) => {
                  const Icon = STEP_ICONS[index]

                  return (
                    <SiteReveal key={index} delay={0.08 + index * 0.06}>
                      <motion.li
                        className={s.pathItem}
                        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className={s.pathItemTop}>
                          <span className={s.pathNumber}>0{index + 1}</span>
                          <span className={s.pathIcon}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </div>
                        <div className={s.pathItemCopy}>
                          <h3 className={s.pathItemTitle}>
                            {t(`platform.howItWorks.${index}.title`)}
                          </h3>
                          <p className={s.pathItemBody}>{t(`platform.howItWorks.${index}.body`)}</p>
                        </div>
                      </motion.li>
                    </SiteReveal>
                  )
                })}
              </ol>
            </div>
          </div>
        </section>

        <section className={s.shiftSection}>
          <div className={s.sectionShell}>
            <SiteReveal delay={0.05}>
              <div className={s.shiftHeader}>
                <p className={s.eyebrow}>{t('beforeAfter.eyebrow')}</p>
                <h2 className={s.sectionTitle}>{t('beforeAfter.title')}</h2>
              </div>
            </SiteReveal>

            <div className={s.shiftBoard}>
              <div className={s.shiftLabels}>
                <span>{t('beforeAfter.beforeLabel')}</span>
                <span>{t('beforeAfter.afterLabel')}</span>
              </div>

              {Array.from({ length: 4 }, (_, index) => (
                <SiteReveal key={index} delay={0.08 + index * 0.05}>
                  <div className={s.shiftRow}>
                    <p className={s.shiftBefore}>{t(`beforeAfter.items.${index}.before`)}</p>
                    <p className={s.shiftAfter}>{t(`beforeAfter.items.${index}.after`)}</p>
                  </div>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className={s.accessSection}>
          <div className={s.sectionShell}>
            <div className={s.accessGrid}>
              <SiteReveal className={s.accessIntro} delay={0.05}>
                <div className={s.accessHeader}>
                  <div className={s.accessCopy}>
                    <p className={s.eyebrow}>{t('pricing.eyebrow')}</p>
                    <h2 className={s.sectionTitle}>{t('pricing.title')}</h2>
                    <p className={s.sectionBody}>{t('pricing.lead')}</p>
                  </div>

                  <div className={s.accessHighlights}>
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={index} className={s.accessHighlight}>
                        <Check className={s.benefitCheck} aria-hidden="true" />
                        <span>{t(`earlyAccess.benefits.${index}`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SiteReveal>

              <SiteReveal className={s.pricingBoard} delay={0.12}>
                <div className={s.pricingTiers}>
                  {PRICING_TIERS.map((tier) => {
                    const pricingTier = t.raw(
                      `pricing.tiers.${tier}`,
                    ) as LandingPricingTierContent
                    const isRecommended = pricingTier.recommended ?? false

                    return (
                      <motion.div
                        key={tier}
                        className={`${s.pricingTier} ${isRecommended ? s.pricingTierRecommended : ''}`}
                        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className={s.pricingTop}>
                          {isRecommended ? (
                            <span className={s.pricingTag}>{t('pricing.recommendedLabel')}</span>
                          ) : null}
                          <p className={s.pricingName}>{pricingTier.name}</p>
                          <div className={s.pricingPriceStack}>
                            {pricingTier.anchorPrice ? (
                              <span className={s.pricingAnchor}>{pricingTier.anchorPrice}</span>
                            ) : null}
                            <div className={s.pricingPrice}>
                              <span className={s.pricingAmount}>{pricingTier.price}</span>
                              <span className={s.pricingPeriod}>{pricingTier.period}</span>
                            </div>
                          </div>
                          {pricingTier.priceNote ? (
                            <p className={s.pricingPriceNote}>{pricingTier.priceNote}</p>
                          ) : null}
                          <p className={s.pricingDescription}>{pricingTier.description}</p>
                        </div>

                        <ul className={s.pricingFeatures}>
                          {pricingTier.features.map((feature) => (
                            <li key={feature} className={s.pricingFeature}>
                              <Check className={s.pricingFeatureCheck} aria-hidden="true" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className={s.pricingActions}>
                          <button
                            type="button"
                            className={`${s.pricingButton} ${isRecommended ? s.pricingButtonPrimary : ''}`}
                            onClick={() => handlePricingAction(tier, pricingTier.ctaHref)}
                          >
                            {pricingTier.cta}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </SiteReveal>
            </div>
          </div>
        </section>

        <section className={s.faqSection}>
          <div className={s.sectionShell}>
            <SiteReveal delay={0.05}>
              <div className={s.faqHeader}>
                <p className={s.eyebrow}>{t('faq.eyebrow')}</p>
                <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
              </div>
            </SiteReveal>

            <div className={s.faqStack}>
              {Array.from({ length: 5 }, (_, index) => (
                <SiteReveal key={index} delay={0.08 + index * 0.04}>
                  <details className={s.faqItem}>
                    <summary className={s.faqSummary}>
                      <h3 className={s.faqQuestion}>{t(`faq.items.${index}.q`)}</h3>
                      <span className={s.faqMarker} aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p className={s.faqAnswer}>{t(`faq.items.${index}.a`)}</p>
                  </details>
                </SiteReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pre-register" className={s.finalSection}>
          <div className={s.sectionShell}>
            <div className={s.finalPanel}>
              <div className={s.finalGlow} aria-hidden="true" />

              <SiteReveal className={s.finalCopy} delay={0.05}>
                <span className={s.finalEyebrow}>
                  <span className={s.finalEyebrowDot} />
                  {t('finalCta.eyebrow')}
                </span>
                <h2 className={s.finalTitle}>{t('finalCta.title')}</h2>
                <p className={s.finalBody}>{t('finalCta.body')}</p>
                <div className={s.finalCallout}>
                  <p className={s.finalFormHeadline}>{t('finalCta.formHeadline')}</p>
                  <p className={s.finalFormSubline}>{t('finalCta.formSubline')}</p>
                </div>
                <div className={s.finalActions}>
                  <button type="button" className={s.finalButton} onClick={() => openForm()}>
                    {t('finalCta.ctaButton')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <a
                    href={FOUNDER_CALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={s.heroSecondary}
                  >
                    {t('finalCta.secondaryButton')}
                  </a>
                  <p className={s.finalMeta}>{t('finalCta.formCtaMeta')}</p>
                </div>
              </SiteReveal>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
