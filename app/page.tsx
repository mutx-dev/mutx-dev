'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Binary,
  BookOpen,
  Bot,
  ChevronRight,
  Command,
  Github,
  KeyRound,
  Menu,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Webhook,
  Workflow,
  Wrench,
  X,
  Zap,
} from 'lucide-react'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const APP_URL = 'https://app.mutx.dev'
const APP_DASHBOARD_URL = `${APP_URL}/dashboard`
const APP_LOGIN_URL = `${APP_URL}/login`

const navLinks = [
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Control Plane', href: '#control-plane' },
  { label: 'Docs', href: '#docs' },
  { label: 'FAQ', href: '#faq' },
]

const heroPills = ['deployments', 'runs', 'traces', 'webhooks', 'keys', 'budgets', 'health', 'routes']

const consoleLines = [
  'mutx deploy create --agent checkout-bot --env prod',
  'mutx traces tail --run run_4021 --follow',
  'mutx webhooks replay --event order.failed --delivery whd_91',
  'mutx keys rotate --scope operator --reason "night shift hygiene"',
]

const manifestoCards = [
  {
    title: 'Pretty demos are the easy part',
    body: 'The real work starts when an agent owns credentials, talks to live systems, and needs a 2:13 AM recovery path.',
    icon: Sparkles,
  },
  {
    title: 'Logs are not a control plane',
    body: 'You need deploys, routes, approvals, traces, budgets, health, and explicit buttons that change reality on purpose.',
    icon: Radar,
  },
  {
    title: 'Humans still need sharp tools',
    body: 'Override power, audit trails, key lifecycle, and ownership rails should feel native instead of bolted on as afterthoughts.',
    icon: ShieldCheck,
  },
]

const controlCards = [
  {
    title: 'Deploy with receipts',
    body: 'Treat agents like software that ships versions, restarts, rolls back, and leaves evidence.',
    icon: Rocket,
    accent: 'from-cyan-400/30 via-sky-400/10 to-transparent',
  },
  {
    title: 'Govern without ceremony',
    body: 'Keys, approvals, auth, and routes stay in the product surface instead of rotting inside runbooks.',
    icon: KeyRound,
    accent: 'from-blue-400/25 via-cyan-400/10 to-transparent',
  },
  {
    title: 'Recover faster than panic',
    body: 'Runs, traces, health, and webhook replay sit close enough to intervention that operators can actually do something.',
    icon: Zap,
    accent: 'from-amber-300/20 via-orange-300/10 to-transparent',
  },
]

const storySections = [
  {
    id: 'build',
    eyebrow: 'Runtime pit crew',
    title: 'A control plane that actually gets its hands dirty.',
    body: 'Deployments, routes, keys, health, and runtime actions belong in one fast loop. MUTX is built for the moment the agent stops being adorable and starts needing maintenance.',
    bullets: [
      'Launch new deployments or attach existing runtimes without changing the product story.',
      'Move from run to trace to fix without switching mental models.',
      'Keep the operator in one lane instead of scattering product truth across tools.',
    ],
    image: '/landing/wiring-bay.png',
  },
  {
    id: 'learn',
    eyebrow: 'Docs with posture',
    title: 'The docs are part of the product, not the punishment.',
    body: 'The fastest way to make serious software feel unserious is shipping a gorgeous app with a sad docs lane. MUTX treats docs like an on-ramp, not an afterthought.',
    bullets: [
      'Architecture, deployment, and SDK paths should feel as deliberate as the app itself.',
      'Docs link directly into operational concepts instead of floating as marketing wallpaper.',
      'The reading lane is calm on purpose. It is where teams get un-lost fast.',
    ],
    image: '/landing/reading-bench.png',
  },
]

const arcadeFacts = [
  { value: '01', label: 'canonical control plane', detail: 'app + api + cli + sdk tell the same story' },
  { value: '06', label: 'operator primitives', detail: 'agents, deployments, runs, traces, keys, webhooks' },
  { value: '0', label: 'patience for toy UX', detail: 'buttons should do something real or get out of the way' },
]

const faqItems = [
  {
    q: 'Is this a dashboard?',
    a: 'Only in the same way a cockpit is a dashboard. MUTX is for deploy, govern, observe, and recover. Watching is not enough.',
  },
  {
    q: 'Do I have to rebuild everything around it?',
    a: 'No. MUTX is designed to wrap real runtimes, link existing systems, and give them a stronger operational surface.',
  },
  {
    q: 'Why so much emphasis on docs and operator UX?',
    a: 'Because the fastest way to lose trust is making production feel mysterious. Good docs and sharp controls are part of reliability.',
  },
  {
    q: 'What is the vibe here, exactly?',
    a: 'Open-source infrastructure with a pulse. Serious product underneath, zero desire to cosplay as enterprise wallpaper.',
  },
]

const tickerItems = [
  'agents need grown-up infrastructure',
  'deploy like software',
  'route like systems',
  'recover with context',
  'trace with intent',
  'docs that pull their weight',
  'webhooks with receipts',
  'keys with lifecycle',
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

  const appHref = isAuthenticated ? APP_DASHBOARD_URL : APP_LOGIN_URL
  const appLabel = checkingAuth ? 'Open app' : isAuthenticated ? 'Open dashboard' : 'Enter the control plane'

  const authButton = useMemo(() => {
    return (
      <a
        href={appHref}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-300/15 px-5 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-300/25"
      >
        {appLabel}
        <ChevronRight className="h-4 w-4" />
      </a>
    )
  }, [appHref, appLabel])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02050b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(96,165,250,0.22),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.12),transparent_38%),linear-gradient(180deg,#02050b_0%,#04101b_48%,#02050b_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="pointer-events-none absolute left-1/2 top-32 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[140px]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03101acc]/80 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="MUTX home">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-white/45">MUTX</p>
              <p className="text-sm font-semibold text-white/90">control plane for agents with a pulse</p>
            </div>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-white/70 transition hover:text-white">
                {link.label}
              </a>
            ))}
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white/70 transition hover:text-white"
            >
              docs.mutx.dev
            </a>
            {authButton}
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="rounded-2xl border border-white/15 bg-white/5 p-2 text-white/80 transition hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#04131d]/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                docs.mutx.dev
              </a>
              <div className="pt-2">{authButton}</div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 px-4 pb-24 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <section className="mx-auto grid w-full max-w-[88rem] gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,26,0.96),rgba(5,10,18,0.92))] p-6 shadow-[0_25px_80px_rgba(2,8,20,0.55)] sm:p-8"
            >
              <div className="absolute -left-10 top-16 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-amber-300/10 blur-3xl" />

              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                no ai slop. no dead-end demo theater.
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl">
                Agents are fun.
                <span className="mt-2 block text-white/72">Production is the boss fight.</span>
                <span className="mt-3 block bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-100 bg-clip-text text-transparent">
                  MUTX gives them a control plane.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                MUTX is the open-source control plane for the moment your agent stops being a cute demo and starts touching real systems.
                Deploy it. Route it. Govern it. Trace it. Recover it. Keep the fun part. Lose the chaos.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={appHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                >
                  {appLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-6 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-300/20"
                >
                  Read the docs
                  <BookOpen className="h-4 w-4" />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Github className="h-4 w-4" />
                  Star the repo
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {heroPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/68"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {arcadeFacts.map((fact) => (
                  <div key={fact.label} className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-cyan-100">{fact.value}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/45">{fact.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">{fact.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#040d16] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#03070c] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(96,165,250,0.35),transparent_28%)]" />
              <Image
                src="/landing/hero-manifesto.png"
                alt="MUTX robot hero art"
                width={1536}
                height={1024}
                priority
                className="h-auto w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />

              <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
                <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-50/90 backdrop-blur-md">
                  manifesto for agent infrastructure
                </div>
                <div className="hidden rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-md sm:block">
                  app · api · cli · sdk
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:bottom-6 sm:left-6 sm:right-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="rounded-[1.4rem] border border-white/12 bg-[#02060c]/75 p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/48">operator console</p>
                  <div className="mt-3 space-y-2 font-[family:var(--font-mono)] text-[11px] text-cyan-100/88 sm:text-xs">
                    {consoleLines.map((line, index) => (
                      <motion.p
                        key={line}
                        animate={{ opacity: [0.35, 1, 0.55] }}
                        transition={{ duration: 3.1, delay: index * 0.35, repeat: Infinity }}
                        className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                      >
                        <span className="mr-2 text-cyan-300">$</span>
                        {line}
                      </motion.p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-white/12 bg-[#02060c]/75 p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/48">why this hits</p>
                  <div className="mt-3 space-y-3 text-sm text-white/74">
                    <div className="flex items-start gap-3">
                      <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                      <p>Resource-first model for agents, deployments, runs, traces, keys, and webhooks.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                      <p>Governance lives in the product surface instead of a haunted Notion page.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Command className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                      <p>Operators get actions, not just sympathy and another graph.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-[88rem] overflow-hidden rounded-full border border-white/10 bg-white/[0.04] py-3">
          <motion.div
            className="flex gap-8 px-6"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div key={`${item}-${index}`} className="flex shrink-0 items-center gap-3 text-sm uppercase tracking-[0.26em] text-white/62">
                <span className="h-2 w-2 rounded-full bg-cyan-300/75" />
                {item}
              </div>
            ))}
          </motion.div>
        </section>

        <section id="manifesto" className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#06111d]">
              <div className="relative">
                <Image
                  src="/landing/running-agent.png"
                  alt="MUTX robot running"
                  width={1024}
                  height={1024}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1280px) 100vw, 38vw"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/12 bg-[#02060d]/78 p-4 backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/80">the mutx thesis in one sentence</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Agents should move fast. Their infrastructure should not move like improv theater.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Manifesto</p>
              <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                If your agent can spend money, call APIs, ship code, or wake someone up, it deserves grown-up infrastructure.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                MUTX is built for teams who want the weird, powerful, creative upside of agents without accepting a mushy product surface.
                The app should feel alive. The controls should feel sharp. The system should feel accountable.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {manifestoCards.map((card, index) => (
                  <motion.article
                    key={card.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
                  >
                    <card.icon className="h-5 w-5 text-cyan-200" />
                    <h3 className="mt-4 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/68">{card.body}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="control-plane" className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="mb-6 max-w-4xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Control plane</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              This is where the operator gets their hands back on the wheel.
            </h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111b]">
              <Image
                src="/landing/wiring-bay.png"
                alt="MUTX robot wiring control systems"
                width={1024}
                height={1536}
                className="h-full w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 30vw"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {controlCards.map((card) => (
                <article
                  key={card.title}
                  className={`overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${card.accent} p-5`}
                >
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <card.icon className="h-5 w-5 text-cyan-100" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/70">{card.body}</p>
                </article>
              ))}

              <article className="rounded-[1.7rem] border border-white/10 bg-[#07111c] p-5 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Operator loop</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'auth and ownership', icon: ShieldCheck },
                    { label: 'deployments and health', icon: Rocket },
                    { label: 'runs and traces', icon: Binary },
                    { label: 'webhooks and replay', icon: Webhook },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                      <item.icon className="h-5 w-5 text-cyan-200" />
                      <p className="mt-3 text-lg font-semibold capitalize text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/66">
                        Real operator surfaces should connect observation to action without dumping you into another disconnected tool.
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.7rem] border border-white/10 bg-[#07111c] p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">MUTX energy</p>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  Serious infrastructure.
                  <span className="block text-cyan-200">Way more fun than it has any right to be.</span>
                </p>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  The best operator tools make pressure feel manageable. Fast UI, clear posture, honest state, zero corporate wallpaper.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="docs" className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06111d]">
              <Image
                src="/landing/docs-surface.png"
                alt="MUTX docs surface"
                width={1536}
                height={1024}
                className="h-auto w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 60vw"
              />
              <div className="absolute inset-x-4 bottom-4 max-w-xl rounded-[1.6rem] border border-white/12 bg-[#02060d]/78 p-5 backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/80">docs lane</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">docs.mutx.dev should feel like a runway, not a side quest.</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Architecture, API shape, operational semantics, and setup paths should land with the same confidence as the app.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                  >
                    Open docs
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Talk to the team
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {storySections.map((section, index) => (
                <motion.article
                  key={section.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111c]"
                >
                  <Image
                    src={section.image}
                    alt={section.title}
                    width={1024}
                    height={1536}
                    className="h-72 w-full object-cover object-top"
                    sizes="(max-width: 1280px) 100vw, 36vw"
                  />
                  <div className="p-6">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/75">{section.eyebrow}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{section.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/70">{section.body}</p>
                    <ul className="mt-5 space-y-3 text-sm text-white/68">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111c]">
              <Image
                src="/landing/victory-core.png"
                alt="MUTX robot lifting the mark"
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,28,0.98),rgba(4,10,18,0.92))] p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Why teams stick around</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Make your agents boring in the best possible way.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                Reliable systems are fun because they keep the creative part alive. MUTX is for teams that want serious control without flattening the energy out of the product.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Open-source bones',
                    body: 'Inspect it, run it, extend it, and stop guessing what the control surface is really doing.',
                    icon: Bot,
                  },
                  {
                    title: 'Operator-first flow',
                    body: 'The app, docs, API, CLI, and SDK all point toward one product model instead of five competing metaphors.',
                    icon: Command,
                  },
                  {
                    title: 'Recovery > theater',
                    body: 'Health, traces, webhooks, deploys, and keys are arranged around action, not applause.',
                    icon: Wrench,
                  },
                  {
                    title: 'Built for real pressure',
                    body: 'When something breaks, the surface should feel like backup, not another problem to manage.',
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/68">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Straight answers, zero enterprise fog.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
                <h3 className="text-xl font-semibold text-white">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-[88rem]">
          <div className="grid overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(10,30,46,0.95),rgba(5,12,20,0.92))] lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/78">final call</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Build the weird agent thing.
                <span className="mt-2 block text-cyan-200">Just give it a control plane before it bites you.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                Open the app, read the docs, inspect the code, and start operating agents like the systems they are becoming.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={appHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                >
                  {appLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open docs
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View source
                </a>
              </div>
            </div>

            <div className="relative min-h-[24rem] border-t border-white/10 lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#030810]/60" />
              <Image
                src="/landing/thumbs-up-portrait.png"
                alt="MUTX robot giving a thumbs up"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
