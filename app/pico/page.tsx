import type { Metadata } from "next";

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'
import { DEFAULT_X_HANDLE, getPageOgImageUrl } from '@/lib/seo'

const pageTitle = "PicoMUTX — From first agent to one you actually trust";
const pageDescription =
  "PicoMUTX is the guided academy, tutor, and autopilot layer that takes you from first agent to a production workflow you can actually trust.";

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
