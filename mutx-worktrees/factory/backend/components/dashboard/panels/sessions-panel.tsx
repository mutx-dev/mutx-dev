'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface Session {
  id: string
  key: string
  label?: string
  model: string
  active: boolean
  age: string
  tokens: string
  kind?: string
  lastActivity?: number
  messageCount?: number
  flags?: string[]
}

type TimeWindow = '1h' | '6h' | '24h' | '7d' | 'all'

export function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'idle'>('all')
  const [sortBy, setSortBy] = useState<'age' | 'tokens' | 'model'>('age')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all')
  const [includeGlobal, setIncludeGlobal] = useState(true)
  const [includeUnknown, setIncludeUnknown] = useState(true)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [labelValue, setLabelValue] = useState('')
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()
      setSessions(data.sessions || data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
    refreshTimer.current = setInterval(loadSessions, 30000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [loadSessions])

  const getSessionTypeIcon = (sessionKey: string) => {
    if (sessionKey.includes(':main:main')) return '👑'
    if (sessionKey.includes(':subagent:')) return '🤖'
    if (sessionKey.includes(':cron:')) return '⏰'
    if (sessionKey.includes(':group:')) return '👥'
    if (sessionKey.includes(':global:')) return '🌐'
    return '💬'
  }

  const getSessionType = (sessionKey: string) => {
    if (sessionKey.includes(':main:main')) return 'Main'
    if (sessionKey.includes(':subagent:')) return 'Sub-agent'
    if (sessionKey.includes(':cron:')) return 'Cron'
    if (sessionKey.includes(':group:')) return 'Group'
    if (sessionKey.includes(':global:')) return 'Global'
    return 'Unknown'
  }

  const parseTokenUsage = (tokenString: string) => {
    const match = tokenString.match(/(\d+(?:\.\d+)?)(k|m)?\/(\d+(?:\.\d+)?)(k|m)?\s*\((\d+(?:\.\d+)?)%\)/)
    if (!match) return { used: 0, total: 0, percentage: 0 }

    const used = parseFloat(match[1]) * (match[2] === 'k' ? 1000 : match[2] === 'm' ? 1000000 : 1)
    const total = parseFloat(match[3]) * (match[4] === 'k' ? 1000 : match[4] === 'm' ? 1000000 : 1)
    const percentage = parseFloat(match[5])

    return { used, total, percentage }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      case 'idle': return 'text-muted-foreground'
      default: return 'text-muted-foreground'
    }
  }

  const getSessionStatus = (session: Session) => {
    if (!session.active) return 'idle'
    const tokenUsage = parseTokenUsage(session.tokens)
    if (tokenUsage.percentage > 95) return 'critical'
    if (tokenUsage.percentage > 80) return 'warning'
    return 'active'
  }

  const timeWindowMs: Record<TimeWindow, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  }

  const filteredSessions = sessions.filter(session => {
    if (sessionFilter === 'active' && !session.active) return false
    if (sessionFilter === 'idle' && session.active) return false

    if (timeWindow !== 'all' && session.lastActivity) {
      const cutoff = Date.now() - timeWindowMs[timeWindow]
      if (session.lastActivity < cutoff) return false
    }

    if (!includeGlobal && session.key?.includes(':global:')) return false
    if (!includeUnknown && getSessionType(session.key) === 'Unknown') return false

    return true
  })

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'tokens':
        return parseTokenUsage(b.tokens).percentage - parseTokenUsage(a.tokens).percentage
      case 'model':
        return a.model.localeCompare(b.model)
      case 'age':
      default:
        if (a.age === 'just now') return -1
        if (b.age === 'just now') return 1
        return a.age.localeCompare(b.age)
    }
  })

  const handleLabelSave = async (sessionKey: string) => {
    if (editingLabel !== sessionKey) return
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-label', sessionKey, label: labelValue }),
      })
      setEditingLabel(null)
      loadSessions()
    } catch (error) {
      console.error('Failed to save label:', error)
    }
  }

  const handleSessionAction = async (sessionKey: string, action: string) => {
    try {
      const res = await fetch(`/api/sessions?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || `Failed: ${action}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor active agent sessions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter</label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as any)}
              className="px-2 py-1 border border-border rounded bg-background text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-border rounded bg-background text-sm"
            >
              <option value="age">Age</option>
              <option value="tokens">Tokens</option>
              <option value="model">Model</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Time Window</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
              className="px-2 py-1 border border-border rounded bg-background text-sm"
            >
              <option value="1h">Last 1h</option>
              <option value="6h">Last 6h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeGlobal}
              onChange={(e) => setIncludeGlobal(e.target.checked)}
            />
            Global
          </label>

          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeUnknown}
              onChange={(e) => setIncludeUnknown(e.target.checked)}
            />
            Unknown
          </label>

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredSessions.length} sessions • {sessions.filter(s => s.active).length} active
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sortedSessions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <div className="text-muted-foreground">No sessions found</div>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const tokenUsage = parseTokenUsage(session.tokens)
              const status = getSessionStatus(session)
              const isExpanded = expandedSession === session.id

              return (
                <div
                  key={session.id}
                  className={`bg-card border border-border rounded-lg p-4 cursor-pointer transition-all ${
                    isExpanded ? 'ring-2 ring-primary/50 border-primary/30' : 'hover:border-primary/20'
                  }`}
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getSessionTypeIcon(session.key)}</span>
                        <div>
                          <h3 className="font-medium truncate">{session.key}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{getSessionType(session.key)}</span>
                            <span>•</span>
                            <span className={getStatusColor(status)}>{status}</span>
                            <span>•</span>
                            <span>{session.age}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.flags?.map((flag, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                            {flag}
                          </span>
                        ))}
                        <div className={`w-3 h-3 rounded-full ${session.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      </div>
                    </div>

                    {/* Model and Token Usage */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Model</div>
                        <div className="font-medium">{session.model}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Token Usage</div>
                        <div className="font-medium">{session.tokens}</div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              tokenUsage.percentage > 95 ? 'bg-red-500' :
                              tokenUsage.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(tokenUsage.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-border space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Kind:</span> <span className="ml-2">{session.kind}</span></div>
                          <div><span className="text-muted-foreground">ID:</span> <span className="ml-2 font-mono text-xs">{session.id}</span></div>
                          {session.lastActivity && (
                            <div><span className="text-muted-foreground">Last Activity:</span> <span className="ml-2">{new Date(session.lastActivity).toLocaleTimeString()}</span></div>
                          )}
                          {session.messageCount && (
                            <div><span className="text-muted-foreground">Messages:</span> <span className="ml-2">{session.messageCount}</span></div>
                          )}
                        </div>

                        {/* Label */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Label</div>
                          {editingLabel === session.key ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleLabelSave(session.key)
                                  if (e.key === 'Escape') setEditingLabel(null)
                                }}
                                onBlur={() => handleLabelSave(session.key)}
                                className="flex-1 px-2 py-1 border border-border rounded bg-background text-sm"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              className="text-sm text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingLabel(session.key)
                                setLabelValue(session.label || '')
                              }}
                            >
                              {session.label || 'Add label'}
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSessionAction(session.key, 'monitor')
                            }}
                          >
                            Monitor
                          </Button>
                          <Button
                            size="sm"
                            className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSessionAction(session.key, 'pause')
                            }}
                          >
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Terminate this session?')) {
                                handleSessionAction(session.key, 'terminate')
                              }
                            }}
                          >
                            Terminate
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{sessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium text-green-400">{sessions.filter(s => s.active).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Idle:</span>
                <span className="font-medium">{sessions.filter(s => !s.active).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-agents:</span>
                <span className="font-medium">{sessions.filter(s => s.key.includes(':subagent:')).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cron:</span>
                <span className="font-medium">{sessions.filter(s => s.key.includes(':cron:')).length}</span>
              </div>
            </div>
          </div>

          {/* High Token Alert */}
          {sessions.some(s => parseTokenUsage(s.tokens).percentage > 80) && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="font-medium text-yellow-400 mb-2">High Token Usage</h3>
              <div className="text-sm text-muted-foreground">
                {sessions.filter(s => parseTokenUsage(s.tokens).percentage > 80).length} session(s) using &gt;80% tokens
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionsPanel
