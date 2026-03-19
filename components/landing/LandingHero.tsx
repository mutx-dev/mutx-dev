import Image from 'next/image'
import { BookOpen, Command, FileCode2, TerminalSquare } from 'lucide-react'

import { ComingSoonButton } from './ComingSoonButton'

type LandingHeroProps = {
  docsHref?: string
  repoHref?: string
}

const proofPoints = [
  'Open source',
  'FastAPI control plane',
  'CLI + TUI ship today',
  'Current API truth: /v1/*',
]

const capabilityRows = [
  { label: 'Control plane', value: 'Auth, agents, deployments, webhooks, health' },
  { label: 'Operator tooling', value: 'mutx CLI and mutx tui share the same auth state' },
  { label: 'Docs', value: 'Canonical docs and API reference live today' },
]

const commandPreview = [
  'mutx status',
  'mutx login --email test@local.dev --password TestPass123!',
  'mutx tui',
]

export function LandingHero({
  docsHref = 'https://docs.mutx.dev',
  repoHref = 'https://github.com/mutx-dev/mutx-dev',
}: LandingHeroProps) {
  return (
    <section className="site-panel-strong relative overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.12),transparent_22%),radial-gradient(circle_at_100%_10%,rgba(96,165,250,0.1),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

      <div className="site-grid-two relative z-10">
        <div className="rounded-[1.7rem] border border-white/10 bg-[#07121ccc] p-6 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="site-proof-chip">
              <FileCode2 className="h-3.5 w-3.5 text-cyan-200" />
              open source
            </span>
            <span className="site-proof-chip">
              <TerminalSquare className="h-3.5 w-3.5 text-cyan-200" />
              cli + tui
            </span>
          </div>

          <div className="mt-7 max-w-3xl">
            <h1 className="text-[3rem] font-semibold leading-[0.92] tracking-[-0.07em] text-white sm:text-[4.2rem] xl:text-[5.2rem]">
              <span className="block">Run AI agents like</span>
              <span className="block text-cyan-200">durable systems.</span>
              <span className="mt-2 block text-white/76">Not disposable demos.</span>
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-[1.1rem] sm:leading-9">
            MUTX is the open-source control plane for teams shipping agents into real environments. FastAPI control plane, Python CLI, first-party TUI, docs, SDK, and the web app shell in one system.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#quickstart" className="site-button-primary">
              Run local quickstart
            </a>
            <a href={docsHref} className="site-button-secondary" target="_blank" rel="noreferrer">
              Read docs
              <BookOpen className="h-4 w-4" />
            </a>
            <a href={repoHref} className="site-button-secondary" target="_blank" rel="noreferrer">
              <Command className="h-4 w-4" />
              View GitHub
            </a>
            <ComingSoonButton label="Web dashboard" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {proofPoints.map((point) => (
              <span key={point} className="site-chip">
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="site-code-shell overflow-hidden">
          <div className="relative min-h-[18rem] border-b border-white/8 sm:min-h-[22rem]">
            <Image
              src="/landing/webp/wiring-bay.webp"
              alt="MUTX robot wiring up a runtime bay"
              fill
              priority
              sizes="(max-width: 1279px) 100vw, 46vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07121c] via-[#07121c]/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 rounded-[1.4rem] border border-white/12 bg-[#07121ccc]/90 p-4 backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/46">What ships today</div>
                  <div className="mt-1 text-sm font-semibold text-white">Real operator surfaces in repo, not just product fiction.</div>
                </div>
                <span className="site-status-soon">dashboard catching up</span>
              </div>

              <div className="mt-4 space-y-2">
                {capabilityRows.map((row) => (
                  <div key={row.label} className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/44">{row.label}</div>
                    <div className="mt-1 text-sm text-white/78">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/8 bg-[#06111bcc] p-4 md:grid-cols-[minmax(0,1.08fr)_minmax(16rem,0.92fr)]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/46">Operator commands</div>
              <div className="mt-3 space-y-2 font-[family:var(--font-mono)] text-xs text-cyan-100">
                {commandPreview.map((line) => (
                  <div key={line} className="rounded-[1rem] border border-white/10 bg-black/25 px-3 py-2.5">
                    <span className="mr-2 text-cyan-300">$</span>
                    <span className="text-white">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/46">Why this matters</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                The serious path today is local stack + CLI + TUI + docs. The hosted dashboard will arrive, but it should not be the only way to understand the product.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
