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

const pageTitle = "AI Agent Infrastructure — Runtime Management, Deployment, and Operational Scale | MUTX";
const pageDescription =
  "Manage AI agent infrastructure at scale. MUTX is an open control plane that gives operators a consistent surface for deploying, monitoring, and governing agent runtimes across any environment.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-infrastructure"),
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
      url: getCanonicalUrl("/ai-agent-infrastructure"),
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
      url: getCanonicalUrl("/ai-agent-infrastructure"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Infrastructure: Runtime Management, Deployment, and Operational Scale",
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
      name: "AI Agent Infrastructure",
      description:
        "Production infrastructure management for AI agents, covering runtime deployment, operational scaling, governance surfaces, and cross-environment consistency.",
    },
  ],
};

const infraFeatures = [
  {
    title: "Runtime connection management",
    body: "Connect agent runtimes from any environment — cloud, on-prem, or local. MUTX provides a consistent management surface across every runtime you have deployed.",
  },
  {
    title: "Deployment consistency",
    body: "Define agent configurations once and deploy them consistently. What works in staging works in production — because the same control surface is used in both.",
  },
  {
    title: "Operator surfaces that scale",
    body: "Build operator workflows once and use them across every agent. No per-agent custom tooling, no tribal knowledge — just consistent surfaces your whole team can use.",
  },
  {
    title: "Multi-environment governance",
    body: "Manage agents across dev, staging, and production with governance policies that apply consistently. Your team sees the same surface, with the controls they need for each environment.",
  },
];

export default function AIAgentInfrastructurePage() {
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
                <p className={home.heroEyebrow}>AI Agent Infrastructure</p>
                <h1 className={home.heroTitle}>
                  One surface for
                  <br />
                  every agent runtime.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is an open control plane that gives your team a
                  consistent management surface for AI agents — across every
                  environment and every runtime you have deployed.
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
                <p className={home.sectionEyebrow}>Why infrastructure matters</p>
                <h2 className={home.sectionTitle}>
                  Agent runtimes multiply
                  <br />
                  faster than your team.
                </h2>
                <p className={home.sectionBody}>
                  As agent deployments grow, managing them becomes a problem.
                  MUTX gives your team a single control surface that works
                  across every runtime. Pair with{" "}
                  <Link href="/ai-agent-reliability">reliability tooling</Link>{" "}
                  for observability,{" "}
                  <Link href="/ai-agent-guardrails">guardrails</Link> for safety
                  enforcement, and{" "}
                  <Link href="/ai-agent-approvals">approval workflows</Link> for
                  human oversight. The infrastructure layer is what makes all
                  of those controls consistent and scalable.
                </p>
              </div>
              <div className={home.proofGrid}>
                {infraFeatures.map((feature) => (
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
                    Infrastructure that
                    <br />
                    grows with your agent fleet.
                  </h2>
                  <p className={home.sectionBody}>
                    Add MUTX to your existing agent infrastructure and get
                    immediate management consistency across every runtime. The
                    control plane works alongside your current tooling — it
                    doesn&apos;t replace it. For teams managing multiple agents at
                    scale, it&apos;s the surface that keeps operations manageable.
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