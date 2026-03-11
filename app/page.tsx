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
import { AgentNetwork } from '@/components/AgentNetwork'
import { TerminalWindow } from '@/components/TerminalWindow'
import { WaitlistForm } from '@/components/WaitlistForm'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const TWITTER_URL = 'https://x.com/mutxdev'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030307] text-slate-100">
      <AgentNetwork />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#030307]/40 px-6 py-4 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src="/logo-new.png" alt="mutx.dev" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">MUTX</p>
              <p className="hidden sm:block text-xs text-slate-400">Open-source agent control plane</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              <Github className="h-4 w-4" />
            </a>
            <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>

      <section className="relative px-6 pb-20 pt-32 sm:px-10 lg:pb-28 lg:pt-40 z-10">
        <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200"
            >
              <Sparkles className="h-4 w-4" />
              Infrastructure for the agentic web
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mt-6 max-w-5xl text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl"
            >
              Deploy agents. <br /><span className="bg-gradient-to-r from-cyan-300 to-amber-200 bg-clip-text text-transparent">Operate systems.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl"
            >
              MUTX is the open-source control plane that turns local agent scripts into long-running, observable production services. Built on FastAPI, Postgres, and Docker.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-8 max-w-xl"
            >
              <WaitlistForm source="hero" />
            </motion.div>
          </div>

          <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
            <AnimatedTerminal />
          </div>
        </div>
      </section>

      <Section id="features" className="relative z-10 border-t border-white/5 bg-[#030307]/80 backdrop-blur-md">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Not just another wrapper.</h2>
          <p className="mt-4 text-slate-400">The missing ops layer for autonomous systems.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-8 border border-white/5 bg-white/[0.02]">
            <Server className="h-8 w-8 text-cyan-400 mb-6" />
            <h3 className="text-xl font-medium text-white">FastAPI Control Plane</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Manage agent lifecycles, auth, routing, API keys, and deployments out of the box. No more duct-taping Express servers to Python scripts.</p>
          </Card>
          <Card className="p-8 border border-white/5 bg-white/[0.02]">
            <Activity className="h-8 w-8 text-amber-400 mb-6" />
            <h3 className="text-xl font-medium text-white">Webhook & Event Driven</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Stream metrics and status updates via built-in webhook ingress. Connect your agents to the rest of your microservice architecture seamlessly.</p>
          </Card>
          <Card className="p-8 border border-white/5 bg-white/[0.02]">
            <Terminal className="h-8 w-8 text-emerald-400 mb-6" />
            <h3 className="text-xl font-medium text-white">Operator CLI</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Manage it all from the terminal. Deploy, scale, and tail logs across your entire swarm with the MUTX python CLI and SDK.</p>
          </Card>
        </div>
      </Section>

      <Section id="contribute" className="relative z-10">
        <div className="panel overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-12 sm:px-12 sm:py-16 text-center relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.05),transparent_50%)]" />
          <h2 className="relative mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Join the agentic revolution.
          </h2>
          <p className="relative mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            MUTX is fully open-source. Join the waitlist for updates, or dive into the codebase today and help build the standard for agent ops.
          </p>
          <div className="relative mt-8 mx-auto max-w-md">
            <WaitlistForm source="bottom" compact />
          </div>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]">
              <Twitter className="h-4 w-4" /> Twitter
            </a>
          </div>
        </div>
      </Section>

      <footer className="relative z-10 border-t border-white/5 bg-[#030307] px-6 py-8 sm:px-10 text-center sm:text-left">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 md:flex-row text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Image src="/logo-new.png" alt="mutx.dev" width={24} height={24} className="rounded-md" />
            <span>© {new Date().getFullYear()} MUTX. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href={GITHUB_URL} className="hover:text-white transition">GitHub</a>
            <a href={TWITTER_URL} className="hover:text-white transition">Twitter</a>
            <a href="mailto:hello@mutx.dev" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
