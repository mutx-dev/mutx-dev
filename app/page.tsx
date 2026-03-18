'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Binary,
  ChevronRight,
  Clock3,
  Command,
  Github,
  Layers,
  Lock,
  Menu,
  Radar,
  Rocket,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const X_URL = 'https://x.com/mutxdev'

const navLinks = [
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Systems', href: '#systems' },
  { label: 'Playbook', href: '#playbook' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Docs', href: DOCS_URL, external: true },
]

const heroSignals = [
  { value: '42ms', label: 'Median policy-gate evaluation' },
  { value: '99.97%', label: 'Mission continuity with live failover' },
  { value: '7', label: 'Runtime checkpoints per critical workflow' },
  { value: '0', label: 'Undocumented operator overrides' },
]

const principles = [
  {
    title: 'No black boxes in production',
    body: 'Every state transition is observable, attributable, and replayable. If it happened, your team can inspect it with exact context.',
    icon: Radar,
  },
  {
    title: 'Human authority is first-class',
    body: 'Agent autonomy scales only when escalation paths are instant, identity-aware, and enforceable under pressure.',
    icon: Shield,
  },
  {
    title: 'Reliability over novelty theater',
    body: 'We optimize for sustained uptime, deterministic recovery, and policy correctness—not demo-day magic tricks.',
    icon: BadgeCheck,
  },
]

const systemCards = [
  {
    title: 'Mission Fabric',
    subtitle: 'Structured execution graph for every autonomous workflow',
    points: [
      'Branch-aware state machines for non-linear agent decisions',
      'Operator snapshots attached to every high-risk transition',
      'Mission lineage from intent intake to external side effect',
    ],
    icon: Layers,
    gradient: 'from-cyan-400/20 via-sky-400/15 to-blue-500/10',
  },
  {
    title: 'Policy Kernel',
    subtitle: 'Hard gates that evaluate intent before actions run',
    points: [
      'Contextual guardrails for tool scope, spend, and identity',
      'Pre-execution denial logic with explainable decision traces',
      'Runtime contracts for compliance-critical workflows',
    ],
    icon: Lock,
    gradient: 'from-fuchsia-400/20 via-violet-400/15 to-indigo-500/10',
  },
  {
    title: 'Ops Relay',
    subtitle: 'Escalation engine built for real incident response',
    points: [
      'SLA-bound routing to the right operator in seconds',
      'One-click replay from deterministic checkpoints',
      'Intervention templates for predictable crisis handling',
    ],
    icon: Command,
    gradient: 'from-emerald-400/20 via-teal-400/15 to-cyan-500/10',
  },
]

const playbook = [
  {
    stage: '01',
    title: 'Define the blast radius',
    body: 'Model missions by risk class. Attach cost ceilings, privileged operation flags, and approval requirements before enabling autonomy.',
  },
  {
    stage: '02',
    title: 'Launch with telemetry as default',
    body: 'Every call, handoff, and tool invocation emits structured telemetry so your team can detect drift and latency anomalies early.',
  },
  {
    stage: '03',
    title: 'Escalate with full context',
    body: 'When risk thresholds breach, operators get timeline + payload + policy deltas in one view instead of stitching logs across tools.',
  },
  {
    stage: '04',
    title: 'Recover, replay, improve',
    body: 'Use checkpoints to restore safely, replay exact conditions, and convert incidents into hardened runbooks for future missions.',
  },
]

const faqItems = [
  {
    q: 'What does “advanced web hacks” translate to here?',
    a: 'Deliberate visual engineering: layered lighting, kinetic micro-interactions, animated telemetry rails, and highly scannable information architecture that still performs on mobile.',
  },
  {
    q: 'Can we adapt this for enterprise buyers and technical evaluators?',
    a: 'Yes. The page is structured to support multiple reading paths: executive narrative, systems-level detail, and implementation-oriented trust signals.',
  },
  {
    q: 'Does this replace our current agent framework?',
    a: 'No. MUTX acts as a control plane around your existing orchestration stack, adding policy gates, runtime observability, and operator response workflows.',
  },
  {
    q: 'How do we avoid fluffy marketing copy over time?',
    a: 'Anchor copy to outcomes, mechanisms, and constraints. Every section here ties value claims to concrete operating behavior and verifiable control points.',
  },
]

const tickerItems = [
  'Policy-aware autonomy',
  'Deterministic replay',
  'Operator-first escalation',
  'Runtime mission graph',
  'Identity-bound controls',
  'Audit-grade telemetry',
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const authButton = useMemo(() => {
    if (checkingAuth) return null

    if (isAuthenticated) {
      return (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-300/20"
        >
          Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      )
    }

    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Sign In
        <ChevronRight className="h-4 w-4" />
      </Link>
    )
  }, [checkingAuth, isAuthenticated])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_100%_20%,rgba(147,51,234,0.2),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.12),transparent_40%),linear-gradient(180deg,#040610_0%,#03040a_55%,#010207_100%)]" />
      <div className="pointer-events-none absolute inset-x-[-20%] top-20 h-[420px] bg-[conic-gradient(from_30deg_at_50%_50%,rgba(34,211,238,0.08),rgba(168,85,247,0.22),rgba(34,211,238,0.08))] blur-3xl" />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#040612cc]/85 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="MUTX home">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-black/30 p-1">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">MUTX</p>
              <p className="text-sm font-semibold text-white/90">Operational Control Plane for Agentic Systems</p>
            </div>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                className="text-sm text-white/70 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
            {authButton}
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 transition hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#04060f]/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer' : undefined}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2">{authButton}</div>
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10 px-4 pb-24 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <section className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Engineered for operators, not pitch decks
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Autonomous throughput.
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-300 bg-clip-text text-transparent">
                Human command authority.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              MUTX is the mission control layer for production AI systems: policy-gated execution, live telemetry, and escalation paths that keep people in charge when the stakes rise.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/25"
              >
                Read architecture docs
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              >
                Follow releases
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroSignals.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-2xl font-semibold text-cyan-100">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_35px_90px_rgba(30,30,100,0.45)] sm:p-6"
          >
            <div className="absolute -right-14 -top-10 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />
            <div className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl" />

            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-white/55">Live mission rail</p>
            <div className="relative h-[420px] rounded-2xl border border-white/10 bg-[#030612] p-4">
              <motion.div
                className="absolute inset-x-4 top-6 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
                animate={{ opacity: [0.25, 0.8, 0.25] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />

              <div className="space-y-3">
                {[
                  { step: 'INTAKE', text: 'User intent classified as “high-impact external action”.', icon: Binary },
                  { step: 'POLICY', text: 'Kernel validates identity scope + spend cap + approval policy.', icon: Shield },
                  { step: 'EXECUTION', text: 'Mission branch executes with continuous telemetry stream.', icon: Rocket },
                  { step: 'REVIEW', text: 'Operator confirms summary diff before side effects commit.', icon: Zap },
                ].map((line, idx) => (
                  <motion.div
                    key={line.step}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/35 p-3"
                    animate={{ borderColor: ['rgba(255,255,255,0.1)', 'rgba(103,232,249,0.45)', 'rgba(255,255,255,0.1)'] }}
                    transition={{ duration: 3.2, delay: idx * 0.35, repeat: Infinity }}
                  >
                    <line.icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/85">{line.step}</p>
                      <p className="mt-1 text-sm leading-6 text-white/75">{line.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-cyan-200/20 bg-cyan-300/10 p-3 text-xs text-cyan-50/90">
                <p className="font-semibold text-cyan-100">Mission status: nominal · risk envelope maintained</p>
                <p className="mt-1 text-white/75">Pre-exec policy enforcement active · SLA-safe escalation channel online · replay snapshots synced.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto mt-12 w-full max-w-7xl overflow-hidden rounded-full border border-white/10 bg-white/[0.03] py-3">
          <motion.div
            className="flex gap-8 px-6"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex shrink-0 items-center gap-2 text-sm text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {item}
              </div>
            ))}
          </motion.div>
        </section>

        <section id="manifesto" className="mx-auto mt-16 w-full max-w-7xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Manifesto</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              AI systems shouldn&apos;t be trusted because they sound smart. They should be trusted because they are governable under stress.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {principles.map((item, idx) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6"
              >
                <item.icon className="h-6 w-6 text-cyan-200" />
                <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{item.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="systems" className="mx-auto mt-16 w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Core systems</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">The stack behind safe autonomous execution.</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {systemCards.map((card) => (
              <article key={card.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-5`}>
                <card.icon className="h-6 w-6 text-cyan-100" />
                <h3 className="mt-3 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-1 text-sm text-white/75">{card.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="playbook" className="mx-auto mt-16 w-full max-w-7xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Deployment playbook</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">How teams operationalize MUTX in the real world.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {playbook.map((step, idx) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">Step {step.stage}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto mt-16 w-full max-w-7xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Straight answers for serious operators.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-7xl rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">Build a better control surface</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ship high-agency AI without surrendering operational control.</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
            If your team is done with vague platform promises and wants concrete runtime control, open the docs and run your first guarded mission today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-100"
            >
              Open docs
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View repository
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
