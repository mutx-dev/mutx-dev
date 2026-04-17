import Image from 'next/image'
import Link from 'next/link'

import s from './page.module.css'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'

const FOUNDER_CALL_URL = 'https://calendly.com/mutxdev'

export async function generateMetadata() {
  return buildPicoPageMetadata('pico.pages.wip.meta', '/wip')
}

export default function PicoWipPage() {
  return (
    <div className={s.root} data-testid="pico-host-guard">
      <div className={s.shell}>
        <section className={s.hero}>
          <div>
            <p className={s.kicker}>Public route guard</p>
            <h1 className={s.title}>Oops. You should not be here.</h1>
            <p className={s.subtitle}>
              `pico.mutx.dev` is just the Pico waitlist landing right now. This route is not public.
              Head back to the landing, join the waitlist, or book a founder call if you want help
              choosing the right lane.
            </p>
            <div className={s.links}>
              <Link href="/" className={s.primaryLink}>
                Back to Pico landing
              </Link>
              <a
                href={FOUNDER_CALL_URL}
                target="_blank"
                rel="noreferrer"
                className={s.secondaryLink}
              >
                Book founder call
              </a>
            </div>
          </div>

          <div className={s.visual}>
            <Image
              src="/pico/robot/guide.png"
              alt="PicoMUTX robot blocking access to a private route"
              width={320}
              height={320}
              className={s.robot}
              priority
            />
          </div>
        </section>
      </div>
    </div>
  )
}
