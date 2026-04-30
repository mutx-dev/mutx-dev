import type { Metadata } from 'next'

import { PicoTutorPageClient } from '@/components/pico/PicoTutorPageClient'

export const metadata: Metadata = {
  title: 'Tutor — PicoMUTX',
  description:
    'Bring one blocked Pico step, get one practical next move, and return to the lesson, runtime, or support path.',
}

export default function PicoTutorPage() {
  return <PicoTutorPageClient />
}
