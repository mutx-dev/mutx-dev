import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

type TraceLevel = 'info' | 'warn' | 'error' | 'debug'

interface TraceEntry {
  id: string
  trace_id: string
  agent: string
  level: TraceLevel
  message: string
  timestamp: string
  duration?: number
  metadata?: Record<string, string>
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

function generateTraces(agents: Agent[], deployments: Deployment[]): TraceEntry[] {
  const traces: TraceEntry[] = []

  for (const agent of agents) {
    const ts = new Date(agent.created_at).toISOString()
    traces.push({
      id: `trace-${agent.id}-init`,
      trace_id: `trace_${agent.id.slice(0, 8)}`,
      agent: agent.name,
      level: 'info',
      message: `Agent initialized: ${agent.name}`,
      timestamp: ts,
      metadata: { status: agent.status, id: agent.id },
    })

    if (agent.status === 'running') {
      traces.push({
        id: `trace-${agent.id}-running`,
        trace_id: `trace_${agent.id.slice(0, 8)}`,
        agent: agent.name,
        level: 'info',
        message: `Agent ${agent.name} is running`,
        timestamp: ts,
      })
    } else if (agent.status === 'failed' || agent.status === 'error') {
      traces.push({
        id: `trace-${agent.id}-error`,
        trace_id: `trace_${agent.id.slice(0, 8)}`,
        agent: agent.name,
        level: 'error',
        message: `Agent ${agent.name} encountered an error: ${agent.status}`,
        timestamp: ts,
      })
    } else {
      traces.push({
        id: `trace-${agent.id}-idle`,
        trace_id: `trace_${agent.id.slice(0, 8)}`,
        agent: agent.name,
        level: 'debug',
        message: `Agent ${agent.name} is idle (status: ${agent.status})`,
        timestamp: ts,
      })
    }
  }

  for (const dep of deployments) {
    const ts = new Date(dep.created_at).toISOString()
    traces.push({
      id: `trace-dep-${dep.id}-deploy`,
      trace_id: `trace_dep_${dep.id.slice(0, 8)}`,
      agent: dep.agent_name,
      level: 'info',
      message: `Deployment created for ${dep.agent_name}`,
      timestamp: ts,
      metadata: { deployment_id: dep.id, status: dep.status },
    })

    if (dep.status === 'failed') {
      traces.push({
        id: `trace-dep-${dep.id}-failed`,
        trace_id: `trace_dep_${dep.id.slice(0, 8)}`,
        agent: dep.agent_name,
        level: 'error',
        message: `Deployment ${dep.agent_name} failed`,
        timestamp: ts,
      })
    } else if (dep.status === 'running') {
      traces.push({
        id: `trace-dep-${dep.id}-running`,
        trace_id: `trace_dep_${dep.id.slice(0, 8)}`,
        agent: dep.agent_name,
        level: 'info',
        message: `Deployment ${dep.agent_name} is healthy and running`,
        timestamp: ts,
      })
    }
  }

  return traces.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const levelFilter = searchParams.get('level') ?? 'all'
    const agentFilter = searchParams.get('agent') ?? 'all'
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

    let traces = generateTraces(agents, deployments)

    if (agentFilter !== 'all') {
      traces = traces.filter((t) => t.agent === agentFilter)
    }

    if (levelFilter !== 'all') {
      traces = traces.filter((t) => t.level === levelFilter.toLowerCase())
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      traces = traces.filter(
        (t) =>
          t.message.toLowerCase().includes(q) ||
          t.agent.toLowerCase().includes(q) ||
          t.trace_id.toLowerCase().includes(q),
      )
    }

    const agents_list = Array.from(new Set(traces.map((t) => t.agent)))

    return NextResponse.json({ traces, agents: agents_list, total: traces.length }, { status: 200 })
  })(request)
}
