import type { Metadata } from 'next'

import { PicoPricingPage } from '@/components/pico/PicoPricingPage'

export const metadata: Metadata = {
  title: 'Pricing & Access — PicoMUTX',
  description:
    'See PicoMUTX self-serve access, guided setup, and implementation options.',
  alternates: { canonical: 'https://pico.mutx.dev/pricing' },
}

export default function PricingPage() {
  return <PicoPricingPage />
}
