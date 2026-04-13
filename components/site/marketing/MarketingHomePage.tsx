'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import {
  marketingHomepage,
  type MarketingActionLink,
  type MarketingEntryPoint,
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

type EntryPointLinkProps = {
  item: MarketingEntryPoint
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

function EntryPointLink({ item }: EntryPointLinkProps) {
  const content = (
    <>
      Enter page
      <ArrowUpRight className="h-4 w-4" />
    </>
  )

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={home.entryLink}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} className={home.entryLink}>
      {content}
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
  const [primaryAction, ...secondaryActions] = marketingHomepage.hero.actions
  const [finalPrimaryAction, ...finalSecondaryActions] = marketingHomepage.cta.actions
  const secondaryHeroPrimaryAction = secondaryActions[0]
  const secondaryHeroActions = secondaryActions.slice(1)

  return (
    <div className={`${core.page} ${core.homePage}`}>
      <MarketingLoader />

      <main className={core.main}>
        <section className={home.heroSection}>
          <MarketingHeroBackdrop
            className={home.heroMedia}
            src={marketingHomepage.hero.backgroundSrc}
            position={marketingHomepage.hero.backdropPosition}
            scale={marketingHomepage.hero.backdropScale}
            shiftX={marketingHomepage.hero.backdropShiftX}
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
                    see · constrain · prove
                  </span>
                </span>
              </div>

              <div className={home.heroContent} data-testid="homepage-hero-content">
                <p className={home.heroEyebrow}>{marketingHomepage.hero.chapterLabel}</p>
                <h1 className={home.heroTitle}>{marketingHomepage.hero.title}</h1>
                {marketingHomepage.hero.support && (
                  <p className={home.heroSupport}>{marketingHomepage.hero.support}</p>
                )}
                <div className={home.heroActions}>
                  {primaryAction ? (
                    <ActionLink action={primaryAction} className={core.buttonPrimary} />
                  ) : null}
                  {secondaryHeroPrimaryAction ? (
                    <ActionLink action={secondaryHeroPrimaryAction} className={core.buttonGhost} />
                  ) : null}
                  <div className={home.heroSecondaryActions}>
                    {secondaryHeroActions.map((action) => (
                      <ActionLink
                        key={action.label}
                        action={action}
                        className={home.secondaryAction}
                      />
                    ))}
                  </div>
                </div>

                <div className={home.heroLedger} data-testid="homepage-hero-ledger">
                  {marketingHomepage.hero.ledger.map((line, index) => (
                    <div key={line} className={home.heroLedgerLine}>
                      <span className={home.heroLedgerIndex}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className={home.heroLedgerText}>{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={home.storySection} data-testid="homepage-story-section">
          <div className={core.shell}>
            <div className={home.storyShell}>
              <MarketingReveal className={home.storyRail} distance={18}>
                <p className={home.sectionEyebrow}>{marketingHomepage.chapters.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.chapters.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.chapters.body}</p>
                <div className={home.storyIndex} data-testid="homepage-story-index">
                  {marketingHomepage.chapters.items.map((item) => (
                    <a key={item.id} href={`#${item.id}`} className={home.storyIndexLink}>
                      <span className={home.storyIndexChapter}>{item.chapter}</span>
                      <span className={home.storyIndexTitle}>{item.kicker}</span>
                    </a>
                  ))}
                </div>
              </MarketingReveal>

              <div className={home.storyScenes}>
                {marketingHomepage.chapters.items.map((item, index) => (
                  <MarketingReveal
                    key={item.id}
                    className={home.sceneReveal}
                    delay={index * 0.06}
                    distance={22}
                  >
                    <article id={item.id} className={home.sceneArticle}>
                      <div className={home.sceneMeta}>
                        <p className={home.sceneChapter}>{item.chapter}</p>
                        <p className={home.sceneKicker}>{item.kicker}</p>
                      </div>

                      <div className={home.sceneCopy}>
                        <h3 className={home.sceneTitle}>{item.title}</h3>
                        <p className={home.sceneBody}>{item.body}</p>
                        <ul className={home.sceneBeats}>
                          {item.beats.map((beat) => (
                            <li key={beat}>{beat}</li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  </MarketingReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={home.controlSection} data-testid="homepage-control-section">
          <div className={core.shell}>
            <div className={home.controlShell}>
              <MarketingReveal className={home.controlIntro} distance={18}>
                <p className={home.sectionEyebrow}>{marketingHomepage.controlRoom.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.controlRoom.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.controlRoom.body}</p>
              </MarketingReveal>

              <motion.div
                className={home.controlPreview}
                data-testid="homepage-control-preview"
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -6,
                        scale: 1.01,
                      }
                }
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={home.controlPreviewFrame}
                  data-media-fit={marketingHomepage.controlRoom.mediaFit ?? 'cover'}
                >
                  <Image
                    src={marketingHomepage.controlRoom.mediaSrc}
                    alt={marketingHomepage.controlRoom.mediaAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 54rem"
                    className={
                      marketingHomepage.controlRoom.mediaFit === 'contain'
                        ? home.controlPreviewImageContain
                        : home.controlPreviewImage
                    }
                  />
                </div>
                <div className={home.controlPreviewBands}>
                  {marketingHomepage.controlRoom.pillars.map((pillar) => (
                    <span key={pillar.label} className={home.controlPreviewBand}>
                      {pillar.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className={home.entrySection} data-testid="homepage-entry-section">
          <div className={core.shell}>
            <MarketingReveal className={home.entryIntro} distance={18}>
              <p className={home.sectionEyebrow}>{marketingHomepage.entryPoints.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.entryPoints.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.entryPoints.body}</p>
            </MarketingReveal>

            <div className={home.entryGrid}>
              {marketingHomepage.entryPoints.items.map((item, index) => (
                <HoverCard
                  key={item.title}
                  className={home.entryCard}
                  delay={index * 0.07}
                  distance={20}
                >
                  <article className={home.entryArticle}>
                    <p className={home.entryLabel}>{item.label}</p>
                    <h3 className={home.entryTitle}>{item.title}</h3>
                    <p className={home.entryBody}>{item.body}</p>
                    <EntryPointLink item={item} />
                  </article>
                </HoverCard>
              ))}
            </div>
          </div>
        </section>

        <section className={home.finalSection} data-testid="homepage-final-cta">
          <div className={core.shell}>
            <MarketingReveal className={home.finalShell} distance={24}>
              <div className={home.finalCopy}>
                <p className={home.sectionEyebrow}>{marketingHomepage.cta.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.cta.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.cta.body}</p>
                <div className={home.finalActions}>
                  {finalPrimaryAction ? (
                    <ActionLink action={finalPrimaryAction} className={core.buttonPrimary} />
                  ) : null}
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
                className={home.finalPoster}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -5,
                        rotate: 0.35,
                      }
                }
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={home.finalPosterFrame}>
                  <Image
                    src={marketingHomepage.cta.mediaSrc}
                    alt={marketingHomepage.cta.mediaAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 36rem"
                    className={home.finalPosterImage}
                  />
                </div>
              </motion.div>
            </MarketingReveal>
          </div>
        </section>
      </main>
    </div>
  )
}
