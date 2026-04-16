import type { Metadata } from 'next'

import { PicoPricingPage } from '@/components/pico/PicoPricingPage'

export const metadata: Metadata = {
  title: 'Pricing — PicoMUTX',
  description: 'Simple, transparent pricing for PicoMUTX. Start free, upgrade when you need more.',
  alternates: { canonical: 'https://pico.mutx.dev/pricing' },
}

export default function PricingPage() {
  return <PicoPricingPage />
}
