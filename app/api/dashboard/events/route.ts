import { NextRequest, NextResponse } from 'next/server'

import { getAuthToken } from '@/app/api/_lib/controlPlane'

type Deployment = {
  id: string
  agent_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  started_at?: string
  ended_at?: string
  events?: Array<{
    id?: string | number
    event_type?: string
    status?: string
    created_at?: string
    node_id?: string | null
    error_message?: string | null
  }>
}

type Agent = {
  id: string
  name?: string | null
  status?: string
  created_at?: string
  updated_at?: string
}

function toUnixSeconds(value?: string | null) {
  if (!value) return Math.floor(Date.now() / 1000)
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? Math.floor(Date.now() / 1000) : Math.floor(ms / 1000)
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const actor = searchParams.get('actor')
    const type = searchParams.get('type')
    const since = Number(searchParams.get('since') || '0')
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')))
    const offset = Math.max(0, Number(searchParams.get('offset') || '0'))

    const [agentsResponse, deploymentsResponse] = await Promise.all([
      fetch(new URL('/api/dashboard/agents', request.url), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(new URL('/api/dashboard/deployments', request.url), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    const agents = ((await agentsResponse.json().catch(() => [])) as Agent[]) || []
    const deployments = ((await deploymentsResponse.json().catch(() => [])) as Deployment[]) || []

    const agentNameById = new Map<string, string>()
    for (const agent of agents) {
      agentNameById.set(String(agent.id), agent.name || String(agent.id))
    }

    const activities = [
      ...agents.flatMap((agent) => {
        const name = agent.name || String(agent.id)
        return [
          {
            id: `agent-${agent.id}-created`,
            type: 'agent_created',
            actor: name,
            description: `registered agent ${name}`,
            created_at: toUnixSeconds(agent.created_at || agent.updated_at),
            entity_type: 'agent',
            entity_id: 0,
            entity: {
              type: 'agent',
              name,
              status: agent.status,
              id: 0,
            },
            data: { agent_id: agent.id, status: agent.status },
          },
        ]
      }),
      ...deployments.flatMap((deployment) => {
        const agentName = agentNameById.get(String(deployment.agent_id)) || String(deployment.agent_id || 'unknown')
        const deploymentName = `deployment ${String(deployment.id).slice(0, 8)}`
        const base = {
          id: `deployment-${deployment.id}-created`,
          type: 'deployment_created',
          actor: agentName,
          description: `created ${deploymentName}`,
          created_at: toUnixSeconds(deployment.started_at || deployment.created_at || deployment.updated_at),
          entity_type: 'deployment',
          entity_id: 0,
          entity: {
            type: 'deployment',
            name: deploymentName,
            status: deployment.status,
            id: 0,
          },
          data: {
            deployment_id: deployment.id,
            agent_id: deployment.agent_id,
            status: deployment.status,
          },
        }

        const eventActivities = (deployment.events || []).map((event, index) => ({
          id: `deployment-${deployment.id}-event-${event.id ?? index}`,
          type: `deployment_${event.event_type || 'updated'}`,
          actor: agentName,
          description: `${event.event_type || 'updated'} ${deploymentName}${event.status ? ` (${event.status})` : ''}`,
          created_at: toUnixSeconds(event.created_at),
          entity_type: 'deployment',
          entity_id: 0,
          entity: {
            type: 'deployment',
            name: deploymentName,
            status: event.status || deployment.status,
            id: 0,
          },
          data: {
            deployment_id: deployment.id,
            event_type: event.event_type,
            status: event.status,
            node_id: event.node_id,
            error_message: event.error_message,
          },
        }))

        return [base, ...eventActivities]
      }),
    ]
      .filter((activity) => !type || activity.type === type)
      .filter((activity) => !actor || activity.actor === actor || activity.data.agent_id === actor)
      .filter((activity) => !since || activity.created_at >= since)
      .sort((a, b) => b.created_at - a.created_at)

    const paged = activities.slice(offset, offset + limit)
    return NextResponse.json({ activities: paged, total: activities.length })
  } catch (error) {
    console.error('Dashboard events proxy error:', error)
    return NextResponse.json({ detail: 'Failed to build events feed' }, { status: 500 })
  }
}
