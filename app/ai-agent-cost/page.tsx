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

const pageTitle = "AI Agent Cost Management | MUTX";
const pageDescription =
  "Control AI agent spend. MUTX provides spend tracking across models and providers, budget enforcement, and cost attribution so you know exactly what your agents cost.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-cost"),
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
      url: getCanonicalUrl("/ai-agent-cost"),
      downloadUrl: `${getSiteUrl()}/download`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/ai-agent-cost"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Cost Management and Budget Control",
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

const costPoints = [
  {
    title: "Spend visibility",
    body: "Track costs per agent, per model, per provider. Know exactly where your money goes without squinting at raw API bills.",
  },
  {
    title: "Budget enforcement",
    body: "Set hard limits per agent or per team. When a budget is hit, the control plane stops the calls — not your invoice.",
  },
  {
    title: "Cost attribution",
    body: "Attribute spend to teams, products, or customers. Share cost data with the people who need it without manual reconciliation.",
  },
  {
    title: "Anomaly detection",
    body: "Get alerted when an agent's spending pattern changes unexpectedly — before a runaway prompt burns through your monthly budget.",
  },
];

export default function AIAgentCostPage() {
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
                <p className={home.heroEyebrow}>AI Agent Cost Management</p>
                <h1 className={home.heroTitle}>
                  Know what your agents cost.
                  <br />
                  Stop surprises before they happen.
                </h1>
                <p className={home.heroSupport}>
                  AI spend is notoriously hard to predict. MUTX gives you
                  real-time visibility, budget enforcement, and cost
                  attribution across every agent and model — so you can ship
                  agents without anxiety about the invoice.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-control-plane" className={core.buttonGhost}>
                    Back to Control Plane
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>Cost management</p>
                <h2 className={home.sectionTitle}>
                  budgets that actually work.
                </h2>
                <p className={home.sectionBody}>
                  Most platforms give you a cost dashboard after the fact —
                  useful for postmortems, useless for control. MUTX enforces
                  budgets at the control plane level, so you set a limit and
                  the platform respects it.
                </p>
              </div>
              <div className={home.proofGrid}>
                {costPoints.map((point) => (
                  <div key={point.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{point.title}</h3>
                    <p className={home.sectionBody}>{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>The control plane advantage</p>
                <h2 className={home.sectionTitle}>
                  Cost control through the control plane.
                </h2>
                <p className={home.sectionBody}>
                  MUTX cost management isn't a reporting tool — it's enforced
                  at the runtime level. When an agent tries to make a call
                  that would exceed its budget, the control plane stops it.
                  No surprises, no runaway invoices.
                </p>
              </div>
              <div className={home.proofGrid}>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    The foundation. All agent runtime calls route through MUTX, which means cost enforcement happens at the source.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Set cost budgets per environment. A staging agent doesn't accidentally consume production budget.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Spend metrics are part of the same monitoring surface as quality and latency — one dashboard, everything together.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Rate limits and spending limits are governance controls enforced by the same policy layer as auth boundaries.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Get started</p>
                  <h2 className={home.sectionTitle}>
                    Set budgets. Stop surprises.
                    <br />
                    Manage costs with MUTX.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and set your first agent budget.
                    From day one, you'll have real-time visibility and enforced
                    limits across every runtime.
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
