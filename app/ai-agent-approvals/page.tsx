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
  title: "AI Agent Approvals — Human-in-the-Loop Workflows, Operator Authorization | MUTX",
  description:
    "Human oversight where it matters. MUTX lets you define approval gates for high-stakes agent operations — so critical actions always pass through a human, and everything is on the record.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-approvals") },
  openGraph: {
    title: "AI Agent Approvals — Human-in-the-Loop Workflows, Operator Authorization | MUTX",
    description:
      "Human oversight where it matters. Define approval gates for high-stakes agent operations — on the record, enforced by the control plane.",
    url: getCanonicalUrl("/ai-agent-approvals"),
    images: [getPageOgImageUrl("AI Agent Approvals — Human-in-the-Loop Workflows, Operator Authorization | MUTX", "Human oversight where it matters. Define approval gates for high-stakes agent operations — on the record, enforced by the control plane.", { path: "/ai-agent-approvals" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Approvals | MUTX",
    description:
      "Human oversight where it matters. Approval gates for high-stakes agent operations — on the record, enforced by the control plane.",
    images: [getPageTwitterImageUrl("AI Agent Approvals — Human-in-the-Loop Workflows, Operator Authorization | MUTX", "Human oversight where it matters. Define approval gates for high-stakes agent operations — on the record, enforced by the control plane.", { path: "/ai-agent-approvals" })],
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
      name: "AI Agent Approvals | MUTX",
      url: getCanonicalUrl("/ai-agent-approvals"),
      description:
        "Human oversight where it matters. Approval gates for high-stakes agent operations — on the record, enforced by the control plane.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Approval workflows",
    body: "Define which operations require a human to sign off before the agent proceeds. Approval gates are control plane records — not a Slack message that may or may not get answered.",
  },
  {
    title: "Authorization tracking",
    body: "Who approved what, when, and why — recorded in the audit log with the full execution context. Not just &ldquo;approved by jane@&rdquo; but the full chain from request to approval to outcome.",
  },
  {
    title: "Escalation paths",
    body: "When an approval is pending, the right operator gets notified through the control plane — not through whatever notification channel happens to be monitored that day.",
  },
  {
    title: "Automatic vs. approved",
    body: "Distinguish between what the agent did autonomously and what required human sign-off. This distinction is a first-class property in MUTX — visible in traces, cost attribution, and audit logs.",
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
                    Human oversight
                    <br />
                    where it matters.
                  </h1>
                  <p className={feat.heroSupport}>
                    You can&rsquo;t review every agent action — but you can make
                    sure the ones that matter pass through a human. MUTX lets
                    you define approval gates, track authorization decisions,
                    and keep a complete record of what required oversight and
                    what didn&rsquo;t.
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
                  actually block.
                </h2>
                <p className={feat.sectionBody}>
                  Most approval systems are advisory — they suggest a human
                  review but don&rsquo;t actually prevent the agent from proceeding.
                  MUTX approvals are control plane gates — the agent waits until
                  the approval is recorded, and the approval record travels with
                  the trace.
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
                  high-stakes agent operation, and trigger it. See the gate
                  block the operation, notify the right operator, and record
                  the approval — on the record, in the control plane.
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
