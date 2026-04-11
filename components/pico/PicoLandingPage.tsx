'use client'

import Link from 'next/link'

import { WaitlistForm } from '@/components/WaitlistForm'
import { PicoLangSwitcher } from '@/components/pico/PicoLangSwitcher'

export function PicoLandingPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <nav className="border-b border-white/10 bg-[rgba(4,10,20,0.72)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="https://pico.mutx.dev" className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">PM</span>
            <span>
              PicoMUTX
              <span className="ml-2 text-[11px] font-medium tracking-[0.18em] text-slate-400">by MUTX</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <PicoLangSwitcher />
            <a
              href="#waitlist"
              className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
            >
              Pre-register
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
            <div>
              <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                Closed for now · Waitlist only
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                PicoMUTX is closed right now.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                We are not accepting product access at the moment. If you want first access when Pico reopens,
                pre-register here and we will invite people in controlled waves.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#waitlist"
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Pre-register
                </a>
                <a
                  href="#waitlist"
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Join the waitlist
                </a>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  No workspace access
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  No academy access
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  Waitlist is the only entry point
                </div>
              </div>
            </div>

            <div id="waitlist" className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
              <WaitlistForm source="pico-landing" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
