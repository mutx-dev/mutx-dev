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

const pageTitle = "Debug AI Agents | MUTX";
const pageDescription =
  "Debug AI agents with full trace visibility, step-by-step execution replay, and tool call inspection. The control plane that makes agent failures something you can actually fix.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/debug-ai-agents"),
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
      url: getCanonicalUrl("/debug-ai-agents"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebPage",
      name: pageTitle,
      url: getCanonicalUrl("/debug-ai-agents"),
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "MUTX",
        url: getSiteUrl(),
      },
    },
    {
      "@type": "Article",
      headline: "Debugging AI Agents in Production",
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

const debugPoints = [
  {
    title: "Full trace visibility",
    body: "Every agent run produces a trace: tool calls, context windows, decisions, and outcomes. See what happened without guessing at the prompt.",
  },
  {
    title: "Step-by-step execution",
    body: "Replay agent runs step by step. Find where it diverged from expected behavior, what tool call failed, or where context was lost.",
  },
  {
    title: "Tool call inspection",
    body: "Inspect every tool call in isolation. See inputs, outputs, latency, and error states. Know whether the tool failed or the agent mishandled the result.",
  },
  {
    title: "Failure context that stays",
    body: "When an agent fails, the trace captures the full context. Share it with your team, file a bug, or use it to write a regression test.",
  },
];

export default function DebugAIAgentsPage() {
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
                <p className={home.heroEyebrow}>Debugging</p>
                <h1 className={home.heroTitle}>
                  See exactly where
                  <br />
                  your agent went wrong.
                </h1>
                <p className={home.heroSupport}>
                  Full trace visibility, step-by-step replay, and tool call
                  inspection — so debugging an agent feels like debugging
                  software, not prompting in circles.
                </p>
                <div className={home.heroActions}>
                  <Link href="/download" className={core.buttonPrimary}>
                    Download for Mac
                  </Link>
                  <Link href="/download" className={core.buttonGhost}>
                    See Trace Viewer
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={home.proofSection}>
            <div className={core.shell}>
              <div className={home.proofIntro}>
                <p className={home.sectionEyebrow}>What you get</p>
                <h2 className={home.sectionTitle}>
                  Traces that tell the story.
                  <br />
                  Not logs that bury it.
                </h2>
                <p className={home.sectionBody}>
                  Most agent platforms give you a completion and a token count.
                  MUTX gives you the full execution trace — every step, every
                  call, every decision — in a surface your whole team can read.
                </p>
              </div>
              <div className={home.proofGrid}>
                {debugPoints.map((point) => (
                  <div key={point.title} className={home.proofCard}>
                    <h3 className={home.proofCardTitle}>{point.title}</h3>
                    <p className={home.sectionBody}>{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={home.finalSection}>
            <div className={core.shell}>
              <div className={home.finalInner}>
                <div className={home.finalCopy}>
                  <p className={home.sectionEyebrow}>Built for developers</p>
                  <h2 className={home.sectionTitle}>
                    Run the agent.
                    <br />
                    Read the trace.
                    <br />
                    Fix the bug.
                  </h2>
                  <p className={home.sectionBody}>
                    Download the Mac app, run your first agent, and see how
                    MUTX makes debugging feel like something you can actually do
                    — not a mystery wrapped in a completion.
                  </p>
                  <div className={home.finalActions}>
                    <Link href="/download" className={core.buttonPrimary}>
                      Download for Mac
                    </Link>
                    <Link
                      href="https://github.com/mutx-dev/mutx-dev"
                      className={home.secondaryAction}
                    >
                      View on GitHub
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
