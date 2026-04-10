import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicNav } from "@/components/site/PublicNav";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getPageOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Governance — Auth Boundaries, Access Control, Compliance | MUTX",
  description:
    "Keep agent access explicit and auditable. MUTX bakes auth boundaries, operator access controls, and compliance guardrails into the control plane — so what agents can do stays legible.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-governance") },
  openGraph: {
    title: "AI Agent Governance — Auth Boundaries, Access Control, Compliance | MUTX",
    description:
      "Keep agent access explicit and auditable. MUTX bakes auth boundaries, operator access controls, and compliance guardrails into the control plane.",
    url: getSiteUrl(),
    images: [getPageOgImageUrl("AI Agent Governance — Auth Boundaries, Access Control, Compliance | MUTX", "Keep agent access explicit and auditable. MUTX bakes auth boundaries, operator access controls, and compliance guardrails into the control plane.", { path: "/ai-agent-governance" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Governance | MUTX",
    description:
      "Keep agent access explicit and auditable. MUTX bakes auth boundaries and compliance guardrails into the control plane.",
    images: [getPageOgImageUrl("AI Agent Governance — Auth Boundaries, Access Control, Compliance | MUTX", "Keep agent access explicit and auditable. MUTX bakes auth boundaries, operator access controls, and compliance guardrails into the control plane.", { path: "/ai-agent-governance" })],
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
      name: "AI Agent Governance | MUTX",
      url: getCanonicalUrl("/ai-agent-governance"),
      description:
        "Keep agent access explicit and auditable. Auth boundaries, operator access controls, and compliance guardrails baked into the control plane.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Auth boundaries",
    body: "Define what each agent can access — which APIs, data sources, and tools. The control plane enforces these boundaries everywhere the agent runs, not just in one environment.",
  },
  {
    title: "Operator access control",
    body: "Control who can configure, operate, or observe each agent. Role-based access that travels with the agent definition, not buried in an environment config nobody reads.",
  },
  {
    title: "Compliance guardrails",
    body: "Data handling policies and access logs that satisfy audit requirements without slowing down agent development. Records that exist because the system requires them, not because someone remembered to add them.",
  },
  {
    title: "Policy-as-code",
    body: "Governance policies defined in code, versioned alongside agent definitions, enforced by the control plane. No policy documents living separately from the system they're supposed to govern.",
  },
];

export default function AIAgentGovernancePage() {
  return (
    <PublicSurface>
      <PublicNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={`${core.page} ${core.publicPage}`}>
        <main className={core.main}>
          {/* Poster hero */}
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Governance</p>
                  <h1 className={feat.heroTitle}>
                    Explicit control over
                    <br />
                    every agent&rsquo;s access.
                  </h1>
                  <p className={feat.heroSupport}>
                    Implicit permissions, undocumented tool access, and loose
                    API keys are how agent projects embarrass themselves in
                    production. MUTX bakes auth boundaries into the control plane
                    — so what agents can do stays legible, versioned, and
                    enforced everywhere.
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

          {/* Feature grid */}
          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Governance fundamentals</p>
                <h2 className={feat.sectionTitle}>
                  Governance that travels
                  <br />
                  with the agent.
                </h2>
                <p className={feat.sectionBody}>
                  Most platforms enforce governance per-deployment, which means
                  policies drift the moment an agent moves between environments
                  or teams. MUTX governance is embedded in the control plane —
                  it travels with the agent everywhere it goes.
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

          {/* Layer diagram */}
          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Built into every layer</p>
                <h2 className={feat.sectionTitle}>
                  Governance isn&rsquo;t a bolt-on.
                  <br />
                  It&rsquo;s the foundation.
                </h2>
                <p className={feat.sectionBody}>
                  MUTX governance isn&rsquo;t a separate product you add on.
                  It&rsquo;s woven into the control plane from deployment through
                  monitoring. Every action an agent takes is evaluated against
                  your policies automatically — not policed by convention.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth boundaries and operator access controls are enforced by
                    the runtime. The control plane is where governance starts,
                    not where it&rsquo;s documented.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Governance policies are versioned with deployment configs.
                    What runs in production is what you reviewed — no drift
                    between intention and reality.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth failures and policy violations are first-class
                    monitoring events. You see when an agent hit a boundary,
                    not just when something broke.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    A complete record of every access decision, policy
                    evaluation, and operator action — built into the control
                    plane, not retrofitted into a logging service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className={feat.finalSection}>
            <div className={core.shell}>
              <div className={feat.finalInner}>
                <p className={feat.finalEyebrow}>Get started</p>
                <h2 className={feat.finalTitle}>
                  Define your first
                  <br />
                  governance policy.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and write your auth boundaries in code.
                  Apply them to one agent or your entire fleet — the control
                  plane enforces them everywhere.
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
