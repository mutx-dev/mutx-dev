import type { Metadata } from 'next'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'

const TITLE = 'PicoMUTX — Real Operator Guidance For Live Agent Stacks'
const DESCRIPTION =
  'PicoMUTX turns live stack research, guided lessons, and operator support into one safer path for Hermes, OpenClaw, NanoClaw, and PicoClaw.'

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
