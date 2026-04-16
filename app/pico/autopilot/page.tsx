import type { Metadata } from 'next'

import { PicoAutopilotPageClient } from '@/components/pico/PicoAutopilotPageClient'

export const metadata: Metadata = {
  title: 'Autopilot — PicoMUTX',
  description: 'Automate your workflow with PicoMUTX Autopilot.',
}

export default function PicoAutopilotPage() {
  return <PicoAutopilotPageClient />
}
