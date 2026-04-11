import type { Metadata } from 'next'

import { PicoAutopilotPageClient } from '@/components/pico/PicoAutopilotPageClient'

export const metadata: Metadata = {
  title: 'PicoMUTX Autopilot',
  description: 'Run visibility, budget thresholds, alerts, and approval gates for PicoMUTX.',
  alternates: {
    canonical: 'https://pico.mutx.dev/autopilot',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoAutopilotPage() {
  return <PicoAutopilotPageClient />
}
