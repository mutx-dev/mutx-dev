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

const pageTitle = "AI Agent Governance | MUTX";
const pageDescription =
  "Govern AI agent behavior in production. MUTX provides auth boundaries, access controls, and compliance guardrails that travel with your agents across every runtime.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-governance"),
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
      url: getCanonicalUrl("/ai-agent-governance"),
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
      url: getCanonicalUrl("/ai-agent-governance"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Governance and Access Control",
      description: pageDescription,
      author: {
        "@type": "Organization",
        name: "MUTX",
      },
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
  ],
};

const governancePoints = [
  {
    title: "Auth boundaries",
    body: "Define what each agent can access — APIs, data sources, tools, and operations. The control plane enforces these boundaries consistently across every runtime.",
  },
  {
    title: "Operator access control",
    body: "Control who can operate, configure, or observe each agent. Role-based access that travels with the agent, not locked to a deployment environment.",
  },
  {
    title: "Compliance guardrails",
    body: "Data handling policies, audit trails, and access logs that satisfy compliance requirements without slowing down agent development.",
  },
  {
    title: "Policy-as-code",
    body: "Governance policies defined in code, versioned alongside agent definitions, and enforced by the control plane — not by convention.",
  },
];

export default function AIAgentGovernancePage() {
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
                <p className={home.heroEyebrow}>AI Agent Governance</p>
                <h1 className={home.heroTitle}>
                  Control who can do what,
                  <br />
                  everywhere your agents run.
                </h1>
                <p className={home.heroSupport}>
                  Agents without governance are a liability. MUTX gives you
                  auth boundaries, operator access controls, and compliance
                  guardrails that move with your agents — not stuck to a
                  single deployment environment.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-cost" className={core.buttonGhost}>
                    Explore Cost Management
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>Governance fundamentals</p>
                <h2 className={home.sectionTitle}>
                  Governance that travels with your agents.
                </h2>
                <p className={home.sectionBody}>
                  Most platforms enforce governance per-deployment, which means
                  policies drift when agents move between environments or teams.
                  MUTX governance is embedded in the control plane — it travels
                  with the agent everywhere it goes.
                </p>
              </div>
              <div className={home.proofGrid}>
                {governancePoints.map((point) => (
                  <div key={point.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{point.title}</h3>
                    <p className={home.sectionBody}>{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>The control plane advantage</p>
                <h2 className={home.sectionTitle}>
                  Governance built into every layer.
                </h2>
                <p className={home.sectionBody}>
                  MUTX governance isn't a separate product you bolt on — it's
                  woven into the control plane from deployment through
                  monitoring. Every action an agent takes is evaluated against
                  your policies automatically.
                </p>
              </div>
              <div className={home.proofGrid}>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    The foundation. Auth boundaries and operator access controls are enforced by the control plane runtime.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Governance policies are versioned with deployment configs. No drift between what you intend and what runs.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Auth failures and policy violations are first-class monitoring events with full audit trails.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Spending limits and rate limits are governance controls. Enforce them through the same policy layer.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Get started</p>
                  <h2 className={home.sectionTitle}>
                    Governance that ships with your agents.
                    <br />
                    Built on MUTX.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and define your first governance
                    policy. Apply it to one agent or your entire fleet — the
                    control plane enforces it everywhere.
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
