import { PicoTutorPageClient } from '@/components/pico/PicoTutorPageClient'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.tutor.meta', '/tutor')
}

export default function PicoTutorPage() {
  return <PicoTutorPageClient />
}
