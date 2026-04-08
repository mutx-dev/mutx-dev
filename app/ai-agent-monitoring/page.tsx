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

const pageTitle = "AI Agent Monitoring | MUTX";
const pageDescription =
  "Monitor AI agent behavior in production. MUTX provides full trace visibility, execution metrics, and actionable alerts so your team can actually understand what agents are doing.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-monitoring"),
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
      url: getCanonicalUrl("/ai-agent-monitoring"),
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
      url: getCanonicalUrl("/ai-agent-monitoring"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Monitoring and Observability",
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

const monitoringPoints = [
  {
    title: "Full trace visibility",
    body: "Every agent run, every tool call, every context window decision — captured and readable by your whole team, not just the person who built it.",
  },
  {
    title: "Execution metrics",
    body: "Latency, token usage, model response quality, and custom metrics. Dashboards that help you spot patterns, not just individual runs.",
  },
  {
    title: "Actionable alerting",
    body: "Get paged when something actually needs attention — a budget breach, a quality regression, an auth failure — not every time an agent says hello.",
  },
  {
    title: "Cross-agent correlation",
    body: "When one agent has issues, see how it relates to others. Shared tools, shared models, shared context — traced together.",
  },
];

export default function AIAgentMonitoringPage() {
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
                <p className={home.heroEyebrow}>AI Agent Monitoring</p>
                <h1 className={home.heroTitle}>
                  See what your agents
                  <br />
                  are actually doing.
                </h1>
                <p className={home.heroSupport}>
                  Production AI without observability is flying blind. MUTX
                  captures every trace, every metric, and every decision — so
                  your team can understand and improve agent behavior over time.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-governance" className={core.buttonGhost}>
                    Explore Governance
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>Observability</p>
                <h2 className={home.sectionTitle}>
                  Traces your team can actually use.
                </h2>
                <p className={home.sectionBody}>
                  Most agent platforms give you a raw log dump. MUTX gives you
                  structured traces that make sense — organized by run,
                  filterable by outcome, and readable without reverse
                  engineering prompt chains.
                </p>
              </div>
              <div className={home.proofGrid}>
                {monitoringPoints.map((point) => (
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
                  Monitoring built on the control plane.
                </h2>
                <p className={home.sectionBody}>
                  MUTX monitoring isn't bolted on after the fact — it's
                  integrated into the control plane from the start. Every
                  agent connected to MUTX automatically emits traces through
                  the same runtime surface.
                </p>
              </div>
              <div className={home.proofGrid}>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    The foundation. All agent runtimes connect to MUTX, which means traces flow naturally into monitoring.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Monitoring starts at deployment. Every agent ships with the MUTX runtime attached and emitting.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Auth failures and permission violations are first-class monitoring events, not afterthoughts.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Spend and usage metrics are integrated into the same monitoring surface as quality and latency.
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
                    Know what your agents are doing.
                    <br />
                    Monitor with MUTX.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and connect your first agent runtime.
                    Traces start flowing immediately — no instrumentation
                    required beyond the MUTX runtime surface.
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
