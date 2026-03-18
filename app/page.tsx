'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronRight,
  Github,
  Lock,
  Menu,
  Orbit,
  Radio,
  ShieldCheck,
  Sparkles,
  TimerReset,
  X,
} from 'lucide-react'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const X_URL = 'https://x.com/mutxdev'

const navLinks = [
  { label: 'Whitepaper', href: '#whitepaper' },
  { label: 'USPs', href: '#usp' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Docs', href: DOCS_URL, external: true },
]

const usps = [
  {
    icon: ShieldCheck,
    title: 'Operator-First Safety',
    body: 'Scoped identities, audit history, and predictable rollback paths ensure humans stay in command.',
  },
  {
    icon: Orbit,
    title: 'Mission Graph Runtime',
    body: 'Model decisioning, tool calls, and handoffs as a visible execution graph instead of opaque chains.',
  },
  {
    icon: TimerReset,
    title: 'Recovery in Seconds',
    body: 'Replay sessions from checkpoints and restore degraded agents without hand patching state.',
  },
  {
    icon: Radio,
    title: 'Live Operational Telemetry',
    body: 'Track each transition, latency spike, and escalation event with real-time stream-level observability.',
  },
]

const paperHighlights = [
  {
    title: 'Control Surface Thesis',
    detail: 'Autonomous systems need explicit override contracts, not best-effort emergency prompts.',
  },
  {
    title: 'Risk-Layered Architecture',
    detail: 'Risk budgets are attached to task classes and enforced before each state transition.',
  },
  {
    title: 'Human Recovery Loop',
    detail: 'Escalations include full context snapshots so operators can resolve issues in one pass.',
  },
  {
    title: 'Composable Runtime Contracts',
    detail: 'Policy, memory, and execution services can evolve independently while preserving protocol guarantees.',
  },
]

const orbitNodes = [
  { id: 'intent', label: 'Intent Intake', x: '10%', y: '18%' },
  { id: 'policy', label: 'Policy Gate', x: '72%', y: '12%' },
  { id: 'runtime', label: 'Agent Runtime', x: '78%', y: '72%' },
  { id: 'review', label: 'Operator Review', x: '22%', y: '78%' },
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
    <div className="relative min-h-screen overflow-hidden bg-[#02040a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(83,164,255,0.25),transparent_35%),radial-gradient(circle_at_88%_20%,rgba(153,98,255,0.2),transparent_35%),linear-gradient(180deg,#05070d_0%,#02040a_45%,#010206_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[-200px] h-[480px] bg-[conic-gradient(from_80deg_at_50%_50%,rgba(0,198,255,0.09),rgba(151,71,255,0.2),rgba(0,198,255,0.09))] blur-3xl" />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03050ccc]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-black/30 p-1">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">MUTX</p>
              <p className="text-sm font-semibold text-white/90">Control Plane for AI Operators</p>
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
        <section className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Whitepaper-driven platform design
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Autonomous agents.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-300 bg-clip-text text-transparent">
                Human-grade control.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              We rebuilt the MUTX landing experience to expose the operational model visually—risk gates, escalation flows, and telemetry loops—all aligned to the core whitepaper thesis.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Read docs
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/25"
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
                Follow updates
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(20,20,80,0.4)] sm:p-6"
          >
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />

            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-white/55">Live mission diagram</p>
            <div className="relative h-[340px] rounded-2xl border border-white/10 bg-[#030610] p-3 sm:h-[380px]">
              {orbitNodes.map((node, idx) => (
                <motion.div
                  key={node.id}
                  className="absolute"
                  style={{ left: node.x, top: node.y }}
                  animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: idx * 0.25 }}
                >
                  <div className="-translate-x-1/2 -translate-y-1/2 rounded-xl border border-cyan-200/30 bg-cyan-300/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]">
                    {node.label}
                  </div>
                </motion.div>
              ))}

              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="orbitLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(125,211,252,0.15)" />
                    <stop offset="50%" stopColor="rgba(56,189,248,0.7)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0.25)" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M 70 70 C 240 12, 310 32, 340 70"
                  stroke="url(#orbitLine)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 8"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />
                <motion.path
                  d="M 340 70 C 355 180, 345 252, 310 300"
                  stroke="url(#orbitLine)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 8"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                />
                <motion.path
                  d="M 310 300 C 180 352, 110 330, 90 290"
                  stroke="url(#orbitLine)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 8"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 1 }}
                />
                <motion.path
                  d="M 90 290 C 55 220, 40 145, 70 70"
                  stroke="url(#orbitLine)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 8"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 1.4 }}
                />
              </svg>

              <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/75">
                <p className="font-semibold text-cyan-100">Current mission health: 98.4%</p>
                <p className="mt-1">Escalation SLA under 2m · Drift guardrails active · Policy violations blocked pre-exec.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="whitepaper" className="mx-auto mt-14 w-full max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {paperHighlights.map((item, idx) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">Whitepaper section {idx + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="usp" className="mx-auto mt-14 w-full max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Why teams choose MUTX</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">USPs built for scale and safety.</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {usps.map((usp, idx) => (
              <motion.article
                key={usp.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6"
              >
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />
                <usp.icon className="h-6 w-6 text-cyan-200" />
                <h3 className="mt-3 text-xl font-semibold text-white">{usp.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/72">{usp.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="architecture" className="mx-auto mt-14 w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Reference architecture</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Control loops you can see, inspect, and enforce.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                MUTX places policy and observability at every layer: intake, execution, recovery, and operator review. The result is autonomous throughput without autonomous risk.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                'Identity & policy checks on each transition',
                'Runtime checkpoints for replay and rollback',
                'SLA-aware escalation channels with full context',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
