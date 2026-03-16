import type { NextRequest } from 'next/server'

const getAuthToken = jest.fn()
const getCookieDomain = jest.fn()
const shouldUseSecureCookies = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  getAuthToken,
  getCookieDomain,
  shouldUseSecureCookies,
}))

function mockRequest() {
  return {} as NextRequest
}

function mockJsonRequest(body: unknown) {
  return {
    json: async () => body,
  } as NextRequest
}

describe('auth route handlers', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    getAuthToken.mockReset()
    getCookieDomain.mockReturnValue(undefined)
    shouldUseSecureCookies.mockReturnValue(false)
    fetchSpy = jest.spyOn(global as typeof globalThis, 'fetch').mockImplementation(jest.fn())
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('POST /api/auth/login', () => {
    it('returns 400 when email is missing', async () => {
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(mockJsonRequest({ password: 'password123' }))

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 when email format is invalid', async () => {
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(mockJsonRequest({ email: 'not-an-email', password: 'password123' }))

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 when password is missing', async () => {
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(mockJsonRequest({ email: 'operator@mutx.dev' }))

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('preserves upstream unauthorized responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      })
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'wrongpassword' })
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'operator@mutx.dev', password: 'wrongpassword' }),
        cache: 'no-store',
      })
      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ detail: 'Invalid credentials' })
    })

    it('returns payload and sets auth cookies on successful login', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 1800,
        }),
      })
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'correctpassword' })
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'operator@mutx.dev', password: 'correctpassword' }),
        cache: 'no-store',
      })
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 1800,
      })
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('access_token=')
      expect(setCookieHeader).toContain('refresh_token=')
    })

    it('uses default maxAge when expires_in is absent from login response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
        }),
      })
      const { POST } = await import('../../app/api/auth/login/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'correctpassword' })
      )

      expect(response.status).toBe(200)
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('access_token=')
    })
  })

  describe('POST /api/auth/register', () => {
    it('returns 400 when required fields are missing', async () => {
      const { POST } = await import('../../app/api/auth/register/route')

      const response = await POST(mockJsonRequest({}))

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 when password is too short', async () => {
      const { POST } = await import('../../app/api/auth/register/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'short', name: 'Operator' })
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
      const { POST } = await import('../../app/api/auth/register/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'securepassword123' })
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.status).toBe('error')
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('preserves upstream conflict responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Email already registered' }),
      })
      const { POST } = await import('../../app/api/auth/register/route')

      const response = await POST(
        mockJsonRequest({ email: 'operator@mutx.dev', password: 'securepassword123', name: 'Operator' })
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'operator@mutx.dev', password: 'securepassword123', name: 'Operator' }),
        cache: 'no-store',
      })
      expect(response.status).toBe(409)
      await expect(response.json()).resolves.toEqual({ detail: 'Email already registered' })
    })

    it('returns payload and sets auth cookies on successful registration', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 1800,
        }),
      })
      const { POST } = await import('../../app/api/auth/register/route')

      const response = await POST(
        mockJsonRequest({ email: 'newuser@mutx.dev', password: 'securepassword123', name: 'New User' })
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newuser@mutx.dev', password: 'securepassword123', name: 'New User' }),
        cache: 'no-store',
      })
      expect(response.status).toBe(201)
      await expect(response.json()).resolves.toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 1800,
      })
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('access_token=')
      expect(setCookieHeader).toContain('refresh_token=')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('returns 200 with success payload', async () => {
      const { POST } = await import('../../app/api/auth/logout/route')

      const response = await POST(mockRequest())

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ success: true })
    })

    it('clears auth cookies by setting maxAge to 0', async () => {
      const { POST } = await import('../../app/api/auth/logout/route')

      const response = await POST(mockRequest())

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('access_token=')
      expect(setCookieHeader).toContain('refresh_token=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })

    it('does not call the backend API', async () => {
      const { POST } = await import('../../app/api/auth/logout/route')

      await POST(mockRequest())

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns 401 when no auth token exists', async () => {
      getAuthToken.mockResolvedValue(null)
      const { GET } = await import('../../app/api/auth/me/route')

      const response = await GET(mockRequest())

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({ detail: 'Unauthorized' })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('preserves upstream unauthorized responses', async () => {
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

    it('preserves successful user payloads', async () => {
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
  })
})
