/** @type {import('next').NextConfig} */
const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || `${Date.now()}`;

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: buildId,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/version.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/dashboard/events/scanner',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
}

export default nextConfig
