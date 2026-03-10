import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Try to get token from cookie first, then from Authorization header
  const token = request.cookies.get('access_token')?.value
  if (token) return token
  
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch API keys' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API keys fetch error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create API key' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API key create error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract key ID from URL path: /api/api-keys/{keyId}
    const pathParts = request.nextUrl.pathname.split('/')
    const keyId = pathParts[pathParts.length - 1]

    if (!keyId || keyId === 'api-keys') {
      return NextResponse.json({ error: 'Missing key ID' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to revoke API key' }))
      return NextResponse.json(error, { status: response.status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('API key delete error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}
