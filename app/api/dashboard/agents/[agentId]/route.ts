import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized, badRequest } from '@/app/api/_lib/errors'
import { z } from 'zod'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { agentId } = await params

    // Validate agentId format
    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const response = await fetch(`${API_BASE_URL}/v1/agents/${agentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { agentId } = await params

    // Validate agentId format
    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const response = await fetch(`${API_BASE_URL}/v1/agents/${agentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ detail: 'Failed to delete agent' }))
      return NextResponse.json(payload, { status: response.status })
    }

    return NextResponse.json({ success: true })
  })(request)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { agentId } = await params

    // Validate agentId format
    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    // Determine action from URL search params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stop') {
      const response = await fetch(`${API_BASE_URL}/v1/agents/${agentId}/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({ detail: 'Failed to stop agent' }))
      return NextResponse.json(payload, { status: response.status })
    }

    if (action === 'deploy') {
      const response = await fetch(`${API_BASE_URL}/v1/agents/${agentId}/deploy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({ detail: 'Failed to deploy agent' }))
      return NextResponse.json(payload, { status: response.status })
    }

    return badRequest('Invalid action')
  })(request)
}
