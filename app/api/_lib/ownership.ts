import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl, getAuthToken } from './controlPlane'
import { forbidden, notFound } from './errors'


// Architectural improvements: timeout + observability
const FETCH_TIMEOUT_MS = 3000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    // Log timeout/fetch errors for observability
    console.error(`[ownership] fetch failed: ${url}`, error instanceof Error ? error.message : 'unknown')
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Verify that the authenticated user owns the deployment.
 * This is a frontend ownership check that provides defense-in-depth,
 * as the backend also enforces ownership.
 *
 * @returns true if ownership is verified or if verification couldn't be completed (falls through to backend)
 */
export async function verifyDeploymentOwnership(
  request: NextRequest,
  deploymentId: string
): Promise<boolean> {
  const token = await getAuthToken(request)
  if (!token) {
    // Let the backend handle authentication errors
    return true
  }

  try {
    // Parallelize: fetch deployment and user info concurrently
    const [deploymentResponse, userResponse] = await Promise.all([
      fetchWithTimeout(`${getApiBaseUrl()}/v1/deployments/${deploymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${getApiBaseUrl()}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    // Handle deployment lookup
    if (deploymentResponse.status === 404) {
      return true // Let backend return 404
    }

    if (!deploymentResponse.ok) {
      console.warn(`[ownership] deployment fetch failed: ${deploymentResponse.status}`)
      return true // Let backend handle
    }

    const deployment = await deploymentResponse.json().catch(() => null)
    if (!deployment || !deployment.agent_id) {
      return true
    }

    // Handle user lookup
    if (!userResponse.ok) {
      console.warn(`[ownership] user fetch failed: ${userResponse.status}`)
      return true
    }

    const user = await userResponse.json().catch(() => null)
    if (!user || !user.id) {
      return true
    }

    // Now fetch the agent (depends on agent_id from deployment)
    const agentResponse = await fetchWithTimeout(`${getApiBaseUrl()}/v1/agents/${deployment.agent_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (agentResponse.status === 404) {
      return true
    }

    if (!agentResponse.ok) {
      console.warn(`[ownership] agent fetch failed: ${agentResponse.status}`)
      return true
    }

    const agent = await agentResponse.json().catch(() => null)
    if (!agent || !agent.user_id) {
      return true
    }

    // Check ownership
    const isOwned = agent.user_id === user.id

    if (!isOwned) {
      console.warn(`[ownership] ownership denied: deployment=${deploymentId}, user=${user.id}, agent_owner=${agent.user_id}`)
    }

    return isOwned
  } catch (error) {
    // Log error for observability instead of silently swallowing
    console.error(`[ownership] verifyDeploymentOwnership failed:`, error instanceof Error ? error.message : 'unknown')
    // On any error, fall through to backend
    return true
  }
}

/**
 * Helper to check ownership and return error response if not owned
 */
export async function checkDeploymentOwnership(
  request: NextRequest,
  deploymentId: string
): Promise<NextResponse | null> {
  const isOwned = await verifyDeploymentOwnership(request, deploymentId)
  if (!isOwned) {
    return forbidden('You do not own this deployment')
  }
  return null
}

/**
 * Verify that the authenticated user owns the agent.
 * This provides defense-in-depth, as the backend also enforces ownership.
 */
export async function verifyAgentOwnership(
  request: NextRequest,
  agentId: string
): Promise<boolean> {
  const token = await getAuthToken(request)
  if (!token) {
    return true
  }

  try {
    // Parallelize: fetch agent and user concurrently
    const [agentResponse, userResponse] = await Promise.all([
      fetchWithTimeout(`${getApiBaseUrl()}/v1/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetchWithTimeout(`${getApiBaseUrl()}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    if (agentResponse.status === 404) {
      return true
    }

    if (!agentResponse.ok) {
      console.warn(`[ownership] agent fetch failed: ${agentResponse.status}`)
      return true
    }

    const agent = await agentResponse.json().catch(() => null)
    if (!agent || !agent.user_id) {
      return true
    }

    if (!userResponse.ok) {
      console.warn(`[ownership] user fetch failed: ${userResponse.status}`)
      return true
    }

    const user = await userResponse.json().catch(() => null)
    if (!user || !user.id) {
      return true
    }

    const isOwned = agent.user_id === user.id

    if (!isOwned) {
      console.warn(`[ownership] ownership denied: agent=${agentId}, user=${user.id}, agent_owner=${agent.user_id}`)
    }

    return isOwned
  } catch (error) {
    console.error(`[ownership] verifyAgentOwnership failed:`, error instanceof Error ? error.message : 'unknown')
    return true
  }
}

/**
 * Helper to check ownership and return error response if not owned
 */
export async function checkAgentOwnership(
  request: NextRequest,
  agentId: string
): Promise<NextResponse | null> {
  const isOwned = await verifyAgentOwnership(request, agentId)
  if (!isOwned) {
    return forbidden('You do not own this agent')
  }
  return null
}
