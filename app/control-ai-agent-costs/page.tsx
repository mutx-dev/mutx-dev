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

const pageTitle = "Control AI Agent Costs | MUTX";
const pageDescription =
  "Track, limit, and optimize AI agent operational costs with visibility into token usage, runtime spend, and per-agent budgets. Make cost a first-class concern in your agent control plane.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/control-ai-agent-costs"),
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
      url: getCanonicalUrl("/control-ai-agent-costs"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/control-ai-agent-costs"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Controlling AI Agent Operational Costs",
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

const costControlPoints = [
  {
    title: "Per-agent spend visibility",
    body: "See exactly what each agent costs per run, per day, and over time. Token counts, model calls, and runtime add up — and you should see them before the invoice does.",
  },
  {
    title: "Budget limits that enforce",
    body: "Set soft limits, hard caps, and per-team budgets. When an agent hits a threshold, the control plane can pause, alert, or require approval — not just log the overspend.",
  },
  {
    title: "Cost attribution across teams",
    body: "When agents move between projects or teams, their cost history moves with them. attribution that actually sticks, so you can charge back without chasing receipts.",
  },
  {
    title: "Optimize from traces",
    body: "Every trace shows token usage per step. Find the calls that are eating budget and understand whether they were necessary — or just the path of least resistance.",
  },
];

export default function ControlAIAgentCostsPage() {
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
                <p className={home.heroEyebrow}>Cost Control</p>
                <h1 className={home.heroTitle}>
                  Know what your agents
                  <br />
                  cost before you scale.
                </h1>
                <p className={home.heroSupport}>
                  Token counts, runtime spend, and per-agent budgets — surfaced
                  in the control plane before they become line items you cannot
                  explain.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See Cost Controls
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
                  Cost visibility that travels
                  <br />
                  with your agents.
                </h2>
                <p className={home.sectionBody}>
                  Most platforms give you cost after the fact. MUTX makes spend
                  a first-class concern in your control plane — with limits that
                  enforce and traces that explain.
                </p>
              </div>
              <div className={home.proofGrid}>
                {costControlPoints.map((point) => (
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
                  <p className={home.sectionEyebrow}>Ship with confidence</p>
                  <h2 className={home.sectionTitle}>
                    Set budgets.
                    <br />
                    See the traces.
                    <br />
                    Control the cost.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and connect your first runtime. Set a
                    per-agent budget, run your agent, and see exactly where the
                    spend goes.
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
