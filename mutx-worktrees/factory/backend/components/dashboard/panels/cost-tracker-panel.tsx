'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'

// Types
interface TokenStats {
  totalTokens: number
  totalCost: number
  requestCount: number
  avgTokensPerRequest: number
  avgCostPerRequest: number
}

interface UsageStats {
  summary: TokenStats
  models: Record<string, { totalTokens: number; totalCost: number; requestCount: number }>
  sessions: Record<string, { totalTokens: number; totalCost: number; requestCount: number }>
  timeframe: string
}

interface TaskCostEntry {
  taskId: number
  title: string
  status: string
  priority: string
  assignedTo?: string | null
  stats: TokenStats
}

interface TaskCostsResponse {
  summary: TokenStats
  tasks: TaskCostEntry[]
  unattributed: TokenStats
}

type View = 'overview' | 'tasks' | 'sessions'
type Timeframe = 'hour' | 'day' | 'week' | 'month'

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

const formatCost = (cost: number) => '$' + cost.toFixed(4)

const getModelDisplayName = (name: string) => name.split('/').pop() || name

export function CostTrackerPanel() {
  const [view, setView] = useState<View>('overview')
  const [timeframe, setTimeframe] = useState<Timeframe>('day')
  const [isLoading, setIsLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [taskData, setTaskData] = useState<TaskCostsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsRes, taskRes] = await Promise.all([
        fetch(`/api/tokens?action=stats&timeframe=${timeframe}`),
        fetch(`/api/tokens?action=task-costs&timeframe=${timeframe}`),
      ])

      const statsJson = await statsRes.json()
      const taskJson = await taskRes.json()

      setUsageStats(statsJson)
      setTaskData(taskJson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost data')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    refreshTimer.current = setInterval(loadData, 30000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [loadData])

  const summary = usageStats?.summary

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Cost Tracker</h1>
            <p className="text-muted-foreground mt-1">Monitor token usage and costs</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View tabs */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['overview', 'tasks', 'sessions'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            {/* Timeframe */}
            <div className="flex space-x-1">
              {(['hour', 'day', 'week', 'month'] as const).map(tf => (
                <Button key={tf} onClick={() => setTimeframe(tf)} variant={timeframe === tf ? 'default' : 'secondary'} size="sm">
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading && !usageStats ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
          <Button onClick={loadData} variant="outline" size="sm" className="ml-4">Retry</Button>
        </div>
      ) : view === 'overview' ? (
        <OverviewView stats={usageStats} taskData={taskData} timeframe={timeframe} onRefresh={loadData} />
      ) : view === 'tasks' ? (
        <TasksView taskData={taskData} onRefresh={loadData} />
      ) : (
        <SessionsView stats={usageStats} onRefresh={loadData} />
      )}
    </div>
  )
}

// Overview View
function OverviewView({
  stats,
  taskData,
  timeframe,
  onRefresh,
}: {
  stats: UsageStats | null
  taskData: TaskCostsResponse | null
  timeframe: Timeframe
  onRefresh: () => void
}) {
  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="text-lg mb-2">No usage data available</div>
        <Button onClick={onRefresh} variant="outline" size="sm">Refresh</Button>
      </div>
    )
  }

  const modelData = Object.entries(stats.models)
    .map(([model, s]) => ({ 
      name: getModelDisplayName(model), 
      fullName: model, 
      tokens: s.totalTokens, 
      cost: s.totalCost, 
      requests: s.requestCount 
    }))
    .sort((a, b) => b.cost - a.cost)

  const taskAttribution = taskData 
    ? ((1 - taskData.unattributed.totalCost / Math.max(stats.summary.totalCost, 0.0001)) * 100).toFixed(0)
    : '-'

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold">{formatCost(stats.summary.totalCost)}</div>
          <div className="text-sm text-muted-foreground">Total Cost ({timeframe})</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold">{formatNumber(stats.summary.totalTokens)}</div>
          <div className="text-sm text-muted-foreground">Total Tokens</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold">{formatNumber(stats.summary.requestCount)}</div>
          <div className="text-sm text-muted-foreground">API Requests</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold">{formatNumber(stats.summary.avgTokensPerRequest)}</div>
          <div className="text-sm text-muted-foreground">Avg Tokens/Request</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold">{taskAttribution}%</div>
          <div className="text-sm text-muted-foreground">Task Attributed</div>
        </div>
      </div>

      {/* Model breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Model Usage Breakdown</h2>
        {modelData.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No model data available</div>
        ) : (
          <div className="space-y-4">
            {modelData.slice(0, 8).map(m => {
              const costPer1k = m.cost / Math.max(1, m.tokens) * 1000
              const maxCost = Math.max(...modelData.map(d => d.cost / Math.max(1, d.tokens) * 1000), 0.0001)
              
              return (
                <div key={m.fullName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{m.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatNumber(m.tokens)} tokens</span>
                      <span className="font-mono">{formatCost(m.cost)}</span>
                      <span className="text-muted-foreground">{m.requests} reqs</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(m.cost / Math.max(stats.summary.totalCost, 0.0001)) * 100}%` }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Performance insights */}
      {modelData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const mostEfficient = modelData.length > 0
                ? modelData.reduce((best, curr) => {
                    const c = curr.cost / Math.max(1, curr.tokens)
                    const b = best.cost / Math.max(1, best.tokens)
                    return c < b ? curr : best
                  })
                : null
              const efficientCostPerToken = mostEfficient ? mostEfficient.cost / Math.max(1, mostEfficient.tokens) : 0
              const potentialSavings = Math.max(0, stats.summary.totalCost - stats.summary.totalTokens * efficientCostPerToken)

              return (
                <>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Most Efficient Model</div>
                    <div className="text-lg font-bold text-green-500">{mostEfficient?.name || '-'}</div>
                    {mostEfficient && <div className="text-xs text-muted-foreground">${(efficientCostPerToken * 1000).toFixed(4)}/1K tokens</div>}
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Avg Cost per Request</div>
                    <div className="text-lg font-bold">{formatCost(stats.summary.avgCostPerRequest)}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Optimization Potential</div>
                    <div className="text-lg font-bold text-orange-500">{formatCost(potentialSavings)}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.summary.totalCost > 0 ? ((potentialSavings / stats.summary.totalCost) * 100).toFixed(1) : '0'}% savings possible
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// Tasks View
function TasksView({
  taskData,
  onRefresh,
}: {
  taskData: TaskCostsResponse | null
  onRefresh: () => void
}) {
  if (!taskData) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="text-lg mb-2">No task cost data available</div>
        <Button onClick={onRefresh} variant="outline" size="sm">Refresh</Button>
      </div>
    )
  }

  const sortedTasks = [...taskData.tasks].sort((a, b) => b.stats.totalCost - a.stats.totalCost)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Task Costs</h2>
        <div className="text-sm text-muted-foreground">
          Total: {formatCost(taskData.summary.totalCost)} • Unattributed: {formatCost(taskData.unattributed.totalCost)}
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No task cost data available</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Task</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Assigned</th>
                <th className="text-right p-3 text-sm font-medium">Tokens</th>
                <th className="text-right p-3 text-sm font-medium">Cost</th>
                <th className="text-right p-3 text-sm font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map(task => (
                <tr key={task.taskId} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium truncate max-w-xs">{task.title}</div>
                    <div className="text-xs text-muted-foreground">#{task.taskId}</div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{task.assignedTo || '-'}</td>
                  <td className="p-3 text-right font-mono text-sm">{formatNumber(task.stats.totalTokens)}</td>
                  <td className="p-3 text-right font-mono text-sm">{formatCost(task.stats.totalCost)}</td>
                  <td className="p-3 text-right text-sm">{task.stats.requestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Sessions View
function SessionsView({
  stats,
  onRefresh,
}: {
  stats: UsageStats | null
  onRefresh: () => void
}) {
  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="text-lg mb-2">No session cost data available</div>
        <Button onClick={onRefresh} variant="outline" size="sm">Refresh</Button>
      </div>
    )
  }

  const sessionData = Object.entries(stats.sessions)
    .map(([sessionId, s]) => ({
      sessionId,
      tokens: s.totalTokens,
      cost: s.totalCost,
      requests: s.requestCount,
    }))
    .sort((a, b) => b.cost - a.cost)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Session Costs</h2>

      {sessionData.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No session cost data available</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Session</th>
                <th className="text-right p-3 text-sm font-medium">Tokens</th>
                <th className="text-right p-3 text-sm font-medium">Cost</th>
                <th className="text-right p-3 text-sm font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.slice(0, 50).map(session => (
                <tr key={session.sessionId} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-mono text-sm truncate max-w-xs">{session.sessionId}</div>
                  </td>
                  <td className="p-3 text-right font-mono text-sm">{formatNumber(session.tokens)}</td>
                  <td className="p-3 text-right font-mono text-sm">{formatCost(session.cost)}</td>
                  <td className="p-3 text-right text-sm">{session.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CostTrackerPanel
