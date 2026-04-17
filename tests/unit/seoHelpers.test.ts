import {
  DEFAULT_APP_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_PICO_URL,
  DEFAULT_SITE_URL,
  DEFAULT_X_HANDLE,
  PUBLIC_MARKETING_ROUTES,
  BLOCKED_CRAWL_PREFIXES,
  buildPageMetadata,
  getSiteUrl,
  getAppUrl,
  getDefaultSocialBadge,
  getPicoUrl,
  toAbsoluteSiteUrl,
  toAbsoluteAppUrl,
  toAbsolutePicoUrl,
  getCanonicalUrl,
  getOgImageUrl,
  getTwitterImageUrl,
  getPageOgImageUrl,
  getPageTwitterImageUrl,
  resolveSeoSurface,
  resolveSeoSurfaceForPath,
  resolveSocialSection,
} from '../../lib/seo'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

describe('seo defaults', () => {
  it('exports a valid default site URL', () => {
    expect(DEFAULT_SITE_URL).toBe('https://mutx.dev')
  })

  it('exports a valid default app URL', () => {
    expect(DEFAULT_APP_URL).toBe('https://app.mutx.dev')
  })

  it('exports a non-empty X handle', () => {
    expect(DEFAULT_X_HANDLE).toMatch(/^@/)
  })

  it('exports a default OG image path', () => {
    expect(DEFAULT_OG_IMAGE).toMatch(/^\//)
  })

  it('exports a non-empty OG image alt text', () => {
    expect(DEFAULT_OG_IMAGE_ALT).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// PUBLIC_MARKETING_ROUTES
// ---------------------------------------------------------------------------

describe('PUBLIC_MARKETING_ROUTES', () => {
  it('includes the homepage', () => {
    expect(PUBLIC_MARKETING_ROUTES).toContain('/')
  })

  it('includes key marketing pages', () => {
    const expected = ['/download', '/docs', '/security', '/contact', '/whitepaper']
    for (const route of expected) {
      expect(PUBLIC_MARKETING_ROUTES).toContain(route)
    }
  })

  it('all routes start with /', () => {
    for (const route of PUBLIC_MARKETING_ROUTES) {
      expect(route).toMatch(/^\//)
    }
  })

  it('excludes internal routes like /dashboard and /login', () => {
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/dashboard')
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/login')
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/onboarding')
  })
})

// ---------------------------------------------------------------------------
// BLOCKED_CRAWL_PREFIXES
// ---------------------------------------------------------------------------

describe('BLOCKED_CRAWL_PREFIXES', () => {
  it('blocks /api/ prefix', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/api/')
  })

  it('blocks /dashboard prefix', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/dashboard')
  })

  it('blocks auth-related prefixes', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/login')
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/register')
  })

  it('all prefixes start with /', () => {
    for (const prefix of BLOCKED_CRAWL_PREFIXES) {
      expect(prefix).toMatch(/^\//)
    }
  })
})

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

describe('getSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('returns the default when env var is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
  })

  it('returns the env var value when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.mutx.dev'
    expect(getSiteUrl()).toBe('https://custom.mutx.dev')
  })

  it('strips trailing slash from env var', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mutx.dev/'
    expect(getSiteUrl()).toBe('https://mutx.dev')
  })
})

describe('getAppUrl', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })

  it('returns the default when env var is unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(getAppUrl()).toBe(DEFAULT_APP_URL)
  })

  it('returns the env var value when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.staging.mutx.dev'
    expect(getAppUrl()).toBe('https://app.staging.mutx.dev')
  })
})

describe('getPicoUrl', () => {
  const original = process.env.NEXT_PUBLIC_PICO_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_PICO_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_PICO_URL
    }
  })

  it('returns the default when env var is unset', () => {
    delete process.env.NEXT_PUBLIC_PICO_URL
    expect(getPicoUrl()).toBe(DEFAULT_PICO_URL)
  })

  it('returns the env var value when set', () => {
    process.env.NEXT_PUBLIC_PICO_URL = 'https://pico.staging.mutx.dev/'
    expect(getPicoUrl()).toBe('https://pico.staging.mutx.dev')
  })
})

describe('toAbsoluteSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('builds absolute URL for a path', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl('/docs')).toBe('https://mutx.dev/docs')
  })

  it('returns just the site URL for root path', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl('/')).toBe('https://mutx.dev')
  })

  it('returns just the site URL when called with no args', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl()).toBe('https://mutx.dev')
  })

  it('respects custom site URL from env', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.mutx.dev'
    expect(toAbsoluteSiteUrl('/about')).toBe('https://staging.mutx.dev/about')
  })
})

describe('toAbsoluteAppUrl', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })

  it('builds absolute app URL for a path', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(toAbsoluteAppUrl('/dashboard')).toBe('https://app.mutx.dev/dashboard')
  })

  it('returns just the app URL for root path', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(toAbsoluteAppUrl('/')).toBe('https://app.mutx.dev')
  })
})

describe('toAbsolutePicoUrl', () => {
  const original = process.env.NEXT_PUBLIC_PICO_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_PICO_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_PICO_URL
    }
  })

  it('builds absolute pico URL for a path', () => {
    delete process.env.NEXT_PUBLIC_PICO_URL
    expect(toAbsolutePicoUrl('/academy')).toBe('https://pico.mutx.dev/academy')
  })

  it('returns just the pico URL for root path', () => {
    delete process.env.NEXT_PUBLIC_PICO_URL
    expect(toAbsolutePicoUrl('/')).toBe('https://pico.mutx.dev')
  })
})

// ---------------------------------------------------------------------------
// Canonical and OG image helpers
// ---------------------------------------------------------------------------

describe('getCanonicalUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('delegates to toAbsoluteSiteUrl', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getCanonicalUrl('/pricing')).toBe('https://mutx.dev/pricing')
  })
})

describe('surface resolution helpers', () => {
  it('resolves app and pico hosts explicitly', () => {
    expect(resolveSeoSurface('app.mutx.dev')).toBe('app')
    expect(resolveSeoSurface('pico.mutx.dev')).toBe('pico')
    expect(resolveSeoSurface('app.mutx.dev, proxy.internal')).toBe('app')
    expect(resolveSeoSurface('https://pico.mutx.dev:443, proxy.internal')).toBe('pico')
    expect(resolveSeoSurface('mutx.dev')).toBe('marketing')
  })

  it('resolves app and pico surfaces from path fallbacks', () => {
    expect(resolveSeoSurfaceForPath('/control')).toBe('app')
    expect(resolveSeoSurfaceForPath('/dashboard/runs')).toBe('app')
    expect(resolveSeoSurfaceForPath('/academy')).toBe('pico')
    expect(resolveSeoSurfaceForPath('/academy/install-hermes-locally')).toBe('pico')
    expect(resolveSeoSurfaceForPath('/download')).toBe('marketing')
  })

  it('derives section-aware badges and sections', () => {
    expect(resolveSocialSection('/whitepaper')).toBe('whitepaper')
    expect(resolveSocialSection('/sdk')).toBe('sdk')
    expect(resolveSocialSection('/academy')).toBe('academy')
    expect(getDefaultSocialBadge('/control', 'app.mutx.dev')).toBe('CONTROL PLANE')
    expect(getDefaultSocialBadge('/whitepaper')).toBe('WHITEPAPER')
    expect(getDefaultSocialBadge('/sdk')).toBe('SDK')
  })
})

describe('getOgImageUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('returns an absolute URL to the default OG image', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getOgImageUrl()).toBe(`https://mutx.dev${DEFAULT_OG_IMAGE}`)
  })

  it('returns an absolute URL to the default Twitter image', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getTwitterImageUrl()).toBe('https://mutx.dev/twitter-image')
  })

  it('builds homepage-level image routes for docs and general marketing pages', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(
      getPageOgImageUrl('Docs | MUTX', 'Code-accurate docs.', { path: '/docs/reference' }),
    ).toBe(
      'https://mutx.dev/opengraph-image?title=Docs+%7C+MUTX&description=Code-accurate+docs.&path=%2Fdocs%2Freference',
    )
    expect(
      getPageTwitterImageUrl('Docs | MUTX', 'Code-accurate docs.', { path: '/docs/reference' }),
    ).toBe(
      'https://mutx.dev/twitter-image?title=Docs+%7C+MUTX&description=Code-accurate+docs.&path=%2Fdocs%2Freference',
    )
    expect(
      getPageTwitterImageUrl('Download | MUTX', 'Signed builds.', { path: '/download' }),
    ).toBe(
      'https://mutx.dev/twitter-image?title=Download+%7C+MUTX&description=Signed+builds.&path=%2Fdownload',
    )
  })

  it('supports host-aware image routes for pico', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(
      getPageOgImageUrl('Pico | MUTX', 'Pre-register.', {
        path: '/pico',
        host: 'https://pico.mutx.dev',
      }),
    ).toBe(
      'https://pico.mutx.dev/opengraph-image?title=Pico+%7C+MUTX&description=Pre-register.&path=%2Fpico',
    )
    expect(
      getPageTwitterImageUrl('Pico | MUTX', 'Pre-register.', {
        path: '/pico',
        host: 'https://pico.mutx.dev',
      }),
    ).toBe(
      'https://pico.mutx.dev/twitter-image?title=Pico+%7C+MUTX&description=Pre-register.&path=%2Fpico',
    )
  })

  it('keeps unknown routes on the homepage-level image endpoint', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(
      getPageOgImageUrl('Security | MUTX', 'Locked down.', { path: '/security' }),
    ).toBe(
      'https://mutx.dev/opengraph-image?title=Security+%7C+MUTX&description=Locked+down.&path=%2Fsecurity',
    )
  })

  it('uses root metadata image routes for the homepage', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getPageOgImageUrl('Home | MUTX', 'Root route', { path: '/' })).toBe(
      'https://mutx.dev/opengraph-image?title=Home+%7C+MUTX&description=Root+route&path=%2F',
    )
    expect(getPageTwitterImageUrl('Home | MUTX', 'Root route', { path: '/' })).toBe(
      'https://mutx.dev/twitter-image?title=Home+%7C+MUTX&description=Root+route&path=%2F',
    )
  })
})

describe('buildPageMetadata', () => {
  it('builds explicit marketing image objects with alt, size, and type', () => {
    const metadata = buildPageMetadata({
      title: 'Docs | MUTX',
      description: 'Code-accurate docs.',
      path: '/docs/reference',
      siteName: 'MUTX Docs',
      badge: 'DOCS',
    })

    expect(metadata.alternates?.canonical).toBe('https://mutx.dev/docs/reference')
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: 'https://mutx.dev/opengraph-image?title=Docs+%7C+MUTX&description=Code-accurate+docs.&path=%2Fdocs%2Freference&badge=DOCS',
        width: 1200,
        height: 630,
        alt: 'Docs | MUTX social preview for MUTX',
        type: 'image/png',
      }),
    ])
    expect(metadata.twitter?.images).toEqual([
      expect.objectContaining({
        url: 'https://mutx.dev/twitter-image?title=Docs+%7C+MUTX&description=Code-accurate+docs.&path=%2Fdocs%2Freference&badge=DOCS',
        width: 1200,
        height: 630,
      }),
    ])
  })

  it('builds host-aware metadata for app and pico surfaces', () => {
    const appMetadata = buildPageMetadata({
      title: 'MUTX Control Plane',
      description: 'Operator-grade control plane.',
      path: '/control',
      host: 'https://app.mutx.dev',
      siteName: 'MUTX App',
    })
    const picoMetadata = buildPageMetadata({
      title: 'PicoMUTX Academy',
      description: 'Guided build lessons.',
      path: '/academy',
      host: 'https://pico.mutx.dev',
      siteName: 'PicoMUTX',
    })

    expect(appMetadata.alternates?.canonical).toBe('https://app.mutx.dev/control')
    expect(appMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: expect.stringContaining('https://app.mutx.dev/opengraph-image?'),
        alt: 'MUTX Control Plane social preview for MUTX App',
      }),
    ])
    expect(picoMetadata.alternates?.canonical).toBe('https://pico.mutx.dev/academy')
    expect(picoMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: expect.stringContaining('https://pico.mutx.dev/opengraph-image?'),
        alt: 'PicoMUTX Academy social preview for PicoMUTX',
      }),
    ])
  })
})
