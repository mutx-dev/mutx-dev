/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  serverExternalPackages: ['@resvg/resvg-js'],
  turbopack: {},
  webpack(config, { webpack, dev }) {
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER': JSON.stringify(''),
        })
      );
    }
    return config;
  },
  async redirects() {
    return [
      // GitBook maps docs/api/* → /docs/reference/*
      // Keep old /docs/api/* links functional as a fallback
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
    ];
  },
  async rewrites() {
    // Prefer a server-only upstream when the frontend and API share a private network.
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
    return {
      beforeFiles: [
        // Map /api/v1/* to /api/* for SDK/CLI backward compatibility
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        },
      ],
      afterFiles: [],
      fallback: [
        // Proxy unmatched API calls to external backend
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ],
    };
  },
}

module.exports = nextConfig
