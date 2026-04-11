import type { Metadata } from "next";

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'
import { DEFAULT_X_HANDLE, getPageOgImageUrl } from '@/lib/seo'

const pageTitle = "PicoMUTX — Pre-register for access";
const pageDescription =
  "PicoMUTX is currently closed. Pre-register on the waitlist to get first access when the product reopens.";

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
    <>
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
      <PicoLandingSurface />
    </>
  );
}
