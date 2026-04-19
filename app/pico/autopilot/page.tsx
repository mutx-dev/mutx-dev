import { PicoAutopilotPageClient } from '@/components/pico/PicoAutopilotPageClient'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.autopilot.meta', '/autopilot')
}

export default function PicoAutopilotPage() {
  return <PicoAutopilotPageClient />
}
