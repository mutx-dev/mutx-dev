import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import home from "@/components/site/marketing/MarketingHome.module.css";

const pageTitle = "AI Agent Approvals — Human-in-the-Loop Workflows and Operator Authorization | MUTX";
const pageDescription =
  "Add human oversight to your AI agent operations. MUTX is an open control plane that lets you define approval workflows, track authorization decisions, and keep human operators in the loop when it matters.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-approvals"),
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
      url: getCanonicalUrl("/ai-agent-approvals"),
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
      url: getCanonicalUrl("/ai-agent-approvals"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Approvals: Human-in-the-Loop Workflows and Operator Authorization",
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
      name: "AI Agent Approvals",
      description:
        "Human oversight workflows for AI agents that require operator authorization before sensitive actions, ensuring human-in-the-loop control at critical decision points.",
    },
  ],
};

const approvalFeatures = [
  {
    title: "Configurable approval gates",
    body: "Define where agents need human authorization — per action type, per environment, or per sensitivity level. Approval requirements travel with the agent configuration.",
  },
  {
    title: "Structured request workflows",
    body: "When an agent hits an approval gate, the operator gets a clear request: what is being requested, what context is available, and what happens if they approve or deny.",
  },
  {
    title: "Authorization tracking",
    body: "Every approval decision gets recorded — who approved, when, and why. The audit trail is complete and searchable, even across complex multi-step workflows.",
  },
  {
    title: "Delegation and escalation paths",
    body: "Define who can approve what, and what happens when the designated approver is unavailable. Delegation paths are explicit — no silent bypass of human oversight.",
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
          <section className={home.heroSection}>
            <div className={home.heroShell}>
              <div className={home.heroColumn}>
                <p className={home.heroEyebrow}>AI Agent Approvals</p>
                <h1 className={home.heroTitle}>
                  Human oversight
                  <br />
                  where it counts.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is an open control plane that adds structured approval
                  workflows to your AI agents — so sensitive operations always
                  have a human in the loop.
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
                <p className={home.sectionEyebrow}>Why approvals matter</p>
                <h2 className={home.sectionTitle}>
                  Agents make decisions
                  <br />
                  that need human review.
                </h2>
                <p className={home.sectionBody}>
                  Not every agent decision should be automatic. For sensitive
                  operations, MUTX gives you structured approval workflows that
                  require explicit operator authorization. Pair with{" "}
                  <Link href="/ai-agent-guardrails">guardrails</Link> to define
                  where approval gates are needed, and{" "}
                  <Link href="/ai-agent-audit-logs">audit logs</Link> to keep a
                  complete record of every authorization decision. Approvals
                  are the human-in-the-loop layer that makes agent operations
                  auditable and accountable.
                </p>
              </div>
              <div className={home.proofGrid}>
                {approvalFeatures.map((feature) => (
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
                    Authorization that
                    <br />
                    scales with your agents.
                  </h2>
                  <p className={home.sectionBody}>
                    Define approval requirements once, apply them across every
                    agent runtime. MUTX keeps authorization workflows consistent
                    and auditable — so your team can trust agent operations without
                    micromanaging every decision. Built on the same control plane
                    that powers{" "}
                    <Link href="/ai-agent-infrastructure">agent infrastructure</Link>{" "}
                    and{" "}
                    <Link href="/ai-agent-reliability">reliability tooling</Link>.
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