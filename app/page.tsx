'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap, Cpu, Shield, Globe, Github, Twitter, Mail } from 'lucide-react'
import Image from 'next/image'
import { WaitlistForm } from '@/components/WaitlistForm'

const features = [
  {
    icon: Cpu,
    title: 'Compute-Optimized',
    description: 'Infrastructure shaped for long-running AI agent workloads and heavy token throughput.',
  },
  {
    icon: Shield,
    title: 'State Persistence',
    description: 'Keep runtime context durable across restarts so your agents survive real production conditions.',
  },
  {
    icon: Globe,
    title: 'Webhook Ready',
    description: 'Capture events, status updates, and runtime signals without duct-taped side systems.',
  },
  {
    icon: Zap,
    title: 'Built For Speed',
    description: 'Move from local prototype to production runtime with a simpler operator story.',
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030307] text-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image src="/logo-new.png" alt="mutx.dev" fill className="object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">mutx<span className="text-cyan-400">.dev</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/fortunexbt/mutx-dev" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
            <Github className="h-5 w-5" />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pb-20 pt-32 sm:px-10 overflow-hidden">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-blue-600/10 blur-[120px]" />
        </div>
        
        <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-sm font-medium text-cyan-300"
          >
            <Zap className="h-4 w-4" />
            <span>Infrastructure for the Agentic Era</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl"
          >
            THE AGENTIC <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ERA IS HERE.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
          >
            The control plane for long-running, autonomous agents. Managed hosting, observability, and state persistence for your AI workforce.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 w-full max-w-xl"
          >
            <WaitlistForm />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Built for production reliability.</h2>
            <p className="mt-4 text-slate-400">Everything you need to move agents from local scripts to production scale.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.04]">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 px-6 py-12 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo-new.png" alt="mutx.dev" width={32} height={32} />
            <span className="text-lg font-bold text-white">mutx.dev</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <a href="https://twitter.com/mutxdev" target="_blank" rel="noreferrer" className="transition hover:text-cyan-400">Twitter</a>
            <a href="https://github.com/fortunexbt/mutx-dev" target="_blank" rel="noreferrer" className="transition hover:text-cyan-400">GitHub</a>
            <a href="mailto:mario@mutx.dev" className="flex items-center gap-2 transition hover:text-cyan-400">
              <Mail className="h-4 w-4" />
              mario@mutx.dev
            </a>
          </div>
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} mutx.dev — The Agent Infrastructure Company</p>
        </div>
      </footer>
    </div>
  )
}
