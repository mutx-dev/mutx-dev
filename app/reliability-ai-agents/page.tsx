import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import home from "@/components/site/marketing/MarketingHome.module.css";

const pageTitle = "Reliability for AI Agents | MUTX";
const pageDescription =
  "Build reliable AI agents with retry logic, timeout controls, fallback paths, and traceable failures. The control plane that makes production agent behavior predictable.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/reliability-ai-agents"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: pageTitle,
    description: pageDescription,
    images: [getOgImageUrl()],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${getSiteUrl()}/#organization`,
      name: "MUTX",
      url: getSiteUrl(),
      logo: `${getSiteUrl()}/logo.png`,
      sameAs: [
        "https://github.com/mutx-dev/mutx-dev",
        `https://x.com/${DEFAULT_X_HANDLE.replace("@", "")}`,
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "MUTX",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS",
      description: pageDescription,
      url: getCanonicalUrl("/reliability-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/reliability-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Building Reliable AI Agents for Production",
      description: pageDescription,
      author: {
        "@type": "Organization",
        name: "MUTX",
      },
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
  ],
};

const reliabilityPoints = [
  {
    title: "Timeout controls that actually fire",
    body: "Define how long a step runs before it fails. Not a best-effort timeout — one that the control plane enforces and can trigger a fallback path when it fires.",
  },
  {
    title: "Retry with receipts",
    body: "Configure retry behavior per step, per tool, or globally. Traces show what was retried, what changed, and whether the retry succeeded — no guessing.",
  },
  {
    title: "Fallback paths you define",
    body: "When an agent hits a failure, it should do something predictable — not retry indefinitely or return an error message. Build the path before you need it.",
  },
  {
    title: "Failure modes that trace",
    body: "Every failure produces a trace with context: what was tried, what failed, and what the agent did next. Debug time goes down; confidence goes up.",
  },
];

export default function ReliabilityAIAgentsPage() {
  return (
    <PublicSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={`${core.page} ${core.publicPage}`}>
        <main className={core.main}>
          <section className={home.heroSection}>
            <div className={home.heroShell}>
              <div className={home.heroColumn}>
                <p className={home.heroEyebrow}>Reliability</p>
                <h1 className={home.heroTitle}>
                  Make agent behavior
                  <br />
                  something you can count on.
                </h1>
                <p className={home.heroSupport}>
                  Timeout controls, retry logic, and fallback paths — defined in
                  the control plane so your agents fail predictably, not
                  spectacularly.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See Reliability Features
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>What you get</p>
                <h2 className={home.sectionTitle}>
                  Failures that trace.
                  <br />
                  Fallbacks that work.
                  <br />
                  Timeouts that fire.
                </h2>
                <p className={home.sectionBody}>
                  Unreliable agents are a production liability. MUTX gives you
                  controls that enforce — not just settings that suggest — so
                  what runs in production behaves like software.
                </p>
              </div>
              <div className={home.proofGrid}>
                {reliabilityPoints.map((point) => (
                  <div key={point.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{point.title}</h3>
                    <p className={home.sectionBody}>{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Production-ready</p>
                  <h2 className={home.sectionTitle}>
                    Define the failure mode.
                    <br />
                    Build the fallback.
                    <br />
                    Ship with confidence.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, configure your first retry policy, and
                    see how MUTX makes agent failures something your team can
                    actually debug.
                  </p>
                  <div className={home.finalActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="https://github.com/mutx-dev/mutx-dev"
                      className={home.secondaryAction}
                    >
                      View on GitHub
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
