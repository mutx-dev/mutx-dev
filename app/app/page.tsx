"use client";

import { ShieldCheck } from 'lucide-react';
import { AppDashboardClient } from '@/components/app/AppDashboardClient';
import { TerminalWindow } from '@/components/TerminalWindow';

const heroSignals = [
  { label: 'Auth path', value: 'session cookie → dashboard proxy' },
  { label: 'Operator loop', value: 'fleet truth → key control → refresh' },
  { label: 'Demo posture', value: 'no placeholders when data is absent' },
]

export default function OverviewPage() {
  return (
    <>
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
    </>
  );
}
