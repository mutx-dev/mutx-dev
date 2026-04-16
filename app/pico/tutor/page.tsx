import type { Metadata } from 'next'

import { PicoTutorPageClient } from '@/components/pico/PicoTutorPageClient'

export const metadata: Metadata = {
  title: 'Tutor — PicoMUTX',
  description: 'Get guided help from the PicoMUTX AI tutor.',
}

export default function PicoTutorPage() {
  return <PicoTutorPageClient />
}
