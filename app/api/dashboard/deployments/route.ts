import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

async function proxyRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({ detail: 'Request failed' }))
  return NextResponse.json(payload, { status: response.status })
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return proxyRequest('GET', '/api/deployments?limit=20', token)
  } catch (error) {
    console.error('Dashboard deployments proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    return proxyRequest('POST', '/api/deployments', token, body)
  } catch (error) {
    console.error('Dashboard deployments POST error:', error)
    return NextResponse.json({ detail: 'Failed to create deployment' }, { status: 500 })
  }
}
