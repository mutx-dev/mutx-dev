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

const pageTitle = "AI Agent Deployment | MUTX";
const pageDescription =
  "Deploy AI agents with confidence. MUTX provides repeatable runtime environments, configuration management, and deployment workflows that keep your agents consistent from staging to production.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-deployment"),
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
      url: getCanonicalUrl("/ai-agent-deployment"),
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
      url: getCanonicalUrl("/ai-agent-deployment"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Deployment Best Practices",
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

const deploymentPoints = [
  {
    title: "Repeatable environments",
    body: "Define runtime environments once. Deploy the same configuration to staging, pre-production, and production without surprises.",
  },
  {
    title: "Configuration management",
    body: "Tool definitions, model preferences, context limits, and auth scopes — all versioned alongside your agent code.",
  },
  {
    title: "Zero-downtime updates",
    body: "Push agent updates without dropping in-flight requests. The control plane manages the transition cleanly.",
  },
  {
    title: "Multi-provider support",
    body: "Deploy across OpenAI, Anthropic, local models, or any compatible API. Runtime abstraction means you're not locked in.",
  },
];

export default function AIAgentDeploymentPage() {
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
                <p className={home.heroEyebrow}>AI Agent Deployment</p>
                <h1 className={home.heroTitle}>
                  Ship agents that
                  <br />
                  behave consistently.
                </h1>
                <p className={home.heroSupport}>
                  Deployment shouldn't be an act of faith. MUTX gives you
                  runtime environments, configuration management, and deployment
                  workflows that keep your agents consistent from staging to
                  production.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-monitoring" className={core.buttonGhost}>
                    See Monitoring
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>Deployment fundamentals</p>
                <h2 className={home.sectionTitle}>
                  Environments you can reason about.
                </h2>
                <p className={home.sectionBody}>
                  When deployment is just a prompt box, you have no idea what
                  will actually run. MUTX treats agent configuration as code —
                  versioned, reviewable, and deployable through your existing
                  workflow.
                </p>
              </div>
              <div className={home.proofGrid}>
                {deploymentPoints.map((point) => (
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
                  Deployment is better with MUTX.
                </h2>
                <p className={home.sectionBody}>
                  MUTX doesn't replace your deployment pipeline — it sits
                  above it as the control layer that makes sure what you deploy
                  is what you intended.
                </p>
              </div>
              <div className={home.proofGrid}>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    The foundation. Runtime surfaces, auth boundaries, and operator workflows that keep everything consistent.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Know immediately when a deployment causes issues. Full traces and alerting after every ship.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Auth scopes and access controls travel with the deployment. No drift between environments.
                  </p>
                </div>
                <div className={home.proofCard}>
                  <h3 className={home.proofCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={home.sectionBody}>
                    Set spending limits per environment. Know exactly what each deployment costs before it goes live.
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
                    Deploy with confidence.
                    <br />
                    Ship with MUTX.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and define your first agent runtime
                    environment. Deploy through MUTX or integrate with your
                    existing CI/CD pipeline.
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
