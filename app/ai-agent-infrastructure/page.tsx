import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  buildPageMetadata,
  getCanonicalUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Infrastructure — Compute, Secrets, Storage, Network | MUTX",
  description:
    "Stop guessing where your agents run. MUTX surfaces compute, secrets, and storage as explicit control plane properties — auditable, versioned, and visible.",
  ...buildPageMetadata({
    title: "AI Agent Infrastructure — Compute, Secrets, Storage, Network | MUTX",
    description:
      "Stop guessing where your agents run. MUTX surfaces compute, secrets, and storage as explicit control plane properties — auditable, versioned, and visible.",
    path: "/ai-agent-infrastructure",
    socialDescription:
      "Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.",
    twitterTitle: "AI Agent Infrastructure | MUTX",
    twitterDescription:
      "Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.",
  }),
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
        "Stop guessing where your agents run. Compute, secrets, and storage as explicit control plane properties.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Compute management",
    body: "Where agents run is part of the control plane record. Compute allocation, scheduling, and scaling are surfaced as explicit properties — not buried in a hosting provider&rsquo;s console you check after something breaks.",
  },
  {
    title: "Secrets management",
    body: "API keys and credentials live in the control plane — not scattered across .env files, CI variables, and someone&rsquo;s notes app. Rotated, versioned, and attached to the agents that use them.",
  },
  {
    title: "Storage layer",
    body: "What the agent reads, what it writes, and how long that state persists — all explicit. No orphaned state blobs living outside the system&rsquo;s awareness.",
  },
  {
    title: "Network topology",
    body: "Which services the agent can reach, which endpoints it&rsquo;s allowed to call, and how traffic routes out — defined in the control plane, not discovered during an incident.",
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
                    Infrastructure you
                    <br />
                    can actually see.
                  </h1>
                  <p className={feat.heroSupport}>
                    Your agent infrastructure shouldn&rsquo;t be a pile of
                    one-off scripts, stale docs, and secrets nobody remembers
                    provisioning. MUTX makes compute, storage, and secrets
                    legible and versioned — so you own what runs in production,
                    not just hope it works.
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
                  Know what&rsquo;s running.
                  <br />
                  Own why.
                </h2>
                <p className={feat.sectionBody}>
                  Most agent infra is implicit — a shared doc that hasn&rsquo;t
                  been updated since Q1, a hosting console disconnected from the
                  agent definition, and a tribal knowledge base that walks out
                  the door with your senior engineer. MUTX makes infrastructure
                  explicit, versioned, and auditable.
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
                  Infra isn&rsquo;t a side quest.
                  <br />
                  It&rsquo;s the foundation.
                </h2>
                <p className={feat.sectionBody}>
                  When infrastructure lives in the control plane, it connects to
                  governance, deployment, and cost — no manual reconciliation.
                  Secrets attach to agent records. Network policies enforce at
                  the infra layer. Compute spend shows up in cost attribution.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Network topology and secrets are governance surface. What
                    the agent can access is determined by infra config, governed
                    by the control plane — not left to convention and good
                    intentions.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Compute and storage config travel with the deployment
                    record. Promote an agent to production and the infra
                    config goes with it — no copy-paste, no manual sync.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Compute allocation maps directly to cost attribution. A
                    spend spike shows you which compute resources were running —
                    not just a pile of API call records.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-guardrails">Guardrails</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Safety boundaries and network policies enforced at the
                    infra layer. Guardrail violations related to network access
                    show up with full infrastructure context — not in a
                    separate dashboard you never check.
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
                  See your infra.
                  <br />
                  All of it.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and open the infrastructure surface.
                  See where agents run, what secrets they hold, and what your
                  network topology actually looks like when it&rsquo;s defined
                  instead of assumed.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/docs/architecture/overview" className={feat.secondaryAction}>
                    Architecture overview
                  </Link>
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
