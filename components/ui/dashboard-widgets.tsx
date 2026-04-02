'use client'

import { cn } from '@/lib/utils'

// --- SignalPill: compact status indicator pill ---

export type SignalPillTone = 'success' | 'warning' | 'info' | 'error'

export function SignalPill({ label, value, tone }: {
  label: string
  value: string
  tone: SignalPillTone
}) {
  const toneClass = tone === 'success'
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    : tone === 'warning'
      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
      : tone === 'error'
        ? 'bg-red-500/15 border-red-500/30 text-red-300'
        : 'bg-blue-500/15 border-blue-500/30 text-blue-300'

  return (
    <div className={cn('rounded-lg border px-2.5 py-2', toneClass)}>
      <div className="text-2xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xs font-semibold font-mono truncate">{value}</div>
    </div>
  )
}

// --- MetricCard: compact stat card with icon ---

export type MetricCardColor = 'blue' | 'green' | 'purple' | 'red' | 'amber'

const COLOR_MAP: Record<MetricCardColor, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export function DashboardMetricCard({ label, value, total, subtitle, icon, color }: {
  label: string
  value: number | string
  total?: number
  subtitle?: string
  icon: React.ReactNode
  color: MetricCardColor
}) {
  return (
    <div className={cn('rounded-lg border p-3.5', COLOR_MAP[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <div className="w-5 h-5 opacity-60">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {total != null && (
          <span className="text-xs opacity-50 font-mono">/ {total}</span>
        )}
      </div>
      {subtitle && (
        <div className="text-2xs opacity-50 font-mono mt-0.5">{subtitle}</div>
      )}
    </div>
  )
}

// --- HealthRow: labeled row with optional progress bar ---

export function HealthRow({ label, value, status, bar }: {
  label: string
  value: string
  status: 'good' | 'warn' | 'bad'
  bar?: number
}) {
  const statusColor = status === 'good'
    ? 'text-emerald-400'
    : status === 'warn'
      ? 'text-amber-400'
      : 'text-red-400'

  const barColor = bar == null ? ''
    : bar > 90 ? 'bg-red-500'
    : bar > 70 ? 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={cn('text-xs font-medium font-mono', statusColor)}>{value}</span>
      </div>
      {bar != null && (
        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

// --- Dashboard overview section (adapted from mutx-control dashboard.tsx) ---

export interface DashboardOverviewProps {
  isLoading?: boolean
  agentStats: {
    total: number
    running: number
    stopped: number
  }
  deploymentStats: {
    total: number
    running: number
    failed: number
  }
  apiHealth: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  errorCount?: number
  className?: string
}

export function getSignalTone(status: 'good' | 'warn' | 'bad' | 'healthy' | 'degraded' | 'unhealthy' | 'unknown'): SignalPillTone {
  if (status === 'good' || status === 'healthy') return 'success'
  if (status === 'warn' || status === 'degraded') return 'warning'
  if (status === 'bad' || status === 'unhealthy') return 'error'
  return 'info'
}

export function DashboardOverview({
  isLoading: _isLoading,
  agentStats,
  deploymentStats,
  apiHealth,
  errorCount = 0,
  className,
}: DashboardOverviewProps) {
  const healthTone = getSignalTone(apiHealth)

  return (
    <section className={cn('space-y-4', className)}>
      {/* Overview header bar */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-slate-500">Overview</div>
            <h2 className="text-lg font-semibold text-white">MUTX Control Plane</h2>
            <p className="text-xs text-slate-400">
              Agent fleet status, deployment health, and operational signals.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[280px]">
            <SignalPill
              label="API"
              value={apiHealth === 'unknown' ? 'Checking...' : apiHealth}
              tone={healthTone}
            />
            <SignalPill
              label="Agents"
              value={`${agentStats.running}/${agentStats.total}`}
              tone={agentStats.running > 0 ? 'success' : 'info'}
            />
            <SignalPill
              label="Deployments"
              value={`${deploymentStats.running}/${deploymentStats.total}`}
              tone={deploymentStats.running > 0 ? 'success' : 'info'}
            />
            <SignalPill
              label="Errors"
              value={String(errorCount)}
              tone={errorCount > 0 ? 'warning' : 'success'}
            />
          </div>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <DashboardMetricCard
          label="Total Agents"
          value={agentStats.total}
          icon={<AgentsIcon />}
          color="blue"
        />
        <DashboardMetricCard
          label="Running"
          value={agentStats.running}
          icon={<RunningIcon />}
          color="green"
          subtitle={agentStats.total > 0 ? `${Math.round((agentStats.running / agentStats.total) * 100)}%` : '0%'}
        />
        <DashboardMetricCard
          label="Stopped"
          value={agentStats.stopped}
          icon={<StoppedIcon />}
          color="amber"
        />
        <DashboardMetricCard
          label="Deployments"
          value={deploymentStats.total}
          icon={<DeployIcon />}
          color="purple"
        />
        <DashboardMetricCard
          label="Active"
          value={deploymentStats.running}
          icon={<RunningIcon />}
          color="green"
        />
        <DashboardMetricCard
          label="Failed"
          value={deploymentStats.failed}
          icon={<FailedIcon />}
          color={deploymentStats.failed > 0 ? 'red' : 'blue'}
        />
      </div>
    </section>
  )
}

// --- Inline SVG icons ---

export function AgentsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="6" r="3" />
      <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 9v5M19 7v7" />
    </svg>
  )
}

export function RunningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 3l10 7-10 7V3z" />
    </svg>
  )
}

export function StoppedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="12" height="12" rx="2" />
    </svg>
  )
}

export function DeployIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 2L2 7l8 5 8-5-8-5z" />
      <path d="M2 12l8 5 8-5" />
      <path d="M2 17l8 5 8-5" />
    </svg>
  )
}

export function FailedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M7 7l6 6M13 7l-6 6" />
    </svg>
  )
}
