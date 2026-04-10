import type { Metadata } from 'next'

import { PicoWorkspace } from '@/components/site/pico/PicoWorkspace'
import { PicoFooter } from '@/components/site/pico/PicoFooter'
import { PublicSurface } from '@/components/site/PublicSurface'

const pageTitle = 'PicoMUTX Workspace — Academy + Tutor + Autopilot Beta'
const pageDescription =
  'PicoMUTX workspace beta: ship your first agent with guided lessons, grounded support, and manual-first control loops for activity, budget, alerts, and approvals.'

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: 'https://pico.mutx.dev/workspace',
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://pico.mutx.dev/workspace',
  },
}

export default function PicoWorkspacePage() {
  return (
    <PublicSurface>
      <PicoWorkspace />
      <PicoFooter />
    </PublicSurface>
  )
}
