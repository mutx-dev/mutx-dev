'use client'

import {
  ArrowRight,
  Code2,
  Database,
  Github,
  GitBranch,
  Layers3,
  Mail,
  Server,
  Shield,
  Terminal,
  Twitter,
  CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'

import { TerminalWindow } from '@/components/TerminalWindow'
import { WaitlistForm } from '@/components/WaitlistForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const TWITTER_URL = 'https://x.com/mutxdev'

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Platform', href: '#platform' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Contribute', href: '#contribute' },
]

const features = [
  {
    icon: Shield,
    title: 'Operational Security',
    description: 'Built-in authentication, API key management, and fine-grained permissions.',
  },
  {
    icon: Database,
    title: 'Infrastructure First',
    description: 'Seamless integration with Docker, Terraform, and Ansible for reliable deployments.',
  },
  {
    icon: GitBranch,
    title: 'Open Source',
    description: 'A transparent, community-driven roadmap from local development to production.',
  },
]

const capabilities = [
  {
    icon: Layers3,
    title: 'Unified Operator Surface',
    description: 'A comprehensive Next.js frontend for monitoring, deployment management, and API key generation.',
  },
  {
    icon: Server,
    title: 'FastAPI Control Plane',
    description: 'High-performance backend exposing standard REST APIs for agent CRUD, health checks, and webhooks.',
  },
  {
    icon: Terminal,
    title: 'Developer CLI & SDK',
    description: 'Python client libraries and CLI tools for managing the agent lifecycle directly from your terminal.',
  },
]

const roadmap = [
  {
    title: 'Phase 1: Foundation',
    items: [
      'Authentication and authorization',
      'Agent CRUD and deployment APIs',
      'Python SDK and CLI parity',
      'Basic dashboard UI',
    ],
  },
  {
    title: 'Phase 2: Observability',
    items: [
      'Typed agent configurations',
      'Deployment event history',
      'Webhook registration system',
      'Runtime metrics and monitoring',
    ],
  },
  {
    title: 'Phase 3: Scale',
    items: [
      'Execution tracing and replay',
      'Versioning and deployment rollbacks',
      'Quota management',
      'Vector database integrations',
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <Image src="/logo-new.png" alt="MUTX" fill className="object-cover" />
            </div>
            <span className="text-sm font-semibold tracking-wider">MUTX</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="px-6 pt-32 pb-24 md:pt-48 md:pb-32">
          <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 mb-8">
                <span>Open Source Control Plane</span>
              </div>
              
              <h1 className="text-4xl font-medium tracking-tight sm:text-6xl mb-6">
                Deploy and operate <br /> AI agents at scale.
              </h1>
              
              <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-xl">
                MUTX is an open-source framework and control plane for building, deploying, and monitoring autonomous agents. Stop writing custom infrastructure and focus on agent logic.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-12">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  View Documentation
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="https://app.mutx.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Open Dashboard
                </a>
              </div>

              <div className="max-w-md">
                <WaitlistForm source="hero" compact />
              </div>
            </div>

            <div className="relative">
              <TerminalWindow title="deploy_agent.py" path="scripts" label="Python SDK">
                <pre className="text-sm leading-relaxed">
<span className="text-blue-400">from</span> mutx <span className="text-blue-400">import</span> Client{'\n\n'}
<span className="text-white/40"># Initialize the MUTX client</span>{'\n'}
client = Client(api_key=<span className="text-green-400">&quot;mutx_sk_...&quot;</span>){'\n\n'}
<span className="text-white/40"># Create a new autonomous agent</span>{'\n'}
agent = client.agents.create({'\n'}
  name=<span className="text-green-400">&quot;data-analyzer&quot;</span>,{'\n'}
  model=<span className="text-green-400">&quot;gpt-5.4&quot;</span>,{'\n'}
  capabilities=[<span className="text-green-400">&quot;sql&quot;</span>, <span className="text-green-400">&quot;pandas&quot;</span>]{'\n'}
){'\n\n'}
<span className="text-white/40"># Deploy to the control plane</span>{'\n'}
deployment = client.deployments.create({'\n'}
  agent_id=agent.id,{'\n'}
  environment=<span className="text-green-400">&quot;production&quot;</span>,{'\n'}
  replicas=<span className="text-yellow-300">3</span>{'\n'}
){'\n\n'}
<span className="text-blue-400">print</span>(<span className="text-green-400">f&quot;Agent deployed: </span>{'{'}deployment.url{'}'}<span className="text-green-400">&quot;</span>)
                </pre>
              </TerminalWindow>
            </div>
          </div>
        </section>

        <div className="border-t border-white/10" />

        {/* Overview Section */}
        <section id="overview" className="px-6 py-24 bg-[#050505]">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl mb-6">Production-ready primitives.</h2>
              <p className="text-lg text-white/60">
                Everything you need to take an agent from a local script to a resilient, monitored service.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-8 transition-colors hover:bg-[#111111]">
                  <feature.icon className="h-6 w-6 text-white mb-6" />
                  <h3 className="text-lg font-medium text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Section */}
        <section id="platform" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl mb-6">Unified Operator Surface.</h2>
              <p className="text-lg text-white/60">
                Manage your agents through a clean web dashboard, interact via standard REST APIs, or automate with our SDKs.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {capabilities.map((cap) => (
                <div key={cap.title} className="flex flex-col border-l border-white/10 pl-6">
                  <cap.icon className="h-5 w-5 text-white/80 mb-4" />
                  <h3 className="text-base font-medium text-white mb-2">{cap.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-white/10" />

        {/* Roadmap Section */}
        <section id="roadmap" className="px-6 py-24 bg-[#050505]">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl mb-6">Development Roadmap.</h2>
              <p className="text-lg text-white/60">
                Our vision for building the most robust agent infrastructure. We build in public and welcome community contributions.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {roadmap.map((phase) => (
                <div key={phase.title} className="rounded-xl border border-white/10 bg-black p-8">
                  <h3 className="text-lg font-medium text-white mb-6">{phase.title}</h3>
                  <ul className="space-y-4">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-white/60">
                        <CheckCircle2 className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contribute Section */}
        <section id="contribute" className="px-6 py-32 border-t border-white/10 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-medium tracking-tight sm:text-5xl mb-6">Build with MUTX.</h2>
            <p className="text-lg text-white/60 mb-10 leading-relaxed">
              Join the waitlist to receive updates on our progress, get access to early technical documentation, and start building with the MUTX framework.
            </p>
            <div className="flex justify-center">
              <div className="w-full max-w-md text-left">
                <WaitlistForm source="footer" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 px-6 text-sm text-white/40 text-center flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo-new.png" alt="mutx.dev" width={20} height={20} className="rounded" />
          <span>MUTX Open Source Control Plane</span>
        </div>
        <div className="flex gap-6">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a>
          <a href="mailto:hello@mutx.dev" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}