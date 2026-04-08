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

const pageTitle = "Govern AI Agents | MUTX";
const pageDescription =
  "Govern AI agent behavior with explicit policies, audit trails, and operator approval workflows. Make agent governance visible, enforceable, and something your security team can actually audit.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/govern-ai-agents"),
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
      url: getCanonicalUrl("/govern-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/govern-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Governing AI Agent Behavior in Production",
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
    title: "Policies that agents actually follow",
    body: "Write governance policies in the control plane. They are enforced across every connected runtime — not just documented and hoped for.",
  },
  {
    title: "Audit trails that prove compliance",
    body: "Every decision, every boundary crossed, every operator action — logged with trace context your compliance team can actually use.",
  },
  {
    title: "Approval workflows for sensitive operations",
    body: "Define what requires a human in the loop. The control plane holds the operation until approval is given — no bypasses, no workarounds.",
  },
  {
    title: "Governance that travels with the agent",
    body: "When you share an agent, the policies come with it. Teams inheriting your workflow get the governance, not just the code.",
  },
];

export default function GovernAIAgentsPage() {
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
                <p className={home.heroEyebrow}>Governance</p>
                <h1 className={home.heroTitle}>
                  Governance that
                  <br />
                  agents actually follow.
                </h1>
                <p className={home.heroSupport}>
                  Explicit policies, audit trails, and approval workflows —
                  defined in the control plane so your security team can
                  actually audit what agents do, not just what they say they do.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See Governance Model
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
                  Policy as control.
                  <br />
                  Not policy as suggestion.
                </h2>
                <p className={home.sectionBody}>
                  Most agent platforms have governance in their docs. MUTX has
                  governance in the control layer — enforced, logged, and
                  auditable by the people who need to sign off on production AI.
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

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Compliance-ready</p>
                  <h2 className={home.sectionTitle}>
                    Write the policy.
                    <br />
                    Enforce it everywhere.
                    <br />
                    Audit it any time.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, define your first governance policy,
                    and see how the control plane makes agent behavior something
                    you can actually govern.
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
