import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

type HistoryStatus = 'success' | 'failed' | 'cancelled'

interface HistoryEntry {
  id: string
  action: string
  agent: string
  status: HistoryStatus
  timestamp: string
  duration: number
  user: string
}

interface Agent {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

interface Deployment {
  id: string
  agent_id: string
  agent_name: string
  status: string
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

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

    const entries: HistoryEntry[] = []

    for (const agent of agents) {
      entries.push({
        id: `agent-${agent.id}-created`,
        action: `Agent registered: ${agent.name}`,
        agent: agent.name,
        status: agent.status === 'failed' || agent.status === 'error' ? 'failed' : 'success',
        timestamp: agent.created_at,
        duration: 0,
        user: 'system',
      })

      if (new Date(agent.updated_at).getTime() - new Date(agent.created_at).getTime() > 60000) {
        entries.push({
          id: `agent-${agent.id}-updated`,
          action: `Agent updated: ${agent.name}`,
          agent: agent.name,
          status: 'success',
          timestamp: agent.updated_at,
          duration: 0,
          user: 'system',
        })
      }
    }

    for (const dep of deployments) {
      const depStatus: HistoryStatus =
        dep.status === 'failed' || dep.status === 'error'
          ? 'failed'
          : dep.status === 'stopped' || dep.status === 'cancelled'
            ? 'cancelled'
            : 'success'

      entries.push({
        id: `deployment-${dep.id}-created`,
        action: `Deployment created: ${dep.agent_name}`,
        agent: dep.agent_name,
        status: depStatus,
        timestamp: dep.created_at,
        duration: 0,
        user: 'system',
      })

      if (new Date(dep.updated_at).getTime() - new Date(dep.created_at).getTime() > 60000) {
        entries.push({
          id: `deployment-${dep.id}-updated`,
          action: `Deployment status: ${dep.status}`,
          agent: dep.agent_name,
          status: depStatus,
          timestamp: dep.updated_at,
          duration: 0,
          user: 'system',
        })
      }
    }

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ entries }, { status: 200 })
  })(request)
}
