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

describe('API key route proxies', () => {
  beforeEach(() => {
    getAuthToken.mockReset()
    global.fetch = jest.fn()
  })

  it('returns 401 from revoke proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('preserves upstream forbidden responses for rotate proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })

    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api-keys/key_123/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
      },
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves successful revoke responses for the dashboard proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
    })

    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api-keys/key_123', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token',
      },
    })
    expect(response.status).toBe(204)
  })

  it('preserves successful rotate responses for the dashboard proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'key_456',
        name: 'rotated-key',
        key: 'mutx_live_rotated',
      }),
    })

    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api-keys/key_123/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: 'key_456',
      name: 'rotated-key',
      key: 'mutx_live_rotated',
    })
  })

  it('preserves successful create responses for the dashboard proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'key_789',
        name: 'build-key',
        key: 'mutx_live_created',
      }),
    })

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'build-key' }))

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'build-key' }),
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      id: 'key_789',
      name: 'build-key',
      key: 'mutx_live_created',
    })
  })

  it('preserves successful list responses for the dashboard proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 'key_111',
          name: 'deploy-key',
          is_active: true,
        },
      ]),
    })

    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api-keys', {
      headers: {
        Authorization: 'Bearer token',
      },
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        id: 'key_111',
        name: 'deploy-key',
        is_active: true,
      },
    ])
  })
})
