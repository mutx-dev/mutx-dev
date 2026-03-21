import type { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()
const getAuthToken = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  getAuthToken,
  hasAuthSession,
}))

function mockRequest(url = 'http://localhost:3000/api/agents/agent-123') {
  return { url } as NextRequest
}

describe('agent ownership route guards', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    getAuthToken.mockReset()
    hasAuthSession.mockReset()
    global.fetch = jest.fn()
  })

  it('denies agent route access when the authenticated user does not own the agent', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'agent-123', user_id: 'user-owner' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-requester' }),
      })

    const { GET } = await import('../../app/api/agents/[id]/route')
    const response = await GET(mockRequest(), { params: Promise.resolve({ id: 'agent-123' }) })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'FORBIDDEN', message: 'You do not own this agent' },
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'http://localhost:8000/v1/agents/agent-123', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    })
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://localhost:8000/v1/auth/me', {
      headers: { Authorization: 'Bearer token' },
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    })
  })

  it('allows dashboard agent actions through when the authenticated user owns the agent', async () => {
    getAuthToken.mockResolvedValue('token')
    hasAuthSession.mockReturnValue(true)
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '123e4567-e89b-12d3-a456-426614174000', user_id: 'user-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-123' }),
      })
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'stopped' }),
      },
      tokenRefreshed: false,
    })

    const { POST } = await import('../../app/api/dashboard/agents/[agentId]/route')
    const response = await POST(
      mockRequest('http://localhost:3000/api/dashboard/agents/123e4567-e89b-12d3-a456-426614174000?action=stop'),
      { params: Promise.resolve({ agentId: '123e4567-e89b-12d3-a456-426614174000' }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'stopped',
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.anything(),
      'http://localhost:8000/v1/agents/123e4567-e89b-12d3-a456-426614174000/stop',
      {
        method: 'POST',
        cache: 'no-store',
      },
    )
    expect(applyAuthCookies).not.toHaveBeenCalled()
  })

  it('returns unauthorized for dashboard agent actions when there is no auth session', async () => {
    getAuthToken.mockResolvedValue('token')
    hasAuthSession.mockReturnValue(false)
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '123e4567-e89b-12d3-a456-426614174000', user_id: 'user-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user-123' }),
      })

    const { POST } = await import('../../app/api/dashboard/agents/[agentId]/route')
    const response = await POST(
      mockRequest('http://localhost:3000/api/dashboard/agents/123e4567-e89b-12d3-a456-426614174000?action=stop'),
      { params: Promise.resolve({ agentId: '123e4567-e89b-12d3-a456-426614174000' }) }
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
  })
})
