import type { NextRequest } from 'next/server'

const getAuthToken = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  getAuthToken,
}))

function mockRequest() {
  return {} as NextRequest
}

describe('dashboard route proxies', () => {
  beforeEach(() => {
    getAuthToken.mockReset()
    global.fetch = jest.fn()
  })

  it('returns 401 from dashboard agents proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ status: 'error', error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 401 from dashboard agents proxy when user lookup fails', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Session expired' }),
    })
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/me', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(401)
  })

  it('preserves upstream forbidden responses for dashboard agents proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user_123', email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      })
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/agents?limit=20&user_id=user_123', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves successful list responses for dashboard agents proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user_123', email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'agent_123',
            name: 'runtime-agent',
            status: 'running',
          },
        ],
      })
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/agents?limit=20&user_id=user_123', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        id: 'agent_123',
        name: 'runtime-agent',
        status: 'running',
      },
    ])
  })

  it('returns 401 from dashboard deployments proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ status: 'error', error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 401 from dashboard deployments proxy when user lookup fails', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Session expired' }),
    })
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/me', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(401)
  })

  it('preserves upstream forbidden responses for dashboard deployments proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user_123', email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      })
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/deployments?limit=20&user_id=user_123', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves successful list responses for dashboard deployments proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user_123', email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'dep_123',
            agent_id: 'agent_123',
            status: 'running',
          },
        ],
      })
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/deployments?limit=20&user_id=user_123', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        id: 'dep_123',
        agent_id: 'agent_123',
        status: 'running',
      },
    ])
  })

  it('proxies deployment creation requests', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'dep_123', status: 'pending' }),
    })
    const { POST } = await import('../../app/api/dashboard/deployments/route')

    const response = await POST({
      json: async () => ({ agent_id: '123e4567-e89b-12d3-a456-426614174000' }),
    } as NextRequest)

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/deployments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: '123e4567-e89b-12d3-a456-426614174000' }),
      cache: 'no-store',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: 'dep_123', status: 'pending' })
  })

  it('proxies deployment restart actions', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'dep_123', status: 'pending' }),
    })
    const { POST } = await import('../../app/api/dashboard/deployments/[id]/route')

    const response = await POST(
      { url: 'http://localhost:3000/api/dashboard/v1/deployments/dep_123?action=restart' } as NextRequest,
      { params: Promise.resolve({ id: 'dep_123' }) }
    )

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/deployments/dep_123/restart', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'dep_123', status: 'pending' })
  })

  it('proxies deployment delete actions', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    })
    const { DELETE } = await import('../../app/api/dashboard/deployments/[id]/route')

    const response = await DELETE(
      mockRequest(),
      { params: Promise.resolve({ id: 'dep_123' }) }
    )

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/deployments/dep_123', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(204)
  })


  it('preserves upstream unauthorized responses for auth me proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Session expired' }),
    })
    const { GET } = await import('../../app/api/auth/me/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/me', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ detail: 'Session expired' })
  })

  it('returns 401 from auth me proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { GET } = await import('../../app/api/auth/me/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ detail: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('preserves successful auth me payloads', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'user_123',
        email: 'operator@mutx.dev',
        name: 'Operator',
      }),
    })
    const { GET } = await import('../../app/api/auth/me/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/me', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: 'user_123',
      email: 'operator@mutx.dev',
      name: 'Operator',
    })
  })

  it('preserves upstream health payloads and statuses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 503,
      json: async () => ({ status: 'degraded', detail: 'database unavailable' }),
    })
    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      expect.objectContaining({
        cache: 'no-store',
      })
    )
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      status: 'degraded',
      detail: 'database unavailable',
    })
  })

  it('returns a degraded status on health timeout', async () => {
    const timeoutError = new DOMException('The operation was aborted.', 'AbortError')
    ;(global.fetch as jest.Mock).mockRejectedValue(timeoutError)
    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      expect.objectContaining({
        cache: 'no-store',
      })
    )
    expect(response.status).toBe(504)
    await expect(response.json()).resolves.toEqual({
      status: 'degraded',
      error: 'Health check timed out',
    })
  })

  it('preserves upstream unauthorized responses for api keys proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Session expired' }),
    })
    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ detail: 'Session expired' })
  })

  it('preserves upstream conflict responses for api key creation', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Active API key limit reached' }),
    })
    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST({
      json: async () => ({ name: 'Demo key' }),
    } as NextRequest)

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Demo key' }),
      cache: 'no-store',
    })
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ detail: 'Active API key limit reached' })
  })

  it('returns a fallback health payload when the health proxy throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('socket hang up'))
    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      status: 'unknown',
      error: 'Failed to connect to API',
    })
  })
})
