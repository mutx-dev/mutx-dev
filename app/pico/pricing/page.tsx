import { PicoPricingPage } from '@/components/pico/PicoPricingPage'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.pricing.meta', '/pricing')
}

export default function PricingPage() {
  return <PicoPricingPage />
}
