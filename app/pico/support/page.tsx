import type { Metadata } from 'next'

import { PicoSupportPageClient } from '@/components/pico/PicoSupportPageClient'

export const metadata: Metadata = {
  title: 'PicoMUTX Support',
  description: 'Support lanes, office hours, and escalation paths for PicoMUTX builders.',
  alternates: {
    canonical: 'https://pico.mutx.dev/support',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoSupportPage() {
  return <PicoSupportPageClient />
}
