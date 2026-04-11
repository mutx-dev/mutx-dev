import { PicoFooter } from '@/components/pico/PicoFooter'
import { PicoLandingPage } from '@/components/pico/PicoLandingPage'
import { PublicSurface } from '@/components/site/PublicSurface'

export function PicoLandingSurface() {
  return (
    <PublicSurface>
      <PicoLandingPage />
      <PicoFooter />
    </PublicSurface>
  )
}
