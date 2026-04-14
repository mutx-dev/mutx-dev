import type { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession,
}))

function mockRequest(url = 'http://localhost:3000/api/webhooks/wh_123/deliveries') {
  return {
    url,
  } as NextRequest
}

describe('Webhook delivery route proxy', () => {
  beforeEach(() => {
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    hasAuthSession.mockReset()
  })

  it('returns 401 when no auth session exists', async () => {
    hasAuthSession.mockReturnValue(false)

    const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')
    const response = await GET(mockRequest(), {
      params: Promise.resolve({ id: 'wh_123' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
  })

  it('wraps array responses into a deliveries collection payload', async () => {
    hasAuthSession.mockReturnValue(true)
    authenticatedFetch.mockResolvedValue({
      response: {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'delivery_1',
            event: 'agent.started',
            success: true,
            status_code: 200,
          },
        ],
      },
      tokenRefreshed: false,
    })

    const request = mockRequest()
    const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')
    const response = await GET(request, {
      params: Promise.resolve({ id: 'wh_123' }),
    })

    expect(authenticatedFetch).toHaveBeenCalledWith(
      request,
      'http://localhost:8000/v1/webhooks/wh_123/deliveries?limit=50',
      {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      deliveries: [
        {
          id: 'delivery_1',
          event: 'agent.started',
          success: true,
          status_code: 200,
        },
      ],
    })
  })

  it('normalizes wrapped delivery collections from alternate keys', async () => {
    hasAuthSession.mockReturnValue(true)
    authenticatedFetch.mockResolvedValue({
      response: {
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 'delivery_2',
              event: 'run.failed',
              success: false,
              status_code: 502,
            },
          ],
        }),
      },
      tokenRefreshed: false,
    })

    const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')
    const response = await GET(mockRequest(), {
      params: Promise.resolve({ id: 'wh_123' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      deliveries: [
        {
          id: 'delivery_2',
          event: 'run.failed',
          success: false,
          status_code: 502,
        },
      ],
    })
  })
})
