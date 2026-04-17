import type { Metadata } from 'next'

import { PicoSupportPageClient } from '@/components/pico/PicoSupportPageClient'

export const metadata: Metadata = {
  title: 'Support Lane — PicoMUTX',
  description:
    'Send a clean PicoMUTX support packet with route, proof, and return lane so a human can unblock the next move fast.',
}

export default function PicoSupportPage() {
  return <PicoSupportPageClient />
}
