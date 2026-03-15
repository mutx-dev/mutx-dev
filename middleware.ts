import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function getHostname(request: NextRequest) {
  return request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
}

function isAppHost(hostname: string) {
  return hostname === 'app.mutx.dev' || hostname === 'app.localhost'
}

function isPrimaryWebHost(hostname: string) {
  return hostname === 'mutx.dev' || hostname === 'www.mutx.dev'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)

  // Keep app.mutx.dev as the canonical operator surface in production.
  if (isPrimaryWebHost(hostname) && (pathname === '/app' || pathname.startsWith('/app/'))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.hostname = 'app.mutx.dev'
    redirectUrl.protocol = 'https'
    redirectUrl.port = ''
    redirectUrl.pathname = pathname.replace(/^\/app/, '') || '/'
    return NextResponse.redirect(redirectUrl, 308)
  }

  if (!isAppHost(hostname)) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/android-chrome') ||
    pathname.startsWith('/site.webmanifest')
  ) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = pathname === '/' ? '/app' : `/app${pathname}`

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/', '/favicon.ico', '/robots.txt', '/sitemap.xml'],
}
