import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getPageOgImageUrl, getPageTwitterImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Deployment — Repeatable Environments, Deployment Records, Rollback | MUTX",
  description:
    "Agents that deploy like services, not demos. MUTX gives you repeatable runtime environments, deployment records, and rollback paths — so what ships to production is what you reviewed.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-deployment") },
  openGraph: {
    title: "AI Agent Deployment — Repeatable Environments, Deployment Records, Rollback | MUTX",
    description:
      "Agents that deploy like services, not demos. Repeatable environments, deployment records, and rollback paths.",
    url: getCanonicalUrl("/ai-agent-deployment"),
    images: [getPageOgImageUrl("AI Agent Deployment — Repeatable Environments, Deployment Records, Rollback | MUTX", "Agents that deploy like services, not demos. Repeatable environments, deployment records, and rollback paths.", { path: "/ai-agent-deployment" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Deployment | MUTX",
    description:
      "Agents that deploy like services, not demos. Repeatable environments and deployment records built into the control plane.",
    images: [getPageTwitterImageUrl("AI Agent Deployment — Repeatable Environments, Deployment Records, Rollback | MUTX", "Agents that deploy like services, not demos. Repeatable environments, deployment records, and rollback paths.", { path: "/ai-agent-deployment" })],
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
      name: "AI Agent Deployment | MUTX",
      url: getCanonicalUrl("/ai-agent-deployment"),
      description:
        "Agents that deploy like services. Repeatable runtime environments, deployment records, and rollback paths — so what ships is what you reviewed.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Repeatable environments",
    body: "Define a runtime environment once. Deploy the same configuration to staging, pre-production, and production without surprises — because the environment is the artifact, not a script someone wrote two months ago.",
  },
  {
    title: "Deployment records",
    body: "Every deployment is a record. What changed, who deployed it, what runtime config was active. You can reason backward from a production incident instead of forward from a Slack message.",
  },
  {
    title: "Rollback paths",
    body: "When a deployment goes wrong, rolling back should be a defined action, not a heroic improvisation. MUTX keeps the previous deployment state accessible so rollback is explicit, not guessed.",
  },
  {
    title: "Environment parity",
    body: "What runs locally should behave the same in staging and production. MUTX enforces environment parity through the control plane — not through a team&rsquo;s collective memory of what &lsquo;should&rsquo; be the same.",
  },
];

export default function AIAgentDeploymentPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Deployment</p>
                  <h1 className={feat.heroTitle}>
                    Deploy agents
                    <br />
                    like services.
                  </h1>
                  <p className={feat.heroSupport}>
                    Agents shouldn&rsquo;t require custom deployment scripts held
                    together by convention. MUTX treats deployment as a
                    first-class record — with repeatable environments, rollback
                    paths, and audit trails that make what shipped legible to
                    your whole team.
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
                <p className={feat.sectionEyebrow}>Deployment properties</p>
                <h2 className={feat.sectionTitle}>
                  Deployment should
                  <br />
                  be a record, not a hope.
                </h2>
                <p className={feat.sectionBody}>
                  Most agent tooling doesn&rsquo;t have a concept of deployment —
                  just a script that runs and hopes for the best. MUTX makes
                  deployment a durable record so you can audit what changed,
                  roll back what broke, and reason about production state
                  without guessing.
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
                  Deployment is where
                  <br />
                  everything comes together.
                </h2>
                <p className={feat.sectionBody}>
                  When deployment is a first-class control plane record, governance
                  policies, cost limits, and monitoring all attach to it cleanly.
                  The deployment is the artifact — everything else flows from it.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Governance policies travel with the deployment. When you
                    promote an agent to production, the auth boundaries and
                    operator access controls promote with it — not a separate
                    configuration you have to remember to update.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Cost budgets and rate limits attach to the deployment record.
                    The same spend limits that worked in staging are active in
                    production — enforced by the control plane.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Monitoring traces attach to deployment records. When you
                    investigate an incident, you see which deployment is running
                    and what changed — not just a time-stamped log dump.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-reliability">Reliability</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Health checks and readiness probes are part of the deployment
                    record. The agent isn&rsquo;t &ldquo;running&rdquo; until the control
                    plane confirms it — not until a process started in the
                    background.
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
                  Ship an agent and
                  <br />
                  see the deployment record.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, deploy your first agent, and see what
                  the deployment record looks like when it&rsquo;s built around
                  legibility and rollback — not around whatever was easiest to
                  implement.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/docs/deployment/quickstart" className={feat.secondaryAction}>
                    Deployment quickstart
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
