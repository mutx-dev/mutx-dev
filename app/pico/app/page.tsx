import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'PicoMUTX Workspace',
  description: 'Legacy PicoMUTX workspace route kept only as a compatibility redirect.',
  alternates: {
    canonical: 'https://pico.mutx.dev/onboarding',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PicoAppPage() {
  redirect('/pico/onboarding')
}
