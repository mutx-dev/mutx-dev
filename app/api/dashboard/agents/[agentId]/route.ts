import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { proxyJson } from '@/app/api/_lib/proxy'
import { withErrorHandling, badRequest } from '@/app/api/_lib/errors'
import { checkAgentOwnership } from '@/app/api/_lib/ownership'
import { z } from 'zod'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const { agentId } = await params

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const ownershipError = await checkAgentOwnership(request, agentId)
    if (ownershipError) {
      return ownershipError
    }

    return proxyJson(request, `${API_BASE_URL}/v1/agents/${agentId}`, {
      method: 'GET',
      fallbackMessage: 'Failed to fetch agent',
    })
  })(request)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const { agentId } = await params

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const ownershipError = await checkAgentOwnership(request, agentId)
    if (ownershipError) {
      return ownershipError
    }

    return proxyJson(request, `${API_BASE_URL}/v1/agents/${agentId}`, {
      method: 'DELETE',
      fallbackMessage: 'Failed to delete agent',
    })
  })(request)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const { agentId } = await params

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const ownershipError = await checkAgentOwnership(request, agentId)
    if (ownershipError) {
      return ownershipError
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stop') {
      return proxyJson(request, `${API_BASE_URL}/v1/agents/${agentId}/stop`, {
        method: 'POST',
        fallbackMessage: 'Failed to stop agent',
      })
    }

    if (action === 'deploy') {
      return proxyJson(request, `${API_BASE_URL}/v1/agents/${agentId}/deploy`, {
        method: 'POST',
        fallbackMessage: 'Failed to deploy agent',
      })
    }

    return badRequest('Invalid action')
  })(request)
}
