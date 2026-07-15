'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import s from './PicoLanding.module.css'
import { SiteReveal } from '@/components/site/SiteReveal'
import { picoRobotArtById } from '@/lib/picoRobotArt'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'

const STEP_ICONS = [
  <path key="connect" d="M4 12h16M12 4v16" />,
  <path key="repair" d="m5 12 4 4L19 6" />,
  <path key="ship" d="M5 19 19 5M8 5h11v11" />,
]

export function PicoLandingPage() {
  const t = useTranslations('pico')
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
              <Image src="/pico/logo.png" alt="PicoMUTX" width={20} height={20} priority />
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
                <div className={s.heroCtaRow}>
                  <button
                    type="button"
                    className={s.heroCtaPrimary}
                    onClick={() => openForm('building-first')}
                  >
                    {t('hero.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a href="#launch-path" className={s.heroCtaSecondary}>{t('hero.ctaSecondary')}</a>
                </div>
              </SiteReveal>
            </div>

            <SiteReveal delay={0.18}>
              <div className={s.heroVisualRail}>
                <div className={s.heroRobotStage} aria-hidden="true">
                  <div className={s.heroRobotGlow} />
                  <div className={s.heroVisualLabel}>PicoMUTX / 01</div>
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

        <section id="launch-path" className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.shell}>
            <div className={s.launchIntro}>
              <div className={s.sectionHeader}>
                <span className={s.eyebrow}>{t('platform.eyebrow')}</span>
                <h2 className={s.sectionTitle}>{t('platform.title')}</h2>
                <p className={s.sectionBody}>{t('platform.body')}</p>
              </div>
              <Link href="/pico/pricing" className={s.heroCtaSecondary}>See plans</Link>
            </div>
            <ol className={s.launchSteps}>
              {Array.from({ length: 3 }, (_, i) => (
                <SiteReveal key={i} delay={i * 0.06}>
                  <li className={s.launchStep}>
                    <span className={s.launchIndex}>0{i + 1}</span>
                    <div className={s.launchStepIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {STEP_ICONS[i]}
                      </svg>
                    </div>
                    <div className={s.launchStepContent}>
                      <h3 className={s.launchTitle}>{t(`platform.howItWorks.${i}.title`)}</h3>
                      <p className={s.launchBody}>{t(`platform.howItWorks.${i}.body`)}</p>
                    </div>
                  </li>
                </SiteReveal>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.shell}>
            <div className={s.sectionHeader}>
              <span className={s.eyebrow}>{t('faq.eyebrow')}</span>
              <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
            </div>
            <div className={s.faqStack}>
              {Array.from({ length: 3 }, (_, i) => (
                <details key={i} className={s.faqItem}>
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
                  <button onClick={() => openForm()} className={s.btnPrimary} type="button">
                    {t('finalCta.ctaButton')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SiteReveal>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
