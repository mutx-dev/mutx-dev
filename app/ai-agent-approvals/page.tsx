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
  title: "AI Agent Approval Workflows — Human-in-the-Loop Gates & Operator Authorization | MUTX",
  description:
    "Most agent approval systems are advisory — they suggest a review but don't block the action. MUTX approval gates are enforced by the control plane. The agent waits for a decision, and every decision is on the record.",
  keywords: [
    "ai agent approvals",
    "human in the loop ai agents",
    "ai agent approval workflow",
    "operator authorization",
    "approval gates for ai agents",
  ],
  ...buildPageMetadata({
    title: "AI Agent Approval Workflows — Human-in-the-Loop Gates & Operator Authorization | MUTX",
    description:
      "Most agent approval systems are advisory — they suggest a review but don't block the action. MUTX approval gates are enforced by the control plane. The agent waits for a decision, and every decision is on the record.",
    path: "/ai-agent-approvals",
    socialDescription:
      "Enforced approval gates for AI agents. The agent waits for a human decision, the decision is recorded, and the record travels with the trace.",
    twitterTitle: "AI Agent Approval Workflows | MUTX",
    twitterDescription:
      "Human-in-the-loop gates enforced by the control plane. Agents wait for operator decisions — no advisory-only approvals.",
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
      name: "AI Agent Approval Workflows | MUTX",
      url: getCanonicalUrl("/ai-agent-approvals"),
      description:
        "Enforced approval gates for AI agents. Human-in-the-loop controls with operator routing, searchable audit records, and decision tracking built into the control plane.",
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
          name: "AI Agent Approvals",
          item: getCanonicalUrl("/ai-agent-approvals"),
        },
      ],
    },
  ],
};

const featureCards = [
  {
    title: "Human-in-the-loop workflows",
    body: "Define which agent operations require a human sign-off before proceeding. Approval gates are control plane records — not a Slack message that may or may not get answered.",
  },
  {
    title: "Operator authorization records",
    body: "Who approved what, when, and why — recorded with full execution context. The chain from request to approval to outcome, not a vague note that someone clicked approve.",
  },
  {
    title: "Escalation paths",
    body: "Pending approvals route to the right operator instead of hoping the request appears in whichever notification channel happens to be watched that day.",
  },
  {
    title: "Autonomous vs. approved",
    body: "Know what the agent did on its own versus what required human sign-off. That distinction stays visible in traces, cost attribution, and audit logs.",
  },
];

const approvalCards = [
  {
    title: "Production changes",
    body: "Deployments, config mutations, and other production-facing actions. Usually the first place teams add approval gates because the risk is obvious and the review path is clear.",
  },
  {
    title: "Credential and access changes",
    body: "Requests that touch secrets, credentials, or privileged scopes are easier to reason about when the authorization event is explicit and lives in the same system as the action.",
  },
  {
    title: "High-cost actions",
    body: "Some actions aren&rsquo;t dangerous — they&rsquo;re expensive. Approval workflows slow down high-cost runs before they burn through budget.",
  },
  {
    title: "Policy exceptions",
    body: "When an agent hits a guardrail or policy boundary, the next step should be a deliberate operator workflow — not a silent fallback or a buried log line.",
  },
];

export default function AIAgentApprovalsPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Approvals</p>
                  <h1 className={feat.heroTitle}>
                    Real gates,
                    <br />
                    not rubber stamps.
                  </h1>
                  <p className={feat.heroSupport}>
                    You can&rsquo;t review every agent action, but you can
                    require a human on the ones that matter. MUTX lets you
                    define approval workflows for high-stakes agent operations,
                    route those decisions to the right people, and keep the
                    record attached to the runtime history.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="/ai-agent-governance"
                      className={core.buttonGhost}
                    >
                      Governance
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>How approvals work</p>
                <h2 className={feat.sectionTitle}>
                  Approvals that
                  <br />
                  actually block execution.
                </h2>
                <p className={feat.sectionBody}>
                  Most approval systems are advisory — they suggest a review but
                  don&rsquo;t stop the agent. MUTX approvals are control plane
                  gates. The agent waits for the decision, and that decision
                  travels with the trace.
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
                <p className={feat.sectionEyebrow}>Common approval gates</p>
                <h2 className={feat.sectionTitle}>
                  Where teams put
                  <br />
                  a human in the loop.
                </h2>
                <p className={feat.sectionBody}>
                  The first approval workflows are usually obvious: destructive
                  operations, privileged access, policy exceptions, or actions
                  expensive enough that they shouldn&rsquo;t run without a
                  second pair of eyes.
                </p>
              </div>
              <div className={feat.featureGrid}>
                {approvalCards.map((card) => (
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
                  Define an approval gate.
                  <br />
                  Watch it block.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, define an approval workflow for a
                  high-stakes agent operation, and trigger it. Watch the gate
                  block the operation, notify the right operator, and record
                  the decision in the control plane.
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
