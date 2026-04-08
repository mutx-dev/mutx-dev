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

const pageTitle = "AI Agent Guardrails — Policy Enforcement, Safety Bounds, and Runtime Controls | MUTX";
const pageDescription =
  "Enforce safety policies and operational boundaries across your AI agent fleet. MUTX is an open control plane that lets you define guardrails, audit policy violations, and keep agents operating within defined bounds.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/ai-agent-guardrails"),
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
      url: getCanonicalUrl("/ai-agent-guardrails"),
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
      url: getCanonicalUrl("/ai-agent-guardrails"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "AI Agent Guardrails: Policy Enforcement, Safety Bounds, and Runtime Controls",
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
      name: "AI Agent Guardrails",
      description:
        "Runtime safety controls for AI agents that enforce policies, define operational boundaries, and prevent agents from operating outside defined safety parameters.",
    },
  ],
};

const guardrailFeatures = [
  {
    title: "Policy-defined boundaries",
    body: "Define what agents can and cannot do — per environment, per agent type, or per operator. Policies are enforced at runtime, not encoded in prompts.",
  },
  {
    title: "Violation detection and alerting",
    body: "When an agent approaches a policy boundary, MUTX detects it and alerts the relevant operator. No silent policy violations — your team knows before it becomes a problem.",
  },
  {
    title: "Safety bounds per runtime",
    body: "Every connected agent runtime gets its own safety configuration. Bounds are defined once, enforced consistently, and visible to anyone who needs to audit them.",
  },
  {
    title: "Override workflows",
    body: "When an agent needs to operate outside normal bounds, there&apos;s a defined path: request override, get approval, log the exception. Nothing happens silently.",
  },
];

export default function AIAgentGuardrailsPage() {
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
                <p className={home.heroEyebrow}>AI Agent Guardrails</p>
                <h1 className={home.heroTitle}>
                  Agents that stay
                  <br />
                  inside the lines.
                </h1>
                <p className={home.heroSupport}>
                  MUTX is an open control plane that defines safety policies for
                  AI agents — and enforces them at runtime so your team doesn&apos;t
                  have to watch every decision manually.
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
                <p className={home.sectionEyebrow}>Why guardrails matter</p>
                <h2 className={home.sectionTitle}>
                  Prompt instructions
                  <br />
                  aren&apos;t enough.
                </h2>
                <p className={home.sectionBody}>
                  Telling an agent what not to do in a prompt isn&apos;t a safety
                  boundary — it&apos;s a suggestion. MUTX enforces actual policy
                  controls that agents cannot bypass. Combine guardrails with{" "}
                  <Link href="/ai-agent-audit-logs">audit logs</Link> to see
                  exactly when policies were tested, and{" "}
                  <Link href="/ai-agent-approvals">approval workflows</Link> for
                  cases where override is needed. Guardrails are the enforcement
                  layer that makes policy real.
                </p>
              </div>
              <div className={home.proofGrid}>
                {guardrailFeatures.map((feature) => (
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
                    Safety policies that
                    <br />
                    travel with your agents.
                  </h2>
                  <p className={home.sectionBody}>
                    Define bounds once, enforce everywhere. MUTX keeps agent
                    safety policies consistent across every runtime — so what
                    you define in development actually holds in production.
                    Works alongside your existing{" "}
                    <Link href="/ai-agent-infrastructure">agent infrastructure</Link>{" "}
                    and pairs with{" "}
                    <Link href="/ai-agent-reliability">reliability tooling</Link>{" "}
                    for complete runtime visibility.
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