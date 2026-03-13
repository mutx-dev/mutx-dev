import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy-policy'],
        disallow: ['/app', '/api/'],
      },
    ],
    sitemap: 'https://mutx.dev/sitemap.xml',
    host: 'https://mutx.dev',
  }
}
