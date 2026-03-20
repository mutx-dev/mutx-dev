/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  // Use 'export' for static export or remove standalone for simpler deployment
  // output: 'standalone',
  trailingSlash: false,
  // Ensure middleware runs in Node.js runtime, not edge
  middleware: {
    runtime: 'nodejs',
  },
  webpack(config, { webpack, dev }) {
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.__NEXT_DEVTOOL_SEGMENT_EXPLORER': JSON.stringify(''),
        }),
      );
    }
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mutx.dev';
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
    };
  },
};

export default nextConfig;
