import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, getCurrentUser } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized, forbidden } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

// Query parameters that should never be passed from client input
// Ownership is derived from the authenticated user, not client-supplied values
const BLOCKED_QUERY_PARAMS = ['user_id', 'owner_id', 'owner']

/**
 * Filter out client-supplied ownership parameters.
 * Ownership is derived from the authenticated user.
 */
function filterQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const filtered = new URLSearchParams()
  
  for (const [key, value] of searchParams.entries()) {
    if (!BLOCKED_QUERY_PARAMS.includes(key.toLowerCase())) {
      filtered.append(key, value)
    }
  }
  
  return filtered
}

/**
 * CLI-compatible agents endpoint.
 * Proxies to control plane with ownership derived from authenticated user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const params = filterQueryParams(searchParams)
    
    const response = await fetch(`${API_BASE_URL}/v1/agents?${params}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    // If backend returns 403, convert to more specific error
    if (response.status === 403) {
      return forbidden('Not authorized to access agents')
    }

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agents' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const body = await req.json()
    
    // Validate ownership if agent_id is provided (e.g., for deploy operations)
    if (body.agent_id) {
      const user = await getCurrentUser(request)
      if (!user) {
        return unauthorized()
      }

      // Check if the agent belongs to the current user
      const agentResponse = await fetch(`${API_BASE_URL}/v1/agents/${body.agent_id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      if (agentResponse.status === 404) {
        return NextResponse.json({ detail: 'Agent not found' }, { status: 404 })
      }

      if (agentResponse.status === 403) {
        return forbidden('Not authorized to access this agent')
      }

      const agent = await agentResponse.json().catch(() => null)
      if (agent && agent.user_id !== user.id) {
        return forbidden('Not authorized to access this agent')
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/agents`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to create agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
