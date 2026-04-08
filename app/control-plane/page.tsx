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

const pageTitle = "Control Plane for AI Agents | MUTX";
const pageDescription =
  "MUTX is an open control plane for AI agents. Govern production runtimes, enforce auth boundaries, keep traces visible, and build operator workflows that feel like software you can actually ship.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/control-plane"),
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
      url: getCanonicalUrl("/control-plane"),
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
      url: getCanonicalUrl("/control-plane"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "What is a Control Plane for AI Agents?",
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
      name: "AI Agent Control Plane",
      description:
        "An open control plane for production AI agent runtimes, traces, auth boundaries, and operator workflows.",
    },
  ],
};

const controlPlanePoints = [
  {
    title: "Runtime visibility",
    body: "See what your agents actually did. Traces, tool calls, context windows, and outcomes — in a surface your whole team can read.",
  },
  {
    title: "Auth boundaries",
    body: "Define what agents can access and who can operate them. The control plane enforces boundaries across every connected runtime.",
  },
  {
    title: "Operator workflows",
    body: "Build release paths and operator surfaces once. Use them across every agent you deploy — without rebuilding from scratch each time.",
  },
  {
    title: "Sharing with receipts",
    body: "When agents move between teams, the full trace history, tool definitions, and permissions come with them. No silent knowledge loss.",
  },
];

export default function ControlPlanePage() {
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
                <p className={home.heroEyebrow}>Control Plane</p>
                <h1 className={home.heroTitle}>
                  Open control for
                  <br />
                  deployed agents.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is a production control plane that keeps runtimes
                  legible, auth boundaries enforced, and operator workflows
                  consistent — so what you ship actually works.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See the Product
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>What you get</p>
                <h2 className={home.sectionTitle}>
                  A control plane that acts like software.
                </h2>
                <p className={home.sectionBody}>
                  Most agent platforms give you a prompt box and wish you luck.
                  MUTX gives you a runtime surface, a governance layer, and a
                  release path — the same surfaces your team will actually use.
                </p>
              </div>
              <div className={home.proofGrid}>
                {controlPlanePoints.map((point) => (
                  <div key={point.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{point.title}</h3>
                    <p className={home.sectionBody}>{point.body}</p>
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
                    Source-available control.
                    <br />
                    Production-grade runtime.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app and start with the product surface
                    today. Keep docs, notes, and source aligned — without
                    rebuilding your workflow to match the tool.
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
