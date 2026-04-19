import { PicoSupportPageClient } from '@/components/pico/PicoSupportPageClient'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.support.meta', '/support')
}

export default function PicoSupportPage() {
  return <PicoSupportPageClient />
}
