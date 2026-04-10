import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getPageOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Cost Management — Spend Visibility, Attribution, Budget Enforcement | MUTX",
  description:
    "Know what your agents cost and why. MUTX gives you real-time spend attribution per agent and model, so you can enforce budgets before a runaway agent becomes a five-figure surprise.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-cost") },
  openGraph: {
    title: "AI Agent Cost Management — Spend Visibility, Attribution, Budget Enforcement | MUTX",
    description:
      "Know what your agents cost and why. Real-time spend attribution per agent and model — enforced before it becomes a problem.",
    url: getCanonicalUrl("/ai-agent-cost"),
    images: [getPageOgImageUrl("AI Agent Cost Management — Spend Visibility, Attribution, Budget Enforcement | MUTX", "Know what your agents cost and why. Real-time spend attribution per agent and model — enforced before it becomes a problem.", { path: "/ai-agent-cost" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Cost Management | MUTX",
    description:
      "Know what your agents cost and why. Spend attribution per agent and model — enforced before it surprises you.",
    images: [getPageOgImageUrl("AI Agent Cost Management — Spend Visibility, Attribution, Budget Enforcement | MUTX", "Know what your agents cost and why. Real-time spend attribution per agent and model — enforced before it becomes a problem.", { path: "/ai-agent-cost" })],
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
      name: "AI Agent Cost Management | MUTX",
      url: getCanonicalUrl("/ai-agent-cost"),
      description:
        "Know what your agents cost and why. Real-time spend attribution per agent and model, enforced before a runaway agent becomes a five-figure surprise.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Spend visibility",
    body: "Track costs per agent, per model, per provider. Know exactly where your money goes without squinting at raw API billing dashboards built for a different era.",
  },
  {
    title: "Per-agent attribution",
    body: "Which agent burned $4,200 last Tuesday? MUTX attributes spend to the agent record — not to the API key that happens to have been used.",
  },
  {
    title: "Budget enforcement",
    body: "Set spend limits per agent or per team. MUTX enforces them at the control plane — not by hoping the application code checks before calling the API.",
  },
  {
    title: "Rate limits",
    body: "Model rate limits are a first-class control plane concern, not a configuration buried in environment variables. Define them alongside the agent definition.",
  },
];

export default function AIAgentCostPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Cost Management</p>
                  <h1 className={feat.heroTitle}>
                    Know what your
                    <br />
                    agents cost.
                  </h1>
                  <p className={feat.heroSupport}>
                    Raw API bills don&rsquo;t tell you which agent ran up $4k last
                    Tuesday, which model is actually worth what you&rsquo;re paying,
                    or which workflow is about to surprise you at month end.
                    MUTX gives you attribution — so cost becomes something you
                    can reason about, not something you discover after the fact.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link href="/ai-agent-monitoring" className={core.buttonGhost}>
                      Monitoring
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Cost properties</p>
                <h2 className={feat.sectionTitle}>
                  Cost is a control
                  <br />
                  plane property.
                </h2>
                <p className={feat.sectionBody}>
                  Most teams find out about cost problems from their API bill,
                  not from their agent tooling. MUTX treats cost visibility and
                  enforcement as a first-class control plane concern — not an
                  afterthought you add to the monitoring dashboard.
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
                <p className={feat.sectionEyebrow}>Connected surfaces</p>
                <h2 className={feat.sectionTitle}>
                  Cost talks to
                  <br />
                  everything else.
                </h2>
                <p className={feat.sectionBody}>
                  Spend limits and rate limits are governance controls. When cost
                  enforcement is part of the same control plane as auth
                  boundaries and deployment records, you get coherent policies
                  instead of disconnected feature flags.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Spending limits and rate limits are governance controls
                    enforced through the same policy layer that handles auth
                    boundaries and operator access.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Cost budgets travel with deployment configs. When you promote
                    an agent from staging to production, the cost policies promote
                    with it — no manual re-configuration.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Cost anomalies surface through the same monitoring surface as
                    runtime failures. You see the spike in spend and the
                    corresponding traces in one place.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-reliability">Reliability</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Circuit breakers and spend limits work together. An agent
                    that hits its spend ceiling can be throttled gracefully
                    before it becomes a production incident.
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
                  Set a budget before
                  <br />
                  your agents set one for you.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, define spend limits for your first
                  agents, and see what cost attribution looks like when it&rsquo;s
                  built into the control plane from the start.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <a
                    href="https://github.com/mutx-dev/mutx-dev"
                    className={feat.secondaryAction}
                  >
                    View on GitHub
                  </a>
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
