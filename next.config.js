/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://zooming-youth-production-3eb8.up.railway.app/:path*',
      },
    ];
  },
}

module.exports = nextConfig
