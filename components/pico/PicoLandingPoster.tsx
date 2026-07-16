'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

import s from './PicoLandingPoster.module.css'
import { PicoContactForm } from './PicoContactForm'
import { PicoLangSwitcher } from './PicoLangSwitcher'

export function PicoLandingPoster() {
  const t = useTranslations('pico')
  const [formOpen, setFormOpen] = useState(false)
  const steps = Array.from({ length: 3 }, (_, index) => ({
    title: t(`platform.howItWorks.${index}.title`),
    body: t(`platform.howItWorks.${index}.body`),
  }))

  return (
    <div data-testid="pico-landing" className={s.page}>
      <PicoContactForm open={formOpen} onClose={() => setFormOpen(false)} source="pico-waitlist" />
      <header className={s.nav}>
        <Link href="/" className={s.brand}>PICO<span>/ MUTX</span></Link>
        <nav aria-label="Pico navigation">
          <a href="#method">Method</a>
          <PicoLangSwitcher />
          <button type="button" onClick={() => setFormOpen(true)}>Request access</button>
        </nav>
      </header>

      <main id="main-content">
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <p>Setup, unstuck.</p>
            <h1>{t('hero.title')}<br /><span>{t('hero.titleAccent')}</span></h1>
            <p className={s.lede}>{t('hero.subtitle')}</p>
            <div className={s.heroActions}>
              <button type="button" className={s.primaryLink} onClick={() => setFormOpen(true)}>Request access <ArrowRight /></button>
              <a href="#method">See how it works</a>
            </div>
          </div>
          <div className={s.pMark} aria-hidden="true">P</div>
        </section>

        <section className={s.statement}>
          <p>From stuck</p><p>to shipped.</p>
        </section>

        <section id="method" className={s.method}>
          <header><p>Three moves</p><h2>Clear the path.</h2></header>
          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={s.final}>
          <p>Stop debugging setup.</p>
          <div className={s.finalActions}>
            <button type="button" onClick={() => setFormOpen(true)}>Request access <ArrowRight /></button>
          </div>
        </section>
      </main>
    </div>
  )
}
