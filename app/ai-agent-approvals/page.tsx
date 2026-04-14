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
  title: "AI Agent Approval Workflows — Human-in-the-Loop Controls | MUTX",
  description:
    "Add human-in-the-loop approval workflows to AI agents. MUTX lets operators require authorization for risky actions, route decisions to the right people, and keep every approval on the record.",
  keywords: [
    "ai agent approvals",
    "human in the loop ai agents",
    "ai agent approval workflow",
    "operator authorization",
    "approval gates for ai agents",
  ],
  alternates: { canonical: getCanonicalUrl("/ai-agent-approvals") },
  openGraph: {
    title: "AI Agent Approval Workflows — Human-in-the-Loop Controls | MUTX",
    description:
      "Add human-in-the-loop approval workflows to AI agents with enforced gates, operator routing, and searchable audit records.",
    url: getCanonicalUrl("/ai-agent-approvals"),
    images: [getPageOgImageUrl("AI Agent Approval Workflows — Human-in-the-Loop Controls | MUTX", "Add human-in-the-loop approval workflows to AI agents with enforced gates, operator routing, and searchable audit records.", { path: "/ai-agent-approvals" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Approval Workflows | MUTX",
    description:
      "Human-in-the-loop controls for AI agents with enforced approval gates and operator authorization records.",
    images: [getPageTwitterImageUrl("AI Agent Approval Workflows — Human-in-the-Loop Controls | MUTX", "Add human-in-the-loop approval workflows to AI agents with enforced gates, operator routing, and searchable audit records.", { path: "/ai-agent-approvals" })],
  },
};

const faqItems = [
  {
    question: "What is an AI agent approval workflow?",
    answer:
      "It is a human-in-the-loop control that blocks selected agent actions until an authorized operator approves, rejects, or escalates the request with full execution context.",
  },
  {
    question: "Do approvals actually block the agent?",
    answer:
      "That is the point. MUTX approvals are designed as control plane gates rather than advisory notifications, so high-risk actions can wait for a decision instead of racing ahead.",
  },
  {
    question: "Which actions usually need human approval?",
    answer:
      "Teams usually start with destructive actions, production changes, credential access, policy exceptions, or high-cost operations that should not run fully autonomously.",
  },
  {
    question: "Can operators tell which actions were autonomous and which were approved?",
    answer:
      "Yes. MUTX keeps approval state visible next to traces, audit logs, and governance records so operators can distinguish autonomous behavior from human-authorized behavior during investigations.",
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
      name: "AI Agent Approval Workflows | MUTX",
      url: getCanonicalUrl("/ai-agent-approvals"),
      description:
        "Add human-in-the-loop approval workflows to AI agents with enforced approval gates, operator routing, and searchable audit records.",
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
    title: "Human-in-the-loop workflows",
    body: "Define which AI agent operations require a human to sign off before the agent proceeds. Approval gates are control plane records, not a chat message that may or may not get answered.",
  },
  {
    title: "Operator authorization records",
    body: "Who approved what, when, and why is recorded with the execution context. You get the chain from request to approval to outcome, not a vague note that someone clicked approve.",
  },
  {
    title: "Escalation paths",
    body: "When an approval is pending, the right operator can be routed into the workflow instead of hoping the request appears in whichever notification channel happens to be watched that day.",
  },
  {
    title: "Autonomous vs. approved",
    body: "Distinguish between what the agent did autonomously and what required human sign-off. That distinction stays visible in traces, cost attribution, and audit logs.",
  },
];

const approvalCards = [
  {
    title: "Production changes",
    body: "Deployments, config mutations, or other production-facing actions are often the first place teams add approval gates because the risk is obvious and the operator path is clear.",
  },
  {
    title: "Credential and access changes",
    body: "Requests that touch secrets, credentials, or privileged scopes are easier to reason about when the authorization event is explicit and recorded in the same system as the action itself.",
  },
  {
    title: "High-cost actions",
    body: "Some actions are not dangerous because they are destructive. They are dangerous because they are expensive. Approval workflows can be used to slow down high-cost runs before they burn budget.",
  },
  {
    title: "Policy exceptions",
    body: "When an agent hits a guardrail or policy boundary, the next step should be a deliberate operator workflow, not a silent fallback or a buried log line.",
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
        <main className={core.main}>
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Approvals</p>
                  <h1 className={feat.heroTitle}>
                    Human-in-the-loop
                    <br />
                    approval controls.
                  </h1>
                  <p className={feat.heroSupport}>
                    You cannot review every agent action, but you can require a
                    human on the ones that matter. MUTX lets operators define
                    approval workflows for risky AI agent actions, route those
                    decisions to the right people, and keep the record attached
                    to the runtime history.
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
                <p className={feat.sectionEyebrow}>Approval properties</p>
                <h2 className={feat.sectionTitle}>
                  Approvals that
                  <br />
                  actually gate execution.
                </h2>
                <p className={feat.sectionBody}>
                  Most approval systems are advisory. They suggest a review but
                  do not actually prevent the agent from proceeding. MUTX
                  approvals are control plane gates, so the agent waits for the
                  recorded decision and that decision travels with the trace.
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
                  Where teams usually
                  <br />
                  add a human.
                </h2>
                <p className={feat.sectionBody}>
                  The first approval workflows are usually obvious: destructive
                  operations, privileged access, policy exceptions, or actions
                  expensive enough that they should not run without a second set
                  of eyes.
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

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Connected surfaces</p>
                <h2 className={feat.sectionTitle}>
                  Approvals touch
                  <br />
                  everything in the plane.
                </h2>
                <p className={feat.sectionBody}>
                  When approvals are part of the control plane, they integrate
                  cleanly with audit logs, governance policies, and monitoring
                  traces. The approval record is attached to the trace, recorded
                  in the audit log, and visible in the governance surface — not
                  siloed in a separate workflow tool.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Approval requirements are governance policies. Who can
                    approve what, and under what conditions — defined in the
                    governance model and enforced by the approval gate.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Every approval decision — who approved, what they approved,
                    the full context — is in the audit log. Compliance reviewers
                    see the complete chain from request to outcome.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    The distinction between automated and approved actions is
                    visible in every trace. When you&rsquo;re investigating an
                    incident, you see immediately which actions required human
                    sign-off and which didn&rsquo;t.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-guardrails">Guardrails</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    A guardrail violation can be configured to require approval
                    before the agent can proceed. The response to a safety
                    boundary isn&rsquo;t just a log entry — it&rsquo;s a workflow
                    that brings in a human operator.
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
                  about approvals.
                </h2>
                <p className={feat.sectionBody}>
                  Approval systems only help if operators understand when to use
                  them and how they connect to the rest of the runtime.
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
                  Define an approval gate
                  <br />
                  and watch it block.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, define an approval workflow for a
                  high-stakes AI agent operation, and trigger it. See the gate
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
