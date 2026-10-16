import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Allow game cover uploads (max 4 MB enforced in the action) through Server Actions
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
}

export default nextConfig
