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
  title: "AI Agent Cost Management — Per-Run Spend Tracking, Budgets, Attribution | MUTX",
  description:
    "Track AI agent costs by run, model, provider, and workflow. MUTX attributes spend in real time, enforces budgets at the control plane, and catches runaway agents before the invoice lands.",
  keywords: [
    "ai agent cost management",
    "llm cost tracking",
    "agent spend attribution",
    "ai agent budget controls",
    "runaway agent costs",
  ],
  ...buildPageMetadata({
    title: "AI Agent Cost Management — Per-Run Spend Tracking, Budgets, Attribution | MUTX",
    description:
      "Track AI agent costs by run, model, provider, and workflow. MUTX attributes spend in real time, enforces budgets at the control plane, and catches runaway agents before the invoice lands.",
    path: "/ai-agent-cost",
    socialDescription:
      "Track AI agent costs by run, model, provider, and workflow. Budgets and attribution built into the control plane.",
    twitterTitle: "AI Agent Cost Management | MUTX",
    twitterDescription:
      "Track AI agent costs by run, model, provider, and workflow. Catch runaway spend before the invoice lands.",
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
      name: "AI Agent Cost Management | MUTX",
      url: getCanonicalUrl("/ai-agent-cost"),
      description:
        "Track AI agent costs by run, model, provider, and workflow. Budget enforcement and runtime context built into the control plane.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "MUTX",
          item: getSiteUrl(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "AI Agent Cost Management",
          item: getCanonicalUrl("/ai-agent-cost"),
        },
      ],
    },
  ],
};

const featureCards = [
  {
    title: "AI agent spend tracking",
    body: "Track spend per agent, model, provider, and workflow. MUTX answers which run is expensive — not just what the provider charged.",
  },
  {
    title: "Per-run attribution",
    body: "Which agent burned $4,200 last Tuesday? MUTX ties spend to the actual agent record and runtime context. No reverse-engineering from an API key.",
  },
  {
    title: "Budget enforcement",
    body: "Set spend limits per agent or per team. MUTX enforces them at the control plane — not by hoping application code checks the budget before every model call.",
  },
  {
    title: "Model and provider visibility",
    body: "Compare which models and providers earn their cost. Rate limits and provider-level controls live on the agent definition — not in environment variables.",
  },
];

const operationsCards = [
  {
    title: "Runaway retry loops",
    body: "An agent retrying a broken tool path burns tokens invisibly. MUTX makes that spend attributable and interruptible — you see the loop, you stop the loop.",
  },
  {
    title: "Background worker drift",
    body: "Long-running agents spend money quietly. Cost records stay attached to runtime history so you can inspect what happened before the budget report lands.",
  },
  {
    title: "Approval-aware budgets",
    body: "High-cost actions are governance events. Budgets, approvals, and runtime controls share one review dashboard, not three disconnected tools.",
  },
  {
    title: "Trace-linked investigations",
    body: "A cost spike is only useful if you can see the trace behind it. MUTX keeps spend next to monitoring and audit surfaces so operators can investigate fast.",
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
        <main id="main-content" className={core.main}>
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Cost Management</p>
                  <h1 className={feat.heroTitle}>
                    Know what your AI
                    <br />
                    agents cost — per run.
                  </h1>
                  <p className={feat.heroSupport}>
                    API bills don&apos;t tell you which agent ran up $4k last
                    Tuesday, which model earns its price, or which workflow is
                    about to blow up the monthly budget. MUTX attributes LLM
                    spend to the agent, the run, and the decision — with budgets
                    enforced at the control plane.
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
                  plane concern.
                </h2>
                <p className={feat.sectionBody}>
                  Most teams discover agent cost problems from the provider
                  invoice. By then it&apos;s too late. MUTX treats cost
                  visibility and budget enforcement as first-class control plane
                  properties — not afterthoughts bolted onto a billing export.
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
                <p className={feat.sectionEyebrow}>Failure modes</p>
                <h2 className={feat.sectionTitle}>
                  Catch expensive failures
                  <br />
                  while the runtime is live.
                </h2>
                <p className={feat.sectionBody}>
                  Agent cost management isn&apos;t a finance dashboard. It&apos;s a way to catch retry storms, stale workers, and runaway workflows before the billing cycle closes.
                </p>
              </div>
              <div className={feat.featureGrid}>
                {operationsCards.map((card) => (
                  <div key={card.title} className={feat.featureCard}>
                    <h3 className={feat.featureCardTitle}>{card.title}</h3>
                    <p className={feat.featureCardBody}>{card.body}</p>
                  </div>
                ))}
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
                  Download the Mac app. Define spend limits for your first
                  agents. See what cost attribution looks like when it&apos;s
                  built into the control plane from day one.
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
