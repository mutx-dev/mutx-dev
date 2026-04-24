import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.meta', '/')
}

export default function PicoPage() {
  return <PicoLandingSurface />
}
