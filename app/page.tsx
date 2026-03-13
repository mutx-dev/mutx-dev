'use client'

import {
  ArrowRight,
  BookOpen,
  Database,
  Github,
  GitBranch,
  Layers3,
  Server,
  Shield,
  Terminal,
  Twitter,
  CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { TerminalWindow } from '@/components/TerminalWindow'
import { WaitlistForm } from '@/components/WaitlistForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const TWITTER_URL = 'https://x.com/mutxdev'

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'What Exists', href: '#platform' },
  { label: 'Docs', href: 'https://docs.mutx.dev', external: true },
  { label: 'GitHub', href: GITHUB_URL, external: true },
  { label: 'Contact', href: '#contact' },
]

const features = [
  {
    icon: Shield,
    title: 'Auth And Access Foundations',
    description: 'Real login, tokens, current-user flows, and hashed API key lifecycle management already exist in the control plane.',
  },
  {
    icon: Database,
    title: 'Durable Control-Plane Records',
    description: 'Users, agents, deployments, logs, metrics, health, and readiness are modeled as product surfaces, not ad hoc scripts.',
  },
  {
    icon: GitBranch,
    title: 'Open Interfaces',
    description: 'Website, API, CLI, SDK, and infrastructure code live in one repo so the product contract stays inspectable and fixable.',
  },
]

const capabilities = [
  {
    icon: Layers3,
    title: 'Website And App Host',
    description: 'The web layer is part of the product: a public landing site, same-origin route proxies, a live waitlist flow, and an app surface preview.',
  },
  {
    icon: Server,
    title: 'FastAPI Control Plane',
    description: 'Live route groups cover auth, agents, deployments, API keys, webhook ingestion, newsletter, health, and readiness.',
  },
  {
    icon: Terminal,
    title: 'CLI, SDK, And Infra Foundations',
    description: 'Python client surfaces, Docker, Railway, Terraform, Ansible, and monitoring assets make the control plane usable beyond the browser.',
  },
]

const roadmap = [
  {
    title: 'Now',
    items: [
      'Tighten auth and ownership on agents and deployments',
      'Align CLI and SDK behavior with live API contracts',
      'Turn the app surface into a real authenticated dashboard',
      'Make contact and API key workflows more complete',
    ],
  },
  {
    title: 'Next',
    items: [
      'Typed agent configurations',
      'Deployment events and lifecycle history',
      'Webhook registration as a real product surface',
      'Better observability views for logs, metrics, and state changes',
    ],
  },
  {
    title: 'Later',
    items: [
      'Execution and traces APIs for agent runs',
      'Versioning, rollback, and deployment history UX',
      'Quota management',
      'Expanded runtime support and vector or RAG features',
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold tracking-wider">MUTX</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className="transition-colors hover:text-white"
              >
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
                <span>Open-source docs-first control plane</span>
              </div>
              
              <h1 className="text-4xl font-medium tracking-tight sm:text-6xl mb-6">
                The control plane for <br /> operating AI agents.
              </h1>
              
              <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-xl">
                MUTX is an open-source control plane for teams operating AI agents. Start with the docs and GitHub repo to inspect the current surface area, then join the waitlist or contact us for early access to the hosted operator experience.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-12">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  Inspect the code
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="https://docs.mutx.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <GitBranch className="h-4 w-4 opacity-80" />
                  Read the docs
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="max-w-md">
                <p className="mb-4 text-sm leading-relaxed text-white/50">
                  Public entry points are docs, GitHub, and the waitlist. The dashboard preview is intentionally not the primary path for first-time visitors.
                </p>
                <WaitlistForm source="hero" compact />
              </div>
            </div>

            <div className="relative">
              <TerminalWindow title="control-plane.sh" path="examples" label="live routes">
                <pre className="text-sm leading-relaxed">
BASE_URL=<span className="text-green-400">&quot;http://localhost:8000&quot;</span>{'\n\n'}
<span className="text-white/40"># Authenticate against the control plane</span>{'\n'}
curl -X POST <span className="text-green-400">&quot;$BASE_URL/auth/login&quot;</span>{'\n'}
<span className="text-white/40"># Inspect durable resources</span>{'\n'}
curl <span className="text-green-400">&quot;$BASE_URL/agents?limit=10&amp;skip=0&quot;</span>{'\n'}
curl <span className="text-green-400">&quot;$BASE_URL/deployments&quot;</span>{'\n'}
curl <span className="text-green-400">&quot;$BASE_URL/health&quot;</span>
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
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl mb-6">Control-plane foundations.</h2>
              <p className="text-lg text-white/60">
                MUTX is strongest today where agent projects usually fall apart first: identity, resource modeling, and operator-facing interfaces.
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
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl mb-6">What exists today.</h2>
              <p className="text-lg text-white/60">
                What exists today is a real control-plane shell with honest boundaries. Public visitors should start in docs and GitHub; the dashboard remains a preview while the operator surface matures.
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
                We publish the roadmap the same way we build the product: current-state first, target-state second, with the biggest gaps called out clearly.
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
              Join the waitlist for launch updates, docs changes, and early hosted access. If you are evaluating MUTX today, start with the docs and repository, then contact us for fit questions.
            </p>
            <div className="flex justify-center">
              <div className="w-full max-w-md text-left">
                <WaitlistForm source="footer" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-white/10 py-8 px-6 text-sm text-white/40 text-center flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="mutx.dev" width={20} height={20} className="object-contain" />
          <span>MUTX Open-Source Agent Control Plane</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a>
          <a href="https://docs.mutx.dev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:hello@mutx.dev" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}
