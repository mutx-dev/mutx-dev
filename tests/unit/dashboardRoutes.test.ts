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
    await expect(response.json()).resolves.toEqual({ detail: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('preserves upstream forbidden responses for dashboard agents proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/agents?limit=20', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves successful list responses for dashboard agents proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 'agent_123',
          name: 'runtime-agent',
          status: 'running',
        },
      ]),
    })
    const { GET } = await import('../../app/api/dashboard/agents/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/agents?limit=20', {
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

  it('preserves upstream forbidden responses for dashboard deployments proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/deployments?limit=20', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves successful list responses for dashboard deployments proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 'dep_123',
          agent_id: 'agent_123',
          status: 'running',
        },
      ]),
    })
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/deployments?limit=20', {
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

  it('returns 401 from dashboard deployments proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { GET } = await import('../../app/api/dashboard/deployments/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ detail: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('preserves upstream health payloads and statuses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 503,
      json: async () => ({ status: 'degraded', detail: 'database unavailable' }),
    })
    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/health', {
      cache: 'no-store',
    })
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      status: 'degraded',
      detail: 'database unavailable',
    })
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
