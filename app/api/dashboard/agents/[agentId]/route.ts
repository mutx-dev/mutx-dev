import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
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

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
      request,
      `${API_BASE_URL}/v1/agents/${agentId}`,
      { cache: 'no-store' }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agent' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })
    
    if (tokenRefreshed && cookieHeader) {
      nextResponse.headers.set('Set-Cookie', cookieHeader)
    }
    
    return nextResponse
  })(request)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { agentId } = await params

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
      request,
      `${API_BASE_URL}/v1/agents/${agentId}`,
      { method: 'DELETE', cache: 'no-store' }
    )

    const nextResponse = NextResponse.json(
      response.ok ? { success: true } : await response.json().catch(() => ({ detail: 'Failed to delete agent' })),
      { status: response.status }
    )
    
    if (tokenRefreshed && cookieHeader) {
      nextResponse.headers.set('Set-Cookie', cookieHeader)
    }
    
    return nextResponse
  })(request)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { agentId } = await params

    const idValidation = z.string().uuid('Invalid agent ID').safeParse(agentId)
    if (!idValidation.success) {
      return badRequest('Invalid agent ID format')
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stop') {
      const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
        request,
        `${API_BASE_URL}/v1/agents/${agentId}/stop`,
        { method: 'POST', cache: 'no-store' }
      )

      const payload = await response.json().catch(() => ({ detail: 'Failed to stop agent' }))
      const nextResponse = NextResponse.json(payload, { status: response.status })
      
      if (tokenRefreshed && cookieHeader) {
        nextResponse.headers.set('Set-Cookie', cookieHeader)
      }
      
      return nextResponse
    }

    if (action === 'deploy') {
      const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
        request,
        `${API_BASE_URL}/v1/agents/${agentId}/deploy`,
        { method: 'POST', cache: 'no-store' }
      )

      const payload = await response.json().catch(() => ({ detail: 'Failed to deploy agent' }))
      const nextResponse = NextResponse.json(payload, { status: response.status })
      
      if (tokenRefreshed && cookieHeader) {
        nextResponse.headers.set('Set-Cookie', cookieHeader)
      }
      
      return nextResponse
    }

    return badRequest('Invalid action')
  })(request)
}
