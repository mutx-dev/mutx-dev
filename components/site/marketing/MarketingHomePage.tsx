'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
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
        rel="noopener noreferrer"
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
                      src="/logo.webp"
                      alt="MUTX logo"
                      className={home.heroLockupMarkImage}
                      decoding="async"
                    />
                  </span>
                  <span className={home.heroLockupMarkFrame} aria-hidden="true">
                    <img
                      src="/logo.webp"
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
                  see · control · prove
                </span>
                </span>
              </div>

              <div className={home.heroContent} data-testid="homepage-hero-content">
                <p className={home.heroEyebrow}>{marketingHomepage.hero.tagline}</p>
                <h1 className={home.heroTitle}>{marketingHomepage.hero.title}</h1>
                {marketingHomepage.hero.support && (
                  <p className={home.heroSupport}>{marketingHomepage.hero.support}</p>
                )}
                <div className={home.heroActions}>
                  <ActionLink action={primaryAction} className={core.buttonPrimary} />
                  {secondaryActions[0] ? (
                    <ActionLink action={secondaryActions[0]} className={core.buttonGhost} />
                  ) : null}
                  <div className={home.heroSecondaryActions}>
                    {secondaryActions.slice(1).map((action) => (
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

        <section className={home.socialProofStrip} data-testid="homepage-social-proof">
          <div className={core.shell}>
            <div className={home.socialProofInner}>
              <p className={home.socialProofTagline}>Trusted by teams running AI agents in production</p>
              <div className={home.socialProofMetrics}>
                <div className={home.socialProofMetric}>
                  <p className={home.socialProofValue}>100%</p>
                  <p className={home.socialProofLabel}>Audit Coverage</p>
                </div>
                <div className={home.socialProofMetric}>
                  <p className={home.socialProofValue}>&lt;2 min</p>
                  <p className={home.socialProofLabel}>Time to First Run</p>
                </div>
                <div className={home.socialProofMetric}>
                  <p className={home.socialProofValue}>0</p>
                  <p className={home.socialProofLabel}>Config Required</p>
                </div>
                <div className={home.socialProofMetric}>
                  <p className={home.socialProofValue}>macOS</p>
                  <p className={home.socialProofLabel}>Native Desktop</p>
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
                  key={activeDemo.id}
                  className={home.demoFrame}
                  id={`demo-panel-${activeDemo.id}`}
                  role="tabpanel"
                  aria-labelledby={`demo-tab-${activeDemo.id}`}
                  data-testid="homepage-demo-panel"
                  initial={prefersReducedMotion ? false : { opacity: 0.86, y: 14, scale: 0.992 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
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

                <div className={home.demoTabs} data-testid="homepage-demo-tabs">
                  {marketingHomepage.salesSections.demo.tabs.map((tab) => {
                    const isActive = tab.id === activeDemo.id

                    return (
                      <button
                        key={tab.id}
                        id={`demo-tab-${tab.id}`}
                        type="button"
                        className={home.demoTab}
                        data-active={isActive ? '1' : '0'}
                        onClick={() => setActiveDemoId(tab.id)}
                        aria-controls={`demo-panel-${tab.id}`}
                        aria-selected={isActive}
                      >
                        <p className={home.demoTabLabel}>{tab.label}</p>
                        <h3 className={home.demoTabTitle}>{tab.title}</h3>
                        <p className={home.demoTabBody}>{tab.body}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={home.examplesSection} data-testid="homepage-examples-section">
          <div className={core.shell}>
            <MarketingReveal className={home.examplesIntro}>
              <p className={home.sectionEyebrow}>{marketingHomepage.salesSections.examples.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.salesSections.examples.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.salesSections.examples.body}</p>
            </MarketingReveal>

            <div className={home.examplesGrid}>
              {marketingHomepage.salesSections.examples.items.map((item, index) => (
                <HoverCard
                  key={item.title}
                  className={home.exampleCard}
                  delay={index * 0.07}
                  distance={18}
                >
                  <div className={home.terminalWindow}>
                    <div className={home.terminalChrome}>
                      <span className={home.terminalDot} data-tone="red" />
                      <span className={home.terminalDot} data-tone="yellow" />
                      <span className={home.terminalDot} data-tone="green" />
                      <span className={home.terminalTitle}>{item.eyebrow}</span>
                    </div>
                    <div className={home.terminalBody}>
                      <p className={home.terminalPromptLine}>
                        <span className={home.terminalPrompt}>{'>'}</span>
                        <span className={home.terminalCommand}>{item.userPrompt}</span>
                      </p>
                      <div className={home.terminalReplyBlock}>
                        {item.apology.map((line, lineIndex) => (
                          <p key={lineIndex} className={home.terminalReplyLine}>
                            <span className={home.terminalAgent}>agent</span>
                            <span>{line}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={home.exampleCopy}>
                    <h3 className={home.exampleTitle}>{item.title}</h3>
                    <p className={home.exampleOutcome}>{item.fallout}</p>
                  </div>
                </HoverCard>
              ))}
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
                      <p className={home.proofLaneLabelMUTX}>With MUTX</p>
                      <p className={home.proofLaneBodyMUTX}>{item.after}</p>
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
