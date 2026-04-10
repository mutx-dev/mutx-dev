import type { Metadata } from "next";

import { PicoLandingPage } from "@/components/site/pico/PicoLandingPage";
import { PicoFooter } from "@/components/site/pico/PicoFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { DEFAULT_X_HANDLE, getPageOgImageUrl } from '@/lib/seo'

const pageTitle = "PicoMUTX — Build and Deploy AI Agents Safely Without Hiring a Developer";
const pageDescription =
  "PicoMUTX helps founders, operators, and small teams build, deploy, and run AI agents safely — with step-by-step guidance, built-in safeguards, and real support. Pre-register now for early access.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: 'https://pico.mutx.dev',
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://pico.mutx.dev',
    images: [getPageOgImageUrl(pageTitle, pageDescription, { path: '/pico' })],
  },
  twitter: {
    card: 'summary_large_image',
    creator: DEFAULT_X_HANDLE,
    title: pageTitle,
    description: pageDescription,
    images: [getPageOgImageUrl(pageTitle, pageDescription, { path: '/pico' })],
  },
}

export default function PicoPage() {
  return (
    <PublicSurface>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'PicoMUTX',
            url: 'https://pico.mutx.dev',
            description: pageDescription,
            isPartOf: {
              '@type': 'WebSite',
              name: 'PicoMUTX',
              url: 'https://pico.mutx.dev',
            },
          }),
        }}
      />
      <PicoLandingPage />
      <PicoFooter />
    </PublicSurface>
  );
}
