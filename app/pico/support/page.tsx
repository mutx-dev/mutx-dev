import type { Metadata } from 'next'

import { PicoSupportPageClient } from '@/components/pico/PicoSupportPageClient'

export const metadata: Metadata = {
  title: 'Support — PicoMUTX',
  description: 'Get help and support for PicoMUTX.',
}

export default function PicoSupportPage() {
  return <PicoSupportPageClient />
}
