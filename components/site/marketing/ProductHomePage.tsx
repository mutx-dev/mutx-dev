import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { PublicNav } from '@/components/site/PublicNav'
import { ProductRevealStage } from '@/components/site/marketing/ProductRevealStage'
import { getPicoUrl } from '@/lib/seo'
import styles from './ProductHomePage.module.css'

const STARTING_POINTS = [
  {
    audience: 'Build',
    title: 'Connect an agent with the CLI or SDK.',
    description: 'Follow the deployment quickstart for a local setup.',
    href: '/docs/deployment/quickstart',
    link: 'Read the quickstart',
  },
  {
    audience: 'Operate',
    title: 'Review runs in the dashboard.',
    description: 'Open the operator workspace for run and approval workflows.',
    href: '/dashboard',
    link: 'Open the dashboard',
  },
  {
    audience: 'Get started',
    title: 'Use PicoMUTX for guided setup.',
    description: 'Pico covers onboarding, learning, and operator workflows.',
    href: getPicoUrl(),
    link: 'Explore PicoMUTX',
  },
] as const

const EXAMPLE_EVENTS = [
  {
    kind: 'Run event',
    name: 'Request received',
    detail: 'Compare three vendor proposals.',
  },
  {
    kind: 'Tool call',
    name: 'documents.search',
    detail: 'The integration submitted the tool request.',
  },
  {
    kind: 'Approval',
    name: 'documents.share',
    detail: 'An operator review was requested by policy.',
  },
] as const

export function ProductHomePage() {
  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <PublicNav overlay />
        <ProductRevealStage />
      </section>

      <section id="runs" className={styles.runSection} aria-labelledby="runs-title">
        <div className={styles.runLayout}>
          <header className={styles.runCopy}>
            <p className={styles.eyebrow}>01 / Run history</p>
            <h2 id="runs-title">Read each run in order.</h2>
            <p>
              MUTX records run events and tool calls that an integration submits.
              Operators can inspect the activity alongside its policy decisions
              and resulting outcome.
            </p>
            <p className={styles.scopeNote}>
              Coverage depends on the events your integration reports.
            </p>
          </header>

          <figure className={styles.runRecord} aria-labelledby="example-record-title">
            <figcaption className={styles.recordHeader}>
              <div>
                <span className={styles.eyebrow}>Product preview</span>
                <h3 id="example-record-title">Example run</h3>
              </div>
              <span className={styles.recordTag}>Run record</span>
            </figcaption>
            <ol className={styles.eventRail}>
              {EXAMPLE_EVENTS.map((event) => (
                <li key={event.kind}>
                  <span className={styles.eventNode} aria-hidden="true" />
                  <div className={styles.eventCopy}>
                    <span>{event.kind}</span>
                    <strong>{event.name}</strong>
                    <p>{event.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </figure>
        </div>
      </section>

      <section className={styles.approvalSection} aria-labelledby="approval-title">
        <div className={styles.approvalLayout}>
          <div className={styles.approvalCopy}>
            <p className={styles.eyebrow}>02 / Approval requests</p>
            <h2 id="approval-title">Review tool calls before they run.</h2>
            <p>
              For tools routed through the MUTX runtime, a configured policy can
              pause a call and ask an operator to review it.
            </p>
            <Link href="/control" className={styles.inlineAction}>
              Explore the product <ArrowRight className="rtl-directional-icon" aria-hidden="true" />
            </Link>
          </div>

          <figure className={styles.approvalPreview} aria-labelledby="approval-preview-title">
            <figcaption className={styles.approvalPreviewHeader}>
              <span>Product preview</span>
              <span>Approval request</span>
            </figcaption>
            <div className={styles.requestBody}>
              <p className={styles.requestLabel}>Requested action</p>
              <h3 id="approval-preview-title">Share the vendor summary</h3>
              <dl>
                <div>
                  <dt>Tool</dt>
                  <dd><code data-technical-value>documents.share</code></dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>External workspace</dd>
                </div>
                <div>
                  <dt>Policy</dt>
                  <dd>Operator review required</dd>
                </div>
              </dl>
              <p className={styles.reviewState}>
                <span aria-hidden="true" /> Waiting for a decision
              </p>
            </div>
            <p className={styles.previewCaption}>
              An example request with its tool and destination in view.
            </p>
          </figure>
        </div>
      </section>

      <section id="start" className={styles.startSection} aria-labelledby="start-title">
        <div className={styles.startHeading}>
          <p className={styles.eyebrow}>03 / Choose a starting point</p>
          <h2 id="start-title">Build, operate, or start with Pico.</h2>
        </div>

        <div className={styles.pathList}>
          {STARTING_POINTS.map((point, index) => (
            <article className={styles.path} key={point.audience}>
              <span className={styles.pathNumber}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className={styles.pathAudience}>{point.audience}</p>
                <h3>{point.title}</h3>
                <p className={styles.pathDescription}>{point.description}</p>
              </div>
              <Link href={point.href}>
                {point.link} <ArrowUpRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <p className={styles.sourceLine}>
          MUTX is source-available.{' '}
          <a href="https://github.com/mutx-dev/mutx-dev" target="_blank" rel="noopener noreferrer">
            Read the code on GitHub <ArrowUpRight aria-hidden="true" />
            <span className={styles.visuallyHidden}> (opens in a new tab)</span>
          </a>.
        </p>
      </section>
    </main>
  )
}
