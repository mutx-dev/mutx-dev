import type { Metadata } from 'next'

import { PicoTutorPageClient } from '@/components/pico/PicoTutorPageClient'

export const metadata: Metadata = {
  title: 'PicoMUTX Tutor',
  description: 'Grounded PicoMUTX tutor answers tied to the shipped lesson corpus.',
  alternates: {
    canonical: 'https://pico.mutx.dev/tutor',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoTutorPage() {
  return <PicoTutorPageClient />
}
