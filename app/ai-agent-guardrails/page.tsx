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
  title: "AI Agent Guardrails — Runtime Policy Enforcement & Safety Boundaries | MUTX",
  description:
    "Agents without guardrails will find every edge case — including the ones you didn't anticipate. MUTX enforces safety policies at runtime and surfaces violations as first-class events, not buried log lines.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-guardrails") },
  openGraph: {
    title: "AI Agent Guardrails — Runtime Policy Enforcement & Safety Boundaries | MUTX",
    description:
      "Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events.",
    url: getCanonicalUrl("/ai-agent-guardrails"),
    images: [getPageOgImageUrl("AI Agent Guardrails — Runtime Policy Enforcement & Safety Boundaries | MUTX", "Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events.", { path: "/ai-agent-guardrails" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Guardrails | MUTX",
    description:
      "Safety policies enforced at runtime by the control plane. Violations surface as first-class events.",
    images: [getPageTwitterImageUrl("AI Agent Guardrails — Runtime Policy Enforcement & Safety Boundaries | MUTX", "Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events.", { path: "/ai-agent-guardrails" })],
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
        "Runtime safety policies enforced by the control plane. Guardrail violations surface as first-class events with full context.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Runtime policy enforcement",
    body: "Pin what agents can call, what data they can touch, what operations are off-limits. MUTX evaluates these policies at runtime — not at write-time, not in code review.",
  },
  {
    title: "Safety boundaries",
    body: "Hard walls around operations that should never happen — destructive tool calls, sensitive data access, unattended privileged operations. Boundaries that follow the agent across environments.",
  },
  {
    title: "Violation visibility",
    body: "When a guardrail fires, you see it immediately. Violations surface as first-class events — the violated policy, the attempted operation, and the triggering context. Not a buried log line.",
  },
  {
    title: "Policy versioning",
    body: "Guardrail policies version with the agent definition. You can check which policy was active during a violation, roll back, and test policy changes against real traces before shipping.",
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
                    Draw the line on
                    <br />
                    what agents can&rsquo;t do.
                  </h1>
                  <p className={feat.heroSupport}>
                    An agent without guardrails will probe every edge case —
                    especially the ones you never wanted it to find. MUTX lets
                    you write safety policies, enforce them at runtime, and
                    surface violations as first-class events instead of silent
                    failures buried in a log file nobody opens.
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
                <p className={feat.sectionEyebrow}>How guardrails work</p>
                <h2 className={feat.sectionTitle}>
                  Safety policies,
                  <br />
                  not safety theater.
                </h2>
                <p className={feat.sectionBody}>
                  Most guardrail setups check a compliance box without blocking
                  anything real. MUTX guardrails are enforced by the control
                  plane at runtime — not by prompt instructions a capable model
                  will sidestep when the stakes are high.
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
                <p className={feat.sectionEyebrow}>How guardrails connect</p>
                <h2 className={feat.sectionTitle}>
                  Guardrails are
                  <br />
                  governance, enforced.
                </h2>
                <p className={feat.sectionBody}>
                  Auth boundaries and compliance requirements become guardrail
                  policies in MUTX. When a violation fires, it surfaces in
                  monitoring, gets recorded in the audit log, and can trip a
                  circuit breaker — all coordinated by the control plane.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrails turn governance policies into runtime
                    enforcement. The abstract auth boundary in your governance
                    model becomes the concrete guardrail that fires in
                    production.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrail violations are first-class monitoring events. The
                    policy that was violated, the operation attempted, the
                    surrounding context — not just an error code.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-reliability">Reliability</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Guardrail violations can trip circuit breakers. A repeated
                    policy violation isn&rsquo;t just a compliance issue —
                    it&rsquo;s a reliability signal the control plane can act on.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Every violation is logged with the policy version, the
                    attempted operation, and the context. Records that satisfy
                    compliance reviews — not just developer curiosity.
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
                  Write a policy.
                  <br />
                  Break it on purpose.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app, write a guardrail policy, and trigger
                  the violation deliberately. See the violation event in the
                  control plane, check the audit log entry, and understand what
                  operators see before users are affected.
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
