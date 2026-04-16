'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

import {
  marketingHomepage,
  type MarketingActionLink,
  type MarketingActionTone,
  type MarketingHomepage,
} from '@/lib/marketingContent'
import { picoRobotMarketingHighlights } from '@/lib/picoRobotArt'

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

type MarketingExampleItem = MarketingHomepage['salesSections']['examples']['items'][number]
type MarketingDemoItem = MarketingHomepage['salesSections']['demo']['tabs'][number]

type TerminalPlaybackCardProps = {
  item: MarketingExampleItem
  delay?: number
}

const prefetchedDemoMedia = new Set<string>()
const TERMINAL_PROMPT_DELAY_MS = 160
const TERMINAL_TYPING_STEP_MS = 18
const TERMINAL_REPLY_STAGGER_MS = 240

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

function prominentActionClassName(tone?: MarketingActionTone) {
  switch (tone) {
    case 'pico':
      return core.buttonPrimary
    case 'secondary':
    case 'ghost':
      return core.buttonGhost
    default:
      return core.buttonPrimary
  }
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

function TerminalPlaybackCard({ item, delay = 0 }: TerminalPlaybackCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(terminalRef, {
    once: true,
    amount: 0.52,
  })
  const [typedPromptLength, setTypedPromptLength] = useState(
    prefersReducedMotion ? item.userPrompt.length : 0
  )
  const [visibleReplyCount, setVisibleReplyCount] = useState(
    prefersReducedMotion ? item.apology.length : 0
  )
  const [streamState, setStreamState] = useState<'idle' | 'typing' | 'replying' | 'complete'>(
    prefersReducedMotion ? 'complete' : 'idle'
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedPromptLength(item.userPrompt.length)
      setVisibleReplyCount(item.apology.length)
      setStreamState('complete')
      return
    }

    if (!isInView) {
      return
    }

    const startDelay = Math.round(delay * 1000)
    const timers: number[] = []

    setTypedPromptLength(0)
    setVisibleReplyCount(0)
    setStreamState('typing')

    for (let index = 0; index < item.userPrompt.length; index += 1) {
      timers.push(
        window.setTimeout(() => {
          setTypedPromptLength(index + 1)

          if (index === item.userPrompt.length - 1) {
            setStreamState('replying')
          }
        }, startDelay + TERMINAL_PROMPT_DELAY_MS + index * TERMINAL_TYPING_STEP_MS)
      )
    }

    const replyStartDelay =
      startDelay +
      TERMINAL_PROMPT_DELAY_MS +
      item.userPrompt.length * TERMINAL_TYPING_STEP_MS +
      120

    item.apology.forEach((_, lineIndex) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleReplyCount(lineIndex + 1)

          if (lineIndex === item.apology.length - 1) {
            setStreamState('complete')
          }
        }, replyStartDelay + lineIndex * TERMINAL_REPLY_STAGGER_MS)
      )
    })

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [delay, isInView, item.apology, item.userPrompt, prefersReducedMotion])

  const visiblePrompt =
    prefersReducedMotion || streamState === 'complete'
      ? item.userPrompt
      : item.userPrompt.slice(0, typedPromptLength)
  const isStreaming = streamState === 'typing' || streamState === 'replying'

  return (
    <motion.div
      ref={terminalRef}
      className={home.terminalWindow}
      data-streaming={isStreaming ? '1' : '0'}
      data-stream-state={streamState}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -2,
            }
      }
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={home.terminalChrome}>
        <span className={home.terminalDot} data-tone="red" />
        <span className={home.terminalDot} data-tone="yellow" />
        <span className={home.terminalDot} data-tone="green" />
        <span className={home.terminalTitle}>{item.eyebrow}</span>
      </div>
      <div className={home.terminalBody}>
        <p className={home.terminalPromptLine}>
          <span className={home.terminalPrompt}>{'>'}</span>
          <span className={home.terminalCommand}>
            {visiblePrompt}
            {!prefersReducedMotion && streamState !== 'complete' ? (
              <span className={home.terminalCursor} aria-hidden="true" />
            ) : null}
          </span>
        </p>
        <div
          className={home.terminalReplyBlock}
          style={{ '--terminal-line-count': item.apology.length } as CSSProperties}
        >
          {item.apology.slice(0, visibleReplyCount).map((line, lineIndex) => (
            <motion.p
              key={`${item.title}-${lineIndex}`}
              className={home.terminalReplyLine}
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={home.terminalAgent}>agent</span>
              <span>{line}</span>
            </motion.p>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function ActiveDemoMedia({ activeDemo }: { activeDemo: MarketingDemoItem }) {
  return (
    <img
      src={activeDemo.mediaSrc}
      alt={activeDemo.mediaAlt}
      className={home.demoVideo}
      decoding="async"
      loading="lazy"
    />
  )
}

export function MarketingHomePage() {
  const demoTabs = marketingHomepage.salesSections.demo.tabs
  const picoHighlights = picoRobotMarketingHighlights
  const prefersReducedMotion = useReducedMotion()
  const [activeDemoId, setActiveDemoId] = useState(demoTabs[0]?.id)
  const demoSectionRef = useRef<HTMLElement | null>(null)
  const demoStateRefs = useRef<Array<HTMLDivElement | null>>([])
  const [primaryAction, ...secondaryActions] = marketingHomepage.hero.actions
  const [finalPrimaryAction, ...finalSecondaryActions] = marketingHomepage.salesSections.cta.actions
  const isDemoSectionNear = useInView(demoSectionRef, {
    once: true,
    margin: '320px 0px',
  })
  const activeDemoIndex = Math.max(demoTabs.findIndex((tab) => tab.id === activeDemoId), 0)
  const activeDemo = demoTabs[activeDemoIndex] ?? demoTabs[0]

  useEffect(() => {
    if (!isDemoSectionNear) {
      return
    }

    for (const tab of demoTabs) {
      if (!prefetchedDemoMedia.has(tab.mediaSrc)) {
        const image = new Image()
        image.src = tab.mediaSrc
        prefetchedDemoMedia.add(tab.mediaSrc)
      }

      if (tab.mediaPosterSrc && !prefetchedDemoMedia.has(tab.mediaPosterSrc)) {
        const image = new Image()
        image.src = tab.mediaPosterSrc
        prefetchedDemoMedia.add(tab.mediaPosterSrc)
      }
    }
  }, [demoTabs, isDemoSectionNear])

  useEffect(() => {
    let frameId = 0

    const syncActiveDemoToScroll = () => {
      frameId = 0

      const beatNodes = demoStateRefs.current.filter((node): node is HTMLDivElement => Boolean(node))

      if (beatNodes.length === 0) {
        return
      }

      const focusLine = window.innerHeight * 0.52
      const nextDemoId = beatNodes
        .map((node) => ({
          id: node.getAttribute('data-demo-id'),
          distance: Math.abs(node.getBoundingClientRect().top - focusLine),
        }))
        .sort((left, right) => left.distance - right.distance)[0]?.id

      if (!nextDemoId) {
        return
      }

      setActiveDemoId((currentDemoId) => (currentDemoId === nextDemoId ? currentDemoId : nextDemoId))
    }

    const queueSync = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(syncActiveDemoToScroll)
    }

    queueSync()
    window.addEventListener('scroll', queueSync, { passive: true })
    window.addEventListener('resize', queueSync)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', queueSync)
      window.removeEventListener('resize', queueSync)
    }
  }, [])

  const scrollToDemoState = (index: number) => {
    const nextNode = demoStateRefs.current[index]
    const nextDemo = demoTabs[index]

    if (nextDemo) {
      setActiveDemoId(nextDemo.id)
    }

    if (!nextNode) {
      return
    }

    nextNode.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

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
                  <ActionLink
                    action={primaryAction}
                    className={prominentActionClassName(primaryAction?.tone)}
                  />
                  {secondaryActions[0] ? (
                    <ActionLink
                      action={secondaryActions[0]}
                      className={prominentActionClassName(secondaryActions[0].tone)}
                    />
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
              <div className={home.socialProofIntro}>
                <p className={home.socialProofTagline}>{marketingHomepage.socialProof.tagline}</p>
                <h2 className={home.socialProofTitle}>{marketingHomepage.socialProof.title}</h2>
                <p className={home.socialProofBody}>{marketingHomepage.socialProof.body}</p>
              </div>
              <div className={home.socialProofMetrics}>
                {marketingHomepage.socialProof.items.map((item) => (
                  <div key={item.label} className={home.socialProofMetric}>
                    <p className={home.socialProofValue}>{item.value}</p>
                    <p className={home.socialProofLabel}>{item.label}</p>
                    <p className={home.socialProofDetail}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          ref={demoSectionRef}
          className={home.demoSection}
          data-testid="homepage-demo-section"
        >
          <div className={core.shell}>
            <div className={home.demoLayout}>
              <MarketingReveal className={home.demoIntro} distance={22}>
                <p className={home.sectionEyebrow}>{marketingHomepage.salesSections.demo.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.salesSections.demo.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.salesSections.demo.body}</p>
              </MarketingReveal>

              <div className={home.demoScroller}>
                <div className={home.demoStickyStage}>
                  <div className={home.demoStickyInner}>
                    <div className={home.demoNarrative}>
                      <div className={home.demoStateNav} aria-label="Operator walkthrough states">
                        {demoTabs.map((tab, index) => {
                          const isActive = tab.id === activeDemo.id

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              className={home.demoStateButton}
                              data-active={isActive ? '1' : '0'}
                              onClick={() => scrollToDemoState(index)}
                              aria-pressed={isActive}
                            >
                              <span className={home.demoStateNumber}>{`0${index + 1}`}</span>
                              <span className={home.demoStateName}>{tab.label}</span>
                            </button>
                          )
                        })}
                      </div>

                      <motion.div
                        key={activeDemo.id}
                        className={home.demoNarrativeCopy}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className={home.demoMetaLabel}>{activeDemo.label}</p>
                        <h3 className={home.demoStateTitle}>{activeDemo.title}</h3>
                        <p className={home.demoStateBody}>{activeDemo.body}</p>
                      </motion.div>
                    </div>

                    <motion.div
                      key={activeDemo.id}
                      className={home.demoFrame}
                      data-testid="homepage-demo-panel"
                      initial={prefersReducedMotion ? false : { opacity: 0.88, y: 16, scale: 0.994 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ActiveDemoMedia activeDemo={activeDemo} />
                    </motion.div>
                  </div>
                </div>

                <div className={home.demoStateRail} aria-hidden="true">
                  {demoTabs.map((tab, index) => (
                    <div
                      key={tab.id}
                      ref={(node) => {
                        demoStateRefs.current[index] = node
                      }}
                      className={home.demoStateStep}
                      data-demo-id={tab.id}
                    />
                  ))}
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
                  <TerminalPlaybackCard item={item} delay={index * 0.12} />

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
                  <div className={home.proofCardHeader}>
                    <h3 className={home.proofCardTitle}>{item.title}</h3>
                  </div>
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

        <section className={home.picoSection} data-testid="homepage-pico-robot-section">
          <div className={core.shell}>
            <div className={home.picoSectionGrid}>
              <MarketingReveal className={home.picoIntro} distance={22}>
                <p className={home.sectionEyebrow}>Meet PicoMUTX</p>
                <h2 className={home.sectionTitle}>The guided operator now shows up in the platform.</h2>
                <p className={home.sectionBody}>
                  PicoMUTX carries the same control language into onboarding, tutoring, and
                  live autopilot, with a visual system that feels like part of MUTX instead of
                  an orphaned side project.
                </p>
                <div className={home.picoActions}>
                  <ActionLink
                    action={{ label: 'Open PicoMUTX', href: '/pico', tone: 'secondary' }}
                    className={core.buttonPrimary}
                  />
                  <ActionLink
                    action={{ label: 'See Autopilot', href: '/pico/autopilot', tone: 'ghost' }}
                    className={home.secondaryAction}
                  />
                </div>
              </MarketingReveal>

              <div className={home.picoHighlights}>
                {picoHighlights.map((item, index) => (
                  <HoverCard
                    key={item.id}
                    className={home.picoCard}
                    delay={index * 0.08}
                    distance={18}
                  >
                    <div className={home.picoCardMedia}>
                      <img
                        src={item.src}
                        alt={item.alt}
                        className={home.picoCardImage}
                        decoding="async"
                        loading="lazy"
                      />
                    </div>
                    <div className={home.picoCardCopy}>
                      <p className={home.picoCardTitle}>{item.title}</p>
                      <p className={home.picoCardBody}>{item.caption}</p>
                    </div>
                  </HoverCard>
                ))}
              </div>
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
                  <ActionLink
                    action={finalPrimaryAction}
                    className={prominentActionClassName(finalPrimaryAction?.tone)}
                  />
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
