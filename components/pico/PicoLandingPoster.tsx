'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check, Map, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

import s from './PicoLandingPoster.module.css'
import { SiteReveal } from '@/components/site/SiteReveal'
import { PicoLangSwitcher } from './PicoLangSwitcher'
import { getPicoDefaultMessages } from '@/lib/pico/defaultMessages'
import { usePicoHref } from '@/lib/pico/navigation'
import { picoRobotArtById } from '@/lib/picoRobotArt'

const STEP_ICONS = [Map, MessageSquare, ShieldCheck, Sparkles] as const
const PRICING_TIERS = ['starter', 'pro', 'enterprise'] as const
const FINAL_FAQ_ITEMS = [0, 1, 3] as const
const landingTruth = getPicoDefaultMessages().pico
const pricingRouteLabel = 'Open pricing'

export function PicoLandingPoster() {
  const t = useTranslations('pico')
  const prefersReducedMotion = useReducedMotion()
  const toHref = usePicoHref()
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
  const guideRobot = picoRobotArtById.guide
  const celebrateRobot = picoRobotArtById.celebrate

  return (
    <div data-testid="pico-landing" className={s.page}>
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

          <nav className={s.navLinks} aria-label="Page sections">
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
            <Link href={toHref('/onboarding')} className={s.navCta}>
              <span className={s.navCtaLabel}>{landingTruth.nav.cta}</span>
              <span className={s.navCtaLabelMobile}>{landingTruth.nav.cta}</span>
              <ArrowRight className={s.navCtaIcon} />
            </Link>
          </div>
        </div>
      </header>

      <main className={s.main}>
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
                  <span className={s.heroBadge}>{landingTruth.hero.badge}</span>
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
                  <Link href={toHref('/onboarding')} className={s.heroPrimary}>
                    {landingTruth.hero.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#pricing" className={s.heroSecondary}>
                    {t('hero.ctaSecondary') || 'See pricing'}
                  </a>
                </div>
              </SiteReveal>

              <SiteReveal delay={0.31}>
                <p className={s.heroMeta}>{landingTruth.hero.meta}</p>
              </SiteReveal>
            </motion.div>

            <SiteReveal delay={0.16} className={s.heroVisualWrap}>
              <motion.div
                className={s.heroVisual}
                style={{ y: heroVisualY, scale: heroVisualScale }}
              >
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
                </div>

                <div className={s.pathVisual}>
                  <div className={s.pathVisualHeader}>
                    <span className={s.pathVisualLabel}>{t('beforeAfter.eyebrow')}</span>
                    <span className={s.pathVisualRule}>{t('trustBar.items.2')}</span>
                  </div>

                  <div className={s.pathRobotWrap}>
                    <div className={s.pathRobotGlow} aria-hidden="true" />
                    <Image
                      src={guideRobot.src}
                      alt=""
                      width={1536}
                      height={1024}
                      className={s.pathRobotImage}
                      sizes="(max-width: 1024px) 60vw, 24rem"
                    />
                  </div>

                  <p className={s.pathVisualNote}>{t('beforeAfter.close')}</p>
                </div>
              </SiteReveal>

              <ol className={s.pathList}>
                {Array.from({ length: 4 }, (_, index) => {
                  const Icon = STEP_ICONS[index]

                  return (
                    <SiteReveal key={index} delay={0.08 + index * 0.06}>
                      <motion.li
                        className={s.pathItem}
                        whileHover={prefersReducedMotion ? undefined : { x: 6 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className={s.pathItemTop}>
                          <span className={s.pathNumber}>0{index + 1}</span>
                          <span className={s.pathIcon}>
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className={s.pathItemCopy}>
                          <h3 className={s.pathItemTitle}>{t(`platform.howItWorks.${index}.title`)}</h3>
                          <p className={s.pathItemBody}>{t(`platform.howItWorks.${index}.body`)}</p>
                        </div>
                      </motion.li>
                    </SiteReveal>
                  )
                })}
              </ol>
            </div>

            <SiteReveal delay={0.18}>
              <div className={s.pathOutcomeBand}>
                <div className={s.pathOutcomeIntro}>
                  <p className={s.eyebrow}>{t('beforeAfter.eyebrow')}</p>
                  <p className={s.pathOutcomeLead}>{t('beforeAfter.close')}</p>
                </div>

                <div className={s.pathOutcomeList}>
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className={s.pathOutcomeItem}>
                      <span className={s.pathOutcomeIndex}>0{index + 1}</span>
                      <p className={s.pathOutcomeText}>{t(`beforeAfter.items.${index}.after`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SiteReveal>
          </div>
        </section>

        <section id="pricing" className={s.accessSection}>
          <div className={s.sectionShell}>
            <div className={s.accessGrid}>
              <SiteReveal className={s.accessIntro} delay={0.05}>
                <p className={s.eyebrow}>{landingTruth.earlyAccess.eyebrow}</p>
                <h2 className={s.sectionTitle}>{landingTruth.earlyAccess.title}</h2>
                <p className={s.sectionBody}>{landingTruth.earlyAccess.body}</p>

                <ul className={s.benefitsList}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <li key={index} className={s.benefitItem}>
                      <Check className={s.benefitCheck} />
                      <span>{landingTruth.earlyAccess.benefits[String(index)]}</span>
                    </li>
                  ))}
                </ul>
              </SiteReveal>

              <SiteReveal className={s.pricingBoard} delay={0.12}>
                <div className={s.pricingHeader}>
                  <p className={s.eyebrow}>{t('pricing.eyebrow')}</p>
                  <p className={s.pricingLead}>{landingTruth.pricingPage.accessPlans.body}</p>
                  <p className={s.pricingMeta}>{landingTruth.pricingPage.accessPlans.meta}</p>
                </div>

                <div className={s.pricingTiers}>
                  {PRICING_TIERS.map((tier) => {
                    const ctaHref = t(`pricing.tiers.${tier}.ctaHref`)
                    const isExternal = ctaHref.startsWith('http')
                    const isRecommended = tier === 'pro'

                    return (
                      <div
                        key={tier}
                        className={`${s.pricingTier} ${isRecommended ? s.pricingTierRecommended : ''}`}
                      >
                        <div className={s.pricingTop}>
                          <div className={s.pricingTierHeader}>
                            <p className={s.pricingName}>{t(`pricing.tiers.${tier}.name`)}</p>
                            {isRecommended ? (
                              <span className={s.pricingBadge}>{t('pricing.recommendedLabel')}</span>
                            ) : null}
                          </div>
                          <div className={s.pricingPrice}>
                            <span className={s.pricingAmount}>{t(`pricing.tiers.${tier}.price`)}</span>
                            <span className={s.pricingPeriod}>{t(`pricing.tiers.${tier}.period`)}</span>
                          </div>
                          <p className={s.pricingDescription}>
                            {t(`pricing.tiers.${tier}.description`)}
                          </p>
                        </div>

                        <ul className={s.pricingFeatures}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <li key={index} className={s.pricingFeature}>
                              <Check className={s.pricingFeatureCheck} />
                              <span>{t(`pricing.tiers.${tier}.features.${index}`)}</span>
                            </li>
                          ))}
                        </ul>

                        {isExternal ? (
                          <a
                            href={ctaHref}
                            target="_blank"
                            rel="noreferrer"
                            className={`${s.pricingButton} ${isRecommended ? s.pricingButtonPrimary : ''}`}
                          >
                            {t(`pricing.tiers.${tier}.cta`)}
                          </a>
                        ) : (
                          <Link
                            href={toHref('/pricing')}
                            className={`${s.pricingButton} ${isRecommended ? s.pricingButtonPrimary : ''}`}
                          >
                            {pricingRouteLabel}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </SiteReveal>
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
                  {landingTruth.finalCta.eyebrow}
                </span>
                <h2 className={s.finalTitle}>{landingTruth.finalCta.title}</h2>
                <p className={s.finalBody}>{landingTruth.finalCta.body}</p>
                <div className={s.finalCallout}>
                  <p className={s.finalFormHeadline}>{landingTruth.finalCta.formHeadline}</p>
                  <p className={s.finalFormSubline}>{landingTruth.finalCta.formSubline}</p>
                </div>
                <div className={s.finalActions}>
                  <Link href={toHref('/onboarding')} className={s.finalButton}>
                    {landingTruth.finalCta.ctaButton}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className={s.finalMeta}>{landingTruth.finalCta.formCtaMeta}</p>
                </div>
              </SiteReveal>

              <div className={s.finalAside}>
                <SiteReveal className={s.finalVisual} delay={0.14}>
                  <div className={s.finalRobotFrame} aria-hidden="true">
                    <Image
                      src={celebrateRobot.src}
                      alt=""
                      width={1536}
                      height={1024}
                      className={s.finalRobotImage}
                      sizes="(max-width: 900px) 70vw, 28rem"
                    />
                  </div>
                </SiteReveal>

                <SiteReveal className={s.finalFaq} delay={0.2}>
                  <p className={s.finalFaqLabel}>{t('finalCta.faqLabel')}</p>

                  <div className={s.faqStack}>
                    {FINAL_FAQ_ITEMS.map((index) => (
                      <details key={index} className={s.faqItem}>
                        <summary className={s.faqSummary}>
                          <h3 className={s.faqQuestion}>{landingTruth.faq.items[String(index)].q}</h3>
                          <span className={s.faqMarker} aria-hidden="true">
                            +
                          </span>
                        </summary>
                        <p className={s.faqAnswer}>{landingTruth.faq.items[String(index)].a}</p>
                      </details>
                    ))}
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
