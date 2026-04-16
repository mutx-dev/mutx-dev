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
  title: "AI Agent Governance — Auth Boundaries, Access Control & Audit Compliance | MUTX",
  description:
    "Agent access is a minefield of implicit permissions and undocumented API keys. MUTX bakes auth boundaries, operator access controls, and compliance audit trails into the control plane — so what every agent can do is explicit, versioned, and enforced.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-governance") },
  openGraph: {
    title: "AI Agent Governance — Auth Boundaries, Access Control & Audit Compliance | MUTX",
    description:
      "Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions.",
    url: getCanonicalUrl("/ai-agent-governance"),
    images: [getPageOgImageUrl("AI Agent Governance — Auth Boundaries, Access Control & Audit Compliance | MUTX", "Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions.", { path: "/ai-agent-governance" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Governance | MUTX",
    description:
      "Auth boundaries and compliance guardrails baked into the control plane. Agent access stays explicit and auditable.",
    images: [getPageTwitterImageUrl("AI Agent Governance — Auth Boundaries, Access Control & Audit Compliance | MUTX", "Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions.", { path: "/ai-agent-governance" })],
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
        "Auth boundaries, operator access controls, and compliance audit trails baked into the control plane. No implicit permissions, no undocumented access.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Auth boundaries",
    body: "Pin what each agent can touch — APIs, data sources, tools. The control plane enforces these boundaries in every environment the agent runs in. No environment-specific config drift.",
  },
  {
    title: "Operator access control",
    body: "Decide who can configure, operate, or observe each agent. RBAC that lives in the agent definition, not in some environment config nobody opens.",
  },
  {
    title: "Compliance guardrails",
    body: "Data handling policies and access logs that satisfy compliance without slowing down development. Audit records that exist because the system writes them, not because someone remembered to add logging.",
  },
  {
    title: "Policy-as-code",
    body: "Governance policies written in code, versioned with agent definitions, enforced by the control plane. The policy lives next to the agent — not in a Google doc nobody updates.",
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
                    Lock down what
                    <br />
                    every agent can touch.
                  </h1>
                  <p className={feat.heroSupport}>
                    Agents with implicit permissions, undocumented tool access,
                    and loose API keys are how projects implode in production.
                    MUTX makes every agent&rsquo;s access boundaries explicit,
                    versioned, and enforced — everywhere the agent runs.
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
                <p className={feat.sectionEyebrow}>How governance works</p>
                <h2 className={feat.sectionTitle}>
                  Policies that follow
                  <br />
                  the agent.
                </h2>
                <p className={feat.sectionBody}>
                  Most platforms bolt governance onto each deployment. The
                  moment an agent moves environments or changes hands, policies
                  drift. MUTX governance is wired into the control plane — it
                  follows the agent everywhere.
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
                <p className={feat.sectionEyebrow}>Runs through every layer</p>
                <h2 className={feat.sectionTitle}>
                  Governance isn&rsquo;t a bolt-on.
                  <br />
                  It&rsquo;s the foundation.
                </h2>
                <p className={feat.sectionBody}>
                  MUTX governance isn&rsquo;t an add-on. It runs through the
                  control plane from deployment to monitoring. Every agent
                  action is evaluated against your policies automatically — not
                  enforced by convention or hope.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-control-plane">Control Plane</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth boundaries and operator access controls enforced at
                    the runtime layer. Governance starts here — it&rsquo;s not
                    just documented, it&rsquo;s enforced.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Policies are versioned with deployment configs. What runs
                    in production is exactly what you reviewed — no gap between
                    intention and reality.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth failures and policy violations surface as first-class
                    events. You see when an agent hit a boundary — not just
                    when something broke.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Every access decision, policy evaluation, and operator
                    action — recorded by the control plane, not retrofitted
                    into a logging service after the fact.
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
                  Ship your first
                  <br />
                  agent auth boundary.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and define auth boundaries in code. Apply
                  them to one agent or your whole fleet — the control plane
                  handles enforcement across every environment.
                </p>
                <div className={feat.finalActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/ai-agent-approvals" className={feat.secondaryAction}>
                    Approval workflows
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
