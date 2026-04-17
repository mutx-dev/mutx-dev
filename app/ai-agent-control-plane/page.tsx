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
  title: "AI Agent Control Plane — Runtime Traces, Lifecycle, Operator Surface | MUTX",
  description:
    "The control plane isn&rsquo;t a dashboard bolt-on. MUTX gives you runtime traces, agent lifecycle records, and a legible operator surface for every agent in your fleet.",
  ...buildPageMetadata({
    title: "AI Agent Control Plane — Runtime Traces, Lifecycle, Operator Surface | MUTX",
    description:
      "The control plane isn&rsquo;t a dashboard bolt-on. MUTX gives you runtime traces, agent lifecycle records, and a legible operator surface for every agent in your fleet.",
    path: "/ai-agent-control-plane",
    socialDescription:
      "The control plane isn&rsquo;t a bolt-on. Runtime traces, lifecycle records, and a legible operator surface — built in.",
    twitterTitle: "AI Agent Control Plane | MUTX",
    twitterDescription:
      "The control plane isn&rsquo;t a bolt-on. Runtime traces, lifecycle records, and operator surfaces — built in from day one.",
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
      name: "AI Agent Control Plane | MUTX",
      url: getCanonicalUrl("/ai-agent-control-plane"),
      description:
        "The control plane isn&rsquo;t a bolt-on. Runtime traces, lifecycle records, and a legible operator surface — built in.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Runtime visibility",
    body: "See what your agents actually did — not what the model promised. Traces, tool calls, context windows, and outcomes in a surface your on-call can read at 2 AM.",
  },
  {
    title: "Agent lifecycle",
    body: "Every agent has a record. Who created it, what runtime it uses, what toolchain version was active. Lifecycle state is durable — not trapped in a Slack thread or someone&rsquo;s memory.",
  },
  {
    title: "Operator surface",
    body: "Operators shouldn&rsquo;t need to SSH into a box or grep a log to figure out what happened. MUTX gives you a readable surface for every agent action, every time.",
  },
  {
    title: "Consistency guarantees",
    body: "Staging and production should behave the same way because the control plane enforces it — not because the team agreed it should and forgot to follow through.",
  },
];

export default function AIAgentControlPlanePage() {
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
                  <p className={feat.heroEyebrow}>AI Agent Control Plane</p>
                  <h1 className={feat.heroTitle}>
                    The control plane
                    <br />
                    is the product.
                  </h1>
                  <p className={feat.heroSupport}>
                    Most agent tooling treats the control plane as an
                    afterthought — something bolted on after the demo impresses
                    the room. MUTX makes it the foundation. Runtime visibility,
                    operator workflows, and consistency guarantees ship built in,
                    not retrofitted after the first production fire.
                  </p>
                  <div className={feat.heroActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="/ai-agent-deployment"
                      className={core.buttonGhost}
                    >
                      Deployment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={feat.contentSection}>
            <div className={core.shell}>
              <div className={feat.contentIntro}>
                <p className={feat.sectionEyebrow}>Control plane properties</p>
                <h2 className={feat.sectionTitle}>
                  Read the runtime.
                  <br />
                  Don&rsquo;t guess.
                </h2>
                <p className={feat.sectionBody}>
                  When something breaks in production, you need to trace
                  backward from what actually happened — not forward from what
                  you hoped would happen. MUTX keeps the runtime legible enough
                  for real operators working real incidents under real pressure.
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
                <p className={feat.sectionEyebrow}>Cross-cutting concerns</p>
                <h2 className={feat.sectionTitle}>
                  One plane.
                  <br />
                  Every concern.
                </h2>
                <p className={feat.sectionBody}>
                  Governance, cost, deployment, and observability aren&rsquo;t
                  four tools that happen to share a billing account. They&rsquo;re
                  first-class properties of the same control plane — so policies
                  and traces stay coherent as your agent fleet scales.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth boundaries and access controls enforced by the control
                    plane, not by convention. They travel with the agent
                    everywhere it runs — no exceptions.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Spend limits and rate limits are control plane properties.
                    Enforced at the control layer, not duct-taped into
                    individual API calls after the first bill shock.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces and metrics surface through the control plane — not
                    through a separate observability stack that silently drifts
                    from the agent definition.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Deployments are control plane records. What ran, when, with
                    what config — versioned and legible in the same surface
                    you use to operate the agent.
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
                  See what your agents
                  <br />
                  are actually doing.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and open the runtime surface. See real
                  agent traces, what the control plane enforces, and what an
                  operator surface looks like when it&rsquo;s built for
                  legibility — not for screenshots.
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
