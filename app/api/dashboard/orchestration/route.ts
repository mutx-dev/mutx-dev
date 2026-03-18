import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

type LaneType = 'builder' | 'ship' | 'qa' | 'control'

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

interface Lane {
  id: string
  name: string
  type: LaneType
  status: 'active' | 'paused' | 'idle'
  concurrency: number
  queueDepth: number
  nextHandoff?: string
  agents: string[]
}

function classifyAgentType(name: string): LaneType {
  const lower = name.toLowerCase()
  if (lower.includes('builder') || lower.includes('build')) return 'builder'
  if (lower.includes('ship') || lower.includes('deploy')) return 'ship'
  if (lower.includes('qa') || lower.includes('test') || lower.includes('verify')) return 'qa'
  return 'control'
}

function deriveLaneStatus(agentStatuses: string[]): Lane['status'] {
  if (agentStatuses.length === 0) return 'idle'
  const running = agentStatuses.filter((s) => s === 'running' || s === 'active').length
  if (running === agentStatuses.length) return 'active'
  if (running === 0) return 'paused'
  return 'active'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const [agentsResult, deploymentsResult] = await Promise.allSettled([
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/agents?limit=50`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/deployments?limit=50`, { cache: 'no-store' }),
    ])

    const agents: Agent[] =
      agentsResult.status === 'fulfilled' && agentsResult.value.response.ok
        ? await agentsResult.value.response.json().catch(() => [])
        : []

    const deployments: Deployment[] =
      deploymentsResult.status === 'fulfilled' && deploymentsResult.value.response.ok
        ? await deploymentsResult.value.response.json().catch(() => [])
        : []

    const lanesByType = new Map<LaneType, Agent[]>()

    for (const agent of agents) {
      const type = classifyAgentType(agent.name)
      if (!lanesByType.has(type)) lanesByType.set(type, [])
      lanesByType.get(type)!.push(agent)
    }

    const lanes: Lane[] = []
    const laneOrder: LaneType[] = ['control', 'builder', 'ship', 'qa']

    for (const type of laneOrder) {
      const typeAgents = lanesByType.get(type) ?? []
      const statuses = typeAgents.map((a) => a.status)
      const laneStatus = deriveLaneStatus(statuses)

      const lane: Lane = {
        id: `lane-${type}`,
        name: `${type}-lane`,
        type,
        status: laneStatus,
        concurrency: Math.max(1, typeAgents.length),
        queueDepth: typeAgents.filter((a) => a.status === 'running').length,
        agents: typeAgents.map((a) => a.name),
      }

      const nextType = laneOrder[laneOrder.indexOf(type) + 1]
      if (nextType) lane.nextHandoff = `${nextType}-lane`

      lanes.push(lane)
    }

    if (lanes.length === 0) {
      lanes.push(
        { id: 'lane-builder', name: 'builder-lane', type: 'builder', status: 'idle', concurrency: 1, queueDepth: 0, agents: [] },
        { id: 'lane-ship', name: 'ship-lane', type: 'ship', status: 'idle', concurrency: 1, queueDepth: 0, agents: [] },
      )
    }

    return NextResponse.json({ lanes }, { status: 200 })
  })(request)
}
