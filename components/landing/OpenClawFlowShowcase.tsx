'use client'

const wizardSteps = [
  {
    id: '01',
    title: 'Detect or install upstream OpenClaw',
    body: 'MUTX looks for the real openclaw binary and home path first. If it is missing, the wizard runs the upstream installer in the same terminal.',
    accent: 'binary → /opt/homebrew/bin/openclaw',
  },
  {
    id: '02',
    title: 'Resume upstream onboarding',
    body: 'MUTX hands off to `openclaw onboard --install-daemon`, then returns to the wizard without breaking the shell story.',
    accent: 'onboard → local gateway ready',
  },
  {
    id: '03',
    title: 'Import runtime into MUTX tracking',
    body: 'The upstream OpenClaw home stays where it is. MUTX mirrors the path, manifest, bindings, and wizard state under `~/.mutx/providers/openclaw`.',
    accent: 'track → ~/.mutx/providers/openclaw',
  },
  {
    id: '04',
    title: 'Bind a dedicated assistant',
    body: 'The Personal Assistant gets its own OpenClaw assistant id and workspace. MUTX never points it at `main`.',
    accent: 'bind → personal-assistant',
  },
  {
    id: '05',
    title: 'Surface local truth everywhere',
    body: 'CLI and TUI read the live local runtime. The dashboard gets an honest last-seen snapshot instead of pretending it can inspect your machine directly.',
    accent: 'surfaces → CLI · TUI · dashboard · /v1',
  },
] as const

const surfaceTags = ['CLI wizard', 'TUI setup pane', 'Dashboard last-seen', '/v1 runtime APIs'] as const

const transcriptLines = [
  '$ curl -fsSL https://mutx.dev/install.sh | bash',
  '> detected openclaw /opt/homebrew/bin/openclaw',
  '> resolved home ~/.openclaw',
  '> importing runtime into ~/.mutx/providers/openclaw',
  '> local keys stay on this machine',
  '> launching mutx setup hosted --provider openclaw',
] as const

export function OpenClawFlowShowcase() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <article className="landing-panel-strong relative overflow-hidden p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,122,61,0.22),transparent_24%),radial-gradient(circle_at_100%_18%,rgba(103,232,249,0.14),transparent_26%),linear-gradient(135deg,rgba(255,122,61,0.06),transparent_38%)]"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="landing-kicker border-orange-300/25 bg-orange-400/10 text-orange-100">
              🦞 OpenClaw flow
            </span>
            <span className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-4 py-2 font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              same terminal
            </span>
          </div>

          <h3 className="mt-6 max-w-xl font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-[3.25rem]">
            Detect. Import. Bind. Surface.
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/82">
            MUTX keeps the operator shell, the control-plane language, and the
            inspection surfaces. OpenClaw stays upstream and local, then gets
            folded into the MUTX registry cleanly.
          </p>

          <div className="mt-8 space-y-4">
            {wizardSteps.map((step) => (
              <div
                key={step.id}
                className="grid gap-4 rounded-[1.8rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:grid-cols-[auto_minmax(0,1fr)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-orange-300/30 bg-orange-400/10 font-[family:var(--font-landing-mono)] text-sm font-semibold tracking-[0.2em] text-orange-100">
                    {step.id}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold tracking-[-0.04em] text-white">
                      {step.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-slate-300/76">
                      {step.body}
                    </p>
                  </div>
                </div>
                <div className="self-center rounded-[1.2rem] border border-cyan-300/16 bg-cyan-300/[0.08] px-4 py-3 font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.22em] text-cyan-100 sm:ml-[4rem]">
                  {step.accent}
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="landing-panel relative overflow-hidden p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,122,61,0.14),transparent_28%),radial-gradient(circle_at_0%_100%,rgba(103,232,249,0.12),transparent_30%)]"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-200">
              local runtime
            </span>
            <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-orange-100">
              keys stay local
            </span>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(15rem,0.95fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#03101a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" />
                <span className="ml-3 font-[family:var(--font-landing-mono)] text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">
                  Wizard transcript
                </span>
              </div>
              <div className="space-y-3 px-5 py-5 font-[family:var(--font-landing-mono)] text-[0.78rem] leading-7 text-slate-200">
                {transcriptLines.map((line, index) => (
                  <div
                    key={line}
                    className={
                      index === 0
                        ? 'text-cyan-100'
                        : line.includes('keys stay local')
                          ? 'text-orange-100'
                          : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
                <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Provider registry
                </p>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-[1.4rem] border border-white/10 bg-[#020912] px-4 py-4 font-[family:var(--font-landing-mono)] text-[0.72rem] leading-7 text-slate-200">{`~/.mutx/providers/openclaw/
├─ manifest.json
├─ wizard-state.json
├─ bindings/personal-assistant.json
└─ pointers/home -> ~/.openclaw`}</pre>
              </div>

              <div className="rounded-[1.8rem] border border-cyan-300/16 bg-cyan-300/[0.08] p-5">
                <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  Surfaces
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {surfaceTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-2 font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200/82">
                  Live local truth stays in CLI and TUI. The dashboard gets a
                  last-seen snapshot with the real runtime path, binding, and
                  staleness instead of fake server-local health.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
