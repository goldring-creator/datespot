import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdninstagram.com' },
      { hostname: '*.cdninstagram.com' },
      { hostname: 'blogfiles.naver.net' },
    ],
  },
}
export default nextConfig
