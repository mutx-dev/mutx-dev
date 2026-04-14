import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getPageOgImageUrl, getPageTwitterImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Cost Management Software — LLM Spend Tracking, Budgets, Attribution | MUTX",
  description:
    "Track AI agent costs by run, model, provider, and workflow. MUTX gives operators spend attribution, budget enforcement, and runtime context before a runaway agent turns into an invoice surprise.",
  keywords: [
    "ai agent cost management",
    "llm cost tracking",
    "agent spend attribution",
    "ai agent budget controls",
    "runaway agent costs",
  ],
  alternates: { canonical: getCanonicalUrl("/ai-agent-cost") },
  openGraph: {
    title: "AI Agent Cost Management Software — LLM Spend Tracking, Budgets, Attribution | MUTX",
    description:
      "Track AI agent costs by run, model, provider, and workflow with budgets and attribution built into the control plane.",
    url: getCanonicalUrl("/ai-agent-cost"),
    images: [getPageOgImageUrl("AI Agent Cost Management Software — LLM Spend Tracking, Budgets, Attribution | MUTX", "Track AI agent costs by run, model, provider, and workflow with budgets and attribution built into the control plane.", { path: "/ai-agent-cost" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Cost Management Software | MUTX",
    description:
      "Track AI agent costs by run, model, provider, and workflow before spend turns into a billing surprise.",
    images: [getPageTwitterImageUrl("AI Agent Cost Management Software — LLM Spend Tracking, Budgets, Attribution | MUTX", "Track AI agent costs by run, model, provider, and workflow with budgets and attribution built into the control plane.", { path: "/ai-agent-cost" })],
  },
};

const faqItems = [
  {
    question: "How do you track AI agent costs per run?",
    answer:
      "MUTX attributes spend to the agent, model, provider, and workflow context around the run, so operators can see which execution path actually consumed the budget.",
  },
  {
    question: "Can you stop runaway AI agent spend before the invoice arrives?",
    answer:
      "Yes. MUTX treats budgets and rate limits as control plane policies, so operators can set spend ceilings and intervene before a retry storm or bad workflow keeps burning tokens.",
  },
  {
    question: "Does cost data connect to traces and approvals?",
    answer:
      "Yes. Cost visibility is designed to sit next to traces, governance controls, and approval records so you can investigate expensive runs in operational context instead of reading a billing export in isolation.",
  },
  {
    question: "What is the difference between LLM billing and AI agent cost management?",
    answer:
      "Provider billing tells you what was spent in aggregate. AI agent cost management explains which agent, workflow, model, and runtime decision created that spend, and lets you enforce limits at the control plane.",
  },
];

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
      name: "AI Agent Cost Management Software | MUTX",
      url: getCanonicalUrl("/ai-agent-cost"),
      description:
        "Track AI agent costs by run, model, provider, and workflow with budget enforcement and runtime context built into the control plane.",
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
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

const featureCards = [
  {
    title: "AI agent spend tracking",
    body: "Track spend per agent, per model, per provider, and per workflow. MUTX gives operators a view that answers which run is expensive, not just what the provider charged in aggregate.",
  },
  {
    title: "Per-run attribution",
    body: "Which agent burned $4,200 last Tuesday? MUTX attributes spend to the actual agent record and runtime context instead of leaving you to reverse-engineer cost from an API key.",
  },
  {
    title: "Budget enforcement",
    body: "Set spend limits per agent or per team. MUTX enforces them at the control plane instead of hoping application code remembers to check budget before every model call.",
  },
  {
    title: "Model and provider visibility",
    body: "Compare which models and providers are actually worth their cost. Rate limits and provider-level controls live next to the agent definition instead of hiding in environment variables.",
  },
];

const operationsCards = [
  {
    title: "Runaway retry loops",
    body: "When an agent keeps retrying a broken tool path, the real problem is not just extra spend. It is invisible spend tied to a workflow nobody is watching. MUTX makes that burn attributable and interruptible.",
  },
  {
    title: "Background worker drift",
    body: "Long-running or background agents often spend money quietly. Cost records stay attached to the runtime history so teams can inspect what happened before the budget report lands.",
  },
  {
    title: "Approval-aware budgets",
    body: "High-cost actions can be treated like governance events. Budgets, approvals, and runtime controls can sit in the same operator surface instead of being split across finance, logs, and chat.",
  },
  {
    title: "Trace-linked investigations",
    body: "A cost spike is only useful if you can inspect the trace behind it. MUTX keeps spend visibility close to monitoring and audit surfaces so operators can investigate fast.",
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
                    Know what your AI
                    <br />
                    agents cost.
                  </h1>
                  <p className={feat.heroSupport}>
                    Raw API bills do not tell you which AI agent ran up $4k last
                    Tuesday, which model is actually worth what you are paying,
                    or which workflow is about to surprise you at month end.
                    MUTX turns LLM spend tracking into an operator workflow with
                    attribution, budgets, and runtime context.
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
                  Cost is an operator
                  <br />
                  control surface.
                </h2>
                <p className={feat.sectionBody}>
                  Most teams discover AI agent cost problems from the provider
                  invoice, not from their runtime tooling. MUTX treats cost
                  visibility and budget enforcement as first-class control plane
                  concerns instead of afterthoughts bolted onto a billing export.
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
                  Stop the expensive
                  <br />
                  failures early.
                </h2>
                <p className={feat.sectionBody}>
                  Good AI agent cost management is not a finance dashboard. It
                  is a way to catch retry storms, stale workers, and high-cost
                  workflows while the runtime is still live.
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

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>FAQ</p>
                <h2 className={feat.sectionTitle}>
                  Questions teams ask
                  <br />
                  about agent spend.
                </h2>
                <p className={feat.sectionBody}>
                  These are the operational questions that usually show up once
                  teams move beyond raw model billing and start running agents
                  continuously.
                </p>
              </div>
              <div className={feat.featureGrid}>
                {faqItems.map((item) => (
                  <div key={item.question} className={feat.featureCard}>
                    <h3 className={feat.featureCardTitle}>{item.question}</h3>
                    <p className={feat.featureCardBody}>{item.answer}</p>
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
                  Download the Mac app, define spend limits for your first AI
                  agents, and see what cost attribution looks like when it is
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
