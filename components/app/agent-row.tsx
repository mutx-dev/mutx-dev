'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Play, Square, RefreshCw, MoreHorizontal, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { components } from '@/app/types/api'

type Agent = components['schemas']['AgentResponse']
type AgentStatus = components['schemas']['AgentStatus']

const statusColors: Record<string, string> = {
  creating: 'bg-amber-500',
  running: 'bg-emerald-500',
  stopped: 'bg-slate-500',
  failed: 'bg-rose-500',
  deleting: 'bg-orange-500',
}

const statusTextColors: Record<string, string> = {
  creating: 'text-amber-400',
  running: 'text-emerald-400',
  stopped: 'text-slate-400',
  failed: 'text-rose-400',
  deleting: 'text-orange-400',
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

function formatRelativeDate(value?: string | null) {
  if (!value) return 'Not recorded'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return 'Invalid'
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AgentRowProps {
  agent: Agent
  onDeploy?: (agentId: string) => Promise<void>
  onStop?: (agentId: string) => Promise<void>
  onDelete?: (agentId: string) => Promise<void>
  className?: string
}

export function AgentRow({ agent, onDeploy, onStop, onDelete, className }: AgentRowProps) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDeploy = async () => {
    if (!onDeploy) return
    setLoading(true)
    try {
      await onDeploy(agent.id)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!onStop) return
    setLoading(true)
    try {
      await onStop(agent.id)
    } finally {
      setLoading(false)
    }
  }

  const isRunning = agent.status === 'running'
  const isCreating = agent.status === 'creating'
  const isFailed = agent.status === 'failed'
  const canDeploy = agent.status === 'stopped' || isFailed
  const canStop = agent.status === 'running'

  return (
    <div className={cn('rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden', className)}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Status dot */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              statusColors[agent.status] ?? 'bg-slate-500',
              (isRunning || isCreating) && 'animate-pulse'
            )}
          />
        </div>

        {/* Agent info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white truncate">{agent.name}</h3>
            <span className={cn('text-xs font-medium', statusTextColors[agent.status] ?? 'text-slate-400')}>
              {agent.status}
            </span>
          </div>
          {agent.description && (
            <p className="text-sm text-slate-400 truncate mt-0.5">{agent.description}</p>
          )}
        </div>

        {/* Timestamps */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Created {formatRelativeDate(agent.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Updated {formatRelativeDate(agent.updated_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canDeploy && onDeploy && (
            <Button
              onClick={handleDeploy}
              variant="success"
              size="xs"
              disabled={loading}
            >
              <Play className="w-3.5 h-3.5" />
            </Button>
          )}
          {canStop && onStop && (
            <Button
              onClick={handleStop}
              variant="danger"
              size="xs"
              disabled={loading}
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            size="icon-xs"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 bg-slate-800/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">Agent ID</p>
              <p className="text-slate-300 font-mono text-xs truncate" title={agent.id}>{agent.id}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Created</p>
              <p className="text-slate-300">{formatDate(agent.created_at)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Last Updated</p>
              <p className="text-slate-300">{formatDate(agent.updated_at)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Config</p>
              <p className="text-slate-300">
                {agent.config && Object.keys(agent.config).length > 0
                  ? `${Object.keys(agent.config).length} keys`
                  : 'None'}
              </p>
            </div>
          </div>

          {isFailed && onDeploy && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleDeploy} variant="success" size="sm" disabled={loading}>
                <Play className="w-4 h-4 mr-1.5" />
                Retry Deploy
              </Button>
              {onDelete && (
                <Button onClick={() => onDelete(agent.id)} variant="danger" size="sm" disabled={loading}>
                  Delete Agent
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AgentRowListProps {
  agents: Agent[]
  onDeploy?: (agentId: string) => Promise<void>
  onStop?: (agentId: string) => Promise<void>
  onDelete?: (agentId: string) => Promise<void>
  className?: string
}

export function AgentRowList({ agents, onDeploy, onStop, onDelete, className }: AgentRowListProps) {
  if (!agents.length) {
    return (
      <div className="text-center text-slate-500 py-12">
        <p className="text-lg mb-1">No agents yet</p>
        <p className="text-sm">Deploy your first agent to get started</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {agents.map((agent) => (
        <AgentRow
          key={agent.id}
          agent={agent}
          onDeploy={onDeploy}
          onStop={onStop}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
