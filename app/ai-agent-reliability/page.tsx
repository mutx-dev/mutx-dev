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

const pageTitle = "AI Agent Reliability — Traces, Observability, and Production Uptime | MUTX";
const pageDescription =
  "Keep your AI agents reliable in production. MUTX is an open control plane that surfaces traces, enforces reliability standards, and gives operators the visibility they need to ship with confidence.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-reliability"),
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
      url: getCanonicalUrl("/ai-agent-reliability"),
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
      url: getCanonicalUrl("/ai-agent-reliability"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Reliability: Traces, Observability, and Production Uptime",
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
      name: "AI Agent Reliability",
      description:
        "Production-grade reliability for AI agents, including trace visibility, observability standards, and operator workflows that keep agents running reliably at scale.",
    },
  ],
};

const reliabilityPillars = [
  {
    title: "Trace visibility",
    body: "Every tool call, context window decision, and agent outcome gets recorded. When something breaks, you can reconstruct exactly what happened — not guess.",
  },
  {
    title: "Outcome tracking",
    body: "Set success criteria per agent type. MUTX tracks whether outcomes meet those criteria and surfaces patterns that indicate degradation before they become incidents.",
  },
  {
    title: "Runtime health surfaces",
    body: "Operator dashboards show agent health, latency trends, and error rates across your deployed runtimes. Your team sees the same surface — no tribal knowledge required.",
  },
  {
    title: "Failover and recovery",
    body: "When an agent runtime degrades, MUTX gives operators a clear path to recover — with the full trace history preserved so nothing gets lost in translation.",
  },
];

export default function AIAgentReliabilityPage() {
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
                <p className={home.heroEyebrow}>AI Agent Reliability</p>
                <h1 className={home.heroTitle}>
                  Know what your agents
                  <br />
                  are actually doing.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is an open control plane that keeps AI agent runtimes
                  legible — so your team can ship production agents that work,
                  and fix them when they don&apos;t.
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
                <p className={home.sectionEyebrow}>Why reliability matters</p>
                <h2 className={home.sectionTitle}>
                  Agents break in ways
                  <br />
                  your team will notice.
                </h2>
                <p className={home.sectionBody}>
                  When an AI agent runs in production, it makes hundreds of
                  decisions your team can&apos;t see. MUTX surfaces those decisions
                  as traces — so when something goes wrong, you have a record
                  instead of a mystery. Built on the same control plane philosophy
                  behind{" "}
                  <Link href="/ai-agent-audit-logs">audit logs</Link>,{" "}
                  <Link href="/ai-agent-guardrails">guardrails</Link>, and{" "}
                  <Link href="/ai-agent-approvals">approval workflows</Link>.
                </p>
              </div>
              <div className={home.proofGrid}>
                {reliabilityPillars.map((pillar) => (
                  <div key={pillar.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{pillar.title}</h3>
                    <p className={home.sectionBody}>{pillar.body}</p>
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
                    Reliability that scales
                    <br />
                    with your agent fleet.
                  </h2>
                  <p className={home.sectionBody}>
                    Add MUTX to any agent runtime. Get trace visibility,
                    outcome tracking, and operator surfaces — without
                    rebuilding your observability stack from scratch. Works
                    alongside your existing{" "}
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