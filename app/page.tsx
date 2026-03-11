'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Bot,
  Braces,
  Cloud,
  Code2,
  Database,
  Github,
  GitBranch,
  Layers3,
  Mail,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Twitter,
  Workflow,
  CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'

import { AnimatedTerminal } from '@/components/AnimatedTerminal'
import { TerminalWindow } from '@/components/TerminalWindow'
import { WaitlistForm } from '@/components/WaitlistForm'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const TWITTER_URL = 'https://x.com/mutxdev'

const navItems = [
  { label: 'What It Is', href: '#what-it-is' },
  { label: 'Operator Surface', href: '#operator-surface' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Contribute', href: '#contribute' },
]

const stack = [
  'Next.js App Router',
  'FastAPI',
  'Postgres',
  'Redis',
  'Python CLI',
  'Python SDK',
  'Railway',
  'Terraform',
  'Ansible',
  'Resend',
]

const proofPoints = [
  'FastAPI routes for auth, agents, deployments, API keys, health, readiness, and webhooks.',
  'A real Postgres-backed waitlist route on the website with Resend confirmation emails.',
  'A working CLI for login, agent lifecycle basics, and deployment listing.',
  'Terraform, Ansible, Docker, and monitoring foundations already live in-repo.',
]

const surfaces = [
  {
    icon: Layers3,
    title: 'Web + Operator Surface',
    description:
      'Next.js powers the public site, waitlist capture, and app-side API key proxy routes. The dashboard is still early, but the surface is real.',
  },
  {
    icon: Server,
    title: 'FastAPI Control Plane',
    description:
      'The backend already exposes auth, agent CRUD, deployments, API keys, health checks, readiness, and webhook ingestion without a global `/v1` prefix.',
  },
  {
    icon: Terminal,
    title: 'CLI + SDK',
    description:
      'Python clients wrap the platform for login, create/list/deploy flows, deployment inspection, and webhook management from terminals and scripts.',
  },
  {
    icon: Cloud,
    title: 'Infra Automation',
    description:
      'Docker Compose, Railway configs, Terraform, Ansible, Prometheus, and Grafana provide the path from local testing to hosted control-plane operations.',
  },
]

const usps = [
  {
    icon: Shield,
    title: 'Operational Maturity',
    description: 'Auth, ownership, API keys, and webhooks as first-class primitives.',
  },
  {
    icon: Database,
    title: 'Infrastructure-First',
    description: 'Built-in support for Docker, Railway, Terraform, and Ansible.',
  },
  {
    icon: GitBranch,
    title: 'Open Source',
    description: 'A contributor-first roadmap from local testing to production scale.',
  },
]

const shippedNow = [
  'Auth: JWT, ownership, API keys, email verification',
  'Agents: CRUD, deployments, logs, metrics',
  'Webhooks: Ingestion and status reporting',
  'Infra: Docker, Terraform, Ansible, monitoring',
]

const nextUp = [
  'Dashboard: Production-ready authenticated UI',
  'Hardening: Ownership checks, schema alignment',
  'SDK: Tightening API contract parity',
  'Observability: Lifecycle history and self-healing',
]

const roadmapColumns = [
  {
    title: 'Now',
    items: [
      'Auth and ownership on `/agents` and `/deployments`',
      'CLI, SDK, and API contract alignment',
      'Real dashboard basics',
      'Contact and API key workflows',
      'Testing and CI',
      'Local developer bootstrap',
    ],
  },
  {
    title: 'Next',
    items: [
      'Typed agent config',
      'Deployment events and lifecycle history',
      'Webhook registration as a real product surface',
      'Runtime-connected monitoring and self-healing',
      'Better observability views for logs, metrics, and state transitions',
    ],
  },
  {
    title: 'Later',
    items: [
      'Execution and traces API for agent runs',
      'Versioning, rollback, and deploy history UX',
      'Quotas and plan enforcement',
      'Vector and RAG feature completion',
      'Expanded runtime support beyond the current foundations',
    ],
  },
]

const contributorLanes = [
  {
    icon: Code2,
    area: 'area:web',
    focus: 'Turn the app surface into a real operator dashboard and keep the landing experience elite.',
  },
  {
    icon: Server,
    area: 'area:api',
    focus: 'Harden ownership, align schemas, and add route coverage across agents, deployments, and webhooks.',
  },
  {
    icon: Terminal,
    area: 'area:cli',
    focus: 'Fix create/deploy ergonomics and make the CLI feel production-ready.',
  },
  {
    icon: Braces,
    area: 'area:sdk',
    focus: 'Align defaults and supported methods with the real server contract.',
  },
  {
    icon: Activity,
    area: 'area:testing',
    focus: 'Add backend tests, local-first browser coverage, and honest CI confidence loops.',
  },
  {
    icon: Sparkles,
    area: 'area:docs',
    focus: 'Keep commands, routes, visuals, and positioning aligned with the codebase as it evolves.',
  },
]

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-3xl">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-[120px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-amber-300/10 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-[150px]" />
      </div>

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#040612]/65 px-6 py-4 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src="/logo-new.png" alt="mutx.dev" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">MUTX</p>
              <p className="text-sm text-slate-400">Open-source agent control plane</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>

      <section className="relative px-6 pb-20 pt-32 sm:px-10 lg:pb-28 lg:pt-40">
        <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow"
            >
              <Sparkles className="h-4 w-4" />
              open-source infrastructure for AI agents
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.7rem]"
            >
              Control plane for <br /><span className="gradient-text">AI agents.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-8 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl"
            >
              MUTX provides the operational layer agents need for production: authentication, lifecycle orchestration, and deployment primitives.
            </motion.p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {proofPoints.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.22 + index * 0.06 }}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-200"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
              >
                View on GitHub
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#operator-surface"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
              >
                See the operator surface
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://app.mutx.dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
              >
                Open app preview
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.36 }}
              className="mt-8 max-w-2xl"
            >
              <WaitlistForm source="hero" />
            </motion.div>
          </div>

          <div className="relative lg:pt-6">
            <TerminalWindow title="mission-control.sh" path="~/mutx-dev" label="live preview">
              <div className="space-y-2.5">
                {[
                  { kind: 'command', text: 'mutx status' },
                  { kind: 'output', text: 'API URL: http://localhost:8000' },
                  { kind: 'output', text: 'Status: Logged in' },
                  { kind: 'spacer', text: '' },
                  {
                    kind: 'command',
                    text: 'mutx agents create --name recon-swarm --config "{\\"model\\":\\"gpt-4o-mini\\"}"',
                  },
                  {
                    kind: 'output',
                    text: 'Created agent: 7f5e4e3b-a851-4d26-a779-f0e6a1fca3d7 - recon-swarm',
                  },
                  { kind: 'command', text: 'mutx agents deploy 7f5e4e3b-a851-4d26-a779-f0e6a1fca3d7' },
                  { kind: 'output', text: 'Deployment ID: 0f8d2d30-3a5c-42f7-8c64-54bc87c12cf7' },
                  { kind: 'output', text: 'Status: deploying' },
                  { kind: 'spacer', text: '' },
                  { kind: 'command', text: 'curl -s http://localhost:8000/health' },
                  { kind: 'output', text: '{"status":"healthy","database":"ready"}' },
                  { kind: 'command', text: 'POST /api/newsletter -> Postgres + Resend' },
                ].map((line, index) => (
                  <motion.div
                    key={`${line.kind}-${index}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 * index }}
                    className={line.kind === 'spacer' ? 'h-2' : 'terminal-line'}
                  >
                    {line.kind === 'command' ? (
                      <>
                        <span className="terminal-prompt">$</span>
                        <span className="text-white">{line.text}</span>
                      </>
                    ) : line.kind === 'output' ? (
                      <>
                        <span className="text-slate-500">›</span>
                        <span className="text-slate-300">{line.text}</span>
                      </>
                    ) : null}
                  </motion.div>
                ))}
                <div className="terminal-line pt-1">
                  <span className="terminal-prompt">$</span>
                  <span className="text-white">_</span>
                  <span className="terminal-caret text-cyan-300">|</span>
                </div>
              </div>
            </TerminalWindow>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Waitlist', value: 'live', sub: 'Postgres + Resend' },
                { label: 'API', value: 'real', sub: 'auth / agents / deploys / webhooks' },
                { label: 'Infra', value: 'stacked', sub: 'Railway + Docker + Terraform + Ansible' },
              ].map((item) => (
                <div key={item.label} className="panel rounded-[24px] border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10 sm:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 border-y border-white/10 py-6">
          {stack.map((item) => (
            <span key={item} className="stat-pill">
              {item}
            </span>
          ))}
        </div>
      </section>

      <Section id="what-it-is">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <SectionHeading
            eyebrow="What it is"
            title="A control plane for autonomous agents."
            description="The stack designed to take agents from local prototypes to production systems."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {usps.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {surfaces.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-100">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="operator-surface">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Operator surface"
            title="macOS terminals, code snippets, and the real repo map."
            description="Understand the whole project in one scroll: CLI tools, Python SDK, webhooks, and full-stack repo structure."
          />

          <Card className="p-0">
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-white/0 bg-white/10 lg:grid-cols-2">
              <div className="bg-[#07101f] p-6 font-[family:var(--font-mono)] text-sm leading-7 text-slate-200">
                <p className="text-xs uppercase tracking-[0.26em] text-cyan-200">repo map</p>
                <pre className="mt-4 overflow-x-auto text-slate-300">{`app/             web + api
src/api/         fastapi + core
cli/             operator cli
sdk/             python clients
infrastructure/  deploy + ops`}</pre>
              </div>
              <div className="bg-[#0b1527] p-6">
                <p className="text-xs uppercase tracking-[0.26em] text-amber-200">why it matters</p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                  <p>MUTX spans the full control-plane story—not just wrapping prompts.</p>
                  <p>Real backend routes, deployment primitives, and operational ergonomics.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          <AnimatedTerminal />

          <TerminalWindow title="sdk-example.py" path="sdk/mutx" label="python sdk">
            <pre className="overflow-x-auto text-[13px] leading-7 text-slate-200 sm:text-sm"><span className="text-fuchsia-200">from</span> <span className="text-cyan-200">mutx</span> <span className="text-fuchsia-200">import</span> <span className="text-white">MutxClient</span>{'\n\n'}<span className="text-white">client</span> = <span className="text-cyan-200">MutxClient</span>({'\n'}  <span className="text-amber-200">api_key</span>=<span className="text-emerald-200">"mutx_live_xxx"</span>,{'\n'}  <span className="text-amber-200">base_url</span>=<span className="text-emerald-200">"http://localhost:8000"</span>,{'\n'}){'\n\n'}<span className="text-white">agent</span> = <span className="text-white">client</span>.<span className="text-cyan-200">agents</span>.<span className="text-cyan-200">create</span>({'\n'}  <span className="text-amber-200">name</span>=<span className="text-emerald-200">"recon-swarm"</span>,{'\n'}  <span className="text-amber-200">description</span>=<span className="text-emerald-200">"nightly reconciliation"</span>,{'\n'}  <span className="text-amber-200">config</span>=<span className="text-emerald-200">{`'{"model":"gpt-4o-mini"}'`}</span>,{'\n'}){'\n\n'}<span className="text-white">deployment</span> = <span className="text-white">client</span>.<span className="text-cyan-200">deployments</span>.<span className="text-cyan-200">create</span>(<span className="text-white">agent</span>.<span className="text-white">id</span>, <span className="text-amber-200">replicas</span>=<span className="text-orange-200">1</span>){'\n'}<span className="text-cyan-100">print</span>(<span className="text-white">deployment</span>.<span className="text-white">status</span>)</pre>
          </TerminalWindow>

          <TerminalWindow title="webhook-event.json" path="/webhooks/metrics" label="event ingress">
            <pre className="overflow-x-auto text-[13px] leading-7 text-slate-200 sm:text-sm">{`{
  "agent_id": "7f5e4e3b-a851-4d26-a779-f0e6a1fca3d7",
  "cpu_usage": 21.4,
  "memory_usage": 512.0
}`}</pre>
            <div className="mt-4 grid gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span>Auth</span>
                <span className="text-cyan-200">JWT or X-API-Key</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span>Stores</span>
                <span className="text-cyan-200">agent metrics</span>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3 text-cyan-100">
              <Workflow className="h-5 w-5" />
              <p className="text-sm font-medium uppercase tracking-[0.28em]">Current architecture</p>
            </div>
            <pre className="mt-6 overflow-x-auto font-[family:var(--font-mono)] text-sm leading-7 text-slate-300">{`public site + waitlist
        |
  Next.js app router
        |
 FastAPI control plane
 auth / agents / deployments
 api-keys / webhooks / health
        |
   Postgres + Redis
        |
 Railway + Docker + infra
 Terraform / Ansible / monitoring`}</pre>
          </Card>

          <div className="grid gap-6">
            <Card>
              <div className="flex items-center gap-3 text-emerald-100">
                <Rocket className="h-5 w-5" />
                <h3 className="text-xl font-semibold text-white">What is real today</h3>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                {shippedNow.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-3 text-amber-100">
                <Bot className="h-5 w-5" />
                <h3 className="text-xl font-semibold text-white">What we are actively building next</h3>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                {nextUp.map((item) => (
                  <li key={item} className="flex gap-3">
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </Section>

      <Section id="roadmap">
        <SectionHeading
          eyebrow="Roadmap"
          title="An honest build plan, not fake enterprise cosplay."
          description="MUTX already has real bones. The roadmap is about tightening contracts, shipping the dashboard, and making the runtime + observability story as real as the infrastructure foundation."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {roadmapColumns.map((column) => (
            <Card key={column.title} className="p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-semibold text-white">{column.title}</h3>
                <span className="stat-pill">roadmap</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-300">
                {column.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="contribute">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <SectionHeading
            eyebrow="Contributor lanes"
            title="If this looks like your kind of project, there is real work waiting."
            description="MUTX wants the same energy the best open-source infra projects have: sharp docs, serious visuals, honest architecture, and contributors who can harden the stack from web polish to runtime behavior."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {contributorLanes.map(({ icon: Icon, area, focus }) => (
              <Card key={area} className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100">{area}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{focus}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section className="pt-8">
        <div className="panel overflow-hidden rounded-[36px] border border-white/10 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="eyebrow">Join the build</span>
              <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                If the vision is big, the README should be big, the website should feel expensive, and the code should back it up.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                That is the standard now. Join the waitlist, follow the project, and jump into the contributor lanes if you want to help turn MUTX into the open-source control plane people actually build on.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                <Twitter className="h-4 w-4" />
                X / Twitter
              </a>
              <a
                href="mailto:hello@mutx.dev"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                <Mail className="h-4 w-4" />
                hello@mutx.dev
              </a>
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <WaitlistForm source="bottom-cta" compact />
          </div>
        </div>
      </Section>

      <footer className="px-6 pb-12 pt-4 text-sm text-slate-500 sm:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/logo-new.png" alt="mutx.dev" width={28} height={28} className="rounded-lg" />
            <span>MUTX - building the control plane for the agentic web.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a>
            <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">Twitter</a>
            <a href="mailto:hello@mutx.dev" className="transition hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
