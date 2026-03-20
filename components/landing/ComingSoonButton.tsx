'use client'

import { useState } from 'react'
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

type ComingSoonButtonProps = {
  className?: string
  label?: string
}

export function ComingSoonButton({
  className = '',
  label = 'Hosted app',
}: ComingSoonButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.8rem)] z-50 w-[min(92vw,34rem)] rounded-[28px] border border-[#20304a] bg-[linear-gradient(180deg,#0b1220_0%,#070d18_100%)] p-5 text-white shadow-[0_30px_90px_rgba(2,6,23,0.45)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            app surface status
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-50">
            Hosted app later. Real control plane now.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            The public site and docs are supported today. The browser app shell exists and keeps growing, but direct
            operator truth still runs through the FastAPI control plane, CLI, TUI, and documented route contract.
          </p>

          <div className="mt-5 grid gap-3">
            {[
              {
                title: 'Supported today',
                body: 'mutx.dev, docs.mutx.dev, the mounted `/v1/*` API, install path, CLI, and TUI.',
              },
              {
                title: 'Preview surface',
                body: 'app.mutx.dev is the browser-facing operator shell, documented honestly as aspirational.',
              },
              {
                title: 'Best next step',
                body: 'Run the quickstart, inspect the dashboard/app routes, then operate against the same backend contract.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#quickstart"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open quickstart
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://docs.mutx.dev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/15"
            >
              Read docs
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/mutx-dev/mutx-dev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-3 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              View repo
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 transition hover:text-slate-300"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}
