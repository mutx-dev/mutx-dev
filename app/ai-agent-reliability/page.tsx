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
import feat from "@/components/site/marketing/MarketingFeature.module.css";

export const metadata: Metadata = {
  title: "AI Agent Reliability — Health Checks, Circuit Breakers, Production Uptime | MUTX",
  description:
    "Agents that survive production. MUTX surfaces health checks, enforces reliability standards, and gives operators the visibility to keep agent runtimes healthy.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-reliability") },
  openGraph: {
    title: "AI Agent Reliability — Health Checks, Circuit Breakers, Production Uptime | MUTX",
    description:
      "Agents that survive production. Health checks, reliability standards, and operator visibility — built into the control plane.",
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Reliability | MUTX",
    description:
      "Agents that survive production. Health checks and reliability standards built into the control plane.",
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
      name: "AI Agent Reliability | MUTX",
      url: getCanonicalUrl("/ai-agent-reliability"),
      description:
        "Agents that survive production. Health checks, circuit breakers, and operator visibility — built into the control plane.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Health checks",
    body: "Agents have a health surface — not just &ldquo;is the process running&rdquo; but &ldquo;is the agent responsive, is the control plane reachable, is the toolchain intact.&rdquo; MUTX confirms health before declaring an agent operational.",
  },
  {
    title: "Readiness probes",
    body: "An agent that just started isn&rsquo;t necessarily ready. MUTX defines readiness as an explicit state — the agent has warmed its context, loaded its tools, and confirmed it can handle requests.",
  },
  {
    title: "Circuit breakers",
    body: "When an agent hits persistent errors or a downstream service degrades, MUTX trips the circuit breaker before cascading failures take down the rest of your system.",
  },
  {
    title: "Failover paths",
    body: "When an agent instance fails, the control plane can route requests to a healthy instance — without requiring a human operator to notice and intervene.",
  },
];

export default function AIAgentReliabilityPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Reliability</p>
                  <h1 className={feat.heroTitle}>
                    Agents that
                    <br />
                    survive production.
                  </h1>
                  <p className={feat.heroSupport}>
                    Pushing an agent to production and hoping for the best
                    isn&rsquo;t a reliability strategy. MUTX surfaces health checks,
                    enforces circuit breakers, and gives operators the
                    visibility to catch degradation before it becomes an
                    incident — not after.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link href="/ai-agent-monitoring" className={core.buttonGhost}>
                      Monitoring
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Reliability properties</p>
                <h2 className={feat.sectionTitle}>
                  Reliability is a
                  <br />
                  control plane property.
                </h2>
                <p className={feat.sectionBody}>
                  Most agent tooling treats reliability as something that
                  happens if the model behaves. MUTX treats it as something
                  the control plane enforces — through health checks, circuit
                  breakers, and explicit operational state that operators can
                  read and act on.
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
                  Reliability talks to
                  <br />
                  the rest of the plane.
                </h2>
                <p className={feat.sectionBody}>
                  When reliability standards are part of the control plane,
                  circuit breakers can integrate with cost enforcement, failover
                  can route based on deployment records, and health checks can
                  feed the audit log — without stitching together separate
                  monitoring tools.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Circuit breakers and spend limits work together. When an
                    agent hits its cost ceiling, the control plane can throttle
                    it gracefully — before it becomes a runaway API bill.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Health checks are part of the deployment record. The agent
                    isn&rsquo;t &ldquo;deployed&rdquo; in MUTX until it passes its health
                    probe — not just until the deployment command exits.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Circuit breaker trips and health check failures surface
                    through the monitoring surface. Operators see the
                    degradation event with full context before customers report
                    it.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-guardrails">Guardrails</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    When a guardrail violation triggers a circuit breaker, the
                    response is coordinated by the control plane — not handled
                    by two separate systems that may not agree on what happened.
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
                  watch the health surface.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, deploy an agent, and open the reliability
                  surface. See what the health probe reports, what happens when
                  you trigger a circuit breaker, and what the operator sees before
                  the incident reaches your users.
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
