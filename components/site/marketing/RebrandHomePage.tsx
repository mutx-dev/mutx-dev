'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'

import { picoRobotMarketingHighlights } from '@/lib/picoRobotArt'
import { marketingHomepage, type MarketingActionLink } from '@/lib/marketingContent'
import { PublicNav } from '@/components/site/PublicNav'

import { MarketingReveal } from './MarketingReveal'
import styles from './RebrandHomePage.module.css'

type ActionLinkProps = {
  action: MarketingActionLink
  className: string
}

const SIGNALS = [
  { code: '01', label: 'Observe', body: 'Every run becomes a readable signal.' },
  { code: '02', label: 'Bound', body: 'Permissions stop the wrong move early.' },
  { code: '03', label: 'Prove', body: 'Receipts survive the handoff to humans.' },
]

const SYSTEM_ROWS = [
  { label: 'Runtime', value: 'healthy', tone: 'green' },
  { label: 'Policy mesh', value: 'enforced', tone: 'blue' },
  { label: 'Audit trail', value: 'recording', tone: 'lime' },
]

function ActionLink({ action, className }: ActionLinkProps) {
  const icon = action.external ? <ArrowUpRight aria-hidden="true" /> : <ArrowRight aria-hidden="true" />

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
        <span>{action.label}</span>
        {icon}
      </a>
    )
  }

  return (
    <Link href={action.href} className={className}>
      <span>{action.label}</span>
      {icon}
    </Link>
  )
}

export function RebrandHomePage() {
  const prefersReducedMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const imageX = useSpring(useTransform(pointerX, [-1, 1], [-16, 16]), { stiffness: 90, damping: 22 })
  const imageY = useSpring(useTransform(pointerY, [-1, 1], [-10, 10]), { stiffness: 90, damping: 22 })
  const gridY = useTransform(pointerY, [-1, 1], [-4, 4])
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, -56])
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.84], [1, 0.22])
  const [activeDemoIndex, setActiveDemoIndex] = useState(0)
  const demoTabs = marketingHomepage.salesSections.demo.tabs
  const activeDemo = demoTabs[activeDemoIndex] ?? demoTabs[0]

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || event.pointerType === 'touch') return

    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1)
    pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
  }

  const resetHeroPointer = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <div className={styles.page}>
      <PublicNav overlay />

      <main>
        <section
          ref={heroRef}
          className={styles.hero}
          onPointerMove={handleHeroPointerMove}
          onPointerLeave={resetHeroPointer}
        >
          <motion.div className={styles.heroImage} style={{ x: imageX, y: imageY, scale: 1.06 }} aria-hidden="true">
            <Image
              src="/landing/webp/victory-core.webp"
              alt=""
              fill
              priority
              loading="eager"
              sizes="100vw"
              className={styles.heroImageAsset}
            />
          </motion.div>
          <div className={styles.heroScrim} aria-hidden="true" />
          <motion.div className={styles.heroGrid} style={{ y: gridY }} aria-hidden="true" />
          <div className={`${styles.heroCorner} ${styles.heroCornerTop}`} aria-hidden="true" />
          <div className={`${styles.heroCorner} ${styles.heroCornerBottom}`} aria-hidden="true" />

          <motion.div className={styles.heroInner} style={{ y: heroContentY, opacity: heroContentOpacity }}>
            <div className={styles.heroCopy} data-testid="homepage-hero-content">
              <MarketingReveal delay={0.04}>
                <div className={styles.lockup} data-testid="homepage-lockup">
                  <span className={styles.lockupRule} />
                  <span className={styles.lockupWord} data-testid="homepage-lockup-word">MUTX</span>
                  <span className={styles.lockupMeta} data-testid="homepage-lockup-meta">/ AGENT OPERATIONS</span>
                </div>
              </MarketingReveal>

              <MarketingReveal delay={0.12}>
                <p className={styles.heroEyebrow}>Agent operations for teams that ship</p>
                <h1 className={styles.heroTitle}>
                  Run agents.
                  <span>Like software.</span>
                </h1>
              </MarketingReveal>

              <MarketingReveal delay={0.2}>
                <p className={styles.heroBody}>
                  Deploy agents, watch them work, and keep a record of every important decision.
                </p>
                <div className={styles.heroActions}>
                  <ActionLink
                    action={{ label: 'Open Pico', href: 'https://pico.mutx.dev', external: true, tone: 'pico' }}
                    className={styles.primaryButton}
                  />
                  <ActionLink
                    action={{ label: 'Download for Mac', href: '/download', tone: 'primary' }}
                    className={styles.secondaryButton}
                  />
                  <a href="https://github.com/mutx-dev/mutx-dev" target="_blank" rel="noopener noreferrer" className={styles.textButton}>
                    View GitHub <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </MarketingReveal>

              <MarketingReveal delay={0.28}>
                <div className={styles.heroFootnote}>
                  <span>Hosted workspace · local desktop · open source.</span>
                  <span className={styles.heroFootnoteLine} />
                  <span>macOS · API · CLI</span>
                </div>
              </MarketingReveal>
            </div>

            <MarketingReveal className={styles.heroInstrumentWrap} delay={0.22} distance={26}>
                  <div className={styles.heroInstrument}>
                <div className={styles.instrumentTopline}>
                  <span>WORKSPACE STATUS</span>
                  <span className={styles.instrumentStatus}><span className={styles.liveDot} /> Running</span>
                </div>
                <div className={styles.instrumentImage}>
                  <Image
                    src="/landing/webp/victory-core.webp"
                    alt="MUTX control surface"
                    fill
                    loading="eager"
                    sizes="(max-width: 900px) 90vw, 44vw"
                    className={styles.instrumentImageAsset}
                  />
                  <div className={styles.instrumentReticle} aria-hidden="true"><span /><span /></div>
                    <span className={styles.instrumentImageLabel}>CURRENT RUN</span>
                </div>
                <div className={styles.instrumentReadout}>
                  <div>
                    <span className={styles.readoutLabel}>Current run</span>
                    <strong>healthy / in progress</strong>
                  </div>
                  <Activity aria-hidden="true" />
                </div>
                <div className={styles.instrumentRows}>
                  {SYSTEM_ROWS.map((row) => (
                    <div key={row.label} className={styles.instrumentRow}>
                      <span>{row.label}</span>
                      <span className={styles.rowValue}><span className={`${styles.rowDot} ${styles[`rowDot${row.tone}`]}`} />{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </MarketingReveal>
          </motion.div>

          <div className={styles.heroIndex} aria-hidden="true">MUTX / PRODUCT</div>
          <div className={styles.scrollCue} aria-hidden="true">
            <span>See how it works</span>
            <span className={styles.scrollCueLine}><span /></span>
            <ArrowDown />
          </div>
        </section>

        <section className={styles.signalStrip} data-testid="homepage-social-proof">
          <div className={styles.sectionFrame}>
            <div className={styles.signalIntro}>What MUTX<br /><span>gives you.</span></div>
            {SIGNALS.map((signal) => (
              <div key={signal.code} className={styles.signalItem}>
                <span className={styles.signalCode}>{signal.code}</span>
                <div><strong>{signal.label}</strong><p>{signal.body}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="system" className={`${styles.section} ${styles.systemSection}`} data-testid="homepage-demo-section">
          <div className={styles.sectionFrame}>
            <div className={styles.sectionHeadingRow}>
              <div>
                <p className={styles.sectionKicker}>The product</p>
                <h2 className={styles.sectionTitle}>Everything that matters, in one place.</h2>
              </div>
              <p className={styles.sectionIntro}>See runs, permissions, and outcomes without stitching together logs, dashboards, and chat.</p>
            </div>

            <div className={styles.systemGrid}>
              <div className={styles.systemNarrative}>
                <div className={styles.stateList} aria-label="MUTX control plane views">
                  {demoTabs.map((tab, index) => (
                    <button
                      type="button"
                      key={tab.id}
                      className={`${styles.stateButton} ${index === activeDemoIndex ? styles.stateButtonActive : ''}`}
                      onClick={() => setActiveDemoIndex(index)}
                    >
                      <span>0{index + 1}</span>
                      <strong>{tab.label}</strong>
                      <ChevronDown aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <div className={styles.systemNote}>
                  <ShieldCheck aria-hidden="true" />
                  <p>Designed for the decision before the action, not the postmortem after it.</p>
                </div>
                <div className={styles.stateMeter} aria-hidden="true">
                  <span>VIEW 0{activeDemoIndex + 1} / 0{demoTabs.length}</span>
                  <span className={styles.stateMeterTrack}>
                    <span style={{ width: `${((activeDemoIndex + 1) / demoTabs.length) * 100}%` }} />
                  </span>
                </div>
              </div>

              <motion.div
                className={styles.productFrame}
                data-testid="homepage-demo-panel"
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className={styles.productFrameTopline}>
                  <span>MUTX / {activeDemo?.label.toUpperCase()}</span>
                  <span>LIVE VIEW</span>
                </div>
                <div className={styles.productImageWrap}>
                  <AnimatePresence mode="wait" initial={false}>
                    {activeDemo ? (
                      <motion.div
                        key={activeDemo.id}
                        className={styles.productMediaLayer}
                        initial={{ opacity: 0, scale: 1.035, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.985, y: -10 }}
                        transition={{ duration: prefersReducedMotion ? 0.01 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Image
                          src={activeDemo.mediaSrc}
                          alt={activeDemo.mediaAlt}
                          fill
                          sizes="(max-width: 900px) 92vw, 62vw"
                          className={styles.productImage}
                        />
                        <div className={styles.productImageShade} aria-hidden="true" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {activeDemo ? (
                    <motion.div
                      key={activeDemo.id}
                      className={styles.productCaption}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
                    >
                      <div>
                        <span className={styles.sectionKicker}>{activeDemo.label}</span>
                        <h3>{activeDemo.title}</h3>
                      </div>
                      <p>{activeDemo.body}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.failureSection}`} id="proof" data-testid="homepage-examples-section">
          <div className={styles.sectionFrame}>
            <div className={styles.sectionHeadingRow}>
              <div>
                <p className={styles.sectionKicker}>The failure modes</p>
                <h2 className={styles.sectionTitle}>The damage is usually quiet.</h2>
              </div>
              <p className={styles.sectionIntro}>MUTX shows the risky action before it becomes an incident.</p>
            </div>
            <div className={styles.failureGrid}>
              {marketingHomepage.salesSections.examples.items.map((item, index) => (
                <MarketingReveal key={item.title} delay={index * 0.06} className={styles.failureItem}>
                  <div className={styles.failureTopline}><span>0{index + 1}</span><span>{item.eyebrow}</span></div>
                  <h3>{item.title}</h3>
                  <div className={styles.failureTerminal}>
                    <span className={styles.terminalPrompt}>›</span>
                    <span>{item.userPrompt}</span>
                  </div>
                  <p>{item.fallout}</p>
                </MarketingReveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.proofSection}`} data-testid="homepage-proof-section">
          <div className={styles.sectionFrame}>
            <div className={styles.proofIntro}>
              <p className={styles.sectionKicker}>Why teams use it</p>
              <h2 className={styles.sectionTitle}>Know what happened.</h2>
              <p className={styles.sectionIntro}>A readable record beats a confident guess when the work gets serious.</p>
            </div>
            <div className={styles.proofList}>
              {marketingHomepage.salesSections.proof.items.map((item, index) => (
                <motion.article key={item.title} className={styles.proofItem} whileHover={prefersReducedMotion ? undefined : { x: 8 }}>
                  <span className={styles.proofNumber}>0{index + 1}</span>
                  <div className={styles.proofName}><span>{item.title}</span><ArrowUpRight aria-hidden="true" /></div>
                  <div className={styles.proofColumn}><span>without MUTX</span><p>{item.before}</p></div>
                  <div className={`${styles.proofColumn} ${styles.proofColumnStrong}`}><span>with MUTX</span><p>{item.after}</p></div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.picoSection}`} data-testid="homepage-pico-robot-section">
          <div className={styles.sectionFrame}>
            <div className={styles.picoGrid}>
              <div className={styles.picoVisual}>
                <Image src="/pico/robot/hero-wave.png" alt="PicoMUTX operator robot" fill loading="eager" sizes="(max-width: 900px) 90vw, 45vw" className={styles.picoImage} />
                <div className={styles.picoVisualLabel}>PICO / WORKSPACE</div>
              </div>
              <MarketingReveal className={styles.picoCopy} distance={24}>
                <p className={styles.sectionKicker}>A faster way in</p>
                <h2 className={styles.sectionTitle}>Pico gets you to the useful part.</h2>
                <p className={styles.sectionIntro}>Use Pico to set up, troubleshoot, and operate without losing sight of the work underneath.</p>
                <div className={styles.picoHighlights}>
                  {picoRobotMarketingHighlights.slice(0, 3).map((item) => (
                    <div key={item.title} className={styles.picoHighlight}><Check aria-hidden="true" /><span>{item.title}</span></div>
                  ))}
                </div>
                <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer" className={styles.picoButton}>
                  <span>Open Pico</span><ArrowUpRight aria-hidden="true" />
                </a>
              </MarketingReveal>
            </div>
          </div>
        </section>

        <section className={styles.finalSection} data-testid="homepage-final-cta">
          <div className={styles.finalFrame}>
            <div>
              <p className={styles.sectionKicker}>Start here</p>
              <h2 className={styles.finalTitle}>Put the work somewhere you can see it.</h2>
            </div>
            <div className={styles.finalActions}>
              <Link href="/download" className={styles.primaryButton}>Download for Mac <ArrowRight aria-hidden="true" /></Link>
              <Link href="/docs/quickstart" className={styles.secondaryButton}>Read the quickstart <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section className={styles.dataSection} data-testid="homepage-data-use">
          <div className={styles.sectionFrame}>
            <p><span>Privacy /</span> MUTX uses only the account data needed to authenticate you, identify your work in audit trails, and send critical product notifications. <Link href="/privacy-policy">Read the full policy <ArrowUpRight aria-hidden="true" /></Link></p>
          </div>
        </section>
      </main>
    </div>
  )
}
