import withNextIntlPlugin from 'next-intl/plugin'
import { getDocsPublicationManifest } from './lib/docs.ts'

const withNextIntl = withNextIntlPlugin('./i18n/request.ts')
const publicMarkdownFiles = Array.from(new Set([
  './SUMMARY.md',
  ...getDocsPublicationManifest().docs.map((doc) => `./${doc.sourcePath}`),
])).sort()
const socialImageFonts = ['./app/fonts/Geist-Bold.ttf', './app/fonts/Geist-Regular.ttf']

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': ['./dist/**/*'],
  },
  outputFileTracingIncludes: {
    '/docs/\\[\\[\\.\\.\\.slug\\]\\]': publicMarkdownFiles,
    '/sitemap.xml': publicMarkdownFiles,
    '/sdk': ['./docs/sdk.md'],
    '/support': ['./support.md'],
    '/opengraph-image': socialImageFonts,
    '/twitter-image': socialImageFonts,
    '/api/og-image': [
      ...socialImageFonts,
      './node_modules/harfbuzzjs/hb.wasm',
    ],
  },
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'satori'],
  turbopack: {},
  webpack(config, { webpack, dev }) {
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER': JSON.stringify(''),
        })
      )
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/docs/sdk',
        destination: '/sdk',
        permanent: true,
      },
      {
        source: '/docs/support',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/docs/api/reference',
        destination: '/docs/reference',
        permanent: true,
      },
      {
        source: '/docs/api',
        destination: '/docs/reference',
        permanent: true,
      },
      {
        source: '/docs/api/:slug*',
        destination: '/docs/reference/:slug*',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        },
      ],
      afterFiles: [],
      fallback: apiUrl
        ? [
            {
              source: '/api/:path*',
              destination: `${apiUrl}/:path*`,
            },
          ]
        : [],
    }
  },
}

export default withNextIntl(nextConfig)
