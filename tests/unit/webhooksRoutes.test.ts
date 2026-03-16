import type { NextRequest } from 'next/server'

const getAuthToken = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  getAuthToken,
}))

function mockRequest() {
  return {} as NextRequest
}

function mockJsonRequest(body: unknown) {
  return {
    json: async () => body,
  } as NextRequest
}

function mockRequestWithUrl(url: string) {
  return { url } as NextRequest
}

function mockJsonRequestWithUrl(body: unknown, url: string) {
  return {
    json: async () => body,
    url,
  } as NextRequest
}

describe('Webhooks route proxies', () => {
  beforeEach(() => {
    getAuthToken.mockReset()
    global.fetch = jest.fn()
  })

  describe('GET /api/webhooks', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { GET } = await import('../../app/api/webhooks/route')

      const response = await GET(mockRequest())

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error.code).toBe('UNAUTHORIZED')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('proxies request to backend and returns webhooks array', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          webhooks: [
            { id: 'wh_123', name: 'test-webhook', url: 'https://example.com/webhook', events: ['agent.deployed'], active: true },
          ],
        }),
      })

      const { GET } = await import('../../app/api/webhooks/route')

      const response = await GET(mockRequest())

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/webhooks', {
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        webhooks: [
          { id: 'wh_123', name: 'test-webhook', url: 'https://example.com/webhook', events: ['agent.deployed'], active: true },
        ],
      })
    })

    it('handles backend error responses', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      const { GET } = await import('../../app/api/webhooks/route')

      const response = await GET(mockRequest())

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({ error: 'Internal server error' })
    })

    it('handles flat array response from backend', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { id: 'wh_456', name: 'another-webhook', url: 'https://example.com/hook', events: ['agent.stopped'], active: false },
        ],
      })

      const { GET } = await import('../../app/api/webhooks/route')

      const response = await GET(mockRequest())

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.webhooks).toHaveLength(1)
      expect(json.webhooks[0].id).toBe('wh_456')
    })
  })

  describe('POST /api/webhooks', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'my-webhook',
        url: 'https://example.com/webhook',
        events: ['agent.deployed'],
      }))

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error.code).toBe('UNAUTHORIZED')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 for invalid request body', async () => {
      getAuthToken.mockResolvedValue('token')
      const { POST } = await import('../../app/api/webhooks/route')

      // Missing required fields
      const response = await POST(mockJsonRequest({
        name: 'my-webhook',
        // url is required
        // events is required
      }))

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns 400 for invalid URL format', async () => {
      getAuthToken.mockResolvedValue('token')
      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'bad-url-webhook',
        url: 'not-a-valid-url',
        events: ['agent.deployed'],
      }))

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns 400 for empty events array', async () => {
      getAuthToken.mockResolvedValue('token')
      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'empty-events-webhook',
        url: 'https://example.com/webhook',
        events: [],
      }))

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('proxies valid request to backend and returns created webhook', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'wh_new',
          name: 'my-webhook',
          url: 'https://example.com/webhook',
          events: ['agent.deployed'],
          active: true,
        }),
      })

      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'my-webhook',
        url: 'https://example.com/webhook',
        events: ['agent.deployed'],
      }))

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
        })
      )
      expect(response.status).toBe(201)
      await expect(response.json()).resolves.toEqual({
        id: 'wh_new',
        name: 'my-webhook',
        url: 'https://example.com/webhook',
        events: ['agent.deployed'],
        active: true,
      })
    })

    it('proxies request with optional secret to backend', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'wh_secret',
          name: 'secret-webhook',
          url: 'https://example.com/webhook',
          events: ['agent.deployed'],
          active: true,
        }),
      })

      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'secret-webhook',
        url: 'https://example.com/webhook',
        events: ['agent.deployed'],
        secret: 'my-secret-key',
      }))

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
        })
      )
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.secret).toBe('my-secret-key')
      expect(response.status).toBe(201)
    })

    it('handles backend conflict response', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Webhook with this name already exists' }),
      })

      const { POST } = await import('../../app/api/webhooks/route')

      const response = await POST(mockJsonRequest({
        name: 'duplicate-webhook',
        url: 'https://example.com/webhook',
        events: ['agent.deployed'],
      }))

      expect(response.status).toBe(409)
      await expect(response.json()).resolves.toEqual({ error: 'Webhook with this name already exists' })
    })
  })

  describe('PATCH /api/webhooks/[id]', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { PATCH } = await import('../../app/api/webhooks/[id]/route')

      const response = await PATCH(
        mockJsonRequest({ url: 'https://example.com/webhook', name: 'my-webhook', events: ['agent.deployed'] }),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 when url is missing', async () => {
      getAuthToken.mockResolvedValue('token')
      const { PATCH } = await import('../../app/api/webhooks/[id]/route')

      const response = await PATCH(
        mockJsonRequest({ name: 'my-webhook', events: ['agent.deployed'] }),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: 'URL is required' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('proxies valid PATCH request to backend and returns updated webhook', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'wh_123',
          name: 'updated-webhook',
          url: 'https://example.com/updated',
          events: ['agent.deployed', 'agent.stopped'],
          active: true,
        }),
      })

      const { PATCH } = await import('../../app/api/webhooks/[id]/route')

      const response = await PATCH(
        mockJsonRequest({ url: 'https://example.com/updated', name: 'updated-webhook', events: ['agent.deployed', 'agent.stopped'] }),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/webhooks/wh_123',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
        })
      )
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        id: 'wh_123',
        name: 'updated-webhook',
        url: 'https://example.com/updated',
        events: ['agent.deployed', 'agent.stopped'],
        active: true,
      })
    })

    it('handles backend error responses', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Webhook not found' }),
      })

      const { PATCH } = await import('../../app/api/webhooks/[id]/route')

      const response = await PATCH(
        mockJsonRequest({ url: 'https://example.com/webhook', name: 'gone', events: [] }),
        { params: Promise.resolve({ id: 'wh_missing' }) }
      )

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: 'Webhook not found' })
    })
  })

  describe('DELETE /api/webhooks/[id]', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { DELETE } = await import('../../app/api/webhooks/[id]/route')

      const response = await DELETE(mockRequest(), { params: Promise.resolve({ id: 'wh_123' }) })

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('proxies valid DELETE request to backend and returns 204', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      })

      const { DELETE } = await import('../../app/api/webhooks/[id]/route')

      const response = await DELETE(mockRequest(), { params: Promise.resolve({ id: 'wh_123' }) })

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/webhooks/wh_123', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      expect(response.status).toBe(204)
    })

    it('handles backend error responses', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Webhook not found' }),
      })

      const { DELETE } = await import('../../app/api/webhooks/[id]/route')

      const response = await DELETE(mockRequest(), { params: Promise.resolve({ id: 'wh_missing' }) })

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: 'Webhook not found' })
    })
  })

  describe('POST /api/webhooks/[id]/test', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { POST } = await import('../../app/api/webhooks/[id]/test/route')

      const response = await POST(mockRequest(), { params: Promise.resolve({ id: 'wh_123' }) })

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('proxies valid POST request to backend and returns test result', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, status_code: 200, response_body: 'OK' }),
      })

      const { POST } = await import('../../app/api/webhooks/[id]/test/route')

      const response = await POST(mockRequest(), { params: Promise.resolve({ id: 'wh_123' }) })

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/webhooks/wh_123/test', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ success: true, status_code: 200, response_body: 'OK' })
    })

    it('handles backend error responses', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Webhook not found' }),
      })

      const { POST } = await import('../../app/api/webhooks/[id]/test/route')

      const response = await POST(mockRequest(), { params: Promise.resolve({ id: 'wh_missing' }) })

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: 'Webhook not found' })
    })
  })

  describe('GET /api/webhooks/[id]/deliveries', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')

      const response = await GET(
        mockRequestWithUrl('http://localhost:3000/api/webhooks/wh_123/deliveries'),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('proxies request to backend with default limit and returns deliveries', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { id: 'del_1', webhook_id: 'wh_123', success: true, status_code: 200, created_at: '2024-01-01T00:00:00Z' },
        ]),
      })

      const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')

      const response = await GET(
        mockRequestWithUrl('http://localhost:3000/api/webhooks/wh_123/deliveries'),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/webhooks/wh_123/deliveries?limit=50',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
      )
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.deliveries).toHaveLength(1)
      expect(json.deliveries[0].id).toBe('del_1')
    })

    it('forwards event and success query params to backend', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      })

      const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')

      await GET(
        mockRequestWithUrl('http://localhost:3000/api/webhooks/wh_123/deliveries?event=agent.deployed&success=true&limit=10'),
        { params: Promise.resolve({ id: 'wh_123' }) }
      )

      const calledUrl: string = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(calledUrl).toContain('event=agent.deployed')
      expect(calledUrl).toContain('success=true')
      expect(calledUrl).toContain('limit=10')
    })

    it('handles backend error responses', async () => {
      getAuthToken.mockResolvedValue('token')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Webhook not found' }),
      })

      const { GET } = await import('../../app/api/webhooks/[id]/deliveries/route')

      const response = await GET(
        mockRequestWithUrl('http://localhost:3000/api/webhooks/wh_missing/deliveries'),
        { params: Promise.resolve({ id: 'wh_missing' }) }
      )

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: 'Webhook not found' })
    })
  })
})
