'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  ChevronRight,
  CheckCircle2,
  Github,
  Twitter
} from 'lucide-react'

// --- Components ---

const Nav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20">
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8 overflow-hidden rounded-lg">
        <Image src="/logo-new.png" alt="mutx.dev" fill className="object-cover" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">mutx<span className="text-cyan-400">.dev</span></span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
      <a href="#features" className="hover:text-white transition">Features</a>
      <a href="#architecture" className="hover:text-white transition">Architecture</a>
      <a href="#cli" className="hover:text-white transition">CLI</a>
    </div>
    <div className="flex items-center gap-4">
      <a href="https://github.com/fortunexbt/mutx.dev" className="text-slate-400 hover:text-white transition">
        <Github className="h-5 w-5" />
      </a>
      <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-200 transition">
        Get Started
      </button>
    </div>
  </nav>
)

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.04]">
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <p className="mt-3 text-slate-400 leading-relaxed">{description}</p>
  </div>
)

const CodeSnippet = () => {
  const [activeTab, setActiveTab] = useState('cli')
  
  const snippets = {
    cli: `mutx deploy ./agent.py --name "researcher-v1"
# ❯ Deploying to mutx-cloud...
# ❯ Agent "researcher-v1" is live at research-v1.mutx.app
# ❯ Logs streaming at mutx.dev/dash/logs`,
    sdk: `from mutx import MutxClient

client = MutxClient()
agent = client.deploy(
    source="./agent.py",
    config={"model": "gpt-4-turbo"}
)

print(f"Agent running: {agent.url}")`
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
      <div className="flex border-b border-white/5 bg-white/5 px-4">
        <button 
          onClick={() => setActiveTab('cli')}
          className={`px-4 py-3 text-sm font-medium transition ${activeTab === 'cli' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
        >
          CLI
        </button>
        <button 
          onClick={() => setActiveTab('sdk')}
          className={`px-4 py-3 text-sm font-medium transition ${activeTab === 'sdk' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
        >
          Python SDK
        </button>
      </div>
      <div className="p-6 font-mono text-sm leading-relaxed text-slate-300">
        <pre><code>{snippets[activeTab as keyof typeof snippets]}</code></pre>
      </div>
    </div>
  )
}

// --- Page ---

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#030307] text-slate-200">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[30%] w-[30%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-sm font-medium text-cyan-300"
          >
            <Zap className="h-4 w-4" />
            <span>Infrastructure for the Agentic Era</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl max-w-5xl leading-[1.1]"
          >
            THE AGENTIC <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ERA IS HERE.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed"
          >
            The control plane for long-running, autonomous agents. Managed hosting, observability, and state persistence for your AI workforce.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          >
            <button className="group flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-4 text-lg font-bold text-black transition hover:bg-cyan-400">
              Get Early Access
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10">
              <Terminal className="h-5 w-5" />
              View Docs
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-24 w-full max-w-5xl"
          >
            <div className="relative rounded-2xl border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div className="ml-4 h-5 w-32 rounded bg-white/5" />
              </div>
              <div className="aspect-[16/9] w-full rounded-lg bg-slate-900/80 flex items-center justify-center border border-white/5 overflow-hidden">
                <CodeSnippet />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Built for production reliability.</h2>
            <p className="mt-4 text-slate-400">Everything you need to move agents from local scripts to production scale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Cpu}
              title="Compute-Optimized"
              description="Deploy on high-availability clusters optimized for long-running LLM workloads and heavy token processing."
            />
            <FeatureCard 
              icon={Shield}
              title="State Persistence"
              description="Built-in vector and relational state persistence. Your agents never lose context, even across restarts."
            />
            <FeatureCard 
              icon={Globe}
              title="Global Scale"
              description="Deploy agents closer to your users with automated edge routing and low-latency webhook ingestion."
            />
            <FeatureCard 
              icon={Zap}
              title="Instant Re-runs"
              description="Deterministic replays and execution logs to debug complex agentic decision-making processes."
            />
            <FeatureCard 
              icon={Terminal}
              title="Unified CLI"
              description="A single tool to manage auth, deployment, and environment variables across your entire agent fleet."
            />
            <FeatureCard 
              icon={CheckCircle2}
              title="Auto-Healing"
              description="Intelligent monitoring that automatically restarts crashed agents and alerts on execution anomalies."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 sm:px-10 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image src="/logo-new.png" alt="mutx.dev" width={32} height={32} />
            <span className="text-lg font-bold text-white">mutx.dev</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <a href="#" className="hover:text-cyan-400 transition">Twitter</a>
            <a href="#" className="hover:text-cyan-400 transition">GitHub</a>
            <a href="#" className="hover:text-cyan-400 transition">Privacy</a>
            <a href="#" className="hover:text-cyan-400 transition">Terms</a>
          </div>
          <p className="text-sm text-slate-600">© 2024 mutx.dev — The Agent Infrastructure Company</p>
        </div>
      </footer>
    </div>
  )
}
