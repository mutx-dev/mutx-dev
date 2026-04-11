import type { Metadata } from 'next'

import { PicoAppWorkspace } from '@/components/site/pico/PicoAppWorkspace'
import { PublicSurface } from '@/components/site/PublicSurface'

export const metadata: Metadata = {
  title: 'PicoMUTX Workspace',
  description: 'Academy, tutor, and autopilot workspace for shipping your first production agent.',
  alternates: {
    canonical: 'https://pico.mutx.dev/app',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoAppPage() {
  return (
    <PublicSurface>
      <PicoAppWorkspace />
    </PublicSurface>
  )
}
