import type { Metadata } from 'next'

import { PicoAutopilotPageClient } from '@/components/pico/PicoAutopilotPageClient'

export const metadata: Metadata = {
  title: 'Autopilot — PicoMUTX',
  description:
    'Review live runs, spend, alerts, and approvals before agents run autonomously.',
}

export default function PicoAutopilotPage() {
  return <PicoAutopilotPageClient />
}
