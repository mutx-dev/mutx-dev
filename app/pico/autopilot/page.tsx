import type { Metadata } from 'next'

import { PicoAutopilotPageClient } from '@/components/pico/PicoAutopilotPageClient'

export const metadata: Metadata = {
  title: 'Autopilot — PicoMUTX',
  description:
    'Inspect live runs, spend, alerts, and approvals in one PicoMUTX control room before you trust the automation.',
}

export default function PicoAutopilotPage() {
  return <PicoAutopilotPageClient />
}
