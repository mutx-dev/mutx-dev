import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import s from './page.module.css'
import { PicoWipReturn } from '@/components/pico/PicoWipReturn'

export const metadata: Metadata = {
  title: 'PicoMUTX page is preparing',
  description: 'The PicoMUTX academy and product pages are still being prepared.',
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
      <PicoWipReturn />
      <div className={s.shell}>
        <section className={s.hero}>
          <div className={s.copy}>
            <p className={s.kicker}>PicoMUTX page guard</p>
            <h1 className={s.title}>This page is still being prepared.</h1>
            <p className={s.subtitle}>
              The academy, tutor, support, autopilot, pricing, login, and account paths are still
              private while the public waitlist opens back up.
            </p>
            <div className={s.actions}>
              <Link href="/" className={s.primaryLink}>
                Back to waitlist
              </Link>
              <p className={s.notice}>Returning you in a moment.</p>
            </div>
          </div>

          <div className={s.visual}>
            <div className={s.bubble} data-testid="pico-wip-speech">
              You&apos;re not supposed to be here!
            </div>
            <Image
              src="/pico/robot/point.png"
              alt="PicoMUTX robot pointing visitors back to the waitlist"
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
