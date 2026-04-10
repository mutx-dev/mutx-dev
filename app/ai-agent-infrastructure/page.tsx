import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getOgImageUrl,
  getPageOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Infrastructure — Runtime Management, Compute, Secrets, Scale | MUTX",
  description:
    "Agent infrastructure that doesn't hide from you. MUTX gives you a consistent surface for compute, secrets, and storage — so your team can own what runs.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-infrastructure") },
  openGraph: {
    title: "AI Agent Infrastructure — Runtime Management, Compute, Secrets, Scale | MUTX",
    description:
      "Agent infrastructure that doesn't hide from you. Compute, secrets, and storage — consistent and legible.",
    url: getSiteUrl(),
    images: [getPageOgImageUrl("AI Agent Infrastructure — Runtime Management, Compute, Secrets, Scale | MUTX", "Agent infrastructure that doesn't hide from you. Compute, secrets, and storage — consistent and legible.", { path: "/ai-agent-infrastructure" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Infrastructure | MUTX",
    description:
      "Agent infrastructure that doesn't hide from you. Compute, secrets, and storage — consistent and legible.",
    images: [getPageOgImageUrl("AI Agent Infrastructure — Runtime Management, Compute, Secrets, Scale | MUTX", "Agent infrastructure that doesn't hide from you. Compute, secrets, and storage — consistent and legible.", { path: "/ai-agent-infrastructure" })],
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
      sameAs: [`https://x.com/${DEFAULT_X_HANDLE.replace("@", "")}`],
    },
    {
      "@type": "SoftwareApplication",
      name: "MUTX",
      applicationCategory: "DeveloperApplication",
      description:
        "Source-available control plane for AI agent governance, deployment, and observability.",
      downloadUrl: `${getSiteUrl()}/download`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "WebPage",
      name: "AI Agent Infrastructure | MUTX",
      url: getCanonicalUrl("/ai-agent-infrastructure"),
      description:
        "Agent infrastructure that doesn't hide from you. Compute, secrets, and storage — consistent and legible.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Compute management",
    body: "Where agents run is part of the control plane record. MUTX surfaces compute allocation, scheduling, and scaling as explicit properties — not hidden behind a hosting provider&rsquo;s console.",
  },
  {
    title: "Secrets management",
    body: "API keys, credentials, and secrets are managed through the control plane — not scattered across environment files, .env.local, and a notes app on someone&rsquo;s laptop.",
  },
  {
    title: "Storage layer",
    body: "What the agent reads and writes, where it writes state, and how long that state persists — all explicit in the control plane. No state that lives outside the system&rsquo;s awareness.",
  },
  {
    title: "Network topology",
    body: "Which services the agent can reach, which endpoints it&rsquo;s allowed to call, and how outbound traffic is routed — defined and enforced through the control plane, not assumed by convention.",
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
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Infrastructure</p>
                  <h1 className={feat.heroTitle}>
                    Infrastructure that
                    <br />
                    doesn&rsquo;t hide.
                  </h1>
                  <p className={feat.heroSupport}>
                    Agent infrastructure shouldn&rsquo;t be a collection of
                    one-off scripts, undocumented assumptions, and secrets nobody
                    remembers adding. MUTX makes compute, storage, and secrets
                    legible — so your team can actually own what runs in
                    production.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="/ai-agent-control-plane"
                      className={core.buttonGhost}
                    >
                      Control Plane
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Infrastructure properties</p>
                <h2 className={feat.sectionTitle}>
                  Own the stack
                  <br />
                  your agents run on.
                </h2>
                <p className={feat.sectionBody}>
                  Most agent infrastructure is implicit — it lives in someone&rsquo;s
                  head, a shared doc that hasn&rsquo;t been updated, or a hosting
                  console that doesn&rsquo;t connect to the agent definition.
                  MUTX makes infrastructure explicit and versioned, so it&rsquo;s
                  auditable and recoverable.
                </p>
              </div>
              <div className={feat.featureGrid}>
                {featureCards.map((card) => (
                  <div key={card.title} className={feat.featureCard}>
                    <h3 className={feat.featureCardTitle}>{card.title}</h3>
                    <p className={feat.featureCardBody}>{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Connected surfaces</p>
                <h2 className={feat.sectionTitle}>
                  Infrastructure is where
                  <br />
                  everything runs.
                </h2>
                <p className={feat.sectionBody}>
                  When infrastructure is part of the control plane, it connects
                  cleanly to governance, deployment, and observability. Secrets
                  attach to agent records. Network policies enforce at the
                  infrastructure layer. Compute allocation is visible in
                  cost attribution.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Network topology and secrets are part of the governance
                    surface. What the agent can access is determined by the
                    infrastructure config, which is governed by the control
                    plane — not left to convention.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Compute and storage config travel with the deployment
                    record. When you promote an agent to production, the
                    infrastructure config promotes with it — no manual
                    reconciliation.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Compute allocation is visible in cost attribution. When
                    you see a cost spike, you see which compute resources
                    were running — not just which API calls were made.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-guardrails">Guardrails</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Safety boundaries and network policies can be enforced at
                    the infrastructure layer. Guardrail violations that relate
                    to network access are visible with infrastructure context.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.finalSection}>
            <div className={core.shell}>
              <div className={feat.finalInner}>
                <p className={feat.finalEyebrow}>Get started</p>
                <h2 className={feat.finalTitle}>
                  Own the infrastructure
                  <br />
                  your agents run on.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and open the infrastructure surface.
                  See where your agents run, what secrets they can access, and
                  what the network topology looks like when it&rsquo;s defined and
                  legible — not assumed.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <a
                    href="https://github.com/mutx-dev/mutx-dev"
                    className={feat.secondaryAction}
                  >
                    View on GitHub
                  </a>
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
