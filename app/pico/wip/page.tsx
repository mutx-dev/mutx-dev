import Image from 'next/image'
import Link from 'next/link'

import s from './page.module.css'
import { PICO_GENERATED_CONTENT } from '@/lib/pico/generatedContent'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.wip.meta', '/wip')
}

function formatDate(value?: string | null) {
  if (!value) return 'Unavailable'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unavailable'
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCompactNumber(value?: number | null) {
  if (typeof value !== 'number') return 'n/a'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export default function PicoWipPage() {
  const content = PICO_GENERATED_CONTENT
  const remoteDefaults = content.remoteAccess.decisionDefaults.length
    ? content.remoteAccess.decisionDefaults
    : [
        'tailscale ssh for shell access',
        'tailscale serve for private web surfaces',
        'tailscale funnel only for intentional public exposure',
      ]

  return (
    <div className={s.root} data-testid="pico-live-ledger">
      <div className={s.shell}>
        <section className={s.hero}>
          <div>
            <p className={s.kicker}>
              Docs synced {content.packSnapshot.refreshedAt} · {content.packSnapshot.visibleDocCount} visible playbooks
            </p>
            <h1 className={s.title}>{content.wip.title}</h1>
            <p className={s.subtitle}>{content.wip.subtitle}</p>
            <div className={s.links}>
              <Link href="/pico" className={s.primaryLink}>
                Back to Pico
              </Link>
              <a href="https://mutx.dev" className={s.secondaryLink}>
                MUTX Platform
              </a>
            </div>
          </div>

          <div className={s.visual}>
            <Image
              src="/pico/robot/celebrate.png"
              alt="PicoMUTX robot inspecting live stack briefings"
              width={320}
              height={320}
              className={s.robot}
              priority
            />
          </div>
        </section>

        <section className={s.metrics}>
          <article className={s.metric}>
            <p className={s.label}>Academy lessons</p>
            <p className={s.value}>{content.packSnapshot.lessonCount}</p>
            <p className={s.hint}>Structured install-to-control sequence already feeding Pico.</p>
          </article>
          <article className={s.metric}>
            <p className={s.label}>Builder-pack docs</p>
            <p className={s.value}>{content.packSnapshot.visibleDocCount}</p>
            <p className={s.hint}>Visible stack playbooks currently driving the content layer.</p>
          </article>
          <article className={s.metric}>
            <p className={s.label}>Tracked stacks</p>
            <p className={s.value}>{content.stacks.length}</p>
            <p className={s.hint}>Hermes, OpenClaw, NanoClaw, and PicoClaw stay explicit in the UI now.</p>
          </article>
          <article className={s.metric}>
            <p className={s.label}>Content refresh</p>
            <p className={s.value}>{formatDate(content.packSnapshot.refreshedAt)}</p>
            <p className={s.hint}>This feed was regenerated from the local pack plus live repo metadata.</p>
          </article>
        </section>

        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <p className={s.label}>{content.wip.overviewTitle}</p>
              <h2 className={s.sectionTitle}>What the product is actually reading now</h2>
            </div>
            <span className={s.chip}>source-backed</span>
          </div>
          <p className={s.body}>{content.wip.overviewBody}</p>
        </section>

        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <p className={s.label}>Tracked stacks</p>
              <h2 className={s.sectionTitle}>Repo and doc reality now shows up in the product</h2>
            </div>
            <span className={s.chip}>live repo feed</span>
          </div>

          <div className={s.stackGrid}>
            {content.stacks.map((stack) => (
              <article key={stack.id} className={s.stackCard}>
                <div className={s.stackTop}>
                  <div>
                    <p className={s.label}>{stack.name}</p>
                    <h3 className={s.stackTitle}>
                      {stack.live?.latestRef?.label ?? 'Tracked repo'}
                    </h3>
                  </div>
                  <div className={s.stackStats}>
                    <span>{formatCompactNumber(stack.live?.stars)} stars</span>
                    <span>{formatDate(stack.live?.latestRef?.publishedAt ?? stack.live?.pushedAt)}</span>
                  </div>
                </div>

                <p className={s.body}>{stack.productProfile}</p>

                <ul className={s.list}>
                  {stack.installRealities.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className={s.linksRow}>
                  {stack.docsUrl ? (
                    <a href={stack.docsUrl} target="_blank" rel="noreferrer">
                      Docs
                    </a>
                  ) : null}
                  {stack.repoUrl ? (
                    <a href={stack.repoUrl} target="_blank" rel="noreferrer">
                      Repo
                    </a>
                  ) : null}
                  {stack.live?.latestRef?.url ? (
                    <a href={stack.live.latestRef.url} target="_blank" rel="noreferrer">
                      Latest ship
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <p className={s.label}>{content.remoteAccess.title}</p>
              <h2 className={s.sectionTitle}>Remote access defaults stay visible</h2>
            </div>
            <span className={s.chip}>tailscale-first</span>
          </div>
          <p className={s.body}>{content.remoteAccess.why}</p>
          <ul className={s.list}>
            {remoteDefaults.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className={s.linksRow}>
            {content.remoteAccess.officialSources.slice(0, 3).map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {new URL(url).hostname.replace(/^www\./, '')}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
