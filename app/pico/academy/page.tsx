import { PicoAcademyDashboard } from '@/components/pico/PicoAcademyDashboard'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.academy.meta', '/academy')
}

export default function PicoAcademyPage() {
  return <PicoAcademyDashboard />
}
