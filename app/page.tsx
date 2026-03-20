import Link from 'next/link'
import { IBM_Plex_Sans, Sora } from 'next/font/google'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CloudCog,
  ExternalLink,
  Github,
  KeyRound,
  Layers3,
  Radar,
  ShieldCheck,
  TerminalSquare,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ComingSoonButton } from '@/components/landing/ComingSoonButton'
import { ControlLoopTabs } from '@/components/landing/ControlLoopTabs'
import { MotionIn } from '@/components/landing/MotionPrimitives'
import { OperatorSurfacePreview } from '@/components/landing/OperatorSurfacePreview'
import { QuickstartTabs } from '@/components/landing/QuickstartTabs'

const displayFont = Sora({
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
  { label: 'Architecture', href: '#architecture' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'FAQ', href: '#faq' },
] as const

const heroStats = [
  {
    label: 'Public surfaces',
    value: '3',
    body: 'Marketing and docs are supported today. The hosted app shell is documented honestly as aspirational.',
  },
  {
    label: 'Mounted contract',
    value: '/v1/*',
    body: 'Backend routes, generated OpenAPI, and current CLI services still share the mounted namespace.',
  },
  {
    label: 'Platform layers',
    value: '4',
    body: 'Operator surface, control plane, programmatic interfaces, and infrastructure automation.',
  },
  {
    label: 'Operator paths',
    value: 'CLI + TUI + SDK',
    body: 'MUTX is usable before the hosted dashboard becomes the daily-driver interface.',
  },
] as const

const controlCards = [
  {
    title: 'See what every agent and deployment is doing now',
    eyebrow: 'observe',
    body: 'Unify deployments, health, logs, metrics, runs, traces, and event history so runtime truth stays inside one operator loop.',
    icon: Radar,
    points: [
      'Run History and Trace Explorer routes in the dashboard surface map',
      'Health, ready, metrics, and monitoring guidance already documented in-repo',
      'Background monitoring and recovery paths wired into heartbeat-based runtime behavior',
    ],
  },
  {
    title: 'Operate lifecycle and recovery instead of watching a session feed',
    eyebrow: 'orchestrate',
    body: 'Treat agents and deployments as separate resources with status, replicas, events, restart, scale, and delete semantics.',
    icon: CloudCog,
    points: [
      'Canonical deployment create flow plus event history, logs, and metrics',
      'Agent Registry and Deployments are explicit surfaces, not hidden side tables',
      'CLI and TUI keep the operator path moving when the browser is not enough',
    ],
  },
  {
    title: 'Turn runtime signals into governed automation',
    eyebrow: 'govern',
    body: 'Auth flows, API keys, webhooks, ingest routes, and infrastructure lanes make MUTX deeper than a control-room skin.',
    icon: ShieldCheck,
    points: [
      'User-scoped auth, session, verification, and password-reset flows',
      'Webhook delivery history, retries, and optional HMAC signatures',
      'Docker, Railway, Terraform, Ansible, and monitoring assets in one repo lane',
    ],
  },
] as const

const architectureColumns = [
  {
    title: 'Agent runtimes',
    eyebrow: 'sources',
    body: 'The control plane sits around the systems you already run.',
    items: ['LangChain agent', 'OpenClaw agent', 'n8n agent', 'runtime heartbeats', 'deployment status ingest'],
  },
  {
    title: 'MUTX control plane',
    eyebrow: 'core',
    body: 'Identity, deployments, runs, keys, hooks, and observability live here.',
    items: ['Auth + ownership', 'Deployments + events', 'Runs + traces', 'API keys', 'Webhook gateway', 'System health'],
  },
  {
    title: 'Surfaces and integrations',
    eyebrow: 'interfaces',
    body: 'Terminal, browser, docs, and telemetry stay tied to one product truth.',
    items: ['docs.mutx.dev', 'app shell preview', 'CLI + TUI', 'SDK + proxies', 'Prometheus + Grafana', 'OTEL + alerting'],
  },
] as const

const capabilityColumns = [
  {
    title: 'Operations',
    eyebrow: 'core control surfaces',
    cards: [
      {
        title: 'Agent Registry',
        body: 'The dashboard route map already positions agents as first-class resources rather than anonymous sessions.',
      },
      {
        title: 'Deployments',
        body: 'Lifecycle records expose restart, scale, delete, logs, metrics, and event history instead of burying rollout state.',
      },
      {
        title: 'Run History + Trace Explorer',
        body: 'Execution history and traces sit next to deployments so diagnosis stays close to the control plane.',
      },
    ],
  },
  {
    title: 'Integrations',
    eyebrow: 'interfaces + runtime hooks',
    cards: [
      {
        title: 'Webhook Gateway',
        body: 'Register user-managed destinations, inspect deliveries, retry failures, and validate signatures with HMAC support.',
      },
      {
        title: 'Ingest API',
        body: 'Report runtime status, deployment updates, and metrics back into MUTX with bearer auth or API keys.',
      },
      {
        title: 'CLI + TUI + SDK',
        body: 'Terminal and programmatic interfaces stay live alongside the browser shell, so operations never depend on one surface.',
      },
    ],
  },
  {
    title: 'Governance',
    eyebrow: 'keys + posture + infra',
    cards: [
      {
        title: 'Key Management',
        body: 'Create, revoke, and rotate operator keys instead of treating machine access as hidden setup trivia.',
      },
      {
        title: 'System Health',
        body: 'Health, readiness, metrics, and monitoring contracts keep the platform honest about what is actually working.',
      },
      {
        title: 'Infrastructure Automation',
        body: 'Docker, Railway, Terraform, Ansible, and monitoring assets stay in-repo so the runtime story never drifts from the code.',
      },
    ],
  },
] as const

const technicalSauce = [
  {
    title: 'Auth and ownership',
    body: 'Registration, login, refresh, logout, verify-email, forgot-password, and current-user routes already exist in the mounted backend.',
    icon: ShieldCheck,
  },
  {
    title: 'API keys as first-class resources',
    body: 'Create, delete, and rotate API keys as durable operator state.',
    icon: KeyRound,
  },
  {
    title: 'Webhook delivery history',
    body: 'Outbound notifications persist attempts, success state, error detail, retries, and optional HMAC signatures.',
    icon: Webhook,
  },
  {
    title: 'Runs and traces',
    body: 'Execution history has its own route families instead of being buried in the deployment view.',
    icon: TerminalSquare,
  },
  {
    title: 'Monitoring and OTEL',
    body: 'Prometheus, Grafana, Alertmanager, Tempo, Jaeger, and OTLP collectors are part of the current repo story.',
    icon: Activity,
  },
  {
    title: 'App surface map',
    body: 'The operator shell is already organized around Overview, Agents, Deployments, Runs, Traces, Webhooks, API keys, and Monitoring.',
    icon: Layers3,
  },
] as const

const faqItems = [
  {
    q: 'What is MUTX?',
    a: 'MUTX is an open-source control plane for AI agents. It focuses on the operational layer around agent systems: identity, ownership, deployments, keys, webhooks, observability, and honest surface boundaries.',
  },
  {
    q: 'What is actually live today?',
    a: 'The public site, docs, mounted FastAPI control plane, install path, CLI, and TUI are real. The app shell exists and is useful for positioning, but the repo still documents it as an aspirational operator surface rather than a fully write-complete dashboard.',
  },
  {
    q: 'Is the API really mounted under `/v1/*` right now?',
    a: 'Yes. The current backend source, generated OpenAPI snapshot, and CLI services still reflect the `/v1/*` namespace, so the landing page should describe that current truth.',
  },
  {
    q: 'Why is MUTX deeper than a Mission Control-style dashboard?',
    a: 'Because the product is not only the screen. MUTX models user ownership, deployment lifecycle, API keys, webhook destinations, ingest routes, runs, traces, and infrastructure automation as part of the same control-plane system.',
  },
  {
    q: 'Do I need the hosted app to use MUTX?',
    a: 'No. The serious path today is docs + API + CLI + TUI. The browser shell is useful, but it is not the only or even the most mature operational path.',
  },
  {
    q: 'Can I self-host it?',
    a: 'Yes. The repo is MIT licensed and ships infrastructure references across Docker, Railway, Terraform, Ansible, and monitoring tooling.',
  },
  {
    q: 'How do CLI, TUI, docs, and app fit together?',
    a: 'Docs are the canonical explanation surface. The mounted FastAPI backend is the contract. CLI and TUI are operator-first interfaces. The app shell is the browser-facing preview of the same product model.',
  },
  {
    q: 'What about managed hosting later?',
    a: 'That is a later surface, not the current product truth. MUTX should be strongest as a self-hosted, repo-backed control plane first, then grow hosted workflows without inventing a different story.',
  },
] as const

type SectionHeadingProps = {
  label: string
  title: string
  body: string
}

function SectionHeading({ label, title, body }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </div>
      <h2 className="mt-6 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.07em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-400">{body}</p>
    </div>
  )
}

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070d18]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-mono text-sm uppercase tracking-[0.34em] text-slate-100">
          MUTX Control
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
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] sm:inline-flex"
          >
            GitHub
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-violet-400/20 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-400/15 md:inline-flex"
          >
            Docs
          </a>
          <a
            href="#quickstart"
            className="inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300"
          >
            Quickstart
          </a>
        </div>
      </div>
    </header>
  )
}

type ControlCardProps = {
  title: string
  eyebrow: string
  body: string
  icon: LucideIcon
  points: readonly string[]
}

function ControlCard({ title, eyebrow, body, icon: Icon, points }: ControlCardProps) {
  return (
    <article className="h-full rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.16)]">
      <div className="flex items-center justify-between gap-4">
        <Icon className="h-6 w-6 text-cyan-300" />
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </span>
      </div>
      <h3 className="mt-6 text-[1.95rem] font-semibold tracking-[-0.05em] text-white">{title}</h3>
      <p className="mt-4 text-base leading-8 text-slate-400">{body}</p>
      <div className="mt-6 space-y-3">
        {points.map((point) => (
          <div key={point} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
            {point}
          </div>
        ))}
      </div>
    </article>
  )
}

export default function LandingPage() {
  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#050a13] text-white [font-family:var(--font-landing-body)]`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[2%] h-[38rem] w-[38rem] rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.85),transparent_92%)]" />
      </div>

      <LandingNav />

      <main className="relative z-10">
        <section className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-7xl">
            <MotionIn className="mx-auto max-w-5xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Open source • MIT • self-hosted first
              </div>
              <h1 className="mx-auto mt-8 max-w-6xl font-[family:var(--font-landing-display)] text-5xl font-semibold tracking-[-0.08em] text-white sm:text-7xl lg:text-[6.5rem] lg:leading-[0.92]">
                The open-source <span className="text-cyan-300">control plane</span> for AI agent operations.
              </h1>
              <p className="mx-auto mt-6 max-w-4xl text-xl leading-9 text-slate-400">
                MUTX gives agent teams durable deployments, user ownership, API keys, webhook delivery history,
                runtime ingest, runs, traces, and observability without pretending the browser dashboard is the whole
                product.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#quickstart"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_20px_44px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300"
                >
                  Run local quickstart
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </a>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-7 py-4 text-base font-semibold text-violet-100 transition hover:bg-violet-400/15"
                >
                  Read docs
                  <BookOpen className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {['auth + ownership', 'deployments + events', 'runs + traces', 'webhooks + ingest', 'CLI + TUI'].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </MotionIn>

            <MotionIn className="mt-14" delay={0.06}>
              <OperatorSurfacePreview />
            </MotionIn>

            <MotionIn className="mt-8 grid gap-4 lg:grid-cols-4" delay={0.1}>
              {heroStats.map((item) => (
                <article key={item.label} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                  <p className="mt-4 font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                    {item.value}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
                </article>
              ))}
            </MotionIn>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Quickstart"
                title="Start MUTX in under 10 minutes."
                body="One control plane, multiple operator paths. Install the CLI, boot the local stack, or work directly against the mounted `/v1/*` contract, then deploy `Personal Assistant` as the first real runtime."
              />
            </MotionIn>

            <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
              <MotionIn>
                <QuickstartTabs />
              </MotionIn>

              <div className="grid gap-5">
                <MotionIn delay={0.05}>
                  <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-3xl font-semibold tracking-[-0.05em] text-white">What you get right away</h3>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        control plane live
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[
                        {
                          title: 'Governed auth and ownership',
                          body: 'Operator login, session state, and key lifecycle are already part of the repo-backed product path.',
                        },
                        {
                          title: 'Deployment lifecycle',
                          body: 'Events, logs, metrics, restart, scale, and delete semantics exist as explicit routes and resources.',
                        },
                        {
                          title: 'Webhook + ingest contracts',
                          body: 'Runtime state can flow in through ingest, while outbound hooks persist delivery history, retries, and signatures.',
                        },
                        {
                          title: 'CLI and TUI handoff',
                          body: 'The terminal path is real today, so operators are not blocked on a hosted dashboard surface.',
                        },
                      ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                          <p className="text-lg font-semibold text-white">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-400">{item.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {['MIT licensed', 'Self-hosted first', 'Docs-backed', 'App preview later'].map((pill) => (
                        <span
                          key={pill}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </article>
                </MotionIn>

                <MotionIn delay={0.1}>
                  <article className="rounded-[30px] border border-white/10 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">Hosted later</p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                      Use the real control plane first.
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      The hosted app shell matters, but it should grow from the same product truth already visible in
                      the backend, docs, install path, CLI, and TUI.
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

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Why teams choose MUTX"
                title="Control the system behind your agents."
                body="Replace fragmented scripts, weak dashboards, and surface drift with one control-plane model for visibility, lifecycle, governance, and automation."
              />
            </MotionIn>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {controlCards.map((card, index) => (
                <MotionIn key={card.title} delay={0.04 * index}>
                  <ControlCard {...card} />
                </MotionIn>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Product walkthrough"
                title="See how teams run the assistant control loop."
                body="Move through observe, orchestrate, and automate to understand how MUTX fits daily operator work without splitting the browser, CLI, and TUI into different product stories."
              />
            </MotionIn>

            <MotionIn className="mt-12" delay={0.08}>
              <ControlLoopTabs />
            </MotionIn>
          </div>
        </section>

        <section id="architecture" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="System map"
                title="Architecture"
                body="MUTX sits between your agents and your operational interfaces as the control plane. The whitepaper’s four layers only matter if the product surfaces keep telling the same truth."
              />
            </MotionIn>

            <MotionIn className="mt-10 grid gap-4 md:grid-cols-2" delay={0.05}>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Before</p>
                <p className="mt-4 text-xl font-medium leading-9 text-slate-300">
                  Identity drift, deployment ambiguity, secret sprawl, weak observability, and surface drift across the stack.
                </p>
              </div>
              <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">After</p>
                <p className="mt-4 text-xl font-medium leading-9 text-white">
                  One control plane for ownership, deployments, keys, webhooks, runs, traces, docs, terminal flows, and infrastructure-aware operations.
                </p>
              </div>
            </MotionIn>

            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {architectureColumns.map((column, index) => (
                <MotionIn key={column.title} delay={0.05 + index * 0.03}>
                  <article className="h-full rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{column.eyebrow}</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">{column.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{column.body}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {column.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                </MotionIn>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Capabilities"
                title="Core capabilities for daily agent operations."
                body="Start with the control loop every day, then expand into the deeper MUTX capability packs that make the platform more than a monitoring surface."
              />
            </MotionIn>

            <div className="mt-12 grid gap-5 xl:grid-cols-3">
              {capabilityColumns.map((column, index) => (
                <MotionIn key={column.title} delay={0.04 * index}>
                  <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{column.eyebrow}</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">{column.title}</h3>
                    <div className="mt-6 space-y-3">
                      {column.cards.map((card) => (
                        <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                          <p className="text-lg font-semibold text-white">{card.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-400">{card.body}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </MotionIn>
              ))}
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {technicalSauce.map((item, index) => (
                <MotionIn key={item.title} delay={0.02 * index}>
                  <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <item.icon className="h-5 w-5 text-cyan-300" />
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        current truth
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
                  </article>
                </MotionIn>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <MotionIn>
              <SectionHeading
                label="Quick answers"
                title="Frequently asked questions."
                body="Everything you need to know about what MUTX is today, what the app shell means, and why the control-plane framing matters."
              />
            </MotionIn>

            <div className="mt-12 space-y-4">
              {faqItems.map((item, index) => (
                <MotionIn key={item.q} delay={0.03 * index}>
                  <details className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-5">
                    <summary className="flex cursor-pointer list-none items-center gap-4 text-left text-xl font-semibold tracking-[-0.03em] text-white">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-slate-400">
                        {index + 1}
                      </span>
                      <span className="flex-1">{item.q}</span>
                      <span className="text-slate-500">+</span>
                    </summary>
                    <p className="mt-5 pl-[3.25rem] text-base leading-8 text-slate-400">{item.a}</p>
                  </details>
                </MotionIn>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.24)] lg:p-8">
                <div className="mx-auto max-w-4xl text-center">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Final step
                  </div>
                  <h2 className="mt-6 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">
                    Take control of your agent systems.
                  </h2>
                  <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                    Start from the current operator path in minutes, use the repo-backed docs and control surfaces
                    today, and keep the hosted app surface honest as it grows.
                  </p>
                </div>

                <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,0.78fr)]">
                  <div className="rounded-[28px] border border-white/10 bg-[#07101d] p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <p className="font-mono text-sm text-slate-400">bash quickstart</p>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        operator first
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                      <span className="pt-0.5 font-mono text-sm text-cyan-300">$</span>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-slate-100">
                        {`make dev-up
mutx setup local
mutx doctor
mutx assistant overview`}
                      </pre>
                    </div>
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
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Star on GitHub
                      <ExternalLink className="h-5 w-5 text-slate-500" />
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Read the docs
                      <BookOpen className="h-5 w-5 text-slate-500" />
                    </a>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4">
                      <p className="text-sm leading-7 text-slate-400">Need managed hosting later or want the app-shell status?</p>
                      <div className="mt-3">
                        <ComingSoonButton label="Hosted app status" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {['MIT licensed', 'Self-hosted first', 'App shell later', 'Docs are canonical'].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
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
                <a href="https://app.mutx.dev" target="_blank" rel="noreferrer" className="transition hover:text-white">
                  App preview
                </a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
