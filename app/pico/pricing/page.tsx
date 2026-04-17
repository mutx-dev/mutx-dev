import type { Metadata } from 'next'

import { PicoPricingPage } from '@/components/pico/PicoPricingPage'

export const metadata: Metadata = {
  title: 'Pricing & Access — PicoMUTX',
  description:
    'See PicoMUTX founding access lanes first, then the live in-product billing plans for teams already inside the system.',
  alternates: { canonical: 'https://pico.mutx.dev/pricing' },
}

export default function PricingPage() {
  return <PicoPricingPage />
}
