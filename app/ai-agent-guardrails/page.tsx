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
  title: "AI Agent Guardrails — Policy Enforcement, Safety Bounds, Runtime Controls | MUTX",
  description:
    "Define what agents can and can't do. MUTX lets you write explicit safety policies, enforce them at runtime, and see violations as first-class events — not silent failures.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-guardrails") },
  openGraph: {
    title: "AI Agent Guardrails — Policy Enforcement, Safety Bounds, Runtime Controls | MUTX",
    description:
      "Define what agents can and can't do. Safety policies enforced at runtime, violations visible as first-class events.",
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Guardrails | MUTX",
    description:
      "Define what agents can and can't do. Safety policies enforced at runtime, violations visible as first-class events.",
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
      name: "AI Agent Guardrails | MUTX",
      url: getCanonicalUrl("/ai-agent-guardrails"),
      description:
        "Define what agents can and can't do. Safety policies enforced at runtime, violations visible as first-class events.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Runtime policy enforcement",
    body: "Define what agents can call, what data they can access, and what operations are off-limits. MUTX evaluates these policies at runtime — not at write-time, not at review-time.",
  },
  {
    title: "Safety boundaries",
    body: "Put explicit walls around operations that should never happen — destructive tool calls, sensitive data access, operations without a human-in-the-loop gate. Boundaries that travel with the agent.",
  },
  {
    title: "Violation visibility",
    body: "When a guardrail is triggered, you see it. MUTX surfaces guardrail violations as first-class events — with the policy that was violated, the operation that was attempted, and the context that triggered it.",
  },
  {
    title: "Policy versioning",
    body: "Guardrail policies are versioned with the agent definition. You can audit what policy was active when a violation occurred, roll back to an earlier policy, and test policy changes against production traces.",
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
          <section className={feat.heroSection}>
            <div className={feat.heroStage}>
              <div className={feat.heroShell}>
                <div className={feat.heroColumn}>
                  <p className={feat.heroEyebrow}>AI Agent Guardrails</p>
                  <h1 className={feat.heroTitle}>
                    Define what agents
                    <br />
                    can&rsquo;t do.
                  </h1>
                  <p className={feat.heroSupport}>
                    Without explicit guardrails, agents will explore every edge
                    case — including the ones you never wanted them to find.
                    MUTX lets you write safety policies, enforce them at
                    runtime, and see violations as first-class events instead
                    of silent failures buried in a log file nobody reads.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="/ai-agent-governance"
                      className={core.buttonGhost}
                    >
                      Governance
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Guardrail properties</p>
                <h2 className={feat.sectionTitle}>
                  Safety policies,
                  <br />
                  not safety theater.
                </h2>
                <p className={feat.sectionBody}>
                  Most guardrail implementations check a box without actually
                  preventing anything. MUTX guardrails are enforced by the
                  control plane at runtime — not by prompt instructions that
                  the model can reason around when the stakes are high.
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
                  Guardrails are
                  <br />
                  governance made concrete.
                </h2>
                <p className={feat.sectionBody}>
                  Auth boundaries and compliance requirements become concrete
                  guardrail policies in MUTX. When a guardrail violation triggers,
                  it surfaces through the monitoring surface, is recorded in the
                  audit log, and can trigger a circuit breaker — all coordinated
                  by the control plane.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrails are where governance policies become runtime
                    enforcement. The auth boundary that&rsquo;s abstract in the
                    governance model is the concrete guardrail that fires in
                    production.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrail violations are first-class monitoring events. You
                    see the policy that was violated, the operation that was
                    attempted, and the context — not just an error code.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-reliability">Reliability</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrail violations can trigger circuit breakers. A
                    repeated policy violation isn&rsquo;t just a compliance
                    problem — it&rsquo;s a reliability signal that the control
                    plane can act on.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Every guardrail violation is logged with the policy version,
                    the attempted operation, and the context. Records that
                    satisfy compliance reviews, not just developer curiosity.
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
                  Write a policy and
                  <br />
                  watch it enforce.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, write a guardrail policy for an agent,
                  and trigger the violation deliberately. See what the violation
                  event looks like in the control plane, what gets recorded in
                  the audit log, and what the operator sees before users do.
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
