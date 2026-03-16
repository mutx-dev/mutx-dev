import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl, getAuthToken } from './controlPlane'
import { forbidden, notFound } from './errors'

const API_BASE_URL = getApiBaseUrl()

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
    // First, fetch the deployment to get its agent_id
    const deploymentResponse = await fetch(`${API_BASE_URL}/v1/deployments/${deploymentId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (deploymentResponse.status === 404) {
      // Let the backend return 404
      return true
    }

    if (!deploymentResponse.ok) {
      // If we can't verify ownership, let the backend handle it
      return true
    }

    const deployment = await deploymentResponse.json().catch(() => null)
    if (!deployment || !deployment.agent_id) {
      // Can't determine ownership, let backend handle it
      return true
    }

    // Now verify the agent belongs to the user
    const agentResponse = await fetch(`${API_BASE_URL}/v1/agents/${deployment.agent_id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (agentResponse.status === 404) {
      // Let the backend return 404
      return true
    }

    if (!agentResponse.ok) {
      // If we can't verify ownership, let the backend handle it
      return true
    }

    const agent = await agentResponse.json().catch(() => null)
    if (!agent || !agent.user_id) {
      // Can't determine ownership, let backend handle it
      return true
    }

    // Get the current user's ID to compare
    const userResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!userResponse.ok) {
      // Can't get user info, let backend handle it
      return true
    }

    const user = await userResponse.json().catch(() => null)
    if (!user || !user.id) {
      // Can't determine user, let backend handle it
      return true
    }

    // Check if the agent belongs to the authenticated user
    if (agent.user_id !== user.id) {
      return false
    }

    return true
  } catch {
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
