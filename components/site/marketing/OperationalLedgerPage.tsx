import Link from 'next/link'

import { PublicFooter } from '@/components/site/PublicFooter'
import { PublicNav } from '@/components/site/PublicNav'
import { PublicSurface } from '@/components/site/PublicSurface'

import styles from './OperationalLedgerPage.module.css'
import {
  buildOperationalStoryStructuredData,
  type OperationalStory,
  type OperationalStoryAction,
} from './operationalStories'

const browserPreviewAction: OperationalStoryAction = {
  href: '/control',
  label: 'Explore the demo',
}

function StoryAction({ action, primary = false }: {
  action: OperationalStoryAction
  primary?: boolean
}) {
  const className = primary ? styles.primaryAction : styles.textAction

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

function ExamplePanel({ story }: { story: OperationalStory }) {
  const { example } = story

  return (
    <figure className={styles.example} aria-label={`Example ${example.category.toLowerCase()}`}>
      <figcaption className={styles.exampleHeader}>
        <h2>{example.category}</h2>
        <span>Example</span>
      </figcaption>
      <div className={styles.exampleSummary}>
        <div>
          <h3>{example.subject}</h3>
          <p>{example.state}</p>
        </div>
      </div>
      <dl className={styles.exampleFields}>
        {example.fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

export function OperationalLedgerPage({ story }: { story: OperationalStory }) {
  const structuredData = buildOperationalStoryStructuredData(story)
  const storySlug = story.path.replace(/\//g, '-')
  const heroTitleId = `story${storySlug}-title`
  const sectionTitleId = `story${storySlug}-details`

  return (
    <PublicSurface className={styles.surface}>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.hero} aria-labelledby={heroTitleId}>
          <div className={`${styles.shell} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>{story.hero.eyebrow}</p>
              <h1 id={heroTitleId} className={styles.heroTitle}>
                {story.hero.title}
              </h1>
              <p className={styles.heroBody}>{story.hero.body}</p>
              <p className={styles.scopeNote}>{story.hero.scopeNote}</p>
              <StoryAction action={browserPreviewAction} primary />
            </div>
            <ExamplePanel story={story} />
          </div>
        </section>

        <section className={styles.details} aria-labelledby={sectionTitleId}>
          <div className={styles.shell}>
            <div className={styles.detailsGrid}>
              <header className={styles.detailsHeader}>
                <h2 id={sectionTitleId}>{story.section.title}</h2>
                <p>{story.section.body}</p>
              </header>
              <ol className={styles.pointList}>
                {story.section.points.map((point) => (
                  <li key={point.title}>
                    <h3>{point.title}</h3>
                    <p>{point.body}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.nextAction}>
              <p>Next step</p>
              <StoryAction action={story.destination} />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter showCallout={false} />
    </PublicSurface>
  )
}
