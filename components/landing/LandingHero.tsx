import Image from 'next/image'
import { ArrowRight, BookOpen, Command, ShieldCheck, Sparkles, TerminalSquare } from 'lucide-react'

import { FloatLayer, TraceSweep } from './MotionPrimitives'

type LandingHeroProps = {
  className?: string
  appHref?: string
  docsHref?: string
  repoHref?: string
  eyebrow?: string
  title?: string
  accent?: string
  kicker?: string
  description?: string
}

const defaultTitle = 'Agents are a blast.'
const defaultAccent = 'Production is the boss fight.'
const defaultKicker = 'MUTX is the loadout.'
const defaultDescription =
  'Deploy, govern, trace, replay, and recover from one fast operator lane. Keep the magic. Lose the haunted infrastructure.'

const statTape = [
  { value: '1', label: 'control surface' },
  { value: '4', label: 'operator loops' },
  { value: '0', label: 'dead-end demos' },
]

const proofCards = [
  {
    title: 'Deploy with receipts',
    body: 'Versions, rollbacks, and ownership should look like product behavior, not oral history.',
  },
  {
    title: 'Govern in the open',
    body: 'Auth, keys, routes, and approvals belong beside deploy and recovery, not in another tool.',
  },
  {
    title: 'Trace to intervene',
    body: 'Runs and traces matter most when they sit one click away from an operator action.',
  },
]

const consoleLines = [
  '$ mutx deploy restart checkout-bot --env prod',
  '$ mutx traces inspect run_4021 --follow',
  '$ mutx webhooks replay whd_91 --latest',
]

const postureRows = [
  { label: 'fleet posture', value: 'steady' },
  { label: 'deploy queue', value: '2 warming' },
  { label: 'trace p95', value: '184ms' },
]

function HeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050d14] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <div className="relative min-h-[28rem] sm:min-h-[34rem] lg:min-h-[42rem]">
        <Image
          src="/landing/webp/running-agent.webp"
          alt="MUTX robot running at full speed"
          fill
          priority
          sizes="(max-width: 1279px) 100vw, 48vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(5,13,20,0.02),rgba(5,13,20,0.78))]" />
        <TraceSweep className="pointer-events-none absolute left-[-10%] top-[22%] h-px w-48 bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent blur-[1px]" delay={0.2} />

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100 sm:left-5 sm:top-5">
          <Sparkles className="h-3.5 w-3.5" />
          live-ish product fantasy
        </div>

        <FloatLayer className="absolute right-4 top-16 hidden w-[13rem] rounded-[1.4rem] border border-white/12 bg-[#08111bcc]/88 p-3 backdrop-blur-xl sm:block lg:right-5 lg:top-20">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/48">operator tape</div>
          <div className="mt-3 space-y-2">
            {postureRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/44">{row.label}</div>
                <div className="mt-1 text-sm font-semibold text-white">{row.value}</div>
              </div>
            ))}
          </div>
        </FloatLayer>

        <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/12 bg-[#07121ccc]/88 p-4 backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/48">operator console</div>
              <div className="mt-1 text-sm font-semibold text-white">One tight loop. No context switching tax.</div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-300/22 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              posture governed
            </div>
          </div>

          <div className="mt-4 space-y-2 font-[family:var(--font-mono)] text-[11px] text-cyan-100 sm:text-xs">
            {consoleLines.map((line) => (
              <div key={line} className="rounded-[1rem] border border-white/10 bg-black/28 px-3 py-2.5">
                <span className="mr-2 text-cyan-300">$</span>
                <span className="text-white">{line.replace(/^\$\s/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingHero({
  className,
  appHref = 'https://app.mutx.dev/login',
  docsHref = 'https://docs.mutx.dev',
  repoHref = 'https://github.com/fortunexbt/mutx-dev',
  eyebrow = 'No slop. No dead ends.',
  title = defaultTitle,
  accent = defaultAccent,
  kicker = defaultKicker,
  description = defaultDescription,
}: LandingHeroProps) {
  return (
    <section className={`site-panel-strong relative overflow-hidden p-4 sm:p-6 lg:p-7 ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(96,165,250,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.01),transparent)]" />

      <div className="site-grid-two relative z-10">
        <div className="rounded-[1.7rem] border border-white/10 bg-[#07121ccc] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
              mutx
            </div>
            <div className="rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              {eyebrow}
            </div>
          </div>

          <div className="mt-7 max-w-3xl">
            <h1 className="text-[2.95rem] font-semibold leading-[0.92] tracking-[-0.07em] text-white sm:text-[4.35rem] xl:text-[5.6rem]">
              <span className="block">{title}</span>
              <span className="mt-2 block text-white/76">{accent}</span>
              <span className="mt-3 block bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-100 bg-clip-text text-transparent">
                {kicker}
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-[1.15rem] sm:leading-9">{description}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href={appHref} className="site-button-primary">
              Enter the control plane
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={docsHref} className="site-button-secondary" target="_blank" rel="noreferrer">
              Read the docs
              <BookOpen className="h-4 w-4" />
            </a>
            <a href={repoHref} className="site-button-secondary" target="_blank" rel="noreferrer">
              <Command className="h-4 w-4" />
              View source
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {['deployments', 'runs', 'traces', 'webhooks', 'keys', 'health', 'routes'].map((pill) => (
              <span key={pill} className="site-chip">
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {statTape.map((stat) => (
              <div key={stat.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-3xl font-semibold tracking-[-0.06em] text-cyan-100">{stat.value}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/46">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 grid gap-3">
            {proofCards.map((card) => (
              <div key={card.title} className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-base font-semibold tracking-tight text-white">{card.title}</div>
                <div className="mt-1 text-sm leading-6 text-white/62">{card.body}</div>
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          { label: 'control surface', value: 'app + api + cli + docs' },
          { label: 'operator verbs', value: 'deploy · govern · replay · recover' },
          { label: 'runtime mood', value: 'serious infra, still fun to use' },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/46">{item.label}</div>
            <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/24 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-[15%] right-[15%] h-20 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-2 rounded-full border border-white/10 bg-[#08111bcc] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/48 lg:inline-flex">
        <TerminalSquare className="h-3.5 w-3.5 text-cyan-200" />
        fake demos, real product posture
      </div>
    </section>
  )
}
