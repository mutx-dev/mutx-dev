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
  title: "AI Agent Audit Logs — Trace History, Compliance Records, Operator Accountability | MUTX",
  description:
    "Complete trace history for every agent decision. MUTX records agent actions, policy evaluations, and operator decisions — so you can answer what happened and why.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-audit-logs") },
  openGraph: {
    title: "AI Agent Audit Logs — Trace History, Compliance Records, Operator Accountability | MUTX",
    description:
      "Complete trace history for every agent decision. Records that satisfy compliance requirements and help operators reason about what happened.",
    url: getCanonicalUrl("/ai-agent-audit-logs"),
    images: [getPageOgImageUrl("AI Agent Audit Logs — Trace History, Compliance Records, Operator Accountability | MUTX", "Complete trace history for every agent decision. Records that satisfy compliance requirements and help operators reason about what happened.", { path: "/ai-agent-audit-logs" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Audit Logs | MUTX",
    description:
      "Complete trace history for every agent decision. Records that satisfy compliance requirements and help operators reason about what happened.",
    images: [getPageOgImageUrl("AI Agent Audit Logs — Trace History, Compliance Records, Operator Accountability | MUTX", "Complete trace history for every agent decision. Records that satisfy compliance requirements and help operators reason about what happened.", { path: "/ai-agent-audit-logs" })],
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
      name: "AI Agent Audit Logs | MUTX",
      url: getCanonicalUrl("/ai-agent-audit-logs"),
      description:
        "Complete trace history for every agent decision. Records that satisfy compliance requirements and help operators reason about what happened.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Decision records",
    body: "Every agent decision — what it tried to do, what tool it called, what it read or wrote, what the outcome was — recorded as a durable trace with enough context to reconstruct what happened without asking the agent to explain itself.",
  },
  {
    title: "Policy evaluation traces",
    body: "When a governance policy is evaluated, that evaluation is in the log — not just whether it passed, but what policy version was active, what the input was, and what the decision was.",
  },
  {
    title: "Operator accountability",
    body: "Who configured an agent, who approved a deployment, who reviewed and overrode a guardrail decision — all in the audit log, attached to the trace they affected.",
  },
  {
    title: "Compliance export",
    body: "Audit logs structured for compliance review — filterable by policy, operator, time range, and outcome. Export what compliance teams need to see without giving them access to the full operational surface.",
  },
];

export default function AIAgentAuditLogsPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Audit Logs</p>
                  <h1 className={feat.heroTitle}>
                    A record of what
                    <br />
                    your agents did.
                  </h1>
                  <p className={feat.heroSupport}>
                    When compliance asks what the agent decided and why, vague
                    chat logs and &ldquo;it ran successfully&rdquo; messages
                    won&rsquo;t cut it. MUTX keeps a complete trace history — so
                    you can answer that question definitively, with the full
                    execution context, not just a summary.
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
                <p className={feat.sectionEyebrow}>Audit log properties</p>
                <h2 className={feat.sectionTitle}>
                  Logs built for answers,
                  <br />
                  not just retention.
                </h2>
                <p className={feat.sectionBody}>
                  Most audit logs are written for compliance retention
                  requirements — not for actual operator use. MUTX audit logs
                  are structured for investigation: every record has enough
                  context to reconstruct what happened and understand why, not
                  just that something occurred.
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
                  Everything feeds
                  <br />
                  the audit log.
                </h2>
                <p className={feat.sectionBody}>
                  Audit logs aren&rsquo;t a separate system in MUTX — they&rsquo;re
                  where everything that happens in the control plane ends up.
                  Governance evaluations, approval decisions, deployment records,
                  and monitoring traces all attach to the audit log — so a
                  single record gives you the full picture.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Policy evaluations are in the audit log — not just whether
                    a policy passed or failed, but the full evaluation trace
                    with the policy version and input context.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces feed the audit log. Every tool call, every outcome,
                    every error — in a record that satisfies compliance
                    requirements and helps operators reason about incidents.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-approvals">Approvals</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Approval decisions — who approved, what they approved, the
                    full context — are in the audit log. The complete chain from
                    request to approval to outcome.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-guardrails">Guardrails</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrail violations are first-class audit events. You see
                    the policy that was violated, the operation that was
                    attempted, and the context — not just an error code.
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
                  Answer the question
                  <br />
                  before compliance asks it.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and run an agent. Open the audit log and
                  see the complete record — every decision, every policy
                  evaluation, every operator action — structured for compliance
                  review and operator investigation alike.
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
