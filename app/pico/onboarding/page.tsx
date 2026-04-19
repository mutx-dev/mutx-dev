import { PicoOnboardingPageClient } from '@/components/pico/PicoOnboardingPageClient'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.onboarding.meta', '/onboarding')
}

export default function PicoOnboardingPage() {
  return <PicoOnboardingPageClient />
}
