import type { Metadata } from "next";

import { MarketingHomePage } from "@/components/site/marketing/MarketingHomePage";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl, getSiteUrl } from "@/lib/seo";

const homeTitle = "MUTX | See What Your AI Agents Are Doing";
const homeDescription =
  "MUTX gives you clear visibility, real control, and safe team sharing for every AI agent you run. Download the Mac app.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: getCanonicalUrl(),
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: getSiteUrl(),
    images: [getOgImageUrl()],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: homeTitle,
    description: homeDescription,
    images: [getOgImageUrl()],
  },
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
      operatingSystem: "macOS",
      description: homeDescription,
      url: getSiteUrl(),
      downloadUrl: `${getSiteUrl()}/download`,
      publisher: {
        "@id": `${getSiteUrl()}/#organization`,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
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
      <MarketingHomePage />
      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
