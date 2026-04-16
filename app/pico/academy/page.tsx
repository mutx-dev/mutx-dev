import type { Metadata } from 'next'

import { PicoAcademyDashboard } from '@/components/pico/PicoAcademyDashboard'

export const metadata: Metadata = {
  title: 'Academy — PicoMUTX',
  description: 'Explore lessons, tracks, and learning paths on PicoMUTX Academy.',
}

export default function PicoAcademyPage() {
  return <PicoAcademyDashboard />
}
