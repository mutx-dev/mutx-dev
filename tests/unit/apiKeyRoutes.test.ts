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

  it('returns 401 from list proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('preserves upstream forbidden responses for list proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })

    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('returns 401 from create proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'build-key' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(global.fetch).not.toHaveBeenCalled()
  })


  it('returns 401 from rotate proxy when no auth token exists', async () => {
    getAuthToken.mockResolvedValue(null)
    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
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

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_123/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves upstream forbidden responses for revoke proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })

    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_123', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves upstream forbidden responses for create proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'blocked-key' }))

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'blocked-key' }),
      cache: 'no-store',
    })
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' })
  })

  it('preserves active key limit conflicts for create proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Active API key limit reached (10)' }),
    })

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'overflow-key' }))

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'overflow-key' }),
      cache: 'no-store',
    })
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      detail: 'Active API key limit reached (10)',
    })
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

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_123', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
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

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_123/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
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

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'build-key' }),
      cache: 'no-store',
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

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
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

  it('preserves upstream not-found responses for revoke proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'API key not found' }),
    })

    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_missing' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_missing', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
    })
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ detail: 'API key not found' })
  })

  it('preserves upstream not-found responses for rotate proxy', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'API key not found' }),
    })

    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
      params: Promise.resolve({ id: 'key_missing' }),
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys/key_missing/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
      },
      cache: 'no-store',
    })
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ detail: 'API key not found' })
  })

  it('returns 500 from list proxy on network error', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'))

    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to connect to API' })
  })

  it('returns 500 from create proxy on network error', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'))

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'build-key' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to connect to API' })
  })

  it('returns 500 from revoke proxy on network error', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'))

    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to connect to API' })
  })

  it('returns 500 from rotate proxy on network error', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'))

    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to connect to API' })
  })

  it('falls back to default error detail when list upstream returns malformed JSON', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })

    const { GET } = await import('../../app/api/api-keys/route')

    const response = await GET(mockRequest())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ detail: 'Failed to fetch API keys' })
  })

  it('falls back to default error detail when create upstream returns malformed JSON', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'bad-key' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ detail: 'Failed to create API key' })
  })

  it('falls back to default error detail when revoke upstream returns malformed JSON', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })

    const { DELETE } = await import('../../app/api/api-keys/[id]/route')

    const response = await DELETE(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ detail: 'Failed to revoke API key' })
  })

  it('falls back to default error detail when rotate upstream returns malformed JSON', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })

    const { POST } = await import('../../app/api/api-keys/[id]/rotate/route')

    const response = await POST(mockRequest(), {
      params: Promise.resolve({ id: 'key_123' }),
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ detail: 'Failed to rotate API key' })
  })

  it('forwards expires_in_days when creating an API key', async () => {
    getAuthToken.mockResolvedValue('token')
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'key_exp',
        name: 'expiring-key',
        key: 'mutx_live_exp',
        expires_in_days: 30,
      }),
    })

    const { POST } = await import('../../app/api/api-keys/route')

    const response = await POST(mockJsonRequest({ name: 'expiring-key', expires_in_days: 30 }))

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api-keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'expiring-key', expires_in_days: 30 }),
      cache: 'no-store',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      id: 'key_exp',
      name: 'expiring-key',
      expires_in_days: 30,
    })
  })
})
