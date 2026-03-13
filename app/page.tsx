'use client'

import Image from 'next/image'
import { ArrowRight, Github, ShieldCheck, Activity, KeyRound, Webhook } from 'lucide-react'

import { AnimatedTerminal } from '@/components/AnimatedTerminal'
import { WaitlistForm } from '@/components/WaitlistForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const X_URL = 'https://x.com/mutxdev'

const links = [
  { label: 'docs', href: DOCS_URL },
  { label: 'github', href: GITHUB_URL },
  { label: 'contact', href: '/contact' },
]


const featureCards = [
  {
    icon: ShieldCheck,
    title: 'real auth boundaries',
    body: 'Operator sessions, ownership-aware access, and non-browser authentication flows without fake screenshots.',
  },
  {
    icon: Activity,
    title: 'health that matches reality',
    body: 'Expose deployment readiness, degraded paths, and recovery state from the same operator surface teams actually use.',
  },
  {
    icon: KeyRound,
    title: 'api key lifecycle',
    body: 'Generate, rotate, and revoke keys with quota awareness so demos map cleanly to production workflows.',
  },
  {
    icon: Webhook,
    title: 'event and webhook control',
    body: 'Coordinate inbound events, deployments, and downstream automation from one control plane instead of glue code theater.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.07),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.10),transparent_26%),linear-gradient(180deg,#050505_0%,#000_55%,#050505_100%)]" />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">MUTX</span>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/55 md:flex">
            {links.map((item) => (
              <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 text-white/60">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className="transition hover:text-white">
              <Github className="h-5 w-5" />
            </a>
            <a href={X_URL} target="_blank" rel="noreferrer" aria-label="X" className="transition hover:text-white">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.54l-5.12-6.69L5.24 22H2l7.6-8.69L1.25 2h6.71l4.63 6.1L18.244 2Zm-1.147 18h1.803L6.98 3.894H5.045L17.097 20Z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <main className="relative px-5 pb-20 pt-28 sm:px-6 md:pt-32 lg:pt-36">
        <section className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
              open-source agent control plane
            </div>

            <h1 className="max-w-4xl text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-[4.5rem] lg:leading-[0.92]">
              run ai agents like production systems.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
              MUTX is the control plane for teams running agent workloads with real auth, deployment flow, health truth, webhook routing, and operator-grade interfaces.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90">
                read docs
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]">
                inspect repo
              </a>
            </div>

            <div className="mt-8 max-w-xl">
              <WaitlistForm source="hero" compact />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {featureCards.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
                  <div className="mb-3 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <AnimatedTerminal />
          </div>
        </section>
      </main>
    </div>
  )
}
