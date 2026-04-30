import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  buildPageMetadata,
  getCanonicalUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Control Plane - Runtime Traces, Lifecycle, Agent Setup | MUTX",
  description:
    "MUTX gives you runtime traces, agent lifecycle records, and a clear review dashboard for every agent in your workspace.",
  ...buildPageMetadata({
    title: "AI Agent Control Plane - Runtime Traces, Lifecycle, Agent Setup | MUTX",
    description:
      "MUTX gives you runtime traces, agent lifecycle records, and a clear review dashboard for every agent in your workspace.",
    path: "/ai-agent-control-plane",
    socialDescription:
      "Runtime traces, lifecycle records, and a clear review dashboard for every agent in your workspace.",
    twitterTitle: "AI Agent Control Plane | MUTX",
    twitterDescription:
      "Runtime traces, lifecycle records, and review dashboards for agents from setup to daily use.",
  }),
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${getSiteUrl()}/#organization`,
      name: "MUTX",
      url: getSiteUrl(),
      sameAs: [`https://x.com/${DEFAULT_X_HANDLE.replace("@", "")}`],
    },
    {
      "@type": "SoftwareApplication",
      name: "MUTX",
      applicationCategory: "DeveloperApplication",
      description:
        "Source-available control plane for AI agent governance, deployment, and observability.",
      downloadUrl: `${getSiteUrl()}/download`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "WebPage",
      name: "AI Agent Control Plane | MUTX",
      url: getCanonicalUrl("/ai-agent-control-plane"),
      description:
        "Runtime traces, lifecycle records, and a clear review dashboard for every agent in your workspace.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Runtime visibility",
    body: "See what your agents did. Traces, tool calls, context windows, and outcomes are collected in one place.",
  },
  {
    title: "Agent lifecycle",
    body: "Every agent has a record: who created it, what runtime it uses, and which toolchain version was active.",
  },
  {
    title: "Agent setup",
    body: "Set up agents, review their actions, and keep the important details visible without digging through logs.",
  },
  {
    title: "Consistent settings",
    body: "Keep staging and production aligned with settings that travel with each agent configuration.",
  },
];

export default function AIAgentControlPlanePage() {
  return (
    <PublicSurface>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={`${core.page} ${core.publicPage}`}>
        <main className={core.main}>
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Control Plane</p>
                  <h1 className={feat.heroTitle}>
                    The control plane
                    <br />
                    is the product.
                  </h1>
                  <p className={feat.heroSupport}>
                    Most agent tooling treats the control plane as an
                    afterthought. MUTX makes it the place where setup,
                    runtime visibility, and daily review all come together.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="/ai-agent-deployment"
                      className={core.buttonGhost}
                    >
                      Deployment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Control plane properties</p>
                <h2 className={feat.sectionTitle}>
                  Read the runtime.
                  <br />
                  Keep context clear.
                </h2>
                <p className={feat.sectionBody}>
                  When something changes in production, you need to see what
                  happened, which tools ran, and which settings were active.
                  MUTX keeps that context easy to read.
                </p>
              </div>
              <div className={feat.featureGrid}>
                {featureCards.map((card) => (
                  <div key={card.title} className={feat.featureCard}>
                    <h3 className={feat.featureCardTitle}>{card.title}</h3>
                    <p className={feat.featureCardBody}>{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Cross-cutting concerns</p>
                <h2 className={feat.sectionTitle}>
                  One plane.
                  <br />
                  Every concern.
                </h2>
                <p className={feat.sectionBody}>
                  Governance, cost, deployment, and observability belong in the
                  same workspace. Policies, traces, and setup details stay
                  connected as your agent fleet grows.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth boundaries and access controls enforced by the control
                    plane, not by convention. They travel with the agent
                    everywhere it runs.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Spend limits and rate limits are control plane properties.
                    They are enforced in the runtime instead of scattered
                    across individual API calls.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces and metrics surface through the control plane, tied
                    to the agent definitions they describe.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Deployments are control plane records. What ran, when, with
                    what config - versioned and readable in the same dashboard
                    you use to operate the agent.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.finalSection}>
            <div className={core.shell}>
              <div className={feat.finalInner}>
                <p className={feat.finalEyebrow}>Get started</p>
                <h2 className={feat.finalTitle}>
                  See what your agents
                  <br />
                  are actually doing.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and open the runtime workspace. Review
                  agent traces, settings, and setup details in one place.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/docs/architecture/overview" className={feat.secondaryAction}>
                    Architecture overview
                  </Link>
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
