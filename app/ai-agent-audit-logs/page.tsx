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
  title: "AI Agent Audit Logs — Decision Records, Policy Traces, Compliance Exports | MUTX",
  description:
    "Complete trace history for every agent decision. MUTX records actions, policy evaluations, and operator overrides — so you can answer what happened and why, with the full execution context.",
  ...buildPageMetadata({
    title: "AI Agent Audit Logs — Decision Records, Policy Traces, Compliance Exports | MUTX",
    description:
      "Complete trace history for every agent decision. MUTX records actions, policy evaluations, and operator overrides — so you can answer what happened and why, with the full execution context.",
    path: "/ai-agent-audit-logs",
    socialDescription:
      "Complete trace history for every agent decision. Records built for compliance and operator investigation.",
    twitterTitle: "AI Agent Audit Logs | MUTX",
    twitterDescription:
      "Complete trace history for every agent decision. Records built for compliance and operator investigation.",
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
      name: "AI Agent Audit Logs | MUTX",
      url: getCanonicalUrl("/ai-agent-audit-logs"),
      description:
        "Complete trace history for every agent decision. Records built for compliance and operator investigation.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Decision records",
    body: "Every agent decision — what it tried, what tool it called, what it read or wrote, what the outcome was — recorded as a durable trace. Enough context to reconstruct what happened without asking the agent to explain itself.",
  },
  {
    title: "Policy evaluation traces",
    body: "When a governance policy is evaluated, that evaluation is in the log: which policy version was active, what the input was, what the decision was. Not just pass/fail.",
  },
  {
    title: "Operator accountability",
    body: "Who configured an agent, who approved a deployment, who overrode a guardrail — all in the audit log, attached to the trace they affected.",
  },
  {
    title: "Compliance export",
    body: "Audit logs structured for compliance review. Filter by policy, operator, time range, or outcome. Export what compliance needs without giving them access to the full operational surface.",
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
                    your agents decided.
                  </h1>
                  <p className={feat.heroSupport}>
                    When compliance asks what the agent decided and why, vague
                    chat logs and &ldquo;it ran successfully&rdquo; messages
                    won&apos;t cut it. MUTX keeps a complete trace history with
                    full execution context — so you can answer that question
                    definitively, not with a summary.
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
                  Most audit logs are written for compliance retention — not for
                  anyone to actually read. MUTX audit logs are structured for
                  investigation: every record has enough context to reconstruct
                  what happened and understand why.
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
                  Audit logs aren&apos;t a separate system in MUTX — they&apos;re
                  where everything in the control plane ends up. Governance
                  evaluations, approval decisions, deployment records, and
                  monitoring traces all attach to one record. The full picture in
                  one place.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Policy evaluations are in the audit log — not just pass or
                    fail, but the full evaluation trace with policy version and
                    input context.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces feed the audit log. Every tool call, outcome, and
                    error — in a record that satisfies compliance and helps
                    operators reason about incidents.
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
                    the policy violated, the operation attempted, and the
                    context — not just an error code.
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
                  Download the Mac app. Run an agent. Open the audit log and see
                  every decision, policy evaluation, and operator action —
                  structured for compliance review and operator investigation
                  alike.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-approvals" className={feat.secondaryAction}>
                    Approval workflows
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
