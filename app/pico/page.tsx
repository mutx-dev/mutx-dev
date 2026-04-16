import type { Metadata } from 'next'

import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'

export const metadata: Metadata = {
  title: 'Get Started — PicoMUTX',
  description: 'Get to your first working agent fast.',
  alternates: {
    canonical: 'https://pico.mutx.dev',
  },
  openGraph: {
    title: 'Get Started — PicoMUTX',
    description: 'Get to your first working agent fast.',
    url: 'https://pico.mutx.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Started — PicoMUTX',
    description: 'Get to your first working agent fast.',
  },
}

export default function PicoPage() {
  return <PicoOnboardingPageClient />
}
