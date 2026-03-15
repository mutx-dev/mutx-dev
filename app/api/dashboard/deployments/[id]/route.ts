import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''

    if (path === 'versions') {
      const response = await fetch(`${API_BASE_URL}/deployments/${id}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({ detail: 'Failed to fetch versions' }))
      return NextResponse.json(payload, { status: response.status })
    }

    const response = await fetch(`${API_BASE_URL}/deployments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch deployment' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard deployment proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    if (body.action === 'scale') {
      const response = await fetch(`${API_BASE_URL}/deployments/${id}/scale`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replicas: body.replicas }),
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({ detail: 'Failed to scale deployment' }))
      return NextResponse.json(payload, { status: response.status })
    }

    const response = await fetch(`${API_BASE_URL}/deployments/${id}/restart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to restart deployment' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard deployment action proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/deployments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const payload = await response.json().catch(() => ({ detail: 'Failed to delete deployment' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard deployment delete proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}