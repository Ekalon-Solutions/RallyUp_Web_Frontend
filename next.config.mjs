/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['firebase', '@firebase/app', '@firebase/auth'],
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
            value: 'camera=(self), microphone=(), geolocation=(), accelerometer=(self "https://checkout.razorpay.com" "https://api.razorpay.com"), gyroscope=(self "https://checkout.razorpay.com" "https://api.razorpay.com"), magnetometer=(self "https://checkout.razorpay.com" "https://api.razorpay.com"), interest-cohort=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
}

export default nextConfig
