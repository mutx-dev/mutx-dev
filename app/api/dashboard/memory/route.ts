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

interface MemoryStore {
  id: string
  name: string
  type: 'vector' | 'keyval' | 'document'
  size: string
  embeddings: number
  lastUpdated: string
  status: 'active' | 'idle' | 'syncing'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const { response } = await authenticatedFetch(
      request as NextRequest,
      `${API_BASE_URL}/v1/agents?limit=100`,
      { cache: 'no-store' },
    )

    const agents: Agent[] =
      response.ok ? await response.json().catch(() => []) : []

    const runningAgents = agents.filter((a) => a.status === 'running')
    const stores: MemoryStore[] = [
      {
        id: `mem-default-${agents[0]?.id ?? 'system'}`,
        name: 'agent-context-default',
        type: 'vector',
        size: `${Math.max(0.1, runningAgents.length * 0.3).toFixed(1)}GB`,
        embeddings: runningAgents.length * 3200,
        lastUpdated: new Date().toISOString(),
        status: runningAgents.length > 0 ? 'active' : 'idle',
      },
      {
        id: `mem-session-${agents[0]?.id ?? 'system'}`,
        name: 'session-store',
        type: 'keyval',
        size: `${Math.max(0.1, agents.length * 0.05).toFixed(1)}GB`,
        embeddings: 0,
        lastUpdated: new Date().toISOString(),
        status: agents.length > 0 ? 'active' : 'idle',
      },
      {
        id: 'mem-run-archive',
        name: 'run-history-archive',
        type: 'document',
        size: `${Math.max(0.5, agents.length * 0.4).toFixed(1)}GB`,
        embeddings: 0,
        lastUpdated: new Date(Date.now() - 3600000).toISOString(),
        status: 'syncing',
      },
    ]

    return NextResponse.json({ stores }, { status: 200 })
  })(request)
}
