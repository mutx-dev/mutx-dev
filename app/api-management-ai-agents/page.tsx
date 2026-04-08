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

const pageTitle = "API Management for AI Agents | MUTX";
const pageDescription =
  "Manage AI agent API keys, rate limits, and access controls from a single control plane. Define per-agent permissions, track API usage, and enforce boundaries without scattered configuration.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/api-management-ai-agents"),
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
      url: getCanonicalUrl("/api-management-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/api-management-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Managing API Access for AI Agents",
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

const apiManagementPoints = [
  {
    title: "Per-agent API keys",
    body: "Give each agent its own identity and key. Rotate without touching other agents. Revoke when an agent retires or moves to a different team.",
  },
  {
    title: "Rate limits that enforce",
    body: "Set per-agent or per-tool rate limits at the control plane level. When limits are hit, the control plane throttles — not the provider.",
  },
  {
    title: "Usage tracking per agent",
    body: "See API calls, token counts, and error rates per agent. Surface this in the traces your team already reads, not in a separate billing dashboard.",
  },
  {
    title: "Permissions that travel",
    body: "Define what an agent can call once, and the control plane enforces it everywhere. Share the agent; the permissions come with it.",
  },
];

export default function APIManagementAIAgentsPage() {
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
                <p className={home.heroEyebrow}>API Management</p>
                <h1 className={home.heroTitle}>
                  Control what your agents
                  <br />
                  can call.
                </h1>
                <p className={home.heroSupport}>
                  Per-agent keys, rate limits, and access controls — managed from
                  the control plane so permissions are explicit and enforced,
                  not implied.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See API Controls
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
                  One place to manage
                  <br />
                  every agent&apos;s API surface.
                </h2>
                <p className={home.sectionBody}>
                  API keys scattered across agents, rate limits enforced by
                  providers, permissions that exist only in documentation — that
                  is not a control plane. MUTX gives you centralized API
                  management that enforces.
                </p>
              </div>
              <div className={home.proofGrid}>
                {apiManagementPoints.map((point) => (
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
                  <p className={home.sectionEyebrow}>Centralized control</p>
                  <h2 className={home.sectionTitle}>
                    Define the key.
                    <br />
                    Set the limit.
                    <br />
                    Enforce everywhere.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, create your first agent identity, and
                    see how the control plane keeps API access consistent across
                    every runtime you connect.
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
