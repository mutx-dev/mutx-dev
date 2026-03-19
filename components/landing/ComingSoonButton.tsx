'use client'

import { useState } from 'react'
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react'

type ComingSoonButtonProps = {
  className?: string
  label?: string
}

export function ComingSoonButton({
  className = '',
  label = 'Web dashboard',
}: ComingSoonButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="site-button-muted"
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] w-[min(92vw,34rem)] rounded-[1.6rem] border border-white/10 bg-[#07121cf2] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles className="mr-2 inline h-3.5 w-3.5" />
              web dashboard coming soon
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
            Start with the real control loop today.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            The live path today is the FastAPI control plane, the CLI, the first-party TUI, and the docs. The hosted dashboard is catching up, not missing.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="site-step-card">
              <div className="site-step-index">Live today</div>
              <p className="mt-3 text-sm font-semibold text-white">FastAPI, CLI, TUI, docs.</p>
              <p className="mt-2 text-sm leading-6 text-white/62">Run the stack locally and operate from the same control model.</p>
            </div>
            <div className="site-step-card">
              <div className="site-step-index">Coming next</div>
              <p className="mt-3 text-sm font-semibold text-white">Hosted dashboard surface.</p>
              <p className="mt-2 text-sm leading-6 text-white/62">The app shell exists, but daily-driver usage is still CLI, TUI, and docs.</p>
            </div>
            <div className="site-step-card">
              <div className="site-step-index">Best next step</div>
              <p className="mt-3 text-sm font-semibold text-white">Run the quickstart.</p>
              <p className="mt-2 text-sm leading-6 text-white/62">Clone, install, `make dev`, `mutx login`, `make seed`, and open `mutx tui`.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#quickstart" onClick={() => setOpen(false)} className="site-button-primary">
              Jump to quickstart
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://docs.mutx.dev" target="_blank" rel="noreferrer" className="site-button-secondary">
              Open docs
              <ExternalLink className="h-4 w-4" />
            </a>
            <a href="https://github.com/mutx-dev/mutx-dev" target="_blank" rel="noreferrer" className="site-button-secondary">
              View repo
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:text-white/72"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}
