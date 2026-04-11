import { PicoFooter } from '@/components/site/pico/PicoFooter'
import { PicoLandingPage } from '@/components/site/pico/PicoLandingPage'
import { PublicSurface } from '@/components/site/PublicSurface'

export function PicoLandingSurface() {
  return (
    <PublicSurface>
      <PicoLandingPage />
      <PicoFooter />
    </PublicSurface>
  )
}
