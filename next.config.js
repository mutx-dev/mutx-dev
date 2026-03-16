/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return [
      // Map /api/v1/* to /api/* for SDK/CLI compatibility
      // SDK/CLI use /v1/agents, /v1/deployments, etc.
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
      // Proxy non-v1 API calls to external backend
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
