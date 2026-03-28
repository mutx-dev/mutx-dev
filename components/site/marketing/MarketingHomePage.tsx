"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import {
  marketingHomepage,
  type MarketingActionLink,
} from "@/lib/marketingContent";

import core from "./MarketingCore.module.css";
import { MarketingHeroBackdrop } from "./MarketingHeroBackdrop";
import home from "./MarketingHome.module.css";
import { MarketingLoader } from "./MarketingLoader";
import { MarketingReveal } from "./MarketingReveal";

type ActionLinkProps = {
  action: MarketingActionLink;
  className: string;
};

function ActionLink({ action, className }: ActionLinkProps) {
  const icon = action.tone === "primary" ? (
    <ArrowRight className="h-4 w-4" />
  ) : (
    <ArrowUpRight className="h-4 w-4" />
  );

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
    );
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
      {icon}
    </Link>
  );
}

function DepthNarrative() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const mediaY = useTransform(scrollYProgress, [0, 1], [42, -38]);
  const mediaScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 1.03]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.45, 1], [0.18, 0.42, 0.22]);

  return (
    <section
      ref={sectionRef}
      className={home.depthSection}
      data-testid="homepage-depth-section"
    >
      <div className={core.shell}>
        <MarketingReveal className={home.depthIntro}>
          <p className={home.sectionEyebrow}>{marketingHomepage.depthNarrative.eyebrow}</p>
          <h2 className={home.sectionTitle}>{marketingHomepage.depthNarrative.title}</h2>
          <p className={home.sectionBody}>{marketingHomepage.depthNarrative.body}</p>
        </MarketingReveal>

        <div className={home.depthLayout}>
          <div className={home.depthSteps}>
            {marketingHomepage.depthNarrative.steps.map((step, index) => (
              <MarketingReveal
                key={step.id}
                className={home.depthStep}
                delay={index * 0.08}
                distance={26}
              >
                <p className={home.depthStepIndex}>{step.index}</p>
                <div className={home.depthStepCopy}>
                  <h3 className={home.depthStepTitle}>{step.title}</h3>
                  <p className={home.depthStepBody}>{step.body}</p>
                  <p className={home.depthStepDetail}>{step.detail}</p>
                </div>
              </MarketingReveal>
            ))}
          </div>

          <div className={home.depthMediaColumn}>
            <div className={home.depthMediaSticky}>
              <motion.div
                className={home.depthMediaFrame}
                data-testid="homepage-depth-media"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: mediaY,
                        scale: mediaScale,
                      }
                }
              >
                <motion.div
                  className={home.depthMediaGlow}
                  style={prefersReducedMotion ? undefined : { opacity: glowOpacity }}
                />
                <span className={home.depthMediaLabel}>
                  {marketingHomepage.depthNarrative.media.label}
                </span>
                <Image
                  src={marketingHomepage.depthNarrative.media.posterSrc}
                  alt={marketingHomepage.depthNarrative.media.alt}
                  data-testid="homepage-depth-image"
                  fill
                  sizes="(max-width: 1024px) 100vw, 38rem"
                  className={home.depthPoster}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingHomePage() {
  const [primaryAction, ...secondaryActions] = marketingHomepage.hero.actions;
  const [finalPrimaryAction, ...finalSecondaryActions] = marketingHomepage.finalCta.actions;

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

        <section
          className={home.proofSection}
          data-testid="homepage-proof-strip"
        >
          <div className={core.shell}>
            <MarketingReveal className={home.proofHeader}>
              <p className={home.sectionEyebrow}>{marketingHomepage.proofStrip.eyebrow}</p>
              <h2 className={home.sectionTitle}>{marketingHomepage.proofStrip.title}</h2>
              <p className={home.sectionBody}>{marketingHomepage.proofStrip.body}</p>
            </MarketingReveal>

            <div className={home.proofStrip}>
              {marketingHomepage.proofStrip.items.map((item, index) => (
                <MarketingReveal
                  key={item.label}
                  className={home.proofItem}
                  delay={index * 0.07}
                  distance={18}
                >
                  <p className={home.proofLabel}>{item.label}</p>
                  <p className={home.proofValue}>{item.value}</p>
                </MarketingReveal>
              ))}
            </div>
          </div>
        </section>

        <DepthNarrative />

        <section
          className={home.finalSection}
          data-testid="homepage-final-cta"
        >
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
                  <div className={home.finalPreviewStand} aria-hidden="true" />
                </div>
              </div>
            </MarketingReveal>
          </div>
        </section>
      </main>
    </div>
  );
}
