import type { Metadata } from 'next'
import Image from 'next/image'

import s from './page.module.css'

export const metadata: Metadata = {
  title: 'PicoMUTX beta opens soon',
  description: 'The PicoMUTX waitlist is closed while the beta is prepared.',
  alternates: {
    canonical: 'https://pico.mutx.dev',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function PicoWipPage() {
  return (
    <div className={s.root} data-testid="pico-host-guard">
      <div className={s.shell}>
        <section className={s.hero}>
          <div>
            <p className={s.kicker}>PicoMUTX beta</p>
            <h1 className={s.title}>Waitlist is closed.</h1>
            <p className={s.subtitle}>
              Waitlist is closed, beta opens soon. We are keeping pico.mutx.dev private while the
              product gets ready for real users.
            </p>
            <p className={s.notice}>
              Signups, login, and OAuth routes are unavailable on this host for now.
            </p>
          </div>

          <div className={s.visual}>
            <Image
              src="/pico/robot/guide.png"
              alt="PicoMUTX robot holding the beta gate"
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
