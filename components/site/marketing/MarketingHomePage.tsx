'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { CalendlyPopupButton } from '@/components/site/CalendlyPopupButton'
import { motion, useReducedMotion } from 'framer-motion'

import {
  marketingHomepage,
  type MarketingActionLink,
} from '@/lib/marketingContent'

import core from './MarketingCore.module.css'
import { MarketingHeroBackdrop } from './MarketingHeroBackdrop'
import home from './MarketingHome.module.css'
import { MarketingLoader } from './MarketingLoader'
import { MarketingReveal } from './MarketingReveal'

type ActionLinkProps = {
  action: MarketingActionLink
  className: string
}

type HoverCardProps = {
  className: string
  children: ReactNode
  delay?: number
  distance?: number
}

function ActionLink({ action, className }: ActionLinkProps) {
  const icon = action.tone === 'primary' ? (
    <ArrowRight className="h-4 w-4" />
  ) : (
    <ArrowUpRight className="h-4 w-4" />
  )

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {action.label}
        {icon}
      </a>
    )
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
      {icon}
    </Link>
  )
}

function HoverCard({ className, children, delay = 0, distance = 18 }: HoverCardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <MarketingReveal className={className} delay={delay} distance={distance}>
      <motion.div
        className={home.hoverCardShell}
        whileHover={
          prefersReducedMotion
            ? undefined
            : {
                y: -6,
                scale: 1.01,
              }
        }
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MarketingReveal>
  )
}

export function MarketingHomePage() {
  const prefersReducedMotion = useReducedMotion()
  const [activeDemoId, setActiveDemoId] = useState(marketingHomepage.salesSections.demo.tabs[0]?.id)
  const [primaryAction, ...secondaryActions] = marketingHomepage.hero.actions
  const [finalPrimaryAction, ...finalSecondaryActions] = marketingHomepage.salesSections.cta.actions

  const activeDemo =
    marketingHomepage.salesSections.demo.tabs.find((tab) => tab.id === activeDemoId) ??
    marketingHomepage.salesSections.demo.tabs[0]

  return (
    <div className={`${core.page} ${core.homePage}`}>
      <MarketingLoader />

      <main className={core.main}>
        <section className={home.heroSection}>
          <MarketingHeroBackdrop
            className={home.heroMedia}
            src={marketingHomepage.hero.backgroundSrc}
            fetchPriority="high"
          />

          <div className={home.heroShell}>
            <div className={home.heroColumn}>
              <div className={home.heroLockup} data-testid="homepage-lockup">
                <span className={home.heroLockupMark} data-testid="homepage-lockup-mark">
                  <span className={home.heroLockupTarget} data-loader-target="marketing-brand-mark">
                    <img
                      src="/logo.png"
                      alt="MUTX logo"
                      className={home.heroLockupMarkImage}
                      decoding="async"
                    />
                  </span>
                  <span className={home.heroLockupMarkFrame} aria-hidden="true">
                    <img
                      src="/logo.png"
                      alt=""
                      className={home.heroLockupMarkImage}
                      decoding="async"
                    />
                  </span>
                </span>
                <span className={home.heroLockupCopy} data-testid="homepage-lockup-copy">
                  <span className={home.heroLockupWord} data-testid="homepage-lockup-word">
                    MUTX
                  </span>
                  <span className={home.heroLockupMeta} data-testid="homepage-lockup-meta">
                    open control for deployed agents
                  </span>
                </span>
              </div>

              <div className={home.heroContent} data-testid="homepage-hero-content">
                <p className={home.heroEyebrow}>{marketingHomepage.hero.tagline}</p>
                <h1 className={home.heroTitle}>{marketingHomepage.hero.title}</h1>
                <div className={home.heroActions}>
                  <ActionLink action={primaryAction} className={core.buttonPrimary} />
                  <CalendlyPopupButton
                    ariaLabel="Book a call with MUTX"
                    className={core.buttonGhost}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d="M18.344 16.749a11.0 11.0 0 0 1-6.383-2.1.4.4 0 0 0-.446.038l-2.16 1.087a.47.47 0 0 1-.563-.063l-1.127-1.1a.4.4 0 0 0-.437-.065 7.5 7.5 0 0 1-3.207-2.21.4.4 0 0 0-.5.04l-1.8 1.8a.4.4 0 0 0 .046.595c1.2 1.2 2.4 2.4 3.6 3.6a.4.4 0 0 0 .595.046l1.8-1.8a.4.4 0 0 0 .04-.5 7.5 7.5 0 0 1-2.21-3.207.4.4 0 0 0-.065-.437l-1.1-1.127a.47.47 0 0 1-.063-.563l1.087-2.16a.4.4 0 0 0 .038-.446 11.0 11.0 0 0 1-2.1-6.383.4.4 0 0 0-.5-.341l-3.2 1.2a.4.4 0 0 0-.246.165l-1.4 2.1A19.5 19.5 0 0 0 7.7 16.4a.4.4 0 0 0 .341.5l3.2-1.2a.4.4 0 0 0 .246-.165l1.45-2.175a.4.4 0 0 1 .338-.158c1.55.3 3.2.3 4.75 0a.4.4 0 0 1 .338.158l2.175 1.45a.4.4 0 0 0 .246.165l3.2 1.2a.4.4 0 0 0 .5-.341 19.5 19.5 0 0 0-3.45-8.625l-1.4-2.1a.4.4 0 0 0-.246-.165l-3.2-1.2a.4.4 0 0 0-.5.341z" />
                    </svg>
                    Book a Call
                  </CalendlyPopupButton>
                  <div className={home.heroSecondaryActions}>
                    {secondaryActions.map((action) => (
                      <ActionLink
                        key={action.label}
                        action={action}
                        className={home.secondaryAction}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={home.demoSection} data-testid="homepage-demo-section">
          <div className={core.shell}>
            <div className={home.demoLayout}>
              <MarketingReveal className={home.demoIntro}>
                <p className={home.sectionEyebrow}>{marketingHomepage.salesSections.demo.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.salesSections.demo.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.salesSections.demo.body}</p>
              </MarketingReveal>

              <div className={home.demoStage}>
                <motion.div
                  className={home.demoFrame}
                  id={`demo-panel-${activeDemo.id}`}
                  role="tabpanel"
                  aria-labelledby={`demo-tab-${activeDemo.id}`}
                  data-testid="homepage-demo-panel"
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: -4,
                          scale: 1.005,
                        }
                  }
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeDemo.mediaType === 'gif' ? (
                    <img
                      key={activeDemo.id}
                      src={activeDemo.mediaSrc}
                      alt={activeDemo.mediaAlt}
                      className={home.demoVideo}
                      decoding="async"
                    />
                  ) : (
                    <Image
                      key={activeDemo.id}
                      src={activeDemo.mediaSrc}
                      alt={activeDemo.mediaAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 64rem"
                      className={home.exampleImage}
                    />
                  )}
                </motion.div>

                <div className={home.demoTabs} role="tablist" aria-label="MUTX product demo views">
                  {marketingHomepage.salesSections.demo.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      id={`demo-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={tab.id === activeDemo.id}
                      aria-controls={`demo-panel-${tab.id}`}
                      className={home.demoTab}
                      data-active={tab.id === activeDemo.id ? '1' : '0'}
                      onClick={() => setActiveDemoId(tab.id)}
                    >
                      <span className={home.demoTabLabel}>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={home.proofSection} data-testid="homepage-proof-section">
          <div className={core.shell}>
            <MarketingReveal className={home.proofIntro}>
              <p className={home.sectionEyebrow}>{marketingHomepage.salesSections.proof.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.salesSections.proof.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.salesSections.proof.body}</p>
            </MarketingReveal>

            <div className={home.proofGrid}>
              {marketingHomepage.salesSections.proof.items.map((item, index) => (
                <HoverCard
                  key={item.title}
                  className={home.proofCard}
                  delay={index * 0.07}
                  distance={20}
                >
                  <h3 className={home.proofCardTitle}>{item.title}</h3>
                  <div className={home.proofCompare}>
                    <div className={home.proofLane}>
                      <p className={home.proofLaneLabel}>Before</p>
                      <p className={home.proofLaneBody}>{item.before}</p>
                    </div>
                    <div className={home.proofLane}>
                      <p className={home.proofLaneLabel}>With MUTX</p>
                      <p className={home.proofLaneBody}>{item.after}</p>
                    </div>
                  </div>
                </HoverCard>
              ))}
            </div>
          </div>
        </section>

        <section className={home.finalSection} data-testid="homepage-final-cta">
          <div className={core.shell}>
            <MarketingReveal className={home.finalInner} distance={24}>
              <div className={home.finalCopy}>
                <p className={home.sectionEyebrow}>{marketingHomepage.salesSections.cta.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.salesSections.cta.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.salesSections.cta.body}</p>
                <div className={home.finalActions}>
                  <ActionLink action={finalPrimaryAction} className={core.buttonPrimary} />
                  <div className={home.finalSecondaryActions}>
                    {finalSecondaryActions.map((action) => (
                      <ActionLink
                        key={action.label}
                        action={action}
                        className={home.secondaryAction}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                className={home.finalPreview}
                data-testid="homepage-demo-preview"
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -5,
                        scale: 1.01,
                      }
                }
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={home.finalPreviewDevice}>
                  <div className={home.finalPreviewScreen}>
                    <img
                      src={marketingHomepage.salesSections.cta.mediaSrc}
                      alt={marketingHomepage.salesSections.cta.mediaAlt}
                      className={home.finalPreviewImage}
                      decoding="async"
                    />
                  </div>
                </div>
              </motion.div>
            </MarketingReveal>
          </div>
        </section>
      </main>
    </div>
  )
}
