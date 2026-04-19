import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'

const TITLE = 'PicoMUTX — Get an AI Agent Working and Trust It'
const DESCRIPTION =
  'PicoMUTX helps founders and operators get an AI agent working, recover broken setups, and add the controls needed to trust it in real work.'

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
