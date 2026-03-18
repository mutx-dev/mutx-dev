'use client'

import { useEffect, useState } from 'react'

interface Agent {
  id: string
  name: string
  status: string
  created_at: string
}

interface Deployment {
  id: string
  name: string
  status: string
  replicas: number
  ready_replicas: number
}

interface HealthStatus {
  status: string
  agents_count: number
  deployments_count: number
  uptime_seconds: number
}

function AgentIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

function DeploymentIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="4" width="12" height="9" rx="1.5" />
      <path d="M2 7h12" />
      <path d="M6 4V2M10 4V2" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 9h2l1.4-3.5L8.2 12l2-5H14" />
    </svg>
  )
}

function HealthIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2v12M8 2l-3 3M8 2l3 3" />
    </svg>
  )
}

function MetricCard({ label, value, total, subtitle, icon, color }: {
  label: string
  value: number | string
  total?: number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className={`rounded-lg border p-3.5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <div className="w-5 h-5 opacity-60">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono-tight">{value}</span>
        {total != null && <span className="text-xs opacity-50 font-mono-tight">/ {total}</span>}
      </div>
      {subtitle && <div className="text-2xs opacity-50 font-mono-tight mt-0.5">{subtitle}</div>}
    </div>
  )
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function MetricCards() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, deploymentsRes, healthRes] = await Promise.all([
          fetch('/api/dashboard/agents'),
          fetch('/api/dashboard/deployments'),
          fetch('/api/dashboard/health'),
        ])

        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(Array.isArray(data) ? data : data.agents ?? [])
        }
        if (deploymentsRes.ok) {
          const data = await deploymentsRes.json()
          setDeployments(Array.isArray(data) ? data : data.deployments ?? [])
        }
        if (healthRes.ok) {
          const data = await healthRes.json()
          setHealth(data)
        }
      } catch (e) {
        console.error('Failed to fetch metric data', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const onlineAgents = agents.filter(a => a.status === 'running' || a.status === 'active').length
  const totalAgents = agents.length
  const runningDeployments = deployments.filter(d => d.status === 'running' || d.status === 'ready').length
  const totalDeployments = deployments.length
  const healthy = health?.status === 'ok' || health?.status === 'healthy'
  const uptime = health?.uptime_seconds ?? 0

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <MetricCard
        label="Agents"
        value={loading ? '...' : onlineAgents}
        total={loading ? undefined : totalAgents}
        subtitle="online / total"
        icon={<AgentIcon />}
        color="blue"
      />
      <MetricCard
        label="Deployments"
        value={loading ? '...' : runningDeployments}
        total={loading ? undefined : totalDeployments}
        subtitle="running / total"
        icon={<DeploymentIcon />}
        color="green"
      />
      <MetricCard
        label="Health"
        value={loading ? '...' : (healthy ? 'OK' : 'Degraded')}
        subtitle={loading ? undefined : `uptime ${formatUptime(uptime)}`}
        icon={<ActivityIcon />}
        color={loading ? 'blue' : healthy ? 'green' : 'red'}
      />
      <MetricCard
        label="System"
        value={loading ? '...' : (health ? 'Online' : 'Offline')}
        subtitle={loading ? undefined : `${health?.agents_count ?? 0} agents tracked`}
        icon={<HealthIcon />}
        color={loading ? 'blue' : health ? 'purple' : 'red'}
      />
    </section>
  )
}
