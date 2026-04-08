import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import core from "@/components/site/marketing/MarketingCore.module.css";
import home from "@/components/site/marketing/MarketingHome.module.css";

const pageTitle = "Monitor AI Agents | MUTX";
const pageDescription =
  "Monitor AI agent runs with visible traces, runtime surfaces, and operator workflows. Know what your agents did, when they ran, and where issues surfaced.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/monitor-ai-agents"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: pageTitle,
    description: pageDescription,
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
      logo: `${getSiteUrl()}/logo.png`,
      sameAs: [
        "https://github.com/mutx-dev/mutx-dev",
        `https://x.com/${DEFAULT_X_HANDLE.replace("@", "")}`,
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "MUTX",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS",
      description: pageDescription,
      url: getCanonicalUrl("/monitor-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/monitor-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Monitoring AI Agents in Production",
      description: pageDescription,
      author: {
        "@type": "Organization",
        name: "MUTX",
      },
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
  ],
};

const capabilities = [
  {
    title: "Every run is a trace",
    body: "Agent executions produce structured traces you can audit. Tool calls, context windows, outputs, and outcomes — all in one surface your team can actually use.",
  },
  {
    title: "Operator lanes, not dashboard theater",
    body: "The monitoring surface shows what the agent did, not just that it ran. Operators get the context they need to make decisions, not charts that look impressive in demos.",
  },
  {
    title: "Surface issues before they escalate",
    body: "Runtime inspection means you see failures where they happen — in the tool call that errored, the context that drifted, or the boundary that was tested.",
  },
  {
    title: "History that travels with the agent",
    body: "Traces are part of the agent's release artifact. When you hand a workflow to another team, they get the full operational history, not a fresh start.",
  },
];

export default function MonitorAIAgentsPage() {
  return (
    <PublicSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={`${core.page} ${core.publicPage}`}>
        <main className={core.main}>
          <section className={home.heroSection}>
            <div className={home.heroShell}>
              <div className={home.heroColumn}>
                <p className={home.heroEyebrow}>Monitoring</p>
                <h1 className={home.heroTitle}>
                  Know what your
                  <br />
                  agents did.
                </h1>
                <p className={home.heroSupport}>
                  Runtime traces that show tool calls, context, and outcomes —
                  so operators can see what happened instead of reading between
                  the lines of a prompt response.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See Traces
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofGrid}>
                {capabilities.map((cap) => (
                  <div key={cap.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{cap.title}</h3>
                    <p className={home.sectionBody}>{cap.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>See it live</p>
                  <h2 className={home.sectionTitle}>
                    Open the runtime. See the trace.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, run an agent, and watch the trace
                    populate in real time — not after you ship it somewhere
                    harder to inspect.
                  </p>
                  <div className={home.finalActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="https://docs.mutx.dev"
                      className={home.secondaryAction}
                    >
                      Read the docs
                    </Link>
                  </div>
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
