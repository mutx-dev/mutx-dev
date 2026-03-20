import Link from 'next/link'
import { IBM_Plex_Sans, Syne } from 'next/font/google'
import {
  ArrowRight,
  BookOpen,
  Cable,
  ExternalLink,
  Github,
  HeartPulse,
  Radio,
  Rocket,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ComingSoonButton } from '@/components/landing/ComingSoonButton'
import { ControlLoopTabs } from '@/components/landing/ControlLoopTabs'
import { MotionIn } from '@/components/landing/MotionPrimitives'
import { OperatorSurfacePreview } from '@/components/landing/OperatorSurfacePreview'
import { QuickstartTabs } from '@/components/landing/QuickstartTabs'

const displayFont = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-landing-display',
})

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-landing-body',
})

const GITHUB_URL = 'https://github.com/mutx-dev/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'

const navLinks = [
  { label: 'Quickstart', href: '#quickstart' },
  { label: 'Control Loop', href: '#control-loop' },
  { label: 'Stack', href: '#stack' },
] as const

const heroSignals = [
  { label: 'Starter', value: 'Personal Assistant' },
  { label: 'Runtime', value: 'OpenClaw-backed' },
  { label: 'Contract', value: 'FastAPI /v1' },
  { label: 'Surfaces', value: 'Web + CLI + TUI' },
] as const

const powerTiles = [
  {
    title: 'Sessions',
    body: 'Live assistant state, not a chat demo.',
    icon: Radio,
  },
  {
    title: 'Skills',
    body: 'Workspace installs and removals stay operable.',
    icon: Rocket,
  },
  {
    title: 'Channels',
    body: 'Bindings and policy live inside the control plane.',
    icon: Cable,
  },
  {
    title: 'Health',
    body: 'Gateway posture stays visible across every surface.',
    icon: HeartPulse,
  },
] as const

const stackColumns = [
  {
    title: 'Runtime',
    items: ['OpenClaw-backed assistant', 'sessions', 'skills', 'channels', 'wakeups'],
  },
  {
    title: 'Control plane',
    items: ['/v1/templates', '/v1/assistant', '/v1/sessions', '/v1/deployments', '/v1/auth'],
  },
  {
    title: 'Operator surfaces',
    items: ['web control plane', 'mutx setup', 'mutx doctor', 'mutx assistant', 'mutx tui'],
  },
] as const

type SectionHeadingProps = {
  label: string
  title: string
  body?: string
}

function SectionHeading({ label, title, body }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
        {label}
      </div>
      <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">{body}</p> : null}
    </div>
  )
}

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050c14]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            MX
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.34em] text-slate-200">MUTX Control</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Landing page">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-slate-400 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] sm:inline-flex"
          >
            Sign in
          </Link>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] md:inline-flex"
          >
            Docs
          </a>
          <a
            href="#quickstart"
            className="inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300"
          >
            Launch
          </a>
        </div>
      </div>
    </header>
  )
}

type PowerTileProps = {
  title: string
  body: string
  icon: LucideIcon
}

function PowerTile({ title, body, icon: Icon }: PowerTileProps) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-5 w-5 text-cyan-300" />
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          live
        </span>
      </div>
      <h3 className="mt-5 font-[family:var(--font-landing-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{body}</p>
    </article>
  )
}

export default function LandingPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#03070d] text-white [font-family:var(--font-landing-body)]`}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(251,191,36,0.12),transparent_18%),linear-gradient(180deg,#07111a_0%,#03070d_52%,#02060b_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_56px)]" />
        <div className="absolute left-[-8%] top-[4%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/12 blur-[110px]" />
        <div className="absolute right-[-10%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-[120px]" />
      </div>

      <LandingNav />

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
              <MotionIn>
                <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(145deg,rgba(7,19,31,0.96)_0%,rgba(4,11,19,0.92)_58%,rgba(8,18,30,0.88)_100%)] p-7 shadow-[0_40px_120px_rgba(2,6,23,0.5)] sm:p-8 lg:p-10">
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_68%)]" />
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    Assistant-first control plane
                  </div>

                  <div className="mt-8 max-w-4xl">
                    <h1 className="font-[family:var(--font-landing-display)] text-5xl font-semibold leading-[0.9] tracking-[-0.09em] text-white sm:text-7xl xl:text-[6.3rem]">
                      Deploy the
                      <span className="block text-cyan-300">first assistant.</span>
                      <span className="block text-white/72">Own the runtime.</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
                      MUTX turns `Personal Assistant` into an operable runtime: sessions, skills, channels, health.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="#quickstart"
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_22px_48px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
                    >
                      Run quickstart
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Docs
                      <BookOpen className="h-4 w-4" />
                    </a>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {['Open source', 'OpenClaw runtime', 'FastAPI /v1', 'CLI + TUI + web'].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-9 overflow-hidden rounded-[28px] border border-white/10 bg-[#040b14]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Launch rail</p>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                        operator first
                      </span>
                    </div>
                    <div className="grid gap-4 px-4 py-5 md:grid-cols-[minmax(0,0.86fr)_minmax(16rem,1fr)]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick path</p>
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-slate-100">
{`make dev-up
mutx setup local
mutx doctor
mutx assistant overview`}
                        </pre>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {heroSignals.map((signal) => (
                          <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{signal.label}</p>
                            <p className="mt-2 text-sm font-semibold text-white">{signal.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </MotionIn>

              <MotionIn delay={0.06}>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[34px] border border-cyan-400/16 bg-[linear-gradient(180deg,rgba(11,21,33,0.96)_0%,rgba(5,11,18,0.92)_100%)] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.35)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Launch target</p>
                        <h2 className="mt-3 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.07em] text-white">
                          Personal
                          <span className="block text-cyan-300">Assistant</span>
                        </h2>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        template
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {['sessions', 'skills', 'channels', 'health', 'deployments'].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">What it proves</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        One assistant. Real runtime. Real control surfaces.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {powerTiles.map((tile, index) => (
                      <MotionIn key={tile.title} delay={0.08 + index * 0.03}>
                        <PowerTile {...tile} />
                      </MotionIn>
                    ))}
                  </div>
                </div>
              </MotionIn>
            </div>

            <MotionIn className="mt-8" delay={0.12}>
              <OperatorSurfacePreview />
            </MotionIn>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Quickstart"
                title="Install. Auth. Deploy. Inspect."
                body="One end state: a live assistant."
              />
            </MotionIn>

            <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
              <MotionIn>
                <QuickstartTabs />
              </MotionIn>

              <div className="grid gap-5">
                <MotionIn delay={0.05}>
                  <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_28px_90px_rgba(2,6,23,0.24)]">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.06em] text-white">
                        What MUTX owns
                      </h3>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        control plane live
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        'starter deployment',
                        'assistant sessions',
                        'workspace skills',
                        'channel policy',
                        'gateway health',
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-slate-500">owned</span>
                          <span className="text-sm font-semibold text-white">{item}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </MotionIn>

                <MotionIn delay={0.1}>
                  <article className="rounded-[30px] border border-cyan-400/16 bg-[linear-gradient(180deg,rgba(34,211,238,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">No dead-end onboarding</p>
                    <p className="mt-4 text-lg leading-8 text-white">
                      Installer, docs, CLI, TUI, web. Same contract.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={DOCS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                      >
                        Read docs
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <ComingSoonButton label="Hosted app status" />
                    </div>
                  </article>
                </MotionIn>
              </div>
            </div>
          </div>
        </section>

        <section id="control-loop" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Control Loop"
                title="Observe. Orchestrate. Automate."
                body="One stack. No drift."
              />
            </MotionIn>

            <MotionIn className="mt-12" delay={0.08}>
              <ControlLoopTabs />
            </MotionIn>
          </div>
        </section>

        <section id="stack" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
              <MotionIn>
                <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.24)] lg:p-8">
                  <SectionHeading
                    label="Stack"
                    title="What ships right now."
                    body="FastAPI control plane. OpenClaw-backed assistant. Web, CLI, TUI."
                  />

                  <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {stackColumns.map((column) => (
                      <article key={column.title} className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{column.title}</p>
                        <div className="mt-5 space-y-2">
                          {column.items.map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </MotionIn>

              <MotionIn delay={0.06}>
                <div className="grid gap-4">
                  <article className="rounded-[32px] border border-cyan-400/16 bg-[linear-gradient(145deg,rgba(7,20,31,0.96)_0%,rgba(5,11,18,0.92)_100%)] p-6 shadow-[0_28px_90px_rgba(2,6,23,0.28)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Why it hits harder</p>
                    <h3 className="mt-4 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.07em] text-white">
                      Not a dashboard skin.
                    </h3>
                  </article>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      'Assistant-first onboarding',
                      'Mounted `/v1/*` truth',
                      'One-shot starter deployment',
                      'Terminal fallback always live',
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-5 text-lg font-semibold tracking-[-0.04em] text-white"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </MotionIn>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <div className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12)_0%,rgba(255,255,255,0.03)_42%,rgba(251,191,36,0.08)_100%)] p-6 shadow-[0_34px_110px_rgba(2,6,23,0.28)] lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] lg:items-end">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Launch now</p>
                    <h2 className="mt-4 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                      Run the stack.
                      <span className="block text-white/72">Launch the assistant.</span>
                    </h2>
                    <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-[26px] border border-white/10 bg-[#04101a] px-5 py-5 font-mono text-[13px] leading-7 text-slate-100">
{`make dev-up
mutx setup local
mutx doctor
mutx assistant overview`}
                    </pre>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="#quickstart"
                      className="flex items-center justify-between rounded-[22px] border border-cyan-400/20 bg-cyan-400 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Open quickstart
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Read docs
                      <BookOpen className="h-5 w-5 text-slate-500" />
                    </a>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Star on GitHub
                      <ExternalLink className="h-5 w-5 text-slate-500" />
                    </a>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {['MIT licensed', 'Self-hosted first', 'assistant-first', 'docs are canonical'].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </MotionIn>

            <footer className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono uppercase tracking-[0.28em] text-slate-300">MUTX Control</span>
                <span>Open Source</span>
                <span>MIT License</span>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  GitHub
                </a>
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Documentation
                </a>
                <Link href="/login" className="transition hover:text-white">
                  Sign in
                </Link>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
