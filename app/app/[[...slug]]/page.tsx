import { ArrowRight, Command, Github } from 'lucide-react'
import Link from 'next/link'

import { AppDashboardClient } from '@/components/app/AppDashboardClient'
import { TerminalWindow } from '@/components/TerminalWindow'

const navItems = [
  { label: 'Overview', hint: 'session + fleet posture' },
  { label: 'Auth', hint: 'ownership-scoped access' },
  { label: 'Agents', hint: 'live inventory' },
  { label: 'Deployments', hint: 'timeline + recovery' },
  { label: 'API Keys', hint: 'generate / rotate / revoke' },
  { label: 'Health', hint: 'proxy reachability' },
]

const heroSignals = [
  { label: 'Auth path', value: 'session cookie → dashboard proxy' },
  { label: 'Operator loop', value: 'fleet truth → key control → refresh' },
  { label: 'Demo posture', value: 'no placeholders when data is absent' },
]

export default function AppPreviewPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030307] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="panel sticky top-4 h-fit rounded-[24px] border border-white/5 bg-white/[0.01] p-5 backdrop-blur-xl lg:min-h-[calc(100vh-2rem)]">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">app.mutx.dev</p>
                <p className="text-sm font-semibold text-white">Mission Control</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300/70">demo-ready operator surface</p>
              </div>
            </div>

            <nav className="space-y-2 text-sm font-medium text-slate-400">
              {navItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-3 py-2 transition-colors cursor-default ${
                    index === 0
                      ? 'border-cyan-400/20 bg-cyan-400/10 text-white'
                      : 'border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-300'
                  }`}
                >
                  <p>{item.label}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{item.hint}</p>
                </div>
              ))}
            </nav>

            <div className="absolute bottom-5 left-5 right-5 space-y-3 text-sm">
              <a href="https://github.com/fortunexbt/mutx-dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 transition hover:bg-white/[0.02] hover:text-white">
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a href="https://mutx.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-cyan-400 transition hover:bg-cyan-400/10">
                <ArrowRight className="h-4 w-4" />
                Marketing site
              </a>
            </div>
          </aside>

          <main className="space-y-6 pb-10">
            <section className="panel overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl">
              <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr] xl:items-start">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">Live Surface</span>
                  <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
                    Real authenticated operations.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
                    This isn&apos;t a mock UI. Authenticate directly against the FastAPI control plane to inspect live agent status, deployment configurations, and API keys.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {heroSignals.map((signal) => (
                      <div key={signal.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{signal.label}</p>
                        <p className="mt-2 text-sm text-white">{signal.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <TerminalWindow title="proxy-routes.ts" path="app/api/dashboard" label="network" className="shadow-2xl">
                  <div className="space-y-2.5">
                    <div className="terminal-line"><span className="terminal-prompt">$</span><span className="text-slate-300">POST /api/auth/login <span className="text-emerald-400">→</span> FastAPI/Auth</span></div>
                    <div className="terminal-line"><span className="terminal-prompt">$</span><span className="text-slate-300">GET /api/dashboard/agents <span className="text-emerald-400">→</span> FastAPI/Agents</span></div>
                    <div className="terminal-line"><span className="terminal-prompt">$</span><span className="text-slate-300">GET /api/dashboard/deployments <span className="text-emerald-400">→</span> FastAPI/Deployments</span></div>
                    <div className="terminal-line"><span className="terminal-prompt">$</span><span className="text-slate-300">GET /api/dashboard/health <span className="text-emerald-400">→</span> FastAPI/Health</span></div>
                    <div className="terminal-line pt-2"><span className="terminal-prompt">$</span><span className="terminal-caret text-cyan-300">|</span></div>
                  </div>
                </TerminalWindow>
              </div>
            </section>

            <AppDashboardClient />
          </main>
        </div>
      </div>
    </div>
  )
}
