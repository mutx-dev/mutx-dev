import fs from 'fs'
import path from 'path'

describe('dashboard proxy route auth boundaries', () => {
  function read(relativePath: string) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
  }

  it('keeps public health route unauthenticated for live-demo readiness', () => {
    const source = read('app/api/dashboard/health/route.ts')
    expect(source).not.toContain('getAuthToken')
    expect(source).toContain('fetch(`${API_BASE_URL}/health`')
  })

  it.each([
    ['app/api/dashboard/agents/route.ts', '/agents?limit=20'],
    ['app/api/dashboard/deployments/route.ts', '/deployments?limit=20'],
    ['app/api/api-keys/route.ts', '/api-keys'],
  ])(
    'requires auth and forwards bearer token for %s',
    (relativePath, upstreamPath) => {
      const source = read(relativePath)
      expect(source).toContain('const token = await getAuthToken(request)')
      expect(source).toContain('if (!token)')
      expect(source).toMatch(/Authorization:\s*`Bearer \$\{token\}`|'Authorization':\s*`Bearer \$\{token\}`/)
      expect(source).toContain(upstreamPath)
    },
  )
})
