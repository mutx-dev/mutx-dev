import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, getCurrentUser } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized, forbidden } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

/**
 * Validate that the deployment belongs to the current authenticated user.
 */
async function validateDeploymentOwnership(
  request: NextRequest,
  deploymentId: string
): Promise<NextResponse | null> {
  const token = await getAuthToken(request)
  if (!token) {
    return unauthorized()
  }

  const user = await getCurrentUser(request)
  if (!user) {
    return unauthorized()
  }

  // Fetch the deployment to check ownership
  const response = await fetch(`${API_BASE_URL}/v1/deployments/${deploymentId}`, {
    headers: { 
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (response.status === 404) {
    return NextResponse.json({ detail: 'Deployment not found' }, { status: 404 })
  }

  if (response.status === 403) {
    return forbidden('Not authorized to access this deployment')
  }

  const deployment = await response.json().catch(() => null)
  if (deployment) {
    // Deployments are owned through their agent
    const agentResponse = await fetch(`${API_BASE_URL}/v1/agents/${deployment.agent_id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (agentResponse.status === 404) {
      return NextResponse.json({ detail: 'Agent not found' }, { status: 404 })
    }

    if (agentResponse.status === 403) {
      return forbidden('Not authorized to access this deployment')
    }

    const agent = await agentResponse.json().catch(() => null)
    if (agent && agent.user_id !== user.id) {
      return forbidden('Not authorized to access this deployment')
    }
  }

  return null // Ownership validated
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { id } = await params
    
    // Validate ownership before proxying
    const ownershipError = await validateDeploymentOwnership(request, id)
    if (ownershipError) {
      return ownershipError
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/deployments/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch deployment' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { id } = await params
    
    // Validate ownership before proxying
    const ownershipError = await validateDeploymentOwnership(request, id)
    if (ownershipError) {
      return ownershipError
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/deployments/${id}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }
    
    const payload = await response.json().catch(() => ({ detail: 'Failed to delete deployment' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
