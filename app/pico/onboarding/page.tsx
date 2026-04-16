import type { Metadata } from 'next'

import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'

export const metadata: Metadata = {
  title: 'Get Started — PicoMUTX',
  description: 'Set up your PicoMUTX workspace and start learning.',
}

export default function PicoOnboardingPage() {
  return <PicoOnboardingPageClient />
}
