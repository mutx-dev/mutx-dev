import type { Metadata } from 'next'

import { PicoSupportPageClient } from '@/components/pico/PicoSupportPageClient'

export const metadata: Metadata = {
  title: 'Support — PicoMUTX',
  description:
    'Send a PicoMUTX support packet for setup, hosting, API keys, integrations, or custom implementation.',
}

export default function PicoSupportPage() {
  return <PicoSupportPageClient />
}
