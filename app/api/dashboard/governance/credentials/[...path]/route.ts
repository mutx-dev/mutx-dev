import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { proxyJson } from '@/app/api/_lib/proxy'
import { withErrorHandling } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

function buildTargetUrl(path: string[]) {
  const suffix = path.length > 0 ? `/${path.join('/')}` : ''
  return `${getApiBaseUrl()}/v1/governance/credentials${suffix}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return withErrorHandling(async () => {
    const { path } = await params
    return proxyJson(request, buildTargetUrl(path), {
      method: 'GET',
      fallbackMessage: 'Failed to fetch governance credentials',
    })
  })(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return withErrorHandling(async () => {
    const { path } = await params
    const body = await request.text()
    return proxyJson(request, buildTargetUrl(path), {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body || undefined,
      fallbackMessage: 'Failed to update governance credentials',
    })
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return withErrorHandling(async () => {
    const { path } = await params
    return proxyJson(request, buildTargetUrl(path), {
      method: 'DELETE',
      fallbackMessage: 'Failed to delete governance credential resource',
    })
  })(request)
}
