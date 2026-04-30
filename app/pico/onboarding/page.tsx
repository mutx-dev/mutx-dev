import type { Metadata } from 'next'

import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'

export const metadata: Metadata = {
  title: 'Onboarding — PicoMUTX',
  description:
    'Install Hermes, run one bounded prompt, save the first output, and prepare the agent packet.',
}

export default function PicoOnboardingPage() {
  return <PicoOnboardingPageClient />
}
