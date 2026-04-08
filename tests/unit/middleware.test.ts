import { NextRequest } from 'next/server'
import { middleware } from '../../middleware'

describe('middleware /v1 alias rewrite', () => {
  it('rewrites /v1/* aliases to /api/* routes', () => {
    const request = new NextRequest('http://localhost:3000/v1/agents?limit=20', {
      headers: {
        host: 'localhost:3000',
      },
    })

    const response = middleware(request)
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/api/agents')
  })
})
