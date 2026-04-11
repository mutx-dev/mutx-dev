import type { Metadata } from "next";

import { PicoLandingPage } from "@/components/site/pico/PicoLandingPage";
import { PicoFooter } from "@/components/site/pico/PicoFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import {
  DEFAULT_X_HANDLE,
  buildWebPageStructuredData,
  getCanonicalUrl,
  getPageOgImageUrl,
} from "@/lib/seo";

const pageTitle = "PicoMUTX — Academy, starter deploy, and control for your first agent";
const pageDescription =
  "Pico gives a small team a shipped lesson corpus, a starter deploy path, a live control surface, and grounded support for first-run agent setup.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: getCanonicalUrl("/pico"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: getCanonicalUrl("/pico"),
    images: [getPageOgImageUrl(pageTitle, pageDescription, { path: "/pico" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: pageTitle,
    description: pageDescription,
    images: [getPageOgImageUrl(pageTitle, pageDescription, { path: "/pico" })],
  },
};

export default function PicoPage() {
  return (
    <PublicSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildWebPageStructuredData({
              name: "PicoMUTX",
              path: "/pico",
              description: pageDescription,
            }),
          ),
        }}
      />
      <PicoLandingPage />
      <PicoFooter />
    </PublicSurface>
  );
}
