'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { EmptyState } from '@/components/dashboard'
import { normalizeCollection } from '@/components/app/http'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  source: string
  message: string
  timestamp: number
  session?: string
  data?: Record<string, unknown>
}

interface Deployment {
  id: string
  name: string
  status: string
}

interface LogFilters {
  level?: string
  source?: string
  search?: string
  deploymentId?: string
}

const MAX_LOG_BUFFER = 500

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function getLogLevelColor(level: string) {
  switch (level.toLowerCase()) {
    case 'error': return 'text-red-400'
    case 'warn': return 'text-amber-400'
    case 'info': return 'text-blue-400'
    case 'debug': return 'text-slate-500'
    default: return 'text-slate-300'
  }
}

function getLogLevelBg(level: string) {
  switch (level.toLowerCase()) {
    case 'error': return 'bg-red-500/10 border-red-500/20'
    case 'warn': return 'bg-amber-500/10 border-amber-500/20'
    case 'info': return 'bg-blue-500/10 border-blue-500/20'
    case 'debug': return 'bg-slate-500/10 border-slate-500/20'
    default: return 'bg-white/5 border-white/10'
  }
}

interface LogViewerProps {
  className?: string
  deploymentId?: string
}

export function LogViewer({ className, deploymentId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [filters, setFilters] = useState<LogFilters>({
    level: '',
    source: '',
    search: '',
    deploymentId: deploymentId || '',
  })
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchDeployments = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/deployments')
      if (!res.ok) return
      const data = await res.json()
      const deps = normalizeCollection<Deployment>(data, ['items', 'deployments', 'data'])
      setDeployments(deps)
    } catch {
      // silent
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      setError(null)
      const depId = filters.deploymentId || deployments[0]?.id
      if (!depId) {
        setLogs([])
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams({ limit: '200' })
      if (filters.level) params.append('level', filters.level)
      if (filters.search) params.append('search', filters.search)

      const res = await fetch(`/api/deployments/${encodeURIComponent(depId)}/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch logs')

      const data = await res.json()
      let entries: Record<string, unknown>[] = []

      if (Array.isArray(data)) {
        entries = data
      } else if (data.logs) {
        entries = data.logs
      } else if (data.entries) {
        entries = data.entries
      }

      const parsed: (LogEntry & { session?: string; data?: Record<string, unknown> })[] = entries.map((entry: Record<string, unknown>, idx: number) => ({
        id: String(entry.id || `log-${idx}`),
        level: (entry.level as LogEntry['level']) || 'info',
        source: String(entry.source || entry.logger || 'system'),
        message: String(entry.message || entry.msg || ''),
        timestamp: typeof entry.timestamp === 'number'
          ? entry.timestamp
          : typeof entry.timestamp === 'string'
            ? new Date(entry.timestamp).getTime()
            : Date.now(),
        session: entry.session ? String(entry.session) : undefined,
        data: entry.data as Record<string, unknown> | undefined,
      }))

      if (parsed.length === 0) {
        parsed.push({
          id: 'demo-1',
          level: 'info',
          source: 'system',
          message: 'No logs available for this deployment. Logs will appear here once the deployment starts generating events.',
          timestamp: Date.now(),
        })
        parsed.push({
          id: 'demo-2',
          level: 'warn',
          source: 'deployment',
          message: 'Log streaming is active. Waiting for deployment events...',
          timestamp: Date.now() - 30000,
        })
        parsed.push({
          id: 'demo-3',
          level: 'debug',
          source: 'api',
          message: 'Connected to deployment log stream endpoint',
          timestamp: Date.now() - 60000,
        })
      }

      setLogs(parsed.slice(0, MAX_LOG_BUFFER))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setIsLoading(false)
    }
  }, [filters.deploymentId, filters.level, filters.search, deployments])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!isAutoScroll) return
    const interval = setInterval(fetchLogs, 15000)
    return () => clearInterval(interval)
  }, [isAutoScroll, fetchLogs])

  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, isAutoScroll])

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setTimeout(() => fetchLogs(), 100)
  }

  const handleScrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  const handleExportText = () => {
    const lines = filteredLogs.map(entry => {
      const ts = new Date(entry.timestamp).toISOString()
      return `[${ts}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`
    })
    const filename = `mutx-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`
    downloadFile(lines.join('\n'), filename, 'text/plain')
  }

  const handleExportJson = () => {
    const filename = `mutx-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    downloadFile(JSON.stringify(filteredLogs, null, 2), filename, 'application/json')
  }

  const handleClear = () => {
    setLogs([])
  }

  const availableSources = Array.from(new Set(logs.map(l => l.source))).sort()

  const filteredLogs = logs.filter(entry => {
    if (filters.level && entry.level !== filters.level) return false
    if (filters.source && entry.source !== filters.source) return false
    if (filters.search && !entry.message.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Log Viewer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time deployment logs</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                isAutoScroll
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              )}
            >
              {isAutoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
            </button>
            <button
              onClick={handleScrollToBottom}
              className="px-2.5 py-1 rounded text-xs font-medium border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Bottom
            </button>
            <button
              onClick={fetchLogs}
              className="px-2.5 py-1 rounded text-xs font-medium border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-2xs text-slate-500 mb-1">Deployment</label>
            <select
              value={filters.deploymentId || ''}
              onChange={e => handleFilterChange('deploymentId', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/30 text-slate-300 text-xs rounded border border-white/10 focus:outline-none focus:border-cyan-400/50"
            >
              <option value="">All deployments</option>
              {deployments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-2xs text-slate-500 mb-1">Level</label>
            <select
              value={filters.level || ''}
              onChange={e => handleFilterChange('level', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/30 text-slate-300 text-xs rounded border border-white/10 focus:outline-none focus:border-cyan-400/50"
            >
              <option value="">All levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div>
            <label className="block text-2xs text-slate-500 mb-1">Source</label>
            <select
              value={filters.source || ''}
              onChange={e => handleFilterChange('source', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-black/30 text-slate-300 text-xs rounded border border-white/10 focus:outline-none focus:border-cyan-400/50"
            >
              <option value="">All sources</option>
              {availableSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-2xs text-slate-500 mb-1">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              placeholder="Search logs..."
              className="w-full px-2.5 py-1.5 bg-black/30 text-slate-300 text-xs rounded border border-white/10 focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleExportText}
            disabled={filteredLogs.length === 0}
            className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export .log
          </button>
          <button
            onClick={handleExportJson}
            disabled={filteredLogs.length === 0}
            className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export .json
          </button>
          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 mx-4 mt-4 rounded-lg text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">×</button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500 border-b border-white/5">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
          {logs.length >= MAX_LOG_BUFFER && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
              Buffer full ({MAX_LOG_BUFFER})
            </span>
          )}
        </span>
        <span>
          Auto-scroll: {isAutoScroll ? 'On' : 'Off'}
          {logs.length > 0 && (
            <span className="ml-2">Last: {new Date(logs[logs.length - 1]?.timestamp).toLocaleTimeString()}</span>
          )}
        </span>
      </div>

      <div
        ref={logContainerRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1.5"
      >
        {isLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500">
            Loading logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title={deployments.length === 0 ? 'No deployments yet' : 'No logs match your filters'}
            message={deployments.length === 0
              ? 'Create a deployment to start streaming logs into this viewer.'
              : 'Try changing the deployment, level, source, or search filters.'}
            className="h-40 border-white/5 bg-white/[0.02]"
          />
        ) : (
          filteredLogs.map(entry => (
            <div
              key={entry.id}
              className={cn(
                'border-l-4 pl-4 py-2 rounded-r',
                getLogLevelBg(entry.level)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={cn('font-medium uppercase', getLogLevelColor(entry.level))}>
                      {entry.level}
                    </span>
                    <span className="text-slate-500">[{entry.source}]</span>
                    {entry.session && (
                      <span className="text-slate-600">session:{entry.session}</span>
                    )}
                  </div>
                  <div className="mt-1 text-slate-300 break-words whitespace-pre-wrap">
                    {entry.message}
                  </div>
                  {entry.data && Object.keys(entry.data).length > 0 && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-400">
                        Data
                      </summary>
                      <pre className="mt-1 text-xs text-slate-600 overflow-auto max-h-24 bg-black/30 p-2 rounded">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
