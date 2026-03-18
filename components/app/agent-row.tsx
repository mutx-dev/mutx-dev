'use client'

import { cn } from '@/lib/utils'

export type AgentStatus = 'online' | 'offline' | 'busy' | 'idle' | 'error'

const STATUS_COLORS: Record<AgentStatus, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-green-500',
  busy: 'bg-yellow-500',
  error: 'bg-red-500',
  offline: 'bg-gray-500',
}

const STATUS_TONE: Record<AgentStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  online: 'success',
  idle: 'success',
  busy: 'warning',
  error: 'error',
  offline: 'neutral',
}

export interface AgentRowProps {
  agent: {
    id: string
    name: string
    description?: string
    type?: string
    status?: AgentStatus
    created_at?: string
    last_seen?: string
    task_count?: number
    deployment_count?: number
  }
  onClick?: (agent: AgentRowProps['agent']) => void
  className?: string
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toLocaleDateString()
}

export function AgentRow({ agent, onClick, className }: AgentRowProps) {
  const status = agent.status ?? 'offline'
  const colorClass = STATUS_COLORS[status]

  return (
    <div
      onClick={() => onClick?.(agent)}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-white/5 bg-black/20 p-4',
        'hover:bg-white/5 transition-colors cursor-pointer',
        className,
      )}
    >
      {/* Status indicator */}
      <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', colorClass)} />

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white truncate">{agent.name}</span>
          {agent.type && (
            <span className="text-2xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
              {agent.type}
            </span>
          )}
        </div>
        {agent.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{agent.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
        {agent.task_count != null && (
          <div className="text-center">
            <div className="font-mono font-medium text-white">{agent.task_count}</div>
            <div className="text-2xs">tasks</div>
          </div>
        )}
        {agent.deployment_count != null && (
          <div className="text-center">
            <div className="font-mono font-medium text-white">{agent.deployment_count}</div>
            <div className="text-2xs">deploys</div>
          </div>
        )}
        <div className="text-right">
          <div className={cn(
            'text-2xs font-medium uppercase tracking-wide',
            status === 'online' || status === 'idle' ? 'text-emerald-400' :
            status === 'busy' ? 'text-yellow-400' :
            status === 'error' ? 'text-red-400' :
            'text-slate-500',
          )}>{status}</div>
          <div className="text-2xs text-slate-500">{formatDate(agent.last_seen)}</div>
        </div>
      </div>
    </div>
  )
}

// Compact agent row for tables
export function AgentRowCompact({ agent, className }: { agent: AgentRowProps['agent']; className?: string }) {
  const status = agent.status ?? 'offline'
  const colorClass = STATUS_COLORS[status]

  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      <div className={cn('w-2 h-2 rounded-full shrink-0', colorClass)} />
      <span className="text-sm text-white font-medium truncate flex-1">{agent.name}</span>
      {agent.type && <span className="text-2xs text-slate-500">{agent.type}</span>}
      <span className={cn(
        'text-2xs font-medium',
        status === 'online' || status === 'idle' ? 'text-emerald-400' :
        status === 'busy' ? 'text-yellow-400' :
        status === 'error' ? 'text-red-400' :
        'text-slate-500',
      )}>{status}</span>
    </div>
  )
}
