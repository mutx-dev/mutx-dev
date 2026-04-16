import { PicoFooter } from '@/components/pico/PicoFooter'
import { PicoLandingPoster } from '@/components/pico/PicoLandingPoster'
import { PublicSurface } from '@/components/site/PublicSurface'

export function PicoLandingSurface() {
  return (
    <PublicSurface>
      <PicoLandingPoster />
      <PicoFooter />
    </PublicSurface>
  )
}
