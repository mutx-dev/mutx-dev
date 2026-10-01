import type { Metadata } from "next";

import { ProductHomePage } from "@/components/site/marketing/ProductHomePage";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { DEFAULT_X_HANDLE, buildPageMetadata, getSiteUrl } from "@/lib/seo";

const homeTitle = "MUTX | AI Agent Operations";
const homeDescription =
  "A workspace for inspecting AI agent runs, reviewing tool calls, and handling approval requests. Connect agents with the MUTX CLI or SDK, and review activity in the browser control plane.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  ...buildPageMetadata({
    title: homeTitle,
    description: homeDescription,
    path: "/",
  }),
};

const homepageStructuredData = {
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
      description: homeDescription,
      url: getSiteUrl(),
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
    {
      "@type": "WebSite",
      name: "MUTX",
      url: getSiteUrl(),
      description: homeDescription,
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
    },
  ],
};

export default function HomePage() {
  return (
    <PublicSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <ProductHomePage />
      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
