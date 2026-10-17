import type { NextConfig } from 'next'

// Only this project's public storage may be used by next/image.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname || 'eqzrngadyetamexuwrbl.supabase.co'
  } catch {
    return 'eqzrngadyetamexuwrbl.supabase.co'
  }
})()

const nextConfig: NextConfig = {
  experimental: {
    // Allow game cover uploads (max 4 MB enforced in the action) through Server Actions
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }],
  },
}

export default nextConfig
