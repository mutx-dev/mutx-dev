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

const pageTitle = "AI Agent Audit Logs — Trace History, Compliance, and Operator Accountability | MUTX";
const pageDescription =
  "Keep a complete trace history of every AI agent decision. MUTX is an open control plane that records agent actions, maintains audit logs, and gives compliance teams the records they need.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-audit-logs"),
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
      url: getCanonicalUrl("/ai-agent-audit-logs"),
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
      url: getCanonicalUrl("/ai-agent-audit-logs"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Audit Logs: Trace History, Compliance, and Accountability",
      description: pageDescription,
      author: {
        "@type": "Organization",
        name: "MUTX",
      },
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
    {
      "@type": "DefinitionPage",
      name: "AI Agent Audit Logs",
      description:
        "Complete audit trails for AI agent runtimes, recording every decision, tool call, and outcome for compliance, debugging, and operator accountability.",
    },
  ],
};

const auditLogFeatures = [
  {
    title: "Complete trace history",
    body: "Every agent decision gets recorded — tool calls, context window usage, and outcomes. No gaps, no silent failures. What happened and why is always reconstructable.",
  },
  {
    title: "Compliance-ready records",
    body: "Export audit logs in formats your compliance team can use. Structured records that satisfy auditors without requiring custom tooling or manual aggregation.",
  },
  {
    title: "Operator attribution",
    body: "Know which operator triggered a given agent run, and which workflow was active. When something needs review, you know exactly who was involved and what they were doing.",
  },
  {
    title: "Retention and access control",
    body: "Define how long records are kept and who can access them. Audit logs stay available for the people who need them, and protected from people who shouldn&apos;t.",
  },
];

export default function AIAgentAuditLogsPage() {
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
                <p className={home.heroEyebrow}>AI Agent Audit Logs</p>
                <h1 className={home.heroTitle}>
                  Every agent decision,
                  <br />
                  recorded and searchable.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is an open control plane that maintains a complete audit
                  trail for your AI agents — so compliance teams, operators, and
                  auditors can always see what happened.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/control-plane" className={core.buttonGhost}>
                    See the Control Plane
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>Why audit logs matter</p>
                <h2 className={home.sectionTitle}>
                  Agents make decisions
                  <br />
                  your team can&apos;t see.
                </h2>
                <p className={home.sectionBody}>
                  Without an audit trail, agent runs are a black box. MUTX
                  changes that — recording every decision as a structured log
                  your team can search, export, and review. Combine with{" "}
                  <Link href="/ai-agent-reliability">reliability tooling</Link>{" "}
                  for full observability, or{" "}
                  <Link href="/ai-agent-guardrails">guardrails</Link> to enforce
                  policies at runtime. The audit log is the record that makes
                  everything else verifiable.
                </p>
              </div>
              <div className={home.proofGrid}>
                {auditLogFeatures.map((feature) => (
                  <div key={feature.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{feature.title}</h3>
                    <p className={home.sectionBody}>{feature.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Open source</p>
                  <h2 className={home.sectionTitle}>
                    Compliance records
                    <br />
                    that travel with the agent.
                  </h2>
                  <p className={home.sectionBody}>
                    When agents move between teams or environments, their audit
                    history moves with them. No silent gaps, no missing records.
                    Your compliance posture stays intact — even as agent
                    runtimes change. Built on the same control plane that powers{" "}
                    <Link href="/ai-agent-approvals">approval workflows</Link>{" "}
                    and{" "}
                    <Link href="/ai-agent-infrastructure">agent infrastructure</Link>.
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