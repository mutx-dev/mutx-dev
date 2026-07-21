import Link from 'next/link'

import { PublicFooter } from '@/components/site/PublicFooter'
import { PublicNav } from '@/components/site/PublicNav'
import { PublicSurface } from '@/components/site/PublicSurface'

import styles from './OperationalLedgerPage.module.css'
import {
  buildOperationalStoryStructuredData,
  type OperationalStory,
  type OperationalStoryAction,
  type OperationalStoryItem,
} from './operationalStories'

const runTimecodes = ['00:00.000', '00:00.118', '00:00.641', '00:01.247'] as const
const workflowStates = ['DEFINED', 'ENFORCED', 'RECORDED', 'REVIEWABLE'] as const

function StoryAction({ action, primary = false }: {
  action: OperationalStoryAction
  primary?: boolean
}) {
  const className = primary ? styles.primaryAction : styles.secondaryAction

  if (action.href.startsWith('http')) {
    return (
      <a href={action.href} className={className} target="_blank" rel="noopener noreferrer">
        {action.label}
        <span aria-hidden="true">↗</span>
        <span className={styles.srOnly}> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

function EvidenceTitle({ item }: { item: OperationalStoryItem }) {
  if (!item.href) {
    return <h3 className={styles.evidenceTitle}>{item.title}</h3>
  }

  return (
    <h3 className={styles.evidenceTitle}>
      <Link href={item.href}>
        {item.title}
        <span aria-hidden="true">↗</span>
      </Link>
    </h3>
  )
}

export function OperationalLedgerPage({ story }: { story: OperationalStory }) {
  const structuredData = buildOperationalStoryStructuredData(story)
  const heroTitleId = `story-${story.index}-title`
  const workflowTitleId = `story-${story.index}-workflow`
  const evidenceTitleId = `story-${story.index}-evidence`

  return (
    <PublicSurface className={styles.surface}>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main id="main-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby={heroTitleId}>
          <div className={`${styles.shell} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <div className={styles.heroFolio} aria-label={`Product story ${story.index} of 10`}>
                <span>Operational ledger</span>
                <span>{story.index} / 10</span>
              </div>
              <p className={styles.eyebrow}>{story.hero.eyebrow}</p>
              <h1 id={heroTitleId} className={styles.heroTitle}>
                {story.hero.title}
              </h1>
              <p className={styles.heroBody}>{story.hero.body}</p>
              <div className={styles.heroActions}>
                <StoryAction action={story.hero.actions[0]} primary />
                <StoryAction action={story.hero.actions[1]} />
              </div>
            </div>

            <aside className={styles.recorder} aria-label={`${story.hero.eyebrow} flight recorder`}>
              <div className={styles.recorderMast}>
                <div>
                  <p>Flight recorder</p>
                  <strong>{story.record.id}</strong>
                </div>
                <span className={styles.liveState}>
                  <span aria-hidden="true" /> Live record
                </span>
              </div>

              <dl className={styles.recordFacts}>
                <div>
                  <dt>Operation</dt>
                  <dd>{story.record.operation}</dd>
                </div>
                <div>
                  <dt>Disposition</dt>
                  <dd>{story.record.status}</dd>
                </div>
              </dl>

              <ol className={styles.runRail} aria-label="Timecoded execution record">
                {story.workflow.items.map((item, index) => (
                  <li key={item.title} className={styles.runEvent}>
                    <span className={styles.timecode}>{runTimecodes[index]}</span>
                    <span className={styles.eventMarker} aria-hidden="true" />
                    <span className={styles.eventCopy}>
                      <strong>{item.title}</strong>
                      <span>{workflowStates[index]}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className={styles.recorderFoot}>
                <span>Trace integrity</span>
                <strong>SHA-256 / VERIFIED</strong>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.workflow} aria-labelledby={workflowTitleId}>
          <div className={styles.shell}>
            <header className={styles.sectionHeader}>
              <p className={styles.sectionCode}>{story.workflow.eyebrow} / 01</p>
              <h2 id={workflowTitleId} className={styles.sectionTitle}>
                {story.workflow.title}
              </h2>
              <p className={styles.sectionBody}>{story.workflow.body}</p>
            </header>

            <div className={styles.ledger}>
              {story.workflow.items.map((item, index) => (
                <article key={item.title} className={styles.ledgerRow}>
                  <p className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</p>
                  <div className={styles.rowCopy}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                  <p className={styles.rowState}>
                    <span aria-hidden="true" /> {workflowStates[index]}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.evidence} aria-labelledby={evidenceTitleId}>
          <div className={styles.shell}>
            <header className={styles.sectionHeader}>
              <p className={styles.sectionCode}>{story.evidence.eyebrow} / 02</p>
              <h2 id={evidenceTitleId} className={styles.sectionTitle}>
                {story.evidence.title}
              </h2>
              <p className={styles.sectionBody}>{story.evidence.body}</p>
            </header>

            <div className={styles.evidenceList}>
              {story.evidence.items.map((item, index) => (
                <article key={item.title} className={styles.evidenceRow}>
                  <p className={styles.evidenceCode}>E-{String(index + 1).padStart(3, '0')}</p>
                  <EvidenceTitle item={item} />
                  <p className={styles.evidenceBody}>{item.body}</p>
                  <p className={styles.attachedState}>
                    <span aria-hidden="true">●</span> Attached
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby={`story-${story.index}-cta`}>
          <div className={`${styles.shell} ${styles.ctaGrid}`}>
            <p className={styles.ctaCode}>{story.cta.eyebrow} / END OF RECORD</p>
            <h2 id={`story-${story.index}-cta`} className={styles.ctaTitle}>
              {story.cta.title}
            </h2>
            <div className={styles.ctaAside}>
              <p>{story.cta.body}</p>
              <div className={styles.ctaActions}>
                <StoryAction action={story.cta.actions[0]} primary />
                <StoryAction action={story.cta.actions[1]} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter showCallout={false} />
    </PublicSurface>
  )
}
