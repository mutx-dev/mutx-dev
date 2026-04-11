import type { Metadata } from 'next'

import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'

export const metadata: Metadata = {
  title: 'PicoMUTX Workspace',
  description: 'Start the PicoMUTX workspace and choose the first agent path you will actually ship.',
  alternates: {
    canonical: 'https://pico.mutx.dev/app',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoAppPage() {
  return <PicoOnboardingPageClient />
}
