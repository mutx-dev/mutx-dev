import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'

const TITLE = 'PicoMUTX — Build and Deploy AI Agents Without Hiring a Developer'
const DESCRIPTION =
  'PicoMUTX helps founders and operators build and deploy AI agents with one guided path, built-in safeguards, and real support.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://pico.mutx.dev',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://pico.mutx.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function PicoPage() {
  return <PicoLandingSurface />
}
