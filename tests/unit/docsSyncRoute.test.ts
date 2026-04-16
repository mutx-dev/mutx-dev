import type { NextRequest } from 'next/server'

const getSyncLog = jest.fn(() => [])
const getSyncStatus = jest.fn(() => ({ syncing: false }))
const hasGit = jest.fn(() => false)
const syncDocsFromGit = jest.fn()

jest.mock('../../lib/docs-sync', () => ({
  getSyncLog,
  getSyncStatus,
  hasGit,
  syncDocsFromGit,
}))

function mockPostRequest(
  headers: Record<string, string> = {},
  body = '',
): NextRequest {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    headers: {
      get: (name: string) => normalizedHeaders.get(name.toLowerCase()) ?? null,
    },
    text: async () => body,
  } as NextRequest
}

describe('/api/docs/sync route', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalSyncToken = process.env.DOCS_SYNC_TOKEN

  beforeEach(() => {
    jest.resetModules()
    getSyncLog.mockReturnValue([])
    getSyncStatus.mockReturnValue({ syncing: false })
    hasGit.mockReturnValue(false)
    syncDocsFromGit.mockReset()
    delete process.env.DOCS_SYNC_TOKEN
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  })

  afterAll(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    if (originalSyncToken === undefined) {
      delete process.env.DOCS_SYNC_TOKEN
    } else {
      process.env.DOCS_SYNC_TOKEN = originalSyncToken
    }
  })

  it('rejects manual sync when DOCS_SYNC_TOKEN is missing outside development', async () => {
    const { POST } = await import('../../app/api/docs/sync/route')

    const response = await POST(mockPostRequest())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'DOCS_SYNC_TOKEN is required outside development',
    })
    expect(syncDocsFromGit).not.toHaveBeenCalled()
  })

  it('rejects manual sync when bearer token is wrong', async () => {
    process.env.DOCS_SYNC_TOKEN = 'expected-token'
    const { POST } = await import('../../app/api/docs/sync/route')

    const response = await POST(
      mockPostRequest({ authorization: 'Bearer wrong-token' }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(syncDocsFromGit).not.toHaveBeenCalled()
  })
})
