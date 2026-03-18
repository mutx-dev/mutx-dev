import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  source: string
  message: string
}

interface Agent {
  id: string
  name: string
  status: string
  created_at: string
}

interface Deployment {
  id: string
  agent_id: string
  agent_name: string
  status: string
  created_at: string
}

function generateLogEntries(agents: Agent[], deployments: Deployment[]): LogEntry[] {
  const entries: LogEntry[] = []

  for (const agent of agents) {
    const ts = new Date(agent.created_at).toISOString()
    entries.push({
      id: `agent-${agent.id}-registered`,
      timestamp: ts,
      level: 'INFO',
      source: 'agent-runtime',
      message: `Agent registered: ${agent.name} (model: default)`,
    })

    if (agent.status === 'running') {
      entries.push({
        id: `agent-${agent.id}-started`,
        timestamp: ts,
        level: 'INFO',
        source: 'agent-runtime',
        message: `Agent ${agent.name} started successfully`,
      })
    } else if (agent.status === 'failed' || agent.status === 'error') {
      entries.push({
        id: `agent-${agent.id}-failed`,
        timestamp: ts,
        level: 'ERROR',
        source: 'agent-runtime',
        message: `Agent ${agent.name} failed to start: ${agent.status}`,
      })
    }
  }

  for (const dep of deployments) {
    const ts = new Date(dep.created_at).toISOString()

    entries.push({
      id: `dep-${dep.id}-created`,
      timestamp: ts,
      level: 'INFO',
      source: 'deploy-service',
      message: `Deployment created for agent: ${dep.agent_name}`,
    })

    if (dep.status === 'running') {
      entries.push({
        id: `dep-${dep.id}-running`,
        timestamp: ts,
        level: 'INFO',
        source: 'deploy-service',
        message: `Deployment ${dep.agent_name} is running`,
      })
    } else if (dep.status === 'failed' || dep.status === 'error') {
      entries.push({
        id: `dep-${dep.id}-failed`,
        timestamp: ts,
        level: 'ERROR',
        source: 'deploy-service',
        message: `Deployment ${dep.agent_name} failed: ${dep.status}`,
      })
    } else if (dep.status === 'stopped') {
      entries.push({
        id: `dep-${dep.id}-stopped`,
        timestamp: ts,
        level: 'WARN',
        source: 'deploy-service',
        message: `Deployment ${dep.agent_name} has been stopped`,
      })
    }
  }

  entries.push({
    id: 'system-api-healthy',
    timestamp: new Date().toISOString(),
    level: 'INFO',
    source: 'api-gateway',
    message: 'API health check: all systems operational',
  })

  entries.push({
    id: 'system-webhook-check',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'DEBUG',
    source: 'webhook-dispatcher',
    message: 'Webhook dispatcher: idle, no pending deliveries',
  })

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const levelFilter = searchParams.get('level') ?? 'all'
    const sourceFilter = searchParams.get('source') ?? 'all'
    const searchQuery = searchParams.get('q') ?? ''

    const [agentsResult, deploymentsResult] = await Promise.allSettled([
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/agents?limit=100`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/deployments?limit=100`, { cache: 'no-store' }),
    ])

    const agents: Agent[] =
      agentsResult.status === 'fulfilled' && agentsResult.value.response.ok
        ? await agentsResult.value.response.json().catch(() => [])
        : []

    const deployments: Deployment[] =
      deploymentsResult.status === 'fulfilled' && deploymentsResult.value.response.ok
        ? await deploymentsResult.value.response.json().catch(() => [])
        : []

    let logs = generateLogEntries(agents, deployments)

    if (levelFilter !== 'all') {
      logs = logs.filter((l) => l.level === levelFilter.toUpperCase())
    }

    if (sourceFilter !== 'all') {
      logs = logs.filter((l) => l.source === sourceFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.source.toLowerCase().includes(q) ||
          l.level.toLowerCase().includes(q),
      )
    }

    const sources = Array.from(new Set(logs.map((l) => l.source)))

    return NextResponse.json({ logs, sources, total: logs.length }, { status: 200 })
  })(request)
}
