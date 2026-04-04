import Image from 'next/image'
import Link from 'next/link'
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  Database,
  PlugZap,
  Search,
  Shield,
  Siren,
  TerminalSquare,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

import {
  marketingHomepage,
  type MarketingActionLink,
  type MarketingAgentIcon,
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

const iconMap: Record<MarketingAgentIcon, LucideIcon> = {
  shield: Shield,
  workflow: Workflow,
  plug: PlugZap,
  siren: Siren,
  database: Database,
  terminal: TerminalSquare,
  search: Search,
  accessibility: Accessibility,
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
        rel="noreferrer"
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

function AgentMarquee() {
  const marqueeItems = [...marketingHomepage.agentShowcase.marquee, ...marketingHomepage.agentShowcase.marquee]

  return (
    <div className={home.heroMarquee} data-testid="homepage-agent-marquee">
      <div className={home.heroMarqueeTrack}>
        {marqueeItems.map((item, index) => (
          <span key={`${item}-${index}`} className={home.heroMarqueePill}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export function MarketingHomePage() {
  const [primaryAction, ...secondaryActions] = marketingHomepage.hero.actions
  const [finalPrimaryAction, ...finalSecondaryActions] = marketingHomepage.finalCta.actions
  const featuredAgent = marketingHomepage.agentShowcase.featured
  const FeaturedIcon = iconMap[featuredAgent.icon]

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
                <span
                  className={home.heroLockupMark}
                  data-testid="homepage-lockup-mark"
                  data-loader-target="marketing-brand-mark"
                >
                  <img
                    src="/logo.png"
                    alt="MUTX logo"
                    className={home.heroLockupMarkImage}
                    decoding="async"
                  />
                </span>
                <span className={home.heroLockupCopy} data-testid="homepage-lockup-copy">
                  <span className={home.heroLockupWord} data-testid="homepage-lockup-word">
                    MUTX
                  </span>
                  <span className={home.heroLockupMeta} data-testid="homepage-lockup-meta">
                    open control for deployed agents
                  </span>
                </span>
              </div>

              <div className={home.heroContent} data-testid="homepage-hero-content">
                <p className={home.heroEyebrow}>{marketingHomepage.hero.tagline}</p>
                <h1 className={home.heroTitle}>{marketingHomepage.hero.title}</h1>
                <p className={home.heroSupport}>{marketingHomepage.hero.support}</p>

                <div className={home.heroActions}>
                  <ActionLink action={primaryAction} className={core.buttonPrimary} />
                  <div className={home.heroSecondaryActions}>
                    {secondaryActions.map((action) => (
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

        <AgentMarquee />

        <section className={home.proofSection} data-testid="homepage-proof-strip">
          <div className={core.shell}>
            <MarketingReveal className={home.proofHeader}>
              <p className={home.sectionEyebrow}>{marketingHomepage.featureGrid.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.featureGrid.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.featureGrid.body}</p>
            </MarketingReveal>

            <div className={home.statRail}>
              {marketingHomepage.featureGrid.stats.map((stat, index) => (
                <MarketingReveal
                  key={stat.label}
                  className={home.statPill}
                  delay={index * 0.05}
                  distance={16}
                >
                  <span className={home.statValue}>{stat.value}</span>
                  <span className={home.statLabel}>{stat.label}</span>
                </MarketingReveal>
              ))}
            </div>

            <div className={home.featureGrid}>
              {marketingHomepage.featureGrid.cards.map((card, index) => (
                <MarketingReveal
                  key={card.title}
                  className={home.featureCard}
                  delay={index * 0.06}
                  distance={18}
                >
                  <p className={home.featureCardEyebrow}>{card.eyebrow}</p>
                  <h3 className={home.featureCardTitle}>{card.title}</h3>
                  <p className={home.featureCardBody}>{card.body}</p>
                </MarketingReveal>
              ))}
            </div>
          </div>
        </section>

        <section className={home.agentSection} data-testid="homepage-agent-showcase">
          <div className={core.shell}>
            <MarketingReveal className={home.agentHeader}>
              <p className={home.sectionEyebrow}>{marketingHomepage.agentShowcase.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.agentShowcase.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.agentShowcase.body}</p>
            </MarketingReveal>

            <div className={home.agentFeaturedLayout}>
              <MarketingReveal className={home.agentFeatured} distance={24}>
                <div className={home.agentFeaturedTopline}>
                  <span className={home.agentFeaturedLabel}>{featuredAgent.label}</span>
                  <span className={home.agentSlug}>{featuredAgent.slug}</span>
                </div>

                <div className={home.agentFeaturedHeader}>
                  <span className={home.agentFeaturedIconWrap} aria-hidden="true">
                    <FeaturedIcon className={home.agentFeaturedIcon} />
                  </span>
                  <div className={home.agentFeaturedCopy}>
                    <h3 className={home.agentFeaturedName}>{featuredAgent.name}</h3>
                    <p className={home.agentFeaturedSummary}>{featuredAgent.summary}</p>
                  </div>
                </div>

                <p className={home.agentFeaturedQuote}>“{featuredAgent.quote}”</p>

                <div className={home.agentCapabilityList}>
                  {featuredAgent.capabilities.map((capability) => (
                    <p key={capability} className={home.agentCapabilityItem}>
                      {capability}
                    </p>
                  ))}
                </div>
              </MarketingReveal>

              <div className={home.agentGrid}>
                {marketingHomepage.agentShowcase.cards.map((agent, index) => {
                  const Icon = iconMap[agent.icon]

                  return (
                    <MarketingReveal
                      key={agent.slug}
                      className={home.agentCard}
                      delay={index * 0.05}
                      distance={18}
                    >
                      <div className={home.agentCardTopline}>
                        <span className={home.agentIconWrap} aria-hidden="true">
                          <Icon className={home.agentIcon} />
                        </span>
                        <span className={home.agentSlug}>{agent.slug}</span>
                      </div>
                      <div className={home.agentCardCopy}>
                        <h3 className={home.agentName}>{agent.name}</h3>
                        <p className={home.agentSummary}>{agent.summary}</p>
                      </div>
                    </MarketingReveal>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className={home.depthSection} data-testid="homepage-depth-section">
          <div className={core.shell}>
            <div className={home.depthLayout}>
              <MarketingReveal className={home.depthPanel} distance={24}>
                <div className={home.depthPanelHeader}>
                  <p className={home.depthPanelEyebrow}>
                    {marketingHomepage.operatorSection.preview.eyebrow}
                  </p>
                  <h2 className={home.depthPanelTitle}>
                    {marketingHomepage.operatorSection.preview.title}
                  </h2>
                  <p className={home.depthPanelBody}>
                    {marketingHomepage.operatorSection.preview.body}
                  </p>
                </div>

                <div className={home.depthMediaFrame} data-testid="homepage-depth-media">
                  <Image
                    src={marketingHomepage.operatorSection.preview.imageSrc}
                    alt={marketingHomepage.operatorSection.preview.imageAlt}
                    data-testid="homepage-depth-image"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40rem"
                    className={home.depthPoster}
                  />
                </div>

                <div className={home.depthPanelList}>
                  {marketingHomepage.operatorSection.preview.items.map((item) => (
                    <p key={item} className={home.depthPanelListItem}>
                      {item}
                    </p>
                  ))}
                </div>
              </MarketingReveal>

              <div className={home.depthContent}>
                <MarketingReveal className={home.depthIntro}>
                  <p className={home.sectionEyebrow}>{marketingHomepage.operatorSection.eyebrow}</p>
                  <h2 className={home.sectionTitle}>{marketingHomepage.operatorSection.title}</h2>
                  <p className={home.sectionBody}>{marketingHomepage.operatorSection.body}</p>
                </MarketingReveal>

                <div className={home.depthSteps}>
                  {marketingHomepage.operatorSection.pillars.map((pillar, index) => (
                    <MarketingReveal
                      key={pillar.id}
                      className={home.depthStep}
                      delay={index * 0.08}
                      distance={20}
                    >
                      <p className={home.depthStepIndex}>{pillar.index}</p>
                      <div className={home.depthStepCopy}>
                        <h3 className={home.depthStepTitle}>{pillar.title}</h3>
                        <p className={home.depthStepBody}>{pillar.body}</p>
                      </div>
                    </MarketingReveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={home.finalSection} data-testid="homepage-final-cta">
          <div className={core.shell}>
            <MarketingReveal className={home.finalInner} distance={24}>
              <div className={home.finalCopy}>
                <p className={home.sectionEyebrow}>{marketingHomepage.finalCta.eyebrow}</p>
                <h2 className={home.sectionTitle}>{marketingHomepage.finalCta.title}</h2>
                <p className={home.sectionBody}>{marketingHomepage.finalCta.body}</p>
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

              <div className={home.finalPreview} data-testid="homepage-demo-preview">
                <div className={home.finalPreviewDevice}>
                  <div className={home.finalPreviewScreen}>
                    <img
                      src="/demo.gif"
                      alt="MUTX operator demo showing the control plane in motion"
                      className={home.finalPreviewImage}
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </MarketingReveal>
          </div>
        </section>
      </main>
    </div>
  )
}
