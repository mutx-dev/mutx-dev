import withNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = withNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
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
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ],
    }
  },
}

export default withNextIntl(nextConfig)
