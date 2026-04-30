import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'

const TITLE = 'PicoMUTX — Get an AI Agent Working and Under Control'
const DESCRIPTION =
  'PicoMUTX helps founders and operators build, recover, and control AI agents they can trust in real-world use.'

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
