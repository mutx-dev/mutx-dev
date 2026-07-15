'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'

import { PublicNav } from '@/components/site/PublicNav'

import styles from './RebrandHomePage.module.css'

const CAPABILITIES = [
  { index: '01', label: 'Observe', note: 'Every run, readable.', href: '/ai-agent-monitoring' },
  { index: '02', label: 'Bound', note: 'Every risky move, checked.', href: '/ai-agent-guardrails' },
  { index: '03', label: 'Prove', note: 'Every decision, kept.', href: '/ai-agent-audit-logs' },
]

const PRODUCT_LINKS = [
  { label: 'Control plane', href: '/ai-agent-control-plane' },
  { label: 'Governance', href: '/ai-agent-governance' },
  { label: 'Deployment', href: '/ai-agent-deployment' },
  { label: 'Cost', href: '/ai-agent-cost' },
]

export function RebrandHomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <PublicNav overlay />
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span /> AI agent operations</p>
            <h1>Agents.<br /><em>Under control.</em></h1>
            <p className={styles.lede}>See the work. Stop the wrong move. Keep the record.</p>
            <div className={styles.actions}>
              <Link href="/download" className={styles.primary}>Download for Mac <ArrowRight /></Link>
              <Link href="/ai-agent-control-plane" className={styles.secondary}>Explore MUTX <ArrowUpRight /></Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualFrame}>
              <Image
                src="/landing/webp/victory-core.webp"
                alt="MUTX agent in an operational control environment"
                fill
                priority
                sizes="(max-width: 860px) 92vw, 48vw"
                className={styles.heroImage}
              />
              <div className={styles.visualHud}>
                <span>run / 9f2a</span>
                <strong>healthy</strong>
              </div>
            </div>
            <p className={styles.visualCaption}>01 / Runtime visible</p>
          </div>
        </div>

        <div className={styles.heroRail}>
          <span>Observe</span><span>Govern</span><span>Prove</span>
          <a href="#system" aria-label="Continue to the MUTX system"><ArrowDown /></a>
        </div>
      </section>

      <section id="system" className={styles.system}>
        <div className={styles.systemHeading}>
          <p className={styles.kicker}><span /> The operating layer</p>
          <h2>One screen.<br />The whole story.</h2>
        </div>

        <div className={styles.systemVisual}>
          <Image
            src="/landing/webp/wiring-bay.webp"
            alt="MUTX runtime control surface"
            fill
            sizes="(max-width: 900px) 100vw, 72vw"
            className={styles.systemImage}
          />
          <div className={styles.systemReadout}>
            <p>Live run</p>
            <strong>12 tools</strong>
            <span>0 violations</span>
          </div>
        </div>

        <div className={styles.capabilityGrid}>
          {CAPABILITIES.map((item) => (
            <Link key={item.href} href={item.href} className={styles.capability}>
              <span>{item.index}</span>
              <h3>{item.label}</h3>
              <p>{item.note}</p>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.statement}>
        <div className={styles.statementInner}>
          <p className={styles.kickerDark}><span /> What matters</p>
          <div className={styles.statementLines}>
            <p>Read the run.</p>
            <p>Set the boundary.</p>
            <p>Keep the proof.</p>
          </div>
          <p className={styles.statementNote}>No mystery layer. No trust fall.</p>
        </div>
      </section>

      <section className={styles.explore}>
        <div className={styles.exploreIntro}>
          <p className={styles.kicker}><span /> Explore MUTX</p>
          <h2>Built for<br />the hard part.</h2>
        </div>
        <nav className={styles.exploreLinks} aria-label="MUTX product areas">
          {PRODUCT_LINKS.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.label}</strong>
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
      </section>

      <section className={styles.pico}>
        <div className={styles.picoArt}>
          <Image
            src="/pico/robot/hero-wave.png"
            alt="Pico assistant"
            fill
            sizes="(max-width: 860px) 100vw, 44vw"
            className={styles.picoImage}
          />
        </div>
        <div className={styles.picoCopy}>
          <p className={styles.kickerDark}><span /> Pico</p>
          <h2>A smaller way in.</h2>
          <p>Guided setup. Grounded help. The same control underneath.</p>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer">
            Pico beta status <ArrowUpRight />
          </a>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>Run agents.<br />Know what happened.</p>
        <div>
          <Link href="/download">Download for Mac <ArrowRight /></Link>
          <Link href="/docs">Read the docs <ArrowUpRight /></Link>
        </div>
      </section>
    </main>
  )
}
