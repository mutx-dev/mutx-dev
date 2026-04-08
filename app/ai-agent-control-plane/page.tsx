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
  title: "AI Agent Control Plane — Runtime Visibility, Agent Lifecycle, Operator Surface | MUTX",
  description:
    "The control plane is the product. MUTX surfaces runtime traces, enforces consistency guarantees, and gives operators a legible surface for every agent in your fleet.",
  alternates: { canonical: getCanonicalUrl("/ai-agent-control-plane") },
  openGraph: {
    title: "AI Agent Control Plane — Runtime Visibility, Agent Lifecycle, Operator Surface | MUTX",
    description:
      "The control plane is the product. MUTX surfaces runtime traces, enforces consistency guarantees, and gives operators a legible surface.",
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "AI Agent Control Plane | MUTX",
    description:
      "The control plane is the product. Runtime traces, consistency guarantees, and operator surfaces — built in.",
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
      name: "AI Agent Control Plane | MUTX",
      url: getCanonicalUrl("/ai-agent-control-plane"),
      description:
        "The control plane is the product. MUTX surfaces runtime traces, enforces consistency guarantees, and gives operators a legible surface.",
      isPartOf: { "@type": "WebSite", name: "MUTX", url: getSiteUrl() },
    },
  ],
};

const featureCards = [
  {
    title: "Runtime visibility",
    body: "See what your agents actually did — not what the model said they would do. Traces, tool calls, context windows, and outcomes in a surface your whole team can read.",
  },
  {
    title: "Agent lifecycle",
    body: "Agents have records. Who created them, what runtime they used, what version of the toolchain was active. Lifecycle state is durable, not stored in someone&rsquo;s head or a Slack thread.",
  },
  {
    title: "Operator surface",
    body: "The people operating agents shouldn&rsquo;t need to SSH into a server or grep a log file to understand what happened. MUTX gives operators a readable surface for every action.",
  },
  {
    title: "Consistency guarantees",
    body: "What runs in staging should behave the same way in production. MUTX enforces environment parity through the control plane — not through convention and hope.",
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
                    afterthought — something bolted on after the demo works.
                    MUTX makes it the foundation. Runtime visibility, operator
                    workflows, and consistency guarantees are built in, not
                    improvised after the first production incident.
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
                  Legible runtimes,
                  <br />
                  not prompt soup.
                </h2>
                <p className={feat.sectionBody}>
                  When something breaks in production, you need to reason
                  backward from what actually happened — not forward from what
                  you hoped would happen. MUTX keeps the runtime legible enough
                  for real operators to use in real incidents.
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
                  Everything connects
                  <br />
                  to the control plane.
                </h2>
                <p className={feat.sectionBody}>
                  Governance, cost, deployment, and observability aren&rsquo;t
                  separate systems that happen to share a logo. They&rsquo;re all
                  first-class properties of the same control plane — which means
                  policies and traces stay coherent as agents scale.
                </p>
              </div>
              <div className={feat.featureGrid}>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-governance">Governance</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Auth boundaries and operator access controls enforced by the
                    control plane, not by convention. Travel with the agent
                    everywhere it runs.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-cost">Cost Management</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Spend limits and rate limits as first-class control plane
                    properties. Enforced at the control layer, not patched into
                    individual API calls.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-monitoring">Monitoring</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Traces and metrics surface through the control plane, not
                    through a separate observability setup that drifts from the
                    agent definition.
                  </p>
                </div>
                <div className={feat.featureCard}>
                  <h3 className={feat.featureCardTitle}>
                    <Link href="/ai-agent-deployment">Deployment</Link>
                  </h3>
                  <p className={feat.featureCardBody}>
                    Deployment records are control plane records. What ran, when,
                    with what config — legible and versioned in the same surface
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
                  Start with the
                  <br />
                  real control plane.
                </h2>
                <p className={feat.finalBody}>
                  Download the Mac app and open the runtime surface. See what
                  agents actually did, what the control plane is enforcing, and
                  what the operator surface looks like when it&rsquo;s built around
                  legibility — not around what was easiest to demo.
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
