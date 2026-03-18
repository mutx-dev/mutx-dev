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

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const [agentsResult, deploymentsResult, runsResult] = await Promise.allSettled([
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/agents?limit=100`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/deployments?limit=100`, { cache: 'no-store' }),
      authenticatedFetch(request as NextRequest, `${API_BASE_URL}/v1/runs?limit=100`, { cache: 'no-store' }),
    ])

    const agents: Agent[] =
      agentsResult.status === 'fulfilled' && agentsResult.value.response.ok
        ? await agentsResult.value.response.json().catch(() => [])
        : []

    const deployments: Deployment[] =
      deploymentsResult.status === 'fulfilled' && deploymentsResult.value.response.ok
        ? await deploymentsResult.value.response.json().catch(() => [])
        : []

    const runs: Run[] =
      runsResult.status === 'fulfilled' && runsResult.value.response.ok
        ? await (async () => {
            const data = await runsResult.value.response.json().catch(() => ({}))
            return Array.isArray(data) ? data : (data.runs ?? [])
          })()
        : []

    const runningAgents = agents.filter((a) => a.status === 'running').length
    const totalAgents = agents.length
    const runningDeployments = deployments.filter((d) => d.status === 'running').length
    const failedDeployments = deployments.filter((d) => d.status === 'failed' || d.status === 'error').length
    const totalDeployments = deployments.length

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    const todayRuns = runs.filter((r) => new Date(r.created_at).getTime() >= todayMs)
    const runningRuns = runs.filter((r) => r.status === 'running').length

    const apiHealth = runningAgents + runningDeployments > 0 ? 'healthy' : 'unknown'
    const errorCount = failedDeployments

    const alerts = []

    if (failedDeployments > 0) {
      alerts.push({
        id: 'failed-deployments',
        severity: 'critical',
        message: `${failedDeployments} deployment${failedDeployments > 1 ? 's' : ''} in failed state`,
        timestamp: new Date().toISOString(),
        resolved: false,
      })
    }

    if (runningAgents < totalAgents && totalAgents > 0) {
      alerts.push({
        id: 'stopped-agents',
        severity: 'warning',
        message: `${totalAgents - runningAgents} agent${totalAgents - runningAgents > 1 ? 's' : ''} stopped`,
        timestamp: new Date().toISOString(),
        resolved: false,
      })
    }

    if (runningAgents === 0 && totalAgents > 0) {
      alerts.push({
        id: 'no-running-agents',
        severity: 'critical',
        message: 'No agents are currently running',
        timestamp: new Date().toISOString(),
        resolved: false,
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'all-healthy',
        severity: 'info',
        message: 'All systems operational',
        timestamp: new Date().toISOString(),
        resolved: true,
      })
    }

    return NextResponse.json(
      {
        metrics: {
          apiHealth,
          agents: { total: totalAgents, running: runningAgents },
          deployments: { total: totalDeployments, running: runningDeployments, failed: failedDeployments },
          runs: { total: runs.length, today: todayRuns.length, running: runningRuns },
          errorCount,
        },
        alerts,
      },
      { status: 200 },
    )
  })(request)
}
