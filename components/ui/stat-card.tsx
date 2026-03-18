'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

export function StatCard({ title, value, icon, subtitle, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-800 bg-slate-900/50 p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400 truncate">{title}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend && (
              <span className={cn(
                'text-sm',
                trend === 'up' ? 'text-emerald-400' :
                trend === 'down' ? 'text-rose-400' :
                'text-slate-500'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-slate-400 ml-4">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface StatsGridProps {
  stats: {
    totalAgents: number
    activeAgents: number
    totalDeployments: number
    activeDeployments: number
    totalApiKeys?: number
    totalWebhooks?: number
  }
  className?: string
}

// SVG icons (inline for portability)
function AgentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
      <path d="M18 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M6 21v-2a4 4 0 0 1 3-3.87" />
      <circle cx="12" cy="14" r="4" />
    </svg>
  )
}

function ActiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function DeploymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function ApiKeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

function WebhookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M18 16.98h-5.99c-1.66 0-3.01-1.34-3.01-3s1.34-3 3-3h.99" />
      <path d="M6 7.02h5.99c1.66 0 3.01 1.34 3.01 3s-1.34 3-3 3H9.83" />
      <path d="M12 8v8" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  )
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5', className)}>
      <StatCard
        title="Total Agents"
        value={stats.totalAgents}
        icon={<AgentIcon />}
        trend="stable"
      />
      <StatCard
        title="Active Agents"
        value={stats.activeAgents}
        icon={<ActiveIcon />}
        trend={stats.activeAgents > 0 ? 'up' : 'stable'}
        subtitle={`${stats.totalAgents > 0 ? Math.round((stats.activeAgents / stats.totalAgents) * 100) : 0}% utilization`}
        className="lg:col-span-1"
      />
      <StatCard
        title="Deployments"
        value={stats.totalDeployments}
        icon={<DeploymentIcon />}
        trend="stable"
      />
      <StatCard
        title="Active"
        value={stats.activeDeployments}
        icon={<ActiveIcon />}
        trend={stats.activeDeployments > 0 ? 'up' : 'stable'}
        className="sm:col-span-1 lg:col-span-1"
      />
      {stats.totalApiKeys !== undefined && (
        <StatCard
          title="API Keys"
          value={stats.totalApiKeys}
          icon={<ApiKeyIcon />}
          trend="stable"
        />
      )}
      {stats.totalWebhooks !== undefined && (
        <StatCard
          title="Webhooks"
          value={stats.totalWebhooks}
          icon={<WebhookIcon />}
          trend="stable"
        />
      )}
    </div>
  )
}
