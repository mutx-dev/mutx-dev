'use client'

import Image from 'next/image'
import { ArrowRight, Github, ShieldCheck, Activity, KeyRound, Webhook, PlayCircle, LayoutDashboard, ServerCog, TerminalSquare } from 'lucide-react'

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

const operatorSignals = [
  { label: 'auth', value: 'ownership-scoped sessions' },
  { label: 'deployments', value: 'truthful runtime inventory' },
  { label: 'health', value: 'ready / degraded / recovering' },
  { label: 'events', value: 'webhook and automation flow' },
]

const proofPoints = [
  { label: 'operator dashboard', value: 'live auth + fleet + key lifecycle' },
  { label: 'public proof', value: 'docs, repo, and roadmap shipped in the open' },
  { label: 'lead capture', value: 'waitlist + institutional contact endpoints live' },
]

const liveStats = [
  { label: 'operator story', value: 'login → fleet → key → recovery' },
  { label: 'surface parity', value: 'landing, app, and cli stay aligned' },
  { label: 'demo mode', value: 'built for real operator walkthroughs' },
]

const walkthrough = [
  {
    icon: LayoutDashboard,
    title: 'dashboard truth',
    body: 'See the same deployment and agent state your operators will actually act on during a live demo.',
  },
  {
    icon: ServerCog,
    title: 'recovery loop',
    body: 'Surface degradation, queue recovery, and re-check health from a single control plane pass.',
  },
  {
    icon: TerminalSquare,
    title: 'cli parity',
    body: 'Keep the command path aligned with the operator UI so demos and production workflows stay coherent.',
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
        <section className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
              open-source agent control plane
            </div>

            <h1 className="max-w-4xl text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-[4.5rem] lg:leading-[0.92]">
              run ai agents with a control surface operators can trust.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
              MUTX gives teams a production-facing path for agent auth, deployment flow, health truth, webhook routing, and demo-ready operator interfaces without pretending the hard parts are solved by vibes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90">
                read docs
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]">
                inspect repo
              </a>
              <a href="#walkthrough" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15">
                <PlayCircle className="h-4 w-4" />
                view demo path
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {operatorSignals.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/38">{item.label}</p>
                  <p className="mt-2 text-sm text-white/78">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {liveStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/60">{item.label}</p>
                  <p className="mt-2 text-sm text-white/82">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-xl">
              <WaitlistForm source="hero" compact />
            </div>

            <div className="mt-8 rounded-[28px] border border-cyan-400/15 bg-cyan-400/[0.06] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">live demo path</p>
                  <h2 className="mt-2 text-xl font-medium text-white sm:text-2xl">Open the exact surfaces the story depends on.</h2>
                </div>
                <a href="/app" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-black/30 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/40 hover:bg-black/45">
                  open operator app
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {proofPoints.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">{item.label}</p>
                    <p className="mt-2 text-sm text-white/78">{item.value}</p>
                  </div>
                ))}
              </div>
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

        <section id="walkthrough" className="mx-auto mt-20 max-w-6xl rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.32)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">demo walkthrough</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
                A clean operator story from login to recovery.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/58 sm:text-base">
                The landing surface now points directly at the product story: authenticate, inspect runtime truth, react to degradation, and move between UI and CLI without losing operator context.
              </p>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">demo checkpoints</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {proofPoints.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">{item.label}</p>
                      <p className="mt-2 text-sm text-white/78">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {walkthrough.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
