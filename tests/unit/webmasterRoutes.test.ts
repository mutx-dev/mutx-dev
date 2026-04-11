import manifest from '../../app/manifest'
import robots from '../../app/robots'
import sitemap from '../../app/sitemap'
import { BLOCKED_CRAWL_PREFIXES, PUBLIC_MARKETING_ROUTES } from '../../lib/seo'

describe('webmaster route contracts', () => {
  it('robots.txt blocks all intended private prefixes and publishes sitemap host', () => {
    const result = robots()
    const firstRule = Array.isArray(result.rules) ? result.rules[0] : result.rules

    expect(firstRule).toBeDefined()
    expect(firstRule?.disallow).toEqual(expect.arrayContaining([...BLOCKED_CRAWL_PREFIXES]))
    expect(result.host).toBe('https://mutx.dev')
    expect(result.sitemap).toBe('https://mutx.dev/sitemap.xml')
  })

  it('sitemap includes public marketing routes and excludes private surfaces', () => {
    const result = sitemap()
    const urls = result.map((entry) => entry.url)

    for (const route of PUBLIC_MARKETING_ROUTES) {
      expect(urls).toContain(`https://mutx.dev${route === '/' ? '' : route}`)
    }

    expect(urls).toContain('https://mutx.dev/docs')
    expect(urls).toContain('https://mutx.dev/docs/reference')
    expect(urls).not.toContain('https://mutx.dev/dashboard')
    expect(urls).not.toContain('https://mutx.dev/control')
    expect(urls).not.toContain('https://mutx.dev/login')
  })

  it('manifest exposes stable production metadata', () => {
    const result = manifest()

    expect(result.name).toBe('MUTX')
    expect(result.theme_color).toBe('#060810')
    expect(result.background_color).toBe('#060810')
    expect(result.start_url).toBe('/')
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/android-chrome-192x192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/android-chrome-512x512.png', sizes: '512x512' }),
      ]),
    )
  })
})
