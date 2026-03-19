import Image from 'next/image'
import { Binary, Command, GitBranch, ShieldCheck, TerminalSquare, Webhook } from 'lucide-react'
import { FloatLayer, TraceSweep } from '@/components/landing/MotionPrimitives'

type Metric = {
  label: string
  value: string
  delta?: string
}

type CliLine = {
  command: string
  result: string
}

type TuiRow = {
  label: string
  status: string
  tone?: 'good' | 'warn' | 'bad'
}

type CompactDemoSurfaceProps = {
  eyebrow?: string
  title?: string
  description?: string
  assetSrc?: string
  assetAlt?: string
  metrics?: Metric[]
  cliLines?: CliLine[]
  tuiRows?: TuiRow[]
  className?: string
}

const defaultMetrics: Metric[] = [
  { label: 'deploys', value: '142', delta: '+8 today' },
  { label: 'trace p95', value: '184ms', delta: 'green' },
  { label: 'replays', value: '9', delta: '2 pending' },
]

const defaultCliLines: CliLine[] = [
  { command: 'mutx deploy restart checkout-bot', result: 'restart queued · dep_241' },
  { command: 'mutx traces inspect run_4021', result: 'tool latency spike at step 07' },
  { command: 'mutx webhooks replay whd_91', result: 'delivery accepted · status 202' },
]

const defaultTuiRows: TuiRow[] = [
  { label: 'api auth boundary', status: 'stable', tone: 'good' },
  { label: 'checkout deploy prod', status: 'warming', tone: 'warn' },
  { label: 'stripe webhook replay', status: 'ready', tone: 'good' },
  { label: 'memory index rebuild', status: 'watch', tone: 'bad' },
]

const toneClasses: Record<NonNullable<TuiRow['tone']>, string> = {
  good: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  warn: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  bad: 'border-rose-300/25 bg-rose-300/10 text-rose-100',
}

export function CompactDemoSurface({
  eyebrow = 'Live-ish operator fantasy',
  title = 'A fake demo section that still behaves like product.',
  description = 'Compact dashboard/TUI/CLI storytelling without shipping a bloated marketing toy.',
  assetSrc = '/landing/webp/wiring-bay.webp',
  assetAlt = 'MUTX robot maintaining a runtime bay',
  metrics = defaultMetrics,
  cliLines = defaultCliLines,
  tuiRows = defaultTuiRows,
  className = '',
}: CompactDemoSurfaceProps) {
  return (
    <div className={`site-panel-strong relative overflow-hidden p-4 sm:p-5 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <TraceSweep className="pointer-events-none absolute left-0 top-16 h-px w-40 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent blur-[1px]" delay={0.4} />

      <div className="relative z-10 grid gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(18rem,1.06fr)]">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08121d]">
          <div className="relative">
            <Image
              src={assetSrc}
              alt={assetAlt}
              width={980}
              height={1470}
              sizes="(max-width: 1280px) 100vw, 34rem"
              className="h-[22rem] w-full object-cover object-top sm:h-[26rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050911] via-[#050911]/35 to-transparent" />

            <FloatLayer className="absolute bottom-4 left-4 right-4">
              <div className="rounded-[1.3rem] border border-white/12 bg-[#050911]/84 p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-100/74">{eyebrow}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">{description}</p>
              </div>
            </FloatLayer>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/46">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-cyan-100">{metric.value}</p>
                {metric.delta ? <p className="mt-1 text-sm text-white/62">{metric.delta}</p> : null}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)]">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#09121c]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/44">cli lane</p>
                  <p className="text-sm font-semibold text-white">Command surface</p>
                </div>
                <TerminalSquare className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="space-y-3 p-4 font-[family:var(--font-mono)] text-xs">
                {cliLines.map((line) => (
                  <div key={line.command} className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-cyan-100">
                      <span className="mr-2 text-cyan-300">$</span>
                      {line.command}
                    </p>
                    <p className="mt-2 text-white/56">{line.result}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#09121c]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/44">tui lane</p>
                  <p className="text-sm font-semibold text-white">Posture tape</p>
                </div>
                <Command className="h-4 w-4 text-cyan-200" />
              </div>

              <div className="space-y-3 p-4">
                {tuiRows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{row.label}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${toneClasses[row.tone || 'good']}`}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'auth', icon: ShieldCheck },
              { label: 'deploy', icon: GitBranch },
              { label: 'trace', icon: Binary },
              { label: 'hooks', icon: Webhook },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <item.icon className="h-4 w-4 text-cyan-200" />
                <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/56">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
