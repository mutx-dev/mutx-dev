import type { Metadata } from 'next'

import { PicoAcademyDashboard } from '@/components/pico/PicoAcademyDashboard'

export const metadata: Metadata = {
  title: 'PicoMUTX Academy',
  description: 'Guided lesson paths for getting a real agent running, visible, and controlled.',
  alternates: {
    canonical: 'https://pico.mutx.dev/academy',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoAcademyPage() {
  return <PicoAcademyDashboard />
}
