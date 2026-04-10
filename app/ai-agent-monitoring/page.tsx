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
  title: "AI Agent Monitoring — Runtime Traces, Tool Call History, Outcome Records | MUTX",
  description:
    "See what agents actually did, not what they said they'd do. MUTX captures execution traces, tool call history, and outcomes so your team can investigate incidents and improve behavior.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-monitoring") },
  openGraph: {
    title: "AI Agent Monitoring — Runtime Traces, Tool Call History, Outcome Records | MUTX",
    description:
      "See what agents actually did. Execution traces, tool call history, and outcomes — built into the control plane.",
    url: getSiteUrl(),
    images: [getPageOgImageUrl("AI Agent Monitoring — Runtime Traces, Tool Call History, Outcome Records | MUTX", "See what agents actually did. Execution traces, tool call history, and outcomes — built into the control plane.", { path: "/ai-agent-monitoring" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Monitoring | MUTX",
    description:
      "See what agents actually did, not what they said they'd do. Runtime traces and tool call history built into the control plane.",
    images: [getPageOgImageUrl("AI Agent Monitoring — Runtime Traces, Tool Call History, Outcome Records | MUTX", "See what agents actually did. Execution traces, tool call history, and outcomes — built into the control plane.", { path: "/ai-agent-monitoring" })],
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
      name: "AI Agent Monitoring | MUTX",
      url: getCanonicalUrl("/ai-agent-monitoring"),
      description:
        "See what agents actually did. Runtime traces, tool call history, and outcome records — built into the control plane.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Execution traces",
    body: "See the full sequence of what the agent did — every model call, every tool invocation, every context window change. Not a summary the model wrote about itself, but the actual trace.",
  },
  {
    title: "Tool call history",
    body: "Which tool was called, with what arguments, in what order, and what came back. The information you need to understand why an agent chose a path — not just that it chose one.",
  },
  {
    title: "Outcome records",
    body: "What the agent produced, where it wrote state, what external calls it made. Outcome records let you reason backward from results instead of guessing forward from intentions.",
  },
  {
    title: "Alert routing",
    body: "When something in the trace looks wrong, alerts route to the right operator — not to a generic monitoring inbox nobody monitors. Alerts are attached to agent records, not floating in a SIEM.",
  },
];

export default function AIAgentMonitoringPage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Monitoring</p>
                  <h1 className={feat.heroTitle}>
                    See what agents
                    <br />
                    actually did.
                  </h1>
                  <p className={feat.heroSupport}>
                    When something breaks in production, you need to reason
                    backward from what the agent actually did — not forward from
                    what the model said it would do. MUTX captures execution
                    traces, tool calls, and outcomes so your team can
                    investigate incidents and improve agent behavior over time.
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
                <p className={feat.sectionEyebrow}>Observability properties</p>
                <h2 className={feat.sectionTitle}>
                  Traces, not tail outputs.
                </h2>
                <p className={feat.sectionBody}>
                  Traditional monitoring tells you that something happened.
                  MUTX traces tell you what the agent actually did — the full
                  execution path, the tool call chain, the outcome. Information
                  structured for investigation, not just alerting.
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
                  Monitoring is the
                  <br />
                  payoff for good control.
                </h2>
                <p className={feat.sectionBody}>
                  When governance, deployment, and cost are all part of the same
                  control plane, monitoring traces attach to all of them. You see
                  the deployment that shipped, the policy that was evaluated,
                  and the cost that was incurred — in the same trace.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth failures and policy violations are first-class trace
                    events. You see when an agent hit a boundary and what it
                    tried to do — not just the error that appeared in the logs.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces are attached to deployment records. When you
                    investigate a production incident, you see which deployment
                    is running and what changed — not just a timestamp.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Cost spikes surface through the monitoring surface with
                    corresponding traces. You see the spend anomaly and the
                    execution trace in the same incident view.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-audit-logs">Audit Logs</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces feed the audit log. Every action is recorded with
                    enough context to satisfy a compliance review — not just a
                    generic &ldquo;agent ran successfully&rdquo; entry.
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
                  Watch the runtime
                  <br />
                  do something real.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and run an agent. Open the trace view and
                  see what it actually did — every tool call, every context
                  window change, every outcome. Then compare that to what you
                  thought it would do.
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
