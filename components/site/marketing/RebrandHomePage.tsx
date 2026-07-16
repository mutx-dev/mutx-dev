import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'

import { PublicNav } from '@/components/site/PublicNav'
import styles from './RebrandHomePage.module.css'

const SYSTEM = [
  { number: '01', name: 'Observe', line: 'Read every run.', href: '/ai-agent-monitoring' },
  { number: '02', name: 'Govern', line: 'Bound every move.', href: '/ai-agent-guardrails' },
  { number: '03', name: 'Prove', line: 'Keep every record.', href: '/ai-agent-audit-logs' },
]

const INDEX = [
  ['Control plane', '/ai-agent-control-plane'],
  ['Approvals', '/ai-agent-approvals'],
  ['Deployment', '/ai-agent-deployment'],
  ['Reliability', '/ai-agent-reliability'],
  ['Governance', '/ai-agent-governance'],
  ['Cost', '/ai-agent-cost'],
] as const

export function RebrandHomePage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero}>
        <PublicNav overlay />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.overline}>MUTX / Agent operations</p>
            <h1>Control for<br />agents in motion.</h1>
            <p className={styles.lede}>See the run. Bound the action. Keep the proof.</p>
            <div className={styles.actions}>
              <Link href="/download">Download for Mac <ArrowRight /></Link>
              <Link href="/docs">Read the docs <ArrowUpRight /></Link>
            </div>
          </div>

          <div className={styles.wordmark} aria-label="MUTX">
            <span>M</span><span>U</span><span>T</span><span>X</span>
          </div>
        </div>

        <div className={styles.heroBottom}>
          <span>Observe</span><span>Govern</span><span>Prove</span>
          <a href="#system" aria-label="Continue"><ArrowDown /></a>
        </div>
      </section>

      <section id="system" className={styles.system}>
        <header className={styles.sectionHead}>
          <p>What MUTX does</p>
          <h2>Every action.<br />Accounted for.</h2>
        </header>

        <div className={styles.systemGrid}>
          {SYSTEM.map((item) => (
            <Link key={item.name} href={item.href}>
              <span>{item.number}</span>
              <div><strong>{item.name}</strong><p>{item.line}</p></div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.manifesto}>
        <p>Move fast.</p>
        <p>Leave proof.</p>
      </section>

      <section className={styles.index}>
        <header className={styles.sectionHeadDark}>
          <p>Product index</p>
          <h2>The operating layer.</h2>
        </header>
        <nav aria-label="MUTX product index">
          {INDEX.map(([label, href], index) => (
            <Link key={href} href={href}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
      </section>

      <section className={styles.pico}>
        <div className={styles.picoMark}>P</div>
        <div>
          <p>Pico / Setup</p>
          <h2>Less guessing.<br />More shipping.</h2>
          <a href="https://pico.mutx.dev" target="_blank" rel="noopener noreferrer">
            Pico beta status <ArrowUpRight />
          </a>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>Run agents.<br />Know why.</p>
        <Link href="/download">Get MUTX <ArrowRight /></Link>
      </section>
    </main>
  )
}
