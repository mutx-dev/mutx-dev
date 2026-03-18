import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

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

interface Run {
  id: string
  status: string
  created_at: string
  completed_at?: string
}

interface EventBreakdown {
  name: string
  count: number
  percentage: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const [agentsResult, deploymentsResult, runsResult] = await Promise.allSettled([
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/agents?limit=200`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/deployments?limit=200`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/runs?limit=200`, { cache: 'no-store' }),
    ])

    const agents: Agent[] =
      agentsResult.status === 'fulfilled' && agentsResult.value.response.ok
        ? await agentsResult.value.response.json().catch(() => [])
        : []

    const deployments: Deployment[] =
      deploymentsResult.status === 'fulfilled' && deploymentsResult.value.response.ok
        ? await deploymentsResult.value.response.json().catch(() => [])
        : []

    const runsRaw =
      runsResult.status === 'fulfilled' && runsResult.value.response.ok
        ? await (async () => {
            const data = await runsResult.value.response.json().catch(() => ({}))
            return Array.isArray(data) ? data : (data.runs ?? [])
          })()
        : []

    const runs: Run[] = runsRaw

    const now = new Date()
    const days = [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
      const d = new Date(now)
      d.setDate(d.getDate() - daysAgo)
      d.setHours(0, 0, 0, 0)
      return d
    })

    const dailyData = days.map((dayStart) => {
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayRuns = runs.filter((r) => {
        const ts = new Date(r.created_at).getTime()
        return ts >= dayStart.getTime() && ts < dayEnd.getTime()
      })

      const dayAgents = agents.filter((a) => {
        const ts = new Date(a.created_at).getTime()
        return ts >= dayStart.getTime() && ts < dayEnd.getTime()
      })

      return {
        day: dayStart.toLocaleDateString(undefined, { weekday: 'short' }),
        runs: dayRuns.length,
        agents: dayAgents.length,
      }
    })

    const totalEvents =
      agents.length + deployments.length + runs.length

    const eventBreakdown: EventBreakdown[] = [
      { name: 'agent.created', count: agents.length, percentage: 0 },
      { name: 'deployment.created', count: deployments.length, percentage: 0 },
      { name: 'run.completed', count: runs.filter((r) => r.status === 'completed').length, percentage: 0 },
      { name: 'run.started', count: runs.length, percentage: 0 },
      { name: 'deployment.failed', count: deployments.filter((d) => d.status === 'failed' || d.status === 'error').length, percentage: 0 },
      { name: 'agent.status_change', count: agents.filter((a) => a.status !== 'running').length, percentage: 0 },
    ]
      .filter((e) => e.count > 0)
      .map((e) => ({
        ...e,
        percentage: totalEvents > 0 ? Math.round((e.count / totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const totalAgents = agents.length
    const totalDeployments = deployments.length
    const totalRuns = runs.length
    const runningAgents = agents.filter((a) => a.status === 'running').length
    const activeDeployments = deployments.filter((d) => d.status === 'running').length

    return NextResponse.json(
      {
        analytics: {
          totalAgents,
          runningAgents,
          totalDeployments,
          activeDeployments,
          totalRuns,
        },
        eventBreakdown,
        dailyData,
      },
      { status: 200 },
    )
  })(request)
}
