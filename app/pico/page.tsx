import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'
import { DEFAULT_X_HANDLE, getPageOgImageUrl } from '@/lib/seo'

const TITLE = 'PicoMUTX — Pre-register for access'
const DESCRIPTION =
  'PicoMUTX is currently closed. Pre-register on the waitlist to get first access when the product reopens.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://pico.mutx.dev',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pico.mutx.dev',
    images: [getPageOgImageUrl(TITLE, DESCRIPTION, { path: '/pico' })],
  },
  twitter: {
    card: 'summary_large_image',
    creator: DEFAULT_X_HANDLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [getPageOgImageUrl(TITLE, DESCRIPTION, { path: '/pico' })],
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
            description: DESCRIPTION,
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
  )
}
