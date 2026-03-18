'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'

interface DashboardAgent {
  id: string | number
  name?: string
  status?: string
  created_at?: string
}

interface DashboardDeploymentEvent {
  id?: string | number
  event_type?: string
  status?: string
  created_at?: string
  metadata?: Record<string, unknown>
}

interface DashboardDeployment {
  id: string | number
  status?: string
  replicas?: number
  created_at?: string
  updated_at?: string
  agent_id?: string | number
  agent?: {
    id?: string | number
    name?: string
  }
  events?: DashboardDeploymentEvent[]
}

type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

interface TaskCard {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: string
  createdAt?: string
  tags: string[]
}

const STATUS_COLUMNS: Array<{ key: TaskStatus; title: string; color: string }> = [
  { key: 'inbox', title: 'Inbox', color: 'bg-slate-500/20 text-slate-300' },
  { key: 'assigned', title: 'Assigned', color: 'bg-blue-500/20 text-blue-300' },
  { key: 'in_progress', title: 'In Progress', color: 'bg-amber-500/20 text-amber-300' },
  { key: 'review', title: 'Review', color: 'bg-purple-500/20 text-purple-300' },
  { key: 'done', title: 'Done', color: 'bg-emerald-500/20 text-emerald-300' },
]

const priorityBorder: Record<TaskPriority, string> = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
}

function formatRelativeTime(value?: string) {
  if (!value) return 'recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

function buildTaskCards(agents: DashboardAgent[], deployments: DashboardDeployment[]): TaskCard[] {
  const deploymentTasks: TaskCard[] = deployments.map((deployment) => {
    const latestEvent = [...(deployment.events ?? [])]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })[0]

    const status = (deployment.status ?? '').toLowerCase()
    const eventType = (latestEvent?.event_type ?? '').toLowerCase()

    let column: TaskStatus = 'assigned'
    if (status === 'failed' || status === 'error') column = 'review'
    else if (status === 'running' || status === 'ready') column = 'done'
    else if (status === 'creating' || status === 'pending') column = 'in_progress'
    else if (eventType.includes('restart') || eventType.includes('scale')) column = 'in_progress'

    let priority: TaskPriority = 'medium'
    if (status === 'failed' || status === 'error') priority = 'critical'
    else if (status === 'stopped' || status === 'killed') priority = 'high'
    else if (status === 'creating' || status === 'pending') priority = 'medium'
    else priority = 'low'

    const agentName = deployment.agent?.name || agents.find((agent) => String(agent.id) === String(deployment.agent_id))?.name

    return {
      id: `deployment-${deployment.id}`,
      title: `Deployment ${deployment.id}`,
      description: latestEvent?.event_type
        ? `Latest event: ${latestEvent.event_type}`
        : `Deployment status: ${deployment.status ?? 'unknown'}`,
      status: column,
      priority,
      assignedTo: agentName,
      createdAt: latestEvent?.created_at || deployment.updated_at || deployment.created_at,
      tags: [
        'deployment',
        deployment.status ?? 'unknown',
        ...(deployment.replicas && deployment.replicas > 1 ? [`${deployment.replicas} replicas`] : []),
      ],
    }
  })

  const agentTasks: TaskCard[] = agents.map((agent) => {
    const normalized = (agent.status ?? '').toLowerCase()
    let status: TaskStatus = 'inbox'
    if (normalized === 'running' || normalized === 'active') status = 'done'
    else if (normalized === 'creating' || normalized === 'starting') status = 'in_progress'
    else if (normalized === 'failed' || normalized === 'error') status = 'review'
    else if (normalized === 'stopped' || normalized === 'idle') status = 'assigned'

    let priority: TaskPriority = 'medium'
    if (normalized === 'failed' || normalized === 'error') priority = 'critical'
    else if (normalized === 'stopped') priority = 'high'
    else if (normalized === 'creating' || normalized === 'starting') priority = 'medium'
    else priority = 'low'

    return {
      id: `agent-${agent.id}`,
      title: agent.name ? `Agent ${agent.name}` : `Agent ${agent.id}`,
      description: `Current agent status: ${agent.status ?? 'unknown'}`,
      status,
      priority,
      assignedTo: agent.name,
      createdAt: agent.created_at,
      tags: ['agent', agent.status ?? 'unknown'],
    }
  })

  return [...deploymentTasks, ...agentTasks]
}

export function TaskBoard() {
  const [agents, setAgents] = useState<DashboardAgent[]>([])
  const [deployments, setDeployments] = useState<DashboardDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskCard | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const [agentsRes, deploymentsRes] = await Promise.all([
        fetch('/api/dashboard/agents'),
        fetch('/api/dashboard/deployments'),
      ])

      if (!agentsRes.ok || !deploymentsRes.ok) {
        throw new Error('Failed to fetch dashboard work queue')
      }

      const [agentsData, deploymentsData] = await Promise.all([
        agentsRes.json(),
        deploymentsRes.json(),
      ])

      setAgents(Array.isArray(agentsData) ? agentsData : agentsData.agents ?? [])
      setDeployments(Array.isArray(deploymentsData) ? deploymentsData : deploymentsData.deployments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task board')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tasks = useMemo(() => buildTaskCards(agents, deployments), [agents, deployments])

  const tasksByStatus = useMemo(
    () =>
      STATUS_COLUMNS.reduce(
        (acc, column) => {
          acc[column.key] = tasks.filter((task) => task.status === column.key)
          return acc
        },
        {} as Record<TaskStatus, TaskCard[]>,
      ),
    [tasks],
  )

  if (loading) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-80 bg-slate-900/60 rounded-xl border border-white/5" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="text-xl font-bold text-white">Task Board</h2>
          <p className="mt-1 text-sm text-slate-400">
            Derived from MUTX agents + deployments until /api/dashboard/tasks lands.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/20"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-4">
        <div className="grid min-w-max grid-cols-1 gap-4 xl:grid-cols-5">
          {STATUS_COLUMNS.map((column) => (
            <div
              key={column.key}
              className="flex min-h-[28rem] w-80 flex-col rounded-xl border border-white/10 bg-slate-950/60"
            >
              <div className={`flex items-center justify-between rounded-t-xl border-b border-white/10 px-4 py-3 ${column.color}`}>
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono">
                  {tasksByStatus[column.key]?.length || 0}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {tasksByStatus[column.key]?.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className={`w-full rounded-lg border border-white/10 border-l-4 bg-black/20 p-3 text-left shadow-sm transition hover:border-cyan-400/30 hover:bg-white/[0.03] ${priorityBorder[task.priority]}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-white">{task.title}</h4>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {task.priority}
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-500">
                      <span>{task.assignedTo || 'Unassigned'}</span>
                      <span>{formatRelativeTime(task.createdAt)}</span>
                    </div>
                    {task.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map((tag) => (
                          <span
                            key={`${task.id}-${tag}`}
                            className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}

                {tasksByStatus[column.key]?.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-600">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedTask(null)
          }}
        >
          <Card className="w-full max-w-xl border border-white/10 bg-slate-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedTask.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{selectedTask.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-2xl leading-none text-slate-500 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Status</span>
                <p className="mt-1 text-white">{selectedTask.status}</p>
              </div>
              <div>
                <span className="text-slate-500">Priority</span>
                <p className="mt-1 text-white">{selectedTask.priority}</p>
              </div>
              <div>
                <span className="text-slate-500">Assigned</span>
                <p className="mt-1 text-white">{selectedTask.assignedTo || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-500">Updated</span>
                <p className="mt-1 text-white">{formatRelativeTime(selectedTask.createdAt)}</p>
              </div>
            </div>

            {selectedTask.tags.length > 0 && (
              <div className="mt-6">
                <span className="text-sm text-slate-500">Tags</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTask.tags.map((tag) => (
                    <span
                      key={`${selectedTask.id}-detail-${tag}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default TaskBoard
