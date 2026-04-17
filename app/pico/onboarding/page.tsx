import type { Metadata } from 'next'

import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'

export const metadata: Metadata = {
  title: 'Onboarding — PicoMUTX',
  description:
    'Install Hermes, run one bounded prompt, capture the first proof artifact, and attach hosted setup state when it is available.',
}

export default function PicoOnboardingPage() {
  return <PicoOnboardingPageClient />
}
