import type { Metadata } from "next";

import { MarketingHomePage } from "@/components/site/marketing/MarketingHomePage";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl, getSiteUrl } from "@/lib/seo";

const homeTitle = "MUTX | A Field Novel For Deployed Agents";
const homeDescription =
  "MUTX turns agent operations into a readable system with boundaries, proof, and calm operator surfaces. Start with the product, the release lane, or the repo.";

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
    images: [getPageOgImageUrl(homeTitle, homeDescription, { path: "/" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: homeTitle,
    description: homeDescription,
    images: [getPageTwitterImageUrl(homeTitle, homeDescription, { path: "/" })],
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
