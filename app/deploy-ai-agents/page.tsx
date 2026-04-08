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

const pageTitle = "Deploy AI Agents | MUTX";
const pageDescription =
  "Deploy AI agents with a production runtime that keeps runs, traces, and tool calls visible. Move from local proof to governed deployment without rebuilding your workflow.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/deploy-ai-agents"),
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
      url: getCanonicalUrl("/deploy-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/deploy-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "How to Deploy AI Agents to Production",
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

const features = [
  {
    title: "Runtime surfaces, not prompt soup",
    body: "Every agent run produces a trace you can inspect. See which tools fired, what changed, and where things went sideways — without digging through logs you did not plan to keep.",
  },
  {
    title: "Auth boundaries at the control layer",
    body: "Set access policies, operator permissions, and sharing rules once. The control plane enforces them across every runtime you connect.",
  },
  {
    title: "Deploy without stitching one-off tools",
    body: "Move from local proof to a governed runtime through the same product surface. No new CLI to learn, no script pipeline to maintain.",
  },
  {
    title: "Share agents with receipts",
    body: "When an agent ships, the trace ships with it. Teams inheriting a workflow get the context they need to operate it safely.",
  },
];

export default function DeployAIAgentsPage() {
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
                <p className={home.heroEyebrow}>Deployment</p>
                <h1 className={home.heroTitle}>
                  Deploy AI agents.
                  <br />
                  Keep them legible.
                </h1>
                <p className={home.heroSupport}>
                  A production runtime that keeps runs, traces, and tool calls
                  visible — so your team can operate what you ship.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    View Runtime
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofGrid}>
                {features.map((feature) => (
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
                  <p className={home.sectionEyebrow}>Get started</p>
                  <h2 className={home.sectionTitle}>
                    Ship the agent. Keep the trace.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, connect your first runtime, and see
                    what the agent actually did — instead of guessing.
                  </p>
                  <div className={home.finalActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="https://docs.mutx.dev"
                      className={home.secondaryAction}
                    >
                      Read the docs
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
