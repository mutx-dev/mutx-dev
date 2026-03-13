'use client'

import {
  ArrowRight,
  BookOpen,
  Boxes,
  Database,
  Github,
  GitBranch,
  HeartPulse,
  KeyRound,
  Layers3,
  Server,
  Shield,
  Webhook,
} from 'lucide-react'
import Image from 'next/image'

import { AnimatedTerminal } from '@/components/AnimatedTerminal'
import { WaitlistForm } from '@/components/WaitlistForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const TWITTER_URL = 'https://x.com/mutxdev'

const navItems = [
  { label: 'Surface', href: '#surface' },
  { label: 'Routes', href: '#routes' },
  { label: 'Docs', href: DOCS_URL, external: true },
  { label: 'GitHub', href: GITHUB_URL, external: true },
  { label: 'Contact', href: '/contact' },
]

const pillars = [
  {
    icon: Shield,
    title: 'Auth and ownership',
    description: 'Current user flows, token auth, ownership-aware agent routes, and API key lifecycle management are already part of the live contract.',
  },
  {
    icon: Boxes,
    title: 'Agents and deployments',
    description: 'Agent records, deployment surfaces, deployment events, and operator-visible status are modeled as product routes instead of one-off scripts.',
  },
  {
    icon: HeartPulse,
    title: 'Health and runtime truth',
    description: 'Health, readiness, logs, metrics, and heartbeat-oriented runtime status give operators a real place to inspect system state.',
  },
  {
    icon: Webhook,
    title: 'Webhook ingestion',
    description: 'Inbound webhook handling and outbound event direction are part of the control-plane shape, not an afterthought bolted onto demos.',
  },
]

const routes = [
  {
    icon: Server,
    title: 'FastAPI control plane',
    description: 'Live route groups cover auth, agents, deployments, API keys, webhook ingestion, newsletter capture, health, and readiness.',
  },
  {
    icon: KeyRound,
    title: 'CLI and SDK workflows',
    description: 'The repo ships a Python CLI and SDK so the same control-plane surface can be driven from terminals, scripts, and product UI.',
  },
  {
    icon: Layers3,
    title: 'Web and app surfaces',
    description: 'The site, app-facing routes, same-origin proxies, and public docs all live together so product truth is inspectable in one place.',
  },
  {
    icon: Database,
    title: 'Infra in repo',
    description: 'Docker, Railway, Terraform, and Ansible live alongside the product code so deployment and operator workflow do not disappear behind slides.',
  },
]

const proof = [
  'Docs and route references are public.',
  'GitHub exposes the current product contract.',
  'Web, API, CLI, SDK, and infra move in one repo.',
  'Current-state language is preferred over aspirational marketing.',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold tracking-[0.22em] text-white/90">MUTX</span>
          </div>

          <div className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-white/60 transition-colors hover:text-white">
              <Github className="h-5 w-5" />
            </a>
            <a href={TWITTER_URL} target="_blank" rel="noreferrer" aria-label="X" className="text-white/60 transition-colors hover:text-white">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.54l-5.12-6.69L5.24 22H2l7.6-8.69L1.25 2h6.71l4.63 6.1L18.244 2Zm-1.147 18h1.803L6.98 3.894H5.045L17.097 20Z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-5 pb-16 pt-24 sm:px-6 md:pb-20 md:pt-28 lg:pb-24 lg:pt-32">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:gap-12">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/90 sm:text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                Current-state docs, routes, and operator surface
              </div>

              <h1 className="max-w-4xl text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-[4.2rem] lg:leading-[0.94]">
                Operate AI agents with real control.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
                MUTX gives teams a control plane for agent auth, deployments, API keys, webhook ingestion, health, readiness, and operator workflows across web, API, CLI, and SDK surfaces.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  Read the docs
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Inspect the repo
                  <GitBranch className="h-4 w-4 opacity-80" />
                </a>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {proof.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <ArrowRight className="h-3 w-3 text-cyan-200" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <AnimatedTerminal />
            </div>
          </div>
        </section>

        <section id="surface" className="border-t border-white/10 bg-[#050505] px-5 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex max-w-3xl flex-col gap-4">
              <div className="eyebrow w-fit">Control-plane surface</div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">The parts operators actually need.</h2>
              <p className="text-base leading-7 text-white/62 sm:text-lg">
                The strongest current surface is not a promise deck. It is the set of routes, workflows, and operator primitives already visible in the repo and docs.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 transition-colors hover:bg-[#111111]">
                  <pillar.icon className="mb-4 h-5 w-5 text-cyan-100" />
                  <h3 className="mb-2 text-base font-medium text-white">{pillar.title}</h3>
                  <p className="text-sm leading-6 text-white/60">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="routes" className="px-5 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="max-w-xl">
              <div className="eyebrow mb-4">Live route shape</div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Web, API, CLI, SDK, and infra stay in one frame.</h2>
              <p className="mt-4 text-base leading-7 text-white/62 sm:text-lg">
                MUTX is most credible when the public site matches the implementation. That means auth, agents, deployments, API keys, webhooks, health, and readiness are described the same way they are shipped.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {routes.map((route) => (
                <div key={route.title} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <route.icon className="mb-4 h-5 w-5 text-white/85" />
                  <h3 className="mb-2 text-base font-medium text-white">{route.title}</h3>
                  <p className="text-sm leading-6 text-white/60">{route.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050505] px-5 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12">
            <div className="max-w-xl">
              <div className="eyebrow mb-4">Operator entry points</div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Start with docs and source. Use the form when you need the hosted path.</h2>
              <p className="mt-4 text-base leading-7 text-white/62 sm:text-lg">
                The fastest way to understand MUTX is still the docs, route references, and repo. If you want launch updates, hosted access, or a direct fit conversation, use the contact and waitlist path.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="stat-pill transition hover:border-white/20 hover:bg-white/10">
                  Docs
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="stat-pill transition hover:border-white/20 hover:bg-white/10">
                  GitHub
                </a>
                <a href="/contact" className="stat-pill transition hover:border-white/20 hover:bg-white/10">
                  Contact
                </a>
              </div>
            </div>

            <div className="max-w-lg lg:justify-self-end">
              <WaitlistForm source="hero" compact />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
