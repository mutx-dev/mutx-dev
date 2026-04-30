import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'

const TITLE = 'PicoMUTX — Get an AI Agent Running'
const DESCRIPTION =
  'PicoMUTX helps teams install, configure, and run useful AI agents with guided setup and review built in.'

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
